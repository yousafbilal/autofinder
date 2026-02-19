import React, { useEffect, useState, useCallback, useRef } from "react";
import { View, Text, StyleSheet, Modal, TouchableOpacity, Image, Linking, Dimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { COLORS } from "../constants/colors";
import { API_URL } from "../../config";
import { safeApiCall } from "../utils/apiUtils";
import { preloadSingleImage } from "../utils/imagePreloader";

const { width } = Dimensions.get("window");

type Advertising = {
  _id: string;
  title: string;
  description: string;
  image: string;
  link: string;
  isDeleted: boolean;
  status: string;
  order: number;
  dateAdded: string;
};

const STORAGE_KEY = 'shown_advertising_ids'; // Key for AsyncStorage

const AdvertisingBanner = () => {
  const [advertising, setAdvertising] = useState<Advertising | null>(null);
  const [visible, setVisible] = useState(false);
  const [imageReady, setImageReady] = useState(false);
  const hasShownRef = useRef(false); // Track if banner has been shown in this session

  // Get shown advertising IDs from AsyncStorage
  const getShownIds = useCallback(async (): Promise<string[]> => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
      return [];
    } catch (error) {
      console.log("⚠️ Error reading shown advertising IDs:", error);
      return [];
    }
  }, []);

  // Save shown advertising ID to AsyncStorage
  const saveShownId = useCallback(async (id: string) => {
    try {
      const shownIds = await getShownIds();
      if (!shownIds.includes(id)) {
        shownIds.push(id);
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(shownIds));
      }
    } catch (error) {
      console.log("⚠️ Error saving shown advertising ID:", error);
    }
  }, [getShownIds]);

  const fetchAndPreloadAdvertising = useCallback(async () => {
    // Only fetch once per session
    if (hasShownRef.current) {
      console.log("📢 Advertising already shown in this session");
      return;
    }

    try {
      console.log("📢 Fetching advertising...");
      console.log("🔗 API URL:", API_URL);
      console.log("🔗 Full URL:", `${API_URL}/advertising/published`);
      
      // Get previously shown IDs
      const shownIds = await getShownIds();
      
      // Use safeApiCall for automatic retry and better error handling
      const result = await safeApiCall<any[]>(`${API_URL}/advertising/published`, {
        headers: { 
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
          'Accept': 'application/json'
        }
      }, 1); // 1 retry for advertising (optional feature)
      
      if (!result.success || !result.data) {
        console.log("📢 No advertising data or error:", result.error);
        return;
      }
      
      const data = result.data;
      
      if (!Array.isArray(data) || data.length === 0) {
        console.log("📢 No advertising data");
        return;
      }
      
      const filteredData = data.filter(
        (ad: Advertising) => ad.isDeleted === false && ad.status === "published"
      );
      
      if (filteredData.length === 0) {
        console.log("📢 No published advertising");
        return;
      }

      // Sort by order, then by dateAdded
      filteredData.sort((a: Advertising, b: Advertising) => {
        if (a.order !== b.order) return a.order - b.order;
        return new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime();
      });

      const mostRecent = filteredData[0];
      
      // Check if this advertising has already been shown (persistent check)
      if (shownIds.includes(mostRecent._id)) {
        console.log("📢 Advertising already shown previously:", mostRecent._id);
        hasShownRef.current = true; // Mark as shown to prevent re-fetching
        return;
      }
      
      // Build image URL
      const imageUrl = mostRecent.image?.startsWith('http') 
        ? mostRecent.image 
        : `${API_URL}/uploads/${mostRecent.image}`;
      
      console.log("📢 Preloading image:", imageUrl);
      
      // PRELOAD IMAGE FIRST - only show banner after image is ready (with timeout)
      preloadSingleImage(imageUrl)
        .then((ok) => {
          if (ok) {
            console.log("📢 Image preloaded - showing banner");
            setAdvertising(mostRecent);
            setImageReady(true);
            setVisible(true);
            hasShownRef.current = true; // Mark as shown
          }
        })
        .catch((err) => {
          console.log("⚠️ First image prefetch failed:", err);
          // Don't show banner if image can't load
        });
        
    } catch (error: any) {
      // Handle network errors gracefully
      console.error("❌ Error fetching advertising:", error?.message || error);
      console.error("❌ Error name:", error?.name);
      
      // Check if it's a network error
      if (error?.message?.includes('Network request failed') || 
          error?.message?.includes('Failed to fetch')) {
        console.error("❌❌❌ NETWORK ERROR - Backend not reachable ❌❌❌");
        console.error("⚠️ Cannot connect to:", API_URL);
      }
    }
  }, [getShownIds]);

  useEffect(() => {
    // Delay fetch to not block app startup - only fetch once when component mounts
    const timer = setTimeout(() => {
      fetchAndPreloadAdvertising();
    }, 2000); // Wait 2 seconds after app loads
    
    return () => clearTimeout(timer);
  }, [fetchAndPreloadAdvertising]);

  const handleClose = async () => {
    if (advertising) {
      // Save the advertising ID to AsyncStorage so it won't show again
      await saveShownId(advertising._id);
      console.log("📢 Advertising closed and saved:", advertising._id);
    }
    setVisible(false);
    setImageReady(false);
  };

  const handlePress = async () => {
    if (advertising?.link && advertising.link.trim() !== "") {
      try {
        let url = advertising.link.trim();
        if (!url.startsWith('http')) {
          url = `https://${url}`;
        }
        const canOpen = await Linking.canOpenURL(url);
        if (canOpen) {
          await Linking.openURL(url);
          // Save shown ID when user clicks the link too
          await handleClose();
        }
      } catch (error) {
        console.warn("Error opening link:", error);
      }
    }
  };

  // Only render when image is ready
  if (!advertising || !visible || !imageReady) {
    return null;
  }

  const imageUrl = advertising.image?.startsWith('http') 
    ? advertising.image 
    : `${API_URL}/uploads/${advertising.image}`;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={styles.bannerContainer}>
          <TouchableOpacity 
            style={styles.closeButton} 
            onPress={handleClose}
            activeOpacity={0.7}
          >
            <Ionicons name="close" size={24} color={COLORS.white} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.bannerContent}
            onPress={handlePress}
            activeOpacity={advertising.link ? 0.8 : 1}
            disabled={!advertising.link}
          >
            <Image 
              source={{ uri: imageUrl }} 
              style={styles.bannerImage}
              resizeMode="cover"
            />
            {advertising.title && (
              <View style={styles.bannerTextContainer}>
                <Text style={styles.bannerTitle} numberOfLines={2}>
                  {advertising.title}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  bannerContainer: {
    width: width - 40,
    maxWidth: 400,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    position: "relative",
  },
  closeButton: {
    position: "absolute",
    top: 10,
    right: 10,
    zIndex: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  bannerContent: {
    width: "100%",
  },
  bannerImage: {
    width: "100%",
    height: 280,
    backgroundColor: "#f0f0f0",
  },
  bannerTextContainer: {
    padding: 12,
    paddingTop: 8,
  },
  bannerTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.black,
    textAlign: "center",
  },
});

export default AdvertisingBanner;
