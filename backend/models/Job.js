const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema(
  {
    jobId: { type: String, required: true, unique: true },
    posterId: { type: String, required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, required: true, trim: true, maxlength: 5000 },
    jobLinks: [{ type: String }],
    projectLinks: [{ type: String }],
    privacyLevel: { type: String, enum: ['PUBLIC', 'PRIVATE', 'CONFIDENTIAL'], default: 'PUBLIC' },
    securityNotes: { type: String, default: '', maxlength: 2000 },
    budget: { type: Number, required: true, min: 1 },
    currency: { type: String, default: 'INR' },
    reward: { type: String, default: '', maxlength: 200 },
    deadline: { type: String, required: true },
    status: { type: String, enum: ['OPEN', 'ASSIGNED', 'COMPLETED', 'CANCELLED'], default: 'OPEN', index: true },
    freelancerId: { type: String, default: null },
    applicants: [{ type: String }],
  },
  { timestamps: true, id: false }
);

module.exports = mongoose.model('Job', jobSchema);
