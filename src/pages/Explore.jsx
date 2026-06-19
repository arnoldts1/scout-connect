import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Search, TrendingUp, Users, Calendar, Award, Hash, Play, Building } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { createPageUrl } from '@/utils';
import { cn } from '@/lib/utils';
import ClanCard from '@/components/scout/ClanCard';
import EventCard from '@/components/scout/EventCard';
import UnitCard from '@/components/scout/UnitCard';

export default function Explore() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('discover');

  const { data: posts = [], isLoading: postsLoading } = useQuery({
    queryKey: ['explore-posts'],
    queryFn: async () => {
      const allPosts = await base44.entities.Post.list();
      return allPosts.filter(p => p.status === 'approved');
    },
  });

  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: ['explore-users'],
    queryFn: async () => {
      const allProfiles = await base44.entities.PublicProfile.list('-followers_count', 100);
      return allProfiles;
    },
  });

  const { data: clans = [], isLoading: clansLoading } = useQuery({
    queryKey: ['explore-clans'],
    queryFn: async () => {
      const allClans = await base44.entities.Clan.list();
      return allClans.filter(c => c.status === 'active' || !c.status);
    },
  });

  const { data: units = [], isLoading: unitsLoading } = useQuery({
    queryKey: ['explore-units'],
    queryFn: async () => {
      const allUnits = await base44.entities.Unit.list();
      return allUnits.filter(u => u.status === 'active' || !u.status);
    },
  });

  const { data: events = [], isLoading: eventsLoading } = useQuery({
    queryKey: ['explore-events'],
    queryFn: async () => {
      const allEvents = await base44.entities.Event.list();
      return allEvents.filter(e => e.status === 'approved' || e.status === 'ongoing');
    },
  });

  // Extract trending hashtags
  const trendingHashtags = useMemo(() => {
    const tagCounts = {};
    posts.forEach(post => {
      post.hashtags?.forEach(tag => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    });
    return Object.entries(tagCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([tag, count]) => ({ tag, count }));
  }, [posts]);

  // Auto-switch tab on search to show categorized results
  const handleSearch = (query) => {
    setSearchQuery(query);
    if (query.trim() && activeTab === 'discover') {
      setActiveTab('scouts');
    }
    if (!query.trim()) {
      setActiveTab('discover');
    }
  };

  // Filter based on search
  const filteredPosts = posts.filter(post =>
    (post.content || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    post.hashtags?.some(tag => (tag || '').toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredUsers = users.filter(user =>
    (user.full_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (user.username || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredUnits = units.filter(u =>
    (u.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (u.location || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredClans = clans.filter(c =>
    (c.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.location || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredEvents = events.filter(e =>
    (e.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (e.location || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
      {/* Search Bar */}
      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <Input
          type="text"
          placeholder="Search scouts, clans, events, hashtags..."
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          className="pl-12 pr-4 py-6 text-lg rounded-2xl border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
        />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        {/* Custom scrollable tab bar */}
        <div className="overflow-x-auto scrollbar-hide -mx-3 sm:-mx-4 px-3 sm:px-4 mb-6 border-b border-gray-100 dark:border-gray-800">
          <div className="flex gap-0 w-max">
            {[
              { value: 'discover', label: 'Discover', Icon: TrendingUp },
              { value: 'scouts',   label: 'Scouts',   Icon: Users },
              { value: 'units',    label: 'Units',    Icon: Building },
              { value: 'clans',    label: 'Clans',    Icon: Award },
              { value: 'events',   label: 'Events',   Icon: Calendar },
            ].map(({ value, label, Icon }) => (
              <button
                key={value}
                onClick={() => setActiveTab(value)}
                className={cn(
                  "flex items-center gap-1.5 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors",
                  activeTab === value
                    ? "border-emerald-600 text-emerald-600 dark:text-emerald-400"
                    : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
                )}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Discover Tab */}
        <TabsContent value="discover" className="space-y-8">
          {/* Trending Hashtags */}
          {trendingHashtags.length > 0 && (
            <div>
              <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <Hash className="w-5 h-5 text-emerald-600" />
                Trending
              </h3>
              <div className="flex flex-wrap gap-2">
                {trendingHashtags.map(({ tag, count }) => (
                  <Badge 
                    key={tag}
                    variant="secondary"
                    className="px-4 py-2 text-sm bg-gray-100 dark:bg-gray-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 cursor-pointer transition-colors"
                  >
                    #{tag}
                    <span className="ml-2 text-gray-400">{count}</span>
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Photo Grid */}
          {postsLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
              <p className="text-gray-500 mt-4">Loading posts...</p>
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No posts found</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-1 md:gap-2">
              {filteredPosts.map((post, idx) => (
              <Link 
                key={post.id}
                to={createPageUrl(`Post?id=${post.id}`)}
                className={cn(
                  "relative aspect-square bg-gray-100 dark:bg-gray-800 overflow-hidden group",
                  // Make every 3rd item span 2 rows on larger screens
                  idx % 5 === 0 && "md:row-span-2 md:col-span-2"
                )}
              >
                <img 
                  src={post.media_urls?.[0] || 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=400'} 
                  alt=""
                  className="w-full h-full object-cover transition-transform group-hover:scale-105"
                />
                {post.media_type === 'video' && (
                  <div className="absolute top-2 right-2">
                    <Play className="w-5 h-5 text-white drop-shadow-lg" />
                  </div>
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 text-white">
                  <span className="flex items-center gap-1">
                    ❤️ {post.likes_count || 0}
                  </span>
                  <span className="flex items-center gap-1">
                    💬 {post.comments_count || 0}
                  </span>
                </div>
              </Link>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Scouts Tab */}
        <TabsContent value="scouts">
          {usersLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
              <p className="text-gray-500 mt-4">Loading scouts...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No scouts found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredUsers.map((scout) => (
              <Link 
                key={scout.id}
                to={createPageUrl(`Profile?id=${scout.user_id}`)}
                className="flex items-center gap-4 p-4 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 hover:shadow-md transition-all"
              >
                <Avatar className="w-16 h-16">
                  <AvatarImage src={scout.avatar} />
                  <AvatarFallback className="text-xl bg-emerald-100 text-emerald-700">
                    {scout.full_name?.charAt(0) || 'S'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-gray-900 dark:text-white truncate">
                      {scout.full_name || 'Scout'}
                    </p>
                    {scout.is_verified && (
                      <Badge className="bg-emerald-500 text-white text-xs">✓</Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 truncate">@{scout.username}</p>
                  <div className="flex items-center gap-4 mt-1 text-sm text-gray-400">
                    <span>{scout.followers_count || 0} followers</span>
                    {scout.clan_name && <span>{scout.clan_name}</span>}
                  </div>
                </div>
                <Button size="sm" className="rounded-full bg-emerald-600 hover:bg-emerald-700">
                  Follow
                </Button>
                </Link>
                ))}
                </div>
                )}
                </TabsContent>

        {/* Units Tab */}
        <TabsContent value="units">
          {unitsLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
              <p className="text-gray-500 mt-4">Loading units...</p>
            </div>
          ) : filteredUnits.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No units found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredUnits.map((unit) => (
                <UnitCard key={unit.id} unit={unit} />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Clans Tab */}
        <TabsContent value="clans">
          {clansLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
              <p className="text-gray-500 mt-4">Loading clans...</p>
            </div>
          ) : filteredClans.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No clans found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredClans.map((clan) => (
                <ClanCard key={clan.id} clan={clan} />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Events Tab */}
        <TabsContent value="events">
          {eventsLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
              <p className="text-gray-500 mt-4">Loading events...</p>
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No events found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredEvents.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
