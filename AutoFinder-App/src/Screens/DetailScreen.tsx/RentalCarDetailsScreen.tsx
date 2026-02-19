import React, { useState, useEffect } from 'react';
import { View, Text, Image, StyleSheet,Linking , TouchableOpacity, ScrollView, Modal, BackHandler, Platform, ActivityIndicator, Alert, Share } from "react-native";
import Swiper from "react-native-swiper";
import { Entypo, FontAwesome5, Feather, FontAwesome, Ionicons } from "@expo/vector-icons";
import CarDetailsModal from "../../Components/Models/CarDetailsModal";
import ImageViewing from "react-native-image-viewing";
import { API_URL } from '../../../config';
import { useNavigation } from '@react-navigation/native';
import { startConversation, sendMessage as sendChatMessage, getCurrentUserId } from '../../services/chat';
import { buildImageUrls } from '../../utils/safeImageUtils';
import { generatePropertyMessage, createWhatsAppUrl } from '../../utils/propertyMessageGenerator';
import AsyncStorage from '@react-native-async-storage/async-storage';
import SimilarCars from '../../Components/SimilarCars';
import OptimizedImage from '../../Components/OptimizedImage';
import { preloadDetailImages } from '../../utils/imagePreloader';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const RentalCarDetailsScreen = ({ route }) => {
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
  const { carDetails } = route.params;
  const [userData, setUserData] = useState<any>(null);
  const [isOwnProperty, setIsOwnProperty] = useState(false);
  const [viewCount, setViewCount] = useState(carDetails?.views || 0);
  const [callCount, setCallCount] = useState(carDetails?.calls || carDetails?.callClicks || 0);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isLoadingFavorite, setIsLoadingFavorite] = useState(false);

  // Parse date - jis din ad post hua (rent car)
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

  useEffect(() => {
    // Log carDetails when the component mounts
    console.log("Car Details:", carDetails);
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

  // Check if this is the user's own property
  const checkIfOwnProperty = () => {
    const currentUserId = userData?.userId;
    const adUserId = carDetails?.userId || carDetails?.sellerId || carDetails?.postedBy;
    const isOwn = currentUserId && adUserId && currentUserId === adUserId;
    console.log('🔍 Checking if own property:', { currentUserId, adUserId, isOwn });
    setIsOwnProperty(isOwn);
  };

  useEffect(() => {
    if (userData && carDetails) {
      checkIfOwnProperty();
    }
  }, [userData, carDetails]);

  useEffect(() => {
    console.log("Car Details:", carDetails);
    if (!carDetails.description) {
      console.warn("carDetails.description is missing!");
    }
  }, [carDetails]);

  useEffect(() => {
    const fetchSellerData = async () => {
      try {
        // Get seller ID from car details - ensure it's a string
        let sellerId = carDetails?.userId || carDetails?.sellerId || carDetails?.postedBy;
        
        // If sellerId is an object, extract the _id field
        if (sellerId && typeof sellerId === 'object') {
          sellerId = sellerId._id || sellerId.id;
        }
        
        // Ensure sellerId is a string
        sellerId = sellerId ? String(sellerId) : null;
        
        if (sellerId) {
          console.log("Fetching seller data for rental car ID:", sellerId);
          
          const response = await fetch(`${API_URL}/users/${sellerId}/seller-info`);
          if (response.ok) {
            const sellerInfo = await response.json();
            console.log("Seller data fetched for rental car:", sellerInfo);
            setSellerData(sellerInfo);
          } else {
            console.error("Failed to fetch seller data:", response.status);
          }
        } else {
          console.log("No seller ID found in rental car details");
        }
      } catch (error) {
        console.error("Error fetching seller data:", error);
      }
    };

    fetchSellerData();
  }, [carDetails]);
  
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
  const [sellerData, setSellerData] = useState<any>(null);
  const formatDate = (date: any) => {
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    return new Date(date).toLocaleDateString(undefined, options);
  };
  
  
  const images = buildImageUrls([
    carDetails.image1,
    carDetails.image2,
    carDetails.image3,
    carDetails.image4,
    carDetails.image5,
    carDetails.image6,
    carDetails.image7,
    carDetails.image8,
  ], API_URL);

  // Preload images when component mounts - first image gets priority
  useEffect(() => {
    if (images.length > 0) {
      // First image is already prefetched before navigation
      // Preload remaining images in background
      if (images.length > 1) {
        preloadDetailImages(images.slice(1));
      }
    }
  }, [images]);

  // Helper functions for contact actions
  const handleCall = () => {
    // Track call count for all users
    trackCall();
    
    const phoneNumber = sellerData?.phone;
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
      
      console.log("Calling rental car seller with formatted number:", formattedNumber);
      Linking.openURL(`tel:${formattedNumber}`);
    } else {
      console.log("No phone number available for rental car seller");
      alert("Seller's phone number is not available");
    }
  };

  const handleWhatsApp = () => {
    const phoneNumber = sellerData?.phone;
    if (phoneNumber) {
      // Generate property message using utility function
      const propertyMessage = generatePropertyMessage({...carDetails, type: 'rental-car'});
      
      // Create WhatsApp URL with message using utility function
      const whatsappUrl = createWhatsAppUrl(phoneNumber, propertyMessage);
      
      console.log("💬 Original phone number:", phoneNumber);
      console.log("💬 Property message:", propertyMessage);
      console.log("💬 WhatsApp URL:", whatsappUrl);
      console.log("💬 Opening WhatsApp for rental car seller with property message");
      
      Linking.openURL(whatsappUrl);
    } else {
      console.log("❌ No phone number available for rental car seller");
      console.log("❌ SellerData is:", sellerData);
      alert("Seller's phone number is not available for WhatsApp");
    }
  };

  const [expanded, setExpanded] = useState(false);
  const toggleExpand = () => setExpanded(!expanded);

  const shareCar = async () => {
    try {
      const shareUrl = `https://autofinder.pk/rental-car/${carDetails._id}`;
      const shareMessage = `Check out this rental car: ${carDetails.make} ${carDetails.model} ${carDetails.variant || ''} ${carDetails.year} for Rs. ${carDetails.price}/Day in ${carDetails.city || 'N/A'} on autofinder.pk!\n\nView details: ${shareUrl}`;
      
      await Share.share({
        message: shareMessage,
        url: shareUrl, // For platforms that support URL
      });
    } catch (error) {
      console.log("Error sharing:", error);
    }
  };

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

  // Track view and call functions
  const trackView = async () => {
    try {
      if (!carDetails?._id) return;
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

  const trackCall = async () => {
    try {
      if (!carDetails?._id) return;
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

  // Track view when component loads (for all users)
  useEffect(() => {
    if (carDetails?._id) {
      trackView();
    }
  }, [carDetails?._id]);
  return (
    <>
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
      {images.map((img, index) => (
        <TouchableOpacity
          key={index}
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
            <Entypo name={isFavorite ? "heart" : "heart-outlined"} size={24} color={isFavorite ? "red" : "black"} />
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
      PKR {Number(carDetails.price).toLocaleString('en-US')} / Day
    </Text>
    {/* Time Ago - dateAdded pehle (jis din ad post hua) */}
    <Text style={styles.timeAgo}>{getTimeAgo(carDetails.dateAdded ?? carDetails.approvedAt ?? carDetails.date_added ?? carDetails.createdAt ?? null)}</Text>
  </View>
</View>


      {/* Car Details */}
      <Text style={styles.carModel}>{carDetails.make} {carDetails.model} {carDetails.variant}</Text>

      {/* Specifications with Icons */}
      <View style={styles.specsContainer}>
        <View style={styles.specItem}>
          <FontAwesome5 name="calendar-alt" size={16} color="#CD0100" />
          <Text style={styles.specText}>{carDetails.year}</Text>
        </View>

        <View style={styles.specItem}>
          <FontAwesome5 name="tachometer-alt" size={16} color="#CD0100" />
          <Text style={styles.specText}>
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

        <View style={styles.specItem}>
          <FontAwesome5 name="gas-pump" size={16} color="#CD0100" />
          <Text style={styles.specText}>{carDetails.fuelType}</Text>
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
              Have a car to sell, but no time to bargain best offers?
            </Text>
            <TouchableOpacity style={styles.sellItForMeLink} onPress={() => navigation.navigate('ListItForYouScreen' as any)}>
              <Text style={[styles.sellItForMeLinkText, { color: '#CD0100' }]}>I want experts to sell my car ✨</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.sellItForMeIllustration}>
            <FontAwesome name="car" size={40} color="#CD0100" />
          </View>
        </View>
      </View>

      {/* Car on Rent Section */}
      <View style={styles.sellItForMeCard}>
        <View style={styles.sellItForMeContent}>
          <View style={styles.sellItForMeText}>
            <Text style={[styles.sellItForMeTitle, { color: '#CD0100' }]}>Car on Rent</Text>
            <Text style={styles.sellItForMeDescription}>
              Rent out your car and earn money! List your car for rent today.
            </Text>
            <TouchableOpacity style={styles.sellItForMeLink} onPress={() => navigation.navigate('RentServiceAd')}>
              <Text style={[styles.sellItForMeLinkText, { color: '#CD0100' }]}>List My Car for Rent ✨</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.sellItForMeIllustration}>
            <FontAwesome name="car" size={40} color="#CD0100" />
          </View>
        </View>
      </View>

      {/* Car Overview */}
      <Text style={styles.sectionTitle}>Car Overview</Text>
      <View style={styles.overview}>
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
          <Text style={styles.value}>{carDetails?.engineCapacity || 'Not specified'} cc</Text>
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
      <Text style={styles.sectionTitle}>Important</Text>
      <View style={styles.overview}>
        <View style={styles.overviewRow}>
          <Text style={styles.label}>Payment Type</Text>
          <Text style={styles.value}>{carDetails?.paymenttype || 'Not specified'}</Text>
        </View>
        <View style={styles.overviewRow}>
          <Text style={styles.label}>Documentation Requirement</Text>
          <Text style={styles.value}>{carDetails?.documents || 'Not specified'}</Text>
        </View>
        <View style={styles.overviewRow}>
          <Text style={styles.label}>Driving Type</Text>
          <Text style={styles.value}>{carDetails?.drivingtype || 'Not specified'}</Text>
        </View>
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
      <Text style={styles.sectionTitle}>Map View</Text>
      <View style={styles.overview2}>
  <Text style={styles.carModel1}>{carDetails.location}</Text>

</View>
<View style={styles.divider} />

{/* Seller Information - Hide for Managed by AutoFinder properties */}
{sellerData && !carDetails?.isManaged && (
  <>
    <Text style={styles.sectionTitle}>Seller Information</Text>
    <View style={styles.sellerContainer}>
      <View style={styles.sellerInfo}>
        <View style={styles.sellerAvatar}>
          <FontAwesome name="user" size={24} color="#CD0100" />
        </View>
        <View style={styles.sellerDetails}>
          <Text style={styles.sellerName}>{sellerData.name || 'Seller'}</Text>
          {/* Phone hidden by request */}
          <Text style={styles.sellerLocation}>
            📍 {carDetails.location || 'Location not specified'}
          </Text>
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
            propertyType: 'rental',
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
    ImageComponent={WatermarkedImage}
    swipeToCloseEnabled={true}
    doubleTapToZoomEnabled={true}
  />
  </>
  );
};

export default RentalCarDetailsScreen;

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
    marginBottom: 12,
    paddingHorizontal: 16,
    gap: 20,
  },
  specItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  specText: {
    fontSize: 14,
    color: "#666",
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
    gap: 6,
  },
  locationText: {
    fontSize: 14,
    color: "#666",
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
  timeAgo: {
    fontSize: 12,
    color: "#999",
    marginLeft: 10,
    alignSelf: 'flex-end',
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
