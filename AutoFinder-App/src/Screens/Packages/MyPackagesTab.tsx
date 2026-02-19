import React, { useRef, useEffect, useState } from "react"
import { View, Text, StyleSheet, FlatList, Animated, TouchableOpacity } from "react-native"
import { useNavigation } from "@react-navigation/native"
import LottieView from "lottie-react-native"
import AsyncStorage from '@react-native-async-storage/async-storage'

import { mockUserPackages, getPackageById } from "../../Components/data/packagesData"
import { COLORS } from "../../constants/colors"
import UserPackageCard from "../../Components/packages/UserPackageCard"
import { API_URL } from "../../../config"

const MyPackagesTab = () => {
  const navigation = useNavigation()
  const [userPackages, setUserPackages] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const animatedValues = useRef([])
  const emptyAnimation = useRef(null)

  useEffect(() => {
    fetchUserPackages()
  }, [])

  const fetchUserPackages = async () => {
    try {
      setLoading(true)
      const stored = await AsyncStorage.getItem('user')
      const parsed = stored ? JSON.parse(stored) : null
      const uid = parsed?._id || parsed?.userId
      
      if (!uid) {
        console.log("❌ No user ID found")
        setLoading(false)
        return
      }

      console.log("📦 Fetching user packages for:", uid)
      const response = await fetch(`${API_URL}/mobile/user-mobile-packages/${uid}`)
      const data = await response.json()
      
      console.log("📦 User packages response:", data)
      
      if (data.success && Array.isArray(data.packages) && data.packages.length > 0) {
        // Transform API data to match UserPackageCard expected format
        const transformedPackages = data.packages.map((item: any, index: number) => ({
          id: item._id || `package_${index}`,
          packageId: item.packageId || `pkg_${index}`,
          purchaseDate: item.approvedAt ? new Date(item.approvedAt) : new Date(),
          expiryDate: item.expiryDate ? new Date(item.expiryDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          adsRemaining: item.usage?.adsRemaining || item.totalAds || 0,
          boostersRemaining: item.usage?.boostersRemaining || item.freeBoosters || 0,
          active: item.isActive || item.active || false,
          displayStatus: item.displayStatus || 'pending',
          package: {
            name: item.packageName,
            type: item.packageType,
            totalAds: item.totalAds || 0,
            freeBoosters: item.freeBoosters || 0,
            liveAdDays: item.liveAdDays || 0,
            validityDays: item.validityDays || 0,
            features: item.features || []
          }
        }))
        
        console.log("📦 Transformed packages:", transformedPackages)
        console.log("📦 Package IDs being set:", transformedPackages.map(p => ({
          id: p.id,
          packageId: p.packageId,
          packageName: p.package?.name,
          expiryDate: p.expiryDate,
          daysRemaining: p.expiryDate ? Math.ceil((new Date(p.expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : 0
        })))
        setUserPackages(transformedPackages)
        
        // Initialize animated values for the fetched packages
        animatedValues.current = transformedPackages.map(() => new Animated.Value(0))
        
        // Start animations
        const animations = transformedPackages.map((_, index) => {
          return Animated.timing(animatedValues.current[index], {
            toValue: 1,
            duration: 500,
            delay: index * 150,
            useNativeDriver: true,
          })
        })
        
        Animated.stagger(100, animations).start()
      } else {
        console.log("❌ No packages found or invalid response")
        setUserPackages([])
      }
    } catch (error) {
      console.error("❌ Error fetching user packages:", error)
      setUserPackages([])
    } finally {
      setLoading(false)
    }
  }

  const handleViewPackageUsage = (userPackage) => {
    console.log("🔍 Navigating to PackageUsage with:", {
      packageId: userPackage.packageId,
      userPackageId: userPackage.id
    });
    (navigation as any).navigate("PackageUsage", { 
      packageId: userPackage.packageId, 
      userPackageId: userPackage.id 
    });
  }

  const renderItem = ({ item, index }) => {
    // Use package data from API response instead of mock data
    const packageDetails = item.package || getPackageById(item.packageId)

    if (!packageDetails) return null

    const translateY = animatedValues.current[index]?.interpolate({
      inputRange: [0, 1],
      outputRange: [50, 0],
    }) || 0

    const opacity = animatedValues.current[index]?.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 1],
    }) || 1

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

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading packages...</Text>
        </View>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      {userPackages.length > 0 ? (
        <FlatList
          data={userPackages}
          keyExtractor={(item, index) => {
            try {
              if (item.id) {
                if (typeof item.id === 'string') return item.id;
                if (typeof item.id === 'number') return `id-${item.id}`;
                if (typeof item.id === 'object') {
                  if (item.id.toString && typeof item.id.toString === 'function') {
                    const str = String(item.id.toString());
                    if (str !== '[object Object]') return str;
                    if (item.id._id) return String(item.id._id);
                    if (item.id.$oid) return String(item.id.$oid);
                  }
                }
              }
              return `my-package-${index}`;
            } catch (error) {
              return `my-package-${index}-${Date.now()}`;
            }
          }}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <EmptyPackagesList />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  listContent: {
    padding: 16,
    paddingBottom: 30,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 30,
  },
  emptyAnimation: {
    width: 200,
    height: 200,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: COLORS.black,
    marginTop: 20,
    marginBottom: 10,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.darkGray,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 20,
  },
  browseButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 10,
  },
  browseButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "600",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 30,
  },
  loadingText: {
    fontSize: 16,
    color: COLORS.darkGray,
  },
})

export default MyPackagesTab
