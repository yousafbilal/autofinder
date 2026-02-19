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
  TouchableWithoutFeedback,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import MultiSlider from "@ptomasroos/react-native-multi-slider";

interface BikeFilterModalProps {
  visible: boolean;
  onClose: () => void;
  onApplyFilters: (filters: {
    // Basic Filters
    companies: string[];
    models: string[];
    variants: string[];
    years: { min: number; max: number };
    registrationCities: string[];
    locations: string[];
    engineCapacity: { min: number; max: number };
    bodyColors: string[];
    kmDriven: { min: number; max: number };
    price: { min: number; max: number };
    fuelTypes: string[];
    engineTypes: string[];
    
    // Special Filters
    isFeatured: boolean;
  }) => void;
}

const BikeFilterModal = ({ visible, onClose, onApplyFilters }: BikeFilterModalProps) => {
  // Basic Filter States
  const [selectedCompanies, setSelectedCompanies] = useState<string[]>([]);
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
  
  const [selectedRegistrationCities, setSelectedRegistrationCities] = useState<string[]>([]);
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const [engineRange, setEngineRange] = useState({ min: 50, max: 1000 });
  const [fromEngine, setFromEngine] = useState("50");
  const [toEngine, setToEngine] = useState("1000");
  // Refs for engine inputs
  const fromEngineInputRef = useRef<TextInput>(null);
  const toEngineInputRef = useRef<TextInput>(null);
  const fromEngineValueRef = useRef("50");
  const toEngineValueRef = useRef("1000");
  // State for converted words display (green text)
  const [fromEngineWords, setFromEngineWords] = useState("");
  const [toEngineWords, setToEngineWords] = useState("");
  const [selectedBodyColors, setSelectedBodyColors] = useState<string[]>([]);
  const [kmRange, setKmRange] = useState({ min: 0, max: 100000 });
  const [fromKm, setFromKm] = useState("0");
  const [toKm, setToKm] = useState("100000");
  // Refs for km inputs
  const fromKmInputRef = useRef<TextInput>(null);
  const toKmInputRef = useRef<TextInput>(null);
  const fromKmValueRef = useRef("0");
  const toKmValueRef = useRef("100000");
  // State for converted words display (green text)
  const [fromKmWords, setFromKmWords] = useState("");
  const [toKmWords, setToKmWords] = useState("");
  const [priceRange, setPriceRange] = useState({ min: 0, max: 2000000 });
  const [fromPrice, setFromPrice] = useState("0");
  const [toPrice, setToPrice] = useState("2000000");
  // Refs for price inputs
  const fromPriceInputRef = useRef<TextInput>(null);
  const toPriceInputRef = useRef<TextInput>(null);
  const fromPriceValueRef = useRef("0");
  const toPriceValueRef = useRef("2000000");
  // State for converted words display (green text)
  const [fromPriceWords, setFromPriceWords] = useState("");
  const [toPriceWords, setToPriceWords] = useState("");
  const [selectedFuelTypes, setSelectedFuelTypes] = useState<string[]>([]);
  const [selectedEngineTypes, setSelectedEngineTypes] = useState<string[]>([]);
  
  // Special Filter States
  const [isFeatured, setIsFeatured] = useState(false);
  
  // Company - full screen picker page with search & multi-select
  const [showCompanyPicker, setShowCompanyPicker] = useState(false);
  const [companyQuery, setCompanyQuery] = useState("");
  // Model - full screen picker page with search & multi-select
  const [showModelPicker, setShowModelPicker] = useState(false);
  const [modelQuery, setModelQuery] = useState("");
  // Variant - full screen picker page with search & multi-select
  const [showVariantPicker, setShowVariantPicker] = useState(false);
  const [variantQuery, setVariantQuery] = useState("");
  // Registration City - full screen picker page with search & multi-select
  const [showRegistrationCityPicker, setShowRegistrationCityPicker] = useState(false);
  const [registrationCityQuery, setRegistrationCityQuery] = useState("");
  // Location City - full screen picker page with search & multi-select
  const [showLocationCityPicker, setShowLocationCityPicker] = useState(false);
  const [locationCityQuery, setLocationCityQuery] = useState("");
  // Body Color - full screen picker page with search & multi-select
  const [showBodyColorPicker, setShowBodyColorPicker] = useState(false);
  const [bodyColorQuery, setBodyColorQuery] = useState("");
  
  // Increase/decrease functions for Year
  const increaseFromYear = () => {
    const currentVal = fromYearValueRef.current || fromYear || "1970";
    const currentNum = parseInt(currentVal) || 1970;
    const newVal = currentNum + 1;
    const displayValue = newVal.toString();
    const clamped = Math.max(1970, Math.min(newVal, new Date().getFullYear()));
    
    fromYearValueRef.current = displayValue;
    setFromYear(displayValue);
    setYearRange(prev => ({ ...prev, min: clamped }));
    
    if (fromYearInputRef.current) {
      fromYearInputRef.current.setNativeProps({ text: displayValue });
    }
  };
  
  const decreaseFromYear = () => {
    const currentVal = fromYearValueRef.current || fromYear || "1970";
    const currentNum = parseInt(currentVal) || 1970;
    const newVal = currentNum - 1;
    const displayValue = newVal.toString();
    const clamped = Math.max(1970, Math.min(newVal, new Date().getFullYear()));
    
    fromYearValueRef.current = displayValue;
    setFromYear(displayValue);
    setYearRange(prev => ({ ...prev, min: clamped }));
    
    if (fromYearInputRef.current) {
      fromYearInputRef.current.setNativeProps({ text: displayValue });
    }
  };
  
  const increaseToYear = () => {
    const currentVal = toYearValueRef.current || toYear || new Date().getFullYear().toString();
    const currentNum = parseInt(currentVal) || new Date().getFullYear();
    const newVal = currentNum + 1;
    const displayValue = newVal.toString();
  const currentYear = new Date().getFullYear();
    const clamped = Math.max(1970, Math.min(newVal, currentYear));
    
    toYearValueRef.current = displayValue;
    setToYear(displayValue);
    setYearRange(prev => ({ ...prev, max: clamped }));
    
    if (toYearInputRef.current) {
      toYearInputRef.current.setNativeProps({ text: displayValue });
    }
  };
  
  const decreaseToYear = () => {
    const currentVal = toYearValueRef.current || toYear || new Date().getFullYear().toString();
    const currentNum = parseInt(currentVal) || new Date().getFullYear();
    const newVal = currentNum - 1;
    const displayValue = newVal.toString();
    const currentYear = new Date().getFullYear();
    const clamped = Math.max(1970, Math.min(newVal, currentYear));
    
    toYearValueRef.current = displayValue;
    setToYear(displayValue);
    setYearRange(prev => ({ ...prev, max: clamped }));
    
    if (toYearInputRef.current) {
      toYearInputRef.current.setNativeProps({ text: displayValue });
    }
  };

  // Data Arrays
  const companies = [
    "All Companies", "Honda", "Yamaha", "Suzuki", "Kawasaki", "Bajaj", "TVS", "Hero", 
    "Royal Enfield", "KTM", "Ducati", "BMW", "Harley Davidson", "Triumph", "Aprilia",
    "KTM", "Benelli", "MV Agusta", "Moto Guzzi", "Indian", "Victory", "Husqvarna"
  ];

  // Master models list (fallback when no company selected)
  const models = [
    "All Models",
    "CD-70", "CG-125", "CB-150F", "CBR-150R", "CBR-250R", "CBR-600RR", 
    "CBR-1000RR", "VFR-800", "VFR-1200F", "Gold Wing", "Shadow", "Rebel", "Africa Twin",
    "YZF-R1", "YZF-R6", "MT-07", "MT-09", "FZ-16", "FZ-S", "R15", "R3", "R6", "R1",
    "GSX-R600", "GSX-R750", "GSX-R1000", "GSX-S750", "GSX-S1000", "V-Strom", "Boulevard",
    "Ninja 300", "Ninja 400", "Ninja 650", "Ninja ZX-6R", "Ninja ZX-10R", "Versys", "Vulcan",
    "Pulsar 150", "Pulsar 200", "Pulsar 220", "Pulsar NS200", "Pulsar RS200", "Avenger",
    "Discover", "Platina", "CT 100", "Boxer", "V15", "Dominar", "KTM 200", "KTM 390",
    "Classic 350", "Classic 500", "Bullet 350", "Bullet 500", "Thunderbird", "Continental GT",
    "Interceptor 650", "Himalayan", "Scram 411", "Super Meteor 650", "Hunter 350"
  ];

  // Company → Models mapping for bikes (similar idea as brand→model in cars)
  const companyToModelsMap: { [key: string]: string[] } = {
    Honda: ["CD-70", "CG-125", "CB-150F", "CBR-150R", "CBR-250R", "CBR-600RR", "CBR-1000RR", "Gold Wing", "Shadow", "Rebel", "Africa Twin"],
    Yamaha: ["YZF-R1", "YZF-R6", "MT-07", "MT-09", "FZ-16", "FZ-S", "R15", "R3"],
    Suzuki: ["GSX-R600", "GSX-R750", "GSX-R1000", "GSX-S750", "GSX-S1000", "V-Strom", "Boulevard"],
    Kawasaki: ["Ninja 300", "Ninja 400", "Ninja 650", "Ninja ZX-6R", "Ninja ZX-10R", "Versys", "Vulcan"],
    Bajaj: ["Pulsar 150", "Pulsar 200", "Pulsar 220", "Pulsar NS200", "Pulsar RS200", "Avenger", "Discover", "Platina", "CT 100", "Boxer", "V15", "Dominar"],
    "Royal Enfield": ["Classic 350", "Classic 500", "Bullet 350", "Bullet 500", "Thunderbird", "Continental GT", "Interceptor 650", "Himalayan", "Scram 411", "Super Meteor 650", "Hunter 350"],
    // You can extend this mapping for more companies if needed
  };

  // Master variants list (generic bike variants)
  const variants = [
    "All Variants",
    "Standard",
    "Self Start",
    "Kick Start",
    "Special Edition",
    "Limited Edition",
    "Euro 2",
    "Euro 5",
    "ABS",
    "Non-ABS",
    "Alloy Rim",
    "Spoke Rim",
  ];

  const cities = [
    "All Cities", "Lahore", "Karachi", "Islamabad", "Rawalpindi", "Multan", 
    "Faisalabad", "Peshawar", "Quetta", "Sialkot", "Gujranwala", "Sargodha", 
    "Bahawalpur", "Sukkur", "Larkana", "Sheikhupura", "Rahim Yar Khan", "Gujrat",
    "Mardan", "Mingora", "Nawabshah", "Chiniot", "Kotri", "Kāmoke", "Hafizabad", "Kohat"
  ];

  const bodyColors = [
    "All Colors", "White", "Black", "Red", "Blue", "Green", "Yellow", "Orange", 
    "Silver", "Gray", "Brown", "Purple", "Gold", "Beige", "Maroon", "Navy",
    "Pearl White", "Metallic Silver", "Champagne", "Bronze", "Copper", "Matte Black",
    "Carbon Fiber", "Chrome", "Titanium", "Gunmetal"
  ];

  const fuelTypes = [
    "All Fuel Types", "Petrol", "Hybrid", "Electric"
  ];

  const engineTypes = [
    "All Engine Types", "2 Stroke", "4 Stroke", "Electric"
  ];

  // Filtered models list based on selected companies
  const filteredModels = useMemo(() => {
    const specificCompanies = selectedCompanies.filter(
      (c) => c !== "All Companies" && c.trim() !== ""
    );

    // No specific company → use full models list (with "All Models")
    if (specificCompanies.length === 0) {
      return models;
    }

    const result = new Set<string>();

    specificCompanies.forEach((company) => {
      const trimmed = company.trim();
      const key = Object.keys(companyToModelsMap).find(
        (k) => k === trimmed || k.toLowerCase() === trimmed.toLowerCase()
      );

      if (key && companyToModelsMap[key]) {
        companyToModelsMap[key].forEach((m) => {
          if (m && m.trim() !== "" && m.trim() !== "All Models") {
            result.add(m);
          }
        });
      }
    });

    return Array.from(result).sort();
  }, [selectedCompanies]);

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

  // Increase/decrease functions for Engine Capacity
  const increaseFromEngine = () => {
    const currentVal = fromEngineValueRef.current || fromEngine || "50";
    const currentNum = parseInt(currentVal) || 50;
    const newVal = currentNum + 10;
    const displayValue = newVal.toString();
    const clamped = Math.max(50, Math.min(newVal, 1000));
    
    fromEngineValueRef.current = displayValue;
    setFromEngine(displayValue);
    setFromEngineWords(newVal > 0 ? `${newVal} cc` : "");
    setEngineRange(prev => ({ ...prev, min: clamped }));
    
    if (fromEngineInputRef.current) {
      fromEngineInputRef.current.setNativeProps({ text: displayValue });
    }
  };
  
  const decreaseFromEngine = () => {
    const currentVal = fromEngineValueRef.current || fromEngine || "50";
    const currentNum = parseInt(currentVal) || 50;
    const newVal = Math.max(50, currentNum - 10);
    const displayValue = newVal.toString();
    const clamped = Math.max(50, Math.min(newVal, 1000));
    
    fromEngineValueRef.current = displayValue;
    setFromEngine(displayValue);
    setFromEngineWords(newVal > 0 ? `${newVal} cc` : "");
    setEngineRange(prev => ({ ...prev, min: clamped }));
    
    if (fromEngineInputRef.current) {
      fromEngineInputRef.current.setNativeProps({ text: displayValue });
    }
  };
  
  const increaseToEngine = () => {
    const currentVal = toEngineValueRef.current || toEngine || "1000";
    const currentNum = parseInt(currentVal) || 1000;
    const newVal = currentNum + 10;
    const displayValue = newVal.toString();
    const clamped = Math.max(50, Math.min(newVal, 1000));
    
    toEngineValueRef.current = displayValue;
    setToEngine(displayValue);
    setToEngineWords(newVal > 0 ? `${newVal} cc` : "");
    setEngineRange(prev => ({ ...prev, max: clamped }));
    
    if (toEngineInputRef.current) {
      toEngineInputRef.current.setNativeProps({ text: displayValue });
    }
  };
  
  const decreaseToEngine = () => {
    const currentVal = toEngineValueRef.current || toEngine || "1000";
    const currentNum = parseInt(currentVal) || 1000;
    const newVal = Math.max(50, currentNum - 10);
    const displayValue = newVal.toString();
    const clamped = Math.max(50, Math.min(newVal, 1000));
    
    toEngineValueRef.current = displayValue;
    setToEngine(displayValue);
    setToEngineWords(newVal > 0 ? `${newVal} cc` : "");
    setEngineRange(prev => ({ ...prev, max: clamped }));
    
    if (toEngineInputRef.current) {
      toEngineInputRef.current.setNativeProps({ text: displayValue });
    }
  };

  // Increase/decrease functions for Kilometers
  const increaseFromKm = () => {
    const currentVal = fromKmValueRef.current || fromKm || "0";
    const currentNum = parseInt(currentVal) || 0;
    const newVal = currentNum + 1000;
    const displayValue = newVal.toString();
    const clamped = Math.max(0, Math.min(newVal, 100000));
    
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
    const clamped = Math.max(0, Math.min(newVal, 100000));
    
    fromKmValueRef.current = displayValue;
    setFromKm(displayValue);
    setFromKmWords(numberToWords(newVal));
    setKmRange(prev => ({ ...prev, min: clamped }));
    
    if (fromKmInputRef.current) {
      fromKmInputRef.current.setNativeProps({ text: displayValue });
    }
  };
  
  const increaseToKm = () => {
    const currentVal = toKmValueRef.current || toKm || "100000";
    const currentNum = parseInt(currentVal) || 100000;
    const newVal = currentNum + 1000;
    const displayValue = newVal.toString();
    const clamped = Math.max(0, Math.min(newVal, 100000));
    
    toKmValueRef.current = displayValue;
    setToKm(displayValue);
    setToKmWords(numberToWords(newVal));
    setKmRange(prev => ({ ...prev, max: clamped }));
    
    if (toKmInputRef.current) {
      toKmInputRef.current.setNativeProps({ text: displayValue });
    }
  };
  
  const decreaseToKm = () => {
    const currentVal = toKmValueRef.current || toKm || "100000";
    const currentNum = parseInt(currentVal) || 100000;
    const newVal = Math.max(0, currentNum - 1000);
    const displayValue = newVal.toString();
    const clamped = Math.max(0, Math.min(newVal, 100000));
    
    toKmValueRef.current = displayValue;
    setToKm(displayValue);
    setToKmWords(numberToWords(newVal));
    setKmRange(prev => ({ ...prev, max: clamped }));
    
    if (toKmInputRef.current) {
      toKmInputRef.current.setNativeProps({ text: displayValue });
    }
  };

  // Increase/decrease functions for Price
  const increaseFromPrice = () => {
    const currentVal = fromPriceValueRef.current || fromPrice || "0";
    const currentNum = parseInt(currentVal) || 0;
    const newVal = currentNum + 50000;
    const displayValue = newVal.toString();
    const clamped = Math.max(0, Math.min(newVal, 2000000));
    
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
    const newVal = Math.max(0, currentNum - 50000);
    const displayValue = newVal.toString();
    const clamped = Math.max(0, Math.min(newVal, 2000000));
    
    fromPriceValueRef.current = displayValue;
    setFromPrice(displayValue);
    setFromPriceWords(numberToWords(newVal));
    setPriceRange(prev => ({ ...prev, min: clamped }));
    
    if (fromPriceInputRef.current) {
      fromPriceInputRef.current.setNativeProps({ text: displayValue });
    }
  };
  
  const increaseToPrice = () => {
    const currentVal = toPriceValueRef.current || toPrice || "2000000";
    const currentNum = parseInt(currentVal) || 2000000;
    const newVal = currentNum + 50000;
    const displayValue = newVal.toString();
    const clamped = Math.max(0, Math.min(newVal, 2000000));
    
    toPriceValueRef.current = displayValue;
    setToPrice(displayValue);
    setToPriceWords(numberToWords(newVal));
    setPriceRange(prev => ({ ...prev, max: clamped }));
    
    if (toPriceInputRef.current) {
      toPriceInputRef.current.setNativeProps({ text: displayValue });
    }
  };
  
  const decreaseToPrice = () => {
    const currentVal = toPriceValueRef.current || toPrice || "2000000";
    const currentNum = parseInt(currentVal) || 2000000;
    const newVal = Math.max(0, currentNum - 50000);
    const displayValue = newVal.toString();
    const clamped = Math.max(0, Math.min(newVal, 2000000));
    
    toPriceValueRef.current = displayValue;
    setToPrice(displayValue);
    setToPriceWords(numberToWords(newVal));
    setPriceRange(prev => ({ ...prev, max: clamped }));
    
    if (toPriceInputRef.current) {
      toPriceInputRef.current.setNativeProps({ text: displayValue });
    }
  };

  // Toggle selection helper
  const toggleSelection = <T,>(
    option: T, 
    setSelected: React.Dispatch<React.SetStateAction<T[]>>, 
    selectedList: T[]
  ) => {
    if (option === "All Companies" || option === "All Models" || option === "All Cities" || 
        option === "All Colors" || option === "All Fuel Types" || option === "All Engine Types") {
      setSelected(selectedList.includes(option) ? [] : [option]);
    } else {
      if (selectedList.includes(option)) {
        setSelected(selectedList.filter((item) => item !== option));
      } else {
        setSelected([...selectedList, option]);
      }
    }
  };

  const handleReset = () => {
    setSelectedCompanies([]);
    setSelectedModels([]);
    setSelectedVariants([]);
    setYearRange({ min: 1970, max: new Date().getFullYear() });
    setFromYear("1970");
    setToYear(new Date().getFullYear().toString());
    fromYearValueRef.current = "1970";
    toYearValueRef.current = new Date().getFullYear().toString();
    setSelectedRegistrationCities([]);
    setSelectedLocations([]);
    setEngineRange({ min: 50, max: 1000 });
    setFromEngine("50");
    setToEngine("1000");
    fromEngineValueRef.current = "50";
    toEngineValueRef.current = "1000";
    setFromEngineWords("");
    setToEngineWords("");
    setSelectedBodyColors([]);
    setKmRange({ min: 0, max: 100000 });
    setFromKm("0");
    setToKm("100000");
    fromKmValueRef.current = "0";
    toKmValueRef.current = "100000";
    setFromKmWords("");
    setToKmWords("");
    setPriceRange({ min: 0, max: 2000000 });
    setFromPrice("0");
    setToPrice("2000000");
    fromPriceValueRef.current = "0";
    toPriceValueRef.current = "2000000";
    setFromPriceWords("");
    setToPriceWords("");
    setSelectedFuelTypes([]);
    setSelectedEngineTypes([]);
    setIsFeatured(false);
    // Reset picker states
    setShowCompanyPicker(false);
    setCompanyQuery("");
    setShowModelPicker(false);
    setModelQuery("");
    setShowRegistrationCityPicker(false);
    setRegistrationCityQuery("");
    setShowLocationCityPicker(false);
    setLocationCityQuery("");
    setShowBodyColorPicker(false);
    setBodyColorQuery("");
  };

  // Reset filters when modal opens (refreshes page)
  useEffect(() => {
    if (visible) {
      // Reset all filters when modal opens
      setSelectedCompanies([]);
      setSelectedModels([]);
      setYearRange({ min: 1970, max: new Date().getFullYear() });
      setFromYear("1970");
      setToYear(new Date().getFullYear().toString());
      fromYearValueRef.current = "1970";
      toYearValueRef.current = new Date().getFullYear().toString();
      setSelectedRegistrationCities([]);
      setSelectedLocations([]);
      setEngineRange({ min: 50, max: 1000 });
      setFromEngine("50");
      setToEngine("1000");
      fromEngineValueRef.current = "50";
      toEngineValueRef.current = "1000";
      setFromEngineWords("");
      setToEngineWords("");
      setSelectedBodyColors([]);
      setKmRange({ min: 0, max: 100000 });
      setFromKm("0");
      setToKm("100000");
      fromKmValueRef.current = "0";
      toKmValueRef.current = "100000";
      setFromKmWords("");
      setToKmWords("");
      setPriceRange({ min: 0, max: 2000000 });
      setFromPrice("0");
      setToPrice("2000000");
      fromPriceValueRef.current = "0";
      toPriceValueRef.current = "2000000";
      setFromPriceWords("");
      setToPriceWords("");
      setSelectedFuelTypes([]);
      setSelectedEngineTypes([]);
      setIsFeatured(false);
      setShowCompanyPicker(false);
      setCompanyQuery("");
      setShowModelPicker(false);
      setModelQuery("");
      setShowRegistrationCityPicker(false);
      setRegistrationCityQuery("");
      setShowLocationCityPicker(false);
      setLocationCityQuery("");
      setShowBodyColorPicker(false);
      setBodyColorQuery("");
    }
  }, [visible]);

  const handleApplyFilters = () => {
    onApplyFilters({
      companies: selectedCompanies || [],
      models: selectedModels || [],
      variants: selectedVariants || [],
      years: yearRange || { min: 1970, max: new Date().getFullYear() },
      registrationCities: selectedRegistrationCities || [],
      locations: selectedLocations || [],
      engineCapacity: engineRange || { min: 50, max: 1000 },
      bodyColors: selectedBodyColors || [],
      kmDriven: kmRange || { min: 0, max: 100000 },
      price: priceRange || { min: 0, max: 2000000 },
      fuelTypes: selectedFuelTypes || [],
      engineTypes: selectedEngineTypes || [],
      isFeatured: isFeatured || false,
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
          selectedStyle={styles.sliderSelected}
          unselectedStyle={styles.sliderUnselected}
          trackStyle={styles.sliderTrack}
          markerStyle={styles.sliderThumb}
          containerStyle={[styles.sliderContainer, { height: 60 }]}
          touchDimensions={{
            height: 80,
            width: 80,
            slipDisplacement: 500,
          }}
          pressedMarkerStyle={styles.sliderThumb}
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
            <Text style={styles.modalTitle}>Used Bike Filters</Text>
            <TouchableOpacity onPress={handleReset}>
              <Text style={styles.resetText}>Reset</Text>
            </TouchableOpacity>
          </View>

          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={true}>
            
            {/* Company Filter - full flow: Company → Model → Variant (chips shown together) */}
            <FilterSection title="Company Name">
              <TouchableOpacity
                style={styles.searchBox}
                onPress={() => {
                  setShowCompanyPicker(true);
                  setCompanyQuery("");
                }}
              >
                <Ionicons name="search" size={18} color="#999" style={{ marginRight: 6 }} />
                <Text style={styles.searchPlaceholder}>
                  Select company, model & variant
                </Text>
              </TouchableOpacity>

              {/* Selected company / model / variant chips (combined like Used Cars) */}
              {(selectedCompanies.length > 0 ||
                selectedModels.length > 0 ||
                selectedVariants.length > 0) && (
                <View style={styles.chipsContainer}>
                  {(() => {
                    const primaryCompany =
                      selectedCompanies.find(c => c !== "All Companies") || "";
                    const primaryModel =
                      selectedModels.find(m => m !== "All Models") || "";
                    const primaryVariants = selectedVariants.filter(
                      v => v !== "All Variants"
                    );

                    const parts = [
                      primaryCompany,
                      primaryModel,
                      primaryVariants.join(", "),
                    ].filter(Boolean);

                    if (parts.length === 0) return null;

                    const label = parts.join(" ");

                    return (
                      <View style={styles.chip}>
                        <Text style={styles.chipText}>{label}</Text>
                        <TouchableOpacity
                          style={styles.chipRemove}
                          onPress={() => {
                            // Clear all three selections together
                            setSelectedCompanies([]);
                            setSelectedModels([]);
                            setSelectedVariants([]);
                          }}
                        >
                          <Ionicons
                            name="close"
                            size={14}
                            color="#666"
                          />
                        </TouchableOpacity>
                      </View>
                    );
                  })()}
                </View>
              )}
            </FilterSection>

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
                      <Text style={styles.chipText}>{city}</Text>
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

            {/* Location - clickable row opens full-screen searchable, multi-select list */}
            <FilterSection title="Location">
              <TouchableOpacity
                activeOpacity={0.9}
                style={styles.searchBox}
                onPress={() => {
                  setShowLocationCityPicker(true);
                  setLocationCityQuery("");
                }}
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
                      <TouchableOpacity
                        style={styles.chipRemove}
                        onPress={() => setSelectedLocations(selectedLocations.filter(c => c !== city))}
                      >
                        <Ionicons name="close" size={14} color="#CD0100" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
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
                        placeholder="50"
                        inputRef={fromEngineInputRef}
                        valueRef={fromEngineValueRef}
                        onBlur={(text) => {
                          Keyboard.dismiss();
                          const displayValue = text.trim() || "50";
                          const num = parseInt(displayValue) || 50;
                          const clamped = Math.max(50, Math.min(num, 1000));
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
                        placeholder="1000"
                        inputRef={toEngineInputRef}
                        valueRef={toEngineValueRef}
                        onBlur={(text) => {
                          Keyboard.dismiss();
                          const displayValue = text.trim() || "1000";
                          const num = parseInt(displayValue) || 1000;
                          const clamped = Math.max(50, Math.min(num, 1000));
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

            {/* Body Color - clickable row opens full-screen searchable, multi-select list */}
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
              {selectedBodyColors.length > 0 && (
                <View style={styles.chipsContainer}>
                  {selectedBodyColors.filter(color => color !== "All Colors").map((color, idx) => (
                    <View key={`${color}-${idx}`} style={styles.chip}>
                      <Text style={styles.chipText}>{color}</Text>
                      <TouchableOpacity
                        style={styles.chipRemove}
                        onPress={() => setSelectedBodyColors(selectedBodyColors.filter(c => c !== color))}
                      >
                        <Ionicons name="close" size={14} color="#CD0100" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
            </FilterSection>

            {/* KM Driven - Same design as Model Year */}
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
                          const clamped = Math.max(0, Math.min(num, 100000));
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
                        placeholder="100000"
                        inputRef={toKmInputRef}
                        valueRef={toKmValueRef}
                        onBlur={(text) => {
                          Keyboard.dismiss();
                          const displayValue = text.trim() || "100000";
                          const num = parseInt(displayValue) || 100000;
                          const clamped = Math.max(0, Math.min(num, 100000));
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
                          const clamped = Math.max(0, Math.min(num, 2000000));
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
                        placeholder="2000000"
                        inputRef={toPriceInputRef}
                        valueRef={toPriceValueRef}
                        onBlur={(text) => {
                          Keyboard.dismiss();
                          const displayValue = text.trim() || "2000000";
                          const num = parseInt(displayValue) || 2000000;
                          const clamped = Math.max(0, Math.min(num, 2000000));
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

            {/* Engine Type */}
            <FilterSection title="Engine Type">
              <MultiSelectButtons
                options={engineTypes}
                selected={selectedEngineTypes}
                onToggle={(option) => toggleSelection(option, setSelectedEngineTypes, selectedEngineTypes)}
              />
            </FilterSection>

            {/* Special Filters */}
            <FilterSection title="Special Features">
              <View style={styles.switchContainer}>
                <View style={styles.switchRow}>
                  <Text style={styles.switchLabel}>Featured Ads</Text>
                  <Switch
                    value={isFeatured}
                    onValueChange={setIsFeatured}
                    trackColor={{ false: "#767577", true: "#CD0100" }}
                    thumbColor={isFeatured ? "#fff" : "#f4f3f4"}
                  />
                </View>
              </View>
            </FilterSection>

          </ScrollView>
          </TouchableWithoutFeedback>

          {/* Fixed Bottom Button */}
          <View style={styles.bottomContainer}>
            <TouchableOpacity style={styles.applyButton} onPress={handleApplyFilters}>
              <Text style={styles.applyButtonText}>Apply Filters</Text>
            </TouchableOpacity>
          </View>

          {/* Full-screen Company overlay (rendered above content) */}
          {showCompanyPicker && (
            <View style={styles.overlayFull}>
              <View style={styles.fullPageHeader}>
                <TouchableOpacity onPress={() => { Keyboard.dismiss(); setShowCompanyPicker(false); setCompanyQuery(""); }}>
                  <Ionicons name="arrow-back" size={22} color="#333" />
                </TouchableOpacity>
                <Text style={styles.fullPageTitle}>Select Companies</Text>
                <View style={{ width: 22 }} />
              </View>

              <View style={[styles.searchBox, { marginHorizontal: 16, marginBottom: 10 }]}> 
                <Ionicons name="search" size={18} color="#999" style={{ marginRight: 6 }} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Type to search"
                  placeholderTextColor="#999"
                  value={companyQuery}
                  onChangeText={setCompanyQuery}
                  autoFocus
                  blurOnSubmit
                  returnKeyType="search"
                  onSubmitEditing={() => Keyboard.dismiss()}
                />
              </View>

              <ScrollView style={{ flex: 1, marginHorizontal: 16 }} keyboardShouldPersistTaps="always">
                {(companyQuery
                  ? companies.filter(c => c.toLowerCase().includes(companyQuery.toLowerCase()))
                    : companies
                ).map((c, idx) => {
                  const selected = selectedCompanies.includes(c);
                  return (
                    <TouchableOpacity
                      key={`${c}-${idx}`}
                      style={[styles.categoryRow, selected && styles.categoryRowSelected]}
                      onPress={() => {
                        // Custom toggle logic so "All Companies" behaves exclusively
                        if (c === "All Companies") {
                          setSelectedCompanies(
                            selectedCompanies.includes("All Companies")
                              ? []
                              : ["All Companies"]
                          );
                        } else {
                          const withoutAll = selectedCompanies.filter(
                            (x) => x !== "All Companies"
                          );
                          const exists = withoutAll.includes(c);
                          setSelectedCompanies(
                            exists
                              ? withoutAll.filter((x) => x !== c)
                              : [...withoutAll, c]
                          );
                        }
                        // Company change → clear models & variants so flow stays consistent
                        setSelectedModels([]);
                        setSelectedVariants([]);
                      }}
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
                  onPress={() => { 
                    Keyboard.dismiss(); 
                    setShowCompanyPicker(false); 
                    setCompanyQuery(""); 
                    // After choosing company, go straight to model selection
                    setShowModelPicker(true);
                  }}
                >
                  <Text style={styles.applyButtonText}>Done</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Full-screen Model overlay (rendered above content) */}
          {showModelPicker && (
            <View style={styles.overlayFull}>
              <View style={styles.fullPageHeader}>
                <TouchableOpacity onPress={() => { Keyboard.dismiss(); setShowModelPicker(false); setModelQuery(""); }}>
                  <Ionicons name="arrow-back" size={22} color="#333" />
                </TouchableOpacity>
                <Text style={styles.fullPageTitle}>Select Models</Text>
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
                    ? filteredModels.filter((m) =>
                        m.toLowerCase().includes(modelQuery.toLowerCase())
                      )
                    : filteredModels
                ).map((m, idx) => {
                  const selected = selectedModels.includes(m);
                  return (
                    <TouchableOpacity
                      key={`${m}-${idx}`}
                      style={[styles.categoryRow, selected && styles.categoryRowSelected]}
                      onPress={() => {
                        // "All Models" acts exclusively, but only when using full list
                        if (m === "All Models") {
                          setSelectedModels(
                            selectedModels.includes("All Models")
                              ? []
                              : ["All Models"]
                          );
                        } else {
                          const withoutAll = selectedModels.filter(
                            (x) => x !== "All Models"
                          );
                          const exists = withoutAll.includes(m);
                          setSelectedModels(
                            exists
                              ? withoutAll.filter((x) => x !== m)
                              : [...withoutAll, m]
                          );
                        }
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

              <View style={{ padding: 16 }}>
                <TouchableOpacity
                  style={styles.applyButton}
                  onPress={() => { 
                    Keyboard.dismiss(); 
                    setShowModelPicker(false); 
                    setModelQuery(""); 
                    // After choosing model, go straight to variant selection
                    setShowVariantPicker(true);
                  }}
                >
                  <Text style={styles.applyButtonText}>Done</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Full-screen Variant overlay (rendered above content) */}
          {showVariantPicker && (
            <View style={styles.overlayFull}>
              <View style={styles.fullPageHeader}>
                <TouchableOpacity onPress={() => { Keyboard.dismiss(); setShowVariantPicker(false); setVariantQuery(""); }}>
                  <Ionicons name="arrow-back" size={22} color="#333" />
                </TouchableOpacity>
                <Text style={styles.fullPageTitle}>Select Variants</Text>
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
                {(variantQuery
                  ? variants.filter(v => v.toLowerCase().includes(variantQuery.toLowerCase()))
                  : variants
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

              <View style={{ padding: 16 }}>
                <TouchableOpacity
                  style={styles.applyButton}
                  onPress={() => { Keyboard.dismiss(); setShowVariantPicker(false); setVariantQuery(""); }}
                >
                  <Text style={styles.applyButtonText}>Done</Text>
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

          {/* Full-screen Location City overlay */}
          {showLocationCityPicker && (
            <View style={styles.overlayFull}>
              <View style={styles.fullPageHeader}>
                <TouchableOpacity onPress={() => { Keyboard.dismiss(); setShowLocationCityPicker(false); setLocationCityQuery(""); }}>
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
                  ? bodyColors.filter(c => c.toLowerCase().includes(bodyColorQuery.toLowerCase()))
                  : bodyColors
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
              </ScrollView>

              <View style={{ padding: 16 }}>
                <TouchableOpacity
                  style={styles.applyButton}
                  onPress={() => { Keyboard.dismiss(); setShowBodyColorPicker(false); setBodyColorQuery(""); }}
                >
                  <Text style={styles.applyButtonText}>Done</Text>
                </TouchableOpacity>
              </View>
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
});

export default BikeFilterModal;