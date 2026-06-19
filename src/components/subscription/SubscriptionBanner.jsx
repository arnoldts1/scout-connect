import React from 'react';
import { AlertTriangle, XCircle } from 'lucide-react';
import { getCurrentPhase } from './SubscriptionStatusBadge';

// Returns how many months overdue the subscription is (0 = current phase, paid)
function monthsOverdue(subscription) {
  if (!subscription || subscription.status === 'active') return 0;
  const now = new Date();
  const phase = getCurrentPhase();
  // Phase start: Jan 1 for Phase I, Jul 1 for Phase II
  const phaseStart = new Date(phase.year, phase.phaseNumber === 1 ? 0 : 6, 1);
  const diffMs = now - phaseStart;
  const diffMonths = diffMs / (1000 * 60 * 60 * 24 * 30);
  return Math.floor(diffMonths);
}

export default function SubscriptionBanner({ subscription, groupType }) {
  const overdue = monthsOverdue(subscription);
  if (subscription?.status === 'active') return null;

  const phase = getCurrentPhase();
  const isRestricted = overdue >= 2;

  if (isRestricted) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 flex items-start gap-3">
        <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-red-700 dark:text-red-400 text-sm">Subscription Expired — Restricted</p>
          <p className="text-xs text-red-600 dark:text-red-500 mt-1">
            This {groupType} has not paid the ScoutConnect subscription for {phase.phase}.
            Work activity posts and announcements are disabled until payment is made.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 flex items-start gap-3">
      <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
      <div>
        <p className="font-semibold text-amber-700 dark:text-amber-400 text-sm">Subscription Reminder</p>
        <p className="text-xs text-amber-600 dark:text-amber-500 mt-1">
          Your {groupType} has not paid the ScoutConnect subscription for {phase.phase}.
          Please remind your leaders to complete the payment.
        </p>
      </div>
    </div>
  );
}