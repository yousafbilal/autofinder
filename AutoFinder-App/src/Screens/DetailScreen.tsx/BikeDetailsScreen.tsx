import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Image, StyleSheet,Linking , TouchableOpacity, ScrollView, Dimensions, Modal, BackHandler, Platform, Alert, Share, ActivityIndicator } from "react-native";
import AsyncStorage from '@react-native-async-storage/async-storage';
import Swiper from "react-native-swiper";
import { Entypo, FontAwesome5, Feather, FontAwesome, Ionicons } from "@expo/vector-icons";
import CarDetailsModal from "../../Components/Models/CarDetailsModal";
import ImageViewing from "react-native-image-viewing";
import { API_URL, AUTOFINDER_PHONE, getAutofinderPhone } from '../../../config';
import BikeDetailsModal from '../../Components/Models/BikeDetailsModal';
import { safeGetAllImagesWithApiUrl } from '../../utils/safeImageUtils';
import { useNavigation } from '@react-navigation/native';
import { startConversation, sendMessage as sendChatMessage, getCurrentUserId, extractSellerId } from '../../services/chat';
import SimilarCars from '../../Components/SimilarCars';
import OptimizedImage from '../../Components/OptimizedImage';
import { preloadDetailImages } from '../../utils/imagePreloader';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { rf, rp, createResponsiveStyleSheet, isAndroid } from "../../utils/responsive";

const { width, height } = Dimensions.get('window');
const isTablet = width >= 768;
const isSmallScreen = width < 375;
const BikeDetailsScreen = ({ route }: { route: any }) => {
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
  const { carDetails: initialCarDetails } = route?.params || {};
  const [carDetails, setCarDetails] = useState(initialCarDetails);
  
  // Debug: Log all possible mileage fields
  useEffect(() => {
    if (carDetails) {
      console.log('🔍 BikeDetails - All mileage-related fields:', {
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
  const [userPhone, setUserPhone] = useState<string>('');
  const [userData, setUserData] = useState<any>(null);
  const [isOwnProperty, setIsOwnProperty] = useState<boolean>(false);
  const [sellerData, setSellerData] = useState<any>(null);
  const [isLoadingSeller, setIsLoadingSeller] = useState(false);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [visible, setVisible] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isLoadingFavorite, setIsLoadingFavorite] = useState(false);
  const [autofinderPhone, setAutofinderPhone] = useState<string>(AUTOFINDER_PHONE);

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
  const [viewCount, setViewCount] = useState(initialCarDetails?.views || 0);
  const [showBottomButtons, setShowBottomButtons] = useState(true);
  const scrollViewRef = useRef<ScrollView>(null);
  const [callCount, setCallCount] = useState(initialCarDetails?.calls || initialCarDetails?.callClicks || 0);

  // Parse date - jis din ad post hua (bike)
  const toDate = (v: any): Date | null => {
    if (v == null || v === '') return null;
    if (typeof v === 'number') return new Date(v);
    if (typeof v === 'string') { const d = new Date(v); return isNaN(d.getTime()) ? null : d; }
    if (v && typeof v === 'object' && v.$date) return new Date(v.$date);
    if (v && typeof v === 'object' && typeof v.getTime === 'function') return v as Date;
    try { const d = new Date((v as any).toString?.() || v); return isNaN(d.getTime()) ? null : d; } catch { return null; }
  };
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
    } catch { return 'Recently'; }
  };

  // Fetch complete ad data if only ID is provided
  const fetchAdDetails = async (adId: string) => {
    try {
      setLoading(true);
      console.log('Fetching bike details for ID:', adId);
      const response = await fetch(`${API_URL}/all_ads/${adId}`);
      
      if (response.ok) {
        const adData = await response.json();
        console.log('Found bike data:', adData);
        console.log('✅ Bike data userId:', adData.userId);
        setCarDetails(adData);
        // Check own property after updating carDetails
        setTimeout(() => {
          checkIfOwnProperty();
        }, 100);
      } else {
        console.error('Failed to fetch bike details:', response.status);
      }
    } catch (error) {
      console.error('Error fetching bike details:', error);
    } finally {
      setLoading(false);
    }
  };

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
    };
    fetchUserData();
  }, []);

  useEffect(() => {
    if (userData && carDetails?.favoritedBy) {
      const isAlreadyFavorited = carDetails.favoritedBy.includes(userData.userId);
      setIsFavorite(isAlreadyFavorited);
    }
  }, [userData, carDetails]);

  useEffect(() => {
    console.log("Route params:", route?.params);
    console.log("Car Details:", carDetails);
    
    // If only ID is provided, fetch complete data
    if (carDetails && carDetails._id && !carDetails.description) {
      console.log("Only ID provided, fetching complete data...");
      fetchAdDetails(carDetails._id);
    } else if (carDetails && carDetails.description) {
      console.log("Complete data already provided");
    }
    
    // Fetch user phone number
    fetchUserPhone();
    // Check if it's user's own property
    checkIfOwnProperty();
  }, [carDetails, route?.params]);

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
          body: JSON.stringify({ userId: 'anonymous' })
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

  // Debug image loading - moved after conditional returns
  useEffect(() => {
    if (carDetails) {
      const images = safeGetAllImagesWithApiUrl(carDetails, API_URL);
      console.log("Bike Details Images:", images);
      console.log("Number of images:", images.length);
      if (images.length > 0) {
        console.log("First image:", images[0]);
      }
    }
  }, [carDetails]);

  // Debug phone number
  useEffect(() => {
    console.log("User phone number state:", userPhone);
  }, [userPhone]);

  const checkIfOwnProperty = async () => {
    try {
      const currentUserId = await getCurrentUserId();
      
      // FIXED: Extract seller ID properly using helper function
      const adUserIdString = extractSellerId(carDetails);
      
      const isOwn = currentUserId && adUserIdString && String(currentUserId) === String(adUserIdString);
      setIsOwnProperty(isOwn);
      console.log("🔍 BikeDetailsScreen - Checking if own property:", { 
        isOwn,
        currentUserId, 
        adUserId: adUserIdString,
        bikeId: carDetails?._id,
        bikeTitle: carDetails?.title || `${carDetails?.make} ${carDetails?.model}`
      });
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

  // Fetch seller data from API (similar to BikeCard)
  useEffect(() => {
    if (carDetails?.isManaged) return; // Skip for managed properties (uses admin phone)
    
    const fetchSellerData = async () => {
      try {
        // Get seller ID from bike details
        let sellerId = carDetails?.userId || carDetails?.sellerId || carDetails?.postedBy;
        
        // If sellerId is an object, extract the _id field
        if (sellerId && typeof sellerId === 'object') {
          sellerId = sellerId._id || sellerId.id;
        }
        
        // Ensure sellerId is a string
        sellerId = sellerId ? String(sellerId) : null;
        
        if (sellerId) {
          setIsLoadingSeller(true);
          console.log("📞 BikeDetailsScreen: Fetching seller data for ID:", sellerId);
          
          const response = await fetch(`${API_URL}/users/${sellerId}/seller-info`);
          
          if (response.ok) {
            const sellerInfo = await response.json();
            console.log("✅ BikeDetailsScreen: Seller data fetched successfully:", {
              id: sellerInfo._id,
              name: sellerInfo.name,
              phone: sellerInfo.phone
            });
            
            setSellerData({
              _id: sellerInfo._id,
              name: sellerInfo.name,
              phone: sellerInfo.phone,
              email: sellerInfo.email,
              contactInfo: sellerInfo.contactInfo,
              isPlaceholder: false
            });
            
            // Set phone number for Call/WhatsApp
            const phoneNumber = sellerInfo.contactInfo?.phone || sellerInfo.phone;
            if (phoneNumber) {
              setUserPhone(phoneNumber);
              console.log("✅ BikeDetailsScreen: Phone number set:", phoneNumber);
            }
          } else {
            console.error("❌ BikeDetailsScreen: Failed to fetch seller data:", response.status);
            setSellerData({
              _id: null,
              name: "Contact Not Available",
              phone: null,
              email: null,
              isPlaceholder: true
            });
          }
        } else {
          console.log("❌ BikeDetailsScreen: No seller ID found in bike details");
          setSellerData({
            _id: null,
            name: "Contact Not Available",
            phone: null,
            email: null,
            isPlaceholder: true
          });
        }
      } catch (error) {
        console.error("❌ BikeDetailsScreen: Error fetching seller data:", error);
        setSellerData({
          _id: null,
          name: "Contact Not Available",
          phone: null,
          email: null,
          isPlaceholder: true
        });
      } finally {
        setIsLoadingSeller(false);
      }
    };

    fetchSellerData();
  }, [carDetails]);

  const fetchUserPhone = async () => {
    try {
      console.log("Fetching phone number from carDetails:", carDetails);
      
      // Get phone number from sellerData first (if fetched from API)
      if (sellerData?.phone && !sellerData?.isPlaceholder) {
        setUserPhone(sellerData.phone);
        console.log("✅ Seller phone number from sellerData:", sellerData.phone);
        return;
      }
      
      // Fallback: Get phone number from carDetails (seller's phone) - check multiple possible fields
      const sellerPhone = carDetails?.userId?.phone ||  // This is the main field from populated user data
                         carDetails?.phone || 
                         carDetails?.contactNumber || 
                         carDetails?.sellerPhone || 
                         carDetails?.mobileNumber ||
                         carDetails?.contact ||
                         carDetails?.phoneNumber ||
                         carDetails?.seller?.phone ||
                         carDetails?.seller?.contactNumber ||
                         carDetails?.user?.phone ||
                         carDetails?.user?.contactNumber;
      
      if (sellerPhone) {
        setUserPhone(sellerPhone);
        console.log("✅ Seller phone number found:", sellerPhone);
        console.log("Phone source field:", Object.keys(carDetails || {}).find(key => 
          carDetails[key] === sellerPhone
        ));
        console.log("User ID data:", carDetails?.userId);
      } else {
        console.log("❌ No phone number found in carDetails");
        console.log("Available fields:", Object.keys(carDetails || {}));
        console.log("User ID object:", carDetails?.userId);
        if (carDetails?.userId) {
          console.log("User ID fields:", Object.keys(carDetails.userId));
        }
      }
    } catch (error) {
      console.error("Error fetching phone number:", error);
    }
  };

  // Track call when button is clicked
  const trackCall = async () => {
    if (!carDetails?._id) return;
    try {
      const response = await fetch(`${API_URL}/track-ad-call/${carDetails._id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: 'anonymous' })
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

    // Track call count
    trackCall();
    
    // For managed properties, use AutoFinder's phone number (dynamic)
    if (carDetails?.isManaged && autofinderPhone) {
      const formattedNumber = '+' + autofinderPhone;
      console.log("📞 BikeDetailsScreen: Using admin phone for managed property:", formattedNumber);
      Linking.openURL(`tel:${formattedNumber}`);
      return;
    }
    
    // Check if seller data is available
    if (sellerData?.isPlaceholder && !carDetails?.isManaged) {
      console.log("⚠️ BikeDetailsScreen: Contact not available - seller data is placeholder");
      Alert.alert("Contact Information", "Contact information is not available for this ad.");
      return;
    }
    
    // Use seller data phone (from API) or fallback to userPhone
    const phoneNumber = sellerData?.contactInfo?.phone || sellerData?.phone || userPhone;
    const callUrl = sellerData?.contactInfo?.callUrl;
    
    console.log("📞 BikeDetailsScreen: Call button pressed - Seller data:", {
      hasSellerData: !!sellerData,
      sellerId: sellerData?._id,
      sellerName: sellerData?.name,
      phoneNumber: phoneNumber,
      callUrl: callUrl,
      contactInfo: sellerData?.contactInfo
    });
    
    if (callUrl) {
      // Use backend formatted call URL
      console.log("📞 BikeDetailsScreen: Using backend call URL:", callUrl);
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
      
      console.log("📞 BikeDetailsScreen: Original phone number:", phoneNumber);
      console.log("📞 BikeDetailsScreen: Cleaned phone number:", cleanNumber);
      console.log("📞 BikeDetailsScreen: Final formatted number:", formattedNumber);
      console.log("📞 BikeDetailsScreen: Calling seller with formatted number:", formattedNumber);
      
      Linking.openURL(fallbackCallUrl);
    } else {
      console.log("❌ BikeDetailsScreen: No phone number available for seller");
      Alert.alert("Contact Information", "Seller's phone number is not available");
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

    // For managed properties, use AutoFinder's phone number (dynamic)
    if (carDetails?.isManaged && autofinderPhone) {
      const { generatePropertyMessage, createWhatsAppUrl } = require('../../utils/propertyMessageGenerator');
      const propertyMessage = generatePropertyMessage(carDetails);
      const whatsappUrl = createWhatsAppUrl(autofinderPhone, propertyMessage);
      console.log("💬 BikeDetailsScreen: Using admin phone for managed property:", whatsappUrl);
      Linking.openURL(whatsappUrl);
      return;
    }
    
    // Check if seller data is available
    if (sellerData?.isPlaceholder && !carDetails?.isManaged) {
      console.log("⚠️ BikeDetailsScreen: Contact not available - seller data is placeholder");
      Alert.alert("Contact Information", "Contact information is not available for this ad.");
      return;
    }
    
    // Use seller data phone (from API) or fallback to userPhone
    const phoneNumber = sellerData?.contactInfo?.phone || sellerData?.phone || userPhone;
    const whatsappUrlFromBackend = sellerData?.contactInfo?.whatsappUrl;
    
    console.log("💬 BikeDetailsScreen: WhatsApp button pressed - Seller data:", {
      hasSellerData: !!sellerData,
      sellerId: sellerData?._id,
      sellerName: sellerData?.name,
      phoneNumber: phoneNumber,
      whatsappUrl: whatsappUrlFromBackend,
      contactInfo: sellerData?.contactInfo
    });
    
    if (whatsappUrlFromBackend) {
      // Use backend formatted WhatsApp URL with property message
      const { generatePropertyMessage } = require('../../utils/propertyMessageGenerator');
      const propertyMessage = generatePropertyMessage(carDetails);
      const whatsappUrlWithMessage = whatsappUrlFromBackend + `?text=${encodeURIComponent(propertyMessage)}`;
      console.log("💬 BikeDetailsScreen: Using backend WhatsApp URL with property message:", whatsappUrlWithMessage);
      Linking.openURL(whatsappUrlWithMessage);
    } else if (phoneNumber) {
      // Generate property message using utility function
      const { generatePropertyMessage, createWhatsAppUrl } = require('../../utils/propertyMessageGenerator');
      const propertyMessage = generatePropertyMessage(carDetails);
      
      // Create WhatsApp URL with message using utility function
      const whatsappUrl = createWhatsAppUrl(phoneNumber, propertyMessage);
      
      console.log("💬 BikeDetailsScreen: Original phone number:", phoneNumber);
      console.log("💬 BikeDetailsScreen: Property message:", propertyMessage);
      console.log("💬 BikeDetailsScreen: WhatsApp URL:", whatsappUrl);
      console.log("💬 BikeDetailsScreen: Opening WhatsApp for seller with property message");
      
      Linking.openURL(whatsappUrl);
    } else {
      console.log("❌ BikeDetailsScreen: No phone number available for seller");
      Alert.alert("Contact Information", "Seller's phone number is not available for WhatsApp");
    }
  };

  const handleChat = async () => {
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

    try {
      if (!carDetails) {
        alert("Property details not available");
        return;
      }

      // Get current user ID
      const currentUserId = await getCurrentUserId();
      const sellerId = carDetails.userId || carDetails.sellerId || carDetails.postedBy;
      
      // Extract the actual ID from sellerId (it might be an object or string)
      const actualSellerId = typeof sellerId === 'object' ? sellerId._id : sellerId;
      
      // Check if user is trying to chat with themselves
      if (currentUserId && actualSellerId && currentUserId === actualSellerId) {
        alert("You cannot chat with yourself about your own property!");
        return;
      }

      console.log("Opening chat for property:", carDetails);
      console.log("Current user ID:", currentUserId);
      console.log("Seller ID (raw):", sellerId);
      console.log("Seller ID (extracted):", actualSellerId);
      
      // Prepare property details for chat
      const propertyDetails = {
        adId: carDetails._id || carDetails.id,
        sellerId: actualSellerId, // Use the extracted ID
        propertyType: 'bike',
        title: carDetails.title || `${carDetails.make || ''} ${carDetails.model || ''}`.trim(),
        price: carDetails.price,
        location: carDetails.location,
        year: carDetails.year,
        make: carDetails.make,
        model: carDetails.model,
        kmDriven: carDetails.kmDriven,
        engineCapacity: carDetails.engineCapacity,
        fuelType: carDetails.fuelType,
        transmission: carDetails.transmission,
        bodyColor: carDetails.bodyColor,
        images: uniqueImages.slice(0, 3), // First 3 images for chat preview
        phone: userPhone,
        description: carDetails.description
      };

      console.log("Property details for chat:", propertyDetails);

      // Navigate to chat with property details
      navigation.navigate('HomeTabs', { 
        screen: 'Chat', 
        params: { 
          openForAd: true, 
          propertyDetails: propertyDetails,
          adId: propertyDetails.adId,
          sellerId: propertyDetails.sellerId,
          propertyType: 'bike'
        } 
      });

    } catch (error) {
      console.error("Error opening chat:", error);
      alert("Error opening chat. Please try again.");
    }
  };
  
  const formatDate = (date: any) => {
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    return new Date(date).toLocaleDateString(undefined, options);
  };
  
  
  // Add comprehensive null check
  if (loading) {
    return (
      <View style={styles.mainContainer}>
        <View style={styles.container}>
          <Text style={styles.errorText}>Loading bike details...</Text>
        </View>
      </View>
    );
  }

  if (!carDetails) {
    return (
      <View style={styles.mainContainer}>
        <View style={styles.container}>
          <Text style={styles.errorText}>Bike details not available</Text>
        </View>
      </View>
    );
  }

  // CRITICAL: Use images array if available, otherwise use safeGetAllImagesWithApiUrl
  let images: string[] = [];
  
  if (carDetails.images && Array.isArray(carDetails.images) && carDetails.images.length > 0) {
    // Use images array directly - filter out empty/null/undefined images
    images = carDetails.images.filter(img => img && typeof img === 'string' && img.trim() !== '');
  }
  
  // If images array is empty, use safeGetAllImagesWithApiUrl
  if (images.length === 0) {
    images = safeGetAllImagesWithApiUrl(carDetails, API_URL);
  }
  
  // Final filter to ensure all images are valid URLs
  images = images.filter(img => img && typeof img === 'string' && img.trim() !== '');
  
  // Remove duplicate images to prevent duplicate key errors
  const uniqueImages = images.filter((img, index, self) => self.indexOf(img) === index);
  
  // Preload images when component mounts - first image gets priority
  useEffect(() => {
    if (uniqueImages.length > 0) {
      // First image is already prefetched before navigation
      // Preload remaining images in background
      if (uniqueImages.length > 1) {
        preloadDetailImages(uniqueImages.slice(1));
      }
    }
  }, [uniqueImages]);
  
  const toggleFavorite = async () => {
    if (!userData?.userId) {
      Alert.alert(
        "Login Required",
        "You are not logged in. Please login to add to favorites.",
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

  const shareBike = async () => {
    try {
      const shareUrl = `https://autofinder.pk/bike/${carDetails._id}`;
      const shareMessage = `Check out this bike: ${carDetails?.year || ''} ${carDetails?.make || 'Bike'} ${carDetails?.model || ''} for Rs. ${carDetails?.price || '0'} in ${carDetails?.city || carDetails?.location || 'N/A'} on autofinder.pk!\n\nView details: ${shareUrl}`;
      
      await Share.share({
        message: shareMessage,
        url: shareUrl, // For platforms that support URL
      });
    } catch (error) {
      console.log("Error sharing:", error);
    }
  };

  const toggleExpand = () => setExpanded(!expanded);
  return (
    <>
    <View style={styles.mainContainer}>
    <ScrollView 
      ref={scrollViewRef}
      style={styles.container}
      contentContainerStyle={{
        paddingBottom: Platform.OS === 'ios' 
          ? Math.max(insets.bottom, 20) + 65 + 80  // Tab bar + safe area + button height
          : Math.max(insets.bottom, 10) + 60 + 80  // Tab bar + safe area + button height
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
      {uniqueImages.length > 0 ? uniqueImages.map((img, index) => {
        // Create a unique key by combining index with a hash of the image URL
        const urlHash = img ? img.split('/').pop()?.split('.')[0] || 'unknown' : 'empty';
        return (
        <TouchableOpacity
          key={`bike-image-${index}-${urlHash}`}
          style={{ position: 'relative', backgroundColor: '#f0f0f0' }}
          onPress={() => {
            // Set selected image index and make the modal visible (if necessary)
            setSelectedIndex(index);
            setVisible(true);
          }}
        >
          <OptimizedImage 
            source={{ uri: img }} 
            style={[styles.image, { backgroundColor: '#e8e8e8' }]}
            resizeMode="cover"
            defaultSource={require('../../../assets/Other/nodatafound.png')}
            onError={() => {
              console.log("Image loading error - Failed image:", img);
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
        );
      }) : (
        <View style={styles.noImageContainer}>
          <Image 
            source={{ uri: "https://mamatafertility.com/wp-content/themes/consultix/images/no-image-found-360x250.png" }} 
            style={styles.image} 
          />
        </View>
      )}
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
            <FontAwesome name="arrow-left" size={20} color="black" />
          </TouchableOpacity>
        )}
        <View style={{ flex: 1 }} />
        <TouchableOpacity style={styles.icon} onPress={toggleFavorite} disabled={isLoadingFavorite}>
          {isLoadingFavorite ? (
            <ActivityIndicator size="small" color="red" />
          ) : (
            <Entypo name={isFavorite ? "heart" : "heart-outlined"} size={24} color={isFavorite ? "red" : "black"} />
          )}
        </TouchableOpacity>
        <TouchableOpacity style={styles.icon} onPress={shareBike}>
          <Feather name="share-2" size={24} color="black" />
        </TouchableOpacity>
      </View>
    </View>

      {/* Badges Row - Wrap on small screens - Show before price */}
      <View style={styles.badgesRowContainer}>
        {/* Featured Badge - Only show for premium ads, not free ads */}
        {(() => {
          // STRICT CHECK: Only show premium tag if isFeatured is EXACTLY "Approved"
          // Free bikes have isFeatured as undefined, null, "Pending", "Rejected", or don't have this field
          const isFeaturedValue = carDetails?.isFeatured;
          const isPremium = isFeaturedValue === "Approved" || isFeaturedValue === true;
          
          // Additional check: If it's a free ad (525 PKR), don't show premium tag
          const isFreeAd = (carDetails?.category || '') === 'free' || 
                          (carDetails?.adType || '') === 'free' || 
                          (carDetails?.modelType === 'Free') ||
                          (carDetails?.packagePrice === 525) ||
                          (carDetails?.paymentAmount === 525);
          
          // Only show premium tag if:
          // 1. isFeatured is EXACTLY "Approved" or true
          // 2. AND it's NOT a free ad (525 PKR)
          // 3. AND isFeatured is NOT undefined, null, "Pending", or "Rejected"
          const shouldShowPremium = carDetails && isPremium && !isFreeAd && 
                                    (isFeaturedValue !== undefined && 
                                     isFeaturedValue !== null && 
                                     isFeaturedValue !== "Pending" && 
                                     isFeaturedValue !== "Rejected");
          
          return shouldShowPremium;
        })() && (
          <View style={styles.featuredBadge}>
            <Text style={styles.featuredText}>Premium</Text>
          </View>
        )}
        {carDetails && carDetails.isManaged && (
          <View style={styles.managedBadge}>
            <Text style={styles.managedText} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>
              Managed By AutoFinder
            </Text>
          </View>
        )}
      </View>

      {/* Price */}
      {/* Price and Time */}
<View style={styles.priceContainer}>
  <View style={styles.priceTimeRow}>
    <Text style={styles.price}>
      PKR {carDetails && carDetails.price ? Number(carDetails.price).toLocaleString('en-US') : '0'}
    </Text>
    {/* Time Ago - dateAdded pehle (jis din ad post hua) */}
    <Text style={styles.timeAgo}>{getTimeAgo(carDetails?.dateAdded ?? carDetails?.approvedAt ?? carDetails?.date_added ?? carDetails?.createdAt ?? null)}</Text>
  </View>
</View>

      {/* Premium Ad Expiry Info */}
      {carDetails?.isFeatured === "Approved" && carDetails?.featuredExpiryDate && (
        <View style={styles.expiryContainer}>
          <FontAwesome5 name="clock" size={14} color={new Date(carDetails.featuredExpiryDate) < new Date() ? "#e74c3c" : "#27ae60"} />
          <Text style={[
            styles.expiryText, 
            { color: new Date(carDetails.featuredExpiryDate) < new Date() ? "#e74c3c" : "#27ae60" }
          ]}>
            {new Date(carDetails.featuredExpiryDate) < new Date() 
              ? "Premium Expired" 
              : `Premium expires: ${new Date(carDetails.featuredExpiryDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
            }
          </Text>
        </View>
      )}

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

      {/* Specifications with Icons */}
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
          {carDetails && carDetails.enginetype === "Electric" ? (
            <FontAwesome5 name="bolt" size={18} color="#CD0100" />
          ) : (
            <FontAwesome5 name="gas-pump" size={18} color="#CD0100" />
          )}
          <Text style={styles.detailText}>{carDetails?.enginetype || carDetails?.fuelType || 'N/A'}</Text>
        </View>
      </View>

      {/* Location */}
      <View style={styles.locationContainer}>
        <FontAwesome5 name="map-marker-alt" size={18} color="#CD0100" />
        <Text style={styles.locationText} numberOfLines={1}>
          {carDetails?.city || carDetails?.location || carDetails?.registrationCity || 'Location not specified'}
        </Text>
      </View>

      {/* Divider */}
      <View style={styles.divider} />

      {/* List It For You Section */}
      <View style={styles.sellItForMeCard}>
        <View style={styles.sellItForMeContent}>
          <View style={styles.sellItForMeText}>
            <Text style={[styles.sellItForMeTitle, { color: '#CD0100' }]}>List It For You</Text>
            <Text style={styles.sellItForMeDescription}>
              Have a bike to sell, but no time to bargain best offers?
            </Text>
            <TouchableOpacity style={styles.sellItForMeLink} onPress={() => navigation.navigate('ListItForYouScreen' as any)}>
              <Text style={[styles.sellItForMeLinkText, { color: '#CD0100' }]}>I want experts to sell my bike ✨</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.sellItForMeIllustration}>
            <FontAwesome name="motorcycle" size={40} color="#CD0100" />
          </View>
        </View>
      </View>

      {/* Premium Ads Service Section */}
      <View style={styles.sellItForMeCard}>
        <View style={styles.sellItForMeContent}>
          <View style={styles.sellItForMeText}>
            <Text style={[styles.sellItForMeTitle, { color: '#CD0100' }]}>Premium Ads Service</Text>
            <Text style={styles.sellItForMeDescription}>
              Boost your bike listing with premium features and get more visibility!
            </Text>
            <TouchableOpacity style={styles.sellItForMeLink} onPress={() => navigation.navigate('PostBikeAdFeatured')}>
              <Text style={[styles.sellItForMeLinkText, { color: '#CD0100' }]}>Create Premium Bike Ad ✨</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.sellItForMeIllustration}>
            <FontAwesome name="star" size={40} color="#CD0100" />
          </View>
        </View>
      </View>

      {/* Bike Overview */}
      <Text style={styles.sectionTitle}>Bike Overview</Text>
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
          <Text style={styles.label}>Engine Type</Text>
          <Text style={styles.value}>{carDetails?.enginetype || 'Not specified'}</Text>
        </View>
        <View style={styles.overviewRow}>
          <Text style={styles.label}>Body Color</Text>
          <Text style={styles.value}>{carDetails?.bodyColor || 'Not specified'}</Text>
        </View>
        <View style={styles.overviewRow}>
          <Text style={styles.label}>Engine Capacity</Text>
          <Text style={styles.value}>{carDetails?.engineCapacity || 'Not specified'} cc</Text>
        </View>
        <TouchableOpacity onPress={() => {
          console.log("Opening modal with carDetails:", carDetails);
          setModalVisible(true);
        }}>
        <Text style={styles.showMore}>Show More</Text>
      </TouchableOpacity>
      </View>
      {/* <View style={styles.divider} />
      <View>
      <Text style={styles.sectionTitle}>Features</Text>
      <View style={styles.featuresWrapper}>
        {(carDetails && carDetails.features ? [...new Set(carDetails.features)] : []).map((feature, index) => (
          <View key={`bike-feature-${index}-${feature?.toString().slice(0, 10) || 'unknown'}`} style={styles.featureItem}>
            <View style={styles.iconCircle}>
              <FontAwesome name="check" size={8} color="#fff" />
            </View>
            <Text>{feature}</Text>
          </View>
        ))}
      </View>
    </View> */}
      <View style={styles.divider} />
      <Text style={styles.sectionTitle}>Description</Text>
      <View style={styles.overview1}>
      <Text style={styles.description}>
  {expanded
    ? (carDetails ? carDetails.description : '')
    : (carDetails && carDetails.description ? carDetails.description.split(" ").slice(0, 40).join(" ") + "..." : "")
  }
</Text>

        <TouchableOpacity onPress={toggleExpand}>
            <Text style={styles.showMore}>{expanded ? "Show Less" : "Show More"}</Text>
        </TouchableOpacity>
        <Text style={styles.postedDate}>Posted On: {carDetails ? formatDate(carDetails.dateAdded) : ''}</Text>
      </View>
      <View style={styles.divider} />
      <Text style={styles.sectionTitle}>Map View</Text>
      <View style={styles.overview2}>
  <Text style={styles.carModel1}>{carDetails ? carDetails.location : ''}</Text>

</View>
<View style={styles.divider} />

<View style={styles.reportContainer}>
  <FontAwesome name="flag" size={24} color="black" /> 
  <Text style={styles.carModel2}>Report an Ad</Text>
</View>

      {/* Similar Bikes Section - Hide for Managed by Autofinder properties */}
      {carDetails && !carDetails.isManaged && (
        <SimilarCars
          currentCarId={carDetails._id}
          make={carDetails.make || carDetails.company}
          model={carDetails.model}
          adType="bike"
        />
      )}

    </ScrollView>
    
    {/* Advanced Contact Options */}
    <View style={[
        styles.advancedBottomContainer, 
        isOwnProperty && styles.ownPropertyBottomContainer,
        { 
          bottom: Platform.OS === 'ios' 
            ? Math.max(insets.bottom, 20) + 20  // Tab bar height ~20 + safe area (minimal gap)
            : Math.max(insets.bottom, 10) + 15  // Tab bar height ~15 + safe area (minimal gap)
        }
      ]}>
      


      {/* Main Contact Buttons - Icon with Text - Only show if not own property */}
      {!isOwnProperty ? (
        <View style={styles.mainContactRow}>
          <TouchableOpacity 
            style={[
              styles.callButton,
              (sellerData?.isPlaceholder && !carDetails?.isManaged) && styles.disabledButton
            ]} 
            onPress={handleCall}
            disabled={(sellerData?.isPlaceholder && !carDetails?.isManaged) || (isLoadingSeller && !carDetails?.isManaged)}
          >
            {isLoadingSeller && !carDetails?.isManaged ? (
              <ActivityIndicator size="small" color="#FF6B6B" />
            ) : (
              <FontAwesome name="phone" size={isTablet ? 16 : 14} color={(sellerData?.isPlaceholder && !carDetails?.isManaged) ? "#ccc" : "#FF6B6B"} />
            )}
            <Text style={[
              styles.buttonText,
              (sellerData?.isPlaceholder && !carDetails?.isManaged) && styles.disabledButtonText
            ]}>
              {isLoadingSeller && !carDetails?.isManaged ? 'Loading...' : 'Call'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[
              styles.whatsappButton,
              (sellerData?.isPlaceholder && !carDetails?.isManaged) && styles.disabledButton
            ]} 
            onPress={handleWhatsApp}
            disabled={(sellerData?.isPlaceholder && !carDetails?.isManaged) || (isLoadingSeller && !carDetails?.isManaged)}
          >
            {isLoadingSeller && !carDetails?.isManaged ? (
              <ActivityIndicator size="small" color="#25D366" />
            ) : (
              <FontAwesome name="whatsapp" size={isTablet ? 16 : 14} color={(sellerData?.isPlaceholder && !carDetails?.isManaged) ? "#ccc" : "#25D366"} />
            )}
            <Text style={[
              styles.buttonText,
              (sellerData?.isPlaceholder && !carDetails?.isManaged) && styles.disabledButtonText
            ]}>
              {isLoadingSeller && !carDetails?.isManaged ? 'Loading...' : 'WhatsApp'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.chatButton} 
            onPress={handleChat}
          >
            <Feather name="message-square" size={isTablet ? 16 : 14} color="#2196F3" />
            <Text style={styles.buttonText}>Chat</Text>
          </TouchableOpacity>
        </View>
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
  
  {/* Fullscreen Image Viewer - Outside mainContainer to render on top */}
  <ImageViewing
    images={uniqueImages.map(img => ({ uri: img }))} 
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

export default BikeDetailsScreen;

const styles = createResponsiveStyleSheet({
    mainContainer: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: "#fff",
    marginBottom: isTablet ? 90 : 70, // Responsive margin for bottom buttons
    marginTop: isTablet ? 40 : 32, // Responsive top margin
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
    marginBottom: 8,
    paddingHorizontal: 15,
    flexWrap: 'wrap',
    gap: 4,
    paddingVertical: 10,
  },
  specItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
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
    lineHeight: 18,
  },
  locationContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    paddingHorizontal: 16,
    gap: 8,
    flexWrap: 'wrap',
  },
  expiryContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    paddingHorizontal: 16,
    gap: 6,
    backgroundColor: "#f8f9fa",
    paddingVertical: 8,
    borderRadius: 8,
    marginHorizontal: 16,
  },
  expiryText: {
    fontSize: 13,
    fontWeight: "500",
  },
  locationText: {
    fontSize: 14,
    color: "#666",
    flex: 1,
    flexShrink: 1,
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
  // Advanced Bottom Container Styles
  advancedBottomContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: Platform.OS === 'android' ? 10 : 5,
    paddingBottom: Platform.OS === 'ios' ? 10 : 8,
    zIndex: 1000, // Ensure buttons stay on top when scrolling
  },
  
  
  // Main Contact Buttons - Icon with Text
  mainContactRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: isTablet ? 20 : 15,
    paddingHorizontal: isTablet ? 30 : 20,
    alignItems: "center",
  },
  callButton: {
    flex: 1,
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FEE8E8",
    paddingVertical: isTablet ? 15 : 12,
    paddingHorizontal: isTablet ? 20 : 15,
    marginHorizontal: isTablet ? 16 : 12,
    borderRadius: isTablet ? 20 : 15,
    shadowColor: "#FEE8E8",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  whatsappButton: {
    flex: 1,
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E8FEE8",
    paddingVertical: isTablet ? 15 : 12,
    paddingHorizontal: isTablet ? 20 : 15,
    marginHorizontal: isTablet ? 16 : 12,
    borderRadius: isTablet ? 20 : 15,
    shadowColor: "#E8FEE8",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  chatButton: {
    flex: 1,
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E8F0FE",
    paddingVertical: isTablet ? 15 : 12,
    paddingHorizontal: isTablet ? 20 : 15,
    marginHorizontal: isTablet ? 16 : 12,
    borderRadius: isTablet ? 20 : 15,
    shadowColor: "#E8F0FE",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonText: {
    color: "#333",
    fontSize: isTablet ? 14 : 12,
    fontWeight: "bold",
    marginTop: isTablet ? 6 : 4,
    textAlign: "center",
  },
  disabledButton: {
    backgroundColor: "#ccc",
    opacity: 0.6,
  },
  disabledButtonText: {
    color: "#999",
  },
  debugContainer: {
    backgroundColor: "#f0f0f0",
    padding: 8,
    marginHorizontal: 15,
    marginBottom: 10,
    borderRadius: 5,
    alignItems: "center",
  },
  debugText: {
    fontSize: 12,
    color: "#666",
    fontWeight: "500",
  },
  noPhoneContainer: {
    backgroundColor: "#ffebee",
    padding: 8,
    marginHorizontal: 15,
    marginBottom: 10,
    borderRadius: 5,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#f44336",
  },
  noPhoneText: {
    fontSize: 12,
    color: "#d32f2f",
    fontWeight: "500",
  },
  propertyDebugContainer: {
    backgroundColor: "#e3f2fd",
    padding: 8,
    marginHorizontal: 15,
    marginBottom: 10,
    borderRadius: 5,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#2196f3",
  },
  propertyDebugText: {
    fontSize: 12,
    color: "#1976d2",
    fontWeight: "500",
  },
  // Own property bottom container style
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
  errorText: {
    fontSize: 18,
    color: '#CD0100',
    textAlign: 'center',
    marginTop: 50,
    fontWeight: 'bold'
  },
  noImageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
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
