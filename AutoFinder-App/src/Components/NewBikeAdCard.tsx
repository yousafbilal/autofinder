import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import React from "react";
import { useNavigation } from "@react-navigation/native";
import { Feather, Ionicons } from "@expo/vector-icons";
import { preloadDetailImages } from "../utils/imagePreloader";

type IAdProps = {
  _id:string;
  image: string;
  images: string[];
  model: string;
  price: string;
  city: string;
  year: string;
  traveled: string;
  type: string;
  certified?: boolean;
  featured?: boolean;
  premium?: boolean;
  showPendingTag?: boolean; // Only show pending tag in MyAds screen
  discount?: number;
  cart?: boolean;
  engineType:string;
  bodyType: string;
  dateAdded: number;
  location: string;
  features, string;
  bodyColor: string;
  engineCapacity:string;
  transmission: string;
  description: string;
  assembly:string;
  fuelType:string,
  registrationCity:string,
  category?: string; // Add category prop
  adType?: string; // Add adType prop
  itemData?: any; // Add itemData prop
};

const NewBikeAdCard = ({
   image,
    images,
    _id,
    model,
    price,
    city,
    year,
    registrationCity,
    traveled,
    type,
    certified,
    featured,
    premium,
    showPendingTag = false,
    bodyColor,
    transmission,
    discount,
    bodyType,
    features,
    dateAdded,
    location,
    fuelType,
    assembly,
    favoritedBy,
    description,
    engineCapacity,
    engineType,
    cart,
    category,
    adType,
    itemData,
  }: IAdProps) => {
    const navigation = useNavigation();
    const mileageValue =
      itemData?.kmDriven !== undefined && itemData?.kmDriven !== null
        ? Number(itemData.kmDriven)
        : traveled
        ? Number(traveled)
        : null;
    const mileageText =
      mileageValue && !isNaN(mileageValue)
        ? `${mileageValue.toLocaleString()} km`
        : "Mileage N/A";
    const fuelLabel = fuelType || type || "Fuel N/A";
  
    const handlePress = () => {
      // INSTANT navigation - no waiting
      // Use itemData if available, otherwise construct from props
      const bikeData = itemData ? {
        ...itemData,
        images,
        make: itemData.make || model.split(' ')[0] || '',
        model: itemData.model || model.split(' ').slice(1, -1).join(' ') || '',
        variant: itemData.variant || '',
        year: itemData.year || year,
        price: itemData.price || price,
        city: itemData.location || itemData.adCity || city,
        registrationCity: itemData.registrationCity || registrationCity,
        traveled: itemData.kmDriven?.toString() || traveled,
        type: itemData.fuelType || type,
        favoritedBy: itemData.favoritedBy || favoritedBy,
        certified: certified,
        featured: featured,
        bodyColor: itemData.bodyColor || bodyColor,
        transmission: itemData.transmission || transmission,
        discount: discount,
        bodyType: itemData.bodyType || bodyType,
        dateAdded: itemData.dateAdded || dateAdded,
        location: itemData.location || itemData.adCity || location,
        fuelType: itemData.fuelType || fuelType,
        assembly: itemData.assembly || assembly,
        description: itemData.description || description,
        engineCapacity: itemData.engineCapacity || engineCapacity,
        cart: cart,
        features: itemData.features || features,
        // Add missing fields that NewBikeDetailsScreen expects
        topSpeed: itemData.topSpeed || 'N/A',
        engineType: itemData.engineType || itemData.enginetype || engineType || 'N/A',
        // Premium bike specific fields
        isFeatured: itemData.isFeatured || featured,
        packageName: itemData.packageName || '',
        packagePrice: itemData.packagePrice || 0,
        featuredExpiryDate: itemData.featuredExpiryDate || null,
        paymentStatus: itemData.paymentStatus || 'pending',
        // Add userId for seller data fetching
        userId: itemData.userId,
        bikeId: itemData._id || _id,
        id: itemData._id || _id
      } : {
        _id,
        images,
        make: model.split(' ')[0] || '',
        model: model.split(' ').slice(1, -1).join(' ') || '',
        variant: '',
        year,
        price,
        city,
        registrationCity,
        traveled,
        type,
        favoritedBy,
        certified,
        featured,
        bodyColor,
        transmission,
        discount,
        bodyType,
        dateAdded,
        location,
        fuelType,
        assembly,
        description,
        engineCapacity,
        cart,
        features,
        topSpeed: 'N/A',
        engineType: engineType || 'N/A',
        isFeatured: featured,
        packageName: '',
        packagePrice: 0,
        featuredExpiryDate: null,
        paymentStatus: 'pending',
        // Add bike ID for seller data fetching
        bikeId: _id,
        id: _id
      };

      console.log("🚀 NewBikeAdCard navigating to NewBikeDetailsScreen with data:");
      console.log("   Bike ID:", bikeData._id);
      console.log("   User ID:", bikeData.userId);
      console.log("   Make:", bikeData.make);
      console.log("   Model:", bikeData.model);
      console.log("   Full bikeData:", bikeData);

      navigation.navigate("NewBikeDetailsScreen", {
        carDetails: bikeData
      });
    };

  const [imageError, setImageError] = React.useState(false);

  return (
    <TouchableOpacity style={styles.card} onPress={handlePress}>
      <View style={styles.box}>
        <Image 
          style={[styles.headImage, { backgroundColor: '#f0f0f0' }]} 
          source={imageError || !image ? require('../../assets/Other/nodatafound.png') : { uri: image }}
          onError={() => {
            console.log('❌ Image load error for:', image);
            setImageError(true);
          }}
          defaultSource={require('../../assets/Other/nodatafound.png')}
          resizeMode="cover"
        />
        {/* Premium Tag - Show when premium prop is true OR isFeatured is Approved */}
        {(premium || itemData?.isFeatured === "Approved" || itemData?.isFeatured === true) && (
          <View style={styles.premiumTag}>
            <Text style={styles.premiumText}>Premium</Text>
          </View>
        )}
        
        {/* Pending Premium Tag - Show ONLY in MyAds screen (when showPendingTag is true) */}
        {showPendingTag && !premium && itemData?.isFeatured !== "Approved" && itemData?.isFeatured !== true && 
         (itemData?.isFeatured === "Pending" || (itemData?.paymentStatus === "pending" && itemData?.isPaidAd)) && (
          <View style={styles.pendingTag}>
            <Text style={styles.pendingText}>Pending</Text>
          </View>
        )}
        {!!discount && (
          <View style={styles.leftLabel}>
            <Text style={{ color: "white", paddingVertical: 2 }}>{discount}% off</Text>
          </View>
        )}
        {cart && (
          <View style={styles.rightLabel}>
            <Feather name="shopping-cart" size={16} color="white" />
          </View>
        )}
         {certified && (
          <View style={styles.certifiedTag}>
            <Text style={styles.certifiedText}>New</Text>
          </View>
        )}
      </View>
      <View style={styles.detail}>
        <Text style={styles.titleText}>
          {(() => {
            // Use itemData if available, otherwise fall back to model prop
            if (itemData) {
              let make = (itemData?.make || '').trim();
              let modelValue = (itemData?.model || '').trim();
              let variant = (itemData?.variant || '').trim();
              
              // Remove "Bike" word if it appears (case insensitive)
              make = make.replace(/\bBike\b/gi, '').trim();
              modelValue = modelValue.replace(/\bBike\b/gi, '').trim();
              variant = variant.replace(/\bBike\b/gi, '').trim();
              
              // Remove duplicate make from model (if model starts with make)
              if (make && modelValue) {
                const makeLower = make.toLowerCase();
                const modelLower = modelValue.toLowerCase();
                if (modelLower.startsWith(makeLower)) {
                  modelValue = modelValue.substring(make.length).trim();
                }
                // Also check if model contains make as a separate word
                const modelWords = modelLower.split(/\s+/);
                if (modelWords.includes(makeLower)) {
                  modelValue = modelValue.replace(new RegExp(`\\b${make}\\b`, 'gi'), '').trim();
                }
              }
              
              // Remove duplicate variant from model (if variant is already in model)
              if (variant && modelValue) {
                const variantLower = variant.toLowerCase();
                const modelLower = modelValue.toLowerCase();
                if (modelLower.includes(variantLower)) {
                  variant = '';
                }
              }
              
              // Build the display string
              let displayParts = [];
              if (make) displayParts.push(make);
              if (modelValue) displayParts.push(modelValue);
              if (variant) displayParts.push(variant);
              
              let result = displayParts.join(' ').trim();
              
              // Remove consecutive duplicate words
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
              
              return result || model;
            }
            return model;
          })()}
        </Text>
        <Text style={styles.priceText}>
          PKR {price ? Number(price).toLocaleString('en-US') : '0'}
        </Text>
        <View style={styles.detailItem}>
          <Ionicons name="location-outline" size={12} color="#CD0100" style={styles.locationIcon} />
          <Text style={styles.specs}>
            {location || city || 'Location not specified'}
          </Text>
        </View>
        <Text style={styles.specs} numberOfLines={1} ellipsizeMode="tail">
          {year || 'N/A'} | {mileageText} | {fuelLabel}
        </Text>
      </View>
      
    </TouchableOpacity>
  );
};

export default NewBikeAdCard;


const styles = StyleSheet.create({
  card: {
    height: 220,
    width: 160,
    marginHorizontal: 6,
    backgroundColor: "#fff",
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#f0f0f0",
  },
  headImage: {
    height: 120,
    width: "100%",
    resizeMode: "cover",
    backgroundColor: '#f0f0f0',
  },
  certifiedImage: {
    width: 100,
    objectFit: "contain",
    position: "absolute",
    bottom: -40,
    left: 0,
  },
  box: {
    position: "relative",
  },
  detail: {
    display: "flex",
    padding: 8,
    gap: 2,
    minHeight: 90,
  },
  titleText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#000",
  },
  priceText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#CD0100",
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 12,
    marginBottom: 4,
  },
  locationIcon: {
    marginRight: 4,
  },
  specs: {
    fontSize: 10,
    width: '100%',
    color: "#666",
    lineHeight: 14,
  },
  leftLabel: {
    backgroundColor: "#CD0100",
    position: "absolute",
    left: 0,
    paddingLeft: 10,
    paddingRight: 10,
    paddingVertical: 5,
    borderEndEndRadius: 12,
    zIndex: 2,
  },
  rightLabel: {
    backgroundColor: "#CD0100",
    position: "absolute",
    right: 0,
    paddingRight: 10,
    paddingVertical: 5,
    paddingLeft: 10,
    borderBottomStartRadius:12,
    zIndex: 2,
  },
  certifiedTag: {
    position: "absolute",
    top: 0,  // Adjust the distance from the top
    left: 0, // Adjust the distance from the left
    backgroundColor: "#CD0100", // Tag background color
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderTopRightRadius: 0,
    borderBottomRightRadius: 10,
    zIndex: 2,
  },
  certifiedText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
  premiumTag: {
    position: "absolute",
    top: 0,
    left: 0,
    backgroundColor: "#FFDF00", // Yellow color like cars
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderTopRightRadius: 0,
    borderBottomRightRadius: 10,
    zIndex: 2,
  },
  premiumText: {
    color: "#000",
    fontSize: 12,
    fontWeight: "bold",
  },
  pendingTag: {
    position: "absolute",
    top: 0,
    left: 0,
    backgroundColor: "#FFA500",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderBottomRightRadius: 10,
    zIndex: 2,
  },
  pendingText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
});
