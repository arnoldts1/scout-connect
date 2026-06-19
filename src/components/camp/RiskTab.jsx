import React from 'react';
import { Plus, Trash2, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

const RISK_SCORE = { low: 1, medium: 2, high: 3, critical: 4 };
const riskLevel = (likelihood, severity) => {
  const score = RISK_SCORE[likelihood] * RISK_SCORE[severity];
  if (score >= 9) return { label: 'CRITICAL', color: 'bg-red-600 text-white' };
  if (score >= 6) return { label: 'HIGH', color: 'bg-orange-500 text-white' };
  if (score >= 3) return { label: 'MEDIUM', color: 'bg-yellow-500 text-white' };
  return { label: 'LOW', color: 'bg-green-500 text-white' };
};

export default function RiskTab({ risks, onChange }) {
  const add = () => {
    onChange([...risks, {
      id: `risk-${Date.now()}`,
      hazard: '', likelihood: 'low', severity: 'low',
      mitigation: '', responsible: '', status: 'open'
    }]);
  };

  const update = (id, field, value) => onChange(risks.map(r => r.id === id ? { ...r, [field]: value } : r));
  const remove = (id) => onChange(risks.filter(r => r.id !== id));

  const criticalRisks = risks.filter(r => {
    const score = RISK_SCORE[r.likelihood] * RISK_SCORE[r.severity];
    return score >= 9;
  });

  return (
    <div className="space-y-4">
      {criticalRisks.length > 0 && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <ShieldAlert className="w-5 h-5 text-red-600" />
            <span className="font-semibold text-red-700">Critical Risks Identified ({criticalRisks.length})</span>
          </div>
          <ul className="text-sm text-red-600 space-y-1">
            {criticalRisks.map(r => <li key={r.id}>• {r.hazard || 'Unnamed hazard'}</li>)}
          </ul>
        </div>
      )}

      <div className="flex justify-between items-center">
        <div className="text-sm text-gray-500">{risks.length} risks identified • {risks.filter(r => r.status === 'open').length} open</div>
        <Button size="sm" onClick={add}><Plus className="w-4 h-4 mr-1" />Add Risk</Button>
      </div>

      <div className="space-y-3">
        {risks.map(risk => {
          const level = riskLevel(risk.likelihood, risk.severity);
          return (
            <div key={risk.id} className="bg-white dark:bg-gray-900 rounded-xl border p-4 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <Input
                    value={risk.hazard}
                    onChange={e => update(risk.id, 'hazard', e.target.value)}
                    placeholder="Describe the hazard / risk..."
                    className="font-medium text-sm h-8"
                  />
                </div>
                <Badge className={`text-xs ${level.color} flex-shrink-0`}>{level.label}</Badge>
                <button onClick={() => remove(risk.id)} className="text-red-400 hover:text-red-600 flex-shrink-0">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <label className="text-xs text-gray-500">Likelihood</label>
                  <Select value={risk.likelihood} onValueChange={v => update(risk.id, 'likelihood', v)}>
                    <SelectTrigger className="h-8 mt-1 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs text-gray-500">Severity</label>
                  <Select value={risk.severity} onValueChange={v => update(risk.id, 'severity', v)}>
                    <SelectTrigger className="h-8 mt-1 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs text-gray-500">Responsible</label>
                  <Input value={risk.responsible || ''} onChange={e => update(risk.id, 'responsible', e.target.value)} placeholder="Who handles it" className="h-8 mt-1 text-xs" />
                </div>
                <div>
                  <label className="text-xs text-gray-500">Status</label>
                  <Select value={risk.status} onValueChange={v => update(risk.id, 'status', v)}>
                    <SelectTrigger className="h-8 mt-1 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="mitigated">Mitigated</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <label className="text-xs text-gray-500">Mitigation Measures</label>
                <Input value={risk.mitigation || ''} onChange={e => update(risk.id, 'mitigation', e.target.value)} placeholder="How will this risk be managed?" className="h-8 mt-1 text-sm" />
              </div>
            </div>
          );
        })}
        {risks.length === 0 && (
          <div className="text-center py-10 text-gray-400">
            <ShieldAlert className="w-10 h-10 mx-auto mb-2 opacity-40" />
            <p className="text-sm">No risks registered yet. Add risks to build your risk register.</p>
          </div>
        )}
      </div>
    </div>
  );
}