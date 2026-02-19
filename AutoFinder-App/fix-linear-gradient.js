/**
 * Fix expo-linear-gradient: replace JSX in NativeLinearGradient.android.js
 * with React.createElement so Android/Metro (TS parser) does not fail.
 */
const fs = require('fs');
const path = require('path');

const targetPath = path.join(
  __dirname,
  'node_modules',
  'expo-linear-gradient',
  'build',
  'NativeLinearGradient.android.js'
);

try {
  if (!fs.existsSync(targetPath)) return;
  let content = fs.readFileSync(targetPath, 'utf8');
  if (!content.includes('<View {...props}')) return;

  const jsxBlock = `    return (<View {...props} style={style}>
      <BaseNativeLinearGradient style={StyleSheet.absoluteFill} colors={colors} startPoint={startPoint} endPoint={endPoint} locations={locations} borderRadii={borderRadiiPerCorner} dither={dither}/>
      {children}
    </View>);
}
const BaseNativeLinearGradient`;
  const patchedBlock = `    return React.createElement(View, { ...props, style },
      React.createElement(BaseNativeLinearGradient, {
        style: StyleSheet.absoluteFill,
        colors,
        startPoint,
        endPoint,
        locations,
        borderRadii: borderRadiiPerCorner,
        dither,
      }),
      children
    );
}
const BaseNativeLinearGradient`;

  content = content.replace(jsxBlock, patchedBlock);
  if (content.includes('<View {...props}')) return;
  fs.writeFileSync(targetPath, content, 'utf8');
  console.log('fix-linear-gradient: Patched NativeLinearGradient.android.js for Android bundling.');
} catch (err) {
  console.warn('fix-linear-gradient:', err.message);
}
