import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Switch,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import MultiSlider from "@ptomasroos/react-native-multi-slider";

interface RentalVehicleFilterModalProps {
  visible: boolean;
  onClose: () => void;
  onApplyFilters: (filters: {
    // Basic Filters
    brands: string[];
    models: string[];
    years: { min: number; max: number };
    registrationCities: string[];
    locations: string[];
    bodyColors: string[];
    budgetRange: { min: number; max: number };
    tenure: { min: number; max: number };
    tenureUnit: string; // Days or Months
    driveMode: string[];
    paymentType: string[];
    fuelTypes: string[];
    engineCapacity: { min: number; max: number };
    transmissions: string[];
    assemblies: string[];
    bodyTypes: string[];
  }) => void;
}

const RentalVehicleFilterModal = ({ visible, onClose, onApplyFilters }: RentalVehicleFilterModalProps) => {
  // Basic Filter States
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [selectedModels, setSelectedModels] = useState<string[]>([]);
  const [yearRange, setYearRange] = useState({ min: 1970, max: new Date().getFullYear() });
  const [selectedRegistrationCities, setSelectedRegistrationCities] = useState<string[]>([]);
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const [selectedBodyColors, setSelectedBodyColors] = useState<string[]>([]);
  const [budgetRange, setBudgetRange] = useState({ min: 0, max: 100000 });
  const [tenureRange, setTenureRange] = useState({ min: 1, max: 30 });
  const [tenureUnit, setTenureUnit] = useState("Days");
  const [selectedDriveMode, setSelectedDriveMode] = useState<string[]>([]);
  const [selectedPaymentType, setSelectedPaymentType] = useState<string[]>([]);
  const [selectedFuelTypes, setSelectedFuelTypes] = useState<string[]>([]);
  const [engineRange, setEngineRange] = useState({ min: 0, max: 6000 });
  const [selectedTransmissions, setSelectedTransmissions] = useState<string[]>([]);
  const [selectedAssemblies, setSelectedAssemblies] = useState<string[]>([]);
  const [selectedBodyTypes, setSelectedBodyTypes] = useState<string[]>([]);

  // Data Arrays
  // Comprehensive Pakistani Car Brands
  const brands = [
    "All Brands", 
    // Pakistani Popular Brands
    "Suzuki", "Toyota", "Honda", "Kia", "Hyundai", "MG", "Changan", "BYD",
    // Luxury Brands
    "BMW", "Audi", "Mercedes Benz", "Porsche", "Lexus", "Volvo", "Land Rover", "Jaguar",
    // Japanese Brands
    "Nissan", "Mazda", "Mitsubishi", "Daihatsu",
    // American Brands
    "Ford", "Chevrolet", "Jeep", "Tesla",
    // European Brands
    "Volkswagen", "Peugeot", "Alfa Romeo", "Fiat",
    // Chinese Brands
    "Proton", "DFSK", "Haval", "Chery", "BAIC", "ORA", "Deepal", "Seres", "Tank", "Honri", "GUGO",
    // Pakistani Local Brands
    "United", "Prince", "FAW",
    // Commercial
    "Isuzu", "JMC", "JW Forland", "Daehan"
  ];

  const models = [
    "All Models",
    // Suzuki Models
    "Alto", "Cultus", "Swift", "Wagon R", "Every", "Ravi", "Jimny", "Bolan", "Mehran", "APV", "Ciaz", "Baleno", "Celerio", "Ertiga",
    // Toyota Models  
    "Corolla", "Yaris", "Fortuner", "Hilux", "Prius", "Camry", "Land Cruiser", "Prado", "Corolla Cross", "Rush", "Hiace", "Aqua", "Vitz", "Crown",
    // Honda Models
    "Civic", "City", "BR-V", "HR-V", "Vezel", "CR-V", "Fit", "Accord", "Jazz",
    // Kia Models
    "Picanto", "Sportage", "Sorento", "Stonic", "Grand Carnival", "EV5", "Forte", "K5", "Seltos", "Soul", "Niro",
    // Hyundai Models
    "Tucson", "Elantra", "Sonata", "Santa Fe", "Staria", "H-100", "Ioniq 5", "Ioniq 6", "Kona", "Venue", "i10", "i20",
    // MG Models
    "HS", "ZS", "ZS EV", "4", "5 EV", "3", "6",
    // Changan Models
    "Alsvin", "Oshan X7", "Karvaan", "M9",
    // BYD Models
    "Atto 3", "Seal", "Dolphin",
    // BMW Models
    "3 Series", "5 Series", "7 Series", "X1", "X3", "X5", "X7", "i4", "iX3",
    // Audi Models
    "A3", "A4", "A6", "A8", "Q2", "Q3", "Q5", "Q7", "Q8", "e-tron",
    // Mercedes Models
    "C Class", "E Class", "S Class", "GLC", "GLE", "G Class", "A Class",
    // Other Popular Models
    "Mira", "Move", "Cuore", "Hijet", "Passo", "Note", "Sunny", "Dayz", "Latio", "Wrangler", "Compass", "Cherokee",
    // Commercial
    "D-Max", "Shehzore", "Safari", "Vigus"
  ];

  const cities = [
    "All Cities", "Lahore", "Karachi", "Islamabad", "Rawalpindi", "Multan", 
    "Faisalabad", "Peshawar", "Quetta", "Sialkot", "Gujranwala", "Sargodha", 
    "Bahawalpur", "Sukkur", "Larkana", "Sheikhupura", "Rahim Yar Khan", "Gujrat",
    "Mardan", "Mingora", "Nawabshah", "Chiniot", "Kotri", "Kāmoke", "Hafizabad", "Kohat"
  ];

  const bodyColors = [
    "All Colors", "White", "Black", "Silver", "Gray", "Red", "Blue", "Green", 
    "Yellow", "Orange", "Brown", "Purple", "Gold", "Beige", "Maroon", "Navy",
    "Pearl White", "Metallic Silver", "Champagne", "Bronze", "Copper"
  ];

  const driveModes = [
    "All Drive Modes", "With Driver", "Self Drive"
  ];

  const paymentTypes = [
    "All Payment Types", "Advance + Security", "Full Payment", "Monthly Payment", "Weekly Payment"
  ];

  const fuelTypes = [
    "All Fuel Types", "Petrol", "Diesel", "Hybrid", "Electric", "CNG", "LPG"
  ];

  const transmissions = [
    "All Transmissions", "Manual", "Automatic", "CVT", "AMT", "DCT"
  ];

  const assemblies = [
    "All Assemblies", "Local", "Imported"
  ];

  const bodyTypes = [
    "All Body Types", "Sedan", "Hatchback", "SUV", "Crossover", "Coupe", 
    "Convertible", "Wagon", "Pickup", "Van", "Minivan", "Truck", "Jeep"
  ];

  const tenureUnits = ["Days", "Months"];

  // Toggle selection helper
  const toggleSelection = <T,>(
    option: T, 
    setSelected: React.Dispatch<React.SetStateAction<T[]>>, 
    selectedList: T[]
  ) => {
    if (option === "All Brands" || option === "All Models" || option === "All Cities" || 
        option === "All Colors" || option === "All Drive Modes" || option === "All Payment Types" ||
        option === "All Fuel Types" || option === "All Transmissions" || option === "All Assemblies" || 
        option === "All Body Types") {
      setSelected(selectedList.includes(option) ? [] : [option]);
    } else {
      if (selectedList.includes(option)) {
        setSelected(selectedList.filter((item) => item !== option));
      } else {
        setSelected([...selectedList, option]);
      }
    }
  };

  const handleReset = () => {
    setSelectedBrands([]);
    setSelectedModels([]);
    setYearRange({ min: 1970, max: new Date().getFullYear() });
    setSelectedRegistrationCities([]);
    setSelectedLocations([]);
    setSelectedBodyColors([]);
    setBudgetRange({ min: 0, max: 100000 });
    setTenureRange({ min: 1, max: 30 });
    setTenureUnit("Days");
    setSelectedDriveMode([]);
    setSelectedPaymentType([]);
    setSelectedFuelTypes([]);
    setEngineRange({ min: 0, max: 6000 });
    setSelectedTransmissions([]);
    setSelectedAssemblies([]);
    setSelectedBodyTypes([]);
  };

  const handleApplyFilters = () => {
    onApplyFilters({
      brands: selectedBrands || [],
      models: selectedModels || [],
      years: yearRange || { min: 1970, max: new Date().getFullYear() },
      registrationCities: selectedRegistrationCities || [],
      locations: selectedLocations || [],
      bodyColors: selectedBodyColors || [],
      budgetRange: budgetRange || { min: 0, max: 100000 },
      tenure: tenureRange || { min: 1, max: 30 },
      tenureUnit: tenureUnit || "Days",
      driveMode: selectedDriveMode || [],
      paymentType: selectedPaymentType || [],
      fuelTypes: selectedFuelTypes || [],
      engineCapacity: engineRange || { min: 0, max: 6000 },
      transmissions: selectedTransmissions || [],
      assemblies: selectedAssemblies || [],
      bodyTypes: selectedBodyTypes || [],
    });
    onClose();
  };

  const FilterSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <View style={styles.filterSection}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );

  const MultiSelectButtons = ({ 
    options, 
    selected, 
    onToggle, 
    horizontal = true 
  }: { 
    options: string[]; 
    selected: string[]; 
    onToggle: (option: string) => void;
    horizontal?: boolean;
  }) => (
    <ScrollView 
      horizontal={horizontal} 
      showsHorizontalScrollIndicator={false} 
      style={horizontal ? styles.rowContainer : undefined}
    >
      {options.map((option, index) => (
        <TouchableOpacity
          key={index}
          style={[
            styles.filterButton,
            selected.includes(option) && styles.selectedFilter,
            { marginRight: horizontal ? 10 : 5, marginBottom: horizontal ? 0 : 5 }
          ]}
          onPress={() => onToggle(option)}
        >
          <Text style={[
            styles.filterButtonText,
            selected.includes(option) && styles.selectedFilterText
          ]}>
            {option}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  const RangeSlider = ({ 
    title, 
    value, 
    onValueChange, 
    min, 
    max, 
    step = 1,
    unit = ""
  }: {
    title: string;
    value: { min: number; max: number };
    onValueChange: (value: { min: number; max: number }) => void;
    min: number;
    max: number;
    step?: number;
    unit?: string;
  }) => {
    const handleChange = useCallback((values: number[]) => {
      onValueChange({ min: values[0], max: values[1] });
    }, [onValueChange]);
    
    return (
      <View style={styles.rangeContainer}>
        <Text style={styles.rangeTitle}>{title}</Text>
        <View style={styles.rangeValues}>
          <Text style={styles.rangeValue}>{value.min.toLocaleString()}{unit}</Text>
          <Text style={styles.rangeValue}>{value.max.toLocaleString()}{unit}</Text>
        </View>
        <MultiSlider
          values={[value.min, value.max]}
          onValuesChange={handleChange}
          min={min}
          max={max}
          step={step}
          sliderLength={300}
          enableLabel={false}
          snapped={false}
          allowOverlap={false}
          isMarkersSeparated={true}
          shouldRasterizeIOS={true}
          renderToHardwareTextureAndroid={true}
          touchDimensions={{
            height: 80,
            width: 80,
            slipDisplacement: 500,
          }}
          pressedMarkerStyle={styles.sliderThumb}
          selectedStyle={styles.sliderSelected}
          unselectedStyle={styles.sliderUnselected}
          trackStyle={styles.sliderTrack}
          markerStyle={styles.sliderThumb}
          containerStyle={[styles.sliderContainer, { height: 60 }]}
        />
      </View>
    );
  };

  const TenureUnitSelector = () => (
    <View style={styles.tenureUnitContainer}>
      <Text style={styles.tenureUnitLabel}>Tenure Unit:</Text>
      <View style={styles.tenureUnitButtons}>
        {tenureUnits.map((unit) => (
          <TouchableOpacity
            key={unit}
            style={[
              styles.tenureUnitButton,
              tenureUnit === unit && styles.selectedTenureUnit
            ]}
            onPress={() => setTenureUnit(unit)}
          >
            <Text style={[
              styles.tenureUnitButtonText,
              tenureUnit === unit && styles.selectedTenureUnitText
            ]}>
              {unit}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

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
            <Text style={styles.modalTitle}>Rental Vehicle Filters</Text>
            <TouchableOpacity onPress={handleReset}>
              <Text style={styles.resetText}>Reset</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={true}>
            
            {/* Brand Filter */}
            <FilterSection title="Brand Name">
              <MultiSelectButtons
                options={brands}
                selected={selectedBrands}
                onToggle={(option) => toggleSelection(option, setSelectedBrands, selectedBrands)}
              />
            </FilterSection>

            {/* Model Filter */}
            <FilterSection title="Model Name">
              <MultiSelectButtons
                options={models}
                selected={selectedModels}
                onToggle={(option) => toggleSelection(option, setSelectedModels, selectedModels)}
              />
            </FilterSection>

            {/* Year Range */}
            <FilterSection title="Model Year">
              <RangeSlider
                title="Year Range"
                value={yearRange}
                onValueChange={setYearRange}
                min={1970}
                max={new Date().getFullYear()}
                step={1}
              />
            </FilterSection>

            {/* Registration City */}
            <FilterSection title="Registration City">
              <MultiSelectButtons
                options={cities}
                selected={selectedRegistrationCities}
                onToggle={(option) => toggleSelection(option, setSelectedRegistrationCities, selectedRegistrationCities)}
              />
            </FilterSection>

            {/* Location */}
            <FilterSection title="Location (City)">
              <MultiSelectButtons
                options={cities}
                selected={selectedLocations}
                onToggle={(option) => toggleSelection(option, setSelectedLocations, selectedLocations)}
              />
            </FilterSection>

            {/* Body Color */}
            <FilterSection title="Body Color">
              <MultiSelectButtons
                options={bodyColors}
                selected={selectedBodyColors}
                onToggle={(option) => toggleSelection(option, setSelectedBodyColors, selectedBodyColors)}
              />
            </FilterSection>

            {/* Budget Range */}
            <FilterSection title="Budget Range (PKR)">
              <RangeSlider
                title="Budget Range"
                value={budgetRange}
                onValueChange={setBudgetRange}
                min={0}
                max={100000}
                step={1000}
                unit=" PKR"
              />
            </FilterSection>

            {/* Tenure */}
            <FilterSection title="Car Rental Desired Tenure/Time">
              <TenureUnitSelector />
              <RangeSlider
                title={`Tenure Range (${tenureUnit})`}
                value={tenureRange}
                onValueChange={setTenureRange}
                min={1}
                max={tenureUnit === "Days" ? 30 : 12}
                step={1}
                unit={` ${tenureUnit.toLowerCase()}`}
              />
            </FilterSection>

            {/* Drive Mode */}
            <FilterSection title="Car Drive Mode">
              <MultiSelectButtons
                options={driveModes}
                selected={selectedDriveMode}
                onToggle={(option) => toggleSelection(option, setSelectedDriveMode, selectedDriveMode)}
              />
            </FilterSection>

            {/* Payment Type */}
            <FilterSection title="Payment Type">
              <MultiSelectButtons
                options={paymentTypes}
                selected={selectedPaymentType}
                onToggle={(option) => toggleSelection(option, setSelectedPaymentType, selectedPaymentType)}
              />
            </FilterSection>

            {/* Fuel Type */}
            <FilterSection title="Fuel Type">
              <MultiSelectButtons
                options={fuelTypes}
                selected={selectedFuelTypes}
                onToggle={(option) => toggleSelection(option, setSelectedFuelTypes, selectedFuelTypes)}
              />
            </FilterSection>

            {/* Engine Capacity */}
            <FilterSection title="Engine Capacity (CC)">
              <RangeSlider
                title="Engine Capacity"
                value={engineRange}
                onValueChange={setEngineRange}
                min={0}
                max={6000}
                step={100}
                unit=" cc"
              />
            </FilterSection>

            {/* Transmission */}
            <FilterSection title="Transmission">
              <MultiSelectButtons
                options={transmissions}
                selected={selectedTransmissions}
                onToggle={(option) => toggleSelection(option, setSelectedTransmissions, selectedTransmissions)}
              />
            </FilterSection>

            {/* Assembly */}
            <FilterSection title="Assembly">
              <MultiSelectButtons
                options={assemblies}
                selected={selectedAssemblies}
                onToggle={(option) => toggleSelection(option, setSelectedAssemblies, selectedAssemblies)}
              />
            </FilterSection>

            {/* Body Type */}
            <FilterSection title="Body Type">
              <MultiSelectButtons
                options={bodyTypes}
                selected={selectedBodyTypes}
                onToggle={(option) => toggleSelection(option, setSelectedBodyTypes, selectedBodyTypes)}
              />
            </FilterSection>

          </ScrollView>

          {/* Fixed Bottom Button */}
          <View style={styles.bottomContainer}>
            <TouchableOpacity style={styles.applyButton} onPress={handleApplyFilters}>
              <Text style={styles.applyButtonText}>Apply Filters</Text>
            </TouchableOpacity>
          </View>
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
    marginVertical: 5,
  },
  filterButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    backgroundColor: "#F8F8F8",
    marginRight: 10,
    marginBottom: 5,
  },
  selectedFilter: {
    backgroundColor: "#CD0100",
    borderColor: "#CD0100",
  },
  filterButtonText: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  selectedFilterText: {
    color: "#fff",
    fontWeight: "600",
  },
  rangeContainer: {
    marginVertical: 10,
  },
  rangeTitle: {
    fontSize: 14,
    color: "#666",
    marginBottom: 5,
  },
  rangeValues: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  rangeValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#CD0100",
  },
  sliderContainer: {
    height: 40,
  },
  sliderSelected: {
    backgroundColor: "#CD0100",
  },
  sliderUnselected: {
    backgroundColor: "#E0E0E0",
  },
  sliderTrack: {
    height: 4,
    borderRadius: 2,
  },
  sliderThumb: {
    backgroundColor: "#CD0100",
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  tenureUnitContainer: {
    marginVertical: 10,
  },
  tenureUnitLabel: {
    fontSize: 14,
    color: "#666",
    marginBottom: 10,
  },
  tenureUnitButtons: {
    flexDirection: "row",
    marginBottom: 15,
  },
  tenureUnitButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    backgroundColor: "#F8F8F8",
    marginRight: 10,
  },
  selectedTenureUnit: {
    backgroundColor: "#CD0100",
    borderColor: "#CD0100",
  },
  tenureUnitButtonText: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  selectedTenureUnitText: {
    color: "#fff",
    fontWeight: "600",
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
});

export default RentalVehicleFilterModal;
