"use client"

import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Animated } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { Ionicons } from "@expo/vector-icons"
import { COLORS } from "../../constants/colors"
import { useNavigation } from "@react-navigation/native"
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useState, useRef, useEffect } from "react"
import { RootStackParamList } from "../../../navigationTypes"
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const BuyCarForMeScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const scrollY = useRef(new Animated.Value(0)).current
  const scrollViewRef = useRef<ScrollView>(null)
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
  const [budget, setBudget] = useState("")
  const [carType, setCarType] = useState("")
  const [requirements, setRequirements] = useState("")

  return (
    <ScrollView ref={scrollViewRef} style={{ flex: 1 }}>
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.black} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Buy Car For Me</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <Image source={require("../../../assets/insurance.png")} style={styles.heroImage} resizeMode="contain" />

        <View style={styles.infoCard}>
          <Text style={styles.title}>Let Us Find Your Perfect Car</Text>
          <Text style={styles.description}>
            Don't have time to search for your ideal car? Our expert car hunters will find the perfect vehicle that
            matches your requirements and budget. We handle everything from searching to negotiating the best price.
          </Text>

          <View style={styles.benefitsContainer}>
            <Text style={styles.benefitsTitle}>Why Choose Our Service:</Text>
            <View style={styles.benefitItem}>
              <Ionicons name="checkmark-circle" size={20} color={COLORS.primary} />
              <Text style={styles.benefitText}>Save time and avoid the hassle of car hunting</Text>
            </View>
            <View style={styles.benefitItem}>
              <Ionicons name="checkmark-circle" size={20} color={COLORS.primary} />
              <Text style={styles.benefitText}>Expert negotiation to get the best price</Text>
            </View>
            <View style={styles.benefitItem}>
              <Ionicons name="checkmark-circle" size={20} color={COLORS.primary} />
              <Text style={styles.benefitText}>Thorough vehicle inspection and history check</Text>
            </View>
            <View style={styles.benefitItem}>
              <Ionicons name="checkmark-circle" size={20} color={COLORS.primary} />
              <Text style={styles.benefitText}>Personalized service tailored to your needs</Text>
            </View>
            <View style={styles.benefitItem}>
              <Ionicons name="checkmark-circle" size={20} color={COLORS.primary} />
              <Text style={styles.benefitText}>Paperwork and delivery assistance</Text>
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
              <Text style={styles.stepTitle}>Share Your Requirements</Text>
              <Text style={styles.stepDescription}>
                Tell us about your ideal car, budget, and any specific features you're looking for.
              </Text>
            </View>
          </View>

          <View style={styles.processStep}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>2</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Car Hunting</Text>
              <Text style={styles.stepDescription}>
                Our experts search the market to find vehicles that match your criteria.
              </Text>
            </View>
          </View>

          <View style={styles.processStep}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>3</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Vehicle Shortlisting</Text>
              <Text style={styles.stepDescription}>
                We present you with a curated list of options that meet your requirements.
              </Text>
            </View>
          </View>

          <View style={styles.processStep}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>4</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Inspection & Negotiation</Text>
              <Text style={styles.stepDescription}>
                Once you select a car, we inspect it thoroughly and negotiate the best price.
              </Text>
            </View>
          </View>

          <View style={styles.processStep}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>5</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Purchase & Delivery</Text>
              <Text style={styles.stepDescription}>
                We handle the paperwork and arrange for the delivery of your new car.
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.pricingCard}>
  <Text style={styles.pricingTitle}>Service Fee</Text>
  <Text style={styles.pricingDescription}>
    Our service fee for your car listing:
  </Text>

  <View style={styles.feeItem}>
    <Text style={styles.feeTitle}>Initial Payment</Text>
    <Text style={styles.feeAmount}>PKR 5,000</Text>
  </View>

  <View style={styles.feeItem}>
    <Text style={styles.feeTitle}>Commission</Text>
    <Text style={styles.feeAmount}>1% of sale price</Text>
  </View>

  <Text style={[styles.feeNote, { marginTop: 10 }]}>
    Note: Once you agree to the eligibility and make a payment, a refund request will not be entertained.
  </Text>
</View>

<TouchableOpacity style={styles.button} onPress={() => navigation.navigate("BuyCarforMe")}>
  <Text style={styles.buttonText}>Add Request</Text>
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
  formCard: {
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
  formTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.black,
    marginBottom: 16,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: COLORS.black,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  textArea: {
    height: 100,
    textAlignVertical: "top",
  },
  pricingCard: {
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
  pricingTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.black,
    marginBottom: 8,
  },
  pricingDescription: {
    fontSize: 14,
    color: COLORS.darkGray,
    marginBottom: 16,
  },
  feeItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  feeTitle: {
    fontSize: 14,
    color: COLORS.black,
  },
  feeAmount: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.primary,
  },
  feeNote: {
    fontSize: 12,
    color: COLORS.darkGray,
    fontStyle: "italic",
    marginTop: 12,
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
  
})

export default BuyCarForMeScreen
