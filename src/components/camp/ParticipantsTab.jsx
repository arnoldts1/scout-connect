import React, { useState } from 'react';
import { Plus, Trash2, Users, Search, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const ROLES = ['Scout', 'Patrol Leader', 'Assistant PL', 'Leader', 'Assistant Leader', 'Camp Director', 'Staff', 'Volunteer', 'Medical Officer'];

export default function ParticipantsTab({ participants, onChange }) {
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState(null);

  const addParticipant = () => {
    const np = {
      id: `p-${Date.now()}`,
      name: '', age: '', gender: '', patrol: '', role: 'Scout',
      emergency_contact: '', emergency_phone: '', medical_notes: '',
      fee_paid: false, attending: true
    };
    onChange([...participants, np]);
    setExpandedId(np.id);
  };

  const update = (id, field, value) => {
    onChange(participants.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  const remove = (id) => onChange(participants.filter(p => p.id !== id));

  const exportCSV = () => {
    const headers = ['Name', 'Age', 'Gender', 'Patrol', 'Role', 'Emergency Contact', 'Phone', 'Medical Notes', 'Fee Paid', 'Attending'];
    const rows = participants.map(p => [p.name, p.age, p.gender, p.patrol, p.role, p.emergency_contact, p.emergency_phone, p.medical_notes, p.fee_paid ? 'Yes' : 'No', p.attending ? 'Yes' : 'No']);
    const csv = [headers, ...rows].map(r => r.map(c => `"${c || ''}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'participants.csv'; a.click();
  };

  const filtered = participants.filter(p => p.name?.toLowerCase().includes(search.toLowerCase()) || p.patrol?.toLowerCase().includes(search.toLowerCase()));
  const feesPaid = participants.filter(p => p.fee_paid).length;
  const attending = participants.filter(p => p.attending).length;

  const genderGroups = participants.reduce((acc, p) => {
    const g = p.gender || 'Unknown';
    acc[g] = (acc[g] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-gray-900 rounded-xl border p-3 text-center">
          <p className="text-2xl font-bold text-primary">{participants.length}</p>
          <p className="text-xs text-gray-500">Total Registered</p>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-xl border p-3 text-center">
          <p className="text-2xl font-bold text-green-600">{attending}</p>
          <p className="text-xs text-gray-500">Attending</p>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-xl border p-3 text-center">
          <p className="text-2xl font-bold text-blue-600">{feesPaid}</p>
          <p className="text-xs text-gray-500">Fees Paid</p>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-xl border p-3 text-center">
          <p className="text-2xl font-bold text-orange-600">{participants.length - feesPaid}</p>
          <p className="text-xs text-gray-500">Fees Pending</p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex gap-3 flex-wrap">
        <div className="flex-1 relative min-w-48">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search participants..." className="pl-9 h-9" />
        </div>
        <Button variant="outline" size="sm" onClick={exportCSV}><Download className="w-4 h-4 mr-1" />Export CSV</Button>
        <Button size="sm" onClick={addParticipant}><Plus className="w-4 h-4 mr-1" />Add Participant</Button>
      </div>

      {/* List */}
      <div className="space-y-2">
        {filtered.map(p => (
          <div key={p.id} className="bg-white dark:bg-gray-900 rounded-xl border overflow-hidden">
            <div className="flex items-center gap-3 p-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800" onClick={() => setExpandedId(expandedId === p.id ? null : p.id)}>
              <div className="w-9 h-9 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold text-sm flex-shrink-0">
                {p.name ? p.name[0].toUpperCase() : '?'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{p.name || 'New Participant'}</p>
                <p className="text-xs text-gray-500">{p.role} {p.patrol ? `• ${p.patrol}` : ''} {p.age ? `• Age ${p.age}` : ''}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {p.fee_paid && <Badge className="bg-green-100 text-green-700 text-xs">Fee ✓</Badge>}
                {!p.attending && <Badge className="bg-red-100 text-red-700 text-xs">Absent</Badge>}
                <button onClick={e => { e.stopPropagation(); remove(p.id); }} className="text-red-400 hover:text-red-600 p-1">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {expandedId === p.id && (
              <div className="border-t p-3 grid grid-cols-2 md:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-gray-500">Full Name</label>
                  <Input value={p.name || ''} onChange={e => update(p.id, 'name', e.target.value)} className="h-8 mt-1 text-sm" />
                </div>
                <div>
                  <label className="text-xs text-gray-500">Age</label>
                  <Input type="number" value={p.age || ''} onChange={e => update(p.id, 'age', e.target.value)} className="h-8 mt-1 text-sm" />
                </div>
                <div>
                  <label className="text-xs text-gray-500">Gender</label>
                  <Select value={p.gender || ''} onValueChange={v => update(p.id, 'gender', v)}>
                    <SelectTrigger className="h-8 mt-1 text-xs"><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs text-gray-500">Patrol / Group</label>
                  <Input value={p.patrol || ''} onChange={e => update(p.id, 'patrol', e.target.value)} className="h-8 mt-1 text-sm" />
                </div>
                <div>
                  <label className="text-xs text-gray-500">Role</label>
                  <Select value={p.role || 'Scout'} onValueChange={v => update(p.id, 'role', v)}>
                    <SelectTrigger className="h-8 mt-1 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {ROLES.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs text-gray-500">Emergency Contact</label>
                  <Input value={p.emergency_contact || ''} onChange={e => update(p.id, 'emergency_contact', e.target.value)} className="h-8 mt-1 text-sm" />
                </div>
                <div>
                  <label className="text-xs text-gray-500">Emergency Phone</label>
                  <Input value={p.emergency_phone || ''} onChange={e => update(p.id, 'emergency_phone', e.target.value)} className="h-8 mt-1 text-sm" />
                </div>
                <div className="col-span-2">
                  <label className="text-xs text-gray-500">Medical Notes / Allergies</label>
                  <Input value={p.medical_notes || ''} onChange={e => update(p.id, 'medical_notes', e.target.value)} placeholder="Allergies, medications, conditions..." className="h-8 mt-1 text-sm" />
                </div>
                <div className="flex items-center gap-4 col-span-full">
                  <label className="flex items-center gap-2 cursor-pointer text-sm">
                    <input type="checkbox" checked={p.fee_paid || false} onChange={e => update(p.id, 'fee_paid', e.target.checked)} className="rounded" />
                    Fee Paid
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-sm">
                    <input type="checkbox" checked={p.attending !== false} onChange={e => update(p.id, 'attending', e.target.checked)} className="rounded" />
                    Attending
                  </label>
                </div>
              </div>
            )}
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="text-center py-10 text-gray-400">
            <Users className="w-10 h-10 mx-auto mb-2 opacity-40" />
            <p className="text-sm">{search ? 'No participants match your search' : 'No participants added yet'}</p>
          </div>
        )}
      </div>
    </div>
  );
}