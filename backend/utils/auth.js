const jwt = require('jsonwebtoken');

const DEV_FALLBACK_SECRET = 'dev-only-insecure-secret-change-me';

const getSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (secret) return secret;
  if (process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET must be set in production');
  }
  return DEV_FALLBACK_SECRET;
};

const generateToken = (user) =>
  jwt.sign({ id: user.id, role: user.role }, getSecret(), { expiresIn: '1d' });

const verifyToken = (token) => {
  try {
    return jwt.verify(token, getSecret());
  } catch {
    return null;
  }
};

const sanitizeUser = (user) => ({
  id: user.id,
  email: user.email,
  role: user.role,
  name: user.name || user.email.split('@')[0],
  status: user.status || 'ACTIVE',
});

module.exports = { getSecret, generateToken, verifyToken, sanitizeUser };
