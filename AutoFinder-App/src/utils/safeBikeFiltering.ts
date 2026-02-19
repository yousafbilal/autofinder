// Safe filtering utility functions for bikes to prevent undefined errors

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

// Safe filtering function for bikes
export const filterBikesSafely = (bikes: any[], filters: any, searchQuery: string = '') => {
  return bikes.filter((bike) => {
    try {
      // Search query filter - check both company and make fields
      const companyOrMake = safeString(bike.company) || safeString(bike.make) || '';
      const bikeName = `${companyOrMake} ${safeString(bike.model)} ${safeString(bike.year)}`.toLowerCase();
      const matchesSearch = !searchQuery || bikeName.includes(searchQuery.toLowerCase());

      // Company filter - check both company and make fields
      const companies = safeObjectProperty(filters, 'companies', []);
      const bikeCompanyOrMake = safeString(bike.company) || safeString(bike.make) || '';
      const matchesCompany = safeArrayLength(companies) === 0 || 
        safeArrayIncludes(companies, "All Companies") ||
        safeArraySome(companies, (company: string) => 
          bikeCompanyOrMake.toLowerCase().includes(safeString(company).toLowerCase())
        );

      // Model filter
      const models = safeObjectProperty(filters, 'models', []);
      const matchesModel = safeArrayLength(models) === 0 || 
        safeArrayIncludes(models, "All Models") ||
        safeArraySome(models, (model: string) => 
          safeString(bike.model).toLowerCase().includes(safeString(model).toLowerCase())
        );

      // Year filter - only apply if bike has year
      const years = safeObjectProperty(filters, 'years', { min: 1970, max: new Date().getFullYear() });
      const bikeYear = bike.year !== undefined && bike.year !== null ? safeNumber(bike.year) : null;
      const matchesYear = bikeYear === null || (bikeYear >= safeNumber(years.min, 1970) && bikeYear <= safeNumber(years.max, new Date().getFullYear()));

      // Registration city filter
      const registrationCities = safeObjectProperty(filters, 'registrationCities', []);
      const matchesRegistrationCity = safeArrayLength(registrationCities) === 0 || 
        safeArrayIncludes(registrationCities, "All Cities") ||
        safeArrayIncludes(registrationCities, safeString(bike.registrationCity));

      // Location filter
      const locations = safeObjectProperty(filters, 'locations', []);
      const matchesLocation = safeArrayLength(locations) === 0 || 
        safeArrayIncludes(locations, "All Cities") ||
        safeArrayIncludes(locations, safeString(bike.location));

      // Engine capacity filter - only apply if bike has engineCapacity
      const engineCapacity = safeObjectProperty(filters, 'engineCapacity', { min: 50, max: 1000 });
      const bikeEngine = bike.engineCapacity !== undefined && bike.engineCapacity !== null ? safeNumber(bike.engineCapacity) : null;
      const matchesEngine = bikeEngine === null || (bikeEngine >= safeNumber(engineCapacity.min, 50) && bikeEngine <= safeNumber(engineCapacity.max, 1000));

      // Body color filter
      const bodyColors = safeObjectProperty(filters, 'bodyColors', []);
      const matchesBodyColor = safeArrayLength(bodyColors) === 0 || 
        safeArrayIncludes(bodyColors, "All Colors") ||
        safeArraySome(bodyColors, (color: string) => 
          safeString(bike.bodyColor).toLowerCase().includes(safeString(color).toLowerCase())
        );

      // KM driven filter - only apply if bike has kmDriven
      const kmDriven = safeObjectProperty(filters, 'kmDriven', { min: 0, max: 100000 });
      const bikeKm = bike.kmDriven !== undefined && bike.kmDriven !== null ? safeNumber(bike.kmDriven) : null;
      const matchesKm = bikeKm === null || (bikeKm >= safeNumber(kmDriven.min, 0) && bikeKm <= safeNumber(kmDriven.max, 100000));

      // Price filter - only apply if bike has price
      const price = safeObjectProperty(filters, 'price', { min: 0, max: 2000000 });
      const bikePrice = bike.price !== undefined && bike.price !== null ? 
        (bike.price && typeof bike.price === 'string' ? 
          safeNumber(String(bike.price).replace(/[^0-9]/g, "")) : 
          (typeof bike.price === 'number' ? safeNumber(bike.price) : null)) : null;
      const matchesPrice = bikePrice === null || (bikePrice >= safeNumber(price.min, 0) && bikePrice <= safeNumber(price.max, 2000000));

      // Fuel type filter
      const fuelTypes = safeObjectProperty(filters, 'fuelTypes', []);
      const matchesFuelType = safeArrayLength(fuelTypes) === 0 || 
        safeArrayIncludes(fuelTypes, "All Fuel Types") ||
        safeArrayIncludes(fuelTypes, safeString(bike.fuelType));

      // Engine type filter
      const engineTypes = safeObjectProperty(filters, 'engineTypes', []);
      const matchesEngineType = safeArrayLength(engineTypes) === 0 || 
        safeArrayIncludes(engineTypes, "All Engine Types") ||
        safeArrayIncludes(engineTypes, safeString(bike.engineType));

      // Special filters
      const isFeatured = safeObjectProperty(filters, 'isFeatured', false);
      const matchesFeatured = !isFeatured || bike.isFeatured === "Approved";

      return (
        matchesSearch &&
        matchesCompany &&
        matchesModel &&
        matchesYear &&
        matchesRegistrationCity &&
        matchesLocation &&
        matchesEngine &&
        matchesBodyColor &&
        matchesKm &&
        matchesPrice &&
        matchesFuelType &&
        matchesEngineType &&
        matchesFeatured
      );
    } catch (error) {
      console.error('Error filtering bike:', error, bike);
      return true; // Include bike if there's an error to avoid losing data
    }
  });
};
