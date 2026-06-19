import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Music, Search, X, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

export default function MusicSelector({ selectedMusic, onSelect, className }) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const { data: uploadedMusic = [] } = useQuery({
    queryKey: ['music'],
    queryFn: () => base44.entities.Music.filter({ status: 'active' }, '-created_date'),
  });

  const handleRemove = () => {
    onSelect(null);
  };

  return (
    <>
      {selectedMusic ? (
        <div className={cn("flex items-center gap-2 bg-gray-100 dark:bg-gray-800 rounded-full px-3 py-2", className)}>
          <Music className="w-4 h-4 text-emerald-600" />
          <span className="text-sm flex-1 truncate">
            {selectedMusic.title} - {selectedMusic.artist}
          </span>
          <button onClick={handleRemove} className="text-gray-400 hover:text-red-500">
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className={cn("rounded-full", className)}>
              <Music className="w-4 h-4 mr-2" />
              Add Music
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add Music to Post</DialogTitle>
            </DialogHeader>
            
            <div className="mt-4">
              <Input
                placeholder="Search library..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="mb-3"
              />
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {uploadedMusic.filter(song =>
                  (song.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                  (song.artist || '').toLowerCase().includes(searchQuery.toLowerCase())
                ).map((song) => (
                  <button
                    key={song.id}
                    onClick={() => {
                      onSelect({
                        title: song.title,
                        artist: song.artist,
                        url: song.audio_url,
                        source: 'library'
                      });
                      setOpen(false);
                    }}
                    className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors text-left"
                  >
                    {song.cover_image ? (
                      <img src={song.cover_image} alt="" className="w-12 h-12 rounded object-cover" />
                    ) : (
                      <div className="w-12 h-12 bg-emerald-100 rounded flex items-center justify-center">
                        <Music className="w-6 h-6 text-emerald-600" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{song.title}</p>
                      <p className="text-sm text-gray-500 truncate">{song.artist}</p>
                    </div>
                    <Play className="w-5 h-5 text-emerald-600" />
                  </button>
                ))}
                {uploadedMusic.length === 0 && (
                  <div className="text-center py-12">
                    <Music className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 text-sm">No music in library</p>
                    <p className="text-xs text-gray-400 mt-1">Admin can upload songs in Music Library</p>
                  </div>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
