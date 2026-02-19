import { View, Text, StyleSheet, TouchableOpacity, Image, Dimensions } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { LinearGradient } from "expo-linear-gradient"
import type { DealerPackage } from "../../services/packagesService"
import { COLORS } from "../../constants/colors"
import React from "react"
const { width } = Dimensions.get("window")

interface PackageCardProps {
  packageItem: DealerPackage
  onPress: () => void
}

const PackageCard = ({ packageItem, onPress }: PackageCardProps) => {
  // Debug logging to see what data we're receiving
  console.log('📦 PackageCard received data:', {
    name: packageItem.name,
    type: packageItem.type,
    originalPrice: packageItem.originalPrice,
    discountedPrice: packageItem.discountedPrice,
    totalAds: packageItem.totalAds,
    liveAdDays: packageItem.liveAdDays,
    freeBoosters: packageItem.freeBoosters,
    features: packageItem.features
  });
  
  const savedAmount = (packageItem.originalPrice || 0) - (packageItem.discountedPrice || 0)
  const savingsPercentage = packageItem.originalPrice > 0 ? Math.round((savedAmount / packageItem.originalPrice) * 100) : 0

  // Get icon based on package type
  const getPackageIcon = () => {
    if (packageItem.type === "car") return "car-sport"
    if (packageItem.type === "bike") return "bicycle"
    return "rocket"
  }

  // Get gradient colors based on package type
  const getGradientColors = () => {
    if (packageItem.type === "car") return ["#FF6B6B", "#FF8E53"]
    if (packageItem.type === "bike") return ["#4ECDC4", "#44A08D"]
    return ["#A8E6CF", "#88D8A3"]
  }

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.95}>
      {/* Compact Header with Gradient */}
      <LinearGradient
        colors={getGradientColors()}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerGradient}
      >
        <View style={styles.headerContent}>
          <View style={styles.iconContainer}>
            <Ionicons 
              name={getPackageIcon()} 
              size={28} 
              color={COLORS.white} 
            />
          </View>
          <View style={styles.headerTextContainer}>
            <Text style={styles.nameCompact}>{packageItem.name}</Text>
            {packageItem.popular && (
              <View style={styles.popularBadgeCompact}>
                <Ionicons name="star" size={12} color={COLORS.white} />
                <Text style={styles.popularTextCompact}>Popular</Text>
              </View>
            )}
          </View>
          {savingsPercentage > 0 && (
            <View style={styles.discountBadgeCompact}>
              <Text style={styles.discountTextCompact}>{savingsPercentage}%</Text>
            </View>
          )}
        </View>
      </LinearGradient>

      <View style={styles.content}>
        {/* Price Section - Compact */}
        <View style={styles.priceSection}>
          <View style={styles.priceLeft}>
            {packageItem.actualPrice && packageItem.actualPrice > packageItem.discountedPrice && (
              <Text style={styles.actualPriceCompact}>
                PKR {packageItem.actualPrice.toLocaleString()}
              </Text>
            )}
            <Text style={styles.priceCompact}>
              PKR {(packageItem.discountedPrice || 0).toLocaleString()}
            </Text>
          </View>
          {savedAmount > 0 && (
            <View style={styles.saveBadge}>
              <Text style={styles.saveTextCompact}>Save {savedAmount.toLocaleString()}</Text>
            </View>
          )}
        </View>

        {/* Compact Highlights - Icons in a row */}
        <View style={styles.highlightsCompact}>
          <View style={styles.highlightItemCompact}>
            <View style={styles.highlightIconBg}>
              <Ionicons name="document-text-outline" size={16} color={COLORS.primary} />
            </View>
            <Text style={styles.highlightTextCompact}>{packageItem.totalAds || 0}</Text>
            <Text style={styles.highlightLabelCompact}>Ads</Text>
          </View>
          <View style={styles.highlightDivider} />
          <View style={styles.highlightItemCompact}>
            <View style={styles.highlightIconBg}>
              <Ionicons name="calendar-outline" size={16} color={COLORS.primary} />
            </View>
            <Text style={styles.highlightTextCompact}>{packageItem.liveAdDays || 0}</Text>
            <Text style={styles.highlightLabelCompact}>Days</Text>
          </View>
          <View style={styles.highlightDivider} />
          <View style={styles.highlightItemCompact}>
            <View style={styles.highlightIconBg}>
              <Ionicons name="rocket-outline" size={16} color={COLORS.primary} />
            </View>
            <Text style={styles.highlightTextCompact}>{packageItem.freeBoosters || 0}</Text>
            <Text style={styles.highlightLabelCompact}>Boost</Text>
          </View>
        </View>

        {/* Compact Features - Only show 2 features */}
        {packageItem.features && packageItem.features.length > 0 && (
          <View style={styles.featuresCompact}>
            {packageItem.features.slice(0, 2).map((feature, index) => (
              <View key={index} style={styles.featureItemCompact}>
                <Ionicons name="checkmark-circle" size={14} color="#4CAF50" />
                <Text style={styles.featureTextCompact} numberOfLines={1}>{feature}</Text>
              </View>
            ))}
            {packageItem.features.length > 2 && (
              <Text style={styles.moreFeaturesCompact}>
                +{packageItem.features.length - 2} more
              </Text>
            )}
          </View>
        )}

        {/* Compact Footer Button */}
        <TouchableOpacity style={styles.viewButtonCompact} onPress={onPress}>
          <Text style={styles.viewButtonTextCompact}>View Details</Text>
          <Ionicons name="arrow-forward" size={16} color={COLORS.white} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#F0F0F0",
  },
  headerGradient: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  headerTextContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  nameCompact: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.white,
    flex: 1,
  },
  popularBadgeCompact: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    gap: 4,
  },
  popularTextCompact: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: "600",
  },
  discountBadgeCompact: {
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.5)",
  },
  discountTextCompact: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: "700",
  },
  content: {
    padding: 14,
  },
  priceSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  priceLeft: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 8,
  },
  actualPriceCompact: {
    fontSize: 13,
    fontWeight: "500",
    color: COLORS.darkGray,
    textDecorationLine: "line-through",
  },
  priceCompact: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.primary,
  },
  saveBadge: {
    backgroundColor: "#E8F5E9",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  saveTextCompact: {
    fontSize: 11,
    fontWeight: "600",
    color: "#4CAF50",
  },
  highlightsCompact: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    backgroundColor: "#F8F9FA",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 8,
    marginBottom: 10,
  },
  highlightItemCompact: {
    flex: 1,
    alignItems: "center",
    gap: 4,
  },
  highlightIconBg: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.white,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 2,
  },
  highlightTextCompact: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.black,
  },
  highlightLabelCompact: {
    fontSize: 10,
    color: COLORS.darkGray,
    fontWeight: "500",
  },
  highlightDivider: {
    width: 1,
    height: 30,
    backgroundColor: "#E0E0E0",
  },
  featuresCompact: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
  },
  featureItemCompact: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
    flex: 1,
    minWidth: "45%",
  },
  featureTextCompact: {
    fontSize: 11,
    color: COLORS.darkGray,
    flex: 1,
  },
  moreFeaturesCompact: {
    fontSize: 10,
    color: COLORS.primary,
    fontStyle: "italic",
    alignSelf: "center",
    marginTop: 4,
  },
  viewButtonCompact: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.primary,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  viewButtonTextCompact: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.white,
  },
})

export default PackageCard
