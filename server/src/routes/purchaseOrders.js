const express = require('express');
const router = express.Router();
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const { queryAll, queryOne, runSql } = require('../db/database');
const { parseSpreadsheet } = require('../services/excelParser');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }
});

// GET /api/purchase-orders - list POs
router.get('/', (req, res) => {
  try {
    const db = req.app.locals.db;
    const { search, status } = req.query;

    let sql = `
      SELECT p.*,
             COUNT(DISTINCT pi.id) as item_count,
             COUNT(DISTINCT i.id) as related_invoice_count
      FROM purchase_orders p
      LEFT JOIN po_items pi ON p.id = pi.po_id
      LEFT JOIN invoices i ON p.po_number = i.po_number
      WHERE 1=1
    `;
    const params = [];

    if (status && status !== 'ALL') {
      sql += ' AND p.status = ?';
      params.push(status);
    }

    if (search) {
      sql += ' AND (p.po_number LIKE ? OR p.supplier LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    sql += ' GROUP BY p.id ORDER BY p.order_date DESC';
    const pos = queryAll(db, sql, params);

    res.json({ purchaseOrders: pos });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/purchase-orders/:id - single PO
router.get('/:id', (req, res) => {
  try {
    const db = req.app.locals.db;
    const po = queryOne(db, 'SELECT * FROM purchase_orders WHERE id = ?', [req.params.id]);
    if (!po) return res.status(404).json({ error: 'Purchase Order not found' });

    const items = queryAll(db, 'SELECT * FROM po_items WHERE po_id = ?', [po.id]);
    const relatedInvoices = queryAll(db, `
      SELECT i.*, r.status as recon_status
      FROM invoices i
      LEFT JOIN reconciliations r ON i.id = r.invoice_id
      WHERE i.po_number = ?
    `, [po.po_number]);

    res.json({
      ...po,
      items,
      relatedInvoices
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/purchase-orders/parse-file - preview Excel / CSV
router.post('/parse-file', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No spreadsheet file uploaded.' });
    }

    const preview = parseSpreadsheet(req.file.buffer, req.file.originalname);
    res.json(preview);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/purchase-orders/import - import rows with mapping
router.post('/import', (req, res) => {
  try {
    const db = req.app.locals.db;
    const { rows, mapping } = req.body;

    if (!rows || !Array.isArray(rows) || rows.length === 0) {
      return res.status(400).json({ error: 'No rows provided for import.' });
    }

    // Group rows by PO Number
    const poGroups = {};
    for (const row of rows) {
      const poNum = String(row[mapping.po_number] || '').trim();
      if (!poNum) continue;

      if (!poGroups[poNum]) {
        poGroups[poNum] = {
          po_number: poNum,
          supplier: String(row[mapping.supplier] || 'Imported Vendor').trim(),
          order_date: String(row[mapping.order_date] || new Date().toISOString().split('T')[0]).trim(),
          currency: 'USD',
          items: []
        };
      }

      const qty = parseFloat(row[mapping.quantity]) || 1;
      const unitPrice = parseFloat(row[mapping.unit_price]) || 0;
      const lineTotal = parseFloat(row[mapping.total_amount]) || (qty * unitPrice);

      poGroups[poNum].items.push({
        item_desc: String(row[mapping.item_desc] || 'Purchased Line Item').trim(),
        quantity: qty,
        unit_price: unitPrice,
        total_price: lineTotal
      });
    }

    let createdCount = 0;
    let updatedCount = 0;

    for (const poNum of Object.keys(poGroups)) {
      const group = poGroups[poNum];
      const subtotal = group.items.reduce((acc, it) => acc + it.total_price, 0);
      const tax = subtotal * 0.18;
      const total = subtotal + tax;

      const existingPo = queryOne(db, 'SELECT id FROM purchase_orders WHERE po_number = ?', [poNum]);
      let poId = existingPo ? existingPo.id : uuidv4();

      if (existingPo) {
        runSql(db, `
          UPDATE purchase_orders
          SET supplier = ?, order_date = ?, subtotal = ?, tax_amount = ?, total_amount = ?
          WHERE id = ?
        `, [group.supplier, group.order_date, subtotal, tax, total, poId]);
        runSql(db, 'DELETE FROM po_items WHERE po_id = ?', [poId]);
        updatedCount++;
      } else {
        runSql(db, `
          INSERT INTO purchase_orders (id, po_number, supplier, order_date, subtotal, tax_amount, shipping, total_amount, currency, status)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [poId, poNum, group.supplier, group.order_date, subtotal, tax, 50.00, total + 50.00, 'USD', 'Approved']);
        createdCount++;
      }

      for (const item of group.items) {
        runSql(db, `
          INSERT INTO po_items (id, po_id, item_desc, quantity, unit_price, total_price, tax_rate)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [uuidv4(), poId, item.item_desc, item.quantity, item.unit_price, item.total_price, 0.18]);
      }
    }

    runSql(db, `INSERT INTO activity_logs (id, user_name, user_role, action, entity_type, details) VALUES (?, ?, ?, ?, ?, ?)`, [
      uuidv4(), 'Finance User', 'Operations', 'PO_IMPORT', 'PURCHASE_ORDER',
      `Imported ${Object.keys(poGroups).length} Purchase Orders (${createdCount} created, ${updatedCount} updated).`
    ]);

    res.json({
      message: `Successfully processed ${Object.keys(poGroups).length} purchase orders.`,
      createdCount,
      updatedCount
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
