import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { CreditCard, Upload, Loader2, CheckCircle, Copy, Phone } from 'lucide-react';
import { toast } from 'sonner';
import { getCurrentPhase } from './SubscriptionStatusBadge';

const AMOUNT = { unit: 1000, clan: 2000 };

export default function SubscriptionPaymentForm({ groupType, groupId, groupName, groupMembers = [], onSuccess }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [proofUrl, setProofUrl] = useState('');
  const [form, setForm] = useState({
    transaction_id: '',
    payment_method: 'mobile_money',
  });

  const currentPhase = getCurrentPhase();
  const amount = AMOUNT[groupType];

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setProofUrl(file_url);
      toast.success('Proof uploaded successfully');
    } catch (error) {
      toast.error('Failed to upload proof');
      console.error('Upload error:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!form.transaction_id) {
      toast.error('Please enter the transaction ID');
      return;
    }
    setLoading(true);
    try {
      const user = await base44.auth.me();

      // Create subscription record
      const subscription = await base44.entities.Subscription.create({
        group_type: groupType,
        group_id: groupId,
        phase: currentPhase.phase,
        phase_year: currentPhase.year,
        phase_number: currentPhase.phaseNumber,
        amount,
        status: 'pending',
        transaction_id: form.transaction_id,
        payment_method: form.payment_method,
        payment_proof_url: proofUrl,
        paid_by: user.id,
        paid_by_name: user.full_name,
      });

      // Note: Notifications are sent separately by admin after verification
      toast.success('Payment submitted! Awaiting admin verification.');
      setOpen(false);
      if (onSuccess) onSuccess(subscription);
    } catch (err) {
      console.error('Payment submission error:', err);
      toast.error(`Failed to submit payment: ${err?.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-amber-600 hover:bg-amber-700">
          <CreditCard className="w-4 h-4 mr-2" />
          Pay Subscription
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Pay ScoutConnect Subscription</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4 space-y-1">
            <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">Payment Details</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Group: <span className="font-medium">{groupName}</span></p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Phase: <span className="font-medium">{currentPhase.phase}</span></p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Amount: <span className="font-bold text-amber-700">{amount.toLocaleString()} FRW</span></p>
          </div>

          <div>
            <Label>Payment Method</Label>
            <Select value={form.payment_method} onValueChange={v => setForm(f => ({ ...f, payment_method: v }))}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mobile_money">Mobile Money</SelectItem>
                <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                <SelectItem value="cash">Cash</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {form.payment_method === 'mobile_money' && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-2 text-blue-800 dark:text-blue-300 font-semibold text-sm">
                <Phone className="w-4 h-4" />
                Mobile Money Instructions
              </div>

              <div className="space-y-1">
                <p className="text-xs text-gray-500 dark:text-gray-400">Dial this USSD code to pay:</p>
                <div className="flex items-center gap-2 bg-white dark:bg-gray-800 border border-blue-200 dark:border-blue-600 rounded-lg px-3 py-2">
                  <code className="text-sm font-bold text-blue-700 dark:text-blue-300 flex-1 break-all">
                    *182*1*1*0794680380*{amount}#
                  </code>
                  <button
                    type="button"
                    className="text-blue-500 hover:text-blue-700 shrink-0"
                    onClick={() => {
                      navigator.clipboard.writeText(`*182*1*1*0794680380*${amount}#`);
                      toast.success('USSD code copied!');
                    }}
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-xs text-gray-500 dark:text-gray-400">Recipient number:</p>
                <div className="flex items-center gap-2 bg-white dark:bg-gray-800 border border-blue-200 dark:border-blue-600 rounded-lg px-3 py-2">
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex-1">0794680380</span>
                  <button
                    type="button"
                    className="text-blue-500 hover:text-blue-700 shrink-0"
                    onClick={() => {
                      navigator.clipboard.writeText('0794680380');
                      toast.success('Number copied!');
                    }}
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg p-3 space-y-1">
                <p className="text-xs font-semibold text-amber-800 dark:text-amber-300">⚠️ Before confirming payment:</p>
                <p className="text-xs text-amber-700 dark:text-amber-400">Make sure the recipient name shown is:</p>
                <p className="text-sm font-bold text-amber-900 dark:text-amber-200">KANEZA Arnold Sincere</p>
                <p className="text-xs text-amber-600 dark:text-amber-500 mt-1">
                  📸 Save a screenshot of the confirmation for proof. You will need to upload it below.
                </p>
              </div>
            </div>
          )}

          <div>
            <Label>Transaction ID / Reference</Label>
            <Input
              className="mt-1"
              placeholder="Enter transaction code"
              value={form.transaction_id}
              onChange={e => setForm(f => ({ ...f, transaction_id: e.target.value }))}
            />
          </div>

          <div>
            <Label>Payment Proof (Optional)</Label>
            <div className="mt-1">
              {proofUrl ? (
                <div className="flex items-center gap-2 text-sm text-emerald-600">
                  <CheckCircle className="w-4 h-4" />
                  Proof uploaded
                </div>
              ) : (
                <label className="flex items-center gap-2 cursor-pointer border border-dashed border-gray-300 rounded-lg p-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4 text-gray-400" />}
                  <span className="text-sm text-gray-500">{uploading ? 'Uploading...' : 'Upload screenshot'}</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleUpload} />
                </label>
              )}
            </div>
          </div>

          <Button onClick={handleSubmit} disabled={loading} className="w-full bg-emerald-600 hover:bg-emerald-700">
            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CreditCard className="w-4 h-4 mr-2" />}
            Submit Payment
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
