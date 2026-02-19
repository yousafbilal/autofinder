import React, { useState, useEffect } from "react"
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Dimensions,
  Modal,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { Ionicons } from "@expo/vector-icons"
import { useNavigation, useFocusEffect, useRoute } from "@react-navigation/native"
import { COLORS } from "../../constants/colors"
import PartCard from "../../Components/PartCard"
import { API_URL } from "../../../config"
import AutoPartSkeletonGrid from "../../Components/Commons/AutoPartSkeletonGrid"
import FilterModal from "../../Components/Models/FilterModal"
import AsyncStorage from "@react-native-async-storage/async-storage"
import AutoPartsFilterModal from "../../Components/Models/AutoPartsFilterModal"
import { isAdValidForPublicListing } from "../../utils/safeFiltering"

const { width } = Dimensions.get("window")

const AutoPartsListScreen = () => {
  const navigation = useNavigation()
  const route = useRoute()
  const [searchQuery, setSearchQuery] = useState("")
  const [activeFilter, setActiveFilter] = useState("All")
  const [sortBy, setSortBy] = useState("Newest to Oldest")
  const [parts, setParts] = useState<Part[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [showSortModal, setShowSortModal] = useState(false);
  const [loading, setLoading] = useState(true)
  const [userData, setUserData] = useState<any>(null);
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const storedUserData = await AsyncStorage.getItem('user');
        if (storedUserData) {
          const parsedData = JSON.parse(storedUserData);
          console.log("Fetched User ID:", parsedData.userId);
          setUserData(parsedData);
        } else {
          console.log("No user data found in AsyncStorage.");
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
      // Don't set loading to false here - let fetchParts handle it
    };
  
    fetchUserData();
  }, []);
  const [selectedFilters, setSelectedFilters] = useState({
    priceRange: [0, 999999999], // ✅ Increased max price to show all parts
    partCategories: [],
    brands: [],
    condition: [],
    cities: [],
    fuelTypes: [],
    engineCapacities: [],
    colors: [],
    registrationCities: [],
    bodyTypes: [],
    transmissions: [],
    assemblies: [],
    compatibility: [],
  })
  const sortOptions = [
    "Relevance",
    "Price: Low to High",
    "Price: High to Low",
    "Newest to Oldest",
    "Oldest to Newest",
    "Newest"
  ];
  useEffect(() => {
    fetchParts()
  }, [])

  // ✅ Auto-refresh when screen comes into focus (after posting ad or clicking See All)
  useFocusEffect(
    React.useCallback(() => {
      console.log("🔄 AutoParts screen focused - Refreshing data...");
      // Clear cache to ensure fresh data
      AsyncStorage.removeItem("cache_auto_store_ads").catch(err => console.error("Cache clear error:", err));
      // Force refresh by calling fetchParts
      fetchParts();
    }, [userData?.userId]) // Add userData dependency to ensure fresh fetch when user changes
  )

const fetchParts = async () => {
  try {
    setLoading(true); // Set loading at start
    // Add cache-busting timestamp to ensure fresh data
    const timestamp = new Date().getTime();
    const response = await fetch(`${API_URL}/autoparts/public?_t=${timestamp}`, {
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    });
    const data = await response.json();
    const list = Array.isArray(data) ? data : [];
    console.log(`📦 Raw data from API: ${list.length} total items`);

    // ✅ Filter out items with invalid/empty IDs first
    const validItems = list.filter((item: any) => {
      const rawId = item._id || item.id;
      if (!rawId) return false;
      if (typeof rawId === 'object' && Object.keys(rawId).length === 0) return false;
      return true;
    });
    console.log(`📦 Valid items (with IDs): ${validItems.length} out of ${list.length}`);

    // ✅ Filter using unified validation: active, not deleted, not rejected, not expired
    const activeData = validItems.filter((item: any) => {
          // For auto parts, use unified validation
          // If isActive is explicitly undefined/null (new ads), still allow them
          if (item.isActive === undefined || item.isActive === null) {
            // New ad without explicit isActive - check only deleted and rejected
            if (item.isDeleted) return false;
            const isRejected = item.adStatus === 'rejected' || 
                              item.isFeatured === 'Rejected' || 
                              item.paymentStatus === 'rejected';
            return !isRejected;
          }
          // For ads with explicit isActive, use full validation
          return isAdValidForPublicListing(item);
        });

    console.log(`✅ Valid auto parts after filtering: ${activeData.length} (from ${list.length} total)`);

    const formattedData = activeData.map((item) => {
      // Extract date fields for sorting
      const createdAt = item.createdAt || item.dateAdded || item._id;
      const dateTime = createdAt ? new Date(createdAt).getTime() : 0;
      
      return {
        id: item._id,
        title: item.title,
        location: item.location || "Unknown",
        price: item.price,
        category: item.partType,
        condition: item.condition || "New",
        compatibility: item.compatibility || [],
        images: [
          item.image1,
          item.image2,
          item.image3,
          item.image4,
          item.image5,
          item.image6,
          item.image7,
          item.image8,
        ].filter(Boolean).map(img => `${API_URL}/uploads/${img}`),
        image: `${API_URL}/uploads/${item.image1}`,
        isFavorite: item.favoritedBy?.includes(userData?.userId),
        favoritedBy: item.favoritedBy || [],
        isNew: true,
        rating: 4.5,
        reviews: 0,
        // ✅ Add date fields for sorting
        createdAt: createdAt,
        dateTime: dateTime,
      };
    });

    // ✅ Sort by newest first (by dateTime or _id)
    formattedData.sort((a, b) => {
      if (a.dateTime && b.dateTime && a.dateTime !== 0 && b.dateTime !== 0) {
        return b.dateTime - a.dateTime; // Newest first
      }
      // Fallback: sort by _id string (newer _ids are typically larger)
      return String(b.id).localeCompare(String(a.id));
    });

    console.log(`✅ Fetched ${formattedData.length} active auto parts (from ${data.length} total), sorted by newest first`);
    console.log(`📋 Parts data:`, formattedData.map(p => ({ title: p.title, category: p.category, price: p.price })));
    setParts(formattedData);
  } catch (error) {
    console.error("Error fetching auto parts:", error);
  } finally {
    setLoading(false); // Set loading to false only after data is fetched
  }
};


  const filters = ["All", "Engine", "Transmission", "Interior Exterior", "Body Parts", "Electric/ Electronic Parts", "Suspension", "Tires and Wheels", "Car Care"]

  const partsList = Array.isArray(parts) ? parts : [];
  const filteredParts = partsList.filter((part) => {
    // Search filter
    const matchesSearch = !searchQuery || part.title.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Category filter - "All" should show all categories
    const matchesCategory = activeFilter === "All" || part.category === activeFilter;
    
    // Price range filter
    const partPrice = typeof part.price === 'number' ? part.price : Number(String(part.price).replace(/[^0-9]/g, '')) || 0;
    const matchesPriceRange = partPrice >= selectedFilters.priceRange[0] && partPrice <= selectedFilters.priceRange[1];
    
    // City filter - only apply if cities are selected
    const matchesCity = selectedFilters.cities.length === 0 || selectedFilters.cities.includes(part.location) || selectedFilters.cities.includes("All Cities");
    
    // Other filters - only apply if they are set
    const matchesPartCategories = selectedFilters.partCategories.length === 0 || selectedFilters.partCategories.includes(part.category);
    const matchesCondition = selectedFilters.condition.length === 0 || selectedFilters.condition.includes(part.condition);
    
    const shouldInclude = matchesSearch && matchesCategory && matchesPriceRange && matchesCity && matchesPartCategories && matchesCondition;
    
    if (!shouldInclude) {
      console.log(`❌ Filtered out part: ${part.title}`, {
        matchesSearch,
        matchesCategory,
        matchesPriceRange: `${partPrice} in [${selectedFilters.priceRange[0]}, ${selectedFilters.priceRange[1]}]`,
        matchesCity,
        matchesPartCategories,
        matchesCondition,
        activeFilter,
        searchQuery,
        priceRange: selectedFilters.priceRange,
        cities: selectedFilters.cities,
      });
    }
    
    return shouldInclude;
  });
  
  console.log(`📊 Filtering: ${parts.length} total parts -> ${filteredParts.length} after filters`, {
    activeFilter,
    searchQuery,
    priceRange: selectedFilters.priceRange,
    cities: selectedFilters.cities.length,
  });


  const sortedParts = [...filteredParts].sort((a, b) => {
    // CRITICAL: For specific sorts, apply ONLY that sort logic, no boost/priority interference
    if (sortBy === "Price: Low to High") {
      const priceA = Number(String(a.price).replace(/[^0-9]/g, ""));
      const priceB = Number(String(b.price).replace(/[^0-9]/g, ""));
      return priceA - priceB;
    }
    
    if (sortBy === "Price: High to Low") {
      const priceA = Number(String(a.price).replace(/[^0-9]/g, ""));
      const priceB = Number(String(b.price).replace(/[^0-9]/g, ""));
      return priceB - priceA;
    }
    
    if (sortBy === "Newest to Oldest") {
      // Sort by dateAdded - newest first (most recent date first)
      // Get date from approvedAt first, then dateAdded, then createdAt
      const dateA = (a as any)?.approvedAt || (a as any)?.dateAdded || (a as any)?.createdAt || 0;
      const dateB = (b as any)?.approvedAt || (b as any)?.dateAdded || (b as any)?.createdAt || 0;
      
      // Parse dates safely
      let timeA = 0;
      let timeB = 0;
      
      if (dateA) {
        const parsedA = new Date(dateA);
        timeA = !isNaN(parsedA.getTime()) ? parsedA.getTime() : 0;
      }
      
      if (dateB) {
        const parsedB = new Date(dateB);
        timeB = !isNaN(parsedB.getTime()) ? parsedB.getTime() : 0;
      }
      
      // Newest first (higher timestamp first)
      return timeB - timeA;
    }
    
    if (sortBy === "Oldest to Newest") {
      // Sort by dateAdded - oldest first (oldest date first)
      // Get date from approvedAt first, then dateAdded, then createdAt
      const dateA = (a as any)?.approvedAt || (a as any)?.dateAdded || (a as any)?.createdAt || 0;
      const dateB = (b as any)?.approvedAt || (b as any)?.dateAdded || (b as any)?.createdAt || 0;
      
      // Parse dates safely
      let timeA = 0;
      let timeB = 0;
      
      if (dateA) {
        const parsedA = new Date(dateA);
        timeA = !isNaN(parsedA.getTime()) ? parsedA.getTime() : 0;
      }
      
      if (dateB) {
        const parsedB = new Date(dateB);
        timeB = !isNaN(parsedB.getTime()) ? parsedB.getTime() : 0;
      }
      
      // Oldest first (lower timestamp first)
      return timeA - timeB;
    }
    
    if (sortBy === "Newest") {
      // Sort by year (fallback for parts without date)
      return (b as any).year - (a as any).year;
    }
    
    // For Relevance sort, maintain priority order with boost
    if (sortBy === "Relevance") {
      // Helper function to check if boost is still active (typically 7 days)
      const isBoostActive = (item: any): boolean => {
        if (!item.boostedAt) return false;
        
        const boostDate = new Date(item.boostedAt);
        if (isNaN(boostDate.getTime())) return false;
        
        // Boost typically lasts 7 days
        const boostExpiryDate = new Date(boostDate);
        boostExpiryDate.setDate(boostExpiryDate.getDate() + 7);
        
        const now = new Date();
        return now < boostExpiryDate; // Boost is active if current date is before expiry
      };
      
      const aBoostActive = isBoostActive(a);
      const bBoostActive = isBoostActive(b);
      
      // If one has active boost and other doesn't, prioritize the one with active boost
      if (aBoostActive && !bBoostActive) return -1;
      if (!aBoostActive && bBoostActive) return 1;
      
      // If both have active boost or both don't, sort by boost date (most recent first)
      if (aBoostActive && bBoostActive) {
        const boostA = (a as any).boostedAt ? new Date((a as any).boostedAt).getTime() : 0;
        const boostB = (b as any).boostedAt ? new Date((b as any).boostedAt).getTime() : 0;
        if (boostA !== boostB) {
          return boostB - boostA;
        }
      }
      
      // Then by date
      const dateA = (a as any)?.approvedAt || (a as any)?.dateAdded || (a as any)?.createdAt || 0;
      const dateB = (b as any)?.approvedAt || (b as any)?.dateAdded || (b as any)?.createdAt || 0;
      const timeA = dateA ? new Date(dateA).getTime() : 0;
      const timeB = dateB ? new Date(dateB).getTime() : 0;
      return timeB - timeA;
    }
    
    return 0;
  })

  const renderFilterItem = (filter) => (
    <TouchableOpacity
      key={filter}
      style={[styles.filterButton, activeFilter === filter && styles.activeFilterButton]}
      onPress={() => setActiveFilter(filter)}
    >
      <Text style={[styles.filterButtonText, activeFilter === filter && styles.activeFilterButtonText]}>{filter}</Text>
    </TouchableOpacity>
  )

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={25} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchBar}
          placeholder="Search Auto Parts..."
          placeholderTextColor="#888"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <View style={styles.filtersContainer}>
         
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtersScrollView}>
  <>
    <TouchableOpacity style={styles.filterItem} onPress={() => setModalVisible(true)}>
      <Ionicons name="filter" size={20} color="#CD0100" />
      <Text style={styles.filterText}> Filters</Text>
    </TouchableOpacity>
    {filters.map(renderFilterItem)}
  </>
</ScrollView>

      </View>
           <View style={styles.separatorLine} />
      <View style={styles.sortContainer}>
              <Text style={styles.resultsText}>{sortedParts.length} results</Text>
              <TouchableOpacity style={styles.sortButton} onPress={() => setShowSortModal(true)}>
        <Text style={styles.sortButtonText}>Sort: {sortBy}</Text>
        <Ionicons name="chevron-down" size={16} color={COLORS.primary} />
      </TouchableOpacity>
      
            </View>

      {loading ? (
        <AutoPartSkeletonGrid />
      ) : (
        <FlatList
          data={sortedParts}
          renderItem={({ item }) => {
            // Safely convert item._id to string before navigation
            let safeId: string;
            try {
              const rawId = item._id || item.id;
              if (!rawId) {
                // No ID at all - skip this item
                return null;
              }
              
              if (typeof rawId === 'string') {
                safeId = rawId;
              } else if (typeof rawId === 'number') {
                safeId = String(rawId);
              } else if (typeof rawId === 'object' && rawId) {
                // Check if object is empty
                const keys = Object.keys(rawId);
                if (keys.length === 0) {
                  // Empty object - skip this item
                  return null;
                }
                
                // Try MongoDB ObjectId toString() first (returns actual ID string)
                if (rawId.toString && typeof rawId.toString === 'function') {
                  const str = rawId.toString(); // Call toString() directly
                  // Check if toString() returned a valid ID (not [object Object])
                  if (str && str !== '[object Object]' && str.length > 10) {
                    safeId = str;
                  } else {
                    // Try nested _id or $oid
                    if (rawId._id) {
                      safeId = typeof rawId._id === 'string' ? rawId._id : String(rawId._id);
                    } else if (rawId.$oid) {
                      safeId = String(rawId.$oid);
                    } else if (rawId.id) {
                      safeId = typeof rawId.id === 'string' ? rawId.id : String(rawId.id);
                    } else {
                      // Empty or invalid object - skip this item
                      return null;
                    }
                  }
                } else {
                  // No toString method, try nested properties
                  if (rawId._id) {
                    safeId = typeof rawId._id === 'string' ? rawId._id : String(rawId._id);
                  } else if (rawId.$oid) {
                    safeId = String(rawId.$oid);
                  } else if (rawId.id) {
                    safeId = typeof rawId.id === 'string' ? rawId.id : String(rawId.id);
                  } else {
                    // Empty or invalid object - skip this item
                    return null;
                  }
                }
              } else {
                safeId = String(rawId);
              }
              
              // Validate ID
              if (!safeId || safeId === 'undefined' || safeId === 'null' || safeId === '[object Object]' || safeId.trim() === '') {
                // Invalid ID - skip this item
                return null;
              }
            } catch (e) {
              // Error converting - skip this item
              return null;
            }

            return (
              <View style={{ width: "48%", marginBottom: 16 }}>
                <TouchableOpacity onPress={() => navigation.navigate("AutoPartsDetailsScreen", { 
                  part: { ...item, _id: safeId, id: safeId } 
                })}>
                  <PartCard part={item} userId={userData?.userId} />
                </TouchableOpacity>
              </View>
            );
          }}
          keyExtractor={(item, index) => {
            try {
              // Safely convert id to string
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
              // Fallback
              if (item._id) {
                if (typeof item._id === 'string') return item._id;
                if (typeof item._id === 'object' && item._id.toString) {
                  const str = String(item._id.toString());
                  if (str !== '[object Object]') return str;
                }
              }
              return `part-${index}`;
            } catch (error) {
              return `part-${index}-${Date.now()}`;
            }
          }}
          contentContainerStyle={styles.partsList}
          showsVerticalScrollIndicator={false}
          numColumns={2}
          columnWrapperStyle={styles.partsRow}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="construct-outline" size={60} color={COLORS.lightGray} />
              <Text style={styles.emptyText}>No parts found</Text>
              <Text style={styles.emptySubtext}>Try adjusting your search or filters</Text>
            </View>
          }
        />
      )}
       <AutoPartsFilterModal
  visible={modalVisible}
  onClose={() => setModalVisible(false)}
  onApplyFilters={(filters) => {
    // ✅ Merge new filters with existing filters to preserve price range and other filters
    setSelectedFilters(prev => ({
      ...prev,
      ...filters,
      // Preserve price range if not provided in new filters
      priceRange: filters.priceRange || prev.priceRange,
    }));
    console.log("✅ Filters applied:", filters);
  }}
/>
  <Modal visible={showSortModal} transparent animationType="fade">
  <View style={styles.modalOverlay}>
    <View style={styles.sortModalContent}>
      <View style={styles.modalHeader}>
        <Text style={styles.modalTitle}>Sort By</Text>
        <TouchableOpacity onPress={() => setShowSortModal(false)}>
          <Ionicons name="close" size={24} color={COLORS.black} />
        </TouchableOpacity>
      </View>

      {sortOptions.map((option) => (
        <TouchableOpacity
          key={option}
          style={[
            styles.modalOption,
            sortBy === option && styles.selectedModalOption
          ]}
          onPress={() => {
            setSortBy(option);
            setShowSortModal(false);
          }}
        >
          <Text style={styles.modalOptionText}>{option}</Text>
          {sortBy === option && (
            <Ionicons name="checkmark" size={20} color={COLORS.primary} />
          )}
        </TouchableOpacity>
      ))}
    </View>
  </View>
</Modal>
    </SafeAreaView>
  )
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f8f8",
    padding: 10,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 8,
    paddingHorizontal: 20,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  filterItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 15,
    paddingHorizontal: 10,
  },
  filterText: {
    fontSize: 14,
    color: "#333",
  },
  searchIcon: {
    marginRight: 8,
  },
  searchBar: {
    flex: 1,
    height: 50,
    color: "#333",
  },
  filtersContainer: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
    backgroundColor: COLORS.lightGray,
  },
  filtersScrollView: {
    paddingHorizontal: 16,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    marginRight: 8,
  },
  activeFilterButton: {
    backgroundColor: COLORS.primary,
  },
  filterButtonText: {
    fontSize: 14,
    color: COLORS.darkGray,
  },
  activeFilterButtonText: {
    color: COLORS.white,
    fontWeight: "500",
  },
  sortContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.lightGray,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  resultsText: {
    fontSize: 14,
    color: COLORS.darkGray,
  },
  sortButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  sortButtonText: {
    fontSize: 14,
    color: COLORS.primary,
    marginRight: 4,
  },
  partsList: {
    padding: 8,
    paddingBottom: 80,
  },
  partsRow: {
    justifyContent: "space-between",
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
  modalOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  sortModalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
    maxHeight: "50%",
  },
  filterModalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
    height: "90%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.black,
  },
  modalOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  selectedModalOption: {
    backgroundColor: COLORS.lightGray,
  },
  modalOptionText: {
    fontSize: 16,
    color: COLORS.black,
  },
  filterScrollView: {
    flex: 1,
  },
  filterSection: {
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
    paddingBottom: 20,
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.black,
    marginBottom: 12,
  },
  rangeValues: {
    fontSize: 14,
    color: COLORS.darkGray,
    marginBottom: 8,
  },
  optionsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  optionButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.lightGray,
    marginRight: 8,
    marginBottom: 8,
  },
  selectedOptionButton: {
    backgroundColor: COLORS.primary,
  },
  optionButtonText: {
    fontSize: 14,
    color: COLORS.darkGray,
  },
  selectedOptionButtonText: {
    color: COLORS.white,
  },
  modalFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray,
  },
  resetButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: 8,
    marginRight: 8,
  },
  resetButtonText: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: "600",
  },
  applyButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    marginLeft: 8,
  },
  applyButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "600",
  },
  separatorLine: {
  borderBottomWidth: 1,
  borderBottomColor: '#eee',
},

})

export default AutoPartsListScreen
