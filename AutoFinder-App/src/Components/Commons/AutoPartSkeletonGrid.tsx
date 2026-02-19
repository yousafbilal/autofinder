import React from "react";
import { View, StyleSheet } from "react-native";
import AutoPartCardSkeleton from "./AutoPartCardSkeleton"; // Adjust path if needed

const AutoPartSkeletonGrid = () => {
  return (
    <View style={styles.gridContainer}>
      {Array.from({ length: 6 }).map((_, index) => (
        <View key={index} style={styles.cardWrapper}>
          <AutoPartCardSkeleton />
        </View>
      ))}
    </View>
  );
};

export default AutoPartSkeletonGrid;

const styles = StyleSheet.create({
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingHorizontal: 10,
  },
  cardWrapper: {
    width: "48%", // Two items per row
    marginBottom: 16,
  },
});
