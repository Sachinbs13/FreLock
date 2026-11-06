const Transaction = require('../models/Transaction');
const User = require('../models/User');

const SPECIAL_PARTIES = { escrow: 'Escrow', system: 'System' };

// Replaces raw user IDs with display names for the history table.
const withNames = async (transactions) => {
  const ids = new Set();
  transactions.forEach((t) => {
    if (!SPECIAL_PARTIES[t.from]) ids.add(t.from);
    if (!SPECIAL_PARTIES[t.to]) ids.add(t.to);
  });
  const users = await User.find({ id: { $in: [...ids] } }).lean();
  const nameOf = Object.fromEntries(users.map((u) => [u.id, u.name]));
  const label = (id) => SPECIAL_PARTIES[id] || nameOf[id] || 'Unknown user';

  return transactions.map((t) => ({ ...t, fromName: label(t.from), toName: label(t.to) }));
};

const getMyTransactions = async (req, res) => {
  const transactions = await Transaction.find({
    $or: [{ from: req.user.id }, { to: req.user.id }],
  })
    .sort({ createdAt: -1 })
    .limit(500)
    .lean();
  res.json(await withNames(transactions));
};

const getAllTransactions = async (req, res) => {
  const transactions = await Transaction.find().sort({ createdAt: -1 }).limit(1000).lean();
  res.json(await withNames(transactions));
};

module.exports = { getMyTransactions, getAllTransactions };
