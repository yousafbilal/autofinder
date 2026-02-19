import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Image, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../constants/colors";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../navigationTypes";
import { API_URL } from "../../config";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { safeGetFirstImageSource } from "../utils/safeImageUtils";

// Type definitions
interface ExpiredAd {
  _id: string;
  adType: string;
  collection: string;
  title?: string;
  make: string;
  model: string;
  year: number;
  price: number;
  location: string;
  dateAdded: string;
  isActive: boolean;
  adStatus?: string;
  isFeatured?: string;
  paymentStatus?: string;
  status?: string;
  [key: string]: any;
}

interface UserData {
  userId: string;
  [key: string]: any;
}

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const ExpiredAdsScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [expiredAds, setExpiredAds] = useState<ExpiredAd[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch user data from AsyncStorage
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const storedUserData = await AsyncStorage.getItem('user');
        if (storedUserData) {
          const parsedData = JSON.parse(storedUserData);
          console.log("Fetched User Data:", parsedData);
          setUserData(parsedData);
        } else {
          console.log("No user data found in AsyncStorage.");
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };

    fetchUserData();
  }, []);

  // Fetch expired ads
  useEffect(() => {
    if (userData?.userId) {
      fetchExpiredAds();
    }
  }, [userData]);

  // Add a retry mechanism
  const retryFetchExpiredAds = () => {
    console.log("Retrying to fetch expired ads...");
    fetchExpiredAds();
  };

  const fetchExpiredAds = async () => {
    try {
      setLoading(true);
      console.log("Fetching expired ads for user:", userData?.userId);
      console.log("API URL:", `${API_URL}/user-expired-ads/${userData?.userId}`);
      
      const response = await fetch(`${API_URL}/user-expired-ads/${userData?.userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      console.log("Response status:", response.status);
      console.log("Response headers:", response.headers);
      
      // Check if response is ok before trying to parse JSON
      if (!response.ok) {
        const errorText = await response.text();
        console.error("API Error Response:", errorText);
        Alert.alert("Error", `Server error: ${response.status} - ${errorText}`);
        return;
      }
      
      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const responseText = await response.text();
        console.error("Non-JSON response:", responseText);
        Alert.alert("Error", "Server returned non-JSON response. Please check if the server is running.");
        return;
      }
      
      const result = await response.json();
      
      if (response.ok) {
        console.log("Expired ads fetched successfully:", result);
        setExpiredAds(result.ads || []);
      } else {
        console.error("Error fetching expired ads:", result.message);
        Alert.alert("Error", result.message || "Failed to fetch expired ads");
      }
    } catch (error) {
      console.error("Error fetching expired ads:", error);
      if (error.message.includes('JSON Parse error')) {
        Alert.alert("Error", "Server returned invalid response. Please check if the backend server is running on " + API_URL);
      } else {
        Alert.alert("Error", "An error occurred while fetching expired ads: " + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  // Function to get ad status text
  const getAdStatusText = (ad: ExpiredAd): string => {
    if (ad.adStatus === 'rejected' || ad.isFeatured === 'Rejected' || ad.paymentStatus === 'rejected') {
      return 'Rejected by Admin';
    }
    if (ad.adStatus === 'pending' || ad.isFeatured === 'Pending' || ad.paymentStatus === 'pending') {
      return 'Pending Approval';
    }
    if (!ad.isActive) {
      return 'Expired';
    }
    return 'Active';
  };

  // Function to get ad status color
  const getAdStatusColor = (ad: ExpiredAd): string => {
    if (ad.adStatus === 'rejected' || ad.isFeatured === 'Rejected' || ad.paymentStatus === 'rejected') {
      return COLORS.error;
    }
    if (ad.adStatus === 'pending' || ad.isFeatured === 'Pending' || ad.paymentStatus === 'pending') {
      return COLORS.warning;
    }
    if (!ad.isActive) {
      return COLORS.gray;
    }
    return COLORS.success;
  };

  // Function to get reactivation cost
  const getReactivationCost = (ad: ExpiredAd): number => {
    switch (ad.adType || 'car') {
      case 'featured':
        return 525; // Featured ad cost
      case 'bike':
        return 525; // Bike ad cost
      case 'listItForYou':
        return 525; // List it for you cost
      case 'newCar':
        return 525; // New car cost
      case 'newBike':
        return 525; // New bike cost
      default:
        return 525;
    }
  };

  const handleReactivateAd = (ad: ExpiredAd) => {
    const cost = getReactivationCost(ad);
    
    Alert.alert(
      "Reactivate Ad",
      `Reactivate this ${ad.adType || 'car'} ad for PKR ${cost}? The ad will be submitted for admin approval.`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Reactivate",
          onPress: () => {
            // Navigate to payment screen for reactivation
            navigation.navigate("Payment", {
              adId: ad._id,
              adType: ad.adType || 'car',
              cost: cost,
              isReactivation: true,
              adData: {
                title: ad.title || `${ad.year} ${ad.make} ${ad.model}`,
                make: ad.make,
                model: ad.model,
                year: ad.year,
                price: ad.price,
                location: ad.location
              }
            });
          },
        },
      ],
      { cancelable: true }
    );
  };

  const handleViewAd = (ad: ExpiredAd) => {
    // Navigate to ad detail screen
    navigation.navigate("CarDetail", { carId: ad._id });
  };

  const renderExpiredAdItem = ({ item }: { item: ExpiredAd }) => (
    <View style={[styles.adCard, { borderLeftColor: getAdStatusColor(item) }]}>
      <TouchableOpacity onPress={() => handleViewAd(item)}>
        <Image
          source={safeGetFirstImageSource(item, API_URL)}
          style={styles.adImage}
        />
      </TouchableOpacity>

      <View style={styles.adContent}>
        <View style={styles.adHeader}>
          <TouchableOpacity onPress={() => handleViewAd(item)}>
            <Text style={styles.adTitle}>
              {item.title || `${item.year} ${item.make} ${item.model}`}
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.adPrice}>PKR. {item.price ? item.price.toLocaleString() : '0'}</Text>
        
        {/* Status Badge */}
        <View style={[styles.statusBadge, { backgroundColor: getAdStatusColor(item) + '20' }]}>
          <Ionicons 
            name={getAdStatusText(item).includes('Rejected') ? 'close-circle-outline' : 
                  getAdStatusText(item).includes('Pending') ? 'time-outline' : 
                  'alert-circle-outline'} 
            size={16} 
            color={getAdStatusColor(item)} 
          />
          <Text style={[styles.statusText, { color: getAdStatusColor(item) }]}>
            {getAdStatusText(item)}
          </Text>
        </View>

        <View style={styles.adDetails}>
          <View style={styles.adDetailItem}>
            <Ionicons name="calendar-outline" size={16} color={COLORS.darkGray} />
            <Text style={styles.adDetailText}>{item.year}</Text>
          </View>

          <View style={styles.adDetailItem}>
            <Ionicons name="location-outline" size={16} color={COLORS.darkGray} />
            <Text style={styles.adDetailText}>{item.location}</Text>
          </View>

          <View style={styles.adDetailItem}>
            <Ionicons name="time-outline" size={16} color={COLORS.darkGray} />
            <Text style={styles.adDetailText}>
              {new Date(item.dateAdded).toLocaleDateString()}
            </Text>
          </View>
        </View>

        <View style={styles.adFooter}>
          <Text style={styles.adDate}>
            Expired on {new Date(item.dateAdded).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </Text>
        </View>

        <View style={styles.adActions}>
          <TouchableOpacity 
            style={styles.reactivateButton} 
            onPress={() => handleReactivateAd(item)}
          >
            <Ionicons name="refresh-outline" size={16} color={COLORS.white} />
            <Text style={styles.reactivateButtonText}>
              Reactivate (PKR {getReactivationCost(item)})
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading expired ads...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.dark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Expired Ads</Text>
        <View style={{ width: 24 }} />
      </View>

      {expiredAds.length === 0 && !loading ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="time-outline" size={64} color={COLORS.gray} />
          <Text style={styles.emptyTitle}>No Expired Ads</Text>
          <Text style={styles.emptySubtitle}>
            You don't have any expired ads. Create new ads to get started!
          </Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={retryFetchExpiredAds}
          >
            <Ionicons name="refresh-outline" size={20} color={COLORS.white} />
            <Text style={styles.retryButtonText}>Refresh</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={expiredAds}
          renderItem={renderExpiredAdItem}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.adsList}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.lightGray,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.dark,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: COLORS.gray,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.dark,
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: COLORS.gray,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 20,
  },
  retryButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  adsList: {
    padding: 20,
  },
  adCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    marginBottom: 16,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  adImage: {
    width: '100%',
    height: 200,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  adContent: {
    padding: 16,
  },
  adHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  adTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.dark,
    flex: 1,
  },
  adPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
  },
  adDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  adDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  adDetailText: {
    fontSize: 12,
    color: COLORS.darkGray,
    marginLeft: 4,
  },
  adFooter: {
    marginBottom: 12,
  },
  adDate: {
    fontSize: 12,
    color: COLORS.gray,
    fontStyle: 'italic',
  },
  adActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  reactivateButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  reactivateButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
});

export default ExpiredAdsScreen;
