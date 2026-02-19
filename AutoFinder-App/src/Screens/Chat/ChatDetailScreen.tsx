"use client"

import React,{ useState, useRef, useEffect, useCallback } from "react"
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  Dimensions,
  StatusBar,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { Ionicons } from "@expo/vector-icons"
import { COLORS } from "../../constants/colors"
import { useNavigation, useRoute } from "@react-navigation/native"
import { io } from 'socket.io-client'
import { API_URL } from "../../../config"
import { fetchMessages, sendMessage as sendMessageApi, getCurrentUserId } from "../../services/chat"
import AsyncStorage from '@react-native-async-storage/async-storage'

const { width, height } = Dimensions.get('window');
const isTablet = width >= 768;
const isSmallScreen = width < 375;

// Simple message type for TypeScript
interface MessageItem {
  _id: string;
  text: string;
  senderId: any;
  createdAt: string;
  conversationId: string;
  status?: string;
  isOptimistic?: boolean;
}

const ChatDetailScreen = () => {
  const navigation = useNavigation()
  const route = useRoute() as any
  const { chat, conversationId, adId, sellerId, propertyDetails, propertyType } = route.params || {}
  const [userId, setUserId] = useState<string | null>(null)
  const [userData, setUserData] = useState<any>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [messageIds, setMessageIds] = useState<Set<string>>(new Set())
  const [processedMessages, setProcessedMessages] = useState<Set<string>>(new Set()) // Track message IDs to prevent duplicates
  const [messageHashes, setMessageHashes] = useState<Set<string>>(new Set()) // Track message content hashes to prevent duplicates
  const [newMessage, setNewMessage] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [otherUserTyping, setOtherUserTyping] = useState(false)
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(null)
  const [isSending, setIsSending] = useState(false)
  const [lastSentMessage, setLastSentMessage] = useState<string>("")
  const [lastSentTime, setLastSentTime] = useState<number>(0)
  const [avatarLoadError, setAvatarLoadError] = useState(false)
  const [messageAvatarErrors, setMessageAvatarErrors] = useState<Set<string>>(new Set())
  
  // Memoized error handlers to prevent unnecessary re-renders
  const handleMessageAvatarError = useCallback((messageId: string) => {
    setMessageAvatarErrors(prev => {
      if (prev.has(messageId)) {
        return prev; // Don't update if already in set
      }
      return new Set(prev).add(messageId);
    });
  }, []);
  
  const handleHeaderAvatarError = useCallback(() => {
    setAvatarLoadError(prev => {
      if (prev) {
        return prev; // Don't update if already true
      }
      return true;
    });
  }, []);
  const [conversationData, setConversationData] = useState<any>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [isAtBottom, setIsAtBottom] = useState(true)
  const [isHoldingAtBottom, setIsHoldingAtBottom] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [selectedMessages, setSelectedMessages] = useState<Set<string>>(new Set())
  const [isSelectionMode, setIsSelectionMode] = useState(false)
  const [isLoadingProperty, setIsLoadingProperty] = useState(false)
  const [hasMarkedAsRead, setHasMarkedAsRead] = useState(false) // Track if messages have been marked as read
  const messagesReadTimeoutRef = useRef<NodeJS.Timeout | null>(null) // Track timeout for marking as read

  // Refs
  const flatListRef = useRef<FlatList>(null)
  const socketRef = useRef<any>(null)

  // Function to detect and handle property links
  const handlePropertyLink = async (text: string) => {
    const propertyLinkRegex = /https:\/\/autofinder\.app\/property\/([a-f0-9]+)/i;
    const match = text.match(propertyLinkRegex);
    
    if (match) {
      const propertyId = match[1];
      console.log('🔗 Property link detected:', propertyId);
      
      // Check if we have property details available
      if (propertyDetails && propertyDetails._id === propertyId) {
        console.log('✅ Using available property details:', propertyDetails);
        // Navigate using the available property details
        if (propertyType === 'bike') {
          (navigation as any).navigate('BikeDetails', { carDetails: propertyDetails });
        } else if (propertyType === 'car') {
          (navigation as any).navigate('CarDetails', { carDetails: propertyDetails });
        } else {
          // Default to car details
          (navigation as any).navigate('CarDetails', { carDetails: propertyDetails });
        }
      } else {
        console.log('⚠️ Property details not available, fetching from server');
        setIsLoadingProperty(true);
        try {
          // Try to fetch property details from server using the ID
          // Use the universal all_ads endpoint that searches across all collections
          console.log('🔍 Fetching property data from server for ID:', propertyId);
          const response = await fetch(`${API_URL}/all_ads/${propertyId}`);
          
          if (response.ok) {
            const propertyData = await response.json();
            console.log('✅ Fetched property data from server:', propertyData);
            
            // Determine property type based on the data
            let propertyType = 'car'; // Default to car
            if (propertyData.category === 'bike' || propertyData.type === 'bike') {
              propertyType = 'bike';
            }
            
            // Navigate with fetched property details
            if (propertyType === 'bike') {
              (navigation as any).navigate('BikeDetails', { carDetails: propertyData });
            } else {
              (navigation as any).navigate('CarDetails', { carDetails: propertyData });
            }
          } else {
            console.log('❌ Failed to fetch property data from server');
            // Fallback: try to navigate with just the ID
            (navigation as any).navigate('CarDetails', { 
              carDetails: { _id: propertyId } 
            });
          }
        } catch (error) {
          console.log('❌ Error fetching property data:', error);
          // Fallback: try to navigate with just the ID
          (navigation as any).navigate('CarDetails', { 
            carDetails: { _id: propertyId } 
          });
        } finally {
          setIsLoadingProperty(false);
        }
      }
    }
  };

  // Function to check if a message is unread
  const isMessageUnread = (message: any) => {
    if (!message || !conversationData) return false;
    
    // Only check unread status for messages from other users
    const senderId = typeof message.senderId === 'string' ? message.senderId : message.senderId?._id;
    if (senderId === userId) return false; // User's own messages are always "read"
    
    // Check if message was created after lastReadAt
    const lastReadAt = conversationData.lastReadAt ? new Date(conversationData.lastReadAt) : null;
    if (!lastReadAt) return true; // If never read, all messages are unread
    
    const messageTime = new Date(message.createdAt || message.timestamp || 0);
    return messageTime > lastReadAt;
  };

  // Function to render message text with clickable links
  const renderMessageText = (text: string, isUnread: boolean = false, isUser: boolean = false) => {
    const propertyLinkRegex = /(https:\/\/autofinder\.app\/property\/[a-f0-9]+)/gi;
    const parts = text.split(propertyLinkRegex);
    
    // Text color: white for user messages (light red background), default for others
    const textColor = isUser ? COLORS.white : undefined;
    
    return parts.map((part, index) => {
      // Reset regex for each part
      const linkRegex = /^https:\/\/autofinder\.app\/property\/[a-f0-9]+$/i;
      if (linkRegex.test(part)) {
        return (
          <TouchableOpacity 
            key={index}
            onPress={() => handlePropertyLink(part)}
            disabled={isLoadingProperty}
          >
            <Text style={{ 
              color: isLoadingProperty ? '#999' : '#2196F3', 
              textDecorationLine: 'underline',
              fontWeight: isUnread ? 'bold' : 'normal'
            }}>
              {isLoadingProperty ? 'Loading...' : part}
            </Text>
          </TouchableOpacity>
        );
      }
      return (
        <Text 
          key={index} 
          style={{ 
            fontWeight: isUnread ? 'bold' : 'normal',
            color: textColor
          }}
        >
          {part}
        </Text>
      );
    });
  };

  // Function to create a unique hash for message deduplication
  const createMessageHash = (message: any) => {
    const text = message.text || '';
    const senderId = typeof message.senderId === 'string' ? message.senderId : message.senderId?._id || '';
    const timestamp = new Date(message.createdAt).getTime();
    const conversationId = message.conversationId || '';
    
    // Create a simple hash from the message content
    return `${senderId}_${text}_${timestamp}_${conversationId}`;
  };

  // Ultra-aggressive message deduplication function
  const deduplicateMessages = (messages: any[]) => {
    const seen = new Set<string>();
    const deduplicated = [];
    
    for (const message of messages) {
      const hash = createMessageHash(message);
      const id = message._id;
      
      // Check both hash and ID to prevent duplicates
      if (!seen.has(hash) && !seen.has(id)) {
        seen.add(hash);
        seen.add(id);
        deduplicated.push(message);
      } else {
        console.log('🚫 Removing duplicate message:', { hash, id, text: message.text });
      }
    }
    
    return deduplicated;
  }

  // Format last seen time
  const formatLastSeen = (lastSeen: string | Date) => {
    if (!lastSeen) return 'recently';
    
    const now = new Date();
    const lastSeenDate = new Date(lastSeen);
    const diffInMinutes = Math.floor((now.getTime() - lastSeenDate.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    
    return lastSeenDate.toLocaleDateString();
  };
  // Handle typing detection
  const handleTyping = () => {
    if (!conversationId || !userId) return;
    
    // Emit typing event
    socketRef.current?.emit('typing', {
      conversationId,
      userId,
      isTyping: true
    });
    
    // Clear existing timeout
    if (typingTimeout) {
      clearTimeout(typingTimeout);
    }
    
    // Set new timeout to stop typing after 2 seconds
    const timeout = setTimeout(() => {
      socketRef.current?.emit('typing', {
        conversationId,
        userId,
        isTyping: false
      });
    }, 2000);
    
    setTypingTimeout(timeout);
  };

  // Handle text input change
  const handleTextChange = (text: string) => {
    setNewMessage(text);
    if (text.length > 0) {
      handleTyping();
    }
  };

  // Fetch conversation data with online status
  const fetchConversationData = async (convId: string) => {
    try {
      const response = await fetch(`${API_URL}/chat/conversations/${userId}`)
      // Handle 404 gracefully - endpoint might not exist
      if (response.status === 404) {
        console.log('⚠️ Chat conversations endpoint not found (404)');
        return;
      }
      if (response.ok) {
        const conversations = await response.json()
        const currentConv = conversations.find((conv: any) => conv._id === convId)
        if (currentConv) {
          setConversationData(currentConv)
          // Update lastReadAt immediately when fetching conversation data to mark messages as read
          // This ensures bold styling is removed when user views the chat
          if (currentConv.lastReadAt) {
            // lastReadAt is already set, no need to update
          } else {
            // If lastReadAt is not set, update it to current time
            setConversationData((prev: any) => {
              if (prev && prev._id === convId) {
                return {
                  ...prev,
                  lastReadAt: new Date().toISOString()
                };
              }
              return prev;
            });
          }
        }
      }
    } catch (error) {
      // Suppress network errors - they're expected when backend is not available
      if (!error?.message?.includes('Failed to fetch') && !error?.message?.includes('Network request failed')) {
        console.log('Error fetching conversation data:', error)
      }
    }
  }

  useEffect(() => {
    (async () => {
      const uid = await getCurrentUserId()
      setUserId(uid)
      
      // Fetch user data from AsyncStorage
      try {
        const storedUserData = await AsyncStorage.getItem('user')
        if (storedUserData) {
          const parsedData = JSON.parse(storedUserData)
          setUserData(parsedData)
        }
      } catch (error) {
        console.log('Error fetching user data:', error)
      }
      
      // Clear messages when switching conversations
      setMessages([])
      
      // If conversationId provided, load messages; otherwise Chat list should start conversation and pass it here
      if (conversationId) {
        try {
          const msgs = await fetchMessages(conversationId)
          // Apply aggressive deduplication to loaded messages
          const deduplicatedMsgs = deduplicateMessages(msgs);
          
          // Sort messages by creation time (oldest first, newest last)
          const sortedMsgs = deduplicatedMsgs.sort((a, b) => {
            const timeA = new Date(a.createdAt || 0).getTime()
            const timeB = new Date(b.createdAt || 0).getTime()
            return timeA - timeB // Oldest first (ascending order)
          })
          setMessages(sortedMsgs)
          
          // Update message IDs set
          const ids = new Set<string>(sortedMsgs.map(msg => msg._id).filter((id): id is string => typeof id === 'string'))
          setMessageIds(ids)
          
          // Debug: Log message order
          console.log('📱 Messages loaded in order:')
          sortedMsgs.forEach((msg, index) => {
            console.log(`${index + 1}. ${msg.text} - ${new Date(msg.createdAt || 0).toLocaleTimeString()}`)
          })
          
          // Fetch conversation data with online status
          await fetchConversationData(conversationId)
          
          // CRITICAL: Scroll to bottom (last message) after messages are loaded
          // Use multiple methods to ensure it works reliably and immediately
          if (sortedMsgs.length > 0) {
            const lastIndex = sortedMsgs.length - 1;
            
            // Immediate scroll attempt - use scrollToOffset for instant scroll
            setTimeout(() => {
              if (flatListRef.current) {
                // Calculate approximate offset for last message
                const estimatedOffset = lastIndex * 80; // 80 is approximate message height
                try {
                  flatListRef.current.scrollToOffset({ 
                    offset: estimatedOffset, 
                    animated: false 
                  });
                } catch (e) {
                  // Fallback methods
                }
              }
            }, 50);
            
            // Method 1: Use scrollToIndex for more reliable scrolling
            setTimeout(() => {
              try {
                flatListRef.current?.scrollToIndex({ 
                  index: lastIndex, 
                  animated: false,
                  viewPosition: 1 // 1 = bottom of viewport
                });
              } catch (e) {
                // Fallback to scrollToEnd if scrollToIndex fails
                flatListRef.current?.scrollToEnd({ animated: false });
              }
            }, 150);
            
            // Method 2: Multiple scrollToEnd attempts as backup
            setTimeout(() => {
              flatListRef.current?.scrollToEnd({ animated: false });
            }, 300);
            setTimeout(() => {
              flatListRef.current?.scrollToEnd({ animated: false });
            }, 500);
            setTimeout(() => {
              flatListRef.current?.scrollToEnd({ animated: false });
            }, 700);
            setTimeout(() => {
              flatListRef.current?.scrollToEnd({ animated: true });
            }, 900);
          }
        } catch {}
      }
      // FIXED: Disconnect previous socket if exists
      if (socketRef.current) {
        socketRef.current.removeAllListeners()
        socketRef.current.disconnect()
        socketRef.current = null
      }
      
      // FIXED: Connect socket with token authentication - prevent multiple connections
      let socket: any = null;
      try {
        const storedUserData = await AsyncStorage.getItem('user');
        const token = storedUserData ? JSON.parse(storedUserData).token : null;
        
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
        
        // Handle connection errors
        socket.on('connect_error', (error: any) => {
          console.log('⚠️ Socket connection error:', error.message);
          // Don't reconnect if rate limited
          if (error.message?.includes('Too many connection attempts')) {
            console.log('⏭️ Rate limited, will not reconnect');
            socket.disconnect();
          }
        });
        
        socket.on('connect', () => {
          console.log('✅ Socket connected successfully');
        });
        
        socket.on('disconnect', () => {
          console.log('⚠️ Socket disconnected');
        });
      } catch (error) {
        console.error('Error initializing socket:', error);
        // Fallback: connect without token (may be rejected by backend)
        socket = io(API_URL, { 
          transports: ['websocket'],
          reconnection: false // Disable reconnection for fallback
        });
      }
      
      socketRef.current = socket
      if (conversationId) {
        socket.on(`chat:${conversationId}`, (msg: any) => {
          console.log('📨 Socket message received:', {
            id: msg._id,
            text: msg.text,
            senderId: msg.senderId?._id,
            userId: userId,
            isFromCurrentUser: msg.senderId?._id === userId
          });
          
          // COMPLETELY IGNORE messages from current user via socket
          // Only handle messages from other users to prevent duplicates
          const msgSenderId = typeof msg.senderId === 'object' ? msg.senderId?._id : msg.senderId;
          const currentUserIdStr = String(userId || '');
          const msgSenderIdStr = String(msgSenderId || '');
          
          if (msgSenderIdStr === currentUserIdStr) {
            console.log('🚫 Ignoring socket message from current user to prevent duplicates');
            return;
          }
          
          // Only process messages from other users
          setMessages(prev => {
            // Create message hash for deduplication
            const messageHash = createMessageHash(msg);
            
            // Check if message hash already exists
            if (messageHashes.has(messageHash)) {
              console.log('❌ Message hash already exists:', messageHash);
              return prev;
            }
            
            // Check if message ID already exists
            if (messageIds.has(msg._id)) {
              console.log('❌ Message ID already exists:', msg._id);
              return prev;
            }
            
            console.log('➕ Adding message from other user');
            const messageWithStatus = {
              ...msg,
              status: 'received',
              isOptimistic: false
            };
            
            const newMessages = [...prev, messageWithStatus];
            
            // Apply aggressive deduplication
            const deduplicatedMessages = deduplicateMessages(newMessages);
            
            // Sort messages by creation time to maintain proper order
            const sortedMessages = deduplicatedMessages.sort((a, b) => {
              const timeA = new Date(a.createdAt || 0).getTime()
              const timeB = new Date(b.createdAt || 0).getTime()
              return timeA - timeB // Oldest first (ascending order)
            })
            
            // Always scroll to bottom when new message arrives
            setTimeout(() => {
              flatListRef.current?.scrollToEnd({ animated: true })
            }, 50)
            
            // Second attempt to ensure scroll completes
            setTimeout(() => {
              flatListRef.current?.scrollToEnd({ animated: true })
            }, 200)
            
            // Update message IDs set
            setMessageIds(prevIds => {
              const newIds = new Set(prevIds);
              sortedMessages.forEach(m => {
                if (m._id) newIds.add(m._id);
              });
              return newIds;
            });
            
            // Update message hashes set
            setMessageHashes(prevHashes => {
              const newHashes = new Set(prevHashes);
              sortedMessages.forEach(m => {
                const hash = createMessageHash(m);
                newHashes.add(hash);
              });
              return newHashes;
            });
            
            return sortedMessages;
          });
        })
        
        // Listen for typing events
        socket.on('typing', (data: any) => {
          if (data.conversationId === conversationId && data.userId !== userId) {
            setOtherUserTyping(data.isTyping);
          }
        });
        
        // Listen for message read events
        socket.on('messageRead', (data: any) => {
          if (data.conversationId === conversationId) {
            // Update message status to read
            setMessages(prev => prev.map(msg => 
              msg.conversationId === conversationId && msg.senderId._id === userId
                ? { ...msg, status: 'read' }
                : msg
            ));
          }
        });
        
        // DO NOT mark messages as read immediately when user opens chat
        // Only mark as read when user has actually viewed the messages
        // This preserves bold styling for unread messages until user actually reads them
        
        // Listen for read confirmation to update conversationData
        socket.on('messagesRead', (data: any) => {
          if (data.conversationId === conversationId) {
            // Update conversationData with new lastReadAt to remove bold styling
            setConversationData((prev: any) => {
              if (prev && prev._id === conversationId) {
                return {
                  ...prev,
                  lastReadAt: data.lastReadAt || new Date().toISOString()
                };
              }
              return prev;
            });
            setHasMarkedAsRead(true); // Mark that messages have been read
          }
        });
        
        // Listen for message deletion events (when other user deletes their messages)
        socket.on(`messagesDeleted:${conversationId}`, (data: any) => {
          console.log('🗑️ Messages deleted by other user:', data.deletedMessageIds);
          // Remove deleted messages from local state
          setMessages(prev => {
            const filtered = prev.filter(msg => !data.deletedMessageIds.includes(msg._id));
            console.log(`✅ Removed ${prev.length - filtered.length} deleted messages from view`);
            return filtered;
          });
          
          // Also remove from message IDs set
          setMessageIds(prevIds => {
            const newIds = new Set(prevIds);
            data.deletedMessageIds.forEach((id: string) => {
              newIds.delete(id);
            });
            return newIds;
          });
          
          // Also remove from message hashes set
          setMessageHashes(prevHashes => {
            const newHashes = new Set(prevHashes);
            // We need to find the messages to get their hashes, but since they're deleted,
            // we'll just clear hashes that might match (this is a cleanup step)
            return newHashes;
          });
          
          // If conversation was deleted (all messages deleted), navigate back to chat list
          if (data.conversationDeleted) {
            console.log('🗑️ Conversation deleted (all messages removed), navigating back to chat list');
            setTimeout(() => {
              navigation.goBack();
            }, 500); // Small delay to show the deletion
          }
        });
        
        // Listen for conversation deletion events
        socket.on(`conversationDeleted:${conversationId}`, (data: any) => {
          console.log('🗑️ Conversation deleted via socket:', data);
          // Navigate back to chat list
          setTimeout(() => {
            navigation.goBack();
          }, 500);
        });
      }
    })()
    return () => {
      if (socketRef.current) socketRef.current.disconnect()
      // Clean up timeout when component unmounts
      if (messagesReadTimeoutRef.current) {
        clearTimeout(messagesReadTimeoutRef.current)
      }
    }
  }, [conversationId])

  // Mark messages as read when user has viewed them (after scrolling to bottom or after delay)
  useEffect(() => {
    if (!conversationId || !userId || hasMarkedAsRead) return

    // Clear any existing timeout
    if (messagesReadTimeoutRef.current) {
      clearTimeout(messagesReadTimeoutRef.current);
    }

    // Mark messages as read after user has been viewing the chat for 2 seconds
    // This ensures user has actually seen the messages before removing bold styling
    messagesReadTimeoutRef.current = setTimeout(() => {
      if (socketRef.current && !hasMarkedAsRead) {
        console.log('✅ ChatDetailScreen: Marking messages as read - user has viewed chat');
        socketRef.current.emit('markAsRead', {
          conversationId,
          userId,
          timestamp: new Date().toISOString()
        });
      }
    }, 2000); // 2 second delay to ensure user has viewed messages

    return () => {
      if (messagesReadTimeoutRef.current) {
        clearTimeout(messagesReadTimeoutRef.current);
      }
    };
  }, [conversationId, userId, hasMarkedAsRead, messages.length]); // Re-trigger when messages change


  // Refresh conversation data periodically to update online status
  useEffect(() => {
    if (!conversationId || !userId) return

    const interval = setInterval(() => {
      fetchConversationData(conversationId)
      // DO NOT update lastReadAt here - only update when user actually reads messages
      // This preserves bold styling for unread messages
    }, 30000) // Refresh every 30 seconds

    return () => clearInterval(interval)
  }, [conversationId, userId])

  // Scroll to bottom when conversation changes (user clicks on chat)
  useEffect(() => {
    if (conversationId && messages.length > 0) {
      // When conversation changes, immediately scroll to bottom (last message)
      // Use multiple methods to ensure it works
      const lastIndex = messages.length - 1;
      
      // Immediate scroll using scrollToOffset
      setTimeout(() => {
        if (flatListRef.current) {
          const estimatedOffset = lastIndex * 80;
          try {
            flatListRef.current.scrollToOffset({ 
              offset: estimatedOffset, 
              animated: false 
            });
          } catch (e) {
            // Fallback
          }
        }
      }, 50);
      
      // Scroll using scrollToIndex
      const scrollTimeout1 = setTimeout(() => {
        if (flatListRef.current && messages.length > 0) {
          try {
            flatListRef.current.scrollToIndex({ 
              index: lastIndex, 
              animated: false,
              viewPosition: 1 // Bottom of viewport
            });
          } catch (e) {
            flatListRef.current.scrollToEnd({ animated: false });
          }
        }
      }, 200);
      
      // Backup scrollToEnd
      const scrollTimeout2 = setTimeout(() => {
        if (flatListRef.current && messages.length > 0) {
          flatListRef.current.scrollToEnd({ animated: false });
        }
      }, 400);
      
      const scrollTimeout3 = setTimeout(() => {
        if (flatListRef.current && messages.length > 0) {
          flatListRef.current.scrollToEnd({ animated: false });
        }
      }, 600);
      
      return () => {
        clearTimeout(scrollTimeout1);
        clearTimeout(scrollTimeout2);
        clearTimeout(scrollTimeout3);
      };
    }
  }, [conversationId, messages.length]) // Trigger when conversationId changes (user clicks on different chat)

  useEffect(() => {
    if (flatListRef.current && messages.length > 0) {
      // Always scroll to bottom (last message) when messages change
      // Use scrollToIndex for more reliable scrolling
      setTimeout(() => {
        try {
          const lastIndex = messages.length - 1;
          flatListRef.current?.scrollToIndex({ 
            index: lastIndex, 
            animated: true,
            viewPosition: 1 // Bottom of viewport
          });
        } catch (e) {
          // Fallback to scrollToEnd
          flatListRef.current?.scrollToEnd({ animated: true });
        }
      }, 100);
      
      // Second attempt after a longer delay to ensure scroll completes
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 300);
    }
  }, [messages.length]) // Only depend on messages.length to trigger on new messages

  // Refresh user data periodically to ensure names are up-to-date
  useEffect(() => {
    const refreshUserData = async () => {
      try {
        const storedUserData = await AsyncStorage.getItem('user')
        if (storedUserData) {
          const parsedData = JSON.parse(storedUserData)
          setUserData(parsedData)
        }
      } catch (error) {
        console.log('Error refreshing user data:', error)
      }
    };

    // Refresh user data every 30 seconds
    const interval = setInterval(refreshUserData, 60000); // Reduced from 30s to 60s
    
    return () => clearInterval(interval);
  }, []);

  // Handle scroll events to detect if at bottom (debounced)
  const handleScroll = (event: any) => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent
    const atBottom = contentOffset.y + layoutMeasurement.height >= contentSize.height - 20
    
    // Only update state if the value actually changed to prevent unnecessary re-renders
    if (atBottom !== isAtBottom) {
      setIsAtBottom(atBottom)
    }
    
    // Mark messages as read when user scrolls to bottom
    if (atBottom && !hasMarkedAsRead && socketRef.current && conversationId && userId) {
      console.log('✅ ChatDetailScreen: User scrolled to bottom, marking messages as read');
      socketRef.current.emit('markAsRead', {
        conversationId,
        userId,
        timestamp: new Date().toISOString()
      });
    }
  }

  // Refresh messages
  const onRefresh = async () => {
    if (!conversationId) return
    
    setRefreshing(true)
    try {
      const msgs = await fetchMessages(conversationId)
      const deduplicatedMsgs = deduplicateMessages(msgs);
      setMessages(deduplicatedMsgs)
    } catch (error) {
      console.error('Failed to refresh messages:', error)
    } finally {
      setRefreshing(false)
    }
  }

  // Handle touch start at bottom
  const handleTouchStart = () => {
    if (isAtBottom) {
      setIsHoldingAtBottom(true)
    }
  }

  // Handle touch end at bottom
  const handleTouchEnd = () => {
    // Remove automatic refresh to prevent constant refreshing
    // Users can use pull-to-refresh if they want to refresh
    setIsHoldingAtBottom(false)
  }

  // Handle touch cancel
  const handleTouchCancel = () => {
    setIsHoldingAtBottom(false)
  }

  // Menu functions
  const toggleMenu = () => {
    setShowMenu(!showMenu)
  }

  const startSelectionMode = () => {
    setIsSelectionMode(true)
    setShowMenu(false)
  }

  const exitSelectionMode = () => {
    setIsSelectionMode(false)
    setSelectedMessages(new Set())
  }

  const toggleMessageSelection = (messageId: string) => {
    setSelectedMessages(prev => {
      const newSet = new Set(prev)
      if (newSet.has(messageId)) {
        newSet.delete(messageId)
      } else {
        newSet.add(messageId)
      }
      return newSet
    })
  }

  const selectAllMessages = () => {
    const allMessageIds = messages.map(msg => msg._id).filter(Boolean)
    setSelectedMessages(new Set(allMessageIds))
  }

  const deleteSelectedMessages = async () => {
    if (selectedMessages.size === 0 || !userId || !conversationId) return

    try {
      const messageIdsArray = Array.from(selectedMessages)
      console.log('🗑️ Deleting messages:', messageIdsArray)
      
      // Call backend API to delete messages
      const response = await fetch(`${API_URL}/chat/messages/delete`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messageIds: messageIdsArray,
          userId: userId,
          conversationId: conversationId
        })
      })
      
      // Check if response is JSON before parsing
      const contentType = response.headers.get('content-type')
      let data
      
      if (contentType && contentType.includes('application/json')) {
        data = await response.json()
      } else {
        // If not JSON, get text response
        const text = await response.text()
        console.error('❌ Server returned non-JSON response:', text.substring(0, 200))
        throw new Error(`Server returned non-JSON response: ${response.status}`)
      }
      
      if (response.ok) {
        console.log('✅ Messages deleted successfully:', data.deletedCount)
        // Remove deleted messages from local state
        setMessages(prev => prev.filter(msg => !selectedMessages.has(msg._id)))
        setSelectedMessages(new Set())
        setIsSelectionMode(false)
      } else {
        console.error('❌ Failed to delete messages:', data.message || data.error)
        // Show error to user
        alert(data.message || data.error || 'Failed to delete messages')
      }
    } catch (error) {
      console.error('❌ Error deleting messages:', error)
      alert('Failed to delete messages. Please try again.')
    }
  }

  // Profile navigation function
  const navigateToProfile = (userProfile: any) => {
    if (!userProfile) return
    
    // Navigate to UserProfileDetails screen
    (navigation as any).navigate('UserProfileDetails', {
      userProfile: userProfile,
      userId: userProfile._id || userProfile.id,
      userName: userProfile.name,
      userImage: userProfile.profileImage || userProfile.avatar
    })
  }






  const sendMessage = async () => {
    if (!newMessage.trim() || !userId || !conversationId || isSending) return
    
    const messageText = newMessage.trim()
    const currentTime = Date.now()
    
    // Prevent duplicate sending within 2 seconds
    if (lastSentMessage === messageText && (currentTime - lastSentTime) < 2000) {
      console.log('❌ Preventing duplicate message send:', messageText);
      return;
    }
    
    console.log('📤 Sending message:', messageText);
    
    setIsSending(true)
    setLastSentMessage(messageText)
    setLastSentTime(currentTime)
    setNewMessage("")
    
    // Create a unique temporary ID with timestamp and random component
    const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Add optimistic message with "sent" status
    const optimisticMessage = {
      _id: tempId,
      conversationId,
      senderId: { 
        _id: userId, 
        name: userData?.name || userData?.userName || 'You', 
        profileImage: userData?.profileImage || undefined 
      }, 
      text: messageText,
      createdAt: new Date().toISOString(),
      status: 'sent',
      isOptimistic: true // Flag to identify optimistic messages
    }
    
    // Create hash for optimistic message
    const optimisticHash = createMessageHash(optimisticMessage);
    
    console.log('➕ Adding optimistic message:', optimisticMessage._id);
    setMessages(prev => {
      const newMessages = [...prev, optimisticMessage];
      return deduplicateMessages(newMessages);
    })
    
    // Update message IDs set
    setMessageIds(prevIds => {
      const newIds = new Set(prevIds);
      newIds.add(optimisticMessage._id);
      return newIds;
    });
    
    // Update message hashes set
    setMessageHashes(prevHashes => {
      const newHashes = new Set(prevHashes);
      newHashes.add(optimisticHash);
      return newHashes;
    });
    
    // Always scroll to bottom when sending message
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true })
    }, 100)
    
    // Second attempt to ensure scroll completes
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true })
    }, 300)
    
    // Force re-render to show optimistic message
    console.log('📱 Current messages count after optimistic add:', messages.length + 1);
    
    try {
      // FIXED: If conversationId is temporary (temp_*), include buyerId/sellerId
      const isTempConversation = conversationId && typeof conversationId === 'string' && conversationId.startsWith('temp_');
      
      const msg: any = { 
        conversationId, 
        senderId: { 
          _id: userId, 
          name: 'You', 
          profileImage: undefined 
        }, 
        text: messageText 
      };
      
      // FIXED: If temp conversation OR no valid conversationId, add buyerId/sellerId from route params
      // Also check conversationData for sellerId if route params don't have it
      // Check if conversationId is valid MongoDB ObjectId format (24 hex chars)
      const isValidObjectId = conversationId && typeof conversationId === 'string' && 
        /^[0-9a-fA-F]{24}$/.test(conversationId);
      const needsBuyerSellerIds = isTempConversation || !conversationId || !isValidObjectId;
      
      if (needsBuyerSellerIds) {
        // Try multiple sources for sellerId
        let effectiveSellerId = sellerId || route.params?.sellerId;
        
        // If not in route params, try to get from conversationData
        if (!effectiveSellerId && conversationData) {
          if (conversationData.sellerId) {
            effectiveSellerId = typeof conversationData.sellerId === 'object' 
              ? conversationData.sellerId._id || conversationData.sellerId.id
              : conversationData.sellerId;
          } else if (conversationData.buyerId) {
            // If current user is buyer, seller is the other person
            const buyerIdStr = typeof conversationData.buyerId === 'object' 
              ? conversationData.buyerId._id || conversationData.buyerId.id
              : conversationData.buyerId;
            if (buyerIdStr !== userId) {
              effectiveSellerId = buyerIdStr; // Other person is seller
            }
          }
        }
        
        // If still no sellerId, try to get from chat object
        if (!effectiveSellerId && route.params?.chat) {
          const chatObj = route.params.chat;
          if (chatObj.sellerId) {
            effectiveSellerId = typeof chatObj.sellerId === 'object' 
              ? chatObj.sellerId._id || chatObj.sellerId.id
              : chatObj.sellerId;
          }
        }
        
        if (effectiveSellerId) {
          const effectiveBuyerId = userId; // Current user is the buyer
          const effectiveAdId = adId || route.params?.adId;
          
          msg.buyerId = effectiveBuyerId;
          msg.sellerId = effectiveSellerId;
          if (effectiveAdId) {
            msg.adId = effectiveAdId;
          }
          
          console.log('📤 Sending message with buyerId/sellerId:', {
            buyerId: effectiveBuyerId,
            sellerId: effectiveSellerId,
            adId: effectiveAdId,
            isTempConversation
          });
        } else {
          console.warn('⚠️ Cannot send message: sellerId not found in route params or conversation data');
        }
      }
      
      console.log('🌐 Calling sendMessageApi...');
      const sentMessage = await sendMessageApi(msg)
      console.log('✅ Message sent successfully:', sentMessage);
      console.log('✅ Sent message _id:', sentMessage._id);
      console.log('✅ Sent message text:', sentMessage.text);
      
      // FIXED: Update optimistic message with real message data
      // Ensure sentMessage has proper structure
      const realMessage = {
        _id: sentMessage._id || sentMessage.id || tempId,
        conversationId: sentMessage.conversationId || conversationId,
        senderId: sentMessage.senderId || {
          _id: userId,
          name: userData?.name || userData?.userName || 'You',
          profileImage: userData?.profileImage || undefined
        },
        text: sentMessage.text || messageText,
        createdAt: sentMessage.createdAt || new Date().toISOString(),
        updatedAt: sentMessage.updatedAt || new Date().toISOString(),
        status: 'delivered',
        isOptimistic: false
      };
      
      console.log('🔄 Replacing optimistic message with real message:', {
        tempId,
        realId: realMessage._id,
        text: realMessage.text
      });
      
      // Update optimistic message with real message data
      setMessages(prev => {
        console.log('🔄 Replacing optimistic message, prev count:', prev.length);
        
        // First, remove the optimistic message
        const withoutOptimistic = prev.filter(m => {
          const keep = m._id !== tempId;
          if (!keep) {
            console.log('🗑️ Removing optimistic message:', m._id, m.text);
          }
          return keep;
        });
        
        console.log('📊 After removing optimistic, count:', withoutOptimistic.length);
        
        // Check if real message already exists (from socket)
        const alreadyExists = withoutOptimistic.some(m => {
          const realId = realMessage._id;
          const matchesId = m._id === realId;
          const matchesTextAndTime = m.text === realMessage.text && 
                 Math.abs(new Date(m.createdAt).getTime() - new Date(realMessage.createdAt).getTime()) < 5000;
          
          if (matchesId || matchesTextAndTime) {
            console.log('✅ Found existing real message:', { 
              existingId: m._id, 
              realId: realMessage._id,
              matchesId,
              matchesTextAndTime
            });
          }
          
          return matchesId || matchesTextAndTime;
        });
        
        if (alreadyExists) {
          console.log('✅ Real message already exists in list (from socket), skipping add');
          return withoutOptimistic;
        }
        
        // Add real message
        console.log('➕ Adding real message to list:', realMessage._id, realMessage.text);
        const newMessages = [...withoutOptimistic, realMessage];
        const deduplicated = deduplicateMessages(newMessages);
        
        // Sort by creation time
        const sorted = deduplicated.sort((a, b) => {
          const timeA = new Date(a.createdAt || 0).getTime();
          const timeB = new Date(b.createdAt || 0).getTime();
          return timeA - timeB;
        });
        
        console.log('✅ Updated messages list, total:', sorted.length);
        console.log('📋 Last 3 messages:', sorted.slice(-3).map(m => ({ id: m._id, text: m.text?.substring(0, 20) })));
        return sorted;
      });
      
      // Update message IDs set
      setMessageIds(prevIds => {
        const newIds = new Set(prevIds);
        newIds.delete(tempId); // Remove temp ID
        if (realMessage._id) {
          newIds.add(realMessage._id); // Add real ID
          console.log('✅ Updated message IDs, added:', realMessage._id);
        }
        return newIds;
      });
      
      // Update message hashes set
      setMessageHashes(prevHashes => {
        const newHashes = new Set(prevHashes);
        newHashes.delete(optimisticHash); // Remove optimistic hash
        const realHash = createMessageHash(realMessage);
        newHashes.add(realHash); // Add real hash
        return newHashes;
      });
      
    } catch (e) {
      console.error('❌ Failed to send message:', e)
      // Remove optimistic message on error
      setMessages(prev => prev.filter(m => m._id !== tempId))
      setMessageIds(prevIds => {
        const newIds = new Set(prevIds);
        newIds.delete(tempId);
        return newIds;
      });
      setMessageHashes(prevHashes => {
        const newHashes = new Set(prevHashes);
        newHashes.delete(optimisticHash);
        return newHashes;
      });
      // Restore the message text on error
      setNewMessage(messageText)
    } finally {
      setIsSending(false)
    }
  }

  // Use conversationData if available, otherwise fall back to chat
  const currentData = conversationData || chat
  
  // Determine which user is the "other user" (the one you're chatting with)
  const currentUserId = userId
  const isCurrentUserBuyer = currentData?.buyerId?._id === currentUserId
  const otherUser = isCurrentUserBuyer ? currentData?.sellerId : currentData?.buyerId
  
  const display = {
    name: otherUser?.name || 'Unknown',
    avatar: otherUser?.profileImage || null,
    online: otherUser?.isOnline || false,
    lastSeen: otherUser?.lastSeen || new Date()
  }
  
  // Debug logging removed to reduce console noise

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      
      {/* Modern Header with Gradient Background */}
      <View style={styles.header}>
        <View style={styles.headerGradient}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={isTablet ? 28 : 24} color={COLORS.white} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.headerProfile}
            onPress={() => navigateToProfile(display)}
            activeOpacity={1}
          >
            <View style={styles.avatarContainer}>
              {display.avatar && display.avatar.trim() !== '' && !avatarLoadError ? (
                <Image
                  source={{ 
                    uri: display.avatar.startsWith('http') 
                      ? display.avatar 
                      : `${API_URL}/uploads/profile_pics/${display.avatar}`
                  }}
                  style={styles.headerAvatar}
                  onError={handleHeaderAvatarError}
                />
              ) : (
                <View style={[styles.headerAvatar, styles.avatarFallback]}>
                  <Text style={styles.avatarInitials}>
                    {display.name ? display.name.charAt(0).toUpperCase() : 'U'}
                  </Text>
                </View>
              )}
            </View>
            
            <View style={styles.headerText}>
              <Text style={styles.headerName}>{display.name}</Text>
            </View>
            
            <Ionicons name="chevron-forward" size={isTablet ? 20 : 16} color={COLORS.white} />
          </TouchableOpacity>
          
          <View style={styles.headerActions}>
            {isSelectionMode ? (
              <>
                <TouchableOpacity style={styles.actionButton} onPress={selectAllMessages}>
                  <Ionicons name="checkmark-circle" size={isTablet ? 24 : 20} color={COLORS.white} />
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.actionButton, selectedMessages.size === 0 && styles.actionButtonDisabled]} 
                  onPress={deleteSelectedMessages}
                  disabled={selectedMessages.size === 0}
                >
                  <Ionicons name="trash" size={isTablet ? 24 : 20} color={COLORS.white} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionButton} onPress={exitSelectionMode}>
                  <Ionicons name="close" size={isTablet ? 24 : 20} color={COLORS.white} />
                </TouchableOpacity>
              </>
            ) : (
              <TouchableOpacity style={styles.actionButton} onPress={toggleMenu}>
                <Ionicons name="ellipsis-vertical" size={isTablet ? 24 : 20} color={COLORS.white} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>

      {/* Dropdown Menu */}
      {showMenu && (
        <View style={styles.menuOverlay}>
          <TouchableOpacity style={styles.menuBackdrop} onPress={() => setShowMenu(false)} />
          <View style={styles.menuContainer}>
            <TouchableOpacity style={styles.menuItem} onPress={startSelectionMode}>
              <Ionicons name="checkmark-circle-outline" size={isTablet ? 24 : 20} color={COLORS.primary} />
              <Text style={styles.menuItemText}>Select Messages</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem} onPress={() => setShowMenu(false)}>
              <Ionicons name="close" size={isTablet ? 24 : 20} color="#666" />
              <Text style={styles.menuItemText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Modern Property Details Card */}
      {propertyDetails && (
        <View style={styles.propertyCard}>
          <TouchableOpacity 
            style={styles.propertyCardContent}
            onPress={() => {
              if (propertyDetails.propertyType === 'bike') {
                (navigation as any).navigate('BikeDetails', { carDetails: propertyDetails });
              } else if (propertyDetails.propertyType === 'car') {
                (navigation as any).navigate('CarDetails', { carDetails: propertyDetails });
              }
            }}
          >
            <View style={styles.propertyImageContainer}>
              {propertyDetails.images && propertyDetails.images.length > 0 ? (
                <Image 
                  source={{ uri: propertyDetails.images[0] }} 
                  style={styles.propertyImage}
                />
              ) : (
                <View style={[styles.propertyImage, styles.propertyImagePlaceholder]}>
                  <Ionicons name="bicycle" size={isTablet ? 40 : 30} color="#ccc" />
                </View>
              )}
              <View style={styles.propertyBadge}>
                <Text style={styles.propertyBadgeText}>Property</Text>
              </View>
            </View>
            
            <View style={styles.propertyInfo}>
              <Text style={styles.propertyTitle} numberOfLines={2}>
                {propertyDetails.title || `${propertyDetails.make} ${propertyDetails.model}`}
              </Text>
              <Text style={styles.propertyPrice}>
                PKR {propertyDetails.price ? Number(propertyDetails.price).toLocaleString() : 'N/A'}
              </Text>
              <View style={styles.propertyLocationContainer}>
                <Ionicons name="location" size={isTablet ? 16 : 14} color="#666" />
                <Text style={styles.propertyLocation} numberOfLines={1}>
                  {propertyDetails.location || 'Location not available'}
                </Text>
              </View>
              <View style={styles.propertySpecs}>
                {[
                  propertyDetails.year && `Year: ${propertyDetails.year}`,
                  propertyDetails.kmDriven && `KM: ${Number(propertyDetails.kmDriven).toLocaleString()}`,
                  propertyDetails.engineCapacity && `${propertyDetails.engineCapacity}cc`
                ].filter(Boolean).map((spec, index) => (
                  <View key={`spec-${index}`} style={styles.propertySpecTag}>
                    <Text style={styles.propertySpec}>{spec}</Text>
                  </View>
                ))}
              </View>
            </View>
          </TouchableOpacity>
        </View>
      )}

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoidingView}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        <FlatList
          key={conversationId} // Force re-render when conversation changes
          ref={flatListRef}
          data={messages}
          onScroll={handleScroll}
          scrollEventThrottle={100} // Increased from 16ms to 100ms to reduce frequency
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onTouchCancel={handleTouchCancel}
          inverted={false}
          // CRITICAL: Start at last message (bottom) when chat opens
          initialScrollIndex={messages.length > 0 ? messages.length - 1 : 0}
          // Remove maintainVisibleContentPosition to prevent auto-scroll to top
          removeClippedSubviews={true}
          maxToRenderPerBatch={5}
          updateCellsBatchingPeriod={100}
          initialNumToRender={10} // Render more items initially to ensure scroll works
          windowSize={10}
          onContentSizeChange={(contentWidth, contentHeight) => {
            // Auto-scroll to bottom when content size changes (new messages added or initial load)
            if (flatListRef.current && messages.length > 0) {
              // Use requestAnimationFrame to ensure DOM is ready
              requestAnimationFrame(() => {
                setTimeout(() => {
                  try {
                    // Try scrollToIndex first (more reliable)
                    const lastIndex = messages.length - 1;
                    flatListRef.current?.scrollToIndex({ 
                      index: lastIndex, 
                      animated: true,
                      viewPosition: 1 // Bottom of viewport
                    });
                  } catch (e) {
                    // Fallback to scrollToEnd
                    flatListRef.current?.scrollToEnd({ animated: true });
                  }
                }, 50);
              });
            }
          }}
          onLayout={() => {
            // Scroll to bottom when FlatList layout is ready (initial render)
            if (flatListRef.current && messages.length > 0) {
              setTimeout(() => {
                try {
                  // Try scrollToIndex first (more reliable)
                  const lastIndex = messages.length - 1;
                  flatListRef.current?.scrollToIndex({ 
                    index: lastIndex, 
                    animated: false,
                    viewPosition: 1 // Bottom of viewport
                  });
                } catch (e) {
                  // Fallback to scrollToEnd
                  flatListRef.current?.scrollToEnd({ animated: false });
                }
              }, 150);
            }
          }}
          getItemLayout={(data, index) => {
            // Provide accurate layout for scrollToIndex and initialScrollIndex to work properly
            if (!data || index >= messages.length || index < 0) {
              return { length: 0, offset: 0, index };
            }
            return {
              length: 80, // Approximate height of each message
              offset: 80 * index,
              index,
            };
          }}
          // Add this to handle scrollToIndex errors gracefully
          onScrollToIndexFailed={(info) => {
            // If scrollToIndex fails, fallback to scrollToEnd
            console.log('⚠️ scrollToIndex failed, using fallback:', info);
            const wait = new Promise(resolve => setTimeout(resolve, 100));
            wait.then(() => {
              if (flatListRef.current) {
                try {
                  flatListRef.current.scrollToIndex({ 
                    index: info.index, 
                    animated: false,
                    viewPosition: 1
                  });
                } catch (e) {
                  // Final fallback
                  flatListRef.current.scrollToEnd({ animated: false });
                }
              }
            });
          }}
          renderItem={useCallback(({ item, index }: { item: MessageItem, index: number }) => {
            // Handle both old format (string senderId) and new format (populated senderId object)
            const senderId = typeof item.senderId === 'string' ? item.senderId : item.senderId?._id;
            const isUser = senderId === userId
            
            // Check if message is unread
            const messageUnread = isMessageUnread(item)
            
            // Get sender info for avatar
            let senderAvatar = null;
            if (!isUser) {
              if (typeof item.senderId === 'object' && item.senderId?.profileImage && item.senderId.profileImage.trim() !== '') {
                // Use sender's profile image if available
                if (item.senderId.profileImage.startsWith('http')) {
                  // Additional check: filter out known placeholder/advertisement URLs
                  const isPlaceholderUrl = item.senderId.profileImage.includes('randomuser.me') || 
                                          item.senderId.profileImage.includes('flaticon.com') ||
                                          item.senderId.profileImage.includes('tplinsurance.com') ||
                                          item.senderId.profileImage.includes('placeholder') ||
                                          item.senderId.profileImage.includes('default');
                  
                  if (isPlaceholderUrl) {
                    senderAvatar = null;
                  } else {
                    senderAvatar = item.senderId.profileImage;
                  }
                } else {
                  senderAvatar = `${API_URL}/uploads/profile_pics/${item.senderId.profileImage}`;
                }
              } else if (display.avatar) {
                // Fallback to display avatar - check if it needs profile_pics path
                if (display.avatar.startsWith('http')) {
                  // Additional check: filter out known placeholder/advertisement URLs
                  const isPlaceholderUrl = display.avatar.includes('randomuser.me') || 
                                          display.avatar.includes('flaticon.com') ||
                                          display.avatar.includes('tplinsurance.com') ||
                                          display.avatar.includes('placeholder') ||
                                          display.avatar.includes('default');
                  
                  if (isPlaceholderUrl) {
                    senderAvatar = null;
                  } else {
                    senderAvatar = display.avatar;
                  }
                } else {
                  senderAvatar = `${API_URL}/uploads/profile_pics/${display.avatar}`;
                }
              } else {
                // No avatar available - will use fallback
                senderAvatar = null;
              }
            }
            
            return (
              <View 
                style={[
                  styles.messageContainer, 
                  isUser ? styles.userMessageContainer : styles.otherMessageContainer,
                  isSelectionMode && selectedMessages.has(item._id) && styles.selectedMessage
                ]}
                collapsable={false}
              >
                {isSelectionMode && (
                  <TouchableOpacity 
                    style={styles.selectionIndicator}
                    onPress={() => toggleMessageSelection(item._id)}
                    activeOpacity={0.7}
                  >
                    <Ionicons 
                      name={selectedMessages.has(item._id) ? "checkmark-circle" : "ellipse-outline"} 
                      size={isTablet ? 24 : 20} 
                      color={selectedMessages.has(item._id) ? COLORS.primary : "#ccc"} 
                    />
                  </TouchableOpacity>
                )}
                {!isUser && (
                  <View 
                    style={styles.avatarContainer}
                    pointerEvents="box-none"
                    collapsable={false}
                    removeClippedSubviews={false}
                    onStartShouldSetResponder={() => true}
                    onMoveShouldSetResponder={() => false}
                    onResponderGrant={() => {}}
                    onResponderRelease={() => {}}
                    onResponderTerminationRequest={() => true}
                  >
                    {senderAvatar && !messageAvatarErrors.has(item._id) ? (
                      <Image 
                        source={{ uri: senderAvatar }} 
                        style={styles.avatar} 
                        onError={() => handleMessageAvatarError(item._id)}
                        pointerEvents="none"
                        resizeMode="cover"
                        collapsable={false}
                        shouldRasterizeIOS={true}
                        renderToHardwareTextureAndroid={true}
                      />
                    ) : (
                      <View 
                        style={[styles.avatar, styles.avatarFallback, { backgroundColor: COLORS.primary }]} 
                        pointerEvents="none"
                        collapsable={false}
                      >
                        <Text style={styles.avatarInitials} pointerEvents="none">
                          {typeof item.senderId === 'object' && item.senderId.name 
                            ? item.senderId.name.charAt(0).toUpperCase()
                            : typeof item.senderId === 'string' 
                              ? item.senderId.charAt(0).toUpperCase()
                              : 'U'
                          }
                        </Text>
                      </View>
                    )}
                  </View>
                )}
                {isSelectionMode ? (
                  <TouchableOpacity 
                    style={[styles.messageBubble, isUser ? styles.userMessageBubble : styles.otherMessageBubble]}
                    onPress={() => toggleMessageSelection(item._id)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.messageTextContainer}>
                      {renderMessageText(item.text, messageUnread, isUser)}
                    </View>
                    <View style={styles.messageFooter}>
                      <Text style={[styles.messageTime, isUser ? styles.userMessageTime : styles.otherMessageTime]}>
                        {new Date(item.createdAt).toLocaleTimeString()}
                      </Text>
                      {isUser && (
                        <View style={styles.messageStatus}>
                          {(!item.status || item.status === 'sent') && (
                            <View style={styles.singleTick}>
                              <Ionicons name="checkmark" size={12} color="#999" />
                            </View>
                          )}
                          {item.status === 'delivered' && (
                            <View style={styles.doubleTick}>
                              <Ionicons name="checkmark" size={12} color="#999" />
                              <Ionicons name="checkmark" size={12} color="#999" style={{ marginLeft: -6 }} />
                            </View>
                          )}
                          {item.status === 'read' && (
                            <View style={styles.doubleTick}>
                              <Ionicons name="checkmark" size={12} color="#2196F3" />
                              <Ionicons name="checkmark" size={12} color="#2196F3" style={{ marginLeft: -6 }} />
                            </View>
                          )}
                        </View>
                      )}
                    </View>
                  </TouchableOpacity>
                ) : (
                  <View style={[styles.messageBubble, isUser ? styles.userMessageBubble : styles.otherMessageBubble]}>
                    <View style={styles.messageTextContainer}>
                      {renderMessageText(item.text, messageUnread, isUser)}
                    </View>
                    <View style={styles.messageFooter}>
                      <Text style={[styles.messageTime, isUser ? styles.userMessageTime : styles.otherMessageTime]}>
                        {new Date(item.createdAt).toLocaleTimeString()}
                      </Text>
                      {isUser && (
                        <View style={styles.messageStatus}>
                          {(!item.status || item.status === 'sent') && (
                            <View style={styles.singleTick}>
                              <Ionicons name="checkmark" size={12} color="#999" />
                            </View>
                          )}
                          {item.status === 'delivered' && (
                            <View style={styles.doubleTick}>
                              <Ionicons name="checkmark" size={12} color="#999" />
                              <Ionicons name="checkmark" size={12} color="#999" style={{ marginLeft: -6 }} />
                            </View>
                          )}
                          {item.status === 'read' && (
                            <View style={styles.doubleTick}>
                              <Ionicons name="checkmark" size={12} color="#2196F3" />
                              <Ionicons name="checkmark" size={12} color="#2196F3" style={{ marginLeft: -6 }} />
                            </View>
                          )}
                        </View>
                      )}
                    </View>
                  </View>
                )}
              </View>
            )
          }, [userId, messageAvatarErrors, handleMessageAvatarError, navigateToProfile, isSelectionMode, COLORS.primary, API_URL, conversationData, isMessageUnread])}
          keyExtractor={(item, idx) => {
            try {
              if (item._id) {
                if (typeof item._id === 'string' && item._id !== '[object Object]') return `msg-${item._id}-${idx}`;
                if (typeof item._id === 'object' && item._id !== null) {
                  if (item._id.toString && typeof item._id.toString === 'function') {
                    const str = String(item._id.toString());
                    if (str !== '[object Object]' && !str.includes('[object')) return `msg-${str}-${idx}`;
                  }
                  if (item._id._id) {
                    const str = String(item._id._id);
                    if (str !== '[object Object]' && !str.includes('[object')) return `msg-${str}-${idx}`;
                  }
                  if (item._id.$oid) return `msg-${String(item._id.$oid)}-${idx}`;
                }
              }
              return `msg-${idx}`;
            } catch (error) {
              return `msg-${idx}`;
            }
          }}
          contentContainerStyle={styles.messagesList}
          showsVerticalScrollIndicator={false}
          // Remove onLayout to prevent constant scrolling to end
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[COLORS.primary]}
              tintColor={COLORS.primary}
            />
          }
        />

        {/* Modern Typing Indicator */}
        {otherUserTyping && (
          <View style={styles.typingContainer}>
            <View style={styles.typingBubble}>
              <View style={styles.typingDots}>
                <View style={[styles.typingDot, styles.typingDot1]} />
                <View style={[styles.typingDot, styles.typingDot2]} />
                <View style={[styles.typingDot, styles.typingDot3]} />
              </View>
              <Text style={styles.typingText}>{display.name} is typing...</Text>
            </View>
          </View>
        )}

        {/* Modern Input Container */}
        <View style={styles.inputContainer}>
          <View style={styles.inputWrapper}>
            <View style={styles.textInputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Type a message..."
                placeholderTextColor="#999"
                value={newMessage}
                onChangeText={handleTextChange}
                multiline
                maxLength={1000}
              />
            </View>
            
            <TouchableOpacity 
              style={[styles.sendButton, (!newMessage.trim() || isSending) && styles.sendButtonDisabled]} 
              onPress={sendMessage}
              disabled={!newMessage.trim() || isSending}
            >
              <Ionicons 
                name={isSending ? "hourglass" : "send"} 
                size={isTablet ? 28 : 24} 
                color={COLORS.white} 
              />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>

    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: COLORS.primary,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  headerGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: isTablet ? 24 : 16,
    paddingVertical: isTablet ? 16 : 12,
    paddingTop: isSmallScreen ? 8 : 12,
  },
  backButton: {
    width: isTablet ? 48 : 40,
    height: isTablet ? 48 : 40,
    borderRadius: isTablet ? 24 : 20,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerProfile: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginHorizontal: isTablet ? 16 : 12,
    paddingVertical: isTablet ? 8 : 6,
    paddingHorizontal: isTablet ? 8 : 6,
    borderRadius: isTablet ? 12 : 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  avatarContainer: {
    position: 'relative',
    width: isTablet ? 50 : 40,
    height: isTablet ? 50 : 40,
    flexShrink: 0,
    flexGrow: 0,
  },
  headerAvatar: {
    width: isTablet ? 50 : 40,
    height: isTablet ? 50 : 40,
    borderRadius: isTablet ? 25 : 20,
    marginRight: 0,
    borderWidth: 3,
    borderColor: COLORS.white,
  },
  avatarFallback: {
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitials: {
    color: COLORS.primary,
    fontWeight: 'bold',
    fontSize: isTablet ? 20 : 16,
  },
  headerText: {
    flex: 1,
    marginLeft: isTablet ? 16 : 12,
  },
  headerName: {
    fontSize: isTablet ? 20 : 16,
    fontWeight: "bold",
    color: COLORS.white,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    width: isTablet ? 44 : 36,
    height: isTablet ? 44 : 36,
    borderRadius: isTablet ? 22 : 18,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginLeft: isTablet ? 8 : 6,
  },
  moreButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  messagesList: {
    padding: 16,
    paddingBottom: 16,
  },
  dateContainer: {
    alignItems: "center",
    marginVertical: 16,
  },
  dateText: {
    fontSize: 12,
    color: COLORS.darkGray,
    backgroundColor: COLORS.lightGray,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  messageContainer: {
    flexDirection: "row",
    marginBottom: 16,
    maxWidth: "80%",
    alignItems: "flex-start",
  },
  userMessageContainer: {
    alignSelf: "flex-end",
  },
  otherMessageContainer: {
    alignSelf: "flex-start",
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 8,
  },
  messageBubble: {
    padding: 12,
    borderRadius: 16,
    maxWidth: "100%",
  },
  userMessageBubble: {
    backgroundColor: '#FF6B6B', // Light red for sent messages (lighter than primary)
    borderBottomRightRadius: 4,
  },
  otherMessageBubble: {
    backgroundColor: COLORS.lightGray,
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
    marginBottom: 4,
  },
  messageTextContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  messageTime: {
    fontSize: 10,
    marginTop: 2,
    opacity: 0.7,
  },
  messageFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  messageStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 9,
    color: 'rgba(255, 255, 255, 0.7)',
    fontStyle: 'italic',
  },
  singleTick: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  doubleTick: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userMessageTime: {
    color: 'rgba(255, 255, 255, 0.8)', // White color for light red background
    textAlign: 'right',
  },
  otherMessageTime: {
    color: 'rgba(0, 0, 0, 0.6)',
    textAlign: 'left',
  },
  userMessageText: {
    color: COLORS.white, // White color for light red background
  },
  otherMessageText: {
    color: COLORS.black,
  },
  typingContainer: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  // Property Card Styles
  propertyCard: {
    backgroundColor: '#fff',
    marginHorizontal: isTablet ? 24 : 15,
    marginVertical: isTablet ? 12 : 10,
    borderRadius: isTablet ? 16 : 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  propertyCardContent: {
    flexDirection: 'row',
    padding: 12,
    alignItems: 'center',
  },
  propertyImageContainer: {
    marginRight: 12,
  },
  propertyImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
  },
  propertyImagePlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },
  propertyInfo: {
    flex: 1,
    marginRight: 8,
  },
  propertyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  propertyPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 4,
  },
  propertyLocation: {
    fontSize: 14,
    color: '#666',
    marginBottom: 6,
  },
  propertySpecs: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  propertySpec: {
    fontSize: 12,
    color: '#888',
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  propertyArrow: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  propertyBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  propertyBadgeText: {
    color: 'white',
    fontSize: isTablet ? 12 : 10,
    fontWeight: 'bold',
  },
  propertyLocationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  propertySpecTag: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: isTablet ? 12 : 8,
    paddingVertical: isTablet ? 6 : 4,
    borderRadius: isTablet ? 16 : 12,
    marginRight: isTablet ? 8 : 6,
    marginTop: isTablet ? 8 : 6,
  },
  // Modern Input Styles
  inputContainer: {
    backgroundColor: '#f8f9fa',
    paddingVertical: isTablet ? 16 : 12,
    paddingHorizontal: isTablet ? 20 : 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#fff',
    borderRadius: isTablet ? 25 : 20,
    paddingHorizontal: isTablet ? 16 : 12,
    paddingVertical: isTablet ? 12 : 8,
    marginHorizontal: isTablet ? 20 : 16,
    marginVertical: isTablet ? 12 : 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  textInputContainer: {
    flex: 1,
    marginHorizontal: isTablet ? 12 : 8,
  },
  input: {
    fontSize: isTablet ? 16 : 14,
    color: '#333',
    maxHeight: isTablet ? 120 : 100,
    minHeight: isTablet ? 40 : 36,
  },
  sendButton: {
    width: isTablet ? 48 : 40,
    height: isTablet ? 48 : 40,
    borderRadius: isTablet ? 24 : 20,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  sendButtonDisabled: {
    backgroundColor: '#ccc',
    opacity: 0.6,
  },
  // Modern Typing Indicator
  typingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: isTablet ? 16 : 12,
    paddingVertical: isTablet ? 12 : 8,
    borderRadius: isTablet ? 20 : 16,
    marginHorizontal: isTablet ? 20 : 16,
    marginVertical: isTablet ? 8 : 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  typingDots: {
    flexDirection: 'row',
    marginRight: isTablet ? 12 : 8,
  },
  typingDot: {
    width: isTablet ? 8 : 6,
    height: isTablet ? 8 : 6,
    borderRadius: isTablet ? 4 : 3,
    backgroundColor: COLORS.primary,
    marginHorizontal: isTablet ? 2 : 1,
  },
  typingDot1: {
    // Animation handled by component logic
  },
  typingDot2: {
    // Animation handled by component logic
  },
  typingDot3: {
    // Animation handled by component logic
  },
  typingText: {
    fontSize: isTablet ? 14 : 12,
    color: '#666',
    fontStyle: 'italic',
  },
  // Menu Styles
  menuOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  menuBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  menuContainer: {
    position: 'absolute',
    top: isTablet ? 80 : 60,
    right: isTablet ? 20 : 15,
    backgroundColor: 'white',
    borderRadius: isTablet ? 12 : 8,
    paddingVertical: isTablet ? 8 : 6,
    minWidth: isTablet ? 200 : 160,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: isTablet ? 16 : 12,
    paddingHorizontal: isTablet ? 20 : 16,
  },
  menuItemText: {
    fontSize: isTablet ? 16 : 14,
    color: '#333',
    marginLeft: isTablet ? 12 : 10,
    fontWeight: '500',
  },
  // Selection Styles
  selectedMessage: {
    backgroundColor: 'rgba(0, 123, 255, 0.1)',
    borderRadius: isTablet ? 12 : 8,
    marginVertical: isTablet ? 2 : 1,
  },
  selectionIndicator: {
    position: 'absolute',
    left: isTablet ? -40 : -35,
    top: '50%',
    transform: [{ translateY: -12 }],
    zIndex: 1,
  },
  actionButtonDisabled: {
    opacity: 0.5,
  },
})

export default ChatDetailScreen
