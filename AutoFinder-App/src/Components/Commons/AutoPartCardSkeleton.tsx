import React from "react";
import { View, StyleSheet } from "react-native";
import { COLORS } from "../../constants/colors";

const AutoPartCardSkeleton = () => {
  return (
    <View style={styles.container}>
      {/* Image Placeholder */}
      <View style={styles.imageSkeleton} />

      {/* Content Placeholder */}
      <View style={styles.content}>
        <View style={styles.priceSkeleton} />
        <View style={styles.titleSkeleton} />
        <View style={styles.footer}>
          <View style={styles.categorySkeleton} />
          <View style={styles.locationSkeletonRow}>
            <View style={styles.locationIcon} />
            <View style={styles.locationText} />
          </View>
        </View>
      </View>
    </View>
  );
};

export default AutoPartCardSkeleton;

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.white,
    borderRadius: 8,
    overflow: "hidden",
    elevation: 2,
    width: "100%", // This is controlled by parent wrapper
  },
  imageSkeleton: {
    height: 140,
    backgroundColor: "#e0e0e0",
    width: "100%",
  },
  content: {
    padding: 10,
  },
  priceSkeleton: {
    width: 80,
    height: 16,
    backgroundColor: "#ddd",
    borderRadius: 4,
    marginBottom: 6,
  },
  titleSkeleton: {
    width: "90%",
    height: 14,
    backgroundColor: "#ddd",
    borderRadius: 4,
    marginBottom: 10,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  categorySkeleton: {
    width: 50,
    height: 12,
    backgroundColor: "#ddd",
    borderRadius: 4,
  },
  locationSkeletonRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  locationIcon: {
    width: 16,
    height: 16,
    backgroundColor: "#ccc",
    borderRadius: 8,
  },
  locationText: {
    width: 60,
    height: 12,
    backgroundColor: "#ddd",
    borderRadius: 4,
  },
});
