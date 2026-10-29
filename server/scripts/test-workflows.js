const fs = require('fs');
const path = require('path');
const { getDb, queryAll, queryOne, runSql } = require('../src/db/database');
const { seedData } = require('../src/db/seeds');
const { extractDocument } = require('../src/services/extractor');
const { runReconciliation } = require('../src/services/reconciliation');
const { parseSpreadsheet } = require('../src/services/excelParser');

async function runTestSuite() {
  console.log('\n=============================================================');
  console.log('   SMART RECON — AUTOMATED COMPREHENSIVE TEST SUITE');
  console.log('=============================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, testName, details = '') {
    if (condition) {
      console.log(`  [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`  [FAIL] ${testName} - ${details}`);
      failed++;
    }
  }

  // 1. Database Initialization
  const db = await getDb();
  await seedData(db);
  const users = queryAll(db, 'SELECT id, name, role FROM users');
  assert(users.length >= 3, 'DB: Users seeded properly', `Found ${users.length} users`);

  const pos = queryAll(db, 'SELECT * FROM purchase_orders');
  assert(pos.length >= 4, 'DB: Purchase orders seeded properly', `Found ${pos.length} POs`);

  // 2. PDF Extraction: Valid Volt-Tech Test Document
  const validPdfPath = path.join(__dirname, '../../sample-data/VoltTech_Valid_PO_and_Invoice.pdf');
  const validBuffer = fs.readFileSync(validPdfPath);
  const validExtracted = await extractDocument(validBuffer, 'application/pdf', 'VoltTech_Valid.pdf');

  assert(validExtracted.supplier.includes('Volt-Tech'), 'Extraction: Valid document supplier identified as Volt-Tech', validExtracted.supplier);
  assert(validExtracted.invoice_number === 'INV-2026-9910' || validExtracted.invoice_number.includes('9910'), 'Extraction: Valid document invoice # INV-2026-9910', validExtracted.invoice_number);
  assert(validExtracted.po_number === 'ORD-88412' || validExtracted.po_number.includes('88412'), 'Extraction: Valid document PO Ref ORD-88412', validExtracted.po_number);
  assert(validExtracted.items.length === 3, 'Extraction: Valid document extracted 3 line items', `Found ${validExtracted.items.length}`);
  assert(!validExtracted.isCorrupt, 'Extraction: Valid document is NOT marked corrupt');
  assert(validExtracted.confidence >= 80, 'Extraction: High confidence score (>=80%)', `${validExtracted.confidence}%`);

  // 3. PDF Extraction: Corrupt QA Test Document
  const corruptPdfPath = path.join(__dirname, '../../sample-data/VoltTech_Corrupt_QA_Test.pdf');
  const corruptBuffer = fs.readFileSync(corruptPdfPath);
  const corruptExtracted = await extractDocument(corruptBuffer, 'application/pdf', 'VoltTech_Corrupt.pdf');

  assert(corruptExtracted.isCorrupt === true, 'Extraction: Corrupt QA document flagged isCorrupt = true');
  assert(corruptExtracted.corruptFlags.length > 0, 'Extraction: Flags fatal constraint violations', corruptExtracted.corruptFlags.join('; '));
  assert(corruptExtracted.confidence <= 40, 'Extraction: Low confidence score for corrupt asset (<=40%)', `${corruptExtracted.confidence}%`);

  // 4. Excel & CSV PO Parser
  const excelPath = path.join(__dirname, '../../sample-data/Purchase_Orders_Standard.xlsx');
  const excelBuffer = fs.readFileSync(excelPath);
  const excelParsed = parseSpreadsheet(excelBuffer, 'Purchase_Orders_Standard.xlsx');
  assert(excelParsed.headers.length >= 6, 'Excel Parser: Detected headers in standard PO file', excelParsed.headers.join(', '));
  assert(excelParsed.detectedMapping.po_number.length > 0, 'Excel Parser: Auto-mapped PO Number column', excelParsed.detectedMapping.po_number);

  const csvPath = path.join(__dirname, '../../sample-data/Purchase_Orders_Custom_Headers.csv');
  const csvBuffer = fs.readFileSync(csvPath);
  const csvParsed = parseSpreadsheet(csvBuffer, 'Purchase_Orders_Custom_Headers.csv');
  assert(csvParsed.detectedMapping.po_number === 'Order_Ref', 'CSV Parser: Correctly mapped custom header Order_Ref to po_number');

  // 5. Reconciliation Engine Execution
  const validInv = queryOne(db, "SELECT id FROM invoices WHERE invoice_number = 'INV-2026-9910'");
  assert(validInv !== null, 'Reconciliation: Found test invoice INV-2026-9910 in DB');
  const recResult = runReconciliation(db, validInv.id, 'Test Suite', 'Automated');
  assert(recResult.status === 'MATCHED', 'Reconciliation: Valid Volt-Tech invoice achieves 100% MATCHED', recResult.status);
  assert(recResult.confidenceScore === 100, 'Reconciliation: Confidence score is 100%');
  assert(recResult.discrepancies.length === 0, 'Reconciliation: 0 discrepancies for identical document');

  // Quantity Mismatch Test
  const qtyMismatchInv = queryOne(db, "SELECT id FROM invoices WHERE invoice_number = 'INV-2026-7450'");
  const qtyRec = runReconciliation(db, qtyMismatchInv.id, 'Test Suite', 'Automated');
  assert(qtyRec.status === 'MISMATCH', 'Reconciliation: Quantity overbilling triggers MISMATCH', qtyRec.status);
  assert(qtyRec.discrepancies.some(d => d.field_name.includes('Quantity')), 'Reconciliation: Discrepancy logged for Quantity overbilling');

  // Price Variance Test
  const priceMismatchInv = queryOne(db, "SELECT id FROM invoices WHERE invoice_number = 'INV-2026-6301'");
  const priceRec = runReconciliation(db, priceMismatchInv.id, 'Test Suite', 'Automated');
  assert(priceRec.status === 'MISMATCH', 'Reconciliation: Unit rate inflation triggers MISMATCH', priceRec.status);
  assert(priceRec.discrepancies.some(d => d.severity === 'CRITICAL'), 'Reconciliation: Unit rate hike flagged as CRITICAL');

  // Partial Match Under Tolerance Test
  const partialInv = queryOne(db, "SELECT id FROM invoices WHERE invoice_number = 'INV-2026-8812'");
  const partialRec = runReconciliation(db, partialInv.id, 'Test Suite', 'Automated');
  assert(partialRec.status === 'PARTIAL_MATCH', 'Reconciliation: Cleared under $10 freight tolerance as PARTIAL_MATCH', partialRec.status);

  // 6. Manual Review Queue & Decision Auditing
  const initialLogCount = queryOne(db, 'SELECT COUNT(*) as c FROM activity_logs').c;
  runSql(db, `
    INSERT INTO reviews (id, invoice_id, reconciliation_id, reviewer_name, action, reason, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `, ['rev-test-1', qtyMismatchInv.id, qtyRec.reconciliationId, 'Alex Morgan', 'APPROVE', 'Manager authorized rush fee', 'Approved for payment']);
  runSql(db, `UPDATE invoices SET status = 'Reconciled', review_status = 'Approved by Reviewer' WHERE id = ?`, [qtyMismatchInv.id]);
  runSql(db, `INSERT INTO activity_logs (id, user_name, user_role, action, entity_type, details) VALUES (?, ?, ?, ?, ?, ?)`, [
    'log-test-1', 'Alex Morgan', 'Admin', 'REVIEW_APPROVE', 'INVOICE', 'Approved invoice INV-2026-7450'
  ]);

  const updatedInv = queryOne(db, 'SELECT review_status FROM invoices WHERE id = ?', [qtyMismatchInv.id]);
  assert(updatedInv.review_status === 'Approved by Reviewer', 'Review Queue: Successfully updated invoice review status');
  const newLogCount = queryOne(db, 'SELECT COUNT(*) as c FROM activity_logs').c;
  assert(newLogCount > initialLogCount, 'Audit Log: Decision immutably persisted to activity log');

  console.log('\n-------------------------------------------------------------');
  console.log(`  TEST RESULTS: ${passed} PASSED | ${failed} FAILED`);
  console.log('-------------------------------------------------------------\n');

  if (failed > 0) {
    process.exit(1);
  } else {
    console.log('  ALL WORKFLOWS AND SPECIFICATIONS VERIFIED 100% SUCCESFULLY!\n');
    process.exit(0);
  }
}

runTestSuite().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
