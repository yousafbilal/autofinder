import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions } from "react-native"
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from "@expo/vector-icons"
import { SafeAreaView } from "react-native-safe-area-context"
import React from "react"
import { COLORS } from "../../constants/colors"
const { width } = Dimensions.get("window")

interface SellOptionsScreenProps {
  navigation: any
}

const AllOffersScreen = ({ navigation }: SellOptionsScreenProps) => {
  const handleOptionPress = (screen: string, params?: any) => {
    if (navigation) {
      if (params) {
        navigation.navigate(screen, params)
      } else {
        navigation.navigate(screen)
      }
    }
  }

  const handleBackPress = () => {
    navigation.goBack()
  }

  const options = [
    {
      id: "sell-car",
      title: "Sell a Car",
      description: "List your car for sale",
      icon: <Ionicons name="car-outline" size={24} color={COLORS.primary} />,
      screen: "PostFreeAd",
    },
    {
      id: "list-for-me",
      title: "List it for you",
      description: "We'll list it for you",
      icon: <MaterialCommunityIcons name="clipboard-check-outline" size={24} color={COLORS.primary} />,
      screen: "ListItForYouScreen",
    },
    {
      id: "buy-car-for-me",
      title: "Buy Car for Me",
      description: "We help you buy a car",
      icon: <Ionicons name="car-sport" size={24} color={COLORS.primary} />,
      screen: "BuyCarForMeScreen",
    },
    {
      id: "car-inspection",
      title: "Car Inspection",
      description: "Get your car inspected",
      icon: <MaterialCommunityIcons name="car-wrench" size={24} color={COLORS.primary} />,
      screen: "CarInspectionScreen",
    },
    {
      id: "rent-car",
      title: "Rent a Car",
      description: "List your car for rent",
      icon: <MaterialCommunityIcons name="car-key" size={24} color={COLORS.primary} />,
      screen: "CarRentalServiceScreen",
    },
    {
      id: "sell-bike",
      title: "Sell a Bike",
      description: "List your bike for sale",
      icon: <FontAwesome5 name="motorcycle" size={20} color={COLORS.primary} />,
      screen: "SellBikeScreen",
    },
    {
      id: "sell-parts",
      title: "Sell Auto Parts",
      description: "List auto parts for sale",
      icon: <MaterialCommunityIcons name="car-cog" size={24} color={COLORS.primary} />,
      screen: "SellAutoScreen",
    },
  ]

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
          <Ionicons name="arrow-back" size={24} color={COLORS.black} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Select a Listing Type</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {options.map((option) => (
          <TouchableOpacity
            key={option.id}
            style={styles.optionButton}
            onPress={() => handleOptionPress(option.screen)}
            activeOpacity={0.7}
          >
            <View style={styles.optionIconContainer}>{option.icon}</View>
            <View style={styles.optionTextContainer}>
              <Text style={styles.optionTitle}>{option.title}</Text>
              <Text style={styles.optionDescription}>{option.description}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={COLORS.darkGray} />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.black,
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  optionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  optionIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0, 102, 204, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  optionTextContainer: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: "500",
    color: COLORS.black,
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 13,
    color: COLORS.darkGray,
  },
})

export default AllOffersScreen;
