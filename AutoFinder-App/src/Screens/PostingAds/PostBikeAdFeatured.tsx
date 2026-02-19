import React, { useEffect, useState, useRef } from "react"
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
import EnhancedImagePicker from "../../Components/EnhancedImagePicker"
import { COLORS } from "../../constants/colors"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { API_URL } from "../../../config"
import { NavigationProp, useNavigation, useRoute } from "@react-navigation/native";
import { RootStackParamList } from "../../../navigationTypes";
import { carData as rawCarData, featureList,bodyTypes, bodyColors, fuelTypes } from "../../Components/DropdownData";
import { pakistaniCities, pakistaniLocations } from "../../Components/EnhancedDropdownData";
import DropDownPicker from "react-native-dropdown-picker"
import { compressImages, compressImage } from "../../utils/imageCompression";

type CarDataType = {
  [make: string]: {
    models: {
      [model: string]: {
        variants: {
          [variant: string]: string[]; // Array of years for each variant
        };
      };
    };
  };
};
const carData: CarDataType = rawCarData as CarDataType;

const PostBikeAdFeatured = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const route = useRoute<any>();
  
  const [currentStep, setCurrentStep] = useState(1)
  const [images, setImages] = useState<string[]>([])
  const [assembly, setAssembly] = useState("")
  // ScrollView ref to reset position on step change
  const scrollRef = useRef<ScrollView | null>(null);

  // Basic Information
  const [title, setTitle] = useState("")
  const [price, setPrice] = useState("")
  const [description, setDescription] = useState("")
  const [category, setCategory] = useState("")

  const formatPriceInWords = (raw: string) => {
    const numeric = parseInt((raw || '').replace(/\D/g, ''), 10)
    if (!numeric || numeric <= 0) return ''
    if (numeric < 1000) {
      if (numeric % 100 === 0) {
        return `${numeric / 100} hundred`
      }
      return `${numeric}`
    }
    if (numeric < 100000) {
      const thousands = Math.floor(numeric / 1000)
      return `${thousands} hazar`
    }
    if (numeric < 10000000) {
      const lakhs = Math.floor(numeric / 100000)
      return `${lakhs} lakh`
    }
    const crores = Math.floor(numeric / 10000000)
    return `${crores} crore`
  }

  // Bike Details
  const [mileage, setMileage] = useState("")
  const [fuelType, setFuelType] = useState("")
  const [transmission, setTransmission] = useState("")
  const [color, setColor] = useState("");
  const [customColor, setCustomColor] = useState("");
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [bodyType, setBodyType] = useState("")
  const [engineSize, setEngineSize] = useState("")
  const [registrationCity, setRegistrationCity] = useState("");
  const [showRegCitySuggestions, setShowRegCitySuggestions] = useState(false);
  
  // Year and Model Selection
  const [selectedYear, setSelectedYear] = useState<string>("")
  const [carChoices, setCarChoices] = useState<{ make: string; model: string; variant?: string }[]>([])
  const [form, setForm] = useState({
    make: "",
    model: "",
    variant: "",
    year: "",
    registrationCity: "",
  });

  // Features - using same approach as free bike ad
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([])

  // Contact Information
  const [location, setLocation] = useState("")
  const [adCity, setAdCity] = useState("")
  const [preferredContact, setPreferredContact] = useState("phone")
  const [isLoading, setIsLoading] = useState(false)
  const [isUserDataLoading, setIsUserDataLoading] = useState(true)
  const [userData, setUserData] = useState<any>(null)
  const [invoiceImage, setInvoiceImage] = useState<string | null>(null)

  // Package selection
  const [selectedPackage, setSelectedPackage] = useState<any>(null)

  // Categories for bikes
  const categories = ["Sport", "Cruiser", "Commuter", "Adventure", "Naked", "Scooter"]

  // Scroll to top whenever step changes
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ y: 0, animated: true });
    }
  }, [currentStep]);

  // Get package from route params and handle navigation selections
  useEffect(() => {
    const params: any = route.params || {}
    if (params.selectedPackage) {
      setSelectedPackage(params.selectedPackage)
    }
    
    // Handle selections coming back from navigation screens
    if (typeof params.selectedLocation === 'string' && params.selectedLocation) {
      setAdCity(params.selectedLocation)
      setLocation('')
    }
    if (typeof params.selectedArea === 'string' && params.selectedArea) {
      setLocation(params.selectedArea)
    }
    if (typeof params.selectedRegistrationCity === 'string' && params.selectedRegistrationCity) {
      setRegistrationCity(params.selectedRegistrationCity)
    }
    if (typeof params.preselectedYear === 'string') {
      setSelectedYear(params.preselectedYear)
      setForm(prev => ({ ...prev, year: params.preselectedYear }))
    }
    if (Array.isArray(params.carChoices) && params.carChoices.length) {
      const incoming = params.carChoices as { make: string; model: string; variant?: string }[]
      setCarChoices(prev => {
        const combined = [...prev, ...incoming]
        const dedup = Array.from(new Map(combined.map(c => [`${c.make}|${c.model}|${c.variant||''}`, c])).values())
        setForm(f => ({
          ...f,
          make: dedup[0]?.make || f.make,
          model: dedup[0] ? `${dedup[0].make} ${dedup[0].model}${dedup[0].variant? ' '+dedup[0].variant: ''}` : f.model,
          variant: dedup[0]?.variant || f.variant,
        }))
        return dedup
      })
    }
    if (Array.isArray(params.selectedFeatures)) {
      setSelectedFeatures(params.selectedFeatures as string[])
    }
  }, [route.params])

  // Load user data
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const user = await AsyncStorage.getItem('user')
        if (user) {
          const parsedUser = JSON.parse(user)
          console.log('Loaded user data:', parsedUser)
          setUserData(parsedUser)
        } else {
          console.log('No user data found in AsyncStorage')
        }
      } catch (error) {
        console.error('Error loading user data:', error)
      } finally {
        setIsUserDataLoading(false)
      }
    }
    loadUserData()
  }, [])

  const pickInvoiceImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== "granted") {
      Alert.alert("Permission Denied", "We need camera roll permissions to upload the invoice.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 0.25,
    });

    if (!result.canceled) {
      setInvoiceImage(result.assets[0].uri);
    }
  };

  const removeInvoiceImage = () => {
    setInvoiceImage(null);
  };



  const validateCurrentStep = () => {
    console.log("=== VALIDATION DEBUG ===");
    console.log("currentStep:", currentStep);
    
    if (currentStep === 1) {
      console.log("Validating Step 1...");
      console.log("images.length:", images.length);
      console.log("title:", title);
      console.log("price:", price);
      console.log("adCity:", adCity);
      
      if (images.length === 0) {
        console.log("Validation failed: No images");
        Alert.alert("Missing Images", "Please upload at least one image of your bike")
        return false
      }
      if (images.length > 20) {
        console.log("Validation failed: Too many images");
        Alert.alert("Too Many Images", "You can upload a maximum of 20 images")
        return false
      }
      if (!title || !price) {
        console.log("Validation failed: Missing title or price");
        Alert.alert("Missing Information", "Please fill in all required fields")
        return false
      }
      if (!adCity) {
        console.log("Validation failed: No city selected");
        Alert.alert("Missing Information", "Please select a city")
        return false
      }
    } else if (currentStep === 2) {
      console.log("Validating Step 2...");
      console.log("selectedYear:", selectedYear);
      console.log("carChoices:", carChoices);
      console.log("fuelType:", fuelType);
      console.log("bodyType:", bodyType);
      
      if (!selectedYear) {
        console.log("Validation failed: No year selected");
        Alert.alert("Missing Information", "Please select a year")
        return false
      }
      if (!carChoices || carChoices.length === 0) {
        console.log("Validation failed: No bike model selected");
        Alert.alert("Missing Information", "Please select a bike model")
        return false
      }
      if (!fuelType || !bodyType) {
        console.log("Validation failed: Missing fuel type or body type");
        Alert.alert("Missing Information", "Please fill in all required fields")
        return false
      }
    } else if (currentStep === 3) {
      console.log("Validating Step 3... (Features - optional)");
      // Features step - no validation required as features are optional
      return true
    } else if (currentStep === 4) {
      console.log("Validating Step 4...");
      console.log("location:", location);
      console.log("preferredContact:", preferredContact);
      
      if (!location) {
        console.log("Validation failed: No location");
        Alert.alert("Missing Information", "Please enter your location")
        return false
      }
      if (!preferredContact) {
        console.log("Validation failed: No contact method");
        Alert.alert("Missing Information", "Please select a preferred contact method")
        return false
      }
    }
    
    console.log("Validation passed!");
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

  const handleSubmit = async () => {
    console.log("=== SUBMIT DEBUG ===");
    console.log("userData:", userData);
    console.log("currentStep:", currentStep);
    console.log("images.length:", images.length);
    console.log("title:", title);
    console.log("price:", price);
    console.log("adCity:", adCity);
    console.log("location:", location);
    console.log("selectedYear:", selectedYear);
    console.log("carChoices:", carChoices);
    console.log("fuelType:", fuelType);
    console.log("bodyType:", bodyType);
    console.log("preferredContact:", preferredContact);
    console.log("selectedPackage:", selectedPackage);
    console.log("selectedFeatures:", selectedFeatures);
    
    if (!userData || !userData.userId) {
      console.log("No user data, navigating to login");
      console.log("userData:", userData);
      Alert.alert("Login Required", "Please log in to submit your ad", [
        {
          text: "OK",
          onPress: () => navigation.navigate("LoginScreen")
        }
      ]);
      return;
    }

    console.log("User data is valid, proceeding with submission");

    // Validate all steps before submission
    if (!validateCurrentStep()) {
      console.log("Validation failed");
      return;
    }

    console.log("Starting submission...");
    setIsLoading(true);

    const formData = new FormData();

    // Compress and attach up to 8 images (reduced to prevent 413 error)
    const maxImagesToUpload = 6; // Limit to 6 images
    const imagesToProcess = images.slice(0, maxImagesToUpload);
    console.log("🔧 Total images to upload (original quality):", imagesToProcess.length);
    
    // Upload original images without compression
    imagesToProcess.forEach((imageUri, index) => {
      const filename = imageUri.split("/").pop() || `image_${index + 1}.jpg`;
      const match = /\.(\w+)$/.exec(filename);
      const ext = match ? match[1] : "jpg";
      const type = `image/${ext}`;

      formData.append(`image${index + 1}`, {
        uri: imageUri,
        name: filename,
        type,
      } as unknown as Blob);
    });

    // Attach invoice image without compression
    if (invoiceImage) {
      const filename = invoiceImage.split("/").pop() || `invoice.jpg`;
      const match = /\.(\w+)$/.exec(filename);
      const ext = match ? match[1] : "jpg";
      const type = `image/${ext}`;

      formData.append("invoiceImage", {
        uri: invoiceImage,
        name: filename,
        type,
      } as unknown as Blob);
      console.log("✅ Invoice image added (original quality)");
    }

    // Add form data
    formData.append("userId", userData.userId);
    formData.append("location", location || adCity);
    formData.append("adCity", adCity);
    formData.append("category", "Bike");
    formData.append("title", title);
    formData.append("make", form.make || (carChoices && carChoices[0]?.make || ""));
    formData.append("model", form.model || (carChoices && carChoices[0] ? `${carChoices[0].make} ${carChoices[0].model}${carChoices[0].variant? ' '+carChoices[0].variant: ''}` : ""));
    formData.append("variant", form.variant || (carChoices && carChoices[0]?.variant || ""));
    formData.append("year", selectedYear || form.year || "");
    formData.append("registrationCity", registrationCity);
    formData.append("price", price);
    formData.append("bodyColor", color === "Other" ? customColor : color);
    formData.append("bodyType", bodyType);
    formData.append("kmDriven", mileage || "0");
    formData.append("fuelType", fuelType);
    formData.append("engineCapacity", engineSize);
    formData.append("description", description);
    formData.append("transmission", transmission || "Manual");
    formData.append("assembly", "Local");
    formData.append("selectedPlan", selectedPackage?.name || "");
    formData.append("features", selectedFeatures ? selectedFeatures.join(",") : "");
    formData.append("preferredContact", preferredContact);
    
    // Add featured ad fields
    formData.append("isFeatured", "true");
    formData.append("packageId", selectedPackage?.id || "");
    formData.append("packageName", selectedPackage?.name || "");
    formData.append("packagePrice", selectedPackage?.discountedPrice?.toString() || "0");

    try {
      const response = await fetch(`${API_URL}/bike_ads`, {
        method: "POST",
        body: formData,
        // DO NOT set Content-Type header for FormData in React Native
        // The system will set it automatically with the correct boundary
      });

      // Check for 413 error specifically
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
        const errorText = await response.text();
        console.error("Non-JSON response:", errorText.substring(0, 500));
        Alert.alert("Error", `Server returned invalid response (${response.status}). Please try again.`);
        setIsLoading(false);
        return;
      }

      const result = await response.json();
      console.log("Response:", result);

      if (response.ok) {
        console.log("Ad posted successfully, navigating to HomeTabs");
        navigation.navigate("HomeTabs");
        setTimeout(() => {
          Alert.alert("Success", "Ad posted successfully!");
        }, 100);
      } else {
        const isInvoiceError = (result.error === "UNEXPECTED_FILE_FIELD" && (result.message || "").toLowerCase().includes("invoiceimage"));
        const msg = isInvoiceError
          ? "Payment receipt upload failed: server needs to be updated. Deploy latest backend and restart, then try again."
          : (result.error && String(result.error)) || result.message || "Error posting ad";
        Alert.alert(isInvoiceError ? "Server update required" : "Error", msg);
      }
    } catch (error: any) {
      console.error("Error:", error);
      let errorMessage = "Something went wrong. Please try again.";
      
      // Handle specific error types
      if (error.message && error.message.includes('JSON Parse error')) {
        errorMessage = "Server returned invalid response. Please try again.";
      } else if (error.message && error.message.includes('Network request failed')) {
        errorMessage = "Network error. Please check your internet connection.";
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      Alert.alert("Error", errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const renderStepIndicator = () => {
    return (
      <View style={styles.stepIndicatorContainer}>
        {[1, 2, 3, 4].map((step) => (
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
                ? "Photos & Basic Info"
                : step === 2
                  ? "Bike Details"
                  : step === 3
                    ? "Features"
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
        <EnhancedImagePicker
          images={images}
          onImagesChange={setImages}
          maxImages={8}
          title="Upload Photos (Max 8)"
          required={true}
        />
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Information</Text>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>
              Title <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 2020 Honda CBR600RR in excellent condition"
              value={title}
              onChangeText={setTitle}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>
              Price (PKR) <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              placeholder="Enter price"
              value={price}
              onChangeText={(text) => setPrice(text.replace(/\s/g, ""))}
              keyboardType="numeric"
            />
            {!!price && (
              <Text style={{ marginTop: 6, color: '#28a745' }}>{formatPriceInWords(price)}</Text>
            )}
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Select City <Text style={styles.required}>*</Text></Text>
            <View style={[styles.input, { flexDirection:'row', alignItems:'center', justifyContent:'space-between' }]}>
              <TouchableOpacity
                style={{ flex:1 }}
                onPress={() => { if (!adCity) { (navigation as any).navigate('BuyCarforMeLocationScreen', { returnTo: 'PostBikeAdFeatured' }) } }}
                disabled={!!adCity}
              >
                <Text style={{ color: adCity ? COLORS.black : COLORS.darkGray }}>{adCity || 'Select City'}</Text>
              </TouchableOpacity>
              {!!adCity && (
                <TouchableOpacity onPress={() => { setAdCity(''); setLocation('') }}
                  style={{ marginLeft:10, paddingHorizontal:8, paddingVertical:4, borderRadius:12, backgroundColor:'#F2F2F2' }}>
                  <Text style={{ color: COLORS.primary }}>×</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Select Area</Text>
            <View style={[styles.input, { flexDirection:'row', alignItems:'center', justifyContent:'space-between' }]}>
              <TouchableOpacity
                style={{ flex:1 }}
                onPress={() => { if (adCity && !location) { (navigation as any).navigate('AreaSelectorScreen', { city: adCity, returnTo: 'PostBikeAdFeatured' }) } }}
                disabled={!adCity || !!location}
              >
                <Text style={{ color: location ? COLORS.black : (adCity ? COLORS.darkGray : '#BDBDBD') }}>{location || (adCity ? 'Select Area' : 'Select city first')}</Text>
              </TouchableOpacity>
              {!!location && (
                <TouchableOpacity onPress={() => setLocation('')}
                  style={{ marginLeft:10, paddingHorizontal:8, paddingVertical:4, borderRadius:12, backgroundColor:'#F2F2F2' }}>
                  <Text style={{ color: COLORS.primary }}>×</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Category</Text>
            <View style={styles.categoriesContainer}>
              {categories.map((cat, index) => (
                <TouchableOpacity
                  key={index}
                  style={[styles.categoryChip, category === cat && styles.selectedCategoryChip]}
                  onPress={() => setCategory(cat)}
                >
                  <Text style={[styles.categoryChipText, category === cat && styles.selectedCategoryChipText]}>
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Describe your bike, its condition, features, etc."
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
    const fuelTypes = ["Petrol", "Electric", "Hybrid"]
    const bodyTypes = ["Sport", "Cruiser", "Commuter", "Adventure", "Naked", "Scooter"]
    const colors = ["Black", "White", "Red", "Blue", "Green", "Yellow", "Silver", "Gray", "Orange", "Other"]

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Bike Details</Text>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>
            Year <Text style={styles.required}>*</Text>
          </Text>
          <TouchableOpacity style={styles.input} onPress={() => (navigation as any).navigate('BuyCarforMeYearScreen', { returnTo: 'PostBikeAdFeatured' })}>
            <Text style={{ color: selectedYear ? COLORS.black : COLORS.darkGray }}>{selectedYear || 'Select Year'}</Text>
          </TouchableOpacity>
        </View>

        {carChoices && carChoices.length > 0 && (
        <View style={styles.inputContainer}>
            <Text style={styles.label}>Bike Model</Text>
            <View style={{ flexDirection:'row', flexWrap:'wrap' }}>
              {carChoices.map((c, idx) => (
                <View key={`${c.make}-${c.model}-${c.variant||''}-${idx}`} style={{ flexDirection:'row', alignItems:'center', backgroundColor:'#EAF1FF', paddingHorizontal:12, paddingVertical:8, borderRadius:20, marginRight:8, marginBottom:8 }}>
                  <Text style={{ color: COLORS.black }}>{`${c.make} ${c.model}${c.variant? ' ' + c.variant : ''}`}</Text>
                  <TouchableOpacity onPress={() => {
                    setCarChoices(prev => prev.filter((_, i)=> i!==idx))
                    const next = carChoices.filter((_, i)=> i!==idx)
                    setForm(prev => ({ ...prev, make: next[0]?.make || '', model: next[0]? `${next[0].make} ${next[0].model}${next[0].variant? ' '+next[0].variant: ''}` : '', variant: next[0]?.variant || '' }))
                  }} style={{ marginLeft:6 }}>
                    <Text style={{ color: COLORS.primary }}>×</Text>
                  </TouchableOpacity>
        </View>
              ))}
              <TouchableOpacity onPress={() => (navigation as any).navigate('BuyCarforMeBrandFlowScreen', { year: selectedYear, returnTo: 'PostBikeAdFeatured' })} style={{ width:36, height:36, borderRadius:18, borderWidth:1, borderColor: COLORS.lightGray, justifyContent:'center', alignItems:'center' }}>
                <Text style={{ fontSize:18, color: COLORS.black }}>+</Text>
              </TouchableOpacity>
          </View>
          </View>
        )}
        {(!carChoices || carChoices.length === 0) && (
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Bike Model</Text>
            <TouchableOpacity onPress={() => (navigation as any).navigate('BuyCarforMeBrandFlowScreen', { year: selectedYear, returnTo: 'PostBikeAdFeatured' })} style={[styles.input, { justifyContent:'center' }]}>
              <Text style={{ color: COLORS.darkGray }}>Select Make/Model/Variant</Text>
            </TouchableOpacity>
        </View>
        )}

        <View style={styles.inputContainer}>
          <Text style={styles.label}>
            Fuel Type <Text style={styles.required}>*</Text>
          </Text>
          <View style={styles.categoriesContainer}>
            {fuelTypes.map((type, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.categoryChip, fuelType === type && styles.selectedCategoryChip]}
                onPress={() => setFuelType(type)}
              >
                <Text style={[styles.categoryChipText, fuelType === type && styles.selectedCategoryChipText]}>
                  {type}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Engine Type</Text>
          <View style={styles.categoriesContainer}>
            {bodyTypes.map((type, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.categoryChip, bodyType === type && styles.selectedCategoryChip]}
                onPress={() => setBodyType(type)}
              >
                <Text style={[styles.categoryChipText, bodyType === type && styles.selectedCategoryChipText]}>
                  {type}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Body Color</Text>
          <View style={styles.categoriesContainer}>
            {colors.map((col, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.categoryChip, color === col && styles.selectedCategoryChip]}
                onPress={() => {
                  if (col === "Other") {
                    setColor("Other");
                    setShowCustomInput(true);
                  } else {
                    setColor(col);
                    setShowCustomInput(false);
                  }
                }}
              >
                <Text style={[styles.categoryChipText, color === col && styles.selectedCategoryChipText]}>
                  {col}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {showCustomInput && (
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Enter custom color"
              value={customColor}
              onChangeText={setCustomColor}
            />
          </View>
        )}

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Engine Capacity (CC)</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. 150, 250, 600"
            value={engineSize}
            onChangeText={setEngineSize}
            keyboardType="numeric"
          />
        </View>
      </View>
    )
  }

  const renderStep3 = () => {
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Features</Text>
        <Text style={styles.sectionSubtitle}>Choose bike features</Text>
        <TouchableOpacity
          style={[styles.input, { flexDirection:'row', alignItems:'center', justifyContent:'space-between' }]}
          onPress={() => (navigation as any).navigate('FeaturesSelectorScreen', { preselected: selectedFeatures, returnTo: 'PostBikeAdFeatured' })}
        >
          <Text style={{ color: (selectedFeatures && selectedFeatures.length) ? COLORS.black : COLORS.darkGray }}>
            {(selectedFeatures && selectedFeatures.length) ? `${selectedFeatures.length} selected` : 'Select Features'}
          </Text>
          <Ionicons name="chevron-forward" size={18} color={COLORS.darkGray} />
        </TouchableOpacity>
        {selectedFeatures && selectedFeatures.length > 0 && (
          <View style={{ flexDirection:'row', flexWrap:'wrap', marginTop:8 }}>
            {selectedFeatures.slice(0, 6).map((k) => (
              <View key={k} style={{ backgroundColor:'#EAF1FF', paddingHorizontal:10, paddingVertical:6, borderRadius:16, marginRight:6, marginBottom:6 }}>
                <Text style={{ color: COLORS.black }}>{k.replace(/([A-Z])/g, ' $1').trim()}</Text>
              </View>
            ))}
            {selectedFeatures && selectedFeatures.length > 6 && (
              <View style={{ backgroundColor:'#EAF1FF', paddingHorizontal:10, paddingVertical:6, borderRadius:16, marginRight:6, marginBottom:6 }}>
                <Text style={{ color: COLORS.black }}>{`+${selectedFeatures.length - 6} more`}</Text>
              </View>
            )}
          </View>
        )}
      </View>
    )
  }

  const renderStep4 = () => {
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Upload Payment Receipt</Text>
        <Text style={styles.sectionSubtitle}>Upload proof of payment (only 1 image allowed)</Text>
        <View style={styles.imagesContainer}>
          {!invoiceImage ? (
            <TouchableOpacity style={styles.addImageButton} onPress={pickInvoiceImage}>
              <Ionicons name="document-text-outline" size={32} color={COLORS.darkGray} />
              <Text style={styles.addImageText}>Upload Receipt</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.imageContainer}>
              <Image source={{ uri: invoiceImage }} style={styles.image} />
              <TouchableOpacity style={styles.removeImageButton} onPress={removeInvoiceImage}>
                <Ionicons name="close-circle" size={24} color={COLORS.primary} />
              </TouchableOpacity>
            </View>
          )}
        </View>
        <Text style={styles.sectionTitle}>Contact Information</Text>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>
            Location <Text style={styles.required}>*</Text>
          </Text>
          <TextInput style={styles.input} placeholder="e.g. Lahore, PK" value={location} onChangeText={setLocation} />
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
              <Text
                style={[styles.contactMethodText, preferredContact === "both" && styles.selectedContactMethodText]}
              >
                Both
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    )
  }

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return renderStep1()
      case 2:
        return renderStep2()
      case 3:
        return renderStep3()
      case 4:
        return renderStep4()
      default:
        return renderStep1()
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoidingView}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={COLORS.black} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Post Premium Bike Ad</Text>
          <View style={styles.placeholder} />
        </View>

        {renderStepIndicator()}

        <ScrollView
          ref={scrollRef}
          style={styles.stepContent}
          showsVerticalScrollIndicator={false}
        >
          {renderCurrentStep()}
        </ScrollView>

        <View style={styles.footer}>
          {currentStep > 1 && (
            <TouchableOpacity style={styles.previousButton} onPress={handlePreviousStep}>
              <Text style={styles.previousButtonText}>Previous</Text>
            </TouchableOpacity>
          )}

          {currentStep < 4 ? (
            <TouchableOpacity style={styles.nextButton} onPress={handleNextStep}>
              <Text style={styles.nextButtonText}>Next</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.nextButton, (isLoading || isUserDataLoading) && styles.disabledButton]}
              onPress={handleSubmit}
              disabled={isLoading || isUserDataLoading}
            >
              {isLoading || isUserDataLoading ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <Text style={styles.nextButtonText}>Submit Ad</Text>
              )}
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.black,
  },
  placeholder: {
    width: 34,
  },
  stepIndicatorContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: COLORS.lightGray,
  },
  stepRow: {
    alignItems: 'center',
    flex: 1,
  },
  stepCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: COLORS.darkGray,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  activeStepCircle: {
    backgroundColor: COLORS.primary,
  },
  stepNumber: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: 'bold',
  },
  activeStepNumber: {
    color: COLORS.white,
  },
  stepText: {
    fontSize: 12,
    color: COLORS.darkGray,
    textAlign: 'center',
  },
  activeStepText: {
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  stepContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.black,
    marginBottom: 15,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: COLORS.darkGray,
    marginBottom: 15,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.black,
    marginBottom: 8,
  },
  required: {
    color: COLORS.primary,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    color: COLORS.black,
    backgroundColor: COLORS.white,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  categoryChip: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    backgroundColor: COLORS.white,
  },
  selectedCategoryChip: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  categoryChipText: {
    fontSize: 14,
    color: COLORS.darkGray,
  },
  selectedCategoryChipText: {
    color: COLORS.white,
    fontWeight: 'bold',
  },
  imagesContainer: {
    marginBottom: 20,
  },
  addImageButton: {
    borderWidth: 2,
    borderColor: COLORS.lightGray,
    borderStyle: 'dashed',
    borderRadius: 8,
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addImageText: {
    marginTop: 10,
    fontSize: 16,
    color: COLORS.darkGray,
  },
  imageContainer: {
    position: 'relative',
  },
  image: {
    width: '100%',
    height: 200,
    borderRadius: 8,
  },
  removeImageButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: COLORS.white,
    borderRadius: 12,
  },
  contactMethodContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  contactMethodOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    backgroundColor: COLORS.white,
  },
  selectedContactMethod: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  contactMethodText: {
    marginLeft: 8,
    fontSize: 14,
    color: COLORS.darkGray,
  },
  selectedContactMethodText: {
    color: COLORS.white,
    fontWeight: 'bold',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray,
    backgroundColor: COLORS.white,
  },
  previousButton: {
    flex: 1,
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.primary,
    alignItems: 'center',
    marginRight: 10,
  },
  previousButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  nextButton: {
    flex: 1,
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  disabledButton: {
    backgroundColor: COLORS.lightGray,
  },
})

export default PostBikeAdFeatured
