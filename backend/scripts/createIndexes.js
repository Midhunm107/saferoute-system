// Ensures all Mongoose-declared indexes exist (2dsphere, unique, compound). Safe to re-run.
// See README section 6 (Phase 1: Database & Models).

require('dotenv').config();
const { connectDB, mongoose } = require('../config/db');
const logger = require('../utils/logger');

const User = require('../models/User');
const IncidentReport = require('../models/IncidentReport');
const Hotspot = require('../models/Hotspot');
const Blacklist = require('../models/Blacklist');
const HotspotThreshold = require('../models/HotspotThreshold');

async function createIndexes() {
  await connectDB();

  await Promise.all([
    User.syncIndexes(),
    IncidentReport.syncIndexes(),
    Hotspot.syncIndexes(),
    Blacklist.syncIndexes(),
    HotspotThreshold.syncIndexes(),
  ]);

  logger.info('Indexes created/synced for all collections.');
  await mongoose.disconnect();
  process.exit(0);
}

createIndexes().catch((err) => {
  logger.error('Failed to create indexes:', err.message);
  process.exit(1);
});
