const fs = require('fs');
const path = require('path');

const indexJsPath = path.join(__dirname, 'index.js');

console.log('Reading index.js file...');
let content = fs.readFileSync(indexJsPath, 'utf8');

console.log(`File size: ${content.length} characters`);

let changesMade = 0;

// Fix 1: Add JWT authentication to Socket.io
// Find: const io = new Server(server, { cors: { origin: [...] } });
// Add: io.use() middleware for JWT authentication

const socketIoPattern = /const\s+io\s*=\s*new\s+Server\s*\(\s*server\s*,\s*\{[^}]*cors\s*:\s*\{[^}]*origin[^}]*\}[^}]*\}\)\s*;/;

if (socketIoPattern.test(content)) {
  console.log('Found Socket.io initialization');
  
  // Check if authentication middleware already exists
  const hasAuthMiddleware = /io\.use\s*\([^)]*authenticateToken|io\.use\s*\([^)]*jwt|io\.use\s*\([^)]*token/i.test(content);
  
  if (!hasAuthMiddleware) {
    // Find the line after io initialization
    const ioMatch = content.match(socketIoPattern);
    if (ioMatch) {
      const ioInitEnd = content.indexOf(ioMatch[0]) + ioMatch[0].length;
      
      // Find authenticateToken function (should exist in the file)
      const hasAuthFunction = /function\s+authenticateToken|const\s+authenticateToken|authenticateToken\s*=\s*function/i.test(content);
      
      if (hasAuthFunction) {
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
      console.log(`🚫 Socket.io rate limit exceeded for IP: ${clientIp}`);
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
      console.log('🚫 Socket.io connection rejected: No token provided');
    }
    return next(new Error('Authentication token required'));
  }
  
  try {
    const decoded = jwt.verify(token, secretKey);
    socket.userId = decoded.userId;
    socket.userRole = decoded.role;
    next();
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.log('🚫 Socket.io connection rejected: Invalid token', error.message);
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
        console.log('⚠️  authenticateToken function not found. Please ensure JWT authentication is set up.');
      }
    }
  } else {
    console.log('✅ Socket.io authentication middleware already exists');
  }
} else {
  console.log('⚠️  Socket.io initialization pattern not found');
}

// Fix 2: Add rate limiting to /admin-contact endpoint
// Find: app.get("/admin-contact" or app.get('/admin-contact'

const adminContactPattern = /app\.get\s*\(\s*["']\/admin-contact["']\s*,\s*(?!.*rateLimit|.*contactRateLimiter)/i;

if (adminContactPattern.test(content)) {
  console.log('Found /admin-contact endpoint');
  
  // Check if rate limiter already exists
  const hasContactRateLimiter = /contactRateLimiter|adminContactRateLimiter/i.test(content);
  
  if (!hasContactRateLimiter) {
    // Find where rate limiters are defined (usually near top with other rate limiters)
    const rateLimiterPattern = /(const\s+\w+RateLimiter\s*=\s*rateLimit\s*\([^)]+\)\s*;)/;
    const rateLimiterMatch = content.match(rateLimiterPattern);
    
    if (rateLimiterMatch) {
      const insertPos = content.indexOf(rateLimiterMatch[0]) + rateLimiterMatch[0].length;
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
  
  // Now add rate limiter and auth to the endpoint
  const adminContactRoutePattern = /(app\.get\s*\(\s*["']\/admin-contact["']\s*,\s*)(async\s*\([^)]*\)\s*=>|function)/i;
  
  if (adminContactRoutePattern.test(content)) {
    const match = content.match(adminContactRoutePattern);
    if (match) {
      const beforeHandler = match[1];
      const needsAuth = !/authenticateToken/.test(content.substring(content.indexOf(match[0]), content.indexOf(match[0]) + 500));
      
      if (needsAuth) {
        // Check if authenticateToken function exists
        const hasAuthFunction = /function\s+authenticateToken|const\s+authenticateToken|authenticateToken\s*=\s*function/i.test(content);
        
        if (hasAuthFunction) {
          content = content.replace(
            adminContactRoutePattern,
            `$1contactRateLimiter, authenticateToken, $2`
          );
          changesMade++;
          console.log('✅ Added rate limiting and authentication to /admin-contact endpoint');
        } else {
          console.log('⚠️  authenticateToken function not found');
        }
      } else {
        // Auth exists, just add rate limiter
        content = content.replace(
          adminContactRoutePattern,
          `$1contactRateLimiter, $2`
        );
        changesMade++;
        console.log('✅ Added rate limiting to /admin-contact endpoint');
      }
    }
  }
} else {
  console.log('✅ /admin-contact endpoint already has rate limiting or not found');
}

// Fix 3: Wrap console.log statements in production checks
// This is more complex - we'll wrap common patterns

const consoleLogPatterns = [
  // Pattern 1: console.log('text', variable)
  /(console\.log\s*\([^)]+\)\s*;)/g,
  // Pattern 2: console.log(`template`)
  /(console\.log\s*\([^)]+\)\s*;)/g,
];

// More targeted approach: wrap console.log in specific sections
// We'll wrap logs that are likely to be hit by bots

const sectionsToFix = [
  {
    name: 'Socket.io connection logs',
    pattern: /(console\.log\s*\([^)]*socket[^)]*\)\s*;)/gi,
  },
  {
    name: 'Admin contact logs',
    pattern: /(console\.log\s*\([^)]*admin[^)]*contact[^)]*\)\s*;)/gi,
  },
  {
    name: 'Ad update logs',
    pattern: /(console\.log\s*\([^)]*ad[^)]*(update|fetch|status)[^)]*\)\s*;)/gi,
  },
];

sectionsToFix.forEach(section => {
  const matches = [...content.matchAll(section.pattern)];
  matches.forEach(match => {
    const logStatement = match[0];
    // Check if already wrapped
    if (!/process\.env\.NODE_ENV\s*!==\s*['"]production['"]/.test(logStatement)) {
      const wrapped = `if (process.env.NODE_ENV !== 'production') { ${logStatement} }`;
      content = content.replace(logStatement, wrapped);
      changesMade++;
    }
  });
  if (matches.length > 0) {
    console.log(`✅ Wrapped ${matches.length} console.log statements in ${section.name}`);
  }
});

// Write the modified content back
if (changesMade > 0) {
  // Create backup
  const backupPath = indexJsPath + '.backup.' + Date.now();
  fs.writeFileSync(backupPath, fs.readFileSync(indexJsPath));
  console.log(`📦 Backup created: ${backupPath}`);
  
  // Write modified content
  fs.writeFileSync(indexJsPath, content);
  console.log(\`✅ Applied \${changesMade} fixes to index.js\`);
} else {
  console.log('ℹ️  No changes needed - fixes may already be applied');
}

console.log('Done!');
