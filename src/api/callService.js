import { supabase } from '@/lib/supabase';
import { base44 } from '@/api/base44Client';

class CallService {
  constructor() {
    this.peerConnections = new Map();
    this.localStreams = new Map();
    this.callSubscriptions = new Map();
  }

  // Initiate a call
  async initiateCall(conversationId, callType, recipientId) {
    try {
      const caller = await base44.auth.me();
      const callId = `call_${conversationId}_${Date.now()}`;

      console.log('Initiating call:', { callId, caller: caller.id, recipient: recipientId, type: callType });

      // Create WebRTC peer connection first (no media needed yet)
      const peerConnection = await this.createPeerConnection(callId, callType, true);
      this.peerConnections.set(callId, peerConnection);

      // Create and send offer (without adding tracks yet)
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);

      // Create call record in database
      console.log('Creating call record with:', {
        id: callId,
        conversation_id: conversationId,
        caller_id: caller.id,
        recipient_id: recipientId,
        type: callType,
        status: 'ringing'
      });

      const { error: insertError, data } = await supabase.from('calls').insert({
        id: callId,
        conversation_id: conversationId,
        caller_id: caller.id,
        recipient_id: recipientId,
        type: callType,
        status: 'ringing',
        created_at: new Date().toISOString()
      }).select();

      if (insertError) {
        console.error('Error inserting call record:', insertError);
        throw insertError;
      }

      console.log('✅ Call record created successfully:', callId, 'Response:', data);

      // Broadcast call signaling through Realtime
      await supabase.from('call_signals').insert({
        call_id: callId,
        from_user_id: caller.id,
        to_user_id: recipientId,
        type: 'offer',
        data: JSON.stringify(offer),
        created_at: new Date().toISOString()
      });

      // Get media stream asynchronously after call is initiated
      this.getMediaStream(callType)
        .then(stream => {
          this.localStreams.set(callId, stream);
          // Add local stream tracks to peer connection
          stream.getTracks().forEach(track => {
            peerConnection.addTrack(track, stream);
          });
          console.log('Media stream added to call:', callId);
        })
        .catch(err => {
          console.warn('Failed to get media stream for call:', callId, err);
          // Call can proceed without media, user will see a notification
        });

      return { callId, stream: null };
    } catch (error) {
      console.error('Error initiating call:', error);
      throw error;
    }
  }

  // Listen for incoming calls using polling (more reliable than Realtime)
  subscribeToIncomingCalls(userId, onIncomingCall) {
    try {
      console.log('Setting up incoming calls polling for user:', userId);

      const seenCallIds = new Set();
      const pollInterval = setInterval(async () => {
        try {
          // Poll for new incoming calls
          const { data: calls, error } = await supabase
            .from('calls')
            .select('*')
            .eq('recipient_id', userId)
            .eq('status', 'ringing')
            .order('created_at', { ascending: false })
            .limit(1);

          if (error) {
            console.warn('Error polling for calls:', error);
            return;
          }

          if (calls && calls.length > 0) {
            const call = calls[0];
            if (!seenCallIds.has(call.id)) {
              seenCallIds.add(call.id);
              console.log('✅ Incoming call received for user:', userId, call);
              onIncomingCall(call);
            }
          }
        } catch (err) {
          console.error('Error in call polling:', err);
        }
      }, 1000); // Poll every 1 second

      // Return a mock subscription object with unsubscribe method
      return {
        unsubscribe: () => {
          clearInterval(pollInterval);
          console.log('Unsubscribed from call polling');
        }
      };
    } catch (error) {
      console.warn('Failed to setup call polling:', error);
      return null;
    }
  }

  // Listen for call signaling (offer, answer, ICE candidates)
  subscribeToCallSignals(callId, userId, onSignal) {
    try {
      const subscription = supabase
        .channel(`call_signals:${callId}`)
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'call_signals',
          filter: `to_user_id=eq.${userId}`,
        }, (payload) => {
          try {
            const signal = payload.new;
            try {
              signal.data = JSON.parse(signal.data);
            } catch (e) {
              // data might already be parsed
            }
            onSignal(signal);
          } catch (err) {
            console.error('Error in signal handler:', err);
          }
        })
        .subscribe();

      return subscription;
    } catch (error) {
      console.warn('Failed to subscribe to call signals:', error);
      return null;
    }
  }

  // Accept an incoming call
  async acceptCall(callId, callType) {
    try {
      const caller = await base44.auth.me();

      console.log('Accepting call:', callId);

      // Update call status FIRST
      const { error: updateError } = await supabase
        .from('calls')
        .update({ status: 'accepted', updated_at: new Date().toISOString() })
        .eq('id', callId);

      if (updateError) {
        console.error('Error updating call status:', updateError);
        throw updateError;
      }

      console.log('✅ Call status updated to accepted:', callId);

      // Get media stream
      const stream = await this.getMediaStream(callType);
      this.localStreams.set(callId, stream);

      // Create peer connection
      const peerConnection = await this.createPeerConnection(callId, callType, false);
      this.peerConnections.set(callId, peerConnection);

      // Add local stream to peer connection
      stream.getTracks().forEach(track => {
        peerConnection.addTrack(track, stream);
      });

      return { callId, stream, peerConnection };
    } catch (error) {
      console.error('Error accepting call:', error);
      throw error;
    }
  }

  // Reject an incoming call
  async rejectCall(callId) {
    try {
      await supabase.from('calls').update({ status: 'rejected' }).eq('id', callId);
      await this.endCall(callId);
    } catch (error) {
      console.error('Error rejecting call:', error);
      throw error;
    }
  }

  // Handle incoming offer
  async handleOffer(callId, callerUserId, offer) {
    try {
      console.log('Handling offer for call:', callId);
      const peerConnection = this.peerConnections.get(callId);
      if (!peerConnection) {
        throw new Error('Peer connection not found');
      }

      console.log('Setting remote description (offer)');
      // Set remote description
      await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));

      // Create and send answer
      const caller = await base44.auth.me();
      console.log('Creating answer');
      const answer = await peerConnection.createAnswer();
      console.log('Setting local description (answer)');
      await peerConnection.setLocalDescription(answer);

      console.log('Sending answer to caller');
      const { error: insertError } = await supabase.from('call_signals').insert({
        call_id: callId,
        from_user_id: caller.id,
        to_user_id: callerUserId,
        type: 'answer',
        data: JSON.stringify(answer),
        created_at: new Date().toISOString()
      });

      if (insertError) {
        console.error('Error inserting answer:', insertError);
        throw insertError;
      }

      console.log('✅ Answer sent successfully');
    } catch (error) {
      console.error('Error handling offer:', error);
      throw error;
    }
  }

  // Handle incoming answer
  async handleAnswer(callId, answer) {
    try {
      const peerConnection = this.peerConnections.get(callId);
      if (!peerConnection) {
        throw new Error('Peer connection not found');
      }

      await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
    } catch (error) {
      console.error('Error handling answer:', error);
      throw error;
    }
  }

  // Handle ICE candidate
  async handleIceCandidate(callId, candidate) {
    try {
      const peerConnection = this.peerConnections.get(callId);
      if (!peerConnection) {
        throw new Error('Peer connection not found');
      }

      if (candidate) {
        await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
      }
    } catch (error) {
      console.error('Error handling ICE candidate:', error);
    }
  }

  // Send ICE candidate
  async sendIceCandidate(callId, recipientUserId, candidate) {
    try {
      const caller = await base44.auth.me();
      await supabase.from('call_signals').insert({
        call_id: callId,
        from_user_id: caller.id,
        to_user_id: recipientUserId,
        type: 'ice_candidate',
        data: JSON.stringify(candidate),
        created_at: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error sending ICE candidate:', error);
    }
  }

  // Create peer connection with event handlers
  async createPeerConnection(callId, callType, isCaller) {
    const iceServers = [
      { urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] }
    ];

    const peerConnection = new RTCPeerConnection({
      iceServers
    });

    // Handle ICE candidates
    peerConnection.onicecandidate = async (event) => {
      if (event.candidate) {
        const call = await supabase.from('calls').select('caller_id, recipient_id').eq('id', callId).single();
        const recipientId = isCaller ? call.data.recipient_id : call.data.caller_id;
        await this.sendIceCandidate(callId, recipientId, event.candidate);
      }
    };

    // Handle connection state changes
    peerConnection.onconnectionstatechange = () => {
      console.log('Connection state:', peerConnection.connectionState);
      if (peerConnection.connectionState === 'failed' || peerConnection.connectionState === 'disconnected') {
        this.endCall(callId);
      }
    };

    // Handle remote stream
    peerConnection.ontrack = (event) => {
      console.log('Remote stream received:', event.streams[0]);
      // This will be handled by the component receiving the stream
    };

    return peerConnection;
  }

  // Get media stream (audio or video)
  async getMediaStream(callType) {
    const constraints = {
      audio: true,
      video: callType === 'video' ? { width: 1280, height: 720 } : false
    };

    try {
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      return stream;
    } catch (error) {
      console.error('Error getting media stream:', error);
      throw error;
    }
  }

  // End call and cleanup
  async endCall(callId) {
    try {
      // Stop all tracks
      const stream = this.localStreams.get(callId);
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
        this.localStreams.delete(callId);
      }

      // Close peer connection
      const peerConnection = this.peerConnections.get(callId);
      if (peerConnection) {
        peerConnection.close();
        this.peerConnections.delete(callId);
      }

      // Update call status
      await supabase.from('calls').update({ 
        status: 'ended',
        ended_at: new Date().toISOString()
      }).eq('id', callId);

      // Unsubscribe from signals
      const subscription = this.callSubscriptions.get(callId);
      if (subscription) {
        await subscription.unsubscribe();
        this.callSubscriptions.delete(callId);
      }
    } catch (error) {
      console.error('Error ending call:', error);
    }
  }

  // Watch for call acceptance (caller side)
  watchCallAcceptance(callId, onAccepted) {
    try {
      console.log('Watching for call acceptance:', callId);

      const pollInterval = setInterval(async () => {
        try {
          const { data: calls, error } = await supabase
            .from('calls')
            .select('status')
            .eq('id', callId)
            .single();

          if (error) {
            console.warn('Error polling call status:', error);
            return;
          }

          if (calls && calls.status === 'accepted') {
            console.log('✅ Call accepted by recipient');
            clearInterval(pollInterval);
            onAccepted();
          }
        } catch (err) {
          console.error('Error in acceptance polling:', err);
        }
      }, 500); // Poll every 500ms

      return {
        unsubscribe: () => {
          clearInterval(pollInterval);
          console.log('Stopped watching for call acceptance');
        }
      };
    } catch (error) {
      console.warn('Failed to setup acceptance watch:', error);
      return null;
    }
  }

  // Unsubscribe from all subscriptions
  async unsubscribeAll() {
    for (const [, subscription] of this.callSubscriptions) {
      await subscription.unsubscribe();
    }
    this.callSubscriptions.clear();
  }
}

export const callService = new CallService();
