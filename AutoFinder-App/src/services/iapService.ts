import { Platform } from 'react-native';
import { API_URL } from '../../config';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Product ID for Dealer Package (Auto-Renewable Subscription)
const DEALER_PACKAGE_PRODUCT_ID = 'dealer_monthly_ios';

export interface IAPProduct {
  productId: string;
  title: string;
  description: string;
  price: string;
  currency: string;
  localizedPrice: string;
}

export interface PurchaseResult {
  success: boolean;
  transactionId?: string;
  receipt?: string;
  error?: string;
}

class IAPService {
  private isConnected: boolean = false;
  private products: IAPProduct[] = [];
  private InAppPurchases: any = null;

  constructor() {
    // TEMPORARILY DISABLED FOR iOS APP STORE APPROVAL
    // IAP integration is hidden until app gets approved
    if (Platform.OS === 'ios') {
      console.warn('⚠️ IAP: Temporarily disabled for iOS App Store approval');
      this.InAppPurchases = null;
      return;
    }
    
    if (Platform.OS === 'ios') {
      try {
        // Dynamically require to avoid crashing in Expo Go if native module is missing
        // In production / custom dev client this will be available
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        this.InAppPurchases = require('expo-in-app-purchases');
        console.log('✅ IAP: Native module loaded successfully');
        
        // Verify module has required methods
        if (!this.InAppPurchases.connectAsync) {
          console.warn('⚠️ IAP: Module loaded but missing connectAsync method. Treating as unavailable (Expo Go / dev build).');
          this.InAppPurchases = null;
        }
      } catch (error: any) {
        // In Expo Go / unsupported builds, native module isn't available.
        // Don't crash the app – just mark IAP as unavailable and use dev-mode flow.
        console.warn('⚠️ IAP: expo-in-app-purchases native module not available in this build (Expo Go / dev build).');
        console.warn('⚠️ IAP detail:', error?.message || String(error));
        this.InAppPurchases = null;
      }
    }
  }

  /**
   * Check if running in development mode (Expo Go - no native IAP module)
   */
  isDevelopmentMode(): boolean {
    return Platform.OS === 'ios' && !this.InAppPurchases;
  }

  /**
   * Initialize In-App Purchase connection with retry logic
   */
  async initialize(retryCount: number = 0): Promise<boolean> {
    if (Platform.OS !== 'ios') {
      console.log('⚠️ IAP: Only available on iOS');
      return false;
    }

    if (!this.InAppPurchases) {
      // In Expo Go or dev builds, we simply skip native IAP and rely on dev-mode backend flow.
      console.warn('⚠️ IAP: Native IAP module not available (Expo Go / dev build). Skipping connectAsync.');
      return false;
    }

    // Verify module methods are available
    if (typeof this.InAppPurchases.connectAsync !== 'function') {
      console.error('❌ IAP: connectAsync method not available in module');
      console.error('❌ IAP: Module may not be properly linked');
      return false;
    }

    try {
      console.log(`🔄 IAP: Attempting to connect to App Store (attempt ${retryCount + 1}/3)...`);
      console.log('🔄 IAP: Module available:', !!this.InAppPurchases);
      console.log('🔄 IAP: connectAsync available:', typeof this.InAppPurchases.connectAsync === 'function');
      
      // Set timeout for connection (15 seconds - increased for slow networks)
      const connectionPromise = this.InAppPurchases.connectAsync();
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Connection timeout after 15 seconds. Please check your internet connection and App Store availability.')), 15000)
      );
      
      const connected = await Promise.race([connectionPromise, timeoutPromise]) as boolean;
      this.isConnected = connected;
      
      if (connected) {
        console.log('✅ IAP: Connected to App Store successfully');
        return true;
      } else {
        console.error('❌ IAP: Connection returned false');
        console.error('❌ IAP: Possible reasons:');
        console.error('   1. Product ID not configured in App Store Connect');
        console.error('   2. App not properly signed');
        console.error('   3. Bundle ID mismatch');
        console.error('   4. App Store servers unavailable');
        return false;
      }
    } catch (error: any) {
      const errorMessage = error?.message || String(error);
      console.error('❌ IAP: Connection failed:', errorMessage);
      console.error('❌ IAP: Error type:', error?.name || 'Unknown');
      console.error('❌ IAP: Full error:', error);
      
      // Specific error handling
      if (errorMessage.includes('timeout')) {
        console.error('❌ IAP: Connection timeout - Check internet connection');
      } else if (errorMessage.includes('network') || errorMessage.includes('Network')) {
        console.error('❌ IAP: Network error - Check internet connection');
      } else if (errorMessage.includes('store') || errorMessage.includes('Store')) {
        console.error('❌ IAP: App Store error - Check App Store Connect configuration');
      }
      
      // Retry logic (max 2 retries)
      if (retryCount < 2) {
        const delaySeconds = (retryCount + 1) * 2; // 2s, 4s
        console.log(`🔄 IAP: Retrying connection in ${delaySeconds} seconds... (${retryCount + 1}/2)`);
        await new Promise(resolve => setTimeout(resolve, delaySeconds * 1000));
        return this.initialize(retryCount + 1);
      }
      
      console.error('❌ IAP: All connection attempts failed');
      return false;
    }
  }

  /**
   * Fetch available products from App Store
   */
  async fetchProducts(): Promise<IAPProduct[]> {
    if (Platform.OS !== 'ios' || !this.InAppPurchases) {
      return [];
    }

    // Ensure connection before fetching
    if (!this.isConnected) {
      console.log('🔄 IAP: Not connected, initializing before fetching products...');
      const connected = await this.initialize();
      if (!connected) {
        console.error('❌ IAP: Cannot fetch products - connection failed');
        return [];
      }
    }

    try {
      console.log('🔄 IAP: Fetching products from App Store for:', DEALER_PACKAGE_PRODUCT_ID);
      
      // Set timeout for product fetch (15 seconds)
      const fetchPromise = this.InAppPurchases.getProductsAsync([DEALER_PACKAGE_PRODUCT_ID]);
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Product fetch timeout')), 15000)
      );
      
      const { results } = await Promise.race([fetchPromise, timeoutPromise]) as { results: any[] };
      
      if (!results || results.length === 0) {
        console.warn('⚠️ IAP: No products returned from App Store');
        console.warn('⚠️ IAP: Make sure product ID is configured in App Store Connect:', DEALER_PACKAGE_PRODUCT_ID);
        return [];
      }
      
      this.products = results.map((product) => ({
        productId: product.productId,
        title: product.title,
        description: product.description,
        price: product.price,
        currency: product.currency || 'USD',
        localizedPrice: product.localizedPrice,
      }));

      console.log('✅ IAP: Products fetched successfully:', this.products.map(p => `${p.productId} - ${p.title} (${p.localizedPrice})`));
      return this.products;
    } catch (error: any) {
      console.error('❌ IAP: Failed to fetch products:', error?.message || error);
      console.error('❌ IAP: Error details:', error);
      
      // If connection error, reset connection state
      if (error?.message?.includes('timeout') || error?.message?.includes('connect')) {
        this.isConnected = false;
      }
      
      return [];
    }
  }

  /**
   * Purchase Dealer Package
   */
  async purchaseDealerPackage(): Promise<PurchaseResult> {
    if (Platform.OS !== 'ios') {
      return {
        success: false,
        error: 'In-App Purchase is only available on iOS',
      };
    }

    if (!this.InAppPurchases) {
      return {
        success: false,
        error: 'In-App Purchases are not available in this build (Expo Go). Please use an EAS build / App Store build.',
      };
    }

    // Ensure connection is established
    if (!this.isConnected) {
      console.log('🔄 IAP: Not connected, initializing connection...');
      const connected = await this.initialize();
      if (!connected) {
        console.error('❌ IAP: Connection initialization failed');
        console.error('❌ IAP: Troubleshooting steps:');
        console.error('   1. Check internet connection');
        console.error('   2. Verify product ID in App Store Connect: dealer_monthly_ios');
        console.error('   3. Check Bundle ID matches in Xcode and App Store Connect');
        console.error('   4. Ensure app is signed with correct provisioning profile');
        console.error('   5. Try again in a few moments (App Store servers may be busy)');
        
        return {
          success: false,
          error: 'Failed to connect to App Store. Please check:\n\n1. Internet connection\n2. Product ID configured in App Store Connect\n3. Bundle ID matches\n4. Try again in a few moments',
        };
      }
    }

    try {
      // Fetch products first to ensure product is available
      console.log('🔄 IAP: Fetching products from App Store...');
      const products = await this.fetchProducts();
      
      if (products.length === 0) {
        console.error('❌ IAP: Product not found. Product ID:', DEALER_PACKAGE_PRODUCT_ID);
        return {
          success: false,
          error: `Dealer Package product (${DEALER_PACKAGE_PRODUCT_ID}) not found in App Store. Please ensure the product is configured in App Store Connect.`,
        };
      }

      const product = products.find(p => p.productId === DEALER_PACKAGE_PRODUCT_ID);
      if (!product) {
        console.error('❌ IAP: Product ID mismatch. Available products:', products.map(p => p.productId));
        return {
          success: false,
          error: `Product ID ${DEALER_PACKAGE_PRODUCT_ID} not found. Available products: ${products.map(p => p.productId).join(', ')}`,
        };
      }

      console.log('✅ IAP: Product found:', product.title, '- Price:', product.localizedPrice);
      console.log('🛒 IAP: Initiating purchase for:', DEALER_PACKAGE_PRODUCT_ID);

      // Purchase the product
      await this.InAppPurchases.purchaseItemAsync(DEALER_PACKAGE_PRODUCT_ID);

      // Listen for purchase updates
      return new Promise((resolve) => {
        const subscription = this.InAppPurchases.purchaseUpdatedListener(async ({ responseCode, results, errorCode }) => {
          subscription.remove();

          if (responseCode === this.InAppPurchases.IAPResponseCode.OK) {
            const purchase = results && results[0];
            if (purchase) {
              console.log('✅ IAP: Purchase successful:', purchase);
              
              // Get receipt for verification
              // For Apple IAP, we need the base64-encoded receipt
              let receiptData = '';
              try {
                // The purchase object should contain receipt data
                // For subscriptions, we need the full app receipt
                if (purchase.receipt) {
                  receiptData = purchase.receipt;
                } else if (purchase.transactionReceipt) {
                  receiptData = purchase.transactionReceipt;
                } else {
                  // Fallback: get purchase history which contains receipt info
                  const purchaseHistory = await this.InAppPurchases.getPurchaseHistoryAsync();
                  if (purchaseHistory && purchaseHistory.length > 0) {
                    // Find the matching purchase
                    const matchingPurchase = purchaseHistory.find(
                      (p: any) => p.transactionId === purchase.transactionId
                    );
                    if (matchingPurchase && matchingPurchase.receipt) {
                      receiptData = matchingPurchase.receipt;
                    }
                  }
                }
              } catch (receiptError) {
                console.error('⚠️ IAP: Error getting receipt:', receiptError);
                // If we can't get receipt, send transaction info for backend to fetch
                receiptData = JSON.stringify({
                  transactionId: purchase.transactionId,
                  productId: purchase.productId,
                  purchaseTime: purchase.purchaseTime,
                });
              }
              
              resolve({
                success: true,
                transactionId: purchase.transactionId,
                receipt: receiptData || JSON.stringify(purchase),
              });
            } else {
              resolve({
                success: false,
                error: 'Purchase completed but no transaction found',
              });
            }
          } else if (responseCode === this.InAppPurchases.IAPResponseCode.USER_CANCELED) {
            resolve({
              success: false,
              error: 'Purchase was canceled',
            });
          } else {
            resolve({
              success: false,
              error: `Purchase failed: ${errorCode || 'Unknown error'}`,
            });
          }
        });
      });
    } catch (error: any) {
      console.error('❌ IAP: Purchase error:', error);
      return {
        success: false,
        error: error.message || 'Purchase failed',
      };
    }
  }

  /**
   * Get receipt from App Store
   */
  async getReceipt(): Promise<string | null> {
    if (Platform.OS !== 'ios' || !this.isConnected || !this.InAppPurchases) {
      return null;
    }

    try {
      const receipt = await this.InAppPurchases.getPurchaseHistoryAsync();
      console.log('📄 IAP: Receipt data:', receipt);
      
      // For subscriptions, we need to get the receipt data
      // The receipt is typically base64 encoded
      if (receipt && receipt.length > 0) {
        // Return the receipt data (this will be sent to backend for verification)
        return JSON.stringify(receipt);
      }
      return null;
    } catch (error) {
      console.error('❌ IAP: Failed to get receipt:', error);
      return null;
    }
  }

  /**
   * Verify receipt with backend
   * @param isDevelopment - If true, backend will skip Apple verification (for Expo Go testing)
   */
  async verifyReceipt(receipt: string, userId: string, packageName: string, durationDays: number, isDevelopment: boolean = false): Promise<boolean> {
    try {
      // Try multiple ways to get token
      let token: string | null = null;
      
      // Method 1: Get from 'user' object in AsyncStorage
      const userData = await AsyncStorage.getItem('user');
      if (userData) {
        try {
          const parsedUser = JSON.parse(userData);
          token = parsedUser.token || parsedUser.userToken || null;
          console.log('🔑 IAP: Token found in user object:', token ? 'Yes' : 'No');
        } catch (parseError) {
          console.error('❌ IAP: Error parsing user data:', parseError);
        }
      }
      
      // Method 2: Get from separate 'token' key in AsyncStorage
      if (!token) {
        token = await AsyncStorage.getItem('token');
        console.log('🔑 IAP: Token from separate key:', token ? 'Yes' : 'No');
      }
      
      // Method 3: Get from 'userToken' key
      if (!token) {
        token = await AsyncStorage.getItem('userToken');
        console.log('🔑 IAP: Token from userToken key:', token ? 'Yes' : 'No');
      }
      
      if (!token) {
        console.error('❌ IAP: No authentication token found in AsyncStorage');
        throw new Error('Authentication token not found. Please login again.');
      }

      // Clean token (remove any whitespace or quotes)
      token = token.trim().replace(/^["']|["']$/g, '');
      
      // Validate token format (should be a JWT token)
      if (!token || token.length < 20) {
        console.error('❌ IAP: Token appears to be invalid (too short)');
        throw new Error('Invalid authentication token. Please login again.');
      }
      
      if (isDevelopment) {
        console.log('🔍 IAP: Verifying receipt with backend (DEVELOPMENT MODE - skipping Apple verification)...');
        console.log('🔑 IAP: Using token (first 30 chars):', token.substring(0, 30) + '...');
        console.log('🔑 IAP: Token length:', token.length);
      } else {
        console.log('🔍 IAP: Verifying receipt with backend...');
      }

      const response = await fetch(`${API_URL}/api/iap/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          receipt,
          userId,
          packageName,
          durationDays,
          isDevelopment, // Flag to skip Apple verification in development
        }),
      });

      const result = await response.json();
      console.log('✅ IAP: Backend verification response:', result);

      if (response.ok && result.success) {
        return true;
      } else {
        // Check if token is expired
        if (response.status === 401 && (result.message?.includes('expired') || result.error?.includes('expired') || result.message?.includes('Invalid token'))) {
          console.error('❌ IAP: Token expired - User needs to login again');
          throw new Error('TOKEN_EXPIRED');
        }
        
        console.error('❌ IAP: Backend verification failed:', result.message);
        console.error('❌ IAP: Response status:', response.status);
        console.error('❌ IAP: Full response:', result);
        return false;
      }
    } catch (error: any) {
      // Re-throw token expired error so it can be handled by caller
      if (error.message === 'TOKEN_EXPIRED') {
        throw error;
      }
      console.error('❌ IAP: Receipt verification error:', error);
      console.error('❌ IAP: Error message:', error.message);
      return false;
    }
  }

  /**
   * Complete purchase flow: Purchase → Verify → Activate
   * 
   * Development Mode (Expo Go): If IAP module is not available, directly call backend
   * with development flag to skip Apple verification (for testing only).
   */
  async completeDealerPurchase(userId: string, packageName: string, durationDays: number): Promise<{ success: boolean; message: string }> {
    // TEMPORARILY DISABLED FOR iOS APP STORE APPROVAL
    if (Platform.OS === 'ios') {
      return {
        success: false,
        message: 'In-App Purchase is temporarily unavailable. Please contact support for dealer package activation.',
      };
    }
    
    if (Platform.OS !== 'ios') {
      return {
        success: false,
        message: 'In-App Purchase is only available on iOS.',
      };
    }

    // DEVELOPMENT MODE: If IAP module is not available (Expo Go), use development bypass
    if (!this.InAppPurchases) {
      console.warn('⚠️ IAP: Native module not available (Expo Go). Using DEVELOPMENT MODE (bypassing Apple IAP).');
      console.warn('⚠️ IAP: This will directly activate dealer status without Apple verification.');
      console.warn('⚠️ IAP: For production, use EAS build or App Store build.');
      
      try {
        // Directly verify with backend in development mode
        // Backend will skip Apple verification if isDevelopment flag is true
        const verified = await this.verifyReceipt(
          'DEVELOPMENT_MODE_RECEIPT_EXPO_GO', // Mock receipt for development
          userId,
          packageName,
          durationDays,
          true // isDevelopment = true
        );
        
        if (!verified) {
          return {
            success: false,
            message: 'Development mode activation failed. Please contact support.',
          };
        }

        return {
          success: true,
          message: 'Dealer Package activated successfully! (Development Mode)',
        };
      } catch (error: any) {
        console.error('❌ IAP: Development mode error:', error);
        
        // Handle token expired error
        if (error.message === 'TOKEN_EXPIRED') {
          return {
            success: false,
            message: 'TOKEN_EXPIRED', // Special flag for UI to handle
            error: 'Your session has expired. Please login again to continue.',
          };
        }
        
        return {
          success: false,
          message: error.message || 'Development mode activation failed',
        };
      }
    }

    try {
      // PRODUCTION MODE: Use actual Apple In-App Purchase
      // Step 1: Verify module is available
      if (!this.InAppPurchases) {
        console.error('❌ IAP: Native module not available');
        return {
          success: false,
          message: 'In-App Purchase module not available. Please use EAS build or App Store build.',
        };
      }

      // Step 2: Pre-initialize connection and fetch products to verify availability
      console.log('🔄 IAP: Pre-initializing connection...');
      if (!this.isConnected) {
        console.log('🔄 IAP: Connection not established, initializing...');
        const connected = await this.initialize();
        if (!connected) {
          console.error('❌ IAP: Failed to establish connection to App Store');
          return {
            success: false,
            message: 'Failed to connect to App Store.\n\nPossible reasons:\n• Product ID not configured in App Store Connect\n• Bundle ID mismatch\n• Internet connection issue\n• App Store servers unavailable\n\nPlease check App Store Connect configuration and try again.',
          };
        }
      }

      // Pre-fetch products to verify product is available
      const products = await this.fetchProducts();
      if (products.length === 0) {
        return {
          success: false,
          message: `Product not found in App Store. Please ensure product ID "${DEALER_PACKAGE_PRODUCT_ID}" is configured in App Store Connect and the app is signed with the correct provisioning profile.`,
        };
      }

      // Step 2: Purchase
      console.log('🛒 IAP: Starting purchase flow...');
      const purchaseResult = await this.purchaseDealerPackage();
      
      if (!purchaseResult.success || !purchaseResult.receipt) {
        return {
          success: false,
          message: purchaseResult.error || 'Purchase failed. Please try again.',
        };
      }

      // Step 3: Verify with backend (DO NOT unlock features before verification)
      console.log('🔍 IAP: Verifying receipt with backend...');
      try {
        const verified = await this.verifyReceipt(
          purchaseResult.receipt,
          userId,
          packageName,
          durationDays,
          false // isDevelopment = false (production)
        );
        
        if (!verified) {
          return {
            success: false,
            message: 'Receipt verification failed. Please contact support with your transaction ID.',
          };
        }
      } catch (error: any) {
        // Handle token expired error
        if (error.message === 'TOKEN_EXPIRED') {
          return {
            success: false,
            message: 'TOKEN_EXPIRED', // Special flag for UI to handle
            error: 'Your session has expired. Please login again to continue.',
          };
        }
        console.error('❌ IAP: Receipt verification error:', error);
        throw error;
      }

      // Step 4: Backend has verified and activated dealer status
      console.log('✅ IAP: Purchase and verification completed successfully!');
      return {
        success: true,
        message: 'Dealer Package activated successfully!',
      };
    } catch (error: any) {
      console.error('❌ IAP: Complete purchase error:', error);
      return {
        success: false,
        message: error.message || 'Purchase failed',
      };
    }
  }

  /**
   * Disconnect from App Store
   */
  async disconnect(): Promise<void> {
    if (this.isConnected && this.InAppPurchases) {
      try {
        await this.InAppPurchases.disconnectAsync();
        this.isConnected = false;
        console.log('✅ IAP: Disconnected from App Store');
      } catch (error) {
        console.error('❌ IAP: Disconnect error:', error);
      }
    }
  }
}

// Export singleton instance
export default new IAPService();

