import React, { useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import Modal from "react-native-modal";

interface PackageSelectionModalProps {
  isVisible: boolean;
  onClose: () => void;
  onSelectPackage: (days: number, price: number) => void;
}

const PACKAGE_OPTIONS = [
  { days: 7, price: 1500 },
  { days: 15, price: 3000 },
  { days: 30, price: 5000 },
];

const PackageSelectionModal: React.FC<PackageSelectionModalProps> = ({
  isVisible,
  onClose,
  onSelectPackage,
}) => {
  // Optimize package list rendering
  const renderPackages = useMemo(
    () =>
      PACKAGE_OPTIONS.map(({ days, price }) => (
        <TouchableOpacity
          key={days}
          style={styles.packageButton}
          onPress={() => onSelectPackage(days, price)}
          activeOpacity={0.7}
        >
          <Text style={styles.packageText}>
            {days} Days - {price.toLocaleString()} PKR
          </Text>
        </TouchableOpacity>
      )),
    [onSelectPackage]
  );

  return (
    <Modal
      isVisible={isVisible}
      onBackdropPress={onClose}
      animationIn="slideInUp"
      animationOut="slideOutDown"
      backdropOpacity={0.5}
      style={styles.modalContainer}
    >
      <View style={styles.modalContent}>
        {/* Modal Header */}
        <Text style={styles.header}>Choose Your Package</Text>

        {/* Render Package Options */}
        {renderPackages}

        {/* Cancel Button */}
        <TouchableOpacity style={styles.cancelButton} onPress={onClose} activeOpacity={0.7}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    justifyContent: "flex-end",
    margin: 0,
  },
  modalContent: {
    backgroundColor: "#fff",
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
  },
  header: {
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 15,
    color: "#333",
  },
  packageButton: {
    backgroundColor: "#CD0100",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 10,
    shadowColor: "#CD0100",
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3,
  },
  packageText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  cancelButton: {
    marginTop: 10,
    alignItems: "center",
    paddingVertical: 10,
  },
  cancelText: {
    fontSize: 16,
    color: "#CD0100",
    fontWeight: "bold",
  },
});

export default PackageSelectionModal;
