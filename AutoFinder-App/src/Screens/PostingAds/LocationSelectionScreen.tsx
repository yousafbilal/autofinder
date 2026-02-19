import React, { useState, useEffect } from "react"
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
  Alert,
} from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { COLORS } from "../../constants/colors"
import { NavigationProp, useNavigation, useRoute } from "@react-navigation/native"
import { RootStackParamList } from "../../../navigationTypes"

// Sample location data - in a real app, this would come from an API
const LOCATIONS = [
  { id: "1", name: "Lahore", province: "Punjab", country: "Pakistan" },
  { id: "2", name: "Karachi", province: "Sindh", country: "Pakistan" },
  { id: "3", name: "Islamabad", province: "Federal", country: "Pakistan" },
  { id: "4", name: "Rawalpindi", province: "Punjab", country: "Pakistan" },
  { id: "5", name: "Faisalabad", province: "Punjab", country: "Pakistan" },
  { id: "6", name: "Multan", province: "Punjab", country: "Pakistan" },
  { id: "7", name: "Peshawar", province: "KPK", country: "Pakistan" },
  { id: "8", name: "Quetta", province: "Balochistan", country: "Pakistan" },
  { id: "9", name: "Sialkot", province: "Punjab", country: "Pakistan" },
  { id: "10", name: "Gujranwala", province: "Punjab", country: "Pakistan" },
  { id: "11", name: "Sargodha", province: "Punjab", country: "Pakistan" },
  { id: "12", name: "Bahawalpur", province: "Punjab", country: "Pakistan" },
  { id: "13", name: "Sukkur", province: "Sindh", country: "Pakistan" },
  { id: "14", name: "Larkana", province: "Sindh", country: "Pakistan" },
  { id: "15", name: "Hyderabad", province: "Sindh", country: "Pakistan" },
  { id: "16", name: "Mardan", province: "KPK", country: "Pakistan" },
  { id: "17", name: "Mingora", province: "KPK", country: "Pakistan" },
  { id: "18", name: "Nawabshah", province: "Sindh", country: "Pakistan" },
  { id: "19", name: "Chiniot", province: "Punjab", country: "Pakistan" },
  { id: "20", name: "Kotri", province: "Sindh", country: "Pakistan" },
]

type Location = {
  id: string
  name: string
  province: string
  country: string
}

const LocationSelectionScreen = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>()
  const route = useRoute<any>()
  const [searchQuery, setSearchQuery] = useState("")
  const [filteredLocations, setFilteredLocations] = useState<Location[]>(LOCATIONS)
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null)

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredLocations(LOCATIONS)
    } else {
      const filtered = LOCATIONS.filter(
        (location) =>
          location.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          location.province.toLowerCase().includes(searchQuery.toLowerCase())
      )
      setFilteredLocations(filtered)
    }
  }, [searchQuery])

  const handleLocationSelect = (location: Location) => {
    setSelectedLocation(location)
  }

  const handleAddLocation = () => {
    if (selectedLocation) {
      // Return the selected location to the previous screen
      navigation.navigate("CarInspection", {
        selectedLocation: selectedLocation,
      })
    } else {
      Alert.alert("No Location Selected", "Please select a location first")
    }
  }

  const renderLocationItem = ({ item }: { item: Location }) => (
    <TouchableOpacity
      style={[
        styles.locationItem,
        selectedLocation?.id === item.id && styles.selectedLocationItem,
      ]}
      onPress={() => handleLocationSelect(item)}
    >
      <View style={styles.locationInfo}>
        <Text
          style={[
            styles.locationName,
            selectedLocation?.id === item.id && styles.selectedLocationText,
          ]}
        >
          {item.name}
        </Text>
        <Text
          style={[
            styles.locationDetails,
            selectedLocation?.id === item.id && styles.selectedLocationText,
          ]}
        >
          {item.province}, {item.country}
        </Text>
      </View>
      {selectedLocation?.id === item.id && (
        <Ionicons name="checkmark-circle" size={24} color={COLORS.primary} />
      )}
    </TouchableOpacity>
  )

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.black} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Select Location</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color={COLORS.darkGray} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search for a city..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={COLORS.darkGray}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Ionicons name="close-circle" size={20} color={COLORS.darkGray} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <FlatList
        data={filteredLocations}
        renderItem={renderLocationItem}
        keyExtractor={(item) => item.id}
        style={styles.locationsList}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No locations found</Text>
            <Text style={styles.emptySubtext}>
              Try searching with a different term
            </Text>
          </View>
        }
      />

      {selectedLocation && (
        <View style={styles.bottomContainer}>
          <View style={styles.selectedLocationContainer}>
            <Text style={styles.selectedLocationLabel}>Selected:</Text>
            <Text style={styles.selectedLocationValue}>
              {selectedLocation.name}, {selectedLocation.province}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.addButton}
            onPress={handleAddLocation}
          >
            <Text style={styles.addButtonText}>Add Location</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.black,
  },
  searchContainer: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  searchInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.lightGray,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: COLORS.black,
  },
  locationsList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  locationItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  selectedLocationItem: {
    backgroundColor: "rgba(0, 102, 204, 0.05)",
  },
  locationInfo: {
    flex: 1,
  },
  locationName: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.black,
    marginBottom: 2,
  },
  locationDetails: {
    fontSize: 14,
    color: COLORS.darkGray,
  },
  selectedLocationText: {
    color: COLORS.primary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.darkGray,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.darkGray,
  },
  bottomContainer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray,
    backgroundColor: COLORS.white,
  },
  selectedLocationContainer: {
    marginBottom: 12,
  },
  selectedLocationLabel: {
    fontSize: 14,
    color: COLORS.darkGray,
    marginBottom: 4,
  },
  selectedLocationValue: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.primary,
  },
  addButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  addButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "600",
  },
})

export default LocationSelectionScreen
