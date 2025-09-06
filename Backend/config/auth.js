module.exports = {
  jwtSecret: process.env.JWT_SECRET || 'your-secret-key',
  jwtExpire: process.env.JWT_EXPIRE || '7d',
  bcryptSaltRounds: 12,
  roles: {
    OWNER: 'owner',
    MANAGER: 'manager',
    STAFF: 'staff'
  },
  permissions: {
    owner: ['create', 'read', 'update', 'delete', 'manage_users', 'view_reports'],
    manager: ['create', 'read', 'update', 'delete', 'view_reports'],
    staff: ['create', 'read', 'update']
  }
};