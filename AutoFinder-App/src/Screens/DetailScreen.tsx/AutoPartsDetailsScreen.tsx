import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Image, StyleSheet,Linking , TouchableOpacity, ScrollView, ActivityIndicator, BackHandler, Platform, Share } from "react-native";
import Swiper from "react-native-swiper";
import { Entypo, FontAwesome5, Feather, FontAwesome, Ionicons } from "@expo/vector-icons";
import ImageViewing from "react-native-image-viewing";
import { API_URL } from '../../../config';
import NewCarDetailsModal from '../../Components/Models/NewCarDetailsModal';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { startConversation, sendMessage as sendChatMessage, getCurrentUserId } from '../../services/chat';
import { generatePropertyMessage, createWhatsAppUrl } from '../../utils/propertyMessageGenerator';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { rf, rp, createResponsiveStyleSheet, isAndroid } from "../../utils/responsive";

const AutoPartsDetailsScreen = ({ route }) => {
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
  const { part: initialPart } = route.params;
  const [part, setPart] = useState(initialPart);
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isLoadingFavorite, setIsLoadingFavorite] = useState(false);
  const [sellerData, setSellerData] = useState<any>(null);
  const [isOwnProperty, setIsOwnProperty] = useState(false);
  const [showBottomButtons, setShowBottomButtons] = useState(true);
  const [failedImageIndices, setFailedImageIndices] = useState<Set<number>>(new Set());
  const scrollViewRef = useRef<ScrollView>(null);

  // Fetch complete part data if description or location is missing
  const fetchPartDetails = async (partId: any) => {
    // Safely convert partId to string to prevent [object Object] errors
    let safePartId: string;
    try {
      if (!partId) {
        // No ID - skip fetch
        return;
      }
      
      if (typeof partId === 'string') {
        safePartId = partId;
      } else if (typeof partId === 'number') {
        safePartId = String(partId);
      } else if (typeof partId === 'object' && partId) {
        // Check if object is empty
        const keys = Object.keys(partId);
        if (keys.length === 0) {
          // Empty object - skip fetch
          return;
        }
        
        // Try MongoDB ObjectId toString() first (returns actual ID string)
        if (partId.toString && typeof partId.toString === 'function') {
          const str = partId.toString(); // Call toString() directly
          // Check if toString() returned a valid ID (not [object Object])
          if (str && str !== '[object Object]' && str.length > 10) {
            safePartId = str;
          } else {
            // Try nested _id or $oid
            if (partId._id) {
              safePartId = typeof partId._id === 'string' ? partId._id : String(partId._id);
            } else if (partId.$oid) {
              safePartId = String(partId.$oid);
            } else if (partId.id) {
              safePartId = typeof partId.id === 'string' ? partId.id : String(partId.id);
            } else {
              // Empty or invalid object - skip fetch
              return;
            }
          }
        } else {
          // No toString method, try nested properties
          if (partId._id) {
            safePartId = typeof partId._id === 'string' ? partId._id : String(partId._id);
          } else if (partId.$oid) {
            safePartId = String(partId.$oid);
          } else if (partId.id) {
            safePartId = typeof partId.id === 'string' ? partId.id : String(partId.id);
          } else {
            // Empty or invalid object - skip fetch
            return;
          }
        }
      } else {
        safePartId = String(partId);
      }
      
      // Validate ID before making request
      if (!safePartId || safePartId === 'undefined' || safePartId === 'null' || safePartId === '[object Object]' || safePartId.trim() === '') {
        // Invalid ID - skip fetch
        return;
      }
    } catch (e) {
      // Error converting - skip fetch
      return;
    }

    try {
      setLoading(true);
      console.log('🔍 Fetching complete auto part details for ID:', safePartId);
      const response = await fetch(`${API_URL}/autoparts/${safePartId}`);
      
      if (response.ok) {
        const completePartData = await response.json();
        console.log('✅ Complete auto part data fetched:', {
          _id: completePartData._id,
          title: completePartData.title,
          hasImages: !!completePartData.images,
          imagesCount: Array.isArray(completePartData.images) ? completePartData.images.length : 0,
          hasImage1: !!completePartData.image1,
          image1: completePartData.image1,
          allImageFields: [1,2,3,4,5,6,7,8].map(i => ({ [`image${i}`]: completePartData[`image${i}`] }))
        });
        setPart(completePartData);
      } else {
        const errorText = await response.text().catch(() => 'Unknown error');
        console.error('❌ Failed to fetch auto part details:', {
          status: response.status,
          statusText: response.statusText,
          error: errorText
        });
        // Don't show error to user if data already exists - just log it
        if (!part || Object.keys(part).length === 0) {
          console.warn('⚠️ No existing part data, but fetch failed. Continuing with available data.');
        }
      }
    } catch (error: any) {
      console.error('❌ Error fetching auto part details:', error?.message || error);
      // Don't show error to user if data already exists
      if (!part || Object.keys(part).length === 0) {
        console.warn('⚠️ No existing part data, but fetch failed. Continuing with available data.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log("🔍 Auto Parts Details - Part received:", part);
    console.log("🔍 Part fields:", Object.keys(part || {}));
    
    // Safely extract _id from part
    const rawPartId = part?._id || part?.id;
    if (!rawPartId) {
      console.warn('⚠️ No part ID found');
      return;
    }
    
    // Always fetch complete data to ensure we have all images and details
    if (rawPartId) {
      // Check if we already have images
      const hasImages = (part?.images && Array.isArray(part.images) && part.images.length > 0) ||
                       part?.image1 || part?.image2 || part?.image3;
      
      if (!hasImages || !part?.description || !part?.location) {
        console.log("⚠️ Missing images or details, fetching complete data...");
        console.log("📸 Current images state:", {
          hasImagesArray: !!part?.images,
          imagesCount: Array.isArray(part?.images) ? part?.images.length : 0,
          hasImage1: !!part?.image1,
          hasDescription: !!part?.description,
          hasLocation: !!part?.location
        });
        fetchPartDetails(rawPartId);
      } else {
        // If we have all data including images, set loading to false
        console.log("✅ Already have images and details, skipping fetch");
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }, [initialPart]);
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const storedUserData = await AsyncStorage.getItem('user');
        if (storedUserData) {
          const parsedData = JSON.parse(storedUserData);
          console.log("Fetched User ID:", parsedData.userId);
          setUserData(parsedData);
          return parsedData;
        } else {
          console.log("No user data found in AsyncStorage.");
          return null;
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        return null;
      } finally {
        setLoading(false);
      }
    };

    const fetchSellerData = async (currentUserData?: any) => {
      try {
        // Get seller ID from part details - ensure it's a string
        let sellerId = part?.userId || part?.sellerId || part?.postedBy || part?.user;
        
        // If sellerId is an object, extract the _id field
        if (sellerId && typeof sellerId === 'object') {
          sellerId = sellerId._id || sellerId.id;
        }
        
        // Ensure sellerId is a string
        sellerId = sellerId ? String(sellerId) : null;
        
        console.log("🔍 DEBUG: fetchSellerData called with part details:", {
          partId: part?._id,
          partTitle: part?.title || `${part?.make || ''} ${part?.model || ''}`.trim(),
          userId: part?.userId,
          sellerId: part?.sellerId,
          postedBy: part?.postedBy,
          user: part?.user,
          extractedSellerId: sellerId,
          allPartFields: Object.keys(part || {})
        });
        
        if (sellerId) {
          console.log("📞 Fetching seller data for ID:", sellerId);
          
          // Use safeApiCall for better error handling (404s are suppressed automatically)
          const { safeApiCall } = require('../../utils/apiUtils');
          const result = await safeApiCall<any>(`${API_URL}/users/${sellerId}/seller-info`, {}, 1);
          
          if (result.success && result.data) {
            const sellerInfo = result.data;
            console.log("✅ Seller data fetched successfully:", {
              id: sellerInfo._id,
              name: sellerInfo.name,
              phone: sellerInfo.phone,
              email: sellerInfo.email
            });
            setSellerData(sellerInfo);
          } else {
            // 404 is expected - seller info endpoint might not exist or user not found
            // safeApiCall already suppresses 404 error logs, so we just set placeholder
            if (result.status === 404) {
              console.log("⚠️ Seller info not found (404), using placeholder");
            } else {
              // Only log non-404 errors
              console.warn("⚠️ Failed to fetch seller data:", result.status || result.error);
            }
            setSellerData({
              _id: null,
              name: "Contact Not Available",
              phone: null,
              email: null,
              isPlaceholder: true
            });
          }
        } else {
          console.log("❌ No seller ID found in part details");
          console.log("❌ Available part fields:", Object.keys(part || {}));
          console.log("❌ Full part object:", part);
          
          // Check if this might be the current user's own ad
          console.log("🔍 Checking if this might be current user's ad...");
          console.log("🔍 Current logged-in user ID:", currentUserData?.userId);
          
          // Check if this is the user's own ad
          if (currentUserData?.userId) {
            console.log("🏠 VIEWING OWN AD: Using current user data as seller data");
            setSellerData({
              _id: currentUserData.userId,
              name: currentUserData.name || "Your Ad",
              phone: currentUserData.phone || "No phone",
              email: currentUserData.email || "No email",
              isOwnAd: true
            });
          } else {
          setSellerData({
            _id: null,
            name: "Contact Not Available",
            phone: null,
            email: null,
            isPlaceholder: true
          });
          }
        }
      } catch (error: any) {
        // Don't log network errors or abort errors - they're expected
        if (error?.name !== 'AbortError' && error?.message !== 'Aborted' && 
            !error?.message?.includes('Network request failed') && 
            !error?.message?.includes('Failed to fetch')) {
          console.error("❌ Error fetching seller data:", error);
        }
        // Set placeholder data on error
        setSellerData({
          _id: null,
          name: "Contact Not Available",
          phone: null,
          email: null,
          isPlaceholder: true
        });
      }
    };
  
    const initializeData = async () => {
      const userDataResult = await fetchUserData();
      fetchSellerData(userDataResult);
    };
    
    initializeData();
  }, [part]); // Add part as dependency so seller data is fetched when part is updated

  // Check if this is the user's own property
  useEffect(() => {
    if (userData && part) {
      const currentUserId = userData?.userId;
      const adUserId = part?.userId || part?.sellerId || part?.postedBy || part?.user;
      const isOwn = currentUserId && adUserId && currentUserId === adUserId;
      console.log('🔍 Checking if own property:', { currentUserId, adUserId, isOwn });
      setIsOwnProperty(isOwn);
    }
  }, [userData, part]);
  
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
  
  // Helper function to parse price (handles string with commas, numbers, etc.)
  const parsePrice = (price: any): number => {
    if (!price) return 0;
    
    // If it's already a number, return it
    if (typeof price === 'number') {
      return isNaN(price) ? 0 : price;
    }
    
    // If it's a string, remove commas and parse
    if (typeof price === 'string') {
      // Remove commas, spaces, and currency symbols
      const cleaned = price.replace(/[,\sPKR$Rs\.]/gi, '');
      const parsed = parseFloat(cleaned);
      return isNaN(parsed) ? 0 : parsed;
    }
    
    return 0;
  };
  
  const images = (() => {
    console.log("🖼️ AutoPartsDetailsScreen: Building images array...");
    console.log("🖼️ Part data:", {
      hasImages: !!part?.images,
      imagesType: typeof part?.images,
      imagesLength: Array.isArray(part?.images) ? part?.images.length : 0,
      hasImage1: !!part?.image1,
      image1: part?.image1,
      partKeys: Object.keys(part || {})
    });
    
    // If images array exists and has valid URLs, use it
    if (part?.images && Array.isArray(part.images) && part.images.length > 0) {
      // Filter out empty/null/undefined images and ensure they're valid URLs
      const validImages = part.images.filter((img: any) => {
        if (!img) return false;
        const imgStr = String(img).trim();
        return imgStr.length > 0 && (imgStr.startsWith('http') || imgStr.startsWith('/uploads'));
      });
      
      if (validImages.length > 0) {
        console.log(`✅ Using images array: ${validImages.length} images`);
        // Ensure all images are full URLs
        return validImages.map((img: any) => {
          const imgStr = String(img);
          if (imgStr.startsWith('http')) {
            return imgStr;
          } else if (imgStr.startsWith('/uploads')) {
            return `${API_URL}${imgStr}`;
          } else {
            return `${API_URL}/uploads/${imgStr}`;
          }
        });
      }
    }
    
    // Otherwise, build from image1-image8 fields
    const imageFields = [];
    for (let i = 1; i <= 8; i++) {
      const imageField = part?.[`image${i}`];
      if (imageField) {
        const imgStr = String(imageField).trim();
        if (imgStr.length > 0) {
          // If it's already a full URL, use it; otherwise construct the URL
          const imageUrl = imgStr.startsWith('http') 
            ? imgStr 
            : imgStr.startsWith('/uploads')
            ? `${API_URL}${imgStr}`
            : `${API_URL}/uploads/${imgStr}`;
          imageFields.push(imageUrl);
        }
      }
    }
    
    console.log(`📸 Built ${imageFields.length} images from image1-image8 fields`);
    console.log("📸 Image URLs:", imageFields.slice(0, 3));
    
    return imageFields;
  })();

  const [expanded, setExpanded] = useState(false);
  const toggleExpand = () => setExpanded(!expanded);
   useEffect(() => {
      if (userData && part?.favoritedBy) {
        const isAlreadyFavorited = part.favoritedBy.includes(userData.userId);
        setIsFavorite(isAlreadyFavorited);
      }
    }, [userData, part]);
    
    const toggleFavorite = async () => {
      if (!userData?.userId || !part?._id) {
        console.warn("User ID or Part ID not found. Cannot toggle favorite.");
        return;
      }
      setIsLoadingFavorite(true);
      try {
        console.log("Toggling favorite for:", part._id, "User ID:", userData.userId);
    
        const response = await fetch(`${API_URL}/toggle_favorite`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ adId: part._id, userId: userData.userId }),
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

  // Helper functions for contact actions
  const handleCall = () => {
    console.log("📞 Call button pressed!");
    console.log("📞 Current sellerData state:", sellerData);
    console.log("📞 Phone number from sellerData:", sellerData?.phone);
    
    // Check if this is a placeholder seller data
    if (sellerData?.isPlaceholder) {
      console.log("⚠️ Contact not available - this is an auto parts ad without seller ID");
      alert("Contact information is not available for this ad.");
      return;
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
      console.log("⚠️ Contact not available - this is an auto parts ad without seller ID");
      alert("Contact information is not available for this ad.");
      return;
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
      const propertyMessage = generatePropertyMessage({...part, type: 'auto-part'});
      
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

  const sharePart = async () => {
    try {
      const shareUrl = `https://autofinder.pk/auto-part/${part._id}`;
      const shareMessage = `Check out this auto part: ${part?.title || part?.name || part?.model || 'Auto Part'} for Rs. ${part?.price ? parsePrice(part.price).toLocaleString('en-US') : '0'} in ${part?.location || part?.adCity || 'N/A'} on autofinder.pk!\n\nView details: ${shareUrl}`;
      
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
      {images.length > 0 ? (
        <Swiper loop={images.length > 1} dotStyle={styles.dot} activeDotStyle={styles.activeDot}>
          {images.map((img: any, index: number) => {
            const imageUri = typeof img === 'string' ? img : (img?.uri || String(img));
            const hasFailed = failedImageIndices.has(index);

            return (
              <TouchableOpacity
                key={`image-${index}-${imageUri}`}
                style={{ position: 'relative', backgroundColor: '#f0f0f0', flex: 1 }}
                onPress={() => {
                  if (!hasFailed) {
                    setSelectedIndex(index);
                    setVisible(true);
                  }
                }}
              >
                {hasFailed ? (
                  <View style={[styles.image, styles.imagePlaceholder]}>
                    <Ionicons name="image-outline" size={64} color="#999" />
                    <Text style={styles.imagePlaceholderText}>Image unavailable</Text>
                  </View>
                ) : (
                  <Image 
                    source={{ 
                      uri: imageUri,
                      headers: { Accept: 'image/*' },
                    }}
                    style={[styles.image, { backgroundColor: '#e8e8e8' }]}
                    resizeMode="cover"
                    onError={() => {
                      setFailedImageIndices((prev) => new Set(prev).add(index));
                    }}
                  />
                )}
                {/* Watermark */}
                <View style={styles.watermark}>
                  <View style={styles.watermarkContainer}>
                    <Text style={styles.watermarkText}>autofinder.pk</Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </Swiper>
      ) : (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f0f0f0' }}>
          <Image 
            source={require('../../../assets/Other/nodatafound.png')}
            style={[styles.image, { backgroundColor: '#e8e8e8' }]}
            resizeMode="contain"
          />
          <Text style={{ marginTop: 10, color: '#666' }}>No images available</Text>
        </View>
      )}

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
        <TouchableOpacity style={styles.icon} onPress={sharePart}>
          <Feather name="share-2" size={24} color="black" />
        </TouchableOpacity>
      </View>
    </View>

      {/* Price */}
      {/* Price and Featured Badge */}
<View style={styles.priceContainer}>
<Text style={styles.price}>
  PKR {part && part.price ? parsePrice(part.price).toLocaleString('en-US') : '0'}
</Text>

  
  {/* Featured Badge - Only show for premium ads, not free ads */}
  {/* {part.featured && (part.category || '') !== 'free' && (part.adType || '') !== 'free' && (
    <View style={styles.featuredBadge}>
      <Text style={styles.featuredText}>Premium</Text>
    </View>
  )}
  {part.isManaged && (
    <View style={styles.managedBadge}>
      <Text style={styles.managedText}>Managed By AutoFinder</Text>
    </View>
  )} */}
</View>


      {/* Car Details */}
      <Text style={styles.carModel}>{part?.title || part?.name || part?.model || "Auto Part"}</Text>

      <View style={styles.carDetails}>
        <View style={styles.detailItem}>
          <FontAwesome5 name="tools" size={18} color="#CD0100" />
          <Text style={styles.detailText}>{part?.category || part?.partType || part?.condition || 'N/A'}</Text>
        </View>
      </View>

      {/* Location */}
      <View style={styles.locationContainer}>
        <FontAwesome5 name="map-marker-alt" size={18} color="#CD0100" />
        <Text style={styles.locationText} numberOfLines={1}>
          {part?.location || part?.adCity || part?.city || 'Location not specified'}
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

      {/* Auto Store Section */}
      <View style={styles.sellItForMeCard}>
        <View style={styles.sellItForMeContent}>
          <View style={styles.sellItForMeText}>
            <Text style={[styles.sellItForMeTitle, { color: '#CD0100' }]}>Auto Store</Text>
            <Text style={styles.sellItForMeDescription}>
              Sell your auto parts and accessories! List your products in our Auto Store.
            </Text>
            <TouchableOpacity style={styles.sellItForMeLink} onPress={() => navigation.navigate('PostAutoPartsAd')}>
              <Text style={[styles.sellItForMeLinkText, { color: '#CD0100' }]}>List My Product in Auto Store ✨</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.sellItForMeIllustration}>
            <FontAwesome name="shopping-cart" size={40} color="#CD0100" />
          </View>
        </View>
      </View>

      <View style={styles.divider} />

      {/* Car Overview */}
      {/* <Text style={styles.sectionTitle}>Car Overview</Text>
      <View style={styles.overview}>
        <View style={styles.overviewRow}>
          <Text style={styles.label}>Body Type</Text>
          <Text style={styles.value}>{part.bodyType}</Text>
        </View>
        <View style={styles.overviewRow}>
          <Text style={styles.label}>Top Speed</Text>
          <Text style={styles.value}>{part.topSpeed} km/h</Text>
        </View>
        <View style={styles.overviewRow}>
          <Text style={styles.label}>Engine Type</Text>
          <Text style={styles.value}>{part.engineType}</Text>
        </View>
        <View style={styles.overviewRow}>
          <Text style={styles.label}>Transmission</Text>
          <Text style={styles.value}>{part.transmission}</Text>
        </View>
        <TouchableOpacity onPress={() => setModalVisible(true)}>
        <Text style={styles.showMore}>Show More</Text>
      </TouchableOpacity>
      </View> */}
      {/* <View style={styles.divider} />
      <View>
      <Text style={styles.sectionTitle}>Features</Text>
      <View style={styles.featuresWrapper}>
        {(part.features || []).map((feature, index) => (
          <View key={index} style={styles.featureItem}>
            <View style={styles.iconCircle}>
              <FontAwesome name="check" size={8} color="#fff" />
            </View>
            <Text>{feature}</Text>
          </View>
        ))}
      </View>
    </View> */}
      {/* <View style={styles.divider} /> */}
      <Text style={styles.sectionTitle}>Description</Text>
      <View style={styles.overview1}>
      <Text style={styles.description}>
  {expanded
    ? (part?.description || "No description available")
    : (part?.description ? part.description.split(" ").slice(0, 40).join(" ") + "..." : "No description available")
  }
</Text>

        <TouchableOpacity onPress={toggleExpand}>
            <Text style={styles.showMore}>{expanded ? "Show Less" : "Show More"}</Text>
        </TouchableOpacity>
        {part?.dateAdded && (
          <Text style={styles.postedDate}>Posted On: {formatDate(part.dateAdded)}</Text>
        )}
        {!part?.dateAdded && (
          <Text style={styles.postedDate}>Posted On: Date not available</Text>
        )}
      </View>
      <View style={styles.divider} />
      <Text style={styles.sectionTitle}>Map View</Text>
      <View style={styles.overview2}>
  <Text style={styles.carModel1}>{part?.location || part?.adCity || "Location not available"}</Text>

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
      {isOwnProperty ? (
        // Show "own property" message like premium badge
        <View style={styles.ownPropertyBadge}>
          <Text style={styles.ownPropertyBadgeText}>This is your own property</Text>
        </View>
      ) : (
        // Show normal buttons for other people's ads
        <>
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

    <TouchableOpacity style={styles.chatButton} onPress={() => {
      if (part?._id) {
        navigation.navigate('HomeTabs', { screen: 'Chat', params: { openForAd: true, adId: part._id, sellerId: part?.userId || part?.sellerId || part?.postedBy } });
      }
    }}>
      <Feather name="message-square" size={16} color="#2196F3" />
      <Text style={styles.buttonText}>Chat</Text>
    </TouchableOpacity>
        </>
      )}
      </View>
  
  <NewCarDetailsModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        carDetails={part || {}}
      />  
  </View>
  );
};

export default AutoPartsDetailsScreen;

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
  imagePlaceholder: {
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#e8e8e8",
  },
  imagePlaceholderText: {
    marginTop: 8,
    fontSize: 14,
    color: "#666",
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
    fontSize: 16,
    color: "#666",
    fontWeight: "600"
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
  // Own property badge styles (like premium badge)
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
  
});
