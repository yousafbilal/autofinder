import React, { useEffect, useState } from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet, Share, ActivityIndicator } from "react-native";
import { MaterialIcons, Feather, AntDesign } from "@expo/vector-icons"; // Icons
import { API_URL } from "../../../config";
import { safeGetFirstImageSource, safeGetAllImagesWithApiUrl } from "../../utils/safeImageUtils";
import { preloadDetailImages } from "../../utils/imagePreloader";

const CarCard = ({ car, onPress, userId  }) => {
  const [isFavorite, setIsFavorite] = useState(false);
  const [isLoadingFavorite, setIsLoadingFavorite] = useState(false);
  
  const getRelativeTime = (dateString: any) => {
    try {
      // Handle null/undefined
      if (!dateString) {
        return "Just now";
      }
      
      // If it's already a Date object, convert to ISO string first
      let dateValue = dateString;
      if (dateString instanceof Date) {
        dateValue = dateString.toISOString();
      }
      
      // If it's a number (timestamp), check if it's reasonable
      if (typeof dateValue === 'number') {
        // Check if it's in milliseconds or seconds
        // If less than year 2000 in milliseconds (946684800000), it might be in seconds
        if (dateValue < 946684800000 && dateValue > 946684800) {
          // Convert seconds to milliseconds
          dateValue = dateValue * 1000;
        }
        // If still unreasonable, return Just now
        if (dateValue > 9999999999999 || dateValue < 0) {
          console.warn('⚠️ Date timestamp out of range:', dateValue);
          return "Just now";
        }
      }
      
      // Try to parse the date
      const now = new Date();
      const date = new Date(dateValue);
      
      // Check if date is valid
      if (isNaN(date.getTime()) || date.getTime() === 0) {
        return "Just now";
      }
      
      // Check if date is in reasonable range (not too far in past or future)
      const yearsDiff = Math.abs(now.getFullYear() - date.getFullYear());
      if (yearsDiff > 100) {
        console.warn('⚠️ Date too far in past/future:', date);
        return "Just now";
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
    
      if (seconds < 60) return "Just now";
      if (minutes < 60) return `${minutes} min${minutes > 1 ? "s" : ""} ago`;
      if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
      if (days < 7) return `${days} day${days > 1 ? "s" : ""} ago`;
      if (weeks < 4) return `${weeks} week${weeks > 1 ? "s" : ""} ago`;
      return `${months} month${months > 1 ? "s" : ""} ago`;
    } catch (error) {
      console.error('❌ Error calculating relative time:', error, 'Input:', dateString);
      return "Just now";
    }
  };
  

  // Function to share car details
  const shareCar = async () => {
    try {
      await Share.share({
        message: `Check out this car: ${car.make} ${car.model} ${car.varient} ${car.year} for Rs. ${car.price || '0'} in ${car.location}!`,
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
      {/* Image with Favorite & Share Icons */}
      <View>
        <Image
          source={safeGetFirstImageSource(car, API_URL)}
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
      </View>

      {/* Car Info Container */}
      <View style={styles.infoContainer}>
        {/* Price in Red */}
        <Text style={styles.price}>
  PKR {car.price ? Number(car.price).toLocaleString('en-US') : '0'}
</Text>


        {/* Car Name */}
        <Text style={styles.carName}>
          {car?.make || 'Car'} {car?.model || ''} {car?.variant || ''} {car?.year || ''}
        </Text>

        {/* Features - Single Line with "..." if needed */}
        <Text style={styles.features}>
          {car?.features && Array.isArray(car.features)
            ? car.features.slice(0, 5).map((feature) => feature.replace(/["\\[\]]/g, '')).join(" || ")
            : "No Features Available"}
        </Text>

        {/* Year, Mileage & Fuel Type */}
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
          })()}{(() => {
            // Check multiple possible field names for fuel type
            // Try all possible variations
            const fuelType = car?.fuelType || 
                            car?.fuel || 
                            car?.fueltype || 
                            car?.fuel_type ||
                            car?.assembly || 
                            '';
            
            // Debug: Log first few cars to see what fields are available
            if (car?._id) {
              const carKey = car._id.toString();
              if (!global._loggedCars || !global._loggedCars[carKey]) {
                if (!global._loggedCars) global._loggedCars = {};
                global._loggedCars[carKey] = true;
                
                // Find all keys that might contain fuel info
                const allKeys = Object.keys(car || {});
                const fuelRelatedKeys = allKeys.filter(key => 
                  key.toLowerCase().includes('fuel') || 
                  key.toLowerCase().includes('assembly') ||
                  key.toLowerCase().includes('engine')
                );
                
                console.log('🔍 CarCard - Fuel type check:', {
                  carId: car._id,
                  make: car?.make,
                  model: car?.model,
                  fuelType: car?.fuelType,
                  fuel: car?.fuel,
                  fueltype: car?.fueltype,
                  fuel_type: car?.fuel_type,
                  assembly: car?.assembly,
                  fuelRelatedKeys: fuelRelatedKeys,
                  allCarKeys: allKeys.slice(0, 20) // First 20 keys
                });
              }
            }
            
            return fuelType && fuelType.trim() !== '' && fuelType !== 'N/A' ? ` • ${fuelType}` : '';
          })()}
        </Text>

        {/* Location with Icon */}
         <View style={styles.locationContainer}>
         <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
           <MaterialIcons name="location-on" size={18} color="#CD0100" />
           <Text style={styles.locationText}>{car?.location || 'Location not specified'}</Text>
         </View>
         <Text style={styles.dateText}>{(() => {
           const dateValue = car?.dateAdded || car?.approvedAt;
           console.log('🚨 FINAL DATE CHECK:', {
             carId: car?._id,
             make: car?.make,
             model: car?.model,
             dateAdded: car?.dateAdded,
             dateAddedType: typeof car?.dateAdded,
             approvedAt: car?.approvedAt,
             approvedAtType: typeof car?.approvedAt,
             finalValue: dateValue,
             finalType: typeof dateValue,
             allCarKeys: Object.keys(car || {}).filter(k => k.toLowerCase().includes('date') || k.toLowerCase().includes('time') || k.toLowerCase().includes('added') || k.toLowerCase().includes('created') || k.toLowerCase().includes('updated'))
           });
           return dateValue ? getRelativeTime(dateValue) : 'N/A';
         })()}</Text>
       </View>
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
});

export default CarCard;
