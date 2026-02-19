/**
 * Fix @ptomasroos/react-native-multi-slider MultiSlider.js: replace JSX with React.createElement
 * so Android/Metro bundler does not fail (package ships untranspiled JSX in .js files).
 */
const fs = require('fs');
const path = require('path');

const targetPath = path.join(
  __dirname,
  'node_modules',
  '@ptomasroos',
  'react-native-multi-slider',
  'MultiSlider.js'
);

try {
  if (!fs.existsSync(targetPath)) return;
  let content = fs.readFileSync(targetPath, 'utf8');
  var needsPatch = content.includes('<React.Fragment>') ||
    (content.includes('const body = React.createElement') && content.includes('React.Fragment,'));
  if (!needsPatch) return;

  const renderStart = content.indexOf('  render() {');
  const stylesMatch = content.match(/\n\nconst styles\s*=\s*StyleSheet\.create/);
  const renderEnd = stylesMatch ? content.indexOf(stylesMatch[0]) : content.indexOf('  }\n}\n\nconst styles');
  if (renderStart === -1 || renderEnd === -1) return;

  const before = content.slice(0, renderStart);
  const after = content.slice(renderEnd);

  // Flattened render (variables for each part) so iOS/Android parsers don't choke on deep nesting
  const patchedRender = `  render() {
    const { positionOne, positionTwo } = this.state;
    const {
      selectedStyle,
      unselectedStyle,
      sliderLength,
      markerOffsetX,
      markerOffsetY,
    } = this.props;
    const twoMarkers = this.props.values.length == 2;

    const trackOneLength = positionOne;
    const trackOneStyle = twoMarkers ? unselectedStyle : selectedStyle || styles.selectedTrack;
    const trackThreeLength = twoMarkers ? sliderLength - positionTwo : 0;
    const trackThreeStyle = unselectedStyle;
    const trackTwoLength = sliderLength - trackOneLength - trackThreeLength;
    const trackTwoStyle = twoMarkers ? selectedStyle || styles.selectedTrack : unselectedStyle;
    const Marker = this.props.customMarker;
    const MarkerLeft = this.props.customMarkerLeft;
    const MarkerRight = this.props.customMarkerRight;
    const isMarkersSeparated = this.props.isMarkersSeparated || false;
    const Label = this.props.customLabel;
    const touchStyle = { borderRadius: (this.props.touchDimensions && this.props.touchDimensions.borderRadius) || 0 };
    const markerContainerOne = { top: markerOffsetY - 24, left: trackOneLength + markerOffsetX - 24 };
    const markerContainerTwo = { top: markerOffsetY - 24, right: trackThreeLength - markerOffsetX - 24 };
    const containerStyle = [styles.container, this.props.containerStyle];
    if (this.props.vertical) {
      containerStyle.push({ transform: [{ rotate: '-90deg' }] });
    }

    const trackOne = React.createElement(View, {
      style: [styles.track, this.props.trackStyle, trackOneStyle, { width: trackOneLength }],
    });
    const trackTwoProps = {
      style: [styles.track, this.props.trackStyle, trackTwoStyle, { width: trackTwoLength }],
    };
    if (twoMarkers && this._panResponderBetween && this._panResponderBetween.panHandlers) {
      Object.assign(trackTwoProps, this._panResponderBetween.panHandlers);
    }
    const trackTwo = React.createElement(View, trackTwoProps);
    const trackThree = twoMarkers ? React.createElement(View, {
      style: [styles.track, this.props.trackStyle, trackThreeStyle, { width: trackThreeLength }],
    }) : null;

    const markerOneInner = isMarkersSeparated === false
      ? React.createElement(Marker, {
          enabled: this.props.enabledOne,
          pressed: this.state.onePressed,
          markerStyle: this.props.markerStyle,
          pressedMarkerStyle: this.props.pressedMarkerStyle,
          disabledMarkerStyle: this.props.disabledMarkerStyle,
          currentValue: this.state.valueOne,
          valuePrefix: this.props.valuePrefix,
          valueSuffix: this.props.valueSuffix,
        })
      : React.createElement(MarkerLeft, {
          enabled: this.props.enabledOne,
          pressed: this.state.onePressed,
          markerStyle: this.props.markerStyle,
          pressedMarkerStyle: this.props.pressedMarkerStyle,
          disabledMarkerStyle: this.props.disabledMarkerStyle,
          currentValue: this.state.valueOne,
          valuePrefix: this.props.valuePrefix,
          valueSuffix: this.props.valueSuffix,
        });
    const markerOneTouchProps = {
      style: [styles.touch, touchStyle],
      ref: function(c) { this._markerOne = c; }.bind(this),
    };
    if (this._panResponderOne && this._panResponderOne.panHandlers) {
      Object.assign(markerOneTouchProps, this._panResponderOne.panHandlers);
    }
    const markerOneTouch = React.createElement(View, markerOneTouchProps, markerOneInner);
    const markerOne = React.createElement(View, {
      style: [
        styles.markerContainer,
        markerContainerOne,
        this.props.markerContainerStyle,
        positionOne > sliderLength / 2 ? styles.topMarkerContainer : null,
      ].filter(Boolean),
    }, markerOneTouch);

    const markerTwoInner = isMarkersSeparated === false
      ? React.createElement(Marker, {
          pressed: this.state.twoPressed,
          markerStyle: this.props.markerStyle,
          pressedMarkerStyle: this.props.pressedMarkerStyle,
          disabledMarkerStyle: this.props.disabledMarkerStyle,
          currentValue: this.state.valueTwo,
          enabled: this.props.enabledTwo,
          valuePrefix: this.props.valuePrefix,
          valueSuffix: this.props.valueSuffix,
        })
      : React.createElement(MarkerRight, {
          pressed: this.state.twoPressed,
          markerStyle: this.props.markerStyle,
          pressedMarkerStyle: this.props.pressedMarkerStyle,
          disabledMarkerStyle: this.props.disabledMarkerStyle,
          currentValue: this.state.valueTwo,
          enabled: this.props.enabledTwo,
          valuePrefix: this.props.valuePrefix,
          valueSuffix: this.props.valueSuffix,
        });
    const markerTwoTouchProps = {
      style: [styles.touch, touchStyle],
      ref: function(c) { this._markerTwo = c; }.bind(this),
    };
    if (this._panResponderTwo && this._panResponderTwo.panHandlers) {
      Object.assign(markerTwoTouchProps, this._panResponderTwo.panHandlers);
    }
    const markerTwoTouch = React.createElement(View, markerTwoTouchProps, markerTwoInner);
    const markerTwo = twoMarkers && positionOne !== this.props.sliderLength
      ? React.createElement(View, {
          style: [styles.markerContainer, markerContainerTwo, this.props.markerContainerStyle],
        }, markerTwoTouch)
      : null;

    const fullTrackChildren = [trackOne, trackTwo, trackThree, markerOne, markerTwo].filter(Boolean);
    const fullTrack = React.createElement.apply(React, [View, { style: [styles.fullTrack, { width: sliderLength }] }].concat(fullTrackChildren));
    const body = React.createElement(React.Fragment, null, fullTrack);

    const mainChildren = [];
    if (this.props.enableLabel) {
      mainChildren.push(React.createElement(Label, {
        oneMarkerValue: this.state.valueOne,
        twoMarkerValue: this.state.valueTwo,
        oneMarkerLeftPosition: positionOne,
        twoMarkerLeftPosition: positionTwo,
        oneMarkerPressed: this.state.onePressed,
        twoMarkerPressed: this.state.twoPressed,
      }));
    }
    if (this.props.imageBackgroundSource) {
      mainChildren.push(React.createElement(ImageBackground, {
        source: this.props.imageBackgroundSource,
        style: [{ width: '100%', height: '100%' }, containerStyle],
      }, body));
    } else {
      mainChildren.push(React.createElement(View, { style: containerStyle }, body));
    }
    return React.createElement.apply(React, [View, null].concat(mainChildren));
  }
}
`;

  fs.writeFileSync(targetPath, before + patchedRender + after, 'utf8');
  console.log('fix-multi-slider: Patched MultiSlider.js for Android bundling.');
} catch (err) {
  console.warn('fix-multi-slider:', err.message);
}
