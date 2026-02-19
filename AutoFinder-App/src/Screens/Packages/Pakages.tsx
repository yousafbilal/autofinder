import React, { useRef, useEffect, useState } from "react"
import { View, Text, StyleSheet, FlatList, Animated, SafeAreaView, TouchableOpacity, ActivityIndicator, RefreshControl, Dimensions, Platform } from "react-native"
import { useNavigation, useFocusEffect } from "@react-navigation/native"
import LottieView from "lottie-react-native"
import { Ionicons } from "@expo/vector-icons"
import { mockUserPackages, getPackageById } from "../../Components/data/packagesData"
import { COLORS } from "../../constants/colors"
import UserPackageCard from "../../Components/packages/UserPackageCard"
import AsyncStorage from '@react-native-async-storage/async-storage'
import { API_URL } from "../../../config"

const { width, height } = Dimensions.get('window')
const isTablet = width >= 768
const isSmallScreen = width < 375

const Pakages = () => {
  const navigation = useNavigation()
  const animatedValues = useRef(mockUserPackages.map(() => new Animated.Value(0))).current
  const emptyAnimation = useRef(null)
  const [loading, setLoading] = useState(true)
  const [activeItems, setActiveItems] = useState<any[]>([])
  const [refreshing, setRefreshing] = useState(false)

  const load = async () => {
      try {
        if (!refreshing) setLoading(true)
        const stored = await AsyncStorage.getItem('user')
        const parsed = stored ? JSON.parse(stored) : null
        const uid = parsed?.userId || parsed?._id
        if (!uid) {
          setActiveItems([])
          return
        }
        const res = await fetch(`${API_URL}/mobile/user-mobile-packages/${uid}`)
        const contentType = res.headers.get('content-type') || ''
        if (!res.ok) {
          const text = await res.text()
          console.log('❌ user-mobile-packages error:', res.status, text)
          setActiveItems([])
          return
        }
        if (!contentType.includes('application/json')) {
          const text = await res.text()
          console.log('❌ Non-JSON response for user-mobile-packages:', text)
          setActiveItems([])
          return
        }
        const json = await res.json()
        console.log('📦 Packages API response:', json)
        console.log('👤 Current user ID:', uid)
        
        if (json?.success) {
          // ✅ Backend returns 'packages' key (fixed recently)
          const rawPackages = (json.packages || json.items || [])
          console.log(`✅ Found ${rawPackages.length} packages (raw)`)
          
          // Normalize: support plain purchase docs too AND filter by userId for security
          const packages = (rawPackages as any[])
            .map((p:any) => {
              const purchase = p.purchase || {
                _id: p._id || p.id,
                packageId: p.packageId,
                packageName: p.packageName,
                packageType: p.packageType,
                amount: p.amount,
                status: p.status,
                approvedAt: p.approvedAt,
              }
              return {
                id: purchase._id,
                packageId: purchase.packageId,
                purchase,
                package: p.package || p.packageDetails || null,
                usage: p.usage || {},
                expiryDate: p.expiryDate || p.purchase?.expiryDate || null,
                isActive: p.isActive ?? p.active ?? true,
                adsRemaining: p.usage?.adsRemaining,
                boostersRemaining: p.usage?.boostersRemaining,
                userId: p.userId || p.purchase?.userId || null, // Store userId for filtering
              }
            })
            // ✅ Extra security: Filter by current user's ID (even though backend should already filter)
            .filter((x:any) => {
              const matchesUser = !x.userId || x.userId === uid || x.userId.toString() === uid?.toString()
              if (!matchesUser) {
                console.warn(`⚠️ Filtering out package ${x.id} - userId mismatch: ${x.userId} vs ${uid}`)
              }
              return x.id && matchesUser
            })
          
          console.log(`🔧 Normalized packages count: ${packages.length}`)
          
          // ✅ Debug each package's usage
          packages.forEach((pkg, i) => {
            console.log(`📊 Package ${i + 1} Usage:`, {
              name: pkg.package?.name,
              totalBoosters: pkg.usage?.totalBoosters,
              boostersUsed: pkg.usage?.boostersUsed,
              boostersRemaining: pkg.usage?.boostersRemaining,
              isActive: pkg.isActive,
              expiryDate: pkg.expiryDate
            })
          })
          
          // ✅ Sort by expiry date (longest validity first)
          const sortedPackages = [...packages].sort((a, b) => {
            const aExpiry = a.expiryDate ? new Date(a.expiryDate).getTime() : 0
            const bExpiry = b.expiryDate ? new Date(b.expiryDate).getTime() : 0
            return bExpiry - aExpiry  // Descending (latest first)
          })
          
          console.log(`🔄 Sorted packages by expiry (latest first):`, 
            sortedPackages.map((p, i) => {
              const packageName = p.package?.name || p.purchase?.packageName || 'Package';
              const expiryDate = p.expiryDate || p.purchase?.expiryDate || 'N/A';
              return `${i+1}. ${packageName} - expires ${expiryDate}`;
            })
          )
          
          // On iOS: show only "add" packages (booster / IAP), hide dealer packages (car/bike)
          const displayPackages = Platform.OS === 'ios'
            ? sortedPackages.filter((p: any) => {
                const type = (p.package?.type || p.purchase?.packageType || '').toLowerCase();
                const isDealerPackage = type === 'car' || type === 'bike';
                return !isDealerPackage; // show only non-dealer (add/booster)
              })
            : sortedPackages;
          
          setActiveItems(displayPackages)
        } else {
          console.log('❌ API response not successful:', json)
          setActiveItems([])
        }
      } catch (e) {
        console.error('❌ Error loading packages:', e)
        setActiveItems([])
      } finally {
        setLoading(false)
        setRefreshing(false)
      }
  }

  useEffect(() => {
    load()
  }, [])

  useFocusEffect(
    React.useCallback(() => {
      // Refresh when screen gains focus (e.g., after posting an ad)
      load()
    }, [])
  )

  const onRefresh = () => {
    setRefreshing(true)
    load()
  }

  useEffect(() => {
    if (mockUserPackages.length > 0) {
      const animations = mockUserPackages.map((_, index) => {
        return Animated.timing(animatedValues[index], {
          toValue: 1,
          duration: 500,
          delay: index * 150,
          useNativeDriver: true,
        })
      })

      Animated.stagger(100, animations).start()
    } else if (emptyAnimation.current) {
      emptyAnimation.current.play()
    }
  }, [])

  const handleViewPackageUsage = (userPackage) => {
    navigation.navigate("PackageUsage", { packageId: userPackage.packageId, userPackageId: userPackage.id })
  }

  const renderItem = ({ item, index }) => {
    const packageDetails = getPackageById(item.packageId)

    if (!packageDetails) return null

    const translateY = animatedValues[index].interpolate({
      inputRange: [0, 1],
      outputRange: [50, 0],
    })

    const opacity = animatedValues[index].interpolate({
      inputRange: [0, 1],
      outputRange: [0, 1],
    })

    return (
      <Animated.View
        style={{
          opacity,
          transform: [{ translateY }],
        }}
      >
        <UserPackageCard
          userPackage={item}
          packageDetails={packageDetails}
          onPress={() => handleViewPackageUsage(item)}
        />
      </Animated.View>
    )
  }

  const EmptyPackagesList = () => (
    <View style={styles.emptyContainer}>
      <LottieView
        ref={emptyAnimation}
        source={require("../../../assets/animations/empty-box.json")}
        style={styles.emptyAnimation}
        autoPlay
        loop
      />
      <Text style={styles.emptyTitle}>No Packages Yet</Text>
      <Text style={styles.emptyText}>
        You haven't purchased any packages yet. Browse our packages to boost your ads visibility.
      </Text>
      <TouchableOpacity style={styles.browseButton} onPress={() => navigation.navigate("PackagesScreen", { screen: "car" })}>
        <Text style={styles.browseButtonText}>Browse Packages</Text>
      </TouchableOpacity>
    </View>
  )
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.heading}>My Packages</Text>
      </View>
      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : activeItems.length > 0 ? (
        <FlatList
          data={activeItems}
          keyExtractor={(item, index) => {
            try {
              const purchaseId = item?.purchase?._id || item?.purchase?.id;
              if (purchaseId) {
                if (typeof purchaseId === 'string') return purchaseId;
                if (typeof purchaseId === 'number') return `purchase-${purchaseId}`;
                if (typeof purchaseId === 'object') {
                  if (purchaseId.toString && typeof purchaseId.toString === 'function') {
                    const str = String(purchaseId.toString());
                    if (str !== '[object Object]') return str;
                    if (purchaseId._id) return String(purchaseId._id);
                    if (purchaseId.$oid) return String(purchaseId.$oid);
                  }
                  if (purchaseId.$oid) return String(purchaseId.$oid);
                }
              }
              return `package-${index}`;
            } catch (error) {
              return `package-${index}-${Date.now()}`;
            }
          }}
          renderItem={({ item, index }) => {
        const translateY = animatedValues[Math.min(index, animatedValues.length - 1)].interpolate({ inputRange: [0,1], outputRange: [50,0] })
        const opacity = animatedValues[Math.min(index, animatedValues.length - 1)].interpolate({ inputRange: [0,1], outputRange: [0,1] })
        const pkg = item.package || {}
        // ✅ Extract usage data with proper fallbacks
        const totalBoosters = item.usage?.totalBoosters ?? (pkg?.noOfBoosts || pkg?.featuredListings || 0)
        const boostersRemaining = item.usage?.boostersRemaining ?? totalBoosters
        const boostersUsed = totalBoosters - boostersRemaining
        
        console.log(`🎯 Rendering package ${item.purchase.packageName}:`, {
          totalBoosters,
          boostersUsed,
          boostersRemaining,
          rawUsage: item.usage
        })
        
        const expired = item.expiryDate ? new Date(item.expiryDate) < new Date() : false
        const userPackage = {
          id: item.purchase._id,
          packageId: item.purchase.packageId,
          active: !expired && (item.isActive ?? true),
          expiryDate: item.expiryDate ? new Date(item.expiryDate) : new Date(),
          adsRemaining: item.usage?.adsRemaining ?? (pkg?.listingLimit || 0),
          boostersRemaining: boostersRemaining,
        } as any
        const packageDetails = {
          id: item.purchase.packageId,
          name: pkg?.name || item.purchase.packageName || 'Package',
          type: (pkg as any)?.type || (item.purchase?.packageType || 'car'),
          totalAds: item.usage?.totalAds ?? (pkg?.listingLimit || 0),
          freeBoosters: totalBoosters,
        } as any
        return (
          <Animated.View style={{ opacity, transform: [{ translateY }] }}>
            <UserPackageCard
              userPackage={userPackage}
              packageDetails={packageDetails}
              onPress={() => navigation.navigate("PackageUsage", { packageId: item.purchase.packageId, userPackageId: item.purchase._id })}
            />
            {/* Buy Now for expired packages */}
            {(!userPackage.active) && (
              <TouchableOpacity
                style={[
                  styles.buyNowButton,
                  {
                    backgroundColor: COLORS.primary,
                    borderRadius: isTablet ? 12 : 8,
                    paddingVertical: isTablet ? 16 : 12,
                    paddingHorizontal: isTablet ? 20 : 16,
                    alignItems: 'center',
                    marginTop: isTablet ? 12 : 8,
                    marginHorizontal: isTablet ? 0 : 0,
                  }
                ]}
                activeOpacity={0.9}
                onPress={() => {
                  const t = ((packageDetails as any)?.type || '').toLowerCase()
                  if (t === 'bike') {
                    navigation.navigate('PackagesScreen' as never, { screen: 'bike' } as never)
                  } else if (t === 'car') {
                    navigation.navigate('PackagesScreen' as never, { screen: 'car' } as never)
                  } else {
                    navigation.navigate('PremiumPackagesScreen' as never)
                  }
                }}
              >
                <Text style={[styles.buyNowText, { 
                  color: '#fff', 
                  fontWeight: '700',
                  fontSize: isTablet ? 18 : (isSmallScreen ? 14 : 16),
                }]}>Buy Now</Text>
              </TouchableOpacity>
            )}
          </Animated.View>
        )
      }}
      contentContainerStyle={styles.listContent}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} tintColor={COLORS.primary} />}
    />
  ) : (
    <EmptyPackagesList />
  )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  headerContainer: {
    paddingTop: Platform.OS === 'ios' ? (isTablet ? 20 : 16) : (isTablet ? 24 : 20),
    paddingBottom: isTablet ? 16 : 12,
    paddingHorizontal: isTablet ? 24 : 16,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: COLORS.primary,
    paddingVertical: isTablet ? 20 : 16,
    paddingHorizontal: isTablet ? 24 : 16,
  },
  heading: {
    fontSize: isTablet ? 28 : (isSmallScreen ? 20 : 24),
    fontWeight: '700',
    color: COLORS.primary,
    marginTop: isTablet ? 8 : (Platform.OS === 'ios' ? 12 : 16),
    marginBottom: isTablet ? 16 : 12,
    paddingLeft: isTablet ? 4 : 0,
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
    padding: isTablet ? 24 : 16,
  },
  listContent: {
    paddingHorizontal: isTablet ? 24 : 16,
    paddingTop: isTablet ? 20 : 12,
    paddingBottom: isTablet ? 40 : 30,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: isTablet ? 40 : (isSmallScreen ? 20 : 30),
    paddingVertical: isTablet ? 40 : 30,
  },
  emptyAnimation: {
    width: isTablet ? 250 : (isSmallScreen ? 150 : 200),
    height: isTablet ? 250 : (isSmallScreen ? 150 : 200),
  },
  emptyTitle: {
    fontSize: isTablet ? 26 : (isSmallScreen ? 18 : 22),
    fontWeight: "bold",
    color: COLORS.black,
    marginTop: isTablet ? 24 : 20,
    marginBottom: isTablet ? 14 : 10,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: isTablet ? 18 : (isSmallScreen ? 14 : 16),
    color: COLORS.darkGray,
    textAlign: "center",
    lineHeight: isTablet ? 26 : 22,
    marginBottom: isTablet ? 24 : 20,
    paddingHorizontal: isTablet ? 20 : 10,
  },
  browseButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: isTablet ? 32 : 24,
    paddingVertical: isTablet ? 16 : 12,
    borderRadius: isTablet ? 12 : 8,
    marginTop: isTablet ? 14 : 10,
    minWidth: isTablet ? 200 : 160,
    alignItems: 'center',
  },
  browseButtonText: {
    color: COLORS.white,
    fontSize: isTablet ? 18 : (isSmallScreen ? 14 : 16),
    fontWeight: "600",
  },
  buyNowButton: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  buyNowText: {
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
})

export default Pakages;
