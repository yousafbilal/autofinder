import React, { useRef, useEffect, useMemo, useCallback } from "react";
import { FlatList, StyleSheet, Text, View, Platform } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeScrollEvent, NativeSyntheticEvent } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

// your components...
import Search from "../Components/Search";
import FilterCategory from "../Components/FilterCategory";
import Offerings from "../Components/Offerings";
import HeadingSpaceBetween from "../Components/HeadingSpaceBetween";
import CertifiedAds from "../Components/CertifiedAds";
import PakWheelsAds from "../Components/PakWheelsAds";
import FeaturedAds from "../Components/FeaturedAds";
import AutoStoreAds from "../Components/AutoStoreAds";
import LatestVideos from "../Components/LatestVideos";
import LatestNews from "../Components/LatestNews";
import FuelPrices from "../Components/FuelPrices";
import BrowseMore from "../Components/BrowseMore";
import HeadingSpaceBetweenVideo from "../Components/HeadingSpaceBetweenVideo";
import HeadingSpaceBetween1 from "../Components/HeadingSpaceBetween1";
import HeadingSpaceBetween2 from "../Components/HeadingSpaceBetween2";
import HeadingSpaceBetween3 from "../Components/HeadingSpaceBetween3";
import HeadingSpaceBetween4 from "../Components/HeadingSpaceBetween4";
import HeadingSpaceBetween5 from "../Components/HeadingSpaceBetween5";
import Header1 from "../Components/Header1";
import CarComparisonSection from "../Components/CarComparisonSection";
import CertifiedBikeAds from "../Components/CertifiedBikeAds";
import CartDesign from "../Components/CartDesign";
import PremiumCars from "../Components/PremiumCars";
import ManagedByAutofinder from "../Components/ManagedByAutofinder";
import CategoryIcons from "../Components/CategoryIcons";
import AdvertisingBanner from "../Components/AdvertisingBanner";

export default function Home() {
  const flatListRef = useRef<FlatList>(null);
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    const unsubscribe = navigation.addListener("tabPress", (e: any) => {
      flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
    });

    return unsubscribe;
  }, [navigation]);

  // Memoize home sections to prevent re-creation
  const homeSections = useMemo(() => [
    { id: 'cartdesign', type: 'cartdesign' },
    { id: 'categoryicons', type: 'categoryicons' },
    { id: 'services', type: 'services' },
    { id: 'offerings', type: 'offerings' },
    { id: 'title', type: 'title' },
    { id: 'filter', type: 'filter' },
    { id: 'managed', type: 'managed' },
    { id: 'featured', type: 'featured' },
    { id: 'newcars', type: 'newcars' },
    { id: 'certified', type: 'certified' },
    { id: 'certifiedbikes', type: 'certifiedbikes' },
    { id: 'bikes', type: 'bikes' },
    { id: 'autostore', type: 'autostore' },
    { id: 'autostoreads', type: 'autostoreads' },
    { id: 'comparison', type: 'comparison' },
    { id: 'videos', type: 'videos' },
    { id: 'latestvideos', type: 'latestvideos' },
    { id: 'news', type: 'news' },
    { id: 'fuel', type: 'fuel' },
    { id: 'browse', type: 'browse' },
  ], []);

  // Memoize renderItem to prevent re-creation
  const renderItem = useCallback(({ item }: { item: any }) => {
    switch (item.type) {
      case 'cartdesign':
        return <CartDesign />;
      case 'categoryicons':
        return <CategoryIcons />;
      case 'title':
        return <Text style={styles.title}>Browse Used Cars</Text>;
      case 'filter':
        return <FilterCategory />;
      case 'services':
        return <HeadingSpaceBetween4 heading="Autofinder Services" />;
      case 'offerings':
        return <Offerings />;
      case 'managed':
        return <ManagedByAutofinder />;
      case 'featured':
        return <PremiumCars />;
      case 'newcars':
        return <HeadingSpaceBetween2 heading="Popular New Cars" />;
      case 'certified':
        return <CertifiedAds />;
      case 'bikes':
        return <CertifiedBikeAds />;
      case 'certifiedbikes':
        return <HeadingSpaceBetween5 heading="Premium Bikes" />;
      case 'autostore':
        return <HeadingSpaceBetween3 heading="Autofinder Autostore" />;
      case 'autostoreads':
        return <AutoStoreAds />;
      case 'comparison':
        return <CarComparisonSection />;
      case 'videos':
        return <HeadingSpaceBetweenVideo heading="Latest Video" label="View All" />;
      case 'latestvideos':
        return <LatestVideos />;
      case 'news':
        return <LatestNews />;
      case 'fuel':
        return <FuelPrices />;
      case 'browse':
        return <BrowseMore />;
      default:
        return null;
    }
  }, []);

  // Memoize keyExtractor - ensure it always returns a string
  const keyExtractor = useCallback((item: any, index: number) => {
    try {
      let idStr: string | null = null;
      if (item.id) {
        if (typeof item.id === 'string' && item.id !== '[object Object]') idStr = item.id;
        else if (typeof item.id === 'number') idStr = `id-${item.id}`;
        else if (typeof item.id === 'object') {
          if (item.id.toString && typeof item.id.toString === 'function') {
            const str = String(item.id.toString());
            if (str !== '[object Object]') idStr = str;
            else if (item.id._id) idStr = String(item.id._id);
            else if (item.id.$oid) idStr = String(item.id.$oid);
          } else if (item.id.$oid) idStr = String(item.id.$oid);
        }
      }
      // Always include index so keys are unique even if id repeats
      const type = item.type || 'item';
      const typeStr = typeof type === 'string' ? type : 'item';
      return idStr ? `${idStr}-${index}` : `${typeStr}-${index}`;
    } catch (error) {
      return `item-${index}`;
    }
  }, []);

  // Memoize content container style
  const contentContainerStyle = useMemo(() => [
    styles.contentContainer, 
    { paddingBottom: Math.max(insets.bottom, 20) }
  ], [insets.bottom]);

  return (
    <View style={styles.container} collapsable={false}>
      <SafeAreaView style={styles.safeArea} edges={['top']} collapsable={false}>
        <Header1 />
        <Search />
      </SafeAreaView>
      <FlatList
        ref={flatListRef}
        data={homeSections}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        style={styles.flex}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={contentContainerStyle}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="none"
        removeClippedSubviews={false}
        maxToRenderPerBatch={10}
        windowSize={10}
      />
      <AdvertisingBanner />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  safeArea: {
    paddingHorizontal: 12,
    backgroundColor: "#ffffff",
  },
  flex: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  contentContainer: {
    paddingBottom: 20,
    backgroundColor: "#ffffff",
  },
  title: {
    fontWeight: "600",
    fontSize: 18,
    paddingHorizontal: 12,
    marginTop: 16,
    marginBottom: 8,
  },
});
