// `users` collection model — see README section 4. Implemented in Phase 1 (Database & Models).

const mongoose = require('mongoose');
const geoPointSchema = require('./shared/geoPoint');
const { ROLES } = require('../config/constants');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ROLES, required: true },
    stationId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    location: { type: geoPointSchema, default: null },
    trustScore: { type: Number, default: 100 },
    deviceId: { type: String, default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

userSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('User', userSchema);
