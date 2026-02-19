// Safe filtering utility functions for rental vehicles to prevent undefined errors

export const safeArrayLength = (arr: any[] | undefined): number => {
  return Array.isArray(arr) ? arr.length : 0;
};

export const safeArrayIncludes = (arr: any[] | undefined, value: any): boolean => {
  return Array.isArray(arr) ? arr.includes(value) : false;
};

export const safeArraySome = (arr: any[] | undefined, predicate: (item: any) => boolean): boolean => {
  return Array.isArray(arr) ? arr.some(predicate) : false;
};

export const safeArrayMap = (arr: any[] | undefined, mapper: (item: any) => any): any[] => {
  return Array.isArray(arr) ? arr.map(mapper) : [];
};

export const safeObjectProperty = (obj: any, property: string, defaultValue: any = null) => {
  return obj && typeof obj === 'object' && property in obj ? obj[property] : defaultValue;
};

export const safeNumber = (value: any, defaultValue: number = 0): number => {
  const num = Number(value);
  return isNaN(num) ? defaultValue : num;
};

export const safeString = (value: any, defaultValue: string = ''): string => {
  return value && typeof value === 'string' ? value : defaultValue;
};

// Safe filtering function for rental vehicles
export const filterRentalVehiclesSafely = (vehicles: any[], filters: any, searchQuery: string = '') => {
  return vehicles.filter((vehicle) => {
    try {
      // Search query filter (matches title)
      const vehicleTitle = safeString(vehicle.title).toLowerCase();
      const matchesSearch = !searchQuery || vehicleTitle.includes(searchQuery.toLowerCase());

      // Brand filter
      const brands = safeObjectProperty(filters, 'brands', []);
      const matchesBrand = safeArrayLength(brands) === 0 || 
        safeArrayIncludes(brands, "All Brands") ||
        safeArraySome(brands, (brand: string) => 
          safeString(vehicle.brand).toLowerCase().includes(safeString(brand).toLowerCase())
        );

      // Model filter
      const models = safeObjectProperty(filters, 'models', []);
      const matchesModel = safeArrayLength(models) === 0 || 
        safeArrayIncludes(models, "All Models") ||
        safeArraySome(models, (model: string) => 
          safeString(vehicle.model).toLowerCase().includes(safeString(model).toLowerCase())
        );

      // Year filter
      const years = safeObjectProperty(filters, 'years', { min: 1970, max: new Date().getFullYear() });
      const vehicleYear = safeNumber(vehicle.year);
      const matchesYear = vehicleYear >= safeNumber(years.min, 1970) && vehicleYear <= safeNumber(years.max, new Date().getFullYear());

      // Registration city filter
      const registrationCities = safeObjectProperty(filters, 'registrationCities', []);
      const matchesRegistrationCity = safeArrayLength(registrationCities) === 0 || 
        safeArrayIncludes(registrationCities, "All Cities") ||
        safeArrayIncludes(registrationCities, safeString(vehicle.registrationCity));

      // Location filter
      const locations = safeObjectProperty(filters, 'locations', []);
      const matchesLocation = safeArrayLength(locations) === 0 || 
        safeArrayIncludes(locations, "All Cities") ||
        safeArrayIncludes(locations, safeString(vehicle.location));

      // Body color filter
      const bodyColors = safeObjectProperty(filters, 'bodyColors', []);
      const matchesBodyColor = safeArrayLength(bodyColors) === 0 || 
        safeArrayIncludes(bodyColors, "All Colors") ||
        safeArraySome(bodyColors, (color: string) => 
          safeString(vehicle.bodyColor).toLowerCase().includes(safeString(color).toLowerCase())
        );

      // Budget range filter
      const budgetRange = safeObjectProperty(filters, 'budgetRange', { min: 0, max: 100000 });
      const vehiclePrice = vehicle.price && typeof vehicle.price === 'string' ? 
        safeNumber(String(vehicle.price).replace(/[^0-9]/g, "")) : 
        (typeof vehicle.price === 'number' ? safeNumber(vehicle.price) : 0);
      const matchesBudget = vehiclePrice >= safeNumber(budgetRange.min, 0) && vehiclePrice <= safeNumber(budgetRange.max, 100000);

      // Tenure filter
      const tenure = safeObjectProperty(filters, 'tenure', { min: 1, max: 30 });
      const vehicleTenure = safeNumber(vehicle.tenure);
      const matchesTenure = vehicleTenure >= safeNumber(tenure.min, 1) && vehicleTenure <= safeNumber(tenure.max, 30);

      // Drive mode filter
      const driveMode = safeObjectProperty(filters, 'driveMode', []);
      const matchesDriveMode = safeArrayLength(driveMode) === 0 || 
        safeArrayIncludes(driveMode, "All Drive Modes") ||
        safeArrayIncludes(driveMode, safeString(vehicle.driveMode));

      // Payment type filter
      const paymentType = safeObjectProperty(filters, 'paymentType', []);
      const matchesPaymentType = safeArrayLength(paymentType) === 0 || 
        safeArrayIncludes(paymentType, "All Payment Types") ||
        safeArrayIncludes(paymentType, safeString(vehicle.paymentType));

      // Fuel type filter
      const fuelTypes = safeObjectProperty(filters, 'fuelTypes', []);
      const matchesFuelType = safeArrayLength(fuelTypes) === 0 || 
        safeArrayIncludes(fuelTypes, "All Fuel Types") ||
        safeArrayIncludes(fuelTypes, safeString(vehicle.fuelType));

      // Engine capacity filter
      const engineCapacity = safeObjectProperty(filters, 'engineCapacity', { min: 0, max: 6000 });
      const vehicleEngine = safeNumber(vehicle.engineCapacity);
      const matchesEngine = vehicleEngine >= safeNumber(engineCapacity.min, 0) && vehicleEngine <= safeNumber(engineCapacity.max, 6000);

      // Transmission filter
      const transmissions = safeObjectProperty(filters, 'transmissions', []);
      const matchesTransmission = safeArrayLength(transmissions) === 0 || 
        safeArrayIncludes(transmissions, "All Transmissions") ||
        safeArrayIncludes(transmissions, safeString(vehicle.transmission));

      // Assembly filter
      const assemblies = safeObjectProperty(filters, 'assemblies', []);
      const matchesAssembly = safeArrayLength(assemblies) === 0 || 
        safeArrayIncludes(assemblies, "All Assemblies") ||
        safeArrayIncludes(assemblies, safeString(vehicle.assembly));

      // Body type filter
      const bodyTypes = safeObjectProperty(filters, 'bodyTypes', []);
      const matchesBodyType = safeArrayLength(bodyTypes) === 0 || 
        safeArrayIncludes(bodyTypes, "All Body Types") ||
        safeArrayIncludes(bodyTypes, safeString(vehicle.bodyType));

      return (
        matchesSearch &&
        matchesBrand &&
        matchesModel &&
        matchesYear &&
        matchesRegistrationCity &&
        matchesLocation &&
        matchesBodyColor &&
        matchesBudget &&
        matchesTenure &&
        matchesDriveMode &&
        matchesPaymentType &&
        matchesFuelType &&
        matchesEngine &&
        matchesTransmission &&
        matchesAssembly &&
        matchesBodyType
      );
    } catch (error) {
      console.error('Error filtering rental vehicle:', error, vehicle);
      return true; // Include vehicle if there's an error to avoid losing data
    }
  });
};
