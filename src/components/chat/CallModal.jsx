import React, { useEffect, useRef, useState } from 'react';
import { Phone, PhoneOff, Video, VideoOff, Mic, MicOff, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { base44 } from '@/api/base44Client';

export default function CallModal({ conversation, user, callType, incomingCall, onEnd }) {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const localStreamRef = useRef(null);

  const [callState, setCallState] = useState(incomingCall ? 'incoming' : 'calling'); // calling | incoming | connected | ended
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const durationRef = useRef(null);

  const otherParticipant = conversation?.participant_details?.find(p => p.user_id !== user?.id);
  const displayName = conversation?.type === 'group' ? conversation?.group_name : otherParticipant?.name || 'Scout';
  const displayAvatar = conversation?.type === 'group' ? conversation?.group_avatar : otherParticipant?.avatar;

  const ICE_SERVERS = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }, { urls: 'stun:stun1.l.google.com:19302' }] };

  // Channel for signaling via Conversation metadata
  const signalingChannel = `call_signal_${conversation?.id}`;

  const cleanUp = () => {
    localStreamRef.current?.getTracks().forEach(t => t.stop());
    peerConnectionRef.current?.close();
    if (durationRef.current) clearInterval(durationRef.current);
  };

  const endCall = async () => {
    cleanUp();
    // Signal end to other party
    await base44.entities.Conversation.update(conversation.id, {
      [`call_signal`]: JSON.stringify({ type: 'end', from: user.id, ts: Date.now() })
    }).catch(() => {});
    setCallState('ended');
    setTimeout(onEnd, 1000);
  };

  const startLocalStream = async () => {
    const constraints = callType === 'video'
      ? { video: true, audio: true }
      : { audio: true };
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    localStreamRef.current = stream;
    if (localVideoRef.current) localVideoRef.current.srcObject = stream;
    return stream;
  };

  const createPeerConnection = (stream) => {
    const pc = new RTCPeerConnection(ICE_SERVERS);
    peerConnectionRef.current = pc;

    stream.getTracks().forEach(track => pc.addTrack(track, stream));

    pc.ontrack = (e) => {
      if (remoteVideoRef.current) remoteVideoRef.current.srcObject = e.streams[0];
    };

    pc.onicecandidate = async (e) => {
      if (e.candidate) {
        await base44.entities.Conversation.update(conversation.id, {
          call_signal: JSON.stringify({ type: 'ice', candidate: e.candidate, from: user.id, ts: Date.now() })
        }).catch(() => {});
      }
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'connected') {
        setCallState('connected');
        durationRef.current = setInterval(() => setCallDuration(d => d + 1), 1000);
      }
      if (['disconnected', 'failed', 'closed'].includes(pc.connectionState)) {
        endCall();
      }
    };

    return pc;
  };

  // Initiate call (caller side)
  const initiateCall = async () => {
    const stream = await startLocalStream();
    const pc = createPeerConnection(stream);
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    await base44.entities.Conversation.update(conversation.id, {
      call_signal: JSON.stringify({ type: 'offer', sdp: offer, from: user.id, callType, ts: Date.now() })
    }).catch(() => {});
  };

  // Answer call (callee side)
  const answerCall = async () => {
    setCallState('connecting');
    const stream = await startLocalStream();
    const pc = createPeerConnection(stream);

    // The offer SDP should be in incomingCall
    await pc.setRemoteDescription(new RTCSessionDescription(incomingCall.sdp));
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);

    await base44.entities.Conversation.update(conversation.id, {
      call_signal: JSON.stringify({ type: 'answer', sdp: answer, from: user.id, ts: Date.now() })
    }).catch(() => {});
  };

  // Poll for signaling messages
  useEffect(() => {
    if (!conversation?.id) return;

    const poll = setInterval(async () => {
      try {
        const convs = await base44.entities.Conversation.filter({ id: conversation.id });
        const conv = convs[0];
        if (!conv?.call_signal) return;

        const signal = JSON.parse(conv.call_signal);
        if (signal.from === user.id) return; // ignore own signals

        const pc = peerConnectionRef.current;

        if (signal.type === 'answer' && pc) {
          if (pc.signalingState === 'have-local-offer') {
            await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));
          }
        }

        if (signal.type === 'ice' && pc && signal.candidate) {
          await pc.addIceCandidate(new RTCIceCandidate(signal.candidate)).catch(() => {});
        }

        if (signal.type === 'end') {
          cleanUp();
          setCallState('ended');
          setTimeout(onEnd, 1000);
        }
      } catch (_) {}
    }, 1500);

    return () => clearInterval(poll);
  }, [conversation?.id, user?.id]);

  // Start call on mount (for caller)
  useEffect(() => {
    if (!incomingCall) {
      initiateCall();
    } else {
      // show incoming UI - stream starts when they answer
    }
    return () => cleanUp();
  }, []);

  const formatDuration = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  const toggleMute = () => {
    const audioTrack = localStreamRef.current?.getAudioTracks()[0];
    if (audioTrack) { audioTrack.enabled = !audioTrack.enabled; setIsMuted(!isMuted); }
  };

  const toggleVideo = () => {
    const videoTrack = localStreamRef.current?.getVideoTracks()[0];
    if (videoTrack) { videoTrack.enabled = !videoTrack.enabled; setIsVideoOff(!isVideoOff); }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-between py-12 px-6">
      {/* Remote video (full screen) */}
      {callType === 'video' && callState === 'connected' && (
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        />
      )}

      {/* Local video (picture-in-picture) */}
      {callType === 'video' && localStreamRef.current && (
        <video
          ref={localVideoRef}
          autoPlay
          playsInline
          muted
          className="absolute top-4 right-4 w-32 h-44 object-cover rounded-2xl border-2 border-white/20 z-10"
        />
      )}

      {/* Audio only - remote audio element */}
      {callType === 'audio' && <audio ref={remoteVideoRef} autoPlay />}

      {/* Overlay UI */}
      <div className="relative z-20 flex flex-col items-center gap-4 text-white">
        <Avatar className="w-24 h-24 border-4 border-white/20">
          <AvatarImage src={displayAvatar} />
          <AvatarFallback className="bg-gray-700 text-white text-3xl">{displayName?.charAt(0)}</AvatarFallback>
        </Avatar>
        <h2 className="text-2xl font-bold">{displayName}</h2>
        <p className="text-gray-300 text-sm">
          {callState === 'calling' && 'Calling...'}
          {callState === 'incoming' && `Incoming ${callType} call`}
          {callState === 'connecting' && 'Connecting...'}
          {callState === 'connected' && formatDuration(callDuration)}
          {callState === 'ended' && 'Call ended'}
        </p>
      </div>

      {/* Controls */}
      <div className="relative z-20 flex flex-col items-center gap-6 w-full">
        {/* Incoming call buttons */}
        {callState === 'incoming' && (
          <div className="flex items-center justify-center gap-16">
            <div className="flex flex-col items-center gap-2">
              <Button
                onClick={endCall}
                className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600"
              >
                <PhoneOff className="w-7 h-7 text-white" />
              </Button>
              <span className="text-white text-xs">Decline</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <Button
                onClick={answerCall}
                className="w-16 h-16 rounded-full bg-green-500 hover:bg-green-600"
              >
                <Phone className="w-7 h-7 text-white" />
              </Button>
              <span className="text-white text-xs">Accept</span>
            </div>
          </div>
        )}

        {/* Active call controls */}
        {['calling', 'connecting', 'connected'].includes(callState) && (
          <div className="flex items-center justify-center gap-6">
            <Button
              onClick={toggleMute}
              className={`w-14 h-14 rounded-full ${isMuted ? 'bg-red-500 hover:bg-red-600' : 'bg-gray-700 hover:bg-gray-600'}`}
            >
              {isMuted ? <MicOff className="w-6 h-6 text-white" /> : <Mic className="w-6 h-6 text-white" />}
            </Button>

            {callType === 'video' && (
              <Button
                onClick={toggleVideo}
                className={`w-14 h-14 rounded-full ${isVideoOff ? 'bg-red-500 hover:bg-red-600' : 'bg-gray-700 hover:bg-gray-600'}`}
              >
                {isVideoOff ? <VideoOff className="w-6 h-6 text-white" /> : <Video className="w-6 h-6 text-white" />}
              </Button>
            )}

            <Button
              onClick={endCall}
              className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600"
            >
              <PhoneOff className="w-7 h-7 text-white" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}