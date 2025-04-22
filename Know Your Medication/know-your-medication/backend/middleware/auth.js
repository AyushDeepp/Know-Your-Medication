const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware to authenticate users
const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    
    if (!user) {
      return res.status(401).json({ message: 'Invalid authentication token' });
    }
    
    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid authentication token' });
  }
};

// Middleware to authorize specific roles
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    // Handle both array and individual role arguments
    const allowedRoles = roles.flat();
    
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: 'You are not authorized to perform this action',
        userRole: req.user.role,
        requiredRoles: allowedRoles
      });
    }
    
    next();
  };
};

// Middleware to check if doctor is approved
const checkDoctorApproval = async (req, res, next) => {
  if (req.user.role === 'doctor' && !req.user.isApproved) {
    return res.status(403).json({ message: 'Your account has not been approved yet' });
  }
  
  next();
};

module.exports = { auth, authorize, checkDoctorApproval }; 