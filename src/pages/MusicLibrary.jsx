import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Music, Upload, Loader2, Play, Pause, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { uploadFile } from '@/api/supabaseStorage';

const GENRES = [
  { value: 'pop', label: 'Pop' },
  { value: 'rock', label: 'Rock' },
  { value: 'hip_hop', label: 'Hip Hop' },
  { value: 'traditional', label: 'Traditional' },
  { value: 'gospel', label: 'Gospel' },
  { value: 'afrobeat', label: 'Afrobeat' },
  { value: 'rnb', label: 'R&B' },
  { value: 'reggae', label: 'Reggae' },
  { value: 'other', label: 'Other' }
];

export default function MusicLibrary() {
  const [user, setUser] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [playingId, setPlayingId] = useState(null);
  const audioRef = useRef(null);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (authUser) {
        const { data } = await supabase.from('users').select('*').eq('id', authUser.id).single();
        setUser(data || authUser);
      }
    };
    fetchUser();
  }, []);

  const queryClient = useQueryClient();

  const { data: songs = [] } = useQuery({
    queryKey: ['music'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('music')
        .select('*')
        .eq('status', 'active')
        .order('id', { ascending: false });

      if (error) {
        console.error('Query error:', error);
        return [];
      }

      return data || [];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => supabase.from('music').delete().eq('id', id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['music'] });
      toast.success('Song deleted');
    },
  });

  const togglePlay = (song) => {
    if (playingId === song.id) {
      audioRef.current?.pause();
      setPlayingId(null);
    } else {
      if (audioRef.current) {
        audioRef.current.src = song.audio_url;
        audioRef.current.play();
        setPlayingId(song.id);
      }
    }
  };


  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Music className="w-7 h-7 text-emerald-600" />
              Music Library
            </h1>
            <p className="text-gray-500 text-sm mt-1">Manage background music for posts and stories</p>
          </div>
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button className="bg-emerald-600 hover:bg-emerald-700">
                <Upload className="w-4 h-4 mr-2" /> Upload Music
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Upload New Song</DialogTitle>
              </DialogHeader>
              <UploadForm onClose={() => setIsOpen(false)} user={user} />
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {songs.map((song) => (
            <div key={song.id} className="bg-white dark:bg-gray-900 rounded-xl border p-4">
              <div className="aspect-square bg-gray-100 dark:bg-gray-800 rounded-lg mb-3 relative overflow-hidden">
                {song.cover_image ? (
                  <img src={song.cover_image} alt={song.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Music className="w-16 h-16 text-gray-400" />
                  </div>
                )}
                <button
                  onClick={() => togglePlay(song)}
                  className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"
                >
                  {playingId === song.id ? (
                    <Pause className="w-12 h-12 text-white" />
                  ) : (
                    <Play className="w-12 h-12 text-white" />
                  )}
                </button>
              </div>

              <h3 className="font-semibold text-gray-900 dark:text-white truncate">{song.title}</h3>
              <p className="text-sm text-gray-500 truncate">{song.artist}</p>
              <div className="flex items-center justify-between mt-3">
                <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded">
                  {song.genre}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    if (confirm('Delete this song?')) {
                      deleteMutation.mutate(song.id);
                    }
                  }}
                  className="text-red-500 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        {songs.length === 0 && (
          <div className="text-center py-12">
            <Music className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No music uploaded yet</p>
          </div>
        )}
      </div>

      <audio ref={audioRef} onEnded={() => setPlayingId(null)} />
    </div>
  );
}

function UploadForm({ onClose, user }) {
  const queryClient = useQueryClient();
  const audioInputRef = useRef(null);
  const coverInputRef = useRef(null);
  const [isUploading, setIsUploading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    artist: '',
    genre: 'pop',
    audio_url: '',
    cover_image: '',
    file_size_mb: 0
  });

  const handleAudioUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const sizeMB = file.size / (1024 * 1024);
    if (sizeMB > 1.5) {
      toast.error('File too large. Maximum 1.5MB');
      return;
    }

    setIsUploading(true);
    try {
      const { file_url } = await uploadFile(file, 'music');

      // Auto-fill title from filename if empty
      if (!formData.title) {
        const filename = file.name.replace(/\.[^/.]+$/, ''); // Remove extension
        setFormData(prev => ({
          ...prev,
          audio_url: file_url,
          file_size_mb: sizeMB,
          title: filename
        }));
      } else {
        setFormData(prev => ({ ...prev, audio_url: file_url, file_size_mb: sizeMB }));
      }

      toast.success('Audio uploaded');
    } catch (error) {
      toast.error('Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const handleCoverUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const { file_url } = await uploadFile(file, 'music');
      setFormData(prev => ({ ...prev, cover_image: file_url }));
      toast.success('Cover uploaded');
    } catch (error) {
      toast.error('Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('Form submitted with data:', formData);

    if (!formData.title || !formData.artist || !formData.audio_url) {
      toast.error('Please fill required fields and upload audio');
      return;
    }

    setIsUploading(true);
    try {
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
      console.log('Auth user:', authUser, 'Auth error:', authError);

      if (!authUser) {
        toast.error('You must be logged in to add music');
        setIsUploading(false);
        return;
      }

      const musicData = {
        title: formData.title,
        artist: formData.artist,
        audio_url: formData.audio_url,
        cover_image: formData.cover_image || null,
        genre: formData.genre,
        status: 'active',
        created_by_id: authUser.id
      };

      console.log('Inserting music data:', musicData);
      const { data, error } = await supabase.from('music').insert([musicData]).select();

      console.log('Insert response - data:', data, 'error:', error);

      if (error) {
        console.error('Insert error details:', error);
        toast.error(`Failed to add song: ${error.message}`);
        setIsUploading(false);
        return;
      }

      console.log('Music inserted successfully');
      toast.success('Song added to library');
      queryClient.invalidateQueries({ queryKey: ['music'] });
      setFormData({ title: '', artist: '', genre: 'pop', audio_url: '', cover_image: '', file_size_mb: 0 });
      onClose();
    } catch (error) {
      console.error('Exception:', error);
      toast.error(`Error: ${error.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Audio Upload */}
      <div>
        <Label>Audio File * (Max 1.5MB)</Label>
        <div className="mt-2">
          {formData.audio_url ? (
            <div className="flex items-center gap-2 p-3 bg-emerald-50 rounded-lg">
              <Music className="w-5 h-5 text-emerald-600" />
              <span className="text-sm flex-1">Audio uploaded ({formData.file_size_mb.toFixed(2)}MB)</span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setFormData({ ...formData, audio_url: '' })}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => audioInputRef.current?.click()}
              disabled={isUploading}
              className="w-full border-2 border-dashed rounded-lg p-6 hover:border-emerald-500 transition-colors"
            >
              {isUploading ? (
                <Loader2 className="w-6 h-6 animate-spin mx-auto" />
              ) : (
                <>
                  <Upload className="w-6 h-6 mx-auto text-gray-400 mb-2" />
                  <p className="text-sm text-gray-500">Click to upload audio</p>
                </>
              )}
            </button>
          )}
          <input
            ref={audioInputRef}
            type="file"
            accept="audio/*"
            onChange={handleAudioUpload}
            className="hidden"
          />
        </div>
      </div>

      {/* Cover Image */}
      <div>
        <Label>Cover Image (Optional)</Label>
        <div className="mt-2">
          {formData.cover_image ? (
            <div className="relative aspect-square rounded-lg overflow-hidden">
              <img src={formData.cover_image} alt="" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => setFormData({ ...formData, cover_image: '' })}
                className="absolute top-2 right-2 w-6 h-6 bg-black/50 rounded-full flex items-center justify-center"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => coverInputRef.current?.click()}
              disabled={isUploading}
              className="w-full aspect-square border-2 border-dashed rounded-lg flex flex-col items-center justify-center hover:border-emerald-500 transition-colors"
            >
              <Upload className="w-6 h-6 text-gray-400 mb-2" />
              <span className="text-sm text-gray-500">Upload cover</span>
            </button>
          )}
          <input
            ref={coverInputRef}
            type="file"
            accept="image/*"
            onChange={handleCoverUpload}
            className="hidden"
          />
        </div>
      </div>

      <div>
        <Label>Song Title *</Label>
        <Input
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="Enter song title"
        />
      </div>

      <div>
        <Label>Artist *</Label>
        <Input
          value={formData.artist}
          onChange={(e) => setFormData({ ...formData, artist: e.target.value })}
          placeholder="Artist name"
        />
      </div>

      <div>
        <Label>Genre</Label>
        <Select value={formData.genre} onValueChange={(v) => setFormData({ ...formData, genre: v })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {GENRES.map(g => (
              <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700" disabled={isUploading}>
        {isUploading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
        Add to Library
      </Button>
    </form>
  );
}
