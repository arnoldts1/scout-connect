import React, { useState } from 'react';
import { Copy, CheckCircle2, Smartphone } from 'lucide-react';
import { toast } from 'sonner';

const MTN_NUMBER = '0781234567'; // Replace with real MTN MoMo number
const MTN_NAME = 'Rwanda Scout Association';
const MTN_USSD = '*182*8*1*049151#';

export default function MtnPaymentStep({ amount }) {
  const [copiedField, setCopiedField] = useState(null);

  const copy = (text, field) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast.success('Copied!');
    setTimeout(() => setCopiedField(null), 2000);
  };

  const CopyBtn = ({ text, field }) => (
    <button type="button" onClick={() => copy(text, field)}
      className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg transition-all ${
        copiedField === field ? 'bg-emerald-500 text-white' : 'bg-yellow-200 hover:bg-yellow-300 text-yellow-900'
      }`}>
      {copiedField === field ? <CheckCircle2 className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
      {copiedField === field ? 'Copied' : 'Copy'}
    </button>
  );

  return (
    <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-2xl p-5 space-y-4">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-yellow-400 rounded-lg flex items-center justify-center">
          <Smartphone className="w-5 h-5 text-yellow-900" />
        </div>
        <div>
          <p className="font-bold text-yellow-900 dark:text-yellow-300">MTN Mobile Money</p>
          <p className="text-xs text-yellow-700 dark:text-yellow-500">Follow the steps below</p>
        </div>
      </div>

      <div className="space-y-3">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-3 border border-yellow-200">
          <p className="text-xs text-yellow-600 font-semibold uppercase tracking-wide mb-1.5">Option 1 · Dial USSD</p>
          <div className="flex items-center justify-between gap-2">
            <code className="text-lg font-black text-gray-900 dark:text-white">{MTN_USSD}</code>
            <CopyBtn text={MTN_USSD} field="ussd" />
          </div>
          <p className="text-xs text-gray-400 mt-1">Then enter amount: <strong>{parseInt(amount || 0).toLocaleString()} RWF</strong></p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-3 border border-yellow-200">
          <p className="text-xs text-yellow-600 font-semibold uppercase tracking-wide mb-1.5">Option 2 · Send to Number</p>
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-lg font-black text-gray-900 dark:text-white">{MTN_NUMBER}</p>
              <p className="text-xs text-gray-500">{MTN_NAME}</p>
            </div>
            <CopyBtn text={MTN_NUMBER} field="number" />
          </div>
        </div>
      </div>

      <div className="bg-yellow-100 dark:bg-yellow-900/40 rounded-xl p-3">
        <p className="text-xs text-yellow-800 dark:text-yellow-400 font-semibold mb-1">📱 Steps:</p>
        <ol className="text-xs text-yellow-700 dark:text-yellow-500 space-y-0.5 list-decimal list-inside">
          <li>Dial {MTN_USSD} or open MTN MoMo app</li>
          <li>Select "Send Money" → enter number above</li>
          <li>Enter amount: {parseInt(amount || 0).toLocaleString()} RWF</li>
          <li>Confirm with your PIN</li>
          <li>Copy transaction ID from SMS confirmation</li>
        </ol>
      </div>
    </div>
  );
}