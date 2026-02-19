
import React,{ useEffect, useRef } from "react"
import { View, Text, StyleSheet, TouchableOpacity, Animated, Dimensions, BackHandler } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useNavigation, useRoute, CommonActions } from "@react-navigation/native"
import LottieView from "lottie-react-native"

import { COLORS } from "../../constants/colors"
import { getPackageById } from "../../Components/data/packagesData"

const { width } = Dimensions.get("window")

const PaymentSuccessScreen = () => {
  const navigation = useNavigation()
  const route = useRoute()
  const { packageId, amount, paymentMethod } = route.params
  const packageData = getPackageById(packageId)

  const successAnimation = useRef(null)
  const fadeAnim = useRef(new Animated.Value(0)).current
  const scaleAnim = useRef(new Animated.Value(0.9)).current

  useEffect(() => {
    // Disable back button
    const backHandler = BackHandler.addEventListener("hardwareBackPress", () => true)

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start()

    return () => backHandler.remove()
  }, [])

  const handleContinue = () => {
    // Reset navigation to remove this screen from back stack
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: "Main" }],
      }),
    )

    // Then navigate to My Packages
    navigation.navigate("PackagesScreen", { screen: "my" })
  }

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <View style={styles.animationContainer}>
          <LottieView
            ref={successAnimation}
            // source={require("../../assets/animations/payment-success.json")}
            source={require("../../../assets/animations/empty-box.json")}

            style={styles.animation}
            autoPlay
            loop={false}
          />
        </View>

        <Text style={styles.title}>Payment Successful!</Text>
        <Text style={styles.message}>
          Your payment of <Text style={styles.highlightText}>PKR {amount}</Text> has been successfully processed.
        </Text>

        <View style={styles.packageInfoCard}>
          <Text style={styles.packageName}>{packageData.name}</Text>
          <Text style={styles.packageType}>{packageData.type === "car" ? "Car Package" : "Bike Package"}</Text>

          <View style={styles.detailsRow}>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Total Ads</Text>
              <Text style={styles.detailValue}>{packageData.totalAds}</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Boosters</Text>
              <Text style={styles.detailValue}>{packageData.freeBoosters}</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Validity</Text>
              <Text style={styles.detailValue}>{packageData.validityDays} days</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.orderInfo}>
            <Text style={styles.orderInfoText}>
              Order ID: <Text style={styles.orderInfoValue}>#{Math.floor(100000 + Math.random() * 900000)}</Text>
            </Text>
            <Text style={styles.orderInfoText}>
              Date: <Text style={styles.orderInfoValue}>{new Date().toLocaleDateString()}</Text>
            </Text>
            <Text style={styles.orderInfoText}>
              Payment Method:{" "}
              <Text style={styles.orderInfoValue}>
                {paymentMethod === "credit_card"
                  ? "Credit/Debit Card"
                  : paymentMethod === "paypal"
                    ? "PayPal"
                    : paymentMethod === "apple_pay"
                      ? "Apple Pay"
                      : "Google Pay"}
              </Text>
            </Text>
          </View>
        </View>

        <Text style={styles.instructionText}>
          You can now post ads as per your package limits. Your package details will be available in your profile.
        </Text>

        <TouchableOpacity style={styles.continueButton} onPress={handleContinue}>
          <Text style={styles.continueButtonText}>Continue</Text>
        </TouchableOpacity>
      </Animated.View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  content: {
    width: "100%",
    alignItems: "center",
  },
  animationContainer: {
    marginBottom: 20,
  },
  animation: {
    width: 200,
    height: 200,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: COLORS.black,
    marginBottom: 16,
    textAlign: "center",
  },
  message: {
    fontSize: 16,
    color: COLORS.darkGray,
    textAlign: "center",
    marginBottom: 32,
    lineHeight: 24,
  },
  highlightText: {
    color: COLORS.primary,
    fontWeight: "bold",
  },
  packageInfoCard: {
    width: "100%",
    backgroundColor: "#F9FAFE",
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  packageName: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.black,
    marginBottom: 4,
  },
  packageType: {
    fontSize: 16,
    color: COLORS.darkGray,
    marginBottom: 16,
  },
  detailsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  detailItem: {
    alignItems: "center",
  },
  detailLabel: {
    fontSize: 14,
    color: COLORS.darkGray,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.primary,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.lightGray,
    marginVertical: 16,
  },
  orderInfo: {
    marginTop: 8,
  },
  orderInfoText: {
    fontSize: 14,
    color: COLORS.darkGray,
    marginBottom: 8,
  },
  orderInfoValue: {
    color: COLORS.black,
    fontWeight: "500",
  },
  instructionText: {
    fontSize: 14,
    color: COLORS.darkGray,
    textAlign: "center",
    marginBottom: 32,
    lineHeight: 20,
  },
  continueButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 8,
    width: "100%",
    alignItems: "center",
  },
  continueButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "600",
  },
})

export default PaymentSuccessScreen
