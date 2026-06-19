import React from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

/**
 * Renders the Google Material Symbols "verified" badge in blue.
 * Shows a tooltip explaining the verification type.
 */
export default function VerifiedBadge({ user, size = 20 }) {
  if (!user?.is_verified && user?.role !== 'admin' && !user?.is_org_leader) return null;

  const label = user?.role === 'admin'
    ? 'Verified Admin'
    : user?.is_org_leader
    ? `Verified Leader${user?.org_leader_role ? ` — ${user.org_leader_role}` : ''}`
    : 'Verified Account';

  return (
    <TooltipProvider>
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>
          <span
            className="material-symbols-outlined select-none cursor-default"
            style={{ fontSize: size, color: '#1d9bf0', verticalAlign: 'middle', lineHeight: 1 }}
          >
            verified
          </span>
        </TooltipTrigger>
        <TooltipContent side="top">
          <p className="text-xs">{label}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}