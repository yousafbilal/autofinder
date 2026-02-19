import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { Ionicons } from "@expo/vector-icons"
import { COLORS } from "../../constants/colors"
import { useNavigation } from "@react-navigation/native"
import React from "react"
const TermsAndConditions = () => {
  const navigation = useNavigation()

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Terms & Conditions</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.lastUpdated}>Last Updated: April 15, 2023</Text>

        <Text style={styles.sectionTitle}>1. Introduction</Text>
        <Text style={styles.paragraph}>
          Welcome to AutoFinder. These Terms and Conditions govern your use of the AutoFinder mobile application and
          website (collectively, the "Service"). By accessing or using the Service, you agree to be bound by these
          Terms. If you disagree with any part of the terms, you may not access the Service.
        </Text>

        <Text style={styles.sectionTitle}>2. Definitions</Text>
        <Text style={styles.paragraph}>
          <Text style={styles.bold}>"Service"</Text> refers to the AutoFinder mobile application and website.
        </Text>
        <Text style={styles.paragraph}>
          <Text style={styles.bold}>"User"</Text> refers to any individual who accesses or uses the Service.
        </Text>
        <Text style={styles.paragraph}>
          <Text style={styles.bold}>"Content"</Text> refers to all information, text, graphics, photos, or other
          materials uploaded, downloaded, or appearing on the Service.
        </Text>

        <Text style={styles.sectionTitle}>3. User Accounts</Text>
        <Text style={styles.paragraph}>
          To use certain features of the Service, you must register for an account. You agree to provide accurate,
          current, and complete information during the registration process and to update such information to keep it
          accurate, current, and complete.
        </Text>
        <Text style={styles.paragraph}>
          You are responsible for safeguarding the password that you use to access the Service and for any activities or
          actions under your password. We encourage you to use "strong" passwords (passwords that use a combination of
          upper and lower case letters, numbers, and symbols) with your account.
        </Text>

        <Text style={styles.sectionTitle}>4. User Content</Text>
        <Text style={styles.paragraph}>
          Our Service allows you to post, link, store, share, and otherwise make available certain information, text,
          graphics, videos, or other material. You are responsible for the Content that you post on or through the
          Service, including its legality, reliability, and appropriateness.
        </Text>
        <Text style={styles.paragraph}>
          By posting Content on or through the Service, you represent and warrant that: (i) the Content is yours (you
          own it) and/or you have the right to use it and the right to grant us the rights and license as provided in
          these Terms, and (ii) that the posting of your Content on or through the Service does not violate the privacy
          rights, publicity rights, copyrights, contract rights, or any other rights of any person or entity.
        </Text>

        <Text style={styles.sectionTitle}>5. Prohibited Uses</Text>
        <Text style={styles.paragraph}>You agree not to use the Service:</Text>
        <Text style={styles.bulletPoint}>
          • In any way that violates any applicable national or international law or regulation.
        </Text>
        <Text style={styles.bulletPoint}>
          • To transmit, or procure the sending of, any advertising or promotional material, including any "junk mail",
          "chain letter", "spam", or any other similar solicitation.
        </Text>
        <Text style={styles.bulletPoint}>
          • To impersonate or attempt to impersonate the Company, a Company employee, another user, or any other person
          or entity.
        </Text>
        <Text style={styles.bulletPoint}>
          • In any way that infringes upon the rights of others, or in any way is illegal, threatening, fraudulent, or
          harmful, or in connection with any unlawful, illegal, fraudulent, or harmful purpose or activity.
        </Text>

        <Text style={styles.sectionTitle}>6. Limitation of Liability</Text>
        <Text style={styles.paragraph}>
          In no event shall AutoFinder, nor its directors, employees, partners, agents, suppliers, or affiliates, be
          liable for any indirect, incidental, special, consequential, or punitive damages, including without
          limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from (i) your access
          to or use of or inability to access or use the Service; (ii) any conduct or content of any third party on the
          Service; (iii) any content obtained from the Service; and (iv) unauthorized access, use, or alteration of your
          transmissions or content, whether based on warranty, contract, tort (including negligence), or any other legal
          theory, whether or not we have been informed of the possibility of such damage.
        </Text>

        <Text style={styles.sectionTitle}>7. Changes to Terms</Text>
        <Text style={styles.paragraph}>
          We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision is
          material, we will provide at least 30 days' notice prior to any new terms taking effect. What constitutes a
          material change will be determined at our sole discretion.
        </Text>

        <Text style={styles.sectionTitle}>8. Contact Us</Text>
        <Text style={styles.paragraph}>
          If you have any questions about these Terms, please contact us at support@autofinder.com.
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
  bold: {
    fontWeight: "bold",
    color: COLORS.black,
  },
  bulletPoint: {
    fontSize: 14,
    color: COLORS.darkGray,
    marginBottom: 8,
    marginLeft: 16,
    lineHeight: 22,
  },
})

export default TermsAndConditions;
