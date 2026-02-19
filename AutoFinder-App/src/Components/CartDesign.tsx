import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

const { width } = Dimensions.get("window");

const CartDesign = () => {
  const categories = [];


  const getCategoryKey = (category: any, index: number): string => {
    try {
      if (category.id) {
        if (typeof category.id === 'string') return category.id;
        if (typeof category.id === 'number') return `category-${category.id}`;
        if (typeof category.id === 'object' && category.id.toString) {
          const str = String(category.id.toString());
          if (str !== '[object Object]') return str;
          if (category.id._id) return String(category.id._id);
          if (category.id.$oid) return String(category.id.$oid);
        }
      }
      return `category-${index}`;
    } catch (error) {
      return `category-${index}-${Date.now()}`;
    }
  };

  const renderCategoryButton = (category: any, index: number) => {
    return (
      <TouchableOpacity
        style={[
          styles.categoryButton,
          category.active && styles.activeCategoryButton,
        ]}
      >
        <Text
          style={[
            styles.categoryButtonText,
            category.active && styles.activeCategoryButtonText,
          ]}
        >
          {category.name}
        </Text>
      </TouchableOpacity>
    );
  };


  return (
    <View style={styles.container}>
      {/* Category Buttons */}
      <View style={styles.categoryContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.categoryRow}>
            {categories.map((category, index) => {
              const categoryKey = getCategoryKey(category, index);
              return (
                <React.Fragment key={categoryKey}>
                  {renderCategoryButton(category, index)}
                </React.Fragment>
              );
            })}
          </View>
        </ScrollView>
      </View>



    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  categoryContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  categoryRow: {
    flexDirection: "row",
    gap: 12,
  },
  categoryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: "#F5F5F5",
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  activeCategoryButton: {
    backgroundColor: "#CD0100",
    borderColor: "#CD0100",
  },
  categoryButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#666",
  },
  activeCategoryButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
});

export default CartDesign;
