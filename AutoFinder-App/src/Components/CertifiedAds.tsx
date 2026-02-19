import { FlatList, StyleSheet, View, Image } from "react-native";
import React, { useEffect, useState, useRef } from "react";
import { API_URL } from "../../config";
import NewCarAdCard from "./NewCarAdCard";
import AdCardSkeleton from "./Commons/AdCardSkeleton";
import { buildImageUrls } from "../utils/safeImageUtils";
import { CACHE_KEYS, getFromCache, saveToCache } from "../services/cacheService";

interface IAdDTO {
  _id: string;
  make: string;
  model: string;
  year: number;
  price: number;
  fuelType: string;
  image1: string;
  image2: string;
  image3: string;
  image4: string;
  image5: string;
  image6: string;
  image7: string;
  image8: string;
  status: string;
  registrationCity?: string;
  kmDriven?: number;
  bodyType: string;
  engineType: string;
  location?: string;
  transmission?: string;
  engineCapacity?: string;
  description?: string;
  bodyColor?: string;
  assembly?: string;
  dateAdded?: string;
  features?: string[];
  favoritedBy?: string[];
}

const CertifiedAds = () => {
  const [ads, setAds] = useState<IAdDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const isMountedRef = useRef(true);
  const hasFetchedRef = useRef(false);

  useEffect(() => {
    isMountedRef.current = true;

    // STEP 1: Load from cache IMMEDIATELY
    const loadCacheFirst = async () => {
      try {
        const cachedData = await getFromCache<IAdDTO[]>(CACHE_KEYS.CERTIFIED_ADS);
        if (cachedData && Array.isArray(cachedData) && isMountedRef.current) {
          const activeAds = cachedData.filter((item) => item.status === "active");
          if (activeAds.length > 0) {
            setAds(activeAds);
            setLoading(false);
            
            // Preload first images
            activeAds.slice(0, 5).forEach((ad) => {
              const images = buildImageUrls([
                ad.image1, ad.image2, ad.image3, ad.image4,
                ad.image5, ad.image6, ad.image7, ad.image8,
              ], API_URL);
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

        const response = await fetch(`${API_URL}/new_cars/public`, {
          signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (response.ok && isMountedRef.current) {
          const data = await response.json();
          if (Array.isArray(data)) {
            const activeAds = data.filter((item) => item.status === "active");
            setAds(activeAds);
            saveToCache(CACHE_KEYS.CERTIFIED_ADS, data);

            // Preload first images
            activeAds.slice(0, 5).forEach((ad) => {
              const images = buildImageUrls([
                ad.image1, ad.image2, ad.image3, ad.image4,
                ad.image5, ad.image6, ad.image7, ad.image8,
              ], API_URL);
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
    const images = buildImageUrls([
      item.image1, item.image2, item.image3, item.image4,
      item.image5, item.image6, item.image7, item.image8,
    ], API_URL);

    return (
      <NewCarAdCard
        certified
        image={images[0]}
        images={images}
        model={`${item.make} ${item.model} ${item.year}`}
        price={item.price}
        city={item.location}
        registrationCity={item.registrationCity}
        year={item.year}
        traveled={item.kmDriven?.toString() || item.mileage?.toString() || item.km?.toString() || ""}
        kmDriven={item.kmDriven}
        mileage={item.mileage}
        itemData={item}
        engineType={item.engineType}
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
        favoritedBy={item.favoritedBy}
      />
    );
  };

  if (loading && ads.length === 0) {
    return (
      <FlatList
        data={[1, 2, 3, 4]}
        horizontal
        keyExtractor={(item, index) => `skeleton-cert-${index}`}
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
            if (typeof item._id === 'string' && item._id !== '[object Object]') return `certified-${item._id}-${index}`;
            if (typeof item._id === 'number') return `certified-${item._id}-${index}`;
            if (typeof item._id === 'object') {
              if (item._id.toString && typeof item._id.toString === 'function') {
                const str = String(item._id.toString());
                if (str !== '[object Object]') return `certified-${str}-${index}`;
                if (item._id._id) return `certified-${String(item._id._id)}-${index}`;
                if (item._id.$oid) return `certified-${String(item._id.$oid)}-${index}`;
              }
              if (item._id.$oid) return `certified-${String(item._id.$oid)}-${index}`;
            }
          }
          return `certified-${index}`;
        } catch (error) {
          return `certified-${index}`;
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

export default CertifiedAds;

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 12,
  },
});
