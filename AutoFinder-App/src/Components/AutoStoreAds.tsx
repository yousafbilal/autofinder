import React, { useEffect, useState, useRef } from "react";
import { FlatList, StyleSheet, View, Image } from "react-native";
import AutoStoreCard from "./AutoStoreCard";
import { API_URL } from "../../config";
import AdCardSkeleton from "./Commons/AdCardSkeleton";
import { buildImageUrls, buildImageUrl } from "../utils/safeImageUtils";
import { CACHE_KEYS, getFromCache, saveToCache, clearCache } from "../services/cacheService";
import { safeApiCall } from "../utils/apiUtils";

interface AutoStoreDTO {
  _id: string;
  title: string;
  price: number;
  image1: string;
  image2: string;
  image3: string;
  image4: string;
  image5: string;
  image6: string;
  image7: string;
  image8: string;
  location?: string;
  adCity?: string;
  city?: string;
  registrationCity?: string;
  engineCapacity?: string | number;
  engineSize?: string | number;
  compatibility?: string;
  partCategory?: string;
  isActive?: boolean;
  isDeleted?: boolean;
}

const AutoStoreAds = () => {
  const [ads, setAds] = useState<AutoStoreDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const isMountedRef = useRef(true);
  const hasFetchedRef = useRef(false);

  useEffect(() => {
    console.log("🚀 AutoStoreAds: Component mounted, starting fetch...");
    console.log("🔗 AutoStoreAds: API_URL:", API_URL);
    isMountedRef.current = true;

    // Clear cache to force fresh data load
    clearCache(CACHE_KEYS.AUTO_STORE_ADS).catch(() => {});

    // STEP 1: Load from cache IMMEDIATELY (will be empty after clear, so fresh fetch happens)
    const loadCacheFirst = async () => {
      try {
        const cachedData = await getFromCache<AutoStoreDTO[]>(CACHE_KEYS.AUTO_STORE_ADS);
        if (cachedData && Array.isArray(cachedData) && isMountedRef.current) {
          // Normalize IDs in cached data first
          const normalizedCache = cachedData.map((item: any, index: number) => {
            let safeId: string = '';
            try {
              const rawId = item._id;
              if (!rawId) {
                safeId = `autostore-cache-${index}-${Date.now()}`;
              } else if (typeof rawId === 'string') {
                safeId = rawId;
              } else if (typeof rawId === 'number') {
                safeId = String(rawId);
              } else if (typeof rawId === 'object') {
                const keys = Object.keys(rawId);
                if (keys.length === 0) {
                  safeId = `autostore-cache-${index}-${Date.now()}`;
                } else {
                  if (rawId.toString && typeof rawId.toString === 'function') {
                    const str = rawId.toString();
                    if (str && str !== '[object Object]' && str.length > 10) {
                      safeId = str;
                    } else if (rawId._id) {
                      safeId = typeof rawId._id === 'string' ? rawId._id : String(rawId._id);
                    } else if (rawId.$oid) {
                      safeId = String(rawId.$oid);
                    } else {
                      safeId = `autostore-cache-${index}-${Date.now()}`;
                    }
                  } else {
                    if (rawId._id) {
                      safeId = typeof rawId._id === 'string' ? rawId._id : String(rawId._id);
                    } else if (rawId.$oid) {
                      safeId = String(rawId.$oid);
                    } else {
                      safeId = `autostore-cache-${index}-${Date.now()}`;
                    }
                  }
                }
              } else {
                safeId = String(rawId);
              }
              
              if (!safeId || safeId === '[object Object]' || safeId.trim() === '') {
                safeId = `autostore-cache-${index}-${Date.now()}`;
              }
              
              return { ...item, _id: safeId, id: safeId };
            } catch (e) {
              return { ...item, _id: `autostore-cache-${index}-${Date.now()}`, id: `autostore-cache-${index}-${Date.now()}` };
            }
          });
          
          // Filter out deleted items and items with invalid/empty IDs
          const validAds = normalizedCache.filter((item: any) => {
            // Only filter out explicitly deleted items
            if (item.isDeleted === true) return false;
            
            // Check if _id is valid (not empty object)
            const rawId = item._id;
            if (!rawId) return false;
            if (typeof rawId === 'object' && Object.keys(rawId).length === 0) return false;
            
            return true;
          });
          if (validAds.length > 0) {
            console.log(`✅ AutoStoreAds: Loaded ${validAds.length} ads from cache`);
            setAds(validAds);
            setLoading(false);
            
            // Preload first images
            validAds.slice(0, 5).forEach((ad) => {
              if (ad.image1) {
                const imgUrl = buildImageUrl(ad.image1, API_URL);
                if (imgUrl) Image.prefetch(imgUrl).catch(() => {});
              }
            });
          } else {
            console.log(`⚠️ AutoStoreAds: No valid ads in cache`);
          }
        }
      } catch (e) {
        console.error(`❌ AutoStoreAds: Error loading cache:`, e);
      }
    };

    loadCacheFirst();

    // STEP 2: Fetch fresh data in background
    const fetchFreshData = async () => {
      if (hasFetchedRef.current) return;
      hasFetchedRef.current = true;

      try {
        console.log("🔄 AutoStoreAds: Fetching autoparts from /autoparts/public...");
        
        // Use public endpoint for autoparts with safeApiCall
        const timestamp = new Date().getTime();
        const result = await safeApiCall<any[]>(`${API_URL}/autoparts/public?_t=${timestamp}`, {
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache',
            'Accept': 'application/json'
          }
        }, 2); // 2 retries

        if (!result.success) {
          console.error(`❌ AutoStoreAds: API call failed:`, result.error || 'Unknown error');
          if (result.status) {
            console.error(`❌ AutoStoreAds: Status code:`, result.status);
          }
        }
        
        if (result.success && result.data && isMountedRef.current) {
          const data = result.data;
          console.log(`📦 AutoStoreAds: Received ${Array.isArray(data) ? data.length : 'not array'} items`);
          
          if (!Array.isArray(data)) {
            console.error(`❌ AutoStoreAds: Data is not an array:`, typeof data, data);
          }
          
          if (Array.isArray(data)) {
            // Normalize IDs first - convert object IDs to strings
            const normalizedData = data.map((item: any, index: number) => {
              let safeId: string = '';
              
              try {
                const rawId = item._id;
                
                // Debug: Log the raw ID structure
                if (index < 3) {
                  console.log(`🔍 AutoStoreAds: Item ${index} raw _id:`, {
                    type: typeof rawId,
                    value: rawId,
                    keys: rawId && typeof rawId === 'object' ? Object.keys(rawId) : [],
                    hasToString: rawId && typeof rawId === 'object' && typeof rawId.toString === 'function',
                    stringified: JSON.stringify(rawId)
                  });
                }
                
                if (!rawId) {
                  console.warn(`⚠️ AutoStoreAds: Item ${index} has no _id, using fallback`);
                  safeId = `autostore-${index}-${Date.now()}`;
                } else if (typeof rawId === 'string') {
                  safeId = rawId;
                } else if (typeof rawId === 'number') {
                  safeId = String(rawId);
                } else if (typeof rawId === 'object') {
                  // MongoDB ObjectId might have toString() even if Object.keys() is empty
                  // ALWAYS try toString() FIRST - it works even for empty-looking objects
                  if (rawId.toString && typeof rawId.toString === 'function') {
                    try {
                      const str = rawId.toString(); // Call directly
                      if (str && str !== '[object Object]' && str.length >= 10 && str.length <= 30) {
                        // Valid MongoDB ObjectId string (usually 24 chars)
                        safeId = str;
                        if (index < 3) {
                          console.log(`✅ AutoStoreAds: Item ${index} extracted ID via toString():`, safeId.substring(0, 10) + '...');
                        }
                      } else {
                        // toString() returned invalid value, try nested properties
                        if (rawId._id) {
                          safeId = typeof rawId._id === 'string' ? rawId._id : String(rawId._id);
                        } else if (rawId.$oid) {
                          safeId = String(rawId.$oid);
                        } else if (rawId.id) {
                          safeId = typeof rawId.id === 'string' ? rawId.id : String(rawId.id);
                        } else {
                          // Last resort: check JSON representation
                          const objStr = JSON.stringify(rawId);
                          if (objStr && objStr !== '{}' && objStr.length > 2) {
                            try {
                              const parsed = JSON.parse(objStr);
                              if (parsed.$oid) {
                                safeId = String(parsed.$oid);
                              } else if (parsed._id) {
                                safeId = typeof parsed._id === 'string' ? parsed._id : String(parsed._id);
                              } else {
                                throw new Error('No extractable ID in JSON');
                              }
                            } catch (parseErr) {
                              throw new Error('Cannot parse object ID from JSON');
                            }
                          } else {
                            throw new Error('Empty object ID - toString() returned invalid value');
                          }
                        }
                      }
                    } catch (toStringErr: any) {
                      // toString() threw an error, try nested properties
                      if (rawId._id) {
                        safeId = typeof rawId._id === 'string' ? rawId._id : String(rawId._id);
                      } else if (rawId.$oid) {
                        safeId = String(rawId.$oid);
                      } else if (rawId.id) {
                        safeId = typeof rawId.id === 'string' ? rawId.id : String(rawId.id);
                      } else {
                        throw new Error(`toString() failed: ${toStringErr?.message || 'unknown error'}`);
                      }
                    }
                  } else {
                    // No toString method, try nested properties directly
                    const keys = Object.keys(rawId);
                    if (keys.length > 0) {
                      if (rawId._id) {
                        safeId = typeof rawId._id === 'string' ? rawId._id : String(rawId._id);
                      } else if (rawId.$oid) {
                        safeId = String(rawId.$oid);
                      } else if (rawId.id) {
                        safeId = typeof rawId.id === 'string' ? rawId.id : String(rawId.id);
                      } else {
                        // Try JSON representation
                        const objStr = JSON.stringify(rawId);
                        if (objStr && objStr !== '{}') {
                          try {
                            const parsed = JSON.parse(objStr);
                            if (parsed.$oid) {
                              safeId = String(parsed.$oid);
                            } else if (parsed._id) {
                              safeId = typeof parsed._id === 'string' ? parsed._id : String(parsed._id);
                            } else {
                              throw new Error('No extractable ID in JSON');
                            }
                          } catch (parseErr) {
                            throw new Error('Cannot parse object ID from JSON');
                          }
                        } else {
                          throw new Error('Empty object with no toString() method');
                        }
                      }
                    } else {
                      throw new Error('Empty object with no toString() method and no keys');
                    }
                  }
                } else {
                  safeId = String(rawId);
                }
                
                // Validate the ID
                if (!safeId || safeId === 'undefined' || safeId === 'null' || safeId === '[object Object]' || safeId.trim() === '') {
                  console.warn(`⚠️ AutoStoreAds: Item ${index} has invalid ID "${safeId}", using fallback`);
                  safeId = `autostore-${index}-${Date.now()}`;
                }
                
                return { ...item, _id: safeId, id: safeId };
              } catch (e: any) {
                console.error(`❌ AutoStoreAds: Error normalizing ID for item ${index}:`, e?.message || e);
                console.error(`❌ AutoStoreAds: Item data:`, {
                  title: item.title,
                  price: item.price,
                  _id: item._id,
                  _idType: typeof item._id
                });
                // Fallback: use index-based ID
                const fallbackId = `autostore-${index}-${Date.now()}`;
                return { ...item, _id: fallbackId, id: fallbackId };
              }
            });
            
            // Filter out deleted items and items with invalid/empty IDs
            // Note: Backend already filters by isDeleted, so we only need to check for invalid IDs
            const validAds = normalizedData.filter((item: any) => {
              // Only filter out explicitly deleted items (backend should already filter these, but double-check)
              if (item.isDeleted === true) {
                console.log(`🚫 AutoStoreAds: Skipping deleted item:`, item._id);
                return false;
              }
              
              // Check if _id is valid (not empty object)
              const rawId = item._id;
              if (!rawId) {
                console.log(`🚫 AutoStoreAds: Skipping item with no ID`);
                return false;
              }
              if (typeof rawId === 'object' && Object.keys(rawId).length === 0) {
                console.log(`🚫 AutoStoreAds: Skipping item with empty object ID`);
                return false;
              }
              
              return true;
            });
            
            console.log(`✅ AutoStoreAds: Filtered ${validAds.length} valid ads from ${normalizedData.length} total`);
            console.log(`📊 AutoStoreAds: Sample ads:`, validAds.slice(0, 3).map((ad, idx) => ({
              index: idx,
              id: ad._id,
              idType: typeof ad._id,
              title: ad.title,
              price: ad.price,
              hasImage: !!ad.image1,
              rawId: ad._id
            })));
            
            if (validAds.length > 0) {
              setAds(validAds);
              saveToCache(CACHE_KEYS.AUTO_STORE_ADS, normalizedData);

              // Preload first images
              validAds.slice(0, 5).forEach((ad) => {
                if (ad.image1) {
                  const imgUrl = buildImageUrl(ad.image1, API_URL);
                  if (imgUrl) Image.prefetch(imgUrl).catch(() => {});
                }
              });
            } else {
              console.warn(`⚠️ AutoStoreAds: No valid ads found after filtering`);
            }
          }
        }
      } catch (err: any) {
        console.error("❌ AutoStoreAds: Error fetching autoparts:", err?.message || err);
        console.error("❌ AutoStoreAds: Error details:", {
          name: err?.name,
          message: err?.message,
          stack: err?.stack?.substring(0, 200)
        });
      } finally {
        if (isMountedRef.current) {
          setLoading(false);
        }
      }
    };

    setTimeout(fetchFreshData, 100);

    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const renderItem = ({ item }: { item: AutoStoreDTO }) => {
    // IDs should already be normalized strings from the fetch function
    // But add safety check here too
    let safeId: string = item._id || item.id || '';
    
    // Double-check: if ID is still an object or invalid, skip this item
    if (!safeId || typeof safeId !== 'string' || safeId === '[object Object]' || safeId.trim() === '') {
      console.warn(`⚠️ AutoStoreAds: renderItem - Invalid ID, skipping item:`, safeId);
      return null;
    }
    
    const images = buildImageUrls([
      item.image1, item.image2, item.image3, item.image4,
      item.image5, item.image6, item.image7, item.image8,
    ], API_URL);

    const locationText = item.location || item.adCity || item.city || item.registrationCity || "Location not specified";
    const transmissionText = item.compatibility || item.partCategory || "";

    return (
      <AutoStoreCard
        _id={safeId}
        discount={10}
        model={item.title}
        price={item.price.toLocaleString()}
        image={buildImageUrl(item.image1, API_URL)}
        images={images}
        location={locationText}
        transmission={transmissionText}
      />
    );
  };

  if (loading && ads.length === 0) {
    return (
      <FlatList
        data={[1, 2, 3, 4]}
        horizontal
        keyExtractor={(item, index) => `skeleton-store-${index}`}
        renderItem={() => <AdCardSkeleton />}
        contentContainerStyle={styles.container}
        showsHorizontalScrollIndicator={false}
      />
    );
  }

  if (ads.length === 0 && !loading) {
    console.log("⚠️ AutoStoreAds: No ads to display");
    return null;
  }
  
  console.log(`🎯 AutoStoreAds: Rendering ${ads.length} ads`);

  return (
    <FlatList
      data={ads}
      horizontal
      keyExtractor={(item, index) => {
        try {
          if (item._id) {
            if (typeof item._id === 'string' && item._id !== '[object Object]') return `autostore-${item._id}-${index}`;
            if (typeof item._id === 'number') return `autostore-${item._id}-${index}`;
            if (typeof item._id === 'object') {
              if (item._id.toString && typeof item._id.toString === 'function') {
                const str = String(item._id.toString());
                if (str !== '[object Object]') return `autostore-${str}-${index}`;
                if (item._id._id) return `autostore-${String(item._id._id)}-${index}`;
                if (item._id.$oid) return `autostore-${String(item._id.$oid)}-${index}`;
              }
              if (item._id.$oid) return `autostore-${String(item._id.$oid)}-${index}`;
            }
          }
          return `autostore-${index}`;
        } catch (error) {
          return `autostore-${index}`;
        }
      }}
      renderItem={renderItem}
      contentContainerStyle={styles.container}
      showsHorizontalScrollIndicator={false}
      initialNumToRender={4}
      maxToRenderPerBatch={4}
      windowSize={5}
    />
  );
};

export default AutoStoreAds;

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 12,
  },
});
