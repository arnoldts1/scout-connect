import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Trash2, GripVertical, BookOpen, Play, FileQuestion, Activity, Upload } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

const TASK_TYPES = [
  { id: 'read', label: 'Read Content', icon: BookOpen },
  { id: 'watch', label: 'Watch Video', icon: Play },
  { id: 'quiz', label: 'Answer Quiz', icon: FileQuestion },
  { id: 'activity', label: 'Complete Activity', icon: Activity },
  { id: 'upload', label: 'Upload Proof', icon: Upload },
];

export default function LessonEditor({ open, onClose, courseId, lesson, onSuccess }) {
  const [formData, setFormData] = useState({
    course_id: courseId,
    title: '',
    content: '',
    video_url: '',
    pdf_url: '',
    order: 1,
    duration_minutes: 10,
    xp_reward: 20,
    tasks: []
  });
  const [saving, setSaving] = useState(false);

  // Reset form when dialog opens/closes or lesson changes
  React.useEffect(() => {
    if (open) {
      setFormData(lesson ? { ...lesson } : {
        course_id: courseId,
        title: '',
        content: '',
        video_url: '',
        pdf_url: '',
        order: 1,
        duration_minutes: 10,
        xp_reward: 20,
        tasks: []
      });
    }
  }, [open, lesson, courseId]);

  const addTask = () => {
    const newTask = {
      id: `task_${Date.now()}`,
      title: '',
      description: '',
      type: 'read',
      required: true,
      xp_reward: 5
    };
    setFormData({ ...formData, tasks: [...(formData.tasks || []), newTask] });
  };

  const updateTask = (index, field, value) => {
    const tasks = [...(formData.tasks || [])];
    tasks[index] = { ...tasks[index], [field]: value };
    setFormData({ ...formData, tasks });
  };

  const removeTask = (index) => {
    const tasks = formData.tasks.filter((_, i) => i !== index);
    setFormData({ ...formData, tasks });
  };

  const handleSave = async () => {
    if (!formData.title) {
      toast.error('Please enter a lesson title');
      return;
    }
    
    setSaving(true);
    try {
      if (lesson?.id) {
        await base44.entities.Lesson.update(lesson.id, formData);
        toast.success('Lesson updated');
      } else {
        await base44.entities.Lesson.create(formData);
        toast.success('Lesson created');
      }
      onSuccess?.();
      onClose();
    } catch (error) {
      toast.error('Failed to save lesson');
    } finally {
      setSaving(false);
    }
  };

  const TaskIcon = ({ type }) => {
    const taskType = TASK_TYPES.find(t => t.id === type);
    const Icon = taskType?.icon || BookOpen;
    return <Icon className="w-4 h-4" />;
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{lesson?.id ? 'Edit Lesson' : 'Add New Lesson'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label>Lesson Title *</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Enter lesson title"
              />
            </div>

            <div>
              <Label>Order</Label>
              <Input
                type="number"
                value={formData.order}
                onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) })}
                min={1}
              />
            </div>

            <div>
              <Label>Duration (minutes)</Label>
              <Input
                type="number"
                value={formData.duration_minutes}
                onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) })}
                min={1}
              />
            </div>

            <div>
              <Label>XP Reward</Label>
              <Input
                type="number"
                value={formData.xp_reward}
                onChange={(e) => setFormData({ ...formData, xp_reward: parseInt(e.target.value) })}
                min={0}
              />
            </div>

            <div>
              <Label>Video URL</Label>
              <Input
                value={formData.video_url || ''}
                onChange={(e) => setFormData({ ...formData, video_url: e.target.value })}
                placeholder="https://..."
              />
            </div>

            <div className="col-span-2">
              <Label>PDF URL</Label>
              <Input
                value={formData.pdf_url || ''}
                onChange={(e) => setFormData({ ...formData, pdf_url: e.target.value })}
                placeholder="https://..."
              />
            </div>

            <div className="col-span-2">
              <Label>Content</Label>
              <Textarea
                value={formData.content || ''}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="Lesson content..."
                rows={4}
              />
            </div>
          </div>

          {/* Tasks Section */}
          <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-3">
              <Label className="text-base font-semibold">Tasks (Step-by-Step)</Label>
              <Button type="button" variant="outline" size="sm" onClick={addTask}>
                <Plus className="w-4 h-4 mr-1" /> Add Task
              </Button>
            </div>

            <div className="space-y-3">
              {(formData.tasks || []).map((task, idx) => (
                <div key={task.id} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 border">
                  <div className="flex items-start gap-2">
                    <GripVertical className="w-4 h-4 text-gray-400 mt-2 cursor-move" />
                    <div className="flex-1 space-y-2">
                      <div className="flex gap-2">
                        <div className="flex-1">
                          <Input
                            value={task.title}
                            onChange={(e) => updateTask(idx, 'title', e.target.value)}
                            placeholder="Task title"
                            className="text-sm"
                          />
                        </div>
                        <Select
                          value={task.type}
                          onValueChange={(v) => updateTask(idx, 'type', v)}
                        >
                          <SelectTrigger className="w-40">
                            <div className="flex items-center gap-2">
                              <TaskIcon type={task.type} />
                              <SelectValue />
                            </div>
                          </SelectTrigger>
                          <SelectContent>
                            {TASK_TYPES.map(t => (
                              <SelectItem key={t.id} value={t.id}>
                                <div className="flex items-center gap-2">
                                  <t.icon className="w-4 h-4" />
                                  {t.label}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeTask(idx)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                      <Input
                        value={task.description || ''}
                        onChange={(e) => updateTask(idx, 'description', e.target.value)}
                        placeholder="Task description (optional)"
                        className="text-sm"
                      />
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={task.required}
                            onChange={(e) => updateTask(idx, 'required', e.target.checked)}
                            className="rounded"
                          />
                          <span className="text-xs text-gray-500">Required</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-gray-500">XP:</span>
                          <Input
                            type="number"
                            value={task.xp_reward}
                            onChange={(e) => updateTask(idx, 'xp_reward', parseInt(e.target.value))}
                            className="w-16 h-6 text-xs"
                            min={0}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {(!formData.tasks || formData.tasks.length === 0) && (
                <p className="text-center text-gray-500 text-sm py-4">
                  No tasks yet. Add tasks to create a step-by-step learning flow.
                </p>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving} className="bg-blue-600 hover:bg-blue-700">
              {saving ? 'Saving...' : lesson?.id ? 'Update Lesson' : 'Create Lesson'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
