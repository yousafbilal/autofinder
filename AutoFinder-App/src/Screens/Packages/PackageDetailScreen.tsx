import React, { useRef, useEffect, useState } from "react"
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Dimensions,
  ActivityIndicator,
  Platform,
} from "react-native"
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context"
import { useNavigation, useRoute } from "@react-navigation/native"
import { Ionicons } from "@expo/vector-icons"
import { LinearGradient } from "expo-linear-gradient"
// import AsyncStorage from "@react-native-async-storage/async-storage"

import { COLORS } from "../../constants/colors"
import { getPackageById } from "../../Components/data/packagesData"
import packagesService, { DealerPackage } from "../../services/packagesService"
import iapService from "../../services/iapService"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { Alert } from "react-native"

const { width } = Dimensions.get("window")

const PackageDetailScreen = () => {
  const navigation = useNavigation()
  const route = useRoute()
  const insets = useSafeAreaInsets()
  const { packageId } = (route.params as any) || {}
  const [packageData, setPackageData] = useState<DealerPackage | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const fadeAnim = useRef(new Animated.Value(0)).current
  const slideAnim = useRef(new Animated.Value(50)).current
  const buttonAnim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    fetchPackageDetails()
  }, [packageId])

  const fetchPackageDetails = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // First try to fetch from API
      const apiPackage = await packagesService.fetchPackageById(packageId)
      if (apiPackage) {
        setPackageData(apiPackage)
      } else {
        // Fallback to static data
        const staticPackage = getPackageById(packageId)
        if (staticPackage) {
          setPackageData(staticPackage as any)
        } else {
          setError('Package not found')
        }
      }
    } catch (err) {
      console.error('Error fetching package details:', err)
      // Fallback to static data
      const staticPackage = getPackageById(packageId)
      if (staticPackage) {
        setPackageData(staticPackage as any)
      } else {
        setError('Failed to load package details')
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (packageData) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(buttonAnim, {
          toValue: 1,
          duration: 500,
          delay: 300,
          useNativeDriver: true,
        }),
      ]).start()
    }
  }, [packageData])

  // Hide dealer packages for iOS
  if (Platform.OS === 'ios') {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <Ionicons name="information-circle" size={64} color={COLORS.darkGray} style={{ marginBottom: 20 }} />
        <Text style={styles.errorText}>Not Available on iOS</Text>
        <Text style={[styles.errorText, { fontSize: 14, marginTop: 10, textAlign: 'center', paddingHorizontal: 20 }]}>
          Dealer packages are currently only available on Android devices. Please use an Android device to purchase dealer packages.
        </Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.retryButton}>
          <Text style={styles.retryButtonText}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    )
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading package details...</Text>
      </SafeAreaView>
    )
  }

  if (error || !packageData) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <Text style={styles.errorText}>{error || 'Package not found'}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchPackageDetails}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.errorButton}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    )
  }

  const handleBuyNow = async () => {
    if (!packageData || isSubmitting) return

    // Calculate duration based on package config (admin-defined days)
    const durationDays =
      packageData.validityDays ||
      packageData.liveAdDays ||
      packageData.noOfDays ||
      packageData.duration ||
      packageData.durationDays ||
      30

    // iOS: Use Apple In-App Purchase
    // TEMPORARILY DISABLED FOR iOS APP STORE APPROVAL
    if (Platform.OS === 'ios') {
      Alert.alert(
        'Temporarily Unavailable',
        'In-App Purchase is temporarily unavailable. Please contact support for dealer package activation.',
        [{ text: 'OK' }]
      )
      return
    }
    
    if (Platform.OS === 'ios') {
      try {
        setIsSubmitting(true)

        // Get user ID
        const userData = await AsyncStorage.getItem('user')
        if (!userData) {
          Alert.alert('Error', 'Please login to purchase a package')
          setIsSubmitting(false)
          return
        }

        const parsedUser = JSON.parse(userData)
        const userId = parsedUser._id || parsedUser.userId

        if (!userId) {
          Alert.alert('Error', 'User information not found. Please login again.')
          setIsSubmitting(false)
          return
        }

        // Check if running in Expo Go (development mode)
        const isExpoGo = iapService.isDevelopmentMode();
        
        // Show confirmation with correct days
        Alert.alert(
          'Purchase Dealer Package',
          isExpoGo 
            ? `⚠️ Development Mode (Expo Go)\n\nApple In-App Purchase sheet will NOT appear in Expo Go.\n\nYou will purchase the dealer package for ${durationDays} days.\n\nDealer access will be activated directly (for testing only).\n\nFor real Apple IAP, use EAS build or App Store build.`
            : `You will purchase the dealer package for ${durationDays} days.\n\nApple In-App Purchase sheet will open.\n\nSubscription and dealer access will be active for this duration after verification.`,
          [
            {
              text: 'Cancel',
              style: 'cancel',
              onPress: () => setIsSubmitting(false)
            },
            {
              text: isExpoGo ? 'Activate (Dev Mode)' : 'Continue',
              onPress: async () => {
                try {
                  // Complete purchase flow: Purchase → Verify → Activate
                  const result = await iapService.completeDealerPurchase(
                    userId,
                    packageData.name,
                    durationDays
                  )

                  if (result.success) {
                    Alert.alert(
                      'Success!',
                      `You are now a dealer for ${durationDays} days. Your dealer features are now active after verification.`,
                      [
                        {
                          text: 'OK',
                          onPress: () => {
                            // Navigate back and refresh
                            navigation.goBack()
                          },
                        },
                      ]
                    )
                  } else {
                    // Check if token expired
                    if (result.message === 'TOKEN_EXPIRED' || result.error?.includes('expired')) {
                      Alert.alert(
                        'Session Expired',
                        'Your login session has expired. Please login again to continue.',
                        [
                          {
                            text: 'OK',
                            onPress: async () => {
                              // Clear stored user data
                              await AsyncStorage.removeItem('user')
                              await AsyncStorage.removeItem('token')
                              await AsyncStorage.removeItem('userToken')
                              // Navigate to login screen
                              ;(navigation as any).reset({
                                index: 0,
                                routes: [{ name: 'LoginScreen' }],
                              })
                            },
                          },
                        ]
                      )
                    } else {
                      Alert.alert('Purchase Failed', result.message || result.error || 'Please try again.')
                    }
                  }
                } catch (error: any) {
                  console.error('Purchase error:', error)
                  
                  // Check if token expired
                  if (error.message === 'TOKEN_EXPIRED' || error.message?.includes('expired')) {
                    Alert.alert(
                      'Session Expired',
                      'Your login session has expired. Please login again to continue.',
                      [
                        {
                          text: 'OK',
                          onPress: async () => {
                            // Clear stored user data
                            await AsyncStorage.removeItem('user')
                            await AsyncStorage.removeItem('token')
                            await AsyncStorage.removeItem('userToken')
                            // Navigate to login screen
                            ;(navigation as any).reset({
                              index: 0,
                              routes: [{ name: 'LoginScreen' }],
                            })
                          },
                        },
                      ]
                    )
                  } else {
                    Alert.alert('Error', error.message || 'Purchase failed. Please try again.')
                  }
                } finally {
                  setIsSubmitting(false)
                }
              }
            }
          ]
        )
      } catch (error: any) {
        console.error('Error initiating purchase:', error)
        Alert.alert('Error', error.message || 'Failed to initiate purchase. Please try again.')
        setIsSubmitting(false)
      }
    } else {
      // Android: Use existing payment receipt flow
      try {
        setIsSubmitting(true)
        ;(navigation as any).navigate("PaymentReceipt", {
          packageId,
          packageName: packageData.name,
          amount: packageData.discountedPrice,
          packageType: packageData.type,
        })
      } finally {
        setIsSubmitting(false)
      }
    }
  }

  if (!packageData) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading package details...</Text>
      </SafeAreaView>
    )
  }

  // Use new fields with fallbacks
  const savedAmount = packageData.youSaved || (packageData.originalPrice - packageData.discountedPrice)
  const costPerAd = packageData.costPerAd || (packageData.discountedPrice / packageData.totalAds).toFixed(2)

  // Get gradient colors based on package type
  const getGradientColors = () => {
    if (packageData.type === "car") return ["#FF6B6B", "#FF8E53"]
    if (packageData.type === "bike") return ["#4ECDC4", "#44A08D"]
    return ["#A8E6CF", "#88D8A3"]
  }

  // Get icon based on package type
  const getPackageIcon = () => {
    if (packageData.type === "car") return "car-sport"
    if (packageData.type === "bike") return "bicycle"
    return "rocket"
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Compact Gradient Header */}
      <LinearGradient
        colors={getGradientColors()}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerGradient}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={22} color={COLORS.white} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <View style={styles.headerIconContainer}>
              <Ionicons name={getPackageIcon()} size={28} color={COLORS.white} />
            </View>
            <Text style={styles.headerTitle}>{packageData.name}</Text>
          </View>
          {packageData.popular && (
            <View style={styles.popularBadgeCompact}>
              <Ionicons name="star" size={12} color={COLORS.white} />
              <Text style={styles.popularTextCompact}>Popular</Text>
            </View>
          )}
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Animated.View
          style={[
            styles.detailsContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {/* Compact Price Section */}
          <View style={styles.priceSectionCompact}>
            <View style={styles.priceLeft}>
              {packageData.actualPrice && packageData.actualPrice > packageData.discountedPrice && (
                <Text style={styles.actualPriceCompact}>
                  PKR {packageData.actualPrice.toLocaleString()}
                </Text>
              )}
              <Text style={styles.currentPriceCompact}>
                PKR {packageData.discountedPrice?.toLocaleString() || 0}
              </Text>
            </View>
            {savedAmount > 0 && (
              <View style={styles.saveBadgeCompact}>
                <Text style={styles.saveTextCompact}>Save {savedAmount.toLocaleString()}</Text>
              </View>
            )}
          </View>

          {packageData.description && (
            <Text style={styles.packageDescriptionCompact}>{packageData.description}</Text>
          )}

          <View style={styles.dividerCompact} />

          <Text style={styles.sectionTitleCompact}>Package Details</Text>

          {/* Compact Details Grid */}
          <View style={styles.detailsGridCompact}>
            <View style={styles.detailItemCompact}>
              <View style={styles.detailIconContainerCompact}>
                <Ionicons name="document-text-outline" size={18} color={COLORS.primary} />
              </View>
              <Text style={styles.detailValueCompact}>{packageData.totalAds || 0}</Text>
              <Text style={styles.detailLabelCompact}>Total Ads</Text>
            </View>

            <View style={styles.detailItemCompact}>
              <View style={styles.detailIconContainerCompact}>
                <Ionicons name="calendar-outline" size={18} color={COLORS.primary} />
              </View>
              <Text style={styles.detailValueCompact}>{packageData.liveAdDays || 0}</Text>
              <Text style={styles.detailLabelCompact}>Live Days</Text>
            </View>

            <View style={styles.detailItemCompact}>
              <View style={styles.detailIconContainerCompact}>
                <Ionicons name="time-outline" size={18} color={COLORS.primary} />
              </View>
              <Text style={styles.detailValueCompact}>{packageData.validityDays || 0}</Text>
              <Text style={styles.detailLabelCompact}>Validity</Text>
            </View>

            <View style={styles.detailItemCompact}>
              <View style={styles.detailIconContainerCompact}>
                <Ionicons name="rocket-outline" size={18} color={COLORS.primary} />
              </View>
              <Text style={styles.detailValueCompact}>{packageData.freeBoosters || 0}</Text>
              <Text style={styles.detailLabelCompact}>Boosters</Text>
            </View>
          </View>

          {/* Compact Savings Info */}
          <View style={styles.savingsContainerCompact}>
            <View style={styles.savingItemCompact}>
              <Ionicons name="pricetag-outline" size={16} color="#4CAF50" />
              <Text style={styles.savingLabelCompact}>Cost Per Ad</Text>
              <Text style={styles.savingValueCompact}>PKR {costPerAd}</Text>
            </View>
            {savedAmount > 0 && (
              <>
                <View style={styles.savingsDivider} />
                <View style={styles.savingItemCompact}>
                  <Ionicons name="wallet-outline" size={16} color="#4CAF50" />
                  <Text style={styles.savingLabelCompact}>You Save</Text>
                  <Text style={styles.savingValueCompact}>PKR {savedAmount.toLocaleString()}</Text>
                </View>
              </>
            )}
          </View>

          <View style={styles.dividerCompact} />

          <Text style={styles.sectionTitleCompact}>What's Included</Text>

          {/* Compact Features Grid */}
          <View style={styles.featuresContainerCompact}>
            {packageData.features.map((feature, index) => (
              <View key={index} style={styles.featureItemCompact}>
                <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                <Text style={styles.featureTextCompact} numberOfLines={2}>{feature}</Text>
              </View>
            ))}
          </View>
        </Animated.View>
      </ScrollView>

      <Animated.View
        style={[
          styles.bottomBarCompact,
          {
            opacity: buttonAnim,
            bottom: Platform.OS === 'ios' 
              ? Math.max(insets.bottom, 0)
              : Math.max(insets.bottom, 8) + 8,
            transform: [
              {
                translateY: buttonAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [100, 0],
                }),
              },
            ],
          },
        ]}
      >
        <View style={styles.bottomPriceSection}>
          <Text style={styles.priceLabelCompact}>Total Price</Text>
          <Text style={styles.priceValueCompact}>PKR {packageData.discountedPrice?.toLocaleString() || 0}</Text>
        </View>
        <TouchableOpacity 
          style={[styles.buyButtonCompact, isSubmitting && styles.buyButtonDisabled]} 
          onPress={handleBuyNow}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color={COLORS.white} />
          ) : (
            <>
              <Text style={styles.buyButtonTextCompact}>Buy Now</Text>
              <Ionicons name="arrow-forward" size={18} color={COLORS.white} />
            </>
          )}
        </TouchableOpacity>
      </Animated.View>
    </SafeAreaView>
  )
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  // Compact Gradient Header
  headerGradient: {
    paddingTop: Platform.OS === 'ios' ? 8 : 12,
    paddingBottom: 12,
    paddingHorizontal: 16,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerCenter: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 12,
    gap: 10,
  },
  headerIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.white,
    flex: 1,
  },
  popularBadgeCompact: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  popularTextCompact: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: "600",
  },
  content: {
    flex: 1,
  },
  detailsContainer: {
    padding: 16,
    paddingBottom: 100,
  },
  // Compact Price Section
  priceSectionCompact: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: "#F8F9FA",
    borderRadius: 10,
  },
  priceLeft: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 8,
  },
  actualPriceCompact: {
    fontSize: 14,
    fontWeight: "500",
    color: COLORS.darkGray,
    textDecorationLine: "line-through",
  },
  currentPriceCompact: {
    fontSize: 22,
    fontWeight: "700",
    color: COLORS.primary,
  },
  saveBadgeCompact: {
    backgroundColor: "#E8F5E9",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  saveTextCompact: {
    fontSize: 12,
    fontWeight: "600",
    color: "#4CAF50",
  },
  packageDescriptionCompact: {
    fontSize: 14,
    color: COLORS.darkGray,
    lineHeight: 20,
    marginBottom: 12,
  },
  dividerCompact: {
    height: 1,
    backgroundColor: COLORS.lightGray,
    marginVertical: 14,
  },
  sectionTitleCompact: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.black,
    marginBottom: 12,
  },
  // Compact Details Grid
  detailsGridCompact: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -6,
    marginBottom: 12,
  },
  detailItemCompact: {
    width: "25%",
    paddingHorizontal: 6,
    marginBottom: 12,
    alignItems: "center",
  },
  detailIconContainerCompact: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F0F7FF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 6,
  },
  detailValueCompact: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.black,
    marginBottom: 2,
  },
  detailLabelCompact: {
    fontSize: 11,
    color: COLORS.darkGray,
    textAlign: "center",
  },
  // Compact Savings Container
  savingsContainerCompact: {
    flexDirection: "row",
    backgroundColor: "#F0F7FF",
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    alignItems: "center",
  },
  savingItemCompact: {
    flex: 1,
    alignItems: "center",
    gap: 4,
  },
  savingsDivider: {
    width: 1,
    height: 30,
    backgroundColor: "#D0E0F0",
  },
  savingLabelCompact: {
    fontSize: 11,
    color: COLORS.darkGray,
    fontWeight: "500",
  },
  savingValueCompact: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.primary,
  },
  // Compact Features
  featuresContainerCompact: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
  },
  featureItemCompact: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8F9FA",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
    flex: 1,
    minWidth: "48%",
  },
  featureTextCompact: {
    fontSize: 12,
    color: COLORS.black,
    flex: 1,
    lineHeight: 16,
  },
  // Compact Bottom Bar
  bottomBarCompact: {
    position: "absolute",
    left: 0,
    right: 0,
    backgroundColor: COLORS.white,
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 12 : 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray,
    alignItems: "center",
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 8,
    zIndex: 1000,
  },
  bottomPriceSection: {
    flex: 1,
  },
  priceLabelCompact: {
    fontSize: 12,
    color: COLORS.darkGray,
    marginBottom: 2,
  },
  priceValueCompact: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.black,
  },
  buyButtonCompact: {
    backgroundColor: COLORS.primary,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    minWidth: 110,
    justifyContent: "center",
  },
  buyButtonDisabled: {
    opacity: 0.6,
  },
  buyButtonTextCompact: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: "700",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 30,
  },
  errorText: {
    fontSize: 18,
    color: COLORS.darkGray,
    marginBottom: 16,
  },
  errorButton: {
    fontSize: 16,
    color: COLORS.primary,
    fontWeight: "600",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.white,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: COLORS.darkGray,
  },
  retryButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 10,
  },
  retryButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
  infoContainer: {
    backgroundColor: COLORS.lightGray,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  infoItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.white,
  },
  infoLabel: {
    fontSize: 14,
    color: COLORS.darkGray,
    fontWeight: "500",
  },
  infoValue: {
    fontSize: 14,
    color: COLORS.black,
    fontWeight: "600",
  },
})

export default PackageDetailScreen

// @ts-ignore - sharedElements route is provided by navigation lib at runtime
PackageDetailScreen.sharedElements = (route: any) => {
  const { packageId } = route.params || {}
  return [`package.${packageId}`]
}
