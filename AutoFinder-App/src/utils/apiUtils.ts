// Utility functions for safe API calls and JSON parsing
import { fetchWithTimeout } from './fetchWithTimeout';
import { getAuthHeaders } from './authUtils';

// Default timeout for API calls (60s - allows slow backend/LAN to respond)
// Increased from 25s to handle slow database queries and network latency
const API_TIMEOUT = 60000;

/**
 * Safely convert an ID (string, number, or object) to a string for use in URLs
 * Prevents "[object Object]" errors in API calls
 */
export function safeIdToString(id: any): string {
  if (!id) {
    throw new Error('ID is required');
  }
  
  if (typeof id === 'string') {
    return id;
  }
  
  if (typeof id === 'number') {
    return String(id);
  }
  
  if (typeof id === 'object') {
    // Handle MongoDB ObjectId or similar objects
    // Call toString() directly (don't wrap in String()) to get actual ID
    if (id.toString && typeof id.toString === 'function') {
      const str = id.toString(); // Call toString() directly
      // Check if toString() returned a valid ID (not [object Object])
      if (str && str !== '[object Object]' && str.length > 10) {
        return str;
      }
    }
    
    // Try common ID fields
    if (id._id) {
      return safeIdToString(id._id);
    }
    if (id.id) {
      return safeIdToString(id.id);
    }
    if (id.$oid) {
      return String(id.$oid);
    }
    
    throw new Error(`Cannot convert object to string ID: ${JSON.stringify(id)}`);
  }
  
  throw new Error(`Invalid ID type: ${typeof id}`);
}

/**
 * Fetch with timeout - use for all API calls to avoid indefinite hangs
 */
export async function apiFetch(url: string, options: RequestInit = {}, timeout: number = API_TIMEOUT): Promise<Response> {
  return fetchWithTimeout(url, options, timeout);
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  status?: number;
}

/**
 * Safely parse JSON response from fetch
 * Handles cases where server returns HTML error pages instead of JSON
 */
export async function safeJsonParse<T = any>(response: Response, suppressErrorLog?: boolean): Promise<ApiResponse<T>> {
  try {
    // Check if response is JSON
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const textResponse = await response.text();
      
      // Don't log errors for expected 404 responses (like chat conversations endpoint)
      // These are handled gracefully by the calling code
      if (!suppressErrorLog) {
        console.error('Non-JSON response received:', {
          status: response.status,
          statusText: response.statusText,
          contentType,
          body: textResponse.substring(0, 500) // First 500 chars
        });
      }
      
      return {
        success: false,
        error: `Server returned non-JSON response: ${response.status} ${response.statusText}`,
        status: response.status
      };
    }

    const data = await response.json();
    return {
      success: true,
      data,
      status: response.status
    };
  } catch (error) {
    console.error('JSON parse error:', error);
    return {
      success: false,
      error: `JSON parse error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      status: response.status
    };
  }
}

/**
 * Make a safe API call with proper error handling
 * Automatically includes authentication token if available
 */
export async function safeApiCall<T = any>(
  url: string, 
  options: RequestInit = {},
  maxRetries: number = 2
): Promise<ApiResponse<T>> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      if (attempt > 0) {
        // Exponential backoff: wait 1s, 2s, 4s...
        const waitTime = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
        console.log(`🔄 Retry attempt ${attempt}/${maxRetries} after ${waitTime}ms...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
      
      console.log(`📡 Making API call to: ${url}${attempt > 0 ? ` (retry ${attempt})` : ''}`);
      
      // Get auth headers (includes token if available)
      const authHeaders = await getAuthHeaders();
      
      // Merge headers: authHeaders first, then user-provided headers override
      const headers = {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        ...authHeaders,
        ...options.headers,
      };

      const startTime = Date.now();
      const response = await apiFetch(url, {
        ...options,
        headers,
      }, API_TIMEOUT);
      
      const duration = Date.now() - startTime;
      console.log(`✅ Response received in ${duration}ms - Status: ${response.status}`);

      // Suppress error logs for chat endpoints and seller-info endpoints returning 404 (expected behavior)
      const isChatEndpoint = url.includes('/chat/conversations');
      const isSellerInfoEndpoint = url.includes('/users/') && url.includes('/seller-info');
      const suppressErrorLog = (isChatEndpoint || isSellerInfoEndpoint) && response.status === 404;
      
      const result = await safeJsonParse<T>(response, suppressErrorLog);
      
      if (!result.success) {
        return result;
      }

      if (!response.ok) {
        // Handle 404 gracefully - don't treat as error for certain endpoints
        if (response.status === 404) {
          if (isChatEndpoint) {
            // Chat conversations 404 is expected if user has no conversations
            console.log('⚠️ Chat conversations endpoint not found (404), returning empty array');
            return {
              success: true,
              data: [] as any,
              status: response.status
            };
          }
        }
        // Don't retry on 4xx errors (except 401/403 which might be auth issues)
        if (response.status >= 400 && response.status < 500 && response.status !== 401 && response.status !== 403) {
          return {
            success: false,
            error: result.data?.message || `HTTP ${response.status}: ${response.statusText}`,
            status: response.status
          };
        }
        // Retry on 5xx errors or auth errors
        if (attempt < maxRetries) {
          continue;
        }
        return {
          success: false,
          error: result.data?.message || `HTTP ${response.status}: ${response.statusText}`,
          status: response.status
        };
      }

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const isTimeout = errorMessage.includes('timed out') || errorMessage.includes('Timeout');
      const isNetworkError = errorMessage.includes('Network request failed') || errorMessage.includes('Failed to fetch');
      
      // Retry on timeout or network errors
      if ((isTimeout || isNetworkError) && attempt < maxRetries) {
        console.warn(`⚠️ ${isTimeout ? 'Timeout' : 'Network error'} on attempt ${attempt + 1}, will retry...`);
        continue; // Retry
      }
      
      console.error(`❌ API call error (attempt ${attempt + 1}/${maxRetries + 1}):`, errorMessage);
      
      // Provide helpful error messages for network issues
      if (isTimeout || isNetworkError) {
        try {
          const urlObj = new URL(url);
          const currentHost = urlObj.hostname;
          
          let suggestion = '';
          if (currentHost === 'localhost' || currentHost === '127.0.0.1') {
            suggestion = '⚠️ localhost detected! For Android emulator, use: http://10.0.2.2:8001\n💡 Set EXPO_PUBLIC_API_URL=http://10.0.2.2:8001';
            console.warn('⚠️ localhost does not work on Android emulator!');
            console.warn('💡 Use: export EXPO_PUBLIC_API_URL=http://10.0.2.2:8001');
          } else if (currentHost.includes('192.168.')) {
            suggestion = '⚠️ Network IP failed. Try Android emulator URL: http://10.0.2.2:8001\n💡 Or set EXPO_PUBLIC_API_URL=http://10.0.2.2:8001';
            console.warn('⚠️ Network IP failed. Try Android emulator URL: http://10.0.2.2:8001');
          } else if (currentHost === '10.0.2.2') {
            if (isTimeout) {
              suggestion = '⚠️ Request timed out after 60s\n💡 Backend might be slow or hanging\n💡 Check backend logs for slow queries';
              console.warn('⚠️ Request timed out - Backend might be slow');
            } else {
              suggestion = '⚠️ Backend not reachable at 10.0.2.2:8001\n💡 Make sure backend is running on localhost:8001';
              console.warn('⚠️ Make sure backend server is running on localhost:8001');
            }
          }
          
          const errorType = isTimeout ? 'Timeout error' : 'Network error';
          return {
            success: false,
            error: `${errorType}: Cannot connect to backend at ${currentHost}:8001\n\n${suggestion}\n\nTroubleshooting:\n1. Backend server running? (cd autofinder-backend-orignal- && npm start)\n2. Check backend logs for errors\n3. Backend might be slow - check database queries\n4. Android emulator: Use http://10.0.2.2:8001\n5. Physical device: Set EXPO_PUBLIC_API_URL=http://YOUR_PC_IP:8001`,
          };
        } catch (urlError) {
          return {
            success: false,
            error: `Network error: Cannot connect to backend\n\nTroubleshooting:\n1. Backend server running on localhost:8001?\n2. Android emulator: Set EXPO_PUBLIC_API_URL=http://10.0.2.2:8001\n3. Physical device: Set EXPO_PUBLIC_API_URL=http://YOUR_PC_IP:8001`,
          };
        }
      }
      
      return {
        success: false,
        error: `Network error: ${errorMessage}`,
      };
    }
  }
  
  // Should never reach here, but just in case
  return {
    success: false,
    error: 'All retry attempts failed',
  };
}

/**
 * Handle API response with proper error handling
 * Use this in your components for consistent error handling
 */
export function handleApiResponse<T = any>(
  result: ApiResponse<T>,
  onSuccess: (data: T) => void,
  onError: (error: string) => void
): void {
  if (result.success && result.data) {
    onSuccess(result.data);
  } else {
    onError(result.error || 'Unknown error occurred');
  }
}
