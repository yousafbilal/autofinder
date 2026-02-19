import React, { useEffect, useState, useMemo } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  RefreshControl,
} from "react-native";
import { FontAwesome, Ionicons, MaterialIcons } from "@expo/vector-icons";
import CarCard from "../../Components/CarCard";
import EnhancedUsedCarFilterModal from "../../Components/Models/EnhancedUsedCarFilterModal";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useFocusEffect } from "@react-navigation/native";
import { API_URL } from "../../../config";
import { COLORS } from "../../constants/colors";
import CarCardSkeleton from "../../Components/Commons/CarCardSkeleton";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { filterCarsSafely, isAdValidForPublicListing } from "../../utils/safeFiltering";
import { safeApiCall, safeIdToString } from "../../utils/apiUtils";
import CarInspectionCard from "../../Components/PromotionalCards/CarInspectionCard";
import ListItForMeCard from "../../Components/PromotionalCards/ListItForMeCard";
import PremiumAdServiceCard from "../../Components/PromotionalCards/PremiumAdServiceCard";
import CarOnRentCard from "../../Components/PromotionalCards/CarOnRentCard";

type CarListScreenProps = NativeStackScreenProps<any, "CarListScreen">;

interface FilterState {
  brands: string[];
  models: string[];
  variants: string[];
  years: { min: number; max: number };
  registrationCities: string[];
  locations: string[];
  bodyColors: string[];
  kmDriven: { min: number; max: number };
  price: { min: number; max: number };
  fuelTypes: string[];
  engineCapacity: { min: number; max: number };
  transmissions: string[];
  assemblies: string[];
  bodyTypes: string[];
  isCertified: boolean;
  isFeatured: boolean;
  isSaleItForMe: boolean;
  categories: string[];
}

const EnhancedUsedCarListScreen: React.FC<CarListScreenProps> = ({ navigation, route }) => {
  const [loading, setLoading] = useState(true);
  const [cars, setCars] = useState<any[]>([]);
  const [filteredCars, setFilteredCars] = useState<any[]>([]);
  const [showSortModal, setShowSortModal] = useState(false);
  const [sortBy, setSortBy] = useState("Relevance");
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [userData, setUserData] = useState<any>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState(route?.params?.searchQuery || "");

  // Filter state
  const [filters, setFilters] = useState<FilterState>({
    brands: [],
    models: [],
    variants: [],
    years: { min: 1970, max: new Date().getFullYear() },
    registrationCities: [],
    locations: [],
    bodyColors: [],
    kmDriven: { min: 0, max: 500000 },
    price: { min: 0, max: 50000000 },
    fuelTypes: [],
    engineCapacity: { min: 0, max: 6000 },
    transmissions: [],
    assemblies: [],
    bodyTypes: [],
    isCertified: false,
    isFeatured: false,
    isSaleItForMe: false,
    categories: [],
  });

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const storedUserData = await AsyncStorage.getItem('user');
        if (storedUserData) {
          const parsedData = JSON.parse(storedUserData);
          setUserData(parsedData);
          // FIXED: Extract userId properly
          const extractedUserId = parsedData?.userId || parsedData?.id || parsedData?._id;
          if (extractedUserId) {
            // Handle object IDs
            if (typeof extractedUserId === 'object' && extractedUserId !== null) {
              setUserId(extractedUserId._id || extractedUserId.id || String(extractedUserId));
            } else {
              setUserId(String(extractedUserId));
            }
          }
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  // Define fetchCars function before using it
  const fetchCars = async () => {
    try {
      setLoading(true);
      
      console.log("🚀 Calling /all_ads endpoint...");
      
      // Use safeApiCall for automatic retry and better error handling
      const timestamp = new Date().getTime();
      const result = await safeApiCall<any[]>(`${API_URL}/all_ads?_t=${timestamp}`, {
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
          'Accept': 'application/json'
        }
      }, 2); // 2 retries
      
      if (!result.success || !result.data) {
        console.error("❌ Failed to fetch cars:", result.error);
        setCars([]);
        return;
      }
      
      const data = result.data;
      
      console.log(`📦 Received ${data.length} total ads from backend`);
      
      // Debug: Count by source BEFORE filtering
      const bySource = {
        free_ads: data.filter((a: any) => a.adSource === 'free_ads' || a.modelType === 'Free').length,
        featured_ads: data.filter((a: any) => a.adSource === 'featured_ads' || a.modelType === 'Featured').length,
        list_it_for_you_ad: data.filter((a: any) => a.adSource === 'list_it_for_you_ad' || a.modelType === 'ListItForYou').length,
      };
      console.log(`📊 Backend response breakdown:`, bySource);
      
      // Filter only car ads (not bikes, etc) - check both modelType and adSource
      const carAds = data.filter((ad: any) => {
        const isCarAd = ad.modelType === "ListItForYou" || 
                       ad.modelType === "Featured" || 
                       ad.modelType === "Free" ||
                       ad.adSource === "list_it_for_you_ad" ||
                       ad.adSource === "featured_ads" ||
                       ad.adSource === "free_ads";
        if (!isCarAd) {
          // Debug: Log non-car ads (bikes, etc) that are being filtered
          if (ad.adSource === 'featured_ads' || ad.modelType === 'Featured') {
            console.log(`🚫 Premium car filtered (not car ad): ${ad.make} ${ad.model} - modelType: ${ad.modelType}, adSource: ${ad.adSource}`);
          }
          return false;
        }
        // Validate ad: must not be deleted, rejected, expired, etc.
        const isValid = isAdValidForPublicListing(ad);
        if (!isValid) {
          // Detailed logging for premium cars that fail validation
          if (ad.adSource === 'featured_ads' || ad.modelType === 'Featured') {
            console.log(`🚫 Premium car filtered out: ${ad.make} ${ad.model} (${ad.adSource})`);
            console.log(`   Details: isActive: ${ad.isActive}, isFeatured: ${ad.isFeatured}, isDeleted: ${ad.isDeleted}, paymentStatus: ${ad.paymentStatus}`);
            console.log(`   Expiry: featuredExpiryDate: ${ad.featuredExpiryDate}, validityDays: ${ad.validityDays}, approvedAt: ${ad.approvedAt}`);
          } else if (ad.adSource === 'free_ads') {
            console.log(`🚫 Free car filtered out: ${ad.make} ${ad.model} (${ad.adSource}) - isActive: ${ad.isActive}, isFeatured: ${ad.isFeatured}, isDeleted: ${ad.isDeleted}`);
          }
        } else {
          // Log premium cars that pass validation
          if (ad.adSource === 'featured_ads' || ad.modelType === 'Featured') {
            console.log(`✅ Premium car PASSED validation: ${ad.make} ${ad.model} - will show in Used Cars`);
          }
        }
        return isValid;
      });
      
      console.log(`✅ After validation: ${carAds.length} car ads (${carAds.filter((a: any) => a.modelType === 'Free' || a.adSource === 'free_ads').length} free, ${carAds.filter((a: any) => a.modelType === 'Featured' || a.adSource === 'featured_ads').length} premium, ${carAds.filter((a: any) => a.modelType === 'ListItForYou' || a.adSource === 'list_it_for_you_ad').length} managed)`);
      
      // FIXED: Normalize car data - clean up empty userId objects and extract seller IDs
      const normalizedCarAds = carAds.map((ad: any) => {
        // Normalize userId - remove empty objects and extract actual ID
        let normalizedUserId = ad.userId;
        
        // Check if userId is an empty object
        if (normalizedUserId && typeof normalizedUserId === 'object' && Object.keys(normalizedUserId).length === 0) {
          normalizedUserId = null; // Set to null if empty object
        }
        
        // If userId is still an object, try to extract _id
        if (normalizedUserId && typeof normalizedUserId === 'object' && normalizedUserId !== null) {
          normalizedUserId = normalizedUserId._id || normalizedUserId.id || null;
        }
        
        // Try other fields if userId is still null
        if (!normalizedUserId) {
          normalizedUserId = ad.sellerId || ad.postedBy || ad.user_id || ad.seller_id || null;
          
          // If sellerId is also an object, extract _id
          if (normalizedUserId && typeof normalizedUserId === 'object' && normalizedUserId !== null) {
            if (Object.keys(normalizedUserId).length === 0) {
              normalizedUserId = null; // Empty object
            } else {
              normalizedUserId = normalizedUserId._id || normalizedUserId.id || null;
            }
          }
        }
        
        // Normalize _id to string if it's an object
        let normalizedId = ad._id;
        if (normalizedId && typeof normalizedId === 'object' && normalizedId !== null) {
          normalizedId = normalizedId._id || normalizedId.id || normalizedId.toString?.() || null;
          // Reject if it's "[object Object]"
          if (normalizedId === '[object Object]' || (typeof normalizedId === 'string' && normalizedId.includes('[object'))) {
            normalizedId = null;
          }
        }
        
        // Add priority field for proper sorting - STRICT categorization
        let priority = 3; // Default: treat as free
        let finalModelType = ad.modelType;
        
        // Priority 1: Managed by Autofinder (HIGHEST)
        if (ad.modelType === "ListItForYou" || ad.isManaged === true || ad.adSource === "list_it_for_you_ad") {
          priority = 1;
          finalModelType = "ListItForYou";
        } 
        // Priority 2: Premium/Featured cars (MIDDLE)
        else if (ad.modelType === "Featured" || ad.isFeatured === 'Approved' || ad.isFeatured === true || ad.adSource === "featured_ads") {
          priority = 2;
          finalModelType = "Featured";
        } 
        // Priority 3: Free cars (LOWEST) - everything else
        else {
          priority = 3;
          finalModelType = "Free";
        }
        
        // Return normalized car with cleaned userId and corrected modelType
        return { 
          ...ad, 
          _id: normalizedId || ad._id, // Use normalized ID if available
          userId: normalizedUserId, // Use normalized userId (null if empty object)
          sellerId: normalizedUserId, // Also set sellerId for consistency
          _priority: priority,
          modelType: finalModelType // Use corrected modelType for consistent grouping
        };
      });
      
      const carAdsWithPriority = normalizedCarAds;
      
      // Count by type
      const managed = carAdsWithPriority.filter((ad: any) => ad.modelType === "ListItForYou").length;
      const premium = carAdsWithPriority.filter((ad: any) => ad.modelType === "Featured").length;
      const free = carAdsWithPriority.filter((ad: any) => ad.modelType === "Free").length;
      
      // Count boosted ads by section
      const boostedPremium = carAds.filter((ad: any) => ad.modelType === "Featured" && ad.isBoosted).length;
      const boostedFree = carAds.filter((ad: any) => ad.modelType === "Free" && ad.isBoosted).length;
      
      console.log(`✅ AFTER filter - Car ads: ${carAdsWithPriority.length} (${managed} managed, ${premium} premium, ${free} free)`);
      console.log(`🚀 Boosted ads: Premium: ${boostedPremium}, Free: ${boostedFree}`);
      console.log(`📊 First 10 cars order:`);
      carAdsWithPriority.slice(0, 10).forEach((ad: any, i: number) => {
        const boost = ad.isBoosted ? '🚀' : '';
        console.log(`  ${i+1}. ${ad.modelType} - ${ad.make} ${boost} (priority: ${ad._priority}, isBoosted: ${ad.isBoosted})`);
      });
      
      // Show all boosted ads for verification
      const allBoosted = carAdsWithPriority.filter((ad: any) => ad.isBoosted);
      if (allBoosted.length > 0) {
        console.log(`🚀 ALL BOOSTED ADS (${allBoosted.length}):`);
        allBoosted.forEach((ad: any, i: number) => {
          console.log(`  ${i+1}. ${ad.modelType} - ${ad.make} ${ad.model} (boostedAt: ${ad.boostedAt})`);
        });
      }
      
      setCars(carAdsWithPriority);
    } catch (error) {
      console.error("❌ Error fetching cars:", error);
      setCars([]); // Set empty array on error to prevent undefined
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCars();
  }, []);
  
  // ✅ Auto-refresh when screen comes into focus (after boosting ad)
  useFocusEffect(
    React.useCallback(() => {
      console.log("🔄 Used Cars screen focused - Refreshing data...");
      fetchCars();
    }, [])
  );

  useEffect(() => {
    applyFilters();
  }, [cars, filters, searchQuery, sortBy]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchCars();
    setRefreshing(false);
  };

  const applyFilters = () => {
    // Use safe filtering to prevent undefined errors
    const carsList = Array.isArray(cars) ? cars : [];
    
    // Debug: Log current filters
    console.log("🎯 Current filters:", {
      brands: filters.brands,
      models: filters.models,
      years: filters.years,
      price: filters.price,
      isFeatured: filters.isFeatured,
      isCertified: filters.isCertified,
      searchQuery: searchQuery
    });
    
    // Debug: Check managed cars BEFORE filterCarsSafely
    const managedBefore = carsList.filter(c => c.modelType === "ListItForYou");
    console.log(`🛡️ BEFORE filterCarsSafely - Managed cars: ${managedBefore.length}`);
    
    const filtered = filterCarsSafely(carsList, filters, searchQuery);

    // Debug: Check managed cars AFTER filterCarsSafely
    const managedAfter = filtered.filter(c => c.modelType === "ListItForYou");
    console.log(`🛡️ AFTER filterCarsSafely - Managed cars: ${managedAfter.length}`);
    
    if (managedBefore.length !== managedAfter.length) {
      console.warn(`⚠️ WARNING: ${managedBefore.length - managedAfter.length} managed car(s) filtered out by filterCarsSafely!`);
      const removedCars = managedBefore.filter(b => !managedAfter.find(a => a._id === b._id));
      console.log("🚫 Removed cars:", removedCars.map(c => ({ make: c.make, model: c.model, id: c._id })));
    }

    console.log(`🔍 After filtering: ${filtered.length} cars, Sort by: ${sortBy}`);

    // Helper function to check if boost is still active (typically 7 days)
    const isBoostActive = (item: any): boolean => {
      if (!item.boostedAt) return false;
      
      const boostDate = new Date(item.boostedAt);
      if (isNaN(boostDate.getTime())) return false;
      
      // Boost typically lasts 7 days
      const boostExpiryDate = new Date(boostDate);
      boostExpiryDate.setDate(boostExpiryDate.getDate() + 7);
      
      const now = new Date();
      return now < boostExpiryDate; // Boost is active if current date is before expiry
    };

    // Apply sorting - SKIP initial sort for "Relevance" as grouping handles it
    if (sortBy === "Price: Low to High") {
      filtered.sort((a, b) => {
        const priceA = a && a.price ? Number(String(a.price).replace(/[^0-9]/g, "")) : 0;
        const priceB = b && b.price ? Number(String(b.price).replace(/[^0-9]/g, "")) : 0;
        
        // If both have 0 price, maintain order
        if (priceA === 0 && priceB === 0) return 0;
        if (priceA === 0) return 1; // Put items without price at the end
        if (priceB === 0) return -1; // Put items without price at the end
        
        return priceA - priceB; // Low to High
      });
      
      // Debug: Log first 5 after sorting
      console.log(`💰 After "Price: Low to High" sort, first 5 prices:`, filtered.slice(0, 5).map((c, i) => {
        const price = c && c.price ? Number(String(c.price).replace(/[^0-9]/g, "")) : 0;
        return `${i+1}. ${c.make} ${c.model} - PKR ${price.toLocaleString()}`;
      }));
    } else if (sortBy === "Price: High to Low") {
      filtered.sort((a, b) => {
        const priceA = a && a.price ? Number(String(a.price).replace(/[^0-9]/g, "")) : 0;
        const priceB = b && b.price ? Number(String(b.price).replace(/[^0-9]/g, "")) : 0;
        
        // If both have 0 price, maintain order
        if (priceA === 0 && priceB === 0) return 0;
        if (priceA === 0) return 1; // Put items without price at the end
        if (priceB === 0) return -1; // Put items without price at the end
        
        return priceB - priceA; // High to Low
      });
      
      // Debug: Log first 5 after sorting
      console.log(`💰 After "Price: High to Low" sort, first 5 prices:`, filtered.slice(0, 5).map((c, i) => {
        const price = c && c.price ? Number(String(c.price).replace(/[^0-9]/g, "")) : 0;
        return `${i+1}. ${c.make} ${c.model} - PKR ${price.toLocaleString()}`;
      }));
    } else if (sortBy === "Newest to Oldest") {
      // Sort by dateAdded - newest first (most recent date first)
      filtered.sort((a, b) => {
        // Get date from approvedAt first, then dateAdded, then createdAt
        const dateA = a?.approvedAt || a?.dateAdded || a?.createdAt || 0;
        const dateB = b?.approvedAt || b?.dateAdded || b?.createdAt || 0;
        
        // Parse dates safely
        let timeA = 0;
        let timeB = 0;
        
        if (dateA) {
          const parsedA = new Date(dateA);
          timeA = !isNaN(parsedA.getTime()) ? parsedA.getTime() : 0;
        }
        
        if (dateB) {
          const parsedB = new Date(dateB);
          timeB = !isNaN(parsedB.getTime()) ? parsedB.getTime() : 0;
        }
        
        // Newest first (higher timestamp first)
        // If both have 0 timestamp, maintain order
        if (timeA === 0 && timeB === 0) return 0;
        if (timeA === 0) return 1; // Put items without date at the end
        if (timeB === 0) return -1; // Put items without date at the end
        
        return timeB - timeA;
      });
      
      // Debug: Log first 5 after sorting
      console.log(`📅 After "Newest to Oldest" sort, first 5 dates:`, filtered.slice(0, 5).map((c, i) => {
        const date = c?.approvedAt || c?.dateAdded || c?.createdAt || c?.updatedAt;
        return `${i+1}. ${c.make} ${c.model} - ${date ? new Date(date).toLocaleDateString() : 'No date'} (${date ? new Date(date).getTime() : 0})`;
      }));
    } else if (sortBy === "Oldest to Newest") {
      // Sort by dateAdded - oldest first (oldest date first)
      filtered.sort((a, b) => {
        // Get date from approvedAt first, then dateAdded, then createdAt
        const dateA = a?.approvedAt || a?.dateAdded || a?.createdAt || a?.updatedAt || 0;
        const dateB = b?.approvedAt || b?.dateAdded || b?.createdAt || b?.updatedAt || 0;
        
        // Parse dates safely
        let timeA = 0;
        let timeB = 0;
        
        if (dateA) {
          const parsedA = new Date(dateA);
          timeA = !isNaN(parsedA.getTime()) ? parsedA.getTime() : 0;
        }
        
        if (dateB) {
          const parsedB = new Date(dateB);
          timeB = !isNaN(parsedB.getTime()) ? parsedB.getTime() : 0;
        }
        
        // Oldest first (lower timestamp first)
        // If both have 0 timestamp, maintain order
        if (timeA === 0 && timeB === 0) return 0;
        if (timeA === 0) return 1; // Put items without date at the end
        if (timeB === 0) return -1; // Put items without date at the end
        
        return timeA - timeB;
      });
      
      // Debug: Log first 5 after sorting
      console.log(`📅 After "Oldest to Newest" sort, first 5 dates:`, filtered.slice(0, 5).map((c, i) => {
        const date = c?.approvedAt || c?.dateAdded || c?.createdAt || c?.updatedAt;
        return `${i+1}. ${c.make} ${c.model} - ${date ? new Date(date).toLocaleDateString() : 'No date'} (${date ? new Date(date).getTime() : 0})`;
      }));
      
      // Debug: Log first 5 after sorting
      console.log(`📅 After "Oldest to Newest" sort, first 5 dates:`, filtered.slice(0, 5).map((c, i) => {
        const date = c?.approvedAt || c?.dateAdded || c?.createdAt;
        return `${i+1}. ${c.make} ${c.model} - ${date ? new Date(date).toLocaleDateString() : 'No date'}`;
      }));
    } else if (sortBy === "KM: Lowest First") {
      filtered.sort((a, b) => (Number(a.kmDriven) || 0) - (Number(b.kmDriven) || 0));
    } else if (sortBy === "KM: Highest First") {
      filtered.sort((a, b) => (Number(b.kmDriven) || 0) - (Number(a.kmDriven) || 0));
    }
    
    // CRITICAL: Only apply grouping for Relevance sort, not for other sorts
    // For other sorts (Price, Date, KM), maintain the sorted order without grouping
    let finalFiltered = filtered;
    if (sortBy === "Relevance") {
      // FIXED: Ensure proper order - Managed by Autofinder first, then Premium with tag, then Free
      // Create separate blocks with STRICT filtering
      const managedBlock = [];
      const premiumBlock = [];
      const freeBlock = [];
      
      // Categorize each car into ONE block only with debug logging
      filtered.forEach((c, idx) => {
        // Priority 1: Managed by Autofinder (ListItForYou)
        if (c.modelType === "ListItForYou" || c.isManaged === true) {
          managedBlock.push(c);
          if (idx < 5) console.log(`  [${idx}] MANAGED: ${c.make} ${c.model} (modelType: ${c.modelType}, isManaged: ${c.isManaged})`);
        }
        // Priority 2: Premium cars (Featured)
        else if (c.modelType === "Featured" || c.isFeatured === 'Approved' || c.isFeatured === true || c.adSource === "featured_ads") {
          premiumBlock.push(c);
          if (idx < 5) console.log(`  [${idx}] PREMIUM: ${c.make} ${c.model} (modelType: ${c.modelType}, isFeatured: ${c.isFeatured}, adSource: ${c.adSource})`);
        }
        // Priority 3: Free cars (everything else)
        else {
          freeBlock.push(c);
          if (idx < 5) console.log(`  [${idx}] FREE: ${c.make} ${c.model} (modelType: ${c.modelType}, _priority: ${c._priority})`);
        }
      });
      
      // Sort each block internally by boost status first, then by date
      const sortBlock = (block: any[]) => {
        return block.sort((a, b) => {
          // 1. Check boost status (boosted ads on top within each block)
          const aBoostActive = isBoostActive(a);
          const bBoostActive = isBoostActive(b);
          
          if (aBoostActive && !bBoostActive) return -1;
          if (!aBoostActive && bBoostActive) return 1;
          
          // 2. If both have same boost status, sort by date (newest first)
          const dateA = a.dateAdded ? new Date(a.dateAdded).getTime() : 0;
          const dateB = b.dateAdded ? new Date(b.dateAdded).getTime() : 0;
          return dateB - dateA;
        });
      };
      
      // Combine blocks in strict order: Managed → Premium → Free
      finalFiltered = [
        ...sortBlock([...managedBlock]),    // Managed by Autofinder (top)
        ...sortBlock([...premiumBlock]),    // Premium cars (middle)
        ...sortBlock([...freeBlock])        // Free cars (bottom)
      ];
      
      console.log(`✅ Final order: ${managedBlock.length} Managed, ${premiumBlock.length} Premium, ${freeBlock.length} Free`);
      console.log(`📊 First 15 cars in final list:`);
      finalFiltered.slice(0, 15).forEach((c, i) => {
        console.log(`  ${i+1}. [${c.modelType}] ${c.make} ${c.model} - Priority: ${c._priority}`);
      });
    }
    setFilteredCars(finalFiltered);
  };

  const handleApplyFilters = (newFilters: FilterState) => {
    setFilters(newFilters);
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.brands.length > 0 && !filters.brands.includes("All Brands")) count++;
    if (filters.models.length > 0 && !filters.models.includes("All Models")) count++;
    if (filters.variants.length > 0 && !filters.variants.includes("All Variants")) count++;
    if (filters.registrationCities.length > 0 && !filters.registrationCities.includes("All Cities")) count++;
    if (filters.locations.length > 0 && !filters.locations.includes("All Cities")) count++;
    if (filters.bodyColors.length > 0 && !filters.bodyColors.includes("All Colors")) count++;
    if (filters.fuelTypes.length > 0 && !filters.fuelTypes.includes("All Fuel Types")) count++;
    if (filters.transmissions.length > 0 && !filters.transmissions.includes("All Transmissions")) count++;
    if (filters.assemblies.length > 0 && !filters.assemblies.includes("All Assemblies")) count++;
    if (filters.bodyTypes.length > 0 && !filters.bodyTypes.includes("All Body Types")) count++;
    if (filters.categories.length > 0 && !filters.categories.includes("All Categories")) count++;
    if (filters.isCertified) count++;
    if (filters.isFeatured) count++;
    if (filters.isSaleItForMe) count++;
    if (filters.years.min !== 1970 || filters.years.max !== new Date().getFullYear()) count++;
    if (filters.kmDriven.min !== 0 || filters.kmDriven.max !== 500000) count++;
    if (filters.price.min !== 0 || filters.price.max !== 50000000) count++;
    if (filters.engineCapacity.min !== 0 || filters.engineCapacity.max !== 6000) count++;
    return count;
  };

  // Build list with section tags: Managed by AutoFinder (tag) → Premium (tag) → Free (no tag). Only when sort is Relevance.
  type DisplayItem =
    | { _isSection: true; sectionKey: string; title: string }
    | { _isSection: false; car: any; globalIndex: number };
  const displayList: DisplayItem[] = useMemo(() => {
    const list = Array.isArray(filteredCars) ? filteredCars : [];
    console.log(`📋 displayList: Processing ${list.length} cars, sortBy: ${sortBy}`);
    
    // Debug: Check premium cars in filteredCars
    const premiumInList = list.filter((c: any) => c.modelType === "Featured" || c.isFeatured === "Approved" || c.isFeatured === true || c.adSource === "featured_ads");
    console.log(`⭐ Premium cars in filteredCars: ${premiumInList.length}`);
    premiumInList.forEach((c: any, i: number) => {
      console.log(`   ${i+1}. ${c.make} ${c.model} - modelType: ${c.modelType}, isFeatured: ${c.isFeatured}, adSource: ${c.adSource}`);
    });
    
    if (sortBy !== "Relevance") {
      return list.map((car, i) => ({ _isSection: false as const, car, globalIndex: i }));
    }
    const managed: any[] = [];
    const premium: any[] = [];
    const free: any[] = [];
    list.forEach((c: any) => {
      if (c.modelType === "ListItForYou" || c.isManaged === true) managed.push(c);
      else if (c.modelType === "Featured" || c.isFeatured === "Approved" || c.isFeatured === true || c.adSource === "featured_ads") {
        premium.push(c);
        console.log(`✅ Premium car added to displayList: ${c.make} ${c.model}`);
      }
      else free.push(c);
    });
    console.log(`📊 displayList grouping: ${managed.length} Managed, ${premium.length} Premium, ${free.length} Free`);
    const out: DisplayItem[] = [];
    let globalIndex = 0;
    if (managed.length > 0) {
      out.push({ _isSection: true, sectionKey: "managed", title: "Managed by AutoFinder" });
      managed.forEach((c) => { out.push({ _isSection: false, car: c, globalIndex: globalIndex++ }); });
    }
    if (premium.length > 0) {
      out.push({ _isSection: true, sectionKey: "premium", title: "Premium Cars" });
      premium.forEach((c) => { 
        out.push({ _isSection: false, car: c, globalIndex: globalIndex++ });
        console.log(`✅ Premium car added to final displayList: ${c.make} ${c.model} at index ${globalIndex - 1}`);
      });
    }
    free.forEach((c) => { out.push({ _isSection: false, car: c, globalIndex: globalIndex++ }); });
    console.log(`📋 Final displayList length: ${out.length} items (${out.filter(i => i._isSection).length} sections, ${out.filter(i => !i._isSection).length} cars)`);
    return out;
  }, [filteredCars, sortBy]);

  const renderSectionTag = (title: string) => (
    <View style={styles.sectionTagContainer}>
      <View style={styles.sectionTag}>
        <Text style={styles.sectionTagText}>{title}</Text>
      </View>
    </View>
  );

  const renderListItem = ({ item, index }: { item: DisplayItem; index: number }) => {
    if (item._isSection) {
      return renderSectionTag(item.title);
    }
    const car = item.car;
    const globalIndex = item.globalIndex;
    const promoKey = `promo-${globalIndex}-${Math.floor((globalIndex + 1) / 4)}`;
    return (
      <>
        <CarCard
          car={car}
          userId={userId}
          onPress={() => {
            const carDetails = {
              ...car,
              images: car.images && Array.isArray(car.images) && car.images.length > 0 ? car.images : [],
            };
            navigation.navigate("CarDetails", { carDetails });
          }}
        />
        {(globalIndex + 1) % 4 === 0 && (() => {
          const slot = (Math.floor((globalIndex + 1) / 4) - 1) % 4;
          switch (slot) {
            case 0: return <CarInspectionCard key={promoKey} />;
            case 1: return <ListItForMeCard key={promoKey} />;
            case 2: return <PremiumAdServiceCard key={promoKey} />;
            case 3: return <CarOnRentCard key={promoKey} />;
            default: return null;
          }
        })()}
      </>
    );
  };

  const renderHeader = () => (
    <View style={styles.header}>
      {/* Search bar removed as requested */}

      {/* Filter and Sort Bar */}
      <View style={styles.filterBar}>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setFilterModalVisible(true)}
        >
          <Ionicons name="options-outline" size={20} color="#CD0100" />
          <Text style={styles.filterButtonText}>Filters</Text>
          {getActiveFiltersCount() > 0 && (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>{getActiveFiltersCount()}</Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.sortButton}
          onPress={() => setShowSortModal(true)}
        >
          <Ionicons name="swap-vertical-outline" size={20} color="#CD0100" />
          <Text style={styles.sortButtonText}>Sort: {sortBy}</Text>
        </TouchableOpacity>
      </View>

      {/* Results Count */}
      <View style={styles.resultsContainer}>
        <Text style={styles.resultsText}>
          {filteredCars.length} used cars found
        </Text>
      </View>
    </View>
  );

  const renderSortModal = () => (
    <Modal
      visible={showSortModal}
      transparent
      animationType="fade"
      onRequestClose={() => setShowSortModal(false)}
    >
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={() => setShowSortModal(false)}
      >
        <View style={styles.sortModal}>
          <Text style={styles.sortModalTitle}>Sort By</Text>
          {[
            "Relevance",
            "Price: Low to High",
            "Price: High to Low",
            "Newest to Oldest",
            "Oldest to Newest",
            "KM: Lowest First",
            "KM: Highest First",
          ].map((option) => (
            <TouchableOpacity
              key={option}
              style={[
                styles.sortOption,
                sortBy === option && styles.selectedSortOption,
              ]}
              onPress={() => {
                setSortBy(option);
                setShowSortModal(false);
              }}
            >
              <Text
                style={[
                  styles.sortOptionText,
                  sortBy === option && styles.selectedSortOptionText,
                ]}
              >
                {option}
              </Text>
              {sortBy === option && (
                <Ionicons name="checkmark" size={20} color="#CD0100" />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </TouchableOpacity>
    </Modal>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        {renderHeader()}
        <FlatList
          data={[1, 2, 3, 4, 5, 6]}
          renderItem={() => <CarCardSkeleton />}
          keyExtractor={(item) => item.toString()}
          showsVerticalScrollIndicator={false}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {renderHeader()}
      
      <FlatList
        data={displayList}
        renderItem={renderListItem}
        keyExtractor={(item, index) => {
          if (item._isSection) return `section-${item.sectionKey}-${index}`;
          const c = item.car;
          try {
            let idStr: string | null = null;
            if (c?._id) {
              if (typeof c._id === 'string') {
                const testId = c._id.trim();
                if (testId.length > 10 && testId !== '[object Object]' && !testId.includes('[object')) idStr = testId;
              } else if (typeof c._id === 'object' && c._id !== null) {
                const nestedId = c._id._id || c._id.id;
                if (nestedId && typeof nestedId === 'string' && nestedId.length > 10 && nestedId !== '[object Object]') idStr = nestedId;
                else if (c._id.toString && typeof c._id.toString === 'function') {
                  const s = c._id.toString();
                  if (s && s.length > 10 && s !== '[object Object]') idStr = s;
                }
              }
            }
            if (idStr) return `${idStr}-idx${index}`;
            const make = String(c?.make || 'car').substring(0, 10).replace(/[^a-zA-Z0-9]/g, '') || 'car';
            const model = String(c?.model || 'model').substring(0, 10).replace(/[^a-zA-Z0-9]/g, '') || 'model';
            const year = String(c?.year || 'year').substring(0, 4).replace(/[^0-9]/g, '') || 'year';
            return `car-${make}-${model}-${year}-idx${index}`;
          } catch {
            return `car-idx${index}`;
          }
        }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="car-outline" size={80} color="#ccc" />
            <Text style={styles.emptyText}>No used cars found</Text>
            <Text style={styles.emptySubtext}>
              Try adjusting your filters or search terms
            </Text>
          </View>
        }
      />

      {renderSortModal()}

      <EnhancedUsedCarFilterModal
        visible={filterModalVisible}
        onClose={() => setFilterModalVisible(false)}
        onApplyFilters={handleApplyFilters}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  header: {
    backgroundColor: "#fff",
    paddingHorizontal: 15,
    paddingTop: 10,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  searchContainer: {
    marginBottom: 15,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    borderRadius: 10,
    paddingHorizontal: 15,
    height: 45,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#333",
  },
  filterBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  filterButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#CD0100",
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 8,
    position: "relative",
  },
  filterButtonText: {
    color: "#CD0100",
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 5,
  },
  filterBadge: {
    position: "absolute",
    top: -8,
    right: -8,
    backgroundColor: "#CD0100",
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  filterBadgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
  sortButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 8,
  },
  sortButtonText: {
    color: "#333",
    fontSize: 14,
    fontWeight: "500",
    marginLeft: 5,
  },
  resultsContainer: {
    marginTop: 5,
  },
  resultsText: {
    fontSize: 14,
    color: "#666",
  },
  sectionTagContainer: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    paddingTop: 14,
  },
  sectionTag: {
    alignSelf: "flex-start",
    backgroundColor: "#CD0100",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  sectionTagText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "700",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 50,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#666",
    marginTop: 15,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#999",
    marginTop: 5,
    textAlign: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  sortModal: {
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 20,
    width: "80%",
    maxWidth: 300,
  },
  sortModalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 20,
    textAlign: "center",
  },
  sortOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  selectedSortOption: {
    backgroundColor: "#fff5f5",
  },
  sortOptionText: {
    fontSize: 16,
    color: "#333",
  },
  selectedSortOptionText: {
    color: "#CD0100",
    fontWeight: "600",
  },
  sectionHeader: {
    backgroundColor: "#f8f9fa",
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
    marginTop: 8,
  },
  sectionRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginLeft: 8,
  },
});

export default EnhancedUsedCarListScreen;
