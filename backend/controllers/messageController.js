const Message = require('../models/Message');
const Job = require('../models/Job');
const User = require('../models/User');
const { newId, HttpError } = require('../utils/httpError');

// Messaging rules (every conversation is between the job poster and one other user):
//  - applicants and the assigned freelancer can always talk to the poster
//  - any freelancer can ask the poster questions while the job is OPEN
//  - an existing thread can always continue
const canMessage = async (job, senderId, receiverId) => {
  if (senderId === receiverId) return false;
  if (senderId !== job.posterId && receiverId !== job.posterId) return false;

  const otherId = senderId === job.posterId ? receiverId : senderId;
  if (job.freelancerId === otherId || (job.applicants || []).includes(otherId)) return true;

  const other = await User.findOne({ id: otherId }).lean();
  if (!other || other.status === 'FROZEN') return false;
  if (job.status === 'OPEN' && other.role === 'Freelancer') return true;

  return Boolean(
    await Message.exists({
      jobId: job.jobId,
      $or: [
        { senderId, receiverId },
        { senderId: receiverId, receiverId: senderId },
      ],
    })
  );
};

const sendMessage = async (req, res) => {
  const { jobId, receiverId } = req.body;
  const content = String(req.body.content || '').trim();
  if (!jobId || !receiverId || typeof jobId !== 'string' || typeof receiverId !== 'string' || !content) {
    throw new HttpError(400, 'jobId, receiverId and a message are required');
  }
  if (content.length > 2000) throw new HttpError(400, 'Message is too long (max 2000 characters)');

  const job = await Job.findOne({ jobId }).lean();
  if (!job) throw new HttpError(404, 'Job not found');
  if (!(await canMessage(job, req.user.id, receiverId))) {
    throw new HttpError(403, 'You can only message the client or freelancers involved in this job');
  }

  const message = await Message.create({
    messageId: newId(),
    jobId,
    senderId: req.user.id,
    receiverId,
    content,
  });

  res.status(201).json({ message: 'Message sent', data: message });
};

const getConversation = async (req, res) => {
  const { jobId, userId } = req.params;

  const [messages, job, otherUser] = await Promise.all([
    Message.find({
      jobId,
      $or: [
        { senderId: req.user.id, receiverId: userId },
        { senderId: userId, receiverId: req.user.id },
      ],
    })
      .sort({ createdAt: 1 })
      .lean(),
    Job.findOne({ jobId }).lean(),
    User.findOne({ id: userId }).lean(),
  ]);

  await Message.updateMany({ jobId, senderId: userId, receiverId: req.user.id, read: false }, { $set: { read: true } });

  res.json({
    messages,
    jobTitle: job?.title || 'Job',
    otherUser: otherUser ? { id: otherUser.id, name: otherUser.name, role: otherUser.role } : null,
  });
};

// One entry per (job, other user) thread, newest first — batched lookups, no N+1 queries.
const getConversations = async (req, res) => {
  const messages = await Message.find({
    $or: [{ senderId: req.user.id }, { receiverId: req.user.id }],
  })
    .sort({ createdAt: -1 })
    .lean();

  const threads = new Map();
  messages.forEach((m) => {
    const otherId = m.senderId === req.user.id ? m.receiverId : m.senderId;
    const key = `${m.jobId}:${otherId}`;
    if (!threads.has(key)) {
      threads.set(key, { jobId: m.jobId, userId: otherId, lastMessage: m.content, lastAt: m.createdAt, unread: 0 });
    }
    if (m.receiverId === req.user.id && !m.read) threads.get(key).unread += 1;
  });

  const list = [...threads.values()];
  const [jobs, users] = await Promise.all([
    Job.find({ jobId: { $in: [...new Set(list.map((t) => t.jobId))] } }).lean(),
    User.find({ id: { $in: [...new Set(list.map((t) => t.userId))] } }).lean(),
  ]);
  const jobMap = Object.fromEntries(jobs.map((j) => [j.jobId, j.title]));
  const userMap = Object.fromEntries(users.map((u) => [u.id, u]));

  res.json(
    list.map((t) => ({
      ...t,
      jobTitle: jobMap[t.jobId] || 'Job',
      userName: userMap[t.userId]?.name || 'User',
      userRole: userMap[t.userId]?.role || '',
    }))
  );
};

module.exports = { sendMessage, getConversation, getConversations };
