const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    role: { type: String, required: true, enum: ['Admin', 'Client', 'Freelancer'] },
    name: { type: String, required: true, trim: true, maxlength: 80 },
    status: { type: String, default: 'ACTIVE', enum: ['ACTIVE', 'FROZEN'] },
  },
  { timestamps: true, id: false }
);

module.exports = mongoose.model('User', userSchema);
