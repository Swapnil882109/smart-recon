const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { runSql, queryOne } = require('./database');

async function seedData(db) {
  // Check if already seeded
  const existingUser = queryOne(db, 'SELECT id FROM users LIMIT 1');
  if (existingUser) {
    return;
  }

  console.log('Seeding Smart Recon initial database...');

  const passwordHash = bcrypt.hashSync('Password@123', 10);

  // 1. Users
  const adminId = uuidv4();
  const reviewerId = uuidv4();
  const auditorId = uuidv4();

  runSql(db, `INSERT INTO users (id, name, email, password_hash, role, organization) VALUES (?, ?, ?, ?, ?, ?)`, [
    adminId, 'Alex Morgan', 'admin@smartrecon.io', passwordHash, 'Admin', 'Volt Enterprise Finance'
  ]);
  runSql(db, `INSERT INTO users (id, name, email, password_hash, role, organization) VALUES (?, ?, ?, ?, ?, ?)`, [
    reviewerId, 'Sarah Jenkins', 'reviewer@smartrecon.io', passwordHash, 'Finance Reviewer', 'Volt Enterprise Finance'
  ]);
  runSql(db, `INSERT INTO users (id, name, email, password_hash, role, organization) VALUES (?, ?, ?, ?, ?, ?)`, [
    auditorId, 'David Chen', 'auditor@smartrecon.io', passwordHash, 'Auditor', 'Volt Enterprise Audit'
  ]);

  // 2. Settings
  const settings = [
    ['amount_tolerance_percent', '1.0', 'Allowable amount discrepancy in percent (default: 1.0%)'],
    ['amount_tolerance_absolute', '10.00', 'Allowable amount discrepancy in currency units ($)'],
    ['quantity_tolerance_percent', '0.0', 'Allowable quantity discrepancy in percent (0 = strict match)'],
    ['date_tolerance_days', '15', 'Allowable date variance between PO date and invoice date'],
    ['strict_line_items', 'true', 'Require exact line-item description matching'],
    ['auto_match_on_upload', 'true', 'Trigger reconciliation engine immediately upon document upload'],
    ['require_approval_mismatch', 'true', 'Mandate 2-person confirmation for mismatch overrides']
  ];

  for (const [key, val, desc] of settings) {
    runSql(db, `INSERT INTO settings (key, value, description) VALUES (?, ?, ?)`, [key, val, desc]);
  }

  // 3. Purchase Orders
  const po1Id = uuidv4();
  runSql(db, `INSERT INTO purchase_orders (id, po_number, supplier, order_date, subtotal, tax_amount, shipping, total_amount, currency, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
    po1Id, 'ORD-88412', 'Volt-Tech Electricals', '2026-10-14', 2030.00, 365.40, 50.00, 2445.40, 'USD', 'Approved & Verified'
  ]);
  runSql(db, `INSERT INTO po_items (id, po_id, item_desc, quantity, unit_price, total_price, tax_rate) VALUES (?, ?, ?, ?, ?, ?, ?)`, [
    uuidv4(), po1Id, 'Industrial Heavy Stabilizer 10kVA', 2, 450.00, 900.00, 0.18
  ]);
  runSql(db, `INSERT INTO po_items (id, po_id, item_desc, quantity, unit_price, total_price, tax_rate) VALUES (?, ?, ?, ?, ?, ?, ?)`, [
    uuidv4(), po1Id, 'Commercial Ceiling Fan 56"', 10, 65.00, 650.00, 0.18
  ]);
  runSql(db, `INSERT INTO po_items (id, po_id, item_desc, quantity, unit_price, total_price, tax_rate) VALUES (?, ?, ?, ?, ?, ?, ?)`, [
    uuidv4(), po1Id, 'Modular Circuit Breaker Panel 12-Way', 4, 120.00, 480.00, 0.18
  ]);

  const po2Id = uuidv4();
  runSql(db, `INSERT INTO purchase_orders (id, po_number, supplier, order_date, subtotal, tax_amount, shipping, total_amount, currency, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
    po2Id, 'ORD-77291', 'CyberTech Logistics', '2026-10-10', 900.00, 90.00, 45.00, 1035.00, 'USD', 'Approved'
  ]);
  runSql(db, `INSERT INTO po_items (id, po_id, item_desc, quantity, unit_price, total_price, tax_rate) VALUES (?, ?, ?, ?, ?, ?, ?)`, [
    uuidv4(), po2Id, 'Rackmount Server Rail Kit 2U', 5, 180.00, 900.00, 0.10
  ]);

  const po3Id = uuidv4();
  runSql(db, `INSERT INTO purchase_orders (id, po_number, supplier, order_date, subtotal, tax_amount, shipping, total_amount, currency, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
    po3Id, 'ORD-65103', 'Apex Construction Tools', '2026-10-05', 2200.00, 264.00, 80.00, 2544.00, 'USD', 'Approved'
  ]);
  runSql(db, `INSERT INTO po_items (id, po_id, item_desc, quantity, unit_price, total_price, tax_rate) VALUES (?, ?, ?, ?, ?, ?, ?)`, [
    uuidv4(), po3Id, 'Heavy Duty Hydraulic Jack 20T', 10, 220.00, 2200.00, 0.12
  ]);

  const po4Id = uuidv4();
  runSql(db, `INSERT INTO purchase_orders (id, po_number, supplier, order_date, subtotal, tax_amount, shipping, total_amount, currency, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
    po4Id, 'ORD-91204', 'Industrial Supplies Co', '2026-09-28', 2480.00, 372.00, 60.00, 2912.00, 'USD', 'Approved'
  ]);
  runSql(db, `INSERT INTO po_items (id, po_id, item_desc, quantity, unit_price, total_price, tax_rate) VALUES (?, ?, ?, ?, ?, ?, ?)`, [
    uuidv4(), po4Id, 'Pneumatic Impact Wrench Kit', 8, 310.00, 2480.00, 0.15
  ]);

  const po5Id = uuidv4();
  runSql(db, `INSERT INTO purchase_orders (id, po_number, supplier, order_date, subtotal, tax_amount, shipping, total_amount, currency, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
    po5Id, 'ORD-55420', 'Nova Steel Solutions', '2026-10-18', 925.00, 111.00, 50.00, 1086.00, 'USD', 'Approved'
  ]);
  runSql(db, `INSERT INTO po_items (id, po_id, item_desc, quantity, unit_price, total_price, tax_rate) VALUES (?, ?, ?, ?, ?, ?, ?)`, [
    uuidv4(), po5Id, 'Galvanized Conduit Piping 2"', 50, 18.50, 925.00, 0.12
  ]);

  // 4. Invoices & Reconciliations

  // Invoice 1: Exact Match (Volt-Tech Valid Test Invoice)
  const inv1Id = uuidv4();
  runSql(db, `INSERT INTO invoices (id, invoice_number, po_number, supplier, invoice_date, due_date, subtotal, tax_amount, shipping, total_amount, currency, status, review_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
    inv1Id, 'INV-2026-9910', 'ORD-88412', 'Volt-Tech Electricals', '2026-10-14', '2026-11-13', 2030.00, 365.40, 50.00, 2445.40, 'USD', 'Reconciled', 'Reconciled & Cleared'
  ]);
  runSql(db, `INSERT INTO invoice_items (id, invoice_id, item_desc, quantity, unit_price, total_price) VALUES (?, ?, ?, ?, ?, ?)`, [
    uuidv4(), inv1Id, 'Industrial Heavy Stabilizer 10kVA', 2, 450.00, 900.00
  ]);
  runSql(db, `INSERT INTO invoice_items (id, invoice_id, item_desc, quantity, unit_price, total_price) VALUES (?, ?, ?, ?, ?, ?)`, [
    uuidv4(), inv1Id, 'Commercial Ceiling Fan 56"', 10, 65.00, 650.00
  ]);
  runSql(db, `INSERT INTO invoice_items (id, invoice_id, item_desc, quantity, unit_price, total_price) VALUES (?, ?, ?, ?, ?, ?)`, [
    uuidv4(), inv1Id, 'Modular Circuit Breaker Panel 12-Way', 4, 120.00, 480.00
  ]);

  const rec1Id = uuidv4();
  runSql(db, `INSERT INTO reconciliations (id, invoice_id, po_id, status, confidence_score, discrepancy_amount, tolerance_rules_applied, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, [
    rec1Id, inv1Id, po1Id, 'MATCHED', 100.0, 0.00, 'Standard enterprise matching: 0% tolerance deviation', '100% matched against PO ORD-88412. All quantities, unit rates, taxes and line totals are identical.'
  ]);

  // Invoice 2: Partial Match (CyberTech Logistics, slight shipping variance within $10 tolerance)
  const inv2Id = uuidv4();
  runSql(db, `INSERT INTO invoices (id, invoice_number, po_number, supplier, invoice_date, due_date, subtotal, tax_amount, shipping, total_amount, currency, status, review_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
    inv2Id, 'INV-2026-8812', 'ORD-77291', 'CyberTech Logistics', '2026-10-11', '2026-11-10', 900.00, 90.00, 52.00, 1042.00, 'USD', 'Reconciled', 'Auto-Approved Under Tolerance'
  ]);
  runSql(db, `INSERT INTO invoice_items (id, invoice_id, item_desc, quantity, unit_price, total_price) VALUES (?, ?, ?, ?, ?, ?)`, [
    uuidv4(), inv2Id, 'Rackmount Server Rail Kit 2U', 5, 180.00, 900.00
  ]);

  const rec2Id = uuidv4();
  runSql(db, `INSERT INTO reconciliations (id, invoice_id, po_id, status, confidence_score, discrepancy_amount, tolerance_rules_applied, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, [
    rec2Id, inv2Id, po2Id, 'PARTIAL_MATCH', 94.0, 7.00, 'Amount tolerance rule: ±$10.00 allowable', 'Shipping billed at $52.00 vs PO $45.00 (+$7.00 variance). Cleared under acceptable freight tolerance.'
  ]);
  runSql(db, `INSERT INTO discrepancies (id, reconciliation_id, field_name, expected_value, actual_value, variance_amount, severity, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, [
    uuidv4(), rec2Id, 'Shipping', '$45.00', '$52.00', 7.00, 'LOW', 'Freight surcharge within allowable $10.00 tolerance'
  ]);

  // Invoice 3: Quantity Mismatch (Apex Construction Tools - invoiced 12 instead of 10)
  const inv3Id = uuidv4();
  runSql(db, `INSERT INTO invoices (id, invoice_number, po_number, supplier, invoice_date, due_date, subtotal, tax_amount, shipping, total_amount, currency, status, review_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
    inv3Id, 'INV-2026-7450', 'ORD-65103', 'Apex Construction Tools', '2026-10-08', '2026-11-07', 2640.00, 316.80, 80.00, 3036.80, 'USD', 'Review Required', 'Pending Manual Review'
  ]);
  runSql(db, `INSERT INTO invoice_items (id, invoice_id, item_desc, quantity, unit_price, total_price) VALUES (?, ?, ?, ?, ?, ?)`, [
    uuidv4(), inv3Id, 'Heavy Duty Hydraulic Jack 20T', 12, 220.00, 2640.00
  ]);

  const rec3Id = uuidv4();
  runSql(db, `INSERT INTO reconciliations (id, invoice_id, po_id, status, confidence_score, discrepancy_amount, tolerance_rules_applied, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, [
    rec3Id, inv3Id, po3Id, 'MISMATCH', 68.0, 492.80, 'Quantity tolerance: 0.0% strict', 'Quantity mismatch: Invoiced Qty 12 vs PO contracted Qty 10 (+2 units / +$492.80 total).'
  ]);
  runSql(db, `INSERT INTO discrepancies (id, reconciliation_id, field_name, expected_value, actual_value, variance_amount, severity, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, [
    uuidv4(), rec3Id, 'Quantity', '10 units', '12 units', 2.00, 'HIGH', 'Overbilling of 2 units exceeding approved Purchase Order quantity.'
  ]);
  runSql(db, `INSERT INTO discrepancies (id, reconciliation_id, field_name, expected_value, actual_value, variance_amount, severity, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, [
    uuidv4(), rec3Id, 'Total Amount', '$2,544.00', '$3,036.80', 492.80, 'HIGH', 'Grand total exceeds purchase order limit by $492.80.'
  ]);

  // Invoice 4: Price Variance Mismatch (Industrial Supplies Co - billed $335/unit vs $310)
  const inv4Id = uuidv4();
  runSql(db, `INSERT INTO invoices (id, invoice_number, po_number, supplier, invoice_date, due_date, subtotal, tax_amount, shipping, total_amount, currency, status, review_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
    inv4Id, 'INV-2026-6301', 'ORD-91204', 'Industrial Supplies Co', '2026-10-02', '2026-11-01', 2680.00, 402.00, 60.00, 3142.00, 'USD', 'Review Required', 'Pending Manual Review'
  ]);
  runSql(db, `INSERT INTO invoice_items (id, invoice_id, item_desc, quantity, unit_price, total_price) VALUES (?, ?, ?, ?, ?, ?)`, [
    uuidv4(), inv4Id, 'Pneumatic Impact Wrench Kit', 8, 335.00, 2680.00
  ]);

  const rec4Id = uuidv4();
  runSql(db, `INSERT INTO reconciliations (id, invoice_id, po_id, status, confidence_score, discrepancy_amount, tolerance_rules_applied, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, [
    rec4Id, inv4Id, po4Id, 'MISMATCH', 62.0, 230.00, 'Strict line-item pricing: 0% tolerance', 'Price variance: Invoiced unit price $335.00 vs PO contracted rate $310.00 (+$25.00/unit price hike).'
  ]);
  runSql(db, `INSERT INTO discrepancies (id, reconciliation_id, field_name, expected_value, actual_value, variance_amount, severity, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, [
    uuidv4(), rec4Id, 'Unit Price', '$310.00', '$335.00', 25.00, 'CRITICAL', 'Unit price inflated by $25.00 per unit without prior price amendment.'
  ]);

  // Invoice 5: Corrupt Test QA Document (Volt-Tech Corrupt Test Spec)
  const inv5Id = uuidv4();
  runSql(db, `INSERT INTO invoices (id, invoice_number, po_number, supplier, invoice_date, due_date, subtotal, tax_amount, shipping, total_amount, currency, status, review_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
    inv5Id, 'INV-ERROR-999', 'ORPHAN-REF', 'Volt-Tech Electricals (Corrupt)', '00/00/0000', '00/00/0000', 0.00, 0.00, 0.00, 0.00, 'USD', 'Failed', 'Rejected - QA Corrupt Test'
  ]);
  const rec5Id = uuidv4();
  runSql(db, `INSERT INTO reconciliations (id, invoice_id, po_id, status, confidence_score, discrepancy_amount, tolerance_rules_applied, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, [
    rec5Id, inv5Id, null, 'CORRUPT', 10.0, 0.00, 'Sanity & QA failure parser assertions', 'FATAL QA TEST FLAG: Document contains deliberate constraint violations: missing tax calculation, broken formatting, NaN values, and invalid dates (00/00/0000).'
  ]);
  runSql(db, `INSERT INTO discrepancies (id, reconciliation_id, field_name, expected_value, actual_value, variance_amount, severity, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, [
    uuidv4(), rec5Id, 'Date Format', 'YYYY-MM-DD', '00/00/0000', 0, 'CRITICAL', 'Unparseable date 00/00/0000 violates ISO standards.'
  ]);
  runSql(db, `INSERT INTO discrepancies (id, reconciliation_id, field_name, expected_value, actual_value, variance_amount, severity, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, [
    uuidv4(), rec5Id, 'Row Math', 'Numeric', 'NaN', 0, 'CRITICAL', 'Item description row contains non-numeric unit price XYZ and total NaN.'
  ]);
  runSql(db, `INSERT INTO discrepancies (id, reconciliation_id, field_name, expected_value, actual_value, variance_amount, severity, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, [
    uuidv4(), rec5Id, 'PO Reference', 'Valid PO in Registry', 'ORPHAN REF', 0, 'CRITICAL', 'Orphan PO reference ORD-[MISSING ID] not found in database.'
  ]);

  // 5. Activity Logs
  const logEvents = [
    [adminId, 'Alex Morgan', 'Admin', 'SYSTEM_INIT', 'SYSTEM', null, 'System database initialized with enterprise reconciliation rules', '127.0.0.1'],
    [reviewerId, 'Sarah Jenkins', 'Finance Reviewer', 'PO_IMPORT', 'PURCHASE_ORDER', po1Id, 'Imported Purchase Order ORD-88412 (Volt-Tech Electricals, $2,445.40)', '192.168.1.104'],
    [reviewerId, 'Sarah Jenkins', 'Finance Reviewer', 'INVOICE_UPLOAD', 'INVOICE', inv1Id, 'Uploaded Tax Invoice INV-2026-9910. Extraction completed with 100% confidence', '192.168.1.104'],
    [adminId, 'Alex Morgan', 'Admin', 'RECONCILIATION_RUN', 'RECONCILIATION', rec1Id, 'Automated 3-way match executed: ORD-88412 vs INV-2026-9910. Result: MATCHED', '127.0.0.1'],
    [reviewerId, 'Sarah Jenkins', 'Finance Reviewer', 'INVOICE_UPLOAD', 'INVOICE', inv3Id, 'Uploaded Invoice INV-2026-7450 (Apex Construction Tools)', '192.168.1.104'],
    [adminId, 'Alex Morgan', 'Admin', 'DISCREPANCY_FLAGGED', 'RECONCILIATION', rec3Id, 'Mismatch detected: Invoiced Qty 12 exceeds PO limit 10 units. Routed to Review Queue', '127.0.0.1']
  ];

  for (const [uid, uname, urole, action, etype, eid, details, ip] of logEvents) {
    runSql(db, `INSERT INTO activity_logs (id, user_name, user_role, action, entity_type, entity_id, details, ip_address) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, [
      uuidv4(), uname, urole, action, etype, eid, details, ip
    ]);
  }

  // 6. Notifications
  const notifications = [
    ['warning', 'Overbilling Detected', 'Invoice INV-2026-7450 has a quantity variance of +2 units over PO ORD-65103.', '/review-queue', 0],
    ['danger', 'Price Hike Flagged', 'Invoice INV-2026-6301 charges $335/unit vs PO rate of $310/unit.', '/review-queue', 0],
    ['success', 'Automated Match Success', 'Invoice INV-2026-9910 successfully reconciled with PO ORD-88412 (100% match).', '/invoices', 1],
    ['info', 'Tolerance Cleared', 'Invoice INV-2026-8812 cleared under $10 freight tolerance ($7 variance).', '/reconciliation', 1]
  ];

  for (const [type, title, msg, link, read] of notifications) {
    runSql(db, `INSERT INTO notifications (id, type, title, message, link, is_read) VALUES (?, ?, ?, ?, ?, ?)`, [
      uuidv4(), type, title, msg, link, read
    ]);
  }

  console.log('Smart Recon database seeded successfully with rich enterprise test sets!');
}

module.exports = { seedData };
