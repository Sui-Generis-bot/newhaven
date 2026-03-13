// routes/contacts.js
const express = require('express');
const { body, query, param, validationResult } = require('express-validator');
const db = require('../db/index');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const { audit } = require('../utils/audit');

const router = express.Router();

// ─── Validation rules ────────────────────────────────────────────────────────

const contactValidation = [
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 120 }).escape(),
  body('title').trim().notEmpty().withMessage('Title is required').isLength({ max: 120 }).escape(),
  body('email').trim().normalizeEmail().isEmail().withMessage('Valid email required').isLength({ max: 254 }),
  body('mobile').optional({ checkFalsy: true }).trim().isLength({ max: 30 })
    .matches(/^[\d\s\+\-\(\)\.]+$/).withMessage('Invalid mobile number').escape(),
  body('telephone').optional({ checkFalsy: true }).trim().isLength({ max: 30 })
    .matches(/^[\d\s\+\-\(\)\.]+$/).withMessage('Invalid telephone number').escape(),
  body('fax').optional({ checkFalsy: true }).trim().isLength({ max: 30 })
    .matches(/^[\d\s\+\-\(\)\.]+$/).withMessage('Invalid fax number').escape(),
  body('office_address').optional({ checkFalsy: true }).trim().isLength({ max: 300 }).escape(),
  body('website').optional({ checkFalsy: true }).trim().isURL({ require_protocol: true })
    .withMessage('Website must be a valid URL (include https://)').isLength({ max: 512 }),
  body('department').optional({ checkFalsy: true }).trim().isLength({ max: 80 }).escape(),
];

// ─── GET /api/contacts ────────────────────────────────────────────────────────

router.get('/', requireAuth, [
  query('search').optional().trim().isLength({ max: 100 }).escape(),
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  query('sort').optional().isIn(['name','title','email','department','created_at']),
  query('order').optional().isIn(['asc','desc']),
], (req, res) => {
  const search    = req.query.search || '';
  const page      = req.query.page   || 1;
  const limit     = req.query.limit  || 20;
  const sort      = req.query.sort   || 'name';
  const order     = req.query.order  || 'asc';
  const offset    = (page - 1) * limit;

  const like = `%${search}%`;
  const where = search
    ? `WHERE is_active = 1 AND (name LIKE ? OR title LIKE ? OR email LIKE ? OR department LIKE ?)`
    : `WHERE is_active = 1`;
  const params = search ? [like, like, like, like] : [];

  const total = db.prepare(`SELECT COUNT(*) as n FROM contacts ${where}`).get(...params).n;

  const rows = db.prepare(`
    SELECT id, name, title, email, mobile, telephone, fax, office_address, website, department, created_at, updated_at
    FROM contacts ${where}
    ORDER BY ${sort} ${order.toUpperCase()}
    LIMIT ? OFFSET ?
  `).all(...params, limit, offset);

  res.json({ data: rows, total, page, limit, pages: Math.ceil(total / limit) });
});

// ─── GET /api/contacts/:id ────────────────────────────────────────────────────

router.get('/:id', requireAuth, [
  param('id').isLength({ max: 64 }).escape()
], (req, res) => {
  const contact = db.prepare(`
    SELECT * FROM contacts WHERE id = ? AND is_active = 1
  `).get(req.params.id);

  if (!contact) return res.status(404).json({ error: 'Contact not found' });
  res.json(contact);
});

// ─── POST /api/contacts ───────────────────────────────────────────────────────

router.post('/', requireAuth, requireAdmin, contactValidation, (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { name, title, email, mobile, telephone, fax, office_address, website, department } = req.body;
  const id = require('crypto').randomUUID();

  // Check email uniqueness among active contacts
  const existing = db.prepare(`SELECT id FROM contacts WHERE email = ? AND is_active = 1`).get(email);
  if (existing) return res.status(409).json({ error: 'Email already exists in directory' });

  db.prepare(`
    INSERT INTO contacts (id, name, title, email, mobile, telephone, fax, office_address, website, department, created_by, updated_by)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?)
  `).run(id, name, title, email, mobile||null, telephone||null, fax||null, office_address||null, website||null, department||null,
         req.session.userId, req.session.userId);

  audit({
    userId: req.session.userId, username: req.session.username,
    action: 'CREATE', entity: 'contact', entityId: id,
    details: { name, email }, ip: req.ip
  });

  const created = db.prepare(`SELECT * FROM contacts WHERE id = ?`).get(id);
  res.status(201).json(created);
});

// ─── PUT /api/contacts/:id ────────────────────────────────────────────────────

router.put('/:id', requireAuth, requireAdmin, [
  param('id').isLength({ max: 64 }).escape(),
  ...contactValidation
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const contact = db.prepare(`SELECT * FROM contacts WHERE id = ? AND is_active = 1`).get(req.params.id);
  if (!contact) return res.status(404).json({ error: 'Contact not found' });

  const { name, title, email, mobile, telephone, fax, office_address, website, department } = req.body;

  // Check email uniqueness (exclude self)
  const duplicate = db.prepare(`SELECT id FROM contacts WHERE email = ? AND is_active = 1 AND id != ?`).get(email, req.params.id);
  if (duplicate) return res.status(409).json({ error: 'Email already in use by another contact' });

  db.prepare(`
    UPDATE contacts SET
      name=?, title=?, email=?, mobile=?, telephone=?, fax=?, office_address=?, website=?, department=?,
      updated_by=?, updated_at=strftime('%Y-%m-%dT%H:%M:%fZ','now')
    WHERE id = ?
  `).run(name, title, email, mobile||null, telephone||null, fax||null, office_address||null, website||null, department||null,
         req.session.userId, req.params.id);

  audit({
    userId: req.session.userId, username: req.session.username,
    action: 'UPDATE', entity: 'contact', entityId: req.params.id,
    details: { name, email }, ip: req.ip
  });

  const updated = db.prepare(`SELECT * FROM contacts WHERE id = ?`).get(req.params.id);
  res.json(updated);
});

// ─── DELETE /api/contacts/:id (soft delete) ───────────────────────────────────

router.delete('/:id', requireAuth, requireAdmin, [
  param('id').isLength({ max: 64 }).escape()
], (req, res) => {
  const contact = db.prepare(`SELECT * FROM contacts WHERE id = ? AND is_active = 1`).get(req.params.id);
  if (!contact) return res.status(404).json({ error: 'Contact not found' });

  db.prepare(`
    UPDATE contacts SET is_active = 0, updated_by = ?, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now')
    WHERE id = ?
  `).run(req.session.userId, req.params.id);

  audit({
    userId: req.session.userId, username: req.session.username,
    action: 'DELETE', entity: 'contact', entityId: req.params.id,
    details: { name: contact.name, email: contact.email }, ip: req.ip
  });

  res.json({ message: 'Contact deleted' });
});

// ─── GET /api/contacts/audit-log (admin only) ─────────────────────────────────

router.get('/admin/audit', requireAuth, requireAdmin, (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || 50, 200);
  const logs = db.prepare(`
    SELECT * FROM audit_log ORDER BY created_at DESC LIMIT ?
  `).all(limit);
  res.json(logs);
});

module.exports = router;
