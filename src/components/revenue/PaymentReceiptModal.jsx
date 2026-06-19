import React, { useRef } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, X } from 'lucide-react';
import moment from 'moment';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const PAYMENT_METHODS = {
  mobile_money: 'Mobile Money',
  bank_transfer: 'Bank Transfer',
  cash: 'Cash'
};

const DetailRow = ({ label, value }) => (
  <div className="flex justify-between items-center py-2 border-b border-gray-100">
    <span className="text-sm text-gray-500">{label}</span>
    <span className="text-sm font-semibold text-gray-800 text-right max-w-[60%]">{value}</span>
  </div>
);

export default function PaymentReceiptModal({ payment, onClose }) {
  const receiptRef = useRef(null);

  const downloadPDF = async () => {
    const element = receiptRef.current;
    if (!element) return;
    const canvas = await html2canvas(element, {
      scale: 2,
      backgroundColor: '#ffffff',
      logging: false,
      useCORS: true
    });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`${payment.receipt_id}.pdf`);
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[92vh] overflow-y-auto p-0">
        {/* Toolbar */}
        <div className="sticky top-0 bg-white dark:bg-gray-900 border-b px-5 py-3 flex justify-between items-center z-10">
          <h2 className="font-bold text-gray-900 dark:text-white">Digital Payment Receipt</h2>
          <div className="flex gap-2">
            <Button onClick={downloadPDF} size="sm" className="bg-emerald-600 hover:bg-emerald-700">
              <Download className="w-4 h-4 mr-1.5" />
              Download PDF
            </Button>
            <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 rounded-full">
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Receipt — captured by html2canvas */}
        <div className="p-5">
          <div ref={receiptRef} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-200">
            {/* Header */}
            <div className="bg-emerald-600 text-white text-center py-7 px-5">
              <div className="w-16 h-16 rounded-full bg-white/20 border-2 border-white/40 flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl font-black text-white">RSA</span>
              </div>
              <h1 className="text-lg font-bold tracking-wide">Rwanda Scouts Association</h1>
              <p className="text-xs text-emerald-100 mt-0.5 uppercase tracking-widest">Official Digital Payment Receipt</p>
            </div>

            {/* Receipt ID */}
            <div className="bg-emerald-50 py-4 px-5 text-center border-b border-emerald-100">
              <p className="text-xs text-emerald-600 uppercase tracking-widest mb-1">Receipt Number</p>
              <p className="text-2xl font-black text-emerald-700 font-mono tracking-wider">{payment.receipt_id}</p>
            </div>

            {/* Details */}
            <div className="px-5 py-4 space-y-0">
              <DetailRow label="Scout Name" value={payment.full_name} />
              <DetailRow label="Scout ID" value={payment.scout_id} />
              <DetailRow label="Unit / Clan" value={payment.unit_name} />
              <DetailRow label="Year Paid" value={payment.year_of_payment?.toString()} />
              <DetailRow
                label="Amount Paid"
                value={<span className="text-emerald-600 font-bold">{payment.amount_paid?.toLocaleString()} RWF</span>}
              />
              <DetailRow label="Payment Method" value={PAYMENT_METHODS[payment.payment_method] || payment.payment_method} />
              <DetailRow label="Transaction Reference" value={payment.transaction_code} />
              <DetailRow label="Date of Payment" value={moment(payment.date_of_payment).format('DD MMMM YYYY')} />
              <DetailRow label="Date Verified" value={moment(payment.verified_at).format('DD MMMM YYYY')} />
              <DetailRow label="Verified By (Admin)" value={payment.verified_by} />
            </div>

            {/* Official Stamp */}
            <div className="flex justify-center py-5">
              <div className="relative w-28 h-28">
                <div className="w-28 h-28 rounded-full border-4 border-green-600 flex flex-col items-center justify-center text-green-600">
                  <span className="text-3xl font-black leading-none">✓</span>
                  <span className="text-xs font-black mt-0.5 tracking-widest">VERIFIED</span>
                  <span className="text-[8px] font-bold text-center leading-tight mt-0.5 opacity-70">RSA OFFICIAL</span>
                </div>
                <div className="absolute inset-0 rounded-full border-2 border-dashed border-green-400 animate-spin" style={{ animationDuration: '20s' }} />
              </div>
            </div>

            {/* Footer */}
            <div className="bg-gray-50 px-5 py-4 text-center">
              <p className="text-xs text-gray-500 leading-relaxed">
                This is an official digital receipt issued by the Rwanda Scouts Association.<br />
                Keep this document for your records.
              </p>
              <p className="text-[10px] text-gray-400 mt-2">
                Generated on {moment().format('DD MMMM YYYY [at] HH:mm')}
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}