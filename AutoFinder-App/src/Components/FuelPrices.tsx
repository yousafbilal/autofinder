import { StyleSheet, Text, View, ActivityIndicator } from "react-native";
import React, { useEffect, useState } from "react";
import { FontAwesome6 } from "@expo/vector-icons";
import { API_URL } from "../../config";
import { fastFetch, CACHE_KEYS, getFromCache } from "../services/cacheService";

interface FuelPrice {
  type: string;
  price: number;
}

const FuelPrices = () => {
  const [fuelPrices, setFuelPrices] = useState<FuelPrice[]>([]);
  const [loading, setLoading] = useState(false); // Start with false

  useEffect(() => {
    fetchFuelPrices();
  }, []);

  const fetchFuelPrices = async () => {
    try {
      // Check cache first - if exists, show immediately without loading
      const cachedData = await getFromCache<FuelPrice[]>(CACHE_KEYS.FUEL_PRICES);
      if (cachedData && Array.isArray(cachedData)) {
        setFuelPrices(cachedData);
        setLoading(false);
      } else {
        // No cache - show loading only if no cache exists
        setLoading(true);
      }
      
      // Use fast fetch with cache - instant display from cache, then refresh
      try {
        const data = await fastFetch<FuelPrice[]>(
          `${API_URL}/fuel-prices`,
          CACHE_KEYS.FUEL_PRICES
        );
        
        if (Array.isArray(data)) {
          setFuelPrices(data);
        } else {
          throw new Error('Invalid data format');
        }
      } catch (fetchError: any) {
        // Handle abort errors silently - they're expected when component unmounts or new request starts
        if (fetchError?.name === 'AbortError' || fetchError?.message === 'Aborted' || fetchError?.message?.includes('timeout') || fetchError?.message === 'Request timed out') {
          // Don't log abort errors - they're expected
          return; // Exit early, keep existing prices
        }
        
        // Handle 404, 429 (rate limit), or other errors gracefully
        if (fetchError?.message?.includes('404') || fetchError?.message?.includes('HTTP 404')) {
          console.log('⚠️ Fuel prices endpoint not found (404), using default prices');
        } else if (fetchError?.message?.includes('429') || fetchError?.message?.includes('HTTP 429') || fetchError?.message?.includes('RATE_LIMIT')) {
          console.log('⚠️ Rate limit hit (429) for fuel prices, using cached/default prices');
        } else if (!fetchError?.message?.includes('Network request failed') && !fetchError?.message?.includes('Failed to fetch')) {
          console.error("Error fetching fuel prices:", fetchError);
        }
        // Fall through to default prices below
      }
      
      // If fetch failed or returned invalid data, use defaults
      if (fuelPrices.length === 0) {
        // Fallback to default prices if API fails
        const defaultPrices = [
          { type: "Petrol (Super)", price: 265.61 },
          { type: "High Octane", price: 329.88 },
          { type: "High Speed Diesel", price: 277.45 },
          { type: "Light Speed Diesel", price: 166.86 },
          { type: "Kerosene Oil", price: 186.86 },
          { type: "CNG Region-I*", price: 210 },
          { type: "CNG Region-II**", price: 210 },
        ];
        setFuelPrices(defaultPrices);
      }
    } catch (error: any) {
      // Suppress abort errors and network errors - they're expected
      if (error?.name === 'AbortError' || error?.message === 'Aborted' || error?.message?.includes('timeout') || error?.message === 'Request timed out') {
        // Don't log abort errors - they're expected
        return; // Exit early, keep existing prices
      }
      
      // Suppress network errors - they're expected when offline
      if (!error?.message?.includes('Network request failed') && !error?.message?.includes('Failed to fetch')) {
        console.error("Error fetching fuel prices:", error);
      }
      // Fallback to default prices
      const defaultPrices = [
        { type: "Petrol (Super)", price: 265.61 },
        { type: "High Octane", price: 329.88 },
        { type: "High Speed Diesel", price: 277.45 },
        { type: "Light Speed Diesel", price: 166.86 },
        { type: "Kerosene Oil", price: 186.86 },
        { type: "CNG Region-I*", price: 210 },
        { type: "CNG Region-II**", price: 210 },
      ];
      setFuelPrices(defaultPrices);
    } finally {
      setLoading(false);
    }
  };

  // Only show loading if no data and no cache (first time load)
  if (loading && fuelPrices.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.heading}>
          <FontAwesome6 name="gas-pump" size={24} color="#CD0100" />
          <Text style={styles.headingText}>Current Fuel Prices</Text>
        </View>
        <ActivityIndicator size="large" color="#CD0100" style={{ marginVertical: 20 }} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.heading}>
        <FontAwesome6 name="gas-pump" size={24} color="#CD0100" />
        <Text style={styles.headingText}>Current Fuel Prices</Text>
      </View>

      <View style={styles.tableHeader}>
        <Text style={styles.tableHeaderTextLeft}>Fuel Type</Text>
        <Text style={styles.tableHeaderTextRight}>Price</Text>
      </View>

      {fuelPrices.map((price, index) => (
        <View key={`fuel-${price.type}-${index}`} style={styles.card}>
          <View style={styles.fuelTypeContainer}>
            <Text style={styles.fuelType}>{price.type}</Text>
            <Text style={styles.perLiter}>PKR • Per Liter</Text>
          </View>
          <View style={styles.priceContainer}>
            <Text style={styles.price}>
              <Text style={styles.currency}>PKR</Text>{" "}
              <Text style={styles.boldPrice}>{price.price.toFixed(2)}</Text>
            </Text>
          </View>
        </View>
      ))}
    </View>
  );
};

export default FuelPrices;

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fff",
    width: "90%",
    alignSelf: "center",
    padding: 16,
    borderRadius: 10,
    marginVertical: 24,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  heading: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  headingText: {
    fontSize: 20,
    fontWeight: "700",
    marginLeft: 10,
    color: "#333",
  },
  tableHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#CD0100",
    padding: 10,
    borderRadius: 6,
    marginBottom: 12,
  },
  tableHeaderTextLeft: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 15,
    width: "70%",
  },
  tableHeaderTextRight: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 15,
    width: "30%",
    textAlign: "left",
    marginLeft: 8,
  },
  card: {
    backgroundColor: "#f8f8f8",
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  fuelTypeContainer: {
    width: "65%",
  },
  fuelType: {
    fontSize: 15,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  perLiter: {
    fontSize: 12,
    color: "#666",
  },
  priceContainer: {
    width: "35%",
    alignItems: "flex-start",
  },
  price: {
    fontSize: 14,
    color: "#444",
    textAlign: "left",
  },
  currency: {
    fontSize: 12,
    color: "#666",
    fontWeight: "500",
  },
  boldPrice: {
    fontSize: 16,
    fontWeight: "700",
    color: "#000",
  },
});
