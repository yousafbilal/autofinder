#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Wrap everything in try-catch to prevent installation failures
try {
  console.log('🔧 Fixing packages with JSX syntax errors...');

// List of packages to fix
const packagesToFix = [
  {
    name: 'expo-linear-gradient',
    file: 'node_modules/expo-linear-gradient/build/LinearGradient.js',
    patterns: [
      {
        find: /return\s*\(\s*<NativeLinearGradient\s+\{\.\.\.props\}\s+colors=\{Platform\.select\(\{[\s\S]*?\}\)\}\s+dither=\{Platform\.select\(\{\s*android:\s*dither\s*\}\)\}\s+locations=\{resolvedLocations\}\s+startPoint=\{_normalizePoint\(start\)\}\s+endPoint=\{_normalizePoint\(end\)\}\s*\/\s*>\s*\)\s*;/,
        replace: `return React.createElement(NativeLinearGradient, {
            ...props,
            colors: Platform.select({
                web: colors,
                default: colors.map(processColor),
            }),
            dither: Platform.select({ android: dither }),
            locations: resolvedLocations,
            startPoint: _normalizePoint(start),
            endPoint: _normalizePoint(end)
        });`
      }
    ]
  },
  {
    name: '@expo/vector-icons',
    file: 'node_modules/@expo/vector-icons/build/createIconSet.js',
    patterns: [
      {
        find: /return\s*<Text\s*\/\s*>/g,
        replace: 'return React.createElement(Text);'
      },
      {
        find: /return\s*\(\s*<RNVIconComponent/g,
        replace: 'return React.createElement(RNVIconComponent'
      },
      {
        find: /\}\s*\/\s*>\s*\)\s*;$/gm,
        replace: '});'
      }
    ]
  }
];

let totalFixed = 0;

packagesToFix.forEach(({ name, file, patterns }) => {
  try {
  const filePath = path.join(process.cwd(), file);
  
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  ${name}: Package not found at ${filePath} - skipping (this is OK if packages aren't installed yet)`);
    return;
  }
  
  console.log(`\n🔧 Checking ${name}...`);
  let content = fs.readFileSync(filePath, 'utf8');
  const originalContent = content;
  let fixed = false;
  
  // Check if file contains JSX syntax or incorrect React.createElement syntax
  if (content.includes('<Text />') || content.includes('<NativeLinearGradient') || content.includes('<RNVIconComponent') || 
      content.includes('React.createElement(RNVIconComponent ref=') || 
      content.includes('React.createElement(RNVIconComponent, { ref:{') ||
      content.includes('this._icon = view;,') ||
      (content.includes('React.createElement(RNVIconComponent, {') && content.includes('ref: (view) => {'))) {
    console.log(`   Found JSX syntax in ${name}, fixing...`);
    
    patterns.forEach((pattern, index) => {
      if (pattern.find.test(content)) {
        console.log(`   Applying pattern ${index + 1}...`);
        content = content.replace(pattern.find, pattern.replace);
        fixed = true;
      }
    });
    
      // Additional fixes for @expo/vector-icons
      if (name === '@expo/vector-icons') {
        // Fix: return <Text />;
        if (content.includes('return <Text />')) {
          content = content.replace(/return\s*<Text\s*\/\s*>/g, 'return React.createElement(Text);');
          fixed = true;
        }
        
        // Fix: double semicolon
        if (content.includes('React.createElement(Text);;')) {
          content = content.replace(/React\.createElement\(Text\);;/g, 'React.createElement(Text);');
          fixed = true;
        }
        
        // Fix: arrow functions in object literals - convert to regular functions
        if (content.includes('ref: (view) =>') || content.includes('ref: (view)=>')) {
          console.log('   Fixing arrow functions in object literals...');
          // Replace arrow functions in object literals with regular functions
          content = content.replace(
            /var\s+iconProps\s*=\s*\{[\s\S]*?ref:\s*\(view\)\s*=>\s*\{[\s\S]*?this\._icon\s*=\s*view;[\s\S]*?\}[\s\S]*?\};/g,
            function(match) {
              return `var self = this;
            var iconProps = {};
            iconProps.ref = function(view) {
                self._icon = view;
            };`;
            }
          );
          fixed = true;
        }
        
        // Fix: spread operator ...this.props in React.createElement
        if (content.includes('...this.props') && content.includes('React.createElement(RNVIconComponent')) {
          console.log('   Fixing spread operator in React.createElement...');
          // Replace: { ref: ..., ...this.props } with manual property copying
          content = content.replace(
            /return React\.createElement\(RNVIconComponent,\s*\{([^}]*?),\s*\.\.\.this\.props\s*\}\)\s*;/gs,
            function(match, propsContent) {
              // Extract ref and other props, convert arrow function to regular function
              propsContent = propsContent.trim().replace(/,\s*$/, '');
              // Convert arrow function if present
              if (propsContent.includes('(view) =>')) {
                return `var self = this;
            var iconProps = {};
            iconProps.ref = function(view) {
                self._icon = view;
            };
            for (var key in this.props) {
                if (this.props.hasOwnProperty(key)) {
                    iconProps[key] = this.props[key];
                }
            }
            return React.createElement(RNVIconComponent, iconProps);`;
              }
              return `var iconProps = {
                ${propsContent}
            };
            for (var key in this.props) {
                if (this.props.hasOwnProperty(key)) {
                    iconProps[key] = this.props[key];
                }
            }
            return React.createElement(RNVIconComponent, iconProps);`;
            }
          );
          // Also handle without return statement
          content = content.replace(
            /React\.createElement\(RNVIconComponent,\s*\{([^}]*?),\s*\.\.\.this\.props\s*\}\)/gs,
            function(match, propsContent) {
              propsContent = propsContent.trim().replace(/,\s*$/, '');
              return `(function() {
                var iconProps = {
                    ${propsContent}
                };
                for (var key in this.props) {
                    if (this.props.hasOwnProperty(key)) {
                        iconProps[key] = this.props[key];
                    }
                }
                return React.createElement(RNVIconComponent, iconProps);
            }.bind(this))()`;
            }
          );
          fixed = true;
        }
        
        // Fix: Object.assign in React.createElement - convert to separate variable
        if (content.includes('React.createElement(RNVIconComponent, Object.assign({')) {
          console.log('   Fixing Object.assign in React.createElement...');
          // Pattern: const props = Object.assign({}, { ref: ... }, this.props)
          content = content.replace(
            /const\s+props\s*=\s*Object\.assign\(\{\},\s*\{\s*ref:\s*\(view\)\s*=>\s*\{\s*this\._icon\s*=\s*view;\s*\}\s*\},\s*this\.props\);/g,
            'var iconProps = {};\n            var self = this;\n            iconProps.ref = function(view) {\n                self._icon = view;\n            };\n            for (var key in this.props) {\n                if (this.props.hasOwnProperty(key)) {\n                    iconProps[key] = this.props[key];\n                }\n            }'
          );
          // Also fix: return React.createElement(RNVIconComponent, props);
          content = content.replace(
            /return React\.createElement\(RNVIconComponent,\s*props\);/g,
            'return React.createElement(RNVIconComponent, iconProps);'
          );
          fixed = true;
        }
        
        // Fix: Class field syntax - convert to constructor
        if (content.includes('_mounted = false') && !content.includes('constructor(props)')) {
          console.log('   Fixing class field syntax...');
          // Replace class fields with constructor
          content = content.replace(
            /(\s*\};\s*)(\s*_mounted\s*=\s*false;\s*)(\s*_icon;\s*)(\s*state\s*=\s*\{[\s\S]*?fontIsLoaded:\s*Font\.isLoaded\(fontName\),[\s\S]*?\};\s*)(\s*async\s+componentDidMount)/g,
            '$1        constructor(props) {\n            super(props);\n            this._mounted = false;\n            this._icon = null;\n            this.state = {\n                fontIsLoaded: Font.isLoaded(fontName),\n            };\n        }\n$5'
          );
          fixed = true;
        }
        
        // Fix: Spread operator in return statement
        if (content.includes('return { scale: PixelRatio.get(), ...result }')) {
          console.log('   Fixing spread operator...');
          content = content.replace(
            /return\s*\{\s*scale:\s*PixelRatio\.get\(\),\s*\.\.\.result\s*\};/g,
            'var mergedResult = { scale: PixelRatio.get() };\n                for (var resultKey in result) {\n                    if (result.hasOwnProperty(resultKey)) {\n                        mergedResult[resultKey] = result[resultKey];\n                    }\n                }\n                return mergedResult;'
          );
          fixed = true;
        }
        
        // Fix: spread operator in React.createElement - convert ...this.props to Object.assign
        if (content.includes('...this.props') && content.includes('React.createElement(RNVIconComponent')) {
          console.log('   Fixing spread operator in React.createElement...');
          // Pattern: React.createElement(RNVIconComponent, { ...props, ...this.props })
          content = content.replace(
            /React\.createElement\(RNVIconComponent,\s*\{([^}]*?),\s*\.\.\.this\.props\s*\}\)/g,
            'React.createElement(RNVIconComponent, Object.assign({$1}, this.props))'
          );
          // Pattern: React.createElement(RNVIconComponent, { ref: ..., ...this.props })
          content = content.replace(
            /React\.createElement\(RNVIconComponent,\s*\{([^}]*?),\s*\.\.\.this\.props\s*\}\)/gs,
            function(match, props) {
              // Remove trailing comma if exists
              props = props.replace(/,\s*$/, '');
              return 'React.createElement(RNVIconComponent, Object.assign({' + props + '}, this.props))';
            }
          );
          fixed = true;
        }
      
      // Fix: return React.createElement(RNVIconComponent ref={...} - this is wrong syntax
      // Also fix: React.createElement(RNVIconComponent, { ref:{...} - missing space
      // Also fix: this._icon = view;, - trailing comma after semicolon
      // Also fix: empty object React.createElement(RNVIconComponent, { });
      if (content.includes('React.createElement(RNVIconComponent ref=') || 
          content.includes('React.createElement(RNVIconComponent, { ref:{') ||
          content.includes('this._icon = view;,') ||
          content.match(/React\.createElement\(RNVIconComponent,\s*\{\s*\}\)/) ||
          (content.includes('React.createElement(RNVIconComponent, {') && content.includes('ref: (view) => {'))) {
        console.log('   Fixing incorrect React.createElement syntax...');
        
        // Fix: this._icon = view;, - remove trailing comma
        content = content.replace(/this\._icon\s*=\s*view;,/g, 'this._icon = view;');
        
        // Fix: empty object React.createElement(RNVIconComponent, { });
        // Handle both single-line and multi-line empty objects
        // Pattern 1: Single line empty object
        content = content.replace(
          /React\.createElement\(RNVIconComponent,\s*\{\s*\}\)/g,
          'React.createElement(RNVIconComponent, {\n                ref: (view) => {\n                    this._icon = view;\n                },\n                ...this.props\n            })'
        );
        
        // Pattern 2: Multi-line empty object - React.createElement(RNVIconComponent, { followed by });
        content = content.replace(
          /React\.createElement\(RNVIconComponent,\s*\{[\s]*\n[\s]*\}\)/g,
          'React.createElement(RNVIconComponent, {\n                ref: (view) => {\n                    this._icon = view;\n                },\n                ...this.props\n            })'
        );
        
        // Pattern 3: More flexible multi-line pattern - return on same or different line
        content = content.replace(
          /return\s+React\.createElement\(RNVIconComponent,\s*\{[\s\n]*\}\);/g,
          'return React.createElement(RNVIconComponent, {\n                ref: (view) => {\n                    this._icon = view;\n                },\n                ...this.props\n            });'
        );
        
        // Pattern 4: Multi-line pattern where return and React.createElement are on different lines
        // Match: return\n            React.createElement(RNVIconComponent, {\n            });
        content = content.replace(
          /return\s*\n\s*React\.createElement\(RNVIconComponent,\s*\{[\s\n]*\}\);/g,
          'return React.createElement(RNVIconComponent, {\n                ref: (view) => {\n                    this._icon = view;\n                },\n                ...this.props\n            });'
        );
        
        // Pattern 5: Most aggressive - any React.createElement with empty object followed by });
        content = content.replace(
          /React\.createElement\(RNVIconComponent,\s*\{[\s]*\n[\s]*\}\);/g,
          'React.createElement(RNVIconComponent, {\n                ref: (view) => {\n                    this._icon = view;\n                },\n                ...this.props\n            });'
        );
        
        // Fix multi-line version - this is the actual issue
        const lines = content.split('\n');
        const newLines = [];
        
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          
          // Check if this line has the problematic pattern
          const hasPattern1 = line.includes('React.createElement(RNVIconComponent ref=');
          const hasPattern2 = line.includes('React.createElement(RNVIconComponent, { ref:{');
          const hasPattern3 = line.includes('React.createElement(RNVIconComponent, {') && 
                               i + 1 < lines.length && lines[i + 1].includes('ref: (view) => {');
          // Check for empty object pattern: React.createElement(RNVIconComponent, { followed by });
          // Also check if line ends with { and next line is });
          const hasPattern4 = (line.includes('React.createElement(RNVIconComponent, {') || 
                               (line.includes('React.createElement(RNVIconComponent,') && line.trim().endsWith('{'))) && 
                               i + 1 < lines.length && (lines[i + 1].trim() === '});' || lines[i + 1].trim().startsWith('});'));
          
          if (hasPattern1 || hasPattern2 || hasPattern3 || hasPattern4) {
            const indent = line.match(/^(\s*)/)[1] || '';
            
            // Extract the ref value - handle multi-line ref
            let refValue = '';
            if (line.includes('ref={') || line.includes('ref:{')) {
              // Handle both patterns: ref={ and ref:{
              const refPattern = line.includes('ref={') ? 'ref={' : 'ref:{';
              const refStart = line.indexOf(refPattern) + refPattern.length;
              let refEnd = line.indexOf('}', refStart);
              
              // If ref spans multiple lines
              if (refEnd === -1) {
                refValue = line.substring(refStart);
                i++;
                while (i < lines.length) {
                  if (lines[i].includes('}')) {
                    refValue += '\n' + lines[i].substring(0, lines[i].indexOf('}'));
                    break;
                  }
                  refValue += '\n' + lines[i];
                  i++;
                }
              } else {
                refValue = line.substring(refStart, refEnd);
              }
            }
            
            // If this is an empty object pattern (hasPattern4), add props directly
            if (hasPattern4) {
              // Check if line has "return" keyword
              const hasReturn = line.includes('return');
              const returnPrefix = hasReturn ? 'return ' : '';
              
              newLines.push(`${indent}${returnPrefix}React.createElement(RNVIconComponent, {`);
              newLines.push(`${indent}    ref: (view) => {`);
              newLines.push(`${indent}        this._icon = view;`);
              newLines.push(`${indent}    },`);
              newLines.push(`${indent}    ...this.props`);
              newLines.push(`${indent}});`);
              
              // Skip the current line and the closing });
              i++; // Skip current line
              if (i < lines.length && (lines[i].trim() === '});' || lines[i].trim().startsWith('});'))) {
                i++; // Skip closing });
              }
              fixed = true;
              continue;
            }
            
            // Start React.createElement with proper syntax
            newLines.push(`${indent}return React.createElement(RNVIconComponent, {`);
            
            // Process ref and other props line by line
            i++;
            let refStarted = false;
            let refContent = [];
            let foundSpread = false;
            
            while (i < lines.length) {
              const currentLine = lines[i];
              
              // Start of ref callback
              if (currentLine.includes('ref:') || currentLine.includes('ref: (')) {
                refStarted = true;
                newLines.push(`${indent}    ref: (view) => {`);
                i++;
                continue;
              }
              
              // Inside ref callback
              if (refStarted && !currentLine.trim().startsWith('}')) {
                // Fix syntax error: remove trailing comma from statements
                let cleanedLine = currentLine.trim();
                if (cleanedLine.endsWith(';,')) {
                  cleanedLine = cleanedLine.replace(/;,$/, ';');
                }
                newLines.push(`${indent}        ${cleanedLine}`);
                i++;
                continue;
              }
              
              // End of ref callback
              if (refStarted && currentLine.trim().startsWith('}')) {
                newLines.push(`${indent}    },`);
                refStarted = false;
                i++;
                
                // Always add spread props after ref
                // Check if there's a spread props line after ref closes
                if (i < lines.length && lines[i].includes('{...')) {
                  const spreadMatch = lines[i].match(/\{\.\.\.([^}]+)\}/);
                  if (spreadMatch) {
                    newLines.push(`${indent}    ...${spreadMatch[1]}`);
                  }
                  i++;
                } else {
                  // Add default spread props if not present
                  newLines.push(`${indent}    ...this.props`);
                }
                
                // Skip any extra closing }); if it's on the next line
                while (i < lines.length && (lines[i].trim() === '});' || lines[i].trim() === '});')) {
                  i++;
                }
                break;
              }
              
              // Find spread props
              if (currentLine.includes('{...')) {
                const spreadMatch = currentLine.match(/\{\.\.\.([^}]+)\}/);
                if (spreadMatch) {
                  newLines.push(`${indent}    ...${spreadMatch[1]}`);
                }
                foundSpread = true;
                i++;
                break;
              }
              
              // End of React.createElement
              if (currentLine.trim().endsWith('});')) {
                break;
              }
              
              i++;
            }
            
            // Ensure we have at least one prop (ref or spread props)
            // Check if we actually added any props
            let hasProps = false;
            for (let j = newLines.length - 1; j >= 0; j--) {
              if (newLines[j].includes('ref:') || newLines[j].includes('...this.props') || newLines[j].includes('...')) {
                hasProps = true;
                break;
              }
              if (newLines[j].includes('React.createElement(RNVIconComponent, {')) {
                break;
              }
            }
            
            if (!hasProps) {
              // No props added, add ref and spread props
              newLines.push(`${indent}    ref: (view) => {`);
              newLines.push(`${indent}        this._icon = view;`);
              newLines.push(`${indent}    },`);
              newLines.push(`${indent}    ...this.props`);
            }
            
            // Close React.createElement
            newLines.push(`${indent}});`);
            fixed = true;
          } else {
            newLines.push(line);
          }
        }
        
        content = newLines.join('\n');
        
        // Final cleanup: Remove any duplicate }); patterns
        content = content.replace(/\}\);[\s\n]*\}\);/g, '});');
        content = content.replace(/\}\);[\s\n]*\}\);[\s\n]*\}\);/g, '});');
      }
      
      // Fix: return (<RNVIconComponent
      if (content.includes('return (<RNVIconComponent')) {
        const lines = content.split('\n');
        const newLines = [];
        
        for (let i = 0; i < lines.length; i++) {
          if (lines[i].includes('return (<RNVIconComponent')) {
            const indent = lines[i].match(/^(\s*)/)[1] || '';
            newLines.push(`${indent}return React.createElement(RNVIconComponent, {`);
            
            // Find and copy props - look for ref=, name=, size=, color=, and {...props}
            i++;
            let props = [];
            while (i < lines.length && !lines[i].includes('/>')) {
              const line = lines[i].trim();
              if (line.includes('ref=')) {
                const refMatch = line.match(/ref=\{([^}]+)\}/);
                if (refMatch) {
                  props.push(`ref: ${refMatch[1]}`);
                }
              } else if (line.includes('{...')) {
                const spreadMatch = line.match(/\{\.\.\.([^}]+)\}/);
                if (spreadMatch) {
                  props.push(`...${spreadMatch[1]}`);
                }
              } else if (line.includes('name=') || line.includes('size=') || line.includes('color=')) {
                // Convert JSX prop to object prop
                const propMatch = line.match(/(\w+)=\{([^}]+)\}/);
                if (propMatch) {
                  props.push(`${propMatch[1]}: ${propMatch[2]}`);
                }
              }
              i++;
            }
            
            // Add props
            props.forEach((prop, idx) => {
              newLines.push(`${indent}    ${prop}${idx < props.length - 1 ? ',' : ''}`);
            });
            
            // Close React.createElement
            if (i < lines.length && lines[i].includes('/>')) {
              newLines.push(`${indent}});`);
              i++;
            }
          } else {
            newLines.push(lines[i]);
          }
        }
        
        content = newLines.join('\n');
        fixed = true;
      }
    }
    
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Fixed ${name}!`);
      totalFixed++;
    } else {
      console.log(`⚠️  ${name}: No changes made`);
    }
  } else {
    console.log(`✅ ${name}: Already using React.createElement (no fix needed)`);
  }
  } catch (err) {
    console.error(`⚠️  Error fixing ${name}:`, err.message);
    // Continue with other packages
  }
});

  console.log(`\n✅ Fix complete! Fixed ${totalFixed} package(s).`);
} catch (error) {
  console.error('⚠️  Error in fix-packages.js:', error.message);
  console.log('⚠️  Continuing installation anyway...');
  // Don't fail installation if fix script has issues
}
// Don't exit with error code - allow installation to continue even if no fixes were needed
process.exit(0);
