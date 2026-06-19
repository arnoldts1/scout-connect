import React from 'react';
import { Users, DollarSign, CheckSquare, Package, ShieldAlert, Calendar, TrendingUp, AlertTriangle, Megaphone, Plus, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

function MetricCard({ icon: Icon, label, value, sub, color = 'text-primary' }) {
  return (
  <div className="bg-white dark:bg-gray-900 rounded-xl border p-4">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className={`text-2xl font-bold ${color}`}>{value}</p>
        {sub && <p className="text-xs text-gray-500 mt-0.5">{sub}</p>}
      </div>
      <div className={`w-10 h-10 rounded-full bg-gray-50 dark:bg-gray-800 flex items-center justify-center ${color}`}>
        {Icon && <Icon className="w-5 h-5" />}
      </div>
    </div>
  </div>
  );
}

export default function OverviewTab({ formData, onUpdate }) {
  const budget = formData.budget || {};
  const tasks = formData.tasks || [];
  const participants = formData.participants || [];
  const equipment = formData.equipment || [];
  const risks = formData.risks || [];
  const announcements = formData.announcements || [];

  const totalActual = (budget.items || []).reduce((s, i) => s + (i.actual || 0), 0);
  const totalEstimated = (budget.items || []).reduce((s, i) => s + (i.estimated || 0), 0);
  const tasksDone = tasks.filter(t => t.status === 'done').length;
  const tasksPct = tasks.length > 0 ? Math.round((tasksDone / tasks.length) * 100) : 0;
  const criticalRisks = risks.filter(r => {
    const s = { low: 1, medium: 2, high: 3, critical: 4 };
    return s[r.likelihood] * s[r.severity] >= 9;
  }).length;

  // Camp readiness score
  const scores = [
    formData.title ? 10 : 0,
    formData.start_date && formData.end_date ? 10 : 0,
    formData.location ? 10 : 0,
    participants.length > 0 ? 15 : 0,
    tasks.length > 0 ? 10 : 0,
    tasksPct > 50 ? 10 : 5,
    equipment.length > 0 ? 10 : 0,
    risks.length > 0 ? 10 : 0,
    totalEstimated > 0 ? 10 : 0,
    (formData.schedule || []).length > 0 ? 5 : 0,
  ];
  const readiness = scores.reduce((a, b) => a + b, 0);
  const readinessColor = readiness >= 80 ? 'text-green-600' : readiness >= 50 ? 'text-yellow-600' : 'text-red-600';

  const addAnnouncement = () => {
    const ann = { id: `ann-${Date.now()}`, title: '', message: '', priority: 'normal', created_at: new Date().toISOString() };
    onUpdate('announcements', [...announcements, ann]);
  };

  const updateAnn = (id, field, value) => {
    onUpdate('announcements', announcements.map(a => a.id === id ? { ...a, [field]: value } : a));
  };

  const removeAnn = (id) => onUpdate('announcements', announcements.filter(a => a.id !== id));

  return (
    <div className="space-y-5">
      {/* Readiness Score */}
      <div className="bg-gradient-to-br from-teal-50 to-green-50 dark:from-teal-900/20 dark:to-green-900/20 rounded-xl border border-teal-200 p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-teal-800 dark:text-teal-200">Camp Readiness Score</h3>
          <span className={`text-3xl font-bold ${readinessColor}`}>{readiness}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-4">
          <div className={`h-4 rounded-full transition-all ${readiness >= 80 ? 'bg-green-500' : readiness >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: `${readiness}%` }} />
        </div>
        <p className="text-xs text-teal-700 dark:text-teal-300 mt-2">
          {readiness >= 80 ? '✅ Camp is well prepared!' : readiness >= 50 ? '⚠️ Good progress — a few more items needed.' : '🔴 More planning required before camp.'}
        </p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <MetricCard icon={Users} label="Participants" value={participants.length} sub={`${participants.filter(p => p.attending !== false).length} attending`} />
        <MetricCard icon={DollarSign} label="Budget Used" value={`${totalActual.toLocaleString()}`} sub={`of ${totalEstimated.toLocaleString()} estimated`} color={totalActual > totalEstimated && totalEstimated > 0 ? 'text-red-600' : 'text-green-600'} />
        <MetricCard icon={CheckSquare} label="Tasks" value={`${tasksDone}/${tasks.length}`} sub={`${tasksPct}% complete`} color={tasksPct >= 80 ? 'text-green-600' : 'text-yellow-600'} />
        <MetricCard icon={Package} label="Equipment" value={equipment.length} sub={`${equipment.filter(e => e.status === 'available').length} available`} />
        <MetricCard icon={ShieldAlert} label="Risks" value={risks.length} sub={`${criticalRisks} critical`} color={criticalRisks > 0 ? 'text-red-600' : 'text-green-600'} />
        <MetricCard icon={Calendar} label="Schedule Days" value={(formData.schedule || []).length} sub={`${(formData.schedule || []).reduce((s, d) => s + (d.activities || []).length, 0)} activities`} />
      </div>

      {/* Pending Tasks */}
      {tasks.filter(t => t.status !== 'done').length > 0 && (
        <div className="bg-white dark:bg-gray-900 rounded-xl border p-4">
          <h4 className="font-semibold mb-3 flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-yellow-500" />Pending Tasks</h4>
          <div className="space-y-2">
            {tasks.filter(t => t.status !== 'done').slice(0, 5).map(t => (
              <div key={t.id} className="flex items-center gap-3 text-sm">
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${t.priority === 'urgent' ? 'bg-red-500' : t.priority === 'high' ? 'bg-orange-500' : 'bg-gray-300'}`} />
                <span className="flex-1 truncate">{t.title || 'Untitled task'}</span>
                <span className="text-xs text-gray-500">{t.assigned_to || 'Unassigned'}</span>
              </div>
            ))}
            {tasks.filter(t => t.status !== 'done').length > 5 && (
              <p className="text-xs text-gray-500">+{tasks.filter(t => t.status !== 'done').length - 5} more tasks</p>
            )}
          </div>
        </div>
      )}

      {/* Announcements */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border p-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-semibold flex items-center gap-2"><Megaphone className="w-4 h-4 text-blue-500" />Announcements</h4>
          <Button size="sm" variant="outline" onClick={addAnnouncement}><Plus className="w-3 h-3 mr-1" />Add</Button>
        </div>
        <div className="space-y-3">
          {announcements.map(ann => (
            <div key={ann.id} className={`rounded-lg border p-3 ${ann.priority === 'emergency' ? 'border-red-300 bg-red-50' : ann.priority === 'important' ? 'border-yellow-300 bg-yellow-50' : 'border-gray-200'}`}>
              <div className="flex gap-2 mb-2">
                <Input value={ann.title} onChange={e => updateAnn(ann.id, 'title', e.target.value)} placeholder="Announcement title" className="h-7 text-sm font-medium flex-1" />
                <Select value={ann.priority} onValueChange={v => updateAnn(ann.id, 'priority', v)}>
                  <SelectTrigger className="h-7 text-xs w-28"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="important">Important</SelectItem>
                    <SelectItem value="emergency">Emergency</SelectItem>
                  </SelectContent>
                </Select>
                <button onClick={() => removeAnn(ann.id)} className="text-red-400 hover:text-red-600">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <Textarea value={ann.message} onChange={e => updateAnn(ann.id, 'message', e.target.value)} placeholder="Announcement message..." className="text-sm resize-none h-16" />
            </div>
          ))}
          {announcements.length === 0 && <p className="text-sm text-gray-400 text-center py-2">No announcements yet</p>}
        </div>
      </div>

      {/* Weather & Contingency */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-gray-900 rounded-xl border p-4">
          <h4 className="font-semibold mb-2 text-sm flex items-center gap-2">🌤️ Weather Notes</h4>
          <Textarea
            value={formData.weather_notes || ''}
            onChange={e => onUpdate('weather_notes', e.target.value)}
            placeholder="Weather forecast, environmental conditions, seasonal considerations..."
            className="text-sm resize-none h-24"
          />
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-xl border p-4">
          <h4 className="font-semibold mb-2 text-sm flex items-center gap-2">🔄 Contingency Plan</h4>
          <Textarea
            value={formData.contingency_plan || ''}
            onChange={e => onUpdate('contingency_plan', e.target.value)}
            placeholder="Rain plans, emergency procedures, backup activities..."
            className="text-sm resize-none h-24"
          />
        </div>
      </div>
    </div>
  );
}