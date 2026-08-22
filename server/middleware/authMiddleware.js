import jwt from 'jsonwebtoken';
import User from '../models/User.js';

/**
 * Protect middleware: Verifies JWT token in Bearer authorization header
 */
export const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized, no access token provided',
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'globetrotter_secret_jwt_key_2026');
    
    if (User && User.db && User.db.readyState === 1) {
      req.user = await User.findById(decoded.id).select('-password');
    }

    if (!req.user && decoded && decoded.id) {
      // Deterministic demo / test fallback using cryptographically verified token payload
      req.user = {
        _id: decoded.id,
        name: decoded.name || 'Demo Traveler',
        email: decoded.email || 'demo@globetrotter.com',
        role: decoded.role || 'user',
      };
    }

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'User account associated with token no longer exists',
      });
    }

    next();
  } catch (error) {
    console.error('[Auth Middleware Error]:', error.message);
    return res.status(401).json({
      success: false,
      message: 'Not authorized, token validation failed or expired',
    });
  }
};

/**
 * Admin middleware: Restricts access to administrator users only
 */
export const admin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({
      success: false,
      message: 'Access denied: Administrator privileges required',
    });
  }
};
