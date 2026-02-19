import React from "react";
import { View, StyleSheet, Text, TouchableOpacity } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../../navigationTypes";
import PakWheelsAds from "./PakWheelsAds";

type NavigationProps = StackNavigationProp<RootStackParamList, "ForYouCarListScreen">;

const ManagedByAutofinder = () => {
  const navigation = useNavigation<NavigationProps>();

  return (
    <View style={styles.container}>
      {/* Header with Managed by Autofinder title and See All button */}
      <View style={styles.header}>
        <Text style={styles.heading}>Managed by Autofinder</Text>
        <TouchableOpacity onPress={() => navigation.navigate("ForYouCarListScreen")}>
          <Text style={styles.anchor}>See all</Text>
        </TouchableOpacity>
      </View>
      
      {/* Managed by Autofinder Cards */}
      <PakWheelsAds />
    </View>
  );
};

export default ManagedByAutofinder;

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
