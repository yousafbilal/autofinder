# 🚀 Quick Fix Guide - 3 Critical Security Issues

## Run This Command First:
```bash
cd autofinder-backend-orignal-
node fix-security-issues.js
```

If that doesn't work, apply fixes manually below:

---

## ✅ FIX 1: Socket.io JWT Auth (CRITICAL)

**Find this line:**
```javascript
const io = new Server(server, { cors: { origin: ['https://admin.autofinder.pk', 'https://autofinder.pk']} });
```

**Add IMMEDIATELY after it:**
```javascript
// Socket.io JWT Authentication & Rate Limiting
const socketConnectionAttempts = new Map();
const SOCKET_RATE_LIMIT = 10;
const SOCKET_RATE_WINDOW = 60 * 1000;

io.use((socket, next) => {
  const clientIp = socket.handshake.address || socket.request.connection.remoteAddress || 'unknown';
  const now = Date.now();
  
  for (const [ip, attempts] of socketConnectionAttempts.entries()) {
    socketConnectionAttempts.set(ip, attempts.filter(time => now - time < SOCKET_RATE_WINDOW));
    if (socketConnectionAttempts.get(ip).length === 0) socketConnectionAttempts.delete(ip);
  }
  
  const attempts = socketConnectionAttempts.get(clientIp) || [];
  if (attempts.length >= SOCKET_RATE_LIMIT) {
    if (process.env.NODE_ENV !== 'production') console.log('Socket rate limit: ' + clientIp);
    return next(new Error('Too many connection attempts'));
  }
  
  attempts.push(now);
  socketConnectionAttempts.set(clientIp, attempts);
  
  const token = socket.handshake.auth?.token || socket.handshake.query?.token;
  if (!token) {
    if (process.env.NODE_ENV !== 'production') console.log('Socket: No token');
    return next(new Error('Authentication token required'));
  }
  
  try {
    const decoded = jwt.verify(token, secretKey);
    socket.userId = decoded.userId;
    socket.userRole = decoded.role;
    next();
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') console.log('Socket: Invalid token');
    return next(new Error('Invalid token'));
  }
});
```

---

## ✅ FIX 2: /admin-contact Rate Limit (CRITICAL)

**Step 1: Add rate limiter (near other rateLimit definitions):**
```javascript
const contactRateLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 5,
  message: 'Too many requests. Try again later.'
});
```

**Step 2: Find this route:**
```javascript
app.get("/admin-contact", async (req, res) => {
```

**Change to:**
```javascript
app.get("/admin-contact", contactRateLimiter, authenticateToken, async (req, res) => {
```

---

## ✅ FIX 3: Production Logging (IMPORTANT)

**Find and wrap these patterns:**

**Before:**
```javascript
console.log('Socket connected');
console.log('Admin contact fetched');
console.log('Ad updated');
```

**After:**
```javascript
if (process.env.NODE_ENV !== 'production') console.log('Socket connected');
if (process.env.NODE_ENV !== 'production') console.log('Admin contact fetched');
if (process.env.NODE_ENV !== 'production') console.log('Ad updated');
```

**Quick fix:** Search `console.log(` and wrap each in `if (process.env.NODE_ENV !== 'production') { ... }`

---

## ✅ Done! 

Set `NODE_ENV=production` in production.
