import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated, Image } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons"
import { COLORS } from "../../constants/colors"
import { useNavigation } from "@react-navigation/native"
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useState, useRef, useEffect } from "react"
import { RootStackParamList } from "../../../navigationTypes"

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const CarInspectionScreen = () => {
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
          id: "Silver",
          title: "Silver Whispers Package",
          price: "PKR 3200",
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
          id: "Diamond",
          title: "Diamond Delight package",
          price: "PKR 4250",
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
          id: "Platinum",
          title: "Platinum Prestige package",
          price: "PKR 6500",
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
          navigation.navigate("CarInspection", { selectedPackage: selected });
        }
      };

  return (
    <ScrollView ref={scrollViewRef} style={{ flex: 1 }}>
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.black} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Car Inspection</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <Image
          source={require("../../../assets/inspection.png")}
          style={styles.heroImage}
          resizeMode="contain"
        />

        <View style={styles.infoCard}>
          <Text style={styles.title}>Professional Car Inspection Service</Text>
          <Text style={styles.description}>
            Before buying a used car, make sure it's in good condition. Our certified mechanics will perform a
            comprehensive inspection to identify any potential issues and provide you with a detailed report.
          </Text>

          <View style={styles.benefitsContainer}>
            <Text style={styles.benefitsTitle}>Why Get an Inspection:</Text>
            <View style={styles.benefitItem}>
              <Ionicons name="checkmark-circle" size={20} color={COLORS.primary} />
              <Text style={styles.benefitText}>Avoid buying a car with hidden problems</Text>
            </View>
            <View style={styles.benefitItem}>
              <Ionicons name="checkmark-circle" size={20} color={COLORS.primary} />
              <Text style={styles.benefitText}>Get an unbiased assessment of the vehicle's condition</Text>
            </View>
            <View style={styles.benefitItem}>
              <Ionicons name="checkmark-circle" size={20} color={COLORS.primary} />
              <Text style={styles.benefitText}>Use the inspection report to negotiate a better price</Text>
            </View>
            <View style={styles.benefitItem}>
              <Ionicons name="checkmark-circle" size={20} color={COLORS.primary} />
              <Text style={styles.benefitText}>Peace of mind before making a significant investment</Text>
            </View>
          </View>
        </View>

        <View style={styles.inspectionCard}>
          <Text style={styles.inspectionTitle}>What We Inspect</Text>

          <View style={styles.inspectionRow}>
            <View style={styles.inspectionItem}>
              <MaterialCommunityIcons name="engine" size={32} color={COLORS.primary} />
              <Text style={styles.inspectionItemTitle}>Engine</Text>
              <Text style={styles.inspectionItemDesc}>Performance, leaks, and overall condition</Text>
            </View>

            <View style={styles.inspectionItem}>
              <MaterialCommunityIcons name="car-brake-abs" size={32} color={COLORS.primary} />
              <Text style={styles.inspectionItemTitle}>Brakes</Text>
              <Text style={styles.inspectionItemDesc}>Pads, rotors, and brake fluid</Text>
            </View>
          </View>

          <View style={styles.inspectionRow}>
            <View style={styles.inspectionItem}>
              <MaterialCommunityIcons name="car-traction-control" size={32} color={COLORS.primary} />
              <Text style={styles.inspectionItemTitle}>Suspension</Text>
              <Text style={styles.inspectionItemDesc}>Shocks, struts, and alignment</Text>
            </View>

            <View style={styles.inspectionItem}>
              <MaterialCommunityIcons name="car-battery" size={32} color={COLORS.primary} />
              <Text style={styles.inspectionItemTitle}>Electrical</Text>
              <Text style={styles.inspectionItemDesc}>Battery, alternator, and systems</Text>
            </View>
          </View>

          <View style={styles.inspectionRow}>
            <View style={styles.inspectionItem}>
              <MaterialCommunityIcons name="car-turbocharger" size={32} color={COLORS.primary} />
              <Text style={styles.inspectionItemTitle}>Transmission</Text>
              <Text style={styles.inspectionItemDesc}>Shifting, fluid, and clutch</Text>
            </View>

            <View style={styles.inspectionItem}>
              <MaterialCommunityIcons name="car-door" size={32} color={COLORS.primary} />
              <Text style={styles.inspectionItemTitle}>Body</Text>
              <Text style={styles.inspectionItemDesc}>Rust, damage, and paint condition</Text>
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
              <Text style={styles.stepTitle}>Book an Inspection</Text>
              <Text style={styles.stepDescription}>
                Schedule an inspection appointment at your preferred location and time.
              </Text>
            </View>
          </View>

          <View style={styles.processStep}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>2</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Inspection Process</Text>
              <Text style={styles.stepDescription}>
                Our certified mechanic will perform a comprehensive 150-point inspection of the vehicle.
              </Text>
            </View>
          </View>

          <View style={styles.processStep}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>3</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Detailed Report</Text>
              <Text style={styles.stepDescription}>
                Receive a detailed inspection report with photos and recommendations.
              </Text>
            </View>
          </View>

          <View style={styles.processStep}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>4</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Expert Consultation</Text>
              <Text style={styles.stepDescription}>
                Discuss the findings with our mechanic and get advice on the vehicle's condition.
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.pricingCard}>
                  <Text style={styles.pricingTitle}>Inspection Packages</Text>
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

        <TouchableOpacity style={styles.button} onPress={() => navigation.navigate("CarInspection")}>
          <Text style={styles.buttonText}>Book Inspection</Text>
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
  inspectionCard: {
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
  inspectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.black,
    marginBottom: 16,
  },
  inspectionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  inspectionItem: {
    width: "48%",
    backgroundColor: COLORS.lightGray,
    borderRadius: 8,
    padding: 12,
    alignItems: "center",
  },
  inspectionItemTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.black,
    marginTop: 8,
    marginBottom: 4,
  },
  inspectionItemDesc: {
    fontSize: 12,
    color: COLORS.darkGray,
    textAlign: "center",
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
selectedPlanCard: {
      backgroundColor: "#F9ECEC",
      borderColor: COLORS.primary,
      borderWidth: 2,
    },
})

export default CarInspectionScreen
