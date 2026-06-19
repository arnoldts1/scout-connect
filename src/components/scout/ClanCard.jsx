import React from 'react';
import { Link } from 'react-router-dom';
import { Users, MapPin, Award, ArrowRight } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { createPageUrl } from '@/utils';
import { cn } from '@/lib/utils';

export default function ClanCard({ clan, onJoin, isMember }) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden hover:shadow-lg transition-all duration-300">
      {/* Cover */}
      <div className="relative h-24 bg-gradient-to-br from-emerald-500 to-teal-600">
        {clan.cover_image &&
        <img
          src={clan.cover_image}
          alt={clan.name}
          className="w-full h-full object-cover" />

        }
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
      </div>

      {/* Avatar */}
      <div className="relative px-4 -mt-10">
        <Avatar className="w-20 h-20 ring-4 ring-white dark:ring-gray-900 shadow-lg">
          <AvatarImage src={clan.avatar} />
          <AvatarFallback className="text-2xl bg-emerald-100 text-emerald-700">
            {clan.name?.charAt(0) || 'C'}
          </AvatarFallback>
        </Avatar>
      </div>

      {/* Content */}
      <div className="p-4 pt-2">
        <div className="flex items-start justify-between mb-2">
          <div>
            <h3 className="font-semibold text-lg text-gray-900 dark:text-white">
              {clan.name}
            </h3>
            {clan.location &&
            <p className="text-sm text-gray-500 flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {clan.location}
              </p>
            }
          </div>
          {clan.status === 'active' &&
          <Badge className="bg-emerald-100 text-emerald-700">Active</Badge>
          }
        </div>

        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-4">
          {clan.description || 'A proud scouting clan committed to excellence.'}
        </p>

        {/* Stats */}
        <div className="flex items-center gap-4 mb-4 text-sm">
          <div className="flex items-center gap-1 text-gray-600 dark:text-gray-300">
            <Users className="w-4 h-4 text-gray-400" />
            <span>{clan.member_count || 0} members</span>
          </div>
          {clan.points > 0 &&
          <div className="flex items-center gap-1 text-emerald-600">
              <span className="font-medium">{clan.points} pts</span>
            </div>
          }
          {clan.achievements?.length > 0 &&
          <div className="flex items-center gap-1 text-amber-600">
              <Award className="w-4 h-4" />
              <span>{clan.achievements.length}</span>
            </div>
          }
        </div>

        {/* Leaders Preview */}
        {clan.leaders?.length > 0 &&
        <div className="flex items-center gap-2 mb-4">
            <span className="text-xs text-gray-500">Leaders:</span>
            <div className="flex -space-x-2">
              {clan.leaders.slice(0, 3).map((leader, idx) =>
            <Avatar key={idx} className="w-6 h-6 ring-2 ring-white dark:ring-gray-900">
                  <AvatarFallback className="text-[10px] bg-emerald-100 text-emerald-700">
                    L
                  </AvatarFallback>
                </Avatar>
            )}
            </div>
          </div>
        }

        {/* Actions */}
        <div className="flex items-center gap-2">
          










          <Link to={createPageUrl(`Clan?id=${clan.id}`)}>
            <Button variant="outline" size="icon" className="rounded-full">
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </div>
    </div>);

}