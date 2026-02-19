import React from "react";
import { View, StyleSheet } from "react-native";

const BlogSkeleton = () => {
  return (
    <View style={{ backgroundColor: "#000", marginVertical: 24 }}>
      <View style={styles.header}>
        <View style={styles.skeletonHeading} />
        <View style={styles.skeletonAnchor} />
      </View>

      {[...Array(4)].map((_, index) => (
        <View key={index} style={styles.listItem}>
          <View style={styles.skeletonImage} />
          <View style={styles.skeletonContent}>
            <View style={styles.skeletonTitle} />
            <View style={styles.skeletonDate} />
            <View style={styles.skeletonCategory} />
          </View>
        </View>
      ))}
    </View>
  );
};

export default BlogSkeleton;

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    marginHorizontal: 12,
    marginVertical: 24,
  },
  skeletonHeading: {
    width: 120,
    height: 20,
    backgroundColor: "#222",
    borderRadius: 4,
  },
  skeletonAnchor: {
    width: 60,
    height: 16,
    backgroundColor: "#222",
    borderRadius: 4,
  },
  listItem: {
    flexDirection: "row",
    gap: 6,
    marginBottom: 24,
    marginHorizontal: 12,
  },
  skeletonImage: {
    width: "40%",
    height: 80,
    backgroundColor: "#222",
    borderRadius: 4,
  },
  skeletonContent: {
    width: "60%",
    paddingLeft: 6,
    justifyContent: "space-between",
  },
  skeletonTitle: {
    height: 14,
    backgroundColor: "#222",
    borderRadius: 4,
    marginBottom: 6,
  },
  skeletonDate: {
    height: 12,
    width: 80,
    backgroundColor: "#222",
    borderRadius: 4,
  },
  skeletonCategory: {
    height: 18,
    width: 60,
    backgroundColor: "#222",
    borderRadius: 12,
    marginTop: 6,
  },
});
