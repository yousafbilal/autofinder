import React, { useRef, useEffect, useState } from "react"
import { View, StyleSheet, Animated, Text, ActivityIndicator } from "react-native"
import { useNavigation } from "@react-navigation/native"

import packagesService, { DealerPackage } from "../../services/packagesService"
import PackageCard from "../../Components/packages/PackageCard"
import { COLORS } from "../../constants/colors"

const BikePackagesTab = () => {
  const navigation = useNavigation()
  const scrollY = useRef(new Animated.Value(0)).current
  const [packages, setPackages] = useState<DealerPackage[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const animatedValues = useRef<Animated.Value[]>([])

  useEffect(() => {
    fetchBikePackages()
  }, [])

  const fetchBikePackages = async () => {
    try {
      setLoading(true)
      setError(null)
      const bikePackages = await packagesService.fetchBikePackages()
      setPackages(bikePackages)
      
      // Initialize animated values for the fetched packages
      animatedValues.current = bikePackages.map(() => new Animated.Value(0))
      
      // Start animations
      const animations = bikePackages.map((_, index) => {
        return Animated.timing(animatedValues.current[index], {
          toValue: 1,
          duration: 500,
          delay: index * 150,
          useNativeDriver: true,
        })
      })

      Animated.stagger(100, animations).start()
    } catch (err) {
      setError('Failed to load bike packages')
      console.error('Error fetching bike packages:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSelectPackage = (packageId) => {
    navigation.navigate("PackageDetail", { packageId })
  }

  const renderItem = ({ item, index }) => {
    if (animatedValues.current[index]) {
      const translateY = animatedValues.current[index].interpolate({
        inputRange: [0, 1],
        outputRange: [50, 0],
      })

      const opacity = animatedValues.current[index].interpolate({
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
          <PackageCard packageItem={item} onPress={() => handleSelectPackage(item.id)} />
        </Animated.View>
      )
    }
    return null
  }

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading bike packages...</Text>
      </View>
    )
  }

  if (error) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text style={styles.errorText}>{error}</Text>
        <Text style={styles.retryText} onPress={fetchBikePackages}>
          Tap to retry
        </Text>
      </View>
    )
  }

  if (packages.length === 0) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text style={styles.emptyText}>No bike packages available</Text>
        <Text style={styles.retryText} onPress={fetchBikePackages}>
          Tap to refresh
        </Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <Animated.FlatList
        data={packages}
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
            return `bike-package-${index}`;
          } catch (error) {
            return `bike-package-${index}-${Date.now()}`;
          }
        }}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
          useNativeDriver: false,
        })}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  listContent: {
    padding: 12,
    paddingBottom: 20,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: COLORS.darkGray,
  },
  errorText: {
    fontSize: 16,
    color: COLORS.red,
    textAlign: 'center',
    marginBottom: 10,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.darkGray,
    textAlign: 'center',
    marginBottom: 10,
  },
  retryText: {
    fontSize: 14,
    color: COLORS.primary,
    textDecorationLine: 'underline',
  },
})

export default BikePackagesTab
