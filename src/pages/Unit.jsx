import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Users, MapPin, Calendar, TrendingUp, Settings, 
  ArrowLeft, UserPlus, Shield, MessageCircle, Plus, Search, X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { createPageUrl } from '@/utils';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import PostCard from '@/components/feed/PostCard';
import SubscriptionStatusBadge, { getCurrentPhase } from '@/components/subscription/SubscriptionStatusBadge';
import SubscriptionBanner from '@/components/subscription/SubscriptionBanner';
import SubscriptionPaymentForm from '@/components/subscription/SubscriptionPaymentForm';

export default function Unit() {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const unitId = urlParams.get('id');
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [showAddMember, setShowAddMember] = useState(false);
  const [memberSearch, setMemberSearch] = useState('');

  useEffect(() => {
    const fetchUser = async () => {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
    };
    fetchUser();
  }, []);

  const { data: unit, isLoading } = useQuery({
    queryKey: ['unit', unitId],
    queryFn: async () => {
      const units = await base44.entities.Unit.filter({ id: unitId });
      return units[0];
    },
    enabled: !!unitId,
  });

  const { data: posts = [] } = useQuery({
    queryKey: ['unit-posts', unitId],
    queryFn: () => base44.entities.Post.filter({ unit_id: unitId, status: 'approved' }, '-created_date', 20),
    enabled: !!unitId,
  });

  const { data: members = [], refetch: refetchMembers } = useQuery({
    queryKey: ['unit-members', unit?.id, unit?.members],
    queryFn: async () => {
      if (!unit?.id) return [];

      try {
        // Fetch the latest unit data to get current members list
        const latestUnits = await base44.entities.Unit.filter({ id: unit.id });
        const latestUnit = latestUnits[0];

        if (!latestUnit?.members?.length) return [];

        // Fetch all users and filter by unit members
        const allUsers = await base44.entities.User.list();
        const unitMembers = allUsers.filter(u => latestUnit.members.includes(u.id));

        console.log('📋 Fetched unit members:', unitMembers.map(m => m.full_name));
        return unitMembers;
      } catch (error) {
        console.error('Error fetching members:', error);
        return [];
      }
    },
    enabled: !!unit?.id,
  });

  // Get all users for adding members
  const { data: allUsers = [] } = useQuery({
    queryKey: ['all-users-for-unit'],
    queryFn: () => base44.entities.User.list(),
    enabled: showAddMember,
  });

  const isAdmin = user?.email === unit?.admin_email;
  const isMember = unit?.members?.includes(user?.id) || user?.unit_id === unitId;

  const currentPhase = getCurrentPhase();
  const { data: subscription, refetch: refetchSubscription } = useQuery({
    queryKey: ['unit-subscription', unitId, currentPhase.phase],
    queryFn: async () => {
      const subs = await base44.entities.Subscription.filter({
        group_id: unitId,
        phase: currentPhase.phase,
      });
      return subs[0] || null;
    },
    enabled: !!unitId,
  });

  const { data: joinRequest } = useQuery({
    queryKey: ['join-request', user?.id, unitId],
    queryFn: async () => {
      if (!user?.id || !unitId) return null;
      const requests = await base44.entities.JoinRequest.filter({
        requester_id: user.id,
        target_id: unitId,
        target_type: 'unit',
        status: 'pending'
      });
      return requests[0];
    },
    enabled: !!user?.id && !!unitId && !isMember,
  });

  const handleJoin = async () => {
    if (!user || !unit) return;
    
    // Create join request
    await base44.entities.JoinRequest.create({
      requester_id: user.id,
      requester_name: user.full_name,
      requester_avatar: user.avatar,
      target_type: 'unit',
      target_id: unit.id,
      target_name: unit.name,
      status: 'pending'
    });

    // Notify unit admin
    await base44.entities.Notification.create({
      user_id: unit.admin_id,
      type: 'clan',
      title: 'Join Request',
      message: `${user.full_name} wants to join ${unit.name}`,
      actor_id: user.id,
      actor_name: user.full_name,
      actor_avatar: user.avatar,
      reference_id: unit.id,
      reference_type: 'unit',
      is_read: false
    });
    
    queryClient.invalidateQueries(['join-request']);
    toast.success('Join request sent to unit admin');
  };

  const handleCancelRequest = async () => {
    if (!joinRequest || !user || !unit) return;
    
    try {
      // Delete the join request
      await base44.entities.JoinRequest.delete(joinRequest.id);
      
      // Remove the notification sent to the unit admin
      const notifications = await base44.entities.Notification.filter({
        user_id: unit.admin_id,
        actor_id: user.id,
        reference_id: unit.id,
        reference_type: 'unit',
        type: 'clan'
      });
      
      if (notifications[0]) {
        await base44.entities.Notification.delete(notifications[0].id);
      }
      
      queryClient.invalidateQueries(['join-request']);
      toast.success('Join request cancelled');
    } catch (error) {
      queryClient.invalidateQueries(['join-request']);
      toast.error('Request no longer exists');
    }
  };

  const handleAddMember = async (memberToAdd) => {
    if (!unit || !memberToAdd) return;

    // Check if already a member
    if (unit.members?.includes(memberToAdd.id)) {
      toast.error('User is already a member');
      return;
    }

    try {
      console.log('Adding member:', memberToAdd.full_name, 'to unit:', unit.name);

      const updatedMembers = [...(unit.members || []), memberToAdd.id];

      await base44.entities.Unit.update(unit.id, {
        members: updatedMembers,
        member_count: updatedMembers.length
      });

      console.log('✅ Unit updated with new member');

      await base44.entities.User.update(memberToAdd.id, {
        unit_id: unit.id,
        unit_name: unit.name
      });

      console.log('✅ User unit assignment updated');

      // Skip notification if it fails - don't block the member add
      try {
        await base44.entities.Notification.create({
          user_id: memberToAdd.id,
          type: 'system',
          title: 'Added to Unit',
          message: `You have been added to ${unit.name}`,
          actor_id: user?.id,
          actor_name: user?.full_name,
          is_read: false
        });
      } catch (notifError) {
        console.warn('Notification failed but member was added:', notifError);
      }

      setShowAddMember(false);
      setMemberSearch('');
      queryClient.invalidateQueries(['unit', unitId]);
      queryClient.invalidateQueries(['unit-members']);
      await refetchMembers();
      toast.success(`${memberToAdd.full_name} added to unit`);
    } catch (error) {
      console.error('❌ Error adding member:', error);
      toast.error(`Failed to add member: ${error?.message || 'Unknown error'}`);
    }
  };

  const handleRemoveMember = async (memberToRemove) => {
    if (!unit || !memberToRemove || memberToRemove.id === unit.admin_id) return;

    try {
      const updatedMembers = (unit.members || []).filter(id => id !== memberToRemove.id);
      await base44.entities.Unit.update(unit.id, {
        members: updatedMembers,
        member_count: Math.max(0, (unit.member_count || 1) - 1)
      });
      
      await base44.entities.User.update(memberToRemove.id, {
        unit_id: null,
        unit_name: null
      });
      
      queryClient.invalidateQueries(['unit', unitId]);
      queryClient.invalidateQueries(['unit-members']);
      await refetchMembers();
      toast.success(`${memberToRemove.full_name} removed from unit`);
    } catch (error) {
      toast.error('Failed to remove member');
    }
  };

  // Filter users for add member dialog
  const filteredUsersToAdd = allUsers.filter(u =>
    !unit?.members?.includes(u.id) &&
    (u.full_name || '').toLowerCase().includes(memberSearch.toLowerCase())
  ).slice(0, 10);

  const handleOpenChat = async () => {
    try {
      // Fetch the latest unit data to check if conversation already exists
      const latestUnits = await base44.entities.Unit.filter({ id: unitId });
      const latestUnit = latestUnits[0];

      console.log('Latest unit data:', latestUnit);

      if (latestUnit?.conversation_id) {
        console.log('Opening existing unit chat:', latestUnit.conversation_id);
        navigate(createPageUrl(`Chat?id=${latestUnit.conversation_id}`));
        return;
      }

      if (!isMember) {
        toast.error('Join the unit first to access the chat');
        return;
      }

      console.log('Creating new unit group chat for:', unit.name);

      // Create group chat for unit with all members
      const memberDetails = members.map(m => ({
        user_id: m.id,
        name: m.full_name,
        avatar: m.avatar
      }));

      const conversationPayload = {
        type: 'group',
        group_name: `${unit.name} Chat`,
        participants: unit.members || [],
        participant_details: memberDetails,
        group_avatar: unit.avatar,
        admins: [unit.admin_id],
        created_by_id: user?.id
      };

      console.log('Conversation payload:', conversationPayload);

      const newConv = await base44.entities.Conversation.create(conversationPayload);
      console.log('✅ Conversation created:', newConv);

      if (newConv?.id) {
        // Update unit with conversation_id
        await base44.entities.Unit.update(unit.id, {
          conversation_id: newConv.id
        });

        console.log('✅ Unit updated with conversation_id');
        queryClient.invalidateQueries(['unit', unitId]);
        navigate(createPageUrl(`Chat?id=${newConv.id}`));
      }
    } catch (error) {
      console.error('❌ Error opening unit chat:', error);
      toast.error(`Failed to open chat: ${error?.message || 'Unknown error'}`);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <Skeleton className="h-48 rounded-2xl mb-4" />
        <Skeleton className="h-20 rounded-xl mb-4" />
        <Skeleton className="h-40 rounded-xl" />
      </div>
    );
  }

  if (!unit) {
    return (
      <div className="max-w-4xl mx-auto p-4 text-center py-20">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Unit not found</h2>
        <p className="text-gray-500">This unit doesn't exist or has been removed.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Back Button */}
      <div className="p-4">
        <Button variant="ghost" size="sm" asChild>
          <Link to={createPageUrl('Explore')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Link>
        </Button>
      </div>

      {/* Cover & Header */}
      <div className="relative">
        <div className="h-48 bg-gradient-to-r from-blue-400 to-blue-600">
          {unit.cover_image && (
            <img src={unit.cover_image} alt="" className="w-full h-full object-cover" />
          )}
        </div>
        
        <div className="absolute -bottom-12 left-6">
          {unit.avatar ? (
            <img 
              src={unit.avatar} 
              alt={unit.name}
              className="w-24 h-24 rounded-2xl object-cover ring-4 ring-white dark:ring-gray-900 shadow-lg"
            />
          ) : (
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-3xl font-bold ring-4 ring-white dark:ring-gray-900 shadow-lg">
              {unit.name?.charAt(0)}
            </div>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="pt-16 px-6 pb-6 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {unit.name}
              </h1>
              <Badge className="bg-blue-100 text-blue-700">Unit</Badge>
            </div>
            {unit.location && (
              <p className="text-gray-500 flex items-center gap-1 mt-1">
                <MapPin className="w-4 h-4" />
                {unit.location}
              </p>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {isMember && (
              <Button onClick={handleOpenChat} className="rounded-full bg-emerald-600 hover:bg-emerald-700">
                <MessageCircle className="w-4 h-4 mr-2" />
                Unit Chat
              </Button>
            )}
            {isAdmin && (
              <Link to={createPageUrl(`EditUnit?id=${unitId}&type=unit`)}>
                <Button variant="outline" size="sm" className="rounded-full">
                  <Settings className="w-4 h-4 mr-2" />
                  Manage
                </Button>
              </Link>
            )}
            {!isMember && !joinRequest && (
              <Button onClick={handleJoin} className="rounded-full bg-blue-600 hover:bg-blue-700">
                <UserPlus className="w-4 h-4 mr-2" />
                Join Unit
              </Button>
            )}
            {!isMember && joinRequest && (
              <Button onClick={handleCancelRequest} className="rounded-full bg-green-600 hover:bg-green-700">
                <X className="w-4 h-4 mr-2" />
                Cancel Request
              </Button>
            )}
            {isMember && !isAdmin && (
              <Badge className="bg-blue-100 text-blue-700">Member</Badge>
            )}
            {isAdmin && (
              <Badge className="bg-amber-100 text-amber-700">
                <Shield className="w-3 h-3 mr-1" />
                Admin
              </Badge>
            )}
          </div>
        </div>

        {unit.description && (
          <p className="text-gray-600 dark:text-gray-400 mb-4">{unit.description}</p>
        )}

        {/* Subscription status */}
        <div className="flex items-center gap-3 mb-3">
          <SubscriptionStatusBadge subscription={subscription} />
          {(isAdmin || isMember) && subscription?.status !== 'active' && (
            <SubscriptionPaymentForm
              groupType="unit"
              groupId={unitId}
              groupName={unit.name}
              groupMembers={unit.members || []}
              onSuccess={() => refetchSubscription()}
            />
          )}
        </div>

        {isMember && <SubscriptionBanner subscription={subscription} groupType="unit" />}

        {/* Stats */}
        <div className="flex items-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-gray-400" />
            <span className="font-semibold text-gray-900 dark:text-white">
              {unit.member_count || 0}
            </span>
            <span className="text-gray-500">members</span>
          </div>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-500" />
            <span className="font-semibold text-emerald-600">
              {unit.points || 0}
            </span>
            <span className="text-gray-500">points</span>
          </div>
          {unit.founded_date && (
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-gray-400" />
              <span className="text-gray-500">Founded {unit.founded_date}</span>
            </div>
          )}
        </div>
      </div>

      {/* Members Preview */}
      <div className="p-6 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900 dark:text-white">Members</h3>
          {isAdmin && (
            <Dialog open={showAddMember} onOpenChange={setShowAddMember}>
              <DialogTrigger asChild>
                <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Member
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Member to Unit</DialogTitle>
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
                              <p className="text-xs text-gray-500">{u.unit_name || 'No unit'}</p>
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
          )}
        </div>
        {members.length > 0 ? (
          <div className="flex flex-wrap gap-3">
            {members.slice(0, 10).map((member) => (
              <div 
                key={member.id}
                className="flex items-center gap-2 p-2 rounded-full bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors group"
              >
                <Link to={createPageUrl(`Profile?id=${member.id}`)} className="flex items-center gap-2">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={member.avatar} />
                    <AvatarFallback className="text-xs bg-blue-100 text-blue-700">
                      {member.full_name?.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {member.full_name?.split(' ')[0]}
                  </span>
                </Link>
                {isAdmin && member.id !== unit.admin_id && (
                  <button 
                    onClick={() => handleRemoveMember(member)}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded-full hover:bg-red-100 text-red-500 transition-all"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))}
            {members.length > 10 && (
              <div className="flex items-center px-4 text-sm text-gray-500">
                +{members.length - 10} more
              </div>
            )}
          </div>
        ) : (
          <p className="text-gray-500 text-sm">No members yet</p>
        )}
      </div>

      {/* Posts */}
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Activity</h3>
        {posts.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
            <p className="text-gray-500">No posts yet from this unit.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} currentUser={user} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
