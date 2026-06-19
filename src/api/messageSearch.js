import { base44 } from './base44Client';

/**
 * Search messages within a conversation
 * @param {string} conversationId - Conversation ID to search in
 * @param {string} query - Search query string
 * @returns {Promise<Array>} - Matching messages
 */
export async function searchMessagesInConversation(conversationId, query) {
  try {
    const messages = await base44.entities.Message.filter({
      conversation_id: conversationId
    });

    const searchLower = query.toLowerCase();
    
    return messages.filter(msg => {
      if (!msg || msg.is_deleted) return false;
      
      const content = (msg.content || '').toLowerCase();
      const senderName = (msg.sender_name || '').toLowerCase();
      
      return content.includes(searchLower) || senderName.includes(searchLower);
    });
  } catch (error) {
    console.error('Error searching messages:', error);
    return [];
  }
}

/**
 * Search across all conversations
 * @param {string} query - Search query
 * @param {Array} conversations - List of conversations to search in
 * @returns {Promise<Array>} - Matching conversations with preview
 */
export async function searchConversations(query, conversations) {
  try {
    if (!query.trim() || !conversations || conversations.length === 0) {
      return conversations || [];
    }

    const searchLower = query.toLowerCase();

    return conversations.filter(conv => {
      // Search in group name
      if (conv.type === 'group') {
        const groupName = (conv.group_name || '').toLowerCase();
        return groupName.includes(searchLower);
      }

      // Search in participant names
      return (conv.participant_details || []).some(p =>
        (p.name || '').toLowerCase().includes(searchLower)
      );
    });
  } catch (error) {
    console.error('Error searching conversations:', error);
    return conversations;
  }
}

/**
 * Search users globally
 * @param {string} query - Search query
 * @param {Array} users - List of users to search in
 * @returns {Array} - Matching users
 */
export function searchUsers(query, users) {
  if (!query.trim() || !users) {
    return users || [];
  }

  const searchLower = query.toLowerCase();

  return users.filter(user => {
    const name = (user.full_name || '').toLowerCase();
    const username = (user.username || '').toLowerCase();
    const email = (user.email || '').toLowerCase();

    return (
      name.includes(searchLower) ||
      username.includes(searchLower) ||
      email.includes(searchLower)
    );
  });
}

/**
 * Filter conversations by type
 * @param {Array} conversations - Conversations to filter
 * @param {string} type - 'direct' or 'group'
 * @returns {Array} - Filtered conversations
 */
export function filterConversationsByType(conversations, type) {
  if (!type) return conversations;
  return (conversations || []).filter(c => c.type === type);
}

/**
 * Filter conversations by unread status
 * @param {Array} conversations - Conversations to filter
 * @param {string} userId - Current user ID
 * @param {boolean} unreadOnly - If true, only return unread conversations
 * @returns {Array} - Filtered conversations
 */
export function filterByUnreadStatus(conversations, userId, unreadOnly = true) {
  if (!unreadOnly) return conversations;
  
  return (conversations || []).filter(conv => {
    const unreadCount = conv.unread_count?.[userId] || 0;
    return unreadCount > 0;
  });
}

/**
 * Sort conversations by recent activity
 * @param {Array} conversations - Conversations to sort
 * @returns {Array} - Sorted conversations
 */
export function sortByRecentActivity(conversations) {
  return [...(conversations || [])].sort((a, b) => {
    const dateA = new Date(a.last_message_at || 0).getTime();
    const dateB = new Date(b.last_message_at || 0).getTime();
    return dateB - dateA;
  });
}

/**
 * Pin/unpin conversations
 * Note: This would require storing pinned conversation IDs
 * @param {Array} conversations - All conversations
 * @param {Array} pinnedIds - IDs of pinned conversations
 * @returns {Object} - { pinned, unpinned }
 */
export function organizePinnedConversations(conversations, pinnedIds = []) {
  const pinned = (conversations || []).filter(c => pinnedIds.includes(c.id));
  const unpinned = (conversations || []).filter(c => !pinnedIds.includes(c.id));

  return {
    pinned: sortByRecentActivity(pinned),
    unpinned: sortByRecentActivity(unpinned)
  };
}

/**
 * Archive/unarchive conversations
 * Note: This would require storing archived conversation IDs
 * @param {Array} conversations - All conversations
 * @param {Array} archivedIds - IDs of archived conversations
 * @returns {Object} - { active, archived }
 */
export function organizeArchivedConversations(conversations, archivedIds = []) {
  const active = (conversations || []).filter(c => !archivedIds.includes(c.id));
  const archived = (conversations || []).filter(c => archivedIds.includes(c.id));

  return {
    active: sortByRecentActivity(active),
    archived: sortByRecentActivity(archived)
  };
}

/**
 * Get message statistics for a conversation
 * @param {string} conversationId - Conversation ID
 * @returns {Promise<Object>} - Statistics object
 */
export async function getConversationStats(conversationId) {
  try {
    const messages = await base44.entities.Message.filter({
      conversation_id: conversationId
    });

    const totalMessages = messages.length;
    const mediaCount = messages.filter(m => m.media_url).length;
    const deletedCount = messages.filter(m => m.is_deleted).length;
    const reactionCount = messages.reduce((sum, m) => sum + (m.reactions?.length || 0), 0);

    return {
      totalMessages,
      mediaCount,
      deletedCount,
      reactionCount,
      firstMessage: messages[0],
      lastMessage: messages[messages.length - 1]
    };
  } catch (error) {
    console.error('Error getting conversation stats:', error);
    return null;
  }
}
