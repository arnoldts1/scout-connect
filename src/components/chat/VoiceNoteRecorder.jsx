import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Play, Pause, Download, Send, Trash2, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { toast } from 'sonner';

export default function VoiceNoteRecorder({ onSend, onClose }) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordedAudio, setRecordedAudio] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [waveform, setWaveform] = useState([]);

  const mediaRecorderRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const audioRef = useRef(null);
  const chunksRef = useRef([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Setup audio analysis for waveform
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      analyserRef.current = audioContextRef.current.createAnalyser();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);

      mediaRecorderRef.current = new MediaRecorder(stream);
      chunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (e) => {
        chunksRef.current.push(e.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setRecordedAudio(blob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      setIsPaused(false);

      // Animate waveform
      animateWaveform();
    } catch (error) {
      console.error('Error accessing microphone:', error);
      toast.error('Could not access microphone');
    }
  };

  const animateWaveform = () => {
    if (!analyserRef.current || !isRecording) return;

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);

    const newWaveform = Array.from(dataArray)
      .slice(0, 30)
      .map(v => (v / 255) * 100);

    setWaveform(newWaveform);
    requestAnimationFrame(animateWaveform);
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsPaused(false);
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
    }
  };

  const resumeRecording = () => {
    if (mediaRecorderRef.current && isPaused) {
      mediaRecorderRef.current.resume();
      setIsPaused(false);
    }
  };

  const playAudio = () => {
    if (!recordedAudio || !audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const deleteRecording = () => {
    setRecordedAudio(null);
    setCurrentTime(0);
    setDuration(0);
    setIsPlaying(false);
    setWaveform([]);
  };

  const handleSend = async () => {
    if (!recordedAudio) return;

    // Convert blob to file
    const file = new File(
      [recordedAudio],
      `voice-note-${Date.now()}.webm`,
      { type: 'audio/webm' }
    );

    onSend(file);
    deleteRecording();
    onClose();
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-800">
      {!recordedAudio ? (
        // Recording mode
        <div className="space-y-4">
          <div className="flex items-center justify-center gap-2">
            {isRecording && (
              <div className="flex gap-1">
                {waveform.map((value, i) => (
                  <div
                    key={i}
                    className="w-1 bg-emerald-500 rounded-full transition-all"
                    style={{ height: `${Math.max(value, 10)}px` }}
                  />
                ))}
              </div>
            )}
            {isRecording && (
              <span className="text-xs font-medium text-emerald-500 animate-pulse">
                Recording...
              </span>
            )}
          </div>

          <div className="flex items-center justify-center gap-2">
            {!isRecording ? (
              <Button
                onClick={startRecording}
                className="rounded-full bg-emerald-500 hover:bg-emerald-600 text-white gap-2"
              >
                <Mic className="w-4 h-4" />
                Start Recording
              </Button>
            ) : (
              <>
                {isPaused ? (
                  <Button
                    onClick={resumeRecording}
                    className="rounded-full bg-blue-500 hover:bg-blue-600 text-white gap-2"
                  >
                    <Play className="w-4 h-4" />
                    Resume
                  </Button>
                ) : (
                  <Button
                    onClick={pauseRecording}
                    className="rounded-full bg-yellow-500 hover:bg-yellow-600 text-white gap-2"
                  >
                    <Pause className="w-4 h-4" />
                    Pause
                  </Button>
                )}

                <Button
                  onClick={stopRecording}
                  className="rounded-full bg-red-500 hover:bg-red-600 text-white gap-2"
                >
                  <Square className="w-4 h-4" />
                  Stop
                </Button>
              </>
            )}
          </div>
        </div>
      ) : (
        // Playback mode
        <div className="space-y-4">
          <audio
            ref={audioRef}
            src={URL.createObjectURL(recordedAudio)}
            onLoadedMetadata={(e) => setDuration(e.target.duration)}
            onTimeUpdate={(e) => setCurrentTime(e.target.currentTime)}
            onEnded={() => setIsPlaying(false)}
            playbackRate={playbackSpeed}
          />

          {/* Waveform placeholder */}
          <div className="h-8 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
            <div className="flex items-center gap-1">
              {Array.from({ length: 20 }).map((_, i) => (
                <div
                  key={i}
                  className="w-0.5 bg-emerald-400 rounded-full"
                  style={{
                    height: `${Math.sin(i * 0.5) * 10 + 15}px`,
                    opacity: currentTime / duration > i / 20 ? 1 : 0.3
                  }}
                />
              ))}
            </div>
          </div>

          {/* Playback controls */}
          <div className="flex items-center gap-2">
            <Button
              onClick={playAudio}
              size="icon"
              className="rounded-full w-8 h-8 bg-emerald-500 hover:bg-emerald-600 text-white"
            >
              {isPlaying ? (
                <Pause className="w-3 h-3" />
              ) : (
                <Play className="w-3 h-3" />
              )}
            </Button>

            <div className="flex-1">
              <Slider
                value={[currentTime]}
                onValueChange={([value]) => {
                  if (audioRef.current) {
                    audioRef.current.currentTime = value;
                  }
                }}
                max={duration}
                step={0.1}
                className="w-full"
              />
            </div>

            <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
              {Math.floor(currentTime)}s / {Math.floor(duration)}s
            </span>
          </div>

          {/* Playback speed */}
          <div className="flex items-center gap-2">
            <Volume2 className="w-4 h-4 text-gray-500" />
            <select
              value={playbackSpeed}
              onChange={(e) => setPlaybackSpeed(parseFloat(e.target.value))}
              className="text-xs bg-gray-100 dark:bg-gray-800 rounded px-2 py-1 border-0"
            >
              <option value={0.75}>0.75x</option>
              <option value={1}>1x</option>
              <option value={1.5}>1.5x</option>
              <option value={2}>2x</option>
            </select>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2 pt-2">
            <Button
              onClick={deleteRecording}
              variant="outline"
              className="flex-1 rounded-lg gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </Button>

            <Button
              onClick={handleSend}
              className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg gap-2"
            >
              <Send className="w-4 h-4" />
              Send
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
