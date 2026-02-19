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
} from "react-native";
import { FontAwesome, Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import CarCard from "../../Components/CarCard";
import FilterModal from "../../Components/Models/FilterModal";
import PriceFilterModal from "../../Components/Models/PriceFilterModal";
import YearFilterModal from "../../Components/Models/YearFilterModal";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import KilometerRangeModal from "../../Components/Models/KilometerRangeModal";
import { API_URL } from "../../../config";
import { COLORS } from "../../constants/colors";
import CarCardSkeleton from "../../Components/Commons/CarCardSkeleton";
import RentalCarCard from "../../Components/RentalCarCard";
import AsyncStorage from "@react-native-async-storage/async-storage";
import RentalFilterModal from "../../Components/Models/RentalFilterModal";
import { isAdValidForPublicListing } from "../../utils/safeFiltering";
import { safeApiCall } from "../../utils/apiUtils";

type CarListScreenProps = NativeStackScreenProps<any, "RentalCarListScreen">;

const RentalCarListScreen: React.FC<CarListScreenProps> = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [cars, setCars] = useState<any[]>([]);
  const [showSortModal, setShowSortModal] = useState(false);
  const [sortBy, setSortBy] = useState("Relevance");
  const [modalVisible, setModalVisible] = useState(false);
  const [priceModalVisible, setPriceModalVisible] = useState(false);
  const [yearModalVisible, setYearModalVisible] = useState(false);
  const [kilometerModalVisible, setKilometerModalVisible] = useState(false);
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
          } finally {
            setLoading(false);
          }
        };
      
        fetchUserData();
      }, []);
  const getInitialFilters = () => ({
    cities: [] as string[],
    fuelTypes: [] as string[],
    engineCapacities: [] as string[],
    colors: [] as string[],
    brands: [] as string[],
    models: [] as string[],
    variants: [] as string[],
    registrationCities: [] as string[],
    bodyTypes: [] as string[],
    transmissions: [] as string[],
    assemblies: [] as string[],
    drivingtype: [] as string[],
    paymenttype: [] as string[],
  });

  const [selectedFilters, setSelectedFilters] = useState(getInitialFilters());  
  const sortOptions = [
    "Relevance",
    "Price: Low to High",
    "Price: High to Low",
    "Newest to Oldest",
    "Oldest to Newest"
  ];

  
  
  const engineOptions = [
    { label: "0 - 499 cc", min: 0, max: 499 },
    { label: "500 - 999 cc", min: 500, max: 999 },
    { label: "1000 - 1499 cc", min: 1000, max: 1499 },
    { label: "1500 - 1999 cc", min: 1500, max: 1999 },
    { label: "2000 - 2499 cc", min: 2000, max: 2499 },
    { label: "2500 - 2999 cc", min: 2500, max: 2999 },
    { label: "3000 - 3499 cc", min: 3000, max: 3499 },
    { label: "3500 - 3999 cc", min: 3500, max: 3999 },
    { label: "4000+ cc", min: 4000, max: Infinity },
  ];  
  const [minPrice, setMinPrice] = useState<number>(0);
  const [maxPrice, setMaxPrice] = useState<number>(100000000);  
  const [minYear, setMinYear] = useState<number>(1970);
  const [maxYear, setMaxYear] = useState<number>(new Date().getFullYear());
  const [minMileage, setMinMileage] = useState<number>(0); // Add minMileage
  const [maxMileage, setMaxMileage] = useState<number>(200000);
  const carsList = Array.isArray(cars) ? cars : [];
  const filteredCars = carsList.filter((car) => {
    const carName = `${car.make} ${car.model} ${car.variant} ${car.year}`.toLowerCase();
    const matchesSearch = carName.includes(searchQuery.toLowerCase());
    const carPrice = car && car.price ? Number(String(car.price).replace(/[^0-9]/g, "")) : 0;
    const matchesPrice = carPrice >= minPrice && carPrice <= maxPrice;
    const carYear = Number(car.year);
    const matchesBodyType =
    selectedFilters.bodyTypes.length === 0 ||
    selectedFilters.bodyTypes.map(t => t.toLowerCase()).includes(car.bodyType?.toLowerCase()) ||
    selectedFilters.bodyTypes.map(t => t.toLowerCase()).includes("all body types");

    const matchesYear = carYear >= minYear && carYear <= maxYear;
    const carMileage = Number(car.kmDriven);
    const matchesMileage = carMileage >= minMileage && carMileage <= maxMileage;
    const matchesCity = selectedFilters.cities.length === 0 || selectedFilters.cities.includes(car.location) || selectedFilters.cities.includes("All Cities");
    const matchesRegistrationCity = selectedFilters.registrationCities.length === 0 || selectedFilters.registrationCities.includes(car.registrationCity) || selectedFilters.registrationCities.includes("All Cities");
    const matchesBrand =
      selectedFilters.brands.length === 0 ||
      selectedFilters.brands.map(b => b.toLowerCase()).includes(car.make?.toLowerCase()) ||
      selectedFilters.brands.map(b => b.toLowerCase()).includes("all brands");

    const matchesModel =
      !selectedFilters.models || selectedFilters.models.length === 0 ||
      selectedFilters.models
        .map(m => m.toLowerCase())
        .includes((car.model || "").toLowerCase());

    const matchesVariant =
      !selectedFilters.variants || selectedFilters.variants.length === 0 ||
      selectedFilters.variants
        .map(v => v.toLowerCase())
        .includes((car.variant || "").toLowerCase());
    const matchesTransmission =
    selectedFilters.transmissions.length === 0 ||
    selectedFilters.transmissions.map(t => t.toLowerCase()).includes(car.transmission?.toLowerCase()) ||
    selectedFilters.transmissions.includes("All");
    const matchesAssembly =
    selectedFilters.assemblies.length === 0 ||
    selectedFilters.assemblies.map(a => a.toLowerCase()).includes(car.assembly?.toLowerCase()) ||
    selectedFilters.assemblies.includes("All");
    
    const matchesFuel = selectedFilters.fuelTypes.length === 0 || selectedFilters.fuelTypes.includes(car.fuelType);
    const matchesEngine =
    selectedFilters.engineCapacities.length === 0 ||
    selectedFilters.engineCapacities.some((rangeLabel) => {
      const range = engineOptions.find((option) => option.label === rangeLabel);
      if (!range) return false;
      const engineValue = parseInt(car.engineCapacity);
      return engineValue >= range.min && engineValue <= range.max;
    });
    const matchesDriveMode = selectedFilters.drivingtype.length === 0 || selectedFilters.drivingtype.includes(car.drivingtype);
    const matchesPaymentMode = selectedFilters.paymenttype.length === 0 || selectedFilters.paymenttype.includes(car.paymenttype);

    const matchesColor = selectedFilters.colors.length === 0 || selectedFilters.colors.includes(car.bodyColor);
  
    return (
      matchesSearch &&
      matchesPrice &&
      matchesYear &&
      matchesBodyType &&
      matchesMileage &&
      matchesPaymentMode &&
      matchesBrand &&
      matchesModel &&
      matchesVariant &&
      matchesCity &&
      matchesRegistrationCity &&
      matchesFuel &&
      matchesEngine &&
      matchesColor &&
      matchesTransmission &&
      matchesAssembly &&
      matchesDriveMode
    );
  });
  const sortedCars = [...filteredCars].sort((a, b) => {
    const priceA = Number(String(a.price).replace(/[^0-9]/g, ""));
    const priceB = Number(String(b.price).replace(/[^0-9]/g, ""));
  
    // CRITICAL: For specific sorts, apply ONLY that sort logic, no boost/priority interference
    if (sortBy === "Price: Low to High") {
      // If both have 0 price, maintain order
      if (priceA === 0 && priceB === 0) return 0;
      if (priceA === 0) return 1; // Put items without price at the end
      if (priceB === 0) return -1; // Put items without price at the end
      return priceA - priceB; // Low to High
    }
    
    if (sortBy === "Price: High to Low") {
      // If both have 0 price, maintain order
      if (priceA === 0 && priceB === 0) return 0;
      if (priceA === 0) return 1; // Put items without price at the end
      if (priceB === 0) return -1; // Put items without price at the end
      return priceB - priceA; // High to Low
    }
    
    if (sortBy === "Newest to Oldest") {
      // Sort by dateAdded - newest first
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
      
      // If both have 0 timestamp, maintain order
      if (timeA === 0 && timeB === 0) return 0;
      if (timeA === 0) return 1; // Put items without date at the end
      if (timeB === 0) return -1; // Put items without date at the end
      
      return timeB - timeA; // Newest first (higher timestamp first)
    }
    
    if (sortBy === "Oldest to Newest") {
      // Sort by dateAdded - oldest first
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
      
      // If both have 0 timestamp, maintain order
      if (timeA === 0 && timeB === 0) return 0;
      if (timeA === 0) return 1; // Put items without date at the end
      if (timeB === 0) return -1; // Put items without date at the end
      
      return timeA - timeB; // Oldest first (lower timestamp first)
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
      const dateA = a?.approvedAt || a?.dateAdded || a?.createdAt || a?.updatedAt || 0;
      const dateB = b?.approvedAt || b?.dateAdded || b?.createdAt || b?.updatedAt || 0;
      const timeA = dateA ? new Date(dateA).getTime() : 0;
      const timeB = dateB ? new Date(dateB).getTime() : 0;
      return timeB - timeA;
    }
    
    return 0;
  });

  // Define fetchCars function before using it (safeApiCall = timeout + retry so fetch works on slow network)
  const fetchCars = async () => {
    try {
      setLoading(true);
      const timestamp = new Date().getTime();
      const result = await safeApiCall<any[]>(`${API_URL}/rent_car/public?_t=${timestamp}`, {
        headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' }
      }, 2);
      const list = result.success && Array.isArray(result.data) ? result.data : [];

      const activeCars = list.filter((car: any) => isAdValidForPublicListing(car));
      console.log(`✅ Valid rental cars after filtering: ${activeCars.length}`);

      setCars(activeCars);
    } catch (error) {
      console.error("Error fetching rent car data:", error);
      setCars([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCars();
  }, []);

  // ✅ Auto-refresh when screen comes into focus (after admin approval)
  useFocusEffect(
    React.useCallback(() => {
      console.log("🔄 RentalCarListScreen focused - Refreshing data...");
      fetchCars(); // Force refresh on focus
    }, [])
  );
  
  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={25} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchBar}
          placeholder="e.g.  Honda Civic Luxury ..."
          placeholderTextColor="#888"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Filter Options */}
      <View style={styles.filtersWrapper}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
        {/* Filters Icon */}
        <TouchableOpacity style={styles.filterItem} onPress={() => setModalVisible(true)}>
        <Ionicons name="filter" size={20} color="#CD0100" />
          <Text style={styles.filterText}> Filters</Text>
        </TouchableOpacity>

        {["Price", "Year", "Kilometer", "Inspected Cars"].map((filter, index) => (
  <TouchableOpacity 
    key={index} 
    style={styles.filterBox} 
    onPress={() => {
      if (filter === "Price") setPriceModalVisible(true);
      if (filter === "Year") setYearModalVisible(true);
      if (filter === "Kilometer") setKilometerModalVisible(true);
      if (filter === "Inspected Cars") navigation.navigate("PostAutoPartsAd");
    }}
  >
    <Text style={styles.filterText}>
      {filter} <FontAwesome name="angle-down" size={18} color="black" />
    </Text>
  </TouchableOpacity>
))}


        {/* All Filters & Reset in the same row */}
        <TouchableOpacity style={styles.allFiltersContainer} onPress={() => setModalVisible(true)}>
        <Text style={styles.allFiltersText}>
            <Text style={styles.boldText}>All Filters</Text> | <Text style={styles.boldText}>Reset</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
     
      <RentalFilterModal
  visible={modalVisible}
  onClose={() => setModalVisible(false)}
  onApplyFilters={(filters) => setSelectedFilters(filters)}
/>

    </View>
      <View style={styles.separatorLine} />
    <View style={styles.sortContainer}>
        <Text style={styles.resultsText}>{sortedCars.length} results</Text>
        <TouchableOpacity style={styles.sortButton} onPress={() => setShowSortModal(true)}>
  <Text style={styles.sortButtonText}>Sort: {sortBy}</Text>
  <Ionicons name="chevron-down" size={16} color={COLORS.primary} />
</TouchableOpacity>

      </View>
      {loading ? (
        <CarCardSkeleton count={3} />
      ) : sortedCars.length === 0 ? (
        <View style={styles.emptyStateContainer}>
          <View style={styles.emptyStateContent}>
            <View style={styles.emptyStateIcon}>
              <Ionicons name="car-outline" size={80} color="#ddd" />
            </View>
            <Text style={styles.emptyStateTitle}>Oops! No cars found</Text>
            <Text style={styles.emptyStateMessage}>
              We couldn't find any cars matching your criteria. Try adjusting your filters or search terms.
            </Text>
            <TouchableOpacity 
              style={styles.clearFiltersButton}
              onPress={() => {
                setSelectedFilters(getInitialFilters());
                setSearchQuery("");
                setMinPrice(0);
                setMaxPrice(100000000);
                setMinYear(1970);
                setMaxYear(new Date().getFullYear());
                setMinMileage(0);
                setMaxMileage(200000);
                setSortBy("Relevance");
              }}
            >
              <Text style={styles.clearFiltersText}>Clear Filters</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <FlatList
          data={sortedCars}
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
              return `${item.make || 'car'}-${item.model || 'model'}-${item.year || 'year'}-${index}`;
            } catch (error) {
              return `car-${index}-${Date.now()}`;
            }
          }}
          renderItem={({ item }) => (
            <RentalCarCard
              car={item}
              userId={userData?.userId}
              onPress={() => 
                navigation.navigate("RentalCarDetailsScreen", { carDetails: item })  // Pass entire item here
              } 
            />
          )}
          keyboardShouldPersistTaps="handled"
        />
      )}
      <PriceFilterModal
  isVisible={priceModalVisible}
  onClose={() => setPriceModalVisible(false)}
  minPrice={minPrice}
  maxPrice={maxPrice}
  setMinPrice={setMinPrice}
  setMaxPrice={setMaxPrice}
/>
<YearFilterModal 
  isVisible={yearModalVisible} 
  onClose={() => setYearModalVisible(false)} 
  minYear={minYear}
  maxYear={maxYear}
  setMinYear={setMinYear}
  setMaxYear={setMaxYear}
/>
<KilometerRangeModal isVisible={kilometerModalVisible} onClose={() => setKilometerModalVisible(false)} 
  minMileage={minMileage}
  maxMileage={maxMileage}
  setMinMileage={setMinMileage}
  setMaxMileage={setMaxMileage}
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

    </View>

    
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f8f8",
    padding: 10,
    marginTop: 40,
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
  searchIcon: {
    marginRight: 8,
  },
  searchBar: {
    flex: 1,
    height: 50,
    color: "#333",
  },
  
  filtersWrapper: {
    flexDirection: "row",
    alignItems: "center",
    height: 50,
    marginBottom: 10,
  },
  filterScroll: {
    alignItems: "center",
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
  filterBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
    height: 40,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 15,
    backgroundColor: "#fff",
    marginRight: 10,
  },
  allFiltersContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 10,
  },
  allFiltersText: {
    fontSize: 14,
    color: "#333",
  },
  boldText: {
    fontWeight: "bold",
  },
  sortContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.background,
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

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end', // 👈 Push content to the bottom
    alignItems: 'center',
  },
  sortModalContent: {
    backgroundColor: 'white',
    padding: 20,
    borderTopLeftRadius: 20,   // 👈 Rounded corners at top only
    borderTopRightRadius: 20,
    width: '100%',
    height: '30%',             // 👈 Adjust the height as needed
  },  
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderColor: '#ccc',
  },
  selectedModalOption: {
    backgroundColor: '#f2f2f2',
  },
  modalOptionText: {
    fontSize: 16,
  },
  separatorLine: {
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  emptyStateContent: {
    alignItems: 'center',
    maxWidth: 300,
  },
  emptyStateIcon: {
    marginBottom: 20,
    opacity: 0.6,
  },
  emptyStateTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyStateMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 30,
  },
  clearFiltersButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  clearFiltersText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default RentalCarListScreen;