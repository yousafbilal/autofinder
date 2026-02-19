import React, { useEffect, useState } from "react"
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
import { compressImages, compressImage } from "../../utils/imageCompression";

const PostAutoPartsAd = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const route = useRoute<any>();
  
  const [currentStep, setCurrentStep] = useState(1)
  const [images, setImages] = useState([])

  // Basic Information
  const [title, setTitle] = useState("")
  const [price, setPrice] = useState("")
  const [priceWords, setPriceWords] = useState("") // For displaying converted price in words
  const [description, setDescription] = useState("")
  const [fuelType, setFuelType] = useState("")

  // Contact Information
  const [location, setLocation] = useState("")
  const [adCity, setAdCity] = useState("")
  const [preferredContact, setPreferredContact] = useState("phone")
  const [isLoading, setIsLoading] = useState(false); // Manage loading state

  const fuelTypes = ["Transmission", "Engine", "Interior Exterior", "Body Parts", "Electric/ Electronic Parts", "Suspension", "Tires and Wheels", "Car Care"]
  const [userData, setUserData] = useState<any>(null);

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

  // Handle navigation params for city selection
  useEffect(() => {
    const params = route.params || {};
    if (typeof params.selectedLocation === 'string' && params.selectedLocation) {
      setAdCity(params.selectedLocation);
    }
    if (typeof params.selectedArea === 'string' && params.selectedArea) {
      setLocation(params.selectedArea);
    }
  }, [route.params]);

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
      // Store original images for preview - compression will happen only during upload
      const selectedUris = result.assets.map((asset) => asset.uri);
      console.log("📸 Storing original images for preview (compression will happen during upload)");
      setImages([...images, ...selectedUris].slice(0, 6)); // ✅ limit max 6
    }
  }
  const removeImage = (index) => {
    const newImages = [...images]
    newImages.splice(index, 1)
    setImages(newImages)
  }

  // Number to words conversion function (same as FilterModal)
  const numberToWords = (num: number): string => {
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
  }

  const validateCurrentStep = () => {
    if (currentStep === 1) {
      if (images.length === 0) {
        Alert.alert("Missing Images", "Please upload at least one image of your auto part")
        return false
      }
      if (!title || !price) {
        Alert.alert("Missing Information", "Please fill in all required fields")
        return false
      }
    } else if (currentStep === 2) {
      if (!adCity || !location) {
        Alert.alert("Missing Information", "Please select city and area")
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
  formData.append("price", price);
  formData.append("partType", fuelType);
  formData.append("description", description);
  
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
  console.log("Form Data being sent:");
  for (let [key, value] of formData.entries()) {
    console.log(`${key}:`, value);
  }

  try {
    const response = await fetch(`${API_URL}/autoparts`, {
      method: "POST",
      body: formData,
      // Do not set Content-Type for FormData - fetch sets multipart/form-data with boundary
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
      const errorText = await response.text();
      console.error("Non-JSON response:", errorText.substring(0, 500));
      Alert.alert("Error", `Server returned invalid response (${response.status}). Please try again.`);
      setIsLoading(false);
      return;
    }

    const data = await response.json();
    console.log("API Response:", data);

    if (response.ok) {
      // Clear cache to ensure fresh data is fetched
      try {
        await AsyncStorage.removeItem("cache_auto_store_ads");
        console.log("✅ Cache cleared for auto parts");
      } catch (error) {
        console.error("Error clearing cache:", error);
      }
      
      Alert.alert("Success", "Ad posted successfully!", [
        {
          text: "OK",
          onPress: () => {
            // Navigate to Home to trigger AutoStoreAds refresh via useFocusEffect
            (navigation as any).navigate("HomeTabs", { screen: "Home" });
          }
        }
      ]);
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
                ? "Photos & Basic Info"
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
          <Text style={styles.sectionTitle}>Upload Photos</Text>
          <Text style={styles.sectionSubtitle}>Add up to 20 photos (first image will be the cover)</Text>

          <View style={styles.imagesContainer}>
            <TouchableOpacity style={styles.addImageButton} onPress={pickImage}>
              <Ionicons name="camera-outline" size={32} color={COLORS.darkGray} />
              <Text style={styles.addImageText}>Add Photo</Text>
            </TouchableOpacity>

            {images.map((image, index) => (
              <View key={index} style={styles.imageContainer}>
                <Image source={{ uri: image }} style={styles.image} />
                <TouchableOpacity style={styles.removeImageButton} onPress={() => removeImage(index)}>
                  <Ionicons name="close-circle" size={24} color={COLORS.primary} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>

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
              onChangeText={(text) => {
                setPrice(text);
                // Convert to words and update priceWords
                const numeric = parseInt((text || '').replace(/\D/g, ''), 10);
                if (numeric && numeric > 0) {
                  setPriceWords(numberToWords(numeric));
                } else {
                  setPriceWords("");
                }
              }}
              keyboardType="numeric"
            />
            {priceWords ? (
              <Text style={styles.convertedText}>{priceWords}</Text>
            ) : null}
          </View>
             <View style={styles.inputContainer}>
          <Text style={styles.label}>
            Category <Text style={styles.required}>*</Text>
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
          <Text style={styles.label}>Select City <Text style={styles.required}>*</Text></Text>
          <View style={[styles.input, { flexDirection:'row', alignItems:'center', justifyContent:'space-between' }]}>
            <TouchableOpacity
              style={{ flex:1 }}
              onPress={() => { if (!adCity) { (navigation as any).navigate('BuyCarforMeLocationScreen', { returnTo: 'PostAutoPartsAd' }) } }}
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
              onPress={() => { if (adCity && !location) { (navigation as any).navigate('AreaSelectorScreen', { city: adCity, returnTo: 'PostAutoPartsAd' }) } }}
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
  convertedText: {
    fontSize: 14,
    color: '#4CAF50', // Green color
    fontWeight: '500',
    marginTop: 4,
    textAlign: 'left',
  },
})

export default PostAutoPartsAd
