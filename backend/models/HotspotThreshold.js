// `hotspotThresholds` collection model — see README section 4. Implemented in Phase 1
// (Database & Models).

const mongoose = require('mongoose');
const { HOTSPOT_TIER } = require('../config/constants');

const hotspotThresholdSchema = new mongoose.Schema({
  tier: { type: String, enum: HOTSPOT_TIER, required: true, unique: true },
  minCount: { type: Number, required: true },
  maxCount: { type: Number, default: null },
});

module.exports = mongoose.model('HotspotThreshold', hotspotThresholdSchema);
