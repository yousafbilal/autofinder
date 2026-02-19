import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, Dimensions } from 'react-native';
import { Ionicons, FontAwesome5, MaterialIcons } from '@expo/vector-icons';
import { LinearGradient as ExpoLinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../constants/colors';

const { width } = Dimensions.get('window');

interface ModernCardProps {
  title: string;
  subtitle?: string;
  price?: string;
  image?: string;
  location?: string;
  year?: string;
  mileage?: string;
  type?: 'car' | 'bike' | 'service' | 'video' | 'blog' | 'fuel';
  badge?: string;
  isFeatured?: boolean;
  isManaged?: boolean;
  category?: string; // Add category prop
  adType?: string; // Add adType prop
  onPress?: () => void;
  gradient?: string[];
  icon?: string;
  iconType?: 'Ionicons' | 'MaterialIcons' | 'FontAwesome5';
  stats?: {
    views?: string;
    likes?: string;
    comments?: string;
  };
}

const ModernCard: React.FC<ModernCardProps> = ({
  title,
  subtitle,
  price,
  image,
  location,
  year,
  mileage,
  type = 'car',
  badge,
  isFeatured = false,
  isManaged = false,
  category,
  adType,
  onPress,
  gradient = ['#fff', '#fff'],
  icon,
  iconType = 'Ionicons',
  stats,
}) => {
  const renderIcon = (iconName: string, iconType: string, color: string, size: number = 24) => {
    switch (iconType) {
      case 'Ionicons':
        return <Ionicons name={iconName as any} size={size} color={color} />;
      case 'MaterialIcons':
        return <MaterialIcons name={iconName as any} size={size} color={color} />;
      case 'FontAwesome5':
        return <FontAwesome5 name={iconName as any} size={size} color={color} />;
      default:
        return <Ionicons name="car" size={size} color={color} />;
    }
  };

  const getCardStyle = () => {
    switch (type) {
      case 'car':
        return styles.carCard;
      case 'bike':
        return styles.bikeCard;
      case 'service':
        return styles.serviceCard;
      case 'video':
        return styles.videoCard;
      case 'blog':
        return styles.blogCard;
      case 'fuel':
        return styles.fuelCard;
      default:
        return styles.defaultCard;
    }
  };

  const getGradientColors = () => {
    if (gradient[0] !== '#fff') return gradient;
    
    switch (type) {
      case 'car':
        return ['#FF6B6B', '#FF8E8E'];
      case 'bike':
        return ['#4ECDC4', '#6ED5CD'];
      case 'service':
        return ['#45B7D1', '#6BC5D8'];
      case 'video':
        return ['#96CEB4', '#A8D5C0'];
      case 'blog':
        return ['#FFB74D', '#FFCC80'];
      case 'fuel':
        return ['#F06292', '#F48FB1'];
      default:
        return ['#fff', '#fff'];
    }
  };

  return (
    <TouchableOpacity style={[getCardStyle(), styles.card]} onPress={onPress} activeOpacity={0.8}>
      <ExpoLinearGradient
        colors={getGradientColors()}
        style={styles.cardGradient}
      >
        {/* Badge */}
        {badge && (
          <View style={[styles.badge, { backgroundColor: badge === 'HOT' ? '#FF4444' : '#00C851' }]}>
            <Text style={styles.badgeText}>{badge}</Text>
          </View>
        )}

        {/* Featured/Managed Badges - Only show for premium ads, not free ads */}
        {(() => {
          // Check if this is a free ad - NO premium tag for free ads or 525 PKR ads
          const isFreeAd = (category || '') === 'free' || 
                          (adType || '') === 'free' || 
                          (modelType === 'Free') ||
                          (packagePrice === 525) ||
                          (paymentAmount === 525);
          
          const shouldShowFeatured = isFeatured && !isFreeAd;
          return shouldShowFeatured;
        })() && (
          <View style={styles.featuredBadge}>
            <Text style={styles.featuredText}>FEATURED</Text>
          </View>
        )}
        
        {isManaged && (
          <View style={styles.managedBadge}>
            <Text style={styles.managedText}>MANAGED</Text>
          </View>
        )}

        {/* Image or Icon */}
        {image ? (
          <Image source={{ uri: image }} style={styles.cardImage} />
        ) : icon ? (
          <View style={styles.iconContainer}>
            {renderIcon(icon, iconType, COLORS.primary, 40)}
          </View>
        ) : (
          <View style={styles.defaultIconContainer}>
            <Ionicons name="car" size={40} color={COLORS.primary} />
          </View>
        )}

        {/* Content */}
        <View style={styles.cardContent}>
          <Text style={styles.cardTitle} numberOfLines={2}>
            {title}
          </Text>
          
          {subtitle && (
            <Text style={styles.cardSubtitle} numberOfLines={1}>
              {subtitle}
            </Text>
          )}

          {/* Price */}
          {price && (
            <Text style={styles.cardPrice}>
              PKR {Number(price).toLocaleString()}
            </Text>
          )}

          {/* Details */}
          {(year || mileage || location) && (
            <View style={styles.cardDetails}>
              {year && (
                <View style={styles.detailItem}>
                  <Ionicons name="calendar-outline" size={14} color="#666" />
                  <Text style={styles.detailText}>{year}</Text>
                </View>
              )}
              
              {mileage && (
                <View style={styles.detailItem}>
                  <Ionicons name="speedometer-outline" size={14} color="#666" />
                  <Text style={styles.detailText}>{mileage} km</Text>
                </View>
              )}
              
              {location && (
                <View style={styles.detailItem}>
                  <Ionicons name="location-outline" size={14} color="#666" />
                  <Text style={styles.detailText}>{location}</Text>
                </View>
              )}
            </View>
          )}

          {/* Stats */}
          {stats && (
            <View style={styles.cardStats}>
              {stats.views && (
                <View style={styles.statItem}>
                  <Ionicons name="eye-outline" size={14} color="#666" />
                  <Text style={styles.statText}>{stats.views}</Text>
                </View>
              )}
              
              {stats.likes && (
                <View style={styles.statItem}>
                  <Ionicons name="heart-outline" size={14} color="#666" />
                  <Text style={styles.statText}>{stats.likes}</Text>
                </View>
              )}
              
              {stats.comments && (
                <View style={styles.statItem}>
                  <Ionicons name="chatbubble-outline" size={14} color="#666" />
                  <Text style={styles.statText}>{stats.comments}</Text>
                </View>
              )}
            </View>
          )}
        </View>

        {/* Arrow */}
        <View style={styles.arrowContainer}>
          <Ionicons name="arrow-forward" size={16} color="#999" />
        </View>
      </ExpoLinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 8,
    marginVertical: 4,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cardGradient: {
    padding: 16,
    minHeight: 120,
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: 12,
    right: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 1,
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  featuredBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: '#FFD700',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 1,
  },
  featuredText: {
    color: '#000',
    fontSize: 10,
    fontWeight: 'bold',
  },
  managedBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 1,
  },
  managedText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  cardImage: {
    width: '100%',
    height: 120,
    borderRadius: 12,
    marginBottom: 12,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    alignSelf: 'center',
  },
  defaultIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(205, 1, 0, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    alignSelf: 'center',
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.black,
    marginBottom: 4,
    lineHeight: 20,
  },
  cardSubtitle: {
    fontSize: 14,
    color: COLORS.darkGray,
    marginBottom: 8,
  },
  cardPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 8,
  },
  cardDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
    marginBottom: 4,
  },
  detailText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  cardStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  arrowContainer: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Card type specific styles
  carCard: {
    width: width * 0.8,
  },
  bikeCard: {
    width: width * 0.7,
  },
  serviceCard: {
    width: width * 0.6,
  },
  videoCard: {
    width: width * 0.75,
  },
  blogCard: {
    width: width * 0.8,
  },
  fuelCard: {
    width: width * 0.5,
  },
  defaultCard: {
    width: width * 0.7,
  },
});

export default ModernCard;
