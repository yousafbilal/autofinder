export interface Package {
  id: string
  name: string
  type: "car" | "bike"
  liveAdDays: number
  validityDays: number
  freeBoosters: number
  totalAds: number
  originalPrice: number
  discountedPrice: number
  features: string[]
  popular?: boolean
  description: string
}

export const carPackages: Package[] = [
  {
    id: "car-starter",
    name: "Starter Pack",
    type: "car",
    liveAdDays: 15,
    validityDays: 30,
    freeBoosters: 1,
    totalAds: 3,
    originalPrice: 299,
    discountedPrice: 249,
    popular: false,
    features: [
      "3 Featured Car Ads",
      "15 Days Live Ad Time",
      "1 Free Booster Pack",
      "Basic Customer Support",
      "Standard Visibility",
    ],
    description: "Perfect for individuals with a few cars to sell. Get started with our basic package.",
  },
  {
    id: "car-value",
    name: "Value Pack",
    type: "car",
    liveAdDays: 30,
    validityDays: 60,
    freeBoosters: 3,
    totalAds: 10,
    originalPrice: 799,
    discountedPrice: 599,
    popular: true,
    features: [
      "10 Featured Car Ads",
      "30 Days Live Ad Time",
      "3 Free Booster Packs",
      "Priority Customer Support",
      "Enhanced Visibility",
      "Premium Listing Badge",
      "Weekly Performance Reports",
    ],
    description: "Our most popular package for small dealerships. Great value for growing businesses.",
  },
  {
    id: "car-executive",
    name: "Executive Pack",
    type: "car",
    liveAdDays: 45,
    validityDays: 90,
    freeBoosters: 5,
    totalAds: 20,
    originalPrice: 1499,
    discountedPrice: 1199,
    popular: false,
    features: [
      "20 Featured Car Ads",
      "45 Days Live Ad Time",
      "5 Free Booster Packs",
      "VIP Customer Support",
      "Top Visibility",
      "Premium Listing Badge",
      "Daily Performance Reports",
      "Featured in 'Top Seller' Section",
      "Social Media Promotion",
    ],
    description: "Premium package for established dealers. Maximize your reach and sales potential.",
  },
  {
    id: "car-power",
    name: "Power Pack",
    type: "car",
    liveAdDays: 60,
    validityDays: 120,
    freeBoosters: 10,
    totalAds: 40,
    originalPrice: 2499,
    discountedPrice: 1999,
    popular: false,
    features: [
      "40 Featured Car Ads",
      "60 Days Live Ad Time",
      "10 Free Booster Packs",
      "24/7 Dedicated Support",
      "Maximum Visibility",
      "Premium Listing Badge",
      "Real-time Performance Dashboard",
      "Featured in 'Top Seller' Section",
      "Social Media Promotion",
      "Email Marketing Campaign",
      "Dedicated Account Manager",
    ],
    description: "Ultimate package for large dealerships. Dominate the market with our most comprehensive offering.",
  },
]

export const bikePackages: Package[] = [
  {
    id: "bike-starter",
    name: "Starter Pack",
    type: "bike",
    liveAdDays: 15,
    validityDays: 7,
    freeBoosters: 1,
    totalAds: 5,
    originalPrice: 199,
    discountedPrice: 225,
    popular: false,
    features: [
      "Basic Customer Support",
      "Standard Visibility",
    ],
    description: "Perfect for individuals with a few bikes to sell. Get started with our basic bike package.",
  },
  {
    id: "bike-value",
    name: "Value Pack",
    type: "bike",
    liveAdDays: 30,
    validityDays: 15,
    freeBoosters: 3,
    totalAds: 15,
    originalPrice: 599,
    discountedPrice: 300,
    popular: true,
    features: [
      "Priority Customer Support",
      "Enhanced Visibility",
      "Premium Listing Badge",
      "Weekly Performance Reports",
    ],
    description: "Our most popular package for bike dealers. Great value for growing businesses.",
  },
  {
    id: "bike-executive",
    name: "Executive Pack",
    type: "bike",
    liveAdDays: 45,
    validityDays: 30,
    freeBoosters: 5,
    totalAds: 25,
    originalPrice: 1099,
    discountedPrice: 525,
    popular: false,
    features: [
      "VIP Customer Support",
      "Top Visibility",
      "Premium Listing Badge",
      "Daily Performance Reports",
      "Featured in 'Top Seller' Section",
      "Social Media Promotion",
    ],
    description: "Premium package for established bike dealers. Maximize your reach and sales potential.",
  },
]
export const booster: Package[] = [
  {
    id: "bike-starter",
    name: "Starter Pack",
    type: "bike",
    liveAdDays: 15,
    validityDays: 7,
    freeBoosters: 1,
    totalAds: 5,
    originalPrice: 199,
    discountedPrice: 225,
    popular: false,
    features: [
      "Basic Customer Support",
      "Standard Visibility",
    ],
    description: "Perfect for individuals with a few bikes to sell. Get started with our basic bike package.",
  },
  {
    id: "bike-value",
    name: "Value Pack",
    type: "bike",
    liveAdDays: 30,
    validityDays: 15,
    freeBoosters: 3,
    totalAds: 15,
    originalPrice: 599,
    discountedPrice: 300,
    popular: true,
    features: [
      "Priority Customer Support",
      "Enhanced Visibility",
      "Premium Listing Badge",
      "Weekly Performance Reports",
    ],
    description: "Our most popular package for bike dealers. Great value for growing businesses.",
  },
  {
    id: "bike-executive",
    name: "Executive Pack",
    type: "bike",
    liveAdDays: 45,
    validityDays: 30,
    freeBoosters: 5,
    totalAds: 25,
    originalPrice: 1099,
    discountedPrice: 525,
    popular: false,
    features: [
      "VIP Customer Support",
      "Top Visibility",
      "Premium Listing Badge",
      "Daily Performance Reports",
      "Featured in 'Top Seller' Section",
      "Social Media Promotion",
    ],
    description: "Premium package for established bike dealers. Maximize your reach and sales potential.",
  },
]

// Combined export for easy access
export const allPackages = [...carPackages, ...bikePackages]

// Helper function to get a package by ID
export const getPackageById = (id: string): Package | undefined => {
  return allPackages.find((pkg) => pkg.id === id)
}

// User package subscription type
export interface UserPackage {
  id: string
  packageId: string
  purchaseDate: Date
  expiryDate: Date
  adsRemaining: number
  boostersRemaining: number
  active: boolean
}

// Mock user packages for demo
export const mockUserPackages: UserPackage[] = [
  {
    id: "up1",
    packageId: "car-value",
    purchaseDate: new Date(2023, 3, 15),
    expiryDate: new Date(2023, 5, 15),
    adsRemaining: 5,
    boostersRemaining: 2,
    active: true,
  },
  {
    id: "up2",
    packageId: "bike-starter",
    purchaseDate: new Date(2023, 2, 10),
    expiryDate: new Date(2023, 3, 10),
    adsRemaining: 0,
    boostersRemaining: 0,
    active: false,
  },
]
