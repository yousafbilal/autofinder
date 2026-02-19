// Safe filtering utility functions to prevent undefined errors

/**
 * ✅ Check if an ad should be shown in PUBLIC listings (Used Cars, Used Bikes, Car on Rent, AutoFinder Store)
 * Returns FALSE if ad is:
 * - Inactive (isActive === false)
 * - Deleted (isDeleted === true)
 * - Rejected by admin (adStatus === 'rejected' OR isFeatured === 'Rejected' OR paymentStatus === 'rejected')
 * - Expired (expiryDate/featuredExpiryDate has passed)
 */
export const isAdValidForPublicListing = (ad: any): boolean => {
  if (!ad) return false;
  
  // ❌ Must not be deleted
  if (ad.isDeleted === true) {
    console.log(`🚫 Ad ${ad._id} hidden: isDeleted=true`);
    return false;
  }
  
  // ❌ Must not be rejected by admin
  const isRejected = ad.adStatus === 'rejected' || 
                    ad.isFeatured === 'Rejected' || 
                    ad.paymentStatus === 'rejected';
  if (isRejected) {
    console.log(`🚫 Ad ${ad._id} hidden: rejected by admin`);
    return false;
  }

  // ✅ Check if it's a free ad (check adSource FIRST to override incorrect modelType from backend)
  // Check this BEFORE isFeatured check so free ads aren't filtered by premium pending status
  const isFreeAd = ad.adSource === 'free_ads' || ad.modelType === 'Free';
  
  // ❌ Premium Pending: do not show in public listing until admin approves
  // BUT: Don't filter free ads by isFeatured status - free ads can have isFeatured: Pending but still show
  if (ad.isFeatured === 'Pending' && !isFreeAd) {
    console.log(`🚫 Ad ${ad._id} hidden: premium pending approval`);
    return false;
  }
  
  // ✅ Check if it's an approved premium car (isFeatured === 'Approved' OR paymentStatus === 'verified' OR adStatus === 'approved')
  // Premium approved cars should show even if isActive is false or undefined
  const isApprovedPremium = ad.isFeatured === 'Approved' || 
                           ad.isFeatured === true || 
                           ad.paymentStatus === 'verified' ||
                           ad.adStatus === 'approved' ||
                           (ad.adSource === 'featured_ads' && !isFreeAd) ||
                           (ad.modelType === 'Featured' && !isFreeAd);
  
  // Check if ad is active (handle undefined as inactive)
  const isActive = ad.isActive === true;
  
  // ❌ For free ads: Must be active (isActive === true) - user requirement: only show active free cars
  if (isFreeAd && !isActive) {
    console.log(`🚫 Free ad ${ad._id} hidden: isActive=${ad.isActive} (only active free cars should show) - adSource: ${ad.adSource}, modelType: ${ad.modelType}`);
    return false;
  }
  
  // ❌ For non-premium, non-free ads: Must be active (isActive === true)
  // ✅ For approved premium ads: Allow even if isActive is false or undefined (admin approval is main criteria)
  if (!isApprovedPremium && !isFreeAd && !isActive) {
    console.log(`🚫 Ad ${ad._id} hidden: isActive=${ad.isActive} (not approved premium or free)`);
    return false;
  }
  
  // Debug: Log free ads that pass validation
  if (isFreeAd && isActive) {
    console.log(`✅ Free ad validation check PASSED: ${ad.make} ${ad.model} - isActive: ${ad.isActive}, adSource: ${ad.adSource}, modelType: ${ad.modelType}`);
  }
  
  // Debug: Log premium cars that pass initial checks
  if (isApprovedPremium) {
    console.log(`✅ Premium car initial check PASSED: ${ad.make} ${ad.model} (isFeatured: ${ad.isFeatured}, isActive: ${ad.isActive}, adSource: ${ad.adSource}, modelType: ${ad.modelType})`);
  }
  
  // Debug: Log free ads that pass initial checks
  if (isFreeAd) {
    console.log(`✅ Free ad initial check PASSED: ${ad.make} ${ad.model} (isActive: ${ad.isActive}, adSource: ${ad.adSource}, modelType: ${ad.modelType})`);
  }
  
  // ❌ Check if ad is EXPIRED
  const now = new Date();
  
  // Check featuredExpiryDate (premium ads)
  if (ad.featuredExpiryDate) {
    const expiry = new Date(ad.featuredExpiryDate);
    if (!isNaN(expiry.getTime()) && expiry < now) {
      console.log(`🚫 Ad ${ad._id} hidden: featuredExpiryDate expired`);
      return false;
    }
  }
  
  // Check expiryDate (paid ads, free bikes with 15 day expiry)
  if (ad.expiryDate) {
    const expiry = new Date(ad.expiryDate);
    if (!isNaN(expiry.getTime()) && expiry < now) {
      console.log(`🚫 Ad ${ad._id} hidden: expiryDate expired`);
      return false;
    }
  }
  
  // Check expiryStatus field if set
  if (ad.expiryStatus === 'expired') {
    console.log(`🚫 Ad ${ad._id} hidden: expiryStatus=expired`);
    return false;
  }
  
  // Check package validity for premium ads with validityDays and approvedAt
  if (ad.validityDays && ad.approvedAt) {
    const approvedDate = new Date(ad.approvedAt);
    if (!isNaN(approvedDate.getTime())) {
      const expiryDate = new Date(approvedDate);
      expiryDate.setDate(expiryDate.getDate() + ad.validityDays);
      if (expiryDate < now) {
        console.log(`🚫 Ad ${ad._id} hidden: package validity expired (${ad.validityDays} days from approval)`);
        console.log(`   Approved: ${approvedDate.toISOString()}, Expiry: ${expiryDate.toISOString()}, Now: ${now.toISOString()}`);
        return false;
      } else if (isApprovedPremium) {
        console.log(`✅ Premium ad validity check PASSED: ${ad.make} ${ad.model} - expires ${expiryDate.toISOString()}`);
      }
    }
  }
  
  // ✅ Ad is valid for public listing
  if (isApprovedPremium) {
    console.log(`✅ FINAL VALIDATION PASSED: Premium car ${ad.make} ${ad.model} (ID: ${ad._id}) is VALID`);
  }
  return true;
};

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

// Safe filtering function for cars
export const filterCarsSafely = (cars: any[], filters: any, searchQuery: string = '') => {
  if (!Array.isArray(cars)) return [];
  return cars.filter((car) => {
    try {
      const isManaged = car.modelType === "ListItForYou" || car.adSource === "list_it_for_you_ad";
      const isFree = car.modelType === "Free" || car.adSource === "free_ads";
      const isPremium =
        car.modelType === "Featured" ||
        car.adSource === "featured_ads" ||
        car.isFeatured === "Approved" ||
        car.isFeatured === true;

      // Check if we have any specific filters applied (brand, model, city, etc.)
      const hasSpecificFilters = (
        safeArrayLength(safeObjectProperty(filters, 'brands', [])) > 0 ||
        safeArrayLength(safeObjectProperty(filters, 'models', [])) > 0 ||
        safeArrayLength(safeObjectProperty(filters, 'locations', [])) > 0 ||
        safeArrayLength(safeObjectProperty(filters, 'bodyTypes', [])) > 0 ||
        safeArrayLength(safeObjectProperty(filters, 'transmissions', [])) > 0 ||
        safeArrayLength(safeObjectProperty(filters, 'assemblies', [])) > 0 ||
        safeObjectProperty(filters, 'price', { min: 0, max: 50000000 }).min !== 0 ||
        safeObjectProperty(filters, 'price', { min: 0, max: 50000000 }).max !== 50000000 ||
        safeObjectProperty(filters, 'years', { min: 1970, max: new Date().getFullYear() }).min !== 1970 ||
        safeObjectProperty(filters, 'years', { min: 1970, max: new Date().getFullYear() }).max !== new Date().getFullYear() ||
        safeArrayLength(safeObjectProperty(filters, 'categories', [])) > 0
      );

      // BYPASS filters (show all) when user hasn't applied specific filters
      // - Managed by AutoFinder cars
      // - Free ads (including paid 525 ones)
      // - Premium cars (admin approved)
      if (!hasSpecificFilters && (isManaged || isFree || isPremium)) {
        if (isManaged) {
          console.log(`✅ MANAGED car bypassed filters (no specific filters): ${car.make} ${car.model}`);
        } else if (isFree) {
          console.log(`✅ FREE ad bypassed filters (no specific filters): ${car.make} ${car.model} (modelType: ${car.modelType}, adSource: ${car.adSource})`);
        } else if (isPremium) {
          console.log(`✅ PREMIUM car bypassed filters (no specific filters): ${car.make} ${car.model}`);
        }
        return true;
      }
      
      // Debug: Log free ads that don't bypass filters
      if (isFree && hasSpecificFilters) {
        console.log(`🔍 FREE ad must pass filters: ${car.make} ${car.model} (modelType: ${car.modelType}, adSource: ${car.adSource})`);
      }

      // If specific filters are applied, even managed cars must pass the filters
      if (isManaged && hasSpecificFilters) {
        console.log(`🔍 MANAGED car must pass filters: ${car.make} ${car.model}`);
      }
      
      // Search query filter
      const carName = `${safeString(car.make)} ${safeString(car.model)} ${safeString(car.variant)} ${safeString(car.year)}`.toLowerCase();
      const matchesSearch = !searchQuery || carName.includes(searchQuery.toLowerCase());

      // Brand filter
      const brands = safeObjectProperty(filters, 'brands', []);
      const matchesBrand = safeArrayLength(brands) === 0 || 
        safeArrayIncludes(brands, "All Brands") ||
        safeArraySome(brands, (brand: string) => 
          safeString(car.make).toLowerCase().includes(safeString(brand).toLowerCase())
        );

      // Model filter
      const models = safeObjectProperty(filters, 'models', []);
      const matchesModel = safeArrayLength(models) === 0 || 
        safeArrayIncludes(models, "All Models") ||
        safeArraySome(models, (model: string) => 
          safeString(car.model).toLowerCase().includes(safeString(model).toLowerCase())
        );

      // Variant filter
      const variants = safeObjectProperty(filters, 'variants', []);
      const matchesVariant = safeArrayLength(variants) === 0 || 
        safeArrayIncludes(variants, "All Variants") ||
        safeArraySome(variants, (variant: string) => 
          safeString(car.variant).toLowerCase().includes(safeString(variant).toLowerCase())
        );

      // Year filter
      const years = safeObjectProperty(filters, 'years', { min: 1970, max: new Date().getFullYear() });
      const carYear = safeNumber(car.year);
      // If year is missing and this is a Free ad and there are no specific filters on year, allow it
      const matchesYear = (carYear === 0 && isFree && !hasSpecificFilters)
        ? true
        : carYear >= safeNumber(years.min, 1970) && carYear <= safeNumber(years.max, new Date().getFullYear());

      // Registration city filter - supports multiple selection
      const registrationCities = safeObjectProperty(filters, 'registrationCities', []);
      const matchesRegistrationCity = safeArrayLength(registrationCities) === 0 || 
        safeArrayIncludes(registrationCities, "All Cities") ||
        safeArraySome(registrationCities, (city: string) => 
          safeString(car.registrationCity).toLowerCase().includes(safeString(city).toLowerCase())
        );

      // Location filter - supports multiple selection
      const locations = safeObjectProperty(filters, 'locations', []);
      const matchesLocation = safeArrayLength(locations) === 0 || 
        safeArrayIncludes(locations, "All Cities") ||
        safeArraySome(locations, (city: string) => 
          safeString(car.location).toLowerCase().includes(safeString(city).toLowerCase())
        );

      // Body color filter
      const bodyColors = safeObjectProperty(filters, 'bodyColors', []);
      const matchesBodyColor = safeArrayLength(bodyColors) === 0 || 
        safeArrayIncludes(bodyColors, "All Colors") ||
        safeArraySome(bodyColors, (color: string) => 
          safeString(car.bodyColor).toLowerCase().includes(safeString(color).toLowerCase())
        );

      // KM driven filter
      const kmDriven = safeObjectProperty(filters, 'kmDriven', { min: 0, max: 500000 });
      const carKm = safeNumber(car.kmDriven);
      const matchesKm = carKm >= safeNumber(kmDriven.min, 0) && carKm <= safeNumber(kmDriven.max, 500000);

      // Price filter
      const price = safeObjectProperty(filters, 'price', { min: 0, max: 50000000 });
      const carPrice = car.price && typeof car.price === 'string' ? 
        safeNumber(String(car.price).replace(/[^0-9]/g, "")) : 
        (typeof car.price === 'number' ? safeNumber(car.price) : 0);
      const matchesPrice = carPrice >= safeNumber(price.min, 0) && carPrice <= safeNumber(price.max, 50000000);

      // Fuel type filter
      const fuelTypes = safeObjectProperty(filters, 'fuelTypes', []);
      const matchesFuelType = safeArrayLength(fuelTypes) === 0 || 
        safeArrayIncludes(fuelTypes, "All Fuel Types") ||
        safeArrayIncludes(fuelTypes, safeString(car.fuelType));

      // Engine capacity filter
      const engineCapacity = safeObjectProperty(filters, 'engineCapacity', { min: 0, max: 6000 });
      const carEngine = safeNumber(car.engineCapacity);
      const matchesEngine = carEngine >= safeNumber(engineCapacity.min, 0) && carEngine <= safeNumber(engineCapacity.max, 6000);

      // Transmission filter
      const transmissions = safeObjectProperty(filters, 'transmissions', []);
      const matchesTransmission = safeArrayLength(transmissions) === 0 || 
        safeArrayIncludes(transmissions, "All Transmissions") ||
        safeArrayIncludes(transmissions, safeString(car.transmission));

      // Assembly filter
      const assemblies = safeObjectProperty(filters, 'assemblies', []);
      const matchesAssembly = safeArrayLength(assemblies) === 0 || 
        safeArrayIncludes(assemblies, "All Assemblies") ||
        safeArrayIncludes(assemblies, safeString(car.assembly));

      // Body type filter
      const bodyTypes = safeObjectProperty(filters, 'bodyTypes', []);
      const matchesBodyType = safeArrayLength(bodyTypes) === 0 || 
        safeArrayIncludes(bodyTypes, "All Body Types") ||
        safeArrayIncludes(bodyTypes, safeString(car.bodyType));

      // Special filters
      const isCertified = safeObjectProperty(filters, 'isCertified', false);
      const matchesCertified = !isCertified || car.isCertified === true;

      const isFeatured = safeObjectProperty(filters, 'isFeatured', false);
      const matchesFeatured = !isFeatured || car.isFeatured === "Approved";

      const isSaleItForMe = safeObjectProperty(filters, 'isSaleItForMe', false);
      const matchesSaleItForMe = !isSaleItForMe || car.isSaleItForMe === true;

      // Category filters
      const categories = safeObjectProperty(filters, 'categories', []);
      let matchesCategory = true;
      if (safeArrayLength(categories) > 0 && !safeArrayIncludes(categories, "All Categories")) {
        matchesCategory = safeArraySome(categories, (category: string) => {
          switch (category) {
            case "Automatic Cars":
              return safeString(car.transmission).toLowerCase().includes("automatic");
            case "Family Cars":
              const bodyType = safeString(car.bodyType).toLowerCase();
              return bodyType.includes("sedan") || bodyType.includes("suv") || bodyType.includes("hatchback");
            case "Low Price Cars":
              return carPrice <= 2000000;
            case "1000cc Cars":
              return carEngine <= 1000;
            case "660 CC Cars":
              return carEngine <= 660;
            case "Low Mileage Cars":
              return carKm <= 50000;
            case "Japanese Cars":
              return ["Toyota", "Honda", "Suzuki", "Nissan", "Mazda", "Mitsubishi", "Daihatsu"].includes(safeString(car.make));
            case "Urgent Sale":
              return car.isUrgentSale === true;
            case "Imported Cars":
              return safeString(car.assembly).toLowerCase().includes("imported");
            case "1300 CC Cars":
              return carEngine <= 1300;
            case "Old Cars":
              return carYear <= 2010;
            case "Modified Cars":
              return car.isModified === true;
            case "Electric Cars":
              return safeString(car.fuelType).toLowerCase().includes("electric");
            case "Duplicate Documents":
              return car.hasDuplicateDocuments === true;
            case "Accidental Cars":
              return car.isAccidental === true;
            case "Jeeps":
              const carBodyType = safeString(car.bodyType).toLowerCase();
              const carMake = safeString(car.make).toLowerCase();
              return carBodyType.includes("jeep") || carMake.includes("jeep");
            case "Hybrid Cars":
              return safeString(car.fuelType).toLowerCase().includes("hybrid");
            case "Sports Cars":
              const sportsBodyType = safeString(car.bodyType).toLowerCase();
              return sportsBodyType.includes("coupe") || sportsBodyType.includes("sports");
            case "Auctioned Cars":
              return car.isAuctioned === true;
            case "Commercial Vehicles":
              const commercialBodyType = safeString(car.bodyType).toLowerCase();
              return commercialBodyType.includes("truck") || commercialBodyType.includes("van") || commercialBodyType.includes("pickup");
            case "Full Crashed Cars":
              return car.isFullyCrashed === true;
            case "Diesel Vehicles":
              return safeString(car.fuelType).toLowerCase().includes("diesel");
            case "Vintage Cars":
              return carYear <= 1990;
            default:
              return false;
          }
        });
      }

      const passesAllFilters = (
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
      
      // Debug: Log which filter is rejecting managed cars
      if (isManaged && !passesAllFilters) {
        console.log(`🚫 MANAGED car rejected: ${car.make} ${car.model} (ID: ${car._id})`);
        console.log(`  Filters: search=${matchesSearch}, brand=${matchesBrand}, model=${matchesModel}, variant=${matchesVariant}`);
        console.log(`  year=${matchesYear}, regCity=${matchesRegistrationCity}, location=${matchesLocation}`);
        console.log(`  color=${matchesBodyColor}, km=${matchesKm}, price=${matchesPrice}`);
        console.log(`  fuel=${matchesFuelType}, engine=${matchesEngine}, trans=${matchesTransmission}`);
        console.log(`  assembly=${matchesAssembly}, bodyType=${matchesBodyType}`);
        console.log(`  certified=${matchesCertified}, featured=${matchesFeatured}, saleIt=${matchesSaleItForMe}, category=${matchesCategory}`);
      }
      
      return passesAllFilters;
    } catch (error) {
      console.error('Error filtering car:', error, car);
      return true; // Include car if there's an error to avoid losing data
    }
  });
};
