import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { Ionicons } from "@expo/vector-icons"
import { COLORS } from "../../constants/colors"
import { useNavigation } from "@react-navigation/native"
import React from "react"
const PrivacyPolicy = () => {
  const navigation = useNavigation()

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Privacy Policy</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.lastUpdated}>Last Updated: April 15, 2023</Text>

        <Text style={styles.paragraph}>
          AutoFinder ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy explains how
          your personal information is collected, used, and disclosed by AutoFinder.
        </Text>
        <Text style={styles.paragraph}>
          This Privacy Policy applies to our website, mobile application, and related services (collectively, our
          "Service"). By accessing or using our Service, you signify that you have read, understood, and agree to our
          collection, storage, use, and disclosure of your personal information as described in this Privacy Policy.
          use, and disclosure of your personal information as described in this Privacy Policy.
        </Text>

        <Text style={styles.sectionTitle}>1. Information We Collect</Text>
        <Text style={styles.paragraph}>
          We collect several types of information from and about users of our Service, including:
        </Text>
        <Text style={styles.bulletPoint}>
          • Personal Information: We may collect personally identifiable information such as your name, email address,
          telephone number, address, and any other information you provide to us when you register for an account, post
          listings, or communicate with other users.
        </Text>
        <Text style={styles.bulletPoint}>
          • Transaction Information: We collect information about your transactions on our Service, including vehicle
          listings, purchase history, and payment information.
        </Text>
        <Text style={styles.bulletPoint}>
          • Device Information: We collect information about the device you use to access our Service, including
          hardware model, operating system, unique device identifiers, and mobile network information.
        </Text>
        <Text style={styles.bulletPoint}>
          • Location Information: With your consent, we may collect and process information about your actual location
          using various technologies, including GPS, IP address, and other sensors.
        </Text>

        <Text style={styles.sectionTitle}>2. How We Use Your Information</Text>
        <Text style={styles.paragraph}>We use the information we collect to:</Text>
        <Text style={styles.bulletPoint}>• Provide, maintain, and improve our Service.</Text>
        <Text style={styles.bulletPoint}>
          • Process transactions and send related information, including confirmations and receipts.
        </Text>
        <Text style={styles.bulletPoint}>
          • Send you technical notices, updates, security alerts, and support and administrative messages.
        </Text>
        <Text style={styles.bulletPoint}>
          • Respond to your comments, questions, and requests, and provide customer service.
        </Text>
        <Text style={styles.bulletPoint}>
          • Communicate with you about products, services, offers, promotions, and events, and provide other news or
          information about us and our partners.
        </Text>
        <Text style={styles.bulletPoint}>
          • Monitor and analyze trends, usage, and activities in connection with our Service.
        </Text>
        <Text style={styles.bulletPoint}>
          • Detect, investigate, and prevent fraudulent transactions and other illegal activities and protect the rights
          and property of AutoFinder and others.
        </Text>

        <Text style={styles.sectionTitle}>3. Sharing of Information</Text>
        <Text style={styles.paragraph}>We may share your personal information in the following situations:</Text>
        <Text style={styles.bulletPoint}>
          • With other users of the Service in accordance with the functionality of the Service (e.g., when you post a
          listing, certain information will be visible to other users).
        </Text>
        <Text style={styles.bulletPoint}>
          • With vendors, consultants, and other service providers who need access to such information to carry out work
          on our behalf.
        </Text>
        <Text style={styles.bulletPoint}>
          • In response to a request for information if we believe disclosure is in accordance with any applicable law,
          regulation, or legal process.
        </Text>
        <Text style={styles.bulletPoint}>
          • If we believe your actions are inconsistent with our user agreements or policies, or to protect the rights,
          property, and safety of AutoFinder or others.
        </Text>
        <Text style={styles.bulletPoint}>
          • In connection with, or during negotiations of, any merger, sale of company assets, financing, or acquisition
          of all or a portion of our business by another company.
        </Text>

        <Text style={styles.sectionTitle}>4. Your Choices</Text>
        <Text style={styles.paragraph}>You have several choices regarding the use of information on our Service:</Text>
        <Text style={styles.bulletPoint}>
          • Account Information: You may update, correct, or delete your account information at any time by logging into
          your account. If you wish to delete your account, please contact us.
        </Text>
        <Text style={styles.bulletPoint}>
          • Location Information: You can prevent us from collecting location information by denying permission in your
          device settings, but this may limit your ability to use certain features of our Service.
        </Text>
        <Text style={styles.bulletPoint}>
          • Cookies: Most web browsers are set to accept cookies by default. You can usually choose to set your browser
          to remove or reject browser cookies.
        </Text>
        <Text style={styles.bulletPoint}>
          • Promotional Communications: You may opt out of receiving promotional communications from us by following the
          instructions in those communications.
        </Text>

        <Text style={styles.sectionTitle}>5. Contact Us</Text>
        <Text style={styles.paragraph}>
          If you have any questions about this Privacy Policy, please contact us at privacy@autofinder.com.
        </Text>
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
    backgroundColor: COLORS.primary,
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
    color: COLORS.white,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  lastUpdated: {
    fontSize: 14,
    color: COLORS.darkGray,
    marginBottom: 24,
    fontStyle: "italic",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.black,
    marginBottom: 12,
    marginTop: 24,
  },
  paragraph: {
    fontSize: 14,
    color: COLORS.darkGray,
    marginBottom: 16,
    lineHeight: 22,
  },
  bulletPoint: {
    fontSize: 14,
    color: COLORS.darkGray,
    marginBottom: 8,
    marginLeft: 16,
    lineHeight: 22,
  },
})

export default PrivacyPolicy;
