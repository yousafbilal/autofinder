import React, { useEffect, useState } from "react";
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
  Dimensions,
  Platform,
} from "react-native";
import { FontAwesome, Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import BikeCard from "../../Components/BikeCard";
import BikeFilterModal from "../../Components/Models/BikeFilterModal";
import PriceFilterModal from "../../Components/Models/PriceFilterModal";
import YearFilterModal from "../../Components/Models/YearFilterModal";
import KilometerRangeModal from "../../Components/Models/KilometerRangeModal";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { API_URL } from "../../../config";
import { safeApiCall } from "../../utils/apiUtils";
import { COLORS } from "../../constants/colors";
import BikeCardSkeleton from "../../Components/Commons/BikeCardSkeleton";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { filterBikesSafely } from "../../utils/safeBikeFiltering";
import { isAdValidForPublicListing } from "../../utils/safeFiltering";
import CarInspectionCard from "../../Components/PromotionalCards/CarInspectionCard";
import ListItForMeCard from "../../Components/PromotionalCards/ListItForMeCard";
import { rf, rp, createResponsiveStyleSheet, isAndroid } from "../../utils/responsive";

const { width, height } = Dimensions.get('window');
const isTablet = width >= 768;
const isSmallScreen = width < 375;

type BikeListScreenProps = NativeStackScreenProps<any, "BikeListScreen">;

interface FilterState {
  companies: string[];
  models: string[];
  variants: string[];
  years: { min: number; max: number };
  registrationCities: string[];
  locations: string[];
  engineCapacity: { min: number; max: number };
  bodyColors: string[];
  kmDriven: { min: number; max: number };
  price: { min: number; max: number };
  fuelTypes: string[];
  engineTypes: string[];
  isFeatured: boolean;
}

const isBooleanTrue = (value: any): boolean => {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value === 1;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    return normalized === "true" || normalized === "1" || normalized === "yes";
  }
  return false;
};

const getPaymentStatus = (bike: any): string =>
  (bike?.paymentStatus || "").toString().trim().toLowerCase();

const isPremiumApproved = (bike: any): boolean => {
  const featureValue = bike?.isFeatured;
  const paymentStatus = bike?.paymentStatus;
  
  // Check isFeatured value (case insensitive)
  if (typeof featureValue === "string") {
    const normalized = featureValue.trim().toLowerCase();
    if (normalized === "approved" || normalized === "true") {
      return true;
    }
  }
  
  // Boolean true for isFeatured
  if (featureValue === true) {
    return true;
  }
  
  // Also check paymentStatus === "verified" as premium indicator
  if (paymentStatus === "verified") {
    return true;
  }
  
  return false;
};

const isPaymentVerified = (bike: any): boolean => getPaymentStatus(bike) === "verified";

const isPaidAdPending = (bike: any): boolean =>
  isBooleanTrue(bike?.isPaidAd) && getPaymentStatus(bike) === "pending";

// Check if bike has pending premium upgrade request
const isPremiumPending = (bike: any): boolean => {
  const featureValue = bike?.isFeatured;
  if (typeof featureValue === "string") {
    return featureValue.trim().toLowerCase() === "pending";
  }
  return false;
};

const BikeListScreen: React.FC<BikeListScreenProps> = ({ navigation, route }) => {
  const [loading, setLoading] = useState(true);
  const [bikes, setBikes] = useState<any[]>([]);
  const [filteredBikes, setFilteredBikes] = useState<any[]>([]);
  const [showSortModal, setShowSortModal] = useState(false);
  const [sortBy, setSortBy] = useState("Relevance");
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [priceModalVisible, setPriceModalVisible] = useState(false);
  const [yearModalVisible, setYearModalVisible] = useState(false);
  const [kilometerModalVisible, setKilometerModalVisible] = useState(false);
  const [userData, setUserData] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState(route?.params?.searchQuery || "");
  
  // Separate state for price, year, and kilometer filters
  const [minPrice, setMinPrice] = useState<number>(0);
  const [maxPrice, setMaxPrice] = useState<number>(2000000);
  const [minYear, setMinYear] = useState<number>(1970);
  const [maxYear, setMaxYear] = useState<number>(new Date().getFullYear());
  const [minMileage, setMinMileage] = useState<number>(0);
  const [maxMileage, setMaxMileage] = useState<number>(100000);

  // Filter state
  const [filters, setFilters] = useState<FilterState>({
    companies: [],
    models: [],
    variants: [],
    years: { min: 1970, max: new Date().getFullYear() },
    registrationCities: [],
    locations: [],
    engineCapacity: { min: 50, max: 1000 },
    bodyColors: [],
    kmDriven: { min: 0, max: 100000 },
    price: { min: 0, max: 2000000 },
    fuelTypes: [],
    engineTypes: [],
    isFeatured: false,
  });
  
  // Sync separate filter states with main filters
  useEffect(() => {
    setFilters(prev => ({
      ...prev,
      price: { min: minPrice, max: maxPrice },
      years: { min: minYear, max: maxYear },
      kmDriven: { min: minMileage, max: maxMileage },
    }));
  }, [minPrice, maxPrice, minYear, maxYear, minMileage, maxMileage]);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const storedUserData = await AsyncStorage.getItem('user');
        if (storedUserData) {
          const parsedData = JSON.parse(storedUserData);
          setUserData(parsedData);
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
      // Don't set loading to false here - let fetchBikes handle it
    };

    fetchUserData();
  }, []);

  useEffect(() => {
    fetchBikes();
  }, []);

  // ✅ Auto-refresh when screen comes into focus (after admin approval)
  useFocusEffect(
    React.useCallback(() => {
      console.log("🔄 BikeListScreen focused - Refreshing data...");
      fetchBikes(); // Force refresh on focus
    }, [])
  );

  useEffect(() => {
    // Only apply filters if bikes array is not empty (guard: bikes must be array)
    if (Array.isArray(bikes) && bikes.length > 0) {
      applyFilters();
    } else {
      // If bikes array is empty, set filteredBikes to empty as well
      setFilteredBikes([]);
    }
  }, [bikes, filters, searchQuery, sortBy]); // Added sortBy to dependencies

  const fetchBikes = async () => {
    try {
      setLoading(true);
      console.log("🚀 Starting to fetch ALL bikes (premium + free)...");
      console.log("🔗 API URL:", API_URL);
      
      // Use single API call to fetch all bikes, similar to used cars
      // This ensures we get all bikes regardless of backend filtering
      const timestamp = new Date().getTime();
      const response = await fetch(`${API_URL}/bike_ads/public?limit=10000&_t=${timestamp}`, {
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      }).catch(err => {
        console.warn("⚠️ Bikes fetch failed:", err);
        return { ok: false, json: async () => [] };
      });
      
      let allBikesData: any[] = [];
      
      if (response.ok) {
        allBikesData = await response.json();
        allBikesData = Array.isArray(allBikesData) ? allBikesData : [];
        console.log("📦 Total bikes fetched from API:", allBikesData.length);
      } else {
        console.warn("⚠️ Failed to fetch bikes, trying backup endpoint...");
        // Backup: Try without limit
        const backupResponse = await fetch(`${API_URL}/bike_ads/public?_t=${timestamp}`, {
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        }).catch(() => ({ ok: false, json: async () => [] }));
        
        if (backupResponse.ok) {
          allBikesData = await backupResponse.json();
          allBikesData = Array.isArray(allBikesData) ? allBikesData : [];
          console.log("📦 Total bikes fetched from backup API:", allBikesData.length);
        }
      }
      
      // Normalize IDs and userId in bike data - convert object IDs to strings and clean empty userId objects
      const normalizedBikesData = (Array.isArray(allBikesData) ? allBikesData : []).map((bike: any) => {
        const normalized: any = { ...bike };
        
        // Normalize _id - handle both object and string cases
        if (bike._id) {
          let safeId: string | null = null;
          try {
            // If already a string, validate it's not "[object Object]"
            if (typeof bike._id === 'string') {
              if (bike._id !== '[object Object]' && bike._id.length > 10) {
                safeId = bike._id;
              }
            }
            // If object, try to extract ID
            else if (typeof bike._id === 'object') {
              // Check for empty object first
              if (Object.keys(bike._id).length === 0) {
                console.warn('⚠️ Bike _id is empty object:', bike);
                safeId = null;
              } else if (bike._id.toString && typeof bike._id.toString === 'function') {
                const str = bike._id.toString();
                if (str && str !== '[object Object]' && str.length > 10 && !str.includes('[object')) {
                  safeId = str;
                } else if (bike._id._id) {
                  safeId = String(bike._id._id);
                } else if (bike._id.$oid) {
                  safeId = String(bike._id.$oid);
                } else if (bike._id.id) {
                  safeId = String(bike._id.id);
                }
              } else {
                // Try nested properties
                safeId = bike._id._id ? String(bike._id._id) : (bike._id.$oid ? String(bike._id.$oid) : (bike._id.id ? String(bike._id.id) : null));
              }
            }
            
            if (safeId && safeId !== '[object Object]' && safeId.length > 10) {
              normalized._id = safeId;
              normalized.id = safeId;
            } else {
              console.warn('⚠️ Failed to normalize bike _id:', bike._id, 'for bike:', bike.make, bike.model);
            }
          } catch (e) {
            console.warn('⚠️ Error normalizing bike ID:', e, 'for bike:', bike.make, bike.model);
          }
        } else if (!bike.id && bike._id) {
          // Fallback: try direct conversion
          const fallbackId = typeof bike._id === 'string' ? bike._id : String(bike._id);
          if (fallbackId && fallbackId !== '[object Object]' && fallbackId.length > 10) {
            normalized.id = fallbackId;
          }
        }
        
        // Normalize userId - remove empty objects and extract actual ID
        let normalizedUserId: string | null = null;
        
        // CRITICAL: Check for empty object FIRST
        if (bike.userId) {
          if (typeof bike.userId === 'object') {
            if (Object.keys(bike.userId).length === 0) {
              normalizedUserId = null; // Empty object
            } else {
              // Extract _id from populated user object
              normalizedUserId = bike.userId._id || bike.userId.id || null;
              if (normalizedUserId) {
                normalizedUserId = String(normalizedUserId);
              }
            }
          } else if (typeof bike.userId === 'string') {
            // Already a string, validate it's not "[object Object]"
            if (bike.userId !== '[object Object]' && bike.userId.length > 10) {
              normalizedUserId = bike.userId;
            }
          }
        }
        
        // Try other fields if userId is still null
        if (!normalizedUserId) {
          const altFields = [bike.sellerId, bike.postedBy, bike.user_id, bike.seller_id];
          for (const field of altFields) {
            if (field) {
              if (typeof field === 'object') {
                if (Object.keys(field).length === 0) {
                  continue; // Skip empty object
                }
                normalizedUserId = field._id || field.id || null;
                if (normalizedUserId) {
                  normalizedUserId = String(normalizedUserId);
                  break;
                }
              } else if (typeof field === 'string' && field !== '[object Object]' && field.length > 10) {
                normalizedUserId = field;
                break;
              }
            }
          }
        }
        
        normalized.userId = normalizedUserId;
        normalized.sellerId = normalizedUserId; // Also set sellerId for consistency
        
        // Debug: Log bikes with null userId
        if (!normalizedUserId) {
          console.warn('⚠️ Bike has no userId after normalization:', {
            bikeId: normalized._id,
            make: bike.make,
            model: bike.model,
            originalUserId: bike.userId,
            originalUserIdType: typeof bike.userId,
            sellerId: bike.sellerId,
            postedBy: bike.postedBy
          });
        }
        
        return normalized;
      });
      
      // Filter out inactive, deleted, rejected, and EXPIRED bikes
      const activeBikes = normalizedBikesData.filter((bike: any) => {
        // ✅ Use unified validation: checks active, not deleted, not rejected, not expired
        return isAdValidForPublicListing(bike);
      });
      
      console.log("📦 Active bikes after filtering:", activeBikes.length);
      
      // Debug: Log bikes with seller ID info
      const bikesWithSellerId = activeBikes.filter((bike: any) => bike.userId || bike.sellerId);
      const bikesWithoutSellerId = activeBikes.filter((bike: any) => !bike.userId && !bike.sellerId);
      console.log(`🔍 Bikes with seller ID: ${bikesWithSellerId.length}, without seller ID: ${bikesWithoutSellerId.length}`);
      if (bikesWithoutSellerId.length > 0) {
        console.log(`⚠️ Sample bikes without seller ID:`, bikesWithoutSellerId.slice(0, 3).map((b: any) => ({
          id: b._id,
          make: b.make || b.company,
          model: b.model,
          userId: b.userId,
          sellerId: b.sellerId,
          postedBy: b.postedBy
        })));
      }
      
      // Debug: Log all bikes to see their status
      console.log("🔍 All active bikes status:", activeBikes.map((bike: any) => ({
        id: bike._id,
        make: bike.make || bike.company,
        model: bike.model,
        isFeatured: bike.isFeatured,
        paymentStatus: bike.paymentStatus,
        isActive: bike.isActive,
        isDeleted: bike.isDeleted
      })));
      
      // Separate premium and free bikes
      // IMPORTANT: Only show bikes with isFeatured === "Approved" as premium
      // Pending bikes (isFeatured === "Pending") should NOT show until admin approves
      const premiumBikes = activeBikes.filter((bike: any) => {
        // ONLY show bikes that admin has APPROVED (isFeatured === "Approved")
        // Payment verified alone is NOT enough - admin must approve
        return isPremiumApproved(bike);
      });
      
      const freeBikes = activeBikes.filter((bike: any) => {
        // Free bikes: anything that isn't an approved premium ad
        // AND is not pending approval
        
        // Exclude approved premium bikes
        if (isPremiumApproved(bike)) {
          return false;
        }

        // Hide bikes with pending premium status (waiting for admin approval)
        if (isPremiumPending(bike)) {
          return false;
        }

        // Hide bikes with pending payment verification
        if (isPaidAdPending(bike)) {
          return false;
        }
        
        // Hide bikes with pending payment status (upgraded but waiting approval)
        if (bike.paymentStatus === "pending" && bike.isPaidAd) {
          return false;
        }

        return true;
      });
      
      console.log("⭐ Premium bikes count:", premiumBikes.length);
      console.log("🆓 Free bikes count:", freeBikes.length);
      
      // Debug: Log sample premium and free bikes
      if (premiumBikes.length > 0) {
        console.log("⭐ Sample premium bikes:", premiumBikes.slice(0, 3).map((b: any) => ({
          id: b._id,
          make: b.make || b.company,
          model: b.model,
          isFeatured: b.isFeatured,
          paymentStatus: b.paymentStatus
        })));
      }
      if (freeBikes.length > 0) {
        console.log("🆓 Sample free bikes:", freeBikes.slice(0, 3).map((b: any) => ({
          id: b._id,
          make: b.make || b.company,
          model: b.model,
          isFeatured: b.isFeatured,
          paymentStatus: b.paymentStatus
        })));
      } else {
        console.warn("⚠️ WARNING: No free bikes found! Check filtering logic.");
        // Debug: Check why free bikes are not being identified
        const allNonPremium = activeBikes.filter((bike: any) => {
          const isPremium = bike.isFeatured === "Approved" || bike.isFeatured === true;
          const isVerified = bike.paymentStatus === "verified";
          const isPaidAd = bike.isPaidAd === true;
          return !isPremium && !isVerified && !isPaidAd;
        });
        console.log("🔍 All non-premium bikes (before pending filter):", allNonPremium.length);
        console.log("🔍 Sample non-premium bikes:", allNonPremium.slice(0, 5).map((b: any) => ({
          id: b._id,
          make: b.make || b.company,
          model: b.model,
          isFeatured: b.isFeatured,
          paymentStatus: b.paymentStatus,
          isPaidAd: b.isPaidAd
        })));
      }
      
      // Sort premium bikes: boosted first, then by date
      premiumBikes.sort((a: any, b: any) => {
        // Boosted bikes first
        const aBoost = a.priorityScore || (a.boostedAt ? new Date(a.boostedAt).getTime() : 0);
        const bBoost = b.priorityScore || (b.boostedAt ? new Date(b.boostedAt).getTime() : 0);
        if (aBoost !== bBoost) return bBoost - aBoost;
        
        // Then by date (newest first)
        const aDate = a.dateAdded ? new Date(a.dateAdded).getTime() : 0;
        const bDate = b.dateAdded ? new Date(b.dateAdded).getTime() : 0;
        return bDate - aDate;
      });
      
      // Sort free bikes: boosted first, then by date
      freeBikes.sort((a: any, b: any) => {
        // Boosted bikes first
        const aBoost = a.priorityScore || (a.boostedAt ? new Date(a.boostedAt).getTime() : 0);
        const bBoost = b.priorityScore || (b.boostedAt ? new Date(b.boostedAt).getTime() : 0);
        if (aBoost !== bBoost) return bBoost - aBoost;
        
        // Then by date (newest first)
        const aDate = a.dateAdded ? new Date(a.dateAdded).getTime() : 0;
        const bDate = b.dateAdded ? new Date(b.dateAdded).getTime() : 0;
        return bDate - aDate;
      });
      
      // Combine: Premium bikes first, then free bikes
      const sortedBikes = [...premiumBikes, ...freeBikes];
      
      console.log("✅ Total bikes after sorting:", sortedBikes.length);
      console.log("✅ Premium bikes will show first:", premiumBikes.length);
      console.log("✅ Free bikes will show after:", freeBikes.length);
      
      // Debug: Verify final array has both premium and free
      const finalPremiumCount = sortedBikes.filter((b: any) => {
        const isPremium = b.isFeatured === "Approved" || b.isFeatured === true;
        const isVerified = b.paymentStatus === "verified";
        const isPaidAd = b.isPaidAd === true;
        return isPremium || isVerified || isPaidAd;
      }).length;
      const finalFreeCount = sortedBikes.length - finalPremiumCount;
      console.log("✅ Final array - Premium:", finalPremiumCount, "Free:", finalFreeCount);
      
      if (sortedBikes.length === 0) {
        console.warn("⚠️ WARNING: No bikes fetched! Check API endpoint and filters.");
      }
      
      if (freeBikes.length > 0 && finalFreeCount === 0) {
        console.error("❌ ERROR: Free bikes were fetched but not included in final array!");
      }
      
      setBikes(sortedBikes);
    } catch (error) {
      console.error("❌ Error fetching bikes:", error);
      // Set empty array on error to prevent crashes
      setBikes([]);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchBikes();
    setRefreshing(false);
  };

  const applyFilters = () => {
    const bikesList = Array.isArray(bikes) ? bikes : [];
    console.log("🔍 applyFilters: Total bikes before filtering:", bikesList.length);
    console.log("🔍 applyFilters: Filters:", filters);
    console.log("🔍 applyFilters: Search query:", searchQuery);
    
    // IMPORTANT: Separate premium and free bikes BEFORE filtering
    // Premium bikes should always be shown, even if some fields are missing
    // IMPORTANT: Only show bikes with isFeatured === "Approved" as premium
    // Pending bikes (isFeatured === "Pending") should NOT show in premium list
    const premiumBikesBeforeFilter = bikesList.filter((bike: any) => {
      // Only approved & verified premium bikes
      return isPremiumApproved(bike) || isPaymentVerified(bike);
    });
    
    const freeBikesBeforeFilter = bikesList.filter((bike: any) => {
      // Free bikes don't need admin approval - they show directly
      if (isPremiumApproved(bike) || isPaymentVerified(bike)) {
        return false;
      }

      if (isPaidAdPending(bike)) {
        // Pending paid ads should remain hidden until approved
        return false;
      }
      
      return true;
    });
    
    console.log("⭐ Premium bikes before filter:", premiumBikesBeforeFilter.length);
    console.log("🆓 Free bikes before filter:", freeBikesBeforeFilter.length);
    
    // Debug: Log sample free bikes
    if (freeBikesBeforeFilter.length > 0) {
      console.log("🆓 Sample free bikes before filter:", freeBikesBeforeFilter.slice(0, 3).map((b: any) => ({
        id: b._id,
        make: b.make || b.company,
        model: b.model,
        isFeatured: b.isFeatured,
        paymentStatus: b.paymentStatus
      })));
    } else {
      console.warn("⚠️ WARNING: No free bikes found in bikes array!");
    }
    
    // Apply search query to premium bikes (less strict - only search query)
    let premiumFiltered = premiumBikesBeforeFilter;
    if (searchQuery && searchQuery.trim()) {
      const searchLower = searchQuery.toLowerCase().trim();
      premiumFiltered = premiumBikesBeforeFilter.filter((bike: any) => {
        const companyOrMake = (bike.company || bike.make || '').toLowerCase();
        const model = (bike.model || '').toLowerCase();
        const year = (bike.year || '').toString();
        const bikeName = `${companyOrMake} ${model} ${year}`;
        return bikeName.includes(searchLower);
      });
    }
    
    // Apply filtering to free bikes - but only if user has actually set filters
    // Check if any filters are actually active (not default values)
    const hasActiveFilters = 
      (filters.companies.length > 0 && !filters.companies.includes("All Companies")) ||
      (filters.models.length > 0 && !filters.models.includes("All Models")) ||
      (filters.variants.length > 0 && !filters.variants.includes("All Variants")) ||
      (filters.registrationCities.length > 0 && !filters.registrationCities.includes("All Cities")) ||
      (filters.locations.length > 0 && !filters.locations.includes("All Cities")) ||
      (filters.bodyColors.length > 0 && !filters.bodyColors.includes("All Colors")) ||
      (filters.fuelTypes.length > 0 && !filters.fuelTypes.includes("All Fuel Types")) ||
      (filters.engineTypes.length > 0 && !filters.engineTypes.includes("All Engine Types")) ||
      filters.isFeatured ||
      (filters.years.min !== 1970 || filters.years.max !== new Date().getFullYear()) ||
      (filters.engineCapacity.min !== 50 || filters.engineCapacity.max !== 1000) ||
      (filters.kmDriven.min !== 0 || filters.kmDriven.max !== 100000) ||
      (filters.price.min !== 0 || filters.price.max !== 2000000);
    
    // ALWAYS show all free bikes - only apply search if exists
    // Don't filter out free bikes even if filters are active
    let freeFiltered = freeBikesBeforeFilter;
    if (searchQuery && searchQuery.trim()) {
      // Apply simple search to free bikes
      const searchLower = searchQuery.toLowerCase().trim();
      freeFiltered = freeBikesBeforeFilter.filter((bike: any) => {
        const companyOrMake = (bike.company || bike.make || '').toLowerCase();
        const model = (bike.model || '').toLowerCase();
        const year = (bike.year || '').toString();
        const bikeName = `${companyOrMake} ${model} ${year}`;
        return bikeName.includes(searchLower);
      });
    }
    // Note: We don't apply full filtering to free bikes to ensure they always show
    // Premium bikes get priority, but free bikes should always be visible below them
    
    console.log("⭐ Premium bikes after filter (search only):", premiumFiltered.length);
    console.log("🆓 Free bikes after filter (search only):", freeFiltered.length);
    console.log("🆓 Free bikes details:", freeFiltered.slice(0, 5).map((b: any) => ({
      id: b._id,
      make: b.make || b.company,
      model: b.model,
      isFeatured: b.isFeatured,
      paymentStatus: b.paymentStatus,
      isPaidAd: b.isPaidAd
    })));

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

    // CRITICAL: For specific sorts (Price, Year, KM), sort ALL bikes together without premium/free grouping
    // Only for "Relevance" sort, maintain premium/free grouping
    let finalSorted: any[] = [];
    
    if (sortBy === "Relevance") {
      // Apply sorting to premium bikes - ONLY if boost is still active
      premiumFiltered.sort((a: any, b: any) => {
        const aBoostActive = isBoostActive(a);
        const bBoostActive = isBoostActive(b);
        
        // If one has active boost and other doesn't, prioritize the one with active boost
        if (aBoostActive && !bBoostActive) return -1;
        if (!aBoostActive && bBoostActive) return 1;
        
        // If both have active boost or both don't, sort by boost date (most recent first)
        if (aBoostActive && bBoostActive) {
          const boostA = a.boostedAt ? new Date(a.boostedAt).getTime() : 0;
          const boostB = b.boostedAt ? new Date(b.boostedAt).getTime() : 0;
          if (boostA !== boostB) return boostB - boostA;
        }
        
        const aDate = a.dateAdded ? new Date(a.dateAdded).getTime() : 0;
        const bDate = b.dateAdded ? new Date(b.dateAdded).getTime() : 0;
        return bDate - aDate;
      });

      // Apply sorting to free bikes - ONLY if boost is still active
      freeFiltered.sort((a: any, b: any) => {
        const aBoostActive = isBoostActive(a);
        const bBoostActive = isBoostActive(b);
        
        // If one has active boost and other doesn't, prioritize the one with active boost
        if (aBoostActive && !bBoostActive) return -1;
        if (!aBoostActive && bBoostActive) return 1;
        
        // If both have active boost or both don't, sort by boost date (most recent first)
        if (aBoostActive && bBoostActive) {
          const boostA = a.boostedAt ? new Date(a.boostedAt).getTime() : 0;
          const boostB = b.boostedAt ? new Date(b.boostedAt).getTime() : 0;
          if (boostA !== boostB) return boostB - boostA;
        }
        
        const aDate = a.dateAdded ? new Date(a.dateAdded).getTime() : 0;
        const bDate = b.dateAdded ? new Date(b.dateAdded).getTime() : 0;
        return bDate - aDate;
      });

      // Combine: Premium bikes first, then free bikes (maintain order)
      finalSorted = [...premiumFiltered, ...freeFiltered];
      console.log("✅ Combined bikes for Relevance sort - Premium:", premiumFiltered.length, "Free:", freeFiltered.length, "Total:", finalSorted.length);
    } else {
      // For all other sorts, combine first then sort together
      const allBikes = [...premiumFiltered, ...freeFiltered];
      console.log("✅ Combined bikes for other sorts - Premium:", premiumFiltered.length, "Free:", freeFiltered.length, "Total:", allBikes.length);
      
      if (sortBy === "Price: Low to High") {
        allBikes.sort((a, b) => {
          const priceA = a.price && typeof a.price === 'string' ? 
            Number(String(a.price).replace(/[^0-9]/g, "")) : 
            (typeof a.price === 'number' ? a.price : 0);
          const priceB = b.price && typeof b.price === 'string' ? 
            Number(String(b.price).replace(/[^0-9]/g, "")) : 
            (typeof b.price === 'number' ? b.price : 0);
          
          // If both have 0 price, maintain order
          if (priceA === 0 && priceB === 0) return 0;
          if (priceA === 0) return 1; // Put items without price at the end
          if (priceB === 0) return -1; // Put items without price at the end
          
          return priceA - priceB; // Low to High
        });
        
        // Debug: Log first 5 after sorting
        console.log(`💰 After "Price: Low to High" sort, first 5 prices:`, allBikes.slice(0, 5).map((b, i) => {
          const price = b.price && typeof b.price === 'string' ? 
            Number(String(b.price).replace(/[^0-9]/g, "")) : 
            (typeof b.price === 'number' ? b.price : 0);
          return `${i+1}. ${b.make} ${b.model} - PKR ${price.toLocaleString()}`;
        }));
      } else if (sortBy === "Price: High to Low") {
        allBikes.sort((a, b) => {
          const priceA = a.price && typeof a.price === 'string' ? 
            Number(String(a.price).replace(/[^0-9]/g, "")) : 
            (typeof a.price === 'number' ? a.price : 0);
          const priceB = b.price && typeof b.price === 'string' ? 
            Number(String(b.price).replace(/[^0-9]/g, "")) : 
            (typeof b.price === 'number' ? b.price : 0);
          
          // If both have 0 price, maintain order
          if (priceA === 0 && priceB === 0) return 0;
          if (priceA === 0) return 1; // Put items without price at the end
          if (priceB === 0) return -1; // Put items without price at the end
          
          return priceB - priceA; // High to Low
        });
        
        // Debug: Log first 5 after sorting
        console.log(`💰 After "Price: High to Low" sort, first 5 prices:`, allBikes.slice(0, 5).map((b, i) => {
          const price = b.price && typeof b.price === 'string' ? 
            Number(String(b.price).replace(/[^0-9]/g, "")) : 
            (typeof b.price === 'number' ? b.price : 0);
          return `${i+1}. ${b.make} ${b.model} - PKR ${price.toLocaleString()}`;
        }));
      } else if (sortBy === "Year: Newest First") {
        allBikes.sort((a, b) => Number(b.year) - Number(a.year));
      } else if (sortBy === "Year: Oldest First") {
        allBikes.sort((a, b) => Number(a.year) - Number(b.year));
      } else if (sortBy === "Newest to Oldest") {
        // Sort by dateAdded - newest first (most recent date first)
        allBikes.sort((a, b) => {
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
          
          // Newest first (higher timestamp first)
          // If both have 0 timestamp, maintain order
          if (timeA === 0 && timeB === 0) return 0;
          if (timeA === 0) return 1; // Put items without date at the end
          if (timeB === 0) return -1; // Put items without date at the end
          
          return timeB - timeA;
        });
        
        // Debug: Log first 5 after sorting
        console.log(`📅 After "Newest to Oldest" sort, first 5 dates:`, allBikes.slice(0, 5).map((b, i) => {
          const date = b?.approvedAt || b?.dateAdded || b?.createdAt || b?.updatedAt;
          return `${i+1}. ${b.make} ${b.model} - ${date ? new Date(date).toLocaleDateString() : 'No date'} (${date ? new Date(date).getTime() : 0})`;
        }));
      } else if (sortBy === "Oldest to Newest") {
        // Sort by dateAdded - oldest first (oldest date first)
        allBikes.sort((a, b) => {
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
        console.log(`📅 After "Oldest to Newest" sort, first 5 dates:`, allBikes.slice(0, 5).map((b, i) => {
          const date = b?.approvedAt || b?.dateAdded || b?.createdAt || b?.updatedAt;
          return `${i+1}. ${b.make} ${b.model} - ${date ? new Date(date).toLocaleDateString() : 'No date'} (${date ? new Date(date).getTime() : 0})`;
        }));
      } else if (sortBy === "KM: Lowest First") {
        allBikes.sort((a, b) => (Number(a.kmDriven) || 0) - (Number(b.kmDriven) || 0));
      } else if (sortBy === "KM: Highest First") {
        allBikes.sort((a, b) => (Number(b.kmDriven) || 0) - (Number(a.kmDriven) || 0));
      }
      
      finalSorted = allBikes;
    }
    
    if (sortBy === "Relevance") {
      console.log("✅ Final sorted bikes - Premium first:", premiumFiltered.length, "Free:", freeFiltered.length);
    } else {
      console.log(`✅ Final sorted bikes by ${sortBy}:`, finalSorted.length);
    }
    
    // Debug: Verify final array has both premium and free bikes
    const finalPremiumInFiltered = finalSorted.filter((b: any) => {
      const isPremium = b.isFeatured === "Approved" || b.isFeatured === true;
      const isVerified = b.paymentStatus === "verified";
      const isPaidAd = b.isPaidAd === true;
      return isPremium || isVerified || isPaidAd;
    }).length;
    const finalFreeInFiltered = finalSorted.length - finalPremiumInFiltered;
    console.log("✅ Final filtered array - Premium:", finalPremiumInFiltered, "Free:", finalFreeInFiltered);
    console.log("✅ Premium bikes array:", premiumFiltered.length);
    console.log("✅ Free bikes array:", freeFiltered.length);
    
    if (freeFiltered.length > 0 && finalFreeInFiltered === 0) {
      console.error("❌ ERROR: Free bikes were filtered but not included in final array!");
      console.error("❌ PremiumFiltered:", premiumFiltered.length, "FreeFiltered:", freeFiltered.length);
      console.error("❌ FinalSorted length:", finalSorted.length);
    }

    setFilteredBikes(finalSorted);
  };

  const handleApplyFilters = (newFilters: FilterState) => {
    setFilters(newFilters);
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.companies.length > 0 && !filters.companies.includes("All Companies")) count++;
    if (filters.models.length > 0 && !filters.models.includes("All Models")) count++;
    if (filters.variants.length > 0 && !filters.variants.includes("All Variants")) count++;
    if (filters.registrationCities.length > 0 && !filters.registrationCities.includes("All Cities")) count++;
    if (filters.locations.length > 0 && !filters.locations.includes("All Cities")) count++;
    if (filters.bodyColors.length > 0 && !filters.bodyColors.includes("All Colors")) count++;
    if (filters.fuelTypes.length > 0 && !filters.fuelTypes.includes("All Fuel Types")) count++;
    if (filters.engineTypes.length > 0 && !filters.engineTypes.includes("All Engine Types")) count++;
    if (filters.isFeatured) count++;
    if (filters.years.min !== 1970 || filters.years.max !== new Date().getFullYear()) count++;
    if (filters.engineCapacity.min !== 50 || filters.engineCapacity.max !== 1000) count++;
    if (filters.kmDriven.min !== 0 || filters.kmDriven.max !== 100000) count++;
    if (filters.price.min !== 0 || filters.price.max !== 2000000) count++;
    return count;
  };

  const renderBikeCard = ({ item }: { item: any }) => {
    console.log("Bike item data:", item);
    return (
      <BikeCard
        bike={item}
        onPress={() => {
          console.log("Navigating to BikeDetails with item:", item);
          // Images are preloaded in BikeCard component before navigation
          navigation.navigate("BikeDetails", { carDetails: item });
        }}
        userId={userData?.userId}
        showPremiumTag={isPremiumApproved(item)}
      />
    );
  };

  const renderHeader = () => (
    <View style={styles.header}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={25} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchBar}
          placeholder="e.g.  Honda CD 70 ..."
          placeholderTextColor="#888"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Filter Options - Horizontal Scrollable */}
      <View style={styles.filtersWrapper}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          contentContainerStyle={styles.filterScroll}
        >
          {/* Filters Icon */}
          <TouchableOpacity 
            style={styles.filterItem} 
            onPress={() => setFilterModalVisible(true)}
          >
            <Ionicons name="filter" size={20} color="#CD0100" />
            <Text style={styles.filterText}> Filters</Text>
            {getActiveFiltersCount() > 0 && (
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>{getActiveFiltersCount()}</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Quick Filter Buttons */}
          {["Price", "Year", "Kilometer"].map((filter, index) => (
            <TouchableOpacity 
              key={index} 
              style={styles.filterBox} 
              onPress={() => {
                if (filter === "Price") setPriceModalVisible(true);
                if (filter === "Year") setYearModalVisible(true);
                if (filter === "Kilometer") setKilometerModalVisible(true);
              }}
            >
              <Text style={styles.filterText}>
                {filter} <FontAwesome name="angle-down" size={18} color="black" />
              </Text>
            </TouchableOpacity>
          ))}

          {/* All Filters & Reset */}
          <TouchableOpacity 
            style={styles.allFiltersContainer} 
            onPress={() => setFilterModalVisible(true)}
          >
            <Text style={styles.allFiltersText}>
              <Text style={styles.boldText}>All Filters</Text>
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.allFiltersContainer} 
            onPress={() => {
              // Reset all filters
              setFilters({
                companies: [],
                models: [],
                variants: [],
                years: { min: 1970, max: new Date().getFullYear() },
                registrationCities: [],
                locations: [],
                engineCapacity: { min: 50, max: 1000 },
                bodyColors: [],
                kmDriven: { min: 0, max: 100000 },
                price: { min: 0, max: 2000000 },
                fuelTypes: [],
                engineTypes: [],
                isFeatured: false,
              });
              setMinPrice(0);
              setMaxPrice(2000000);
              setMinYear(1970);
              setMaxYear(new Date().getFullYear());
              setMinMileage(0);
              setMaxMileage(100000);
              setSearchQuery("");
            }}
          >
            <Text style={styles.allFiltersText}>
              <Text style={styles.boldText}>Reset</Text>
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Separator Line */}
      <View style={styles.separatorLine} />

      {/* Sort Container - Results Count & Sort Button */}
      <View style={styles.sortContainer}>
        <Text style={styles.resultsText}>{filteredBikes.length} results</Text>
        <TouchableOpacity style={styles.sortButton} onPress={() => setShowSortModal(true)}>
          <Text style={styles.sortButtonText}>Sort: {sortBy}</Text>
          <Ionicons name="chevron-down" size={16} color={COLORS.primary} />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderSortModal = () => {
    const sortOptions = [
      "Relevance",
      "Price: Low to High",
      "Price: High to Low",
      "Newest to Oldest",
      "Oldest to Newest",
      "Year: Newest First",
      "Year: Oldest First",
      "KM: Lowest First",
      "KM: Highest First",
    ];
    
    return (
      <Modal visible={showSortModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.sortModalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Sort By</Text>
              <TouchableOpacity onPress={() => setShowSortModal(false)}>
                <Ionicons name="close" size={24} color={COLORS.black} />
              </TouchableOpacity>
            </View>

            {sortOptions.map((option) => (
              <TouchableOpacity
                key={option}
                style={[
                  styles.modalOption,
                  sortBy === option && styles.selectedModalOption
                ]}
                onPress={() => {
                  setSortBy(option);
                  setShowSortModal(false);
                }}
              >
                <Text style={styles.modalOptionText}>{option}</Text>
                {sortBy === option && (
                  <Ionicons name="checkmark" size={20} color={COLORS.primary} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <View style={styles.container}>
      {renderHeader()}
      
      {loading ? (
        <FlatList
          data={[1, 2, 3, 4, 5, 6]}
          renderItem={() => <BikeCardSkeleton />}
          keyExtractor={(item, index) => `skeleton-${index}`}
          showsVerticalScrollIndicator={false}
        />
      ) : (
      
      <FlatList
        data={filteredBikes}
        renderItem={({ item, index }) => {
          return (
            <>
              <BikeCard
                bike={item}
                onPress={() => {
                  console.log("Navigating to BikeDetails with item:", item);
                  // CRITICAL: Ensure images array is included in carDetails
                  const carDetails = {
                    ...item,
                    // Ensure images array is properly set
                    images: item.images || []
                  };
                  // Images are preloaded in BikeCard component before navigation
                  navigation.navigate("BikeDetails", { carDetails });
                }}
                userId={userData?.userId}
                showPremiumTag={isPremiumApproved(item)}
              />
              
              {/* Insert promotional cards after every 4 bikes */}
              {(index + 1) % 4 === 0 && (
                <>
                  {/* After 4th, 12th, 20th, etc. - Show Car Inspection */}
                  {((index + 1) / 4) % 2 === 1 && (
                    <CarInspectionCard />
                  )}
                  {/* After 8th, 16th, 24th, etc. - Show List it for Me */}
                  {((index + 1) / 4) % 2 === 0 && (index + 1) % 8 === 0 && (
                    <ListItForMeCard />
                  )}
                </>
              )}
            </>
          );
        }}
        keyExtractor={(item, index) => {
          try {
            const id = item._id;
            if (id != null && typeof id === 'string' && id !== '[object Object]' && id.length > 5) return `bike-${id}-${index}`;
            if (id != null && typeof id === 'object' && id.toString && typeof id.toString === 'function') {
              const s = String(id.toString());
              if (s && s !== '[object Object]' && s.length > 5) return `bike-${s}-${index}`;
            }
            return `bike-${index}`;
          } catch (_) {
            return `bike-${index}`;
          }
        }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="bicycle-outline" size={80} color="#ccc" />
            <Text style={styles.emptyText}>No used bikes found</Text>
            <Text style={styles.emptySubtext}>
              Try adjusting your filters or search terms
            </Text>
          </View>
        }
        contentContainerStyle={styles.listContent}
      />
      )}

      {renderSortModal()}

      <BikeFilterModal
        visible={filterModalVisible}
        onClose={() => setFilterModalVisible(false)}
        onApplyFilters={handleApplyFilters}
      />
      
      <PriceFilterModal
        isVisible={priceModalVisible}
        onClose={() => setPriceModalVisible(false)}
        minPrice={minPrice}
        maxPrice={maxPrice}
        setMinPrice={setMinPrice}
        setMaxPrice={setMaxPrice}
      />
      
      <YearFilterModal 
        isVisible={yearModalVisible} 
        onClose={() => setYearModalVisible(false)} 
        minYear={minYear}
        maxYear={maxYear}
        setMinYear={setMinYear}
        setMaxYear={setMaxYear}
      />
      
      <KilometerRangeModal 
        isVisible={kilometerModalVisible} 
        onClose={() => setKilometerModalVisible(false)} 
        minMileage={minMileage}
        maxMileage={maxMileage}
        setMinMileage={setMinMileage}
        setMaxMileage={setMaxMileage}
      />
    </View>
  );
};

const styles = createResponsiveStyleSheet({
  container: {
    flex: 1,
    backgroundColor: "#f8f8f8",
    padding: 10,
    marginTop: 40,
  },
  listContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  header: {
    backgroundColor: "#fff",
    paddingHorizontal: isTablet ? 20 : 15,
    paddingTop: 10,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 8,
    paddingHorizontal: 20,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  searchIcon: {
    marginRight: 8,
  },
  searchBar: {
    flex: 1,
    height: 50,
    color: "#333",
  },
  filtersWrapper: {
    flexDirection: "row",
    alignItems: "center",
    height: 50,
    marginBottom: 10,
    paddingHorizontal: isTablet ? 20 : 15,
  },
  filterScroll: {
    alignItems: "center",
  },
  filterItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 15,
    paddingHorizontal: 10,
    position: "relative",
  },
  filterBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
    height: 40,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 15,
    backgroundColor: "#fff",
    marginRight: 10,
  },
  allFiltersContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 10,
  },
  allFiltersText: {
    fontSize: 14,
    color: "#333",
  },
  filterText: {
    fontSize: 14,
    color: "#333",
  },
  boldText: {
    fontWeight: "bold",
  },
  separatorLine: {
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    marginBottom: 0,
  },
  sortContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: isTablet ? 20 : 15,
    paddingVertical: 12,
    backgroundColor: COLORS.background || "#f8f9fa",
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray || "#e0e0e0",
  },
  sortBar: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingHorizontal: isTablet ? 20 : 15,
    marginBottom: 10,
    alignItems: "center",
  },
  filterBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
    alignItems: "center",
  },
  filterButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#CD0100",
    borderRadius: isTablet ? 10 : 8,
    paddingHorizontal: isTablet ? 20 : 15,
    paddingVertical: isTablet ? 12 : 8,
    position: "relative",
    minHeight: isTablet ? 45 : 40,
  },
  filterButtonText: {
    color: "#CD0100",
    fontSize: isTablet ? 16 : 14,
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
  },
  sortButtonText: {
    fontSize: 14,
    color: COLORS.primary || "#CD0100",
    marginRight: 4,
  },
  resultsText: {
    fontSize: 14,
    color: COLORS.darkGray || "#666",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: isTablet ? 80 : 50,
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: isTablet ? 22 : 18,
    fontWeight: "600",
    color: "#666",
    marginTop: 15,
    textAlign: "center",
  },
  emptySubtext: {
    fontSize: isTablet ? 16 : 14,
    color: "#999",
    marginTop: 5,
    textAlign: "center",
    lineHeight: isTablet ? 24 : 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  sortModalContent: {
    backgroundColor: 'white',
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    width: '100%',
    height: '30%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderColor: '#ccc',
  },
  selectedModalOption: {
    backgroundColor: '#f2f2f2',
  },
  modalOptionText: {
    fontSize: 16,
  },
});

export default BikeListScreen;