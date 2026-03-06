const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'index.js');
let content = fs.readFileSync(file, 'utf8');
const startMarker = '// ORPHAN_REMOVED_B';
const endMarker = '// ==================== AUTHENTICATION ROUTES ====================\n// Login endpoint\napp.post("/login"';
const startIdx = content.indexOf(startMarker);
const loginIdx = content.indexOf('app.post("/login"', startIdx);
if (startIdx === -1 || loginIdx === -1) {
  console.error('Markers not found');
  process.exit(1);
}
const before = content.substring(0, startIdx);
const after = content.substring(loginIdx);
content = before + '// ==================== AUTHENTICATION ROUTES ====================\n// Login endpoint\n' + after;
fs.writeFileSync(file, content);
console.log('Orphan block removed');
