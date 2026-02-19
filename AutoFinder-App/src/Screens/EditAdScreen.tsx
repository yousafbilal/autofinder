import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { COLORS } from '../constants/colors';
import { API_URL } from '../../config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { safeApiCall, handleApiResponse, safeIdToString } from '../utils/apiUtils';

interface AdDetails {
  _id: string;
  title?: string;
  make?: string;
  model?: string;
  year?: number;
  price?: number;
  location?: string;
  description?: string;
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
  [key: string]: any;
}

interface UserData {
  userId: string;
  [key: string]: any;
}

const EditAdScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { adId } = route.params as { adId: string | any };
  const adIdStr = (() => {
    if (!adId) return '';
    if (typeof adId === 'string') return adId.trim();
    try {
      return safeIdToString(adId);
    } catch {
      return '';
    }
  })();

  const [adDetails, setAdDetails] = useState<AdDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userData, setUserData] = useState<UserData | null>(null);

  if (!adIdStr || adIdStr === 'undefined' || adIdStr === 'null') {
    console.error('❌ Invalid adId provided:', adId);
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={60} color={COLORS.lightGray} />
          <Text style={styles.errorText}>Invalid ad ID provided</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Text style={styles.buttonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  useEffect(() => {
    fetchUserData();
    fetchAdDetails();
  }, [adIdStr]);

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

  const fetchAdDetails = async () => {
    try {
      setLoading(true);
      console.log('Fetching ad details for ID:', adIdStr);
      if (!adIdStr) {
        Alert.alert('Error', 'Invalid ad ID provided');
        navigation.goBack();
        return;
      }
      const result = await safeApiCall(`${API_URL}/all_ads/${adIdStr}`);
      
      handleApiResponse(
        result,
        (adData) => {
          console.log('Found ad data:', adData);
          setAdDetails(adData);
        },
        (error) => {
          console.error('Failed to fetch ad details:', error);
          Alert.alert('Error', 'Ad details not found');
          navigation.goBack();
        }
      );
    } catch (error) {
      console.error('Error fetching ad details:', error);
      Alert.alert('Error', 'Failed to load ad details');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!adDetails) return;
    if (!adIdStr) {
      Alert.alert('Error', 'Invalid ad ID provided');
      return;
    }
    setSaving(true);
    try {
      console.log('Saving ad with ID:', adIdStr);
      console.log('Saving ad data:', adDetails);

      // Prepare update data
      const updateData = {
        title: adDetails.title?.trim(),
        price: typeof adDetails.price === 'string' ? parseInt(adDetails.price) || 0 : adDetails.price,
        description: adDetails.description?.trim(),
        location: adDetails.location?.trim(),
        make: adDetails.make?.trim(),
        model: adDetails.model?.trim(),
        year: typeof adDetails.year === 'string' ? parseInt(adDetails.year) || 0 : adDetails.year,
        kmDriven: typeof adDetails.kmDriven === 'string' ? parseInt(adDetails.kmDriven) || 0 : adDetails.kmDriven,
        fuelType: adDetails.fuelType?.trim(),
        transmission: adDetails.transmission?.trim(),
        bodyType: adDetails.bodyType?.trim(),
        color: adDetails.color?.trim(),
        variant: adDetails.variant?.trim(),
        registrationCity: adDetails.registrationCity?.trim(),
        bodyColor: adDetails.bodyColor?.trim(),
        engineCapacity: adDetails.engineCapacity?.trim(),
        assembly: adDetails.assembly?.trim(),
        features: adDetails.features,
        preferredContact: adDetails.preferredContact?.trim(),
      };

      // Remove only truly empty values (but keep 0 for numeric fields as they might be valid)
      Object.keys(updateData).forEach(key => {
        const value = (updateData as any)[key];
        // Keep numeric fields even if 0 (they might be valid)
        const numericFields = ['price', 'year', 'kmDriven', 'mileage', 'km', 'kilometer', 'engineCapacity'];
        if (numericFields.includes(key)) {
          // Only remove if undefined, null, or NaN
          if (value === undefined || value === null || (typeof value === 'number' && isNaN(value))) {
            delete (updateData as any)[key];
          }
        } else {
          // For non-numeric fields, remove empty strings, undefined, null
          if (value === undefined || value === null || value === '') {
            delete (updateData as any)[key];
          }
        }
      });

      console.log('Prepared update data:', updateData);
      console.log('Update data keys:', Object.keys(updateData));
      console.log('Update data count:', Object.keys(updateData).length);

      // Check if we have any data to update
      if (Object.keys(updateData).length === 0) {
        Alert.alert('Error', 'No fields to update. Please fill in at least one field.');
        setSaving(false);
        return;
      }

      const result = await safeApiCall(`${API_URL}/all_ads/${adIdStr}`, {
        method: 'PUT',
        body: JSON.stringify(updateData),
      });

      handleApiResponse(
        result,
        (data) => {
          console.log('Ad updated successfully:', data);
          Alert.alert('Success', 'Ad updated successfully');
          navigation.goBack();
        },
        (error) => {
          console.error('Failed to update ad:', error);
          Alert.alert('Error', error);
        }
      );
    } catch (error: any) {
      console.error('Error saving ad:', error);
      Alert.alert('Error', `Failed to save changes: ${error.message || 'Unknown error'}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Ad',
      'Are you sure you want to delete this ad? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: confirmDelete },
      ]
    );
  };

  const confirmDelete = async () => {
    // Implement delete functionality here
    Alert.alert('Info', 'Delete functionality would be implemented here');
  };

  const updateField = (field: string, value: string | number) => {
    if (adDetails) {
      setAdDetails({ ...adDetails, [field]: value });
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading ad details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!adDetails) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={60} color={COLORS.lightGray} />
          <Text style={styles.errorText}>Ad details not found</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Text style={styles.buttonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Ad</Text>
        <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={saving}>
          {saving ? (
            <ActivityIndicator size="small" color={COLORS.white} />
          ) : (
            <Text style={styles.saveButtonText}>Save</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Basic Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Information</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Title *</Text>
            <TextInput
              style={styles.input}
              value={adDetails.title || ''}
              onChangeText={(text) => updateField('title', text)}
              placeholder="Enter car title"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Price *</Text>
            <TextInput
              style={styles.input}
              value={adDetails.price?.toString() || ''}
              onChangeText={(text) => updateField('price', text)}
              placeholder="Enter price"
              keyboardType="numeric"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Location</Text>
            <TextInput
              style={styles.input}
              value={adDetails.location || ''}
              onChangeText={(text) => updateField('location', text)}
              placeholder="Enter location"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={adDetails.description || ''}
              onChangeText={(text) => updateField('description', text)}
              placeholder="Enter description"
              multiline
              numberOfLines={4}
            />
          </View>
        </View>

        {/* Car Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Car Details</Text>
          
          <View style={styles.row}>
            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.label}>Make</Text>
              <TextInput
                style={styles.input}
                value={adDetails.make || ''}
                onChangeText={(text) => updateField('make', text)}
                placeholder="Make"
              />
            </View>

            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.label}>Model</Text>
              <TextInput
                style={styles.input}
                value={adDetails.model || ''}
                onChangeText={(text) => updateField('model', text)}
                placeholder="Model"
              />
            </View>
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.label}>Year</Text>
              <TextInput
                style={styles.input}
                value={adDetails.year?.toString() || ''}
                onChangeText={(text) => updateField('year', text)}
                placeholder="Year"
                keyboardType="numeric"
              />
            </View>

            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.label}>Mileage (km)</Text>
              <TextInput
                style={styles.input}
                value={adDetails.kmDriven?.toString() || ''}
                onChangeText={(text) => updateField('kmDriven', text)}
                placeholder="Mileage"
                keyboardType="numeric"
              />
            </View>
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.label}>Fuel Type</Text>
              <TextInput
                style={styles.input}
                value={adDetails.fuelType || ''}
                onChangeText={(text) => updateField('fuelType', text)}
                placeholder="Fuel Type"
              />
            </View>

            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.label}>Transmission</Text>
              <TextInput
                style={styles.input}
                value={adDetails.transmission || ''}
                onChangeText={(text) => updateField('transmission', text)}
                placeholder="Transmission"
              />
            </View>
          </View>
        </View>

        {/* Additional Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Additional Details</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Body Type</Text>
            <TextInput
              style={styles.input}
              value={adDetails.bodyType || ''}
              onChangeText={(text) => updateField('bodyType', text)}
              placeholder="Body Type"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Color</Text>
            <TextInput
              style={styles.input}
              value={adDetails.color || ''}
              onChangeText={(text) => updateField('color', text)}
              placeholder="Color"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Variant</Text>
            <TextInput
              style={styles.input}
              value={adDetails.variant || ''}
              onChangeText={(text) => updateField('variant', text)}
              placeholder="Variant"
            />
          </View>
        </View>
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
          <Ionicons name="trash" size={20} color={COLORS.white} />
          <Text style={styles.buttonText}>Delete Ad</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
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
    padding: 15,
    backgroundColor: COLORS.primary,
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  saveButton: {
    padding: 8,
    backgroundColor: '#4CAF50',
    borderRadius: 6,
    minWidth: 60,
    alignItems: 'center',
  },
  saveButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.black,
    marginBottom: 15,
  },
  inputGroup: {
    marginBottom: 15,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.darkGray,
    marginBottom: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: COLORS.black,
    backgroundColor: COLORS.white,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfWidth: {
    width: '48%',
  },
  actionButtons: {
    padding: 15,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF6B6B',
    padding: 15,
    borderRadius: 8,
  },
  buttonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 5,
  },
});

export default EditAdScreen;
