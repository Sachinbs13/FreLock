const Wallet = require('../models/Wallet');
const Transaction = require('../models/Transaction');
const { newId } = require('./httpError');
const { CURRENCY } = require('./money');

// Every movement of money writes one immutable ledger row.
const createTransaction = (from, to, amount, type, relatedId = null) =>
  Transaction.create({
    transactionId: newId(),
    from,
    to,
    amount: Number(amount),
    currency: CURRENCY,
    type,
    relatedId,
  });

const getOrCreateWallet = async (userId) =>
  Wallet.findOneAndUpdate(
    { userId },
    { $setOnInsert: { id: newId(), currency: CURRENCY, balance: 0, hasPin: false } },
    { new: true, upsert: true }
  );

// Returns the updated wallet, or null when the balance is insufficient.
const debitWallet = (userId, amount) =>
  Wallet.findOneAndUpdate(
    { userId, balance: { $gte: amount } },
    { $inc: { balance: -amount } },
    { new: true }
  );

const creditWallet = (userId, amount) =>
  Wallet.findOneAndUpdate(
    { userId },
    {
      $inc: { balance: amount },
      $setOnInsert: { id: newId(), currency: CURRENCY, hasPin: false },
    },
    { new: true, upsert: true }
  );

module.exports = { createTransaction, getOrCreateWallet, debitWallet, creditWallet };
