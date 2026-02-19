import React from "react";
import { View, Text, Image, StyleSheet, TouchableOpacity } from "react-native";
import { safeGetFirstImageWithApiUrl } from "../utils/safeImageUtils";
import { API_URL } from "../../config";

const AutoPartCard = ({ part, onPress }) => {
  const imageUrl = safeGetFirstImageWithApiUrl(part, API_URL);

  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      {imageUrl && <Image source={{ uri: imageUrl }} style={styles.image} />}
      <View style={styles.content}>
        <Text style={styles.title}>{part.title}</Text>
        <Text>{part.partType}</Text>
        <Text>{part.location}</Text>
        <Text style={styles.price}>Rs {part.price ? part.price.toLocaleString() : '0'}</Text>
      </View>
    </TouchableOpacity>
  );
};

export default AutoPartCard;

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    backgroundColor: "#fff",
    margin: 10,
    borderRadius: 8,
    overflow: "hidden",
    elevation: 3,
  },
  image: {
    width: 120,
    height: 100,
  },
  content: {
    padding: 10,
    flex: 1,
  },
  title: {
    fontWeight: "bold",
    fontSize: 16,
  },
  price: {
    color: "#CD0100",
    fontWeight: "600",
    marginTop: 5,
  },
});
