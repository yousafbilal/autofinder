import React, { useState } from "react"
import { View, Text, StyleSheet, TouchableOpacity, FlatList, TextInput } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { Ionicons } from "@expo/vector-icons"
import { COLORS } from "../constants/colors"
import { useNavigation } from "@react-navigation/native"

const CityScreen = () => {
  const navigation = useNavigation()
  const [selectedCity, setSelectedCity] = useState("New York")
  const [searchQuery, setSearchQuery] = useState("")

  const cities = [
    { id: "1", name: "New York", country: "United States" },
    { id: "2", name: "Los Angeles", country: "United States" },
    { id: "3", name: "Chicago", country: "United States" },
    { id: "4", name: "Houston", country: "United States" },
    { id: "5", name: "Phoenix", country: "United States" },
    { id: "6", name: "Philadelphia", country: "United States" },
    { id: "7", name: "San Antonio", country: "United States" },
    { id: "8", name: "San Diego", country: "United States" },
    { id: "9", name: "Dallas", country: "United States" },
    { id: "10", name: "San Francisco", country: "United States" },
    { id: "11", name: "Austin", country: "United States" },
    { id: "12", name: "Seattle", country: "United States" },
    { id: "13", name: "Denver", country: "United States" },
    { id: "14", name: "Boston", country: "United States" },
    { id: "15", name: "Miami", country: "United States" },
  ]

  const filteredCities = searchQuery
    ? cities.filter((city) => city.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : cities

  const handleCitySelect = (city) => {
    setSelectedCity(city)
  }

  const handleSave = () => {
    // Here you would typically update the city preference in your app
    navigation.goBack()
  }

  const renderCityItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.cityItem, selectedCity === item.name && styles.selectedCityItem]}
      onPress={() => handleCitySelect(item.name)}
    >
      <View>
        <Text style={[styles.cityName, selectedCity === item.name && styles.selectedCityName]}>{item.name}</Text>
        <Text style={styles.countryName}>{item.country}</Text>
      </View>
      {selectedCity === item.name && <Ionicons name="checkmark" size={20} color={COLORS.primary} />}
    </TouchableOpacity>
  )

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Select City</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.content}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={COLORS.darkGray} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search cities..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Ionicons name="close-circle" size={20} color={COLORS.darkGray} />
            </TouchableOpacity>
          ) : null}
        </View>

        <FlatList
          data={filteredCities}
          renderItem={renderCityItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.cityList}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="location-outline" size={60} color={COLORS.lightGray} />
              <Text style={styles.emptyText}>No cities found</Text>
            </View>
          }
        />

        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>Save</Text>
        </TouchableOpacity>
      </View>
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
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.white,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.lightGray,
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 46,
    marginBottom: 16,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: "100%",
    fontSize: 14,
  },
  cityList: {
    paddingBottom: 24,
  },
  cityItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  selectedCityItem: {
    backgroundColor: COLORS.lightGray,
  },
  cityName: {
    fontSize: 16,
    color: COLORS.black,
    marginBottom: 4,
  },
  selectedCityName: {
    fontWeight: "600",
    color: COLORS.primary,
  },
  countryName: {
    fontSize: 12,
    color: COLORS.darkGray,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
    marginTop: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.darkGray,
    marginTop: 16,
  },
  saveButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 16,
  },
  saveButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "600",
  },
})

export default CityScreen;
