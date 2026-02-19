import { FlatList, StyleSheet, View, Image } from "react-native";
import React, { useEffect, useState, useRef } from "react";
import AdCard from "./AdCard";
import { API_URL } from "../../config";
import { safeApiCall } from "../utils/apiUtils";
import AdCardSkeleton from "./Commons/AdCardSkeleton";
import { safeGetAllImagesWithApiUrl } from "../utils/safeImageUtils";
import { CACHE_KEYS, getFromCache, saveToCache, clearCache } from "../services/cacheService";

export interface IAdDTO {
  _id: string;
  userId: string | { _id: string; name: string; profileImage?: string };
  isDeleted: boolean;
  isFeatured: string;
  isActive: boolean;
  location: string;
  make: string;
  model: string;
  variant?: string;
  year: number;
  registrationCity?: string;
  bodyType?: string;
  price: number;
  bodyColor?: string;
  kmDriven?: number;
  fuelType?: string
  engineCapacity?: string;
  description?: string;
  transmission?: string;
  assembly?: string;
  features?: string[];
  image1?: string;
  image2?: string;
  image3?: string;
  image4?: string;
  image5?: string;
  image6?: string;
  image7?: string;
  image8?: string;
  image9?: string;
  image10?: string;
  image11?: string;
  image12?: string;
  image13?: string;
  image14?: string;
  image15?: string;
  image16?: string;
  image17?: string;
  image18?: string;
  image19?: string;
  image20?: string;
  dateAdded?: string;
  isManaged?: boolean;
  favoritedBy?: string[];
}

const FeaturedAds = () => {
  const [ads, setAds] = useState<IAdDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const isMountedRef = useRef(true);
  const hasFetchedRef = useRef(false);

  useEffect(() => {
    isMountedRef.current = true;

    // Clear cache to force fresh data load
    clearCache(CACHE_KEYS.FEATURED_ADS).catch(() => {});

    // STEP 1: Load from cache IMMEDIATELY (will be empty after clear, so fresh fetch happens)
    const loadCacheFirst = async () => {
      try {
          const cachedData = await getFromCache<IAdDTO[]>(CACHE_KEYS.FEATURED_ADS);
        if (cachedData && Array.isArray(cachedData) && isMountedRef.current) {
          const now = new Date();
          // Cache already has filtered data, just check expiry
          const filtered = cachedData.filter((ad: IAdDTO) => {
            // Check expiry dates only (backend already filtered for active/approved)
            const expiryDate = (ad as any).featuredExpiryDate;
            if (expiryDate) {
              const expiry = new Date(expiryDate);
              if (!isNaN(expiry.getTime()) && expiry < now) {
                return false; // Expired
              }
            }
            
            // Check validityDays expiry
            if ((ad as any).validityDays && (ad as any).approvedAt) {
              try {
                const approvedDate = new Date((ad as any).approvedAt);
                if (!isNaN(approvedDate.getTime())) {
                  const expiryDate = new Date(approvedDate);
                  expiryDate.setDate(expiryDate.getDate() + (ad as any).validityDays);
                  if (expiryDate < now) {
                    return false; // Package expired
                  }
                }
              } catch (e) {
                // Keep ad if date parsing fails
              }
            }
            
            return true;
          });
          
          console.log(`💾 FeaturedAds: Loaded ${filtered.length} premium cars from cache`);
          if (filtered.length > 0) {
            setAds(filtered);
            setLoading(false);
            
            // Preload first images
            filtered.slice(0, 5).forEach((ad: IAdDTO) => {
              const images = safeGetAllImagesWithApiUrl(ad, API_URL);
              if (images[0]) {
                Image.prefetch(images[0]).catch(() => {});
              }
            });
          } else {
            // Cache is empty or expired, keep loading state true to show skeleton
            console.log(`⚠️ FeaturedAds: Cache empty or expired, will fetch fresh data`);
            setLoading(true);
          }
        } else {
          // No cache data, keep loading state
          console.log(`⚠️ FeaturedAds: No cache data found`);
          setLoading(true);
        }
      } catch (e) {
        console.error(`❌ FeaturedAds: Error loading cache:`, e);
        setLoading(true); // Keep loading state if cache fails
      }
    };

    loadCacheFirst();

    // STEP 2: Always fetch fresh data in background (even if cache exists)
    const fetchFreshData = async () => {
      if (hasFetchedRef.current) return;
      hasFetchedRef.current = true;

      try {
        // Use safeApiCall for automatic retry and better error handling
        console.log(`🔍 FeaturedAds: Fetching premium cars from ${API_URL}/featured_ads/public`);
        console.log(`🔍 FeaturedAds: API_URL = ${API_URL}`);
        
        const result = await safeApiCall<any[]>(`${API_URL}/featured_ads/public`, {
          headers: { 'Accept': 'application/json' }
        }, 2); // 2 retries for better reliability
        
        console.log(`📡 FeaturedAds: API Response - success: ${result.success}, hasData: ${!!result.data}, error: ${result.error || 'none'}`);
        
        if (result.success && result.data && isMountedRef.current) {
          const data = result.data;
          console.log(`📦 FeaturedAds: Received ${Array.isArray(data) ? data.length : 0} premium cars from API`);
          
          if (Array.isArray(data) && data.length > 0) {
            const now = new Date();
            // Backend already filters for active/approved/verified, but double-check expiry
            const filtered = data.filter((ad: IAdDTO) => {
              // Backend already filters for isActive: true, isFeatured: 'Approved', paymentStatus: verified
              // Just check expiry dates here
              
              // Check featuredExpiryDate
              const expiryDate = (ad as any).featuredExpiryDate;
              if (expiryDate) {
                const expiry = new Date(expiryDate);
                if (!isNaN(expiry.getTime()) && expiry < now) {
                  return false; // Expired
                }
              }
              
              // Check validityDays + approvedAt expiry
              if ((ad as any).validityDays && (ad as any).approvedAt) {
                try {
                  const approvedDate = new Date((ad as any).approvedAt);
                  if (!isNaN(approvedDate.getTime())) {
                    const expiryDate = new Date(approvedDate);
                    expiryDate.setDate(expiryDate.getDate() + (ad as any).validityDays);
                    if (expiryDate < now) {
                      return false; // Package expired
                    }
                  }
                } catch (e) {
                  // If date parsing fails, keep the ad
                }
              }
              
              return true;
            });
            
            console.log(`✅ FeaturedAds: Filtered to ${filtered.length} premium cars (after expiry check)`);
            if (filtered.length > 0) {
              console.log(`⭐ Sample premium car:`, {
                id: filtered[0]._id,
                make: filtered[0].make,
                model: filtered[0].model,
                isActive: filtered[0].isActive,
                isFeatured: filtered[0].isFeatured,
                paymentStatus: (filtered[0] as any).paymentStatus
              });
              
              setAds(filtered);
              saveToCache(CACHE_KEYS.FEATURED_ADS, filtered); // Cache filtered data

              // Preload first images
              filtered.slice(0, 5).forEach((ad: IAdDTO) => {
                const images = safeGetAllImagesWithApiUrl(ad, API_URL);
                if (images[0]) {
                  Image.prefetch(images[0]).catch(() => {});
                }
              });
            } else {
              console.log(`⚠️ FeaturedAds: All ${data.length} premium cars were filtered out (expired)`);
              setAds([]);
            }
          } else {
            console.log(`⚠️ FeaturedAds: No premium cars received from API (empty array or invalid data)`);
            setAds([]);
          }
        } else {
          console.error(`❌ FeaturedAds: API call failed - success: ${result.success}, error: ${result.error}`);
          setAds([]);
        }
      } catch (err) {
        console.error("❌ Error fetching featured ads:", err);
        if (isMountedRef.current) {
          setAds([]);
        }
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

  const renderItem = ({ item }: { item: IAdDTO }) => {
    const images = safeGetAllImagesWithApiUrl(item, API_URL);

    // Safely convert _id to string
    let safeId: string;
    try {
      if (typeof item._id === 'string') {
        safeId = item._id;
      } else if (typeof item._id === 'object' && item._id) {
        if (item._id.toString && typeof item._id.toString === 'function') {
          const str = String(item._id.toString());
          safeId = str !== '[object Object]' ? str : (item._id._id ? String(item._id._id) : String(item._id));
        } else {
          safeId = item._id._id ? String(item._id._id) : String(item._id);
        }
      } else {
        safeId = String(item._id);
      }
    } catch (e) {
      console.error('Error converting item._id to string:', e);
      safeId = String(item._id || '');
    }

    let sellerId = '';
    if (typeof item.userId === 'string') {
      sellerId = item.userId;
    } else if (item.userId && typeof item.userId === 'object') {
      sellerId = item.userId._id;
    }

    return (
      <AdCard
        featured
        image={images[0]}
        favoritedBy={item.favoritedBy}
        images={images}
        model={`${item.make} ${item.model} ${item.year}`}
        price={item.price}
        city={item.location}
        registrationCity={item.registrationCity}
        year={item.year}
        traveled={(item.kmDriven || item.mileage || item.km || item.kilometer)?.toString() || ""}
        kmDriven={item.kmDriven}
        mileage={item.mileage}
        itemData={{ ...item, _id: safeId }} // Ensure _id is string in itemData
        type={item.fuelType}
        fuelType={item.fuelType}
        transmission={item.transmission}
        engineCapacity={item.engineCapacity}
        description={item.description}
        bodyType={item.bodyType}
        bodyColor={item.bodyColor}
        location={item.location}
        assembly={item.assembly}
        dateAdded={item.dateAdded}
        isManaged={item.isManaged}
        features={item.features}
        _id={safeId} // Pass safe string ID
        cart={false}
        userId={sellerId}
        sellerId={sellerId}
        postedBy={sellerId}
        category="premium"
        adType="featured"
      />
    );
  };

  if (loading && ads.length === 0) {
    return (
      <FlatList
        data={[1, 2, 3, 4]}
        horizontal
        keyExtractor={(item, index) => `skeleton-featured-${index}`}
        renderItem={() => <AdCardSkeleton />}
        contentContainerStyle={styles.container}
        showsHorizontalScrollIndicator={false}
      />
    );
  }

  // Show empty state if no ads after loading (for debugging)
  if (!loading && ads.length === 0) {
    console.log("⚠️ FeaturedAds: No premium cars to display");
    console.log("⚠️ FeaturedAds: Loading state:", loading);
    console.log("⚠️ FeaturedAds: Ads array length:", ads.length);
    // Return null to hide empty section (PremiumCars header will still show)
    return null;
  }

  return (
    <FlatList
      data={ads}
      horizontal
      keyExtractor={(item, index) => {
        try {
          if (item._id) {
            if (typeof item._id === 'string' && item._id !== '[object Object]') return `featured-${item._id}-${index}`;
            if (typeof item._id === 'number') return `featured-${item._id}-${index}`;
            if (typeof item._id === 'object') {
              if (item._id.toString && typeof item._id.toString === 'function') {
                const str = String(item._id.toString());
                if (str !== '[object Object]') return `featured-${str}-${index}`;
                if (item._id._id) return `featured-${String(item._id._id)}-${index}`;
                if (item._id.$oid) return `featured-${String(item._id.$oid)}-${index}`;
              }
              if (item._id.$oid) return `featured-${String(item._id.$oid)}-${index}`;
            }
          }
          return `featured-${index}`;
        } catch (error) {
          return `featured-${index}-${Date.now()}`;
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

export default FeaturedAds;

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 12,
  },
});
