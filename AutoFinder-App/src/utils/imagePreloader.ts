import { Image } from 'react-native';

// Timeout for image prefetch (15s - avoids indefinite hangs on slow network)
const IMAGE_PREFETCH_TIMEOUT = 15000;

/**
 * Preload a single image with priority (with timeout to avoid hanging)
 */
export async function preloadSingleImage(url: string): Promise<boolean> {
  try {
    if (!url || typeof url !== 'string') return false;
    await Promise.race([
      Image.prefetch(url),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Image prefetch timed out')), IMAGE_PREFETCH_TIMEOUT)
      )
    ]);
    return true;
  } catch (error: any) {
    // Silently handle 404 and other image loading errors
    // Don't log errors for missing images - they'll be handled by Image component's onError
    if (error?.message?.includes('404') || error?.message?.includes('Not Found')) {
      // Silently ignore 404 errors
      return false;
    }
    // Only log non-404 errors
    if (!error?.message?.includes('404')) {
      console.log('⚠️ Image preload failed (non-404):', url);
    }
    return false;
  }
}

/**
 * Preload multiple images for faster display
 * First image gets priority for instant display
 */
export async function preloadImages(urls: string[]): Promise<void> {
  try {
    const validUrls = urls.filter(url => url && typeof url === 'string');
    if (validUrls.length === 0) return;

    // Priority: Preload first image immediately (most important)
    if (validUrls.length > 0) {
      await preloadSingleImage(validUrls[0]);
    }

    // Then preload rest in parallel batches
    if (validUrls.length > 1) {
      const remainingUrls = validUrls.slice(1);
      const batchSize = 5;
      for (let i = 0; i < remainingUrls.length; i += batchSize) {
        const batch = remainingUrls.slice(i, i + batchSize);
        Promise.allSettled(
          batch.map(url => Image.prefetch(url).catch(() => {
            // Silently fail - image will load normally if prefetch fails
          }))
        );
      }
    }
  } catch (error) {
    console.error('Error preloading images:', error);
  }
}

/**
 * Preload images when navigating to detail screen
 * This is called BEFORE navigation to ensure images are ready
 */
export async function preloadDetailImages(images: string[]): Promise<void> {
  try {
    const validUrls = images.filter(url => url && typeof url === 'string');
    if (validUrls.length === 0) return;

    // Priority: First image MUST be prefetched before navigation
    // If it fails (404), continue anyway - Image component will handle it
    if (validUrls.length > 0) {
      await preloadSingleImage(validUrls[0]).catch(() => {
        // Silently continue even if first image fails
      });
    }

    // Preload rest in background
    if (validUrls.length > 1) {
      preloadImages(validUrls.slice(1)).catch(() => {
        // Silently fail
      });
    }
  } catch (error: any) {
    // Silently handle errors - don't block navigation
    if (!error?.message?.includes('404')) {
      console.log('⚠️ Error preloading detail images (non-404):', error);
    }
  }
}

