import React from "react";
import { View, StyleSheet } from "react-native";

const AdCardSkeleton = () => {
  return (
    <View style={styles.card}>
      <View style={styles.imagePlaceholder} />
      <View style={styles.details}>
        <View style={styles.lineShort} />
        <View style={styles.lineMedium} />
        <View style={styles.lineSmall} />
        <View style={styles.lineExtraSmall} />
      </View>
    </View>
  );
};

export default AdCardSkeleton;

const styles = StyleSheet.create({
  card: {
    height: 270,
    width: 200,
    marginHorizontal: 6,
    backgroundColor: "#fff",
    borderRadius: 12,
    overflow: "hidden",
  },
  imagePlaceholder: {
    height: 150,
    width: "100%",
    backgroundColor: "#e0e0e0",
  },
  details: {
    padding: 10,
    gap: 10,
  },
  lineShort: {
    height: 16,
    width: "60%",
    backgroundColor: "#e0e0e0",
    borderRadius: 4,
  },
  lineMedium: {
    height: 18,
    width: "80%",
    backgroundColor: "#e0e0e0",
    borderRadius: 4,
  },
  lineSmall: {
    height: 14,
    width: "50%",
    backgroundColor: "#e0e0e0",
    borderRadius: 4,
  },
  lineExtraSmall: {
    height: 14,
    width: "70%",
    backgroundColor: "#e0e0e0",
    borderRadius: 4,
  },
});
