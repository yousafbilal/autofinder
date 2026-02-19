import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  Clipboard,
  Linking,
  ActivityIndicator,
  Image,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/colors';
import { useNavigation, useRoute } from '@react-navigation/native';
import { API_URL } from '../../../config';
import { compressImages, compressImage } from '../../utils/imageCompression';

interface PaymentScreenProps {
  route: {
    params: {
      userId: string;
      adData: any;
      cost: number;
    };
  };
}

const PaymentScreen: React.FC<PaymentScreenProps> = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { userId, adData, cost = 525, isExtension = false, packageType, days, adId, isAdService = false, isPremiumPackage = false, isReactivation = false, adType } = route.params as any;

  const [pricing, setPricing] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState<'easypaisa' | 'jazzcash' | null>(null);
  const [paymentSent, setPaymentSent] = useState(false);
  const [paymentSlip, setPaymentSlip] = useState<string | null>(null);
  const [uploadingSlip, setUploadingSlip] = useState(false);

  const easypaisaNumber = '03348400943';
  const easypaisaName = 'Muhammad Asif Khan';
  const jazzcashNumber = '03348400943'; // Same number for both
  const jazzcashName = 'Muhammad Asif Khan';

  useEffect(() => {
    fetchPricingInfo();
  }, [userId]);

  const fetchPricingInfo = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/user-pricing/${userId}`);
      
      if (response.ok) {
        const data = await response.json();
        setPricing(data);
      } else {
        console.error('Failed to fetch pricing info');
      }
    } catch (error) {
      console.error('Error fetching pricing info:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    Clipboard.setString(text);
    Alert.alert('Copied!', `${label} copied to clipboard`);
  };

  const pickPaymentSlip = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setPaymentSlip(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const removePaymentSlip = () => {
    setPaymentSlip(null);
  };


  const handlePaymentMethodSelect = (method: 'easypaisa' | 'jazzcash') => {
    setPaymentMethod(method);
  };

  const handlePaymentSent = async () => {
    if (!paymentSlip) {
      Alert.alert('Payment Slip Required', 'Please upload your payment slip before confirming payment.');
      return;
    }

    setUploadingSlip(true);

    try {
      if (isExtension) {
        // Handle ad extension
        const response = await fetch(`${API_URL}/extend-ad/${adId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            packageType,
            days,
            amount: cost,
            userId
          }),
        });

        const result = await response.json();

        if (response.ok) {
          setPaymentSent(true);
          Alert.alert(
            'Ad Extended!',
            `Your ad has been extended for ${days} days. The extension will be processed after admin verification.`,
            [
              {
                text: 'OK',
                onPress: () => {
                  navigation.goBack();
                }
              }
            ]
          );
        } else {
          Alert.alert('Error', result.message || 'Failed to extend ad. Please try again.');
        }
      } else if (isAdService && adData) {
        // Handle 525 PKR ad creation with payment receipt
        // If adData is available, create the ad with pending status
        console.log('📝 Creating 525 PKR ad with payment receipt...');
        const formData = new FormData();
        formData.append('userId', userId);
        formData.append('adData', JSON.stringify(adData));
        formData.append('paymentMethod', paymentMethod || 'easypaisa');
        formData.append('amount', cost.toString());
        
        // For 525 PKR ads, explicitly set payment status and flags
        formData.append('isPaidAd', 'true');
        formData.append('paymentAmount', '525');
        formData.append('paymentStatus', 'pending');
        formData.append('adStatus', 'pending');
        formData.append('isActive', 'false');
        console.log('📝 Setting 525 PKR ad flags: isPaidAd=true, paymentAmount=525, paymentStatus=pending, adStatus=pending');
        
        // Compress payment slip before upload to prevent 413 error
        const filename = paymentSlip.split('/').pop() || 'payment_slip.jpg';
        const match = /\.(\w+)$/.exec(filename);
        const ext = match ? match[1] : 'jpg';
        const type = `image/${ext}`;

        let compressedPaymentSlip = paymentSlip;
        try {
          console.log("🔄 Compressing payment slip (800x800 @ 60% quality) to prevent 413 error...");
          compressedPaymentSlip = await compressImage(paymentSlip, 800, 800, 0.6);
          console.log("✅ Payment slip compressed successfully");
        } catch (compressionError) {
          console.error("❌ Payment slip compression failed, trying fallback:", compressionError);
          // Try even more aggressive compression if first fails
          try {
            compressedPaymentSlip = await compressImage(paymentSlip, 600, 600, 0.5);
            console.log("✅ Fallback payment slip compression complete");
          } catch (fallbackError) {
            console.error("❌ Fallback payment slip compression also failed, using original:", fallbackError);
            compressedPaymentSlip = paymentSlip; // Use original if compression fails
          }
        }
        
        formData.append('paymentSlip', {
          uri: compressedPaymentSlip,
          name: filename,
          type,
        } as any);
        console.log("📤 Uploading payment slip (compressed for upload)");
        
        // Compress car images before upload to prevent 413 error
        console.log('🔧 Processing car images for payment form data (compressing for upload)...');
        if (adData.images && Array.isArray(adData.images)) {
          // Reduce to 4 images max to prevent 413 error
          const maxImagesToUpload = 4;
          const imagesToProcess = adData.images
            .filter((uri: string) => uri && uri.startsWith('file://'))
            .slice(0, maxImagesToUpload);
          
          console.log(`📸 Processing ${imagesToProcess.length} images (max 4 to prevent 413 error)`);
          
          // Compress images VERY aggressively before upload to prevent 413 error
          let compressedImages: string[] = imagesToProcess;
          try {
            console.log("🔄 Compressing car images (500x500 @ 40% quality) to prevent 413 error...");
            // Start with very aggressive compression
            compressedImages = await compressImages(imagesToProcess, 500, 500, 0.4);
            console.log("✅ Car images compressed successfully");
          } catch (compressionError) {
            console.error("❌ Car images compression failed, trying even more aggressive:", compressionError);
            // Try even more aggressive compression if first fails
            try {
              compressedImages = await compressImages(imagesToProcess, 400, 400, 0.3);
              console.log("✅ Fallback compression complete");
            } catch (fallbackError) {
              console.error("❌ Fallback compression also failed, trying final:", fallbackError);
              try {
                compressedImages = await compressImages(imagesToProcess, 300, 300, 0.2);
                console.log("✅ Final compression complete");
              } catch (finalError) {
                console.error("❌ All compression attempts failed, using original images:", finalError);
                compressedImages = imagesToProcess; // Use original if all compression fails
              }
            }
          }
          
          compressedImages.forEach((imageUri, index) => {
            const imageFilename = imageUri.split('/').pop() || `car_image_${index + 1}.jpg`;
            const imageMatch = /\.(\w+)$/.exec(imageFilename);
            const imageExt = imageMatch ? imageMatch[1] : 'jpg';
            const imageType = `image/${imageExt}`;

            console.log(`🔧 Adding compressed car image ${index + 1}:`, {
              uri: imageUri.substring(0, 50) + "...",
              filename: imageFilename,
              type: imageType
            });

            formData.append(`image${index + 1}`, {
              uri: imageUri,
              name: imageFilename,
              type: imageType,
            } as any);
          });
        }

        // Send to backend to create pending ad
        const response = await fetch(`${API_URL}/create-pending-ad`, {
          method: 'POST',
          body: formData,
        });

        // Check if response is JSON before parsing
        const contentType = response.headers.get("content-type");
        let result;
        
        if (!contentType || !contentType.includes("application/json")) {
          // Response is not JSON (likely HTML error page)
          const errorText = await response.text();
          console.error("🚨 Non-JSON response from create-pending-ad:", errorText.substring(0, 500));
          
          // Try to extract error message from HTML
          let errorMessage = "Failed to submit payment. Please try again.";
          if (errorText.includes("<title>")) {
            const titleMatch = errorText.match(/<title[^>]*>([^<]+)<\/title>/i);
            if (titleMatch) {
              errorMessage = titleMatch[1];
            }
          }
          
          // Check for specific error codes
          if (response.status === 413) {
            errorMessage = "File size too large. Please reduce image size or upload fewer images.";
          } else if (response.status === 400) {
            errorMessage = "Invalid request. Please check your data and try again.";
          } else if (response.status === 500) {
            errorMessage = "Server error. Please try again later.";
          }
          
          Alert.alert('Error', errorMessage);
          return;
        }

        try {
          result = await response.json();
        } catch (jsonError) {
          console.error("🚨 JSON parsing error:", jsonError);
          const errorText = await response.text();
          console.error("🚨 Response text:", errorText.substring(0, 500));
          Alert.alert('Error', 'Invalid response from server. Please try again.');
          return;
        }

        if (response.ok) {
          setPaymentSent(true);
          Alert.alert(
            'Payment Submitted!',
            'Your payment slip has been uploaded. Your ad will be posted after admin verification.',
            [
              {
                text: 'OK',
                onPress: () => {
                  navigation.goBack();
                }
              }
            ]
          );
        } else {
          const errorMsg = result?.message || result?.error || 'Failed to submit payment. Please try again.';
          console.error("❌ Payment submission failed:", errorMsg);
          Alert.alert('Error', errorMsg);
        }
      } else if (isAdService && !adData) {
        // Handle ad service purchase only (when no adData)
        const response = await fetch(`${API_URL}/purchase-ad-service`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId,
            amount: cost,
            serviceType: 'ad_service'
          }),
        });

        const result = await response.json();

        if (response.ok) {
          setPaymentSent(true);
          Alert.alert(
            'Ad Service Purchased!',
            'You have successfully purchased the ad service. You can now post additional ads after your free limit.',
            [
              {
                text: 'OK',
                onPress: () => {
                  navigation.goBack();
                }
              }
            ]
          );
        } else {
          Alert.alert('Error', result.message || 'Failed to purchase ad service. Please try again.');
        }
      } else if (isPremiumPackage) {
        // Handle premium package purchase
        const response = await fetch(`${API_URL}/purchase-premium-package`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId,
            packageType,
            amount: cost
          }),
        });

        const result = await response.json();

        if (response.ok) {
          setPaymentSent(true);
          const days = packageType === '7-day' ? '7' : packageType === '15-day' ? '15' : '30';
          Alert.alert(
            'Premium Package Submitted!',
            `You have successfully submitted the ${packageType} package for approval. Your package will be reviewed by admin and activated once approved.`,
            [
              {
                text: 'OK',
                onPress: () => {
                  navigation.goBack();
                }
              }
            ]
          );
        } else {
          Alert.alert('Error', result.message || 'Failed to purchase premium package. Please try again.');
        }
      } else if (isReactivation) {
        // Handle ad reactivation
        const response = await fetch(`${API_URL}/reactivate-ad/${adId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            adType,
            userId,
            amount: cost,
            paymentMethod: paymentMethod,
            paymentSlip: paymentSlip
          }),
        });

        const result = await response.json();

        if (response.ok) {
          setPaymentSent(true);
          Alert.alert(
            'Ad Reactivated!',
            'Your ad has been reactivated and submitted for admin approval. You will be notified once it\'s approved.',
            [
              {
                text: 'OK',
                onPress: () => {
                  navigation.goBack();
                }
              }
            ]
          );
        } else {
          Alert.alert('Error', result.message || 'Failed to reactivate ad. Please try again.');
        }
      } else {
        // Handle new ad creation
        const formData = new FormData();
        formData.append('userId', userId);
        formData.append('adData', JSON.stringify(adData));
        formData.append('paymentMethod', paymentMethod || 'easypaisa');
        formData.append('amount', cost.toString());
        
        // For 525 PKR ads, explicitly set payment status and flags
        if (cost === 525 || isAdService) {
          formData.append('isPaidAd', 'true');
          formData.append('paymentAmount', '525');
          formData.append('paymentStatus', 'pending');
          formData.append('adStatus', 'pending'); // Also set adStatus to pending
          formData.append('isActive', 'false'); // Set inactive until approved
          console.log('📝 Setting 525 PKR ad flags: isPaidAd=true, paymentAmount=525, paymentStatus=pending, adStatus=pending');
        }
        
        // Add payment slip image
        const filename = paymentSlip.split('/').pop() || 'payment_slip.jpg';
        const match = /\.(\w+)$/.exec(filename);
        const ext = match ? match[1] : 'jpg';
        const type = `image/${ext}`;

        // Compress payment slip aggressively to prevent 413 error
        let compressedPaymentSlip = paymentSlip;
        try {
          console.log("🔄 Compressing payment slip (600x600 @ 50% quality) to prevent 413 error...");
          compressedPaymentSlip = await compressImage(paymentSlip, 600, 600, 0.5);
          console.log("✅ Payment slip compressed successfully");
        } catch (compressionError) {
          console.error("❌ Payment slip compression failed, trying even more aggressive:", compressionError);
          try {
            compressedPaymentSlip = await compressImage(paymentSlip, 500, 500, 0.4);
            console.log("✅ Fallback payment slip compression complete");
          } catch (fallbackError) {
            console.error("❌ Fallback payment slip compression also failed, trying final:", fallbackError);
            try {
              compressedPaymentSlip = await compressImage(paymentSlip, 400, 400, 0.3);
              console.log("✅ Final payment slip compression complete");
            } catch (finalError) {
              console.error("❌ All compression attempts failed, using original:", finalError);
              compressedPaymentSlip = paymentSlip; // Use original if all compression fails
            }
          }
        }
        
        formData.append('paymentSlip', {
          uri: compressedPaymentSlip,
          name: filename,
          type,
        } as any);
        console.log("📤 Uploading payment slip (compressed for upload)");
        
        // Compress car images before upload to prevent 413 error
        console.log('🔧 Processing car images for payment form data (compressing for upload)...');
        if (adData.images && Array.isArray(adData.images)) {
          // Reduce to 4 images max to prevent 413 error
          const maxImagesToUpload = 4;
          const imagesToProcess = adData.images
            .filter((uri: string) => uri && uri.startsWith('file://'))
            .slice(0, maxImagesToUpload);
          
          console.log(`📸 Processing ${imagesToProcess.length} images (max 4 to prevent 413 error)`);
          
          // Compress images aggressively before upload to prevent 413 error
          let compressedImages: string[] = imagesToProcess;
          try {
            console.log("🔄 Compressing car images (600x600 @ 50% quality) to prevent 413 error...");
            compressedImages = await compressImages(imagesToProcess, 600, 600, 0.5);
            console.log("✅ Car images compressed successfully");
          } catch (compressionError) {
            console.error("❌ Car images compression failed, trying even more aggressive:", compressionError);
            // Try even more aggressive compression if first fails
            try {
              compressedImages = await compressImages(imagesToProcess, 500, 500, 0.4);
              console.log("✅ Fallback car images compression complete");
            } catch (fallbackError) {
              console.error("❌ Fallback car images compression also failed, trying final:", fallbackError);
              try {
                compressedImages = await compressImages(imagesToProcess, 400, 400, 0.3);
                console.log("✅ Final car images compression complete");
              } catch (finalError) {
                console.error("❌ All compression attempts failed, using original images:", finalError);
                compressedImages = imagesToProcess; // Use original if all compression fails
              }
            }
          }
          
          compressedImages.forEach((imageUri, index) => {
            const imageFilename = imageUri.split('/').pop() || `car_image_${index + 1}.jpg`;
            const imageMatch = /\.(\w+)$/.exec(imageFilename);
            const imageExt = imageMatch ? imageMatch[1] : 'jpg';
            const imageType = `image/${imageExt}`;

            console.log(`🔧 Adding compressed car image ${index + 1}:`, {
              uri: imageUri.substring(0, 50) + "...",
              filename: imageFilename,
              type: imageType
            });

            formData.append(`image${index + 1}`, {
              uri: imageUri,
              name: imageFilename,
              type: imageType,
            } as any);
          });
        }

        // Send to backend
        const response = await fetch(`${API_URL}/create-pending-ad`, {
          method: 'POST',
          body: formData,
          // DO NOT set Content-Type header for FormData in React Native
          // The system will set it automatically with the correct boundary
        });

        // Check if response is JSON before parsing
        const contentType = response.headers.get("content-type");
        let result;
        
        if (!contentType || !contentType.includes("application/json")) {
          // Response is not JSON (likely HTML error page)
          const errorText = await response.text();
          console.error("🚨 Non-JSON response from create-pending-ad:", errorText.substring(0, 500));
          
          // Try to extract error message from HTML
          let errorMessage = "Failed to submit payment. Please try again.";
          if (errorText.includes("<title>")) {
            const titleMatch = errorText.match(/<title[^>]*>([^<]+)<\/title>/i);
            if (titleMatch) {
              errorMessage = titleMatch[1];
            }
          }
          
          // Check for specific error codes
          if (response.status === 413) {
            errorMessage = "File size too large. Please reduce image size or upload fewer images.";
          } else if (response.status === 400) {
            errorMessage = "Invalid request. Please check your data and try again.";
          } else if (response.status === 500) {
            errorMessage = "Server error. Please try again later.";
          }
          
          Alert.alert('Error', errorMessage);
          return;
        }

        try {
          result = await response.json();
        } catch (jsonError) {
          console.error("🚨 JSON parsing error:", jsonError);
          const errorText = await response.text();
          console.error("🚨 Response text:", errorText.substring(0, 500));
          Alert.alert('Error', 'Invalid response from server. Please try again.');
          return;
        }

        if (response.ok) {
          setPaymentSent(true);
          Alert.alert(
            'Payment Submitted!',
            'Your payment slip has been uploaded. Your ad will be posted after admin verification.',
            [
              {
                text: 'OK',
                onPress: () => {
                  navigation.goBack();
                }
              }
            ]
          );
        } else {
          const errorMsg = result?.message || result?.error || 'Failed to submit payment. Please try again.';
          console.error("❌ Payment submission failed:", errorMsg);
          Alert.alert('Error', errorMsg);
        }
      }
    } catch (error) {
      console.error('Error submitting payment:', error);
      Alert.alert('Error', 'Failed to submit payment. Please try again.');
    } finally {
      setUploadingSlip(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading payment information...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={COLORS.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {isReactivation ? 'Reactivate Ad' : isExtension ? 'Extend Your Ad' : isAdService ? 'Purchase Ad Service' : isPremiumPackage ? 'Premium Package' : 'Payment Required'}
          </Text>
          <View style={styles.placeholder} />
        </View>

        {/* Payment Info Card */}
        <View style={styles.paymentCard}>
          <View style={styles.paymentHeader}>
            <Ionicons name="card" size={32} color={COLORS.primary} />
            <Text style={styles.paymentTitle}>
              {isReactivation ? 'Ad Reactivation' : isExtension ? 'Ad Extension' : isAdService ? 'Ad Service Purchase' : isPremiumPackage ? 'Premium Package Purchase' : 'Ad Payment'}
            </Text>
          </View>
          
          <View style={styles.amountSection}>
            <Text style={styles.amountLabel}>Amount to Pay</Text>
            <Text style={styles.amount}>PKR {cost.toLocaleString()}</Text>
          </View>
          
          {isReactivation && (
            <View style={styles.packageInfo}>
              <Text style={styles.packageText}>
                🔄 AD REACTIVATION
              </Text>
              <Text style={styles.packageDetails}>
                Reactivate your expired {adType} ad and submit for admin approval
              </Text>
            </View>
          )}

          {isExtension && (
            <View style={styles.packageInfo}>
              <Text style={styles.packageText}>
                📦 {packageType.toUpperCase()} PACKAGE
              </Text>
              <Text style={styles.packageDetails}>
                Extend your ad for {days} additional days
              </Text>
            </View>
          )}

          {isAdService && (
            <View style={styles.packageInfo}>
              <Text style={styles.packageText}>
                🚗 AD SERVICE PURCHASE
              </Text>
              <Text style={styles.packageDetails}>
                Purchase additional ad posting service (PKR 525)
              </Text>
              <Text style={styles.packageDetails}>
                This amount will be adjusted from any premium service you purchase later
              </Text>
            </View>
          )}

          {isPremiumPackage && (
            <View style={styles.packageInfo}>
              <Text style={styles.packageText}>
                💎 PREMIUM PACKAGE
              </Text>
              <Text style={styles.packageDetails}>
                {packageType?.toUpperCase()} Package - Unlimited ad posting
              </Text>
              <Text style={styles.packageDetails}>
                Valid for {packageType === '7-day' ? '7' : packageType === '15-day' ? '15' : '30'} days
              </Text>
            </View>
          )}

          <View style={styles.infoSection}>
            <Text style={styles.infoText}>
              After your 2 free ads, each additional ad costs PKR 525. 
              This amount will be adjusted from any premium service you purchase later.
            </Text>
          </View>

          {pricing && (
            <View style={styles.pricingInfo}>
              <Text style={styles.pricingTitle}>Your Ad Status:</Text>
              <Text style={styles.pricingText}>
                • Free ads used: {pricing.pricingInfo.freeAds - pricing.freeAdsRemaining} of {pricing.pricingInfo.freeAds}
              </Text>
              <Text style={styles.pricingText}>
                • Free ads remaining: {pricing.freeAdsRemaining}
              </Text>
              <Text style={styles.pricingText}>
                • Premium credits earned: PKR {pricing.premiumAdjustmentAvailable}
              </Text>
            </View>
          )}
        </View>

        {/* Payment Methods */}
        <View style={styles.paymentMethodsCard}>
          <Text style={styles.sectionTitle}>Choose Payment Method</Text>
          
          {/* EasyPaisa */}
          <TouchableOpacity
            style={[
              styles.paymentMethod,
              paymentMethod === 'easypaisa' && styles.selectedPaymentMethod
            ]}
            onPress={() => handlePaymentMethodSelect('easypaisa')}
          >
            <View style={styles.paymentMethodHeader}>
              <View style={styles.paymentMethodIcon}>
                <Text style={styles.paymentMethodIconText}>EP</Text>
              </View>
              <View style={styles.paymentMethodInfo}>
                <Text style={styles.paymentMethodName}>EasyPaisa</Text>
                <Text style={styles.paymentMethodNumber}>{easypaisaNumber}</Text>
                <Text style={styles.paymentMethodHolder}>{easypaisaName}</Text>
              </View>
              <Ionicons 
                name={paymentMethod === 'easypaisa' ? 'radio-button-on' : 'radio-button-off'} 
                size={24} 
                color={paymentMethod === 'easypaisa' ? COLORS.primary : COLORS.gray} 
              />
            </View>
          </TouchableOpacity>

          {/* JazzCash */}
          <TouchableOpacity
            style={[
              styles.paymentMethod,
              paymentMethod === 'jazzcash' && styles.selectedPaymentMethod
            ]}
            onPress={() => handlePaymentMethodSelect('jazzcash')}
          >
            <View style={styles.paymentMethodHeader}>
              <View style={[styles.paymentMethodIcon, { backgroundColor: COLORS.jazzcash }]}>
                <Text style={styles.paymentMethodIconText}>JC</Text>
              </View>
              <View style={styles.paymentMethodInfo}>
                <Text style={styles.paymentMethodName}>JazzCash</Text>
                <Text style={styles.paymentMethodNumber}>{jazzcashNumber}</Text>
                <Text style={styles.paymentMethodHolder}>{jazzcashName}</Text>
              </View>
              <Ionicons 
                name={paymentMethod === 'jazzcash' ? 'radio-button-on' : 'radio-button-off'} 
                size={24} 
                color={paymentMethod === 'jazzcash' ? COLORS.primary : COLORS.gray} 
              />
            </View>
          </TouchableOpacity>
        </View>

        {/* Payment Instructions */}
        {paymentMethod && (
          <View style={styles.instructionsCard}>
            <Text style={styles.instructionsTitle}>Payment Instructions</Text>
            
            <View style={styles.step}>
              <Text style={styles.stepNumber}>1</Text>
              <Text style={styles.stepText}>
                Send PKR {cost} to the selected number
              </Text>
            </View>
            
            <View style={styles.step}>
              <Text style={styles.stepNumber}>2</Text>
              <Text style={styles.stepText}>
                Copy the transaction ID from your payment app
              </Text>
            </View>
            
            <View style={styles.step}>
              <Text style={styles.stepNumber}>3</Text>
              <Text style={styles.stepText}>
                Upload your payment slip below
              </Text>
            </View>
            
            <View style={styles.step}>
              <Text style={styles.stepNumber}>4</Text>
              <Text style={styles.stepText}>
                Click "I have sent payment" below
              </Text>
            </View>

            {/* Copy Number Button */}
            <TouchableOpacity
              style={styles.copyButton}
              onPress={() => copyToClipboard(
                paymentMethod === 'easypaisa' ? easypaisaNumber : jazzcashNumber,
                `${paymentMethod === 'easypaisa' ? 'EasyPaisa' : 'JazzCash'} Number`
              )}
            >
              <Ionicons name="copy" size={20} color={COLORS.white} />
              <Text style={styles.copyButtonText}>
                Copy {paymentMethod === 'easypaisa' ? 'EasyPaisa' : 'JazzCash'} Number
              </Text>
            </TouchableOpacity>

            {/* Payment Slip Upload Section */}
            <View style={styles.slipUploadSection}>
              <Text style={styles.slipUploadTitle}>Upload Payment Slip</Text>
              
              {paymentSlip ? (
                <View style={styles.slipPreviewContainer}>
                  <Image source={{ uri: paymentSlip }} style={styles.slipPreview} />
                  <TouchableOpacity
                    style={styles.removeSlipButton}
                    onPress={removePaymentSlip}
                  >
                    <Ionicons name="close-circle" size={24} color={COLORS.error} />
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.uploadSlipButton}
                  onPress={pickPaymentSlip}
                >
                  <Ionicons name="camera" size={24} color={COLORS.primary} />
                  <Text style={styles.uploadSlipButtonText}>Upload Payment Slip</Text>
                </TouchableOpacity>
              )}
              
              <Text style={styles.slipUploadHint}>
                Take a clear photo of your payment receipt or slip
              </Text>
            </View>

          </View>
        )}

        {/* Payment Confirmation */}
        {paymentMethod && !paymentSent && (
          <TouchableOpacity
            style={[styles.confirmButton, (!paymentSlip || uploadingSlip) && styles.disabledButton]}
            onPress={handlePaymentSent}
            disabled={!paymentSlip || uploadingSlip}
          >
            {uploadingSlip ? (
              <ActivityIndicator size="small" color={COLORS.white} />
            ) : (
              <Ionicons name="checkmark-circle" size={24} color={COLORS.white} />
            )}
            <Text style={styles.confirmButtonText}>
              {uploadingSlip ? 'Uploading...' : 'I have sent payment'}
            </Text>
          </TouchableOpacity>
        )}

        {/* Payment Sent Confirmation */}
        {paymentSent && (
          <View style={styles.paymentSentCard}>
            <Ionicons name="checkmark-circle" size={48} color={COLORS.success} />
            <Text style={styles.paymentSentTitle}>Payment Sent!</Text>
            <Text style={styles.paymentSentText}>
              Your payment has been recorded. Your ad will be posted after verification.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.gray,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  placeholder: {
    width: 40,
  },
  paymentCard: {
    backgroundColor: COLORS.white,
    margin: 16,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  paymentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  paymentTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 12,
    color: COLORS.dark,
  },
  amountSection: {
    alignItems: 'center',
    marginBottom: 20,
    paddingVertical: 16,
    backgroundColor: COLORS.lightGray,
    borderRadius: 8,
  },
  amountLabel: {
    fontSize: 16,
    color: COLORS.gray,
    marginBottom: 8,
  },
  amount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  infoSection: {
    backgroundColor: COLORS.lightBlue + '20',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  infoText: {
    fontSize: 14,
    color: COLORS.dark,
    lineHeight: 20,
  },
  pricingInfo: {
    backgroundColor: COLORS.lightGray,
    padding: 12,
    borderRadius: 8,
  },
  pricingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.dark,
    marginBottom: 8,
  },
  pricingText: {
    fontSize: 14,
    color: COLORS.gray,
    marginBottom: 4,
  },
  paymentMethodsCard: {
    backgroundColor: COLORS.white,
    margin: 16,
    marginTop: 0,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.dark,
    marginBottom: 16,
  },
  paymentMethod: {
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
  },
  selectedPaymentMethod: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + '10',
  },
  paymentMethodHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  paymentMethodIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.easypaisa,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  paymentMethodIconText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  paymentMethodInfo: {
    flex: 1,
  },
  paymentMethodName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.dark,
  },
  paymentMethodNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginVertical: 2,
  },
  paymentMethodHolder: {
    fontSize: 14,
    color: COLORS.gray,
  },
  instructionsCard: {
    backgroundColor: COLORS.white,
    margin: 16,
    marginTop: 0,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  instructionsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.dark,
    marginBottom: 16,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    color: COLORS.white,
    textAlign: 'center',
    lineHeight: 24,
    fontSize: 14,
    fontWeight: 'bold',
    marginRight: 12,
  },
  stepText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.dark,
    lineHeight: 20,
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 16,
  },
  copyButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  openAppButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
    borderWidth: 2,
    borderColor: COLORS.primary,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 12,
  },
  openAppButtonText: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  confirmButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.success,
    paddingVertical: 16,
    paddingHorizontal: 20,
    margin: 16,
    borderRadius: 8,
  },
  confirmButtonText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  disabledButton: {
    backgroundColor: COLORS.gray,
    opacity: 0.6,
  },
  slipUploadSection: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  slipUploadTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.dark,
    marginBottom: 12,
  },
  slipPreviewContainer: {
    position: 'relative',
    alignItems: 'center',
    marginBottom: 12,
  },
  slipPreview: {
    width: 200,
    height: 150,
    borderRadius: 8,
    resizeMode: 'cover',
  },
  removeSlipButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: COLORS.white,
    borderRadius: 12,
  },
  uploadSlipButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.lightGray,
    borderWidth: 2,
    borderColor: COLORS.primary,
    borderStyle: 'dashed',
    paddingVertical: 20,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginBottom: 12,
  },
  uploadSlipButtonText: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  slipUploadHint: {
    fontSize: 12,
    color: COLORS.gray,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  paymentSentCard: {
    backgroundColor: COLORS.white,
    margin: 16,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  paymentSentTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.success,
    marginTop: 12,
    marginBottom: 8,
  },
  paymentSentText: {
    fontSize: 14,
    color: COLORS.gray,
    textAlign: 'center',
    lineHeight: 20,
  },
  // Package Extension Styles
  packageInfo: {
    backgroundColor: COLORS.primary + '10',
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  packageText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 4,
  },
  packageDetails: {
    fontSize: 12,
    color: COLORS.gray,
  },
});

export default PaymentScreen;
