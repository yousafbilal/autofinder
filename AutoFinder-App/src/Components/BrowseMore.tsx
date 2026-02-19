import { View, Text, StyleSheet, TouchableOpacity, Image, Linking } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import React from "react"
import { COLORS } from "../constants/colors"
const BrowseMore = () => {
  return (
    <View style={styles.container}>
      <Image
        source={require("../../assets/logo.png")}
        style={styles.logo}
        defaultSource={require("../../assets/logo.png")}
      />

      <Text style={styles.description}>
        AutoFinder is the leading digital marketplace for the automotive industry that connects car shoppers with
        sellers.
      </Text>

      <View style={styles.socialContainer}>
        <Text style={styles.socialHeader}>Follow Us</Text>
        <View style={styles.socialIcons}>
          <TouchableOpacity
            style={styles.socialIcon}
            onPress={() => Linking.openURL("https://www.facebook.com/share/1DM7ifH5ST/")}
          >
            <Ionicons name="logo-facebook" size={24} color={COLORS.white} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.socialIcon}
            onPress={() => Linking.openURL("https://www.tiktok.com/@autofinder.pk?is_from_webapp=1&sender_device=pc")}
          >
            <Ionicons name="logo-tiktok" size={24} color={COLORS.white} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.socialIcon}
            onPress={() => Linking.openURL("https://www.instagram.com/autofinder.pk?igsh=bDgwZmw2bWdsYmxs")}
          >
            <Ionicons name="logo-instagram" size={24} color={COLORS.white} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.socialIcon}
            onPress={() => Linking.openURL("https://youtube.com/@autofinder-yf8tp?si=rtTygXnEeLcHICbX")}
          >
            <Ionicons name="logo-youtube" size={24} color={COLORS.white} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.divider} />

      <Text style={styles.copyright}>
        © <Text style={styles.year}>2026</Text> AutoFinder. All rights reserved.
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    paddingBottom: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    marginTop: 24,
    marginBottom: 0,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  logo: {
    width: 150,
    height: 60,
    resizeMode: "contain",
    marginBottom: 16,
    tintColor: COLORS.white,
  },
  description: {
    fontSize: 14,
    color: COLORS.gray,
    marginBottom: 24,
    lineHeight: 20,
  },
  socialContainer: {
    marginBottom: 24,
  },
  socialHeader: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.white,
    marginBottom: 12,
  },
  socialIcons: {
    flexDirection: "row",
  },
  socialIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.darkGray,
    marginBottom: 12,
  },
  copyright: {
    fontSize: 12,
    color: COLORS.gray,
    textAlign: "center",
    marginBottom: 0,
  },
  year: {
    color: COLORS.white,
    fontWeight: "600",
  },
})

export default BrowseMore
