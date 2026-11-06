const Escrow = require('../models/Escrow');
const { ACTIVE_ESCROW_STATUSES } = require('../models/Escrow');
const { newId } = require('./httpError');
const { CURRENCY } = require('./money');
const { creditWallet, createTransaction } = require('./walletOps');

// NOTE: funds must already have been debited from the poster's wallet.
const lockFundsInEscrow = async ({ posterId, jobId, amount, freelancerId = null }) => {
  const escrow = await Escrow.create({
    escrowId: newId(),
    jobId,
    jobPosterId: posterId,
    freelancerId,
    amount,
    currency: CURRENCY,
    status: 'HELD',
  });
  await createTransaction(posterId, 'escrow', amount, 'ESCROW_FUND', escrow.escrowId);
  return escrow;
};

const getActiveEscrowForJob = (jobId) =>
  Escrow.findOne({ jobId, status: { $in: ACTIVE_ESCROW_STATUSES } });

// The status flip is a conditional atomic update: if two requests race, only
// one of them matches the `fromStatuses` filter, so money moves exactly once.
const releaseEscrowToFreelancer = async (filter, fromStatuses) => {
  const escrow = await Escrow.findOneAndUpdate(
    { ...filter, status: { $in: fromStatuses }, freelancerId: { $ne: null } },
    { $set: { status: 'RELEASED' } },
    { new: true }
  );
  if (!escrow) return null;

  await creditWallet(escrow.freelancerId, escrow.amount);
  await createTransaction('escrow', escrow.freelancerId, escrow.amount, 'PAYMENT_RELEASE', escrow.escrowId);
  return escrow;
};

const refundEscrowToPoster = async (filter, fromStatuses) => {
  const escrow = await Escrow.findOneAndUpdate(
    { ...filter, status: { $in: fromStatuses } },
    { $set: { status: 'REFUNDED' } },
    { new: true }
  );
  if (!escrow) return null;

  await creditWallet(escrow.jobPosterId, escrow.amount);
  await createTransaction('escrow', escrow.jobPosterId, escrow.amount, 'REFUND', escrow.escrowId);
  return escrow;
};

module.exports = {
  lockFundsInEscrow,
  getActiveEscrowForJob,
  releaseEscrowToFreelancer,
  refundEscrowToPoster,
};
