import React from "react";
import { Pressable, View, StyleSheet } from "react-native";

interface CustomRadioButtonProps {
    isSelected: boolean;
    onPress: () => void;
  }
  
  const CustomRadioButton: React.FC<CustomRadioButtonProps> = ({ isSelected, onPress }) => {
    return (
      <Pressable onPress={onPress} style={styles.radioContainer}>
        <View style={[styles.radioOuter, isSelected && styles.selectedOuter]}>
          {isSelected && <View style={styles.radioInner} />}
        </View>
      </Pressable>
    );
  };

const styles = StyleSheet.create({
  radioContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 5,
    marginRight: -15
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: "#CD0100",
    alignItems: "center",
    justifyContent: "center",
  },
  selectedOuter: {
    borderColor: "#CD0100",
  },
  radioInner: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#CD0100",
  },
});

export default CustomRadioButton;
