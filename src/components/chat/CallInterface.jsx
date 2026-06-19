import React, { useState, useEffect, useRef } from 'react';
import { PhoneOff, Mic, MicOff, Video, VideoOff, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

export default function CallInterface({
  callType,
  participantName,
  participantAvatar,
  onEndCall,
  isIncoming = false,
  onAccept,
  onReject,
  localStream,
  callStatus
}) {
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [isVideoOn, setIsVideoOn] = useState(callType === 'video');
  const [callDuration, setCallDuration] = useState(0);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  useEffect(() => {
    if (callStatus === 'connected') {
      // Start call duration timer once connected
      const timer = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [callStatus]);

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Set local stream to video element
  useEffect(() => {
    if (localStream && localVideoRef.current && callType === 'video') {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream, callType]);

  // Handle mute toggle
  useEffect(() => {
    if (localStream) {
      localStream.getAudioTracks().forEach(track => {
        track.enabled = !isMuted;
      });
    }
  }, [isMuted, localStream]);

  // Handle video toggle
  useEffect(() => {
    if (localStream) {
      localStream.getVideoTracks().forEach(track => {
        track.enabled = isVideoOn;
      });
    }
  }, [isVideoOn, localStream]);

  // Incoming call screen
  if (isIncoming && callStatus !== 'connected') {
    return (
      <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
        <div className="text-center space-y-6">
          <Avatar className="w-24 h-24 mx-auto">
            <AvatarImage src={participantAvatar} />
            <AvatarFallback className="text-4xl">{participantName?.charAt(0)}</AvatarFallback>
          </Avatar>

          <div>
            <h2 className="text-2xl font-bold text-white">{participantName}</h2>
            <p className="text-gray-300 mt-2">
              Incoming {callType === 'video' ? 'video' : 'audio'} call...
            </p>
          </div>

          <div className="flex gap-4 justify-center">
            <Button
              onClick={onReject}
              className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center"
            >
              <PhoneOff className="w-6 h-6" />
            </Button>
            <Button
              onClick={onAccept}
              className="w-16 h-16 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white flex items-center justify-center"
            >
              {callType === 'video' ? (
                <Video className="w-6 h-6" />
              ) : (
                <Mic className="w-6 h-6" />
              )}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Calling/connecting/accepting screen
  if ((callStatus === 'ringing' && !isIncoming) || callStatus === 'connecting' || (callStatus === 'connecting' && isIncoming)) {
    const isAccepting = isIncoming && callStatus === 'connecting';
    return (
      <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
        <div className="text-center space-y-6">
          <Avatar className="w-24 h-24 mx-auto">
            <AvatarImage src={participantAvatar} />
            <AvatarFallback className="text-4xl">{participantName?.charAt(0)}</AvatarFallback>
          </Avatar>

          <div>
            <h2 className="text-2xl font-bold text-white">{participantName}</h2>
            <p className="text-gray-300 mt-2">
              {isAccepting ? 'Accepting call...' : 'Calling...'}
            </p>
            <div className="flex gap-1 justify-center mt-4">
              {[0, 1, 2].map(i => (
                <div
                  key={i}
                  className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"
                  style={{ animationDelay: `${i * 0.2}s` }}
                />
              ))}
            </div>
          </div>

          <Button
            onClick={onEndCall}
            className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center mx-auto"
          >
            <PhoneOff className="w-6 h-6" />
          </Button>
        </div>
      </div>
    );
  }

  // Active call screen
  if (callStatus === 'connected') {
    return (
      <div className="fixed inset-0 z-50 bg-black flex flex-col">
        {/* Main Call Area */}
        <div className="flex-1 flex items-center justify-center relative overflow-hidden">
          {callType === 'video' ? (
            <>
              {/* Remote Video */}
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />

              {/* Local Video (Picture in Picture) */}
              {localStream && (
                <div className="absolute bottom-6 right-6 w-32 h-40 bg-black border-2 border-white rounded-lg overflow-hidden">
                  <video
                    ref={localVideoRef}
                    autoPlay
                    muted
                    playsInline
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
            </>
          ) : (
            /* Audio Call - Show avatar and duration */
            <div className="text-center space-y-6">
              <Avatar className="w-32 h-32 mx-auto">
                <AvatarImage src={participantAvatar} />
                <AvatarFallback className="text-6xl">{participantName?.charAt(0)}</AvatarFallback>
              </Avatar>

              <div>
                <h2 className="text-3xl font-bold text-white">{participantName}</h2>
                <p className="text-xl text-gray-400 mt-2">{formatDuration(callDuration)}</p>
              </div>
            </div>
          )}

          {/* Call Duration Overlay */}
          <div className="absolute top-6 left-1/2 transform -translate-x-1/2 bg-black/60 px-4 py-2 rounded-full">
            <p className="text-white font-medium">{formatDuration(callDuration)}</p>
          </div>
        </div>

        {/* Controls Bar */}
        <div className="bg-black/80 backdrop-blur border-t border-gray-700 px-6 py-4 flex items-center justify-center gap-4">
          {/* Mute Button */}
          <Button
            onClick={() => setIsMuted(!isMuted)}
            className={cn(
              'w-12 h-12 rounded-full flex items-center justify-center transition',
              isMuted
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-gray-700 hover:bg-gray-600 text-white'
            )}
          >
            {isMuted ? (
              <MicOff className="w-5 h-5" />
            ) : (
              <Mic className="w-5 h-5" />
            )}
          </Button>

          {/* Speaker Button (Audio only) */}
          {callType === 'audio' && (
            <Button
              onClick={() => setIsSpeakerOn(!isSpeakerOn)}
              className={cn(
                'w-12 h-12 rounded-full flex items-center justify-center transition',
                isSpeakerOn
                  ? 'bg-gray-700 hover:bg-gray-600'
                  : 'bg-red-600 hover:bg-red-700',
                'text-white'
              )}
            >
              {isSpeakerOn ? (
                <Volume2 className="w-5 h-5" />
              ) : (
                <VolumeX className="w-5 h-5" />
              )}
            </Button>
          )}

          {/* Video Toggle (Video calls only) */}
          {callType === 'video' && (
            <Button
              onClick={() => setIsVideoOn(!isVideoOn)}
              className={cn(
                'w-12 h-12 rounded-full flex items-center justify-center transition',
                isVideoOn
                  ? 'bg-gray-700 hover:bg-gray-600'
                  : 'bg-red-600 hover:bg-red-700',
                'text-white'
              )}
            >
              {isVideoOn ? (
                <Video className="w-5 h-5" />
              ) : (
                <VideoOff className="w-5 h-5" />
              )}
            </Button>
          )}

          {/* End Call Button */}
          <Button
            onClick={onEndCall}
            className="w-12 h-12 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center transition"
          >
            <PhoneOff className="w-5 h-5" />
          </Button>
        </div>
      </div>
    );
  }

  return null;
}
