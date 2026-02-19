import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { COLORS } from "../../constants/colors";
import { API_URL, getStoredUser } from "../../../config";
import { compressImage } from "../../utils/imageCompression";
import packagesService from "../../services/packagesService";

const { width } = Dimensions.get("window");

interface RouteParams {
  packageId: string;
  packageName: string;
  amount: number;
  packageType: string;
}

const PaymentReceiptScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { packageId, packageName, amount, packageType } = route.params as RouteParams;

  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [customerName, setCustomerName] = useState<string>("");
  const [userEmail, setUserEmail] = useState<string>("");
  const [userPhone, setUserPhone] = useState<string>("");
  const [loadingUsage, setLoadingUsage] = useState(false);
  const [usage, setUsage] = useState<{ validityDays: number; freeBoosters: number; totalAds: number; liveAdDays: number } | null>(null);

  // Fetch user data and live package metrics when component mounts
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoadingUsage(true);
        const userData = await getStoredUser();
        console.log("Fetched user data in useEffect:", userData);
        
        if (userData) {
          setCustomerName(userData.name || "");
          setUserEmail(userData.email || "");
          setUserPhone(userData.phone || "");
          console.log("Set customer info:", {
            name: userData.name,
            email: userData.email,
            phone: userData.phone
          });
        } else {
          console.log("No user data found");
        }

        // Fetch live package usage/metrics for the selected package
        await refreshMetrics();
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
      finally {
        setLoadingUsage(false);
      }
    };

    fetchUserData();
  }, []);

  // Helper to ensure metrics are loaded before submit
  const refreshMetrics = async () => {
    try {
      const details = await packagesService.fetchPackageById(packageId);
      const liveAdDays = (details as any)?.liveAdDays ?? (details as any)?.noOfDays ?? (details as any)?.duration ?? 0;
      const validityDays = (details as any)?.validityDays ?? (details as any)?.noOfDays ?? (details as any)?.duration ?? 0;
      const freeBoosters = (details as any)?.freeBoosters ?? (details as any)?.noOfBoosts ?? (details as any)?.featuredListings ?? 0;
      const totalAds = (details as any)?.totalAds ?? (details as any)?.listingLimit ?? 0;
      setUsage({ liveAdDays, validityDays, freeBoosters, totalAds });
    } catch (e) {
      console.log("⚠️ Could not fetch package metrics:", e);
    }
  }

  const pickImage = async () => {
    try {
      // Request permission
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (permissionResult.granted === false) {
        Alert.alert("Permission Required", "Permission to access camera roll is required!");
        return;
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setSelectedImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Error", "Failed to pick image. Please try again.");
    }
  };

  const takePhoto = async () => {
    try {
      // Request permission
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      
      if (permissionResult.granted === false) {
        Alert.alert("Permission Required", "Permission to access camera is required!");
        return;
      }

      // Launch camera
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setSelectedImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error("Error taking photo:", error);
      Alert.alert("Error", "Failed to take photo. Please try again.");
    }
  };

  const showImagePicker = () => {
    Alert.alert(
      "Select Receipt",
      "Choose how you want to upload your payment receipt",
      [
        { text: "Camera", onPress: takePhoto },
        { text: "Gallery", onPress: pickImage },
        { text: "Cancel", style: "cancel" },
      ]
    );
  };

  const submitReceipt = async () => {
    if (!selectedImage) {
      Alert.alert("No Receipt", "Please upload your payment receipt first.");
      return;
    }

    // Get user data first to validate
    const userData = await getStoredUser();
    console.log("🔍 DEBUG: Retrieved user data:", userData);
    console.log("🔍 DEBUG: User data keys:", userData ? Object.keys(userData) : 'No user data');
    console.log("🔍 DEBUG: User name:", userData?.name);
    console.log("🔍 DEBUG: User email:", userData?.email);
    console.log("🔍 DEBUG: User phone:", userData?.phone);
    console.log("🔍 DEBUG: User _id:", userData?._id);
    
    // Additional debugging for AsyncStorage
    try {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      const rawUserData = await AsyncStorage.getItem('user');
      console.log("🔍 DEBUG: Raw AsyncStorage data:", rawUserData);
      if (rawUserData) {
        const parsedData = JSON.parse(rawUserData);
        console.log("🔍 DEBUG: Parsed AsyncStorage data:", parsedData);
      }
    } catch (error) {
      console.error("🔍 DEBUG: AsyncStorage error:", error);
    }
    
    // Check for both _id and userId (user object might use either)
    const userId = userData._id || userData.userId;
    if (!userData || !userId) {
      console.log("❌ DEBUG: User validation failed - no user data or userId");
      console.log("❌ DEBUG: userData:", userData);
      console.log("❌ DEBUG: userData._id:", userData?._id);
      console.log("❌ DEBUG: userData.userId:", userData?.userId);
      Alert.alert("Missing Information", "User profile information is missing. Please login again.");
      return;
    }
    
    console.log("✅ DEBUG: User validation passed - userId:", userId);
    
    // Use available data, with fallbacks - Use state variables that are already working in UI
    const finalCustomerName = customerName || userData.name || userData.fullName || userData.username || "Unknown User";
    const finalCustomerEmail = userEmail || userData.email || userData.emailAddress || "No email";
    const finalCustomerPhone = userPhone || userData.phone || userData.phoneNumber || userData.mobile || "No phone";
    
    console.log("🔍 DEBUG: State variables (from UI):", {
      customerName,
      userEmail,
      userPhone
    });
    
    console.log("🔍 DEBUG: Final customer data:", {
      name: finalCustomerName,
      email: finalCustomerEmail,
      phone: finalCustomerPhone
    });
    
    // Validate that we have at least some customer data
    if (finalCustomerName === "Unknown User" && finalCustomerEmail === "No email" && finalCustomerPhone === "No phone") {
      console.log("❌ DEBUG: No customer data available");
      Alert.alert("Missing Information", "Customer information is not available. Please check your profile and try again.");
      return;
    }

    setSubmitting(true);
    if (!usage) {
      await refreshMetrics();
    }
    try {
      console.log("Retrieved user data:", userData);

      // Create FormData for file upload
      const formData = new FormData();
      
      // Add file first - upload original image without compression
      formData.append("receipt", {
        uri: selectedImage,
        type: "image/jpeg",
        name: "payment_receipt.jpg",
      } as any);
      console.log("📤 Uploading payment receipt (original quality)");
      
      // Package information
      formData.append("packageId", packageId);
      formData.append("packageName", packageName);
      formData.append("amount", amount.toString());
      formData.append("packageType", packageType);
      // Package metrics
      formData.append("liveAdDays", String(usage?.liveAdDays ?? 0));
      formData.append("validityDays", String(usage?.validityDays ?? 0));
      formData.append("freeBoosters", String(usage?.freeBoosters ?? 0));
      formData.append("totalAds", String(usage?.totalAds ?? 0));
      
      // User information - Use final customer data with fallbacks
      formData.append("userId", userId.toString());
      formData.append("customerName", finalCustomerName);
      formData.append("customerEmail", finalCustomerEmail);
      formData.append("customerPhone", finalCustomerPhone);
      
      // Payment information
      formData.append("paymentMethod", "Bank Transfer");
      formData.append("requestDate", new Date().toISOString());
      
      console.log("🔍 DEBUG: FormData values being sent:");
      console.log("🔍 DEBUG: userId:", userId.toString());
      console.log("🔍 DEBUG: customerName:", finalCustomerName);
      console.log("🔍 DEBUG: customerEmail:", finalCustomerEmail);
      console.log("🔍 DEBUG: customerPhone:", finalCustomerPhone);
      
      // Basic debug that FormData was constructed
      console.log("🔍 DEBUG: FormData prepared with receipt and fields");

      console.log("Submitting receipt with data:", {
        packageId,
        packageName,
        amount,
        packageType,
        userId: userData._id,
        customerName: finalCustomerName,
        customerEmail: finalCustomerEmail,
        customerPhone: finalCustomerPhone,
        paymentMethod: "Bank Transfer",
        requestDate: new Date().toISOString()
      });

      // Submit to backend
      console.log("🔍 DEBUG: About to submit FormData to backend");
      console.log("🔍 DEBUG: API URL:", `${API_URL}/payment/submit-receipt`);
      
      // Try FormData first
      let response;
      try {
        response = await fetch(`${API_URL}/payment/submit-receipt`, {
          method: "POST",
          body: formData,
        });
        
        console.log("🔍 DEBUG: FormData response status:", response.status);
        
        // If FormData fails, try JSON approach
        if (!response.ok) {
          console.log("🔍 DEBUG: FormData failed, trying JSON approach...");
          
          // Create JSON payload
          const jsonPayload = {
            packageId,
            packageName,
            amount: amount.toString(),
            packageType,
            userId: userId.toString(),
            customerName: finalCustomerName,
            customerEmail: finalCustomerEmail,
            customerPhone: finalCustomerPhone,
            paymentMethod: "Bank Transfer",
            requestDate: new Date().toISOString(),
            // metrics
            liveAdDays: usage?.liveAdDays ?? 0,
            validityDays: usage?.validityDays ?? 0,
            freeBoosters: usage?.freeBoosters ?? 0,
            totalAds: usage?.totalAds ?? 0,
            receiptImage: selectedImage // Send image URI as string
          };
          
          console.log("🔍 DEBUG: JSON payload:", jsonPayload);
          
          response = await fetch(`${API_URL}/payment/submit-receipt-json`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(jsonPayload),
          });
          
          console.log("🔍 DEBUG: JSON response status:", response.status);
        }
      } catch (error) {
        console.error("🔍 DEBUG: FormData error, trying JSON approach:", error);
        
        // Fallback to JSON approach
        const jsonPayload = {
          packageId,
          packageName,
          amount: amount.toString(),
          packageType,
          userId: userId.toString(),
          customerName: finalCustomerName,
          customerEmail: finalCustomerEmail,
          customerPhone: finalCustomerPhone,
          paymentMethod: "Bank Transfer",
          requestDate: new Date().toISOString(),
          // metrics
          liveAdDays: usage?.liveAdDays ?? 0,
          validityDays: usage?.validityDays ?? 0,
          freeBoosters: usage?.freeBoosters ?? 0,
          totalAds: usage?.totalAds ?? 0,
          receiptImage: selectedImage
        };
        
        console.log("🔍 DEBUG: Fallback JSON payload:", jsonPayload);
        
        response = await fetch(`${API_URL}/payment/submit-receipt-json`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(jsonPayload),
        });
        
        console.log("🔍 DEBUG: Fallback JSON response status:", response.status);
      }

      console.log("Response status:", response.status);
      const result = await response.json();
      console.log("Response result:", result);

      if (result.success) {
        Alert.alert(
          "Receipt Submitted",
          "Your payment receipt has been submitted successfully. We will verify it and activate your package within 24 hours.",
          [
            {
              text: "OK",
              onPress: () => navigation.goBack(),
            },
          ]
        );
      } else {
        Alert.alert("Error", result.message || "Failed to submit receipt. Please try again.");
      }
    } catch (error) {
      console.error("Error submitting receipt:", error);
      Alert.alert("Error", "Failed to submit receipt. Please check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.black} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Payment Receipt</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Package Info */}
        <View style={styles.packageInfo}>
          <View style={styles.packageIcon}>
            <Ionicons
              name={packageType === "car" ? "car" : "bicycle"}
              size={40}
              color={COLORS.primary}
            />
          </View>
          <View style={styles.packageDetails}>
            <Text style={styles.packageName}>{packageName}</Text>
            <Text style={styles.packageAmount}>PKR {amount.toLocaleString()}</Text>
          </View>
        </View>

        {/* Live Package Metrics */}
        <View style={styles.metricsContainer}>
          <Text style={styles.metricsTitle}>Package Metrics</Text>
          {loadingUsage ? (
            <ActivityIndicator size="small" color={COLORS.primary} />
          ) : usage ? (
            <>
              <View style={styles.metricsRow}>
                <Text style={styles.metricsLabel}>Live Ad Days</Text>
                <Text style={styles.metricsValue}>{usage.liveAdDays}</Text>
              </View>
              <View style={styles.metricsRow}>
                <Text style={styles.metricsLabel}>Validity Days</Text>
                <Text style={styles.metricsValue}>{usage.validityDays}</Text>
              </View>
              <View style={styles.metricsRow}>
                <Text style={styles.metricsLabel}>Boosters</Text>
                <Text style={styles.metricsValue}>{usage.freeBoosters}</Text>
              </View>
              <View style={styles.metricsRow}>
                <Text style={styles.metricsLabel}>Total Ads</Text>
                <Text style={styles.metricsValue}>{usage.totalAds}</Text>
              </View>
            </>
          ) : (
            <Text style={styles.metricsEmpty}>Metrics unavailable</Text>
          )}
        </View>

        {/* Instructions */}
        <View style={styles.instructionsContainer}>
          <Text style={styles.instructionsTitle}>Payment Instructions</Text>
          <View style={styles.instructionItem}>
            <Ionicons name="checkmark-circle" size={20} color={COLORS.primary} />
            <Text style={styles.instructionText}>
              Make payment to our bank account or JazzCash/EasyPaisa
            </Text>
          </View>
          <View style={styles.instructionItem}>
            <Ionicons name="checkmark-circle" size={20} color={COLORS.primary} />
            <Text style={styles.instructionText}>
              Take a clear photo of your payment receipt
            </Text>
          </View>
          <View style={styles.instructionItem}>
            <Ionicons name="checkmark-circle" size={20} color={COLORS.primary} />
            <Text style={styles.instructionText}>
              Upload the receipt below and submit
            </Text>
          </View>
        </View>

        {/* Payment Details */}
        <View style={styles.paymentDetails}>
          <Text style={styles.paymentTitle}>Payment Details</Text>
          <View style={styles.paymentRow}>
            <Text style={styles.paymentLabel}>Easypaisa | Jazz Cash:</Text>
            <Text style={styles.paymentValue}>03348400943</Text>
          </View>
          <View style={styles.paymentRow}>
            <Text style={styles.paymentLabel}>Account Number:</Text>
            <Text style={styles.paymentValue}>03348400943</Text>
          </View>
          <View style={styles.paymentRow}>
            <Text style={styles.paymentLabel}>Account Name:</Text>
            <Text style={styles.paymentValue}>Muhammad Asif Khan</Text>
          </View>
        </View>

        {/* Receipt Upload */}
        <View style={styles.uploadContainer}>
          <Text style={styles.uploadTitle}>Upload Payment Receipt</Text>
          
          {selectedImage ? (
            <View style={styles.imagePreview}>
              <Image source={{ uri: selectedImage }} style={styles.previewImage} />
              <TouchableOpacity
                style={styles.changeImageButton}
                onPress={showImagePicker}
              >
                <Ionicons name="camera" size={20} color={COLORS.white} />
                <Text style={styles.changeImageText}>Change</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={styles.uploadButton} onPress={showImagePicker}>
              <Ionicons name="cloud-upload-outline" size={40} color={COLORS.primary} />
              <Text style={styles.uploadText}>Tap to Upload Receipt</Text>
              <Text style={styles.uploadSubtext}>Camera or Gallery</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[
            styles.submitButton,
            (!selectedImage || submitting) && styles.submitButtonDisabled,
          ]}
          onPress={submitReceipt}
          disabled={!selectedImage || submitting}
        >
          {submitting ? (
            <ActivityIndicator size="small" color={COLORS.white} />
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={20} color={COLORS.white} />
              <Text style={styles.submitButtonText}>Submit Receipt</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Note */}
        <View style={styles.noteContainer}>
          <Ionicons name="information-circle" size={20} color={COLORS.darkGray} />
          <Text style={styles.noteText}>
            Your package will be activated within 24 hours after verification of your payment receipt.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.black,
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  packageInfo: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.lightGray,
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  packageIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.white,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  packageDetails: {
    flex: 1,
  },
  packageName: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.black,
    marginBottom: 4,
  },
  packageAmount: {
    fontSize: 16,
    color: COLORS.primary,
    fontWeight: "500",
  },
  metricsContainer: {
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    borderRadius: 12,
    padding: 16,
    backgroundColor: COLORS.white,
  },
  metricsTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.black,
    marginBottom: 12,
  },
  metricsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  metricsLabel: {
    fontSize: 14,
    color: COLORS.darkGray,
    fontWeight: "500",
  },
  metricsValue: {
    fontSize: 14,
    color: COLORS.black,
    fontWeight: "600",
  },
  metricsEmpty: {
    fontSize: 14,
    color: COLORS.darkGray,
  },
  instructionsContainer: {
    backgroundColor: COLORS.lightGray,
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.black,
    marginBottom: 12,
  },
  instructionItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  instructionText: {
    fontSize: 14,
    color: COLORS.darkGray,
    marginLeft: 8,
    flex: 1,
  },
  paymentDetails: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  paymentTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.black,
    marginBottom: 12,
  },
  paymentRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  paymentLabel: {
    fontSize: 14,
    color: COLORS.darkGray,
  },
  paymentValue: {
    fontSize: 14,
    color: COLORS.black,
    fontWeight: "500",
  },
  uploadContainer: {
    marginBottom: 20,
  },
  uploadTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.black,
    marginBottom: 12,
  },
  uploadButton: {
    borderWidth: 2,
    borderColor: COLORS.primary,
    borderStyle: "dashed",
    borderRadius: 12,
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.lightGray,
  },
  uploadText: {
    fontSize: 16,
    fontWeight: "500",
    color: COLORS.primary,
    marginTop: 8,
  },
  uploadSubtext: {
    fontSize: 14,
    color: COLORS.darkGray,
    marginTop: 4,
  },
  imagePreview: {
    position: "relative",
    borderRadius: 12,
    overflow: "hidden",
  },
  previewImage: {
    width: "100%",
    height: 200,
    resizeMode: "cover",
  },
  changeImageButton: {
    position: "absolute",
    bottom: 12,
    right: 12,
    backgroundColor: COLORS.primary,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  changeImageText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: "500",
    marginLeft: 4,
  },
  submitButton: {
    backgroundColor: COLORS.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  submitButtonDisabled: {
    backgroundColor: COLORS.lightGray,
  },
  submitButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  noteContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: COLORS.lightGray,
    padding: 12,
    borderRadius: 8,
  },
  noteText: {
    fontSize: 12,
    color: COLORS.darkGray,
    marginLeft: 8,
    flex: 1,
    lineHeight: 16,
  },
});

export default PaymentReceiptScreen;
