import React, { useState } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  TextInput,
  Keyboard,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
interface FilterModalProps {
  visible: boolean;
  onClose: () => void;
  onApplyFilters: (filters: {
    cities: string[];
    
  }) => void;
}

const AutoPartsFilterModal = ({ visible, onClose, onApplyFilters }: FilterModalProps) => {
  // State for selected filters
  const [selectedCities, setSelectedCities] = useState<string[]>([]);
  
  // City - full screen picker page with search & multi-select
  const [showCityPicker, setShowCityPicker] = useState(false);
  const [cityQuery, setCityQuery] = useState("");
  
  const cities = [
    "All Cities", "Lahore", "Karachi", "Islamabad", "Rawalpindi", "Multan", 
    "Faisalabad", "Peshawar", "Quetta", "Sialkot", "Gujranwala", "Sargodha", 
    "Bahawalpur", "Sukkur", "Larkana", "Sheikhupura", "Rahim Yar Khan", "Gujrat",
    "Mardan", "Mingora", "Nawabshah", "Chiniot", "Kotri", "Kāmoke", "Hafizabad", "Kohat"
  ];

// Define types for the selection function
const toggleSelection = <T,>(option: T, setSelected: React.Dispatch<React.SetStateAction<T[]>>, selectedList: T[]) => {
  if (option === "All Cities") {
    // If "All Cities" is selected, clear all individual selections
    setSelected(selectedList.includes("All Cities") ? [] : ["All Cities"]);
  } else {
    // Otherwise, toggle individual selections
    if (selectedList.includes(option)) {
      setSelected(selectedList.filter((item) => item !== option));
    } else {
      setSelected([...selectedList, option]);
    }
  }
};

const FilterSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <View style={styles.filterSection}>
    <Text style={styles.sectionTitle}>{title}</Text>
    {children}
  </View>
);

const handleReset = () => {
  setSelectedCities([]);
  // Reset picker states
  setShowCityPicker(false);
  setCityQuery("");
};
  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="black" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Filters</Text>
            <TouchableOpacity onPress={handleReset}>
              <Text style={styles.resetText}>Reset</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={true}>
            {/* City Filter - clickable row opens full-screen searchable, multi-select list */}
            <FilterSection title="City">
              <TouchableOpacity
                activeOpacity={0.9}
                style={styles.searchBox}
                onPress={() => {
                  setShowCityPicker(true);
                  setCityQuery("");
                }}
              >
                <Ionicons name="search" size={18} color="#999" style={{ marginRight: 6 }} />
                <Text style={styles.searchPlaceholder}>
                  Select cities
                </Text>
                <Ionicons name={'chevron-forward'} size={18} color="#999" />
              </TouchableOpacity>
              {/* Render current selections as chips */}
              {selectedCities.length > 0 && (
                <View style={styles.chipsContainer}>
                  {selectedCities.filter(city => city !== "All Cities").map((city, idx) => (
                    <View key={`${city}-${idx}`} style={styles.chip}>
                      <Text style={styles.chipText} numberOfLines={1}>{city}</Text>
                      <TouchableOpacity
                        style={styles.chipRemove}
                        onPress={() => setSelectedCities(selectedCities.filter(c => c !== city))}
                      >
                        <Ionicons name="close" size={14} color="#CD0100" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
            </FilterSection>
          </ScrollView>

          {/* Fixed Bottom Button */}
          <View style={styles.bottomContainer}>
            <TouchableOpacity
              style={styles.applyButton}
              onPress={() => {
                onApplyFilters({
                  cities: selectedCities,
                });
                onClose();
              }}
            >
              <Text style={styles.applyButtonText}>Apply Filters</Text>
            </TouchableOpacity>
          </View>

          {/* Full-screen City overlay */}
          {showCityPicker && (
            <View style={styles.overlayFull}>
              <View style={styles.fullPageHeader}>
                <TouchableOpacity onPress={() => { Keyboard.dismiss(); setShowCityPicker(false); setCityQuery(""); }}>
                  <Ionicons name="arrow-back" size={22} color="#333" />
                </TouchableOpacity>
                <Text style={styles.fullPageTitle}>Select Cities</Text>
                <View style={{ width: 22 }} />
              </View>

              <View style={[styles.searchBox, { marginHorizontal: 16, marginBottom: 10 }]}> 
                <Ionicons name="search" size={18} color="#999" style={{ marginRight: 6 }} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Type to search"
                  placeholderTextColor="#999"
                  value={cityQuery}
                  onChangeText={setCityQuery}
                  autoFocus
                  blurOnSubmit
                  returnKeyType="search"
                  onSubmitEditing={() => Keyboard.dismiss()}
                />
              </View>

              <ScrollView style={{ flex: 1, marginHorizontal: 16 }} keyboardShouldPersistTaps="always">
                {(cityQuery
                  ? cities.filter(c => c.toLowerCase().includes(cityQuery.toLowerCase()))
                  : cities
                ).map((c, idx) => {
                  const selected = selectedCities.includes(c);
                  return (
                    <TouchableOpacity
                      key={`${c}-${idx}`}
                      style={[styles.categoryRow, selected && styles.categoryRowSelected]}
                      onPress={() => toggleSelection(c, setSelectedCities, selectedCities)}
                    >
                      <Text style={[styles.categoryLabel, selected && styles.categoryLabelSelected]}>{c}</Text>
                      <Ionicons name={selected ? 'checkbox' : 'square-outline'} size={20} color={selected ? '#CD0100' : '#999'} />
                    </TouchableOpacity>
                  )
                })}
              </ScrollView>

              <View style={{ padding: 16 }}>
                <TouchableOpacity
                  style={styles.applyButton}
                  onPress={() => { Keyboard.dismiss(); setShowCityPicker(false); setCityQuery(""); }}
                >
                  <Text style={styles.applyButtonText}>Done</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "white",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "90%",
    minHeight: "80%",
    position: 'relative',
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  resetText: {
    color: "#CD0100",
    fontSize: 16,
    fontWeight: "600",
  },
  scrollContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  filterSection: {
    marginVertical: 15,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 10,
  },
  rowContainer: {
    flexDirection: "row",
    marginTop: 5,
  },
  filterButton: {
    padding: 10,
    backgroundColor: "#eee",
    borderRadius: 10,
    marginRight: 10,
    borderWidth: 1,
    borderColor: "transparent",
  },
  selectedFilter: {
    borderColor: "#CD0100",
  },
  bottomContainer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
    backgroundColor: "#fff",
  },
  applyButton: {
    backgroundColor: "#CD0100",
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: "center",
  },
  applyButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  chipText: {
    color: '#333',
    fontSize: 13,
    fontWeight: '500',
    marginRight: 6,
    flexShrink: 1,
  },
  chipRemove: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    paddingHorizontal: 12,
    height: 44,
    borderRadius: 10,
  },
  searchPlaceholder: {
    flex: 1,
    color: '#999',
    fontSize: 14,
  },
  searchInput: {
    flex: 1,
    color: '#333',
    fontSize: 14,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  categoryRowSelected: {
    backgroundColor: '#FFF6F6',
  },
  categoryLabel: {
    fontSize: 14,
    color: '#333',
  },
  categoryLabelSelected: {
    color: '#CD0100',
    fontWeight: '600'
  },
  fullPageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee'
  },
  fullPageTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333'
  },
  overlayFull: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#fff',
    zIndex: 999,
    elevation: 10,
  },
  colorOptionRow: {
    flexDirection: "row", 
    alignItems: "center",
    padding: 10,
    borderRadius: 10,
    marginRight: 10,
    borderWidth: 2,
    borderColor: "transparent", // Default no border
  },
  
  colorOption: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#eee", // Light gray container
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 2,
    borderColor: "transparent", // No border by default
  },
  
  colorName: {
    fontSize: 14,
    marginRight: 8,
  },
  
  colorBox: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ccc",
  },
  

  
});

export default AutoPartsFilterModal;
