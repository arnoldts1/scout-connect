import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { getOrCreateDirectConversation, createGroupConversation } from '@/api/conversationService';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Search, Edit, Users, Plus, MessageSquare, ChevronDown, 
  Phone, Video, Settings, ArrowLeft, Check, CheckCheck, X, Bell
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { createPageUrl } from '@/utils';
import { cn } from '@/lib/utils';
import moment from 'moment';

export default function Messages() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const storyScrollRef = useRef(null);
  
  const [user, setUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('inbox'); // inbox, requests
  const [showNewChat, setShowNewChat] = useState(false);
  const [showNewGroup, setShowNewGroup] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [groupName, setGroupName] = useState('');
  const [searchUserQuery, setSearchUserQuery] = useState('');

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (error) {
        navigate(createPageUrl('Home'));
      }
    };
    fetchUser();
  }, []);

  // Fetch conversations
  const { data: conversations = [], isLoading } = useQuery({
    queryKey: ['conversations', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const convs = await base44.entities.Conversation.list('-last_message_at', 50);
      return convs.filter(c => c.participants?.includes(user.id));
    },
    enabled: !!user?.id,
    refetchInterval: 3000,
  });

  // Fetch stories from users in conversations + friends
  const { data: stories = [] } = useQuery({
    queryKey: ['stories', user?.id, conversations],
    queryFn: async () => {
      if (!user?.id || conversations.length === 0) return [];
      
      try {
        // Get all stories, then filter to relevant ones
        const allStories = await base44.entities.Story.list('-created_date', 100);
        
        // Get participant IDs from conversations
        const participantIds = new Set();
        conversations.forEach(conv => {
          (conv.participants || []).forEach(id => {
            if (id !== user.id) participantIds.add(id);
          });
        });

        // Filter stories from participants or users I follow
        const relevantStories = allStories.filter(story => {
          const isFromParticipant = participantIds.has(story.author_id);
          // Also check if not expired (24 hours)
          const isExpired = story.expires_at && new Date(story.expires_at) < new Date();
          return isFromParticipant && !isExpired;
        });

        return relevantStories;
      } catch (error) {
        console.error('Error fetching stories:', error);
        return [];
      }
    },
    enabled: !!user?.id && conversations.length > 0,
  });

  // Fetch all users for new chat dialog
  const { data: allUsers = [] } = useQuery({
    queryKey: ['all-users'],
    queryFn: async () => {
      try {
        const profiles = await base44.entities.PublicProfile.list('full_name', 100);
        return profiles
          .filter(p => p.user_id !== user?.id)
          .map(p => ({
            id: p.user_id,
            full_name: p.full_name,
            username: p.username,
            avatar: p.avatar,
            email: p.email,
            is_verified: p.is_verified
          }));
      } catch (error) {
        console.error('Error fetching users:', error);
        return [];
      }
    },
    enabled: showNewChat || showNewGroup,
  });

  // Ensure conversations are sorted by most recent message first
  const sortedConversations = [...conversations].sort((a, b) => {
    const dateA = new Date(a.last_message_at || 0).getTime();
    const dateB = new Date(b.last_message_at || 0).getTime();
    return dateB - dateA; // Newest first
  });

  const directMessages = sortedConversations.filter(c => c.type === 'direct');
  const groupChats = sortedConversations.filter(c => c.type === 'group');

  const filteredConversations = sortedConversations.filter(conv => {
    if (!searchQuery) return true;
    const searchLower = searchQuery.toLowerCase();
    if (conv.type === 'group') {
      return (conv.group_name || '').toLowerCase().includes(searchLower);
    }
    return conv.participant_details?.some(p =>
      (p.name || '').toLowerCase().includes(searchLower)
    );
  });

  const filteredUsers = allUsers.filter(u => {
    const searchLower = searchUserQuery.toLowerCase();
    return (
      u.full_name?.toLowerCase().includes(searchLower) ||
      u.username?.toLowerCase().includes(searchLower)
    );
  });

  const handleStartDM = async (targetUser) => {
    try {
      const conversation = await getOrCreateDirectConversation(
        user.id,
        user,
        targetUser.id,
        targetUser
      );

      setShowNewChat(false);
      setSearchUserQuery('');
      navigate(createPageUrl(`Chat?id=${conversation.id}`));
    } catch (error) {
      console.error('Error starting DM:', error);
    }
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim() || selectedUsers.length === 0) return;

    try {
      const conversation = await createGroupConversation({
        currentUserId: user.id,
        currentUserData: user,
        participantIds: selectedUsers.map(u => u.id),
        participantDetails: selectedUsers.map(u => ({
          user_id: u.id,
          name: u.full_name,
          avatar: u.avatar
        })),
        groupName: groupName
      });

      setShowNewGroup(false);
      setSelectedUsers([]);
      setGroupName('');
      navigate(createPageUrl(`Chat?id=${conversation.id}`));
    } catch (error) {
      console.error('Error creating group:', error);
    }
  };

  const toggleUserSelection = (targetUser) => {
    if (selectedUsers.some(u => u.id === targetUser.id)) {
      setSelectedUsers(selectedUsers.filter(u => u.id !== targetUser.id));
    } else {
      setSelectedUsers([...selectedUsers, targetUser]);
    }
  };

  const getConversationDisplay = (conv) => {
    if (conv.type === 'group') {
      return {
        name: conv.group_name || 'Group',
        avatar: conv.group_avatar,
        subtitle: `${conv.participant_details?.length || 0} members`,
        isGroup: true
      };
    }

    const otherUser = conv.participant_details?.find(p => p.user_id !== user?.id);
    return {
      name: otherUser?.name || 'Unknown',
      avatar: otherUser?.avatar,
      isGroup: false
    };
  };

  const getStoryRingColor = (story) => {
    if (!story) return 'gray'; // No story - gray ring
    if (!story.viewers || story.viewers.includes(user?.id)) {
      return 'gray'; // Viewed - gray ring
    }
    return 'emerald'; // Unseen - colored ring
  };

  const getUniqueStoryUsers = () => {
    const userMap = new Map();
    
    // Add current user first
    userMap.set(user?.id, {
      id: user?.id,
      name: user?.full_name,
      avatar: user?.avatar,
      isCurrentUser: true,
      hasStory: false
    });

    // Add other users with stories
    stories.forEach(story => {
      if (!userMap.has(story.author_id)) {
        userMap.set(story.author_id, {
          id: story.author_id,
          name: story.sender_name,
          avatar: story.sender_avatar,
          isCurrentUser: false,
          hasStory: true
        });
      }
    });

    return Array.from(userMap.values());
  };

  if (!user) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin">⚡</div>
      </div>
    );
  }

  const storyUsers = getUniqueStoryUsers();
  const unreadCount = conversations.reduce((total, conv) => {
    const unread = conv.unread_count?.[user.id] || 0;
    return total + unread;
  }, 0);

  return (
    <div className="h-screen flex flex-col bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Messages</h1>
            {unreadCount > 0 && (
              <Badge className="bg-red-500 text-white">{unreadCount}</Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Dialog open={showNewChat} onOpenChange={setShowNewChat}>
              <DialogTrigger asChild>
                <Button
                  size="icon"
                  variant="ghost"
                  className="rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <Edit className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-sm">
                <DialogHeader>
                  <DialogTitle>New Message</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <Input
                    placeholder="Search users..."
                    value={searchUserQuery}
                    onChange={(e) => setSearchUserQuery(e.target.value)}
                    className="rounded-full"
                  />
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {filteredUsers.length > 0 ? (
                      filteredUsers.map(u => (
                        <button
                          key={u.id}
                          onClick={() => handleStartDM(u)}
                          className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                        >
                          <Avatar className="w-10 h-10">
                            <AvatarImage src={u.avatar} />
                            <AvatarFallback>{u.full_name?.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div className="text-left flex-1">
                            <p className="font-medium text-gray-900 dark:text-white">{u.full_name}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">@{u.username}</p>
                          </div>
                          {u.is_verified && <Check className="w-4 h-4 text-blue-500" />}
                        </button>
                      ))
                    ) : (
                      <p className="text-center text-gray-500 text-sm py-4">No users found</p>
                    )}
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={showNewGroup} onOpenChange={setShowNewGroup}>
              <DialogTrigger asChild>
                <Button
                  size="icon"
                  variant="ghost"
                  className="rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <Users className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-sm">
                <DialogHeader>
                  <DialogTitle>New Group</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <Input
                    placeholder="Group name"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    className="rounded-lg"
                  />
                  <Input
                    placeholder="Search users..."
                    value={searchUserQuery}
                    onChange={(e) => setSearchUserQuery(e.target.value)}
                    className="rounded-full"
                  />

                  {selectedUsers.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {selectedUsers.map(u => (
                        <Badge
                          key={u.id}
                          className="bg-emerald-500 text-white cursor-pointer"
                          onClick={() => toggleUserSelection(u)}
                        >
                          {u.full_name}
                          <X className="w-3 h-3 ml-1" />
                        </Badge>
                      ))}
                    </div>
                  )}

                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {filteredUsers.length > 0 ? (
                      filteredUsers.map(u => (
                        <button
                          key={u.id}
                          onClick={() => toggleUserSelection(u)}
                          className={cn(
                            'w-full flex items-center gap-3 p-3 rounded-lg transition',
                            selectedUsers.some(su => su.id === u.id)
                              ? 'bg-emerald-50 dark:bg-emerald-900/20'
                              : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                          )}
                        >
                          <Avatar className="w-10 h-10">
                            <AvatarImage src={u.avatar} />
                            <AvatarFallback>{u.full_name?.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div className="text-left flex-1">
                            <p className="font-medium text-gray-900 dark:text-white">{u.full_name}</p>
                          </div>
                          {selectedUsers.some(su => su.id === u.id) && (
                            <Check className="w-4 h-4 text-emerald-500" />
                          )}
                        </button>
                      ))
                    ) : (
                      <p className="text-center text-gray-500 text-sm py-4">No users found</p>
                    )}
                  </div>

                  <Button
                    onClick={handleCreateGroup}
                    disabled={!groupName.trim() || selectedUsers.length === 0}
                    className="w-full bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg"
                  >
                    Create Group
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      {/* Stories Row */}
      {storyUsers.length > 0 && (
        <div className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <div className="flex gap-4 overflow-x-auto pb-2" ref={storyScrollRef}>
              {storyUsers.map(storyUser => (
                <div
                  key={storyUser.id}
                  className="flex flex-col items-center gap-2 flex-shrink-0 cursor-pointer group"
                  onClick={() => {
                    if (storyUser.isCurrentUser) {
                      // TODO: Open story creator
                    } else if (storyUser.hasStory) {
                      // TODO: Open story viewer
                    }
                  }}
                >
                  <div className={cn(
                    'relative w-14 h-14 rounded-full p-0.5 transition-all',
                    getStoryRingColor(stories.find(s => s.author_id === storyUser.id)) === 'emerald'
                      ? 'bg-gradient-to-r from-emerald-400 to-teal-500'
                      : 'bg-gray-300 dark:bg-gray-600'
                  )}>
                    <Avatar className="w-full h-full">
                      <AvatarImage src={storyUser.avatar} />
                      <AvatarFallback>{storyUser.name?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    {storyUser.isCurrentUser && (
                      <div className="absolute bottom-0 right-0 bg-emerald-500 rounded-full p-1 border-2 border-white dark:border-gray-900">
                        <Plus className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-gray-700 dark:text-gray-300 text-center truncate w-14">
                    {storyUser.isCurrentUser ? 'Your Story' : storyUser.name?.split(' ')[0]}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Search Bar */}
      <div className="border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 rounded-full bg-gray-100 dark:bg-gray-800 border-0"
            />
          </div>
        </div>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin">⚡</div>
            </div>
          ) : filteredConversations.length > 0 ? (
            <div>
              {filteredConversations.map(conv => {
                const display = getConversationDisplay(conv);
                const unread = conv.unread_count?.[user.id] || 0;
                const lastMessageTime = conv.last_message_at
                  ? moment(conv.last_message_at).fromNow()
                  : 'Recently';

                return (
                  <Link
                    key={conv.id}
                    to={createPageUrl(`Chat?id=${conv.id}`)}
                    className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition"
                  >
                    <div className="relative">
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={display.avatar} />
                        <AvatarFallback>{display.name?.charAt(0)}</AvatarFallback>
                      </Avatar>
                      {!display.isGroup && (
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-900" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className={cn(
                          'font-medium truncate',
                          unread > 0 ? 'text-gray-900 dark:text-white font-bold' : 'text-gray-700 dark:text-gray-300'
                        )}>
                          {display.name}
                        </p>
                        <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">
                          {lastMessageTime}
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-2">
                        <p className={cn(
                          'text-sm truncate',
                          unread > 0 ? 'text-gray-600 dark:text-gray-400 font-medium' : 'text-gray-500 dark:text-gray-500'
                        )}>
                          {conv.last_message || 'No messages yet'}
                        </p>
                        {unread > 0 && (
                          <Badge className="bg-emerald-500 text-white flex-shrink-0">
                            {unread}
                          </Badge>
                        )}
                      </div>

                      {display.subtitle && (
                        <p className="text-xs text-gray-500 dark:text-gray-500">
                          {display.subtitle}
                        </p>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full gap-4 py-12">
              <MessageSquare className="w-12 h-12 text-gray-300 dark:text-gray-700" />
              <div className="text-center">
                <p className="text-gray-600 dark:text-gray-400 font-medium">No messages yet</p>
                <p className="text-gray-500 dark:text-gray-500 text-sm">
                  {searchQuery ? 'Try a different search' : 'Start a conversation'}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
