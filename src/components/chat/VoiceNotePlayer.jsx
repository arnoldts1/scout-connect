import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';

export default function VoiceNotePlayer({ audioUrl, isOwn }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);

  const audioRef = useRef(null);

  const togglePlay = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = audioUrl;
    a.download = `voice-note-${Date.now()}.webm`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);
    const handleEnded = () => setIsPlaying(false);

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', handleEnded);
    };
  }, []);

  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-2xl ${
      isOwn 
        ? 'bg-emerald-500 text-white' 
        : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white'
    }`}>
      <audio
        ref={audioRef}
        src={audioUrl}
        playbackRate={playbackSpeed}
      />

      {/* Play button */}
      <Button
        size="icon"
        variant="ghost"
        className="w-8 h-8 rounded-full flex-shrink-0"
        onClick={togglePlay}
      >
        {isPlaying ? (
          <Pause className="w-4 h-4" />
        ) : (
          <Play className="w-4 h-4" />
        )}
      </Button>

      {/* Waveform/progress */}
      <div className="flex-1 min-w-0">
        <Slider
          value={[currentTime]}
          onValueChange={([value]) => {
            if (audioRef.current) {
              audioRef.current.currentTime = value;
            }
          }}
          max={duration || 100}
          step={0.1}
          className="w-full"
        />
        <div className="text-xs opacity-75 mt-0.5">
          {Math.floor(currentTime)}s / {Math.floor(duration)}s
        </div>
      </div>

      {/* Playback speed */}
      <select
        value={playbackSpeed}
        onChange={(e) => setPlaybackSpeed(parseFloat(e.target.value))}
        className={`text-xs rounded px-1.5 py-0.5 border-0 ${
          isOwn
            ? 'bg-emerald-600 text-white'
            : 'bg-gray-200 dark:bg-gray-700'
        }`}
      >
        <option value={0.75}>0.75x</option>
        <option value={1}>1x</option>
        <option value={1.5}>1.5x</option>
        <option value={2}>2x</option>
      </select>

      {/* Download */}
      <Button
        size="icon"
        variant="ghost"
        className="w-8 h-8 rounded-full flex-shrink-0"
        onClick={handleDownload}
      >
        <Download className="w-4 h-4" />
      </Button>
    </div>
  );
}
