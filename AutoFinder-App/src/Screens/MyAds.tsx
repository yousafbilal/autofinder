import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator , Image, Alert, Platform } from "react-native"
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context"
import { Ionicons } from "@expo/vector-icons"
import { COLORS } from "../constants/colors"
import { useNavigation, useFocusEffect } from "@react-navigation/native"
import { NativeStackNavigationProp } from "@react-navigation/native-stack"
import { RootStackParamList } from "../../navigationTypes"
import { API_URL } from "../../config";
import AsyncStorage from '@react-native-async-storage/async-storage';
import MyAdsSkeleton from "../Components/Commons/MyAdsSkeleton";
import BlogSkeleton from "../Components/Commons/BlogSkeleton";
import { safeGetFirstImageSource } from "../utils/safeImageUtils";
import io from 'socket.io-client';
import { rf, rp, createResponsiveStyleSheet, isAndroid } from "../utils/responsive";
import { safeIdToString } from "../utils/apiUtils";
import { getAuthHeaders } from "../utils/authUtils";

// Type definitions
interface Ad {
  _id: string;
  isActive: boolean;
  status: string;
  views: number;
  adType?: string; // 'featured', 'bike', 'listItForYou', 'newCar', 'newBike'
  adStatus?: string; // 'pending', 'approved', 'rejected'
  isFeatured?: string; // 'Pending', 'Approved', 'Rejected'
  paymentStatus?: string; // 'pending', 'verified', 'rejected'
  adminNotes?: string;
  approvedAt?: string;
  rejectedAt?: string;
  expiryDate?: string;
  expiryStatus?: string;
  isPaidAd?: boolean;
  paymentAmount?: number;
  featuredExpiryDate?: string; // Premium expiry date
  validityDays?: number; // Package validity days
  packageName?: string;
  [key: string]: any;
}

interface UserData {
  userId: string;
  [key: string]: any;
}

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const MyAdsScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const insets = useSafeAreaInsets();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [activeTab, setActiveTab] = useState("active");
  const [myAds, setMyAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState<any>(null);
  const [userPackageInfo, setUserPackageInfo] = useState<any>(null); // Package info for boost button

  // Function to check if an ad is pending approval
  const isAdPending = (ad: Ad): boolean => {
    // Only consider an ad pending if it's explicitly pending AND not approved
    // If it's approved, it should not be considered pending regardless of other statuses
    if (ad.isFeatured === 'Approved' || ad.adStatus === 'approved' || ad.paymentStatus === 'verified') {
      return false; // If approved, never consider pending
    }
    
    // Check if it's a 525 PKR ad - these should show as pending
    const is525Ad = ad.paymentAmount === 525 || 
                    (ad.isPaidAd && ad.paymentAmount && (ad.paymentAmount === 525 || ad.paymentAmount === '525'));
    
    // If it's a 525 PKR ad with pending payment, it should be pending
    if (is525Ad && (ad.paymentStatus === 'pending' || ad.adStatus === 'pending')) {
      console.log('✅ 525 PKR ad detected as pending:', {
        paymentAmount: ad.paymentAmount,
        paymentStatus: ad.paymentStatus,
        adStatus: ad.adStatus,
        isPaidAd: ad.isPaidAd
      });
      return true;
    }
    
    // Regular free ads (non-paid) are automatically approved, so don't treat them as pending
    const isFreeAd = !ad.isPaidAd || (ad.paymentAmount === 0 || (!ad.paymentAmount && !is525Ad));
    if (isFreeAd) {
      return false; // Free ads are automatically approved, never pending
    }
    
    // Check different status fields based on ad type - only for paid ads
    if (ad.adStatus === 'pending') return true;
    if (ad.isFeatured === 'Pending') return true;
    // Only check paymentStatus for paid ads (525 PKR or other paid ads)
    if (ad.paymentStatus === 'pending' && ad.isPaidAd && ad.paymentAmount && ad.paymentAmount > 0) {
      return true;
    }
    if (ad.status === 'pending') return true;
    return false;
  };

  // Function to get ad status text
  const getAdStatusText = (ad: Ad): string => {
    // Check if ad is expired first (priority check)
    if (isExpiredAd(ad)) return 'Expired';
    if (isAdPending(ad)) return 'Pending Admin Approval';
    if (ad.adStatus === 'approved' || ad.isFeatured === 'Approved' || ad.paymentStatus === 'verified') return 'Active';
    if (ad.adStatus === 'rejected' || ad.isFeatured === 'Rejected' || ad.paymentStatus === 'rejected') return 'Rejected';
    if (ad.isActive) return 'Active';
    return 'Inactive';
  };

  // Helper: compute a unified expiry date for any ad
  const getComputedExpiryDate = (ad: Ad): Date | null => {
    // Premium featured ads with package validity (7, 15, 30 days) - check featuredExpiryDate first
    if ((ad as any).featuredExpiryDate) {
      const exp = new Date((ad as any).featuredExpiryDate);
      if (!isNaN(exp.getTime())) {
        return exp;
      }
    }
    
    // Premium ads with package validity days and approvedAt date
    if ((ad as any).validityDays && (ad as any).approvedAt) {
      const approvedDate = new Date((ad as any).approvedAt);
      if (!isNaN(approvedDate.getTime())) {
        const expiry = new Date(approvedDate);
        expiry.setDate(expiry.getDate() + ((ad as any).validityDays || 0));
        return expiry;
      }
    }
    
    // Paid simple package with expiryDate
    if (ad.isPaidAd && ad.expiryDate) {
      return new Date(ad.expiryDate);
    }
    
    // Free bikes ads: use expiryDate from backend (15 days) if available
    const isBikeAd = (ad as any)?.adType === 'bike' || (ad as any)?.modelType === 'Free' || (ad as any)?.collection === 'Bike_Ads';
    if (isBikeAd && ad.expiryDate) {
      return new Date(ad.expiryDate);
    }
    
    // Free ads (car/bike): 30 days from dateAdded (fallback for cars or bikes without expiryDate)
    const isFree = (ad as any)?.adType === 'free' || (ad as any)?.category === 'free';
    if (isFree && (ad as any)?.dateAdded) {
      const base = new Date((ad as any).dateAdded);
      if (!isNaN(base.getTime())) {
        const d = new Date(base);
        d.setDate(d.getDate() + 30);
        return d;
      }
    }
    
    return null;
  }

  const isExpiredAd = (ad: Ad): boolean => {
    const exp = getComputedExpiryDate(ad)
    return !!exp && exp < new Date()
  }

  // Function to get ad status color
  const getAdStatusColor = (ad: Ad): string => {
    // Check if ad is expired first (priority check)
    if (isExpiredAd(ad)) return COLORS.error;
    if (isAdPending(ad)) return COLORS.warning;
    if (ad.adStatus === 'approved' || ad.isFeatured === 'Approved' || ad.paymentStatus === 'verified') return COLORS.success;
    if (ad.adStatus === 'rejected' || ad.isFeatured === 'Rejected' || ad.paymentStatus === 'rejected') return COLORS.error;
    if (ad.isActive) return COLORS.success;
    return COLORS.gray;
  };

  // Fetch user data from AsyncStorage
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const storedUserData = await AsyncStorage.getItem('user');
        if (storedUserData) {
          const parsedData = JSON.parse(storedUserData);
          console.log("Fetched User Data:", parsedData);
          setUserData(parsedData);
        } else {
          console.log("No user data found in AsyncStorage.");
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []); // Empty dependency array to run this effect only once when the component mounts

  // Fetch user's package info for boost button
  const fetchUserPackageInfo = async () => {
    if (!userData?.userId) {
      console.log("⚠️ No userId found, skipping package fetch");
      return;
    }
    
    try {
      // Add timestamp to bust cache and get fresh data
      const timestamp = new Date().getTime();
      console.log(`🔍 Fetching packages for user: ${userData.userId} (cache-bust: ${timestamp})`);
      // Use safeApiCall for automatic retry and better error handling
      const { safeApiCall } = require('../utils/apiUtils');
      
      const result = await safeApiCall<any>(`${API_URL}/mobile/user-mobile-packages/${userData.userId}?_t=${timestamp}`, {
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      }, 1);
      
      let data: any = { packages: [], success: true };
      if (result.success && result.data) {
        data = result.data;
      } else {
        console.warn("⚠️ Failed to fetch packages:", result.error);
      }
      
      console.log(`📦 Fresh package data received:`, {
        success: data.success,
        packagesCount: data.packages?.length,
        firstPackageBoostersRemaining: data.packages?.[0]?.usage?.boostersRemaining
      });
      
      console.log("📦 Full API response:", data);
      
      const packages = data.packages || data.items || [];
      console.log(`📦 Found ${packages.length} packages in response`);
      
      if (packages.length > 0) {
        packages.forEach((p: any, i: number) => {
          console.log(`  Package ${i + 1}:`, {
            name: p.package?.name,
            isActive: p.isActive,
            active: p.active,
            status: p.purchase?.status,
            expiryDate: p.expiryDate,
            boostersRemaining: p.usage?.boostersRemaining
          });
        });
      }
      
      // ✅ Filter active packages
      const activePackages = packages.filter((p: any) => p.isActive || p.active);
      
      if (activePackages.length === 0) {
        console.log("❌ No active package found");
        setUserPackageInfo(null);
        return;
      }
      
      // ✅ Select package with LATEST expiry date (longest validity remaining)
      const activePackage = activePackages.reduce((latest: any, current: any) => {
        const latestExpiry = latest.expiryDate ? new Date(latest.expiryDate).getTime() : 0;
        const currentExpiry = current.expiryDate ? new Date(current.expiryDate).getTime() : 0;
        return currentExpiry > latestExpiry ? current : latest;
      });
      
      console.log(`✅ Selected package (latest expiry) from ${activePackages.length} active:`, {
        name: activePackage.package?.name,
        boostersRemaining: activePackage.usage?.boostersRemaining ?? 0,
        totalBoosters: activePackage.usage?.totalBoosters ?? 0,
        expiryDate: activePackage.expiryDate,
        packageId: activePackage.package?._id || activePackage.purchase?.packageId
      });
      
      setUserPackageInfo(activePackage);
    } catch (error) {
      console.error("❌ Error fetching package info:", error);
      setUserPackageInfo(null);
    }
  };

  // Safe parse for API responses (avoids crash when server returns HTML)
  const safeParseAdsResponse = (data: any): any[] => {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    if (typeof data === 'object' && data.packages) return Array.isArray(data.packages) ? data.packages : [];
    return [];
  };

  // Fetch My Ads once user data is available
  useEffect(() => {
    const fetchMyAds = async () => {
      if (userData && userData.userId) { // Check if userData and userId are available
        try {
          // Use safeApiCall for automatic retry and better error handling
          const { safeApiCall } = require('../utils/apiUtils');
          const result = await safeApiCall<any[]>(`${API_URL}/all_user_ads/${userData.userId}`, {}, 2);
          
          if (result.success && result.data) {
            const data = safeParseAdsResponse(result.data);
            // Filter out ads with invalid/empty object IDs
            const validAds = data.filter((ad: any) => {
              const rawId = ad._id || ad.id;
              if (!rawId) return false;
              if (typeof rawId === 'object' && Object.keys(rawId).length === 0) {
                console.warn('⚠️ Filtering out ad with empty object ID:', ad);
                return false;
              }
              return true;
            });
            console.log(`✅ Loaded ${validAds.length} valid ads (filtered ${data.length - validAds.length} invalid)`);
            setMyAds(validAds);
          } else {
            console.error("❌ Failed to fetch ads:", result.error);
            setMyAds([]);
          }
        } catch (error) {
          console.error("Error fetching ads:", error);
          setMyAds([]); // Set to an empty array in case of an error
        } finally {
          setLoading(false);
        }
      }
    };
  
    fetchMyAds();
    fetchUserPackageInfo(); // Also fetch package info
  }, [userData]); // This will run when userData changes

  // ✅ Auto-refresh when screen comes into focus (after admin approval)
  useFocusEffect(
    React.useCallback(() => {
      if (userData && userData.userId) {
        console.log("🔄 MyAds screen focused - Refreshing ads...");
        const refreshAds = async () => {
          try {
            // Use safeApiCall for automatic retry and better error handling
            const { safeApiCall } = require('../utils/apiUtils');
            const timestamp = new Date().getTime();
            const result = await safeApiCall<any[]>(`${API_URL}/all_user_ads/${userData.userId}?_t=${timestamp}`, {
              headers: {
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache'
              }
            }, 2);
            
            if (result.success && result.data && Array.isArray(result.data)) {
              console.log(`✅ MyAds: Refreshed ${result.data.length} ads`);
              setMyAds(result.data);
            } else {
              console.error("❌ Failed to refresh ads:", result.error);
            }
          } catch (error) {
            console.error("Error refreshing ads:", error);
          }
        };
        refreshAds();
      }
    }, [userData?.userId])
  );

  // Socket connection for real-time notifications
  useEffect(() => {
    if (userData && userData.userId) {
      console.log('🔌 Connecting to socket for user:', userData.userId);
      
      const newSocket = io(API_URL, {
        transports: ['websocket'],
        query: {
          userId: userData.userId
        }
      });

      // Handle ad approval notifications
      newSocket.on('notification', (notification) => {
        console.log('🔔 Received notification in MyAds:', notification);
        
        if (notification.type === 'featured_ad_status_updated' || 
            notification.type === 'new_car_status_updated' ||
            notification.type === 'new_bike_status_updated' ||
            notification.type === 'list_it_for_you_status_updated' ||
            notification.type === 'bike_ad_status_updated' ||
            notification.type === 'premium_ad_status_updated') {
          
          if (notification.status === 'Approved') {
            // Show approval notification
            Alert.alert(
              '🎉 Ad Approved!',
              notification.message || 'Your ad has been approved and is now active!',
              [
                {
                  text: 'View Active Ads',
                  onPress: () => setActiveTab('active')
                },
                {
                  text: 'OK',
                  style: 'default'
                }
              ]
            );
            
            // Refresh ads to show updated status
            const refreshAds = async () => {
              try {
                // Use safeApiCall for automatic retry and better error handling
                const { safeApiCall } = require('../utils/apiUtils');
                const result = await safeApiCall<any[]>(`${API_URL}/all_user_ads/${userData.userId}`, {}, 2);
                
                if (result.success && result.data) {
                  const data = Array.isArray(result.data) ? result.data : [];
                  setMyAds(data);
                } else {
                  console.error("❌ Failed to refresh ads:", result.error);
                }
              } catch (error) {
                console.error("Error refreshing ads:", error);
              }
            };
            
            refreshAds();
          }
        }
      });

      // Handle connection events
      newSocket.on('connect', () => {
        console.log('✅ MyAds Socket connected');
      });

      newSocket.on('disconnect', () => {
        console.log('❌ MyAds Socket disconnected');
      });

      setSocket(newSocket);

      // Cleanup on unmount
      return () => {
        console.log('🧹 Cleaning up MyAds socket connection');
        newSocket.disconnect();
      };
    }
  }, [userData]);
   // This will run when userData changes
  
   const filteredAds = Array.isArray(myAds) ? myAds.filter((ad) => {
    if (activeTab === "active") {
      // Show ads that are active but NOT expired, NOT rejected, NOT deleted
      // Exclude expired, rejected, and deleted ads from active tab
      const isExpired = isExpiredAd(ad);
      if (isExpired) return false; // Don't show expired ads in active tab
      
      const isRejected = ad.adStatus === 'rejected' || 
                        ad.isFeatured === 'Rejected' || 
                        ad.paymentStatus === 'rejected';
      if (isRejected) return false; // Don't show rejected ads in active tab
      
      // ❌ Don't show deleted by admin ads in active tab
      if (ad.isDeleted === true) return false;
      
      // FIXED: Show ads in active tab if:
      // 1. isActive === true AND not pending, OR
      // 2. Approved by admin (isFeatured === 'Approved' OR adStatus === 'approved' OR paymentStatus === 'verified')
      // This ensures approved premium cars show in active tab even if isActive was false initially
      const isApproved = ad.isFeatured === 'Approved' || 
                       ad.adStatus === 'approved' || 
                       ad.paymentStatus === 'verified';
      const isActiveAndNotExpired = (ad.isActive === true && !isAdPending(ad)) || 
                                   (isApproved && !isAdPending(ad));
      return isActiveAndNotExpired;
    } else if (activeTab === "pending") {
      // Show only pending approval ads (exclude approved/active ones)
      return isAdPending(ad) && 
             ad.adStatus !== 'approved' && 
             ad.isFeatured !== 'Approved' && 
             ad.paymentStatus !== 'verified';
    } else if (activeTab === "inactive") {
      // Show ads that are:
      // 1. Inactive (isActive: false) AND NOT approved (approved ads should be in active tab) OR
      // 2. REJECTED by admin (adStatus === 'rejected' OR isFeatured === 'Rejected' OR paymentStatus === 'rejected') OR
      // 3. EXPIRED (expiryDate/featuredExpiryDate has passed) OR
      // 4. DELETED by admin (isDeleted === true)
      // Exclude pending ads AND approved ads (approved ads go to active tab)
      // FIXED: Exclude approved ads from inactive tab (they should be in active tab)
      const isApproved = ad.isFeatured === 'Approved' || 
                        ad.adStatus === 'approved' || 
                        ad.paymentStatus === 'verified';
      if (isApproved && !isAdPending(ad)) return false; // Approved ads should be in active tab, not inactive
      
      const isRejected = ad.adStatus === 'rejected' || 
                        ad.isFeatured === 'Rejected' || 
                        ad.paymentStatus === 'rejected';
      const isExpired = isExpiredAd(ad);
      const isDeletedByAdmin = ad.isDeleted === true;
      const isInactive = (ad.isActive === false || isRejected || isExpired || isDeletedByAdmin) && !isAdPending(ad);
      console.log(`🔍 Ad ${ad._id}: isActive=${ad.isActive}, isApproved=${isApproved}, isRejected=${isRejected}, isExpired=${isExpired}, isDeleted=${isDeletedByAdmin}, isPending=${isAdPending(ad)}, willShow=${isInactive}`);
      return isInactive;
    } else if (activeTab === "expired") {
      // Show expired ads - check if package validity has expired (7, 15, 30 days)
      // This includes: premium ads with expired featuredExpiryDate, paid ads with expired expiryDate, free ads past 30 days
      return isExpiredAd(ad);
    }
    return false;
  }) : [];


  // Debug function to log all ads when switching to inactive tab
  useEffect(() => {
    if (activeTab === "inactive") {
      console.log("🔍 INACTIVE TAB - All ads:", myAds.map(ad => ({
        id: ad._id,
        isActive: ad.isActive,
        isPending: isAdPending(ad),
        adStatus: ad.adStatus,
        isFeatured: ad.isFeatured,
        paymentStatus: ad.paymentStatus,
        title: `${ad.year} ${ad.make} ${ad.model}`
      })));
    }
  }, [activeTab, myAds]);

  // Debug function to log expired ads when switching to expired tab
  useEffect(() => {
    if (activeTab === "expired") {
      console.log("🔍 EXPIRED TAB - All ads:", myAds.map(ad => ({
        id: ad._id,
        isPaidAd: ad.isPaidAd,
        expiryDate: ad.expiryDate,
        expiryStatus: ad.expiryStatus,
        isActive: ad.isActive,
        title: `${ad.year} ${ad.make} ${ad.model}`,
        isExpired: ad.expiryDate ? new Date(ad.expiryDate) < new Date() : false
      })));
    }
  }, [activeTab, myAds]);
  
  
  const handleEditAd = (adId: string | any) => {
    const idStr = typeof adId === 'string' ? adId : (adId != null ? safeIdToString(adId) : '');
    if (!idStr) return;
    (navigation as any).navigate("EditAd", { adId: idStr });
  };

  const handleDeleteAd = (adId: string | any) => {
    // ✅ Fix: Ensure adId is a string, not an object
    let idToDelete: string;
    
    if (typeof adId === 'string') {
      idToDelete = adId;
    } else if (adId && typeof adId === 'object' && adId._id) {
      // If object passed, extract _id
      idToDelete = String(adId._id);
      console.warn(`⚠️ handleDeleteAd: Object passed instead of string ID, extracted: ${idToDelete}`);
    } else if (adId && typeof adId === 'object' && adId.id) {
      idToDelete = String(adId.id);
      console.warn(`⚠️ handleDeleteAd: Object passed instead of string ID, extracted: ${idToDelete}`);
    } else {
      console.error(`❌ handleDeleteAd: Invalid adId type: ${typeof adId}`, adId);
      Alert.alert("Error", "Invalid ad ID. Please try again.");
      return;
    }
    
    // Validate ID format
    if (!idToDelete || idToDelete === '[object Object]' || idToDelete.length < 10) {
      console.error(`❌ handleDeleteAd: Invalid ID format: ${idToDelete}`);
      Alert.alert("Error", "Invalid ad ID format. Please try again.");
      return;
    }
    
    console.log(`🗑️ handleDeleteAd: Deleting ad with ID: ${idToDelete}`);
    
    Alert.alert(
      "Delete Ad",
      "Are you sure you want to delete this ad?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          onPress: async () => {
            try {
              const headers = await getAuthHeaders();
              const response = await fetch(`${API_URL}/delete_ad/${idToDelete}`, {
                method: "DELETE",
                headers,
              });
              const contentType = response.headers.get("content-type") || "";
              let result: { success?: boolean; message?: string } = {};
              if (contentType.includes("application/json")) {
                try {
                  result = await response.json();
                } catch (_) {
                  result = { message: "Invalid response from server." };
                }
              } else {
                const text = await response.text();
                if (response.status === 401) {
                  result = { message: "Please log in again to delete this ad." };
                } else {
                  result = { message: text?.slice(0, 100) || "Could not delete ad." };
                }
              }
              if (response.ok && result.success) {
                const updatedAds = myAds.filter((ad) => {
                  const adIdStr = String(ad._id || ad.id);
                  return adIdStr !== idToDelete;
                });
                setMyAds(updatedAds);
                Alert.alert("Success", "Ad deleted successfully.");
              } else {
                Alert.alert("Error", result.message || "Could not delete ad. Please try again.");
              }
            } catch (error) {
              console.error("Error deleting ad:", error);
              Alert.alert("Error", "An error occurred while deleting the ad. Please try again.");
            }
          },
          style: "destructive",
        },
      ],
      { cancelable: true }
    );
  };
  

  const handleViewAd = (adId: any) => {
    console.log("🚀 handleViewAd called with adId:", adId);
    
    try {
      // Safely extract adId string
      let safeAdId: string | null = null;
      
      // Check if adId is an empty object
      if (adId && typeof adId === 'object') {
        const keys = Object.keys(adId);
        if (keys.length === 0) {
          console.error("❌ Empty object ID passed to handleViewAd");
          Alert.alert('Error', 'Invalid ad ID. Please refresh and try again.');
          return;
        }
        // Try to extract ID from object
        try {
          safeAdId = safeIdToString(adId);
        } catch (e) {
          console.error("❌ Failed to convert adId to string:", e);
          Alert.alert('Error', 'Invalid ad ID format. Please refresh and try again.');
          return;
        }
      } else if (typeof adId === 'string') {
        safeAdId = adId;
      } else if (adId) {
        try {
          safeAdId = safeIdToString(adId);
        } catch (e) {
          console.error("❌ Failed to convert adId to string:", e);
          Alert.alert('Error', 'Invalid ad ID format. Please refresh and try again.');
          return;
        }
      }
      
      if (!safeAdId || safeAdId === '[object Object]' || safeAdId.length < 5) {
        console.error("❌ Invalid adId format:", safeAdId);
        Alert.alert('Error', 'Invalid ad ID. Please refresh and try again.');
        return;
      }
      
      // Find the ad - need to compare safely
      const ad = myAds.find(ad => {
        try {
          const adIdStr = safeIdToString(ad._id || ad.id);
          return adIdStr === safeAdId;
        } catch {
          return false;
        }
      });
      
      if (!ad) {
        console.error("❌ Ad not found with ID:", safeAdId);
        Alert.alert('Error', 'Ad not found. Please refresh and try again.');
        return;
      }

      console.log("🔍 Viewing own ad:", {
        adId: ad._id,
        adType: ad.adType || 'car',
        title: `${ad.year} ${ad.make} ${ad.model}`,
        isActive: ad.isActive,
        status: ad.status,
        isOwnAd: true,
        userId: userData?.userId,
        totalAds: myAds.length,
        hasImages: !!(ad.image1 || ad.image2 || ad.image3 || ad.image4)
      });

      // Add a flag to indicate this is the user's own ad
      const adWithOwnershipFlag = {
        ...ad,
        isOwnAd: true, // Flag to indicate this is the user's own ad
        currentUserId: userData?.userId, // Pass current user ID for reference
        // Ensure all necessary fields are present for detail screen
        title: ad.title || `${ad.year} ${ad.make} ${ad.model}`,
        price: ad.price || 0,
        location: ad.location || 'Not specified',
        description: ad.description || 'No description available',
        dateAdded: ad.dateAdded || ad.createdAt || new Date().toISOString()
      };

      console.log("🧭 Navigating to detail screen...");
      console.log("🧭 Ad type:", ad.adType || 'car');
      console.log("🧭 Navigation target:", 
        (ad.adType || 'car') === 'bike' || (ad.adType || 'car') === 'newBike' ? "BikeDetails" :
        (ad.adType || 'car') === 'newCar' ? "NewCarDetails" : "CarDetails"
      );

      // Navigate based on ad type
      if ((ad.adType || 'car') === 'autoparts') {
        console.log("🔧 Navigating to AutoPartsDetailsScreen");
        (navigation as any).navigate("AutoPartsDetailsScreen", { 
          part: adWithOwnershipFlag,
          autoPartsDetails: adWithOwnershipFlag
        });
      } else if ((ad.adType || 'car') === 'bike' || (ad.adType || 'car') === 'newBike') {
        console.log("🏍️ Navigating to BikeDetails");
        (navigation as any).navigate("BikeDetails", { carDetails: adWithOwnershipFlag });
      } else if ((ad.adType || 'car') === 'newCar') {
        console.log("🚗 Navigating to NewCarDetails");
        (navigation as any).navigate("NewCarDetails", { carDetails: adWithOwnershipFlag });
      } else if ((ad.adType || 'car') === 'rentcar') {
        console.log("🚙 Navigating to RentalCarDetailsScreen");
        (navigation as any).navigate("RentalCarDetailsScreen", { carDetails: adWithOwnershipFlag });
      } else {
        console.log("🚙 Navigating to CarDetails (default)");
        // Default to car details for other types
        (navigation as any).navigate("CarDetails", { carDetails: adWithOwnershipFlag });
      }

      console.log("✅ Navigation completed successfully");
    } catch (error) {
      console.error("❌ Error in handleViewAd:", error);
      Alert.alert('Error', 'Failed to open ad details. Please try again.');
    }
  }

  const handleAdOptions = (ad: Ad) => {
    console.log(`🔍 handleAdOptions called for ad ${ad._id}:`, {
      adStatus: ad.adStatus,
      isFeatured: ad.isFeatured,
      paymentStatus: ad.paymentStatus,
      isPending: isAdPending(ad),
      isRejected: ad.adStatus === 'rejected' || ad.isFeatured === 'Rejected' || ad.paymentStatus === 'rejected',
      isDeleted: ad.isDeleted
    });

    const isRejected = ad.adStatus === 'rejected' || ad.isFeatured === 'Rejected' || ad.paymentStatus === 'rejected';
    const isPending = isAdPending(ad);
    const isDeletedByAdmin = ad.isDeleted === true;
    
    // Show appropriate title and message based on ad status
    let title = "Ad Options";
    let message = "What would you like to do with this ad?";
    
    // 🗑️ Handle DELETED by Admin ads - only show View option
    if (isDeletedByAdmin) {
      Alert.alert(
        "🗑️ Deleted by Admin",
        "This ad has been deleted by admin. You can only view it but cannot edit or restore it.",
        [
          {
            text: "View Ad",
            onPress: () => handleViewAd(ad._id),
          },
          {
            text: "OK",
            style: "cancel",
          }
        ],
        { cancelable: true }
      );
      return;
    }
    
    if (isPending) {
      title = "Pending Ad Options";
      message = "This ad is waiting for admin approval. You can edit or delete it.";
    } else if (isRejected) {
      title = "Rejected Ad Options";
      message = "This ad was rejected by admin. You can still edit or delete it.";
    }

    // Build options array - Edit and Delete are ALWAYS available (except for admin-deleted ads)
    const options = [
      {
        text: "View Ad",
        onPress: () => handleViewAd(ad._id),
      },
      {
        text: "Edit Ad",
        onPress: () => handleEditAd(ad._id),
      },
      {
        text: "Delete Ad",
        onPress: () => handleDeleteAd(ad._id),
        style: "destructive" as const,
      }
    ];

    // Only add activate/deactivate for non-pending, non-rejected ads
    if (!isPending && !isRejected) {
      options.push({
        text: ad.isActive ? "Deactivate Ad" : "Activate Ad",
        onPress: () => toggleAdStatus(ad._id),
      });
    }

    // Add cancel option
    options.push({
      text: "Cancel",
      onPress: () => {},
    });

    Alert.alert(title, message, options, { cancelable: true });
  }

  const toggleAdStatus = async (adId: string | any) => {
    try {
      const idStr = typeof adId === 'string' ? adId : (adId != null ? safeIdToString(adId) : '');
      if (!idStr) return;
      console.log('🔄 Toggling ad status for:', idStr);
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_URL}/toggle_ad_status/${idStr}`, {
        method: "PATCH",
        headers,
      });

      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);
  
      if (response.ok) {
        const data = await response.json(); 
        console.log('Success response:', data);
  
        const updatedAds = myAds.map((ad) => {
          const adIdCompare = String(ad._id ?? ad.id ?? '');
          if (adIdCompare === idStr) {
            console.log(`🔄 Updating ad ${idStr}:`, {
              before: { isActive: ad.isActive, adStatus: ad.adStatus, isFeatured: ad.isFeatured },
              type: ad.adStatus === 'approved' || ad.isFeatured === 'Approved' || ad.paymentStatus === 'verified' ? 'approved' : 'regular'
            });
            
            // For approved ads, we need to handle both isActive and approval status
            if (ad.adStatus === 'approved' || ad.isFeatured === 'Approved' || ad.paymentStatus === 'verified') {
              // If deactivating an approved ad, set isActive to false but keep approval status
              const updatedAd = { ...ad, isActive: false };
              console.log(`✅ Updated approved ad:`, { isActive: updatedAd.isActive });
              return updatedAd; 
            } else {
              // For regular ads, just toggle isActive
              const updatedAd = { ...ad, isActive: !ad.isActive };
              console.log(`✅ Updated regular ad:`, { isActive: updatedAd.isActive });
              return updatedAd; 
            }
          }
          return ad;
        });
  
        setMyAds(updatedAds);
        
        // Show success message
        const newStatus = data.ad?.isActive;
        const statusText = newStatus ? 'activated' : 'deactivated';
        
        // If ad was deactivated and we're on active tab, switch to inactive tab
        if (!newStatus && activeTab === "active") {
          setActiveTab("inactive");
          Alert.alert('Success', `✅ Ad successfully ${statusText}! Moved to Inactive tab.`);
        } else if (newStatus && activeTab === "inactive") {
          setActiveTab("active");
          Alert.alert('Success', `✅ Ad successfully ${statusText}! Moved to Active tab.`);
        } else {
          Alert.alert('Success', `✅ Ad successfully ${statusText}!`);
        }
        
      } else {
        // Handle API errors with detailed error message
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
          console.error('❌ API Error Data:', errorData);
        } catch (e) {
          console.error('❌ Could not parse error response');
        }
        
        console.error("Failed to toggle ad status:", errorMessage);
        Alert.alert('Error', `❌ Failed to update ad status: ${errorMessage}`);
      }
    } catch (error) {
      // Handle network errors or other exceptions
      console.error("Error toggling ad status:", error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      Alert.alert('Error', `❌ Network error: ${errorMessage}`);
    }
  };
  
  const renderAdItem = ({ item }: { item: Ad }) => (
    <View style={[styles.adCard, item.status === 'pending' && styles.pendingCard]}>
      {isAdPending(item) ? (
        // Pending ads - view only, no click
        <View style={styles.imageContainer}>
          <Image
            source={safeGetFirstImageSource(item, API_URL)}
            style={styles.adImage}
          />
          {/* Gradient Overlay */}
          <View style={styles.imageOverlay} />
          {/* Boosted Badge */}
          {item.isBoosted && (
            <View style={styles.boostedBadge}>
              <Ionicons name="rocket" size={14} color={COLORS.white} />
              <Text style={styles.boostedBadgeText}>Boosted</Text>
            </View>
          )}
        </View>
      ) : (
        // Active/Inactive ads - clickable
        <TouchableOpacity 
          style={styles.imageContainer}
          activeOpacity={0.9}
          onPress={() => {
            console.log("🖼️ Ad image clicked for ad:", item._id);
            console.log("🖼️ Ad details:", {
              id: item._id,
              title: `${item.year} ${item.make} ${item.model}`,
              isActive: item.isActive,
              adType: item.adType
            });
            handleViewAd(item._id);
          }}
        >
          <Image
            source={safeGetFirstImageSource(item, API_URL)}
            style={styles.adImage}
          />
          {/* Gradient Overlay */}
          <View style={styles.imageOverlay} />
          {/* Boosted Badge */}
          {item.isBoosted && (
            <View style={styles.boostedBadge}>
              <Ionicons name="rocket" size={14} color={COLORS.white} />
              <Text style={styles.boostedBadgeText}>Boosted</Text>
            </View>
          )}
        </TouchableOpacity>
      )}

      <View style={styles.adContent}>
        <View style={styles.adHeader}>
          {isAdPending(item) ? (
            // Pending ads - view only, no click
            <View>
              <Text style={styles.adTitle} numberOfLines={2}>{item.year} {item.make} {item.model} {item.variant}</Text>
            </View>
          ) : (
            // Active/Inactive ads - clickable
            <TouchableOpacity onPress={() => {
              // Safely extract ad ID
              let safeId: any = item._id || item.id;
              if (safeId && typeof safeId === 'object' && Object.keys(safeId).length === 0) {
                console.error("❌ Empty object ID in ad item, cannot navigate");
                Alert.alert('Error', 'Invalid ad ID. Please refresh and try again.');
                return;
              }
              console.log("📝 Ad title clicked for ad:", safeId);
              console.log("📝 Ad details:", {
                id: safeId,
                title: `${item.year} ${item.make} ${item.model}`,
                isActive: item.isActive,
                adType: item.adType
              });
              handleViewAd(safeId);
            }}>
              <Text style={styles.adTitle} numberOfLines={2}>{item.year} {item.make} {item.model} {item.variant}</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={() => handleAdOptions(item)} style={styles.optionsButton}>
            <Ionicons name="ellipsis-vertical" size={18} color={COLORS.darkGray} />
          </TouchableOpacity>
        </View>

        <Text style={styles.adPrice}>PKR. {item.price ? item.price.toLocaleString() : '0'}</Text>
        
        {/* Status Badge - Only show for pending ads in pending tab */}
        {activeTab === "pending" && isAdPending(item) && (
          <View style={[styles.statusBadge, { backgroundColor: getAdStatusColor(item) + '20', borderLeftColor: getAdStatusColor(item) }]}>
            <Ionicons name="time-outline" size={14} color={getAdStatusColor(item)} />
            <Text style={[styles.statusText, { color: getAdStatusColor(item) }]}>Pending Admin Approval</Text>
          </View>
        )}
        
        {/* Package Info for pending premium ads */}
        {isAdPending(item) && (item.packageName || item.validityDays) && (
          <View style={[styles.statusBadge, { backgroundColor: '#3498db20', borderLeftColor: '#3498db' }]}>
            <Ionicons name="gift-outline" size={14} color="#3498db" />
            <Text style={[styles.statusText, { color: '#3498db' }]}>
              {item.packageName || 'Premium Package'} 
              {item.validityDays ? ` • ${item.validityDays} days` : ''}
            </Text>
          </View>
        )}
        
        
        {/* Rejected Status */}
        {(item.adStatus === 'rejected' || item.isFeatured === 'Rejected' || item.paymentStatus === 'rejected') && (
          <View style={[styles.statusBadge, { backgroundColor: COLORS.error + '20', borderLeftColor: COLORS.error }]}>
            <Ionicons name="close-circle-outline" size={14} color={COLORS.error} />
            <Text style={[styles.statusText, { color: COLORS.error }]}>Rejected by Admin</Text>
          </View>
        )}
        
        {/* Deleted by Admin Status */}
        {item.isDeleted === true && (
          <View style={[styles.statusBadge, { backgroundColor: '#8B0000' + '20', borderLeftColor: '#8B0000' }]}>
            <Ionicons name="trash-outline" size={14} color="#8B0000" />
            <Text style={[styles.statusText, { color: '#8B0000' }]}>Deleted by Admin</Text>
          </View>
        )}
        
        {/* Premium Expiry Date - Show for approved premium ads */}
        {item.isFeatured === 'Approved' && item.featuredExpiryDate && (
          <View style={styles.badgeRow}>
            <View style={[
              styles.statusBadge, 
              { 
                backgroundColor: new Date(item.featuredExpiryDate) < new Date() ? COLORS.error + '20' : '#27ae6020', 
                borderLeftColor: new Date(item.featuredExpiryDate) < new Date() ? COLORS.error : '#27ae60',
                flex: 1,
                marginRight: 8,
              }
            ]}>
              <Ionicons 
                name={new Date(item.featuredExpiryDate) < new Date() ? "alert-circle-outline" : "calendar-outline"} 
                size={14} 
                color={new Date(item.featuredExpiryDate) < new Date() ? COLORS.error : '#27ae60'} 
              />
              <Text style={[
                styles.statusText, 
                { color: new Date(item.featuredExpiryDate) < new Date() ? COLORS.error : '#27ae60' }
              ]}>
                {new Date(item.featuredExpiryDate) < new Date() 
                  ? `Premium Expired: ${new Date(item.featuredExpiryDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}` 
                  : `Premium Expires: ${new Date(item.featuredExpiryDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
                }
                {item.validityDays ? ` (${item.validityDays} days)` : ''}
              </Text>
            </View>
            
            {/* Boost Your Ad button - Next to Premium badge (only once) */}
            {!isAdPending(item) && !(item.adStatus === 'rejected' || item.isFeatured === 'Rejected' || item.paymentStatus === 'rejected') && (() => {
              const isFreeAd = !item.isPaidAd || (item.paymentAmount === 0 || !item.paymentAmount);
              const hasBoostersInPackage = userPackageInfo?.usage?.boostersRemaining > 0;
              
              if (isFreeAd && !hasBoostersInPackage) return null;
              
              const hasPackage = !!userPackageInfo;
              const boostsRemaining = userPackageInfo?.usage?.boostersRemaining ?? 0;
              const isAlreadyBoosted = item.isBoosted === true;
              
              return (
                <TouchableOpacity 
                  style={styles.boostButtonCompact}
                  onPress={async () => {
                    try {
                      console.log("🚀 Boost Your Ad button pressed for ad:", item._id);
                      
                      const userId = userData?.userId || userData?._id;
                      if (!userId) {
                        Alert.alert('Error', 'User not logged in');
                        return;
                      }
                      
                      if (!userPackageInfo) {
                        await fetchUserPackageInfo();
                        
                        if (!userPackageInfo) {
                          Alert.alert(
                            'No Active Package',
                            'You need to purchase a Dealer Package to boost your ads.',
                            [
                              { text: 'Cancel', style: 'cancel' },
                              { 
                                text: 'Buy Package', 
                                onPress: () => (navigation as any).navigate('PostCarAdFeatured', { isUpgradeToFeatured: true })
                              }
                            ]
                          );
                          return;
                        }
                      }
                      
                      const boostsRemaining = userPackageInfo?.usage?.boostersRemaining ?? 0;
                      
                      if (boostsRemaining <= 0) {
                        if (userPackageInfo && userPackageInfo.usage && userPackageInfo.usage.boostersRemaining === 0) {
                          (navigation as any).navigate('PostCarAdFeatured', { isUpgradeToFeatured: true });
                          return;
                        }
                        
                        Alert.alert(
                          'No Boosts Remaining',
                          `You have used all boosts from your ${userPackageInfo?.package?.name || 'package'}. Please upgrade or buy a new package.`,
                          [
                            { text: 'Cancel', style: 'cancel' },
                            { 
                              text: 'Upgrade Package', 
                              onPress: () => (navigation as any).navigate('PostCarAdFeatured', { isUpgradeToFeatured: true })
                            }
                          ]
                        );
                        return;
                      }
                      
                      const packageId = userPackageInfo?.package?._id || userPackageInfo?.package?.id || userPackageInfo?.purchase?.packageId;
                      
                      const res = await fetch(`${API_URL}/mobile/ads/${item._id}/boost`, { 
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ 
                          userId: userId,
                          packageId: packageId
                        })
                      });
                      
                      const json = await res.json().catch(()=>({}));
                      
                      if (!res.ok || json?.success === false) {
                        Alert.alert('Boost Failed', json?.message || 'Could not boost the ad.');
                        return;
                      }
                      
                      if (userPackageInfo?.usage) {
                        const updatedPackageInfo = {
                          ...userPackageInfo,
                          usage: {
                            ...userPackageInfo.usage,
                            boostersUsed: (userPackageInfo.usage.boostersUsed || 0) + 1,
                            boostersRemaining: Math.max(0, boostsRemaining - 1)
                          }
                        };
                        setUserPackageInfo(updatedPackageInfo);
                      }
                      
                      Alert.alert(
                        '🚀 Boost Successful!', 
                        `Your ad has been boosted to the top!\n\n✅ Duration: 3 days\n🔥 Boosts remaining: ${boostsRemaining - 1}\n\nYour ad will stay on top for the next 3 days.`,
                        [{ text: 'OK', onPress: () => { 
                          refreshAds(); 
                          fetchUserPackageInfo();
                        }}]
                      );
                    } catch (e) {
                      console.error("❌ Error boosting ad:", e);
                      Alert.alert('Error', 'Unexpected error while boosting ad.');
                    }
                  }}
                  activeOpacity={0.7}
                >
                  <Ionicons name="rocket" size={14} color={hasPackage && boostsRemaining > 0 ? COLORS.primary : COLORS.darkGray} />
                  {hasPackage && boostsRemaining > 0 && (
                    <Text style={styles.boostButtonTextCompact}>
                      {isAlreadyBoosted ? 'Again' : 'Boost'}
                    </Text>
                  )}
                </TouchableOpacity>
              );
            })()}
          </View>
        )}

        {/* Buy Package button for Free Ads */}
        {(() => {
          const isFreeAd = !item.isPaidAd || (item.paymentAmount === 0 || !item.paymentAmount) || (item.paymentAmount === 525);
          
          // Don't show if it's a premium ad (upgraded from free)
          const isPremiumAd = item.isFeatured === 'Approved' || 
                             (item.adStatus === 'approved' && item.packagePrice && item.packagePrice > 0);
          
          // Only show for free ads that are not premium, not pending, and not rejected
          if (!isFreeAd || isPremiumAd || isAdPending(item) || 
              (item.adStatus === 'rejected' || item.isFeatured === 'Rejected' || item.paymentStatus === 'rejected')) {
            return null;
          }
          
          return (
            <TouchableOpacity 
              style={[
                styles.quickViewButton,
                item.isActive && styles.activeViewButton
              ]}
              onPress={() => {
                console.log("🛒 Buy Package clicked for free ad:", item._id);
                console.log("⭐ Navigating to UpgradeFreeAdToPremium (Pricing Plans)");
                
                // Detect property type (bike or car) from ad data
                const adType = (item as any)?.adType;
                const collection = (item as any)?.collection;
                const modelType = (item as any)?.modelType;
                const category = (item as any)?.category;
                const brand = (item as any)?.brand;
                const company = (item as any)?.company;
                const title = (item as any)?.title || '';
                const description = (item as any)?.description || '';
                
                // Check if it's a bike - more comprehensive detection
                const isBike = 
                  adType === 'bike' || 
                  adType === 'newBike' ||
                  collection === 'Bike_Ads' || 
                  modelType === 'Free' ||
                  category === 'bike' ||
                  category === 'Bike' ||
                  // Check if brand/company is a bike brand
                  (brand && ['road prince', 'honda', 'yamaha', 'suzuki', 'kawasaki', 'united', 'super power', 'superstar', 'metro', 'unique', 'riverside', 'superstar', 'super power'].some(b => brand.toLowerCase().includes(b.toLowerCase()))) ||
                  // Check title/description for bike keywords
                  title.toLowerCase().includes('bike') ||
                  title.toLowerCase().includes('motorcycle') ||
                  title.toLowerCase().includes('scooter') ||
                  description.toLowerCase().includes('bike') ||
                  description.toLowerCase().includes('motorcycle');
                
                const propertyType = isBike ? 'bike' : 'car';
                console.log("📦 Property type detected:", propertyType, { 
                  adType, 
                  collection, 
                  modelType, 
                  category, 
                  brand, 
                  company,
                  title: title.substring(0, 50),
                  isBike 
                });
                
                (navigation as any).navigate('UpgradeFreeAdToPremium', { 
                  adId: item._id,
                  adData: item,
                  propertyType: propertyType // Pass property type to pricing plans
                });
              }}
              activeOpacity={0.7}
            >
              <Ionicons name="star" size={18} color={item.isActive ? COLORS.white : COLORS.primary} />
              <Text style={[
                styles.quickViewText,
                item.isActive && styles.activeViewText
              ]}>
                Buy Package
              </Text>
            </TouchableOpacity>
          );
        })()}

        {/* Buy Package button for Premium Ads - Navigate to Dealer Packages - Hidden for iOS */}
        {Platform.OS !== 'ios' && (() => {
          // Premium ad detection: Any ad with isFeatured === 'Approved' is a premium ad
          // Also check if it has packagePrice or was upgraded from free ad
          const isPremiumAd = item.isFeatured === 'Approved' || 
                             (item.adStatus === 'approved' && item.packagePrice && item.packagePrice > 0) ||
                             (item.adStatus === 'approved' && item.isPaidAd && item.paymentAmount > 0 && item.paymentAmount !== 525);
          
          // Free ad detection: ads with no payment or 525 PKR payment
          const isFreeAd = !item.isPaidAd || 
                          (item.paymentAmount === 0 || !item.paymentAmount) ||
                          (item.paymentAmount === 525);
          
          // Don't show if it's a free ad, pending, or rejected
          if (isFreeAd || !isPremiumAd || isAdPending(item) || 
              (item.adStatus === 'rejected' || item.isFeatured === 'Rejected' || item.paymentStatus === 'rejected')) {
            return null;
          }
          
          return (
            <TouchableOpacity 
              style={[
                styles.quickViewButton,
                item.isActive && styles.activeViewButton
              ]}
              onPress={() => {
                console.log("🛒 Buy Package clicked for premium ad:", item._id);
                console.log("📦 Navigating to PackagesScreen (Dealer Packages)");
                (navigation as any).navigate('PackagesScreen');
              }}
              activeOpacity={0.7}
            >
              <Ionicons name="bag" size={18} color={item.isActive ? COLORS.white : COLORS.primary} />
              <Text style={[
                styles.quickViewText,
                item.isActive && styles.activeViewText
              ]}>
                Buy Package
              </Text>
            </TouchableOpacity>
          );
        })()}

        {/* Inactive Status */}
        {!isAdPending(item) && !(item.adStatus === 'rejected' || item.isFeatured === 'Rejected' || item.paymentStatus === 'rejected') && !item.isActive && (
          <View style={[styles.statusBadge, styles.inactiveBadge]}>
            <Ionicons name="pause-circle-outline" size={16} color={COLORS.gray} />
            <Text style={[styles.statusText, styles.inactiveStatusText]}>Inactive</Text>
          </View>
        )}

        {/* Expiry Date Display: Paid Simple Package (525 PKR) */}
        {item.isPaidAd && item.expiryDate && (
          <View style={styles.badgeRow}>
            <View style={[
              styles.statusBadge, 
              { 
                backgroundColor: item.expiryStatus === 'expired' ? COLORS.error + '20' : COLORS.warning + '20', 
                borderLeftColor: item.expiryStatus === 'expired' ? COLORS.error : COLORS.warning,
                flex: 1,
                marginRight: 8,
              }
            ]}>
              <Ionicons 
                name="calendar-outline" 
                size={14} 
                color={item.expiryStatus === 'expired' ? COLORS.error : COLORS.warning} 
              />
              <Text style={[
                styles.statusText, 
                { color: item.expiryStatus === 'expired' ? COLORS.error : COLORS.warning }
              ]}>
                525 PKR Package • {item.expiryStatus === 'expired' 
                  ? `Expired ${Math.ceil((new Date().getTime() - new Date(item.expiryDate).getTime()) / (1000 * 60 * 60 * 24))}d ago`
                  : `${Math.ceil((new Date(item.expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))}d left`
                }
              </Text>
            </View>
          </View>
        )}

        {/* Expiry Date Display: Premium Featured Packages (Basic/Standard/Premium) - Only if not already shown above */}
        {!item.isPaidAd && item.featuredExpiryDate && item.isFeatured !== 'Approved' && (() => {
          const isExpired = new Date(item.featuredExpiryDate) < new Date();
          const daysDiff = Math.ceil((new Date().getTime() - new Date(item.featuredExpiryDate).getTime()) / (1000 * 60 * 60 * 24));
          const daysRemaining = Math.ceil((new Date(item.featuredExpiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
          const packageName = item.packageName || 'Premium Package';
          const expiryDate = new Date(item.featuredExpiryDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          
          return (
            <View style={styles.badgeRow}>
              <View style={[
                styles.statusBadge, 
                { 
                  backgroundColor: isExpired ? COLORS.error + '20' : COLORS.warning + '20', 
                  borderLeftColor: isExpired ? COLORS.error : COLORS.warning,
                  flex: 1,
                  marginRight: 8,
                }
              ]}>
                <Ionicons 
                  name={isExpired ? "alert-circle-outline" : "calendar-outline"} 
                  size={12} 
                  color={isExpired ? COLORS.error : COLORS.warning} 
                />
                <Text style={[
                  styles.statusText, 
                  { color: isExpired ? COLORS.error : COLORS.warning },
                  styles.compactExpiryText
                ]} numberOfLines={1}>
                  {packageName} • {isExpired 
                    ? `Expired ${daysDiff}d ago (${expiryDate})`
                    : `${daysRemaining}d left (${expiryDate})`
                  }
                </Text>
              </View>
            </View>
          );
        })()}

        {/* Expiry Date Display: Free Bikes Ads (15 days expiry) */}
        {(() => {
          const isBikeAd = (item as any)?.adType === 'bike' || (item as any)?.modelType === 'Free' || (item as any)?.collection === 'Bike_Ads'
          const isFreeBike = isBikeAd && !item.isPaidAd && !item.isFeatured && item.expiryDate
          if (!isFreeBike) return null
          
          const exp = new Date(item.expiryDate)
          const expired = exp < new Date()
          const daysDiff = Math.ceil((new Date().getTime() - exp.getTime()) / (1000 * 60 * 60 * 24))
          const daysRemaining = Math.ceil((exp.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
          
          return (
            <View style={styles.badgeRow}>
              <View style={[
                styles.statusBadge, 
                { 
                  backgroundColor: expired ? COLORS.error + '20' : COLORS.warning + '20', 
                  borderLeftColor: expired ? COLORS.error : COLORS.warning,
                  flex: 1,
                  marginRight: 8,
                }
              ]}>
                <Ionicons 
                  name="calendar-outline" 
                  size={14} 
                  color={expired ? COLORS.error : COLORS.warning} 
                />
                <Text style={[
                  styles.statusText, 
                  { color: expired ? COLORS.error : COLORS.warning }
                ]}>
                  Free Bike Ad • {expired 
                    ? `Expired ${daysDiff}d ago`
                    : `${daysRemaining}d left`
                  }
                </Text>
              </View>
            </View>
          )
        })()}

        {/* Expiry Date Display: Free Ads (30 days from dateAdded) */}
        {(() => {
          const isFree = (item as any)?.adType === 'free' || (item as any)?.category === 'free'
          const isBikeAd = (item as any)?.adType === 'bike' || (item as any)?.modelType === 'Free' || (item as any)?.collection === 'Bike_Ads'
          // Skip if it's a bike ad (already handled above)
          if (isBikeAd) return null
          const exp = getComputedExpiryDate(item)
          if (!isFree || !exp) return null
          const expired = exp < new Date()
          const daysDiff = Math.ceil((new Date().getTime() - exp.getTime()) / (1000 * 60 * 60 * 24))
          const daysRemaining = Math.ceil((exp.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
          
          return (
            <View style={styles.badgeRow}>
              <View style={[
                styles.statusBadge, 
                { 
                  backgroundColor: expired ? COLORS.error + '20' : COLORS.warning + '20', 
                  borderLeftColor: expired ? COLORS.error : COLORS.warning,
                  flex: 1,
                  marginRight: 8,
                }
              ]}>
                <Ionicons 
                  name="calendar-outline" 
                  size={14} 
                  color={expired ? COLORS.error : COLORS.warning} 
                />
                <Text style={[
                  styles.statusText, 
                  { color: expired ? COLORS.error : COLORS.warning }
                ]}>
                  Free Ad • {expired 
                    ? `Expired ${daysDiff}d ago`
                    : `${daysRemaining}d left`
                  }
                </Text>
              </View>
            </View>
          )
        })()}


        {/* Buy Now CTA for expired ads (route to appropriate packages) - Hidden for iOS */}
        {Platform.OS !== 'ios' && (() => {
          // Determine if ad is expired
          const now = new Date()
          const paidExpired = item.isPaidAd && item.expiryDate && new Date(item.expiryDate) < now
          const featuredExpired = !item.isPaidAd && item.featuredExpiryDate && new Date(item.featuredExpiryDate) < now
          const freeBikeExpired = !item.isPaidAd && !item.isFeatured && item.expiryDate && new Date(item.expiryDate) < now
          const isExpired = paidExpired || featuredExpired || freeBikeExpired
          if (!isExpired) return null
          const isBike = (item.adType || '').toLowerCase().includes('bike')
          return (
            <TouchableOpacity
              style={[styles.adActionButton, styles.primaryActionButton, { marginTop: 8 }]}
              onPress={() => (navigation as any).navigate('PackagesScreen', { screen: isBike ? 'bike' : 'car' })}
              activeOpacity={0.8}
            >
              <Ionicons name="cart" size={18} color={COLORS.white} />
              <Text style={[styles.primaryActionText, { marginLeft: 8 }]}>Buy Now</Text>
            </TouchableOpacity>
          )
        })()}

        <View style={styles.adDetails}>
          <View style={styles.adDetailItem}>
            <Ionicons name="calendar-outline" size={16} color={COLORS.darkGray} />
            <Text style={styles.adDetailText}>{item.year}</Text>
          </View>

          <View style={styles.adDetailItem}>
            <Ionicons name="speedometer-outline" size={16} color={COLORS.darkGray} />
            <Text style={styles.adDetailText}>{item.kmDriven} km</Text>
          </View>

          <View style={styles.adDetailItem}>
            <Ionicons name="location-outline" size={16} color={COLORS.darkGray} />
            <Text style={styles.adDetailText}>{item.location}</Text>
          </View>
        </View>

        {/* <View style={styles.adStats}>
          <View style={styles.adStatItem}>
            <Ionicons name="eye-outline" size={16} color={COLORS.darkGray} />
            <Text style={styles.adStatText}>{item.views} views</Text>
          </View>
          <View style={styles.adStatItem}>
            <Ionicons name="heart-outline" size={16} color={COLORS.darkGray} />
            <Text style={styles.adStatText}>{item.favorites} favorites</Text>
          </View>
          <View style={styles.adStatItem}>
            <Ionicons name="chatbubble-outline" size={16} color={COLORS.darkGray} />
            <Text style={styles.adStatText}>{item.inquiries} inquiries</Text>
          </View>
        </View> */}

        <View style={styles.adFooter}>
        <Text style={styles.adDate}>
  Posted on {new Date(item.dateAdded).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })}
</Text>

{/* Status Badge - Check expiry first, then Active/Inactive */}
{(() => {
  // Check if ad is expired
  const now = new Date();
  const paidExpired = item.isPaidAd && item.expiryDate && new Date(item.expiryDate) < now;
  const featuredExpired = !item.isPaidAd && item.featuredExpiryDate && new Date(item.featuredExpiryDate) < now;
  // Free bikes ads expiry check
  const isBikeAd = (item as any)?.adType === 'bike' || (item as any)?.modelType === 'Free' || (item as any)?.collection === 'Bike_Ads';
  const freeBikeExpired = isBikeAd && !item.isPaidAd && !item.isFeatured && item.expiryDate && new Date(item.expiryDate) < now;
  const freeExpired = (() => {
    const isFree = (item as any)?.adType === 'free' || (item as any)?.category === 'free';
    if (!isFree || isBikeAd) return false; // Skip bike ads here, already handled above
    const exp = getComputedExpiryDate(item);
    return exp ? exp < now : false;
  })();
  const isExpired = paidExpired || featuredExpired || freeBikeExpired || freeExpired;
  
  if (isExpired) {
    return (
      <View style={[styles.adStatusBadge, styles.expiredStatusBadge]}>
        <Text style={[styles.adStatusText, styles.expiredStatusText]}>
          Expired
        </Text>
      </View>
    );
  }
  
  // For non-expired ads, show Active/Inactive based on isActive
  return (
    <View
      style={[
        styles.adStatusBadge,
        item.isActive ? styles.activeStatusBadge : styles.inactiveStatusBadge,
      ]}
    >
      <Text
        style={[
          styles.adStatusText,
          item.isActive ? styles.activeStatusText : styles.inactiveStatusText,
        ]}
      >
        {item.isActive ? "Active" : "Inactive"}
      </Text>
    </View>
  );
})()}

        </View>

        <View style={styles.adActions}>
          {/* Debug logging for all ads */}
          {(() => {
            const isRejected = item.adStatus === 'rejected' || item.isFeatured === 'Rejected' || item.paymentStatus === 'rejected';
            const isPending = isAdPending(item);
            const isDeletedByAdmin = item.isDeleted === true;
            console.log(`🔍 Ad ${item._id} - isRejected: ${isRejected}, isPending: ${isPending}, isDeleted: ${isDeletedByAdmin}, adStatus: ${item.adStatus}, isFeatured: ${item.isFeatured}, paymentStatus: ${item.paymentStatus}`);
            return null;
          })()}
          
          {/* 🗑️ Show "Deleted by Admin" message instead of action buttons */}
          {item.isDeleted === true ? (
            <View style={[styles.adActionButton, { flex: 1, backgroundColor: '#8B0000' + '15', borderColor: '#8B0000', justifyContent: 'center' }]}>
              <Ionicons name="alert-circle-outline" size={18} color="#8B0000" />
              <Text style={[styles.adActionText, { color: '#8B0000', marginLeft: 6, fontWeight: '600' }]}>
                This ad was deleted by admin
              </Text>
            </View>
          ) : (
            /* ENABLE Edit and Delete buttons for non-deleted ads */
          <>
            {/* Primary Action - Edit - ALWAYS ENABLED */}
            <TouchableOpacity 
              style={[styles.adActionButton, styles.simpleButton]} 
              onPress={() => {
                console.log(`✅ Edit button pressed for ad ${item._id} - Status: ${item.adStatus}, isPending: ${isAdPending(item)}`);
                handleEditAd(item._id);
              }}
            >
              <Ionicons 
                name="create-outline" 
                size={18} 
                color={COLORS.black} 
              />
              <Text style={[styles.adActionText, styles.simpleButtonText]}>Edit</Text>
            </TouchableOpacity>
            
            {/* Secondary Action - Toggle Status - Only for non-pending, non-rejected ads */}
            {!isAdPending(item) && !(item.adStatus === 'rejected' || item.isFeatured === 'Rejected' || item.paymentStatus === 'rejected') ? (
              <TouchableOpacity
                style={[styles.adActionButton, styles.simpleButton]}
                onPress={() => {
                  const isCurrentlyActive = item.isActive || item.adStatus === 'approved' || item.isFeatured === 'Approved' || item.paymentStatus === 'verified';
                  Alert.alert(
                    isCurrentlyActive ? "Deactivate Ad" : "Activate Ad",
                    isCurrentlyActive 
                      ? "Are you sure you want to deactivate this ad? It will no longer be visible to buyers."
                      : "Are you sure you want to activate this ad? It will be visible to buyers.",
                    [
                      {
                        text: "Cancel",
                        style: "cancel",
                      },
                      {
                        text: isCurrentlyActive ? "Deactivate" : "Activate",
                        onPress: () => toggleAdStatus(item._id),
                        style: isCurrentlyActive ? "destructive" : "default",
                      },
                    ]
                  );
                }}
              >
                <Ionicons
                  name={(item.isActive || item.adStatus === 'approved' || item.isFeatured === 'Approved' || item.paymentStatus === 'verified') ? "eye-off-outline" : "eye-outline"}
                  size={18}
                  color={COLORS.black}
                />
                <Text style={[styles.adActionText, styles.simpleButtonText]} numberOfLines={1}>
                  {(item.isActive || item.adStatus === 'approved' || item.isFeatured === 'Approved' || item.paymentStatus === 'verified') ? "Deactivate" : "Activate"}
                </Text>
              </TouchableOpacity>
            ) : (
              /* For pending or rejected ads, show disabled activate button */
              <TouchableOpacity style={[styles.adActionButton, styles.disabledButton]} disabled>
                <Ionicons name="eye-off-outline" size={16} color={COLORS.gray} />
                <Text style={[styles.adActionText, styles.disabledText]}>
                  {isAdPending(item) ? "Awaiting Approval" : "Activate"}
                </Text>
              </TouchableOpacity>
            )}
            
            {/* Danger Action - Delete - ALWAYS ENABLED */}
            <TouchableOpacity 
              style={[styles.adActionButton, styles.simpleButton]} 
              onPress={() => {
                console.log(`✅ Delete button pressed for ad ${item._id} - Status: ${item.adStatus}, isPending: ${isAdPending(item)}`);
                handleDeleteAd(item._id);
              }}
            >
              <Ionicons 
                name="trash-outline" 
                size={18} 
                color={COLORS.black} 
              />
              <Text style={[styles.adActionText, styles.simpleButtonText]}>Delete</Text>
            </TouchableOpacity>
          </>
          )}
        </View>
      </View>
    </View>
  )

  const handleCreateAd = async () => {
    console.log("🚀 handleCreateAd called");
    try {
      if (!userData || !userData.userId) {
        console.log("❌ No user available to fetch packages");
        (navigation as any).navigate("PostCarAdFeatured", { isFreeAd: true });
        return;
      }
      console.log("📦 Fetching packages for user:", userData.userId);
      // Get user's active packages to pass package data
      const response = await fetch(`${API_URL}/mobile/user-mobile-packages/${userData.userId}`);
      const data = await response.json();
      
      console.log("📦 Packages response:", data);
      
      if (data.success && data.packages && data.packages.length > 0) {
        // Find the first active package (preferably car package)
        const activePackage = data.packages.find((pkg: any) => 
          pkg.isActive && pkg.package && pkg.package.type === 'car'
        ) || data.packages.find((pkg: any) => pkg.isActive);
        
        console.log("📦 Active package found:", activePackage);
        
        if (activePackage && activePackage.package) {
          console.log("📦 Found active package:", activePackage.package);
          (navigation as any).navigate("PostCarAdFeatured", {
            selectedPackage: activePackage.package
          });
        } else {
          console.log("⚠️ No active package found, navigating without package data");
          (navigation as any).navigate("PostCarAdFeatured", { isFreeAd: true });
        }
      } else {
        console.log("⚠️ No packages found, navigating without package data");
        (navigation as any).navigate("PostCarAdFeatured", { isFreeAd: true });
      }
    } catch (error) {
      console.error("❌ Error fetching packages:", error);
      (navigation as any).navigate("PostCarAdFeatured", { isFreeAd: true });
    }
  }

  const handleCreateFreeAd = () => {
    console.log("🆓 Creating free ad");
    (navigation as any).navigate("PostCarAdFeatured", { isFreeAd: true });
  }

  const refreshAds = async () => {
    if (userData && userData.userId) {
      try {
        setLoading(true);
        // Use safeApiCall for automatic retry and better error handling
        const { safeApiCall } = require('../utils/apiUtils');
        const result = await safeApiCall<any[]>(`${API_URL}/all_user_ads/${userData.userId}`, {}, 2);
        
        if (result.success && result.data) {
          const data = await safeParseAdsResponse({ ok: true, json: async () => result.data } as Response);
          setMyAds(data);
        } else {
          console.error("❌ Failed to refresh ads:", result.error);
        }
        // Also refresh package info
        await fetchUserPackageInfo();
      } catch (error) {
        console.error("Error refreshing ads:", error);
      } finally {
        setLoading(false);
      }
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top, Platform.OS === 'ios' ? 0 : 8) }]}>
        {/* iOS Back Button - Required by Apple Review Guidelines */}
        {Platform.OS === 'ios' && (
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="arrow-back" size={24} color={COLORS.black} />
          </TouchableOpacity>
        )}
        <Text style={styles.headerTitle}>My Ads</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity style={styles.refreshButton} onPress={refreshAds}>
            <Ionicons name="refresh" size={20} color={COLORS.primary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.createButton} onPress={handleCreateAd}>
            <Ionicons name="add" size={20} color={COLORS.white} />
            <Text style={styles.createButtonText}>Create Ad</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.statsContainer}>
  <View style={styles.statBox}>
    <Text style={styles.statNumber}>
      {myAds.filter((ad) => 
        (ad.isActive && !isAdPending(ad)) || 
        (ad.isActive && (ad.adStatus === 'approved' || ad.isFeatured === 'Approved' || ad.paymentStatus === 'verified'))
      ).length}
    </Text>
    <Text style={styles.statLabel}>Active Ads</Text>
  </View>
  
  <View style={styles.statBox}>
    <Text style={styles.statNumber}>
      {myAds.filter((ad) => 
        !ad.isActive && !isAdPending(ad)
      ).length}
    </Text>
    <Text style={styles.statLabel}>Inactive Ads</Text>
  </View>
  
  <View style={styles.statBox}>
    <Text style={styles.statNumber}>
      {myAds.filter((ad) => 
        isAdPending(ad) && 
        ad.adStatus !== 'approved' && 
        ad.isFeatured !== 'Approved' && 
        ad.paymentStatus !== 'verified'
      ).length}
    </Text>
    <Text style={styles.statLabel}>Pending Approval</Text>
  </View>
  
  {/* Boosts Remaining Stat */}
  {userPackageInfo && (
    <View style={[styles.statBox, styles.boostStatBox]}>
      <View style={styles.boostIconRow}>
        <Ionicons name="rocket" size={18} color={COLORS.primary} />
        <Text style={[styles.statNumber, styles.boostStatNumber]}>
          {userPackageInfo.usage?.boostersRemaining ?? 0}
        </Text>
      </View>
      <Text style={styles.statLabel}>Boosts Left</Text>
    </View>
  )}
</View>


      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "active" && styles.activeTab]}
          onPress={() => setActiveTab("active")}
        >
          <Text style={[styles.tabText, activeTab === "active" && styles.activeTabText]}>Active</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === "pending" && styles.activeTab]}
          onPress={() => setActiveTab("pending")}
        >
          <Text style={[styles.tabText, activeTab === "pending" && styles.activeTabText]}>Pending</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === "inactive" && styles.activeTab]}
          onPress={() => setActiveTab("inactive")}
        >
          <Text style={[styles.tabText, activeTab === "inactive" && styles.activeTabText]}>Inactive</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === "expired" && styles.activeTab]}
          onPress={() => setActiveTab("expired")}
        >
          <Text style={[styles.tabText, activeTab === "expired" && styles.activeTabText]}>Expired</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <BlogSkeleton />
      ) : (
        <FlatList
          data={filteredAds}
          renderItem={renderAdItem}
          keyExtractor={(item, index) => {
            // Safely convert _id to string, handling MongoDB ObjectIds
            try {
              const rawId = item._id || item.id;
              if (!rawId) {
                return `ad-${index}`;
              }
              const safeId = safeIdToString(rawId);
              // Validate ID format
              if (!safeId || safeId === '[object Object]' || safeId.length < 5) {
                return `ad-${index}`;
              }
              return safeId;
            } catch (error) {
              console.warn(`⚠️ Failed to extract key for ad at index ${index}:`, error);
              return `ad-${index}`;
            }
          }}
          contentContainerStyle={[
            styles.listContent,
            {
              paddingBottom: Platform.OS === 'ios' 
                ? Math.max(insets.bottom, 20) + 80
                : Math.max(insets.bottom, 10) + 100,
            }
          ]}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="car-outline" size={60} color={COLORS.lightGray} />
              <Text style={styles.emptyText}>
                {activeTab === "pending" ? "No pending ads" : `No ${activeTab} ads`}
              </Text>
              {activeTab !== "pending" && (
                <TouchableOpacity
                  style={styles.createAdButton}
                  onPress={handleCreateAd}
                >
                  <Text style={styles.createAdButtonText}>Create New Ad</Text>
                </TouchableOpacity>
              )}
            </View>
          }
        />
      )}
    </SafeAreaView>
  )
}


const styles = createResponsiveStyleSheet({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
    borderRadius: 8,
    backgroundColor: COLORS.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerButtons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  refreshButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: COLORS.lightGray,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.black,
  },
  createButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.primary,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  createButtonText: {
    color: COLORS.white,
    fontWeight: "600",
    marginLeft: 4,
  },
  statsContainer: {
    flexDirection: "row",
    paddingHorizontal: 12,
    paddingVertical: 16,
    backgroundColor: COLORS.lightGray,
    gap: 8,
  },
  statBox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 8,
    backgroundColor: COLORS.white,
    borderRadius: 10,
    marginHorizontal: 4,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.primary,
    marginBottom: 6,
  },
  statLabel: {
    fontSize: 11,
    color: COLORS.darkGray,
    fontWeight: "500",
    textAlign: "center",
  },
  tabsContainer: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
    paddingHorizontal: 4,
    backgroundColor: COLORS.white,
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 8,
    alignItems: "center",
    marginHorizontal: 4,
    borderRadius: 8,
    marginBottom: 8,
  },
  activeTab: {
    borderBottomWidth: 3,
    borderBottomColor: COLORS.primary,
    backgroundColor: COLORS.primary + '08',
  },
  tabText: {
    fontSize: 14,
    color: COLORS.darkGray,
    fontWeight: "500",
  },
  activeTabText: {
    color: COLORS.primary,
    fontWeight: "700",
    fontSize: 15,
  },
  listContent: {
    padding: 12,
    flexGrow: 1,
  },
  adCard: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    marginBottom: 12,
    marginHorizontal: 4,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E8E8E8",
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    overflow: 'hidden',
  },
  adImage: {
    width: "100%",
    height: 140,
    resizeMode: "cover",
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 50,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  adContent: {
    padding: 12,
  },
  adHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  adTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.black,
    flex: 1,
    marginRight: 8,
    lineHeight: 20,
    letterSpacing: 0.1,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 4,
  },
  adPrice: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.primary,
    flexShrink: 0,
  },
  boostButtonCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary + '15',
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    gap: 4,
  },
  boostButtonTextCompact: {
    color: COLORS.primary,
    fontSize: 11,
    fontWeight: '700',
  },
  adDetails: {
    flexDirection: "row",
    marginBottom: 8,
    flexWrap: "wrap",
    gap: 8,
  },
  adDetailItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 12,
    marginBottom: 4,
  },
  adDetailText: {
    fontSize: 12,
    color: COLORS.darkGray,
    marginLeft: 4,
  },
  adStats: {
    flexDirection: "row",
    marginBottom: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray,
  },
  adStatItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 16,
  },
  adStatText: {
    fontSize: 12,
    color: COLORS.darkGray,
    marginLeft: 4,
  },
  adFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  adDate: {
    fontSize: 12,
    color: COLORS.darkGray,
  },
  adStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  activeStatusBadge: {
    backgroundColor: "rgba(0, 200, 83, 0.1)",
  },
  inactiveStatusBadge: {
    backgroundColor: "rgba(255, 59, 48, 0.1)",
  },
  expiredStatusBadge: {
    backgroundColor: "rgba(255, 0, 0, 0.15)",
    borderWidth: 1,
    borderColor: COLORS.error + '40',
  },
  adStatusText: {
    fontSize: 12,
    fontWeight: "500",
  },
  expiredStatusText: {
    color: COLORS.error,
    fontWeight: "600",
  },
  adActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray,
    flexWrap: "wrap",
    gap: 8,
  },
  adActionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    flex: 1,
    minWidth: 80,
  },
  adActionText: {
    fontSize: 12,
    color: COLORS.primary,
    marginLeft: 4,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.darkGray,
    marginTop: 16,
    marginBottom: 24,
  },
  createAdButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  createAdButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "600",
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.lightGray,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginTop: 4,
    marginBottom: 4,
    borderLeftWidth: 3,
    gap: 5,
    minWidth: 200,
  },
  activeBadge: {
    backgroundColor: COLORS.success + '20',
  },
  inactiveBadge: {
    backgroundColor: COLORS.gray + '20',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.warning,
    marginLeft: 3,
  },
  compactExpiryText: {
    fontSize: 10,
    marginLeft: 4,
    flexShrink: 1,
  },
  activeStatusText: {
    color: COLORS.success,
  },
  inactiveStatusText: {
    color: COLORS.gray,
  },
  disabledButton: {
    opacity: 0.5,
  },
  disabledText: {
    color: COLORS.gray,
  },
  pendingCard: {
    opacity: 0.8,
    borderColor: COLORS.warning,
    borderWidth: 1,
  },
  viewOnlyIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.lightGray,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  viewOnlyText: {
    fontSize: 11,
    color: COLORS.gray,
    marginLeft: 4,
    fontStyle: 'italic',
  },
  // Enhanced Action Button Styles
  primaryActionButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    flex: 1,
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryActionText: {
    color: COLORS.white,
    fontWeight: '600',
    fontSize: 13,
  },
  activateButton: {
    backgroundColor: COLORS.success + '20',
    borderWidth: 1,
    borderColor: COLORS.success,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    flex: 1,
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deactivateButton: {
    backgroundColor: COLORS.error + '20',
    borderWidth: 1,
    borderColor: COLORS.error,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    flex: 1,
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dangerActionButton: {
    backgroundColor: COLORS.error + '20',
    borderWidth: 1,
    borderColor: COLORS.error,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickViewButton: {
    backgroundColor: COLORS.primary + '15',
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignSelf: 'flex-start',
    marginTop: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    shadowColor: COLORS.primary,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  quickViewText: {
    color: COLORS.primary,
    fontWeight: '700',
    fontSize: 12,
    marginLeft: 4,
  },
  // Enhanced styles for active ads
  activeViewButton: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  activeViewText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 14,
  },
  // Clickable indicator styles
  clickableIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: COLORS.success + '20',
    borderRadius: 4,
  },
  clickableText: {
    fontSize: 10,
    color: COLORS.success,
    fontWeight: '600',
    marginLeft: 2,
  },
  // Expiry Date Styles
  expiryContainer: {
    marginTop: 8,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  activeExpiryContainer: {
    backgroundColor: '#fff3cd',
    borderColor: COLORS.warning,
  },
  expiredContainer: {
    backgroundColor: '#f8d7da',
    borderColor: COLORS.error,
  },
  expiryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  expiryTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  expiryDateText: {
    fontSize: 12,
    color: COLORS.darkGray,
    marginBottom: 2,
  },
  expiryStatusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  // Boosted Badge Styles
  boostedBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    gap: 4,
    shadowColor: COLORS.primary,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  boostedBadgeText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  optionsButton: {
    padding: 4,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
  },
  // Boost Count Badge Styles
  boostCountBadge: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    width: 22,
    height: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  boostCountText: {
    color: COLORS.primary,
    fontSize: 11,
    fontWeight: '700',
  },
  // Boost Stat Box Styles
  boostStatBox: {
    backgroundColor: COLORS.primary + '10',
    borderWidth: 1,
    borderColor: COLORS.primary + '30',
  },
  boostIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  boostStatNumber: {
    color: COLORS.primary,
    marginLeft: 0,
  },
  simpleButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    flex: 1,
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 80,
    maxWidth: 120,
  },
  simpleButtonText: {
    color: COLORS.black,
    fontWeight: '500',
    fontSize: 13,
  },
})

export default MyAdsScreen
