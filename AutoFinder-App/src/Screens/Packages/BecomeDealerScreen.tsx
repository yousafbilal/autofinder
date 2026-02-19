import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS } from '../../constants/colors';
import iapService from '../../services/iapService';

const BecomeDealerScreen = () => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);
  const [purchasing, setPurchasing] = useState(false);
  const [productInfo, setProductInfo] = useState<any>(null);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    initializeIAP();
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const userData = await AsyncStorage.getItem('user');
      if (userData) {
        const parsed = JSON.parse(userData);
        setUserId(parsed._id || parsed.userId);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  const initializeIAP = async () => {
    // DISABLED FOR iOS - Dealer packages only available on Android
    if (Platform.OS === 'ios') {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      await iapService.initialize();
      const products = await iapService.fetchProducts();
      if (products.length > 0) {
        setProductInfo(products[0]);
      }
    } catch (error) {
      console.error('Error initializing IAP:', error);
      Alert.alert('Error', 'Failed to initialize In-App Purchase. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBecomeDealer = async () => {
    // DISABLED FOR iOS - Dealer packages only available on Android
    if (Platform.OS === 'ios') {
      Alert.alert(
        'Not Available',
        'Dealer packages are currently only available on Android devices. Please use an Android device to purchase dealer packages.'
      );
      return;
    }

    if (!userId) {
      Alert.alert('Error', 'User not logged in. Please login and try again.');
      return;
    }

    Alert.alert(
      'Become a Dealer',
      'You will be charged for a monthly subscription. The subscription will auto-renew unless canceled at least 24 hours before the end of the current period.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Continue',
          onPress: async () => {
            try {
              setPurchasing(true);

              // Complete purchase flow: Purchase → Verify → Activate
              const result = await iapService.completeDealerPurchase(userId);

              if (result.success) {
                Alert.alert(
                  'Success!',
                  'You are now a dealer! Your dealer features are now active.',
                  [
                    {
                      text: 'OK',
                      onPress: () => {
                        // Refresh user data and navigate back
                        navigation.goBack();
                      },
                    },
                  ]
                );
              } else {
                Alert.alert('Purchase Failed', result.message || 'Please try again.');
              }
            } catch (error: any) {
              console.error('Purchase error:', error);
              Alert.alert('Error', error.message || 'Purchase failed. Please try again.');
            } finally {
              setPurchasing(false);
            }
          },
        },
      ]
    );
  };

  if (Platform.OS !== 'ios') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={COLORS.black} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Become a Dealer</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.notAvailableContainer}>
          <Ionicons name="phone-portrait-outline" size={64} color={COLORS.darkGray} />
          <Text style={styles.notAvailableTitle}>Not Available</Text>
          <Text style={styles.notAvailableText}>
            In-App Purchase for Dealer Package is only available on iOS devices.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.black} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Become a Dealer</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.heroSection}>
          <View style={styles.iconContainer}>
            <Ionicons name="storefront" size={64} color={COLORS.primary} />
          </View>
          <Text style={styles.heroTitle}>Unlock Dealer Features</Text>
          <Text style={styles.heroSubtitle}>
            Get access to premium features and boost your sales
          </Text>
        </View>

        <View style={styles.featuresCard}>
          <Text style={styles.sectionTitle}>Dealer Benefits</Text>
          
          <View style={styles.featureItem}>
            <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Unlimited Ads</Text>
              <Text style={styles.featureDescription}>
                Post as many ads as you want without limits
              </Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Priority Visibility</Text>
              <Text style={styles.featureDescription}>
                Your ads get featured placement and higher visibility
              </Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Advanced Analytics</Text>
              <Text style={styles.featureDescription}>
                Track your ad performance with detailed analytics
              </Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Boost Your Ads</Text>
              <Text style={styles.featureDescription}>
                Get free boosters to promote your listings
              </Text>
            </View>
          </View>
        </View>

        {productInfo && (
          <View style={styles.pricingCard}>
            <Text style={styles.pricingLabel}>Monthly Subscription</Text>
            <Text style={styles.pricingAmount}>{productInfo.localizedPrice}</Text>
            <Text style={styles.pricingNote}>
              Auto-renewable subscription. Cancel anytime from App Store settings.
            </Text>
          </View>
        )}

        <View style={styles.infoCard}>
          <Ionicons name="information-circle" size={20} color={COLORS.primary} />
          <Text style={styles.infoText}>
            Payment will be charged to your Apple ID account. Subscription automatically renews unless canceled at least 24 hours before the end of the current period.
          </Text>
        </View>
      </ScrollView>

      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[styles.purchaseButton, (loading || purchasing) && styles.purchaseButtonDisabled]}
          onPress={handleBecomeDealer}
          disabled={loading || purchasing}
        >
          {purchasing ? (
            <>
              <ActivityIndicator size="small" color={COLORS.white} />
              <Text style={styles.purchaseButtonText}>Processing...</Text>
            </>
          ) : (
            <>
              <Ionicons name="storefront" size={20} color={COLORS.white} />
              <Text style={styles.purchaseButtonText}>Become a Dealer</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
    fontWeight: '600',
    color: COLORS.black,
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: 24,
    paddingVertical: 20,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.black,
    marginBottom: 8,
    textAlign: 'center',
  },
  heroSubtitle: {
    fontSize: 16,
    color: COLORS.darkGray,
    textAlign: 'center',
  },
  featuresCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.black,
    marginBottom: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  featureContent: {
    flex: 1,
    marginLeft: 12,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.black,
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    color: COLORS.darkGray,
    lineHeight: 20,
  },
  pricingCard: {
    backgroundColor: COLORS.primary + '10',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
  },
  pricingLabel: {
    fontSize: 14,
    color: COLORS.darkGray,
    marginBottom: 8,
  },
  pricingAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 8,
  },
  pricingNote: {
    fontSize: 12,
    color: COLORS.darkGray,
    textAlign: 'center',
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.lightGray,
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: COLORS.darkGray,
    marginLeft: 8,
    lineHeight: 16,
  },
  bottomBar: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray,
    backgroundColor: COLORS.white,
  },
  purchaseButton: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  purchaseButtonDisabled: {
    opacity: 0.6,
  },
  purchaseButtonText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: '600',
  },
  notAvailableContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  notAvailableTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.black,
    marginTop: 16,
    marginBottom: 8,
  },
  notAvailableText: {
    fontSize: 16,
    color: COLORS.darkGray,
    textAlign: 'center',
    lineHeight: 24,
  },
});

export default BecomeDealerScreen;


