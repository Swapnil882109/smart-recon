const express = require('express');
const router = express.Router();
const { queryAll, queryOne } = require('../db/database');
const { runReconciliation } = require('../services/reconciliation');

// POST /api/reconciliation/run - reconcile single invoice
router.post('/run', (req, res) => {
  try {
    const db = req.app.locals.db;
    const { invoiceId, actorName = 'Finance User', actorRole = 'Reviewer' } = req.body;

    if (!invoiceId) {
      return res.status(400).json({ error: 'invoiceId is required' });
    }

    const result = runReconciliation(db, invoiceId, actorName, actorRole);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/reconciliation/run-all - batch run reconciliation
router.post('/run-all', (req, res) => {
  try {
    const db = req.app.locals.db;
    const invoices = queryAll(db, 'SELECT id FROM invoices');
    const results = [];

    for (const inv of invoices) {
      try {
        const res = runReconciliation(db, inv.id, 'Batch Engine', 'Automated');
        results.push(res);
      } catch (e) {
        console.error(`Batch reconciliation error for ${inv.id}:`, e);
      }
    }

    res.json({
      message: `Batch reconciliation executed for ${results.length} invoices`,
      results
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/reconciliation/results - list reconciliation runs
router.get('/results', (req, res) => {
  try {
    const db = req.app.locals.db;
    const { status, limit = 50 } = req.query;

    let sql = `
      SELECT r.*,
             i.invoice_number,
             i.supplier as invoice_supplier,
             i.total_amount as invoice_total,
             i.invoice_date,
             p.po_number,
             p.supplier as po_supplier,
             p.total_amount as po_total,
             p.order_date as po_date,
             COUNT(d.id) as discrepancy_count
      FROM reconciliations r
      JOIN invoices i ON r.invoice_id = i.id
      LEFT JOIN purchase_orders p ON r.po_id = p.id
      LEFT JOIN discrepancies d ON r.id = d.reconciliation_id
      WHERE 1=1
    `;
    const params = [];

    if (status && status !== 'ALL') {
      sql += ' AND r.status = ?';
      params.push(status);
    }

    sql += ' GROUP BY r.id ORDER BY r.reconciliation_date DESC LIMIT ?';
    params.push(parseInt(limit, 10));

    const results = queryAll(db, sql, params);
    res.json({ results });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/reconciliation/:id - single comparison view
router.get('/:id', (req, res) => {
  try {
    const db = req.app.locals.db;
    const recon = queryOne(db, `
      SELECT r.*,
             i.id as invoice_db_id,
             i.invoice_number,
             i.supplier as invoice_supplier,
             i.invoice_date,
             i.due_date,
             i.subtotal as invoice_subtotal,
             i.tax_amount as invoice_tax,
             i.shipping as invoice_shipping,
             i.total_amount as invoice_total,
             i.document_url,
             p.id as po_db_id,
             p.po_number,
             p.supplier as po_supplier,
             p.order_date as po_date,
             p.subtotal as po_subtotal,
             p.tax_amount as po_tax,
             p.shipping as po_shipping,
             p.total_amount as po_total
      FROM reconciliations r
      JOIN invoices i ON r.invoice_id = i.id
      LEFT JOIN purchase_orders p ON r.po_id = p.id
      WHERE r.id = ?
    `, [req.params.id]);

    if (!recon) return res.status(404).json({ error: 'Reconciliation record not found' });

    const discrepancies = queryAll(db, 'SELECT * FROM discrepancies WHERE reconciliation_id = ? ORDER BY severity DESC', [recon.id]);
    const invoiceItems = queryAll(db, 'SELECT * FROM invoice_items WHERE invoice_id = ?', [recon.invoice_db_id]);
    const poItems = recon.po_db_id
      ? queryAll(db, 'SELECT * FROM po_items WHERE po_id = ?', [recon.po_db_id])
      : [];

    res.json({
      ...recon,
      discrepancies,
      invoiceItems,
      poItems
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
