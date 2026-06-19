import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Upload, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import moment from 'moment';

export default function SubmitPaymentForm({ user, onSuccess }) {
  const currentYear = new Date().getFullYear();
  const [form, setForm] = useState({
    full_name: '',
    scout_id: '',
    unit_name: '',
    year_of_payment: currentYear,
    amount_paid: '',
    payment_method: '',
    transaction_code: '',
    date_of_payment: moment().format('YYYY-MM-DD'),
    payment_proof_url: ''
  });

  // Autofill user data when user object is available
  useEffect(() => {
    if (user) {
      setForm(prev => ({
        ...prev,
        full_name: prev.full_name || user.full_name || '',
        scout_id: user.scout_id || prev.scout_id || '',
        unit_name: prev.unit_name || user.unit_name || user.clan_name || '',
      }));
    }
  }, [user?.id, user?.scout_id]);

  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const set = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      set('payment_proof_url', file_url);
      toast.success('Proof uploaded successfully');
    } catch (error) {
      toast.error('Failed to upload proof');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.payment_method) { toast.error('Please select a payment method'); return; }
    if (!form.payment_proof_url) { toast.error('Please upload payment proof'); return; }
    if (!form.amount_paid || isNaN(parseFloat(form.amount_paid))) { toast.error('Please enter a valid amount'); return; }

    setSubmitting(true);
    try {
      const payload = {
        full_name: form.full_name,
        scout_id: form.scout_id,
        unit_name: form.unit_name,
        year_of_payment: parseInt(form.year_of_payment),
        amount_paid: parseFloat(form.amount_paid),
        payment_method: form.payment_method,
        transaction_code: form.transaction_code,
        date_of_payment: form.date_of_payment,
        payment_proof_url: form.payment_proof_url,
        status: 'pending',
        submitter_id: user?.id,
        submitter_email: user?.email,
        currency: 'RWF'
      };

      console.log('📝 Submitting payment with payload:', payload);

      const response = await base44.entities.RevenuePayment.create(payload);

      console.log('✅ Payment created successfully:', response);
      toast.success('Payment submitted for verification!');
      onSuccess?.();
    } catch (error) {
      console.error('❌ Error submitting payment:', error);
      console.error('Error details:', {
        message: error?.message,
        code: error?.code,
        status: error?.status,
        details: error?.details
      });
      toast.error(`Failed to submit payment: ${error?.message || 'Unknown error'}`);
    } finally {
      setSubmitting(false);
    }
  };

  const years = Array.from({ length: 6 }, (_, i) => currentYear - i);

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Full Name *</Label>
          <Input value={form.full_name} onChange={e => set('full_name', e.target.value)} required className="mt-1" />
        </div>
        <div>
          <Label>Scout ID *</Label>
          <Input value={form.scout_id} onChange={e => set('scout_id', e.target.value)} required className="mt-1" placeholder="e.g., RSA-00123" />
        </div>
      </div>

      <div>
        <Label>Unit / Clan *</Label>
        <Input value={form.unit_name} onChange={e => set('unit_name', e.target.value)} required className="mt-1" placeholder="Your unit or clan name" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Year of Payment *</Label>
          <Select value={form.year_of_payment.toString()} onValueChange={v => set('year_of_payment', parseInt(v))}>
            <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              {years.map(y => <SelectItem key={y} value={y.toString()}>{y}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Amount Paid (RWF) *</Label>
          <Input type="number" value={form.amount_paid} onChange={e => set('amount_paid', e.target.value)} required className="mt-1" placeholder="e.g., 5000" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Payment Method *</Label>
          <Select value={form.payment_method} onValueChange={v => set('payment_method', v)}>
            <SelectTrigger className="mt-1"><SelectValue placeholder="Select method" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="mobile_money">MTN MoMo</SelectItem>
              <SelectItem value="airtel_money" disabled>Airtel Money (Not yet available)</SelectItem>
              <SelectItem value="cash">Cash</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Transaction / Reference No. *</Label>
          <Input value={form.transaction_code} onChange={e => set('transaction_code', e.target.value)} required className="mt-1" placeholder="e.g., TXN123456" />
        </div>
      </div>

      {/* MTN MoMo payment instructions */}
      {form.payment_method === 'mobile_money' && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-xl p-4">
          <p className="text-xs text-yellow-700 dark:text-yellow-400 font-semibold mb-2">📱 MTN MoMo Payment Instructions</p>
          <p className="text-xs text-yellow-600 dark:text-yellow-500 mb-3">Dial the code below or use your MoMo app to pay:</p>
          <div className="flex items-center gap-2 bg-white dark:bg-gray-800 rounded-lg px-3 py-2 border border-yellow-300 dark:border-yellow-600">
            <code className="text-sm font-bold text-gray-900 dark:text-white flex-1 select-all">*182*8*1*049151#</code>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText('*182*8*1*049151#');
                toast.success('Code copied!');
              }}
              className="text-xs bg-yellow-400 hover:bg-yellow-500 text-yellow-900 font-semibold px-2 py-1 rounded"
            >
              Copy
            </button>
          </div>
          <p className="text-xs text-yellow-600 dark:text-yellow-500 mt-2 font-medium">Rwanda Scout Association</p>
          <p className="text-xs text-yellow-500 dark:text-yellow-600 mt-0.5">Umuryango w'Abaskuti mu Rwanda (RSA)</p>
        </div>
      )}

      <div>
        <Label>Date of Payment *</Label>
        <Input type="date" value={form.date_of_payment} onChange={e => set('date_of_payment', e.target.value)} required className="mt-1" />
      </div>

      <div>
        <Label>Payment Proof (Image or PDF) *</Label>
        <div className="mt-1">
          {form.payment_proof_url ? (
            <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
              <span className="text-sm text-green-700 dark:text-green-400 truncate">Proof uploaded successfully</span>
              <button type="button" onClick={() => set('payment_proof_url', '')} className="text-xs text-red-500 ml-auto hover:underline">Remove</button>
            </div>
          ) : (
            <label className="flex items-center gap-3 p-4 border-2 border-dashed border-gray-200 rounded-lg cursor-pointer hover:border-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/10 transition-colors">
              {uploading ? (
                <Loader2 className="w-5 h-5 text-emerald-600 animate-spin" />
              ) : (
                <Upload className="w-5 h-5 text-gray-400" />
              )}
              <span className="text-sm text-gray-500">{uploading ? 'Uploading...' : 'Click to upload image or PDF'}</span>
              <input type="file" accept="image/*,.pdf" className="hidden" onChange={handleFileUpload} disabled={uploading} />
            </label>
          )}
        </div>
      </div>

      <Button type="submit" disabled={submitting || uploading} className="w-full bg-emerald-600 hover:bg-emerald-700">
        {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
        Submit Payment for Verification
      </Button>
    </form>
  );
}
