import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Car, Bus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

export default function OfferRideDialog({ open, onClose, events, user, onSuccess }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    event_id: '',
    type: 'carpool',
    departure_location: '',
    departure_time: '',
    total_seats: 4,
    is_free: true,
    price_per_seat: 0,
    contact_phone: '',
    notes: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.event_id || !formData.departure_location || !formData.departure_time) {
      toast.error('Please fill required fields');
      return;
    }

    setIsSubmitting(true);
    try {
      await base44.entities.TransportGroup.create({
        ...formData,
        organizer_id: user.id,
        organizer_name: user.full_name,
        available_seats: formData.total_seats,
        passengers: [],
        status: 'open'
      });
      toast.success('Ride offer created!');
      onSuccess?.();
      onClose();
    } catch (error) {
      toast.error('Failed to create ride offer');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Offer a Ride</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Event (Destination) *</Label>
            <Select value={formData.event_id} onValueChange={(v) => setFormData({ ...formData, event_id: v })}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select event" />
              </SelectTrigger>
              <SelectContent>
                {events.map(event => (
                  <SelectItem key={event.id} value={event.id}>
                    <div className="flex flex-col">
                      <span>{event.title}</span>
                      <span className="text-xs text-gray-500">{event.location}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {formData.event_id && (
              <p className="text-xs text-teal-600 mt-1">
                📍 {events.find(e => e.id === formData.event_id)?.location || 'Event location'}
              </p>
            )}
          </div>

          <div>
            <Label>Vehicle Type</Label>
            <div className="flex gap-2 mt-1">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, type: 'carpool' })}
                className={`flex-1 p-3 rounded-lg border flex flex-col items-center gap-1 ${
                  formData.type === 'carpool' ? 'border-teal-500 bg-teal-50' : ''
                }`}
              >
                <Car className="w-5 h-5" />
                <span className="text-sm">Car</span>
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, type: 'bus' })}
                className={`flex-1 p-3 rounded-lg border flex flex-col items-center gap-1 ${
                  formData.type === 'bus' ? 'border-teal-500 bg-teal-50' : ''
                }`}
              >
                <Bus className="w-5 h-5" />
                <span className="text-sm">Bus</span>
              </button>
            </div>
          </div>

          <div>
            <Label>Departure Location *</Label>
            <Input
              value={formData.departure_location}
              onChange={(e) => setFormData({ ...formData, departure_location: e.target.value })}
              placeholder="Where will you pick up passengers?"
              className="mt-1"
            />
          </div>



          <div>
            <Label>Departure Time *</Label>
            <Input
              type="datetime-local"
              value={formData.departure_time}
              onChange={(e) => setFormData({ ...formData, departure_time: e.target.value })}
              className="mt-1"
            />
          </div>

          <div>
            <Label>Available Seats</Label>
            <Input
              type="number"
              min="1"
              value={formData.total_seats}
              onChange={(e) => setFormData({ ...formData, total_seats: parseInt(e.target.value) || 1 })}
              className="mt-1"
            />
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
            <div>
              <p className="font-medium">Free Ride</p>
              <p className="text-sm text-gray-500">No charge for passengers</p>
            </div>
            <Switch
              checked={formData.is_free}
              onCheckedChange={(checked) => setFormData({ ...formData, is_free: checked, price_per_seat: checked ? 0 : formData.price_per_seat })}
            />
          </div>

          {!formData.is_free && (
            <div>
              <Label>Price per Seat (RWF)</Label>
              <Input
                type="number"
                value={formData.price_per_seat}
                onChange={(e) => setFormData({ ...formData, price_per_seat: parseInt(e.target.value) || 0 })}
                placeholder="0"
                className="mt-1"
              />
            </div>
          )}

          <div>
            <Label>Contact Phone</Label>
            <Input
              value={formData.contact_phone}
              onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
              placeholder="Your phone number"
              className="mt-1"
            />
          </div>

          <div>
            <Label>Notes</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Any additional info..."
              rows={2}
              className="mt-1"
            />
          </div>

          <Button type="submit" className="w-full bg-teal-600 hover:bg-teal-700" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
            Create Ride Offer
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}