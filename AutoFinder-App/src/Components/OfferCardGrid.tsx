// components/OfferCardGrid.tsx
import React from "react";
import { TouchableOpacity, Image, Text, View, StyleSheet } from "react-native";

interface Props {
  image: any;
  title: string;
  onPress: () => void;
}

const OfferCardGrid = ({ image, title, onPress }: Props) => {
  return (
    <TouchableOpacity onPress={onPress} style={styles.card}>
      <View style={styles.imageWrapper}>
        <Image source={image} style={styles.image} />
      </View>
      <Text style={styles.cardTitle}>{title}</Text>
    </TouchableOpacity>
  );
};

export default OfferCardGrid;

const styles = StyleSheet.create({
  card: {
    flex: 1,
    margin: 10,
    backgroundColor: "#fff",
    borderRadius: 12,
    elevation: 8,  // Gives a subtle shadow effect for a modern look
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    overflow: "hidden",  // Makes sure the card's border radius works as expected
  },
  imageWrapper: {
    width: "100%",
    height: 150,
    backgroundColor: "#f7f7f7",
    justifyContent: "center",
    alignItems: "center",
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  image: {
    width: 80,
    height: 80,
    resizeMode: "contain",
  },
  cardTitle: {
    textAlign: "center",
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginTop: 10,
    marginBottom: 15,
  },
});
