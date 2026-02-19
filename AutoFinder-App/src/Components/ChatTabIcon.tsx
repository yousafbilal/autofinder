import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { io, Socket } from 'socket.io-client';
import { API_URL } from '../../config';
import { safeApiCall } from '../utils/apiUtils';
import { getCurrentUserId } from '../services/chat';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface ChatTabIconProps {
  color: string;
  focused: boolean;
}

const ChatTabIcon: React.FC<ChatTabIconProps> = ({ color, focused }) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const socketRef = useRef<Socket | null>(null);
  const userIdRef = useRef<string | null>(null);
  const lastFetchTimeRef = useRef<number>(0);
  const isUpdatingRef = useRef<boolean>(false);
  const isMountedRef = useRef<boolean>(true); // Track component mount status
  const optimisticCountRef = useRef<number>(0); // Track optimistic updates
  const lastServerCountRef = useRef<number>(0); // Track last server count
  const lastOptimisticAtRef = useRef<number>(0); // Timestamp of last optimistic increment
  const lastClearedAtRef = useRef<number>(0); // Timestamp when badge was last cleared by user reading messages
  
  // Helper function to get user-specific cache key
  const getCacheKey = (userId: string | null) => {
    return userId ? `totalUnreadCount_${userId}` : 'totalUnreadCount';
  };

  // Function to fetch unread message count
  const fetchUnreadCount = async (force: boolean = false, skipOptimisticCheck: boolean = false) => {
    try {
      // Prevent too frequent updates (throttle to max once per 2 seconds unless forced)
      const now = Date.now();
      if (!force && (now - lastFetchTimeRef.current) < 2000) {
        console.log('🔔 ChatTabIcon: Skipping fetch (too frequent)');
        return;
      }
      
      if (isUpdatingRef.current && !force) {
        console.log('🔔 ChatTabIcon: Already updating, skipping');
        return;
      }
      
      isUpdatingRef.current = true;
      lastFetchTimeRef.current = now;
      
      const userId = await getCurrentUserId();
      if (!userId) {
        // If userId is temporarily unavailable, do NOT clear badge.
        // Simply skip this cycle and try again soon.
        console.log('🔔 ChatTabIcon: userId not available yet, preserving current badge');
        isUpdatingRef.current = false;
        return;
      }
      userIdRef.current = userId;

      const result = await safeApiCall<any[]>(`${API_URL}/chat/conversations/${userId}`, {}, 1);
      // Handle 404 gracefully - endpoint might not exist or user has no conversations
      if (result.status === 404) {
        console.log('⚠️ Chat conversations endpoint not found (404), setting badge to 0');
        if (isMountedRef.current) setUnreadCount(0);
        isUpdatingRef.current = false;
        return;
      }
      if (result.success && result.data) {
        const conversations = result.data;
        
        // Calculate total unread - use backend's unreadCount if available (same as Chat.tsx)
        let totalUnread = 0;
        for (const conversation of conversations) {
          const backendUnreadCount = (conversation as any).unreadCount;
          if (backendUnreadCount !== undefined && backendUnreadCount !== null) {
            totalUnread += Number(backendUnreadCount) || 0;
          }
        }
        
        console.log('🔔 ChatTabIcon: Total unread messages from server:', totalUnread, '(conversations:', conversations.length, ')');
        lastServerCountRef.current = totalUnread;
        
        // If we have optimistic count and server says 0, but optimistic count is higher,
        // it means messages were just read. Only update if server count is actually higher or equal
        // OR if we're explicitly told to skip optimistic check (like when messages are read)
        setUnreadCount(prev => {
          const currentOptimistic = optimisticCountRef.current;
          
          // If skipOptimisticCheck is true, it means user actually read messages, so update to server count
          if (skipOptimisticCheck) {
            console.log('🔔 ChatTabIcon: Skip optimistic check - updating to server count', totalUnread);
            optimisticCountRef.current = totalUnread;
            try { AsyncStorage.setItem(getCacheKey(userIdRef.current), String(totalUnread)); } catch {}
            return totalUnread;
          }
          
          // If server count is higher than current, update to server count (new messages from other sources)
          if (totalUnread > prev) {
            console.log('🔔 ChatTabIcon: Server count higher, updating from', prev, 'to', totalUnread);
            optimisticCountRef.current = totalUnread;
            try { AsyncStorage.setItem(getCacheKey(userIdRef.current), String(totalUnread)); } catch {}
            return totalUnread;
          }
          
          // Check if user recently cleared the badge (within last 10 seconds)
          // If so, ALWAYS keep badge at 0, regardless of server count
          const timeSinceCleared = Date.now() - lastClearedAtRef.current;
          const wasRecentlyCleared = timeSinceCleared < 10000; // 10 seconds grace period
          
          // PRIORITY: If user recently read messages, keep badge at 0
          if (wasRecentlyCleared) {
            console.log('🔔 ChatTabIcon: User recently read messages, keeping badge at 0 (server count:', totalUnread, ')');
            optimisticCountRef.current = 0;
            lastOptimisticAtRef.current = 0;
            try { AsyncStorage.setItem(getCacheKey(userIdRef.current), '0'); } catch {}
            return 0; // Always return 0 if recently cleared
          }
          
          // ONLY preserve optimistic count when backend says 0 IF it's from a recent actual message
          // Don't preserve if it's just a stale cached value from previous session
          // Also check if we recently received a new message (within last 30 seconds)
          const timeSinceOptimistic = Date.now() - lastOptimisticAtRef.current;
          const hasRecentOptimisticUpdate = lastOptimisticAtRef.current > 0 && timeSinceOptimistic < 30000; // 30 seconds
          
          // If server says 0 but we have RECENT optimistic count, preserve it
          // This ensures badge stays visible for actual new messages
          // But if optimistic count is 0 or stale, clear the badge
          if (!skipOptimisticCheck && totalUnread === 0 && currentOptimistic > 0 && hasRecentOptimisticUpdate) {
            // Server says 0, but we have RECENT optimistic count - preserve it
            console.log('🔔 ChatTabIcon: Server says 0 but recent optimistic count is', currentOptimistic, '- preserving count (user has not read messages yet)');
            try { AsyncStorage.setItem(getCacheKey(userIdRef.current), String(currentOptimistic)); } catch {}
            return currentOptimistic; // Keep optimistic count - badge stays visible
          }
          
          // If server says 0 and no recent optimistic update, clear the badge
          if (!skipOptimisticCheck && totalUnread === 0 && (!hasRecentOptimisticUpdate || currentOptimistic === 0)) {
            console.log('🔔 ChatTabIcon: Server says 0 and no recent optimistic update - clearing badge');
            optimisticCountRef.current = 0;
            try { AsyncStorage.setItem(getCacheKey(userIdRef.current), '0'); } catch {}
            return 0;
          }
          
          // If server count is different from current and no recent optimistic update, use server count
          if (prev !== totalUnread) {
            console.log('🔔 ChatTabIcon: Updating badge count from', prev, 'to', totalUnread);
            optimisticCountRef.current = totalUnread;
            try { AsyncStorage.setItem(getCacheKey(userIdRef.current), String(totalUnread)); } catch {}
            return totalUnread;
          }
          
          return prev;
        });
      }
    } catch (error) {
      console.log('Error fetching unread count:', error);
    } finally {
      isUpdatingRef.current = false;
    }
  };

  useEffect(() => {
    // Hydrate from cache to avoid flicker on cold start, then fetch
    (async () => {
      try {
        // FIXED: Get userId first, then load user-specific cache
        const userId = await getCurrentUserId();
        if (userId) {
          // Check if userId changed (different user logged in)
          if (userIdRef.current && userIdRef.current !== userId) {
            console.log('🔄 ChatTabIcon: User changed, clearing old badge');
            setUnreadCount(0);
            optimisticCountRef.current = 0;
          }
          
          userIdRef.current = userId;
          const cached = await AsyncStorage.getItem(getCacheKey(userId));
          const num = cached ? Number(cached) : 0;
          if (!Number.isNaN(num) && num > 0) {
            console.log('🔔 ChatTabIcon: Hydrating from cache for user', userId.substring(0, 8), '...:', num);
            // FIXED: Don't mark cached values as "optimistic" - they're just cached
            // Only actual new messages via socket should be marked as optimistic
            // This allows server to correctly clear the badge if there are no actual messages
            optimisticCountRef.current = 0; // Don't preserve cached count
            setUnreadCount(num); // Show cached count temporarily for fast UI
            // Don't set lastOptimisticAtRef - let server decide the actual count
          } else {
            console.log('🔔 ChatTabIcon: No cached count for user', userId.substring(0, 8), '...');
            setUnreadCount(0); // IMPORTANT: Reset to 0 if no cache for this user
          }
        }
      } catch {}
      // Fetch immediately to sync with server, but preserve optimistic counts
      setTimeout(() => fetchUnreadCount(true, false), 400);
    })();
    
    // Setup Socket.io for real-time updates (using same transport as Chat.tsx)
    const socket = io(API_URL, { transports: ['websocket'] });
    socketRef.current = socket;
    
    // Listen for new messages
    socket.on('newMessage', async (data: any) => {
      console.log('📨 ChatTabIcon: New message received, updating badge count');
      const userId = userIdRef.current || await getCurrentUserId();
      const messageSenderId = data.senderId?._id || data.senderId;
      
      // Only react if message is from other user
      if (userId && messageSenderId && messageSenderId.toString() !== userId.toString()) {
        // Optimistically increment the count first
        setUnreadCount(prev => {
          const newCount = prev + 1;
          console.log('📨 ChatTabIcon: Optimistically incrementing from', prev, 'to', newCount);
          optimisticCountRef.current = newCount; // Track optimistic count
          lastOptimisticAtRef.current = Date.now();
          // Update cache immediately to persist the count (user-specific)
          try { AsyncStorage.setItem(getCacheKey(userIdRef.current), String(newCount)); } catch {}
          return newCount;
        });
        
        // DO NOT fetch from server immediately - server might not have updated yet
        // Only fetch after a longer delay (2 seconds) to give server time to update
        // The fetch will preserve optimistic count if server says 0
        setTimeout(() => {
          // Only fetch if badge hasn't been cleared by user reading messages
          const timeSinceCleared = Date.now() - lastClearedAtRef.current;
          if (timeSinceCleared > 5000) { // Only fetch if not recently cleared
            fetchUnreadCount(true, false);
          }
        }, 2000); // Increased delay to 2 seconds
      }
    });
    
    // Listen for message read events - DO NOT clear badge automatically
    // These events can fire prematurely (e.g., when user just opens chat list)
    // Badge will only clear when user actually reads messages in ChatDetailScreen
    socket.on('messageRead', (data: any) => {
      console.log('✅ ChatTabIcon: Message read event received - NOT clearing badge (preserving optimistic count)');
      // Do NOT clear - just refresh without skipping optimistic check
      // This preserves the badge until user actually reads messages
      setTimeout(() => fetchUnreadCount(true, false), 1000);
    });
    
    // Listen for messagesRead event - clear badge when user actually reads messages
    socket.on('messagesRead', (data: any) => {
      console.log('✅ ChatTabIcon: Messages read event received - user read messages, clearing badge', data);
      
      // User actually read messages in ChatDetailScreen - clear optimistic count and badge immediately
      // Mark when badge was cleared FIRST (before setState) to prevent any race conditions
      lastClearedAtRef.current = Date.now(); // Mark when badge was cleared
      optimisticCountRef.current = 0;
      lastOptimisticAtRef.current = 0;
      
      // Update cache to 0 immediately (user-specific)
      try { AsyncStorage.setItem(getCacheKey(userIdRef.current), '0'); } catch {}
      
      // Clear badge immediately
      setUnreadCount(0);
      
      console.log('✅ ChatTabIcon: Badge cleared immediately. Current count set to 0');
      
      // Fetch from server with skipOptimisticCheck=true to confirm and prevent restoration
      setTimeout(() => {
        fetchUnreadCount(true, true);
      }, 500);
    });
    
    // Listen for conversation updates - be more careful here
    socket.on('conversationUpdated', (data: any) => {
      console.log('🔄 ChatTabIcon: Conversation updated, checking if badge update needed');
      
      // Check if user recently cleared badge - if so, don't refresh to prevent restoration
      const timeSinceCleared = Date.now() - lastClearedAtRef.current;
      const wasRecentlyCleared = timeSinceCleared < 10000; // 10 seconds grace period
      
      // Check if we recently received a new message - if so, don't refresh to preserve badge
      const timeSinceOptimistic = Date.now() - lastOptimisticAtRef.current;
      const hasRecentOptimisticUpdate = timeSinceOptimistic < 30000; // 30 seconds
      
      if (wasRecentlyCleared) {
        console.log('🔄 ChatTabIcon: User recently read messages, skipping conversation update to prevent badge restoration');
        return; // Don't refresh if badge was recently cleared
      }
      
      // If we recently received a new message, don't refresh to preserve the badge
      if (hasRecentOptimisticUpdate && optimisticCountRef.current > 0) {
        console.log('🔄 ChatTabIcon: Recent new message detected, skipping conversation update to preserve badge');
        return; // Don't refresh if we have a recent optimistic update
      }
      
      // Only refresh if this is a message-related update AND it's a read update
      // Don't refresh for new messages here (handled by newMessage event)
      if (data.lastReadAt) {
        // This is a read update, but DO NOT clear badge automatically
        // Just refresh without skipping optimistic check to preserve badge
        console.log('🔄 ChatTabIcon: Read update detected - NOT clearing badge (preserving optimistic count)');
        setTimeout(() => fetchUnreadCount(true, false), 1000);
      } else if (data.lastMessage || data.lastMessageAt) {
        // This might be a new message, but let newMessage event handle it
        // Only refresh if we're sure it's not just a view update
        console.log('🔄 ChatTabIcon: New message update detected, refreshing badge count');
        setTimeout(() => fetchUnreadCount(true, false), 800);
      }
    });
    
    // Refresh unread count every 30 seconds as fallback
    // Use skipOptimisticCheck=false to ALWAYS preserve optimistic counts
    // Badge will only clear when user actually reads messages (via socket events above)
    const interval = setInterval(() => {
      // Check if user recently cleared badge - if so, skip periodic refresh to prevent restoration
      const timeSinceCleared = Date.now() - lastClearedAtRef.current;
      const wasRecentlyCleared = timeSinceCleared < 10000; // 10 seconds grace period
      
      // Check if we recently received a new message - if so, skip periodic refresh to preserve badge
      const timeSinceOptimistic = Date.now() - lastOptimisticAtRef.current;
      const hasRecentOptimisticUpdate = timeSinceOptimistic < 30000; // 30 seconds
      
      if (wasRecentlyCleared) {
        console.log('🔄 ChatTabIcon: Periodic refresh skipped - user recently read messages, preventing badge restoration');
        return; // Don't refresh if badge was recently cleared
      }
      
      // If we recently received a new message, skip periodic refresh to preserve the badge
      if (hasRecentOptimisticUpdate && optimisticCountRef.current > 0) {
        console.log('🔄 ChatTabIcon: Periodic refresh skipped - recent new message detected, preserving badge');
        return; // Don't refresh if we have a recent optimistic update
      }
      
      // Periodic refresh - preserving optimistic counts (log removed to reduce noise)
      fetchUnreadCount(false, false); // Never skip optimistic check in periodic refresh
    }, 30000);
    
    return () => {
      isMountedRef.current = false;
      clearInterval(interval);
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, []);

  return (
    <View style={styles.container}>
      <Ionicons
        name={focused ? "chatbubble-ellipses" : "chatbubble-ellipses-outline"} 
        size={Platform.OS === 'ios' ? 24 : 22} 
        color={color}
        style={{ opacity: 1 }}
      />
      {unreadCount > 0 && (
        <View style={[styles.badge, unreadCount > 9 && styles.badgeLarge, unreadCount > 99 && styles.badgeExtraLarge]}>
          <Text style={styles.badgeText}>
            {unreadCount > 99 ? '99+' : unreadCount.toString()}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'visible',
  },
  badge: {
    position: 'absolute',
    right: Platform.OS === 'ios' ? -10 : -8,
    top: Platform.OS === 'ios' ? -8 : -6,
    backgroundColor: '#CD0100', // Red color matching app theme
    borderRadius: 12,
    minWidth: 20,
    height: 20,
    paddingHorizontal: 5,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
    zIndex: 1000,
  },
  badgeLarge: {
    minWidth: 24,
    paddingHorizontal: 6,
    borderRadius: 12,
  },
  badgeExtraLarge: {
    minWidth: 28,
    paddingHorizontal: 7,
    borderRadius: 14,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: 13,
    includeFontPadding: false,
  },
});

export default ChatTabIcon;
