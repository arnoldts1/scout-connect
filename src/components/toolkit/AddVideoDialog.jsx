import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Upload, Loader2 } from 'lucide-react';

const VIDEO_CATEGORIES = [
  'knots',
  'first_aid',
  'camping_skills',
  'leadership',
  'ceremonies',
  'games',
  'songs',
  'other'
];

export default function AddVideoDialog({ open, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'camping_skills',
    duration_minutes: '',
    video_url: '',
    thumbnail: '',
  });

  const handleThumbnailUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setFormData({ ...formData, thumbnail: file_url });
      toast.success('Thumbnail uploaded');
    } catch (error) {
      toast.error('Failed to upload thumbnail');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.video_url) {
      toast.error('Please fill in required fields');
      return;
    }

    setLoading(true);
    try {
      await base44.entities.TrainingVideo.create({
        ...formData,
        duration_minutes: parseInt(formData.duration_minutes) || 0,
        views_count: 0,
      });
      
      toast.success('Video added successfully');
      onSuccess?.();
      onClose();
      setFormData({
        title: '',
        description: '',
        category: 'camping_skills',
        duration_minutes: '',
        video_url: '',
        thumbnail: '',
      });
    } catch (error) {
      toast.error('Failed to add video');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Training Video</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Title *</Label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., How to Tie a Bowline Knot"
              required
            />
          </div>

          <div>
            <Label>Description</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Brief description of what this video teaches..."
              rows={3}
            />
          </div>

          <div>
            <Label>Category *</Label>
            <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {VIDEO_CATEGORIES.map(cat => (
                  <SelectItem key={cat} value={cat}>
                    {cat.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Video URL * (YouTube, Vimeo, etc.)</Label>
            <Input
              value={formData.video_url}
              onChange={(e) => setFormData({ ...formData, video_url: e.target.value })}
              placeholder="https://youtube.com/watch?v=..."
              required
            />
            <p className="text-xs text-gray-500 mt-1">Paste the full URL of the video</p>
          </div>

          <div>
            <Label>Duration (minutes)</Label>
            <Input
              type="number"
              value={formData.duration_minutes}
              onChange={(e) => setFormData({ ...formData, duration_minutes: e.target.value })}
              placeholder="e.g., 5"
            />
          </div>

          <div>
            <Label>Thumbnail Image (optional)</Label>
            <div className="flex items-center gap-3">
              {formData.thumbnail && (
                <img src={formData.thumbnail} alt="Thumbnail" className="w-20 h-20 object-cover rounded" />
              )}
              <label className="cursor-pointer">
                <div className="px-4 py-2 border rounded-lg hover:bg-gray-50 flex items-center gap-2">
                  {uploading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Upload className="w-4 h-4" />
                  )}
                  <span className="text-sm">{formData.thumbnail ? 'Change' : 'Upload'}</span>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleThumbnailUpload}
                  className="hidden"
                  disabled={uploading}
                />
              </label>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="flex-1 bg-purple-600 hover:bg-purple-700">
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Add Video
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}