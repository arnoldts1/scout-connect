import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  CreditCard, Smartphone, Wallet, CheckCircle2, Copy, ArrowLeft,
  Loader2, Upload, Shield, Zap, Clock, AlertCircle, ChevronRight
} from 'lucide-react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import moment from 'moment';
import PaymentSuccess from '@/components/payment/PaymentSuccess';
import PaymentMethodCard from '@/components/payment/PaymentMethodCard';
import MtnPaymentStep from '@/components/payment/MtnPaymentStep';
import AirtelPaymentStep from '@/components/payment/AirtelPaymentStep';
import CardPaymentStep from '@/components/payment/CardPaymentStep';

const MEMBERSHIP_TIERS = [
  { id: 'abatoni',       label: 'Abatoni',       amount: 500  },
  { id: 'inkesha',       label: 'Inkesha',        amount: 1000 },
  { id: 'abahizi',       label: 'Abahizi',        amount: 1000 },
  { id: 'ingenzi',       label: 'Ingenzi',        amount: 2000 },
  { id: 'unit_leader',   label: 'Unit Leader',    amount: 3000 },
];

const PAYMENT_TYPES = [
  { id: 'membership',         label: 'Membership Fee',      amount: null,  currency: 'RWF', description: 'Annual individual membership — rate by rank' },
  { id: 'unit_subscription',  label: 'Unit Subscription',   amount: 1000,  currency: 'RWF', description: 'Unit subscription — 1,000 RWF every 6 months' },
  { id: 'clan_subscription',  label: 'Clan Subscription',   amount: 2000,  currency: 'RWF', description: 'Clan subscription — 2,000 RWF every month' },
  { id: 'event',              label: 'Event Registration',  amount: null,  currency: 'RWF', description: 'Pay for event tickets and registration' },
  { id: 'donation',           label: 'Donation',            amount: null,  currency: 'RWF', description: 'Support the Scout Association' },
];

export default function PaymentGateway() {
  const [user, setUser] = useState(null);
  const [step, setStep] = useState('type'); // type → method → pay → confirm → success
  const [paymentType, setPaymentType] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState(null);
  const [amount, setAmount] = useState('');
  const [txRef, setTxRef] = useState('');
  const [proofUrl, setProofUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(null);
  const [membershipTier, setMembershipTier] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: myPayments = [] } = useQuery({
    queryKey: ['my-gateway-payments', user?.id],
    queryFn: () => base44.entities.RevenuePayment.filter({ submitter_id: user.id }, '-created_date', 20),
    enabled: !!user?.id
  });

  const handleSelectType = (type) => {
    setPaymentType(type);
    setMembershipTier(null);
    if (type.amount) setAmount(type.amount.toString());
    else setAmount('');
    if (type.id === 'membership') setStep('tier'); // extra tier-selection step
    else setStep('method');
  };

  const handleSelectTier = (tier) => {
    setMembershipTier(tier);
    setAmount(tier.amount.toString());
    setStep('method');
  };

  const handleSelectMethod = (method) => {
    setPaymentMethod(method);
    setStep('pay');
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setProofUrl(file_url);
      toast.success('Proof uploaded!');
    } catch (error) {
      toast.error('Failed to upload proof');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!txRef.trim()) { toast.error('Enter transaction reference'); return; }
    if (!proofUrl) { toast.error('Upload payment proof screenshot'); return; }
    if (!amount || isNaN(parseFloat(amount))) { toast.error('Enter a valid amount'); return; }
    if (!paymentMethod) { toast.error('Select a payment method'); return; }
    if (!user?.id) { toast.error('Please log in to make a payment'); return; }

    setSubmitting(true);
    try {
      const record = await base44.entities.RevenuePayment.create({
        full_name: user.full_name || '',
        scout_id: user.scout_id || '',
        unit_name: user.unit_name || user.clan_name || '',
        year_of_payment: new Date().getFullYear(),
        amount_paid: parseFloat(amount),
        payment_method: paymentMethod.id,
        transaction_code: txRef,
        date_of_payment: moment().format('YYYY-MM-DD'),
        payment_proof_url: proofUrl,
        status: 'pending',
        submitter_id: user.id,
        submitter_email: user.email
      });
      setSubmitted(record);
      setStep('success');
    } catch (error) {
      toast.error('Failed to submit payment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const reset = () => {
    setStep('type');
    setPaymentType(null);
    setPaymentMethod(null);
    setMembershipTier(null);
    setAmount('');
    setTxRef('');
    setProofUrl('');
    setSubmitted(null);
  };

  const progressSteps = paymentType?.id === 'membership'
    ? ['type', 'tier', 'method', 'pay', 'success']
    : ['type', 'method', 'pay', 'success'];
  const currentIdx = progressSteps.indexOf(step);

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      <div className="max-w-xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Link to="/RevenueTracker" className="text-gray-400 hover:text-gray-600 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Payment Center</h1>
            <p className="text-sm text-gray-500">Rwanda Scout Association</p>
          </div>
          <div className="flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-700 rounded-full px-3 py-1.5">
            <Shield className="w-3.5 h-3.5 text-emerald-600" />
            <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">Secure</span>
          </div>
        </div>

        {/* Progress Bar */}
        {step !== 'success' && (
          <div className="flex items-center gap-2 mb-8">
            {['Choose Type', 'Payment Method', 'Pay & Confirm'].map((label, i) => (
              <React.Fragment key={i}>
                <div className="flex items-center gap-1.5">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    i < currentIdx ? 'bg-emerald-500 text-white' :
                    i === currentIdx ? 'bg-emerald-600 text-white ring-4 ring-emerald-100 dark:ring-emerald-900' :
                    'bg-gray-100 dark:bg-gray-800 text-gray-400'
                  }`}>
                    {i < currentIdx ? <CheckCircle2 className="w-3.5 h-3.5" /> : i + 1}
                  </div>
                  <span className={`text-xs font-medium hidden sm:block ${i === currentIdx ? 'text-emerald-700 dark:text-emerald-400' : 'text-gray-400'}`}>{label}</span>
                </div>
                {i < 2 && <div className={`flex-1 h-0.5 rounded-full transition-all ${i < currentIdx ? 'bg-emerald-400' : 'bg-gray-200 dark:bg-gray-700'}`} />}
              </React.Fragment>
            ))}
          </div>
        )}

        {/* STEP 1: Choose payment type */}
        {step === 'type' && (
          <div className="space-y-4 animate-fade-in">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">What are you paying for?</h2>
            {PAYMENT_TYPES.map(type => (
              <button key={type.id} onClick={() => handleSelectType(type)}
                className="w-full text-left bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl p-4 hover:border-emerald-400 hover:shadow-md transition-all group">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white group-hover:text-emerald-700 dark:group-hover:text-emerald-400">{type.label}</p>
                    <p className="text-sm text-gray-500 mt-0.5">{type.description}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {type.amount && <span className="text-emerald-600 font-bold text-sm">{type.amount.toLocaleString()} {type.currency}</span>}
                    <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-emerald-500 transition-colors" />
                  </div>
                </div>
              </button>
            ))}

            {/* Recent payments */}
            {myPayments.length > 0 && (
              <div className="mt-8">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Recent Payments</h3>
                {myPayments.slice(0, 3).map(p => (
                  <div key={p.id} className="flex items-center justify-between py-2.5 border-b border-gray-100 dark:border-gray-800">
                    <div className="flex items-center gap-2.5">
                      {p.status === 'verified' ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> :
                       p.status === 'pending' ? <Clock className="w-4 h-4 text-amber-500" /> :
                       <AlertCircle className="w-4 h-4 text-red-500" />}
                      <div>
                        <p className="text-sm font-medium text-gray-800 dark:text-gray-200">Year {p.year_of_payment}</p>
                        <p className="text-xs text-gray-400">{moment(p.created_date).fromNow()}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">{p.amount_paid?.toLocaleString()} RWF</p>
                      <Badge className={`text-[10px] ${p.status === 'verified' ? 'bg-emerald-100 text-emerald-700' : p.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>{p.status}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* STEP 1b: Choose membership tier */}
        {step === 'tier' && (
          <div className="space-y-4 animate-fade-in">
            <div className="flex items-center gap-2 mb-2">
              <button onClick={() => setStep('type')} className="text-gray-400 hover:text-gray-600">
                <ArrowLeft className="w-4 h-4" />
              </button>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Select Your Rank / Category</h2>
            </div>
            <p className="text-sm text-gray-500">Membership fee is based on your scout rank.</p>
            {MEMBERSHIP_TIERS.map(tier => (
              <button key={tier.id} onClick={() => handleSelectTier(tier)}
                className="w-full text-left bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl p-4 hover:border-emerald-400 hover:shadow-md transition-all group">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white group-hover:text-emerald-700 dark:group-hover:text-emerald-400">{tier.label}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-600 font-bold text-base">{tier.amount.toLocaleString()} RWF</span>
                    <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-emerald-500 transition-colors" />
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* STEP 2: Choose method */}
        {step === 'method' && (
          <div className="space-y-4 animate-fade-in">
            <div className="flex items-center gap-2 mb-2">
              <button onClick={() => setStep(paymentType?.id === 'membership' ? 'tier' : 'type')} className="text-gray-400 hover:text-gray-600">
                <ArrowLeft className="w-4 h-4" />
              </button>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Choose Payment Method</h2>
            </div>
            <p className="text-sm text-gray-500">
              Paying: <span className="font-semibold text-gray-900 dark:text-white">{paymentType?.label}</span>
              {membershipTier && <span className="text-gray-400 ml-1">— {membershipTier.label}</span>}
              {amount && <span className="text-emerald-600 font-bold ml-2">{parseInt(amount).toLocaleString()} RWF</span>}
            </p>

            {!paymentType?.amount && (
              <div>
                <Label>Amount (RWF) *</Label>
                <Input type="number" value={amount} onChange={e => setAmount(e.target.value)}
                  className="mt-1 text-lg font-bold" placeholder="0" />
              </div>
            )}

            <PaymentMethodCard
              id="mtn_mobile_money"
              name="MTN Mobile Money"
              description="Pay via MTN MoMo — dial or use the app"
              color="from-yellow-400 to-yellow-500"
              icon={<Smartphone className="w-6 h-6 text-white" />}
              badge="Instant"
              badgeColor="bg-yellow-100 text-yellow-800"
              onSelect={() => handleSelectMethod({ id: 'mobile_money', name: 'MTN Mobile Money' })}
            />
            <PaymentMethodCard
              id="airtel_money"
              name="Airtel Money"
              description="Pay via Airtel Money mobile wallet"
              color="from-red-500 to-red-600"
              icon={<Smartphone className="w-6 h-6 text-white" />}
              badge="Instant"
              badgeColor="bg-red-100 text-red-700"
              onSelect={() => handleSelectMethod({ id: 'airtel_money', name: 'Airtel Money' })}
            />
            <PaymentMethodCard
              id="card"
              name="Card Payment"
              description="Pay via Visa / Mastercard / Debit card"
              color="from-blue-500 to-indigo-600"
              icon={<CreditCard className="w-6 h-6 text-white" />}
              badge="Secure"
              badgeColor="bg-blue-100 text-blue-700"
              onSelect={() => handleSelectMethod({ id: 'card', name: 'Card Payment' })}
            />
          </div>
        )}

        {/* STEP 3: Payment instructions + proof upload */}
        {step === 'pay' && (
          <div className="space-y-5 animate-fade-in">
            <div className="flex items-center gap-2 mb-2">
              <button onClick={() => setStep('method')} className="text-gray-400 hover:text-gray-600">
                <ArrowLeft className="w-4 h-4" />
              </button>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{paymentMethod?.name}</h2>
            </div>

            {/* Amount display */}
            <div className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl p-5 text-white">
              <p className="text-emerald-100 text-sm mb-1">Amount to Pay</p>
              <p className="text-4xl font-black">{parseInt(amount || 0).toLocaleString()} <span className="text-2xl font-bold text-emerald-100">RWF</span></p>
              <p className="text-emerald-100 text-sm mt-1">{paymentType?.label}</p>
            </div>

            {/* Method-specific instructions */}
            {paymentMethod?.id === 'mobile_money' && <MtnPaymentStep amount={amount} />}
            {paymentMethod?.id === 'airtel_money' && <AirtelPaymentStep amount={amount} />}
            {paymentMethod?.id === 'card' && <CardPaymentStep amount={amount} />}

            {/* Transaction ref */}
            <div>
              <Label className="font-semibold">Transaction Reference / ID *</Label>
              <Input
                value={txRef}
                onChange={e => setTxRef(e.target.value)}
                className="mt-1.5 font-mono"
                placeholder="e.g., TXN1234567890"
              />
              <p className="text-xs text-gray-400 mt-1">Copy the transaction ID from your payment confirmation SMS or app.</p>
            </div>

            {/* Proof upload */}
            <div>
              <Label className="font-semibold">Screenshot / Proof of Payment *</Label>
              <div className="mt-1.5">
                {proofUrl ? (
                  <div className="flex items-center gap-3 p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-200">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                    <span className="text-sm text-emerald-700 dark:text-emerald-400">Screenshot uploaded ✓</span>
                    <button type="button" onClick={() => setProofUrl('')} className="text-xs text-red-500 ml-auto hover:underline">Remove</button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center gap-2 p-6 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl cursor-pointer hover:border-emerald-400 hover:bg-emerald-50/50 dark:hover:bg-emerald-900/10 transition-colors">
                    {uploading ? <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" /> : <Upload className="w-8 h-8 text-gray-300" />}
                    <span className="text-sm text-gray-500">{uploading ? 'Uploading...' : 'Tap to upload screenshot'}</span>
                    <span className="text-xs text-gray-400">PNG, JPG, PDF accepted</span>
                    <input type="file" accept="image/*,.pdf" className="hidden" onChange={handleFileUpload} disabled={uploading} />
                  </label>
                )}
              </div>
            </div>

            <Button
              onClick={handleSubmit}
              disabled={submitting || uploading || !txRef || !proofUrl}
              className="w-full h-14 text-base font-bold bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-lg"
            >
              {submitting ? (
                <><Loader2 className="w-5 h-5 animate-spin mr-2" />Submitting...</>
              ) : (
                <><Zap className="w-5 h-5 mr-2" />Confirm Payment</>
              )}
            </Button>
            <p className="text-center text-xs text-gray-400 flex items-center justify-center gap-1">
              <Shield className="w-3.5 h-3.5" /> Your payment is reviewed securely by RSA admins
            </p>
          </div>
        )}

        {/* STEP 4: Success */}
        {step === 'success' && submitted && (
          <PaymentSuccess payment={submitted} paymentMethod={paymentMethod} onReset={reset} />
        )}
      </div>
    </div>
  );
}
