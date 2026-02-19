import React from "react";
import { View, StyleSheet } from "react-native";

const VideoSkeleton = () => {
  return (
    <View style={{ marginHorizontal: 12 }}>
      {/* Large Thumbnail Skeleton */}
      <View style={styles.thumbnailSkeleton} />

      {/* Small List Skeletons */}
      {[...Array(3)].map((_, index) => (
        <View key={index} style={[styles.listItem, styles.listSkeleton]}>
          <View style={styles.imageSkeleton} />
          <View style={styles.textContainer}>
            <View style={styles.titleSkeleton} />
            <View style={styles.dateSkeleton} />
            <View style={styles.categorySkeleton} />
          </View>
        </View>
      ))}
    </View>
  );
};

export default VideoSkeleton;

const styles = StyleSheet.create({
  thumbnailSkeleton: {
    width: "100%",
    height: 200,
    backgroundColor: "#e0e0e0",
    borderRadius: 12,
    marginBottom: 12,
  },
  listItem: {
    flexDirection: "row",
    gap: 6,
    marginBottom: 12,
  },
  listSkeleton: {
    alignItems: "center",
  },
  imageSkeleton: {
    width: "40%",
    height: 80,
    borderRadius: 6,
    backgroundColor: "#e0e0e0",
  },
  textContainer: {
    width: "55%",
  },
  titleSkeleton: {
    height: 14,
    width: "90%",
    backgroundColor: "#e0e0e0",
    borderRadius: 4,
    marginBottom: 6,
  },
  dateSkeleton: {
    height: 12,
    width: "60%",
    backgroundColor: "#e0e0e0",
    borderRadius: 4,
    marginBottom: 6,
  },
  categorySkeleton: {
    height: 18,
    width: "40%",
    backgroundColor: "#e0e0e0",
    borderRadius: 10,
  },
});
