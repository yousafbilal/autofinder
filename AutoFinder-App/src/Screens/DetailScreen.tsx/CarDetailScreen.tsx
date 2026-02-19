import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Linking,
  Dimensions,
  SafeAreaView,
  BackHandler,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { COLORS } from '../../constants/colors';
import { API_URL } from '../../../config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { safeGetAllImagesWithApiUrl } from '../../utils/safeImageUtils';
import SimilarCars from '../../Components/SimilarCars';

const { width, height } = Dimensions.get('window');
const isTablet = width >= 768;
const isSmallScreen = width < 375;

interface CarDetails {
  _id: string;
  title?: string;
  make?: string;
  model?: string;
  year?: number;
  price?: number;
  location?: string;
  description?: string;
  image1?: string;
  image2?: string;
  image3?: string;
  kmDriven?: number;
  fuelType?: string;
  transmission?: string;
  bodyType?: string;
  color?: string;
  variant?: string;
  registrationCity?: string;
  bodyColor?: string;
  engineCapacity?: string;
  assembly?: string;
  features?: string[];
  preferredContact?: string;
  favoritedBy?: string[];
  [key: string]: any;
}

interface UserData {
  userId: string;
  [key: string]: any;
}

const CarDetailScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute();
  const { carId } = route.params as { carId: string };
  
  const [carDetails, setCarDetails] = useState<CarDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [popularCars, setPopularCars] = useState<any[]>([]);
  const [loadingPopularCars, setLoadingPopularCars] = useState(false);
  const [adStats, setAdStats] = useState({
    views: 0,
    inquiries: 0,
    calls: 0
  });
  const [isOwnProperty, setIsOwnProperty] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showImageModal, setShowImageModal] = useState(false);

  // Handle Android back button for image modal
  useEffect(() => {
    if (Platform.OS === 'android') {
      const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
        if (showImageModal) {
          closeImageModal();
          return true; // Prevent default back behavior
        }
        return false; // Allow default back behavior
      });

      return () => backHandler.remove();
    }
  }, [showImageModal]);
  const [expiryData, setExpiryData] = useState({
    daysRemaining: 0,
    isExpired: false,
    isExpiringSoon: false,
    message: '',
    isFreeAd: false
  });

  useEffect(() => {
    fetchUserData();
    fetchCarDetails();
    fetchPopularCars();
    fetchExpiryData();
  }, [carId]);

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

  const fetchCarDetails = async () => {
    try {
      setLoading(true);
      console.log('Fetching car details for ID:', carId);
      console.log('API URL:', `${API_URL}/all_ads/${carId}`);
      
      const response = await fetch(`${API_URL}/all_ads/${carId}`);
      
      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);
      
      if (response.ok) {
        const carData = await response.json();
        console.log('Found car data:', carData);
        setCarDetails(carData);
        
        // Set initial stats
        setAdStats({
          views: carData.views || 0,
          inquiries: carData.inquiries || 0,
          calls: carData.calls || 0
        });
        
        if (userData && carData.favoritedBy) {
          setIsFavorite(carData.favoritedBy.includes(userData.userId));
        }
        
        // Check if this is the user's own property
        const currentUserId = userData?.userId;
        const adUserId = carData?.userId || carData?.sellerId || carData?.postedBy;
        const isOwn = currentUserId && adUserId && String(currentUserId) === String(adUserId);
        setIsOwnProperty(isOwn);
        
        // Track view
        trackAdView();
      } else {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        console.error('Failed to fetch car details:', {
          status: response.status,
          statusText: response.statusText,
          errorData
        });
        Alert.alert('Error', `Car details not found (${response.status}): ${errorData.message || response.statusText}`);
        navigation.goBack();
      }
    } catch (error) {
      console.error('Error fetching car details:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      Alert.alert('Error', `Failed to load car details: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const trackAdView = async () => {
    try {
      const response = await fetch(`${API_URL}/track-ad-view/${carId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: userData?.userId || 'anonymous'
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        setAdStats(prev => ({
          ...prev,
          views: data.views
        }));
      }
    } catch (error) {
      console.error('Error tracking view:', error);
    }
  };

  const trackAdInquiry = async () => {
    try {
      const response = await fetch(`${API_URL}/track-ad-inquiry/${carId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: userData?.userId || 'anonymous',
          inquiryType: 'search'
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        setAdStats(prev => ({
          ...prev,
          inquiries: data.inquiries
        }));
      }
    } catch (error) {
      console.error('Error tracking inquiry:', error);
    }
  };

  const trackAdCall = async () => {
    try {
      const response = await fetch(`${API_URL}/track-ad-call/${carId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: userData?.userId || 'anonymous'
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        setAdStats(prev => ({
          ...prev,
          calls: data.calls
        }));
      }
    } catch (error) {
      console.error('Error tracking call:', error);
    }
  };

  const toggleFavorite = async () => {
    if (!userData || !carDetails) return;

    try {
      const response = await fetch(`${API_URL}/toggle_favorite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adId: carDetails._id, userId: userData.userId }),
      });

      if (response.ok) {
        setIsFavorite(!isFavorite);
        Alert.alert('Success', isFavorite ? 'Removed from favorites' : 'Added to favorites');
      } else {
        Alert.alert('Error', 'Failed to update favorites');
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      Alert.alert('Error', 'Failed to update favorites');
    }
  };

  const handleEdit = () => {
    if (carDetails) {
      (navigation as any).navigate('EditAd', { adId: carDetails._id });
    }
  };

  const handleCall = () => {
    // Track call
    trackAdCall();
    
    const rawPhone = carDetails?.userId?.phone || carDetails?.phone || "1234567890";
    // Remove any non-numeric characters and + prefix
    const cleanPhone = rawPhone.replace(/[^\d]/g, '');
    const callUrl = `tel:${cleanPhone}`;
    console.log("Calling:", callUrl);
    Linking.openURL(callUrl);
  };

  const handleMessage = () => {
    // Track inquiry
    trackAdInquiry();
    
    const rawPhone = carDetails?.userId?.phone || carDetails?.phone || "1234567890";
    // Remove any non-numeric characters and + prefix
    const cleanPhone = rawPhone.replace(/[^\d]/g, '');
    const whatsappUrl = `https://wa.me/${cleanPhone}`;
    console.log("Opening WhatsApp:", whatsappUrl);
    Linking.openURL(whatsappUrl);
  };

  const handleSellItForMe = () => {
    navigation.navigate('ListItForYouScreen' as any);
  };

  const getAvailableImages = () => {
    if (!carDetails) return [];
    
    return safeGetAllImagesWithApiUrl(carDetails, API_URL);
  };

  const nextImage = () => {
    const images = getAvailableImages();
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    const images = getAvailableImages();
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const openImageModal = () => {
    setShowImageModal(true);
  };

  const closeImageModal = () => {
    setShowImageModal(false);
  };

  const fetchExpiryData = async () => {
    try {
      const response = await fetch(`${API_URL}/ad-expiry/${carId}`);
      if (response.ok) {
        const data = await response.json();
        setExpiryData({
          daysRemaining: data.daysRemaining,
          isExpired: data.isExpired,
          isExpiringSoon: data.isExpiringSoon,
          message: data.message,
          isFreeAd: data.isFreeAd
        });
      }
    } catch (error) {
      console.error('Error fetching expiry data:', error);
      // Fallback to local calculation
      const daysRemaining = calculateDaysRemaining();
      setExpiryData({
        daysRemaining,
        isExpired: daysRemaining === 0,
        isExpiringSoon: daysRemaining <= 3 && daysRemaining > 0,
        message: getExpiryMessage(),
        isFreeAd: false
      });
    }
  };

  const calculateDaysRemaining = () => {
    if (!carDetails || !carDetails.dateAdded) return 0;
    
    const adDate = new Date(carDetails.dateAdded);
    const currentDate = new Date();
    const expiryDate = new Date(adDate);
    
    // Add 30 days to the ad creation date for expiry
    expiryDate.setDate(expiryDate.getDate() + 30);
    
    // Calculate difference in days
    const timeDiff = expiryDate.getTime() - currentDate.getTime();
    const daysRemaining = Math.ceil(timeDiff / (1000 * 3600 * 24));
    
    return Math.max(0, daysRemaining); // Don't show negative days
  };

  const getExpiryMessage = () => {
    if (expiryData.daysRemaining === 0) {
      return "Ad has expired";
    } else if (expiryData.daysRemaining === 1) {
      return "Ad will expire in 1 day";
    } else if (expiryData.daysRemaining <= 3) {
      if (expiryData.isFreeAd) {
        return `Ad will expire in ${expiryData.daysRemaining} days - Extend now!`;
      } else {
        return `Ad will expire in ${expiryData.daysRemaining} days`;
      }
    } else {
      return `Ad will expire in ${expiryData.daysRemaining} days`;
    }
  };

  const getExpiryBarStyle = () => {
    if (expiryData.isExpired) {
      return [styles.expiryBar, styles.expiredBar];
    } else if (expiryData.isExpiringSoon) {
      return [styles.expiryBar, styles.warningBar];
    } else {
      return styles.expiryBar;
    }
  };

  const handleViewAllCars = () => {
    navigation.navigate('NewCarListScreen');
  };

  const handlePackageSelect = (packageType: string) => {
    const packages = {
      '7-day': { days: 7, price: 1500 },
      '15-day': { days: 15, price: 2250 },
      '30-day': { days: 30, price: 3150 }
    };

    const selectedPackage = packages[packageType as keyof typeof packages];
    
    Alert.alert(
      'Extend Ad',
      `You selected the ${packageType} package (PKR ${selectedPackage.price ? selectedPackage.price.toLocaleString() : '0'}). This will extend your ad for ${selectedPackage.days} additional days.`,
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
              userId: userData?.userId,
              adId: carDetails?._id,
              packageType: packageType,
              days: selectedPackage.days,
              cost: selectedPackage.price,
              isExtension: true
            });
          }
        }
      ]
    );
  };

  const handlePurchaseAdService = () => {
    Alert.alert(
      'Purchase Ad Service',
      'You want to purchase the PKR 525 ad service. This will allow you to post additional ads after your free limit.',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Proceed to Payment',
          onPress: () => {
            // Navigate to payment screen for ad service purchase
            (navigation as any).navigate('PaymentScreen', {
              userId: userData?.userId,
              adData: {
                title: 'Ad Service Purchase',
                description: 'Purchase additional ad posting service',
                price: 525,
                type: 'ad_service'
              },
              cost: 525,
              isAdService: true
            });
          }
        }
      ]
    );
  };

  const fetchPopularCars = async () => {
    try {
      setLoadingPopularCars(true);
      console.log('Fetching popular cars...');
      
      const response = await fetch(`${API_URL}/new_cars/public`);
      
      if (response.ok) {
        const carsData = await response.json();
        console.log('Found popular cars:', carsData.length);
        // Take only the first 3 cars for the preview
        setPopularCars(carsData.slice(0, 3));
      } else {
        console.error('Failed to fetch popular cars:', response.status);
      }
    } catch (error) {
      console.error('Error fetching popular cars:', error);
    } finally {
      setLoadingPopularCars(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading car details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!carDetails) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="car-outline" size={60} color={COLORS.lightGray} />
          <Text style={styles.errorText}>Car details not found</Text>
           <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
             <Text style={styles.errorText}>Go Back</Text>
           </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={COLORS.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {carDetails.make} {carDetails.model} {carDetails.variant}
          </Text>
          {/* Only show premium tag for actual premium ads, not free ads */}
          {(carDetails.category || '') !== 'free' && (carDetails.adType || '') !== 'free' && (
            <View style={styles.featuredBadge}>
              <Ionicons name="star" size={16} color={COLORS.white} />
              <Text style={styles.featuredText}>FEATURED</Text>
            </View>
          )}
        </View>

        {/* Car Image with Stats */}
        <View style={styles.imageContainer}>
          <TouchableOpacity onPress={openImageModal} activeOpacity={0.9}>
            <Image 
              source={{ uri: `${API_URL}/uploads/${getAvailableImages()[currentImageIndex]}` }} 
              style={styles.carImage}
              resizeMode="cover"
            />
          </TouchableOpacity>
          
          {/* Image Navigation Arrows */}
          {getAvailableImages().length > 1 && (
            <>
              <TouchableOpacity style={styles.imageNavLeft} onPress={prevImage}>
                <Ionicons name="chevron-back" size={24} color={COLORS.white} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.imageNavRight} onPress={nextImage}>
                <Ionicons name="chevron-forward" size={24} color={COLORS.white} />
              </TouchableOpacity>
            </>
          )}
          
          {/* Favorite Icon */}
          <TouchableOpacity style={styles.favoriteButton} onPress={toggleFavorite}>
            <Ionicons 
              name={isFavorite ? "heart" : "heart-outline"} 
              size={24} 
              color={isFavorite ? "#FF6B6B" : COLORS.white} 
            />
          </TouchableOpacity>
          
          {/* Image Pagination */}
          <View style={styles.paginationContainer}>
            <Text style={styles.paginationText}>
              {currentImageIndex + 1}/{getAvailableImages().length}
            </Text>
          </View>
          
          {/* Stats Icons Inside Image - Only show for own ads (My Ads details) */}
          {isOwnProperty && (
            <View style={styles.statsOverlay}>
              <View style={styles.statItem}>
                <Ionicons name="eye" size={isTablet ? 22 : isSmallScreen ? 16 : 18} color={COLORS.white} />
                <Text style={styles.statText}>{adStats.views.toLocaleString()}</Text>
              </View>
              <View style={styles.statItem}>
                <Ionicons name="search" size={isTablet ? 22 : isSmallScreen ? 16 : 18} color={COLORS.white} />
                <Text style={styles.statText}>{adStats.inquiries.toLocaleString()}</Text>
              </View>
              <View style={styles.statItem}>
                <Ionicons name="call" size={isTablet ? 22 : isSmallScreen ? 16 : 18} color={COLORS.white} />
                <Text style={styles.statText}>{adStats.calls.toLocaleString()}</Text>
              </View>
            </View>
          )}
        </View>

        {/* Expiry Notice */}
        <View style={getExpiryBarStyle()}>
          <Text style={styles.expiryText}>{getExpiryMessage()}</Text>
        </View>

        {/* Package Extension - Show only for free ads when expiring soon */}
        {expiryData.daysRemaining <= 3 && !expiryData.isExpired && expiryData.isFreeAd && (
          <View style={styles.packageExtensionCard}>
            <Text style={styles.packageTitle}>Extend Your Ad</Text>
            <Text style={styles.packageSubtitle}>Choose a package to extend your ad visibility</Text>
            
            <View style={styles.packageOptions}>
              <TouchableOpacity style={styles.packageOption} onPress={() => handlePackageSelect('7-day')}>
                <View style={styles.packageHeader}>
                  <Text style={styles.packageName}>7-Day Package</Text>
                  <Text style={styles.packagePrice}>PKR 1,500</Text>
                </View>
                <Text style={styles.packageDescription}>Extend for 7 additional days</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.packageOption} onPress={() => handlePackageSelect('15-day')}>
                <View style={styles.packageHeader}>
                  <Text style={styles.packageName}>15-Day Package</Text>
                  <Text style={styles.packagePrice}>PKR 2,250</Text>
                </View>
                <Text style={styles.packageDescription}>Extend for 15 additional days</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.packageOption, styles.recommendedPackage]} onPress={() => handlePackageSelect('30-day')}>
                <View style={styles.packageHeader}>
                  <Text style={styles.packageName}>30-Day Package</Text>
                  <Text style={styles.packagePrice}>PKR 3,150</Text>
                </View>
                <Text style={styles.packageDescription}>Extend for 30 additional days</Text>
                <View style={styles.recommendedBadge}>
                  <Text style={styles.recommendedText}>RECOMMENDED</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Pricing Information - Show for paid ads when expiring soon */}
        {expiryData.daysRemaining <= 3 && !expiryData.isExpired && !expiryData.isFreeAd && (
          <View style={styles.pricingInfoCard}>
            <Text style={styles.pricingTitle}>Pricing Information</Text>
            <Text style={styles.pricingSubtitle}>After two free ads, the third ad will be charged @</Text>
            <View style={styles.pricingAmount}>
              <Text style={styles.pricingAmountText}>PKR 525/</Text>
            </View>
            <Text style={styles.pricingDescription}>
              This amount will be adjusted from any premium service you purchase later.
            </Text>
            
            <TouchableOpacity 
              style={styles.purchaseButton} 
              onPress={() => handlePurchaseAdService()}
            >
              <Ionicons name="card-outline" size={20} color={COLORS.white} />
              <Text style={styles.purchaseButtonText}>Purchase Ad Service</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* List It For You Section */}
        <View style={styles.sellItForMeCard}>
          <View style={styles.sellItForMeContent}>
            <View style={styles.sellItForMeText}>
              <Text style={styles.sellItForMeTitle}>List It For You</Text>
              <Text style={styles.sellItForMeDescription}>
                Have a car to sell, but no time to bargain best offers?
              </Text>
              <TouchableOpacity style={styles.sellItForMeLink} onPress={handleSellItForMe}>
                <Text style={styles.sellItForMeLinkText}>I want experts to sell my car ✨</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.sellItForMeIllustration}>
              <Ionicons name="car" size={40} color="#4A90E2" />
            </View>
          </View>
        </View>

        {/* Car Details */}
        <View style={styles.detailsCard}>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Registered In</Text>
            <Text style={styles.detailValue}>{carDetails.location || 'Lahore'}</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Exterior Color</Text>
            <Text style={styles.detailValue}>{carDetails.color || 'White'}</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Assembly</Text>
            <Text style={styles.detailValue}>Local</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Engine Capacity</Text>
            <Text style={styles.detailValue}>{carDetails.engineCapacity || '1300'}</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Body Type</Text>
            <Text style={styles.detailValue}>{carDetails.bodyType || 'Sedan'}</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Last Updated</Text>
            <Text style={styles.detailValue}>
              {carDetails.updatedAt ? new Date(carDetails.updatedAt).toLocaleDateString() : '10 Sep 2025'}
            </Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Ad ID</Text>
            <Text style={styles.detailValue}>{carDetails._id}</Text>
          </View>
        </View>

        {/* Features Section */}
        {carDetails.features && carDetails.features.length > 0 && (
          <View style={styles.featuresCard}>
            <Text style={styles.featuresTitle}>Features</Text>
            <View style={styles.featuresList}>
              {carDetails.features.map((feature, index) => (
                <View key={index} style={styles.featureItem}>
                  <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                  <Text style={styles.featureText}>{feature}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Seller Comments Section */}
        {carDetails && carDetails.description && (
          <View style={styles.sellerCommentsCard}>
            <View style={styles.sellerCommentsHeader}>
              <Text style={styles.sellerCommentsTitle}>Seller Comments</Text>
              <TouchableOpacity>
                <Text style={styles.showMoreText}>Show more</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.sellerCommentsText}>{carDetails.description}</Text>
          </View>
        )}

        {/* Popular New Cars Section */}
        <View style={styles.popularCarsCard}>
          <View style={styles.popularCarsHeader}>
            <Text style={styles.popularCarsTitle}>Popular New Cars</Text>
            <TouchableOpacity onPress={handleViewAllCars}>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>
          {loadingPopularCars ? (
            <View style={styles.loadingCarsContainer}>
              <ActivityIndicator size="small" color={COLORS.primary} />
              <Text style={styles.loadingCarsText}>Loading cars...</Text>
            </View>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.carsScrollView}>
              {popularCars.map((car, index) => (
                <TouchableOpacity 
                  key={car._id || index} 
                  style={styles.carCard}
                  onPress={() => {
                    console.log("🚀 Navigating to NewCarDetails with Popular Car:");
                    console.log("   Car _id:", car._id);
                    console.log("   Car make:", car.make);
                    console.log("   Car model:", car.model);
                    console.log("   Full car data:", car);
                    
                    // Prepare images array like NewCarListScreen
                    const images = [
                      car.image1,
                      car.image2,
                      car.image3,
                      car.image4,
                      car.image5,
                      car.image6,
                      car.image7,
                      car.image8,
                    ].filter(Boolean).map(img => `${API_URL}/uploads/${img}`);
                    
                    navigation.navigate("NewCarDetails", {
                      carDetails: { 
                        ...car, 
                        images, 
                        _id: car._id,
                        carId: car._id,
                        id: car._id,
                        userId: car.userId
                      },
                    });
                  }}
                >
                  <Image 
                    source={{ uri: car?.image1 ? `${API_URL}/uploads/${car.image1}` : `${API_URL}/uploads/placeholder.jpg` }} 
                    style={styles.carCardImage}
                    resizeMode="cover"
                  />
                  <Text style={styles.carCardTitle}>
                    {car?.make || 'Car'} {car?.model || ''} {car?.variant || ''}
                  </Text>
                  <Text style={styles.carCardPrice}>
                    PKR {car?.price ? Number(car.price).toLocaleString('en-US') : '0'}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>

        {/* Similar Cars Section */}
        {carDetails && (
          <SimilarCars
            currentCarId={carDetails._id}
            make={carDetails.make}
            model={carDetails.model}
            adType="car"
          />
        )}

        {/* Contact Icons */}
        <View style={styles.contactIconsContainer}>
          <TouchableOpacity style={styles.contactButton} onPress={handleCall}>
            <Ionicons name="call" size={24} color={COLORS.white} />
            <Text style={styles.contactButtonText}>Call</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.whatsappButton} onPress={handleMessage}>
            <Ionicons name="logo-whatsapp" size={24} color={COLORS.white} />
            <Text style={styles.contactButtonText}>WhatsApp</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Image Modal */}
      {showImageModal && (
        <View style={styles.imageModal}>
          <TouchableOpacity style={styles.modalCloseButton} onPress={closeImageModal}>
            <Ionicons name="close" size={30} color={COLORS.white} />
          </TouchableOpacity>
          
          <View style={styles.modalImageContainer}>
            <Image 
              source={{ uri: `${API_URL}/uploads/${getAvailableImages()[currentImageIndex]}` }} 
              style={styles.modalImage}
              resizeMode="contain"
            />
          </View>
          
          {/* Modal Navigation */}
          {getAvailableImages().length > 1 && (
            <>
              <TouchableOpacity style={styles.modalNavLeft} onPress={prevImage}>
                <Ionicons name="chevron-back" size={30} color={COLORS.white} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalNavRight} onPress={nextImage}>
                <Ionicons name="chevron-forward" size={30} color={COLORS.white} />
              </TouchableOpacity>
            </>
          )}
          
          {/* Modal Pagination */}
          <View style={styles.modalPagination}>
            <Text style={styles.modalPaginationText}>
              {currentImageIndex + 1} / {getAvailableImages().length}
            </Text>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: COLORS.darkGray,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: COLORS.darkGray,
    marginTop: 10,
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: isTablet ? 30 : 15,
    paddingVertical: isTablet ? 16 : 12,
    backgroundColor: '#DC2626',
  },
  backButton: {
    padding: isTablet ? 8 : 5,
  },
  headerTitle: {
    fontSize: isTablet ? 20 : isSmallScreen ? 14 : 16,
    fontWeight: '600',
    color: COLORS.white,
    flex: 1,
    textAlign: 'center',
    marginHorizontal: isTablet ? 20 : 10,
  },
  featuredBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#B91C1C',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  featuredText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: COLORS.white,
    marginLeft: 4,
  },
  imageContainer: {
    height: isTablet ? 350 : isSmallScreen ? 200 : 250,
    backgroundColor: COLORS.lightGray,
    position: 'relative',
  },
  carImage: {
    width: '100%',
    height: '100%',
  },
  favoriteButton: {
    position: 'absolute',
    top: 15,
    right: 15,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    padding: 8,
    zIndex: 3,
  },
  paginationContainer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  paginationText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '500',
  },
  statsOverlay: {
    position: 'absolute',
    bottom: isTablet ? 15 : 10,
    right: isTablet ? 15 : 10,
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.8)',
    paddingHorizontal: isTablet ? 20 : 15,
    paddingVertical: isTablet ? 12 : 10,
    borderRadius: isTablet ? 10 : 8,
    gap: isTablet ? 25 : 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    color: COLORS.white,
    fontSize: isTablet ? 16 : isSmallScreen ? 12 : 14,
    fontWeight: '600',
    marginLeft: isTablet ? 6 : 4,
  },
  expiryBar: {
    backgroundColor: '#DC2626',
    paddingVertical: 8,
    alignItems: 'center',
  },
  warningBar: {
    backgroundColor: '#F59E0B', // Orange for warning (3 days or less)
  },
  expiredBar: {
    backgroundColor: '#6B7280', // Gray for expired
  },
  expiryText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '500',
  },
  sellItForMeCard: {
    backgroundColor: COLORS.white,
    marginHorizontal: isTablet ? 30 : 15,
    marginVertical: isTablet ? 20 : 15,
    borderRadius: isTablet ? 12 : 8,
    padding: isTablet ? 20 : 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sellItForMeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sellItForMeText: {
    flex: 1,
    marginRight: 15,
  },
  sellItForMeTitle: {
    fontSize: isTablet ? 18 : 16,
    fontWeight: 'bold',
    color: COLORS.black,
    marginBottom: 8,
  },
  sellItForMeDescription: {
    fontSize: isTablet ? 14 : 12,
    color: COLORS.darkGray,
    marginBottom: 12,
    lineHeight: 20,
  },
  sellItForMeLink: {
    alignSelf: 'flex-start',
  },
  sellItForMeLinkText: {
    fontSize: isTablet ? 14 : 12,
    color: '#4A90E2',
    fontWeight: '600',
  },
  sellItForMeIllustration: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 60,
    height: 60,
    backgroundColor: '#F0F8FF',
    borderRadius: 30,
    position: 'relative',
  },
  detailsCard: {
    backgroundColor: COLORS.white,
    marginHorizontal: isTablet ? 30 : 15,
    marginBottom: isTablet ? 20 : 15,
    borderRadius: isTablet ? 12 : 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  detailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: isTablet ? 16 : 12,
    paddingHorizontal: isTablet ? 20 : 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    borderLeftWidth: 3,
    borderLeftColor: 'transparent',
  },
  detailLabel: {
    fontSize: isTablet ? 16 : isSmallScreen ? 12 : 14,
    color: COLORS.darkGray,
    fontWeight: '500',
    flex: isTablet ? 0.4 : 0.5,
  },
  detailValue: {
    fontSize: isTablet ? 16 : isSmallScreen ? 12 : 14,
    color: COLORS.black,
    fontWeight: '600',
    flex: isTablet ? 0.6 : 0.5,
    textAlign: 'right',
  },
  adIdItem: {
    borderLeftColor: '#DC2626',
    backgroundColor: '#FEF2F2',
  },
  featuresCard: {
    backgroundColor: COLORS.white,
    marginHorizontal: isTablet ? 30 : 15,
    marginBottom: isTablet ? 20 : 15,
    borderRadius: isTablet ? 12 : 8,
    padding: isTablet ? 20 : 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  featuresTitle: {
    fontSize: isTablet ? 16 : 14,
    fontWeight: 'bold',
    color: COLORS.black,
    marginBottom: 12,
  },
  featuresList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    flex: 1,
    minWidth: '45%',
  },
  featureText: {
    fontSize: isTablet ? 14 : 12,
    color: COLORS.darkGray,
    marginLeft: 6,
    flex: 1,
  },
  sellerCommentsCard: {
    backgroundColor: COLORS.white,
    marginHorizontal: isTablet ? 30 : 15,
    marginBottom: isTablet ? 20 : 15,
    borderRadius: isTablet ? 12 : 8,
    padding: isTablet ? 20 : 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sellerCommentsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sellerCommentsTitle: {
    fontSize: isTablet ? 16 : 14,
    fontWeight: 'bold',
    color: COLORS.black,
  },
  showMoreText: {
    fontSize: isTablet ? 14 : 12,
    color: '#4A90E2',
    fontWeight: '600',
  },
  sellerCommentsText: {
    fontSize: isTablet ? 14 : 12,
    color: COLORS.darkGray,
    lineHeight: 20,
    marginTop: 12,
  },
  popularCarsCard: {
    backgroundColor: COLORS.white,
    marginHorizontal: isTablet ? 30 : 15,
    marginBottom: isTablet ? 20 : 15,
    borderRadius: isTablet ? 12 : 8,
    padding: isTablet ? 20 : 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  popularCarsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  popularCarsTitle: {
    fontSize: isTablet ? 16 : 14,
    fontWeight: 'bold',
    color: COLORS.black,
  },
  viewAllText: {
    fontSize: isTablet ? 14 : 12,
    color: '#4A90E2',
    fontWeight: '600',
  },
  carsScrollView: {
    flexDirection: 'row',
  },
  carCard: {
    width: 150,
    marginRight: 15,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    overflow: 'hidden',
  },
  carCardImage: {
    width: '100%',
    height: 100,
    backgroundColor: COLORS.lightGray,
  },
  carCardTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.black,
    paddingHorizontal: 8,
    paddingTop: 8,
    paddingBottom: 4,
  },
  carCardPrice: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#CD0100',
    paddingHorizontal: 8,
    paddingBottom: 8,
  },
  loadingCarsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  loadingCarsText: {
    marginLeft: 8,
    fontSize: 14,
    color: COLORS.darkGray,
  },
  contactIconsContainer: {
    flexDirection: 'row',
    marginHorizontal: isTablet ? 30 : 15,
    marginBottom: isTablet ? 20 : 15,
    gap: isTablet ? 20 : 15,
  },
  contactButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#DC2626',
    paddingVertical: isTablet ? 18 : 15,
    paddingHorizontal: isTablet ? 25 : 20,
    borderRadius: isTablet ? 10 : 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  whatsappButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#25D366',
    paddingVertical: isTablet ? 18 : 15,
    paddingHorizontal: isTablet ? 25 : 20,
    borderRadius: isTablet ? 10 : 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  contactButtonText: {
    color: COLORS.white,
    fontSize: isTablet ? 18 : isSmallScreen ? 14 : 16,
    fontWeight: 'bold',
    marginLeft: isTablet ? 10 : 8,
  },
  // Image Gallery Styles
  imageNavLeft: {
    position: 'absolute',
    left: 15,
    top: '50%',
    transform: [{ translateY: -20 }],
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    padding: 8,
    zIndex: 10,
  },
  imageNavRight: {
    position: 'absolute',
    right: 15,
    top: '50%',
    transform: [{ translateY: -20 }],
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    padding: 8,
    zIndex: 10,
  },
  // Image Modal Styles
  imageModal: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.95)',
    zIndex: 1000,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    padding: 10,
    zIndex: 1001,
  },
  modalImageContainer: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalImage: {
    width: '100%',
    height: '80%',
    maxHeight: 600,
  },
  modalNavLeft: {
    position: 'absolute',
    left: 20,
    top: '50%',
    transform: [{ translateY: -20 }],
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 25,
    padding: 12,
    zIndex: 1001,
  },
  modalNavRight: {
    position: 'absolute',
    right: 20,
    top: '50%',
    transform: [{ translateY: -20 }],
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 25,
    padding: 12,
    zIndex: 1001,
  },
  modalPagination: {
    position: 'absolute',
    bottom: 50,
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  modalPaginationText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
  // Package Extension Styles
  packageExtensionCard: {
    backgroundColor: COLORS.white,
    marginHorizontal: isTablet ? 30 : 15,
    marginVertical: isTablet ? 20 : 15,
    borderRadius: isTablet ? 12 : 8,
    padding: isTablet ? 20 : 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.warning,
  },
  packageTitle: {
    fontSize: isTablet ? 20 : 18,
    fontWeight: 'bold',
    color: COLORS.dark,
    marginBottom: 8,
  },
  packageSubtitle: {
    fontSize: isTablet ? 14 : 12,
    color: COLORS.gray,
    marginBottom: 20,
  },
  packageOptions: {
    gap: 12,
  },
  packageOption: {
    backgroundColor: COLORS.lightGray,
    borderRadius: 8,
    padding: 15,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  recommendedPackage: {
    borderColor: COLORS.primary,
    borderWidth: 2,
    backgroundColor: COLORS.primary + '10',
  },
  packageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  packageName: {
    fontSize: isTablet ? 16 : 14,
    fontWeight: '600',
    color: COLORS.dark,
  },
  packagePrice: {
    fontSize: isTablet ? 16 : 14,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  packageDescription: {
    fontSize: isTablet ? 12 : 10,
    color: COLORS.gray,
  },
  recommendedBadge: {
    position: 'absolute',
    top: -8,
    right: 10,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  recommendedText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: 'bold',
  },
  // Pricing Information Styles
  pricingInfoCard: {
    backgroundColor: COLORS.white,
    marginHorizontal: isTablet ? 30 : 15,
    marginVertical: isTablet ? 20 : 15,
    borderRadius: isTablet ? 12 : 8,
    padding: isTablet ? 20 : 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  pricingTitle: {
    fontSize: isTablet ? 20 : 18,
    fontWeight: 'bold',
    color: COLORS.dark,
    marginBottom: 8,
  },
  pricingSubtitle: {
    fontSize: isTablet ? 14 : 12,
    color: COLORS.gray,
    marginBottom: 12,
    textAlign: 'center',
  },
  pricingAmount: {
    backgroundColor: COLORS.primary + '10',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  pricingAmountText: {
    fontSize: isTablet ? 24 : 20,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  pricingDescription: {
    fontSize: isTablet ? 12 : 10,
    color: COLORS.gray,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  purchaseButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  purchaseButtonText: {
    color: COLORS.white,
    fontSize: isTablet ? 16 : 14,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});

export default CarDetailScreen;
