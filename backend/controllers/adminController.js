const User = require('../models/User');
const Wallet = require('../models/Wallet');
const Job = require('../models/Job');
const Escrow = require('../models/Escrow');
const { ACTIVE_ESCROW_STATUSES } = require('../models/Escrow');
const Dispute = require('../models/Dispute');
const Message = require('../models/Message');

const sumField = async (Model, match, field) => {
  const [row] = await Model.aggregate([{ $match: match }, { $group: { _id: null, total: { $sum: `$${field}` } } }]);
  return row?.total || 0;
};

// Aggregations run in MongoDB instead of loading every document into memory.
const getStats = async (req, res) => {
  const [clients, freelancers, walletBalance, escrowHeld, openJobs, totalJobs, totalJobValue, openDisputes, totalMessages] =
    await Promise.all([
      User.countDocuments({ role: 'Client' }),
      User.countDocuments({ role: 'Freelancer' }),
      sumField(Wallet, {}, 'balance'),
      sumField(Escrow, { status: { $in: ACTIVE_ESCROW_STATUSES } }, 'amount'),
      Job.countDocuments({ status: 'OPEN' }),
      Job.countDocuments(),
      sumField(Job, {}, 'budget'),
      Dispute.countDocuments({ status: 'OPEN' }),
      Message.countDocuments(),
    ]);

  res.json({
    clients,
    freelancers,
    totalUsers: clients + freelancers,
    totalBalance: walletBalance,
    escrowHeld,
    currency: 'INR',
    openJobs,
    totalJobs,
    totalJobValue,
    openDisputes,
    totalMessages,
  });
};

module.exports = { getStats };
