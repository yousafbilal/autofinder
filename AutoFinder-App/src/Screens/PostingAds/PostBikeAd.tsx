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
import { ToastAndroid } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context"
import { FontAwesome5, Ionicons } from "@expo/vector-icons"
import * as ImagePicker from "expo-image-picker"
import { COLORS } from "../../constants/colors"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { API_URL } from "../../../config"
import { compressImages, compressImage } from "../../utils/imageCompression";
import { NavigationProp, useNavigation, useRoute } from "@react-navigation/native";
import { RootStackParamList } from "../../../navigationTypes";
import { bikeData as rawBikeData, } from "../../Components/DropdownData"; // Import dropdown data
import { enhancedDropdownData } from "../../Components/EnhancedDropdownData"; // Import enhanced dropdown data
import EnhancedImagePicker from "../../Components/EnhancedImagePicker"; // Import enhanced image picker
import { pakistaniCities, pakistaniLocations, bikeFeatures } from "../../Components/EnhancedDropdownData";
import RegistrationCityPicker from "../../Components/RegistrationCityPicker"
import EnhancedFeaturesPicker from "../../Components/EnhancedFeaturesPicker"; // Import enhanced features picker
import DropDownPicker from "react-native-dropdown-picker"
import { rf, rp, createResponsiveStyleSheet, isAndroid } from "../../utils/responsive";


type BikeDataType = {
  [make: string]: {
    models: {
      [model: string]: string[]; // Array of years for each model
        };
      };
    };
const bikeData: BikeDataType = rawBikeData as any;

const PostBikeAd = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const route = useRoute<any>();
  
  const [currentStep, setCurrentStep] = useState(1)
  const [images, setImages] = useState<string[]>([])

  // Basic Information
  const [title, setTitle] = useState("")
  const [price, setPrice] = useState("")
  const [description, setDescription] = useState("")
  const [category, setCategory] = useState("")

  // Car Details
  const [fuelType, setFuelType] = useState("")
  const [color, setColor] = useState("");
  const [customColor, setCustomColor] = useState("");
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [bodyType, setBodyType] = useState("")
  const [engineSize, setEngineSize] = useState("")

  // Features
  const [features, setFeatures] = useState({
    LEDHeadlamp: false,
      
    DigitalConsole: false,
    USBChargingPort: false,
    BluetoothConnectivity: false,
    Navigation: false,
    ABS: false,
    SlipperClutch: false,
    QuickShifter: false,
    TractionControl: false,
    StabilityControl: false,
    HillStartAssist: false,
    EmergencyStopSignal: false,
  })
  const [form, setForm] = useState({
  make: "",
  model: "",
  variant: "",
  year: "",
  registrationCity: "",
});


  // Contact Information
  const [location, setLocation] = useState("")
  const [selectedCity, setSelectedCity] = useState("")
  const [selectedLocation, setSelectedLocation] = useState("")
  const [adCity, setAdCity] = useState("")
  const [registrationCity, setRegistrationCity] = useState("")
  const [showCitySuggestions, setShowCitySuggestions] = useState(false)
  const [showAreaSuggestions, setShowAreaSuggestions] = useState(false)
  const [showRegCitySuggestions, setShowRegCitySuggestions] = useState(false)
  const [preferredContact, setPreferredContact] = useState("phone")
  const [isLoading, setIsLoading] = useState(false); // Manage loading state

  // ScrollView ref to reset scroll on step change
  const scrollRef = useRef<ScrollView | null>(null);

  // Enhanced Features
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([])
  const [selectedYear, setSelectedYear] = useState<string>('')
  const [carChoices, setCarChoices] = useState<{ make: string; model: string; variant?: string }[]>([])

  // Scroll to top whenever the step changes so user always starts at top
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ y: 0, animated: true });
    }
  }, [currentStep]);

  // Price formatting function
  const formatPriceInWords = (raw: string) => {
    const numeric = parseInt((raw || '').replace(/\D/g, ''), 10)
    if (!numeric || numeric <= 0) return ''
    if (numeric < 1000) {
      if (numeric % 100 === 0) return `${numeric / 100} hundred`
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

  // Engine capacity formatting function
  const formatEngineCapacityInWords = (raw: string) => {
    const numeric = parseInt((raw || '').replace(/\D/g, ''), 10)
    if (!numeric || numeric <= 0) return ''
    return `${numeric} cc`
  }


  const fuelTypes = ["Petrol", "Diesel", "Hybrid", "Electric", "LPG", "CNG"]
  const bodyTypes = ["2 Strokes", "4 Strokes", "Electric"];
  const colors = ["White", "Black", "Gray", "Silver", "Red", "Blue", "Green", "Yellow", "Orange", "Brown", "Beige", "Gold", "Pink", "Purple", "Teal", "Maroon", "Navy", "Champagne", "Turquoise", "Mint"];
  const [userData, setUserData] = useState<any>(null);
  const [openMake, setOpenMake] = useState(false);
  const [selectedMake, setSelectedMake] = useState<string | null>(null);
  const [openModel, setOpenModel] = useState(false);
  const [selectedModel, setSelectedModel] = useState<string | null>(null);
  const [openYear, setOpenYear] = useState(false);
  const [openRegistrationCity, setOpenRegistrationCity] = useState(false);
  
  const [registrationCities, setRegistrationCities] = useState([])

 const makes = Object.keys(bikeData || {}).map((make) => ({
    label: make,
    value: make,
  }));

  const models = selectedMake && bikeData[selectedMake]?.models
    ? Object.keys(bikeData[selectedMake]?.models || {}).map((model) => ({
        label: model,
        value: model,
      }))
  : [];

   const years =
    selectedMake && selectedModel
    ? bikeData[selectedMake]?.models[selectedModel]?.map((year: string) => ({
        label: year,
          value: year,
        })) || []
      : [];

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
  useEffect(() => {
      // Use local pakistaniCities array instead of API call
      const formatted = pakistaniCities.map((city: string) => ({
                label: city,
                value: city,
              }))
            setRegistrationCities(formatted)
          setIsLoading(false)
    }, [])

  // Handle selections coming back from BuyCarForMe flows
  useEffect(() => {
    const params: any = route.params || {}
    
    if (typeof params.selectedLocation === 'string' && params.selectedLocation) {
      setAdCity(params.selectedLocation)
      setLocation('')
    }
    if (typeof params.selectedArea === 'string' && params.selectedArea) {
      setLocation(params.selectedArea)
    }
    if (typeof params.selectedRegistrationCity === 'string' && params.selectedRegistrationCity) {
      setRegistrationCity(params.selectedRegistrationCity)
      setForm((prev) => ({ ...prev, registrationCity: params.selectedRegistrationCity }))
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
    const pickImage = async () => {
    const maxImages = 8; // Reduced from 20 to prevent 413 error
    if (images.length >= maxImages) {
      Alert.alert("Limit Reached", `You can upload a maximum of ${maxImages} images`)
      return
    }
  
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
  
    if (status !== "granted") {
      Alert.alert("Permission Denied", "Sorry, we need camera roll permissions to upload images")
      return
    }
  
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: (ImagePicker as any).MediaType?.Images || ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      allowsMultipleSelection: true, // ✅ allow multiple images
      selectionLimit: 8 - images.length, // ✅ prevent exceeding 8 images
      quality: 1, // Keep original quality for preview - compression happens during upload
    })
  
    if (!result.canceled) {
      // Store original images for preview - no compression
      const selectedUris = result.assets.map((asset) => asset.uri);
      console.log("📸 Storing original images for preview (no compression)");
      setImages([...images, ...selectedUris].slice(0, 6)); // ✅ limit max 6
    }
  }

  const removeImage = (index: number) => {
    const newImages = [...images]
    newImages.splice(index, 1)
    setImages(newImages)
  }

  const toggleFeature = (feature: string) => {
    setFeatures({
      ...features,
      [feature]: !features[feature as keyof typeof features],
    })
  }

  const validateCurrentStep = () => {
    if (currentStep === 1) {
      if (images.length === 0) {
        Alert.alert("Missing Images", "Please upload at least one image of your bike")
        return false
      }
      if (images.length > 20) {
        Alert.alert("Too Many Images", "You can upload a maximum of 20 images")
        return false
      }
      if (!title || !price) {
        Alert.alert("Missing Information", "Please fill in all required fields")
        return false
      }
      if (!adCity) {
        Alert.alert("Missing Information", "Please select a city")
        return false
      }
      if (!registrationCity) {
        Alert.alert("Missing Information", "Please select registration city")
        return false
      }
    } else if (currentStep === 2) {
      if (!selectedYear || !carChoices || carChoices.length === 0) {
        Alert.alert("Missing Information", "Please select bike details")
        return false
      }
      if (!fuelType) {
        Alert.alert("Missing Information", "Please fill in all required fields")
        return false
      }
    } else if (currentStep === 3) {
      if (!location) {
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

  const handleSubmit = async () => {
  if (!userData || !userData.userId) {
    navigation.navigate("LoginScreen");
    return;
  }

  setIsLoading(true);

  const formData = new FormData();

  formData.append("userId", userData.userId);
  formData.append("location", location);
  formData.append("adCity", adCity);
  formData.append("title", title);
  formData.append("make", form.make || (carChoices && carChoices[0]?.make || ""));
  formData.append("model", form.model || (carChoices && carChoices[0] ? `${carChoices[0].make} ${carChoices[0].model}${carChoices[0].variant? ' '+carChoices[0].variant: ''}` : ""));
  formData.append("variant", form.variant || (carChoices && carChoices[0]?.variant || ""));
  formData.append("enginetype", bodyType);
  formData.append("preferredContact", preferredContact);
  formData.append("year", selectedYear || form.year || "");
  formData.append("registrationCity", registrationCity);
  formData.append("price", price);
  formData.append("bodyColor", color === "Other" ? customColor : color);
  formData.append("fuelType", fuelType);
  formData.append("engineCapacity", engineSize);
  formData.append("description", description);
  
  // Use enhanced features array
  formData.append("features", (selectedFeatures || []).join(","));
  
  // Attach original images without compression
  console.log("🔧 Processing images for upload (original quality)...");
  const maxImagesToUpload = 6; // Limit to 6 images
  const imagesToProcess = images.slice(0, maxImagesToUpload);
  console.log("🔧 Total images to upload:", imagesToProcess.length);
  
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

  // Log form data for debugging
  console.log("Form Data being sent:", formData);

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
      ToastAndroid.show("File size too large. Please reduce image size or upload fewer images.", ToastAndroid.LONG);
      setIsLoading(false);
      return;
    }

    // Check if response is JSON before parsing
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      const errorText = await response.text();
      console.error("Non-JSON response:", errorText.substring(0, 500));
      ToastAndroid.show(`Server returned invalid response (${response.status}). Please try again.`, ToastAndroid.LONG);
      setIsLoading(false);
      return;
    }

    const data = await response.json();
    console.log("API Response:", data);

    if (response.ok) {
      ToastAndroid.show("Ad posted successfully!", ToastAndroid.LONG);
      navigation.navigate("HomeTabs" as any);
    } else {
      console.error("Ad creation failed:", data.message);
      ToastAndroid.show(data.message || "Error creating ad. Please check your data and try again.", ToastAndroid.LONG);
    }
  } catch (error) {
    console.error("Error creating ad:", error);
    if (error.message && (error.message.includes('File size too large') || error.message.includes('413'))) {
      ToastAndroid.show("Upload failed. Please try uploading fewer images or try again.", ToastAndroid.LONG);
    } else {
      ToastAndroid.show(error.message || "Error creating ad. Please try again.", ToastAndroid.LONG);
    }
    ToastAndroid.show("An error occurred while creating the ad.", ToastAndroid.LONG);
  }
  
  setIsLoading(false);
};

  // const handleSubmit = () => {
  //   if (validateCurrentStep()) {
  //     // Submit form logic would go here
  //     Alert.alert("Success", "Your car listing has been submitted for review")
  //     navigation.navigate("Home")
  //   }
  // }
  
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
          maxImages={20}
          title="Upload Photos (Max 20)"
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
              placeholder="e.g. 2018 Honda in excellent condition"
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
              onChangeText={setPrice}
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
                onPress={() => { if (!adCity) { (navigation as any).navigate('BuyCarforMeLocationScreen', { returnTo: 'PostBikeAd' }) } }}
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
            <View style={[styles.input, { flexDirection:'row', alignItems:'center', justifyContent:'space-between' }]}
            >
              <TouchableOpacity
                style={{ flex:1 }}
                onPress={() => { if (adCity && !location) { (navigation as any).navigate('AreaSelectorScreen', { city: adCity, returnTo: 'PostBikeAd' }) } }}
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
            <Text style={styles.label}>Registration City <Text style={styles.required}>*</Text></Text>
            <View style={[styles.input, { flexDirection:'row', alignItems:'center', justifyContent:'space-between' }]}>
              <TouchableOpacity
                style={{ flex:1 }}
                onPress={() => { if (!registrationCity) { (navigation as any).navigate('BuyCarforMeCityScreen', { returnTo: 'PostBikeAd' }) } }}
                disabled={!!registrationCity}
              >
                <Text style={{ color: registrationCity ? COLORS.black : COLORS.darkGray }}>{registrationCity || 'Select Registration City'}</Text>
              </TouchableOpacity>
              {!!registrationCity && (
                <TouchableOpacity onPress={() => { setRegistrationCity(''); setForm((prev) => ({ ...prev, registrationCity: '' })) }}
                  style={{ marginLeft:10, paddingHorizontal:8, paddingVertical:4, borderRadius:12, backgroundColor:'#F2F2F2' }}>
                  <Text style={{ color: COLORS.primary }}>×</Text>
                </TouchableOpacity>
              )}
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
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Bike Details</Text>

        {/* <View style={styles.inputContainer}>
          <Text style={styles.label}>
            Brand <Text style={styles.required}>*</Text>
          </Text>
          <TextInput style={styles.input} placeholder="e.g. Toyota, Honda, BMW" value={brand} onChangeText={setBrand} />
        </View> */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>
            Year <Text style={styles.required}>*</Text>
          </Text>
          <TouchableOpacity style={styles.input} onPress={() => (navigation as any).navigate('BuyCarforMeYearScreen', { returnTo: 'PostBikeAd' })}>
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
              <TouchableOpacity onPress={() => (navigation as any).navigate('BuyCarforMeBrandFlowScreen', { year: selectedYear, returnTo: 'PostBikeAd' })} style={{ width:36, height:36, borderRadius:18, borderWidth:1, borderColor: COLORS.lightGray, justifyContent:'center', alignItems:'center' }}>
                <Text style={{ fontSize:18, color: COLORS.black }}>+</Text>
              </TouchableOpacity>
          </View>
          </View>
        )}
        {(!carChoices || carChoices.length === 0) && (
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Bike Model</Text>
            <TouchableOpacity onPress={() => (navigation as any).navigate('BuyCarforMeBrandFlowScreen', { year: selectedYear, returnTo: 'PostBikeAd' })} style={[styles.input, { justifyContent:'center' }]}>
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
    {colors.map((type, index) => (
      <TouchableOpacity
        key={index}
        style={[
          styles.categoryChip,
          color === type && styles.selectedCategoryChip
        ]}
        onPress={() => {
          setColor(type);
          setShowCustomInput(false);
          setCustomColor("");
        }}
      >
        <Text
          style={[
            styles.categoryChipText,
            color === type && styles.selectedCategoryChipText
          ]}
        >
          {type}
        </Text>
      </TouchableOpacity>
    ))}

    {/* "Other" button */}
    <TouchableOpacity
      style={[
        styles.categoryChip,
        showCustomInput && styles.selectedCategoryChip
      ]}
      onPress={() => {
        setColor("Other");
        setShowCustomInput(true);
      }}
    >
      <Text
        style={[
          styles.categoryChipText,
          showCustomInput && styles.selectedCategoryChipText
        ]}
      >
        Other
      </Text>
    </TouchableOpacity>
  </View>

  {/* Custom color input field */}
  {showCustomInput && (
    <TextInput
      style={styles.input}
      placeholder="Enter custom color"
      value={customColor}
      onChangeText={(text) => setCustomColor(text)}
    />
  )}
</View>

          {/* <View style={[styles.inputContainer, styles.halfInput]}>
            <Text style={styles.label}>Color</Text>
            <TextInput style={styles.input} placeholder="e.g. Black" value={color} onChangeText={setColor} />
          </View> */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>
              Engine Capacity <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 2.0"
              value={engineSize}
              onChangeText={setEngineSize}
              keyboardType="numeric"
            />
            {!!engineSize && (
              <Text style={{ marginTop: 6, color: '#28a745' }}>{formatEngineCapacityInWords(engineSize)}</Text>
            )}
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
          onPress={() => (navigation as any).navigate('FeaturesSelectorScreen', { preselected: selectedFeatures, returnTo: 'PostBikeAd' })}
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
        <Text style={styles.sectionTitle}>Contact Information</Text>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>
            Location <Text style={styles.required}>*</Text>
          </Text>
          <TextInput style={styles.input} placeholder="e.g. Lahore, Pk" value={location} onChangeText={setLocation} />
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
      </View>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.black} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Sell Your Bike</Text>
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
          {currentStep === 3 && renderStep3()}
          {currentStep === 4 && renderStep4()}

          <View style={styles.buttonContainer}>
            {currentStep > 1 && (
              <TouchableOpacity style={styles.backStepButton} onPress={handlePreviousStep}>
                <Text style={styles.backStepButtonText}>Back</Text>
              </TouchableOpacity>
            )}

            {currentStep < 4 ? (
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
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.submitButtonText}>Submit Listing</Text>
                )}
              </TouchableOpacity>
            )}
          </View>

          {currentStep === 4 && (
            <View style={styles.premiumButtonContainer}>
              <TouchableOpacity 
                style={styles.premiumButton} 
                onPress={() => {
                  // Collect all ad data from form state
                  const adData = {
                    title,
                    price,
                    description,
                    category,
                    make: form.make || (carChoices && carChoices[0]?.make || ""),
                    model: form.model || (carChoices && carChoices[0] ? `${carChoices[0].make} ${carChoices[0].model}${carChoices[0].variant? ' '+carChoices[0].variant: ''}` : ""),
                    variant: form.variant || (carChoices && carChoices[0]?.variant || ""),
                    year: selectedYear || form.year || "",
                    registrationCity,
                    location,
                    adCity,
                    bodyColor: color === "Other" ? customColor : color,
                    fuelType,
                    engineCapacity: engineSize,
                    enginetype: bodyType,
                    preferredContact,
                    features: selectedFeatures || [],
                    images: images,
                    userId: userData?.userId,
                    propertyType: 'bike', // Explicitly set as bike
                    isNewAd: true, // Flag to indicate this is a new ad, not existing
                  };
                  
                  console.log("📦 Navigating to UpgradeFreeAdToPremium with ad data:", adData);
                  (navigation as any).navigate('UpgradeFreeAdToPremium', {
                    adData: adData,
                    propertyType: 'bike',
                    isNewAd: true
                  });
                }}
              >
                <Ionicons name="star" size={20} color={COLORS.white} />
                <Text style={styles.premiumButtonText}>Upgrade to Premium</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = createResponsiveStyleSheet({
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
    paddingHorizontal: 20,
    paddingBottom: 10,
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
  premiumButtonContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
    marginTop: 20,
  },
  premiumButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: COLORS.primary,
    width: '100%',
  },
  premiumButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
})

export default PostBikeAd
