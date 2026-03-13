// middleware/auth.js

/**
 * Require authenticated session.
 */
function requireAuth(req, res, next) {
  if (req.session && req.session.userId) return next();
  if (req.headers['accept']?.includes('application/json')) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  return res.redirect('/login');
}

/**
 * Require admin role.
 */
function requireAdmin(req, res, next) {
  if (req.session && req.session.role === 'admin') return next();
  return res.status(403).json({ error: 'Admin access required' });
}

/**
 * Attach user info to res.locals for templates (not used in SPA but useful for hybrid).
 */
function attachUser(req, res, next) {
  res.locals.user = req.session?.userId
    ? { id: req.session.userId, username: req.session.username, role: req.session.role }
    : null;
  next();
}

module.exports = { requireAuth, requireAdmin, attachUser };
