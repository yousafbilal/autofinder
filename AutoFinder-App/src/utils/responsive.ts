import { Dimensions, Platform, PixelRatio, StyleSheet } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Base dimensions (iPhone 12/13 - most common)
const BASE_WIDTH = 390;
const BASE_HEIGHT = 844;

// Screen size categories
export const isTablet = SCREEN_WIDTH >= 768;
export const isSmallScreen = SCREEN_WIDTH < 375;
export const isLargeScreen = SCREEN_WIDTH > 414;
export const isAndroid = Platform.OS === 'android';
export const isIOS = Platform.OS === 'ios';

// Responsive width (percentage based)
export const wp = (percentage: number): number => {
  return (SCREEN_WIDTH * percentage) / 100;
};

// Responsive height (percentage based)
export const hp = (percentage: number): number => {
  return (SCREEN_HEIGHT * percentage) / 100;
};

// Responsive font size
export const rf = (size: number): number => {
  const scale = SCREEN_WIDTH / BASE_WIDTH;
  const newSize = size * scale;
  
  // Android needs slightly larger fonts for readability
  if (isAndroid) {
    return Math.round(PixelRatio.roundToNearestPixel(newSize * 1.05));
  }
  
  return Math.round(PixelRatio.roundToNearestPixel(newSize));
};

// Responsive padding/margin
export const rp = (size: number): number => {
  const scale = SCREEN_WIDTH / BASE_WIDTH;
  const newSize = size * scale;
  
  // Android needs slightly more padding
  if (isAndroid) {
    return Math.round(newSize * 1.1);
  }
  
  return Math.round(newSize);
};

// Responsive spacing (for gaps, margins)
export const rs = (size: number): number => {
  return rp(size);
};

// Get responsive font sizes
export const getFontSize = {
  xs: rf(10),
  sm: rf(12),
  base: rf(14),
  md: rf(16),
  lg: rf(18),
  xl: rf(20),
  '2xl': rf(24),
  '3xl': rf(30),
  '4xl': rf(36),
};

// Get responsive padding
export const getPadding = {
  xs: rp(4),
  sm: rp(8),
  md: rp(12),
  lg: rp(16),
  xl: rp(20),
  '2xl': rp(24),
  '3xl': rp(32),
};

// Get responsive margin
export const getMargin = {
  xs: rp(4),
  sm: rp(8),
  md: rp(12),
  lg: rp(16),
  xl: rp(20),
  '2xl': rp(24),
  '3xl': rp(32),
};

// Platform-specific adjustments
export const platformStyle = {
  paddingTop: isAndroid ? rp(8) : rp(0),
  paddingBottom: isAndroid ? rp(8) : rp(0),
  fontSize: (size: number) => isAndroid ? rf(size * 1.05) : rf(size),
  lineHeight: (size: number) => isAndroid ? rf(size * 1.4) : rf(size * 1.2),
};

// Screen dimensions
export const screenDimensions = {
  width: SCREEN_WIDTH,
  height: SCREEN_HEIGHT,
  isTablet,
  isSmallScreen,
  isLargeScreen,
};

/**
 * Create responsive stylesheet - automatically converts fontSize, padding, margin to responsive values
 */
export const createResponsiveStyleSheet = (styles: any) => {
  const responsiveStyles: any = {};
  
  const processStyle = (style: any): any => {
    if (!style || typeof style !== 'object') {
      return style;
    }
    
    const processed: any = {};
    
    for (const key in style) {
      const value = style[key];
      
      // Convert fontSize to responsive
      if (key === 'fontSize' && typeof value === 'number') {
        processed[key] = rf(value);
      }
      // Convert padding to responsive
      else if (key === 'padding' && typeof value === 'number') {
        processed[key] = rp(value);
      }
      // Convert paddingHorizontal to responsive
      else if (key === 'paddingHorizontal' && typeof value === 'number') {
        processed[key] = rp(value);
      }
      // Convert paddingVertical to responsive
      else if (key === 'paddingVertical' && typeof value === 'number') {
        processed[key] = rp(value);
      }
      // Convert paddingTop to responsive
      else if (key === 'paddingTop' && typeof value === 'number') {
        processed[key] = rp(value);
      }
      // Convert paddingBottom to responsive
      else if (key === 'paddingBottom' && typeof value === 'number') {
        processed[key] = rp(value);
      }
      // Convert paddingLeft to responsive
      else if (key === 'paddingLeft' && typeof value === 'number') {
        processed[key] = rp(value);
      }
      // Convert paddingRight to responsive
      else if (key === 'paddingRight' && typeof value === 'number') {
        processed[key] = rp(value);
      }
      // Convert margin to responsive
      else if (key === 'margin' && typeof value === 'number') {
        processed[key] = rp(value);
      }
      // Convert marginHorizontal to responsive
      else if (key === 'marginHorizontal' && typeof value === 'number') {
        processed[key] = rp(value);
      }
      // Convert marginVertical to responsive
      else if (key === 'marginVertical' && typeof value === 'number') {
        processed[key] = rp(value);
      }
      // Convert marginTop to responsive
      else if (key === 'marginTop' && typeof value === 'number') {
        processed[key] = rp(value);
      }
      // Convert marginBottom to responsive
      else if (key === 'marginBottom' && typeof value === 'number') {
        processed[key] = rp(value);
      }
      // Convert marginLeft to responsive
      else if (key === 'marginLeft' && typeof value === 'number') {
        processed[key] = rp(value);
      }
      // Convert marginRight to responsive
      else if (key === 'marginRight' && typeof value === 'number') {
        processed[key] = rp(value);
      }
      // Convert width/height if they're numbers (not percentages)
      else if ((key === 'width' || key === 'height') && typeof value === 'number' && value < 1000) {
        // Only convert if it's a reasonable pixel value (not a large number like screen width)
        processed[key] = rp(value);
      }
      // Convert gap to responsive
      else if (key === 'gap' && typeof value === 'number') {
        processed[key] = rp(value);
      }
      // Convert borderRadius to responsive
      else if (key === 'borderRadius' && typeof value === 'number') {
        processed[key] = rp(value);
      }
      // Recursively process nested objects
      else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        processed[key] = processStyle(value);
      }
      // Keep other values as is
      else {
        processed[key] = value;
      }
    }
    
    return processed;
  };
  
  for (const key in styles) {
    responsiveStyles[key] = processStyle(styles[key]);
  }
  
  return StyleSheet.create(responsiveStyles);
};

