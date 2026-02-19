import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView } from "react-native"
import { useNavigation } from "@react-navigation/native"
import { MaterialCommunityIcons } from "@expo/vector-icons"
import Animated, { FadeInRight } from "react-native-reanimated"
import React from "react"
import { COLORS } from "../constants/colors"

const CarComparisonSection = () => {
  const navigation = useNavigation<any>()

  const popularComparisons = [
    {
      id: 1,
      car1: "Toyota Camry",
      car2: "Honda Accord",
      image1:
        "https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2000&q=80",
      image2:
        "https://images.unsplash.com/photo-1617469767053-d3b523a0b982?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2000&q=80",
    },
    {
      id: 2,
      car1: "BMW 3 Series",
      car2: "Mercedes C-Class",
      image1:
        "https://images.unsplash.com/photo-1523983388277-336a66bf9bcd?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2000&q=80",
      image2:
        "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2000&q=80",
    },
    {
      id: 3,
      car1: "Tesla Model 3",
      car2: "Audi A4",
      image1:
        "https://www.motortrend.com/files/67b6571b66bfb80008473954/1-2025-tesla-model-3-front-view.jpg",
      image2:
        "https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2000&q=80",
    },
  ]

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Car Comparison</Text>
        <TouchableOpacity onPress={() => navigation.navigate("CarComparison")}>
          <Text style={styles.viewAll}>See all</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.bannerContainer}>
        <TouchableOpacity
          style={styles.banner}
          onPress={() => navigation.navigate("CarComparison")}
          activeOpacity={0.9}
        >
          <View style={styles.bannerContent}>
            <View style={styles.bannerTextContainer}>
              <Text style={styles.bannerTitle}>Compare Cars</Text>
              <Text style={styles.bannerSubtitle}>Make the right choice by comparing specifications side by side</Text>
              <TouchableOpacity style={styles.compareButton} onPress={() => navigation.navigate("CarComparison")}>
                <Text style={styles.compareButtonText}>Compare Now</Text>
                <MaterialCommunityIcons name="arrow-right" size={16} color={COLORS.white} />
              </TouchableOpacity>
            </View>
            <View style={styles.bannerImageContainer}>
              <Image
                source={{
                  uri: "https://wpvehiclemanager.com/wp-content/uploads/2019/10/compare-3.png",
                }}
                style={styles.bannerImage}
                resizeMode="contain"
              />
            </View>
          </View>
        </TouchableOpacity>
      </View>

      <Text style={styles.popularTitle}>Popular Comparisons</Text>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.comparisonScroll}>
        {popularComparisons.map((comparison, index) => (
          <Animated.View
            key={(() => {
              try {
                if (comparison.id) {
                  if (typeof comparison.id === 'string') return comparison.id;
                  if (typeof comparison.id === 'number') return `comparison-${comparison.id}`;
                  if (typeof comparison.id === 'object' && comparison.id.toString) return String(comparison.id.toString());
                }
                return `comparison-${index}`;
              } catch (error) {
                return `comparison-${index}-${Date.now()}`;
              }
            })()}
            entering={FadeInRight.delay(index * 100).duration(400)}
            style={styles.comparisonCard}
          >
            <TouchableOpacity
              style={styles.comparisonCardInner}
              onPress={() =>
                navigation.navigate("ComparisonResults", {
                  car1: comparison.car1,
                  car2: comparison.car2,
                })
              }
              activeOpacity={0.9}
            >
              <View style={styles.comparisonImagesContainer}>
                <Image source={{ uri: comparison.image1 }} style={styles.comparisonImage} />
                <View style={styles.vsCircle}>
                  <Text style={styles.vsText}>VS</Text>
                </View>
                <Image source={{ uri: comparison.image2 }} style={styles.comparisonImage} />
              </View>
              <View style={styles.comparisonTextContainer}>
                <Text style={styles.comparisonText}>
                  {comparison.car1} vs {comparison.car2}
                </Text>
              </View>
            </TouchableOpacity>
          </Animated.View>
        ))}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginTop: 25,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.black,
  },
  viewAll: {
    fontSize: 14,
    color: COLORS.primary,
  },
  bannerContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  banner: {
    backgroundColor: "#f0f6ff",
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  bannerContent: {
    flexDirection: "row",
    padding: 16,
  },
  bannerTextContainer: {
    flex: 1,
    justifyContent: "center",
  },
  bannerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.black,
    marginBottom: 8,
  },
  bannerSubtitle: {
    fontSize: 12,
    color: COLORS.darkGray,
    marginBottom: 16,
    lineHeight: 18,
  },
  compareButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "flex-start",
  },
  compareButtonText: {
    color: COLORS.white,
    fontWeight: "600",
    marginRight: 4,
    fontSize: 12,
  },
  bannerImageContainer: {
    width: 120,
    alignItems: "center",
    justifyContent: "center",
  },
  bannerImage: {
    width: 200,
    height: 100,
  },
  popularTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.black,
    paddingHorizontal: 16,
    marginBottom: 20,
    marginTop: 10
  },
  comparisonScroll: {
    paddingLeft: 16,
  },
  comparisonCard: {
    width: 220,
    marginRight: 12,
    borderRadius: 12,
    marginBottom: 3,
    backgroundColor: COLORS.white,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: "hidden",
  },
  comparisonCardInner: {
    padding: 12,
  },
  comparisonImagesContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    position: "relative",
    marginBottom: 12,
  },
  comparisonImage: {
    width: 90,
    height: 60,
    borderRadius: 8,
  },
  vsCircle: {
    position: "absolute",
    left: "50%",
    marginLeft: -15,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
  },
  vsText: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.white,
  },
  comparisonTextContainer: {
    alignItems: "center",
  },
  comparisonText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.black,
    textAlign: "center",
  },
})

export default CarComparisonSection
