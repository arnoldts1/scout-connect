import React from 'react';
import { Award } from 'lucide-react';
import { cn } from '@/lib/utils';

const BADGE_COLORS = {
  bronze: 'from-amber-600 to-amber-800',
  silver: 'from-gray-300 to-gray-500',
  gold: 'from-yellow-400 to-yellow-600',
  platinum: 'from-cyan-300 to-cyan-500',
};

export default function BadgeBelt({ badges = [], maxDisplay = 12 }) {
  const displayBadges = badges.slice(0, maxDisplay);
  const remainingCount = Math.max(0, badges.length - maxDisplay);
  const hasBadges = badges && badges.length > 0;

  return (
    <div className="bg-gradient-to-r from-amber-900 via-amber-800 to-amber-900 rounded-xl p-4 shadow-lg">
      {/* Belt Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Award className="w-5 h-5 text-amber-300" />
          <h3 className="font-semibold text-amber-100">Badge Belt</h3>
        </div>
        <span className="text-xs text-amber-300/70">
          {hasBadges ? `${badges.length} badges earned` : 'No badges yet'}
        </span>
      </div>

      {/* Belt Strap */}
      <div className="relative">
        {/* Stitching lines */}
        <div className="absolute top-0 left-0 right-0 h-1 border-t border-dashed border-amber-700/50" />
        <div className="absolute bottom-0 left-0 right-0 h-1 border-b border-dashed border-amber-700/50" />
        
        {/* Badge Row */}
        <div className="flex flex-wrap gap-2 py-3 justify-center">
          {hasBadges ? (
            <>
              {displayBadges.map((badge, index) => (
                <div
                  key={badge.id || index}
                  className="relative group"
                >
                  {/* Badge Container */}
                  <div
                    className={cn(
                      "w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center",
                      "bg-gradient-to-br shadow-md border-2 border-amber-600/30",
                      "transform transition-all duration-200 hover:scale-110 hover:-translate-y-1",
                      "cursor-pointer",
                      BADGE_COLORS[badge.badge_level || badge.level || 'bronze']
                    )}
                  >
                    {badge.badge_icon ? (
                      <img 
                        src={badge.badge_icon} 
                        alt={badge.badge_name}
                        className="w-8 h-8 md:w-10 md:h-10 object-contain"
                      />
                    ) : (
                      <Award className="w-6 h-6 md:w-7 md:h-7 text-white drop-shadow" />
                    )}
                  </div>

                  {/* Badge Pin/Rivet */}
                  <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-amber-400 shadow-inner" />

                  {/* Tooltip */}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                    {badge.badge_name || 'Badge'}
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
                  </div>
                </div>
              ))}

              {/* Show remaining count */}
              {remainingCount > 0 && (
                <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-amber-950/50 border-2 border-dashed border-amber-600/50 flex items-center justify-center">
                  <span className="text-amber-300 text-sm font-medium">+{remainingCount}</span>
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center py-4 text-amber-300/60">
              <Award className="w-10 h-10 mb-2 opacity-50" />
              <p className="text-sm">Start earning badges through training and activities!</p>
            </div>
          )}
        </div>
      </div>

      {/* Belt Buckle Decorations */}
      <div className="flex justify-center gap-4 mt-2">
        <div className="w-8 h-1 bg-amber-600/50 rounded-full" />
        <div className="w-8 h-1 bg-amber-600/50 rounded-full" />
        <div className="w-8 h-1 bg-amber-600/50 rounded-full" />
      </div>
    </div>
  );
}