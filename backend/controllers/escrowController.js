const Job = require('../models/Job');
const Escrow = require('../models/Escrow');
const User = require('../models/User');
const { HttpError } = require('../utils/httpError');
const { formatINR } = require('../utils/money');
const { verifyWalletPin } = require('../utils/walletPin');
const { debitWallet, creditWallet } = require('../utils/walletOps');
const {
  lockFundsInEscrow,
  getActiveEscrowForJob,
  releaseEscrowToFreelancer,
} = require('../utils/escrowHelpers');

// Adds job title and party names so the UI doesn't have to show raw IDs.
const enrichEscrows = async (escrows) => {
  const jobIds = [...new Set(escrows.map((e) => e.jobId))];
  const userIds = [...new Set(escrows.flatMap((e) => [e.jobPosterId, e.freelancerId]).filter(Boolean))];
  const [jobs, users] = await Promise.all([
    Job.find({ jobId: { $in: jobIds } }).lean(),
    User.find({ id: { $in: userIds } }).lean(),
  ]);
  const jobMap = Object.fromEntries(jobs.map((j) => [j.jobId, j.title]));
  const userMap = Object.fromEntries(users.map((u) => [u.id, u.name]));

  return escrows.map((e) => ({
    ...e,
    jobTitle: jobMap[e.jobId] || 'Deleted job',
    clientName: userMap[e.jobPosterId] || 'Client',
    freelancerName: e.freelancerId ? userMap[e.freelancerId] || 'Freelancer' : null,
  }));
};

// Fallback funding path for a job that has no active escrow
// (normally escrow is funded automatically when the job is posted).
const fundEscrow = async (req, res) => {
  const { jobId, pin } = req.body;
  if (!jobId || typeof jobId !== 'string') throw new HttpError(400, 'jobId is required');

  const job = await Job.findOne({ jobId }).lean();
  if (!job) throw new HttpError(404, 'Job not found');
  if (job.posterId !== req.user.id) throw new HttpError(403, 'Only the client who posted the job can fund it');
  if (!['OPEN', 'ASSIGNED'].includes(job.status)) throw new HttpError(400, 'Job is not eligible for escrow funding');
  if (await getActiveEscrowForJob(jobId)) throw new HttpError(400, 'Escrow is already funded for this job');

  await verifyWalletPin(req.user.id, pin);

  const wallet = await debitWallet(req.user.id, job.budget);
  if (!wallet) throw new HttpError(400, `Insufficient balance. You need ${formatINR(job.budget)}.`);

  let escrow;
  try {
    escrow = await lockFundsInEscrow({
      posterId: req.user.id,
      jobId,
      amount: job.budget,
      freelancerId: job.freelancerId || null,
    });
  } catch (error) {
    await creditWallet(req.user.id, job.budget);
    throw error;
  }

  res.json({
    message: `${formatINR(job.budget)} locked in escrow successfully`,
    escrow,
    wallet: { balance: wallet.balance, currency: wallet.currency },
  });
};

const getEscrows = async (req, res) => {
  const escrows = await Escrow.find().sort({ createdAt: -1 }).lean();
  res.json(await enrichEscrows(escrows));
};

const getMyEscrows = async (req, res) => {
  const escrows = await Escrow.find({
    $or: [{ jobPosterId: req.user.id }, { freelancerId: req.user.id }],
  })
    .sort({ createdAt: -1 })
    .lean();
  res.json(await enrichEscrows(escrows));
};

// Freelancer marks the work as delivered (optionally with a note / link).
const submitWork = async (req, res) => {
  const { escrowId } = req.body;
  if (!escrowId || typeof escrowId !== 'string') throw new HttpError(400, 'escrowId is required');
  const note = String(req.body.note || '').trim().slice(0, 2000);

  const escrow = await Escrow.findOneAndUpdate(
    { escrowId, freelancerId: req.user.id, status: 'HELD' },
    { $set: { status: 'SUBMITTED', submissionNote: note, submittedAt: new Date() } },
    { new: true }
  );

  if (!escrow) {
    const existing = await Escrow.findOne({ escrowId }).lean();
    if (!existing) throw new HttpError(404, 'Escrow not found');
    if (existing.freelancerId !== req.user.id) throw new HttpError(403, 'Only the assigned freelancer can submit work');
    throw new HttpError(400, `Work cannot be submitted while escrow is ${existing.status}`);
  }

  res.json({ message: 'Work submitted. Awaiting client approval.', escrow });
};

// Client approves the delivery and releases the money (PIN required).
const approveWork = async (req, res) => {
  const { escrowId, pin } = req.body;
  if (!escrowId || typeof escrowId !== 'string') throw new HttpError(400, 'escrowId is required');

  const existing = await Escrow.findOne({ escrowId }).lean();
  if (!existing) throw new HttpError(404, 'Escrow not found');
  if (existing.jobPosterId !== req.user.id) throw new HttpError(403, 'Only the client can approve this work');
  if (existing.status !== 'SUBMITTED') throw new HttpError(400, 'Work has not been submitted yet');

  await verifyWalletPin(req.user.id, pin);

  const escrow = await releaseEscrowToFreelancer({ escrowId, jobPosterId: req.user.id }, ['SUBMITTED']);
  if (!escrow) throw new HttpError(409, 'Escrow was already processed');

  await Job.updateOne({ jobId: escrow.jobId }, { $set: { status: 'COMPLETED' } });
  res.json({ message: `${formatINR(escrow.amount)} released to the freelancer` });
};

module.exports = { fundEscrow, getEscrows, getMyEscrows, submitWork, approveWork, enrichEscrows };
