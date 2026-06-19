import React, { useState, useMemo } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Clock, CheckCircle, XCircle, DollarSign } from 'lucide-react';

const StatCard = ({ icon: Icon, label, value, color }) => (
  <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-5 flex items-center gap-4">
    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${color}`}>
      <Icon className="w-6 h-6" />
    </div>
    <div>
      <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
      <p className="text-sm text-gray-500">{label}</p>
    </div>
  </div>
);

const STATUS_BADGE = {
  pending: 'bg-amber-100 text-amber-700 border-amber-200',
  verified: 'bg-green-100 text-green-700 border-green-200',
  rejected: 'bg-red-100 text-red-700 border-red-200'
};

export default function FinancialDashboard({ payments }) {
  const currentYear = new Date().getFullYear();
  const [filterYear, setFilterYear] = useState('all');
  const [filterUnit, setFilterUnit] = useState('all');

  const years = useMemo(() => {
    const ys = [...new Set(payments.map(p => p.year_of_payment))].sort((a, b) => b - a);
    return ys;
  }, [payments]);

  const units = useMemo(() => {
    return [...new Set(payments.map(p => p.unit_name).filter(Boolean))].sort();
  }, [payments]);

  const filtered = useMemo(() => {
    return payments.filter(p => {
      const yearMatch = filterYear === 'all' || p.year_of_payment?.toString() === filterYear;
      const unitMatch = filterUnit === 'all' || p.unit_name === filterUnit;
      return yearMatch && unitMatch;
    });
  }, [payments, filterYear, filterUnit]);

  const verified = filtered.filter(p => p.status === 'verified');
  const pending = filtered.filter(p => p.status === 'pending');
  const rejected = filtered.filter(p => p.status === 'rejected');
  const totalRevenue = verified.reduce((sum, p) => sum + (p.amount_paid || 0), 0);

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <Select value={filterYear} onValueChange={setFilterYear}>
          <SelectTrigger className="w-36"><SelectValue placeholder="Filter Year" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Years</SelectItem>
            {years.map(y => <SelectItem key={y} value={y.toString()}>{y}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterUnit} onValueChange={setFilterUnit}>
          <SelectTrigger className="w-48"><SelectValue placeholder="Filter Unit" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Units</SelectItem>
            {units.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={DollarSign} label="Total Revenue (Verified)" value={`${totalRevenue.toLocaleString()} RWF`} color="bg-emerald-100 text-emerald-600" />
        <StatCard icon={CheckCircle} label="Verified Payments" value={verified.length} color="bg-green-100 text-green-600" />
        <StatCard icon={Clock} label="Pending Payments" value={pending.length} color="bg-amber-100 text-amber-600" />
        <StatCard icon={XCircle} label="Rejected Payments" value={rejected.length} color="bg-red-100 text-red-600" />
      </div>

      {/* Payment Table */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 overflow-hidden">
        <div className="p-4 border-b border-gray-100 dark:border-gray-800">
          <h3 className="font-semibold text-gray-900 dark:text-white">Payment Records ({filtered.length})</h3>
        </div>
        <div className="divide-y dark:divide-gray-800 max-h-[400px] overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <TrendingUp className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p>No payment records found</p>
            </div>
          ) : (
            filtered.map(p => (
              <div key={p.id} className="flex items-center gap-3 px-4 py-3 text-sm">
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate text-gray-900 dark:text-white">{p.full_name}</p>
                  <p className="text-xs text-gray-400">{p.unit_name} · {p.year_of_payment}</p>
                </div>
                <span className="font-semibold text-gray-700 dark:text-gray-300 flex-shrink-0">{p.amount_paid?.toLocaleString()} RWF</span>
                <Badge className={`text-xs border flex-shrink-0 ${STATUS_BADGE[p.status]}`}>
                  {p.status.charAt(0).toUpperCase() + p.status.slice(1)}
                </Badge>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}