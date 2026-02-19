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
import { COLORS } from "../../constants/colors"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { API_URL } from "../../../config"
import { NavigationProp, useNavigation, useRoute } from "@react-navigation/native";
import { RootStackParamList } from "../../../navigationTypes";
import DropDownPicker from "react-native-dropdown-picker"
// legacy dropdown data no longer used for brand/model/variant

const ListItforyou = () => {
const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const route = useRoute();
  const routeSelectedPackage = (route as any)?.params?.selectedPackage;
  
  // Store selectedPackage in state so it doesn't get lost when navigating to year/brand screens
  const [storedPackage, setStoredPackage] = useState<any>(null);
  
  // Get the actual selected package (from state if available, otherwise from route)
  const selectedPackage = storedPackage || routeSelectedPackage;
  
  // Store the package when it first arrives from route params
  useEffect(() => {
    if (routeSelectedPackage && !storedPackage) {
      console.log("📦 ListItforyou - Storing package in state:", routeSelectedPackage.title);
      setStoredPackage(routeSelectedPackage);
    }
  }, [routeSelectedPackage, storedPackage]);
  
  // Debug: Log the selected package
  useEffect(() => {
    console.log("📦 ListItforyou - Route params:", JSON.stringify((route as any)?.params, null, 2));
    console.log("📦 ListItforyou - Route Package:", JSON.stringify(routeSelectedPackage, null, 2));
    console.log("📦 ListItforyou - Stored Package:", JSON.stringify(storedPackage, null, 2));
    console.log("📦 ListItforyou - Final Selected Package:", JSON.stringify(selectedPackage, null, 2));
    
    if (selectedPackage && typeof selectedPackage === 'object') {
      console.log("📦 ListItforyou - Package ID:", selectedPackage.id);
      console.log("📦 ListItforyou - Package Title:", selectedPackage.title);
      console.log("📦 ListItforyou - Package Price:", selectedPackage.price);
    }
    
    // If no package selected (neither in route nor in state), redirect to package selection screen
    if (!selectedPackage && !routeSelectedPackage && !storedPackage) {
      console.log("⚠️ No package selected! Redirecting to package selection...");
      Alert.alert(
        "Select Package",
        "Please select a service package first.",
        [
          {
            text: "OK",
            onPress: () => navigation.navigate("ListItForYouScreen" as any)
          }
        ]
      );
    }
  }, [selectedPackage, routeSelectedPackage, storedPackage, navigation]);
  
  const [currentStep, setCurrentStep] = useState(1)
  const scrollRef = useRef<ScrollView | null>(null);

  // Basic Information
  const [title, setTitle] = useState("")
  const [price, setPrice] = useState("")
  const [description, setDescription] = useState("")
  const [category, setCategory] = useState("")

  // Car Details
  const [mileage, setMileage] = useState("")
  const [engineSize, setEngineSize] = useState("")  
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

  const categories = ["Automatic Cars", "Family Cars", "5 Seater", "4 Seater", "Imported Cars", "Old Cars", "Japanese Cars", "Low Mileage", "Jeep", "Hybrid Cars"];
  const [userData, setUserData] = useState<any>(null);
  const [selectedYear, setSelectedYear] = useState<string>("");
  type CarChoice = { make: string; model: string; variant?: string };
  const [carChoices, setCarChoices] = useState<CarChoice[]>([]);
  const [invoiceImage, setInvoiceImage] = useState<string | null>(null);

  // Scroll to top when step changes so next step always starts at top
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ y: 0, animated: true });
    }
  }, [currentStep]);

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
      // up to 99,999 → hazar
      const thousands = Math.floor(numeric / 1000)
      return `${thousands} hazar`
    }
    if (numeric < 10000000) {
      // up to 99,99,999 → lakh
      const lakhs = Math.floor(numeric / 100000)
      return `${lakhs} lakh`
    }
    const crores = Math.floor(numeric / 10000000)
    return `${crores} crore`
  }

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
    if (typeof params.preselectedYear === 'string') {
      setSelectedYear(params.preselectedYear)
      setForm(prev => ({ ...prev, year: params.preselectedYear }))
    }
    if (Array.isArray(params.carChoices) && params.carChoices.length) {
      const incoming = params.carChoices as CarChoice[]
      setCarChoices(prev => {
        const combined = [...prev, ...incoming]
        const dedup = Array.from(new Map(combined.map(c => [`${c.make}|${c.model}|${c.variant||''}`, c])).values())
        // hydrate legacy fields for backend
        setForm(f => ({
          ...f,
          make: dedup[0]?.make || f.make,
          model: dedup[0] ? `${dedup[0].make} ${dedup[0].model}${dedup[0].variant? ' '+dedup[0].variant: ''}` : f.model,
          variant: dedup[0]?.variant || f.variant,
        }))
        return dedup
      })
    }
    if (typeof params.selectedLocation === 'string' && params.selectedLocation) {
      setLocation(params.selectedLocation)
    }
  }, [route.params])
  const pickInvoiceImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  
    if (status !== "granted") {
      Alert.alert("Permission Denied", "We need camera roll permissions to upload the invoice.");
      return;
    }
  
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,  // disabled editing to remove cropping/aspect limits
      // Remove 'aspect' property completely
      quality: 1,
    });
  
    if (!result.canceled) {
      setInvoiceImage(result.assets[0].uri);
    }
  };
  const removeInvoiceImage = () => {
    setInvoiceImage(null);
  };

  const validateCurrentStep = () => {
    if (currentStep === 1) {
      if (!title || !price) {
        Alert.alert("Missing Information", "Please fill in all required fields")
        return false
      }
    } else if (currentStep === 2) {
      if (!mileage || !selectedYear) {
        Alert.alert("Missing Information", "Please fill in all required fields")
        return false
      }
    } else if (currentStep === 4) {
      if (!location || !location) {
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
      console.log("userID is here", userData.userId)


  const formData = new FormData();

  formData.append("userId", userData.userId);
  formData.append("location", location);
  formData.append("title", title);
  formData.append("make", form.make || (carChoices[0]?.make || ""));
  formData.append("model", form.model || (carChoices[0] ? `${carChoices[0].make} ${carChoices[0].model}${carChoices[0].variant? ' '+carChoices[0].variant: ''}` : ""));
  formData.append("variant", form.variant || (carChoices[0]?.variant || ""));
  formData.append("category", category);
  formData.append("year", selectedYear || "");
  formData.append("price", price);
  formData.append("kmDriven", mileage);
  formData.append("engineCapacity", engineSize);
  formData.append("description", description);
  
  // Send full package info with title and price for better admin visibility
  let packageInfo = "";
  if (selectedPackage) {
    if (typeof selectedPackage === 'object') {
      // Full package object with title and price
      packageInfo = `${selectedPackage.title || selectedPackage.id || 'Unknown'} - ${selectedPackage.price || ''}`;
      console.log("📦 Package being sent:", packageInfo);
    } else {
      // Just ID string
      packageInfo = String(selectedPackage);
    }
  }
  formData.append("selectedPlan", packageInfo);
if (invoiceImage) {
  // Attach invoice image without compression
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
  // console.log("Form Data being sent:");
  // Note: FormData.entries() is not typed in RN env; avoid iterating for lints

  try {
    const response = await fetch(`${API_URL}/list_it_for_you_ad`, {
      method: "POST",
      body: formData,
      // Do not set Content-Type for FormData - fetch sets multipart/form-data with boundary
    });

    const data = await response.json();
    console.log("API Response:", data);

    if (response.ok) {
      Alert.alert("Success", "Ad posted successfully!");
      navigation.navigate("HomeTabs");
    } else {
      console.error("Ad creation failed:", data.message);
      Alert.alert("Error", data.message || "Error creating ad. Please check your data and try again.");
    }
  } catch (error) {
    console.error("Error creating ad:", error);
    Alert.alert("Error", "An error occurred while creating the ad.");
  }
  
  setIsLoading(false);
};

  
  const renderStepIndicator = () => {
    return (
      <View style={styles.stepIndicatorContainer}>
        {[1, 2, 3].map((step) => (
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
                ? "Basic Info"
                : step === 2
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

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Year <Text style={styles.required}>*</Text></Text>
          <TouchableOpacity style={styles.input} onPress={() => (navigation as any).navigate('BuyCarforMeYearScreen', { returnTo: 'ListItforyou' })}>
            <Text style={{ color: selectedYear ? COLORS.black : COLORS.darkGray }}>{selectedYear ? selectedYear : 'Select Year'}</Text>
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
              <TouchableOpacity onPress={() => (navigation as any).navigate('BuyCarforMeBrandFlowScreen', { year: selectedYear, returnTo: 'ListItforyou' })} style={{ width:36, height:36, borderRadius:18, borderWidth:1, borderColor: COLORS.lightGray, justifyContent:'center', alignItems:'center' }}>
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
              value={mileage || ''}
              onChangeText={setMileage}
              keyboardType="numeric"
            />
            {!!mileage && (
              <Text style={{ marginTop: 6, color: '#28a745' }}>{formatMileageInWords(mileage)}</Text>
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
         <View style={styles.section}>
          {/* Title */}
          <Text style={styles.sectionTitle}>Upload Payment Invoice</Text>
        
          {/* Selected Plan Highlight */}
          <View style={styles.planBadge}>
            <Text style={styles.planText}>
              Selected Plan: {(() => {
                if (!selectedPackage) return 'Not selected'
                if (typeof selectedPackage === 'object') {
                  // Show full package info: title and price
                  const title = (selectedPackage as any)?.title || (selectedPackage as any)?.id || 'Unknown';
                  const price = (selectedPackage as any)?.price || '';
                  return `${title}${price ? ' - ' + price : ''}`;
                }
                return String(selectedPackage)
              })()}
            </Text>
          </View>
        
          {/* Subtitle */}
          <Text style={styles.sectionSubtitle}>Upload proof of payment (only 1 image allowed)</Text>
        
          {/* Image Upload Area */}
          <View style={styles.imagesContainer}>
            {!invoiceImage ? (
              <TouchableOpacity style={styles.addImageButton} onPress={pickInvoiceImage}>
                <Ionicons name="document-text-outline" size={32} color={COLORS.darkGray} />
                <Text style={styles.addImageText}>Upload Invoice</Text>
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
        </View>
        <Text style={styles.sectionTitle}>Contact Information</Text>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>
            Location <Text style={styles.required}>*</Text>
          </Text>
          <TouchableOpacity style={styles.input} onPress={() => (navigation as any).navigate('BuyCarforMeLocationScreen', { returnTo: 'ListItforyou' })}>
            <Text style={{ color: location ? COLORS.black : COLORS.darkGray }}>{location || 'Select Location'}</Text>
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

          <View style={styles.buttonContainer}>
            {currentStep > 1 && (
              <TouchableOpacity style={styles.backStepButton} onPress={handlePreviousStep}>
                <Text style={styles.backStepButtonText}>Back</Text>
              </TouchableOpacity>
            )}

            {currentStep < 3 ? (
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
  planBadge: {
    backgroundColor: COLORS.primary, // bright color for emphasis
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    alignSelf: "flex-start",
    marginVertical: 8,
  },
  
  planText: {
    color: COLORS.white,
    fontWeight: "bold",
    fontSize: 14,
  },
})

export default ListItforyou;
