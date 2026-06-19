import React, { useState } from 'react';
import { Plus, Trash2, TrendingUp, TrendingDown, DollarSign, AlertTriangle, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const EXPENSE_CATEGORIES = [
  { value: 'food', label: '🍽️ Food', color: 'bg-orange-100 text-orange-700' },
  { value: 'transport', label: '🚌 Transport', color: 'bg-blue-100 text-blue-700' },
  { value: 'equipment', label: '🏕️ Equipment', color: 'bg-green-100 text-green-700' },
  { value: 'accommodation', label: '🏠 Accommodation', color: 'bg-purple-100 text-purple-700' },
  { value: 'activities', label: '⚽ Activities', color: 'bg-yellow-100 text-yellow-700' },
  { value: 'emergency', label: '🚨 Emergency Fund', color: 'bg-red-100 text-red-700' },
  { value: 'miscellaneous', label: '📦 Miscellaneous', color: 'bg-gray-100 text-gray-700' },
];

const INCOME_TYPES = [
  { value: 'participant_fee', label: '👤 Participant Fee' },
  { value: 'donation', label: '🎁 Donation' },
  { value: 'sponsorship', label: '🏆 Sponsorship' },
  { value: 'other', label: '📋 Other' },
];

export default function BudgetTab({ budget, participantsCount, onChange }) {
  const [activeSection, setActiveSection] = useState('expenses');

  const items = budget?.items || [];
  const income = budget?.income || [];
  const currency = budget?.currency || 'RWF';

  const totalEstimated = items.reduce((s, i) => s + (i.estimated || 0), 0);
  const totalActual = items.reduce((s, i) => s + (i.actual || 0), 0);
  const totalIncome = income.reduce((s, i) => s + (i.amount || 0), 0);
  const netBalance = totalIncome - totalActual;
  const costPerPerson = participantsCount > 0 ? totalEstimated / participantsCount : 0;
  const overBudget = totalActual > totalEstimated && totalEstimated > 0;

  const updateBudget = (updates) => onChange({ ...budget, ...updates });

  const addExpense = () => {
    updateBudget({ items: [...items, { name: '', category: 'miscellaneous', estimated: 0, actual: 0, notes: '' }] });
  };

  const updateExpense = (idx, field, value) => {
    const newItems = [...items];
    newItems[idx] = { ...newItems[idx], [field]: ['estimated', 'actual'].includes(field) ? parseFloat(value) || 0 : value };
    updateBudget({ items: newItems, total: newItems.reduce((s, i) => s + (i.actual || 0), 0) });
  };

  const removeExpense = (idx) => {
    const newItems = items.filter((_, i) => i !== idx);
    updateBudget({ items: newItems, total: newItems.reduce((s, i) => s + (i.actual || 0), 0) });
  };

  const addIncome = () => {
    updateBudget({ income: [...income, { source: '', type: 'participant_fee', amount: 0, received: false }] });
  };

  const updateIncome = (idx, field, value) => {
    const newIncome = [...income];
    newIncome[idx] = { ...newIncome[idx], [field]: field === 'amount' ? parseFloat(value) || 0 : field === 'received' ? value : value };
    updateBudget({ income: newIncome });
  };

  const removeIncome = (idx) => {
    updateBudget({ income: income.filter((_, i) => i !== idx) });
  };

  const handlePrint = () => window.print();

  const catTotals = EXPENSE_CATEGORIES.map(cat => ({
    ...cat,
    estimated: items.filter(i => i.category === cat.value).reduce((s, i) => s + (i.estimated || 0), 0),
    actual: items.filter(i => i.category === cat.value).reduce((s, i) => s + (i.actual || 0), 0),
  })).filter(c => c.estimated > 0 || c.actual > 0);

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-gray-900 rounded-xl border p-4">
          <p className="text-xs text-gray-500">Estimated Budget</p>
          <p className="text-xl font-bold text-blue-600">{totalEstimated.toLocaleString()} {currency}</p>
        </div>
        <div className={`rounded-xl border p-4 ${overBudget ? 'bg-red-50 dark:bg-red-900/20' : 'bg-white dark:bg-gray-900'}`}>
          <p className="text-xs text-gray-500">Actual Spent</p>
          <div className="flex items-center gap-1">
            {overBudget && <AlertTriangle className="w-4 h-4 text-red-500" />}
            <p className={`text-xl font-bold ${overBudget ? 'text-red-600' : 'text-green-600'}`}>{totalActual.toLocaleString()} {currency}</p>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-xl border p-4">
          <p className="text-xs text-gray-500">Total Income</p>
          <p className="text-xl font-bold text-purple-600">{totalIncome.toLocaleString()} {currency}</p>
        </div>
        <div className={`rounded-xl border p-4 ${netBalance >= 0 ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'}`}>
          <p className="text-xs text-gray-500">Net Balance</p>
          <p className={`text-xl font-bold ${netBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>{netBalance.toLocaleString()} {currency}</p>
        </div>
      </div>

      {/* Cost per Participant */}
      {participantsCount > 0 && (
        <div className="bg-teal-50 dark:bg-teal-900/20 rounded-xl border border-teal-200 p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-teal-600" />
            <span className="font-medium text-teal-800 dark:text-teal-200">Cost per Participant</span>
          </div>
          <span className="text-lg font-bold text-teal-700">{costPerPerson.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',')} {currency}</span>
        </div>
      )}

      {/* Budget Progress */}
      {totalEstimated > 0 && (
        <div className="bg-white dark:bg-gray-900 rounded-xl border p-4">
          <div className="flex justify-between text-sm mb-2">
            <span className="font-medium">Budget Usage</span>
            <span className={overBudget ? 'text-red-600 font-bold' : 'text-gray-600'}>{Math.round((totalActual / totalEstimated) * 100)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className={`h-3 rounded-full transition-all ${overBudget ? 'bg-red-500' : totalActual / totalEstimated > 0.8 ? 'bg-yellow-500' : 'bg-green-500'}`}
              style={{ width: `${Math.min((totalActual / totalEstimated) * 100, 100)}%` }}
            />
          </div>
          {overBudget && (
            <p className="text-red-600 text-sm mt-2 flex items-center gap-1">
              <AlertTriangle className="w-4 h-4" /> Over budget by {(totalActual - totalEstimated).toLocaleString()} {currency}
            </p>
          )}
        </div>
      )}

      {/* Category Breakdown */}
      {catTotals.length > 0 && (
        <div className="bg-white dark:bg-gray-900 rounded-xl border p-4">
          <h4 className="font-semibold mb-3">Category Breakdown</h4>
          <div className="space-y-2">
            {catTotals.map(cat => (
              <div key={cat.value} className="flex items-center gap-3">
                <Badge className={`text-xs w-32 justify-center ${cat.color}`}>{cat.label}</Badge>
                <div className="flex-1 bg-gray-100 rounded-full h-2">
                  <div className="bg-primary h-2 rounded-full" style={{ width: totalEstimated > 0 ? `${Math.min((cat.actual / totalEstimated) * 100, 100)}%` : '0%' }} />
                </div>
                <span className="text-xs text-gray-600 w-24 text-right">{cat.actual.toLocaleString()} / {cat.estimated.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        <button onClick={() => setActiveSection('expenses')} className={`pb-2 px-1 text-sm font-medium border-b-2 transition-colors ${activeSection === 'expenses' ? 'border-primary text-primary' : 'border-transparent text-gray-500'}`}>
          Expenses
        </button>
        <button onClick={() => setActiveSection('income')} className={`pb-2 px-1 text-sm font-medium border-b-2 transition-colors ${activeSection === 'income' ? 'border-primary text-primary' : 'border-transparent text-gray-500'}`}>
          Income
        </button>
      </div>

      {activeSection === 'expenses' && (
        <div className="bg-white dark:bg-gray-900 rounded-xl border p-4 space-y-3">
          <div className="flex justify-between items-center">
            <h4 className="font-semibold">Expense Items</h4>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handlePrint}><Printer className="w-4 h-4 mr-1" />Print</Button>
              <Button size="sm" onClick={addExpense}><Plus className="w-4 h-4 mr-1" />Add</Button>
            </div>
          </div>
          <div className="grid grid-cols-12 gap-2 text-xs text-gray-500 font-medium px-1">
            <span className="col-span-4">Item</span>
            <span className="col-span-2">Category</span>
            <span className="col-span-2">Estimated</span>
            <span className="col-span-2">Actual</span>
            <span className="col-span-1">Notes</span>
            <span className="col-span-1"></span>
          </div>
          {items.map((item, idx) => (
            <div key={idx} className="grid grid-cols-12 gap-2 items-center">
              <Input value={item.name} onChange={e => updateExpense(idx, 'name', e.target.value)} placeholder="Item name" className="col-span-4 h-8 text-sm" />
              <Select value={item.category} onValueChange={v => updateExpense(idx, 'category', v)}>
                <SelectTrigger className="col-span-2 h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EXPENSE_CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                </SelectContent>
              </Select>
              <Input type="number" value={item.estimated} onChange={e => updateExpense(idx, 'estimated', e.target.value)} className="col-span-2 h-8 text-sm" />
              <Input type="number" value={item.actual} onChange={e => updateExpense(idx, 'actual', e.target.value)} className="col-span-2 h-8 text-sm" />
              <Input value={item.notes || ''} onChange={e => updateExpense(idx, 'notes', e.target.value)} placeholder="Notes" className="col-span-1 h-8 text-xs" />
              <Button variant="ghost" size="icon" className="col-span-1 h-8 w-8" onClick={() => removeExpense(idx)}>
                <Trash2 className="w-3 h-3 text-red-500" />
              </Button>
            </div>
          ))}
          {items.length === 0 && <p className="text-center text-gray-400 py-4 text-sm">No expenses added yet</p>}
        </div>
      )}

      {activeSection === 'income' && (
        <div className="bg-white dark:bg-gray-900 rounded-xl border p-4 space-y-3">
          <div className="flex justify-between items-center">
            <h4 className="font-semibold">Income Sources</h4>
            <Button size="sm" onClick={addIncome}><Plus className="w-4 h-4 mr-1" />Add</Button>
          </div>
          {income.map((inc, idx) => (
            <div key={idx} className="grid grid-cols-12 gap-2 items-center">
              <Input value={inc.source} onChange={e => updateIncome(idx, 'source', e.target.value)} placeholder="Source name" className="col-span-4 h-8 text-sm" />
              <Select value={inc.type} onValueChange={v => updateIncome(idx, 'type', v)}>
                <SelectTrigger className="col-span-3 h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {INCOME_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
              <Input type="number" value={inc.amount} onChange={e => updateIncome(idx, 'amount', e.target.value)} placeholder="Amount" className="col-span-2 h-8 text-sm" />
              <label className="col-span-2 flex items-center gap-1 text-xs cursor-pointer">
                <input type="checkbox" checked={inc.received || false} onChange={e => updateIncome(idx, 'received', e.target.checked)} className="rounded" />
                Received
              </label>
              <Button variant="ghost" size="icon" className="col-span-1 h-8 w-8" onClick={() => removeIncome(idx)}>
                <Trash2 className="w-3 h-3 text-red-500" />
              </Button>
            </div>
          ))}
          {income.length === 0 && <p className="text-center text-gray-400 py-4 text-sm">No income sources added yet</p>}
        </div>
      )}
    </div>
  );
}