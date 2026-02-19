import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  FlatList,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';
import { pakistaniCities, pakistaniLocations } from './EnhancedDropdownData';

interface EnhancedLocationPickerProps {
  selectedCity: string;
  selectedLocation: string;
  onCityChange: (city: string) => void;
  onLocationChange: (location: string) => void;
  required?: boolean;
  title?: string;
}

const EnhancedLocationPicker: React.FC<EnhancedLocationPickerProps> = ({
  selectedCity,
  selectedLocation,
  onCityChange,
  onLocationChange,
  required = false,
  title = "Location",
}) => {
  const [showCityModal, setShowCityModal] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [citySearchQuery, setCitySearchQuery] = useState('');
  const [locationSearchQuery, setLocationSearchQuery] = useState('');
  
  // Refs for direct TextInput control
  const citySearchRef = useRef<TextInput>(null);
  const locationSearchRef = useRef<TextInput>(null);

  // Clear search queries when modals are closed
  React.useEffect(() => {
    if (!showCityModal) {
      setCitySearchQuery('');
    }
  }, [showCityModal]);

  React.useEffect(() => {
    if (!showLocationModal) {
      setLocationSearchQuery('');
    }
  }, [showLocationModal]);

  // Functions to open modals
  const openCityModal = () => {
    setShowCityModal(true);
  };

  const openLocationModal = () => {
    setShowLocationModal(true);
  };


  const filteredCities = citySearchQuery.trim() === '' 
    ? pakistaniCities 
    : pakistaniCities.filter(city =>
        city.toLowerCase().includes(citySearchQuery.toLowerCase())
      );

  const filteredLocations = selectedCity
    ? (locationSearchQuery.trim() === '' 
        ? (pakistaniLocations[selectedCity] || [])
        : (pakistaniLocations[selectedCity] || []).filter(location =>
            location.toLowerCase().includes(locationSearchQuery.toLowerCase())
          )
      )
    : [];

  const handleCitySelect = (city: string) => {
    onCityChange(city);
    onLocationChange(''); // Reset location when city changes
    setShowCityModal(false);
  };

  const handleLocationSelect = (location: string) => {
    onLocationChange(location);
    setShowLocationModal(false);
  };

  const renderCityItem = ({ item }: { item: string }) => (
    <TouchableOpacity
      style={[
        styles.listItem,
        selectedCity === item && styles.selectedItem,
      ]}
      onPress={() => handleCitySelect(item)}
    >
      <Text
        style={[
          styles.listItemText,
          selectedCity === item && styles.selectedItemText,
        ]}
      >
        {item}
      </Text>
      {selectedCity === item && (
        <Ionicons name="checkmark" size={20} color={COLORS.primary} />
      )}
    </TouchableOpacity>
  );

  const renderLocationItem = ({ item }: { item: string }) => (
    <TouchableOpacity
      style={[
        styles.listItem,
        selectedLocation === item && styles.selectedItem,
      ]}
      onPress={() => handleLocationSelect(item)}
    >
      <Text
        style={[
          styles.listItemText,
          selectedLocation === item && styles.selectedItemText,
        ]}
      >
        {item}
      </Text>
      {selectedLocation === item && (
        <Ionicons name="checkmark" size={20} color={COLORS.primary} />
      )}
    </TouchableOpacity>
  );

  const CityModal = () => (
    <Modal
      visible={showCityModal}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => {
              setShowCityModal(false);
            }}
          >
            <Ionicons name="close" size={24} color={COLORS.black} />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Select City ({pakistaniCities.length} cities)</Text>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={COLORS.gray} />
          <TextInput
            ref={citySearchRef}
            style={styles.searchInput}
            placeholder="Search cities (optional)..."
            value={citySearchQuery}
            onChangeText={setCitySearchQuery}
            placeholderTextColor={COLORS.gray}
            autoFocus={false}
          />
        </View>

        <FlatList
          data={filteredCities}
          renderItem={renderCityItem}
          keyExtractor={(item) => item}
          style={styles.list}
          showsVerticalScrollIndicator={false}
        />
      </View>
    </Modal>
  );

  const LocationModal = () => (
    <Modal
      visible={showLocationModal}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => {
              setShowLocationModal(false);
            }}
          >
            <Ionicons name="close" size={24} color={COLORS.black} />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>
            Select Area in {selectedCity} ({pakistaniLocations[selectedCity]?.length || 0} areas)
          </Text>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={COLORS.gray} />
          <TextInput
            ref={locationSearchRef}
            style={styles.searchInput}
            placeholder="Search areas (optional)..."
            value={locationSearchQuery}
            onChangeText={setLocationSearchQuery}
            placeholderTextColor={COLORS.gray}
            autoFocus={false}
          />
        </View>

        <FlatList
          data={filteredLocations}
          renderItem={renderLocationItem}
          keyExtractor={(item) => item}
          style={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                {selectedCity 
                  ? (locationSearchQuery.trim() === '' 
                      ? 'No areas available for this city' 
                      : 'No areas found matching your search')
                  : 'Please select a city first'
                }
              </Text>
            </View>
          }
        />
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        {title} {required && <Text style={styles.required}>*</Text>}
      </Text>

      <View style={styles.pickerContainer}>
        <TouchableOpacity
          style={[
            styles.picker,
            !selectedCity && styles.pickerError,
          ]}
          onPress={openCityModal}
        >
          <View style={styles.pickerContent}>
            <Ionicons name="location-outline" size={20} color={COLORS.primary} />
            <Text style={[
              styles.pickerText,
              !selectedCity && styles.placeholderText,
            ]}>
              {selectedCity || 'Select City'}
            </Text>
          </View>
          <Ionicons name="chevron-down" size={20} color={COLORS.gray} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.picker,
            !selectedLocation && selectedCity && styles.pickerError,
          ]}
          onPress={() => {
            if (selectedCity) {
              openLocationModal();
            } else {
              Alert.alert('Select City First', 'Please select a city before choosing an area.');
            }
          }}
          disabled={!selectedCity}
        >
          <View style={styles.pickerContent}>
            <Ionicons name="map-outline" size={20} color={COLORS.primary} />
            <Text style={[
              styles.pickerText,
              !selectedLocation && styles.placeholderText,
            ]}>
              {selectedLocation || 'Select Area'}
            </Text>
          </View>
          <Ionicons name="chevron-down" size={20} color={COLORS.gray} />
        </TouchableOpacity>
      </View>

      {selectedCity && selectedLocation && (
        <View style={styles.selectedLocationContainer}>
          <Ionicons name="checkmark-circle" size={16} color={COLORS.primary} />
          <Text style={styles.selectedLocationText}>
            {selectedLocation}, {selectedCity}
          </Text>
        </View>
      )}

      <CityModal />
      <LocationModal />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.black,
    marginBottom: 8,
  },
  required: {
    color: COLORS.primary,
  },
  pickerContainer: {
    gap: 10,
  },
  picker: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    backgroundColor: COLORS.white,
  },
  pickerError: {
    borderColor: COLORS.primary,
  },
  pickerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  pickerText: {
    fontSize: 16,
    color: COLORS.black,
    marginLeft: 8,
  },
  placeholderText: {
    color: COLORS.gray,
  },
  selectedLocationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingHorizontal: 8,
  },
  selectedLocationText: {
    fontSize: 14,
    color: COLORS.primary,
    marginLeft: 4,
    fontWeight: '500',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  closeButton: {
    padding: 4,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.black,
  },
  placeholder: {
    width: 32,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    backgroundColor: COLORS.lightGray,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: COLORS.black,
    marginLeft: 8,
  },
  list: {
    flex: 1,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  selectedItem: {
    backgroundColor: COLORS.lightGray,
  },
  listItemText: {
    fontSize: 16,
    color: COLORS.black,
  },
  selectedItemText: {
    color: COLORS.primary,
    fontWeight: '500',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.gray,
  },
});

export default EnhancedLocationPicker;
