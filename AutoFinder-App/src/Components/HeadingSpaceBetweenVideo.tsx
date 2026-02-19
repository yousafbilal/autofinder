import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import React from "react";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../../navigationTypes"; // Ensure correct import
import { Ionicons } from "@expo/vector-icons";

type NavigationProps = StackNavigationProp<RootStackParamList, "CarListScreen">;

const HeadingSpaceBetweenVideo = ({ heading, label }: { heading: string; label?: string }) => {
  const navigation = useNavigation<NavigationProps>();

  return (
    <View style={styles.header}>
      <Text style={styles.heading}>{heading}</Text>
      <TouchableOpacity 
        style={styles.viewAllButton}
        onPress={() => navigation.navigate("VideoScreen")}
      >
        <Ionicons name="play-circle" size={20} color="#CD0100" style={styles.videoIcon} />
        <Text style={styles.anchor}>{label ?? "View All"}</Text>
      </TouchableOpacity>
    </View>
  );
};

export default HeadingSpaceBetweenVideo;

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
  viewAllButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  videoIcon: {
    marginRight: 2,
  },
  anchor: {
    color: "#CD0100",
  },
});
