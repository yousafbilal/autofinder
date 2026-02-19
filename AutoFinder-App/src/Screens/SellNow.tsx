import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Platform, Alert } from "react-native";
import { FontAwesome, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeIonicons, SafeFontAwesome, SafeMaterialCommunityIcons } from '../utils/iconHelper';
import { SafeAreaView } from "react-native-safe-area-context";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AsyncStorage from '@react-native-async-storage/async-storage';

import { useNavigation } from '@react-navigation/native';
import { NavigationProp } from '@react-navigation/native';
import { RootStackParamList } from '../../navigationTypes';

const SellNow = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();

  const checkLoginAndNavigate = async (screenName: keyof RootStackParamList) => {
    try {
      const storedUserData = await AsyncStorage.getItem('user');
      if (!storedUserData) {
        Alert.alert(
          "Login Required",
          "You are not logged in. Please login to create a post.",
          [
            {
              text: "Cancel",
              style: "cancel"
            },
            {
              text: "Login",
              onPress: () => {
                navigation.navigate("LoginScreen");
              }
            }
          ]
        );
        return;
      }
      // User is logged in, proceed with navigation
      navigation.navigate(screenName);
    } catch (error) {
      console.error("Error checking login status:", error);
      // If error checking, still allow navigation (fail open)
      navigation.navigate(screenName);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView 
        contentContainerStyle={[styles.scrollContent, { paddingTop: Math.max(insets.top, 20) }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Question */}
        <Text style={styles.question}>What are you listing?</Text>
        <Text style={styles.question1}>Choose the category that your ad fits into</Text>

        {/* Category Options - Grid Layout */}
        <View style={styles.gridContainer}>
        {/* Cars Category */}
        <TouchableOpacity
          style={styles.categoryCard}
          onPress={() => checkLoginAndNavigate("PostFreeAd")}
        >
          <SafeIonicons name="car-outline" size={50} color="#CD0100" />
          <Text style={styles.categoryText}>Cars</Text>
        </TouchableOpacity>

        {/* Motorcycle Category */}
        <TouchableOpacity
          style={styles.categoryCard}
          onPress={() => checkLoginAndNavigate("SellBikeScreen")}
        >
          <SafeFontAwesome name="motorcycle" size={50} color="#CD0100" />
          <Text style={styles.categoryText}>Motorcycle</Text>
        </TouchableOpacity>

        {/* Auto Parts Category */}
        <TouchableOpacity style={styles.categoryCard}
        onPress={() => checkLoginAndNavigate("SellAutoScreen")}>
          <SafeIonicons name="construct" size={50} color="#CD0100" />
          <Text style={styles.categoryText}>Auto Parts</Text>
        </TouchableOpacity>

        {/* Rent Service Category */}
        <TouchableOpacity style={styles.categoryCard}
         onPress={() => checkLoginAndNavigate("CarRentalServiceScreen")}>
          <SafeIonicons name="ribbon" size={50} color="#CD0100" />
          <Text style={styles.categoryText}>Rent Service</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.categoryCard}
         onPress={() => checkLoginAndNavigate("BuyCarForMeScreen")}>
          <SafeIonicons name="car-sport" size={50} color="#CD0100" />
          <Text style={styles.categoryText}>Buy Car For Me</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.categoryCard}
         onPress={() => checkLoginAndNavigate("CarInspectionScreen")}>
          <SafeMaterialCommunityIcons name="car-wrench" size={50} color="#CD0100" />
          <Text style={styles.categoryText}>Car Inspection</Text>
        </TouchableOpacity>
        
      </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f8f8",
  },
  scrollContent: {
    alignItems: "center",
    paddingBottom: Platform.OS === 'ios' ? 20 : 16,
  },
  question: {
    fontSize: 20,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 5,
  },
  question1: {
    fontSize: 14,
    fontWeight: "400",
    textAlign: "center",
    marginBottom: 20,
  },
  gridContainer: {
    flexDirection: "row", // To align items in a row
    flexWrap: "wrap", // Allows wrapping of items to the next line
    justifyContent: "center", // Center the items
    marginTop: 20,
    width: "80%", // Limit width to 80% for better spacing
  },
  categoryCard: {
    backgroundColor: "#f0f0f0",
    paddingVertical: 15,
    paddingHorizontal: 20,
    margin: 10,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    width: "40%", // 2 cards per row
    height: 120, // Adjust height for consistency
    elevation: 5, // Add shadow effect for iOS and Android
    shadowColor: "#000", 
    shadowOffset: { width: 0, height: 2 }, 
    shadowOpacity: 0.2, 
    shadowRadius: 4,
  },
  categoryText: {
    marginTop: 10,
    fontSize: 16,
    fontWeight: "500",
    textAlign: "center",
  },
});

export default SellNow;
