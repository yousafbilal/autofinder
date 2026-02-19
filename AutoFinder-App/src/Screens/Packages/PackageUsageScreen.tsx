"use client"

import React,{ useRef, useEffect, useState } from "react"
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Animated, Dimensions, Alert, Modal } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useNavigation, useRoute } from "@react-navigation/native"
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons"
import { AnimatedCircularProgress } from "react-native-circular-progress"
import LottieView from "lottie-react-native"
import { io } from "socket.io-client"

import { COLORS } from "../../constants/colors"
import AsyncStorage from '@react-native-async-storage/async-storage'
import { API_URL } from "../../../config"

const { width } = Dimensions.get("window")

const PackageUsageScreen = () => {
  const navigation = useNavigation()
  const route = useRoute()
  const { packageId, userPackageId } = route.params as any
  
  console.log("🔍 PackageUsageScreen loaded with params:", {
    packageId,
    userPackageId,
    allParams: route.params
  });

  const [loading, setLoading] = useState(true)
  const [packageData, setPackageData] = useState<any>(null)
  const [userPackage, setUserPackage] = useState<any>(null)
  const [socket, setSocket] = useState<any>(null)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const refreshBurstRef = useRef<any>(null)
  const [showTypePicker, setShowTypePicker] = useState(false)

  const fadeAnim = useRef(new Animated.Value(0)).current
  const slideAnim = useRef(new Animated.Value(50)).current

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        const stored = await AsyncStorage.getItem('user')
        const parsed = stored ? JSON.parse(stored) : null
        const uid = parsed?._id || parsed?.userId
        if (!uid) {
          setLoading(false)
          return
        }
        // Add timestamp to bust cache and get fresh data
        const timestamp = new Date().getTime()
        const res = await fetch(`${API_URL}/mobile/user-mobile-packages/${uid}?_t=${timestamp}`, {
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        })
        const json = await res.json()
        console.log("📦 API Response (fresh, cache-bust):", json)
        console.log("📦 Looking for packageId:", packageId, "userPackageId:", userPackageId)
        console.log("📦 Boosters from API:", json.packages?.[0]?.usage?.boostersRemaining)
        
        if (json?.success && Array.isArray(json.packages) && json.packages.length > 0) {
          console.log("📦 Available packages:", json.packages.map((x: any) => ({
            purchaseId: x.purchase?._id,
            packageId: x.purchase?.packageId,
            packageName: x.package?.name
          })))
          
          // Try to find the specific package first
          console.log("🔍 Searching for package with:", {
            userPackageId,
            packageId,
            availablePackages: (json.packages as any[]).map((p: any) => ({
              purchaseId: p.purchase?._id,
              packageId: p.purchase?.packageId,
              packageObjectId: p.package?._id
            }))
          })
          
          let found = json.packages.find((x: any) => 
            (x.purchase?._id || x._id || x.id) === userPackageId || 
            (x.purchase?.packageId || x.packageId) === packageId ||
            (x.purchase?._id || x._id) === packageId ||
            x.package?._id === packageId
          )
          
          // If specific package not found, use the first available package
          if (!found) {
            console.log("📦 Specific package not found, using first available package")
            found = (json.packages as any[])[0]
          }
          
          console.log("📦 Found package:", found ? "Yes" : "No")
          console.log("📦 Using package:", found?.package?.name || "Unknown")
          
          if (found) {
          // Normalize: handle both { purchase, package, usage } and plain purchase objects
          const purchase = found.purchase || {
            _id: found._id || found.id,
            packageId: found.packageId || packageId,
            packageName: found.packageName,
            amount: found.amount,
            status: found.status,
            approvedAt: found.approvedAt || found.createdAt,
          }
          const pkg = found.package || {}
          const usage = found.usage || {}
          // IMPORTANT: In admin panel:
          // - listingLimit / noOfBoosts = Total Ads (number of ads user can post)
          // - featuredListings = Boosters (number of boosts user can use)
          // ALWAYS use package's featuredListings for boosters (most accurate source)
          const computedTotalAds = Number(
            (pkg?.listingLimit ?? pkg?.noOfBoosts ?? usage.totalAds ?? 0)
          ) || (
            Number(usage.adsUsed ?? 0) + Number(usage.adsRemaining ?? 0)
          )
          // PRIORITY: Use whichever is greater than 0
          // pkg.featuredListings > usage.totalBoosters > usage.boostersRemaining
          const computedTotalBoosters = Number(pkg?.featuredListings || usage.totalBoosters || usage.boostersRemaining || 0);
          
          console.log('📊 Package mapping (PKG fields are PRIORITY):', {
            'pkg.listingLimit': pkg?.listingLimit,
            'pkg.noOfBoosts': pkg?.noOfBoosts,
            'pkg.featuredListings (BOOSTERS)': pkg?.featuredListings,
            'usage.totalAds': usage.totalAds,
            'usage.totalBoosters': usage.totalBoosters,
            'COMPUTED totalAds': computedTotalAds,
            'COMPUTED totalBoosters': computedTotalBoosters
          });
          console.log('🎯 BOOSTERS should be:', pkg?.featuredListings, '(from pkg.featuredListings)');
          
          const packageDataToSet = {
              id: purchase.packageId || packageId,
              name: pkg?.name || purchase.packageName || 'Package',
              type: pkg?.type || 'car',
            totalAds: computedTotalAds,
            freeBoosters: computedTotalBoosters,
              validityDays: usage.validityDays ?? (pkg?.noOfDays || pkg?.duration || 0),
              // Add missing fields from backend usage data
              adsRemaining: usage.adsRemaining || 0,
              adsUsed: usage.adsUsed || 0,
              boostersRemaining: usage.boostersRemaining || 0,
              boostersUsed: usage.boostersUsed || 0,
              // PRIORITY: pkg fields first (most accurate source)
              featuredListings: pkg?.featuredListings || usage.featuredListings || 0,
              listingLimit: pkg?.listingLimit || usage.listingLimit || 0,
              noOfBoosts: pkg?.noOfBoosts || usage.noOfBoosts || 0,
              totalBoosters: computedTotalBoosters,
            };
            console.log("📦 Setting packageData:", packageDataToSet);
            setPackageData(packageDataToSet);
            
            const userPackageData = {
              id: purchase._id || userPackageId,
              packageId: purchase.packageId || packageId,
              packageName: purchase.packageName || pkg?.name || 'Package',
              amount: Number(purchase.amount || found.amount || 0),
              status: purchase.status || found.status || (found.isActive ? 'approved' : 'pending'),
              active: found.isActive ?? found.active ?? true,
              expiryDate: found.expiryDate ? new Date(found.expiryDate) : new Date(),
              purchaseDate: purchase.approvedAt ? new Date(purchase.approvedAt) : (found.createdAt ? new Date(found.createdAt) : new Date()),
              adsRemaining: usage.adsRemaining ?? (pkg?.listingLimit || pkg?.noOfBoosts || 0),
              boostersRemaining: usage.boostersRemaining ?? (pkg?.featuredListings || 0),
            };
            
            console.log("📅 Expiry date from API:", {
              rawExpiryDate: found.expiryDate,
              parsedExpiryDate: found.expiryDate ? new Date(found.expiryDate) : null,
              isActive: found.isActive || found.active,
              daysRemaining: found.expiryDate ? Math.ceil((new Date(found.expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : 0
            });
            
            console.log("📦 Setting userPackage:", userPackageData);
            setUserPackage(userPackageData);
          }
        } else {
          console.log("❌ No packages found or invalid response format")
        }
      } catch (e) {
        console.error("❌ Error fetching package data:", e)
      } finally {
        setLoading(false)
      }
    }
    load()

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
    ]).start()
  }, [])

  // Setup socket connection for real-time updates
  useEffect(() => {
    setupSocketConnection()
    getCurrentUserId()
    
    return () => {
      if (socket) {
        socket.disconnect()
      }
    }
  }, [])

  const getCurrentUserId = async () => {
    try {
      const stored = await AsyncStorage.getItem('user')
      const parsed = stored ? JSON.parse(stored) : null
      const userId = parsed?._id || parsed?.userId
      setCurrentUserId(userId)
    } catch (error) {
      console.error('Error getting user ID:', error)
    }
  }

  const setupSocketConnection = () => {
    try {
      const newSocket = io(API_URL)
      setSocket(newSocket)

      newSocket.on('connect', () => {
        console.log('Connected to socket for package usage updates')
      })

      // Helper: burst refresh a few times to catch backend propagation delays
      const scheduleRefreshBurst = () => {
        if (refreshBurstRef.current) clearInterval(refreshBurstRef.current)
        let runs = 0
        refreshBurstRef.current = setInterval(() => {
          runs += 1
          refreshPackageUsage()
          if (runs >= 5) {
            clearInterval(refreshBurstRef.current)
            refreshBurstRef.current = null
          }
        }, 3000)
      }

      // Listen for ad approval notifications
      newSocket.on('notification', (data) => {
        console.log('🔔 Received notification:', data)
        console.log('🔍 Current user ID:', currentUserId)
        console.log('🔍 Notification user ID:', data.userId)
        console.log('🔍 Notification type:', data.type)
        console.log('🔍 Notification status:', data.status)
        
        if (data.userId === currentUserId && 
            (data.type === 'free_ad_status_updated' || 
             data.type === 'bike_ad_status_updated' || 
             data.type === 'premium_ad_status_updated' ||
             data.type === 'featured_ad_status_updated') &&
            data.status === 'Approved') {
          
          console.log('✅ Ad approved for current user, refreshing package usage')
          console.log('📦 Ad type:', data.type, 'Status:', data.status)
          // Refresh package usage when user's ad gets approved
          console.log('🔄 Scheduling refresh burst after ad approval')
          scheduleRefreshBurst()
        } else {
          console.log('❌ Notification not for current user or not an approval:', {
            isCurrentUser: data.userId === currentUserId,
            isApproval: data.status === 'Approved',
            type: data.type
          })
        }
      })

      // Generic events that admins/backends might emit on approval/usage change
      const genericEvents = [
        'ad_approved',
        'ad_status_updated',
        'mobile_package_purchase_approved',
        'dealer_package_usage_updated'
      ]
      genericEvents.forEach(ev => {
        newSocket.on(ev, (payload:any) => {
          try {
            console.log(`🔔 Received ${ev}:`, payload)
            if (!payload || (payload.userId && payload.userId !== currentUserId)) return
            scheduleRefreshBurst()
          } catch {}
        })
      })

      newSocket.on('disconnect', () => {
        console.log('Disconnected from socket')
      })

      newSocket.on('error', (error) => {
        console.error('Socket error:', error)
      })

      // Listen for immediate package usage updates when ad is posted
      newSocket.on('package_usage_immediate_update', (data) => {
        console.log('🔄 Received immediate package usage update after ad post:', data)
        
        if (data.userId === currentUserId) {
          console.log('✅ Immediate package usage update for current user, refreshing now')
          // Update package usage immediately without delay
          refreshPackageUsage()
        }
      })

    } catch (error) {
      console.error('Error setting up socket connection:', error)
    }
  }

  const refreshPackageUsage = async () => {
    try {
      console.log('🔄 Starting package usage refresh...')
      setRefreshing(true)
      const stored = await AsyncStorage.getItem('user')
      const parsed = stored ? JSON.parse(stored) : null
      const uid = parsed?._id || parsed?.userId
      if (!uid) {
        console.log('❌ No user ID found for refresh')
        return
      }

      // Add timestamp to bust cache and get fresh data
      const timestamp = new Date().getTime()
      console.log('📡 Fetching package usage for user:', uid, '(cache-bust:', timestamp, ')')
      const res = await fetch(`${API_URL}/mobile/user-mobile-packages/${uid}?_t=${timestamp}`, {
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      })
      const json = await res.json()
      console.log('📦 Package usage response (fresh):', json)
      console.log('📦 Fresh boostersRemaining:', json.packages?.[0]?.usage?.boostersRemaining)
      
      if (json?.success && Array.isArray(json.packages)) {
        const found = json.packages.find((x: any) => 
          (x.purchase?._id || x._id || x.id) === userPackageId || 
          (x.purchase?.packageId || x.packageId) === packageId ||
          (x.purchase?._id || x._id) === packageId
        )
        if (found) {
          console.log('✅ Found matching package:', found)
          // Normalize purchase object
          const purchase = found.purchase || {
            _id: found._id || found.id || userPackageId,
            packageId: found.packageId || packageId,
            packageName: found.packageName,
            amount: found.amount,
            status: found.status,
            approvedAt: found.approvedAt || found.createdAt,
          }
          const pkg = found.package || {}
          const usage = found.usage || {}
          console.log('📊 Package usage data:', usage)
          // Update packageData as well to ensure totals are correct
          // IMPORTANT: listingLimit/noOfBoosts = Total Ads, featuredListings = Boosters
          // PRIORITY: Use package fields first (most accurate), then usage data
          const computedTotalAds2 = Number(
            (pkg?.listingLimit ?? pkg?.noOfBoosts ?? usage.totalAds ?? 0)
          ) || (
            Number(usage.adsUsed ?? 0) + Number(usage.adsRemaining ?? 0)
          )
          // PRIORITY: Use whichever is greater than 0
          const computedTotalBoosters2 = Number(pkg?.featuredListings || usage.totalBoosters || usage.boostersRemaining || 0);
          const nextPackageData = {
            id: purchase.packageId || packageId,
            name: pkg?.name || purchase.packageName || 'Package',
            type: pkg?.type || 'car',
            totalAds: computedTotalAds2,
            freeBoosters: computedTotalBoosters2,
            validityDays: Number(usage.validityDays ?? pkg?.noOfDays ?? pkg?.duration ?? 0),
            // PRIORITY: pkg fields first (most accurate source)
            featuredListings: pkg?.featuredListings || 0,
            listingLimit: pkg?.listingLimit || 0,
            noOfBoosts: pkg?.noOfBoosts || 0,
            totalBoosters: computedTotalBoosters2,
          }
          setPackageData((prev:any)=> ({ ...(prev||{}), ...nextPackageData }))
          setUserPackage({
            id: purchase._id || userPackageId,
            packageId: purchase.packageId || packageId,
            active: found.isActive ?? found.active ?? true,
            expiryDate: found.expiryDate ? new Date(found.expiryDate) : new Date(),
            purchaseDate: purchase.approvedAt ? new Date(purchase.approvedAt) : (found.createdAt ? new Date(found.createdAt) : new Date()),
            adsRemaining: Number(usage.adsRemaining ?? pkg?.listingLimit ?? pkg?.noOfBoosts ?? 0),
            boostersRemaining: Number(usage.boostersRemaining ?? pkg?.featuredListings ?? 0),
          })
          console.log('✅ Package usage updated successfully')
        } else {
          console.log('❌ Package not found in response')
        }
      } else {
        console.log('❌ Invalid response format')
      }
    } catch (error) {
      console.error('Error refreshing package usage:', error)
    } finally {
      setRefreshing(false)
    }
  }

  const handlePostNewAd = () => {
    if (packageData && userPackage) {
      // Check if package is expired
      const now = new Date();
      const expiryDate = userPackage.expiryDate ? new Date(userPackage.expiryDate) : new Date();
      const isExpired = expiryDate < now || !userPackage.active;
      
      if (isExpired) {
        Alert.alert(
          "Package Expired",
          "Your package has expired. Please renew your package to create new posts. After renewal and admin approval, you will be able to create posts.",
          [
            { text: "Cancel", style: "cancel" },
            { 
              text: "Renew Package", 
              onPress: () => {
                // Navigate to PackagesScreen instead of PackageDetail to avoid errors
                const packageType = packageData?.type || userPackage?.packageType || 'car';
                console.log("🔄 Renew Package from Post New Ad alert, navigating with type:", packageType);
                
                if (packageType === 'bike') {
                  (navigation as any).navigate('PackagesScreen', { screen: 'bike' });
                } else if (packageType === 'car') {
                  (navigation as any).navigate('PackagesScreen', { screen: 'car' });
                } else {
                  (navigation as any).navigate('PackagesScreen', { screen: 'car' });
                }
              }
            }
          ]
        );
        return;
      }

      // Check package status - must be approved
      if (userPackage.status !== 'approved' && userPackage.status !== 'Approved') {
        Alert.alert(
          "Package Pending Approval",
          "Your package is pending admin approval. Once approved, you will be able to create posts.",
          [
            { text: "OK", style: "default" },
            { 
              text: "View Packages", 
              onPress: () => (navigation as any).navigate("PackagesScreen")
            }
          ]
        );
        return;
      }

      // Check if user has reached their ad limit
      if (userPackage.adsRemaining <= 0) {
        // Show buy again message
        Alert.alert(
          "Ad Limit Reached",
          `You have used all ${totalAds} ads from your package. Please buy a new package to create more ads.`,
          [
            { text: "Cancel", style: "cancel" },
            { text: "Buy New Package", onPress: () => (navigation as any).navigate("PackagesScreen") }
          ]
        )
        return
      }

      // Open type picker so user can choose Cars / Bike / Rent Car / Autostore / User
      setShowTypePicker(true)
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <Text style={styles.errorText}>Loading...</Text>
      </SafeAreaView>
    )
  }

  if (!packageData || !userPackage) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <Text style={styles.errorText}>Package not found</Text>
        <Text style={styles.errorSubText}>Unable to load package details. Please try again.</Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.errorButton}>Go Back</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => (navigation as any).navigate("PackagesScreen")} style={styles.retryButton}>
          <Text style={styles.retryButtonText}>View All Packages</Text>
        </TouchableOpacity>
      </SafeAreaView>
    )
  }

  // Debug package data structure
  console.log('📦 Package data structure:', {
    totalAds: packageData?.totalAds,
    freeBoosters: packageData?.freeBoosters,
    noOfBoosts: packageData?.noOfBoosts,
    'featuredListings (BOOSTERS SOURCE)': packageData?.featuredListings,
    listingLimit: packageData?.listingLimit,
    adsRemaining: userPackage?.adsRemaining,
    boostersRemaining: userPackage?.boostersRemaining,
    totalBoosters: packageData?.totalBoosters
  });
  console.log('🎯 DISPLAY VALUES - totalAds:', packageData?.totalAds, 'totalBoosters:', packageData?.featuredListings || packageData?.freeBoosters);

  // IMPORTANT: totalAds uses listingLimit/noOfBoosts, totalBoosters uses featuredListings only
  // Use || for fallback (0 is falsy, so it will fallback to next value)
  const totalAds = Number(packageData?.totalAds || packageData?.listingLimit || packageData?.noOfBoosts || userPackage?.adsRemaining || 0);
  const totalBoosters = Number(packageData?.featuredListings || packageData?.freeBoosters || packageData?.totalBoosters || userPackage?.boostersRemaining || 0);
  
  console.log('🔢 FINAL DISPLAY VALUES:', { totalAds, totalBoosters, 
    'packageData.featuredListings': packageData?.featuredListings,
    'packageData.freeBoosters': packageData?.freeBoosters,
    'packageData.totalBoosters': packageData?.totalBoosters
  });
  
  const adUsagePercentage = totalAds > 0 ? ((totalAds - (userPackage?.adsRemaining ?? 0)) / totalAds) * 100 : 0
  const boosterUsagePercentage = totalBoosters > 0 ? ((totalBoosters - userPackage.boostersRemaining) / totalBoosters) * 100 : 0

  // Calculate days remaining until expiry
  const today = new Date()
  const expiryDate = userPackage?.expiryDate ? new Date(userPackage.expiryDate) : new Date()
  const daysRemaining = Math.max(0, Math.ceil(((expiryDate as any).getTime() - today.getTime()) / (1000 * 60 * 60 * 24)))
  const daysUsed = (packageData?.validityDays || 0) - daysRemaining
  const validityUsagePercentage = packageData.validityDays > 0 ? (daysUsed / packageData.validityDays) * 100 : 0

  const format2 = (n: number) => String(Math.max(0, n)).padStart(2, '0')
  const adsUsed = Math.max(0, totalAds - (userPackage?.adsRemaining ?? 0))
  const adsRemainingDerived = Math.max(0, totalAds - adsUsed)
  const boostersUsed = Math.max(0, totalBoosters - (userPackage?.boostersRemaining || 0))

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.black} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Package Usage</Text>
        <View style={styles.rightPlaceholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Animated.View
          style={[
            styles.packageCard,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <View style={styles.packageHeader}>
            <Text style={styles.packageName}>{userPackage.packageName || packageData.name}</Text>
            <View style={[styles.statusBadge, userPackage.active ? styles.activeBadge : styles.expiredBadge]}>
              <Text style={styles.statusText}>{(userPackage.status || (userPackage.active ? 'approved' : 'expired')).toString().toUpperCase()}</Text>
            </View>
          </View>

          <View style={styles.packageTypeContainer}>
            <Text style={styles.packageType}>{packageData.type === "car" ? "Car Package" : "Bike Package"} • PKR {Number(userPackage.amount || 0).toLocaleString()}</Text>
          </View>

          <View style={styles.dateInfo}>
            <View style={styles.dateItem}>
              <Text style={styles.dateLabel}>Purchased on</Text>
              <Text style={styles.dateValue}>{userPackage.purchaseDate.toLocaleDateString()}</Text>
            </View>
            <View style={styles.dateItem}>
              <Text style={styles.dateLabel}>Expires on</Text>
              <Text style={styles.dateValue}>{userPackage.expiryDate.toLocaleDateString()}</Text>
            </View>
          </View>

          {userPackage.active && daysRemaining > 0 && (
            <View style={styles.expiryAlert}>
              <Ionicons name="alarm-outline" size={20} color={COLORS.primary} style={styles.expiryIcon} />
              <Text style={styles.expiryText}>
                {daysRemaining === 1 ? "Expires tomorrow!" : `Expires in ${daysRemaining} days`}
              </Text>
            </View>
          )}
        </Animated.View>

        {/* Existing UI will reflect fetched data; no extra summary section */}

        {/* Quick metrics row */}
        <View style={styles.quickRow}>
          <View style={styles.quickItem}>
            <Text style={styles.quickLabel}>Total Ads</Text>
            <Text style={styles.quickValue}>{totalAds}</Text>
          </View>
          <View style={styles.quickItem}>
            <Text style={styles.quickLabel}>Boosters</Text>
            <Text style={styles.quickValue}>{totalBoosters}</Text>
          </View>
          <View style={styles.quickItem}>
            <Text style={styles.quickLabel}>Validity</Text>
            <Text style={styles.quickValue}>{packageData.validityDays} days</Text>
          </View>
        </View>

        {/* Dates inline */}
        <View style={styles.quickRow}>
          <View style={styles.quickItemWide}>
            <Text style={styles.quickLabel}>Purchased On</Text>
            <Text style={styles.quickValue}>{userPackage.purchaseDate.toLocaleDateString()}</Text>
          </View>
          <View style={styles.quickItemWide}>
            <Text style={styles.quickLabel}>Expires On</Text>
            <Text style={styles.quickValue}>{userPackage.expiryDate.toLocaleDateString()}</Text>
          </View>
        </View>

        <Animated.View
          style={[
            styles.usageSection,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Usage Statistics</Text>
            {refreshing && (
              <View style={styles.refreshingIndicator}>
                <Ionicons name="refresh" size={16} color={COLORS.primary} />
                <Text style={styles.refreshingText}>Updating...</Text>
              </View>
            )}
          </View>

          <View style={styles.metricsContainer}>
            <View style={styles.metricItem}>
              <AnimatedCircularProgress
                size={100}
                width={10}
                fill={adUsagePercentage}
                tintColor={COLORS.primary}
                backgroundColor={COLORS.lightGray}
                rotation={0}
                lineCap="round"
              >
                {(fill: number) => <Text style={styles.progressText}>{Math.round(fill)}%</Text>}
              </AnimatedCircularProgress>
              <Text style={styles.metricTitle}>Ad Usage</Text>
              <Text style={styles.metricValue}>
                {format2(adsUsed)} of {format2(totalAds)} Used
              </Text>
            </View>

            <View style={styles.metricItem}>
              <AnimatedCircularProgress
                size={100}
                width={10}
                fill={boosterUsagePercentage}
                tintColor="#4CAF50"
                backgroundColor={COLORS.lightGray}
                rotation={0}
                lineCap="round"
              >
                {(fill: number) => <Text style={styles.progressText}>{Math.round(fill)}%</Text>}
              </AnimatedCircularProgress>
              <Text style={styles.metricTitle}>Boosters</Text>
              <Text style={styles.metricValue}>
                {format2(boostersUsed)} of {format2(totalBoosters)} Used
              </Text>
            </View>

            <View style={styles.metricItem}>
              <AnimatedCircularProgress
                size={100}
                width={10}
                fill={validityUsagePercentage}
                tintColor="#FF9800"
                backgroundColor={COLORS.lightGray}
                rotation={0}
                lineCap="round"
              >
                {(fill: number) => <Text style={styles.progressText}>{Math.round(fill)}%</Text>}
              </AnimatedCircularProgress>
              <Text style={styles.metricTitle}>Validity</Text>
              <Text style={styles.metricValue}>
                {daysUsed}/{packageData.validityDays} Days
              </Text>
            </View>
          </View>

          <View style={styles.remainingContainer}>
            <View style={styles.remainingItem}>
              <MaterialCommunityIcons name="car-multiple" size={24} color={COLORS.primary} />
              <View style={styles.remainingInfo}>
                <Text style={styles.remainingLabel}>Ad Usage</Text>
                <Text style={styles.remainingValue}>
                  {totalAds > 0 ? 
                    `${totalAds - userPackage.adsRemaining} of ${totalAds}` : 
                    `${userPackage.adsRemaining} remaining`
                  }
                </Text>
              </View>
            </View>

            <View style={styles.remainingItem}>
              <Ionicons name="rocket-outline" size={24} color={COLORS.primary} />
              <View style={styles.remainingInfo}>
                <Text style={styles.remainingLabel}>Booster Usage</Text>
                <Text style={styles.remainingValue}>
                  {totalBoosters > 0 ? 
                    `${totalBoosters - userPackage.boostersRemaining} of ${totalBoosters}` : 
                    `${userPackage.boostersRemaining} remaining`
                  }
                </Text>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* Removed red warning block to simplify UX */}

        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={[
              styles.actionButton,
              ((userPackage.expiryDate && new Date(userPackage.expiryDate) < new Date()) || 
               !userPackage.active || 
               (userPackage.status !== 'approved' && userPackage.status !== 'Approved')) 
                ? styles.disabledButton 
                : null
            ]}
            onPress={() => {
              // Check expiry first
              const now = new Date();
              const expiryDate = userPackage.expiryDate ? new Date(userPackage.expiryDate) : new Date();
              const isExpired = expiryDate < now || !userPackage.active;
              
              if (isExpired) {
                Alert.alert(
                  "Package Expired",
                  "Your package has expired. Please renew your package to create new posts. After renewal and admin approval, you will be able to create posts.",
                  [
                    { text: "Cancel", style: "cancel" },
                    { 
                      text: "Renew Package", 
                      onPress: () => {
                        // Navigate to PackagesScreen instead of PackageDetail to avoid errors
                        const packageType = packageData?.type || userPackage?.packageType || 'car';
                        console.log("🔄 Renew Package from alert, navigating with type:", packageType);
                        
                        if (packageType === 'bike') {
                          (navigation as any).navigate('PackagesScreen', { screen: 'bike' });
                        } else if (packageType === 'car') {
                          (navigation as any).navigate('PackagesScreen', { screen: 'car' });
                        } else {
                          (navigation as any).navigate('PackagesScreen', { screen: 'car' });
                        }
                      }
                    }
                  ]
                );
                return;
              }

              // Check approval status
              if (userPackage.status !== 'approved' && userPackage.status !== 'Approved') {
                Alert.alert(
                  "Package Pending Approval",
                  "Your package is pending admin approval. Once approved, you will be able to create posts.",
                  [
                    { text: "OK", style: "default" },
                    { 
                      text: "View Packages", 
                      onPress: () => (navigation as any).navigate("PackagesScreen")
                    }
                  ]
                );
                return;
              }

              if (userPackage.adsRemaining <= 0) {
                (navigation as any).navigate('PackagesScreen', { screen: 'car' })
              } else {
                handlePostNewAd()
              }
            }}
          >
            <Text style={[
              styles.actionButtonText,
              ((userPackage.expiryDate && new Date(userPackage.expiryDate) < new Date()) || 
               !userPackage.active || 
               (userPackage.status !== 'approved' && userPackage.status !== 'Approved')) 
                ? styles.disabledButtonText 
                : null
            ]}>
              {(() => {
                const now = new Date();
                const expiryDate = userPackage.expiryDate ? new Date(userPackage.expiryDate) : new Date();
                const isExpired = expiryDate < now || !userPackage.active;
                
                if (isExpired) {
                  return "Package Expired - Renew";
                }
                if (userPackage.status !== 'approved' && userPackage.status !== 'Approved') {
                  return "Pending Approval";
                }
                if (userPackage.adsRemaining <= 0) {
                  return "Buy New Package";
                }
                return "Post New Ad";
              })()}
            </Text>
          </TouchableOpacity>

          {userPackage.active && (
            <TouchableOpacity
              style={[styles.actionButton, styles.secondaryButton]}
              onPress={() => (navigation as any).navigate("PackagesScreen", { packageId })}
            >
              <Text style={styles.secondaryButtonText}>View Package Details</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.actionButton, styles.refreshButton]}
            onPress={refreshPackageUsage}
          >
            <Text style={styles.refreshButtonText}>
              {refreshing ? "Refreshing..." : "🔄 Refresh Usage"}
            </Text>
          </TouchableOpacity>

          {!userPackage.active && (
            <TouchableOpacity
              style={[styles.actionButton, styles.renewButton]}
              onPress={() => {
                // Determine package type from packageData
                const packageType = packageData?.type || 'car';
                console.log("🔄 Renew Package clicked, navigating to PackagesScreen with type:", packageType);
                
                // Navigate to PackagesScreen instead of PackageDetail to avoid "package not found" errors
                if (packageType === 'bike') {
                  (navigation as any).navigate('PackagesScreen', { screen: 'bike' });
                } else if (packageType === 'car') {
                  (navigation as any).navigate('PackagesScreen', { screen: 'car' });
                } else {
                  // Default to car packages or PremiumPackagesScreen
                  (navigation as any).navigate('PackagesScreen', { screen: 'car' });
                }
              }}
            >
              <Text style={styles.renewButtonText}>Renew Package</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.helpSection}>
          <LottieView
            // source={require("../../assets/animations/customer-support.json")}
            source={require("../../../assets/animations/empty-box.json")}
            style={styles.helpAnimation}
            autoPlay
            loop
          />
          <Text style={styles.helpTitle}>Need Help?</Text>
          <Text style={styles.helpText}>
            If you have any questions about your package or need assistance, our support team is ready to help.
          </Text>
          <TouchableOpacity style={styles.helpButton} onPress={() => (navigation as any).navigate("SupportPage")}>
            <Text style={styles.helpButtonText}>Contact Support</Text>
          </TouchableOpacity>
        </View>
        {/* Post type picker modal */}
        <Modal
          visible={showTypePicker}
          transparent
          animationType="slide"
          onRequestClose={() => setShowTypePicker(false)}
        >
          <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={() => setShowTypePicker(false)}>
            <View style={styles.sheet}>
              <Text style={styles.sheetTitle}>Choose what to post</Text>
              <TouchableOpacity style={styles.sheetItem} onPress={() => { setShowTypePicker(false); (navigation as any).navigate("PostCarAdFeatured", { selectedPackage: packageData }) }}>
                <Ionicons name="car-outline" size={22} color={COLORS.primary} />
                <Text style={styles.sheetItemText}>Cars</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.sheetItem} onPress={() => { setShowTypePicker(false); (navigation as any).navigate("PostBikeAdFeatured", { selectedPackage: packageData }) }}>
                <Ionicons name="bicycle-outline" size={22} color={COLORS.primary} />
                <Text style={styles.sheetItemText}>Bike</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.sheetItem} onPress={() => { setShowTypePicker(false); (navigation as any).navigate("AllOffersScreen", { from: 'PackageUsage', create: 'rent_car' }) }}>
                <Ionicons name="key-outline" size={22} color={COLORS.primary} />
                <Text style={styles.sheetItemText}>Rent Car</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.sheetItem} onPress={() => { setShowTypePicker(false); (navigation as any).navigate("AllOffersScreen", { from: 'PackageUsage', create: 'autostore' }) }}>
                <Ionicons name="storefront-outline" size={22} color={COLORS.primary} />
                <Text style={styles.sheetItemText}>Autostore</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.sheetItem} onPress={() => { setShowTypePicker(false); (navigation as any).navigate("AllOffersScreen", { from: 'PackageUsage', create: 'user' }) }}>
                <Ionicons name="person-circle-outline" size={22} color={COLORS.primary} />
                <Text style={styles.sheetItemText}>User</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.sheetCancel} onPress={() => setShowTypePicker(false)}>
                <Text style={styles.sheetCancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>
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
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.black,
  },
  rightPlaceholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  packageCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  packageHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  packageName: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.black,
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
  statusText: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.primary,
  },
  packageTypeContainer: {
    marginBottom: 12,
  },
  packageType: {
    fontSize: 16,
    color: COLORS.darkGray,
  },
  dateInfo: {
    flexDirection: "row",
    marginBottom: 16,
  },
  dateItem: {
    marginRight: 24,
  },
  dateLabel: {
    fontSize: 14,
    color: COLORS.darkGray,
    marginBottom: 2,
  },
  dateValue: {
    fontSize: 16,
    fontWeight: "500",
    color: COLORS.black,
  },
  expiryAlert: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(85, 110, 230, 0.1)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  expiryIcon: {
    marginRight: 8,
  },
  expiryText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: "600",
  },
  usageSection: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.black,
  },
  refreshingIndicator: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.primary + "10",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  refreshingText: {
    fontSize: 12,
    color: COLORS.primary,
    marginLeft: 4,
    fontWeight: "600",
  },
  metricsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    flexWrap: "wrap",
    marginBottom: 20,
  },
  metricItem: {
    alignItems: "center",
    width: "30%",
  },
  progressText: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.black,
  },
  progressContent: {
    alignItems: "center",
    justifyContent: "center",
  },
  progressPercentage: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.primary,
  },
  progressCompleted: {
    fontSize: 10,
    color: "#4CAF50",
    fontWeight: "600",
    marginTop: 2,
  },
  progressRemaining: {
    fontSize: 9,
    color: "#F44336",
    fontWeight: "600",
    marginTop: 1,
  },
  metricTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.black,
    marginTop: 8,
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 14,
    color: COLORS.darkGray,
  },
  remainingContainer: {
    backgroundColor: "#F9FAFE",
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
  },
  quickRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  quickItem: {
    width: "32%",
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  quickItemWide: {
    width: "48%",
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  quickLabel: {
    fontSize: 12,
    color: COLORS.darkGray,
    marginBottom: 2,
  },
  quickValue: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.black,
  },
  remainingItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  remainingInfo: {
    marginLeft: 16,
    flex: 1,
  },
  remainingLabel: {
    fontSize: 16,
    color: COLORS.darkGray,
  },
  remainingValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.black,
  },
  actionButtons: {
    marginBottom: 24,
  },
  actionButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 12,
  },
  actionButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "600",
  },
  disabledButton: {
    backgroundColor: COLORS.gray,
    opacity: 0.7,
  },
  disabledButtonText: {
    color: COLORS.white,
  },
  refreshButton: {
    backgroundColor: COLORS.warning,
    marginTop: 8,
  },
  refreshButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '600',
  },
  limitReachedContainer: {
    backgroundColor: COLORS.error + "10",
    borderWidth: 1,
    borderColor: COLORS.error + "30",
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    flexDirection: "row",
    alignItems: "center",
  },
  limitReachedText: {
    color: COLORS.error,
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 8,
    flex: 1,
  },
  secondaryButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  secondaryButtonText: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: "600",
  },
  renewButton: {
    backgroundColor: "#4CAF50",
  },
  renewButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "600",
  },
  helpSection: {
    alignItems: "center",
    padding: 20,
    backgroundColor: "#F9FAFE",
    borderRadius: 16,
    marginBottom: 24,
  },
  helpAnimation: {
    width: 120,
    height: 120,
  },
  helpTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.black,
    marginVertical: 8,
  },
  helpText: {
    fontSize: 14,
    color: COLORS.darkGray,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 16,
  },
  helpButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: 8,
  },
  helpButtonText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: "500",
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
  errorSubText: {
    fontSize: 14,
    color: COLORS.darkGray,
    marginBottom: 20,
    textAlign: "center",
  },
  retryButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 10,
  },
  retryButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "600",
  },
  // Modal styles
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  sheetTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.black,
    marginBottom: 8,
    textAlign: 'center',
  },
  sheetItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  sheetItemText: {
    fontSize: 15,
    color: COLORS.black,
    fontWeight: '500',
    marginLeft: 10,
  },
  sheetCancel: {
    marginTop: 8,
    alignSelf: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: COLORS.primary,
    borderRadius: 8,
  },
  sheetCancelText: {
    color: COLORS.white,
    fontWeight: '600',
  },
})

export default PackageUsageScreen
