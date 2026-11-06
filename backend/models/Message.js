const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    messageId: { type: String, required: true, unique: true },
    jobId: { type: String, required: true, index: true },
    senderId: { type: String, required: true, index: true },
    receiverId: { type: String, required: true, index: true },
    content: { type: String, required: true, trim: true, maxlength: 2000 },
    read: { type: Boolean, default: false },
  },
  { timestamps: true, id: false }
);

module.exports = mongoose.model('Message', messageSchema);
