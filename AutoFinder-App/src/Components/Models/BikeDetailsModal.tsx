import React, { useEffect } from "react";
import { View, Text, Modal, TouchableOpacity, ScrollView, StyleSheet } from "react-native";
import { FontAwesome } from "@expo/vector-icons";

interface BikeDetailsModalProps {
  visible: boolean;
  onClose: () => void;
  carDetails: any; // Use any to allow all fields
}

const BikeDetailsModal: React.FC<BikeDetailsModalProps> = ({ visible, onClose, carDetails }) => {
  // Helper function to safely get field value with multiple field name variations
  const getFieldValue = (fieldName: string, suffix: string = '', alternativeNames: string[] = []) => {
    // Try primary field name first
    let value = carDetails?.[fieldName];
    
    // Try alternative field names if primary is not found
    if ((value === null || value === undefined || value === '') && alternativeNames.length > 0) {
      for (const altName of alternativeNames) {
        const altValue = carDetails?.[altName];
        if (altValue !== null && altValue !== undefined && altValue !== '') {
          value = altValue;
          break;
        }
      }
    }
    
    // Check if value is null, undefined, or empty string (but allow 0 and false)
    if (value === null || value === undefined || value === '') {
      return 'Not specified';
    }
    // Handle string "null" or "undefined"
    if (typeof value === 'string' && (value.toLowerCase() === 'null' || value.toLowerCase() === 'undefined')) {
      return 'Not specified';
    }
    // Handle number 0 - it's a valid value
    if (typeof value === 'number' && value === 0) {
      return suffix ? `0${suffix}` : '0';
    }
    // Handle boolean false - it's a valid value
    if (typeof value === 'boolean') {
      return value ? 'Yes' : 'No';
    }
    return suffix ? `${value}${suffix}` : String(value);
  };

  // Debug: Log carDetails when modal opens
  useEffect(() => {
    if (visible && carDetails) {
      console.log('🔍 BikeDetailsModal - carDetails received:', carDetails);
      console.log('🔍 Available fields:', Object.keys(carDetails || {}));
      console.log('🔍 Sample fields:', {
        bodyType: carDetails?.bodyType || carDetails?.enginetype,
        fuelType: carDetails?.fuelType,
        engineCapacity: carDetails?.engineCapacity,
        transmission: carDetails?.transmission,
        kmDriven: carDetails?.kmDriven,
      });
    }
  }, [visible, carDetails]);

  // Add null check for carDetails
  if (!carDetails) {
    return (
      <Modal animationType="slide" transparent={true} visible={visible} onRequestClose={onClose}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <FontAwesome name="close" size={24} color="#CD0100" />
            </TouchableOpacity>
            <Text style={styles.modalHeading}>Bike Overview</Text>
            <Text style={styles.errorText}>Bike details not available</Text>
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <Modal animationType="slide" transparent={true} visible={visible} onRequestClose={onClose}>
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          
          {/* Close Button */}
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <FontAwesome name="close" size={24} color="#CD0100" />
          </TouchableOpacity>

          {/* Heading */}
          <Text style={styles.modalHeading}>Bike Overview</Text>

          {/* Scrollable Content */}
          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
  {[
    // Only show fields that have actual data
    { label: "Body Type", value: getFieldValue('bodyType', '', ['bodytype', 'body_type', 'enginetype', 'engineType']) },
    { label: "Fuel Type", value: getFieldValue('fuelType', '', ['fuel_type', 'fueltype', 'fuel']) },
    { label: "Engine Capacity", value: getFieldValue('engineCapacity', ' cc', ['engine_capacity', 'enginecapacity', 'capacity', 'engineSize']) },
    { label: "Transmission", value: getFieldValue('transmission', '', ['transmissionType', 'transmission_type', 'gearbox']) },
    { label: "KM Driven", value: (() => {
      const mileage = carDetails?.kmDriven || 
                      carDetails?.mileage || 
                      carDetails?.km || 
                      carDetails?.kilometer ||
                      carDetails?.traveled ||
                      carDetails?.distance ||
                      carDetails?.odometer;
      if (mileage !== null && mileage !== undefined && mileage !== '' && mileage !== '0' && mileage !== 0) {
        const mileageNum = typeof mileage === 'string' ? parseFloat(mileage) : mileage;
        if (!isNaN(mileageNum) && mileageNum > 0) {
          return `${mileageNum.toLocaleString()} km`;
        }
      }
      return 'Not specified';
    })() },
    { label: "Body Color", value: getFieldValue('bodyColor', '', ['body_color', 'bodycolor', 'color']) },
    { label: "Registration City", value: getFieldValue('registrationCity', '', ['registration_city', 'regCity', 'city']) },
    { label: "Assembly", value: getFieldValue('assembly', '', ['assemblyType', 'assembly_type']) },
    { label: "Top Speed", value: getFieldValue('topSpeed', ' km/h', ['top_speed', 'maxSpeed', 'max_speed']) },
    { label: "Power", value: getFieldValue('power', ' bhp', ['powerOutput', 'power_output', 'horsepower']) },
    { label: "Torque", value: getFieldValue('torque', ' Nm', ['torqueValue', 'torque_value']) },
    { label: "Mileage", value: getFieldValue('mileage', ' km/l', ['mileageValue', 'mileage_value', 'fuelEfficiency']) },
    { label: "Battery Capacity", value: getFieldValue('batteryCapacity', ' kWh', ['battery_capacity', 'batterycapacity']) },
    { label: "Charging Time", value: getFieldValue('chargingTime', ' hours', ['charging_time', 'chargingtime']) },
    { label: "Kerb Weight", value: getFieldValue('kerbWeight', ' kg', ['kerb_weight', 'weight', 'curbWeight']) },
    { label: "Seat Height", value: getFieldValue('seatHeight', ' mm', ['seat_height', 'seatheight']) },
    { label: "Fuel Tank Capacity", value: getFieldValue('fuelTankCapacity', ' liters', ['fuel_tank_capacity', 'tankCapacity']) },
    { label: "Ground Clearance", value: getFieldValue('groundClearance', ' mm', ['ground_clearance', 'groundclearance']) },
    { label: "Wheelbase", value: getFieldValue('wheelbase', ' mm', ['wheel_base', 'wheelBase']) },
    { label: "Braking System", value: getFieldValue('brakingSystem', '', ['braking_system', 'brakingsystem', 'brakes']) },
    { label: "Front Brake Type", value: getFieldValue('frontBrakeType', '', ['front_brake_type', 'frontbraketype']) },
    { label: "Rear Brake Type", value: getFieldValue('rearBrakeType', '', ['rear_brake_type', 'rearbraketype']) },
    { label: "Front Suspension", value: getFieldValue('frontSuspension', '', ['front_suspension', 'frontsuspension']) },
    { label: "Rear Suspension", value: getFieldValue('rearSuspension', '', ['rear_suspension', 'rearsuspension']) },
    { label: "Tyre Type", value: getFieldValue('tyreType', '', ['tyre_type', 'tireType', 'tire_type']) },
    { label: "Wheel Type", value: getFieldValue('wheelType', '', ['wheel_type', 'wheeltype']) },
    { label: "Number of Gears", value: getFieldValue('numberOfGears', '', ['number_of_gears', 'gears', 'gearCount']) },
  ].filter(item => item.value !== 'Not specified') // Only show fields with actual data
  .map((item, index) => (
    <View key={index} style={styles.row}>
      <Text style={styles.label}>{item.label}</Text>
      <Text style={styles.value}>{item.value}</Text>
    </View>
  ))}
</ScrollView>

        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.5)", // Transparent overlay
  },
  modalContent: {
    height: "40%", // Covers 70% of the screen
    backgroundColor: "white",
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  closeButton: {
    position: "absolute",
    top: 15,
    right: 15,
    padding: 5,
  },
  modalHeading: {
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "left",
    marginBottom: 20,
  },
  scrollView: {
    marginTop: 10,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  label: {
    width: "50%", // Ensures labels are in one column
    fontSize: 14,
    color: "#666",
    fontWeight: "400",
    textAlign: "left", // Align labels to left
  },
  value: {
    width: "50%", // Ensures values are in the second column
    fontSize: 14,
    color: "#333",
    fontWeight: "bold",
    textAlign: "left", // Align values properly
  },
  errorText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginTop: 20,
  },
});

export default BikeDetailsModal;
