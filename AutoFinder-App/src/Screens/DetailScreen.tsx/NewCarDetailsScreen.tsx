import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Image, StyleSheet,Linking , TouchableOpacity, ScrollView, ActivityIndicator, Modal, BackHandler, Platform, Share, Alert } from "react-native";
import Swiper from "react-native-swiper";
import { Entypo, FontAwesome5, Feather, FontAwesome, Ionicons } from "@expo/vector-icons";
import CarDetailsModal from "../../Components/Models/CarDetailsModal";
import ImageViewing from "react-native-image-viewing";
import { API_URL } from '../../../config';
import NewCarDetailsModal from '../../Components/Models/NewCarDetailsModal';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { startConversation, sendMessage as sendChatMessage, getCurrentUserId } from '../../services/chat';
import { generatePropertyMessage, createWhatsAppUrl } from '../../utils/propertyMessageGenerator';
import SimilarCars from '../../Components/SimilarCars';
import { COLORS } from '../../constants/colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const NewCarDetailsScreen = ({ route }: { route: any }) => {
  const WatermarkedImage = (props: any) => (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'black' }}>
      <Image
        {...props}
        style={[
          props.style,
          { resizeMode: 'contain' },
        ]}
      />
      <View pointerEvents="none" style={{ position: 'absolute', inset: 0, justifyContent: 'center', alignItems: 'center' }}>
        <Text
          style={{
            color: 'rgba(255,255,255,0.32)',
            fontSize: 48,
            fontWeight: 'bold',
            transform: [{ rotate: '-45deg' }],
            textShadowColor: 'rgba(0,0,0,0.65)',
            textShadowOffset: { width: 2, height: 2 },
            textShadowRadius: 6,
          }}
        >
          autofinder.pk
        </Text>
      </View>
      <View pointerEvents="none" style={{ position: 'absolute', bottom: 24, right: 24 }}>
        <Text
          style={{
            color: 'rgba(255,255,255,0.45)',
            fontSize: 22,
            fontWeight: '600',
            textShadowColor: 'rgba(0,0,0,0.6)',
            textShadowOffset: { width: 1, height: 1 },
            textShadowRadius: 4,
          }}
        >
          autofinder.pk
        </Text>
      </View>
    </View>
  );
  const navigation: any = useNavigation();
  const insets = useSafeAreaInsets();
  const { carDetails: initialCarDetails } = route.params;
  const [carDetails, setCarDetails] = useState(initialCarDetails);
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isLoadingFavorite, setIsLoadingFavorite] = useState(false);
  const [sellerData, setSellerData] = useState<any>(null);
  const [isOwnProperty, setIsOwnProperty] = useState(false); // Default to false so button shows
  const [viewCount, setViewCount] = useState(carDetails?.views || 0);
  const [callCount, setCallCount] = useState(carDetails?.calls || carDetails?.callClicks || 0);
  const [hasDealerPackage, setHasDealerPackage] = useState<boolean | null>(null);
  const [showBottomButtons, setShowBottomButtons] = useState(true);
  const [inspectionReport, setInspectionReport] = useState<any>(null);
  const [loadingInspectionReport, setLoadingInspectionReport] = useState(false);
  
  // Set inspection report immediately if it's already in initial data
  useEffect(() => {
    if (initialCarDetails?.inspectionReportId && typeof initialCarDetails.inspectionReportId === 'object' && initialCarDetails.inspectionReportId._id) {
      setInspectionReport(initialCarDetails.inspectionReportId);
      console.log('✅ Set inspection report immediately from initial data (NewCar)');
    }
  }, []);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    // Log carDetails when the component mounts
    console.log("🚀 NewCarDetailsScreen - Car Details received:", carDetails);
    console.log("🚀 NewCarDetailsScreen - userId:", carDetails?.userId);
    console.log("🚀 NewCarDetailsScreen - userId type:", typeof carDetails?.userId);
    console.log("🚀 NewCarDetailsScreen - Full carDetails:", JSON.stringify(carDetails, null, 2));
    
    // Debug: Log overview fields
    console.log("🔍 Overview Fields Check:", {
      bodyType: carDetails?.bodyType || carDetails?.bodytype || carDetails?.body_type,
      topSpeed: carDetails?.topSpeed || carDetails?.top_speed || carDetails?.maxSpeed,
      engineType: carDetails?.engineType || carDetails?.engine_type || carDetails?.enginetype,
      transmission: carDetails?.transmission || carDetails?.transmissionType || carDetails?.gearbox,
      engineCapacity: carDetails?.engineCapacity || carDetails?.engine_capacity || carDetails?.capacity,
      fuelType: carDetails?.fuelType || carDetails?.fuel_type || carDetails?.fueltype,
      kmDriven: carDetails?.kmDriven || carDetails?.mileage || carDetails?.km,
      allKeys: Object.keys(carDetails || {})
    });
  }, [carDetails]);
  
  // Fetch complete ad data if ID is available but data is incomplete
  const fetchAdDetails = async (adId: string) => {
    if (!adId) return;
    
    try {
      console.log('🔍 Fetching complete car details for ID:', adId);
      const response = await fetch(`${API_URL}/all_ads/${adId}`);
      
      if (response.ok) {
        const adData = await response.json();
        console.log('✅ Found complete car data:', adData);
        console.log('✅ Car data overview fields:', {
          bodyType: adData.bodyType,
          topSpeed: adData.topSpeed,
          engineType: adData.engineType,
          transmission: adData.transmission,
          fuelType: adData.fuelType,
          horsepower: adData.horsepower,
          power: adData.power
        });
        // Merge with existing data, but keep existing data if it exists
        setCarDetails((prev: any) => {
          const mergedData = {
            ...prev, // Keep existing data (like images) first
            ...adData, // Override with complete data from backend
            images: prev?.images || adData.images || [] // Preserve images
          };
          
          // If inspectionReportId is already populated, set it immediately for instant display
          if (adData.inspectionReportId && typeof adData.inspectionReportId === 'object' && adData.inspectionReportId._id) {
            setInspectionReport(adData.inspectionReportId);
            console.log('✅ Set inspection report immediately from car data (NewCar)');
          }
          
          return mergedData;
        });
      } else {
        console.warn('⚠️ Failed to fetch complete car details:', response.status);
      }
    } catch (error) {
      console.error('❌ Error fetching complete car details:', error);
    }
  };
  
  // Track if we've already attempted to fetch for this ID
  const fetchAttemptedRef = useRef<Set<string>>(new Set());
  
  // Check if we need to fetch complete data - ALWAYS fetch if we have an ID
  useEffect(() => {
    const adId = carDetails?._id || carDetails?.id;
    if (!adId) return;
    
    // Skip if we've already tried to fetch this ID
    if (fetchAttemptedRef.current.has(adId)) {
      return;
    }
    
    // Always fetch complete data to ensure we have all overview fields
    console.log('🔍 Checking if we need to fetch complete data for ID:', adId);
    const hasMinimalData = carDetails?.make || carDetails?.model || carDetails?.price;
    const missingOverviewFields = !carDetails?.bodyType && 
                                   !carDetails?.topSpeed && 
                                   !carDetails?.engineType && 
                                   !carDetails?.transmission &&
                                   !carDetails?.fuelType;
    
    if (hasMinimalData && missingOverviewFields) {
      console.log('⚠️ Missing overview fields, fetching complete data...');
      fetchAttemptedRef.current.add(adId);
      fetchAdDetails(adId);
    } else if (!hasMinimalData) {
      // If we don't even have minimal data, fetch it
      console.log('⚠️ No minimal data, fetching complete data...');
      fetchAttemptedRef.current.add(adId);
      fetchAdDetails(adId);
    }
  }, [carDetails?._id, carDetails?.id]);

  useEffect(() => {
    console.log("Car Details:", carDetails);
    if (!carDetails.description) {
      console.warn("carDetails.description is missing!");
    }
  }, [carDetails]);

  // Monitor sellerData changes
  useEffect(() => {
    console.log("🔄 SellerData state changed:", {
      hasSellerData: !!sellerData,
      sellerId: sellerData?._id,
      sellerName: sellerData?.name,
      phoneNumber: sellerData?.phone,
      fullSellerData: sellerData
    });
  }, [sellerData]);

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
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  // Check if this is the user's own property
  const checkIfOwnProperty = () => {
    const currentUserId = userData?.userId;
    const adUserId = carDetails?.userId || carDetails?.sellerId || carDetails?.postedBy;
    // Convert both to strings for comparison to avoid type mismatch
    const isOwn = currentUserId && adUserId && String(currentUserId) === String(adUserId);
    console.log('🔍 Checking if own property (Premium):', { 
      currentUserId, 
      adUserId, 
      isOwn,
      currentUserIdType: typeof currentUserId,
      adUserIdType: typeof adUserId
    });
    setIsOwnProperty(isOwn || false); // Default to false if check fails
  };

  useEffect(() => {
    if (userData && carDetails) {
      checkIfOwnProperty();
    }
  }, [userData, carDetails]);

  // Fetch inspection report for this car - OPTIMIZED for IMMEDIATE display (no delays)
  useEffect(() => {
    const fetchInspectionReport = async () => {
      if (!carDetails?._id) return;
      
      // PRIORITY 1: If inspectionReportId is already populated (object), use it IMMEDIATELY
      if (carDetails.inspectionReportId && typeof carDetails.inspectionReportId === 'object' && carDetails.inspectionReportId._id) {
        setInspectionReport(carDetails.inspectionReportId);
        console.log('✅ Using populated inspection report immediately (NewCar)');
        setLoadingInspectionReport(false);
        return;
      }
      
      // Start loading only if we need to fetch
      setLoadingInspectionReport(true);
      console.log('🔍 Fetching inspection report for car:', carDetails._id);
      
      // Create timeout promise (5 seconds max)
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout')), 5000)
      );
      
      // PRIORITY 2: Try to fetch by adId first (fastest method) - with timeout
      // Safely convert _id to string to prevent [object Object] errors
      const adIdString = typeof carDetails._id === 'string' ? carDetails._id : 
                        (typeof carDetails._id === 'object' && carDetails._id?.toString ? String(carDetails._id.toString()) : 
                        (carDetails._id?._id ? String(carDetails._id._id) : String(carDetails._id)));
      const fetchByAdId = fetch(`${API_URL}/inspection_report_by_ad/${adIdString}`)
        .then(async (adIdResponse) => {
          if (adIdResponse.ok) {
            const adReportData = await adIdResponse.json();
            if (adReportData.success && adReportData.data) {
              setInspectionReport(adReportData.data);
              console.log('✅ Found inspection report by adId (fast - NewCar)');
              setLoadingInspectionReport(false);
              return true; // Success
            }
          }
          return false;
        })
        .catch(() => false);
      
      // PRIORITY 3: If car has inspectionReportId as string, fetch it directly - with timeout
      let fetchByReportId = Promise.resolve(false);
      if (carDetails.inspectionReportId && typeof carDetails.inspectionReportId === 'string') {
        fetchByReportId = fetch(`${API_URL}/inspection_report/${carDetails.inspectionReportId}`)
          .then(async (reportResponse) => {
            if (reportResponse.ok) {
              const reportData = await reportResponse.json();
              const report = reportData.data || reportData;
              setInspectionReport(report);
              console.log('✅ Found inspection report linked to car ad (by report ID - NewCar)');
              setLoadingInspectionReport(false);
              return true; // Success
            }
            return false;
          })
          .catch(() => false);
      }
      
      // PRIORITY 4: If inspectionReportId is object but not populated, try to get inspectionId - with timeout
      let fetchByInspectionId = Promise.resolve(false);
      if (carDetails.inspectionReportId && typeof carDetails.inspectionReportId === 'object') {
        const inspectionId = carDetails.inspectionReportId.inspectionId || carDetails.inspectionReportId._id;
        if (inspectionId) {
          fetchByInspectionId = fetch(`${API_URL}/inspection_report/${inspectionId}`)
            .then(async (reportResponse) => {
              if (reportResponse.ok) {
                const reportData = await reportResponse.json();
                setInspectionReport(reportData.data || reportData);
                console.log('✅ Found inspection report linked to car ad (by inspection ID - NewCar)');
                setLoadingInspectionReport(false);
                return true; // Success
              }
              return false;
            })
            .catch(() => false);
        }
      }
      
      // Try all methods in parallel with timeout - whichever succeeds first wins
      try {
        const result = await Promise.race([
          Promise.all([fetchByAdId, fetchByReportId, fetchByInspectionId]).then(results => results.some(r => r === true)),
          timeoutPromise
        ]);
        
        if (!result) {
          console.log('ℹ️ No inspection report found (timeout or not found - NewCar)');
          setLoadingInspectionReport(false);
        }
      } catch (error) {
        console.warn('⚠️ Inspection report fetch timeout or error (NewCar):', error);
        setLoadingInspectionReport(false);
      }
    };

    // Fetch immediately when carDetails._id is available
    if (carDetails?._id) {
      fetchInspectionReport();
    }
  }, [carDetails?._id, carDetails?.inspectionReportId]);

  // Fetch user dealer package info
  useEffect(() => {
    const fetchUserPackageInfo = async () => {
      if (!userData?.userId) {
        setHasDealerPackage(false);
        return;
      }

      try {
        const response = await fetch(`${API_URL}/mobile/user-mobile-packages/${userData.userId}`);
        const text = await response.text();
        let data: { success?: boolean; packages?: any[] } = { success: false, packages: [] };
        try {
          if (text && text.trim().startsWith("{")) {
            data = JSON.parse(text);
          }
        } catch (_) {
          return;
        }
        
        if (data.success && data.packages && data.packages.length > 0) {
          // Check if user has any active dealer package
          const hasActivePackage = data.packages.some((pkg: any) => pkg.isActive);
          setHasDealerPackage(hasActivePackage);
        } else {
          setHasDealerPackage(false);
        }
      } catch (error) {
        console.error("Error fetching user package info:", error);
        setHasDealerPackage(false);
      }
    };

    fetchUserPackageInfo();
  }, [userData]);

  // Track view when component loads
  useEffect(() => {
    const trackView = async () => {
      if (!carDetails?._id) return;
      try {
        // Safely convert _id to string to prevent [object Object] errors
        let adIdString: string;
        try {
          if (typeof carDetails._id === 'string') {
            adIdString = carDetails._id;
          } else if (typeof carDetails._id === 'object' && carDetails._id) {
            if (carDetails._id.toString && typeof carDetails._id.toString === 'function') {
              const str = String(carDetails._id.toString());
              adIdString = str !== '[object Object]' ? str : (carDetails._id._id ? String(carDetails._id._id) : String(carDetails._id));
            } else {
              adIdString = carDetails._id._id ? String(carDetails._id._id) : String(carDetails._id);
            }
          } else {
            adIdString = String(carDetails._id);
          }
        } catch (e) {
          console.error('Error converting _id to string:', e);
          return; // Skip if ID conversion fails
        }
        const response = await fetch(`${API_URL}/track-ad-view/${adIdString}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: userData?.userId || 'anonymous' })
        });
        if (response.ok) {
          const data = await response.json();
          setViewCount(data.views);
          console.log('✅ View tracked:', data.views);
        }
      } catch (error) {
        console.error("Error tracking view:", error);
      }
    };
    trackView();
  }, [carDetails?._id]);

  // Fetch seller data when carDetails changes
  useEffect(() => {
    const fetchSellerData = async () => {
      try {
        console.log('🔍 CarDetails changed:', carDetails);
        console.log('🔍 CarDetails.userId:', carDetails?.userId);
        console.log('🔍 CarDetails.userId type:', typeof carDetails?.userId);
        
        // Check if userId is already populated with user data
        if (carDetails && carDetails.userId && typeof carDetails.userId === 'object') {
          console.log('🔍 userId is populated object with user data:', carDetails.userId);
          console.log('🔍 Available fields in userId:', Object.keys(carDetails.userId));
          console.log('🔍 userId.phone:', carDetails.userId.phone);
          console.log('🔍 userId.phoneNumber:', carDetails.userId.phoneNumber);
          console.log('🔍 userId.mobile:', carDetails.userId.mobile);
          console.log('🔍 userId.name:', carDetails.userId.name);
          console.log('🔍 userId.email:', carDetails.userId.email);
          
          // Extract user information directly from populated userId
          const userInfo = {
            _id: carDetails.userId._id || carDetails.userId.id,
            name: carDetails.userId.name || carDetails.userId.fullName || 'Unknown User',
            email: carDetails.userId.email || carDetails.userId.emailAddress || 'No email',
            phone: carDetails.userId.phone || carDetails.userId.phoneNumber || carDetails.userId.mobile || 'No phone'
          };
          
          console.log('✅ User info extracted from populated userId:', userInfo);
          
          // If phone is not available in populated data, try to fetch via API
          if (!userInfo.phone || userInfo.phone === 'No phone') {
            console.log('❌ No phone in populated data, trying API fetch...');
            const userId = carDetails.userId._id || carDetails.userId.id;
            if (userId) {
              console.log('🔍 Fetching user data via API for userId:', userId);
              console.log('🔍 userId type before conversion:', typeof userId);
              
              // Ensure userId is a string, not an object
              const userIdString = String(userId);
              console.log('🔍 userId after string conversion:', userIdString);
              console.log('🔍 userIdString type:', typeof userIdString);
              
              // Try to fetch user data via API (same logic as admin dashboard)
              try {
                console.log('🔍 Fetching phone for userId:', userIdString);
                
                // Try multiple API endpoints - starting with the correct one
                const endpoints = [
                  `${API_URL}/users/${userIdString}`, // This is the correct endpoint based on backend
                  `${API_URL}/user/${userIdString}`,
                  `${API_URL}/api/user/${userIdString}`,
                  `${API_URL}/api/users/${userIdString}`,
                  `${API_URL}/api/users/get/${userIdString}`,
                  `${API_URL}/users/get/${userIdString}`
                ];
                
                let apiUserData = null;
                let lastError = null;
                
                for (const endpoint of endpoints) {
                  try {
                console.log("🔍 Trying endpoint:", endpoint);
                console.log("🔍 API_URL:", API_URL);
                console.log("🔍 userIdString:", userIdString);
                console.log("🔍 userIdString type:", typeof userIdString);
                console.log("🔍 Full endpoint URL:", endpoint);
                
                const response = await fetch(endpoint, {
                  method: 'GET',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                });
                    console.log("📞 API Response status:", response.status);
                    
                    if (response.ok) {
                      apiUserData = await response.json();
                      console.log("📞 User data received:", apiUserData);
                      break;
                    } else {
                      console.log("❌ Endpoint failed with status:", response.status);
                      const errorText = await response.text();
                      console.log("❌ Error response:", errorText);
                    }
                  } catch (error) {
                    console.log("❌ Endpoint failed:", endpoint, error);
                    lastError = error;
                  }
                }
                
                if (apiUserData) {
                  // Try different phone field names - 'phone' is the primary field in User model
                  const phoneFields = ['phone', 'phoneNumber', 'mobile', 'contact', 'phone_number', 'mobileNumber'];
                  let phoneNumber = null;
                  
                  for (const field of phoneFields) {
                    if (apiUserData[field] && apiUserData[field].trim() !== '') {
                      phoneNumber = apiUserData[field].trim();
                      console.log(`✅ Phone number found in field '${field}':`, phoneNumber);
                      break;
                    }
                  }
                  
                  const apiUserInfo = {
                    _id: apiUserData._id || apiUserData.id,
                    name: apiUserData.name || apiUserData.fullName || userInfo.name,
                    email: apiUserData.email || apiUserData.emailAddress || userInfo.email,
                    phone: phoneNumber || 'No phone'
                  };
                  
                  console.log('✅ Final user info from API:', apiUserInfo);
                  setSellerData(apiUserInfo);
                  return;
                } else {
                  console.log("❌ No user data found from any endpoint");
                  console.log("❌ Last error:", lastError);
                  
                  // If API call fails, still set the user info we have
                  console.log('⚠️ Setting user info from populated data as fallback');
                  setSellerData(userInfo);
                  return;
                }
              } catch (error) {
                console.log('❌ API call error:', error);
                console.log('❌ Error message:', (error as Error).message);
                
                // If API call fails, still set the user info we have
                console.log('⚠️ Setting user info from populated data as fallback');
                setSellerData(userInfo);
                return;
              }
            }
          }
          
          setSellerData(userInfo);
          return;
        }
        
        // Get seller ID from car details - ensure it's a string
        let sellerId = carDetails?.userId || carDetails?.sellerId || carDetails?.postedBy;
        
        // If sellerId is an object, extract the _id field
        if (sellerId && typeof sellerId === 'object') {
          sellerId = sellerId._id || sellerId.id;
        }
        
        // Ensure sellerId is a string
        sellerId = sellerId ? String(sellerId) : null;
        
        console.log("🔍 DEBUG: fetchSellerData called with carDetails:", {
          carId: carDetails?._id,
          carTitle: carDetails?.title || `${carDetails?.make} ${carDetails?.model}`,
          userId: carDetails?.userId,
          extractedSellerId: sellerId,
          isFromNewCar: !carDetails?.userId, // Check if this is from New_Car collection
          isFromFreeAds: !!carDetails?.userId, // Check if this is from Free_Ads collection
          isOwnAd: carDetails?.isOwnAd, // Check if this is user's own ad
          currentUserId: carDetails?.currentUserId, // Current user ID
          // Show ALL available fields to find seller info
          allCarFields: Object.keys(carDetails || {}),
          fullCarDetails: carDetails
        });
        
        console.log("🔍 Current logged-in user ID:", userData?.userId);
        console.log("🔍 Seller ID (raw):", carDetails?.userId);
        console.log("🔍 Seller ID (extracted):", sellerId);
        console.log("🔍 Are they the same?", userData?.userId === sellerId);
        
        if (sellerId) {
          console.log("📞 Fetching seller data for ID:", sellerId);
          console.log("📞 Seller ID type:", typeof sellerId);
          
          // Try public seller-info first (no auth), then other endpoints
          const endpoints = [
            `${API_URL}/users/${sellerId}/seller-info`,
            `${API_URL}/users/${sellerId}`,
            `${API_URL}/user/${sellerId}`,
            `${API_URL}/api/user/${sellerId}`,
            `${API_URL}/api/users/${sellerId}`,
            `${API_URL}/api/users/get/${sellerId}`,
            `${API_URL}/users/get/${sellerId}`
          ];
          
          let sellerInfo = null;
          for (const endpoint of endpoints) {
            try {
              console.log(`🔍 Trying endpoint: ${endpoint}`);
              const response = await fetch(endpoint, {
                headers: {
                  'Content-Type': 'application/json',
                },
              });
              
              if (response.ok) {
                const data = await response.json();
                console.log(`✅ User data fetched from ${endpoint}:`, data);
                
                sellerInfo = {
                  _id: data._id || data.id,
                  name: data.name || data.fullName || 'Unknown User',
                  email: data.email || data.emailAddress || 'No email',
                  phone: data.phone || data.phoneNumber || data.mobile || data.contact || data.phone_number || data.mobileNumber || 'No phone'
                };
                
                console.log("✅ Seller data processed:", sellerInfo);
                setSellerData(sellerInfo);
                return;
              } else {
                console.log(`❌ Endpoint ${endpoint} failed with status: ${response.status}`);
              }
            } catch (error) {
              console.log(`❌ Error with endpoint ${endpoint}:`, error);
            }
          }
          
          if (!sellerInfo) {
            console.error("❌ Failed to fetch seller data from all endpoints");
            console.error("❌ Seller ID was:", sellerId);
          }
        } else {
          console.log("❌ No seller ID found in car details");
          console.log("❌ Available fields:", {
            userId: carDetails?.userId,
            allFields: Object.keys(carDetails || {})
          });
          console.log("❌ Full carDetails object:", carDetails);
          
          // Check if this might be the current user's own ad
          console.log("🔍 Checking if this might be current user's ad...");
          console.log("🔍 Current logged-in user ID:", userData?.userId);
          
          // Check if this is the user's own ad
          if (carDetails?.isOwnAd) {
            console.log("🏠 VIEWING OWN AD: Using current user data as seller data");
            console.log("🏠 Current user phone:", userData?.phone);
            setSellerData({
              _id: userData?.userId,
              name: userData?.name || "You",
              phone: userData?.phone,
              email: userData?.email,
              isPlaceholder: false,
              isOwnAd: true // Flag to indicate this is user's own ad
            });
          } else {
          // Try to fetch seller data from backend using car ID
          if (carDetails?._id || carDetails?.carId || carDetails?.id) {
            const carId = carDetails._id || carDetails.carId || carDetails.id;
            console.log("🔍 No userId found, trying to fetch from backend using car ID:", carId);
            
            try {
              const response = await fetch(`${API_URL}/new_cars/public`);
              if (response.ok) {
                const cars = await response.json();
                const matchingCar = cars.find((car: any) => car._id === carId);
                
                if (matchingCar && matchingCar.userId) {
                  console.log("✅ Found matching car in backend data:", matchingCar);
                  
                  if (typeof matchingCar.userId === 'object') {
                    const userInfo = {
                      _id: matchingCar.userId._id || matchingCar.userId.id,
                      name: matchingCar.userId.name || matchingCar.userId.fullName || 'Unknown User',
                      email: matchingCar.userId.email || matchingCar.userId.emailAddress || 'No email',
                      phone: matchingCar.userId.phone || matchingCar.userId.phoneNumber || matchingCar.userId.mobile || 'No phone'
                    };
                    
                    console.log("✅ User info extracted from backend data:", userInfo);
                    setSellerData(userInfo);
                    return;
                  } else {
                    // Fetch user data via API
                    const userResponse = await fetch(`${API_URL}/users/${matchingCar.userId}/seller-info`);
                    if (userResponse.ok) {
                      const userData = await userResponse.json();
                      setSellerData({
                        _id: userData._id,
                        name: userData.name || 'Unknown User',
                        email: userData.email || 'No email',
                        phone: userData.phone || 'No phone'
                      });
                      return;
                    }
                  }
                }
              }
            } catch (error) {
              console.error("❌ Error fetching car data from backend:", error);
            }
          }
          
            // For New_Car ads without userId, we can't fetch seller data
            // This is a limitation of the current system
            console.log("⚠️ This appears to be a New_Car ad without seller ID");
            console.log("⚠️ Contact information is not available for this ad");
            
            // Set a placeholder seller data to show that contact is not available
            setSellerData({
              _id: null,
              name: "Contact Not Available",
              phone: null,
              email: null,
              isPlaceholder: true
            });
          }
        }
      } catch (error) {
        console.error("❌ Error fetching seller data:", error);
      }
    };
  
    fetchSellerData();
  }, [carDetails, userData]);

  
  const [modalVisible, setModalVisible] = useState(false);
  const [visible, setVisible] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Handle Android back button for image modal
  useEffect(() => {
    if (Platform.OS === 'android') {
      const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
        if (visible) {
          setVisible(false);
          return true; // Prevent default back behavior
        }
        return false; // Allow default back behavior
      });

      return () => backHandler.remove();
    }
  }, [visible]);
  const formatDate = (date: any) => {
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    return new Date(date).toLocaleDateString(undefined, options);
  };
  
  
   const images = (carDetails?.images && Array.isArray(carDetails.images)) ? carDetails.images : [];

  const [expanded, setExpanded] = useState(false);
  const toggleExpand = () => setExpanded(!expanded);
   useEffect(() => {
      if (userData && carDetails?.favoritedBy) {
        const isAlreadyFavorited = carDetails.favoritedBy.includes(userData.userId);
        setIsFavorite(isAlreadyFavorited);
      }
    }, [userData, carDetails]);
    
    const toggleFavorite = async () => {
      if (!userData?.userId || !carDetails?._id) {
        console.warn("User ID or Car ID not found. Cannot toggle favorite.");
        return;
      }
      setIsLoadingFavorite(true);
      try {
        console.log("Toggling favorite for:", carDetails._id, "User ID:", userData.userId);
    
        const response = await fetch(`${API_URL}/toggle_favorite`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ adId: carDetails._id, userId: userData.userId }),
        });
    
        // Check if response is JSON before parsing
        const contentType = response.headers.get("content-type");
        let data;
        
        if (contentType && contentType.includes("application/json")) {
          data = await response.json();
        } else {
          // If not JSON, read as text to see what we got
          const text = await response.text();
          console.error("❌ Non-JSON response from toggle_favorite:", text.substring(0, 200));
          throw new Error(`Server returned non-JSON response: ${response.status} ${response.statusText}`);
        }
    
        if (response.ok) {
          setIsFavorite(!isFavorite);
          console.log("✅ Favorite state updated successfully.");
        } else {
          console.warn("⚠️ Favorite toggle failed:", data?.message || "Unknown error");
        }
      } catch (error: any) {
        console.error("❌ Error toggling favorite:", error?.message || error);
        if (error?.message?.includes("non-JSON")) {
          console.error("⚠️ Server may be returning an error page. Check API endpoint.");
        }
      } finally {
        setIsLoadingFavorite(false);
      }
    };

  // Track call when button is clicked
  const trackCall = async () => {
    if (!carDetails?._id) return;
    try {
      const response = await fetch(`${API_URL}/track-ad-call/${carDetails._id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: userData?.userId || 'anonymous' })
      });
      if (response.ok) {
        const data = await response.json();
        setCallCount(data.calls || data.callClicks || 0);
        console.log('✅ Call tracked:', data.calls || data.callClicks);
      }
    } catch (error) {
      console.error("Error tracking call:", error);
    }
  };

  // Helper functions for contact actions
  const handleCall = () => {
    console.log("📞 Call button pressed!");
    console.log("📞 Current sellerData state:", sellerData);
    console.log("📞 Phone number from sellerData:", sellerData?.phone);
    
    // Track call count
    trackCall();
    
    // Check if this is a placeholder seller data
    if (sellerData?.isPlaceholder) {
      console.log("⚠️ Contact not available - this is a New_Car ad without seller ID");
      alert("Contact information is not available for this ad. This appears to be a dealer listing.");
      return;
    }
    
    // Check if this is user's own ad
    if (sellerData?.isOwnAd) {
      console.log("🏠 Calling your own phone number (viewing own ad)");
    }
    // Check if this is using current user data (temporary solution)
    else if (sellerData?.isCurrentUser) {
      console.log("🔄 Using current user's phone number (temporary solution)");
    }
    
    const phoneNumber = sellerData?.phone;
    console.log("📞 Call button pressed - Seller data:", {
      hasSellerData: !!sellerData,
      sellerId: sellerData?._id,
      sellerName: sellerData?.name,
      phoneNumber: phoneNumber,
      fullSellerData: sellerData
    });
    
    if (phoneNumber) {
      // Remove all non-digit characters and leading zeros, then format to +92
      let cleanNumber = phoneNumber.replace(/\D/g, ''); // Remove all non-digits
      cleanNumber = cleanNumber.replace(/^0+/, ''); // Remove leading zeros
      
      // If it doesn't start with 92, add it
      if (!cleanNumber.startsWith('92')) {
        cleanNumber = '92' + cleanNumber;
      }
      
      // Add + prefix
      const formattedNumber = '+' + cleanNumber;
      
      console.log("📞 Original phone number:", phoneNumber);
      console.log("📞 Cleaned phone number:", cleanNumber);
      console.log("📞 Final formatted number:", formattedNumber);
      console.log("📞 Calling seller with formatted number:", formattedNumber);
      
      Linking.openURL(`tel:${formattedNumber}`);
    } else {
      console.log("❌ No phone number available for seller");
      console.log("❌ SellerData is:", sellerData);
      alert("Seller's phone number is not available");
    }
  };

  const handleWhatsApp = () => {
    console.log("💬 WhatsApp button pressed!");
    console.log("💬 Current sellerData state:", sellerData);
    console.log("💬 Phone number from sellerData:", sellerData?.phone);
    
    // Check if this is a placeholder seller data
    if (sellerData?.isPlaceholder) {
      console.log("⚠️ Contact not available - this is a New_Car ad without seller ID");
      alert("Contact information is not available for this ad. This appears to be a dealer listing.");
      return;
    }
    
    // Check if this is user's own ad
    if (sellerData?.isOwnAd) {
      console.log("🏠 WhatsApp your own phone number (viewing own ad)");
    }
    // Check if this is using current user data (temporary solution)
    else if (sellerData?.isCurrentUser) {
      console.log("🔄 Using current user's phone number (temporary solution)");
    }
    
    const phoneNumber = sellerData?.phone;
    console.log("💬 WhatsApp button pressed - Seller data:", {
      hasSellerData: !!sellerData,
      sellerId: sellerData?._id,
      sellerName: sellerData?.name,
      phoneNumber: phoneNumber,
      fullSellerData: sellerData
    });
    
    if (phoneNumber) {
      // Generate property message using utility function
      const propertyMessage = generatePropertyMessage(carDetails);
      
      // Create WhatsApp URL with message using utility function
      const whatsappUrl = createWhatsAppUrl(phoneNumber, propertyMessage);
      
      console.log("💬 Original phone number:", phoneNumber);
      console.log("💬 Property message:", propertyMessage);
      console.log("💬 WhatsApp URL:", whatsappUrl);
      console.log("💬 Opening WhatsApp for seller with property message");
      
      Linking.openURL(whatsappUrl);
    } else {
      console.log("❌ No phone number available for seller");
      console.log("❌ SellerData is:", sellerData);
      alert("Seller's phone number is not available for WhatsApp");
    }
  };

  const shareCar = async () => {
    try {
      const shareUrl = `https://autofinder.pk/new-car/${carDetails._id}`;
      const shareMessage = `Check out this new car: ${carDetails?.make || 'Car'} ${carDetails?.model || ''} ${carDetails?.variant || ''} ${carDetails?.year || ''} for Rs. ${carDetails?.price || '0'} in ${carDetails?.location || carDetails?.city || 'N/A'} on autofinder.pk!\n\nView details: ${shareUrl}`;
      
      await Share.share({
        message: shareMessage,
        url: shareUrl, // For platforms that support URL
      });
    } catch (error) {
      console.log("Error sharing:", error);
    }
  };
    
  return (
    <>
    <View style={styles.mainContainer}>
    <ScrollView 
      ref={scrollViewRef}
      style={styles.container}
      contentContainerStyle={{
        paddingBottom: Platform.OS === 'ios' 
          ? Math.max(insets.bottom, 20) + 65 + 70  // Tab bar + safe area + button height
          : Math.max(insets.bottom, 10) + 60 + 70  // Tab bar + safe area + button height
      }}
      onScroll={(event) => {
        const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
        const isNearBottom = contentOffset.y + layoutMeasurement.height >= contentSize.height - 100;
        setShowBottomButtons(isNearBottom);
      }}
      scrollEventThrottle={16}
    >
      {/* Swiper for Images */}
      <View style={styles.imageContainer}>
      {/* Swiper */}
      <Swiper loop dotStyle={styles.dot} activeDotStyle={styles.activeDot}>
      {images.map((img: any, index: number) => (
    <TouchableOpacity
      key={index}
      style={{ position: 'relative', backgroundColor: '#f0f0f0' }}
      onPress={() => {
        setSelectedIndex(index);
        setVisible(true);
      }}
    >
      <Image 
        source={{ uri: img }}
        style={[styles.image, { backgroundColor: '#e8e8e8' }]}
        defaultSource={require('../../../assets/Other/nodatafound.png')}
      />
      {/* Watermark */}
      <View style={styles.watermark}>
        <View style={styles.watermarkContainer}>
          <Text style={styles.watermarkText}>autofinder.pk</Text>
        </View>
      </View>
      {/* View and Call Icons Overlay - Only show for own ads (My Ads details) */}
      {isOwnProperty && (
        <View style={styles.statsOverlay}>
          <View style={styles.statItem}>
            <FontAwesome name="eye" size={16} color="white" />
            <Text style={styles.statText}>{viewCount}</Text>
          </View>
          <View style={styles.statItem}>
            <FontAwesome name="phone" size={16} color="white" />
            <Text style={styles.statText}>{callCount}</Text>
          </View>
        </View>
      )}
    </TouchableOpacity>
  ))}
</Swiper>

      {/* Back Button and Top Icons (Favorite & Share) */}
       <View style={styles.topIcons}>
        {/* iOS Back Button - Required by Apple Review Guidelines */}
        {Platform.OS === 'ios' && (
          <TouchableOpacity 
            style={[styles.icon, styles.backButton]} 
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="arrow-back" size={24} color="black" />
          </TouchableOpacity>
        )}
        <View style={{ flex: 1 }} />
        <TouchableOpacity style={styles.icon} onPress={toggleFavorite} disabled={isLoadingFavorite}>
          {isLoadingFavorite ? (
            <ActivityIndicator size="small" color="red" />
          ) : (
            <Entypo name={isFavorite ? "heart" : "heart-outlined"} size={24} color="red" />
          )}
        </TouchableOpacity>
        <TouchableOpacity style={styles.icon} onPress={shareCar}>
          <Feather name="share-2" size={24} color="black" />
        </TouchableOpacity>
      </View>
    </View>

      {/* Badges Row - Show above price */}
      <View style={styles.badgesRowContainer}>
        {/* Featured Badge - Only show for premium ads, not free ads */}
        {(() => {
          // Check if this is a free ad - NO premium tag for free ads or 525 PKR ads
          const isFreeAd = (carDetails?.category || '') === 'free' || 
                          (carDetails?.adType || '') === 'free' ||
                          (carDetails?.modelType === 'Free') ||
                          (carDetails?.packagePrice === 525) ||
                          (carDetails?.paymentAmount === 525);
          
          const shouldShowPremium = carDetails && carDetails.featured && !isFreeAd;
          return shouldShowPremium;
        })() && (
          <View style={styles.featuredBadge}>
            <Text style={styles.featuredText}>Premium</Text>
          </View>
        )}
        {carDetails && carDetails.isManaged && (
          <View style={styles.managedBadge}>
            <Text style={styles.managedText}>Managed By AutoFinder</Text>
          </View>
        )}
      </View>

      {/* Price */}
      <View style={styles.priceContainer}>
        <Text style={styles.price}>
          PKR {carDetails && carDetails.price ? Number(carDetails.price).toLocaleString('en-US') : '0'}
        </Text>
      </View>


      {/* Car Details */}
      <Text style={styles.carModel}>
        {(() => {
          // Use title if it exists, otherwise construct from parts
          let title = carDetails?.title || '';
          
          // If no title, construct from parts
          if (!title) {
            const make = carDetails?.make || '';
            const model = carDetails?.model || '';
            const variant = carDetails?.variant || '';
            title = `${make} ${model} ${variant}`.trim();
          }
          
          // Remove "Car" word if it appears (case insensitive)
          title = title.replace(/\bCar\b/gi, '').replace(/\s+/g, ' ').trim();
          
          return title || 'Car Details';
        })()}
      </Text>

      <View style={styles.carDetails}>
        <View style={styles.detailItem}>
          <FontAwesome5 name="calendar-alt" size={18} color="#CD0100" />
          <Text style={styles.detailText}>{carDetails?.year || 'N/A'}</Text>
        </View>

        <View style={styles.detailItem}>
          <FontAwesome5 name="tachometer-alt" size={18} color="#CD0100" />
          <Text style={styles.detailText}>
            {(() => {
              const mileage = carDetails?.kmDriven || 
                              carDetails?.mileage || 
                              carDetails?.km || 
                              carDetails?.kilometer ||
                              carDetails?.traveled ||
                              carDetails?.distance ||
                              carDetails?.odometer ||
                              (carDetails?.kmDriven !== undefined && carDetails?.kmDriven !== null ? carDetails.kmDriven : null);
              
              // Handle number or string
              if (mileage !== null && mileage !== undefined && mileage !== '') {
                const mileageNum = typeof mileage === 'string' ? parseFloat(mileage) : mileage;
                if (!isNaN(mileageNum) && mileageNum > 0) {
                  return `${mileageNum.toLocaleString()} km`;
                }
              }
              return 'N/A km';
            })()}
          </Text>
        </View>

        <View style={styles.detailItem}>
          <FontAwesome5 name="globe" size={18} color="#CD0100" />
          <Text style={styles.detailText}>{carDetails?.transmission || 'N/A'}</Text>
        </View>
      </View>

      {/* Location */}
      <View style={styles.locationContainer}>
        <FontAwesome5 name="map-marker-alt" size={18} color="#CD0100" />
        <Text style={styles.locationText} numberOfLines={1}>
          {carDetails?.city || carDetails?.location || carDetails?.registrationCity || 'Location not specified'}
        </Text>
      </View>

      {/* Get this car inspected Button - Prominent Blue Button - Hide if inspection already completed */}
      {carDetails?._id && 
       !inspectionReport && 
       !carDetails?.inspectionReportId && 
       !loadingInspectionReport ? (
        <TouchableOpacity 
          style={styles.inspectButton}
          activeOpacity={0.8}
          onPress={async () => {
            console.log('🔍 Inspection button clicked (Premium):', {
              carId: carDetails?._id,
              isOwnProperty
            });
            
            // Check if user is logged in
            try {
              const storedUserData = await AsyncStorage.getItem('user');
              if (!storedUserData) {
                Alert.alert(
                  "Login Required",
                  "You need to login to request car inspection.",
                  [
                    {
                      text: "Cancel",
                      style: "cancel"
                    },
                    {
                      text: "Login",
                      onPress: () => {
                        navigation.navigate("LoginScreen");
                      }
                    }
                  ]
                );
                return;
              }
            } catch (error) {
              console.error("Error checking login status:", error);
            }

            // Navigate to inspection screen with car details
            navigation.navigate('CarInspection' as any, {
              carDetails: carDetails,
              adId: carDetails?._id || carDetails?.id
            });
          }}
        >
          <Text style={styles.inspectButtonText}>Get this car inspected</Text>
        </TouchableOpacity>
      ) : null}

      {/* Inspection Report Section - Similar to PakWheels */}
      {inspectionReport && (() => {
        // Calculate report age in days
        const reportDate = inspectionReport.createdAt ? new Date(inspectionReport.createdAt) : null;
        let daysOld = 0;
        if (reportDate) {
          const today = new Date();
          const diffTime = today.getTime() - reportDate.getTime();
          daysOld = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        }

        // Don't show report if older than 60 days
        if (daysOld > 60) {
          return null;
        }

        // Calculate category percentage from legacy checklist fields (same logic as PDF)
        const calculateCategoryPct = (categoryName: string, checklistData: any): number => {
          if (!checklistData || typeof checklistData !== 'object') return 0;
          
          if (categoryName === 'Engine / Transmission / Clutch') {
            const engineKeys = ['engineOilLevel', 'engineOilLeakage', 'transmissionOilLeakage', 'coolantLeakage', 'brakeOilLeakage'];
            let engineScore = 0;
            engineKeys.forEach(key => {
              const value = checklistData[key];
              if (value) {
                if (value === 'Complete and Clean') engineScore += 20;
                else if (value === 'Low') engineScore += 15;
                else if (value === 'Dirty') engineScore += 10;
                else if (value === 'Needs Change') engineScore += 0;
                else if (value === 'No Leakage') engineScore += 20;
                else if (value === 'Minor Leakage') engineScore += 15;
                else if (value === 'Major Leakage') engineScore += 10;
                else if (value === 'Severe Leakage') engineScore += 0;
                else if (value === 'Good') engineScore += 20;
                else if (value === 'Fair') engineScore += 15;
                else if (value === 'Poor' || value === 'Critical') engineScore += 0;
              }
            });
            const totalPossibleScore = engineKeys.length * 20;
            return totalPossibleScore > 0 ? Math.round((engineScore / totalPossibleScore) * 100) : 0;
          }
          else if (categoryName === 'Brakes') {
            const keys = ['frontRightDisc','frontLeftDisc','frontRightBrakePad','frontLeftBrakePad','parkingHandBrake'];
            let totalScore = 0;
            keys.forEach(key => {
              const value = checklistData[key];
              if (value) {
                if (value === 'Smooth' || value === 'More than 50%' || value === 'Ok') totalScore += 20;
                else if (value === 'Rough' || value === 'Less than 50%' || value === 'Needs Adjustment') totalScore += 10;
                else if (value === 'Damaged' || value === 'Needs Replacement' || value === 'Not Ok') totalScore += 0;
                else if (value === 'Working' || value === 'Good') totalScore += 20;
                else if (value === 'Fair' || value === '25-50%' || value === 'Minor Issues' || value === 'Needs Attention') totalScore += 10;
                else if (value === 'Less than 25%' || value === 'Not Working' || value === 'Poor') totalScore += 0;
              }
            });
            const totalPossibleScore = keys.length * 20;
            return totalPossibleScore > 0 ? Math.round((totalScore / totalPossibleScore) * 100) : 0;
          }
          else if (categoryName === 'Suspension/Steering') {
            const keys = ['steeringWheelPlay','rightBallJoint','leftBallJoint','rightZLinks','leftZLinks','rightTieRodEnd','leftTieRodEnd','frontRightBoots','frontLeftBoots','frontRightBushes','frontLeftBushes','frontRightShock','frontLeftShock','rearRightBushes','rearLeftBushes','rearRightShock','rearLeftShock'];
            let totalScore = 0;
            keys.forEach(key => {
              const value = checklistData[key];
              if (value) {
                if (value === 'Ok' || value === 'No Damage Found') totalScore += 20;
                else if (value === 'Not Ok' || value === 'Damage Found') totalScore += 10;
                else if (value === 'Needs Replacement' || value === 'Need Replacement' || value === 'Excessive Play') totalScore += 0;
                else if (value === 'Good' || value === 'Working' || value === 'Smooth') totalScore += 20;
                else if (value === 'Fair' || value === 'Minor Issues' || value === 'Needs Attention' || value === 'Slight Play') totalScore += 10;
                else if (value === 'Poor' || value === 'Major Issues' || value === 'Not Working' || value === 'Damaged') totalScore += 0;
              }
            });
            const totalPossibleScore = keys.length * 20;
            return totalPossibleScore > 0 ? Math.round((totalScore / totalPossibleScore) * 100) : 0;
          }
          else if (categoryName === 'Interior') {
            const keys = ['seats', 'dashboard', 'carpet', 'headliner', 'electronics', 'climate','steeringWheelCondition', 'steeringWheelButtons', 'horn', 'lightsLeverSwitch', 'wiperWasherLever','rightSideMirror', 'leftSideMirror', 'rearViewMirrorDimmer','rightSeatAdjusterRecliner', 'leftSeatAdjusterRecliner', 'rightSeatAdjusterLearTrack', 'leftSeatAdjusterLearTrack','rightSeatBelt', 'leftSeatBelt', 'rearSeatBelts', 'gloveBox','frontRightPowerWindow', 'frontLeftPowerWindow', 'rearRightPowerWindow', 'rearLeftPowerWindow','centralLocking', 'interiorLightings', 'dashControlsAC', 'dashControlsDeFog', 'dashControlsHazardLights','dashControlsOthers', 'audioVideo', 'rearViewCamera', 'trunkReleaseLever', 'fuelCapReleaseLever','bonnetReleaseLever', 'sunRoofControlButton'];
            let totalScore = 0;
            let totalFields = keys.length;
            keys.forEach(key => {
              const value = checklistData[key];
              if (!value || (typeof value === 'string' && value.trim() === '')) {
                totalScore += 0;
                return;
              }
              if (value === 'Ok' || value === 'Good' || value === 'Working' || value === 'Excellent' || value === 'Working Properly' || value === 'Showing Reflection' || value === 'Perfect' || value === 'Present' || value === 'Complete') {
                totalScore += 100;
              } else if (value === 'Fair' || value === 'Minor Issues' || value === 'Needs Attention') {
                totalScore += 50;
              } else if (value === 'Poor' || value === 'Major Issues' || value === 'Not Working' || value === 'Bad' || value === 'Missing' || value === 'Not Present') {
                totalScore += 0;
              }
            });
            return Math.round((totalScore / (totalFields * 100)) * 100);
          }
          else if (categoryName === 'AC / Heater') {
            const keys = ['acFitted', 'acOperational', 'blower', 'cooling', 'heating'];
            let totalScore = 0;
            keys.forEach(key => {
              const value = checklistData[key];
              if (value) {
                if (value === 'Yes' || value === 'Excellent Air Throw' || value === 'Excellent' || value === 'Working') totalScore += 100;
                else if (value === 'Fair' || value === 'Good Air Throw' || value === 'Good' || value === 'Minor Issues') totalScore += 50;
                else if (value === 'No' || value === 'Poor Air Throw' || value === 'Poor' || value === 'Not Working') totalScore += 0;
              }
            });
            const totalPossibleScore = keys.length * 100;
            return totalPossibleScore > 0 ? Math.round((totalScore / totalPossibleScore) * 100) : 0;
          }
          else if (categoryName === 'Electrical & Electronics') {
            const keys = ['computerCheck', 'batteryWarningLight', 'oilPressureLowWarningLight', 'temperatureWarningLightGauge','airBagWarningLight', 'powerSteeringWarningLight', 'absWarningLight', 'keyFobBatteryLowLight','batteryVoltage', 'batteryTerminalsCondition', 'batteryCharging', 'alternatorOperation', 'gauges'];
            let totalScore = 0;
            let totalFields = keys.length;
            keys.forEach(key => {
              const value = checklistData[key];
              if (!value || (typeof value === 'string' && value.trim() === '')) {
                totalScore += 0;
                return;
              }
              if (key === 'computerCheck') {
                if (value === 'Ok') totalScore += 100;
                else if (value === 'Fault Found') totalScore += 0;
                else if (value === 'Not Checked') totalScore += 50;
              } else if (['batteryWarningLight', 'oilPressureLowWarningLight', 'temperatureWarningLightGauge', 'airBagWarningLight', 'powerSteeringWarningLight', 'absWarningLight', 'keyFobBatteryLowLight'].includes(key)) {
                if (value === 'Not Present') totalScore += 100;
                else if (value === 'Present') totalScore += 0;
              } else if (key === 'batteryVoltage') {
                const voltage = parseFloat(String(value));
                if (voltage >= 12.6) totalScore += 100;
                else if (voltage >= 12.0) totalScore += 70;
                else if (voltage >= 11.5) totalScore += 40;
                else totalScore += 0;
              } else if (key === 'batteryTerminalsCondition') {
                if (value === 'Ok') totalScore += 100;
                else if (value === 'Corroded' || value === 'Loose') totalScore += 30;
              } else if (key === 'batteryCharging') {
                if (value === 'Ok') totalScore += 100;
                else if (value === 'Not Charging') totalScore += 0;
              } else if (key === 'alternatorOperation') {
                if (value === 'Ok') totalScore += 100;
                else if (value === 'Not Ok') totalScore += 0;
              } else if (key === 'gauges') {
                if (value === 'Working') totalScore += 100;
                else if (value === 'Not Working') totalScore += 0;
              }
            });
            return Math.round((totalScore / (totalFields * 100)) * 100);
          }
          else if (categoryName === 'Exterior & Body') {
            const bodyFrameKeys = ['radiatorCoreSupport','rightStrutTowerApron','leftStrutTowerApron','rightFrontRail','leftFrontRail','cowlPanelFirewall','rightAPillar','leftAPillar','rightBPillar','leftBPillar','rightCPillar','leftCPillar','bootFloor','bootLockPillar','rearSubFrame','frontSubFrame'];
            let bodyFrameScore = 0;
            bodyFrameKeys.forEach(key => {
              const value = checklistData[key];
              if (value) {
                if (value === 'OK') bodyFrameScore += 100;
                else if (value === 'Repair') bodyFrameScore += 50;
                else if (value === 'Damage') bodyFrameScore += 0;
              }
            });
            const bodyFrameTotal = bodyFrameKeys.length * 100;
            const bodyFramePct = bodyFrameTotal > 0 ? (bodyFrameScore / bodyFrameTotal) * 100 : 0;
            const exteriorKeys = ['trunkLock', 'frontWindshieldCondition', 'rearWindshieldCondition', 'frontRightDoorWindow','frontLeftDoorWindow', 'rearRightDoorWindow', 'rearLeftDoorWindow', 'windscreenWiper', 'sunRoofGlass','rightHeadlightWorking', 'leftHeadlightWorking', 'rightHeadlightCondition', 'leftHeadlightCondition','rightTaillightWorking', 'leftTaillightWorking', 'rightTaillightCondition', 'leftTaillightCondition', 'fogLightsWorking'];
            let exteriorScore = 0;
            exteriorKeys.forEach(key => {
              const value = checklistData[key];
              if (value) {
                if (['trunkLock', 'frontWindshieldCondition', 'rearWindshieldCondition', 'frontRightDoorWindow','frontLeftDoorWindow', 'rearRightDoorWindow', 'rearLeftDoorWindow', 'sunRoofGlass'].includes(key)) {
                  if (value === 'Ok') exteriorScore += 100;
                  else if (value === 'Not Ok') exteriorScore += 30;
                  else if (value === 'Damaged' || value === 'Cracked') exteriorScore += 0;
                } else if (key === 'windscreenWiper') {
                  if (value === 'Cleaning Properly') exteriorScore += 100;
                  else if (value === 'Not Working') exteriorScore += 0;
                  else if (value === 'Needs Replacement') exteriorScore += 20;
                } else if (['rightHeadlightWorking', 'leftHeadlightWorking', 'rightTaillightWorking', 'leftTaillightWorking', 'fogLightsWorking'].includes(key)) {
                  if (value === 'Working') exteriorScore += 100;
                  else if (value === 'Not Working') exteriorScore += 0;
                } else if (['rightHeadlightCondition', 'leftHeadlightCondition', 'rightTaillightCondition', 'leftTaillightCondition'].includes(key)) {
                  if (value === 'Ok' || value === 'Good' || value === 'Perfect') exteriorScore += 100;
                  else if (value === 'Fair') exteriorScore += 50;
                  else if (value === 'Damaged') exteriorScore += 0;
                }
              }
            });
            const exteriorTotal = exteriorKeys.length * 100;
            const exteriorPct = exteriorTotal > 0 ? (exteriorScore / exteriorTotal) * 100 : 0;
            return Math.round((bodyFramePct + exteriorPct) / 2);
          }
          else if (categoryName === 'Tyres') {
            const selectionKeys = ['frontRightTyreBrand', 'frontRightTyreTread', 'frontLeftTyreBrand', 'frontLeftTyreTread','rearRightTyreBrand', 'rearRightTyreTread', 'rearLeftTyreBrand', 'rearLeftTyreTread','wheelCaps'];
            let totalScore = 0;
            let totalFields = selectionKeys.length;
            selectionKeys.forEach(key => {
              const value = checklistData[key];
              if (!value || (typeof value === 'string' && value.trim() === '')) {
                totalScore += 0;
                return;
              }
              if (key.includes('Brand')) {
                totalScore += 100;
              } else if (key.includes('Tread')) {
                const valStr = String(value);
                if (valStr.includes('8mm+') || valStr.includes('Excellent')) totalScore += 100;
                else if (valStr.includes('6-8mm') || valStr.includes('Good')) totalScore += 75;
                else if (valStr.includes('4-6mm') || valStr.includes('Fair')) totalScore += 50;
                else if (valStr.includes('2-4mm') || valStr.includes('Poor')) totalScore += 25;
                else if (valStr.includes('1-2mm') || valStr.includes('Critical')) totalScore += 10;
                else if (valStr.includes('Below 1mm') || valStr.includes('Dangerous')) totalScore += 0;
              } else if (key === 'wheelCaps') {
                if (value === 'Present') totalScore += 100;
                else if (value === 'Missing') totalScore += 0;
              }
            });
            return Math.round((totalScore / (totalFields * 100)) * 100);
          }
          return 0;
        };

        // Calculate overall score from all categories (same as PDF)
        const detailedChecklists = {
          'Engine / Transmission / Clutch': (inspectionReport as any).engineTransmissionChecklist,
          'Brakes': (inspectionReport as any).brakesChecklist,
          'Suspension/Steering': (inspectionReport as any).suspensionSteeringChecklist,
          'Interior': (inspectionReport as any).interiorChecklist,
          'AC / Heater': (inspectionReport as any).acHeaterChecklist,
          'Electrical & Electronics': (inspectionReport as any).electricalElectronicsChecklist,
          'Exterior & Body': {
            ...((inspectionReport as any).bodyFrameChecklist || {}),
            ...((inspectionReport as any).exteriorBodyChecklist || {})
          },
          'Tyres': (inspectionReport as any).tyresChecklist
        };
        
        const categoryScores: number[] = [];
        Object.entries(detailedChecklists).forEach(([categoryName, checklistData]: [string, any]) => {
          const percentage = calculateCategoryPct(categoryName, checklistData);
          categoryScores.push(percentage);
        });
        
        const calculatedOverallScore = categoryScores.length > 0 
          ? categoryScores.reduce((sum, score) => sum + score, 0) / categoryScores.length 
          : (inspectionReport.overallScore || 0);

        return (
        <View style={styles.inspectionReportCard}>
          <View style={styles.inspectionReportHeader}>
            <Text style={styles.inspectionReportTitle}>AutoFinder Inspection Report</Text>
            <Text style={styles.learnMoreText}>Learn more</Text>
          </View>
          
          {/* Overall Rating */}
          <View style={styles.overallRatingContainer}>
            <Text style={styles.overallRatingLabel}>Overall Rating</Text>
            <View style={styles.ratingScoreContainer}>
              <Text style={styles.ratingScore}>
                {(calculatedOverallScore / 10).toFixed(1)}/10
              </Text>
              <View style={styles.ratingBarContainer}>
                <View 
                  style={[
                    styles.ratingBar, 
                    { 
                      width: `${calculatedOverallScore}%`,
                      backgroundColor: calculatedOverallScore >= 70 ? '#28a745' : 
                                      calculatedOverallScore >= 50 ? '#ff9800' : '#d32f2f'
                    }
                  ]} 
                />
              </View>
            </View>
          </View>

          {/* Detailed Ratings */}
          {(() => {
            // Use the same calculateCategoryPct function defined above
            // Section name mapping (same as PDF)
            const sectionNames: Record<string, string> = {
              engine: "ENGINE / TRANSMISSION / CLUTCH",
              brakes: "BRAKES",
              suspension: "SUSPENSION / STEERING",
              interior: "INTERIOR",
              ac: "AC / HEATER",
              electrical: "ELECTRICAL & ELECTRONICS",
              exterior: "EXTERIOR & BODY",
              tyres: "TYRES"
            };

            // Map legacy checklist fields to section keys and category names
            const sectionsToShow = [
              { key: 'engine', categoryName: 'Engine / Transmission / Clutch', legacyField: 'engineTransmissionChecklist' },
              { key: 'brakes', categoryName: 'Brakes', legacyField: 'brakesChecklist' },
              { key: 'suspension', categoryName: 'Suspension/Steering', legacyField: 'suspensionSteeringChecklist' },
              { key: 'interior', categoryName: 'Interior', legacyField: 'interiorChecklist' },
              { key: 'ac', categoryName: 'AC / Heater', legacyField: 'acHeaterChecklist' },
              { key: 'electrical', categoryName: 'Electrical & Electronics', legacyField: 'electricalElectronicsChecklist' },
              { key: 'exterior', categoryName: 'Exterior & Body', legacyField: 'exteriorBodyChecklist' },
              { key: 'tyres', categoryName: 'Tyres', legacyField: 'tyresChecklist' }
            ];

            // Calculate ratings from legacy checklist fields
            const sectionsWithRatings = sectionsToShow.map(section => {
              let checklistData = (inspectionReport as any)[section.legacyField];
              
              // For exterior, merge bodyFrameChecklist and exteriorBodyChecklist
              if (section.key === 'exterior') {
                const bodyFrame = (inspectionReport as any).bodyFrameChecklist || {};
                const exteriorBody = (inspectionReport as any).exteriorBodyChecklist || {};
                checklistData = { ...bodyFrame, ...exteriorBody };
              }
              
              const percentage = calculateCategoryPct(section.categoryName, checklistData);
              return {
                key: section.key,
                displayName: sectionNames[section.key],
                percentage: percentage
              };
            }).filter(section => section.percentage > 0 || (inspectionReport as any)[sectionsToShow.find(s => s.key === section.key)?.legacyField || '']);

            // If no sections found, return null
            if (sectionsWithRatings.length === 0) return null;

            return (
              <View style={styles.detailedRatingsContainer}>
                {sectionsWithRatings.map((section) => {
                  const sectionPercentage = section.percentage;
                  
                  return (
                    <View key={section.key} style={styles.ratingItem}>
                      <View style={styles.ratingItemHeader}>
                        <Text style={styles.ratingItemLabel}>{section.displayName}</Text>
                        <Text style={styles.ratingItemPercentage}>{sectionPercentage}%</Text>
                      </View>
                      <View style={styles.ratingItemBarContainer}>
                        <View 
                          style={[
                            styles.ratingItemBar, 
                            { 
                              width: `${sectionPercentage}%`,
                              backgroundColor: sectionPercentage >= 70 ? '#28a745' : 
                                            sectionPercentage >= 50 ? '#ff9800' : '#d32f2f'
                            }
                          ]} 
                        />
                      </View>
                    </View>
                  );
                })}
              </View>
            );
          })()}

          {/* View Report Button */}
          <TouchableOpacity 
            style={styles.viewReportButton}
            onPress={() => {
                // Redirect to external website for report view
                const targetUrl = 'https://vehiclepk.click/';
                Linking.openURL(targetUrl).catch(() => {
                  Alert.alert('Error', 'Unable to open report link');
                });
            }}
          >
            <Text style={styles.viewReportButtonText}>View Report</Text>
          </TouchableOpacity>

          {/* Report Age Warning - Show if report is older than 45 days */}
          {daysOld >= 45 && (
            <View style={styles.reportAgeWarning}>
              <Text style={styles.reportAgeWarningText}>
                This report is {daysOld} {daysOld === 1 ? 'Day' : 'Days'} old. For the latest report,{' '}
                <Text 
                  style={styles.getInspectedLink}
                  onPress={async () => {
                    // Check if user is logged in
                    try {
                      const storedUserData = await AsyncStorage.getItem('user');
                      if (!storedUserData) {
                        Alert.alert(
                          "Login Required",
                          "You need to login to request car inspection.",
                          [
                            {
                              text: "Cancel",
                              style: "cancel"
                            },
                            {
                              text: "Login",
                              onPress: () => {
                                navigation.navigate("LoginScreen");
                              }
                            }
                          ]
                        );
                        return;
                      }
                    } catch (error) {
                      console.error("Error checking login status:", error);
                    }

                    // Navigate to inspection screen with car details
                    navigation.navigate('CarInspection' as any, {
                      carDetails: carDetails,
                      adId: carDetails?._id || carDetails?.id
                    });
                  }}
                >
                  Get It Inspected
                </Text>
                {' '}again.
              </Text>
            </View>
          )}

          {/* Inspection Date */}
          {inspectionReport.createdAt && (
            <Text style={styles.inspectionDate}>
              Date of Inspection: {new Date(inspectionReport.createdAt).toLocaleDateString('en-GB', {
                day: 'numeric',
                month: 'short',
                year: 'numeric'
              })}
            </Text>
          )}
        </View>
        );
      })()}

      {/* Divider */}
      <View style={styles.divider} />

      {/* List It For You Section */}
      <View style={styles.sellItForMeCard}>
        <View style={styles.sellItForMeContent}>
          <View style={styles.sellItForMeText}>
            <Text style={styles.sellItForMeTitle}>List It For You</Text>
            <Text style={styles.sellItForMeDescription}>
              Have a car to sell, but no time to bargain best offers?
            </Text>
            <TouchableOpacity style={styles.sellItForMeLink} onPress={() => navigation.navigate('ListItForYouScreen' as any)}>
              <Text style={[styles.sellItForMeLinkText, { color: COLORS.primary }]}>I want experts to sell my car ✨</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.sellItForMeIllustration}>
            <FontAwesome name="car" size={40} color={COLORS.primary} />
          </View>
        </View>
      </View>

      {/* Buy Dealer Package Section - Only show if user hasn't purchased a dealer package and not on iOS */}
      {hasDealerPackage === false && Platform.OS !== 'ios' && (
        <View style={styles.sellItForMeCard}>
          <View style={styles.sellItForMeContent}>
            <View style={styles.sellItForMeText}>
              <Text style={styles.sellItForMeTitle}>Buy Dealer Package</Text>
              <Text style={styles.sellItForMeDescription}>
                Get access to premium features and boost your ads with our dealer packages.
              </Text>
              <TouchableOpacity 
                style={styles.sellItForMeLink} 
                onPress={() => navigation.navigate('PackagesScreen')}
              >
                <Text style={[styles.sellItForMeLinkText, { color: COLORS.primary }]}>View Dealer Packages ✨</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.sellItForMeIllustration}>
              <Ionicons name="bag" size={40} color={COLORS.primary} />
            </View>
          </View>
        </View>
      )}

      {/* Car Overview */}
      <Text style={styles.sectionTitle}>Car Overview</Text>
      <View style={styles.overview}>
        <View style={styles.overviewRow}>
          <Text style={styles.label}>KM Driven</Text>
          <Text style={styles.value}>
            {(() => {
              const mileage = carDetails?.kmDriven || 
                              carDetails?.mileage || 
                              carDetails?.km || 
                              carDetails?.kilometer ||
                              carDetails?.traveled ||
                              carDetails?.distance ||
                              carDetails?.odometer ||
                              (carDetails?.kmDriven !== undefined && carDetails?.kmDriven !== null ? carDetails.kmDriven : null);
              
              // Handle number or string
              if (mileage !== null && mileage !== undefined && mileage !== '') {
                const mileageNum = typeof mileage === 'string' ? parseFloat(mileage) : mileage;
                if (!isNaN(mileageNum) && mileageNum > 0) {
                  return `${mileageNum.toLocaleString()} km`;
                }
              }
              return 'Not specified';
            })()}
          </Text>
        </View>
        <View style={styles.overviewRow}>
          <Text style={styles.label}>Body Type</Text>
          <Text style={styles.value}>
            {(() => {
              const bodyType = carDetails?.bodyType || carDetails?.bodytype || carDetails?.body_type;
              return (bodyType && bodyType !== '' && bodyType !== 'null' && bodyType !== 'undefined') ? String(bodyType) : 'Not specified';
            })()}
          </Text>
        </View>
        <View style={styles.overviewRow}>
          <Text style={styles.label}>Top Speed</Text>
          <Text style={styles.value}>
            {(() => {
              const topSpeed = carDetails?.topSpeed || carDetails?.top_speed || carDetails?.maxSpeed || carDetails?.max_speed;
              if (topSpeed && topSpeed !== '' && topSpeed !== 'null' && topSpeed !== 'undefined') {
                const speedStr = String(topSpeed);
                // Check if it already has a unit
                if (speedStr.toLowerCase().includes('km/h') || speedStr.toLowerCase().includes('kmh')) {
                  return speedStr;
                }
                return `${speedStr} km/h`;
              }
              return 'Not specified';
            })()}
          </Text>
        </View>
        <View style={styles.overviewRow}>
          <Text style={styles.label}>Engine Type</Text>
          <Text style={styles.value}>
            {(() => {
              const engineType = carDetails?.engineType || carDetails?.engine_type || carDetails?.enginetype || carDetails?.engine;
              return (engineType && engineType !== '' && engineType !== 'null' && engineType !== 'undefined') ? String(engineType) : 'Not specified';
            })()}
          </Text>
        </View>
        <View style={styles.overviewRow}>
          <Text style={styles.label}>Transmission</Text>
          <Text style={styles.value}>
            {(() => {
              const transmission = carDetails?.transmission || carDetails?.transmissionType || carDetails?.transmission_type || carDetails?.gearbox;
              return (transmission && transmission !== '' && transmission !== 'null' && transmission !== 'undefined') ? String(transmission) : 'Not specified';
            })()}
          </Text>
        </View>
        <View style={styles.overviewRow}>
          <Text style={styles.label}>Engine Capacity</Text>
          <Text style={styles.value}>
            {(() => {
              // Check multiple field names for engine capacity
              const capacity = carDetails?.engineCapacity || 
                              carDetails?.engine_capacity || 
                              carDetails?.enginecapacity || 
                              carDetails?.capacity ||
                              carDetails?.horsepower || // Sometimes stored as horsepower
                              carDetails?.power; // Sometimes stored as power
              
              if (capacity && capacity !== '' && capacity !== 'null' && capacity !== 'undefined') {
                // If it's a number or numeric string, add 'cc'
                const capacityNum = typeof capacity === 'string' ? parseFloat(capacity) : capacity;
                if (!isNaN(capacityNum) && capacityNum > 0) {
                  // Check if it already has a unit
                  const capacityStr = String(capacity);
                  if (capacityStr.toLowerCase().includes('hp') || capacityStr.toLowerCase().includes('bhp')) {
                    return capacityStr;
                  }
                  return `${capacityNum} cc`;
                }
                return String(capacity);
              }
              return 'Not specified';
            })()}
          </Text>
        </View>
        <View style={styles.overviewRow}>
          <Text style={styles.label}>Fuel Type</Text>
          <Text style={styles.value}>
            {(() => {
              const fuelType = carDetails?.fuelType || carDetails?.fuel_type || carDetails?.fueltype || carDetails?.fuel;
              return (fuelType && fuelType !== '' && fuelType !== 'null' && fuelType !== 'undefined') ? String(fuelType) : 'Not specified';
            })()}
          </Text>
        </View>
        <TouchableOpacity onPress={() => setModalVisible(true)}>
        <Text style={styles.showMore}>Show More</Text>
      </TouchableOpacity>
      </View>
      <View style={styles.divider} />
      <View>
      <Text style={styles.sectionTitle}>Features</Text>
      <View style={styles.featuresWrapper}>
        {(carDetails.features || []).map((feature: any, index: number) => (
          <View key={index} style={styles.featureItem}>
            <View style={styles.iconCircle}>
              <FontAwesome name="check" size={8} color="#fff" />
            </View>
            <Text>{feature}</Text>
          </View>
        ))}
      </View>
    </View>
      <View style={styles.divider} />
      <Text style={styles.sectionTitle}>Description</Text>
      <View style={styles.overview1}>
      <Text style={styles.description}>
  {expanded
    ? (carDetails?.description || 'No description available')
    : (carDetails?.description ? carDetails.description.split(" ").slice(0, 40).join(" ") + "..." : "No description available")
  }
</Text>

        <TouchableOpacity onPress={toggleExpand}>
            <Text style={styles.showMore}>{expanded ? "Show Less" : "Show More"}</Text>
        </TouchableOpacity>
        {carDetails?.dateAdded && (
          <Text style={styles.postedDate}>Posted On: {formatDate(carDetails.dateAdded)}</Text>
        )}
      </View>
      <View style={styles.divider} />
      <Text style={styles.sectionTitle}>Map View</Text>
      <View style={styles.overview2}>
  <Text style={styles.carModel1}>{carDetails?.location || 'Location not specified'}</Text>

</View>
<View style={styles.divider} />

      {/* Seller Information - Hide for Managed by AutoFinder properties */}
      {sellerData && !carDetails?.isManaged && (
        <>
          <Text style={styles.sectionTitle}>Contact Information</Text>
          <View style={[styles.sellerContainer, sellerData.isPlaceholder && styles.sellerContainerPlaceholder]}>
            <View style={styles.sellerInfo}>
              <View style={[styles.sellerAvatar, sellerData.isPlaceholder && styles.sellerAvatarPlaceholder]}>
                <FontAwesome name="user" size={24} color={sellerData.isPlaceholder ? "#999" : "#CD0100"} />
              </View>
              <View style={styles.sellerDetails}>
                <Text style={[styles.sellerName, sellerData.isPlaceholder && styles.sellerNamePlaceholder]}>
                  {sellerData.name || 'Seller'}
                </Text>
                {/* Phone hidden by request */}
                <Text style={styles.sellerEmail}>
                  📧 {sellerData.email || 'Email not available'}
                </Text>
                <Text style={styles.sellerLocation}>
                  📍 {carDetails.location || 'Location not specified'}
                </Text>
                {sellerData.isPlaceholder && (
                  <Text style={styles.sellerNote}>
                    This appears to be a dealer listing without contact information.
                  </Text>
                )}
                {sellerData.isOwnAd && (
                  <Text style={styles.sellerNote}>
                    This is your own ad. You can call or WhatsApp yourself.
                  </Text>
                )}
                {sellerData.isCurrentUser && (
                  <Text style={styles.sellerNote}>
                    Using current user's contact information (temporary solution).
                  </Text>
                )}
              </View>
            </View>
          </View>
          <View style={styles.divider} />
        </>
      )}

<View style={styles.reportContainer}>
  <FontAwesome name="flag" size={24} color="black" /> 
  <Text style={styles.carModel2}>Report an Ad</Text>
</View>

      {/* Similar Cars Section - Hide for Managed by Autofinder properties */}
      {carDetails && carDetails._id && !carDetails.isManaged && (
        <SimilarCars
          currentCarId={carDetails._id}
          make={carDetails.make || ''}
          model={carDetails.model || ''}
          adType="car"
        />
      )}

    </ScrollView>
    <View style={[
        styles.bottomContainer,
        { 
          bottom: Platform.OS === 'ios' 
            ? Math.max(insets.bottom, 20) + 20  // Tab bar height ~20 + safe area (minimal gap)
            : Math.max(insets.bottom, 10) + 15  // Tab bar height ~15 + safe area (minimal gap)
        }
      ]}>
    <TouchableOpacity 
      style={[
        styles.callButton, 
        sellerData?.isPlaceholder && styles.disabledButton
      ]} 
      onPress={handleCall}
      disabled={sellerData?.isPlaceholder}
    >
      <FontAwesome 
        name="phone" 
        size={16} 
        color={sellerData?.isPlaceholder ? "#ccc" : "#FF6B6B"} 
      />
      <Text style={[
        styles.buttonText, 
        sellerData?.isPlaceholder && styles.disabledButtonText
      ]}>
        Call
      </Text>
    </TouchableOpacity>

    <TouchableOpacity 
      style={[
        styles.whatsappButton, 
        sellerData?.isPlaceholder && styles.disabledButton
      ]} 
      onPress={handleWhatsApp}
      disabled={sellerData?.isPlaceholder}
    >
      <FontAwesome 
        name="whatsapp" 
        size={16} 
        color={sellerData?.isPlaceholder ? "#ccc" : "#25D366"} 
      />
      <Text style={[
        styles.buttonText, 
        sellerData?.isPlaceholder && styles.disabledButtonText
      ]}>
        WhatsApp
      </Text>
    </TouchableOpacity>

    <TouchableOpacity style={styles.chatButton} onPress={async () => {
      try {
        if (!carDetails?._id) {
          Alert.alert("Error", "Car details not available.");
          return;
        }
        
        // Extract seller ID and car details before navigation
        const { extractSellerId, extractCarDetails } = require('../../services/chat');
        
        // Extract seller ID (handles populated objects and different field names)
        const sellerId = extractSellerId(carDetails);
        
        if (!sellerId) {
          Alert.alert(
            "Unable to Start Chat",
            "Could not identify the seller. Please try again later.",
            [{ text: "OK" }]
          );
          return;
        }
        
        // Extract car details for initial message
        const carInfo = extractCarDetails(carDetails);
        
        // Navigate to chat with all required data
        navigation.navigate('HomeTabs', { 
          screen: 'Chat', 
          params: { 
            openForAd: true, 
            adId: carDetails._id, 
            sellerId: sellerId,
            carDetails: carDetails,
            propertyDetails: carDetails,
            propertyType: 'new_car',
            carTitle: carInfo.title,
            carPrice: carInfo.price,
            carImage: carInfo.image
          } 
        });
      } catch (error) {
        console.error('Error opening chat:', error);
        Alert.alert("Error", "Failed to open chat. Please try again.");
      }
    }}>
      <Feather name="message-square" size={16} color="#2196F3" />
      <Text style={styles.buttonText}>Chat</Text>
    </TouchableOpacity>
  </View>
  
  <NewCarDetailsModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        carDetails={carDetails || {}}
      />  
  </View>
  
  {/* Fullscreen Image Viewer - Outside mainContainer to render on top */}
  <ImageViewing
    images={images.map((img: any) => ({ uri: img }))}
    imageIndex={selectedIndex}
    visible={visible}
    onRequestClose={() => {
      console.log('🖼️ ImageViewing onRequestClose called - closing image viewer');
      setVisible(false);
    }}
    ImageComponent={WatermarkedImage}
    swipeToCloseEnabled={true}
    doubleTapToZoomEnabled={true}
  />
  </>
  );
};

export default NewCarDetailsScreen;

const styles = StyleSheet.create({
    mainContainer: {
        flex: 1,
      },
  container: {
    flex: 1,
    backgroundColor: "#fff",
    marginBottom:70,
    marginTop:32,
  },
  imageContainer: {
    height: 280,
  },
  image: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  dot: {
    backgroundColor: "gray",
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 3,
  },
  activeDot: {
    backgroundColor: "#CD0100",
    width: 10,
    height: 10,
    borderRadius: 5,
    marginHorizontal: 3,
  },
  
  topIcons: {
    position: "absolute",
    top: 15,
    left: 15,
    right: 15,
    flexDirection: "row",
    gap: 15,
  },
  icon: {
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    padding: 8,
    borderRadius: 20,
  },
  backButton: {
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  price: {
    fontSize: 24,
    fontWeight: "bold",
    color:"#CD0100",
    paddingHorizontal: 15,
    paddingTop: 0,
    paddingBottom: 2,
  },
  carModel: {
    fontSize: 18,
    fontWeight: "500",
    color: "#666",
    paddingHorizontal: 15,
    marginTop: 0,
    paddingTop: 2,
  },
  carModel1: {
    fontSize: 14,
    fontWeight: "500",
    color: "#666",
    paddingVertical: 5,
    marginHorizontal:15
  },
  carModel2: {
    fontSize: 20,
    fontWeight: "600",
    color: "#666",
    marginLeft:10,
    paddingVertical: 25,
    textAlign:"center",
  },
  carDetails: {
    flexDirection: "row",
    flexWrap: "nowrap", // Prevent wrapping - keep all items in one line
    justifyContent: "flex-start", // Aligns items from the start
    gap: 10, // Reduced gap to fit more items in one line
    paddingVertical: 10,
    paddingHorizontal: 10, // Reduced horizontal padding to save space
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4, // Reduced space between icon and text
    flexShrink: 0, // Prevent item from shrinking
  },  
  detailText: {
    fontSize: 14,
    color: "#666",
    flexShrink: 0, // Prevent text from shrinking
  },
  locationContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    paddingHorizontal: 15,
    gap: 8,
    flexWrap: 'wrap',
  },
  locationText: {
    fontSize: 14,
    color: "#666",
    flex: 1,
    flexShrink: 1,
  },
  inspectButton: {
    backgroundColor: "#2196F3", // Blue color like in the image
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginHorizontal: 15,
    marginTop: 12,
    marginBottom: 8,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 10,
    minHeight: 50,
  },
  inspectButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  inspectionReportCard: {
    backgroundColor: '#f4f7ff',
    marginHorizontal: 15,
    marginTop: 15,
    marginBottom: 8,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#dce5ff',
  },
  inspectionReportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  inspectionReportTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  learnMoreText: {
    fontSize: 14,
    color: '#2196F3',
    fontWeight: '600',
  },
  overallRatingContainer: {
    marginBottom: 20,
  },
  overallRatingLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  ratingScoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  ratingScore: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    minWidth: 60,
  },
  ratingBarContainer: {
    flex: 1,
    height: 10,
    backgroundColor: '#e2e8f5',
    borderRadius: 5,
    overflow: 'hidden',
  },
  ratingBar: {
    height: '100%',
    borderRadius: 5,
  },
  detailedRatingsContainer: {
    marginBottom: 16,
  },
  ratingItem: {
    marginBottom: 16,
  },
  ratingItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  ratingItemLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  ratingItemPercentage: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
  },
  ratingItemBarContainer: {
    height: 6,
    backgroundColor: '#e9ecef',
    borderRadius: 3,
    overflow: 'hidden',
  },
  ratingItemBar: {
    height: '100%',
    borderRadius: 3,
  },
  viewReportButton: {
    backgroundColor: '#2196F3',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 12,
  },
  viewReportButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  inspectionDate: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
  },
  reportAgeWarning: {
    backgroundColor: '#FFF9E6',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  reportAgeWarningText: {
    fontSize: 13,
    color: '#333',
    lineHeight: 20,
    textAlign: 'center',
  },
  getInspectedLink: {
    color: '#2196F3',
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  divider: {
    height: 1,
    backgroundColor: "#ddd",
    marginVertical: 15,
    marginHorizontal: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    paddingHorizontal: 15,
  },
  overview: {
    paddingHorizontal: 20,
    paddingVertical: 5,
  },
  overview1: {
    paddingHorizontal: 15,
    paddingVertical: 5,
  },
  overview2: {
  },
  overviewRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 5,
  },
  label: {
    fontSize: 14,
    color: "#666",
  },
  value: {
    fontSize: 14,
    fontWeight: "bold",
  },
  showMore: {
    fontSize: 15,
    fontWeight: "400",
    color: "#CD0100",
    textAlign: "left",
    marginVertical: 5,
  },
  description: {
    fontSize: 14,
    color: "#666",
    lineHeight: 22,
    marginVertical: 5,
  },
  postedDate: {
  fontSize: 14,
  fontWeight: "bold",
  color: "#444",
  marginTop: 10,
},
mapContainer: {
    width: "90%",
    alignSelf:"center",
    height: 200, // Fixed height to ensure visibility
    borderRadius: 10,
    overflow: "hidden",
    marginTop: 10,
  },
  map: {
    flex: 1,
  },
  bottomContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    paddingVertical: 10,
    borderTopWidth: 1,
    borderColor: "#ddd",
    paddingHorizontal: 5, // Small spacing at the sides
    paddingBottom: Platform.OS === 'ios' ? 10 : 8,
    zIndex: 1000, // Ensure buttons stay on top when scrolling
    elevation: Platform.OS === 'android' ? 10 : 0, // Android elevation
  },
  callButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FEE8E8",
    paddingVertical: 12,
    marginLeft:10,
    marginRight: 8,
    width: "30%",
    borderRadius: 15,
  },
  whatsappButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E8FEE8",
    paddingVertical: 12,
    marginHorizontal: 8,
    width: "30%",
    borderRadius: 15,
  },
  chatButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E8F0FE",
    paddingVertical: 12,
    marginRight:10,
    marginLeft: 8,
    width: "30%",
    borderRadius: 15,
  },
  buttonText: {
    color: "#333",
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 10,
  },
  statsOverlay: {
    position: 'absolute',
    bottom: 15,
    right: 15,
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 20,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  reportContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 25,
  },
  badgesRowContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingTop: 10,
    paddingBottom: 5,
  },
  priceContainer: {
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    paddingRight:15,
    paddingTop: 0,
    paddingBottom: 2,
  },
  featuredBadge: {
    backgroundColor: '#FFDF00', 
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 20,
  },
  managedBadge: {
    backgroundColor: '#CD0100', 
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 20,
  },
  featuredText: {
    color: 'black',
    fontWeight: 'bold',
    fontSize: 14,
  },
  managedText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  featureItem: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12
  },
  iconCircle: {
    width: 15,
    height: 15,
    borderRadius: 12,
    backgroundColor: '#CD0100',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8
  },
  featuresWrapper: {
    flexDirection: 'row',
    paddingHorizontal: 15,
    marginTop:10,
    flexWrap: 'wrap',
    justifyContent: 'space-between'
  },
  // Disabled button styles
  disabledButton: {
    backgroundColor: '#ddd',
    borderColor: '#ccc',
  },
  disabledButtonText: {
    color: '#999',
  },
  // Seller Information Styles
  sellerContainer: {
    backgroundColor: '#f8f9fa',
    marginHorizontal: 15,
    borderRadius: 12,
    padding: 15,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  sellerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sellerAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
    borderWidth: 2,
    borderColor: '#CD0100',
  },
  sellerDetails: {
    flex: 1,
  },
  sellerName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  sellerPhone: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  sellerEmail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  sellerLocation: {
    fontSize: 14,
    color: '#666',
  },
  // Placeholder styles for when contact is not available
  sellerContainerPlaceholder: {
    backgroundColor: '#f5f5f5',
    borderColor: '#ddd',
    opacity: 0.8,
  },
  sellerAvatarPlaceholder: {
    borderColor: '#999',
    backgroundColor: '#f0f0f0',
  },
  sellerNamePlaceholder: {
    color: '#666',
  },
  sellerPhonePlaceholder: {
    fontSize: 14,
    color: '#ff6b35',
    fontWeight: '500',
  },
  sellerNote: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
    marginTop: 4,
  },
  sellItForMeCard: {
    backgroundColor: '#fff',
    marginHorizontal: 15,
    marginVertical: 15,
    borderRadius: 8,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sellItForMeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sellItForMeText: {
    flex: 1,
    marginRight: 15,
  },
  sellItForMeTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  sellItForMeDescription: {
    fontSize: 12,
    color: '#666',
    marginBottom: 12,
    lineHeight: 20,
  },
  sellItForMeLink: {
    alignSelf: 'flex-start',
  },
  sellItForMeLinkText: {
    fontSize: 12,
    color: '#4A90E2',
    fontWeight: '600',
  },
  sellItForMeIllustration: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 60,
    height: 60,
    backgroundColor: '#f0f8ff',
    borderRadius: 30,
  },
  watermark: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  watermarkText: {
    color: 'rgba(255, 255, 255, 0.2)',
    fontSize: 20,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  watermarkContainer: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 4,
  },
  fullscreenWatermarkOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 40,
  },
  fullscreenWatermarkContainer: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 6,
  },
  fullscreenWatermarkText: {
    color: 'rgba(255, 255, 255, 0.2)',
    fontSize: 24,
    fontWeight: 'bold',
    letterSpacing: 1.5,
  },
  
});
