import React, { useEffect } from "react";
import { View, Text, Modal, TouchableOpacity, ScrollView, StyleSheet } from "react-native";
import { FontAwesome } from "@expo/vector-icons";

interface CarDetailsModalProps {
  visible: boolean;
  onClose: () => void;
  carDetails: any; // Use any to allow all fields
}

const NewCarDetailsModal: React.FC<CarDetailsModalProps> = ({ visible, onClose, carDetails }) => {
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
      console.log('🔍 NewCarDetailsModal - carDetails received:', carDetails);
      console.log('🔍 Available fields:', Object.keys(carDetails || {}));
      console.log('🔍 Sample fields:', {
        dimensions: carDetails?.dimensions,
        groundClearance: carDetails?.groundClearance,
        horsepower: carDetails?.horsepower,
        topSpeed: carDetails?.topSpeed,
        transmission: carDetails?.transmission,
      });
    }
  }, [visible, carDetails]);

   return (
    <Modal animationType="slide" transparent={true} visible={visible} onRequestClose={onClose}>
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          
          {/* Close Button */}
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <FontAwesome name="close" size={24} color="#CD0100" />
          </TouchableOpacity>

          {/* Heading */}
          <Text style={styles.modalHeading}>Car Overview</Text>

          {/* Scrollable Content */}
          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
  {[
    { label: "Dimensions", value: getFieldValue('dimensions', ' mm', ['dimension']) },
    { label: "Ground Clearance", value: getFieldValue('groundClearance', ' mm', ['ground_clearance', 'groundClearance']) },
    { label: "Horsepower", value: getFieldValue('horsepower', ' hp', ['horse_power', 'hp']) },
    { label: "Boot Space", value: getFieldValue('bootSpace', ' liters', ['boot_space', 'bootSpace', 'trunkSpace']) },
    { label: "Top Speed", value: getFieldValue('topSpeed', ' km/h', ['top_speed', 'maxSpeed', 'max_speed']) },
    { label: "Transmission", value: getFieldValue('transmission', '', ['transmissionType', 'transmission_type', 'gearbox']) },
    { label: "Transmission Type", value: getFieldValue('transmissionType', '', ['transmission_type', 'gearbox']) },
    { label: "Kerb-Weight", value: getFieldValue('kerbWeight', ' kg', ['kerb_weight', 'weight', 'curbWeight']) },
    { label: "Seating Capacity", value: getFieldValue('seatingCapacity', '', ['seating_capacity', 'seats', 'seating']) },
    { label: "Tyre Size", value: getFieldValue('tyreSize', '', ['tyre_size', 'tireSize', 'tire_size']) },
    { label: "Overall Length", value: getFieldValue('overallLength', ' mm', ['overall_length', 'length']) },
    { label: "Overall Width", value: getFieldValue('overallWidth', ' mm', ['overall_width', 'width']) },
    { label: "Overall Height", value: getFieldValue('overallHeight', ' mm', ['overall_height', 'height']) },
    { label: "Wheel Base", value: getFieldValue('wheelBase', ' mm', ['wheel_base', 'wheelbase']) },
    { label: "Number of Doors", value: getFieldValue('numberOfDoors', '', ['number_of_doors', 'doors', 'doorCount']) },
    { label: "Number of Airbags", value: getFieldValue('numberOfAirbags', '', ['number_of_airbags', 'airbags', 'airbagCount']) },
    { label: "Number of Speakers", value: getFieldValue('numberOfSpeakers', '', ['number_of_speakers', 'speakers', 'speakerCount']) },
    { label: "Engine Type", value: getFieldValue('engineType', '', ['engine_type', 'enginetype', 'engine']) },
    { label: "Power", value: getFieldValue('power', ' rpm', ['powerOutput', 'power_output']) },
    { label: "Gearbox", value: getFieldValue('gearbox', '', ['transmission', 'transmissionType']) },
    { label: "Steering Type", value: getFieldValue('steeringType', '', ['steering_type', 'steering']) },
    { label: "Power Assist", value: getFieldValue('powerAssisted', '', ['power_assisted', 'powerAssist', 'powerSteering']) },
    { label: "Minimum Turning Radius", value: getFieldValue('minTurningRadius', ' meters', ['min_turning_radius', 'turningRadius', 'turning_radius']) },
    { label: "Front Suspension", value: getFieldValue('frontSuspension', '', ['front_suspension', 'frontSusp']) },
    { label: "Rear Suspension", value: getFieldValue('rearSuspension', '', ['rear_suspension', 'rearSusp']) },
    { label: "Front Brakes", value: getFieldValue('frontBrakes', '', ['front_brakes', 'frontBrake']) },
    { label: "Rear Brakes", value: getFieldValue('rearBrakes', '', ['rear_brakes', 'rearBrake']) },
    { label: "Wheel Type", value: getFieldValue('wheelType', '', ['wheel_type', 'wheels']) },
    { label: "Wheel Size", value: getFieldValue('wheelSize', ' inches', ['wheel_size', 'wheelDiameter']) },
    { label: "Spare Tyre", value: getFieldValue('spareTyre', '', ['spare_tyre', 'spareTire', 'spare_tire']) },
    { label: "PCD", value: getFieldValue('pcd', '', ['pcdValue', 'pcd_value']) },
    { label: "Information Cluster", value: getFieldValue('infoCluster', '', ['info_cluster', 'instrumentCluster', 'instrument_cluster']) },
    
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
    height: "60%", // Covers 70% of the screen
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
});

export default NewCarDetailsModal;
