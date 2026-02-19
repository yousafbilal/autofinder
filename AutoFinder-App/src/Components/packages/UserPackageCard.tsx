import React from "react"
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from "react-native"
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons"
import { COLORS } from "../../constants/colors"
import type { Package, UserPackage } from "../data/packagesData"

const { width } = Dimensions.get("window")

interface UserPackageCardProps {
  userPackage: UserPackage
  packageDetails: Package
  onPress: () => void
}

const UserPackageCard = ({ userPackage, packageDetails, onPress }: UserPackageCardProps) => {
  // Calculate days remaining until expiry
  const today = new Date()
  const expiryDate = userPackage.expiryDate instanceof Date ? userPackage.expiryDate : new Date(userPackage.expiryDate)
  const daysRemaining = Math.max(0, Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)))

  // Calculate progress percentages
  const adUsagePercentage = ((packageDetails.totalAds - userPackage.adsRemaining) / packageDetails.totalAds) * 100
  const boosterUsagePercentage =
    ((packageDetails.freeBoosters - userPackage.boostersRemaining) / packageDetails.freeBoosters) * 100
  
  // ✅ Debug logging
  const boostersUsed = packageDetails.freeBoosters - userPackage.boostersRemaining
  console.log(`📱 UserPackageCard rendering "${packageDetails.name}":`, {
    totalBoosters: packageDetails.freeBoosters,
    boostersRemaining: userPackage.boostersRemaining,
    boostersUsed: boostersUsed,
    percentage: boosterUsagePercentage
  })

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.9}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={styles.packageName}>{packageDetails.name}</Text>
          <Text style={styles.packageType}>{packageDetails.type === "car" ? "Car Package" : packageDetails.type === "bike" ? "Bike Package" : "Booster Pack"}</Text>
        </View>
        <View style={[
          styles.statusBadge, 
          userPackage.active ? styles.activeBadge : 
          userPackage.displayStatus === 'pending' ? styles.pendingBadge :
          userPackage.displayStatus === 'rejected' ? styles.rejectedBadge :
          styles.expiredBadge
        ]}>
          <Text style={[
            styles.statusText, 
            userPackage.active ? styles.activeText : 
            userPackage.displayStatus === 'pending' ? styles.pendingText :
            userPackage.displayStatus === 'rejected' ? styles.rejectedText :
            styles.expiredText
          ]}>
            {userPackage.displayStatus === 'pending' ? "Pending" :
             userPackage.displayStatus === 'rejected' ? "Rejected" :
             userPackage.active ? "Active" : "Expired"}
          </Text>
        </View>
      </View>

      {userPackage.active ? (
        <View style={styles.expiryInfo}>
          <Ionicons name="time-outline" size={16} color={COLORS.primary} style={styles.expiryIcon} />
          <Text style={styles.expiryText}>
            {daysRemaining === 0
              ? "Expires today!"
              : daysRemaining === 1
                ? "Expires tomorrow!"
                : `Expires in ${daysRemaining} days`}
          </Text>
        </View>
      ) : (
        <View style={styles.expiryInfo}>
          <Ionicons name="calendar-outline" size={16} color={COLORS.darkGray} style={styles.expiryIcon} />
          <Text style={styles.expiredText}>Expired on {userPackage.expiryDate.toLocaleDateString()}</Text>
        </View>
      )}

      <View style={styles.usageContainer}>
        <View style={styles.usageItem}>
          <View style={styles.usageHeader}>
            <MaterialCommunityIcons name="car-multiple" size={18} color={COLORS.primary} />
            <Text style={styles.usageTitle}>Ads</Text>
          </View>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${adUsagePercentage}%` }]} />
          </View>
          <Text style={styles.usageText}>
            {userPackage.adsRemaining} of {packageDetails.totalAds} remaining
          </Text>
        </View>

        <View style={styles.usageItem}>
          <View style={styles.usageHeader}>
            <Ionicons name="rocket-outline" size={18} color={COLORS.primary} />
            <Text style={styles.usageTitle}>Boosters</Text>
          </View>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${boosterUsagePercentage}%` }]} />
          </View>
          <View style={styles.usageTextContainer}>
            <Text style={styles.usageText}>
              {packageDetails.freeBoosters - userPackage.boostersRemaining} of {packageDetails.freeBoosters} used
            </Text>
            <Text style={styles.usageSubtext}>
              {userPackage.boostersRemaining} remaining
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.viewDetailsText}>View Details</Text>
        <Ionicons name="chevron-forward" size={18} color={COLORS.darkGray} />
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    marginBottom: 16,
    padding: 16,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  titleContainer: {
    flex: 1,
  },
  packageName: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.black,
    marginBottom: 2,
  },
  packageType: {
    fontSize: 14,
    color: COLORS.darkGray,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
  },
  activeBadge: {
    backgroundColor: "rgba(76, 175, 80, 0.1)",
  },
  expiredBadge: {
    backgroundColor: "rgba(244, 67, 54, 0.1)",
  },
  pendingBadge: {
    backgroundColor: "rgba(255, 152, 0, 0.1)",
  },
  rejectedBadge: {
    backgroundColor: "rgba(158, 158, 158, 0.1)",
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  activeText: {
    color: "#4CAF50",
  },
  expiredText: {
    color: "#F44336",
  },
  pendingText: {
    color: "#FF9800",
  },
  rejectedText: {
    color: "#9E9E9E",
  },
  expiryInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  expiryIcon: {
    marginRight: 6,
  },
  expiryText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: "500",
  },
  usageContainer: {
    marginBottom: 16,
  },
  usageItem: {
    marginBottom: 12,
  },
  usageHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  usageTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.black,
    marginLeft: 6,
  },
  progressBar: {
    height: 6,
    backgroundColor: COLORS.lightGray,
    borderRadius: 3,
    marginBottom: 6,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: COLORS.primary,
    borderRadius: 3,
  },
  usageTextContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  usageText: {
    fontSize: 12,
    color: COLORS.black,
    fontWeight: "600",
  },
  usageSubtext: {
    fontSize: 11,
    color: COLORS.darkGray,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray,
  },
  viewDetailsText: {
    fontSize: 14,
    color: COLORS.darkGray,
    marginRight: 4,
  },
})

export default UserPackageCard
