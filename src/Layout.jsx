import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import TopNav from '@/components/ui/TopNav';
import BottomNav from '@/components/ui/BottomNav';
import { createPageUrl } from '@/utils';

export default function Layout({ children, currentPageName }) {
  const [user, setUser] = useState(null);

  // Apply theme from localStorage or user preference
  useEffect(() => {
    const applyTheme = (theme) => {
      const root = document.documentElement;
      if (theme === 'dark') {
        root.classList.add('dark');
      } else if (theme === 'light') {
        root.classList.remove('dark');
      } else {
        // System preference
        if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
          root.classList.add('dark');
        } else {
          root.classList.remove('dark');
        }
      }
    };
    
    const savedTheme = localStorage.getItem('scout-theme') || 'light';
    applyTheme(savedTheme);
  }, []);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
        
        // Apply user's theme preference and save to localStorage
        if (currentUser?.theme) {
          localStorage.setItem('scout-theme', currentUser.theme);
          const root = document.documentElement;
          if (currentUser.theme === 'dark') {
            root.classList.add('dark');
          } else if (currentUser.theme === 'light') {
            root.classList.remove('dark');
          }
        }
        
        // Generate scout_id for users who don't have one yet (already onboarded)
        if (currentUser && currentUser.onboarding_complete && !currentUser.scout_id) {
          const year = new Date().getFullYear();
          const num = Math.floor(Math.random() * 90000) + 10000;
          const scout_id = `RSA-${year}-${num}`;
          await base44.auth.updateMe({ scout_id, last_login: new Date().toISOString() });
        } else {
          // Record login activity for admin tracking
          await base44.auth.updateMe({
            last_login: new Date().toISOString()
          });
        }
        
        // Redirect to onboarding if not completed (except on Onboarding page)
        if (currentUser && !currentUser.onboarding_complete && currentPageName !== 'Onboarding') {
          window.location.href = createPageUrl('Onboarding');
        }
      } catch (error) {
        // Check if it's a configuration error
        if (error?.message?.includes('Supabase') && error?.message?.includes('Not configured')) {
          console.error('Supabase Error:', error.message);
          console.error('Please set your Supabase credentials in .env.local');
          // Show a user-friendly message
          console.warn('Running without Supabase. Some features may not work.');
        } else {
          console.log('Not authenticated or error fetching user');
        }
      }
    };
    fetchUser();
  }, [currentPageName]);

  const { data: unreadNotifications = 0 } = useQuery({
    queryKey: ['unreadNotifications', user?.id],
    queryFn: async () => {
      if (!user?.id) return 0;
      const notifications = await base44.entities.Notification.filter({ 
        user_id: user.id, 
        is_read: false 
      });
      return notifications.length;
    },
    enabled: !!user?.id,
    refetchInterval: 30000,
  });

  const { data: unreadMessages = 0 } = useQuery({
    queryKey: ['unreadMessages', user?.id],
    queryFn: async () => {
      if (!user?.id) return 0;
      const conversations = await base44.entities.Conversation.list();
      const userConvs = conversations.filter(c => c.participants?.includes(user.id));
      let total = 0;
      userConvs.forEach(conv => {
        total += conv.unread_count?.[user.id] || 0;
      });
      return total;
    },
    enabled: !!user?.id,
    refetchInterval: 10000,
  });

  // Pages that don't show navigation
  const hideNavPages = ['Chat', 'Onboarding'];
  const hideNav = hideNavPages.includes(currentPageName);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 scout-bg-pattern">
      <style>{`
        :root {
          --scout-primary: #059669;
          --scout-secondary: #14b8a6;
        }
        
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>

      {!hideNav && (
        <TopNav 
          user={user} 
          unreadNotifications={unreadNotifications}
          unreadMessages={unreadMessages}
        />
      )}
      
      <main className={!hideNav ? "pt-14 pb-16 md:pb-0 md:pl-64" : ""}>
        {children}
      </main>
      
      {!hideNav && <BottomNav user={user} unreadMessages={unreadMessages} />}
    </div>
  );
}
