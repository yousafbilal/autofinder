import React, { useEffect, useState, useRef } from "react";
import { FlatList, StyleSheet, View, Text, Image } from "react-native";
import AdCard from "./AdCard";
import { API_URL } from "../../config";
import AdCardSkeleton from "./Commons/AdCardSkeleton";
import { buildImageUrls } from "../utils/safeImageUtils";
import { CACHE_KEYS, getFromCache, saveToCache } from "../services/cacheService";
import { safeApiCall } from "../utils/apiUtils";

export interface IAdDTO {
  _id: string;
  userId: string;
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
  fuelType?: string;
  engineCapacity?: string;
  description?: string;
  transmission?: string;
  assembly?: string;
  features?: string[];
  image1: string;
  image2: string;
  image3: string;
  image4: string;
  image5: string;
  image6: string;
  image7: string;
  image8: string;
  dateAdded?: string;
  isManaged?: boolean;
  favoritedBy?: string[];
}

const PakWheelsAds = () => {
  const [ads, setAds] = useState<IAdDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const isMountedRef = useRef(true);
  const hasFetchedRef = useRef(false);

  useEffect(() => {
    isMountedRef.current = true;
    console.log("🚀 PakWheelsAds mounted - API_URL:", API_URL);
    
    // STEP 1: Load from cache IMMEDIATELY
    const loadCacheFirst = async () => {
      try {
        console.log("📦 Checking cache...");
        const cachedData = await getFromCache<IAdDTO[]>(CACHE_KEYS.MANAGED_ADS);
        if (cachedData && Array.isArray(cachedData) && cachedData.length > 0 && isMountedRef.current) {
          const activeAds = cachedData.filter((ad: any) => ad.isActive === true);
          console.log(`✅ Cache hit: ${activeAds.length} active ads`);
          if (activeAds.length > 0) {
            setAds(activeAds);
            setLoading(false);
          }
        } else {
          console.log("📦 No cache found");
        }
      } catch (e) {
        console.log("⚠️ Cache error:", e);
      }
    };
    
    loadCacheFirst();
    
    // STEP 2: Fetch fresh data
    const fetchFreshData = async () => {
      if (hasFetchedRef.current) return;
      hasFetchedRef.current = true;
      
      try {
        console.log(`🔄 Fetching ${API_URL}/list_it_for_you_ad/public...`);
        console.log(`🔗 Full URL: ${API_URL}/list_it_for_you_ad/public`);
        
        // Use safeApiCall for automatic retry and better error handling
        console.log("📡 Sending request to list_it_for_you_ad/public...");
        const result = await safeApiCall<any[]>(`${API_URL}/list_it_for_you_ad/public`, {
          headers: { 
            'Accept': 'application/json',
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        }, 1); // 1 retry
        
        if (!result.success || !result.data) {
          console.error("❌ Failed to fetch ads:", result.error);
          throw new Error(result.error || 'Failed to fetch ads');
        }
        
        const data = result.data; // safeApiCall already parsed JSON and returned data
        console.log(`📦 Data received: ${Array.isArray(data) ? data.length : 'not array'} items`);
        console.log(`📦 Data type:`, typeof data);
        console.log(`📦 First item:`, data?.[0]);
        
        if (Array.isArray(data) && isMountedRef.current) {
          const activeAds = data.filter((ad: any) => ad.isActive === true);
          console.log(`✅ Active ads: ${activeAds.length} out of ${data.length} total`);
          
          if (activeAds.length > 0) {
            setAds(activeAds);
            saveToCache(CACHE_KEYS.MANAGED_ADS, data);
            console.log(`✅ Ads set in state: ${activeAds.length}`);
            
            // Preload first 5 images
            activeAds.slice(0, 5).forEach(ad => {
              const images = buildImageUrls([
                ad.image1, ad.image2, ad.image3, ad.image4,
                ad.image5, ad.image6, ad.image7, ad.image8,
              ], API_URL);
              if (images[0]) {
                console.log(`🖼️ Preloading: ${images[0]}`);
                Image.prefetch(images[0]).catch(() => {});
              }
            });
          } else {
            console.warn(`⚠️ No active ads found in ${data.length} total ads`);
          }
        } else {
          console.error(`❌ Data is not an array or component unmounted:`, Array.isArray(data), isMountedRef.current);
        }
      } catch (err: any) {
        console.error("❌ Fetch error:", err?.message || err);
        console.error("❌ Error name:", err?.name);
        console.error("❌ Full error:", err);
        
        // Check if it's a network error
        if (err?.message?.includes('Network request failed') || 
            err?.message?.includes('Failed to fetch')) {
          console.error("❌❌❌ NETWORK ERROR - Backend not reachable ❌❌❌");
          console.error("⚠️ Cannot connect to:", API_URL);
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

  const getItemKey = (item: IAdDTO, index: number): string => {
    // Ensure we always return a string key, never an object
    try {
      if (item._id) {
        if (typeof item._id === 'string') return item._id;
        if (typeof item._id === 'number') return `_id-${item._id}`;
        if (typeof item._id === 'object') {
          if (item._id.toString) return String(item._id.toString());
          if (item._id.$oid) return String(item._id.$oid);
        }
      }
      // Fallback
      return `ad-${item.make}-${item.model}-${item.year}-${index}`;
    } catch (error) {
      return `ad-${index}-${Date.now()}`;
    }
  };

  const renderItem = ({ item, index }: { item: IAdDTO; index: number }) => {
    const images = buildImageUrls([
      item.image1, item.image2, item.image3, item.image4,
      item.image5, item.image6, item.image7, item.image8,
    ], API_URL);

    return (
      <AdCard
        _id={item._id}
        certified
        image={images[0]}
        images={images}
        model={`${item.make} ${item.model} ${item.year}`}
        price={item.price}
        city={item.location}
        registrationCity={item.registrationCity}
        year={item.year}
        traveled={(item.kmDriven || item.mileage || item.km || item.kilometer)?.toString() || "0"}
        kmDriven={item.kmDriven}
        mileage={item.mileage}
        itemData={item}
        type={item.fuelType}
        features={item.features}
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
        favoritedBy={item.favoritedBy}
      />
    );
  };

  // Debug: Log current state
  console.log(`🔍 PakWheelsAds render: loading=${loading}, ads=${ads.length}`);

  // Show skeleton only if loading AND no cached data
  if (loading && ads.length === 0) {
    console.log("📊 Showing skeleton...");
    return (
      <FlatList
        data={[1, 2, 3, 4]}
        horizontal
        keyExtractor={(item) => item.toString()}
        renderItem={() => <AdCardSkeleton />}
        contentContainerStyle={styles.container}
        showsHorizontalScrollIndicator={false}
      />
    );
  }

  // Show message if no ads after loading
  if (!loading && ads.length === 0) {
    console.log("⚠️ No ads to show");
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No properties available</Text>
      </View>
    );
  }

  return (
      <FlatList
        data={ads}
        horizontal
        keyExtractor={(item, index) => getItemKey(item, index)}
        renderItem={renderItem}
      contentContainerStyle={styles.container}
      showsHorizontalScrollIndicator={false}
      initialNumToRender={4}
      maxToRenderPerBatch={4}
      windowSize={5}
    />
  );
};

export default PakWheelsAds;

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 12,
  },
  emptyContainer: {
    paddingHorizontal: 12,
    paddingVertical: 20,
    alignItems: 'center',
  },
  emptyText: {
    color: '#666',
    fontSize: 14,
  },
});
