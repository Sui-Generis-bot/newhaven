// routes/auth.js
const express = require('express');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const db = require('../db/index');
const { audit } = require('../utils/audit');

const router = express.Router();

const loginValidation = [
  body('username').trim().notEmpty().isLength({ max: 64 }).escape(),
  body('password').notEmpty().isLength({ max: 128 }),
];

// POST /api/auth/login
router.post('/login', loginValidation, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ error: 'Invalid input' });

  const { username, password } = req.body;
  const ip = req.ip;

  const user = db.prepare(`
    SELECT id, username, email, password_hash, role, is_active
    FROM users WHERE username = ? COLLATE NOCASE
  `).get(username);

  if (!user || !user.is_active) {
    audit({ action: 'LOGIN_FAIL', username, ip, details: 'User not found or inactive' });
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const match = await bcrypt.compare(password, user.password_hash);
  if (!match) {
    audit({ action: 'LOGIN_FAIL', username, ip, details: 'Bad password' });
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  // Regenerate session to prevent fixation
  req.session.regenerate((err) => {
    if (err) return res.status(500).json({ error: 'Session error' });

    req.session.userId   = user.id;
    req.session.username = user.username;
    req.session.role     = user.role;

    // Update last_login
    db.prepare(`UPDATE users SET last_login = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id = ?`)
      .run(user.id);

    audit({ userId: user.id, username: user.username, action: 'LOGIN', ip });

    res.json({
      user: { id: user.id, username: user.username, email: user.email, role: user.role }
    });
  });
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  const { userId, username } = req.session;
  audit({ userId, username, action: 'LOGOUT', ip: req.ip });

  req.session.destroy((err) => {
    res.clearCookie('sid');
    if (err) return res.status(500).json({ error: 'Logout failed' });
    res.json({ message: 'Logged out' });
  });
});

// GET /api/auth/me  — return current session user
router.get('/me', (req, res) => {
  if (!req.session?.userId) return res.status(401).json({ error: 'Not authenticated' });
  res.json({
    user: {
      id: req.session.userId,
      username: req.session.username,
      role: req.session.role
    }
  });
});

module.exports = router;
