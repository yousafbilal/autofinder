import React, { useEffect, useState } from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet, Share, ActivityIndicator } from "react-native";
import { MaterialIcons, Feather, AntDesign, FontAwesome5 } from "@expo/vector-icons"; // Icons
import { API_URL } from "../../config";
import { buildImageUrl, buildImageUrls } from "../utils/safeImageUtils";
import { preloadDetailImages } from "../utils/imagePreloader";

const CarCard = ({ car, onPress, userId }) => {
const [isFavorite, setIsFavorite] = useState(false);
  const [isLoadingFavorite, setIsLoadingFavorite] = useState(false);

  // Function to toggle favorite state
  useEffect(() => {
    // Initialize favorite state
    if (car.favoritedBy && userId) {
      setIsFavorite(car.favoritedBy.includes(userId));
    }
  }, [car.favoritedBy, userId]);


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
  const getRelativeTime = (dateString: any) => {
    try {
      if (!dateString) return "Just now";
      
      const now = new Date();
      const date = new Date(dateString);
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        return "Just now";
      }
      
      const diffMs = now.getTime() - date.getTime();
      
      // If diff is negative, return "Just now"
      if (diffMs < 0) {
        return "Just now";
      }
      
      const seconds = Math.floor(diffMs / 1000);
      const minutes = Math.floor(diffMs / (1000 * 60));
      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      const weeks = Math.floor(days / 7);
      const months = Math.floor(days / 30);
    
      if (seconds < 60) return "Just now";
      if (minutes < 60) return `${minutes} min${minutes > 1 ? "s" : ""} ago`;
      if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
      if (days < 7) return `${days} day${days > 1 ? "s" : ""} ago`;
      if (weeks < 4) return `${weeks} week${weeks > 1 ? "s" : ""} ago`;
      return `${months} month${months > 1 ? "s" : ""} ago`;
    } catch (error) {
      console.error('Error calculating relative time:', error);
      return "Just now";
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

  // INSTANT navigation - no waiting
  const handlePress = () => {
    onPress();
  };

  return (
    <TouchableOpacity style={styles.card} onPress={handlePress}>
      {/* Image Container */}
      <View style={styles.imageContainer}>
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
          
          const shouldShowPremium = car.featured && !isFreeAd;
          return shouldShowPremium;
        })() && (
          <View style={styles.featuredTag}>
            <Text style={styles.featuredText}>Premium</Text>
          </View>
        )}
        {car.isManaged && (
          <View style={styles.featuredTag1}>
            <Text style={styles.featuredText1}>Managed</Text>
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
          PKR {car?.price ? Number(car.price).toLocaleString('en-US') : '0'}
        </Text>

        {/* Car Name */}
        <Text style={styles.carName}>
          {car?.make || 'Car'} • {car?.model || ''} • {car?.variant || ''}
        </Text>

        {/* Year & Mileage */}
        <Text style={styles.yearMileage}>
          {car?.year || 'N/A'} • {(() => {
            const mileage = car?.kmDriven || 
                            car?.mileage || 
                            car?.km || 
                            car?.kilometer ||
                            car?.traveled ||
                            car?.distance ||
                            car?.odometer;
            
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
        
        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.callButton}>
            <MaterialIcons name="call" size={14} color="#FF6B6B" />
            <Text style={styles.buttonText}>Call</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.whatsappButton}>
            <FontAwesome5 name="whatsapp" size={12} color="#25D366" />
            <Text style={styles.buttonText}>WhatsApp</Text>
          </TouchableOpacity>
        </View>
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
  yearMileage: {
    fontSize: 14,
    color: "#666",
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
  },
  buttonText: {
    fontSize: 12,
    color: "#333",
    marginLeft: 4,
  },
});

export default CarCard;
