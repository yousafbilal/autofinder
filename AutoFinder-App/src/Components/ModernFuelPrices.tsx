import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient as ExpoLinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../constants/colors';
import { API_URL } from '../../config';

const { width } = Dimensions.get('window');

interface FuelPrice {
  id?: string;
  _id?: string;
  type: string;
  price: number;
  change: number;
  changePercent: number;
  icon: string;
  color: string;
  gradient: string[];
}

const ModernFuelPrices: React.FC = () => {
  const [selectedCity, setSelectedCity] = useState('Karachi');
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [fuelPrices, setFuelPrices] = useState<FuelPrice[]>([]);
  const [loading, setLoading] = useState(true);
  const abortControllerRef = React.useRef<AbortController | null>(null);

  useEffect(() => {
    fetchFuelPrices();
    // FIXED: Reduce refresh interval from 1 minute to 10 minutes to avoid rate limiting
    const interval = setInterval(() => {
      setLastUpdated(new Date());
      fetchFuelPrices(); // Refresh prices every 10 minutes
    }, 600000); // 10 minutes instead of 1 minute
    return () => {
      clearInterval(interval);
      // Abort any pending requests when component unmounts
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const fetchFuelPrices = async () => {
    // Abort previous request if still pending
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // Create new AbortController for this request
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;
    
    try {
      const response = await fetch(`${API_URL}/fuel-prices`, { signal });
      if (!response.ok) {
        // Handle 404 gracefully - endpoint might not exist
        if (response.status === 404) {
          console.log('⚠️ Fuel prices endpoint not found (404), using default prices');
          throw new Error('ENDPOINT_NOT_FOUND');
        }
        // FIXED: Handle HTTP 429 (rate limit) gracefully - use cached/default prices
        if (response.status === 429) {
          console.log('⚠️ Rate limit hit (429) for fuel prices, using cached/default prices');
          throw new Error('RATE_LIMIT');
        }
        throw new Error(`HTTP ${response.status}`);
      }
      const data = await response.json();
      if (Array.isArray(data) && data.length > 0) {
        // Map API data to component format
        const mappedPrices = data.map((item: any, index: number) => ({
          id: item._id || `fuel-${index}`,
          type: item.type,
          price: item.price,
          change: item.change || 0,
          changePercent: item.changePercent || 0,
          icon: item.icon || 'flash',
          color: item.color || '#FF6B6B',
          gradient: Array.isArray(item.gradient) && item.gradient.length >= 2 
            ? item.gradient 
            : [item.color || '#FF6B6B', '#FF8E8E'],
        }));
        setFuelPrices(mappedPrices);
      } else {
        // Fallback to default prices
        setFuelPrices([
          {
            id: 'petrol',
            type: 'Petrol',
            price: 272.89,
            change: 2.50,
            changePercent: 0.92,
            icon: 'flash',
            color: '#FF6B6B',
            gradient: ['#FF6B6B', '#FF8E8E'],
          },
          {
            id: 'diesel',
            type: 'Diesel',
            price: 273.40,
            change: -1.20,
            changePercent: -0.44,
            icon: 'water',
            color: '#4ECDC4',
            gradient: ['#4ECDC4', '#6ED5CD'],
          },
          {
            id: 'cng',
            type: 'CNG',
            price: 210.50,
            change: 0.80,
            changePercent: 0.38,
            icon: 'leaf',
            color: '#96CEB4',
            gradient: ['#96CEB4', '#A8D5C0'],
          },
          {
            id: 'lpg',
            type: 'LPG',
            price: 185.75,
            change: 1.25,
            changePercent: 0.68,
            icon: 'flame',
            color: '#FFB74D',
            gradient: ['#FFB74D', '#FFCC80'],
          },
        ]);
      }
    } catch (error: any) {
      // Handle abort errors gracefully - don't log them as errors
      if (error.name === 'AbortError' || error.message === 'Aborted') {
        console.log('⚠️ Fuel prices request aborted (component unmounted or new request started)');
        return; // Don't set default prices on abort
      }
      
      // Suppress network errors, 404, and rate limit errors - they're expected
      const isNetworkError = error?.message?.includes('Network request failed') || 
                            error?.message?.includes('Failed to fetch') ||
                            error?.message === 'ENDPOINT_NOT_FOUND' ||
                            error?.message === 'RATE_LIMIT' ||
                            error?.message?.includes('HTTP 429') ||
                            error?.message?.includes('429');
      if (!isNetworkError) {
        console.error('Error fetching fuel prices:', error);
      }
      // Fallback to default prices
      setFuelPrices([
        {
          id: 'petrol',
          type: 'Petrol',
          price: 272.89,
          change: 2.50,
          changePercent: 0.92,
          icon: 'flash',
          color: '#FF6B6B',
          gradient: ['#FF6B6B', '#FF8E8E'],
        },
        {
          id: 'diesel',
          type: 'Diesel',
          price: 273.40,
          change: -1.20,
          changePercent: -0.44,
          icon: 'water',
          color: '#4ECDC4',
          gradient: ['#4ECDC4', '#6ED5CD'],
        },
        {
          id: 'cng',
          type: 'CNG',
          price: 210.50,
          change: 0.80,
          changePercent: 0.38,
          icon: 'leaf',
          color: '#96CEB4',
          gradient: ['#96CEB4', '#A8D5C0'],
        },
        {
          id: 'lpg',
          type: 'LPG',
          price: 185.75,
          change: 1.25,
          changePercent: 0.68,
          icon: 'flame',
          color: '#FFB74D',
          gradient: ['#FFB74D', '#FFCC80'],
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const getChangeIcon = (change: number) => {
    return change >= 0 ? 'trending-up' : 'trending-down';
  };

  const getChangeColor = (change: number) => {
    return change >= 0 ? '#00C851' : '#FF4444';
  };

  const cities = ['Karachi', 'Lahore', 'Islamabad', 'Rawalpindi', 'Faisalabad'];

  // Calculate market summary from fetched prices
  const calculateSummary = () => {
    if (fuelPrices.length === 0) return { average: 235.64, highest: 273.40, lowest: 185.75 };
    const prices = fuelPrices.map(p => p.price);
    const average = prices.reduce((a, b) => a + b, 0) / prices.length;
    const highest = Math.max(...prices);
    const lowest = Math.min(...prices);
    return { average, highest, lowest };
  };

  const summary = calculateSummary();

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <View style={styles.iconContainer}>
              <Ionicons name="flash" size={24} color={COLORS.primary} />
            </View>
            <View>
              <Text style={styles.title}>Current Fuel Prices</Text>
              <Text style={styles.subtitle}>Live market rates</Text>
            </View>
          </View>
        </View>
        <ActivityIndicator size="large" color={COLORS.primary} style={{ marginVertical: 40 }} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <View style={styles.iconContainer}>
            <Ionicons name="flash" size={24} color={COLORS.primary} />
          </View>
          <View>
            <Text style={styles.title}>Current Fuel Prices</Text>
            <Text style={styles.subtitle}>Live market rates</Text>
          </View>
        </View>
        
        <View style={styles.updateInfo}>
          <Ionicons name="time-outline" size={14} color="#666" />
          <Text style={styles.updateText}>Updated {formatTime(lastUpdated)}</Text>
        </View>
      </View>

      {/* City Selector */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.citySelector}
        contentContainerStyle={styles.citySelectorContent}
      >
        {cities.map((city) => (
          <TouchableOpacity
            key={city}
            style={[
              styles.cityButton,
              selectedCity === city && styles.selectedCityButton
            ]}
            onPress={() => setSelectedCity(city)}
          >
            <Text style={[
              styles.cityText,
              selectedCity === city && styles.selectedCityText
            ]}>
              {city}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Fuel Prices Grid */}
      <View style={styles.pricesGrid}>
        {fuelPrices.map((fuel, index) => (
          <ExpoLinearGradient
            key={(() => {
              try {
                if (fuel.id) {
                  if (typeof fuel.id === 'string') return fuel.id;
                  if (typeof fuel.id === 'number') return `fuel-id-${fuel.id}`;
                  if (typeof fuel.id === 'object' && fuel.id.toString) return String(fuel.id.toString());
                }
                if (fuel._id) {
                  if (typeof fuel._id === 'string') return fuel._id;
                  if (typeof fuel._id === 'number') return `fuel-_id-${fuel._id}`;
                  if (typeof fuel._id === 'object' && fuel._id.toString) return String(fuel._id.toString());
                }
                return `fuel-${index}`;
              } catch (error) {
                return `fuel-${index}-${Date.now()}`;
              }
            })()}
            colors={fuel.gradient}
            style={[styles.priceCard, { marginRight: index % 2 === 0 ? 8 : 0 }]}
          >
            {/* Fuel Type */}
            <View style={styles.fuelHeader}>
              <View style={styles.fuelIconContainer}>
                <Ionicons name={fuel.icon as any} size={20} color="#fff" />
              </View>
              <Text style={styles.fuelType}>{fuel.type}</Text>
            </View>

            {/* Price */}
            <Text style={styles.price}>PKR {fuel.price.toFixed(2)}</Text>

            {/* Change */}
            <View style={styles.changeContainer}>
              <Ionicons 
                name={getChangeIcon(fuel.change) as any} 
                size={16} 
                color={getChangeColor(fuel.change)} 
              />
              <Text style={[
                styles.changeText,
                { color: getChangeColor(fuel.change) }
              ]}>
                {fuel.change >= 0 ? '+' : ''}{fuel.change.toFixed(2)} ({fuel.changePercent >= 0 ? '+' : ''}{fuel.changePercent.toFixed(2)}%)
              </Text>
            </View>

            {/* Trend Indicator */}
            <View style={styles.trendContainer}>
              <View style={[
                styles.trendBar,
                { 
                  backgroundColor: getChangeColor(fuel.change),
                  width: `${Math.abs(fuel.changePercent) * 10}%`
                }
              ]} />
            </View>
          </ExpoLinearGradient>
        ))}
      </View>

      {/* Market Summary */}
      <View style={styles.summaryContainer}>
        <ExpoLinearGradient
          colors={['#F8F9FA', '#E9ECEF']}
          style={styles.summaryCard}
        >
          <View style={styles.summaryHeader}>
            <Ionicons name="analytics" size={20} color={COLORS.primary} />
            <Text style={styles.summaryTitle}>Market Summary</Text>
          </View>
          
          <View style={styles.summaryStats}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Average Price</Text>
              <Text style={styles.summaryValue}>PKR {summary.average.toFixed(2)}</Text>
            </View>
            
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Highest</Text>
              <Text style={styles.summaryValue}>PKR {summary.highest.toFixed(2)}</Text>
            </View>
            
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Lowest</Text>
              <Text style={styles.summaryValue}>PKR {summary.lowest.toFixed(2)}</Text>
            </View>
          </View>
        </ExpoLinearGradient>
      </View>

      {/* Disclaimer */}
      <Text style={styles.disclaimer}>
        * Prices are updated every hour and may vary by location
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(205, 1, 0, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.black,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.darkGray,
  },
  updateInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  updateText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  citySelector: {
    marginBottom: 16,
  },
  citySelectorContent: {
    paddingHorizontal: 4,
  },
  cityButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F8F9FA',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  selectedCityButton: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  cityText: {
    fontSize: 14,
    color: COLORS.darkGray,
    fontWeight: '500',
  },
  selectedCityText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  pricesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  priceCard: {
    width: (width - 48) / 2,
    padding: 16,
    borderRadius: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  fuelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  fuelIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  fuelType: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '600',
  },
  price: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  changeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  changeText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  trendContainer: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  trendBar: {
    height: '100%',
    borderRadius: 2,
  },
  summaryContainer: {
    marginBottom: 16,
  },
  summaryCard: {
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.black,
    marginLeft: 8,
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryItem: {
    alignItems: 'center',
    flex: 1,
  },
  summaryLabel: {
    fontSize: 12,
    color: COLORS.darkGray,
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.black,
  },
  disclaimer: {
    fontSize: 12,
    color: COLORS.darkGray,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default ModernFuelPrices;
