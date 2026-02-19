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

interface PriceFilterModalProps {
  isVisible: boolean;
  onClose: () => void;
  minPrice: number;
  maxPrice: number;
  setMinPrice: (price: number) => void;
  setMaxPrice: (price: number) => void;
}

const PriceFilterModal: React.FC<PriceFilterModalProps> = ({
  isVisible,
  onClose,
  minPrice,
  maxPrice,
  setMinPrice,
  setMaxPrice,
}) => {
  const [localMinPrice, setLocalMinPrice] = useState(minPrice.toString());
  const [localMaxPrice, setLocalMaxPrice] = useState(maxPrice.toString());
  const minPriceInputRef = useRef<TextInput>(null);
  const maxPriceInputRef = useRef<TextInput>(null);

  // Update local state when props change (when modal opens)
  useEffect(() => {
    if (isVisible) {
      setLocalMinPrice(minPrice.toString());
      setLocalMaxPrice(maxPrice.toString());
    }
  }, [isVisible, minPrice, maxPrice]);

  const formatPrice = (value: string): string => {
    const cleaned = value.replace(/[^0-9]/g, '');
    if (cleaned === '') return '';
    const num = parseInt(cleaned);
    return num.toLocaleString();
  };

  const handleApply = () => {
    const min = localMinPrice === "" ? 0 : parseInt(localMinPrice.replace(/[^0-9]/g, '')) || 0;
    const max = localMaxPrice === "" ? 1000000000 : parseInt(localMaxPrice.replace(/[^0-9]/g, '')) || 1000000000;
    setMinPrice(min);
    setMaxPrice(max);
    onClose();
  };

  const handleReset = () => {
    setLocalMinPrice("0");
    setLocalMaxPrice("1000000000");
    setMinPrice(0);
    setMaxPrice(1000000000);
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
        {/* Header: Price & Reset */}
        <View style={styles.header}>
          <Text style={styles.headerText}>Price</Text>
          <TouchableOpacity onPress={handleReset}>
            <Text style={styles.resetText}>Reset</Text>
          </TouchableOpacity>
        </View>

        {/* Price Inputs */}
        <View style={styles.priceInputs}>
          <View style={styles.priceInputWrapper}>
            <Text style={styles.currencyText}>Rs.</Text>
            <TextInput
              ref={minPriceInputRef}
              style={styles.input}
              value={localMinPrice}
              keyboardType="number-pad"
              onChangeText={(value) => {
                const cleaned = value.replace(/[^0-9]/g, '');
                setLocalMinPrice(cleaned);
              }}
              onBlur={() => {
                const num = localMinPrice === "" ? 0 : parseInt(localMinPrice) || 0;
                setLocalMinPrice(num.toString());
              }}
              placeholder="0"
              placeholderTextColor="#999"
              blurOnSubmit={false}
              returnKeyType="next"
              onSubmitEditing={() => maxPriceInputRef.current?.focus()}
            />
          </View>
          <Text style={styles.toText}>to</Text>
          <View style={styles.priceInputWrapper}>
            <Text style={styles.currencyText}>Rs.</Text>
            <TextInput
              ref={maxPriceInputRef}
              style={styles.input}
              value={localMaxPrice}
              keyboardType="number-pad"
              onChangeText={(value) => {
                const cleaned = value.replace(/[^0-9]/g, '');
                setLocalMaxPrice(cleaned);
              }}
              onBlur={() => {
                const num = localMaxPrice === "" ? 1000000000 : parseInt(localMaxPrice) || 1000000000;
                setLocalMaxPrice(num.toString());
              }}
              placeholder="1000000000"
              placeholderTextColor="#999"
              blurOnSubmit={false}
              returnKeyType="done"
              onSubmitEditing={handleApply}
            />
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
    height: "24%",
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
  priceInputs: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  priceInputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    width: "40%",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  currencyText: {
    fontSize: 16,
    color: "#666",
    marginRight: 5,
  },
  input: {
    flex: 1,
    fontSize: 16,
    textAlign: "left",
    padding: 0,
    color: "#000",
  },
  toText: {
    fontSize: 16,
    alignSelf: "center",
  },
  slider: {
    marginBottom: 20,
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

export default PriceFilterModal;
