import React from "react";
import { View, StyleSheet, Text, TouchableOpacity } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../../navigationTypes";
import FeaturedAds from "./FeaturedAds";

type NavigationProps = StackNavigationProp<RootStackParamList, "FeaturedCarListScreen">;

const PremiumCars = () => {
  const navigation = useNavigation<NavigationProps>();

  return (
    <View style={styles.container}>
      {/* Header with Premium Cars title and See All button */}
      <View style={styles.header}>
        <Text style={styles.heading}>Premium Cars</Text>
        <TouchableOpacity onPress={() => navigation.navigate("FeaturedCarListScreen")}>
          <Text style={styles.anchor}>See all</Text>
        </TouchableOpacity>
      </View>
      
      {/* Premium Car Cards */}
      <FeaturedAds />
    </View>
  );
};

export default PremiumCars;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "baseline",
    flexDirection: "row",
    marginHorizontal: 12,
    marginVertical: 24,
  },
  heading: {
    fontWeight: "600",
    fontSize: 18,
  },
  anchor: {
    color: "#CD0100",
  },
});
