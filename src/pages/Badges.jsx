import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Search, Filter, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { createPageUrl } from '@/utils';
import { cn } from '@/lib/utils';
import BadgeCard from '@/components/scout/BadgeCard';

const BADGE_CATEGORIES = [
  { id: 'all', label: 'All', icon: '🏅' },
  { id: 'outdoor', label: 'Outdoor', icon: '🏕️' },
  { id: 'service', label: 'Service', icon: '🤝' },
  { id: 'skills', label: 'Skills', icon: '🛠️' },
  { id: 'leadership', label: 'Leadership', icon: '👑' },
  { id: 'special', label: 'Special', icon: '⭐' },
  { id: 'achievement', label: 'Achievement', icon: '🏆' },
];

export default function Badges() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [selectedBadge, setSelectedBadge] = useState(null);

  const urlParams = new URLSearchParams(window.location.search);
  const userId = urlParams.get('user');

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

  const targetUserId = userId || user?.id;

  const { data: badges = [] } = useQuery({
    queryKey: ['badges'],
    queryFn: () => base44.entities.Badge.list('name', 100),
  });

  const { data: userBadges = [] } = useQuery({
    queryKey: ['user-badges', targetUserId],
    queryFn: async () => {
      if (!targetUserId) return [];
      return await base44.entities.UserBadge.filter({ user_id: targetUserId });
    },
    enabled: !!targetUserId,
  });

  // Create a map of user badges for quick lookup
  const userBadgeMap = userBadges.reduce((acc, ub) => {
    acc[ub.badge_id] = ub;
    return acc;
  }, {});

  // Filter badges
  const filteredBadges = badges.filter(badge => {
    const matchesSearch = (badge.name || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === 'all' || badge.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  // Group by category for display
  const earnedBadges = filteredBadges.filter(b => userBadgeMap[b.id]?.status === 'earned');
  const inProgressBadges = filteredBadges.filter(b => 
    userBadgeMap[b.id]?.status === 'in_progress' || userBadgeMap[b.id]?.status === 'pending_approval'
  );
  const lockedBadges = filteredBadges.filter(b => !userBadgeMap[b.id]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => navigate(-1)}
                className="text-white hover:bg-white/20 rounded-full"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <h1 className="text-2xl font-bold">Scout Badges</h1>
            </div>
            <Link to={createPageUrl('RequestBadge')}>
              <Button className="bg-white/20 hover:bg-white/30 text-white rounded-full">
                <Plus className="w-4 h-4 mr-2" />
                Request Badge
              </Button>
            </Link>
          </div>
          
          {/* Stats */}
          <div className="flex items-center gap-6 text-sm">
            <div className="text-center">
              <p className="text-3xl font-bold">{earnedBadges.length}</p>
              <p className="text-white/80">Earned</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold">{inProgressBadges.length}</p>
              <p className="text-white/80">In Progress</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold">{badges.length}</p>
              <p className="text-white/80">Total</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search badges..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 rounded-full"
          />
        </div>

        {/* Category Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-4 mb-6 scrollbar-hide">
          {BADGE_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-colors",
                activeCategory === cat.id
                  ? "bg-amber-500 text-white"
                  : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              )}
            >
              <span>{cat.icon}</span>
              <span className="text-sm font-medium">{cat.label}</span>
            </button>
          ))}
        </div>

        {/* Earned Badges */}
        {earnedBadges.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              ✨ Earned ({earnedBadges.length})
            </h2>
            <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
              {earnedBadges.map((badge) => (
                <BadgeCard
                  key={badge.id}
                  badge={badge}
                  userBadge={userBadgeMap[badge.id]}
                  showProgress={false}
                  onClick={() => setSelectedBadge(badge)}
                />
              ))}
            </div>
          </div>
        )}

        {/* In Progress */}
        {inProgressBadges.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              🚀 In Progress ({inProgressBadges.length})
            </h2>
            <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
              {inProgressBadges.map((badge) => (
                <BadgeCard
                  key={badge.id}
                  badge={badge}
                  userBadge={userBadgeMap[badge.id]}
                  onClick={() => setSelectedBadge(badge)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Locked Badges */}
        {lockedBadges.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              🔒 Locked ({lockedBadges.length})
            </h2>
            <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
              {lockedBadges.map((badge) => (
                <BadgeCard
                  key={badge.id}
                  badge={badge}
                  userBadge={null}
                  showProgress={false}
                  onClick={() => setSelectedBadge(badge)}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Badge Detail Modal */}
      <Dialog open={!!selectedBadge} onOpenChange={() => setSelectedBadge(null)}>
        <DialogContent className="max-w-md">
          {selectedBadge && (
            <>
              <DialogHeader>
                <div className="flex flex-col items-center text-center">
                  <div className={cn(
                    "w-24 h-24 rounded-full flex items-center justify-center text-4xl mb-4",
                    userBadgeMap[selectedBadge.id]?.status === 'earned'
                      ? "bg-gradient-to-br from-amber-400 to-amber-600"
                      : "bg-gray-200 dark:bg-gray-700"
                  )}>
                    {selectedBadge.icon || '🏅'}
                  </div>
                  <DialogTitle className="text-xl">{selectedBadge.name}</DialogTitle>
                  <p className="text-sm text-gray-500 capitalize">{selectedBadge.level} • {selectedBadge.category}</p>
                </div>
              </DialogHeader>

              <div className="space-y-4">
                <p className="text-gray-600 dark:text-gray-400 text-center">
                  {selectedBadge.description || 'Complete the requirements to earn this badge.'}
                </p>

                {userBadgeMap[selectedBadge.id] && userBadgeMap[selectedBadge.id].status !== 'earned' && (
                  <div>
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-gray-500">Progress</span>
                      <span className="font-medium">{userBadgeMap[selectedBadge.id].progress}%</span>
                    </div>
                    <Progress value={userBadgeMap[selectedBadge.id].progress} />
                  </div>
                )}

                {selectedBadge.requirements?.length > 0 && (
                  <div>
                    <h4 className="font-medium text-sm mb-2">Requirements</h4>
                    <ul className="space-y-2">
                      {selectedBadge.requirements.map((req, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                          <span className="text-gray-400">•</span>
                          {req}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="flex items-center justify-between pt-4 border-t">
                  <span className="text-sm text-gray-500">Points</span>
                  <span className="font-semibold text-amber-600">{selectedBadge.points || 10} pts</span>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
