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
import { FontAwesome, FontAwesome5, Ionicons } from "@expo/vector-icons"
import { COLORS } from "../../constants/colors"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { API_URL } from "../../../config"
import { NavigationProp, useNavigation, useRoute } from "@react-navigation/native";
import { RootStackParamList } from "../../../navigationTypes";
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import { compressImages } from "../../utils/imageCompression";
 
// Ensure car requirements match BuyCarForMe brand/year flow
const CarInspection = () => {
const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  
  const [currentStep, setCurrentStep] = useState(1)
  const [description, setDescription] = useState("")

  // Car Details
  const [mileage, setMileage] = useState("")
  const [engineSize, setEngineSize] = useState("")  
  const [form, setForm] = useState({
  make: "",
  model: "",
  variant: "",
  year: "",
  registrationCity: "",
  bodyType: "",
});


  // Contact Information
  const [location, setLocation] = useState("")
  const [isLoading, setIsLoading] = useState(false); // Manage loading state
  const [userData, setUserData] = useState<any>(null);
  const route = useRoute<any>();
  type CarChoice = { make: string; model: string; variant?: string }
  const [selectedYear, setSelectedYear] = useState<string>('')
  const [carChoices, setCarChoices] = useState<CarChoice[]>([])
  const [inspectionDate, setInspectionDate] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [inspectionTime, setInspectionTime] = useState(null);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(null);
  const [cantFindSlot, setCantFindSlot] = useState(false);
  
  // Payment Receipt
  const [paymentReceiptImages, setPaymentReceiptImages] = useState<string[]>([]);

  // Available time slots
  const availableTimeSlots = [
    "9:00 a.m.",
    "10:30 a.m.", 
    "12:00 p.m.",
    "3:30 p.m.",
    "5:00 p.m."
  ];

  const handleInputChange = (field: string, value: string | undefined) => {
    setForm((prevForm) => ({ ...prevForm, [field]: value }));
  };

  const handleTimeSlotSelect = (timeSlot: string) => {
    setSelectedTimeSlot(timeSlot);
    setForm((prev) => ({
      ...prev,
      inspection_time: timeSlot,
    }));
  };    

  const handleDateChange = (event, selectedDate) => {
  setShowDatePicker(false);
  if (selectedDate) {
    setInspectionDate(selectedDate);
    handleInputChange("inspection_date", selectedDate.toISOString()); // update form
  }
};

const handleTimeChange = (event, selectedTime) => {
  setShowTimePicker(false);
  if (selectedTime) {
    setInspectionTime(selectedTime);

    // Format time (e.g., "10:45 AM")
    const formattedTime = selectedTime.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });

    setForm((prev) => ({
      ...prev,
      inspection_time: formattedTime,
    }));
  }
};

// Calculate inspection price based on engine capacity
const calculateInspectionPrice = (engineCapacity: string, make?: string, bodyType?: string): { packageName: string; price: number } => {
  if (!engineCapacity || engineCapacity.trim() === '') {
    return { packageName: '', price: 0 }
  }

  // Extract numeric value from engine capacity string
  // Handle formats like "1.8", "1800", "1.8L", "1800cc", etc.
  let numeric = 0
  const cleaned = engineCapacity.replace(/\s+/g, '').toLowerCase()
  
  // Check if it's in liter format (e.g., "1.8", "2.0")
  if (cleaned.includes('.') && !cleaned.includes('cc')) {
    const literValue = parseFloat(cleaned.replace(/[^\d.]/g, ''))
    if (!isNaN(literValue)) {
      numeric = Math.round(literValue * 1000) // Convert liters to CC
    }
  } else {
    // Extract all digits
    numeric = parseInt(cleaned.replace(/\D/g, ''), 10)
  }
  
  if (!numeric || numeric <= 0) {
    return { packageName: '', price: 0 }
  }

  // German car brands
  const germanBrands = ['Mercedes', 'Mercedes-Benz', 'BMW', 'Audi', 'Porsche', 'Volkswagen', 'VW', 'Benz']
  const isGermanCar = make && germanBrands.some(brand => make.toLowerCase().includes(brand.toLowerCase()))
  
  // Check if SUV or 4x4
  const isSUV = bodyType && (bodyType.toLowerCase().includes('suv') || bodyType.toLowerCase().includes('4x4') || bodyType.toLowerCase().includes('4wd'))
  
  console.log('💰 Price calculation:', {
    engineCapacity,
    numeric,
    make,
    bodyType,
    isGermanCar,
    isSUV
  })
  
  // Pricing logic:
  // 1. Silver Whispers Package - PKR 3200 - up to 1000cc
  // 2. Diamond Delight Package - PKR 4250 - 1001cc to 2000cc
  // 3. Platinum Prestige Package - PKR 6500 - 2001cc+, SUV, 4x4, and German cars
  
  if (numeric <= 1000) {
    return { packageName: 'Silver Whispers Package', price: 3200 }
  } else if (numeric >= 1001 && numeric <= 2000 && !isGermanCar && !isSUV) {
    return { packageName: 'Diamond Delight Package', price: 4250 }
  } else {
    // 2001cc+ OR German car OR SUV/4x4
    return { packageName: 'Platinum Prestige Package', price: 6500 }
  }
}

const formatEngineCapacityInWords = (raw: string) => {
  const numeric = parseInt((raw || '').replace(/\D/g, ''), 10)
  if (!numeric || numeric <= 0) return ''
  if (numeric < 1000) {
    if (numeric % 100 === 0) return `${numeric / 100} hundred`
    return `${numeric} cc`
  }
  if (numeric < 100000) {
    const thousands = Math.floor(numeric / 1000)
    return `${thousands} hazar cc`
  }
  if (numeric < 10000000) {
    const lakhs = Math.floor(numeric / 100000)
    return `${lakhs} lakh cc`
  }
  const crores = Math.floor(numeric / 10000000)
  return `${crores} crore cc`
}

const formatMileageInWords = (raw: string) => {
  const numeric = parseInt((raw || '').replace(/\D/g, ''), 10)
  if (!numeric || numeric <= 0) return ''
  if (numeric < 1000) {
    if (numeric % 100 === 0) return `${numeric / 100} hundred`
    return `${numeric} km`
  }
  if (numeric < 100000) {
    const thousands = Math.floor(numeric / 1000)
    return `${thousands} hazar km`
  }
  if (numeric < 10000000) {
    const lakhs = Math.floor(numeric / 100000)
    return `${lakhs} lakh km`
  }
  const crores = Math.floor(numeric / 10000000)
  return `${crores} crore km`
}

// Payment Receipt Image Picker Functions
const pickPaymentReceiptImage = async () => {
  if (paymentReceiptImages.length >= 3) {
    Alert.alert("Limit Reached", "You can upload a maximum of 3 payment receipt images")
    return
  }

  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()

  if (status !== "granted") {
    Alert.alert("Permission Denied", "Sorry, we need camera roll permissions to upload images")
    return
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    quality: 1, // Keep original quality - no compression
    allowsEditing: false,
    allowsMultipleSelection: true,
    selectionLimit: 3 - paymentReceiptImages.length,
    quality: 1, // Keep original quality - no compression
  })

  if (!result.canceled) {
    const selectedUris = result.assets.map((asset) => asset.uri)
    setPaymentReceiptImages([...paymentReceiptImages, ...selectedUris].slice(0, 3))
  }
}

const removePaymentReceiptImage = (index: number) => {
  const newImages = [...paymentReceiptImages]
  newImages.splice(index, 1)
  setPaymentReceiptImages(newImages)
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

  // Handle selections coming back from BuyCarForMe flows and location selection
  useEffect(() => {
    const params: any = route.params || {}
    
    // Pre-fill form if carDetails are passed from car detail screen
    if (params.carDetails) {
      const car = params.carDetails
      if (car.make) {
        setForm(prev => ({ ...prev, make: car.make }))
      }
      if (car.model) {
        setForm(prev => ({ ...prev, model: car.model }))
      }
      if (car.variant) {
        setForm(prev => ({ ...prev, variant: car.variant }))
      }
      if (car.year) {
        setSelectedYear(String(car.year))
        setForm(prev => ({ ...prev, year: String(car.year) }))
      }
      if (car.registrationCity || car.location || car.city) {
        setForm(prev => ({ ...prev, registrationCity: car.registrationCity || car.location || car.city }))
        setLocation(car.registrationCity || car.location || car.city)
      }
      if (car.kmDriven || car.mileage) {
        setMileage(String(car.kmDriven || car.mileage))
      }
      if (car.engineCapacity) {
        setEngineSize(String(car.engineCapacity))
      }
      if (car.bodyType) {
        setForm(prev => ({ ...prev, bodyType: car.bodyType }))
      }
      
      // Pre-fill car choices for the form
      if (car.make && car.model) {
        setCarChoices([{
          make: car.make,
          model: car.model,
          variant: car.variant
        }])
      }
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
    // Handle location selection
    if (params.selectedLocation) {
      const locationText = `${params.selectedLocation.name}, ${params.selectedLocation.province}`
      setLocation(locationText)
    }
  }, [route.params])

  const validateCurrentStep = () => {
    if (currentStep === 1) {
      if (!selectedYear || carChoices.length === 0) {
        Alert.alert("Missing Information", "Please fill in all required fields")
        return false
      }
    } else if (currentStep === 2) {
      if (!location || !inspectionDate || (!selectedTimeSlot && !cantFindSlot)) {
        Alert.alert("Missing Information", "Please select a time slot or check 'Desired slots are not available'")
        return false
      }
      if (paymentReceiptImages.length === 0) {
        Alert.alert("Missing Payment Receipt", "Please upload at least one payment receipt image")
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

  // Validate form before submitting
  if (!validateCurrentStep()) {
    return;
  }

  setIsLoading(true);
  console.log("userID is here", userData.userId);

  const formData = new FormData();

  formData.append("userId", userData.userId);
  formData.append("location", location);
  formData.append("make", form.make);
  formData.append("model", form.model);
  formData.append("variant", form.variant);
  formData.append("year", form.year);
  formData.append("description", description);
  formData.append("kmDriven", mileage);
  formData.append("engineCapacity", engineSize);
  formData.append("inspection_date", inspectionDate.toISOString());
  formData.append("inspection_time", cantFindSlot ? "Call to book slot" : selectedTimeSlot);
  
  // Add adId if car details are provided from car detail screen
  const params: any = route.params || {};
  if (params.adId || params.carDetails?._id || params.carDetails?.id) {
    const adId = params.adId || params.carDetails?._id || params.carDetails?.id;
    formData.append("adId", adId);
    console.log("📎 Linking inspection request to car ad:", adId);
  }

  // Compress and add payment receipt images to reduce file size
  const receiptsToUpload = paymentReceiptImages.slice(0, 3)
  console.log("📤 Compressing payment receipt images before upload...")

  try {
    // Compress all images before uploading (max 1920x1920, 70% quality for smaller file size)
    const compressedImages = await compressImages(
      receiptsToUpload,
      1920, // maxWidth
      1920, // maxHeight
      0.7   // quality (70% for good balance)
    )
    
    console.log(`✅ Successfully compressed ${compressedImages.length} images`)

    compressedImages.forEach((compressedUri, index) => {
      const filename = `payment_receipt_${index + 1}.jpg`;
      const type = 'image/jpeg';
      
      formData.append('payment_receipt', {
        uri: compressedUri,
        type: type,
        name: filename,
      } as any);
      
      console.log(`📎 Added compressed image ${index + 1} to form data`)
    });
  } catch (compressionError) {
    console.error("❌ Error compressing images:", compressionError);
    Alert.alert(
      "Compression Error",
      "Failed to compress images. Trying with original images (may cause upload error if too large).",
      [{ text: "OK" }]
    );
    
    // Fallback: use original images if compression fails (may still cause 413 error)
    receiptsToUpload.forEach((imageUri, index) => {
      const filename = imageUri.split("/").pop() || `payment_receipt_${index}.jpg`;
      const match = /\.(\w+)$/.exec(filename);
      const ext = match ? match[1] : "jpg";
      const type = `image/${ext}`;
      
      formData.append('payment_receipt', {
        uri: imageUri,
        type: type,
        name: filename,
      } as any);
    });
  }

  // ✅ Log form data
  console.log("FormData being sent:");
  console.log("Payment receipt images count:", paymentReceiptImages.length);
  console.log("Location:", location);
  console.log("Inspection date:", inspectionDate);
  console.log("Selected time slot:", selectedTimeSlot);
  console.log("Cant find slot:", cantFindSlot);
  
  for (let pair of (formData as any).entries()) {
    console.log(`${pair[0]}: ${pair[1]}`);
  }

  try {
    console.log("Submitting inspection request...");
    const response = await fetch(`${API_URL}/inspection`, {
      method: "POST",
      body: formData,
    });

    console.log("Response status:", response.status);

    if (response.status === 413) {
      const errorText = await response.text();
      console.error("🚨 413 Request Entity Too Large:", errorText);
      Alert.alert("Upload Too Large", "File size too large. Please upload fewer or smaller receipt images.");
      setIsLoading(false);
      return;
    }

    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      const errorText = await response.text();
      console.error("❌ Non-JSON response:", errorText.substring(0, 500));
      Alert.alert("Error", `Unexpected server response (${response.status}). Please try again.`);
      setIsLoading(false);
      return;
    }

    const result = await response.json();
    console.log("Response:", result);

    if (response.ok) {
      Alert.alert("Success", "Inspection request submitted successfully!", [
        {
          text: "OK",
          onPress: () => navigation.navigate("Home")
        }
      ]);
    } else {
      console.error("Submission failed:", result);
      Alert.alert("Error", result.message || "Failed to submit inspection request. Please try again.");
    }
  } catch (error) {
    console.error("Error submitting inspection request:", error);
    Alert.alert("Error", "Network error. Please check your internet connection and try again.");
  } finally {
    setIsLoading(false);
  }
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
             <TouchableOpacity style={styles.input} onPress={() => (navigation as any).navigate('BuyCarforMeYearScreen', { returnTo: 'CarInspection' })}>
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
                 <TouchableOpacity onPress={() => (navigation as any).navigate('BuyCarforMeBrandFlowScreen', { year: selectedYear, returnTo: 'CarInspection' })} style={{ width:36, height:36, borderRadius:18, borderWidth:1, borderColor: COLORS.lightGray, justifyContent:'center', alignItems:'center' }}>
                   <Text style={{ fontSize:18, color: COLORS.black }}>+</Text>
                 </TouchableOpacity>
               </View>
             </View>
           )}
           {carChoices.length === 0 && (
             <View style={styles.inputContainer}>
               <Text style={styles.label}>Car Model</Text>
               <TouchableOpacity onPress={() => (navigation as any).navigate('BuyCarforMeBrandFlowScreen', { year: selectedYear, returnTo: 'CarInspection' })} style={[styles.input, { justifyContent:'center' }]}>
                 <Text style={{ color: COLORS.darkGray }}>Select Make/Model/Variant</Text>
               </TouchableOpacity>
             </View>
           )}
           <View style={styles.row}>
             <View style={[styles.inputContainer, styles.halfInput]}>
              <Text style={styles.label}>
                            Engine Capacity <Text style={styles.required}>*</Text>
                          </Text>
                          <TextInput
                            style={styles.input}
                            placeholder="e.g. 1800"
                            value={engineSize}
                            onChangeText={setEngineSize}
                            keyboardType="numeric"
                          />
              {!!engineSize && (
                <>
                  <Text style={{ marginTop: 6, color: '#28a745' }}>{formatEngineCapacityInWords(engineSize)}</Text>
                  {(() => {
                    const carMake = form.make || (carChoices.length > 0 ? carChoices[0].make : '')
                    const carBodyType = form.bodyType || ''
                    const priceInfo = calculateInspectionPrice(engineSize, carMake, carBodyType)
                    if (priceInfo.price > 0) {
                      return (
                        <View style={styles.priceCard}>
                          <Text style={styles.pricePackageName}>{priceInfo.packageName}</Text>
                          <Text style={styles.priceAmount}>PKR {priceInfo.price.toLocaleString()}</Text>
                        </View>
                      )
                    }
                    return null
                  })()}
                </>
              )}
             </View>

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
           <TouchableOpacity 
             style={[styles.input, { flexDirection: 'row', alignItems: 'center' }]} 
             onPress={() => (navigation as any).navigate('LocationSelectionScreen', { returnTo: 'CarInspection' })}
           >
             <Text style={{ color: location ? COLORS.black : COLORS.darkGray, flex: 1 }}>
               {location || 'Select Location'}
             </Text>
             <Ionicons name="chevron-forward" size={20} color={COLORS.darkGray} />
           </TouchableOpacity>
         </View>

         <Text style={styles.sectionTitle}>Inspection Information</Text>
         <View style={styles.inputContainer}>
         <Text style={styles.label}>
             Inspection Date <Text style={styles.required}>*</Text>
           </Text>
          <View style={[styles.input, styles.dateInputWrapper]}>
  <Text style={styles.dateText}>
    {inspectionDate ? inspectionDate.toDateString() : "Select Inspection Date"}
  </Text>
  <TouchableOpacity onPress={() => setShowDatePicker(true)}>
    <FontAwesome  name="calendar" size={20} color="#666" />
  </TouchableOpacity>
</View>

{showDatePicker && (
  <DateTimePicker
    value={inspectionDate || new Date()}
    mode="date"
    display="default"
    onChange={handleDateChange}
    minimumDate={new Date()}  // 👈 This line prevents selecting past dates
  />
)}
</View>
<View style={styles.inputContainer}>
<Text style={styles.label}>
             Available Slots <Text style={styles.required}>*</Text>
           </Text>
<View style={styles.timeSlotsContainer}>
  {availableTimeSlots.map((slot, index) => (
    <TouchableOpacity
      key={index}
      style={[
        styles.timeSlotCard,
        selectedTimeSlot === slot && styles.selectedTimeSlotCard
      ]}
      onPress={() => handleTimeSlotSelect(slot)}
    >
      <Text style={[
        styles.timeSlotText,
        selectedTimeSlot === slot && styles.selectedTimeSlotText
      ]}>
        {slot}
      </Text>
    </TouchableOpacity>
  ))}
</View>

<View style={styles.checkboxContainer}>
  <TouchableOpacity 
    style={styles.checkboxWrapper}
    onPress={() => setCantFindSlot(!cantFindSlot)}
  >
    <View style={[styles.checkbox, cantFindSlot && styles.checkedCheckbox]}>
      {cantFindSlot && <Ionicons name="checkmark" size={16} color={COLORS.white} />}
    </View>
    <Text style={styles.checkboxText}>Desired slots are not available</Text>
  </TouchableOpacity>
</View>

{cantFindSlot && (
  <View style={styles.callMessageContainer}>
    <Text style={styles.callMessageText}>We will call you to book a time slot</Text>
  </View>
)}
</View>

         <Text style={styles.sectionTitle}>Payment Receipt</Text>
         <View style={styles.inputContainer}>
           <Text style={styles.label}>
             Upload Payment Receipt <Text style={styles.required}>*</Text>
           </Text>
           <Text style={styles.helperText}>
             Upload your payment receipt for the inspection service (Max 3 images)
           </Text>
           
           <View style={styles.imagesContainer}>
             {paymentReceiptImages.map((imageUri, index) => (
               <View key={index} style={styles.imageContainer}>
                 <Image source={{ uri: imageUri }} style={styles.image} />
                 <TouchableOpacity
                   style={styles.removeImageButton}
                   onPress={() => removePaymentReceiptImage(index)}
                 >
                   <Ionicons name="close-circle" size={24} color={COLORS.primary} />
                 </TouchableOpacity>
               </View>
             ))}
             
             {paymentReceiptImages.length < 3 && (
               <TouchableOpacity style={styles.addImageButton} onPress={pickPaymentReceiptImage}>
                 <Ionicons name="camera" size={24} color={COLORS.darkGray} />
                 <Text style={styles.addImageText}>Add Receipt</Text>
               </TouchableOpacity>
             )}
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
         <Text style={styles.headerTitle}>Car Rquirements</Text>
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
   style={[
     styles.submitButton, 
     { flex: currentStep > 1 ? 0.48 : 1 },
     isLoading && styles.disabledButton
   ]}
   onPress={handleSubmit}
   disabled={isLoading}
 >
   {isLoading ? (
     <View style={styles.loadingContainer}>
       <ActivityIndicator size="small" color="#fff" />
       <Text style={styles.loadingText}>Submitting...</Text>
     </View>
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
    dateInputWrapper: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  
  dateText: {
    color: 'black',
    fontSize: 14,
  },
  timeSlotsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  timeSlotCard: {
    width: '48%',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    backgroundColor: COLORS.white,
    marginBottom: 8,
    alignItems: 'center',
  },
  selectedTimeSlotCard: {
    borderColor: COLORS.primary,
    backgroundColor: 'rgba(0, 102, 204, 0.05)',
  },
  timeSlotText: {
    fontSize: 14,
    color: COLORS.darkGray,
    fontWeight: '500',
  },
  selectedTimeSlotText: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  checkboxContainer: {
    marginTop: 16,
  },
  checkboxWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: COLORS.lightGray,
    borderRadius: 4,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkedCheckbox: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  checkboxText: {
    fontSize: 14,
    color: COLORS.black,
    fontWeight: '500',
  },
  callMessageContainer: {
    backgroundColor: '#FFF3CD',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#FFC107',
  },
  callMessageText: {
    fontSize: 14,
    color: '#856404',
    fontWeight: '500',
  },
  helperText: {
    fontSize: 12,
    color: COLORS.darkGray,
    marginBottom: 8,
    fontStyle: 'italic',
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
    position: "relative",
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
  disabledButton: {
    backgroundColor: COLORS.lightGray,
    opacity: 0.6,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  priceCard: {
    marginTop: 10,
    padding: 12,
    backgroundColor: '#E8F5E9',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  pricePackageName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2E7D32',
    marginBottom: 4,
  },
  priceAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1B5E20',
  },
})
 
 export default CarInspection;
