module.exports = function (api) {
  api.cache(true);
  
  return {
    presets: [
      [
        "babel-preset-expo",
        {
          jsxRuntime: 'classic',
        }
      ]
    ],
    env: {
      production: {
        plugins: ["react-native-reanimated/plugin"],
      },
    },
    overrides: [
      // node_modules .ts and .tsx files: need TypeScript plugin FIRST before any class plugins
      {
        test: (filename) => {
          if (!filename || typeof filename !== 'string') return false;
          const normalized = filename.replace(/\\/g, '/').toLowerCase();
          
          // Must be .ts or .tsx file in node_modules
          if (!normalized.endsWith('.ts') && !normalized.endsWith('.tsx')) return false;
          if (!normalized.includes('/node_modules/')) return false;
          
          return true;
        },
        presets: [], // Don't inherit presets
        plugins: [
          // TypeScript plugin MUST come first
          [
            "@babel/plugin-transform-typescript",
            { allowDeclareFields: true, onlyRemoveTypeImports: false, allowNamespaces: true, isTSX: false }
          ],
          "@babel/plugin-syntax-jsx",
          ["@babel/plugin-transform-class-properties", { loose: true }],
          ["@babel/plugin-transform-private-methods", { loose: true }],
          ["@babel/plugin-transform-private-property-in-object", { loose: true }],
          "@babel/plugin-transform-export-namespace-from",
        ],
      },
      // node_modules .js files with JSX: parse with JSX support
      {
        test: (filename) => {
          if (!filename || typeof filename !== 'string') return false;
          const normalized = filename.replace(/\\/g, '/').toLowerCase();
          
          // Must be .js file in node_modules
          if (!normalized.endsWith('.js')) return false;
          if (!normalized.includes('/node_modules/')) return false;
          
          // Exclude core react-native and metro
          if (normalized.includes('/react-native/libraries/')) return false;
          if (normalized.includes('/react-native/index.js')) return false;
          if (normalized.includes('/metro-runtime/')) return false;
          
          return true;
        },
        parserOpts: {
          plugins: ['jsx'], // Enable JSX parsing
        },
      },
      // Project source files
      {
        test: (filename) => {
          if (!filename || typeof filename !== 'string') return false;
          return !filename.includes('node_modules');
        },
        plugins: [
          [
            "@babel/plugin-transform-typescript",
            { allowDeclareFields: true, onlyRemoveTypeImports: false, allowNamespaces: true }
          ],
        ],
      },
    ],
    plugins: [
      "react-native-reanimated/plugin"
    ]
  };
};
