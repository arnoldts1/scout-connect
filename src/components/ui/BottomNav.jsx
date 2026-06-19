import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Home, Search, PlusSquare, MessageCircle, User, Trophy, Shield, Calendar,
  MoreHorizontal, BookOpen, ShoppingBag, Briefcase, Navigation, BarChart3, X, CreditCard
} from 'lucide-react';
import { createPageUrl } from '@/utils';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/lib/ThemeContext';
import { getTranslation } from '@/components/ui/translations';

export default function BottomNav({ user, unreadMessages = 0 }) {
  const location = useLocation();
  const currentPath = location.pathname;
  const { language, t } = useLanguage();
  const [showMore, setShowMore] = useState(false);

  // Only info@ts.com can be admin
  const isAdmin = user?.email === 'info@ts.com';

  // Main nav items (shown directly)
  const mainNavItems = [
    { icon: Home, labelKey: 'home', page: 'Home' },
    { icon: Search, labelKey: 'explore', page: 'Explore' },
    { icon: PlusSquare, labelKey: 'create', page: 'CreatePost' },
    { icon: MessageCircle, labelKey: 'messages', page: 'Messages' },
  ];

  // More menu items
  const moreNavItems = [
    { icon: BookOpen, label: 'Training', page: 'Training' },
    { icon: ShoppingBag, label: 'Marketplace', page: 'Marketplace' },
    { icon: Navigation, label: 'Adventures', page: 'AdventureFinder' },
    { icon: Briefcase, label: 'Leader Tools', page: 'LeaderToolkit' },
    { icon: Calendar, label: 'Events', page: 'Events' },
    { icon: Trophy, label: 'Leaderboard', page: 'Leaderboard' },
    { icon: CreditCard, label: 'RSA Revenue', page: 'RevenueTracker' },
    { icon: User, label: 'Profile', page: 'Profile' },
  ];

  // Add role-specific items
  if (isAdmin) {
    moreNavItems.push({ icon: BarChart3, label: 'Subscriptions', page: 'SubscriptionAdmin' });
    moreNavItems.push({ icon: Shield, label: 'Admin', page: 'Admin' });
  }

  // Desktop sidebar items
  const allNavItems = [
    { icon: Home, labelKey: 'home', page: 'Home' },
    { icon: Search, labelKey: 'explore', page: 'Explore' },
    { icon: PlusSquare, labelKey: 'create', page: 'CreatePost' },
    { icon: BookOpen, label: 'Training', page: 'Training' },
    { icon: ShoppingBag, label: 'Marketplace', page: 'Marketplace' },
    { icon: Navigation, label: 'Adventures', page: 'AdventureFinder' },
    { icon: Briefcase, label: 'Leader Tools', page: 'LeaderToolkit' },
    { icon: Calendar, labelKey: 'events', page: 'Events' },
    { icon: Trophy, labelKey: 'leaderboard', page: 'Leaderboard' },
    { icon: CreditCard, label: 'RSA Revenue', page: 'RevenueTracker' },
    { icon: MessageCircle, labelKey: 'messages', page: 'Messages' },
    { icon: User, labelKey: 'profile', page: 'Profile' },
    ...(isAdmin ? [{ icon: BarChart3, label: 'Subscriptions', page: 'SubscriptionAdmin' }, { icon: Shield, labelKey: 'admin', page: 'Admin' }] : []),
  ];

  const isActive = (page) => {
    const pageUrl = createPageUrl(page);
    return currentPath === pageUrl || currentPath.startsWith(pageUrl + '?');
  };

  return (
    <>
      {/* Mobile Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-t border-gray-100 dark:border-gray-800 z-50 md:hidden shadow-2xl">
        <div className="flex items-center justify-around h-14">
          {mainNavItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.page);
            const showBadge = item.page === 'Messages' && unreadMessages > 0;
            
            return (
              <Link
                key={item.page}
                to={createPageUrl(item.page)}
                className={cn(
                  "flex flex-col items-center justify-center flex-1 h-full transition-all duration-200 relative",
                  active 
                    ? "text-emerald-600 dark:text-emerald-400" 
                    : "text-gray-500 dark:text-gray-400"
                )}
              >
                <div className="relative">
                  <Icon className={cn("w-5 h-5", active && "scale-110")} strokeWidth={active ? 2.5 : 2} />
                  {showBadge && (
                    <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 bg-red-500 text-white text-[10px] font-medium rounded-full flex items-center justify-center px-1">
                      {unreadMessages > 99 ? '99+' : unreadMessages}
                    </span>
                  )}
                </div>
                <span className="text-[10px] mt-0.5">{t(item.labelKey)}</span>
              </Link>
            );
          })}
          
          {/* More Button */}
          <button
            onClick={() => setShowMore(true)}
            className="flex flex-col items-center justify-center flex-1 h-full text-gray-500 dark:text-gray-400"
          >
            <MoreHorizontal className="w-5 h-5" />
            <span className="text-[10px] mt-0.5">More</span>
          </button>
        </div>
      </nav>

      {/* More Menu Overlay */}
      {showMore && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowMore(false)} />
          <div className="absolute bottom-0 left-0 right-0 bg-white dark:bg-gray-900 rounded-t-3xl max-h-[70vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="font-semibold">More Options</h3>
              <button onClick={() => setShowMore(false)} className="p-2">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2 p-4">
              {moreNavItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.page);
                
                return (
                  <Link
                    key={item.page}
                    to={createPageUrl(item.page)}
                    onClick={() => setShowMore(false)}
                    className={cn(
                      "flex flex-col items-center justify-center p-4 rounded-xl transition-all",
                      active 
                        ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600" 
                        : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
                    )}
                  >
                    <Icon className="w-6 h-6 mb-2" />
                    <span className="text-xs text-center">{item.label || t(item.labelKey)}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Desktop Side Nav */}
      <nav className="hidden md:flex fixed left-0 top-14 bottom-0 w-64 bg-white/50 dark:bg-gray-900/50 backdrop-blur-md border-r border-gray-100 dark:border-gray-800 z-40 flex-col py-6 px-4 overflow-y-auto shadow-xl">
        <div className="space-y-1">
          {allNavItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.page);
            
            return (
              <Link
                key={item.page}
                to={createPageUrl(item.page)}
                className={cn(
                  "flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200",
                  active 
                    ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 font-semibold" 
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100"
                )}
              >
                <Icon 
                  className={cn("w-5 h-5", active && "scale-110")} 
                  strokeWidth={active ? 2.5 : 2}
                />
                <span className="text-sm">{item.label || t(item.labelKey)}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
