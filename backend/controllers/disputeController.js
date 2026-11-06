const Dispute = require('../models/Dispute');
const Escrow = require('../models/Escrow');
const Job = require('../models/Job');
const User = require('../models/User');
const { newId, HttpError } = require('../utils/httpError');
const { formatINR } = require('../utils/money');
const { createTransaction } = require('../utils/walletOps');
const { refundEscrowToPoster, releaseEscrowToFreelancer } = require('../utils/escrowHelpers');

const enrichDisputes = async (disputes) => {
  const escrows = await Escrow.find({ escrowId: { $in: disputes.map((d) => d.escrowId) } }).lean();
  const escrowMap = Object.fromEntries(escrows.map((e) => [e.escrowId, e]));
  const jobs = await Job.find({ jobId: { $in: disputes.map((d) => d.jobId) } }).lean();
  const jobMap = Object.fromEntries(jobs.map((j) => [j.jobId, j.title]));
  const userIds = new Set();
  disputes.forEach((d) => userIds.add(d.raisedBy));
  escrows.forEach((e) => {
    userIds.add(e.jobPosterId);
    if (e.freelancerId) userIds.add(e.freelancerId);
  });
  const users = await User.find({ id: { $in: [...userIds] } }).lean();
  const nameOf = Object.fromEntries(users.map((u) => [u.id, u.name]));

  return disputes.map((d) => {
    const escrow = escrowMap[d.escrowId];
    return {
      ...d,
      jobTitle: jobMap[d.jobId] || 'Deleted job',
      amount: escrow?.amount ?? 0,
      escrowStatus: escrow?.status ?? null,
      raisedByName: nameOf[d.raisedBy] || 'User',
      client: escrow ? { id: escrow.jobPosterId, name: nameOf[escrow.jobPosterId] || 'Client' } : null,
      freelancer: escrow?.freelancerId
        ? { id: escrow.freelancerId, name: nameOf[escrow.freelancerId] || 'Freelancer' }
        : null,
      winnerName: d.winnerId ? nameOf[d.winnerId] || d.winnerId : null,
    };
  });
};

// Client or assigned freelancer can dispute a HELD or SUBMITTED escrow.
const raiseDispute = async (req, res) => {
  const { escrowId } = req.body;
  const reason = String(req.body.reason || '').trim();
  if (!escrowId || typeof escrowId !== 'string') throw new HttpError(400, 'escrowId is required');
  if (reason.length < 10) throw new HttpError(400, 'Please describe the problem (at least 10 characters)');

  const existing = await Escrow.findOne({ escrowId }).lean();
  if (!existing) throw new HttpError(404, 'Escrow not found');
  if (existing.jobPosterId !== req.user.id && existing.freelancerId !== req.user.id) {
    throw new HttpError(403, 'You are not a party to this escrow');
  }
  if (!existing.freelancerId) {
    throw new HttpError(400, 'No freelancer is assigned yet — delete the job to get a refund instead');
  }

  // Atomic: only one dispute can move the escrow into DISPUTED.
  const escrow = await Escrow.findOneAndUpdate(
    { escrowId, status: { $in: ['HELD', 'SUBMITTED'] } },
    { $set: { status: 'DISPUTED' } },
    { new: false } // return the previous state
  );
  if (!escrow) throw new HttpError(400, `Cannot dispute an escrow that is ${existing.status}`);

  const dispute = await Dispute.create({
    disputeId: newId(),
    escrowId,
    jobId: escrow.jobId,
    raisedBy: req.user.id,
    reason,
    status: 'OPEN',
    previousEscrowStatus: escrow.status,
  });
  await createTransaction(req.user.id, 'system', 0, 'DISPUTE_CREATED', escrowId);

  res.status(201).json({ message: 'Dispute raised. An admin will review it.', dispute });
};

// Admin decides: funds go either to the client (refund) or the freelancer (release).
const resolveDispute = async (req, res) => {
  const { disputeId, winnerId } = req.body;
  const resolution = String(req.body.resolution || '').trim();
  if (!disputeId || typeof disputeId !== 'string') throw new HttpError(400, 'disputeId is required');
  if (!winnerId || typeof winnerId !== 'string') throw new HttpError(400, 'winnerId is required');

  const dispute = await Dispute.findOne({ disputeId }).lean();
  if (!dispute) throw new HttpError(404, 'Dispute not found');
  if (dispute.status !== 'OPEN') throw new HttpError(400, 'Dispute is already resolved');

  const escrow = await Escrow.findOne({ escrowId: dispute.escrowId }).lean();
  if (!escrow) throw new HttpError(404, 'Escrow not found');
  if (winnerId !== escrow.jobPosterId && winnerId !== escrow.freelancerId) {
    throw new HttpError(400, 'Winner must be the client or the assigned freelancer on this escrow');
  }

  // Claim the dispute first so it can never be resolved (and paid out) twice.
  const claimed = await Dispute.findOneAndUpdate(
    { disputeId, status: 'OPEN' },
    { $set: { status: 'RESOLVED', resolution, winnerId, resolvedBy: req.user.id, resolvedAt: new Date() } },
    { new: true }
  );
  if (!claimed) throw new HttpError(409, 'Dispute was already resolved');

  const clientWins = winnerId === escrow.jobPosterId;
  const moved = clientWins
    ? await refundEscrowToPoster({ escrowId: escrow.escrowId }, ['DISPUTED'])
    : await releaseEscrowToFreelancer({ escrowId: escrow.escrowId }, ['DISPUTED']);

  if (!moved) {
    // Escrow wasn't in DISPUTED state — undo the claim so nothing is inconsistent.
    await Dispute.updateOne(
      { disputeId },
      { $set: { status: 'OPEN', resolution: '', winnerId: null, resolvedBy: null, resolvedAt: null } }
    );
    throw new HttpError(409, 'Escrow is not in a disputed state');
  }

  await Job.updateOne({ jobId: escrow.jobId }, { $set: { status: clientWins ? 'CANCELLED' : 'COMPLETED' } });

  res.json({
    message: `Dispute resolved: ${formatINR(escrow.amount)} ${clientWins ? 'refunded to the client' : 'released to the freelancer'}`,
  });
};

const getAllDisputes = async (req, res) => {
  const disputes = await Dispute.find().sort({ status: 1, createdAt: -1 }).lean();
  res.json(await enrichDisputes(disputes));
};

const getMyDisputes = async (req, res) => {
  const escrows = await Escrow.find({
    $or: [{ jobPosterId: req.user.id }, { freelancerId: req.user.id }],
  })
    .select('escrowId')
    .lean();
  const disputes = await Dispute.find({ escrowId: { $in: escrows.map((e) => e.escrowId) } })
    .sort({ createdAt: -1 })
    .lean();
  res.json(await enrichDisputes(disputes));
};

// Client cancels a job before anyone is assigned; the held escrow is refunded.
const cancelJob = async (req, res) => {
  const { escrowId } = req.body;
  if (!escrowId || typeof escrowId !== 'string') throw new HttpError(400, 'escrowId is required');

  const existing = await Escrow.findOne({ escrowId }).lean();
  if (!existing) throw new HttpError(404, 'Escrow not found');
  if (existing.jobPosterId !== req.user.id) throw new HttpError(403, 'Only the job poster can cancel');
  if (existing.freelancerId) {
    throw new HttpError(400, 'A freelancer is already assigned — raise a dispute instead of cancelling');
  }

  const escrow = await refundEscrowToPoster({ escrowId, freelancerId: null }, ['HELD']);
  if (!escrow) throw new HttpError(400, 'Only held escrows can be refunded');

  await Job.updateOne({ jobId: escrow.jobId }, { $set: { status: 'CANCELLED' } });
  res.json({ message: `Job cancelled and ${formatINR(escrow.amount)} refunded` });
};

module.exports = { raiseDispute, resolveDispute, getAllDisputes, getMyDisputes, cancelJob };
