// Utility function to generate property messages for WhatsApp sharing

export const generatePropertyMessage = (propertyDetails: any) => {
  const {
    _id,
    make,
    model,
    year,
    price,
    location,
    description,
    title,
    name,
    type = 'car' // car, bike, auto-part, etc.
  } = propertyDetails;

  // Determine property type and emoji
  const getPropertyEmoji = (type: string) => {
    switch (type.toLowerCase()) {
      case 'bike':
        return '🏍️';
      case 'auto-part':
        return '🔧';
      case 'rental':
        return '🚗';
      default:
        return '🚗';
    }
  };

  const emoji = getPropertyEmoji(type);
  const propertyName = make && model && year 
    ? `${make} ${model} ${year}`
    : title || name || 'Property';

  // Create property link (customize based on your app's deep linking structure)
  const propertyLink = `https://autofinder.app/property/${_id}`;

  // Create a formatted message about the property
  const message = `${emoji} *${propertyName}*

💰 *Price:* PKR ${Number(price).toLocaleString('en-US')}
📍 *Location:* ${location}
${description ? `\n📝 *Description:* ${description.substring(0, 200)}${description.length > 200 ? '...' : ''}` : ''}

🔗 *View this property on AutoFinder App:*
${propertyLink}

📱 *Download AutoFinder App for more properties:*
https://play.google.com/store/apps/details?id=com.autofinder

#AutoFinder #${type === 'bike' ? 'BikeForSale' : 'CarForSale'} #${make || 'UsedVehicle'} #${model || 'Vehicle'} #UsedCars`;

  return message;
};

export const formatPhoneNumber = (phoneNumber: string) => {
  if (!phoneNumber) return '';
  
  // Remove all non-digit characters and leading zeros, then format to +92
  let cleanNumber = phoneNumber.replace(/\D/g, ''); // Remove all non-digits
  cleanNumber = cleanNumber.replace(/^0+/, ''); // Remove leading zeros
  
  // If it doesn't start with 92, add it
  if (!cleanNumber.startsWith('92')) {
    cleanNumber = '92' + cleanNumber;
  }
  
  // Add + prefix
  return '+' + cleanNumber;
};

export const createWhatsAppUrl = (phoneNumber: string, message?: string) => {
  const formattedNumber = formatPhoneNumber(phoneNumber);
  
  if (message) {
    const encodedMessage = encodeURIComponent(message);
    return `https://wa.me/${formattedNumber.replace('+', '')}?text=${encodedMessage}`;
  }
  
  return `https://wa.me/${formattedNumber.replace('+', '')}`;
};
