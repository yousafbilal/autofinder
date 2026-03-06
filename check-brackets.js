const fs = require('fs');
const content = fs.readFileSync('index.js', 'utf8');

let braces = 0, parens = 0, brackets = 0;
let inString = false, stringChar = '', inComment = false, commentType = '';
const openBraces = [];
const lines = content.split('\n');

for (let i = 0; i < content.length; i++) {
  const char = content[i];
  const nextChar = content[i + 1] || '';
  const prevChar = content[i - 1] || '';
  const lineNum = content.substring(0, i).split('\n').length;
  
  if (!inString && char === '/' && nextChar === '/' && !inComment) {
    inComment = true;
    commentType = '//';
    i++;
    continue;
  }
  if (!inString && char === '/' && nextChar === '*' && !inComment) {
    inComment = true;
    commentType = '/*';
    i++;
    continue;
  }
  if (inComment && commentType === '//' && char === '\n') {
    inComment = false;
    continue;
  }
  if (inComment && commentType === '/*' && char === '*' && nextChar === '/') {
    inComment = false;
    i++;
    continue;
  }
  if (inComment) continue;
  
  if (!inComment && (char === '"' || char === "'" || char === '`') && prevChar !== '\\') {
    if (!inString) {
      inString = true;
      stringChar = char;
    } else if (char === stringChar) {
      inString = false;
      stringChar = '';
    }
  }
  if (inString) continue;
  
  if (!inString && !inComment) {
    if (char === '{') {
      braces++;
      openBraces.push({ line: lineNum, context: (lines[lineNum - 1] || '').trim().substring(0, 60) });
    }
    if (char === '}') {
      braces--;
      if (openBraces.length > 0) openBraces.pop();
    }
    if (char === '(') parens++;
    if (char === ')') parens--;
    if (char === '[') brackets++;
    if (char === ']') brackets--;
  }
}

console.log(`Braces: ${braces}, Parens: ${parens}, Brackets: ${brackets}`);
if (openBraces.length > 0) {
  console.log(`\nUnclosed braces:`);
  openBraces.forEach((b, i) => console.log(`  ${i+1}. Line ${b.line}: ${b.context}`));
}
