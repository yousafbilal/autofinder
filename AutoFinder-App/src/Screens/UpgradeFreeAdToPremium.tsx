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
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { COLORS } from "../constants/colors";
import { API_URL } from "../../config";
import { useNavigation, useRoute } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const UpgradeFreeAdToPremium = () => {
  const navigation = useNavigation();
  const route = useRoute<any>();
  const { adId, adData, propertyType, isNewAd } = route.params || {};
  
  // Determine property type: use passed propertyType or detect from adData
  const detectedPropertyType = propertyType || (() => {
    if (adData) {
      const adType = adData.adType;
      const collection = adData.collection;
      const modelType = adData.modelType;
      const category = adData.category;
      const brand = adData.brand;
      const company = adData.company;
      const title = adData.title || '';
      const description = adData.description || '';
      
      // Check if it's a bike - more comprehensive detection
      const isBike = 
        adType === 'bike' || 
        adType === 'newBike' ||
        collection === 'Bike_Ads' || 
        modelType === 'Free' ||
        category === 'bike' ||
        category === 'Bike' ||
        // Check if brand/company is a bike brand
        (brand && ['road prince', 'honda', 'yamaha', 'suzuki', 'kawasaki', 'united', 'super power', 'superstar', 'metro', 'unique', 'riverside'].some(b => brand.toLowerCase().includes(b.toLowerCase()))) ||
        // Check title/description for bike keywords
        title.toLowerCase().includes('bike') ||
        title.toLowerCase().includes('motorcycle') ||
        title.toLowerCase().includes('scooter') ||
        description.toLowerCase().includes('bike') ||
        description.toLowerCase().includes('motorcycle');
      
      console.log("📦 Property type detection:", {
        adType, collection, modelType, category, brand, company,
        title: title.substring(0, 50),
        isBike,
        result: isBike ? 'bike' : 'car'
      });
      
      return isBike ? 'bike' : 'car';
    }
    return 'car'; // Default to car if no data
  })();
  
  console.log("📦 UpgradeFreeAdToPremium - Final property type:", detectedPropertyType);
  
  const [packages, setPackages] = useState<any[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [paymentReceipt, setPaymentReceipt] = useState<string | null>(null);
  const [userData, setUserData] = useState<any>(null);
  const [showReceiptUpload, setShowReceiptUpload] = useState(false);

  useEffect(() => {
    fetchUserData();
    fetchPackages();
  }, [detectedPropertyType]); // Re-fetch when property type changes

  const fetchUserData = async () => {
    try {
      const storedData = await AsyncStorage.getItem('user');
      if (storedData) {
        const parsed = JSON.parse(storedData);
        setUserData(parsed);
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  };

  const fetchPackages = async () => {
    try {
      setLoading(true);
      const endpoint = `${API_URL}/mobile/dealer_packages/${detectedPropertyType}`;
      console.log("📦 Fetching packages from:", endpoint);
      const response = await fetch(endpoint);
      const contentType = response.headers.get('content-type') || '';
      let data: any = null;
      if (contentType.includes('application/json')) {
        try {
          data = await response.json();
        } catch (jsonError) {
          console.warn("📦 Non-JSON or invalid JSON from packages API, using fallback:", (jsonError as Error)?.message);
          data = null;
        }
      } else {
        const text = await response.text();
        console.warn("📦 Packages API returned non-JSON (status " + response.status + "), using fallback. Preview:", text?.substring?.(0, 80));
      }
      if (!response.ok) {
        console.warn("📦 Packages API error status:", response.status);
      }
      let allPackages: any[] = [];
      if (data && data.success && Array.isArray(data.packages)) {
        allPackages = data.packages;
      } else if (data && Array.isArray(data)) {
        allPackages = data;
      }
      
      console.log(`📦 Fetched ${allPackages.length} packages for ${detectedPropertyType}:`, allPackages.map(p => ({ name: p.name || p.bundleName, price: p.discountedPrice || p.price })));
      
      let filteredPackages = [];
      
      if (detectedPropertyType === 'bike') {
        // For bike packages, show all available packages or filter by name
        // Bike packages might have different names: Starter, Value Pack, Executive Pack, etc.
        filteredPackages = allPackages.filter((pkg: any) => {
          const packageName = (pkg.name || pkg.bundleName || '').toLowerCase();
          // Show all bike packages, or filter by common bike package names
          return packageName.includes('starter') || 
                 packageName.includes('value') || 
                 packageName.includes('executive') ||
                 packageName.includes('basic') ||
                 packageName.includes('standard') ||
                 packageName.includes('premium') ||
                 allPackages.length <= 5; // If few packages, show all
        });
        
        // If no specific bike packages found, show all
        if (filteredPackages.length === 0 && allPackages.length > 0) {
          filteredPackages = allPackages;
        }
      } else {
        // For car packages, use existing filtering logic
        // Filter to only show Basic, Standard, and Premium packages
        filteredPackages = allPackages.filter((pkg: any) => {
          const packageName = (pkg.name || pkg.bundleName || '').toLowerCase();
          const packagePrice = pkg.discountedPrice || pkg.discountedRate || pkg.price || 0;
          
          const isBasic = packageName.includes('basic') && (packagePrice >= 1400 && packagePrice <= 1600);
          const isStandard = packageName.includes('standard') && (packagePrice >= 2000 && packagePrice <= 2500);
          const isPremium = packageName.includes('premium') && (packagePrice >= 3000 && packagePrice <= 3500);
          
          return isBasic || isStandard || isPremium;
        });
        
        // If we don't have exactly 3 packages, try filtering by price ranges only
        if (filteredPackages.length !== 3) {
          filteredPackages = allPackages.filter((pkg: any) => {
            const packagePrice = pkg.discountedPrice || pkg.discountedRate || pkg.price || 0;
            
            // Basic: around 1500 (1400-1600)
            // Standard: around 2250 (2000-2500)
            // Premium: around 3150 (3000-3500)
            return (packagePrice >= 1400 && packagePrice <= 1600) ||
                   (packagePrice >= 2000 && packagePrice <= 2500) ||
                   (packagePrice >= 3000 && packagePrice <= 3500);
          });
        }
      }
      
      console.log(`📦 Filtered to ${filteredPackages.length} packages for ${detectedPropertyType}`);
      
      // If still no packages found, create hardcoded packages based on type
      if (filteredPackages.length === 0) {
        if (detectedPropertyType === 'bike') {
          // Bike packages: Starter Pack, Value Pack, Executive Pack
          filteredPackages = [
            {
              _id: 'bike-starter',
              id: 'bike-starter',
              name: 'Starter Pack',
              bundleName: 'Starter Pack',
              discountedPrice: 225,
              price: 225,
              validityDays: 7,
              noOfDays: 7,
              description: 'Boost your bike listing to top. Premium badge on your ad with increased visibility for 7 days.',
            },
            {
              _id: 'bike-value-pack',
              id: 'bike-value-pack',
              name: 'Value Pack',
              bundleName: 'Value Pack',
              discountedPrice: 300,
              price: 300,
              validityDays: 15,
              noOfDays: 15,
              description: 'Quick boost for your bike. Featured placement for 15 days with higher search ranking.',
              popular: true,
            },
            {
              _id: 'bike-executive',
              id: 'bike-executive',
              name: 'Executive Pack',
              bundleName: 'Executive Pack',
              discountedPrice: 525,
              price: 525,
              validityDays: 30,
              noOfDays: 30,
              description: 'Maximum visibility for 30 days. Premium positioning with advanced analytics and dedicated support.',
            },
          ];
        } else {
          // Car packages: Basic, Standard, Premium
          filteredPackages = [
            {
              _id: 'basic-package',
              id: 'basic-package',
              name: 'Basic',
              bundleName: 'Basic',
              discountedPrice: 1500,
              price: 1500,
              validityDays: 7,
              noOfDays: 7,
              description: 'Featured placement for 7 days with basic visibility benefits.',
            },
            {
              _id: 'standard-package',
              id: 'standard-package',
              name: 'Standard',
              bundleName: 'Standard',
              discountedPrice: 2250,
              price: 2250,
              validityDays: 15,
              noOfDays: 15,
              description: 'Featured placement for 15 days with standard visibility benefits.',
              popular: true,
            },
            {
              _id: 'premium-package',
              id: 'premium-package',
              name: 'Premium',
              bundleName: 'Premium',
              discountedPrice: 3150,
              price: 3150,
              validityDays: 30,
              noOfDays: 30,
              description: 'Featured placement for 30 days with all premium benefits included.',
            },
          ];
        }
      } else {
        // Sort packages by price (lowest first)
        filteredPackages.sort((a: any, b: any) => {
          const priceA = a.discountedPrice || a.discountedRate || a.price || 0;
          const priceB = b.discountedPrice || b.discountedRate || b.price || 0;
          return priceA - priceB; // Sort by price ascending
        });
        
        // Limit to 3 packages
        filteredPackages = filteredPackages.slice(0, 3);
        
        // Ensure packages have correct names and days
        filteredPackages = filteredPackages.map((pkg: any, index: number) => {
          const price = pkg.discountedPrice || pkg.discountedRate || pkg.price || 0;
          let name = pkg.name || pkg.bundleName || '';
          let days = pkg.validityDays || pkg.noOfDays || 30;
          
          // Fix name and days based on price
          if (price >= 1400 && price <= 1600) {
            name = 'Basic';
            days = 7;
          } else if (price >= 2000 && price <= 2500) {
            name = 'Standard';
            days = 15;
          } else if (price >= 3000 && price <= 3500) {
            name = 'Premium';
            days = 30;
          }
          
          return {
            ...pkg,
            name,
            bundleName: name,
            validityDays: days,
            noOfDays: days,
            discountedPrice: price,
            price: price,
            description: days === 7 
              ? 'Featured placement for 7 days with basic visibility benefits.'
              : days === 15
              ? 'Featured placement for 15 days with standard visibility benefits.'
              : 'Featured placement for 30 days with all premium benefits included.',
          };
        });
      }
      
      setPackages(filteredPackages);
    } catch (error) {
      console.warn("📦 Error fetching packages, using fallback:", (error as Error)?.message);
      const fallback = [
        { _id: 'basic-package', id: 'basic-package', name: 'Basic', bundleName: 'Basic', discountedPrice: 1500, price: 1500, validityDays: 7, noOfDays: 7, description: 'Featured placement for 7 days with basic visibility benefits.' },
        { _id: 'standard-package', id: 'standard-package', name: 'Standard', bundleName: 'Standard', discountedPrice: 2250, price: 2250, validityDays: 15, noOfDays: 15, description: 'Featured placement for 15 days with standard visibility benefits.', popular: true },
        { _id: 'premium-package', id: 'premium-package', name: 'Premium', bundleName: 'Premium', discountedPrice: 3150, price: 3150, validityDays: 30, noOfDays: 30, description: 'Featured placement for 30 days with all premium benefits included.' },
      ];
      setPackages(detectedPropertyType === 'bike' ? [
        { _id: 'bike-starter', id: 'bike-starter', name: 'Starter Pack', bundleName: 'Starter Pack', discountedPrice: 225, price: 225, validityDays: 7, noOfDays: 7, description: 'Boost your bike listing to top. Premium badge on your ad with increased visibility for 7 days.' },
        { _id: 'bike-value-pack', id: 'bike-value-pack', name: 'Value Pack', bundleName: 'Value Pack', discountedPrice: 300, price: 300, validityDays: 15, noOfDays: 15, description: 'Quick boost for your bike. Featured placement for 15 days with higher search ranking.', popular: true },
        { _id: 'bike-executive', id: 'bike-executive', name: 'Executive Pack', bundleName: 'Executive Pack', discountedPrice: 400, price: 400, validityDays: 30, noOfDays: 30, description: 'Maximum visibility for your bike. Featured placement for 30 days with all premium benefits.' },
      ] : fallback);
    } finally {
      setLoading(false);
    }
  };

  const handlePackageSelect = (pkg: any) => {
    setSelectedPackage(pkg);
  };

  const handleContinue = () => {
    if (!selectedPackage) {
      Alert.alert("Error", "Please select a package first.");
      return;
    }
    setShowReceiptUpload(true);
  };

  const pickPaymentReceipt = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'We need access to your photos to upload payment receipt.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setPaymentReceipt(result.assets[0].uri);
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Error", "Failed to pick image. Please try again.");
    }
  };

  const handleSubmit = async () => {
    if (!selectedPackage) {
      Alert.alert("Error", "Please select a package first.");
      return;
    }

    if (!paymentReceipt) {
      Alert.alert("Error", "Please upload payment receipt.");
      return;
    }

    try {
      setSubmitting(true);

      // Create FormData for file upload
      const formData = new FormData();
      
      // Add payment receipt image
      const receiptUri = paymentReceipt;
      const receiptFileName = receiptUri.split('/').pop() || 'receipt.jpg';
      const receiptType = receiptUri.endsWith('.png') ? 'image/png' : 'image/jpeg';
      
      // Use 'invoiceImage' for new bike ads (same as PostBikeAdFeatured)
      // Use 'paymentSlip' for existing ad upgrades
      const receiptFieldName = (isNewAd && detectedPropertyType === 'bike') ? 'invoiceImage' : 'paymentSlip';
      
      formData.append(receiptFieldName, {
        uri: receiptUri,
        name: receiptFileName,
        type: receiptType,
      } as any);

      // Add package data
      const packageId = selectedPackage._id || selectedPackage.id;
      const packageName = selectedPackage.name || selectedPackage.bundleName || 'Unknown Package';
      const packagePrice = selectedPackage.discountedPrice || selectedPackage.discountedRate || selectedPackage.price || 0;
      const validityDays = selectedPackage.validityDays || selectedPackage.noOfDays || 30;
      
      formData.append('packageId', packageId);
      formData.append('packageName', packageName);
      formData.append('packagePrice', String(packagePrice));
      formData.append('validityDays', String(validityDays));
      formData.append('userId', userData?.userId || userData?._id);
      formData.append('amount', String(packagePrice));
      formData.append('paymentMethod', 'bank_transfer');

      if (isNewAd && adData) {
        // New ad - create premium bike ad directly with isFeatured: "Pending"
        console.log("📤 Creating new premium bike ad with pending status:", adData);
        
        // Add all ad data from PostBikeAd
        formData.append('title', adData.title || '');
        formData.append('make', adData.make || '');
        formData.append('model', adData.model || '');
        formData.append('variant', adData.variant || '');
        formData.append('year', adData.year || '');
        formData.append('price', adData.price || '');
        formData.append('description', adData.description || '');
        formData.append('location', adData.location || '');
        formData.append('adCity', adData.adCity || '');
        formData.append('registrationCity', adData.registrationCity || '');
        formData.append('bodyColor', adData.bodyColor || '');
        formData.append('fuelType', adData.fuelType || '');
        formData.append('engineCapacity', adData.engineCapacity || '');
        formData.append('enginetype', adData.enginetype || '');
        formData.append('preferredContact', adData.preferredContact || 'phone');
        formData.append('features', Array.isArray(adData.features) ? adData.features.join(',') : '');
        
        // Set premium status
        formData.append('isFeatured', 'Pending');
        formData.append('isPaidAd', 'true');
        formData.append('paymentStatus', 'pending');
        
        // Add images from adData
        if (adData.images && Array.isArray(adData.images)) {
          adData.images.forEach((imageUri: string, index: number) => {
            const filename = imageUri.split('/').pop() || `image_${index + 1}.jpg`;
            const match = /\.(\w+)$/.exec(filename);
            const ext = match ? match[1] : 'jpg';
            const type = `image/${ext}`;
            
            formData.append(`image${index + 1}`, {
              uri: imageUri,
              name: filename,
              type,
            } as any);
          });
        }

        const response = await fetch(`${API_URL}/bike_ads`, {
          method: 'POST',
          body: formData,
        });

        // Check for 413 error specifically
        if (response.status === 413) {
          const errorText = await response.text();
          console.error("413 Request Entity Too Large:", errorText);
          Alert.alert("Error", "File size too large. Please reduce image size or upload fewer images.");
          setSubmitting(false);
          return;
        }

        // Check if response is JSON before parsing
        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          const errorText = await response.text();
          console.error("Non-JSON response:", errorText.substring(0, 500));
          Alert.alert("Error", `Server returned invalid response (${response.status}). Please try again.`);
          setSubmitting(false);
          return;
        }

        const result = await response.json();

        if (response.ok) {
          Alert.alert(
            "Success",
            "Your premium bike ad request has been submitted. Admin will verify your payment and approve your ad.",
            [
              {
                text: "OK",
                onPress: () => navigation.navigate('HomeTabs' as any),
              },
            ]
          );
        } else {
          Alert.alert("Error", result.message || "Failed to submit premium bike ad. Please try again.");
        }
      } else {
        // Existing ad - upgrade to premium
        formData.append('adId', adId);
        
        console.log("📤 Submitting upgrade request:", {
          adId,
          packageId,
          packageName,
          packagePrice,
          validityDays,
          propertyType: detectedPropertyType,
        });

        // Use correct endpoint based on property type (bike or car)
        const upgradeEndpoint = detectedPropertyType === 'bike' 
          ? `${API_URL}/bike_ads/${adId}/upgrade-to-premium`
          : `${API_URL}/free_ads/${adId}/upgrade-to-premium`;
        
        console.log("📤 Using endpoint:", upgradeEndpoint);

        const response = await fetch(upgradeEndpoint, {
          method: 'POST',
          body: formData,
          // DO NOT set Content-Type header for FormData in React Native
          // The system will set it automatically with the correct boundary
        });

        // Check for 413 error specifically
        if (response.status === 413) {
          const errorText = await response.text();
          console.error("413 Request Entity Too Large:", errorText);
          Alert.alert("Error", "File size too large. Please reduce image size or upload fewer images.");
          setSubmitting(false);
          return;
        }

        // Check if response is JSON before parsing
        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          const errorText = await response.text();
          console.error("Non-JSON response:", errorText.substring(0, 500));
          Alert.alert("Error", `Server returned invalid response (${response.status}). Please try again.`);
          setSubmitting(false);
          return;
        }

        const result = await response.json();

        if (response.ok) {
          Alert.alert(
            "Success",
            "Your upgrade request has been submitted. Admin will verify your payment and upgrade your ad to premium.",
            [
              {
                text: "OK",
                onPress: () => navigation.goBack(),
              },
            ]
          );
        } else {
          Alert.alert("Error", result.message || "Failed to submit upgrade request. Please try again.");
        }
      }
    } catch (error) {
      console.error("Error submitting upgrade:", error);
      Alert.alert("Error", "An error occurred. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={COLORS.black} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Upgrade to Premium</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading packages...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.black} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Upgrade to Premium</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        {/* Payment Methods Info */}
        <View style={styles.paymentMethodsCard}>
          <Text style={styles.paymentMethodsTitle}>Payment methods:</Text>
          <Text style={styles.paymentMethodsText}>Bank Transfer, EasyPaisa, JazzCash</Text>
        </View>

        {/* Ad Info */}
        {adData && (
          <View style={styles.adInfoCard}>
            <Text style={styles.sectionTitle}>Your Ad</Text>
            <Text style={styles.adTitle}>
              {adData?.year || ''} {adData?.make || ''} {adData?.model || ''} {adData?.variant || ''}
            </Text>
            <Text style={styles.adPrice}>PKR {adData?.price ? Number(adData.price).toLocaleString() : '0'}</Text>
            {isNewAd && (
              <Text style={styles.newAdNote}>
                📝 New ad - will be created as premium after admin approval
              </Text>
            )}
          </View>
        )}

        {/* Package Selection */}
        {!showReceiptUpload ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Pricing Plans</Text>
            <Text style={styles.sectionNote}>
              After completing ad details, you must upload a payment receipt (Bank Transfer, EasyPaisa, JazzCash).
            </Text>
            
            {packages.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No packages available</Text>
              </View>
            ) : (
              packages.map((pkg, index) => {
                const packageId = pkg._id || pkg.id;
                const packageName = pkg.name || pkg.bundleName || '';
                const packageDays = pkg.validityDays || pkg.noOfDays || (pkg.name?.toLowerCase().includes('basic') ? 7 : 
                                                         pkg.name?.toLowerCase().includes('standard') ? 15 : 
                                                         pkg.name?.toLowerCase().includes('premium') ? 30 : 30);
                const packagePrice = pkg.discountedPrice || pkg.discountedRate || pkg.price || 0;
                const isRecommended = index === 1 || pkg.popular; // Standard is recommended or marked as popular
                
                // Generate description based on days
                let packageDescription = pkg.description;
                if (!packageDescription) {
                  if (packageDays === 7) {
                    packageDescription = "Featured placement for 7 days with basic visibility benefits.";
                  } else if (packageDays === 15) {
                    packageDescription = "Featured placement for 15 days with standard visibility benefits.";
                  } else if (packageDays === 30) {
                    packageDescription = "Featured placement for 30 days with all premium benefits included.";
                  } else {
                    packageDescription = `Featured placement for ${packageDays} days with premium benefits.`;
                  }
                }
                
                return (
                  <TouchableOpacity
                    key={packageId}
                    style={[
                      styles.packageCard,
                      selectedPackage?._id === packageId || selectedPackage?.id === packageId ? styles.selectedPackageCard : null,
                    ]}
                    onPress={() => handlePackageSelect(pkg)}
                  >
                    {isRecommended && (
                      <View style={styles.recommendedBadge}>
                        <Text style={styles.recommendedText}>Recommended</Text>
                      </View>
                    )}
                    
                    <View style={styles.packageHeader}>
                      <Text style={styles.packageName}>{packageName}</Text>
                    </View>
                    
                    <Text style={styles.packagePrice}>
                      PKR {packagePrice.toLocaleString()}
                    </Text>
                    
                    <Text style={styles.packageDuration}>
                      {packageDays} days
                    </Text>
                    
                    <Text style={styles.packageDescription}>
                      {packageDescription}
                    </Text>
                    
                    {(selectedPackage?._id === packageId || selectedPackage?.id === packageId) && (
                      <View style={styles.selectedBadge}>
                        <Ionicons name="checkmark-circle" size={20} color={COLORS.primary} />
                        <Text style={styles.selectedText}>Selected</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })
            )}
          </View>
        ) : (
          /* Payment Receipt Upload */
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Selected Package</Text>
            <View style={styles.selectedPackageInfo}>
              <Text style={styles.packageName}>
                {selectedPackage?.name || selectedPackage?.bundleName || 'Package'}
              </Text>
              <Text style={styles.packagePrice}>
                PKR {(selectedPackage?.discountedPrice || selectedPackage?.discountedRate || selectedPackage?.price || 0).toLocaleString()}
              </Text>
              <Text style={styles.packageDuration}>
                {(selectedPackage?.validityDays || selectedPackage?.noOfDays || 30)} days validity
              </Text>
            </View>

            <View style={styles.receiptSection}>
              <Text style={styles.sectionTitle}>Upload Payment Receipt</Text>
              <Text style={styles.receiptHint}>
                Please upload a clear image of your payment receipt or bank transfer slip.
              </Text>

              {paymentReceipt ? (
                <View style={styles.receiptPreview}>
                  <Image source={{ uri: paymentReceipt }} style={styles.receiptImage} />
                  <TouchableOpacity
                    style={styles.changeReceiptButton}
                    onPress={pickPaymentReceipt}
                  >
                    <Ionicons name="refresh" size={20} color={COLORS.primary} />
                    <Text style={styles.changeReceiptText}>Change Receipt</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.uploadButton}
                  onPress={pickPaymentReceipt}
                >
                  <Ionicons name="cloud-upload-outline" size={32} color={COLORS.primary} />
                  <Text style={styles.uploadButtonText}>Upload Payment Receipt</Text>
                  <Text style={styles.uploadHint}>Tap to select image</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={styles.backButton}
                onPress={() => {
                  setShowReceiptUpload(false);
                  setPaymentReceipt(null);
                }}
              >
                <Text style={styles.backButtonText}>← Back to Packages</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Continue Button - Show when package selected but before receipt upload */}
      {!showReceiptUpload && selectedPackage && (
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.continueButton}
            onPress={handleContinue}
          >
            <Text style={styles.continueButtonText}>Continue</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Submit Button - Show when receipt is uploaded */}
      {showReceiptUpload && paymentReceipt && (
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={20} color={COLORS.white} />
                <Text style={styles.submitButtonText}>Submit for Approval</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}
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
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.black,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: COLORS.darkGray,
  },
  adInfoCard: {
    backgroundColor: COLORS.lightGray,
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.black,
    marginBottom: 12,
  },
  adTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.black,
    marginBottom: 4,
  },
  adPrice: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.primary,
  },
  newAdNote: {
    fontSize: 12,
    color: COLORS.darkGray,
    marginTop: 8,
    fontStyle: 'italic',
  },
  packageCard: {
    backgroundColor: COLORS.white,
    borderWidth: 2,
    borderColor: COLORS.lightGray,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    position: "relative",
  },
  selectedPackageCard: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + "10",
  },
  packageHeader: {
    marginBottom: 8,
  },
  packageName: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.black,
    marginBottom: 8,
  },
  packagePrice: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.primary,
    marginBottom: 4,
  },
  packageDescription: {
    fontSize: 14,
    color: COLORS.darkGray,
    marginBottom: 8,
  },
  packageDetails: {
    fontSize: 12,
    color: COLORS.darkGray,
  },
  selectedBadge: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  selectedText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.primary,
    marginLeft: 4,
  },
  selectedPackageInfo: {
    backgroundColor: COLORS.lightGray,
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  receiptSection: {
    marginTop: 16,
  },
  receiptHint: {
    fontSize: 14,
    color: COLORS.darkGray,
    marginBottom: 16,
  },
  uploadButton: {
    borderWidth: 2,
    borderColor: COLORS.primary,
    borderStyle: "dashed",
    borderRadius: 12,
    padding: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  uploadButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.primary,
    marginTop: 8,
  },
  uploadHint: {
    fontSize: 12,
    color: COLORS.darkGray,
    marginTop: 4,
  },
  receiptPreview: {
    marginBottom: 16,
  },
  receiptImage: {
    width: "100%",
    height: 300,
    borderRadius: 12,
    marginBottom: 12,
  },
  changeReceiptButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    backgroundColor: COLORS.lightGray,
    borderRadius: 8,
  },
  changeReceiptText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.primary,
    marginLeft: 8,
  },
  backButton: {
    padding: 12,
    alignItems: "center",
  },
  backButtonText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: "600",
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray,
    backgroundColor: COLORS.white,
  },
  submitButton: {
    backgroundColor: COLORS.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderRadius: 12,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 8,
  },
  emptyContainer: {
    padding: 32,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.darkGray,
  },
  paymentMethodsCard: {
    backgroundColor: COLORS.lightGray,
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  paymentMethodsTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.black,
    marginBottom: 4,
  },
  paymentMethodsText: {
    fontSize: 13,
    color: COLORS.darkGray,
  },
  sectionNote: {
    fontSize: 13,
    color: COLORS.darkGray,
    marginBottom: 16,
    fontStyle: "italic",
  },
  recommendedBadge: {
    position: "absolute",
    top: -8,
    right: 12,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 1,
  },
  recommendedText: {
    fontSize: 11,
    fontWeight: "bold",
    color: COLORS.white,
  },
  packageDuration: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.darkGray,
    marginBottom: 8,
  },
  continueButton: {
    backgroundColor: COLORS.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  continueButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default UpgradeFreeAdToPremium;

