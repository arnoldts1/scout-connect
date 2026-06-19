import React, { useState } from 'react';
import { Plus, Trash2, CheckCircle2, Circle, Clock, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const PRIORITIES = [
  { value: 'low', label: 'Low', color: 'bg-gray-100 text-gray-600' },
  { value: 'medium', label: 'Medium', color: 'bg-yellow-100 text-yellow-700' },
  { value: 'high', label: 'High', color: 'bg-orange-100 text-orange-700' },
  { value: 'urgent', label: 'Urgent', color: 'bg-red-100 text-red-700' },
];

const ROLES = ['Camp Director', 'Treasurer', 'Quartermaster', 'Health Officer', 'Activity Coordinator', 'Patrol Leader', 'Staff', 'Volunteer'];
const CATEGORIES = ['Planning', 'Equipment', 'Food', 'Transport', 'Safety', 'Activities', 'Administration', 'Communication'];

const statusIcon = (status) => {
  if (status === 'done') return <CheckCircle2 className="w-5 h-5 text-green-500" />;
  if (status === 'in_progress') return <Clock className="w-5 h-5 text-blue-500" />;
  return <Circle className="w-5 h-5 text-gray-400" />;
};

export default function TasksTab({ tasks, onChange }) {
  const [filter, setFilter] = useState('all');

  const addTask = () => {
    const newTask = {
      id: `task-${Date.now()}`,
      title: '',
      description: '',
      assigned_to: '',
      role: '',
      priority: 'medium',
      status: 'todo',
      due_date: '',
      category: 'Planning'
    };
    onChange([...tasks, newTask]);
  };

  const updateTask = (id, field, value) => {
    onChange(tasks.map(t => t.id === id ? { ...t, [field]: value } : t));
  };

  const removeTask = (id) => {
    onChange(tasks.filter(t => t.id !== id));
  };

  const cycleStatus = (id, current) => {
    const cycle = { todo: 'in_progress', in_progress: 'done', done: 'todo' };
    updateTask(id, 'status', cycle[current] || 'todo');
  };

  const filtered = filter === 'all' ? tasks : tasks.filter(t => t.status === filter);
  const done = tasks.filter(t => t.status === 'done').length;
  const pct = tasks.length > 0 ? Math.round((done / tasks.length) * 100) : 0;

  return (
    <div className="space-y-4">
      {/* Progress */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border p-4">
        <div className="flex justify-between items-center mb-2">
          <span className="font-medium text-sm">Task Completion</span>
          <span className="text-sm text-gray-500">{done}/{tasks.length} done ({pct}%)</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div className="bg-green-500 h-3 rounded-full transition-all" style={{ width: `${pct}%` }} />
        </div>
      </div>

      {/* Filter + Add */}
      <div className="flex justify-between items-center">
        <div className="flex gap-2">
          {['all', 'todo', 'in_progress', 'done'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${filter === f ? 'bg-primary text-primary-foreground' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              {f === 'all' ? 'All' : f === 'in_progress' ? 'In Progress' : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
        <Button size="sm" onClick={addTask}><Plus className="w-4 h-4 mr-1" />Add Task</Button>
      </div>

      {/* Task List */}
      <div className="space-y-2">
        {filtered.map((task) => {
          const priority = PRIORITIES.find(p => p.value === task.priority);
          return (
            <div key={task.id} className="bg-white dark:bg-gray-900 rounded-xl border p-3">
              <div className="flex items-start gap-3">
                <button onClick={() => cycleStatus(task.id, task.status)} className="mt-0.5 flex-shrink-0">
                  {statusIcon(task.status)}
                </button>
                <div className="flex-1 space-y-2">
                  <div className="flex flex-wrap gap-2">
                    <Input
                      value={task.title}
                      onChange={e => updateTask(task.id, 'title', e.target.value)}
                      placeholder="Task title..."
                      className={`flex-1 h-8 text-sm font-medium ${task.status === 'done' ? 'line-through text-gray-400' : ''}`}
                    />
                    <Badge className={`text-xs ${priority?.color}`}>{priority?.label}</Badge>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    <Input value={task.assigned_to || ''} onChange={e => updateTask(task.id, 'assigned_to', e.target.value)} placeholder="Assigned to" className="h-7 text-xs" />
                    <Select value={task.role || ''} onValueChange={v => updateTask(task.id, 'role', v)}>
                      <SelectTrigger className="h-7 text-xs">
                        <SelectValue placeholder="Role" />
                      </SelectTrigger>
                      <SelectContent>
                        {ROLES.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Select value={task.priority || 'medium'} onValueChange={v => updateTask(task.id, 'priority', v)}>
                      <SelectTrigger className="h-7 text-xs">
                        <SelectValue placeholder="Priority" />
                      </SelectTrigger>
                      <SelectContent>
                        {PRIORITIES.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Input type="date" value={task.due_date || ''} onChange={e => updateTask(task.id, 'due_date', e.target.value)} className="h-7 text-xs" />
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0" onClick={() => removeTask(task.id)}>
                  <Trash2 className="w-3 h-3 text-red-500" />
                </Button>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="text-center py-8 text-gray-400 text-sm">No tasks found</div>
        )}
      </div>
    </div>
  );
}