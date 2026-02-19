import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
interface CustomCheckboxProps {
  isChecked: boolean;
  onPress: () => void;
}

const CustomCheckbox: React.FC<CustomCheckboxProps> = ({ isChecked, onPress }) => {
   return (
    <Pressable style={styles.checkboxContainer} onPress={onPress}>
      <View style={[styles.checkbox, isChecked && styles.checkedBox]}>
        {isChecked && <Text style={styles.checkmark}>✔</Text>}
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  checkboxContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 1,
    borderColor: "#CD0100",
    borderRadius: 5,
    alignItems: "center",
    justifyContent: "center",
  },
  checkedBox: {
    backgroundColor: "#CD0100",
    borderColor: "#CD0100",
  },
  checkmark: {
    color: "white",
    fontSize: 14,
  },
});

export default CustomCheckbox;
