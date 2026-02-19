import React from "react";
import { View, StyleSheet, FlatList } from "react-native";

const SkeletonCard = () => (
  <View style={styles.card}>
    {/* Image Placeholder */}
    <View style={styles.image} />

    {/* Featured Tag Placeholder */}
    <View style={styles.featuredTag} />
    <View style={styles.featuredTag1} />

    {/* Icon Container Placeholder */}
    <View style={styles.iconContainer}>
      <View style={styles.icon} />
      <View style={styles.icon} />
    </View>

    {/* Info Container */}
    <View style={styles.infoContainer}>
      <View style={styles.price} />
      <View style={styles.carName} />
      <View style={styles.yearMileage} />
    </View>
  </View>
);

const CarCardSkeleton = ({ count = 3 }) => {
  return (
    <FlatList
      data={Array.from({ length: count })}
      keyExtractor={(_, index) => index.toString()}
      renderItem={() => <SkeletonCard />}
      contentContainerStyle={{ paddingBottom: 20 }}
    />
  );
};

export default CarCardSkeleton;

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 8,
    overflow: "hidden",
    marginBottom: 16,
    elevation: 2,
    paddingBottom: 10,
    position: "relative",
  },
  image: {
    width: "100%",
    height: 180,
    backgroundColor: "#e0e0e0",
  },
  featuredTag: {
    position: "absolute",
    top: 0,
    left: 0,
    width: 90,
    height: 25,
    backgroundColor: "#f0f0f0",
    borderBottomRightRadius: 10,
  },
  featuredTag1: {
    position: "absolute",
    top: 28,
    left: 0,
    width: 160,
    height: 25,
    backgroundColor: "#f0f0f0",
    borderBottomRightRadius: 10,
  },
  iconContainer: {
    position: "absolute",
    top: 10,
    right: 10,
    flexDirection: "row",
    gap: 10,
  },
  icon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#ccc",
  },
  infoContainer: {
    paddingHorizontal: 10,
    paddingTop: 10,
  },
  price: {
    width: 100,
    height: 18,
    backgroundColor: "#ddd",
    borderRadius: 4,
    marginBottom: 6,
  },
  carName: {
    width: "90%",
    height: 14,
    backgroundColor: "#ddd",
    borderRadius: 4,
    marginBottom: 6,
  },
  yearMileage: {
    width: "80%",
    height: 12,
    backgroundColor: "#ddd",
    borderRadius: 4,
  },
});
