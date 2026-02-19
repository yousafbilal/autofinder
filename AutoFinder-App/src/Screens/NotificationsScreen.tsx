import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NavigationProp } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { io, Socket } from 'socket.io-client';
import { API_URL } from '../../config';
import { COLORS } from '../constants/colors';

interface Notification {
  _id: string;
  userId: string;
  type: 'service_approved' | 'service_updated' | 'service_deleted' | 'new_message' | 'general';
  title: string;
  message: string;
  data?: any;
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
}

const NotificationsScreen = () => {
  const navigation = useNavigation<NavigationProp<any>>();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const socketRef = useRef<Socket | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [navigating, setNavigating] = useState(false);
  const [showClearModal, setShowClearModal] = useState(false);

  // Helper function to map backend notification types to frontend types
  const mapNotificationType = (backendType: string): 'service_approved' | 'service_updated' | 'service_deleted' | 'new_message' | 'general' => {
    switch (backendType) {
      case 'welcome':
        return 'general';
      case 'new_message':
        return 'new_message';
      case 'premium_ad_status_updated':
      case 'bike_ad_status_updated':
      case 'free_ad_status_updated':
      case 'new_car_status_updated':
      case 'new_bike_status_updated':
      case 'list_it_for_you_status_updated':
      case 'featured_ad_status_updated':
        return 'service_approved';
      case 'ad_status':
        return 'service_updated';
      case 'request_status':
        return 'service_deleted';
      case 'ad_created':
      case 'request_created':
      case 'buy_car_request_created':
        return 'general';
      default:
        return 'general';
    }
  };

  // Get user ID from AsyncStorage
  useEffect(() => {
    const getUserData = async () => {
      try {
        const userData = await AsyncStorage.getItem('user');
        if (userData) {
          const parsed = JSON.parse(userData);
          const uid = parsed.userId || parsed._id;
          setUserId(uid);
          if (!uid) setLoading(false);
        } else {
          setLoading(false);
        }
      } catch (error) {
        console.error('Error getting user data:', error);
        setLoading(false);
      }
    };
    getUserData();
  }, []);

  // Fetch notifications from API when userId is available (dynamic, no static data)
  useEffect(() => {
    if (userId) fetchNotifications();
  }, [userId]);

  // Setup Socket.io connection
  useEffect(() => {
    if (!userId) return;

    // Connect to Socket.io
    socketRef.current = io(API_URL, {
      transports: ['websocket'],
    });

    const socket = socketRef.current;

    // Connection events
    socket.on('connect', () => {
      console.log('🔌 Connected to notifications socket');
      // Join user-specific room
      socket.emit('joinNotifications', { userId });
    });

    socket.on('disconnect', () => {
      console.log('🔌 Disconnected from notifications socket');
    });

    // Real-time notification events
    socket.on('serviceApproved', (data) => {
      console.log('✅ Service approved notification:', data);
      addNotification({
        type: 'service_approved',
        title: 'Ad Approved',
        message: data.message || 'Your car ad has been approved and is now live!',
        data: data,
      });
    });

    socket.on('serviceUpdated', (data) => {
      console.log('🔄 Service updated notification:', data);
      addNotification({
        type: 'service_updated',
        title: 'Ad Updated',
        message: data.message || 'Your ad has been updated by admin',
        data: data,
      });
    });

    socket.on('serviceDeleted', (data) => {
      console.log('❌ Service deleted notification:', data);
      addNotification({
        type: 'service_deleted',
        title: 'Ad Rejected',
        message: data.message || 'Your ad has been rejected. Please check the reason.',
        data: data,
      });
    });

    socket.on('newMessage', (data) => {
      console.log('💬 New message notification:', data);
      addNotification({
        type: 'new_message',
        title: 'New Message',
        message: data.message || `New message from ${data.senderName || 'User'}`,
        data: data,
      });
    });

    socket.on('generalNotification', (data) => {
      console.log('📢 General notification:', data);
      addNotification({
        type: 'general',
        title: data.title || 'Notification',
        message: data.message || 'You have a new notification',
        data: data,
      });
    });

    // Add more realistic notification events
    socket.on('adStatusChanged', (data) => {
      console.log('📋 Ad status changed:', data);
      addNotification({
        type: 'service_approved',
        title: 'Ad Status Updated',
        message: `Your ${data.adType || 'ad'} status has been changed to ${data.status || 'Active'}`,
        data: data,
      });
    });

    socket.on('paymentReceived', (data) => {
      console.log('💰 Payment received:', data);
      addNotification({
        type: 'general',
        title: 'Payment Received',
        message: `Payment of Rs. ${data.amount || '0'} received for your premium ad`,
        data: data,
      });
    });

    socket.on('inspectionScheduled', (data) => {
      console.log('🔍 Inspection scheduled:', data);
      addNotification({
        type: 'general',
        title: 'Inspection Scheduled',
        message: `Car inspection has been scheduled for ${data.date || 'your car'}`,
        data: data,
      });
    });

    // Cleanup on unmount
    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [userId]);

  // Add new notification to the list
  const addNotification = (notificationData: Partial<Notification>) => {
    const newNotification: Notification = {
      _id: Date.now().toString(),
      userId: userId || '',
      type: notificationData.type || 'general',
      title: notificationData.title || 'Notification',
      message: notificationData.message || '',
      data: notificationData.data,
      isRead: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setNotifications(prev => [newNotification, ...prev]);
    setUnreadCount(prev => prev + 1);
  };

  // Simulate real-time notifications for testing
  const simulateRealTimeNotifications = () => {
    const notificationTypes = [
      {
        type: 'service_approved' as const,
        title: 'Ad Approved',
        message: 'Your Toyota Corolla 2020 ad has been approved!',
      },
      {
        type: 'new_message' as const,
        title: 'New Message',
        message: 'Ahmed sent you a message about your car',
      },
      {
        type: 'general' as const,
        title: 'Payment Received',
        message: 'Payment of Rs. 5,000 received for premium ad',
      },
      {
        type: 'service_updated' as const,
        title: 'Ad Updated',
        message: 'Your ad has been updated with new images',
      },
    ];

    // Add a random notification every 10 seconds for testing
    const interval = setInterval(() => {
      const randomNotification = notificationTypes[Math.floor(Math.random() * notificationTypes.length)];
      addNotification(randomNotification);
    }, 10000); // Every 10 seconds

    // Clean up after 2 minutes
    setTimeout(() => {
      clearInterval(interval);
    }, 120000);

    return () => clearInterval(interval);
  };

  // No static/sample notifications - all from API

  // Fetch notifications from API (optional)
  const fetchNotifications = async () => {
    if (!userId) {
      console.log('❌ No userId available for fetching notifications');
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      console.log('🔄 Fetching notifications for userId:', userId);
      
      // Try the notifications endpoint first
      let response = await fetch(`${API_URL}/notifications/${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log('📡 Notifications API response status:', response.status);

      if (response.ok) {
        const contentType = response.headers.get('content-type');
        const data = (contentType && contentType.includes('application/json'))
          ? await response.json()
          : [];
        const list = Array.isArray(data) ? data : [];
        console.log('✅ Notifications fetched successfully:', list.length);
        
        // Transform backend notifications to match frontend format
        const transformedNotifications: Notification[] = list.map((notif: any) => ({
          _id: notif._id,
          userId: notif.userId,
          type: mapNotificationType(notif.type),
          title: notif.title,
          message: notif.message,
          isRead: notif.read,
          createdAt: notif.dateAdded,
          updatedAt: notif.dateAdded,
          data: {
            adId: notif.adId,
            adModel: notif.adModel,
            adTitle: notif.adTitle,
            collection: notif.collection,
            status: notif.status,
          },
        }));
        
        console.log('✅ Transformed notifications:', transformedNotifications);
        setNotifications(transformedNotifications);
        setUnreadCount(transformedNotifications.filter(n => !n.isRead).length);
      } else {
        console.log('❌ Notifications API returned non-OK, showing empty list');
        setNotifications([]);
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('❌ Error fetching notifications:', error);
      setNotifications([]);
      setUnreadCount(0);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Mark notification as read
  const markAsRead = async (notificationId: string) => {
    try {
      const response = await fetch(`${API_URL}/notifications/${notificationId}/read`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        setNotifications(prev =>
          prev.map(notif =>
            notif._id === notificationId ? { ...notif, isRead: true } : notif
          )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      const response = await fetch(`${API_URL}/notifications/${userId}/read-all`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        setNotifications(prev =>
          prev.map(notif => ({ ...notif, isRead: true }))
        );
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  // Clear all notifications
  const clearAllNotifications = async () => {
    try {
      const response = await fetch(`${API_URL}/notifications/${userId}/clear-all`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        setNotifications([]);
        setUnreadCount(0);
        setShowClearModal(false);
        console.log('✅ All notifications cleared');
      } else {
        // If API doesn't exist, clear locally
        setNotifications([]);
        setUnreadCount(0);
        setShowClearModal(false);
        console.log('✅ Notifications cleared locally');
      }
    } catch (error) {
      console.error('Error clearing notifications:', error);
      // Clear locally on error
      setNotifications([]);
      setUnreadCount(0);
      setShowClearModal(false);
    }
  };

  // Delete single notification
  const deleteNotification = async (notificationId: string) => {
    try {
      const response = await fetch(`${API_URL}/notifications/${notificationId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        setNotifications(prev => prev.filter(notif => notif._id !== notificationId));
        setUnreadCount(prev => Math.max(0, prev - 1));
        console.log('✅ Notification deleted');
      } else {
        // If API doesn't exist, delete locally
        setNotifications(prev => prev.filter(notif => notif._id !== notificationId));
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
      // Delete locally on error
      setNotifications(prev => prev.filter(notif => notif._id !== notificationId));
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
  };

  // Handle notification press
  const handleNotificationPress = async (notification: Notification) => {
    if (navigating) return; // Prevent multiple clicks
    
    setNavigating(true);
    
    if (!notification.isRead) {
      markAsRead(notification._id);
    }

    // Navigate based on notification type and data
    const notificationData = notification.data as any;
    
    try {
      switch (notification.type) {
        case 'service_approved':
        case 'service_updated':
        case 'service_deleted':
          // If we have adId, fetch complete property data and navigate
          if (notificationData?.adId) {
            const adModel = notificationData.adModel;
            let propertyData = null;
            
            // Fetch complete property data based on adModel
            switch (adModel) {
              case 'Featured_Ads':
              case 'Free_Ads':
                console.log('🔄 Fetching car data for:', notificationData.adId);
                const carResponse = await fetch(`${API_URL}/ads/${notificationData.adId}`);
                if (carResponse.ok) {
                  propertyData = await carResponse.json();
                  console.log('✅ Car data fetched:', propertyData);
                  navigation.navigate('CarDetails', { 
                    carDetails: propertyData
                  });
                } else {
                  console.log('❌ Car fetch failed, going to MyAds');
                  navigation.navigate('MyAds');
                }
                break;
                
              case 'Bike_Ads':
                console.log('🔄 Fetching bike data for:', notificationData.adId);
                const bikeResponse = await fetch(`${API_URL}/bike-ads/${notificationData.adId}`);
                if (bikeResponse.ok) {
                  propertyData = await bikeResponse.json();
                  console.log('✅ Bike data fetched:', propertyData);
                  navigation.navigate('BikeDetails', { 
                    bikeDetails: propertyData
                  });
                } else {
                  console.log('❌ Bike fetch failed, going to MyAds');
                  navigation.navigate('MyAds');
                }
                break;
                
              case 'AutoStoreAd':
                console.log('🔄 Fetching auto parts data for:', notificationData.adId);
                const autoPartsResponse = await fetch(`${API_URL}/auto-store/${notificationData.adId}`);
                if (autoPartsResponse.ok) {
                  propertyData = await autoPartsResponse.json();
                  console.log('✅ Auto parts data fetched:', propertyData);
                  navigation.navigate('AutoPartsDetailsScreen', { 
                    autoPartsDetails: propertyData
                  });
                } else {
                  console.log('❌ Auto parts fetch failed, going to MyAds');
                  navigation.navigate('MyAds');
                }
                break;
                
              default:
                navigation.navigate('MyAds');
                break;
            }
          } else {
            navigation.navigate('MyAds');
          }
          break;
          
        case 'new_message':
          navigation.navigate('HomeTabs', { screen: 'Chat' });
          break;
          
        default:
          // General notification - no specific navigation
          break;
      }
    } catch (error) {
      console.error('❌ Error fetching property data:', error);
      // Fallback to MyAds on error
      navigation.navigate('MyAds');
    } finally {
      setNavigating(false);
    }
  };

  // Get notification icon based on type
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'service_approved':
        return 'checkmark-circle';
      case 'service_updated':
        return 'refresh-circle';
      case 'service_deleted':
        return 'trash';
      case 'new_message':
        return 'chatbubble';
      default:
        return 'notifications';
    }
  };

  // Get notification color based on type
  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'service_approved':
        return '#4CAF50';
      case 'service_updated':
        return '#2196F3';
      case 'service_deleted':
        return '#F44336';
      case 'new_message':
        return '#FF9800';
      default:
        return COLORS.primary;
    }
  };

  // Format time
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  // Render notification item
  const renderNotificationItem = ({ item }: { item: Notification }) => (
    <TouchableOpacity
      style={[
        styles.notificationItem,
        !item.isRead && styles.unreadNotification,
      ]}
      onPress={() => handleNotificationPress(item)}
      onLongPress={() => {
        Alert.alert(
          'Delete Notification',
          'Are you sure you want to delete this notification?',
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Delete', 
              style: 'destructive',
              onPress: () => deleteNotification(item._id)
            }
          ]
        );
      }}
      activeOpacity={0.7}
    >
      <View style={styles.notificationContent}>
        <View style={[
          styles.iconContainer,
          { backgroundColor: getNotificationColor(item.type) + '15' }
        ]}>
          <Ionicons
            name={getNotificationIcon(item.type) as any}
            size={24}
            color={getNotificationColor(item.type)}
          />
        </View>
        <View style={styles.textContainer}>
          <Text style={[
            styles.title,
            !item.isRead && styles.unreadText
          ]}>
            {item.title}
          </Text>
          <Text style={styles.message} numberOfLines={2}>
            {item.message}
          </Text>
          <Text style={styles.time}>
            {formatTime(item.createdAt)}
          </Text>
        </View>
        {!item.isRead && <View style={styles.unreadDot} />}
      </View>
    </TouchableOpacity>
  );

  // Refetch notifications when screen is focused (dynamic updates)
  useFocusEffect(
    React.useCallback(() => {
      if (userId) fetchNotifications();
    }, [userId])
  );

  // Pull to refresh
  const onRefresh = () => {
    setRefreshing(true);
    fetchNotifications();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading notifications...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <View style={styles.headerButtons}>
          {notifications.length > 0 && (
            <TouchableOpacity
              style={styles.clearButton}
              onPress={() => setShowClearModal(true)}
            >
              <Text style={styles.clearButtonText}>Clear All</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Notifications List */}
      <FlatList
        data={notifications}
        keyExtractor={(item, index) => {
          try {
            const id = item._id;
            if (id != null && typeof id === 'string' && id !== '[object Object]' && id.length > 5) return `notif-${id}-${index}`;
            if (id != null && typeof id === 'object' && id.toString && typeof id.toString === 'function') {
              const s = String(id.toString());
              if (s && s !== '[object Object]' && s.length > 5) return `notif-${s}-${index}`;
            }
            return `notif-${index}`;
          } catch (_) {
            return `notif-${index}`;
          }
        }}
        renderItem={renderNotificationItem}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[COLORS.primary]}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="notifications-outline" size={64} color="#ccc" />
            <Text style={styles.emptyTitle}>No notifications</Text>
            <Text style={styles.emptySubtitle}>
              You'll see notifications here when you receive them
            </Text>
          </View>
        }
        contentContainerStyle={styles.listContainer}
      />

      {/* Clear All Modal */}
      <Modal
        visible={showClearModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowClearModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Clear All Notifications</Text>
            <Text style={styles.modalMessage}>
              Are you sure you want to delete all notifications? This action cannot be undone.
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setShowClearModal(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalConfirmButton}
                onPress={clearAllNotifications}
              >
                <Text style={styles.modalConfirmText}>Clear All</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
    minHeight: 80,
    paddingTop: 30,
  },
  backButton: {
    padding: 12,
    marginRight: 14,
    marginTop: 4,
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.black,
    marginTop: 4,
    textAlign: 'center',
  },
  markAllButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    marginTop: 4,
  },
  markAllText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  listContainer: {
    paddingHorizontal: 8,
    paddingVertical: 12,
    paddingBottom: 16,
  },
  notificationItem: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 8,
    marginHorizontal: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
    minHeight: 70,
  },
  unreadNotification: {
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primary,
  },
  notificationContent: {
    flexDirection: 'row',
    padding: 12,
    alignItems: 'center',
    minHeight: 60,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 0,
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingTop: 0,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.black,
    marginBottom: 3,
    lineHeight: 18,
  },
  unreadText: {
    fontWeight: 'bold',
  },
  message: {
    fontSize: 12,
    color: '#666',
    lineHeight: 16,
    marginBottom: 4,
    marginTop: 0,
  },
  time: {
    fontSize: 10,
    color: '#999',
    marginTop: 0,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
    marginLeft: 8,
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  // Header buttons styles
  headerButtons: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: 8,
  },
  clearButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  clearButtonText: {
    color: 'white',
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    marginHorizontal: 32,
    minWidth: 280,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.black,
    marginBottom: 12,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalCancelButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    minWidth: 80,
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  modalConfirmButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    backgroundColor: '#F44336',
    minWidth: 80,
    alignItems: 'center',
  },
  modalConfirmText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },
});

export default NotificationsScreen;