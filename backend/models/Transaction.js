const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema(
  {
    transactionId: { type: String, required: true, unique: true },
    from: { type: String, required: true, index: true },
    to: { type: String, required: true, index: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'INR' },
    type: { type: String, required: true },
    relatedId: { type: String, default: null },
  },
  { timestamps: true, id: false }
);

module.exports = mongoose.model('Transaction', transactionSchema);
