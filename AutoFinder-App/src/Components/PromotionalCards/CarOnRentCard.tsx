import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/colors';
import { useNavigation } from '@react-navigation/native';

const CarOnRentCard = () => {
  const navigation = useNavigation<any>();

  const handlePress = () => {
    // Navigate to Create Rental Car Ad screen
    navigation.navigate('RentServiceAd' as never);
  };

  return (
    <TouchableOpacity style={styles.container} onPress={handlePress} activeOpacity={0.9}>
      <View style={styles.content}>
        <View style={styles.textContainer}>
          <Text style={styles.title}>Car on Rent</Text>
          <Text style={styles.description}>
            Need a car for a day or longer? Browse our wide selection of rental cars available for rent
          </Text>
          <View style={styles.badgeContainer}>
            <Ionicons name="calendar" size={16} color={COLORS.white} />
            <Text style={styles.badgeText}>Flexible Rental</Text>
          </View>
        </View>
        <View style={styles.iconContainer}>
          <Ionicons name="car-sport" size={60} color={COLORS.primary} />
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.white,
    marginHorizontal: 10,
    marginVertical: 8,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  textContainer: {
    flex: 1,
    marginRight: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.black,
    marginBottom: 8,
  },
  description: {
    fontSize: 13,
    color: COLORS.darkGray,
    lineHeight: 18,
    marginBottom: 12,
  },
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  badgeText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '600',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#4CAF50' + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default CarOnRentCard;

