import React, { useEffect, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context"
import { Ionicons } from "@expo/vector-icons"
import { COLORS } from "../../constants/colors"
import { useNavigation } from "@react-navigation/native"
import { API_URL } from "../../../config"
import { NavigationProp } from "@react-navigation/native";
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Image, Linking, ActivityIndicator, RefreshControl } from "react-native"
import { RootStackParamList } from "../../../navigationTypes";

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

const AdvertisingScreen = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const [advertising, setAdvertising] = useState<Advertising[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch (error) {
      return "";
    }
  };

  const formatTime = (dateString: string) => {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      return date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (error) {
      return "";
    }
  };

  const fetchAdvertising = async () => {
    try {
      const res = await fetch(`${API_URL}/advertising/published`);

      if (!res.ok) {
        // Log the error response safely without breaking JSON parsing
        const text = await res.text();
        console.error("Error fetching advertising. Status:", res.status, "Body:", text.slice(0, 200));
        return;
      }

      const data = await res.json();
      const filteredData = data.filter(
        (ad: Advertising) => ad.isDeleted === false && ad.status === "published"
      );
      // Sort by order, then by dateAdded
      filteredData.sort((a: Advertising, b: Advertising) => {
        if (a.order !== b.order) {
          return a.order - b.order;
        }
        return new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime();
      });
      setAdvertising(filteredData);
    } catch (error) {
      console.error("Error fetching advertising:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAdvertising();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchAdvertising();
  };

  const isValidUrl = (urlString: string): boolean => {
    try {
      // Remove whitespace
      const cleanUrl = urlString.trim().replace(/\s/g, '');
      
      // Basic validation - must have at least a domain
      if (cleanUrl.length < 4) return false;
      
      // Check for valid domain pattern (at least one dot and valid TLD)
      const domainPattern = /^https?:\/\/([a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}(\/.*)?$/;
      const simpleDomainPattern = /^([a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}(\/.*)?$/;
      
      // If already has protocol, validate full URL
      if (cleanUrl.startsWith('http://') || cleanUrl.startsWith('https://')) {
        return domainPattern.test(cleanUrl);
      }
      
      // If no protocol, check if it's a valid domain
      return simpleDomainPattern.test(cleanUrl);
    } catch {
      return false;
    }
  };

  const handlePress = async (item: Advertising) => {
    if (item.link && item.link.trim() !== "") {
      try {
        // Validate and format URL
        let url = item.link.trim();
        
        // Remove any whitespace
        url = url.replace(/\s/g, '');
        
        // Validate URL format before attempting to open
        if (!isValidUrl(url)) {
          // Invalid URL - don't try to open it
          console.warn("Invalid URL format, skipping:", url);
          return;
        }
        
        // Add protocol if missing
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
          url = `https://${url}`;
        }
        
        // Double check after adding protocol
        if (!isValidUrl(url)) {
          console.warn("Invalid URL after formatting, skipping:", url);
          return;
        }
        
        // Validate URL can be opened
        const canOpen = await Linking.canOpenURL(url);
        if (canOpen) {
          await Linking.openURL(url);
        } else {
          console.warn("Cannot open URL:", url);
        }
      } catch (error) {
        // Silently handle errors - don't show error to user for invalid URLs
        console.warn("Error opening link:", error);
      }
    }
  };

  const renderAdvertisingItem = ({ item }: { item: Advertising }) => (
    <TouchableOpacity
      style={styles.adCard}
      onPress={() => handlePress(item)}
      activeOpacity={item.link && item.link.trim() !== "" ? 0.7 : 1}
    >
      <Image 
        source={{ uri: `${API_URL}/uploads/${item.image}` }} 
        style={styles.adImage}
        resizeMode="cover"
      />
      <View style={styles.adContent}>
        <Text style={styles.adTitle}>{item.title}</Text>
        {item.description && (
          <Text style={styles.adDescription} numberOfLines={3}>
            {item.description}
          </Text>
        )}
        <View style={styles.metaContainer}>
          {item.dateAdded && (
            <View style={styles.dateTimeContainer}>
              <Ionicons name="calendar-outline" size={14} color={COLORS.darkGray} />
              <Text style={styles.dateText}>{formatDate(item.dateAdded)}</Text>
              {formatTime(item.dateAdded) && (
                <>
                  <Text style={styles.separator}>•</Text>
                  <Text style={styles.timeText}>{formatTime(item.dateAdded)}</Text>
                </>
              )}
            </View>
          )}
        </View>
        {item.link && item.link.trim() !== "" && (
          <View style={styles.linkContainer}>
            <Text style={styles.linkText}>Tap to visit</Text>
            <Ionicons name="arrow-forward-circle" size={20} color={COLORS.primary} />
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={COLORS.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Advertising</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Advertising</Text>
        <View style={styles.placeholder} />
      </View>

      {advertising.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="megaphone-outline" size={64} color={COLORS.lightGray} />
          <Text style={styles.emptyText}>No advertising available</Text>
          <Text style={styles.emptySubtext}>Check back later for new promotions</Text>
        </View>
      ) : (
        <FlatList
          data={advertising}
          renderItem={renderAdvertisingItem}
          keyExtractor={(item) => item._id.toString()}
          contentContainerStyle={styles.advertisingList}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[COLORS.primary]}
              tintColor={COLORS.primary}
            />
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    paddingHorizontal: 16,
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
  placeholder: {
    width: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.black,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.darkGray,
    textAlign: "center",
  },
  advertisingList: {
    padding: 16,
  },
  adCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 16,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  adImage: {
    width: "100%",
    height: 200,
    backgroundColor: COLORS.lightGray,
  },
  adContent: {
    padding: 16,
  },
  adTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.black,
    marginBottom: 8,
  },
  adDescription: {
    fontSize: 14,
    color: COLORS.darkGray,
    lineHeight: 20,
    marginBottom: 12,
  },
  metaContainer: {
    marginTop: 8,
    marginBottom: 8,
  },
  dateTimeContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  dateText: {
    fontSize: 12,
    color: COLORS.darkGray,
  },
  separator: {
    fontSize: 12,
    color: COLORS.darkGray,
    marginHorizontal: 4,
  },
  timeText: {
    fontSize: 12,
    color: COLORS.darkGray,
  },
  linkContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    marginTop: 8,
  },
  linkText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: "500",
    marginRight: 8,
  },
});

export default AdvertisingScreen;

