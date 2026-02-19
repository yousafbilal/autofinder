import React, { useState, useRef, useCallback, useEffect, useMemo } from "react";
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
  KeyboardAvoidingView,
  Platform,
  PanResponder,
  Animated,
  TouchableWithoutFeedback,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import MultiSlider from "@ptomasroos/react-native-multi-slider";
import { rf, rp, createResponsiveStyleSheet, isAndroid } from "../../utils/responsive";

interface FilterModalProps {
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

const FilterModal = ({ visible, onClose, onApplyFilters }: FilterModalProps) => {
  // Basic Filter States
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [selectedModels, setSelectedModels] = useState<string[]>([]);
  const [selectedVariants, setSelectedVariants] = useState<string[]>([]);
  const [yearRange, setYearRange] = useState({ min: 1970, max: new Date().getFullYear() });
  const [fromYear, setFromYear] = useState("1970");
  const [toYear, setToYear] = useState(new Date().getFullYear().toString());
  
  // Refs for year inputs to update from buttons
  const fromYearInputRef = useRef<TextInput>(null);
  const toYearInputRef = useRef<TextInput>(null);
  // Refs to store current values without causing re-renders
  const fromYearValueRef = useRef("1970");
  const toYearValueRef = useRef(new Date().getFullYear().toString());
  
  // Increase/decrease functions - read current value from input and increment/decrement
  const increaseFromYear = () => {
    // Get current value from ref (what user typed)
    const currentVal = fromYearValueRef.current || fromYear || "1970";
    const currentNum = parseInt(currentVal) || 1970;
    // Increment from current value (don't clamp display, only clamp for filter)
    const newVal = currentNum + 1;
    const displayValue = newVal.toString();
    const clamped = Math.max(1970, Math.min(newVal, new Date().getFullYear()));
    
    // Update ref and state with incremented value
    fromYearValueRef.current = displayValue;
    setFromYear(displayValue);
    // Use clamped value for filter range
    setYearRange(prev => ({ ...prev, min: clamped }));
    
    // Update input display with incremented value
    if (fromYearInputRef.current) {
      fromYearInputRef.current.setNativeProps({ text: displayValue });
    }
  };
  
  const decreaseFromYear = () => {
    // Get current value from ref (what user typed)
    const currentVal = fromYearValueRef.current || fromYear || "1970";
    const currentNum = parseInt(currentVal) || 1970;
    // Decrement from current value (don't clamp display, only clamp for filter)
    const newVal = currentNum - 1;
    const displayValue = newVal.toString();
    const clamped = Math.max(1970, Math.min(newVal, new Date().getFullYear()));
    
    // Update ref and state with decremented value
    fromYearValueRef.current = displayValue;
    setFromYear(displayValue);
    // Use clamped value for filter range
    setYearRange(prev => ({ ...prev, min: clamped }));
    
    // Update input display with decremented value
    if (fromYearInputRef.current) {
      fromYearInputRef.current.setNativeProps({ text: displayValue });
    }
  };
  
  const increaseToYear = () => {
    // Get current value from ref (what user typed)
    const currentVal = toYearValueRef.current || toYear || new Date().getFullYear().toString();
    const currentNum = parseInt(currentVal) || new Date().getFullYear();
    // Increment from current value (don't clamp display, only clamp for filter)
    const newVal = currentNum + 1;
    const displayValue = newVal.toString();
    const currentYear = new Date().getFullYear();
    const clamped = Math.max(1970, Math.min(newVal, currentYear));
    
    // Update ref and state with incremented value
    toYearValueRef.current = displayValue;
    setToYear(displayValue);
    // Use clamped value for filter range
    setYearRange(prev => ({ ...prev, max: clamped }));
    
    // Update input display with incremented value
    if (toYearInputRef.current) {
      toYearInputRef.current.setNativeProps({ text: displayValue });
    }
  };
  
  const decreaseToYear = () => {
    // Get current value from ref (what user typed)
    const currentVal = toYearValueRef.current || toYear || new Date().getFullYear().toString();
    const currentNum = parseInt(currentVal) || new Date().getFullYear();
    // Decrement from current value (don't clamp display, only clamp for filter)
    const newVal = currentNum - 1;
    const displayValue = newVal.toString();
    const currentYear = new Date().getFullYear();
    const clamped = Math.max(1970, Math.min(newVal, currentYear));
    
    // Update ref and state with decremented value
    toYearValueRef.current = displayValue;
    setToYear(displayValue);
    // Use clamped value for filter range
    setYearRange(prev => ({ ...prev, max: clamped }));
    
    // Update input display with decremented value
    if (toYearInputRef.current) {
      toYearInputRef.current.setNativeProps({ text: displayValue });
    }
  };
  
  // Increase/decrease functions for Kilometers - same as Model Year
  const increaseFromKm = () => {
    const currentVal = fromKmValueRef.current || fromKm || "0";
    const currentNum = parseInt(currentVal) || 0;
    const newVal = currentNum + 1000;
    const displayValue = newVal.toString();
    const clamped = Math.max(0, Math.min(newVal, 500000));
    
    fromKmValueRef.current = displayValue;
    setFromKm(displayValue);
    setFromKmWords(numberToWords(newVal));
    setKmRange(prev => ({ ...prev, min: clamped }));
    
    if (fromKmInputRef.current) {
      fromKmInputRef.current.setNativeProps({ text: displayValue });
    }
  };
  
  const decreaseFromKm = () => {
    const currentVal = fromKmValueRef.current || fromKm || "0";
    const currentNum = parseInt(currentVal) || 0;
    const newVal = Math.max(0, currentNum - 1000);
    const displayValue = newVal.toString();
    const clamped = Math.max(0, Math.min(newVal, 500000));
    
    fromKmValueRef.current = displayValue;
    setFromKm(displayValue);
    setFromKmWords(numberToWords(newVal));
    setKmRange(prev => ({ ...prev, min: clamped }));
    
    if (fromKmInputRef.current) {
      fromKmInputRef.current.setNativeProps({ text: displayValue });
    }
  };
  
  const increaseToKm = () => {
    const currentVal = toKmValueRef.current || toKm || "500000";
    const currentNum = parseInt(currentVal) || 500000;
    const newVal = currentNum + 1000;
    const displayValue = newVal.toString();
    const clamped = Math.max(0, Math.min(newVal, 500000));
    
    toKmValueRef.current = displayValue;
    setToKm(displayValue);
    setToKmWords(numberToWords(newVal));
    setKmRange(prev => ({ ...prev, max: clamped }));
    
    if (toKmInputRef.current) {
      toKmInputRef.current.setNativeProps({ text: displayValue });
    }
  };
  
  const decreaseToKm = () => {
    const currentVal = toKmValueRef.current || toKm || "500000";
    const currentNum = parseInt(currentVal) || 500000;
    const newVal = Math.max(0, currentNum - 1000);
    const displayValue = newVal.toString();
    const clamped = Math.max(0, Math.min(newVal, 500000));
    
    toKmValueRef.current = displayValue;
    setToKm(displayValue);
    setToKmWords(numberToWords(newVal));
    setKmRange(prev => ({ ...prev, max: clamped }));
    
    if (toKmInputRef.current) {
      toKmInputRef.current.setNativeProps({ text: displayValue });
    }
  };
  
  // Increase/decrease functions for Price - same as Model Year
  const increaseFromPrice = () => {
    const currentVal = fromPriceValueRef.current || fromPrice || "0";
    const currentNum = parseInt(currentVal) || 0;
    const newVal = currentNum + 100000;
    const displayValue = newVal.toString();
    const clamped = Math.max(0, Math.min(newVal, 50000000));
    
    fromPriceValueRef.current = displayValue;
    setFromPrice(displayValue);
    setFromPriceWords(numberToWords(newVal));
    setPriceRange(prev => ({ ...prev, min: clamped }));
    
    if (fromPriceInputRef.current) {
      fromPriceInputRef.current.setNativeProps({ text: displayValue });
    }
  };
  
  const decreaseFromPrice = () => {
    const currentVal = fromPriceValueRef.current || fromPrice || "0";
    const currentNum = parseInt(currentVal) || 0;
    const newVal = Math.max(0, currentNum - 100000);
    const displayValue = newVal.toString();
    const clamped = Math.max(0, Math.min(newVal, 50000000));
    
    fromPriceValueRef.current = displayValue;
    setFromPrice(displayValue);
    setFromPriceWords(numberToWords(newVal));
    setPriceRange(prev => ({ ...prev, min: clamped }));
    
    if (fromPriceInputRef.current) {
      fromPriceInputRef.current.setNativeProps({ text: displayValue });
    }
  };
  
  const increaseToPrice = () => {
    const currentVal = toPriceValueRef.current || toPrice || "50000000";
    const currentNum = parseInt(currentVal) || 50000000;
    const newVal = currentNum + 100000;
    const displayValue = newVal.toString();
    const clamped = Math.max(0, Math.min(newVal, 50000000));
    
    toPriceValueRef.current = displayValue;
    setToPrice(displayValue);
    setToPriceWords(numberToWords(newVal));
    setPriceRange(prev => ({ ...prev, max: clamped }));
    
    if (toPriceInputRef.current) {
      toPriceInputRef.current.setNativeProps({ text: displayValue });
    }
  };
  
  const decreaseToPrice = () => {
    const currentVal = toPriceValueRef.current || toPrice || "50000000";
    const currentNum = parseInt(currentVal) || 50000000;
    const newVal = Math.max(0, currentNum - 100000);
    const displayValue = newVal.toString();
    const clamped = Math.max(0, Math.min(newVal, 50000000));
    
    toPriceValueRef.current = displayValue;
    setToPrice(displayValue);
    setToPriceWords(numberToWords(newVal));
    setPriceRange(prev => ({ ...prev, max: clamped }));
    
    if (toPriceInputRef.current) {
      toPriceInputRef.current.setNativeProps({ text: displayValue });
    }
  };
  
  // Increase/decrease functions for Engine Capacity - same as Model Year
  const increaseFromEngine = () => {
    const currentVal = fromEngineValueRef.current || fromEngine || "0";
    const currentNum = parseInt(currentVal) || 0;
    const newVal = currentNum + 100;
    const displayValue = newVal.toString();
    const clamped = Math.max(0, Math.min(newVal, 6000));
    
    fromEngineValueRef.current = displayValue;
    setFromEngine(displayValue);
    setFromEngineWords(`${newVal} cc`);
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
    setToEngineWords(`${newVal} cc`);
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
  const [selectedRegistrationCities, setSelectedRegistrationCities] = useState<string[]>([]);
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const [selectedBodyColors, setSelectedBodyColors] = useState<string[]>([]);
  const [kmRange, setKmRange] = useState({ min: 0, max: 500000 });
  const [fromKm, setFromKm] = useState("0");
  const [toKm, setToKm] = useState("500000");
  
  // Refs for km inputs to update from buttons
  const fromKmInputRef = useRef<TextInput>(null);
  const toKmInputRef = useRef<TextInput>(null);
  // Refs to store current values without causing re-renders
  const fromKmValueRef = useRef("0");
  const toKmValueRef = useRef("500000");
  
  // State for converted words display (green text)
  const [fromKmWords, setFromKmWords] = useState("");
  const [toKmWords, setToKmWords] = useState("");
  
  // Function to convert number to words (hazar, lakh, crore)
  const numberToWords = useCallback((num: number): string => {
    if (num === 0) return "zero";
    if (isNaN(num) || num < 0) return "";
    
    const numStr = num.toString();
    const len = numStr.length;
    
    // Crore (8 digits)
    if (len > 7) {
      const crore = Math.floor(num / 10000000);
      const remaining = num % 10000000;
      if (remaining === 0) {
        return `${crore} crore`;
      }
      return `${crore} crore ${numberToWords(remaining)}`;
    }
    
    // Lakh (6 digits)
    if (len > 5) {
      const lakh = Math.floor(num / 100000);
      const remaining = num % 100000;
      if (remaining === 0) {
        return `${lakh} lakh`;
      }
      return `${lakh} lakh ${numberToWords(remaining)}`;
    }
    
    // Hazar/Thousand (4 digits)
    if (len > 3) {
      const hazar = Math.floor(num / 1000);
      const remaining = num % 1000;
      if (remaining === 0) {
        return `${hazar} hazar`;
      }
      const remainingWords = numberToWords(remaining);
      if (remainingWords) {
        return `${hazar} hazar ${remainingWords}`;
      }
      return `${hazar} hazar`;
    }
    
    // Hundred (3 digits)
    if (len === 3) {
      const hundred = Math.floor(num / 100);
      const remaining = num % 100;
      if (remaining === 0) {
        return `${hundred} hundred`;
      }
      return `${hundred} hundred ${numberToWords(remaining)}`;
    }
    
    // Less than 100
    return num.toString();
  }, []);
  
  const [priceRange, setPriceRange] = useState({ min: 0, max: 50000000 });
  const [fromPrice, setFromPrice] = useState("0");
  const [toPrice, setToPrice] = useState("50000000");
  
  // Refs for price inputs to update from buttons
  const fromPriceInputRef = useRef<TextInput>(null);
  const toPriceInputRef = useRef<TextInput>(null);
  // Refs to store current values without causing re-renders
  const fromPriceValueRef = useRef("0");
  const toPriceValueRef = useRef("50000000");
  // State for converted words display (green text)
  const [fromPriceWords, setFromPriceWords] = useState("");
  const [toPriceWords, setToPriceWords] = useState("");
  const [selectedFuelTypes, setSelectedFuelTypes] = useState<string[]>([]);
  const [engineRange, setEngineRange] = useState({ min: 0, max: 6000 });
  const [fromEngine, setFromEngine] = useState("0");
  const [toEngine, setToEngine] = useState("6000");
  
  // Refs for engine inputs to update from buttons
  const fromEngineInputRef = useRef<TextInput>(null);
  const toEngineInputRef = useRef<TextInput>(null);
  // Refs to store current values without causing re-renders
  const fromEngineValueRef = useRef("0");
  const toEngineValueRef = useRef("6000");
  // State for converted words display (green text) for Engine Capacity
  const [fromEngineWords, setFromEngineWords] = useState("");
  const [toEngineWords, setToEngineWords] = useState("");
  const [selectedTransmissions, setSelectedTransmissions] = useState<string[]>([]);
  const [selectedAssemblies, setSelectedAssemblies] = useState<string[]>([]);
  const [selectedBodyTypes, setSelectedBodyTypes] = useState<string[]>([]);
  
  // Special Filter States
  const [isCertified, setIsCertified] = useState(false);
  const [isFeatured, setIsFeatured] = useState(false);
  const [isSaleItForMe, setIsSaleItForMe] = useState(false);
  
  // Extended Category States
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  // Categories - full screen picker page with search & multi-select
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [categoryQuery, setCategoryQuery] = useState("");
  const [scrollEnabled, setScrollEnabled] = useState(true);
  // Body Color - Others option
  const [showBodyColorOthersInput, setShowBodyColorOthersInput] = useState(false);
  const [bodyColorOthersText, setBodyColorOthersText] = useState("");
  // Registration City - full screen picker page with search & multi-select
  const [showRegistrationCityPicker, setShowRegistrationCityPicker] = useState(false);
  const [registrationCityQuery, setRegistrationCityQuery] = useState("");
  // Location City - full screen picker page with search & multi-select
  const [showLocationCityPicker, setShowLocationCityPicker] = useState(false);
  const [locationCityQuery, setLocationCityQuery] = useState("");
  // Body Color - full screen picker page with search & multi-select
  const [showBodyColorPicker, setShowBodyColorPicker] = useState(false);
  const [bodyColorQuery, setBodyColorQuery] = useState("");
  // Body Color - Others page
  const [showBodyColorOthersPage, setShowBodyColorOthersPage] = useState(false);
  // Brands guided flow (brand → model → variant), single-select at each step
  const [showBrandPicker, setShowBrandPicker] = useState(false);
  const [brandQuery, setBrandQuery] = useState("");
  const [modelQuery, setModelQuery] = useState("");
  const [variantQuery, setVariantQuery] = useState("");
  const [brandFlowStep, setBrandFlowStep] = useState<'brand' | 'model' | 'variant'>('brand');
  const [pendingBrand, setPendingBrand] = useState<string | null>(null);
  const [pendingModel, setPendingModel] = useState<string | null>(null);
  const [pendingVariant, setPendingVariant] = useState<string | null>(null);
  const [brandModelVariantTuples, setBrandModelVariantTuples] = useState<{ brand: string; model: string; variant: string }[]>([]);
  
  // Clear search queries when brand flow step changes
  useEffect(() => {
    setBrandQuery("");
    setModelQuery("");
    setVariantQuery("");
  }, [brandFlowStep]);
  // Preview states to keep UI smooth during slider drags
  // KM slider removed - only text inputs are used now (same as Model Year)
  const yearRanges = [
    { label: "All Years", min: 1970, max: new Date().getFullYear() },
    { label: "1970 – 2000", min: 1970, max: 2000 },
    { label: "2001 – 2010", min: 2001, max: 2010 },
    { label: "2011 – 2016", min: 2011, max: 2016 },
    { label: "2017 – 2020", min: 2017, max: 2020 },
    { label: "2021 – 2025", min: 2021, max: 2025 },
  ];
  const kmRanges = [
    { label: "All KMs", min: 0, max: 500000 },
    { label: "0 – 50k", min: 0, max: 50000 },
    { label: "50k – 100k", min: 50000, max: 100000 },
    { label: "100k – 150k", min: 100000, max: 150000 },
    { label: "150k – 200k", min: 150000, max: 200000 },
    { label: "200k – 300k", min: 200000, max: 300000 },
    { label: "300k – 500k", min: 300000, max: 500000 },
  ];

  // Data Arrays - Comprehensive Pakistani Car Data
  const brands = [
    "All Brands", 
    // Pakistani Popular Brands
    "Suzuki", "Toyota", "Honda", "Kia", "Hyundai", "MG", "Changan", "BYD",
    // Luxury Brands
    "BMW", "Audi", "Mercedes Benz", "Porsche", "Lexus", "Volvo", "Land Rover", "Jaguar",
    // Japanese Brands
    "Nissan", "Mazda", "Mitsubishi", "Daihatsu",
    // Korean Brands  
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
    "S", "SE", "SEL", "Limited", "Platinum", "Premium", "Prestige"
  ];

  const cities = [
    "All Cities", "Lahore", "Karachi", "Islamabad", "Rawalpindi", "Multan", 
    "Faisalabad", "Peshawar", "Quetta", "Sialkot", "Gujranwala", "Sargodha", 
    "Bahawalpur", "Sukkur", "Larkana", "Sheikhupura", "Rahim Yar Khan", "Gujrat",
    "Mardan", "Mingora", "Nawabshah", "Chiniot", "Kotri", "Kāmoke", "Hafizabad", "Kohat"
  ];

  const bodyColors = [
    "All Colors", "White", "Black", "Silver", "Gray", "Red", "Blue", "Green", 
    "Yellow", "Orange", "Brown", "Purple", "Gold", "Beige", "Maroon", "Navy",
    "Pearl White", "Metallic Silver", "Champagne", "Bronze", "Copper", "Others"
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

  // (no separate renderer needed)

  // Toggle selection helper
  const toggleSelection = <T,>(
    option: T, 
    setSelected: React.Dispatch<React.SetStateAction<T[]>>, 
    selectedList: T[]
  ) => {
    if (option === "All Brands" || option === "All Models" || option === "All Variants" || 
        option === "All Cities" || option === "All Colors" || option === "All Fuel Types" || 
        option === "All Transmissions" || option === "All Assemblies" || option === "All Body Types") {
      setSelected(selectedList.includes(option) ? [] : [option]);
    } else if (option === "All Categories") {
      // If "All Categories" is selected, select all categories except "All Categories"
      const allCategoriesExceptAll = categories.filter(c => c !== "All Categories");
      const allSelected = allCategoriesExceptAll.every(cat => selectedList.includes(cat as T));
      
      if (allSelected) {
        // If all are selected, deselect all
        setSelected([]);
      } else {
        // Select all categories except "All Categories"
        setSelected(allCategoriesExceptAll as T[]);
      }
    } else {
      // For individual category selection
      if (selectedList.includes(option)) {
        setSelected(selectedList.filter((item) => item !== option));
      } else {
        setSelected([...selectedList, option]);
      }
    }
  };

  const handleReset = () => {
    setSelectedBrands([]);
    setSelectedModels([]);
    setSelectedVariants([]);
    setYearRange({ min: 1970, max: new Date().getFullYear() });
    setFromYear("1970");
    setToYear(new Date().getFullYear().toString());
    fromYearValueRef.current = "1970";
    toYearValueRef.current = new Date().getFullYear().toString();
    setSelectedRegistrationCities([]);
    setSelectedLocations([]);
    setSelectedBodyColors([]);
    setKmRange({ min: 0, max: 500000 });
    setFromKm("0");
    setToKm("500000");
    fromKmValueRef.current = "0";
    toKmValueRef.current = "500000";
    setFromKmWords("");
    setToKmWords("");
    setPriceRange({ min: 0, max: 50000000 });
    setFromPrice("0");
    setToPrice("50000000");
    fromPriceValueRef.current = "0";
    toPriceValueRef.current = "50000000";
    setFromPriceWords("");
    setToPriceWords("");
    setSelectedFuelTypes([]);
    setEngineRange({ min: 0, max: 6000 });
    setFromEngine("0");
    setToEngine("6000");
    fromEngineValueRef.current = "0";
    toEngineValueRef.current = "6000";
    setFromEngineWords("");
    setToEngineWords("");
    setSelectedTransmissions([]);
    setSelectedAssemblies([]);
    setSelectedBodyTypes([]);
    setIsCertified(false);
    setIsFeatured(false);
    setIsSaleItForMe(false);
    setSelectedCategories([]);
    setBrandModelVariantTuples([]);
    setShowCategoryPicker(false);
    setCategoryQuery("");
    setShowRegistrationCityPicker(false);
    setRegistrationCityQuery("");
    setShowLocationCityPicker(false);
    setLocationCityQuery("");
    setShowBodyColorPicker(false);
    setBodyColorQuery("");
    setShowBodyColorOthersPage(false);
    setBodyColorOthersText("");
    setShowBrandPicker(false);
    setBrandQuery("");
    setModelQuery("");
    setVariantQuery("");
    setBrandFlowStep('brand');
    setPendingBrand(null);
    setPendingModel(null);
    setPendingVariant(null);
  };

  // Reset filters when modal opens (refreshes page)
  useEffect(() => {
    if (visible) {
      // Reset all filters when modal opens
      setSelectedBrands([]);
      setSelectedModels([]);
      setSelectedVariants([]);
      setYearRange({ min: 1970, max: new Date().getFullYear() });
      setFromYear("1970");
      setToYear(new Date().getFullYear().toString());
      fromYearValueRef.current = "1970";
      toYearValueRef.current = new Date().getFullYear().toString();
      setSelectedRegistrationCities([]);
      setSelectedLocations([]);
      setSelectedBodyColors([]);
      setKmRange({ min: 0, max: 500000 });
      setFromKm("0");
      setToKm("500000");
      fromKmValueRef.current = "0";
      toKmValueRef.current = "500000";
      setFromKmWords("");
      setToKmWords("");
      setPriceRange({ min: 0, max: 50000000 });
      setFromPrice("0");
      setToPrice("50000000");
      fromPriceValueRef.current = "0";
      toPriceValueRef.current = "50000000";
      setFromPriceWords("");
      setToPriceWords("");
      setSelectedFuelTypes([]);
      setEngineRange({ min: 0, max: 6000 });
      setFromEngine("0");
      setToEngine("6000");
      fromEngineValueRef.current = "0";
      toEngineValueRef.current = "6000";
      setFromEngineWords("");
      setToEngineWords("");
      setSelectedTransmissions([]);
      setSelectedAssemblies([]);
      setSelectedBodyTypes([]);
      setIsCertified(false);
      setIsFeatured(false);
      setIsSaleItForMe(false);
      setSelectedCategories([]);
      setBrandModelVariantTuples([]);
      setShowCategoryPicker(false);
      setCategoryQuery("");
      setShowRegistrationCityPicker(false);
      setRegistrationCityQuery("");
      setShowLocationCityPicker(false);
      setLocationCityQuery("");
      setShowBodyColorPicker(false);
      setBodyColorQuery("");
      setShowBodyColorOthersPage(false);
      setBodyColorOthersText("");
      setShowBrandPicker(false);
      setBrandQuery("");
      setModelQuery("");
      setVariantQuery("");
      setBrandFlowStep('brand');
      setPendingBrand(null);
      setPendingModel(null);
      setPendingVariant(null);
    }
  }, [visible]);

  const handleApplyFilters = () => {
    // Merge tuples into arrays for filters
    const tupleBrands = Array.from(new Set(brandModelVariantTuples.map(t => t.brand)));
    const tupleModels = Array.from(new Set(brandModelVariantTuples.map(t => t.model)));
    const tupleVariants = Array.from(new Set(brandModelVariantTuples.map(t => t.variant)));

    onApplyFilters({
      brands: (selectedBrands || []).concat(tupleBrands).filter(Boolean),
      models: (selectedModels || []).concat(tupleModels).filter(Boolean),
      variants: (selectedVariants || []).concat(tupleVariants).filter(Boolean),
      years: yearRange || { min: 1970, max: new Date().getFullYear() },
      registrationCities: selectedRegistrationCities || [],
      locations: selectedLocations || [],
      bodyColors: selectedBodyColors || [],
      kmDriven: kmRange || { min: 0, max: 500000 },
      price: priceRange || { min: 0, max: 50000000 },
      fuelTypes: selectedFuelTypes || [],
      engineCapacity: engineRange || { min: 0, max: 6000 },
      transmissions: selectedTransmissions || [],
      assemblies: selectedAssemblies || [],
      bodyTypes: selectedBodyTypes || [],
      isCertified: isCertified || false,
      isFeatured: isFeatured || false,
      isSaleItForMe: isSaleItForMe || false,
      categories: selectedCategories || [],
    });
    onClose();
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
    unit = "",
    onSlidingStateChange,
    singleThumb = false,
  }: {
    title: string;
    value: { min: number; max: number };
    onValueChange: (value: { min: number; max: number }) => void;
    min: number;
    max: number;
    step?: number;
    unit?: string;
    onSlidingStateChange?: (sliding: boolean) => void;
    singleThumb?: boolean;
  }) => {
    const [activeThumb, setActiveThumb] = React.useState<null | 'min' | 'max'>(null);
    const [previewMax, setPreviewMax] = React.useState<number | null>(null);
    const safeStep = Number(step) || 1;
    const invalidOrCollapsed = value == null || typeof value.min !== 'number' || typeof value.max !== 'number' || value.min >= value.max;
    const baseMin = invalidOrCollapsed ? min : value.min;
    const baseMax = invalidOrCollapsed ? max : value.max;
    const guardMin = Math.min(Math.max(baseMin, min), max - safeStep);
    const guardMax = Math.max(Math.min(baseMax, max), min + safeStep);

    return (
    <View style={styles.rangeContainer}>
      <Text style={styles.rangeTitle}>{title}</Text>
      {/* Top input-like boxes showing selected range */}
      <View style={styles.rangeBoxesRow}>
        <View style={[styles.rangeBox, activeThumb === 'min' && styles.rangeBoxActive]}>
          <Text style={[styles.rangeBoxText, activeThumb === 'min' && styles.rangeBoxTextActive]}>{guardMin}</Text>
        </View>
        <Text style={styles.toText}>to</Text>
        <View style={[styles.rangeBox, activeThumb === 'max' && styles.rangeBoxActive]}>
          <Text style={[styles.rangeBoxText, activeThumb === 'max' && styles.rangeBoxTextActive]}>{
            previewMax != null ? previewMax : guardMax
          }</Text>
        </View>
      </View>

      <View style={styles.rangeValues}>
        <Text style={styles.rangeValue}>{value.min.toLocaleString()}{unit}</Text>
        <Text style={styles.rangeValue}>{value.max.toLocaleString()}{unit}</Text>
      </View>
      <View style={{ marginVertical: 8 }}>
        <MultiSlider
          values={[guardMin, guardMax]}
          min={min}
          max={max}
          step={safeStep}
          allowOverlap={false}
          enableLabel={false}
          snapped={false}
          sliderLength={300}
          containerStyle={{ height: 60 }}
          isMarkersSeparated={true}
          touchDimensions={{
            height: 80,
            width: 80,
            slipDisplacement: 500,
            borderRadius: 40,
          }}
          pressedMarkerStyle={styles.multiThumb}
          onValuesChange={(vals) => {
            const [v0, v1] = vals;
            const newMin = Math.max(min, Math.min(v0, v1 - safeStep));
            const newMax = Math.min(max, Math.max(v1, v0 + safeStep));
            onValueChange({ min: newMin, max: newMax });
          }}
          selectedStyle={styles.sliderSelected}
          unselectedStyle={styles.sliderUnselected}
          trackStyle={styles.sliderTrack}
          markerStyle={styles.multiThumb}
        />
      </View>
    </View>
  );
  }

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

          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <ScrollView
              style={styles.scrollContainer}
              showsVerticalScrollIndicator={true}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
              nestedScrollEnabled
              decelerationRate="fast"
              scrollEventThrottle={16}
              removeClippedSubviews
            >
            
          {/* Categories - clickable row opens full-screen searchable, multi-select list */}
          <FilterSection title="Categories">
            <TouchableOpacity
              activeOpacity={0.9}
              style={styles.searchBox}
              onPress={() => setShowCategoryPicker(true)}
            >
              <Ionicons name="search" size={18} color="#999" style={{ marginRight: 6 }} />
              <Text style={styles.searchPlaceholder}>
                Select categories
              </Text>
              <Ionicons name={'chevron-forward'} size={18} color="#999" />
            </TouchableOpacity>

            {/* Render current selections as chips */}
            {selectedCategories.length > 0 && (
              <View style={styles.chipsContainer}>
                {selectedCategories.filter(cat => cat !== "All Categories").map((cat, idx) => (
                  <View key={`${cat}-${idx}`} style={styles.chip}>
                    <Text style={styles.chipText}>{cat}</Text>
                    <TouchableOpacity style={styles.chipRemove} onPress={() => {
                      setSelectedCategories(selectedCategories.filter(c => c !== cat));
                    }}>
                      <Ionicons name="close" size={14} color="#CD0100" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </FilterSection>

            {/* Brand Filter */}
            <FilterSection title="Brand Name">
              <TouchableOpacity
                activeOpacity={0.9}
                style={styles.searchBox}
                onPress={() => {
                  setShowBrandPicker(true);
                  setBrandFlowStep('brand');
                  setBrandQuery("");
                  setModelQuery("");
                  setVariantQuery("");
                  setPendingBrand(null);
                  setPendingModel(null);
                  setPendingVariant(null);
                }}
              >
                <Ionicons name="search" size={18} color="#999" style={{ marginRight: 6 }} />
                <Text style={styles.searchPlaceholder}>
                  Select brand, model and variant
                </Text>
                <Ionicons name={'chevron-forward'} size={18} color="#999" />
              </TouchableOpacity>

              {/* Render current selections as chips with plus to add */}
              <View style={styles.chipsContainer}>
                {brandModelVariantTuples.map((t, idx) => (
                  <View key={`${t.brand}-${t.model}-${t.variant}-${idx}`} style={styles.chip}>
                    <Text style={styles.chipText}>{t.brand} {t.model} {t.variant}</Text>
                    <TouchableOpacity style={styles.chipRemove} onPress={() => {
                      setBrandModelVariantTuples(brandModelVariantTuples.filter((_, i) => i !== idx));
                    }}>
                      <Ionicons name="close" size={14} color="#CD0100" />
                    </TouchableOpacity>
                  </View>
                ))}
                <TouchableOpacity
                  style={styles.addChip}
                  onPress={() => { setShowBrandPicker(true); setBrandFlowStep('brand'); setBrandQuery(""); setModelQuery(""); setVariantQuery(""); setPendingBrand(null); setPendingModel(null); setPendingVariant(null); }}
                >
                  <Ionicons name="add" size={18} color="#CD0100" />
                </TouchableOpacity>
              </View>
            </FilterSection>

            {/* Model Name and Variant sections removed as requested */}

            {/* Year Range - Uncontrolled inputs to prevent keyboard close */}
            <FilterSection title="Model Year">
              <View style={styles.simpleYearContainer}>
                {/* FROM YEAR with +/- buttons */}
                <View style={styles.yearInputBox}>
                  <TouchableOpacity onPress={decreaseFromYear} style={styles.yearButton}>
                    <Text style={styles.yearButtonText}>−</Text>
                  </TouchableOpacity>
                  <YearInput
                    key="from-year-stable"
                    initialValue={fromYear}
                    placeholder="1970"
                    inputRef={fromYearInputRef}
                    valueRef={fromYearValueRef}
                    onBlur={(text) => {
                      Keyboard.dismiss();
                      // Preserve what user typed
                      const displayValue = text.trim() || "1970";
                      const num = parseInt(displayValue) || 1970;
                      // Clamp for filter range, but keep display value
                      const clamped = Math.max(1970, Math.min(num, new Date().getFullYear()));
                      fromYearValueRef.current = displayValue;
                      setFromYear(displayValue);
                      // Use clamped value for filter, but display what user typed
                      setYearRange(prev => ({ ...prev, min: clamped }));
                    }}
                  />
                  <TouchableOpacity onPress={increaseFromYear} style={styles.yearButton}>
                    <Text style={styles.yearButtonText}>＋</Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.simpleYearToText}>to</Text>
                {/* TO YEAR with +/- buttons */}
                <View style={styles.yearInputBox}>
                  <TouchableOpacity onPress={decreaseToYear} style={styles.yearButton}>
                    <Text style={styles.yearButtonText}>−</Text>
                  </TouchableOpacity>
                  <YearInput
                    key="to-year-stable"
                    initialValue={toYear}
                    placeholder={new Date().getFullYear().toString()}
                    inputRef={toYearInputRef}
                    valueRef={toYearValueRef}
                    onBlur={(text) => {
                      Keyboard.dismiss();
                      // Preserve what user typed
                      const currentYear = new Date().getFullYear();
                      const displayValue = text.trim() || currentYear.toString();
                      const num = parseInt(displayValue) || currentYear;
                      // Clamp for filter range, but keep display value
                      const clamped = Math.max(1970, Math.min(num, currentYear));
                      toYearValueRef.current = displayValue;
                      setToYear(displayValue);
                      // Use clamped value for filter, but display what user typed
                      setYearRange(prev => ({ ...prev, max: clamped }));
                    }}
                  />
                  <TouchableOpacity onPress={increaseToYear} style={styles.yearButton}>
                    <Text style={styles.yearButtonText}>＋</Text>
                  </TouchableOpacity>
                </View>
              </View>
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
                  Select registration cities
                </Text>
                <Ionicons name={'chevron-forward'} size={18} color="#999" />
              </TouchableOpacity>

              {/* Render current selections as chips */}
              {selectedRegistrationCities.length > 0 && (
                <View style={styles.chipsContainer}>
                  {selectedRegistrationCities.filter(city => city !== "All Cities").map((city, idx) => (
                    <View key={`${city}-${idx}`} style={styles.chip}>
                      <Text style={styles.chipText}>{city}</Text>
                      <TouchableOpacity style={styles.chipRemove} onPress={() => {
                        setSelectedRegistrationCities(selectedRegistrationCities.filter(c => c !== city));
                      }}>
                        <Ionicons name="close" size={14} color="#CD0100" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
            </FilterSection>

            {/* Location City - clickable row opens full-screen searchable, multi-select list */}
            <FilterSection title="Location (City)">
              <TouchableOpacity
                activeOpacity={0.9}
                style={styles.searchBox}
                onPress={() => setShowLocationCityPicker(true)}
              >
                <Ionicons name="search" size={18} color="#999" style={{ marginRight: 6 }} />
                <Text style={styles.searchPlaceholder}>
                  Select location cities
                </Text>
                <Ionicons name={'chevron-forward'} size={18} color="#999" />
              </TouchableOpacity>

              {/* Render current selections as chips */}
              {selectedLocations.length > 0 && (
                <View style={styles.chipsContainer}>
                  {selectedLocations.filter(city => city !== "All Cities").map((city, idx) => (
                    <View key={`${city}-${idx}`} style={styles.chip}>
                      <Text style={styles.chipText}>{city}</Text>
                      <TouchableOpacity style={styles.chipRemove} onPress={() => {
                        setSelectedLocations(selectedLocations.filter(c => c !== city));
                      }}>
                        <Ionicons name="close" size={14} color="#CD0100" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
            </FilterSection>

            {/* Body Color - clickable row opens full-screen searchable, multi-select list */}
            <FilterSection title="Body Color">
              <TouchableOpacity
                activeOpacity={0.9}
                style={styles.searchBox}
                onPress={() => setShowBodyColorPicker(true)}
              >
                <Ionicons name="search" size={18} color="#999" style={{ marginRight: 6 }} />
                <Text style={styles.searchPlaceholder}>
                  Select body colors
                </Text>
                <Ionicons name={'chevron-forward'} size={18} color="#999" />
              </TouchableOpacity>

              {/* Render current selections as chips */}
              {selectedBodyColors.length > 0 && (
                <View style={styles.chipsContainer}>
                  {selectedBodyColors.filter(color => color !== "All Colors" && color !== "Others").map((color, idx) => (
                    <View key={`${color}-${idx}`} style={styles.chip}>
                      <Text style={styles.chipText}>{color}</Text>
                      <TouchableOpacity style={styles.chipRemove} onPress={() => {
                        setSelectedBodyColors(selectedBodyColors.filter(c => c !== color));
                      }}>
                        <Ionicons name="close" size={14} color="#CD0100" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
            </FilterSection>

            {/* KM Driven (dual-thumb slider only) */}
            <FilterSection title="Kilometers Driven">
              <View>
                <View style={styles.simpleYearContainer}>
                  {/* FROM KM with +/- buttons */}
                  <View>
                    <View style={styles.yearInputBox}>
                      <TouchableOpacity onPress={decreaseFromKm} style={styles.yearButton}>
                        <Text style={styles.yearButtonText}>−</Text>
                      </TouchableOpacity>
                      <YearInput
                        key="from-km-stable"
                        initialValue={fromKm}
                        placeholder="0"
                        inputRef={fromKmInputRef}
                        valueRef={fromKmValueRef}
                        onBlur={(text) => {
                          Keyboard.dismiss();
                          const displayValue = text.trim() || "0";
                          const num = parseInt(displayValue) || 0;
                          const clamped = Math.max(0, Math.min(num, 500000));
                          fromKmValueRef.current = displayValue;
                          setFromKm(displayValue);
                          setFromKmWords(numberToWords(num));
                          setKmRange(prev => ({ ...prev, min: clamped }));
                        }}
                      />
                      <TouchableOpacity onPress={increaseFromKm} style={styles.yearButton}>
                        <Text style={styles.yearButtonText}>＋</Text>
                      </TouchableOpacity>
                    </View>
                    {fromKmWords ? (
                      <Text style={styles.convertedText}>{fromKmWords}</Text>
                    ) : null}
                  </View>
                  <Text style={styles.simpleYearToText}>to</Text>
                  {/* TO KM with +/- buttons */}
                  <View>
                    <View style={styles.yearInputBox}>
                      <TouchableOpacity onPress={decreaseToKm} style={styles.yearButton}>
                        <Text style={styles.yearButtonText}>−</Text>
                      </TouchableOpacity>
                      <YearInput
                        key="to-km-stable"
                        initialValue={toKm}
                        placeholder="500000"
                        inputRef={toKmInputRef}
                        valueRef={toKmValueRef}
                        onBlur={(text) => {
                          Keyboard.dismiss();
                          const displayValue = text.trim() || "500000";
                          const num = parseInt(displayValue) || 500000;
                          const clamped = Math.max(0, Math.min(num, 500000));
                          toKmValueRef.current = displayValue;
                          setToKm(displayValue);
                          setToKmWords(numberToWords(num));
                          setKmRange(prev => ({ ...prev, max: clamped }));
                        }}
                      />
                      <TouchableOpacity onPress={increaseToKm} style={styles.yearButton}>
                        <Text style={styles.yearButtonText}>＋</Text>
                      </TouchableOpacity>
                    </View>
                    {toKmWords ? (
                      <Text style={styles.convertedText}>{toKmWords}</Text>
                    ) : null}
                  </View>
                </View>
              </View>
            </FilterSection>

            {/* Price Range - Same design as Model Year */}
            <FilterSection title="Price (PKR)">
              <View>
              <View style={styles.simpleYearContainer}>
                {/* FROM PRICE with +/- buttons */}
                  <View>
                <View style={styles.yearInputBox}>
                  <TouchableOpacity onPress={decreaseFromPrice} style={styles.yearButton}>
                    <Text style={styles.yearButtonText}>−</Text>
                  </TouchableOpacity>
                  <YearInput
                    key="from-price-stable"
                    initialValue={fromPrice}
                    placeholder="0"
                    inputRef={fromPriceInputRef}
                    valueRef={fromPriceValueRef}
                    onBlur={(text) => {
                      Keyboard.dismiss();
                      const displayValue = text.trim() || "0";
                      const num = parseInt(displayValue) || 0;
                      const clamped = Math.max(0, Math.min(num, 50000000));
                      fromPriceValueRef.current = displayValue;
                      setFromPrice(displayValue);
                          setFromPriceWords(numberToWords(num));
                      setPriceRange(prev => ({ ...prev, min: clamped }));
                    }}
                  />
                  <TouchableOpacity onPress={increaseFromPrice} style={styles.yearButton}>
                    <Text style={styles.yearButtonText}>＋</Text>
                  </TouchableOpacity>
                    </View>
                    {fromPriceWords ? (
                      <Text style={styles.convertedText}>{fromPriceWords}</Text>
                    ) : null}
                </View>
                <Text style={styles.simpleYearToText}>to</Text>
                {/* TO PRICE with +/- buttons */}
                  <View>
                <View style={styles.yearInputBox}>
                  <TouchableOpacity onPress={decreaseToPrice} style={styles.yearButton}>
                    <Text style={styles.yearButtonText}>−</Text>
                  </TouchableOpacity>
                  <YearInput
                    key="to-price-stable"
                    initialValue={toPrice}
                    placeholder="50000000"
                    inputRef={toPriceInputRef}
                    valueRef={toPriceValueRef}
                    onBlur={(text) => {
                      Keyboard.dismiss();
                      const displayValue = text.trim() || "50000000";
                      const num = parseInt(displayValue) || 50000000;
                      const clamped = Math.max(0, Math.min(num, 50000000));
                      toPriceValueRef.current = displayValue;
                      setToPrice(displayValue);
                          setToPriceWords(numberToWords(num));
                      setPriceRange(prev => ({ ...prev, max: clamped }));
                    }}
                  />
                  <TouchableOpacity onPress={increaseToPrice} style={styles.yearButton}>
                    <Text style={styles.yearButtonText}>＋</Text>
                  </TouchableOpacity>
                    </View>
                    {toPriceWords ? (
                      <Text style={styles.convertedText}>{toPriceWords}</Text>
                    ) : null}
                  </View>
                </View>
              </View>
            </FilterSection>

            {/* Fuel Type */}
            <FilterSection title="Fuel Type">
              <MultiSelectButtons
                options={fuelTypes}
                selected={selectedFuelTypes}
                onToggle={(option) => toggleSelection(option, setSelectedFuelTypes, selectedFuelTypes)}
              />
            </FilterSection>

            {/* Engine Capacity - Same design as Model Year */}
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
          </TouchableWithoutFeedback>

          {/* Full-screen categories overlay (rendered above content) */}
          {showCategoryPicker && (
            <View style={styles.overlayFull}>
              <View style={styles.fullPageHeader}>
                <TouchableOpacity onPress={() => { Keyboard.dismiss(); setShowCategoryPicker(false); }}>
                  <Ionicons name="arrow-back" size={22} color="#333" />
                </TouchableOpacity>
                <Text style={styles.fullPageTitle}>Select Categories</Text>
                <View style={{ width: 22 }} />
              </View>

              <View style={[styles.searchBox, { marginHorizontal: 16, marginBottom: 10 }]}> 
                <Ionicons name="search" size={18} color="#999" style={{ marginRight: 6 }} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Type to search"
                  placeholderTextColor="#999"
                  value={categoryQuery}
                  onChangeText={setCategoryQuery}
                  autoFocus
                  blurOnSubmit
                  returnKeyType="search"
                  onSubmitEditing={() => Keyboard.dismiss()}
                />
              </View>

              <ScrollView style={{ flex: 1, marginHorizontal: 16 }} keyboardShouldPersistTaps="always">
                {(categoryQuery
                  ? categories.filter(c => c.toLowerCase().includes(categoryQuery.toLowerCase()))
                  : categories
                ).map((c, idx) => {
                  // For "All Categories", check if all categories are selected
                  let selected = false;
                  if (c === "All Categories") {
                    const allCategoriesExceptAll = categories.filter(cat => cat !== "All Categories");
                    selected = allCategoriesExceptAll.every(cat => selectedCategories.includes(cat));
                  } else {
                    selected = selectedCategories.includes(c);
                  }
                  
                  return (
                    <TouchableOpacity
                      key={`${c}-${idx}`}
                      style={[styles.categoryRow, selected && styles.categoryRowSelected]}
                      onPress={() => toggleSelection(c, setSelectedCategories, selectedCategories)}
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
                  onPress={() => { Keyboard.dismiss(); setShowCategoryPicker(false); setCategoryQuery(""); }}
                >
                  <Text style={styles.applyButtonText}>Done</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

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

          {/* Full-screen Location City overlay (rendered above content) */}
          {showLocationCityPicker && (
            <View style={styles.overlayFull}>
              <View style={styles.fullPageHeader}>
                <TouchableOpacity onPress={() => { Keyboard.dismiss(); setShowLocationCityPicker(false); }}>
                  <Ionicons name="arrow-back" size={22} color="#333" />
                </TouchableOpacity>
                <Text style={styles.fullPageTitle}>Select Location Cities</Text>
                <View style={{ width: 22 }} />
              </View>

              <View style={[styles.searchBox, { marginHorizontal: 16, marginBottom: 10 }]}> 
                <Ionicons name="search" size={18} color="#999" style={{ marginRight: 6 }} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Type to search"
                  placeholderTextColor="#999"
                  value={locationCityQuery}
                  onChangeText={setLocationCityQuery}
                  autoFocus
                  blurOnSubmit
                  returnKeyType="search"
                  onSubmitEditing={() => Keyboard.dismiss()}
                />
              </View>

              <ScrollView style={{ flex: 1, marginHorizontal: 16 }} keyboardShouldPersistTaps="always">
                {(locationCityQuery
                  ? cities.filter(c => c.toLowerCase().includes(locationCityQuery.toLowerCase()))
                  : cities
                ).map((c, idx) => {
                  const selected = selectedLocations.includes(c);
                  return (
                    <TouchableOpacity
                      key={`${c}-${idx}`}
                      style={[styles.categoryRow, selected && styles.categoryRowSelected]}
                      onPress={() => toggleSelection(c, setSelectedLocations, selectedLocations)}
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
                  onPress={() => { Keyboard.dismiss(); setShowLocationCityPicker(false); setLocationCityQuery(""); }}
                >
                  <Text style={styles.applyButtonText}>Done</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Full-screen Body Color overlay (rendered above content) */}
          {showBodyColorPicker && (
            <View style={styles.overlayFull}>
              <View style={styles.fullPageHeader}>
                <TouchableOpacity onPress={() => { Keyboard.dismiss(); setShowBodyColorPicker(false); }}>
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
                  const selected = selectedBodyColors.includes(c);
                  return (
                    <TouchableOpacity
                      key={`${c}-${idx}`}
                      style={[styles.categoryRow, selected && styles.categoryRowSelected]}
                      onPress={() => toggleSelection(c, setSelectedBodyColors, selectedBodyColors)}
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

              <View style={{ padding: 16 }}>
                <TouchableOpacity
                  style={styles.applyButton}
                  onPress={() => { 
                    Keyboard.dismiss(); 
                    setShowBodyColorPicker(false); 
                    setBodyColorQuery("");
                  }}
                >
                  <Text style={styles.applyButtonText}>Done</Text>
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
                        if (!selectedBodyColors.includes(customColor)) {
                          setSelectedBodyColors([...selectedBodyColors, customColor]);
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
                        if (!selectedBodyColors.includes(customColor)) {
                          setSelectedBodyColors([...selectedBodyColors, customColor]);
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

          {/* Full-screen brands overlay (rendered above content) */}
          {showBrandPicker && (
            <View style={styles.overlayFull}>
              <View style={styles.fullPageHeader}>
                <TouchableOpacity onPress={() => { Keyboard.dismiss(); setShowBrandPicker(false); setBrandQuery(""); setModelQuery(""); setVariantQuery(""); setBrandFlowStep('brand'); setPendingBrand(null); setPendingModel(null); setPendingVariant(null); }}>
                  <Ionicons name="arrow-back" size={22} color="#333" />
                </TouchableOpacity>
                <Text style={styles.fullPageTitle}>
                  {brandFlowStep === 'brand' ? 'Select Brand' : brandFlowStep === 'model' ? 'Select Model' : 'Select Variant'}
                </Text>
                <View style={{ width: 22 }} />
              </View>

              <View style={[styles.searchBox, { marginHorizontal: 16, marginBottom: 10 }]}> 
                <Ionicons name="search" size={18} color="#999" style={{ marginRight: 6 }} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Type to search"
                  placeholderTextColor="#999"
                  value={brandFlowStep === 'brand' ? brandQuery : brandFlowStep === 'model' ? modelQuery : variantQuery}
                  onChangeText={(txt) => {
                    if (brandFlowStep === 'brand') setBrandQuery(txt);
                    else if (brandFlowStep === 'model') setModelQuery(txt);
                    else setVariantQuery(txt);
                  }}
                  autoFocus
                  blurOnSubmit
                  returnKeyType="search"
                  onSubmitEditing={() => Keyboard.dismiss()}
                />
              </View>

              <ScrollView style={{ flex: 1, marginHorizontal: 16 }} keyboardShouldPersistTaps="always">
                {(() => {
                  // Brand step → filter brands by search (simple)
                  if (brandFlowStep === 'brand') {
                    return brandQuery
                      ? brands.filter(b => b.toLowerCase().includes(brandQuery.toLowerCase()))
                      : brands;
                  }

                  // Model step → only models for selected brand
                  if (brandFlowStep === 'model') {
                    // If no brand selected or "All Brands", fall back to all models
                    if (!pendingBrand || pendingBrand === 'All Brands') {
                      return modelQuery
                        ? models.filter(m => m.toLowerCase().includes(modelQuery.toLowerCase()))
                        : models;
                    }

                    // Map brand → models
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

                    const trimmedBrand = String(pendingBrand).trim();
                    const brandKey = Object.keys(brandToModelsMap).find(
                      key => key === trimmedBrand || key.toLowerCase() === trimmedBrand.toLowerCase()
                    );

                    const brandModels = brandKey ? brandToModelsMap[brandKey] || [] : [];

                    const filtered = modelQuery
                      ? brandModels.filter(m => m.toLowerCase().includes(modelQuery.toLowerCase()))
                      : brandModels;

                    // Never show "All Models" when a specific brand is selected
                    return filtered.filter(m => m && m.trim() !== 'All Models');
                  }

                  // Variant step → only variants for selected model
                  if (brandFlowStep === 'variant') {
                    // If no model selected or "All Models", fall back to all variants
                    if (!pendingModel || pendingModel === 'All Models') {
                      return variantQuery
                        ? variants.filter(v => v.toLowerCase().includes(variantQuery.toLowerCase()))
                        : variants;
                    }

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

                    const modelVariants = modelToVariantsMap[String(pendingModel)] || [];
                    // Also add general variants so list is not too short
                    const generalVariants = [
                      "Base", "Standard", "Luxury", "Executive", "Sport", "Hybrid", "Turbo",
                      "Automatic", "Manual", "CVT", "AMT", "DCT", "4WD", "RWD",
                      "S", "SE", "SEL", "Limited", "Platinum", "Prestige",
                    ];

                    const allVariants = [...modelVariants, ...generalVariants];
                    const filtered = variantQuery
                      ? allVariants.filter(v => v.toLowerCase().includes(variantQuery.toLowerCase()))
                      : allVariants;

                    // Never show "All Variants" when a specific model is selected
                    return filtered.filter(v => v && v.trim() !== 'All Variants');
                  }

                  // Fallback (should not normally hit) → brands
                  return brands;
                })().map((item, idx) => {
                  const isSelected = (brandFlowStep === 'brand' && pendingBrand === item) ||
                                     (brandFlowStep === 'model' && pendingModel === item) ||
                                     (brandFlowStep === 'variant' && pendingVariant === item);
                  return (
                    <TouchableOpacity
                      key={`${item}-${idx}`}
                      style={[styles.categoryRow, isSelected && styles.categoryRowSelected]}
                      onPress={() => {
                        if (brandFlowStep === 'brand') {
                          // If user picks "All Brands", just select it and stay on brand step
                          if (item === 'All Brands') {
                            setPendingBrand(item);
                            return;
                          }
                          // Specific brand → go to model step
                          setPendingBrand(item);
                          setPendingModel(null);
                          setPendingVariant(null);
                          setBrandFlowStep('model');
                        } else if (brandFlowStep === 'model') {
                          // If user picks "All Models", just select it and stay on model step
                          if (item === 'All Models') {
                            setPendingModel(item);
                            return;
                          }
                          // Specific model → go to variant step
                          setPendingModel(item);
                          setPendingVariant(null);
                          setBrandFlowStep('variant');
                        } else {
                          setPendingVariant(item);
                        }
                      }}
                    >
                      <Text style={[styles.categoryLabel, isSelected && styles.categoryLabelSelected]}>{item}</Text>
                      <Ionicons name={isSelected ? 'radio-button-on' : 'radio-button-off'} size={20} color={isSelected ? '#CD0100' : '#999'} />
                    </TouchableOpacity>
                  )
                })}
              </ScrollView>

              <View style={{ padding: 16 }}>
                <TouchableOpacity
                  style={styles.applyButton}
                  onPress={() => {
                    // Finalize tuple when on variant step and all selected
                    if (brandFlowStep === 'variant' && pendingBrand && pendingModel && pendingVariant) {
                      setBrandModelVariantTuples([...brandModelVariantTuples, { brand: pendingBrand, model: pendingModel, variant: pendingVariant }]);
                      // also reflect to basic arrays for compatibility
                      setSelectedBrands([pendingBrand]);
                      setSelectedModels([pendingModel]);
                      setSelectedVariants([pendingVariant]);
                      setPendingBrand(null); setPendingModel(null); setPendingVariant(null);
                      setBrandFlowStep('brand');
                      setShowBrandPicker(false);
                      setBrandQuery(""); setModelQuery(""); setVariantQuery("");
                      Keyboard.dismiss();
                    } else if (brandFlowStep === 'model' && pendingBrand && !pendingModel) {
                      // no-op until model chosen
                      Keyboard.dismiss();
                    } else if (brandFlowStep === 'brand' && !pendingBrand) {
                      Keyboard.dismiss();
                    } else {
                      // If user presses Done early, just close without adding
                      setShowBrandPicker(false);
                      Keyboard.dismiss();
                    }
                  }}
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

const styles = createResponsiveStyleSheet({
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
  yearInputField: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 12,
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
    textAlign: 'center',
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
  plainYearInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    paddingVertical: 10,
    paddingHorizontal: 12,
    fontSize: 15,
    color: '#333',
    backgroundColor: '#fff',
    textAlign: 'left',
  },
  yearSearchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  yearSearchIcon: {
    marginRight: 8,
  },
  yearSearchBar: {
    flex: 1,
    height: 40,
    color: '#333',
    fontSize: 14,
  },
  emailPasswordContainer: {
    gap: 0,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  inputIcon: {
    padding: 10,
  },
  simpleInput: {
    flex: 1,
    height: 50,
    paddingHorizontal: 8,
    color: '#333',
  },
  eyeIcon: {
    padding: 10,
  },
  modelYearContainer: {
    paddingVertical: 10,
  },
  modelYearRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modelYearBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: '#fff',
  },
  modelYearInput: {
    width: 70,
    textAlign: 'center',
    fontSize: 16,
    color: '#333',
  },
  modelYearBtn: {
    paddingHorizontal: 10,
  },
  modelYearIcon: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  modelYearToText: {
    marginHorizontal: 10,
    fontSize: 16,
    color: '#666',
  },
  rangeBoxActive: {
    borderColor: '#CD0100',
  },
  rangeBoxText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
  },
  rangeBoxTextActive: {
    color: '#CD0100',
  },
  toText: {
    marginHorizontal: 12,
    color: '#666',
    fontSize: 14,
    fontWeight: '500',
  },
  stepperBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#CD0100',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 8,
    minWidth: 120,
    justifyContent: 'space-between',
    gap: 10,
  },
  stepperButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F8F8F8',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#CD0100',
  },
  stepperBtn: {
    fontSize: 18,
    color: '#CD0100',
    width: 20,
    textAlign: 'center'
  },
  stepperValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    minWidth: 50,
    textAlign: 'center',
  },
  stepperValueInput: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    minWidth: 60,
    textAlign: 'center',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: '#CD0100',
    borderRadius: 6,
    backgroundColor: '#fff',
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
  rangeSliderWrap: {
    position: 'relative',
    height: 40,
    justifyContent: 'center',
  },
  slider: {
    width: '100%',
  },
  sliderOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
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
  selectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: '#F8F8F8',
    borderRadius: 8,
    marginBottom: 6,
  },
  selectionText: {
    color: '#333',
    fontSize: 14,
    fontWeight: '500',
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
  },
  chipRemove: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  addChip: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#CD0100',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  // Search box for categories
  // (removed picker/search styles)
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
  categoryPicker: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 10,
    padding: 10,
    marginTop: 10,
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
  fullPageContainer: {
    flex: 1,
    backgroundColor: '#fff'
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
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    zIndex: 999,
    elevation: 10,
  },
  selectedYearDisplay: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4CAF50',
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
  simpleSliderContainer: {
    marginTop: 12,
    marginBottom: 8,
    alignItems: 'center',
  },
  simpleSliderTrack: {
    height: 2,
    backgroundColor: '#D0D0D0',
    borderRadius: 1,
    position: 'relative',
    width: 320,
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: '#D0D0D0',
  },
  simpleSliderThumb: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#fff',
    top: -13,
    borderWidth: 2,
    borderColor: '#D0D0D0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 4,
    zIndex: 10,
  },
});

export default FilterModal;
