import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import React from "react";
import { useNavigation } from "@react-navigation/native";
import { Feather, Ionicons } from "@expo/vector-icons";
import { preloadDetailImages } from "../utils/imagePreloader";

type IAdProps = {
  _id:string;
  image: string;
  model: string;
  price: string;
  images: string[];
  city: string;
  year: string;
  traveled?: string;
  kmDriven?: string | number;
  mileage?: string | number;
  type: string;
  itemData?: any;
  certified?: boolean;
  featured?: boolean;
  pending?: boolean;
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
  expiryDate?: string;
  expiryStatus?: string;
  isPaidAd?: boolean;
  // userId removed from home cards
};

const NewCarAdCard = ({
   image,
    images,
    _id,
    model,
    price,
    city,
    year,
    registrationCity,
    traveled,
    kmDriven,
    mileage,
    itemData,
    type,
    certified,
    featured,
    pending,
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
    expiryDate,
    expiryStatus,
    isPaidAd,
  }: IAdProps) => {
    const navigation = useNavigation();
  
    const handlePress = () => {
      // INSTANT navigation
      navigation.navigate("NewCarDetails", {
        carDetails: {
          _id,
          images,
          model,
          price,
          city,
          year,
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
          // Add additional ID fields for seller data fetching
          carId: _id,
          id: _id
        }
      });
    };

  return (
    <TouchableOpacity style={styles.card} onPress={handlePress}>
      <View style={styles.box}>
        {/* Premium Tag for approved */}
        {featured && (
          <View style={styles.premiumTag}>
            <Text style={styles.premiumText}>Premium</Text>
          </View>
        )}
        {/* Pending Tag for pending premium - Only show in MyAds screen */}
        {showPendingTag && pending && !featured && (
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
        <Image 
          style={[styles.headImage, { backgroundColor: '#f0f0f0' }]} 
          source={image ? { uri: image } : require('../../assets/Other/nodatafound.png')} 
          defaultSource={require('../../assets/Other/nodatafound.png')}
          resizeMode="cover"
        />
         {certified && (
          <View style={styles.certifiedTag}>
            <Text style={styles.certifiedText}>New</Text>
          </View>
        )}

      </View>
      <View style={styles.detail}>
        <Text style={styles.titleText} numberOfLines={1} ellipsizeMode="tail">
          {model}
        </Text>
        <Text style={styles.priceText}>PKR {Number(price).toLocaleString('en-US')}</Text>
        {!cart && (
          <Text style={styles.specs} numberOfLines={1} ellipsizeMode="tail">
            {year || "N/A"} | {(() => {
              const mileageValue = traveled || kmDriven || mileage || 
                                  (itemData as any)?.kmDriven || 
                                  (itemData as any)?.mileage || 
                                  (itemData as any)?.km || 
                                  (itemData as any)?.kilometer;
              return mileageValue ? `${mileageValue} km` : "Mileage N/A";
            })()} | {fuelType || type || "Fuel N/A"}
          </Text>
        )}
      </View>
      
    </TouchableOpacity>
  );
};

export default NewCarAdCard;


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
    fontSize: 11,
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
    marginBottom: 2,
  },
  locationIcon: {
    marginRight: 4,
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
  premiumTag: {
    position: "absolute",
    top: 0,
    left: 0,
    backgroundColor: "#FFDF00",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderBottomRightRadius: 10,
    zIndex: 2,
  },
  premiumText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#333",
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
    fontSize: 12,
    fontWeight: "bold",
    color: "#fff",
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
});
