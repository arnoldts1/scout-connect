import React, { useEffect } from 'react';
import { CheckCircle2, Clock, ArrowRight, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import confetti from 'canvas-confetti';
import moment from 'moment';

export default function PaymentSuccess({ payment, paymentMethod, onReset }) {
  useEffect(() => {
    confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 }, colors: ['#059669', '#14b8a6', '#fbbf24'] });
  }, []);

  return (
    <div className="text-center space-y-6 animate-fade-in py-4">
      <div className="flex justify-center">
        <div className="w-24 h-24 bg-emerald-50 dark:bg-emerald-900/30 rounded-full flex items-center justify-center">
          <CheckCircle2 className="w-12 h-12 text-emerald-500" />
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-black text-gray-900 dark:text-white">Payment Submitted!</h2>
        <p className="text-gray-500 mt-1">Your payment is being reviewed by RSA admins</p>
      </div>

      <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-5 text-left space-y-3">
        <div className="flex justify-between items-center pb-3 border-b border-gray-100 dark:border-gray-800">
          <span className="text-gray-500 text-sm">Amount</span>
          <span className="text-xl font-black text-emerald-600">{payment.amount_paid?.toLocaleString()} RWF</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-500 text-sm">Method</span>
          <span className="font-semibold text-gray-900 dark:text-white">{paymentMethod?.name}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-500 text-sm">Reference</span>
          <span className="font-mono text-sm text-gray-700 dark:text-gray-300">{payment.transaction_code}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-500 text-sm">Submitted</span>
          <span className="text-sm text-gray-700 dark:text-gray-300">{moment().format('MMM D, YYYY · h:mm A')}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-500 text-sm">Status</span>
          <span className="flex items-center gap-1.5 text-amber-600 font-semibold text-sm">
            <Clock className="w-4 h-4" /> Pending Review
          </span>
        </div>
      </div>

      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 rounded-xl p-4 text-left">
        <p className="text-amber-800 dark:text-amber-400 text-sm font-semibold mb-1">⏱ What happens next?</p>
        <p className="text-amber-700 dark:text-amber-500 text-xs">An RSA admin will verify your payment screenshot and transaction reference within 24–48 hours. You'll receive a notification once approved.</p>
      </div>

      <div className="flex gap-3">
        <Button variant="outline" onClick={onReset} className="flex-1">
          <ArrowRight className="w-4 h-4 mr-2" />New Payment
        </Button>
        <Link to="/" className="flex-1">
          <Button className="w-full bg-emerald-600 hover:bg-emerald-700">
            <Home className="w-4 h-4 mr-2" />Go Home
          </Button>
        </Link>
      </div>
    </div>
  );
}
