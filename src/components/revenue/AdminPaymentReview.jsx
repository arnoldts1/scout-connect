import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CheckCircle, XCircle, Eye, ExternalLink, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import moment from 'moment';

const STATUS_BADGE = {
  pending: 'bg-amber-100 text-amber-700 border-amber-200',
  verified: 'bg-green-100 text-green-700 border-green-200',
  rejected: 'bg-red-100 text-red-700 border-red-200'
};

const PAYMENT_METHODS = {
  mobile_money: 'Mobile Money',
  bank_transfer: 'Bank Transfer',
  cash: 'Cash'
};

function generateReceiptId(year) {
  const num = Math.floor(Math.random() * 90000) + 10000;
  return `RSA-${year}-${num}`;
}

export default function AdminPaymentReview({ payments, adminUser }) {
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState(null);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  const openReview = (payment) => {
    setSelected(payment);
    setComment('');
  };

  const handleApprove = async () => {
    if (!selected) return;
    setLoading(true);
    try {
      const receiptId = generateReceiptId(selected.year_of_payment);
      const now = new Date().toISOString();

      await base44.entities.RevenuePayment.update(selected.id, {
        status: 'verified',
        admin_comment: comment,
        verified_by: adminUser?.full_name,
        verified_by_id: adminUser?.id,
        verified_at: now,
        receipt_id: receiptId
      });

      await base44.entities.Notification.create({
        user_id: selected.submitter_id,
        type: 'system',
        title: 'Payment Verified ✅',
        message: `Your RSA Yearly Revenue Payment for ${selected.year_of_payment} has been verified. Download your payment check (Receipt: ${receiptId}).`,
        is_read: false
      });

      queryClient.invalidateQueries(['revenue-payments']);
      toast.success('Payment approved and receipt generated!');
      setSelected(null);
    } catch (error) {
      toast.error('Failed to approve payment');
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selected) return;
    setLoading(true);
    try {
      await base44.entities.RevenuePayment.update(selected.id, {
        status: 'rejected',
        admin_comment: comment,
        verified_by: adminUser?.full_name,
        verified_by_id: adminUser?.id,
        verified_at: new Date().toISOString()
      });

      await base44.entities.Notification.create({
        user_id: selected.submitter_id,
        type: 'system',
        title: 'Payment Rejected ❌',
        message: `Your RSA Yearly Revenue Payment for ${selected.year_of_payment} was rejected.${comment ? ` Reason: ${comment}` : ''}`,
        is_read: false
      });

      queryClient.invalidateQueries(['revenue-payments']);
      toast.success('Payment rejected');
      setSelected(null);
    } catch (error) {
      toast.error('Failed to reject payment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="space-y-3">
        {payments.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <CheckCircle className="w-14 h-14 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No payments to review</p>
          </div>
        ) : (
          payments.map(p => (
            <div key={p.id} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-4 flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="font-semibold text-gray-900 dark:text-white">{p.full_name}</span>
                  <Badge className={`text-xs border ${STATUS_BADGE[p.status]}`}>{p.status.charAt(0).toUpperCase() + p.status.slice(1)}</Badge>
                </div>
                <p className="text-sm text-gray-500">{p.unit_name} · Year {p.year_of_payment} · <span className="font-medium text-gray-700 dark:text-gray-300">{p.amount_paid?.toLocaleString()} RWF</span></p>
                <p className="text-xs text-gray-400 mt-0.5">{PAYMENT_METHODS[p.payment_method]} · Ref: {p.transaction_code} · {moment(p.date_of_payment).format('DD MMM YYYY')}</p>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                {p.payment_proof_url && (
                  <a href={p.payment_proof_url} target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" size="sm"><ExternalLink className="w-3.5 h-3.5 mr-1" />Proof</Button>
                  </a>
                )}
                {p.status === 'pending' && (
                  <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={() => openReview(p)}>
                    <Eye className="w-3.5 h-3.5 mr-1" />Review
                  </Button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Review Dialog */}
      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Review Payment</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4 mt-2">
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-gray-500">Scout</span><span className="font-medium">{selected.full_name}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Scout ID</span><span className="font-medium">{selected.scout_id}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Unit</span><span className="font-medium">{selected.unit_name}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Year</span><span className="font-medium">{selected.year_of_payment}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Amount</span><span className="font-semibold text-emerald-600">{selected.amount_paid?.toLocaleString()} RWF</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Method</span><span className="font-medium">{PAYMENT_METHODS[selected.payment_method]}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Reference</span><span className="font-medium">{selected.transaction_code}</span></div>
              </div>

              {selected.payment_proof_url && (
                <a href={selected.payment_proof_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-emerald-600 hover:underline">
                  <ExternalLink className="w-4 h-4" /> View Payment Proof
                </a>
              )}

              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Admin Comment (optional)</label>
                <Textarea value={comment} onChange={e => setComment(e.target.value)} placeholder="Add a comment for the scout..." rows={3} />
              </div>

              <div className="flex gap-3">
                <Button onClick={handleApprove} disabled={loading} className="flex-1 bg-emerald-600 hover:bg-emerald-700">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <CheckCircle className="w-4 h-4 mr-1" />}
                  Approve
                </Button>
                <Button onClick={handleReject} disabled={loading} variant="destructive" className="flex-1">
                  <XCircle className="w-4 h-4 mr-1" />Reject
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
