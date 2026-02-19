import React, { useEffect, useMemo, useState, useCallback, useRef } from "react"
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, TextInput, ActivityIndicator, Alert, Modal, Animated, Platform } from "react-native"
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context"
import { Ionicons } from "@expo/vector-icons"
import { COLORS } from "../constants/colors"
import { useNavigation, useRoute, useFocusEffect } from "@react-navigation/native"
import { ChatConversation, ensureConversationForAd, fetchConversations, getCurrentUserId, sendMessage as sendChatMessage, fetchUserProfile, fetchAdOwnerUserId, findSellerByImages, fetchMessages, markConversationAsRead, cleanupDuplicateConversations } from "../services/chat"
import { API_URL, CAR_DETAIL_BASE_URL } from "../../config"
import { apiFetch } from "../utils/apiUtils"
import AsyncStorage from '@react-native-async-storage/async-storage'
import { io } from 'socket.io-client'

const Chat = () => {
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(false)
  const [conversations, setConversations] = useState<ChatConversation[]>([])
  const [userData, setUserData] = useState<any>(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedChat, setSelectedChat] = useState<{id: string, name: string} | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [selectionMode, setSelectionMode] = useState(false)
  const [selectedChats, setSelectedChats] = useState<string[]>([])
  const [showSelectAllModal, setShowSelectAllModal] = useState(false)
  const [avatarErrors, setAvatarErrors] = useState<Set<string>>(new Set())
  const [unreadCounts, setUnreadCounts] = useState<{[conversationId: string]: number}>({})
  const [totalUnreadCount, setTotalUnreadCount] = useState(0)
  const navigation: any = useNavigation()
  const route: any = useRoute()
  const insets = useSafeAreaInsets()
  const socketRef = useRef<any>(null) // FIXED: Track socket connection to prevent multiple connections

  useEffect(() => {
    let isMounted = true
    const init = async () => {
      setLoading(true)
      try {
        // Fetch user data
        const storedUserData = await AsyncStorage.getItem('user')
        if (!storedUserData) {
          // User is not logged in - show alert and redirect to login
          if (isMounted) {
            Alert.alert(
              "Login Required",
              "You are not logged in. Continue to chat please login.",
              [
                {
                  text: "Cancel",
                  style: "cancel",
                  onPress: () => {
                    // Navigate back to Home tab
                    navigation.navigate('HomeTabs', { screen: 'Home' });
                  }
                },
                {
                  text: "Login",
                  onPress: () => {
                    navigation.navigate("LoginScreen");
                  }
                }
              ]
            );
          }
          setLoading(false);
          return;
        }
        
        if (storedUserData) {
          const parsedData = JSON.parse(storedUserData)
          if (isMounted) setUserData(parsedData)
          
          // Set user as online when chat screen loads
          try {
            await apiFetch(`${API_URL}/user/online/${parsedData.userId}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' }
            });
          } catch (error) {
            console.log('Error setting user online:', error);
          }
        }

        const uid = await getCurrentUserId()
        if (!uid) {
          setConversations([])
        } else {
          // First cleanup any existing duplicates
          try {
            const cleanupResult = await cleanupDuplicateConversations();
            if (cleanupResult.deletedCount > 0) {
              console.log(`🧹 Cleaned up ${cleanupResult.deletedCount} duplicate conversations`);
            }
          } catch (error) {
            console.log('Error cleaning up duplicates:', error);
          }
          
          // Then fetch conversations
          console.log('📡 Fetching conversations for userId:', uid);
          const convos = await fetchConversations(uid)
          console.log('📦 Received conversations from API:', convos.length);
          
          // FIXED: Filter out conversations with invalid/empty _id before sorting
          const validConvos = convos.filter(conv => {
            if (!conv || !conv._id) {
              console.log('⚠️ Filtered out conversation - no _id:', conv);
              return false;
            }
            if (typeof conv._id === 'object' && Object.keys(conv._id).length === 0) {
              console.log('⚠️ Filtered out conversation - empty object _id:', conv);
              return false;
            }
            if (typeof conv._id === 'string' && (conv._id === '[object Object]' || conv._id.includes('[object'))) {
              console.log('⚠️ Filtered out conversation - invalid string _id:', conv._id);
              return false;
            }
            return true;
          });
          
          console.log('✅ Valid conversations after filtering:', validConvos.length);
          
          // Sort conversations by last message time ONLY (not updatedAt - that changes on view)
          const sortedConvos = validConvos.sort((a, b) => {
            // Only use actual message timestamps, NOT updatedAt (which changes on view)
            const timeA = new Date((a as any).lastMessageAt || (a as any).lastMessage?.createdAt || (a as any).lastMessage?.timestamp || 0).getTime();
            const timeB = new Date((b as any).lastMessageAt || (b as any).lastMessage?.createdAt || (b as any).lastMessage?.timestamp || 0).getTime();
            return timeB - timeA; // Most recent message first
          });
          
          console.log('📋 Setting conversations in state:', sortedConvos.length);
          if (sortedConvos.length > 0) {
            console.log('📋 First conversation:', {
              _id: sortedConvos[0]._id,
              sellerId: sortedConvos[0].sellerId,
              buyerId: sortedConvos[0].buyerId,
              lastMessage: sortedConvos[0].lastMessage
            });
            console.log('📋 Full first conversation object:', JSON.stringify(sortedConvos[0], null, 2));
          } else {
            console.log('⚠️ No conversations to set in state!');
            console.log('📊 Debug info:', {
              uid,
              convosLength: convos.length,
              validConvosLength: validConvos.length,
              sortedConvosLength: sortedConvos.length
            });
          }
          
          if (isMounted) {
            setConversations(sortedConvos);
            console.log('✅ Conversations state updated, count:', sortedConvos.length);
          }
        }
        const { adId, sellerId, openForAd, carDetails, propertyDetails, propertyType, carTitle, carPrice, carImage } = route.params || {}
        if (openForAd) {
          try {
            // Extract seller ID using helper function
            const { extractSellerId, extractCarDetails, fetchAdOwnerUserId } = require('../services/chat')
            
            let effectiveAdId = adId
            let effectiveSellerId = sellerId ? extractSellerId({ userId: sellerId, sellerId: sellerId, postedBy: sellerId }) : null
            
            // Try to extract seller ID from carDetails/propertyDetails if not provided
            if (!effectiveSellerId) {
              const details = carDetails || propertyDetails
              if (details) {
                effectiveSellerId = extractSellerId(details)
              }
            }
            
            // Fallback: try to find seller by images
            if ((!effectiveAdId || !effectiveSellerId) && carDetails?.images?.length) {
              const match = await findSellerByImages(carDetails.images)
              effectiveAdId = effectiveAdId || match.adId || undefined
              effectiveSellerId = effectiveSellerId || match.sellerId || undefined
            }
            
            // Fallback: fetch seller ID from API
            if (!effectiveSellerId && effectiveAdId) {
              effectiveSellerId = await fetchAdOwnerUserId(effectiveAdId) || undefined
            }
            
            // Validate we have seller ID before proceeding
            if (!effectiveSellerId) {
              Alert.alert(
                "Unable to Start Chat",
                "Could not identify the seller. Please try again later.",
                [{ text: "OK" }]
              )
              return
            }
            
            // Extract car details for initial message
            const details = carDetails || propertyDetails
            const carInfo = details ? extractCarDetails(details) : {
              title: carTitle || 'Car Listing',
              price: carPrice || 'N/A',
              image: carImage || null,
              adId: effectiveAdId || null
            }
            
            // Create or fetch conversation
            const conv = await ensureConversationForAd(effectiveAdId, effectiveSellerId)
            
            if (!conv || !conv._id) {
              Alert.alert(
                "Error",
                "Failed to create conversation. Please try again.",
                [{ text: "OK" }]
              )
              return
            }
            
            const me = await getCurrentUserId()
            if (!me) {
              Alert.alert(
                "Error",
                "You must be logged in to chat.",
                [{ text: "OK" }]
              )
              return
            }
            
            let sellerDisplay = { name: 'Seller' } as any
            if (effectiveSellerId) {
              const profile = await fetchUserProfile(effectiveSellerId)
              if (profile) {
                sellerDisplay = { 
                  name: profile.name || 'Seller', 
                  avatar: profile.profileImage ? `${API_URL}/uploads/profile_pics/${profile.profileImage}` : undefined
                }
              }
            }
            
            // Check if this is a temporary conversation (created locally)
            const isTempConversation = conv._id.startsWith('temp_');
            
            // Check if this is a new conversation by checking if it has any messages
            let isNewConversation = true;
            if (!isTempConversation) {
              try {
                const messages = await fetchMessages(conv._id);
                isNewConversation = messages.length === 0;
              } catch (error) {
                console.log('Error checking messages:', error);
              }
            }
            
            // Create initial message with car details
            let initialMessage = `Hi! I'm interested in your car:\n\n🚗 ${carInfo.title}\n💰 ${carInfo.price}`
            
            // Add car detail link if adId is available
            if (carInfo.adId) {
              const carLink = `${CAR_DETAIL_BASE_URL}/car/${carInfo.adId}`
              initialMessage += `\n🔗 View details: ${carLink}`
            }
            
            let finalConversationId = conv._id;
            
            // If this is a temporary conversation or new conversation, send message to create it
            if (me && (isTempConversation || isNewConversation)) {
              try {
                let messagePayload: any;
                
                if (isTempConversation) {
                  // For temporary conversations, send message with buyerId and sellerId
                  // This should trigger backend to create the conversation
                  messagePayload = {
                    buyerId: me,
                    sellerId: effectiveSellerId,
                    adId: effectiveAdId,
                    text: initialMessage,
                    senderId: { _id: me }
                  };
                  
                  console.log('📤 Sending message to create conversation:', { buyerId: me, sellerId: effectiveSellerId });
                } else {
                  // Use existing conversation ID
                  messagePayload = {
                    conversationId: conv._id,
                    senderId: { _id: me },
                    text: initialMessage
                  };
                }
                
                // Send message - backend should create conversation if it doesn't exist
                const sentMessage = await sendChatMessage(messagePayload);
                
                console.log('✅ Message sent, response:', sentMessage);
                
                // If we sent with buyerId/sellerId (temp conversation), fetch the created conversation
                if (isTempConversation) {
                  // Wait a bit for backend to create conversation
                  await new Promise(resolve => setTimeout(resolve, 1000));
                  
                  // Fetch conversations to get the newly created one
                  const updatedConversations = await fetchConversations(me);
                  const newConv = updatedConversations.find(c => {
                    const isSameSeller = c.sellerId._id === effectiveSellerId || c.buyerId._id === effectiveSellerId;
                    const isCurrentUserInvolved = c.sellerId._id === me || c.buyerId._id === me;
                    return isSameSeller && isCurrentUserInvolved;
                  });
                  
                  if (newConv && newConv._id) {
                    console.log('✅ Found newly created conversation:', newConv._id);
                    finalConversationId = newConv._id;
                  } else {
                    console.log('⚠️ Could not find newly created conversation yet');
                    // Try one more time after a longer delay
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    const retryConversations = await fetchConversations(me);
                    const retryConv = retryConversations.find(c => {
                      const isSameSeller = c.sellerId._id === effectiveSellerId || c.buyerId._id === effectiveSellerId;
                      const isCurrentUserInvolved = c.sellerId._id === me || c.buyerId._id === me;
                      return isSameSeller && isCurrentUserInvolved;
                    });
                    if (retryConv && retryConv._id) {
                      console.log('✅ Found conversation on retry:', retryConv._id);
                      finalConversationId = retryConv._id;
                    } else {
                      console.log('❌ Still could not find conversation. Using temp ID:', finalConversationId);
                      // Show warning but continue - conversation might be created but not fetched yet
                      Alert.alert(
                        "Warning",
                        "Conversation is being created. Please refresh if you don't see messages.",
                        [{ text: "OK" }]
                      );
                    }
                  }
                }
                
                console.log('✅ Initial car message sent successfully')
              } catch (error: any) {
                console.error('❌ Error sending initial message:', error)
                // If message sending fails, we can't create conversation
                Alert.alert(
                  "Error",
                  error?.message || "Failed to send message. The backend endpoint /chat/messages may not support creating conversations. Please contact support.",
                  [{ text: "OK" }]
                )
                return
              }
            }
            
            navigation.navigate("ChatDetailScreen", { 
              conversationId: finalConversationId, 
              chat: sellerDisplay,
              propertyDetails: propertyDetails || carDetails,
              propertyType: propertyType || 'car',
              sellerId: effectiveSellerId, // FIXED: Pass sellerId explicitly
              adId: effectiveAdId // FIXED: Pass adId explicitly
            })
            
            // Don't refresh conversations list automatically - this was causing re-sorting issues
            // The conversation will be updated when new messages arrive via socket
          } catch (error: any) {
            console.error('Error opening chat:', error)
            Alert.alert(
              "Error",
              error?.message || "Failed to open chat. Please try again.",
              [{ text: "OK" }]
            )
          }
        }
      } catch {}
      finally { setLoading(false) }
    }
    init()
    return () => { 
      isMounted = false
      
      // Set user as offline when component unmounts
      const setUserOffline = async () => {
        if (userData?.userId) {
          try {
            await apiFetch(`${API_URL}/user/offline/${userData.userId}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' }
            });
          } catch (error) {
            console.log('Error setting user offline:', error);
          }
        }
      };
      setUserOffline();
    }
  }, [route.params])

  // Manual refresh function for conversations (can be called when needed)
  const refreshConversations = useCallback(async () => {
    try {
      console.log('🔄 refreshConversations called');
      const uid = await getCurrentUserId();
      if (!uid) {
        console.log('⚠️ No userId found, returning empty array');
        setConversations([]);
        return [];
      }
      
      console.log('📡 Fetching conversations for userId:', uid);
      const convos = await fetchConversations(uid);
      console.log('📦 Received conversations from API:', convos.length);
      
      // Filter out conversations with invalid/empty _id
      const validConvos = convos.filter(conv => {
        if (!conv || !conv._id) {
          console.log('⚠️ Filtered out conversation - no _id:', conv);
          return false;
        }
        if (typeof conv._id === 'object' && Object.keys(conv._id).length === 0) {
          console.log('⚠️ Filtered out conversation - empty object _id:', conv);
          return false;
        }
        if (typeof conv._id === 'string' && (conv._id === '[object Object]' || conv._id.includes('[object'))) {
          console.log('⚠️ Filtered out conversation - invalid string _id:', conv._id);
          return false;
        }
        return true;
      });
      
      console.log('✅ Valid conversations after filtering:', validConvos.length);
      
      // Sort conversations by last message time (most recent message first)
      const sortedConvos = validConvos.sort((a, b) => {
        // Only use actual message timestamps, NOT updatedAt (which changes on view)
        const timeA = new Date((a as any).lastMessageAt || (a as any).lastMessage?.createdAt || (a as any).lastMessage?.timestamp || 0).getTime();
        const timeB = new Date((b as any).lastMessageAt || (b as any).lastMessage?.createdAt || (b as any).lastMessage?.timestamp || 0).getTime();
        return timeB - timeA; // Most recent message first
      });
      
      console.log('📋 Setting conversations in state:', sortedConvos.length);
      if (sortedConvos.length > 0) {
        console.log('📋 First conversation:', {
          _id: sortedConvos[0]._id,
          sellerId: sortedConvos[0].sellerId,
          buyerId: sortedConvos[0].buyerId,
          lastMessage: sortedConvos[0].lastMessage
        });
      }
      
      setConversations(sortedConvos);
      console.log('✅ Conversations refreshed, count:', sortedConvos.length);
      return sortedConvos; // Return for promise chain
    } catch (error) {
      console.error('❌ Error refreshing conversations:', error);
      return [];
    }
  }, []);

  // Debounced refresh to prevent excessive refreshing
  const debouncedRefresh = useCallback(() => {
    const timeoutId = setTimeout(() => {
      refreshConversations();
    }, 500); // 500ms delay
    
    return () => clearTimeout(timeoutId);
  }, [refreshConversations]);

  // Track which conversations were recently marked as read (to prevent optimistic updates)
  const recentlyReadConversations = useRef<Set<string>>(new Set());
  
  // Function to mark a conversation as recently read
  const markConversationAsRecentlyRead = useCallback((conversationId: string) => {
    recentlyReadConversations.current.add(conversationId);
    // Remove from set after 5 seconds (buffer time)
    setTimeout(() => {
      recentlyReadConversations.current.delete(conversationId);
    }, 5000);
  }, []);

  // Function to calculate unread message counts - use backend's unreadCount if available
  const calculateUnreadCounts = useCallback(async () => {
    try {
      const newUnreadCounts: {[conversationId: string]: number} = {};
      let totalUnread = 0;

      // Use backend's unreadCount if available (more efficient and accurate)
      for (const conversation of conversations) {
        const backendUnreadCount = (conversation as any).unreadCount;
        if (backendUnreadCount !== undefined && backendUnreadCount !== null) {
          // Use backend's calculated unread count
          const count = Number(backendUnreadCount) || 0;
          newUnreadCounts[conversation._id] = count;
          totalUnread += count;
        } else {
          // Fallback: calculate manually if backend doesn't provide it
          try {
            const uid = await getCurrentUserId();
            if (!uid) {
              newUnreadCounts[conversation._id] = 0;
              continue;
            }

            const lastReadAtRaw = (conversation as any).lastReadAt;
            const lastReadAt = lastReadAtRaw ? new Date(lastReadAtRaw) : null;
            
            const messages = await fetchMessages(conversation._id);
            
            if (!messages || messages.length === 0) {
              newUnreadCounts[conversation._id] = 0;
              continue;
            }
            
            const unreadMessages = messages.filter((msg: any) => {
              const senderId = msg.senderId?._id || msg.senderId || null;
              const isFromOtherUser = senderId && senderId.toString() !== uid.toString();
              
              if (!isFromOtherUser) {
                return false;
              }
              
              if (!lastReadAt) {
                return true;
              }
              
              const messageTime = new Date(msg.createdAt || msg.timestamp || 0);
              const isRead = messageTime <= lastReadAt;
              
              return !isRead;
            });
            
            const unreadCount = unreadMessages.length;
            newUnreadCounts[conversation._id] = unreadCount;
            totalUnread += unreadCount;
          } catch (error) {
            console.log(`Error calculating unread count for conversation ${conversation._id}:`, error);
            newUnreadCounts[conversation._id] = 0;
          }
        }
      }

      // Preserve optimistic counts - don't overwrite if current count is higher than backend
      setUnreadCounts(prev => {
        const preserved = { ...newUnreadCounts };
        
        // Preserve optimistic counts that are higher than backend counts
        Object.keys(prev).forEach(convId => {
          const optimisticCount = prev[convId] || 0;
          const backendCount = preserved[convId] || 0;
          
          // If optimistic count is higher than backend count, preserve it
          // This ensures bold text stays until user actually reads messages
          if (optimisticCount > backendCount && optimisticCount > 0) {
            console.log(`🔔 Preserving optimistic count ${optimisticCount} over backend count ${backendCount} for ${convId}`);
            preserved[convId] = optimisticCount;
          }
        });
        
        // Also check if backend has new unread messages that we don't have
        Object.keys(newUnreadCounts).forEach(convId => {
          const backendCount = newUnreadCounts[convId] || 0;
          const currentCount = prev[convId] || 0;
          if (backendCount > currentCount) {
            console.log(`🔔 Updating count from ${currentCount} to ${backendCount} for ${convId} (backend has more)`);
            preserved[convId] = backendCount;
          }
        });
        
        // Recalculate total with preserved counts
        const preservedTotal = Object.values(preserved).reduce((sum, count) => sum + count, 0);
        setTotalUnreadCount(preservedTotal);
        
        if (preservedTotal !== totalUnread) {
          console.log(`🔔 Preserved optimistic counts. Final total: ${preservedTotal} (backend total: ${totalUnread})`);
        }
        
        return preserved;
      });
      
      // Debug: Log unread counts
      const conversationsWithUnread = Object.entries(newUnreadCounts).filter(([_, count]) => count > 0);
      console.log('📊 Unread counts calculated:', conversationsWithUnread.length, 'conversations with unread messages');
      conversationsWithUnread.forEach(([id, count]) => {
        const conv = conversations.find(c => c._id === id);
        const backendCount = (conv as any)?.unreadCount;
        console.log(`  - Conversation ${id}: ${count} unread messages (backend: ${backendCount})`);
      });
      
      if (conversationsWithUnread.length === 0 && conversations.length > 0) {
        console.log('⚠️ No unread messages found. Sample conversation data:');
        conversations.slice(0, 2).forEach((conv: any) => {
          console.log(`  - Conv ${conv._id}: unreadCount=${conv.unreadCount}, lastReadAt=${conv.lastReadAt}`);
        });
      }
    } catch (error) {
      console.log('Error calculating unread counts:', error);
    }
  }, [conversations]);

  // Calculate unread counts when conversations change
  useEffect(() => {
    if (conversations.length > 0) {
      calculateUnreadCounts();
    }
  }, [conversations, calculateUnreadCounts]);

  // Don't refresh conversations on focus - only refresh when new messages arrive
  // This prevents chats from moving to top when just viewing them
  // Disabled auto refresh on focus to prevent refresh when clicking on chat
  // useEffect(() => {
  // FIXED: Refresh conversations when screen comes into focus (when navigating back)
  // Add debouncing to prevent excessive requests
  const lastRefreshRef = useRef<number>(0);
  const REFRESH_COOLDOWN = 2000; // 2 seconds cooldown between refreshes
  
  useFocusEffect(
    useCallback(() => {
      const refreshConversations = async () => {
        const now = Date.now();
        // FIXED: Prevent excessive refreshes - only refresh if last refresh was more than 2 seconds ago
        if (now - lastRefreshRef.current < REFRESH_COOLDOWN) {
          console.log('⏭️ Skipping refresh - too soon since last refresh');
          return;
        }
        lastRefreshRef.current = now;
        
        const uid = await getCurrentUserId();
        if (!uid) {
          setConversations([]);
          return;
        }
        
        try {
          console.log('🔄 Refreshing conversations on focus...');
          console.log('📡 Fetching conversations for userId:', uid);
          const convos = await fetchConversations(uid);
          console.log('📦 Received conversations from API:', convos.length);
          
          // Filter out conversations with invalid/empty _id
          const validConvos = convos.filter(conv => {
            if (!conv || !conv._id) {
              console.log('⚠️ Filtered out conversation - no _id:', conv);
              return false;
            }
            if (typeof conv._id === 'object' && Object.keys(conv._id).length === 0) {
              console.log('⚠️ Filtered out conversation - empty object _id:', conv);
              return false;
            }
            if (typeof conv._id === 'string' && (conv._id === '[object Object]' || conv._id.includes('[object'))) {
              console.log('⚠️ Filtered out conversation - invalid string _id:', conv._id);
              return false;
            }
            return true;
          });
          
          console.log('✅ Valid conversations after filtering:', validConvos.length);
          
          // Sort conversations by last message time
          const sortedConvos = validConvos.sort((a, b) => {
            const timeA = new Date((a as any).lastMessageAt || (a as any).lastMessage?.createdAt || (a as any).lastMessage?.timestamp || 0).getTime();
            const timeB = new Date((b as any).lastMessageAt || (b as any).lastMessage?.createdAt || (b as any).lastMessage?.timestamp || 0).getTime();
            return timeB - timeA; // Most recent message first
          });
          
          console.log('📋 Setting conversations in state:', sortedConvos.length);
          if (sortedConvos.length > 0) {
            console.log('📋 First conversation:', {
              _id: sortedConvos[0]._id,
              sellerId: sortedConvos[0].sellerId,
              buyerId: sortedConvos[0].buyerId,
              lastMessage: sortedConvos[0].lastMessage
            });
          }
          
          setConversations(sortedConvos);
          console.log('✅ Conversations refreshed, count:', sortedConvos.length);
          
          // Also recalculate unread counts
          setTimeout(() => {
            calculateUnreadCounts();
          }, 300);
        } catch (error) {
          console.error('Error refreshing conversations:', error);
        }
      };
      
      refreshConversations();
    }, [calculateUnreadCounts])
  );

  // Add socket listener for real-time conversation updates
  useEffect(() => {
    // FIXED: Prevent multiple socket connections
    if (socketRef.current && socketRef.current.connected) {
      console.log('✅ Socket already connected, skipping reconnection');
      return;
    }
    
    // FIXED: Get token for socket authentication
    let socket: any = null;
    let isMounted = true;
    
    const initSocket = async () => {
      try {
        // FIXED: Disconnect existing socket if any
        if (socketRef.current) {
          socketRef.current.removeAllListeners();
          socketRef.current.disconnect();
          socketRef.current = null;
        }
        
        const storedUserData = await AsyncStorage.getItem('user');
        const token = storedUserData ? JSON.parse(storedUserData).token : null;
        
        if (!isMounted) return;
        
        socket = io(API_URL, { 
          transports: ['websocket'],
          auth: {
            token: token
          },
          query: {
            token: token
          },
          reconnection: true,
          reconnectionAttempts: 3,
          reconnectionDelay: 1000
        });
        
        socketRef.current = socket;
        
        if (!isMounted) {
          socket.disconnect();
          return;
        }
        
        // Handle connection errors
        socket.on('connect_error', (error: any) => {
          if (isMounted) {
            console.log('⚠️ Socket connection error:', error.message);
            // Don't reconnect if rate limited
            if (error.message?.includes('Too many connection attempts')) {
              console.log('⏭️ Rate limited, will not reconnect');
              socket.disconnect();
            }
          }
        });
        
        socket.on('connect', () => {
          if (isMounted) {
            console.log('✅ Socket connected successfully');
          }
        });
        
        socket.on('disconnect', () => {
          if (isMounted) {
            console.log('⚠️ Socket disconnected');
          }
        });
        
        // Setup listeners only after socket is connected
        setupSocketListeners(socket);
      } catch (error) {
        console.error('Error initializing socket:', error);
        if (!isMounted) return;
        // Fallback: connect without token (may be rejected by backend)
        socket = io(API_URL, { transports: ['websocket'] });
        socketRef.current = socket;
        setupSocketListeners(socket);
      }
    };
    
    const setupSocketListeners = (sock: any) => {
      if (!isMounted || !sock) return;
      
      let refreshTimeout: NodeJS.Timeout | null = null;
    
      // Listen for conversation updates (only refresh if it's a message-related update, not just a view/read update)
      sock.on('conversationUpdated', (data: any) => {
      console.log('🔄 Conversation updated via socket:', data);
      // Only refresh if this is a message-related update (has new message), not just a read/view update
      // This prevents conversations from moving to top when user just views them
      if (data.lastMessage || data.lastMessageAt) {
        // This is a message-related update, refresh to update the list
        refreshConversations().then(() => {
          // Recalculate unread counts after conversations are refreshed
          setTimeout(() => {
            calculateUnreadCounts();
          }, 500);
        });
      } else {
        // This is just a read/view update, don't refresh to prevent re-sorting
        // Just recalculate unread counts without refreshing the full list
        setTimeout(() => {
          calculateUnreadCounts();
        }, 300);
      }
      });
      
      // Listen for conversation deletion events
      sock.on('conversationDeleted', (data: any) => {
      console.log('🗑️ Conversation deleted via socket:', data);
      const { conversationId } = data;
      
      // Remove conversation from local state
      setConversations(prev => {
        const filtered = prev.filter(conv => conv._id !== conversationId);
        console.log(`✅ Removed deleted conversation ${conversationId} from list`);
        return filtered;
      });
      
      // Recalculate unread counts after removing conversation
      setTimeout(() => {
        calculateUnreadCounts();
      }, 300);
      });
      
      // Listen for conversation deletion events (with conversationId in event name)
      sock.onAny((eventName: string, data: any) => {
      if (eventName.startsWith('conversationDeleted:')) {
        const conversationId = eventName.replace('conversationDeleted:', '');
        console.log('🗑️ Conversation deleted via socket (pattern match):', conversationId);
        
        // Remove conversation from local state
        setConversations(prev => {
          const filtered = prev.filter(conv => conv._id !== conversationId);
          console.log(`✅ Removed deleted conversation ${conversationId} from list`);
          return filtered;
        });
        
        // Recalculate unread counts after removing conversation
        setTimeout(() => {
          calculateUnreadCounts();
        }, 300);
      }
      });
      
      // Listen for new messages to update conversation list
      sock.on('newMessage', (data: any) => {
        console.log('📨 New message received via socket:', data);
        const { conversationId, message, senderId } = data;
        
        // Check if this conversation was recently marked as read
        const wasRecentlyRead = recentlyReadConversations.current.has(conversationId);
        
        // Check if this conversation is currently open/read
        const currentConversation = conversations.find(c => c._id === conversationId);
        const lastReadAtRaw = currentConversation ? (currentConversation as any).lastReadAt : null;
        const lastReadAt = lastReadAtRaw ? new Date(lastReadAtRaw) : null;
        const messageTime = message?.createdAt ? new Date(message.createdAt) : new Date();
        
        // Only increment if message is after lastReadAt (conversation not recently read)
        // Add 3 second buffer to account for timing differences
        const bufferTime = 3000; // 3 seconds
        const isUnread = !lastReadAt || (messageTime.getTime() > (lastReadAt.getTime() + bufferTime));
        
        // Immediately update unread count for this conversation if message is from other user AND conversation is unread AND not recently read
        const currentUserId = userData?.userId;
        const messageSenderId = senderId?._id || senderId;
        const isFromOtherUser = currentUserId && messageSenderId && messageSenderId.toString() !== currentUserId.toString();
        
        if (isFromOtherUser && conversationId && isUnread && !wasRecentlyRead) {
          console.log(`➕ Incrementing unread count for conversation ${conversationId}`);
          // Optimistically increment unread count only if conversation is actually unread
          setUnreadCounts(prev => {
            const currentCount = prev[conversationId] || 0;
            return {
              ...prev,
              [conversationId]: currentCount + 1
            };
          });
          setTotalUnreadCount(prev => prev + 1);
        } else {
          console.log(`⏭️ Skipping unread increment for conversation ${conversationId} (isFromOtherUser: ${isFromOtherUser}, isUnread: ${isUnread}, wasRecentlyRead: ${wasRecentlyRead})`);
        }
        
        // Refresh conversations to get updated data from backend (this will correct any optimistic updates)
        refreshConversations().then(() => {
          // Recalculate unread counts after conversations are refreshed (backend has accurate count)
          setTimeout(() => {
            calculateUnreadCounts();
          }, 500);
        });
      });
    };
    
    initSocket();
    
    initSocket();
    
    return () => {
      isMounted = false;
      if (socketRef.current) {
        socketRef.current.removeAllListeners();
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [refreshConversations, calculateUnreadCounts, userData]);

  const showDeleteOptions = (conversationId: string, userName: string) => {
    setSelectedChat({ id: conversationId, name: userName });
    setShowDeleteModal(true);
  };

  // Close delete modal
  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setSelectedChat(null);
  };

  // Toggle selection mode
  const toggleSelectionMode = () => {
    setSelectionMode(!selectionMode);
    setSelectedChats([]);
  };

  // Toggle individual chat selection
  const toggleChatSelection = (chatId: string) => {
    setSelectedChats(prev => 
      prev.includes(chatId) 
        ? prev.filter(id => id !== chatId)
        : [...prev, chatId]
    );
  };

  // Select all chats
  const selectAllChats = () => {
    setSelectedChats(filtered.map(chat => chat._id));
  };

  // Deselect all chats
  const deselectAllChats = () => {
    setSelectedChats([]);
  };

  // Show select all delete modal
  const showSelectAllDeleteModal = () => {
    if (selectedChats.length === 0) {
      Alert.alert('No Selection', 'Please select chats to delete');
      return;
    }
    setShowSelectAllModal(true);
  };

  // Close select all modal
  const closeSelectAllModal = () => {
    setShowSelectAllModal(false);
  };

  // Delete single conversation
  const deleteConversation = async () => {
    if (!userData?.userId || !selectedChat) {
      Alert.alert('Error', 'User not found');
      return;
    }

    setDeleting(true);
    try {
      // FIXED: Extract conversationId as string
      let conversationIdStr: string;
      if (typeof selectedChat.id === 'string') {
        conversationIdStr = selectedChat.id;
      } else if (typeof selectedChat.id === 'object' && selectedChat.id !== null) {
        if (Object.keys(selectedChat.id).length === 0) {
          Alert.alert('Error', 'Invalid conversation ID');
          setDeleting(false);
          return;
        }
        if (selectedChat.id.toString && typeof selectedChat.id.toString === 'function') {
          const str = String(selectedChat.id.toString());
          if (str !== '[object Object]' && !str.includes('[object')) {
            conversationIdStr = str;
          } else if (selectedChat.id._id) {
            conversationIdStr = String(selectedChat.id._id);
          } else {
            Alert.alert('Error', 'Invalid conversation ID format');
            setDeleting(false);
            return;
          }
        } else if (selectedChat.id._id) {
          conversationIdStr = String(selectedChat.id._id);
        } else {
          Alert.alert('Error', 'Invalid conversation ID format');
          setDeleting(false);
          return;
        }
      } else {
        Alert.alert('Error', 'Invalid conversation ID');
        setDeleting(false);
        return;
      }

      const response = await fetch(`${API_URL}/chat/conversation/${conversationIdStr}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: userData.userId }),
      });

      // FIXED: Handle HTML responses (404 pages, etc.)
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        if (response.ok) {
          // If response is OK but not JSON, assume success
          setConversations(prev => prev.filter(conv => {
            const convId = typeof conv._id === 'string' ? conv._id : (typeof conv._id === 'object' && conv._id?._id ? String(conv._id._id) : null);
            return convId !== conversationIdStr;
          }));
          setUnreadCounts(prev => {
            const updated = { ...prev };
            delete updated[conversationIdStr];
            return updated;
          });
          closeDeleteModal();
          Alert.alert('Success', 'Conversation deleted successfully');
          setDeleting(false);
          return;
        } else {
          throw new Error('Server returned non-JSON response');
        }
      }

      if (response.ok) {
        const data = await response.json().catch(() => ({}));
        // Remove conversation from local state
        setConversations(prev => prev.filter(conv => {
          const convId = typeof conv._id === 'string' ? conv._id : (typeof conv._id === 'object' && conv._id?._id ? String(conv._id._id) : null);
          return convId !== conversationIdStr;
        }));
        setUnreadCounts(prev => {
          const updated = { ...prev };
          delete updated[conversationIdStr];
          return updated;
        });
        closeDeleteModal();
        Alert.alert('Success', 'Conversation deleted successfully');
      } else {
        const errorData = await response.json().catch(() => ({ message: 'Failed to delete conversation' }));
        throw new Error(errorData.message || 'Failed to delete conversation');
      }
    } catch (error) {
      console.error('Error deleting conversation:', error);
      Alert.alert('Error', 'Network error. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  // Delete selected chats
  const deleteSelectedChats = async () => {
    if (!userData?.userId || selectedChats.length === 0) {
      Alert.alert('Error', 'No chats selected');
      return;
    }

    setDeleting(true);
    try {
      // FIXED: Extract conversationIds as strings and filter invalid ones
      const validChatIds = selectedChats
        .map(chatId => {
          if (typeof chatId === 'string') {
            if (chatId === '[object Object]' || chatId.includes('[object')) return null;
            return chatId;
          } else if (typeof chatId === 'object' && chatId !== null) {
            if (Object.keys(chatId).length === 0) return null;
            if (chatId._id) {
              const str = String(chatId._id);
              if (str !== '[object Object]' && !str.includes('[object')) return str;
            }
            return null;
          }
          return null;
        })
        .filter((id): id is string => id !== null);
      
      if (validChatIds.length === 0) {
        Alert.alert('Error', 'No valid conversations to delete');
        setDeleting(false);
        return;
      }
      
      // Delete each selected chat
      const deletePromises = validChatIds.map(chatId => 
        fetch(`${API_URL}/chat/conversation/${chatId}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ userId: userData.userId }),
        }).then(async (response) => {
          // FIXED: Handle HTML responses
          const contentType = response.headers.get('content-type');
          if (!contentType || !contentType.includes('application/json')) {
            const text = await response.text();
            return { ok: response.ok, status: response.status, data: null, isHtml: true };
          }
          const data = await response.json().catch(() => null);
          return { ok: response.ok, status: response.status, data, isHtml: false };
        })
      );

      const responses = await Promise.all(deletePromises);
      const failedDeletions = responses.filter(response => !response.ok);

      if (failedDeletions.length === 0) {
        // All deletions successful - FIXED: Use validChatIds
        setConversations(prev => prev.filter(conv => {
          const convId = typeof conv._id === 'string' ? conv._id : (typeof conv._id === 'object' && conv._id?._id ? String(conv._id._id) : null);
          return convId && !validChatIds.includes(convId);
        }));
        setUnreadCounts(prev => {
          const updated = { ...prev };
          validChatIds.forEach(id => delete updated[id]);
          return updated;
        });
        setSelectedChats([]);
        setSelectionMode(false);
        closeSelectAllModal();
        Alert.alert('Success', `Deleted ${validChatIds.length} chats successfully`);
      } else {
        Alert.alert('Error', `Failed to delete ${failedDeletions.length} chats`);
      }
    } catch (error) {
      console.error('Error deleting selected chats:', error);
      Alert.alert('Error', 'Network error. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  // Format last seen time

  const filtered = useMemo(() => {
    console.log('🔍 Filtering conversations, total:', conversations.length);
    let result = conversations;
    
    // Apply search filter if there's a search query
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = conversations.filter(c => (c.lastMessage || "").toLowerCase().includes(q));
      console.log('🔍 After search filter:', result.length);
    }
    
    console.log('✅ Final filtered conversations:', result.length);
    if (result.length > 0) {
      console.log('📋 First filtered conversation:', {
        _id: result[0]._id,
        sellerId: result[0].sellerId,
        buyerId: result[0].buyerId,
        lastMessage: result[0].lastMessage
      });
    }
    
    // Sort by most recent message time ONLY (not updatedAt - that changes on view)
    result = result.sort((a, b) => {
      // Only use actual message timestamps, NOT updatedAt (which changes on view)
      const timeA = new Date((a as any).lastMessageAt || (a as any).lastMessage?.createdAt || (a as any).lastMessage?.timestamp || 0).getTime();
      const timeB = new Date((b as any).lastMessageAt || (b as any).lastMessage?.createdAt || (b as any).lastMessage?.timestamp || 0).getTime();
      return timeB - timeA; // Most recent message first
    });
    
    // Debug: Log conversation order (only actual message times, not updatedAt)
    // console.log('📱 Chat list sorted by last message time:');
    // result.forEach((conv, index) => {
    //   const otherUser = conv.buyerId._id === userData?.userId ? conv.sellerId : conv.buyerId;
    //   const userName = otherUser.name || 'User';
    //   const lastMessageTime = new Date((conv as any).lastMessageAt || (conv as any).lastMessage?.createdAt || (conv as any).lastMessage?.timestamp || 0).toLocaleString();
    //   console.log(`${index + 1}. ${userName} - Last message: ${lastMessageTime}`);
    // });
    
    return result;
  }, [conversations, searchQuery])

  const renderChatItem = useCallback(({ item }: { item: ChatConversation }) => {
    // FIXED: Skip rendering if _id is invalid or empty object
    if (!item._id || (typeof item._id === 'object' && Object.keys(item._id).length === 0)) {
      console.warn('⚠️ Skipping conversation with invalid _id:', item._id);
      return null;
    }
    
    // Determine if current user is buyer or seller
    const currentUserId = userData?.userId;
    
    // FIXED: Handle sellerId and buyerId _id extraction
    let sellerIdStr = typeof item.sellerId === 'object' && item.sellerId?._id 
      ? (typeof item.sellerId._id === 'object' ? String(item.sellerId._id.toString ? item.sellerId._id.toString() : item.sellerId._id._id || '') : String(item.sellerId._id))
      : String(item.sellerId || '');
    
    let buyerIdStr = typeof item.buyerId === 'object' && item.buyerId?._id
      ? (typeof item.buyerId._id === 'object' ? String(item.buyerId._id.toString ? item.buyerId._id.toString() : item.buyerId._id._id || '') : String(item.buyerId._id))
      : String(item.buyerId || '');
    
    const isCurrentUserBuyer = buyerIdStr === currentUserId;
    const otherUser = isCurrentUserBuyer ? item.sellerId : item.buyerId;
    const otherUserName = (typeof otherUser === 'object' ? otherUser.name : null) || 'User';
    
    // Process avatar URL to prevent re-calculations
    const getAvatarUrl = () => {
      if (otherUser.profileImage && otherUser.profileImage.trim() !== '') {
        // Check if it's already a full URL or just filename
        if (otherUser.profileImage.startsWith('http')) {
          // Additional check: filter out known placeholder/advertisement URLs
          const isPlaceholderUrl = otherUser.profileImage.includes('randomuser.me') || 
                                  otherUser.profileImage.includes('flaticon.com') ||
                                  otherUser.profileImage.includes('tplinsurance.com') ||
                                  otherUser.profileImage.includes('placeholder') ||
                                  otherUser.profileImage.includes('default');
          
          if (isPlaceholderUrl) {
            console.log(`🚫 Filtering out placeholder URL for ${otherUserName}: ${otherUser.profileImage}`);
            return null;
          } else {
            return otherUser.profileImage;
          }
        } else {
          return `${API_URL}/uploads/profile_pics/${otherUser.profileImage}`;
        }
      }
      return null;
    };
    
    const otherUserAvatar = getAvatarUrl();
    
    const isSelected = selectedChats.includes(item._id);
    const unreadCount = unreadCounts[item._id] || 0;
    const hasUnread = unreadCount > 0;
    
    // Debug: Log unread status for this item
    if (hasUnread) {
      console.log(`🔴 Unread indicator for ${otherUserName}: ${unreadCount} unread messages`);
    }

    return (
      <TouchableOpacity 
        style={[
          styles.chatItem, 
          selectionMode && styles.chatItemSelection, 
          isSelected && styles.chatItemSelected,
          hasUnread && styles.chatItemUnread
        ]} 
        activeOpacity={1}
        onPress={async () => {
          if (selectionMode) {
            toggleChatSelection(item._id);
          } else {
            // Don't update timestamp when clicking - we want to sort by actual message activity
            
            // Immediately clear unread count for this conversation (optimistic update)
            const currentUnreadCount = unreadCounts[item._id] || 0;
            setUnreadCounts(prev => ({
              ...prev,
              [item._id]: 0
            }));
            
            // Update total unread count immediately
            setTotalUnreadCount(prev => Math.max(0, prev - currentUnreadCount));
            
            // FIXED: Extract conversationId as string - handle empty objects
            let conversationIdStr: string | null = null;
            
            // Skip if _id is invalid or empty
            if (!item._id) {
              console.error('❌ Conversation ID is null/undefined');
              return;
            }
            
            if (typeof item._id === 'string') {
              conversationIdStr = item._id;
            } else if (typeof item._id === 'object' && item._id !== null) {
              // Check if it's an empty object
              if (Object.keys(item._id).length === 0) {
                console.error('❌ Conversation ID is an empty object:', item._id);
                return;
              }
              
              if (item._id.toString && typeof item._id.toString === 'function') {
                const str = String(item._id.toString());
                if (str !== '[object Object]' && !str.includes('[object')) {
                  conversationIdStr = str;
                } else if (item._id._id) {
                  conversationIdStr = String(item._id._id);
                } else {
                  console.error('❌ Invalid conversation ID format:', item._id);
                  return;
                }
              } else if (item._id._id) {
                conversationIdStr = String(item._id._id);
              } else {
                console.error('❌ Invalid conversation ID format:', item._id);
                return;
              }
            } else {
              console.error('❌ Conversation ID is not a string or object:', item._id);
              return;
            }
            
            if (!conversationIdStr) {
              console.error('❌ Failed to extract conversation ID');
              return;
            }
            
            // Mark conversation as recently read to prevent optimistic updates
            markConversationAsRecentlyRead(conversationIdStr);
            
            // Mark conversation as read when opening (don't refresh conversations to prevent re-sorting)
            
            markConversationAsRead(conversationIdStr).then(() => {
              console.log(`✅ Marked conversation ${conversationIdStr} as read`);
              // Don't refresh conversations here - we want to keep the order based on last message time, not click time
              // Unread count is already cleared optimistically above
            }).catch(error => {
              console.log('Error marking conversation as read:', error);
            });
            
            // Reuse the same conversationIdStr for navigation
            navigation.navigate("ChatDetailScreen", { 
              conversationId: conversationIdStr, 
              chat: { 
                sellerId: item.sellerId,
                buyerId: item.buyerId,
                name: otherUserName, 
                avatar: otherUserAvatar
              } 
            });
          }
        }}
        onLongPress={() => {
          if (!selectionMode) {
            showDeleteOptions(item._id, otherUserName);
          }
        }}
      >
        <View style={styles.avatarContainer}>
          {selectionMode && (
            <View style={styles.selectionIndicator}>
              <Ionicons 
                name={isSelected ? "checkmark-circle" : "ellipse-outline"} 
                size={24} 
                color={isSelected ? COLORS.primary : COLORS.lightGray} 
              />
            </View>
          )}
          {otherUserAvatar && !avatarErrors.has(item._id) ? (
            <Image
              source={{ uri: otherUserAvatar }}
              style={styles.avatar}
              onError={() => {
                // Only add to errors set, don't remove on success to prevent flickering
                setAvatarErrors(prev => new Set(prev).add(item._id));
              }}
            />
          ) : (
            <View style={[styles.avatar, styles.avatarFallback, { backgroundColor: COLORS.primary }]}>
              <Text style={styles.avatarInitials}>
                {otherUserName.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.chatContent}>
          <View style={styles.chatHeader}>
            <View style={styles.chatNameContainer}>
              {hasUnread && (
                <View style={styles.unreadDot} />
              )}
              <Text style={[
                styles.chatName,
                hasUnread && styles.chatNameUnread
              ]}>{otherUserName}</Text>
            </View>
            {hasUnread && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadBadgeText}>
                  {unreadCount > 99 ? '99+' : unreadCount}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.chatFooter}>
            <Text style={[
              styles.chatMessage, 
              hasUnread && styles.unreadMessageText
            ]} numberOfLines={1}>
              {item.lastMessage || "Tap to view conversation"}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  }, [userData, selectedChats, selectionMode, unreadCounts, navigation, markConversationAsRead, showDeleteOptions]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top, Platform.OS === 'ios' ? 0 : 8) }]}>
        <Text style={styles.headerTitle}>Messages</Text>
        {totalUnreadCount > 0 && (
          <View style={styles.totalUnreadBadge}>
            <Text style={styles.totalUnreadBadgeText}>
              {totalUnreadCount > 99 ? '99+' : totalUnreadCount}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={COLORS.darkGray} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search messages..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery ? (
          <TouchableOpacity onPress={() => setSearchQuery("")}>
            <Ionicons name="close-circle" size={20} color={COLORS.darkGray} />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Modern Selection Controls */}
      {conversations.length > 0 && (
        <View style={styles.modernSelectionContainer}>
          {!selectionMode ? (
            <TouchableOpacity 
              style={styles.modernSelectButton} 
              onPress={toggleSelectionMode}
              activeOpacity={0.7}
            >
              <View style={styles.modernButtonContent}>
                <View style={styles.modernButtonIcon}>
                  <Ionicons name="checkmark-circle-outline" size={20} color={COLORS.black} />
                </View>
                <Text style={styles.modernSelectButtonText}>Select Messages</Text>
              </View>
            </TouchableOpacity>
          ) : (
            <View style={styles.modernSelectionPanel}>
              <View style={styles.modernSelectionHeader}>
                <View style={styles.modernSelectionInfo}>
                  <View style={styles.modernSelectionIcon}>
                    <Ionicons name="checkmark-circle" size={20} color={COLORS.primary} />
                  </View>
                  <Text style={styles.modernSelectionTitle}>
                    {selectedChats.length} Selected
                  </Text>
                </View>
                <TouchableOpacity 
                  style={styles.modernCancelButton} 
                  onPress={toggleSelectionMode}
                  activeOpacity={0.7}
                >
                  <Ionicons name="close" size={20} color={COLORS.darkGray} />
                </TouchableOpacity>
              </View>
              
              <View style={styles.modernActionButtons}>
                <TouchableOpacity 
                  style={[styles.modernActionButton, selectedChats.length === filtered.length && styles.modernActionButtonActive]} 
                  onPress={selectedChats.length === filtered.length ? deselectAllChats : selectAllChats}
                  activeOpacity={0.7}
                >
                  <View style={[styles.modernActionIcon, selectedChats.length === filtered.length && styles.modernActionIconActive]}>
                    <Ionicons 
                      name={selectedChats.length === filtered.length ? "close-circle" : "checkmark-circle"} 
                      size={18} 
                      color={selectedChats.length === filtered.length ? COLORS.white : COLORS.primary} 
                    />
                  </View>
                  <Text style={[styles.modernActionText, selectedChats.length === filtered.length && styles.modernActionTextActive]}>
                    {selectedChats.length === filtered.length ? 'Deselect All' : 'Select All'}
                  </Text>
                </TouchableOpacity>
                
                {selectedChats.length > 0 && (
                  <TouchableOpacity 
                    style={styles.modernDeleteButton} 
                    onPress={showSelectAllDeleteModal}
                    activeOpacity={0.7}
                  >
                    <View style={styles.modernDeleteIcon}>
                      <Ionicons name="trash" size={18} color={COLORS.white} />
                    </View>
                    <Text style={styles.modernDeleteText}>
                      Delete {selectedChats.length}
                    </Text>
                    <View style={styles.modernDeleteBadge}>
                      <Text style={styles.modernDeleteBadgeText}>{selectedChats.length}</Text>
                    </View>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}
        </View>
      )}

      {loading ? (
        <ActivityIndicator style={{ marginTop: 20 }} color={COLORS.primary} />
      ) : (
        <FlatList
          data={filtered.filter(item => {
            // FIXED: Filter out conversations with invalid/empty _id
            if (!item._id) {
              console.log('⚠️ Filtering out conversation - no _id:', item);
              return false;
            }
            if (typeof item._id === 'object' && Object.keys(item._id).length === 0) {
              console.log('⚠️ Filtering out conversation - empty object _id:', item);
              return false;
            }
            if (typeof item._id === 'string' && (item._id === '[object Object]' || item._id.includes('[object'))) {
              console.log('⚠️ Filtering out conversation - invalid string _id:', item._id);
              return false;
            }
            return true;
          })}
          renderItem={renderChatItem}
          keyExtractor={(item, index) => {
            // FIXED: Handle object _id properly, including empty objects
            try {
              if (item._id) {
                if (typeof item._id === 'string') {
                  return item._id;
                }
                if (typeof item._id === 'object' && item._id !== null) {
                  // Check if it's an empty object
                  if (Object.keys(item._id).length === 0) {
                    return `conv-empty-${index}-${Date.now()}`;
                  }
                  
                  if (item._id.toString && typeof item._id.toString === 'function') {
                    const str = String(item._id.toString());
                    if (str !== '[object Object]' && !str.includes('[object')) {
                      return str;
                    }
                  }
                  if (item._id._id) {
                    const str = String(item._id._id);
                    if (str !== '[object Object]' && !str.includes('[object')) {
                      return str;
                    }
                  }
                  if (item._id.$oid) {
                    return String(item._id.$oid);
                  }
                }
              }
              // Fallback: use index with timestamp for uniqueness
              return `conv-${index}-${Date.now()}`;
            } catch (error) {
              return `conv-${index}-${Date.now()}`;
            }
          }}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          removeClippedSubviews={true}
          maxToRenderPerBatch={10}
          updateCellsBatchingPeriod={50}
          initialNumToRender={10}
          windowSize={10}
          getItemLayout={(data, index) => ({
            length: 80, // Approximate height of each chat item
            offset: 80 * index,
            index,
          })}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="chatbubble-ellipses-outline" size={60} color={COLORS.lightGray} />
              <Text style={styles.emptyText}>No messages yet</Text>
              <Text style={styles.emptySubtext}>Your conversations will appear here</Text>
            </View>
          }
        />
      )}

      {/* Advanced Delete Modal */}
      <Modal
        visible={showDeleteModal}
        transparent={true}
        animationType="fade"
        onRequestClose={closeDeleteModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.deleteModal}>
            <View style={styles.modalHeader}>
              <View style={styles.warningIconContainer}>
                <Ionicons name="warning" size={32} color={COLORS.error} />
              </View>
              <Text style={styles.modalTitle}>Delete Chat</Text>
              <Text style={styles.modalSubtitle}>
                Are you sure you want to delete your conversation with{' '}
                <Text style={styles.userNameText}>{selectedChat?.name}</Text>?
              </Text>
            </View>

            <View style={styles.modalContent}>
              <Text style={styles.warningText}>
                This action cannot be undone. All messages in this conversation will be permanently deleted.
              </Text>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={styles.cancelButton} 
                onPress={closeDeleteModal}
                disabled={deleting}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.deleteButton, deleting && styles.deleteButtonDisabled]} 
                onPress={deleteConversation}
                disabled={deleting}
              >
                {deleting ? (
                  <ActivityIndicator size="small" color={COLORS.white} />
                ) : (
                  <>
                    <Ionicons name="trash" size={16} color={COLORS.white} style={styles.deleteIcon} />
                    <Text style={styles.deleteButtonText}>Delete Chat</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Select All Delete Modal */}
      <Modal
        visible={showSelectAllModal}
        transparent={true}
        animationType="fade"
        onRequestClose={closeSelectAllModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.deleteModal}>
            <View style={styles.modalHeader}>
              <View style={styles.warningIconContainer}>
                <Ionicons name="warning" size={32} color={COLORS.error} />
              </View>
              <Text style={styles.modalTitle}>Delete Selected Chats</Text>
              <Text style={styles.modalSubtitle}>
                Are you sure you want to delete{' '}
                <Text style={styles.userNameText}>{selectedChats.length}</Text> selected conversations?
              </Text>
            </View>

            <View style={styles.modalContent}>
              <Text style={styles.warningText}>
                This action cannot be undone. All messages in these conversations will be permanently deleted.
              </Text>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={styles.cancelButton} 
                onPress={closeSelectAllModal}
                disabled={deleting}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.deleteButton, deleting && styles.deleteButtonDisabled]} 
                onPress={deleteSelectedChats}
                disabled={deleting}
              >
                {deleting ? (
                  <ActivityIndicator size="small" color={COLORS.white} />
                ) : (
                  <>
                    <Ionicons name="trash" size={16} color={COLORS.white} style={styles.deleteIcon} />
                    <Text style={styles.deleteButtonText}>Delete All</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.black,
  },
  totalUnreadBadge: {
    backgroundColor: '#FF3B30',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  totalUnreadBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  // Modern Selection Styles
  modernSelectionContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.white,
  },
  modernSelectButton: {
    backgroundColor: 'transparent',
    borderRadius: 8,
  },
  modernButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  modernButtonIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  modernSelectButtonText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.black,
  },
  modernButtonArrow: {
    marginLeft: 8,
  },
  modernSelectionPanel: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E9ECEF',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  modernSelectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  modernSelectionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modernSelectionIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  modernSelectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.black,
  },
  modernCancelButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E9ECEF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modernActionButtons: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  modernActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 10,
    backgroundColor: COLORS.white,
    borderWidth: 1.5,
    borderColor: '#E9ECEF',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  modernActionButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  modernActionIcon: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#F0F8FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  modernActionIconActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  modernActionText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.primary,
  },
  modernActionTextActive: {
    color: COLORS.white,
  },
  modernDeleteButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 10,
    backgroundColor: COLORS.error,
    shadowColor: COLORS.error,
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 6,
    position: 'relative',
  },
  modernDeleteIcon: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  modernDeleteText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.white,
  },
  modernDeleteBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFD700',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  modernDeleteBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.error,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.lightGray,
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 46,
    marginHorizontal: 16,
    marginVertical: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: "100%",
    fontSize: 14,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: Platform.OS === 'ios' ? 100 : 80,
  },
  chatItem: {
    flexDirection: "row",
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
    backgroundColor: COLORS.white,
  },
  chatItemUnread: {
    backgroundColor: '#E3F2FD',
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
    paddingLeft: 12, // Adjust for border
  },
  chatItemSelection: {
    backgroundColor: '#F8F9FA',
  },
  chatItemSelected: {
    backgroundColor: '#E3F2FD',
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  selectionIndicator: {
    position: 'absolute',
    top: -2,
    left: -2,
    zIndex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 12,
  },
  avatarContainer: {
    position: "relative",
    marginRight: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  avatarFallback: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitials: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  // Advanced Delete Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  deleteModal: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: {
    alignItems: 'center',
    padding: 24,
    paddingBottom: 16,
  },
  warningIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFF5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.black,
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 16,
    color: COLORS.darkGray,
    textAlign: 'center',
    lineHeight: 22,
  },
  userNameText: {
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  modalContent: {
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  warningText: {
    fontSize: 14,
    color: COLORS.darkGray,
    textAlign: 'center',
    lineHeight: 20,
  },
  modalActions: {
    flexDirection: 'row',
    padding: 24,
    paddingTop: 16,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: COLORS.lightGray,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.darkGray,
  },
  deleteButton: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: COLORS.error,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  deleteButtonDisabled: {
    backgroundColor: '#FFB3B3',
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
    marginLeft: 6,
  },
  deleteIcon: {
    marginRight: 4,
  },
  chatContent: {
    flex: 1,
    justifyContent: "center",
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  chatNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  unreadDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.primary,
    marginRight: 10,
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  chatName: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.black,
  },
  chatNameUnread: {
    fontWeight: "700",
    color: COLORS.black,
  },
  unreadBadge: {
    backgroundColor: '#FF3B30',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
    marginLeft: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  unreadBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  unreadMessageText: {
    fontWeight: 'bold',
    color: COLORS.black,
  },
  chatFooter: {
    flexDirection: "row",
    alignItems: "center",
  },
  chatMessage: {
    flex: 1,
    fontSize: 14,
    color: COLORS.darkGray,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
    marginTop: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.darkGray,
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.darkGray,
    marginTop: 8,
  },
})

export default Chat
