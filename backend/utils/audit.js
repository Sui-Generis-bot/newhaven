// utils/audit.js
const db = require('../db/index');

/**
 * Log an audit event.
 * @param {object} opts
 * @param {string} opts.userId
 * @param {string} opts.username
 * @param {string} opts.action  - CREATE | UPDATE | DELETE | LOGIN | LOGOUT | LOGIN_FAIL
 * @param {string} [opts.entity]
 * @param {string} [opts.entityId]
 * @param {object|string} [opts.details]
 * @param {string} [opts.ip]
 */
function audit({ userId, username, action, entity, entityId, details, ip }) {
  try {
    db.prepare(`
      INSERT INTO audit_log (user_id, username, action, entity, entity_id, details, ip_address)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      userId || null,
      username || null,
      action,
      entity || null,
      entityId || null,
      details ? JSON.stringify(details) : null,
      ip || null
    );
  } catch (err) {
    console.error('[AUDIT ERROR]', err.message);
  }
}

module.exports = { audit };
