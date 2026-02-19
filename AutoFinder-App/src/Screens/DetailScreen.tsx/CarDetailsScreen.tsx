import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Image, StyleSheet,Linking , TouchableOpacity, ScrollView, ActivityIndicator, Share, Modal, BackHandler, Platform, Alert } from "react-native";
import Swiper from "react-native-swiper";
import { Entypo, FontAwesome5, Feather, FontAwesome, Ionicons } from "@expo/vector-icons";
import CarDetailsModal from "../../Components/Models/CarDetailsModal";
import ImageViewing from "react-native-image-viewing";
import { API_URL, AUTOFINDER_PHONE, getAutofinderPhone } from '../../../config';
import { apiFetch } from '../../utils/apiUtils';
import { COLORS } from '../../constants/colors';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { startConversation, sendMessage as sendChatMessage, getCurrentUserId } from '../../services/chat';
import { generatePropertyMessage, createWhatsAppUrl } from '../../utils/propertyMessageGenerator';
import { buildImageUrls, safeGetAllImagesWithApiUrl } from '../../utils/safeImageUtils';
import SimilarCars from '../../Components/SimilarCars';
import { preloadDetailImages } from '../../utils/imagePreloader';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { rf, rp, createResponsiveStyleSheet, isAndroid } from "../../utils/responsive";

const CarDetailsScreen = ({ route }: { route: any }) => {
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
  // Support both 'car' and 'carDetails' params for compatibility
  const { carDetails: routeCarDetails, car } = route.params || {};
  const initialCarDetails = routeCarDetails || car;
  
  // FIXED: Normalize carDetails on mount - clean up empty userId objects and normalize _id
  const normalizeCarDetails = (details: any) => {
    if (!details) return details;
    
    const normalized: any = { ...details };
    
    // Normalize _id - convert object to string
    if (normalized._id && typeof normalized._id === 'object' && normalized._id !== null) {
      try {
        const nestedId = normalized._id._id || normalized._id.id;
        if (nestedId && typeof nestedId === 'string' && nestedId.length > 10 && nestedId !== '[object Object]' && !nestedId.includes('[object')) {
          normalized._id = nestedId;
        } else if (normalized._id.toString && typeof normalized._id.toString === 'function') {
          const str = normalized._id.toString();
          if (str && typeof str === 'string' && str.length > 10 && str !== '[object Object]' && !str.includes('[object')) {
            normalized._id = str;
          }
        }
      } catch (e) {
        console.warn('⚠️ Error normalizing _id:', e);
      }
    }
    
    // Normalize userId - remove empty objects and extract actual ID (CRITICAL for own property check)
    let normalizedUserId = normalized.userId;
    
    // Check if userId is an empty object {}
    if (normalizedUserId && typeof normalizedUserId === 'object' && normalizedUserId !== null) {
      const keys = Object.keys(normalizedUserId);
      if (keys.length === 0) {
        console.warn('⚠️ normalizeCarDetails: userId is empty object {}, setting to null');
        normalizedUserId = null; // Set to null if empty object
      } else {
        // Has keys - try to extract _id or use toString
        if (normalizedUserId._id) {
          normalizedUserId = normalizedUserId._id.toString ? normalizedUserId._id.toString() : String(normalizedUserId._id);
        } else if (normalizedUserId.id) {
          normalizedUserId = normalizedUserId.id.toString ? normalizedUserId.id.toString() : String(normalizedUserId.id);
        } else if (normalizedUserId.toString && typeof normalizedUserId.toString === 'function') {
          const idStr = normalizedUserId.toString();
          // Validate it's a proper ObjectId string (24 hex chars)
          if (idStr && idStr.length === 24 && /^[0-9a-fA-F]{24}$/.test(idStr)) {
            normalizedUserId = idStr;
          } else if (idStr && idStr !== '[object Object]' && !idStr.includes('[object')) {
            normalizedUserId = idStr;
          } else {
            console.warn('⚠️ normalizeCarDetails: userId.toString() returned invalid format:', idStr);
            normalizedUserId = null;
          }
        } else {
          console.warn('⚠️ normalizeCarDetails: userId object has no _id, id, or toString:', normalizedUserId);
          normalizedUserId = null;
        }
      }
    }
    
    // If userId is a string, validate it
    if (normalizedUserId && typeof normalizedUserId === 'string') {
      if (normalizedUserId === 'null' || normalizedUserId === 'undefined' || normalizedUserId === '') {
        normalizedUserId = null;
      }
    }
    
    // Try other fields if userId is still null
    if (!normalizedUserId) {
      normalizedUserId = normalized.sellerId || normalized.postedBy || normalized.user_id || normalized.seller_id || null;
      
      // If sellerId is also an object, extract _id
      if (normalizedUserId && typeof normalizedUserId === 'object' && normalizedUserId !== null) {
        const keys = Object.keys(normalizedUserId);
        if (keys.length === 0) {
          normalizedUserId = null; // Empty object
        } else {
          normalizedUserId = normalizedUserId._id || normalizedUserId.id || null;
          if (normalizedUserId && typeof normalizedUserId === 'object') {
            normalizedUserId = normalizedUserId.toString ? normalizedUserId.toString() : String(normalizedUserId);
          }
        }
      }
    }
    
    normalized.userId = normalizedUserId;
    normalized.sellerId = normalizedUserId; // Also set sellerId for consistency
    normalized.postedBy = normalizedUserId; // Also set postedBy for consistency
    
    // Debug log for premium cars
    if (normalized.isFeatured === 'Approved' || normalized.modelType === 'Featured' || normalized.adType === 'featured' || normalized.category === 'premium') {
      console.log('🔍 normalizeCarDetails - Premium car userId normalized:', {
        originalUserId: details.userId,
        normalizedUserId: normalizedUserId,
        userIdType: typeof normalizedUserId
      });
    }
    
    // Normalize other ID fields
    if (normalized.carId && typeof normalized.carId === 'object') {
      normalized.carId = normalized.carId._id || normalized.carId.id || normalized._id || null;
    }
    if (normalized.id && typeof normalized.id === 'object') {
      normalized.id = normalized.id._id || normalized.id.id || normalized._id || null;
    }
    
    return normalized;
  };
  
  const [carDetails, setCarDetails] = useState(normalizeCarDetails(initialCarDetails));
  
  // Helper function to detect if ad is an autoparts ad (defined early for use in useEffect)
  const isAutoPartsAd = (ad: any): boolean => {
    if (!ad) return false;
    
    // Check ad type or collection
    if (ad.adType === 'autoparts' || ad.collection === 'AutoParts' || ad.category === 'autoparts') {
      return true;
    }
    
    // Check image URLs for autoparts path
    const checkImages = (images: any) => {
      if (!images) return false;
      if (Array.isArray(images)) {
        return images.some((img: string) => img && img.includes('/autoparts/'));
      }
      if (typeof images === 'string') {
        return images.includes('/autoparts/');
      }
      return false;
    };
    
    if (checkImages(ad.images) || checkImages(ad.image1) || checkImages(ad.image2) || 
        checkImages(ad.image3) || checkImages(ad.image4)) {
      return true;
    }
    
    // Check if it has autoparts-specific fields
    if (ad.partName || ad.partNumber || ad.brand || ad.compatibleWith) {
      return true;
    }
    
    return false;
  };
  
  // Check on mount if initial data is an autoparts ad
  useEffect(() => {
    if (initialCarDetails) {
      const isAutoparts = isAutoPartsAd(initialCarDetails);
      console.log('🔍 Checking initial data on mount:', {
        hasData: !!initialCarDetails,
        hasImages: !!(initialCarDetails.images || initialCarDetails.image1),
        imageUrl: initialCarDetails.images?.[0] || initialCarDetails.image1,
        image1: initialCarDetails.image1,
        adType: initialCarDetails.adType,
        collection: initialCarDetails.collection,
        category: initialCarDetails.category,
        isAutoParts: isAutoparts
      });
      
      if (isAutoparts) {
        console.log('⚠️ Initial data detected as autoparts ad, redirecting to AutoPartsDetailsScreen');
        // Use setTimeout to ensure navigation happens after component mounts
        setTimeout(() => {
          console.log('🔄 Executing navigation.replace to AutoPartsDetailsScreen...');
          navigation.replace('AutoPartsDetailsScreen', { 
            part: initialCarDetails,
            autoPartsDetails: initialCarDetails
          });
        }, 100);
      }
    }
  }, []);
  
  // Set inspection report immediately if it's already in initial data
  useEffect(() => {
    if (initialCarDetails?.inspectionReportId && typeof initialCarDetails.inspectionReportId === 'object' && initialCarDetails.inspectionReportId._id) {
      setInspectionReport(initialCarDetails.inspectionReportId);
      console.log('✅ Set inspection report immediately from initial data');
    }
  }, []);
  
  // Debug: Log all possible mileage fields
  useEffect(() => {
    if (carDetails) {
      console.log('🔍 CarDetails - All mileage-related fields:', {
        kmDriven: carDetails.kmDriven,
        mileage: carDetails.mileage,
        km: carDetails.km,
        kilometer: carDetails.kilometer,
        traveled: carDetails.traveled,
        distance: carDetails.distance,
        odometer: carDetails.odometer,
        allFields: Object.keys(carDetails).filter(key => 
          key.toLowerCase().includes('km') || 
          key.toLowerCase().includes('mile') || 
          key.toLowerCase().includes('travel') ||
          key.toLowerCase().includes('distance') ||
          key.toLowerCase().includes('odometer')
        )
      });
    }
  }, [carDetails]);
  
  // Fetch complete ad data if only ID is provided or if kmDriven is missing
  const fetchAdDetails = async (adId: any) => {
    // FIXED: Normalize ID before using it in API calls
    let normalizedAdId: string;
    try {
      if (typeof adId === 'string') {
        normalizedAdId = adId.trim();
      } else if (typeof adId === 'object' && adId !== null) {
        // Extract ID from object
        const nestedId = adId._id || adId.id;
        if (nestedId && typeof nestedId === 'string' && nestedId.length > 10 && nestedId !== '[object Object]' && !nestedId.includes('[object')) {
          normalizedAdId = nestedId;
        } else if (adId.toString && typeof adId.toString === 'function') {
          const str = adId.toString();
          if (str && typeof str === 'string' && str.length > 10 && str !== '[object Object]' && !str.includes('[object')) {
            normalizedAdId = str;
          } else {
            console.warn('⚠️ Cannot normalize ad ID from object:', adId);
            return;
          }
        } else {
          console.warn('⚠️ Cannot normalize ad ID from object:', adId);
          return;
        }
      } else {
        normalizedAdId = String(adId);
      }
      
      // Validate normalized ID
      if (!normalizedAdId || normalizedAdId === 'undefined' || normalizedAdId === 'null' || normalizedAdId.trim() === '' || normalizedAdId === '[object Object]' || normalizedAdId.includes('[object')) {
        console.warn('⚠️ Invalid normalized ad ID, skipping fetch:', normalizedAdId);
        return;
      }
    } catch (e) {
      console.error('❌ Error normalizing ad ID:', e);
      return;
    }

    try {
      setLoading(true);
      console.log('🔍 Fetching car details for ID:', normalizedAdId);
      console.log('🔗 API URL:', API_URL);
      
      // First try car ads endpoint
      const response = await fetch(`${API_URL}/all_ads/${normalizedAdId}`);
      
      if (response.ok) {
        const adData = await response.json();
        console.log('✅ Found car data:', adData);
        
        // Check if this is actually an autoparts ad
        if (isAutoPartsAd(adData)) {
          console.log('⚠️ Detected autoparts ad from car endpoint, redirecting to AutoPartsDetailsScreen');
          navigation.replace('AutoPartsDetailsScreen', { 
            part: adData,
            autoPartsDetails: adData
          });
          return;
        }
        
        console.log('✅ Car data kmDriven:', adData.kmDriven);
        console.log('✅ Car data userId:', adData.userId);
        console.log('✅ Car data inspectionReportId:', adData.inspectionReportId);
        // FIXED: Normalize data before setting it
        const normalizedAdData = normalizeCarDetails(adData);
        setCarDetails(normalizedAdData);
        
        // If inspectionReportId is already populated, set it immediately for instant display
        if (normalizedAdData.inspectionReportId && typeof normalizedAdData.inspectionReportId === 'object' && normalizedAdData.inspectionReportId._id) {
          setInspectionReport(normalizedAdData.inspectionReportId);
          console.log('✅ Set inspection report immediately from car data');
        }
        
        // Check own property after updating carDetails
        setTimeout(() => {
          if (userData) {
            checkIfOwnProperty();
          }
        }, 100);
      } else {
        const errorText = await response.text().catch(() => 'Unknown error');
        let errorData: any = {};
        try {
          // Try to parse error as JSON
          if (errorText && errorText.trim().startsWith('{')) {
            errorData = JSON.parse(errorText);
          } else if (errorText.includes('{')) {
            // Extract JSON from error string
            const jsonMatch = errorText.match(/\{.*\}/);
            if (jsonMatch) {
              errorData = JSON.parse(jsonMatch[0]);
            }
          }
        } catch (e) {
          // Error is not JSON, use as-is
          errorData = { message: errorText };
        }
        
        console.error('❌ Failed to fetch car details:', {
          status: response.status,
          statusText: response.statusText,
          error: errorText,
          parsedError: errorData
        });
        
        // If it's a 400 error with "Invalid ad ID", try autoparts endpoint
        if (response.status === 400 && (errorData.message?.includes('Invalid ad ID') || errorText.includes('Invalid ad ID'))) {
          console.log('⚠️ Car ad not found, trying autoparts endpoint...');
          console.log('🔍 Checking initial data for autoparts indicators:', {
            hasInitialData: !!initialCarDetails,
            initialImages: initialCarDetails?.images || initialCarDetails?.image1,
            initialAdType: initialCarDetails?.adType,
            initialCollection: initialCarDetails?.collection,
            isAutoParts: isAutoPartsAd(initialCarDetails)
          });
          
          // First check initial data - if it has autoparts images, redirect immediately
          if (initialCarDetails && isAutoPartsAd(initialCarDetails)) {
            console.log('✅ Initial data detected as autoparts, redirecting immediately...');
            setLoading(false); // Stop loading before navigation
            setTimeout(() => {
              navigation.replace('AutoPartsDetailsScreen', { 
                part: initialCarDetails,
                autoPartsDetails: initialCarDetails
              });
            }, 50);
            return;
          }
          
          // Try autoparts endpoint
          try {
            // FIXED: Use normalized ID for autoparts endpoint
            console.log(`🔍 Fetching from autoparts endpoint: ${API_URL}/autoparts/${normalizedAdId}`);
            const autopartsResponse = await fetch(`${API_URL}/autoparts/${normalizedAdId}`);
            console.log(`📡 Autoparts response status: ${autopartsResponse.status}`);
            
            if (autopartsResponse.ok) {
              const partData = await autopartsResponse.json();
              console.log('✅ Found autoparts data:', partData);
              console.log('🔄 Redirecting to AutoPartsDetailsScreen...');
              setLoading(false); // Stop loading before navigation
              setTimeout(() => {
                navigation.replace('AutoPartsDetailsScreen', { 
                  part: partData,
                  autoPartsDetails: partData
                });
              }, 50);
              return;
            } else {
              const autopartsErrorText = await autopartsResponse.text().catch(() => 'Unknown error');
              console.log(`⚠️ Autoparts endpoint failed with status ${autopartsResponse.status}:`, autopartsErrorText);
              
              // Even if endpoint fails, check if we have initial data with autoparts images
              if (initialCarDetails) {
                const hasAutopartsImages = 
                  (initialCarDetails.images && Array.isArray(initialCarDetails.images) && 
                   initialCarDetails.images.some((img: string) => img && img.includes('/autoparts/'))) ||
                  (initialCarDetails.image1 && initialCarDetails.image1.includes('/autoparts/')) ||
                  (initialCarDetails.image2 && initialCarDetails.image2.includes('/autoparts/')) ||
                  (initialCarDetails.image3 && initialCarDetails.image3.includes('/autoparts/')) ||
                  (initialCarDetails.image4 && initialCarDetails.image4.includes('/autoparts/'));
                
                if (hasAutopartsImages) {
                  console.log('✅ Initial data has autoparts images, redirecting...');
                  setLoading(false);
                  setTimeout(() => {
                    navigation.replace('AutoPartsDetailsScreen', { 
                      part: initialCarDetails,
                      autoPartsDetails: initialCarDetails
                    });
                  }, 50);
                  return;
                }
              }
            }
          } catch (autopartsError: any) {
            console.log('⚠️ Error fetching from autoparts endpoint:', autopartsError);
            console.log('🔍 Error details:', {
              message: autopartsError?.message,
              name: autopartsError?.name,
              stack: autopartsError?.stack
            });
            
            // Fallback: check initial data one more time
            if (initialCarDetails && isAutoPartsAd(initialCarDetails)) {
              console.log('✅ Fallback: Initial data detected as autoparts, redirecting...');
              setLoading(false);
              setTimeout(() => {
                navigation.replace('AutoPartsDetailsScreen', { 
                  part: initialCarDetails,
                  autoPartsDetails: initialCarDetails
                });
              }, 50);
              return;
            }
          }
        }
        
        // Don't show error to user if data already exists - just log it
        if (!carDetails || Object.keys(carDetails).length === 0) {
          console.warn('⚠️ No existing car data, but fetch failed. Continuing with available data.');
        }
      }
    } catch (error: any) {
      // Handle timeout and network errors gracefully
      if (error?.name === 'AbortError' || error?.message?.includes('timeout') || error?.message?.includes('timed out')) {
        console.log('⏱️ Car data request timed out - this is normal if backend is slow');
      } else {
        console.error('❌ Error fetching car data:', error);
      }
      // Don't show error to user if data already exists - just log it
      if (!carDetails || Object.keys(carDetails).length === 0) {
        console.warn('⚠️ No existing car data, but fetch failed. Continuing with available data.');
      }
    } finally {
      setLoading(false);
    }
  };
  
  // Fetch complete data if kmDriven is missing (only if we have minimal data)
  useEffect(() => {
    const rawAdId = carDetails?._id || carDetails?.id;
    
    // Skip if no ID
    if (!rawAdId) return;
    
    // FIXED: Safely convert ID to string to prevent [object Object] errors
    let adId: string;
    try {
      if (typeof rawAdId === 'string') {
        // Validate it's not "[object Object]"
        if (rawAdId === '[object Object]' || rawAdId.includes('[object')) {
          console.warn('⚠️ Invalid ad ID string:', rawAdId);
          return;
        }
        adId = rawAdId;
      } else if (typeof rawAdId === 'object' && rawAdId !== null) {
        // Try nested _id or id first
        const nestedId = rawAdId._id || rawAdId.id;
        if (nestedId && typeof nestedId === 'string' && nestedId.length > 10 && nestedId !== '[object Object]' && !nestedId.includes('[object')) {
          adId = nestedId;
        } else if (rawAdId.toString && typeof rawAdId.toString === 'function') {
          const str = rawAdId.toString();
          if (str && typeof str === 'string' && str.length > 10 && str !== '[object Object]' && !str.includes('[object')) {
            adId = str;
          } else {
            console.warn('⚠️ Cannot normalize ad ID from object:', rawAdId);
            return;
          }
        } else {
          console.warn('⚠️ Cannot normalize ad ID from object:', rawAdId);
          return;
        }
      } else {
        adId = String(rawAdId);
        // Validate it's not "[object Object]"
        if (adId === '[object Object]' || adId.includes('[object')) {
          console.warn('⚠️ Invalid ad ID after conversion:', adId);
          return;
        }
      }
    } catch (e) {
      console.error('❌ Error converting adId to string:', e);
      return; // Skip if ID conversion fails
    }
    
    // Skip if we've already tried to fetch this ID
    if (fetchAttemptedRef.current.has(adId)) {
      return;
    }
    
    // Only fetch if:
    // 1. We have an ID
    // 2. kmDriven is missing
    // 3. We have some basic data (not just an ID)
    const hasBasicData = carDetails && (
      carDetails.make || 
      carDetails.model || 
      carDetails.price || 
      carDetails.images || 
      carDetails.image1 ||
      Object.keys(carDetails).length > 1 // More than just _id
    );
    
    const isMissingMileage = !carDetails?.kmDriven && 
                             !carDetails?.mileage && 
                             !carDetails?.km && 
                             !carDetails?.kilometer;
    
    // Only fetch if:
    // 1. Mileage is missing
    // 2. We have basic data (so we know it's a real ad, not just an ID)
    // 3. We haven't tried to fetch this ID before
    if (isMissingMileage && hasBasicData) {
      console.log('⚠️ kmDriven missing but have basic data, attempting to fetch complete data...');
      // Mark as attempted before fetching
      fetchAttemptedRef.current.add(adId);
      fetchAdDetails(adId);
    } else if (isMissingMileage && !hasBasicData) {
      // Only fetch if we don't have basic data (meaning we only have an ID)
      console.log('⚠️ Only ID available, fetching complete data...');
      // Mark as attempted before fetching
      fetchAttemptedRef.current.add(adId);
      fetchAdDetails(adId);
    }
  }, [carDetails?._id, carDetails?.id]);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isLoadingFavorite, setIsLoadingFavorite] = useState(false);
  const [userData, setUserData] = useState<any>(null);
  const [sellerData, setSellerData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [visible, setVisible] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isOwnProperty, setIsOwnProperty] = useState(false); // Default to false so button shows
  const [viewCount, setViewCount] = useState(carDetails?.views || 0);
  const [callCount, setCallCount] = useState(carDetails?.calls || carDetails?.callClicks || 0);
  const [hasDealerPackage, setHasDealerPackage] = useState<boolean | null>(null);
  const [showBottomButtons, setShowBottomButtons] = useState(true);
  const [autofinderPhone, setAutofinderPhone] = useState<string>(AUTOFINDER_PHONE);
  const [inspectionReport, setInspectionReport] = useState<any>(null);
  const [loadingInspectionReport, setLoadingInspectionReport] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const fetchAttemptedRef = useRef<Set<string>>(new Set()); // Track which IDs we've tried to fetch

  // Fetch dynamic admin phone number for managed properties
  // Pass adId to get the phone number of the admin who added this specific property
  useEffect(() => {
    if (carDetails?.isManaged) {
      const adId = carDetails?._id || carDetails?.id;
      console.log("📞 Fetching admin phone for managed property:", adId);
      getAutofinderPhone(adId).then(phone => {
        setAutofinderPhone(phone);
        console.log("📞 Fetched AutoFinder phone for ad", adId, ":", phone);
      });
    }
  }, [carDetails?.isManaged, carDetails?._id]);

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

  // Parse date from API (string, number, or object) - jis din ad post hua
  const toDate = (v: any): Date | null => {
    if (v == null || v === '') return null;
    if (typeof v === 'number') return new Date(v);
    if (typeof v === 'string') {
      const d = new Date(v);
      return isNaN(d.getTime()) ? null : d;
    }
    if (v && typeof v === 'object' && v.$date) return new Date(v.$date);
    if (v && typeof v === 'object' && typeof v.getTime === 'function') return v as Date;
    try {
      const d = new Date((v as any).toString?.() || v);
      return isNaN(d.getTime()) ? null : d;
    } catch { return null; }
  };
  // Post date = dateAdded pehle, phir approvedAt (jis din ad post hua wohi dikhana hai)
  const getDisplayDate = () => {
    return carDetails?.dateAdded ?? carDetails?.approvedAt ?? carDetails?.date_added ?? carDetails?.approved_at ?? carDetails?.createdAt ?? carDetails?.created_at;
  };
  // "2 days ago" style - jis din ad post hua us hisaab se
  const getTimeAgo = (dateValue: any) => {
    try {
      const date = toDate(dateValue);
      if (!date || isNaN(date.getTime())) return 'Recently';
      const now = new Date();
      const diff = now.getTime() - date.getTime();
      if (diff < 0) return 'Recently';
      const seconds = Math.floor(diff / 1000);
      const minutes = Math.floor(diff / (1000 * 60));
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const weeks = Math.floor(days / 7);
      const months = Math.floor(days / 30);
      const years = Math.floor(days / 365);
      if (seconds < 60) return 'Just now';
      if (minutes < 60) return `${minutes} min${minutes > 1 ? 's' : ''} ago`;
      if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
      if (days === 1) return '1 day ago';
      if (days < 7) return `${days} days ago`;
      if (weeks === 1) return '1 week ago';
      if (weeks < 4) return `${weeks} weeks ago`;
      if (months === 1) return '1 month ago';
      if (months < 12) return `${months} months ago`;
      if (years === 1) return '1 year ago';
      return `${years} years ago`;
    } catch {
      return 'Recently';
    }
  };
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
  }, []); // Only fetch user data once on mount

  // Separate useEffect for seller data that depends on carDetails
  useEffect(() => {
    const fetchSellerData = async () => {
      // Don't fetch if carDetails is not available yet
      if (!carDetails) {
        console.log("⏳ Waiting for carDetails to be available...");
        return;
      }

      try {
        // Get seller ID from car details - check multiple fields and handle different formats
        let sellerId: any = carDetails?.userId || carDetails?.sellerId || carDetails?.postedBy;
        
        // FIXED: Handle empty objects {} - check if it's actually empty
        if (sellerId && typeof sellerId === 'object') {
          const keys = Object.keys(sellerId);
          if (keys.length === 0) {
            // Empty object - set to null
            sellerId = null;
          } else {
            // Has keys - try to extract _id or id
            sellerId = sellerId._id || sellerId.id || sellerId;
          }
        }
        
        // If sellerId is still an object after extraction, try toString
        if (sellerId && typeof sellerId === 'object' && sellerId !== null) {
          if (sellerId.toString && typeof sellerId.toString === 'function') {
            const idStr = sellerId.toString();
            // Check if toString returned a valid ObjectId string (24 hex chars)
            if (idStr && idStr.length === 24 && /^[0-9a-fA-F]{24}$/.test(idStr)) {
              sellerId = idStr;
            } else if (idStr && idStr !== '[object Object]' && !idStr.includes('[object')) {
              sellerId = idStr;
            } else {
              sellerId = null;
            }
          } else {
            sellerId = null;
          }
        }
        
        // Ensure sellerId is a string or null
        sellerId = sellerId ? String(sellerId).trim() : null;
        
        // Additional check: if sellerId is 'null' or 'undefined' string, set to null
        if (sellerId === 'null' || sellerId === 'undefined' || sellerId === '') {
          sellerId = null;
        }
        
        console.log("🔍 DEBUG: fetchSellerData called with carDetails:", {
          carId: carDetails?._id,
          carTitle: carDetails?.title || `${carDetails?.make} ${carDetails?.model}`,
          userId: carDetails?.userId,
          userIdType: typeof carDetails?.userId,
          sellerId: carDetails?.sellerId,
          postedBy: carDetails?.postedBy,
          extractedSellerId: sellerId,
          isFromNewCar: !carDetails?.userId, // Check if this is from New_Car collection
          isFromFreeAds: !!carDetails?.userId, // Check if this is from Free_Ads collection
          isFeatured: carDetails?.isFeatured || carDetails?.modelType === 'Featured',
          adSource: carDetails?.adSource,
          isOwnAd: carDetails?.isOwnAd, // Check if this is user's own ad
          currentUserId: carDetails?.currentUserId // Current user ID
        });
        
        if (sellerId) {
          console.log("📞 Fetching seller data for ID:", sellerId);
          // Use public seller-info endpoint first (no auth required)
          const sellerInfoUrl = `${API_URL}/users/${sellerId}/seller-info`;
          console.log("📞 API URL:", sellerInfoUrl);
          
          const response = await fetch(sellerInfoUrl);
          console.log("📞 Response status:", response.status);
          
          if (response.ok) {
            const sellerInfo = await response.json();
            console.log("✅ Seller data fetched successfully:", {
              id: sellerInfo._id,
              name: sellerInfo.name,
              phone: sellerInfo.phone,
              email: sellerInfo.email,
              fullSellerData: sellerInfo
            });
            
            // Set seller data with proper phone number handling
            setSellerData({
              _id: sellerInfo._id,
              name: sellerInfo.name,
              phone: sellerInfo.phone,
              email: sellerInfo.email,
              profileImage: sellerInfo.profileImage,
              contactInfo: sellerInfo.contactInfo, // Include backend contact info
              isPlaceholder: false,
              isOwnAd: false
            });
            
            console.log("📱 Seller phone number set:", sellerInfo.phone);
            console.log("📱 Seller contact info:", sellerInfo.contactInfo);
          } else {
            const errorText = await response.text();
            console.error("❌ Failed to fetch seller data:", response.status, errorText);
            // Don't set placeholder here - let it try with userData check below
          }
        } else {
          console.log("❌ No seller ID found in car details");
          console.log("❌ Available fields:", {
            userId: carDetails?.userId,
            sellerId: carDetails?.sellerId,
            postedBy: carDetails?.postedBy
          });
          console.log("❌ Full carDetails object:", carDetails);
          
          // Check if this is the user's own ad (need to wait for userData)
          if (userData && carDetails?.isOwnAd) {
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
          } else if (!sellerId) {
            // For ads without userId, check if it's a premium/featured ad
            const isPremiumAd = carDetails?.isFeatured === 'Approved' || 
                               carDetails?.modelType === 'Featured' || 
                               carDetails?.adSource === 'featured_ads';
            
            if (isPremiumAd) {
              console.log("⚠️ Premium car without seller ID - this should not happen");
              console.log("⚠️ Attempting to fetch seller data from backend using ad ID...");
              
              // Try to fetch the ad again from backend to get userId
              try {
                const adResponse = await fetch(`${API_URL}/all_ads/${carDetails._id}`);
                if (adResponse.ok) {
                  const adData = await adResponse.json();
                  console.log("📦 Re-fetched ad data:", {
                    userId: adData.userId,
                    userIdType: typeof adData.userId
                  });
                  
                  // Try again with re-fetched userId
                  if (adData.userId) {
                    let retrySellerId = adData.userId;
                    if (typeof retrySellerId === 'object' && retrySellerId !== null) {
                      retrySellerId = retrySellerId._id || retrySellerId.id || retrySellerId.toString();
                    }
                    retrySellerId = retrySellerId ? String(retrySellerId).trim() : null;
                    
                    if (retrySellerId && retrySellerId !== 'null' && retrySellerId !== 'undefined') {
                      console.log("🔄 Retrying seller fetch with re-fetched userId:", retrySellerId);
                      const retryResponse = await fetch(`${API_URL}/users/${retrySellerId}/seller-info`);
                      if (retryResponse.ok) {
                        const retrySellerInfo = await retryResponse.json();
                        setSellerData({
                          _id: retrySellerInfo._id,
                          name: retrySellerInfo.name,
                          phone: retrySellerInfo.phone,
                          email: retrySellerInfo.email,
                          profileImage: retrySellerInfo.profileImage,
                          contactInfo: retrySellerInfo.contactInfo,
                          isPlaceholder: false,
                          isOwnAd: false
                        });
                        console.log("✅ Seller data fetched successfully after retry");
                        return; // Success - exit early
                      }
                    }
                  }
                }
              } catch (retryError) {
                console.error("❌ Error retrying seller fetch:", retryError);
              }
            }
            
            // If still no seller ID, set placeholder
            console.log("⚠️ This appears to be an ad without seller ID");
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
  }, [carDetails, userData]); // Fetch seller data when carDetails or userData changes

  // Check if this is the user's own property
  const checkIfOwnProperty = async () => {
    try {
      const currentUserId = await getCurrentUserId();
      
      // Also check userData.userId as fallback
      const userIdFromData = userData?.userId || currentUserId;
      
      // Get seller ID from multiple possible fields (normalized carDetails should have userId as string)
      let sellerId = carDetails?.userId || carDetails?.sellerId || carDetails?.postedBy;
      
      // FIXED: Handle empty objects {} - check if it's actually empty
      if (sellerId && typeof sellerId === 'object') {
        const keys = Object.keys(sellerId);
        if (keys.length === 0) {
          // Empty object - set to null
          sellerId = null;
        } else {
          // Has keys - try to extract _id or id
          sellerId = sellerId._id || sellerId.id || sellerId;
        }
      }
      
      // If sellerId is still an object after extraction, try toString
      if (sellerId && typeof sellerId === 'object' && sellerId !== null) {
        if (sellerId.toString && typeof sellerId.toString === 'function') {
          const idStr = sellerId.toString();
          // Check if toString returned a valid ObjectId string (24 hex chars)
          if (idStr && idStr.length === 24 && /^[0-9a-fA-F]{24}$/.test(idStr)) {
            sellerId = idStr;
          } else if (idStr && idStr !== '[object Object]' && !idStr.includes('[object')) {
            sellerId = idStr;
          } else {
            sellerId = null;
          }
        } else {
          sellerId = null;
        }
      }
      
      // Ensure sellerId is a string or null
      sellerId = sellerId ? String(sellerId).trim() : null;
      
      // Additional check: if sellerId is 'null' or 'undefined' string, set to null
      if (sellerId === 'null' || sellerId === 'undefined' || sellerId === '') {
        sellerId = null;
      }
      
      // Compare with both currentUserId and userIdFromData
      const userIdToCompare = userIdFromData || currentUserId;
      
      if (userIdToCompare && sellerId) {
        // Convert both to strings for comparison to avoid type mismatch
        const currentUserIdStr = String(userIdToCompare).trim();
        const sellerIdStr = String(sellerId).trim();
        const isOwn = currentUserIdStr === sellerIdStr;
        
        setIsOwnProperty(isOwn);
        console.log('🔍 Checking if own property:', { 
          currentUserId: currentUserIdStr, 
          userIdFromData: userIdFromData ? String(userIdFromData).trim() : null,
          sellerId: sellerIdStr, 
          isOwn,
          carDetailsUserId: carDetails?.userId,
          carDetailsSellerId: carDetails?.sellerId,
          carDetailsPostedBy: carDetails?.postedBy
        });
      } else {
        // Default to false (not own property) if we can't check
        setIsOwnProperty(false);
        console.log('🔍 Cannot check own property - missing IDs:', { 
          hasCurrentUserId: !!currentUserId, 
          hasUserIdFromData: !!userIdFromData,
          hasSellerId: !!sellerId,
          currentUserId: currentUserId,
          userIdFromData: userIdFromData,
          sellerId: sellerId
        });
      }
    } catch (error) {
      console.error("Error checking if own property:", error);
      // On error, default to false (not own property) so button shows
      setIsOwnProperty(false);
    }
  };

  useEffect(() => {
    if (userData && carDetails) {
      // Add a small delay to ensure carDetails is fully normalized
      const timer = setTimeout(() => {
        checkIfOwnProperty();
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [userData, carDetails]);

  // Fetch inspection report for this car - OPTIMIZED for IMMEDIATE display (no delays)
  useEffect(() => {
    const fetchInspectionReport = async () => {
      if (!carDetails?._id) return;
      
      // PRIORITY 1: If inspectionReportId is already populated (object), use it IMMEDIATELY
      if (carDetails.inspectionReportId && typeof carDetails.inspectionReportId === 'object' && carDetails.inspectionReportId._id) {
        setInspectionReport(carDetails.inspectionReportId);
        console.log('✅ Using populated inspection report immediately');
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
              console.log('✅ Found inspection report by adId (fast)');
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
              console.log('✅ Found inspection report linked to car ad (by report ID)');
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
                console.log('✅ Found inspection report linked to car ad (by inspection ID)');
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
          console.log('ℹ️ No inspection report found (timeout or not found)');
          setLoadingInspectionReport(false);
        }
      } catch (error) {
        console.warn('⚠️ Inspection report fetch timeout or error:', error);
        setLoadingInspectionReport(false);
      }
    };

    // Fetch immediately when carDetails._id is available
    if (carDetails?._id) {
      fetchInspectionReport();
    }
  }, [carDetails?._id, carDetails?.inspectionReportId]);

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
  useEffect(() => {
    // Log carDetails when the component mounts
    console.log("Car Details:", carDetails);
    console.log("🔍 Car Details Seller ID:", {
      userId: carDetails?.userId,
      sellerId: carDetails?.sellerId,
      postedBy: carDetails?.postedBy,
      hasSellerId: !!(carDetails?.userId || carDetails?.sellerId || carDetails?.postedBy)
    });
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
    console.log("Car Details:", carDetails);
    if (!carDetails.description) {
      console.warn("carDetails.description is missing!");
    }
  }, [carDetails]);

  const formatDate = (date: any) => {
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    return new Date(date).toLocaleDateString(undefined, options);
  };
  
  // CRITICAL: Check if images suggest autoparts BEFORE building images array
  useEffect(() => {
    if (carDetails) {
      const isAutoparts = isAutoPartsAd(carDetails);
      console.log('🔍 Checking carDetails for autoparts:', {
        hasData: !!carDetails,
        isAutoparts: isAutoparts,
        images: carDetails.images,
        image1: carDetails.image1,
        adType: carDetails.adType
      });
      
      if (isAutoparts) {
        console.log('⚠️ carDetails detected as autoparts, redirecting to AutoPartsDetailsScreen');
        setLoading(false); // Stop loading before navigation
        setTimeout(() => {
          navigation.replace('AutoPartsDetailsScreen', { 
            part: carDetails,
            autoPartsDetails: carDetails
          });
        }, 50);
      }
    }
  }, [carDetails]);
  
  // CRITICAL: Use images array if available, otherwise build from image1-image8 or use safeGetAllImagesWithApiUrl
  let images: string[] = [];
  
  if (carDetails.images && Array.isArray(carDetails.images) && carDetails.images.length > 0) {
    // Use images array directly - but fix double /uploads/ paths and ensure full URLs
    images = carDetails.images
      .filter(img => img && typeof img === 'string' && img.trim() !== '')
      .map(img => {
        // If already a full URL, fix double /uploads/ if present
        if (img.startsWith('http://') || img.startsWith('https://')) {
          return img.replace('/uploads//uploads/', '/uploads/');
        }
        // If path already contains /uploads/, just prepend API_URL
        if (img.includes('uploads/')) {
          const cleanPath = img.startsWith('/') ? img.substring(1) : img;
          const normalizedPath = cleanPath.replace(/\/?uploads\/+/g, 'uploads/');
          return `${API_URL}/${normalizedPath}`;
        }
        // Otherwise, prepend API_URL/uploads/
        return `${API_URL}/uploads/${img.startsWith('/') ? img.substring(1) : img}`;
      });
  }
  
  // If images array is empty, try to build from image1-image8
  if (images.length === 0) {
    images = buildImageUrls([
      carDetails.image1,
      carDetails.image2,
      carDetails.image3,
      carDetails.image4,
      carDetails.image5,
      carDetails.image6,
      carDetails.image7,
      carDetails.image8,
    ], API_URL);
  }
  
  // If still empty, use safeGetAllImagesWithApiUrl as fallback
  if (images.length === 0) {
    images = safeGetAllImagesWithApiUrl(carDetails, API_URL);
  }
  
  // Final filter to ensure all images are valid URLs and fix any remaining double /uploads/
  images = images
    .filter(img => img && typeof img === 'string' && img.trim() !== '')
    .map(img => img.replace('/uploads//uploads/', '/uploads/'));

  // Debug: Log images to check if they're properly loaded
  useEffect(() => {
    console.log('🖼️ CarDetailsScreen - Images array:', images);
    console.log('🖼️ CarDetailsScreen - Images count:', images.length);
    console.log('🖼️ CarDetailsScreen - First image:', images[0]);
    console.log('🖼️ CarDetailsScreen - carDetails.images:', carDetails.images);
    
    // Check if any image URL suggests autoparts
    if (images.length > 0 && images.some(img => img && typeof img === 'string' && img.includes('/autoparts/'))) {
      console.log('⚠️ Image URLs detected as autoparts in images array, redirecting...');
      console.log('🔍 Autoparts images found:', images.filter(img => img && img.includes('/autoparts/')));
      setLoading(false); // Stop loading before navigation
      setTimeout(() => {
        console.log('🔄 Executing navigation.replace from images check...');
        navigation.replace('AutoPartsDetailsScreen', { 
          part: carDetails,
          autoPartsDetails: carDetails
        });
      }, 50);
    }
  }, [images, carDetails]);

  // CRITICAL: Ensure first image is ready for instant display
  useEffect(() => {
    if (images.length > 0) {
      // CRITICAL: Prefetch first image immediately - don't wait, just start it
      const firstImage = images[0];
      if (firstImage) {
        // Start prefetch immediately - image will load instantly if cached
        Image.prefetch(firstImage)
          .then(() => {
            console.log('✅ First image prefetched:', firstImage);
          })
          .catch((err) => {
            console.log('⚠️ First image prefetch failed:', err);
          });
      }
      
      // Preload remaining images in background (don't wait)
      if (images.length > 1) {
        images.slice(1).forEach(img => {
          Image.prefetch(img).catch(() => {});
        });
      }
    }
  }, [images]);

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
  const handleCall = async () => {
    // Check if user is logged in
    try {
      const storedUserData = await AsyncStorage.getItem('user');
      if (!storedUserData) {
        Alert.alert(
          "Login Required",
          "You are not logged in. Please login to contact the seller.",
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

    console.log("📞 Call button pressed!");
    console.log("📞 Is managed property:", carDetails?.isManaged);
    
    // Track call count
    trackCall();
    
    // For managed properties, use AutoFinder's phone number (dynamic)
    if (carDetails?.isManaged) {
      console.log("📞 Managed property - using AutoFinder phone:", autofinderPhone);
      const formattedNumber = '+' + autofinderPhone;
      Linking.openURL(`tel:${formattedNumber}`);
      return;
    }
    
    console.log("📞 Current sellerData state:", sellerData);
    console.log("📞 Phone number from sellerData:", sellerData?.phone);
    
    // Check if this is a placeholder seller data
    if (sellerData?.isPlaceholder) {
      console.log("⚠️ Contact not available - this is a New_Car ad without seller ID");
      alert("Contact information is not available for this ad. This appears to be a dealer listing.");
      return;
    }
    
    // Use backend contact info if available, otherwise use phone directly
    const phoneNumber = sellerData?.contactInfo?.phone || sellerData?.phone;
    const callUrl = sellerData?.contactInfo?.callUrl;
    
    console.log("📞 Call button pressed - Seller data:", {
      hasSellerData: !!sellerData,
      sellerId: sellerData?._id,
      sellerName: sellerData?.name,
      phoneNumber: phoneNumber,
      callUrl: callUrl,
      contactInfo: sellerData?.contactInfo,
      fullSellerData: sellerData
    });
    
    if (callUrl) {
      // Use backend formatted call URL
      console.log("📞 Using backend call URL:", callUrl);
      Linking.openURL(callUrl);
    } else if (phoneNumber) {
      // Fallback: format phone number manually
      let cleanNumber = phoneNumber.replace(/\D/g, ''); // Remove all non-digits
      cleanNumber = cleanNumber.replace(/^0+/, ''); // Remove leading zeros
      
      // If it doesn't start with 92, add it
      if (!cleanNumber.startsWith('92')) {
        cleanNumber = '92' + cleanNumber;
      }
      
      // Add + prefix
      const formattedNumber = '+' + cleanNumber;
      const fallbackCallUrl = `tel:${formattedNumber}`;
      
      console.log("📞 Original phone number:", phoneNumber);
      console.log("📞 Cleaned phone number:", cleanNumber);
      console.log("📞 Final formatted number:", formattedNumber);
      console.log("📞 Fallback call URL:", fallbackCallUrl);
      console.log("📞 Calling seller with formatted number:", formattedNumber);
      
      Linking.openURL(fallbackCallUrl);
    } else {
      console.log("❌ No phone number available for seller");
      console.log("❌ SellerData is:", sellerData);
      alert("Seller's phone number is not available");
    }
  };

  const handleWhatsApp = async () => {
    // Check if user is logged in
    try {
      const storedUserData = await AsyncStorage.getItem('user');
      if (!storedUserData) {
        Alert.alert(
          "Login Required",
          "You are not logged in. Please login to contact the seller.",
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

    console.log("💬 WhatsApp button pressed!");
    console.log("💬 Is managed property:", carDetails?.isManaged);
    
    // For managed properties, use AutoFinder's phone number (dynamic)
    if (carDetails?.isManaged) {
      console.log("💬 Managed property - using AutoFinder phone:", autofinderPhone);
      const propertyMessage = generatePropertyMessage(carDetails);
      const whatsappUrl = createWhatsAppUrl(autofinderPhone, propertyMessage);
      console.log("💬 Property message:", propertyMessage);
      console.log("💬 WhatsApp URL:", whatsappUrl);
      Linking.openURL(whatsappUrl);
      return;
    }
    
    console.log("💬 Current sellerData state:", sellerData);
    console.log("💬 Phone number from sellerData:", sellerData?.phone);
    
    // Check if this is a placeholder seller data
    if (sellerData?.isPlaceholder) {
      console.log("⚠️ Contact not available - this is a New_Car ad without seller ID");
      alert("Contact information is not available for this ad. This appears to be a dealer listing.");
      return;
    }
    
    // Use backend contact info if available, otherwise use phone directly
    const phoneNumber = sellerData?.contactInfo?.phone || sellerData?.phone;
    const whatsappUrl = sellerData?.contactInfo?.whatsappUrl;
    
    console.log("💬 WhatsApp button pressed - Seller data:", {
      hasSellerData: !!sellerData,
      sellerId: sellerData?._id,
      sellerName: sellerData?.name,
      phoneNumber: phoneNumber,
      whatsappUrl: whatsappUrl,
      contactInfo: sellerData?.contactInfo,
      fullSellerData: sellerData
    });
    
    if (whatsappUrl) {
      // Use backend formatted WhatsApp URL with property message
      const propertyMessage = generatePropertyMessage(carDetails);
      const whatsappUrlWithMessage = whatsappUrl + `?text=${encodeURIComponent(propertyMessage)}`;
      console.log("💬 Using backend WhatsApp URL with property message:", whatsappUrlWithMessage);
      console.log("💬 Property message:", propertyMessage);
      Linking.openURL(whatsappUrlWithMessage);
    } else if (phoneNumber) {
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
  const [expanded, setExpanded] = useState(false);
  const toggleExpand = () => setExpanded(!expanded);
  useEffect(() => {
    if (userData && carDetails?.favoritedBy) {
      const isAlreadyFavorited = carDetails.favoritedBy.includes(userData.userId);
      setIsFavorite(isAlreadyFavorited);
    }
  }, [userData, carDetails]);

  // Fetch user dealer package info
  useEffect(() => {
    const fetchUserPackageInfo = async () => {
      if (!userData?.userId) {
        setHasDealerPackage(false);
        return;
      }

      try {
        const response = await apiFetch(`${API_URL}/mobile/user-mobile-packages/${userData.userId}`);
        const text = await response.text();
        let data: { success?: boolean; packages?: any[] } = { success: false, packages: [] };
        try {
          if (text && text.trim().startsWith("{")) {
            data = JSON.parse(text);
          }
        } catch (_) {
          setHasDealerPackage(false);
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
  
  const toggleFavorite = async () => {
    if (!userData?.userId) {
      console.warn("User ID not found. Cannot toggle favorite.");
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
      // Optionally show user-friendly error message
      if (error?.message?.includes("non-JSON")) {
        console.error("⚠️ Server may be returning an error page. Check API endpoint.");
      }
    } finally {
      setIsLoadingFavorite(false);
    }
  };
  
  // Function to share car details
  const shareCar = async () => {
    try {
      const shareUrl = `https://autofinder.pk/car/${carDetails._id}`;
      const shareMessage = `Check out this car: ${carDetails.make} ${carDetails.model} ${carDetails.variant || ''} ${carDetails.year} for Rs. ${carDetails.price} in ${carDetails.location || carDetails.city || 'N/A'} on autofinder.pk!\n\nView details: ${shareUrl}`;
      
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
      {/* CRITICAL: Swiper with first image immediately visible */}
      <View style={styles.imageContainer}>
      {images.length > 0 ? (
        <Swiper 
          loop={false} 
          dotStyle={styles.dot} 
          activeDotStyle={styles.activeDot}
          index={0}
          autoplay={false}
          showsPagination={images.length > 1}
          loadMinimal={false}
          removeClippedSubviews={false}
        >
        {images.map((img, index) => (
          <TouchableOpacity
            key={index}
            style={{ position: 'relative', width: '100%', height: '100%', backgroundColor: '#f0f0f0' }}
            onPress={() => {
              setSelectedIndex(index);
              setVisible(true);
            }}
            activeOpacity={0.9}
          >
            <Image 
              source={{ uri: img }} 
              style={[styles.image, { backgroundColor: '#e8e8e8' }]}
              resizeMode="cover"
              defaultSource={require('../../../assets/Other/nodatafound.png')}
              onError={() => {
                console.log(`Failed to load image: ${img}`);
              }}
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
      ) : (
        <View style={[styles.image, { backgroundColor: '#f0f0f0', justifyContent: 'center', alignItems: 'center' }]}>
          <Text style={{ color: '#999', fontSize: 16 }}>No images available</Text>
        </View>
      )}
      </View>

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

      {/* Badges Row - Show above price */}
      <View style={styles.badgesRowContainer}>
        {/* Featured Badge - Only show for premium ads, not free ads */}
        {(() => {
          // Check if this is a free ad - NO premium tag for free ads
          const isFreeAd = (carDetails.category || '') === 'free' || 
                          (carDetails.adType || '') === 'free' || 
                          (carDetails.modelType === 'Free') ||
                          (carDetails.packagePrice === 525) ||
                          (carDetails.paymentAmount === 525);
          
          const shouldShowPremium = carDetails.isFeatured && !isFreeAd;
          return shouldShowPremium;
        })() && (
          <View style={styles.featuredBadge}>
            <Text style={styles.featuredText}>Premium</Text>
          </View>
        )}
        {carDetails.isManaged && (
          <View style={styles.managedBadge}>
            <Text style={styles.managedText} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>
              Managed By AutoFinder
            </Text>
          </View>
        )}
      </View>

      {/* Price and Time */}
      <View style={styles.priceContainer}>
        <View style={styles.priceTimeRow}>
          <Text style={styles.price}>
            PKR {carDetails && carDetails.price ? Number(carDetails.price).toLocaleString('en-US') : '0'}
          </Text>
          {/* Time Ago - use dateAdded first (like used cars); fallback to approvedAt and other keys */}
          <Text style={styles.timeAgo}>{getTimeAgo(getDisplayDate())}</Text>
        </View>
      </View>


      {/* Car Details - Brand, Model, Variant */}
      <Text style={styles.carModel}>
        {carDetails ? (() => {
          let make = (carDetails?.make || '').trim();
          let model = (carDetails?.model || '').trim();
          let variant = (carDetails?.variant || '').trim();
          
          // Remove "Car" word if it appears (case insensitive)
          make = make.replace(/\bCar\b/gi, '').trim();
          model = model.replace(/\bCar\b/gi, '').trim();
          variant = variant.replace(/\bCar\b/gi, '').trim();
          
          // Remove duplicate make from model (if model starts with make)
          if (make && model) {
            const makeLower = make.toLowerCase();
            const modelLower = model.toLowerCase();
            if (modelLower.startsWith(makeLower)) {
              model = model.substring(make.length).trim();
            }
            // Also check if model contains make as a separate word
            const modelWords = modelLower.split(/\s+/);
            if (modelWords.includes(makeLower)) {
              model = model.replace(new RegExp(`\\b${make}\\b`, 'gi'), '').trim();
            }
          }
          
          // Remove duplicate variant from model (if variant is already in model)
          if (variant && model) {
            const variantLower = variant.toLowerCase();
            const modelLower = model.toLowerCase();
            if (modelLower.includes(variantLower)) {
              variant = '';
            }
          }
          
          // Remove duplicate words within variant itself
          if (variant) {
            const variantWords = variant.split(/\s+/);
            const uniqueVariantWords: string[] = [];
            const seen = new Set<string>();
            for (const word of variantWords) {
              const wordLower = word.toLowerCase();
              if (!seen.has(wordLower)) {
                seen.add(wordLower);
                uniqueVariantWords.push(word);
              }
            }
            variant = uniqueVariantWords.join(' ').trim();
          }
          
          // Construct final string with only non-empty, unique parts
          const parts: string[] = [];
          if (make) parts.push(make);
          if (model) parts.push(model);
          if (variant) parts.push(variant);
          
          let carInfo = parts.join(' ').trim();
          
          // Remove any remaining duplicate consecutive words
          carInfo = carInfo.replace(/\b(\w+)(\s+\1)+\b/gi, '$1');
          
          // Clean up multiple spaces
          carInfo = carInfo.replace(/\s+/g, ' ').trim();
          
          return carInfo || 'Car Details';
        })() : 'Car Details'}
      </Text>

      {/* Car Details with Icons - Same as Popular New Cars */}
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

        {carDetails?.fuelType && (
          <View style={styles.detailItem}>
            <FontAwesome5 name="gas-pump" size={18} color="#CD0100" />
            <Text style={styles.detailText}>{carDetails.fuelType}</Text>
          </View>
        )}
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
            console.log('🔍 Inspection button clicked:', {
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
          {sectionsWithRatings && sectionsWithRatings.length > 0 && (
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
          )}

          {/* View Report and PDF Buttons */}
          <View style={{ gap: 10 }}>
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

          </View>

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
          <Text style={styles.label}>Brand</Text>
          <Text style={styles.value}>{carDetails?.make || 'Not specified'}</Text>
        </View>
        <View style={styles.overviewRow}>
          <Text style={styles.label}>Model</Text>
          <Text style={styles.value}>{carDetails?.model || 'Not specified'}</Text>
        </View>
        <View style={styles.overviewRow}>
          <Text style={styles.label}>Variant</Text>
          <Text style={styles.value}>{carDetails?.variant || 'Not specified'}</Text>
        </View>
        <View style={styles.overviewRow}>
          <Text style={styles.label}>Year</Text>
          <Text style={styles.value}>{carDetails?.year || 'Not specified'}</Text>
        </View>
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
          <Text style={styles.value}>{carDetails?.bodyType || 'Not specified'}</Text>
        </View>
        <View style={styles.overviewRow}>
          <Text style={styles.label}>Body Color</Text>
          <Text style={styles.value}>{carDetails?.bodyColor || 'Not specified'}</Text>
        </View>
        <View style={styles.overviewRow}>
          <Text style={styles.label}>Engine Capacity</Text>
          <Text style={styles.value}>{carDetails?.engineCapacity ? `${carDetails.engineCapacity} cc` : 'Not specified'}</Text>
        </View>
        <View style={styles.overviewRow}>
          <Text style={styles.label}>Transmission</Text>
          <Text style={styles.value}>{carDetails?.transmission || 'Not specified'}</Text>
        </View>
        <TouchableOpacity onPress={() => setModalVisible(true)}>
        <Text style={styles.showMore}>Show More</Text>
      </TouchableOpacity>
      </View>
      <View style={styles.divider} />
      <View>
      <Text style={styles.sectionTitle}>Features</Text>
      <View style={styles.featuresWrapper}>
        {(carDetails?.features && Array.isArray(carDetails.features) ? carDetails.features : []).map((feature: any, index: number) => (
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
      <Text style={styles.sectionTitle}>Map View</Text>
      <View style={styles.overview2}>
  <Text style={styles.carModel1}>{carDetails.location}</Text>

</View>
<View style={styles.divider} />

      {/* Seller Information - Hide for Managed by AutoFinder properties */}
      {sellerData && !isOwnProperty && !carDetails?.isManaged && (
        <>
          <Text style={styles.sectionTitle}>Seller Information</Text>
          <View style={[styles.sellerContainer, sellerData.isPlaceholder && styles.sellerContainerPlaceholder]}>
            <View style={styles.sellerInfo}>
              <View style={[styles.sellerAvatar, sellerData.isPlaceholder && styles.sellerAvatarPlaceholder]}>
                <FontAwesome name="user" size={24} color={sellerData.isPlaceholder ? "#999" : "#CD0100"} />
              </View>
              <View style={styles.sellerDetails}>
                <Text style={[styles.sellerName, sellerData.isPlaceholder && styles.sellerNamePlaceholder]}>
                  {sellerData.name || 'Seller'}
                </Text>
                {sellerData.isPlaceholder ? (
                  <Text style={styles.sellerPhonePlaceholder}>
                    ⚠️ Contact information not available
                  </Text>
                ) : null}
                <Text style={styles.sellerLocation}>
                  📍 {carDetails.location || 'Location not specified'}
                </Text>
                {sellerData.isPlaceholder && (
                  <Text style={styles.sellerNote}>
                    This appears to be a dealer listing without contact information.
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
      {carDetails && !carDetails.isManaged && (
        <SimilarCars
          currentCarId={carDetails._id}
          make={carDetails.make}
          model={carDetails.model}
          adType="car"
        />
      )}

    </ScrollView>
    {/* DEBUG: Log isOwnProperty state */}
    {console.log('🎯 RENDERING BOTTOM CONTAINER - isOwnProperty:', isOwnProperty, 'userData.userId:', userData?.userId, 'carDetails.userId:', carDetails?.userId)}
    <View style={[
        styles.bottomContainer, 
        isOwnProperty && styles.ownPropertyBottomContainer,
        { 
          bottom: Platform.OS === 'ios' 
            ? Math.max(insets.bottom, 20) + 20  // Tab bar height ~20 + safe area (minimal gap)
            : Math.max(insets.bottom, 10) + 15  // Tab bar height ~15 + safe area (minimal gap)
        }
      ]}>
      {isOwnProperty ? (
        // Show "own property" message - hide all buttons (Call, WhatsApp, Chat)
        // FIXED: Style same as My Ads screen
        <View style={styles.ownPropertyBadge}>
          <Ionicons name="home-outline" size={18} color="#856404" />
          <Text style={styles.ownPropertyBadgeText}>This is your own property</Text>
        </View>
      ) : (
        // Show normal buttons for other people's ads
        <>
          <TouchableOpacity 
            style={[
              styles.callButton, 
              (sellerData?.isPlaceholder && !carDetails?.isManaged) && styles.disabledButton
            ]} 
            onPress={handleCall}
            disabled={sellerData?.isPlaceholder && !carDetails?.isManaged}
          >
        <FontAwesome 
          name="phone" 
          size={16} 
          color={(sellerData?.isPlaceholder && !carDetails?.isManaged) ? "#ccc" : "#FF6B6B"} 
        />
            <Text style={[
              styles.buttonText, 
              (sellerData?.isPlaceholder && !carDetails?.isManaged) && styles.disabledButtonText
            ]}>
              Call
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[
              styles.whatsappButton, 
              (sellerData?.isPlaceholder && !carDetails?.isManaged) && styles.disabledButton
            ]} 
            onPress={handleWhatsApp}
            disabled={sellerData?.isPlaceholder && !carDetails?.isManaged}
          >
        <FontAwesome 
          name="whatsapp" 
          size={16} 
          color={(sellerData?.isPlaceholder && !carDetails?.isManaged) ? "#ccc" : "#25D366"} 
        />
            <Text style={[
              styles.buttonText, 
              (sellerData?.isPlaceholder && !carDetails?.isManaged) && styles.disabledButtonText
            ]}>
              WhatsApp
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.chatButton} onPress={async () => {
            // Check if user is logged in
            try {
              const storedUserData = await AsyncStorage.getItem('user');
              if (!storedUserData) {
                Alert.alert(
                  "Login Required",
                  "You are not logged in. Please login to chat with the seller.",
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
                adId: carDetails._id || carDetails.id, 
                sellerId: sellerId,
                carDetails: carDetails,
                propertyDetails: carDetails,
                propertyType: 'car',
                carTitle: carInfo.title,
                carPrice: carInfo.price,
                carImage: carInfo.image
              } 
            });
          }}>
            <Feather name="message-square" size={16} color="#2196F3" />
            <Text style={styles.buttonText}>Chat</Text>
          </TouchableOpacity>
        </>
      )}
      </View>
  
  <CarDetailsModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        carDetails={carDetails}
      />  
  </View>
  
  {/* Fullscreen Image Viewer - Outside mainContainer to render on top */}
  <ImageViewing
    images={images.map(img => ({ uri: img }))} 
    imageIndex={selectedIndex}
    visible={visible}
    onRequestClose={() => {
      console.log('🖼️ ImageViewing onRequestClose called - closing image viewer');
      setVisible(false);
    }}
    swipeToCloseEnabled={true}
    doubleTapToZoomEnabled={true}
    ImageComponent={WatermarkedImage}
  />
  </>
  );
};

export default CarDetailsScreen;

const styles = createResponsiveStyleSheet({
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
  priceContainer: {
    paddingHorizontal: 15,
    paddingTop: 0,
    paddingBottom: 2,
    width: '100%',
  },
  priceTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingRight: 5,
  },
  price: {
    fontSize: 24,
    fontWeight: "bold",
    color:"#CD0100",
    flex: 1,
  },
  carModel: {
    fontSize: 18,
    fontWeight: "500",
    color: "#666",
    paddingHorizontal: 15,
    marginTop: 0,
    paddingTop: 2,
  },
  specsContainer: {
    flexDirection: "row",
    marginTop: 10,
    marginBottom: 12,
    paddingHorizontal: 16,
    flexWrap: 'wrap',
    gap: 4,
  },
  specItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    flex: 1,
    minWidth: 80,
    maxWidth: '33%',
  },
  specText: {
    fontSize: 14,
    color: "#666",
    flexShrink: 1,
  },
  description: {
    fontSize: 14,
    color: "#333",
    marginBottom: 8,
    paddingHorizontal: 16,
    lineHeight: 20,
    flexWrap: 'wrap',
  },
  locationContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    paddingHorizontal: 16,
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
    backgroundColor: "transparent",
    paddingVertical: 12,
    marginLeft:10,
    marginRight: 8,
    width: "30%", // Three buttons
    borderRadius: 25,
    borderWidth: 0,
    borderColor: "transparent",
    shadowColor: "transparent",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  whatsappButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
    paddingVertical: 12,
    marginHorizontal: 8,
    width: "30%", // Three buttons
    borderRadius: 25,
    borderWidth: 0,
    borderColor: "transparent",
    shadowColor: "transparent",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  chatButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
    paddingVertical: 12,
    marginRight:10,
    marginLeft: 8,
    width: "30%", // Three buttons
    borderRadius: 25,
    borderWidth: 0,
    borderColor: "transparent",
    shadowColor: "transparent",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
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
  badgesRowContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingTop: 10,
    paddingBottom: 5,
  },
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    alignItems: 'center',
  },
  timeAgo: {
    fontSize: 12,
    color: "#999",
    marginLeft: 10,
    alignSelf: 'flex-end',
  },
  featuredBadge: {
    backgroundColor: '#FFDF00', 
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  managedBadge: {
    backgroundColor: '#CD0100', 
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    alignSelf: 'flex-start',
    maxWidth: '100%',
  },
  featuredText: {
    color: 'black',
    fontWeight: 'bold',
    fontSize: 12,
  },
  managedText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
    flexShrink: 1,
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
  // Disabled button styles
  disabledButton: {
    backgroundColor: '#ddd',
    borderColor: '#ccc',
  },
  disabledButtonText: {
    color: '#999',
  },
  // Own property bottom container style
  ownPropertyBottomContainer: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 0,
  },
  // Own property badge styles (same as My Ads screen)
  ownPropertyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff3cd', // Light yellow background (same as My Ads)
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    marginHorizontal: 16,
    marginVertical: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#ffc107', // Yellow border (same as My Ads warning style)
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  ownPropertyBadgeText: {
    color: '#856404', // Dark yellow text (same as My Ads warning text)
    fontWeight: '600',
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  ownPropertyBadgeSubtext: {
    color: '#856404',
    fontSize: 11,
    marginLeft: 8,
    fontStyle: 'italic',
    opacity: 0.8,
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
  fullscreenWatermark: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullscreenWatermarkContainer: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 6,
    backgroundColor: 'transparent',
  },
  fullscreenWatermarkText: {
    color: 'rgba(255, 255, 255, 0.3)',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 1.5,
  },
});
