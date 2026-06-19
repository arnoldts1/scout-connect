import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, MapPin, Users, Clock, ArrowRight } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { createPageUrl } from '@/utils';
import { cn } from '@/lib/utils';
import moment from 'moment';

const EVENT_TYPE_COLORS = {
  camping: 'bg-emerald-100 text-emerald-700',
  hike: 'bg-blue-100 text-blue-700',
  service: 'bg-purple-100 text-purple-700',
  training: 'bg-amber-100 text-amber-700',
  ceremony: 'bg-pink-100 text-pink-700',
  meeting: 'bg-gray-100 text-gray-700',
  other: 'bg-gray-100 text-gray-700',
};

export default function EventCard({ event, onJoin, isJoined }) {
  const startDate = moment(event.start_date);
  const endDate = event.end_date ? moment(event.end_date) : null;
  const isUpcoming = startDate.isAfter(moment());
  const isOngoing = startDate.isBefore(moment()) && (!endDate || endDate.isAfter(moment()));

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden hover:shadow-lg transition-all duration-300">
      {/* Cover Image */}
      <div className="relative h-40 bg-gradient-to-br from-emerald-400 to-teal-500">
        {event.cover_image && (
          <img 
            src={event.cover_image} 
            alt={event.title} 
            className="w-full h-full object-cover"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        
        {/* Date Badge */}
        <div className="absolute top-3 left-3 bg-white dark:bg-gray-900 rounded-xl p-2 text-center shadow-lg min-w-[60px]">
          <p className="text-xs text-emerald-600 font-medium uppercase">
            {startDate.format('MMM')}
          </p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {startDate.format('D')}
          </p>
        </div>

        {/* Status Badge */}
        {isOngoing && (
          <Badge className="absolute top-3 right-3 bg-emerald-500 text-white animate-pulse">
            Live Now
          </Badge>
        )}

        {/* Event Type */}
        <Badge className={cn(
          "absolute bottom-3 left-3",
          EVENT_TYPE_COLORS[event.event_type] || EVENT_TYPE_COLORS.other
        )}>
          {event.event_type?.replace('_', ' ')}
        </Badge>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-2 line-clamp-1">
          {event.title}
        </h3>
        
        <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-3">
          {event.description}
        </p>

        {/* Meta Info */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
            <Clock className="w-4 h-4 text-gray-400" />
            <span>{startDate.format('ddd, MMM D • h:mm A')}</span>
          </div>
          
          {event.location && (
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
              <MapPin className="w-4 h-4 text-gray-400" />
              <span className="truncate">{event.location}</span>
            </div>
          )}

          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
            <Users className="w-4 h-4 text-gray-400" />
            <span>
              {event.participant_count || 0}
              {event.max_participants && ` / ${event.max_participants}`} going
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-800">
          {/* Organizer */}
          <div className="flex items-center gap-2">
            <Avatar className="w-8 h-8">
              <AvatarFallback className="text-xs bg-emerald-100 text-emerald-700">
                {event.organizer_name?.charAt(0) || 'S'}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm text-gray-500">{event.organizer_name}</span>
          </div>

          <div className="flex items-center gap-2">
            {isUpcoming && (
              <Button 
                size="sm"
                onClick={() => onJoin?.(event)}
                className={cn(
                  "rounded-full",
                  isJoined 
                    ? "bg-gray-100 text-gray-700 hover:bg-gray-200" 
                    : "bg-emerald-600 hover:bg-emerald-700"
                )}
              >
                {isJoined ? 'Joined' : 'Join'}
              </Button>
            )}
            <Link to={createPageUrl(`Event?id=${event.id}`)}>
              <Button variant="ghost" size="icon" className="rounded-full">
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}