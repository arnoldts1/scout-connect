import React, { useState, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader2, Upload } from 'lucide-react';
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
  { id: 'permission_slip', label: 'Permission Slip' },
  { id: 'badge_requirement', label: 'Badge Requirement' },
  { id: 'attendance', label: 'Attendance Sheet' },
  { id: 'certificate', label: 'Certificate' },
  { id: 'other', label: 'Other' },
];

export default function AddPrintableDialog({ open, onClose, onSuccess }) {
  const pdfInputRef = useRef(null);
  const thumbnailInputRef = useRef(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingPdf, setIsUploadingPdf] = useState(false);
  const [isUploadingThumb, setIsUploadingThumb] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    category: 'other',
    description: '',
    pdf_url: '',
    thumbnail: ''
  });

  const handlePdfUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsUploadingPdf(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setFormData({ ...formData, pdf_url: file_url });
    } catch (error) {
      toast.error('Failed to upload PDF');
    } finally {
      setIsUploadingPdf(false);
    }
  };

  const handleThumbnailUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsUploadingThumb(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setFormData({ ...formData, thumbnail: file_url });
    } catch (error) {
      toast.error('Failed to upload thumbnail');
    } finally {
      setIsUploadingThumb(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.pdf_url) {
      toast.error('Title and PDF are required');
      return;
    }

    setIsSubmitting(true);
    try {
      await base44.entities.PrintableTemplate.create({
        ...formData,
        downloads_count: 0
      });
      toast.success('Printable added!');
      onSuccess?.();
      onClose();
    } catch (error) {
      toast.error('Failed to add printable');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Printable Template</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Title *</Label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Template name"
              className="mt-1"
            />
          </div>

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
            <Label>Description</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="What is this template for?"
              rows={2}
              className="mt-1"
            />
          </div>

          <div>
            <Label>PDF Document *</Label>
            <div className="mt-1">
              {formData.pdf_url ? (
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <span className="text-sm text-green-600">✓ PDF uploaded</span>
                  <Button type="button" variant="ghost" size="sm" onClick={() => setFormData({ ...formData, pdf_url: '' })}>
                    Remove
                  </Button>
                </div>
              ) : (
                <Button type="button" variant="outline" className="w-full" onClick={() => pdfInputRef.current?.click()} disabled={isUploadingPdf}>
                  {isUploadingPdf ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Upload className="w-4 h-4 mr-2" />}
                  Upload PDF
                </Button>
              )}
              <input ref={pdfInputRef} type="file" accept=".pdf" onChange={handlePdfUpload} className="hidden" />
            </div>
          </div>

          <div>
            <Label>Thumbnail Image</Label>
            <div className="mt-1">
              {formData.thumbnail ? (
                <div className="relative">
                  <img src={formData.thumbnail} alt="" className="w-full h-32 object-cover rounded-lg" />
                  <Button type="button" variant="ghost" size="sm" className="absolute top-1 right-1 bg-white/80" onClick={() => setFormData({ ...formData, thumbnail: '' })}>
                    Remove
                  </Button>
                </div>
              ) : (
                <Button type="button" variant="outline" className="w-full" onClick={() => thumbnailInputRef.current?.click()} disabled={isUploadingThumb}>
                  {isUploadingThumb ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Upload className="w-4 h-4 mr-2" />}
                  Upload Thumbnail
                </Button>
              )}
              <input ref={thumbnailInputRef} type="file" accept="image/*" onChange={handleThumbnailUpload} className="hidden" />
            </div>
          </div>

          <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
            Add Printable
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}