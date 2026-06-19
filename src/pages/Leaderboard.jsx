import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Trophy, Medal, Award, Users, TrendingUp, History, ChevronRight } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/components/ui/translations';
import moment from 'moment';

export default function Leaderboard() {
  const [activeTab, setActiveTab] = useState('all');
  const [showHistory, setShowHistory] = useState(false);
  const { t } = useLanguage();

  const { data: units = [], isLoading: unitsLoading } = useQuery({
    queryKey: ['leaderboard-units'],
    queryFn: () => base44.entities.Unit.filter({ status: 'active' }, '-points', 100),
  });

  const { data: clans = [], isLoading: clansLoading } = useQuery({
    queryKey: ['leaderboard-clans'],
    queryFn: () => base44.entities.Clan.filter({ status: 'active' }, '-points', 100),
  });

  const { data: competitionHistory = [] } = useQuery({
    queryKey: ['competition-history'],
    queryFn: () => base44.entities.CompetitionHistory.list('-end_date', 50),
  });

  const isLoading = unitsLoading || clansLoading;

  // Combine and sort all groups
  const allGroups = [
    ...units.map(u => ({ ...u, type: 'unit' })),
    ...clans.map(c => ({ ...c, type: 'clan' }))
  ].sort((a, b) => (b.points || 0) - (a.points || 0));

  const filteredGroups = activeTab === 'all' 
    ? allGroups 
    : activeTab === 'units' 
      ? units.map(u => ({ ...u, type: 'unit' }))
      : clans.map(c => ({ ...c, type: 'clan' }));

  const getRankIcon = (index) => {
    if (index === 0) return <Trophy className="w-6 h-6 text-yellow-500" />;
    if (index === 1) return <Medal className="w-6 h-6 text-gray-400" />;
    if (index === 2) return <Award className="w-6 h-6 text-amber-600" />;
    return <span className="w-6 h-6 flex items-center justify-center text-gray-500 font-bold">{index + 1}</span>;
  };

  const getRankBg = (index) => {
    if (index === 0) return 'bg-gradient-to-r from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 border-yellow-200 dark:border-yellow-700';
    if (index === 1) return 'bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800/50 dark:to-gray-700/50 border-gray-200 dark:border-gray-600';
    if (index === 2) return 'bg-gradient-to-r from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20 border-amber-200 dark:border-amber-700';
    return 'bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800';
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-2xl flex items-center justify-center shadow-lg">
          <Trophy className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('leaderboard')}</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">{t('topPerforming')}</p>
      </div>

      {/* History Button */}
      {competitionHistory.length > 0 && (
        <div className="flex justify-center mb-4">
          <Dialog open={showHistory} onOpenChange={setShowHistory}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <History className="w-4 h-4" />
                {t('history')}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{t('competitionHistory')}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                {competitionHistory.map((comp) => (
                  <div key={comp.id} className="border rounded-xl p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-semibold">{comp.title}</h4>
                        <p className="text-sm text-gray-500">
                          {moment(comp.start_date).format('MMM D, YYYY')} - {moment(comp.end_date).format('MMM D, YYYY')}
                        </p>
                      </div>
                      <Badge variant="outline">{comp.rankings?.length || 0} {t('groups')}</Badge>
                    </div>
                    <div className="space-y-2">
                      {comp.rankings?.slice(0, 5).map((r, idx) => (
                        <div key={idx} className="flex items-center justify-between text-sm bg-gray-50 dark:bg-gray-800 p-2 rounded">
                          <div className="flex items-center gap-2">
                            {idx === 0 && <Trophy className="w-4 h-4 text-yellow-500" />}
                            {idx === 1 && <Medal className="w-4 h-4 text-gray-400" />}
                            {idx === 2 && <Award className="w-4 h-4 text-amber-600" />}
                            {idx > 2 && <span className="w-4 h-4 flex items-center justify-center text-xs font-bold">{r.rank}</span>}
                            <span>{r.name}</span>
                            <Badge className="text-xs" variant="secondary">
                              {r.type === 'unit' ? t('units') : t('clans')}
                            </Badge>
                          </div>
                          <span className="text-emerald-600 font-medium">{r.points} {t('points')}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </DialogContent>
          </Dialog>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-6 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl">
        {[
          { key: 'all', label: t('all') },
          { key: 'units', label: t('units') },
          { key: 'clans', label: t('clans') },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              "flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all duration-200",
              activeTab === tab.key
                ? "bg-white dark:bg-gray-900 text-emerald-600 dark:text-emerald-400 shadow-sm"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Leaderboard List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-4 p-4 bg-white dark:bg-gray-900 rounded-xl">
              <Skeleton className="w-10 h-10 rounded-full" />
              <div className="flex-1">
                <Skeleton className="w-32 h-4 mb-2" />
                <Skeleton className="w-20 h-3" />
              </div>
              <Skeleton className="w-16 h-6 rounded-full" />
            </div>
          ))}
        </div>
      ) : filteredGroups.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-20 h-20 mx-auto mb-4 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
            <Users className="w-10 h-10 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{t('noGroupsYet')}</h3>
          <p className="text-gray-500">{t('beFirstToCreate')}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredGroups.map((group, index) => (
            <div
              key={`${group.type}-${group.id}`}
              className={cn(
                "flex items-center gap-4 p-4 rounded-xl border transition-all duration-200 hover:shadow-md",
                getRankBg(index)
              )}
            >
              {/* Rank */}
              <div className="flex-shrink-0">
                {getRankIcon(index)}
              </div>

              {/* Avatar */}
              <div className="flex-shrink-0">
                {group.avatar ? (
                  <img
                    src={group.avatar}
                    alt={group.name}
                    className="w-12 h-12 rounded-full object-cover border-2 border-white dark:border-gray-700 shadow-sm"
                  />
                ) : (
                  <div className={cn(
                    "w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-sm",
                    group.type === 'unit' ? 'bg-gradient-to-br from-blue-400 to-blue-600' : 'bg-gradient-to-br from-purple-400 to-purple-600'
                  )}>
                    {group.name?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                  {group.name}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className={cn(
                    "text-xs px-2 py-0.5 rounded-full font-medium",
                    group.type === 'unit' 
                      ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                      : 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                  )}>
                    {group.type === 'unit' ? t('units') : t('clans')}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {group.member_count || 0} {t('members')}
                  </span>
                </div>
              </div>

              {/* Points */}
              <div className="flex items-center gap-1.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 px-3 py-1.5 rounded-full">
                <TrendingUp className="w-4 h-4" />
                <span className="font-bold text-sm">{group.points || 0}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Info Note */}
      <div className="mt-8 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
        <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
          {t('pointsAwarded')} {t('topPerformersRecognized')}
        </p>
      </div>
    </div>
  );
}