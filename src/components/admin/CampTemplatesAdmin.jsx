import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Edit2, Trash2, Loader2, Star, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';

const CAMP_TYPES = ['scouting', 'school', 'church', 'youth', 'leadership', 'training', 'other'];
const STATUSES = ['draft', 'planned', 'active', 'completed', 'cancelled'];

export default function CampTemplatesAdmin() {
  const [templates, setTemplates] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [expandedSections, setExpandedSections] = useState({
    basic: true,
    dates: true,
    schedule: false,
    contact: false,
    budget: false,
    menu: false,
    equipment: false,
    risks: false,
  });
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    icon: '⛺',
    is_trending: false,
    template_data: {
      title: '',
      description: '',
      camp_type: 'scouting',
      status: 'draft',
      start_date: '',
      end_date: '',
      location: '',
      participants_count: '',
      camp_director: '',
      emergency_contact: '',
      weather_notes: '',
      contingency_plan: '',
      budget: { planned_total: 0, total: 0, currency: 'RWF', items: [], income: [] },
      menu: [],
      schedule: [],
      tasks: [],
      participants: [],
      equipment: [],
      risks: [],
    }
  });

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('camp_templates')
        .select('*')
        .order('created_date', { ascending: false });

      if (error) throw error;
      setTemplates(data || []);
    } catch (error) {
      console.error('Error fetching templates:', error);
      toast.error('Failed to load templates');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const updateTemplateField = (field, value) => {
    setFormData(prev => ({
      ...prev,
      template_data: {
        ...prev.template_data,
        [field]: value
      }
    }));
  };

  const addScheduleDay = () => {
    const currentSchedule = formData.template_data.schedule || [];
    const newDay = {
      day: currentSchedule.length + 1,
      date: '',
      activities: []
    };
    updateTemplateField('schedule', [...currentSchedule, newDay]);
  };

  const updateScheduleDay = (dayIdx, field, value) => {
    const schedule = [...(formData.template_data.schedule || [])];
    schedule[dayIdx] = { ...schedule[dayIdx], [field]: value };
    updateTemplateField('schedule', schedule);
  };

  const removeScheduleDay = (dayIdx) => {
    const schedule = (formData.template_data.schedule || []).filter((_, i) => i !== dayIdx);
    const reindexed = schedule.map((day, i) => ({ ...day, day: i + 1 }));
    updateTemplateField('schedule', reindexed);
  };

  const addActivity = (dayIdx) => {
    const schedule = [...(formData.template_data.schedule || [])];
    if (!schedule[dayIdx].activities) {
      schedule[dayIdx].activities = [];
    }
    schedule[dayIdx].activities.push({
      time: '',
      end_time: '',
      activity: '',
      location: '',
      responsible: '',
      type: 'activity',
      notes: ''
    });
    updateTemplateField('schedule', schedule);
  };

  const updateActivity = (dayIdx, actIdx, field, value) => {
    const schedule = [...(formData.template_data.schedule || [])];
    schedule[dayIdx].activities[actIdx] = {
      ...schedule[dayIdx].activities[actIdx],
      [field]: value
    };
    updateTemplateField('schedule', schedule);
  };

  const removeActivity = (dayIdx, actIdx) => {
    const schedule = [...(formData.template_data.schedule || [])];
    schedule[dayIdx].activities = schedule[dayIdx].activities.filter((_, i) => i !== actIdx);
    updateTemplateField('schedule', schedule);
  };

  const handleSave = async () => {
    if (!formData.name) {
      toast.error('Please enter a template name');
      return;
    }

    setIsLoading(true);
    try {
      const saveData = {
        name: formData.name,
        description: formData.description,
        icon: formData.icon,
        is_trending: formData.is_trending,
        template_data: formData.template_data
      };

      if (editingId) {
        const { error } = await supabase
          .from('camp_templates')
          .update(saveData)
          .eq('id', editingId);

        if (error) throw error;
        toast.success('Template updated successfully');
      } else {
        const { error } = await supabase
          .from('camp_templates')
          .insert([saveData]);

        if (error) throw error;
        toast.success('Template created successfully');
      }

      setDialogOpen(false);
      resetForm();
      fetchTemplates();
    } catch (error) {
      console.error('Error saving template:', error);
      toast.error(`Failed to save template: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this template?')) return;

    setIsLoading(true);
    try {
      console.log('Deleting template:', id);
      const { data, error } = await supabase
        .from('camp_templates')
        .delete()
        .eq('id', id)
        .select();

      console.log('Delete response:', { data, error });

      if (error) {
        console.error('Delete error details:', error);
        throw error;
      }

      toast.success('Template deleted successfully');
      await fetchTemplates();
    } catch (error) {
      console.error('Error deleting template:', error);
      toast.error(`Failed to delete: ${error?.message || 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (template) => {
    setEditingId(template.id);
    setFormData({
      name: template.name,
      description: template.description || '',
      icon: template.icon || '⛺',
      is_trending: template.is_trending || false,
      template_data: template.template_data || {}
    });
    setDialogOpen(true);
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({
      name: '',
      description: '',
      icon: '⛺',
      is_trending: false,
      template_data: {
        title: '',
        description: '',
        camp_type: 'scouting',
        status: 'draft',
        start_date: '',
        end_date: '',
        location: '',
        participants_count: '',
        camp_director: '',
        emergency_contact: '',
        weather_notes: '',
        contingency_plan: '',
        budget: { planned_total: 0, total: 0, currency: 'RWF', items: [], income: [] },
        menu: [],
        schedule: [],
        tasks: [],
        participants: [],
        equipment: [],
        risks: [],
      }
    });
  };

  const handleToggleTrending = async (template) => {
    try {
      const { error } = await supabase
        .from('camp_templates')
        .update({ is_trending: !template.is_trending })
        .eq('id', template.id);

      if (error) throw error;
      fetchTemplates();
    } catch (error) {
      console.error('Error toggling trending:', error);
      toast.error('Failed to update template');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Camp Templates</h2>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              size="sm" 
              className="gap-2"
              onClick={() => {
                resetForm();
              }}
            >
              <Plus className="w-4 h-4" />
              New Template
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingId ? 'Edit Template' : 'Create New Camp Template'}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {/* Template Meta */}
              <div className="space-y-3 pb-4 border-b">
                <div>
                  <Label>Template Name *</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Weekend Scout Camp"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label>Icon (Emoji)</Label>
                  <Input
                    value={formData.icon}
                    onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                    placeholder="⛺"
                    maxLength="2"
                    className="mt-1 w-20"
                  />
                </div>

                <div>
                  <Label>Template Description</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="What is this template for?"
                    className="mt-1 resize-none h-16"
                  />
                </div>

                <Label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.is_trending}
                    onChange={(e) => setFormData({ ...formData, is_trending: e.target.checked })}
                    className="rounded"
                  />
                  <span>Mark as Trending (show in popup)</span>
                </Label>
              </div>

              {/* BASIC DETAILS */}
              <div>
                <button
                  onClick={() => toggleSection('basic')}
                  className="w-full flex items-center justify-between p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-950/50"
                >
                  <span className="font-semibold text-sm">📋 Basic Details</span>
                  {expandedSections.basic ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                {expandedSections.basic && (
                  <div className="mt-3 space-y-3 pl-3 border-l-2 border-emerald-200">
                    <div>
                      <Label className="text-xs">Camp Name</Label>
                      <Input
                        value={formData.template_data.title || ''}
                        onChange={(e) => updateTemplateField('title', e.target.value)}
                        placeholder="e.g., Annual Scout Camp 2025"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Description</Label>
                      <Textarea
                        value={formData.template_data.description || ''}
                        onChange={(e) => updateTemplateField('description', e.target.value)}
                        placeholder="Camp overview..."
                        className="mt-1 resize-none h-20"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Camp Type</Label>
                      <Select value={formData.template_data.camp_type || 'scouting'} onValueChange={(v) => updateTemplateField('camp_type', v)}>
                        <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {CAMP_TYPES.map(t => <SelectItem key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs">Status</Label>
                      <Select value={formData.template_data.status || 'draft'} onValueChange={(v) => updateTemplateField('status', v)}>
                        <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {STATUSES.map(s => <SelectItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs">Location</Label>
                      <Input
                        value={formData.template_data.location || ''}
                        onChange={(e) => updateTemplateField('location', e.target.value)}
                        placeholder="Camp location"
                        className="mt-1"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* DATES */}
              <div>
                <button
                  onClick={() => toggleSection('dates')}
                  className="w-full flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-950/50"
                >
                  <span className="font-semibold text-sm">📅 Dates</span>
                  {expandedSections.dates ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                {expandedSections.dates && (
                  <div className="mt-3 space-y-3 pl-3 border-l-2 border-blue-200">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs">Start Date</Label>
                        <Input
                          type="date"
                          value={formData.template_data.start_date || ''}
                          onChange={(e) => updateTemplateField('start_date', e.target.value)}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">End Date</Label>
                        <Input
                          type="date"
                          value={formData.template_data.end_date || ''}
                          onChange={(e) => updateTemplateField('end_date', e.target.value)}
                          className="mt-1"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* SCHEDULE */}
              <div>
                <button
                  onClick={() => toggleSection('schedule')}
                  className="w-full flex items-center justify-between p-3 bg-cyan-50 dark:bg-cyan-950/30 rounded-lg hover:bg-cyan-100 dark:hover:bg-cyan-950/50"
                >
                  <span className="font-semibold text-sm">⏱️ Camp Schedule</span>
                  {expandedSections.schedule ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                {expandedSections.schedule && (
                  <div className="mt-3 space-y-3 pl-3 border-l-2 border-cyan-200">
                    <p className="text-xs text-gray-600">Plan the daily schedule/timetable for the camp</p>

                    {(formData.template_data.schedule || []).length === 0 ? (
                      <p className="text-xs text-gray-400 italic">No schedule days added yet</p>
                    ) : (
                      <div className="space-y-4">
                        {(formData.template_data.schedule || []).map((day, dayIdx) => (
                          <div key={dayIdx} className="p-3 border border-cyan-200 rounded-lg bg-cyan-50 dark:bg-cyan-950/20 space-y-3">
                            <div className="flex items-center justify-between">
                              <h4 className="font-semibold text-sm">Day {day.day}</h4>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => removeScheduleDay(dayIdx)}
                                className="text-red-500 hover:text-red-700 h-6 px-2"
                              >
                                ✕ Remove
                              </Button>
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <Label className="text-xs">Date</Label>
                                <Input
                                  type="date"
                                  value={day.date || ''}
                                  onChange={(e) => updateScheduleDay(dayIdx, 'date', e.target.value)}
                                  className="mt-1 h-8 text-sm"
                                />
                              </div>
                            </div>

                            {/* Activities */}
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <label className="text-xs font-semibold">Activities</label>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => addActivity(dayIdx)}
                                  className="h-6 px-2 gap-1"
                                >
                                  <Plus className="w-3 h-3" />
                                  Add Activity
                                </Button>
                              </div>

                              {(day.activities || []).map((activity, actIdx) => (
                                <div key={actIdx} className="p-2 bg-white dark:bg-gray-800 rounded border space-y-2">
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs font-semibold">{activity.activity || 'Activity'}</span>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => removeActivity(dayIdx, actIdx)}
                                      className="text-red-500 hover:text-red-700 h-5 px-1"
                                    >
                                      ✕
                                    </Button>
                                  </div>
                                  <div className="grid grid-cols-3 gap-2">
                                    <div>
                                      <Label className="text-xs">Time</Label>
                                      <Input
                                        type="time"
                                        value={activity.time || ''}
                                        onChange={(e) => updateActivity(dayIdx, actIdx, 'time', e.target.value)}
                                        className="mt-1 h-7 text-xs"
                                      />
                                    </div>
                                    <div>
                                      <Label className="text-xs">End</Label>
                                      <Input
                                        type="time"
                                        value={activity.end_time || ''}
                                        onChange={(e) => updateActivity(dayIdx, actIdx, 'end_time', e.target.value)}
                                        className="mt-1 h-7 text-xs"
                                      />
                                    </div>
                                    <div>
                                      <Label className="text-xs">Type</Label>
                                      <Select value={activity.type || 'activity'} onValueChange={(v) => updateActivity(dayIdx, actIdx, 'type', v)}>
                                        <SelectTrigger className="mt-1 h-7 text-xs"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="activity">Activity</SelectItem>
                                          <SelectItem value="meal">Meal</SelectItem>
                                          <SelectItem value="ceremony">Ceremony</SelectItem>
                                          <SelectItem value="travel">Travel</SelectItem>
                                          <SelectItem value="rest">Rest</SelectItem>
                                          <SelectItem value="training">Training</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>
                                  </div>
                                  <div>
                                    <Label className="text-xs">Activity Name</Label>
                                    <Input
                                      value={activity.activity || ''}
                                      onChange={(e) => updateActivity(dayIdx, actIdx, 'activity', e.target.value)}
                                      placeholder="e.g., Morning Hike"
                                      className="mt-1 h-7 text-xs"
                                    />
                                  </div>
                                  <div className="grid grid-cols-2 gap-2">
                                    <div>
                                      <Label className="text-xs">Location</Label>
                                      <Input
                                        value={activity.location || ''}
                                        onChange={(e) => updateActivity(dayIdx, actIdx, 'location', e.target.value)}
                                        placeholder="e.g., Main Field"
                                        className="mt-1 h-7 text-xs"
                                      />
                                    </div>
                                    <div>
                                      <Label className="text-xs">Leader</Label>
                                      <Input
                                        value={activity.responsible || ''}
                                        onChange={(e) => updateActivity(dayIdx, actIdx, 'responsible', e.target.value)}
                                        placeholder="Leader name"
                                        className="mt-1 h-7 text-xs"
                                      />
                                    </div>
                                  </div>
                                  <div>
                                    <Label className="text-xs">Notes</Label>
                                    <Input
                                      value={activity.notes || ''}
                                      onChange={(e) => updateActivity(dayIdx, actIdx, 'notes', e.target.value)}
                                      placeholder="Additional notes..."
                                      className="mt-1 h-7 text-xs"
                                    />
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    <Button
                      size="sm"
                      onClick={addScheduleDay}
                      className="w-full mt-3 gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Add Schedule Day
                    </Button>
                  </div>
                )}
              </div>

              {/* CONTACT DETAILS */}
              <div>
                <button
                  onClick={() => toggleSection('contact')}
                  className="w-full flex items-center justify-between p-3 bg-purple-50 dark:bg-purple-950/30 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-950/50"
                >
                  <span className="font-semibold text-sm">👥 Contact Details</span>
                  {expandedSections.contact ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                {expandedSections.contact && (
                  <div className="mt-3 space-y-3 pl-3 border-l-2 border-purple-200">
                    <div>
                      <Label className="text-xs">Expected Participants</Label>
                      <Input
                        type="number"
                        value={formData.template_data.participants_count || ''}
                        onChange={(e) => updateTemplateField('participants_count', e.target.value)}
                        placeholder="Number of participants"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Camp Director</Label>
                      <Input
                        value={formData.template_data.camp_director || ''}
                        onChange={(e) => updateTemplateField('camp_director', e.target.value)}
                        placeholder="Director name"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Emergency Contact</Label>
                      <Input
                        value={formData.template_data.emergency_contact || ''}
                        onChange={(e) => updateTemplateField('emergency_contact', e.target.value)}
                        placeholder="Name and phone"
                        className="mt-1"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* NOTES */}
              <div>
                <button
                  onClick={() => toggleSection('budget')}
                  className="w-full flex items-center justify-between p-3 bg-orange-50 dark:bg-orange-950/30 rounded-lg hover:bg-orange-100 dark:hover:bg-orange-950/50"
                >
                  <span className="font-semibold text-sm">📝 Notes & Planning</span>
                  {expandedSections.budget ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                {expandedSections.budget && (
                  <div className="mt-3 space-y-3 pl-3 border-l-2 border-orange-200">
                    <div>
                      <Label className="text-xs">Weather Notes</Label>
                      <Textarea
                        value={formData.template_data.weather_notes || ''}
                        onChange={(e) => updateTemplateField('weather_notes', e.target.value)}
                        placeholder="Expected weather conditions..."
                        className="mt-1 resize-none h-16"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Contingency Plan</Label>
                      <Textarea
                        value={formData.template_data.contingency_plan || ''}
                        onChange={(e) => updateTemplateField('contingency_plan', e.target.value)}
                        placeholder="What if plans change..."
                        className="mt-1 resize-none h-16"
                      />
                    </div>
                  </div>
                )}
              </div>

              <p className="text-xs text-gray-500 italic">💡 All fields are optional. Fill in the details you want to pre-populate for this template.</p>

              <div className="flex gap-2 justify-end pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={isLoading}
                  className="gap-2"
                >
                  {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editingId ? 'Update' : 'Create'} Template
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading && templates.length === 0 ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      ) : templates.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p className="text-sm">No templates created yet</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {templates.map(template => (
            <div
              key={template.id}
              className="p-4 border rounded-lg bg-white dark:bg-gray-900 flex items-start justify-between hover:border-gray-400 transition-colors"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-2xl">{template.icon}</span>
                  <div>
                    <h3 className="font-semibold text-sm">{template.name}</h3>
                    {template.description && (
                      <p className="text-xs text-gray-500">{template.description}</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 ml-4">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleToggleTrending(template)}
                  className={template.is_trending ? 'text-amber-500' : 'text-gray-400'}
                  title={template.is_trending ? 'Remove from trending' : 'Add to trending'}
                >
                  <Star className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleEdit(template)}
                >
                  <Edit2 className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDelete(template.id)}
                  className="text-red-500 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
