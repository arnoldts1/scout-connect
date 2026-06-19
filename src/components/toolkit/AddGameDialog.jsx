import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader2, Plus, X } from 'lucide-react';
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

const CATEGORIES = [
  { id: 'icebreaker', label: 'Icebreaker' },
  { id: 'team_building', label: 'Team Building' },
  { id: 'leadership', label: 'Leadership' },
  { id: 'outdoor', label: 'Outdoor' },
  { id: 'indoor', label: 'Indoor' },
  { id: 'campfire', label: 'Campfire' },
];

export default function AddGameDialog({ open, onClose, onSuccess }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [materials, setMaterials] = useState(['']);
  const [variations, setVariations] = useState(['']);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'icebreaker',
    min_players: 4,
    max_players: 20,
    duration_minutes: 15,
    age_group: 'all',
    instructions: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.instructions) {
      toast.error('Title and instructions are required');
      return;
    }

    setIsSubmitting(true);
    try {
      await base44.entities.Game.create({
        ...formData,
        materials_needed: materials.filter(m => m.trim()),
        variations: variations.filter(v => v.trim()),
        likes_count: 0
      });
      toast.success('Game added!');
      onSuccess?.();
      onClose();
    } catch (error) {
      toast.error('Failed to add game');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Game</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Game Title *</Label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Name of the game"
              className="mt-1"
            />
          </div>

          <div>
            <Label>Description</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Brief description"
              rows={2}
              className="mt-1"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Category</Label>
              <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(cat => (
                    <SelectItem key={cat.id} value={cat.id}>{cat.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
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
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>Min Players</Label>
              <Input
                type="number"
                value={formData.min_players}
                onChange={(e) => setFormData({ ...formData, min_players: parseInt(e.target.value) || 2 })}
                className="mt-1"
              />
            </div>
            <div>
              <Label>Max Players</Label>
              <Input
                type="number"
                value={formData.max_players}
                onChange={(e) => setFormData({ ...formData, max_players: parseInt(e.target.value) || 20 })}
                className="mt-1"
              />
            </div>
            <div>
              <Label>Duration (min)</Label>
              <Input
                type="number"
                value={formData.duration_minutes}
                onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) || 15 })}
                className="mt-1"
              />
            </div>
          </div>

          <div>
            <Label>Instructions *</Label>
            <Textarea
              value={formData.instructions}
              onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
              placeholder="How to play the game..."
              rows={4}
              className="mt-1"
            />
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

          <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
            Add Game
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}