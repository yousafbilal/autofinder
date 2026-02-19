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
import { pakistaniCities } from './EnhancedDropdownData';

interface RegistrationCityPickerProps {
  selectedCity: string;
  onCityChange: (city: string) => void;
  required?: boolean;
  title?: string;
}

const RegistrationCityPicker: React.FC<RegistrationCityPickerProps> = ({
  selectedCity,
  onCityChange,
  required = false,
  title = "Registration City",
}) => {
  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Ref for direct TextInput control
  const searchRef = useRef<TextInput>(null);

  // Clear search query when modal is closed
  React.useEffect(() => {
    if (!showModal) {
      setSearchQuery('');
    }
  }, [showModal]);

  // Filter cities based on search query
  const filteredCities = searchQuery.trim() === '' 
    ? pakistaniCities 
    : pakistaniCities.filter(city =>
        city.toLowerCase().includes(searchQuery.toLowerCase())
      );

  const handleCitySelect = (city: string) => {
    onCityChange(city);
    setShowModal(false);
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

  const CityModal = () => (
    <Modal
      visible={showModal}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => {
              setShowModal(false);
            }}
          >
            <Ionicons name="close" size={24} color={COLORS.black} />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Select Registration City ({pakistaniCities.length} cities)</Text>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={COLORS.gray} />
          <TextInput
            ref={searchRef}
            style={styles.searchInput}
            placeholder="Search cities (optional)..."
            value={searchQuery}
            onChangeText={setSearchQuery}
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
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                {searchQuery.trim() === '' 
                  ? 'No cities available' 
                  : 'No cities found matching your search'
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

      <TouchableOpacity
        style={[
          styles.picker,
          !selectedCity && styles.pickerError,
        ]}
        onPress={() => setShowModal(true)}
      >
        <View style={styles.pickerContent}>
          <Ionicons name="location-outline" size={20} color={COLORS.primary} />
          <Text style={[
            styles.pickerText,
            !selectedCity && styles.placeholderText,
          ]}>
            {selectedCity || 'Select Registration City'}
          </Text>
        </View>
        <Ionicons name="chevron-down" size={20} color={COLORS.gray} />
      </TouchableOpacity>

      {selectedCity && (
        <View style={styles.selectedCityContainer}>
          <Ionicons name="checkmark-circle" size={16} color={COLORS.primary} />
          <Text style={styles.selectedCityText}>
            {selectedCity}
          </Text>
        </View>
      )}

      <CityModal />
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
  selectedCityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingHorizontal: 8,
  },
  selectedCityText: {
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

export default RegistrationCityPicker;
