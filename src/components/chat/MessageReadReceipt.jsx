import React from 'react';
import { Check, CheckCheck } from 'lucide-react';

export default function MessageReadReceipt({ message, senderId }) {
  if (!message || message.sender_id !== senderId) {
    return null;
  }

  // Determine status
  const isRead = message.read_by?.some(id => id !== senderId);
  const isDelivered = message.delivered_to?.some(id => id !== senderId);

  if (isRead) {
    return (
      <div className="flex items-center gap-0.5" title="Seen">
        <CheckCheck className="w-3 h-3 text-emerald-500" />
      </div>
    );
  }

  if (isDelivered) {
    return (
      <div className="flex items-center gap-0.5" title="Delivered">
        <CheckCheck className="w-3 h-3 text-gray-400" />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-0.5" title="Sent">
      <Check className="w-3 h-3 text-gray-400" />
    </div>
  );
}
