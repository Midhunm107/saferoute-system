// Demo data: one user per role, a couple of sample hotspots, default hotspot thresholds.
// See README section 6 (Phase 1: Database & Models).

require('dotenv').config();
const bcrypt = require('bcrypt');
const { connectDB, mongoose } = require('../config/db');
const logger = require('../utils/logger');

const User = require('../models/User');
const Hotspot = require('../models/Hotspot');
const HotspotThreshold = require('../models/HotspotThreshold');

const DEMO_PASSWORD = 'password123';

async function seed() {
  await connectDB();

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);

  await Promise.all([
    User.deleteMany({}),
    Hotspot.deleteMany({}),
    HotspotThreshold.deleteMany({}),
  ]);

  await User.insertMany([
    {
      name: 'Demo Citizen',
      email: 'citizen@saferoute.dev',
      phone: '+10000000001',
      passwordHash,
      role: 'CITIZEN',
    },
    {
      name: 'Demo Police Officer',
      email: 'police@saferoute.dev',
      phone: '+10000000002',
      passwordHash,
      role: 'POLICE',
      location: { type: 'Point', coordinates: [-122.4194, 37.7749] },
    },
    {
      name: 'Demo Ambulance Crew',
      email: 'ambulance@saferoute.dev',
      phone: '+10000000003',
      passwordHash,
      role: 'AMBULANCE',
    },
    {
      name: 'Demo Admin',
      email: 'admin@saferoute.dev',
      phone: '+10000000004',
      passwordHash,
      role: 'ADMIN',
    },
  ]);

  await Hotspot.insertMany([
    {
      center: { type: 'Point', coordinates: [-122.4194, 37.7749] },
      radiusM: 300,
      accidentCount: 5,
      tier: 'YELLOW',
    },
    {
      center: { type: 'Point', coordinates: [-122.4313, 37.7739] },
      radiusM: 300,
      accidentCount: 18,
      tier: 'RED',
    },
  ]);

  await HotspotThreshold.insertMany([
    { tier: 'GREEN', minCount: 1, maxCount: 3 },
    { tier: 'YELLOW', minCount: 4, maxCount: 8 },
    { tier: 'ORANGE', minCount: 9, maxCount: 15 },
    { tier: 'RED', minCount: 16, maxCount: null },
  ]);

  logger.info(`Seed complete. Demo password for all users: ${DEMO_PASSWORD}`);
  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  logger.error('Failed to seed database:', err.message);
  process.exit(1);
});
