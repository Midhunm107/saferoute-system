// Mirrors backend/config/constants.js ROLES — kept in sync manually since frontend and
// backend don't share a package.

export const ROLES = ['CITIZEN', 'POLICE', 'AMBULANCE', 'ADMIN'];

export const ROLE_DASHBOARD_PATH = {
  CITIZEN: '/citizen',
  POLICE: '/police',
  AMBULANCE: '/ambulance',
  ADMIN: '/admin',
};
