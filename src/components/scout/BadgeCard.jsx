import React from 'react';
import { Award, Star, Lock, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';

const LEVEL_COLORS = {
  bronze: 'from-amber-600 to-amber-800',
  silver: 'from-gray-300 to-gray-500',
  gold: 'from-yellow-400 to-amber-500',
  platinum: 'from-slate-200 via-slate-300 to-slate-400',
};

const CATEGORY_ICONS = {
  outdoor: '🏕️',
  service: '🤝',
  skills: '🛠️',
  leadership: '👑',
  special: '⭐',
  achievement: '🏆',
};

export default function BadgeCard({ 
  badge, 
  userBadge,
  size = 'md',
  showProgress = true,
  onClick 
}) {
  const isEarned = userBadge?.status === 'earned';
  const isPending = userBadge?.status === 'pending_approval';
  const progress = userBadge?.progress || 0;

  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24',
    lg: 'w-32 h-32',
  };

  return (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-2 p-3 rounded-xl transition-all",
        "hover:bg-gray-50 dark:hover:bg-gray-800/50",
        onClick && "cursor-pointer"
      )}
    >
      {/* Badge Icon */}
      <div className={cn(
        "relative rounded-full flex items-center justify-center",
        sizeClasses[size],
        isEarned 
          ? `bg-gradient-to-br ${LEVEL_COLORS[badge.level] || LEVEL_COLORS.bronze}` 
          : "bg-gray-200 dark:bg-gray-700"
      )}>
        {badge.icon ? (
          <span className={cn(
            "text-2xl",
            size === 'lg' && "text-4xl",
            size === 'sm' && "text-lg",
            !isEarned && "opacity-50 grayscale"
          )}>
            {badge.icon}
          </span>
        ) : (
          <span className={cn(
            "text-2xl",
            size === 'lg' && "text-4xl",
            size === 'sm' && "text-lg",
            !isEarned && "opacity-50"
          )}>
            {CATEGORY_ICONS[badge.category] || '🏅'}
          </span>
        )}

        {/* Status Indicator */}
        {isEarned && (
          <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg">
            <CheckCircle className="w-4 h-4 text-white" />
          </div>
        )}
        {isPending && (
          <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center shadow-lg animate-pulse">
            <Star className="w-4 h-4 text-white" />
          </div>
        )}
        {!isEarned && !isPending && progress === 0 && (
          <div className="absolute inset-0 bg-black/30 rounded-full flex items-center justify-center">
            <Lock className="w-6 h-6 text-white/70" />
          </div>
        )}
      </div>

      {/* Badge Info */}
      <div className="text-center">
        <p className={cn(
          "font-medium text-sm",
          isEarned ? "text-gray-900 dark:text-white" : "text-gray-500"
        )}>
          {badge.name}
        </p>
        <p className="text-xs text-gray-400 capitalize">{badge.level}</p>
      </div>

      {/* Progress Bar */}
      {showProgress && !isEarned && progress > 0 && (
        <div className="w-full max-w-[100px]">
          <Progress value={progress} className="h-1.5" />
          <p className="text-[10px] text-gray-400 text-center mt-1">{progress}%</p>
        </div>
      )}
    </button>
  );
}