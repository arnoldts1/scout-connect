import React, { useState, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader2, Plus, X, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

export default function AddMeetingDialog({ open, onClose, user, onSuccess }) {
  const fileInputRef = useRef(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [objectives, setObjectives] = useState(['']);
  const [materials, setMaterials] = useState(['']);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    age_group: 'all',
    duration_minutes: 60,
    theme: '',
    pdf_url: ''
  });

  const handlePdfUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setFormData({ ...formData, pdf_url: file_url });
    } catch (error) {
      toast.error('Failed to upload PDF');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title) {
      toast.error('Title is required');
      return;
    }

    setIsSubmitting(true);
    try {
      await base44.entities.MeetingPlan.create({
        ...formData,
        objectives: objectives.filter(o => o.trim()),
        materials_needed: materials.filter(m => m.trim()),
        activities: [],
        author_id: user.id,
        downloads_count: 0
      });
      toast.success('Meeting plan added!');
      onSuccess?.();
      onClose();
    } catch (error) {
      toast.error('Failed to add meeting plan');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Meeting Plan</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Title *</Label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Meeting plan title"
              className="mt-1"
            />
          </div>

          <div>
            <Label>Description</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="What is this meeting about?"
              rows={2}
              className="mt-1"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Age Group</Label>
              <Select value={formData.age_group} onValueChange={(v) => setFormData({ ...formData, age_group: v })}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="abatoni">Abatoni</SelectItem>
                  <SelectItem value="inkesha">Inkesha</SelectItem>
                  <SelectItem value="abahizi">Abahizi</SelectItem>
                  <SelectItem value="ingenzi">Ingenzi</SelectItem>
                  <SelectItem value="all">All Ages</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Duration (min)</Label>
              <Input
                type="number"
                value={formData.duration_minutes}
                onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) || 60 })}
                className="mt-1"
              />
            </div>
          </div>

          <div>
            <Label>Theme</Label>
            <Input
              value={formData.theme}
              onChange={(e) => setFormData({ ...formData, theme: e.target.value })}
              placeholder="e.g. Nature, Leadership, Teamwork"
              className="mt-1"
            />
          </div>

          <div>
            <Label>Objectives</Label>
            <div className="space-y-2 mt-1">
              {objectives.map((obj, idx) => (
                <div key={idx} className="flex gap-2">
                  <Input
                    value={obj}
                    onChange={(e) => {
                      const newObjs = [...objectives];
                      newObjs[idx] = e.target.value;
                      setObjectives(newObjs);
                    }}
                    placeholder="Learning objective"
                  />
                  {objectives.length > 1 && (
                    <Button type="button" variant="ghost" size="icon" onClick={() => setObjectives(objectives.filter((_, i) => i !== idx))}>
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" onClick={() => setObjectives([...objectives, ''])}>
                <Plus className="w-4 h-4 mr-1" /> Add Objective
              </Button>
            </div>
          </div>

          <div>
            <Label>Materials Needed</Label>
            <div className="space-y-2 mt-1">
              {materials.map((mat, idx) => (
                <div key={idx} className="flex gap-2">
                  <Input
                    value={mat}
                    onChange={(e) => {
                      const newMats = [...materials];
                      newMats[idx] = e.target.value;
                      setMaterials(newMats);
                    }}
                    placeholder="Material item"
                  />
                  {materials.length > 1 && (
                    <Button type="button" variant="ghost" size="icon" onClick={() => setMaterials(materials.filter((_, i) => i !== idx))}>
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" onClick={() => setMaterials([...materials, ''])}>
                <Plus className="w-4 h-4 mr-1" /> Add Material
              </Button>
            </div>
          </div>

          <div>
            <Label>PDF Document</Label>
            <div className="mt-1">
              {formData.pdf_url ? (
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm text-green-600">PDF uploaded</span>
                  <Button type="button" variant="ghost" size="sm" onClick={() => setFormData({ ...formData, pdf_url: '' })}>
                    Remove
                  </Button>
                </div>
              ) : (
                <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
                  {isUploading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Upload className="w-4 h-4 mr-2" />}
                  Upload PDF
                </Button>
              )}
              <input ref={fileInputRef} type="file" accept=".pdf" onChange={handlePdfUpload} className="hidden" />
            </div>
          </div>

          <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
            Add Meeting Plan
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}