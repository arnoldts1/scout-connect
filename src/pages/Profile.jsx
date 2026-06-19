import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, Link } from 'react-router-dom';
import { Grid3X3, Play, Bookmark, Users, Heart, MessageCircle, Award } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { createPageUrl } from '@/utils';
import { cn } from '@/lib/utils';
import ProfileHeader from '@/components/profile/ProfileHeader';
import BadgeBelt from '@/components/profile/BadgeBelt';

export default function Profile() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [currentUser, setCurrentUser] = useState(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [localFollowersCount, setLocalFollowersCount] = useState(null);

  const urlParams = new URLSearchParams(window.location.search);
  const profileId = urlParams.get('id');

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const user = await base44.auth.me();
        setCurrentUser(user);
      } catch (error) {
        navigate(createPageUrl('Home'));
      }
    };
    fetchUser();
  }, []);

  const isOwnProfile = !profileId || profileId === currentUser?.id;

  const { data: profileUser } = useQuery({
    queryKey: ['profile', profileId || currentUser?.id],
    queryFn: async () => {
      const targetId = profileId || currentUser?.id;
      if (!targetId) return null;
      // Always use PublicProfile for accurate follower counts
      const profiles = await base44.entities.PublicProfile.filter({ user_id: targetId });
      if (profiles[0]) {
        const base = isOwnProfile ? currentUser : {};
        return {
          ...base,
          id: profiles[0].user_id,
          full_name: profiles[0].full_name || currentUser?.full_name,
          avatar: profiles[0].avatar || currentUser?.avatar,
          username: profiles[0].username,
          bio: profiles[0].bio,
          followers_count: profiles[0].followers_count || 0,
          following_count: profiles[0].following_count || 0,
          posts_count: profiles[0].posts_count || 0,
          ...profiles[0]
        };
      }
      // Fallback to currentUser if no PublicProfile found
      if (isOwnProfile) return currentUser;
      return null;
    },
    enabled: !!currentUser,
  });

  const { data: posts = [] } = useQuery({
    queryKey: ['user-posts', profileUser?.id],
    queryFn: async () => {
      if (!profileUser?.id) return [];
      return await base44.entities.Post.filter(
        { author_id: profileUser.id, status: 'approved' },
        '-created_date',
        50
      );
    },
    enabled: !!profileUser?.id,
  });

  const { data: followStatus } = useQuery({
    queryKey: ['follow-status', currentUser?.id, profileUser?.id],
    queryFn: async () => {
      if (!currentUser || isOwnProfile) return null;
      const follows = await base44.entities.Follow.filter({
        follower_id: currentUser.id,
        following_id: profileUser.id
      });
      return follows.length > 0;
    },
    enabled: !!currentUser && !!profileUser && !isOwnProfile,
  });

  const { data: userBadges = [] } = useQuery({
    queryKey: ['user-badges', profileUser?.id],
    queryFn: async () => {
      if (!profileUser?.id) return [];
      return await base44.entities.UserBadge.filter(
        { user_id: profileUser.id, status: 'earned' },
        '-earned_date'
      );
    },
    enabled: !!profileUser?.id,
  });

  useEffect(() => {
    if (followStatus !== undefined) {
      setIsFollowing(followStatus);
    }
  }, [followStatus]);

  // Sync local count whenever profileUser data refreshes
  useEffect(() => {
    if (profileUser?.followers_count !== undefined) {
      setLocalFollowersCount(profileUser.followers_count);
    }
  }, [profileUser?.followers_count]);

  const handleFollow = async () => {
    if (!currentUser || !profileUser) return;

    const newFollowingState = !isFollowing;
    setIsFollowing(newFollowingState);
    // Optimistically update displayed count immediately
    setLocalFollowersCount(prev => (prev ?? profileUser.followers_count ?? 0) + (newFollowingState ? 1 : -1));

    if (newFollowingState) {
      await base44.entities.Follow.create({
        follower_id: currentUser.id,
        following_id: profileUser.id,
        follower_name: currentUser.full_name,
        following_name: profileUser.full_name
      });
      // Update accurate counts
      const [newFollowers, newFollowing] = await Promise.all([
        base44.entities.Follow.filter({ following_id: profileUser.id }),
        base44.entities.Follow.filter({ follower_id: currentUser.id })
      ]);
      const [theirProfiles, myProfiles] = await Promise.all([
        base44.entities.PublicProfile.filter({ user_id: profileUser.id }),
        base44.entities.PublicProfile.filter({ user_id: currentUser.id })
      ]);
      if (theirProfiles[0]) await base44.entities.PublicProfile.update(theirProfiles[0].id, { followers_count: newFollowers.length });
      if (myProfiles[0]) await base44.entities.PublicProfile.update(myProfiles[0].id, { following_count: newFollowing.length });

      // Create notification
      await base44.entities.Notification.create({
        user_id: profileUser.id,
        type: 'follow',
        message: `${currentUser.full_name} started following you`,
        actor_id: currentUser.id,
        actor_name: currentUser.full_name,
        actor_avatar: currentUser.avatar,
        reference_id: currentUser.id,
        reference_type: 'user',
        is_read: false
      });
    } else {
      const follows = await base44.entities.Follow.filter({
        follower_id: currentUser.id,
        following_id: profileUser.id
      });
      if (follows[0]) await base44.entities.Follow.delete(follows[0].id);
      // Update accurate counts after unfollow
      const [unfollowedFollowers, unfollowedFollowing] = await Promise.all([
        base44.entities.Follow.filter({ following_id: profileUser.id }),
        base44.entities.Follow.filter({ follower_id: currentUser.id })
      ]);
      const [theirProfiles2, myProfiles2] = await Promise.all([
        base44.entities.PublicProfile.filter({ user_id: profileUser.id }),
        base44.entities.PublicProfile.filter({ user_id: currentUser.id })
      ]);
      if (theirProfiles2[0]) await base44.entities.PublicProfile.update(theirProfiles2[0].id, { followers_count: unfollowedFollowers.length });
      if (myProfiles2[0]) await base44.entities.PublicProfile.update(myProfiles2[0].id, { following_count: unfollowedFollowing.length });
    }

    queryClient.invalidateQueries({ queryKey: ['profile'] });
    queryClient.invalidateQueries({ queryKey: ['follow-status'] });
  };

  const handleMessage = async () => {
    if (!currentUser || !profileUser) return;
    
    // Check for existing conversation
    const convs = await base44.entities.Conversation.list();
    const existingConv = convs.find(c => 
      c.type === 'direct' && 
      c.participants?.includes(currentUser.id) && 
      c.participants?.includes(profileUser.id)
    );

    if (existingConv) {
      navigate(createPageUrl(`Chat?id=${existingConv.id}`));
    } else {
      const newConv = await base44.entities.Conversation.create({
        type: 'direct',
        participants: [currentUser.id, profileUser.id],
        participant_details: [
          { user_id: currentUser.id, name: currentUser.full_name, avatar: currentUser.avatar },
          { user_id: profileUser.id, name: profileUser.full_name, avatar: profileUser.avatar }
        ],
        unread_count: {}
      });
      navigate(createPageUrl(`Chat?id=${newConv.id}`));
    }
  };

  const videoPosts = posts.filter(p => p.media_type === 'video');
  // Sort posts: images first, then videos
  const imagePosts = posts.filter(p => p.media_type !== 'video');
  const sortedPosts = [...imagePosts, ...videoPosts];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <ProfileHeader 
        user={profileUser}
        isOwnProfile={isOwnProfile}
        isFollowing={isFollowing}
        onFollow={handleFollow}
        onMessage={handleMessage}
        stats={{
          posts: posts.length,
          followers: localFollowersCount ?? profileUser?.followers_count ?? 0,
          following: profileUser?.following_count || 0
        }}
      />

      {/* Badge Belt Section */}
      <div className="max-w-4xl mx-auto px-4 py-4">
        <BadgeBelt badges={userBadges} maxDisplay={12} />
      </div>

      {/* Content Tabs */}
      <div className="max-w-4xl mx-auto">
        <Tabs defaultValue="posts" className="w-full">
          <TabsList className="w-full grid grid-cols-4 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 rounded-none h-auto p-0">
            <TabsTrigger value="posts" className="flex flex-col items-center gap-1 py-3 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-gray-900 dark:data-[state=active]:border-white data-[state=active]:shadow-none">
              <Grid3X3 className="w-5 h-5" />
            </TabsTrigger>
            <TabsTrigger value="reels" className="flex flex-col items-center gap-1 py-3 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-gray-900 dark:data-[state=active]:border-white data-[state=active]:shadow-none">
              <Play className="w-5 h-5" />
            </TabsTrigger>
            {isOwnProfile && (
              <TabsTrigger value="saved" className="flex flex-col items-center gap-1 py-3 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-gray-900 dark:data-[state=active]:border-white data-[state=active]:shadow-none">
                <Bookmark className="w-5 h-5" />
              </TabsTrigger>
            )}
            <TabsTrigger value="tagged" className="flex flex-col items-center gap-1 py-3 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-gray-900 dark:data-[state=active]:border-white data-[state=active]:shadow-none">
              <Users className="w-5 h-5" />
            </TabsTrigger>
          </TabsList>

          <TabsContent value="posts" className="mt-0">
            {sortedPosts.length === 0 ? (
              <div className="text-center py-20">
                <Grid3X3 className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No posts yet</h3>
                <p className="text-gray-500">
                  {isOwnProfile ? "Share your scout adventures!" : "This scout hasn't posted yet."}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-1 p-1">
                {sortedPosts.map((post) => (
                  <Link
                    key={post.id}
                    to={createPageUrl(`Post?id=${post.id}`)}
                    className="relative aspect-square bg-gray-100 dark:bg-gray-800 overflow-hidden group"
                  >
                    {post.media_type === 'video' ? (
                      <>
                        <video src={post.media_urls?.[0]} className="w-full h-full object-cover" />
                        <div className="absolute top-2 right-2">
                          <Play className="w-5 h-5 text-white drop-shadow-lg" />
                        </div>
                      </>
                    ) : (
                      <img 
                        src={post.media_urls?.[0] || 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=400'} 
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-6 text-white">
                      <span className="flex items-center gap-2">
                        <Heart className="w-5 h-5 fill-white" />
                        {post.likes_count || 0}
                      </span>
                      <span className="flex items-center gap-2">
                        <MessageCircle className="w-5 h-5 fill-white" />
                        {post.comments_count || 0}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="reels" className="mt-0">
            {videoPosts.length === 0 ? (
              <div className="text-center py-20">
                <Play className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No reels yet</h3>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-1 p-1">
                {videoPosts.map((post) => (
                  <Link
                    key={post.id}
                    to={createPageUrl(`Post?id=${post.id}`)}
                    className="relative aspect-[9/16] bg-gray-100 dark:bg-gray-800 overflow-hidden group"
                  >
                    <video src={post.media_urls?.[0]} className="w-full h-full object-cover" />
                    <div className="absolute bottom-2 left-2 flex items-center gap-1 text-white text-sm">
                      <Play className="w-4 h-4" />
                      {post.likes_count || 0}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </TabsContent>

          {isOwnProfile && (
            <TabsContent value="saved" className="mt-0">
              <div className="text-center py-20">
                <Bookmark className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Saved posts</h3>
                <p className="text-gray-500">Posts you save will appear here.</p>
              </div>
            </TabsContent>
          )}

          <TabsContent value="tagged" className="mt-0">
            <div className="text-center py-20">
              <Users className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Tagged posts</h3>
              <p className="text-gray-500">Posts where you're tagged will appear here.</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}