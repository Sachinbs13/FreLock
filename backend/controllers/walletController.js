const bcrypt = require('bcryptjs');
const Wallet = require('../models/Wallet');
const User = require('../models/User');
const { HttpError } = require('../utils/httpError');
const { parseAmount, formatINR } = require('../utils/money');
const { createTransaction, getOrCreateWallet, creditWallet } = require('../utils/walletOps');
const { assertPinFormat, verifyWalletPin } = require('../utils/walletPin');

const TOPUP_METHODS = ['UPI', 'CARD', 'NETBANKING'];
const MAX_TOPUP = 1_000_000; // ₹10 lakh per simulated top-up

const publicWallet = (wallet) => ({
  id: wallet.id,
  userId: wallet.userId,
  currency: wallet.currency,
  balance: wallet.balance,
  hasPin: wallet.hasPin,
});

// Admin: all wallets with owner details (never exposes pinHash).
const getWallets = async (req, res) => {
  const wallets = await Wallet.find().select('-pinHash').lean();
  const users = await User.find({ id: { $in: wallets.map((w) => w.userId) } }).lean();
  const userMap = Object.fromEntries(users.map((u) => [u.id, u]));

  res.json(
    wallets.map((w) => ({
      ...publicWallet(w),
      userName: userMap[w.userId]?.name || 'Unknown user',
      userEmail: userMap[w.userId]?.email || '',
      userRole: userMap[w.userId]?.role || '',
    }))
  );
};

const getMyWallet = async (req, res) => {
  const wallet = await getOrCreateWallet(req.user.id);
  res.json(publicWallet(wallet));
};

// Sets the PIN the first time; changing an existing PIN requires the current one.
const setupPin = async (req, res) => {
  const { pin, confirmPin, currentPin } = req.body;
  assertPinFormat(pin);
  if (String(pin) !== String(confirmPin)) throw new HttpError(400, 'PINs do not match');

  const wallet = await getOrCreateWallet(req.user.id);
  if (wallet.hasPin) {
    await verifyWalletPin(req.user.id, currentPin);
  }

  await Wallet.updateOne(
    { userId: req.user.id },
    { $set: { pinHash: await bcrypt.hash(String(pin), 10), hasPin: true, pinFailedAttempts: 0, pinLockedUntil: null } }
  );

  res.json({ message: wallet.hasPin ? 'Wallet PIN changed' : 'Wallet PIN set successfully', hasPin: true });
};

// Simulated top-up (no real payment gateway).
const addMoney = async (req, res) => {
  const amount = parseAmount(req.body.amount, { max: MAX_TOPUP });
  const method = TOPUP_METHODS.includes(req.body.method) ? req.body.method : 'UPI';

  await verifyWalletPin(req.user.id, req.body.pin);
  const wallet = await creditWallet(req.user.id, amount);
  await createTransaction('system', req.user.id, amount, `WALLET_TOPUP_${method}`);

  res.json({
    message: `${formatINR(amount)} added successfully via ${method}`,
    wallet: publicWallet(wallet),
  });
};

// Admin: set a user's balance to an exact value. The difference is recorded
// in the ledger as an ADMIN_ADJUSTMENT so the audit trail stays complete.
const assignBalance = async (req, res) => {
  const { userId } = req.body;
  if (!userId || typeof userId !== 'string') throw new HttpError(400, 'userId is required');
  const target = parseAmount(req.body.amount, { min: 0, field: 'Balance' });

  const user = await User.findOne({ id: userId }).lean();
  if (!user) throw new HttpError(404, 'User not found');
  if (user.role === 'Admin') throw new HttpError(400, 'Admin accounts do not hold a wallet balance');

  const before = await getOrCreateWallet(userId);
  const wallet = await Wallet.findOneAndUpdate(
    { userId },
    { $set: { balance: target, currency: 'INR' } },
    { new: true }
  );

  const delta = Math.round((target - before.balance) * 100) / 100;
  if (delta !== 0) {
    await createTransaction(
      delta > 0 ? 'system' : userId,
      delta > 0 ? userId : 'system',
      Math.abs(delta),
      'ADMIN_ADJUSTMENT'
    );
  }

  res.json({ message: `Balance for ${user.name} set to ${formatINR(target)}`, wallet: publicWallet(wallet) });
};

module.exports = { getWallets, getMyWallet, setupPin, addMoney, assignBalance };
