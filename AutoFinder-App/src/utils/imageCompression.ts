import * as ImageManipulator from 'expo-image-manipulator';

/**
 * Compress and resize image to reduce file size while maintaining quality
 * @param uri - Image URI to compress
 * @param maxWidth - Maximum width (default: 1200 for HD quality)
 * @param maxHeight - Maximum height (default: 1200 for HD quality)
 * @param quality - Compression quality 0-1 (default: 0.8 for good quality)
 * @returns Compressed image URI
 */
export async function compressImage(
  uri: string,
  maxWidth: number = 1200,
  maxHeight: number = 1200,
  quality: number = 0.8
): Promise<string> {
  try {
    console.log(`🔄 Compressing image (${maxWidth}x${maxHeight} @ ${quality * 100}%): ${uri.substring(0, 50)}...`);
    const manipResult = await ImageManipulator.manipulateAsync(
      uri,
      [
        { resize: { width: maxWidth, height: maxHeight } },
      ],
      {
        compress: quality,
        format: ImageManipulator.SaveFormat.JPEG,
      }
    );
    console.log(`✅ Image compressed: ${manipResult.uri.substring(0, 50)}...`);
    return manipResult.uri;
  } catch (error) {
    console.error('❌ Error compressing image:', error);
    // Return original URI if compression fails
    return uri;
  }
}

/**
 * Compress multiple images with HD quality settings
 * @param uris - Array of image URIs
 * @param maxWidth - Maximum width (default: 1200 for HD quality)
 * @param maxHeight - Maximum height (default: 1200 for HD quality)
 * @param quality - Compression quality 0-1 (default: 0.8 for good quality)
 * @returns Array of compressed image URIs
 */
export async function compressImages(
  uris: string[],
  maxWidth: number = 1200,
  maxHeight: number = 1200,
  quality: number = 0.8
): Promise<string[]> {
  try {
    console.log(`🔄 Compressing ${uris.length} images at HD quality (${maxWidth}x${maxHeight} @ ${quality * 100}%)...`);
    const compressedUris = await Promise.all(
      uris.map((uri, index) => {
        console.log(`🔄 Compressing image ${index + 1}/${uris.length}`);
        return compressImage(uri, maxWidth, maxHeight, quality);
      })
    );
    console.log(`✅ All ${compressedUris.length} images compressed successfully`);
    return compressedUris;
  } catch (error) {
    console.error('❌ Error compressing images:', error);
    // Return original URIs if compression fails
    return uris;
  }
}

