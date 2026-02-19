import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { Ionicons } from "@expo/vector-icons"
import { COLORS } from "../../constants/colors"
import { useNavigation } from "@react-navigation/native"
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React from "react"
import { RootStackParamList } from "../../../navigationTypes"

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const SellBikeScreen = () => {
  const navigation = useNavigation<NavigationProp>();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.black} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Sell Your Bike</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
      <Image source={require("../../../assets/sell-bike.png")} style={styles.heroImage} resizeMode="contain" />
      
        <View style={styles.infoCard}>
            <Text style={styles.title}>Sell Your Bike with Ease</Text>
            <Text style={styles.description}>
            Ready to sell your bike? Our platform helps you find the perfect buyer and get the best price. Whether it's a used or new bike, we assist you every step of the way.
          </Text>

          <View style={styles.benefitsContainer}>
            <Text style={styles.benefitsTitle}>Why Sell with Us:</Text>
            <View style={styles.benefitItem}>
              <Ionicons name="checkmark-circle" size={20} color={COLORS.primary} />
              <Text style={styles.benefitText}>Get the best price for your bike</Text>
            </View>
            <View style={styles.benefitItem}>
              <Ionicons name="checkmark-circle" size={20} color={COLORS.primary} />
              <Text style={styles.benefitText}>Fast and secure transaction</Text>
            </View>
            <View style={styles.benefitItem}>
              <Ionicons name="checkmark-circle" size={20} color={COLORS.primary} />
              <Text style={styles.benefitText}>Hassle-free paperwork</Text>
            </View>
            <View style={styles.benefitItem}>
              <Ionicons name="checkmark-circle" size={20} color={COLORS.primary} />
              <Text style={styles.benefitText}>Access to a large network of buyers</Text>
            </View>
            <TouchableOpacity style={styles.button} onPress={() => navigation.navigate("PostBikeAd")}>
              <Text style={styles.buttonText}>Create Free Ad</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.upgradeCard}>
          <Text style={styles.upgradeTitle}>Want More Visibility?</Text>
          <Text style={styles.upgradeDescription}>
            Upgrade to a Premium Ad to get featured placement and sell your bike faster.
          </Text>
          <TouchableOpacity style={styles.upgradeButton} onPress={() => navigation.navigate("BikePackageSelection")}>
            <Ionicons name="star" size={20} color={COLORS.white} />
            <Text style={styles.upgradeButtonText}>Upgrade to Premium</Text>
          </TouchableOpacity>
        </View>

       <View style={styles.processCard}>
                 <Text style={styles.processTitle}>How It Works</Text>
       
                 <View style={styles.processStep}>
                   <View style={styles.stepNumber}>
                     <Text style={styles.stepNumberText}>1</Text>
                   </View>
                   <View style={styles.stepContent}>
                     <Text style={styles.stepTitle}>Submit Your Bike Details</Text>
                     <Text style={styles.stepDescription}>Fill out the form above with your bike details to start the selling process.</Text>
                   </View>
                 </View>
       
                 <View style={styles.processStep}>
                   <View style={styles.stepNumber}>
                     <Text style={styles.stepNumberText}>2</Text>
                   </View>
                   <View style={styles.stepContent}>
                     <Text style={styles.stepTitle}>Bike Evaluation</Text>
                     <Text style={styles.stepDescription}>Our experts will evaluate your bike and suggest an appropriate selling price.</Text>
                   </View>
                 </View>
       
                 <View style={styles.processStep}>
                   <View style={styles.stepNumber}>
                     <Text style={styles.stepNumberText}>3</Text>
                   </View>
                   <View style={styles.stepContent}>
                     <Text style={styles.stepTitle}>Buyer Matching</Text>
                     <Text style={styles.stepDescription}>We'll match you with interested buyers based on your bike's specifications.</Text>
                   </View>
                 </View>
       
                 <View style={styles.processStep}>
                   <View style={styles.stepNumber}>
                     <Text style={styles.stepNumberText}>4</Text>
                   </View>
                   <View style={styles.stepContent}>
                     <Text style={styles.stepTitle}>Negotiation & Sale</Text>
                     <Text style={styles.stepDescription}>Once a buyer is found, we handle the negotiation and paperwork for you.</Text>
                   </View>
                 </View>
       
                 <View style={styles.processStep}>
                   <View style={styles.stepNumber}>
                     <Text style={styles.stepNumberText}>5</Text>
                   </View>
                   <View style={styles.stepContent}>
                     <Text style={styles.stepTitle}>Payment & Delivery</Text>
                     <Text style={styles.stepDescription}>We ensure secure payment and deliver the bike to the buyer.</Text>
                   </View>
                 </View>
               </View>
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
  stepsCard: {
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
  stepsTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.black,
    marginBottom: 16,
  },
  stepItem: {
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
  upgradeCard: {
    backgroundColor: COLORS.white,
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  upgradeTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.black,
    marginBottom: 8,
  },
  upgradeDescription: {
    fontSize: 14,
    color: COLORS.darkGray,
    lineHeight: 20,
    marginBottom: 16,
  },
  upgradeButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
  },
  upgradeButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  heroImage: {
    width: "100%",
    height: 220,
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
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.black,
    marginBottom: 16,
  },
  processStep: {
    flexDirection: "row",
    marginBottom: 16,
  },
})

export default SellBikeScreen;
