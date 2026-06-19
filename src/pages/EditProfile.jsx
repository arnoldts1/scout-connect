import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Camera, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue } from
'@/components/ui/select';
import { createPageUrl } from '@/utils';
import { toast } from 'sonner';

export default function EditProfile() {
  const navigate = useNavigate();
  const avatarInputRef = useRef(null);
  const coverInputRef = useRef(null);

  const [user, setUser] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);

  const [formData, setFormData] = useState({
    username: '',
    full_name: '',
    bio: '',
    location: '',
    phone: '',
    date_of_birth: '',
    avatar: '',
    cover_image: '',
    scout_rank: ''
  });

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
        setFormData({
          username: currentUser.username || '',
          full_name: currentUser.full_name || '',
          bio: currentUser.bio || '',
          location: currentUser.location || '',
          phone: currentUser.phone || '',
          date_of_birth: currentUser.date_of_birth || '',
          avatar: currentUser.avatar || '',
          cover_image: currentUser.cover_image || '',
          scout_rank: currentUser.scout_rank || ''
        });
      } catch (error) {
        navigate(createPageUrl('Home'));
      }
    };
    fetchUser();
  }, []);

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingAvatar(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setFormData((prev) => ({ ...prev, avatar: file_url }));
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast.error('Failed to upload image');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleCoverUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingCover(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setFormData((prev) => ({ ...prev, cover_image: file_url }));
    } catch (error) {
      console.error('Error uploading cover:', error);
      toast.error('Failed to upload image');
    } finally {
      setIsUploadingCover(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      await base44.auth.updateMe({
        username: formData.username,
        bio: formData.bio,
        location: formData.location,
        phone: formData.phone,
        date_of_birth: formData.date_of_birth,
        avatar: formData.avatar,
        cover_image: formData.cover_image,
        scout_rank: formData.scout_rank
      });
      toast.success('Profile updated successfully');
      navigate(createPageUrl('Profile'));
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-white dark:bg-gray-900 min-h-screen">
      {/* Header */}
      <div className="sticky top-14 z-10 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center justify-between px-4 py-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}>

            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="font-semibold text-lg">Edit Profile</h1>
          <Button
            variant="ghost"
            className="text-emerald-600 font-semibold"
            onClick={handleSubmit}
            disabled={isSaving}>

            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save'}
          </Button>
        </div>
      </div>

      {/* Cover Image */}
      <div className="relative h-32 bg-gradient-to-r from-emerald-400 to-teal-500">
        {formData.cover_image &&
        <img
          src={formData.cover_image}
          alt="Cover"
          className="w-full h-full object-cover" />

        }
        <input
          ref={coverInputRef}
          type="file"
          accept="image/*"
          onChange={handleCoverUpload}
          className="hidden" />

        <button
          onClick={() => coverInputRef.current?.click()}
          disabled={isUploadingCover}
          className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 hover:opacity-100 transition-opacity">

          {isUploadingCover ?
          <Loader2 className="w-6 h-6 text-white animate-spin" /> :

          <Camera className="w-6 h-6 text-white" />
          }
        </button>
      </div>

      {/* Avatar */}
      <div className="relative -mt-16 px-4 mb-6">
        <div className="relative inline-block">
          <Avatar className="w-32 h-32 ring-4 ring-white dark:ring-gray-900 shadow-lg">
            <AvatarImage src={formData.avatar} />
            <AvatarFallback className="text-4xl bg-emerald-100 text-emerald-700">
              {formData.full_name?.charAt(0) || 'S'}
            </AvatarFallback>
          </Avatar>
          <input
            ref={avatarInputRef}
            type="file"
            accept="image/*"
            onChange={handleAvatarUpload}
            className="hidden" />

          <button
            onClick={() => avatarInputRef.current?.click()}
            disabled={isUploadingAvatar}
            className="absolute inset-0 rounded-full flex items-center justify-center bg-black/30 opacity-0 hover:opacity-100 transition-opacity">

            {isUploadingAvatar ?
            <Loader2 className="w-6 h-6 text-white animate-spin" /> :

            <Camera className="w-6 h-6 text-white" />
            }
          </button>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="px-4 pb-8 space-y-6">
        <div className="space-y-2">
          <Label htmlFor="username">Username</Label>
          <Input
            id="username"
            value={formData.username}
            onChange={(e) => setFormData((prev) => ({ ...prev, username: e.target.value }))}
            placeholder="Your username" />

        </div>

        <div className="space-y-2">
          <Label htmlFor="name">Full Name</Label>
          <Input
            id="name"
            value={formData.full_name}
            disabled
            className="bg-gray-50" />

          <p className="text-xs text-gray-500">Name cannot be changed here</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="bio">Bio</Label>
          <Textarea
            id="bio"
            value={formData.bio}
            onChange={(e) => setFormData((prev) => ({ ...prev, bio: e.target.value }))}
            placeholder="Tell scouts about yourself..."
            className="min-h-[100px]"
            maxLength={150} />

          <p className="text-xs text-gray-500 text-right">{formData.bio.length}/150</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="location">Location</Label>
          <Input
            id="location"
            value={formData.location}
            onChange={(e) => setFormData((prev) => ({ ...prev, location: e.target.value }))}
            placeholder="Your location" />

        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
            placeholder="+250 xxx xxx xxx" />

        </div>

        <div className="space-y-2">
          <Label htmlFor="dob">Date of Birth</Label>
          <Input
            id="dob"
            type="date"
            value={formData.date_of_birth}
            onChange={(e) => setFormData((prev) => ({ ...prev, date_of_birth: e.target.value }))} />

        </div>

        <div className="space-y-2">
          <Label htmlFor="rank" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Icyiciro Cy'ubu Scout
          </Label>
          <Select value={formData.scout_rank}
          onValueChange={(value) => setFormData((prev) => ({ ...prev, scout_rank: value }))}>

            <SelectTrigger>
              <SelectValue placeholder="Select your rank" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="abatoni">Abatoni</SelectItem>
              <SelectItem value="inkesha">Inkesha</SelectItem>
              <SelectItem value="abahizi">Abahizi</SelectItem>
              <SelectItem value="ingenzi">Ingenzi</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button
          type="submit"
          className="w-full bg-emerald-600 hover:bg-emerald-700 rounded-full"
          disabled={isSaving}>

          {isSaving ?
          <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </> :

          'Save Changes'
          }
        </Button>
      </form>
    </div>);

}