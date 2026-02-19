import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, ActivityIndicator, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { COLORS } from '../constants/colors';
import { API_URL } from '../../config';
import { safeGetAllImagesWithApiUrl } from '../utils/safeImageUtils';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.75; // Card takes 75% of screen width

interface SimilarCarsProps {
  currentCarId: string;
  make?: string;
  model?: string;
  adType?: 'car' | 'bike'; // Determine if we should show cars or bikes
}

const SimilarCars: React.FC<SimilarCarsProps> = ({ currentCarId, make, model, adType = 'car' }) => {
  const navigation = useNavigation<any>();
  const [similarCars, setSimilarCars] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (make && model) {
      fetchSimilarCars();
    } else {
      setLoading(false);
    }
  }, [currentCarId, make, model]);

  const fetchSimilarCars = async () => {
    try {
      setLoading(true);
      console.log(`🔍 Fetching similar ${adType}s for: ${make} ${model}`);
      
      let allAds: any[] = [];
      
      // Use specific endpoint for bikes, all_ads for cars
      if (adType === 'bike') {
        // Fetch bikes from bike_ads endpoint
        const bikeResponse = await fetch(`${API_URL}/bike_ads?limit=1000`);
        if (bikeResponse.ok) {
          allAds = await bikeResponse.json();
          allAds = Array.isArray(allAds) ? allAds : [];
          console.log(`📦 Fetched ${allAds.length} bikes from bike_ads endpoint`);
        }
      } else {
        // Fetch cars from all_ads endpoint
        const response = await fetch(`${API_URL}/all_ads`);
        if (response.ok) {
          allAds = await response.json();
          allAds = Array.isArray(allAds) ? allAds : [];
          console.log(`📦 Fetched ${allAds.length} ads from all_ads endpoint`);
        }
      }
      
      // Filter similar ads based on make and model
      const filtered = allAds
        .filter((ad: any) => {
          // Exclude current ad
          if (ad._id === currentCarId) return false;
          
          // Match make and model (case insensitive)
          // For bikes, check both 'make' and 'company' fields
          const adMake = (ad.make || '').toLowerCase().trim();
          const adCompany = (ad.company || '').toLowerCase().trim();
          const adModel = (ad.model || '').toLowerCase().trim();
          const searchMake = (make || '').toLowerCase().trim();
          const searchModel = (model || '').toLowerCase().trim();
          
          // For bikes, filter by bike-specific fields
          if (adType === 'bike') {
            // Bikes should be from bike_ads endpoint (already filtered)
            // But double-check: exclude cars
            const isCarAd = ad.modelType === 'ListItForYou' || ad.modelType === 'Featured' || ad.modelType === 'Free';
            if (isCarAd) return false;
          } else {
            // For cars, filter by car-specific fields
            const isCarAd = ad.modelType === 'ListItForYou' || ad.modelType === 'Featured' || ad.modelType === 'Free';
            const isBikeAd = ad.adType === 'bike' || ad.category === 'bike';
            if (!isCarAd || isBikeAd) return false;
          }
          
          // Match make (must match) - for bikes, check both make and company
          if (searchMake) {
            if (adType === 'bike') {
              // For bikes: make OR company should match
              const makeMatches = adMake === searchMake;
              const companyMatches = adCompany === searchMake;
              if (!makeMatches && !companyMatches) return false;
            } else {
              // For cars: only make should match
              if (adMake !== searchMake) return false;
            }
          }
          
          // Match model (should match, but can be flexible)
          if (searchModel && !adModel.includes(searchModel) && !searchModel.includes(adModel)) {
            return false;
          }
          
          // Only active ads
          return ad.isActive !== false && ad.isDeleted !== true;
        })
        .slice(0, 10); // Limit to 10 similar items
      
      console.log(`✅ Found ${filtered.length} similar ${adType}s`);
      setSimilarCars(filtered);
    } catch (error) {
      console.error(`❌ Error fetching similar ${adType}s:`, error);
      setSimilarCars([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCarPress = (item: any) => {
    console.log(`🚗 Navigating to ${adType} details: ${item._id}`);
    
    // If it's a bike, always navigate to BikeDetails
    if (adType === 'bike') {
      navigation.navigate('BikeDetails', { carDetails: item });
      return;
    }
    
    // For cars, determine which detail screen to navigate to based on car type
    if (item.modelType === 'ListItForYou') {
      navigation.navigate('CarDetails', { carDetails: item });
    } else if (item.modelType === 'Featured') {
      navigation.navigate('CarDetails', { carDetails: item });
    } else if (item.modelType === 'Free') {
      navigation.navigate('CarDetail', { carId: item._id });
    } else if (item.adType === 'bike' || item.category === 'bike') {
      navigation.navigate('BikeDetails', { carDetails: item });
    } else {
      // Default fallback
      navigation.navigate('CarDetail', { carId: item._id });
    }
  };

  const renderCarCard = ({ item }: { item: any }) => {
    const images = safeGetAllImagesWithApiUrl(item, API_URL);
    const firstImage = images[0] || `${API_URL}/uploads/default-car.jpg`;
    
    const price = item.price || item.amount || 'N/A';
    const displayPrice = typeof price === 'number' ? `PKR ${price.toLocaleString()}` : price;
    
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => handleCarPress(item)}
        activeOpacity={0.9}
      >
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: firstImage }}
            style={styles.cardImage}
            resizeMode="cover"
          />
          {images.length > 1 && (
            <View style={styles.imageCountBadge}>
              <Text style={styles.imageCountText}>{images.length}</Text>
            </View>
          )}
        </View>
        
        <View style={styles.cardContent}>
          <Text style={styles.cardPrice} numberOfLines={1}>
            {displayPrice}
          </Text>
          <Text style={styles.cardTitle} numberOfLines={1}>
            {adType === 'bike' ? (item.make || item.company || '') : (item.make || '')} {item.model || ''}
          </Text>
          {(() => {
            const mileage = item.kmDriven || 
                            item.mileage || 
                            item.km || 
                            item.kilometer ||
                            item.traveled ||
                            item.distance ||
                            item.odometer;
            const mileageNum = mileage ? (typeof mileage === 'string' ? parseFloat(mileage) : mileage) : null;
            const hasMileage = mileageNum && !isNaN(mileageNum) && mileageNum > 0;
            
            return (item.year || hasMileage || (adType === 'bike' && item.engineCapacity)) ? (
              <Text style={styles.cardSpecs} numberOfLines={1}>
                {item.year ? `${item.year}` : ''}
                {item.year && (hasMileage || (adType === 'bike' && item.engineCapacity)) ? ' • ' : ''}
                {adType === 'bike' && item.engineCapacity ? `${item.engineCapacity}cc` : ''}
                {adType === 'bike' && item.engineCapacity && hasMileage ? ' • ' : ''}
                {hasMileage ? `${(mileageNum! / 1000).toFixed(0)}k km` : ''}
              </Text>
            ) : null;
          })()}
        </View>
      </TouchableOpacity>
    );
  };

  if (!make || !model) {
    return null; // Don't show if no make/model
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.sectionTitle}>Similar {adType === 'car' ? 'Cars' : 'Bikes'}</Text>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={COLORS.primary} />
        </View>
      </View>
    );
  }

  if (similarCars.length === 0) {
    return null; // Don't show section if no similar cars found
  }

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Similar {adType === 'car' ? 'Cars' : 'Bikes'}</Text>
      <FlatList
        data={similarCars}
        renderItem={renderCarCard}
        keyExtractor={(item, index) => {
          // CRITICAL FIX: Always return unique key, NEVER "[object Object]"
          try {
            let idStr: string | null = null;
            
            if (item?._id) {
              // Case 1: _id is already a valid string
              if (typeof item._id === 'string' && item._id.length > 10 && item._id !== '[object Object]' && !item._id.includes('[object')) {
                idStr = item._id;
              } 
              // Case 2: _id is an object - extract nested ID
              else if (typeof item._id === 'object' && item._id !== null) {
                const nestedId = item._id._id || item._id.id;
                if (nestedId && typeof nestedId === 'string' && nestedId.length > 10 && nestedId !== '[object Object]' && !nestedId.includes('[object')) {
                  idStr = nestedId;
                } else if (item._id.toString && typeof item._id.toString === 'function') {
                  try {
                    const toStringResult = item._id.toString();
                    if (toStringResult && typeof toStringResult === 'string' && 
                        toStringResult.length > 10 && toStringResult !== '[object Object]' && !toStringResult.includes('[object')) {
                      idStr = toStringResult;
                    }
                  } catch (e) {
                    // Skip
                  }
                }
              }
            }
            
            // Always include index to ensure uniqueness
            if (idStr) {
              return `similar-${idStr}-idx${index}`;
            }
            
            // Fallback with index
            const make = String(item?.make || 'car').substring(0, 10).replace(/[^a-zA-Z0-9]/g, '') || 'car';
            const model = String(item?.model || 'model').substring(0, 10).replace(/[^a-zA-Z0-9]/g, '') || 'model';
            return `similar-${make}-${model}-idx${index}`;
          } catch (error) {
            return `similar-idx${index}`;
          }
        }}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        snapToInterval={CARD_WIDTH + 16}
        decelerationRate="fast"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 20,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.black,
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  listContent: {
    paddingRight: 16,
  },
  card: {
    width: CARD_WIDTH,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    marginRight: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  imageContainer: {
    width: '100%',
    height: 180,
    position: 'relative',
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  imageCountBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  imageCountText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  cardContent: {
    padding: 12,
  },
  cardPrice: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.black,
    marginBottom: 4,
  },
  cardSpecs: {
    fontSize: 13,
    color: COLORS.darkGray,
  },
  loadingContainer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
});

export default SimilarCars;
