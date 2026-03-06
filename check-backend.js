/**
 * Quick Backend Health Check Script
 * Run this to verify backend is running and accessible
 */

const http = require('http');

const BACKEND_URL = 'http://localhost:8001';
const HEALTH_ENDPOINT = `${BACKEND_URL}/health`;

console.log('🔍 Checking backend server...');
console.log(`📍 URL: ${BACKEND_URL}`);
console.log('');

// Test health endpoint
const req = http.get(HEALTH_ENDPOINT, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    if (res.statusCode === 200) {
      console.log('✅ Backend is RUNNING and responding!');
      console.log(`📊 Status Code: ${res.statusCode}`);
      console.log(`📦 Response: ${data}`);
      
      try {
        const json = JSON.parse(data);
        console.log('');
        console.log('📋 Backend Status:');
        console.log(`   Status: ${json.status}`);
        console.log(`   Database: ${json.db || 'unknown'}`);
        console.log(`   Timestamp: ${json.timestamp}`);
      } catch (e) {
        console.log('⚠️ Response is not JSON');
      }
    } else {
      console.log(`❌ Backend responded with status ${res.statusCode}`);
      console.log(`📦 Response: ${data}`);
    }
  });
});

req.on('error', (error) => {
  console.log('❌ ERROR: Cannot connect to backend!');
  console.log('');
  console.log('🔧 Troubleshooting Steps:');
  console.log('');
  console.log('1. Check if backend is running:');
  console.log('   cd autofinder-backend-orignal-');
  console.log('   npm start');
  console.log('');
  console.log('2. Check if port 8001 is in use:');
  console.log('   Windows: netstat -ano | findstr :8001');
  console.log('   Mac/Linux: lsof -i :8001');
  console.log('');
  console.log('3. Check backend logs for errors');
  console.log('');
  console.log('4. Verify MongoDB connection:');
  console.log('   Check node.env file for MONGODB_URI');
  console.log('');
  console.log(`Error details: ${error.message}`);
});

req.setTimeout(5000, () => {
  console.log('❌ ERROR: Request timed out after 5 seconds');
  console.log('   Backend might be slow or not responding');
  req.destroy();
});
