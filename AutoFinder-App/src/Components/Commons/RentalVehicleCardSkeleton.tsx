import React from "react";
import { View, StyleSheet } from "react-native";

const RentalVehicleCardSkeleton = () => {
  return (
    <View style={styles.container}>
      <View style={styles.imageContainer}>
        <View style={styles.imageSkeleton} />
      </View>
      <View style={styles.contentContainer}>
        <View style={styles.titleSkeleton} />
        <View style={styles.subtitleSkeleton} />
        <View style={styles.priceSkeleton} />
        <View style={styles.detailsContainer}>
          <View style={styles.detailSkeleton} />
          <View style={styles.detailSkeleton} />
          <View style={styles.detailSkeleton} />
        </View>
        <View style={styles.tenureContainer}>
          <View style={styles.tenureSkeleton} />
          <View style={styles.driveModeSkeleton} />
        </View>
        <View style={styles.footerContainer}>
          <View style={styles.locationSkeleton} />
          <View style={styles.yearSkeleton} />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fff",
    marginHorizontal: 15,
    marginVertical: 8,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    overflow: "hidden",
  },
  imageContainer: {
    height: 200,
    backgroundColor: "#f0f0f0",
  },
  imageSkeleton: {
    flex: 1,
    backgroundColor: "#e0e0e0",
  },
  contentContainer: {
    padding: 15,
  },
  titleSkeleton: {
    height: 20,
    backgroundColor: "#e0e0e0",
    borderRadius: 4,
    marginBottom: 8,
    width: "80%",
  },
  subtitleSkeleton: {
    height: 16,
    backgroundColor: "#e0e0e0",
    borderRadius: 4,
    marginBottom: 8,
    width: "60%",
  },
  priceSkeleton: {
    height: 24,
    backgroundColor: "#e0e0e0",
    borderRadius: 4,
    marginBottom: 12,
    width: "50%",
  },
  detailsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  detailSkeleton: {
    height: 14,
    backgroundColor: "#e0e0e0",
    borderRadius: 4,
    width: "25%",
  },
  tenureContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  tenureSkeleton: {
    height: 14,
    backgroundColor: "#e0e0e0",
    borderRadius: 4,
    width: "40%",
  },
  driveModeSkeleton: {
    height: 14,
    backgroundColor: "#e0e0e0",
    borderRadius: 4,
    width: "30%",
  },
  footerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  locationSkeleton: {
    height: 14,
    backgroundColor: "#e0e0e0",
    borderRadius: 4,
    width: "30%",
  },
  yearSkeleton: {
    height: 14,
    backgroundColor: "#e0e0e0",
    borderRadius: 4,
    width: "20%",
  },
});

export default RentalVehicleCardSkeleton;
