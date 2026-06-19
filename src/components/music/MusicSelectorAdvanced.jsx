import React, { useState, useRef, useEffect } from 'react';
import { Music, Search, X, Play, Pause, Scissors } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { cn } from '@/lib/utils';

export default function MusicSelectorAdvanced({ selectedMusic, onSelect, className }) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [previewTrack, setPreviewTrack] = useState(null);
  const [startTime, setStartTime] = useState([0]);
  const [clipDuration] = useState(30); // Max 30 seconds
  const audioRef = useRef(null);

  const { data: uploadedMusic = [] } = useQuery({
    queryKey: ['music'],
    queryFn: () => base44.entities.Music.filter({ status: 'active' }, '-created_date'),
  });

  const handlePreview = (track) => {
    if (previewTrack?.id === track.id && isPlaying) {
      setIsPlaying(false);
      if (audioRef.current) audioRef.current.pause();
    } else {
      setPreviewTrack(track);
      setIsPlaying(true);
    }
  };

  const handleAdd = () => {
    if (previewTrack) {
      onSelect({
        title: previewTrack.title,
        artist: previewTrack.artist,
        url: previewTrack.audio_url,
        source: 'library',
        startTime: startTime[0],
        duration: clipDuration
      });
      setOpen(false);
      setPreviewTrack(null);
      setIsPlaying(false);
    }
  };

  const handleRemove = () => {
    onSelect(null);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <>
      {selectedMusic ? (
        <div className={cn("flex items-center gap-2 bg-gray-100 dark:bg-gray-800 rounded-full px-3 py-2", className)}>
          <Music className="w-4 h-4 text-emerald-600" />
          <span className="text-sm flex-1 truncate">
            {selectedMusic.title} - {selectedMusic.artist}
          </span>
          <span className="text-xs text-gray-500">
            {formatTime(selectedMusic.startTime || 0)} - {formatTime((selectedMusic.startTime || 0) + (selectedMusic.duration || 30))}
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
          <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add Music to Post</DialogTitle>
            </DialogHeader>
            
            <div className="mt-4 space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input 
                  placeholder="Search songs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              <div className="space-y-2 max-h-48 overflow-y-auto">
                {uploadedMusic.filter(track =>
                  (track.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                  (track.artist || '').toLowerCase().includes(searchQuery.toLowerCase())
                ).map(track => (
                  <div 
                    key={track.id}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all",
                      previewTrack?.id === track.id 
                        ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20"
                        : "hover:bg-gray-50 dark:hover:bg-gray-800"
                    )}
                    onClick={() => handlePreview(track)}
                  >
                    <button className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                      {previewTrack?.id === track.id && isPlaying ? (
                        <Pause className="w-5 h-5 text-emerald-600" />
                      ) : (
                        <Play className="w-5 h-5 text-emerald-600 ml-0.5" />
                      )}
                    </button>
                    {track.cover_image ? (
                      <img src={track.cover_image} alt="" className="w-10 h-10 rounded object-cover" />
                    ) : (
                      <div className="w-10 h-10 bg-emerald-100 rounded flex items-center justify-center">
                        <Music className="w-5 h-5 text-emerald-600" />
                      </div>
                    )}
                    <div className="flex-1">
                      <p className="font-medium text-sm">{track.title}</p>
                      <p className="text-xs text-gray-500">{track.artist}</p>
                    </div>
                    <span className="text-xs text-gray-400">{formatTime(track.duration_seconds || 180)}</span>
                  </div>
                ))}
                {uploadedMusic.length === 0 && (
                  <div className="text-center py-12">
                    <Music className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 text-sm">No music in library</p>
                    <p className="text-xs text-gray-400 mt-1">Admin can upload songs in Music Library</p>
                  </div>
                )}
              </div>

              {/* Clip Selection */}
              {previewTrack && (
                <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 space-y-4">
                  <div className="flex items-center gap-2">
                    <Scissors className="w-4 h-4 text-emerald-600" />
                    <span className="text-sm font-medium">Select 30 second clip</span>
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-xs text-gray-500 mb-2">
                      <span>Start: {formatTime(startTime[0])}</span>
                      <span>End: {formatTime(Math.min(startTime[0] + clipDuration, previewTrack.duration_seconds || 180))}</span>
                    </div>
                    <Slider
                      value={startTime}
                      onValueChange={setStartTime}
                      min={0}
                      max={Math.max(0, (previewTrack.duration_seconds || 180) - clipDuration)}
                      step={1}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-gray-400 mt-1">
                      <span>0:00</span>
                      <span>{formatTime(previewTrack.duration_seconds || 180)}</span>
                    </div>
                  </div>

                  <p className="text-xs text-gray-500 text-center">
                    Preview will play from {formatTime(startTime[0])} to {formatTime(startTime[0] + clipDuration)}
                  </p>
                </div>
              )}
            </div>

            <Button
              onClick={handleAdd}
              className="w-full bg-emerald-600 hover:bg-emerald-700 mt-4"
              disabled={!previewTrack}
            >
              Add Music ({clipDuration}s clip)
            </Button>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
