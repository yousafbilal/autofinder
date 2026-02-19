import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  RefreshControl,
} from "react-native";
import { FontAwesome, Ionicons, MaterialIcons } from "@expo/vector-icons";
import RentalVehicleCard from "../../Components/RentalVehicleCard";
import RentalVehicleFilterModal from "../../Components/Models/RentalVehicleFilterModal";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { API_URL } from "../../../config";
import { COLORS } from "../../constants/colors";
import RentalVehicleCardSkeleton from "../../Components/Commons/RentalVehicleCardSkeleton";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { filterRentalVehiclesSafely } from "../../utils/safeRentalFiltering";

type RentalVehicleListScreenProps = NativeStackScreenProps<any, "RentalVehicleListScreen">;

interface FilterState {
  brands: string[];
  models: string[];
  years: { min: number; max: number };
  registrationCities: string[];
  locations: string[];
  bodyColors: string[];
  budgetRange: { min: number; max: number };
  tenure: { min: number; max: number };
  tenureUnit: string;
  driveMode: string[];
  paymentType: string[];
  fuelTypes: string[];
  engineCapacity: { min: number; max: number };
  transmissions: string[];
  assemblies: string[];
  bodyTypes: string[];
}

const RentalVehicleListScreen: React.FC<RentalVehicleListScreenProps> = ({ navigation, route }) => {
  const [loading, setLoading] = useState(true);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [filteredVehicles, setFilteredVehicles] = useState<any[]>([]);
  const [showSortModal, setShowSortModal] = useState(false);
  const [sortBy, setSortBy] = useState("Relevance");
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [userData, setUserData] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState(route?.params?.searchQuery || "");

  // Filter state
  const [filters, setFilters] = useState<FilterState>({
    brands: [],
    models: [],
    years: { min: 1970, max: new Date().getFullYear() },
    registrationCities: [],
    locations: [],
    bodyColors: [],
    budgetRange: { min: 0, max: 100000 },
    tenure: { min: 1, max: 30 },
    tenureUnit: "Days",
    driveMode: [],
    paymentType: [],
    fuelTypes: [],
    engineCapacity: { min: 0, max: 6000 },
    transmissions: [],
    assemblies: [],
    bodyTypes: [],
  });

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const storedUserData = await AsyncStorage.getItem('user');
        if (storedUserData) {
          const parsedData = JSON.parse(storedUserData);
          setUserData(parsedData);
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  useEffect(() => {
    fetchVehicles();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [vehicles, filters, searchQuery, sortBy]); // Added sortBy to dependencies

  const fetchVehicles = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/rental_vehicle_ads`);
      const data = await response.json();
      setVehicles(data);
    } catch (error) {
      console.error("Error fetching rental vehicles:", error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchVehicles();
    setRefreshing(false);
  };

  const applyFilters = () => {
    // Use safe filtering to prevent undefined errors
    const filtered = filterRentalVehiclesSafely(vehicles, filters, searchQuery);

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

    // Apply sorting
    if (sortBy === "Relevance") {
      // For Relevance sort, maintain priority order with boost
      filtered.sort((a, b) => {
        const prioA = a._priority || 999;
        const prioB = b._priority || 999;
        if (prioA !== prioB) return prioA - prioB;
        
        // Prioritize boosted ads - ONLY if boost is still active
        const aBoostActive = isBoostActive(a);
        const bBoostActive = isBoostActive(b);
        
        // If one has active boost and other doesn't, prioritize the one with active boost
        if (aBoostActive && !bBoostActive) return -1;
        if (!aBoostActive && bBoostActive) return 1;
        
        // If both have active boost or both don't, sort by boost date (most recent first)
        if (aBoostActive && bBoostActive) {
          const boostA = a.boostedAt ? new Date(a.boostedAt).getTime() : 0;
          const boostB = b.boostedAt ? new Date(b.boostedAt).getTime() : 0;
          if (boostA !== boostB) {
            return boostB - boostA;
          }
        }
        
        // Then by date
        const dateA = a?.approvedAt || a?.dateAdded || a?.createdAt || 0;
        const dateB = b?.approvedAt || b?.dateAdded || b?.createdAt || 0;
        const timeA = dateA ? new Date(dateA).getTime() : 0;
        const timeB = dateB ? new Date(dateB).getTime() : 0;
        return timeB - timeA;
      });
    } else if (sortBy === "Price: Low to High") {
      filtered.sort((a, b) => {
        const priceA = a.price && typeof a.price === 'string' ? 
          Number(String(a.price).replace(/[^0-9]/g, "")) : 
          (typeof a.price === 'number' ? a.price : 0);
        const priceB = b.price && typeof b.price === 'string' ? 
          Number(String(b.price).replace(/[^0-9]/g, "")) : 
          (typeof b.price === 'number' ? b.price : 0);
        
        // If both have 0 price, maintain order
        if (priceA === 0 && priceB === 0) return 0;
        if (priceA === 0) return 1; // Put items without price at the end
        if (priceB === 0) return -1; // Put items without price at the end
        
        return priceA - priceB; // Low to High
      });
    } else if (sortBy === "Price: High to Low") {
      filtered.sort((a, b) => {
        const priceA = a.price && typeof a.price === 'string' ? 
          Number(String(a.price).replace(/[^0-9]/g, "")) : 
          (typeof a.price === 'number' ? a.price : 0);
        const priceB = b.price && typeof b.price === 'string' ? 
          Number(String(b.price).replace(/[^0-9]/g, "")) : 
          (typeof b.price === 'number' ? b.price : 0);
        
        // If both have 0 price, maintain order
        if (priceA === 0 && priceB === 0) return 0;
        if (priceA === 0) return 1; // Put items without price at the end
        if (priceB === 0) return -1; // Put items without price at the end
        
        return priceB - priceA; // High to Low
      });
    } else if (sortBy === "Newest to Oldest") {
      // Sort by dateAdded - newest first (most recent date first)
      filtered.sort((a, b) => {
        // Get date from approvedAt first, then dateAdded, then createdAt, then updatedAt
        const dateA = a?.approvedAt || a?.dateAdded || a?.createdAt || a?.updatedAt || 0;
        const dateB = b?.approvedAt || b?.dateAdded || b?.createdAt || b?.updatedAt || 0;
        
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
        // If both have 0 timestamp, maintain order
        if (timeA === 0 && timeB === 0) return 0;
        if (timeA === 0) return 1; // Put items without date at the end
        if (timeB === 0) return -1; // Put items without date at the end
        
        return timeB - timeA;
      });
      
      // Debug: Log first 5 after sorting
      console.log(`📅 After "Newest to Oldest" sort (Rental), first 5 dates:`, filtered.slice(0, 5).map((v, i) => {
        const date = v?.approvedAt || v?.dateAdded || v?.createdAt || v?.updatedAt;
        return `${i+1}. ${v.make || v.brand} ${v.model} - ${date ? new Date(date).toLocaleDateString() : 'No date'} (${date ? new Date(date).getTime() : 0})`;
      }));
    } else if (sortBy === "Oldest to Newest") {
      // Sort by dateAdded - oldest first (oldest date first)
      filtered.sort((a, b) => {
        // Get date from approvedAt first, then dateAdded, then createdAt, then updatedAt
        const dateA = a?.approvedAt || a?.dateAdded || a?.createdAt || a?.updatedAt || 0;
        const dateB = b?.approvedAt || b?.dateAdded || b?.createdAt || b?.updatedAt || 0;
        
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
        // If both have 0 timestamp, maintain order
        if (timeA === 0 && timeB === 0) return 0;
        if (timeA === 0) return 1; // Put items without date at the end
        if (timeB === 0) return -1; // Put items without date at the end
        
        return timeA - timeB;
      });
      
      // Debug: Log first 5 after sorting
      console.log(`📅 After "Oldest to Newest" sort (Rental), first 5 dates:`, filtered.slice(0, 5).map((v, i) => {
        const date = v?.approvedAt || v?.dateAdded || v?.createdAt || v?.updatedAt;
        return `${i+1}. ${v.make || v.brand} ${v.model} - ${date ? new Date(date).toLocaleDateString() : 'No date'} (${date ? new Date(date).getTime() : 0})`;
      }));
    }

    setFilteredVehicles(filtered);
  };

  const handleApplyFilters = (newFilters: FilterState) => {
    setFilters(newFilters);
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.brands.length > 0 && !filters.brands.includes("All Brands")) count++;
    if (filters.models.length > 0 && !filters.models.includes("All Models")) count++;
    if (filters.registrationCities.length > 0 && !filters.registrationCities.includes("All Cities")) count++;
    if (filters.locations.length > 0 && !filters.locations.includes("All Cities")) count++;
    if (filters.bodyColors.length > 0 && !filters.bodyColors.includes("All Colors")) count++;
    if (filters.driveMode.length > 0 && !filters.driveMode.includes("All Drive Modes")) count++;
    if (filters.paymentType.length > 0 && !filters.paymentType.includes("All Payment Types")) count++;
    if (filters.fuelTypes.length > 0 && !filters.fuelTypes.includes("All Fuel Types")) count++;
    if (filters.transmissions.length > 0 && !filters.transmissions.includes("All Transmissions")) count++;
    if (filters.assemblies.length > 0 && !filters.assemblies.includes("All Assemblies")) count++;
    if (filters.bodyTypes.length > 0 && !filters.bodyTypes.includes("All Body Types")) count++;
    if (filters.years.min !== 1970 || filters.years.max !== new Date().getFullYear()) count++;
    if (filters.budgetRange.min !== 0 || filters.budgetRange.max !== 100000) count++;
    if (filters.tenure.min !== 1 || filters.tenure.max !== 30) count++;
    if (filters.engineCapacity.min !== 0 || filters.engineCapacity.max !== 6000) count++;
    return count;
  };

  const renderVehicleCard = ({ item }: { item: any }) => (
    <RentalVehicleCard
      vehicle={item}
      onPress={() => navigation.navigate("RentalVehicleDetails", { vehicle: item })}
      userData={userData}
    />
  );

  const renderHeader = () => (
    <View style={styles.header}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search rental vehicles by title..."
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Filter and Sort Bar */}
      <View style={styles.filterBar}>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setFilterModalVisible(true)}
        >
          <Ionicons name="options-outline" size={20} color="#CD0100" />
          <Text style={styles.filterButtonText}>Filters</Text>
          {getActiveFiltersCount() > 0 && (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>{getActiveFiltersCount()}</Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.sortButton}
          onPress={() => setShowSortModal(true)}
        >
          <Ionicons name="swap-vertical-outline" size={20} color="#CD0100" />
          <Text style={styles.sortButtonText}>Sort: {sortBy}</Text>
        </TouchableOpacity>
      </View>

      {/* Results Count */}
      <View style={styles.resultsContainer}>
        <Text style={styles.resultsText}>
          {filteredVehicles.length} rental vehicles found
        </Text>
      </View>
    </View>
  );

  const renderSortModal = () => (
    <Modal
      visible={showSortModal}
      transparent
      animationType="fade"
      onRequestClose={() => setShowSortModal(false)}
    >
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={() => setShowSortModal(false)}
      >
        <View style={styles.sortModal}>
          <Text style={styles.sortModalTitle}>Sort By</Text>
          {[
            "Relevance",
            "Price: Low to High",
            "Price: High to Low",
            "Newest to Oldest",
            "Oldest to Newest",
          ].map((option) => (
            <TouchableOpacity
              key={option}
              style={[
                styles.sortOption,
                sortBy === option && styles.selectedSortOption,
              ]}
              onPress={() => {
                setSortBy(option);
                setShowSortModal(false);
              }}
            >
              <Text
                style={[
                  styles.sortOptionText,
                  sortBy === option && styles.selectedSortOptionText,
                ]}
              >
                {option}
              </Text>
              {sortBy === option && (
                <Ionicons name="checkmark" size={20} color="#CD0100" />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </TouchableOpacity>
    </Modal>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        {renderHeader()}
        <FlatList
          data={[1, 2, 3, 4, 5, 6]}
          renderItem={() => <RentalVehicleCardSkeleton />}
          keyExtractor={(item) => item.toString()}
          showsVerticalScrollIndicator={false}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {renderHeader()}
      
      <FlatList
        data={filteredVehicles}
        renderItem={renderVehicleCard}
        keyExtractor={(item) => item._id}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="car-outline" size={80} color="#ccc" />
            <Text style={styles.emptyText}>No rental vehicles found</Text>
            <Text style={styles.emptySubtext}>
              Try adjusting your filters or search terms
            </Text>
          </View>
        }
      />

      {renderSortModal()}

      <RentalVehicleFilterModal
        visible={filterModalVisible}
        onClose={() => setFilterModalVisible(false)}
        onApplyFilters={handleApplyFilters}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  header: {
    backgroundColor: "#fff",
    paddingHorizontal: 15,
    paddingTop: 10,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  searchContainer: {
    marginBottom: 15,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    borderRadius: 10,
    paddingHorizontal: 15,
    height: 45,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#333",
  },
  filterBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  filterButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#CD0100",
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 8,
    position: "relative",
  },
  filterButtonText: {
    color: "#CD0100",
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 5,
  },
  filterBadge: {
    position: "absolute",
    top: -8,
    right: -8,
    backgroundColor: "#CD0100",
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  filterBadgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
  sortButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 8,
  },
  sortButtonText: {
    color: "#333",
    fontSize: 14,
    fontWeight: "500",
    marginLeft: 5,
  },
  resultsContainer: {
    marginTop: 5,
  },
  resultsText: {
    fontSize: 14,
    color: "#666",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 50,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#666",
    marginTop: 15,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#999",
    marginTop: 5,
    textAlign: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  sortModal: {
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 20,
    width: "80%",
    maxWidth: 300,
  },
  sortModalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 20,
    textAlign: "center",
  },
  sortOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  selectedSortOption: {
    backgroundColor: "#fff5f5",
  },
  sortOptionText: {
    fontSize: 16,
    color: "#333",
  },
  selectedSortOptionText: {
    color: "#CD0100",
    fontWeight: "600",
  },
});

export default RentalVehicleListScreen;
