/**
 * TEST COMPONENT - Add to Home.tsx temporarily to verify icons work
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export const TestIcon = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Icon Test</Text>
      
      <View style={styles.row}>
        <Ionicons name="home" size={40} color="#CD0100" />
        <Text>Home Icon</Text>
      </View>
      
      <View style={styles.row}>
        <Ionicons name="car-sport-outline" size={40} color="#CD0100" />
        <Text>Car Icon</Text>
      </View>
      
      <View style={styles.row}>
        <Ionicons name="search-outline" size={40} color="#CD0100" />
        <Text>Search Icon</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#fff',
    margin: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    gap: 15,
  },
});









