import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { 
  MapPin, Calendar, Users, Car, Bus, Search, Filter,
  Tent, Mountain, Heart, Navigation, ChevronRight, Plus,
  Phone, DollarSign, Check, Loader2
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { createPageUrl } from '@/utils';
import { cn } from '@/lib/utils';
import moment from 'moment';
import OfferRideDialog from '@/components/transport/OfferRideDialog';
import { toast } from 'sonner';

const LOCATION_TYPES = [
  { id: 'all', label: 'All', icon: '📍' },
  { id: 'campsite', label: 'Campsites', icon: '⛺' },
  { id: 'training_center', label: 'Training', icon: '🏫' },
  { id: 'hiking_route', label: 'Hiking', icon: '🥾' },
  { id: 'service_location', label: 'Service', icon: '🤝' },
];

export default function AdventureFinder() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('events');
  const [activeLocationType, setActiveLocationType] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showOfferRide, setShowOfferRide] = useState(false);
  const [bookingId, setBookingId] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
    };
    fetchUser();
  }, []);

  const { data: events = [] } = useQuery({
    queryKey: ['upcoming-events'],
    queryFn: () => base44.entities.Event.filter({ status: 'approved' }, 'start_date', 50),
  });

  const { data: locations = [] } = useQuery({
    queryKey: ['locations'],
    queryFn: () => base44.entities.Location.filter({ status: 'active' }),
  });

  const { data: transports = [] } = useQuery({
    queryKey: ['transport-groups'],
    queryFn: () => base44.entities.TransportGroup.filter({ status: 'open' }),
  });

  const { data: myRegistrations = [] } = useQuery({
    queryKey: ['my-registrations', user?.id],
    queryFn: () => base44.entities.Registration.filter({ user_id: user?.id }),
    enabled: !!user?.id,
  });

  const filteredLocations = locations.filter(loc => {
    const matchesType = activeLocationType === 'all' || loc.type === activeLocationType;
    const matchesSearch = loc.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  const upcomingEvents = events.filter(e => moment(e.start_date).isAfter(moment()));

  // Auto-collapse: only show transports whose linked event hasn't ended (or has no event)
  const activeTransports = transports.filter(transport => {
    if (!transport.event_id) return true;
    const eventInfo = events.find(e => e.id === transport.event_id);
    if (!eventInfo) return true;
    // Hide if event end_date has passed, or start_date + 1 day has passed if no end_date
    const eventEnd = eventInfo.end_date
      ? moment(eventInfo.end_date)
      : moment(eventInfo.start_date).add(1, 'day');
    return moment().isBefore(eventEnd);
  });

  const handleBookSeat = async (transport) => {
    if (!user) return;
    
    setBookingId(transport.id);
    try {
      const newPassengers = [...(transport.passengers || []), {
        user_id: user.id,
        name: user.full_name,
        status: 'confirmed'
      }];
      
      await base44.entities.TransportGroup.update(transport.id, {
        passengers: newPassengers,
        available_seats: transport.available_seats - 1,
        status: transport.available_seats - 1 === 0 ? 'full' : 'open'
      });
      
      toast.success('Seat booked successfully!');
      queryClient.invalidateQueries(['transport-groups']);
    } catch (error) {
      toast.error('Failed to book seat');
    } finally {
      setBookingId(null);
    }
  };

  const hasBookedSeat = (transport) => {
    return transport.passengers?.some(p => p.user_id === user?.id);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <div className="bg-gradient-to-r from-teal-500 to-emerald-500 text-white">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Navigation className="w-7 h-7" />
            Adventure Finder
          </h1>
          <p className="text-teal-100 mt-1">Discover events, locations, and adventures</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full grid grid-cols-3 mb-6">
            <TabsTrigger value="events">
              <Calendar className="w-4 h-4 mr-2" /> Events
            </TabsTrigger>
            <TabsTrigger value="locations">
              <MapPin className="w-4 h-4 mr-2" /> Locations
            </TabsTrigger>
            <TabsTrigger value="transport">
              <Car className="w-4 h-4 mr-2" /> Transport
            </TabsTrigger>
          </TabsList>

          {/* Events Tab */}
          <TabsContent value="events">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-semibold">Upcoming Events</h2>
              <Button onClick={() => navigate(createPageUrl('Events'))} size="sm" variant="outline">
                View Calendar
              </Button>
            </div>
            
            <div className="space-y-4">
              {upcomingEvents.map(event => (
                <Link
                  key={event.id}
                  to={createPageUrl(`Event?id=${event.id}`)}
                  className="block bg-white dark:bg-gray-900 rounded-xl border overflow-hidden hover:shadow-lg transition-all"
                >
                  <div className="flex">
                    <div className="w-24 bg-teal-500 text-white flex flex-col items-center justify-center p-3">
                      <span className="text-2xl font-bold">{moment(event.start_date).format('DD')}</span>
                      <span className="text-sm">{moment(event.start_date).format('MMM')}</span>
                    </div>
                    <div className="flex-1 p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <Badge className="mb-2">{event.event_type}</Badge>
                          <h3 className="font-semibold">{event.title}</h3>
                          <p className="text-sm text-gray-500 line-clamp-1">{event.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" /> {event.location}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" /> {event.participant_count || 0} going
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </TabsContent>

          {/* Locations Tab */}
          <TabsContent value="locations">
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search locations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 rounded-full"
              />
            </div>

            <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide">
              {LOCATION_TYPES.map(type => (
                <button
                  key={type.id}
                  onClick={() => setActiveLocationType(type.id)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-colors",
                    activeLocationType === type.id
                      ? "bg-teal-500 text-white"
                      : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                  )}
                >
                  <span>{type.icon}</span>
                  <span className="text-sm font-medium">{type.label}</span>
                </button>
              ))}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {filteredLocations.map(location => (
                <div key={location.id} className="bg-white dark:bg-gray-900 rounded-xl border overflow-hidden">
                  <div className="aspect-video bg-gray-100 dark:bg-gray-800 relative">
                    {location.images?.[0] ? (
                      <img src={location.images[0]} alt={location.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-4xl">
                        {LOCATION_TYPES.find(t => t.id === location.type)?.icon || '📍'}
                      </div>
                    )}
                    <Badge className="absolute top-2 left-2">
                      {location.type.replace('_', ' ')}
                    </Badge>
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold">{location.name}</h3>
                    <p className="text-sm text-gray-500 line-clamp-2 mt-1">{location.description}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> {location.address}
                      </span>
                      {location.capacity && (
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" /> Capacity: {location.capacity}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* Transport Tab */}
          <TabsContent value="transport">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-semibold">Available Transport</h2>
              <Button size="sm" onClick={() => setShowOfferRide(true)} className="bg-teal-600 hover:bg-teal-700">
                <Plus className="w-4 h-4 mr-1" /> Offer Ride
              </Button>
            </div>

            <div className="space-y-4">
              {activeTransports.map(transport => {
                const isBooked = hasBookedSeat(transport);
                const isOwner = transport.organizer_id === user?.id;
                const eventInfo = events.find(e => e.id === transport.event_id);
                
                return (
                  <div key={transport.id} className="bg-white dark:bg-gray-900 rounded-xl border p-4">
                    <div className="flex items-start gap-4">
                      <div className={cn(
                        "w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0",
                        transport.type === 'carpool' ? "bg-blue-100 text-blue-600" : "bg-purple-100 text-purple-600"
                      )}>
                        {transport.type === 'carpool' ? <Car className="w-6 h-6" /> : <Bus className="w-6 h-6" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h3 className="font-semibold">{transport.organizer_name}</h3>
                            {eventInfo && (
                              <p className="text-xs text-teal-600 font-medium">{eventInfo.title}</p>
                            )}
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <Badge className={transport.available_seats > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>
                              {transport.available_seats}/{transport.total_seats} seats
                            </Badge>
                            {!transport.is_free && (
                              <Badge className="bg-orange-100 text-orange-700">
                                <DollarSign className="w-3 h-3 mr-0.5" />
                                {transport.price_per_seat?.toLocaleString()} RWF
                              </Badge>
                            )}
                            {transport.is_free && (
                              <Badge className="bg-green-100 text-green-700">Free</Badge>
                            )}
                          </div>
                        </div>
                        
                        <div className="mt-2 space-y-1 text-sm text-gray-500">
                          <p className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" /> 
                            {transport.departure_location}
                            {transport.destination && ` → ${transport.destination}`}
                          </p>
                          <p className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {moment(transport.departure_time).format('ddd, MMM D • h:mm A')}
                          </p>
                          {transport.contact_phone && (
                            <p className="flex items-center gap-1">
                              <Phone className="w-3 h-3" /> {transport.contact_phone}
                            </p>
                          )}
                        </div>

                        {transport.notes && (
                          <p className="text-xs text-gray-400 mt-2 italic">{transport.notes}</p>
                        )}

                        {/* Passengers */}
                        {transport.passengers?.length > 0 && (
                          <div className="mt-3 pt-3 border-t">
                            <p className="text-xs text-gray-500 mb-1">Passengers ({transport.passengers.length})</p>
                            <div className="flex flex-wrap gap-1">
                              {transport.passengers.map((p, idx) => (
                                <Badge key={idx} variant="secondary" className="text-xs">
                                  {p.name}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {!isOwner && transport.available_seats > 0 && !isBooked && (
                      <Button 
                        className="w-full mt-4 bg-teal-600 hover:bg-teal-700" 
                        onClick={() => handleBookSeat(transport)}
                        disabled={bookingId === transport.id}
                      >
                        {bookingId === transport.id ? (
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        ) : null}
                        Book Seat {!transport.is_free && `• ${transport.price_per_seat?.toLocaleString()} RWF`}
                      </Button>
                    )}
                    
                    {isBooked && (
                      <div className="w-full mt-4 p-3 bg-green-50 rounded-lg flex items-center justify-center gap-2 text-green-700">
                        <Check className="w-4 h-4" />
                        <span className="font-medium">You have booked a seat</span>
                      </div>
                    )}
                    
                    {isOwner && (
                      <div className="w-full mt-4 p-3 bg-blue-50 rounded-lg text-center text-blue-700 text-sm">
                        This is your ride offer
                      </div>
                    )}
                  </div>
                );
              })}

              {activeTransports.length === 0 && (
                <div className="text-center py-12">
                  <Car className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                  <h3 className="font-semibold">No transport available</h3>
                  <p className="text-gray-500 mb-4">Be the first to offer a ride!</p>
                  <Button onClick={() => setShowOfferRide(true)} className="bg-teal-600 hover:bg-teal-700">
                    <Plus className="w-4 h-4 mr-2" /> Offer Ride
                  </Button>
                </div>
              )}
            </div>

            <OfferRideDialog
              open={showOfferRide}
              onClose={() => setShowOfferRide(false)}
              events={upcomingEvents}
              user={user}
              onSuccess={() => queryClient.invalidateQueries(['transport-groups'])}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}