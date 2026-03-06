const fs = require('fs');
const content = fs.readFileSync('index.js', 'utf8');

let braces = 0;
let parens = 0;
let brackets = 0;
let inString = false;
let stringChar = '';
let inComment = false;
let commentType = '';
const openBraces = [];
const openParens = [];
const lines = content.split('\n');

for (let i = 0; i < content.length; i++) {
  const char = content[i];
  const nextChar = content[i + 1] || '';
  const prevChar = content[i - 1] || '';
  const lineNum = content.substring(0, i).split('\n').length;
  
  // Handle comments
  if (!inString) {
    if (char === '/' && nextChar === '/' && !inComment) {
      inComment = true;
      commentType = '//';
      i++;
      continue;
    }
    if (char === '/' && nextChar === '*' && !inComment) {
      inComment = true;
      commentType = '/*';
      i++;
      continue;
    }
    if (inComment && commentType === '//' && char === '\n') {
      inComment = false;
      commentType = '';
      continue;
    }
    if (inComment && commentType === '/*' && char === '*' && nextChar === '/') {
      inComment = false;
      commentType = '';
      i++;
      continue;
    }
    if (inComment) continue;
  }
  
  // Handle strings
  if (!inComment) {
    if ((char === '"' || char === "'" || char === '`') && prevChar !== '\\') {
      if (!inString) {
        inString = true;
        stringChar = char;
      } else if (char === stringChar) {
        inString = false;
        stringChar = '';
      }
    }
    if (inString) continue;
  }
  
  // Count brackets
  if (!inString && !inComment) {
    if (char === '{') {
      braces++;
      const context = lines[lineNum - 1] || '';
      openBraces.push({ line: lineNum, char: char, context: context.trim().substring(0, 80) });
    }
    if (char === '}') {
      braces--;
      if (openBraces.length > 0) {
        openBraces.pop();
      }
    }
    if (char === '(') {
      parens++;
      const context = lines[lineNum - 1] || '';
      openParens.push({ line: lineNum, char: char, context: context.trim().substring(0, 80) });
    }
    if (char === ')') {
      parens--;
      if (openParens.length > 0) {
        openParens.pop();
      }
    }
    if (char === '[') brackets++;
    if (char === ']') brackets--;
  }
}

console.log(`\n📊 Final Count:`);
console.log(`   Braces: ${braces}`);
console.log(`   Parentheses: ${parens}`);
console.log(`   Brackets: ${brackets}`);

if (openBraces.length > 0) {
  console.log(`\n❌ Found ${openBraces.length} unclosed braces:`);
  openBraces.forEach((b, i) => {
    console.log(`\n   ${i + 1}. Line ${b.line}:`);
    console.log(`      ${b.context}`);
  });
}

if (openParens.length > 0) {
  console.log(`\n❌ Found ${openParens.length} unclosed parentheses:`);
  openParens.forEach((p, i) => {
    console.log(`\n   ${i + 1}. Line ${p.line}:`);
    console.log(`      ${p.context}`);
  });
}

if (braces === 0 && parens === 0 && brackets === 0) {
  console.log(`\n✅ All brackets are balanced!`);
  process.exit(0);
} else {
  process.exit(1);
}
