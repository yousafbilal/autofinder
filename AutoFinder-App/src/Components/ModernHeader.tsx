import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions,
  Image,
  Animated,
  StatusBar,
  Platform,
  TextInput,
} from "react-native";
import { Ionicons, MaterialIcons, FontAwesome5, AntDesign } from "@expo/vector-icons";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../../navigationTypes";
import { COLORS } from "../constants/colors";
import { LinearGradient as ExpoLinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_URL } from "../../config";

const { width } = Dimensions.get("window");

type NavigationProp = StackNavigationProp<RootStackParamList>;

interface CategoryItem {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  iconType: "Ionicons" | "MaterialIcons" | "FontAwesome5" | "AntDesign";
  color: string;
  gradient: string[];
  route: keyof RootStackParamList;
  count?: string;
  badge?: string;
  isNew?: boolean;
  discount?: string;
}

const categories: CategoryItem[] = [
  {
    id: "used-cars",
    title: "Used Cars",
    subtitle: "Find your dream car",
    icon: "car-sport",
    iconType: "Ionicons",
    color: "#FF6B6B",
    gradient: ["#FF6B6B", "#FF8E8E"],
    route: "CarListScreen",
    count: "2.5K+",
    badge: "HOT",
    isNew: false,
  },
  {
    id: "used-bikes",
    title: "Used Bikes",
    subtitle: "Ride in style",
    icon: "motorcycle",
    iconType: "MaterialIcons",
    color: "#4ECDC4",
    gradient: ["#4ECDC4", "#6ED5CD"],
    route: "BikeListScreen",
    count: "1.8K+",
    isNew: true,
  },
  {
    id: "car-rent",
    title: "Car on Rent",
    subtitle: "Rent for any occasion",
    icon: "car-rental",
    iconType: "MaterialIcons",
    color: "#45B7D1",
    gradient: ["#45B7D1", "#6BC5D8"],
    route: "RentalCarListScreen",
    count: "500+",
    discount: "20% OFF",
  },
  {
    id: "auto-parts",
    title: "Auto Parts",
    subtitle: "Quality spare parts",
    icon: "tools",
    iconType: "Ionicons",
    color: "#96CEB4",
    gradient: ["#96CEB4", "#A8D5C0"],
    route: "AutoPartsListScreen",
    count: "3.2K+",
    badge: "NEW",
  },
];

const ModernHeader = () => {
  const navigation = useNavigation<NavigationProp>();
  const [selectedCategory, setSelectedCategory] = useState<string>("used-cars");
  const [currentTime, setCurrentTime] = useState(new Date());
  const [userProfileImage, setUserProfileImage] = useState<string | null>(null);
  
  // Animation values
  const fadeAnim = new Animated.Value(0);
  const slideAnim = new Animated.Value(50);
  const scaleAnim = new Animated.Value(0.9);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Entrance animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();

    // Shimmer animation for search bar
    const shimmerAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    );
    shimmerAnimation.start();

    // Pulse animation for notification badge
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    pulseAnimation.start();

    // Update time every minute
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => {
      shimmerAnimation.stop();
      pulseAnimation.stop();
      clearInterval(timeInterval);
    };
  }, []);

  // Load user profile image - refresh when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      const loadUserProfile = async () => {
        try {
          const storedUserData = await AsyncStorage.getItem('user');
          if (storedUserData) {
            const parsedData = JSON.parse(storedUserData);
            
            // Construct proper image URL
            if (parsedData.profileImage) {
              let imageUrl = null;
              if (parsedData.profileImage.startsWith('http')) {
                imageUrl = parsedData.profileImage;
              } else if (parsedData.profileImage.startsWith('/uploads/')) {
                imageUrl = `${API_URL}${parsedData.profileImage}`;
              } else {
                imageUrl = `${API_URL}/uploads/profile_pics/${parsedData.profileImage}`;
              }
              setUserProfileImage(imageUrl);
            } else {
              setUserProfileImage(null);
            }
          }
        } catch (error) {
          console.error("Error loading user profile in header:", error);
        }
      };

      loadUserProfile();
    }, [])
  );

  const handleCategoryPress = (category: CategoryItem) => {
    setSelectedCategory(category.id);
    
    // Add haptic feedback animation
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    // Navigate after animation
    setTimeout(() => {
      navigation.navigate(category.route as any);
    }, 200);
  };

  const renderIcon = (icon: string, iconType: string, color: string, size: number = 24) => {
    switch (iconType) {
      case "Ionicons":
        return <SafeIonicons name={icon as any} size={size} color={color} />;
      case "MaterialIcons":
        return <SafeMaterialIcons name={icon as any} size={size} color={color} />;
      case "FontAwesome5":
        return <SafeFontAwesome5 name={icon as any} size={size} color={color} />;
      case "AntDesign":
        return <SafeAntDesign name={icon as any} size={size} color={color} />;
      default:
        return <SafeIonicons name="car" size={size} color={color} />;
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  return (
    <Animated.View 
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [
            { translateY: slideAnim },
            { scale: scaleAnim }
          ]
        }
      ]}
    >
      {/* Status Bar */}
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      {/* Top Header */}
      <Animated.View style={styles.topHeader}>
        <View style={styles.logoContainer}>
          <View style={styles.logoWrapper}>
            <View style={styles.logoIcon}>
              <Ionicons name="car-sport" size={24} color={COLORS.primary} />
            </View>
            <View>
              <Text style={styles.logoText}>AutoFinder</Text>
              <Text style={styles.tagline}>Find Your Perfect Vehicle</Text>
            </View>
          </View>
          <View style={styles.timeContainer}>
            <Ionicons name="time-outline" size={14} color="#666" />
            <Text style={styles.timeText}>{formatTime(currentTime)}</Text>
          </View>
        </View>
        
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.actionButton}>
            <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
              <Ionicons name="notifications-outline" size={22} color={COLORS.primary} />
              <View style={styles.notificationBadge}>
                <Text style={styles.badgeText}>3</Text>
              </View>
            </Animated.View>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="heart-outline" size={22} color={COLORS.primary} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => navigation.navigate('Profile' as any)}
          >
            {userProfileImage ? (
              <Image 
                source={{ uri: userProfileImage }}
                style={styles.profileAvatarImage}
              />
            ) : (
              <View style={styles.profileAvatar}>
                <Ionicons name="person" size={16} color="#fff" />
              </View>
            )}
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <View style={styles.searchIconContainer}>
            <Ionicons name="apps" size={Platform.OS === 'android' ? 48 : 24} color={COLORS.primary} />
          </View>
          <TextInput
            placeholder="Search for classifieds"
            style={styles.searchInput}
            placeholderTextColor="#999"
          />
          <TouchableOpacity style={styles.bellButton}>
            <Ionicons name="notifications-outline" size={Platform.OS === 'android' ? 46 : 22} color={COLORS.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Category Cards */}
      <View style={styles.categoriesContainer}>
        <Text style={styles.categoriesTitle}>Browse Categories</Text>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesScroll}
        >
          {categories.map((category, index) => (
            <Animated.View
              key={(() => {
                try {
                  if (category.id) {
                    if (typeof category.id === 'string') return category.id;
                    if (typeof category.id === 'number') return `category-${category.id}`;
                    if (typeof category.id === 'object' && category.id.toString) return String(category.id.toString());
                  }
                  return `category-${index}`;
                } catch (error) {
                  return `category-${index}-${Date.now()}`;
                }
              })()}
              style={{
                transform: [{
                  translateX: slideAnim.interpolate({
                    inputRange: [0, 50],
                    outputRange: [0, 50 + (index * 20)],
                  })
                }]
              }}
            >
              <TouchableOpacity
                style={[
                  styles.categoryCard,
                  selectedCategory === category.id && styles.selectedCategoryCard
                ]}
                onPress={() => handleCategoryPress(category)}
                activeOpacity={0.8}
              >
              <ExpoLinearGradient
                colors={selectedCategory === category.id ? category.gradient as any : ['#fff', '#fff'] as any}
                style={styles.categoryGradient}
              >
                {/* Badge */}
                {category.badge && (
                  <View style={[
                    styles.categoryBadge,
                    { backgroundColor: category.badge === 'HOT' ? '#FF4444' : '#00C851' }
                  ]}>
                    <Text style={styles.badgeText}>{category.badge}</Text>
                  </View>
                )}
                
                {/* New Indicator */}
                {category.isNew && (
                  <View style={styles.newIndicator}>
                    <Text style={styles.newText}>NEW</Text>
                  </View>
                )}
                
                {/* Discount Badge */}
                {category.discount && (
                  <View style={styles.discountBadge}>
                    <Text style={styles.discountText}>{category.discount}</Text>
                  </View>
                )}

                <View style={styles.categoryIconContainer}>
                  {renderIcon(
                    category.icon,
                    category.iconType,
                    selectedCategory === category.id ? '#fff' : category.color,
                    28
                  )}
                </View>
                
                <View style={styles.categoryContent}>
                  <Text style={[
                    styles.categoryTitle,
                    selectedCategory === category.id && styles.selectedCategoryTitle
                  ]}>
                    {category.title}
                  </Text>
                  <Text style={[
                    styles.categorySubtitle,
                    selectedCategory === category.id && styles.selectedCategorySubtitle
                  ]}>
                    {category.subtitle}
                  </Text>
                  
                  <View style={styles.categoryFooter}>
                    <View style={styles.countContainer}>
                      <Text style={[
                        styles.categoryCount,
                        selectedCategory === category.id && styles.selectedCategoryCount
                      ]}>
                        {category.count}
                      </Text>
                      <Text style={[
                        styles.countLabel,
                        selectedCategory === category.id && styles.selectedCountLabel
                      ]}>
                        listings
                      </Text>
                    </View>
                  </View>
                </View>
              </ExpoLinearGradient>
              </TouchableOpacity>
            </Animated.View>
          ))}
        </ScrollView>
      </View>

      {/* Quick Stats */}
      <ExpoLinearGradient
        colors={['#F8F9FA', '#E9ECEF'] as any}
        style={styles.statsContainer}
      >
        <View style={styles.statItem}>
          <View style={styles.statIconContainer}>
            <Ionicons name="car-outline" size={20} color={COLORS.primary} />
          </View>
          <Text style={styles.statNumber}>50K+</Text>
          <Text style={styles.statLabel}>Active Listings</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <View style={styles.statIconContainer}>
            <Ionicons name="people-outline" size={20} color={COLORS.primary} />
          </View>
          <Text style={styles.statNumber}>25K+</Text>
          <Text style={styles.statLabel}>Happy Customers</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <View style={styles.statIconContainer}>
            <Ionicons name="location-outline" size={20} color={COLORS.primary} />
          </View>
          <Text style={styles.statNumber}>100+</Text>
          <Text style={styles.statLabel}>Cities</Text>
        </View>
      </ExpoLinearGradient>

      {/* Weather & Location Info */}
      <View style={styles.weatherContainer}>
        <View style={styles.weatherInfo}>
          <Ionicons name="partly-sunny-outline" size={18} color="#FFA726" />
          <Text style={styles.weatherText}>28°C, Sunny</Text>
        </View>
        <View style={styles.locationInfo}>
          <Ionicons name="location-outline" size={16} color="#666" />
          <Text style={styles.locationText}>Karachi, Pakistan</Text>
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 8 : 16,
    paddingBottom: 20,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  logoContainer: {
    flex: 1,
  },
  logoWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(205, 1, 0, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  logoText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: -2,
  },
  tagline: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  timeText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
    fontWeight: '500',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    padding: 8,
    marginLeft: 4,
    position: 'relative',
  },
  profileAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileAvatarImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  notificationBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#FF4444',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  searchContainer: {
    marginBottom: 20,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5', // Light grey background like reference
    borderRadius: Platform.OS === 'android' ? 30 : 20,
    paddingHorizontal: Platform.OS === 'android' ? 32 : 18,
    paddingVertical: Platform.OS === 'android' ? 100 : 32, // Much larger on Android
    minHeight: Platform.OS === 'android' ? 120 : 68, // Much larger minimum height on Android
    borderWidth: 0, // No border like reference
    
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  searchIconContainer: {
    padding: Platform.OS === 'android' ? 16 : 4,
  },
  searchInput: {
    flex: 1,
    marginLeft: Platform.OS === 'android' ? 24 : 12,
    fontSize: Platform.OS === 'android' ? 28 : 18, // Much larger font on Android
    color: '#333',
    paddingVertical: Platform.OS === 'android' ? 16 : 4,
  },
  bellButton: {
    padding: Platform.OS === 'android' ? 18 : 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickSearchContainer: {
    marginTop: 12,
  },
  quickSearchItem: {
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  quickSearchText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  categoriesContainer: {
    marginBottom: 20,
  },
  categoriesTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.black,
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  categoriesScroll: {
    paddingHorizontal: 4,
  },
  categoryCard: {
    width: width * 0.7,
    marginRight: 12,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  selectedCategoryCard: {
    transform: [{ scale: 1.05 }],
  },
  categoryGradient: {
    padding: 20,
    minHeight: 140,
    position: 'relative',
  },
  categoryBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 1,
  },
  newIndicator: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: '#00C851',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    zIndex: 1,
  },
  newText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  discountBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#FF9800',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 1,
  },
  discountText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  categoryIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryContent: {
    flex: 1,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.black,
    marginBottom: 4,
  },
  selectedCategoryTitle: {
    color: '#fff',
  },
  categorySubtitle: {
    fontSize: 14,
    color: COLORS.darkGray,
    marginBottom: 8,
  },
  selectedCategorySubtitle: {
    color: 'rgba(255,255,255,0.8)',
  },
  categoryFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  countContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  categoryCount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  selectedCategoryCount: {
    color: '#fff',
  },
  countLabel: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  selectedCountLabel: {
    color: 'rgba(255,255,255,0.8)',
  },
  arrowContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(205, 1, 0, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedArrowContainer: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    borderRadius: 15,
    paddingVertical: 20,
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(205, 1, 0, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statNumber: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    fontWeight: '500',
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#E9ECEF',
  },
  weatherContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  weatherInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  weatherText: {
    fontSize: 14,
    color: '#333',
    marginLeft: 6,
    fontWeight: '500',
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
    fontWeight: '500',
  },
});

export default ModernHeader;