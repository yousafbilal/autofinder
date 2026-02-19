import React, { useState, useEffect } from 'react';
import { View, Text, Image, StyleSheet,Linking , TouchableOpacity, ScrollView, ActivityIndicator, BackHandler, Platform, Share, Alert } from "react-native";
import Swiper from "react-native-swiper";
import { Entypo, FontAwesome5, Feather, FontAwesome } from "@expo/vector-icons";
import CarDetailsModal from "../../Components/Models/CarDetailsModal";
import ImageViewing from "react-native-image-viewing";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL, AUTOFINDER_PHONE, getAutofinderPhone } from '../../../config';
import { getCurrentUserId } from '../../services/chat';
import { generatePropertyMessage, createWhatsAppUrl } from '../../utils/propertyMessageGenerator';
import { useNavigation } from '@react-navigation/native';
import SimilarCars from '../../Components/SimilarCars';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const DetailsScreen = ({ route }: { route: any }) => {
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
  const { carDetails } = route.params;

  // Time ago function - handles both string and number dates
  const getTimeAgo = (dateValue: any) => {
    try {
      // Convert to valid date
      let date: Date;
      if (dateValue == null || dateValue === '') {
        return '—';
      }
      
      if (typeof dateValue === 'string') {
        date = new Date(dateValue);
      } else if (typeof dateValue === 'number') {
        date = new Date(dateValue);
      } else {
        date = new Date(dateValue);
      }
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        return 'Just now';
      }
      
      const now = new Date();
      const diff = now.getTime() - date.getTime();
      
      // If diff is negative, return "Just now"
      if (diff < 0) {
        return 'Just now';
      }
      
      const seconds = Math.floor(diff / 1000);
      const minutes = Math.floor(diff / (1000 * 60));
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));

      if (seconds < 60) {
        return 'Just now';
      } else if (minutes < 60) {
        return `${minutes}m ago`;
      } else if (hours < 24) {
        return `${hours}h ago`;
      } else {
        return `${days}d ago`;
      }
    } catch (error) {
      console.error('Error calculating time ago:', error);
      return 'Just now';
    }
  };

  useEffect(() => {
    // Log carDetails when the component mounts
    console.log("Car Details:", carDetails);
  }, [carDetails]);

  useEffect(() => {
    console.log("Car Details:", carDetails);
    if (!currentCarDetails.description) {
      console.warn("currentCarDetails.description is missing!");
    }
    
    // If only ID is provided, fetch complete data
    if (carDetails && currentCarDetails._id && !currentCarDetails.description) {
      console.log("Only ID provided, fetching complete data...");
      fetchAdDetails(currentCarDetails._id);
    } else if (carDetails && currentCarDetails.description) {
      console.log("Complete data already provided");
    }

    // Check if this is a premium car and fetch seller data if needed
    if (carDetails && (carDetails.category === 'premium' || carDetails.adType === 'featured')) {
      console.log("🔍 Premium car detected, checking seller data...");
      const sellerId = carDetails.sellerId || carDetails.postedBy || carDetails.userId;
      
      if (sellerId && typeof sellerId === 'string') {
        console.log("🔍 Seller ID found:", sellerId);
        // Check if we already have seller data
        if (!currentCarDetails.userId || typeof currentCarDetails.userId === 'string') {
          console.log("🔍 Fetching seller data for premium car...");
          fetchSellerDataForPremium(sellerId);
        } else {
          console.log("🔍 Seller data already available");
        }
      } else {
        console.log("❌ No seller ID found for premium car");
      }
    }
  }, [carDetails]);
  const [carDetailsState, setCarDetailsState] = useState(carDetails);
  const [modalVisible, setModalVisible] = useState(false);
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<any>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isLoadingFavorite, setIsLoadingFavorite] = useState(false);
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
  const [userPhone, setUserPhone] = useState<string>('');
  const [isOwnProperty, setIsOwnProperty] = useState(false);
  const [currentCarDetails, setCurrentCarDetails] = useState(carDetails);
  const [sellerData, setSellerData] = useState<any>(null);
  const [loadingSellerData, setLoadingSellerData] = useState(false);
  const [autofinderPhone, setAutofinderPhone] = useState<string>(AUTOFINDER_PHONE);

  // Fetch dynamic admin phone number for managed properties
  // Pass adId to get the phone number of the admin who added this specific property
  useEffect(() => {
    if (currentCarDetails?.isManaged) {
      const adId = currentCarDetails?._id || currentCarDetails?.id;
      console.log("📞 Fetching admin phone for managed property:", adId);
      getAutofinderPhone(adId).then(phone => {
        setAutofinderPhone(phone);
        console.log("📞 Fetched AutoFinder phone for ad", adId, ":", phone);
      });
    }
  }, [currentCarDetails?.isManaged, currentCarDetails?._id]);

  const formatDate = (date: any) => {
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    return new Date(date).toLocaleDateString(undefined, options);
  };
  
  
  const images = currentCarDetails.images || [];

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

  // Separate useEffect for phone and own property check when currentCarDetails changes
  useEffect(() => {
    fetchUserPhone();
    checkIfOwnProperty();
  }, [currentCarDetails]);

  const fetchUserPhone = async () => {
    try {
      console.log("=== PHONE DEBUG START ===");
      console.log("currentCarDetails:", JSON.stringify(currentCarDetails, null, 2));
      console.log("currentCarDetails.userId:", currentCarDetails?.userId);
      console.log("currentCarDetails.userId?.phone:", currentCarDetails?.userId?.phone);
      console.log("All currentCarDetails keys:", Object.keys(currentCarDetails || {}));
      console.log("Looking for any user-related fields...");
      
      // Check for any user-related fields
      const userFields = ['userId', 'user', 'seller', 'sellerId', 'postedBy', 'createdBy', 'owner'];
      userFields.forEach(field => {
        if (currentCarDetails?.[field]) {
          console.log(`Found ${field}:`, currentCarDetails[field]);
        }
      });
      
      // Get phone number from currentCarDetails (seller's phone) - check multiple possible fields
      const sellerPhone = currentCarDetails?.userId?.phone ||  // This is the main field from populated user data
                         currentCarDetails?.phone || 
                         currentCarDetails?.contactNumber || 
                         currentCarDetails?.sellerPhone || 
                         currentCarDetails?.mobileNumber ||
                         currentCarDetails?.contact ||
                         currentCarDetails?.phoneNumber ||
                         currentCarDetails?.seller?.phone ||
                         currentCarDetails?.seller?.contactNumber ||
                         currentCarDetails?.user?.phone ||
                         currentCarDetails?.user?.contactNumber;

      console.log("Seller phone found:", sellerPhone);
      console.log("Phone type:", typeof sellerPhone);
      
      if (sellerPhone) {
        // Clean the phone number - remove all non-numeric characters
        const cleanPhone = sellerPhone.replace(/[^\d]/g, '');
        setUserPhone(cleanPhone);
        console.log("Clean phone number set:", cleanPhone);
        console.log("✅ Phone number successfully set!");
      } else {
        console.log("❌ No phone number found in currentCarDetails");
        console.log("Available fields:", Object.keys(currentCarDetails || {}));
        console.log("userId fields:", currentCarDetails?.userId ? Object.keys(currentCarDetails.userId) : "No userId");
        
        // Try to fetch phone number from user's profile if userId is available
        if (currentCarDetails?.userId) {
          console.log("Found userId in ad data:", currentCarDetails.userId);
          console.log("Trying to fetch phone from user profile...");
          fetchPhoneFromUserProfile(currentCarDetails.userId);
        } else {
          // If no userId in ad data, try to use current user's phone
          console.log("No userId in ad data, trying to fetch current user's phone...");
          const phoneFound = await fetchCurrentUserPhone();
          if (!phoneFound) {
            // Try direct API call with known user ID
            console.log("Trying direct API call with known user ID...");
            await fetchPhoneFromUserProfile("68ce98ccb0ac0452d176b53b");
          }
        }
      }
      console.log("=== PHONE DEBUG END ===");
    } catch (error) {
      console.error("Error fetching user phone:", error);
    }
  };

  const fetchPhoneFromUserProfile = async (userId: string) => {
    try {
      console.log("Fetching phone from user profile for userId:", userId);
      const response = await fetch(`${API_URL}/users/${userId}/seller-info`);
      const userData = await response.json();
      
      if (response.ok && userData.phone) {
        console.log("Phone found in user profile:", userData.phone);
        const cleanPhone = userData.phone.replace(/[^\d]/g, '');
        setUserPhone(cleanPhone);
        console.log("✅ Phone number set from user profile:", cleanPhone);
      } else {
        console.log("❌ No phone found in user profile");
        console.log("User data received:", userData);
        
        // If user exists but no phone, use a default number
        if (response.ok && userData.name) {
          console.log("User exists but no phone, using default number");
          setUserPhone("923001234567");
        }
      }
    } catch (error) {
      console.error("Error fetching phone from user profile:", error);
    }
  };

  const fetchCurrentUserPhone = async () => {
    try {
      console.log("Fetching current user's phone from profile...");
      console.log("Current userData:", userData);
      console.log("Current userData.userId:", userData?.userId);
      
      if (userData?.userId) {
        console.log("Making API call to fetch user profile...");
        const response = await fetch(`${API_URL}/users/${userData.userId}/seller-info`);
        console.log("API response status:", response.status);
        
        const currentUserData = await response.json();
        console.log("Current user data received:", currentUserData);
        
        if (response.ok && currentUserData.phone) {
          console.log("Current user phone found:", currentUserData.phone);
          const cleanPhone = currentUserData.phone.replace(/[^\d]/g, '');
          setUserPhone(cleanPhone);
          console.log("✅ Phone number set from current user profile:", cleanPhone);
          return true;
        } else {
          console.log("❌ No phone found in current user profile");
          console.log("Response ok:", response.ok);
          console.log("Phone in response:", currentUserData.phone);
          console.log("Full user data:", currentUserData);
          
          // If user exists but no phone, use a default number
          if (response.ok && currentUserData.name) {
            console.log("User exists but no phone, using default number");
            setUserPhone("923001234567");
            return true;
          }
        }
      } else {
        console.log("❌ No userId in userData");
      }
      return false;
    } catch (error) {
      console.error("Error fetching current user phone:", error);
      return false;
    }
  };

  const checkIfOwnProperty = async () => {
    try {
      const currentUserId = await getCurrentUserId();
      const sellerId = currentCarDetails?.userId || currentCarDetails?.sellerId || currentCarDetails?.postedBy;
      
      if (currentUserId && sellerId) {
        // Extract the actual ID from sellerId (it might be an object or string)
        const actualSellerId = typeof sellerId === 'object' ? sellerId._id : sellerId;
        const isOwn = currentUserId === actualSellerId;
        setIsOwnProperty(isOwn);
        console.log("Is own property:", isOwn);
        console.log("Current user ID:", currentUserId);
        console.log("Seller ID (raw):", sellerId);
        console.log("Seller ID (extracted):", actualSellerId);
      }
    } catch (error) {
      console.error("Error checking if own property:", error);
    }
  };

  const fetchAdDetails = async (adId: string) => {
    try {
      console.log("=== FETCHING AD DETAILS ===");
      console.log("Fetching complete ad details for ID:", adId);
      const response = await fetch(`${API_URL}/all_ads/${adId}`);
      const data = await response.json();
      
      if (response.ok) {
        console.log("✅ Complete ad data fetched successfully");
        console.log("Data structure:", JSON.stringify(data, null, 2));
        console.log("userId in data:", data?.userId);
        console.log("userId.phone in data:", data?.userId?.phone);
        setCarDetailsState(data);
        // Update the current car details state
        setCurrentCarDetails(data);
        
        // After updating currentCarDetails, fetch phone and check own property
        setTimeout(() => {
          fetchUserPhone();
          checkIfOwnProperty();
        }, 100);
      } else {
        console.error("❌ Error fetching ad details:", data.message);
      }
    } catch (error) {
      console.error("❌ Error fetching ad details:", error);
    }
  };

  // New function to fetch seller data specifically for premium cars
  const fetchSellerDataForPremium = async (sellerId: string) => {
    try {
      setLoadingSellerData(true);
      console.log("=== FETCHING SELLER DATA FOR PREMIUM CAR ===");
      console.log("Fetching seller data for ID:", sellerId);
      const response = await fetch(`${API_URL}/users/${sellerId}/seller-info`);
      const sellerDataResponse = await response.json();
      
      if (response.ok) {
        console.log("✅ Seller data fetched successfully:", sellerDataResponse);
        
        // Set seller data state
        setSellerData({
          _id: sellerDataResponse._id,
          name: sellerDataResponse.name,
          phone: sellerDataResponse.phone,
          email: sellerDataResponse.email,
          profileImage: sellerDataResponse.profileImage
        });
        
        // Update currentCarDetails with seller information
        setCurrentCarDetails((prev: any) => ({
          ...prev,
          userId: {
            _id: sellerDataResponse._id,
            name: sellerDataResponse.name,
            phone: sellerDataResponse.phone,
            email: sellerDataResponse.email,
            profileImage: sellerDataResponse.profileImage
          }
        }));
        
        // Set phone number directly
        if (sellerDataResponse.phone) {
          const cleanPhone = sellerDataResponse.phone.replace(/[^\d]/g, '');
          setUserPhone(cleanPhone);
          console.log("✅ Phone number set from seller data:", cleanPhone);
        }
        
        // Check if own property
        checkIfOwnProperty();
        
      } else {
        console.error("❌ Error fetching seller data:", sellerDataResponse.message);
        setSellerData(null);
      }
    } catch (error) {
      console.error("❌ Error fetching seller data:", error);
      setSellerData(null);
    } finally {
      setLoadingSellerData(false);
    }
  };
  

  const [expanded, setExpanded] = useState(false);
  const toggleExpand = () => setExpanded(!expanded);
useEffect(() => {
  if (userData && carDetailsState?.favoritedBy) {
    const isAlreadyFavorited = carDetailsState.favoritedBy.includes(userData.userId);
    setIsFavorite(isAlreadyFavorited);
  }
}, [userData, carDetailsState]);

    
    const toggleFavorite = async () => {
      if (!userData?.userId) {
        console.warn("User ID not found. Cannot toggle favorite.");
        return;
      }
      setIsLoadingFavorite(true);
      try {
        console.log("Toggling favorite for:", currentCarDetails._id, "User ID:", userData.userId);
    
        const response = await fetch(`${API_URL}/toggle_favorite`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ adId: currentCarDetails._id, userId: userData.userId }),
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
          const updatedFavoritedBy = isFavorite
    ? carDetailsState.favoritedBy.filter((id: any) => id !== userData.userId)
    : [...carDetailsState.favoritedBy, userData.userId];

  setCarDetailsState({
    ...carDetailsState,
    favoritedBy: updatedFavoritedBy,
  });
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

  const shareCar = async () => {
    try {
      const shareUrl = `https://autofinder.pk/car/${currentCarDetails._id}`;
      const shareMessage = `Check out this car: ${currentCarDetails.make} ${currentCarDetails.model} ${currentCarDetails.variant || ''} ${currentCarDetails.year} for Rs. ${currentCarDetails.price} in ${currentCarDetails.city || currentCarDetails.location || 'N/A'} on autofinder.pk!\n\nView details: ${shareUrl}`;
      
      await Share.share({
        message: shareMessage,
        url: shareUrl, // For platforms that support URL
      });
    } catch (error) {
      console.log("Error sharing:", error);
    }
  };

  const handleCall = () => {
    // For managed properties, use AutoFinder's phone number (dynamic)
    const phoneToUse = currentCarDetails?.isManaged ? autofinderPhone : userPhone;
    
    if (phoneToUse) {
      // Remove leading 0 and add +92 prefix
      let cleanPhone = phoneToUse.replace(/^0+/, ''); // Remove leading zeros
      if (!cleanPhone.startsWith('92')) {
        cleanPhone = `92${cleanPhone}`; // Add 92 if not present
      }
      const phoneNumber = `+${cleanPhone}`; // Add + prefix
      console.log("📞 Calling number:", phoneNumber);
      console.log("📞 Is managed property:", currentCarDetails?.isManaged);
      Linking.openURL(`tel:${phoneNumber}`);
    } else {
      console.log("No phone number available for calling");
    }
  };

  const handleWhatsApp = () => {
    // For managed properties, use AutoFinder's phone number (dynamic)
    const phoneToUse = currentCarDetails?.isManaged ? autofinderPhone : userPhone;
    
    if (phoneToUse) {
      // Generate property message using utility function
      const propertyMessage = generatePropertyMessage(currentCarDetails);
      
      // Create WhatsApp URL with message using utility function
      const whatsappUrl = createWhatsAppUrl(phoneToUse, propertyMessage);
      
      console.log("💬 WhatsApp number:", phoneToUse);
      console.log("💬 Is managed property:", currentCarDetails?.isManaged);
      console.log("💬 Property message:", propertyMessage);
      console.log("💬 WhatsApp URL:", whatsappUrl);
      
      Linking.openURL(whatsappUrl);
    } else {
      console.log("No phone number available for WhatsApp");
    }
  };
  return (
    <View style={styles.mainContainer}>
    <ScrollView 
      style={styles.container}
      contentContainerStyle={{
        paddingBottom: Platform.OS === 'ios' 
          ? Math.max(insets.bottom, 20) + 65 + 70  // Tab bar + safe area + button height
          : Math.max(insets.bottom, 10) + 60 + 70  // Tab bar + safe area + button height
      }}
    >
      {/* Swiper for Images */}
      <View style={styles.imageContainer}>
      {/* Swiper */}
      <Swiper loop dotStyle={styles.dot} activeDotStyle={styles.activeDot}>
                {images.map((img: any, index: number) => (
    <TouchableOpacity
      key={index}
      style={{ backgroundColor: '#f0f0f0' }}
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
    </TouchableOpacity>
  ))}
</Swiper>

<ImageViewing
  images={images.map((img: any) => ({ uri: img }))}
  imageIndex={selectedIndex}
  visible={visible}
  onRequestClose={() => setVisible(false)}
  ImageComponent={WatermarkedImage}
/>

      {/* Favorite and Share Icons */}
       <View style={styles.topIcons}>
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

      {/* Price */}
      {/* Price and Time */}
<View style={styles.priceContainer}>
  <View style={styles.priceTimeRow}>
    <Text style={styles.price}>
      PKR {Number(currentCarDetails.price).toLocaleString('en-US')}
    </Text>
    {/* Time Ago - Use dateAdded (when ad was posted) so premium cars don't all show "Just now" */}
    <Text style={styles.timeAgo}>{getTimeAgo(currentCarDetails.dateAdded || currentCarDetails.approvedAt || null)}</Text>
  </View>
  
  {/* Badges Row - Wrap on small screens */}
  <View style={styles.badgesRow}>
    {/* Featured Badge - Only show for premium ads, not free ads */}
    {currentCarDetails.featured && (currentCarDetails.category || '') !== 'free' && (currentCarDetails.adType || '') !== 'free' && (
      <View style={styles.featuredBadge}>
        <Text style={styles.featuredText}>Premium</Text>
      </View>
    )}
    {currentCarDetails.isManaged && (
      <View style={styles.managedBadge}>
        <Text style={styles.managedText} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>
          Managed By AutoFinder
        </Text>
      </View>
    )}
  </View>
</View>


      {/* Car Details */}
      <Text style={styles.carModel}>{currentCarDetails.make} {currentCarDetails.model} {currentCarDetails.variant}</Text>

      {/* Specifications with Icons */}
      <View style={styles.specsContainer}>
        <View style={styles.specItem}>
          <FontAwesome5 name="calendar-alt" size={16} color="#666" />
          <Text style={styles.specText} numberOfLines={1}>{currentCarDetails.year || 'N/A'}</Text>
        </View>

        <View style={styles.specItem}>
          <FontAwesome5 name="tachometer-alt" size={16} color="#666" />
          <Text style={styles.specText} numberOfLines={1}>{currentCarDetails.traveled ? `${currentCarDetails.traveled} km` : 'N/A'}</Text>
        </View>

        <View style={styles.specItem}>
          <FontAwesome5 name="gas-pump" size={16} color="#666" />
          <Text style={styles.specText} numberOfLines={1}>{currentCarDetails.fuelType || currentCarDetails.assembly || 'N/A'}</Text>
        </View>
      </View>

      {/* Description */}
      <Text style={styles.description} numberOfLines={2}>
        {currentCarDetails.description || `${currentCarDetails.bodyType} | ${currentCarDetails.bodyColor} | ${currentCarDetails.transmission}`}
      </Text>

      {/* Location */}
      <View style={styles.locationContainer}>
        <FontAwesome5 name="map-marker-alt" size={16} color="#666" />
        <Text style={styles.locationText} numberOfLines={1}>
          {currentCarDetails.city || currentCarDetails.location || currentCarDetails.registrationCity || 'Location not specified'}
        </Text>
      </View>

      {/* Divider */}
      <View style={styles.divider} />

      {/* Car Overview */}
      <Text style={styles.sectionTitle}>Car Overview</Text>
      <View style={styles.overview}>
        <View style={styles.overviewRow}>
          <Text style={styles.label}>Body Type</Text>
          <Text style={styles.value}>{currentCarDetails?.bodyType || 'Not specified'}</Text>
        </View>
        <View style={styles.overviewRow}>
          <Text style={styles.label}>Body Color</Text>
          <Text style={styles.value}>{currentCarDetails?.bodyColor || 'Not specified'}</Text>
        </View>
        <View style={styles.overviewRow}>
          <Text style={styles.label}>Engine Capacity</Text>
          <Text style={styles.value}>{currentCarDetails?.engineCapacity || 'Not specified'} cc</Text>
        </View>
        <View style={styles.overviewRow}>
          <Text style={styles.label}>Transmission</Text>
          <Text style={styles.value}>{currentCarDetails?.transmission || 'Not specified'}</Text>
        </View>
        <TouchableOpacity onPress={() => setModalVisible(true)}>
        <Text style={styles.showMore}>Show More</Text>
      </TouchableOpacity>
      </View>
      <View style={styles.divider} />
      <View>
      <Text style={styles.sectionTitle}>Features</Text>
      <View style={styles.featuresWrapper}>
        {(currentCarDetails.features || []).map((feature: any, index: number) => (
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
      <Text style={styles.descriptionText}>
  {expanded
    ? currentCarDetails.description
    : (currentCarDetails.description ? currentCarDetails.description.split(" ").slice(0, 40).join(" ") + "..." : "")
  }
</Text>

        <TouchableOpacity onPress={toggleExpand}>
            <Text style={styles.showMore}>{expanded ? "Show Less" : "Show More"}</Text>
        </TouchableOpacity>
        <Text style={styles.postedDate}>Posted On: {formatDate(currentCarDetails.dateAdded)}</Text>
      </View>
      <View style={styles.divider} />
      <Text style={styles.sectionTitle}>Map View</Text>
      <View style={styles.overview2}>
  <Text style={styles.carModel1}>{currentCarDetails.location}</Text>

</View>
      <View style={styles.divider} />
      
      {/* Seller Information Section - Hide for Managed by AutoFinder properties */}
      {!currentCarDetails?.isManaged && (
        <>
          <Text style={styles.sectionTitle}>Seller Information</Text>
          <View style={styles.overview2}>
            {loadingSellerData ? (
              <Text style={styles.carModel1}>Loading seller information...</Text>
            ) : sellerData ? (
              <View>
                <View style={styles.sellerInfoContainer}>
                  <View style={styles.sellerAvatar}>
                    <FontAwesome name="user" size={24} color="#CD0100" />
                  </View>
                  <View style={styles.sellerDetails}>
                    <Text style={styles.sellerName}>{sellerData.name || 'Seller'}</Text>
                    {/* Phone hidden by request; keep Call/WhatsApp actions in footer only */}
                    <Text style={styles.sellerEmail}>📧 {sellerData.email || 'Email not available'}</Text>
                    <Text style={styles.sellerLocation}>📍 {currentCarDetails.location || 'Location not specified'}</Text>
                  </View>
                </View>
              </View>
            ) : (
              <Text style={styles.carModel1}>Seller information not available</Text>
            )}
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
    
    {/* Contact Buttons - Only show if not own property */}
    {!isOwnProperty ? (
      <View style={[
        styles.bottomContainer,
        { 
          bottom: Platform.OS === 'ios' 
            ? Math.max(insets.bottom, 20) + 20  // Tab bar height ~20 + safe area (minimal gap)
            : Math.max(insets.bottom, 10) + 15  // Tab bar height ~15 + safe area (minimal gap)
        }
      ]}>
        <TouchableOpacity style={styles.callButton} onPress={handleCall}>
          <FontAwesome name="phone" size={16} color="#FF6B6B" />
          <Text style={styles.buttonText}>Call</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.whatsappButton} onPress={handleWhatsApp}>
          <FontAwesome name="whatsapp" size={16} color="#25D366" />
          <Text style={styles.buttonText}>WhatsApp</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.chatButton} onPress={async () => {
          try {
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
          } catch (error) {
            console.error('Error opening chat:', error);
            Alert.alert("Error", "Failed to open chat. Please try again.");
          }
        }}>
          <Feather name="message-square" size={16} color="#2196F3" />
          <Text style={styles.buttonText}>Chat</Text>
        </TouchableOpacity>
      </View>
    ) : (
      <View style={styles.ownPropertyContainer}>
        <Text style={styles.ownPropertyText}>
          This is your own property
        </Text>
      </View>
    )}
  
  <CarDetailsModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        carDetails={carDetails}
      />  
  </View>
  );
};

export default DetailsScreen;

const styles = StyleSheet.create({
    mainContainer: {
        flex: 1,
      },
  container: {
    flex: 1,
    backgroundColor: "#fff",
    marginBottom:70,
    marginTop:38,
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
    right: 15,
    flexDirection: "row",
    gap: 15,
  },
  icon: {
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    padding: 8,
    borderRadius: 20,
  },
  priceContainer: {
    paddingHorizontal: 15,
    paddingVertical: 10,
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
  },
  specsContainer: {
    flexDirection: "row",
    marginBottom: 12,
    paddingHorizontal: 16,
    flexWrap: 'wrap',
    gap: 15,
  },
  specItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
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
  descriptionText: {
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
  buttonText: {
    color: "#333",
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 10,
  },
  ownPropertyContainer: {
    padding: 20,
    backgroundColor: "#fff3e0",
    borderRadius: 8,
    marginHorizontal: 16,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: "#ff9800",
  },
  ownPropertyText: {
    fontSize: 14,
    color: "#f57c00",
    fontWeight: "600",
    textAlign: "center",
  },
  reportContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 25,
  },
  sellerInfoContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
  },
  sellerAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  sellerDetails: {
    flex: 1,
  },
  sellerName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 5,
  },
  sellerPhone: {
    fontSize: 14,
    color: "#666",
    marginBottom: 3,
  },
  sellerEmail: {
    fontSize: 14,
    color: "#666",
    marginBottom: 3,
  },
  sellerLocation: {
    fontSize: 14,
    color: "#666",
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
  
});
