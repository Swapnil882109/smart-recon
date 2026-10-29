const express = require('express');
const router = express.Router();
const { queryAll, runSql } = require('../db/database');

// GET /api/activity/logs
router.get('/logs', (req, res) => {
  try {
    const db = req.app.locals.db;
    const { action, limit = 50 } = req.query;

    let sql = 'SELECT * FROM activity_logs WHERE 1=1';
    const params = [];

    if (action && action !== 'ALL') {
      sql += ' AND action = ?';
      params.push(action);
    }

    sql += ' ORDER BY timestamp DESC LIMIT ?';
    params.push(parseInt(limit, 10));

    const logs = queryAll(db, sql, params);
    res.json({ logs });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/activity/notifications
router.get('/notifications', (req, res) => {
  try {
    const db = req.app.locals.db;
    const notifications = queryAll(db, 'SELECT * FROM notifications ORDER BY created_at DESC LIMIT 30');
    res.json({ notifications });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/activity/notifications/mark-read
router.post('/notifications/mark-read', (req, res) => {
  try {
    const db = req.app.locals.db;
    const { id } = req.body;
    if (id) {
      runSql(db, 'UPDATE notifications SET is_read = 1 WHERE id = ?', [id]);
    } else {
      runSql(db, 'UPDATE notifications SET is_read = 1');
    }
    res.json({ message: 'Notifications marked as read' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
