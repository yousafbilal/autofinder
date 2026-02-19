// Safe price formatting and parsing utilities

export const safeFormatPrice = (price: any): string => {
  if (!price) {
    return 'PKR 0';
  }
  
  if (typeof price === 'number') {
    return `PKR ${price.toLocaleString()}`;
  }
  
  if (typeof price === 'string') {
    const numericPrice = price.replace(/[^0-9]/g, "");
    return `PKR ${parseInt(numericPrice || '0').toLocaleString()}`;
  }
  
  return 'PKR 0';
};

export const safeParsePrice = (price: any): number => {
  if (!price) {
    return 0;
  }
  
  if (typeof price === 'number') {
    return price;
  }
  
  if (typeof price === 'string') {
    const numericPrice = price.replace(/[^0-9]/g, "");
    return parseInt(numericPrice || '0');
  }
  
  return 0;
};

export const safeFormatKm = (km: any): string => {
  if (!km) {
    return '0 km';
  }
  
  if (typeof km === 'number') {
    return `${km.toLocaleString()} km`;
  }
  
  if (typeof km === 'string') {
    const numericKm = km.replace(/[^0-9]/g, "");
    return `${parseInt(numericKm || '0').toLocaleString()} km`;
  }
  
  return '0 km';
};

export const safeParseKm = (km: any): number => {
  if (!km) {
    return 0;
  }
  
  if (typeof km === 'number') {
    return km;
  }
  
  if (typeof km === 'string') {
    const numericKm = km.replace(/[^0-9]/g, "");
    return parseInt(numericKm || '0');
  }
  
  return 0;
};

export const safeFormatEngineCapacity = (capacity: any): string => {
  if (!capacity) {
    return '0 cc';
  }
  
  if (typeof capacity === 'number') {
    return `${capacity} cc`;
  }
  
  if (typeof capacity === 'string') {
    const numericCapacity = capacity.replace(/[^0-9]/g, "");
    return `${parseInt(numericCapacity || '0')} cc`;
  }
  
  return '0 cc';
};

export const safeParseEngineCapacity = (capacity: any): number => {
  if (!capacity) {
    return 0;
  }
  
  if (typeof capacity === 'number') {
    return capacity;
  }
  
  if (typeof capacity === 'string') {
    const numericCapacity = capacity.replace(/[^0-9]/g, "");
    return parseInt(numericCapacity || '0');
  }
  
  return 0;
};

export const safeFormatTenure = (tenure: any, unit: string = 'Days'): string => {
  if (!tenure) {
    return `0 ${unit.toLowerCase()}`;
  }
  
  const numericTenure = typeof tenure === 'number' ? tenure : parseInt(String(tenure)) || 0;
  return `${numericTenure} ${unit.toLowerCase()}`;
};

export const safeParseTenure = (tenure: any): number => {
  if (!tenure) {
    return 0;
  }
  
  if (typeof tenure === 'number') {
    return tenure;
  }
  
  if (typeof tenure === 'string') {
    const numericTenure = tenure.replace(/[^0-9]/g, "");
    return parseInt(numericTenure || '0');
  }
  
  return 0;
};
