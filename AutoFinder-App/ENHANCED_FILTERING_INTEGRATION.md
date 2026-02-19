# Enhanced Used Car Filtering Integration Guide

## Overview
This guide shows how to integrate the comprehensive used car filtering system with all 16 properties and extended categories into your existing mobile app.

## What's Included

### 16 Filter Properties
1. **Brand Name** - Multiple selection from available brands
2. **Model Name** - Multiple selection from available models  
3. **Variant** - Multiple selection from available variants
4. **Model Year** - Range selection (1970 to current year)
5. **Registration City** - Multiple selection from available cities
6. **Location (City)** - Multiple selection from available cities
7. **Body Color** - Multiple selection from available colors
8. **Kilometers Driven** - Range selection (0 to 500,000 km)
9. **Price (PKR)** - Range selection (0 to 50,000,000 PKR)
10. **Fuel Type** - Multiple selection (Petrol, Diesel, Hybrid, Electric, CNG, LPG)
11. **Engine Capacity (CC)** - Range selection (0 to 6,000 CC)
12. **Transmission** - Multiple selection (Manual, Automatic, CVT, AMT, DCT)
13. **Assembly** - Multiple selection (Local, Imported)
14. **Body Type** - Multiple selection (Sedan, Hatchback, SUV, etc.)
15. **AutoFinder Certified** - Boolean filter
16. **Featured Cars** - Boolean filter
17. **Sale It For Me** - Boolean filter

### Extended Categories (24 Categories)
- Automatic Cars
- Family Cars
- Low Price Cars
- 1000cc Cars
- 660 CC Cars
- Low Mileage Cars
- Japanese Cars
- Urgent Sale
- Imported Cars
- 1300 CC Cars
- Old Cars
- Modified Cars
- Electric Cars
- Duplicate Documents
- Accidental Cars
- Jeeps
- Hybrid Cars
- Sports Cars
- Auctioned Cars
- Commercial Vehicles
- Full Crashed Cars
- Diesel Vehicles
- Vintage Cars

## Integration Steps

### 1. Update Your FilterModal Import

```tsx
// In your CarListScreen.tsx or any screen using filters
import FilterModal from "../../Components/Models/FilterModal";
```

### 2. Update Filter State

Replace your existing filter state with the comprehensive one:

```tsx
const [selectedFilters, setSelectedFilters] = useState({
  brands: [],
  models: [],
  variants: [],
  years: { min: 1970, max: new Date().getFullYear() },
  registrationCities: [],
  locations: [],
  bodyColors: [],
  kmDriven: { min: 0, max: 500000 },
  price: { min: 0, max: 50000000 },
  fuelTypes: [],
  engineCapacity: { min: 0, max: 6000 },
  transmissions: [],
  assemblies: [],
  bodyTypes: [],
  isCertified: false,
  isFeatured: false,
  isSaleItForMe: false,
  categories: [],
});
```

### 3. Update Filtering Logic

Replace your existing filtering logic with the comprehensive version:

```tsx
const filteredCars = cars.filter((car) => {
  // Search query filter
  const carName = `${car.make} ${car.model} ${car.variant} ${car.year}`.toLowerCase();
  const matchesSearch = !searchQuery || carName.includes(searchQuery.toLowerCase());

  // Brand filter
  const matchesBrand = selectedFilters.brands.length === 0 || 
    selectedFilters.brands.includes("All Brands") ||
    selectedFilters.brands.some(brand => car.make?.toLowerCase().includes(brand.toLowerCase()));

  // Model filter
  const matchesModel = selectedFilters.models.length === 0 || 
    selectedFilters.models.includes("All Models") ||
    selectedFilters.models.some(model => car.model?.toLowerCase().includes(model.toLowerCase()));

  // Variant filter
  const matchesVariant = selectedFilters.variants.length === 0 || 
    selectedFilters.variants.includes("All Variants") ||
    selectedFilters.variants.some(variant => car.variant?.toLowerCase().includes(variant.toLowerCase()));

  // Year filter
  const carYear = Number(car.year);
  const matchesYear = carYear >= selectedFilters.years.min && carYear <= selectedFilters.years.max;

  // Registration city filter
  const matchesRegistrationCity = selectedFilters.registrationCities.length === 0 || 
    selectedFilters.registrationCities.includes("All Cities") ||
    selectedFilters.registrationCities.includes(car.registrationCity);

  // Location filter
  const matchesLocation = selectedFilters.locations.length === 0 || 
    selectedFilters.locations.includes("All Cities") ||
    selectedFilters.locations.includes(car.location);

  // Body color filter
  const matchesBodyColor = selectedFilters.bodyColors.length === 0 || 
    selectedFilters.bodyColors.includes("All Colors") ||
    selectedFilters.bodyColors.some(color => car.bodyColor?.toLowerCase().includes(color.toLowerCase()));

  // KM driven filter
  const carKm = Number(car.kmDriven) || 0;
  const matchesKm = carKm >= selectedFilters.kmDriven.min && carKm <= selectedFilters.kmDriven.max;

  // Price filter
  const carPrice = car.price ? Number(String(car.price).replace(/[^0-9]/g, "")) : 0;
  const matchesPrice = carPrice >= selectedFilters.price.min && carPrice <= selectedFilters.price.max;

  // Fuel type filter
  const matchesFuelType = selectedFilters.fuelTypes.length === 0 || 
    selectedFilters.fuelTypes.includes("All Fuel Types") ||
    selectedFilters.fuelTypes.includes(car.fuelType);

  // Engine capacity filter
  const carEngine = Number(car.engineCapacity) || 0;
  const matchesEngine = carEngine >= selectedFilters.engineCapacity.min && carEngine <= selectedFilters.engineCapacity.max;

  // Transmission filter
  const matchesTransmission = selectedFilters.transmissions.length === 0 || 
    selectedFilters.transmissions.includes("All Transmissions") ||
    selectedFilters.transmissions.includes(car.transmission);

  // Assembly filter
  const matchesAssembly = selectedFilters.assemblies.length === 0 || 
    selectedFilters.assemblies.includes("All Assemblies") ||
    selectedFilters.assemblies.includes(car.assembly);

  // Body type filter
  const matchesBodyType = selectedFilters.bodyTypes.length === 0 || 
    selectedFilters.bodyTypes.includes("All Body Types") ||
    selectedFilters.bodyTypes.includes(car.bodyType);

  // Special filters
  const matchesCertified = !selectedFilters.isCertified || car.isCertified === true;
  const matchesFeatured = !selectedFilters.isFeatured || car.isFeatured === "Approved";
  const matchesSaleItForMe = !selectedFilters.isSaleItForMe || car.isSaleItForMe === true;

  // Category filters
  let matchesCategory = true;
  if (selectedFilters.categories.length > 0 && !selectedFilters.categories.includes("All Categories")) {
    matchesCategory = selectedFilters.categories.some(category => {
      switch (category) {
        case "Automatic Cars":
          return car.transmission?.toLowerCase().includes("automatic");
        case "Family Cars":
          return car.bodyType?.toLowerCase().includes("sedan") || 
                 car.bodyType?.toLowerCase().includes("suv") ||
                 car.bodyType?.toLowerCase().includes("hatchback");
        case "Low Price Cars":
          return carPrice <= 2000000; // Cars under 20 lakh
        case "1000cc Cars":
          return carEngine <= 1000;
        case "660 CC Cars":
          return carEngine <= 660;
        case "Low Mileage Cars":
          return carKm <= 50000;
        case "Japanese Cars":
          return ["Toyota", "Honda", "Suzuki", "Nissan", "Mazda", "Mitsubishi", "Daihatsu"].includes(car.make);
        case "Urgent Sale":
          return car.isUrgentSale === true;
        case "Imported Cars":
          return car.assembly?.toLowerCase().includes("imported");
        case "1300 CC Cars":
          return carEngine <= 1300;
        case "Old Cars":
          return carYear <= 2010;
        case "Modified Cars":
          return car.isModified === true;
        case "Electric Cars":
          return car.fuelType?.toLowerCase().includes("electric");
        case "Duplicate Documents":
          return car.hasDuplicateDocuments === true;
        case "Accidental Cars":
          return car.isAccidental === true;
        case "Jeeps":
          return car.bodyType?.toLowerCase().includes("jeep") || car.make?.toLowerCase().includes("jeep");
        case "Hybrid Cars":
          return car.fuelType?.toLowerCase().includes("hybrid");
        case "Sports Cars":
          return car.bodyType?.toLowerCase().includes("coupe") || 
                 car.bodyType?.toLowerCase().includes("sports");
        case "Auctioned Cars":
          return car.isAuctioned === true;
        case "Commercial Vehicles":
          return car.bodyType?.toLowerCase().includes("truck") || 
                 car.bodyType?.toLowerCase().includes("van") ||
                 car.bodyType?.toLowerCase().includes("pickup");
        case "Full Crashed Cars":
          return car.isFullyCrashed === true;
        case "Diesel Vehicles":
          return car.fuelType?.toLowerCase().includes("diesel");
        case "Vintage Cars":
          return carYear <= 1990;
        default:
          return false;
      }
    });
  }

  return (
    matchesSearch &&
    matchesBrand &&
    matchesModel &&
    matchesVariant &&
    matchesYear &&
    matchesRegistrationCity &&
    matchesLocation &&
    matchesBodyColor &&
    matchesKm &&
    matchesPrice &&
    matchesFuelType &&
    matchesEngine &&
    matchesTransmission &&
    matchesAssembly &&
    matchesBodyType &&
    matchesCertified &&
    matchesFeatured &&
    matchesSaleItForMe &&
    matchesCategory
  );
});
```

### 4. Update Filter Modal Usage

```tsx
<FilterModal
  visible={modalVisible}
  onClose={() => setModalVisible(false)}
  onApplyFilters={(filters) => {
    setSelectedFilters(filters);
    setModalVisible(false);
  }}
/>
```

### 5. Add Active Filter Count

Add a function to count active filters for the UI:

```tsx
const getActiveFiltersCount = () => {
  let count = 0;
  if (selectedFilters.brands.length > 0 && !selectedFilters.brands.includes("All Brands")) count++;
  if (selectedFilters.models.length > 0 && !selectedFilters.models.includes("All Models")) count++;
  if (selectedFilters.variants.length > 0 && !selectedFilters.variants.includes("All Variants")) count++;
  if (selectedFilters.registrationCities.length > 0 && !selectedFilters.registrationCities.includes("All Cities")) count++;
  if (selectedFilters.locations.length > 0 && !selectedFilters.locations.includes("All Cities")) count++;
  if (selectedFilters.bodyColors.length > 0 && !selectedFilters.bodyColors.includes("All Colors")) count++;
  if (selectedFilters.fuelTypes.length > 0 && !selectedFilters.fuelTypes.includes("All Fuel Types")) count++;
  if (selectedFilters.transmissions.length > 0 && !selectedFilters.transmissions.includes("All Transmissions")) count++;
  if (selectedFilters.assemblies.length > 0 && !selectedFilters.assemblies.includes("All Assemblies")) count++;
  if (selectedFilters.bodyTypes.length > 0 && !selectedFilters.bodyTypes.includes("All Body Types")) count++;
  if (selectedFilters.categories.length > 0 && !selectedFilters.categories.includes("All Categories")) count++;
  if (selectedFilters.isCertified) count++;
  if (selectedFilters.isFeatured) count++;
  if (selectedFilters.isSaleItForMe) count++;
  if (selectedFilters.years.min !== 1970 || selectedFilters.years.max !== new Date().getFullYear()) count++;
  if (selectedFilters.kmDriven.min !== 0 || selectedFilters.kmDriven.max !== 500000) count++;
  if (selectedFilters.price.min !== 0 || selectedFilters.price.max !== 50000000) count++;
  if (selectedFilters.engineCapacity.min !== 0 || selectedFilters.engineCapacity.max !== 6000) count++;
  return count;
};
```

### 6. Update Filter Button UI

```tsx
<TouchableOpacity
  style={styles.filterButton}
  onPress={() => setModalVisible(true)}
>
  <Ionicons name="options-outline" size={20} color="#CD0100" />
  <Text style={styles.filterButtonText}>Filters</Text>
  {getActiveFiltersCount() > 0 && (
    <View style={styles.filterBadge}>
      <Text style={styles.filterBadgeText}>{getActiveFiltersCount()}</Text>
    </View>
  )}
</TouchableOpacity>
```

## Features

### Range Sliders
- **Year Range**: 1970 to current year
- **Price Range**: 0 to 50,000,000 PKR
- **KM Driven**: 0 to 500,000 km
- **Engine Capacity**: 0 to 6,000 CC

### Multiple Selection
- All filter properties support multiple selection
- "All" options clear individual selections
- Visual feedback for selected items

### Category Filters
- 24 predefined categories for quick filtering
- Smart category logic (e.g., "Family Cars" = Sedan, SUV, Hatchback)
- Easy to add new categories

### Special Filters
- Toggle switches for boolean filters
- AutoFinder Certified
- Featured Cars
- Sale It For Me

## Performance Tips

1. **Use Range Filters**: Range sliders are more efficient than multiple individual selections
2. **Category First**: Apply category filters first to reduce the dataset
3. **Lazy Loading**: Consider pagination for large result sets
4. **Debounce Search**: Add debouncing to search input for better performance

## Testing

Test the following scenarios:
1. Individual filter properties
2. Multiple filter combinations
3. Category filters
4. Range slider interactions
5. Search with filters
6. Reset functionality
7. Edge cases (empty results, invalid data)

## Customization

### Adding New Categories
Add new categories to the `categories` array in FilterModal.tsx:

```tsx
const categories = [
  // ... existing categories
  "Your New Category"
];
```

Then add the logic in the filtering function:

```tsx
case "Your New Category":
  return // your filtering logic here
```

### Adding New Filter Properties
1. Add to the filter state interface
2. Add to the filter state initialization
3. Add to the filtering logic
4. Add to the FilterModal UI
5. Add to the reset function

## Support

For issues or questions:
1. Check the console for errors
2. Verify filter state structure
3. Test individual filter properties
4. Check data format compatibility

---

**Note**: This enhanced filtering system provides comprehensive search capabilities similar to major automotive platforms like PakWheels and OLX. The system is designed to be scalable and maintainable.
