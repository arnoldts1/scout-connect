import React from 'react';
import { Link } from 'react-router-dom';
import { Users, MapPin, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { createPageUrl } from '@/utils';

export default function UnitCard({ unit }) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden hover:shadow-lg transition-all duration-300">
      {/* Cover */}
      <div className="h-24 bg-gradient-to-r from-blue-400 to-blue-600 relative">
        {unit.cover_image && (
          <img 
            src={unit.cover_image} 
            alt={unit.name}
            className="w-full h-full object-cover"
          />
        )}
        <div className="absolute -bottom-8 left-4">
          {unit.avatar ? (
            <img 
              src={unit.avatar} 
              alt={unit.name}
              className="w-16 h-16 rounded-xl object-cover ring-4 ring-white dark:ring-gray-900 shadow-lg"
            />
          ) : (
            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-2xl font-bold ring-4 ring-white dark:ring-gray-900 shadow-lg">
              {unit.name?.charAt(0) || 'U'}
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="pt-10 px-4 pb-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-semibold text-lg text-gray-900 dark:text-white">
            {unit.name}
          </h3>
          <Badge className="bg-blue-100 text-blue-700 text-xs">
            Unit
          </Badge>
        </div>
        
        {unit.description && (
          <p className="text-sm text-gray-500 line-clamp-2 mb-3">
            {unit.description}
          </p>
        )}

        <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
          <span className="flex items-center gap-1">
            <Users className="w-4 h-4" />
            {unit.member_count || 0} members
          </span>
          {unit.location && (
            <span className="flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              {unit.location}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 text-sm text-emerald-600 mb-4">
          <TrendingUp className="w-4 h-4" />
          <span className="font-medium">{unit.points || 0} points</span>
        </div>

        <Button 
          className="w-full rounded-xl bg-blue-600 hover:bg-blue-700"
          asChild
        >
          <Link to={createPageUrl(`Unit?id=${unit.id}`)}>
            View Unit
          </Link>
        </Button>
      </div>
    </div>
  );
}