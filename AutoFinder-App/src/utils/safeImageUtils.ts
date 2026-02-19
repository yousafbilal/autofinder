// Safe image handling utilities to prevent undefined errors

export const safeGetImageUrl = (item: any, imageProperty: string = 'image1', fallback?: string): string | null => {
  if (!item || typeof item !== 'object') {
    return fallback || null;
  }
  
  const imageUrl = item[imageProperty];
  if (!imageUrl || typeof imageUrl !== 'string') {
    return fallback || null;
  }
  
  return imageUrl;
};

export const safeGetImageArray = (item: any): string[] => {
  if (!item || typeof item !== 'object') {
    return [];
  }
  
  const images: string[] = [];
  
  // Check for common image properties
  const imageProperties = [
    'image1', 'image2', 'image3', 'image4', 'image5', 'image6', 'image7', 'image8',
    'image9', 'image10', 'image11', 'image12', 'image13', 'image14', 'image15', 'image16',
    'image17', 'image18', 'image19', 'image20'
  ];
  
  imageProperties.forEach(prop => {
    if (item[prop] && typeof item[prop] === 'string') {
      images.push(item[prop]);
    }
  });
  
  return images;
};

export const safeGetFirstImage = (item: any, fallback?: string): string | null => {
  if (!item || typeof item !== 'object') {
    return fallback || null;
  }
  
  // Check if item has images array
  if (Array.isArray(item.images) && item.images.length > 0) {
    return item.images[0];
  }
  
  // Check for image1 property
  if (item.image1 && typeof item.image1 === 'string') {
    return item.image1;
  }
  
  // Check for image property
  if (item.image && typeof item.image === 'string') {
    return item.image;
  }
  
  return fallback || null;
};

export const safeGetImageWithApiUrl = (item: any, imageProperty: string = 'image1', apiUrl: string = ''): string | null => {
  const imageUrl = safeGetImageUrl(item, imageProperty);
  if (!imageUrl) {
    return null;
  }
  
  // If imageUrl already contains http, return as is
  if (imageUrl && imageUrl.startsWith('http')) {
    return imageUrl;
  }
  
  // If image path already begins with '/uploads', don't add another '/uploads'
  if (imageUrl.startsWith('/uploads') || imageUrl.startsWith('uploads/')) {
    const clean = imageUrl.startsWith('/') ? imageUrl.substring(1) : imageUrl;
    const parts = clean.split('/');
    const file = parts.pop() as string;
    const base = parts.join('/');
    return `${apiUrl}/${base}/${encodeURIComponent(file)}`;
  }
  
  // Otherwise, prepend API URL with '/uploads'
  if (!imageUrl) return null;
  const rel = imageUrl.startsWith('/') ? imageUrl.substring(1) : imageUrl;
  const segs = rel.split('/');
  const fname = segs.pop() as string;
  const dir = segs.join('/');
  const encoded = encodeURIComponent(fname);
  return `${apiUrl}/uploads/${dir ? dir + '/' : ''}${encoded}`;
};

export const safeGetFirstImageWithApiUrl = (item: any, apiUrl: string = ''): string | null => {
  const imageUrl = safeGetFirstImage(item);
  if (!imageUrl) {
    return null;
  }
  
  // If imageUrl already contains http, return as is
  if (imageUrl && imageUrl.startsWith('http')) {
    return imageUrl;
  }
  
  // If image path already begins with '/uploads', don't add another '/uploads'
  if (imageUrl.startsWith('/uploads') || imageUrl.startsWith('uploads/')) {
    const clean = imageUrl.startsWith('/') ? imageUrl.substring(1) : imageUrl;
    const parts = clean.split('/');
    const file = parts.pop() as string;
    const base = parts.join('/');
    return `${apiUrl}/${base}/${encodeURIComponent(file)}`;
  }
  
  // Otherwise, prepend API URL with '/uploads'
  if (!imageUrl) return null;
  const rel = imageUrl.startsWith('/') ? imageUrl.substring(1) : imageUrl;
  const segs = rel.split('/');
  const fname = segs.pop() as string;
  const dir = segs.join('/');
  const encoded = encodeURIComponent(fname);
  return `${apiUrl}/uploads/${dir ? dir + '/' : ''}${encoded}`;
};

export const safeGetAllImagesWithApiUrl = (item: any, apiUrl: string = ''): string[] => {
  const images = safeGetImageArray(item);
  return images.map(image => {
    if (!image) return '';
    
    // Handle both relative and absolute image URLs
    if (image.startsWith('http://') || image.startsWith('https://')) {
      // Fix double /uploads/ if present
      return image.replace('/uploads//uploads/', '/uploads/');
    }
    
    // If image path already contains 'uploads/', just prepend API_URL
    if (image.includes('uploads/')) {
      const cleanPath = image.startsWith('/') ? image.substring(1) : image;
      const normalizedPath = cleanPath.replace(/\/?uploads\/+/g, 'uploads/');
      return `${apiUrl}/${normalizedPath}`;
    }
    
    // Otherwise, prepend API URL with '/uploads/'
    const cleanImage = image.startsWith('/') ? image.substring(1) : image;
    return `${apiUrl}/uploads/${cleanImage}`;
  }).filter(Boolean); // Remove empty strings
};

export const safeGetImageSource = (item: any, imageProperty: string = 'image1', apiUrl: string = '') => {
  const imageUrl = safeGetImageWithApiUrl(item, imageProperty, apiUrl);
  if (!imageUrl) {
    return { uri: 'https://via.placeholder.com/300x200?text=No+Image' };
  }
  return { uri: imageUrl };
};

// Enhanced image URL builder that handles all edge cases
export const buildImageUrl = (imagePath: string | null | undefined, apiUrl: string = ''): string => {
  if (!imagePath) {
    return 'https://via.placeholder.com/300x200?text=No+Image';
  }
  
  // If it's already a full URL, return as is (but fix double /uploads/ if present)
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    // Fix double /uploads//uploads/ if present
    if (imagePath.includes('/uploads//uploads/')) {
      return imagePath.replace('/uploads//uploads/', '/uploads/');
    }
    return imagePath;
  }
  
  // Remove leading slash if present
  const cleanPath = imagePath.startsWith('/') ? imagePath.substring(1) : imagePath;
  
  // If path already contains 'uploads/', just prepend API_URL
  if (cleanPath.includes('uploads/')) {
    // Remove any duplicate 'uploads/' segments
    const normalizedPath = cleanPath.replace(/\/?uploads\/+/g, 'uploads/');
    return `${apiUrl}/${normalizedPath}`;
  }
  
  // Otherwise, prefix with '/uploads/'
  return `${apiUrl}/uploads/${cleanPath}`;
};

// Enhanced array image URL builder
export const buildImageUrls = (imagePaths: (string | null | undefined)[], apiUrl: string = ''): string[] => {
  return imagePaths
    .filter(Boolean) // Remove null/undefined values
    .map(imagePath => buildImageUrl(imagePath, apiUrl))
    .filter(url => url !== 'https://via.placeholder.com/300x200?text=No+Image'); // Remove placeholder URLs
};

export const safeGetFirstImageSource = (item: any, apiUrl: string = '') => {
  const imageUrl = safeGetFirstImageWithApiUrl(item, apiUrl);
  if (!imageUrl) {
    return { uri: 'https://via.placeholder.com/300x200?text=No+Image' };
  }
  return { uri: imageUrl };
};
