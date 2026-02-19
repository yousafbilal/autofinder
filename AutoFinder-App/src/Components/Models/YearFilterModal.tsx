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

interface YearFilterModalProps {
  isVisible: boolean;
  onClose: () => void;
  minYear: number;
  maxYear: number;
  setMinYear: (year: number) => void;
  setMaxYear: (year: number) => void;
}


const YearFilterModal: React.FC<YearFilterModalProps> = ({
  isVisible,
  onClose,
  minYear,
  maxYear,
  setMinYear,
  setMaxYear,
}) => {
  const currentYear = new Date().getFullYear();
  const [localMinYear, setLocalMinYear] = useState(minYear.toString());
  const [localMaxYear, setLocalMaxYear] = useState(maxYear.toString());
  const minYearInputRef = useRef<TextInput>(null);
  const maxYearInputRef = useRef<TextInput>(null);

  // Update local state when props change (when modal opens)
  useEffect(() => {
    if (isVisible) {
      setLocalMinYear(minYear.toString());
      setLocalMaxYear(maxYear.toString());
    }
  }, [isVisible, minYear, maxYear]);

  const handleApply = () => {
    const min = localMinYear === "" ? 1970 : parseInt(localMinYear) || 1970;
    const max = localMaxYear === "" ? currentYear : parseInt(localMaxYear) || currentYear;
    setMinYear(Math.max(1970, Math.min(min, currentYear)));
    setMaxYear(Math.max(1970, Math.min(max, currentYear)));
    onClose();
  };

  const handleReset = () => {
    setLocalMinYear("1970");
    setLocalMaxYear(currentYear.toString());
    setMinYear(1970);
    setMaxYear(currentYear);
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
        {/* Header: Year & Reset */}
        <View style={styles.header}>
          <Text style={styles.headerText}>Year</Text>
          <TouchableOpacity onPress={handleReset}>
            <Text style={styles.resetText}>Reset</Text>
          </TouchableOpacity>
        </View>

        {/* Instruction Text */}
        <Text style={styles.instructionText}>Select your desired year range</Text>

        {/* Year Inputs */}
        <View style={styles.yearInputs}>
          <TextInput
            ref={minYearInputRef}
            style={styles.input}
            value={localMinYear}
            keyboardType="number-pad"
            onChangeText={(value) => {
              const cleaned = value.replace(/[^0-9]/g, '');
              setLocalMinYear(cleaned);
            }}
            onBlur={() => {
              const num = localMinYear === "" ? 1970 : parseInt(localMinYear) || 1970;
              const clamped = Math.max(1970, Math.min(num, currentYear));
              setLocalMinYear(clamped.toString());
            }}
            placeholder="1970"
            placeholderTextColor="#999"
            blurOnSubmit={false}
            returnKeyType="next"
            onSubmitEditing={() => maxYearInputRef.current?.focus()}
          />
          <Text style={styles.toText}>to</Text>
          <TextInput
            ref={maxYearInputRef}
            style={styles.input}
            value={localMaxYear}
            keyboardType="number-pad"
            onChangeText={(value) => {
              const cleaned = value.replace(/[^0-9]/g, '');
              setLocalMaxYear(cleaned);
            }}
            onBlur={() => {
              const num = localMaxYear === "" ? currentYear : parseInt(localMaxYear) || currentYear;
              const clamped = Math.max(1970, Math.min(num, currentYear));
              setLocalMaxYear(clamped.toString());
            }}
            placeholder={currentYear.toString()}
            placeholderTextColor="#999"
            blurOnSubmit={false}
            returnKeyType="done"
            onSubmitEditing={handleApply}
          />
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
  yearInputs: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  input: {
    width: "40%",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
    textAlign: "center",
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

export default YearFilterModal;
