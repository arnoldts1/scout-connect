import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import {
  CreditCard, Plus, CheckCircle, Clock, XCircle,
  Download, TrendingUp, Receipt, Shield, Users, Zap } from 'lucide-react';
import SubscriptionPaymentForm from '@/components/subscription/SubscriptionPaymentForm';
import { toast } from 'sonner';
import moment from 'moment';

import { useNavigate, Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import SubmitPaymentForm from '@/components/revenue/SubmitPaymentForm';
import AdminPaymentReview from '@/components/revenue/AdminPaymentReview';
import FinancialDashboard from '@/components/revenue/FinancialDashboard';
import PaymentReceiptModal from '@/components/revenue/PaymentReceiptModal';

const STATUS_BADGE = {
  pending: 'bg-amber-100 text-amber-700 border-amber-200',
  verified: 'bg-green-100 text-green-700 border-green-200',
  rejected: 'bg-red-100 text-red-700 border-red-200'
};

const STATUS_ICON = {
  pending: <Clock className="w-4 h-4 text-amber-500" />,
  verified: <CheckCircle className="w-4 h-4 text-green-500" />,
  rejected: <XCircle className="w-4 h-4 text-red-500" />
};

const PAYMENT_METHODS = {
  mobile_money: 'Mobile Money',
  bank_transfer: 'Bank Transfer',
  cash: 'Cash'
};

export default function RevenueTracker() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLeader, setIsLeader] = useState(false);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [viewingReceipt, setViewingReceipt] = useState(null);
  const [activeTab, setActiveTab] = useState('my-payments');

  useEffect(() => {
    const init = async () => {
      try {
        const u = await base44.auth.me();
        setUser(u);
        if (u?.role === 'admin' || u?.role === 'leader') {
          setIsAdmin(true);
          setActiveTab('review');
        }
      } catch (error) {
        console.error('Failed to load user:', error);
        // Continue gracefully
      }
    };
    init();
  }, []);

  const { data: myUnit } = useQuery({
    queryKey: ['my-unit', user?.id],
    queryFn: async () => {
      const units = await base44.entities.Unit.filter({ admin_id: user.id });
      if (units[0]) { setIsLeader(true); return { ...units[0], type: 'unit' }; }
      // Check if member
      const allUnits = await base44.entities.Unit.list();
      const memberUnit = allUnits.find(u => u.members?.includes(user.id));
      return memberUnit ? { ...memberUnit, type: 'unit' } : null;
    },
    enabled: !!user
  });

  const { data: myClan } = useQuery({
    queryKey: ['my-clan', user?.id],
    queryFn: async () => {
      const clans = await base44.entities.Clan.filter({ admin_id: user.id });
      if (clans[0]) { setIsLeader(true); return { ...clans[0], type: 'clan' }; }
      const allClans = await base44.entities.Clan.list();
      const memberClan = allClans.find(c => c.members?.includes(user.id));
      return memberClan ? { ...memberClan, type: 'clan' } : null;
    },
    enabled: !!user
  });

  const myGroup = myUnit || myClan;

  const { data: groupSubscriptions = [], refetch: refetchSubs } = useQuery({
    queryKey: ['group-subscriptions', myGroup?.id],
    queryFn: () => base44.entities.Subscription.filter({ group_id: myGroup.id }, '-created_date', 10),
    enabled: !!myGroup?.id
  });

  const { data: allPayments = [] } = useQuery({
    queryKey: ['revenue-payments'],
    queryFn: () => base44.entities.RevenuePayment.list('-created_date', 500),
    enabled: !!user
  });

  const myPayments = allPayments.filter((p) => p.submitter_id === user?.id || p.submitter_email === user?.email);
  const pendingPayments = allPayments.filter((p) => p.status === 'pending');
  const latestSub = groupSubscriptions[0];
  const subStatusColor = latestSub?.status === 'active' ? 'text-emerald-600 bg-emerald-50 border-emerald-200'
    : latestSub?.status === 'pending' ? 'text-amber-600 bg-amber-50 border-amber-200'
    : 'text-red-600 bg-red-50 border-red-200';

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
            <CreditCard className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">RSA Revenue Tracker</h1>
            <p className="text-sm text-gray-500">Yearly Revenue Payment System</p>
          </div>
        </div>

        {/* Stats strip */}
        <div className="hidden md:flex items-center gap-3">
          {isAdmin &&
          <>
            <div className="flex items-center gap-1.5 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-full px-3 py-1.5">
              <Clock className="w-4 h-4 text-amber-500" />
              <span className="text-sm font-semibold text-amber-700 dark:text-amber-400">{pendingPayments.length} Pending</span>
            </div>
            <Button
              variant="outline"
              onClick={() => navigate(createPageUrl('ScoutCardGenerator'))}
              className="border-blue-300 text-blue-700 hover:bg-blue-50"
            >
              <CreditCard className="w-4 h-4 mr-2" />
              Generate Cards
            </Button>
          </>
          }
          <Link to="/PaymentGateway">
            <Button className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 shadow-md">
              <Zap className="w-4 h-4 mr-2" />
              Pay Now
            </Button>
          </Link>
          <Dialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" className="border-emerald-300 text-emerald-700 hover:bg-emerald-50">
                <Plus className="w-4 h-4 mr-2" />
                Manual Submit
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Submit Yearly Revenue Payment</DialogTitle>
              </DialogHeader>
              <SubmitPaymentForm
                user={user}
                onSuccess={() => {
                  setShowSubmitDialog(false);
                  queryClient.invalidateQueries(['revenue-payments']);
                  toast.success('Payment submitted!');
                }} />

            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Mobile submit button */}
      <div className="md:hidden mb-4 flex gap-2">
        <Link to="/PaymentGateway" className="flex-1">
          <Button className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600">
            <Zap className="w-4 h-4 mr-2" />Pay Now
          </Button>
        </Link>
        <Dialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
          <DialogTrigger asChild>
            <Button variant="outline" className="border-emerald-300 text-emerald-700">
              <Plus className="w-4 h-4" />
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle className="text-lg font-semibold leading-none tracking-tight">Uburyo Kwishyura umusanzu</DialogTitle></DialogHeader>
            <SubmitPaymentForm
              user={user}
              onSuccess={() => {
                setShowSubmitDialog(false);
                queryClient.invalidateQueries(['revenue-payments']);
              }} />

          </DialogContent>
        </Dialog>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className={`w-full grid ${isAdmin ? 'grid-cols-4' : 'grid-cols-2'} mb-6 overflow-x-auto`}>
          <TabsTrigger value="my-payments" className="gap-1.5">
            <Receipt className="w-4 h-4" />
            My Payments
          </TabsTrigger>
          <TabsTrigger value="subscription" className="gap-1.5">
            <Users className="w-4 h-4" />
            Subscription
          </TabsTrigger>
          {isAdmin &&
          <>
              <TabsTrigger value="review" className="gap-1.5">
                <Shield className="w-4 h-4" />
                Review
                {pendingPayments.length > 0 &&
              <Badge className="bg-amber-500 text-white text-[10px] ml-1 h-4 px-1.5">{pendingPayments.length}</Badge>
              }
              </TabsTrigger>
              <TabsTrigger value="dashboard" className="gap-1.5">
                <TrendingUp className="w-4 h-4" />
                Dashboard
              </TabsTrigger>
            </>
          }
        </TabsList>

        {/* Group Subscription Tab */}
        <TabsContent value="subscription">
          {!myGroup ? (
            <div className="text-center py-20">
              <Users className="w-16 h-16 mx-auto text-gray-200 dark:text-gray-700 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No Unit or Clan Found</h3>
              <p className="text-gray-500">You are not yet a member of any unit or clan.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Group Info */}
              <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-5">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wide">{myGroup.type === 'unit' ? 'Unit' : 'Clan'}</p>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">{myGroup.name}</h2>
                    {latestSub ? (
                      <div className={`inline-flex items-center gap-1.5 mt-2 px-3 py-1 rounded-full text-sm font-semibold border ${subStatusColor}`}>
                        {latestSub.status === 'active' ? <CheckCircle className="w-4 h-4" /> :
                         latestSub.status === 'pending' ? <Clock className="w-4 h-4" /> :
                         <XCircle className="w-4 h-4" />}
                        Subscription {latestSub.status.charAt(0).toUpperCase() + latestSub.status.slice(1)}
                        {latestSub.phase && <span className="opacity-70 text-xs"> · {latestSub.phase}</span>}
                      </div>
                    ) : (
                      <div className="inline-flex items-center gap-1.5 mt-2 px-3 py-1 rounded-full text-sm font-semibold border text-red-600 bg-red-50 border-red-200">
                        <XCircle className="w-4 h-4" />
                        No Active Subscription
                      </div>
                    )}
                  </div>
                  {isLeader && (
                    <SubscriptionPaymentForm
                      groupType={myGroup.type}
                      groupId={myGroup.id}
                      groupName={myGroup.name}
                      groupMembers={myGroup.members || []}
                      onSuccess={() => refetchSubs()}
                    />
                  )}
                </div>
              </div>

              {/* Subscription History */}
              {groupSubscriptions.length > 0 && (
                <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-5">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Subscription History</h3>
                  <div className="space-y-3">
                    {groupSubscriptions.map(sub => (
                      <div key={sub.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white text-sm">{sub.phase}</p>
                          <p className="text-xs text-gray-500">{sub.payment_method?.replace('_', ' ')} · {sub.paid_by_name}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-emerald-600">{sub.amount?.toLocaleString()} FRW</p>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            sub.status === 'active' ? 'bg-emerald-100 text-emerald-700' :
                            sub.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                            'bg-red-100 text-red-700'
                          }`}>{sub.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </TabsContent>

        {/* My Payments */}
        <TabsContent value="my-payments">
          {myPayments.length === 0 ?
          <div className="text-center py-20">
              <CreditCard className="w-16 h-16 mx-auto text-gray-200 dark:text-gray-700 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No payments yet</h3>
              <p className="text-gray-500 mb-6">Submit your yearly RSA revenue payment to get started.</p>
              <Button onClick={() => setShowSubmitDialog(true)} className="bg-emerald-600 hover:bg-emerald-700">
                <Plus className="w-4 h-4 mr-2" />Submit Payment
              </Button>
            </div> :

          <div className="space-y-4">
              {myPayments.map((p) =>
            <div key={p.id} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {STATUS_ICON[p.status]}
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-gray-900 dark:text-white">Year {p.year_of_payment}</span>
                          <Badge className={`text-xs border ${STATUS_BADGE[p.status]}`}>
                            {p.status.charAt(0).toUpperCase() + p.status.slice(1)}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-500 mt-0.5">
                          {PAYMENT_METHODS[p.payment_method]} · Ref: {p.transaction_code}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">Submitted {moment(p.created_date).fromNow()}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-emerald-600">{p.amount_paid?.toLocaleString()} RWF</p>
                      {p.receipt_id &&
                  <p className="text-xs text-gray-400 font-mono">{p.receipt_id}</p>
                  }
                    </div>
                  </div>

                  {/* Admin comment */}
                  {p.admin_comment &&
              <div className={`mt-3 p-3 rounded-lg text-sm ${p.status === 'rejected' ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400' : 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400'}`}>
                      <span className="font-medium">Admin note: </span>{p.admin_comment}
                    </div>
              }

                  {/* Download receipt if verified */}
                  {p.status === 'verified' && p.receipt_id &&
              <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800 flex flex-wrap gap-2">
                      <Button
                  size="sm"
                  onClick={() => setViewingReceipt(p)}
                  className="bg-emerald-600 hover:bg-emerald-700">
                        <Download className="w-4 h-4 mr-2" />
                        View & Download Receipt
                      </Button>
                    </div>
              }
                </div>
            )}
            </div>
          }
        </TabsContent>

        {/* Admin Review */}
        {isAdmin &&
        <TabsContent value="review">
            <AdminPaymentReview payments={allPayments} adminUser={user} />
          </TabsContent>
        }

        {/* Financial Dashboard */}
        {isAdmin &&
        <TabsContent value="dashboard">
            <FinancialDashboard payments={allPayments} />
          </TabsContent>
        }
      </Tabs>

      {/* Receipt Modal */}
      {viewingReceipt &&
      <PaymentReceiptModal
        payment={viewingReceipt}
        onClose={() => setViewingReceipt(null)} />

      }
    </div>);

}
