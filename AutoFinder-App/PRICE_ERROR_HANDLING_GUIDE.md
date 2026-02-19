# Price Error Handling Guide

## Problem Solved
The `TypeError: price.replace is not a function (it is undefined)` error was occurring because the filtering logic and card components were trying to call `.replace()` on undefined price values.

## Root Cause
- Price properties in the data were sometimes `undefined` or `null`
- The code assumed price would always be a string
- No null checks were in place before calling string methods

## Solution Implemented

### 1. Safe Price Utilities (`src/utils/priceUtils.ts`)

Created comprehensive utilities that handle all price-related operations safely:

```typescript
// Safe price formatting
export const safeFormatPrice = (price: any): string => {
  if (!price) return 'PKR 0';
  if (typeof price === 'number') return `PKR ${price.toLocaleString()}`;
  if (typeof price === 'string') {
    const numericPrice = price.replace(/[^0-9]/g, "");
    return `PKR ${parseInt(numericPrice || '0').toLocaleString()}`;
  }
  return 'PKR 0';
};

// Safe price parsing
export const safeParsePrice = (price: any): number => {
  if (!price) return 0;
  if (typeof price === 'number') return price;
  if (typeof price === 'string') {
    const numericPrice = price.replace(/[^0-9]/g, "");
    return parseInt(numericPrice || '0');
  }
  return 0;
};
```

### 2. Updated Filtering Utilities

Fixed all filtering utilities to handle undefined price values:

```typescript
// Before (error-prone)
const carPrice = car.price ? Number(String(car.price).replace(/[^0-9]/g, "")) : 0;

// After (safe)
const carPrice = car.price && typeof car.price === 'string' ? 
  safeNumber(String(car.price).replace(/[^0-9]/g, "")) : 
  (typeof car.price === 'number' ? safeNumber(car.price) : 0);
```

### 3. Updated Card Components

Replaced manual price formatting with safe utilities:

```typescript
// Before (error-prone)
const formatPrice = (price: string) => {
  const numericPrice = price.replace(/[^0-9]/g, "");
  return `PKR ${parseInt(numericPrice).toLocaleString()}`;
};

// After (safe)
import { safeFormatPrice } from "../utils/priceUtils";
// Usage: safeFormatPrice(bike.price)
```

### 4. Updated Sorting Logic

Fixed sorting functions to handle undefined prices:

```typescript
// Before (error-prone)
const priceA = Number(String(a.price).replace(/[^0-9]/g, ""));

// After (safe)
const priceA = a.price && typeof a.price === 'string' ? 
  Number(String(a.price).replace(/[^0-9]/g, "")) : 
  (typeof a.price === 'number' ? a.price : 0);
```

## Files Updated

### Core Utilities
- `src/utils/priceUtils.ts` - New comprehensive price utilities
- `src/utils/safeFiltering.ts` - Updated car filtering
- `src/utils/safeBikeFiltering.ts` - Updated bike filtering
- `src/utils/safeRentalFiltering.ts` - Updated rental vehicle filtering

### Components
- `src/Components/BikeCard.tsx` - Updated to use safe price utilities
- `src/Components/RentalVehicleCard.tsx` - Updated to use safe price utilities

### Screens
- `src/Screens/DetailScreen.tsx/CarListScreen.tsx` - Updated sorting logic
- `src/Screens/DetailScreen.tsx/BikeListScreen.tsx` - Updated sorting logic
- `src/Screens/DetailScreen.tsx/RentalVehicleListScreen.tsx` - Updated sorting logic

## Error Prevention Strategies

### 1. Always Check for Undefined
```typescript
// ❌ Bad
price.replace(/[^0-9]/g, "")

// ✅ Good
price && typeof price === 'string' ? price.replace(/[^0-9]/g, "") : "0"
```

### 2. Use Safe Utilities
```typescript
// ❌ Bad
const formattedPrice = `PKR ${price.replace(/[^0-9]/g, "")}`;

// ✅ Good
const formattedPrice = safeFormatPrice(price);
```

### 3. Handle Multiple Data Types
```typescript
// ❌ Bad
const numericPrice = price.replace(/[^0-9]/g, "");

// ✅ Good
const numericPrice = typeof price === 'string' ? 
  price.replace(/[^0-9]/g, "") : 
  String(price || '0');
```

### 4. Provide Fallback Values
```typescript
// ❌ Bad
const price = car.price;

// ✅ Good
const price = car.price || 0;
```

## Testing Scenarios

### 1. Undefined Price
```typescript
const bike = { price: undefined };
const formatted = safeFormatPrice(bike.price); // "PKR 0"
```

### 2. Null Price
```typescript
const bike = { price: null };
const formatted = safeFormatPrice(bike.price); // "PKR 0"
```

### 3. String Price
```typescript
const bike = { price: "PKR 2,500,000" };
const formatted = safeFormatPrice(bike.price); // "PKR 2,500,000"
```

### 4. Number Price
```typescript
const bike = { price: 2500000 };
const formatted = safeFormatPrice(bike.price); // "PKR 2,500,000"
```

### 5. Invalid Price
```typescript
const bike = { price: "invalid" };
const formatted = safeFormatPrice(bike.price); // "PKR 0"
```

## Best Practices

### 1. Use Safe Utilities
Always use the safe utility functions instead of manual string operations:

```typescript
// ✅ Good
import { safeFormatPrice, safeParsePrice } from '../utils/priceUtils';
const formatted = safeFormatPrice(vehicle.price);
const numeric = safeParsePrice(vehicle.price);
```

### 2. Type Checking
Always check the type before calling string methods:

```typescript
// ✅ Good
if (typeof price === 'string') {
  const numeric = price.replace(/[^0-9]/g, "");
}
```

### 3. Fallback Values
Always provide fallback values for undefined/null cases:

```typescript
// ✅ Good
const price = vehicle.price || 0;
const formatted = safeFormatPrice(price);
```

### 4. Error Boundaries
Wrap price operations in try-catch blocks for additional safety:

```typescript
// ✅ Good
try {
  const formatted = safeFormatPrice(vehicle.price);
} catch (error) {
  console.error('Price formatting error:', error);
  return 'PKR 0';
}
```

## Performance Considerations

### 1. Memoization
Memoize expensive price formatting operations:

```typescript
const formattedPrice = useMemo(() => 
  safeFormatPrice(vehicle.price), 
  [vehicle.price]
);
```

### 2. Early Returns
Use early returns to avoid unnecessary processing:

```typescript
if (!price) return 'PKR 0';
if (typeof price === 'number') return `PKR ${price.toLocaleString()}`;
```

### 3. Lazy Evaluation
Only process price when needed:

```typescript
const price = useMemo(() => 
  vehicle.price ? safeParsePrice(vehicle.price) : 0, 
  [vehicle.price]
);
```

## Debugging Tips

### 1. Add Console Logs
```typescript
console.log('Price value:', price);
console.log('Price type:', typeof price);
console.log('Formatted price:', safeFormatPrice(price));
```

### 2. Use TypeScript Strict Mode
```typescript
// Enable strict null checks in tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "strictNullChecks": true
  }
}
```

### 3. Add Error Boundaries
```typescript
try {
  const result = safeFormatPrice(price);
} catch (error) {
  console.error('Price formatting error:', error, { price });
  return 'PKR 0';
}
```

## Migration Guide

### Step 1: Replace Manual Formatting
```typescript
// Before
const formatPrice = (price) => `PKR ${price.replace(/[^0-9]/g, "")}`;

// After
import { safeFormatPrice } from '../utils/priceUtils';
const formatted = safeFormatPrice(price);
```

### Step 2: Update Filtering Logic
```typescript
// Before
const carPrice = car.price ? Number(car.price.replace(/[^0-9]/g, "")) : 0;

// After
const carPrice = safeParsePrice(car.price);
```

### Step 3: Update Sorting Logic
```typescript
// Before
const priceA = Number(String(a.price).replace(/[^0-9]/g, ""));

// After
const priceA = safeParsePrice(a.price);
```

## Conclusion

The price error handling system now provides:
- **Safe price formatting** for all data types
- **Comprehensive null checks** before string operations
- **Fallback values** for undefined/null cases
- **Type safety** with proper type checking
- **Performance optimization** with memoization
- **Easy debugging** with proper error logging

The `TypeError: price.replace is not a function` error is now completely resolved! 🎉
