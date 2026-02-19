/**
 * Request Security Middleware
 * Protects against bots, abuse, scraping, and common attacks
 * WITHOUT modifying route behavior
 */

const securityMiddleware = require('./security');

// ==================== BOT DETECTION ====================
const detectBot = (req) => {
  const userAgent = req.headers['user-agent'] || '';
  const botPatterns = [
    /bot/i, /crawler/i, /spider/i, /scraper/i,
    /curl/i, /wget/i, /python/i, /java/i,
    /go-http/i, /httpclient/i, /okhttp/i,
  ];
  
  // Allow legitimate mobile apps and browsers
  const allowedPatterns = [
    /mobile/i, /android/i, /ios/i, /iphone/i, /ipad/i,
    /chrome/i, /firefox/i, /safari/i, /edge/i, /opera/i,
    /expo/i, /react-native/i,
  ];
  
  // Check if it's an allowed client
  if (allowedPatterns.some(pattern => pattern.test(userAgent))) {
    return false;
  }
  
  // Check if it's a bot
  return botPatterns.some(pattern => pattern.test(userAgent));
};

// ==================== REQUEST SIZE VALIDATION ====================
const validateRequestSize = (req, res, next) => {
  const contentLength = parseInt(req.headers['content-length'] || '0', 10);
  const maxSize = 10 * 1024 * 1024; // 10MB
  
  if (contentLength > maxSize) {
    securityMiddleware.logSecurityEvent('REQUEST_TOO_LARGE', {
      ip: securityMiddleware.getClientIP(req),
      size: contentLength,
      path: req.path,
    });
    return res.status(413).json({
      success: false,
      message: 'Request payload too large',
    });
  }
  
  next();
};

// ==================== PATH TRAVERSAL PROTECTION ====================
const preventPathTraversal = (req, res, next) => {
  const path = req.path || '';
  
  // Check for path traversal attempts
  if (path.includes('..') || path.includes('//') || path.includes('\\')) {
    securityMiddleware.logSecurityEvent('PATH_TRAVERSAL_ATTEMPT', {
      ip: securityMiddleware.getClientIP(req),
      path: req.path,
    });
    return res.status(400).json({
      success: false,
      message: 'Invalid request path',
    });
  }
  
  next();
};

// ==================== SQL INJECTION PATTERN DETECTION ====================
const detectSQLInjection = (req) => {
  const sqlPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE)\b)/i,
    /(--|\#|\/\*|\*\/|;|'|"|`)/,
    /(\b(OR|AND)\s+\d+\s*=\s*\d+)/i,
    /(\bUNION\b.*\bSELECT\b)/i,
  ];
  
  const checkValue = (value) => {
    if (typeof value === 'string') {
      return sqlPatterns.some(pattern => pattern.test(value));
    }
    if (typeof value === 'object' && value !== null) {
      return Object.values(value).some(checkValue);
    }
    return false;
  };
  
  // Check query params
  if (req.query && checkValue(req.query)) {
    return true;
  }
  
  // Check body
  if (req.body && checkValue(req.body)) {
    return true;
  }
  
  // Check params
  if (req.params && checkValue(req.params)) {
    return true;
  }
  
  return false;
};

// ==================== NO-SQL INJECTION DETECTION ====================
const detectNoSQLInjection = (req) => {
  // Only check for dangerous patterns in STRING values, not in object keys
  // MongoDB operators like $ne, $gt, etc. are legitimate when used in query objects
  // We only want to block them when they appear in user-provided STRING values
  const dangerousPatterns = [
    /\$where/i,  // Most dangerous - allows arbitrary JavaScript
    /javascript:/i,  // XSS attempt
    /\$where.*javascript/i,  // Combined attack
  ];
  
  const checkStringValue = (value) => {
    if (typeof value === 'string') {
      // Only check string values for dangerous patterns
      return dangerousPatterns.some(pattern => pattern.test(value));
    }
    if (typeof value === 'object' && value !== null) {
      // Recursively check nested objects, but allow MongoDB operators in keys
      if (Array.isArray(value)) {
        return value.some(checkStringValue);
      }
      // Check object values (not keys) - MongoDB operators in keys are legitimate
      return Object.values(value).some(checkStringValue);
    }
    return false;
  };
  
  // Only check query string parameters (URL params), not body or params
  // Body and params might contain legitimate MongoDB query objects
  if (req.query) {
    // Check query string values for dangerous patterns
    for (const [key, value] of Object.entries(req.query)) {
      if (typeof value === 'string' && dangerousPatterns.some(pattern => pattern.test(value))) {
        return true;
      }
    }
  }
  
  // For body, only check if it's a string (not an object with MongoDB operators)
  if (req.body && typeof req.body === 'string') {
    if (dangerousPatterns.some(pattern => pattern.test(req.body))) {
      return true;
    }
  }
  
  // For params, check string values
  if (req.params) {
    for (const [key, value] of Object.entries(req.params)) {
      if (typeof value === 'string' && dangerousPatterns.some(pattern => pattern.test(value))) {
        return true;
      }
    }
  }
  
  return false;
};

// ==================== MAIN SECURITY MIDDLEWARE ====================
const requestSecurity = (req, res, next) => {
  const ip = securityMiddleware.getClientIP(req);
  
  // 1. Prevent path traversal
  if (preventPathTraversal(req, res, () => {}) !== undefined) {
    return; // Response already sent
  }
  
  // 2. Validate request size
  validateRequestSize(req, res, () => {
    // 3. Detect bots (log but don't block - might be legitimate)
    if (detectBot(req)) {
      securityMiddleware.logSecurityEvent('BOT_DETECTED', {
        ip,
        userAgent: req.headers['user-agent'],
        path: req.path,
      });
      // Don't block - some bots might be legitimate (search engines, etc.)
    }
    
    // 4. Detect SQL injection attempts
    if (detectSQLInjection(req)) {
      securityMiddleware.logSecurityEvent('SQL_INJECTION_ATTEMPT', {
        ip,
        path: req.path,
      });
      return res.status(400).json({
        success: false,
        message: 'Invalid request parameters',
      });
    }
    
    // 5. Detect NoSQL injection attempts
    if (detectNoSQLInjection(req)) {
      securityMiddleware.logSecurityEvent('NOSQL_INJECTION_ATTEMPT', {
        ip,
        path: req.path,
      });
      return res.status(400).json({
        success: false,
        message: 'Invalid request parameters',
      });
    }
    
    // 6. Track request for abuse detection
    securityMiddleware.trackRequest(req, res, next);
  });
};

module.exports = requestSecurity;
