import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Animated } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { Ionicons } from "@expo/vector-icons"
import { COLORS } from "../../constants/colors"
import { useNavigation } from "@react-navigation/native"
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../../navigationTypes"
import React, { useState, useRef, useEffect } from "react"


type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const ListItForYouScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const scrollY = useRef(new Animated.Value(0)).current
  const scrollViewRef = useRef<ScrollView>(null)
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  useEffect(() => {
      let scrollToValue = 2000 // change this depending on your content height
      Animated.timing(scrollY, {
        toValue: scrollToValue,
        duration: 1500, // bigger = slower (2 seconds)
        useNativeDriver: false,
      }).start()
  
      scrollY.addListener(({ value }) => {
        scrollViewRef.current?.scrollTo({ y: value, animated: false })
      })
  
      return () => scrollY.removeAllListeners()
    }, [])
  
    const packages = [
      {
        id: "Basic",
        title: "Basic Package",
        price: "PKR 1800",
        description: "Listing creation and basic support...",
        features: [
          "Up to 1000 cc",
          "Listing creation",
          "Basic photo editing",
          "Inquiry forwarding"
        ],
        recommended: false,
      },
      {
        id: "Standard",
        title: "Standard Package",
        price: "PKR 4000",
        description: "Essential listing services...",
        features: [
          "1001 cc – 2000 cc",
          "Professional photography",
          "Standard listing placement",
          "Inquiry management"
        ],
        recommended: true,
      },
      {
        id: "Premium",
        title: "Premium Package",
        price: "PKR 5500",
        description: "Full-service listing management...",
        features: [
          "2001cc OR SUV’s, 4X4, Jeeps and German cars",
          "Professional photography",
          "Featured listing placement",
          "Dedicated listing agent",
          "Paperwork assistance"
        ],
        recommended: false,
      }
    ];
  
    const handleSelect = (pkgId: string) => {
      setSelectedPackage(pkgId);
    };
  
    const handleContinue = () => {
      const selected = packages.find(pkg => pkg.id === selectedPackage);
      if (selected) {
        navigation.navigate("ListItforyou", { selectedPackage: selected });
      }
    };

  return (
    <ScrollView ref={scrollViewRef} style={{ flex: 1 }}>
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.black} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>List It For You</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <Image
          source={require("../../../assets/list it for  you/listitforyou.jpg")}
          style={styles.heroImage}
          resizeMode="contain"
        />

        <View style={styles.infoCard}>
          <Text style={styles.title}>Let Us Handle Your Car Listing</Text>
          <Text style={styles.description}>
            Don't have time to create and manage your car listing? Our team of experts will handle everything for you,
            from professional photography to managing inquiries and negotiating with potential buyers.
          </Text>

          <View style={styles.benefitsContainer}>
            <Text style={styles.benefitsTitle}>What We Offer:</Text>
            <View style={styles.benefitItem}>
              <Ionicons name="checkmark-circle" size={20} color={COLORS.primary} />
              <Text style={styles.benefitText}>Professional photography and listing creation</Text>
            </View>
            <View style={styles.benefitItem}>
              <Ionicons name="checkmark-circle" size={20} color={COLORS.primary} />
              <Text style={styles.benefitText}>Market analysis and optimal pricing strategy</Text>
            </View>
            <View style={styles.benefitItem}>
              <Ionicons name="checkmark-circle" size={20} color={COLORS.primary} />
              <Text style={styles.benefitText}>Handling all buyer inquiries and scheduling viewings</Text>
            </View>
            <View style={styles.benefitItem}>
              <Ionicons name="checkmark-circle" size={20} color={COLORS.primary} />
              <Text style={styles.benefitText}>Negotiation support to get the best price</Text>
            </View>
            <View style={styles.benefitItem}>
              <Ionicons name="checkmark-circle" size={20} color={COLORS.primary} />
              <Text style={styles.benefitText}>Paperwork assistance for a smooth transaction</Text>
            </View>
          </View>
        </View>

        <View style={styles.processCard}>
          <Text style={styles.processTitle}>How It Works</Text>

          <View style={styles.processStep}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>1</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Initial Consultation</Text>
              <Text style={styles.stepDescription}>
                Schedule a consultation with our team to discuss your vehicle and selling goals.
              </Text>
            </View>
          </View>

          <View style={styles.processStep}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>2</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Vehicle Assessment</Text>
              <Text style={styles.stepDescription}>
                Our experts will inspect your vehicle and determine the optimal listing price.
              </Text>
            </View>
          </View>

          <View style={styles.processStep}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>3</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Professional Listing</Text>
              <Text style={styles.stepDescription}>
                We'll create a compelling listing with professional photos and detailed description.
              </Text>
            </View>
          </View>

          <View style={styles.processStep}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>4</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Managed Inquiries</Text>
              <Text style={styles.stepDescription}>
                Our team handles all buyer communications and schedules viewings at your convenience.
              </Text>
            </View>
          </View>

          <View style={styles.processStep}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>5</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Sale Completion</Text>
              <Text style={styles.stepDescription}>
                We assist with negotiations and paperwork to finalize the sale successfully.
              </Text>
            </View>
          </View>
        </View>
        <View style={styles.processCard}>
  <Ionicons name="cash-outline" size={28} color={COLORS.primary} style={{ marginBottom: 8 }} />
  <Text style={styles.commissionTitle}>Commission</Text>
  <Text style={styles.commissionDescription}>
    Initial payment starting from{" "}
    <Text style={{ fontWeight: "600", color: COLORS.black }}>PKR 2,000</Text> will be charged for
    inspection depending upon your car make and model at the time of on-boarding.
  </Text>
  <Text style={styles.commissionDescription}>
    <Text style={{ fontWeight: "600", color: COLORS.black }}>1% commission</Text> will be charged at
    the time of selling your car.
  </Text>
</View>
        {/* Payment Info Section */}
        <View style={styles.paymentCard}>
          <Ionicons name="card-outline" size={28} color={COLORS.primary} style={{ marginBottom: 8 }} />
          <Text style={styles.paymentTitle}>Payment Information</Text>
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
          <Text style={styles.pricingTitle}>Service Packages</Text>
          <View style={styles.noteContainer}>
    <Text style={styles.noteText}>
      Once you agree to the eligibility, document requirements and make a payment, a refund request will not 
      be entertained.
    </Text>
  </View>

         {packages.map((pkg) => (
                   <TouchableOpacity
                     key={pkg.id}
                     style={[
                       styles.packageCard,
                       selectedPackage === pkg.id && styles.selectedPlanCard,
                     ]}
                     onPress={() => handleSelect(pkg.id)}
                   >
                    {pkg.recommended && (
                                    <View style={styles.recommendedBadge}>
                                      <Text style={styles.recommendedText}>Recommended</Text>
                                    </View>
                                  )}
                     <Text style={styles.packageTitle}>{pkg.title}</Text>
                     <Text style={styles.packagePrice}>{pkg.price}</Text>
                     <Text style={styles.packageDescription}>{pkg.description}</Text>
                     {pkg.features.map((feat, index) => (
                       <View key={index} style={styles.packageFeatureItem}>
                         <Ionicons name="checkmark" size={16} color={COLORS.primary} />
                         <Text style={styles.packageFeatureText}>{feat}</Text>
                       </View>
                     ))}
                   </TouchableOpacity>
                 ))}
        </View>

        <TouchableOpacity
                  style={[styles.button, { opacity: selectedPackage ? 1 : 0.5 }]}
                  disabled={!selectedPackage}
                  onPress={handleContinue}
                >
                  <Text style={styles.buttonText}>Schedule Consultation</Text>
                </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
    </ScrollView>
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
    height: 220,
    marginBottom: 20,
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
    fontWeight: "bold",
    color: COLORS.black,
    marginBottom: 16,
  },
  packageCard: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    position: "relative",
  },
  recommendedPackage: {
    borderColor: COLORS.primary,
    borderWidth: 2,
  },
  recommendedBadge: {
    position: "absolute",
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
    fontWeight: "600",
  },
  packageTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.black,
    marginBottom: 8,
  },
  packagePrice: {
    fontSize: 24,
    fontWeight: "bold",
    color: COLORS.primary,
    marginBottom: 8,
  },
  packageDescription: {
    fontSize: 14,
    color: COLORS.darkGray,
    lineHeight: 20,
    marginBottom: 12,
  },
  packageFeatures: {
    marginTop: 8,
  },
  packageFeatureItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  packageFeatureText: {
    fontSize: 14,
    color: COLORS.darkGray,
    marginLeft: 8,
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
  selectedPlanCard: {
      backgroundColor: "#F9ECEC",
      borderColor: COLORS.primary,
      borderWidth: 2,
    },
    paymentCard: {
  backgroundColor: COLORS.white,
  borderRadius: 8,
  padding: 16,
  marginBottom: 16,
  shadowColor: COLORS.black,
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.08,
  shadowRadius: 3,
  elevation: 1,
  borderLeftWidth: 4,
  borderLeftColor: COLORS.primary,
},
paymentTitle: {
  fontSize: 16,
  fontWeight: "bold",
  color: COLORS.black,
  marginBottom: 6,
},
paymentDescription: {
  fontSize: 14,
  color: COLORS.darkGray,
  lineHeight: 20,
  marginBottom: 10,
},
paymentNote: {
  flexDirection: "row",
  alignItems: "center",
  backgroundColor: "#F4F6F8",
  padding: 8,
  borderRadius: 6,
},
paymentNoteText: {
  fontSize: 13,
  color: COLORS.darkGray,
  marginLeft: 6,
},
commissionTitle: {
  fontSize: 18,
  fontWeight: "bold",
  color: COLORS.black,
  marginBottom: 8,
},
commissionDescription: {
  fontSize: 14,
  color: COLORS.darkGray,
  lineHeight: 20,
  marginBottom: 6,
},
noteContainer: {
  backgroundColor: '#f9f9f9',
  padding: 10,
  borderRadius: 8,
  marginBottom: 15,
},
noteText: {
  fontSize: 13,
  color: '#555',
  textAlign: 'center',
  lineHeight: 18,
},



})

export default ListItForYouScreen
