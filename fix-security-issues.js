const fs = require('fs');
const path = require('path');

const indexJsPath = path.join(__dirname, 'index.js');

console.log('Reading index.js file...');
let content = fs.readFileSync(indexJsPath, 'utf8');

console.log(`File size: ${content.length} characters`);
let changesMade = 0;

// ============================================================================
// FIX 1: Add JWT Authentication to Socket.io
// ============================================================================
console.log('\n=== FIX 1: Socket.io JWT Authentication ===');

// Check if Socket.io is initialized
const socketIoInitPattern = /const\s+io\s*=\s*new\s+Server\s*\([^)]+\)\s*;/;
const hasSocketIo = socketIoInitPattern.test(content);

if (hasSocketIo) {
  console.log('Found Socket.io initialization');
  
  // Check if authentication middleware already exists
  const hasAuthMiddleware = /io\.use\s*\([^)]*authenticateToken|io\.use\s*\([^)]*jwt|io\.use\s*\([^)]*token/i.test(content);
  
  if (!hasAuthMiddleware) {
    // Find the io initialization line
    const ioMatch = content.match(socketIoInitPattern);
    if (ioMatch) {
      const ioInitEnd = content.indexOf(ioMatch[0]) + ioMatch[0].length;
      
      // Check if jwt and secretKey are available
      const hasJwt = /require\s*\(\s*['"]jsonwebtoken['"]|const\s+jwt\s*=|jwt\s*=\s*require/i.test(content);
      const hasSecretKey = /secretKey|JWT_SECRET|process\.env\.JWT_SECRET/i.test(content);
      
      if (hasJwt && hasSecretKey) {
        const authMiddleware = `

// ==================== SOCKET.IO JWT AUTHENTICATION ====================
// Rate limiting for socket connections per IP
const socketConnectionAttempts = new Map();
const SOCKET_RATE_LIMIT = 10; // Max 10 connections per IP per minute
const SOCKET_RATE_WINDOW = 60 * 1000; // 1 minute

io.use((socket, next) => {
  const clientIp = socket.handshake.address || socket.request.connection.remoteAddress || 'unknown';
  const now = Date.now();
  
  // Clean up old entries
  for (const [ip, attempts] of socketConnectionAttempts.entries()) {
    socketConnectionAttempts.set(ip, attempts.filter(time => now - time < SOCKET_RATE_WINDOW));
    if (socketConnectionAttempts.get(ip).length === 0) {
      socketConnectionAttempts.delete(ip);
    }
  }
  
  // Check rate limit
  const attempts = socketConnectionAttempts.get(clientIp) || [];
  if (attempts.length >= SOCKET_RATE_LIMIT) {
    if (process.env.NODE_ENV !== 'production') {
      console.log('Socket.io rate limit exceeded for IP: ' + clientIp);
    }
    return next(new Error('Too many connection attempts. Please try again later.'));
  }
  
  // Track connection attempt
  attempts.push(now);
  socketConnectionAttempts.set(clientIp, attempts);
  
  // JWT Authentication
  const token = socket.handshake.auth?.token || socket.handshake.query?.token;
  
  if (!token) {
    if (process.env.NODE_ENV !== 'production') {
      console.log('Socket.io connection rejected: No token provided');
    }
    return next(new Error('Authentication token required'));
  }
  
  try {
    const jwt = require('jsonwebtoken');
    const secretKey = process.env.JWT_SECRET_KEY || secretKey;
    const decoded = jwt.verify(token, secretKey);
    socket.userId = decoded.userId;
    socket.userRole = decoded.role;
    next();
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.log('Socket.io connection rejected: Invalid token', error.message);
    }
    return next(new Error('Invalid authentication token'));
  }
});
// ==================== END SOCKET.IO AUTHENTICATION ====================
`;
        
        content = content.slice(0, ioInitEnd) + authMiddleware + content.slice(ioInitEnd);
        changesMade++;
        console.log('✅ Added Socket.io JWT authentication middleware');
      } else {
        console.log('⚠️  JWT or secretKey not found. Please ensure JWT is set up.');
      }
    }
  } else {
    console.log('✅ Socket.io authentication middleware already exists');
  }
} else {
  console.log('⚠️  Socket.io initialization not found');
}

// ============================================================================
// FIX 2: Add Rate Limiting to /admin-contact endpoint
// ============================================================================
console.log('\n=== FIX 2: /admin-contact Rate Limiting ===');

// Check if rate limiter already exists
const hasContactRateLimiter = /contactRateLimiter|adminContactRateLimiter/i.test(content);

if (!hasContactRateLimiter) {
  // Find where rate limiters are defined
  const rateLimitPattern = /(const\s+\w+RateLimiter\s*=\s*rateLimit\s*\([^)]+\)\s*;)/;
  const rateLimitMatch = content.match(rateLimitPattern);
  
  if (rateLimitMatch) {
    const insertPos = content.indexOf(rateLimitMatch[0]) + rateLimitMatch[0].length;
    const contactRateLimiter = `
// Rate limiter for /admin-contact endpoint
const contactRateLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 5, // 5 requests per 10 minutes
  message: 'Too many requests to admin contact endpoint. Please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
`;
    content = content.slice(0, insertPos) + contactRateLimiter + content.slice(insertPos);
    changesMade++;
    console.log('✅ Added contactRateLimiter');
  } else {
    console.log('⚠️  No rate limiter found. Adding at top of route definitions...');
    // Try to find app.get or app.post to insert before
    const routePattern = /(app\.(get|post|put|delete)\s*\()/;
    const routeMatch = content.match(routePattern);
    if (routeMatch) {
      const insertPos = content.indexOf(routeMatch[0]);
      const contactRateLimiter = `
// Rate limiter for /admin-contact endpoint
const contactRateLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 5, // 5 requests per 10 minutes
  message: 'Too many requests to admin contact endpoint. Please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

`;
      content = content.slice(0, insertPos) + contactRateLimiter + content.slice(insertPos);
      changesMade++;
      console.log('✅ Added contactRateLimiter');
    }
  }
}

// Now add rate limiter and auth to the endpoint
const adminContactRoutePattern = /app\.get\s*\(\s*["']\/admin-contact["']\s*,\s*(?!.*contactRateLimiter)(?!.*rateLimit)/i;

if (adminContactRoutePattern.test(content)) {
  const match = content.match(adminContactRoutePattern);
  if (match) {
    const beforeHandler = match[0];
    const needsAuth = !/authenticateToken/.test(content.substring(content.indexOf(match[0]), content.indexOf(match[0]) + 500));
    
    if (needsAuth && hasContactRateLimiter) {
      content = content.replace(
        adminContactRoutePattern,
        'app.get("/admin-contact", contactRateLimiter, authenticateToken, '
      );
      changesMade++;
      console.log('✅ Added rate limiting and authentication to /admin-contact endpoint');
    } else if (hasContactRateLimiter) {
      content = content.replace(
        adminContactRoutePattern,
        'app.get("/admin-contact", contactRateLimiter, '
      );
      changesMade++;
      console.log('✅ Added rate limiting to /admin-contact endpoint');
    }
  }
} else {
  console.log('✅ /admin-contact endpoint already has rate limiting or not found');
}

// ============================================================================
// FIX 3: Wrap console.log statements in production checks
// ============================================================================
console.log('\n=== FIX 3: Production Console.log Wrapping ===');

// Wrap console.log statements that are likely to be hit by bots
const logPatterns = [
  {
    name: 'Socket.io logs',
    pattern: /(console\.log\s*\([^)]*socket[^)]*\)\s*;)/gi,
  },
  {
    name: 'Admin contact logs',
    pattern: /(console\.log\s*\([^)]*admin[^)]*contact[^)]*\)\s*;)/gi,
  },
  {
    name: 'Ad update/fetch logs',
    pattern: /(console\.log\s*\([^)]*(ad|fetch|update|status)[^)]*\)\s*;)/gi,
  },
];

let logsWrapped = 0;
logPatterns.forEach(section => {
  const matches = [...content.matchAll(section.pattern)];
  matches.forEach(match => {
    const logStatement = match[0];
    // Check if already wrapped
    if (!/process\.env\.NODE_ENV\s*!==\s*['"]production['"]/.test(logStatement)) {
      const wrapped = `if (process.env.NODE_ENV !== 'production') { ${logStatement} }`;
      content = content.replace(logStatement, wrapped);
      logsWrapped++;
      changesMade++;
    }
  });
  if (matches.length > 0) {
    console.log(`✅ Wrapped ${matches.length} console.log statements in ${section.name}`);
  }
});

if (logsWrapped === 0) {
  console.log('ℹ️  No console.log statements found to wrap (may already be wrapped)');
}

// ============================================================================
// Write changes
// ============================================================================
if (changesMade > 0) {
  // Create backup
  const backupPath = indexJsPath + '.backup.' + Date.now();
  fs.writeFileSync(backupPath, fs.readFileSync(indexJsPath));
  console.log(`\n📦 Backup created: ${backupPath}`);
  
  // Write modified content
  fs.writeFileSync(indexJsPath, content);
  console.log(`✅ Applied ${changesMade} fixes to index.js`);
  console.log('\n🎉 All security fixes applied successfully!');
} else {
  console.log('\nℹ️  No changes needed - fixes may already be applied');
}

console.log('\nDone!');
