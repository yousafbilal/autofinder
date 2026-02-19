/**
 * Fix react-native-circular-progress: replace JSX in AnimatedCircularProgress.js and CircularProgress.js
 * with React.createElement so Android/Metro (TS parser) does not fail.
 */
const fs = require('fs');
const path = require('path');

const baseDir = path.join(__dirname, 'node_modules', 'react-native-circular-progress', 'src');

// 1) AnimatedCircularProgress.js
const animatedPath = path.join(baseDir, 'AnimatedCircularProgress.js');
try {
  if (fs.existsSync(animatedPath)) {
    let content = fs.readFileSync(animatedPath, 'utf8');
    const jsxBlock = `  render() {
    const { fill, prefill, ...other } = this.props;

    return (
      <AnimatedProgress
        {...other}
        fill={this.state.fillAnimation}
        tintColor={this.animateColor()}
      />
    );
  }`;
    const patchedBlock = `  render() {
    const { fill, prefill, ...other } = this.props;
    return React.createElement(AnimatedProgress, {
      ...other,
      fill: this.state.fillAnimation,
      tintColor: this.animateColor(),
    });
  }`;
    if (content.includes('<AnimatedProgress')) {
      content = content.replace(jsxBlock, patchedBlock);
      fs.writeFileSync(animatedPath, content, 'utf8');
      console.log('fix-circular-progress: Patched AnimatedCircularProgress.js');
    }
  }
} catch (err) {
  console.warn('fix-circular-progress (Animated):', err.message);
}

// 2) CircularProgress.js
const circularPath = path.join(baseDir, 'CircularProgress.js');
try {
  if (!fs.existsSync(circularPath)) process.exit(0);
  let content = fs.readFileSync(circularPath, 'utf8');
  if (!content.includes('<View style={style}>')) process.exit(0);

  const jsxBlock = `    return (
      <View style={style}>
        <Svg width={size + padding} height={size + padding}>
          <G rotation={rotation} originX={(size + padding) / 2} originY={(size + padding) / 2}>
            {backgroundColor && (
              <Path
                d={backgroundPath}
                stroke={backgroundColor}
                strokeWidth={backgroundWidth || width}
                strokeLinecap={lineCap}
                strokeDasharray={strokeDasharrayBackground}
                fill="transparent"
              />
            )}
            {fill > 0 && (
              <Path
                d={circlePath}
                stroke={tintColor}
                strokeWidth={width}
                strokeLinecap={fillLineCap}
                strokeDasharray={strokeDasharrayTint}
                fill="transparent"
              />
            )}
            {cap}
          </G>
        </Svg>
        {children && <View style={localChildrenContainerStyle}>{children(fill)}</View>}
      </View>
    );
  }
}`;
  const patchedBlock = `    const gChildren = [
      backgroundColor && React.createElement(Path, {
        d: backgroundPath,
        stroke: backgroundColor,
        strokeWidth: backgroundWidth || width,
        strokeLinecap: lineCap,
        strokeDasharray: strokeDasharrayBackground,
        fill: 'transparent',
      }),
      fill > 0 && React.createElement(Path, {
        d: circlePath,
        stroke: tintColor,
        strokeWidth: width,
        strokeLinecap: fillLineCap,
        strokeDasharray: strokeDasharrayTint,
        fill: 'transparent',
      }),
      cap,
    ].filter(Boolean);
    const g = React.createElement(G, {
      rotation: rotation,
      originX: (size + padding) / 2,
      originY: (size + padding) / 2,
    }, ...gChildren);
    const svg = React.createElement(Svg, { width: size + padding, height: size + padding }, g);
    const viewChildren = [svg];
    if (children) {
      viewChildren.push(React.createElement(View, { style: localChildrenContainerStyle }, children(fill)));
    }
    return React.createElement(View, { style: style }, viewChildren);
  }
}`;

  content = content.replace(jsxBlock, patchedBlock);
  if (!content.includes('<View style={style}>')) {
    fs.writeFileSync(circularPath, content, 'utf8');
    console.log('fix-circular-progress: Patched CircularProgress.js for Android bundling.');
  }
} catch (err) {
  console.warn('fix-circular-progress (Circular):', err.message);
}
