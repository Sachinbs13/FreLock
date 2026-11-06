const bcrypt = require('bcryptjs');
const Wallet = require('../models/Wallet');
const { HttpError } = require('./httpError');

const PIN_PATTERN = /^\d{4}$/;
const MAX_ATTEMPTS = 5;
const LOCK_MINUTES = 15;

const assertPinFormat = (pin, label = 'PIN') => {
  if (!PIN_PATTERN.test(String(pin ?? ''))) {
    throw new HttpError(400, `${label} must be exactly 4 digits`);
  }
};

// Verifies the wallet PIN. Five wrong attempts lock the PIN for 15 minutes.
// Throws HttpError on failure, returns the wallet on success.
const verifyWalletPin = async (userId, pin) => {
  if (pin === undefined || pin === null || pin === '') {
    throw new HttpError(400, 'Wallet PIN is required');
  }

  const wallet = await Wallet.findOne({ userId });
  if (!wallet || !wallet.hasPin) throw new HttpError(400, 'Set up your wallet PIN first');

  if (wallet.pinLockedUntil && wallet.pinLockedUntil > new Date()) {
    const mins = Math.ceil((wallet.pinLockedUntil - Date.now()) / 60000);
    throw new HttpError(423, `Too many wrong PIN attempts. Try again in ${mins} minute(s).`);
  }

  const valid = await bcrypt.compare(String(pin), wallet.pinHash);
  if (!valid) {
    const attempts = wallet.pinFailedAttempts + 1;
    const update = { pinFailedAttempts: attempts };
    if (attempts >= MAX_ATTEMPTS) {
      update.pinFailedAttempts = 0;
      update.pinLockedUntil = new Date(Date.now() + LOCK_MINUTES * 60000);
    }
    await Wallet.updateOne({ userId }, { $set: update });
    const left = MAX_ATTEMPTS - attempts;
    throw new HttpError(
      401,
      left > 0 ? `Invalid PIN. ${left} attempt(s) left.` : `Invalid PIN. Wallet PIN locked for ${LOCK_MINUTES} minutes.`
    );
  }

  if (wallet.pinFailedAttempts > 0 || wallet.pinLockedUntil) {
    await Wallet.updateOne({ userId }, { $set: { pinFailedAttempts: 0, pinLockedUntil: null } });
  }
  return wallet;
};

module.exports = { PIN_PATTERN, assertPinFormat, verifyWalletPin };
