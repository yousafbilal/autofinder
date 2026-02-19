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

// Sample registration cities data - in a real app, this would come from an API
const REGISTRATION_CITIES = [
  { id: "1", name: "Lahore", province: "Punjab" },
  { id: "2", name: "Karachi", province: "Sindh" },
  { id: "3", name: "Islamabad", province: "Federal" },
  { id: "4", name: "Rawalpindi", province: "Punjab" },
  { id: "5", name: "Faisalabad", province: "Punjab" },
  { id: "6", name: "Multan", province: "Punjab" },
  { id: "7", name: "Peshawar", province: "KPK" },
  { id: "8", name: "Quetta", province: "Balochistan" },
  { id: "9", name: "Sialkot", province: "Punjab" },
  { id: "10", name: "Gujranwala", province: "Punjab" },
  { id: "11", name: "Sargodha", province: "Punjab" },
  { id: "12", name: "Bahawalpur", province: "Punjab" },
  { id: "13", name: "Sukkur", province: "Sindh" },
  { id: "14", name: "Larkana", province: "Sindh" },
  { id: "15", name: "Hyderabad", province: "Sindh" },
  { id: "16", name: "Mardan", province: "KPK" },
  { id: "17", name: "Mingora", province: "KPK" },
  { id: "18", name: "Nawabshah", province: "Sindh" },
  { id: "19", name: "Chiniot", province: "Punjab" },
  { id: "20", name: "Kotri", province: "Sindh" },
  { id: "21", name: "Jhang", province: "Punjab" },
  { id: "22", name: "Sheikhupura", province: "Punjab" },
  { id: "23", name: "Rahim Yar Khan", province: "Punjab" },
  { id: "24", name: "Gujrat", province: "Punjab" },
  { id: "25", name: "Kasur", province: "Punjab" },
  { id: "26", name: "Mardan", province: "KPK" },
  { id: "27", name: "Mingora", province: "KPK" },
  { id: "28", name: "Nawabshah", province: "Sindh" },
  { id: "29", name: "Chiniot", province: "Punjab" },
  { id: "30", name: "Kotri", province: "Sindh" },
]

type RegistrationCity = {
  id: string
  name: string
  province: string
}

const RegistrationCitySelectionScreen = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>()
  const route = useRoute<any>()
  const [searchQuery, setSearchQuery] = useState("")
  const [filteredCities, setFilteredCities] = useState<RegistrationCity[]>(REGISTRATION_CITIES)
  const [selectedCity, setSelectedCity] = useState<RegistrationCity | null>(null)

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredCities(REGISTRATION_CITIES)
    } else {
      const filtered = REGISTRATION_CITIES.filter(
        (city) =>
          city.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          city.province.toLowerCase().includes(searchQuery.toLowerCase())
      )
      setFilteredCities(filtered)
    }
  }, [searchQuery])

  const handleCitySelect = (city: RegistrationCity) => {
    setSelectedCity(city)
  }

  const handleAddCity = () => {
    if (selectedCity) {
      // Return the selected city to the previous screen
      navigation.navigate("RentServiceAd", {
        selectedRegistrationCity: selectedCity,
      })
    } else {
      Alert.alert("No City Selected", "Please select a registration city first")
    }
  }

  const renderCityItem = ({ item }: { item: RegistrationCity }) => (
    <TouchableOpacity
      style={[
        styles.cityItem,
        selectedCity?.id === item.id && styles.selectedCityItem,
      ]}
      onPress={() => handleCitySelect(item)}
    >
      <View style={styles.cityInfo}>
        <Text
          style={[
            styles.cityName,
            selectedCity?.id === item.id && styles.selectedCityText,
          ]}
        >
          {item.name}
        </Text>
        <Text
          style={[
            styles.cityDetails,
            selectedCity?.id === item.id && styles.selectedCityText,
          ]}
        >
          {item.province}
        </Text>
      </View>
      {selectedCity?.id === item.id && (
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
        <Text style={styles.headerTitle}>Select Registration City</Text>
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
        data={filteredCities}
        renderItem={renderCityItem}
        keyExtractor={(item) => item.id}
        style={styles.citiesList}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No cities found</Text>
            <Text style={styles.emptySubtext}>
              Try searching with a different term
            </Text>
          </View>
        }
      />

      {selectedCity && (
        <View style={styles.bottomContainer}>
          <View style={styles.selectedCityContainer}>
            <Text style={styles.selectedCityLabel}>Selected:</Text>
            <Text style={styles.selectedCityValue}>
              {selectedCity.name}, {selectedCity.province}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.addButton}
            onPress={handleAddCity}
          >
            <Text style={styles.addButtonText}>Add City</Text>
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
  citiesList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  cityItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  selectedCityItem: {
    backgroundColor: "rgba(0, 102, 204, 0.05)",
  },
  cityInfo: {
    flex: 1,
  },
  cityName: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.black,
    marginBottom: 2,
  },
  cityDetails: {
    fontSize: 14,
    color: COLORS.darkGray,
  },
  selectedCityText: {
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
  selectedCityContainer: {
    marginBottom: 12,
  },
  selectedCityLabel: {
    fontSize: 14,
    color: COLORS.darkGray,
    marginBottom: 4,
  },
  selectedCityValue: {
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

export default RegistrationCitySelectionScreen
