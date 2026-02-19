import AsyncStorage from '@react-native-async-storage/async-storage';
import { Image } from 'react-native';
import { API_URL } from '../../config';

// Cache keys
const CACHE_KEYS = {
  FEATURED_ADS: 'cache_featured_ads',
  CERTIFIED_ADS: 'cache_certified_ads',
  CERTIFIED_BIKES: 'cache_certified_bikes',
  AUTO_STORE_ADS: 'cache_auto_store_ads',
  LATEST_VIDEOS: 'cache_latest_videos',
  LATEST_NEWS: 'cache_latest_news',
  MANAGED_ADS: 'cache_managed_ads',
  FUEL_PRICES: 'cache_fuel_prices',
};

// Cache expiry time - 30 minutes for better persistence
const CACHE_EXPIRY = 30 * 60 * 1000;

interface CacheData<T> {
  data: T;
  timestamp: number;
}

/**
 * Save data to cache
 */
export async function saveToCache<T>(key: string, data: T): Promise<void> {
  try {
    const cacheData: CacheData<T> = {
      data,
      timestamp: Date.now(),
    };
    await AsyncStorage.setItem(key, JSON.stringify(cacheData));
  } catch (error) {
    // Silent fail
  }
}

/**
 * Get data from cache - ALWAYS returns data if exists (even if expired)
 * Returns { data, isExpired } so caller can decide to refresh
 */
export async function getFromCache<T>(key: string): Promise<T | null> {
  try {
    const cached = await AsyncStorage.getItem(key);
    if (!cached) return null;

    const cacheData: CacheData<T> = JSON.parse(cached);
    
    // Return data even if expired - let caller decide to refresh
    return cacheData.data;
  } catch (error) {
    return null;
  }
}

/**
 * Check if cache is expired
 */
export async function isCacheExpired(key: string): Promise<boolean> {
  try {
    const cached = await AsyncStorage.getItem(key);
    if (!cached) return true;

    const cacheData = JSON.parse(cached);
    const age = Date.now() - cacheData.timestamp;
    return age > CACHE_EXPIRY;
  } catch {
    return true;
  }
}

/**
 * Fast fetch with cache - returns cached data immediately, then fetches fresh data in background
 */
export async function fastFetch<T>(
  url: string,
  cacheKey: string,
  options: RequestInit = {}
): Promise<T> {
  // 1. Try to get cached data first (instant display)
  const cachedData = await getFromCache<T>(cacheKey);
  if (cachedData) {
    // Fetch fresh data in background (don't wait)
    // Silently handle abort errors and rate limit errors - they're expected
    fetchFreshData(url, cacheKey, options).catch((error: any) => {
      // Don't log abort errors - they're expected behavior
      if (error?.name === 'AbortError' || error?.message === 'Aborted' || error?.message?.includes('timeout')) {
        return; // Silent ignore
      }
      
      // FIXED: Handle HTTP 429 (rate limit) errors silently - use cache instead
      if (error?.message?.includes('HTTP 429') || error?.message?.includes('429') || error?.status === 429) {
        // Rate limit hit - silently use cache, don't log as error
        return;
      }
      
      // FIXED: Handle HTTP 404 (not found) errors silently - endpoint doesn't exist
      if (error?.message?.includes('HTTP 404') || error?.message?.includes('404') || error?.status === 404) {
        // Endpoint not found - silently ignore (component will use defaults)
        return;
      }
      
      // Only log other errors
      console.error(`Background fetch error for ${cacheKey}:`, error);
    });
    return cachedData;
  }

  // 2. No cache, fetch fresh data
  return await fetchFreshData(url, cacheKey, options);
}

/**
 * Fetch fresh data and save to cache
 */
async function fetchFreshData<T>(
  url: string,
  cacheKey: string,
  options: RequestInit = {}
): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 seconds timeout

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      // FIXED: Handle HTTP 429 (rate limit) gracefully - return cached data if available
      if (response.status === 429) {
        console.log(`⚠️ Rate limit hit (429) for ${cacheKey}, using cached data`);
        const cachedData = await getFromCache<T>(cacheKey);
        if (cachedData) {
          return cachedData;
        }
        // If no cache, throw error but don't log as critical
        throw new Error('HTTP 429');
      }
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    
    // Save to cache for next time
    await saveToCache(cacheKey, data);
    
    return data;
  } catch (error: any) {
    clearTimeout(timeoutId);
    
    // Handle abort errors gracefully - don't throw them as errors
    if (error.name === 'AbortError' || error.message === 'Aborted' || error.message?.includes('timeout')) {
      // Return cached data if available, otherwise throw a more user-friendly error
      const cachedData = await getFromCache<T>(cacheKey);
      if (cachedData) {
        return cachedData;
      }
      throw new Error('Request timed out');
    }
    
    // FIXED: Handle HTTP 429 (rate limit) - return cached data if available
    if (error?.message?.includes('HTTP 429') || error?.message?.includes('429')) {
      const cachedData = await getFromCache<T>(cacheKey);
      if (cachedData) {
        return cachedData;
      }
      throw error; // Re-throw if no cache
    }
    
    throw error;
  }
}

/**
 * Extract image URL from an ad object
 */
function getAdImageUrl(ad: any): string | null {
  if (!ad) return null;
  
  const imageField = ad.images?.[0] || ad.image || ad.image1 || ad.coverImage || ad.thumbnail;
  if (!imageField) return null;
  
  if (typeof imageField === 'string') {
    if (imageField.startsWith('http')) return imageField;
    if (imageField.startsWith('/uploads')) return `${API_URL}${imageField}`;
    return `${API_URL}/uploads/${imageField}`;
  }
  
  return null;
}

/**
 * Preload images from fetched data
 */
function preloadImages(data: any[], limit: number = 5): void {
  if (!Array.isArray(data)) return;
  
  const imagesToPreload = data
    .slice(0, limit)
    .map(ad => getAdImageUrl(ad))
    .filter((url): url is string => url !== null);
  
  if (imagesToPreload.length === 0) return;
  
  // Preload images in parallel (silent, don't wait)
  imagesToPreload.forEach(url => {
    Image.prefetch(url).catch(() => {});
  });
}

/**
 * Clear specific cache by key
 */
export async function clearCache(key: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(key);
    console.log(`🗑️ Cleared cache: ${key}`);
  } catch (error) {
    console.error(`❌ Error clearing cache ${key}:`, error);
  }
}

/**
 * Clear all cache
 */
export async function clearAllCache(): Promise<void> {
  try {
    await Promise.all(
      Object.values(CACHE_KEYS).map(key => AsyncStorage.removeItem(key))
    );
    console.log('🗑️ Cleared all cache');
  } catch (error) {
    console.error('❌ Error clearing all cache:', error);
  }
}

/**
 * Preload all home screen data in parallel - FAST
 */
export async function preloadHomeData(): Promise<void> {
  console.log('🚀 Preloading home data...');
  
  try {
    const endpoints = [
      { url: `${API_URL}/featured_ads/public`, key: CACHE_KEYS.FEATURED_ADS },
      { url: `${API_URL}/new_cars/public`, key: CACHE_KEYS.CERTIFIED_ADS },
      { url: `${API_URL}/premium-bike-ads?limit=10`, key: CACHE_KEYS.CERTIFIED_BIKES },
      { url: `${API_URL}/autoparts/public`, key: CACHE_KEYS.AUTO_STORE_ADS },
      { url: `${API_URL}/list_it_for_you_ad/public`, key: CACHE_KEYS.MANAGED_ADS },
      { url: `${API_URL}/videos`, key: CACHE_KEYS.LATEST_VIDEOS },
      { url: `${API_URL}/blogs`, key: CACHE_KEYS.LATEST_NEWS },
    ];
    
    // Fetch all in parallel
    const results = await Promise.allSettled(
      endpoints.map(async ({ url, key }) => {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 10000);
          
          const response = await fetch(url, { signal: controller.signal });
          clearTimeout(timeoutId);
          
          if (response.ok) {
            const data = await response.json();
            await saveToCache(key, data);
            
            // Preload images for this data
            if (Array.isArray(data)) {
              preloadImages(data, 3);
            }
            
            return { key, success: true };
          }
        } catch (e) {
          return { key, success: false };
        }
      })
    );
    
    const successful = results.filter(r => r.status === 'fulfilled').length;
    console.log(`✅ Preloaded ${successful}/${endpoints.length} endpoints`);
    
  } catch (error) {
    console.log('Preload error:', error);
  }
}

// Export cache keys for use in components
export { CACHE_KEYS };
