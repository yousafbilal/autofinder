import React from "react";
import { View, Text, Modal, TouchableOpacity, ScrollView, StyleSheet } from "react-native";
import { FontAwesome } from "@expo/vector-icons";

interface CarDetailsModalProps {
  visible: boolean;
  onClose: () => void;
  carDetails: {
    kmDriven: number;
    assembly: string;
    bodyType: string;
    bodyColor: string;
    fuelType: string,
    registrationCity:string,
    engineCapacity: string;
    traveled:string;
    transmission: string;
  };  // Define the structure of carDetails
}

const CarDetailsModal: React.FC<CarDetailsModalProps> = ({ visible, onClose, carDetails }) => {
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
    { label: "Body Type", value: carDetails.bodyType },
    { label: "Registration City", value: carDetails.registrationCity },
    { label: "Body Color", value: carDetails.bodyColor }, // Fixed here
    { label: "Engine Capacity", value: carDetails.engineCapacity + " cc" },
    { label: "Fuel Type", value: carDetails.fuelType }, // Fixed here
    { label: "Transmission", value: carDetails.transmission }, // Fixed here
    { label: "Assembly", value: carDetails.assembly }, // Fixed here
    { label: "Mileage", value: carDetails.kmDriven + " km " },
  ].map((item, index) => (
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

export default CarDetailsModal;
