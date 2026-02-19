
import React,{ useState, useRef } from "react"
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  Share,
  Animated as RNAnimated,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { Ionicons, FontAwesome5, AntDesign } from "@expo/vector-icons"
import { useNavigation, useRoute } from "@react-navigation/native"
import { COLORS } from "../../constants/colors"
import Animated, { FadeInDown, FadeInRight, FadeInLeft } from "react-native-reanimated"
import { carComparisonData } from "../../Components/data/carComparisonData"
import { ScrollView } from "react-native-gesture-handler"

const { width } = Dimensions.get("window")

const ComparisonResultsScreen = () => {
  const navigation = useNavigation()
  const route = useRoute()
  const { car1, car2 } = route.params
  const scrollViewRef = useRef(null)
  const scrollY = useRef(new RNAnimated.Value(0)).current
  const [activeTab, setActiveTab] = useState("overview")

  // Get car data from our comparison data
  const car1Data = carComparisonData.find((car) => car.name === car1) || carComparisonData[0]
  const car2Data = carComparisonData.find((car) => car.name === car2) || carComparisonData[1]

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out this comparison between ${car1} and ${car2}!`,
        url: "https://autofinder.com/comparison",
      })
    } catch (error) {
      console.log(error)
    }
  }

  const renderHeader = () => {
    const headerOpacity = scrollY.interpolate({
      inputRange: [0, 100],
      outputRange: [0, 1],
      extrapolate: "clamp",
    })

    return (
      <>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={COLORS.black} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Car Comparison</Text>
          <TouchableOpacity onPress={handleShare} style={styles.shareButton}>
            <Ionicons name="share-outline" size={24} color={COLORS.black} />
          </TouchableOpacity>
        </View>

        <RNAnimated.View
          style={[
            styles.stickyHeader,
            {
              opacity: headerOpacity,
              transform: [
                {
                  translateY: headerOpacity.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-50, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.stickyBackButton}>
            <Ionicons name="arrow-back" size={24} color={COLORS.black} />
          </TouchableOpacity>
          <Text style={styles.stickyHeaderTitle}>
            {car1} vs {car2}
          </Text>
          <TouchableOpacity onPress={handleShare} style={styles.stickyShareButton}>
            <Ionicons name="share-outline" size={24} color={COLORS.black} />
          </TouchableOpacity>
        </RNAnimated.View>
      </>
    )
  }

  const renderCarImages = () => {
    return (
      <View style={styles.carImagesContainer}>
        <Animated.View entering={FadeInLeft.duration(500)} style={styles.carImageWrapper}>
          <Image source={{ uri: car1Data.image }} style={styles.carImage} />
          <Text style={styles.carImageName}>{car1}</Text>
        </Animated.View>

        <View style={styles.vsContainer}>
          <View style={styles.vsCircle}>
            <Text style={styles.vsText}>VS</Text>
          </View>
        </View>

        <Animated.View entering={FadeInRight.duration(500)} style={styles.carImageWrapper}>
          <Image source={{ uri: car2Data.image }} style={styles.carImage} />
          <Text style={styles.carImageName}>{car2}</Text>
        </Animated.View>
      </View>
    )
  }

  const renderTabs = () => {
  const tabs = ["overview", "performance", "features", "safety", "cost"];

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 10 }}
      style={{ marginVertical: 10 }}
    >
      {tabs.map((tab) => (
        <TouchableOpacity
          key={tab}
          style={[
            styles.tabButton,
            activeTab === tab && styles.activeTabButton,
          ]}
          onPress={() => setActiveTab(tab)}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === tab && styles.activeTabText,
            ]}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};


  const renderComparisonSection = (title, items) => {
    return (
      <Animated.View entering={FadeInDown.duration(400)} style={styles.comparisonSection}>
        <Text style={styles.sectionTitle}>{title}</Text>

        {items.map((item, index) => (
          <View key={index} style={styles.comparisonRow}>
            <View style={styles.specNameContainer}>
              <Text style={styles.specName}>{item.name}</Text>
            </View>

            <View style={styles.specValuesContainer}>
              <View style={[styles.specValueContainer, item.winner === "car1" && styles.winnerContainer]}>
                <Text style={styles.specValue}>{item.car1Value}</Text>
                {item.winner === "car1" && (
                  <AntDesign name="checkcircle" size={16} color={COLORS.primary} style={styles.winnerIcon} />
                )}
              </View>

              <View style={[styles.specValueContainer, item.winner === "car2" && styles.winnerContainer]}>
                <Text style={styles.specValue}>{item.car2Value}</Text>
                {item.winner === "car2" && (
                  <AntDesign name="checkcircle" size={16} color={COLORS.primary} style={styles.winnerIcon} />
                )}
              </View>
            </View>
          </View>
        ))}
      </Animated.View>
    )
  }

  const renderOverviewTab = () => {
    return (
      <>
        {renderComparisonSection("Basic Information", [
          {
            name: "Brand",
            car1Value: car1Data.brand,
            car2Value: car2Data.brand,
            winner: null,
          },
          {
            name: "Model",
            car1Value: car1Data.model,
            car2Value: car2Data.model,
            winner: null,
          },
          {
            name: "Year",
            car1Value: car1Data.year.toString(),
            car2Value: car2Data.year.toString(),
            winner: car1Data.year > car2Data.year ? "car1" : car1Data.year < car2Data.year ? "car2" : null,
          },
          {
            name: "Body Type",
            car1Value: car1Data.bodyType,
            car2Value: car2Data.bodyType,
            winner: null,
          },
          {
            name: "Seating Capacity",
            car1Value: car1Data.seatingCapacity.toString(),
            car2Value: car2Data.seatingCapacity.toString(),
            winner:
              car1Data.seatingCapacity > car2Data.seatingCapacity
                ? "car1"
                : car1Data.seatingCapacity < car2Data.seatingCapacity
                  ? "car2"
                  : null,
          },
        ])}

        {renderComparisonSection("Dimensions", [
          {
            name: "Length (mm)",
            car1Value: car1Data.dimensions.length.toString(),
            car2Value: car2Data.dimensions.length.toString(),
            winner: null,
          },
          {
            name: "Width (mm)",
            car1Value: car1Data.dimensions.width.toString(),
            car2Value: car2Data.dimensions.width.toString(),
            winner: null,
          },
          {
            name: "Height (mm)",
            car1Value: car1Data.dimensions.height.toString(),
            car2Value: car2Data.dimensions.height.toString(),
            winner: null,
          },
          {
            name: "Wheelbase (mm)",
            car1Value: car1Data.dimensions.wheelbase.toString(),
            car2Value: car2Data.dimensions.wheelbase.toString(),
            winner: null,
          },
          {
            name: "Ground Clearance (mm)",
            car1Value: car1Data.dimensions.groundClearance.toString(),
            car2Value: car2Data.dimensions.groundClearance.toString(),
            winner:
              car1Data.dimensions.groundClearance > car2Data.dimensions.groundClearance
                ? "car1"
                : car1Data.dimensions.groundClearance < car2Data.dimensions.groundClearance
                  ? "car2"
                  : null,
          },
        ])}
      </>
    )
  }

  const renderPerformanceTab = () => {
    return (
      <>
        {renderComparisonSection("Engine & Performance", [
          {
            name: "Engine Type",
            car1Value: car1Data.engine.type,
            car2Value: car2Data.engine.type,
            winner: null,
          },
          {
            name: "Displacement (cc)",
            car1Value: car1Data.engine.displacement.toString(),
            car2Value: car2Data.engine.displacement.toString(),
            winner:
              car1Data.engine.displacement > car2Data.engine.displacement
                ? "car1"
                : car1Data.engine.displacement < car2Data.engine.displacement
                  ? "car2"
                  : null,
          },
          {
            name: "Max Power (HP)",
            car1Value: car1Data.engine.power.toString(),
            car2Value: car2Data.engine.power.toString(),
            winner:
              car1Data.engine.power > car2Data.engine.power
                ? "car1"
                : car1Data.engine.power < car2Data.engine.power
                  ? "car2"
                  : null,
          },
          {
            name: "Max Torque (Nm)",
            car1Value: car1Data.engine.torque.toString(),
            car2Value: car2Data.engine.torque.toString(),
            winner:
              car1Data.engine.torque > car2Data.engine.torque
                ? "car1"
                : car1Data.engine.torque < car2Data.engine.torque
                  ? "car2"
                  : null,
          },
          {
            name: "Transmission",
            car1Value: car1Data.transmission,
            car2Value: car2Data.transmission,
            winner: null,
          },
        ])}

        {renderComparisonSection("Performance Metrics", [
          {
            name: "0-100 km/h (sec)",
            car1Value: car1Data.performance.zeroToHundred.toString(),
            car2Value: car2Data.performance.zeroToHundred.toString(),
            winner:
              car1Data.performance.zeroToHundred < car2Data.performance.zeroToHundred
                ? "car1"
                : car1Data.performance.zeroToHundred > car2Data.performance.zeroToHundred
                  ? "car2"
                  : null,
          },
          {
            name: "Top Speed (km/h)",
            car1Value: car1Data.performance.topSpeed.toString(),
            car2Value: car2Data.performance.topSpeed.toString(),
            winner:
              car1Data.performance.topSpeed > car2Data.performance.topSpeed
                ? "car1"
                : car1Data.performance.topSpeed < car2Data.performance.topSpeed
                  ? "car2"
                  : null,
          },
          {
            name: "Fuel Efficiency (km/l)",
            car1Value: car1Data.performance.fuelEfficiency.toString(),
            car2Value: car2Data.performance.fuelEfficiency.toString(),
            winner:
              car1Data.performance.fuelEfficiency > car2Data.performance.fuelEfficiency
                ? "car1"
                : car1Data.performance.fuelEfficiency < car2Data.performance.fuelEfficiency
                  ? "car2"
                  : null,
          },
          {
            name: "Fuel Tank (L)",
            car1Value: car1Data.performance.fuelTank.toString(),
            car2Value: car2Data.performance.fuelTank.toString(),
            winner:
              car1Data.performance.fuelTank > car2Data.performance.fuelTank
                ? "car1"
                : car1Data.performance.fuelTank < car2Data.performance.fuelTank
                  ? "car2"
                  : null,
          },
          {
            name: "Drive Type",
            car1Value: car1Data.performance.driveType,
            car2Value: car2Data.performance.driveType,
            winner: null,
          },
        ])}
      </>
    )
  }

  const renderFeaturesTab = () => {
    return (
      <>
        {renderComparisonSection("Comfort & Convenience", [
          {
            name: "Infotainment",
            car1Value: car1Data.features.infotainment,
            car2Value: car2Data.features.infotainment,
            winner: null,
          },
          {
            name: "Climate Control",
            car1Value: car1Data.features.climateControl,
            car2Value: car2Data.features.climateControl,
            winner: null,
          },
          {
            name: "Seats",
            car1Value: car1Data.features.seats,
            car2Value: car2Data.features.seats,
            winner: null,
          },
          {
            name: "Sunroof",
            car1Value: car1Data.features.sunroof ? "Yes" : "No",
            car2Value: car2Data.features.sunroof ? "Yes" : "No",
            winner:
              car1Data.features.sunroof && !car2Data.features.sunroof
                ? "car1"
                : !car1Data.features.sunroof && car2Data.features.sunroof
                  ? "car2"
                  : null,
          },
          {
            name: "Keyless Entry",
            car1Value: car1Data.features.keylessEntry ? "Yes" : "No",
            car2Value: car2Data.features.keylessEntry ? "Yes" : "No",
            winner:
              car1Data.features.keylessEntry && !car2Data.features.keylessEntry
                ? "car1"
                : !car1Data.features.keylessEntry && car2Data.features.keylessEntry
                  ? "car2"
                  : null,
          },
        ])}

        {renderComparisonSection("Technology", [
          {
            name: "Navigation",
            car1Value: car1Data.features.navigation ? "Yes" : "No",
            car2Value: car2Data.features.navigation ? "Yes" : "No",
            winner:
              car1Data.features.navigation && !car2Data.features.navigation
                ? "car1"
                : !car1Data.features.navigation && car2Data.features.navigation
                  ? "car2"
                  : null,
          },
          {
            name: "Smartphone Integration",
            car1Value: car1Data.features.smartphoneIntegration,
            car2Value: car2Data.features.smartphoneIntegration,
            winner: null,
          },
          {
            name: "Sound System",
            car1Value: car1Data.features.soundSystem,
            car2Value: car2Data.features.soundSystem,
            winner: null,
          },
          {
            name: "Digital Instrument Cluster",
            car1Value: car1Data.features.digitalCluster ? "Yes" : "No",
            car2Value: car2Data.features.digitalCluster ? "Yes" : "No",
            winner:
              car1Data.features.digitalCluster && !car2Data.features.digitalCluster
                ? "car1"
                : !car1Data.features.digitalCluster && car2Data.features.digitalCluster
                  ? "car2"
                  : null,
          },
          {
            name: "Wireless Charging",
            car1Value: car1Data.features.wirelessCharging ? "Yes" : "No",
            car2Value: car2Data.features.wirelessCharging ? "Yes" : "No",
            winner:
              car1Data.features.wirelessCharging && !car2Data.features.wirelessCharging
                ? "car1"
                : !car1Data.features.wirelessCharging && car2Data.features.wirelessCharging
                  ? "car2"
                  : null,
          },
        ])}
      </>
    )
  }

  const renderSafetyTab = () => {
    return (
      <>
        {renderComparisonSection("Safety Features", [
          {
            name: "Airbags",
            car1Value: car1Data.safety.airbags.toString(),
            car2Value: car2Data.safety.airbags.toString(),
            winner:
              car1Data.safety.airbags > car2Data.safety.airbags
                ? "car1"
                : car1Data.safety.airbags < car2Data.safety.airbags
                  ? "car2"
                  : null,
          },
          {
            name: "ABS",
            car1Value: car1Data.safety.abs ? "Yes" : "No",
            car2Value: car2Data.safety.abs ? "Yes" : "No",
            winner:
              car1Data.safety.abs && !car2Data.safety.abs
                ? "car1"
                : !car1Data.safety.abs && car2Data.safety.abs
                  ? "car2"
                  : null,
          },
          {
            name: "ESP",
            car1Value: car1Data.safety.esp ? "Yes" : "No",
            car2Value: car2Data.safety.esp ? "Yes" : "No",
            winner:
              car1Data.safety.esp && !car2Data.safety.esp
                ? "car1"
                : !car1Data.safety.esp && car2Data.safety.esp
                  ? "car2"
                  : null,
          },
          {
            name: "Parking Sensors",
            car1Value: car1Data.safety.parkingSensors,
            car2Value: car2Data.safety.parkingSensors,
            winner: null,
          },
          {
            name: "360° Camera",
            car1Value: car1Data.safety.camera360 ? "Yes" : "No",
            car2Value: car2Data.safety.camera360 ? "Yes" : "No",
            winner:
              car1Data.safety.camera360 && !car2Data.safety.camera360
                ? "car1"
                : !car1Data.safety.camera360 && car2Data.safety.camera360
                  ? "car2"
                  : null,
          },
        ])}

        {renderComparisonSection("Advanced Safety", [
          {
            name: "Lane Assist",
            car1Value: car1Data.safety.laneAssist ? "Yes" : "No",
            car2Value: car2Data.safety.laneAssist ? "Yes" : "No",
            winner:
              car1Data.safety.laneAssist && !car2Data.safety.laneAssist
                ? "car1"
                : !car1Data.safety.laneAssist && car2Data.safety.laneAssist
                  ? "car2"
                  : null,
          },
          {
            name: "Blind Spot Monitor",
            car1Value: car1Data.safety.blindSpotMonitor ? "Yes" : "No",
            car2Value: car2Data.safety.blindSpotMonitor ? "Yes" : "No",
            winner:
              car1Data.safety.blindSpotMonitor && !car2Data.safety.blindSpotMonitor
                ? "car1"
                : !car1Data.safety.blindSpotMonitor && car2Data.safety.blindSpotMonitor
                  ? "car2"
                  : null,
          },
          {
            name: "Adaptive Cruise Control",
            car1Value: car1Data.safety.adaptiveCruiseControl ? "Yes" : "No",
            car2Value: car2Data.safety.adaptiveCruiseControl ? "Yes" : "No",
            winner:
              car1Data.safety.adaptiveCruiseControl && !car2Data.safety.adaptiveCruiseControl
                ? "car1"
                : !car1Data.safety.adaptiveCruiseControl && car2Data.safety.adaptiveCruiseControl
                  ? "car2"
                  : null,
          },
          {
            name: "Collision Warning",
            car1Value: car1Data.safety.collisionWarning ? "Yes" : "No",
            car2Value: car2Data.safety.collisionWarning ? "Yes" : "No",
            winner:
              car1Data.safety.collisionWarning && !car2Data.safety.collisionWarning
                ? "car1"
                : !car1Data.safety.collisionWarning && car2Data.safety.collisionWarning
                  ? "car2"
                  : null,
          },
          {
            name: "Safety Rating",
            car1Value: car1Data.safety.rating + "/5",
            car2Value: car2Data.safety.rating + "/5",
            winner:
              car1Data.safety.rating > car2Data.safety.rating
                ? "car1"
                : car1Data.safety.rating < car2Data.safety.rating
                  ? "car2"
                  : null,
          },
        ])}
      </>
    )
  }

  const renderCostTab = () => {
    return (
      <>
        {renderComparisonSection("Price & Value", [
          {
            name: "Base Price",
            car1Value: "$" + car1Data.cost.basePrice.toLocaleString(),
            car2Value: "$" + car2Data.cost.basePrice.toLocaleString(),
            winner:
              car1Data.cost.basePrice < car2Data.cost.basePrice
                ? "car1"
                : car1Data.cost.basePrice > car2Data.cost.basePrice
                  ? "car2"
                  : null,
          },
          {
            name: "Fully Loaded Price",
            car1Value: "$" + car1Data.cost.fullyLoadedPrice.toLocaleString(),
            car2Value: "$" + car2Data.cost.fullyLoadedPrice.toLocaleString(),
            winner:
              car1Data.cost.fullyLoadedPrice < car2Data.cost.fullyLoadedPrice
                ? "car1"
                : car1Data.cost.fullyLoadedPrice > car2Data.cost.fullyLoadedPrice
                  ? "car2"
                  : null,
          },
          {
            name: "Warranty",
            car1Value: car1Data.cost.warranty,
            car2Value: car2Data.cost.warranty,
            winner: null,
          },
        ])}

        {renderComparisonSection("Ownership Costs", [
          {
            name: "Fuel Cost (Annual)",
            car1Value: "$" + car1Data.cost.annualFuelCost.toLocaleString(),
            car2Value: "$" + car2Data.cost.annualFuelCost.toLocaleString(),
            winner:
              car1Data.cost.annualFuelCost < car2Data.cost.annualFuelCost
                ? "car1"
                : car1Data.cost.annualFuelCost > car2Data.cost.annualFuelCost
                  ? "car2"
                  : null,
          },
          {
            name: "Insurance (Annual)",
            car1Value: "$" + car1Data.cost.annualInsurance.toLocaleString(),
            car2Value: "$" + car2Data.cost.annualInsurance.toLocaleString(),
            winner:
              car1Data.cost.annualInsurance < car2Data.cost.annualInsurance
                ? "car1"
                : car1Data.cost.annualInsurance > car2Data.cost.annualInsurance
                  ? "car2"
                  : null,
          },
          {
            name: "Maintenance (Annual)",
            car1Value: "$" + car1Data.cost.annualMaintenance.toLocaleString(),
            car2Value: "$" + car2Data.cost.annualMaintenance.toLocaleString(),
            winner:
              car1Data.cost.annualMaintenance < car2Data.cost.annualMaintenance
                ? "car1"
                : car1Data.cost.annualMaintenance > car2Data.cost.annualMaintenance
                  ? "car2"
                  : null,
          },
          {
            name: "Depreciation (5 Years)",
            car1Value: car1Data.cost.depreciation5Years + "%",
            car2Value: car2Data.cost.depreciation5Years + "%",
            winner:
              car1Data.cost.depreciation5Years < car2Data.cost.depreciation5Years
                ? "car1"
                : car1Data.cost.depreciation5Years > car2Data.cost.depreciation5Years
                  ? "car2"
                  : null,
          },
          {
            name: "Total 5-Year Cost",
            car1Value: "$" + car1Data.cost.total5YearCost.toLocaleString(),
            car2Value: "$" + car2Data.cost.total5YearCost.toLocaleString(),
            winner:
              car1Data.cost.total5YearCost < car2Data.cost.total5YearCost
                ? "car1"
                : car1Data.cost.total5YearCost > car2Data.cost.total5YearCost
                  ? "car2"
                  : null,
          },
        ])}
      </>
    )
  }

  const renderActiveTabContent = () => {
    switch (activeTab) {
      case "overview":
        return renderOverviewTab()
      case "performance":
        return renderPerformanceTab()
      case "features":
        return renderFeaturesTab()
      case "safety":
        return renderSafetyTab()
      case "cost":
        return renderCostTab()
      default:
        return renderOverviewTab()
    }
  }

  const renderVerdict = () => {
    // Calculate which car wins more categories
    let car1Wins = 0
    let car2Wins = 0

    // Count wins in each category
    const countWins = (items) => {
      items.forEach((item) => {
        if (item.winner === "car1") car1Wins++
        if (item.winner === "car2") car2Wins++
      })
    }

    // Count all wins across all categories
    Object.values(car1Data).forEach((category) => {
      if (Array.isArray(category)) {
        countWins(category)
      }
    })

    // Determine the winner
    let verdict, winnerName, winnerImage, winnerPoints, loserPoints

    if (car1Wins > car2Wins) {
      verdict = `The ${car1} edges out the ${car2} with superior performance, features, and value.`
      winnerName = car1
      winnerImage = car1Data.image
      winnerPoints = car1Wins
      loserPoints = car2Wins
    } else if (car2Wins > car1Wins) {
      verdict = `The ${car2} outperforms the ${car1} with better specifications, features, and overall value.`
      winnerName = car2
      winnerImage = car2Data.image
      winnerPoints = car2Wins
      loserPoints = car1Wins
    } else {
      verdict = `Both the ${car1} and ${car2} are evenly matched, with each having their own strengths and weaknesses.`
      winnerName = "Tie"
      winnerImage = null
      winnerPoints = car1Wins
      loserPoints = car2Wins
    }

    return (
      <Animated.View entering={FadeInDown.duration(400).delay(200)} style={styles.verdictContainer}>
        <Text style={styles.verdictTitle}>Final Verdict</Text>

        {winnerName !== "Tie" ? (
          <View style={styles.winnerContainer}>
            <View style={styles.trophyContainer}>
              <FontAwesome5 name="trophy" size={40} color="#FFD700" />
            </View>
            <Text style={styles.winnerTitle}>{winnerName} Wins!</Text>
            <Image source={{ uri: winnerImage }} style={styles.winnerImage} />
            <Text style={styles.winnerScore}>
              {winnerPoints} vs {loserPoints}
            </Text>
          </View>
        ) : (
          <View style={styles.tieContainer}>
            <Text style={styles.tieTitle}>It's a Tie!</Text>
            <Text style={styles.tieScore}>
              {car1}: {car1Wins} points | {car2}: {car2Wins} points
            </Text>
          </View>
        )}

        <Text style={styles.verdictText}>{verdict}</Text>

        <TouchableOpacity style={styles.findDealersButton} onPress={() => navigation.navigate("NewCarListScreen")}>
          <Text style={styles.findDealersButtonText}>Find Dealers Near You</Text>
        </TouchableOpacity>
      </Animated.View>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      {renderHeader()}

      <RNAnimated.ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        onScroll={RNAnimated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: true })}
        scrollEventThrottle={16}
      >
        {renderCarImages()}
        {renderTabs()}
        {renderActiveTabContent()}
        {renderVerdict()}
      </RNAnimated.ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.black,
  },
  shareButton: {
    padding: 8,
  },
  stickyHeader: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.white,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
    zIndex: 1000,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  stickyBackButton: {
    padding: 8,
  },
  stickyHeaderTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.black,
  },
  stickyShareButton: {
    padding: 8,
  },
  scrollView: {
    flex: 1,
  },
  carImagesContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 20,
    backgroundColor: COLORS.white,
  },
  carImageWrapper: {
    flex: 1,
    alignItems: "center",
  },
  carImage: {
    width: 140,
    height: 90,
    borderRadius: 8,
    marginBottom: 8,
  },
  carImageName: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.black,
    textAlign: "center",
  },
  vsContainer: {
    paddingHorizontal: 10,
  },
  vsCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  vsText: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.white,
  },
  tabsContainer: {
    flexDirection: "row",
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: "#e1e1e1",
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: COLORS.primary,
  },
  tabText: {
    fontSize: 14,
    color: COLORS.gray,
  },
  activeTabText: {
    color: COLORS.primary,
    fontWeight: "600",
  },
  comparisonSection: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.black,
    marginBottom: 16,
  },
  comparisonRow: {
    flexDirection: "row",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  specNameContainer: {
    flex: 1.2,
  },
  specName: {
    fontSize: 14,
    color: COLORS.black,
  },
  specValuesContainer: {
    flex: 2,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  specValueContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  specValue: {
    fontSize: 14,
    color: COLORS.black,
    textAlign: "center",
  },
  winnerContainer: {
    backgroundColor: "#f8f8f8",
    borderRadius: 4,
  },
  winnerIcon: {
    marginLeft: 6,
  },
  verdictContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    alignItems: "center",
  },
  verdictTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.black,
    marginBottom: 16,
    textAlign: "center",
  },
  winnerContainer: {
    alignItems: "center",
    marginBottom: 16,
  },
  trophyContainer: {
    marginBottom: 8,
  },
  winnerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.primary,
    marginBottom: 12,
  },
  winnerImage: {
    width: 200,
    height: 120,
    borderRadius: 8,
    marginBottom: 12,
  },
  winnerScore: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.black,
  },
  tieContainer: {
    alignItems: "center",
    marginBottom: 16,
  },
  tieTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.primary,
    marginBottom: 8,
  },
  tieScore: {
    fontSize: 14,
    color: COLORS.black,
    textAlign: "center",
  },
  verdictText: {
    fontSize: 14,
    color: COLORS.black,
    lineHeight: 22,
    textAlign: "center",
    marginBottom: 20,
  },
  findDealersButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
  findDealersButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.white,
  },
  tabButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: "#eee",
    marginRight: 10,
  },
  

})

export default ComparisonResultsScreen
