import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { COLORS } from '../constants/colors';
import { API_URL } from '../../config.js';

const { width, height } = Dimensions.get('window');
const isTablet = width >= 768;
const isSmallScreen = width < 375;

interface PremiumPackage {
  type: string;
  name: string;
  price: number;
  days: number;
  description: string;
  features: string[];
}

interface UserPremiumStatus {
  packageInfo: {
    type: string;
    isActive: boolean;
    status: string;
    daysRemaining: number;
    expiryDate: string;
    adminNotes: string;
    approvedAt: string;
    rejectedAt: string;
  };
  freeAdLimit: number;
  paidAdsCount: number;
  totalPaidAmount: number;
}

const PremiumPackagesScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { userId } = route.params as any;

  const [packages, setPackages] = useState<PremiumPackage[]>([]);
  const [userStatus, setUserStatus] = useState<UserPremiumStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);

  useEffect(() => {
    fetchPackages();
    fetchUserStatus();
  }, []);

  const fetchPackages = async () => {
    try {
      const response = await fetch(`${API_URL}/premium-packages`);
      if (response.ok) {
        const data = await response.json();
        setPackages(data.packages);
      }
    } catch (error) {
      console.error('Error fetching packages:', error);
    }
  };

  const fetchUserStatus = async () => {
    try {
      const response = await fetch(`${API_URL}/user-premium-status/${userId}`);
      if (response.ok) {
        const data = await response.json();
        setUserStatus(data);
      }
    } catch (error) {
      console.error('Error fetching user status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePackageSelect = (packageType: string, price: number) => {
    Alert.alert(
      'Purchase Premium Package',
      `You want to purchase the ${packageType} package for PKR ${price.toLocaleString()}. This will give you unlimited ad posting for the specified duration.`,
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Proceed to Payment',
          onPress: () => {
            // Navigate to payment screen with package details
            (navigation as any).navigate('PaymentScreen', {
              userId: userId,
              packageType: packageType,
              cost: price,
              isPremiumPackage: true
            });
          }
        }
      ]
    );
  };

  const renderPackageCard = (pkg: PremiumPackage, index: number) => {
    const isRecommended = pkg.type === '30-day';
    const isPopular = pkg.type === '15-day';

    return (
      <TouchableOpacity
        key={pkg.type}
        style={[
          styles.packageCard,
          isRecommended && styles.recommendedCard,
          isPopular && styles.popularCard
        ]}
        onPress={() => handlePackageSelect(pkg.type, pkg.price)}
      >
        {isRecommended && (
          <View style={styles.recommendedBadge}>
            <Text style={styles.recommendedText}>RECOMMENDED</Text>
          </View>
        )}
        
        {isPopular && (
          <View style={styles.popularBadge}>
            <Text style={styles.popularText}>POPULAR</Text>
          </View>
        )}

        <View style={styles.packageHeader}>
          <Text style={styles.packageName}>{pkg.name}</Text>
          <Text style={styles.packagePrice}>PKR {pkg.price.toLocaleString()}</Text>
        </View>

        <Text style={styles.packageDescription}>{pkg ? pkg.description : ''}</Text>

        <View style={styles.featuresContainer}>
          {pkg.features.map((feature, idx) => (
            <View key={idx} style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={16} color={COLORS.success} />
              <Text style={styles.featureText}>{feature}</Text>
            </View>
          ))}
        </View>

        <View style={styles.packageFooter}>
          <Text style={styles.validityText}>Valid for {pkg.days} days</Text>
          <Text style={styles.pricePerDay}>
            PKR {Math.round(pkg.price / pkg.days)}/day
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderUserStatus = () => {
    if (!userStatus) return null;

    const { packageInfo } = userStatus;

    if (packageInfo.status === 'pending') {
      return (
        <View style={[styles.statusCard, styles.pendingCard]}>
          <View style={styles.statusHeader}>
            <Ionicons name="time" size={24} color={COLORS.warning} />
            <Text style={styles.statusTitle}>Premium Package Pending</Text>
          </View>
          <Text style={styles.statusPackage}>{packageInfo.type.toUpperCase()} Package</Text>
          <Text style={styles.statusDescription}>
            Your premium package is pending admin approval. You will be notified once approved.
          </Text>
          <Text style={styles.statusDate}>
            Submitted: {new Date(packageInfo.expiryDate).toLocaleDateString()}
          </Text>
        </View>
      );
    } else if (packageInfo.status === 'rejected') {
      return (
        <View style={[styles.statusCard, styles.rejectedCard]}>
          <View style={styles.statusHeader}>
            <Ionicons name="close-circle" size={24} color={COLORS.error} />
            <Text style={styles.statusTitle}>Premium Package Rejected</Text>
          </View>
          <Text style={styles.statusPackage}>{packageInfo.type.toUpperCase()} Package</Text>
          <Text style={styles.statusDescription}>
            Your premium package was rejected. Please contact support for more information.
          </Text>
          {packageInfo.adminNotes && (
            <Text style={styles.adminNotes}>
              Admin Notes: {packageInfo.adminNotes}
            </Text>
          )}
        </View>
      );
    } else if (packageInfo.isActive) {
      return (
        <View style={[styles.statusCard, styles.activeCard]}>
          <View style={styles.statusHeader}>
            <Ionicons name="diamond" size={24} color={COLORS.primary} />
            <Text style={styles.statusTitle}>Active Premium Package</Text>
          </View>
          <Text style={styles.statusPackage}>{packageInfo.type.toUpperCase()} Package</Text>
          <Text style={styles.statusDays}>
            {packageInfo.daysRemaining} days remaining
          </Text>
          <Text style={styles.statusExpiry}>
            Expires: {new Date(packageInfo.expiryDate).toLocaleDateString()}
          </Text>
        </View>
      );
    } else {
      return (
        <View style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <Ionicons name="diamond-outline" size={24} color={COLORS.gray} />
            <Text style={styles.statusTitle}>No Active Package</Text>
          </View>
          <Text style={styles.statusDescription}>
            Purchase a premium package to get unlimited ad posting
          </Text>
        </View>
      );
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading packages...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Premium Packages</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* User Status */}
        {renderUserStatus()}

        {/* Packages */}
        <View style={styles.packagesContainer}>
          <Text style={styles.sectionTitle}>Choose Your Package</Text>
          <Text style={styles.sectionSubtitle}>
            Get unlimited ad posting for the duration of your package
          </Text>

          {packages.map((pkg, index) => renderPackageCard(pkg, index))}
        </View>

        {/* Info Section */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>How It Works</Text>
          <View style={styles.infoItem}>
            <Ionicons name="1" size={20} color={COLORS.primary} />
            <Text style={styles.infoText}>Purchase a premium package</Text>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name="2" size={20} color={COLORS.primary} />
            <Text style={styles.infoText}>Get unlimited ad posting for the package duration</Text>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name="3" size={20} color={COLORS.primary} />
            <Text style={styles.infoText}>Package expires after the specified days</Text>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name="4" size={20} color={COLORS.primary} />
            <Text style={styles.infoText}>Purchase a new package to continue</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.lightGray,
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
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    flex: 1,
    fontSize: isTablet ? 24 : 20,
    fontWeight: 'bold',
    color: COLORS.white,
    textAlign: 'center',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  statusCard: {
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
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusTitle: {
    fontSize: isTablet ? 18 : 16,
    fontWeight: 'bold',
    color: COLORS.dark,
    marginLeft: 8,
  },
  statusPackage: {
    fontSize: isTablet ? 16 : 14,
    fontWeight: '600',
    color: COLORS.primary,
    marginBottom: 8,
  },
  statusDays: {
    fontSize: isTablet ? 14 : 12,
    color: COLORS.success,
    fontWeight: '600',
    marginBottom: 4,
  },
  statusExpiry: {
    fontSize: isTablet ? 12 : 10,
    color: COLORS.gray,
  },
  statusDescription: {
    fontSize: isTablet ? 14 : 12,
    color: COLORS.gray,
    marginTop: 8,
  },
  statusDate: {
    fontSize: isTablet ? 12 : 10,
    color: COLORS.gray,
    marginTop: 4,
    fontStyle: 'italic',
  },
  adminNotes: {
    fontSize: isTablet ? 12 : 10,
    color: COLORS.error,
    marginTop: 8,
    fontStyle: 'italic',
  },
  // Status Card Variants
  pendingCard: {
    borderLeftWidth: 4,
    borderLeftColor: COLORS.warning,
    backgroundColor: COLORS.warning + '10',
  },
  rejectedCard: {
    borderLeftWidth: 4,
    borderLeftColor: COLORS.error,
    backgroundColor: COLORS.error + '10',
  },
  activeCard: {
    borderLeftWidth: 4,
    borderLeftColor: COLORS.success,
    backgroundColor: COLORS.success + '10',
  },
  packagesContainer: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: isTablet ? 24 : 20,
    fontWeight: 'bold',
    color: COLORS.dark,
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: isTablet ? 16 : 14,
    color: COLORS.gray,
    marginBottom: 20,
  },
  packageCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  recommendedCard: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + '05',
  },
  popularCard: {
    borderColor: COLORS.success,
  },
  recommendedBadge: {
    position: 'absolute',
    top: -8,
    right: 20,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  recommendedText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: 'bold',
  },
  popularBadge: {
    position: 'absolute',
    top: -8,
    left: 20,
    backgroundColor: COLORS.success,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  popularText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: 'bold',
  },
  packageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  packageName: {
    fontSize: isTablet ? 18 : 16,
    fontWeight: 'bold',
    color: COLORS.dark,
    flex: 1,
  },
  packagePrice: {
    fontSize: isTablet ? 20 : 18,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  packageDescription: {
    fontSize: isTablet ? 14 : 12,
    color: COLORS.gray,
    marginBottom: 16,
  },
  featuresContainer: {
    marginBottom: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  featureText: {
    fontSize: isTablet ? 14 : 12,
    color: COLORS.dark,
    marginLeft: 8,
  },
  packageFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  validityText: {
    fontSize: isTablet ? 14 : 12,
    color: COLORS.gray,
    fontWeight: '600',
  },
  pricePerDay: {
    fontSize: isTablet ? 14 : 12,
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  infoCard: {
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
  infoTitle: {
    fontSize: isTablet ? 18 : 16,
    fontWeight: 'bold',
    color: COLORS.dark,
    marginBottom: 16,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoText: {
    fontSize: isTablet ? 14 : 12,
    color: COLORS.dark,
    marginLeft: 12,
    flex: 1,
  },
});

export default PremiumPackagesScreen;
