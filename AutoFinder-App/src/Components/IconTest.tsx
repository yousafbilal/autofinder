import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Test component to verify icons are working
export const IconTest = () => {
  return (
    <View style={{ padding: 20, backgroundColor: '#fff', margin: 10 }}>
      <Text>Icon Test:</Text>
      <Ionicons name="home" size={30} color="red" />
      <Ionicons name="search-outline" size={30} color="blue" />
      <Ionicons name="notifications-outline" size={30} color="green" />
      <Ionicons name="car-sport-outline" size={30} color="purple" />
    </View>
  );
};









