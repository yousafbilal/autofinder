"use client"

import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { Ionicons } from "@expo/vector-icons"
import { COLORS } from "../../constants/colors"
import { useNavigation } from "@react-navigation/native"
import React from "react"

const CarRentalServiceScreen = () => {
  const navigation = useNavigation()

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.black} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Car On Rent</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <Image source={require("../../../assets/registeration.png")} style={styles.heroImage} resizeMode="contain" />

        <View style={styles.infoCard}>
          <Text style={styles.title}>Rent a Car with Ease</Text>
          <Text style={styles.description}>
            Need a car for a day, a week, or longer? Our car rental service offers a wide range of vehicles to suit your
            needs and budget. From economy cars to luxury vehicles, we have you covered.
          </Text>

          <View style={styles.benefitsContainer}>
            <Text style={styles.benefitsTitle}>Why Rent with Us:</Text>
            <View style={styles.benefitItem}>
              <Ionicons name="checkmark-circle" size={20} color={COLORS.primary} />
              <Text style={styles.benefitText}>Wide selection of well-maintained vehicles</Text>
            </View>
            <View style={styles.benefitItem}>
              <Ionicons name="checkmark-circle" size={20} color={COLORS.primary} />
              <Text style={styles.benefitText}>Competitive rates with no hidden fees</Text>
            </View>
            <View style={styles.benefitItem}>
              <Ionicons name="checkmark-circle" size={20} color={COLORS.primary} />
              <Text style={styles.benefitText}>Flexible pickup and drop-off locations</Text>
            </View>
            <View style={styles.benefitItem}>
              <Ionicons name="checkmark-circle" size={20} color={COLORS.primary} />
              <Text style={styles.benefitText}>24/7 roadside assistance for peace of mind</Text>
            </View>
            <View style={styles.benefitItem}>
              <Ionicons name="checkmark-circle" size={20} color={COLORS.primary} />
              <Text style={styles.benefitText}>Simple booking process with instant confirmation</Text>
            </View>
            <TouchableOpacity style={styles.button} onPress={() => navigation.navigate("RentServiceAd")}>
              <Text style={styles.buttonText}>Rent Your Car</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.processCard}>
          <Text style={styles.processTitle}>How It Works</Text>

          <View style={styles.processStep}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>1</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Choose Your Car</Text>
              <Text style={styles.stepDescription}>
                Browse our selection and select a vehicle that meets your needs.
              </Text>
            </View>
          </View>

          <View style={styles.processStep}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>2</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Book Your Rental</Text>
              <Text style={styles.stepDescription}>Select your pickup and return dates, and complete the booking.</Text>
            </View>
          </View>

          <View style={styles.processStep}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>3</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Pickup Your Car</Text>
              <Text style={styles.stepDescription}>
                Visit our location or request delivery to pick up your rental car.
              </Text>
            </View>
          </View>

          <View style={styles.processStep}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>4</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Enjoy Your Drive</Text>
              <Text style={styles.stepDescription}>
                Hit the road with confidence, knowing you have 24/7 support if needed.
              </Text>
            </View>
          </View>

          <View style={styles.processStep}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>5</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Return the Car</Text>
              <Text style={styles.stepDescription}>Return the vehicle at the agreed time and location.</Text>
            </View>
          </View>
        </View>

        <View style={styles.policiesCard}>
          <Text style={styles.policiesTitle}>Rental Policies</Text>

          <View style={styles.policyItem}>
            <Ionicons name="information-circle-outline" size={20} color={COLORS.primary} />
            <Text style={styles.policyText}>
              <Text style={styles.policyHighlight}>Age Requirement:</Text> Drivers must be at least 21 years old.
            </Text>
          </View>

          <View style={styles.policyItem}>
            <Ionicons name="information-circle-outline" size={20} color={COLORS.primary} />
            <Text style={styles.policyText}>
              <Text style={styles.policyHighlight}>Required Documents:</Text> Valid driver's license, credit card, and
              proof of insurance.
            </Text>
          </View>

          <View style={styles.policyItem}>
            <Ionicons name="information-circle-outline" size={20} color={COLORS.primary} />
            <Text style={styles.policyText}>
              <Text style={styles.policyHighlight}>Security Deposit:</Text> A refundable security deposit is required at
              pickup.
            </Text>
          </View>

          <View style={styles.policyItem}>
            <Ionicons name="information-circle-outline" size={20} color={COLORS.primary} />
            <Text style={styles.policyText}>
              <Text style={styles.policyHighlight}>Cancellation:</Text> Free cancellation up to 24 hours before pickup.
            </Text>
          </View>
        </View>

        <TouchableOpacity style={styles.button} onPress={() => navigation.navigate("RentalCarListScreen")}>
          <Text style={styles.buttonText}>Browse All Cars</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.black,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  heroImage: {
    width: "100%",
    height: 180,
    marginBottom: 16,
  },
  infoCard: {
    backgroundColor: COLORS.white,
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.black,
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    color: COLORS.darkGray,
    lineHeight: 22,
    marginBottom: 16,
  },
  benefitsContainer: {
    marginTop: 8,
  },
  benefitsTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.black,
    marginBottom: 12,
  },
  benefitItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  benefitText: {
    fontSize: 14,
    color: COLORS.darkGray,
    marginLeft: 10,
    flex: 1,
  },
  processCard: {
    backgroundColor: COLORS.white,
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  processTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.black,
    marginBottom: 16,
  },
  processStep: {
    flexDirection: "row",
    marginBottom: 16,
    alignItems: "flex-start",
  },
  stepNumber: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    marginTop: 2,
  },
  stepNumberText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "bold",
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.black,
    marginBottom: 4,
  },
  stepDescription: {
    fontSize: 14,
    color: COLORS.darkGray,
    lineHeight: 20,
  },
  carsSection: {
    backgroundColor: COLORS.white,
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  carsSectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.black,
    marginBottom: 16,
  },
  categoriesContainer: {
    marginBottom: 16,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.lightGray,
    marginRight: 8,
  },
  selectedCategoryButton: {
    backgroundColor: COLORS.primary,
  },
  categoryButtonText: {
    fontSize: 14,
    color: COLORS.darkGray,
  },
  selectedCategoryButtonText: {
    color: COLORS.white,
    fontWeight: "500",
  },
  carsList: {
    paddingTop: 8,
  },
  carCard: {
    backgroundColor: COLORS.white,
    borderRadius: 8,
    marginBottom: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  carImage: {
    width: "100%",
    height: 180,
    resizeMode: "cover",
  },
  carContent: {
    padding: 12,
  },
  carHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  carTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.black,
  },
  categoryBadge: {
    backgroundColor: COLORS.lightGray,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  categoryText: {
    fontSize: 12,
    color: COLORS.darkGray,
  },
  carDetails: {
    flexDirection: "row",
    marginBottom: 12,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 16,
  },
  detailText: {
    fontSize: 12,
    color: COLORS.darkGray,
    marginLeft: 4,
  },
  carFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray,
  },
  priceText: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.primary,
  },
  priceUnit: {
    fontSize: 14,
    fontWeight: "normal",
    color: COLORS.darkGray,
  },
  rentButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 4,
  },
  rentButtonText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: "600",
  },
  policiesCard: {
    backgroundColor: COLORS.white,
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  policiesTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.black,
    marginBottom: 16,
  },
  policyItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  policyText: {
    fontSize: 14,
    color: COLORS.darkGray,
    marginLeft: 10,
    flex: 1,
    lineHeight: 20,
  },
  policyHighlight: {
    fontWeight: "600",
    color: COLORS.black,
  },
  button: {
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 16,
  },
  buttonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "600",
  },
})

export default CarRentalServiceScreen
