import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { filterCarsSafely } from '../utils/safeFiltering';

// Test component to verify filtering works without errors
const FilterTestComponent = () => {
  const [testResults, setTestResults] = useState<string[]>([]);

  const testCars = [
    {
      _id: '1',
      make: 'Toyota',
      model: 'Corolla',
      variant: 'GLI',
      year: 2020,
      price: '2500000',
      kmDriven: '50000',
      fuelType: 'Petrol',
      transmission: 'Automatic',
      assembly: 'Local',
      bodyType: 'Sedan',
      bodyColor: 'White',
      location: 'Lahore',
      registrationCity: 'Lahore',
      engineCapacity: '1800',
      isCertified: true,
      isFeatured: 'Approved',
      isSaleItForMe: false,
    },
    {
      _id: '2',
      make: 'Honda',
      model: 'Civic',
      variant: 'VTI',
      year: 2018,
      price: '3000000',
      kmDriven: '80000',
      fuelType: 'Petrol',
      transmission: 'Manual',
      assembly: 'Imported',
      bodyType: 'Sedan',
      bodyColor: 'Black',
      location: 'Karachi',
      registrationCity: 'Karachi',
      engineCapacity: '1500',
      isCertified: false,
      isFeatured: 'Pending',
      isSaleItForMe: true,
    },
  ];

  const testFilters = {
    brands: ['Toyota'],
    models: [],
    variants: [],
    years: { min: 2019, max: 2021 },
    registrationCities: ['Lahore'],
    locations: ['Lahore'],
    bodyColors: ['White'],
    kmDriven: { min: 0, max: 60000 },
    price: { min: 2000000, max: 3000000 },
    fuelTypes: ['Petrol'],
    engineCapacity: { min: 1000, max: 2000 },
    transmissions: ['Automatic'],
    assemblies: ['Local'],
    bodyTypes: ['Sedan'],
    isCertified: true,
    isFeatured: false,
    isSaleItForMe: false,
    categories: ['Family Cars'],
  };

  const runTests = () => {
    const results: string[] = [];
    
    try {
      // Test 1: Basic filtering
      const filtered1 = filterCarsSafely(testCars, testFilters, 'Toyota');
      results.push(`✅ Basic filtering: Found ${filtered1.length} cars`);

      // Test 2: Empty filters
      const emptyFilters = {};
      const filtered2 = filterCarsSafely(testCars, emptyFilters, '');
      results.push(`✅ Empty filters: Found ${filtered2.length} cars`);

      // Test 3: Undefined filters
      const undefinedFilters = {
        brands: undefined,
        models: undefined,
        years: undefined,
        price: undefined,
      };
      const filtered3 = filterCarsSafely(testCars, undefinedFilters, '');
      results.push(`✅ Undefined filters: Found ${filtered3.length} cars`);

      // Test 4: Partial filters
      const partialFilters = {
        brands: ['Honda'],
        years: { min: 2015, max: 2020 },
      };
      const filtered4 = filterCarsSafely(testCars, partialFilters, '');
      results.push(`✅ Partial filters: Found ${filtered4.length} cars`);

      // Test 5: Category filtering
      const categoryFilters = {
        categories: ['Family Cars'],
      };
      const filtered5 = filterCarsSafely(testCars, categoryFilters, '');
      results.push(`✅ Category filters: Found ${filtered5.length} cars`);

      results.push('✅ All tests passed! No undefined errors.');
    } catch (error) {
      results.push(`❌ Error: ${error.message}`);
    }

    setTestResults(results);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Filter Test Component</Text>
      <TouchableOpacity style={styles.button} onPress={runTests}>
        <Text style={styles.buttonText}>Run Tests</Text>
      </TouchableOpacity>
      <View style={styles.results}>
        {testResults.map((result, index) => (
          <Text key={index} style={styles.resultText}>{result}</Text>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#CD0100',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  results: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
  },
  resultText: {
    marginBottom: 5,
    fontSize: 14,
  },
});

export default FilterTestComponent;
