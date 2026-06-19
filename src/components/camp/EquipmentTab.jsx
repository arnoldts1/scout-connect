import React, { useState } from 'react';
import { Plus, Trash2, Package, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const CATEGORIES = ['Shelter', 'Cooking', 'First Aid', 'Navigation', 'Tools', 'Clothing', 'Safety', 'Activities', 'Transport', 'Communication', 'Other'];
const STATUS_COLORS = {
  available: 'bg-green-100 text-green-700',
  borrowed: 'bg-blue-100 text-blue-700',
  damaged: 'bg-red-100 text-red-700',
  missing: 'bg-gray-100 text-gray-700',
};

export default function EquipmentTab({ equipment, onChange }) {
  const [filterCat, setFilterCat] = useState('all');

  const add = () => {
    onChange([...equipment, {
      id: `eq-${Date.now()}`,
      name: '', category: 'Other',
      quantity_needed: 1, quantity_available: 1,
      status: 'available', assigned_to: '', notes: ''
    }]);
  };

  const update = (id, field, value) => {
    onChange(equipment.map(e => e.id === id ? { ...e, [field]: ['quantity_needed', 'quantity_available'].includes(field) ? parseInt(value) || 0 : value } : e));
  };

  const remove = (id) => onChange(equipment.filter(e => e.id !== id));

  const filtered = filterCat === 'all' ? equipment : equipment.filter(e => e.category === filterCat);

  const summary = {
    total: equipment.length,
    available: equipment.filter(e => e.status === 'available').length,
    borrowed: equipment.filter(e => e.status === 'borrowed').length,
    damaged: equipment.filter(e => e.status === 'damaged').length,
    missing: equipment.filter(e => e.status === 'missing').length,
  };

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {Object.entries(summary).map(([k, v]) => (
          <div key={k} className="bg-white dark:bg-gray-900 rounded-xl border p-3 text-center">
            <p className="text-xl font-bold">{v}</p>
            <p className="text-xs text-gray-500 capitalize">{k}</p>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div className="flex justify-between items-center flex-wrap gap-2">
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => setFilterCat('all')} className={`px-3 py-1 rounded-full text-xs font-medium ${filterCat === 'all' ? 'bg-primary text-primary-foreground' : 'bg-gray-100 text-gray-600'}`}>All</button>
          {CATEGORIES.map(c => (
            <button key={c} onClick={() => setFilterCat(c)} className={`px-3 py-1 rounded-full text-xs font-medium ${filterCat === c ? 'bg-primary text-primary-foreground' : 'bg-gray-100 text-gray-600'}`}>{c}</button>
          ))}
        </div>
        <Button size="sm" onClick={add}><Plus className="w-4 h-4 mr-1" />Add Item</Button>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="text-left px-4 py-2 text-xs text-gray-500 font-medium">Item</th>
                <th className="text-left px-3 py-2 text-xs text-gray-500 font-medium">Category</th>
                <th className="text-left px-3 py-2 text-xs text-gray-500 font-medium">Need</th>
                <th className="text-left px-3 py-2 text-xs text-gray-500 font-medium">Have</th>
                <th className="text-left px-3 py-2 text-xs text-gray-500 font-medium">Status</th>
                <th className="text-left px-3 py-2 text-xs text-gray-500 font-medium">Assigned To</th>
                <th className="text-left px-3 py-2 text-xs text-gray-500 font-medium">Notes</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {filtered.map(item => (
                <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="px-4 py-2">
                    <Input value={item.name} onChange={e => update(item.id, 'name', e.target.value)} placeholder="Item name" className="h-7 text-sm border-0 p-0 bg-transparent focus-visible:ring-0" />
                  </td>
                  <td className="px-3 py-2">
                    <Select value={item.category} onValueChange={v => update(item.id, 'category', v)}>
                      <SelectTrigger className="h-7 text-xs w-28 border-0 bg-transparent"><SelectValue /></SelectTrigger>
                      <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                    </Select>
                  </td>
                  <td className="px-3 py-2">
                    <Input type="number" value={item.quantity_needed} onChange={e => update(item.id, 'quantity_needed', e.target.value)} className="h-7 text-sm w-16 border-0 p-0 bg-transparent focus-visible:ring-0" />
                  </td>
                  <td className="px-3 py-2">
                    <Input type="number" value={item.quantity_available} onChange={e => update(item.id, 'quantity_available', e.target.value)} className={`h-7 text-sm w-16 border-0 p-0 bg-transparent focus-visible:ring-0 ${item.quantity_available < item.quantity_needed ? 'text-red-500 font-bold' : ''}`} />
                  </td>
                  <td className="px-3 py-2">
                    <Select value={item.status} onValueChange={v => update(item.id, 'status', v)}>
                      <SelectTrigger className="h-7 text-xs w-24 border-0 bg-transparent p-0"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="available">Available</SelectItem>
                        <SelectItem value="borrowed">Borrowed</SelectItem>
                        <SelectItem value="damaged">Damaged</SelectItem>
                        <SelectItem value="missing">Missing</SelectItem>
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="px-3 py-2">
                    <Input value={item.assigned_to || ''} onChange={e => update(item.id, 'assigned_to', e.target.value)} placeholder="Person/patrol" className="h-7 text-xs border-0 p-0 bg-transparent focus-visible:ring-0" />
                  </td>
                  <td className="px-3 py-2">
                    <Input value={item.notes || ''} onChange={e => update(item.id, 'notes', e.target.value)} placeholder="Notes" className="h-7 text-xs border-0 p-0 bg-transparent focus-visible:ring-0" />
                  </td>
                  <td className="px-3 py-2">
                    <button onClick={() => remove(item.id)} className="text-red-400 hover:text-red-600">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="text-center py-10 text-gray-400">
              <Package className="w-10 h-10 mx-auto mb-2 opacity-40" />
              <p className="text-sm">No equipment items yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}