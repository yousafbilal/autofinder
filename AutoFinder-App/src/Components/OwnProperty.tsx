import { FlatList, StyleSheet, View, Text, TouchableOpacity, Image } from "react-native";
import React, { useEffect, useState, useRef } from "react";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../../navigationTypes";
import { API_URL } from "../../config";
import AdCard from "./AdCard";
import NewBikeAdCard from "./NewBikeAdCard";
import AdCardSkeleton from "./Commons/AdCardSkeleton";
import { safeGetAllImagesWithApiUrl } from "../utils/safeImageUtils";
import { getCurrentUserId } from "../services/chat";

type NavigationProps = StackNavigationProp<RootStackParamList>;

interface IAdDTO {
  _id: string;
  userId: string | { _id: string; name: string; profileImage?: string };
  isDeleted: boolean;
  isFeatured?: string;
  isActive: boolean;
  location: string;
  make?: string;
  model?: string;
  variant?: string;
  year?: number;
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
  dateAdded?: string;
  isManaged?: boolean;
  favoritedBy?: string[];
  adType?: string;
  status?: string;
  title?: string;
  mileage?: number;
  km?: number;
  kilometer?: number;
  engineType?: string;
  enginetype?: string;
  adCity?: string;
  createdAt?: string;
}

const OwnProperty = () => {
  const navigation = useNavigation<NavigationProps>();
  const [ads, setAds] = useState<IAdDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const isMountedRef = useRef(true);
  const hasFetchedRef = useRef(false);

  useEffect(() => {
    isMountedRef.current = true;

    const fetchOwnPropertyAds = async () => {
      if (hasFetchedRef.current) return;
      hasFetchedRef.current = true;

      try {
        const userId = await getCurrentUserId();
        if (!userId) {
          if (isMountedRef.current) {
            setAds([]);
            setLoading(false);
          }
          return;
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);

        const response = await fetch(`${API_URL}/all_user_ads/${userId}`, {
          signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (response.ok && isMountedRef.current) {
          const data = await response.json();
          if (Array.isArray(data)) {
            // Filter only active ads
            const activeAds = data.filter(
              (ad: IAdDTO) => ad.isActive && ad.status !== 'pending' && !ad.isDeleted
            );
            // Limit to 10 most recent ads
            const recentAds = activeAds
              .sort((a, b) => {
                const dateA = new Date(a.dateAdded || a.createdAt || 0).getTime();
                const dateB = new Date(b.dateAdded || b.createdAt || 0).getTime();
                return dateB - dateA;
              })
              .slice(0, 10);
            
            setAds(recentAds);

            // Preload first images
            recentAds.slice(0, 5).forEach((ad: IAdDTO) => {
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

    fetchOwnPropertyAds();

    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const renderItem = ({ item }: { item: IAdDTO }) => {
    const images = safeGetAllImagesWithApiUrl(item, API_URL);

    let sellerId = '';
    if (typeof item.userId === 'string') {
      sellerId = item.userId;
    } else if (item.userId && typeof item.userId === 'object') {
      sellerId = item.userId._id;
    }

    // Determine ad type and category
    const adType = item.adType || 'car';
    const isBike = adType === 'bike' || adType === 'newBike';
    
    // For bikes, use NewBikeAdCard
    if (isBike) {
      return (
        <NewBikeAdCard
          image={images[0]}
          images={images}
          model={`${item.make || ''} ${item.model || ''} ${item.year || ''}`.trim()}
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
    }

    // For other ad types, use AdCard
    let category = 'car';
    if (adType === 'newCar') {
      category = 'newCar';
    } else if (adType === 'rentcar') {
      category = 'rentcar';
    } else if (adType === 'autoparts') {
      category = 'autoparts';
    }

    return (
      <AdCard
        image={images[0]}
        favoritedBy={item.favoritedBy}
        images={images}
        model={item.title || `${item.make || ''} ${item.model || ''} ${item.year || ''}`.trim()}
        price={item.price}
        city={item.location}
        registrationCity={item.registrationCity}
        year={item.year?.toString() || ''}
        traveled={(item.kmDriven || item.mileage || item.km || item.kilometer)?.toString() || ""}
        kmDriven={item.kmDriven}
        mileage={item.mileage}
        itemData={item}
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
        _id={item._id}
        cart={false}
        userId={sellerId}
        sellerId={sellerId}
        postedBy={sellerId}
        category={category}
        adType={adType}
      />
    );
  };

  if (loading && ads.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.heading}>Own Property</Text>
        </View>
        <FlatList
          data={[1, 2, 3, 4]}
          horizontal
          keyExtractor={(item) => item.toString()}
          renderItem={() => <AdCardSkeleton />}
          contentContainerStyle={styles.listContainer}
          showsHorizontalScrollIndicator={false}
        />
      </View>
    );
  }

  if (ads.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      {/* Header with Own Property title */}
      <View style={styles.header}>
        <Text style={styles.heading}>Own Property</Text>
      </View>
      
      {/* Own Property Cards */}
      <FlatList
        data={ads}
        horizontal
        keyExtractor={(item, index) => {
          try {
            if (item._id) {
              if (typeof item._id === 'string') return item._id;
              if (typeof item._id === 'number') return `_id-${item._id}`;
              if (typeof item._id === 'object') {
                if (item._id.toString) return String(item._id.toString());
                if (item._id.$oid) return String(item._id.$oid);
              }
            }
            return `own-property-${index}`;
          } catch (error) {
            return `own-property-${index}-${Date.now()}`;
          }
        }}
        renderItem={renderItem}
        contentContainerStyle={styles.listContainer}
        showsHorizontalScrollIndicator={false}
        initialNumToRender={4}
        maxToRenderPerBatch={4}
        windowSize={5}
      />
    </View>
  );
};

export default OwnProperty;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "baseline",
    flexDirection: "row",
    marginHorizontal: 12,
    marginVertical: 24,
  },
  heading: {
    fontWeight: "600",
    fontSize: 18,
  },
  listContainer: {
    paddingHorizontal: 12,
  },
});

