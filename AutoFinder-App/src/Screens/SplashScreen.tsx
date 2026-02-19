import React, { useEffect, useState } from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet, Dimensions } from "react-native";
import { StackNavigationProp } from "@react-navigation/stack";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS } from "../constants/colors";
import { preloadHomeData } from "../services/cacheService";

const { height } = Dimensions.get("window");

type RootStackParamList = {
  SplashScreen: undefined;
  SignupScreen: undefined;
  CarListScreen: undefined;
  HomeTabs: undefined;
  LoginScreen: undefined;
};

type NavigationProp = StackNavigationProp<RootStackParamList, "SplashScreen">;

const SplashScreen = () => {
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        // Preload home data in background while checking user
        preloadHomeData().catch(err => console.log("Preload error:", err));
        
        const storedUserData = await AsyncStorage.getItem('user');
        if (storedUserData) {
          const parsedData = JSON.parse(storedUserData);
          console.log("Fetched User Data:", parsedData);
          setUserData(parsedData);
          setIsLoggedIn(true);
        } else {
          console.log("No user data found in AsyncStorage.");
          setIsLoggedIn(false);
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      } finally {
        setLoading(false);
      }
    };
  
    fetchUserData();
  }, []);

  const navigation = useNavigation<NavigationProp>();

  useEffect(() => {
    // If user is logged in, navigate to HomeTabs after 1 second
    if (isLoggedIn) {
      const timer = setTimeout(() => {
        navigation.replace("HomeTabs");
      }, 1000); // 1 second delay

      return () => clearTimeout(timer); // Clear the timeout on unmount
    }
  }, [isLoggedIn, navigation]);

  const handleGetStarted = () => {
    // Always navigate to HomeTabs (dashboard) - users can view features without login
    navigation.replace("HomeTabs");
  };

  return (
    <View style={styles.container}>
    <View style={styles.imageContainer}>
      <Image
        source={require("../../assets/logo.png")}
        style={styles.image}
        defaultSource={require("../../assets/logo.png")}
      />
    </View>

    <View style={styles.contentContainer}>
      <Text style={styles.title}>Find Your Dream Car</Text>
      <Text style={styles.description}>
        Browse thousands of cars, connect with sellers, and find the perfect vehicle for you.
      </Text>

      {!isLoggedIn && (
        <TouchableOpacity style={styles.button} onPress={handleGetStarted} disabled={loading}>
          <Text style={styles.buttonText}>Get Started</Text>
        </TouchableOpacity>
      )}
    </View>
  </View>

        );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  imageContainer: {
    height: "65%",
    width: "100%",
    backgroundColor: COLORS.lightGray,
    justifyContent: "center",
    alignItems: "center",
  },
  image: {
    width: "100%",
    height: "100%",
    resizeMode: "contain",
  },
  contentContainer: {
    padding: 24,
    flex: 1,
    justifyContent: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: COLORS.black,
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    color: COLORS.darkGray,
    marginBottom: 32,
    lineHeight: 24,
  },
  button: {
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: "center",
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "600",
  },
})



export default SplashScreen;
