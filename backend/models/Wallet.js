const mongoose = require('mongoose');

const walletSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    userId: { type: String, required: true, unique: true },
    currency: { type: String, default: 'INR' },
    balance: { type: Number, default: 0, min: 0 },
    pinHash: { type: String, default: null },
    hasPin: { type: Boolean, default: false },
    // Brute-force protection for the 4-digit PIN
    pinFailedAttempts: { type: Number, default: 0 },
    pinLockedUntil: { type: Date, default: null },
  },
  { timestamps: true, id: false }
);

module.exports = mongoose.model('Wallet', walletSchema);
