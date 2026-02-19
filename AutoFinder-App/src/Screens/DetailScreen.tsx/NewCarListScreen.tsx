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
  Image,
} from "react-native";
import { FontAwesome, Ionicons, MaterialIcons } from "@expo/vector-icons";
import CarCard from "../../Components/NewCarCard";
import FilterModal from "../../Components/Models/FilterModal";
import PriceFilterModal from "../../Components/Models/PriceFilterModal";
import YearFilterModal from "../../Components/Models/YearFilterModal";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { API_URL } from "../../../config";
import { COLORS } from "../../constants/colors";
import CarCardSkeleton from "../../Components/Commons/CarCardSkeleton";
import { useRoute } from "@react-navigation/native";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { isAdValidForPublicListing } from "../../utils/safeFiltering";

type CarListScreenProps = NativeStackScreenProps<any, "CarListScreen">;

const NewCarListScreen: React.FC<CarListScreenProps> = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [cars, setCars] = useState<any[]>([]);
  const [showSortModal, setShowSortModal] = useState(false);
  const [sortBy, setSortBy] = useState("Relevance");
  const [modalVisible, setModalVisible] = useState(false);
  const [priceModalVisible, setPriceModalVisible] = useState(false);
  const [yearModalVisible, setYearModalVisible] = useState(false);
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
        // Don't set loading to false here - let fetchCars handle it
      };
    
      fetchUserData();
    }, []);
  const route = useRoute();
const filterType = (route?.params as any)?.filterType;
const filterValue = (route?.params as any)?.filterValue;

  const [selectedFilters, setSelectedFilters] = useState({
    cities: [] as string[],
    fuelTypes: [] as string[],
    engineCapacities: [] as string[],
    colors: [] as string[],
    brands: [] as string[],
    registrationCities: [] as string[],
    bodyTypes: [] as string[],
    transmissions: [] as string[],
    assemblies: [] as string[],
  });  
  const sortOptions = [
    "Relevance",
    "Price: Low to High",
    "Price: High to Low",
    "Newest"
  ];
  const parseBudgetRange = (label: string) => {
    const lower = label.toLowerCase();
  
    const extractAmount = (text: string) => {
      if (text.includes("crore")) {
        const num = Number(text.replace(/[^\d.]/g, ""));
        return num * 10000000;
      } else if (text.includes("lakh")) {
        const num = Number(text.replace(/[^\d.]/g, ""));
        return num * 100000;
      }
      return Number(text.replace(/[^\d]/g, ""));
    };
  
    if (lower.includes("under")) {
      const max = extractAmount(label);
      return { min: 0, max };
    } else if (lower.includes("above")) {
      const min = extractAmount(label);
      return { min, max: Infinity };
    } else {
      const parts = label.toLowerCase().split("-");
      if (parts.length === 2) {
        const min = extractAmount(parts[0]);
        const max = extractAmount(parts[1]);
        return { min, max };
      }
      return { min: 0, max: Infinity }; // fallback
    }
  };
  
  
  
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
  console.log("🔍 Filtering cars:", {
    totalCars: carsList.length,
    searchQuery,
    minPrice,
    maxPrice,
    minYear,
    maxYear,
    selectedFilters
  });
  
  const filteredCars = carsList.filter((car) => {
    console.log("🔍 Filtering car:", {
      make: car.make,
      model: car.model,
      price: car.price,
      year: car.year
    });
    
    const carName = `${car.make} ${car.model} ${car.variant} ${car.year}`.toLowerCase();
    const matchesSearch = carName.includes(searchQuery.toLowerCase());
    const carPrice = car.price ? Number(String(car.price).replace(/[^0-9]/g, "")) : 0;
    const matchesPrice = carPrice >= minPrice && carPrice <= maxPrice;
    const carYear = Number(car.year);
    const matchesBodyType =
    selectedFilters.bodyTypes.length === 0 ||
    selectedFilters.bodyTypes.map(t => t.toLowerCase()).includes(car.bodyType?.toLowerCase()) ||
    selectedFilters.bodyTypes.map(t => t.toLowerCase()).includes("all body types");

    const matchesYear = carYear >= minYear && carYear <= maxYear;
    // const carMileage = Number(car.kmDriven);
    // const matchesMileage = carMileage >= minMileage && carMileage <= maxMileage;
    const matchesCity = selectedFilters.cities.length === 0 || selectedFilters.cities.includes(car.location) || selectedFilters.cities.includes("All Cities");
    const matchesRegistrationCity = selectedFilters.registrationCities.length === 0 || selectedFilters.registrationCities.includes(car.registrationCity) || selectedFilters.registrationCities.includes("All Cities");
    const matchesBrand =
    selectedFilters.brands.length === 0 ||
    selectedFilters.brands.map(b => b.toLowerCase()).includes(car.make?.toLowerCase()) ||
    selectedFilters.brands.map(b => b.toLowerCase()).includes("all brands");
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
    const matchesColor = selectedFilters.colors.length === 0 || selectedFilters.colors.includes(car.bodyColor);
    const matchesFilterType = !filterType || !filterValue || (
      (filterType === "brand" && car.make.toLowerCase() === filterValue.toLowerCase()) ||
      (filterType === "bodyType" && car.bodyType.toLowerCase() === filterValue.toLowerCase()) ||
      (filterType === "model" && car.model.toLowerCase() === filterValue.toLowerCase())||
      (filterType === "city" && car.location?.toLowerCase() === filterValue.toLowerCase())||
      (filterType === "category" && (car.category || '').toLowerCase() === filterValue.toLowerCase())||
      (filterType === "budget" && (() => {
        const { min, max } = parseBudgetRange(filterValue);
        return carPrice >= min && carPrice <= max;
      })())

    );
    const result = (
      matchesSearch &&
      matchesPrice &&
      matchesYear &&
      matchesBodyType &&
      // matchesMileage &&
      matchesBrand &&
      matchesCity &&
      matchesRegistrationCity &&
      matchesFuel &&
      matchesEngine &&
      matchesColor &&
      matchesTransmission &&
      matchesAssembly &&
      matchesFilterType
    );
  
    console.log("✅ Car filter result:", {
      make: car.make,
      model: car.model,
      result,
      matches: {
        matchesSearch,
        matchesPrice,
        matchesYear,
        matchesBodyType,
        matchesBrand,
        matchesCity,
        matchesRegistrationCity,
        matchesFuel,
        matchesEngine,
        matchesColor,
        matchesTransmission,
        matchesAssembly,
        matchesFilterType
      }
    });
    
    return result;
  });
  
  console.log("🔍 Debug filtering:", {
    totalCars: Array.isArray(cars) ? cars.length : 0,
    carsIsArray: Array.isArray(cars),
    searchQuery,
    minPrice,
    maxPrice,
    minYear,
    maxYear,
    selectedFilters,
    filterType,
    filterValue
  });
  
  const sortedCars = [...filteredCars].sort((a, b) => {
    const priceA = Number(String(a.price).replace(/[^0-9]/g, ""));
    const priceB = Number(String(b.price).replace(/[^0-9]/g, ""));
  
    switch (sortBy) {
      case "Price: Low to High":
        return priceA - priceB;
      case "Price: High to Low":
        return priceB - priceA;
      case "Newest":
        return b.year - a.year;
      default:
        return 0;
    }
  });
  
  console.log("✅ Filtered cars result:", {
    totalCars: Array.isArray(cars) ? cars.length : 0,
    filteredCars: filteredCars.length,
    sortedCars: sortedCars.length,
    filteredCarsDetails: filteredCars.map(car => ({
      make: car.make,
      model: car.model,
      year: car.year,
      price: car.price
    }))
  });
  useEffect(() => {
    const fetchCars = async () => {
      try {
        setLoading(true); // Show loader
        console.log("🚗 Fetching popular cars from:", `${API_URL}/new_cars`);
        const response = await fetch(`${API_URL}/new_cars/public`);
        const data = await response.json();
        console.log(`✅ Received ${Array.isArray(data) ? data.length : 'undefined'} popular cars`);
        console.log("Response data:", data);
        
        if (Array.isArray(data) && data.length > 0) {
          console.log("Sample car properties:", Object.keys(data[0]));
          console.log("Sample car data:", data[0]);
          
          // ✅ Filter out rejected/inactive/expired cars using unified validation
          const filteredCars = data.filter((car: any) => isAdValidForPublicListing(car));
          
          console.log(`✅ Valid cars after filtering: ${filteredCars.length}`);
          setCars(filteredCars);
        } else {
          console.log("No cars data received or invalid format");
          setCars([]);
        }
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

        {["Price", "Year", "Inspected Cars"].map((filter, index) => (
  <TouchableOpacity 
    key={index} 
    style={styles.filterBox} 
    onPress={() => {
      if (filter === "Price") setPriceModalVisible(true);
      if (filter === "Year") setYearModalVisible(true);
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
    console.log("Applying filters:", filters);
    setSelectedFilters({
      cities: filters.locations || [],
      fuelTypes: filters.fuelTypes || [],
      engineCapacities: filters.engineCapacities || [],
      colors: filters.bodyColors || [],
      brands: filters.brands || [],
      registrationCities: filters.registrationCities || [],
      bodyTypes: filters.bodyTypes || [],
      transmissions: filters.transmissions || [],
      assemblies: filters.assemblies || [],
    });
  }}
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
) : sortedCars.length > 0 ? (
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
    renderItem={({ item }) => {
  const images = [
    item.image1,
    item.image2,
    item.image3,
    item.image4,
    item.image5,
    item.image6,
    item.image7,
    item.image8,
  ].filter(Boolean).map(img => `${API_URL}/uploads/${img}`);

  return (
    <CarCard
      car={{ ...item, images }}
      userId={userData?.userId}
      onPress={() => {
        console.log("🚀 Navigating to NewCarDetails with data:");
        console.log("   Car _id:", item._id);
        console.log("   Car userId:", item.userId);
        console.log("   Car make:", item.make);
        console.log("   Car model:", item.model);
        console.log("   Full item:", item);
        
        // Ensure we have the car ID - try different possible fields
        const carId = item._id || item.id || item.carId;
        console.log("   Using car ID:", carId);
        
        navigation.navigate("NewCarDetails", {
          carDetails: { 
            ...item, 
            images, 
            _id: carId,
            carId: carId,
            id: carId,
            userId: item.userId
          },
        });
      }}
    />
  );
}}
    keyboardShouldPersistTaps="handled"
  />
) : (
  <View style={styles.emptyContainer}>
    <Image
      source={require('../../../assets/Other/nodatafound.png')} // Update path as needed
      style={styles.emptyImage}
    />
  </View>
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
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 60,
  },
  emptyImage: {
    width: 500,
    height: 500,
    resizeMode: 'contain',
  },
  separatorLine: {
  borderBottomWidth: 1,
  borderBottomColor: '#eee',
},

});

export default NewCarListScreen;