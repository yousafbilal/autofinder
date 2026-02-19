import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import React from "react";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../../navigationTypes"; // Ensure correct import

type NavigationProps = StackNavigationProp<RootStackParamList, "NewBikeListScreen">;

const HeadingSpaceBetween5 = ({ heading, label }: { heading: string; label?: string }) => {
  const navigation = useNavigation<NavigationProps>();

  return (
    <View style={styles.header}>
      <Text style={styles.heading}>{heading}</Text>
      <TouchableOpacity onPress={() => navigation.navigate("NewBikeListScreen")}>
        <Text style={styles.anchor}>{label ?? "See all"}</Text>
      </TouchableOpacity>
    </View>
  );
};

export default HeadingSpaceBetween5;

const styles = StyleSheet.create({
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
