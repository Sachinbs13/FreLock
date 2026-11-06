const Job = require('../models/Job');
const Escrow = require('../models/Escrow');
const { ACTIVE_ESCROW_STATUSES } = require('../models/Escrow');
const Wishlist = require('../models/Wishlist');
const User = require('../models/User');
const { newId, HttpError } = require('../utils/httpError');
const { parseAmount, formatINR } = require('../utils/money');
const { verifyWalletPin } = require('../utils/walletPin');
const { debitWallet, creditWallet } = require('../utils/walletOps');
const { lockFundsInEscrow, getActiveEscrowForJob, refundEscrowToPoster } = require('../utils/escrowHelpers');

const cleanLinks = (links) =>
  (Array.isArray(links) ? links : [])
    .map((l) => String(l).trim())
    .filter((l) => /^https?:\/\//i.test(l))
    .slice(0, 10);

const assertDeadline = (deadline) => {
  const date = new Date(deadline);
  if (!deadline || Number.isNaN(date.getTime())) throw new HttpError(400, 'Enter a valid deadline');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (date < today) throw new HttpError(400, 'Deadline cannot be in the past');
};

const loadUserMap = async (ids) => {
  const unique = [...new Set(ids.filter(Boolean))];
  if (unique.length === 0) return {};
  const users = await User.find({ id: { $in: unique } }).lean();
  return Object.fromEntries(users.map((u) => [u.id, { id: u.id, name: u.name, email: u.email }]));
};

// Freelancer marketplace: open jobs the user hasn't applied to and didn't post.
const getJobs = async (req, res) => {
  const jobs = await Job.find({
    status: 'OPEN',
    posterId: { $ne: req.user.id },
    applicants: { $nin: [req.user.id] },
  })
    .sort({ createdAt: -1 })
    .lean();

  const userMap = await loadUserMap(jobs.map((j) => j.posterId));
  res.json(jobs.map((j) => ({ ...j, clientName: userMap[j.posterId]?.name || 'Client' })));
};

// Client: own jobs with applicant details and the most relevant escrow.
const getMyJobs = async (req, res) => {
  const jobs = await Job.find({ posterId: req.user.id }).sort({ createdAt: -1 }).lean();
  const userMap = await loadUserMap(jobs.flatMap((j) => [...(j.applicants || []), j.freelancerId]));
  const escrows = await Escrow.find({ jobId: { $in: jobs.map((j) => j.jobId) } }).sort({ createdAt: 1 }).lean();

  // Prefer the active escrow for a job; otherwise the latest one.
  const escrowMap = {};
  escrows.forEach((e) => {
    const current = escrowMap[e.jobId];
    if (!current || !ACTIVE_ESCROW_STATUSES.includes(current.status)) escrowMap[e.jobId] = e;
  });

  res.json(
    jobs.map((job) => ({
      ...job,
      applicantDetails: (job.applicants || []).map((id) => userMap[id]).filter(Boolean),
      freelancerDetails: job.freelancerId ? userMap[job.freelancerId] || null : null,
      escrow: escrowMap[job.jobId] || null,
    }))
  );
};

const getAppliedJobs = async (req, res) => {
  const jobs = await Job.find({
    $or: [{ applicants: req.user.id }, { freelancerId: req.user.id }],
  })
    .sort({ createdAt: -1 })
    .lean();

  const userMap = await loadUserMap(jobs.map((j) => j.posterId));

  res.json(
    jobs.map((j) => {
      let applicationStatus = 'PENDING';
      if (j.freelancerId === req.user.id) applicationStatus = 'ACCEPTED';
      else if (j.freelancerId || j.status !== 'OPEN') applicationStatus = 'CLOSED';
      return { ...j, clientDetails: userMap[j.posterId] || null, applicationStatus };
    })
  );
};

// Posting a job debits the budget from the client's wallet and locks it in escrow.
const createJob = async (req, res) => {
  const { title, description, deadline, pin, privacyLevel, securityNotes, reward } = req.body;

  if (!title?.trim() || !description?.trim() || !deadline) {
    throw new HttpError(400, 'Title, description, budget and deadline are required');
  }
  const budget = parseAmount(req.body.budget, { field: 'Budget' });
  assertDeadline(deadline);

  await verifyWalletPin(req.user.id, pin);

  // 1. Atomically take the money (fails cleanly if balance is too low)
  const wallet = await debitWallet(req.user.id, budget);
  if (!wallet) {
    throw new HttpError(400, `Insufficient wallet balance. You need ${formatINR(budget)} to hold in escrow.`);
  }

  // 2. Create the job + escrow; if anything fails, give the money back
  const jobId = newId();
  let job;
  try {
    job = await Job.create({
      jobId,
      posterId: req.user.id,
      title: title.trim(),
      description: description.trim(),
      budget,
      deadline,
      jobLinks: cleanLinks(req.body.jobLinks),
      projectLinks: cleanLinks(req.body.projectLinks),
      privacyLevel: privacyLevel || 'PUBLIC',
      securityNotes: securityNotes || '',
      reward: reward || '',
      status: 'OPEN',
      applicants: [],
    });
  } catch (error) {
    await creditWallet(req.user.id, budget);
    throw error;
  }

  let escrow;
  try {
    escrow = await lockFundsInEscrow({ posterId: req.user.id, jobId, amount: budget });
  } catch (error) {
    await Job.deleteOne({ jobId });
    await creditWallet(req.user.id, budget);
    throw error;
  }

  res.status(201).json({
    message: `Job posted. ${formatINR(budget)} is held in escrow until the work is approved.`,
    job,
    escrow,
    wallet: { balance: wallet.balance, currency: wallet.currency },
  });
};

// Only descriptive fields can change, and only while the job is OPEN.
// The budget is locked in escrow, so it can no longer be edited.
const EDITABLE_FIELDS = ['title', 'description', 'deadline', 'privacyLevel', 'securityNotes', 'reward'];

const updateJob = async (req, res) => {
  const job = await Job.findOne({ jobId: req.params.id });
  if (!job) throw new HttpError(404, 'Job not found');
  if (job.posterId !== req.user.id && req.user.role !== 'Admin') throw new HttpError(403, 'Not authorized');
  if (job.status !== 'OPEN') throw new HttpError(400, 'Only open jobs can be edited');
  if (req.body.budget !== undefined && Number(req.body.budget) !== job.budget) {
    throw new HttpError(400, 'Budget is locked in escrow and cannot be changed. Delete and re-post the job instead.');
  }

  EDITABLE_FIELDS.forEach((f) => {
    if (req.body[f] !== undefined) job[f] = req.body[f];
  });
  if (req.body.deadline !== undefined) assertDeadline(req.body.deadline);
  if (req.body.jobLinks !== undefined) job.jobLinks = cleanLinks(req.body.jobLinks);
  if (req.body.projectLinks !== undefined) job.projectLinks = cleanLinks(req.body.projectLinks);
  await job.save();

  res.json({ message: 'Job updated', job });
};

// Deleting an OPEN job refunds its held escrow to the job poster.
const deleteJob = async (req, res) => {
  const job = await Job.findOne({ jobId: req.params.id });
  if (!job) throw new HttpError(404, 'Job not found');
  if (job.posterId !== req.user.id && req.user.role !== 'Admin') throw new HttpError(403, 'Not authorized');
  if (job.status !== 'OPEN') {
    throw new HttpError(400, 'Only open jobs can be deleted. Assigned jobs must go through approval or a dispute.');
  }

  const refunded = await refundEscrowToPoster({ jobId: job.jobId }, ['HELD']);
  await Job.deleteOne({ jobId: job.jobId });
  await Wishlist.deleteMany({ jobId: job.jobId });

  res.json({
    message: refunded
      ? `Job deleted and ${formatINR(refunded.amount)} refunded to the poster's wallet`
      : 'Job deleted',
  });
};

const applyJob = async (req, res) => {
  // Single atomic update: applies only if still open, not own job, not already applied.
  const job = await Job.findOneAndUpdate(
    {
      jobId: req.params.id,
      status: 'OPEN',
      posterId: { $ne: req.user.id },
      applicants: { $ne: req.user.id },
    },
    { $addToSet: { applicants: req.user.id } },
    { new: true }
  );

  if (!job) {
    const existing = await Job.findOne({ jobId: req.params.id }).lean();
    if (!existing) throw new HttpError(404, 'Job not found');
    if (existing.status !== 'OPEN') throw new HttpError(400, 'Job is no longer open');
    if (existing.posterId === req.user.id) throw new HttpError(400, 'You cannot apply to your own job');
    throw new HttpError(400, 'You have already applied to this job');
  }

  res.json({ message: 'Application submitted! The job moved to My Applications.', job });
};

const acceptApplicant = async (req, res) => {
  const { freelancerId } = req.body;
  if (!freelancerId || typeof freelancerId !== 'string') throw new HttpError(400, 'freelancerId is required');

  const job = await Job.findOneAndUpdate(
    { jobId: req.params.id, posterId: req.user.id, status: 'OPEN', applicants: freelancerId },
    { $set: { freelancerId, status: 'ASSIGNED' } },
    { new: true }
  );

  if (!job) {
    const existing = await Job.findOne({ jobId: req.params.id }).lean();
    if (!existing) throw new HttpError(404, 'Job not found');
    if (existing.posterId !== req.user.id) throw new HttpError(403, 'Not authorized');
    if (existing.status !== 'OPEN') throw new HttpError(400, 'Job is not open');
    throw new HttpError(400, 'This freelancer has not applied to the job');
  }

  const escrow = await Escrow.findOneAndUpdate(
    { jobId: job.jobId, status: 'HELD', freelancerId: null },
    { $set: { freelancerId } },
    { new: true }
  );

  const freelancer = await User.findOne({ id: freelancerId }).lean();
  const name = freelancer?.name || 'Freelancer';

  res.json({
    message: escrow
      ? `${name} accepted! ${formatINR(job.budget)} is held in escrow — they can start work.`
      : `${name} accepted! Fund the escrow to lock the payment.`,
    job,
    escrow: escrow || (await getActiveEscrowForJob(job.jobId)),
  });
};

const toggleWishlist = async (req, res) => {
  const { jobId } = req.body;
  if (!jobId || typeof jobId !== 'string') throw new HttpError(400, 'jobId is required');

  const removed = await Wishlist.findOneAndDelete({ userId: req.user.id, jobId });
  if (removed) return res.json({ message: 'Removed from wishlist', wishlisted: false });

  if (!(await Job.exists({ jobId }))) throw new HttpError(404, 'Job not found');
  await Wishlist.create({ id: newId(), userId: req.user.id, jobId });
  return res.json({ message: 'Added to wishlist', wishlisted: true });
};

const getWishlist = async (req, res) => {
  const items = await Wishlist.find({ userId: req.user.id }).lean();
  const jobs = await Job.find({
    jobId: { $in: items.map((i) => i.jobId) },
    status: 'OPEN',
    applicants: { $nin: [req.user.id] },
  }).lean();

  const userMap = await loadUserMap(jobs.map((j) => j.posterId));
  res.json(jobs.map((j) => ({ ...j, clientName: userMap[j.posterId]?.name || 'Client' })));
};

module.exports = {
  getJobs,
  getMyJobs,
  getAppliedJobs,
  createJob,
  updateJob,
  deleteJob,
  applyJob,
  acceptApplicant,
  toggleWishlist,
  getWishlist,
};
