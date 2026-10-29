const express = require('express');
const router = express.Router();
const XLSX = require('xlsx');
const { queryAll } = require('../db/database');

// GET /api/reports/summary
router.get('/summary', (req, res) => {
  try {
    const db = req.app.locals.db;
    const reportData = queryAll(db, `
      SELECT r.id as recon_id,
             r.status,
             r.confidence_score,
             r.discrepancy_amount,
             r.reconciliation_date,
             i.invoice_number,
             i.supplier as invoice_supplier,
             i.invoice_date,
             i.total_amount as invoice_total,
             p.po_number,
             p.supplier as po_supplier,
             p.total_amount as po_total,
             p.order_date as po_date
      FROM reconciliations r
      JOIN invoices i ON r.invoice_id = i.id
      LEFT JOIN purchase_orders p ON r.po_id = p.id
      ORDER BY r.reconciliation_date DESC
    `);

    res.json({ report: reportData });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/reports/export/:format (csv or xlsx)
router.get('/export/:format', (req, res) => {
  try {
    const db = req.app.locals.db;
    const format = req.params.format.toLowerCase();

    const rows = queryAll(db, `
      SELECT i.invoice_number AS 'Invoice Number',
             i.supplier AS 'Supplier',
             i.invoice_date AS 'Invoice Date',
             i.total_amount AS 'Invoice Total ($)',
             p.po_number AS 'PO Reference',
             p.total_amount AS 'PO Amount ($)',
             r.status AS 'Reconciliation Status',
             r.confidence_score AS 'Confidence (%)',
             r.discrepancy_amount AS 'Discrepancy ($)',
             r.tolerance_rules_applied AS 'Tolerance Rules',
             r.reconciliation_date AS 'Reconciled At'
      FROM reconciliations r
      JOIN invoices i ON r.invoice_id = i.id
      LEFT JOIN purchase_orders p ON r.po_id = p.id
      ORDER BY r.reconciliation_date DESC
    `);

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Reconciliation Summary');

    if (format === 'csv') {
      const csv = XLSX.utils.sheet_to_csv(worksheet);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="smart_recon_report.csv"');
      return res.send(csv);
    } else {
      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename="smart_recon_report.xlsx"');
      return res.send(buffer);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
