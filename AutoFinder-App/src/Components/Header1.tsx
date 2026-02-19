import { View, StyleSheet, Text, TouchableOpacity, Image } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { useNavigation, useFocusEffect } from "@react-navigation/native"
import { StackNavigationProp } from "@react-navigation/stack";
import { COLORS } from "../constants/colors"
import React, { useEffect, useState } from "react"
import { RootStackParamList } from "../../navigationTypes"; // Adjust the path if needed
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_URL } from "../../config";


type NavigationProp = StackNavigationProp<RootStackParamList>;

const Header1 = () => {
  const insets = useSafeAreaInsets()
  const navigation = useNavigation<NavigationProp>();
  const [profileImage, setProfileImage] = useState<string | null>(null);

  // Refresh profile image when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      const loadUser = async () => {
        try {
          const storedUser = await AsyncStorage.getItem("user");
          if (storedUser) {
            const parsed = JSON.parse(storedUser);
            
            // Construct proper image URL based on format
            if (parsed.profileImage) {
              let imageUrl = null;
              if (parsed.profileImage.startsWith('http')) {
                imageUrl = parsed.profileImage;
              } else if (parsed.profileImage.startsWith('/uploads/')) {
                imageUrl = `${API_URL}${parsed.profileImage}`;
              } else {
                imageUrl = `${API_URL}/uploads/profile_pics/${parsed.profileImage}`;
              }
              setProfileImage(imageUrl);
            } else {
              setProfileImage(null);
            }
          }
        } catch (e) {
          console.log("Header1: failed to load user profile image", e);
        }
      };

      loadUser();
    }, [])
  );

  return (
    <View style={[styles.container]}>
      <View style={styles.header}>
        <Text style={styles.title}>AutoFinder</Text>

        <TouchableOpacity
          activeOpacity={0.8}
          style={styles.profileWrapper}
          onPress={() => navigation.navigate("Profile")}
        >
          {profileImage ? (
            <Image
              source={{ uri: profileImage }}
              style={styles.profileImage}
            />
          ) : (
            <View style={styles.profilePlaceholder}>
              <Ionicons name="person" size={20} color="#fff" />
            </View>
          )}
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 8,
    marginTop:5,
    paddingBottom: 8,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    color: COLORS.primary,
    fontSize: 24,
    fontWeight: "bold",
  },
  profileWrapper: {
    width: 38,
    height: 38,
    borderRadius: 19,
    overflow: "hidden",
    backgroundColor: "#ffffff",
    borderWidth: 2,
    borderColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
  },
  profileImage: {
    width: "100%",
    height: "100%",
    borderRadius: 19,
  },
  profilePlaceholder: {
    width: "100%",
    height: "100%",
    borderRadius: 17,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
  },
})

export default Header1
