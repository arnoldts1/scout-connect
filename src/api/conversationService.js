import { base44 } from './base44Client';

/**
 * Generate a unique key for two users to check if a direct conversation exists
 * The key is order-independent, so A-B equals B-A
 */
function generateConversationKey(userId1, userId2) {
  const ids = [userId1, userId2].sort();
  return ids.join('|');
}

/**
 * Find an existing direct conversation between two users
 * @param {string} currentUserId - ID of the current user
 * @param {string} targetUserId - ID of the target user
 * @returns {Promise<Object|null>} - The conversation if found, null otherwise
 */
export async function findDirectConversation(currentUserId, targetUserId) {
  try {
    const conversations = await base44.entities.Conversation.filter({
      type: 'direct'
    });

    // Find conversation that includes both users
    const existingConversation = conversations.find(conv => {
      const participants = conv.participants || [];
      return (
        participants.includes(currentUserId) &&
        participants.includes(targetUserId)
      );
    });

    return existingConversation || null;
  } catch (error) {
    console.error('Error finding direct conversation:', error);
    return null;
  }
}

/**
 * Get or create a direct conversation between two users
 * This is the main function to use when starting a DM
 * @param {string} currentUserId - ID of the current user
 * @param {string} currentUserData - Current user object {id, full_name, avatar, email}
 * @param {string} targetUserId - ID of the target user
 * @param {string} targetUserData - Target user object {id, full_name, avatar, email}
 * @returns {Promise<Object>} - The conversation object
 */
export async function getOrCreateDirectConversation(
  currentUserId,
  currentUserData,
  targetUserId,
  targetUserData
) {
  try {
    // First check if conversation already exists
    const existingConversation = await findDirectConversation(currentUserId, targetUserId);
    
    if (existingConversation) {
      console.log('Using existing conversation:', existingConversation.id);
      return existingConversation;
    }

    // Create new conversation if it doesn't exist
    console.log('Creating new direct conversation between', currentUserId, 'and', targetUserId);
    
    const newConversation = await base44.entities.Conversation.create({
      type: 'direct',
      participants: [currentUserId, targetUserId],
      participant_details: [
        {
          user_id: currentUserId,
          name: currentUserData.full_name,
          avatar: currentUserData.avatar
        },
        {
          user_id: targetUserId,
          name: targetUserData.full_name,
          avatar: targetUserData.avatar
        }
      ],
      unread_count: {
        [currentUserId]: 0,
        [targetUserId]: 0
      }
    });

    console.log('Created new conversation:', newConversation.id);
    return newConversation;
  } catch (error) {
    console.error('Error getting or creating conversation:', error);
    throw error;
  }
}

/**
 * Create a group conversation
 * @param {Object} params - Creation parameters
 * @returns {Promise<Object>} - The created group conversation
 */
export async function createGroupConversation({
  currentUserId,
  currentUserData,
  participantIds,
  participantDetails,
  groupName,
  groupDescription,
  groupAvatar
}) {
  try {
    const allParticipants = [currentUserId, ...participantIds];
    const allParticipantDetails = [
      {
        user_id: currentUserId,
        name: currentUserData.full_name,
        avatar: currentUserData.avatar
      },
      ...participantDetails
    ];

    const newConversation = await base44.entities.Conversation.create({
      type: 'group',
      participants: allParticipants,
      participant_details: allParticipantDetails,
      group_name: groupName,
      group_description: groupDescription,
      group_avatar: groupAvatar,
      admins: [currentUserId],
      unread_count: {}
    });

    return newConversation;
  } catch (error) {
    console.error('Error creating group conversation:', error);
    throw error;
  }
}

/**
 * Send a message in a conversation
 * @param {Object} params - Message parameters
 * @returns {Promise<Object>} - The created message
 */
export async function sendMessage({
  conversationId,
  senderId,
  senderName,
  senderAvatar,
  content,
  mediaUrl,
  mediaType,
  replyToId
}) {
  try {
    const message = await base44.entities.Message.create({
      conversation_id: conversationId,
      sender_id: senderId,
      sender_name: senderName,
      sender_avatar: senderAvatar,
      content: content || null,
      media_url: mediaUrl || null,
      media_type: mediaType || null,
      reply_to: replyToId || null,
      read_by: [senderId],
      delivered_to: [senderId]
    });

    // Update conversation's last message
    await base44.entities.Conversation.update(conversationId, {
      last_message: content || `[${mediaType}]`,
      last_message_at: new Date().toISOString(),
      last_sender_id: senderId
    });

    return message;
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
}

/**
 * Mark messages as read
 * @param {string} conversationId - Conversation ID
 * @param {string} userId - User ID who is reading
 * @returns {Promise<void>}
 */
export async function markMessagesAsRead(conversationId, userId) {
  try {
    const messages = await base44.entities.Message.filter({
      conversation_id: conversationId
    });

    for (const message of messages) {
      if (!message.read_by?.includes(userId)) {
        const readBy = message.read_by || [];
        await base44.entities.Message.update(message.id, {
          read_by: [...readBy, userId]
        });
      }
    }
  } catch (error) {
    console.error('Error marking messages as read:', error);
  }
}

/**
 * Get read receipt status for a message
 * Returns: 'sent', 'delivered', or 'seen'
 * @param {Object} message - Message object
 * @param {string} senderId - ID of the sender
 * @returns {string} - Status string
 */
export function getMessageStatus(message, senderId) {
  if (!message) return 'sent';

  const readByCount = message.read_by?.length || 0;
  const deliveredToCount = message.delivered_to?.length || 0;

  // If read by anyone other than sender, it's 'seen'
  if (message.read_by?.some(id => id !== senderId)) {
    return 'seen';
  }

  // If delivered to anyone other than sender, it's 'delivered'
  if (message.delivered_to?.some(id => id !== senderId)) {
    return 'delivered';
  }

  return 'sent';
}

/**
 * Add typing indicator for a user
 * @param {string} conversationId - Conversation ID
 * @param {string} userId - User ID
 * @returns {Promise<void>}
 */
export async function setTypingIndicator(conversationId, userId) {
  try {
    const conv = await base44.entities.Conversation.filter({ id: conversationId });
    if (!conv[0]) return;

    const typingUsers = { ...(conv[0].typing_users || {}), [userId]: new Date().toISOString() };
    await base44.entities.Conversation.update(conversationId, { typing_users: typingUsers });
  } catch (error) {
    console.error('Error setting typing indicator:', error);
  }
}

/**
 * Clear typing indicator for a user
 * @param {string} conversationId - Conversation ID
 * @param {string} userId - User ID
 * @returns {Promise<void>}
 */
export async function clearTypingIndicator(conversationId, userId) {
  try {
    const conv = await base44.entities.Conversation.filter({ id: conversationId });
    if (!conv[0]) return;

    const typingUsers = { ...(conv[0].typing_users || {}) };
    delete typingUsers[userId];
    await base44.entities.Conversation.update(conversationId, { typing_users: typingUsers });
  } catch (error) {
    console.error('Error clearing typing indicator:', error);
  }
}
