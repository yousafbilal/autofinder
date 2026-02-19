import { View, Image, StyleSheet, Text, ImageSourcePropType, TouchableOpacity } from "react-native";
import React from "react";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../constants/colors";
import { LinearGradient } from "expo-linear-gradient";

interface OfferCardProps {
  image: ImageSourcePropType;
  title: string;
  onPress: () => void;
  // Optional image scale factor to fine-tune visual size without changing card size
  imageScale?: number;
  // Optional container scale to slightly grow/shrink the circle for specific cards
  containerScale?: number;
}

const OfferCard: React.FC<OfferCardProps> = ({
  image,
  title,
  onPress,
  imageScale = 1,
  containerScale = 1,
}) => {
  // Simple gradient colors for services cards
  const gradientColors = ['#ffffff', '#f5f7ff'];
  
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientBackground}
      >
        <View style={styles.cardContent}>
          {/* Image Container */}
          <View
            style={[
              styles.imageContainer,
              containerScale !== 1 && { transform: [{ scale: containerScale }] },
            ]}
          >
            <Image source={image} style={[styles.image, imageScale !== 1 && { transform: [{ scale: imageScale }] }]} />
          </View>
          
          {/* Content */}
          <View style={styles.textContainer}>
            <Text style={styles.brandText}>Autofinder</Text>
            <Text style={styles.titleText}>{title}</Text>
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
};

export default OfferCard;

const styles = StyleSheet.create({
  card: {
    width: 180,
    borderRadius: 16,
    marginRight: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    borderWidth: 1,
    borderColor: "#f0f0f0",
    overflow: 'hidden',
  },
  gradientBackground: {
    flex: 1,
    borderRadius: 16,
  },
  cardContent: {
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 180,
  },
  imageContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#ffffff",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
    padding: 12,
    overflow: "hidden", // circular clipping
    borderWidth: 2,
    borderColor: "#ffffff",
  },
  image: {
    width: "100%",
    height: "100%",
    resizeMode: "contain",
  },
  textContainer: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
  },
  brandText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  titleText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#333",
    textAlign: "center",
    lineHeight: 18,
  },
  arrowContainer: {
    position: "absolute",
    top: 12,
    right: 12,
    padding: 4,
  },
});
