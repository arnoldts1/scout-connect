import React from 'react';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Clock, AlertTriangle } from 'lucide-react';

export function getCurrentPhase() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth(); // 0-indexed
  const phaseNumber = month < 6 ? 1 : 2;
  const phaseLabel = phaseNumber === 1 ? 'Phase I' : 'Phase II';
  return {
    year,
    phaseNumber,
    phase: `${year} ${phaseLabel}`,
  };
}

export function getSubscriptionStatus(subscription) {
  if (!subscription) return 'expired';
  return subscription.status || 'expired';
}

export default function SubscriptionStatusBadge({ subscription }) {
  const status = getSubscriptionStatus(subscription);

  if (status === 'active') {
    return (
      <Badge className="bg-emerald-100 text-emerald-700 border border-emerald-200 flex items-center gap-1">
        <CheckCircle className="w-3 h-3" />
        Active (Paid)
      </Badge>
    );
  }
  if (status === 'pending') {
    return (
      <Badge className="bg-amber-100 text-amber-700 border border-amber-200 flex items-center gap-1">
        <Clock className="w-3 h-3" />
        Pending
      </Badge>
    );
  }
  return (
    <Badge className="bg-red-100 text-red-700 border border-red-200 flex items-center gap-1">
      <AlertTriangle className="w-3 h-3" />
      Expired
    </Badge>
  );
}