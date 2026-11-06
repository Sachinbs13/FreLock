const mongoose = require('mongoose');

// Previously stored in storage/disputes.json — now a proper collection.
const disputeSchema = new mongoose.Schema(
  {
    disputeId: { type: String, required: true, unique: true },
    escrowId: { type: String, required: true, index: true },
    jobId: { type: String, required: true },
    raisedBy: { type: String, required: true },
    reason: { type: String, required: true, trim: true, maxlength: 2000 },
    status: { type: String, enum: ['OPEN', 'RESOLVED'], default: 'OPEN', index: true },
    // Escrow status before the dispute (HELD or SUBMITTED), for the record
    previousEscrowStatus: { type: String, default: null },
    resolution: { type: String, default: '', maxlength: 2000 },
    winnerId: { type: String, default: null },
    resolvedBy: { type: String, default: null },
    resolvedAt: { type: Date, default: null },
  },
  { timestamps: true, id: false }
);

module.exports = mongoose.model('Dispute', disputeSchema);
