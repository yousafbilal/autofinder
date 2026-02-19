import { FlatList, StyleSheet, View, Image } from "react-native";
import React, { useEffect, useState, useRef } from "react";
import { API_URL } from "../../config";
import NewBikeAdCard from "./NewBikeAdCard";
import AdCardSkeleton from "./Commons/AdCardSkeleton";
import { safeGetAllImagesWithApiUrl } from "../utils/safeImageUtils";
import { CACHE_KEYS, getFromCache, saveToCache } from "../services/cacheService";

interface IAdDTO {
  _id: string;
  make: string;
  model: string;
  year: number;
  price: number;
  fuelType: string;
  image1: string;
  status: string;
  registrationCity?: string;
  kmDriven?: number;
  bodyType: string;
  engineType: string;
  image2: string;
  image3: string;
  image4: string;
  image5: string;
  image6: string;
  image7: string;
  image8: string;
  isFeatured?: string;
  packageId?: string;
  packageName?: string;
  packagePrice?: number;
  featuredExpiryDate?: string;
  paymentStatus?: string;
  adminNotes?: string;
  statusUpdatedAt?: string;
  title?: string;
  description?: string;
  features?: string[];
  preferredContact?: string;
  favoritedBy?: string[];
  views?: number;
  dateAdded?: string;
  location?: string;
  adCity?: string;
  variant?: string;
  bodyColor?: string;
  engineCapacity?: string;
  enginetype?: string;
}

const CertifiedBikeAds = () => {
  const [ads, setAds] = useState<IAdDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const isMountedRef = useRef(true);
  const hasFetchedRef = useRef(false);

  useEffect(() => {
    isMountedRef.current = true;

    // STEP 1: Load from cache IMMEDIATELY
    const loadCacheFirst = async () => {
      try {
        const cachedData = await getFromCache<IAdDTO[]>(CACHE_KEYS.CERTIFIED_BIKES);
        if (cachedData && Array.isArray(cachedData) && isMountedRef.current) {
          // ONLY show bikes that admin has APPROVED
          const approvedAds = cachedData.filter((ad) => 
            ad.isFeatured === "Approved"
          );
          if (approvedAds.length > 0) {
            setAds(approvedAds);
            setLoading(false);
            
            // Preload first images
            approvedAds.slice(0, 5).forEach((ad) => {
              const images = safeGetAllImagesWithApiUrl(ad, API_URL);
              if (images[0]) {
                Image.prefetch(images[0]).catch(() => {});
              }
            });
          }
        }
      } catch (e) {
        // Ignore
      }
    };

    loadCacheFirst();

    // STEP 2: Fetch fresh data in background
    const fetchFreshData = async () => {
      if (hasFetchedRef.current) return;
      hasFetchedRef.current = true;

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);

        const response = await fetch(`${API_URL}/premium-bike-ads?limit=10`, {
          signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (response.ok && isMountedRef.current) {
          const data = await response.json();
          if (Array.isArray(data)) {
            // ONLY show bikes that admin has APPROVED
            const approvedAds = data.filter((ad) => 
              ad.isFeatured === "Approved"
            );
            setAds(approvedAds);
            saveToCache(CACHE_KEYS.CERTIFIED_BIKES, approvedAds);

            // Preload first images
            approvedAds.slice(0, 5).forEach((ad) => {
              const images = safeGetAllImagesWithApiUrl(ad, API_URL);
              if (images[0]) {
                Image.prefetch(images[0]).catch(() => {});
              }
            });
          }
        }
      } catch (err) {
        // Silent fail
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
    // Debug: Log image URLs
    console.log(`🖼️ Premium Bike ${item._id} - Images:`, images.length > 0 ? images[0] : 'No images', 'Total:', images.length);
    
    // All bikes in Premium Bikes section should show Premium tag
    // since they come from /premium-bike-ads endpoint

    return (
      <NewBikeAdCard
        featured
        premium={true}
        image={images[0]}
        images={images}
        model={`${item.make} ${item.model} ${item.year}`}
        price={item.price}
        city={item.location || item.adCity || ""}
        registrationCity={item.registrationCity}
        year={item.year}
        engineType={item.engineType || item.enginetype || ""}
        type={item.fuelType}
        features={item.features}
        fuelType={item.fuelType}
        engineCapacity={item.engineCapacity}
        description={item.description}
        bodyType={item.bodyType}
        bodyColor={item.bodyColor}
        location={item.location}
        dateAdded={item.dateAdded}
        favoritedBy={item.favoritedBy}
        _id={item._id}
        itemData={item}
      />
    );
  };

  if (loading && ads.length === 0) {
    return (
      <FlatList
        data={[1, 2, 3, 4]}
        horizontal
        keyExtractor={(item, index) => `skeleton-bike-${index}`}
        renderItem={() => <AdCardSkeleton />}
        contentContainerStyle={styles.container}
        showsHorizontalScrollIndicator={false}
      />
    );
  }

  if (ads.length === 0) {
    return null;
  }

  return (
    <FlatList
      data={ads}
      horizontal
      keyExtractor={(item, index) => {
        try {
          if (item._id) {
            if (typeof item._id === 'string' && item._id !== '[object Object]') return `certified-bike-${item._id}-${index}`;
            if (typeof item._id === 'number') return `certified-bike-${item._id}-${index}`;
            if (typeof item._id === 'object') {
              if (item._id.toString && typeof item._id.toString === 'function') {
                const str = String(item._id.toString());
                if (str !== '[object Object]') return `certified-bike-${str}-${index}`;
                if (item._id._id) return `certified-bike-${String(item._id._id)}-${index}`;
                if (item._id.$oid) return `certified-bike-${String(item._id.$oid)}-${index}`;
              }
              if (item._id.$oid) return `certified-bike-${String(item._id.$oid)}-${index}`;
            }
          }
          return `certified-bike-${index}`;
        } catch (error) {
          return `certified-bike-${index}-${Date.now()}`;
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

export default CertifiedBikeAds;

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 12,
  },
});
