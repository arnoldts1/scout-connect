import React, { useState, useRef, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { 
  Image, Video, MapPin, Hash, X, ArrowLeft, Crop, Sun, Sparkles, 
  Upload, CheckCircle, Loader2, Users, Music 
} from 'lucide-react';
import MusicSelectorAdvanced from '@/components/music/MusicSelectorAdvanced';
import MentionInput from '@/components/feed/MentionInput';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { createPageUrl } from '@/utils';
import { cn } from '@/lib/utils';

const FILTERS = [
  { name: 'Normal', class: '' },
  { name: 'Vivid', class: 'saturate-150 contrast-110' },
  { name: 'Warm', class: 'sepia-[0.3] saturate-125' },
  { name: 'Cool', class: 'hue-rotate-[20deg] saturate-110' },
  { name: 'B&W', class: 'grayscale' },
  { name: 'Vintage', class: 'sepia-[0.5] contrast-90' },
];

export default function CreatePost() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [user, setUser] = useState(null);
  
  const [step, setStep] = useState('upload'); // upload, edit, details
  const [mediaFiles, setMediaFiles] = useState([]);
  const [mediaPreviews, setMediaPreviews] = useState([]);
  const [mediaType, setMediaType] = useState('image');
  
  // Edit settings
  const [selectedFilter, setSelectedFilter] = useState('Normal');
  const [brightness, setBrightness] = useState([100]);
  const [contrast, setContrast] = useState([100]);
  
  // Crop settings
  const [cropAspectRatio, setCropAspectRatio] = useState('1:1');
  const [cropPosition, setCropPosition] = useState({ x: 50, y: 50 });
  const [cropZoom, setCropZoom] = useState([100]);
  
  // Post details
  const [caption, setCaption] = useState('');
  const [location, setLocation] = useState('');
  const [hashtags, setHashtags] = useState([]);
  const [hashtagInput, setHashtagInput] = useState('');
  const [mentionedUsers, setMentionedUsers] = useState([]);
  
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedMusic, setSelectedMusic] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (error) {
        navigate(createPageUrl('Home'));
      }
    };
    fetchUser();
  }, []);

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    const file = files[0];
    const isVideo = file.type.startsWith('video/');
    setMediaType(isVideo ? 'video' : 'image');
    setMediaFiles(files);

    // Create previews
    const previews = files.map(file => URL.createObjectURL(file));
    setMediaPreviews(previews);
    setStep('edit');
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

  const extractMentions = (text) => {
    const mentionRegex = /@([^\s]+(?:\s+[^\s@]+)*?)(?=\s|$|[@#])/g;
    const mentions = [];
    let match;
    while ((match = mentionRegex.exec(text)) !== null) {
      mentions.push(match[1].trim());
    }
    return mentions;
  };

  const handleSubmit = async () => {
    if (mediaFiles.length === 0) return;

    setIsUploading(true);
    setUploadProgress(10);

    try {
      // Upload media files
      const uploadedUrls = [];
      for (let i = 0; i < mediaFiles.length; i++) {
        console.log(`Uploading file ${i + 1}/${mediaFiles.length}: ${mediaFiles[i].name} (${(mediaFiles[i].size / 1024 / 1024).toFixed(2)}MB)`);
        try {
          const { file_url } = await base44.integrations.Core.UploadFile({
            file: mediaFiles[i]
          });
          console.log(`✅ File ${i + 1} uploaded successfully`);
          uploadedUrls.push(file_url);
          setUploadProgress(10 + ((i + 1) / mediaFiles.length) * 60);
        } catch (uploadErr) {
          console.error(`❌ Failed to upload file ${i + 1}:`, uploadErr);
          throw uploadErr;
        }
      }

      setUploadProgress(80);

      // Extract mentions from caption
      const mentionedNames = extractMentions(caption);

      // Create post
      const postData = {
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
        status: 'pending',
        visibility: 'public',
        music_title: selectedMusic?.title || '',
        music_artist: selectedMusic?.artist || '',
        music_url: selectedMusic?.url || '',
        music_source: selectedMusic?.source || 'none'
      };

      console.log('Creating post with data:', postData);
      const newPost = await base44.entities.Post.create(postData);
      console.log('Post created successfully:', newPost);

      // Create notifications + collab DM for mentioned users
      for (const mentionedUser of mentionedUsers) {
        if (mentionedUser.id !== user.id) {
          // Mention notification
          await base44.entities.Notification.create({
            user_id: mentionedUser.id,
            type: 'mention',
            message: `${user.full_name} mentioned you in a post`,
            actor_id: user.id,
            actor_name: user.full_name,
            actor_avatar: user.avatar,
            reference_id: newPost.id,
            reference_type: 'post',
            is_read: false
          });

          // Send collaboration request via DM
          const convs = await base44.entities.Conversation.list();
          const existing = convs.find(c =>
            c.type === 'direct' &&
            c.participants?.includes(user.id) &&
            c.participants?.includes(mentionedUser.id)
          );
          let convId = existing?.id;
          if (!convId) {
            const newConv = await base44.entities.Conversation.create({
              type: 'direct',
              participants: [user.id, mentionedUser.id],
              participant_details: [
                { user_id: user.id, name: user.full_name, avatar: user.avatar },
                { user_id: mentionedUser.id, name: mentionedUser.full_name, avatar: mentionedUser.avatar }
              ],
              unread_count: { [mentionedUser.id]: 1 }
            });
            convId = newConv.id;
          }
          await base44.entities.Message.create({
            conversation_id: convId,
            sender_id: user.id,
            sender_name: user.full_name,
            sender_avatar: user.avatar,
            content: `👋 Hey @${mentionedUser.full_name}, I mentioned you in my post and would love to collaborate! Check it out.`,
            media_type: 'text',
            reactions: [],
            read_by: [user.id],
            delivered_to: [user.id],
            deleted_for: [],
            is_deleted: false
          });
        }
      }

      setUploadProgress(100);
      
      // Navigate to home after short delay with success message
      setTimeout(() => {
        navigate(createPageUrl('Profile'));
        alert('Your post has been submitted and is pending admin approval.');
      }, 500);
    } catch (error) {
      console.error('Error creating post:', error);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        status: error.status,
        body: error.body
      });
      alert(`Error creating post: ${error.message || 'Unknown error'}`);
      setIsUploading(false);
    }
  };

  const getFilterClass = () => {
    const filter = FILTERS.find(f => f.name === selectedFilter);
    return filter?.class || '';
  };

  const getEditStyles = () => ({
    filter: `brightness(${brightness[0]}%) contrast(${contrast[0]}%)`
  });

  const getCropStyles = () => {
    const aspectRatios = {
      '1:1': 1,
      '4:5': 4/5,
      '16:9': 16/9,
      '9:16': 9/16,
      'original': 0
    };

    const ratio = aspectRatios[cropAspectRatio] || 1;
    
    return {
      objectPosition: `${cropPosition.x}% ${cropPosition.y}%`,
      transform: `scale(${cropZoom[0] / 100})`,
      aspectRatio: ratio || 'auto'
    };
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
              if (step === 'upload') {
                navigate(-1);
              } else if (step === 'edit') {
                setStep('upload');
              } else {
                setStep('edit');
              }
            }}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          
          <h1 className="font-semibold text-lg">
            {step === 'upload' ? 'New Post' : step === 'edit' ? 'Edit' : 'Share'}
          </h1>
          
          {step !== 'upload' && (
            <Button 
              variant="ghost"
              className="text-emerald-600 font-semibold"
              onClick={() => {
                if (step === 'edit') setStep('details');
                else handleSubmit();
              }}
              disabled={isUploading}
            >
              {step === 'edit' ? 'Next' : isUploading ? 'Sharing...' : 'Share'}
            </Button>
          )}
          {step === 'upload' && <div className="w-10" />}
        </div>
      </div>

      {/* Content */}
      {step === 'upload' && (
        <div className="flex flex-col items-center justify-center min-h-[60vh] p-8">
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
              Drag and drop or click to select
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

          <div className="flex items-center gap-4 mt-8">
            <Button 
              variant="outline" 
              className="rounded-full"
              onClick={() => {
                fileInputRef.current.accept = 'image/*';
                fileInputRef.current.click();
              }}
            >
              <Image className="w-5 h-5 mr-2" />
              Photo
            </Button>
            <Button 
              variant="outline" 
              className="rounded-full"
              onClick={() => {
                fileInputRef.current.accept = 'video/*';
                fileInputRef.current.click();
              }}
            >
              <Video className="w-5 h-5 mr-2" />
              Video
            </Button>
          </div>

          <div className="mt-8 text-center">
            <p className="text-sm text-gray-500 mb-3">Or post work activity for your unit/clan</p>
            <Button 
              variant="outline" 
              className="rounded-full border-emerald-500 text-emerald-600 hover:bg-emerald-50"
              onClick={() => navigate(createPageUrl('CreateUnitPost'))}
            >
              <Users className="w-5 h-5 mr-2" />
              Post Work Activity
            </Button>
          </div>
        </div>
      )}

      {step === 'edit' && mediaPreviews.length > 0 && (
        <div className="p-4">
          {/* Preview */}
          <div className={cn(
            "relative rounded-2xl overflow-hidden bg-black mb-6",
            cropAspectRatio === '1:1' && "aspect-square",
            cropAspectRatio === '4:5' && "aspect-[4/5]",
            cropAspectRatio === '16:9' && "aspect-video",
            cropAspectRatio === '9:16' && "aspect-[9/16]",
            cropAspectRatio === 'original' && "aspect-auto"
          )}>
            {mediaType === 'video' ? (
              <video 
                src={mediaPreviews[0]} 
                className={cn("w-full h-full object-cover", getFilterClass())}
                style={{...getEditStyles(), ...getCropStyles()}}
                controls
              />
            ) : (
              <img 
                src={mediaPreviews[0]} 
                alt="Preview"
                className={cn("w-full h-full object-cover", getFilterClass())}
                style={{...getEditStyles(), ...getCropStyles()}}
              />
            )}
          </div>

          {/* Edit Tools */}
          <Tabs defaultValue="filters" className="w-full">
            <TabsList className="w-full grid grid-cols-3">
              <TabsTrigger value="filters">
                <Sparkles className="w-4 h-4 mr-2" />
                Filters
              </TabsTrigger>
              <TabsTrigger value="adjust">
                <Sun className="w-4 h-4 mr-2" />
                Adjust
              </TabsTrigger>
              <TabsTrigger value="crop">
                <Crop className="w-4 h-4 mr-2" />
                Crop
              </TabsTrigger>
            </TabsList>

            <TabsContent value="filters" className="mt-4">
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                {FILTERS.map((filter) => (
                  <button
                    key={filter.name}
                    onClick={() => setSelectedFilter(filter.name)}
                    className={cn(
                      "flex-shrink-0 text-center",
                      selectedFilter === filter.name && "ring-2 ring-emerald-500 rounded-lg"
                    )}
                  >
                    <div className={cn(
                      "w-20 h-20 rounded-lg overflow-hidden mb-1",
                      filter.class
                    )}>
                      <img 
                        src={mediaPreviews[0]} 
                        alt={filter.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <span className="text-xs text-gray-600 dark:text-gray-400">
                      {filter.name}
                    </span>
                  </button>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="adjust" className="mt-4 space-y-6">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Brightness</span>
                  <span className="text-sm text-gray-500">{brightness[0]}%</span>
                </div>
                <Slider
                  value={brightness}
                  onValueChange={setBrightness}
                  min={50}
                  max={150}
                  step={1}
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Contrast</span>
                  <span className="text-sm text-gray-500">{contrast[0]}%</span>
                </div>
                <Slider
                  value={contrast}
                  onValueChange={setContrast}
                  min={50}
                  max={150}
                  step={1}
                />
              </div>
            </TabsContent>

            <TabsContent value="crop" className="mt-4 space-y-6">
              {/* Aspect Ratio Selection */}
              <div>
                <p className="text-sm font-medium mb-3">Aspect Ratio</p>
                <div className="flex gap-2 justify-center flex-wrap">
                  {['1:1', '4:5', '16:9', '9:16', 'original'].map((ratio) => (
                    <Button 
                      key={ratio}
                      variant={cropAspectRatio === ratio ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCropAspectRatio(ratio)}
                      className={cn(
                        cropAspectRatio === ratio && "bg-emerald-600 hover:bg-emerald-700"
                      )}
                    >
                      {ratio === 'original' ? 'Original' : ratio}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Zoom Control */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Zoom</span>
                  <span className="text-sm text-gray-500">{cropZoom[0]}%</span>
                </div>
                <Slider
                  value={cropZoom}
                  onValueChange={setCropZoom}
                  min={100}
                  max={200}
                  step={5}
                />
              </div>

              {/* Position Controls */}
              <div>
                <p className="text-sm font-medium mb-3">Position</p>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm">Horizontal</span>
                      <span className="text-sm text-gray-500">{cropPosition.x}%</span>
                    </div>
                    <Slider
                      value={[cropPosition.x]}
                      onValueChange={(val) => setCropPosition({...cropPosition, x: val[0]})}
                      min={0}
                      max={100}
                      step={1}
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm">Vertical</span>
                      <span className="text-sm text-gray-500">{cropPosition.y}%</span>
                    </div>
                    <Slider
                      value={[cropPosition.y]}
                      onValueChange={(val) => setCropPosition({...cropPosition, y: val[0]})}
                      min={0}
                      max={100}
                      step={1}
                    />
                  </div>
                </div>
              </div>

              {/* Reset Button */}
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => {
                  setCropAspectRatio('1:1');
                  setCropPosition({ x: 50, y: 50 });
                  setCropZoom([100]);
                }}
              >
                Reset Crop
              </Button>
            </TabsContent>
          </Tabs>
        </div>
      )}

      {step === 'details' && (
        <div className="p-4 space-y-6">
          {/* Preview Thumbnail */}
          <div className="flex gap-4">
            <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
              <img 
                src={mediaPreviews[0]} 
                alt="Preview"
                className={cn("w-full h-full object-cover", getFilterClass())}
              />
            </div>
            <MentionInput
              placeholder="Write a caption... (use @ to mention scouts)"
              value={caption}
              onChange={(text, mentionedUser) => {
                setCaption(text);
                if (mentionedUser && !mentionedUsers.find(u => u.id === mentionedUser.id)) {
                  setMentionedUsers(prev => [...prev, mentionedUser]);
                }
              }}
              className="flex-1 border-0 focus-visible:ring-0 text-base"
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

          {/* Music */}
          <div className="py-4 border-t border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-3">
              <Music className="w-5 h-5 text-gray-400" />
              <div className="flex-1">
                <MusicSelectorAdvanced 
                  selectedMusic={selectedMusic}
                  onSelect={setSelectedMusic}
                />
              </div>
            </div>
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
                    <button 
                      onClick={() => removeHashtag(tag)}
                      className="ml-2 hover:text-red-500"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
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
                    <p className="text-lg font-medium">Post shared!</p>
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
