import { Image, StyleSheet, Text, TouchableOpacity, View, ActivityIndicator } from "react-native";
import React, { useState } from "react";
import { useNavigation } from "@react-navigation/native";
import { Feather, Ionicons } from "@expo/vector-icons";
import { API_URL } from "../../config";
import { safeGetAllImagesWithApiUrl } from "../utils/safeImageUtils";

// Placeholder image for when no image is available
const PLACEHOLDER_IMAGE = 'https://via.placeholder.com/300x200/f0f0f0/666666?text=No+Image';

type IAdProps = {
  _id:string;
  image: string;
  model: string;
  price: string;
  images: string[];
  city: string;
  year: string;
  traveled: string;
  type: string;
  certified?: boolean;
  featured?: boolean;
  discount?: number;
  cart?: boolean;
  bodyType: string;
  dateAdded: number;
  location: string;
  features: string;
  bodyColor: string;
  engineCapacity:string;
  transmission: string;
  description: string;
  assembly:string;
  favoritedBy: string;
  isManaged:boolean;
  fuelType:string,
  registrationCity:string,
  category?: string; // Add category prop
  adType?: string; // Add adType prop
  modelType?: string; // Add modelType prop
  packagePrice?: number; // Add packagePrice prop
  paymentAmount?: number; // Add paymentAmount prop
  userId?: string;
  sellerId?: string; // Add sellerId prop
  postedBy?: string; // Add postedBy prop
  itemData?: any; // Add itemData prop for complete ad data
};

const AdCard = ({
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
  bodyColor,
  favoritedBy,
  transmission,
  discount,
  bodyType,
  features,
  dateAdded,
  location,
  fuelType,
  assembly,
  description,
  engineCapacity,
  cart,
  isManaged,
  category,
  adType,
  modelType,
  packagePrice,
  paymentAmount,
  userId,
  sellerId,
  postedBy,
  itemData,
}: IAdProps) => {
  const navigation = useNavigation<any>();
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  
  // Get valid image URL
  const imageUrl = image && image.length > 0 ? image : PLACEHOLDER_IMAGE;

  const handlePress = () => {
    // Safely convert _id to string to prevent [object Object] errors
    let safeId: string;
    try {
      if (typeof _id === 'string') {
        safeId = _id;
      } else if (typeof _id === 'object' && _id) {
        if (_id.toString && typeof _id.toString === 'function') {
          const str = String(_id.toString());
          safeId = str !== '[object Object]' ? str : (_id._id ? String(_id._id) : String(_id));
        } else {
          safeId = _id._id ? String(_id._id) : String(_id);
        }
      } else {
        safeId = String(_id);
      }
    } catch (e) {
      console.error('Error converting _id to string:', e);
      safeId = String(_id || '');
    }

    // Use itemData if available (contains full ad data), otherwise use individual props
    const carData = itemData ? {
      ...itemData,
      _id: safeId, // Ensure _id is always a string
      id: safeId,
      carId: safeId,
      image: image || itemData.image1,
      images: images || safeGetAllImagesWithApiUrl(itemData, API_URL),
      model: model || `${itemData.make} ${itemData.model} ${itemData.year}`,
      userId: userId || itemData.userId || sellerId || itemData.sellerId || itemData.postedBy,
      sellerId: sellerId || userId || itemData.userId || itemData.sellerId || itemData.postedBy,
      postedBy: postedBy || userId || itemData.userId || itemData.sellerId || itemData.postedBy,
    } : {
      _id: safeId,
      id: safeId,
      carId: safeId,
      image,
      images,
      model,
      price,
      city,
      year,
      registrationCity,
      traveled,
      type,
      certified,
      featured,
      bodyColor,
      transmission,
      discount,
      bodyType,
      dateAdded,
      location,
      favoritedBy,
      fuelType,
      assembly,
      description,
      engineCapacity,
      cart,
      isManaged,
      features,
      userId,
      sellerId: sellerId || userId,
      postedBy: postedBy || userId,
      category,
      adType
    };

    // INSTANT navigation - don't wait for anything
    navigation.navigate("CarDetails", {
      carDetails: carData
    }); 
  };

  return (
    <TouchableOpacity style={styles.card} onPress={handlePress}>
      <View style={styles.box}>
        {/* Only show premium tag for actual premium ads, not free ads */}
        {(() => {
          // Check if this is a free ad - NO premium tag for free ads or 525 PKR ads
          const isFreeAd = (category || '') === 'free' || 
                          (adType || '') === 'free' ||
                          (modelType === 'Free') ||
                          (packagePrice === 525) ||
                          (paymentAmount === 525);
          
          const shouldShowPremium = featured && !isFreeAd;
          return shouldShowPremium;
        })() && (
          <View style={styles.leftLabel1}>
            <Text style={styles.certifiedText1}> Premium </Text>
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
        <Image 
          style={styles.headImage} 
          source={{ uri: imageError ? PLACEHOLDER_IMAGE : imageUrl }} 
          onLoadStart={() => setImageLoading(true)}
          onLoadEnd={() => setImageLoading(false)}
          onError={() => {
            setImageError(true);
            setImageLoading(false);
          }}
          resizeMode="cover"
        />
        {imageLoading && (
          <View style={styles.imageLoadingContainer}>
            <ActivityIndicator size="small" color="#CD0100" />
          </View>
        )}
        {certified && (
          <View style={styles.certifiedTag}>
            <Text style={styles.certifiedText}>Managed</Text>
          </View>
        )}
      </View>
      
      <View style={styles.detail}>
        <Text style={{ fontSize: 11, fontWeight: "600" }}>
          {(() => {
            // Use itemData if available, otherwise fall back to model prop
            if (itemData) {
              let make = (itemData?.make || '').trim();
              let modelValue = (itemData?.model || '').trim();
              let variant = (itemData?.variant || '').trim();
              
              // Remove "Car" word if it appears (case insensitive)
              make = make.replace(/\bCar\b/gi, '').trim();
              modelValue = modelValue.replace(/\bCar\b/gi, '').trim();
              variant = variant.replace(/\bCar\b/gi, '').trim();
              
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
        <Text style={{ fontSize: 12, fontWeight: "700", color: "#CD0100" }}>PKR {Number(price).toLocaleString('en-US')}</Text>
        <View style={styles.detailItem}>
          <Ionicons name="location-outline" size={12} color={'#CD0100'}/>
          <Text style={styles.specs}>{city}</Text>
        </View>
        {!cart && (
          <Text style={styles.specs}>
            {year} | {traveled} km | {type}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

export default AdCard;


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
    backgroundColor: '#f0f0f0', // Background while loading
  },
  imageLoadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
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
  },
  specs: {
    fontSize: 10,
    color: "#666",
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
  leftLabel1: {
    backgroundColor: "#FFDF00",
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
  certifiedText1: {
    color: "black",
    fontSize: 12,
    fontWeight: "bold",
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 12,
    marginBottom: 4,
  },
  
});