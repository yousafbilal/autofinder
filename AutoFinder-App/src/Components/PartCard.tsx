import { View, Text, StyleSheet, Image, TouchableOpacity, ActivityIndicator } from "react-native"
import { AntDesign, Ionicons, MaterialIcons } from "@expo/vector-icons"
import React, { useEffect, useState } from "react"
import { COLORS } from "../constants/colors"
import { API_URL } from "../../config"
const PartCard = ({ part, userId }) => {
  const [isFavorite, setIsFavorite] = useState(false);
    const [isLoadingFavorite, setIsLoadingFavorite] = useState(false);
  
    // Function to toggle favorite state
    useEffect(() => {
      // Initialize favorite state
      if (part.favoritedBy && userId) {
        setIsFavorite(part.favoritedBy.includes(userId));
      }
    }, [part.favoritedBy, userId]);
  
    const toggleFavorite = async () => {
      setIsLoadingFavorite(true);
      try {
        console.log("Toggling favorite for:", part.id, "User ID:", userId);
    
        const response = await fetch(`${API_URL}/toggle_favorite`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ adId: part.id, userId }),
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
    
  return (
    <View style={styles.container}>
      <View style={styles.imageContainer}>
        <Image source={{ uri: part.image }} style={styles.image} />
        <TouchableOpacity style={styles.favoriteButton} onPress={toggleFavorite} disabled={isLoadingFavorite}>
        {isLoadingFavorite ? (
    <ActivityIndicator size="small" color="#fff" />
  ) : (
    <AntDesign name="heart" size={20} color={isFavorite ? "red" : "#fff"} style={{ opacity: isFavorite ? 1 : 0.3 }} />
  )}
        </TouchableOpacity>
        {part.isNew && (
          <View style={styles.newBadge}>
            <Text style={styles.newText}>New</Text>
          </View>
        )}
      </View>

      <View style={styles.content}>
        <Text style={styles.price}>PKR {part.price.toLocaleString()}</Text>
        <Text style={styles.title}>
          {part.title}
        </Text>
        <View style={styles.footer}>
  <View style={styles.categoryBadge}>
    <Text style={styles.categoryText}>{part.category || 'N/A'}</Text>
  </View>

  <View style={styles.locationContainer}>
    <MaterialIcons name="location-on" size={16} color="#CD0100" />
    <Text style={styles.brandText}>{part.location}</Text>
  </View>
</View>

      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
  backgroundColor: COLORS.white,
  borderRadius: 8,
  overflow: "hidden",
  marginBottom: 16,
  shadowColor: COLORS.black,
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.1,
  shadowRadius: 4,
  elevation: 2,
  width: "100%", // ✅ change from "48%" to full
},

  imageContainer: {
    position: "relative",
    height: 140,
  },
  image: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  favoriteButton: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
  },
  newBadge: {
    position: "absolute",
    top: 8,
    left: 8,
    backgroundColor: "#4CAF50",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  newText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: "600",
  },
  content: {
    padding: 10,
  },
  price: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.primary,
    marginBottom: 4,
  },
  title: {
    fontSize: 14,
    fontWeight: "500",
    color: COLORS.black,
    marginBottom: 6,
    height: 25,
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  star: {
    marginRight: 2,
  },
  reviewCount: {
    fontSize: 12,
    color: COLORS.darkGray,
    marginLeft: 4,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  categoryBadge: {
    backgroundColor: COLORS.lightGray,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  categoryText: {
    fontSize: 10,
    color: COLORS.darkGray,
  },
  brandText: {
    fontSize: 12,
    color: COLORS.darkGray,
  },
  locationContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4, // Use spacing between icon and text (optional, if using React Native 0.71+)
  },
  
})


export default PartCard
