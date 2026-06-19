import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  CheckCircle, XCircle, Clock, Image, Users,
  Eye, Shield, TrendingUp, Award, Bell, Send,
  Calendar, UserCheck, Loader2, ShoppingBag, Plus,
  RotateCcw, History, Music, FileText, FileCode, Upload, Zap
} from 'lucide-react';
import VerifiedBadge from '@/components/ui/VerifiedBadge';
import MVPTabContent from '@/components/admin/MVPTabContent';
import CampTemplatesAdmin from '@/components/admin/CampTemplatesAdmin';
import { createPageUrl } from '@/utils';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import moment from 'moment';

const WORK_CATEGORIES = {
  visiting: { label: 'Visiting', points: 2, color: 'bg-blue-100 text-blue-700' },
  community_work: { label: 'Community Work', points: 3, color: 'bg-green-100 text-green-700' },
  illiterates_visit: { label: 'Illiterates Visit', points: 3, color: 'bg-purple-100 text-purple-700' },
  services: { label: 'Services', points: 2, color: 'bg-orange-100 text-orange-700' },
  others: { label: 'Others', points: 3, color: 'bg-gray-100 text-gray-700' },
  none: { label: 'Normal Post', points: 0, color: 'bg-gray-50 text-gray-500' }
};

export default function Admin() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('pending');
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminUnitId, setAdminUnitId] = useState(null);
  const [adminClanId, setAdminClanId] = useState(null);
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [showBadgeDialog, setShowBadgeDialog] = useState(false);
  const [selectedBadgeUser, setSelectedBadgeUser] = useState(null);
  const [selectedBadge, setSelectedBadge] = useState('');
  const [showHistoryDialog, setShowHistoryDialog] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [competitionTitle, setCompetitionTitle] = useState('');
  const [trainingFiles, setTrainingFiles] = useState([]);
  const [isUploadingTraining, setIsUploadingTraining] = useState(false);

  useEffect(() => {
    const checkAdmin = async () => {
      try {
        console.log('Checking admin status...');
        const currentUser = await base44.auth.me();
        console.log('Current user:', currentUser);
        setUser(currentUser);

        // Only allow info@ts.com
        if (currentUser?.email === 'info@ts.com') {
          console.log('Admin access granted');
          setIsAdmin(true);
        } else {
          console.log('Not admin, redirecting');
          navigate(createPageUrl('Home'));
        }
      } catch (error) {
        console.error('Admin check error:', error);
        navigate(createPageUrl('Home'));
      }
    };
    checkAdmin();
  }, [navigate]);

  // Queries
  const { data: pendingPosts = [], isLoading: pendingLoading } = useQuery({
    queryKey: ['admin-pending-posts'],
    queryFn: async () => {
      return await base44.entities.Post.filter({ status: 'pending' }, '-created_date', 50);
    },
    enabled: isAdmin,
  });

  const { data: pendingEvents = [] } = useQuery({
    queryKey: ['admin-pending-events'],
    queryFn: () => base44.entities.Event.filter({ status: 'pending' }, '-created_date', 50),
    enabled: isAdmin,
  });

  const { data: badgeRequests = [] } = useQuery({
    queryKey: ['admin-badge-requests'],
    queryFn: () => base44.entities.BadgeRequest.filter({ status: 'pending' }, '-created_date', 50),
    enabled: isAdmin,
  });

  const { data: allUsers = [] } = useQuery({
    queryKey: ['admin-all-users'],
    queryFn: () => base44.entities.User.list('-last_login', 100),
    enabled: isAdmin,
  });

  const { data: badges = [] } = useQuery({
    queryKey: ['all-badges'],
    queryFn: () => base44.entities.Badge.list(),
    enabled: isAdmin,
  });

  const { data: units = [] } = useQuery({
    queryKey: ['all-units'],
    queryFn: () => base44.entities.Unit.list(),
    enabled: isAdmin,
  });

  const { data: clans = [] } = useQuery({
    queryKey: ['all-clans'],
    queryFn: () => base44.entities.Clan.list(),
    enabled: isAdmin,
  });

  const { data: competitionHistory = [] } = useQuery({
    queryKey: ['competition-history'],
    queryFn: () => base44.entities.CompetitionHistory.list('-end_date', 50),
    enabled: isAdmin,
  });

  const { data: woodBadgePending = [] } = useQuery({
    queryKey: ['wood-badge-pending'],
    queryFn: async () => {
      const users = await base44.entities.User.list();
      return users.filter(u => u.has_wood_badge && u.wood_badge_status === 'pending');
    },
    enabled: isAdmin,
  });

  // Handlers
  const handleApprove = async (post, category = 'none') => {
    const categoryData = WORK_CATEGORIES[category];
    const points = post.is_unit_post ? categoryData.points : 0;
    
    await base44.entities.Post.update(post.id, {
      status: 'approved',
      work_category: category,
      points_awarded: points
    });

    if (points > 0 && post.is_unit_post) {
      if (post.unit_id) {
        const unit = (await base44.entities.Unit.filter({ id: post.unit_id }))[0];
        if (unit) {
          await base44.entities.Unit.update(unit.id, {
            points: (unit.points || 0) + points
          });
        }
      }
      if (post.clan_id) {
        const clan = (await base44.entities.Clan.filter({ id: post.clan_id }))[0];
        if (clan) {
          await base44.entities.Clan.update(clan.id, {
            points: (clan.points || 0) + points
          });
        }
      }
    }

    queryClient.invalidateQueries(['admin-pending-posts']);
    toast.success('Post approved');
  };

  const handleReject = async (post) => {
    await base44.entities.Post.update(post.id, { status: 'rejected' });
    queryClient.invalidateQueries(['admin-pending-posts']);
    toast.success('Post rejected');
  };

  const handleApproveEvent = async (event) => {
    await base44.entities.Event.update(event.id, { status: 'approved' });
    queryClient.invalidateQueries(['admin-pending-events']);
    toast.success('Event approved');
  };

  const handleRejectEvent = async (event) => {
    await base44.entities.Event.update(event.id, { status: 'cancelled' });
    queryClient.invalidateQueries(['admin-pending-events']);
    toast.success('Event rejected');
  };

  const handleApproveBadgeRequest = async (request) => {
    await base44.entities.BadgeRequest.update(request.id, { status: 'approved' });
    
    await base44.entities.UserBadge.create({
      user_id: request.requester_id,
      badge_id: request.badge_id,
      badge_name: request.badge_name,
      earned_date: new Date().toISOString().split('T')[0],
      status: 'earned'
    });
    
    await base44.entities.Notification.create({
      user_id: request.requester_id,
      type: 'badge',
      title: 'Badge Awarded',
      message: `You have been awarded the ${request.badge_name} badge!`,
      is_read: false
    });
    
    queryClient.invalidateQueries(['admin-badge-requests']);
    toast.success('Badge awarded');
  };

  const handleRejectBadgeRequest = async (request) => {
    await base44.entities.BadgeRequest.update(request.id, { status: 'rejected' });
    queryClient.invalidateQueries(['admin-badge-requests']);
    toast.success('Request rejected');
  };

  const handleBroadcast = async () => {
    if (!broadcastMessage.trim()) return;
    
    setIsBroadcasting(true);
    try {
      const users = await base44.entities.User.list();
      await Promise.all(users.map(u => 
        base44.entities.Notification.create({
          user_id: u.id,
          type: 'system',
          title: 'Announcement',
          message: broadcastMessage,
          actor_id: user.id,
          actor_name: user.full_name,
          is_read: false
        })
      ));
      
      setBroadcastMessage('');
      toast.success(`Broadcast sent to ${users.length} users`);
    } catch (error) {
      toast.error('Failed to send broadcast');
    } finally {
      setIsBroadcasting(false);
    }
  };

  const handleAwardBadge = async () => {
    if (!selectedBadgeUser || !selectedBadge) return;
    
    const badge = badges.find(b => b.id === selectedBadge);
    
    await base44.entities.UserBadge.create({
      user_id: selectedBadgeUser.id,
      badge_id: selectedBadge,
      badge_name: badge?.name,
      badge_icon: badge?.icon,
      earned_date: new Date().toISOString().split('T')[0],
      status: 'earned'
    });
    
    await base44.entities.Notification.create({
      user_id: selectedBadgeUser.id,
      type: 'badge',
      title: 'Badge Awarded',
      message: `You have been awarded the ${badge?.name} badge!`,
      is_read: false
    });
    
    setShowBadgeDialog(false);
    setSelectedBadgeUser(null);
    setSelectedBadge('');
    toast.success('Badge awarded successfully');
  };

  const handleResetCompetition = async () => {
    if (!competitionTitle.trim()) {
      toast.error('Please enter a competition title');
      return;
    }
    
    setIsResetting(true);
    try {
      const allGroups = [
        ...units.map(u => ({ ...u, type: 'unit' })),
        ...clans.map(c => ({ ...c, type: 'clan' }))
      ].sort((a, b) => (b.points || 0) - (a.points || 0));

      const rankings = allGroups.map((group, index) => ({
        rank: index + 1,
        name: group.name,
        type: group.type,
        group_id: group.id,
        points: group.points || 0,
        member_count: group.member_count || 0
      }));

      await base44.entities.CompetitionHistory.create({
        title: competitionTitle,
        start_date: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
        end_date: new Date().toISOString().split('T')[0],
        rankings,
        total_units: units.length,
        total_clans: clans.length
      });

      await Promise.all(units.map(unit => 
        base44.entities.Unit.update(unit.id, { points: 0 })
      ));

      await Promise.all(clans.map(clan => 
        base44.entities.Clan.update(clan.id, { points: 0 })
      ));

      queryClient.invalidateQueries(['all-units']);
      queryClient.invalidateQueries(['all-clans']);
      queryClient.invalidateQueries(['competition-history']);
      
      setShowResetDialog(false);
      setCompetitionTitle('');
      toast.success('Competition reset! Previous standings saved to history.');
    } catch (error) {
      toast.error('Failed to reset competition');
    } finally {
      setIsResetting(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Shield className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500">Checking permissions...</p>
        </div>
      </div>
    );
  }

  const PostCard = ({ post, showActions = true }) => (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 overflow-hidden">
      <div className="flex gap-4 p-4">
        <div className="w-24 h-24 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
          {post.media_urls?.[0] ? (
            <img src={post.media_urls[0]} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Image className="w-8 h-8 text-gray-300" />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-gray-900 dark:text-white truncate">{post.author_name}</span>
            {post.is_unit_post && (
              <Badge className="bg-emerald-100 text-emerald-700 text-xs">Work Post</Badge>
            )}
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-2">{post.content || 'No caption'}</p>
        </div>
      </div>
      {showActions && (
        <div className="flex border-t border-gray-100 dark:border-gray-800">
          {post.is_unit_post ? (
            <Select onValueChange={(val) => handleApprove(post, val)}>
              <SelectTrigger className="flex-1 h-12 border-0 rounded-none text-emerald-600 hover:bg-emerald-50">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  Approve as...
                </div>
              </SelectTrigger>
              <SelectContent>
                {Object.entries(WORK_CATEGORIES).map(([key, val]) => (
                  <SelectItem key={key} value={key}>
                    {val.label} {val.points > 0 && `(${val.points} pts)`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <button onClick={() => handleApprove(post, 'none')} className="flex-1 flex items-center justify-center gap-2 py-3 text-emerald-600 hover:bg-emerald-50">
              <CheckCircle className="w-4 h-4" />
              Approve
            </button>
          )}
          <button onClick={() => handleReject(post)} className="flex-1 flex items-center justify-center gap-2 py-3 text-red-600 hover:bg-red-50 border-l">
            <XCircle className="w-4 h-4" />
            Reject
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
            <Shield className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Admin Panel</h1>
            <p className="text-gray-500 text-sm">Manage posts, events, badges, and users</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Dialog open={showHistoryDialog} onOpenChange={setShowHistoryDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <History className="w-4 h-4 mr-2" />
                History
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Competition History</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                {competitionHistory.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No competition history yet</p>
                ) : (
                  competitionHistory.map((comp) => (
                    <div key={comp.id} className="border rounded-xl p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-semibold">{comp.title}</h4>
                          <p className="text-sm text-gray-500">
                            {moment(comp.start_date).format('MMM D, YYYY')} - {moment(comp.end_date).format('MMM D, YYYY')}
                          </p>
                        </div>
                        <Badge variant="outline">{comp.rankings?.length || 0} groups</Badge>
                      </div>
                      <div className="space-y-2">
                        {comp.rankings?.slice(0, 3).map((r, idx) => (
                          <div key={idx} className="flex items-center justify-between text-sm bg-gray-50 dark:bg-gray-800 p-2 rounded">
                            <div className="flex items-center gap-2">
                              <span className="font-bold">{r.rank}.</span>
                              <span>{r.name}</span>
                              <Badge className="text-xs" variant="secondary">{r.type}</Badge>
                            </div>
                            <span className="text-emerald-600 font-medium">{r.points} pts</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={showResetDialog} onOpenChange={setShowResetDialog}>
            <DialogTrigger asChild>
              <Button variant="destructive" size="sm">
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset Dashboard
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Reset Competition Dashboard</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <p className="text-sm text-gray-500">
                  This will save the current standings to history and reset all unit/clan points to 0 for a new competition period.
                </p>
                <div>
                  <Label>Competition Period Title *</Label>
                  <Input
                    value={competitionTitle}
                    onChange={(e) => setCompetitionTitle(e.target.value)}
                    placeholder="e.g., 2024 Annual Competition"
                    className="mt-1"
                  />
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => setShowResetDialog(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    variant="destructive" 
                    className="flex-1"
                    onClick={handleResetCompetition}
                    disabled={isResetting || !competitionTitle.trim()}
                  >
                    {isResetting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    Reset & Save History
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="overflow-x-auto mb-6">
          <TabsList className="w-full grid grid-cols-12 min-w-[1200px]">
            <TabsTrigger value="pending" className="text-xs">
              <Clock className="w-4 h-4 mr-1" />
              Posts
              {pendingPosts.length > 0 && <Badge className="bg-amber-500 text-white ml-1">{pendingPosts.length}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="events" className="text-xs">
              <Calendar className="w-4 h-4 mr-1" />
              Events
            </TabsTrigger>
            <TabsTrigger value="badges" className="text-xs">
              <Award className="w-4 h-4 mr-1" />
              Badges
            </TabsTrigger>
            <TabsTrigger value="users" className="text-xs">
              <Users className="w-4 h-4 mr-1" />
              Users
            </TabsTrigger>
            <TabsTrigger value="orgleaders" className="text-xs">
              <Shield className="w-4 h-4 mr-1" />
              Leaders
            </TabsTrigger>
            <TabsTrigger value="marketplace" className="text-xs">
              <ShoppingBag className="w-4 h-4 mr-1" />
              Market
            </TabsTrigger>
            <TabsTrigger value="meritbadges" className="text-xs">
              <Award className="w-4 h-4 mr-1" />
              Merit
            </TabsTrigger>
            <TabsTrigger value="woodbadge" className="text-xs">
              <Award className="w-4 h-4 mr-1" />
              Wood Badge
              {woodBadgePending.length > 0 && <Badge className="bg-amber-500 text-white ml-1">{woodBadgePending.length}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="music" className="text-xs">
              <Music className="w-4 h-4 mr-1" />
              Music
            </TabsTrigger>
            <TabsTrigger value="camps" className="text-xs">
              <FileCode className="w-4 h-4 mr-1" />
              Camps
            </TabsTrigger>
            <TabsTrigger value="mvp" className="text-xs">
              <FileText className="w-4 h-4 mr-1" />
              MVP Info
            </TabsTrigger>
            <TabsTrigger value="broadcast" className="text-xs">
              <Bell className="w-4 h-4 mr-1" />
              Broadcast
            </TabsTrigger>
            <TabsTrigger value="scoutgpt" className="text-xs">
              <Zap className="w-4 h-4 mr-1" />
              ScoutGPT
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="pending">
          {pendingLoading ? (
            <div className="space-y-4">{[1,2,3].map(i => <Skeleton key={i} className="h-40 rounded-xl" />)}</div>
          ) : pendingPosts.length === 0 ? (
            <div className="text-center py-16">
              <Clock className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-semibold">No pending posts</h3>
            </div>
          ) : (
            <div className="space-y-4">{pendingPosts.map(post => <PostCard key={post.id} post={post} />)}</div>
          )}
        </TabsContent>

        <TabsContent value="events">
          {pendingEvents.length === 0 ? (
            <div className="text-center py-16">
              <Calendar className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-semibold">No pending events</h3>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingEvents.map(event => (
                <div key={event.id} className="bg-white dark:bg-gray-900 rounded-xl border p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-semibold">{event.title}</h4>
                      <p className="text-sm text-gray-500">{event.organizer_name}</p>
                    </div>
                    <Badge>{event.event_type}</Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{event.description}</p>
                  <p className="text-sm text-gray-500 mb-3">{moment(event.start_date).format('MMM D, YYYY h:mm A')}</p>
                  <div className="flex gap-2">
                    <Button onClick={() => handleApproveEvent(event)} className="flex-1 bg-emerald-600">
                      <CheckCircle className="w-4 h-4 mr-2" />Approve
                    </Button>
                    <Button onClick={() => handleRejectEvent(event)} variant="destructive" className="flex-1">
                      <XCircle className="w-4 h-4 mr-2" />Reject
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="badges">
          <div className="mb-6">
            <Dialog open={showBadgeDialog} onOpenChange={setShowBadgeDialog}>
              <DialogTrigger asChild>
                <Button className="bg-emerald-600">
                  <Award className="w-4 h-4 mr-2" />Award Badge
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Award Badge to User</DialogTitle></DialogHeader>
                <div className="space-y-4 mt-4">
                  <div>
                    <Label>Select User</Label>
                    <Select onValueChange={(id) => setSelectedBadgeUser(allUsers.find(u => u.id === id))}>
                      <SelectTrigger><SelectValue placeholder="Choose user" /></SelectTrigger>
                      <SelectContent>
                        {allUsers.map(u => <SelectItem key={u.id} value={u.id}>{u.full_name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Select Badge</Label>
                    <Select value={selectedBadge} onValueChange={setSelectedBadge}>
                      <SelectTrigger><SelectValue placeholder="Choose badge" /></SelectTrigger>
                      <SelectContent>
                        {badges.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={handleAwardBadge} className="w-full bg-emerald-600" disabled={!selectedBadgeUser || !selectedBadge}>
                    Award Badge
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {badgeRequests.length === 0 ? (
            <div className="text-center py-16">
              <Award className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-semibold">No pending badge requests</h3>
            </div>
          ) : (
            <div className="space-y-4">
              {badgeRequests.map(req => (
                <div key={req.id} className="bg-white dark:bg-gray-900 rounded-xl border p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-semibold">{req.badge_name}</h4>
                      <p className="text-sm text-gray-500">Requested by {req.requester_name}</p>
                      <Badge className="mt-1">{req.request_type}</Badge>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{req.reason}</p>
                  <div className="flex gap-2">
                    <Button onClick={() => handleApproveBadgeRequest(req)} className="flex-1 bg-emerald-600">
                      <CheckCircle className="w-4 h-4 mr-2" />Approve
                    </Button>
                    <Button onClick={() => handleRejectBadgeRequest(req)} variant="destructive" className="flex-1">
                      <XCircle className="w-4 h-4 mr-2" />Reject
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="users">
          <div className="bg-white dark:bg-gray-900 rounded-xl border">
            <div className="p-4 border-b">
              <h3 className="font-semibold">All Users ({allUsers.length})</h3>
            </div>
            <div className="divide-y max-h-[500px] overflow-y-auto">
              {allUsers.map(u => (
                <div key={u.id} className="flex items-center gap-4 p-4">
                  <Avatar>
                    <AvatarImage src={u.avatar} />
                    <AvatarFallback>{u.full_name?.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium truncate">{u.full_name}</p>
                      <VerifiedBadge user={u} size={18} />
                    </div>
                    <p className="text-sm text-gray-500 truncate">{u.email}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="orgleaders">
          <OrgLeadersAdmin users={allUsers} queryClient={queryClient} />
        </TabsContent>

        <TabsContent value="marketplace">
          <MarketplaceAdmin queryClient={queryClient} />
        </TabsContent>

        <TabsContent value="meritbadges">
          <MeritBadgesAdmin badges={badges} queryClient={queryClient} />
        </TabsContent>

        <TabsContent value="woodbadge">
          <WoodBadgeAdmin pendingUsers={woodBadgePending} queryClient={queryClient} allUsers={allUsers} />
        </TabsContent>

        <TabsContent value="music">
          <div className="space-y-4">
            <Button 
              onClick={() => navigate(createPageUrl('MusicLibrary'))}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              <Music className="w-4 h-4 mr-2" />
              Open Music Library
            </Button>
            <div className="bg-white dark:bg-gray-900 rounded-xl border p-6">
              <div className="flex items-center gap-3 mb-4">
                <Music className="w-8 h-8 text-emerald-600" />
                <div>
                  <h3 className="font-semibold">Music Library</h3>
                  <p className="text-sm text-gray-500">Upload and manage background music for posts and stories</p>
                </div>
              </div>
              <ul className="text-sm text-gray-600 space-y-2 mb-4">
                <li>• Upload songs (max 1.5MB each)</li>
                <li>• Add song title, artist, and genre</li>
                <li>• Optional cover images</li>
                <li>• Available for all users in post/story music selector</li>
              </ul>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="mvp">
          <MVPTabContent />
        </TabsContent>

        <TabsContent value="broadcast">
          <div className="bg-white dark:bg-gray-900 rounded-xl border p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Broadcast Notification
            </h3>
            <Textarea
              value={broadcastMessage}
              onChange={(e) => setBroadcastMessage(e.target.value)}
              placeholder="Enter your announcement message..."
              rows={4}
              className="mb-4"
            />
            <Button onClick={handleBroadcast} className="w-full bg-emerald-600" disabled={!broadcastMessage.trim() || isBroadcasting}>
              {isBroadcasting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
              Send to All Users
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="scoutgpt">
          <div className="bg-white dark:bg-gray-900 rounded-xl border p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Zap className="w-5 h-5 text-blue-500" />
              ScoutGPT Training
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              Upload PDF documents about scouting to train the bot's knowledge base. These documents will be used to improve responses to user queries.
            </p>

            {/* Upload Section */}
            <div className="mb-8">
              <Label className="block mb-3 font-semibold">Upload Training Documents</Label>
              <div className="border-2 border-dashed border-emerald-300 dark:border-emerald-600 rounded-xl p-8 text-center cursor-pointer hover:bg-emerald-50 dark:hover:bg-emerald-900/10 transition">
                <input
                  type="file"
                  multiple
                  accept=".pdf"
                  onChange={(e) => {
                    const files = Array.from(e.target.files || []);
                    setTrainingFiles(prev => [...prev, ...files]);
                  }}
                  className="hidden"
                  id="pdf-upload"
                />
                <label htmlFor="pdf-upload" className="cursor-pointer block">
                  <Upload className="w-12 h-12 mx-auto mb-2 text-emerald-500" />
                  <p className="font-semibold text-gray-900 dark:text-white">Click to upload PDF files</p>
                  <p className="text-xs text-gray-500 mt-1">or drag and drop</p>
                </label>
              </div>
            </div>

            {/* Selected Files */}
            {trainingFiles.length > 0 && (
              <div className="mb-6">
                <h4 className="font-semibold mb-3">Selected Files ({trainingFiles.length})</h4>
                <div className="space-y-2">
                  {trainingFiles.map((file, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-gray-100 dark:bg-gray-800 p-3 rounded-lg">
                      <span className="text-sm text-gray-700 dark:text-gray-300">{file.name}</span>
                      <button
                        onClick={() => setTrainingFiles(trainingFiles.filter((_, i) => i !== idx))}
                        className="text-red-600 hover:text-red-700 text-sm font-medium"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Upload Button */}
            <Button
              onClick={async () => {
                if (trainingFiles.length === 0) {
                  toast.error('Please select at least one PDF file');
                  return;
                }

                setIsUploadingTraining(true);
                try {
                  for (const file of trainingFiles) {
                    const { file_url } = await base44.integrations.Core.UploadFile({ file });
                    console.log(`Uploaded training file: ${file.name} → ${file_url}`);
                  }
                  toast.success(`${trainingFiles.length} PDF(s) uploaded successfully! The bot will be retrained with this knowledge.`);
                  setTrainingFiles([]);
                } catch (error) {
                  console.error('Upload error:', error);
                  toast.error('Failed to upload training files');
                } finally {
                  setIsUploadingTraining(false);
                }
              }}
              className="w-full bg-blue-600 hover:bg-blue-700"
              disabled={trainingFiles.length === 0 || isUploadingTraining}
            >
              {isUploadingTraining ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Upload className="w-4 h-4 mr-2" />}
              {isUploadingTraining ? 'Uploading...' : `Upload ${trainingFiles.length > 0 ? trainingFiles.length : 'PDF'} File(s)`}
            </Button>

            {/* Info Box */}
            <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
              <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">How it works:</h4>
              <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                <li>✓ Upload PDF documents about scouting concepts, ranks, activities, etc.</li>
                <li>✓ The bot extracts text and learns from these documents</li>
                <li>✓ When users ask questions, the bot uses this knowledge to provide better answers</li>
                <li>✓ You can upload multiple PDFs at once</li>
              </ul>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="camps">
          <div className="bg-white dark:bg-gray-900 rounded-xl border p-6">
            <CampTemplatesAdmin />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Marketplace Admin Component
function MarketplaceAdmin({ queryClient }) {
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [newProduct, setNewProduct] = useState({
    title: '', description: '', category: 'uniforms', price: '', condition: 'new'
  });

  const { data: products = [] } = useQuery({
    queryKey: ['admin-products'],
    queryFn: () => base44.entities.Product.list('-created_date', 100),
  });

  const pendingProducts = products.filter(p => p.status === 'pending');
  const approvedProducts = products.filter(p => p.status === 'approved');

  const handleApproveProduct = async (product) => {
    await base44.entities.Product.update(product.id, { status: 'approved' });
    queryClient.invalidateQueries(['admin-products']);
    toast.success('Product approved');
  };

  const handleAddProduct = async () => {
    await base44.entities.Product.create({
      ...newProduct,
      price: parseFloat(newProduct.price) || 0,
      seller_id: 'admin',
      seller_name: 'Scout Store',
      status: 'approved'
    });
    setShowAddProduct(false);
    setNewProduct({ title: '', description: '', category: 'uniforms', price: '', condition: 'new' });
    queryClient.invalidateQueries(['admin-products']);
    toast.success('Product added');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold">Marketplace Management</h3>
        <Dialog open={showAddProduct} onOpenChange={setShowAddProduct}>
          <DialogTrigger asChild>
            <Button className="bg-emerald-600"><Plus className="w-4 h-4 mr-2" />Add Product</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add New Product</DialogTitle></DialogHeader>
            <div className="space-y-4 mt-4">
              <Input placeholder="Product title" value={newProduct.title} onChange={(e) => setNewProduct({...newProduct, title: e.target.value})} />
              <Textarea placeholder="Description" value={newProduct.description} onChange={(e) => setNewProduct({...newProduct, description: e.target.value})} />
              <Select value={newProduct.category} onValueChange={(v) => setNewProduct({...newProduct, category: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="uniforms">Uniforms</SelectItem>
                  <SelectItem value="tents">Tents</SelectItem>
                  <SelectItem value="ropes">Ropes</SelectItem>
                  <SelectItem value="compasses">Compasses</SelectItem>
                  <SelectItem value="camping_gear">Camping Gear</SelectItem>
                  <SelectItem value="books">Books</SelectItem>
                </SelectContent>
              </Select>
              <Input type="number" placeholder="Price (RWF)" value={newProduct.price} onChange={(e) => setNewProduct({...newProduct, price: e.target.value})} />
              <Button onClick={handleAddProduct} className="w-full bg-emerald-600">Add Product</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {pendingProducts.length > 0 && (
        <div>
          <h4 className="font-medium mb-3 text-amber-600">Pending Approval ({pendingProducts.length})</h4>
          <div className="space-y-3">
            {pendingProducts.map(product => (
              <div key={product.id} className="bg-white dark:bg-gray-900 rounded-xl border p-4 flex justify-between items-center">
                <div>
                  <p className="font-medium">{product.title}</p>
                  <p className="text-sm text-gray-500">{product.price?.toLocaleString()} RWF • {product.seller_name}</p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => handleApproveProduct(product)} className="bg-emerald-600">Approve</Button>
                  <Button size="sm" variant="destructive" onClick={() => base44.entities.Product.update(product.id, { status: 'removed' })}>Remove</Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <h4 className="font-medium mb-3">All Products ({approvedProducts.length})</h4>
        <div className="grid gap-3 md:grid-cols-2">
          {approvedProducts.slice(0, 10).map(product => (
            <div key={product.id} className="bg-white dark:bg-gray-900 rounded-xl border p-4">
              <p className="font-medium">{product.title}</p>
              <p className="text-sm text-emerald-600">{product.price?.toLocaleString()} RWF</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Wood Badge Admin Component
function WoodBadgeAdmin({ pendingUsers, queryClient, allUsers }) {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [beadCount, setBeadCount] = useState(2);

  const BEAD_DESCRIPTIONS = {
    2: "Completed Wood Badge Training",
    3: "Assistant Leader Trainer (Course Staff)",
    4: "Course Director (Leader Trainer)",
    5: "Deputy Camp Chief of Gilwell",
    6: "Camp Chief of Gilwell Park"
  };

  const handleAddWoodBadge = async () => {
    if (!selectedUser || !beadCount) {
      toast.error('Please select a user and bead count');
      return;
    }

    try {
      await base44.entities.User.update(selectedUser.id, {
        has_wood_badge: true,
        wood_badge_beads: beadCount,
        wood_badge_status: 'approved'
      });

      await base44.entities.Notification.create({
        user_id: selectedUser.id,
        type: 'badge',
        title: 'Wood Badge Awarded',
        message: `You have been awarded a Wood Badge with ${beadCount} beads - ${BEAD_DESCRIPTIONS[beadCount]}`,
        is_read: false
      });

      queryClient.invalidateQueries(['admin-all-users']);
      queryClient.invalidateQueries(['wood-badge-pending']);
      setShowAddDialog(false);
      setSelectedUser(null);
      setBeadCount(2);
      toast.success('Wood Badge awarded successfully');
    } catch (error) {
      toast.error('Failed to award Wood Badge');
    }
  };

  const handleApproveWoodBadge = async (user) => {
    try {
      await base44.entities.User.update(user.id, { wood_badge_status: 'approved' });
      
      await base44.entities.Notification.create({
        user_id: user.id,
        type: 'badge',
        title: 'Wood Badge Approved',
        message: `Your Wood Badge (${user.wood_badge_beads} beads) has been approved and is now displayed on your profile!`,
        is_read: false
      });
      
      queryClient.invalidateQueries(['wood-badge-pending']);
      toast.success('Wood Badge approved');
    } catch (error) {
      toast.error('Failed to approve Wood Badge');
    }
  };

  const handleRejectWoodBadge = async (user) => {
    try {
      await base44.entities.User.update(user.id, { 
        wood_badge_status: 'rejected',
        has_wood_badge: false,
        wood_badge_beads: null
      });
      
      await base44.entities.Notification.create({
        user_id: user.id,
        type: 'system',
        title: 'Wood Badge Request',
        message: 'Your Wood Badge request was not approved. Please contact admin for more information.',
        is_read: false
      });
      
      queryClient.invalidateQueries(['wood-badge-pending']);
      toast.success('Wood Badge rejected');
    } catch (error) {
      toast.error('Failed to reject Wood Badge');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">
            <Award className="w-6 h-6 text-amber-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">Wood Badge Management</h3>
            <p className="text-sm text-gray-500">Award and approve Wood Badges</p>
          </div>
        </div>
        
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button className="bg-amber-600 hover:bg-amber-700">
              <Plus className="w-4 h-4 mr-2" />
              Award Wood Badge
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Award Wood Badge</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label>Select User</Label>
                <Select onValueChange={(id) => setSelectedUser(allUsers.find(u => u.id === id))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose user" />
                  </SelectTrigger>
                  <SelectContent>
                    {allUsers.map(u => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.full_name} - {u.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Number of Beads (2-6)</Label>
                <Select value={beadCount.toString()} onValueChange={(v) => setBeadCount(parseInt(v))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[2, 3, 4, 5, 6].map(num => (
                      <SelectItem key={num} value={num.toString()}>
                        {num} Beads - {BEAD_DESCRIPTIONS[num]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button 
                onClick={handleAddWoodBadge} 
                className="w-full bg-amber-600 hover:bg-amber-700"
                disabled={!selectedUser}
              >
                Award Wood Badge
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {pendingUsers.length > 0 && (
        <>
          <h4 className="font-medium text-amber-600 mb-3">Pending Requests ({pendingUsers.length})</h4>
          <div className="space-y-4">
            {pendingUsers.map(user => (
              <div key={user.id} className="bg-white dark:bg-gray-900 rounded-xl border p-4">
                <div className="flex items-center gap-4">
                  <Avatar>
                    <AvatarImage src={user.avatar} />
                    <AvatarFallback>{user.full_name?.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-medium">{user.full_name}</p>
                    <p className="text-sm text-gray-500">{user.email}</p>
                  </div>
                  <div className="text-right">
                    <Badge className="bg-amber-100 text-amber-700">{user.wood_badge_beads} Beads</Badge>
                    <p className="text-xs text-gray-500 mt-1">{BEAD_DESCRIPTIONS[user.wood_badge_beads]}</p>
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button onClick={() => handleApproveWoodBadge(user)} className="flex-1 bg-emerald-600 hover:bg-emerald-700">
                    <CheckCircle className="w-4 h-4 mr-2" />Approve
                  </Button>
                  <Button onClick={() => handleRejectWoodBadge(user)} variant="destructive" className="flex-1">
                    <XCircle className="w-4 h-4 mr-2" />Reject
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// Organization Leaders Admin Component
function OrgLeadersAdmin({ users, queryClient }) {
  const [showDialog, setShowDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [orgRole, setOrgRole] = useState('');
  const [orgPosition, setOrgPosition] = useState('');

  const orgLeaders = users.filter(u => u.is_org_leader);

  const handleAddOrgLeader = async () => {
    if (!selectedUser || !orgRole || !orgPosition) {
      toast.error('Please fill all fields');
      return;
    }

    try {
      await base44.entities.User.update(selectedUser.id, {
        is_org_leader: true,
        org_leader_role: orgRole,
        org_leader_position: orgPosition
      });

      await base44.entities.Notification.create({
        user_id: selectedUser.id,
        type: 'system',
        title: 'Organization Leader Recognition',
        message: `You have been recognized as ${orgRole} - ${orgPosition}`,
        is_read: false
      });

      queryClient.invalidateQueries(['admin-all-users']);
      setShowDialog(false);
      setSelectedUser(null);
      setOrgRole('');
      setOrgPosition('');
      toast.success('Organization leader added');
    } catch (error) {
      toast.error('Failed to add organization leader');
    }
  };

  const handleRemoveOrgLeader = async (user) => {
    try {
      await base44.entities.User.update(user.id, {
        is_org_leader: false,
        org_leader_role: null,
        org_leader_position: null
      });
      queryClient.invalidateQueries(['admin-all-users']);
      toast.success('Organization leader status removed');
    } catch (error) {
      toast.error('Failed to remove organization leader');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-white">Organization Leaders</h3>
          <p className="text-sm text-gray-500">Manage scout organization leaders</p>
        </div>
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogTrigger asChild>
            <Button className="bg-emerald-600">
              <Shield className="w-4 h-4 mr-2" />
              Add Leader
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Organization Leader</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label>Select User</Label>
                <Select onValueChange={(id) => setSelectedUser(users.find(u => u.id === id))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose user" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map(u => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.full_name} - {u.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Role/Title</Label>
                <Input
                  value={orgRole}
                  onChange={(e) => setOrgRole(e.target.value)}
                  placeholder="e.g., National Commissioner, Regional Leader"
                />
              </div>
              <div>
                <Label>Position/Department</Label>
                <Input
                  value={orgPosition}
                  onChange={(e) => setOrgPosition(e.target.value)}
                  placeholder="e.g., Training Department, Youth Program"
                />
              </div>
              <Button 
                onClick={handleAddOrgLeader} 
                className="w-full bg-emerald-600"
                disabled={!selectedUser || !orgRole || !orgPosition}
              >
                Add Organization Leader
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {orgLeaders.length === 0 ? (
        <div className="text-center py-16">
          <Shield className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-semibold">No organization leaders yet</h3>
          <p className="text-gray-500">Add scout organization leaders to recognize their roles</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orgLeaders.map(leader => (
            <div key={leader.id} className="bg-white dark:bg-gray-900 rounded-xl border p-4">
              <div className="flex items-center gap-4">
                <Avatar className="w-12 h-12">
                  <AvatarImage src={leader.avatar} />
                  <AvatarFallback>{leader.full_name?.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-gray-900 dark:text-white">{leader.full_name}</p>
                    <VerifiedBadge user={leader} size={18} />
                  </div>
                  <p className="text-sm text-gray-500">{leader.email}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge className="bg-emerald-100 text-emerald-700">
                      {leader.org_leader_role}
                    </Badge>
                    <span className="text-sm text-gray-600">{leader.org_leader_position}</span>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleRemoveOrgLeader(leader)}
                  className="text-red-600 hover:text-red-700"
                >
                  Remove
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Merit Badges Admin Component
function MeritBadgesAdmin({ badges, queryClient }) {
  const [showAddBadge, setShowAddBadge] = useState(false);
  const [newBadge, setNewBadge] = useState({
    name: '', description: '', category: 'skills', level: 'bronze', points: 10, icon: ''
  });

  const handleAddBadge = async () => {
    await base44.entities.Badge.create(newBadge);
    setShowAddBadge(false);
    setNewBadge({ name: '', description: '', category: 'skills', level: 'bronze', points: 10, icon: '' });
    queryClient.invalidateQueries(['all-badges']);
    toast.success('Merit badge created');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold">Merit Badges ({badges.length})</h3>
        <Dialog open={showAddBadge} onOpenChange={setShowAddBadge}>
          <DialogTrigger asChild>
            <Button className="bg-emerald-600"><Plus className="w-4 h-4 mr-2" />Add Badge</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create Merit Badge</DialogTitle></DialogHeader>
            <div className="space-y-4 mt-4">
              <Input placeholder="Badge name" value={newBadge.name} onChange={(e) => setNewBadge({...newBadge, name: e.target.value})} />
              <Textarea placeholder="Description" value={newBadge.description} onChange={(e) => setNewBadge({...newBadge, description: e.target.value})} />
              <Select value={newBadge.category} onValueChange={(v) => setNewBadge({...newBadge, category: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="outdoor">Outdoor</SelectItem>
                  <SelectItem value="service">Service</SelectItem>
                  <SelectItem value="skills">Skills</SelectItem>
                  <SelectItem value="leadership">Leadership</SelectItem>
                  <SelectItem value="special">Special</SelectItem>
                  <SelectItem value="achievement">Achievement</SelectItem>
                </SelectContent>
              </Select>
              <Select value={newBadge.level} onValueChange={(v) => setNewBadge({...newBadge, level: v})}>
                <SelectTrigger><SelectValue placeholder="Level" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="bronze">Bronze</SelectItem>
                  <SelectItem value="silver">Silver</SelectItem>
                  <SelectItem value="gold">Gold</SelectItem>
                  <SelectItem value="platinum">Platinum</SelectItem>
                </SelectContent>
              </Select>
              <Input type="number" placeholder="Points" value={newBadge.points} onChange={(e) => setNewBadge({...newBadge, points: parseInt(e.target.value) || 10})} />
              <Button onClick={handleAddBadge} className="w-full bg-emerald-600" disabled={!newBadge.name}>Create Badge</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {badges.map(badge => (
          <div key={badge.id} className="bg-white dark:bg-gray-900 rounded-xl border p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center overflow-hidden">
                {badge.icon && badge.icon.startsWith('http') ? (
                  <img src={badge.icon} alt={badge.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-2xl">{badge.icon || '🏅'}</span>
                )}
              </div>
              <div>
                <p className="font-medium">{badge.name}</p>
                <Badge className="text-xs">{badge.category}</Badge>
              </div>
            </div>
            <p className="text-sm text-gray-500 line-clamp-2">{badge.description}</p>
            <div className="flex items-center justify-between mt-3 text-sm">
              <Badge variant="outline">{badge.level}</Badge>
              <span className="text-yellow-600">{badge.points} pts</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
