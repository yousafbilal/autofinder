import React, { useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Switch,
  TextInput,
  Keyboard,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import MultiSlider from "@ptomasroos/react-native-multi-slider";

interface EnhancedUsedCarFilterModalProps {
  visible: boolean;
  onClose: () => void;
  onApplyFilters: (filters: {
    // Basic Filters
    brands: string[];
    models: string[];
    variants: string[];
    years: { min: number; max: number };
    registrationCities: string[];
    locations: string[];
    bodyColors: string[];
    kmDriven: { min: number; max: number };
    price: { min: number; max: number };
    fuelTypes: string[];
    engineCapacity: { min: number; max: number };
    transmissions: string[];
    assemblies: string[];
    bodyTypes: string[];
    
    // Special Filters
    isCertified: boolean;
    isFeatured: boolean;
    isSaleItForMe: boolean;
    
    // Extended Categories
    categories: string[];
  }) => void;
}

const EnhancedUsedCarFilterModal = ({ visible, onClose, onApplyFilters }: EnhancedUsedCarFilterModalProps) => {
  // Basic Filter States
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [selectedModels, setSelectedModels] = useState<string[]>([]);
  const [selectedVariants, setSelectedVariants] = useState<string[]>([]);
  const [yearRange, setYearRange] = useState({ min: 1970, max: new Date().getFullYear() });
  const [selectedRegistrationCities, setSelectedRegistrationCities] = useState<string[]>([]);
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const [selectedBodyColors, setSelectedBodyColors] = useState<string[]>([]);
  const [kmRange, setKmRange] = useState({ min: 0, max: 500000 });
  const [priceRange, setPriceRange] = useState({ min: 0, max: 50000000 });
  const [selectedFuelTypes, setSelectedFuelTypes] = useState<string[]>([]);
  const [engineRange, setEngineRange] = useState({ min: 0, max: 6000 });
  const [selectedTransmissions, setSelectedTransmissions] = useState<string[]>([]);
  const [selectedAssemblies, setSelectedAssemblies] = useState<string[]>([]);
  const [selectedBodyTypes, setSelectedBodyTypes] = useState<string[]>([]);
  
  // Special Filter States
  const [isCertified, setIsCertified] = useState(false);
  const [isFeatured, setIsFeatured] = useState(false);
  const [isSaleItForMe, setIsSaleItForMe] = useState(false);
  
  // Extended Category States
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  
  // Registration City - full screen picker page with search & multi-select
  const [showRegistrationCityPicker, setShowRegistrationCityPicker] = useState(false);
  const [registrationCityQuery, setRegistrationCityQuery] = useState("");

  // Data Arrays - Comprehensive Pakistani Car Data
  const brands = [
    "All Brands", 
    // Pakistani Popular Brands
    "Suzuki", "Toyota", "Honda", "Kia", "Hyundai", "MG", "Changan", "BYD",
    // Luxury Brands
    "BMW", "Audi", "Mercedes Benz", "Porsche", "Lexus", "Volvo", "Land Rover", "Jaguar",
    // Japanese Brands
    "Nissan", "Mazda", "Mitsubishi", "Daihatsu",
    // American Brands
    "Ford", "Chevrolet", "Jeep", "Tesla",
    // European Brands
    "Volkswagen", "Peugeot", "Alfa Romeo", "Fiat",
    // Chinese Brands
    "Proton", "DFSK", "Haval", "Chery", "BAIC", "ORA", "Deepal", "Seres", "Tank", "Honri", "GUGO",
    // Pakistani Local Brands
    "United", "Prince", "FAW",
    // Commercial
    "Isuzu", "JMC", "JW Forland", "Daehan"
  ];

  // Master models list (fallback when no brand selected)
  const models = [
    "All Models",
    // Suzuki Models
    "Alto", "Cultus", "Swift", "Wagon R", "Every", "Ravi", "Jimny", "Bolan", "Mehran", "APV", "Ciaz", "Baleno", "Celerio", "Ertiga",
    // Toyota Models  
    "Corolla", "Yaris", "Fortuner", "Hilux", "Prius", "Camry", "Land Cruiser", "Prado", "Corolla Cross", "Rush", "Hiace", "Aqua", "Vitz", "Crown",
    // Honda Models
    "Civic", "City", "BR-V", "HR-V", "Vezel", "CR-V", "Fit", "Accord", "Jazz",
    // Kia Models
    "Picanto", "Sportage", "Sorento", "Stonic", "Grand Carnival", "EV5", "Forte", "K5", "Seltos", "Soul", "Niro",
    // Hyundai Models
    "Tucson", "Elantra", "Sonata", "Santa Fe", "Staria", "H-100", "Ioniq 5", "Ioniq 6", "Kona", "Venue", "i10", "i20",
    // MG Models
    "HS", "ZS", "ZS EV", "4", "5 EV", "3", "6",
    // Changan Models
    "Alsvin", "Oshan X7", "Karvaan", "M9",
    // BYD Models
    "Atto 3", "Seal", "Dolphin",
    // BMW Models
    "3 Series", "5 Series", "7 Series", "X1", "X3", "X5", "X7", "i4", "iX3",
    // Audi Models
    "A3", "A4", "A6", "A8", "Q2", "Q3", "Q5", "Q7", "Q8", "e-tron",
    // Mercedes Models
    "C Class", "E Class", "S Class", "GLC", "GLE", "G Class", "A Class",
    // Other Popular Models
    "Mira", "Move", "Cuore", "Hijet", "Passo", "Note", "Sunny", "Dayz", "Latio", "Wrangler", "Compass", "Cherokee",
    // Commercial
    "D-Max", "Shehzore", "Safari", "Vigus"
  ];

  // Master variants list (fallback when no model selected)
  const variants = [
    "All Variants",
    // Suzuki Alto Variants
    "VX", "VXR", "VXR AGS", "VXL AGS",
    // Suzuki Cultus Variants
    "VXL", "Auto Gear Shift",
    // Suzuki Swift Variants
    "GL Manual", "GL CVT", "GLX CVT",
    // Toyota Corolla Variants
    "XLi", "GLi", "Altis", "Grande", "Altis X Manual 1.6", "Altis 1.6 X CVT-i", "Altis X CVT-i 1.8", "Altis Grande X CVT-i 1.8",
    // Toyota Yaris Variants
    "GLI MT 1.3", "ATIV MT 1.3", "GLI CVT 1.3", "ATIV CVT 1.3", "ATIV X CVT 1.5",
    // Toyota Fortuner Variants
    "2.7 G", "2.8 Sigma 4", "2.7 V", "Legender", "GR-S",
    // Honda Civic Variants
    "Oriel", "RS", "Turbo RS", "VTi Oriel Prosmatec",
    // Honda City Variants
    "1.2L M/T", "1.2L CVT", "1.5L CVT", "1.5L ASPIRE M/T", "1.5L ASPIRE CVT",
    // Kia Sportage Variants
    "Alpha", "FWD", "AWD", "Black Limited Edition",
    // Kia Picanto Variants
    "1.0 MT", "1.0 AT",
    // Hyundai Tucson Variants
    "FWD A/T GLS", "FWD A/T GLS Sport", "AWD A/T Ultimate",
    // MG HS Variants
    "Excite", "Essence", "2.0T AWD", "PHEV",
    // Changan Alsvin Variants
    "1.3L MT Comfort", "1.5L DCT Comfort", "1.5L DCT Lumiere", "Black Edition",
    // BYD Variants
    "Advance", "Dynamic", "Premium",
    // General Variants
    "Base", "Standard", "Luxury", "Executive", "Sport", "Hybrid", "Turbo",
    "Automatic", "Manual", "CVT", "AMT", "DCT", "4WD", "RWD",
    // Premium Variants
    "S", "SE", "SEL", "Limited", "Platinum", "Prestige"
  ];

  // Brand → Models mapping for dynamic filtering (same mapping as premium ads)
  const brandToModelsMap: { [key: string]: string[] } = {
    Suzuki: ["Alto", "Cultus", "Swift", "Wagon R", "Every", "Ravi", "Jimny", "Bolan", "Mehran", "APV", "Ciaz", "Baleno", "Celerio", "Ertiga"],
    Toyota: ["Corolla", "Yaris", "Fortuner", "Hilux", "Prius", "Camry", "Land Cruiser", "Prado", "Corolla Cross", "Rush", "Hiace", "Aqua", "Vitz", "Crown"],
    Honda: ["Civic", "City", "BR-V", "HR-V", "Vezel", "CR-V", "Fit", "Accord", "Jazz"],
    Kia: ["Picanto", "Sportage", "Sorento", "Stonic", "Grand Carnival", "EV5", "Forte", "K5", "Seltos", "Soul", "Niro"],
    Hyundai: ["Tucson", "Elantra", "Sonata", "Santa Fe", "Staria", "H-100", "Ioniq 5", "Ioniq 6", "Kona", "Venue", "i10", "i20"],
    MG: ["HS", "ZS", "ZS EV", "4", "5 EV", "3", "6"],
    Changan: ["Alsvin", "Oshan X7", "Karvaan", "M9"],
    BYD: ["Atto 3", "Seal", "Dolphin"],
    BMW: ["3 Series", "5 Series", "7 Series", "X1", "X3", "X5", "X7", "i4", "iX3"],
    Audi: ["A3", "A4", "A6", "A8", "Q2", "Q3", "Q5", "Q7", "Q8", "e-tron"],
    "Mercedes Benz": ["C Class", "E Class", "S Class", "GLC", "GLE", "G Class", "A Class"],
    Nissan: ["Note", "Sunny", "Dayz", "Latio"],
    Mazda: ["Mira", "Move"],
    Mitsubishi: ["Cuore"],
    Daihatsu: ["Hijet", "Passo"],
    Ford: ["Wrangler", "Compass", "Cherokee"],
    Jeep: ["Wrangler", "Compass", "Cherokee"],
    Isuzu: ["D-Max"],
    JMC: ["Shehzore", "Safari", "Vigus"],
  };

  // Model → Variants mapping (same mapping as premium ads)
  const modelToVariantsMap: { [key: string]: string[] } = {
    // Suzuki
    Alto: ["VX", "VXR", "VXR AGS", "VXL AGS"],
    Cultus: ["VXL", "Auto Gear Shift"],
    Swift: ["GL Manual", "GL CVT", "GLX CVT"],
    // Toyota
    Corolla: ["XLi", "GLi", "Altis", "Grande", "Altis X Manual 1.6", "Altis 1.6 X CVT-i", "Altis X CVT-i 1.8", "Altis Grande X CVT-i 1.8"],
    Yaris: ["GLI MT 1.3", "ATIV MT 1.3", "GLI CVT 1.3", "ATIV CVT 1.3", "ATIV X CVT 1.5"],
    Fortuner: ["2.7 G", "2.8 Sigma 4", "2.7 V", "Legender", "GR-S"],
    // Honda
    Civic: ["Oriel", "RS", "Turbo RS", "VTi Oriel Prosmatec"],
    City: ["1.2L M/T", "1.2L CVT", "1.5L CVT", "1.5L ASPIRE M/T", "1.5L ASPIRE CVT"],
    // Kia
    Sportage: ["Alpha", "FWD", "AWD", "Black Limited Edition"],
    Picanto: ["1.0 MT", "1.0 AT"],
    // Hyundai
    Tucson: ["FWD A/T GLS", "FWD A/T GLS Sport", "AWD A/T Ultimate"],
    // MG
    HS: ["Excite", "Essence", "2.0T AWD", "PHEV"],
    // Changan
    Alsvin: ["1.3L MT Comfort", "1.5L DCT Comfort", "1.5L DCT Lumiere", "Black Edition"],
    // BYD
    "Atto 3": ["Advance", "Dynamic", "Premium"],
    Seal: ["Advance", "Dynamic", "Premium"],
    Dolphin: ["Advance", "Dynamic", "Premium"],
  };

  const cities = [
    "All Cities", "Lahore", "Karachi", "Islamabad", "Rawalpindi", "Multan", 
    "Faisalabad", "Peshawar", "Quetta", "Sialkot", "Gujranwala", "Sargodha", 
    "Bahawalpur", "Sukkur", "Larkana", "Sheikhupura", "Rahim Yar Khan", "Gujrat",
    "Mardan", "Mingora", "Nawabshah", "Chiniot", "Kotri", "Kāmoke", "Hafizabad", "Kohat"
  ];

  const bodyColors = [
    "All Colors", "White", "Black", "Silver", "Gray", "Red", "Blue", "Green", 
    "Yellow", "Orange", "Brown", "Purple", "Gold", "Beige", "Maroon", "Navy",
    "Pearl White", "Metallic Silver", "Champagne", "Bronze", "Copper"
  ];

  const fuelTypes = [
    "All Fuel Types", "Petrol", "Diesel", "Hybrid", "Electric", "CNG", "LPG"
  ];

  const transmissions = [
    "All Transmissions", "Manual", "Automatic", "CVT", "AMT", "DCT"
  ];

  const assemblies = [
    "All Assemblies", "Local", "Imported"
  ];

  const bodyTypes = [
    "All Body Types", "Sedan", "Hatchback", "SUV", "Crossover", "Coupe", 
    "Convertible", "Wagon", "Pickup", "Van", "Minivan", "Truck", "Jeep"
  ];

  // Extended Categories
  const categories = [
    "All Categories", 
    "Automatic Cars", 
    "Family Cars", 
    "Low Price Cars", 
    "1000cc Cars",
    "660 CC Cars",
    "Low Mileage Cars",
    "Japanese Cars",
    "Urgent Sale",
    "Imported Cars",
    "1300 CC Cars",
    "Old Cars",
    "Modified Cars",
    "Electric Cars",
    "Duplicate Documents",
    "Accidental Cars",
    "Jeeps",
    "Hybrid Cars",
    "Sports Cars",
    "Auctioned Cars",
    "Commercial Vehicles",
    "Full Crashed Cars",
    "Diesel Vehicles",
    "Vintage Cars"
  ];

  // Toggle selection helper
  const toggleSelection = <T,>(
    option: T, 
    setSelected: React.Dispatch<React.SetStateAction<T[]>>, 
    selectedList: T[]
  ) => {
    if (option === "All Brands" || option === "All Models" || option === "All Variants" || 
        option === "All Cities" || option === "All Colors" || option === "All Fuel Types" || 
        option === "All Transmissions" || option === "All Assemblies" || option === "All Body Types" ||
        option === "All Categories") {
      setSelected(selectedList.includes(option) ? [] : [option]);
    } else {
      if (selectedList.includes(option)) {
        setSelected(selectedList.filter((item) => item !== option));
      } else {
        setSelected([...selectedList, option]);
      }
    }
  };

  // Filtered models list based on selected brands
  const filteredModels = useMemo(() => {
    const specificBrands = selectedBrands.filter(
      (b) => b !== "All Brands" && b.trim() !== ""
    );

    // No specific brand → use full models list (with "All Models")
    if (specificBrands.length === 0) {
      return models;
    }

    const result = new Set<string>();

    specificBrands.forEach((brand) => {
      const trimmed = brand.trim();
      const brandKey = Object.keys(brandToModelsMap).find(
        (key) =>
          key === trimmed || key.toLowerCase() === trimmed.toLowerCase()
      );

      if (brandKey && brandToModelsMap[brandKey]) {
        brandToModelsMap[brandKey].forEach((m) => {
          if (m && m.trim() !== "" && m.trim() !== "All Models") {
            result.add(m);
          }
        });
      }
    });

    return Array.from(result).sort();
  }, [selectedBrands]);

  // Filtered variants list based on selected models
  const filteredVariants = useMemo(() => {
    const specificModels = selectedModels.filter(
      (m) => m !== "All Models" && m.trim() !== ""
    );

    // No specific model → use full variants list (with "All Variants")
    if (specificModels.length === 0) {
      return variants;
    }

    const result = new Set<string>();

    specificModels.forEach((model) => {
      const trimmed = model.trim();
      if (modelToVariantsMap[trimmed]) {
        modelToVariantsMap[trimmed].forEach((v) => {
          if (v && v.trim() !== "" && v.trim() !== "All Variants") {
            result.add(v);
          }
        });
      }
    });

    // Add general variants always
    const generalVariants = [
      "Base",
      "Standard",
      "Luxury",
      "Executive",
      "Sport",
      "Hybrid",
      "Turbo",
      "Automatic",
      "Manual",
      "CVT",
      "AMT",
      "DCT",
      "4WD",
      "RWD",
      "S",
      "SE",
      "SEL",
      "Limited",
      "Platinum",
      "Prestige",
    ];
    generalVariants.forEach((v) => result.add(v));

    return Array.from(result).sort();
  }, [selectedModels]);

  const handleReset = () => {
    setSelectedBrands([]);
    setSelectedModels([]);
    setSelectedVariants([]);
    setYearRange({ min: 1970, max: new Date().getFullYear() });
    setSelectedRegistrationCities([]);
    setSelectedLocations([]);
    setSelectedBodyColors([]);
    setKmRange({ min: 0, max: 500000 });
    setPriceRange({ min: 0, max: 50000000 });
    setSelectedFuelTypes([]);
    setEngineRange({ min: 0, max: 6000 });
    setSelectedTransmissions([]);
    setSelectedAssemblies([]);
    setSelectedBodyTypes([]);
    setIsCertified(false);
    setIsFeatured(false);
    setIsSaleItForMe(false);
    setSelectedCategories([]);
    setRegistrationCityQuery("");
  };

  const handleApplyFilters = () => {
    onApplyFilters({
      brands: selectedBrands,
      models: selectedModels,
      variants: selectedVariants,
      years: yearRange,
      registrationCities: selectedRegistrationCities,
      locations: selectedLocations,
      bodyColors: selectedBodyColors,
      kmDriven: kmRange,
      price: priceRange,
      fuelTypes: selectedFuelTypes,
      engineCapacity: engineRange,
      transmissions: selectedTransmissions,
      assemblies: selectedAssemblies,
      bodyTypes: selectedBodyTypes,
      isCertified,
      isFeatured,
      isSaleItForMe,
      categories: selectedCategories,
    });
    onClose();
  };

  const FilterSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <View style={styles.filterSection}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );

  const MultiSelectButtons = ({ 
    options, 
    selected, 
    onToggle, 
    horizontal = true 
  }: { 
    options: string[]; 
    selected: string[]; 
    onToggle: (option: string) => void;
    horizontal?: boolean;
  }) => (
    <ScrollView 
      horizontal={horizontal} 
      showsHorizontalScrollIndicator={false} 
      style={horizontal ? styles.rowContainer : undefined}
    >
      {options.map((option, index) => (
        <TouchableOpacity
          key={index}
          style={[
            styles.filterButton,
            selected.includes(option) && styles.selectedFilter,
            { marginRight: horizontal ? 10 : 5, marginBottom: horizontal ? 0 : 5 }
          ]}
          onPress={() => onToggle(option)}
        >
          <Text style={[
            styles.filterButtonText,
            selected.includes(option) && styles.selectedFilterText
          ]}>
            {option}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  const RangeSlider = ({ 
    title, 
    value, 
    onValueChange, 
    min, 
    max, 
    step = 1,
    unit = ""
  }: {
    title: string;
    value: { min: number; max: number };
    onValueChange: (value: { min: number; max: number }) => void;
    min: number;
    max: number;
    step?: number;
    unit?: string;
  }) => {
    const handleChange = useCallback((values: number[]) => {
      onValueChange({ min: values[0], max: values[1] });
    }, [onValueChange]);
    
    return (
      <View style={styles.rangeContainer}>
        <Text style={styles.rangeTitle}>{title}</Text>
        <View style={styles.rangeValues}>
          <Text style={styles.rangeValue}>{value.min.toLocaleString()}{unit}</Text>
          <Text style={styles.rangeValue}>{value.max.toLocaleString()}{unit}</Text>
        </View>
        <MultiSlider
          values={[value.min, value.max]}
          onValuesChange={handleChange}
          min={min}
          max={max}
          step={step}
          sliderLength={300}
          enableLabel={false}
          snapped={false}
          allowOverlap={false}
          isMarkersSeparated={true}
          shouldRasterizeIOS={true}
          renderToHardwareTextureAndroid={true}
          touchDimensions={{
            height: 80,
            width: 80,
            slipDisplacement: 500,
          }}
          pressedMarkerStyle={styles.sliderThumb}
          selectedStyle={styles.sliderSelected}
          unselectedStyle={styles.sliderUnselected}
          trackStyle={styles.sliderTrack}
          markerStyle={styles.sliderThumb}
          containerStyle={[styles.sliderContainer, { height: 60 }]}
        />
      </View>
    );
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="black" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Used Car Filters</Text>
            <TouchableOpacity onPress={handleReset}>
              <Text style={styles.resetText}>Reset</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={true}>
            
            {/* Categories section removed as requested */}

            {/* Brand Filter */}
            <FilterSection title="Brand Name">
              <MultiSelectButtons
                options={brands}
                selected={selectedBrands}
                onToggle={(option) => {
                  // "All Brands" behaves exclusively
                  if (option === "All Brands") {
                    setSelectedBrands(
                      selectedBrands.includes("All Brands") ? [] : ["All Brands"]
                    );
                  } else {
                    const withoutAll = selectedBrands.filter(
                      (b) => b !== "All Brands"
                    );
                    const exists = withoutAll.includes(option);
                    setSelectedBrands(
                      exists
                        ? withoutAll.filter((b) => b !== option)
                        : [...withoutAll, option]
                    );
                  }
                  // Brand change → clear models & variants
                  setSelectedModels([]);
                  setSelectedVariants([]);
                }}
              />
            </FilterSection>

            {/* Model Filter (depends on selected brands) */}
            <FilterSection title="Model Name">
              <MultiSelectButtons
                options={filteredModels}
                selected={selectedModels}
                onToggle={(option) => {
                  // "All Models" behaves exclusively
                  if (option === "All Models") {
                    setSelectedModels(
                      selectedModels.includes("All Models") ? [] : ["All Models"]
                    );
                  } else {
                    const withoutAll = selectedModels.filter(
                      (m) => m !== "All Models"
                    );
                    const exists = withoutAll.includes(option);
                    setSelectedModels(
                      exists
                        ? withoutAll.filter((m) => m !== option)
                        : [...withoutAll, option]
                    );
                  }
                  // Model change → clear variants
                  setSelectedVariants([]);
                }}
              />
            </FilterSection>

            {/* Variant Filter (depends on selected models) */}
            <FilterSection title="Variant">
              <MultiSelectButtons
                options={filteredVariants}
                selected={selectedVariants}
                onToggle={(option) => toggleSelection(option, setSelectedVariants, selectedVariants)}
              />
            </FilterSection>

            {/* Year Range */}
            <FilterSection title="Model Year">
              <RangeSlider
                title="Year Range"
                value={yearRange}
                onValueChange={setYearRange}
                min={1970}
                max={new Date().getFullYear()}
                step={1}
              />
            </FilterSection>

            {/* Registration City - clickable row opens full-screen searchable, multi-select list */}
            <FilterSection title="Registration City">
              <TouchableOpacity
                activeOpacity={0.9}
                style={styles.searchBox}
                onPress={() => setShowRegistrationCityPicker(true)}
              >
                <Ionicons name="search" size={18} color="#999" style={{ marginRight: 6 }} />
                <Text style={styles.searchPlaceholder}>
                  {selectedRegistrationCities.length > 0 ? `${selectedRegistrationCities.length} selected` : 'Select registration cities'}
                </Text>
                <Ionicons name={'chevron-forward'} size={18} color="#999" />
              </TouchableOpacity>
            </FilterSection>

            {/* Location */}
            <FilterSection title="Location (City)">
              <MultiSelectButtons
                options={cities}
                selected={selectedLocations}
                onToggle={(option) => toggleSelection(option, setSelectedLocations, selectedLocations)}
              />
            </FilterSection>

            {/* Body Color */}
            <FilterSection title="Body Color">
              <MultiSelectButtons
                options={bodyColors}
                selected={selectedBodyColors}
                onToggle={(option) => toggleSelection(option, setSelectedBodyColors, selectedBodyColors)}
              />
            </FilterSection>

            {/* KM Driven Range */}
            <FilterSection title="Kilometers Driven">
              <RangeSlider
                title="KM Range"
                value={kmRange}
                onValueChange={setKmRange}
                min={0}
                max={500000}
                step={1000}
                unit=" km"
              />
            </FilterSection>

            {/* Price Range */}
            <FilterSection title="Price (PKR)">
              <RangeSlider
                title="Price Range"
                value={priceRange}
                onValueChange={setPriceRange}
                min={0}
                max={50000000}
                step={50000}
                unit=" PKR"
              />
            </FilterSection>

            {/* Fuel Type */}
            <FilterSection title="Fuel Type">
              <MultiSelectButtons
                options={fuelTypes}
                selected={selectedFuelTypes}
                onToggle={(option) => toggleSelection(option, setSelectedFuelTypes, selectedFuelTypes)}
              />
            </FilterSection>

            {/* Engine Capacity */}
            <FilterSection title="Engine Capacity (CC)">
              <RangeSlider
                title="Engine Capacity"
                value={engineRange}
                onValueChange={setEngineRange}
                min={0}
                max={6000}
                step={100}
                unit=" cc"
              />
            </FilterSection>

            {/* Transmission */}
            <FilterSection title="Transmission">
              <MultiSelectButtons
                options={transmissions}
                selected={selectedTransmissions}
                onToggle={(option) => toggleSelection(option, setSelectedTransmissions, selectedTransmissions)}
              />
            </FilterSection>

            {/* Assembly */}
            <FilterSection title="Assembly">
              <MultiSelectButtons
                options={assemblies}
                selected={selectedAssemblies}
                onToggle={(option) => toggleSelection(option, setSelectedAssemblies, selectedAssemblies)}
              />
            </FilterSection>

            {/* Body Type */}
            <FilterSection title="Body Type">
              <MultiSelectButtons
                options={bodyTypes}
                selected={selectedBodyTypes}
                onToggle={(option) => toggleSelection(option, setSelectedBodyTypes, selectedBodyTypes)}
              />
            </FilterSection>

            {/* Special Filters */}
            <FilterSection title="Special Features">
              <View style={styles.switchContainer}>
                <View style={styles.switchRow}>
                  <Text style={styles.switchLabel}>AutoFinder Certified</Text>
                  <Switch
                    value={isCertified}
                    onValueChange={setIsCertified}
                    trackColor={{ false: "#767577", true: "#CD0100" }}
                    thumbColor={isCertified ? "#fff" : "#f4f3f4"}
                  />
                </View>
                <View style={styles.switchRow}>
                  <Text style={styles.switchLabel}>Featured Cars</Text>
                  <Switch
                    value={isFeatured}
                    onValueChange={setIsFeatured}
                    trackColor={{ false: "#767577", true: "#CD0100" }}
                    thumbColor={isFeatured ? "#fff" : "#f4f3f4"}
                  />
                </View>
                <View style={styles.switchRow}>
                  <Text style={styles.switchLabel}>Sale It For Me</Text>
                  <Switch
                    value={isSaleItForMe}
                    onValueChange={setIsSaleItForMe}
                    trackColor={{ false: "#767577", true: "#CD0100" }}
                    thumbColor={isSaleItForMe ? "#fff" : "#f4f3f4"}
                  />
                </View>
              </View>
            </FilterSection>

          </ScrollView>

          {/* Full-screen Registration City overlay (rendered above content) */}
          {showRegistrationCityPicker && (
            <View style={styles.overlayFull}>
              <View style={styles.fullPageHeader}>
                <TouchableOpacity onPress={() => { Keyboard.dismiss(); setShowRegistrationCityPicker(false); }}>
                  <Ionicons name="arrow-back" size={22} color="#333" />
                </TouchableOpacity>
                <Text style={styles.fullPageTitle}>Select Registration Cities</Text>
                <View style={{ width: 22 }} />
              </View>

              <View style={[styles.searchBox, { marginHorizontal: 16, marginBottom: 10 }]}> 
                <Ionicons name="search" size={18} color="#999" style={{ marginRight: 6 }} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Type to search"
                  placeholderTextColor="#999"
                  value={registrationCityQuery}
                  onChangeText={setRegistrationCityQuery}
                  autoFocus
                  blurOnSubmit
                  returnKeyType="search"
                  onSubmitEditing={() => Keyboard.dismiss()}
                />
              </View>

              <ScrollView style={{ flex: 1, marginHorizontal: 16 }} keyboardShouldPersistTaps="always">
                {(registrationCityQuery
                  ? cities.filter(c => c.toLowerCase().includes(registrationCityQuery.toLowerCase()))
                  : cities
                ).map((c, idx) => {
                  const selected = selectedRegistrationCities.includes(c);
                  return (
                    <TouchableOpacity
                      key={`${c}-${idx}`}
                      style={[styles.categoryRow, selected && styles.categoryRowSelected]}
                      onPress={() => toggleSelection(c, setSelectedRegistrationCities, selectedRegistrationCities)}
                    >
                      <Text style={[styles.categoryLabel, selected && styles.categoryLabelSelected]}>{c}</Text>
                      <Ionicons name={selected ? 'checkbox' : 'square-outline'} size={20} color={selected ? '#CD0100' : '#999'} />
                    </TouchableOpacity>
                  )
                })}
              </ScrollView>

              <View style={{ padding: 16 }}>
                <TouchableOpacity
                  style={styles.applyButton}
                  onPress={() => { Keyboard.dismiss(); setShowRegistrationCityPicker(false); setRegistrationCityQuery(""); }}
                >
                  <Text style={styles.applyButtonText}>Done</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Fixed Bottom Button */}
          <View style={styles.bottomContainer}>
            <TouchableOpacity style={styles.applyButton} onPress={handleApplyFilters}>
              <Text style={styles.applyButtonText}>Apply Filters</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "white",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "90%",
    minHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  resetText: {
    color: "#CD0100",
    fontSize: 16,
    fontWeight: "600",
  },
  scrollContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  filterSection: {
    marginVertical: 15,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 10,
  },
  rowContainer: {
    marginVertical: 5,
  },
  filterButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    backgroundColor: "#F8F8F8",
    marginRight: 10,
    marginBottom: 5,
  },
  selectedFilter: {
    backgroundColor: "#CD0100",
    borderColor: "#CD0100",
  },
  filterButtonText: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  selectedFilterText: {
    color: "#fff",
    fontWeight: "600",
  },
  rangeContainer: {
    marginVertical: 10,
  },
  rangeTitle: {
    fontSize: 14,
    color: "#666",
    marginBottom: 5,
  },
  rangeValues: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  rangeValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#CD0100",
  },
  sliderContainer: {
    height: 40,
  },
  sliderSelected: {
    backgroundColor: "#CD0100",
  },
  sliderUnselected: {
    backgroundColor: "#E0E0E0",
  },
  sliderTrack: {
    height: 4,
    borderRadius: 2,
  },
  sliderThumb: {
    backgroundColor: "#CD0100",
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  switchContainer: {
    marginVertical: 10,
  },
  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  switchLabel: {
    fontSize: 16,
    color: "#333",
    fontWeight: "500",
  },
  searchInput: {
    flex: 1,
    color: "#333",
    fontSize: 14,
  },
  bottomContainer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
    backgroundColor: "#fff",
  },
  applyButton: {
    backgroundColor: "#CD0100",
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: "center",
  },
  applyButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  overlayFull: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#fff',
    zIndex: 1000,
  },
  fullPageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  fullPageTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333'
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    paddingHorizontal: 12,
    height: 44,
    borderRadius: 10,
  },
  searchPlaceholder: {
    flex: 1,
    color: '#999',
    fontSize: 14,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  categoryRowSelected: {
    backgroundColor: '#FFF6F6',
  },
  categoryLabel: {
    fontSize: 14,
    color: '#333',
  },
  categoryLabelSelected: {
    color: '#CD0100',
    fontWeight: '600'
  },
});

export default EnhancedUsedCarFilterModal;
