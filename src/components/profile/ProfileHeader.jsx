import React, { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Settings, Grid3X3, Bookmark, Play, Award, Users, MapPin, Link as LinkIcon, MessageCircle, BadgeCheck, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { cn } from '@/lib/utils';
import WoodBadgeBeads from './WoodBadgeBeads';

export default function ProfileHeader({
  user,
  isOwnProfile,
  isFollowing,
  onFollow,
  onMessage,
  stats
}) {
  const [activeTab, setActiveTab] = useState('posts');

  const tabs = [
  { id: 'posts', icon: Grid3X3, label: 'Posts' },
  { id: 'reels', icon: Play, label: 'Reels' },
  { id: 'saved', icon: Bookmark, label: 'Saved', ownOnly: true },
  { id: 'tagged', icon: Users, label: 'Tagged' }];


  return (
    <div className="bg-white dark:bg-gray-900">
      {/* Cover Image */}
      <div className="h-32 md:h-48 bg-gradient-to-r from-emerald-400 via-emerald-500 to-teal-500 relative">
        {user?.cover_image &&
        <img
          src={user.cover_image}
          alt="Cover"
          className="w-full h-full object-cover" />

        }
      </div>

      {/* Profile Info */}
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex flex-col md:flex-row md:items-start gap-4 pt-4 relative z-10">
          {/* Avatar with Star Badge and Wood Badge Beads */}
          <div className="relative w-24 h-24 md:w-32 md:h-32 -mt-16 md:-mt-20">
            <Avatar className="w-full h-full ring-4 ring-white dark:ring-gray-900 shadow-lg">
              <AvatarImage src={user?.avatar} />
              <AvatarFallback className="text-3xl bg-emerald-100 text-emerald-700">
                {user?.full_name?.charAt(0) || 'S'}
              </AvatarFallback>
            </Avatar>
            
            {/* Organization Leader Star Badge */}
            {user?.is_org_leader &&
            <TooltipProvider>
                <Tooltip delayDuration={0}>
                  <TooltipTrigger asChild>
                    <div className="absolute bottom-0 left-0 w-8 h-8 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-full flex items-center justify-center shadow-lg ring-2 ring-white dark:ring-gray-900 cursor-pointer hover:scale-110 transition-transform">
                      <Star className="w-4 h-4 text-white fill-white" />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="max-w-xs">
                    <div className="space-y-1">
                      <p className="font-semibold text-sm">{user.org_leader_role}</p>
                      <p className="text-xs text-gray-500">{user.org_leader_position}</p>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            }

            {/* Wood Badge Beads - Hanging on Cord */}
            {user?.has_wood_badge && user?.wood_badge_status === 'approved' && user?.wood_badge_beads >= 2 &&
            <TooltipProvider>
                <Tooltip delayDuration={0}>
                  <TooltipTrigger asChild>
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 pointer-events-auto cursor-pointer">
                      <svg width="65" height="40" viewBox="0 0 65 40" className="overflow-visible">
                        {(() => {
                        const beadCount = Math.min(Math.max(parseInt(user.wood_badge_beads) || 2, 2), 6);
                        const leftCount = Math.ceil(beadCount / 2);
                        const rightCount = Math.floor(beadCount / 2);
                        const maxHeight = Math.max(leftCount, rightCount) * 7 + 10;

                        return (
                          <>
                              {/* Cord/String - V shape */}
                              <path
                              d={`M 22 5 Q 27 2, 32.5 5 L 32.5 ${maxHeight}`}
                              stroke="#4a4a4a"
                              strokeWidth="2"
                              fill="none"
                              strokeLinecap="round" />

                              <path
                              d={`M 43 5 Q 38 2, 32.5 5 L 32.5 ${maxHeight}`}
                              stroke="#4a4a4a"
                              strokeWidth="2"
                              fill="none"
                              strokeLinecap="round" />

                              
                              {/* Knot at top center */}
                              <circle cx="32.5" cy="4" r="3" fill="#3a3a3a" />
                              
                              {/* Left side beads (counting from user's perspective) */}
                              {Array.from({ length: leftCount }).map((_, i) => {
                              const y = 10 + i * 7;
                              return (
                                <g key={`left-${i}`}>
                                    {/* Wooden bead cylinder */}
                                    <rect
                                    x="19"
                                    y={y}
                                    width="9"
                                    height="6"
                                    rx="1"
                                    fill="url(#woodGradient)"
                                    stroke="#654321"
                                    strokeWidth="0.5" />

                                    {/* Top cap */}
                                    <ellipse cx="23.5" cy={y} rx="4.5" ry="1.8" fill="#8B6F47" opacity="0.7" />
                                    {/* Bottom cap */}
                                    <ellipse cx="23.5" cy={y + 6} rx="4.5" ry="1.8" fill="#5C4033" opacity="0.8" />
                                    {/* Wood grain lines */}
                                    <line x1="20" y1={y + 2} x2="27" y2={y + 2} stroke="#654321" strokeWidth="0.3" opacity="0.3" />
                                    <line x1="20" y1={y + 4} x2="27" y2={y + 4} stroke="#654321" strokeWidth="0.3" opacity="0.3" />
                                  </g>);

                            })}
                              
                              {/* Right side beads */}
                              {Array.from({ length: rightCount }).map((_, i) => {
                              const y = 10 + i * 7;
                              return (
                                <g key={`right-${i}`}>
                                    {/* Wooden bead cylinder */}
                                    <rect
                                    x="37"
                                    y={y}
                                    width="9"
                                    height="6"
                                    rx="1"
                                    fill="url(#woodGradient)"
                                    stroke="#654321"
                                    strokeWidth="0.5" />

                                    {/* Top cap */}
                                    <ellipse cx="41.5" cy={y} rx="4.5" ry="1.8" fill="#8B6F47" opacity="0.7" />
                                    {/* Bottom cap */}
                                    <ellipse cx="41.5" cy={y + 6} rx="4.5" ry="1.8" fill="#5C4033" opacity="0.8" />
                                    {/* Wood grain lines */}
                                    <line x1="38" y1={y + 2} x2="45" y2={y + 2} stroke="#654321" strokeWidth="0.3" opacity="0.3" />
                                    <line x1="38" y1={y + 4} x2="45" y2={y + 4} stroke="#654321" strokeWidth="0.3" opacity="0.3" />
                                  </g>);

                            })}
                              
                              {/* Wood grain gradient */}
                              <defs>
                                <linearGradient id="woodGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                  <stop offset="0%" style={{ stopColor: '#A0826D', stopOpacity: 1 }} />
                                  <stop offset="20%" style={{ stopColor: '#8B6F47', stopOpacity: 1 }} />
                                  <stop offset="50%" style={{ stopColor: '#C19A6B', stopOpacity: 1 }} />
                                  <stop offset="80%" style={{ stopColor: '#8B6F47', stopOpacity: 1 }} />
                                  <stop offset="100%" style={{ stopColor: '#A0826D', stopOpacity: 1 }} />
                                </linearGradient>
                              </defs>
                            </>);

                      })()}
                      </svg>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="max-w-xs">
                    <div className="space-y-1">
                      <p className="font-semibold text-sm">Wood Badge Achievement</p>
                      <p className="text-xs text-gray-500">{user.wood_badge_beads} beads</p>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            }
          </div>

          {/* Info & Actions */}
          <div className="flex-1 pt-2">
            <div className="flex flex-col md:flex-row md:items-center gap-4 mb-4">
              <div className="flex items-center gap-2">
                <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
                  {user?.full_name || 'Scout'}
                </h1>
                {user?.is_verified &&
                <BadgeCheck className="w-5 h-5 text-blue-500 fill-blue-500" />
                }
              </div>
              
              <div className="flex items-center gap-2">
                {isOwnProfile ?
                <>
                    <Link to={createPageUrl('EditProfile')}>
                      <Button variant="outline" size="sm" className="rounded-full">
                        Edit Profile
                      </Button>
                    </Link>
                    <Link to={createPageUrl('Settings')}>
                      <Button variant="ghost" size="icon" className="rounded-full">
                        <Settings className="w-5 h-5" />
                      </Button>
                    </Link>
                  </> :

                <>
                    <Button
                    onClick={onFollow}
                    className={cn(
                      "rounded-full",
                      isFollowing ?
                      "bg-gray-100 text-gray-900 hover:bg-gray-200" :
                      "bg-emerald-600 hover:bg-emerald-700"
                    )}>

                      {isFollowing ? 'Following' : 'Follow'}
                    </Button>
                    







                  </>
                }
              </div>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-6 mb-4 text-sm">
              <div className="text-center">
                <span className="font-bold text-gray-900 dark:text-white">
                  {stats?.posts || user?.posts_count || 0}
                </span>
                <span className="text-gray-500 ml-1">posts</span>
              </div>
              <button className="text-center hover:opacity-70">
                <span className="font-bold text-gray-900 dark:text-white">
                  {stats?.followers || user?.followers_count || 0}
                </span>
                <span className="text-gray-500 ml-1">followers</span>
              </button>
              <button className="text-center hover:opacity-70">
                <span className="font-bold text-gray-900 dark:text-white">
                  {stats?.following || user?.following_count || 0}
                </span>
                <span className="text-gray-500 ml-1">following</span>
              </button>
            </div>

            {/* Bio */}
            <div className="space-y-1">
              {user?.username &&
              <p className="text-sm text-gray-500">@{user.username}</p>
              }
              {user?.bio &&
              <p className="text-sm text-gray-700 dark:text-gray-300">{user.bio}</p>
              }
              <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
                {user?.location &&
                <span className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {user.location}
                  </span>
                }
                {user?.unit_name &&
                <Link
                  to={createPageUrl(`Unit?id=${user.unit_id}`)}
                  className="flex items-center gap-1 text-blue-600 hover:underline">

                    <Users className="w-4 h-4" />
                    {user.unit_name}
                  </Link>
                }
                {user?.clan_name &&
                <Link
                  to={createPageUrl(`Clan?id=${user.clan_id}`)}
                  className="flex items-center gap-1 text-purple-600 hover:underline">

                    <Users className="w-4 h-4" />
                    {user.clan_name}
                  </Link>
                }
                {user?.scout_rank &&
                <span className="flex items-center gap-1 text-amber-600 capitalize">
                    <Award className="w-4 h-4" />
                    {user.scout_rank}
                  </span>
                }
              </div>
            </div>



            {/* Badges Preview */}
            {user?.badges_count > 0 &&
            <Link
              to={createPageUrl(`Badges?user=${user.id}`)}
              className="inline-flex items-center gap-2 mt-3 px-3 py-1.5 bg-amber-50 dark:bg-amber-900/20 rounded-full text-amber-700 dark:text-amber-400 text-sm hover:bg-amber-100 transition-colors">

                <Award className="w-4 h-4" />
                {user.badges_count} badges earned
              </Link>
            }
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center border-t border-gray-100 dark:border-gray-800 mt-4">
          {tabs.map((tab) => {
            if (tab.ownOnly && !isOwnProfile) return null;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-4 border-t-2 -mt-px transition-colors",
                  activeTab === tab.id ?
                  "border-emerald-600 text-emerald-600" :
                  "border-transparent text-gray-500 hover:text-gray-700"
                )}>

                <Icon className="w-5 h-5" />
                <span className="hidden md:inline text-sm font-medium">{tab.label}</span>
              </button>);

          })}
        </div>
      </div>
    </div>);

}
