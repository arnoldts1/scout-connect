import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Calendar, MapPin, Users, Clock, Share2, 
  MessageCircle, CheckCircle, X, Navigation
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { createPageUrl } from '@/utils';
import { cn } from '@/lib/utils';
import moment from 'moment';
import { toast } from 'sonner';
import { generateGoogleCalendarUrl } from '@/lib/googleCalendarHelper';

const EVENT_TYPE_COLORS = {
  camping: 'bg-emerald-100 text-emerald-700',
  hike: 'bg-blue-100 text-blue-700',
  service: 'bg-purple-100 text-purple-700',
  training: 'bg-amber-100 text-amber-700',
  ceremony: 'bg-pink-100 text-pink-700',
  meeting: 'bg-gray-100 text-gray-700',
  other: 'bg-gray-100 text-gray-700',
};

export default function Event() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);

  const urlParams = new URLSearchParams(window.location.search);
  const eventId = urlParams.get('id');

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (error) {
        console.log('Not authenticated');
      }
    };
    fetchUser();
  }, []);

  const { data: event } = useQuery({
    queryKey: ['event', eventId],
    queryFn: async () => {
      if (!eventId) return null;
      const events = await base44.entities.Event.filter({ id: eventId });
      return events[0];
    },
    enabled: !!eventId,
  });

  const { data: participants = [] } = useQuery({
    queryKey: ['event-participants', eventId, event?.id],
    queryFn: async () => {
      if (!event?.id) return [];

      try {
        // Fetch the latest event data to get current participants list
        const latestEvents = await base44.entities.Event.filter({ id: event.id });
        const latestEvent = latestEvents[0];

        if (!latestEvent?.participants?.length) return [];

        // Fetch all users and filter by event participants
        const allUsers = await base44.entities.User.list();
        const eventParticipants = allUsers.filter(u => latestEvent.participants.includes(u.id));

        console.log('📋 Fetched event participants:', eventParticipants.map(p => p.full_name));
        return eventParticipants;
      } catch (error) {
        console.error('Error fetching participants:', error);
        return [];
      }
    },
    enabled: !!event?.id,
  });

  const isJoined = event?.participants?.includes(user?.id);
  const isOrganizer = event?.organizer_id === user?.id;
  const startDate = event?.start_date ? moment(event.start_date) : null;
  const endDate = event?.end_date ? moment(event.end_date) : null;
  const isUpcoming = startDate?.isAfter(moment());
  const isOngoing = startDate?.isBefore(moment()) && (!endDate || endDate.isAfter(moment()));
  const isFull = event?.max_participants && event.participant_count >= event.max_participants;

  const handleJoin = async () => {
    if (!event || !user) return;
    
    const newParticipants = [...(event.participants || []), user.id];
    await base44.entities.Event.update(event.id, { 
      participants: newParticipants,
      participant_count: newParticipants.length
    });
    
    toast.success('You joined the event!');
    queryClient.invalidateQueries(['event', eventId]);
  };

  // Auto-create location from event (for Adventure Finder)
  const createLocationFromEvent = async () => {
    if (!event?.location) return;
    
    // Check if location already exists
    const existingLocations = await base44.entities.Location.filter({ name: event.location });
    if (existingLocations.length > 0) return;
    
    // Create new location based on event type
    const typeMapping = {
      camping: 'campsite',
      hike: 'hiking_route',
      service: 'service_location',
      training: 'training_center',
      meeting: 'meeting_point',
    };
    
    await base44.entities.Location.create({
      name: event.location,
      type: typeMapping[event.event_type] || 'meeting_point',
      description: `Location for ${event.title}`,
      status: 'active'
    });
  };

  useEffect(() => {
    if (event?.status === 'approved' && event?.location) {
      createLocationFromEvent();
    }
  }, [event?.id, event?.status]);

  const handleLeave = async () => {
    if (!event || !user) return;
    
    const newParticipants = (event.participants || []).filter(id => id !== user.id);
    await base44.entities.Event.update(event.id, { 
      participants: newParticipants,
      participant_count: newParticipants.length
    });
    
    toast.success('You left the event');
    queryClient.invalidateQueries(['event', eventId]);
  };

  const handleOpenChat = async () => {
    try {
      // Fetch the latest event data to check if conversation already exists
      const latestEvents = await base44.entities.Event.filter({ id: eventId });
      const latestEvent = latestEvents[0];

      console.log('Latest event data:', latestEvent);

      if (latestEvent?.conversation_id) {
        console.log('Opening existing event chat:', latestEvent.conversation_id);
        navigate(createPageUrl(`Chat?id=${latestEvent.conversation_id}`));
        return;
      }

      if (!isJoined) {
        toast.error('Join the event first to access the chat');
        return;
      }

      console.log('Creating new event group chat for:', event.title);

      // Create group chat for event with all participants
      const participantDetails = participants
        .filter(p => latestEvent.participants?.includes(p.id))
        .map(p => ({
          user_id: p.id,
          name: p.full_name,
          avatar: p.avatar
        }));

      const conversationPayload = {
        type: 'group',
        group_name: `${event.title} Chat`,
        participants: latestEvent.participants || [],
        participant_details: participantDetails,
        group_avatar: null,
        created_by_id: user?.id
      };

      console.log('Conversation payload:', conversationPayload);

      const newConv = await base44.entities.Conversation.create(conversationPayload);
      console.log('✅ Conversation created:', newConv);

      if (newConv?.id) {
        await base44.entities.Event.update(event.id, {
          conversation_id: newConv.id
        });

        console.log('✅ Event updated with conversation_id');
        queryClient.invalidateQueries(['event', eventId]);
        navigate(createPageUrl(`Chat?id=${newConv.id}`));
      }
    } catch (error) {
      console.error('❌ Error opening event chat:', error);
      toast.error(`Failed to open chat: ${error?.message || 'Unknown error'}`);
    }
  };

  if (!event) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header Image */}
      <div className="relative h-64 bg-gradient-to-br from-emerald-500 to-teal-600">
        {event.cover_image && (
          <img 
            src={event.cover_image} 
            alt={event.title} 
            className="w-full h-full object-cover"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        
        <Button 
          variant="ghost" 
          size="icon"
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 bg-black/20 text-white hover:bg-black/40 rounded-full"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>

        <Button 
          variant="ghost" 
          size="icon"
          className="absolute top-4 right-4 bg-black/20 text-white hover:bg-black/40 rounded-full"
        >
          <Share2 className="w-5 h-5" />
        </Button>

        {/* Date Badge */}
        <div className="absolute bottom-4 left-4 bg-white dark:bg-gray-900 rounded-xl p-3 text-center shadow-lg">
          <p className="text-sm text-emerald-600 font-medium uppercase">
            {startDate?.format('MMM')}
          </p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">
            {startDate?.format('D')}
          </p>
        </div>

        {/* Status Badge */}
        {isOngoing && (
          <Badge className="absolute bottom-4 right-4 bg-emerald-500 text-white animate-pulse">
            Live Now
          </Badge>
        )}
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 py-6">
        {/* Title & Type */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <Badge className={cn("mb-2", EVENT_TYPE_COLORS[event.event_type] || EVENT_TYPE_COLORS.other)}>
              {event.event_type?.replace('_', ' ')}
            </Badge>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {event.title}
            </h1>
          </div>
          {event.status === 'approved' && (
            <Badge variant="outline" className="text-emerald-600 border-emerald-600">
              <CheckCircle className="w-3 h-3 mr-1" />
              Approved
            </Badge>
          )}
        </div>

        {/* Organizer */}
        <Link 
          to={createPageUrl(`Profile?id=${event.organizer_id}`)}
          className="flex items-center gap-3 mb-6"
        >
          <Avatar className="w-12 h-12">
            <AvatarFallback className="bg-emerald-100 text-emerald-700">
              {event.organizer_name?.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium text-gray-900 dark:text-white">{event.organizer_name}</p>
            <p className="text-sm text-gray-500">Organizer</p>
          </div>
        </Link>

        {/* Details */}
        <div className="space-y-4 mb-6">
          <div className="flex items-start gap-3 p-4 bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800">
            <Clock className="w-5 h-5 text-emerald-600 mt-0.5" />
            <div>
              <p className="font-medium text-gray-900 dark:text-white">
                {startDate?.format('dddd, MMMM D, YYYY')}
              </p>
              <p className="text-sm text-gray-500">
                {startDate?.format('h:mm A')}
                {endDate && ` - ${endDate.format('h:mm A')}`}
              </p>
            </div>
          </div>

          {event.location && (
            <div className="flex items-start gap-3 p-4 bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800">
              <MapPin className="w-5 h-5 text-emerald-600 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium text-gray-900 dark:text-white">{event.location}</p>
                <Button variant="link" size="sm" className="text-emerald-600 p-0 h-auto">
                  <Navigation className="w-3 h-3 mr-1" />
                  Get directions
                </Button>
              </div>
            </div>
          )}

          <div className="flex items-start gap-3 p-4 bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800">
            <Users className="w-5 h-5 text-emerald-600 mt-0.5" />
            <div>
              <p className="font-medium text-gray-900 dark:text-white">
                {event.participant_count || 0} going
                {event.max_participants && ` / ${event.max_participants} spots`}
              </p>
              {isFull && (
                <p className="text-sm text-amber-600">Event is full</p>
              )}
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="mb-6">
          <h2 className="font-semibold text-lg text-gray-900 dark:text-white mb-2">About</h2>
          <p className="text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
            {event.description || 'No description provided.'}
          </p>
        </div>

        {/* Participants */}
        <div className="mb-8">
          <h2 className="font-semibold text-lg text-gray-900 dark:text-white mb-4">
            Participants ({event.participant_count || 0})
          </h2>
          <div className="flex flex-wrap gap-2">
            {participants.filter(p => event.participants?.includes(p.id)).slice(0, 12).map((participant) => (
              <Link key={participant.id} to={createPageUrl(`Profile?id=${participant.id}`)}>
                <Avatar className="w-12 h-12 hover:ring-2 hover:ring-emerald-500 transition-all">
                  <AvatarImage src={participant.avatar} />
                  <AvatarFallback className="bg-emerald-100 text-emerald-700">
                    {participant.full_name?.charAt(0)}
                  </AvatarFallback>
                </Avatar>
              </Link>
            ))}
            {(event.participant_count || 0) > 12 && (
              <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-sm font-medium text-gray-600">
                +{event.participant_count - 12}
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 flex-wrap sticky bottom-20 md:bottom-4 bg-gray-50 dark:bg-gray-950 py-4">
           <Button 
             asChild
             variant="outline"
             className="rounded-full"
           >
             <a href={generateGoogleCalendarUrl(event)} target="_blank" rel="noopener noreferrer">
               <Calendar className="w-4 h-4 mr-2" />
               Add to Google Calendar
             </a>
           </Button>

           {isUpcoming && !isOrganizer && (
             isJoined ? (
               <>
                 <Button 
                   onClick={handleOpenChat}
                   className="flex-1 bg-emerald-600 hover:bg-emerald-700 rounded-full"
                 >
                   <MessageCircle className="w-4 h-4 mr-2" />
                   Event Chat
                 </Button>
                 <Button 
                   onClick={handleLeave}
                   variant="outline"
                   className="rounded-full"
                 >
                   <X className="w-4 h-4 mr-2" />
                   Leave
                 </Button>
               </>
             ) : (
               <Button 
                 onClick={handleJoin}
                 disabled={isFull}
                 className="flex-1 bg-emerald-600 hover:bg-emerald-700 rounded-full"
               >
                 {isFull ? 'Event Full' : 'Join Event'}
               </Button>
             )
           )}

           {isOrganizer && (
             <>
               <Button 
                 onClick={handleOpenChat}
                 className="flex-1 bg-emerald-600 hover:bg-emerald-700 rounded-full"
               >
                 <MessageCircle className="w-4 h-4 mr-2" />
                 Event Chat
               </Button>
               <Button 
                 variant="outline"
                 className="rounded-full"
               >
                 Edit Event
               </Button>
             </>
           )}

           {isOngoing && isJoined && (
             <Button 
               onClick={handleOpenChat}
               className="flex-1 bg-emerald-600 hover:bg-emerald-700 rounded-full"
             >
               <MessageCircle className="w-4 h-4 mr-2" />
               Event Chat
             </Button>
           )}
         </div>
      </div>
    </div>
  );
}
