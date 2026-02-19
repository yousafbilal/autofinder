import React, { useEffect, useRef, useState } from "react"
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { FontAwesome5, Ionicons } from "@expo/vector-icons"
import * as ImagePicker from "expo-image-picker"
import { COLORS } from "../../constants/colors"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { API_URL } from "../../../config"
import { NavigationProp, useNavigation, useRoute } from "@react-navigation/native";
import { RootStackParamList } from "../../../navigationTypes";
import DropDownPicker from "react-native-dropdown-picker"
import { pakistaniCities } from "../../Components/EnhancedDropdownData"

const CARQUERY_BASE = "https://www.carqueryapi.com/api/0.3/?";

const parseCarQuery = (raw: string): any => {
  try {
    return JSON.parse(raw);
  } catch (_) {
    const first = raw.indexOf("{");
    const last = raw.lastIndexOf("}");
    if (first !== -1 && last !== -1) {
      const slice = raw.substring(first, last + 1);
      try { return JSON.parse(slice); } catch (_) {}
    }
  }
  return {};
};

// Year range configuration
const MIN_YEAR = 1900;
const MAX_YEAR = 2025;
const buildYearRange = (min: number, max: number): { label: string; value: string }[] => {
  const out: { label: string; value: string }[] = [];
  for (let y = max; y >= min; y--) out.push({ label: String(y), value: String(y) });
  return out;
};

const OFFLINE_YEARS: { label: string; value: string }[] = buildYearRange(MIN_YEAR, MAX_YEAR);

// Offline fallback data (popular brands/models/variants)
const OFFLINE_MAKE_TO_MODELS: Record<string, string[]> = {
  Toyota: ["Corolla", "Yaris", "Fortuner", "Hilux"],
  Honda: ["Civic", "City", "BR-V"],
  Suzuki: ["Alto", "Cultus", "Swift", "Wagon R"],
  Kia: ["Sportage", "Picanto", "Sorento"],
  Hyundai: ["Tucson", "Elantra", "Sonata"],
  Nissan: ["Note", "Sunny"],
  BMW: ["3 Series", "5 Series"],
  Mercedes: ["C Class", "E Class"],
};
const OFFLINE_VARIANTS: Record<string, Record<string, string[]>> = {
  Toyota: {
    Corolla: ["XLi", "GLi", "Altis", "Grande"],
    Yaris: ["1.3 GLi", "Ativ X"],
    Fortuner: ["Sigma 4", "V"],
    Hilux: ["Revo G", "Revo V"],
  },
  Honda: {
    Civic: ["Oriel", "Turbo RS"],
    City: ["1.3", "1.5 Aspire"],
    "BR-V": ["i-VTEC", "S"],
  },
  Suzuki: {
    Alto: ["VX", "VXR", "VXL"],
    Cultus: ["VXR", "VXL", "AGS"],
    Swift: ["GL", "GLX"],
    "Wagon R": ["VXR", "VXL"],
  },
  Kia: {
    Sportage: ["Alpha", "FWD", "AWD"],
    Picanto: ["MT", "AT"],
  },
  Hyundai: {
    Tucson: ["FWD", "AWD"],
    Elantra: ["GLS", "GL"],
    Sonata: ["2.0", "2.5"],
  },
  Nissan: {
    Note: ["e-Power", "X"],
    Sunny: ["S", "SV"],
  },
  BMW: {
    "3 Series": ["320i", "330i"],
    "5 Series": ["520i", "530e"],
  },
  Mercedes: {
    "C Class": ["C180", "C200"],
    "E Class": ["E200", "E300"],
  },
};

const getOfflineMakes = (): { label: string; value: string }[] =>
  Object.keys(OFFLINE_MAKE_TO_MODELS).map(m => ({ label: m, value: m }));
const getOfflineModels = (makes: string[]): { label: string; value: string }[] => {
  const set = new Set<string>();
  makes.forEach(mk => (OFFLINE_MAKE_TO_MODELS[mk] || []).forEach(m => set.add(m)));
  return Array.from(set).map(m => ({ label: m, value: m }));
};
const getOfflineVariants = (makes: string[], models: string[]): { label: string; value: string }[] => {
  const set = new Set<string>();
  makes.forEach(mk => {
    models.forEach(md => (OFFLINE_VARIANTS[mk]?.[md] || []).forEach(v => set.add(v)));
  });
  if (set.size === 0) set.add("Base");
  return Array.from(set).map(v => ({ label: v, value: v }));
};

const fetchYears = async (): Promise<{ label: string; value: string }[]> => {
  const res = await fetch(`${CARQUERY_BASE}cmd=getYears`);
  const text = await res.text();
  const json = parseCarQuery(text);
  const minYearRaw = json?.Years?.min_year;
  const maxYearRaw = json?.Years?.max_year;
  if (!minYearRaw || !maxYearRaw) {
    return buildYearRange(MIN_YEAR, MAX_YEAR);
  }
  const minYear = Number(minYearRaw);
  const maxYear = Number(maxYearRaw);
  if (!Number.isFinite(minYear) || !Number.isFinite(maxYear) || minYear > maxYear) {
    return buildYearRange(MIN_YEAR, MAX_YEAR);
  }
  return buildYearRange(minYear, maxYear);
};

const fetchMakesByYear = async (year: string): Promise<{ label: string; value: string }[]> => {
  const res = await fetch(`${CARQUERY_BASE}cmd=getMakes&year=${encodeURIComponent(year)}`);
  const text = await res.text();
  const json = parseCarQuery(text);
  const makes = (json.Makes || []).map((m: any) => ({ label: m.make_display, value: m.make_display }));
  return makes;
};

const fetchModelsByMakeYear = async (make: string, year: string): Promise<{ label: string; value: string }[]> => {
  const res = await fetch(`${CARQUERY_BASE}cmd=getModels&make=${encodeURIComponent(make)}&year=${encodeURIComponent(year)}`);
  const text = await res.text();
  const json = parseCarQuery(text);
  const models = (json.Models || []).map((m: any) => ({ label: m.model_name, value: m.model_name }));
  return models;
};

const fetchVariantsByMakeModelYear = async (make: string, model: string, year: string): Promise<{ label: string; value: string }[]> => {
  const res = await fetch(`${CARQUERY_BASE}cmd=getTrims&make=${encodeURIComponent(make)}&model=${encodeURIComponent(model)}&year=${encodeURIComponent(year)}`);
  const text = await res.text();
  const json = parseCarQuery(text);
  const set = new Set<string>();
  (json.Trims || []).forEach((t: any) => {
    const v = (t.model_trim || "").toString().trim();
    if (v) set.add(v);
  });
  return Array.from(set).map((v) => ({ label: v, value: v }));
};

const BuyCarforMe = () => {
const navigation = useNavigation<NavigationProp<RootStackParamList>>();
const route = useRoute();
const params = (route.params || {}) as { preselectedYear?: string; carChoices?: { make: string; model: string }[] };
  
  const [currentStep, setCurrentStep] = useState(1)
  const scrollRef = useRef<ScrollView>(null)

  // Basic Information
  const [description, setDescription] = useState("")
  // Car Details 
  const [form, setForm] = useState({
  make: "",
  model: "",
  variant: "",
  year: "",
  registrationCity: "",

});


  // Contact Information
  const [location, setLocation] = useState("")
  const [preferredContact, setPreferredContact] = useState("phone")
  const [paymentReceipt, setPaymentReceipt] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false); // Manage loading state
  const transmissionTypes = ["Automatic", "Manual", "Semi-Automatic", "CVT"]
  const [userData, setUserData] = useState<any>(null);
  const [openYear, setOpenYear] = useState(false);
  const [selectedYear, setSelectedYear] = useState<string | null>(null);
  const [years, setYears] = useState<{ label: string; value: string }[]>([]);

  const [openMake, setOpenMake] = useState(false);
  const [selectedMakes, setSelectedMakes] = useState<string[]>([]);
  const [makes, setMakes] = useState<{ label: string; value: string }[]>([]);
  const [openModel, setOpenModel] = useState(false);
  const [selectedModels, setSelectedModels] = useState<string[]>([]);
  const [models, setModels] = useState<{ label: string; value: string }[]>([]);
  const [openVariant, setOpenVariant] = useState(false);
  const [selectedVariants, setSelectedVariants] = useState<string[]>([]);
  const [variants, setVariants] = useState<{ label: string; value: string }[]>([]);
  const [openRegistrationCity, setOpenRegistrationCity] = useState(false);
  const [selectedRegistrationCities, setSelectedRegistrationCities] = useState<string[]>([]);
  const [registrationCities, setRegistrationCities] = useState<{ label: string; value: string }[]>([])
  const [priceFrom, setPriceFrom] = useState("");
  const [priceTo, setPriceTo] = useState("");
  const [priceFromWords, setPriceFromWords] = useState("");
  const [priceToWords, setPriceToWords] = useState("");
  const [transmission, setTransmission] = useState("")

  // Chip selections for car models (make + model)
  type CarChoice = { make: string; model: string; variant?: string };
  const [carChoices, setCarChoices] = useState<CarChoice[]>([]);
  const [showAddChoice, setShowAddChoice] = useState(false);
  const [addOpenMake, setAddOpenMake] = useState(false);
  const [addSelectedMake, setAddSelectedMake] = useState<string | null>(null);
  const [addOpenModel, setAddOpenModel] = useState(false);
  const [addSelectedModel, setAddSelectedModel] = useState<string | null>(null);
  const [addModels, setAddModels] = useState<{ label: string; value: string }[]>([]);

  useEffect(() => {
    const loadAddModels = async () => {
      if (!selectedYear || !addSelectedMake) { setAddModels([]); return; }
      try {
        const md = await fetchModelsByMakeYear(addSelectedMake, selectedYear);
        setAddModels(md.length ? md : getOfflineModels([addSelectedMake]));
      } catch (e) {
        setAddModels(getOfflineModels([addSelectedMake]));
      }
    };
    loadAddModels();
  }, [addSelectedMake, selectedYear]);

    useEffect(() => {
      // Use local pakistaniCities array instead of API call
      // Import pakistaniCities if not already imported
      const formatted = pakistaniCities.map((city: string) => ({
        label: city,
        value: city,
      }))
      setRegistrationCities(formatted)
      setIsLoading(false)
    }, [])
  // Load years on mount
  useEffect(() => {
    (async () => {
      try {
        await fetchYears(); // ping API (ignored for list)
        setYears(OFFLINE_YEARS);
      } catch (e) {
        console.error("years load failed", e);
        setYears(OFFLINE_YEARS);
      }
    })();
  }, []);

  // Load makes whenever year changes
  useEffect(() => {
    if (!selectedYear) { setMakes([]); return; }
    (async () => {
      try {
        const ms = await fetchMakesByYear(selectedYear);
        setMakes(ms.length ? ms : getOfflineMakes());
      } catch (e) {
        console.error("makes load failed", e);
        setMakes(getOfflineMakes());
      }
    })();
  }, [selectedYear]);

  // Load models whenever makes or year changes
  useEffect(() => {
    if (!selectedYear || selectedMakes.length === 0) { setModels([]); return; }
    (async () => {
      try {
        const all: { label: string; value: string }[] = [];
        for (const mk of selectedMakes) {
          const mdls = await fetchModelsByMakeYear(mk, selectedYear);
          mdls.forEach(m => all.push(m));
        }
        // de-dup
        const unique = Array.from(new Map(all.map(m => [m.value, m])).values());
        setModels(unique.length ? unique : getOfflineModels(selectedMakes));
      } catch (e) { console.error("models load failed", e); setModels(getOfflineModels(selectedMakes)); }
    })();
  }, [selectedMakes, selectedYear]);

  // Load variants whenever models or year or makes change
  useEffect(() => {
    if (!selectedYear || selectedMakes.length === 0 || selectedModels.length === 0) { setVariants([]); return; }
    (async () => {
      try {
        const all: { label: string; value: string }[] = [];
        for (const mk of selectedMakes) {
          for (const mdl of selectedModels) {
            const trims = await fetchVariantsByMakeModelYear(mk, mdl, selectedYear);
            trims.forEach(t => all.push(t));
          }
        }
        const unique = Array.from(new Map(all.map(v => [v.value, v])).values());
        setVariants(unique.length ? unique : getOfflineVariants(selectedMakes, selectedModels));
      } catch (e) { console.error("variants load failed", e); setVariants(getOfflineVariants(selectedMakes, selectedModels)); }
    })();
  }, [selectedMakes, selectedModels, selectedYear]);

   useEffect(() => {
    const fetchUserData = async () => {
      try {
        const storedUserData = await AsyncStorage.getItem('user');
          if (storedUserData) {
            const parsedData = JSON.parse(storedUserData);
            console.log("Fetched User Data:", parsedData); // Log user data
            setUserData(parsedData);
          } else {
            console.log("No user data found in AsyncStorage.");
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
        } finally {
          setIsLoading(false);
      }
    };
    fetchUserData();
  }, []);

  // Apply preselected values from Year/Brand flow
  useEffect(() => {
    if (params?.preselectedYear) {
      setSelectedYear(params.preselectedYear);
    }
    if (params?.carChoices?.length) {
      const incoming = params.carChoices as unknown as CarChoice[]
      setCarChoices((prev) => {
        const combined = [...prev, ...incoming]
        const dedup = Array.from(new Map(combined.map(c => [`${c.make}|${c.model}|${c.variant||''}`, c])).values())
        setForm((f)=>({
          ...f,
          make: Array.from(new Set(dedup.map(c=>c.make))).join(','),
          model: dedup.map(c=>`${c.make} ${c.model}${c.variant? ' '+c.variant: ''}`).join(',')
        }))
        return dedup
      })
    }
    if (typeof (params as any)?.selectedRegistrationCity === 'string') {
      const city = (params as any).selectedRegistrationCity as string
      setSelectedRegistrationCities((prev) => {
        const next = Array.from(new Set([...(prev||[]), city]))
        setForm(p => ({ ...p, registrationCity: next.join(',') }))
        return next
      })
    }
    if (typeof (params as any)?.selectedLocation === 'string') {
      const city = (params as any).selectedLocation as string
      setLocation(city)
    }
  }, [params?.preselectedYear, params?.carChoices, (params as any)?.selectedRegistrationCity]);

  const validateCurrentStep = () => {
    if (currentStep === 1) {
      // Year, variant optional for this flow
    } else if (currentStep === 2) {
      if ( !location ) {
        Alert.alert("Missing Information", "Please fill in all required fields")
        return false
      }
    }
    return true
  }

  const handleNextStep = () => {
    if (validateCurrentStep()) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePreviousStep = () => {
    setCurrentStep(currentStep - 1)
  }

  const pickPaymentReceipt = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
    
    if (status !== "granted") {
      Alert.alert("Permission Denied", "Sorry, we need camera roll permissions to upload payment receipt")
      return
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: (ImagePicker as any).MediaType?.Images || ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.4, // Aggressively reduced to compress images and prevent 413 error
    })

    if (!result.canceled && result.assets[0]) {
      setPaymentReceipt(result.assets[0].uri)
    }
  }

  const removePaymentReceipt = () => {
    setPaymentReceipt(null)
  }

  const handleSubmit = async () => {
  if (!userData || !userData.userId) {
    navigation.navigate("LoginScreen");
    return;
  }

  setIsLoading(true);
      console.log("userID is here", userData.userId)


  const formData = new FormData();

  formData.append("userId", userData.userId);
  formData.append("location", location);
  const makeCsv = Array.from(new Set(carChoices.map(c=>c.make))).join(",");
  formData.append("make", makeCsv);
  formData.append("model", carChoices.map(c=>`${c.make} ${c.model}${c.variant? ' '+c.variant: ''}`).join(","));
  formData.append("variant", "");
  formData.append("registrationCity", selectedRegistrationCities.join(","));
  formData.append("preferredContact", preferredContact);
  formData.append("year", selectedYear || "");
  formData.append("description", description);
  formData.append("priceFrom", priceFrom);
  formData.append("priceTo", priceTo);
  formData.append("transmission", transmission);

  // Add payment receipt if uploaded
  if (paymentReceipt) {
    const filename = paymentReceipt.split("/").pop() || `payment_receipt_${Date.now()}.jpg`;
    const match = /\.(\w+)$/.exec(filename);
    const ext = match ? match[1] : "jpg";
    const type = `image/${ext}`;

    formData.append("paymentReceipt", {
      uri: paymentReceipt,
      name: filename,
      type,
    } as unknown as Blob);
  }

  try {
    const response = await fetch(`${API_URL}/buy_car-for_me`, {
      method: "POST",
      body: formData,
      // Don't set Content-Type header - browser will set it automatically with boundary
    });

    // Check for 413 error specifically (silently handle, don't show error)
    if (response.status === 413) {
      const errorText = await response.text();
      console.error("413 Request Entity Too Large:", errorText);
      Alert.alert("Error", "Upload failed. Please try uploading fewer images or try again.");
      setIsLoading(false);
      return;
    }

    // Check if response is JSON before parsing
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      const text = await response.text();
      console.error("Non-JSON response:", text.substring(0, 500));
      Alert.alert("Error", `Server returned invalid response (${response.status}). Please try again.`);
      setIsLoading(false);
      return;
    }

    const result = await response.json();
    console.log("Response:", result);

    if (response.ok) {
      Alert.alert("Success", "Ad posted successfully!");
      navigation.navigate("HomeTabs");
    } else {
      Alert.alert("Error", result.message || "Error posting ad");
    }
  } catch (error) {
    console.error("Error:", error);
    if (error.message && (error.message.includes('File size too large') || error.message.includes('413'))) {
      Alert.alert("Error", "Upload failed. Please try uploading fewer images or try again.");
    } else {
      Alert.alert("Error", error.message || "Something went wrong. Please try again.");
    }
  } finally {
    setIsLoading(false);
  }
};

  const formatPKRInWords = (raw: string): string => {
    const n = Number(raw);
    if (!Number.isFinite(n) || n <= 0) return "";
    const units = [
      { value: 10000000, label: "crore" },
      { value: 100000, label: "lakh" },
      { value: 1000, label: "hazar" },
      { value: 100, label: "hundred" },
    ];
    for (const u of units) {
      if (n >= u.value) {
        const count = n / u.value;
        const pretty = Number.isInteger(count) ? String(count) : (Math.round(count * 10) / 10).toString();
        return `${pretty} ${u.label}`;
      }
    }
    return String(n);
  };
  
   const renderStepIndicator = () => {
     return (
       <View style={styles.stepIndicatorContainer}>
         {[1, 2].map((step) => (
           <View key={step} style={styles.stepRow}>
             <View style={[styles.stepCircle, currentStep >= step ? styles.activeStepCircle : {}]}>
               {currentStep > step ? (
                 <Ionicons name="checkmark" size={16} color={COLORS.white} />
               ) : (
                 <Text style={[styles.stepNumber, currentStep >= step ? styles.activeStepNumber : {}]}>{step}</Text>
               )}
             </View>
             <Text style={[styles.stepText, currentStep >= step ? styles.activeStepText : {}]}>
               {step === 1
                 ? "Car Details"
                 : "Contact Info"}
             </Text>
           </View>
         ))}
       </View>
     )
   }
 
   const renderStep1 = () => {
     return (
       <>
         <View style={styles.section}>
           <Text style={styles.sectionTitle}>Basic Information</Text>
            <View style={styles.inputContainer}>
           <Text style={styles.label}>Year <Text style={styles.required}>*</Text></Text>
          <TouchableOpacity
            style={styles.input}
            onPress={() => navigation.navigate("BuyCarforMeYearScreen")}
          >
            <Text style={{ color: selectedYear ? COLORS.black : COLORS.darkGray }}>
              {selectedYear ? selectedYear : "Select Year"}
           </Text>
          </TouchableOpacity>
         </View>
         {/* Selected cars chips (from flow) below Year */}
         {carChoices.length > 0 && (
           <View style={[styles.inputContainer, { marginTop: 8 }]}> 
             <Text style={styles.label}>Car Model</Text>
             <View style={{ flexDirection:'row', flexWrap:'wrap' }}>
               {carChoices.map((c, idx) => (
                 <View key={`${c.make}-${c.model}-${c.variant||''}-${idx}`} style={{ flexDirection:'row', alignItems:'center', backgroundColor:'#EAF1FF', paddingHorizontal:12, paddingVertical:8, borderRadius:20, marginRight:8, marginBottom:8 }}>
                   <Text style={{ color: COLORS.black }}>
                     {`${c.make} ${c.model}${c.variant? ' ' + c.variant : ''}`}
           </Text>
                   <TouchableOpacity onPress={() => {
                     setCarChoices(prev => prev.filter((_, i)=> i!==idx))
                     setForm(prev => {
                       const nextList = carChoices.filter((_, i)=> i!==idx)
                       return {
                         ...prev,
                         make: Array.from(new Set(nextList.map(x=>x.make))).join(','),
                         model: nextList.map(x=>`${x.make} ${x.model}${x.variant? ' '+x.variant: ''}`).join(',')
                       }
                     })
                   }} style={{ marginLeft:6 }}>
                     <Text style={{ color: COLORS.primary }}>×</Text>
                   </TouchableOpacity>
                 </View>
               ))}
               <TouchableOpacity
                 onPress={() => {
                   if (!selectedYear) { Alert.alert('Select Year first'); return; }
                   navigation.navigate('BuyCarforMeBrandFlowScreen', { year: selectedYear })
                 }}
                 style={{ width:36, height:36, borderRadius:18, borderWidth:1, borderColor: COLORS.lightGray, justifyContent:'center', alignItems:'center' }}
               >
                 <Text style={{ fontSize:18, color: COLORS.black }}>+</Text>
               </TouchableOpacity>
         </View>
           </View>
         )}

       
 
           <View style={styles.inputContainer}>
             <Text style={styles.label}>
            Registration City <Text style={styles.required}>*</Text>
             </Text>
           {selectedRegistrationCities.length === 0 ? (
             <TouchableOpacity
               style={styles.input}
               onPress={() => navigation.navigate('BuyCarforMeCityScreen')}
             >
               <Text style={{ color: COLORS.darkGray }}>Select Registration City</Text>
             </TouchableOpacity>
           ) : (
             <View style={{ flexDirection:'row', flexWrap:'wrap' }}>
               {selectedRegistrationCities.map((c, idx) => (
                 <View key={`${c}-${idx}`} style={{ flexDirection:'row', alignItems:'center', backgroundColor:'#EAF1FF', paddingHorizontal:12, paddingVertical:8, borderRadius:20, marginRight:8, marginBottom:8 }}>
                   <Text style={{ color: COLORS.black }}>{c}</Text>
                   <TouchableOpacity onPress={() => {
                     setSelectedRegistrationCities(prev => {
                       const next = prev.filter((_, i)=> i!==idx)
                       setForm(p => ({ ...p, registrationCity: next.join(',') }))
                       return next
                     })
                   }} style={{ marginLeft:6 }}>
                     <Text style={{ color: COLORS.primary }}>×</Text>
                   </TouchableOpacity>
           </View>
               ))}
               <TouchableOpacity
                 onPress={() => navigation.navigate('BuyCarforMeCityScreen')}
                 style={{ width:36, height:36, borderRadius:18, borderWidth:1, borderColor: COLORS.lightGray, justifyContent:'center', alignItems:'center' }}
               >
                 <Text style={{ fontSize:18, color: COLORS.black }}>+</Text>
               </TouchableOpacity>
             </View>
           )}
<View style={styles.inputContainer}>
  <Text style={styles.label}>
    Price Range (PKR) <Text style={styles.required}>*</Text>
  </Text>

  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
    <TextInput
      style={[styles.input, { flex: 1, marginRight: 8 }]}
      placeholder="From"
      value={priceFrom}
      onChangeText={(text) => {
        const cleaned = text.replace(/\s/g, "");
        setPriceFrom(cleaned);
        setPriceFromWords(formatPKRInWords(cleaned));
      }}
      keyboardType="numeric"
    />

    <TextInput
      style={[styles.input, { flex: 1, marginLeft: 8 }]}
      placeholder="To"
      value={priceTo}
      onChangeText={(text) => {
        const cleaned = text.replace(/\s/g, "");
          setPriceTo(cleaned);
        setPriceToWords(formatPKRInWords(cleaned));
      }}
      keyboardType="numeric"
    />
  </View>

  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
    <View style={{ flex: 1, marginRight: 8 }}>
      {priceFrom ? (
        <Text style={{ color: "#4CAF50", marginTop: 4 }}>{priceFromWords}</Text>
      ) : null}
    </View>
    <View style={{ flex: 1, marginLeft: 8 }}>
      {priceTo ? (
        <Text style={{ color: "#4CAF50", marginTop: 4 }}>{priceToWords}</Text>
      ) : null}
    </View>
  </View>

  {priceFrom && priceTo && parseInt(priceTo) < parseInt(priceFrom) && (
    <Text style={{ color: "red", marginTop: 4 }}>
      "To" price cannot be less than "From" price.
    </Text>
  )}
</View>
<View style={styles.inputContainer}>
          <Text style={styles.label}>
            Transmission <Text style={styles.required}>*</Text>
          </Text>
          <View style={styles.categoriesContainer}>
            {transmissionTypes.map((type, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.categoryChip, transmission === type && styles.selectedCategoryChip]}
                onPress={() => setTransmission(type)}
              >
                <Text style={[styles.categoryChipText, transmission === type && styles.selectedCategoryChipText]}>
                  {type}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>


        </View>
           <View style={styles.inputContainer}>
             <Text style={styles.label}>Description</Text>
             <TextInput
               style={[styles.input, styles.textArea]}
               placeholder="Describe your car, its condition, features, etc."
               value={description}
               onChangeText={setDescription}
               multiline
               numberOfLines={4}
               textAlignVertical="top"
             />
           </View>
         </View>
       </>
     )
   }
 
   const renderStep2 = () => {
     return (
       <View style={styles.section}>
         <Text style={styles.sectionTitle}>Contact Information</Text>
 
         <View style={styles.inputContainer}>
           <Text style={styles.label}>
             Location <Text style={styles.required}>*</Text>
           </Text>
          <TouchableOpacity style={styles.input} onPress={()=> navigation.navigate('BuyCarforMeLocationScreen')}>
            <Text style={{ color: location ? COLORS.black : COLORS.darkGray}}>
              {location || 'Select Location'}
            </Text>
          </TouchableOpacity>
         </View>
         <View style={styles.inputContainer}>
                   <Text style={styles.label}>Preferred Contact Method</Text>
                   <View style={styles.contactMethodContainer}>
                     <TouchableOpacity
                       style={[styles.contactMethodOption, preferredContact === "phone" && styles.selectedContactMethod]}
                       onPress={() => setPreferredContact("phone")}
                     >
                       <Ionicons
                         name="call-outline"
                         size={20}
                         color={preferredContact === "phone" ? COLORS.white : COLORS.darkGray}
                       />
                       <Text
                         style={[styles.contactMethodText, preferredContact === "phone" && styles.selectedContactMethodText]}
                       >
                         Phone
                       </Text>
                     </TouchableOpacity>
         
                     <TouchableOpacity
                       style={[styles.contactMethodOption, preferredContact === "whatsapp" && styles.selectedContactMethod]}
                       onPress={() => setPreferredContact("whatsapp")}
                     >
                       <FontAwesome5
                         name="whatsapp"
                         size={20}
                         color={preferredContact === "whatsapp" ? COLORS.white : COLORS.darkGray}
                       />
                       <Text
                         style={[styles.contactMethodText, preferredContact === "whatsapp" && styles.selectedContactMethodText]}
                       >
                         WhatsApp
                       </Text>
                     </TouchableOpacity>
         
                     <TouchableOpacity
                       style={[styles.contactMethodOption, preferredContact === "both" && styles.selectedContactMethod]}
                       onPress={() => setPreferredContact("both")}
                     >
                       <Ionicons
                         name="options-outline"
                         size={20}
                         color={preferredContact === "both" ? COLORS.white : COLORS.darkGray}
                       />
                       <Text style={[styles.contactMethodText, preferredContact === "both" && styles.selectedContactMethodText]}>
                         Both
                       </Text>
                     </TouchableOpacity>
                   </View>
                 </View>
         
         {/* Payment Receipt Upload */}
         <View style={styles.inputContainer}>
           <Text style={styles.label}>Payment Receipt (Optional)</Text>
           {paymentReceipt ? (
             <View style={styles.receiptContainer}>
               <Image source={{ uri: paymentReceipt }} style={styles.receiptImage} />
               <TouchableOpacity 
                 style={styles.removeReceiptButton} 
                 onPress={removePaymentReceipt}
               >
                 <Ionicons name="close-circle" size={24} color={COLORS.primary} />
               </TouchableOpacity>
             </View>
           ) : (
             <TouchableOpacity 
               style={styles.uploadReceiptButton} 
               onPress={pickPaymentReceipt}
             >
               <Ionicons name="camera-outline" size={24} color={COLORS.primary} />
               <Text style={styles.uploadReceiptText}>Upload Payment Receipt</Text>
             </TouchableOpacity>
           )}
         </View>
         
       </View>
     )
   }
   return (
     <SafeAreaView style={styles.container}>
       <View style={styles.header}>
         <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
           <Ionicons name="arrow-back" size={24} color={COLORS.black} />
         </TouchableOpacity>
         <Text style={styles.headerTitle}>Car Rquirements</Text>
         <View style={{ width: 24 }} />
       </View>
 
       {renderStepIndicator()}
 
       <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.keyboardAvoidingView}>
         <ScrollView
           ref={scrollRef}
           style={styles.scrollView}
           showsVerticalScrollIndicator={false}
           contentContainerStyle={styles.scrollContent}
         >
           {currentStep === 1 && renderStep1()}
           {currentStep === 2 && renderStep2()}
 
           <View style={styles.buttonContainer}>
             {currentStep > 1 && (
               <TouchableOpacity style={styles.backStepButton} onPress={handlePreviousStep}>
                 <Text style={styles.backStepButtonText}>Back</Text>
               </TouchableOpacity>
             )}
 
             {currentStep < 2 ? (
               <TouchableOpacity
                 style={[styles.nextStepButton, { flex: currentStep > 1 ? 0.48 : 1 }]}
                 onPress={handleNextStep}
               >
                 <Text style={styles.nextStepButtonText}>Next</Text>
               </TouchableOpacity>
             ) : (
 <TouchableOpacity
   style={[styles.submitButton, { flex: currentStep > 1 ? 0.48 : 1 }]}
   onPress={handleSubmit}
   disabled={isLoading} // Optional: disable while loading
 >
   {isLoading ? (
     <ActivityIndicator size="small" color="#fff" />
   ) : (
     <Text style={styles.submitButtonText}>Submit Inquiry</Text>
   )}
 </TouchableOpacity>
 )}
           </View>
         </ScrollView>
       </KeyboardAvoidingView>
     </SafeAreaView>
   )
 }
 
 const styles = StyleSheet.create({
   container: {
     flex: 1,
     backgroundColor: COLORS.white,
   },
   header: {
     flexDirection: "row",
     alignItems: "center",
     justifyContent: "space-between",
     padding: 16,
     borderBottomWidth: 1,
     borderBottomColor: COLORS.lightGray,
   },
   backButton: {
     padding: 4,
   },
   headerTitle: {
     fontSize: 18,
     fontWeight: "bold",
     color: COLORS.black,
   },
   stepIndicatorContainer: {
     flexDirection: "row",
     justifyContent: "space-between",
     paddingHorizontal: 20,
     paddingVertical: 16,
     backgroundColor: COLORS.white,
     borderBottomWidth: 1,
     borderBottomColor: COLORS.lightGray,
   },
   stepRow: {
     alignItems: "center",
     flex: 1,
   },
   stepCircle: {
     width: 28,
     height: 28,
     borderRadius: 14,
     backgroundColor: COLORS.lightGray,
     justifyContent: "center",
     alignItems: "center",
     marginBottom: 4,
   },
   activeStepCircle: {
     backgroundColor: COLORS.primary,
   },
   stepNumber: {
     fontSize: 14,
     fontWeight: "bold",
     color: COLORS.darkGray,
   },
   activeStepNumber: {
     color: COLORS.white,
   },
   stepText: {
     fontSize: 12,
     color: COLORS.darkGray,
   },
   activeStepText: {
     color: COLORS.primary,
     fontWeight: "500",
   },
   keyboardAvoidingView: {
     flex: 1,
   },
   scrollView: {
     flex: 1,
   },
   scrollContent: {
     padding: 16,
     paddingBottom: 40,
   },
   section: {
     marginBottom: 24,
   },
   sectionTitle: {
     fontSize: 18,
     fontWeight: "600",
     color: COLORS.black,
     marginBottom: 8,
   },
   sectionSubtitle: {
     fontSize: 14,
     color: COLORS.darkGray,
     marginBottom: 16,
   },
   imagesContainer: {
     flexDirection: "row",
     flexWrap: "wrap",
   },
   addImageButton: {
     width: 100,
     height: 100,
     borderWidth: 1,
     borderColor: COLORS.darkGray,
     borderStyle: "dashed",
     borderRadius: 8,
     justifyContent: "center",
     alignItems: "center",
     marginRight: 8,
     marginBottom: 8,
   },
   addImageText: {
     fontSize: 12,
     color: COLORS.darkGray,
     marginTop: 4,
   },
   imageContainer: {
     width: 100,
     height: 100,
     borderRadius: 8,
     marginRight: 8,
     marginBottom: 8,
     overflow: "hidden",
   },
   image: {
     width: "100%",
     height: "100%",
   },
   removeImageButton: {
     position: "absolute",
     top: 4,
     right: 4,
     backgroundColor: COLORS.white,
     borderRadius: 12,
   },
   inputContainer: {
     marginBottom: 16,
   },
   label: {
     fontSize: 14,
     fontWeight: "500",
     color: COLORS.black,
     marginBottom: 8,
   },
   required: {
     color: "red",
   },
   input: {
     borderWidth: 1,
     borderColor: COLORS.lightGray,
     borderRadius: 8,
     paddingHorizontal: 12,
     paddingVertical: 10,
     fontSize: 14,
   },
   textArea: {
     height: 100,
     paddingTop: 12,
   },
   categoriesContainer: {
     flexDirection: "row",
     flexWrap: "wrap",
   },
   categoryChip: {
     paddingHorizontal: 12,
     paddingVertical: 8,
     borderRadius: 20,
     backgroundColor: COLORS.lightGray,
     marginRight: 8,
     marginBottom: 8,
   },
   selectedCategoryChip: {
     backgroundColor: COLORS.primary,
   },
   categoryChipText: {
     fontSize: 14,
     color: COLORS.darkGray,
   },
   selectedCategoryChipText: {
     color: COLORS.white,
   },
   row: {
     flexDirection: "row",
     justifyContent: "space-between",
   },
   halfInput: {
     width: "48%",
   },
   featuresContainer: {
     marginTop: 8,
   },
   featureChip: {
     flexDirection: "row",
     alignItems: "center",
     paddingVertical: 10,
     paddingHorizontal: 12,
     borderRadius: 8,
     marginBottom: 8,
     backgroundColor: COLORS.white,
     borderWidth: 1,
     borderColor: COLORS.lightGray,
   },
   selectedFeatureChip: {
     borderColor: COLORS.primary,
     backgroundColor: "rgba(0, 102, 204, 0.05)",
   },
   featureIcon: {
     marginRight: 8,
   },
   featureChipText: {
     fontSize: 14,
     color: COLORS.darkGray,
   },
   selectedFeatureChipText: {
     color: COLORS.black,
   },
   contactMethodContainer: {
     flexDirection: "row",
     justifyContent: "space-between",
   },
   contactMethodOption: {
     flexDirection: "row",
     alignItems: "center",
     justifyContent: "center",
     paddingVertical: 10,
     paddingHorizontal: 16,
     borderRadius: 8,
     borderWidth: 1,
     borderColor: COLORS.lightGray,
     flex: 1,
     marginRight: 8,
   },
   selectedContactMethod: {
     backgroundColor: COLORS.primary,
     borderColor: COLORS.primary,
   },
   contactMethodText: {
     fontSize: 14,
     color: COLORS.darkGray,
     marginLeft: 6,
   },
   selectedContactMethodText: {
     color: COLORS.white,
   },
   buttonContainer: {
     flexDirection: "row",
     justifyContent: "space-between",
     marginTop: 16,
   },
   backStepButton: {
     paddingVertical: 14,
     paddingHorizontal: 20,
     borderRadius: 8,
     borderWidth: 1,
     borderColor: COLORS.primary,
     flex: 0.48,
     alignItems: "center",
   },
   backStepButtonText: {
     color: COLORS.primary,
     fontSize: 16,
     fontWeight: "600",
   },
   nextStepButton: {
     backgroundColor: COLORS.primary,
     paddingVertical: 14,
     paddingHorizontal: 20,
     borderRadius: 8,
     flex: 1,
     alignItems: "center",
     shadowColor: COLORS.black,
     shadowOffset: { width: 0, height: 2 },
     shadowOpacity: 0.1,
     shadowRadius: 4,
     elevation: 3,
   },
   nextStepButtonText: {
     color: COLORS.white,
     fontSize: 16,
     fontWeight: "600",
   },
   submitButton: {
     backgroundColor: COLORS.primary,
     paddingVertical: 14,
     paddingHorizontal: 20,
     borderRadius: 8,
     flex: 1,
     alignItems: "center",
     shadowColor: COLORS.black,
     shadowOffset: { width: 0, height: 2 },
     shadowOpacity: 0.1,
     shadowRadius: 4,
     elevation: 3,
   },
   submitButtonText: {
     color: COLORS.white,
     fontSize: 16,
     fontWeight: "600",
   },
   dropdown: {
     borderColor: COLORS.lightGray,
     borderWidth: 1,
     paddingHorizontal: 12,
     borderRadius: 8,
     marginBottom: 10,
     zIndex: 1, // Ensure dropdowns are layered properly
   },
  dropdownContainer: {
    borderColor: "#DDD",
    zIndex: 1000,
  },
  receiptContainer: {
    position: 'relative',
    width: '100%',
    height: 200,
    borderRadius: 8,
    overflow: 'hidden',
    marginTop: 8,
  },
  receiptImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  removeReceiptButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 4,
  },
  uploadReceiptButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderStyle: 'dashed',
    borderRadius: 8,
    paddingVertical: 16,
    paddingHorizontal: 12,
    marginTop: 8,
  },
  uploadReceiptText: {
    marginLeft: 8,
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '500',
  },
})
 
 export default BuyCarforMe;
