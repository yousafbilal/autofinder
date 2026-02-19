#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// 1) Fix build/createIconSet.js if needed
const filePath = path.join(__dirname, 'node_modules/@expo/vector-icons/build/createIconSet.js');
if (fs.existsSync(filePath)) {
  let content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  let changed = false;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('return React.createElement(RNVIconComponent, iconProps)') && !lines[i].trim().endsWith(');')) {
      lines[i] = lines[i].replace(/\s*return React\.createElement\(RNVIconComponent, iconProps)\s*$/, '            return React.createElement(RNVIconComponent, iconProps);');
      changed = true;
    }
  }
  if (changed) {
    fs.writeFileSync(filePath, lines.join('\n'), 'utf8');
    console.log('✅ Fixed @expo/vector-icons build/createIconSet.js');
  }
}

// 2) Fix vendor react-native-vector-icons create-icon-set.js: replace JSX with React.createElement (Android bundling)
const vendorPath = path.join(__dirname, 'node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/lib/create-icon-set.js');
if (!fs.existsSync(vendorPath)) {
  process.exit(0);
}

let vendorContent = fs.readFileSync(vendorPath, 'utf8');
const jsxBlock = `      return (
        <Text selectable={false} {...props}>
          {glyph}
          {children}
        </Text>
      );`;
const patchedBlock = `      return React.createElement(Text, { selectable: false, ...props }, glyph, children);`;

if (vendorContent.includes('<Text selectable={false}')) {
  vendorContent = vendorContent.replace(jsxBlock, patchedBlock);
  fs.writeFileSync(vendorPath, vendorContent, 'utf8');
  console.log('✅ Fixed @expo/vector-icons vendor create-icon-set.js (JSX -> createElement)');
}

// 3) Fix vendor react-native-vector-icons icon-button.js: replace JSX with React.createElement (Android bundling)
const iconButtonPath = path.join(__dirname, 'node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/lib/icon-button.js');
if (fs.existsSync(iconButtonPath)) {
  let iconButtonContent = fs.readFileSync(iconButtonPath, 'utf8');
  const iconButtonJsx = `      return (
        <TouchableHighlight
          style={[styles.touchable, blockStyle]}
          {...touchableProps}
        >
          <View style={[styles.container, blockStyle, style]} {...props}>
            <Icon {...iconProps} />
            {typeof children === 'string' ? (
              <Text style={[styles.text, colorStyle]} selectable={false}>
                {children}
              </Text>
            ) : (
              children
            )}
          </View>
        </TouchableHighlight>
      );
    }
  };
}`;
  const iconButtonPatched = `      const innerContent = typeof children === 'string'
        ? React.createElement(Text, { style: [styles.text, colorStyle], selectable: false }, children)
        : children;
      const viewProps = { style: [styles.container, blockStyle, style], ...props };
      const view = React.createElement(View, viewProps, React.createElement(Icon, iconProps), innerContent);
      const touchablePropsMerged = { style: [styles.touchable, blockStyle], ...touchableProps };
      return React.createElement(TouchableHighlight, touchablePropsMerged, view);
    }
  };
}`;
  if (iconButtonContent.includes('<TouchableHighlight')) {
    iconButtonContent = iconButtonContent.replace(iconButtonJsx, iconButtonPatched);
    fs.writeFileSync(iconButtonPath, iconButtonContent, 'utf8');
    console.log('✅ Fixed @expo/vector-icons vendor icon-button.js (JSX -> createElement)');
  }
}

// 4) Fix vendor create-multi-style-icon-set.js: replace JSX in render (Android bundling)
const multiStylePath = path.join(__dirname, 'node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/lib/create-multi-style-icon-set.js');
if (fs.existsSync(multiStylePath)) {
  let multiStyleContent = fs.readFileSync(multiStylePath, 'utf8');
  if (multiStyleContent.includes('return <SelectedIconClass')) {
    multiStyleContent = multiStyleContent.replace('return <SelectedIconClass {...props} />;', 'return React.createElement(SelectedIconClass, props);');
    fs.writeFileSync(multiStylePath, multiStyleContent, 'utf8');
    console.log('✅ Fixed @expo/vector-icons vendor create-multi-style-icon-set.js (JSX -> createElement)');
  }
}
