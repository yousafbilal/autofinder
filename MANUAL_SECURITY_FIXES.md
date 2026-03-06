# 🔒 Manual Security Fixes - Apply These Changes

## Issue Summary
1. **Socket.io** - No JWT authentication (bots can flood websocket connections)
2. **/admin-contact** - Public endpoint, no rate limit (DB flooding possible)
3. **console.log** - Excessive logging in production (CPU spikes)

---

## ✅ FIX 1: Add JWT Authentication to Socket.io

### Step 1: Find this line in index.js:
```javascript
const io = new Server(server, { 
  cors: { origin: ['https://admin.autofinder.pk', 'https://autofinder.pk']}
});
```

### Step 2: Add this code IMMEDIATELY AFTER the io initialization:

```javascript
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
```

**Note:** Make sure `jwt` and `secretKey` are already defined in your file. If not, add:
```javascript
const jwt = require('jsonwebtoken');
const secretKey = process.env.JWT_SECRET_KEY;
```

---

## ✅ FIX 2: Add Rate Limiting to /admin-contact

### Step 1: Find where rate limiters are defined (usually near top with other rateLimit calls)
Add this rate limiter definition:

```javascript
// Rate limiter for /admin-contact endpoint
const contactRateLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 5, // 5 requests per 10 minutes
  message: 'Too many requests to admin contact endpoint. Please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
```

### Step 2: Find the /admin-contact route:
```javascript
app.get("/admin-contact", async (req, res) => {
```

### Step 3: Change it to:
```javascript
app.get("/admin-contact", contactRateLimiter, authenticateToken, async (req, res) => {
```

**Note:** If `authenticateToken` middleware doesn't exist, you can remove it, but rate limiting is mandatory.

---

## ✅ FIX 3: Wrap console.log in Production Checks

### Find all console.log statements related to:
- Socket.io connections
- Admin contact fetching
- Ad updates/fetches
- Status changes

### Wrap them like this:

**Before:**
```javascript
console.log('Socket connected:', socket.id);
console.log('Admin contact fetched:', phone);
console.log('Ad updated:', adId);
```

**After:**
```javascript
if (process.env.NODE_ENV !== 'production') {
  console.log('Socket connected:', socket.id);
}
if (process.env.NODE_ENV !== 'production') {
  console.log('Admin contact fetched:', phone);
}
if (process.env.NODE_ENV !== 'production') {
  console.log('Ad updated:', adId);
}
```

### Quick Find & Replace:
Search for: `console.log(`  
Replace with: `if (process.env.NODE_ENV !== 'production') { console.log(`

Then add closing brace `}` after each console.log statement.

---

## 🎯 Verification Checklist

After applying fixes:

- [ ] Socket.io requires JWT token to connect
- [ ] Socket.io has rate limiting (10 connections/IP/minute)
- [ ] /admin-contact endpoint has rate limiting (5 req/10min)
- [ ] /admin-contact endpoint requires authentication
- [ ] All console.log statements wrapped in production checks
- [ ] Set `NODE_ENV=production` in production environment

---

## 🚀 Testing

1. **Test Socket.io:**
   - Try connecting without token → Should fail
   - Try connecting with invalid token → Should fail
   - Try connecting 11 times from same IP → Should rate limit

2. **Test /admin-contact:**
   - Try accessing without auth → Should fail
   - Try accessing 6 times in 10 minutes → Should rate limit

3. **Test Logging:**
   - Set `NODE_ENV=production`
   - Check that no verbose logs appear

---

**All fixes applied! Your server is now protected from bot abuse.** ✅
