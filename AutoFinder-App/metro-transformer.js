/**
 * Custom Metro transformer: parse ALL node_modules .js/.jsx files with JSX-only parser
 * to prevent TypeScript parser from treating < as generics instead of JSX.
 * This fixes bundling errors across ALL packages that ship JSX in .js files.
 */
const path = require('path');
const defaultTransformer = require('metro-react-native-babel-transformer');
const babelParser = require('@babel/parser');
const { transformFromAstSync } = require('@babel/core');

// Packages that should NEVER use JSX-only parsing (need Flow/TypeScript parser)
const EXCLUDE_FROM_JSX_PARSE = [
  'react-native/index.js',
  'react-native/libraries',
  '@react-native',
  'metro-runtime',
  'metro/src',
  'expo-modules-core',
  '@babel',
];

function needsJsxParseOnly(filename) {
  if (filename == null || typeof filename !== 'string') return false;
  
  // Normalize path: convert backslashes to forward slashes and lowercase
  const normalized = filename.replace(/\\/g, '/').toLowerCase();
  
  // Only apply to .js/.jsx files (NOT .ts/.tsx which need TypeScript parser)
  if (!normalized.endsWith('.js') && !normalized.endsWith('.jsx')) return false;
  
  // Must be in node_modules
  if (!normalized.includes('/node_modules/')) return false;
  
  // Exclude core packages that need Flow/TypeScript parser
  for (const excluded of EXCLUDE_FROM_JSX_PARSE) {
    if (normalized.includes(excluded.toLowerCase())) return false;
  }
  
  // Apply JSX-only parsing to all other node_modules .js/.jsx files
  return true;
}

module.exports = {
  transform(props) {
    const { filename, options, src, plugins } = props;
    if (needsJsxParseOnly(filename)) {
      try {
        const ast = babelParser.parse(src, {
          sourceType: 'module',
          plugins: ['jsx'],
        });
        // Use minimal config WITHOUT TypeScript plugin so no re-parse with TS parser (fixes ImageViewing.js <Modal)
        const loose = true;
        const transformConfig = {
          ast: true,
          filename,
          code: false,
          cloneInputAst: false,
          caller: { name: 'metro', bundler: 'metro', platform: options.platform },
          presets: [['babel-preset-expo', { jsxRuntime: 'classic' }]],
          plugins: [
            ['@babel/plugin-transform-class-properties', { loose }],
            ['@babel/plugin-transform-private-methods', { loose }],
            ['@babel/plugin-transform-private-property-in-object', { loose }],
            'react-native-reanimated/plugin',
          ],
        };
        const result = transformFromAstSync(ast, src, transformConfig);
        if (result && result.ast) {
          return { ast: result.ast, metadata: result.metadata || {} };
        }
      } catch (e) {
        throw e;
      }
    }
    return defaultTransformer.transform(props);
  },
  getCacheKey() {
    const crypto = require('crypto');
    const fs = require('fs');
    const ourKey = crypto.createHash('md5').update(fs.readFileSync(__filename, 'utf8')).digest('hex').slice(0, 8);
    return defaultTransformer.getCacheKey() + '-jsxparse-universal-v2-' + ourKey;
  },
};
