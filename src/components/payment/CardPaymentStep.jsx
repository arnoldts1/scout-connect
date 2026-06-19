import React, { useState } from 'react';
import { Copy, CheckCircle2, CreditCard, Shield } from 'lucide-react';
import { toast } from 'sonner';

// Replace these with your real card payment details
const CARD_ACCOUNT_NAME = 'Rwanda Scout Association';
const CARD_ACCOUNT_NUMBER = '5273 6400 2838 7332';
const CARD_BANK = 'Bank of Kigali';
const CARD_SWIFT = 'BKIGRWRW';

export default function CardPaymentStep({ amount }) {
  const [copied, setCopied] = useState(null);

  const copy = (text, field) => {
    navigator.clipboard.writeText(text);
    setCopied(field);
    toast.success('Copied!');
    setTimeout(() => setCopied(null), 2000);
  };

  const CopyBtn = ({ text, field }) => (
    <button type="button" onClick={() => copy(text, field)}
      className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg transition-all ${
        copied === field ? 'bg-emerald-500 text-white' : 'bg-blue-100 hover:bg-blue-200 text-blue-900'
      }`}>
      {copied === field ? <CheckCircle2 className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
      {copied === field ? 'Copied' : 'Copy'}
    </button>
  );

  return (
    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-2xl p-5 space-y-4">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
          <CreditCard className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="font-bold text-blue-900 dark:text-blue-300">Card / Bank Transfer</p>
          <p className="text-xs text-blue-700 dark:text-blue-500">Visa · Mastercard · Debit</p>
        </div>
      </div>

      {/* Card visual */}
      <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-4 text-white shadow-lg">
        <p className="text-blue-200 text-xs font-semibold uppercase tracking-widest mb-3">Transfer To</p>
        <p className="text-xl font-black tracking-widest mb-1">{CARD_ACCOUNT_NUMBER}</p>
        <div className="flex items-end justify-between mt-3">
          <div>
            <p className="text-blue-200 text-xs">Account Name</p>
            <p className="text-sm font-bold">{CARD_ACCOUNT_NAME}</p>
          </div>
          <div className="text-right">
            <p className="text-blue-200 text-xs">Bank</p>
            <p className="text-sm font-bold">{CARD_BANK}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-3 border border-blue-200">
          <p className="text-xs text-blue-500 font-semibold mb-1">Account Number</p>
          <div className="flex items-center justify-between gap-1">
            <code className="text-xs font-bold text-gray-900 dark:text-white truncate">{CARD_ACCOUNT_NUMBER}</code>
            <CopyBtn text={CARD_ACCOUNT_NUMBER} field="account" />
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-3 border border-blue-200">
          <p className="text-xs text-blue-500 font-semibold mb-1">SWIFT Code</p>
          <div className="flex items-center justify-between gap-1">
            <code className="text-xs font-bold text-gray-900 dark:text-white">{CARD_SWIFT}</code>
            <CopyBtn text={CARD_SWIFT} field="swift" />
          </div>
        </div>
      </div>

      <div className="bg-blue-100 dark:bg-blue-900/40 rounded-xl p-3">
        <p className="text-xs text-blue-800 dark:text-blue-400 font-semibold mb-1">💳 Steps:</p>
        <ol className="text-xs text-blue-700 dark:text-blue-500 space-y-0.5 list-decimal list-inside">
          <li>Go to your bank app or nearest ATM</li>
          <li>Select "Transfer / Send Money"</li>
          <li>Enter account number above</li>
          <li>Enter amount: {parseInt(amount || 0).toLocaleString()} RWF</li>
          <li>Save the transaction receipt/reference</li>
        </ol>
      </div>

      <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-3 border border-emerald-200">
        <Shield className="w-4 h-4 text-emerald-600 flex-shrink-0" />
        <p className="text-xs text-emerald-700 dark:text-emerald-400">All card transfers are encrypted and processed securely through RSA's official bank account.</p>
      </div>
    </div>
  );
}