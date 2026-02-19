import React, { useState } from "react"
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Platform } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { TabView, SceneMap, TabBar } from "react-native-tab-view"
import { StatusBar } from "expo-status-bar"
import { useNavigation } from "@react-navigation/native"
import { Ionicons } from "@expo/vector-icons"
import LottieView from "lottie-react-native"

import { COLORS } from "../../constants/colors"
import CarPackagesTab from "./CarPackagesTab"
import BikePackagesTab from "./BikePackagesTab"
import MyPackagesTab from "./MyPackagesTab"
import BoosterTab from "./BoosterTab"

const initialLayout = { width: Dimensions.get("window").width }

const PackagesScreen = () => {
  const navigation = useNavigation()
  const [index, setIndex] = useState(0)
  const [routes] = useState([
    { key: "car", title: "Car Packages" },
    { key: "bike", title: "Bike Packages" },
    // { key: "my", title: "My Packages" },
    { key: "booster", title: "Booster Packs" }
    
  ])

  const renderScene = SceneMap({
    car: CarPackagesTab,
    bike: BikePackagesTab,
    // my: MyPackagesTab,
    booster: BoosterTab,

  })

  const renderTabBar = (props) => (
    <TabBar
      {...props}
      indicatorStyle={styles.indicator}
      style={styles.tabBar}
      labelStyle={styles.tabLabel}
      activeColor={COLORS.primary}
      inactiveColor={COLORS.darkGray}
    />
  )

  // Hide dealer packages for iOS
  if (Platform.OS === 'ios') {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="dark" />
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={COLORS.black} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Dealer Packages</Text>
          <View style={styles.rightPlaceholder} />
        </View>

        <View style={styles.iosMessageContainer}>
          <Ionicons name="information-circle" size={64} color={COLORS.darkGray} />
          <Text style={styles.iosMessageTitle}>Not Available on iOS</Text>
          <Text style={styles.iosMessageText}>
            Dealer packages are currently only available on Android devices. Please use an Android device to purchase dealer packages.
          </Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.black} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Dealer Packages</Text>
        <View style={styles.rightPlaceholder} />
      </View>

      <View style={styles.animationContainer}>
        <LottieView source={require("../../../assets/animations/packages.json")} autoPlay loop style={styles.animation} />
      </View>

      <View style={styles.textContainer}>
        <Text style={styles.heading}>Boost Your Sales</Text>
        <Text style={styles.subheading}>
          Choose the perfect package to maximize your visibility and increase your sales
        </Text>
      </View>

      <View style={styles.tabViewContainer}>
        <TabView
          navigationState={{ index, routes }}
          renderScene={renderScene}
          onIndexChange={setIndex}
          initialLayout={initialLayout}
          renderTabBar={renderTabBar}
        />
      </View>
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
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.black,
  },
  rightPlaceholder: {
    width: 40,
  },
  animationContainer: {
    height: 150,
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 10,
  },
  animation: {
    width: 200,
    height: 200,
  },
  textContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  heading: {
    fontSize: 24,
    fontWeight: "bold",
    color: COLORS.black,
    textAlign: "center",
    marginBottom: 8,
  },
  subheading: {
    fontSize: 16,
    color: COLORS.darkGray,
    textAlign: "center",
    lineHeight: 22,
  },
  tabViewContainer: {
    flex: 1,
  },
  tabBar: {
    backgroundColor: COLORS.white,
    elevation: 0,
    shadowOpacity: 0,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  tabLabel: {
    fontSize: 14,
    fontWeight: "600",
    textTransform: "none",
  },
  indicator: {
    backgroundColor: COLORS.primary,
    height: 3,
    borderRadius: 3,
  },
  iosMessageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  iosMessageTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.black,
    marginTop: 20,
    marginBottom: 16,
    textAlign: 'center',
  },
  iosMessageText: {
    fontSize: 16,
    color: COLORS.darkGray,
    textAlign: 'center',
    lineHeight: 24,
  },
})

export default PackagesScreen
