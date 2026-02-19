import { API_URL } from '../../config';

export interface DealerPackage {
  id: string;
  name: string;
  type: "car" | "bike" | "booster";
  liveAdDays: number;
  validityDays: number;
  freeBoosters: number;
  totalAds: number;
  originalPrice: number;
  discountedPrice: number;
  actualPrice?: number;
  youSaved?: number;
  costPerAd?: number;
  features: string[];
  popular?: boolean;
  description: string;
  price: number;
  duration: number;
  listingLimit: number;
  featuredListings: number;
  // New format fields
  bundleName?: string;
  noOfDays?: number;
  noOfBoosts?: number;
  discountedRate?: number;
}

export interface PackagesResponse {
  success: boolean;
  packages?: DealerPackage[];
  carPackages?: DealerPackage[];
  bikePackages?: DealerPackage[];
  message?: string;
  error?: string;
}

export interface PackageUsage {
  totalPurchases: number;
  activeUsers: number;
  pendingPurchases: number;
  rejectedPurchases: number;
  recentPurchases: number;
  conversionRate: number;
  totalRevenue: number;
  averageAmount: number;
}

export interface PackageWithUsage {
  package: DealerPackage;
  usage: PackageUsage;
}

export interface UsageByType {
  totalPackages: number;
  totalPurchases: number;
  activeUsers: number;
  totalRevenue: number;
  averageConversionRate: number;
}

export interface UsageStatisticsResponse {
  success: boolean;
  packages?: PackageWithUsage[];
  summary?: {
    totalPackages: number;
    totalActiveUsers: number;
    totalRevenue: number;
    averageConversionRate: number;
  };
  usageByType?: {
    car: UsageByType;
    bike: UsageByType;
    booster: UsageByType;
  };
  overall?: {
    totalPackages: number;
    totalPurchases: number;
    totalActiveUsers: number;
    totalRevenue: number;
  };
  message?: string;
  error?: string;
}

class PackagesService {
  private baseUrl = `${API_URL}/mobile/dealer_packages`;
  private purchaseBase = `${API_URL}/mobile/package-purchases`;

  // Helper method to transform package data from backend to frontend format
  private transformPackageData(data: any): DealerPackage {
    // Check if package has new format fields
    const hasNewFormat = data.noOfDays !== undefined && data.noOfBoosts !== undefined && data.actualPrice !== undefined;
    
    // Calculate values with proper fallbacks
    // noOfBoosts = Total Ads (number of ads user can post)
    // featuredListings = Boosters (number of boosts user can use)
    const liveAdDays = hasNewFormat ? data.noOfDays : (data.duration || 0);
    const validityDays = hasNewFormat ? data.noOfDays : (data.duration || 0);
    const totalAds = hasNewFormat ? (data.listingLimit || data.noOfBoosts || 0) : (data.listingLimit || 0);
    const freeBoosters = hasNewFormat ? (data.featuredListings || 0) : (data.featuredListings || 0);
    const originalPrice = hasNewFormat ? data.actualPrice : (data.price || 0);
    const discountedPrice = hasNewFormat ? data.discountedRate : (data.price || 0);
    
    // Calculate You Saved (originalPrice - discountedPrice)
    const youSaved = hasNewFormat ? data.youSaved : Math.max(0, originalPrice - discountedPrice);
    
    // Calculate Cost Per Ad (discountedPrice / totalAds, avoid division by zero)
    const costPerAd = totalAds > 0 ? Math.round(discountedPrice / totalAds) : 0;
    
    // Transform the data to match our interface
    return {
      id: (data._id || data.id).toString(),
      name: data.bundleName || data.name,
      type: data.type,
      liveAdDays: liveAdDays,
      validityDays: validityDays,
      freeBoosters: freeBoosters,
      totalAds: totalAds,
      originalPrice: originalPrice,
      discountedPrice: discountedPrice,
      youSaved: youSaved,
      costPerAd: costPerAd,
      actualPrice: originalPrice,
      features: data.features || [],
      popular: data.popular || false,
      description: data.description || "",
      // New format fields (with fallbacks)
      bundleName: data.bundleName || data.name,
      noOfDays: liveAdDays,
      noOfBoosts: freeBoosters,
      discountedRate: discountedPrice,
      // Legacy fields for backward compatibility
      price: data.price,
      duration: data.duration,
      listingLimit: data.listingLimit,
      featuredListings: data.featuredListings
    };
  }

  async fetchCarPackages(): Promise<DealerPackage[]> {
    try {
      const response = await fetch(`${this.baseUrl}/car`);
      const data: PackagesResponse = await response.json();
      
      if (data.success && data.packages) {
        // Transform each package to ensure correct field mapping
        return data.packages.map(pkg => this.transformPackageData(pkg));
      } else {
        console.error('Error fetching car packages:', data.message);
        return [];
      }
    } catch (error) {
      console.error('Network error fetching car packages:', error);
      return [];
    }
  }

  async fetchBikePackages(): Promise<DealerPackage[]> {
    try {
      const response = await fetch(`${this.baseUrl}/bike`);
      const data: PackagesResponse = await response.json();
      
      if (data.success && data.packages) {
        // Transform each package to ensure correct field mapping
        return data.packages.map(pkg => this.transformPackageData(pkg));
      } else {
        console.error('Error fetching bike packages:', data.message);
        return [];
      }
    } catch (error) {
      console.error('Network error fetching bike packages:', error);
      return [];
    }
  }

  async fetchBoosterPackages(): Promise<DealerPackage[]> {
    try {
      const response = await fetch(`${this.baseUrl}/booster`);
      const data: PackagesResponse = await response.json();
      
      if (data.success && data.packages) {
        console.log('✅ Booster packages fetched successfully:', data.packages.length);
        // Transform each package to ensure correct field mapping
        return data.packages.map(pkg => this.transformPackageData(pkg));
      } else {
        console.error('Error fetching booster packages:', data.message);
        return [];
      }
    } catch (error) {
      console.error('Network error fetching booster packages:', error);
      return [];
    }
  }

  async fetchAllPackages(): Promise<{ carPackages: DealerPackage[]; bikePackages: DealerPackage[] }> {
    try {
      const response = await fetch(`${this.baseUrl}/all`);
      const data: PackagesResponse = await response.json();
      
      if (data.success && data.carPackages && data.bikePackages) {
        return {
          carPackages: data.carPackages,
          bikePackages: data.bikePackages
        };
      } else {
        console.error('Error fetching all packages:', data.message);
        return { carPackages: [], bikePackages: [] };
      }
    } catch (error) {
      console.error('Network error fetching all packages:', error);
      return { carPackages: [], bikePackages: [] };
    }
  }

  async createSimplePurchase(params: { userId: string; plan: 'Basic'|'Standard'|'Premium'; }): Promise<any> {
    const durations: Record<string, number> = { Basic: 7, Standard: 15, Premium: 30 };
    const amounts: Record<string, number> = { Basic: 1500, Standard: 2250, Premium: 3150 };
    const body = {
      userId: params.userId,
      packageName: params.plan,
      amount: amounts[params.plan],
      packageType: 'car',
      durationDays: durations[params.plan],
    };
    const res = await fetch(`${API_URL}/mobile/package-purchases/create-simple`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    return await res.json();
  }

  async fetchPackageById(packageId: string): Promise<DealerPackage | null> {
    try {
      console.log('🔍 Fetching package by ID:', packageId);
      const response = await fetch(`${API_URL}/dealer_packages/${packageId}`);
      const data = await response.json();
      
      if (data && data._id) {
        console.log('✅ Package data received:', data);
        
        // Use the helper method to transform the data
        const transformedPackage = this.transformPackageData(data);
        
        console.log('📦 Package mapping - totalAds:', transformedPackage.totalAds, 'freeBoosters:', transformedPackage.freeBoosters);
        console.log('✅ Transformed package:', transformedPackage);
        return transformedPackage;
      } else {
        console.error('❌ Package not found');
        return null;
      }
    } catch (error) {
      console.error('❌ Network error fetching package:', error);
      return null;
    }
  }

  // ==================== PACKAGE USAGE STATISTICS METHODS ====================

  async fetchActivePackagesWithUsage(): Promise<PackageWithUsage[]> {
    try {
      console.log('📊 Fetching active packages with usage statistics...');
      const response = await fetch(`${API_URL}/packages/active-with-usage`);
      const data: UsageStatisticsResponse = await response.json();
      
      if (data.success && data.packages) {
        console.log('✅ Active packages with usage fetched successfully:', data.packages.length);
        return data.packages;
      } else {
        console.error('Error fetching active packages with usage:', data.message);
        return [];
      }
    } catch (error) {
      console.error('Network error fetching active packages with usage:', error);
      return [];
    }
  }

  async fetchUsageByType(): Promise<UsageStatisticsResponse | null> {
    try {
      console.log('📊 Fetching package usage by type...');
      const response = await fetch(`${API_URL}/packages/usage-by-type`);
      const data: UsageStatisticsResponse = await response.json();
      
      if (data.success) {
        console.log('✅ Usage by type fetched successfully');
        return data;
      } else {
        console.error('Error fetching usage by type:', data.message);
        return null;
      }
    } catch (error) {
      console.error('Network error fetching usage by type:', error);
      return null;
    }
  }

  async fetchPackageUsageDetails(packageId: string): Promise<any> {
    try {
      console.log('📊 Fetching detailed usage for package:', packageId);
      const response = await fetch(`${API_URL}/packages/${packageId}/usage`);
      const data = await response.json();
      
      if (data.success) {
        console.log('✅ Package usage details fetched successfully');
        return data;
      } else {
        console.error('Error fetching package usage details:', data.message);
        return null;
      }
    } catch (error) {
      console.error('Network error fetching package usage details:', error);
      return null;
    }
  }
}

export default new PackagesService();
