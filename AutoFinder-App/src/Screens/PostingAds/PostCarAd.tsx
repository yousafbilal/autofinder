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
import { compressImages } from "../../utils/imageCompression"
import { NavigationProp, useNavigation, useRoute } from "@react-navigation/native";
import { RootStackParamList } from "../../../navigationTypes";
import { carData as rawCarData, featureList,bodyTypes, bodyColors, fuelTypes } from "../../Components/DropdownData"; // Import dropdown data
import { enhancedDropdownData } from "../../Components/EnhancedDropdownData"; // Import enhanced dropdown data
import EnhancedImagePicker from "../../Components/EnhancedImagePicker"; // Import enhanced image picker
import { pakistaniCities, pakistaniLocations } from "../../Components/EnhancedDropdownData";
import EnhancedFeaturesPicker from "../../Components/EnhancedFeaturesPicker"; // Import enhanced features picker
import DropDownPicker from "react-native-dropdown-picker"
import { rf, rp, createResponsiveStyleSheet, isAndroid } from "../../utils/responsive";


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

const SellCarScreen = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const route = useRoute<any>();
  
  const [currentStep, setCurrentStep] = useState(1)
  const [images, setImages] = useState<string[]>([])

  // Basic Information
  const [title, setTitle] = useState("")
  const [price, setPrice] = useState("")
  const [description, setDescription] = useState("")
  const [category, setCategory] = useState("")
  const [assembly, setAssembly] = useState("")

  // Location Information
  const [registrationCity, setRegistrationCity] = useState("")
  const [selectedRegistrationCity, setSelectedRegistrationCity] = useState("")
  const [adCity, setAdCity] = useState("")
  const [showCitySuggestions, setShowCitySuggestions] = useState(false)
  const [showAreaSuggestions, setShowAreaSuggestions] = useState(false)
  const [showRegCitySuggestions, setShowRegCitySuggestions] = useState(false)

  // Car Details
  const [mileage, setMileage] = useState("")
  const [fuelType, setFuelType] = useState("")
  const [transmission, setTransmission] = useState("")
  const [color, setColor] = useState("");
  const [customColor, setCustomColor] = useState("");
  const [selectedYear, setSelectedYear] = useState<string>("")
  type CarChoice = { make: string; model: string; variant?: string }
  const [carChoices, setCarChoices] = useState<CarChoice[]>([])

  // Enhanced Features
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([])
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [bodyType, setBodyType] = useState("")
  const [engineSize, setEngineSize] = useState("")

  // Features
  const [features, setFeatures] = useState({
    AirConditioning: false,
    PowerSteering: false,
    PowerWindows: false,
    Abs: false,
    Airbags: false,
    Sunroof: false,
    Bluetooth: false,
    CruiseControl: false,
    ParkingSensors: false,
    Navigation: false,
    LeatherSeats: false,
    HeatedSeats: false,
    RearCamera: false,
    KeylessEntry: false,
    AlloyWheels: false,
    FogLights: false,
    Touchscreen: false,
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
  const [preferredContact, setPreferredContact] = useState("phone")
  const [isLoading, setIsLoading] = useState(false); // Manage loading state

  // ScrollView ref to reset to top on step change
  const scrollRef = useRef<ScrollView | null>(null);

  const categories = ["Automatic Cars", "Family Cars", "5 Seater", "4 Seater", "Imported Cars", "Old Cars", "Japanese Cars", "Low Mileage", "Jeep", "Hybrid Cars"];

  // Always scroll to top when step changes
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ y: 0, animated: true });
    }
  }, [currentStep]);
  const fuelTypes = ["Petrol", "Diesel", "Hybrid", "Electric", "LPG", "CNG"]
  const transmissionTypes = ["Automatic", "Manual", "Semi-Automatic", "CVT"]
  const bodyTypes = ["Hatchback", "High Roof Single Cabin", "Sedan", "SUV", "Crossover", "Mini Van", "Van", "MPV", "Micro Van", "Compact sedan", "Double Cabin", "Compact SUV", "Pick Up", "Station Wagon", "Coupe", "Mini Vehicles", "Truck", "Convertible", "High Roof", "Off Road Vehicles", "Compact Hatchback"];
  const colors = ["White", "Black", "Gray", "Silver", "Red", "Blue", "Green", "Yellow", "Orange", "Brown", "Beige", "Gold", "Pink", "Purple", "Teal", "Maroon", "Navy", "Champagne", "Turquoise", "Mint"];
  const assemblyType = ["Local", "Imported"]
  const [userData, setUserData] = useState<any>(null);
  const [openMake, setOpenMake] = useState(false);
  const [selectedMake, setSelectedMake] = useState<string | null>(null);
  const [openModel, setOpenModel] = useState(false);
  const [selectedModel, setSelectedModel] = useState<string | null>(null);
  const [openVariant, setOpenVariant] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState<string | null>(null);
  const [openYear, setOpenYear] = useState(false);
  const [openRegistrationCity, setOpenRegistrationCity] = useState(false);
  const [registrationCities, setRegistrationCities] = useState<{label: string, value: string}[]>([])
  

  const makes = Object.keys(carData || {}).map((make) => ({
    label: make,
    value: make,
  }));

  const models = selectedMake && carData[selectedMake]?.models
    ? Object.keys(carData[selectedMake]?.models || {}).map((model) => ({
        label: model,
        value: model,
      }))
  : [];

  const variants = selectedMake && selectedModel && carData[selectedMake]?.models[selectedModel]?.variants
    ? Object.keys(carData[selectedMake]?.models[selectedModel]?.variants || {}).map((variant) => ({
        label: variant,
        value: variant,
      }))
  : [];

  const years = selectedMake && selectedModel && selectedVariant
    ? (carData[selectedMake]?.models[selectedModel]?.variants[selectedVariant] || []).map((year) => ({
        label: year,
        value: year,
      }))
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
    const params: any = route.params || {}
    if (typeof params.selectedLocation === 'string' && params.selectedLocation) {
      setAdCity(params.selectedLocation)
      setLocation('')
    }
    if (typeof params.selectedRegistrationCity === 'string' && params.selectedRegistrationCity) {
      setRegistrationCity(params.selectedRegistrationCity)
      setSelectedRegistrationCity(params.selectedRegistrationCity)
      setForm((prev) => ({ ...prev, registrationCity: params.selectedRegistrationCity }))
    }
    if (typeof params.selectedArea === 'string' && params.selectedArea) {
      setLocation(params.selectedArea)
    }
    if (typeof params.preselectedYear === 'string') {
      setSelectedYear(params.preselectedYear)
      setForm(prev => ({ ...prev, year: params.preselectedYear }))
    }
    if (Array.isArray(params.carChoices) && params.carChoices.length) {
      const incoming = params.carChoices as CarChoice[]
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
  useEffect(() => {
    // Use local pakistaniCities array instead of API call
    const formatted = pakistaniCities.map((city: string) => ({
              label: city,
              value: city,
            }))
          setRegistrationCities(formatted)
        setIsLoading(false)
  }, [])
  const pickImage = async () => {
  const maxImages = 6; // Reduced to 6 to prevent 413 error
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
    selectionLimit: 6 - images.length, // ✅ prevent exceeding 6 images (safer limit)
    quality: 1, // Keep original quality for preview - compression happens during upload
  })

  if (!result.canceled) {
    // Store original images for preview - compression will happen only during upload
    const selectedUris = result.assets.map((asset) => asset.uri);
    console.log("📸 Storing original images for preview (compression will happen during upload)");
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
      [feature]: !(features as any)[feature],
    })
  }

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

  const formatMileageInWords = (raw: string) => {
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

  const validateCurrentStep = () => {
    if (currentStep === 1) {
      if (images.length === 0) {
        Alert.alert("Missing Images", "Please upload at least one image of your car")
        return false
      }
      if (images.length > 8) {
        Alert.alert("Too Many Images", "You can upload a maximum of 8 images")
        return false
      }
      if (!title || !price) {
        Alert.alert("Missing Information", "Please fill in all required fields")
        return false
      }
    } else if (currentStep === 2) {
      if (!mileage || !fuelType || !transmission || !selectedYear) {
        Alert.alert("Missing Information", "Please fill in all required fields")
        return false
      }
    } else if (currentStep === 4) {
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

  // Check free ad limit before submission
  try {
    const pricingResponse = await fetch(`${API_URL}/user-pricing/${userData.userId}`);
    if (pricingResponse.ok) {
      const pricingData = await pricingResponse.json();
      console.log("📊 Checking free ads remaining:", pricingData.freeAdsRemaining);
      
      // If free ads exhausted (0 remaining), redirect to 525 package
      if (pricingData.freeAdsRemaining === 0) {
        console.log("🎯 Free ads limit exhausted - redirecting to 525 package");
        
        // Prepare ad data for payment screen
        const adDataForPayment = {
          title,
          price,
          description,
          location,
          make: form.make || (carChoices[0]?.make || ""),
          model: form.model || (carChoices[0] ? `${carChoices[0].make} ${carChoices[0].model}${carChoices[0].variant? ' '+carChoices[0].variant: ''}` : ""),
          variant: form.variant || (carChoices[0]?.variant || ""),
          year: selectedYear || form.year || "",
          registrationCity: selectedRegistrationCity || registrationCity,
          bodyType,
          bodyColor: color === "Other" ? customColor : color,
          kmDriven: mileage,
          fuelType,
          engineCapacity: engineSize,
          transmission,
          assembly,
          preferredContact,
          features: selectedFeatures,
          images: images,
          image1: images[0] || null,
          image2: images[1] || null,
          image3: images[2] || null,
          image4: images[3] || null,
          image5: images[4] || null,
          image6: images[5] || null,
        };
        
        if (Platform.OS === 'android') {
          ToastAndroid.show("🎯 Free ads limit completed! Redirecting to 525 PKR package...", ToastAndroid.LONG);
          setTimeout(() => {
            (navigation as any).navigate("PaymentScreen", {
              userId: userData.userId,
              adData: adDataForPayment,
              cost: 525,
              isAdService: true
            });
          }, 2000);
        } else {
          Alert.alert(
            "🎯 Free Ads Limit Completed",
            "You have used all your free ads (2/2). To post more car ads, you need to purchase our 525 PKR package.\n\nThis amount will be adjusted from any premium service you purchase later.",
            [
              {
                text: "Cancel",
                style: "cancel"
              },
              {
                text: "Continue to Payment",
                onPress: () => {
                  (navigation as any).navigate("PaymentScreen", {
                    userId: userData.userId,
                    adData: adDataForPayment,
                    cost: 525,
                    isAdService: true
                  });
                }
              }
            ]
          );
        }
        return; // Stop submission
      }
    }
  } catch (pricingError) {
    console.error("Error checking free ad limit:", pricingError);
    // Continue with submission if pricing check fails
  }

  // Validate image count to prevent 413 error
  if (images.length > 6) {
    Alert.alert(
      "Too Many Images",
      "Please select maximum 6 images to prevent upload errors. Currently you have " + images.length + " images.",
      [{ text: "OK" }]
    );
    return;
  }

  setIsLoading(true);

  const formData = new FormData();

  formData.append("userId", userData.userId);
  formData.append("location", location);
  formData.append("title", title);
  formData.append("make", form.make || (carChoices[0]?.make || ""));
  formData.append("model", form.model || (carChoices[0] ? `${carChoices[0].make} ${carChoices[0].model}${carChoices[0].variant? ' '+carChoices[0].variant: ''}` : ""));
  formData.append("variant", form.variant || (carChoices[0]?.variant || ""));
  formData.append("bodyType", bodyType);
  formData.append("category", category);
  formData.append("preferredContact", preferredContact);
  formData.append("year", selectedYear || form.year || "");
  formData.append("registrationCity", selectedRegistrationCity || registrationCity);
  formData.append("price", price);
  formData.append("bodyColor", color === "Other" ? customColor : color);
  formData.append("kmDriven", mileage);
  formData.append("fuelType", fuelType);
  formData.append("engineCapacity", engineSize);
  formData.append("description", description);
  formData.append("transmission", transmission);
  formData.append("assembly", assembly);

  // Use enhanced features array
  formData.append("features", selectedFeatures.join(","));

  // Optimize images for faster upload (resize + light compress; quality stays good, size drops = quicker upload)
  const maxImagesToUpload = 6;
  const imagesToProcess = images.slice(0, maxImagesToUpload);
  console.log("🔧 Optimizing images for fast upload...");
  let urisToUpload: string[] = [];
  try {
    urisToUpload = await compressImages(imagesToProcess, 1200, 1200, 0.78);
  } catch (e) {
    console.warn("⚠️ Optimize failed, using originals:", e);
    urisToUpload = imagesToProcess;
  }

  urisToUpload.forEach((imageUri, index) => {
    formData.append(`image${index + 1}`, {
      uri: imageUri,
      name: `image_${index + 1}.jpg`,
      type: "image/jpeg",
    } as unknown as Blob);
  });

  //

  try {
    console.log("🚀 Sending request to:", `${API_URL}/free_ads`);
    console.log("🚀 API_URL:", API_URL);
    console.log("🚀 FormData contents:", {
      userId: userData.userId,
      title: title,
      price: price,
      make: form.make,
      model: form.model,
      imagesCount: images.length
    });

    // Check if API_URL is properly configured
    if (!API_URL) {
      throw new Error("API URL is not configured. Please check your config.");
    }

    // Create AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 90000); // 90s for image upload on slow networks

    // Test backend connectivity first
    console.log("🔍 Testing backend connectivity...");
    try {
      const testResponse = await fetch(`${API_URL}/health`, {
        method: "GET",
        signal: controller.signal,
      });
      console.log("🔍 Backend connectivity test result:", testResponse.status);
    } catch (testError) {
      console.log("🔍 Backend connectivity test failed:", testError.message);
      // Continue with the main request anyway, as the test endpoint might not exist
    }

    const response = await fetch(`${API_URL}/free_ads`, {
      method: "POST",
      body: formData,
      // DO NOT set Content-Type header for FormData in React Native
      // The system will set it automatically with the correct boundary
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    console.log("🚀 Response received, status:", response.status);
    
    // Check for 413 error specifically
    if (response.status === 413) {
      const errorText = await response.text();
      console.error("🚨 413 Request Entity Too Large:", errorText);
      throw new Error("File size too large. Please reduce image size or upload fewer images.");
    }
    
    // Check if response is JSON before parsing
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      const errorText = await response.text();
      console.error("🚨 Non-JSON response:", errorText.substring(0, 500));
      throw new Error(`Server returned invalid response (${response.status}). Please try again.`);
    }
    
    let data;
    try {
      data = await response.json();
    } catch (jsonError) {
      console.error("🚨 JSON parsing error:", jsonError);
      const errorText = await response.text();
      console.log("🚨 Response text:", errorText.substring(0, 500));
      throw new Error("Invalid response from server. Please try again.");
    }

    console.log("🚀 API Response Status:", response.status);
    console.log("🚀 API Response OK:", response.ok);
    console.log("🚀 API Response Data:", data);

    if (response.ok) {
      // Clear any relevant caches to ensure fresh data is fetched
      try {
        const AsyncStorage = await import("@react-native-async-storage/async-storage");
        // Clear cache keys that might store car ads data
        await AsyncStorage.default.multiRemove([
          "cache_featured_ads",
          "cache_certified_ads",
          "cache_managed_ads"
        ]);
        console.log("✅ Cache cleared for free ad");
      } catch (error) {
        console.error("Error clearing cache:", error);
      }
      
      if (Platform.OS === 'android') {
        ToastAndroid.show("Ad posted successfully!", ToastAndroid.LONG);
      } else {
        Alert.alert('', "Ad posted successfully!");
      }
      // Navigate to Home to trigger refresh via useFocusEffect
      navigation.navigate("HomeTabs", { screen: "Home" });
    } else {
      // Check if payment is required
      console.log("💰 Checking payment requirement - data.cost:", data.cost);
      if (data.cost && data.cost === 525) {
        console.log("💰 Free ads exhausted - showing user message and redirecting to payment");
        
        // Show user-friendly message first
        if (Platform.OS === 'android') {
          // For Android, show toast first, then redirect after a delay
          ToastAndroid.show("🎯 Free ads limit completed! Redirecting to 525 PKR package...", ToastAndroid.LONG);
          
          // Redirect after showing the message
          setTimeout(() => {
            console.log("💰 Android user - redirecting to payment screen with cost:", data.cost);
            (navigation as any).navigate("PaymentScreen", {
          userId: userData.userId,
          adData: {
            title,
            price,
            description,
            location,
            make: form.make,
            model: form.model,
            year: selectedYear || form.year,
            variant: form.variant,
            bodyType: form.bodyType,
            bodyColor: form.bodyColor,
            kmDriven: form.kmDriven,
            fuelType: form.fuelType,
            engineCapacity: form.engineCapacity,
            transmission: form.transmission,
            assembly: form.assembly,
            preferredContact: form.preferredContact,
            features: selectedFeatures,
            registrationCity: selectedRegistrationCity,
            // Add images to adData
            images: images,
            image1: images[0] || null,
            image2: images[1] || null,
            image3: images[2] || null,
            image4: images[3] || null,
            image5: images[4] || null,
            image6: images[5] || null,
            image7: images[6] || null,
            image8: images[7] || null,
            image9: images[8] || null,
            image10: images[9] || null,
            image11: images[10] || null,
            image12: images[11] || null,
            image13: images[12] || null,
            image14: images[13] || null,
            image15: images[14] || null,
            image16: images[15] || null,
            image17: images[16] || null,
            image18: images[17] || null,
            image19: images[18] || null,
            image20: images[19] || null,
          },
          cost: 525,
          isAdService: true
        });
          }, 2000); // 2 second delay to show the message
        } else {
          // For iOS, show alert with options
          Alert.alert(
            "🎯 Free Ads Limit Completed",
            "You have used all your free ads (2/2). To post more car ads, you need to purchase our 525 PKR package.\n\nThis amount will be adjusted from any premium service you purchase later.",
            [
              {
                text: "Cancel",
                style: "cancel"
              },
              {
                text: "Continue to Payment",
                onPress: () => {
                  console.log("💰 iOS user confirmed - redirecting to payment screen with cost:", data.cost);
                  // Redirect to payment page
                  (navigation as any).navigate("PaymentScreen", {
                    userId: userData.userId,
                    adData: {
                      title,
                      price,
                      description,
                      location,
                      make: form.make,
                      model: form.model,
                      year: selectedYear || form.year,
                      variant: form.variant,
                      bodyType: form.bodyType,
                      bodyColor: form.bodyColor,
                      kmDriven: form.kmDriven,
                      fuelType: form.fuelType,
                      engineCapacity: form.engineCapacity,
                      transmission: form.transmission,
                      assembly: form.assembly,
                      preferredContact: form.preferredContact,
                      features: selectedFeatures,
                      registrationCity: selectedRegistrationCity,
                      // Add images to adData
                      images: images,
                      image1: images[0] || null,
                      image2: images[1] || null,
                      image3: images[2] || null,
                      image4: images[3] || null,
                      image5: images[4] || null,
                      image6: images[5] || null,
                      image7: images[6] || null,
                      image8: images[7] || null,
                      image9: images[8] || null,
                      image10: images[9] || null,
                      image11: images[10] || null,
                      image12: images[11] || null,
                      image13: images[12] || null,
                      image14: images[13] || null,
                      image15: images[14] || null,
                      image16: images[15] || null,
                      image17: images[16] || null,
                      image18: images[17] || null,
                      image19: images[18] || null,
                      image20: images[19] || null,
                    },
                    cost: 525,
                    isAdService: true
                  });
                }
              }
            ]
          );
        }
      } else {
        console.log("❌ Payment redirect failed - data.cost:", data.cost, "Expected: 525");
        console.log("❌ Full error response:", data);
        const msg = (data?.error && String(data.error)) || data?.message || "Error creating ad. Please check your data and try again.";
        if (Platform.OS === 'android') {
          ToastAndroid.show(msg, ToastAndroid.LONG);
        } else {
          Alert.alert('Error', msg);
        }
      }
    }
  } catch (error) {
    console.error("🚨 Error creating ad:", error);
    console.error("🚨 Error details:", {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    
    let errorMessage = "An error occurred while creating the ad.";
    
    // Handle specific error types
    if (error.name === 'AbortError') {
      errorMessage = "Request timed out. Please check your internet connection and try again.";
    } else if (error.message.includes('Network request failed')) {
      errorMessage = "Network error. Please check your internet connection.";
    } else if (error.message.includes('File size too large') || error.message.includes('413')) {
      errorMessage = "Image size too large. Please upload fewer images (max 5-6 images) or use smaller images.";
    } else if (error.message.includes('Invalid response from server') || error.message.includes('invalid response')) {
      errorMessage = "Server error. Please try again later.";
    } else if (error.message.includes('API URL is not configured')) {
      errorMessage = "Configuration error. Please contact support.";
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    if (Platform.OS === 'android') {
      ToastAndroid.show(`Error: ${errorMessage}`, ToastAndroid.LONG);
    } else {
      Alert.alert('Error', errorMessage);
    }
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
                  ? "Car Details"
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
              placeholder="e.g. 2018 Honda Civic in excellent condition"
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
          <Text style={styles.label}>Select City <Text style={styles.required}>*</Text></Text>
          <View style={[styles.input, { flexDirection:'row', alignItems:'center', justifyContent:'space-between' }]}>
                  <TouchableOpacity
              style={{ flex:1 }}
              onPress={() => { if (!adCity) { (navigation as any).navigate('BuyCarforMeLocationScreen', { returnTo: 'PostCarAd' }) } }}
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
              onPress={() => { if (adCity && !location) { (navigation as any).navigate('AreaSelectorScreen', { city: adCity, returnTo: 'PostCarAd' }) } }}
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
              onPress={() => { if (!registrationCity) { (navigation as any).navigate('BuyCarforMeCityScreen', { returnTo: 'PostCarAd' }) } }}
              disabled={!!registrationCity}
            >
              <Text style={{ color: registrationCity ? COLORS.black : COLORS.darkGray }}>{registrationCity || 'Select Registration City'}</Text>
            </TouchableOpacity>
            {!!registrationCity && (
              <TouchableOpacity onPress={() => { setRegistrationCity(''); setSelectedRegistrationCity(''); setForm((prev) => ({ ...prev, registrationCity: '' })) }}
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
        <Text style={styles.sectionTitle}>Car Details</Text>

        {/* <View style={styles.inputContainer}>
          <Text style={styles.label}>
            Brand <Text style={styles.required}>*</Text>
          </Text>
          <TextInput style={styles.input} placeholder="e.g. Toyota, Honda, BMW" value={brand} onChangeText={setBrand} />
        </View> */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Year <Text style={styles.required}>*</Text></Text>
          <TouchableOpacity style={styles.input} onPress={() => (navigation as any).navigate('BuyCarforMeYearScreen', { returnTo: 'PostCarAd' })}>
            <Text style={{ color: selectedYear ? COLORS.black : COLORS.darkGray }}>{selectedYear || 'Select Year'}</Text>
          </TouchableOpacity>
        </View>
        {carChoices.length > 0 && (
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Car Model</Text>
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
              <TouchableOpacity onPress={() => (navigation as any).navigate('BuyCarforMeBrandFlowScreen', { year: selectedYear, returnTo: 'PostCarAd' })} style={{ width:36, height:36, borderRadius:18, borderWidth:1, borderColor: COLORS.lightGray, justifyContent:'center', alignItems:'center' }}>
                <Text style={{ fontSize:18, color: COLORS.black }}>+</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

          <View style={[styles.inputContainer, styles.halfInput]}>
            <Text style={styles.label}>
              Mileage (km) <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 25000"
              value={mileage}
              onChangeText={setMileage}
              keyboardType="numeric"
            />
            {!!mileage && (
              <Text style={{ marginTop: 6, color: '#28a745' }}>{formatMileageInWords(mileage)}</Text>
            )}
          </View>

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
         <View style={styles.inputContainer}>
                  <Text style={styles.label}>
                    Assembly <Text style={styles.required}>*</Text>
                  </Text>
                  <View style={styles.categoriesContainer}>
                    {assemblyType.map((type, index) => (
                      <TouchableOpacity
                        key={index}
                        style={[styles.categoryChip, assembly === type && styles.selectedCategoryChip]}
                        onPress={() => setAssembly(type)}
                      >
                        <Text style={[styles.categoryChipText, assembly === type && styles.selectedCategoryChipText]}>
                          {type}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Body Type</Text>
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
              <Text style={{ marginTop: 6, color: '#28a745' }}>{`${engineSize.replace(/\D/g, '')} cc`}</Text>
            )}
        </View>
      </View>
    )
  }

  const renderStep3 = () => {
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Features</Text>
        <Text style={styles.sectionSubtitle}>Choose car features</Text>
        <TouchableOpacity
          style={[styles.input, { flexDirection:'row', alignItems:'center', justifyContent:'space-between' }]}
          onPress={() => (navigation as any).navigate('FeaturesSelectorScreen', { preselected: selectedFeatures, returnTo: 'PostCarAd' })}
        >
          <Text style={{ color: selectedFeatures.length ? COLORS.black : COLORS.darkGray }}>
            {selectedFeatures.length ? `${selectedFeatures.length} selected` : 'Select Features'}
          </Text>
          <Ionicons name="chevron-forward" size={18} color={COLORS.darkGray} />
        </TouchableOpacity>
        {selectedFeatures.length > 0 && (
          <View style={{ flexDirection:'row', flexWrap:'wrap', marginTop:8 }}>
            {selectedFeatures.slice(0, 6).map((k) => (
              <View key={k} style={{ backgroundColor:'#EAF1FF', paddingHorizontal:10, paddingVertical:6, borderRadius:16, marginRight:6, marginBottom:6 }}>
                <Text style={{ color: COLORS.black }}>{k.replace(/([A-Z])/g, ' $1').trim()}</Text>
              </View>
            ))}
            {selectedFeatures.length > 6 && (
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
        <Text style={styles.headerTitle}>Sell Your Car</Text>
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
  disabled={isLoading} // Optional: disable while loading
>
  {isLoading ? (
    <ActivityIndicator size="small" color="#fff" />
  ) : (
    <Text style={styles.submitButtonText}>Submit Listing</Text>
  )}
</TouchableOpacity>
)}
          </View>
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
  suggestionBox: {
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    borderRadius: 8,
    backgroundColor: COLORS.white,
    marginTop: 6,
  },
  suggestionItem: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  suggestionText: {
    color: COLORS.black,
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
})

export default SellCarScreen
