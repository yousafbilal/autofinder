import React, { useState, useRef, useCallback, useEffect, useMemo } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  TextInput,
  Keyboard,
  TouchableWithoutFeedback,
  Platform,
  KeyboardAvoidingView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import MultiSlider from "@ptomasroos/react-native-multi-slider";
interface FilterModalProps {
  visible: boolean;
  onClose: () => void;
  onApplyFilters: (filters: {
    cities: string[];
    fuelTypes: string[];
    engineCapacities: string[];
    colors: string[];
    brands: string[];
    models: string[];
    variants: string[];
    bodyTypes: string[];
    registrationCities: string [];
    transmissions: string[];
    assemblies: string[];
    drivingtype: string[];
    paymenttype: string[];
  
  }) => void;
}

const RentalFilterModal = ({ visible, onClose, onApplyFilters }: FilterModalProps) => {
  // State for selected filters
  const [selectedCities, setSelectedCities] = useState<string[]>([]);
  const [selectedBodyTypes, setSelectedBodyTypes] = useState<string[]>([]);
  const [selectedFuel, setSelectedFuel] = useState<string[]>([]);
  const [selectedTransmissions, setSelectedTransmissions] = useState<string[]>([]);
  const [selectedDriveMode, setSelectedDriveMode] = useState<string[]>([]);
  const [selectedPaymentMode, setSelectedPaymentMode] = useState<string[]>([]);
  const [selectedAssemblies, setSelectedAssemblies] = useState<string[]>([]);
  const [selectedExteriorColor, setSelectedExteriorColor] = useState<string[]>([]);
  const [selectedEngineCapacity, setSelectedEngineCapacity] = useState<(string)[]>([]);
  const [engineRange, setEngineRange] = useState({ min: 0, max: 6000 });
  const [fromEngine, setFromEngine] = useState("0");
  const [toEngine, setToEngine] = useState("6000");
  // Refs for engine inputs
  const fromEngineInputRef = useRef<TextInput>(null);
  const toEngineInputRef = useRef<TextInput>(null);
  const fromEngineValueRef = useRef("0");
  const toEngineValueRef = useRef("6000");
  // State for converted words display (green text)
  const [fromEngineWords, setFromEngineWords] = useState("");
  const [toEngineWords, setToEngineWords] = useState("");
  const [selectedBrands, setSelectedBrands] = useState<(string)[]>([]);
  const [selectedModels, setSelectedModels] = useState<string[]>([]);
  const [selectedVariants, setSelectedVariants] = useState<string[]>([]);
  const [selectedRegistrationCities, setSelectedRegistrationCities] = useState<string[]>([]);
  
  // Searchable picker states
  const [showCityPicker, setShowCityPicker] = useState(false);
  const [cityQuery, setCityQuery] = useState("");
  const [showBrandPicker, setShowBrandPicker] = useState(false);
  const [brandQuery, setBrandQuery] = useState("");
  const [showModelPicker, setShowModelPicker] = useState(false);
  const [modelQuery, setModelQuery] = useState("");
  const [showVariantPicker, setShowVariantPicker] = useState(false);
  const [variantQuery, setVariantQuery] = useState("");
  const [showRegistrationCityPicker, setShowRegistrationCityPicker] = useState(false);
  const [registrationCityQuery, setRegistrationCityQuery] = useState("");
  const [showBodyColorPicker, setShowBodyColorPicker] = useState(false);
  const [bodyColorQuery, setBodyColorQuery] = useState("");
  // Body Color - Others page
  const [showBodyColorOthersPage, setShowBodyColorOthersPage] = useState(false);
  const [bodyColorOthersText, setBodyColorOthersText] = useState("");
  
  // Increase/decrease functions for Engine Capacity
  const increaseFromEngine = () => {
    const currentVal = fromEngineValueRef.current || fromEngine || "0";
    const currentNum = parseInt(currentVal) || 0;
    const newVal = currentNum + 100;
    const displayValue = newVal.toString();
    const clamped = Math.max(0, Math.min(newVal, 6000));
    
    fromEngineValueRef.current = displayValue;
    setFromEngine(displayValue);
    setFromEngineWords(newVal > 0 ? `${newVal} cc` : "");
    setEngineRange(prev => ({ ...prev, min: clamped }));
    
    if (fromEngineInputRef.current) {
      fromEngineInputRef.current.setNativeProps({ text: displayValue });
    }
  };
  
  const decreaseFromEngine = () => {
    const currentVal = fromEngineValueRef.current || fromEngine || "0";
    const currentNum = parseInt(currentVal) || 0;
    const newVal = Math.max(0, currentNum - 100);
    const displayValue = newVal.toString();
    const clamped = Math.max(0, Math.min(newVal, 6000));
    
    fromEngineValueRef.current = displayValue;
    setFromEngine(displayValue);
    setFromEngineWords(newVal > 0 ? `${newVal} cc` : "");
    setEngineRange(prev => ({ ...prev, min: clamped }));
    
    if (fromEngineInputRef.current) {
      fromEngineInputRef.current.setNativeProps({ text: displayValue });
    }
  };
  
  const increaseToEngine = () => {
    const currentVal = toEngineValueRef.current || toEngine || "6000";
    const currentNum = parseInt(currentVal) || 6000;
    const newVal = currentNum + 100;
    const displayValue = newVal.toString();
    const clamped = Math.max(0, Math.min(newVal, 6000));
    
    toEngineValueRef.current = displayValue;
    setToEngine(displayValue);
    setToEngineWords(newVal > 0 ? `${newVal} cc` : "");
    setEngineRange(prev => ({ ...prev, max: clamped }));
    
    if (toEngineInputRef.current) {
      toEngineInputRef.current.setNativeProps({ text: displayValue });
    }
  };
  
  const decreaseToEngine = () => {
    const currentVal = toEngineValueRef.current || toEngine || "6000";
    const currentNum = parseInt(currentVal) || 6000;
    const newVal = Math.max(0, currentNum - 100);
    const displayValue = newVal.toString();
    const clamped = Math.max(0, Math.min(newVal, 6000));
    
    toEngineValueRef.current = displayValue;
    setToEngine(displayValue);
    setToEngineWords(newVal > 0 ? `${newVal} cc` : "");
    setEngineRange(prev => ({ ...prev, max: clamped }));
    
    if (toEngineInputRef.current) {
      toEngineInputRef.current.setNativeProps({ text: displayValue });
    }
  };

// Define types for the selection function
const toggleSelection = <T,>(option: T, setSelected: React.Dispatch<React.SetStateAction<T[]>>, selectedList: T[]) => {
  if (option === "All Cities" || option === "All Brands" || option === "All Colors") {
    // If "All" option is selected, clear all individual selections
    setSelected(selectedList.includes(option as string) ? [] : [option as string]);
  } else {
    // Otherwise, toggle individual selections
    if (selectedList.includes(option)) {
      setSelected(selectedList.filter((item) => item !== option));
    } else {
      setSelected([...selectedList, option]);
    }
  }
};

const FilterSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <View style={styles.filterSection}>
    <Text style={styles.sectionTitle}>{title}</Text>
    {children}
  </View>
);

  // Isolated Year Input Component - UNCONTROLLED to prevent keyboard close
  const YearInput = React.memo(({ 
    initialValue, 
    placeholder, 
    onBlur,
    valueRef,
    inputRef
  }: { 
    initialValue: string; 
    placeholder: string; 
    onBlur: (text: string) => void;
    valueRef?: React.MutableRefObject<string>;
    inputRef?: React.RefObject<TextInput>;
  }) => {
    const internalRef = useRef<TextInput>(null);
    const currentValueRef = useRef(initialValue);
    const finalRef = inputRef || internalRef;

    // Update internal ref when initialValue changes (e.g., on reset)
    useEffect(() => {
      currentValueRef.current = initialValue;
      if (finalRef.current) {
        finalRef.current.setNativeProps({ text: initialValue });
      }
    }, [initialValue]);

    return (
      <TextInput
        ref={finalRef}
        style={styles.simpleYearInput}
        keyboardType="number-pad"
        placeholder={placeholder}
        defaultValue={initialValue}
        onChangeText={(text) => {
          currentValueRef.current = text;
          // Update ref without causing re-render
          if (valueRef) {
            valueRef.current = text;
          }
        }}
        onBlur={() => {
          Keyboard.dismiss();
          onBlur(currentValueRef.current);
        }}
        blurOnSubmit={false}
        returnKeyType="done"
        editable={true}
        autoCorrect={false}
        autoCapitalize="none"
        textContentType="none"
        autoComplete="off"
        importantForAutofill="no"
      />
    );
  }, (prevProps, nextProps) => {
    // Only re-render if placeholder or inputRef changes, or if initialValue changes (for reset)
    return prevProps.placeholder === nextProps.placeholder &&
           prevProps.inputRef === nextProps.inputRef &&
           prevProps.initialValue === nextProps.initialValue;
  });

const handleReset = () => {
  setSelectedCities([]);
  setSelectedFuel([]);
  setSelectedExteriorColor([]);
  setSelectedBrands([]);
  setSelectedModels([]);
  setSelectedVariants([]);
  setSelectedBodyTypes([]);
  setSelectedRegistrationCities([]);
  setSelectedEngineCapacity([]);
  setEngineRange({ min: 0, max: 6000 });
  setFromEngine("0");
  setToEngine("6000");
  fromEngineValueRef.current = "0";
  toEngineValueRef.current = "6000";
  setFromEngineWords("");
  setToEngineWords("");
  setSelectedDriveMode([]);
  setSelectedPaymentMode([]);
  setSelectedTransmissions([]);
  setSelectedAssemblies([]);
  // Reset picker states
  setShowCityPicker(false);
  setCityQuery("");
  setShowBrandPicker(false);
  setBrandQuery("");
  setShowModelPicker(false);
  setModelQuery("");
  setShowVariantPicker(false);
  setVariantQuery("");
  setShowRegistrationCityPicker(false);
  setRegistrationCityQuery("");
  setShowBodyColorPicker(false);
  setBodyColorQuery("");
  setShowBodyColorOthersPage(false);
  setBodyColorOthersText("");
};

  // Reset filters when modal opens (refreshes page)
  useEffect(() => {
    if (visible) {
      // Reset all filters when modal opens
      setSelectedCities([]);
      setSelectedFuel([]);
      setSelectedExteriorColor([]);
      setSelectedBrands([]);
      setSelectedBodyTypes([]);
      setSelectedRegistrationCities([]);
      setSelectedEngineCapacity([]);
      setEngineRange({ min: 0, max: 6000 });
      setFromEngine("0");
      setToEngine("6000");
      fromEngineValueRef.current = "0";
      toEngineValueRef.current = "6000";
      setFromEngineWords("");
      setToEngineWords("");
      setSelectedDriveMode([]);
      setSelectedPaymentMode([]);
      setSelectedTransmissions([]);
      setSelectedAssemblies([]);
      setShowCityPicker(false);
      setCityQuery("");
      setShowBrandPicker(false);
      setBrandQuery("");
      setShowRegistrationCityPicker(false);
      setRegistrationCityQuery("");
      setShowBodyColorPicker(false);
      setBodyColorQuery("");
      setShowBodyColorOthersPage(false);
      setBodyColorOthersText("");
    }
  }, [visible]);
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

  const cities = [
  "All Cities", "Lahore", "Karachi", "Islamabad", "Rawalpindi", "Multan", 
  "Faisalabad", "Peshawar", "Quetta", "Sialkot", "Gujranwala", "Sargodha", 
  "Bahawalpur", "Sukkur", "Larkana", "Sheikhupura", "Rahim Yar Khan", "Gujrat",
  "Mardan", "Mingora", "Nawabshah", "Chiniot", "Kotri", "Kāmoke", "Hafizabad", "Kohat"
  ];

  // Comprehensive Pakistani Car Brands
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

  // Brand → Models mapping (same as used car filters)
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

  // Model → Variants mapping (same as used car filters)
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

  const bodyColors = [
  "All Colors", "White", "Black", "Red", "Blue", "Green", "Yellow", "Orange", 
  "Silver", "Gray", "Brown", "Purple", "Gold", "Beige", "Maroon", "Navy",
  "Pearl White", "Metallic Silver", "Champagne", "Bronze", "Copper", "Matte Black",
  "Carbon Fiber", "Chrome", "Titanium", "Gunmetal", "Others"
  ];

  // Filtered models based on selected brands (for stepper)
  const filteredModelsForBrands = useMemo(() => {
    const specificBrands = selectedBrands.filter(
      (b) => b !== "All Brands" && b.trim() !== ""
    );

    if (specificBrands.length === 0) {
      const allModels = new Set<string>();
      Object.values(brandToModelsMap).forEach((models) => {
        models.forEach((m) => {
          if (m && m.trim() !== "") allModels.add(m);
        });
      });
      return Array.from(allModels).sort();
    }

    const result = new Set<string>();
    specificBrands.forEach((brand) => {
      const trimmed = brand.trim();
      const key = Object.keys(brandToModelsMap).find(
        (k) => k === trimmed || k.toLowerCase() === trimmed.toLowerCase()
      );
      if (key && brandToModelsMap[key]) {
        brandToModelsMap[key].forEach((m) => {
          if (m && m.trim() !== "") result.add(m);
        });
      }
    });

    return Array.from(result).sort();
  }, [selectedBrands]);

  // Filtered variants based on selected models (for stepper)
  const filteredVariantsForModels = useMemo(() => {
    const specificModels = selectedModels.filter((m) => m.trim() !== "");

    if (specificModels.length === 0) {
      const allVariants = new Set<string>();
      Object.values(modelToVariantsMap).forEach((vars) => {
        vars.forEach((v) => {
          if (v && v.trim() !== "") allVariants.add(v);
        });
      });
      return Array.from(allVariants).sort();
    }

    const result = new Set<string>();
    specificModels.forEach((model) => {
      const trimmed = model.trim();
      if (modelToVariantsMap[trimmed]) {
        modelToVariantsMap[trimmed].forEach((v) => {
          if (v && v.trim() !== "") result.add(v);
        });
      }
    });

    return Array.from(result).sort();
  }, [selectedModels]);

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
            <Text style={styles.modalTitle}>Filters</Text>
            <TouchableOpacity onPress={handleReset}>
              <Text style={styles.resetText}>Reset</Text>
            </TouchableOpacity>
          </View>
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={true}>
            {/* City Filter - clickable row opens full-screen searchable, multi-select list */}
            <FilterSection title="City">
              <TouchableOpacity
                activeOpacity={0.9}
                style={styles.searchBox}
                onPress={() => {
                  setShowCityPicker(true);
                  setCityQuery("");
                }}
              >
                <Ionicons name="search" size={18} color="#999" style={{ marginRight: 6 }} />
                <Text style={styles.searchPlaceholder}>
                  Select cities
                </Text>
                <Ionicons name={'chevron-forward'} size={18} color="#999" />
              </TouchableOpacity>
              {/* Render current selections as chips */}
              {selectedCities.length > 0 && (
                <View style={styles.chipsContainer}>
                  {selectedCities.filter(city => city !== "All Cities").map((city, idx) => (
                    <View key={`${city}-${idx}`} style={styles.chip}>
                      <Text style={styles.chipText} numberOfLines={1}>{city}</Text>
                      <TouchableOpacity
                        style={styles.chipRemove}
                        onPress={() => setSelectedCities(selectedCities.filter(c => c !== city))}
                      >
                        <Ionicons name="close" size={14} color="#CD0100" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
            </FilterSection>

            {/* Brand / Model / Variant Flow - single entry point */}
            <FilterSection title="Brand Name">
              <TouchableOpacity
                activeOpacity={0.9}
                style={styles.searchBox}
                onPress={() => {
                  setShowBrandPicker(true);
                  setBrandQuery("");
                }}
              >
                <Ionicons name="search" size={18} color="#999" style={{ marginRight: 6 }} />
                <Text style={styles.searchPlaceholder}>
                  Select brand, model & variant
                </Text>
                <Ionicons name={'chevron-forward'} size={18} color="#999" />
              </TouchableOpacity>

              {/* Combined chip: Brand + Model + Variant (removable) */}
              {(selectedBrands.length > 0 ||
                selectedModels.length > 0 ||
                selectedVariants.length > 0) && (
                <View style={styles.chipsContainer}>
                  {(() => {
                    const primaryBrand =
                      selectedBrands.find(b => b !== "All Brands") || "";
                    const primaryModel =
                      selectedModels.find(m => m !== "All Models") || "";
                    const primaryVariants = selectedVariants.filter(
                      v => v !== "All Variants"
                    );

                    const parts = [
                      primaryBrand,
                      primaryModel,
                      primaryVariants.join(", "),
                    ].filter(Boolean);

                    if (parts.length === 0) return null;

                    const label = parts.join(" ");

                    return (
                      <View style={styles.chip}>
                        <Text style={styles.chipText} numberOfLines={1}>{label}</Text>
                        <TouchableOpacity
                          style={styles.chipRemove}
                          onPress={() => {
                            setSelectedBrands([]);
                            setSelectedModels([]);
                            setSelectedVariants([]);
                          }}
                        >
                          <Ionicons name="close" size={14} color="#CD0100" />
                        </TouchableOpacity>
                      </View>
                    );
                  })()}
                </View>
              )}
            </FilterSection>

            {/* Body Type */}
            <FilterSection title="Body Type">
              <ScrollView horizontal={true} showsHorizontalScrollIndicator={false} style={{ marginVertical: 5 }}>
                {[
                  "All Body Types",
                  "Hatchback",
                  "Sedan",
                  "SUV",
                  "Coupe",
                  "Convertible",
                  "Wagon",
                  "Pickup",
                  "Van",
                  "Jeep"
                ].map((type, index) => {
                  const isSelected = selectedBodyTypes.includes(type);
                  return (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.filterButton,
                        isSelected && styles.selectedFilter,
                        { marginRight: 10 }
                      ]}
                      onPress={() => toggleSelection(type, setSelectedBodyTypes, selectedBodyTypes)}
                    >
                      <Text style={[styles.filterButtonText, isSelected && styles.filterButtonTextSelected]}>
                        {type}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </FilterSection>

            {/* Registration City Filter - clickable row opens full-screen searchable, multi-select list */}
            <FilterSection title="Registration City">
              <TouchableOpacity
                activeOpacity={0.9}
                style={styles.searchBox}
                onPress={() => {
                  setShowRegistrationCityPicker(true);
                  setRegistrationCityQuery("");
                }}
              >
                <Ionicons name="search" size={18} color="#999" style={{ marginRight: 6 }} />
                <Text style={styles.searchPlaceholder}>
                  Select registration cities
                </Text>
                <Ionicons name={'chevron-forward'} size={18} color="#999" />
              </TouchableOpacity>
              {/* Render current selections as chips */}
              {selectedRegistrationCities.length > 0 && (
                <View style={styles.chipsContainer}>
                  {selectedRegistrationCities.filter(city => city !== "All Cities").map((city, idx) => (
                    <View key={`${city}-${idx}`} style={styles.chip}>
                      <Text style={styles.chipText} numberOfLines={1}>{city}</Text>
                      <TouchableOpacity
                        style={styles.chipRemove}
                        onPress={() => setSelectedRegistrationCities(selectedRegistrationCities.filter(c => c !== city))}
                      >
                        <Ionicons name="close" size={14} color="#CD0100" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
            </FilterSection>



            {/* Fuel Type Filter */}
            <FilterSection title="Fuel Type">
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.rowContainer}>
                {["Petrol", "Diesel", "Hybrid", "Electric", "Gas", "CNG", "LPG", "Hydrogen"].map((fuel, index) => {
                  const isSelected = selectedFuel.includes(fuel);
                  return (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.filterButton,
                        isSelected && styles.selectedFilter,
                      ]}
                      onPress={() => toggleSelection(fuel, setSelectedFuel, selectedFuel)}
                    >
                      <Text style={[styles.filterButtonText, isSelected && styles.filterButtonTextSelected]}>
                        {fuel}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </FilterSection>
            {/* Engine Capacity - Same design as Used Car filters */}
            <FilterSection title="Engine Capacity (CC)">
              <View>
                <View style={styles.simpleYearContainer}>
                  {/* FROM ENGINE with +/- buttons */}
                  <View>
                    <View style={styles.yearInputBox}>
                      <TouchableOpacity onPress={decreaseFromEngine} style={styles.yearButton}>
                        <Text style={styles.yearButtonText}>−</Text>
                      </TouchableOpacity>
                      <YearInput
                        key="from-engine-stable"
                        initialValue={fromEngine}
                        placeholder="0"
                        inputRef={fromEngineInputRef}
                        valueRef={fromEngineValueRef}
                        onBlur={(text) => {
                          Keyboard.dismiss();
                          const displayValue = text.trim() || "0";
                          const num = parseInt(displayValue) || 0;
                          const clamped = Math.max(0, Math.min(num, 6000));
                          fromEngineValueRef.current = displayValue;
                          setFromEngine(displayValue);
                          setFromEngineWords(num > 0 ? `${num} cc` : "");
                          setEngineRange(prev => ({ ...prev, min: clamped }));
                        }}
                      />
                      <TouchableOpacity onPress={increaseFromEngine} style={styles.yearButton}>
                        <Text style={styles.yearButtonText}>＋</Text>
                      </TouchableOpacity>
                    </View>
                    {fromEngineWords ? (
                      <Text style={styles.convertedText}>{fromEngineWords}</Text>
                    ) : null}
                  </View>
                  <Text style={styles.simpleYearToText}>to</Text>
                  {/* TO ENGINE with +/- buttons */}
                  <View>
                    <View style={styles.yearInputBox}>
                      <TouchableOpacity onPress={decreaseToEngine} style={styles.yearButton}>
                        <Text style={styles.yearButtonText}>−</Text>
                      </TouchableOpacity>
                      <YearInput
                        key="to-engine-stable"
                        initialValue={toEngine}
                        placeholder="6000"
                        inputRef={toEngineInputRef}
                        valueRef={toEngineValueRef}
                        onBlur={(text) => {
                          Keyboard.dismiss();
                          const displayValue = text.trim() || "6000";
                          const num = parseInt(displayValue) || 6000;
                          const clamped = Math.max(0, Math.min(num, 6000));
                          toEngineValueRef.current = displayValue;
                          setToEngine(displayValue);
                          setToEngineWords(num > 0 ? `${num} cc` : "");
                          setEngineRange(prev => ({ ...prev, max: clamped }));
                        }}
                      />
                      <TouchableOpacity onPress={increaseToEngine} style={styles.yearButton}>
                        <Text style={styles.yearButtonText}>＋</Text>
                      </TouchableOpacity>
                    </View>
                    {toEngineWords ? (
                      <Text style={styles.convertedText}>{toEngineWords}</Text>
                    ) : null}
                  </View>
                </View>
              </View>
            </FilterSection>

            {/* Body Color Filter - clickable row opens full-screen searchable, multi-select list */}
            <FilterSection title="Body Color">
              <TouchableOpacity
                activeOpacity={0.9}
                style={styles.searchBox}
                onPress={() => {
                  setShowBodyColorPicker(true);
                  setBodyColorQuery("");
                }}
              >
                <Ionicons name="search" size={18} color="#999" style={{ marginRight: 6 }} />
                <Text style={styles.searchPlaceholder}>
                  Select body colors
                </Text>
                <Ionicons name={'chevron-forward'} size={18} color="#999" />
              </TouchableOpacity>
              {/* Render current selections as chips */}
              {selectedExteriorColor.length > 0 && (
                <View style={styles.chipsContainer}>
                  {selectedExteriorColor.filter(color => color !== "All Colors").map((color, idx) => (
                    <View key={`${color}-${idx}`} style={styles.chip}>
                      <Text style={styles.chipText} numberOfLines={1}>{color}</Text>
                      <TouchableOpacity
                        style={styles.chipRemove}
                        onPress={() => setSelectedExteriorColor(selectedExteriorColor.filter(c => c !== color))}
                      >
                        <Ionicons name="close" size={14} color="#CD0100" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
            </FilterSection>

            {/* Car Drive Mode */}
            <FilterSection title="Car Drive Mode">
              <ScrollView horizontal={true} showsHorizontalScrollIndicator={false} style={{ marginVertical: 5 }}>
                {["Driver", "Self Drive"].map((trans, index) => {
                  const isSelected = selectedDriveMode.includes(trans);
                  return (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.filterButton,
                        isSelected && styles.selectedFilter,
                        { marginRight: 10 }
                      ]}
                      onPress={() => toggleSelection(trans, setSelectedDriveMode, selectedDriveMode)}
                    >
                      <Text style={[styles.filterButtonText, isSelected && styles.filterButtonTextSelected]}>
                        {trans}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </FilterSection>

            {/* Payment Type */}
            <FilterSection title="Payment Type">
              <ScrollView horizontal={true} showsHorizontalScrollIndicator={false} style={{ marginVertical: 5 }}>
                {["Advance", "Security"].map((trans, index) => {
                  const isSelected = selectedPaymentMode.includes(trans);
                  return (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.filterButton,
                        isSelected && styles.selectedFilter,
                        { marginRight: 10 }
                      ]}
                      onPress={() => toggleSelection(trans, setSelectedPaymentMode, selectedPaymentMode)}
                    >
                      <Text style={[styles.filterButtonText, isSelected && styles.filterButtonTextSelected]}>
                        {trans}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </FilterSection>

            {/* Transmission */}
            <FilterSection title="Transmission">
              <ScrollView horizontal={true} showsHorizontalScrollIndicator={false} style={{ marginVertical: 5 }}>
                {["All", "Auto", "Manual"].map((trans, index) => {
                  const isSelected = selectedTransmissions.includes(trans);
                  return (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.filterButton,
                        isSelected && styles.selectedFilter,
                        { marginRight: 10 }
                      ]}
                      onPress={() => toggleSelection(trans, setSelectedTransmissions, selectedTransmissions)}
                    >
                      <Text style={[styles.filterButtonText, isSelected && styles.filterButtonTextSelected]}>
                        {trans}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </FilterSection>

            {/* Assembly */}
            <FilterSection title="Assembly">
              <ScrollView horizontal={true} showsHorizontalScrollIndicator={false} style={{ marginVertical: 5 }}>
                {["All", "Local", "Imported"].map((type, index) => {
                  const isSelected = selectedAssemblies.includes(type);
                  return (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.filterButton,
                        isSelected && styles.selectedFilter,
                        { marginRight: 10 }
                      ]}
                      onPress={() => toggleSelection(type, setSelectedAssemblies, selectedAssemblies)}
                    >
                      <Text style={[styles.filterButtonText, isSelected && styles.filterButtonTextSelected]}>
                        {type}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </FilterSection>

          </ScrollView>
          </TouchableWithoutFeedback>

          {/* Fixed Bottom Button */}
          <View style={styles.bottomContainer}>
            <TouchableOpacity
              style={styles.applyButton}
              onPress={() => {
                onApplyFilters({
                  cities: selectedCities,
                  fuelTypes: selectedFuel,
                  engineCapacities: selectedEngineCapacity,
                  colors: selectedExteriorColor,
                  brands: selectedBrands,
                  models: selectedModels,
                  variants: selectedVariants,
                  bodyTypes: selectedBodyTypes,
                  transmissions: selectedTransmissions,
                  assemblies: selectedAssemblies,
                  registrationCities: selectedRegistrationCities,
                  drivingtype: selectedDriveMode,
                  paymenttype: selectedPaymentMode,
                });
                onClose();
              }}
            >
              <Text style={styles.applyButtonText}>Apply Filters</Text>
            </TouchableOpacity>
          </View>

          {/* Full-screen City overlay */}
          {showCityPicker && (
            <View style={styles.overlayFull}>
              <View style={styles.fullPageHeader}>
                <TouchableOpacity onPress={() => { Keyboard.dismiss(); setShowCityPicker(false); setCityQuery(""); }}>
                  <Ionicons name="arrow-back" size={22} color="#333" />
                </TouchableOpacity>
                <Text style={styles.fullPageTitle}>Select Cities</Text>
                <View style={{ width: 22 }} />
              </View>

              <View style={[styles.searchBox, { marginHorizontal: 16, marginBottom: 10 }]}> 
                <Ionicons name="search" size={18} color="#999" style={{ marginRight: 6 }} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Type to search"
                  placeholderTextColor="#999"
                  value={cityQuery}
                  onChangeText={setCityQuery}
                  autoFocus
                  blurOnSubmit
                  returnKeyType="search"
                  onSubmitEditing={() => Keyboard.dismiss()}
                />
              </View>

              <ScrollView style={{ flex: 1, marginHorizontal: 16 }} keyboardShouldPersistTaps="always">
                {(cityQuery
                  ? cities.filter(c => c.toLowerCase().includes(cityQuery.toLowerCase()))
                  : cities
                ).map((c, idx) => {
                  const selected = selectedCities.includes(c);
                  return (
                    <TouchableOpacity
                      key={`${c}-${idx}`}
                      style={[styles.categoryRow, selected && styles.categoryRowSelected]}
                      onPress={() => toggleSelection(c, setSelectedCities, selectedCities)}
                    >
                      <Text style={[styles.categoryLabel, selected && styles.categoryLabelSelected]}>{c}</Text>
                      <Ionicons name={selected ? 'checkbox' : 'square-outline'} size={20} color={selected ? '#CD0100' : '#999'} />
                    </TouchableOpacity>
                  )
                })}
              </ScrollView>

              <View style={[styles.bottomButtonContainer, { paddingBottom: Platform.OS === 'ios' ? 20 : 16 }]}>
                <TouchableOpacity
                  style={styles.resultButton}
                  activeOpacity={0.8}
                  onPress={() => { Keyboard.dismiss(); setShowCityPicker(false); setCityQuery(""); }}
                >
                  <Text style={styles.resultButtonText}>Done</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Full-screen Brand overlay (step 1: brand) */}
          {showBrandPicker && (
            <View style={styles.overlayFull}>
              <View style={styles.fullPageHeader}>
                <TouchableOpacity onPress={() => { Keyboard.dismiss(); setShowBrandPicker(false); setBrandQuery(""); }}>
                  <Ionicons name="arrow-back" size={22} color="#333" />
                </TouchableOpacity>
                <Text style={styles.fullPageTitle}>Select Brand</Text>
                <View style={{ width: 22 }} />
              </View>

              <View style={[styles.searchBox, { marginHorizontal: 16, marginBottom: 10 }]}> 
                <Ionicons name="search" size={18} color="#999" style={{ marginRight: 6 }} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Type to search"
                  placeholderTextColor="#999"
                  value={brandQuery}
                  onChangeText={setBrandQuery}
                  autoFocus
                  blurOnSubmit
                  returnKeyType="search"
                  onSubmitEditing={() => Keyboard.dismiss()}
                />
              </View>

              <ScrollView style={{ flex: 1, marginHorizontal: 16 }} keyboardShouldPersistTaps="always">
                {(brandQuery
                  ? brands.filter(b => b.toLowerCase().includes(brandQuery.toLowerCase()))
                  : brands
                ).map((b, idx) => {
                  const selected = selectedBrands.includes(b);
                  return (
                    <TouchableOpacity
                      key={`${b}-${idx}`}
                      style={[styles.categoryRow, selected && styles.categoryRowSelected]}
                      onPress={() => {
                        // "All Brands" behaves exclusively
                        if (b === "All Brands") {
                          setSelectedBrands(
                            selectedBrands.includes("All Brands") ? [] : ["All Brands"]
                          );
                          setSelectedModels([]);
                          setSelectedVariants([]);
                        } else {
                          const withoutAll = selectedBrands.filter(x => x !== "All Brands");
                          const exists = withoutAll.includes(b);
                          const updated = exists
                            ? withoutAll.filter(x => x !== b)
                            : [...withoutAll, b];
                          setSelectedBrands(updated);
                          // Brand change → clear models & variants
                          setSelectedModels([]);
                          setSelectedVariants([]);
                        }
                      }}
                    >
                      <Text style={[styles.categoryLabel, selected && styles.categoryLabelSelected]}>{b}</Text>
                      <Ionicons name={selected ? 'checkbox' : 'square-outline'} size={20} color={selected ? '#CD0100' : '#999'} />
                    </TouchableOpacity>
                  )
                })}
              </ScrollView>

              <View style={[styles.bottomButtonContainer, { paddingBottom: Platform.OS === 'ios' ? 20 : 16 }]}>
                <TouchableOpacity
                  style={styles.resultButton}
                  activeOpacity={0.8}
                  onPress={() => { 
                    Keyboard.dismiss(); 
                    setShowBrandPicker(false); 
                    setBrandQuery(""); 
                    // After choosing brand, open model picker
                    setShowModelPicker(true);
                    setModelQuery("");
                  }}
                >
                  <Text style={styles.resultButtonText}>Next: Select Model</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Full-screen Model overlay (step 2: model) */}
          {showModelPicker && (
            <View style={styles.overlayFull}>
              <View style={styles.fullPageHeader}>
                <TouchableOpacity onPress={() => { Keyboard.dismiss(); setShowModelPicker(false); setModelQuery(""); }}>
                  <Ionicons name="arrow-back" size={22} color="#333" />
                </TouchableOpacity>
                <Text style={styles.fullPageTitle}>Select Model</Text>
                <View style={{ width: 22 }} />
              </View>

              <View style={[styles.searchBox, { marginHorizontal: 16, marginBottom: 10 }]}> 
                <Ionicons name="search" size={18} color="#999" style={{ marginRight: 6 }} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Type to search"
                  placeholderTextColor="#999"
                  value={modelQuery}
                  onChangeText={setModelQuery}
                  autoFocus
                  blurOnSubmit
                  returnKeyType="search"
                  onSubmitEditing={() => Keyboard.dismiss()}
                />
              </View>

              <ScrollView style={{ flex: 1, marginHorizontal: 16 }} keyboardShouldPersistTaps="always">
                {(
                  modelQuery
                    ? filteredModelsForBrands.filter(m =>
                        m.toLowerCase().includes(modelQuery.toLowerCase())
                      )
                    : filteredModelsForBrands
                ).map((m, idx) => {
                  const selected = selectedModels.includes(m);
                  return (
                    <TouchableOpacity
                      key={`${m}-${idx}`}
                      style={[styles.categoryRow, selected && styles.categoryRowSelected]}
                      onPress={() => {
                        const exists = selectedModels.includes(m);
                        setSelectedModels(
                          exists
                            ? selectedModels.filter(x => x !== m)
                            : [...selectedModels, m]
                        );
                        // Model change → clear variants
                        setSelectedVariants([]);
                      }}
                    >
                      <Text style={[styles.categoryLabel, selected && styles.categoryLabelSelected]}>{m}</Text>
                      <Ionicons name={selected ? 'checkbox' : 'square-outline'} size={20} color={selected ? '#CD0100' : '#999'} />
                    </TouchableOpacity>
                  )
                })}
              </ScrollView>

              <View style={[styles.bottomButtonContainer, { paddingBottom: Platform.OS === 'ios' ? 20 : 16 }]}>
                <TouchableOpacity
                  style={styles.resultButton}
                  activeOpacity={0.8}
                  onPress={() => { 
                    Keyboard.dismiss(); 
                    setShowModelPicker(false); 
                    setModelQuery(""); 
                    // After choosing model, open variant picker
                    setShowVariantPicker(true);
                    setVariantQuery("");
                  }}
                >
                  <Text style={styles.resultButtonText}>Next: Select Variant</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Full-screen Variant overlay (step 3: variant) */}
          {showVariantPicker && (
            <View style={styles.overlayFull}>
              <View style={styles.fullPageHeader}>
                <TouchableOpacity onPress={() => { Keyboard.dismiss(); setShowVariantPicker(false); setVariantQuery(""); }}>
                  <Ionicons name="arrow-back" size={22} color="#333" />
                </TouchableOpacity>
                <Text style={styles.fullPageTitle}>Select Variant</Text>
                <View style={{ width: 22 }} />
              </View>

              <View style={[styles.searchBox, { marginHorizontal: 16, marginBottom: 10 }]}>
                <Ionicons name="search" size={18} color="#999" style={{ marginRight: 6 }} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Type to search"
                  placeholderTextColor="#999"
                  value={variantQuery}
                  onChangeText={setVariantQuery}
                  autoFocus
                  blurOnSubmit
                  returnKeyType="search"
                  onSubmitEditing={() => Keyboard.dismiss()}
                />
              </View>

              <ScrollView style={{ flex: 1, marginHorizontal: 16 }} keyboardShouldPersistTaps="always">
                {(
                  variantQuery
                    ? filteredVariantsForModels.filter(v =>
                        v.toLowerCase().includes(variantQuery.toLowerCase())
                      )
                    : filteredVariantsForModels
                ).map((v, idx) => {
                  const selected = selectedVariants.includes(v);
                  return (
                    <TouchableOpacity
                      key={`${v}-${idx}`}
                      style={[styles.categoryRow, selected && styles.categoryRowSelected]}
                      onPress={() => toggleSelection(v, setSelectedVariants, selectedVariants)}
                    >
                      <Text style={[styles.categoryLabel, selected && styles.categoryLabelSelected]}>{v}</Text>
                      <Ionicons name={selected ? 'checkbox' : 'square-outline'} size={20} color={selected ? '#CD0100' : '#999'} />
                    </TouchableOpacity>
                  )
                })}
              </ScrollView>

              <View style={[styles.bottomButtonContainer, { paddingBottom: Platform.OS === 'ios' ? 20 : 16 }]}>
                <TouchableOpacity
                  style={styles.resultButton}
                  activeOpacity={0.8}
                  onPress={() => { Keyboard.dismiss(); setShowVariantPicker(false); setVariantQuery(""); }}
                >
                  <Text style={styles.resultButtonText}>Done</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Full-screen Registration City overlay */}
          {showRegistrationCityPicker && (
            <View style={styles.overlayFull}>
              <View style={styles.fullPageHeader}>
                <TouchableOpacity onPress={() => { Keyboard.dismiss(); setShowRegistrationCityPicker(false); setRegistrationCityQuery(""); }}>
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

              <View style={[styles.bottomButtonContainer, { paddingBottom: Platform.OS === 'ios' ? 20 : 16 }]}>
                <TouchableOpacity
                  style={styles.resultButton}
                  activeOpacity={0.8}
                  onPress={() => { Keyboard.dismiss(); setShowRegistrationCityPicker(false); setRegistrationCityQuery(""); }}
                >
                  <Text style={styles.resultButtonText}>Done</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Full-screen Body Color overlay */}
          {showBodyColorPicker && (
            <View style={styles.overlayFull}>
              <View style={styles.fullPageHeader}>
                <TouchableOpacity onPress={() => { Keyboard.dismiss(); setShowBodyColorPicker(false); setBodyColorQuery(""); }}>
                  <Ionicons name="arrow-back" size={22} color="#333" />
                </TouchableOpacity>
                <Text style={styles.fullPageTitle}>Select Body Colors</Text>
                <View style={{ width: 22 }} />
              </View>

              <View style={[styles.searchBox, { marginHorizontal: 16, marginBottom: 10 }]}> 
                <Ionicons name="search" size={18} color="#999" style={{ marginRight: 6 }} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Type to search"
                  placeholderTextColor="#999"
                  value={bodyColorQuery}
                  onChangeText={setBodyColorQuery}
                  autoFocus
                  blurOnSubmit
                  returnKeyType="search"
                  onSubmitEditing={() => Keyboard.dismiss()}
                />
              </View>

              <ScrollView style={{ flex: 1, marginHorizontal: 16 }} keyboardShouldPersistTaps="always">
                {(bodyColorQuery
                  ? bodyColors.filter(c => c.toLowerCase().includes(bodyColorQuery.toLowerCase()) && c !== "Others")
                  : bodyColors.filter(c => c !== "Others")
                ).map((c, idx) => {
                  const selected = selectedExteriorColor.includes(c);
                  return (
                    <TouchableOpacity
                      key={`${c}-${idx}`}
                      style={[styles.categoryRow, selected && styles.categoryRowSelected]}
                      onPress={() => toggleSelection(c, setSelectedExteriorColor, selectedExteriorColor)}
                    >
                      <Text style={[styles.categoryLabel, selected && styles.categoryLabelSelected]}>{c}</Text>
                      <Ionicons name={selected ? 'checkbox' : 'square-outline'} size={20} color={selected ? '#CD0100' : '#999'} />
                    </TouchableOpacity>
                  )
                })}
                
                {/* Others option - opens new page */}
                <TouchableOpacity
                  style={styles.categoryRow}
                  onPress={() => {
                    setShowBodyColorOthersPage(true);
                    setBodyColorOthersText("");
                  }}
                >
                  <Text style={styles.categoryLabel}>Others</Text>
                  <Ionicons name={'chevron-forward'} size={20} color="#999" />
                </TouchableOpacity>
              </ScrollView>

              <View style={[styles.bottomButtonContainer, { paddingBottom: Platform.OS === 'ios' ? 20 : 16 }]}>
                <TouchableOpacity
                  style={styles.resultButton}
                  activeOpacity={0.8}
                  onPress={() => { Keyboard.dismiss(); setShowBodyColorPicker(false); setBodyColorQuery(""); }}
                >
                  <Text style={styles.resultButtonText}>Done</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Body Color Others Page - separate full-screen page */}
          {showBodyColorOthersPage && (
            <View style={styles.overlayFull}>
              <View style={styles.fullPageHeader}>
                <TouchableOpacity onPress={() => { 
                  Keyboard.dismiss(); 
                  setShowBodyColorOthersPage(false);
                  setBodyColorOthersText("");
                }}>
                  <Ionicons name="arrow-back" size={22} color="#333" />
                </TouchableOpacity>
                <Text style={styles.fullPageTitle}>Add Custom Color</Text>
                <View style={{ width: 22 }} />
              </View>

              <KeyboardAvoidingView 
                style={styles.keyboardAvoidingView}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
              >
                <View style={styles.othersPageContainer}>
                  <Text style={styles.othersPageLabel}>Enter color name:</Text>
                  <TextInput
                    style={styles.othersPageInput}
                    placeholder="e.g. Sky Blue, Mint Green, Burgundy, etc."
                    placeholderTextColor="#999"
                    value={bodyColorOthersText}
                    onChangeText={setBodyColorOthersText}
                    autoFocus
                    returnKeyType="done"
                    onSubmitEditing={() => {
                      if (bodyColorOthersText.trim()) {
                        const customColor = bodyColorOthersText.trim();
                        if (!selectedExteriorColor.includes(customColor)) {
                          setSelectedExteriorColor([...selectedExteriorColor, customColor]);
                        }
                        setBodyColorOthersText("");
                        setShowBodyColorOthersPage(false);
                        Keyboard.dismiss();
                      }
                    }}
                    blurOnSubmit={true}
                  />
                  
                  <TouchableOpacity
                    style={[styles.addOthersPageButton, !bodyColorOthersText.trim() && styles.addOthersPageButtonDisabled]}
                    onPress={() => {
                      if (bodyColorOthersText.trim()) {
                        const customColor = bodyColorOthersText.trim();
                        if (!selectedExteriorColor.includes(customColor)) {
                          setSelectedExteriorColor([...selectedExteriorColor, customColor]);
                        }
                        setBodyColorOthersText("");
                        setShowBodyColorOthersPage(false);
                        Keyboard.dismiss();
                      }
                    }}
                    disabled={!bodyColorOthersText.trim()}
                  >
                    <Text style={styles.addOthersPageButtonText}>Add Color</Text>
                  </TouchableOpacity>
                </View>
              </KeyboardAvoidingView>
            </View>
          )}
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
    position: 'relative',
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
    flexDirection: "row",
    marginTop: 5,
  },
  filterButton: {
    padding: 10,
    backgroundColor: "#eee",
    borderRadius: 10,
    marginRight: 10,
    borderWidth: 1,
    borderColor: "transparent",
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  selectedFilter: {
    borderColor: "#CD0100",
    backgroundColor: '#CD0100',
  },
  filterButtonTextSelected: {
    color: '#fff',
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
  colorOptionRow: {
    flexDirection: "row", 
    alignItems: "center",
    padding: 10,
    borderRadius: 10,
    marginRight: 10,
    borderWidth: 2,
    borderColor: "transparent", // Default no border
  },
  
  colorOption: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#eee", // Light gray container
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 2,
    borderColor: "transparent", // No border by default
  },
  
  colorName: {
    fontSize: 14,
    marginRight: 8,
  },
  
  colorBox: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ccc",
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  chipText: {
    color: '#333',
    fontSize: 13,
    fontWeight: '500',
    marginRight: 6,
    flexShrink: 1,
  },
  chipRemove: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
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
  searchInput: {
    flex: 1,
    color: '#333',
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
  fullPageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee'
  },
  fullPageTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333'
  },
  overlayFull: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#fff',
    zIndex: 999,
    elevation: 10,
  },
  rangeBoxesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  rangeBox: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  rangeBoxText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
  },
  toText: {
    marginHorizontal: 12,
    color: '#666',
    fontSize: 14,
    fontWeight: '500',
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
  multiThumb: {
    backgroundColor: '#CD0100',
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  simpleYearContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
    justifyContent: 'center',
  },
  yearInputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 4,
    width: 160,
    height: 45,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  simpleYearInput: {
    flex: 1,
    padding: 0,
    fontSize: 15,
    color: '#333',
    backgroundColor: 'transparent',
    textAlign: 'center',
    minWidth: 55,
    fontWeight: '500',
  },
  yearButton: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    minWidth: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
  },
  yearButtonText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#666',
  },
  simpleYearToText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  convertedText: {
    fontSize: 14,
    color: '#4CAF50', // Green color
    fontWeight: '500',
    marginTop: 4,
    textAlign: 'center',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  othersPageContainer: {
    flex: 1,
    padding: 20,
    paddingTop: 40,
    justifyContent: 'flex-start',
  },
  othersPageLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 20,
    marginTop: 20,
    textAlign: 'center',
  },
  othersPageInput: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#CD0100',
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    fontSize: 18,
    color: '#333',
    marginBottom: 20,
    minHeight: 56,
    textAlignVertical: 'center',
    textAlign: 'center',
  },
  addOthersPageButton: {
    backgroundColor: '#CD0100',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
  },
  addOthersPageButtonDisabled: {
    backgroundColor: '#ccc',
    opacity: 0.6,
  },
  addOthersPageButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  bottomButtonContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  resultButton: {
    backgroundColor: "#CD0100",
    paddingVertical: Platform.OS === 'ios' ? 16 : 14,
    paddingHorizontal: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    minHeight: Platform.OS === 'ios' ? 50 : 48,
    width: '100%',
    shadowColor: Platform.OS === 'ios' ? '#000' : undefined,
    shadowOffset: Platform.OS === 'ios' ? { width: 0, height: 2 } : undefined,
    shadowOpacity: Platform.OS === 'ios' ? 0.25 : undefined,
    shadowRadius: Platform.OS === 'ios' ? 3.84 : undefined,
    elevation: Platform.OS === 'android' ? 5 : 0,
  },
  resultButtonText: {
    color: "#fff",
    fontSize: Platform.OS === 'ios' ? 17 : 16,
    fontWeight: "600",
  },
});

export default RentalFilterModal;
