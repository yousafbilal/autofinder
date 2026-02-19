import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { FontAwesome, MaterialIcons, Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { API_URL } from '../../config';
import AsyncStorage from '@react-native-async-storage/async-storage';

type BoostYourBikesScreenProps = NativeStackScreenProps<any, "BoostYourBikesScreen">;

interface PremiumPackage {
  id: string;
  name: string;
  duration: string;
  days: number;
  price: number;
  features: string[];
  popular: boolean;
}

const BoostYourBikesScreen: React.FC<BoostYourBikesScreenProps> = ({ navigation }) => {
  const [packages, setPackages] = useState<PremiumPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<any>(null);
  const [purchasing, setPurchasing] = useState<string | null>(null);

  useEffect(() => {
    fetchPackages();
    fetchUserData();
  }, []);

  const fetchPackages = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/bike-premium-packages`);
      const data = await response.json();
      setPackages(data);
    } catch (error) {
      console.error('Error fetching packages:', error);
      Alert.alert('Error', 'Failed to fetch premium packages');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserData = async () => {
    try {
      const storedUserData = await AsyncStorage.getItem('user');
      if (storedUserData) {
        const parsedData = JSON.parse(storedUserData);
        setUserData(parsedData);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  const handlePurchase = async (packageId: string, price: number) => {
    if (!userData?.userId) {
      Alert.alert('Error', 'User not found. Please login again.');
      return;
    }

    Alert.alert(
      'Confirm Purchase',
      `Are you sure you want to purchase this package for PKR ${price}?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Purchase',
          onPress: () => purchasePackage(packageId, price),
        },
      ]
    );
  };

  const purchasePackage = async (packageId: string, price: number) => {
    try {
      setPurchasing(packageId);
      
      const response = await fetch(`${API_URL}/purchase-bike-premium`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: userData.userId,
          packageType: packageId,
          amount: price,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert(
          'Purchase Successful!',
          'Your premium package request has been submitted and is pending admin approval.',
          [
            {
              text: 'OK',
              onPress: () => navigation.goBack(),
            },
          ]
        );
      } else {
        Alert.alert('Error', data.message || 'Failed to purchase package');
      }
    } catch (error) {
      console.error('Error purchasing package:', error);
      Alert.alert('Error', 'Failed to purchase package. Please try again.');
    } finally {
      setPurchasing(null);
    }
  };

  const getPackageIcon = (packageId: string) => {
    switch (packageId) {
      case 'starter':
        return <FontAwesome name="star" size={24} color="#FFD700" />;
      case 'value':
        return <FontAwesome name="flash" size={24} color="#32CD32" />;
      case 'executive':
        return <MaterialIcons name="diamond" size={24} color="#4169E1" />;
      default:
        return <FontAwesome name="star" size={24} color="#FFD700" />;
    }
  };

  const getPackageColor = (packageId: string) => {
    switch (packageId) {
      case 'starter':
        return '#FFD700';
      case 'value':
        return '#32CD32';
      case 'executive':
        return '#4169E1';
      default:
        return '#FFD700';
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#CD0100" />
        <Text style={styles.loadingText}>Loading Premium Packages...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Boost Your Bikes</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Hero Section */}
      <View style={styles.heroSection}>
        <View style={styles.heroIcon}>
          <FontAwesome name="motorcycle" size={40} color="#CD0100" />
        </View>
        <Text style={styles.heroTitle}>Boost Your Bike Listings</Text>
        <Text style={styles.heroSubtitle}>
          Get maximum visibility for your bike ads with our premium packages
        </Text>
      </View>

      {/* Packages List */}
      <ScrollView style={styles.packagesContainer} showsVerticalScrollIndicator={false}>
        {packages.map((pkg, index) => (
          <View key={pkg.id} style={[styles.packageCard, pkg.popular && styles.popularPackage]}>
            {pkg.popular && (
              <View style={styles.popularBadge}>
                <Text style={styles.popularText}>MOST POPULAR</Text>
              </View>
            )}
            
            <View style={styles.packageHeader}>
              <View style={[styles.packageIcon, { backgroundColor: getPackageColor(pkg.id) + '20' }]}>
                {getPackageIcon(pkg.id)}
              </View>
              <View style={styles.packageInfo}>
                <Text style={styles.packageName}>{pkg.name}</Text>
                <Text style={styles.packageDuration}>{pkg.duration}</Text>
              </View>
              <View style={styles.packagePrice}>
                <Text style={styles.priceText}>PKR {pkg.price.toLocaleString()}</Text>
              </View>
            </View>

            <View style={styles.featuresContainer}>
              <Text style={styles.featuresTitle}>Features:</Text>
              {pkg.features.map((feature, featureIndex) => (
                <View key={featureIndex} style={styles.featureItem}>
                  <FontAwesome name="check-circle" size={16} color="#32CD32" />
                  <Text style={styles.featureText}>{feature}</Text>
                </View>
              ))}
            </View>

            <TouchableOpacity
              style={[
                styles.purchaseButton,
                { backgroundColor: getPackageColor(pkg.id) },
                purchasing === pkg.id && styles.purchasingButton
              ]}
              onPress={() => handlePurchase(pkg.id, pkg.price)}
              disabled={purchasing === pkg.id}
            >
              {purchasing === pkg.id ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <FontAwesome name="shopping-cart" size={16} color="#fff" />
                  <Text style={styles.purchaseButtonText}>Purchase Now</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>

      {/* Footer Info */}
      <View style={styles.footerInfo}>
        <Text style={styles.footerText}>
          💡 All packages require admin approval before activation
        </Text>
        <Text style={styles.footerText}>
          📞 Contact support for any questions
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  placeholder: {
    width: 40,
  },
  heroSection: {
    backgroundColor: '#fff',
    padding: 30,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  heroIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#CD0100',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  heroSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
  },
  packagesContainer: {
    flex: 1,
    padding: 20,
  },
  packageCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    position: 'relative',
  },
  popularPackage: {
    borderWidth: 2,
    borderColor: '#32CD32',
  },
  popularBadge: {
    position: 'absolute',
    top: -10,
    left: 20,
    backgroundColor: '#32CD32',
    paddingHorizontal: 15,
    paddingVertical: 5,
    borderRadius: 15,
  },
  popularText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  packageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  packageIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  packageInfo: {
    flex: 1,
  },
  packageName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  packageDuration: {
    fontSize: 14,
    color: '#666',
  },
  packagePrice: {
    alignItems: 'flex-end',
  },
  priceText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#CD0100',
  },
  featuresContainer: {
    marginBottom: 20,
  },
  featuresTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  featureText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 10,
    flex: 1,
  },
  purchaseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    borderRadius: 10,
    gap: 8,
  },
  purchasingButton: {
    opacity: 0.7,
  },
  purchaseButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  footerInfo: {
    backgroundColor: '#fff',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  footerText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 5,
  },
});

export default BoostYourBikesScreen;
