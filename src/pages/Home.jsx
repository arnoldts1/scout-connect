import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import StoryBar from '@/components/feed/StoryBar';
import PostCard from '@/components/feed/PostCard';
import DashboardModern from '@/components/DashboardModern';
import Footer from '@/components/ui/Footer';
import { Skeleton } from '@/components/ui/skeleton';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/lib/ThemeContext';
import { supabase } from '@/lib/supabase';

export default function Home() {
  const [user, setUser] = useState(null);
  const [showDashboard, setShowDashboard] = useState(true);
  const queryClient = useQueryClient();
  const { t } = useLanguage();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (error) {
        console.log('Not authenticated');
      }
    };
    fetchUser();
  }, []);

  // Fetch user stats
  const { data: stats = {} } = useQuery({
    queryKey: ['user-stats', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      try {
        // Get user badges count
        const { data: userBadges } = await supabase
          .from('user_badges')
          .select('id')
          .eq('user_id', user.id);

        // Get events attended
        const { data: events } = await supabase
          .from('registrations')
          .select('id')
          .eq('user_id', user.id)
          .eq('status', 'attended');

        // Get unit members count
        let unitMembersCount = 0;
        if (user.unit_id) {
          const { data: unitUsers } = await supabase
            .from('public_profiles')
            .select('id')
            .eq('unit_id', user.unit_id);
          unitMembersCount = unitUsers?.length || 0;
        }

        // Calculate points (badges * 10 + events * 15 + activities bonus)
        const points = (userBadges?.length || 0) * 10 + (events?.length || 0) * 15;

        return {
          points: points || 0,
          badges: userBadges?.length || 0,
          events: events?.length || 0,
          members: unitMembersCount
        };
      } catch (error) {
        console.error('Error fetching stats:', error);
        return { points: 0, badges: 0, events: 0, members: 0 };
      }
    },
  });

  // Fetch recent activities
  const { data: recentActivities = [] } = useQuery({
    queryKey: ['recent-activities', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      try {
        const activities = [];

        // Get recent posts
        const { data: userPosts } = await supabase
          .from('posts')
          .select('id, created_date')
          .eq('author_id', user.id)
          .order('created_date', { ascending: false })
          .limit(2);

        userPosts?.forEach(post => {
          activities.push({
            type: 'post',
            message: 'Posted a photo from camp',
            time: new Date(post.created_date).toLocaleDateString(),
            created_date: post.created_date
          });
        });

        // Get recent badges
        const { data: recentBadges } = await supabase
          .from('user_badges')
          .select('id, created_date')
          .eq('user_id', user.id)
          .order('created_date', { ascending: false })
          .limit(2);

        recentBadges?.forEach(badge => {
          activities.push({
            type: 'badge',
            message: 'Earned a new badge',
            time: new Date(badge.created_date).toLocaleDateString(),
            created_date: badge.created_date
          });
        });

        // Get recent event registrations
        const { data: eventRegs } = await supabase
          .from('registrations')
          .select('id, created_date')
          .eq('user_id', user.id)
          .order('created_date', { ascending: false })
          .limit(2);

        eventRegs?.forEach(reg => {
          activities.push({
            type: 'event',
            message: 'Registered for an event',
            time: new Date(reg.created_date).toLocaleDateString(),
            created_date: reg.created_date
          });
        });

        // Sort by date and limit to 4
        return activities
          .sort((a, b) => new Date(b.created_date) - new Date(a.created_date))
          .slice(0, 4);
      } catch (error) {
        console.error('Error fetching activities:', error);
        return [];
      }
    },
  });

  // Fetch unit stats
  const { data: unitStats = {} } = useQuery({
    queryKey: ['unit-stats', user?.unit_id],
    enabled: !!user?.unit_id,
    queryFn: async () => {
      try {
        // Get unit info
        const unit = await base44.entities.Unit.filter({ id: user.unit_id });
        if (!unit[0]) return { ranking: 0, participation: 0, completion: 0, points: 0 };

        const unitData = unit[0];

        // Get all units for ranking
        const allUnits = await base44.entities.Unit.list();
        const sortedUnits = allUnits
          .filter(u => u.points !== undefined && u.points !== null)
          .sort((a, b) => (b.points || 0) - (a.points || 0));
        const rankingPosition = sortedUnits.findIndex(u => u.id === user.unit_id) + 1;

        // Get member count and participation (members with recent activity)
        const unitMembers = (unitData.members || []).length;
        const { data: recentMembers } = await supabase
          .from('posts')
          .select('author_id')
          .eq('unit_id', user.unit_id)
          .gte('created_date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

        const activeMembers = new Set(recentMembers?.map(p => p.author_id) || []).size;
        const participation = unitMembers > 0 ? Math.round((activeMembers / unitMembers) * 100) : 0;

        // Get completion (% of members with onboarding complete)
        const { data: onboardedMembers } = await supabase
          .from('users')
          .select('id')
          .eq('unit_id', user.unit_id)
          .eq('onboarding_complete', true);

        const completion = unitMembers > 0 ? Math.round((onboardedMembers?.length || 0) / unitMembers * 100) : 0;

        return {
          ranking: rankingPosition,
          participation: Math.min(participation, 100),
          completion: Math.min(completion, 100),
          points: unitData.points || 0,
          name: unitData.name || 'Unit'
        };
      } catch (error) {
        console.error('Error fetching unit stats:', error);
        return { ranking: 0, participation: 0, completion: 0, points: 0 };
      }
    },
  });

  // Fetch upcoming events
  const { data: upcomingEvents = [] } = useQuery({
    queryKey: ['upcoming-events'],
    queryFn: async () => {
      try {
        const now = new Date().toISOString();
        console.log('📅 Fetching upcoming events from:', now);

        const { data: events, error } = await supabase
          .from('events')
          .select('id, title, start_date, location, status')
          .gte('start_date', now)
          .in('status', ['pending', 'approved'])
          .order('start_date', { ascending: true })
          .limit(3);

        if (error) {
          console.error('❌ Error fetching events:', error);
          return [];
        }

        console.log('✅ Found upcoming events:', events?.length || 0, events);

        return events?.map(event => ({
          id: event.id,
          title: event.title,
          date: new Date(event.start_date).toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          }),
          location: event.location || 'TBA',
          startDate: event.start_date
        })) || [];
      } catch (error) {
        console.error('❌ Error fetching events:', error);
        return [];
      }
    },
  });

  const { data: posts = [], isLoading, refetch, isFetching } = useQuery({
    queryKey: ['feed-posts'],
    queryFn: async () => {
      const allPosts = await base44.entities.Post.filter(
        { status: 'approved' },
        '-created_date',
        50
      );
      return allPosts;
    },
  });

  const handleRefresh = () => {
    refetch();
  };

  return (
    <div className="max-w-5xl mx-auto px-4">
      {/* Modern Dashboard on Load */}
      {showDashboard && user && (
        <div className="mb-8">
          <DashboardModern
            user={user}
            stats={stats}
            activities={recentActivities}
            events={upcomingEvents}
            unitStats={unitStats}
          />
          <div className="mt-8 text-center">
            <button
              onClick={() => setShowDashboard(false)}
              className="text-sm font-medium text-emerald-600 dark:text-emerald-400 hover:underline"
            >
              View Feed →
            </button>
          </div>
          <Footer />
        </div>
      )}

      {/* Feed Mode - Only show when not on dashboard */}
      {!showDashboard && (
        <>
          {/* Go Back Button */}
          <div className="mb-4">
            <button
              onClick={() => setShowDashboard(true)}
              className="text-sm font-medium text-emerald-600 dark:text-emerald-400 hover:underline"
            >
              ← Back to Dashboard
            </button>
          </div>

          {/* Stories */}
          <StoryBar user={user} />

          {/* Pull to Refresh Button (Desktop) */}
          <div className="hidden md:flex justify-center py-4">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleRefresh}
              disabled={isFetching}
              className="text-gray-500"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
              Refresh Feed
            </Button>
          </div>

          {/* Posts Feed */}
          <div className="md:px-4">
            {isLoading ? (
              <div className="space-y-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-white dark:bg-gray-900 rounded-2xl p-4 space-y-4">
                    <div className="flex items-center gap-3">
                      <Skeleton className="w-10 h-10 rounded-full" />
                      <div className="space-y-2">
                        <Skeleton className="w-32 h-4" />
                        <Skeleton className="w-20 h-3" />
                      </div>
                    </div>
                    <Skeleton className="w-full aspect-square rounded-xl" />
                    <div className="space-y-2">
                      <Skeleton className="w-48 h-4" />
                      <Skeleton className="w-full h-3" />
                    </div>
                  </div>
                ))}
              </div>
            ) : posts.length === 0 ? (
              <div className="text-center py-20">
                <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                  <span className="text-4xl">📷</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  No posts yet
                </h3>
                <p className="text-gray-500 max-w-sm mx-auto">
                  Start following scouts and clans to see their adventures here!
                </p>
              </div>
            ) : (
              <div className="space-y-0 md:space-y-4">
                {posts.map((post) => (
                  <PostCard 
                    key={post.id} 
                    post={post} 
                    currentUser={user}
                    onComment={() => queryClient.invalidateQueries(['feed-posts'])}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <Footer />
        </>
      )}
    </div>
  );
}
