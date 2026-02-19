
import React, { useEffect, useState, useCallback } from "react"
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { Ionicons } from "@expo/vector-icons"
import { COLORS } from "../constants/colors"
import { useNavigation, useFocusEffect } from "@react-navigation/native"
import CarCard from "../Components/Commons/CarCard"
import { API_URL, getUserId } from '../../config';
import CarCardSkeleton from "../Components/Commons/CarCardSkeleton"

const toUserIdString = (v: any): string | null => {
  if (v == null) return null;
  if (typeof v === 'string') return v.trim() || null;
  if (typeof v === 'object') {
    const id = v._id ?? v.userId ?? v.id;
    return id != null ? String(id) : null;
  }
  return null;
}

const MyFavoritesScreen = () => {
  const navigation = useNavigation()
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("Cars")
  const [favoriteAds, setFavoriteAds] = useState([]);
  const [favoriteProducts, setFavoriteProducts] = useState([]);
const [loadingId, setLoadingId] = useState<string | null>(null);

const removeFromFavorites = async (productId: string) => {
  const uid = toUserIdString(userData) ?? userData;
  if (!uid) return;
  setLoadingId(productId);
  try {
    const response = await fetch(`${API_URL}/toggle_favorite`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ adId: productId, userId: uid }),
    });

    const contentType = response.headers.get("content-type");
    let data: { message?: string } = {};
    if (contentType && contentType.includes("application/json")) {
      data = await response.json();
    } else {
      const text = await response.text();
      console.warn("❌ toggle_favorite non-JSON:", text?.substring(0, 100));
    }

    if (response.ok) {
      const updatedFavorites = (favoriteProducts || []).filter((item: any) => item._id !== productId);
      setFavoriteProducts(updatedFavorites);
    } else {
      console.warn("Failed to remove favorite:", data?.message);
    }
  } catch (error) {
    console.error("Error removing favorite:", error);
  } finally {
    setLoadingId(null);
  }
};

  const parseJsonResponse = async (response: Response): Promise<any[]> => {
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      const text = await response.text();
      if (process.env.NODE_ENV !== "production") {
        console.warn("❌ favorite_ads: Non-JSON response:", text?.substring(0, 150));
      }
      return [];
    }
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  };

  useEffect(() => {
  const fetchUser = async () => {
    const id = await getUserId();
    console.log("Fetched User ID:", id);
    setUserData(id);
    setLoading(false);
  };

  fetchUser();
}, []);

  const fetchFavorites = useCallback(async () => {
    try {
      setLoading(true);
      const userId = await getUserId();
      setUserData(userId);

      if (!userId) {
        setFavoriteAds([]);
        setFavoriteProducts([]);
        return;
      }

      const carRes = await fetch(`${API_URL}/favorite_ads/${encodeURIComponent(userId)}`);
      const productRes = await fetch(`${API_URL}/favorite_ads/autoparts/${encodeURIComponent(userId)}`);

      const favoriteCarsData = await parseJsonResponse(carRes);
      const favoriteProductsData = await parseJsonResponse(productRes);

      setFavoriteAds(favoriteCarsData);
      setFavoriteProducts(favoriteProductsData);
    } catch (error) {
      console.error("Error fetching favorite ads:", error);
      setFavoriteAds([]);
      setFavoriteProducts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  useFocusEffect(
    useCallback(() => {
      fetchFavorites();
    }, [fetchFavorites])
  );

const renderContent = () => {
  // Debug logging
  console.log('MyFavoritesScreen renderContent - favoriteAds:', favoriteAds);
  console.log('MyFavoritesScreen renderContent - typeof favoriteAds:', typeof favoriteAds);
  console.log('MyFavoritesScreen renderContent - Array.isArray(favoriteAds):', Array.isArray(favoriteAds));
  
  // Combine all car data and filter for favorites
  const favoriteCars = Array.isArray(favoriteAds) ? favoriteAds : [];
  const uniqueFavoriteCars = Array.isArray(favoriteCars) ? favoriteCars.filter(
    (car, index, self) => index === self.findIndex(c => c._id === car._id)
  ) : [];
  
  if (loading) return <CarCardSkeleton />; // ⬅️ Only show skeleton

  switch (activeTab) {
    case "Cars":
      return (
        <FlatList
          data={uniqueFavoriteCars}
          renderItem={({ item }) => (
            <CarCard
              car={item}
              userId={toUserIdString(userData) ?? userData}
              onPress={() =>
                navigation.navigate("CarDetails", { carDetails: item })
              }
            />
          )}
          keyExtractor={(item, index) => {
            try {
              const id = item._id;
              if (id != null) {
                const s = typeof id === 'string' ? id : (id.toString && id.toString());
                if (s && String(s) !== '[object Object]') return `fav-car-${String(s)}-${index}`;
              }
              return `fav-car-${index}`;
            } catch (_) {
              return `fav-car-${index}`;
            }
          }}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons
                name="heart-dislike-outline"
                size={60}
                color={COLORS.lightGray}
              />
              <Text style={styles.emptyText}>No favorite cars yet</Text>
              <Text style={styles.emptySubtext}>
                Cars you like will appear here
              </Text>
            </View>
          }
        />
      );
    case "Products":
      return (
        <FlatList
          data={favoriteProducts}
          renderItem={({ item }) => (
            <View style={styles.productCard}>
              <Image
                source={{ uri: `${API_URL}/uploads/${item.image1}` }}
                style={styles.productImage}
              />
              <View style={styles.productContent}>
                <Text style={styles.productTitle}>{item.title}</Text>
                <View style={styles.priceContainer}>
                  <Text style={styles.productPrice}>
                    PKR {item.price.toLocaleString()}
                  </Text>
                  {item.originalPrice > 0 && (
                    <Text style={styles.originalPrice}>
                      PKR {item.originalPrice.toLocaleString()}
                    </Text>
                  )}
                </View>
                <View style={styles.ratingContainer}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Ionicons
                      key={star}
                      name={star <= item.rating ? "star" : "star-outline"}
                      size={16}
                      color="#FFD700"
                      style={{ marginRight: 2 }}
                    />
                  ))}
                  <Text style={styles.reviewCount}>({item.reviews})</Text>
                </View>
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => removeFromFavorites(item._id)}
                  disabled={loadingId === item._id}
                >
                  <Ionicons
                    name="heart-dislike-outline"
                    size={16}
                    color={COLORS.white}
                  />
                  <Text style={styles.removeButtonText}>
                    {loadingId === item._id ? "Removing..." : "Remove"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
          keyExtractor={(item, index) => {
            try {
              const id = item._id;
              if (id != null) {
                const s = typeof id === 'string' ? id : (id.toString && id.toString());
                if (s && String(s) !== '[object Object]') return `fav-prod-${String(s)}-${index}`;
              }
              return `fav-prod-${index}`;
            } catch (_) {
              return `fav-prod-${index}`;
            }
          }}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons
                name="heart-dislike-outline"
                size={60}
                color={COLORS.lightGray}
              />
              <Text style={styles.emptyText}>No favorite products yet</Text>
              <Text style={styles.emptySubtext}>
                Products you like will appear here
              </Text>
            </View>
          }
        />
      );

    default:
      return null;
  }
};


  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.black} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Favorites</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "Cars" && styles.activeTab]}
          onPress={() => setActiveTab("Cars")}
        >
          <Text style={[styles.tabText, activeTab === "Cars" && styles.activeTabText]}>Cars</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "Products" && styles.activeTab]}
          onPress={() => setActiveTab("Products")}
        >
          <Text style={[styles.tabText, activeTab === "Products" && styles.activeTabText]}>Products</Text>
        </TouchableOpacity>
      </View>

      {renderContent()}
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
    backgroundColor: COLORS.white,
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
    color: COLORS.black,
  },
  tabsContainer: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: "center",
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: COLORS.primary,
  },
  tabText: {
    fontSize: 16,
    color: COLORS.darkGray,
  },
  activeTabText: {
    color: COLORS.primary,
    fontWeight: "600",
  },
  listContent: {
    padding: 16,
    paddingBottom: 80,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
    marginTop: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.darkGray,
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.darkGray,
    marginTop: 8,
  },
  productCard: {
    flexDirection: "row",
    backgroundColor: COLORS.white,
    borderRadius: 8,
    marginBottom: 16,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    overflow: "hidden",
  },
  productImage: {
    width: 120,
    height: 120,
    resizeMode: "cover",
  },
  productContent: {
    flex: 1,
    padding: 12,
    justifyContent: "space-between",
  },
  productTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.black,
    marginBottom: 8,
  },
  priceContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  productPrice: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.primary,
    marginRight: 8,
  },
  originalPrice: {
    fontSize: 14,
    color: COLORS.darkGray,
    textDecorationLine: "line-through",
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  reviewCount: {
    fontSize: 12,
    color: COLORS.darkGray,
    marginLeft: 4,
  },
  removeButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.primary,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 4,
    alignSelf: "flex-start",
  },
  removeButtonText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 4,
  },
})

export default MyFavoritesScreen
