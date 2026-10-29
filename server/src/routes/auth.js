const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { queryOne, runSql } = require('../db/database');

const JWT_SECRET = process.env.JWT_SECRET || 'smart-recon-enterprise-secret-key-2026';

// Middleware to authenticate JWT
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Authentication token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid or expired session' });
    req.user = user;
    next();
  });
}

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const db = req.app.locals.db;
    const user = queryOne(db, 'SELECT * FROM users WHERE email = ?', [email.toLowerCase().trim()]);

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isValid = bcrypt.compareSync(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name, role: user.role, organization: user.organization },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Log login activity
    runSql(db, `INSERT INTO activity_logs (id, user_name, user_role, action, entity_type, details) VALUES (?, ?, ?, ?, ?, ?)`, [
      uuidv4(), user.name, user.role, 'USER_LOGIN', 'AUTH', `User logged in from ${req.ip || '127.0.0.1'}`
    ]);

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        organization: user.organization
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, organization, role } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    const db = req.app.locals.db;
    const existing = queryOne(db, 'SELECT id FROM users WHERE email = ?', [email.toLowerCase().trim()]);
    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists' });
    }

    const id = uuidv4();
    const hash = bcrypt.hashSync(password, 10);
    const assignedRole = role || 'Finance Reviewer';
    const assignedOrg = organization || 'Enterprise Finance Operations';

    runSql(db, `INSERT INTO users (id, name, email, password_hash, role, organization) VALUES (?, ?, ?, ?, ?, ?)`, [
      id, name, email.toLowerCase().trim(), hash, assignedRole, assignedOrg
    ]);

    const token = jwt.sign(
      { id, email: email.toLowerCase().trim(), name, role: assignedRole, organization: assignedOrg },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    runSql(db, `INSERT INTO activity_logs (id, user_name, user_role, action, entity_type, details) VALUES (?, ?, ?, ?, ?, ?)`, [
      uuidv4(), name, assignedRole, 'USER_REGISTER', 'AUTH', 'New user registered account'
    ]);

    res.status(201).json({
      token,
      user: { id, name, email: email.toLowerCase().trim(), role: assignedRole, organization: assignedOrg }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/auth/me
router.get('/me', authenticateToken, (req, res) => {
  const db = req.app.locals.db;
  const user = queryOne(db, 'SELECT id, name, email, role, organization, created_at FROM users WHERE id = ?', [req.user.id]);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ user });
});

// POST /api/auth/change-password
router.post('/change-password', authenticateToken, (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Current and new password required' });
  }

  const db = req.app.locals.db;
  const user = queryOne(db, 'SELECT * FROM users WHERE id = ?', [req.user.id]);
  if (!bcrypt.compareSync(currentPassword, user.password_hash)) {
    return res.status(400).json({ error: 'Current password incorrect' });
  }

  const newHash = bcrypt.hashSync(newPassword, 10);
  runSql(db, 'UPDATE users SET password_hash = ? WHERE id = ?', [newHash, req.user.id]);
  res.json({ message: 'Password updated successfully' });
});

// POST /api/auth/forgot-password (mock/development token flow)
router.post('/forgot-password', (req, res) => {
  const { email } = req.body;
  // Security standard: generic message to prevent email enumeration
  res.json({
    message: 'If an account exists for this email, password reset instructions have been dispatched.',
    devResetToken: 'RECON-RESET-' + Math.random().toString(36).substring(2, 8).toUpperCase()
  });
});

module.exports = {
  router,
  authenticateToken
};
