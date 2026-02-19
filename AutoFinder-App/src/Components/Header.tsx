import { View, Text, ScrollView, StyleSheet } from "react-native";
import React, { useState } from "react";
import { TouchableOpacity } from "react-native-gesture-handler";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../../navigationTypes"; // Adjust the path if needed

type NavigationProp = StackNavigationProp<RootStackParamList>;

const list = ["Used Cars", "Used Bikes", "Car On Rent","Auto Store"];

const Header = () => {
  const [selectedCat, setSelectedCat] = useState<string>("Used Cars");
  const navigation = useNavigation<NavigationProp>();

  const handlePress = (item: string) => {
    setSelectedCat(item);

    switch (item) {
      case "Used Cars":
        navigation.navigate("CarListScreen");
        break;
      // case "New Cars":
      //   navigation.navigate("NewCarListScreen");
      //   break;
      case "Used Bikes":
        navigation.navigate("BikeListScreen");
        break;
        case "Car On Rent":
        navigation.navigate("RentalCarListScreen");
        break;
      case "Auto Store":
        navigation.navigate("AutoPartsListScreen");
        break;
    }
  };

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      {list.map((item, index) => (
        <TouchableOpacity onPress={() => handlePress(item)} key={index}>
          <View
            style={{
              ...styles.capsule,
              backgroundColor: selectedCat === item ? "#CD0100" : "#fff",
              borderWidth: selectedCat === item ? 0 : 1,
              borderColor: "#CD0100",
            }}
          >
            <Text
              style={{
                color: selectedCat === item ? "#fff" : "#CD0100",
                fontWeight: "500"
              }}
            >
              {item}
            </Text>
          </View>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

export default Header;

const styles = StyleSheet.create({
  capsule: {
    backgroundColor: "#fff",
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginHorizontal: 8,
    marginTop: 12,
    borderRadius: 8,
  },
});
