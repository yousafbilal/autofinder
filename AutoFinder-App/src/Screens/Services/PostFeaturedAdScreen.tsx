import React, { useState, useRef, useEffect } from "react"
import { View, Text, StyleSheet, ScrollView, Animated, TouchableOpacity } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { Ionicons } from "@expo/vector-icons"
import { COLORS } from "../../constants/colors"
import { useNavigation } from "@react-navigation/native"
import { NativeStackNavigationProp } from "@react-navigation/native-stack"
import { RootStackParamList } from "../../../navigationTypes"
import PackagesService from "../../services/packagesService"
import AsyncStorage from "@react-native-async-storage/async-storage"

type NavigationProp = NativeStackNavigationProp<RootStackParamList>

const PostFeaturedAdScreen = () => {
  const navigation = useNavigation<NavigationProp>()
  const scrollY = useRef(new Animated.Value(0)).current
  const scrollViewRef = useRef<ScrollView>(null)
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null)
  useEffect(() => {
    let scrollToValue = 1000 // change this depending on your content height
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

  const handlePlanSelect = (plan: string) => {
    setSelectedPlan(plan)
  }

  const isSelected = (plan: string) => selectedPlan === plan

  return (
    <ScrollView ref={scrollViewRef} style={{ flex: 1 }}>
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.black} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Post Premium Ad</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {/* Info Section */}
        <View style={styles.infoCard}>
          <Text style={styles.title}>Get More Visibility with Featured Ads</Text>
          <Text style={styles.description}>
            Featured ads appear at the top of search results and get 5x more views than regular ads. Sell your car
            faster with premium placement.
          </Text>

          <View style={styles.benefitsContainer}>
            <Text style={styles.benefitsTitle}>Benefits:</Text>
            {[
              "Premium placement in search results",
              "Featured tag for better visibility",
              "Up to 5x more views than regular ads",
              "Priority customer support",
            ].map((benefit, idx) => (
              <View key={idx} style={styles.benefitItem}>
                <Ionicons name="checkmark-circle" size={20} color={COLORS.primary} />
                <Text style={styles.benefitText}>{benefit}</Text>
              </View>
            ))}
          </View>
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


        {/* Plans Section */}
        <View style={styles.pricingCard}>
          <Text style={styles.pricingTitle}>Pricing Plans</Text>
          <Text style={styles.paymentInlineNote}>
            Note: After completing ad details, you must upload a payment receipt (Bank Transfer, EasyPaisa, JazzCash).
          </Text>

          {[
            {
              key: "Basic",
              title: "Basic",
              price: "PKR 1500",
              duration: "7 days",
              description: "Featured placement for 7 days with basic visibility benefits.",
              recommended: false,
            },
            {
              key: "Standard",
              title: "Standard",
              price: "PKR 2250",
              duration: "15 days",
              description: "Featured placement for 14 days with standard visibility benefits.",
              recommended: true,
            },
            {
              key: "Premium",
              title: "Premium",
              price: "PKR 3150",
              duration: "30 days",
              description: "Featured placement for 30 days with all premium benefits included.",
              recommended: false,
            },
          ].map((plan) => (
            <TouchableOpacity
              key={plan.key}
              style={[
                styles.planCard,
                isSelected(plan.key) && styles.selectedPlanCard,
              ]}
              onPress={() => handlePlanSelect(plan.key)}
            >
              {plan.recommended && (
                <View style={styles.recommendedBadge}>
                  <Text style={styles.recommendedText}>Recommended</Text>
                </View>
              )}
              <Text style={styles.planTitle}>{plan.title}</Text>
              <Text style={styles.planPrice}>{plan.price}</Text>
              <Text style={styles.planDuration}>{plan.duration}</Text>
              <Text style={styles.planDescription}>{plan.description}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.button, { opacity: selectedPlan ? 1 : 0.5 }]}
          disabled={!selectedPlan}
          onPress={async () => {
            try {
              // Save selection as a simple purchase with expiry
              const storedUser = await AsyncStorage.getItem('user');
              const parsedUser = storedUser ? JSON.parse(storedUser) : null;
              const userId = parsedUser?._id || parsedUser?.userId;
              if (userId && selectedPlan) {
                await PackagesService.createSimplePurchase({ userId, plan: selectedPlan as any });
              }
            } catch {}
            navigation.navigate("PostCarAdFeatured", { selectedPackage: selectedPlan })
          }}
        >
          <Text style={styles.buttonText}>Continue</Text>
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
  planCard: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    position: "relative",
  },
  recommendedPlan: {
    borderColor: '#FFD700',
    borderWidth: 1,
    backgroundColor: '#FFF9E6',
  },
  selectedPlanCard: {
    backgroundColor: "#F9ECEC",
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
  planTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.black,
    marginBottom: 8,
  },
  planPrice: {
    fontSize: 24,
    fontWeight: "bold",
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
  paymentInlineNote: {
    fontSize: 12,
    color: COLORS.darkGray,
    marginBottom: 12,
  },

})

export default PostFeaturedAdScreen
