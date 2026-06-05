import db from '../database/db.js';

export function requireAuth(req, res, next) {
  if (!req.session?.userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  const user = db.prepare('SELECT id, email, name FROM users WHERE id = ?').get(req.session.userId);
  if (!user) {
    return res.status(401).json({ error: 'User not found' });
  }
  req.currentUser = user;
  next();
}

export function optionalUser(req, res, next) {
  if (req.session?.userId) {
    const user = db.prepare('SELECT id, email, name FROM users WHERE id = ?').get(req.session.userId);
    if (user) {
      req.currentUser = user;
    }
  }
  next();
}
