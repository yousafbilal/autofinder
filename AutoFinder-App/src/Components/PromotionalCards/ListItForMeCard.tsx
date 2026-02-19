import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/colors';
import { useNavigation } from '@react-navigation/native';

const ListItForMeCard = () => {
  const navigation = useNavigation<any>();

  const handlePress = () => {
    // Navigate to List it for me screen
    navigation.navigate('ListItForYouScreen' as never);
  };

  return (
    <TouchableOpacity style={styles.container} onPress={handlePress} activeOpacity={0.9}>
      <View style={styles.content}>
        <View style={styles.textContainer}>
          <Text style={styles.title}>List it for You</Text>
          <Text style={styles.description}>
            Let us handle the listing process. We'll create and manage your ad professionally
          </Text>
          <View style={styles.badgeContainer}>
            <Ionicons name="star" size={16} color={COLORS.white} />
            <Text style={styles.badgeText}>Professional Service</Text>
          </View>
        </View>
        <View style={styles.iconContainer}>
          <Ionicons name="car-sport-outline" size={60} color={COLORS.primary} />
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
    borderLeftColor: '#FFD700',
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
    backgroundColor: '#FFD700',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  badgeText: {
    color: COLORS.black,
    fontSize: 12,
    fontWeight: '600',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFD700' + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ListItForMeCard;

