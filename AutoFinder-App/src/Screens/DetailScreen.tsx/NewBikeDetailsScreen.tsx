import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Image, StyleSheet,Linking , TouchableOpacity, ScrollView, ActivityIndicator, BackHandler, Platform, Share } from "react-native";
import Swiper from "react-native-swiper";
import { Entypo, FontAwesome5, Feather, FontAwesome, Ionicons } from "@expo/vector-icons";
import CarDetailsModal from "../../Components/Models/CarDetailsModal";
import ImageViewing from "react-native-image-viewing";
import { API_URL } from '../../../config';
import BikeDetailsModal from '../../Components/Models/BikeDetailsModal';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { generatePropertyMessage, createWhatsAppUrl } from '../../utils/propertyMessageGenerator';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { rf, rp, createResponsiveStyleSheet, isAndroid } from "../../utils/responsive";
import { useNavigation } from '@react-navigation/native';
import { getCurrentUserId } from '../../services/chat';

const NewBikeDetailsScreen = ({ route }: { route: any }) => {
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
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  console.log('🔍 Route params received:', route.params);
  console.log('🔍 Route params keys:', Object.keys(route.params || {}));
  const { carDetails: initialCarDetails } = route.params;
  console.log('🔍 Initial carDetails from route:', initialCarDetails);
  console.log('🔍 Initial carDetails._id:', initialCarDetails?._id);
  console.log('🔍 Initial carDetails.userId:', initialCarDetails?.userId);
  const [carDetails, setCarDetails] = useState(initialCarDetails);
  
  // Debug: Log overview fields
  useEffect(() => {
    console.log("🔍 Bike Overview Fields Check:", {
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
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isLoadingFavorite, setIsLoadingFavorite] = useState(false);
  const [sellerPhone, setSellerPhone] = useState<string | null>(null);
  const [isLoadingPhone, setIsLoadingPhone] = useState(false);
  const [sellerInfo, setSellerInfo] = useState<{name: string, email: string, phone: string} | null>(null);
  const [isOwnProperty, setIsOwnProperty] = useState<boolean>(false);

  // Fetch complete ad data if only ID is provided or if overview fields are missing
  const fetchAdDetails = async (adId: string) => {
    try {
      setLoading(true);
      console.log('🔍 Fetching bike details for ID:', adId);
      
      // Use /all_ads/:id endpoint first (this should have userId properly serialized)
      console.log('Trying /all_ads endpoint...');
      const response = await fetch(`${API_URL}/all_ads/${adId}`);
      
      if (response.ok) {
        const adData = await response.json();
        console.log('✅ Found bike data from /all_ads:', adData);
        console.log('✅ Bike userId from /all_ads:', adData.userId);
        console.log('✅ Bike userId type:', typeof adData.userId);
        
        // Merge with existing data, but keep existing data (like images) if it exists
        setCarDetails((prev: any) => ({
          ...prev,
          ...adData, // Override with complete data
          images: prev?.images || adData.images || [] // Keep existing images if available
        }));
        
        // If userId exists, fetch seller info immediately
        if (adData.userId) {
          console.log('✅ userId found in bike data, will fetch seller info');
          // The useEffect will handle fetching seller info when carDetails changes
        } else {
          console.warn('⚠️ No userId found in bike data from /all_ads');
        }
      } else {
        console.error('❌ Failed to fetch bike details from /all_ads:', response.status);
        
        // Fallback: Try admin endpoint (requires auth, might fail)
        console.log('Trying admin endpoint as fallback...');
        try {
          const adminResponse = await fetch(`${API_URL}/admin/premium-bike-ads`);
          if (adminResponse.ok) {
            const adminData = await adminResponse.json();
            const matchingAd = adminData.find((ad: any) => ad._id === adId);
            
            if (matchingAd) {
              console.log('✅ Found matching ad in admin data:', matchingAd);
              setCarDetails((prev: any) => ({
                ...prev,
                ...matchingAd,
                images: prev?.images || matchingAd.images || []
              }));
            }
          }
        } catch (adminError) {
          console.log('❌ Admin endpoint also failed (expected if not authenticated)');
        }
      }
    } catch (error) {
      console.error('❌ Error fetching bike details:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Track if we've already attempted to fetch for this ID
  const fetchAttemptedRef = useRef<Set<string>>(new Set());
  
  // Check if we need to fetch complete data (for overview fields) - ALWAYS fetch if we have an ID
  useEffect(() => {
    const adId = carDetails?._id || carDetails?.id || carDetails?.bikeId;
    if (!adId || loading) return;
    
    // Skip if we've already tried to fetch this ID
    if (fetchAttemptedRef.current.has(adId)) {
      return;
    }
    
    console.log('🔍 Checking if we need to fetch complete data for ID:', adId);
    // Check if we have minimal data (only basic fields)
    const hasMinimalData = carDetails?.make || carDetails?.model || carDetails?.price;
    const missingOverviewFields = !carDetails?.bodyType && 
                                   !carDetails?.topSpeed && 
                                   !carDetails?.engineType && 
                                   !carDetails?.transmission &&
                                   !carDetails?.engineCapacity &&
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
  }, [carDetails?._id, carDetails?.id, carDetails?.bikeId, loading]);

  // Fetch seller data from backend using premium bike ID
  const fetchSellerDataFromBackend = async (bikeId: string) => {
    try {
      console.log('🔍 Fetching seller data from backend for bike ID:', bikeId);
      console.log('🔍 Bike ID type:', typeof bikeId);
      console.log('🔍 Bike ID value:', bikeId);
      setIsLoadingPhone(true);
      
      // Try the regular premium-bike-ads endpoint first (now includes phone data)
      const response = await fetch(`${API_URL}/premium-bike-ads`);
      if (response.ok) {
        const bikeAds = await response.json();
        const matchingBike = bikeAds.find((bike: any) => bike._id === bikeId);
        
        if (matchingBike && matchingBike.userId) {
          console.log('✅ Found matching bike in admin data:', matchingBike);
          console.log('✅ Bike userId:', matchingBike.userId);
          
          if (typeof matchingBike.userId === 'object') {
            // Extract user information from populated userId
            const userInfo = {
              name: matchingBike.userId.name || matchingBike.userId.fullName || 'Unknown User',
              email: matchingBike.userId.email || matchingBike.userId.emailAddress || 'No email',
              phone: matchingBike.userId.phone || matchingBike.userId.phoneNumber || matchingBike.userId.mobile || 'No phone'
            };
            
            console.log('✅ User info extracted from admin data:', userInfo);
            setSellerInfo(userInfo);
            
            if (userInfo.phone && userInfo.phone !== 'No phone') {
              setSellerPhone(userInfo.phone);
            } else {
              setSellerPhone(null);
            }
          } else {
            // Fetch user data via API
            fetchSellerPhone(String(matchingBike.userId));
          }
        } else {
          console.log('❌ No matching bike found in premium data, trying admin endpoint...');
          
          // Fallback to admin endpoint
          const adminResponse = await fetch(`${API_URL}/admin/premium-bike-ads`);
          if (adminResponse.ok) {
            const adminBikeAds = await adminResponse.json();
            const adminMatchingBike = adminBikeAds.find((bike: any) => bike._id === bikeId);
            
            if (adminMatchingBike && adminMatchingBike.userId) {
              console.log('✅ Found matching bike in admin data:', adminMatchingBike);
              
              if (typeof adminMatchingBike.userId === 'object') {
                const userInfo = {
                  name: adminMatchingBike.userId.name || adminMatchingBike.userId.fullName || 'Unknown User',
                  email: adminMatchingBike.userId.email || adminMatchingBike.userId.emailAddress || 'No email',
                  phone: adminMatchingBike.userId.phone || adminMatchingBike.userId.phoneNumber || adminMatchingBike.userId.mobile || 'No phone'
                };
                
                console.log('✅ User info extracted from admin data:', userInfo);
                setSellerInfo(userInfo);
                
                if (userInfo.phone && userInfo.phone !== 'No phone') {
                  setSellerPhone(userInfo.phone);
                } else {
                  setSellerPhone(null);
                }
              } else {
                fetchSellerPhone(String(adminMatchingBike.userId));
              }
            } else {
              console.log('❌ No matching bike found in admin data either');
              setSellerInfo(null);
              setSellerPhone(null);
            }
          } else {
            console.log('❌ Failed to fetch admin data');
            setSellerInfo(null);
            setSellerPhone(null);
          }
        }
      } else {
        console.log('❌ Failed to fetch premium data');
        setSellerInfo(null);
        setSellerPhone(null);
      }
    } catch (error) {
      console.error('❌ Error fetching seller data from backend:', error);
      setSellerInfo(null);
      setSellerPhone(null);
    } finally {
      setIsLoadingPhone(false);
    }
  };

  // Check if this is the user's own property
  const checkIfOwnProperty = async () => {
    try {
      const currentUserId = await getCurrentUserId();
      const sellerId = carDetails?.userId || carDetails?.sellerId || carDetails?.postedBy;
      
      if (currentUserId && sellerId) {
        // Extract the actual ID from sellerId (it might be an object or string)
        const actualSellerId = typeof sellerId === 'object' ? sellerId._id : sellerId;
        const isOwn = currentUserId === actualSellerId;
        setIsOwnProperty(isOwn);
        console.log("🔍 NewBikeDetailsScreen - Checking if own property:", { 
          isOwn,
          currentUserId, 
          sellerId: sellerId, 
          actualSellerId 
        });
      } else {
        setIsOwnProperty(false);
        console.log("🔍 NewBikeDetailsScreen - Cannot check own property - missing IDs:", { 
          hasCurrentUserId: !!currentUserId, 
          hasSellerId: !!sellerId 
        });
      }
    } catch (error) {
      console.error("Error checking if own property:", error);
      setIsOwnProperty(false);
    }
  };

  // Re-check own property whenever carDetails userId/sellerId changes
  useEffect(() => {
    if (carDetails?._id) {
      checkIfOwnProperty();
    }
  }, [carDetails?.userId, carDetails?.sellerId, carDetails?.postedBy, carDetails?._id]);

  // Fetch seller's phone number dynamically (same logic as admin dashboard)
  const fetchSellerPhone = async (userId: string) => {
    if (!userId) {
      console.log('No userId provided for phone fetching');
      return;
    }

    setIsLoadingPhone(true);
    try {
      console.log(`🔍 Fetching phone for seller userId: ${userId}`);
      
      // Try public seller-info first (no auth), then other endpoints
      const endpoints = [
        `${API_URL}/users/${userId}/seller-info`,
        `${API_URL}/users/${userId}`,
        `${API_URL}/user/${userId}`,
        `${API_URL}/api/user/${userId}`,
        `${API_URL}/api/users/${userId}`,
        `${API_URL}/api/users/get/${userId}`,
        `${API_URL}/users/get/${userId}`
      ];

      let userInfo = null;
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
            
            // Extract user information from various possible fields (same as admin dashboard)
            const name = data.name || data.fullName || data.userName || data.username || 'Unknown User';
            const email = data.email || data.emailAddress || 'No email';
            const phone = data.phone || data.phoneNumber || data.mobile || data.contact || data.phone_number || data.mobileNumber || 'No phone';
            
            userInfo = { name, email, phone };
            break;
          } else {
            console.log(`❌ Endpoint ${endpoint} failed with status: ${response.status}`);
          }
        } catch (error) {
          console.log(`❌ Error with endpoint ${endpoint}:`, error);
        }
      }

      if (userInfo) {
        console.log(`✅ User info found via API:`, userInfo);
        setSellerInfo(userInfo);
        
        if (userInfo.phone && userInfo.phone !== 'No phone') {
          console.log(`✅ Phone number found via API: ${userInfo.phone}`);
          setSellerPhone(userInfo.phone);
        } else {
          console.log(`❌ No phone number found for userId: ${userId}`);
          setSellerPhone(null);
        }
      } else {
        console.log(`❌ No user info found for userId: ${userId}`);
        setSellerInfo(null);
        setSellerPhone(null);
      }
    } catch (error) {
      console.error(`❌ Error fetching phone for ${userId}:`, error);
      setSellerPhone(null);
    } finally {
      setIsLoadingPhone(false);
    }
  };


  useEffect(() => {
    // Log carDetails when the component mounts
    console.log("Car Details:", carDetails);
    
    // Set loading to false if we have data
    if (carDetails && (carDetails.description || carDetails.make || carDetails.model)) {
      console.log("Data available, setting loading to false");
      setLoading(false);
    }
  }, [carDetails]);

  useEffect(() => {
    console.log("Car Details:", carDetails);
    if (!carDetails.description) {
      console.warn("carDetails.description is missing!");
    }
  }, [carDetails]);
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

  // Fetch seller's phone number when carDetails changes
  useEffect(() => {
    console.log('🔍 CarDetails changed:', carDetails);
    console.log('🔍 CarDetails._id:', carDetails?._id);
    console.log('🔍 CarDetails.userId:', carDetails?.userId);
    console.log('🔍 CarDetails.userId type:', typeof carDetails?.userId);
    console.log('🔍 Available carDetails fields:', Object.keys(carDetails || {}));
    console.log('🔍 Full carDetails object:', JSON.stringify(carDetails, null, 2));
    console.log('🔍 CarDetails.postedBy:', carDetails?.postedBy);
    console.log('🔍 CarDetails.sellerId:', carDetails?.sellerId);
    console.log('🔍 CarDetails.seller:', carDetails?.seller);
    console.log('🔍 CarDetails.user:', carDetails?.user);
    console.log('🔍 CarDetails.owner:', carDetails?.owner);
    console.log('🔍 CarDetails.createdBy:', carDetails?.createdBy);
    console.log('🔍 CarDetails._id:', carDetails?._id);
    console.log('🔍 CarDetails.title:', carDetails?.title);
    console.log('🔍 CarDetails.make:', carDetails?.make);
    console.log('🔍 CarDetails.model:', carDetails?.model);
    console.log('🔍 CarDetails.isFeatured:', carDetails?.isFeatured);
    console.log('🔍 CarDetails.isActive:', carDetails?.isActive);
    console.log('🔍 CarDetails.dateAdded:', carDetails?.dateAdded);
    console.log('🔍 CarDetails.contactInfo:', carDetails?.contactInfo);
    console.log('🔍 CarDetails.contact:', carDetails?.contact);
    console.log('🔍 CarDetails.phone:', carDetails?.phone);
    console.log('🔍 CarDetails.phoneNumber:', carDetails?.phoneNumber);
    console.log('🔍 CarDetails.mobile:', carDetails?.mobile);
    console.log('🔍 CarDetails.sellerName:', carDetails?.sellerName);
    console.log('🔍 CarDetails.ownerName:', carDetails?.ownerName);
    console.log('🔍 CarDetails.contactName:', carDetails?.contactName);
    console.log('🔍 CarDetails.sellerEmail:', carDetails?.sellerEmail);
    console.log('🔍 CarDetails.ownerEmail:', carDetails?.ownerEmail);
    console.log('🔍 CarDetails.contactEmail:', carDetails?.contactEmail);
    console.log('🔍 CarDetails.sellerPhone:', carDetails?.sellerPhone);
    console.log('🔍 CarDetails.ownerPhone:', carDetails?.ownerPhone);
    console.log('🔍 CarDetails.contactPhone:', carDetails?.contactPhone);
    console.log('🔍 CarDetails.author:', carDetails?.author);
    console.log('🔍 CarDetails.creator:', carDetails?.creator);
    console.log('🔍 CarDetails.postedByUser:', carDetails?.postedByUser);
    console.log('🔍 CarDetails.sellerInfo:', carDetails?.sellerInfo);
    console.log('🔍 CarDetails.ownerInfo:', carDetails?.ownerInfo);
    console.log('🔍 CarDetails.contactDetails:', carDetails?.contactDetails);
    
        if (carDetails && carDetails.userId) {
          console.log('🔍 Processing userId from carDetails:', carDetails.userId);
          console.log('🔍 userId type:', typeof carDetails.userId);
          
          // The userId might be populated with user data from the backend (admin endpoint)
          // OR it might be just a string ObjectId (from /all_ads/:id)
          if (typeof carDetails.userId === 'object' && carDetails.userId !== null) {
            // Check if it's an empty object (shouldn't happen but check anyway)
            const keys = Object.keys(carDetails.userId);
            if (keys.length === 0) {
              console.warn('⚠️ userId is empty object, skipping');
              setSellerInfo(null);
              setSellerPhone(null);
              return;
            }
            
            console.log('🔍 userId is populated object with user data:', carDetails.userId);
            console.log('🔍 Available fields in userId:', keys);
            console.log('🔍 userId.phone:', carDetails.userId.phone);
            console.log('🔍 userId.phoneNumber:', carDetails.userId.phoneNumber);
            console.log('🔍 userId.mobile:', carDetails.userId.mobile);
            
            // Check if it has user data fields (name, email, phone)
            if (carDetails.userId.name || carDetails.userId.email || carDetails.userId.phone) {
              // Extract user information directly from populated userId
              const userInfo = {
                name: carDetails.userId.name || carDetails.userId.fullName || 'Unknown User',
                email: carDetails.userId.email || carDetails.userId.emailAddress || 'No email',
                phone: carDetails.userId.phone || carDetails.userId.phoneNumber || carDetails.userId.mobile || carDetails.userId.contact || carDetails.userId.phone_number || carDetails.userId.mobileNumber || 'No phone'
              };
              
              console.log('✅ User info extracted from populated userId:', userInfo);
              setSellerInfo(userInfo);
              
              if (userInfo.phone && userInfo.phone !== 'No phone') {
                console.log('✅ Phone number found in populated data:', userInfo.phone);
                setSellerPhone(userInfo.phone);
              } else {
                console.log('❌ No phone number found in populated data, trying API fetch...');
                // Try to fetch user data via API as fallback
                const userId = carDetails.userId._id || carDetails.userId.id || carDetails.userId;
                if (userId) {
                  console.log('🔍 Fetching user data via API for userId:', userId);
                  fetchSellerPhone(String(userId));
                } else {
                  console.log('❌ No userId available for API fetch');
                  setSellerPhone(null);
                }
              }
            } else {
              // Object but no user data - might be ObjectId object, extract _id
              const userId = carDetails.userId._id || carDetails.userId.id || carDetails.userId.toString?.();
              if (userId) {
                console.log('🔍 userId is object but no user data, extracting ID and fetching:', userId);
                fetchSellerPhone(String(userId));
              } else {
                console.warn('⚠️ userId is object but cannot extract ID');
                setSellerInfo(null);
                setSellerPhone(null);
              }
            }
          } else if (typeof carDetails.userId === 'string') {
            // If userId is a string (ObjectId string from /all_ads/:id), fetch user data
            console.log('🔍 userId is string, fetching user data via API:', carDetails.userId);
            fetchSellerPhone(String(carDetails.userId));
          } else {
            console.warn('⚠️ userId is neither object nor string:', typeof carDetails.userId);
            setSellerInfo(null);
            setSellerPhone(null);
          }
        } else if (carDetails && (carDetails._id || carDetails.bikeId || carDetails.id)) {
          const bikeId = carDetails._id || carDetails.bikeId || carDetails.id;
          console.log('🔍 No userId found, but bike ID available:', bikeId);
          // Try to fetch seller data from backend using the bike ID
          fetchSellerDataFromBackend(bikeId);
        } else {
      console.log('❌ No userId found in carDetails, trying other seller fields...');
      
      // Try to find seller ID in other possible fields
      let sellerId = null;
      
      if (carDetails.postedBy) {
        sellerId = carDetails.postedBy;
        console.log('🔍 Found sellerId in postedBy:', sellerId);
      } else if (carDetails.sellerId) {
        sellerId = carDetails.sellerId;
        console.log('🔍 Found sellerId in sellerId:', sellerId);
      } else if (carDetails.seller) {
        sellerId = carDetails.seller;
        console.log('🔍 Found sellerId in seller:', sellerId);
      } else if (carDetails.user) {
        sellerId = carDetails.user;
        console.log('🔍 Found sellerId in user:', sellerId);
      } else if (carDetails.owner) {
        sellerId = carDetails.owner;
        console.log('🔍 Found sellerId in owner:', sellerId);
      } else if (carDetails.createdBy) {
        sellerId = carDetails.createdBy;
        console.log('🔍 Found sellerId in createdBy:', sellerId);
      }
      
      if (sellerId) {
        console.log('🔍 Using sellerId for fetching:', sellerId);
        fetchSellerPhone(String(sellerId));
      } else {
        console.log('❌ No seller ID found in any field, checking for direct contact info...');
        
        // Check if contact info is directly in the premium bike data
        const directPhone = carDetails.phone || carDetails.phoneNumber || carDetails.mobile || carDetails.contact;
        const directName = carDetails.sellerName || carDetails.ownerName || carDetails.contactName;
        const directEmail = carDetails.sellerEmail || carDetails.ownerEmail || carDetails.contactEmail;
        
        console.log('🔍 Direct contact info found:', {
          phone: directPhone,
          name: directName,
          email: directEmail
        });
        
        if (directPhone || directName || directEmail) {
          console.log('✅ Using direct contact info from premium bike data');
          const userInfo = {
            name: directName || 'Unknown Seller',
            email: directEmail || 'No email',
            phone: directPhone || 'No phone'
          };
          
          setSellerInfo(userInfo);
          if (directPhone && directPhone !== 'No phone') {
            setSellerPhone(directPhone);
          } else {
            setSellerPhone(null);
          }
        } else {
          console.log('❌ No direct contact info found, trying to fetch from backend...');
          
          // Try to fetch seller data from backend using the premium bike ID
          if (carDetails._id) {
            console.log('🔍 Trying to fetch seller data from backend using bike ID:', carDetails._id);
            fetchSellerDataFromBackend(carDetails._id);
          } else {
            console.log('❌ No bike ID available for backend fetch');
            setSellerInfo(null);
            setSellerPhone(null);
          }
        }
      }
    }
  }, [carDetails, userData]);

  
  const [modalVisible, setModalVisible] = useState(false);
  const [showBottomButtons, setShowBottomButtons] = useState(true);
  const scrollViewRef = useRef<ScrollView>(null);
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
  
  
    const images = carDetails.images || [];

  const [expanded, setExpanded] = useState(false);
  const toggleExpand = () => setExpanded(!expanded);
  const [failedImages, setFailedImages] = useState<Set<number>>(new Set());
   useEffect(() => {
      if (userData && carDetails?.favoritedBy) {
        const isAlreadyFavorited = carDetails.favoritedBy.includes(userData.userId);
        setIsFavorite(isAlreadyFavorited);
      }
    }, [userData, carDetails]);
    
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
    
        const data = await response.json();
    
        if (response.ok) {
          setIsFavorite(!isFavorite);
          console.log("Favorite state updated successfully.");
        } else {
          console.warn("Favorite toggle failed:", data.message);
        }
      } catch (error) {
        console.error("Error toggling favorite:", error);
      } finally {
        setIsLoadingFavorite(false);
      }
    };

  const shareBike = async () => {
    try {
      const shareUrl = `https://autofinder.pk/new-bike/${carDetails._id}`;
      const shareMessage = `Check out this new bike: ${carDetails?.make || 'Bike'} ${carDetails?.model || ''} ${carDetails?.variant || ''} ${carDetails?.year || ''} for Rs. ${carDetails?.price || '0'} in ${carDetails?.location || carDetails?.city || 'N/A'} on autofinder.pk!\n\nView details: ${shareUrl}`;
      
      await Share.share({
        message: shareMessage,
        url: shareUrl, // For platforms that support URL
      });
    } catch (error) {
      console.log("Error sharing:", error);
    }
  };
    
  return (
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
     {images.map((img: any, index: number) => {
       const hasError = failedImages.has(index);
       return (
    <TouchableOpacity
      key={index}
      style={{ position: 'relative', backgroundColor: '#f0f0f0' }}
      onPress={() => {
        setSelectedIndex(index);
        setVisible(true);
      }}
    >
      <Image 
        source={hasError || !img ? require('../../../assets/Other/nodatafound.png') : { uri: img }}
        style={[styles.image, { backgroundColor: '#e8e8e8' }]}
        defaultSource={require('../../../assets/Other/nodatafound.png')}
        onError={() => {
          setFailedImages(prev => new Set(prev).add(index));
        }}
      />
      {/* Watermark */}
      {!hasError && (
      <View style={styles.watermark}>
        <View style={styles.watermarkContainer}>
          <Text style={styles.watermarkText}>autofinder.pk</Text>
        </View>
      </View>
      )}
    </TouchableOpacity>
  );
  })}
</Swiper>

<ImageViewing
  images={images.map((img: any) => ({ uri: img }))}
  imageIndex={selectedIndex}
  visible={visible}
  onRequestClose={() => setVisible(false)}
  ImageComponent={WatermarkedImage}
/>


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
        <TouchableOpacity style={styles.icon} onPress={shareBike}>
          <Feather name="share-2" size={24} color="black" />
        </TouchableOpacity>
      </View>
    </View>

      {/* Price */}
      {/* Price and Featured Badge */}
<View style={styles.priceContainer}>
<Text style={styles.price}>
  PKR {carDetails?.price ? Number(carDetails.price).toLocaleString('en-US') : '0'}
</Text>

  
  {/* Featured Badge - Only show for premium ads, not free ads */}
  {carDetails.featured && (carDetails.category || '') !== 'free' && (carDetails.adType || '') !== 'free' && (
    <View style={styles.featuredBadge}>
      <Text style={styles.featuredText}>Premium</Text>
    </View>
  )}
  {carDetails.isManaged && (
    <View style={styles.managedBadge}>
      <Text style={styles.managedText}>Managed By AutoFinder</Text>
    </View>
  )}
</View>


      {/* Bike Details - Brand, Model, Variant */}
      <Text style={styles.carModel}>
        {carDetails ? (() => {
          let make = (carDetails?.make || '').trim();
          let model = (carDetails?.model || '').trim();
          let variant = (carDetails?.variant || '').trim();
          
          // Remove "Bike" word if it appears (case insensitive)
          make = make.replace(/\bBike\b/gi, '').trim();
          model = model.replace(/\bBike\b/gi, '').trim();
          variant = variant.replace(/\bBike\b/gi, '').trim();
          
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
          
          // Build the display string
          let displayParts = [];
          if (make) displayParts.push(make);
          if (model) displayParts.push(model);
          if (variant) displayParts.push(variant);
          
          let result = displayParts.join(' ').trim();
          
          // Remove consecutive duplicate words (e.g., "Toyota Toyota" -> "Toyota")
          const words = result.split(/\s+/);
          const uniqueWords: string[] = [];
          let lastWord = '';
          for (const word of words) {
            if (word.toLowerCase() !== lastWord.toLowerCase()) {
              uniqueWords.push(word);
              lastWord = word;
            }
          }
          result = uniqueWords.join(' ');
          
          return result || 'Bike Details';
        })() : 'Bike Details'}
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

      {/* Divider */}
      <View style={styles.divider} />

      {/* Bike Overview - Only show fields that user actually fills */}
      <Text style={styles.sectionTitle}>Bike Overview</Text>
      <View style={styles.overview}>
        {/* Body Type - User fills this (stored as bodyType or enginetype in backend) */}
        {(() => {
          const bodyType = carDetails?.bodyType || 
                          carDetails?.bodytype || 
                          carDetails?.body_type ||
                          carDetails?.enginetype || // Bike_Ads model uses enginetype
                          carDetails?.engineType;
          if (bodyType && bodyType !== '' && bodyType !== 'null' && bodyType !== 'undefined') {
            return (
              <View style={styles.overviewRow}>
                <Text style={styles.label}>Body Type</Text>
                <Text style={styles.value}>{String(bodyType)}</Text>
              </View>
            );
          }
          return null;
        })()}
        
        {/* Fuel Type - User fills this */}
        {(() => {
          const fuelType = carDetails?.fuelType || carDetails?.fuel_type || carDetails?.fueltype || carDetails?.fuel;
          if (fuelType && fuelType !== '' && fuelType !== 'null' && fuelType !== 'undefined') {
            return (
              <View style={styles.overviewRow}>
                <Text style={styles.label}>Fuel Type</Text>
                <Text style={styles.value}>{String(fuelType)}</Text>
              </View>
            );
          }
          return null;
        })()}
        
        {/* Engine Capacity - User fills this as engineSize */}
        {(() => {
          const capacity = carDetails?.engineCapacity || 
                          carDetails?.engine_capacity || 
                          carDetails?.enginecapacity || 
                          carDetails?.capacity ||
                          carDetails?.engineSize;
          if (capacity && capacity !== '' && capacity !== 'null' && capacity !== 'undefined' && capacity !== '0') {
            const capacityStr = String(capacity);
            // Check if it already has a unit
            const hasUnit = capacityStr.toLowerCase().includes('cc') || 
                          capacityStr.toLowerCase().includes('l') || 
                          capacityStr.toLowerCase().includes('liter');
            return (
              <View style={styles.overviewRow}>
                <Text style={styles.label}>Engine Capacity</Text>
                <Text style={styles.value}>{hasUnit ? capacityStr : `${capacityStr} cc`}</Text>
              </View>
            );
          }
          return null;
        })()}
        
        {/* Transmission - User fills this (usually "Manual") */}
        {(() => {
          const transmission = carDetails?.transmission || carDetails?.transmissionType || carDetails?.transmission_type || carDetails?.gearbox;
          if (transmission && transmission !== '' && transmission !== 'null' && transmission !== 'undefined') {
            return (
              <View style={styles.overviewRow}>
                <Text style={styles.label}>Transmission</Text>
                <Text style={styles.value}>{String(transmission)}</Text>
              </View>
            );
          }
          return null;
        })()}
        
        {/* KM Driven - Only show if user actually filled it (not "0" or empty) */}
        {(() => {
          const mileage = carDetails?.kmDriven || 
                          carDetails?.mileage || 
                          carDetails?.km || 
                          carDetails?.kilometer ||
                          carDetails?.traveled;
          if (mileage !== null && mileage !== undefined && mileage !== '' && mileage !== '0' && mileage !== 0) {
            const mileageNum = typeof mileage === 'string' ? parseFloat(mileage) : mileage;
            if (!isNaN(mileageNum) && mileageNum > 0) {
              return (
                <View style={styles.overviewRow}>
                  <Text style={styles.label}>KM Driven</Text>
                  <Text style={styles.value}>{mileageNum.toLocaleString()} km</Text>
                </View>
              );
            }
          }
          return null;
        })()}
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
    ? carDetails.description
    : (carDetails.description ? carDetails.description.split(" ").slice(0, 40).join(" ") + "..." : "")
  }
</Text>

        <TouchableOpacity onPress={toggleExpand}>
            <Text style={styles.showMore}>{expanded ? "Show Less" : "Show More"}</Text>
        </TouchableOpacity>
        <Text style={styles.postedDate}>Posted On: {formatDate(carDetails.dateAdded)}</Text>
      </View>
      <View style={styles.divider} />
      
      {/* Seller Information Section - Hide for Managed by AutoFinder properties */}
      {!carDetails?.isManaged && (
        <>
          <Text style={styles.sectionTitle}>Seller Information</Text>
          <View style={styles.overview2}>
            {isLoadingPhone ? (
              <Text style={styles.carModel1}>Loading seller information...</Text>
            ) : sellerInfo ? (
              <View>
                <Text style={styles.carModel1}>Name: {sellerInfo.name}</Text>
                <Text style={styles.carModel1}>Email: {sellerInfo.email}</Text>
                {/* Phone hidden by request */}
              </View>
            ) : (
              <Text style={styles.carModel1}>Seller information not available</Text>
            )}
          </View>
          <View style={styles.divider} />
        </>
      )}
      <Text style={styles.sectionTitle}>Map View</Text>
      <View style={styles.overview2}>
  <Text style={styles.carModel1}>{carDetails.location}</Text>

</View>
<View style={styles.divider} />
<View style={styles.reportContainer}>
  <FontAwesome name="flag" size={24} color="black" /> 
  <Text style={styles.carModel2}>Report an Ad</Text>
</View>


    </ScrollView>
    <View style={[
        styles.bottomContainer,
        isOwnProperty && styles.ownPropertyBottomContainer,
        { 
          bottom: Platform.OS === 'ios' 
            ? Math.max(insets.bottom, 20) + 20  // Tab bar height ~20 + safe area (minimal gap)
            : Math.max(insets.bottom, 10) + 15  // Tab bar height ~15 + safe area (minimal gap)
        }
      ]}>
      {/* Main Contact Buttons - Only show if not own property */}
      {!isOwnProperty ? (
        <>
    <TouchableOpacity style={styles.callButton} onPress={() => {
      const rawPhone = sellerPhone || carDetails?.userId?.phone || carDetails?.phone;
      if (rawPhone && rawPhone !== 'No phone') {
        // Format phone number same as admin dashboard
        const formattedNumber = rawPhone.startsWith('+') ? rawPhone : `+92${rawPhone.replace(/^0/, '')}`;
        Linking.openURL(`tel:${formattedNumber}`);
      } else {
        console.log('Phone number not available for calling');
      }
    }}>
      <FontAwesome name="phone" size={16} color="#FF6B6B" />
      <Text style={styles.buttonText}>
        {isLoadingPhone ? 'Loading...' : 'Call'}
      </Text>
    </TouchableOpacity>

    <TouchableOpacity style={styles.whatsappButton} onPress={() => {
      const rawPhone = sellerPhone || carDetails?.userId?.phone || carDetails?.phone;
      if (rawPhone && rawPhone !== 'No phone') {
        // Generate property message using utility function
        const propertyMessage = generatePropertyMessage({...carDetails, type: 'bike'});
        
        // Create WhatsApp URL with message using utility function
        const whatsappUrl = createWhatsAppUrl(rawPhone, propertyMessage);
        
        console.log("💬 WhatsApp number:", rawPhone);
        console.log("💬 Property message:", propertyMessage);
        console.log("💬 WhatsApp URL:", whatsappUrl);
        
        Linking.openURL(whatsappUrl);
      } else {
        console.log('Phone number not available for WhatsApp');
      }
    }}>
      <FontAwesome name="whatsapp" size={16} color="#25D366" />
      <Text style={styles.buttonText}>
        {isLoadingPhone ? 'Loading...' : 'WhatsApp'}
      </Text>
    </TouchableOpacity>

    <TouchableOpacity style={styles.chatButton} onPress={() => {
      navigation.navigate('HomeTabs', { screen: 'Chat', params: { openForAd: true, adId: carDetails._id, sellerId: carDetails?.userId || carDetails?.sellerId || carDetails?.postedBy } });
    }}>
      <Feather name="message-square" size={16} color="#2196F3" />
      <Text style={styles.buttonText}>Chat</Text>
    </TouchableOpacity>
        </>
      ) : (
        <View style={styles.ownPropertyBadge}>
          <Text style={styles.ownPropertyBadgeText}>This is your own property</Text>
        </View>
      )}
  </View>
  
  <BikeDetailsModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        carDetails={carDetails}
      />  
  </View>
  );
};

export default NewBikeDetailsScreen;

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
    padding: 15,
  },
  carModel: {
    fontSize: 18,
    fontWeight: "500",
    color: "#666",
    paddingHorizontal: 15,
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
    justifyContent: "flex-start", // Aligns items from the start
    gap: 20, // Adds space between items
    paddingVertical: 10,
    paddingHorizontal: 15, // Adds some padding on the sides
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5, // Space between icon and text
  },  
  detailText: {
    fontSize: 14,
    color: "#666",
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
    width: "30%", // Each button takes 30% of width
    borderRadius: 15,
  },
  whatsappButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E8FEE8",
    paddingVertical: 12,
    marginRight:10,
    marginLeft: 8,
    width: "30%", // Each button takes 30% of width
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
    width: "30%", // Each button takes 30% of width
    borderRadius: 15,
  },
  ownPropertyBottomContainer: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 0,
  },
  ownPropertyBadge: {
    backgroundColor: '#FFDF00', 
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 20,
    marginHorizontal: 16,
    marginVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    width: '90%',
  },
  ownPropertyBadgeText: {
    color: 'black',
    fontWeight: 'bold',
    fontSize: 16,
    textAlign: 'center',
  },
  buttonText: {
    color: "#333",
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 10,
  },
  reportContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 25,
  },
  priceContainer: {
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    paddingRight:15,
    paddingVertical: 10,
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
  
});