import React, { useEffect, useState, useLayoutEffect } from "react";
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
import { useFocusEffect } from "@react-navigation/native";
import CarCard from "../../Components/CarCard";
import FilterModal from "../../Components/Models/FilterModal";
import PriceFilterModal from "../../Components/Models/PriceFilterModal";
import YearFilterModal from "../../Components/Models/YearFilterModal";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import KilometerRangeModal from "../../Components/Models/KilometerRangeModal";
import { API_URL } from "../../../config";
import { apiFetch, safeApiCall } from "../../utils/apiUtils";
import { COLORS } from "../../constants/colors";
import CarCardSkeleton from "../../Components/Commons/CarCardSkeleton";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { filterCarsSafely, isAdValidForPublicListing } from "../../utils/safeFiltering";
import CarInspectionCard from "../../Components/PromotionalCards/CarInspectionCard";
import ListItForMeCard from "../../Components/PromotionalCards/ListItForMeCard";
import PremiumAdServiceCard from "../../Components/PromotionalCards/PremiumAdServiceCard";
import CarOnRentCard from "../../Components/PromotionalCards/CarOnRentCard";
import { rf, rp, createResponsiveStyleSheet, isAndroid } from "../../utils/responsive";

type CarListScreenProps = NativeStackScreenProps<any, "CarListScreen">;

// Cache last used cars so list shows instantly when reopening Used Cars
let cachedUsedCars: any[] = [];

const CarListScreen: React.FC<CarListScreenProps> = ({ navigation, route }) => {
  const [loading, setLoading] = useState(cachedUsedCars.length === 0);
  const [refreshing, setRefreshing] = useState(false);
  const [cars, setCars] = useState<any[]>(cachedUsedCars);
  const [showSortModal, setShowSortModal] = useState(false);
  const [sortBy, setSortBy] = useState("Relevance");
  const [modalVisible, setModalVisible] = useState(false);
  const [priceModalVisible, setPriceModalVisible] = useState(false);
  const [yearModalVisible, setYearModalVisible] = useState(false);
  const [kilometerModalVisible, setKilometerModalVisible] = useState(false);
  const [userData, setUserData] = useState<any>(null);

  // Ensure bottom tab bar is visible on this screen
  useLayoutEffect(() => {
    const parent = navigation.getParent();
    if (parent) {
      parent.setOptions({
        tabBarStyle: {
          display: 'flex',
        },
      });
    }

    // Cleanup: restore default when leaving
    return () => {
      if (parent) {
        parent.setOptions({
          tabBarStyle: {
            display: 'flex',
          },
        });
      }
    };
  }, [navigation]);

    useEffect(() => {
      const fetchUserData = async () => {
        try {
          const storedUserData = await AsyncStorage.getItem('user');
          if (storedUserData) {
            const parsedData = JSON.parse(storedUserData);
            console.log("Fetched User ID:", parsedData.userId);
            setUserData(parsedData);
          } else {
            console.log("No user data found in AsyncStorage.");
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
        }
        // Don't set loading to false here - let fetchCars handle it
      };
    
      fetchUserData();
    }, []);
  const { 
    searchQuery: routeSearchQuery = "", 
    selectedCity = "All Cities",
    filterType,
    filterValue 
  } = route.params || {};
  const [searchQuery, setSearchQuery] = useState(routeSearchQuery);
  // Parse budget range function
  const parseBudgetRange = (budgetLabel: string) => {
    const budgetMap: { [key: string]: { min: number; max: number } } = {
      "Under 5 Lakh": { min: 0, max: 500000 },
      "5-10 Lakh": { min: 500000, max: 1000000 },
      "10-15 Lakh": { min: 1000000, max: 1500000 },
      "15-20 Lakh": { min: 1500000, max: 2000000 },
      "20-30 Lakh": { min: 2000000, max: 3000000 },
      "30-50 Lakh": { min: 3000000, max: 5000000 },
      "50 Lakh+": { min: 5000000, max: 50000000 },
    };
    return budgetMap[budgetLabel] || { min: 0, max: 50000000 };
  };

  // Map category to transmission
  const mapCategoryToTransmission = (category: string) => {
    if (category === "Automatic Cars") return ["Automatic"];
    return [];
  };

  // Get initial filters based on route params
  const getInitialFilters = () => {
    const baseFilters = {
      brands: [] as string[],
      models: [] as string[],
      variants: [] as string[],
      years: { min: 1970, max: new Date().getFullYear() },
      registrationCities: selectedCity === "All Cities" ? [] : [selectedCity],
      locations: selectedCity === "All Cities" ? [] : [selectedCity],
      bodyColors: [] as string[],
      kmDriven: { min: 0, max: 500000 },
      price: { min: 0, max: 50000000 },
      fuelTypes: [] as string[],
      engineCapacity: { min: 0, max: 6000 },
      transmissions: [] as string[],
      assemblies: [] as string[],
      bodyTypes: [] as string[],
      isCertified: false,
      isFeatured: false,
      isSaleItForMe: false,
      categories: [] as string[],
    };

    if (!filterType || !filterValue) return baseFilters;

    console.log(`🎯 Applying filter: ${filterType} = ${filterValue}`);

    switch (filterType) {
      case "brand":
        return { ...baseFilters, brands: [filterValue] };
      case "model":
        return { ...baseFilters, models: [filterValue] };
      case "bodyType":
        return { ...baseFilters, bodyTypes: [filterValue] };
      case "city":
        return { 
          ...baseFilters, 
          locations: [filterValue],
          registrationCities: [filterValue]
        };
      case "budget":
        const budgetRange = parseBudgetRange(filterValue);
        return { ...baseFilters, price: budgetRange };
      case "category":
        if (filterValue === "Automatic Cars") {
          return { 
            ...baseFilters, 
            categories: [filterValue],
            transmissions: ["Automatic"]
          };
        } else if (filterValue === "Family Cars") {
          return { 
            ...baseFilters, 
            categories: [filterValue],
            bodyTypes: ["Sedan", "SUV", "Hatchback"]
          };
        } else if (filterValue === "Imported Cars") {
          return { 
            ...baseFilters, 
            categories: [filterValue],
            assemblies: ["Imported"]
          };
        } else if (filterValue === "Japanese Cars") {
          return { 
            ...baseFilters, 
            categories: [filterValue],
            brands: ["Toyota", "Honda", "Nissan", "Mazda", "Suzuki", "Mitsubishi"]
          };
        } else if (filterValue === "Low Price Cars") {
          return { 
            ...baseFilters, 
            categories: [filterValue],
            price: { min: 0, max: 1000000 }
          };
        } else if (filterValue === "Urgent Sale") {
          return { 
            ...baseFilters, 
            categories: [filterValue],
            isSaleItForMe: true
          };
        } else if (filterValue === "Electric Cars") {
          return { 
            ...baseFilters, 
            categories: [filterValue],
            fuelTypes: ["Electric"]
          };
        } else if (filterValue === "Sports Cars") {
          return { 
            ...baseFilters, 
            categories: [filterValue],
            bodyTypes: ["Coupe", "Convertible"]
          };
        } else if (filterValue === "Low Mileage") {
          return { 
            ...baseFilters, 
            categories: [filterValue],
            kmDriven: { min: 0, max: 50000 }
          };
        } else if (filterValue === "Old Cars") {
          return { 
            ...baseFilters, 
            categories: [filterValue],
            years: { min: 1970, max: 2015 }
          };
        } else if (filterValue === "5 Seater") {
          return { 
            ...baseFilters, 
            categories: [filterValue],
            bodyTypes: ["Sedan", "SUV"]
          };
        } else if (filterValue === "4 Seater") {
          return { 
            ...baseFilters, 
            categories: [filterValue],
            bodyTypes: ["Hatchback", "Coupe"]
          };
        }
        return { ...baseFilters, categories: [filterValue] };
      default:
        return baseFilters;
    }
  };

  const [selectedFilters, setSelectedFilters] = useState(getInitialFilters());

  // Reset filters/search when route params change (important: avoid "empty" list due to old filters)
  useEffect(() => {
    try {
      console.log(`🔄 CarListScreen: applying route params`, {
        routeSearchQuery,
        selectedCity,
        filterType,
        filterValue,
        category: route?.params?.category,
        title: route?.params?.title,
      });
    } catch (_) {}
    setSearchQuery(routeSearchQuery || "");
    setSelectedFilters(getInitialFilters());
  }, [routeSearchQuery, selectedCity, filterType, filterValue]);

  // Safe filter update function
  const updateFilters = (newFilters: any) => {
    setSelectedFilters({
      brands: newFilters.brands || [],
      models: newFilters.models || [],
      variants: newFilters.variants || [],
      years: newFilters.years || { min: 1970, max: new Date().getFullYear() },
      registrationCities: newFilters.registrationCities || [],
      locations: newFilters.locations || [],
      bodyColors: newFilters.bodyColors || [],
      kmDriven: newFilters.kmDriven || { min: 0, max: 500000 },
      price: newFilters.price || { min: 0, max: 50000000 },
      fuelTypes: newFilters.fuelTypes || [],
      engineCapacity: newFilters.engineCapacity || { min: 0, max: 6000 },
      transmissions: newFilters.transmissions || [],
      assemblies: newFilters.assemblies || [],
      bodyTypes: newFilters.bodyTypes || [],
      isCertified: newFilters.isCertified || false,
      isFeatured: newFilters.isFeatured || false,
      isSaleItForMe: newFilters.isSaleItForMe || false,
      categories: newFilters.categories || [],
    });
  };  
  const sortOptions = [
    "Relevance",
    "Price: Low to High",
    "Price: High to Low",
    "Newest to Oldest",
    "Oldest to Newest"
  ];

  
  
  const engineOptions = [
    { label: "0 - 499 cc", min: 0, max: 499 },
    { label: "500 - 999 cc", min: 500, max: 999 },
    { label: "1000 - 1499 cc", min: 1000, max: 1499 },
    { label: "1500 - 1999 cc", min: 1500, max: 1999 },
    { label: "2000 - 2499 cc", min: 2000, max: 2499 },
    { label: "2500 - 2999 cc", min: 2500, max: 2999 },
    { label: "3000 - 3499 cc", min: 3000, max: 3499 },
    { label: "3500 - 3999 cc", min: 3500, max: 3999 },
    { label: "4000+ cc", min: 4000, max: Infinity },
  ];  
  const [minPrice, setMinPrice] = useState<number>(0);
  const [maxPrice, setMaxPrice] = useState<number>(1000000000);  
  const [minYear, setMinYear] = useState<number>(1970);
  const [maxYear, setMaxYear] = useState<number>(new Date().getFullYear());
  const [minMileage, setMinMileage] = useState<number>(0); // Add minMileage
  const [maxMileage, setMaxMileage] = useState<number>(200000);
  
  // Ensure cars is always an array to prevent "cars.filter is not a function"
  const carsList = Array.isArray(cars) ? cars : [];
  // Debug: Log filters and cars
  console.log(`🎯 CarListScreen - Total cars in state: ${carsList.length}`);
  const managedInState = carsList.filter(c => c.modelType === "ListItForYou");
  console.log(`🛡️ Managed cars in state: ${managedInState.length}`);
  console.log("🎯 Active filters:", selectedFilters);
  
  // Use safe filtering to prevent undefined errors
  const filteredCars = filterCarsSafely(carsList, selectedFilters, searchQuery);
  
  const managedAfterFilter = filteredCars.filter(c => c.modelType === "ListItForYou");
  console.log(`🛡️ Managed cars after filter: ${managedAfterFilter.length}`);
  
  if (managedInState.length !== managedAfterFilter.length) {
    console.warn(`⚠️ ${managedInState.length - managedAfterFilter.length} managed car(s) filtered out!`);
  }
  
  const sortedCars = [...filteredCars].sort((a, b) => {
    // CRITICAL: For specific sorts, apply ONLY that sort logic, no boost/priority interference
    if (sortBy === "Price: Low to High") {
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
    }
    
    if (sortBy === "Price: High to Low") {
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
    }
    
    if (sortBy === "Newest to Oldest") {
      // Sort by dateAdded - newest first
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
      
      // If both have 0 timestamp, maintain order
      if (timeA === 0 && timeB === 0) return 0;
      if (timeA === 0) return 1; // Put items without date at the end
      if (timeB === 0) return -1; // Put items without date at the end
      
      return timeB - timeA; // Newest first (higher timestamp first)
    }
    
    if (sortBy === "Oldest to Newest") {
      // Sort by dateAdded - oldest first
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
      
      // If both have 0 timestamp, maintain order
      if (timeA === 0 && timeB === 0) return 0;
      if (timeA === 0) return 1; // Put items without date at the end
      if (timeB === 0) return -1; // Put items without date at the end
      
      return timeA - timeB; // Oldest first (lower timestamp first)
    }
    
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

    // For Relevance sort: Sort by DATE first (newest first), then BOOSTED as tiebreaker
    if (sortBy === "Relevance") {
      const prioA = a._priority || 999;
      const prioB = b._priority || 999;
      if (prioA !== prioB) return prioA - prioB;
      
      // ✅ Sort by DATE first (newest first) - Latest ads naturally go to TOP
      const dateA = a?.approvedAt || a?.dateAdded || 0;
      const dateB = b?.approvedAt || b?.dateAdded || 0;
      const timeA = dateA ? new Date(dateA).getTime() : 0;
      const timeB = dateB ? new Date(dateB).getTime() : 0;
      
      // Sort by date first (newest first) - this puts latest ads on top
      if (timeA !== timeB) {
        return timeB - timeA; // Newest first
      }
      
      // If dates are same or very close, boosted ads get priority
      const aIsBoosted = isBoostActive(a) || !!(a.boostedAt || a.isBoosted);
      const bIsBoosted = isBoostActive(b) || !!(b.boostedAt || b.isBoosted);
      
      if (aIsBoosted && !bIsBoosted) return -1; // Boosted above non-boosted
      if (!aIsBoosted && bIsBoosted) return 1; // Non-boosted below boosted
      
      // If both are boosted, sort by boostedAt (newest boost first)
      if (aIsBoosted && bIsBoosted) {
        const aBoostDate = a.boostedAt ? new Date(a.boostedAt).getTime() : 0;
        const bBoostDate = b.boostedAt ? new Date(b.boostedAt).getTime() : 0;
        if (aBoostDate !== bBoostDate) return bBoostDate - aBoostDate; // Newest boost first
      }
      
      return 0; // Same date and same boost status
    }
    
    return 0;
  });
  // Reusable fetch function
  const fetchCars = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true); // Keep loading true until data is fetched
      }
      
      console.log("🚗 Fetching all used cars from /all_ads...");
      console.log("🔗 API URL:", API_URL);
      console.log("🔗 Full URL:", `${API_URL}/all_ads`);
      
      // Use safeApiCall for automatic retry and better error handling
      const timestamp = new Date().getTime();
      console.log("📡 Sending request to:", `${API_URL}/all_ads?_t=${timestamp}`);
      
      const result = await safeApiCall<any[]>(`${API_URL}/all_ads?_t=${timestamp}`, {
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
          'Accept': 'application/json'
        }
      }, 2); // 2 retries for car list
      
      if (!result.success || !result.data) {
        console.error("❌ Failed to fetch cars:", result.error);
        throw new Error(result.error || 'Failed to fetch cars');
      }
      
      const data = result.data;
      console.log("✅ Data received successfully, length:", Array.isArray(data) ? data.length : 'not array');
      
      console.log(`📦 Received ${data.length} total ads`);
      
      // Debug: Count free_ads immediately after receiving data
      const rawFreeAdsCount = Array.isArray(data) ? data.filter((ad: any) => ad.adSource === "free_ads" || ad.modelType === "Free").length : 0;
      console.log(`🆓 IMMEDIATE CHECK: ${rawFreeAdsCount} free_ads in raw response`);
      if (rawFreeAdsCount > 0) {
        const sampleFreeAd = Array.isArray(data) ? data.find((ad: any) => ad.adSource === "free_ads" || ad.modelType === "Free") : null;
        if (sampleFreeAd) {
          console.log(`🆓 Sample free ad from raw response:`, {
            _id: sampleFreeAd._id,
            make: sampleFreeAd.make,
            model: sampleFreeAd.model,
            adSource: sampleFreeAd.adSource,
            modelType: sampleFreeAd.modelType,
            isActive: sampleFreeAd.isActive,
            isDeleted: sampleFreeAd.isDeleted
          });
        }
      }
      
      // Normalize IDs and userId in data - convert object IDs to strings and clean empty userId objects
      const normalizedData = (Array.isArray(data) ? data : []).map((ad: any) => {
        const normalized: any = { ...ad };
        
        // Normalize _id
        if (ad._id && typeof ad._id === 'object') {
          // Convert object ID to string
          let safeId: string;
          try {
            if (ad._id.toString && typeof ad._id.toString === 'function') {
              const str = ad._id.toString();
              if (str && str !== '[object Object]' && str.length > 10 && !str.includes('[object')) {
                safeId = str;
              } else if (ad._id._id) {
                safeId = String(ad._id._id);
              } else if (ad._id.$oid) {
                safeId = String(ad._id.$oid);
              } else {
                safeId = String(ad._id);
              }
            } else {
              safeId = ad._id._id ? String(ad._id._id) : (ad._id.$oid ? String(ad._id.$oid) : String(ad._id));
            }
            normalized._id = safeId;
            normalized.id = safeId;
          } catch (e) {
            console.warn('⚠️ Error normalizing ID:', e);
          }
        } else if (!ad.id && ad._id) {
          normalized.id = typeof ad._id === 'string' ? ad._id : String(ad._id);
        }
        
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
        
        normalized.userId = normalizedUserId;
        normalized.sellerId = normalizedUserId; // Also set sellerId for consistency
        
        return normalized;
      });
      
      // Debug: Count free ads BEFORE filtering
      const rawFreeAds = normalizedData.filter((ad: any) => ad.adSource === "free_ads" || ad.modelType === "Free");
      console.log(`🆓 Raw free ads from backend: ${rawFreeAds.length}`);
      
      // Debug: Count active vs inactive free ads
      const activeFreeAds = rawFreeAds.filter((ad: any) => ad.isActive === true);
      const inactiveFreeAds = rawFreeAds.filter((ad: any) => ad.isActive !== true);
      console.log(`🆓 Free ads breakdown: ${activeFreeAds.length} active, ${inactiveFreeAds.length} inactive`);
      
      if (activeFreeAds.length > 0) {
        console.log(`✅ Active free ads (will show):`, activeFreeAds.slice(0, 5).map((ad: any) => ({
          id: ad._id,
          make: ad.make,
          model: ad.model,
          isActive: ad.isActive,
          adSource: ad.adSource,
          modelType: ad.modelType
        })));
      }
      
      if (inactiveFreeAds.length > 0) {
        console.log(`🚫 Inactive free ads (will be filtered):`, inactiveFreeAds.slice(0, 5).map((ad: any) => ({
          id: ad._id,
          make: ad.make,
          model: ad.model,
          isActive: ad.isActive,
          adSource: ad.adSource,
          modelType: ad.modelType
        })));
      }
      
      if (rawFreeAds.length > 0) {
        console.log(`🆓 Sample free ad:`, {
          id: rawFreeAds[0]._id,
          make: rawFreeAds[0].make,
          model: rawFreeAds[0].model,
          adSource: rawFreeAds[0].adSource,
          modelType: rawFreeAds[0].modelType,
          isActive: rawFreeAds[0].isActive,
          isDeleted: rawFreeAds[0].isDeleted,
          isValid: isAdValidForPublicListing(rawFreeAds[0])
        });
      }
      
      // Filter only car ads (not bikes) and exclude rejected/inactive/expired ads
      const carAdsRaw = normalizedData.filter((ad: any) => {
        // Must be a car ad type
        const isCarAd = ad.modelType === "ListItForYou" || 
                        ad.modelType === "Featured" || 
                        ad.modelType === "Free" ||
                        ad.adSource === "featured_ads" || // Also check adSource for premium cars
                        ad.adSource === "free_ads" ||
                        ad.adSource === "list_it_for_you_ad";
        
        if (!isCarAd) {
          // Debug: Log non-car ads that might be free
          if (ad.adSource === "free_ads" || ad.modelType === "Free") {
            console.log(`🚫 Free ad filtered (not car ad): ${ad.make} ${ad.model} - adSource: ${ad.adSource}, modelType: ${ad.modelType}`);
          }
          return false;
        }
        
        // ✅ Use unified validation: checks active, not deleted, not rejected, not expired
        const isValid = isAdValidForPublicListing(ad);
        if (!isValid) {
          // Debug: Log free ads that fail validation
          if (ad.adSource === "free_ads" || ad.modelType === "Free") {
            console.log(`🚫 Free ad filtered (validation failed): ${ad.make} ${ad.model} - isActive: ${ad.isActive}, isDeleted: ${ad.isDeleted}, isFeatured: ${ad.isFeatured}, adStatus: ${ad.adStatus}, paymentStatus: ${ad.paymentStatus}`);
          }
          return false;
        }
        
        // Debug: Log free ads that pass
        if (ad.adSource === "free_ads" || ad.modelType === "Free") {
          console.log(`✅ Free ad PASSED validation: ${ad.make} ${ad.model} - isActive: ${ad.isActive}, will show in Used Cars`);
        }
        
        return true;
      });
      
      // Debug: Count free ads after filtering
      const freeAdsAfterFilter = carAdsRaw.filter((ad: any) => ad.adSource === "free_ads" || ad.modelType === "Free");
      console.log(`🆓 Free ads after carAdsRaw filter: ${freeAdsAfterFilter.length} (from ${rawFreeAds.length} raw free ads)`);

      // Normalize type + add priority so ordering is stable: Managed (1) → Premium (2) → Free (3)
      // FIXED: Check adSource FIRST to override incorrect modelType from backend
      const carAds = carAdsRaw.map((ad: any) => {
        let priority = 3;
        let finalModelType = "Free";
        
        // Priority 1: Managed by AutoFinder (check adSource first)
        if (ad.adSource === "list_it_for_you_ad" || ad.isManaged === true || ad.modelType === "ListItForYou") {
          priority = 1;
          finalModelType = "ListItForYou";
        }
        // Priority 2: Premium/Featured (check adSource first, but NOT if it's free_ads)
        else if (ad.adSource === "featured_ads" && ad.adSource !== "free_ads") {
          priority = 2;
          finalModelType = "Featured";
        }
        // Priority 2: Premium by modelType (but only if NOT free_ads)
        else if (
          (ad.modelType === "Featured" || ad.isFeatured === "Approved" || ad.isFeatured === true) &&
          ad.adSource !== "free_ads"
        ) {
          priority = 2;
          finalModelType = "Featured";
        }
        // Priority 3: Free ads (check adSource FIRST to override incorrect modelType)
        else if (ad.adSource === "free_ads" || ad.modelType === "Free") {
          priority = 3;
          finalModelType = "Free";
        }
        // Default: Free
        else {
          priority = 3;
          finalModelType = "Free";
        }
        
        return { ...ad, _priority: priority, modelType: finalModelType };
      });
      
      const managed = carAds.filter((ad: any) => ad.modelType === "ListItForYou" || ad.adSource === "list_it_for_you_ad").length;
      const premium = carAds.filter((ad: any) => ad.modelType === "Featured" || ad.adSource === "featured_ads").length;
      const free = carAds.filter((ad: any) => ad.modelType === "Free" || ad.adSource === "free_ads").length;
      
      // Debug: Count approved premium cars
      const approvedPremium = carAds.filter((ad: any) => 
        (ad.modelType === "Featured" || ad.adSource === "featured_ads") && 
        (ad.isFeatured === 'Approved' || ad.isFeatured === true || ad.paymentStatus === 'verified')
      ).length;
      
      console.log(`✅ Filtered ${carAds.length} car ads (${managed} managed, ${premium} premium [${approvedPremium} approved], ${free} free)`);
      console.log(`📊 First 10:`, carAds.slice(0, 10).map((ad: any, i: number) => `${i+1}. ${ad.modelType || ad.adSource}`));
      
      // Debug: Log premium cars details
      const premiumCars = carAds.filter((ad: any) => ad.modelType === "Featured" || ad.adSource === "featured_ads");
      if (premiumCars.length > 0) {
        console.log(`⭐ Premium cars breakdown (${premiumCars.length} total):`, premiumCars.slice(0, 5).map((ad: any) => ({
          id: ad._id,
          make: ad.make,
          model: ad.model,
          isActive: ad.isActive,
          isFeatured: ad.isFeatured,
          paymentStatus: ad.paymentStatus,
          isDeleted: ad.isDeleted,
          modelType: ad.modelType,
          adSource: ad.adSource
        })));
      } else {
        console.log(`⚠️ No premium cars found in filtered results`);
        // Debug: Check if premium cars exist in raw data
        const rawPremium = normalizedData.filter((ad: any) => ad.adSource === "featured_ads" || ad.modelType === "Featured");
        console.log(`🔍 Raw premium cars in data: ${rawPremium.length}`);
        if (rawPremium.length > 0) {
          console.log(`🔍 Sample raw premium car:`, {
            id: rawPremium[0]._id,
            isActive: rawPremium[0].isActive,
            isFeatured: rawPremium[0].isFeatured,
            paymentStatus: rawPremium[0].paymentStatus,
            isValid: isAdValidForPublicListing(rawPremium[0])
          });
        }
      }
      
      // Debug: Log free cars details
      const freeCars = carAds.filter((ad: any) => ad.modelType === "Free" || ad.adSource === "free_ads");
      if (freeCars.length > 0) {
        console.log(`🆓 Free cars breakdown (${freeCars.length} total):`, freeCars.slice(0, 5).map((ad: any) => ({
          id: ad._id,
          make: ad.make,
          model: ad.model,
          isActive: ad.isActive,
          isDeleted: ad.isDeleted,
          modelType: ad.modelType,
          adSource: ad.adSource,
          _priority: ad._priority
        })));
      } else {
        console.log(`⚠️ No free cars found in filtered results`);
        // Debug: Check if free cars exist in raw data
        const rawFree = normalizedData.filter((ad: any) => ad.adSource === "free_ads" || ad.modelType === "Free");
        console.log(`🔍 Raw free cars in data: ${rawFree.length}`);
        if (rawFree.length > 0) {
          console.log(`🔍 Sample raw free car:`, {
            id: rawFree[0]._id,
            make: rawFree[0].make,
            model: rawFree[0].model,
            isActive: rawFree[0].isActive,
            isDeleted: rawFree[0].isDeleted,
            adSource: rawFree[0].adSource,
            modelType: rawFree[0].modelType,
            isValid: isAdValidForPublicListing(rawFree[0])
          });
        }
      }
      
      // Debug: Log first car to see fuel type field
      if (carAds.length > 0) {
        const firstCar = carAds[0];
        console.log('🔍 First car fuel type fields:', {
          fuelType: firstCar?.fuelType,
          fuel: firstCar?.fuel,
          fueltype: firstCar?.fueltype,
          fuel_type: firstCar?.fuel_type,
          assembly: firstCar?.assembly,
          allKeys: Object.keys(firstCar || {}).filter(key => 
            key.toLowerCase().includes('fuel') || 
            key.toLowerCase().includes('assembly') ||
            key.toLowerCase().includes('engine')
          ),
          sampleCar: {
            make: firstCar?.make,
            model: firstCar?.model,
            year: firstCar?.year,
            kmDriven: firstCar?.kmDriven,
            ...Object.fromEntries(
              Object.entries(firstCar || {}).filter(([key]) => 
                key.toLowerCase().includes('fuel') || 
                key.toLowerCase().includes('assembly')
              )
            )
          }
        });
      }
      
      // Sort by PRIORITY first (Managed=1, Premium=2, Free=3), then by DATE (newest first), then BOOSTED as tiebreaker
      carAds.sort((a: any, b: any) => {
        // Priority first
        const prioA = a._priority || 999;
        const prioB = b._priority || 999;
        if (prioA !== prioB) return prioA - prioB;
        
        // ✅ Within same priority: Sort by DATE first (newest first) - Latest ads naturally go to TOP
        const aDate = a.dateAdded ? new Date(a.dateAdded).getTime() : 0;
        const bDate = b.dateAdded ? new Date(b.dateAdded).getTime() : 0;
        
        // Sort by date first (newest first) - this puts latest ads on top
        if (aDate !== bDate) {
          return bDate - aDate; // Newest first
        }
        
        // If dates are same or very close, boosted ads get priority
        const aIsBoosted = !!(a.boostedAt || a.isBoosted);
        const bIsBoosted = !!(b.boostedAt || b.isBoosted);
        
        if (aIsBoosted && !bIsBoosted) return -1; // Boosted above non-boosted
        if (!aIsBoosted && bIsBoosted) return 1; // Non-boosted below boosted
        
        // If both are boosted, sort by boostedAt (newest boost first)
        if (aIsBoosted && bIsBoosted) {
          const aBoostDate = a.boostedAt ? new Date(a.boostedAt).getTime() : 0;
          const bBoostDate = b.boostedAt ? new Date(b.boostedAt).getTime() : 0;
          if (aBoostDate !== bBoostDate) return bBoostDate - aBoostDate; // Newest boost first
        }
        
        return 0; // Same date and same boost status
      });
      
      console.log(`🎉 Total used cars fetched: ${carAds.length}`);
      cachedUsedCars = carAds;
      setCars(carAds);
    } catch (error: any) {
      // Handle connection errors with clear messages
      console.error("❌ Error fetching car data:", error);
      console.error("❌ Error message:", error?.message);
      console.error("❌ Error name:", error?.name);
      console.error("❌ API URL:", API_URL);
      
      // Check if it's a network/connection error
      if (error?.message?.includes('Network request failed') || 
          error?.message?.includes('Failed to fetch') ||
          error?.message?.includes('Backend connection failed')) {
        console.error("❌❌❌ BACKEND CONNECTION FAILED ❌❌❌");
        console.error("⚠️ Cannot connect to backend at:", API_URL);
        console.error("⚠️ Please check:");
        console.error("   1. Backend server is running on localhost:8001");
        console.error("   2. Android emulator can reach 10.0.2.2:8001");
        console.error("   3. No firewall blocking connection");
        setCars([]); // Set empty to stop loading
        return;
      }
      
      console.error("❌ Error fetching car data:", error);
      // Fallback to single endpoint
      try {
        const { safeApiCall: safeApiCallFallback } = require("../../utils/apiUtils");
        const fallbackResult = await safeApiCallFallback<any[]>(`${API_URL}/all_ads`, {
          headers: { 'Accept': 'application/json' }
        }, 1);
        
        if (fallbackResult.success && fallbackResult.data) {
          const list = Array.isArray(fallbackResult.data) ? fallbackResult.data : [];
          
          // Normalize IDs in fallback data
          const normalizedList = list.map((car: any) => {
            if (car._id && typeof car._id === 'object') {
              let safeId: string;
              try {
                if (car._id.toString && typeof car._id.toString === 'function') {
                  const str = car._id.toString();
                  if (str && str !== '[object Object]' && str.length > 10) {
                    safeId = str;
                  } else if (car._id._id) {
                    safeId = String(car._id._id);
                  } else if (car._id.$oid) {
                    safeId = String(car._id.$oid);
                  } else {
                    safeId = String(car._id);
                  }
                } else {
                  safeId = car._id._id ? String(car._id._id) : (car._id.$oid ? String(car._id.$oid) : String(car._id));
                }
                return { ...car, _id: safeId, id: safeId };
              } catch (e) {
                return car;
              }
            }
            if (!car.id && car._id) {
              return { ...car, id: typeof car._id === 'string' ? car._id : String(car._id) };
            }
            return car;
          });
          
          const usedCars = normalizedList.filter((car: any) => {
            // ✅ Use unified validation: checks active, not deleted, not rejected, not expired
            return car && isAdValidForPublicListing(car);
          });
          cachedUsedCars = usedCars;
          setCars(usedCars);
          console.log(`🔄 Fallback: Found ${usedCars.length} cars from all_ads`);
        }
      } catch (fallbackError) {
        console.error("❌ Fallback also failed:", fallbackError);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Refresh function
  const onRefresh = () => {
    fetchCars(true);
  };

  // Ensure initial fetch happens on first mount as well
  useEffect(() => {
    if (cars.length === 0) {
      fetchCars(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Single fetch on focus (no duplicate). If we have cached cars, show them immediately and refresh in background.
  useFocusEffect(
    React.useCallback(() => {
      const hasCached = cars.length > 0;
      if (hasCached) {
        setLoading(false);
        fetchCars(true);
      } else {
        fetchCars(false);
      }
    }, [])
  );
  
  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={25} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchBar}
          placeholder="e.g.  Honda Civic Luxury ..."
          placeholderTextColor="#888"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Selected Filters Display */}
      {(() => {
        const activeFilters: string[] = [];
        
        // Categories
        if (selectedFilters.categories && selectedFilters.categories.length > 0) {
          activeFilters.push(...selectedFilters.categories);
        }
        
        // Brands
        if (selectedFilters.brands && selectedFilters.brands.length > 0) {
          activeFilters.push(...selectedFilters.brands);
        }
        
        // Models
        if (selectedFilters.models && selectedFilters.models.length > 0) {
          activeFilters.push(...selectedFilters.models);
        }
        
        // Body Types
        if (selectedFilters.bodyTypes && selectedFilters.bodyTypes.length > 0) {
          activeFilters.push(...selectedFilters.bodyTypes);
        }
        
        // Fuel Types
        if (selectedFilters.fuelTypes && selectedFilters.fuelTypes.length > 0) {
          activeFilters.push(...selectedFilters.fuelTypes);
        }
        
        // Transmissions
        if (selectedFilters.transmissions && selectedFilters.transmissions.length > 0) {
          activeFilters.push(...selectedFilters.transmissions);
        }
        
        // Locations
        if (selectedFilters.locations && selectedFilters.locations.length > 0) {
          activeFilters.push(...selectedFilters.locations);
        }
        
        // Registration Cities
        if (selectedFilters.registrationCities && selectedFilters.registrationCities.length > 0) {
          selectedFilters.registrationCities.forEach((city: string) => {
            if (!activeFilters.includes(city)) {
              activeFilters.push(city);
            }
          });
        }
        
        // Price Range
        if (selectedFilters.price && (selectedFilters.price.min > 0 || selectedFilters.price.max < 50000000)) {
          const minPriceStr = selectedFilters.price.min >= 1000000 
            ? `${(selectedFilters.price.min / 1000000).toFixed(1)}M`
            : `${(selectedFilters.price.min / 1000).toFixed(0)}K`;
          const maxPriceStr = selectedFilters.price.max >= 1000000 
            ? `${(selectedFilters.price.max / 1000000).toFixed(1)}M`
            : `${(selectedFilters.price.max / 1000).toFixed(0)}K`;
          activeFilters.push(`Price: ${minPriceStr} - ${maxPriceStr}`);
        }
        
        // Year Range
        if (selectedFilters.years && (selectedFilters.years.min > 1970 || selectedFilters.years.max < new Date().getFullYear())) {
          activeFilters.push(`Year: ${selectedFilters.years.min} - ${selectedFilters.years.max}`);
        }
        
        // KM Driven Range
        if (selectedFilters.kmDriven && (selectedFilters.kmDriven.min > 0 || selectedFilters.kmDriven.max < 500000)) {
          const minKm = selectedFilters.kmDriven.min >= 1000 
            ? `${(selectedFilters.kmDriven.min / 1000).toFixed(0)}K`
            : `${selectedFilters.kmDriven.min}`;
          const maxKm = selectedFilters.kmDriven.max >= 1000 
            ? `${(selectedFilters.kmDriven.max / 1000).toFixed(0)}K`
            : `${selectedFilters.kmDriven.max}`;
          activeFilters.push(`KM: ${minKm} - ${maxKm}`);
        }
        
        if (activeFilters.length === 0) return null;
        
        return (
          <View style={styles.selectedFiltersContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.selectedFiltersScroll}>
              {activeFilters.map((filter, index) => (
                <View key={index} style={styles.selectedFilterChip}>
                  <Text style={styles.selectedFilterText}>{filter}</Text>
                </View>
              ))}
            </ScrollView>
          </View>
        );
      })()}

      {/* Filter Options */}
      <View style={styles.filtersWrapper}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
        {/* Filters Icon */}
        <TouchableOpacity style={styles.filterItem} onPress={() => setModalVisible(true)}>
        <Ionicons name="filter" size={20} color="#CD0100" />
          <Text style={styles.filterText}> Filters</Text>
        </TouchableOpacity>

        {["Price", "Year", "Kilometer", "Inspected Cars"].map((filter, index) => (
  <TouchableOpacity 
    key={index} 
    style={styles.filterBox} 
    onPress={() => {
      if (filter === "Price") setPriceModalVisible(true);
      if (filter === "Year") setYearModalVisible(true);
      if (filter === "Kilometer") setKilometerModalVisible(true);
      if (filter === "Inspected Cars") navigation.navigate("PostAutoPartsAd");
    }}
  >
    <Text style={styles.filterText}>
      {filter} <FontAwesome name="angle-down" size={18} color="black" />
    </Text>
  </TouchableOpacity>
))}


        {/* All Filters & Reset in the same row */}
        <TouchableOpacity style={styles.allFiltersContainer} onPress={() => setModalVisible(true)}>
        <Text style={styles.allFiltersText}>
            <Text style={styles.boldText}>All Filters</Text> | <Text style={styles.boldText}>Reset</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
      <FilterModal
  visible={modalVisible}
  onClose={() => setModalVisible(false)}
  onApplyFilters={(filters) => updateFilters(filters)}
/>

    </View>
         <View style={styles.separatorLine} />

    <View style={styles.sortContainer}>
        <Text style={styles.resultsText}>{sortedCars.length} results</Text>
        <TouchableOpacity style={styles.sortButton} onPress={() => setShowSortModal(true)}>
  <Text style={styles.sortButtonText}>Sort: {sortBy}</Text>
  <Ionicons name="chevron-down" size={16} color={COLORS.primary} />
</TouchableOpacity>

      </View>
      {loading ? (
        <CarCardSkeleton count={3} />
      ) : sortedCars.length === 0 ? (
        <View style={styles.emptyStateContainer}>
          <View style={styles.emptyStateContent}>
            <View style={styles.emptyStateIcon}>
              <Ionicons name="car-outline" size={80} color="#ddd" />
            </View>
            <Text style={styles.emptyStateTitle}>Oops! No cars found</Text>
            <Text style={styles.emptyStateMessage}>
              We couldn't find any cars matching your criteria. Try adjusting your filters or search terms.
            </Text>
            <TouchableOpacity 
              style={styles.clearFiltersButton}
              onPress={() => {
                setSelectedFilters(getInitialFilters());
                setSearchQuery("");
              }}
            >
              <Text style={styles.clearFiltersText}>Clear Filters</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <FlatList
          data={sortedCars}
          initialNumToRender={12}
          maxToRenderPerBatch={10}
          windowSize={8}
          removeClippedSubviews={true}
          keyExtractor={(item, index) => {
            // CRITICAL FIX: Always return unique key, NEVER "[object Object]"
            try {
              let idStr: string | null = null;
              
              // Try item._id first (most common)
              if (item?._id) {
                if (typeof item._id === 'string' && item._id.length > 10 && item._id !== '[object Object]' && !item._id.includes('[object')) {
                  idStr = item._id;
                } else if (typeof item._id === 'object' && item._id !== null) {
                  const nestedId = item._id._id || item._id.id;
                  if (nestedId && typeof nestedId === 'string' && nestedId.length > 10 && nestedId !== '[object Object]' && !nestedId.includes('[object')) {
                    idStr = nestedId;
                  } else if (item._id.toString && typeof item._id.toString === 'function') {
                    try {
                      const toStringResult = item._id.toString();
                      if (toStringResult && typeof toStringResult === 'string' && 
                          toStringResult.length > 10 && toStringResult !== '[object Object]' && !toStringResult.includes('[object')) {
                        idStr = toStringResult;
                      }
                    } catch (e) {
                      // Skip
                    }
                  }
                }
              }
              
              // Try item.id as fallback
              if (!idStr && item?.id) {
                if (typeof item.id === 'string' && item.id.length > 10 && item.id !== '[object Object]' && !item.id.includes('[object')) {
                  idStr = item.id;
                } else if (typeof item.id === 'object' && item.id !== null) {
                  const nestedId = item.id._id || item.id.id;
                  if (nestedId && typeof nestedId === 'string' && nestedId.length > 10 && nestedId !== '[object Object]' && !nestedId.includes('[object')) {
                    idStr = nestedId;
                  }
                }
              }
              
              // Always include index to ensure uniqueness
              if (idStr) {
                return `${idStr}-idx${index}`;
              }
              
              // Fallback with sanitized strings and index
              const make = String(item?.make || 'car').substring(0, 10).replace(/[^a-zA-Z0-9]/g, '') || 'car';
              const model = String(item?.model || 'model').substring(0, 10).replace(/[^a-zA-Z0-9]/g, '') || 'model';
              const year = String(item?.year || 'year').substring(0, 4).replace(/[^0-9]/g, '') || 'year';
              return `car-${make}-${model}-${year}-idx${index}`;
            } catch (error) {
              return `car-idx${index}`;
            }
          }}
          renderItem={({ item, index }) => {
            // No headings - all cars appear directly without section headers
            const carIndex = index; // Track actual car index (before promotional cards)

            // Section headings/tags for Relevance sort only: Managed → Premium → Free (free has no tag)
            const getSection = (c: any) => {
              const pr = c?._priority || (c?.modelType === "ListItForYou" ? 1 : c?.modelType === "Featured" ? 2 : 3);
              if (pr === 1) return "managed";
              if (pr === 2) return "premium";
              return "free";
            };
            const curSection = sortBy === "Relevance" ? getSection(item) : null;
            const prevSection = sortBy === "Relevance" && index > 0 ? getSection(sortedCars[index - 1]) : null;
            const showSectionHeader =
              sortBy === "Relevance" &&
              (curSection === "managed" || curSection === "premium") &&
              curSection !== prevSection;
            
            return (
              <>
                {showSectionHeader && (
                  <View style={styles.sectionHeader}>
                    <View style={styles.sectionRow}>
                      <Ionicons
                        name={curSection === "managed" ? "shield-checkmark-outline" : "star-outline"}
                        size={18}
                        color="#CD0100"
                      />
                      <Text style={styles.sectionTitle}>
                        {curSection === "managed" ? "Managed by AutoFinder" : "Premium Cars"}
                      </Text>
                    </View>
                  </View>
                )}
                <CarCard
                  key={`car-${carIndex}-${typeof item._id === 'string' ? item._id : (item._id?.toString?.() || carIndex)}`}
                  car={item}
                  userId={userData?.userId}
                  onPress={() => {
                    // Ensure carDetails has proper string IDs
                    const carDetails = {
                      ...item,
                      _id: typeof item._id === 'string' ? item._id : (item._id?.toString?.() || String(item._id || '')),
                      id: typeof item._id === 'string' ? item._id : (item._id?.toString?.() || String(item._id || '')),
                      carId: typeof item._id === 'string' ? item._id : (item._id?.toString?.() || String(item._id || ''))
                    };
                    navigation.navigate("CarDetails", { carDetails });
                  }} 
                />
                
                {/* Insert promotional cards after every 4 cars - cycle through 4 services */}
                {(carIndex + 1) % 4 === 0 && (() => {
                  const slot = (Math.floor((carIndex + 1) / 4) - 1) % 4; // 0..3
                  const promoKey = `promo-${carIndex}-${slot}`;
                  switch (slot) {
                    case 0:
                      return <CarInspectionCard key={promoKey} />; // 1) Car Inspection
                    case 1:
                      return <ListItForMeCard key={promoKey} />; // 2) List it for You
                    case 2:
                      return <PremiumAdServiceCard key={promoKey} />; // 3) Premium Ad Services
                    case 3:
                      return <CarOnRentCard key={promoKey} />; // 4) Car on Rent
                    default:
                      return null;
                  }
                })()}
              </>
            );
          }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[COLORS.primary]}
              tintColor={COLORS.primary}
            />
          }
          keyboardShouldPersistTaps="handled"
        />
      )}
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
<KilometerRangeModal isVisible={kilometerModalVisible} onClose={() => setKilometerModalVisible(false)} 
  minMileage={minMileage}
  maxMileage={maxMileage}
  setMinMileage={setMinMileage}
  setMaxMileage={setMaxMileage}
  />
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
  },
  filterScroll: {
    alignItems: "center",
  },
  filterItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 15,
    paddingHorizontal: 10,
  },
  filterText: {
    fontSize: 14,
    color: "#333",
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
  boldText: {
    fontWeight: "bold",
  },
  sortContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.background,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  resultsText: {
    fontSize: 14,
    color: COLORS.darkGray,
  },
  sortButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  sortButtonText: {
    fontSize: 14,
    color: COLORS.primary,
    marginRight: 4,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end', // 👈 Push content to the bottom
    alignItems: 'center',
  },
  sortModalContent: {
    backgroundColor: 'white',
    padding: 20,
    borderTopLeftRadius: 20,   // 👈 Rounded corners at top only
    borderTopRightRadius: 20,
    width: '100%',
    height: '30%',             // 👈 Adjust the height as needed
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
  separatorLine: {
  borderBottomWidth: 1,
  borderBottomColor: '#eee',
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
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  emptyStateContent: {
    alignItems: 'center',
    maxWidth: 300,
  },
  emptyStateIcon: {
    marginBottom: 20,
    opacity: 0.6,
  },
  emptyStateTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyStateMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 30,
  },
  clearFiltersButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  clearFiltersText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  selectedFiltersContainer: {
    marginBottom: 10,
    paddingVertical: 8,
  },
  selectedFiltersScroll: {
    paddingHorizontal: 10,
    gap: 8,
  },
  selectedFilterChip: {
    backgroundColor: '#CD0100',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    marginRight: 8,
  },
  selectedFilterText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  
});

export default CarListScreen;