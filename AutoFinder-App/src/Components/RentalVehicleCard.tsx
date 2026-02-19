import React from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { safeFormatPrice, safeFormatEngineCapacity, safeFormatTenure } from "../utils/priceUtils";
import { safeGetFirstImageSource } from "../utils/safeImageUtils";
import { API_URL } from "../../config";

interface RentalVehicleCardProps {
  vehicle: {
    _id: string;
    title: string;
    brand: string;
    model: string;
    year: number;
    price: string;
    tenure: number;
    tenureUnit: string;
    driveMode: string;
    paymentType: string;
    fuelType: string;
    engineCapacity: string;
    transmission: string;
    assembly: string;
    bodyType: string;
    bodyColor: string;
    location: string;
    registrationCity: string;
    images?: string[];
  };
  onPress: () => void;
  userData?: any;
}

const { width } = Dimensions.get("window");

const RentalVehicleCard: React.FC<RentalVehicleCardProps> = ({ vehicle, onPress, userData }) => {

  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <View style={styles.imageContainer}>
        <Image 
          source={safeGetFirstImageSource(vehicle, API_URL)} 
          style={styles.image} 
        />
        <View style={styles.rentalBadge}>
          <Text style={styles.rentalText}>Rental</Text>
        </View>
      </View>

      <View style={styles.contentContainer}>
        <View style={styles.header}>
          <Text style={styles.title} numberOfLines={1}>
            {vehicle.title}
          </Text>
          <Text style={styles.year}>{vehicle.year}</Text>
        </View>

        <Text style={styles.subtitle}>
          {vehicle.brand} {vehicle.model}
        </Text>

        <Text style={styles.price}>{safeFormatPrice(vehicle.price)}</Text>

        <View style={styles.detailsContainer}>
          <View style={styles.detailItem}>
            <Ionicons name="time-outline" size={16} color="#666" />
            <Text style={styles.detailText}>
              {safeFormatTenure(vehicle.tenure, vehicle.tenureUnit)}
            </Text>
          </View>
          <View style={styles.detailItem}>
            <Ionicons name="car-outline" size={16} color="#666" />
            <Text style={styles.detailText}>{safeFormatEngineCapacity(vehicle.engineCapacity)}</Text>
          </View>
          <View style={styles.detailItem}>
            <Ionicons name="flash-outline" size={16} color="#666" />
            <Text style={styles.detailText}>{vehicle.fuelType}</Text>
          </View>
        </View>

        <View style={styles.rentalDetailsContainer}>
          <View style={styles.rentalDetailItem}>
            <Ionicons name="person-outline" size={14} color="#666" />
            <Text style={styles.rentalDetailText}>{vehicle.driveMode}</Text>
          </View>
          <View style={styles.rentalDetailItem}>
            <Ionicons name="card-outline" size={14} color="#666" />
            <Text style={styles.rentalDetailText}>{vehicle.paymentType}</Text>
          </View>
        </View>

        <View style={styles.footer}>
          <View style={styles.locationContainer}>
            <Ionicons name="location-outline" size={14} color="#666" />
            <Text style={styles.locationText} numberOfLines={1}>
              {vehicle.location}
            </Text>
          </View>
          <View style={styles.transmissionContainer}>
            <Text style={styles.transmissionText}>{vehicle.transmission}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fff",
    marginHorizontal: 15,
    marginVertical: 8,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    overflow: "hidden",
  },
  imageContainer: {
    height: 200,
    position: "relative",
  },
  image: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  placeholderImage: {
    width: "100%",
    height: "100%",
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
  },
  rentalBadge: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "#4CAF50",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  rentalText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  contentContainer: {
    padding: 15,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    flex: 1,
  },
  year: {
    fontSize: 14,
    color: "#666",
    marginLeft: 10,
  },
  subtitle: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
  },
  price: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#CD0100",
    marginBottom: 12,
  },
  detailsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  detailText: {
    fontSize: 12,
    color: "#666",
    marginLeft: 4,
  },
  rentalDetailsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  rentalDetailItem: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  rentalDetailText: {
    fontSize: 11,
    color: "#666",
    marginLeft: 4,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  locationContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  locationText: {
    fontSize: 12,
    color: "#666",
    marginLeft: 4,
  },
  transmissionContainer: {
    backgroundColor: "#f0f0f0",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  transmissionText: {
    fontSize: 10,
    color: "#666",
    fontWeight: "500",
  },
});

export default RentalVehicleCard;
