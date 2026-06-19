import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CheckCircle, Download, X } from 'lucide-react';
import { format } from 'date-fns';
import { base44 } from '@/api/base44Client';

export default function SubscriptionReceiptModal({ subscription, open, onClose }) {
  const [groupName, setGroupName] = useState('');

  useEffect(() => {
    async function fetchGroupName() {
      if (!subscription?.group_id || !subscription?.group_type) return;
      try {
        const group = await base44.entities[subscription.group_type === 'unit' ? 'Unit' : 'Clan'].get(subscription.group_id);
        setGroupName(group?.name || 'Unknown');
      } catch {
        setGroupName('Unknown');
      }
    }
    if (open && subscription) {
      fetchGroupName();
    }
  }, [subscription, open]);

  if (!subscription) return null;

  const handlePrint = () => window.print();

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Payment Receipt</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex flex-col items-center py-4">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-3">
              <CheckCircle className="w-8 h-8 text-emerald-600" />
            </div>
            <p className="text-lg font-bold text-emerald-700">Payment Verified</p>
            <p className="text-sm text-gray-500">ScoutConnect Subscription</p>
          </div>

          <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Group</span>
              <span className="font-medium">{groupName || 'Loading...'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Phase</span>
              <span className="font-medium">{subscription.phase}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Amount</span>
              <span className="font-bold text-emerald-700">{subscription.amount?.toLocaleString()} FRW</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Payment Date</span>
              <span className="font-medium">
                {subscription.paid_at ? format(new Date(subscription.paid_at), 'dd MMM yyyy') : '—'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Transaction ID</span>
              <span className="font-mono text-xs">{subscription.transaction_id || '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Status</span>
              <span className="font-medium text-emerald-600">Paid ✓</span>
            </div>
          </div>

          <Button onClick={onClose} className="w-full" variant="outline">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
