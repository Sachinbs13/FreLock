/**
 * Escrow business-logic test — runs WITHOUT MongoDB or network access.
 *
 *   cd backend && npm test
 *
 * The real controllers are exercised against small in-memory stand-ins for
 * mongoose / bcryptjs / jsonwebtoken (see test/stubs). It covers the full
 * escrow lifecycle, dispute resolution, concurrency (double approval / double
 * resolve) and money conservation.
 */
const Module = require('module');
const path = require('path');

const STUBS = { mongoose: 'mongoose.js', bcryptjs: 'bcryptjs.js', jsonwebtoken: 'jsonwebtoken.js' };
const originalResolve = Module._resolveFilename;
Module._resolveFilename = function resolve(request, ...rest) {
  if (STUBS[request]) return path.join(__dirname, 'stubs', STUBS[request]);
  return originalResolve.call(this, request, ...rest);
};

const B = path.join(__dirname, '..');
const assert = require('assert');
const { HttpError } = require(`${B}/utils/httpError`);
const seedUsers = require(`${B}/utils/seedUsers`);
const User = require(`${B}/models/User`);
const Wallet = require(`${B}/models/Wallet`);
const Escrow = require(`${B}/models/Escrow`);
const Job = require(`${B}/models/Job`);
const Transaction = require(`${B}/models/Transaction`);
const auth = require(`${B}/controllers/authController`);
const wallet = require(`${B}/controllers/walletController`);
const jobs = require(`${B}/controllers/jobController`);
const escrow = require(`${B}/controllers/escrowController`);
const dispute = require(`${B}/controllers/disputeController`);
const msg = require(`${B}/controllers/messageController`);
const hist = require(`${B}/controllers/historyController`);
const admin = require(`${B}/controllers/adminController`);
const { blockOperatorInjection } = require(`${B}/middleware/security`);

const users = {
  admin: { id: 'admin', role: 'Admin', name: 'Platform Admin' },
  client: { id: 'user1', role: 'Client', name: 'Demo Client' },
  fl: { id: 'user2', role: 'Freelancer', name: 'Demo Freelancer' },
  client2: { id: 'user3', role: 'Client', name: 'Demo Client 2' },
};
const call = async (fn, user, body = {}, params = {}, query = {}) => {
  let status = 200, data;
  const res = { status(s) { status = s; return this; }, json(d) { data = d; return this; }, set() { return this; } };
  try { await fn({ user, body, params, query }, res); } catch (e) { if (!(e instanceof HttpError) && !e.name?.includes('Validation')) throw e; status = e.status || 400; data = { error: e.message }; }
  return { status, data };
};
const bal = async (id) => (await Wallet.findOne({ userId: id }).lean())?.balance ?? 0;
const totalMoney = async () => {
  const w = (await Wallet.find({}).lean()).reduce((s, x) => s + x.balance, 0);
  const e = (await Escrow.find({ status: { $in: ['HELD', 'SUBMITTED', 'DISPUTED'] } }).lean()).reduce((s, x) => s + x.amount, 0);
  return w + e;
};
let passed = 0;
const ok = (cond, label) => { assert.ok(cond, label); passed++; console.log('  ✓', label); };
const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);

(async () => {
  await seedUsers();
  console.log('Auth');
  let r = await call(auth.login, null, { email: 'client@escrow.com', password: 'client123', role: 'Client' });
  ok(r.status === 200 && r.data.token, 'demo client can log in');
  r = await call(auth.login, null, { email: 'client@escrow.com', password: 'client123', role: 'Freelancer' });
  ok(r.status === 401, 'wrong role rejected');
  r = await call(auth.register, null, { email: 'bad', password: 'secret1', role: 'Client' });
  ok(r.status === 400, 'invalid email rejected on register');
  r = await call(auth.register, null, { email: 'x@y.com', password: 'secret1', role: 'Admin' });
  ok(r.status === 400, 'cannot self-register as Admin');

  console.log('Wallet & PIN');
  r = await call(wallet.setupPin, users.client, { pin: '12a4', confirmPin: '12a4' });
  ok(r.status === 400, 'non-numeric PIN rejected');
  await call(wallet.setupPin, users.client, { pin: '1234', confirmPin: '1234' });
  await call(wallet.setupPin, users.fl, { pin: '4321', confirmPin: '4321' });
  r = await call(wallet.setupPin, users.client, { pin: '9999', confirmPin: '9999' });
  ok(r.status === 400, 'changing PIN without current PIN rejected');
  r = await call(wallet.addMoney, users.client, { amount: 50000, pin: 1234, method: 'UPI' });
  ok(r.status === 200 && (await bal('user1')) === 50000, 'top-up works (numeric PIN accepted)');
  r = await call(wallet.addMoney, users.client, { amount: -5, pin: '1234' });
  ok(r.status === 400, 'negative top-up rejected');
  r = await call(wallet.assignBalance, users.admin, { userId: 'user3', amount: -100 });
  ok(r.status === 400, 'admin cannot assign negative balance');
  r = await call(wallet.assignBalance, users.admin, { userId: 'user3', amount: 1000 });
  const adj = await Transaction.findOne({ type: 'ADMIN_ADJUSTMENT' }).lean();
  ok(r.status === 200 && adj && adj.amount === 1000, 'admin adjustment is recorded in ledger');
  r = await call(wallet.getWallets, users.admin);
  ok(r.data.every((w) => !('pinHash' in w)) && r.data[0].userName, 'admin wallet list hides pinHash, shows names');

  console.log('Job posting');
  r = await call(jobs.createJob, users.client, { title: 'T', description: 'D', budget: 999999, deadline: tomorrow, pin: '1234' });
  ok(r.status === 400 && (await Job.countDocuments({})) === 0, 'insufficient balance → no orphan job');
  r = await call(jobs.createJob, users.client, { title: 'T', description: 'D', budget: 100, deadline: '2020-01-01', pin: '1234' });
  ok(r.status === 400, 'past deadline rejected');
  r = await call(jobs.createJob, users.client, { title: 'Build dashboard', description: 'React work', budget: 20000, deadline: tomorrow, pin: '1234', jobLinks: ['https://a.com', 'javascript:alert(1)'] });
  ok(r.status === 201 && (await bal('user1')) === 30000, 'job posted, ₹20,000 moved to escrow');
  ok(r.data.job.jobLinks.length === 1, 'non-http links stripped');
  const jobId = r.data.job.jobId, escrowId = r.data.escrow.escrowId;
  r = await call(jobs.updateJob, users.client, { budget: 1 }, { id: jobId });
  ok(r.status === 400, 'budget cannot be edited after escrow lock');
  const before = await totalMoney();

  console.log('Messaging');
  r = await call(msg.sendMessage, users.fl, { jobId, receiverId: 'user1', content: 'Question before applying?' });
  ok(r.status === 201, 'freelancer can message client BEFORE applying (was 403)');
  r = await call(msg.sendMessage, users.client, { jobId, receiverId: 'user2', content: 'Sure, ask away' });
  ok(r.status === 201, 'client can reply');
  r = await call(msg.sendMessage, users.client2, { jobId, receiverId: 'user2', content: 'hijack' });
  ok(r.status === 403, 'unrelated client cannot use the job thread');
  r = await call(msg.getConversations, users.client);
  ok(r.data.length === 1 && r.data[0].unread === 1, 'conversation list with unread count');

  console.log('Apply / accept');
  r = await call(jobs.applyJob, users.fl, {}, { id: jobId });
  ok(r.status === 200, 'freelancer applies');
  r = await call(jobs.applyJob, users.fl, {}, { id: jobId });
  ok(r.status === 400, 'double apply rejected');
  r = await call(jobs.acceptApplicant, users.client, { freelancerId: 'user3' }, { id: jobId });
  ok(r.status === 400, 'cannot accept non-applicant');
  r = await call(jobs.acceptApplicant, users.client, { freelancerId: 'user2' }, { id: jobId });
  ok(r.status === 200 && (await Escrow.findOne({ escrowId }).lean()).freelancerId === 'user2', 'accepted; escrow linked to freelancer');
  r = await call(dispute.cancelJob, users.client, { escrowId });
  ok(r.status === 400, 'cannot cancel+refund after freelancer assigned');
  r = await call(jobs.deleteJob, users.client, {}, { id: jobId });
  ok(r.status === 400, 'cannot delete assigned job');

  console.log('Submit / approve (with race)');
  r = await call(escrow.approveWork, users.client, { escrowId, pin: '1234' });
  ok(r.status === 400, 'cannot approve before submission');
  r = await call(escrow.submitWork, users.fl, { escrowId, note: 'Delivered: https://github.com/x' });
  ok(r.status === 200 && r.data.escrow.submissionNote.includes('github'), 'work submitted with note');
  r = await call(escrow.approveWork, users.client, { escrowId, pin: '0000' });
  ok(r.status === 401, 'wrong PIN on approve rejected');
  const results = await Promise.all([1, 2, 3].map(() => call(escrow.approveWork, users.client, { escrowId, pin: '1234' })));
  ok(results.filter((x) => x.status === 200).length === 1, 'three concurrent approvals → exactly one payout');
  ok((await bal('user2')) === 20000, 'freelancer received ₹20,000 exactly once');
  ok((await Job.findOne({ jobId }).lean()).status === 'COMPLETED', 'job marked COMPLETED');
  ok((await totalMoney()) === before, 'money conserved (wallets + active escrow)');
  r = await call(dispute.raiseDispute, users.client, { escrowId, reason: 'I want my money back now' });
  ok(r.status === 400, 'cannot dispute an already RELEASED escrow');

  console.log('Dispute flow');
  r = await call(jobs.createJob, users.client, { title: 'Logo', description: 'Design', budget: 5000, deadline: tomorrow, pin: '1234' });
  const j2 = r.data.job.jobId, e2 = r.data.escrow.escrowId;
  await call(jobs.applyJob, users.fl, {}, { id: j2 });
  await call(jobs.acceptApplicant, users.client, { freelancerId: 'user2' }, { id: j2 });
  r = await call(dispute.raiseDispute, users.client2, { escrowId: e2, reason: 'not mine but whatever' });
  ok(r.status === 403, 'outsider cannot raise dispute');
  r = await call(dispute.raiseDispute, users.client, { escrowId: e2, reason: 'Freelancer went silent for 2 weeks' });
  ok(r.status === 201, 'client raises dispute');
  const d2 = r.data.dispute.disputeId;
  r = await call(dispute.getAllDisputes, users.admin);
  ok(r.data[0].jobTitle === 'Logo' && r.data[0].client.name === 'Demo Client', 'admin sees enriched dispute list');
  const m0 = await totalMoney();
  r = await call(dispute.resolveDispute, users.admin, { disputeId: d2, winnerId: 'user3', resolution: 'steal' });
  ok(r.status === 400 && (await bal('user3')) === 1000, 'admin cannot pay a third party (was possible before)');
  const c0 = await bal('user1');
  const rs = await Promise.all([1, 2].map(() => call(dispute.resolveDispute, users.admin, { disputeId: d2, winnerId: 'user1', resolution: 'Refund' })));
  ok(rs.filter((x) => x.status === 200).length === 1, 'concurrent double-resolve → one resolution');
  ok((await bal('user1')) === c0 + 5000, 'client refunded exactly once');
  ok((await totalMoney()) === m0, 'money conserved through dispute');
  ok((await Job.findOne({ jobId: j2 }).lean()).status === 'CANCELLED', 'job cancelled after client wins');

  console.log('Delete open job refunds poster (even when admin deletes)');
  r = await call(jobs.createJob, users.client, { title: 'Temp', description: 'x', budget: 1000, deadline: tomorrow, pin: '1234' });
  const c1 = await bal('user1');
  r = await call(jobs.deleteJob, users.admin, {}, { id: r.data.job.jobId });
  ok(r.status === 200 && (await bal('user1')) === c1 + 1000 && (await bal('admin')) === 0, 'refund goes to poster, not admin');

  console.log('PIN brute-force lockout');
  for (let i = 0; i < 5; i++) await call(wallet.addMoney, users.fl, { amount: 1, pin: '0000' });
  r = await call(wallet.addMoney, users.fl, { amount: 1, pin: '4321' });
  ok(r.status === 423, 'correct PIN refused while locked after 5 failures');

  console.log('Injection guard');
  let blocked = false;
  blockOperatorInjection({ body: { escrowId: { $ne: null } }, query: {}, params: {} }, { status() { blocked = true; return this; }, json() { } }, () => { });
  ok(blocked, '{"$ne": null} payload rejected');

  console.log('History & stats');
  r = await call(hist.getMyTransactions, users.fl);
  ok(r.data.some((t) => t.type === 'PAYMENT_RELEASE' && t.fromName === 'Escrow' && t.toName === 'Demo Freelancer'), 'history shows names');
  r = await call(admin.getStats, users.admin);
  ok(r.data.openDisputes === 0 && r.data.escrowHeld === 0 && r.data.clients === 2, 'admin stats aggregate correctly');

  console.log(`\nAll ${passed} checks passed.`);
})().catch((e) => { console.error('\nFAILED:', e.message); process.exit(1); });
