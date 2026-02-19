import React, { useEffect, useState } from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet, Share, ActivityIndicator, Linking, Alert } from "react-native";
import { MaterialIcons, Feather, AntDesign, FontAwesome5 } from "@expo/vector-icons";
import { API_URL, getAutofinderPhone } from "../../config";
import { safeGetFirstImageSource, safeGetAllImagesWithApiUrl } from "../utils/safeImageUtils";
import { generatePropertyMessage, createWhatsAppUrl } from "../utils/propertyMessageGenerator";
import { preloadDetailImages } from "../utils/imagePreloader";
import { extractSellerId } from "../services/chat";

const BikeCard = ({ bike, onPress, userId, showPremiumTag = false, showPendingTag = false }: { bike: any; onPress: () => void; userId: string; showPremiumTag?: boolean; showPendingTag?: boolean }) => {
  const [isFavorite, setIsFavorite] = useState(false);
  const [isLoadingFavorite, setIsLoadingFavorite] = useState(false);
  const [sellerData, setSellerData] = useState<any>(null);
  const [isLoadingSeller, setIsLoadingSeller] = useState(false);
  const [isOwnProperty, setIsOwnProperty] = useState(false);
  const [adminPhone, setAdminPhone] = useState<string | null>(null);

  // Function to toggle favorite state
  useEffect(() => {
    // Initialize favorite state
    if (bike.favoritedBy && userId) {
      setIsFavorite(bike.favoritedBy.includes(userId));
    }
  }, [bike.favoritedBy, userId]);

  // Check if this is the user's own property
  useEffect(() => {
    const checkIfOwnProperty = () => {
      const currentUserId = userId;
      
      // FIXED: Extract seller ID properly using helper function
      const adUserIdString = extractSellerId(bike);
      
      const isOwn = currentUserId && adUserIdString && String(currentUserId) === String(adUserIdString);
      console.log('🔍 BikeCard: Checking if own property:', { 
        currentUserId, 
        adUserId: adUserIdString, 
        isOwn,
        bikeId: bike?._id,
        bikeIdType: typeof bike?._id,
        bikeTitle: bike?.title || `${bike?.make} ${bike?.model}`,
        bikeUserId: bike?.userId,
        bikeUserIdType: typeof bike?.userId,
        bikeSellerId: bike?.sellerId,
        bikePostedBy: bike?.postedBy
      });
      setIsOwnProperty(isOwn);
    };

    checkIfOwnProperty();
  }, [userId, bike]);

  // Fetch admin phone for managed properties
  useEffect(() => {
    if (bike?.isManaged) {
      const adId = bike?._id || bike?.id;
      console.log("📞 BikeCard: Fetching admin phone for managed property:", adId);
      getAutofinderPhone(adId).then(phone => {
        setAdminPhone(phone);
        console.log("📞 BikeCard: Admin phone fetched:", phone);
        setSellerData({
          _id: 'admin',
          name: 'AutoFinder Support',
          phone: phone,
          isPlaceholder: false,
          isManaged: true
        });
      });
    }
  }, [bike?.isManaged, bike?._id]);

  // Fetch seller data (skip for managed properties)
  useEffect(() => {
    if (bike?.isManaged) return;
    
    const fetchSellerData = async () => {
      try {
        // FIXED: Use extractSellerId helper function to properly extract seller ID
        const sellerId = extractSellerId(bike);
        
        if (sellerId) {
          setIsLoadingSeller(true);
          console.log("📞 BikeCard: Fetching seller data for ID:", sellerId);
          
          const response = await fetch(`${API_URL}/users/${sellerId}/seller-info`);
          
          if (response.ok) {
            const sellerInfo = await response.json();
            console.log("✅ BikeCard: Seller data fetched successfully:", {
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
            console.error("❌ BikeCard: Failed to fetch seller data:", response.status);
            setSellerData({
              _id: null,
              name: "Contact Not Available",
              phone: null,
              email: null,
              isPlaceholder: true
            });
          }
        } else {
          console.log("❌ BikeCard: No seller ID found in bike details", {
            bikeId: bike?._id,
            bikeTitle: bike?.title || `${bike?.make} ${bike?.model}`,
            userId: bike?.userId,
            userIdType: typeof bike?.userId,
            sellerId: bike?.sellerId,
            postedBy: bike?.postedBy
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
        console.error("❌ BikeCard: Error fetching seller data:", error);
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
  }, [bike]);

  const toggleFavorite = async () => {
    setIsLoadingFavorite(true);
    try {
      console.log("Toggling favorite for:", bike._id, "User ID:", userId);
  
      const response = await fetch(`${API_URL}/toggle_favorite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adId: bike._id, userId }),
      });
  
      const data = await response.json();
  
      console.log("Response status:", response.status);
      console.log("Response data:", data);
  
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
  
  // Parse date (string, number, or object) - jis din ad post hua
  const getRelativeTime = (dateString: any) => {
    try {
      if (dateString == null || dateString === '') return "Recently";
      const now = new Date();
      let date: Date;
      if (typeof dateString === 'number') date = new Date(dateString);
      else if (typeof dateString === 'string') {
        date = new Date(dateString);
        if (isNaN(date.getTime()) && !isNaN(Number(dateString))) date = new Date(Number(dateString));
      } else if (dateString instanceof Date) date = dateString;
      else if (dateString && typeof dateString === 'object' && dateString.$date) date = new Date(dateString.$date);
      else if (dateString && typeof dateString === 'object' && typeof dateString.getTime === 'function') date = dateString as Date;
      else date = new Date((dateString as any)?.toString?.() ?? String(dateString));
      if (isNaN(date.getTime())) return "Recently";
      const diffMs = now.getTime() - date.getTime();
      if (diffMs < 0) return "Recently";
      const seconds = Math.floor(diffMs / 1000);
      const minutes = Math.floor(diffMs / (1000 * 60));
      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      const weeks = Math.floor(days / 7);
      const months = Math.floor(days / 30);
      const years = Math.floor(days / 365);
      if (seconds < 60) return "Just now";
      if (minutes < 60) return `${minutes} min${minutes > 1 ? "s" : ""} ago`;
      if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
      if (days === 1) return "1 day ago";
      if (days < 7) return `${days} days ago`;
      if (weeks === 1) return "1 week ago";
      if (weeks < 4) return `${weeks} weeks ago`;
      if (months === 1) return "1 month ago";
      if (months < 12) return `${months} months ago`;
      if (years === 1) return "1 year ago";
      return `${years} years ago`;
    } catch (error) {
      console.error('Error calculating relative time:', error);
      return "Recently";
    }
  };
  
  // Function to share bike details
  const shareBike = async () => {
    try {
      await Share.share({
        message: `Check out this bike: ${bike.make} ${bike.model} ${bike.year} for Rs. ${bike.price} in ${bike.location}!`,
      });
    } catch (error) {
      console.log("Error sharing:", error);
    }
  };

  // Helper functions for contact actions
  const handleCall = () => {
    console.log("📞 BikeCard: Call button pressed!");
    console.log("📞 Is managed property:", bike?.isManaged);
    console.log("📞 Admin phone:", adminPhone);
    console.log("📞 Current sellerData state:", sellerData);
    
    // For managed properties, use admin phone
    if (bike?.isManaged && adminPhone) {
      console.log("📞 BikeCard: Using admin phone for managed property:", adminPhone);
      const formattedNumber = '+' + adminPhone;
      Linking.openURL(`tel:${formattedNumber}`);
      return;
    }
    
    // Check if this is a placeholder seller data
    if (sellerData?.isPlaceholder) {
      console.log("⚠️ BikeCard: Contact not available - this is a New_Bike ad without seller ID");
      Alert.alert("Contact Information", "Contact information is not available for this ad. This appears to be a dealer listing.");
      return;
    }
    
    // Use backend contact info if available, otherwise use phone directly
    const phoneNumber = sellerData?.contactInfo?.phone || sellerData?.phone;
    const callUrl = sellerData?.contactInfo?.callUrl;
    
    console.log("📞 BikeCard: Call button pressed - Seller data:", {
      hasSellerData: !!sellerData,
      sellerId: sellerData?._id,
      sellerName: sellerData?.name,
      phoneNumber: phoneNumber,
      callUrl: callUrl,
      contactInfo: sellerData?.contactInfo
    });
    
    if (callUrl) {
      // Use backend formatted call URL
      console.log("📞 BikeCard: Using backend call URL:", callUrl);
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
      
      console.log("📞 BikeCard: Original phone number:", phoneNumber);
      console.log("📞 BikeCard: Cleaned phone number:", cleanNumber);
      console.log("📞 BikeCard: Final formatted number:", formattedNumber);
      console.log("📞 BikeCard: Calling seller with formatted number:", formattedNumber);
      
      Linking.openURL(fallbackCallUrl);
    } else {
      console.log("❌ BikeCard: No phone number available for seller");
      Alert.alert("Contact Information", "Seller's phone number is not available");
    }
  };

  const handleWhatsApp = () => {
    console.log("💬 BikeCard: WhatsApp button pressed!");
    console.log("💬 Is managed property:", bike?.isManaged);
    console.log("💬 Admin phone:", adminPhone);
    console.log("💬 Current sellerData state:", sellerData);
    
    // For managed properties, use admin phone
    if (bike?.isManaged && adminPhone) {
      console.log("💬 BikeCard: Using admin phone for managed property:", adminPhone);
      const propertyMessage = generatePropertyMessage(bike);
      const whatsappUrl = createWhatsAppUrl(adminPhone, propertyMessage);
      console.log("💬 BikeCard: WhatsApp URL:", whatsappUrl);
      Linking.openURL(whatsappUrl);
      return;
    }
    
    // Check if this is a placeholder seller data
    if (sellerData?.isPlaceholder) {
      console.log("⚠️ BikeCard: Contact not available - this is a New_Bike ad without seller ID");
      Alert.alert("Contact Information", "Contact information is not available for this ad. This appears to be a dealer listing.");
      return;
    }
    
    // Use backend contact info if available, otherwise use phone directly
    const phoneNumber = sellerData?.contactInfo?.phone || sellerData?.phone;
    const whatsappUrl = sellerData?.contactInfo?.whatsappUrl;
    
    console.log("💬 BikeCard: WhatsApp button pressed - Seller data:", {
      hasSellerData: !!sellerData,
      sellerId: sellerData?._id,
      sellerName: sellerData?.name,
      phoneNumber: phoneNumber,
      whatsappUrl: whatsappUrl,
      contactInfo: sellerData?.contactInfo
    });
    
    if (whatsappUrl) {
      // Use backend formatted WhatsApp URL with property message
      const propertyMessage = generatePropertyMessage(bike);
      const whatsappUrlWithMessage = whatsappUrl + `?text=${encodeURIComponent(propertyMessage)}`;
      console.log("💬 BikeCard: Using backend WhatsApp URL with property message:", whatsappUrlWithMessage);
      console.log("💬 BikeCard: Property message:", propertyMessage);
      Linking.openURL(whatsappUrlWithMessage);
    } else if (phoneNumber) {
      // Generate property message using utility function
      const propertyMessage = generatePropertyMessage(bike);
      
      // Create WhatsApp URL with message using utility function
      const whatsappUrl = createWhatsAppUrl(phoneNumber, propertyMessage);
      
      console.log("💬 BikeCard: Original phone number:", phoneNumber);
      console.log("💬 BikeCard: Property message:", propertyMessage);
      console.log("💬 BikeCard: WhatsApp URL:", whatsappUrl);
      console.log("💬 BikeCard: Opening WhatsApp for seller with property message");
      
      Linking.openURL(whatsappUrl);
    } else {
      console.log("❌ BikeCard: No phone number available for seller");
      Alert.alert("Contact Information", "Seller's phone number is not available for WhatsApp");
    }
  };

  // INSTANT navigation - no waiting
  const handlePress = () => {
    onPress();
  };

  return (
    <TouchableOpacity style={styles.card} onPress={handlePress}>
      {/* Image with Favorite & Share Icons */}
      <View>
        <Image
          source={safeGetFirstImageSource(bike, API_URL)}
          style={styles.image}
        />

        {/* Premium Tag - Show for approved premium ads OR when showPremiumTag prop is true */}
        {(() => {
          // If showPremiumTag prop is explicitly passed, show the tag
          if (showPremiumTag) {
            return true;
          }
          
          const isFeaturedValue = bike?.isFeatured;
          // Check for approved status (case insensitive)
          const isFeaturedStr = typeof isFeaturedValue === 'string' ? isFeaturedValue.toLowerCase() : '';
          const isPremiumApproved = isFeaturedStr === "approved" || isFeaturedValue === true || 
                                    bike.paymentStatus === "verified";
          const isFreeAd = (bike.category || '') === 'free' || 
                          (bike.adType || '') === 'free' || 
                          (bike.modelType === 'Free') ||
                          (bike.packagePrice === 525) ||
                          (bike.paymentAmount === 525);
          return isPremiumApproved && !isFreeAd;
        })() && (
          <View style={styles.featuredTag}>
            <Text style={styles.featuredText}>Premium</Text>
          </View>
        )}
        
        {/* Pending Premium Tag - Show ONLY in MyAds screen (when showPendingTag is true) */}
        {showPendingTag && (() => {
          const isFeaturedValue = bike?.isFeatured;
          const isFeaturedStr = typeof isFeaturedValue === 'string' ? isFeaturedValue.toLowerCase() : '';
          // Don't show pending if already approved
          if (isFeaturedStr === "approved" || isFeaturedValue === true || bike.paymentStatus === "verified") {
            return false;
          }
          const isPending = isFeaturedStr === "pending" || 
                           (bike.paymentStatus === "pending" && bike.isPaidAd);
          const isFreeAd = (bike.category || '') === 'free' || 
                          (bike.adType || '') === 'free' || 
                          (bike.modelType === 'Free') ||
                          (bike.packagePrice === 525) ||
                          (bike.paymentAmount === 525);
          return isPending && !isFreeAd;
        })() && (
          <View style={styles.pendingTag}>
            <Text style={styles.pendingText}>Pending</Text>
          </View>
        )}
        {bike.isManaged && (
          <View style={styles.featuredTag1}>
            <Text style={styles.featuredText1}>Managed By AutoFinder</Text>
          </View>
        )}
        
        {/* BOOSTED Badge - Only show for own property */}
        {bike.isBoosted && isOwnProperty && (
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
          
          <TouchableOpacity onPress={shareBike}>
            <Feather name="share-2" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Bike Info Container */}
      <View style={styles.infoContainer}>
        {/* Price in Red */}
        <Text style={styles.price}>
          PKR {bike.price ? Number(bike.price).toLocaleString('en-US') : '0'}
        </Text>

        {/* Bike Name */}
        <Text style={styles.bikeName}>
          {bike?.make || 'Bike'} {bike?.model || ''} {bike?.year || ''}
        </Text>

        {/* Features - Single Line with "..." if needed */}
        <Text style={styles.features}>
          {bike?.features && Array.isArray(bike.features)
            ? bike.features.slice(0, 5).map((feature) => feature.replace(/["\\[\]]/g, '')).join(" || ")
            : "No Features Available"}
        </Text>

        {/* Year, Mileage & Fuel Type */}
        <Text style={styles.yearMileage}>
          {bike?.year || 'N/A'} • {bike?.kmDriven || bike?.mileage || bike?.km || bike?.kilometer || 'N/A'} km{(() => {
            // Check multiple possible field names for fuel type
            const fuelType = bike?.fuelType || 
                            bike?.fuel || 
                            bike?.fueltype || 
                            bike?.fuel_type ||
                            bike?.enginetype ||
                            bike?.engineType ||
                            '';
            
            return fuelType && fuelType.trim() !== '' && fuelType !== 'N/A' ? ` • ${fuelType}` : '';
          })()}
        </Text>

        {/* Location with Icon */}
        <View style={styles.locationContainer}>
          <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
            <MaterialIcons name="location-on" size={18} color="#CD0100" />
            <Text style={styles.locationText}>{bike?.location || bike?.adCity || 'Location not specified'}</Text>
          </View>
          <Text style={styles.dateText}>{(bike?.dateAdded || bike?.approvedAt) ? getRelativeTime(bike.dateAdded || bike.approvedAt) : 'N/A'}</Text>
        </View>

        {/* Action Buttons - Only show for other people's ads */}
        {!isOwnProperty && (
          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={[
                styles.callButton, 
                (sellerData?.isPlaceholder && !bike?.isManaged) && styles.disabledButton
              ]} 
              onPress={handleCall}
              disabled={(sellerData?.isPlaceholder && !bike?.isManaged) || (isLoadingSeller && !bike?.isManaged)}
            >
              {(isLoadingSeller && !bike?.isManaged) ? (
                <ActivityIndicator size="small" color="#FF6B6B" />
              ) : (
                <MaterialIcons name="call" size={14} color={(sellerData?.isPlaceholder && !bike?.isManaged) ? "#ccc" : "#FF6B6B"} />
              )}
              <Text style={[
                styles.buttonText, 
                (sellerData?.isPlaceholder && !bike?.isManaged) && styles.disabledButtonText
              ]}>
                {(isLoadingSeller && !bike?.isManaged) ? 'Loading...' : 'Call'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[
                styles.whatsappButton, 
                (sellerData?.isPlaceholder && !bike?.isManaged) && styles.disabledButton
              ]} 
              onPress={handleWhatsApp}
              disabled={(sellerData?.isPlaceholder && !bike?.isManaged) || (isLoadingSeller && !bike?.isManaged)}
            >
              {(isLoadingSeller && !bike?.isManaged) ? (
                <ActivityIndicator size="small" color="#25D366" />
              ) : (
                <FontAwesome5 name="whatsapp" size={12} color={(sellerData?.isPlaceholder && !bike?.isManaged) ? "#ccc" : "#25D366"} />
              )}
              <Text style={[
                styles.buttonText, 
                (sellerData?.isPlaceholder && !bike?.isManaged) && styles.disabledButtonText
              ]}>
                {(isLoadingSeller && !bike?.isManaged) ? 'Loading...' : 'WhatsApp'}
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
    borderRadius: 8,
    overflow: "hidden",
    marginBottom: 12,
    paddingBottom: 10,
    elevation: 3,
  },
  image: {
    width: "100%",
    height: 180,
    resizeMode: "cover",
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
  boostedBadge: {
    position: "absolute",
    top: 40,
    left: 0,
    backgroundColor: "#FF6B00",
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderTopRightRadius: 8,
    borderBottomRightRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    zIndex: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  boostedText: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#fff",
    letterSpacing: 0.5,
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
    paddingHorizontal: 10,
    paddingTop: 5,
  },  
  price: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#CD0100",
  },
  bikeName: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#333",
    marginTop: 3,
  },
  features: {
    fontSize: 12,
    color: "#555",
    marginTop: 3,
  },
  yearMileage: {
    fontSize: 14,
    color: "#444",
    marginTop: 3,
  },
  boldText: {
    fontWeight: "bold",
  },
  locationContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 5,
  },
  locationText: {
    fontSize: 14,
    color: "#e74c3c",
    marginLeft: 5,
  },
  dateText: {
    fontSize: 12,
    color: "#777",
    textAlign: "right",
  },
  // Action buttons styles
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

export default BikeCard;