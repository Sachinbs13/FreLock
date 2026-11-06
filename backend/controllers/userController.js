const User = require('../models/User');
const { sanitizeUser } = require('../utils/auth');
const { HttpError } = require('../utils/httpError');

const getUsers = async (req, res) => {
  const { role } = req.query;
  const query = ['Client', 'Freelancer'].includes(role) ? { role } : { role: { $ne: 'Admin' } };
  const users = await User.find(query).select('-password').sort({ createdAt: -1 }).lean();
  res.json(users.map(sanitizeUser));
};

// Toggles ACTIVE <-> FROZEN. Takes effect immediately (the auth middleware
// re-checks status on every request).
const freezeUser = async (req, res) => {
  const user = await User.findOne({ id: req.params.id });
  if (!user) throw new HttpError(404, 'User not found');
  if (user.role === 'Admin') throw new HttpError(403, 'Admin accounts cannot be frozen');

  user.status = user.status === 'FROZEN' ? 'ACTIVE' : 'FROZEN';
  await user.save();

  res.json({
    message: `${user.name} is now ${user.status === 'FROZEN' ? 'frozen' : 'active'}`,
    user: sanitizeUser(user),
  });
};

module.exports = { getUsers, freezeUser };
