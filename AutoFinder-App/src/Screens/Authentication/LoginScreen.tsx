import React, { useState, useEffect } from "react";
import { 
  View, Text, TextInput, TouchableOpacity, StyleSheet, Image, Pressable, ActivityIndicator, Alert, 
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Platform,
  Keyboard
} from "react-native";
import { Ionicons } from "@expo/vector-icons"; 
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../../navigationTypes";
import { API_URL } from "../../../config";
import FullScreenLoader from "../../Components/FullScreenLoader";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { COLORS } from "../../constants/colors";
import { ScrollView } from "react-native-gesture-handler";
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import Constants from 'expo-constants';

// Complete the auth session for better UX
WebBrowser.maybeCompleteAuthSession();

type NavigationProp = NativeStackNavigationProp<RootStackParamList, "LoginScreen">;

const LoginScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const [emailOrPhone, setEmailOrPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false); // Declare showPassword state
  const [isButtonDisabled, setIsButtonDisabled] = useState(true);
  const [isLoading, setIsLoading] = useState(false); // Loader state
  const [isGoogleLoading, setIsGoogleLoading] = useState(false); // Google Sign-In loader
  const [errors, setErrors] = useState({ email: "", password: "" });

  // 🔑 SMART CONFIGURATION: Detect environment and use appropriate Google OAuth setup
  // Expo Go (Development): Use Web Client ID with Expo proxy
  // Standalone Builds (iOS/Android): Use platform-specific Client IDs with native redirect URIs
  
  // Client IDs
  const webClientId = '189347634725-dtgtb85m9cmqoklkvo5iiph1pju95sgl.apps.googleusercontent.com';
  const iosClientId = '189347634725-b93nogflec3cdk5slh3puf1ktjohjinc.apps.googleusercontent.com';
  const androidClientId = '189347634725-0123dltmgn23eomv6t6b8vr3ukc4jfco.apps.googleusercontent.com';
  
  // Get redirect URI - use useMemo to avoid build-time issues
  const redirectUri = React.useMemo(() => {
    try {
      // Detect if running in Expo Go vs standalone build
      const executionEnv = Constants.executionEnvironment;
      const isExpoGo = executionEnv === 'storeClient' || 
                       executionEnv === undefined ||
                       (executionEnv !== 'standalone' && executionEnv !== 'bare');
      
      if (isExpoGo) {
        // Expo Go: Use Expo proxy (Web Client ID will be used)
        return 'https://auth.expo.io/@anonymous/autofinder';
      } else {
        // Standalone build: Use native redirect URI
        const currentPlatform = Platform.OS;
        if (currentPlatform === 'ios') {
          // iOS native redirect URI format: com.googleusercontent.apps.CLIENT_ID
          return 'com.googleusercontent.apps.189347634725-b93nogflec3cdk5slh3puf1ktjohjinc';
        } else {
          // Android: Use app scheme from app.json
          return 'autofinder://oauth';
        }
      }
    } catch (error) {
      // Fallback to Expo proxy if anything fails
      console.warn('Error determining redirect URI, using Expo proxy:', error);
      return 'https://auth.expo.io/@anonymous/autofinder';
    }
  }, []);
  
  // Configure Google Auth Request
  const [request, response, promptAsync] = Google.useAuthRequest({
    expoClientId: webClientId, // For Expo Go
    iosClientId: iosClientId, // For iOS standalone builds
    androidClientId: androidClientId, // For Android standalone builds
    redirectUri: redirectUri,
    scopes: ['openid', 'profile', 'email'],
  } as any);

  // Get the actual redirect URI being used
  const finalRedirectUri = request?.redirectUri || redirectUri;

  // Helper to detect environment
  const getIsExpoGo = () => {
    const executionEnv = Constants.executionEnvironment;
    return executionEnv === 'storeClient' || 
           executionEnv === undefined ||
           (executionEnv !== 'standalone' && executionEnv !== 'bare');
  };

  const isExpoGo = getIsExpoGo();
  const expectedClientId = isExpoGo ? webClientId : (Platform.OS === 'ios' ? iosClientId : androidClientId);

  console.log('🔐 Google Sign-In Configuration:');
  console.log('🔐 Execution Environment:', Constants.executionEnvironment);
  console.log('🔐 Is Expo Go:', isExpoGo);
  console.log('🔐 Platform:', Platform.OS);
  console.log('🔐 Redirect URI:', finalRedirectUri);
  console.log('🔐 Expected Client ID:', expectedClientId);
  console.log('⚠️  CRITICAL: Add this EXACT URI to Google Console:', finalRedirectUri);

  // Clear form fields when screen comes into focus (e.g., from signup screen)
  useFocusEffect(
    React.useCallback(() => {
      // Clear all input fields
      setEmailOrPhone("");
      setPassword("");
      setErrors({ email: "", password: "" });
      setIsButtonDisabled(true);
    }, [])
  );

  // Log the actual redirect URI being used by the request
  useEffect(() => {
    if (request) {
      console.log('🔐 Google Auth Request Ready!');
      console.log('🔐 Request object redirect URI:', request.redirectUri);
      console.log('🔐 Configured Redirect URI:', finalRedirectUri);
      console.log('🔐 Request URL:', request.url || 'Not available');
      
      // Check which Client ID is being used in the request URL
      if (request.url) {
        console.log('🔐 Full Request URL:', request.url);
        const urlMatch = request.url.match(/client_id=([^&]+)/);
        if (urlMatch) {
          const clientIdInUrl = decodeURIComponent(urlMatch[1]);
          console.log('🔐 Client ID in Request URL:', clientIdInUrl);
          
          const webClientId = '189347634725-dtgtb85m9cmqoklkvo5iiph1pju95sgl.apps.googleusercontent.com';
          const iosClientId = '189347634725-b93nogflec3cdk5slh3puf1ktjohjinc.apps.googleusercontent.com';
          const androidClientId = '189347634725-0123dltmgn23eomv6t6b8vr3ukc4jfco.apps.googleusercontent.com';
          
          // Determine expected client ID based on environment
          const isExpoGoEnv = Constants.executionEnvironment === 'storeClient' || 
                              Constants.executionEnvironment === undefined ||
                              (Constants.executionEnvironment !== 'standalone' && Constants.executionEnvironment !== 'bare');
          const expectedClientId = isExpoGoEnv 
            ? webClientId 
            : (Platform.OS === 'ios' ? iosClientId : androidClientId);
          
          if (clientIdInUrl === expectedClientId) {
            console.log('✅ CORRECT: Using expected Client ID for current environment');
            if (isExpoGoEnv) {
              console.log('   Using Web Client ID for Expo proxy (correct for Expo Go)');
            } else {
              console.log(`   Using ${Platform.OS === 'ios' ? 'iOS' : 'Android'} Client ID for standalone build (correct)`);
            }
            console.log('   ✅ Make sure this Client ID has redirect URI in Google Console:');
            console.log('      ' + finalRedirectUri);
          } else {
            console.warn('⚠️  Unexpected Client ID in URL:', clientIdInUrl);
            console.warn('   Expected:', expectedClientId);
            console.warn('   Environment:', isExpoGoEnv ? 'Expo Go' : `Standalone (${Platform.OS})`);
          }
        } else {
          console.warn('⚠️  Could not extract Client ID from request URL');
        }
      } else {
        console.warn('⚠️  Request URL not available yet');
      }
      
      if (request.redirectUri && request.redirectUri !== finalRedirectUri) {
        console.warn('⚠️  WARNING: Request redirect URI differs from configured!');
        console.warn('   Configured:', finalRedirectUri);
        console.warn('   Actual:', request.redirectUri);
        console.warn('   ⚠️  Add BOTH URIs to Google Console!');
      } else {
        console.log('✅ Redirect URI matches!');
        console.log('⚠️  CRITICAL: Add this EXACT URI to Google Console:', finalRedirectUri);
      }
    } else {
      console.log('⏳ Waiting for Google Auth Request to be ready...');
    }
  }, [request, finalRedirectUri]);

  const validateForm = (userEmailOrPhone: string, userPassword: string) => {
    setIsButtonDisabled(!(userEmailOrPhone.trim() !== "" && userPassword.trim() !== ""));
  };

  const handleLogin = async () => {
    if (!emailOrPhone || !password) {
      Alert.alert("Error", "Please enter both email/phone and password.");
      return;
    }

    setIsLoading(true); // Show loader

    try {
      const response = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ emailOrPhone, password }),
      });

      const data = await response.json();
      setIsLoading(false); // Hide loader

      if (data.success) {
        // Store user data with token
        const userData = {
          token: data.token,
          userId: data.userId,
          name: data.name,
          email: data.email,
          phone: data.phone,
          dateAdded: data.dateAdded,
          profileImage: data.profileImage,
          userType: data.userType,
        };
        
        // Store in 'user' object (primary storage)
        await AsyncStorage.setItem("user", JSON.stringify(userData));
        
        // Also store token separately for backward compatibility
        if (data.token) {
          await AsyncStorage.setItem("token", data.token);
        }

        Alert.alert("Success", "Login successful!");
        navigation.navigate("HomeTabs");
      } else {
        Alert.alert("Error", data.message || "Login failed.");
      }
    } catch (error) {
      setIsLoading(false); // Hide loader
      console.error("Login error:", error);
      Alert.alert("Error", "An error occurred during login.");
    }
  };

  const validateFormFields = () => {
    let valid = true;
    const newErrors = { email: "", password: "" };

    if (!emailOrPhone.trim()) {
      newErrors.email = "Email/Phone is required";
      valid = false;
    } else if (!/\S+@\S+\.\S+/.test(emailOrPhone)) {
      newErrors.email = "Email is invalid";
      valid = false;
    }

    if (!password) {
      newErrors.password = "Password is required";
      valid = false;
    } else if (password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
      valid = false;
    }

    setErrors(newErrors);
    return valid;
  };

  // Handle Google Sign-In response
  useEffect(() => {
    // Log all response changes for debugging
    if (response) {
      const responseAny = response as any;
      console.log('🔐 Google Sign-In Response Received:', {
        type: response.type,
        hasError: !!(responseAny.error),
        errorCode: responseAny.errorCode,
        hasParams: !!responseAny.params,
        hasAuthentication: !!responseAny.authentication,
      });
    }
    
    if (response?.type === 'success') {
      console.log('✅ Google Sign-In Success - Processing...');
      handleGoogleResponse(response);
    } else if (response?.type === 'error') {
      setIsGoogleLoading(false);
      
      // Get the actual redirect URI being used
      const actualRedirectUri = request?.redirectUri || finalRedirectUri;
      const responseAny = response as any;
      
      console.error('🔐 Google Sign-In Error Details:', {
        error: responseAny.error,
        errorCode: responseAny.errorCode,
        params: responseAny.params,
        requestRedirectUri: actualRedirectUri,
        configuredRedirectUri: finalRedirectUri,
      });
      
      console.error('🔐 Actual Redirect URI used:', actualRedirectUri);
      
      let errorMessage = 'Unknown error';
      let detailedHelp = '';
      
      // Extract error message from different possible formats
      const errorResponse = responseAny.error as any;
      if (errorResponse) {
        if (typeof errorResponse === 'string') {
          errorMessage = errorResponse;
        } else if (errorResponse?.error) {
          errorMessage = errorResponse.error;
        } else if (errorResponse?.message) {
          errorMessage = errorResponse.message;
        }
      }
      
      // Check error code or params for redirect_uri_mismatch
      const errorCode = responseAny.errorCode || responseAny.params?.error;
      const errorDescription = responseAny.params?.error_description || '';
      
      // Log full error details for debugging
      console.error('🔐 Full Error Response:', JSON.stringify({
        error: responseAny.error,
        errorCode: responseAny.errorCode,
        params: responseAny.params,
        errorMessage: errorMessage,
        errorDescription: errorDescription,
      }, null, 2));
      
      // Check for redirect_uri_mismatch in multiple places
      const isRedirectUriMismatch = 
        errorCode === 'redirect_uri_mismatch' ||
        errorMessage.toLowerCase().includes('redirect_uri_mismatch') ||
        errorMessage.toLowerCase().includes('redirect_uri') ||
        errorMessage.toLowerCase().includes('invalid_request') ||
        errorDescription.toLowerCase().includes('redirect_uri_mismatch') ||
        String(response.errorCode) === '400';
      
      // Check for blocked/access denied errors (more comprehensive)
      const isAccessBlocked = 
        errorMessage.toLowerCase().includes('access_denied') ||
        errorMessage.toLowerCase().includes('access_blocked') ||
        errorMessage.toLowerCase().includes('blocked') ||
        errorMessage.toLowerCase().includes('authorization error') ||
        errorMessage.toLowerCase().includes('doesn\'t comply') ||
        errorMessage.toLowerCase().includes('oauth 2.0 policy') ||
        errorDescription.toLowerCase().includes('blocked') ||
        errorDescription.toLowerCase().includes('access_denied') ||
        errorCode === 'access_denied';
      
      if (isRedirectUriMismatch) {
        errorMessage = '❌ Redirect URI Mismatch (Error 400)';
        detailedHelp = `Ye error is liye aa raha hai ke redirect URI Google Console mein add nahi hai.\n\n🔧 FIX KARNE KE STEPS:\n\n1. Google Console mein jao:\n   https://console.cloud.google.com/apis/credentials\n\n2. WEB Client ID par click karo:\n   189347634725-dtgtb85m9cmqoklkvo5iiph1pju95sgl.apps.googleusercontent.com\n\n3. "Authorized redirect URIs" section mein jao\n\n4. "+ ADD URI" button par click karo\n\n5. Ye EXACT URI copy-paste karo (bilkul yahi, koi space ya slash extra nahi):\n\n   ${actualRedirectUri}\n\n6. "SAVE" button par click karo\n\n7. 5-10 minutes wait karo (Google ko time chahiye)\n\n8. Phir se try karo\n\n⚠️ IMPORTANT:\n- URI bilkul exact hona chahiye (no trailing slash)\n- Copy-paste karte waqt extra space na aaye\n- Save ke baad 5-10 minutes wait karna zaroori hai`;
      } else if (isAccessBlocked) {
        errorMessage = '❌ Access Blocked - Login Blocked Ho Gaya';
        detailedHelp = `Ye error is liye aa raha hai ke:\n1. OAuth Consent Screen properly configure nahi hai, YA\n2. Aapka email Test User mein add nahi hai (agar Testing mode mein ho), YA\n3. App Google's OAuth policy comply nahi kar rahi\n\n🔧 FIX KARNE KE COMPLETE STEPS:\n\n📋 STEP 1: OAuth Consent Screen Setup\n1. Google Console mein jao:\n   https://console.cloud.google.com/apis/credentials/consent\n\n2. Required fields fill karo:\n   - App name: AutoFinder\n   - User support email: Aapka verified email\n   - Developer contact: Aapka verified email\n\n3. Scopes add karo (CRITICAL):\n   - Click "+ ADD OR REMOVE SCOPES"\n   - Select: openid, profile, email\n   - Click "UPDATE"\n\n4. Test Users add karo (AGAR Testing mode mein ho):\n   - Click "+ ADD USERS"\n   - Apna Google email add karo (jo aap sign-in karne ke liye use karoge)\n   - Click "ADD"\n\n5. "SAVE AND CONTINUE" click karo\n\n📋 STEP 2: Redirect URI Add Karo\n1. Google Console mein jao:\n   https://console.cloud.google.com/apis/credentials\n\n2. WEB Client ID par click karo\n3. "Authorized redirect URIs" mein ye add karo:\n   ${actualRedirectUri}\n4. "SAVE" click karo\n\n📋 STEP 3: Wait and Test\n1. 10-15 minutes wait karo\n2. App restart karo: yarn start --clear\n3. Phir se try karo\n\n⚠️ IMPORTANT:\n- Agar app "Testing" mode mein hai, to Test Users mein apna email add karna ZAROORI hai\n- Sirf test users hi sign-in kar sakte hain testing mode mein`;
      } else if (errorMessage.toLowerCase().includes('invalid_client')) {
        errorMessage = '❌ Invalid Client ID';
        detailedHelp = `Client ID galat hai ya configure nahi hai.\n\n🔧 FIX:\n\nSahi Client ID use karo:\nWeb: 189347634725-dtgtb85m9cmqoklkvo5iiph1pju95sgl.apps.googleusercontent.com`;
      } else {
        errorMessage = `❌ Google Sign-In Error: ${errorMessage}`;
        detailedHelp = `Error Details:\n${errorMessage}\n\nError Code: ${errorCode || 'N/A'}\nError Description: ${errorDescription || 'N/A'}\n\n🔧 COMPLETE TROUBLESHOOTING STEPS:\n\n1. Redirect URI check karo (WEB Client ID mein add hona chahiye):\n   ${actualRedirectUri}\n\n2. OAuth Consent Screen check karo:\n   https://console.cloud.google.com/apis/credentials/consent\n   - App name set hai?\n   - Scopes add hain? (openid, profile, email)\n   - Test Users add hain? (agar Testing mode)\n\n3. Google Console mein changes ke baad 10-15 minutes wait karo\n\n4. App restart karo: yarn start --clear\n\n5. Phir se try karo\n\n📋 Console logs check karo - wahan exact error details honge`;
      }
      
      Alert.alert(
        "Google Sign-In Error",
        `${errorMessage}\n\n${detailedHelp}`
      );
    } else if (response?.type === 'dismiss') {
      setIsGoogleLoading(false);
      console.log('🔐 Google Sign-In cancelled by user');
    } else if (response === null || response === undefined) {
      // Response is null initially - this is normal
      console.log('🔐 Google Sign-In - Waiting for response...');
    } else {
      // Unknown response type
      console.warn('⚠️  Unknown Google Sign-In response type:', response?.type);
      console.warn('Full response:', JSON.stringify(response, null, 2));
      setIsGoogleLoading(false);
    }
  }, [response, request, finalRedirectUri]);

  const handleGoogleResponse = async (response: any) => {
    try {
      setIsGoogleLoading(true);
      console.log('🔐 Google Sign-In - Response received:', response.type);

      // Get access token from response
      const { authentication } = response;
      const accessToken = authentication?.accessToken;

      if (!accessToken) {
        throw new Error('No access token received from Google');
      }

      console.log('🔐 Google Sign-In - Access token received');

      // Get user info from Google
      const userInfoResponse = await fetch(
        `https://www.googleapis.com/oauth2/v2/userinfo?access_token=${accessToken}`
      );

      if (!userInfoResponse.ok) {
        const errorText = await userInfoResponse.text();
        console.error('🔐 Google Sign-In - User info fetch failed:', errorText);
        throw new Error(`Failed to fetch user info: ${userInfoResponse.status}`);
      }

      const userInfo = await userInfoResponse.json();

      if (!userInfo.id || !userInfo.email) {
        throw new Error('Invalid user info received from Google');
      }

      console.log('🔐 Google Sign-In - User info received:', userInfo.email);

      // Send Google user info to backend for authentication
      const backendResponse = await fetch(`${API_URL}/google-login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          googleId: userInfo.id,
          email: userInfo.email,
          name: userInfo.name,
          picture: userInfo.picture,
        }),
      });

      const backendData = await backendResponse.json();
      setIsGoogleLoading(false);

      if (backendData.success) {
        // Save user data
        await AsyncStorage.setItem("user", JSON.stringify({
          token: backendData.token,
          userId: backendData.userId,
          name: backendData.name || userInfo.name,
          email: backendData.email || userInfo.email,
          phone: backendData.phone || '',
          dateAdded: backendData.dateAdded,
          profileImage: backendData.profileImage || userInfo.picture,
          userType: backendData.userType,
        }));

        Alert.alert("Success", "Login successful!");
        navigation.navigate("HomeTabs");
      } else {
        Alert.alert("Error", backendData.message || "Google login failed.");
      }
    } catch (error: any) {
      setIsGoogleLoading(false);
      console.error("Google Sign-In error:", error);
      const errorMessage = error?.message || 'Unknown error occurred';
      Alert.alert(
        "Error", 
        `An error occurred during Google sign-in:\n\n${errorMessage}\n\nPlease try again or contact support.`
      );
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setIsGoogleLoading(true);
      console.log('🔐 Starting Google Sign-In...');
      
      // Detect environment
      const isExpoGoEnv = Constants.executionEnvironment === 'storeClient' || 
                          Constants.executionEnvironment === undefined ||
                          (Constants.executionEnvironment !== 'standalone' && Constants.executionEnvironment !== 'bare');
      
      // Check what redirect URI the request is actually using
      if (request) {
        const actualRedirectUri = request.redirectUri || finalRedirectUri;
        console.log('🔐 Actual Request Redirect URI:', actualRedirectUri);
        console.log('🔐 Configured Redirect URI:', finalRedirectUri);
        console.log('🔐 Environment:', isExpoGoEnv ? 'Expo Go' : `Standalone Build (${Platform.OS})`);
        
        // Determine which Client ID to use
        const webClientId = '189347634725-dtgtb85m9cmqoklkvo5iiph1pju95sgl.apps.googleusercontent.com';
        const iosClientId = '189347634725-b93nogflec3cdk5slh3puf1ktjohjinc.apps.googleusercontent.com';
        const androidClientId = '189347634725-0123dltmgn23eomv6t6b8vr3ukc4jfco.apps.googleusercontent.com';
        const clientIdToUse = isExpoGoEnv 
          ? webClientId 
          : (Platform.OS === 'ios' ? iosClientId : androidClientId);
        
        // Show helpful setup instructions in console
        console.log('\n📋 GOOGLE CONSOLE SETUP CHECKLIST:');
        console.log('1. Redirect URI add karo:', actualRedirectUri);
        console.log('   Link: https://console.cloud.google.com/apis/credentials');
        if (isExpoGoEnv) {
          console.log('   WEB Client ID:', webClientId);
        } else {
          console.log(`   ${Platform.OS === 'ios' ? 'iOS' : 'Android'} Client ID:`, clientIdToUse);
        }
        console.log('2. OAuth Consent Screen configure karo:');
        console.log('   Link: https://console.cloud.google.com/apis/credentials/consent');
        console.log('   - App name: AutoFinder');
        console.log('   - Scopes: openid, profile, email');
        console.log('   - Test Users add karo (agar Testing mode)');
        console.log('3. 10-15 minutes wait karo after changes\n');
        
        // Verify redirect URI is correct for environment
        if (isExpoGoEnv) {
          if (actualRedirectUri.includes('auth.expo.io')) {
            console.log('✅ CORRECT: Using Expo proxy redirect URI (for Expo Go)');
          } else if (actualRedirectUri.startsWith('exp://')) {
            console.error('❌ ERROR: exp:// protocol detected in Expo Go!');
            console.error('   Expected: https://auth.expo.io/@anonymous/autofinder');
            console.error('   Actual:', actualRedirectUri);
            Alert.alert(
              "Redirect URI Issue",
              `Expo Go mein exp:// use nahi hona chahiye.\n\nExpected: https://auth.expo.io/@anonymous/autofinder\n\nApp restart karo.`
            );
            setIsGoogleLoading(false);
            return;
          }
        } else {
          // Standalone build - verify native redirect URI
          if (Platform.OS === 'ios') {
            if (actualRedirectUri.includes('com.googleusercontent.apps')) {
              console.log('✅ CORRECT: Using iOS native redirect URI');
            } else {
              console.warn('⚠️  WARNING: iOS redirect URI format check karo');
            }
          } else {
            if (actualRedirectUri.includes('com.adeel360.autofinder')) {
              console.log('✅ CORRECT: Using Android native redirect URI');
            } else {
              console.warn('⚠️  WARNING: Android redirect URI format check karo');
            }
          }
        }
        
        // If redirect URI differs, show warning
        if (actualRedirectUri !== finalRedirectUri) {
          console.warn('⚠️  WARNING: Redirect URI mismatch!');
          console.warn('   Expected:', finalRedirectUri);
          console.warn('   Actual:', actualRedirectUri);
          console.warn('   ⚠️  Add BOTH URIs to Google Console!');
        }
      }
      
      // Check if request is ready
      if (!request) {
        console.error('❌ ERROR: Google auth request is not ready!');
        setIsGoogleLoading(false);
        Alert.alert(
          "Error",
          "Google Sign-In is not ready. Please wait a moment and try again."
        );
        return;
      }

      console.log('🔐 Calling promptAsync...');
      const result = await promptAsync();
      console.log('🔐 promptAsync result:', result);
      
      // If result is null or undefined, it might mean the browser didn't open
      if (!result) {
        console.warn('⚠️  promptAsync returned null/undefined - browser might not have opened');
        setIsGoogleLoading(false);
        Alert.alert(
          "Error",
          "Google Sign-In browser didn't open. Please check:\n\n1. Internet connection\n2. Google Console configuration\n3. Try again"
        );
      }
    } catch (error: any) {
      setIsGoogleLoading(false);
      console.error("❌ Google Sign-In prompt error:", error);
      console.error("Error details:", JSON.stringify(error, null, 2));
      
      // Check if it's a blocked error
      const errorStr = JSON.stringify(error).toLowerCase();
      if (errorStr.includes('blocked') || errorStr.includes('access_denied') || errorStr.includes('authorization')) {
        Alert.alert(
          "Google Sign-In Blocked",
          `Sign-in blocked ho gaya hai.\n\n🔧 FIX:\n\n1. OAuth Consent Screen configure karo:\n   https://console.cloud.google.com/apis/credentials/consent\n\n2. Test Users mein apna email add karo (agar Testing mode)\n\n3. Redirect URI add karo:\n   ${finalRedirectUri}\n\n4. 10-15 minutes wait karo\n\n5. Phir se try karo`
        );
      } else {
        const errorMessage = error?.message || 'Unknown error';
        Alert.alert(
          "Google Sign-In Error", 
          `Failed to start Google sign-in:\n\n${errorMessage}\n\n🔧 Please check:\n1. Internet connection\n2. Google Console configuration\n3. Try again after a few minutes`
        );
      }
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.container}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={styles.logoContainer}>
            <Image
              source={require("../../../assets/logo.png")}
              style={styles.logo}
              defaultSource={require("../../../assets/logo.png")}
            />
          </View>

          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>Sign in to continue</Text>

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Email</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="mail-outline" size={20} color={COLORS.darkGray} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your email"
                  value={emailOrPhone}
                  placeholderTextColor="#888"
                  onChangeText={(text) => {
                    setEmailOrPhone(text);
                    validateForm(text, password);
                  }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
              {errors.email ? <Text style={styles.errorText}>{errors.email}</Text> : null}
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="lock-closed-outline" size={20} color={COLORS.darkGray} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your password"
                  value={password}
                  placeholderTextColor="#888"
                  onChangeText={(text) => {
                    setPassword(text);
                    validateForm(emailOrPhone, text);
                  }}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                  <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color={COLORS.darkGray} />
                </TouchableOpacity>
              </View>
              {errors.password ? <Text style={styles.errorText}>{errors.password}</Text> : null}
            </View>

            <TouchableOpacity style={styles.forgotPassword} onPress={() => navigation.navigate("ForgotPasswordScreen")}>
              <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.loginButton} 
              activeOpacity={0.8} 
              onPress={handleLogin}
              disabled={isLoading || isGoogleLoading}
            >
              {isLoading ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <Text style={styles.loginButtonText}>Login</Text>
              )}
            </TouchableOpacity>

            {/* Divider + Google Sign-In - Hidden on iOS */}
            {Platform.OS !== 'ios' && (
              <>
                <View style={styles.dividerContainer}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>OR</Text>
                  <View style={styles.dividerLine} />
                </View>

                <TouchableOpacity 
                  style={styles.googleButton} 
                  activeOpacity={0.8} 
                  onPress={handleGoogleSignIn}
                  disabled={isLoading || isGoogleLoading}
                >
                  {isGoogleLoading ? (
                    <ActivityIndicator color={COLORS.black} />
                  ) : (
                    <>
                      <Ionicons name="logo-google" size={20} color="#4285F4" style={{ marginRight: 12 }} />
                      <Text style={styles.googleButtonText}>Continue with Google</Text>
                    </>
                  )}
                </TouchableOpacity>
              </>
            )}
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate("SignupScreen")}>
              <Text style={styles.signupText}>Sign Up</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
};

export default LoginScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 24,
  },
  logoContainer: {
    alignItems: "center",
    marginTop: 40,
    marginBottom: 40,
  },
  logo: {
    width: 120,
    height: 120,
    resizeMode: "contain",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: COLORS.black,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.darkGray,
    marginTop: 8,
    marginBottom: 32,
  },
  form: {
    marginBottom: 24,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    color: COLORS.black,
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    borderRadius: 8,
    backgroundColor: COLORS.white,
  },
  inputIcon: {
    padding: 10,
  },
  input: {
    flex: 1,
    height: 50,
    paddingHorizontal: 8,
    color: 'black'
  },
  eyeIcon: {
    padding: 10,
  },
  errorText: {
    color: COLORS.primary,
    fontSize: 12,
    marginTop: 4,
  },
  forgotPassword: {
    alignSelf: "flex-end",
    marginBottom: 24,
  },
  forgotPasswordText: {
    color: COLORS.primary,
    fontSize: 14,
  },
  loginButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: "center",
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  loginButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "600",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: "auto",
    marginBottom: 24,
  },
  footerText: {
    color: COLORS.darkGray,
    fontSize: 14,
  },
  signupText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: "600",
  },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.lightGray,
  },
  dividerText: {
    marginHorizontal: 16,
    color: COLORS.darkGray,
    fontSize: 14,
  },
  googleButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.white,
    paddingVertical: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  googleButtonText: {
    color: COLORS.black,
    fontSize: 16,
  },
});