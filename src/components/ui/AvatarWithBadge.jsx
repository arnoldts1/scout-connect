import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function AvatarWithBadge({ 
  user, 
  src, 
  fallbackText,
  size = 'default',
  className,
  showBadge = true,
  ...props 
}) {
  const isOrgLeader = user?.is_org_leader;
  
  const sizeClasses = {
    sm: 'w-8 h-8',
    default: 'w-10 h-10',
    md: 'w-12 h-12',
    lg: 'w-14 h-14',
    xl: 'w-20 h-20'
  };

  const badgeSizes = {
    sm: 'w-4 h-4',
    default: 'w-5 h-5',
    md: 'w-6 h-6',
    lg: 'w-7 h-7',
    xl: 'w-8 h-8'
  };

  const iconSizes = {
    sm: 'w-2 h-2',
    default: 'w-2.5 h-2.5',
    md: 'w-3 h-3',
    lg: 'w-3.5 h-3.5',
    xl: 'w-4 h-4'
  };

  return (
    <div className="relative inline-block">
      <Avatar className={cn(sizeClasses[size], className)} {...props}>
        <AvatarImage src={src || user?.avatar} />
        <AvatarFallback className="bg-emerald-100 text-emerald-700">
          {fallbackText || user?.full_name?.charAt(0) || 'S'}
        </AvatarFallback>
      </Avatar>
      
      {showBadge && isOrgLeader && user?.org_leader_role && (
        <TooltipProvider>
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <div className={cn(
                "absolute bottom-0 left-0 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-full flex items-center justify-center shadow-lg ring-2 ring-white dark:ring-gray-900 cursor-pointer hover:scale-110 transition-transform",
                badgeSizes[size]
              )}>
                <Star className={cn("text-white fill-white", iconSizes[size])} />
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
      )}
    </div>
  );
}