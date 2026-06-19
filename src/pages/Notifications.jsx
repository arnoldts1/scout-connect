import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Heart, MessageCircle, UserPlus, AtSign, Share2, 
  Award, Calendar, Users, Bell, Check, Trash2 
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { createPageUrl } from '@/utils';
import { cn } from '@/lib/utils';

// Helper function to format time properly
const formatTimeAgo = (date) => {
  const now = new Date();
  const past = new Date(date);
  const diffMs = now - past;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
  return past.toLocaleDateString();
};

const NOTIFICATION_ICONS = {
  like: Heart,
  comment: MessageCircle,
  follow: UserPlus,
  mention: AtSign,
  share: Share2,
  badge: Award,
  event: Calendar,
  clan: Users,
  patrol: Users,
  message: MessageCircle,
  system: Bell,
};

const NOTIFICATION_COLORS = {
  like: 'text-red-500 bg-red-50',
  comment: 'text-blue-500 bg-blue-50',
  follow: 'text-emerald-500 bg-emerald-50',
  mention: 'text-purple-500 bg-purple-50',
  share: 'text-orange-500 bg-orange-50',
  badge: 'text-amber-500 bg-amber-50',
  event: 'text-teal-500 bg-teal-50',
  clan: 'text-indigo-500 bg-indigo-50',
  patrol: 'text-pink-500 bg-pink-50',
  message: 'text-blue-500 bg-blue-50',
  system: 'text-gray-500 bg-gray-50',
};

export default function Notifications() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);

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

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      return await base44.entities.Notification.filter(
        { user_id: user.id },
        '-created_date',
        100
      );
    },
    enabled: !!user?.id,
  });

  const unreadNotifications = notifications.filter(n => !n.is_read);
  const readNotifications = notifications.filter(n => n.is_read);

  const markAsRead = async (notificationId) => {
    await base44.entities.Notification.update(notificationId, { is_read: true });
    queryClient.invalidateQueries(['notifications']);
    queryClient.invalidateQueries(['unreadNotifications']);
  };

  const markAllAsRead = async () => {
    const promises = unreadNotifications.map(n => 
      base44.entities.Notification.update(n.id, { is_read: true })
    );
    await Promise.all(promises);
    queryClient.invalidateQueries(['notifications']);
    queryClient.invalidateQueries(['unreadNotifications']);
  };

  const deleteNotification = async (notificationId) => {
    await base44.entities.Notification.delete(notificationId);
    queryClient.invalidateQueries(['notifications']);
  };

  const getNotificationLink = (notification) => {
    switch (notification.reference_type) {
      case 'post':
        return createPageUrl(`Post?id=${notification.reference_id}`);
      case 'user':
        return createPageUrl(`Profile?id=${notification.reference_id}`);
      case 'event':
        return createPageUrl(`Event?id=${notification.reference_id}`);
      case 'clan':
        return createPageUrl(`Clan?id=${notification.reference_id}`);
      default:
        return null;
    }
  };

  const NotificationItem = ({ notification }) => {
    const Icon = NOTIFICATION_ICONS[notification.type] || Bell;
    const colorClass = NOTIFICATION_COLORS[notification.type] || NOTIFICATION_COLORS.system;
    const link = getNotificationLink(notification);

    const content = (
      <div 
        className={cn(
          "flex items-start gap-3 p-4 transition-colors",
          !notification.is_read && "bg-emerald-50/50 dark:bg-emerald-900/10"
        )}
        onClick={() => !notification.is_read && markAsRead(notification.id)}
      >
        <div className="relative">
          <Avatar className="w-12 h-12">
            <AvatarImage src={notification.actor_avatar} />
            <AvatarFallback className="bg-gray-100 text-gray-600">
              {notification.actor_name?.charAt(0) || 'S'}
            </AvatarFallback>
          </Avatar>
          <div className={cn(
            "absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center",
            colorClass
          )}>
            <Icon className="w-3 h-3" />
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm text-gray-900 dark:text-white">
            <span className="font-semibold">{notification.actor_name}</span>
            {' '}
            <span className="text-gray-600 dark:text-gray-400">{notification.message}</span>
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {formatTimeAgo(notification.created_date)}
          </p>
        </div>

        {!notification.is_read && (
          <div className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0 mt-2" />
        )}
      </div>
    );

    return link ? (
      <Link to={link} className="block hover:bg-gray-50 dark:hover:bg-gray-800/50">
        {content}
      </Link>
    ) : (
      <div className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
        {content}
      </div>
    );
  };

  // Group notifications by time
  const groupNotificationsByTime = (notifs) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 86400000);
    const thisWeek = new Date(today.getTime() - 7 * 86400000);

    const groups = {
      today: [],
      yesterday: [],
      thisWeek: [],
      earlier: []
    };

    notifs.forEach(n => {
      const date = new Date(n.created_date);
      if (date >= today) {
        groups.today.push(n);
      } else if (date >= yesterday) {
        groups.yesterday.push(n);
      } else if (date >= thisWeek) {
        groups.thisWeek.push(n);
      } else {
        groups.earlier.push(n);
      }
    });

    return groups;
  };

  const groupedNotifications = groupNotificationsByTime(notifications);

  return (
    <div className="max-w-2xl mx-auto bg-white dark:bg-gray-900 min-h-screen">
      {/* Header */}
      <div className="sticky top-14 z-10 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center justify-between px-4 py-3">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Notifications</h1>
          {unreadNotifications.length > 0 && (
            <Button 
              variant="ghost" 
              size="sm"
              onClick={markAllAsRead}
              className="text-emerald-600"
            >
              <Check className="w-4 h-4 mr-2" />
              Mark all read
            </Button>
          )}
        </div>
      </div>

      {/* Notifications List */}
      {notifications.length === 0 && !isLoading ? (
        <div className="text-center py-20 px-4">
          <div className="w-20 h-20 mx-auto mb-4 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
            <Bell className="w-10 h-10 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            No notifications yet
          </h3>
          <p className="text-gray-500">
            When you get notifications, they'll show up here.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-gray-100 dark:divide-gray-800">
          {/* Today */}
          {groupedNotifications.today.length > 0 && (
            <div>
              <div className="px-4 py-2 bg-gray-50 dark:bg-gray-800/50">
                <p className="text-xs font-medium text-gray-500 uppercase">Today</p>
              </div>
              {groupedNotifications.today.map((notification) => (
                <NotificationItem key={notification.id} notification={notification} />
              ))}
            </div>
          )}

          {/* Yesterday */}
          {groupedNotifications.yesterday.length > 0 && (
            <div>
              <div className="px-4 py-2 bg-gray-50 dark:bg-gray-800/50">
                <p className="text-xs font-medium text-gray-500 uppercase">Yesterday</p>
              </div>
              {groupedNotifications.yesterday.map((notification) => (
                <NotificationItem key={notification.id} notification={notification} />
              ))}
            </div>
          )}

          {/* This Week */}
          {groupedNotifications.thisWeek.length > 0 && (
            <div>
              <div className="px-4 py-2 bg-gray-50 dark:bg-gray-800/50">
                <p className="text-xs font-medium text-gray-500 uppercase">This Week</p>
              </div>
              {groupedNotifications.thisWeek.map((notification) => (
                <NotificationItem key={notification.id} notification={notification} />
              ))}
            </div>
          )}

          {/* Earlier */}
          {groupedNotifications.earlier.length > 0 && (
            <div>
              <div className="px-4 py-2 bg-gray-50 dark:bg-gray-800/50">
                <p className="text-xs font-medium text-gray-500 uppercase">Earlier</p>
              </div>
              {groupedNotifications.earlier.map((notification) => (
                <NotificationItem key={notification.id} notification={notification} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}