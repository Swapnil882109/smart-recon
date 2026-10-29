const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { queryAll, runSql } = require('../db/database');

// GET /api/settings
router.get('/', (req, res) => {
  try {
    const db = req.app.locals.db;
    const rows = queryAll(db, 'SELECT key, value, description, updated_at FROM settings');
    const settings = {};
    rows.forEach(r => {
      settings[r.key] = r.value;
    });
    res.json({ settings, raw: rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/settings
router.put('/', (req, res) => {
  try {
    const db = req.app.locals.db;
    const updates = req.body; // e.g. { amount_tolerance_percent: '2.0', amount_tolerance_absolute: '15.00' }

    for (const key of Object.keys(updates)) {
      runSql(db, `
        INSERT INTO settings (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP
      `, [key, String(updates[key])]);
    }

    runSql(db, `INSERT INTO activity_logs (id, user_name, user_role, action, entity_type, details) VALUES (?, ?, ?, ?, ?, ?)`, [
      uuidv4(), 'System Admin', 'Admin', 'SETTINGS_UPDATE', 'SETTINGS', `Updated reconciliation tolerances and system rules.`
    ]);

    res.json({ message: 'Settings updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
