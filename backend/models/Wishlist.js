const mongoose = require('mongoose');

const wishlistSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    userId: { type: String, required: true },
    jobId: { type: String, required: true },
  },
  { timestamps: true, id: false }
);

wishlistSchema.index({ userId: 1, jobId: 1 }, { unique: true });

module.exports = mongoose.model('Wishlist', wishlistSchema);
