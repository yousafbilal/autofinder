import React, { useState } from "react"
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Linking, Alert } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { Ionicons, MaterialIcons, FontAwesome } from "@expo/vector-icons"
import { COLORS } from "../constants/colors"
import { useNavigation } from "@react-navigation/native"

const CallUsPage = () => {
  const navigation = useNavigation()
  const [expandedFaq, setExpandedFaq] = useState(null)

  const toggleFaq = (id) => {
    if (expandedFaq === id) {
      setExpandedFaq(null)
    } else {
      setExpandedFaq(id)
    }
  }

  const handleCall = (phoneNumber) => {
    Linking.openURL(`tel:${phoneNumber}`).catch(() => {
      Alert.alert("Error", "Could not open phone app")
    })
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.black} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Call Us</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.heroSection}>
          <View style={styles.heroIconContainer}>
            <Ionicons name="call" size={40} color={COLORS.white} />
          </View>
          <Text style={styles.heroTitle}>We're here to help</Text>
          <Text style={styles.heroSubtitle}>Our customer support team is available Monday to Friday, 9 AM to 6 PM</Text>
        </View>

        <View style={styles.contactCardsContainer}>
          <TouchableOpacity style={styles.contactCard} onPress={() => handleCall("15551234567")}>
            <View style={[styles.contactCardIcon, { backgroundColor: COLORS.primary }]}>
              <Ionicons name="headset" size={24} color={COLORS.white} />
            </View>
            <View style={styles.contactCardContent}>
              <Text style={styles.contactCardTitle}>Customer Support</Text>
              <Text style={styles.contactCardPhone}>+1 (555) 123-4567</Text>
              <Text style={styles.contactCardHours}>Mon-Fri, 9 AM - 6 PM</Text>
            </View>
            <View style={styles.callButtonContainer}>
              <TouchableOpacity style={styles.callButton} onPress={() => handleCall("15551234567")}>
                <Ionicons name="call" size={20} color={COLORS.white} />
              </TouchableOpacity>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.contactCard} onPress={() => handleCall("15559876543")}>
            <View style={[styles.contactCardIcon, { backgroundColor: "#4CAF50" }]}>
              <MaterialIcons name="support-agent" size={24} color={COLORS.white} />
            </View>
            <View style={styles.contactCardContent}>
              <Text style={styles.contactCardTitle}>Technical Support</Text>
              <Text style={styles.contactCardPhone}>+1 (555) 987-6543</Text>
              <Text style={styles.contactCardHours}>Mon-Fri, 9 AM - 6 PM</Text>
            </View>
            <View style={styles.callButtonContainer}>
              <TouchableOpacity style={styles.callButton} onPress={() => handleCall("15559876543")}>
                <Ionicons name="call" size={20} color={COLORS.white} />
              </TouchableOpacity>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.contactCard} onPress={() => handleCall("18005551234")}>
            <View style={[styles.contactCardIcon, { backgroundColor: "#FF9800" }]}>
              <FontAwesome name="dollar" size={24} color={COLORS.white} />
            </View>
            <View style={styles.contactCardContent}>
              <Text style={styles.contactCardTitle}>Billing Inquiries</Text>
              <Text style={styles.contactCardPhone}>+1 (800) 555-1234</Text>
              <Text style={styles.contactCardHours}>Mon-Fri, 9 AM - 5 PM</Text>
            </View>
            <View style={styles.callButtonContainer}>
              <TouchableOpacity style={styles.callButton} onPress={() => handleCall("18005551234")}>
                <Ionicons name="call" size={20} color={COLORS.white} />
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.divider} />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Before You Call</Text>
          <Text style={styles.sectionDescription}>
            Here are some frequently asked questions that might help you resolve your issue quickly:
          </Text>

          <View style={styles.faqContainer}>
            <TouchableOpacity style={styles.faqItem} onPress={() => toggleFaq(1)}>
              <View style={styles.faqHeader}>
                <Text style={styles.faqQuestion}>How do I reset my password?</Text>
                <Ionicons name={expandedFaq === 1 ? "chevron-up" : "chevron-down"} size={20} color={COLORS.darkGray} />
              </View>
              {expandedFaq === 1 && (
                <Text style={styles.faqAnswer}>
                  You can reset your password by going to the Login screen and tapping on "Forgot Password". Follow the
                  instructions sent to your email to create a new password.
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.faqItem} onPress={() => toggleFaq(2)}>
              <View style={styles.faqHeader}>
                <Text style={styles.faqQuestion}>How do I post a car for sale?</Text>
                <Ionicons name={expandedFaq === 2 ? "chevron-up" : "chevron-down"} size={20} color={COLORS.darkGray} />
              </View>
              {expandedFaq === 2 && (
                <Text style={styles.faqAnswer}>
                  To post a car for sale, go to the Sell tab and select "Post Ad". Fill in all the required details
                  about your vehicle and upload clear photos. Once complete, submit your listing for review.
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.faqItem} onPress={() => toggleFaq(3)}>
              <View style={styles.faqHeader}>
                <Text style={styles.faqQuestion}>How do I edit my listing?</Text>
                <Ionicons name={expandedFaq === 3 ? "chevron-up" : "chevron-down"} size={20} color={COLORS.darkGray} />
              </View>
              {expandedFaq === 3 && (
                <Text style={styles.faqAnswer}>
                  To edit your listing, go to your Profile, select "My Ads", find the listing you want to edit, and tap
                  on the "Edit" button. Make your changes and save them.
                </Text>
              )}
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.viewAllFaqButton} onPress={() => navigation.navigate("FAQ")}>
            <Text style={styles.viewAllFaqButtonText}>View All FAQs</Text>
            <Ionicons name="chevron-forward" size={16} color={COLORS.primary} />
          </TouchableOpacity>
        </View>

        <View style={styles.alternativeContactSection}>
          <Text style={styles.alternativeContactTitle}>Other ways to reach us</Text>

          <TouchableOpacity style={styles.alternativeContactItem} onPress={() => navigation.navigate("SupportPage")}>
            <View style={[styles.alternativeContactIcon, { backgroundColor: "#2196F3" }]}>
              <Ionicons name="chatbubble-ellipses" size={20} color={COLORS.white} />
            </View>
            <View style={styles.alternativeContactInfo}>
              <Text style={styles.alternativeContactLabel}>Contact Support</Text>
              <Text style={styles.alternativeContactValue}>Submit a support ticket</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={COLORS.darkGray} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.alternativeContactItem}>
            <View style={[styles.alternativeContactIcon, { backgroundColor: "#9C27B0" }]}>
              <Ionicons name="mail" size={20} color={COLORS.white} />
            </View>
            <View style={styles.alternativeContactInfo}>
              <Text style={styles.alternativeContactLabel}>Email</Text>
              <Text style={styles.alternativeContactValue}>support@autofinder.com</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={COLORS.darkGray} />
          </TouchableOpacity>
        </View>

        <View style={styles.officeHoursSection}>
          <Text style={styles.officeHoursTitle}>Office Hours</Text>
          <View style={styles.officeHoursItem}>
            <Text style={styles.officeHoursDay}>Monday - Friday</Text>
            <Text style={styles.officeHoursTime}>9:00 AM - 6:00 PM</Text>
          </View>
          <View style={styles.officeHoursItem}>
            <Text style={styles.officeHoursDay}>Saturday</Text>
            <Text style={styles.officeHoursTime}>10:00 AM - 4:00 PM</Text>
          </View>
          <View style={styles.officeHoursItem}>
            <Text style={styles.officeHoursDay}>Sunday</Text>
            <Text style={styles.officeHoursTime}>Closed</Text>
          </View>
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.lightGray,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.black,
  },
  content: {
    flex: 1,
  },
  heroSection: {
    alignItems: "center",
    padding: 24,
    backgroundColor: "#F5F5F5",
  },
  heroIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: COLORS.black,
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 14,
    color: COLORS.darkGray,
    textAlign: "center",
  },
  contactCardsContainer: {
    padding: 16,
  },
  contactCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  contactCardIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  contactCardContent: {
    flex: 1,
  },
  contactCardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.black,
    marginBottom: 4,
  },
  contactCardPhone: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.primary,
    marginBottom: 4,
  },
  contactCardHours: {
    fontSize: 12,
    color: COLORS.darkGray,
  },
  callButtonContainer: {
    marginLeft: 8,
  },
  callButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  divider: {
    height: 8,
    backgroundColor: "#F5F5F5",
    marginVertical: 8,
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.black,
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: COLORS.darkGray,
    marginBottom: 16,
  },
  faqContainer: {
    marginTop: 8,
  },
  faqItem: {
    backgroundColor: "#F5F5F5",
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
  },
  faqHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  faqQuestion: {
    fontSize: 16,
    fontWeight: "500",
    color: COLORS.black,
    flex: 1,
  },
  faqAnswer: {
    fontSize: 14,
    color: COLORS.darkGray,
    marginTop: 12,
    lineHeight: 20,
  },
  viewAllFaqButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
  },
  viewAllFaqButtonText: {
    fontSize: 16,
    color: COLORS.primary,
    fontWeight: "500",
    marginRight: 4,
  },
  alternativeContactSection: {
    padding: 16,
    backgroundColor: "#F5F5F5",
  },
  alternativeContactTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.black,
    marginBottom: 16,
  },
  alternativeContactItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  alternativeContactIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  alternativeContactInfo: {
    flex: 1,
  },
  alternativeContactLabel: {
    fontSize: 14,
    color: COLORS.darkGray,
  },
  alternativeContactValue: {
    fontSize: 16,
    color: COLORS.black,
    fontWeight: "500",
  },
  officeHoursSection: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray,
  },
  officeHoursTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.black,
    marginBottom: 16,
  },
  officeHoursItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  officeHoursDay: {
    fontSize: 16,
    color: COLORS.black,
  },
  officeHoursTime: {
    fontSize: 16,
    color: COLORS.darkGray,
  },
})

export default CallUsPage
