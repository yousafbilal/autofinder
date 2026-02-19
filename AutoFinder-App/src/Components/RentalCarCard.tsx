import React, { useEffect, useState } from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet, Share, ActivityIndicator, Linking, Alert } from "react-native";
import { MaterialIcons, Feather, AntDesign, FontAwesome5 } from "@expo/vector-icons"; // Icons
import { API_URL, getAutofinderPhone } from "../../config";
import { buildImageUrl, buildImageUrls } from "../utils/safeImageUtils";
import { generatePropertyMessage, createWhatsAppUrl } from "../utils/propertyMessageGenerator";
import { preloadDetailImages } from "../utils/imagePreloader";

const RentalCarCard = ({ car, onPress, userId }) => {
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
      let adUserId = car?.userId || car?.sellerId || car?.postedBy || car?.addedBy;
      if (adUserId && typeof adUserId === 'object') {
        adUserId = adUserId._id ?? adUserId.id ?? adUserId.$oid;
      }
      const adUserIdString = adUserId != null && adUserId !== '' ? String(adUserId) : null;
      
      const isOwn = currentUserId && adUserIdString && currentUserId === adUserIdString;
      console.log('🔍 RentalCarCard: Checking if own property:', { 
        currentUserId, 
        adUserId: adUserIdString, 
        isOwn,
        carId: car?._id,
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
      console.log("📞 RentalCarCard: Fetching admin phone for managed property:", adId);
      getAutofinderPhone(adId).then(phone => {
        setAdminPhone(phone);
        console.log("📞 RentalCarCard: Admin phone fetched:", phone);
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
    if (car?.isManaged) return;
    
    const fetchSellerData = async () => {
      try {
        // Get seller ID from car details (backend Rent_Car model uses userId)
        let sellerId = car?.userId || car?.sellerId || car?.postedBy || car?.addedBy || car?.createdBy || car?.ownerId;
        
        // If sellerId is an object, extract the id (MongoDB can return _id, id, or $oid)
        if (sellerId && typeof sellerId === 'object') {
          sellerId = sellerId._id ?? sellerId.id ?? sellerId.$oid ?? sellerId.value;
        }
        
        // If we got an object from _id/id (e.g. nested ObjectId), extract again
        if (sellerId && typeof sellerId === 'object') {
          sellerId = sellerId._id ?? sellerId.id ?? sellerId.$oid;
        }
        
        // Ensure sellerId is a string
        sellerId = sellerId != null && sellerId !== '' ? String(sellerId) : null;
        
        if (sellerId) {
          setIsLoadingSeller(true);
          console.log("📞 RentalCarCard: Fetching seller data for ID:", sellerId);
          
          const response = await fetch(`${API_URL}/users/${sellerId}/seller-info`);
          
          if (response.ok) {
            const sellerInfo = await response.json();
            console.log("✅ RentalCarCard: Seller data fetched successfully:", {
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
            console.error("❌ RentalCarCard: Failed to fetch seller data:", response.status);
            setSellerData({
              _id: null,
              name: "Contact Not Available",
              phone: null,
              email: null,
              isPlaceholder: true
            });
          }
        } else {
          console.log("❌ RentalCarCard: No seller ID found in car details");
          setSellerData({
            _id: null,
            name: "Contact Not Available",
            phone: null,
            email: null,
            isPlaceholder: true
          });
        }
      } catch (error) {
        console.error("❌ RentalCarCard: Error fetching seller data:", error);
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

  // Function to share car details
  const shareCar = async () => {
    try {
      await Share.share({
        message: `Check out this car: ${car.make} ${car.model} ${car.varient} ${car.year} for Rs. ${car.price} in ${car.location}!`,
      });
    } catch (error) {
      console.log("Error sharing:", error);
    }
  };

  // Helper functions for contact actions
  const handleCall = () => {
    console.log("📞 RentalCarCard: Call button pressed!");
    console.log("📞 Is managed property:", car?.isManaged);
    console.log("📞 Admin phone:", adminPhone);
    console.log("📞 Current sellerData state:", sellerData);
    
    // For managed properties, use admin phone
    if (car?.isManaged && adminPhone) {
      console.log("📞 RentalCarCard: Using admin phone for managed property:", adminPhone);
      const formattedNumber = '+' + adminPhone;
      Linking.openURL(`tel:${formattedNumber}`);
      return;
    }
    
    // Check if this is a placeholder seller data
    if (sellerData?.isPlaceholder) {
      console.log("⚠️ RentalCarCard: Contact not available - this is a rental ad without seller ID");
      Alert.alert("Contact Information", "Contact information is not available for this ad. This appears to be a dealer listing.");
      return;
    }
    
    // Use backend contact info if available, otherwise use phone directly
    const phoneNumber = sellerData?.contactInfo?.phone || sellerData?.phone;
    const callUrl = sellerData?.contactInfo?.callUrl;
    
    console.log("📞 RentalCarCard: Call button pressed - Seller data:", {
      hasSellerData: !!sellerData,
      sellerId: sellerData?._id,
      sellerName: sellerData?.name,
      phoneNumber: phoneNumber,
      callUrl: callUrl,
      contactInfo: sellerData?.contactInfo
    });
    
    if (callUrl) {
      // Use backend formatted call URL
      console.log("📞 RentalCarCard: Using backend call URL:", callUrl);
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
      
      console.log("📞 RentalCarCard: Original phone number:", phoneNumber);
      console.log("📞 RentalCarCard: Cleaned phone number:", cleanNumber);
      console.log("📞 RentalCarCard: Final formatted number:", formattedNumber);
      console.log("📞 RentalCarCard: Calling seller with formatted number:", formattedNumber);
      
      Linking.openURL(fallbackCallUrl);
    } else {
      console.log("❌ RentalCarCard: No phone number available for seller");
      Alert.alert("Contact Information", "Seller's phone number is not available");
    }
  };

  const handleWhatsApp = () => {
    console.log("💬 RentalCarCard: WhatsApp button pressed!");
    console.log("💬 Is managed property:", car?.isManaged);
    console.log("💬 Admin phone:", adminPhone);
    console.log("💬 Current sellerData state:", sellerData);
    
    // For managed properties, use admin phone
    if (car?.isManaged && adminPhone) {
      console.log("💬 RentalCarCard: Using admin phone for managed property:", adminPhone);
      const propertyMessage = generatePropertyMessage(car);
      const whatsappUrl = createWhatsAppUrl(adminPhone, propertyMessage);
      console.log("💬 RentalCarCard: WhatsApp URL:", whatsappUrl);
      Linking.openURL(whatsappUrl);
      return;
    }
    
    // Check if this is a placeholder seller data
    if (sellerData?.isPlaceholder) {
      console.log("⚠️ RentalCarCard: Contact not available - this is a rental ad without seller ID");
      Alert.alert("Contact Information", "Contact information is not available for this ad. This appears to be a dealer listing.");
      return;
    }
    
    // Use backend contact info if available, otherwise use phone directly
    const phoneNumber = sellerData?.contactInfo?.phone || sellerData?.phone;
    const whatsappUrl = sellerData?.contactInfo?.whatsappUrl;
    
    console.log("💬 RentalCarCard: WhatsApp button pressed - Seller data:", {
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
      console.log("💬 RentalCarCard: Using backend WhatsApp URL with property message:", whatsappUrlWithMessage);
      console.log("💬 RentalCarCard: Property message:", propertyMessage);
      Linking.openURL(whatsappUrlWithMessage);
    } else if (phoneNumber) {
      // Generate property message using utility function
      const propertyMessage = generatePropertyMessage(car);
      
      // Create WhatsApp URL with message using utility function
      const whatsappUrl = createWhatsAppUrl(phoneNumber, propertyMessage);
      
      console.log("💬 RentalCarCard: Original phone number:", phoneNumber);
      console.log("💬 RentalCarCard: Property message:", propertyMessage);
      console.log("💬 RentalCarCard: WhatsApp URL:", whatsappUrl);
      console.log("💬 RentalCarCard: Opening WhatsApp for seller with property message");
      
      Linking.openURL(whatsappUrl);
    } else {
      console.log("❌ RentalCarCard: No phone number available for seller");
      Alert.alert("Contact Information", "Seller's phone number is not available for WhatsApp");
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
  

  // INSTANT navigation - no waiting
  const handlePress = () => {
    onPress();
  };

  return (
    <TouchableOpacity style={styles.card} onPress={handlePress}>
      {/* Image with Favorite & Share Icons */}
      <View style={{ position: 'relative' }}>
        <Image
          source={{ uri: buildImageUrl(car.image1, API_URL) }}
          style={styles.image}
        />

        {/* Featured Tag - Only show for premium ads, not free ads */}
        {(() => {
          // Check if this is a free ad - NO premium tag for free ads or 525 PKR ads
          const isFreeAd = (car.category || '') === 'free' || 
                          (car.adType || '') === 'free' ||
                          (car.modelType === 'Free') ||
                          (car.packagePrice === 525) ||
                          (car.paymentAmount === 525);
          
          const shouldShowPremium = car.isFeatured && !isFreeAd;
          return shouldShowPremium;
        })() && (
          <View style={styles.featuredTag}>
            <Text style={styles.featuredText}>Premium</Text>
          </View>
        )}
        {car.isManaged && (
          <View style={styles.featuredTag1}>
            <Text style={styles.featuredText1}>Managed By AutoFinder</Text>
          </View>
        )}
        
        {/* BOOSTED Badge - Only show for own property */}
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
  PKR {car?.price ? Number(car.price).toLocaleString('en-US') : '0'} / Day
</Text>


        {/* Car Name */}
        <Text style={styles.carName}>
          {car?.make || 'Car'} {car?.model || ''} {car?.variant || ''} {car?.year || ''}
        </Text>

        {/* Features - Single Line with "..." if needed */}
        <Text style={styles.features}>
          {car?.documents || 'N/A'} | {car?.drivingtype || 'N/A'} | {car?.paymenttype || 'N/A'} | {car?.assembly || 'N/A'} 
        </Text>

        {/* Year & Mileage */}
        <Text style={styles.yearMileage}>
          <Text style={styles.boldText}>Year:</Text> {car?.year || 'N/A'} <Text style={styles.boldText}>Mileage:</Text> {
            car?.kmDriven || car?.mileage || car?.km || car?.kilometer || 'N/A'
          } kms
        </Text>

        {/* Location with Icon */}
        <View style={styles.locationContainer}>
  <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
    <MaterialIcons name="location-on" size={18} color="#CD0100" />
    <Text style={styles.locationText}>{car?.location || 'Location not specified'}</Text>
  </View>
  <Text style={styles.dateText}>{(car?.dateAdded || car?.approvedAt) ? getRelativeTime(car.dateAdded || car.approvedAt) : 'N/A'}</Text>
</View>

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
  carName: {
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

export default RentalCarCard;
