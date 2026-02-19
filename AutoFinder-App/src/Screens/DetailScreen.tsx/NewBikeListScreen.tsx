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
import BikeCard from "../../Components/BikeCard";
import FilterModal from "../../Components/Models/FilterModal";
import PriceFilterModal from "../../Components/Models/PriceFilterModal";
import YearFilterModal from "../../Components/Models/YearFilterModal";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { API_URL } from "../../../config";
import { COLORS } from "../../constants/colors";
import CarCardSkeleton from "../../Components/Commons/CarCardSkeleton";
import { safeGetAllImagesWithApiUrl } from "../../utils/safeImageUtils";
import { useRoute } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import BikeFilterModal from "../../Components/Models/BikeFilterModal";
import { isAdValidForPublicListing } from "../../utils/safeFiltering";

type CarListScreenProps = NativeStackScreenProps<any, "CarListScreen">;

const NewBikeListScreen: React.FC<CarListScreenProps> = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [bikes, setBikes] = useState<any[]>([]);
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
        // Don't set loading to false here - let fetchBikes handle it
      };
    
      fetchUserData();
    }, []);
  const route = useRoute();
const filterType = route?.params?.filterType;
const filterValue = route?.params?.filterValue;

  const [selectedFilters, setSelectedFilters] = useState({
    cities: [],
    fuelTypes: [],
    engineCapacities: [],
    colors: [],
    brands: [],
    registrationCities: [],
    bodyTypes: [],
    transmissions: [],
    assemblies: [],
  });  
  const sortOptions = [
    "Relevance",
    "Price: Low to High",
    "Price: High to Low",
    "Newest"
  ];
  const parseBudgetRange = (label) => {
    const lower = label.toLowerCase();
  
    const extractAmount = (text) => {
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
  const bikesList = Array.isArray(bikes) ? bikes : [];
  const filteredBikes = bikesList.filter((bike) => {
    try {
      // Ensure selectedFilters is defined and has all required properties
      const filters = selectedFilters || {
        cities: [],
        fuelTypes: [],
        engineCapacities: [],
        colors: [],
        brands: [],
        registrationCities: [],
        bodyTypes: [],
        transmissions: [],
        assemblies: [],
      };

      // Search filter
      const bikeName = `${bike.make || ''} ${bike.model || ''} ${bike.variant || ''} ${bike.year || ''}`.toLowerCase();
      const matchesSearch = bikeName.includes(searchQuery.toLowerCase());
      
      // Price filter
      const bikePrice = bike && bike.price ? Number(String(bike.price).replace(/[^0-9]/g, "")) : 0;
      const matchesPrice = bikePrice >= minPrice && bikePrice <= maxPrice;
      
      // Year filter
      const bikeYear = Number(bike.year) || 0;
      const matchesYear = bikeYear >= minYear && bikeYear <= maxYear;
      
      // Body type filter
      const matchesBodyType = !filters.bodyTypes || filters.bodyTypes.length === 0 || 
        filters.bodyTypes.map(t => t.toLowerCase()).includes((bike.bodyType || '').toLowerCase()) ||
        filters.bodyTypes.map(t => t.toLowerCase()).includes("all body types");
      
      // City filter
      const matchesCity = !filters.cities || filters.cities.length === 0 || 
        filters.cities.includes(bike.location || '') || 
        filters.cities.includes(bike.adCity || '') ||
        filters.cities.includes("All Cities");
      
      // Registration city filter
      const matchesRegistrationCity = !filters.registrationCities || filters.registrationCities.length === 0 || 
        filters.registrationCities.includes(bike.registrationCity || '') || 
        filters.registrationCities.includes("All Cities");
      
      // Brand filter
      const matchesBrand = !filters.brands || filters.brands.length === 0 ||
        filters.brands.map(b => b.toLowerCase()).includes((bike.make || '').toLowerCase()) ||
        filters.brands.map(b => b.toLowerCase()).includes("all brands");
      
      // Transmission filter
      const matchesTransmission = !filters.transmissions || filters.transmissions.length === 0 ||
        filters.transmissions.map(t => t.toLowerCase()).includes((bike.transmission || '').toLowerCase()) ||
        filters.transmissions.includes("All");
      
      // Assembly filter
      const matchesAssembly = !filters.assemblies || filters.assemblies.length === 0 ||
        filters.assemblies.map(a => a.toLowerCase()).includes((bike.assembly || '').toLowerCase()) ||
        filters.assemblies.includes("All");
      
      // Fuel type filter
      const matchesFuel = !filters.fuelTypes || filters.fuelTypes.length === 0 || 
        filters.fuelTypes.includes(bike.fuelType || '');
      
      // Engine capacity filter
      const matchesEngine = !filters.engineCapacities || filters.engineCapacities.length === 0 ||
        filters.engineCapacities.some((rangeLabel) => {
          const range = engineOptions.find((option) => option.label === rangeLabel);
          if (!range) return false;
          const engineValue = parseInt(bike.engineCapacity || '0');
          return !isNaN(engineValue) && engineValue >= range.min && engineValue <= range.max;
        });
      
      // Color filter
      const matchesColor = !filters.colors || filters.colors.length === 0 || 
        filters.colors.includes(bike.bodyColor || '');
      
      // Filter type (from navigation)
      const matchesFilterType = !filterType || !filterValue || (
        (filterType === "brand" && (bike.make || '').toLowerCase() === filterValue.toLowerCase()) ||
        (filterType === "bodyType" && (bike.bodyType || '').toLowerCase() === filterValue.toLowerCase()) ||
        (filterType === "model" && (bike.model || '').toLowerCase() === filterValue.toLowerCase()) ||
        (filterType === "city" && (bike.location || bike.adCity || '').toLowerCase() === filterValue.toLowerCase()) ||
        (filterType === "category" && (bike.category || '').toLowerCase() === filterValue.toLowerCase()) ||
        (filterType === "budget" && (() => {
          const { min, max } = parseBudgetRange(filterValue);
          return bikePrice >= min && bikePrice <= max;
        })())
      );

      return (
        matchesSearch &&
        matchesPrice &&
        matchesYear &&
        matchesBodyType &&
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
    } catch (error) {
      console.error("Error filtering bike:", error, bike);
      return false; // Exclude bikes that cause errors
    }
  });
  const sortedBikes = [...filteredBikes].sort((a, b) => {
    try {
      const priceA = a && a.price ? Number(String(a.price).replace(/[^0-9]/g, "")) : 0;
      const priceB = b && b.price ? Number(String(b.price).replace(/[^0-9]/g, "")) : 0;
    
      switch (sortBy) {
        case "Price: Low to High":
          return priceA - priceB;
        case "Price: High to Low":
          return priceB - priceA;
        case "Newest":
          const dateA = new Date(a.dateAdded || 0).getTime();
          const dateB = new Date(b.dateAdded || 0).getTime();
          return dateB - dateA;
        default:
          return 0;
      }
    } catch (error) {
      console.error("Error sorting bikes:", error);
      return 0;
    }
  });
  useEffect(() => {
    const fetchBikes = async () => {
      try {
        setLoading(true); // Show loader
        console.log("Fetching premium bikes from:", `${API_URL}/premium-bike-ads`);
        const response = await fetch(`${API_URL}/premium-bike-ads`);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log("Fetched bikes data:", data.length, "bikes");
        console.log("Sample bike data structure:", data[0] ? {
          _id: data[0]._id,
          make: data[0].make,
          model: data[0].model,
          userId: data[0].userId,
          hasUserId: !!data[0].userId,
          userIdType: typeof data[0].userId
        } : "No data");
        
        // ✅ Filter out rejected/inactive/expired bikes using unified validation
        const filteredBikes = (Array.isArray(data) ? data : []).filter((bike: any) => 
          isAdValidForPublicListing(bike)
        );
        
        console.log(`✅ Valid bikes after filtering: ${filteredBikes.length}`);
        setBikes(filteredBikes);
      } catch (error) {
        console.error("Error fetching bike data:", error);
        setBikes([]); // Set empty array on error
      } finally {
        setLoading(false); // Hide loader after data is fetched or error occurs
      }
    };
  
    fetchBikes();
  }, []);
  
  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={25} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchBar}
          placeholder="e.g.  Kawashaki Ninja ..."
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
     
      <BikeFilterModal
  visible={modalVisible}
  onClose={() => setModalVisible(false)}
  onApplyFilters={(filters) => {
    console.log("Applying filters:", filters);
    setSelectedFilters(filters || {
      cities: [],
      fuelTypes: [],
      engineCapacities: [],
      colors: [],
      brands: [],
      registrationCities: [],
      bodyTypes: [],
      transmissions: [],
      assemblies: [],
    });
  }}
/>

    </View>
         <View style={styles.separatorLine} />
    <View style={styles.sortContainer}>
        <Text style={styles.resultsText}>{sortedBikes.length} results</Text>
        <TouchableOpacity style={styles.sortButton} onPress={() => setShowSortModal(true)}>
  <Text style={styles.sortButtonText}>Sort: {sortBy}</Text>
  <Ionicons name="chevron-down" size={16} color={COLORS.primary} />
</TouchableOpacity>

      </View>
      {loading ? (
  <CarCardSkeleton count={3} />
) : sortedBikes.length > 0 ? (
  <FlatList
    data={sortedBikes}
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
        return `${item.make || 'bike'}-${item.model || 'model'}-${item.year || 'year'}-${index}`;
      } catch (error) {
        return `bike-${index}-${Date.now()}`;
      }
    }}
   renderItem={({ item }) => {
  const images = safeGetAllImagesWithApiUrl(item, API_URL);

  return (
    <BikeCard
      bike={{ ...item, images }}
      userId={userData?.userId}
      showPremiumTag={true}
      onPress={() => {
        console.log("🚀 Navigating to NewBikeDetailsScreen with data:");
        console.log("   Item _id:", item._id);
        console.log("   Item userId:", item.userId);
        console.log("   Item make:", item.make);
        console.log("   Item model:", item.model);
        console.log("   Full item:", item);
        
        // Ensure we have the bike ID - try different possible fields
        const bikeId = item._id || item.id || item.bikeId;
        console.log("   Using bike ID:", bikeId);
        
        navigation.navigate("NewBikeDetailsScreen", {
          carDetails: { 
            ...item, 
            images, 
            _id: bikeId,
            bikeId: bikeId,
            id: bikeId
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

export default NewBikeListScreen;