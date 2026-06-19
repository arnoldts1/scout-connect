import React from 'react';
import { Link } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Users, Check, CheckCheck } from 'lucide-react';
import { createPageUrl } from '@/utils';
import { cn } from '@/lib/utils';
import moment from 'moment';
import AvatarWithBadge from '@/components/ui/AvatarWithBadge';

export default function ConversationList({ conversations, currentUserId, selectedId, users = [] }) {
  const getDisplayInfo = (conversation) => {
    if (conversation.type === 'group') {
      return {
        name: conversation.group_name || 'Group Chat',
        avatar: conversation.group_avatar,
        isGroup: true,
        user: null
      };
    }
    
    const otherParticipant = conversation.participant_details?.find(
      p => p.user_id !== currentUserId
    );
    
    const user = users.find(u => u.id === otherParticipant?.user_id);
    
    return {
      name: otherParticipant?.name || 'Scout',
      avatar: otherParticipant?.avatar,
      isGroup: false,
      user: user
    };
  };

  const getUnreadCount = (conversation) => {
    if (!conversation.unread_count) return 0;
    return conversation.unread_count[currentUserId] || 0;
  };

  return (
    <div className="divide-y divide-gray-100 dark:divide-gray-800">
      {conversations.map((conversation) => {
        const displayInfo = getDisplayInfo(conversation);
        const unreadCount = getUnreadCount(conversation);
        const isSelected = selectedId === conversation.id;
        
        return (
          <Link
            key={conversation.id}
            to={createPageUrl(`Chat?id=${conversation.id}`)}
            className={cn(
              "flex items-center gap-3 p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors",
              isSelected && "bg-gray-50 dark:bg-gray-800/50"
            )}
          >
            <div className="relative">
              {displayInfo.isGroup ? (
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center">
                  <Users className="w-6 h-6 text-white" />
                </div>
              ) : (
                <AvatarWithBadge 
                  user={displayInfo.user}
                  src={displayInfo.avatar}
                  fallbackText={displayInfo.name?.charAt(0) || 'S'}
                  size="lg"
                />
              )}
              {/* Online indicator */}
              <span className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 border-2 border-white dark:border-gray-900 rounded-full" />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <p className={cn(
                  "font-medium truncate",
                  unreadCount > 0 ? "text-gray-900 dark:text-white" : "text-gray-700 dark:text-gray-300"
                )}>
                  {displayInfo.name}
                </p>
                <span className="text-xs text-gray-500 flex-shrink-0">
                  {conversation.last_message_at 
                    ? moment(conversation.last_message_at).fromNow(true)
                    : ''
                  }
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <p className={cn(
                  "text-sm truncate max-w-[200px]",
                  unreadCount > 0 
                    ? "text-gray-900 dark:text-white font-medium" 
                    : "text-gray-500 dark:text-gray-400"
                )}>
                  {conversation.last_sender_id === currentUserId && (
                    <CheckCheck className="w-4 h-4 inline mr-1 text-emerald-500" />
                  )}
                  {conversation.last_message || 'No messages yet'}
                </p>
                
                {unreadCount > 0 && (
                  <Badge className="bg-emerald-500 text-white text-xs px-2 py-0.5 rounded-full">
                    {unreadCount}
                  </Badge>
                )}
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}