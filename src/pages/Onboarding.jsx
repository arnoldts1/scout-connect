import { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { supabase } from '@/lib/supabase';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Users, ArrowRight, Loader2, CheckCircle2, Camera, Phone, Calendar, Award } from 'lucide-react';
import { createPageUrl } from '@/utils';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import ImageCropper from '@/components/ui/ImageCropper';
import WoodBadgeIcon, { BEAD_DESCRIPTIONS } from '@/components/ui/WoodBadgeIcon';
import { Checkbox } from '@/components/ui/checkbox';

const generateScoutId = () => {
  const year = new Date().getFullYear();
  const num = Math.floor(Math.random() * 90000) + 10000;
  return `RSA-${year}-${num}`;
};

const calculateScoutRank = (dateOfBirth) => {
  if (!dateOfBirth) return null;
  const today = new Date();
  const birth = new Date(dateOfBirth);
  const age = today.getFullYear() - birth.getFullYear();
  
  if (age >= 6 && age <= 12) return 'abatoni';
  if (age >= 13 && age <= 16) return 'inkesha';
  if (age >= 17 && age <= 20) return 'abahizi';
  if (age >= 21 && age <= 25) return 'ingenzi';
  if (age > 25) return 'elder';
  return null;
};

const RANK_LABELS = {
  abatoni: 'Abatoni (6-12 years)',
  inkesha: 'Inkesha (13-16 years)',
  abahizi: 'Abahizi (17-20 years)',
  ingenzi: 'Ingenzi (21-25 years)',
  elder: 'Elder Scout (25+)'
};

export default function Onboarding() {
  const [step, setStep] = useState(1);
  const [groupType, setGroupType] = useState('');
  const [action, setAction] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('');
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDescription, setNewGroupDescription] = useState('');
  const [newGroupLocation, setNewGroupLocation] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [user, setUser] = useState(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [showCropper, setShowCropper] = useState(false);
  const [cropImageSrc, setCropImageSrc] = useState('');
  
  // Profile setup fields
  const [avatar, setAvatar] = useState('');
  const [phone, setPhone] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [scoutRank, setScoutRank] = useState('');
  const [hasWoodBadge, setHasWoodBadge] = useState(false);
  const [woodBadgeBeads, setWoodBadgeBeads] = useState(2);
  
  const avatarInputRef = useRef(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
        if (currentUser?.onboarding_complete) {
          window.location.href = createPageUrl('Home');
        }
        if (currentUser?.avatar) setAvatar(currentUser.avatar);
        if (currentUser?.phone) setPhone(currentUser.phone);
        if (currentUser?.date_of_birth) {
          setDateOfBirth(currentUser.date_of_birth);
          setScoutRank(calculateScoutRank(currentUser.date_of_birth));
        }
      } catch {
        // User might not be authenticated yet (just signed up)
        // Try to get from supabase auth directly
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (authUser) {
          setUser({
            id: authUser.id,
            email: authUser.email,
            full_name: authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || '',
          });
        }
      }
    };
    fetchUser();
  }, []);

  useEffect(() => {
    if (dateOfBirth) {
      const rank = calculateScoutRank(dateOfBirth);
      setScoutRank(rank);
    }
  }, [dateOfBirth]);

  const { data: units = [] } = useQuery({
    queryKey: ['onboarding-units'],
    queryFn: () => base44.entities.Unit.filter({ status: 'active' }),
    enabled: groupType === 'unit' && action === 'join',
  });

  const { data: clans = [] } = useQuery({
    queryKey: ['onboarding-clans'],
    queryFn: () => base44.entities.Clan.filter({ status: 'active' }),
    enabled: groupType === 'clan' && action === 'join',
  });

  const handleAvatarSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file is an image
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Check file size (limit to 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setCropImageSrc(event.target.result);
        setShowCropper(true);
      }
    };
    reader.onerror = () => {
      toast.error('Failed to read image file');
      console.error('FileReader error:', reader.error);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleCropComplete = async (croppedFile) => {
    setShowCropper(false);
    setIsUploadingAvatar(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file: croppedFile });

      // Avatar uploaded successfully
      setAvatar(file_url);
      toast.success('Profile photo uploaded successfully!');
    } catch (error) {
      console.error('Avatar upload error:', error);
      toast.error('Failed to upload photo. Please try again.');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleCancelCrop = () => {
    setShowCropper(false);
    setCropImageSrc('');
  };

  const handleSubmitNoGroup = async () => {
    if (!user) return;
    setIsSubmitting(true);

    try {
      const scoutId = user?.scout_id || generateScoutId();
      const profileData = {
        email: user.email,
        full_name: user.full_name,
        avatar: avatar || null,
        phone: phone || null,
        scout_rank: scoutRank || null,
        scout_id: scoutId,
        onboarding_complete: true,
        has_wood_badge: hasWoodBadge,
        wood_badge_beads: hasWoodBadge ? woodBadgeBeads : null,
        wood_badge_status: hasWoodBadge ? 'pending' : null,
        updated_date: new Date().toISOString()
      };

      // Add date_of_birth only if provided
      if (dateOfBirth) {
        profileData.date_of_birth = dateOfBirth;
      }

      // Update Supabase Auth metadata with onboarding_complete flag
      console.log('Updating onboarding flag');
      const { error: authError } = await supabase.auth.updateUser({
        data: {
          onboarding_complete: true,
          avatar: avatar || null,
          phone: phone || null,
          scout_rank: scoutRank || null,
          scout_id: scoutId,
          has_wood_badge: hasWoodBadge,
          wood_badge_beads: hasWoodBadge ? woodBadgeBeads : null,
          wood_badge_status: hasWoodBadge ? 'pending' : null,
          date_of_birth: dateOfBirth || null
        }
      });

      if (authError) {
        console.error('Auth update error:', authError);
        throw new Error(`Failed to update auth: ${authError.message}`);
      }
      console.log('Onboarding flag set successfully');

      // Also update the users table to ensure flag persists
      const { error: dbError } = await supabase
        .from('users')
        .update({
          ...profileData,
          updated_date: new Date().toISOString()
        })
        .eq('id', user.id);

      if (dbError) {
        console.warn('Database update error (non-critical):', dbError);
      }

      // Refresh the session to get the updated metadata
      const { error: refreshError } = await supabase.auth.refreshSession();
      if (refreshError) {
        console.warn('Session refresh warning:', refreshError);
      }
      
      // Create or update PublicProfile so user is visible to everyone
      const { data: existingProfile, error: profileLookupError } = await supabase
        .from('public_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      // A missing row is expected for a new user; other lookup errors are not.
      if (profileLookupError && profileLookupError.code !== 'PGRST116') {
        throw profileLookupError;
      }

      const publicProfileData = {
        user_id: user.id,
        username: user.username || user.email?.split('@')[0],
        full_name: user.full_name,
        email: user.email,
        avatar: avatar || null,
        rank: scoutRank || null,
        scout_id: scoutId,
        followers_count: 0,
        following_count: 0,
        posts_count: 0,
        is_verified: false,
        is_org_leader: false,
        wood_badge_beads: hasWoodBadge ? woodBadgeBeads : 0
      };

      if (existingProfile?.id) {
        const { error: profileUpdateError } = await supabase
          .from('public_profiles')
          .update(publicProfileData)
          .eq('id', existingProfile.id);
        if (profileUpdateError) throw profileUpdateError;
      } else {
        const { error: profileInsertError } = await supabase
          .from('public_profiles')
          .insert(publicProfileData);
        if (profileInsertError) throw profileInsertError;
      }

      toast.success('Onboarding completed!');
      setTimeout(() => {
        window.location.href = createPageUrl('Home');
      }, 1000);
    } catch (error) {
      console.error('Error completing onboarding:', error);
      toast.error('Something went wrong');
      setIsSubmitting(false);
    }
  }

  const handleSubmit = async () => {
    if (!user) return;
    setIsSubmitting(true);

    try {
      const scoutId = user?.scout_id || generateScoutId();
      const profileData = {
        full_name: user.full_name,
        email: user.email,
        avatar: avatar || null,
        phone: phone || null,
        scout_rank: scoutRank || null,
        scout_id: scoutId,
        onboarding_complete: true,
        has_wood_badge: hasWoodBadge,
        wood_badge_beads: hasWoodBadge ? woodBadgeBeads : null,
        wood_badge_status: hasWoodBadge ? 'pending' : null,
        updated_date: new Date().toISOString()
      };

      // Add date_of_birth only if provided
      if (dateOfBirth) {
        profileData.date_of_birth = dateOfBirth;
      }

      if (action === 'create') {
        if (groupType === 'unit') {
          const newUnit = await base44.entities.Unit.create({
            name: newGroupName,
            description: newGroupDescription,
            location: newGroupLocation,
            admin_id: user.id,
            admin_email: user.email,
            members: [user.id],
            member_count: 1,
            points: 0,
            status: 'active',
            founded_date: new Date().toISOString().split('T')[0]
          });
          
          profileData.unit_id = newUnit.id;
          profileData.unit_name = newGroupName;
        } else {
          const newClan = await base44.entities.Clan.create({
            name: newGroupName,
            description: newGroupDescription,
            location: newGroupLocation,
            admin_id: user.id,
            admin_email: user.email,
            leaders: [user.id],
            members: [user.id],
            member_count: 1,
            points: 0,
            status: 'active',
            founded_date: new Date().toISOString().split('T')[0]
          });
          
          profileData.clan_id = newClan.id;
          profileData.clan_name = newGroupName;
        }
      } else {
        if (groupType === 'unit') {
          const unit = units.find(u => u.id === selectedGroup);
          if (unit) {
            await base44.entities.Unit.update(unit.id, {
              members: [...(unit.members || []), user.id],
              member_count: (unit.member_count || 0) + 1
            });
            profileData.unit_id = unit.id;
            profileData.unit_name = unit.name;
          }
        } else {
          const clan = clans.find(c => c.id === selectedGroup);
          if (clan) {
            await base44.entities.Clan.update(clan.id, {
              members: [...(clan.members || []), user.id],
              member_count: (clan.member_count || 0) + 1
            });
            profileData.clan_id = clan.id;
            profileData.clan_name = clan.name;
          }
        }
      }

      // Update Supabase Auth metadata with onboarding_complete flag
      console.log('Updating onboarding flag with group');
      const { error: authError } = await supabase.auth.updateUser({
        data: {
          onboarding_complete: true,
          avatar: avatar || null,
          phone: phone || null,
          scout_rank: scoutRank || null,
          scout_id: scoutId,
          has_wood_badge: hasWoodBadge,
          wood_badge_beads: hasWoodBadge ? woodBadgeBeads : null,
          wood_badge_status: hasWoodBadge ? 'pending' : null,
          date_of_birth: dateOfBirth || null,
          unit_id: profileData.unit_id || null,
          unit_name: profileData.unit_name || null,
          clan_id: profileData.clan_id || null,
          clan_name: profileData.clan_name || null
        }
      });

      if (authError) {
        console.error('Auth update error:', authError);
        throw new Error(`Failed to update auth: ${authError.message}`);
      }
      console.log('Onboarding flag set successfully');

      // Also update the users table to ensure flag persists
      const { error: dbError } = await supabase
        .from('users')
        .update({
          ...profileData,
          updated_date: new Date().toISOString()
        })
        .eq('id', user.id);

      if (dbError) {
        throw dbError;
      }

      // Refresh the session to get the updated metadata
      const { error: refreshError } = await supabase.auth.refreshSession();
      if (refreshError) {
        console.warn('Session refresh warning:', refreshError);
      }

      // Create or update PublicProfile so user is visible to everyone
      const existingProfiles = await supabase
        .from('public_profiles')
        .select('id')
        .eq('user_id', user.id);

      if (existingProfiles.error) {
        throw existingProfiles.error;
      }

      const publicProfileData = {
        user_id: user.id,
        full_name: user.full_name,
        username: user.username || user.email?.split('@')[0],
        email: user.email,
        avatar: avatar,
        bio: '',
        location: newGroupLocation || '',
        unit_name: profileData.unit_name || '',
        clan_name: profileData.clan_name || '',
        rank: scoutRank,
        followers_count: 0,
        following_count: 0,
        posts_count: 0,
        is_verified: false,
        is_org_leader: false,
        wood_badge_beads: hasWoodBadge ? woodBadgeBeads : 0
      };

      if (existingProfiles.data && existingProfiles.data.length > 0) {
        const { error: profileUpdateError } = await supabase
          .from('public_profiles')
          .update(publicProfileData)
          .eq('user_id', user.id);
        if (profileUpdateError) throw profileUpdateError;
      } else {
        const { error: profileInsertError } = await supabase
          .from('public_profiles')
          .insert(publicProfileData);
        if (profileInsertError) throw profileInsertError;
      }

      toast.success('Onboarding completed!');
      setTimeout(() => {
        window.location.href = createPageUrl('Home');
      }, 1000);
    } catch (error) {
      console.error('Error completing onboarding:', error);
      toast.error('Something went wrong');
      setIsSubmitting(false);
    }
  }

  const canProceedStep1 = avatar && phone && dateOfBirth;
  const canProceedStep2 = groupType !== '';
  const canProceedStep3 = action !== '';
  const canSubmit = action === 'create' ? newGroupName.trim() !== '' : selectedGroup !== '';

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 flex items-center justify-center p-4">
      {showCropper && (
        <ImageCropper
          imageSrc={cropImageSrc}
          onCropComplete={handleCropComplete}
          onCancel={handleCancelCrop}
        />
      )}
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-2xl flex items-center justify-center shadow-xl">
            <Users className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Welcome to Scout Connect</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2">Let's set up your profile</p>
        </div>

        {/* Progress */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {[1, 2, 3, 4].map((s) => (
            <div
              key={s}
              className={cn(
                "w-3 h-3 rounded-full transition-all duration-300",
                step >= s ? "bg-emerald-500 scale-110" : "bg-gray-200 dark:bg-gray-700"
              )}
            />
          ))}
        </div>

        {/* Card */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-6 md:p-8">
          
          {/* Step 1: Profile Setup */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  Set Up Your Profile
                </h2>
                <p className="text-gray-500 dark:text-gray-400 text-sm">
                  Add your photo and personal details
                </p>
              </div>

              {/* Avatar Upload */}
              <div className="flex flex-col items-center">
                <div className="relative">
                  <Avatar className="w-24 h-24">
                    <AvatarImage src={avatar} />
                    <AvatarFallback className="text-2xl bg-emerald-100 text-emerald-700">
                      {user?.full_name?.charAt(0) || 'S'}
                    </AvatarFallback>
                  </Avatar>
                  <input
                    ref={avatarInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarSelect}
                    className="hidden"
                  />
                  <button
                    onClick={() => avatarInputRef.current?.click()}
                    disabled={isUploadingAvatar}
                    className="absolute bottom-0 right-0 w-8 h-8 bg-emerald-600 rounded-full flex items-center justify-center text-white shadow-lg hover:bg-emerald-700"
                  >
                    {isUploadingAvatar ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
                  📸 Please upload a portrait photo wearing your scout uniform
                </p>
              </div>

              <div>
                <Label htmlFor="phone" className="flex items-center gap-2">
                  <Phone className="w-4 h-4" /> Phone Number *
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+250 xxx xxx xxx"
                  className="mt-1.5 h-12 rounded-xl"
                />
              </div>

              <div>
                <Label htmlFor="dob" className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" /> Date of Birth *
                </Label>
                <Input
                  id="dob"
                  type="date"
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                  className="mt-1.5 h-12 rounded-xl"
                />
              </div>

              {scoutRank && (
                <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Your Scout Rank:</p>
                  <p className="font-semibold text-emerald-700 dark:text-emerald-400 capitalize">
                    {RANK_LABELS[scoutRank]}
                  </p>
                </div>
              )}

              {/* Scout ID Preview */}
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center flex-shrink-0">
                  <span className="text-blue-600 font-bold text-sm">ID</span>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Your Scout ID (auto-generated)</p>
                  <p className="font-mono font-bold text-blue-700 dark:text-blue-400 text-sm">
                    {user?.scout_id || 'RSA-2026-XXXXX (assigned on completion)'}
                  </p>
                </div>
              </div>

              {/* Wood Badge Section */}
              <div className="border-t pt-4">
                <div className="flex items-center space-x-3 mb-3">
                  <Checkbox 
                    id="woodbadge" 
                    checked={hasWoodBadge}
                    onCheckedChange={setHasWoodBadge}
                  />
                  <label htmlFor="woodbadge" className="flex items-center gap-2 cursor-pointer">
                    <Award className="w-4 h-4 text-amber-600" />
                    <span className="font-medium text-gray-900 dark:text-white">I have a Wood Badge</span>
                  </label>
                </div>

                {hasWoodBadge && (
                  <div className="ml-6 space-y-3 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl">
                    <div className="flex items-center gap-4">
                      <WoodBadgeIcon beads={woodBadgeBeads} size="lg" />
                      <div className="flex-1">
                        <Label>Number of Beads</Label>
                        <Select value={woodBadgeBeads.toString()} onValueChange={(v) => setWoodBadgeBeads(parseInt(v))}>
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="2">2 Beads - Completed Training</SelectItem>
                            <SelectItem value="3">3 Beads - Assistant Leader Trainer</SelectItem>
                            <SelectItem value="4">4 Beads - Course Director</SelectItem>
                            <SelectItem value="5">5 Beads - Deputy Camp Chief</SelectItem>
                            <SelectItem value="6">6 Beads - Camp Chief of Gilwell</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <p className="text-xs text-amber-700 dark:text-amber-400">
                      {BEAD_DESCRIPTIONS[woodBadgeBeads]}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 italic">
                      ⚠️ Your Wood Badge will need admin approval before being displayed on your profile.
                    </p>
                  </div>
                )}
              </div>

              <Button
                onClick={() => setStep(2)}
                disabled={!canProceedStep1}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white h-12 rounded-xl"
              >
                Continue
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          )}

          {/* Step 2: Choose group type */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  What would you like to join?
                </h2>
                <p className="text-gray-500 dark:text-gray-400 text-sm">
                  Select the type of group you belong to
                </p>
              </div>

              <RadioGroup value={groupType} onValueChange={setGroupType} className="space-y-3">
                <label className={cn(
                  "flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all duration-200",
                  groupType === 'unit' ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20" : "border-gray-200 dark:border-gray-700"
                )}>
                  <RadioGroupItem value="unit" id="unit" />
                  <div className="flex-1">
                    <span className="font-medium text-gray-900 dark:text-white">Unit</span>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Join or create a scout unit</p>
                  </div>
                </label>

                <label className={cn(
                  "flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all duration-200",
                  groupType === 'clan' ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20" : "border-gray-200 dark:border-gray-700"
                )}>
                  <RadioGroupItem value="clan" id="clan" />
                  <div className="flex-1">
                    <span className="font-medium text-gray-900 dark:text-white">Clan</span>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Join or create a scout clan</p>
                  </div>
                </label>

                <label className={cn(
                  "flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all duration-200",
                  groupType === 'none' ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20" : "border-gray-200 dark:border-gray-700"
                )}>
                  <RadioGroupItem value="none" id="none" />
                  <div className="flex-1">
                    <span className="font-medium text-gray-900 dark:text-white">No Unit/Clan</span>
                    <p className="text-sm text-gray-500 dark:text-gray-400">I don't have a unit or clan yet</p>
                  </div>
                </label>
              </RadioGroup>

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep(1)} className="flex-1 h-12 rounded-xl">Back</Button>
                <Button 
                  onClick={() => groupType === 'none' ? handleSubmitNoGroup() : setStep(3)} 
                  disabled={!canProceedStep2} 
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white h-12 rounded-xl"
                >
                  {groupType === 'none' ? (
                    isSubmitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Setting up...</> : <><CheckCircle2 className="w-4 h-4 mr-2" />Complete Setup</>
                  ) : (
                    <>Continue <ArrowRight className="w-4 h-4 ml-2" /></>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Join or Create */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  Join or Create a {groupType === 'unit' ? 'Unit' : 'Clan'}?
                </h2>
              </div>

              <RadioGroup value={action} onValueChange={setAction} className="space-y-3">
                <label className={cn(
                  "flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all duration-200",
                  action === 'join' ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20" : "border-gray-200 dark:border-gray-700"
                )}>
                  <RadioGroupItem value="join" id="join" />
                  <div className="flex-1">
                    <span className="font-medium text-gray-900 dark:text-white">Join Existing</span>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Select from available {groupType === 'unit' ? 'units' : 'clans'}</p>
                  </div>
                </label>

                <label className={cn(
                  "flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all duration-200",
                  action === 'create' ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20" : "border-gray-200 dark:border-gray-700"
                )}>
                  <RadioGroupItem value="create" id="create" />
                  <div className="flex-1">
                    <span className="font-medium text-gray-900 dark:text-white">Create New</span>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Start a new {groupType} (you'll be the admin)</p>
                  </div>
                </label>
              </RadioGroup>

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep(2)} className="flex-1 h-12 rounded-xl">Back</Button>
                <Button onClick={() => setStep(4)} disabled={!canProceedStep3} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white h-12 rounded-xl">
                  Continue <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 4: Details */}
          {step === 4 && (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  {action === 'create' ? `Create Your ${groupType === 'unit' ? 'Unit' : 'Clan'}` : `Select Your ${groupType === 'unit' ? 'Unit' : 'Clan'}`}
                </h2>
              </div>

              {action === 'create' ? (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">Name *</Label>
                    <Input id="name" value={newGroupName} onChange={(e) => setNewGroupName(e.target.value)} placeholder={`Enter ${groupType} name`} className="mt-1.5 h-12 rounded-xl" />
                  </div>
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea id="description" value={newGroupDescription} onChange={(e) => setNewGroupDescription(e.target.value)} placeholder={`Describe your ${groupType}`} className="mt-1.5 rounded-xl resize-none" rows={3} />
                  </div>
                  <div>
                    <Label htmlFor="location">Location</Label>
                    <Input id="location" value={newGroupLocation} onChange={(e) => setNewGroupLocation(e.target.value)} placeholder="Enter location" className="mt-1.5 h-12 rounded-xl" />
                  </div>
                </div>
              ) : (
                <div>
                  <Label>Select {groupType === 'unit' ? 'Unit' : 'Clan'}</Label>
                  <Select value={selectedGroup} onValueChange={setSelectedGroup}>
                    <SelectTrigger className="mt-1.5 h-12 rounded-xl"><SelectValue placeholder={`Choose a ${groupType}`} /></SelectTrigger>
                    <SelectContent>
                      {(groupType === 'unit' ? units : clans).map((group) => (
                        <SelectItem key={group.id} value={group.id}>{group.name} {group.location && `(${group.location})`}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {(groupType === 'unit' ? units : clans).length === 0 && (
                    <p className="text-sm text-gray-500 mt-2">No {groupType === 'unit' ? 'units' : 'clans'} available. Go back and create one!</p>
                  )}
                </div>
              )}

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep(3)} className="flex-1 h-12 rounded-xl" disabled={isSubmitting}>Back</Button>
                <Button onClick={handleSubmit} disabled={!canSubmit || isSubmitting} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white h-12 rounded-xl">
                  {isSubmitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Setting up...</> : <><CheckCircle2 className="w-4 h-4 mr-2" />Complete Setup</>}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
