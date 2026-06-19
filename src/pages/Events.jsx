import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Calendar as CalendarIcon, Plus, MapPin, Clock, Users, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { createPageUrl } from '@/utils';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import moment from 'moment';
import { generateGoogleCalendarUrl } from '@/lib/googleCalendarHelper';

const EVENT_TYPES = {
  camping: { label: 'Camping', color: 'bg-green-100 text-green-700' },
  hike: { label: 'Hike', color: 'bg-blue-100 text-blue-700' },
  service: { label: 'Service', color: 'bg-purple-100 text-purple-700' },
  training: { label: 'Training', color: 'bg-orange-100 text-orange-700' },
  ceremony: { label: 'Ceremony', color: 'bg-amber-100 text-amber-700' },
  meeting: { label: 'Meeting', color: 'bg-gray-100 text-gray-700' },
  other: { label: 'Other', color: 'bg-pink-100 text-pink-700' }
};

export default function Events() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    location: '',
    event_type: 'meeting',
    start_date: '',
    end_date: '',
    max_participants: ''
  });

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (error) {
        navigate(createPageUrl('Home'));
      }
    };
    fetchUser();
  }, []);

  const { data: events = [], isLoading } = useQuery({
    queryKey: ['all-events'],
    queryFn: () => base44.entities.Event.filter({ status: 'approved' }, 'start_date', 100),
  });

  const { data: pendingEvents = [] } = useQuery({
    queryKey: ['pending-events'],
    queryFn: () => base44.entities.Event.filter({ status: 'pending' }, 'start_date', 50),
    enabled: user?.role === 'admin',
  });

  const currentMonth = moment(selectedDate);
  const daysInMonth = currentMonth.daysInMonth();
  const firstDayOfMonth = currentMonth.clone().startOf('month').day();
  
  const calendarDays = [];
  for (let i = 0; i < firstDayOfMonth; i++) {
    calendarDays.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    calendarDays.push(i);
  }

  const getEventsForDay = (day) => {
    if (!day) return [];
    const date = currentMonth.clone().date(day);
    return events.filter(event => {
      const eventDate = moment(event.start_date);
      return eventDate.isSame(date, 'day');
    });
  };

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    if (!user) return;
    
    setIsSubmitting(true);
    try {
      await base44.entities.Event.create({
        ...newEvent,
        organizer_id: user.id,
        organizer_name: user.full_name,
        participants: [user.id],
        participant_count: 1,
        status: 'pending',
        max_participants: newEvent.max_participants ? parseInt(newEvent.max_participants) : null
      });
      
      toast.success('Event submitted for approval');
      setShowCreateDialog(false);
      setNewEvent({
        title: '',
        description: '',
        location: '',
        event_type: 'meeting',
        start_date: '',
        end_date: '',
        max_participants: ''
      });
      queryClient.invalidateQueries(['all-events']);
    } catch (error) {
      toast.error('Failed to create event');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedDayEvents = getEventsForDay(selectedDate.getDate());
  const upcomingEvents = events.filter(e => moment(e.start_date).isAfter(moment()));
  const pastEvents = events.filter(e => moment(e.start_date).isBefore(moment())).sort((a, b) => moment(b.start_date).diff(moment(a.start_date)));

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Events</h1>
          <p className="text-gray-500 text-sm">Scout activities and gatherings</p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="bg-emerald-600 hover:bg-emerald-700 rounded-full">
              <Plus className="w-4 h-4 mr-2" />
              Add Event
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Event</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateEvent} className="space-y-4 mt-4">
              <div>
                <Label>Event Title *</Label>
                <Input
                  value={newEvent.title}
                  onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                  placeholder="Enter event title"
                  required
                />
              </div>
              <div>
                <Label>Event Type</Label>
                <Select value={newEvent.event_type} onValueChange={(v) => setNewEvent({ ...newEvent, event_type: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(EVENT_TYPES).map(([key, val]) => (
                      <SelectItem key={key} value={key}>{val.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Start Date *</Label>
                  <Input
                    type="datetime-local"
                    value={newEvent.start_date}
                    onChange={(e) => setNewEvent({ ...newEvent, start_date: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label>End Date</Label>
                  <Input
                    type="datetime-local"
                    value={newEvent.end_date}
                    onChange={(e) => setNewEvent({ ...newEvent, end_date: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <Label>Location</Label>
                <Input
                  value={newEvent.location}
                  onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
                  placeholder="Event location"
                />
              </div>
              <div>
                <Label>Max Participants</Label>
                <Input
                  type="number"
                  value={newEvent.max_participants}
                  onChange={(e) => setNewEvent({ ...newEvent, max_participants: e.target.value })}
                  placeholder="Leave empty for unlimited"
                />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea
                  value={newEvent.description}
                  onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                  placeholder="Event details..."
                  rows={3}
                />
              </div>
              <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Submit for Approval
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">{currentMonth.format('MMMM YYYY')}</h2>
            <div className="flex gap-2">
              <Button variant="ghost" size="icon" onClick={() => setSelectedDate(moment(selectedDate).subtract(1, 'month').toDate())}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => setSelectedDate(moment(selectedDate).add(1, 'month').toDate())}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
          
          <div className="grid grid-cols-7 gap-1 text-center text-sm mb-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="py-2 font-medium text-gray-500">{day}</div>
            ))}
          </div>
          
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day, idx) => {
              const dayEvents = getEventsForDay(day);
              const isToday = day && moment().isSame(currentMonth.clone().date(day), 'day');
              const isSelected = day === selectedDate.getDate() && currentMonth.isSame(moment(selectedDate), 'month');
              
              return (
                <button
                  key={idx}
                  onClick={() => day && setSelectedDate(currentMonth.clone().date(day).toDate())}
                  className={cn(
                    "aspect-square p-1 rounded-lg relative transition-colors",
                    day ? "hover:bg-gray-100 dark:hover:bg-gray-800" : "",
                    isToday && "ring-2 ring-emerald-500",
                    isSelected && "bg-emerald-100 dark:bg-emerald-900/30"
                  )}
                  disabled={!day}
                >
                  {day && (
                    <>
                      <span className={cn("text-sm", isToday && "font-bold text-emerald-600")}>{day}</span>
                      {dayEvents.length > 0 && (
                        <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
                          {dayEvents.slice(0, 3).map((_, i) => (
                            <div key={i} className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Upcoming Events */}
        <div className="space-y-4">
          <h3 className="font-semibold text-gray-900 dark:text-white">Upcoming Events</h3>
          {upcomingEvents.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <CalendarIcon className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p>No upcoming events</p>
            </div>
          ) : (
            upcomingEvents.slice(0, 5).map(event => (
              <div key={event.id} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-4">
                <div className="flex items-start gap-3">
                  <div 
                    onClick={() => navigate(createPageUrl(`Event?id=${event.id}`))}
                    className="w-12 h-12 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex flex-col items-center justify-center text-emerald-600 cursor-pointer hover:opacity-80 transition-opacity"
                  >
                    <span className="text-xs font-medium">{moment(event.start_date).format('MMM')}</span>
                    <span className="text-lg font-bold leading-none">{moment(event.start_date).format('D')}</span>
                  </div>
                  <div 
                    className="flex-1 min-w-0 cursor-pointer"
                    onClick={() => navigate(createPageUrl(`Event?id=${event.id}`))}
                  >
                    <h4 className="font-medium text-gray-900 dark:text-white truncate hover:text-emerald-600 transition-colors">{event.title}</h4>
                    <Badge className={cn("text-xs mt-1", EVENT_TYPES[event.event_type]?.color)}>
                      {EVENT_TYPES[event.event_type]?.label}
                    </Badge>
                    <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                      <Clock className="w-3 h-3" />
                      {moment(event.start_date).format('h:mm A')}
                    </div>
                    {event.location && (
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <MapPin className="w-3 h-3" />
                        {event.location}
                      </div>
                    )}
                  </div>
                  <Button
                    asChild
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 flex-shrink-0"
                  >
                    <a href={generateGoogleCalendarUrl(event)} target="_blank" rel="noopener noreferrer">
                      <CalendarIcon className="w-4 h-4" />
                    </a>
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Past Events */}
      {pastEvents.length > 0 && (
        <div className="mt-8">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-gray-400" />
            Past Events
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pastEvents.map(event => (
              <div
                key={event.id}
                onClick={() => navigate(createPageUrl(`Event?id=${event.id}`))}
                className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-4 opacity-70 hover:opacity-100 transition-opacity cursor-pointer"
              >
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-lg bg-gray-100 dark:bg-gray-800 flex flex-col items-center justify-center text-gray-500">
                    <span className="text-xs font-medium">{moment(event.start_date).format('MMM')}</span>
                    <span className="text-lg font-bold leading-none">{moment(event.start_date).format('D')}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-gray-900 dark:text-white truncate">{event.title}</h4>
                    <Badge className={cn("text-xs mt-1", EVENT_TYPES[event.event_type]?.color)}>
                      {EVENT_TYPES[event.event_type]?.label}
                    </Badge>
                    <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                      <Clock className="w-3 h-3" />
                      {moment(event.start_date).format('MMM D, YYYY · h:mm A')}
                    </div>
                    {event.location && (
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <MapPin className="w-3 h-3" />
                        {event.location}
                      </div>
                    )}
                    {event.participant_count > 0 && (
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Users className="w-3 h-3" />
                        {event.participant_count} attended
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}