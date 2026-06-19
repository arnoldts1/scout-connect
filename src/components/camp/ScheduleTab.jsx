import React, { useState } from 'react';
import { Plus, Trash2, Clock, AlertCircle, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const ACTIVITY_TYPES = [
  { value: 'activity', label: 'Activity', color: 'bg-green-100 text-green-700' },
  { value: 'meal', label: 'Meal', color: 'bg-orange-100 text-orange-700' },
  { value: 'ceremony', label: 'Ceremony', color: 'bg-purple-100 text-purple-700' },
  { value: 'travel', label: 'Travel', color: 'bg-blue-100 text-blue-700' },
  { value: 'rest', label: 'Rest / Free Time', color: 'bg-gray-100 text-gray-700' },
  { value: 'training', label: 'Training', color: 'bg-yellow-100 text-yellow-700' },
  { value: 'emergency', label: 'Emergency Drill', color: 'bg-red-100 text-red-700' },
];

const toMins = (t) => {
  if (!t) return 0;
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
};

const detectConflicts = (activities) => {
  const sorted = [...activities].sort((a, b) => toMins(a.time) - toMins(b.time));
  const conflicts = new Set();
  for (let i = 0; i < sorted.length - 1; i++) {
    const a = sorted[i];
    const b = sorted[i + 1];
    if (a.end_time && toMins(a.end_time) > toMins(b.time)) {
      conflicts.add(a.time + a.activity);
      conflicts.add(b.time + b.activity);
    }
  }
  return conflicts;
};

export default function ScheduleTab({ schedule, onChange }) {
  const [expandedDay, setExpandedDay] = useState(0);

  const addDay = () => {
    onChange([...schedule, { day: schedule.length + 1, date: '', activities: [] }]);
  };

  const removeDay = (dayIdx) => {
    onChange(schedule.filter((_, i) => i !== dayIdx).map((d, i) => ({ ...d, day: i + 1 })));
  };

  const updateDay = (dayIdx, field, value) => {
    const s = [...schedule];
    s[dayIdx] = { ...s[dayIdx], [field]: value };
    onChange(s);
  };

  const addActivity = (dayIdx) => {
    const s = [...schedule];
    s[dayIdx].activities = [...(s[dayIdx].activities || []), { time: '', end_time: '', activity: '', location: '', responsible: '', type: 'activity', notes: '' }];
    onChange(s);
  };

  const updateActivity = (dayIdx, actIdx, field, value) => {
    const s = [...schedule];
    s[dayIdx].activities[actIdx] = { ...s[dayIdx].activities[actIdx], [field]: value };
    onChange(s);
  };

  const removeActivity = (dayIdx, actIdx) => {
    const s = [...schedule];
    s[dayIdx].activities = s[dayIdx].activities.filter((_, i) => i !== actIdx);
    onChange(s);
  };

  const moveActivity = (dayIdx, actIdx, direction) => {
    const s = [...schedule];
    const acts = [...s[dayIdx].activities];
    const target = actIdx + direction;
    if (target < 0 || target >= acts.length) return;
    [acts[actIdx], acts[target]] = [acts[target], acts[actIdx]];
    s[dayIdx].activities = acts;
    onChange(s);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold text-gray-700 dark:text-gray-300">Daily Schedule</h3>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => window.print()}><Printer className="w-4 h-4 mr-1" />Print</Button>
          <Button size="sm" onClick={addDay}><Plus className="w-4 h-4 mr-1" />Add Day</Button>
        </div>
      </div>

      {schedule.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <Clock className="w-10 h-10 mx-auto mb-2 opacity-40" />
          <p>No schedule yet. Click "Add Day" to start.</p>
        </div>
      )}

      {schedule.map((day, dayIdx) => {
        const conflicts = detectConflicts(day.activities || []);
        const hasConflicts = conflicts.size > 0;
        const isExpanded = expandedDay === dayIdx;

        return (
          <div key={dayIdx} className="bg-white dark:bg-gray-900 rounded-xl border overflow-hidden">
            <div
              className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
              onClick={() => setExpandedDay(isExpanded ? -1 : dayIdx)}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
                  {day.day}
                </div>
                <div>
                  <h4 className="font-semibold">Day {day.day}</h4>
                  {day.date && <p className="text-xs text-gray-500">{day.date}</p>}
                </div>
                <Badge variant="outline" className="text-xs">{(day.activities || []).length} activities</Badge>
                {hasConflicts && <Badge className="bg-red-100 text-red-700 text-xs"><AlertCircle className="w-3 h-3 mr-1" />Conflicts</Badge>}
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={e => { e.stopPropagation(); removeDay(dayIdx); }} className="text-red-500 hover:text-red-700 h-7 px-2">
                  <Trash2 className="w-3 h-3" />
                </Button>
                <span className="text-gray-400 text-sm">{isExpanded ? '▲' : '▼'}</span>
              </div>
            </div>

            {isExpanded && (
              <div className="border-t p-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Date</Label>
                    <Input type="date" value={day.date || ''} onChange={e => updateDay(dayIdx, 'date', e.target.value)} className="h-8 mt-1" />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="grid grid-cols-12 gap-2 text-xs text-gray-500 font-medium px-1">
                    <span className="col-span-1">Start</span>
                    <span className="col-span-1">End</span>
                    <span className="col-span-3">Activity</span>
                    <span className="col-span-2">Type</span>
                    <span className="col-span-2">Location</span>
                    <span className="col-span-2">Responsible</span>
                    <span className="col-span-1"></span>
                  </div>
                  {(day.activities || []).map((act, actIdx) => {
                    const isConflict = conflicts.has(act.time + act.activity);
                    return (
                      <div key={actIdx} className={`grid grid-cols-12 gap-2 items-center p-1 rounded ${isConflict ? 'bg-red-50 dark:bg-red-900/20' : ''}`}>
                        <Input type="time" value={act.time} onChange={e => updateActivity(dayIdx, actIdx, 'time', e.target.value)} className="col-span-1 h-8 text-xs" />
                        <Input type="time" value={act.end_time || ''} onChange={e => updateActivity(dayIdx, actIdx, 'end_time', e.target.value)} className="col-span-1 h-8 text-xs" />
                        <Input value={act.activity} onChange={e => updateActivity(dayIdx, actIdx, 'activity', e.target.value)} placeholder="Activity" className="col-span-3 h-8 text-sm" />
                        <Select value={act.type || 'activity'} onValueChange={v => updateActivity(dayIdx, actIdx, 'type', v)}>
                          <SelectTrigger className="col-span-2 h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {ACTIVITY_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                          </SelectContent>
                        </Select>
                        <Input value={act.location || ''} onChange={e => updateActivity(dayIdx, actIdx, 'location', e.target.value)} placeholder="Location" className="col-span-2 h-8 text-xs" />
                        <Input value={act.responsible || ''} onChange={e => updateActivity(dayIdx, actIdx, 'responsible', e.target.value)} placeholder="Who" className="col-span-2 h-8 text-xs" />
                        <Button variant="ghost" size="icon" className="col-span-1 h-8 w-8" onClick={() => removeActivity(dayIdx, actIdx)}>
                          <Trash2 className="w-3 h-3 text-red-500" />
                        </Button>
                      </div>
                    );
                  })}
                </div>

                <Button variant="outline" size="sm" onClick={() => addActivity(dayIdx)}>
                  <Plus className="w-3 h-3 mr-1" />Add Activity
                </Button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}