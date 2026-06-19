import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { createPageUrl } from '@/utils';
import { toast } from 'sonner';

const CATEGORIES = [
  { id: 'tents', label: '⛺ Tents' },
  { id: 'camping_gear', label: '🏕️ Camping Gear' },
  { id: 'uniforms', label: '👕 Uniforms' },
  { id: 'ropes', label: '🪢 Ropes' },
  { id: 'compasses', label: '🧭 Compasses' },
  { id: 'tools', label: '🔧 Tools' },
  { id: 'other', label: '📦 Other' },
];

export default function PostRental() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [images, setImages] = useState([]);
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: '',
    price_per_day: '',
    deposit: '',
    location: '',
    condition: 'good',
    owner_phone: '',
    available_from: '',
    available_until: '',
  });

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const u = await base44.auth.me();
        setUser(u);
      } catch (error) {
        toast.error('Failed to load user information');
      }
    };
    fetchUser();
  }, []);

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setUploading(true);
    try {
      for (const file of files) {
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        setImages(prev => [...prev, file_url]);
      }
    } catch (error) {
      toast.error('Failed to upload images');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.category || !form.price_per_day) {
      toast.error('Please fill in all required fields');
      return;
    }
    if (!user) {
      toast.error('Please log in to post a rental');
      return;
    }
    setSubmitting(true);
    try {
      await base44.entities.RentalListing.create({
        ...form,
        price_per_day: Number(form.price_per_day),
        deposit: form.deposit ? Number(form.deposit) : 0,
        images,
        owner_id: user.id,
        owner_name: user.full_name,
        owner_avatar: user.avatar,
        status: 'available',
      });
      toast.success('Rental listing posted!');
      navigate(createPageUrl('Marketplace') + '?tab=rent');
    } catch (error) {
      toast.error('Failed to post rental listing');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-10">
      <div className="bg-gradient-to-r from-teal-500 to-cyan-600 text-white px-4 py-5">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <Button variant="ghost" size="icon" className="text-white hover:bg-white/20" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold">Post Equipment for Rent</h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="max-w-lg mx-auto px-4 py-6 space-y-5">
        {/* Images */}
        <div>
          <Label>Photos</Label>
          <div className="flex gap-2 flex-wrap mt-2">
            {images.map((url, i) => (
              <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden border">
                <img src={url} alt="" className="w-full h-full object-cover" />
                <button type="button" onClick={() => setImages(prev => prev.filter((_, j) => j !== i))}
                  className="absolute top-1 right-1 bg-black/60 rounded-full p-0.5">
                  <X className="w-3 h-3 text-white" />
                </button>
              </div>
            ))}
            <label className="w-20 h-20 rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:border-teal-400 transition-colors">
              <Upload className="w-5 h-5 text-gray-400" />
              <span className="text-xs text-gray-400 mt-1">Add</span>
              <input type="file" accept="image/*" multiple className="hidden" onChange={handleImageUpload} />
            </label>
          </div>
          {uploading && <p className="text-xs text-teal-500 mt-1">Uploading...</p>}
        </div>

        <div>
          <Label>Title *</Label>
          <Input className="mt-1" placeholder="e.g. 3-Person Camping Tent" value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
        </div>

        <div>
          <Label>Category *</Label>
          <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
            <SelectTrigger className="mt-1"><SelectValue placeholder="Select category" /></SelectTrigger>
            <SelectContent>
              {CATEGORIES.map(c => <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Description</Label>
          <Textarea className="mt-1" rows={3} placeholder="Describe the equipment, its condition, and any usage terms..."
            value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Label>Price per Day (RWF) *</Label>
            <Input className="mt-1" type="number" min="0" placeholder="e.g. 2000"
              value={form.price_per_day} onChange={e => setForm(f => ({ ...f, price_per_day: e.target.value }))} />
          </div>
          <div className="flex-1">
            <Label>Deposit (RWF)</Label>
            <Input className="mt-1" type="number" min="0" placeholder="Optional"
              value={form.deposit} onChange={e => setForm(f => ({ ...f, deposit: e.target.value }))} />
          </div>
        </div>

        <div>
          <Label>Condition</Label>
          <Select value={form.condition} onValueChange={v => setForm(f => ({ ...f, condition: v }))}>
            <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="new">New</SelectItem>
              <SelectItem value="like_new">Like New</SelectItem>
              <SelectItem value="good">Good</SelectItem>
              <SelectItem value="fair">Fair</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Location</Label>
          <Input className="mt-1" placeholder="e.g. Kigali, Nyarugenge"
            value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} />
        </div>

        <div>
          <Label>Contact Phone</Label>
          <Input className="mt-1" placeholder="e.g. +250 7XX XXX XXX"
            value={form.owner_phone} onChange={e => setForm(f => ({ ...f, owner_phone: e.target.value }))} />
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Label>Available From</Label>
            <Input className="mt-1" type="date" value={form.available_from}
              onChange={e => setForm(f => ({ ...f, available_from: e.target.value }))} />
          </div>
          <div className="flex-1">
            <Label>Available Until</Label>
            <Input className="mt-1" type="date" value={form.available_until}
              onChange={e => setForm(f => ({ ...f, available_until: e.target.value }))} />
          </div>
        </div>

        <Button type="submit" disabled={submitting} className="w-full bg-teal-600 hover:bg-teal-700">
          {submitting ? 'Posting...' : 'Post Rental Listing'}
        </Button>
      </form>
    </div>
  );
}
