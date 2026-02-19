/**
 * Unified Authentication Utilities for Mobile App
 * This ensures consistent token retrieval across all API calls
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Get authentication token from AsyncStorage
 * Tries multiple storage locations for compatibility
 */
export async function getAuthToken(): Promise<string | null> {
  try {
    // Method 1: Get from 'user' object (primary storage location)
    const userData = await AsyncStorage.getItem('user');
    if (userData) {
      try {
        const parsedUser = JSON.parse(userData);
        if (parsedUser.token) {
          return parsedUser.token.trim();
        }
        if (parsedUser.userToken) {
          return parsedUser.userToken.trim();
        }
      } catch (parseError) {
        console.warn('⚠️ Error parsing user data:', parseError);
      }
    }

    // Method 2: Get from separate 'token' key
    const token = await AsyncStorage.getItem('token');
    if (token) {
      return token.trim();
    }

    // Method 3: Get from 'userToken' key (legacy support)
    const userToken = await AsyncStorage.getItem('userToken');
    if (userToken) {
      return userToken.trim();
    }

    return null;
  } catch (error) {
    console.error('❌ Error getting auth token:', error);
    return null;
  }
}

/**
 * Get authentication headers for API calls
 * Returns headers with Authorization Bearer token if available
 */
export async function getAuthHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };

  const token = await getAuthToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  const token = await getAuthToken();
  return !!token;
}

/**
 * Get stored user data
 */
export async function getStoredUser(): Promise<any | null> {
  try {
    const userData = await AsyncStorage.getItem('user');
    if (userData) {
      return JSON.parse(userData);
    }
    return null;
  } catch (error) {
    console.error('❌ Error getting stored user:', error);
    return null;
  }
}

/**
 * Clear all authentication data
 */
export async function clearAuth(): Promise<void> {
  try {
    await AsyncStorage.multiRemove(['user', 'token', 'userToken']);
  } catch (error) {
    console.error('❌ Error clearing auth:', error);
  }
}
