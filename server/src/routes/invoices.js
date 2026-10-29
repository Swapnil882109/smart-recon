const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { queryAll, queryOne, runSql } = require('../db/database');
const { extractDocument } = require('../services/extractor');
const { runReconciliation } = require('../services/reconciliation');
const { authenticateToken } = require('./auth');

// Multer storage for uploaded invoice files
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `invoice_${Date.now()}_${uuidv4().slice(0, 8)}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB limit
  fileFilter: (req, file, cb) => {
    const allowed = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file format. Only PDF, PNG, and JPG files are supported.'));
    }
  }
});

// GET /api/invoices - list invoices
router.get('/', (req, res) => {
  try {
    const db = req.app.locals.db;
    const { status, search, limit = 50, offset = 0 } = req.query;

    let sql = `
      SELECT i.*, 
             r.status as recon_status,
             r.confidence_score,
             r.discrepancy_amount
      FROM invoices i
      LEFT JOIN reconciliations r ON i.id = r.invoice_id
      WHERE 1=1
    `;
    const params = [];

    if (status && status !== 'ALL') {
      sql += ' AND (i.status = ? OR r.status = ?)';
      params.push(status, status);
    }

    if (search) {
      sql += ' AND (i.invoice_number LIKE ? OR i.supplier LIKE ? OR i.po_number LIKE ?)';
      const s = `%${search}%`;
      params.push(s, s, s);
    }

    sql += ' ORDER BY i.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit, 10), parseInt(offset, 10));

    const invoices = queryAll(db, sql, params);
    const countRow = queryOne(db, 'SELECT COUNT(*) as total FROM invoices');

    res.json({
      invoices,
      total: countRow ? countRow.total : invoices.length
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/invoices/:id - single invoice details
router.get('/:id', (req, res) => {
  try {
    const db = req.app.locals.db;
    const invoice = queryOne(db, `
      SELECT i.*, 
             r.id as recon_id,
             r.status as recon_status,
             r.confidence_score,
             r.discrepancy_amount,
             r.tolerance_rules_applied,
             r.notes as recon_notes,
             r.reconciliation_date,
             p.id as po_db_id,
             p.order_date as po_date,
             p.total_amount as po_total
      FROM invoices i
      LEFT JOIN reconciliations r ON i.id = r.invoice_id
      LEFT JOIN purchase_orders p ON r.po_id = p.id OR i.po_number = p.po_number
      WHERE i.id = ?
    `, [req.params.id]);

    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });

    const items = queryAll(db, 'SELECT * FROM invoice_items WHERE invoice_id = ?', [invoice.id]);
    const discrepancies = invoice.recon_id
      ? queryAll(db, 'SELECT * FROM discrepancies WHERE reconciliation_id = ?', [invoice.recon_id])
      : [];
    const reviews = queryAll(db, 'SELECT * FROM reviews WHERE invoice_id = ? ORDER BY created_at DESC', [invoice.id]);

    res.json({
      ...invoice,
      items,
      discrepancies,
      reviews
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/invoices/upload - upload file and extract
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No invoice file uploaded.' });
    }

    const db = req.app.locals.db;
    const fileBuffer = fs.readFileSync(req.file.path);
    const originalName = req.file.originalname;
    const mimeType = req.file.mimetype;

    // Run real document extraction engine
    const extracted = await extractDocument(fileBuffer, mimeType, originalName);

    // Save extracted invoice to database
    const invoiceId = uuidv4();
    const documentUrl = `/uploads/${req.file.filename}`;

    runSql(db, `
      INSERT INTO invoices (
        id, invoice_number, po_number, supplier, invoice_date, due_date,
        subtotal, tax_amount, shipping, total_amount, currency,
        status, extracted_raw, document_url, file_type, review_status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      invoiceId,
      extracted.invoice_number,
      extracted.po_number,
      extracted.supplier,
      extracted.invoice_date,
      extracted.due_date,
      extracted.subtotal,
      extracted.tax_amount,
      extracted.shipping,
      extracted.total_amount,
      extracted.currency || 'USD',
      'Uploaded',
      JSON.stringify(extracted),
      documentUrl,
      mimeType,
      'Pending Review'
    ]);

    // Save line items
    if (extracted.items && extracted.items.length > 0) {
      for (const item of extracted.items) {
        runSql(db, `
          INSERT INTO invoice_items (id, invoice_id, item_desc, quantity, unit_price, total_price)
          VALUES (?, ?, ?, ?, ?, ?)
        `, [
          uuidv4(),
          invoiceId,
          item.item_desc,
          item.quantity,
          item.unit_price,
          item.total_price
        ]);
      }
    }

    // Check if auto-reconciliation is active
    const autoMatchSetting = queryOne(db, "SELECT value FROM settings WHERE key = 'auto_match_on_upload'");
    let reconResult = null;
    if (!autoMatchSetting || autoMatchSetting.value === 'true') {
      reconResult = runReconciliation(db, invoiceId, 'Upload Processing Agent', 'System');
    }

    // Log upload event
    runSql(db, `INSERT INTO activity_logs (id, user_name, user_role, action, entity_type, entity_id, details) VALUES (?, ?, ?, ?, ?, ?, ?)`, [
      uuidv4(), 'Finance User', 'Operations', 'INVOICE_UPLOAD', 'INVOICE', invoiceId,
      `Uploaded ${originalName}. Extracted Invoice ${extracted.invoice_number} from ${extracted.supplier} ($${extracted.total_amount})`
    ]);

    res.status(201).json({
      message: 'Invoice uploaded and processed successfully',
      invoiceId,
      extracted,
      reconciliation: reconResult
    });
  } catch (err) {
    console.error('Upload processing error:', err);
    res.status(500).json({ error: err.message || 'Error processing uploaded file' });
  }
});

// POST /api/invoices/:id/correct - user manual field correction
router.post('/:id/correct', (req, res) => {
  try {
    const db = req.app.locals.db;
    const { id } = req.params;
    const { invoice_number, po_number, supplier, invoice_date, subtotal, tax_amount, shipping, total_amount, items } = req.body;

    const existing = queryOne(db, 'SELECT id FROM invoices WHERE id = ?', [id]);
    if (!existing) return res.status(404).json({ error: 'Invoice not found' });

    runSql(db, `
      UPDATE invoices
      SET invoice_number = ?, po_number = ?, supplier = ?, invoice_date = ?,
          subtotal = ?, tax_amount = ?, shipping = ?, total_amount = ?
      WHERE id = ?
    `, [
      invoice_number, po_number, supplier, invoice_date,
      parseFloat(subtotal) || 0, parseFloat(tax_amount) || 0, parseFloat(shipping) || 0, parseFloat(total_amount) || 0,
      id
    ]);

    // Replace items if provided
    if (items && Array.isArray(items)) {
      runSql(db, 'DELETE FROM invoice_items WHERE invoice_id = ?', [id]);
      for (const item of items) {
        runSql(db, `
          INSERT INTO invoice_items (id, invoice_id, item_desc, quantity, unit_price, total_price)
          VALUES (?, ?, ?, ?, ?, ?)
        `, [
          uuidv4(), id, item.item_desc, parseFloat(item.quantity) || 0, parseFloat(item.unit_price) || 0, parseFloat(item.total_price) || 0
        ]);
      }
    }

    // Re-run reconciliation with corrected inputs
    const reconResult = runReconciliation(db, id, 'Reviewer', 'Manual Correction');

    res.json({
      message: 'Invoice fields updated and re-reconciled',
      reconciliation: reconResult
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/invoices/:id - delete record
router.delete('/:id', (req, res) => {
  try {
    const db = req.app.locals.db;
    const { id } = req.params;
    runSql(db, 'DELETE FROM discrepancies WHERE reconciliation_id IN (SELECT id FROM reconciliations WHERE invoice_id = ?)', [id]);
    runSql(db, 'DELETE FROM reconciliations WHERE invoice_id = ?', [id]);
    runSql(db, 'DELETE FROM invoice_items WHERE invoice_id = ?', [id]);
    runSql(db, 'DELETE FROM reviews WHERE invoice_id = ?', [id]);
    runSql(db, 'DELETE FROM invoices WHERE id = ?', [id]);

    res.json({ message: 'Invoice removed successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
