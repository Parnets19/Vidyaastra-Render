const jwt = require('jsonwebtoken');

// Helper to extract token
function getToken(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  return authHeader.split(' ')[1];
}

// Base verification middleware
const verifyToken = (req, res, next) => {
  const token = getToken(req);
  
  if (!token) {
    return res.status(401).json({ 
      success: false, 
      message: 'Unauthorized: No token provided' 
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'yoursecretkey');
    req.user = decoded; // Attach decoded user to request
    next();
  } catch (err) {
    // Handle different JWT errors specifically
    let message = 'Unauthorized: Invalid token';
    if (err.name === 'TokenExpiredError') {
      message = 'Unauthorized: Token expired';
    } else if (err.name === 'JsonWebTokenError') {
      message = 'Unauthorized: Malformed token';
    }
    
    res.status(401).json({ 
      success: false, 
      message 
    });
  }
};

// Role-based access control middleware generator
const roleAuth = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Unauthorized: No user data' 
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        message: `Forbidden: Requires ${roles.join(' or ')} role` 
      });
    }

    next();
  };
};

// Specific role middlewares (for convenience)
const teacherAuth = [verifyToken, roleAuth('teacher')];
const studentAuth = [verifyToken, roleAuth('student')];
const adminAuth = [verifyToken, roleAuth('admin', 'superadmin')];
const superAdminAuth = [verifyToken, roleAuth('superadmin')];

module.exports = {
  verifyToken,
  roleAuth,
  teacherAuth,
  studentAuth,
  adminAuth,
  superAdminAuth
};