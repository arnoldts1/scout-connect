import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { CheckCircle, Clock, AlertTriangle, DollarSign, Users, TrendingUp, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { getCurrentPhase } from '@/components/subscription/SubscriptionStatusBadge';
import SubscriptionReceiptModal from '@/components/subscription/SubscriptionReceiptModal';

export default function SubscriptionAdmin() {
  const queryClient = useQueryClient();
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const currentPhase = getCurrentPhase();
  const [subscriptionsWithNames, setSubscriptionsWithNames] = useState([]);

  const { data: subscriptions = [] } = useQuery({
    queryKey: ['all-subscriptions'],
    queryFn: () => base44.entities.Subscription.list('-created_date', 200),
  });

  React.useEffect(() => {
    async function enrichSubscriptions() {
      const enriched = await Promise.all(
        subscriptions.map(async (sub) => {
          try {
            const group = await base44.entities[sub.group_type === 'unit' ? 'Unit' : 'Clan'].get(sub.group_id);
            return { ...sub, group_name: group?.name || 'Unknown' };
          } catch {
            return { ...sub, group_name: 'Unknown' };
          }
        })
      );
      setSubscriptionsWithNames(enriched);
    }
    if (subscriptions.length > 0) {
      enrichSubscriptions();
    }
  }, [subscriptions]);

  const currentPhaseSubscriptions = subscriptionsWithNames.filter(s => s.phase === currentPhase.phase);
  const paid = currentPhaseSubscriptions.filter(s => s.status === 'active');
  const pending = currentPhaseSubscriptions.filter(s => s.status === 'pending');
  const expired = currentPhaseSubscriptions.filter(s => s.status === 'expired' || (!s.status && s.status !== 'active'));
  const totalRevenue = paid.reduce((sum, s) => sum + (s.amount || 0), 0);

  const handleVerify = async (sub) => {
    try {
      const user = await base44.auth.me();
      await base44.entities.Subscription.update(sub.id, {
        status: 'active',
        paid_at: new Date().toISOString(),
        verified_by: user.full_name,
        verified_at: new Date().toISOString(),
      });

      toast.success(`${sub.group_name} subscription verified`);
      queryClient.invalidateQueries(['all-subscriptions']);
    } catch (error) {
      console.error('Verify error:', error);
      toast.error(`Failed to verify: ${error?.message || 'Unknown error'}`);
    }
  };

  const handleReject = async (sub) => {
    await base44.entities.Subscription.update(sub.id, { status: 'expired' });
    toast.info(`${sub.group_name} subscription rejected`);
    queryClient.invalidateQueries(['all-subscriptions']);
  };

  const SubCard = ({ sub, actions }) => (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-gray-900 dark:text-white truncate">{sub.group_name}</span>
            <Badge variant="outline" className="text-xs">{sub.group_type}</Badge>
          </div>
          <p className="text-xs text-gray-500 mb-2">{sub.phase} · {sub.amount?.toLocaleString()} FRW · {sub.payment_method?.replace('_', ' ')}</p>
          <p className="text-xs text-gray-400">By: {sub.paid_by_name} · {sub.created_date ? format(new Date(sub.created_date), 'dd MMM yyyy') : '—'}</p>
          {sub.transaction_id && (
            <p className="text-xs font-mono text-gray-400 mt-1">Txn: {sub.transaction_id}</p>
          )}
        </div>
        <div className="flex flex-col gap-2 items-end flex-shrink-0">
          {sub.status === 'active' && (
            <Button size="sm" variant="outline" onClick={() => setSelectedReceipt(sub)}>
              <Eye className="w-3 h-3 mr-1" />
              Receipt
            </Button>
          )}
          {actions && (
            <div className="flex gap-2">
              <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={() => handleVerify(sub)}>
                <CheckCircle className="w-3 h-3 mr-1" />
                Verify
              </Button>
              <Button size="sm" variant="destructive" onClick={() => handleReject(sub)}>
                Reject
              </Button>
            </div>
          )}
        </div>
      </div>
      {sub.payment_proof_url && (
        <a href={sub.payment_proof_url} target="_blank" rel="noreferrer" className="text-xs text-blue-500 hover:underline mt-2 inline-block">
          View Payment Proof
        </a>
      )}
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 flex items-center justify-center">
          <DollarSign className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Subscription Admin</h1>
          <p className="text-sm text-gray-500">Current phase: <span className="font-medium text-emerald-600">{currentPhase.phase}</span></p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-4 text-center">
          <CheckCircle className="w-6 h-6 text-emerald-600 mx-auto mb-1" />
          <p className="text-2xl font-bold text-emerald-700">{paid.length}</p>
          <p className="text-xs text-gray-500">Paid</p>
        </div>
        <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4 text-center">
          <Clock className="w-6 h-6 text-amber-600 mx-auto mb-1" />
          <p className="text-2xl font-bold text-amber-700">{pending.length}</p>
          <p className="text-xs text-gray-500">Pending</p>
        </div>
        <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4 text-center">
          <AlertTriangle className="w-6 h-6 text-red-600 mx-auto mb-1" />
          <p className="text-2xl font-bold text-red-700">{expired.length}</p>
          <p className="text-xs text-gray-500">Expired</p>
        </div>
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 text-center">
          <TrendingUp className="w-6 h-6 text-blue-600 mx-auto mb-1" />
          <p className="text-2xl font-bold text-blue-700">{totalRevenue.toLocaleString()}</p>
          <p className="text-xs text-gray-500">FRW Collected</p>
        </div>
      </div>

      <Tabs defaultValue="pending">
        <TabsList className="mb-4">
          <TabsTrigger value="pending">Pending ({pending.length})</TabsTrigger>
          <TabsTrigger value="paid">Paid ({paid.length})</TabsTrigger>
          <TabsTrigger value="expired">Expired ({expired.length})</TabsTrigger>
          <TabsTrigger value="all">All Time</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-3">
          {pending.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <Clock className="w-12 h-12 mx-auto mb-2 opacity-30" />
              <p>No pending payments</p>
            </div>
          ) : (
            pending.map(sub => <SubCard key={sub.id} sub={sub} actions />)
          )}
        </TabsContent>

        <TabsContent value="paid" className="space-y-3">
          {paid.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <CheckCircle className="w-12 h-12 mx-auto mb-2 opacity-30" />
              <p>No paid subscriptions yet</p>
            </div>
          ) : (
            paid.map(sub => <SubCard key={sub.id} sub={sub} />)
          )}
        </TabsContent>

        <TabsContent value="expired" className="space-y-3">
          {expired.length === 0 ? (
            <div className="text-center py-12 text-gray-400">No expired subscriptions</div>
          ) : (
            expired.map(sub => <SubCard key={sub.id} sub={sub} />)
          )}
        </TabsContent>

        <TabsContent value="all" className="space-y-3">
          {subscriptionsWithNames.map(sub => <SubCard key={sub.id} sub={sub} />)}
        </TabsContent>
      </Tabs>

      <SubscriptionReceiptModal
        subscription={selectedReceipt}
        open={!!selectedReceipt}
        onClose={() => setSelectedReceipt(null)}
      />
    </div>
  );
}
