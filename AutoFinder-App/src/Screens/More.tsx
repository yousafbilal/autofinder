import React, { useEffect, useState, useCallback } from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Platform } from "react-native";
import { FontAwesome, Ionicons, Feather } from "@expo/vector-icons"; 
import { RootStackParamList } from "../../navigationTypes";
import { NavigationProp, useNavigation, useFocusEffect } from "@react-navigation/native";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL, checkBackendHealth } from "../../config";
import { COLORS } from "../constants/colors";
const Logo = require("../../assets/icon.png"); // Import your local image
import { SafeAreaView } from "react-native-safe-area-context";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type FeatherIconName = keyof typeof Feather.glyphMap;

// Helper to check if JWT token is expired
const isJwtExpired = (token: string | null | undefined): boolean => {
  if (!token) return true;

  try {
    const parts = token.split(".");
    if (parts.length !== 3) return true;

    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(base64.length + (4 - (base64.length % 4)) % 4, "=");

    // atob is available in React Native runtime
    const decodedPayload = global.atob ? global.atob(padded) : Buffer.from(padded, "base64").toString("binary");
    const payload = JSON.parse(decodedPayload);

    if (!payload.exp) return true;

    const expiryMs = payload.exp * 1000;
    return Date.now() >= expiryMs;
  } catch (e) {
    console.error("⚠️ More Screen: Failed to decode JWT token", e);
    // If we can't decode token, treat as expired for safety
    return true;
  }
};

const More = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [backendAvailable, setBackendAvailable] = useState<boolean | null>(null);
  
  // Check backend health first
  const checkBackend = async () => {
    const isAvailable = await checkBackendHealth();
    setBackendAvailable(isAvailable);
    return isAvailable;
  };
  
  const fetchUserData = async () => {
    try {
      // First check if backend is available
      const isBackendUp = await checkBackend();
      
      if (!isBackendUp) {
        console.log("⚠️ Backend server is NOT available - Clearing cached data");
        // Clear cached user data if backend is down
        await AsyncStorage.removeItem('user');
        await AsyncStorage.removeItem('userToken');
        setUserData(null);
        setLoading(false);
        return;
      }
      
      // Backend is available, fetch from AsyncStorage
      const storedUserData = await AsyncStorage.getItem('user');
      if (storedUserData) {
        const parsedData = JSON.parse(storedUserData);

        // Validate JWT token expiry
        const token: string | null = parsedData.token || parsedData.userToken || null;
        const expired = isJwtExpired(token);

        if (expired) {
          console.warn("⚠️ More Screen: Stored token is expired. Clearing session and logging out.");
          await AsyncStorage.removeItem('user');
          await AsyncStorage.removeItem('token');
          await AsyncStorage.removeItem('userToken');
          setUserData(null);
          setLoading(false);
          // Navigate to login screen
          (navigation as any).reset({
            index: 0,
            routes: [{ name: 'LoginScreen' }],
          });
          return;
        }

        console.log("📥 More Screen - Fetched User Data:", parsedData);
        console.log("🖼️ Profile Image:", parsedData.profileImage);
        
        // Construct proper image URL
        let imageUrl = null;
        if (parsedData.profileImage) {
          if (parsedData.profileImage.startsWith('http')) {
            imageUrl = parsedData.profileImage;
          } else if (parsedData.profileImage.startsWith('/uploads/')) {
            imageUrl = `${API_URL}${parsedData.profileImage}`;
          } else {
            imageUrl = `${API_URL}/uploads/profile_pics/${parsedData.profileImage}`;
          }
        }
        
        setUserData({
          ...parsedData,
          profileImageUrl: imageUrl
        });
      } else {
        console.log("No user data found in AsyncStorage.");
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserData();
  }, []);

  // Refresh when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      console.log("🔄 More Screen focused, refreshing user data...");
      fetchUserData();
    }, [])
  );
  

  const handleLogout = async () => {
    try {
      // Clear all auth data so user is fully logged out
      await AsyncStorage.removeItem('user');
      await AsyncStorage.removeItem('userToken');
      await AsyncStorage.removeItem('token');
      setUserData(null);

      // Reset to LoginScreen: use root stack so entire app goes to login (not just current tab)
      const rootNav = (navigation as any).getParent?.();
      if (rootNav?.reset) {
        rootNav.reset({ index: 0, routes: [{ name: 'LoginScreen' }] });
      } else {
        navigation.reset({ index: 0, routes: [{ name: 'LoginScreen' }] });
      }
    } catch (error) {
      console.error('Error logging out:', error);
      setUserData(null);
      const rootNav = (navigation as any).getParent?.();
      if (rootNav?.reset) {
        rootNav.reset({ index: 0, routes: [{ name: 'LoginScreen' }] });
      } else {
        navigation.reset({ index: 0, routes: [{ name: 'LoginScreen' }] });
      }
    }
  };
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingTop: Math.max(insets.top, Platform.OS === 'ios' ? 10 : 0) }]}
        showsVerticalScrollIndicator={false}
      >
      <View style={styles.profileContainer}>
  {loading ? (
    <ActivityIndicator size="large" color="blue" />
  ) : userData ? (
    <>
      {userData.profileImageUrl ? (
        <Image
          source={{ uri: userData.profileImageUrl }}
          style={styles.profileImage}
        />
      ) : (
        <View style={styles.profileImagePlaceholder}>
          <Ionicons name="person" size={40} color={COLORS.white} />
        </View>
      )}
      <View style={styles.profileInfo}>
        <Text style={styles.userName}>{userData?.name || "Unknown User"}</Text>
        <Text style={styles.joiningDate}>
          Joined: &nbsp;
          {userData?.dateAdded
            ? new Date(userData.dateAdded).toLocaleDateString("en-US", { month: "short", year: "numeric" })
            : "N/A"}
        </Text>
      </View>
    </>
  ) : (
    <View style={styles.profileContainer1}>
      <Image
        source={Logo}
        style={styles.profileImage}
      />
      <View style={styles.profileInfo}>
      <Text style={styles.userName}>Hi there,</Text>
      <Text style={styles.joiningDate}>Sign in for a more personalized experience</Text>
      <TouchableOpacity style={styles.authButton} onPress={() => navigation.navigate("LoginScreen")}>
        <Text style={styles.authButtonText}>Login / Signup</Text>
      </TouchableOpacity>
      </View>
    </View>
  )}
</View>

<View style={styles.row}>
  <TouchableOpacity
    style={styles.card}
    onPress={() => {
      if (!userData) {
        navigation.navigate("LoginScreen");
      } else {
        navigation.navigate("MyAds"); 
      }
    }}
  >
    <FontAwesome name="list-alt" size={24} color="#CD0100" />
    <Text style={styles.cardText}>My Ads</Text>
  </TouchableOpacity>

  <TouchableOpacity
    style={styles.card}
    onPress={() => {
      if (!userData) {
        navigation.navigate("LoginScreen");
      } else {
        navigation.navigate("MyFavorite"); 
      }
    }}
  >
    <FontAwesome name="heart" size={24} color="#CD0100" />
    <Text style={styles.cardText}>My Favorites</Text>
  </TouchableOpacity>
</View>

      <View>
      {userData && ( 
        <View style={styles.navList}>
          <NavItem icon="user" title="Profile" onPress={() => navigation.navigate("Profile")} />
          <NavItem icon="settings" title="My Packages" onPress={() => navigation.navigate("PakagesScreen")} />
          {Platform.OS !== 'ios' && (
            <NavItem icon="package" title="Dealer Packages" onPress={() => navigation.navigate("PackagesScreen")} />
          )}
          <NavItem icon="lock" title="Security" onPress={() => navigation.navigate("SecurityScreen")} />
        </View>
      )}
      {userData && (
      <View style={styles.navList}>
          <>
            <NavItem icon="columns" title="Car Comparison" onPress={() => navigation.navigate("CarComparison")}/>
          </>
      </View>
              )}

      {/* Removed City and Language items as requested */}

      <View style={styles.navList}>
        <NavItem icon="book-open" title="Blogs" onPress={() => navigation.navigate("BlogScreen")} />
        <NavItem icon="play-circle" title="Videos" onPress={() => navigation.navigate("VideoScreen")} />
        <NavItem icon="life-buoy" title="Support" onPress={() => navigation.navigate("SupportPage")} />
        <NavItem icon="file-text" title="Terms & Conditions" onPress={() => navigation.navigate("TermsAndConditions")} />
        <NavItem icon="shield" title="Privacy Policy" onPress={() => navigation.navigate("PrivacyPolicy")} />
        <NavItem icon="volume-2" title="Advertising" onPress={() => navigation.navigate("AdvertisingScreen")} />
      </View>
    </View>

      {userData && ( 
  <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
    <Feather name="log-out" size={22} color="red" />
    <Text style={styles.logoutText}>Logout</Text>
  </TouchableOpacity>
)}

      </ScrollView>
    </SafeAreaView>
  );
};

const NavItem = ({ icon, title, onPress }: { icon: FeatherIconName; title: string; onPress?: () => void }) => (
  <TouchableOpacity style={styles.navItem} onPress={onPress}>
    <View style={styles.navLeft}>
      <Feather name={icon} size={22} color="#333" />
      <Text style={styles.navText}>{title}</Text>
    </View>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F8F8",
    padding: 15,
    marginTop: 40,
  },
  profileContainer: {
    backgroundColor: "#fff",
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    elevation: 2,
  },
  profileContainer1: {
    backgroundColor: "#fff",
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    borderRadius: 10,
  },
  profileImage: {
    width: 70,
    height: 70,
    borderRadius: 35,
  },
  profileImagePlaceholder: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "#CD0100",
    justifyContent: "center",
    alignItems: "center",
  },
  profileInfo: {
    marginLeft: 15,
  },
  userName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  joiningDate: {
    fontSize: 14,
    color: "#777",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
  },
  card: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    padding: 15,
    borderRadius: 10,
    marginHorizontal: 5,
    elevation: 2,
  },
  cardText: {
    marginTop: 5,
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
  },
  navList: {
    backgroundColor: "#fff",
    borderRadius: 10,
    paddingVertical: 5,
    marginBottom: 10,
    elevation: 2,
  },
  navItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  navLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  navText: {
    fontSize: 16,
    marginLeft: 10,
    color: "#333",
  },
  
  // Logout Button Styling
  logoutButton: {
    flexDirection: "row",
    paddingVertical: 18,
    borderRadius: 10,
    marginBottom: 35, // Added extra bottom margin
  },
  logoutText: {
    fontSize: 16,
    marginLeft: 10,
    color: "red",
    fontWeight: "bold",
  },

  authButton: {
    marginTop: 10,
    backgroundColor: "#CD0100",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    alignSelf:"flex-start"
  },
  
  authButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  
});

export default More;
