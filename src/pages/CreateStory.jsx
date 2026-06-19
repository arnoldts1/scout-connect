import React, { useState, useRef, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Type, Music, Sparkles, X, Loader2, Search, Play
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { createPageUrl } from '@/utils';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';

const FILTERS = [
  { name: 'Normal', class: '' },
  { name: 'Vivid', class: 'saturate-150 contrast-110' },
  { name: 'Warm', class: 'sepia-[0.3] saturate-125' },
  { name: 'Cool', class: 'hue-rotate-[20deg] saturate-110' },
  { name: 'B&W', class: 'grayscale' },
  { name: 'Vintage', class: 'sepia-[0.5] contrast-90' },
];

const TEXT_COLORS = ['#ffffff', '#000000', '#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff'];

export default function CreateStory() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [user, setUser] = useState(null);
  
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaPreview, setMediaPreview] = useState(null);
  const [mediaType, setMediaType] = useState('image');
  
  const [selectedFilter, setSelectedFilter] = useState('Normal');
  const [textOverlay, setTextOverlay] = useState('');
  const [textPosition, setTextPosition] = useState('center');
  const [textColor, setTextColor] = useState('#ffffff');
  
  const [showMusicDialog, setShowMusicDialog] = useState(false);
  const [musicSearch, setMusicSearch] = useState('');
  const [selectedMusic, setSelectedMusic] = useState(null);

  const { data: musicLibrary = [] } = useQuery({
    queryKey: ['music-library'],
    queryFn: () => base44.entities.Music.filter({ status: 'active' }, '-created_date'),
  });
  
  const [isUploading, setIsUploading] = useState(false);
  const [showTextEditor, setShowTextEditor] = useState(false);

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
    const file = e.target.files?.[0];
    if (!file) return;

    const isVideo = file.type.startsWith('video/');
    setMediaType(isVideo ? 'video' : 'image');
    setMediaFile(file);
    setMediaPreview(URL.createObjectURL(file));
  };

  const handleMusicSelect = (track) => {
    setSelectedMusic(track);
    setShowMusicDialog(false);
  };

  const handleSubmit = async () => {
    if (!mediaFile || !user) return;

    setIsUploading(true);

    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file: mediaFile });
      
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);
      
      await base44.entities.Story.create({
        author_id: user.id,
        author_name: user.full_name,
        author_avatar: user.avatar,
        media_url: file_url,
        media_type: mediaType,
        expires_at: expiresAt.toISOString(),
        viewers: [],
        is_highlight: false,
        text_overlay: textOverlay,
        text_position: textPosition,
        text_color: textColor,
        filter: selectedFilter,
        music_title: selectedMusic?.title || '',
        music_artist: selectedMusic?.artist || '',
        music_url: selectedMusic?.url || '',
        music_source: selectedMusic ? 'library' : 'none'
      });

      toast.success('Story created!');
      navigate(createPageUrl('Home'));
    } catch (error) {
      console.error('Error creating story:', error);
      toast.error('Failed to create story. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const getFilterClass = () => {
    const filter = FILTERS.find(f => f.name === selectedFilter);
    return filter?.class || '';
  };

  if (!mediaPreview) {
    return (
      <div className="h-screen bg-black flex flex-col overflow-hidden">
        <div className="p-4 flex items-center justify-between flex-shrink-0">
          <Button variant="ghost" size="icon" className="text-white" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-white font-semibold">Add Story</h1>
          <div className="w-10" />
        </div>
        
        <div className="flex-1 flex items-center justify-center p-6 min-h-0">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            onChange={handleFileSelect}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full h-full max-w-sm rounded-3xl border-2 border-dashed border-gray-600 flex flex-col items-center justify-center"
          >
            <div className="w-16 h-16 rounded-full bg-emerald-600 flex items-center justify-center mb-4">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <p className="text-white font-medium mb-2">Add to Story</p>
            <p className="text-gray-400 text-sm">Tap to select a photo or video</p>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-black flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 z-20 p-4 flex items-center justify-between bg-black">
        <Button 
          variant="ghost" 
          size="icon" 
          className="text-white bg-black/30 rounded-full"
          onClick={() => {
            setMediaFile(null);
            setMediaPreview(null);
          }}
        >
          <X className="w-5 h-5" />
        </Button>
        
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="text-white bg-black/30 rounded-full"
            onClick={() => setShowTextEditor(!showTextEditor)}
          >
            <Type className="w-5 h-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-white bg-black/30 rounded-full"
            onClick={() => setShowMusicDialog(true)}
          >
            <Music className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Preview - fills remaining space */}
      <div className="flex-1 relative overflow-hidden min-h-0">
        {mediaType === 'video' ? (
          <video
            src={mediaPreview}
            className={cn("w-full h-full object-contain bg-black", getFilterClass())}
            autoPlay
            loop
            muted
            playsInline
          />
        ) : (
          <img
            src={mediaPreview}
            alt="Story preview"
            className={cn("w-full h-full object-contain bg-black", getFilterClass())}
          />
        )}

        {/* Text Overlay */}
        {textOverlay && (
          <div className={cn(
            "absolute left-4 right-4 text-center pointer-events-none",
            textPosition === 'top' && "top-4",
            textPosition === 'center' && "top-1/2 -translate-y-1/2",
            textPosition === 'bottom' && "bottom-4"
          )}>
            <p
              className="text-2xl font-bold drop-shadow-lg px-4 py-2"
              style={{ color: textColor }}
            >
              {textOverlay}
            </p>
          </div>
        )}

        {/* Music Badge */}
        {selectedMusic && (
          <div className="absolute bottom-2 left-4 bg-black/50 rounded-full px-3 py-1.5 flex items-center gap-2">
            <Music className="w-4 h-4 text-white" />
            <span className="text-white text-sm">{selectedMusic.title} - {selectedMusic.artist}</span>
          </div>
        )}

        {/* Text Editor overlay */}
        {showTextEditor && (
          <div className="absolute top-2 left-4 right-4 bg-black/80 rounded-xl p-3 z-30">
            <Textarea
              placeholder="Add text..."
              value={textOverlay}
              onChange={(e) => setTextOverlay(e.target.value)}
              className="bg-transparent border-0 text-white placeholder:text-gray-400 resize-none mb-2 h-16"
            />
            <div className="flex items-center justify-between">
              <div className="flex gap-1.5">
                {TEXT_COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => setTextColor(color)}
                    className={cn(
                      "w-5 h-5 rounded-full border-2",
                      textColor === color ? "border-white" : "border-transparent"
                    )}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
              <div className="flex gap-1.5">
                {['top', 'center', 'bottom'].map((pos) => (
                  <button
                    key={pos}
                    onClick={() => setTextPosition(pos)}
                    className={cn(
                      "px-2 py-0.5 text-xs rounded",
                      textPosition === pos ? "bg-white text-black" : "bg-gray-700 text-white"
                    )}
                  >
                    {pos}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Filters - fixed at bottom */}
      <div className="flex-shrink-0 bg-black px-4 pt-2">
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {FILTERS.map((filter) => (
            <button
              key={filter.name}
              onClick={() => setSelectedFilter(filter.name)}
              className={cn(
                "flex-shrink-0 text-center",
                selectedFilter === filter.name && "ring-2 ring-white rounded-lg"
              )}
            >
              <div className={cn("w-12 h-12 rounded-lg overflow-hidden mb-1", filter.class)}>
                <img src={mediaPreview} alt={filter.name} className="w-full h-full object-cover" />
              </div>
              <span className="text-xs text-white">{filter.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Share Button */}
      <div className="flex-shrink-0 px-4 pb-4 pt-2 bg-black">
        <Button
          onClick={handleSubmit}
          disabled={isUploading}
          className="w-full bg-emerald-600 hover:bg-emerald-700 rounded-full h-12"
        >
          {isUploading ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Sharing...
            </>
          ) : (
            'Share to Story'
          )}
        </Button>
      </div>

      {/* Music Dialog */}
      <Dialog open={showMusicDialog} onOpenChange={setShowMusicDialog}>
        <DialogContent className="bg-gray-900 border-gray-700 text-white max-w-md">
          <DialogHeader>
            <DialogTitle>Add Music</DialogTitle>
          </DialogHeader>

          <div className="mt-2">
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search songs..."
                value={musicSearch}
                onChange={(e) => setMusicSearch(e.target.value)}
                className="pl-10 bg-gray-800 border-gray-700 text-white"
              />
            </div>

            <div className="space-y-2 max-h-80 overflow-y-auto">
              {musicLibrary.filter(song =>
                song.title?.toLowerCase().includes(musicSearch.toLowerCase()) ||
                song.artist?.toLowerCase().includes(musicSearch.toLowerCase())
              ).map((song) => (
                <button
                  key={song.id}
                  onClick={() => {
                    setSelectedMusic({ title: song.title, artist: song.artist, url: song.audio_url });
                    setShowMusicDialog(false);
                  }}
                  className="w-full flex items-center gap-3 p-3 hover:bg-gray-800 rounded-lg transition-colors text-left"
                >
                  {song.cover_image ? (
                    <img src={song.cover_image} alt="" className="w-12 h-12 rounded object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-12 h-12 bg-emerald-900 rounded flex items-center justify-center flex-shrink-0">
                      <Music className="w-6 h-6 text-emerald-400" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{song.title}</p>
                    <p className="text-sm text-gray-400 truncate">{song.artist}</p>
                  </div>
                  <Play className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                </button>
              ))}
              {musicLibrary.length === 0 && (
                <div className="text-center py-12">
                  <Music className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-400 text-sm">No music in library</p>
                  <p className="text-xs text-gray-500 mt-1">Admin can upload songs in Music Library</p>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
