import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload, Loader2, Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { createPageUrl } from '@/utils';
import { toast } from 'sonner';

export default function EditUnit() {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const unitId = urlParams.get('id');
  const type = urlParams.get('type') || 'unit'; // 'unit' or 'clan'
  
  const avatarInputRef = useRef(null);
  const coverInputRef = useRef(null);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    location: '',
    avatar: '',
    cover_image: '',
    founded_date: ''
  });

  useEffect(() => {
    const fetchData = async () => {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
      
      if (unitId) {
        const Entity = type === 'clan' ? base44.entities.Clan : base44.entities.Unit;
        const items = await Entity.filter({ id: unitId });
        if (items[0]) {
          // Check if user is admin
          if (items[0].admin_email !== currentUser.email && currentUser.role !== 'admin') {
            navigate(createPageUrl('Home'));
            return;
          }
          setFormData({
            name: items[0].name || '',
            description: items[0].description || '',
            location: items[0].location || '',
            avatar: items[0].avatar || '',
            cover_image: items[0].cover_image || '',
            founded_date: items[0].founded_date || ''
          });
        }
      }
      setIsLoading(false);
    };
    fetchData();
  }, [unitId, type]);

  const handleImageUpload = async (e, field) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setFormData(prev => ({ ...prev, [field]: file_url }));
    } catch (error) {
      toast.error('Failed to upload image');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error('Name is required');
      return;
    }
    
    setIsSaving(true);
    try {
      const Entity = type === 'clan' ? base44.entities.Clan : base44.entities.Unit;
      await Entity.update(unitId, formData);
      toast.success(`${type === 'clan' ? 'Clan' : 'Unit'} updated!`);
      navigate(createPageUrl(`${type === 'clan' ? 'Clan' : 'Unit'}?id=${unitId}`));
    } catch (error) {
      toast.error('Failed to save');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 border-b px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="font-semibold">Edit {type === 'clan' ? 'Clan' : 'Unit'}</h1>
        </div>
        <Button onClick={handleSave} disabled={isSaving} className="bg-emerald-600 hover:bg-emerald-700">
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
          Save
        </Button>
      </div>

      {/* Cover Image */}
      <div className="relative">
        <div 
          className="h-40 bg-gradient-to-r from-blue-400 to-blue-600 cursor-pointer"
          onClick={() => coverInputRef.current?.click()}
        >
          {formData.cover_image ? (
            <img src={formData.cover_image} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Camera className="w-8 h-8 text-white/50" />
            </div>
          )}
          <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
            <span className="text-white font-medium">Change Cover</span>
          </div>
        </div>
        <input
          ref={coverInputRef}
          type="file"
          accept="image/*"
          onChange={(e) => handleImageUpload(e, 'cover_image')}
          className="hidden"
        />

        {/* Avatar */}
        <div 
          className="absolute -bottom-12 left-6 cursor-pointer"
          onClick={() => avatarInputRef.current?.click()}
        >
          <div className="w-24 h-24 rounded-2xl ring-4 ring-white dark:ring-gray-900 overflow-hidden bg-gray-200 relative">
            {formData.avatar ? (
              <img src={formData.avatar} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-blue-500 text-white text-3xl font-bold">
                {formData.name?.charAt(0) || '?'}
              </div>
            )}
            <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
              <Camera className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
        <input
          ref={avatarInputRef}
          type="file"
          accept="image/*"
          onChange={(e) => handleImageUpload(e, 'avatar')}
          className="hidden"
        />
      </div>

      {/* Form */}
      <div className="pt-16 px-4 pb-8 space-y-6">
        <div>
          <Label>Name *</Label>
          <Input
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder={`${type === 'clan' ? 'Clan' : 'Unit'} name`}
            className="mt-1"
          />
        </div>

        <div>
          <Label>Description</Label>
          <Textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Tell us about your group..."
            rows={4}
            className="mt-1"
          />
        </div>

        <div>
          <Label>Location</Label>
          <Input
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            placeholder="Where are you based?"
            className="mt-1"
          />
        </div>

        <div>
          <Label>Founded Date</Label>
          <Input
            type="date"
            value={formData.founded_date}
            onChange={(e) => setFormData({ ...formData, founded_date: e.target.value })}
            className="mt-1"
          />
        </div>
      </div>
    </div>
  );
}