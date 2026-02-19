import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from "react-native";
import Modal from "react-native-modal";

interface KilometerRangeModalProps {
  isVisible: boolean;
  onClose: () => void;
  minMileage: number;
  maxMileage: number;
  setMinMileage: (value: number) => void;
  setMaxMileage: (value: number) => void;
}

const KilometerRangeModal: React.FC<KilometerRangeModalProps> = ({ 
  isVisible,
  onClose,
  minMileage,
  maxMileage,
  setMinMileage,
  setMaxMileage, 
}) => {
  const [localMinMileage, setLocalMinMileage] = useState(minMileage.toString());
  const [localMaxMileage, setLocalMaxMileage] = useState(maxMileage.toString());
  const minMileageInputRef = useRef<TextInput>(null);
  const maxMileageInputRef = useRef<TextInput>(null);

  // Update local state when props change (when modal opens)
  useEffect(() => {
    if (isVisible) {
      setLocalMinMileage(minMileage.toString());
      setLocalMaxMileage(maxMileage.toString());
    }
  }, [isVisible, minMileage, maxMileage]);

  const handleApply = () => {
    const min = localMinMileage === "" ? 0 : parseInt(localMinMileage) || 0;
    const max = localMaxMileage === "" ? 200000 : parseInt(localMaxMileage) || 200000;
    setMinMileage(Math.max(0, min));
    setMaxMileage(Math.max(0, max));
    onClose();
  };

  const handleReset = () => {
    setLocalMinMileage("0");
    setLocalMaxMileage("200000");
    setMinMileage(0);
    setMaxMileage(200000);
  };

  return (
    <Modal
      isVisible={isVisible}
      onBackdropPress={onClose}
      swipeDirection="down"
      onSwipeComplete={onClose}
      style={styles.modalContainer}
      avoidKeyboard={Platform.OS === 'ios'}
    >
      <View style={styles.modalContent}>
        {/* Header: Kilometer Range & Reset */}
        <View style={styles.header}>
          <Text style={styles.headerText}>Kilometer Range</Text>
          <TouchableOpacity onPress={handleReset}>
            <Text style={styles.resetText}>Reset</Text>
          </TouchableOpacity>
        </View>

        {/* Instruction Text */}
        <Text style={styles.instructionText}>Set your desired kilometers range</Text>

        {/* Kilometer Inputs */}
        <View style={styles.rangeInputs}>
          <View style={styles.kmInputWrapper}>
            <TextInput
              ref={minMileageInputRef}
              style={styles.input}
              value={localMinMileage}
              keyboardType="number-pad"
              onChangeText={(value) => {
                const cleaned = value.replace(/[^0-9]/g, '');
                setLocalMinMileage(cleaned);
              }}
              onBlur={() => {
                const num = localMinMileage === "" ? 0 : parseInt(localMinMileage) || 0;
                setLocalMinMileage(num.toString());
              }}
              placeholder="0"
              placeholderTextColor="#999"
              blurOnSubmit={false}
              returnKeyType="next"
              onSubmitEditing={() => maxMileageInputRef.current?.focus()}
            />
            <Text style={styles.unitText}>km</Text>
          </View>
          <Text style={styles.toText}>to</Text>
          <View style={styles.kmInputWrapper}>
            <TextInput
              ref={maxMileageInputRef}
              style={styles.input}
              value={localMaxMileage}
              keyboardType="number-pad"
              onChangeText={(value) => {
                const cleaned = value.replace(/[^0-9]/g, '');
                setLocalMaxMileage(cleaned);
              }}
              onBlur={() => {
                const num = localMaxMileage === "" ? 200000 : parseInt(localMaxMileage) || 200000;
                setLocalMaxMileage(num.toString());
              }}
              placeholder="200000"
              placeholderTextColor="#999"
              blurOnSubmit={false}
              returnKeyType="done"
              onSubmitEditing={handleApply}
            />
            <Text style={styles.unitText}>km</Text>
          </View>
        </View>

        {/* Show Results Button */}
        <TouchableOpacity style={styles.button} onPress={handleApply}>
          <Text style={styles.buttonText}>Show Result</Text>
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
    backgroundColor: "white",
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: "30%",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  headerText: {
    fontSize: 18,
    fontWeight: "bold",
  },
  resetText: {
    fontSize: 14,
    color: "#CD0100",
    fontWeight: "bold",
  },
  instructionText: {
    fontSize: 14,
    color: "#666",
    textAlign: "left",
    marginBottom: 20,
  },
  rangeInputs: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  kmInputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    width: "40%",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    textAlign: "left",
    padding: 0,
    color: "#000",
  },
  unitText: {
    fontSize: 16,
    color: "#666",
    marginLeft: 5,
  },
  toText: {
    fontSize: 16,
    alignSelf: "center",
  },
  button: {
    backgroundColor: "#CD0100",
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
    width: "100%",
    alignSelf: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default KilometerRangeModal;
