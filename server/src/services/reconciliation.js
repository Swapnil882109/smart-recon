const { v4: uuidv4 } = require('uuid');
const { queryOne, queryAll, runSql } = require('../db/database');

function runReconciliation(db, invoiceId, actorName = 'System Engine', actorRole = 'Automated Agent') {
  const invoice = queryOne(db, 'SELECT * FROM invoices WHERE id = ?', [invoiceId]);
  if (!invoice) {
    throw new Error(`Invoice with ID ${invoiceId} not found.`);
  }

  const invoiceItems = queryAll(db, 'SELECT * FROM invoice_items WHERE invoice_id = ?', [invoiceId]);

  // Load configuration tolerances
  const settingsRows = queryAll(db, 'SELECT key, value FROM settings');
  const settings = {};
  settingsRows.forEach(r => { settings[r.key] = r.value; });

  const amountTolPct = parseFloat(settings['amount_tolerance_percent'] || '1.0');
  const amountTolAbs = parseFloat(settings['amount_tolerance_absolute'] || '10.00');
  const qtyTolPct = parseFloat(settings['quantity_tolerance_percent'] || '0.0');
  const dateTolDays = parseInt(settings['date_tolerance_days'] || '15', 10);
  const strictItems = settings['strict_line_items'] === 'true';

  const discrepancies = [];
  let status = 'MATCHED';
  let confidenceScore = 100.0;
  let notes = '';

  // 1. Check if invoice is corrupt or flagged during extraction
  let extractedMeta = {};
  try {
    if (invoice.extracted_raw) extractedMeta = JSON.parse(invoice.extracted_raw);
  } catch (e) {}

  if (extractedMeta.isCorrupt || invoice.invoice_date === '0000-00-00' || invoice.total_amount < 0) {
    status = 'CORRUPT';
    confidenceScore = 15.0;
    notes = 'Document failed integrity checks: corrupt structures, unparseable dates, or invalid arithmetic.';

    if (extractedMeta.corruptFlags && extractedMeta.corruptFlags.length > 0) {
      extractedMeta.corruptFlags.forEach(flag => {
        discrepancies.push({
          field_name: 'Integrity Check',
          expected_value: 'Valid document format',
          actual_value: flag,
          variance_amount: 0,
          severity: 'CRITICAL',
          description: flag
        });
      });
    }

    return saveReconciliationResult(db, invoice, null, status, confidenceScore, 0, 'QA Sanity assertions applied', notes, discrepancies, actorName, actorRole);
  }

  // 2. PO Lookup
  let po = null;
  if (invoice.po_number && invoice.po_number !== 'ORPHAN-REF') {
    po = queryOne(db, 'SELECT * FROM purchase_orders WHERE po_number = ?', [invoice.po_number]);
    if (!po) {
      // Fuzzy match or search by supplier
      po = queryOne(db, 'SELECT * FROM purchase_orders WHERE supplier LIKE ? LIMIT 1', [`%${invoice.supplier}%`]);
    }
  }

  if (!po) {
    status = 'MISMATCH';
    confidenceScore = 30.0;
    notes = `No matching Purchase Order found in enterprise registry for PO Ref: ${invoice.po_number || 'N/A'}.`;
    discrepancies.push({
      field_name: 'Purchase Order Reference',
      expected_value: 'Active registered PO',
      actual_value: invoice.po_number || 'Missing PO',
      variance_amount: invoice.total_amount,
      severity: 'CRITICAL',
      description: `Invoice references unregistered or orphan PO number "${invoice.po_number || 'NONE'}".`
    });

    return saveReconciliationResult(db, invoice, null, status, confidenceScore, invoice.total_amount, 'PO Existence Validation', notes, discrepancies, actorName, actorRole);
  }

  // PO found: Fetch PO line items
  const poItems = queryAll(db, 'SELECT * FROM po_items WHERE po_id = ?', [po.id]);

  // 3. Supplier Verification
  const normInvSupp = invoice.supplier.toLowerCase().replace(/[^a-z0-9]/g, '');
  const normPoSupp = po.supplier.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (!normInvSupp.includes(normPoSupp) && !normPoSupp.includes(normInvSupp)) {
    discrepancies.push({
      field_name: 'Supplier Identity',
      expected_value: po.supplier,
      actual_value: invoice.supplier,
      variance_amount: 0,
      severity: 'CRITICAL',
      description: `Supplier name mismatch: Invoiced by "${invoice.supplier}" but PO belongs to "${po.supplier}".`
    });
  }

  // 4. Line Items Reconciliation
  let lineItemsMatched = 0;
  let totalLineVariance = 0;

  for (const invItem of invoiceItems) {
    // Find matching item in PO items
    let matchedPoItem = null;
    for (const pItem of poItems) {
      const invDesc = invItem.item_desc.toLowerCase();
      const poDesc = pItem.item_desc.toLowerCase();
      if (invDesc.includes(poDesc) || poDesc.includes(invDesc) || (invDesc.slice(0, 12) === poDesc.slice(0, 12))) {
        matchedPoItem = pItem;
        break;
      }
    }

    if (!matchedPoItem) {
      discrepancies.push({
        field_name: 'Line Item',
        expected_value: 'Line item authorized on PO',
        actual_value: invItem.item_desc,
        variance_amount: invItem.total_price,
        severity: 'HIGH',
        description: `Uncontracted item "${invItem.item_desc}" ($${invItem.total_price.toFixed(2)}) not present in PO ORD-${po.po_number}.`
      });
      continue;
    }

    lineItemsMatched++;

    // Unit Price Check
    const unitPriceDiff = invItem.unit_price - matchedPoItem.unit_price;
    if (Math.abs(unitPriceDiff) > 0.01) {
      const severity = unitPriceDiff > 0 ? 'CRITICAL' : 'LOW';
      discrepancies.push({
        field_name: `${invItem.item_desc} - Unit Price`,
        expected_value: `$${matchedPoItem.unit_price.toFixed(2)}`,
        actual_value: `$${invItem.unit_price.toFixed(2)}`,
        variance_amount: Math.abs(unitPriceDiff) * invItem.quantity,
        severity,
        description: unitPriceDiff > 0
          ? `Unit price inflated by $${unitPriceDiff.toFixed(2)} per unit above PO contracted rate.`
          : `Unit discount of $${Math.abs(unitPriceDiff).toFixed(2)} applied below PO rate.`
      });
      totalLineVariance += Math.abs(unitPriceDiff) * invItem.quantity;
    }

    // Quantity Check
    const qtyDiff = invItem.quantity - matchedPoItem.quantity;
    if (Math.abs(qtyDiff) > 0.001) {
      const severity = qtyDiff > 0 ? 'HIGH' : 'MEDIUM';
      discrepancies.push({
        field_name: `${invItem.item_desc} - Quantity`,
        expected_value: `${matchedPoItem.quantity} units`,
        actual_value: `${invItem.quantity} units`,
        variance_amount: Math.abs(qtyDiff) * matchedPoItem.unit_price,
        severity,
        description: qtyDiff > 0
          ? `Quantity overbilled: Invoiced ${invItem.quantity} units vs PO limit ${matchedPoItem.quantity} units.`
          : `Partial shipment: Invoiced ${invItem.quantity} units of ${matchedPoItem.quantity} contracted units.`
      });
      totalLineVariance += Math.abs(qtyDiff) * matchedPoItem.unit_price;
    }
  }

  // 5. Total Variance & Tolerance Evaluation
  const amountDiff = invoice.total_amount - po.total_amount;
  const absAmountDiff = Math.abs(amountDiff);
  const pctAmountDiff = (absAmountDiff / (po.total_amount || 1)) * 100;

  // Check Date Tolerance
  if (invoice.invoice_date && po.order_date) {
    const invDate = new Date(invoice.invoice_date);
    const poDate = new Date(po.order_date);
    const diffDays = Math.round((invDate - poDate) / (1000 * 60 * 60 * 24));
    if (diffDays < -1) {
      discrepancies.push({
        field_name: 'Invoice Date Timing',
        expected_value: `On or after ${po.order_date}`,
        actual_value: invoice.invoice_date,
        variance_amount: 0,
        severity: 'MEDIUM',
        description: `Invoice date pre-dates Purchase Order issue date by ${Math.abs(diffDays)} days.`
      });
    } else if (diffDays > dateTolDays) {
      discrepancies.push({
        field_name: 'Date Expiration',
        expected_value: `Within ${dateTolDays} days of PO`,
        actual_value: `${diffDays} days elapsed`,
        variance_amount: 0,
        severity: 'LOW',
        description: `Invoice submitted ${diffDays} days after PO date (tolerance threshold is ${dateTolDays} days).`
      });
    }
  }

  // 6. Final Status Determination
  const hasCritical = discrepancies.some(d => d.severity === 'CRITICAL');
  const hasHigh = discrepancies.some(d => d.severity === 'HIGH');

  if (hasCritical) {
    status = 'MISMATCH';
    confidenceScore = Math.max(20, 60 - discrepancies.length * 10);
    notes = `Critical discrepancy detected: Unit price overbilling or unverified supplier. Requires manual finance review.`;
  } else if (hasHigh) {
    status = 'MISMATCH';
    confidenceScore = Math.max(30, 70 - discrepancies.length * 8);
    notes = `High-severity variance detected: Quantity overbilling or missing items exceed allowable threshold.`;
  } else if (absAmountDiff > 0.01) {
    // Check if within configured tolerances
    const isWithinTol = absAmountDiff <= amountTolAbs || pctAmountDiff <= amountTolPct;
    if (isWithinTol) {
      status = 'PARTIAL_MATCH';
      confidenceScore = 93.0;
      notes = `Within acceptable tolerance: Discrepancy of $${absAmountDiff.toFixed(2)} (${pctAmountDiff.toFixed(2)}%) cleared under allowable threshold of ±$${amountTolAbs.toFixed(2)} or ±${amountTolPct}%.`;
    } else {
      status = 'REVIEW_REQUIRED';
      confidenceScore = 78.0;
      notes = `Variance of $${absAmountDiff.toFixed(2)} exceeds automated tolerance limits. Human approval required.`;
    }
  } else if (discrepancies.length === 0) {
    status = 'MATCHED';
    confidenceScore = 100.0;
    notes = `100% matched against PO ORD-${po.po_number}. All header values, line item rates, and quantities align completely.`;
  } else {
    status = 'PARTIAL_MATCH';
    confidenceScore = 90.0;
    notes = `All major checks passed with minor non-critical warnings.`;
  }

  const rulesApplied = `Amount Tol: ±$${amountTolAbs.toFixed(2)} / ±${amountTolPct}%, Qty Tol: ${qtyTolPct}%, Date Tol: ${dateTolDays}d`;

  return saveReconciliationResult(db, invoice, po, status, confidenceScore, absAmountDiff, rulesApplied, notes, discrepancies, actorName, actorRole);
}

function saveReconciliationResult(db, invoice, po, status, confidenceScore, discrepancyAmount, rulesApplied, notes, discrepancies, actorName, actorRole) {
  // Check if a prior reconciliation exists for this invoice
  const existingRec = queryOne(db, 'SELECT id FROM reconciliations WHERE invoice_id = ?', [invoice.id]);
  const recId = existingRec ? existingRec.id : uuidv4();

  if (existingRec) {
    // Delete old discrepancies to update
    runSql(db, 'DELETE FROM discrepancies WHERE reconciliation_id = ?', [recId]);
    runSql(db, `UPDATE reconciliations SET po_id = ?, status = ?, confidence_score = ?, discrepancy_amount = ?, tolerance_rules_applied = ?, notes = ?, reconciliation_date = CURRENT_TIMESTAMP WHERE id = ?`, [
      po ? po.id : null, status, confidenceScore, discrepancyAmount, rulesApplied, notes, recId
    ]);
  } else {
    runSql(db, `INSERT INTO reconciliations (id, invoice_id, po_id, status, confidence_score, discrepancy_amount, tolerance_rules_applied, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, [
      recId, invoice.id, po ? po.id : null, status, confidenceScore, discrepancyAmount, rulesApplied, notes
    ]);
  }

  // Save discrepancies
  for (const disc of discrepancies) {
    runSql(db, `INSERT INTO discrepancies (id, reconciliation_id, field_name, expected_value, actual_value, variance_amount, severity, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, [
      uuidv4(), recId, disc.field_name, String(disc.expected_value), String(disc.actual_value), disc.variance_amount || 0, disc.severity, disc.description
    ]);
  }

  // Update Invoice record status
  let invoiceStatus = 'Reconciled';
  let reviewStatus = 'Reconciled & Cleared';

  if (status === 'CORRUPT') {
    invoiceStatus = 'Failed';
    reviewStatus = 'Corrupt / QA Failure';
  } else if (status === 'MISMATCH') {
    invoiceStatus = 'Review Required';
    reviewStatus = 'Pending Manual Review';
  } else if (status === 'REVIEW_REQUIRED') {
    invoiceStatus = 'Review Required';
    reviewStatus = 'Pending Finance Sign-off';
  } else if (status === 'PARTIAL_MATCH') {
    invoiceStatus = 'Reconciled';
    reviewStatus = 'Auto-Approved Under Tolerance';
  }

  runSql(db, `UPDATE invoices SET status = ?, review_status = ? WHERE id = ?`, [invoiceStatus, reviewStatus, invoice.id]);

  // Log activity
  runSql(db, `INSERT INTO activity_logs (id, user_name, user_role, action, entity_type, entity_id, details) VALUES (?, ?, ?, ?, ?, ?, ?)`, [
    uuidv4(), actorName, actorRole, 'RECONCILIATION_RUN', 'INVOICE', invoice.id, `Reconciliation executed for ${invoice.invoice_number}. Result: ${status} (Confidence: ${confidenceScore}%)`
  ]);

  // Create notification if review needed or high variance
  if (status === 'MISMATCH' || status === 'CORRUPT' || status === 'REVIEW_REQUIRED') {
    runSql(db, `INSERT INTO notifications (id, type, title, message, link) VALUES (?, ?, ?, ?, ?)`, [
      uuidv4(),
      status === 'CORRUPT' ? 'danger' : 'warning',
      `Reconciliation ${status}: ${invoice.invoice_number}`,
      `Invoice ${invoice.invoice_number} from ${invoice.supplier} flagged with ${discrepancies.length} discrepancy item(s).`,
      `/review-queue`
    ]);
  }

  return {
    reconciliationId: recId,
    invoiceId: invoice.id,
    poId: po ? po.id : null,
    status,
    confidenceScore,
    discrepancyAmount,
    toleranceRulesApplied: rulesApplied,
    notes,
    discrepancies
  };
}

module.exports = {
  runReconciliation
};
