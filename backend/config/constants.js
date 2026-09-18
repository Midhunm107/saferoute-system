// Shared constants for the backend — see README section 4 (Data Models).

module.exports = {
  ROLES: ['CITIZEN', 'POLICE', 'AMBULANCE', 'ADMIN'],
  SEVERITY: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
  REPORT_STATUS: ['PENDING', 'VERIFIED', 'REJECTED'],
  HOTSPOT_TIER: ['GREEN', 'YELLOW', 'ORANGE', 'RED'],
};
