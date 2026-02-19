# Bike and Rental Vehicle Filtering Integration Guide

## Overview
This guide shows how to integrate comprehensive filtering systems for Used Bikes and Rental Vehicles with all the specified properties into your mobile app.

## Used Bike Filtering System

### 13 Filter Properties Implemented

1. **Company Name** - Multiple selection from 20+ bike companies
2. **Model Name** - Multiple selection from 50+ bike models  
3. **Model Year** - Range selection (1970 to current year)
4. **Registration City** - Multiple selection from 25+ cities
5. **Location** - Multiple selection from 25+ cities
6. **Engine Capacity** - Range selection (50 to 1000 CC)
7. **Body Color** - Multiple selection from 25+ colors
8. **Kilometers Driven** - Range selection (0 to 100,000 km)
9. **Price Range** - Range selection (0 to 2,000,000 PKR)
10. **Fuel Type** - Multiple selection (Petrol, Hybrid, Electric)
11. **Engine Type** - Multiple selection (2 Stroke, 4 Stroke, Electric)
12. **Featured Ads** - Boolean filter
13. **Description** - Text search (handled by search query)

### Files Created

1. **`BikeFilterModal.tsx`** - Complete bike filter modal
2. **`BikeListScreen.tsx`** - Example bike list screen
3. **`safeBikeFiltering.ts`** - Safe filtering utilities for bikes

### Integration Steps

#### 1. Import the Bike Filter Modal

```tsx
import BikeFilterModal from "../../Components/Models/BikeFilterModal";
import { filterBikesSafely } from "../../utils/safeBikeFiltering";
```

#### 2. Set Up Filter State

```tsx
const [filters, setFilters] = useState({
  companies: [],
  models: [],
  years: { min: 1970, max: new Date().getFullYear() },
  registrationCities: [],
  locations: [],
  engineCapacity: { min: 50, max: 1000 },
  bodyColors: [],
  kmDriven: { min: 0, max: 100000 },
  price: { min: 0, max: 2000000 },
  fuelTypes: [],
  engineTypes: [],
  isFeatured: false,
});
```

#### 3. Apply Safe Filtering

```tsx
const filteredBikes = filterBikesSafely(bikes, filters, searchQuery);
```

#### 4. Use the Filter Modal

```tsx
<BikeFilterModal
  visible={filterModalVisible}
  onClose={() => setFilterModalVisible(false)}
  onApplyFilters={(newFilters) => setFilters(newFilters)}
/>
```

## Rental Vehicle Filtering System

### 15 Filter Properties Implemented

1. **Brand Name** - Multiple selection from 20+ brands
2. **Model Name** - Multiple selection from 25+ models
3. **Model Year** - Range selection (1970 to current year)
4. **Registration City** - Multiple selection from 25+ cities
5. **Location (City)** - Multiple selection from 25+ cities
6. **Body Color** - Multiple selection from 20+ colors
7. **Budget Range (PKR)** - Range selection (0 to 100,000 PKR)
8. **Car Rental Desired Tenure/Time** - Range selection with unit (Days/Months)
9. **Car Drive Mode** - Multiple selection (With Driver, Self Drive)
10. **Payment Type** - Multiple selection (Advance+Security, Full Payment, etc.)
11. **Fuel Type** - Multiple selection (Petrol, Diesel, Hybrid, Electric, CNG, LPG)
12. **Engine Capacity (CC)** - Range selection (0 to 6,000 CC)
13. **Transmission** - Multiple selection (Manual, Automatic, CVT, AMT, DCT)
14. **Assembly** - Multiple selection (Local, Imported)
15. **Body Type** - Multiple selection (Sedan, Hatchback, SUV, etc.)

### Special Features

- **Title Search**: Users can search by vehicle title
- **Tenure Unit Selection**: Toggle between Days and Months
- **Dynamic Tenure Range**: Max value changes based on selected unit

### Files Created

1. **`RentalVehicleFilterModal.tsx`** - Complete rental vehicle filter modal
2. **`RentalVehicleListScreen.tsx`** - Example rental vehicle list screen
3. **`safeRentalFiltering.ts`** - Safe filtering utilities for rental vehicles

### Integration Steps

#### 1. Import the Rental Vehicle Filter Modal

```tsx
import RentalVehicleFilterModal from "../../Components/Models/RentalVehicleFilterModal";
import { filterRentalVehiclesSafely } from "../../utils/safeRentalFiltering";
```

#### 2. Set Up Filter State

```tsx
const [filters, setFilters] = useState({
  brands: [],
  models: [],
  years: { min: 1970, max: new Date().getFullYear() },
  registrationCities: [],
  locations: [],
  bodyColors: [],
  budgetRange: { min: 0, max: 100000 },
  tenure: { min: 1, max: 30 },
  tenureUnit: "Days",
  driveMode: [],
  paymentType: [],
  fuelTypes: [],
  engineCapacity: { min: 0, max: 6000 },
  transmissions: [],
  assemblies: [],
  bodyTypes: [],
});
```

#### 3. Apply Safe Filtering

```tsx
const filteredVehicles = filterRentalVehiclesSafely(vehicles, filters, searchQuery);
```

#### 4. Use the Filter Modal

```tsx
<RentalVehicleFilterModal
  visible={filterModalVisible}
  onClose={() => setFilterModalVisible(false)}
  onApplyFilters={(newFilters) => setFilters(newFilters)}
/>
```

## Key Features

### Range Sliders
- **Year Range**: 1970 to current year
- **Price/Budget Range**: Custom ranges for each vehicle type
- **Engine Capacity**: 50-1000 CC for bikes, 0-6000 CC for cars
- **KM Driven**: 0-100,000 km for bikes, 0-500,000 km for cars
- **Tenure**: 1-30 days or 1-12 months for rental vehicles

### Multiple Selection
- All filter properties support multiple choices
- "All" options clear individual selections
- Visual feedback for selected items

### Special Filters
- **Bikes**: Featured Ads toggle
- **Rental Vehicles**: Drive Mode, Payment Type, Tenure Unit selection

### Search Integration
- **Bikes**: Search by company, model, year
- **Rental Vehicles**: Search by title (as specified)
- Works with existing search functionality

## Error Handling

### Safe Filtering Utilities
Both systems use safe filtering utilities that handle:
- Undefined/null values
- Invalid data types
- Missing properties
- Array operations on undefined

### Example Usage
```tsx
// Safe array operations
const matchesBrand = safeArrayLength(filters.brands) === 0 || 
  safeArrayIncludes(filters.brands, "All Brands");

// Safe object property access
const years = safeObjectProperty(filters, 'years', { min: 1970, max: new Date().getFullYear() });

// Safe number conversion
const bikeYear = safeNumber(bike.year);
```

## Performance Tips

### 1. Memoization
```tsx
const filteredBikes = useMemo(() => {
  return filterBikesSafely(bikes, filters, searchQuery);
}, [bikes, filters, searchQuery]);
```

### 2. Early Returns
```tsx
if (!Array.isArray(bikes) || bikes.length === 0) {
  return [];
}
```

### 3. Lazy Evaluation
```tsx
const matchesBrand = safeArrayLength(filters.brands) === 0 || 
  safeArraySome(filters.brands, brand => 
    safeString(bike.company).toLowerCase().includes(safeString(brand).toLowerCase())
  );
```

## Testing

### Test Scenarios
1. **Empty Filters**: `{}`
2. **Undefined Filters**: `{ brands: undefined }`
3. **Partial Filters**: `{ brands: ['Honda'] }`
4. **Complete Filters**: All properties defined
5. **Invalid Data**: Malformed vehicle objects
6. **Search Integration**: Text search with filters
7. **Range Filters**: Min/max values
8. **Multiple Selection**: Multiple options selected

### Test Component
```tsx
import { filterBikesSafely } from '../utils/safeBikeFiltering';
import { filterRentalVehiclesSafely } from '../utils/safeRentalFiltering';

// Test bike filtering
const filteredBikes = filterBikesSafely(testBikes, testFilters, 'Honda');

// Test rental vehicle filtering
const filteredVehicles = filterRentalVehiclesSafely(testVehicles, testFilters, 'Toyota');
```

## Customization

### Adding New Companies/Models
```tsx
const companies = [
  "All Companies", 
  "Honda", 
  "Yamaha", 
  // ... existing companies
  "Your New Company"  // Add here
];
```

### Adding New Filter Properties
1. Add to the filter state interface
2. Add to the filter state initialization
3. Add to the filtering logic
4. Add to the FilterModal UI
5. Add to the reset function

### Modifying Range Values
```tsx
// Bike engine capacity
const engineRange = { min: 50, max: 1000 };

// Rental vehicle budget
const budgetRange = { min: 0, max: 100000 };
```

## API Integration

### Backend Endpoints
- **Bikes**: `GET /bike_ads`
- **Rental Vehicles**: `GET /rental_vehicle_ads`

### Data Structure
Ensure your backend returns data with the expected properties:

```typescript
// Bike data structure
interface Bike {
  _id: string;
  company: string;
  model: string;
  year: number;
  price: string;
  kmDriven: string;
  fuelType: string;
  engineType: string;
  engineCapacity: string;
  bodyColor: string;
  location: string;
  registrationCity: string;
  isFeatured: boolean;
  // ... other properties
}

// Rental vehicle data structure
interface RentalVehicle {
  _id: string;
  title: string;
  brand: string;
  model: string;
  year: number;
  price: string;
  tenure: number;
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
  // ... other properties
}
```

## Best Practices

1. **Always initialize filter state** with default values
2. **Use safe utility functions** for all operations
3. **Add error boundaries** around filtering logic
4. **Test with edge cases** (undefined, null, empty arrays)
5. **Use TypeScript** for better type safety
6. **Add logging** for debugging
7. **Handle errors gracefully** with fallbacks
8. **Optimize performance** with memoization
9. **Provide user feedback** with loading states
10. **Test thoroughly** with real data

## Support

For issues or questions:
1. Check the console for errors
2. Verify filter state structure
3. Test individual filter properties
4. Check data format compatibility
5. Use the safe filtering utilities
6. Test with the provided test components

---

**Note**: Both filtering systems provide comprehensive search capabilities similar to major automotive platforms. The systems are designed to be scalable, maintainable, and error-free.
