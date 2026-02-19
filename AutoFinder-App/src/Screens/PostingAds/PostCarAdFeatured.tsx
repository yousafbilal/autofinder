import React, { useEffect, useState, useRef } from "react"
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { FontAwesome5, Ionicons } from "@expo/vector-icons"
import * as ImagePicker from "expo-image-picker"
import EnhancedImagePicker from "../../Components/EnhancedImagePicker"
// Removed custom picker; using simple input with suggestions
import { COLORS } from "../../constants/colors"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { API_URL } from "../../../config"
import { compressImages, compressImage } from "../../utils/imageCompression";
import { NavigationProp, useNavigation, useRoute, useFocusEffect } from "@react-navigation/native";
import { RootStackParamList } from "../../../navigationTypes";
import { carData as rawCarData, featureList,bodyTypes, bodyColors, fuelTypes } from "../../Components/DropdownData"; // Import dropdown data
import { pakistaniCities, pakistaniLocations } from "../../Components/EnhancedDropdownData";
import DropDownPicker from "react-native-dropdown-picker"


type CarDataType = {
  [make: string]: {
    models: {
      [model: string]: {
        variants: {
          [variant: string]: string[]; // Array of years for each variant
        };
      };
    };
  };
};
const carData: CarDataType = rawCarData as CarDataType;

// Ensure carData is correctly typed
const typedCarData: CarDataType = carData;
const PostCarAdFeatured = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const route = useRoute<any>();
  const { selectedPackage } = route.params || {};
  const requirePaymentReceipt = !!(route.params as any)?.requirePaymentReceipt;
  const isUpgradeToFeatured = !!(route.params as any)?.isUpgradeToFeatured;
  const isFreeAd = !!(route.params as any)?.isFreeAd;
  const [selectedPackageState, setSelectedPackageState] = useState<any>(selectedPackage || null);
  const [dealerAdsRemaining, setDealerAdsRemaining] = useState<number | null>(null);
  const hasDealerPackage = !!selectedPackageState;
  // Determine if this is a premium package
  const packageData = selectedPackageState?.package || selectedPackageState;
  const packageName = (packageData?.name || "").toLowerCase();
  const packagePrice = packageData?.discountedPrice || packageData?.price || 0;
  const isPremiumPackage = packageName.includes("premium") || 
                           packageName.includes("featured") || 
                           packageName.includes("standard") ||
                           packageName.includes("basic") ||
                           (packagePrice > 1000 && packagePrice !== 525); // Treat paid tiers as premium
  
  // Payment receipt logic:
  // Dealer package with remaining ads should HIDE receipt regardless of premium detection.
  // Otherwise, show receipt for premium/upgrade/explicit flag/no dealer package or exhausted dealer package.
  const shouldHideDueToDealerCredits = hasDealerPackage && typeof dealerAdsRemaining === 'number' && dealerAdsRemaining > 0;
  const shouldShowReceipt = !shouldHideDueToDealerCredits && (
    isUpgradeToFeatured ||
    requirePaymentReceipt ||
    !hasDealerPackage ||
    (hasDealerPackage && (dealerAdsRemaining === null || dealerAdsRemaining <= 0)) ||
    isPremiumPackage ||
    (selectedPackageState === "Premium" || selectedPackageState === "Standard" || selectedPackageState === "Basic")
  );
    
  console.log("🔍 Receipt logic breakdown:", {
    requirePaymentReceipt,
    hasDealerPackage,
    dealerAdsRemaining,
    isPremiumPackage,
    isUpgradeToFeatured,
    selectedPackageState,
    shouldShowReceipt
  });
  
  // Free ads should not show receipt upload
  const shouldShowReceiptForCurrentFlow = shouldShowReceipt && !isFreeAd;
  
  // Force show receipt for upgrade to featured flow
  const forceShowReceipt = isUpgradeToFeatured && !isFreeAd;
  
  console.log("🔍 Final receipt decision:", {
    shouldShowReceipt,
    isFreeAd,
    shouldShowReceiptForCurrentFlow,
    forceShowReceipt,
    finalDecision: shouldShowReceiptForCurrentFlow || forceShowReceipt
  });
  
  const [currentStep, setCurrentStep] = useState(1)
  const [images, setImages] = useState<string[]>([])
  const [assembly, setAssembly] = useState("")

  // ScrollView ref to reset scroll on step change
  const scrollRef = useRef<ScrollView | null>(null);
  const [userData, setUserData] = useState<any>(null)
  const currentUserId = userData?.userId || userData?._id

  // Always scroll to top when step changes
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ y: 0, animated: true });
    }
  }, [currentStep]);

  // Debug logging
  useEffect(() => {
    console.log("🎯 PostCarAdFeatured loaded with params:", route.params);
    console.log("📦 Selected package (route):", selectedPackage);
    console.log("📦 Selected package (state):", selectedPackageState);
    console.log("🧾 requirePaymentReceipt flag:", requirePaymentReceipt);
    console.log("🧾 shouldShowReceipt:", shouldShowReceipt);
    console.log("🧮 dealerAdsRemaining:", dealerAdsRemaining);
    console.log("✅ hasDealerPackage:", hasDealerPackage);
    console.log("🔍 Current user data:", userData);
    console.log("📦 Route params keys:", Object.keys(route.params || {}));
    console.log("📦 selectedPackage from route:", route.params?.selectedPackage);
  console.log("🔍 isUpgradeToFeatured:", isUpgradeToFeatured);
  console.log("🔍 isFreeAd:", isFreeAd);
  console.log("🔍 shouldShowReceiptForCurrentFlow:", shouldShowReceiptForCurrentFlow);
    
    // Check if selectedPackage is in route params
    if (route.params?.selectedPackage) {
      console.log("✅ Package found in route params:", route.params.selectedPackage);
      setSelectedPackageState(route.params.selectedPackage);
    } else if (!selectedPackageState) {
      console.log("❌ No package in route params, fetching active package...");
      // Fetch active package if not provided
      fetchActivePackage();
    }
  }, [selectedPackage, selectedPackageState, userData, route.params, dealerAdsRemaining, hasDealerPackage, shouldShowReceipt])

  // Fetch active package if not provided in route params
  const fetchActivePackage = async () => {
    if (!currentUserId) return;
    
    try {
      console.log("📦 Fetching active package for user:", currentUserId);
      const response = await fetch(`${API_URL}/mobile/user-mobile-packages/${currentUserId}`);
      
      // Check if response is JSON before parsing
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const errorText = await response.text();
        console.error("🚨 Non-JSON response when fetching packages:", errorText.substring(0, 200));
        return; // Return early if response is not JSON
      }
      
      let data;
      try {
        data = await response.json();
      } catch (jsonError) {
        console.error("🚨 JSON parsing error when fetching packages:", jsonError);
        return; // Return early if JSON parsing fails
      }
      
      // Support both possible shapes: { packages: [...] } or { items: [...] }
      const list = Array.isArray(data?.packages) ? data.packages : (Array.isArray(data?.items) ? data.items : []);
      if (list.length > 0) {
        // Find first active, non-expired, approved car package
        const now = new Date();
        const active = list.find((p: any) => {
          const isActive = p.isActive || p.active;
          const expiryDate = p.expiryDate ? new Date(p.expiryDate) : null;
          const isExpired = expiryDate ? expiryDate < now : false;
          const status = p.purchase?.status || p.status || '';
          const isApproved = status === 'approved' || status === 'Approved';
          const isCarType = p.package?.type === 'car' || p.package?.type === 'Car' || p.package?.type === 'CAR';
          return isActive && !isExpired && isApproved && isCarType;
        }) || list.find((p: any) => {
          const isActive = p.isActive || p.active;
          const expiryDate = p.expiryDate ? new Date(p.expiryDate) : null;
          const isExpired = expiryDate ? expiryDate < now : false;
          const status = p.purchase?.status || p.status || '';
          const isApproved = status === 'approved' || status === 'Approved';
          return isActive && !isExpired && isApproved;
        });

        if (active) {
          const pkgDetails = active.package || active;
          console.log("📦 Found active package:", pkgDetails);
          setSelectedPackageState(pkgDetails);
          // Try to derive ads remaining
          const usage = active.usage || {};
          const remaining = usage.adsRemaining ?? usage.listingsRemaining ?? null;
          if (remaining !== null && remaining !== undefined) {
            setDealerAdsRemaining(Number(remaining));
            console.log("🧮 Dealer ads remaining:", Number(remaining));
          }
        }
      } else {
        console.log("ℹ️ No active packages found for user.");
      }
    } catch (error) {
      console.error("❌ Error fetching active package:", error);
    }
  };

  // Always fetch dealer usage to compute ads remaining, even if package came from route
  const fetchDealerUsage = async () => {
    if (!currentUserId) return;
    try {
      console.log("📡 Fetching dealer usage for user:", currentUserId);
      const response = await fetch(`${API_URL}/mobile/user-mobile-packages/${currentUserId}`);
      
      // Check if response is JSON before parsing
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const errorText = await response.text();
        console.error("🚨 Non-JSON response when fetching dealer usage:", errorText.substring(0, 200));
        setDealerAdsRemaining(null);
        return; // Return early if response is not JSON
      }
      
      let data;
      try {
        data = await response.json();
      } catch (jsonError) {
        console.error("🚨 JSON parsing error when fetching dealer usage:", jsonError);
        setDealerAdsRemaining(null);
        return; // Return early if JSON parsing fails
      }
      const list = Array.isArray(data?.packages) ? data.packages : (Array.isArray(data?.items) ? data.items : []);
      if (!Array.isArray(list) || list.length === 0) {
        console.log("ℹ️ No packages found when fetching usage");
        setDealerAdsRemaining(null);
        return;
      }
      const active = list.find((p: any) => (p.isActive || p.active) && (p.package?.type === 'car' || p.package?.type === 'Car' || p.package?.type === 'CAR'))
        || list.find((p: any) => (p.isActive || p.active));
      if (!active) {
        console.log("ℹ️ No active package found when fetching usage");
        setDealerAdsRemaining(null);
        return;
      }
      const usage = active.usage || {};
      const remaining = usage.adsRemaining ?? usage.listingsRemaining ?? null;
      if (remaining !== null && remaining !== undefined) {
        setDealerAdsRemaining(Number(remaining));
      } else {
        // Fallback derive from total/used if available
        const total = Number(usage.totalAds ?? usage.listingLimit ?? active.package?.listingLimit ?? 0);
        const used = Number(usage.adsUsed ?? 0);
        if (total > 0) {
          setDealerAdsRemaining(Math.max(0, total - used));
        } else {
          setDealerAdsRemaining(null);
        }
      }
      // If we didn't have selectedPackageState, set it from active
      if (!selectedPackageState && active.package) {
        setSelectedPackageState(active.package);
      }
    } catch (e) {
      console.warn("⚠️ Error fetching dealer usage:", e);
    }
  };

  // Trigger usage fetch when user ID is available
  useEffect(() => {
    if (currentUserId) {
      fetchDealerUsage();
    }
  }, [currentUserId]);

  // Refresh usage whenever screen gains focus
  useFocusEffect(
    React.useCallback(() => {
      if (currentUserId) {
        fetchDealerUsage();
      }
    }, [currentUserId])
  );

  // Load user data on component mount
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const storedUser = await AsyncStorage.getItem('user')
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser)
          setUserData(parsedUser)
          console.log("✅ User data loaded:", parsedUser)
        } else {
          console.log("❌ No user data found in AsyncStorage")
        }
      } catch (error) {
        console.error("❌ Error loading user data:", error)
      }
    }
    
    loadUserData()
  }, [])
           
  // Basic Information
  const [title, setTitle] = useState("")
  const [price, setPrice] = useState("")
  const [description, setDescription] = useState("")
  const [category, setCategory] = useState("")

  const formatPriceInWords = (raw: string) => {
    const numeric = parseInt((raw || '').replace(/\D/g, ''), 10)
    if (!numeric || numeric <= 0) return ''
    if (numeric < 1000) {
      if (numeric % 100 === 0) {
        return `${numeric / 100} hundred`
      }
      return `${numeric}`
    }
    if (numeric < 100000) {
      const thousands = Math.floor(numeric / 1000)
      return `${thousands} hazar`
    }
    if (numeric < 10000000) {
      const lakhs = Math.floor(numeric / 100000)
      return `${lakhs} lakh`
    }
    const crores = Math.floor(numeric / 10000000)
    return `${crores} crore`
  }
  // Car Details
  const [mileage, setMileage] = useState("")
  const [fuelType, setFuelType] = useState("")
  const [transmission, setTransmission] = useState("")
  const [color, setColor] = useState("");
  const [customColor, setCustomColor] = useState("");
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [bodyType, setBodyType] = useState("")
  const [engineSize, setEngineSize] = useState("")
  const [registrationCity, setRegistrationCity] = useState("");
  const [showRegCitySuggestions, setShowRegCitySuggestions] = useState(false);

  // Features
  const [features, setFeatures] = useState({
    AirConditioning: false,
    PowerSteering: false,
    PowerWindows: false,
    Abs: false,
    Airbags: false,
    Sunroof: false,
    Bluetooth: false,
    CruiseControl: false,
    AdaptiveCruiseControl: false,
    ParkingSensors: false,
    Navigation: false,
    LeatherSeats: false,
    HeatedSeats: false,
    VentilatedSeats: false,
    RearCamera: false,
    FrontCamera: false,
    Camera360: false,
    KeylessEntry: false,
    PushStart: false,
    AlloyWheels: false,
    FogLights: false,
    LEDHeadlights: false,
    DaytimeRunningLights: false,
    Touchscreen: false,
    AndroidAuto: false,
    AppleCarPlay: false,
    WirelessCharging: false,
    AutoHeadlights: false,
    RainSensingWipers: false,
    TractionControl: false,
    StabilityControl: false,
    HillStartAssist: false,
    HillDescentControl: false,
    BlindSpotMonitoring: false,
    LaneDepartureWarning: false,
    LaneKeepAssist: false,
    AutonomousBraking: false,
    TPMS: false,
    RearACVents: false,
    SteeringControls: false,
    MemorySeats: false,
    PowerMirrors: false,
    RetractableSideMirrors: false,
    RearDefogger: false,
    ArmRest: false,
    RoofRack: false,
    PanoramicSunroof: false,
    HeadsUpDisplay: false,
    PowerTailgate: false,
    RemoteEngineStart: false,
  })
  const [selectedFeatureKeys, setSelectedFeatureKeys] = useState<string[]>([])
  const [form, setForm] = useState({
  make: "",
  model: "",
  variant: "",
  year: "",
  registrationCity: "",

});


  // Contact Information
  const [location, setLocation] = useState("")
  const [adCity, setAdCity] = useState("")
  const [showCitySuggestions, setShowCitySuggestions] = useState(false)
  const [showAreaSuggestions, setShowAreaSuggestions] = useState(false)
 
  const [email, setEmail] = useState("")
  const [preferredContact, setPreferredContact] = useState("phone")
  const [isLoading, setIsLoading] = useState(false); // Manage loading state
  const assemblyType = ["Local", "Imported"]
  const [invoiceImage, setInvoiceImage] = useState<string | null>(null);

  const categories = ["Automatic Cars", "Family Cars", "5 Seater", "4 Seater", "Imported Cars", "Old Cars", "Japanese Cars", "Low Mileage", "Jeep", "Hybrid Cars"];
  const fuelTypes = ["Petrol", "Diesel", "Hybrid", "Electric", "LPG", "CNG"]
  const transmissionTypes = ["Automatic", "Manual", "Semi-Automatic", "CVT"]
  const bodyTypes = ["Hatchback", "High Roof Single Cabin", "Sedan", "SUV", "Crossover", "Mini Van", "Van", "MPV", "Micro Van", "Compact sedan", "Double Cabin", "Compact SUV", "Pick Up", "Station Wagon", "Coupe", "Mini Vehicles", "Truck", "Convertible", "High Roof", "Off Road Vehicles", "Compact Hatchback"];
  const colors = ["White", "Black", "Gray", "Silver", "Red", "Blue", "Green", "Yellow", "Orange", "Brown", "Beige", "Gold", "Pink", "Purple", "Teal", "Maroon", "Navy", "Champagne", "Turquoise", "Mint"];
  const [selectedYear, setSelectedYear] = useState<string>("");
  type CarChoice = { make: string; model: string; variant?: string };
  const [carChoices, setCarChoices] = useState<CarChoice[]>([]);

  useEffect(() => {
    const params: any = route.params || {}
    if (typeof params.preselectedYear === 'string') {
      setSelectedYear(params.preselectedYear)
      setForm(prev => ({ ...prev, year: params.preselectedYear }))
    }
    if (Array.isArray(params.carChoices) && params.carChoices.length) {
      const incoming = params.carChoices as CarChoice[]
      setCarChoices(prev => {
        const combined = [...prev, ...incoming]
        const dedup = Array.from(new Map(combined.map(c => [`${c.make}|${c.model}|${c.variant||''}`, c])).values())
        setForm(f => ({
          ...f,
          make: dedup[0]?.make || f.make,
          model: dedup[0] ? `${dedup[0].make} ${dedup[0].model}${dedup[0].variant? ' '+dedup[0].variant: ''}` : f.model,
          variant: dedup[0]?.variant || f.variant,
          year: selectedYear || f.year,
        }))
        return dedup
      })
    }
    if (typeof params.selectedRegistrationCity === 'string' && params.selectedRegistrationCity) {
      setRegistrationCity(params.selectedRegistrationCity)
    }
    if (typeof params.selectedLocation === 'string' && params.selectedLocation) {
      setAdCity(params.selectedLocation)
      setLocation("")
    }
    if (typeof params.selectedArea === 'string' && params.selectedArea) {
      setLocation(params.selectedArea)
    }
    if (Array.isArray(params.selectedFeatures)) {
      const keys = params.selectedFeatures as string[]
      setSelectedFeatureKeys(keys)
      // also reflect into features object for submission backward-compat
      setFeatures(prev => {
        const next: any = { ...prev }
        Object.keys(next).forEach(k => { next[k] = keys.includes(k) })
        return next
      })
    }
  }, [route.params])

  // Legacy dropdown arrays (makes/models/variants/years) removed in favor of navigation flow

   useEffect(() => {
    const fetchUserData = async () => {
      try {
        const storedUserData = await AsyncStorage.getItem('user');
          if (storedUserData) {
            const parsedData = JSON.parse(storedUserData);
            console.log("Fetched User Data:", parsedData); // Log user data
            setUserData(parsedData);
          } else {
            console.log("No user data found in AsyncStorage.");
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
        } finally {
          setIsLoading(false);
      }
    };
    fetchUserData();
  }, []);
  // Disable external cities API; rely on local data/imports to avoid network errors
  useEffect(() => {
    setIsLoading(false)
  }, [])
  const pickInvoiceImage = async () => {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

  if (status !== "granted") {
   Alert.alert("Permission Denied", "We need camera roll permissions to upload the invoice.");
    return;
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: (ImagePicker as any).MediaType?.Images || ImagePicker.MediaTypeOptions.Images,
    allowsEditing: false,  // disabled editing to remove cropping/aspect limits
    // Remove 'aspect' property completely
    quality: 1, // Keep original quality - no compression
  });

  if (!result.canceled) {
    setInvoiceImage(result.assets[0].uri);
  }
};
const removeInvoiceImage = () => {
  setInvoiceImage(null);
};


  const toggleFeature = (feature: keyof typeof features) => {
    setFeatures({
      ...features,
      [feature]: !features[feature],
    })
  }

  const validateCurrentStep = () => {
    if (currentStep === 1) {
      if (images.length === 0) {
        Alert.alert("Missing Images", "Please upload at least one image of your car")
        return false
      }
      if (images.length > 6) {
        Alert.alert("Too Many Images", "You can upload a maximum of 6 images to prevent upload errors")
        return false
      }
      if (!title || !price) {
        Alert.alert("Missing Information", "Please fill in all required fields")
        return false
      }
    } else if (currentStep === 2) {
      if (!mileage || !fuelType || !transmission || !selectedYear) {
        Alert.alert("Missing Information", "Please fill in all required fields")
        return false
      }
    } else if (currentStep === 4) {
      if (!adCity || !location || (shouldShowReceipt && !invoiceImage)) {
        Alert.alert("Missing Information", "Please fill in all required fields")
        return false
      }
    }
    return true
  }

  const handleNextStep = () => {
    if (validateCurrentStep()) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePreviousStep = () => {
    setCurrentStep(currentStep - 1)
  }

  const updatePackageUsageImmediately = async () => {
    try {
      console.log("🔄 Updating package usage immediately after ad post");
      
      // Get current user ID
      const stored = await AsyncStorage.getItem('user');
      const parsed = stored ? JSON.parse(stored) : null;
      const userId = parsed?._id || parsed?.userId;
      
      console.log("👤 User ID for update:", userId);
      const packageData = selectedPackageState?.package || selectedPackageState;
      console.log("📦 Package ID for update:", packageData?._id || packageData?.id);
      
      if (!userId) {
        console.log("❌ No user ID found for package usage update");
        return;
      }

      console.log("🌐 Calling debug endpoint...");
      // Use the debug endpoint to refresh package usage immediately
      const debugResponse = await fetch(`${API_URL}/debug/refresh-package-usage/${userId}`);
      console.log("📡 Debug endpoint response status:", debugResponse.status);
      let debugData: any;
      try {
        debugData = await debugResponse.clone().json();
      } catch (e) {
        debugData = await debugResponse.text();
      }
      if (!debugResponse.ok) {
        console.warn("⚠️ Debug endpoint returned non-OK response:", { status: debugResponse.status, body: debugData });
        return; // do not throw; just exit the immediate update flow
      }
      console.log("📦 Package usage refreshed via debug endpoint:", debugData);
      
      // Also emit a socket event to notify any open package usage screens
      console.log("🔌 Creating socket connection...");
      const { io } = await import('socket.io-client');
      const socket = io(API_URL);
      
      const socketData = {
        userId: userId,
        packageId: packageData?._id || packageData?.id,
        timestamp: new Date().toISOString()
      };
      
      console.log("📡 Emitting socket event with data:", socketData);
      socket.emit('package_usage_immediate_update', socketData);
      
      console.log("✅ Immediate package usage update completed");
      
    } catch (error) {
      console.error("❌ Error updating package usage immediately:", error);
    }
  };

  const handleSubmit = async () => {
  console.log("🚀 handleSubmit called");
  console.log("👤 User data check:", { hasUserData: !!userData, userId: currentUserId });
  console.log("📦 Selected package check:", {
    hasSelectedPackage: !!selectedPackageState,
    packageId: selectedPackageState?.package?._id || selectedPackageState?.package?.id || selectedPackageState?.id || selectedPackageState?._id,
    packageName: selectedPackageState?.package?.name || selectedPackageState?.name,
    fullPackage: selectedPackageState
  });
  
  if (!currentUserId) {
    console.log("❌ No user data found, navigating to login");
    navigation.navigate("LoginScreen");
    return;
  }

  // Check if package is expired (only for non-free ads)
  if (!isFreeAd && selectedPackageState) {
    try {
      const response = await fetch(`${API_URL}/mobile/user-mobile-packages/${currentUserId}`);
      
      // Check if response is JSON before parsing
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const errorText = await response.text();
        console.error("🚨 Non-JSON response when checking package expiry:", errorText.substring(0, 200));
        return false; // Return false if response is not JSON
      }
      
      let data;
      try {
        data = await response.json();
      } catch (jsonError) {
        console.error("🚨 JSON parsing error when checking package expiry:", jsonError);
        return false; // Return false if JSON parsing fails
      }
      
      const list = Array.isArray(data?.packages) ? data.packages : (Array.isArray(data?.items) ? data.items : []);
      
      if (list.length > 0) {
        const packageId = selectedPackageState?.package?._id || selectedPackageState?.package?.id || selectedPackageState?.id || selectedPackageState?._id;
        const userPackage = list.find((p: any) => 
          (p.purchase?._id || p._id) === packageId ||
          (p.package?._id || p.package?.id) === packageId ||
          (p.purchase?.packageId || p.packageId) === packageId
        );
        
        if (userPackage) {
          const now = new Date();
          const expiryDate = userPackage.expiryDate ? new Date(userPackage.expiryDate) : null;
          const isExpired = expiryDate ? expiryDate < now : false;
          const isActive = userPackage.isActive || userPackage.active || false;
          const status = userPackage.purchase?.status || userPackage.status || '';
          const isApproved = status === 'approved' || status === 'Approved';
          
          if (isExpired || !isActive) {
            if (Platform.OS === 'ios') {
              Alert.alert(
                "Package Expired",
                "Your package has expired. Dealer packages are currently only available on Android devices. Please use an Android device to renew your package.",
                [
                  { text: "OK", onPress: () => navigation.goBack() }
                ]
              );
            } else {
              Alert.alert(
                "Package Expired",
                "Your package has expired. Please renew your package to create new posts. After renewal and admin approval, you will be able to create posts.",
                [
                  { text: "Cancel", style: "cancel", onPress: () => navigation.goBack() },
                  { 
                    text: "Renew Package", 
                    onPress: () => {
                      navigation.goBack();
                      (navigation as any).navigate("PackagesScreen");
                    }
                  }
                ]
              );
            }
            return;
          }
          
          if (!isApproved) {
            Alert.alert(
              "Package Pending Approval",
              "Your package is pending admin approval. Once approved, you will be able to create posts.",
              [
                { text: "OK", style: "default", onPress: () => navigation.goBack() }
              ]
            );
            return;
          }
        }
      }
    } catch (error) {
      console.error("❌ Error checking package expiry:", error);
      // Continue with submission if check fails (don't block user)
    }
  }

  // Validate image count to prevent 413 error
  if (images.length > 6) {
    Alert.alert(
      "Too Many Images",
      "Please select maximum 6 images to prevent upload errors. Currently you have " + images.length + " images.",
      [{ text: "OK" }]
    );
    return;
  }

  console.log("✅ User data validated, proceeding with submission");
  setIsLoading(true);

  const formData = new FormData();

  console.log("📋 Building FormData with values:");
  console.log("  - userId:", currentUserId);
  console.log("  - location:", location);
  console.log("  - title:", title);
  console.log("  - make:", form.make || (carChoices[0]?.make || ""));
  console.log("  - price:", price);
  
  formData.append("userId", String(currentUserId));
  formData.append("location", location);
  formData.append("adCity", adCity);
  formData.append("title", title);
  formData.append("make", form.make || (carChoices[0]?.make || ""));
  formData.append("model", form.model || (carChoices[0] ? `${carChoices[0].make} ${carChoices[0].model}${carChoices[0].variant? ' '+carChoices[0].variant: ''}` : ""));
  formData.append("variant", form.variant || (carChoices[0]?.variant || ""));
  formData.append("bodyType", bodyType);
  formData.append("category", category);
  formData.append("preferredContact", preferredContact);
  formData.append("year", selectedYear || form.year || "");
  formData.append("registrationCity", registrationCity || form.registrationCity);
  formData.append("price", price);
  formData.append("bodyColor", color === "Other" ? customColor : color);
  formData.append("kmDriven", mileage);
  formData.append("fuelType", fuelType);
  formData.append("engineCapacity", engineSize);
  formData.append("description", description);
  formData.append("transmission", transmission);
  formData.append("assembly", assembly);
  
  // Add additional fields for proper categorization
  if (isUpgradeToFeatured) {
    formData.append("source", "upgrade_to_featured");
    formData.append("isUpgrade", "true");
    formData.append("requiresApproval", "true");
  } else if (isFreeAd) {
    formData.append("source", "free_ad");
    formData.append("isFree", "true");
    formData.append("requiresApproval", "false");
  }
  // no package selection field

  // Convert features object to an array of selected features
  const selectedFeaturesArr = selectedFeatureKeys.length
    ? selectedFeatureKeys
    : Object.keys(features).filter((key) => (features as any)[key]);
  formData.append("features", selectedFeaturesArr.join(","));

  // Add package information
  console.log("🔍 Package state check:", {
    selectedPackageState: selectedPackageState,
    hasSelectedPackage: !!selectedPackageState,
    isUpgradeToFeatured: isUpgradeToFeatured,
    isFreeAd: isFreeAd
  });
  
  if (selectedPackageState) {
    // Handle nested package structure from API response
    const packageData = selectedPackageState.package || selectedPackageState;
    const packageId = packageData._id || packageData.id || "";
    const packagePrice = packageData.discountedPrice || packageData.price || 0;
    const packageName = (packageData.name || "").toLowerCase();
    
    console.log("🔍 Full package data structure:", {
      selectedPackageState: selectedPackageState,
      packageData: packageData,
      packageId: packageId,
      packagePrice: packagePrice,
      packageName: packageName,
      originalName: packageData.name,
      validityDays: packageData.noOfDays || packageData.duration || packageData.validityDays,
      liveAdDays: packageData.liveAdDays,
      totalAds: packageData.listingLimit || packageData.totalAds
    });
    
    console.log("📦 Package data extracted:", {
      packageData: packageData,
      packageId: packageId,
      packagePrice: packagePrice,
      packageName: packageName,
      originalName: packageData.name
    });
    
    // Check if this is a PREMIUM/FEATURED package or just a BASIC PAID package
    // 525 package should be treated as FREE AD, not premium
    const isPremiumPackage = packageName.includes("premium") || 
                             packageName.includes("featured") || 
                             packageName.includes("basic") || // Basic packages are also premium
                             (packagePrice > 1000 && packagePrice !== 525); // Packages > 1000 PKR are premium, EXCEPT 525
    
    console.log("🔍 Premium package detection:", {
      isPremiumPackage: isPremiumPackage,
      includesPremium: packageName.includes("premium"),
      includesFeatured: packageName.includes("featured"),
      includesBasic: packageName.includes("basic"),
      priceCheck: packagePrice > 1000
    });
    
    // Special handling for 525 package - treat as FREE AD
    if (packagePrice === 525) {
      console.log("🆓 525 package detected - treating as FREE AD");
      formData.append("isFeatured", "false");
      formData.append("isPaidAd", "false");
      formData.append("adType", "free");
      formData.append("paymentStatus", "none");
      formData.append("category", "free");
      formData.append("adStatus", "active");
      formData.append("isPremium", "false");
      formData.append("listingType", "free");
      formData.append("modelType", "Free");
      formData.append("isFreeAd", "true");
      formData.append("forceFree", "true");
      formData.append("packageId", packageId);
      formData.append("packageName", packageData.name || "525 Package");
      formData.append("packagePrice", packagePrice.toString());
      formData.append("paymentAmount", "0");
    }
    // Force premium status for Premium packages
    else if (packageName.includes("premium") || packageName.includes("basic") || packageName.includes("standard") || selectedPackageState === "Premium" || selectedPackageState === "Basic" || selectedPackageState === "Standard") {
      console.log("🚀 Premium package detected - forcing premium ad");
      formData.append("isFeatured", "true");
      formData.append("isPaidAd", "true");
      formData.append("packageId", packageId);
      // Resolve plan name and amounts when user selected string plan
      const planNameResolved = (typeof selectedPackageState === 'string' && ["Basic","Standard","Premium"].includes(selectedPackageState)) 
        ? selectedPackageState 
        : (packageData.name || "Premium");
      const planDaysMap: any = { Basic: 7, Standard: 15, Premium: 30 };
      const planAmountMap: any = { Basic: 1500, Standard: 2250, Premium: 3150 };
      const resolvedDays = planDaysMap[planNameResolved] || (packageData.noOfDays || packageData.duration || packageData.validityDays || 0);
      const resolvedAmount = planAmountMap[planNameResolved] || packagePrice;
      formData.append("packageName", planNameResolved);
      formData.append("packagePrice", String(resolvedAmount));
      formData.append("paymentAmount", String(resolvedAmount));
      formData.append("validityDays", String(resolvedDays));
      // Also send featured expiry date so admin can see immediately
      try {
        const exp = new Date();
        exp.setDate(exp.getDate() + Number(resolvedDays || 0));
        formData.append("featuredExpiryDate", exp.toISOString());
      } catch {}
      formData.append("liveAdDays", (packageData.liveAdDays || 0).toString());
      formData.append("totalAds", (packageData.listingLimit || packageData.totalAds || 0).toString());
      formData.append("adType", "featured");
      formData.append("paymentStatus", "pending");
      formData.append("category", planNameResolved);
      formData.append("adStatus", "pending");
      formData.append("isPremium", "true");
      formData.append("listingType", "premium");
      formData.append("modelType", "Featured");
      formData.append("forcePremium", "true");
    } else {
      // If we have a package but it's not detected as premium, still treat it as premium
      console.log("⚠️ Package detected but not as premium - treating as premium anyway");
      formData.append("isFeatured", "true");
      formData.append("isPaidAd", "true");
    formData.append("packageId", packageId);
    formData.append("packageName", packageData.name || "");
    formData.append("packagePrice", packagePrice.toString());
    formData.append("paymentAmount", packagePrice.toString());
      formData.append("validityDays", (packageData.noOfDays || packageData.duration || packageData.validityDays || 0).toString());
      formData.append("liveAdDays", (packageData.liveAdDays || 0).toString());
      formData.append("totalAds", (packageData.listingLimit || packageData.totalAds || 0).toString());
      formData.append("adType", "featured");
      formData.append("paymentStatus", "pending");
      formData.append("category", "premium");
      formData.append("adStatus", "pending");
      formData.append("isPremium", "true");
      formData.append("listingType", "premium");
      formData.append("modelType", "Featured");
      formData.append("forcePremium", "true");
    }
    
    console.log("📦 Package info:", {
      packageId: packageId,
      packageName: packageData.name,
      price: packagePrice,
      isPremiumPackage: isPremiumPackage,
      isFeatured: isPremiumPackage ? "true" : "false",
      selectedPackageState: selectedPackageState
    });
    
    console.log("🔍 Package detection details:", {
      packageNameLower: packageName,
      includesPremium: packageName.includes("premium"),
      includesFeatured: packageName.includes("featured"),
      includesBasic: packageName.includes("basic"),
      priceCheck: packagePrice > 1000,
      selectedPackageStateCheck: selectedPackageState === "Premium" || selectedPackageState === "Basic"
    });
  } else if (isUpgradeToFeatured) {
    // Force premium/featured status for upgrade to featured flow
    console.log("🚀 Upgrade to Featured flow - forcing premium ad");
    formData.append("isFeatured", "true");
    formData.append("isPaidAd", "true");
    formData.append("packageName", "Upgrade to Featured");
    formData.append("packagePrice", "0");
    formData.append("paymentAmount", "0");
    formData.append("adType", "featured");
    formData.append("paymentStatus", "pending");
    formData.append("category", "premium"); // Force premium category
    formData.append("adStatus", "pending"); // Set status to pending for admin approval
    formData.append("isPremium", "true"); // Additional premium flag
    formData.append("listingType", "premium"); // Premium listing type
    formData.append("modelType", "Featured"); // Force Featured model type
    formData.append("isUpgradeToFeatured", "true"); // Explicit upgrade flag
    formData.append("forcePremium", "true"); // Force premium categorization
  } else if (isFreeAd) {
    // Force free ad status for free ad flow
    console.log("🆓 Free Ad flow - creating free ad");
    formData.append("isFeatured", "false");
    formData.append("isPaidAd", "false");
    formData.append("packageName", "Free Ad");
    formData.append("packagePrice", "0");
    formData.append("paymentAmount", "0");
    formData.append("adType", "free");
    formData.append("paymentStatus", "none");
    formData.append("category", "free"); // Force free category
    formData.append("adStatus", "active"); // Set status to active for free ads
    formData.append("isPremium", "false"); // Not premium
    formData.append("listingType", "free"); // Free listing type
    formData.append("modelType", "Free"); // Force Free model type
    formData.append("isFreeAd", "true"); // Explicit free ad flag
    formData.append("forceFree", "true"); // Force free categorization
  } else {
    // No package context, default to non-paid regular ad
    console.log("⚠️ No package data found - creating regular free ad");
    formData.append("isFeatured", "false");
    formData.append("isPaidAd", "false");
  }

  // Attach original images without compression
  console.log("🔧 Processing images for upload (original quality)...");
  const maxImagesToUpload = 6; // Limit to 6 images
  const imagesToProcess = images.slice(0, maxImagesToUpload);
  console.log("🔧 Total images to upload:", imagesToProcess.length);
  
  imagesToProcess.forEach((imageUri, index) => {
    const filename = imageUri.split("/").pop() || `image_${index + 1}.jpg`;
    const match = /\.(\w+)$/.exec(filename);
    const ext = match ? match[1] : "jpg";
    const type = `image/${ext}`;

    console.log(`🔧 Adding compressed image ${index + 1}:`, {
      uri: imageUri.substring(0, 50) + "...",
      filename: filename,
      type: type
    });

    formData.append(`image${index + 1}`, {
      uri: imageUri,
      name: filename,
      type,
    } as unknown as Blob);
  });
  // Attach invoice image without compression
  if (invoiceImage) {
    const filename = invoiceImage.split("/").pop() || `invoice.jpg`;
    const match = /\.(\w+)$/.exec(filename);
    const ext = match ? match[1] : "jpg";
    const type = `image/${ext}`;

    formData.append("invoiceImage", {
      uri: invoiceImage,
      name: filename,
      type,
    } as unknown as Blob);
    console.log("✅ Invoice image added (original quality)");
  }

  try {
    const endpoint = `${API_URL}/featured_ads`;
    console.log("🚀 Submitting to endpoint:", endpoint);
    console.log("📦 Package data being sent:", selectedPackage);
    console.log("🔍 User ID being sent:", userData.userId);
    console.log("🎯 Upgrade to Featured flow:", isUpgradeToFeatured);
    console.log("🆓 Free Ad flow:", isFreeAd);
    console.log("📋 Form data being sent:", {
      isFeatured: isUpgradeToFeatured ? "true" : (isFreeAd ? "false" : "false"),
      isPaidAd: isUpgradeToFeatured ? "true" : (isFreeAd ? "false" : "false"),
      adType: isUpgradeToFeatured ? "featured" : (isFreeAd ? "free" : "regular"),
      category: isUpgradeToFeatured ? "premium" : (isFreeAd ? "free" : "regular"),
      paymentStatus: isUpgradeToFeatured ? "pending" : (isFreeAd ? "none" : "none"),
      modelType: isUpgradeToFeatured ? "Featured" : (isFreeAd ? "Free" : "regular"),
      isUpgradeToFeatured: isUpgradeToFeatured,
      isFreeAd: isFreeAd
    });
    
    // Log key form data for debugging
  console.log("🔍 Key form data being sent:");
  console.log("  isFeatured:", formData.get("isFeatured"));
  console.log("  isPaidAd:", formData.get("isPaidAd"));
  console.log("  adType:", formData.get("adType"));
  console.log("  modelType:", formData.get("modelType"));
  console.log("  category:", formData.get("category"));
  console.log("  packageId:", formData.get("packageId"));
  console.log("  packageName:", formData.get("packageName"));
  console.log("  packagePrice:", formData.get("packagePrice"));
  console.log("  paymentAmount:", formData.get("paymentAmount"));
    
    const response = await fetch(endpoint, {
      method: "POST",
      body: formData,
    });

    console.log("🚀 Response received, status:", response.status);
    
    // Check for 413 error specifically
    if (response.status === 413) {
      const errorText = await response.text();
      console.error("🚨 413 Request Entity Too Large:", errorText);
      throw new Error("File size too large. Please reduce image size or upload fewer images.");
    }
    
    // Check if response is JSON before parsing
    const contentType = response.headers.get("content-type");
    let result;
    
    if (!contentType || !contentType.includes("application/json")) {
      const errorText = await response.text();
      console.error("🚨 Non-JSON response:", errorText.substring(0, 500));
      console.error("🚨 Response status:", response.status);
      console.error("🚨 Content-Type:", contentType);
      
      // Try to extract error message from HTML if possible
      let errorMessage = `Server returned invalid response (${response.status}). Please try again.`;
      if (errorText.includes('<title>')) {
        const titleMatch = errorText.match(/<title>(.*?)<\/title>/i);
        if (titleMatch) {
          errorMessage = `Server error: ${titleMatch[1]}`;
        }
      }
      throw new Error(errorMessage);
    }
    
    // Parse JSON response
    try {
      result = await response.json();
      console.log("✅ Response parsed successfully:", result);
    } catch (jsonError) {
      console.error("🚨 JSON parsing error:", jsonError);
      const errorText = await response.text();
      console.error("🚨 Response text:", errorText.substring(0, 500));
      throw new Error("Invalid response from server. Please try again.");
    }

    if (response.ok) {
      console.log("✅ Ad posted successfully, updating package usage immediately");
      console.log("📦 Selected package (state):", selectedPackageState);
      const packageData = selectedPackageState?.package || selectedPackageState;
      console.log("🔍 Package ID:", packageData?._id || packageData?.id);
      console.log("📦 Ad package data from response:", {
        packageId: result.ad?.packageId,
        packageName: result.ad?.packageName,
        isFeatured: result.ad?.isFeatured,
        paymentStatus: result.ad?.paymentStatus
      });
      
      // Immediately update package usage when ad is posted
      if (selectedPackageState) {
        console.log("🚀 Calling updatePackageUsageImmediately...");
        await updatePackageUsageImmediately();
      } else {
        console.log("❌ No selected package found, skipping immediate update");
      }
      
      Alert.alert("Success", "Ad posted successfully!", [
        {
          text: "OK",
          onPress: () => navigation.navigate("HomeTabs")
        }
      ]);
    } else {
      Alert.alert("Error", result.message || "Error posting ad");
    }
  } catch (error) {
    console.error("🚨 Error creating ad:", error);
    console.error("🚨 Error details:", {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    
    let errorMessage = "An error occurred while creating the ad.";
    
    // Handle specific error types
    if (error.name === 'AbortError') {
      errorMessage = "Request timed out. Please check your internet connection and try again.";
    } else if (error.message.includes('Network request failed')) {
      errorMessage = "Network error. Please check your internet connection.";
    } else if (error.message.includes('File size too large') || error.message.includes('413')) {
      errorMessage = "Image size too large. Please upload fewer images (max 5-6 images) or use smaller images.";
    } else if (error.message.includes('Invalid response from server') || error.message.includes('invalid response')) {
      errorMessage = "Server error. Please try again later.";
    } else if (error.message.includes('Server returned invalid response')) {
      errorMessage = error.message; // Use the specific error message
    } else if (error.message.includes('Server error:')) {
      errorMessage = error.message; // Use the specific server error
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    Alert.alert("Error", errorMessage);
  } finally {
    setIsLoading(false);
  }
};
  
  const renderStepIndicator = () => {
    return (
      <View style={styles.stepIndicatorContainer}>
        {[1, 2, 3, 4].map((step) => (
          <View key={step} style={styles.stepRow}>
            <View style={[styles.stepCircle, currentStep >= step ? styles.activeStepCircle : {}]}>
              {currentStep > step ? (
                <Ionicons name="checkmark" size={16} color={COLORS.white} />
              ) : (
                <Text style={[styles.stepNumber, currentStep >= step ? styles.activeStepNumber : {}]}>{step}</Text>
              )}
            </View>
            <Text style={[styles.stepText, currentStep >= step ? styles.activeStepText : {}]}>
              {step === 1
                ? "Photos & Basic Info"
                : step === 2
                  ? "Car Details"
                  : step === 3
                    ? "Features"
                    : "Contact Info"}
            </Text>
          </View>
        ))}
      </View>
    )
  }

  const renderStep1 = () => {
    return (
      <>
        <EnhancedImagePicker
          images={images}
          onImagesChange={setImages}
          maxImages={6}
          title="Upload Photos (Max 6)"
          required={true}
        />
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Information</Text>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>
              Title <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 2018 Honda Civic in excellent condition"
              value={title}
              onChangeText={setTitle}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>
              Price (PKR) <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              placeholder="Enter price"
              value={price}
              onChangeText={(text) => setPrice(text.replace(/\s/g, ""))}
              keyboardType="numeric"
            />
            {!!price && (
              <Text style={{ marginTop: 6, color: '#28a745' }}>{formatPriceInWords(price)}</Text>
            )}
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Category</Text>
            <View style={styles.categoriesContainer}>
              {categories.map((cat, index) => (
                <TouchableOpacity
                  key={index}
                  style={[styles.categoryChip, category === cat && styles.selectedCategoryChip]}
                  onPress={() => setCategory(cat)}
                >
                  <Text style={[styles.categoryChipText, category === cat && styles.selectedCategoryChipText]}>
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Describe your car, its condition, features, etc."
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>
        </View>
      </>
    )
  }

  const renderStep2 = () => {
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Car Details</Text>

        {/* <View style={styles.inputContainer}>
          <Text style={styles.label}>
            Brand <Text style={styles.required}>*</Text>
          </Text>
          <TextInput style={styles.input} placeholder="e.g. Toyota, Honda, BMW" value={brand} onChangeText={setBrand} />
        </View> */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Year <Text style={styles.required}>*</Text></Text>
          <TouchableOpacity style={styles.input} onPress={() => (navigation as any).navigate('BuyCarforMeYearScreen', { returnTo: 'PostCarAdFeatured' })}>
            <Text style={{ color: selectedYear ? COLORS.black : COLORS.darkGray }}>{selectedYear || 'Select Year'}</Text>
          </TouchableOpacity>
        </View>
        {carChoices.length > 0 && (
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Car Model</Text>
            <View style={{ flexDirection:'row', flexWrap:'wrap' }}>
              {carChoices.map((c, idx) => (
                <View key={`${c.make}-${c.model}-${c.variant||''}-${idx}`} style={{ flexDirection:'row', alignItems:'center', backgroundColor:'#EAF1FF', paddingHorizontal:12, paddingVertical:8, borderRadius:20, marginRight:8, marginBottom:8 }}>
                  <Text style={{ color: COLORS.black }}>{`${c.make} ${c.model}${c.variant? ' ' + c.variant : ''}`}</Text>
                  <TouchableOpacity onPress={() => {
                    setCarChoices(prev => prev.filter((_, i)=> i!==idx))
                    const next = carChoices.filter((_, i)=> i!==idx)
                    setForm(prev => ({ ...prev, make: next[0]?.make || '', model: next[0]? `${next[0].make} ${next[0].model}${next[0].variant? ' '+next[0].variant: ''}` : '', variant: next[0]?.variant || '' }))
                  }} style={{ marginLeft:6 }}>
                    <Text style={{ color: COLORS.primary }}>×</Text>
                  </TouchableOpacity>
                </View>
              ))}
              <TouchableOpacity onPress={() => (navigation as any).navigate('BuyCarforMeBrandFlowScreen', { year: selectedYear, returnTo: 'PostCarAdFeatured' })} style={{ width:36, height:36, borderRadius:18, borderWidth:1, borderColor: COLORS.lightGray, justifyContent:'center', alignItems:'center' }}>
                <Text style={{ fontSize:18, color: COLORS.black }}>+</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
 
          <View style={[styles.inputContainer, styles.halfInput]}>
            <Text style={styles.label}>
              Mileage (km) <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 25000"
              value={mileage}
              onChangeText={setMileage}
              keyboardType="numeric"
            />
            {!!mileage && (
              <Text style={{ marginTop: 6, color: '#28a745' }}>{formatPriceInWords(mileage)}</Text>
            )}
          </View>
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Registration City <Text style={styles.required}>*</Text></Text>
          <View style={[styles.input, { flexDirection:'row', alignItems:'center', justifyContent:'space-between' }]}>
            <TouchableOpacity
              style={{ flex:1 }}
              onPress={() => { if (!registrationCity) { (navigation as any).navigate('BuyCarforMeCityScreen', { returnTo: 'PostCarAdFeatured' }) } }}
              disabled={!!registrationCity}
            >
              <Text style={{ color: registrationCity ? COLORS.black : COLORS.darkGray }}>{registrationCity || 'Select Registration City'}</Text>
            </TouchableOpacity>
            {!!registrationCity && (
              <TouchableOpacity onPress={() => setRegistrationCity("")}
                style={{ marginLeft:10, paddingHorizontal:8, paddingVertical:4, borderRadius:12, backgroundColor:'#F2F2F2' }}>
                <Text style={{ color: COLORS.primary }}>×</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>
            Fuel Type <Text style={styles.required}>*</Text>
          </Text>
          <View style={styles.categoriesContainer}>
            {fuelTypes.map((type, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.categoryChip, fuelType === type && styles.selectedCategoryChip]}
                onPress={() => setFuelType(type)}
              >
                <Text style={[styles.categoryChipText, fuelType === type && styles.selectedCategoryChipText]}>
                  {type}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>
            Transmission <Text style={styles.required}>*</Text>
          </Text>
          <View style={styles.categoriesContainer}>
            {transmissionTypes.map((type, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.categoryChip, transmission === type && styles.selectedCategoryChip]}
                onPress={() => setTransmission(type)}
              >
                <Text style={[styles.categoryChipText, transmission === type && styles.selectedCategoryChipText]}>
                  {type}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
                 <View style={styles.inputContainer}>
                  <Text style={styles.label}>
                    Assembly <Text style={styles.required}>*</Text>
                  </Text>
                  <View style={styles.categoriesContainer}>
                    {assemblyType.map((type, index) => (
                      <TouchableOpacity
                        key={index}
                        style={[styles.categoryChip, assembly === type && styles.selectedCategoryChip]}
                        onPress={() => setAssembly(type)}
                      >
                        <Text style={[styles.categoryChipText, assembly === type && styles.selectedCategoryChipText]}>
                          {type}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Body Type</Text>
          <View style={styles.categoriesContainer}>
            {bodyTypes.map((type, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.categoryChip, bodyType === type && styles.selectedCategoryChip]}
                onPress={() => setBodyType(type)}
              >
                <Text style={[styles.categoryChipText, bodyType === type && styles.selectedCategoryChipText]}>
                  {type}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        <View style={styles.inputContainer}>
  <Text style={styles.label}>Body Color</Text>
  <View style={styles.categoriesContainer}>
    {colors.map((type, index) => (
      <TouchableOpacity
        key={index}
        style={[
          styles.categoryChip,
          color === type && styles.selectedCategoryChip
        ]}
        onPress={() => {
          setColor(type);
          setShowCustomInput(false);
          setCustomColor("");
        }}
      >
        <Text
          style={[
            styles.categoryChipText,
            color === type && styles.selectedCategoryChipText
          ]}
        >
          {type}
        </Text>
      </TouchableOpacity>
    ))}

    {/* "Other" button */}
    <TouchableOpacity
      style={[
        styles.categoryChip,
        showCustomInput && styles.selectedCategoryChip
      ]}
      onPress={() => {
        setColor("Other");
        setShowCustomInput(true);
      }}
    >
      <Text
        style={[
          styles.categoryChipText,
          showCustomInput && styles.selectedCategoryChipText
        ]}
      >
        Other
      </Text>
    </TouchableOpacity>
  </View>

  {/* Custom color input field */}
  {showCustomInput && (
    <TextInput
      style={styles.input}
      placeholder="Enter custom color"
      value={customColor}
      onChangeText={(text) => setCustomColor(text)}
    />
  )}
</View>

          {/* <View style={[styles.inputContainer, styles.halfInput]}>
            <Text style={styles.label}>Color</Text>
            <TextInput style={styles.input} placeholder="e.g. Black" value={color} onChangeText={setColor} />
          </View> */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>
              Engine Capacity <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 2.0"
              value={engineSize}
              onChangeText={setEngineSize}
              keyboardType="numeric"
            />
            {!!engineSize && (
              <Text style={{ marginTop: 6, color: '#28a745' }}>{`${engineSize.replace(/\D/g, '')} cc`}</Text>
            )}
        </View>
      </View>
    )
  }

  const renderStep3 = () => {
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Features</Text>
        <Text style={styles.sectionSubtitle}>Choose car features</Text>
        <TouchableOpacity
          style={[styles.input, { flexDirection:'row', alignItems:'center', justifyContent:'space-between' }]}
          onPress={() => (navigation as any).navigate('FeaturesSelectorScreen', { preselected: selectedFeatureKeys, returnTo: 'PostCarAdFeatured' })}
        >
          <Text style={{ color: selectedFeatureKeys.length ? COLORS.black : COLORS.darkGray }}>
            {selectedFeatureKeys.length ? `${selectedFeatureKeys.length} selected` : 'Select Features'}
          </Text>
          <Ionicons name="chevron-forward" size={18} color={COLORS.darkGray} />
        </TouchableOpacity>
        {selectedFeatureKeys.length > 0 && (
          <View style={{ flexDirection:'row', flexWrap:'wrap', marginTop:8 }}>
            {selectedFeatureKeys.slice(0, 6).map((k) => (
              <View key={k} style={{ backgroundColor:'#EAF1FF', paddingHorizontal:10, paddingVertical:6, borderRadius:16, marginRight:6, marginBottom:6 }}>
                <Text style={{ color: COLORS.black }}>{k.replace(/([A-Z])/g, ' $1').trim()}</Text>
              </View>
            ))}
            {selectedFeatureKeys.length > 6 && (
              <View style={{ backgroundColor:'#EAF1FF', paddingHorizontal:10, paddingVertical:6, borderRadius:16, marginRight:6, marginBottom:6 }}>
                <Text style={{ color: COLORS.black }}>{`+${selectedFeatureKeys.length - 6} more`}</Text>
              </View>
            )}
          </View>
        )}
      </View>
    )
  }

  const renderStep4 = () => {
    return (
      <View style={styles.section}>
        {shouldShowReceiptForCurrentFlow && (
          <>
            <Text style={styles.sectionTitle}>Upload Payment Receipt</Text>
            <Text style={styles.sectionSubtitle}>Upload proof of payment (only 1 image allowed)</Text>
            <View style={styles.imagesContainer}>
              {!invoiceImage ? (
                <TouchableOpacity style={styles.addImageButton} onPress={pickInvoiceImage}>
                  <Ionicons name="document-text-outline" size={32} color={COLORS.darkGray} />
                  <Text style={styles.addImageText}>Upload Receipt</Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.imageContainer}>
                  <Image source={{ uri: invoiceImage }} style={styles.image} />
                  <TouchableOpacity style={styles.removeImageButton} onPress={removeInvoiceImage}>
                    <Ionicons name="close-circle" size={24} color={COLORS.primary} />
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </>
        )}
        {!shouldShowReceiptForCurrentFlow && hasDealerPackage && (dealerAdsRemaining ?? 0) > 0 && (
          <View style={[styles.noticeBox, { backgroundColor: '#E9F7EF', borderColor: '#B5E0C7' }]}> 
            <Text style={styles.noticeTitle}>Dealer package detected</Text>
            <Text style={styles.noticeText}>You have {dealerAdsRemaining} ad(s) remaining in your dealer package. Payment receipt is not required for this ad.</Text>
          </View>
        )}
        <Text style={styles.sectionTitle}>Contact Information</Text>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Select City <Text style={styles.required}>*</Text></Text>
          <View style={[styles.input, { flexDirection:'row', alignItems:'center', justifyContent:'space-between' }]}>
            <TouchableOpacity
              style={{ flex:1 }}
              onPress={() => { if (!adCity) { (navigation as any).navigate('BuyCarforMeLocationScreen', { returnTo: 'PostCarAdFeatured' }) } }}
              disabled={!!adCity}
            >
              <Text style={{ color: adCity ? COLORS.black : COLORS.darkGray }}>{adCity || 'Select City'}</Text>
            </TouchableOpacity>
            {!!adCity && (
              <TouchableOpacity onPress={() => { setAdCity(''); setLocation('') }}
                style={{ marginLeft:10, paddingHorizontal:8, paddingVertical:4, borderRadius:12, backgroundColor:'#F2F2F2' }}>
                <Text style={{ color: COLORS.primary }}>×</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Select Area</Text>
          <View style={[styles.input, { flexDirection:'row', alignItems:'center', justifyContent:'space-between' }]}
          >
            <TouchableOpacity
              style={{ flex:1 }}
              onPress={() => { if (adCity && !location) { (navigation as any).navigate('AreaSelectorScreen', { city: adCity, returnTo: 'PostCarAdFeatured' }) } }}
              disabled={!adCity || !!location}
            >
              <Text style={{ color: location ? COLORS.black : (adCity ? COLORS.darkGray : '#BDBDBD') }}>{location || (adCity ? 'Select Area' : 'Select city first')}</Text>
            </TouchableOpacity>
            {!!location && (
              <TouchableOpacity onPress={() => setLocation('')}
                style={{ marginLeft:10, paddingHorizontal:8, paddingVertical:4, borderRadius:12, backgroundColor:'#F2F2F2' }}>
                <Text style={{ color: COLORS.primary }}>×</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Preferred Contact Method</Text>
          <View style={styles.contactMethodContainer}>
            <TouchableOpacity
              style={[styles.contactMethodOption, preferredContact === "phone" && styles.selectedContactMethod]}
              onPress={() => setPreferredContact("phone")}
            >
              <Ionicons
                name="call-outline"
                size={20}
                color={preferredContact === "phone" ? COLORS.white : COLORS.darkGray}
              />
              <Text
                style={[styles.contactMethodText, preferredContact === "phone" && styles.selectedContactMethodText]}
              >
                Phone
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.contactMethodOption, preferredContact === "whatsapp" && styles.selectedContactMethod]}
              onPress={() => setPreferredContact("whatsapp")}
            >
              <FontAwesome5
                name="whatsapp"
                size={20}
                color={preferredContact === "whatsapp" ? COLORS.white : COLORS.darkGray}
              />
              <Text
                style={[styles.contactMethodText, preferredContact === "whatsapp" && styles.selectedContactMethodText]}
              >
                WhatsApp
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.contactMethodOption, preferredContact === "both" && styles.selectedContactMethod]}
              onPress={() => setPreferredContact("both")}
            >
              <Ionicons
                name="options-outline"
                size={20}
                color={preferredContact === "both" ? COLORS.white : COLORS.darkGray}
              />
              <Text style={[styles.contactMethodText, preferredContact === "both" && styles.selectedContactMethodText]}>
                Both
              </Text>
            </TouchableOpacity>
          </View>
        </View>

      </View>
      
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.black} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Sell Your Car</Text>
        <View style={{ width: 24 }} />
      </View>

      {renderStepIndicator()}

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.keyboardAvoidingView}>
        <ScrollView
          ref={scrollRef}
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}
          {currentStep === 4 && renderStep4()}

          <View style={styles.buttonContainer}>
            {currentStep > 1 && (
              <TouchableOpacity style={styles.backStepButton} onPress={handlePreviousStep}>
                <Text style={styles.backStepButtonText}>Back</Text>
              </TouchableOpacity>
            )}

            {currentStep < 4 ? (
              <TouchableOpacity
                style={[styles.nextStepButton, { flex: currentStep > 1 ? 0.48 : 1 }]}
                onPress={handleNextStep}
              >
                <Text style={styles.nextStepButtonText}>Next</Text>
              </TouchableOpacity>
            ) : (
<TouchableOpacity
  style={[styles.submitButton, { flex: currentStep > 1 ? 0.48 : 1 }]}
  onPress={handleSubmit}
  disabled={isLoading} // Optional: disable while loading
>
  {isLoading ? (
    <ActivityIndicator size="small" color="#fff" />
  ) : (
    <Text style={styles.submitButtonText}>Submit Listing</Text>
  )}
</TouchableOpacity>
)}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.black,
  },
  stepIndicatorContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  stepRow: {
    alignItems: "center",
    flex: 1,
  },
  stepCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.lightGray,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
  },
  activeStepCircle: {
    backgroundColor: COLORS.primary,
  },
  stepNumber: {
    fontSize: 14,
    fontWeight: "bold",
    color: COLORS.darkGray,
  },
  activeStepNumber: {
    color: COLORS.white,
  },
  stepText: {
    fontSize: 12,
    color: COLORS.darkGray,
  },
  activeStepText: {
    color: COLORS.primary,
    fontWeight: "500",
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.black,
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: COLORS.darkGray,
    marginBottom: 16,
  },
  imagesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  addImageButton: {
    width: 100,
    height: 100,
    borderWidth: 1,
    borderColor: COLORS.darkGray,
    borderStyle: "dashed",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
    marginBottom: 8,
  },
  addImageText: {
    fontSize: 12,
    color: COLORS.darkGray,
    marginTop: 4,
  },
  imageContainer: {
    width: 100,
    height: 100,
    borderRadius: 8,
    marginRight: 8,
    marginBottom: 8,
    overflow: "hidden",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  removeImageButton: {
    position: "absolute",
    top: 4,
    right: 4,
    backgroundColor: COLORS.white,
    borderRadius: 12,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    color: COLORS.black,
    marginBottom: 8,
  },
  required: {
    color: "red",
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  textArea: {
    height: 100,
    paddingTop: 12,
  },
  categoriesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  categoryChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.lightGray,
    marginRight: 8,
    marginBottom: 8,
  },
  selectedCategoryChip: {
    backgroundColor: COLORS.primary,
  },
  categoryChipText: {
    fontSize: 14,
    color: COLORS.darkGray,
  },
  selectedCategoryChipText: {
    color: COLORS.white,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  halfInput: {
    width: "48%",
  },
  featuresContainer: {
    marginTop: 8,
  },
  featureChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
  },
  selectedFeatureChip: {
    borderColor: COLORS.primary,
    backgroundColor: "rgba(0, 102, 204, 0.05)",
  },
  featureIcon: {
    marginRight: 8,
  },
  featureChipText: {
    fontSize: 14,
    color: COLORS.darkGray,
  },
  selectedFeatureChipText: {
    color: COLORS.black,
  },
  contactMethodContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  contactMethodOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    flex: 1,
    marginRight: 8,
  },
  selectedContactMethod: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  contactMethodText: {
    fontSize: 14,
    color: COLORS.darkGray,
    marginLeft: 6,
  },
  selectedContactMethodText: {
    color: COLORS.white,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
  },
  backStepButton: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.primary,
    flex: 0.48,
    alignItems: "center",
  },
  backStepButtonText: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: "600",
  },
  nextStepButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    flex: 1,
    alignItems: "center",
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  nextStepButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "600",
  },
  submitButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    flex: 1,
    alignItems: "center",
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  submitButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "600",
  },
  dropdown: {
    borderColor: COLORS.lightGray,
    borderWidth: 1,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 10,
    zIndex: 1, // Ensure dropdowns are layered properly
  },
  dropdownContainer: {
    borderColor: "#DDD",
    zIndex: 1000,
  },
  planBadge: {
  backgroundColor: COLORS.primary, // bright color for emphasis
  paddingVertical: 6,
  paddingHorizontal: 12,
  borderRadius: 20,
  alignSelf: "flex-start",
  marginVertical: 8,
},

planText: {
  color: COLORS.white,
  fontWeight: "bold",
  fontSize: 14,
},
  suggestionBox: {
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    borderRadius: 8,
    backgroundColor: COLORS.white,
    marginTop: 6,
  },
  suggestionItem: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  suggestionText: {
    color: COLORS.black,
  },
  planCard: {
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    position: "relative",
  },
  selectedPlanCard: {
    backgroundColor: "#F9ECEC",
    borderColor: COLORS.primary,
    borderWidth: 2,
  },
  recommendedBadge: {
    position: "absolute",
    top: -10,
    right: 16,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
  },
  recommendedText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: "600",
  },
  planTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.black,
    marginBottom: 8,
  },
  planPrice: {
    fontSize: 24,
    fontWeight: "bold",
    color: COLORS.primary,
    marginBottom: 4,
  },
  planDuration: {
    fontSize: 14,
    color: COLORS.darkGray,
    marginBottom: 8,
  },
  planDescription: {
    fontSize: 14,
    color: COLORS.darkGray,
    lineHeight: 20,
  },
  noticeBox: {
    backgroundColor: "#FFF8E5",
    borderColor: "#F3D38C",
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  noticeTitle: {
    color: COLORS.black,
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 4,
  },
  noticeText: {
    color: COLORS.darkGray,
    fontSize: 13,
    lineHeight: 18,
  },

})


export default PostCarAdFeatured;
