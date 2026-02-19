import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { FontAwesome, Ionicons, MaterialIcons } from "@expo/vector-icons";
import CarCard from "../../Components/CarCard";
import FilterModal from "../../Components/Models/FilterModal";
import PriceFilterModal from "../../Components/Models/PriceFilterModal";
import YearFilterModal from "../../Components/Models/YearFilterModal";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import KilometerRangeModal from "../../Components/Models/KilometerRangeModal";
import { API_URL } from "../../../config";
import FullScreenLoader from "../../Components/FullScreenLoader";
import AsyncStorage from "@react-native-async-storage/async-storage";
import CarCardSkeleton from "../../Components/Commons/CarCardSkeleton";
import { safeApiCall } from "../../utils/apiUtils";

type CarListScreenProps = NativeStackScreenProps<any, "FeaturedCarListScreen">;
type SelectedFilters = {
  cities: string[];
  fuelTypes: string[];
  engineCapacities: string[];
  colors: string[];
};

const FeaturedCarListScreen: React.FC<CarListScreenProps> = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [cars, setCars] = useState<any[]>([]);
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
  const [selectedFilters, setSelectedFilters] = useState<SelectedFilters>({
    cities: [],
    fuelTypes: [],
    engineCapacities: [],
    colors: [],
  });  
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
    const matchesYear = carYear >= minYear && carYear <= maxYear;
    const carMileage = Number(car.kmDriven);
    const matchesMileage = carMileage >= minMileage && carMileage <= maxMileage;
    const matchesCity = selectedFilters.cities.length === 0 || selectedFilters.cities.includes(car.registrationCity) || selectedFilters.cities.includes("All Cities");
    const matchesFuel = selectedFilters.fuelTypes.length === 0 || selectedFilters.fuelTypes.includes(car.fuelType);
    const matchesEngine =
    selectedFilters.engineCapacities.length === 0 ||
    selectedFilters.engineCapacities.some((rangeLabel) => {
      const range = engineOptions.find((option) => option.label === rangeLabel);
      if (!range) return false;
      const engineValue = parseInt(car.engineCapacity);
      return engineValue >= range.min && engineValue <= range.max;
    });
    const matchesColor = selectedFilters.colors.length === 0 || selectedFilters.colors.includes(car.bodyColor);
  
    return (
      matchesSearch &&
      matchesPrice &&
      matchesYear &&
      matchesMileage &&
      matchesCity &&
      matchesFuel &&
      matchesEngine &&
      matchesColor
    );
  });
  useEffect(() => {
    const fetchCars = async () => {
      try {
        setLoading(true); // Show loader
        
        // Use safeApiCall for automatic retry and better error handling
        const result = await safeApiCall<any[]>(`${API_URL}/featured_ads/public`, {
          headers: { 'Accept': 'application/json' }
        }, 2); // 2 retries
        
        if (!result.success || !result.data) {
          console.error("❌ Failed to fetch featured cars:", result.error);
          setCars([]);
          return;
        }
        
        const data = result.data;
        
        // Filter only approved, active, non-expired premium cars
        const now = new Date();
        const list = Array.isArray(data) ? data : [];
        const filtered = list.filter((ad: any) => {
          // FIXED: Admin approval is the primary criteria - show all approved ads
          // Must be approved by admin
          if (ad.isFeatured !== "Approved" && ad.isFeatured !== true) return false;
          
          // Check expiry date - must not be expired
          const expiryDate = ad.featuredExpiryDate;
          if (expiryDate) {
            const expiry = new Date(expiryDate);
            if (expiry < now) return false; // Expired
          }
          
          // Check validityDays + approvedAt expiry
          if (ad.validityDays && ad.approvedAt) {
            try {
              const approvedDate = new Date(ad.approvedAt);
              if (!isNaN(approvedDate.getTime())) {
                const expiryDate = new Date(approvedDate);
                expiryDate.setDate(expiryDate.getDate() + ad.validityDays);
                if (expiryDate < now) {
                  return false; // Package expired
                }
              }
            } catch (e) {
              // If date parsing fails, keep the ad
            }
          }
          
          return true;
        });
        
        // Helper function to check if boost is still active (typically 7 days)
        const isBoostActive = (item: any): boolean => {
          if (!item.boostedAt) return false;
          
          const boostDate = new Date(item.boostedAt);
          if (isNaN(boostDate.getTime())) return false;
          
          // Boost typically lasts 7 days
          const boostExpiryDate = new Date(boostDate);
          boostExpiryDate.setDate(boostExpiryDate.getDate() + 7);
          
          return now < boostExpiryDate; // Boost is active if current date is before expiry
        };

        // Sort by priorityScore/boostedAt so boosted featured ads are on top - ONLY if boost is still active
        const sorted = filtered.sort((a: any, b: any) => {
          const aBoostActive = isBoostActive(a);
          const bBoostActive = isBoostActive(b);
          
          // If one has active boost and other doesn't, prioritize the one with active boost
          if (aBoostActive && !bBoostActive) return -1;
          if (!aBoostActive && bBoostActive) return 1;
          
          // If both have active boost or both don't, sort by boost date (most recent first)
          if (aBoostActive && bBoostActive) {
            const aBoost = a.boostedAt ? new Date(a.boostedAt).getTime() : 0;
            const bBoost = b.boostedAt ? new Date(b.boostedAt).getTime() : 0;
            if (aBoost !== bBoost) return bBoost - aBoost;
          }
          
          const aDate = a.dateAdded ? new Date(a.dateAdded).getTime() : 0;
          const bDate = b.dateAdded ? new Date(b.dateAdded).getTime() : 0;
          return bDate - aDate;
        });
        setCars(sorted);
      } catch (error) {
        console.error("Error fetching car data:", error);
      } finally {
        setLoading(false); // Hide loader after data is fetched or error occurs
      }
    };
  
    fetchCars();
  }, []);
  
  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={25} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchBar}
          placeholder="e.g.  Nisan Patrol or BMW"
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
      <FilterModal
  visible={modalVisible}
  onClose={() => setModalVisible(false)}
  onApplyFilters={(filters: any) => {
    setSelectedFilters(prev => ({
      cities: Array.isArray(filters?.registrationCities) ? filters.registrationCities : prev.cities,
      fuelTypes: Array.isArray(filters?.fuelTypes) ? filters.fuelTypes : prev.fuelTypes,
      engineCapacities: Array.isArray(filters?.engineCapacities) ? filters.engineCapacities : prev.engineCapacities,
      colors: Array.isArray(filters?.bodyColors) ? filters.bodyColors : prev.colors,
    }));
  }}
/>

    </View>
    {loading ? (
  <CarCardSkeleton count={3} />
) : (
    <FlatList
  data={filteredCars}
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
    <CarCard
      car={item}
      userId={userData?.userId ? String(userData.userId) : null}
      onPress={() => 
        navigation.navigate("CarDetails", { carDetails: item })  // Pass entire item here
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
  separatorLine: {
  borderBottomWidth: 1,
  borderBottomColor: '#eee',
},


});

export default FeaturedCarListScreen;