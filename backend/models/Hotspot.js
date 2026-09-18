// `hotspots` collection model — see README section 4. Implemented in Phase 1 (Database & Models).

const mongoose = require('mongoose');
const geoPointSchema = require('./shared/geoPoint');
const { HOTSPOT_TIER } = require('../config/constants');

const hotspotSchema = new mongoose.Schema({
  center: { type: geoPointSchema, required: true },
  radiusM: { type: Number, required: true, default: 300 },
  accidentCount: { type: Number, default: 0 },
  tier: { type: String, enum: HOTSPOT_TIER, default: 'GREEN' },
  lastUpdated: { type: Date, default: Date.now },
});

hotspotSchema.index({ center: '2dsphere' });

module.exports = mongoose.model('Hotspot', hotspotSchema);
