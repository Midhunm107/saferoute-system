// `blacklist` collection model — see README section 4. Implemented in Phase 1 (Database & Models).

const mongoose = require('mongoose');

const blacklistSchema = new mongoose.Schema(
  {
    phone: { type: String, default: null },
    deviceId: { type: String, default: null },
    reason: { type: String, required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

module.exports = mongoose.model('Blacklist', blacklistSchema);
