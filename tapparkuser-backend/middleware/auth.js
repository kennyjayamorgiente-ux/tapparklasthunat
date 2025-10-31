const jwt = require('jsonwebtoken');
const db = require('../config/database');

// Verify JWT token
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token required'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if user still exists and is active
    const user = await db.query(
      'SELECT user_id, email, first_name, last_name FROM users WHERE user_id = ?',
      [decoded.userId]
    );

    if (!user.length) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    // User is valid (no verification check needed for existing users)

    // Add user info to request
    req.user = user[0];
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired'
      });
    }

    // Check for database connection errors
    if (
      error.code === 'ECONNREFUSED' ||
      error.code === 'ETIMEDOUT' ||
      error.code === 'ENOTFOUND' ||
      error.message?.includes('connect ECONNREFUSED') ||
      error.message?.includes('connection') ||
      error.message?.includes('Unable to connect') ||
      error.errno === -61 || // Connection refused (Mac/Linux)
      error.errno === 10061 || // Connection refused (Windows)
      error.sqlState === '08001' || // SQL connection error
      error.sqlState === 'HY000' && error.code === 'ECONNREFUSED'
    ) {
      console.error('Database connection error in auth middleware:', error.message);
      return res.status(503).json({
        success: false,
        message: 'Database connection error. Please ensure the database server is running.',
        errorCode: 'DATABASE_CONNECTION_ERROR'
      });
    }

    console.error('Auth middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Authentication error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Optional authentication (doesn't fail if no token)
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await db.query(
        'SELECT user_id, email, first_name, last_name FROM users WHERE user_id = ?',
        [decoded.userId]
      );

      if (user.length) {
        req.user = user[0];
      }
    }
    
    next();
  } catch (error) {
    // Continue without authentication if token is invalid
    next();
  }
};

// Check if user has sufficient balance
const checkBalance = (requiredAmount = 0) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      const user = await db.query(
        'SELECT hour_balance FROM users WHERE user_id = ?',
        [req.user.user_id]
      );

      if (!user.length) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      if (user[0].hour_balance < requiredAmount) {
        return res.status(400).json({
          success: false,
          message: `Insufficient balance. Required: $${requiredAmount}, Available: $${user[0].hour_balance}`
        });
      }

      req.userBalance = user[0].hour_balance;
      next();
    } catch (error) {
      console.error('Balance check error:', error);
      return res.status(500).json({
        success: false,
        message: 'Balance check failed'
      });
    }
  };
};

// Admin only middleware
const adminOnly = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Check if user is admin (you can modify this logic based on your admin system)
    const isAdmin = req.user.email === 'admin@tapparkuser.com' || req.user.role === 'admin';
    
    if (!isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    next();
  } catch (error) {
    console.error('Admin check error:', error);
    return res.status(500).json({
      success: false,
      message: 'Authorization error'
    });
  }
};

module.exports = {
  authenticateToken,
  optionalAuth,
  checkBalance,
  adminOnly
};
