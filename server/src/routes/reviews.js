const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { queryAll, queryOne, runSql } = require('../db/database');
const { runReconciliation } = require('../services/reconciliation');

// GET /api/reviews - list pending exceptions in the review queue
router.get('/', (req, res) => {
  try {
    const db = req.app.locals.db;
    const { severity, supplier } = req.query;

    let sql = `
      SELECT i.id as invoice_id,
             i.invoice_number,
             i.supplier,
             i.invoice_date,
             i.total_amount,
             i.po_number,
             i.review_status,
             r.id as reconciliation_id,
             r.status as recon_status,
             r.confidence_score,
             r.discrepancy_amount,
             r.notes as recon_notes,
             r.reconciliation_date,
             COUNT(d.id) as discrepancy_count,
             MAX(CASE WHEN d.severity = 'CRITICAL' THEN 4
                      WHEN d.severity = 'HIGH' THEN 3
                      WHEN d.severity = 'MEDIUM' THEN 2
                      ELSE 1 END) as max_severity_level
      FROM invoices i
      JOIN reconciliations r ON i.id = r.invoice_id
      LEFT JOIN discrepancies d ON r.id = d.reconciliation_id
      WHERE r.status IN ('MISMATCH', 'REVIEW_REQUIRED', 'CORRUPT')
    `;
    const params = [];

    if (supplier) {
      sql += ' AND i.supplier LIKE ?';
      params.push(`%${supplier}%`);
    }

    sql += ' GROUP BY i.id ORDER BY max_severity_level DESC, i.created_at DESC';

    const queueItems = queryAll(db, sql, params);

    // Attach discrepancies summary to each item
    for (const item of queueItems) {
      if (item.reconciliation_id) {
        item.discrepancies = queryAll(db, 'SELECT * FROM discrepancies WHERE reconciliation_id = ? ORDER BY severity DESC', [item.reconciliation_id]);
      } else {
        item.discrepancies = [];
      }
    }

    res.json({ queue: queueItems });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/reviews/decision - execute manual decision
router.post('/decision', (req, res) => {
  try {
    const db = req.app.locals.db;
    const { invoiceId, reconciliationId, action, reviewerName = 'Alex Morgan', reason, notes } = req.body;

    if (!invoiceId || !action) {
      return res.status(400).json({ error: 'invoiceId and action are required' });
    }

    const invoice = queryOne(db, 'SELECT * FROM invoices WHERE id = ?', [invoiceId]);
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });

    let newInvoiceStatus = 'Reconciled';
    let newReviewStatus = 'Approved by Reviewer';
    let newReconStatus = 'MATCHED';

    if (action === 'APPROVE') {
      newInvoiceStatus = 'Reconciled';
      newReviewStatus = `Manual Override Approved: ${reason || 'Approved'}`;
      newReconStatus = 'MATCHED';
    } else if (action === 'REJECT') {
      newInvoiceStatus = 'Rejected';
      newReviewStatus = `Rejected: ${reason || 'Unapproved Overbilling'}`;
      newReconStatus = 'MISMATCH';
    } else if (action === 'RETURN') {
      newInvoiceStatus = 'Returned';
      newReviewStatus = `Returned to Vendor: ${reason || 'Correction Required'}`;
      newReconStatus = 'REVIEW_REQUIRED';
    } else if (action === 'RE_RUN') {
      const recon = runReconciliation(db, invoiceId, reviewerName, 'Reviewer');
      return res.json({ message: 'Reconciliation re-executed', reconciliation: recon });
    }

    // Update invoice & recon
    runSql(db, 'UPDATE invoices SET status = ?, review_status = ?, reviewer_notes = ? WHERE id = ?', [
      newInvoiceStatus, newReviewStatus, notes || reason, invoiceId
    ]);

    if (reconciliationId) {
      runSql(db, 'UPDATE reconciliations SET status = ?, notes = ? WHERE id = ?', [
        newReconStatus, `Manual Review Decision: ${action} by ${reviewerName}. Notes: ${notes || reason}`, reconciliationId
      ]);
    }

    // Record formal review audit entry
    const reviewId = uuidv4();
    runSql(db, `
      INSERT INTO reviews (id, invoice_id, reconciliation_id, reviewer_name, action, reason, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      reviewId, invoiceId, reconciliationId, reviewerName, action, reason || 'Manual review completed', notes || ''
    ]);

    // Record activity log
    runSql(db, `INSERT INTO activity_logs (id, user_name, user_role, action, entity_type, entity_id, details) VALUES (?, ?, ?, ?, ?, ?, ?)`, [
      uuidv4(), reviewerName, 'Finance Reviewer', `REVIEW_${action}`, 'INVOICE', invoiceId,
      `Action ${action} taken on ${invoice.invoice_number} (${invoice.supplier}). Reason: ${reason}`
    ]);

    // Send notification
    runSql(db, `INSERT INTO notifications (id, type, title, message, link) VALUES (?, ?, ?, ?, ?)`, [
      uuidv4(), action === 'APPROVE' ? 'success' : 'info',
      `Review Decision: ${action}`,
      `Invoice ${invoice.invoice_number} has been ${action.toLowerCase()}ed by ${reviewerName}.`,
      `/invoices`
    ]);

    res.json({
      message: `Review decision "${action}" recorded successfully.`,
      reviewId,
      newStatus: newInvoiceStatus
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
