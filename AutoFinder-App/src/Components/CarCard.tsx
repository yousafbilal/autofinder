import React, { useEffect, useState } from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet, Share, ActivityIndicator, Linking, Alert } from "react-native";
import { MaterialIcons, Feather, AntDesign, FontAwesome5 } from "@expo/vector-icons"; // Icons
import { API_URL, getAutofinderPhone } from "../../config";
import { safeGetFirstImageSource, safeGetAllImagesWithApiUrl } from "../utils/safeImageUtils";
import { generatePropertyMessage, createWhatsAppUrl } from "../utils/propertyMessageGenerator";
import { preloadDetailImages } from "../utils/imagePreloader";
import { extractSellerId } from "../services/chat";

const CarCard = ({ car, onPress, userId, showPendingTag = false }) => {
  const [isFavorite, setIsFavorite] = useState(false);
  const [isLoadingFavorite, setIsLoadingFavorite] = useState(false);
  const [sellerData, setSellerData] = useState<any>(null);
  const [isLoadingSeller, setIsLoadingSeller] = useState(false);
  const [isOwnProperty, setIsOwnProperty] = useState(false);
  const [adminPhone, setAdminPhone] = useState<string | null>(null);

  // Function to toggle favorite state
  useEffect(() => {
    // Initialize favorite state
    if (car.favoritedBy && userId) {
      setIsFavorite(car.favoritedBy.includes(userId));
    }
  }, [car.favoritedBy, userId]);

  // Check if this is the user's own property
  useEffect(() => {
    const checkIfOwnProperty = () => {
      const currentUserId = userId;
      
      // FIXED: Extract seller ID properly using helper function
      const adUserIdString = extractSellerId(car);
      
      const isOwn = currentUserId && adUserIdString && String(currentUserId) === String(adUserIdString);
      
      // Safely convert carId to string for logging
      let carIdString: string = '';
      if (car?._id) {
        if (typeof car._id === 'string' && car._id.length > 10 && car._id !== '[object Object]' && !car._id.includes('[object')) {
          carIdString = car._id;
        } else if (typeof car._id === 'object' && car._id !== null) {
          try {
            const nestedId = car._id._id || car._id.id;
            if (nestedId && typeof nestedId === 'string' && nestedId.length > 10 && nestedId !== '[object Object]' && !nestedId.includes('[object')) {
              carIdString = nestedId;
            } else if (car._id.toString && typeof car._id.toString === 'function') {
              const str = car._id.toString();
              if (str && typeof str === 'string' && str !== '[object Object]' && str.length > 10 && !str.includes('[object')) {
                carIdString = str;
              }
            }
          } catch (e) {
            carIdString = '';
          }
        }
      }
      
      console.log('🔍 CarCard: Checking if own property:', { 
        currentUserId, 
        adUserId: adUserIdString, 
        isOwn,
        carId: carIdString,
        carTitle: car?.title || `${car?.make} ${car?.model}`
      });
      setIsOwnProperty(isOwn);
    };

    checkIfOwnProperty();
  }, [userId, car]);

  // Fetch admin phone for managed properties
  useEffect(() => {
    if (car?.isManaged) {
      const adId = car?._id || car?.id;
      console.log("📞 CarCard: Fetching admin phone for managed property:", adId);
      getAutofinderPhone(adId).then(phone => {
        setAdminPhone(phone);
        console.log("📞 CarCard: Admin phone fetched:", phone);
        // Set seller data with admin phone for managed properties
        setSellerData({
          _id: 'admin',
          name: 'AutoFinder Support',
          phone: phone,
          isPlaceholder: false,
          isManaged: true
        });
      });
    }
  }, [car?.isManaged, car?._id]);

  // Fetch seller data (skip for managed properties)
  useEffect(() => {
    // Skip fetching seller data for managed properties (already handled above)
    if (car?.isManaged) {
      return;
    }
    
    const fetchSellerData = async () => {
      try {
        // FIXED: Use extractSellerId helper function to properly extract seller ID
        const sellerId = extractSellerId(car);
        
        if (sellerId) {
          setIsLoadingSeller(true);
          console.log("📞 CarCard: Fetching seller data for ID:", sellerId);
          
          const response = await fetch(`${API_URL}/users/${sellerId}/seller-info`);
          
          if (response.ok) {
            const sellerInfo = await response.json();
            console.log("✅ CarCard: Seller data fetched successfully:", {
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
          } else {
            console.error("❌ CarCard: Failed to fetch seller data:", response.status);
            setSellerData({
              _id: null,
              name: "Contact Not Available",
              phone: null,
              email: null,
              isPlaceholder: true
            });
          }
        } else {
          console.log("❌ CarCard: No seller ID found in car details");
          // FIXED: Log car data properly, handling empty objects
          const userIdValue = car?.userId;
          const sellerIdValue = car?.sellerId;
          const postedByValue = car?.postedBy;
          
          // Check if userId is an empty object
          const userIdIsEmptyObj = userIdValue && typeof userIdValue === 'object' && Object.keys(userIdValue).length === 0;
          
          console.log("❌ CarCard: Car data:", {
            userId: userIdIsEmptyObj ? '{} (empty object)' : userIdValue,
            sellerId: sellerIdValue,
            postedBy: postedByValue,
            isManaged: car?.isManaged,
            userIdType: typeof userIdValue,
            userIdKeys: userIdValue && typeof userIdValue === 'object' ? Object.keys(userIdValue) : 'N/A'
          });
          
          setSellerData({
            _id: null,
            name: "Contact Not Available",
            phone: null,
            email: null,
            isPlaceholder: true
          });
        }
      } catch (error) {
        console.error("❌ CarCard: Error fetching seller data:", error);
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
  }, [car]);

  const toggleFavorite = async () => {
    setIsLoadingFavorite(true);
    try {
      console.log("Toggling favorite for:", car._id, "User ID:", userId);
  
      const response = await fetch(`${API_URL}/toggle_favorite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adId: car._id, userId }),
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
  
      console.log("Response status:", response.status);
      console.log("Response data:", data);
  
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
  
  
  const getRelativeTime = (dateString: any) => {
    try {
      if (dateString == null || dateString === '') {
        return "Recently";
      }
      
      const now = new Date();
      let date: Date;
      
      // Handle different date formats (including API object)
      if (typeof dateString === 'number') {
        date = new Date(dateString);
      } else if (typeof dateString === 'string') {
        date = new Date(dateString);
        if (isNaN(date.getTime()) && !isNaN(Number(dateString))) {
          date = new Date(Number(dateString));
        }
      } else if (dateString instanceof Date) {
        date = dateString;
      } else if (dateString && typeof dateString === 'object' && dateString.$date) {
        date = new Date(dateString.$date);
      } else if (dateString && typeof dateString === 'object' && typeof dateString.getTime === 'function') {
        date = dateString as Date;
      } else {
        const s = (dateString as any)?.toString?.() ?? String(dateString);
        date = new Date(s);
      }
      
      if (isNaN(date.getTime())) {
        return "Recently";
      }
      
      const diffMs = now.getTime() - date.getTime();
      
      // If diff is negative (future date), return "Just now"
      if (diffMs < 0) {
        return "Just now";
      }
      
      const seconds = Math.floor(diffMs / 1000);
      const minutes = Math.floor(diffMs / (1000 * 60));
      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      const weeks = Math.floor(days / 7);
      const months = Math.floor(days / 30);
      const years = Math.floor(days / 365);
    
      // FIXED: Always show days/months/years instead of "Just now" for older posts
      if (seconds < 60) return "Just now";
      if (minutes < 60) return `${minutes} min${minutes > 1 ? "s" : ""} ago`;
      if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
      if (days === 0) return "Today";
      if (days === 1) return "1 day ago";
      if (days < 7) return `${days} days ago`;
      if (weeks === 1) return "1 week ago";
      if (weeks < 4) return `${weeks} weeks ago`;
      if (months === 1) return "1 month ago";
      if (months < 12) return `${months} months ago`;
      if (years === 1) return "1 year ago";
      return `${years} years ago`;
    } catch (error) {
      console.error('❌ CarCard: Error calculating relative time:', error);
      return "Just now";
    }
  };
  

  // Function to share car details
  const shareCar = async () => {
    try {
      const shareUrl = `https://autofinder.app/car/${car._id}`;
      const shareMessage = `Check out this car: ${car.make} ${car.model} ${car.varient || ''} ${car.year} for Rs. ${car.price} in ${car.location}!\n\nView details: ${shareUrl}`;
      
      await Share.share({
        message: shareMessage,
        url: shareUrl, // For platforms that support URL
      });
    } catch (error) {
      console.log("Error sharing:", error);
    }
  };

  // Helper functions for contact actions
  const handleCall = () => {
    console.log("📞 CarCard: Call button pressed!");
    console.log("📞 Is managed property:", car?.isManaged);
    console.log("📞 Admin phone:", adminPhone);
    console.log("📞 Current sellerData state:", sellerData);
    
    // For managed properties, use admin phone
    if (car?.isManaged && adminPhone) {
      console.log("📞 CarCard: Using admin phone for managed property:", adminPhone);
      const formattedNumber = '+' + adminPhone;
      Linking.openURL(`tel:${formattedNumber}`);
      return;
    }
    
    // Check if this is a placeholder seller data
    if (sellerData?.isPlaceholder) {
      console.log("⚠️ CarCard: Contact not available - this is a New_Car ad without seller ID");
      Alert.alert("Contact Information", "Contact information is not available for this ad. This appears to be a dealer listing.");
      return;
    }
    
    // Use backend contact info if available, otherwise use phone directly
    const phoneNumber = sellerData?.contactInfo?.phone || sellerData?.phone;
    const callUrl = sellerData?.contactInfo?.callUrl;
    
    console.log("📞 CarCard: Call button pressed - Seller data:", {
      hasSellerData: !!sellerData,
      sellerId: sellerData?._id,
      sellerName: sellerData?.name,
      phoneNumber: phoneNumber,
      callUrl: callUrl,
      contactInfo: sellerData?.contactInfo
    });
    
    if (callUrl) {
      // Use backend formatted call URL
      console.log("📞 CarCard: Using backend call URL:", callUrl);
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
      
      console.log("📞 CarCard: Original phone number:", phoneNumber);
      console.log("📞 CarCard: Cleaned phone number:", cleanNumber);
      console.log("📞 CarCard: Final formatted number:", formattedNumber);
      console.log("📞 CarCard: Calling seller with formatted number:", formattedNumber);
      
      Linking.openURL(fallbackCallUrl);
    } else {
      console.log("❌ CarCard: No phone number available for seller");
      Alert.alert("Contact Information", "Seller's phone number is not available");
    }
  };

  const handleWhatsApp = () => {
    console.log("💬 CarCard: WhatsApp button pressed!");
    console.log("💬 Is managed property:", car?.isManaged);
    console.log("💬 Admin phone:", adminPhone);
    console.log("💬 Current sellerData state:", sellerData);
    
    // For managed properties, use admin phone
    if (car?.isManaged && adminPhone) {
      console.log("💬 CarCard: Using admin phone for managed property:", adminPhone);
      const propertyMessage = generatePropertyMessage(car);
      const whatsappUrl = createWhatsAppUrl(adminPhone, propertyMessage);
      console.log("💬 CarCard: WhatsApp URL:", whatsappUrl);
      Linking.openURL(whatsappUrl);
      return;
    }
    
    // Check if this is a placeholder seller data
    if (sellerData?.isPlaceholder) {
      console.log("⚠️ CarCard: Contact not available - this is a New_Car ad without seller ID");
      Alert.alert("Contact Information", "Contact information is not available for this ad. This appears to be a dealer listing.");
      return;
    }
    
    // Use backend contact info if available, otherwise use phone directly
    const phoneNumber = sellerData?.contactInfo?.phone || sellerData?.phone;
    const whatsappUrl = sellerData?.contactInfo?.whatsappUrl;
    
    console.log("💬 CarCard: WhatsApp button pressed - Seller data:", {
      hasSellerData: !!sellerData,
      sellerId: sellerData?._id,
      sellerName: sellerData?.name,
      phoneNumber: phoneNumber,
      whatsappUrl: whatsappUrl,
      contactInfo: sellerData?.contactInfo
    });
    
    if (whatsappUrl) {
      // Use backend formatted WhatsApp URL with property message
      const propertyMessage = generatePropertyMessage(car);
      const whatsappUrlWithMessage = whatsappUrl + `?text=${encodeURIComponent(propertyMessage)}`;
      console.log("💬 CarCard: Using backend WhatsApp URL with property message:", whatsappUrlWithMessage);
      console.log("💬 CarCard: Property message:", propertyMessage);
      Linking.openURL(whatsappUrlWithMessage);
    } else if (phoneNumber) {
      // Generate property message using utility function
      const propertyMessage = generatePropertyMessage(car);
      
      // Create WhatsApp URL with message using utility function
      const whatsappUrl = createWhatsAppUrl(phoneNumber, propertyMessage);
      
      console.log("💬 CarCard: Original phone number:", phoneNumber);
      console.log("💬 CarCard: Property message:", propertyMessage);
      console.log("💬 CarCard: WhatsApp URL:", whatsappUrl);
      console.log("💬 CarCard: Opening WhatsApp for seller with property message");
      
      Linking.openURL(whatsappUrl);
    } else {
      console.log("❌ CarCard: No phone number available for seller");
      Alert.alert("Contact Information", "Seller's phone number is not available for WhatsApp");
    }
  };

  // INSTANT navigation - no waiting
  const handlePress = () => {
    if (typeof onPress === 'function') {
      onPress();
    }
  };

  return (
    <TouchableOpacity style={styles.card} onPress={handlePress}>
      {/* Image Container */}
      <View style={styles.imageContainer}>
        <Image
          source={safeGetFirstImageSource(car, API_URL)}
          style={styles.image}
        />

        {/* Premium Tag - Show for approved premium ads */}
        {(() => {
          const isFeaturedValue = car?.isFeatured;
          // Check for approved status (case insensitive)
          const isFeaturedStr = typeof isFeaturedValue === 'string' ? isFeaturedValue.toLowerCase() : '';
          const isPremiumApproved = isFeaturedStr === "approved" || isFeaturedValue === true || 
                                    car.paymentStatus === "verified";
          const isFreeAd = (car.category || '') === 'free' || 
                          (car.adType || '') === 'free' || 
                          (car.modelType === 'Free') ||
                          (car.packagePrice === 525) ||
                          (car.paymentAmount === 525);
          return isPremiumApproved && !isFreeAd;
        })() && (
          <View style={styles.featuredTag}>
            <Text style={styles.featuredText}>Premium</Text>
          </View>
        )}
        
        {/* Pending Premium Tag - Show ONLY in MyAds screen (when showPendingTag is true) */}
        {showPendingTag && (() => {
          const isFeaturedValue = car?.isFeatured;
          const isFeaturedStr = typeof isFeaturedValue === 'string' ? isFeaturedValue.toLowerCase() : '';
          // Don't show pending if already approved
          if (isFeaturedStr === "approved" || isFeaturedValue === true || car.paymentStatus === "verified") {
            return false;
          }
          const isPending = isFeaturedStr === "pending" || 
                           (car.paymentStatus === "pending" && car.isPaidAd);
          const isFreeAd = (car.category || '') === 'free' || 
                          (car.adType || '') === 'free' || 
                          (car.modelType === 'Free') ||
                          (car.packagePrice === 525) ||
                          (car.paymentAmount === 525);
          return isPending && !isFreeAd;
        })() && (
          <View style={styles.pendingTag}>
            <Text style={styles.pendingText}>Pending</Text>
          </View>
        )}
        {car.isManaged && (
          <View style={styles.featuredTag1}>
            <Text style={styles.featuredText1}>Managed</Text>
          </View>
        )}
        
        {/* Boosted Badge - Only show for own property */}
        {car.isBoosted && isOwnProperty && (
          <View style={styles.boostedBadge}>
            <MaterialIcons name="rocket-launch" size={14} color="#fff" />
            <Text style={styles.boostedText}>BOOSTED</Text>
          </View>
        )}

        {/* Icons on top-right */}
        <View style={styles.iconContainer}>
        <TouchableOpacity onPress={toggleFavorite} disabled={isLoadingFavorite}>
  {isLoadingFavorite ? (
    <ActivityIndicator size="small" color="#fff" />
  ) : (
    <AntDesign name="heart" size={20} color={isFavorite ? "red" : "#fff"} style={{ opacity: isFavorite ? 1 : 0.3 }} />
  )}
</TouchableOpacity>


          <TouchableOpacity onPress={shareCar}>
            <Feather name="share-2" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Car Info Container */}
      <View style={styles.infoContainer}>
        {/* Price in Red */}
        <Text style={styles.price}>
          PKR {Number(car.price).toLocaleString('en-US')}
        </Text>

        {/* Car Name */}
        <Text style={styles.carName}>{car.make} • {car.model} • {car.variant}</Text>

        {/* Features */}
        {car?.features && Array.isArray(car.features) && car.features.length > 0 && (
          <Text style={styles.features} numberOfLines={2}>
            {car.features.slice(0, 3).join(" • ")}
          </Text>
        )}

        {/* Year & Mileage */}
        <Text style={styles.yearMileage}>
          {car.year} • {car.kmDriven || car.mileage || car.km || car.kilometer || 'N/A'} km
        </Text>

        {/* Location */}
        <View style={styles.locationContainer}>
          <MaterialIcons name="location-on" size={16} color="#e74c3c" />
          <Text style={styles.locationText}>
            {car?.location || car?.city || car?.registrationCity || 'N/A'}
          </Text>
        </View>

        {/* Time posted - Use dateAdded (when ad was posted); approvedAt would show "Just now" for recently approved */}
        {(car?.dateAdded || car?.approvedAt || car?.createdAt) && (
          <Text style={styles.timePosted}>
            {getRelativeTime(car.dateAdded || car.approvedAt || car.createdAt)}
          </Text>
        )}
        
        {/* Action Buttons - Only show for other people's ads */}
        {!isOwnProperty && (
          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={[
                styles.callButton, 
                (sellerData?.isPlaceholder && !car?.isManaged) && styles.disabledButton
              ]} 
              onPress={handleCall}
              disabled={(sellerData?.isPlaceholder && !car?.isManaged) || (isLoadingSeller && !car?.isManaged)}
            >
              {(isLoadingSeller && !car?.isManaged) ? (
                <ActivityIndicator size="small" color="#FF6B6B" />
              ) : (
                <MaterialIcons name="call" size={14} color={(sellerData?.isPlaceholder && !car?.isManaged) ? "#ccc" : "#FF6B6B"} />
              )}
              <Text style={[
                styles.buttonText, 
                (sellerData?.isPlaceholder && !car?.isManaged) && styles.disabledButtonText
              ]}>
                {(isLoadingSeller && !car?.isManaged) ? 'Loading...' : 'Call'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[
                styles.whatsappButton, 
                (sellerData?.isPlaceholder && !car?.isManaged) && styles.disabledButton
              ]} 
              onPress={handleWhatsApp}
              disabled={(sellerData?.isPlaceholder && !car?.isManaged) || (isLoadingSeller && !car?.isManaged)}
            >
              {(isLoadingSeller && !car?.isManaged) ? (
                <ActivityIndicator size="small" color="#25D366" />
              ) : (
                <FontAwesome5 name="whatsapp" size={12} color={(sellerData?.isPlaceholder && !car?.isManaged) ? "#ccc" : "#25D366"} />
              )}
              <Text style={[
                styles.buttonText, 
                (sellerData?.isPlaceholder && !car?.isManaged) && styles.disabledButtonText
              ]}>
                {(isLoadingSeller && !car?.isManaged) ? 'Loading...' : 'WhatsApp'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
        
        {/* Empty space for own property - no message shown */}
        {isOwnProperty && (
          <View style={styles.ownPropertySpacer} />
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    marginBottom: 12,
    marginHorizontal: 8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  imageContainer: {
    position: 'relative',
  },
  image: {
    width: "100%",
    height: 160,
    resizeMode: "cover",
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  featuredTag: {
    position: "absolute",
    top: 0, 
    left: 0, 
    backgroundColor: "#FFDF00",
    paddingVertical: 7,
    borderBottomRightRadius: 10,
    paddingHorizontal: 10,
    zIndex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  featuredTag1: {
    position: "absolute",
    top: 0, 
    left: 0, 
    backgroundColor: "#CD0100",
    paddingVertical: 7,
    borderBottomRightRadius: 10,
    paddingHorizontal: 10,
    zIndex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  featuredText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#333",
  },
  featuredText1: {
    fontSize: 12,
    fontWeight: "bold",
    color: "white",
  },
  pendingTag: {
    position: "absolute",
    top: 0, 
    left: 0, 
    backgroundColor: "#FFA500",
    paddingVertical: 7,
    borderBottomRightRadius: 10,
    paddingHorizontal: 10,
    zIndex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  pendingText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#fff",
  },
  boostedBadge: {
    position: "absolute",
    top: 40,
    left: 0,
    backgroundColor: "#FF6B00",
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderBottomRightRadius: 10,
    borderTopRightRadius: 10,
    zIndex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  boostedText: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#fff",
    letterSpacing: 0.5,
  },
  iconContainer: {
    position: "absolute",
    top: 10,
    right: 10,
    flexDirection: "row",
    gap: 10,
    backgroundColor: "rgba(0,0,0,0.5)",
    padding: 5,
    borderRadius: 15,
  },
  infoContainer: {
    paddingHorizontal: 12,
    paddingVertical: 12,
  },  
  price: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#CD0100",
    marginBottom: 4,
  },
  carName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  features: {
    fontSize: 12,
    color: "#555",
    marginTop: 3,
    marginBottom: 4,
  },
  yearMileage: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  locationContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 5,
    marginBottom: 4,
  },
  locationText: {
    fontSize: 14,
    color: "#e74c3c",
    marginLeft: 5,
  },
  timePosted: {
    fontSize: 12,
    color: "#999",
    marginTop: 2,
    marginBottom: 4,
  },
  actionButtons: {
    flexDirection: "row",
    gap: 8,
    marginTop: 8,
  },
  callButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 25,
    flex: 1,
    borderWidth: 1,
    borderColor: "#FF6B6B",
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
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 25,
    flex: 1,
    borderWidth: 1,
    borderColor: "#25D366",
    shadowColor: "transparent",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  buttonText: {
    fontSize: 12,
    color: "#333",
    marginLeft: 4,
  },
  // Disabled button styles
  disabledButton: {
    backgroundColor: "#ddd",
    borderColor: "#ccc",
  },
  disabledButtonText: {
    color: "#999",
  },
  // Own property spacer - empty space
  ownPropertySpacer: {
    height: 8, // Small spacing to maintain layout
  },
});

export default CarCard;
