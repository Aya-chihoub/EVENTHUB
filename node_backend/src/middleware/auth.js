const jwt = require('jsonwebtoken');

const SECRET = process.env.JWT_SECRET || 'secret';

function authenticateToken(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required.' });
  }

  try {
    req.user = jwt.verify(header.split(' ')[1], SECRET);
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }
}

function requireEditor(req, res, next) {
  authenticateToken(req, res, () => {
    if (req.user?.role !== 'editor') {
      return res.status(403).json({ error: 'Editor role required.' });
    }
    next();
  });
}

module.exports = { authenticateToken, requireEditor };
