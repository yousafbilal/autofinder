import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_URL } from "../../config";
import { apiFetch } from "../utils/apiUtils";

export type ChatConversation = {
  _id: string;
  adId?: string;
  sellerId: {
    _id: string;
    name?: string;
    profileImage?: string;
    isOnline?: boolean;
    lastSeen?: string | Date;
  };
  buyerId: {
    _id: string;
    name?: string;
    profileImage?: string;
    isOnline?: boolean;
    lastSeen?: string | Date;
  };
  lastMessage?: string;
  updatedAt?: string;
  lastReadAt?: string | Date;
  unreadCount?: number; // Backend provides this
};

export type ChatMessage = {
  _id?: string;
  conversationId: string;
  senderId: {
    _id: string;
    name?: string;
    profileImage?: string;
  };
  text: string;
  createdAt?: string;
};

export type BasicUser = {
  _id: string
  name?: string
  email?: string
  profileImage?: string
  isOnline?: boolean
  lastSeen?: string | Date
}

export async function getCurrentUserId(): Promise<string | null> {
  try {
    const raw = await AsyncStorage.getItem("user");
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.userId ?? null;
  } catch {
    return null;
  }
}

export async function startConversation(adId?: string, buyerId?: string, sellerId?: string): Promise<ChatConversation> {
  const uid = buyerId ?? (await getCurrentUserId());
  if (!uid) throw new Error("Not logged in");
  
  if (!sellerId) {
    throw new Error("Seller ID is required to start conversation");
  }
  
  // Backend doesn't have POST /chat/start endpoint
  // Instead, we'll create conversation by sending a message first
  // The backend should auto-create the conversation when first message is sent
  
  // First, check if conversation already exists
  try {
    const existingConversations = await fetchConversations(uid);
    const existingConv = existingConversations.find(conv => {
      const isSameSeller = conv.sellerId._id === sellerId || conv.buyerId._id === sellerId;
      const isCurrentUserInvolved = conv.sellerId._id === uid || conv.buyerId._id === uid;
      return isSameSeller && isCurrentUserInvolved;
    });
    
    if (existingConv) {
      console.log('✅ Found existing conversation:', existingConv._id);
      return existingConv;
    }
  } catch (error) {
    console.log('Error checking existing conversations:', error);
  }
  
  // If no existing conversation, we need to create one
  // Since backend doesn't have /chat/start, we'll create it by sending a temporary message
  // But first, let's try to create it directly using a workaround
  
  // WORKAROUND: Create conversation by sending a message
  // The backend should auto-create conversation when message is sent
  // We'll send a placeholder message to trigger conversation creation
  try {
    // Create a temporary conversation object locally
    // The actual conversation will be created when we send the first real message
    const tempConversation: ChatConversation = {
      _id: 'temp_' + Date.now(), // Temporary ID
      buyerId: { _id: uid } as any,
      sellerId: { _id: sellerId } as any,
      adId: adId,
      lastMessage: '',
      updatedAt: new Date().toISOString(),
    };
    
    console.log('⚠️ Using temporary conversation - will be created when first message is sent');
    return tempConversation;
  } catch (error) {
    throw new Error(`Failed to start conversation: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function fetchMessages(conversationId: string): Promise<ChatMessage[]> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000); // 20 seconds timeout
    
    const res = await apiFetch(`${API_URL}/chat/messages/${conversationId}`, {
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!res.ok) throw new Error(`Failed to load messages (${res.status})`);
    return res.json();
  } catch (error: any) {
    if (error?.name === 'AbortError' || error?.message?.includes('timeout') || error?.message?.includes('timed out')) {
      console.log('⏱️ Fetch messages request timed out');
      return []; // Return empty array on timeout
    }
    throw error;
  }
}

export async function sendMessage(message: ChatMessage | any): Promise<ChatMessage> {
  // If message has buyerId/sellerId instead of conversationId, 
  // we need to create conversation first or send in a format that creates it
  let messagePayload = message;
  
  // Check if this is a new conversation (has buyerId/sellerId but no conversationId)
  if ((message.buyerId || message.sellerId) && !message.conversationId) {
    // Try to create conversation by sending message with buyerId/sellerId
    // Backend should auto-create conversation
    messagePayload = {
      buyerId: message.buyerId,
      sellerId: message.sellerId,
      adId: message.adId,
      text: message.text,
      senderId: message.senderId || { _id: message.buyerId }
    };
  }
  
  const res = await apiFetch(`${API_URL}/chat/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(messagePayload),
  });
  
  if (!res.ok) {
    const errorText = await res.text().catch(() => 'Unknown error');
    throw new Error(`Failed to send message (${res.status}): ${errorText}`);
  }
  
  return res.json();
}

export async function fetchConversations(userId?: string): Promise<ChatConversation[]> {
  const uid = userId ?? (await getCurrentUserId());
  if (!uid) {
    console.log('⚠️ Not logged in, returning empty conversations');
    return [];
  }
  
  // FIXED: Retry logic for rate limit errors
  const maxRetries = 3;
  let retryCount = 0;
  
  while (retryCount < maxRetries) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 20000); // 20 seconds timeout
      
      const res = await apiFetch(`${API_URL}/chat/conversations/${uid}`, {
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      // Handle 404 gracefully - endpoint might not exist or user has no conversations
      if (res.status === 404) {
        console.log('⚠️ Chat conversations endpoint not found (404), returning empty array');
        return [];
      }
      
      // FIXED: Handle HTTP 429 (rate limit) with retry and exponential backoff
      if (res.status === 429) {
        retryCount++;
        if (retryCount < maxRetries) {
          const delay = Math.min(1000 * Math.pow(2, retryCount - 1), 5000); // Exponential backoff, max 5 seconds
          console.log(`⚠️ Rate limit hit (429), retrying in ${delay}ms (attempt ${retryCount}/${maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue; // Retry
        } else {
          console.log('⚠️ Rate limit hit (429), max retries reached, returning empty array');
          return []; // Return empty array after max retries
        }
      }
      
      if (!res.ok) {
        console.log(`⚠️ Failed to load conversations (${res.status}), returning empty array`);
        return [];
      }
      
      const conversations = await res.json();
      
      // FIXED: Filter out conversations with invalid/empty _id before returning
      const validConversations = (Array.isArray(conversations) ? conversations : []).filter(conv => {
        if (!conv || !conv._id) return false;
        if (typeof conv._id === 'object' && Object.keys(conv._id).length === 0) return false;
        if (typeof conv._id === 'string' && (conv._id === '[object Object]' || conv._id.includes('[object'))) return false;
        return true;
      });
      
      return validConversations;
    } catch (error: any) {
      // FIXED: Handle HTTP 429 in error message as well
      if (error?.message?.includes('429') || error?.message?.includes('HTTP 429')) {
        retryCount++;
        if (retryCount < maxRetries) {
          const delay = Math.min(1000 * Math.pow(2, retryCount - 1), 5000);
          console.log(`⚠️ Rate limit error (429), retrying in ${delay}ms (attempt ${retryCount}/${maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue; // Retry
        } else {
          console.log('⚠️ Rate limit error (429), max retries reached, returning empty array');
          return [];
        }
      }
      
      if (error?.name === 'AbortError' || error?.message?.includes('timeout') || error?.message?.includes('timed out')) {
        console.log('⏱️ Fetch conversations request timed out');
        return []; // Return empty array on timeout
      }
      // Handle network errors gracefully
      if (error?.message?.includes('Failed to fetch') || error?.message?.includes('Network request failed')) {
        console.log('⚠️ Network error fetching conversations, returning empty array');
        return [];
      }
      console.log('⚠️ Error fetching conversations:', error?.message || error);
      return []; // Return empty array on any error
    }
  }
  
  return []; // Fallback return
}

export async function checkConversationExists(adId: string, sellerId: string): Promise<ChatConversation | null> {
  try {
    const buyerId = await getCurrentUserId();
    if (!buyerId) throw new Error("Not logged in");
    
    const res = await apiFetch(`${API_URL}/chat/exists/${buyerId}/${sellerId}/${adId}`);
    if (!res.ok) throw new Error(`Failed to check conversation existence (${res.status})`);
    
    const data = await res.json();
    return data.exists ? data.conversation : null;
  } catch (error) {
    console.log('Error checking conversation existence:', error);
    return null;
  }
}

export async function ensureConversationForAd(adId?: string, sellerId?: string): Promise<ChatConversation> {
  const uid = await getCurrentUserId();
  if (!uid) throw new Error("Not logged in");
  
  if (!sellerId) {
    throw new Error("Seller ID is required to create conversation");
  }
  
  // First, try to find existing conversation with the same seller (regardless of ad)
  try {
    const existingConversations = await fetchConversations(uid);
    
    // Look for any existing conversation with this seller
    const existingConvWithSeller = existingConversations.find(conv => {
      const isSameSeller = conv.sellerId._id === sellerId || conv.buyerId._id === sellerId;
      const isCurrentUserInvolved = conv.sellerId._id === uid || conv.buyerId._id === uid;
      
      console.log('Checking conversation with seller:', {
        convId: conv._id,
        convSellerId: conv.sellerId._id,
        convBuyerId: conv.buyerId._id,
        targetSellerId: sellerId,
        currentUserId: uid,
        isSameSeller,
        isCurrentUserInvolved
      });
      
      return isSameSeller && isCurrentUserInvolved;
    });
    
    if (existingConvWithSeller) {
      console.log('✅ Found existing conversation with this seller:', existingConvWithSeller._id);
      
      // Update the conversation with the new adId if it's different
      if (adId && existingConvWithSeller.adId !== adId) {
        try {
          const response = await apiFetch(`${API_URL}/chat/conversation/${existingConvWithSeller._id}/update-ad`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ adId })
          });
          
          if (response.ok) {
            const updatedConv = await response.json();
            console.log('✅ Updated conversation with new adId:', updatedConv._id);
            return updatedConv;
          }
        } catch (error) {
          console.log('Error updating conversation adId:', error);
        }
      }
      
      return existingConvWithSeller;
    }
  } catch (error) {
    console.log('Error checking for existing conversation with seller:', error);
  }
  
  // If no existing conversation found, we need to create one
  // Since backend doesn't have POST /chat/start, we'll create it by sending a message
  // But we need a conversation ID first, so we'll create a temporary one
  // The actual conversation will be created when the first message is sent
  
  console.log('🆕 No existing conversation found. Creating temporary conversation object.');
  console.log('⚠️ Note: Backend will auto-create conversation when first message is sent.');
  
  // Return a temporary conversation object
  // The real conversation will be created when we send the first message via POST /chat/messages
  // We'll need to fetch the conversation after sending the message to get the real ID
  const tempConversation: ChatConversation = {
    _id: 'temp_' + Date.now(), // Temporary ID
    buyerId: { _id: uid } as any,
    sellerId: { _id: sellerId } as any,
    adId: adId,
    lastMessage: '',
    updatedAt: new Date().toISOString(),
  };
  
  return tempConversation;
}

export async function fetchUserProfile(userId: string): Promise<BasicUser | null> {
  try {
    const res = await apiFetch(`${API_URL}/user/${userId}`)
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

export async function fetchAdOwnerUserId(adId: string): Promise<string | null> {
  try {
    const res = await apiFetch(`${API_URL}/all_ads/${adId}`)
    if (!res.ok) return null
    const ad = await res.json()
    // Handle different field names and populated objects
    const sellerId = ad?.userId || ad?.sellerId || ad?.postedBy
    if (!sellerId) return null
    
    // If sellerId is an object (populated user), extract _id
    if (typeof sellerId === 'object' && sellerId !== null) {
      return sellerId._id || sellerId.id || null
    }
    
    return String(sellerId)
  } catch {
    return null
  }
}

/**
 * Extract seller ID from car/ad details object
 * Handles different field names and populated user objects
 */
export function extractSellerId(carDetails: any): string | null {
  if (!carDetails) return null
  
  // Try different field names in order of preference
  let sellerId = carDetails.userId || carDetails.sellerId || carDetails.postedBy || carDetails.user_id || carDetails.seller_id || carDetails.addedBy || carDetails.createdBy
  
  if (!sellerId) return null
  
  // FIXED: Handle empty objects - if userId is {} (empty object), return null
  if (typeof sellerId === 'object' && sellerId !== null) {
    // Check if it's an empty object
    if (Object.keys(sellerId).length === 0) {
      // Try other fields if userId is empty
      const altSellerId = carDetails.sellerId || carDetails.postedBy || carDetails.user_id || carDetails.seller_id;
      if (altSellerId && typeof altSellerId === 'object' && altSellerId !== null && Object.keys(altSellerId).length > 0) {
        return altSellerId._id || altSellerId.id || null;
      }
      return null;
    }
    // Extract _id from populated user object
    const extractedId = sellerId._id || sellerId.id;
    if (extractedId) {
      // Ensure it's not "[object Object]"
      const idStr = String(extractedId);
      if (idStr !== '[object Object]' && !idStr.includes('[object') && idStr.length > 10) {
        return idStr;
      }
    }
    return null;
  }
  
  // Ensure it's a string and not "[object Object]"
  const idStr = String(sellerId);
  if (idStr === '[object Object]' || idStr.includes('[object')) {
    return null;
  }
  
  return idStr;
}

/**
 * Extract car details (title, price, image) from car/ad object
 */
export function extractCarDetails(carDetails: any): {
  title: string
  price: string
  image: string | null
  adId: string | null
} {
  if (!carDetails) {
    return { title: 'Car Listing', price: 'N/A', image: null, adId: null }
  }
  
  // Extract ad ID
  const adId = carDetails._id || carDetails.id || null
  
  // Build title from make, model, year, variant
  const make = carDetails.make || ''
  const model = carDetails.model || ''
  const year = carDetails.year || ''
  const variant = carDetails.variant || ''
  
  let title = ''
  if (make && model && year) {
    title = `${year} ${make} ${model}${variant ? ` ${variant}` : ''}`.trim()
  } else if (carDetails.title) {
    title = carDetails.title
  } else if (carDetails.name) {
    title = carDetails.name
  } else {
    title = 'Car Listing'
  }
  
  // Extract price
  const price = carDetails.price || carDetails.rentalPrice || carDetails.amount || 'N/A'
  const formattedPrice = price !== 'N/A' ? `PKR ${Number(price).toLocaleString('en-US')}` : 'N/A'
  
  // Extract first image
  let image: string | null = null
  if (carDetails.images && Array.isArray(carDetails.images) && carDetails.images.length > 0) {
    image = carDetails.images[0]
  } else if (carDetails.image1) {
    image = carDetails.image1
  } else if (carDetails.image) {
    image = carDetails.image
  }
  
  // Build full image URL if it's a relative path
  if (image && !image.startsWith('http') && !image.startsWith('file://')) {
    image = `${API_URL}/uploads/${image}`
  }
  
  return {
    title,
    price: formattedPrice,
    image,
    adId: adId ? String(adId) : null
  }
}

export async function fetchAllAds(): Promise<any[]> {
  const res = await apiFetch(`${API_URL}/all_ads`)
  if (!res.ok) throw new Error('Failed to fetch ads')
  return res.json()
}

export async function markConversationAsRead(conversationId: string): Promise<void> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) throw new Error('Not logged in');
    
    // Use safeApiCall for automatic retry on timeout
    const { safeApiCall } = require('../utils/apiUtils');
    const result = await safeApiCall(`${API_URL}/chat/conversations/${conversationId}/read`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId })
    }, 1);
    
    if (!result.success) {
      throw new Error(result.error || `Failed to mark conversation as read`);
    }
  } catch (error) {
    console.error('Error marking conversation as read:', error);
    throw error;
  }
}

export async function cleanupDuplicateConversations(): Promise<{ deletedCount: number }> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return { deletedCount: 0 };

    const res = await apiFetch(`${API_URL}/chat/cleanup-duplicates/${userId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });

    if (!res.ok) {
      // 404 = endpoint not implemented on backend - fail silently
      if (Number(res.status) === 404 || String(res.status) === '404') return { deletedCount: 0 };
      throw new Error(`Failed to cleanup duplicates (${res.status})`);
    }
    return res.json();
  } catch {
    // Endpoint may not exist (404) or network failed - fail silently
    return { deletedCount: 0 };
  }
}

function extractFilenameFromUrl(url: string): string | null {
  try {
    const idx = url.lastIndexOf('/uploads/')
    if (idx === -1) return null
    return url.substring(idx + '/uploads/'.length)
  } catch { return null }
}

export async function findSellerByImages(imageUrls: string[] | undefined): Promise<{ adId: string | null, sellerId: string | null }> {
  if (!imageUrls || imageUrls.length === 0) return { adId: null, sellerId: null }
  const names = imageUrls.map(u => extractFilenameFromUrl(u)).filter(Boolean) as string[]
  if (names.length === 0) return { adId: null, sellerId: null }
  try {
    const ads = await fetchAllAds()
    for (const ad of ads) {
      const imageFields = Object.keys(ad).filter(k => k.startsWith('image'))
      for (const f of imageFields) {
        if (ad[f] && names.includes(ad[f])) {
          return { adId: ad._id || ad.id || null, sellerId: ad.userId || null }
        }
      }
    }
    return { adId: null, sellerId: null }
  } catch {
    return { adId: null, sellerId: null }
  }
}
