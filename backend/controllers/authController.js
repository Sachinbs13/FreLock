const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { generateToken, sanitizeUser } = require('../utils/auth');
const { newId, HttpError } = require('../utils/httpError');

const VALID_ROLES = ['Admin', 'Client', 'Freelancer'];
const REGISTER_ROLES = ['Client', 'Freelancer'];
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const normalizeEmail = (email) => String(email || '').toLowerCase().trim();

const login = async (req, res) => {
  const { password, role } = req.body;
  const email = normalizeEmail(req.body.email);

  if (!email || !password || !role) throw new HttpError(400, 'Email, password, and role are required');
  if (!VALID_ROLES.includes(role)) throw new HttpError(400, 'Invalid role selected');

  const user = await User.findOne({ email });
  const passwordMatch = user ? await bcrypt.compare(String(password), user.password) : false;
  if (!passwordMatch) throw new HttpError(401, 'Invalid email or password');

  if (user.role !== role) {
    throw new HttpError(401, `This account is registered as ${user.role}, not ${role}`);
  }
  if (user.status === 'FROZEN') throw new HttpError(403, 'Your account has been frozen. Contact admin.');

  res.json({ message: 'Login successful', token: generateToken(user), user: sanitizeUser(user) });
};

const register = async (req, res) => {
  const { password, role } = req.body;
  const email = normalizeEmail(req.body.email);
  const name = String(req.body.name || '').trim();

  if (!email || !password || !role) throw new HttpError(400, 'Email, password, and role are required');
  if (!EMAIL_PATTERN.test(email)) throw new HttpError(400, 'Enter a valid email address');
  if (!REGISTER_ROLES.includes(role)) throw new HttpError(400, 'You can only register as Client or Freelancer');
  if (String(password).length < 6) throw new HttpError(400, 'Password must be at least 6 characters');
  if (name.length > 80) throw new HttpError(400, 'Name is too long');

  if (await User.exists({ email })) throw new HttpError(409, 'An account with this email already exists');

  const newUser = await User.create({
    id: newId(),
    email,
    password: await bcrypt.hash(String(password), 10),
    role,
    name: name || email.split('@')[0],
    status: 'ACTIVE',
  });

  res.status(201).json({
    message: 'Registration successful',
    token: generateToken(newUser),
    user: sanitizeUser(newUser),
  });
};

// req.user is already loaded (and checked for FROZEN) by the protect middleware.
const getMe = async (req, res) => {
  res.json({ user: sanitizeUser({ ...req.user, status: 'ACTIVE' }) });
};

module.exports = { login, register, getMe };
