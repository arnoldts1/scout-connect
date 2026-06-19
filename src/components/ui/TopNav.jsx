import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Bell, MessageCircle, Menu, X, Settings, LogOut, User } from 'lucide-react';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger } from
'@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export default function TopNav({ user, unreadNotifications = 0, unreadMessages = 0 }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = () => {
    base44.auth.logout();
  };

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        scrolled ?
        "bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg shadow-sm" :
        "bg-white dark:bg-gray-900"
      )}>

      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <Link to={createPageUrl('Home')} className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{
                backgroundImage: 'url(https://cdn.builder.io/api/v1/image/assets%2Fdf4dce830ed64b7eb7e941bafa74dac4%2Fa6ec4813c0dd480face028398b77e5eb)',
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'center',
                backgroundSize: 'cover'
              }}
            />
            <span className="font-semibold text-lg text-gray-900 dark:text-white hidden sm:block">
              Scout Connect
            </span>
          </Link>

          {/* Search - Desktop */}
          <div className="hidden md:flex items-center flex-1 max-w-md mx-8">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search scouts, clans, events..."
                className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-800 border-0 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all" />

            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 sm:gap-2">
            <Link to={createPageUrl('Messages')} className="md:hidden relative">
              <Button variant="ghost" size="icon" className="rounded-full">
                <MessageCircle className="w-5 h-5" />
                {unreadMessages > 0 &&
                <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {unreadMessages > 9 ? '9+' : unreadMessages}
                  </span>
                }
              </Button>
            </Link>

            <Link to={createPageUrl('Notifications')} className="relative">
              <Button variant="ghost" size="icon" className="rounded-full">
                <Bell className="w-5 h-5" />
                {unreadNotifications > 0 &&
                <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {unreadNotifications > 9 ? '9+' : unreadNotifications}
                  </span>
                }
              </Button>
            </Link>

            <Link to={createPageUrl('Messages')} className="relative hidden md:flex">
              <Button variant="ghost" size="icon" className="rounded-full">
                <MessageCircle className="w-5 h-5" />
                {unreadMessages > 0 &&
                <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {unreadMessages > 9 ? '9+' : unreadMessages}
                  </span>
                }
              </Button>
            </Link>

            {/* Profile Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <Avatar className="w-8 h-8 ring-2 ring-emerald-500/20">
                    <AvatarImage src={user?.avatar} />
                    <AvatarFallback className="bg-emerald-100 text-emerald-700 text-sm">
                      {user?.full_name?.charAt(0) || user?.username?.charAt(0) || 'S'}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-3 py-2">
                  <p className="font-medium text-sm">{user?.full_name || 'Scout'}</p>
                  <p className="text-xs text-gray-500">@{user?.username || 'username'}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to={createPageUrl('Profile')} className="flex items-center gap-2 cursor-pointer">
                    <User className="w-4 h-4" />
                    Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to={createPageUrl('Settings')} className="flex items-center gap-2 cursor-pointer">
                    <Settings className="w-4 h-4" />
                    Settings
                  </Link>
                </DropdownMenuItem>

                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-red-600 cursor-pointer">
                  <LogOut className="w-4 h-4 mr-2" />
                  Log Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>);

}
