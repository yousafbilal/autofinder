/**
 * Fix react-native-image-viewing dist/ImageViewing.js: replace JSX with React.createElement
 * so Android/Metro bundler does not fail (package ships untranspiled JSX in .js files).
 */
const fs = require('fs');
const path = require('path');

const targetPath = path.join(
  __dirname,
  'node_modules',
  'react-native-image-viewing',
  'dist',
  'ImageViewing.js'
);

const patchedContent = `/**
 * Copyright (c) JOB TODAY S.A. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
import React, { useCallback, useRef, useEffect } from "react";
import { Animated, Dimensions, StyleSheet, View, VirtualizedList, Modal, } from "react-native";
import ImageItem from "./components/ImageItem/ImageItem";
import ImageDefaultHeader from "./components/ImageDefaultHeader";
import StatusBarManager from "./components/StatusBarManager";
import useAnimatedComponents from "./hooks/useAnimatedComponents";
import useImageIndexChange from "./hooks/useImageIndexChange";
import useRequestClose from "./hooks/useRequestClose";
const DEFAULT_ANIMATION_TYPE = "fade";
const DEFAULT_BG_COLOR = "#000";
const DEFAULT_DELAY_LONG_PRESS = 800;
const SCREEN = Dimensions.get("screen");
const SCREEN_WIDTH = SCREEN.width;
function ImageViewing({ images, keyExtractor, imageIndex, visible, onRequestClose, onLongPress = () => { }, onImageIndexChange, animationType = DEFAULT_ANIMATION_TYPE, backgroundColor = DEFAULT_BG_COLOR, presentationStyle, swipeToCloseEnabled, doubleTapToZoomEnabled, delayLongPress = DEFAULT_DELAY_LONG_PRESS, HeaderComponent, FooterComponent, }) {
    const imageList = useRef(null);
    const [opacity, onRequestCloseEnhanced] = useRequestClose(onRequestClose);
    const [currentImageIndex, onScroll] = useImageIndexChange(imageIndex, SCREEN);
    const [headerTransform, footerTransform, toggleBarsVisible] = useAnimatedComponents();
    useEffect(() => {
        if (onImageIndexChange) {
            onImageIndexChange(currentImageIndex);
        }
    }, [currentImageIndex]);
    const onZoom = useCallback((isScaled) => {
        var _a, _b;
        // @ts-ignore
        (_b = (_a = imageList) === null || _a === void 0 ? void 0 : _a.current) === null || _b === void 0 ? void 0 : _b.setNativeProps({ scrollEnabled: !isScaled });
        toggleBarsVisible(!isScaled);
    }, [imageList]);
    if (!visible) {
        return null;
    }
    return React.createElement(Modal, {
        transparent: presentationStyle === "overFullScreen",
        visible: visible,
        presentationStyle: presentationStyle,
        animationType: animationType,
        onRequestClose: onRequestCloseEnhanced,
        supportedOrientations: ["portrait"],
        hardwareAccelerated: true
    }, React.createElement(StatusBarManager, { presentationStyle: presentationStyle }), React.createElement(View, { style: [styles.container, { opacity, backgroundColor }] }, React.createElement(Animated.View, { style: [styles.header, { transform: headerTransform }] }, typeof HeaderComponent !== "undefined" ? React.createElement(HeaderComponent, { imageIndex: currentImageIndex }) : React.createElement(ImageDefaultHeader, { onRequestClose: onRequestCloseEnhanced })), React.createElement(VirtualizedList, {
        ref: imageList,
        data: images,
        horizontal: true,
        pagingEnabled: true,
        windowSize: 2,
        initialNumToRender: 1,
        maxToRenderPerBatch: 1,
        showsHorizontalScrollIndicator: false,
        showsVerticalScrollIndicator: false,
        initialScrollIndex: imageIndex,
        getItem: (_, index) => images[index],
        getItemCount: () => images.length,
        getItemLayout: (_, index) => ({ length: SCREEN_WIDTH, offset: SCREEN_WIDTH * index, index }),
        renderItem: ({ item: imageSrc }) => React.createElement(ImageItem, {
            onZoom: onZoom,
            imageSrc: imageSrc,
            onRequestClose: onRequestCloseEnhanced,
            onLongPress: onLongPress,
            delayLongPress: delayLongPress,
            swipeToCloseEnabled: swipeToCloseEnabled,
            doubleTapToZoomEnabled: doubleTapToZoomEnabled
        }),
        onMomentumScrollEnd: onScroll,
        keyExtractor: keyExtractor ? (imageSrc, index) => keyExtractor(imageSrc, index) : (imageSrc, index) => typeof imageSrc === "number" ? \`\${imageSrc}\` : imageSrc.uri
    }), typeof FooterComponent !== "undefined" && React.createElement(Animated.View, { style: [styles.footer, { transform: footerTransform }] }, React.createElement(FooterComponent, { imageIndex: currentImageIndex })))));
}
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#000",
    },
    header: {
        position: "absolute",
        width: "100%",
        zIndex: 1,
        top: 0,
    },
    footer: {
        position: "absolute",
        width: "100%",
        zIndex: 1,
        bottom: 0,
    },
});
const EnhancedImageViewing = (props) => React.createElement(ImageViewing, Object.assign({ key: props.imageIndex }, props));
export default EnhancedImageViewing;
`;

try {
  if (fs.existsSync(targetPath)) {
    fs.writeFileSync(targetPath, patchedContent, 'utf8');
    console.log('fix-image-viewing: Patched react-native-image-viewing/dist/ImageViewing.js for Android bundling.');
  }
} catch (err) {
  console.warn('fix-image-viewing: Could not patch (package may not be installed):', err.message);
}
