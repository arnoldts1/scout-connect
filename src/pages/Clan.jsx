import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Users, MapPin, Calendar, Award, MessageCircle, Settings,
  ArrowLeft, Plus, Shield, Crown, ChevronRight, Search, X, UserPlus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import SubscriptionStatusBadge, { getCurrentPhase } from '@/components/subscription/SubscriptionStatusBadge';
import SubscriptionBanner from '@/components/subscription/SubscriptionBanner';
import SubscriptionPaymentForm from '@/components/subscription/SubscriptionPaymentForm';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { createPageUrl } from '@/utils';
import { cn } from '@/lib/utils';
import moment from 'moment';
import EventCard from '@/components/scout/EventCard';

export default function Clan() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [showAddMember, setShowAddMember] = useState(false);
  const [memberSearch, setMemberSearch] = useState('');

  const urlParams = new URLSearchParams(window.location.search);
  const clanId = urlParams.get('id');

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

  const { data: clan } = useQuery({
    queryKey: ['clan', clanId],
    queryFn: async () => {
      if (!clanId) return null;
      const clans = await base44.entities.Clan.filter({ id: clanId });
      return clans[0];
    },
    enabled: !!clanId,
  });

  const { data: members = [], refetch: refetchMembers } = useQuery({
    queryKey: ['clan-members', clanId, clan?.id],
    queryFn: async () => {
      if (!clan?.id) return [];

      try {
        // Fetch the latest clan data to get current members list
        const latestClans = await base44.entities.Clan.filter({ id: clan.id });
        const latestClan = latestClans[0];

        if (!latestClan?.members?.length) return [];

        // Fetch all users and filter by clan members
        const allUsers = await base44.entities.User.list();
        const clanMembers = allUsers.filter(u => latestClan.members.includes(u.id));

        console.log('📋 Fetched clan members:', clanMembers.map(m => m.full_name));
        return clanMembers;
      } catch (error) {
        console.error('Error fetching members:', error);
        return [];
      }
    },
    enabled: !!clan?.id,
  });

  const { data: patrols = [] } = useQuery({
    queryKey: ['clan-patrols', clanId],
    queryFn: async () => {
      if (!clanId) return [];
      return await base44.entities.Patrol.filter({ clan_id: clanId });
    },
    enabled: !!clanId,
  });

  const { data: events = [] } = useQuery({
    queryKey: ['clan-events', clanId],
    queryFn: async () => {
      if (!clanId) return [];
      return await base44.entities.Event.filter({ clan_id: clanId, status: 'approved' }, 'start_date', 10);
    },
    enabled: !!clanId,
  });

  const { data: posts = [] } = useQuery({
    queryKey: ['clan-posts', clanId],
    queryFn: async () => {
      if (!clan?.members?.length) return [];
      const allPosts = await base44.entities.Post.filter({ status: 'approved' }, '-created_date', 50);
      return allPosts.filter(p => clan.members.includes(p.author_id));
    },
    enabled: !!clan,
  });

  // Get all users for adding members
  const { data: allUsers = [] } = useQuery({
    queryKey: ['all-users-for-clan'],
    queryFn: () => base44.entities.User.list(),
    enabled: showAddMember,
  });

  const isMember = clan?.members?.includes(user?.id);
  const isLeader = clan?.leaders?.includes(user?.id);

  const currentPhase = getCurrentPhase();
  const { data: subscription, refetch: refetchSubscription } = useQuery({
    queryKey: ['clan-subscription', clanId, currentPhase.phase],
    queryFn: async () => {
      const subs = await base44.entities.Subscription.filter({
        group_id: clanId,
        phase: currentPhase.phase,
      });
      return subs[0] || null;
    },
    enabled: !!clanId,
  });

  const { data: joinRequest } = useQuery({
    queryKey: ['join-request-clan', user?.id, clanId],
    queryFn: async () => {
      if (!user?.id || !clanId) return null;
      const requests = await base44.entities.JoinRequest.filter({
        requester_id: user.id,
        target_id: clanId,
        target_type: 'clan',
        status: 'pending'
      });
      return requests[0];
    },
    enabled: !!user?.id && !!clanId && !isMember,
  });

  const handleJoinClan = async () => {
    if (!clan || !user) return;
    
    // Create join request
    await base44.entities.JoinRequest.create({
      requester_id: user.id,
      requester_name: user.full_name,
      requester_avatar: user.avatar,
      target_type: 'clan',
      target_id: clan.id,
      target_name: clan.name,
      status: 'pending'
    });

    // Notify clan leaders
    const leaders = clan.leaders || [clan.admin_id];
    for (const leaderId of leaders) {
      await base44.entities.Notification.create({
        user_id: leaderId,
        type: 'clan',
        title: 'Join Request',
        message: `${user.full_name} wants to join ${clan.name}`,
        actor_id: user.id,
        actor_name: user.full_name,
        actor_avatar: user.avatar,
        reference_id: clan.id,
        reference_type: 'clan',
        is_read: false
      });
    }
    
    queryClient.invalidateQueries(['join-request-clan']);
    toast.success('Join request sent to clan leaders');
  };

  const handleCancelRequest = async () => {
    if (!joinRequest || !user || !clan) return;
    
    try {
      // Delete the join request
      await base44.entities.JoinRequest.delete(joinRequest.id);
      
      // Remove the notifications sent to clan leaders
      const leaders = clan.leaders || [clan.admin_id];
      for (const leaderId of leaders) {
        const notifications = await base44.entities.Notification.filter({
          user_id: leaderId,
          actor_id: user.id,
          reference_id: clan.id,
          reference_type: 'clan',
          type: 'clan'
        });
        
        if (notifications[0]) {
          await base44.entities.Notification.delete(notifications[0].id);
        }
      }
      
      queryClient.invalidateQueries(['join-request-clan']);
      toast.success('Join request cancelled');
    } catch (error) {
      queryClient.invalidateQueries(['join-request-clan']);
      toast.error('Request no longer exists');
    }
  };

  const handleAddMember = async (memberToAdd) => {
    if (!clan || !memberToAdd) return;

    if (clan.members?.includes(memberToAdd.id)) {
      toast.error('User is already a member');
      return;
    }

    try {
      console.log('Adding member:', memberToAdd.full_name, 'to clan:', clan.name);

      const updatedMembers = [...(clan.members || []), memberToAdd.id];

      await base44.entities.Clan.update(clan.id, {
        members: updatedMembers,
        member_count: updatedMembers.length
      });

      console.log('✅ Clan updated with new member');

      await base44.entities.User.update(memberToAdd.id, {
        clan_id: clan.id,
        clan_name: clan.name
      });

      console.log('✅ User clan assignment updated');

      // Skip notification if it fails - don't block the member add
      try {
        await base44.entities.Notification.create({
          user_id: memberToAdd.id,
          type: 'system',
          title: 'Added to Clan',
          message: `You have been added to ${clan.name}`,
          actor_id: user?.id,
          actor_name: user?.full_name,
          is_read: false
        });
      } catch (notifError) {
        console.warn('Notification failed but member was added:', notifError);
      }

      setShowAddMember(false);
      setMemberSearch('');
      queryClient.invalidateQueries(['clan', clanId]);
      queryClient.invalidateQueries(['clan-members']);
      await refetchMembers();
      toast.success(`${memberToAdd.full_name} added to clan`);
    } catch (error) {
      console.error('❌ Error adding member:', error);
      toast.error(`Failed to add member: ${error?.message || 'Unknown error'}`);
    }
  };

  const handleRemoveMember = async (memberToRemove) => {
    if (!clan || !memberToRemove || clan.leaders?.includes(memberToRemove.id)) return;

    try {
      const updatedMembers = (clan.members || []).filter(id => id !== memberToRemove.id);
      const updatedLeaders = (clan.leaders || []).filter(id => id !== memberToRemove.id);

      await base44.entities.Clan.update(clan.id, {
        members: updatedMembers,
        leaders: updatedLeaders,
        member_count: Math.max(0, updatedMembers.length)
      });

      await base44.entities.User.update(memberToRemove.id, {
        clan_id: null,
        clan_name: null
      });

      queryClient.invalidateQueries(['clan', clanId]);
      queryClient.invalidateQueries(['clan-members']);
      await refetchMembers();
      toast.success(`${memberToRemove.full_name} removed from clan`);
    } catch (error) {
      console.error('❌ Error removing member:', error);
      toast.error(`Failed to remove member: ${error?.message || 'Unknown error'}`);
    }
  };

  // Filter users for add member dialog
  const filteredUsersToAdd = allUsers.filter(u =>
    !clan?.members?.includes(u.id) &&
    (u.full_name || '').toLowerCase().includes(memberSearch.toLowerCase())
  ).slice(0, 10);

  const handleOpenChat = async () => {
    try {
      // Fetch the latest clan data to check if conversation already exists
      const latestClans = await base44.entities.Clan.filter({ id: clanId });
      const latestClan = latestClans[0];

      console.log('Latest clan data:', latestClan);

      if (latestClan?.conversation_id) {
        console.log('Opening existing clan chat:', latestClan.conversation_id);
        navigate(createPageUrl(`Chat?id=${latestClan.conversation_id}`));
        return;
      }

      if (!isMember) {
        toast.error('Join the clan first to access the chat');
        return;
      }

      console.log('Creating new clan group chat for:', clan.name);

      // Create group chat for clan with all members
      const memberDetails = members
        .filter(m => latestClan.members?.includes(m.id))
        .map(m => ({
          user_id: m.id,
          name: m.full_name,
          avatar: m.avatar
        }));

      const conversationPayload = {
        type: 'group',
        group_name: `${clan.name} Chat`,
        participants: latestClan.members || [],
        participant_details: memberDetails,
        group_avatar: clan.avatar,
        admins: latestClan.leaders || [latestClan.admin_id],
        created_by_id: user?.id
      };

      console.log('Conversation payload:', conversationPayload);

      const newConv = await base44.entities.Conversation.create(conversationPayload);
      console.log('✅ Conversation created:', newConv);

      if (newConv?.id) {
        await base44.entities.Clan.update(clan.id, {
          conversation_id: newConv.id
        });

        console.log('✅ Clan updated with conversation_id');
        queryClient.invalidateQueries(['clan', clanId]);
        navigate(createPageUrl(`Chat?id=${newConv.id}`));
      }
    } catch (error) {
      console.error('❌ Error opening clan chat:', error);
      toast.error(`Failed to open chat: ${error?.message || 'Unknown error'}`);
    }
  };

  if (!clan) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <div className="relative">
        <div className="h-48 bg-gradient-to-br from-emerald-500 to-teal-600">
          {clan.cover_image && (
            <img 
              src={clan.cover_image} 
              alt={clan.name} 
              className="w-full h-full object-cover"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        </div>

        <Button 
          variant="ghost" 
          size="icon"
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 bg-black/20 text-white hover:bg-black/40 rounded-full"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>

        {isLeader && (
          <Button 
            variant="ghost" 
            size="icon"
            className="absolute top-4 right-4 bg-black/20 text-white hover:bg-black/40 rounded-full"
          >
            <Settings className="w-5 h-5" />
          </Button>
        )}
      </div>

      {/* Clan Info */}
      <div className="max-w-4xl mx-auto px-4 -mt-16 relative z-10">
        <div className="flex flex-col md:flex-row gap-4 items-start">
          <Avatar className="w-32 h-32 ring-4 ring-white dark:ring-gray-900 shadow-xl">
            <AvatarImage src={clan.avatar} />
            <AvatarFallback className="text-4xl bg-emerald-100 text-emerald-700">
              {clan.name?.charAt(0) || 'C'}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {clan.name}
              </h1>
              {clan.status === 'active' && (
                <Badge className="bg-emerald-500 text-white">Active</Badge>
              )}
            </div>

            {clan.location && (
              <p className="text-gray-500 flex items-center gap-1 mb-2">
                <MapPin className="w-4 h-4" />
                {clan.location}
              </p>
            )}

            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {clan.description || 'A proud scouting clan committed to excellence.'}
            </p>

            {/* Subscription status */}
            <div className="flex items-center gap-3 mb-3">
              <SubscriptionStatusBadge subscription={subscription} />
              {(isLeader || isMember) && subscription?.status !== 'active' && (
                <SubscriptionPaymentForm
                  groupType="clan"
                  groupId={clanId}
                  groupName={clan.name}
                  groupMembers={clan.members || []}
                  onSuccess={() => refetchSubscription()}
                />
              )}
            </div>

            {isMember && <SubscriptionBanner subscription={subscription} groupType="clan" />}

            <div className="flex items-center gap-6 text-sm mb-4">
              <div className="text-center">
                <span className="font-bold text-lg text-gray-900 dark:text-white">
                  {clan.member_count || 0}
                </span>
                <span className="text-gray-500 ml-1">members</span>
              </div>
              <div className="text-center">
                <span className="font-bold text-lg text-gray-900 dark:text-white">
                  {patrols.length}
                </span>
                <span className="text-gray-500 ml-1">patrols</span>
              </div>
              <div className="text-center">
                <span className="font-bold text-lg text-amber-600">
                  {clan.achievements?.length || 0}
                </span>
                <span className="text-gray-500 ml-1">achievements</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {isMember ? (
                <>
                  <Button 
                    onClick={handleOpenChat}
                    className="bg-emerald-600 hover:bg-emerald-700 rounded-full"
                  >
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Clan Chat
                  </Button>
                  <Badge variant="secondary" className="text-sm">
                    {isLeader ? '👑 Leader' : '✓ Member'}
                  </Badge>
                </>
              ) : joinRequest ? (
                <Button 
                  onClick={handleCancelRequest}
                  className="bg-green-600 hover:bg-green-700 rounded-full"
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancel Request
                </Button>
              ) : (
                <Button 
                  onClick={handleJoinClan}
                  className="bg-blue-600 hover:bg-blue-700 rounded-full"
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  Join Clan
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Content Tabs */}
        <Tabs defaultValue="members" className="mt-8">
          <TabsList className="w-full justify-start gap-2 bg-transparent border-b border-gray-200 dark:border-gray-800 rounded-none p-0 mb-6">
            <TabsTrigger 
              value="members"
              className="data-[state=active]:border-b-2 data-[state=active]:border-emerald-600 rounded-none pb-3"
            >
              <Users className="w-4 h-4 mr-2" />
              Members
            </TabsTrigger>
            <TabsTrigger 
              value="patrols"
              className="data-[state=active]:border-b-2 data-[state=active]:border-emerald-600 rounded-none pb-3"
            >
              <Shield className="w-4 h-4 mr-2" />
              Patrols
            </TabsTrigger>
            <TabsTrigger 
              value="events"
              className="data-[state=active]:border-b-2 data-[state=active]:border-emerald-600 rounded-none pb-3"
            >
              <Calendar className="w-4 h-4 mr-2" />
              Events
            </TabsTrigger>
            <TabsTrigger 
              value="posts"
              className="data-[state=active]:border-b-2 data-[state=active]:border-emerald-600 rounded-none pb-3"
            >
              <Award className="w-4 h-4 mr-2" />
              Posts
            </TabsTrigger>
          </TabsList>

          <TabsContent value="members">
            {/* Add Member Button for Leaders */}
            {isLeader && (
              <div className="mb-4">
                <Dialog open={showAddMember} onOpenChange={setShowAddMember}>
                  <DialogTrigger asChild>
                    <Button className="bg-emerald-600 hover:bg-emerald-700">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Member
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Member to Clan</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 mt-4">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                          value={memberSearch}
                          onChange={(e) => setMemberSearch(e.target.value)}
                          placeholder="Search users by name..."
                          className="pl-10"
                        />
                      </div>
                      <div className="max-h-64 overflow-y-auto space-y-2">
                        {filteredUsersToAdd.length === 0 ? (
                          <p className="text-center text-gray-500 py-4">No users found</p>
                        ) : (
                          filteredUsersToAdd.map(u => (
                            <div key={u.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                              <div className="flex items-center gap-3">
                                <Avatar className="w-10 h-10">
                                  <AvatarImage src={u.avatar} />
                                  <AvatarFallback>{u.full_name?.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="font-medium">{u.full_name}</p>
                                  <p className="text-xs text-gray-500">{u.clan_name || 'No clan'}</p>
                                </div>
                              </div>
                              <Button size="sm" onClick={() => handleAddMember(u)}>
                                <UserPlus className="w-4 h-4" />
                              </Button>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Leaders first */}
              {clan.leaders?.map((leaderId) => {
                const leader = members.find(m => m.id === leaderId);
                if (!leader) return null;
                return (
                  <Link
                    key={leader.id}
                    to={createPageUrl(`Profile?id=${leader.id}`)}
                    className="flex items-center gap-4 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-2xl border border-amber-200 dark:border-amber-800"
                  >
                    <Avatar className="w-14 h-14">
                      <AvatarImage src={leader.avatar} />
                      <AvatarFallback className="bg-amber-100 text-amber-700">
                        {leader.full_name?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold">{leader.full_name}</p>
                        <Crown className="w-4 h-4 text-amber-500" />
                      </div>
                      <p className="text-sm text-gray-500">Clan Leader</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </Link>
                );
              })}

              {/* Regular members */}
              {members.filter(m => clan.members?.includes(m.id) && !clan.leaders?.includes(m.id)).map((member) => (
                <div
                  key={member.id}
                  className="flex items-center gap-4 p-4 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 group"
                >
                  <Link to={createPageUrl(`Profile?id=${member.id}`)} className="flex items-center gap-4 flex-1">
                    <Avatar className="w-14 h-14">
                      <AvatarImage src={member.avatar} />
                      <AvatarFallback className="bg-emerald-100 text-emerald-700">
                        {member.full_name?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-semibold">{member.full_name}</p>
                      <p className="text-sm text-gray-500">
                        {member.patrol_name || 'Member'}
                      </p>
                    </div>
                  </Link>
                  {isLeader && (
                    <button 
                      onClick={() => handleRemoveMember(member)}
                      className="opacity-0 group-hover:opacity-100 p-2 rounded-full hover:bg-red-100 text-red-500 transition-all"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="patrols">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {patrols.map((patrol) => (
                <Link
                  key={patrol.id}
                  to={createPageUrl(`Patrol?id=${patrol.id}`)}
                  className="p-4 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={patrol.avatar} />
                      <AvatarFallback className="bg-emerald-100 text-emerald-700">
                        {patrol.name?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold">{patrol.name}</h3>
                      {patrol.slogan && (
                        <p className="text-sm text-gray-500 italic">"{patrol.slogan}"</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">
                      {patrol.member_count || 0} members
                    </span>
                    <Badge variant="secondary">{patrol.points || 0} pts</Badge>
                  </div>
                </Link>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="events">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {events.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
            {events.length === 0 && (
              <div className="text-center py-12">
                <Calendar className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500">No upcoming events</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="posts">
            <div className="grid grid-cols-3 gap-1">
              {posts.map((post) => (
                <Link
                  key={post.id}
                  to={createPageUrl(`Post?id=${post.id}`)}
                  className="aspect-square bg-gray-100 dark:bg-gray-800 overflow-hidden"
                >
                  <img 
                    src={post.media_urls?.[0] || 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=400'} 
                    alt=""
                    className="w-full h-full object-cover hover:opacity-80 transition-opacity"
                  />
                </Link>
              ))}
            </div>
            {posts.length === 0 && (
              <div className="text-center py-12">
                <Award className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500">No posts from this clan yet</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
