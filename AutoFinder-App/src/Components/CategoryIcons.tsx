import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../constants/colors';
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');
const cardWidth = (width - 48) / 2; // 2 cards per row with margins

const CategoryIcons = () => {
  const navigation = useNavigation<any>();

  const usedCarIcon = require('../../assets/usedcaricon/usedcaricon.png');
  const usedBikeIcon = require('../../assets/usedbikes/usedbikes.png');
  const carOnRentIcon = require('../../assets/Car on  rent/caronrent.png');

  const categories = [
    {
      id: 'used-cars',
      icon: 'car-outline',
      label: 'Used Cars',
      color: COLORS.primary,
      image: usedCarIcon,
      onPress: () => {
        console.log('🚗 Navigating to Used Cars List...');
        navigation.navigate('CarListScreen', { 
          category: 'used-cars',
          title: 'Used Cars'
        });
      }
    },
    {
      id: 'used-bikes',
      icon: 'bicycle-outline',
      label: 'Used Bikes',
      color: COLORS.primary,
      image: usedBikeIcon,
      onPress: () => {
        console.log('🚲 Navigating to Used Bikes List...');
        navigation.navigate('BikeListScreen', { 
          category: 'used-bikes',
          title: 'Used Bikes'
        });
      }
    },
    {
      id: 'car-rent',
      icon: 'car-outline',
      label: 'Car on Rent',
      color: COLORS.primary,
      image: carOnRentIcon,
      onPress: () => {
        console.log('🚙 Navigating to Car Rental List...');
        navigation.navigate('RentalCarListScreen', { 
          category: 'car-rent',
          title: 'Car on Rent'
        });
      }
    },
    {
      id: 'autostore',
      icon: 'cart-outline',
      label: 'AutoStore',
      color: COLORS.primary,
      image: require('../../assets/Autostore/autostore.png'),
      onPress: () => {
        console.log('🏪 Navigating to AutoStore List...');
        navigation.navigate('AutoPartsListScreen', { 
          category: 'autostore',
          title: 'AutoStore'
        });
      }
    }
  ];

  return (
    <View style={styles.container}>
      <View style={styles.grid}>
        {categories.map((category, index) => {
          const gradients = [
            ['#ffffff', '#f5f7ff'],
            ['#ffffff', '#fbf5ff'],
            ['#ffffff', '#f5fffb'],
            ['#ffffff', '#fff7f5'],
          ];
          const gradientColors = gradients[index % gradients.length];

          return (
            <TouchableOpacity
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
              style={styles.categoryCard}
              onPress={category.onPress}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={gradientColors}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.gradientBackground}
              >
                <View style={styles.cardContent}>
                  <View style={styles.iconContainer}>
                    {category.image ? (
                      <Image
                        source={category.image}
                        style={category.id === 'car-rent' ? styles.iconImageLarge : styles.iconImage}
                        resizeMode="contain"
                      />
                    ) : (
                      <Ionicons
                        name={category.icon as any}
                        size={34}
                        color={COLORS.primary}
                        style={{ opacity: 1 }}
                      />
                    )}
                  </View>
                  <Text style={styles.categoryLabel}>{category.label}</Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 20,
    marginTop: 0,
    backgroundColor: '#fff',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  categoryCard: {
    width: cardWidth,
    height: 120,
    borderRadius: 18,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.16,
    shadowRadius: 10,
    elevation: 6,
    overflow: 'visible',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#f1f1f1',
  },
  gradientBackground: {
    flex: 1,
    borderRadius: 18,
  },
  cardContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
  },
  iconContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  iconImage: {
    width: 88,
    height: 88,
  },
  iconImageLarge: {
    width: 104,
    height: 104,
  },
  categoryLabel: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.4,
    color: '#202124',
    textAlign: 'center',
    textTransform: 'capitalize',
    lineHeight: 20,
  },
});

export default CategoryIcons;
