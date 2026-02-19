import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator, Image, ImageStyle, ViewStyle, ImageSourcePropType } from 'react-native';

interface OptimizedImageProps {
  source: { uri: string } | ImageSourcePropType;
  style?: ImageStyle | ViewStyle;
  resizeMode?: 'cover' | 'contain' | 'stretch' | 'repeat' | 'center';
  onLoad?: () => void;
  onError?: () => void;
}

const OptimizedImage: React.FC<OptimizedImageProps> = ({
  source,
  style,
  resizeMode = 'cover',
  onLoad,
  onError,
}) => {
  const [loading, setLoading] = useState(false); // Start with false - assume cached
  const [error, setError] = useState(false);
  const [imageUri, setImageUri] = useState<string | null>(null);

  // Set image URI immediately and prefetch for instant display
  useEffect(() => {
    if (typeof source === 'object' && 'uri' in source && source.uri) {
      const uri = source.uri;
      setImageUri(uri);
      
      // Immediately prefetch image in background - don't wait
      // This ensures image is cached for instant display
      Image.prefetch(uri)
        .then(() => {
          // Image cached - will load instantly
        })
        .catch(() => {
          // Silently fail - image will load normally
        });
    } else {
      setImageUri(null);
    }
  }, [source]);

  const handleLoadStart = () => {
    // Only show loading if image actually needs to load
    setLoading(true);
  };

  const handleLoad = () => {
    setLoading(false);
    onLoad?.();
  };

  const handleError = () => {
    setLoading(false);
    setError(true);
    onError?.();
  };

  // For remote images
  if (typeof source === 'object' && 'uri' in source && source.uri) {
    const uri = imageUri || source.uri;
    
    return (
      <View style={[styles.container, style]}>
        {loading && !error && (
          <View style={[StyleSheet.absoluteFill, styles.loadingContainer]}>
            <ActivityIndicator size="small" color="#CD0100" />
          </View>
        )}
        {!error ? (
          <Image
            source={{ uri }}
            style={[styles.image, style]}
            resizeMode={resizeMode}
            onLoadStart={handleLoadStart}
            onLoad={handleLoad}
            onError={handleError}
          />
        ) : (
          <Image
            source={require('../../assets/car-placeholder.png')}
            style={[styles.image, style]}
            resizeMode="cover"
          />
        )}
      </View>
    );
  }

  // For local images (require)
  return (
    <Image
      source={source as ImageSourcePropType}
      style={style}
      resizeMode={resizeMode}
      onLoad={handleLoad}
      onError={handleError}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    overflow: 'hidden',
    width: '100%',
    height: '100%',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },
});

export default OptimizedImage;

