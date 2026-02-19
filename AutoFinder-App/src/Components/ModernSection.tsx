import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient as ExpoLinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../constants/colors';
import ModernCard from './ModernCard';

const { width } = Dimensions.get('window');

interface ModernSectionProps {
  title: string;
  subtitle?: string;
  data: any[];
  type: 'car' | 'bike' | 'service' | 'video' | 'blog' | 'fuel';
  onViewAll?: () => void;
  showViewAll?: boolean;
  horizontal?: boolean;
  numColumns?: number;
  gradient?: string[];
  icon?: string;
  iconType?: 'Ionicons' | 'MaterialIcons' | 'FontAwesome5';
}

const ModernSection: React.FC<ModernSectionProps> = ({
  title,
  subtitle,
  data,
  type,
  onViewAll,
  showViewAll = true,
  horizontal = true,
  numColumns = 1,
  gradient,
  icon,
  iconType = 'Ionicons',
}) => {
  const getSectionIcon = () => {
    switch (type) {
      case 'car':
        return 'car-sport';
      case 'bike':
        return 'bicycle';
      case 'service':
        return 'construct';
      case 'video':
        return 'play-circle';
      case 'blog':
        return 'newspaper';
      case 'fuel':
        return 'flash';
      default:
        return 'grid';
    }
  };

  const getGradientColors = () => {
    if (gradient) return gradient;
    
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
        return [COLORS.primary, COLORS.primary];
    }
  };

  const getItemKey = (item: any, index: number): string => {
    // Ensure we always return a string key, never an object
    try {
      if (item.id) {
        if (typeof item.id === 'string') return item.id;
        if (typeof item.id === 'number') return `id-${item.id}`;
        if (typeof item.id === 'object') {
          if (item.id.toString && typeof item.id.toString === 'function') {
            const str = String(item.id.toString());
            if (str !== '[object Object]') return str;
            if (item.id._id) return String(item.id._id);
            if (item.id.$oid) return String(item.id.$oid);
          }
        }
      }
      if (item._id) {
        if (typeof item._id === 'string') return item._id;
        if (typeof item._id === 'number') return `_id-${item._id}`;
        if (typeof item._id === 'object') {
          // Handle MongoDB ObjectId or similar objects
          if (item._id.toString && typeof item._id.toString === 'function') {
            const str = String(item._id.toString());
            if (str !== '[object Object]') return str;
            if (item._id._id) return String(item._id._id);
            if (item._id.$oid) return String(item._id.$oid);
          }
          if (item._id.$oid) return String(item._id.$oid);
        }
      }
      // Fallback to combination of unique fields
      const uniqueId = item.title || item.name || item.model || item.brand || item.type || item.make || '';
      return uniqueId ? `${uniqueId}-${index}` : `item-${index}`;
    } catch (error) {
      // Ultimate fallback - always return a string
      return `item-${index}-${Date.now()}`;
    }
  };

  const renderItem = (item: any, index: number) => {
    const cardProps = {
      title: item.title || item.name || item.model || item.brand,
      subtitle: item.subtitle || item.description || item.location,
      price: item.price,
      image: item.image || item.thumbnail,
      location: item.location || item.city,
      year: item.year,
      mileage: (() => {
        const mileage = item.kmDriven || 
                        item.mileage || 
                        item.km || 
                        item.kilometer ||
                        item.traveled ||
                        item.distance ||
                        item.odometer;
        
        // Handle number or string
        if (mileage !== null && mileage !== undefined && mileage !== '') {
          const mileageNum = typeof mileage === 'string' ? parseFloat(mileage) : mileage;
          if (!isNaN(mileageNum) && mileageNum > 0) {
            return mileageNum.toString();
          }
        }
        return undefined;
      })(),
      type,
      badge: item.badge,
      isFeatured: item.isFeatured,
      isManaged: item.isManaged,
      gradient: getGradientColors(),
      icon: icon || getSectionIcon(),
      iconType,
      stats: {
        views: item.views,
        likes: item.likes,
        comments: item.comments,
      },
    };

    return (
      <ModernCard
        {...cardProps}
        onPress={() => {
          // Handle navigation based on type
          console.log('Navigate to:', type, item);
        }}
      />
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <View style={styles.iconContainer}>
            <Ionicons 
              name={icon as any || getSectionIcon() as any} 
              size={24} 
              color={COLORS.primary} 
            />
          </View>
          <View style={styles.textContainer}>
            <Text style={styles.title}>{title}</Text>
            {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
          </View>
        </View>
        
        {showViewAll && (
          <TouchableOpacity style={styles.viewAllButton} onPress={onViewAll}>
            <Text style={styles.viewAllText}>View All</Text>
            <Ionicons name="arrow-forward" size={16} color={COLORS.primary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Content */}
      {horizontal ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalScroll}
        >
          {data.map((item, index) => {
            const itemKey = getItemKey(item, index);
            return (
              <React.Fragment key={itemKey}>
                {renderItem(item, index)}
              </React.Fragment>
            );
          })}
        </ScrollView>
      ) : (
        <View style={[styles.gridContainer, { flexDirection: 'row', flexWrap: 'wrap' }]}>
          {data.map((item, index) => {
            const itemKey = getItemKey(item, index);
            return (
              <View 
                key={itemKey} 
                style={[styles.gridItem, { width: width / numColumns - 32 }]}
              >
                {renderItem(item, index)}
              </View>
            );
          })}
        </View>
      )}

      {/* Bottom Gradient */}
      <ExpoLinearGradient
        colors={['transparent', 'rgba(0,0,0,0.05)']}
        style={styles.bottomGradient}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(205, 1, 0, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.black,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.darkGray,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(205, 1, 0, 0.1)',
  },
  viewAllText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '600',
    marginRight: 4,
  },
  horizontalScroll: {
    paddingHorizontal: 4,
  },
  gridContainer: {
    paddingHorizontal: 4,
  },
  gridItem: {
    marginBottom: 16,
  },
  bottomGradient: {
    height: 20,
    marginTop: 8,
    borderRadius: 10,
  },
});

export default ModernSection;
