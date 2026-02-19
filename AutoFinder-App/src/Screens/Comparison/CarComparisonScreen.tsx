import React, { useState, useEffect } from "react"
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Dimensions,
  Modal,
  Alert,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { Ionicons } from "@expo/vector-icons"
import { useNavigation, useRoute } from "@react-navigation/native"
import { COLORS } from "../../constants/colors"
import { API_URL } from "../../../config"
import { carData } from "../../Components/DropdownData"

const { width } = Dimensions.get("window")

interface Car {
  _id?: string
  id?: string
  make: string
  model: string
  variant?: string
  year?: number | string
  price?: number
  transmission?: string
  fuelType?: string
  engineCapacity?: string
  power?: string
  horsepower?: string
  seatingCapacity?: string
  bodyType?: string
  location?: string
  image1?: string
  image?: string
  displayName?: string
  displayPrice?: string
  displayYear?: string
  displayTransmission?: string
  displayPower?: string
  displayFuel?: string
  displaySeats?: string
}

const CarComparisonScreen = () => {
  const navigation = useNavigation()
  const route = useRoute()
  const preSelectedCars = (route.params as any)?.preSelectedCars

  const [selectedCars, setSelectedCars] = useState<(Car | null)[]>([null, null, null])
  const [allCars, setAllCars] = useState<Car[]>([])
  const [showModal, setShowModal] = useState(false)
  const [modalCarIndex, setModalCarIndex] = useState(0)
  const [showComparison, setShowComparison] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Modal state
  const [selectedMake, setSelectedMake] = useState<string | null>(null)
  const [selectedModel, setSelectedModel] = useState<string | null>(null)
  const [selectedVariant, setSelectedVariant] = useState<string | null>(null)
  const [selectedYear, setSelectedYear] = useState<string | null>(null)

  // Popular makes
  const popularMakes = ['Toyota', 'Suzuki', 'Honda', 'Daihatsu']

  // Initialize with pre-selected cars if provided
  useEffect(() => {
    if (preSelectedCars && Array.isArray(preSelectedCars)) {
      setSelectedCars([...preSelectedCars])
      if (preSelectedCars.some((car: any) => car !== null)) {
        setShowComparison(true)
      }
    }
  }, [preSelectedCars])

  // Fetch all cars from backend
  useEffect(() => {
    const fetchAllCars = async () => {
      try {
        setIsLoading(true)
        const [newCarsRes, freeAdsRes, featuredAdsRes] = await Promise.all([
          fetch(`${API_URL}/new_cars/public`),
          fetch(`${API_URL}/free_ads`),
          fetch(`${API_URL}/featured_ads`)
        ])

        const newCars = newCarsRes.ok ? await newCarsRes.json() : []
        const freeAds = freeAdsRes.ok ? await freeAdsRes.json() : []
        const featuredAds = featuredAdsRes.ok ? await featuredAdsRes.json() : []

        const combinedCars: Car[] = [
          ...newCars
            .filter((car: any) => car.status === 'active' && !car.isDeleted)
            .map((car: any) => ({
              ...car,
              type: 'new',
              id: car._id || car.id,
              displayName: `${car.make} ${car.model}${car.variant ? ' ' + car.variant : ''}`,
              displayPrice: `PKR ${(car.price / 100000).toFixed(2)} lacs`,
              displayYear: car.year?.toString() || 'N/A',
              displayTransmission: car.transmission || car.transmissionType || 'N/A',
              displayPower: car.power || car.horsepower || 'N/A',
              displayFuel: car.fuelType || 'N/A',
              displaySeats: car.seatingCapacity || 'N/A',
              image: car.image1
            })),
          ...freeAds
            .filter((car: any) => car.isActive && !car.isDeleted && car.adStatus === 'approved')
            .map((car: any) => ({
              ...car,
              type: 'used',
              id: car._id || car.id,
              displayName: `${car.make} ${car.model}${car.variant ? ' ' + car.variant : ''}`,
              displayPrice: `PKR ${(car.price / 100000).toFixed(2)} lacs`,
              displayYear: car.year?.toString() || 'N/A',
              displayTransmission: car.transmission || 'N/A',
              displayPower: car.engineCapacity || 'N/A',
              displayFuel: car.fuelType || 'N/A',
              displaySeats: '5',
              image: car.image1
            })),
          ...featuredAds
            .filter((car: any) => car.isActive && !car.isDeleted && car.isFeatured === 'Approved')
            .map((car: any) => ({
              ...car,
              type: 'used',
              id: car._id || car.id,
              displayName: `${car.make} ${car.model}${car.variant ? ' ' + car.variant : ''}`,
              displayPrice: `PKR ${(car.price / 100000).toFixed(2)} lacs`,
              displayYear: car.year?.toString() || 'N/A',
              displayTransmission: car.transmission || 'N/A',
              displayPower: car.engineCapacity || 'N/A',
              displayFuel: car.fuelType || 'N/A',
              displaySeats: '5',
              image: car.image1
            }))
        ]

        setAllCars(combinedCars)
      } catch (err) {
        console.error('Error fetching cars:', err)
        Alert.alert('Error', 'Failed to load cars. Please try again.')
      } finally {
        setIsLoading(false)
      }
    }

    fetchAllCars()
  }, [])

  // Get all makes from carData
  const getAllMakes = () => {
    const makes = Object.keys(carData)
    const popular = makes.filter(make => popularMakes.includes(make))
    const others = makes.filter(make => !popularMakes.includes(make))
    return { popular, others }
  }

  // Get models for selected make
  const getModelsForMake = (make: string | null) => {
    if (!make || !carData[make as keyof typeof carData]) return { popular: [], others: [] }
    const models = Object.keys(carData[make as keyof typeof carData].models)
    const popular = models.slice(0, Math.min(5, models.length))
    const others = models.slice(5)
    return { popular, others }
  }

  // Get variants for selected make and model
  const getVariantsForModel = (make: string | null, model: string | null) => {
    if (!make || !model || !carData[make as keyof typeof carData]?.models[model]) return []
    return Object.keys(carData[make as keyof typeof carData].models[model].variants)
  }

  // Get years for selected variant
  const getYearsForVariant = (make: string | null, model: string | null, variant: string | null) => {
    if (!make || !model || !variant || !carData[make as keyof typeof carData]?.models[model]) return []
    return carData[make as keyof typeof carData].models[model].variants[variant] || []
  }

  // Open modal for car selection
  const openCarSelectionModal = (index: number) => {
    setModalCarIndex(index)
    setSelectedMake(null)
    setSelectedModel(null)
    setSelectedVariant(null)
    setSelectedYear(null)
    setShowModal(true)
  }

  // Close modal
  const closeModal = () => {
    setShowModal(false)
    setSelectedMake(null)
    setSelectedModel(null)
    setSelectedVariant(null)
    setSelectedYear(null)
  }

  // Handle Done button
  const handleDone = () => {
    if (!selectedMake || !selectedModel) {
      Alert.alert('Required', 'Please select Make and Model')
      return
    }

    // Try to find matching car with multiple fallback strategies
    let matchingCar: Car | null = null

    // Strategy 1: Exact match (make + model + variant + year)
    if (selectedVariant && selectedYear) {
      matchingCar = allCars.find(car =>
        car.make === selectedMake &&
        car.model === selectedModel &&
        car.variant === selectedVariant &&
        car.year?.toString() === selectedYear
      ) || null
    }

    // Strategy 2: Match make + model + variant (ignore year)
    if (!matchingCar && selectedVariant) {
      matchingCar = allCars.find(car =>
        car.make === selectedMake &&
        car.model === selectedModel &&
        car.variant === selectedVariant
      ) || null
    }

    // Strategy 3: Match make + model + year (ignore variant)
    if (!matchingCar && selectedYear) {
      matchingCar = allCars.find(car =>
        car.make === selectedMake &&
        car.model === selectedModel &&
        car.year?.toString() === selectedYear
      ) || null
    }

    // Strategy 4: Match make + model only (use first available)
    if (!matchingCar) {
      matchingCar = allCars.find(car =>
        car.make === selectedMake &&
        car.model === selectedModel
      ) || null
    }

    // Strategy 5: Match make only (use first available)
    if (!matchingCar) {
      matchingCar = allCars.find(car => car.make === selectedMake) || null
    }

    // If still no match, create a basic object with available data
    if (!matchingCar) {
      matchingCar = {
        make: selectedMake,
        model: selectedModel,
        variant: selectedVariant || '',
        year: selectedYear ? parseInt(selectedYear) : null,
        displayName: `${selectedMake} ${selectedModel}${selectedVariant ? ' ' + selectedVariant : ''}`,
        displayPrice: 'N/A',
        displayYear: selectedYear || 'N/A',
        displayTransmission: 'N/A',
        displayPower: 'N/A',
        displayFuel: 'N/A',
        displaySeats: 'N/A',
        image: null,
        id: `temp-${Date.now()}`
      }
    } else {
      // Ensure displayName is set correctly
      matchingCar.displayName = `${selectedMake} ${selectedModel}${selectedVariant ? ' ' + selectedVariant : ''}`
      // Update year if selected
      if (selectedYear) {
        matchingCar.year = parseInt(selectedYear)
        matchingCar.displayYear = selectedYear
      }
    }

    const newSelected = [...selectedCars]
    newSelected[modalCarIndex] = matchingCar
    setSelectedCars(newSelected)
    closeModal()
  }

  // Clear car
  const clearCar = (index: number) => {
    const newSelected = [...selectedCars]
    newSelected[index] = null
    setSelectedCars(newSelected)
  }

  // Clear all
  const clearAll = () => {
    setSelectedCars([null, null, null])
    setShowComparison(false)
  }

  // Build image URL
  const buildImageUrl = (imagePath: string | null | undefined) => {
    if (!imagePath) return 'https://via.placeholder.com/150x100?text=No+Image'
    if (imagePath.startsWith('http')) return imagePath
    const cleanPath = imagePath.startsWith('/') ? imagePath.substring(1) : imagePath
    return `${API_URL}/uploads/${cleanPath}`
  }

  const specifications = [
    { label: 'Price', key: 'displayPrice' },
    { label: 'Year', key: 'displayYear' },
    { label: 'Transmission', key: 'displayTransmission' },
    { label: 'Power', key: 'displayPower' },
    { label: 'Fuel Type', key: 'displayFuel' },
    { label: 'Seats', key: 'displaySeats' },
    { label: 'Body Type', key: 'bodyType' },
    { label: 'Location', key: 'location' }
  ]

  const hasSelectedCars = selectedCars.some(car => car !== null)
  const { popular: popularMakesList, others: otherMakesList } = getAllMakes()
  const { popular: popularModels, others: otherModels } = selectedMake ? getModelsForMake(selectedMake) : { popular: [], others: [] }
  const variants = selectedMake && selectedModel ? getVariantsForModel(selectedMake, selectedModel) : []
  const years = selectedMake && selectedModel && selectedVariant ? getYearsForVariant(selectedMake, selectedModel, selectedVariant) : []

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.black} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Car Comparison</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Title Section */}
        <View style={styles.titleSection}>
          <Text style={styles.title}>New Cars Comparison</Text>
          <Text style={styles.subtitle}>Confused? Compare your choice of cars</Text>
        </View>

        {/* Selection Box */}
        <View style={styles.selectionBox}>
          <View style={styles.carSelectionRow}>
            {[0, 1, 2].map((index) => (
              <View key={index} style={styles.carInputWrapper}>
                <View style={styles.carInputHeader}>
                  <Text style={styles.carInputLabel}>Select Car-{index + 1}</Text>
                  {index === 0 && selectedCars[0] && (
                    <TouchableOpacity onPress={clearAll}>
                      <Text style={styles.clearText}>Clear</Text>
                    </TouchableOpacity>
                  )}
                </View>
                <TouchableOpacity
                  style={styles.carInput}
                  onPress={() => openCarSelectionModal(index)}
                >
                  <Text
                    style={selectedCars[index] ? styles.carInputText : styles.carInputPlaceholder}
                    numberOfLines={1}
                  >
                    {selectedCars[index]?.displayName || 'Make/Model/Version'}
                  </Text>
                  {selectedCars[index] ? (
                    <TouchableOpacity
                      onPress={(e) => {
                        e.stopPropagation()
                        clearCar(index)
                      }}
                    >
                      <Ionicons name="close-circle" size={20} color={COLORS.gray} />
                    </TouchableOpacity>
                  ) : (
                    <Ionicons name="chevron-down" size={20} color={COLORS.gray} />
                  )}
                </TouchableOpacity>
              </View>
            ))}
          </View>

          <TouchableOpacity
            style={[styles.compareButton, !hasSelectedCars && styles.compareButtonDisabled]}
            onPress={() => {
              if (hasSelectedCars) {
                setShowComparison(true)
              }
            }}
            disabled={!hasSelectedCars}
          >
            <Text style={styles.compareButtonText}>Compare</Text>
          </TouchableOpacity>
        </View>

        {/* Comparison Table */}
        {showComparison && hasSelectedCars && (
          <View style={styles.comparisonTable}>
            <ScrollView horizontal showsHorizontalScrollIndicator={true}>
              <View>
                <View style={styles.tableHeader}>
                  <View style={styles.specColumn}>
                    <Text style={styles.specHeaderText}>Specification</Text>
                  </View>
                  {selectedCars.map((car, index) => {
                    if (!car) return null
                    return (
                      <View key={index} style={styles.carColumn}>
                        <View style={styles.carImageContainer}>
                          <Image
                            source={{ uri: buildImageUrl(car.image) }}
                            style={styles.carImage}
                            resizeMode="contain"
                          />
                        </View>
                        <Text style={styles.carName} numberOfLines={2}>
                          {car.displayName}
                        </Text>
                        {car.displayPrice && car.displayPrice !== 'N/A' && (
                          <Text style={styles.carPrice}>{car.displayPrice}</Text>
                        )}
                      </View>
                    )
                  })}
                </View>
                {specifications.map((spec, index) => (
                  <View
                    key={index}
                    style={[styles.tableRow, index % 2 === 0 ? styles.tableRowEven : styles.tableRowOdd]}
                  >
                    <View style={styles.specColumn}>
                      <Text style={styles.specLabel}>{spec.label}</Text>
                    </View>
                    {selectedCars.map((car, carIndex) => {
                      if (!car) return null
                      return (
                        <View key={carIndex} style={styles.carColumn}>
                          <Text style={styles.specValue}>
                            {car[spec.key as keyof Car] || 'N/A'}
                          </Text>
                        </View>
                      )
                    })}
                  </View>
                ))}
              </View>
            </ScrollView>
          </View>
        )}

        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Loading cars...</Text>
          </View>
        )}
      </ScrollView>

      {/* Modal for Car Selection */}
      <Modal
        visible={showModal}
        animationType="slide"
        transparent={true}
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Car</Text>
              <TouchableOpacity onPress={closeModal}>
                <Ionicons name="close" size={24} color={COLORS.black} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              {/* Column 1: MAKE */}
              <ScrollView style={styles.modalColumn}>
                <Text style={styles.modalColumnTitle}>MAKE</Text>
                {popularMakesList.length > 0 && (
                  <>
                    <Text style={styles.modalSectionLabel}>Popular</Text>
                    {popularMakesList.map((make) => (
                      <TouchableOpacity
                        key={make}
                        style={[
                          styles.modalItem,
                          selectedMake === make && styles.modalItemSelected
                        ]}
                        onPress={() => {
                          setSelectedMake(make)
                          setSelectedModel(null)
                          setSelectedVariant(null)
                          setSelectedYear(null)
                        }}
                      >
                        <Text style={styles.modalItemText}>{make}</Text>
                        <Ionicons name="chevron-forward" size={16} color={COLORS.gray} />
                      </TouchableOpacity>
                    ))}
                  </>
                )}
                {otherMakesList.length > 0 && (
                  <>
                    <Text style={styles.modalSectionLabel}>Others</Text>
                    {otherMakesList.map((make) => (
                      <TouchableOpacity
                        key={make}
                        style={[
                          styles.modalItem,
                          selectedMake === make && styles.modalItemSelected
                        ]}
                        onPress={() => {
                          setSelectedMake(make)
                          setSelectedModel(null)
                          setSelectedVariant(null)
                          setSelectedYear(null)
                        }}
                      >
                        <Text style={styles.modalItemText}>{make}</Text>
                        <Ionicons name="chevron-forward" size={16} color={COLORS.gray} />
                      </TouchableOpacity>
                    ))}
                  </>
                )}
              </ScrollView>

              {/* Column 2: MODEL */}
              <ScrollView style={styles.modalColumn}>
                <Text style={styles.modalColumnTitle}>MODEL</Text>
                {selectedMake ? (
                  <>
                    {popularModels.length > 0 && (
                      <>
                        <Text style={styles.modalSectionLabel}>Popular</Text>
                        {popularModels.map((model) => (
                          <TouchableOpacity
                            key={model}
                            style={[
                              styles.modalItem,
                              selectedModel === model && styles.modalItemSelected
                            ]}
                            onPress={() => {
                              setSelectedModel(model)
                              setSelectedVariant(null)
                              setSelectedYear(null)
                            }}
                          >
                            <Text style={styles.modalItemText}>{model}</Text>
                            <Ionicons name="chevron-forward" size={16} color={COLORS.gray} />
                          </TouchableOpacity>
                        ))}
                      </>
                    )}
                    {otherModels.length > 0 && (
                      <>
                        <Text style={styles.modalSectionLabel}>Others</Text>
                        {otherModels.map((model) => (
                          <TouchableOpacity
                            key={model}
                            style={[
                              styles.modalItem,
                              selectedModel === model && styles.modalItemSelected
                            ]}
                            onPress={() => {
                              setSelectedModel(model)
                              setSelectedVariant(null)
                              setSelectedYear(null)
                            }}
                          >
                            <Text style={styles.modalItemText}>{model}</Text>
                            <Ionicons name="chevron-forward" size={16} color={COLORS.gray} />
                          </TouchableOpacity>
                        ))}
                      </>
                    )}
                  </>
                ) : (
                  <Text style={styles.modalPlaceholder}>Select a Make first</Text>
                )}
              </ScrollView>

              {/* Column 3: VERSION (OPTIONAL) */}
              <ScrollView style={styles.modalColumn}>
                <Text style={styles.modalColumnTitle}>
                  VERSION <Text style={styles.optionalText}>(OPTIONAL)</Text>
                </Text>
                {selectedMake && selectedModel ? (
                  variants.length > 0 ? (
                  variants.map((variant) => (
                    <TouchableOpacity
                      key={variant}
                      style={[
                        styles.modalItem,
                        selectedVariant === variant && styles.modalItemSelected
                      ]}
                      onPress={() => {
                        setSelectedVariant(variant)
                        setSelectedYear(null)
                      }}
                    >
                      <Text style={styles.modalItemText}>{variant}</Text>
                      {selectedVariant === variant && years.length > 0 && (
                        <View style={styles.yearsContainer}>
                          {years.map((year) => (
                            <TouchableOpacity
                              key={year}
                              style={[
                                styles.yearItem,
                                selectedYear === year && styles.yearItemSelected
                              ]}
                              onPress={(e) => {
                                e.stopPropagation()
                                setSelectedYear(year)
                              }}
                            >
                              <Text style={styles.yearText}>{year}</Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      )}
                    </TouchableOpacity>
                  ))
                ) : (
                  <Text style={styles.modalPlaceholder}>No variants available</Text>
                )
              ) : (
                <Text style={styles.modalPlaceholder}>Select Make and Model first</Text>
              )}
              </ScrollView>
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.doneButton} onPress={handleDone}>
                <Text style={styles.doneButtonText}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.black,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  titleSection: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: COLORS.black,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.darkGray,
  },
  selectionBox: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: "#e1e1e1",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  carSelectionRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  carInputWrapper: {
    flex: 1,
  },
  carInputHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  carInputLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.black,
  },
  clearText: {
    fontSize: 12,
    color: COLORS.primary,
  },
  carInput: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 2,
    borderColor: "#e1e1e1",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#f9f9f9",
  },
  carInputText: {
    fontSize: 12,
    color: COLORS.black,
    flex: 1,
  },
  carInputPlaceholder: {
    fontSize: 12,
    color: COLORS.gray,
    flex: 1,
  },
  compareButton: {
    backgroundColor: "#16a34a",
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
  },
  compareButtonDisabled: {
    backgroundColor: "#b3b3b3",
  },
  compareButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "600",
  },
  comparisonTable: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: "#e1e1e1",
    overflow: "hidden",
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f3f4f6",
    borderBottomWidth: 2,
    borderBottomColor: "#e1e1e1",
  },
  specColumn: {
    width: 120,
    padding: 12,
    borderRightWidth: 1,
    borderRightColor: "#e1e1e1",
  },
  carColumn: {
    width: 150,
    padding: 12,
    alignItems: "center",
    borderRightWidth: 1,
    borderRightColor: "#e1e1e1",
  },
  specHeaderText: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.black,
  },
  carImageContainer: {
    width: 120,
    height: 80,
    backgroundColor: "#f3f4f6",
    borderRadius: 8,
    marginBottom: 8,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  carImage: {
    width: "100%",
    height: "100%",
  },
  carName: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.black,
    textAlign: "center",
    marginBottom: 4,
  },
  carPrice: {
    fontSize: 11,
    color: COLORS.primary,
    fontWeight: "600",
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  tableRowEven: {
    backgroundColor: COLORS.white,
  },
  tableRowOdd: {
    backgroundColor: "#f9f9f9",
  },
  specLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.black,
  },
  specValue: {
    fontSize: 12,
    color: COLORS.darkGray,
    textAlign: "center",
  },
  loadingContainer: {
    padding: 40,
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: COLORS.darkGray,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "90%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.black,
  },
  modalBody: {
    flexDirection: "row",
    height: 400,
  },
  modalColumn: {
    flex: 1,
    borderRightWidth: 1,
    borderRightColor: "#f0f0f0",
    padding: 12,
  },
  modalColumnTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.black,
    marginBottom: 12,
    textTransform: "uppercase",
  },
  modalSectionLabel: {
    fontSize: 10,
    fontWeight: "600",
    color: COLORS.gray,
    marginTop: 8,
    marginBottom: 4,
    textTransform: "uppercase",
  },
  modalItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 6,
    marginBottom: 4,
  },
  modalItemSelected: {
    backgroundColor: "#dbeafe",
  },
  modalItemText: {
    fontSize: 14,
    color: COLORS.black,
    flex: 1,
  },
  modalPlaceholder: {
    fontSize: 12,
    color: COLORS.gray,
    textAlign: "center",
    marginTop: 20,
  },
  optionalText: {
    fontSize: 10,
    fontWeight: "400",
    color: COLORS.primary,
  },
  yearsContainer: {
    marginTop: 8,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
  },
  yearItem: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
    backgroundColor: "#f3f4f6",
    marginRight: 4,
    marginBottom: 4,
  },
  yearItemSelected: {
    backgroundColor: "#bfdbfe",
  },
  yearText: {
    fontSize: 10,
    color: COLORS.black,
  },
  modalFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
    alignItems: "center",
  },
  doneButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 8,
  },
  doneButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "600",
  },
})

export default CarComparisonScreen
