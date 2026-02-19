// ==================== API CONFIGURATION ====================
// LIVE SERVER - Production
const PRODUCTION_API_URL = 'https://backend.autofinder.pk';

// LOCAL: iOS simulator = localhost, Android emulator = 10.0.2.2 (for development only)
const LOCAL_API_URL = 'http://localhost:8001';
const LOCAL_API_URL_ANDROID = 'http://10.0.2.2:8001'; // Android emulator only
const LOCAL_API_URL_NETWORK = 'http://192.168.100.6:8001'; // Physical device on same WiFi

const resolveApiUrl = () => {
  try {
    let envUrl = process.env.EXPO_PUBLIC_API_URL || process.env.API_URL;
    
    // iOS simulator: 10.0.2.2 doesn't work, use localhost
    try {
      const { Platform } = require('react-native');
      if (Platform.OS === 'ios' && envUrl && envUrl.includes('10.0.2.2')) {
        console.log('🔗 iOS detected: using localhost instead of 10.0.2.2');
        envUrl = LOCAL_API_URL;
      }
    } catch (_) {}
    
    // 1) Env override (highest priority) - allows temporary localhost override
    if (envUrl && typeof envUrl === 'string' && envUrl.trim()) {
      console.log('🔗 Using API URL from env:', envUrl.trim());
      return envUrl.trim();
    }

    // 2) Production server (default)
    console.log('');
    console.log('🔗 PRODUCTION BACKEND ACTIVE');
    console.log('🌐 API URL:', PRODUCTION_API_URL);
    console.log('');
    return PRODUCTION_API_URL;

    // --- LOCAL SERVER (for development - uncomment to use localhost) ---
    // let url = LOCAL_API_URL;
    // try {
    //   const { Platform } = require('react-native');
    //   if (Platform.OS === 'android') {
    //     url = LOCAL_API_URL_ANDROID;
    //   }
    // } catch (_) {}
    // console.log('');
    // console.log('🔗 LOCAL BACKEND ACTIVE');
    // console.log('🌐 API URL:', url);
    // console.log('');
    // return url;
  } catch (e) {
    console.error('🔗 Error resolving API URL:', e?.message);
    return PRODUCTION_API_URL;
  }
};

// Export API URL - defaults to Android emulator URL (10.0.2.2:8001)
// Change the return value in resolveApiUrl() if you need iOS simulator or physical device
export const API_URL = resolveApiUrl();

// Base URL for car/property detail links in chat and share (web)
export const CAR_DETAIL_BASE_URL = 'https://autofinder.pk';

// AutoFinder Support Contact Number (for Managed Properties)
// Format: 92XXXXXXXXXX (Pakistan format without + sign)
export const DEFAULT_AUTOFINDER_PHONE = '923001234567'; // Default fallback number

// Cache for admin contact info (per ad)
const adminContactCache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache

// Fetch admin phone number dynamically
// If adId is provided, fetches the phone number of the admin who added that specific property
export const getAutofinderPhone = async (adId = null) => {
  try {
    const cacheKey = adId || 'default';
    const now = Date.now();
    
    // Return cached value if still valid
    const cached = adminContactCache.get(cacheKey);
    if (cached && (now - cached.time) < CACHE_DURATION) {
      console.log('📞 Using cached admin phone for:', cacheKey, cached.phone);
      return cached.phone;
    }
    
    // Build URL with optional adId parameter
    let url = `${API_URL}/admin-contact`;
    if (adId) {
      url += `?adId=${adId}`;
    }
    
    console.log('📞 Fetching admin contact from:', url);
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.success && data.phone) {
      adminContactCache.set(cacheKey, { phone: data.phone, name: data.name, time: now });
      console.log('📞 Fetched admin phone:', data.phone, 'for ad:', adId || 'default');
      return data.phone;
    }
    return DEFAULT_AUTOFINDER_PHONE;
  } catch (error) {
    console.log('Error fetching admin contact:', error);
    const cached = adminContactCache.get(adId || 'default');
    return cached?.phone || DEFAULT_AUTOFINDER_PHONE;
  }
};

// For backward compatibility - sync version uses cached or default
export const AUTOFINDER_PHONE = DEFAULT_AUTOFINDER_PHONE;

// Google OAuth Configuration
// Android Client ID: 189347634725-0123dltmgn23eomv6t6b8vr3ukc4jfco.apps.googleusercontent.com
// iOS Client ID: 189347634725-b93nogflec3cdk5slh3puf1ktjohjinc.apps.googleusercontent.com
// Web Client ID: 189347634725-dtgtb85m9cmqoklkvo5iiph1pju95sgl.apps.googleusercontent.com

// Platform-specific Client IDs
export const GOOGLE_CLIENT_ID_ANDROID = '189347634725-0123dltmgn23eomv6t6b8vr3ukc4jfco.apps.googleusercontent.com';
export const GOOGLE_CLIENT_ID_IOS = '189347634725-b93nogflec3cdk5slh3puf1ktjohjinc.apps.googleusercontent.com';
export const GOOGLE_CLIENT_ID_WEB = '189347634725-dtgtb85m9cmqoklkvo5iiph1pju95sgl.apps.googleusercontent.com';

// Default: Use Web Client ID (works with Expo proxy for all platforms)
// For native builds, use platform-specific IDs
export const GOOGLE_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID || GOOGLE_CLIENT_ID_WEB;

import AsyncStorage from '@react-native-async-storage/async-storage';

// Get the full user object
export const getStoredUser = async () => {
  try {
    const storedUserData = await AsyncStorage.getItem('user');
    if (storedUserData) {
      return JSON.parse(storedUserData);
    }
  } catch (error) {
    console.error("Error retrieving user data:", error);
  }
  return null;
};

// Normalize any id (string, object with _id/userId/$oid) to a 24-char string or null
const toUserIdString = (v) => {
  if (v == null) return null;
  if (typeof v === 'string') {
    const s = v.trim();
    return (s.length >= 20 && /^[a-fA-F0-9]+$/.test(s)) ? s : null;
  }
  if (typeof v === 'object') {
    const id = v._id ?? v.userId ?? v.id ?? v.$oid;
    if (id == null) return null;
    if (typeof id === 'string') return toUserIdString(id);
    if (typeof id === 'object' && id.$oid) return toUserIdString(id.$oid);
    if (typeof id === 'object' && (id._id || id.id)) return toUserIdString(id._id || id.id);
    if (typeof id.toString === 'function') {
      const s = id.toString();
      if (s && s !== '[object Object]' && s.length >= 20) return s;
    }
  }
  return null;
};

// Get only userId - always returns a string (24-char hex) or null so favorite_ads API matches toggle_favorite
export const getUserId = async () => {
  const user = await getStoredUser();
  const raw = user?._id ?? user?.userId ?? null;
  return toUserIdString(raw);
};

// Check if backend server is available (plain JS, no TypeScript types)
export const checkBackendHealth = async () => {
  try {
    const response = await fetch(`${API_URL}/`, {
      method: 'GET',
    });
    
    if (response.ok) {
      console.log('✅ Backend server is available');
      return true;
    }
    return false;
  } catch (error) {
    console.error('❌ Backend server is NOT available:', error?.message || error);
    return false;
  }
};
