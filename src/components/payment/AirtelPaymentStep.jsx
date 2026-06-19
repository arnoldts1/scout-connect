import React, { useState } from 'react';
import { Copy, CheckCircle2, Smartphone } from 'lucide-react';
import { toast } from 'sonner';

const AIRTEL_NUMBER = '0734256661'; // Replace with real Airtel Money number
const AIRTEL_NAME = 'Rwanda Scout Association';

export default function AirtelPaymentStep({ amount }) {
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
        copiedField === field ? 'bg-emerald-500 text-white' : 'bg-red-200 hover:bg-red-300 text-red-900'
      }`}>
      {copiedField === field ? <CheckCircle2 className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
      {copiedField === field ? 'Copied' : 'Copy'}
    </button>
  );

  return (
    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-2xl p-5 space-y-4">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center">
          <Smartphone className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="font-bold text-red-900 dark:text-red-300">Airtel Money</p>
          <p className="text-xs text-red-700 dark:text-red-500">Follow the steps below</p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl p-3 border border-red-200">
        <p className="text-xs text-red-600 font-semibold uppercase tracking-wide mb-1.5">Send Money To</p>
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-lg font-black text-gray-900 dark:text-white">{AIRTEL_NUMBER}</p>
            <p className="text-xs text-gray-500">{AIRTEL_NAME}</p>
          </div>
          <CopyBtn text={AIRTEL_NUMBER} field="number" />
        </div>
      </div>

      <div className="bg-red-100 dark:bg-red-900/40 rounded-xl p-3">
        <p className="text-xs text-red-800 dark:text-red-400 font-semibold mb-1">📱 Steps:</p>
        <ol className="text-xs text-red-700 dark:text-red-500 space-y-0.5 list-decimal list-inside">
          <li>Dial *185# or open Airtel Money app</li>
          <li>Select "Send Money"</li>
          <li>Enter number: {AIRTEL_NUMBER}</li>
          <li>Enter amount: {parseInt(amount || 0).toLocaleString()} RWF</li>
          <li>Confirm with your PIN</li>
          <li>Copy the transaction ID from confirmation SMS</li>
        </ol>
      </div>
    </div>
  );
}