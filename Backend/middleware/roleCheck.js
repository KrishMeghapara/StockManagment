const { permissions } = require('../config/auth');

const checkPermission = (requiredPermission) => {
  return (req, res, next) => {
    try {
      const userRole = req.user.role;
      const userPermissions = permissions[userRole] || [];
      
      if (!userPermissions.includes(requiredPermission)) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Insufficient permissions.'
        });
      }
      
      next();
    } catch (error) {
      console.error('Role check error:', error);
      res.status(500).json({
        success: false,
        message: 'Error checking permissions'
      });
    }
  };
};

const checkRole = (allowedRoles) => {
  return (req, res, next) => {
    try {
      if (!allowedRoles.includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Insufficient role privileges.'
        });
      }
      
      next();
    } catch (error) {
      console.error('Role check error:', error);
      res.status(500).json({
        success: false,
        message: 'Error checking role'
      });
    }
  };
};

module.exports = { checkPermission, checkRole };