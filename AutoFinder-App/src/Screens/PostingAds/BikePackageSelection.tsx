import React, { useState, useRef } from "react"
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { Ionicons } from "@expo/vector-icons"
import { COLORS } from "../../constants/colors"
import { bikePackages } from "../../Components/data/packagesData"
import { useNavigation } from "@react-navigation/native"
import { NavigationProp } from "@react-navigation/native"
import { RootStackParamList } from "../../../navigationTypes"

const BikePackageSelection = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>()
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null)
  const scrollViewRef = useRef<ScrollView>(null)

  const handlePackageSelect = (packageId: string) => {
    setSelectedPackage(packageId)
  }

  const handleContinue = () => {
    if (!selectedPackage) {
      Alert.alert("Select Package", "Please select a package to continue.")
      return
    }

    const packageData = bikePackages.find(pkg => pkg.id === selectedPackage)
    if (packageData) {
      Alert.alert(
        "Package Selected",
        `You have selected ${packageData.name}. You will be redirected to the payment page.`,
        [
          {
            text: "Cancel",
            style: "cancel"
          },
          {
            text: "Continue",
            onPress: () => {
              navigation.navigate("PostBikeAdFeatured", { 
                selectedPackage: packageData
              })
            }
          }
        ]
      )
    }
  }


  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.black} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Choose Your Package</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView 
        ref={scrollViewRef}
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.introSection}>
          <Text style={styles.introTitle}>Boost Your Bike Sales</Text>
          <Text style={styles.introSubtitle}>
            Choose a package that fits your needs and get your bike ads featured for maximum visibility
          </Text>
        </View>

        {/* Payment Info Section */}
        <View style={styles.paymentCard}>
          <Ionicons name="card-outline" size={28} color={COLORS.primary} style={{ marginBottom: 8 }} />
          <Text style={styles.paymentTitle}>Boost Your Bike Sales</Text>
          <Text style={styles.paymentDescription}>
            To activate your featured ad, you will need to{" "}
            <Text style={{ fontWeight: "600", color: COLORS.black }}>
              upload a valid payment receipt
            </Text>{" "}
            after filling in all your ad details.
          </Text>
          <View style={styles.paymentNote}>
            <Ionicons name="information-circle" size={18} color={COLORS.darkGray} />
            <Text style={styles.paymentNoteText}>
              Payment methods: Bank Transfer, EasyPaisa, JazzCash.
            </Text>
          </View>
        </View>

        <View style={styles.pricingCard}>
          <Text style={styles.pricingTitle}>Choose Your Package</Text>
          {bikePackages.map((pkg) => (
            <TouchableOpacity
              key={pkg.id}
              style={[
                styles.planCard,
                selectedPackage === pkg.id && styles.selectedPlanCard,
                pkg.popular && styles.recommendedPlan,
              ]}
              onPress={() => handlePackageSelect(pkg.id)}
            >
              {pkg.popular && (
                <View style={styles.recommendedBadge}>
                  <Text style={styles.recommendedText}>Most Popular</Text>
                </View>
              )}
              <Text style={styles.planTitle}>{pkg.name}</Text>
              <Text style={styles.planPrice}>PKR {pkg.discountedPrice}</Text>
              <Text style={styles.planDuration}>Valid for {pkg.validityDays} days</Text>
              <Text style={styles.planDescription}>{pkg.description}</Text>
              <View style={styles.featuresContainer}>
                {pkg.features.slice(0, 3).map((feature, index) => (
                  <View key={index} style={styles.featureItem}>
                    <Ionicons name="checkmark" size={16} color={COLORS.primary} />
                    <Text style={styles.featureText}>{feature}</Text>
                  </View>
                ))}
                {pkg.features.length > 3 && (
                  <Text style={styles.moreFeatures}>+{pkg.features.length - 3} more features</Text>
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.continueButtonContainer}>
          <TouchableOpacity
            style={[
              styles.continueButton,
              !selectedPackage && styles.continueButtonDisabled
            ]}
            onPress={handleContinue}
            disabled={!selectedPackage}
          >
            <Text style={[
              styles.continueButtonText,
              !selectedPackage && styles.continueButtonTextDisabled
            ]}>
              Continue to Ad Creation
            </Text>
            <Ionicons 
              name="arrow-forward" 
              size={20} 
              color={selectedPackage ? COLORS.white : COLORS.darkGray} 
            />
          </TouchableOpacity>
        </View>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
    fontWeight: 'bold',
    color: COLORS.black,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  introSection: {
    marginBottom: 24,
    alignItems: 'center',
  },
  introTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.black,
    marginBottom: 8,
    textAlign: 'center',
  },
  introSubtitle: {
    fontSize: 16,
    color: COLORS.darkGray,
    textAlign: 'center',
    lineHeight: 24,
  },
  paymentNote: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.lightGray,
    padding: 12,
    borderRadius: 8,
    marginBottom: 24,
  },
  paymentNoteText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: COLORS.black,
    lineHeight: 20,
  },
  pricingCard: {
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
  pricingTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.black,
    marginBottom: 16,
  },
  planCard: {
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    position: 'relative',
  },
  recommendedPlan: {
    borderColor: '#FFD700',
    borderWidth: 1,
    backgroundColor: '#FFF9E6',
  },
  selectedPlanCard: {
    backgroundColor: '#F9ECEC',
    borderColor: COLORS.primary,
    borderWidth: 2,
  },
  recommendedBadge: {
    position: 'absolute',
    top: -10,
    right: 16,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
  },
  recommendedText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '600',
  },
  planTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.black,
    marginBottom: 8,
  },
  planPrice: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 4,
  },
  planDuration: {
    fontSize: 14,
    color: COLORS.darkGray,
    marginBottom: 8,
  },
  planDescription: {
    fontSize: 14,
    color: COLORS.darkGray,
    lineHeight: 20,
    marginBottom: 12,
  },
  featuresContainer: {
    marginTop: 8,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  featureText: {
    marginLeft: 8,
    fontSize: 14,
    color: COLORS.black,
    flex: 1,
  },
  moreFeatures: {
    fontSize: 12,
    color: COLORS.primary,
    fontStyle: 'italic',
    marginTop: 4,
  },
  paymentCard: {
    backgroundColor: COLORS.white,
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    alignItems: 'center',
  },
  paymentTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.black,
    marginBottom: 8,
    textAlign: 'center',
  },
  paymentDescription: {
    fontSize: 14,
    color: COLORS.darkGray,
    lineHeight: 20,
    marginBottom: 12,
    textAlign: 'center',
  },
  continueButtonContainer: {
    paddingTop: 16,
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  continueButtonDisabled: {
    backgroundColor: COLORS.lightGray,
  },
  continueButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
  continueButtonTextDisabled: {
    color: COLORS.darkGray,
  },
})

export default BikePackageSelection
