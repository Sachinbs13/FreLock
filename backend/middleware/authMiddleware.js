const User = require('../models/User');
const { verifyToken } = require('../utils/auth');

// Verifies the JWT *and* re-checks the user in the database on every request,
// so freezing an account takes effect immediately (not when the token expires).
const protect = async (req, res, next) => {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) return res.status(401).json({ error: 'Not authorized, no token' });

    const decoded = verifyToken(token);
    if (!decoded) return res.status(401).json({ error: 'Session expired. Please log in again.' });

    const user = await User.findOne({ id: decoded.id }).lean();
    if (!user) return res.status(401).json({ error: 'Account no longer exists' });
    if (user.status === 'FROZEN') {
      return res.status(403).json({ error: 'Your account has been frozen. Contact admin.' });
    }

    req.user = { id: user.id, email: user.email, role: user.role, name: user.name };
    return next();
  } catch (error) {
    return next(error);
  }
};

const requireRole = (...roles) => (req, res, next) => {
  if (req.user && roles.includes(req.user.role)) return next();
  return res.status(403).json({ error: `This action requires role: ${roles.join(' or ')}` });
};

const adminOnly = requireRole('Admin');

module.exports = { protect, requireRole, adminOnly };
