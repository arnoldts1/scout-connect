import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { base44 } from '@/api/base44Client';
import { sendMessage, markMessagesAsRead } from '@/api/conversationService';
import { callService } from '@/api/callService';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import CallInterface from '@/components/chat/CallInterface';
import { 
  ArrowLeft, Phone, Video, Info, Send, Image, Mic, Smile, X, 
  Reply, Heart, MessageCircle, Share, MoreVertical, Copy, Trash2,
  Download, Edit2, FileText, Clock, Zap
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { createPageUrl } from '@/utils';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import moment from 'moment';
import ResponsiveMedia from '@/components/chat/ResponsiveMedia';

const EMOJI_REACTIONS = ['❤️', '😂', '😮', '😢', '👍', '👎', '🔥', '🎉'];

export default function Chat() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);
  
  const [user, setUser] = useState(null);
  const [message, setMessage] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [isSending, setIsSending] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const [hoveredMessageId, setHoveredMessageId] = useState(null);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [activeCall, setActiveCall] = useState(null);
  const [callState, setCallState] = useState({
    status: null,
    callId: null,
    localStream: null,
    remoteStream: null,
    isMuted: false,
    isVideoOn: true
  });
  const peerConnectionRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const incomingCallSubscriptionRef = useRef(null);

  const urlParams = new URLSearchParams(window.location.search);
  const conversationId = urlParams.get('id');

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);

        // Subscribe to incoming calls (non-blocking)
        try {
          const subscription = callService.subscribeToIncomingCalls(currentUser.id, (incomingCall) => {
            console.log('Incoming call received:', incomingCall);
            // Use setTimeout to defer state update so UI doesn't freeze
            setTimeout(() => {
              setActiveCall({
                type: incomingCall.type,
                isIncoming: true,
                callData: incomingCall
              });
            }, 0);
          });
          incomingCallSubscriptionRef.current = subscription;
        } catch (callErr) {
          console.warn('Failed to subscribe to calls:', callErr);
        }
      } catch (error) {
        console.error('Error fetching user:', error);
        navigate(createPageUrl('Messages'));
      }
    };
    fetchUser();

    return () => {
      try {
        if (incomingCallSubscriptionRef.current) {
          incomingCallSubscriptionRef.current.unsubscribe();
        }
        callService.unsubscribeAll();
      } catch (e) {
        console.warn('Error unsubscribing from calls:', e);
      }
    };
  }, [navigate]);

  // Fetch conversation
  const { data: conversation, isLoading: convLoading, isError: convError } = useQuery({
    queryKey: ['conversation', conversationId],
    queryFn: async () => {
      if (!conversationId) {
        console.warn('No conversationId for conversation fetch');
        return null;
      }
      try {
        const convs = await base44.entities.Conversation.filter({ id: conversationId });
        console.log('Conversation fetched:', convs?.[0]?.id);
        return convs?.[0] || null;
      } catch (err) {
        console.error('Error fetching conversation:', err);
        throw err;
      }
    },
    enabled: !!conversationId,
    refetchInterval: 2000,
  });

  // Fetch messages
  const { data: messages = [], isLoading, isError, error } = useQuery({
    queryKey: ['messages', conversationId],
    queryFn: async () => {
      if (!conversationId) {
        console.warn('No conversationId provided');
        return [];
      }
      try {
        console.log('Fetching messages for conversation:', conversationId);
        const result = await base44.entities.Message.filter(
          { conversation_id: conversationId },
          'created_date',  // Ascending order (oldest first)
          200
        );
        console.log('Messages fetched successfully:', result?.length || 0, 'messages');
        return Array.isArray(result) ? result : [];
      } catch (err) {
        console.error('Error fetching messages:', err);
        toast.error('Failed to load messages');
        throw err;
      }
    },
    enabled: !!conversationId && !!conversation,  // Wait for conversation first
    refetchInterval: 2000,
  });

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Mark messages as read
  useEffect(() => {
    if (conversation && user?.id && messages.length > 0) {
      markMessagesAsRead(conversationId, user.id);
      
      // Update unread count in conversation
      const updatedUnread = { ...conversation.unread_count, [user.id]: 0 };
      base44.entities.Conversation.update(conversationId, { unread_count: updatedUnread });
      queryClient.invalidateQueries(['conversations']);
    }
  }, [messages, conversation, user?.id]);

  const getDisplayInfo = () => {
    if (!conversation) {
      return { name: 'Chat', avatar: null, isGroup: false, userId: null };
    }

    if (conversation.type === 'group') {
      return {
        name: conversation.group_name || 'Group Chat',
        avatar: conversation.group_avatar,
        isGroup: true,
        memberCount: conversation.participants?.length || 0,
        userId: null
      };
    }

    const otherParticipant = conversation.participant_details?.find(
      p => p.user_id !== user?.id
    );

    return {
      name: otherParticipant?.name || 'Scout',
      avatar: otherParticipant?.avatar,
      isGroup: false,
      userId: otherParticipant?.user_id
    };
  };

  const displayInfo = getDisplayInfo();

  const handleSendMessage = async (e) => {
    e?.preventDefault();
    if (!message.trim()) return;
    
    setIsSending(true);
    
    try {
      await base44.entities.Message.create({
        conversation_id: conversationId,
        sender_id: user.id,
        sender_name: user.full_name,
        sender_avatar: user.avatar,
        content: message.trim(),
        media_type: 'text',
        reply_to: replyingTo?.id,
        reply_preview: replyingTo?.content?.substring(0, 50),
        reactions: [],
        read_by: [user.id],
        delivered_to: [user.id],
        deleted_for: [],
        is_deleted: false
      });

      // Update conversation metadata
      const updatedUnread = { ...(conversation?.unread_count || {}) };
      conversation?.participants?.forEach(pId => {
        if (pId !== user.id) {
          updatedUnread[pId] = (updatedUnread[pId] || 0) + 1;
        }
      });

      await base44.entities.Conversation.update(conversationId, {
        last_message: message.trim().substring(0, 100),
        last_message_at: new Date().toISOString(),
        last_sender_id: user.id,
        unread_count: updatedUnread
      });

      setMessage('');
      setReplyingTo(null);
      queryClient.invalidateQueries(['messages', conversationId]);
      queryClient.invalidateQueries(['conversations']);
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setIsSending(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');

    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });

      await base44.entities.Message.create({
        conversation_id: conversationId,
        sender_id: user.id,
        sender_name: user.full_name,
        sender_avatar: user.avatar,
        content: null,
        media_url: file_url,
        media_type: isImage ? 'image' : isVideo ? 'video' : 'file',
        reactions: [],
        read_by: [user.id],
        delivered_to: [user.id],
        deleted_for: [],
        is_deleted: false
      });

      // Update conversation
      const updatedUnread = { ...(conversation?.unread_count || {}) };
      conversation?.participants?.forEach(pId => {
        if (pId !== user.id) {
          updatedUnread[pId] = (updatedUnread[pId] || 0) + 1;
        }
      });

      await base44.entities.Conversation.update(conversationId, {
        last_message: isImage ? '📷 Photo' : isVideo ? '🎥 Video' : '📎 File',
        last_message_at: new Date().toISOString(),
        last_sender_id: user.id,
        unread_count: updatedUnread
      });

      queryClient.invalidateQueries(['messages', conversationId]);
      toast.success('File sent!');
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error('Failed to upload file');
    }
  };

  const handleDeleteMessage = async (messageId) => {
    try {
      await base44.entities.Message.update(messageId, {
        is_deleted: true,
        deleted_for: [user.id],
        content: '[Message deleted]'
      });
      
      queryClient.invalidateQueries(['messages', conversationId]);
      toast.success('Message deleted');
      setSelectedMessage(null);
    } catch (error) {
      console.error('Error deleting message:', error);
      toast.error('Failed to delete message');
    }
  };

  const handleAddReaction = async (messageId, emoji) => {
    try {
      const msg = messages.find(m => m.id === messageId);
      if (!msg) return;

      const reactions = msg.reactions || [];
      const existingReaction = reactions.find(r => r.emoji === emoji && r.user_id === user.id);

      if (existingReaction) {
        // Remove reaction
        const updatedReactions = reactions.filter(
          r => !(r.emoji === emoji && r.user_id === user.id)
        );
        await base44.entities.Message.update(messageId, { reactions: updatedReactions });
      } else {
        // Add reaction
        const updatedReactions = [...reactions, { emoji, user_id: user.id, user_name: user.full_name }];
        await base44.entities.Message.update(messageId, { reactions: updatedReactions });
      }

      queryClient.invalidateQueries(['messages', conversationId]);
      setSelectedMessage(null);
    } catch (error) {
      console.error('Error adding reaction:', error);
    }
  };

  // Group messages by date
  const groupedMessages = messages.reduce((groups, msg) => {
    const date = new Date(msg.created_date).toDateString();
    if (!groups[date]) groups[date] = [];
    groups[date].push(msg);
    return groups;
  }, {});

  if (!user) {
    return (
      <div className="h-screen flex items-center justify-center bg-white dark:bg-gray-900">
        <div className="text-center">
          <Zap className="w-8 h-8 text-emerald-500 animate-spin mx-auto" />
          <p className="text-gray-500 mt-2">Loading...</p>
        </div>
      </div>
    );
  }

  if (convLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-white dark:bg-gray-900">
        <div className="text-center">
          <Zap className="w-8 h-8 text-emerald-500 animate-spin mx-auto" />
          <p className="text-gray-500 mt-2">Loading conversation...</p>
        </div>
      </div>
    );
  }

  if (!conversation && !conversationId) {
    return (
      <div className="h-screen flex items-center justify-center bg-white dark:bg-gray-900">
        <div className="text-center">
          <p className="text-red-500 font-medium">No conversation selected</p>
          <Button
            onClick={() => navigate(createPageUrl('Messages'))}
            className="mt-4 bg-emerald-500 hover:bg-emerald-600 text-white"
          >
            Back to Messages
          </Button>
        </div>
      </div>
    );
  }

  if (convError) {
    return (
      <div className="h-screen flex items-center justify-center bg-white dark:bg-gray-900">
        <div className="text-center">
          <p className="text-red-500 font-medium">Failed to load conversation</p>
          <Button
            onClick={() => navigate(createPageUrl('Messages'))}
            className="mt-4 bg-emerald-500 hover:bg-emerald-600 text-white"
          >
            Back to Messages
          </Button>
        </div>
      </div>
    );
  }

  // Handle initiating a call
  const handleInitiateCall = async (callType) => {
    try {
      if (!displayInfo.userId) {
        toast.error('Cannot initiate call: recipient not found');
        return;
      }

      setActiveCall({ type: callType, isIncoming: false });

      const { callId, stream } = await callService.initiateCall(
        conversationId,
        callType,
        displayInfo.userId
      );

      // Get peer connection from service
      const peerConn = callService.peerConnections.get(callId);
      peerConnectionRef.current = peerConn;

      // Setup handlers for peer connection
      if (peerConn) {
        peerConn.onicecandidate = (event) => {
          if (event.candidate) {
            callService.sendIceCandidate(callId, displayInfo.userId, event.candidate);
          }
        };

        peerConn.ontrack = (event) => {
          console.log('Remote stream received on caller side');
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = event.streams[0];
          }
        };
      }

      setCallState({
        status: 'ringing',
        callId,
        localStream: stream || null,
        remoteStream: null,
        isMuted: false,
        isVideoOn: callType === 'video'
      });

      // If media wasn't obtained immediately, try again with user permission
      if (!stream) {
        toast.info('Requesting camera/microphone permissions...');
      }

      // Watch for call acceptance
      try {
        const acceptanceWatch = callService.watchCallAcceptance(callId, () => {
          console.log('Recipient accepted the call, transitioning to connected');
          setCallState(prev => ({ ...prev, status: 'connected' }));
        });
        if (acceptanceWatch) {
          callService.callSubscriptions.set(`${callId}-acceptance`, acceptanceWatch);
        }
      } catch (err) {
        console.warn('Failed to setup acceptance watch:', err);
      }

      // Subscribe to call signals (listen for answer and ICE candidates)
      // Also poll for answer in case polling is more reliable
      try {
        let answerReceived = false;
        const answerPollInterval = setInterval(async () => {
          if (answerReceived) return;

          try {
            const { data: signals } = await supabase
              .from('call_signals')
              .select('*')
              .eq('call_id', callId)
              .eq('type', 'answer')
              .limit(1)
              .order('created_at', { ascending: false });

            if (signals && signals.length > 0) {
              console.log('Found answer from recipient');
              answerReceived = true;
              clearInterval(answerPollInterval);
              try {
                const answerData = typeof signals[0].data === 'string' ? JSON.parse(signals[0].data) : signals[0].data;
                console.log('Answer data:', answerData);
                await callService.handleAnswer(callId, answerData);
                console.log('✅ Answer processed successfully');
              } catch (err) {
                console.error('Error processing answer:', err);
              }
            }
          } catch (err) {
            console.error('Error polling for answer:', err);
          }
        }, 300);

        const signalSubscription = callService.subscribeToCallSignals(
          callId,
          user.id,
          async (signal) => {
            try {
              if (signal.type === 'answer') {
                console.log('Received answer from recipient (via subscription)');
                answerReceived = true;
                clearInterval(answerPollInterval);
                await callService.handleAnswer(callId, signal.data);
              } else if (signal.type === 'ice_candidate') {
                console.log('Received ICE candidate');
                await callService.handleIceCandidate(callId, signal.data);
              }
            } catch (err) {
              console.error('Error processing signal:', err);
            }
          }
        );
        if (signalSubscription) {
          callService.callSubscriptions.set(callId, signalSubscription);
        }

        // Clean up poll interval when call ends
        callService.callSubscriptions.set(`${callId}-answer-poll`, {
          unsubscribe: () => clearInterval(answerPollInterval)
        });
      } catch (subErr) {
        console.warn('Failed to subscribe to call signals:', subErr);
      }
    } catch (error) {
      console.error('Error initiating call:', error);
      toast.error('Failed to initiate call');
      setActiveCall(null);
    }
  };

  // Handle accepting incoming call
  const handleAcceptCall = async () => {
    try {
      const callId = activeCall.callData.id;
      const callType = activeCall.callData.type;
      const callerId = activeCall.callData.caller_id;

      console.log('Accepting call:', callId);

      // Show accepting state first
      setCallState(prev => ({
        ...prev,
        status: 'connecting'
      }));

      // Do the heavy lifting in the background
      setTimeout(async () => {
        try {
          const { stream, peerConnection } = await callService.acceptCall(callId, callType);
          peerConnectionRef.current = peerConnection;

          // Set up event handlers BEFORE processing offer
          if (peerConnection) {
            // Handle remote stream
            peerConnection.ontrack = (event) => {
              console.log('Remote stream received on receiver side');
              if (remoteVideoRef.current) {
                remoteVideoRef.current.srcObject = event.streams[0];
              }
            };

            // Handle ICE candidates generated by our peer connection
            peerConnection.onicecandidate = (event) => {
              if (event.candidate) {
                console.log('Sending ICE candidate from receiver');
                callService.sendIceCandidate(callId, callerId, event.candidate);
              }
            };
          }

          // Subscribe to call signals for ICE candidates BEFORE handling offer
          try {
            const signalSubscription = callService.subscribeToCallSignals(
              callId,
              user.id,
              async (signal) => {
                if (signal.type === 'ice_candidate') {
                  console.log('Received ICE candidate on receiver');
                  try {
                    await callService.handleIceCandidate(callId, signal.data);
                  } catch (err) {
                    console.warn('Error handling ICE candidate:', err);
                  }
                }
              }
            );
            if (signalSubscription) {
              callService.callSubscriptions.set(callId, signalSubscription);
            }
          } catch (subErr) {
            console.warn('Failed to subscribe to call signals:', subErr);
          }

          // Fetch and process the offer from the caller (with retry)
          console.log('Looking for offer from caller');
          let offer = null;
          let retries = 0;

          while (!offer && retries < 10) {
            try {
              const { data: signals, error: signalsError } = await supabase
                .from('call_signals')
                .select('*')
                .eq('call_id', callId)
                .eq('type', 'offer')
                .limit(1)
                .order('created_at', { ascending: false });

              if (signals && signals.length > 0 && !signalsError) {
                console.log('Found offer from caller');
                try {
                  const offerData = typeof signals[0].data === 'string' ? JSON.parse(signals[0].data) : signals[0].data;
                  console.log('Offer data:', offerData);
                  await callService.handleOffer(callId, callerId, offerData);
                  offer = offerData;
                } catch (offerErr) {
                  console.error('Error handling offer:', offerErr);
                }
              } else if (signalsError) {
                console.warn('Error fetching offer:', signalsError);
              } else {
                console.warn('No offer found yet, retrying...');
                retries++;
                if (retries < 10) {
                  // Wait 200ms before retrying
                  await new Promise(resolve => setTimeout(resolve, 200));
                }
              }
            } catch (err) {
              console.error('Error in offer fetch loop:', err);
              retries++;
            }
          }

          if (!offer) {
            console.error('Failed to get offer after 10 retries');
          }

          setCallState({
            status: 'connected',
            callId,
            localStream: stream,
            remoteStream: null,
            isMuted: false,
            isVideoOn: callType === 'video'
          });
        } catch (err) {
          console.error('Error in background accept:', err);
          toast.error('Failed to accept call');
        }
      }, 0);
    } catch (error) {
      console.error('Error accepting call:', error);
      toast.error('Failed to accept call');
    }
  };

  // Handle rejecting incoming call
  const handleRejectCall = async () => {
    try {
      const callId = activeCall.callData.id;
      await callService.rejectCall(callId);
      setActiveCall(null);
    } catch (error) {
      console.error('Error rejecting call:', error);
      toast.error('Failed to reject call');
    }
  };

  // Handle ending call
  const handleEndCall = async () => {
    try {
      if (callState.callId) {
        await callService.endCall(callState.callId);
      }
      setActiveCall(null);
      setCallState({
        status: null,
        callId: null,
        localStream: null,
        remoteStream: null,
        isMuted: false,
        isVideoOn: true
      });
    } catch (error) {
      console.error('Error ending call:', error);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-white dark:bg-gray-900">
      {/* Call Interface */}
      {activeCall && conversation && (
        <CallInterface
          callType={activeCall.type}
          participantName={displayInfo.name}
          participantAvatar={displayInfo.avatar}
          isIncoming={activeCall.isIncoming}
          onEndCall={handleEndCall}
          onAccept={handleAcceptCall}
          onReject={handleRejectCall}
          localStream={callState.localStream}
          callStatus={callState.status}
        />
      )}
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-800 px-4 py-3 flex items-center justify-between sticky top-0 bg-white dark:bg-gray-900 z-10">
        <div className="flex items-center gap-3 flex-1">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full"
            onClick={() => navigate(createPageUrl('Messages'))}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>

          {conversation ? (
            <>
              <div className="flex-1">
                <p className="font-bold text-gray-900 dark:text-white">{displayInfo.name}</p>
                {displayInfo.isGroup && (
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {displayInfo.memberCount} members
                  </p>
                )}
              </div>

              <Avatar className="w-10 h-10">
                <AvatarImage src={displayInfo.avatar} />
                <AvatarFallback>{displayInfo.name?.charAt(0)}</AvatarFallback>
              </Avatar>
            </>
          ) : (
            <div className="flex-1 animate-pulse">
              <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-24"></div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full"
            onClick={() => handleInitiateCall('audio')}
            title="Audio Call"
          >
            <Phone className="w-5 h-5 text-gray-700 dark:text-gray-300 hover:text-emerald-600" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full"
            onClick={() => handleInitiateCall('video')}
            title="Video Call"
          >
            <Video className="w-5 h-5 text-gray-700 dark:text-gray-300 hover:text-emerald-600" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full"
            onClick={() => navigate(createPageUrl(`ChatInfo?id=${conversationId}`))}
            title="Chat Information"
          >
            <Info className="w-5 h-5 text-gray-700 dark:text-gray-300 hover:text-emerald-600" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {isError ? (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-red-500">
            <MessageCircle className="w-12 h-12 text-red-300" />
            <p className="font-medium">Failed to load messages</p>
            <p className="text-sm text-gray-500">{error?.message || 'Unknown error'}</p>
            <Button
              onClick={() => queryClient.invalidateQueries(['messages', conversationId])}
              className="mt-4 bg-emerald-500 hover:bg-emerald-600 text-white"
            >
              Retry
            </Button>
          </div>
        ) : isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Zap className="w-6 h-6 text-emerald-500 animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-gray-500">
            <MessageCircle className="w-12 h-12 text-gray-300 dark:text-gray-700" />
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          Object.entries(groupedMessages).map(([date, dateMessages]) => (
            <div key={date} className="space-y-1">
              {dateMessages.map((msg, idx) => {
                const isOwn = msg.sender_id === user?.id;
                const showAvatar = !isOwn && (
                  idx === 0 || dateMessages[idx - 1]?.sender_id !== msg.sender_id
                );
                
                return (
                  <div
                    key={msg.id}
                    className={cn(
                      "flex items-end gap-2 group",
                      isOwn ? "justify-end" : "justify-start"
                    )}
                    onMouseEnter={() => setHoveredMessageId(msg.id)}
                    onMouseLeave={() => setHoveredMessageId(null)}
                  >
                    {/* Avatar */}
                    {!isOwn && (
                      <div className="w-8 flex-shrink-0">
                        {showAvatar && (
                          <Avatar className="w-8 h-8">
                            <AvatarImage src={msg.sender_avatar} />
                            <AvatarFallback className="text-xs">
                              {msg.sender_name?.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                        )}
                      </div>
                    )}

                    {/* Message bubble */}
                    <div className={cn(
                      "max-w-[70%] flex flex-col",
                      isOwn ? "items-end" : "items-start"
                    )}>
                      {/* Reply preview */}
                      {msg.reply_preview && (
                        <div className={cn(
                          "text-xs px-3 py-1 rounded-lg mb-1 border-l-2",
                          isOwn 
                            ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-500 text-gray-700 dark:text-gray-300" 
                            : "bg-gray-100 dark:bg-gray-800 border-gray-400 dark:border-gray-600 text-gray-600 dark:text-gray-400"
                        )}>
                          <p className="opacity-70 text-[10px]">Replied to message</p>
                          <p className="truncate">{msg.reply_preview}</p>
                        </div>
                      )}

                      {/* Media */}
                      {msg.media_url && !msg.is_deleted && (
                        <div className="mb-1">
                          <ResponsiveMedia
                            mediaUrl={msg.media_url}
                            mediaType={msg.media_type}
                            isOwn={isOwn}
                          />
                        </div>
                      )}

                      {/* Text content */}
                      {msg.content && !msg.is_deleted && (
                        <div
                          className={cn(
                            "px-4 py-2 rounded-2xl",
                            isOwn 
                              ? "bg-emerald-500 text-white" 
                              : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white"
                          )}
                        >
                          <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                        </div>
                      )}

                      {msg.is_deleted && (
                        <div className="px-4 py-2 text-xs text-gray-400 italic">
                          [Message deleted]
                        </div>
                      )}

                      {/* Time */}
                      <span className="text-[10px] text-gray-400 dark:text-gray-500 mt-1 px-1">
                        {moment(msg.created_date).format('h:mm A')}
                      </span>

                      {/* Reactions */}
                      {msg.reactions?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {Array.from(new Set(msg.reactions.map(r => r.emoji))).map(emoji => {
                            const reactionCount = msg.reactions.filter(r => r.emoji === emoji).length;
                            return (
                              <div
                                key={emoji}
                                className="bg-gray-100 dark:bg-gray-800 rounded-full px-2 py-0.5 text-xs flex items-center gap-1 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700"
                                onClick={() => handleAddReaction(msg.id, emoji)}
                              >
                                <span>{emoji}</span>
                                {reactionCount > 1 && <span className="text-gray-600 dark:text-gray-400">{reactionCount}</span>}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Message actions */}
                    {hoveredMessageId === msg.id && (
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                        <button
                          onClick={() => setReplyingTo(msg)}
                          className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition"
                          title="Reply"
                        >
                          <Reply className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                        </button>
                        <div className="flex gap-0.5">
                          {EMOJI_REACTIONS.map(emoji => (
                            <button
                              key={emoji}
                              onClick={() => handleAddReaction(msg.id, emoji)}
                              className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition text-sm"
                              title={`React with ${emoji}`}
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
                        {isOwn && (
                          <button
                            onClick={() => handleDeleteMessage(msg.id)}
                            className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-full transition"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Reply preview */}
      {replyingTo && (
        <div className="bg-gray-50 dark:bg-gray-800/50 px-4 py-2 flex items-center justify-between border-t border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-2">
            <Reply className="w-4 h-4 text-emerald-500" />
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Replying to {replyingTo.sender_name}</p>
              <p className="text-sm text-gray-900 dark:text-white truncate max-w-[250px]">
                {replyingTo.content || '[Media]'}
              </p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            className="rounded-full h-8 w-8"
            onClick={() => setReplyingTo(null)}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* Input area */}
      <div className="border-t border-gray-200 dark:border-gray-800 px-4 py-3 bg-white dark:bg-gray-900">
        <form onSubmit={handleSendMessage} className="flex items-end gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            className="hidden"
            accept="image/*,video/*,.pdf,.doc,.docx"
          />

          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="rounded-full"
            onClick={() => fileInputRef.current?.click()}
          >
            <Image className="w-5 h-5 text-gray-700 dark:text-gray-300" />
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="rounded-full"
          >
            <Smile className="w-5 h-5 text-gray-700 dark:text-gray-300" />
          </Button>

          <Input
            ref={inputRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder="Message..."
            className="rounded-full bg-gray-100 dark:bg-gray-800 border-0"
          />

          <Button
            type="submit"
            disabled={!message.trim() || isSending}
            size="icon"
            className="rounded-full bg-emerald-500 hover:bg-emerald-600 text-white"
          >
            {isSending ? (
              <Zap className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
