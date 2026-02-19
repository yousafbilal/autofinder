import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import React from "react";
import { FontAwesome, Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

type IAdProps = {
    _id:string;
  images: string[];
  model: string;
  price: string;
  discount?: number;
  cart?: boolean;
  image: string;
  location?: string;
  transmission?: string;
};

const AutoStoreCard = ({ images,image,
     _id,
    model, price, discount, cart, location, transmission }: IAdProps) => {
    const navigation = useNavigation<any>();

  const handlePress = () => {
    // Safely convert _id to string to prevent [object Object] errors
    let safeId: string;
    try {
      if (typeof _id === 'string') {
        safeId = _id;
      } else if (typeof _id === 'number') {
        safeId = String(_id);
      } else if (typeof _id === 'object' && _id) {
        // Check if object is empty
        const keys = Object.keys(_id);
        if (keys.length === 0) {
          // Empty object - don't navigate
          return;
        }
        
        // Try MongoDB ObjectId toString() first (returns actual ID string)
        if (_id.toString && typeof _id.toString === 'function') {
          const str = _id.toString(); // Call toString() directly
          // Check if toString() returned a valid ID (not [object Object])
          if (str && str !== '[object Object]' && str.length > 10) {
            safeId = str;
          } else {
            // Try nested _id or $oid
            if (_id._id) {
              safeId = typeof _id._id === 'string' ? _id._id : String(_id._id);
            } else if (_id.$oid) {
              safeId = String(_id.$oid);
            } else if (_id.id) {
              safeId = typeof _id.id === 'string' ? _id.id : String(_id.id);
            } else {
              // Empty or invalid object - don't navigate
              return;
            }
          }
        } else {
          // No toString method, try nested properties
          if (_id._id) {
            safeId = typeof _id._id === 'string' ? _id._id : String(_id._id);
          } else if (_id.$oid) {
            safeId = String(_id.$oid);
          } else if (_id.id) {
            safeId = typeof _id.id === 'string' ? _id.id : String(_id.id);
          } else {
            // Empty or invalid object - don't navigate
            return;
          }
        }
      } else {
        safeId = String(_id);
      }
      
      // Validate ID before navigation
      if (!safeId || safeId === 'undefined' || safeId === 'null' || safeId === '[object Object]' || safeId.trim() === '') {
        // Invalid ID - don't navigate
        return;
      }
    } catch (e) {
      // Error converting - don't navigate
      return;
    }

    console.log("Navigating to AutoPartsDetailsScreen with ID:", safeId);
    console.log("📸 AutoStoreCard: Images array:", images);
    console.log("📸 AutoStoreCard: Image count:", images?.length || 0);
    
    // Pass all available data including individual image fields
    navigation.navigate("AutoPartsDetailsScreen", {
      part: {
        _id: safeId,
        id: safeId,
        images, // Pass images array
        image1: images?.[0] || image, // Also pass individual fields for fallback
        image2: images?.[1],
        image3: images?.[2],
        image4: images?.[3],
        image5: images?.[4],
        image6: images?.[5],
        image7: images?.[6],
        image8: images?.[7],
        model,
        price,
        title: model, // Some screens expect 'title' field
      }
    });
  };
  return (
    <TouchableOpacity style={styles.card} onPress={handlePress}>
      <View style={styles.box}>
        {!!discount && (
          <View style={styles.leftLabel}>
            <Text style={{ color: "white", paddingVertical: 2, fontSize: 12, fontWeight: 'bold' }}>
              {discount}% off
            </Text>
          </View>
        )}
        {cart && (
          <View style={styles.rightLabel}>
            <FontAwesome name="shopping-cart" size={16} color="white" />
          </View>
        )}
        <Image style={styles.headImage} source={{ uri: image }} />
      </View>
      <View style={styles.detail}>
        <Text numberOfLines={1} ellipsizeMode="tail" style={{ fontSize: 14, fontWeight: "500" }}>
          {model}
        </Text>
        <View style={styles.priceRow}>
          <Text style={styles.priceText}>PKR {typeof price === 'string' ? price : Number(price).toLocaleString()}</Text>
          <Text style={styles.strikePriceText}>
            PKR {Math.round(Number(typeof price === 'string' ? price.replace(/,/g, "") : price) * 1.05).toLocaleString()}
          </Text>
        </View>
        <View style={styles.detailItem}>
          <Ionicons name="location-outline" size={12} color="#CD0100" style={styles.locationIcon} />
          <Text style={styles.specs}>{location || "Location not specified"}</Text>
        </View>
        {transmission ? (
          <Text style={styles.specs}>
            {transmission}
          </Text>
        ) : null}
      </View>
    </TouchableOpacity>
  );
};

export default AutoStoreCard;

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
    objectFit: "cover",
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
  specs: {
    fontSize: 10,
    color: "#666",
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 8,
  },
  priceText: {
    fontSize: 15,
    fontWeight: "600",
    color:"#CD0100",
  },
  strikePriceText: {
    fontWeight: "400",
    fontSize: 11,
    textDecorationLine: "line-through",
    color: "#666",
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 2,
  },
  locationIcon: {
    marginRight: 4,
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
});
