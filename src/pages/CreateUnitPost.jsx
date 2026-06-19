import React, { useState, useRef, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { 
  Image, Video, MapPin, Hash, X, ArrowLeft, 
  Upload, CheckCircle, Loader2, Users
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { createPageUrl } from '@/utils';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export default function CreateUnitPost() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [user, setUser] = useState(null);
  const [userUnits, setUserUnits] = useState([]);
  const [userClans, setUserClans] = useState([]);
  
  const [step, setStep] = useState('select'); // select, upload, details
  const [postType, setPostType] = useState(''); // 'unit' or 'clan'
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [selectedGroupName, setSelectedGroupName] = useState('');
  
  const [mediaFiles, setMediaFiles] = useState([]);
  const [mediaPreviews, setMediaPreviews] = useState([]);
  const [mediaType, setMediaType] = useState('image');
  
  const [caption, setCaption] = useState('');
  const [location, setLocation] = useState('');
  const [hashtags, setHashtags] = useState([]);
  const [hashtagInput, setHashtagInput] = useState('');
  
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);

        // Fetch units and clans where user is a member or admin
        const [units, clans] = await Promise.all([
          base44.entities.Unit.filter({ status: 'active' }),
          base44.entities.Clan.filter({ status: 'active' })
        ]);

        const myUnits = units.filter(u =>
          u.admin_email === currentUser.email ||
          u.members?.includes(currentUser.id) ||
          u.id === currentUser.unit_id
        );

        const myClans = clans.filter(c =>
          c.admin_email === currentUser.email ||
          c.members?.includes(currentUser.id) ||
          c.id === currentUser.clan_id
        );

        setUserUnits(myUnits);
        setUserClans(myClans);
      } catch (error) {
        console.error('Failed to load units and clans:', error);
        // Continue gracefully - user can still navigate
      }
    };
    fetchData();
  }, []);

  const handleGroupSelect = (type, id, name) => {
    setPostType(type);
    setSelectedGroupId(id);
    setSelectedGroupName(name);
    setStep('upload');
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    const file = files[0];
    const isVideo = file.type.startsWith('video/');
    setMediaType(isVideo ? 'video' : 'image');
    setMediaFiles(files);

    const previews = files.map(file => URL.createObjectURL(file));
    setMediaPreviews(previews);
    setStep('details');
  };

  const handleAddHashtag = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      const tag = hashtagInput.trim().replace(/^#/, '');
      if (tag && !hashtags.includes(tag)) {
        setHashtags([...hashtags, tag]);
      }
      setHashtagInput('');
    }
  };

  const removeHashtag = (tagToRemove) => {
    setHashtags(hashtags.filter(tag => tag !== tagToRemove));
  };

  const handleSubmit = async () => {
    if (mediaFiles.length === 0) return;

    setIsUploading(true);
    setUploadProgress(10);

    try {
      const uploadedUrls = [];
      for (let i = 0; i < mediaFiles.length; i++) {
        const { file_url } = await base44.integrations.Core.UploadFile({
          file: mediaFiles[i]
        });
        uploadedUrls.push(file_url);
        setUploadProgress(10 + ((i + 1) / mediaFiles.length) * 60);
      }

      setUploadProgress(80);

      const postPayload = {
        author_id: user.id,
        author_name: user.full_name,
        author_avatar: user.avatar,
        content: caption,
        media_urls: uploadedUrls,
        media_type: mediaFiles.length > 1 ? 'multiple' : mediaType,
        location,
        hashtags,
        likes: [],
        likes_count: 0,
        comments_count: 0,
        shares_count: 0,
        status: 'pending',
        visibility: 'public',
        is_unit_post: true,
        unit_id: postType === 'unit' ? selectedGroupId : null,
        clan_id: postType === 'clan' ? selectedGroupId : null,
        work_category: 'none',
        points_awarded: 0
      };

      console.log('📝 Creating post with payload:', postPayload);
      console.log('Post type:', postType, '| Group ID:', selectedGroupId);

      const newPost = await base44.entities.Post.create(postPayload);

      console.log('✅ Post created successfully:', newPost);

      if (!newPost || !newPost.id) {
        throw new Error('Post created but returned no ID');
      }

      setUploadProgress(100);

      setTimeout(() => {
        toast.success('Your work post has been submitted for admin approval!');
        navigate(createPageUrl('Profile'));
      }, 500);
    } catch (error) {
      console.error('❌ Error creating post:', error);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        details: error.details
      });
      toast.error(`Failed to create post: ${error.message}`);
      setIsUploading(false);
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
            onClick={() => {
              if (step === 'select') navigate(-1);
              else if (step === 'upload') setStep('select');
              else setStep('upload');
            }}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          
          <h1 className="font-semibold text-lg">
            {step === 'select' ? 'Post Work Activity' : step === 'upload' ? 'Upload Media' : 'Share'}
          </h1>
          
          {step === 'details' && (
            <Button 
              variant="ghost"
              className="text-emerald-600 font-semibold"
              onClick={handleSubmit}
              disabled={isUploading}
            >
              {isUploading ? 'Sharing...' : 'Share'}
            </Button>
          )}
          {step !== 'details' && <div className="w-10" />}
        </div>
      </div>

      {/* Step 1: Select Unit/Clan */}
      {step === 'select' && (
        <div className="p-6 space-y-6">
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-4 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center">
              <Users className="w-8 h-8 text-emerald-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Post Work Activity
            </h2>
            <p className="text-gray-500 text-sm">
              Share your unit or clan's activities to earn points
            </p>
          </div>

          {userUnits.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">
                Your Units
              </h3>
              <div className="space-y-2">
                {userUnits.map(unit => (
                  <button
                    key={unit.id}
                    onClick={() => handleGroupSelect('unit', unit.id, unit.name)}
                    className="w-full flex items-center gap-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border-2 border-transparent hover:border-blue-500 transition-all"
                  >
                    {unit.avatar ? (
                      <img src={unit.avatar} alt="" className="w-12 h-12 rounded-full object-cover" />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">
                        {unit.name?.charAt(0)}
                      </div>
                    )}
                    <div className="text-left">
                      <p className="font-medium text-gray-900 dark:text-white">{unit.name}</p>
                      <p className="text-sm text-gray-500">{unit.member_count || 0} members</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {userClans.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">
                Your Clans
              </h3>
              <div className="space-y-2">
                {userClans.map(clan => (
                  <button
                    key={clan.id}
                    onClick={() => handleGroupSelect('clan', clan.id, clan.name)}
                    className="w-full flex items-center gap-4 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl border-2 border-transparent hover:border-purple-500 transition-all"
                  >
                    {clan.avatar ? (
                      <img src={clan.avatar} alt="" className="w-12 h-12 rounded-full object-cover" />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-purple-500 flex items-center justify-center text-white font-bold">
                        {clan.name?.charAt(0)}
                      </div>
                    )}
                    <div className="text-left">
                      <p className="font-medium text-gray-900 dark:text-white">{clan.name}</p>
                      <p className="text-sm text-gray-500">{clan.member_count || 0} members</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {userUnits.length === 0 && userClans.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500">You're not a member of any unit or clan yet.</p>
            </div>
          )}
        </div>
      )}

      {/* Step 2: Upload */}
      {step === 'upload' && (
        <div className="flex flex-col items-center justify-center min-h-[60vh] p-8">
          <Badge className={cn(
            "mb-4",
            postType === 'unit' ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700"
          )}>
            Posting for: {selectedGroupName}
          </Badge>

          <div 
            className="w-full max-w-md aspect-square rounded-3xl border-2 border-dashed border-gray-200 dark:border-gray-700 flex flex-col items-center justify-center cursor-pointer hover:border-emerald-500 transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mb-4">
              <Upload className="w-10 h-10 text-emerald-600" />
            </div>
            <p className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Upload photos or videos
            </p>
            <p className="text-sm text-gray-500">
              Document your work activities
            </p>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>
      )}

      {/* Step 3: Details */}
      {step === 'details' && (
        <div className="p-4 space-y-6">
          <Badge className={cn(
            "mb-2",
            postType === 'unit' ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700"
          )}>
            Posting for: {selectedGroupName}
          </Badge>

          {/* Preview */}
          <div className="flex gap-4">
            <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
              {mediaType === 'video' ? (
                <video src={mediaPreviews[0]} className="w-full h-full object-cover" />
              ) : (
                <img src={mediaPreviews[0]} alt="Preview" className="w-full h-full object-cover" />
              )}
            </div>
            <Textarea
              placeholder="Describe the work activity..."
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              className="flex-1 min-h-[80px] resize-none border-0 focus-visible:ring-0 text-base"
            />
          </div>

          {/* Location */}
          <div className="flex items-center gap-3 py-4 border-t border-gray-100 dark:border-gray-800">
            <MapPin className="w-5 h-5 text-gray-400" />
            <Input
              placeholder="Add location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="border-0 focus-visible:ring-0"
            />
          </div>

          {/* Hashtags */}
          <div className="py-4 border-t border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-3 mb-3">
              <Hash className="w-5 h-5 text-gray-400" />
              <Input
                placeholder="Add hashtags (press space or enter)"
                value={hashtagInput}
                onChange={(e) => setHashtagInput(e.target.value)}
                onKeyDown={handleAddHashtag}
                className="border-0 focus-visible:ring-0"
              />
            </div>
            {hashtags.length > 0 && (
              <div className="flex flex-wrap gap-2 pl-8">
                {hashtags.map((tag) => (
                  <Badge 
                    key={tag}
                    variant="secondary"
                    className="px-3 py-1 text-sm bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400"
                  >
                    #{tag}
                    <button onClick={() => removeHashtag(tag)} className="ml-2 hover:text-red-500">
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl">
            <p className="text-sm text-amber-700 dark:text-amber-400">
              <strong>Note:</strong> This post will be reviewed by your {postType} admin. 
              Once approved and categorized, points will be awarded to your {postType}.
            </p>
          </div>

          {/* Upload Progress */}
          {isUploading && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 text-center max-w-sm w-full mx-4">
                {uploadProgress < 100 ? (
                  <>
                    <Loader2 className="w-12 h-12 text-emerald-600 animate-spin mx-auto mb-4" />
                    <p className="text-lg font-medium mb-2">Sharing your post...</p>
                    <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-emerald-600 transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-12 h-12 text-emerald-600 mx-auto mb-4" />
                    <p className="text-lg font-medium">Post submitted!</p>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
