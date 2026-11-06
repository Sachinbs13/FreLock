const mongoose = require('mongoose');

const ESCROW_STATUSES = ['HELD', 'SUBMITTED', 'RELEASED', 'REFUNDED', 'DISPUTED'];
const ACTIVE_ESCROW_STATUSES = ['HELD', 'SUBMITTED', 'DISPUTED'];

const escrowSchema = new mongoose.Schema(
  {
    escrowId: { type: String, required: true, unique: true },
    jobId: { type: String, required: true, index: true },
    jobPosterId: { type: String, required: true, index: true },
    freelancerId: { type: String, default: null, index: true },
    amount: { type: Number, required: true, min: 1 },
    currency: { type: String, default: 'INR' },
    status: { type: String, enum: ESCROW_STATUSES, default: 'HELD' },
    submissionNote: { type: String, default: '', maxlength: 2000 },
    submittedAt: { type: Date, default: null },
  },
  { timestamps: true, id: false }
);

const Escrow = mongoose.model('Escrow', escrowSchema);

module.exports = Escrow;
module.exports.ESCROW_STATUSES = ESCROW_STATUSES;
module.exports.ACTIVE_ESCROW_STATUSES = ACTIVE_ESCROW_STATUSES;
