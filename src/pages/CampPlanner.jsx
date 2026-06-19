import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Save, Loader2, Map, LayoutDashboard, DollarSign,
  Calendar, Users, Package, ShieldAlert, UtensilsCrossed,
  CheckSquare, ChevronDown, Download
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { createPageUrl } from '@/utils';
import { toast } from 'sonner';
import { generateCampPlan } from '@/utils/campPdfExport';

// Tab components
import OverviewTab from '@/components/camp/OverviewTab';
import BudgetTab from '@/components/camp/BudgetTab';
import ScheduleTab from '@/components/camp/ScheduleTab';
import TasksTab from '@/components/camp/TasksTab';
import ParticipantsTab from '@/components/camp/ParticipantsTab';
import EquipmentTab from '@/components/camp/EquipmentTab';
import RiskTab from '@/components/camp/RiskTab';
import CampsiteMap from '@/components/camp/CampsiteMap';
import CampTemplateSelector from '@/components/camp/CampTemplateSelector';
import DeleteCampDialog from '@/components/camp/DeleteCampDialog';

const TABS = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'details', label: 'Details', icon: Calendar },
  { id: 'budget', label: 'Budget', icon: DollarSign },
  { id: 'schedule', label: 'Schedule', icon: Calendar },
  { id: 'menu', label: 'Menu', icon: UtensilsCrossed },
  { id: 'tasks', label: 'Tasks', icon: CheckSquare },
  { id: 'participants', label: 'Participants', icon: Users },
  { id: 'equipment', label: 'Equipment', icon: Package },
  { id: 'risks', label: 'Risks', icon: ShieldAlert },
  { id: 'layout', label: 'Map', icon: Map },
];

const CAMP_TYPES = ['scouting', 'school', 'church', 'youth', 'leadership', 'training', 'other'];

const defaultFormData = () => ({
  title: '',
  description: '',
  camp_type: 'scouting',
  start_date: '',
  end_date: '',
  location: '',
  participants_count: '',
  camp_director: '',
  emergency_contact: '',
  budget: { planned_total: 0, total: 0, currency: 'RWF', items: [], income: [] },
  menu: [],
  schedule: [],
  tasks: [],
  participants: [],
  equipment: [],
  risks: [],
  campsite_layout: [],
  announcements: [],
  weather_notes: '',
  contingency_plan: '',
  status: 'draft'
});

export default function CampPlanner() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [formData, setFormData] = useState(defaultFormData());

  const urlParams = new URLSearchParams(window.location.search);
  const planId = urlParams.get('id');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);

        if (planId) {
          try {
            const plans = await base44.entities.CampPlan.filter({ id: planId });
            if (plans?.[0]) {
              const plan = plans[0];
              // Ensure all arrays exist (backwards compat)
              setFormData({
                ...defaultFormData(),
                ...plan,
                budget: { planned_total: 0, total: 0, currency: 'RWF', items: [], income: [], ...(plan.budget || {}) },
                tasks: plan.tasks || [],
                participants: plan.participants || [],
                equipment: plan.equipment || [],
                risks: plan.risks || [],
                announcements: plan.announcements || [],
              });
            } else {
              toast.error('Camp plan not found');
            }
          } catch (fetchError) {
            console.error('Error fetching camp plan:', fetchError);
            toast.error('Failed to load camp plan');
          }
        }
      } catch (e) {
        console.error('Auth error:', e);
        toast.error('Failed to load user information');
      }
    };
    fetchData();
  }, [planId]);

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAutofill = (templateData) => {
    setFormData(prev => ({
      ...prev,
      ...templateData,
      title: prev.title || templateData.title || '', // Keep existing title if already entered
      id: prev.id // Keep the ID if editing
    }));
  };

  const handleSave = async () => {
    if (!formData.title) {
      toast.error('Please enter a camp name');
      return;
    }
    if (!user?.id) {
      toast.error('User not authenticated');
      return;
    }

    setIsSaving(true);
    try {
      const dataToSave = {
        title: formData.title || '',
        description: formData.description || '',
        camp_type: formData.camp_type || 'scouting',
        start_date: formData.start_date || null,
        end_date: formData.end_date || null,
        location: formData.location || '',
        participants_count: formData.participants_count ? parseInt(formData.participants_count) : null,
        camp_director: formData.camp_director || '',
        emergency_contact: formData.emergency_contact || '',
        budget: formData.budget || { planned_total: 0, total: 0, currency: 'RWF', items: [], income: [] },
        menu: formData.menu || [],
        schedule: formData.schedule || [],
        tasks: formData.tasks || [],
        participants: formData.participants || [],
        equipment: formData.equipment || [],
        risks: formData.risks || [],
        campsite_layout: formData.campsite_layout || [],
        announcements: formData.announcements || [],
        weather_notes: formData.weather_notes || '',
        contingency_plan: formData.contingency_plan || '',
        status: formData.status || 'draft',
        organizer_id: user.id,
        unit_id: user.unit_id
      };

      if (planId) {
        // Update existing plan
        await base44.entities.CampPlan.update(planId, dataToSave);
      } else {
        // Create new plan
        const newPlan = await base44.entities.CampPlan.create(dataToSave);
        // Navigate with the new plan ID if available
        if (newPlan?.id) {
          navigate(createPageUrl(`CampPlanner?id=${newPlan.id}`));
          return;
        }
      }
      toast.success('Camp plan saved successfully!');
      navigate(createPageUrl('LeaderToolkit'));
    } catch (error) {
      console.error('Camp plan save error:', error);
      toast.error(`Failed to save camp plan: ${error?.message || 'Unknown error'}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportPDF = async () => {
    if (!formData.title) {
      toast.error('Please enter a camp name before exporting');
      return;
    }

    setIsExporting(true);
    try {
      await generateCampPlan(formData);
      toast.success('Camp plan exported to PDF successfully!');
    } catch (error) {
      console.error('PDF export error:', error);
      toast.error(`Failed to export PDF: ${error?.message || 'Unknown error'}`);
    } finally {
      setIsExporting(false);
    }
  };

  // Menu helpers (preserved from original)
  const addMenuDay = () => updateField('menu', [...formData.menu, { day: formData.menu.length + 1, breakfast: '', lunch: '', dinner: '', snacks: '', notes: '' }]);
  const updateMenuDay = (idx, field, value) => {
    const menu = [...formData.menu];
    menu[idx][field] = value;
    updateField('menu', menu);
  };
  const removeMenuDay = (idx) => updateField('menu', formData.menu.filter((_, i) => i !== idx).map((d, i) => ({ ...d, day: i + 1 })));

  const currentTab = TABS.find(t => t.id === activeTab);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-white dark:bg-gray-900 border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="font-bold text-base leading-tight">{formData.title || 'New Camp Plan'}</h1>
                <div className="flex items-center gap-2">
                  <Badge className={`text-xs ${formData.status === 'active' ? 'bg-green-100 text-green-700' : formData.status === 'completed' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
                    {formData.status}
                  </Badge>
                  {formData.start_date && <span className="text-xs text-gray-500">{formData.start_date}</span>}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {!planId && (
                <CampTemplateSelector onAutofill={handleAutofill} />
              )}
              {planId && (
                <Button onClick={handleExportPDF} disabled={isExporting} variant="outline" size="sm">
                  {isExporting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Download className="w-4 h-4 mr-2" />}
                  Export PDF
                </Button>
              )}
              <Button onClick={handleSave} disabled={isSaving} size="sm">
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                Save
              </Button>
              {planId && (
                <DeleteCampDialog
                  campId={planId}
                  campTitle={formData.title}
                  onDeleted={() => {
                    // Clear cache and navigate
                    window.location.href = createPageUrl('LeaderToolkit');
                  }}
                />
              )}
            </div>
          </div>

          {/* Tab Bar - scrollable */}
          <div className="flex gap-0 overflow-x-auto scrollbar-hide -mb-px">
            {TABS.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-3 text-xs font-medium whitespace-nowrap border-b-2 transition-colors flex-shrink-0 ${
                    isActive
                      ? 'border-primary text-primary'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-5">
        {/* Overview */}
        {activeTab === 'overview' && (
          <OverviewTab formData={formData} onUpdate={updateField} />
        )}

        {/* Details */}
        {activeTab === 'details' && (
          <div className="bg-white dark:bg-gray-900 rounded-xl border p-6 space-y-5 max-w-2xl">
            <h2 className="font-semibold text-lg">Camp Details</h2>
            <div>
              <Label>Camp Name *</Label>
              <Input value={formData.title} onChange={e => updateField('title', e.target.value)} placeholder="Annual Scout Camp 2025" className="mt-1" />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea value={formData.description || ''} onChange={e => updateField('description', e.target.value)} placeholder="Brief description of the camp..." className="mt-1 resize-none h-20" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Camp Type</Label>
                <Select value={formData.camp_type || 'scouting'} onValueChange={v => updateField('camp_type', v)}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CAMP_TYPES.map(t => <SelectItem key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Status</Label>
                <Select value={formData.status} onValueChange={v => updateField('status', v)}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="planned">Planned</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Start Date</Label>
                <Input type="date" value={formData.start_date} onChange={e => updateField('start_date', e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label>End Date</Label>
                <Input type="date" value={formData.end_date} onChange={e => updateField('end_date', e.target.value)} className="mt-1" />
              </div>
            </div>
            <div>
              <Label>Location</Label>
              <Input value={formData.location} onChange={e => updateField('location', e.target.value)} placeholder="Camp location / address" className="mt-1" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Expected Participants</Label>
                <Input type="number" value={formData.participants_count} onChange={e => updateField('participants_count', parseInt(e.target.value) || 0)} className="mt-1" />
              </div>
              <div>
                <Label>Camp Director</Label>
                <Input value={formData.camp_director || ''} onChange={e => updateField('camp_director', e.target.value)} placeholder="Director name" className="mt-1" />
              </div>
            </div>
            <div>
              <Label>Emergency Contact</Label>
              <Input value={formData.emergency_contact || ''} onChange={e => updateField('emergency_contact', e.target.value)} placeholder="Name and phone number" className="mt-1" />
            </div>
          </div>
        )}

        {/* Budget */}
        {activeTab === 'budget' && (
          <BudgetTab
            budget={formData.budget}
            participantsCount={formData.participants_count || formData.participants?.length || 0}
            onChange={budget => updateField('budget', budget)}
          />
        )}

        {/* Schedule */}
        {activeTab === 'schedule' && (
          <ScheduleTab schedule={formData.schedule} onChange={s => updateField('schedule', s)} />
        )}

        {/* Menu */}
        {activeTab === 'menu' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold">Meal Planning</h3>
              <Button size="sm" onClick={addMenuDay}><span className="mr-1">+</span> Add Day</Button>
            </div>
            {formData.menu.length === 0 && (
              <div className="text-center py-12 text-gray-400">
                <UtensilsCrossed className="w-10 h-10 mx-auto mb-2 opacity-40" />
                <p>No menu days yet. Click "Add Day" to start planning meals.</p>
              </div>
            )}
            {formData.menu.map((day, idx) => (
              <div key={idx} className="bg-white dark:bg-gray-900 rounded-xl border p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold">Day {day.day}</h4>
                  <div className="flex items-center gap-2">
                    <Input type="date" value={day.date || ''} onChange={e => updateMenuDay(idx, 'date', e.target.value)} className="h-7 text-xs w-36" />
                    <Button variant="ghost" size="sm" className="text-red-500 h-7 px-2" onClick={() => removeMenuDay(idx)}>✕</Button>
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-3">
                  {['breakfast', 'lunch', 'dinner', 'snacks'].map(meal => (
                    <div key={meal}>
                      <Label className="text-xs capitalize">{meal}</Label>
                      <Input value={day[meal] || ''} onChange={e => updateMenuDay(idx, meal, e.target.value)} placeholder={`${meal.charAt(0).toUpperCase() + meal.slice(1)} menu`} className="mt-1 h-8 text-sm" />
                    </div>
                  ))}
                  <div className="md:col-span-2">
                    <Label className="text-xs">Notes</Label>
                    <Input value={day.notes || ''} onChange={e => updateMenuDay(idx, 'notes', e.target.value)} placeholder="Dietary restrictions, special notes..." className="mt-1 h-8 text-sm" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tasks */}
        {activeTab === 'tasks' && (
          <TasksTab tasks={formData.tasks || []} onChange={t => updateField('tasks', t)} />
        )}

        {/* Participants */}
        {activeTab === 'participants' && (
          <ParticipantsTab participants={formData.participants || []} onChange={p => updateField('participants', p)} />
        )}

        {/* Equipment */}
        {activeTab === 'equipment' && (
          <EquipmentTab equipment={formData.equipment || []} onChange={e => updateField('equipment', e)} />
        )}

        {/* Risks */}
        {activeTab === 'risks' && (
          <RiskTab risks={formData.risks || []} onChange={r => updateField('risks', r)} />
        )}

        {/* Campsite Layout */}
        {activeTab === 'layout' && (
          <div className="bg-white dark:bg-gray-900 rounded-xl border p-6">
            <div className="flex items-center gap-2 mb-4">
              <Map className="w-5 h-5 text-teal-600" />
              <h3 className="font-semibold">Interactive Campsite Map</h3>
            </div>
            <p className="text-sm text-gray-500 mb-4">
              Design your campsite layout. Click to place items, drag to move, click an item to select and rotate or delete it.
            </p>
            <CampsiteMap
              initialLayout={formData.campsite_layout || []}
              onChange={layout => updateField('campsite_layout', layout)}
            />
          </div>
        )}

      </div>
    </div>
  );
}
