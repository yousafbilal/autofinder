import React,{ useState, useRef } from "react"
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Alert } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useNavigation, useRoute } from "@react-navigation/native"
import { Ionicons, FontAwesome } from "@expo/vector-icons"
import LottieView from "lottie-react-native"

import { COLORS } from "../../constants/colors"
import { getPackageById } from "../../Components/data/packagesData"

const PaymentMethodScreen = () => {
  const navigation = useNavigation()
  const route = useRoute()
  const { packageId, amount } = route.params
  const packageData = getPackageById(packageId)

  const [selectedMethod, setSelectedMethod] = useState(null)
  const loadingAnimation = useRef(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleSelectMethod = (method) => {
    setSelectedMethod(method)
  }

  const handleProceedPayment = () => {
    if (!selectedMethod) {
      Alert.alert("Select Payment Method", "Please select a payment method to continue.")
      return
    }

    setIsLoading(true)

    // Simulate payment processing
    setTimeout(() => {
      setIsLoading(false)

      // Navigate to success screen
      navigation.navigate("PaymentSuccess", {
        packageId,
        amount,
        paymentMethod: selectedMethod,
      })
    }, 3000)
  }

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <LottieView
          ref={loadingAnimation}
          // source={require("../../assets/animations/payment-processing.json")}
          source={require("../../../assets/animations/empty-box.json")}
          style={styles.loadingAnimation}
          autoPlay
          loop
        />
        <Text style={styles.loadingText}>Processing your payment</Text>
        <Text style={styles.loadingSubtext}>Please don't close the app...</Text>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.black} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Payment Method</Text>
        <View style={styles.rightPlaceholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.packageSummary}>
          <Image source={packageData.image} style={styles.packageImage} resizeMode="cover" />
          <View style={styles.packageInfo}>
            <Text style={styles.packageName}>{packageData.name}</Text>
            <Text style={styles.packageType}>{packageData.type === "car" ? "Car Package" : "Bike Package"}</Text>
            <Text style={styles.packagePrice}>PKR {packageData.discountedPrice}</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Select Payment Method</Text>

        <View style={styles.paymentMethods}>
          <TouchableOpacity
            style={[styles.paymentMethodItem, selectedMethod === "credit_card" && styles.selectedMethod]}
            onPress={() => handleSelectMethod("credit_card")}
          >
            <FontAwesome
              name="credit-card"
              size={24}
              color={selectedMethod === "credit_card" ? COLORS.primary : COLORS.darkGray}
            />
            <View style={styles.paymentMethodInfo}>
              <Text style={[styles.paymentMethodTitle, selectedMethod === "credit_card" && styles.selectedMethodText]}>
                Credit/Debit Card
              </Text>
              <Text style={styles.paymentMethodSubtitle}>Visa, Mastercard, Amex</Text>
            </View>
            {selectedMethod === "credit_card" && <Ionicons name="checkmark-circle" size={24} color={COLORS.primary} />}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.paymentMethodItem, selectedMethod === "paypal" && styles.selectedMethod]}
            onPress={() => handleSelectMethod("paypal")}
          >
            <FontAwesome
              name="paypal"
              size={24}
              color={selectedMethod === "paypal" ? COLORS.primary : COLORS.darkGray}
            />
            <View style={styles.paymentMethodInfo}>
              <Text style={[styles.paymentMethodTitle, selectedMethod === "paypal" && styles.selectedMethodText]}>
                PayPal
              </Text>
              <Text style={styles.paymentMethodSubtitle}>Pay with your PayPal account</Text>
            </View>
            {selectedMethod === "paypal" && <Ionicons name="checkmark-circle" size={24} color={COLORS.primary} />}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.paymentMethodItem, selectedMethod === "apple_pay" && styles.selectedMethod]}
            onPress={() => handleSelectMethod("apple_pay")}
          >
            <FontAwesome
              name="apple"
              size={24}
              color={selectedMethod === "apple_pay" ? COLORS.primary : COLORS.darkGray}
            />
            <View style={styles.paymentMethodInfo}>
              <Text style={[styles.paymentMethodTitle, selectedMethod === "apple_pay" && styles.selectedMethodText]}>
                Apple Pay
              </Text>
              <Text style={styles.paymentMethodSubtitle}>Quick and secure payment</Text>
            </View>
            {selectedMethod === "apple_pay" && <Ionicons name="checkmark-circle" size={24} color={COLORS.primary} />}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.paymentMethodItem, selectedMethod === "google_pay" && styles.selectedMethod]}
            onPress={() => handleSelectMethod("google_pay")}
          >
            <FontAwesome
              name="google-wallet"
              size={24}
              color={selectedMethod === "google_pay" ? COLORS.primary : COLORS.darkGray}
            />
            <View style={styles.paymentMethodInfo}>
              <Text style={[styles.paymentMethodTitle, selectedMethod === "google_pay" && styles.selectedMethodText]}>
                Google Pay
              </Text>
              <Text style={styles.paymentMethodSubtitle}>Fast checkout with Google Pay</Text>
            </View>
            {selectedMethod === "google_pay" && <Ionicons name="checkmark-circle" size={24} color={COLORS.primary} />}
          </TouchableOpacity>
        </View>

        <View style={styles.summaryContainer}>
          <Text style={styles.summaryTitle}>Payment Summary</Text>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Package Price</Text>
            <Text style={styles.summaryValue}>PKR {packageData.originalPrice}</Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Discount</Text>
            <Text style={styles.discountValue}>-PKR {packageData.originalPrice - packageData.discountedPrice}</Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Processing Fee</Text>
            <Text style={styles.summaryValue}>PKR 0.00</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total Amount</Text>
            <Text style={styles.totalValue}>PKR {packageData.discountedPrice}</Text>
          </View>
        </View>

        <View style={styles.secureMessage}>
          <Ionicons name="shield-checkmark" size={20} color={COLORS.primary} style={styles.secureIcon} />
          <Text style={styles.secureText}>Your payment is secure. All transactions are encrypted.</Text>
        </View>
      </ScrollView>

      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.proceedButton} onPress={handleProceedPayment} disabled={!selectedMethod}>
          <Text style={styles.proceedButtonText}>Proceed to Payment</Text>
          <Ionicons name="arrow-forward" size={20} color={COLORS.white} />
        </TouchableOpacity>
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
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.black,
  },
  rightPlaceholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  packageSummary: {
    flexDirection: "row",
    backgroundColor: "rgba(85, 110, 230, 0.1)",
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  packageImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  packageInfo: {
    marginLeft: 16,
    flex: 1,
  },
  packageName: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.black,
  },
  packageType: {
    fontSize: 14,
    color: COLORS.darkGray,
    marginBottom: 4,
  },
  packagePrice: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.primary,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.black,
    marginBottom: 16,
  },
  paymentMethods: {
    marginBottom: 24,
  },
  paymentMethodItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    borderRadius: 12,
    marginBottom: 12,
  },
  selectedMethod: {
    borderColor: COLORS.primary,
    backgroundColor: "rgba(85, 110, 230, 0.05)",
  },
  paymentMethodInfo: {
    marginLeft: 16,
    flex: 1,
  },
  paymentMethodTitle: {
    fontSize: 16,
    fontWeight: "500",
    color: COLORS.black,
    marginBottom: 4,
  },
  selectedMethodText: {
    color: COLORS.primary,
  },
  paymentMethodSubtitle: {
    fontSize: 14,
    color: COLORS.darkGray,
  },
  summaryContainer: {
    backgroundColor: "#F9FAFE",
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.black,
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 16,
    color: COLORS.darkGray,
  },
  summaryValue: {
    fontSize: 16,
    color: COLORS.black,
    fontWeight: "500",
  },
  discountValue: {
    fontSize: 16,
    color: "#4CAF50",
    fontWeight: "500",
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.lightGray,
    marginVertical: 12,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 4,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.black,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.primary,
  },
  secureMessage: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 100,
  },
  secureIcon: {
    marginRight: 8,
  },
  secureText: {
    fontSize: 14,
    color: COLORS.darkGray,
  },
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.white,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray,
  },
  proceedButton: {
    backgroundColor: COLORS.primary,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 14,
    borderRadius: 8,
  },
  proceedButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "600",
    marginRight: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.white,
    padding: 30,
  },
  loadingAnimation: {
    width: 200,
    height: 200,
  },
  loadingText: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.black,
    marginTop: 20,
    marginBottom: 8,
  },
  loadingSubtext: {
    fontSize: 16,
    color: COLORS.darkGray,
  },
})

export default PaymentMethodScreen
