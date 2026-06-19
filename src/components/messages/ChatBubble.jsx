import React, { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Check, CheckCheck, MoreHorizontal, Reply, Trash2, Forward, Smile } from 'lucide-react';
import AvatarWithBadge from '@/components/ui/AvatarWithBadge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import moment from 'moment';

const EMOJI_REACTIONS = ['❤️', '😂', '😮', '😢', '😡', '👍'];

export default function ChatBubble({ 
  message, 
  isOwn, 
  showAvatar = true,
  sender,
  onReply,
  onDelete,
  onReact 
}) {
  const [showActions, setShowActions] = useState(false);

  const renderMedia = () => {
    if (message.media_type === 'image' && message.media_url) {
      return (
        <img 
          src={message.media_url} 
          alt="Shared image" 
          className="max-w-xs rounded-lg mb-2"
        />
      );
    }
    if (message.media_type === 'video' && message.media_url) {
      return (
        <video 
          src={message.media_url} 
          controls 
          className="max-w-xs rounded-lg mb-2"
        />
      );
    }
    if (message.media_type === 'voice' && message.media_url) {
      return (
        <audio src={message.media_url} controls className="mb-2" />
      );
    }
    return null;
  };

  return (
    <div 
      className={cn(
        "group flex items-end gap-2 mb-1",
        isOwn ? "flex-row-reverse" : "flex-row"
      )}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Avatar */}
      {!isOwn && showAvatar && (
        <AvatarWithBadge 
          user={sender}
          src={message.sender_avatar}
          fallbackText={message.sender_name?.charAt(0) || 'S'}
          size="sm"
          className="flex-shrink-0"
        />
      )}
      {!isOwn && !showAvatar && <div className="w-8" />}

      {/* Message Bubble */}
      <div className={cn(
        "relative max-w-[70%] rounded-2xl px-4 py-2",
        isOwn 
          ? "bg-emerald-600 text-white rounded-br-md" 
          : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-bl-md"
      )}>
        {/* Reply Preview */}
        {message.reply_preview && (
          <div className={cn(
            "text-xs mb-2 pb-2 border-b opacity-70",
            isOwn ? "border-white/30" : "border-gray-300 dark:border-gray-600"
          )}>
            <Reply className="w-3 h-3 inline mr-1" />
            {message.reply_preview}
          </div>
        )}

        {/* Sender Name (for groups) */}
        {!isOwn && showAvatar && (
          <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400 mb-1">
            {message.sender_name}
          </p>
        )}

        {/* Media */}
        {renderMedia()}

        {/* Content */}
        {message.content && (
          <p className="text-sm break-words">{message.content}</p>
        )}

        {/* Time & Status */}
        <div className={cn(
          "flex items-center gap-1 mt-1",
          isOwn ? "justify-end" : "justify-start"
        )}>
          <span className={cn(
            "text-[10px]",
            isOwn ? "text-white/70" : "text-gray-400"
          )}>
            {moment(message.created_date).format('HH:mm')}
          </span>
          {isOwn && (
            message.read_by?.length > 1 ? (
              <CheckCheck className="w-3 h-3 text-white/70" />
            ) : (
              <Check className="w-3 h-3 text-white/70" />
            )
          )}
        </div>

        {/* Reactions */}
        {message.reactions?.length > 0 && (
          <div className={cn(
            "absolute -bottom-2 flex gap-0.5 bg-white dark:bg-gray-900 rounded-full px-1.5 py-0.5 shadow-sm border border-gray-100 dark:border-gray-700",
            isOwn ? "right-2" : "left-2"
          )}>
            {message.reactions.slice(0, 3).map((reaction, idx) => (
              <span key={idx} className="text-xs">{reaction.emoji}</span>
            ))}
            {message.reactions.length > 3 && (
              <span className="text-[10px] text-gray-500">+{message.reactions.length - 3}</span>
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className={cn(
        "flex items-center gap-1 transition-opacity",
        showActions ? "opacity-100" : "opacity-0"
      )}>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="w-7 h-7 rounded-full">
              <Smile className="w-4 h-4 text-gray-400" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-2">
            <div className="flex gap-1">
              {EMOJI_REACTIONS.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => onReact?.(emoji)}
                  className="text-xl hover:scale-125 transition-transform p-1"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="w-7 h-7 rounded-full">
              <MoreHorizontal className="w-4 h-4 text-gray-400" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align={isOwn ? "end" : "start"}>
            <DropdownMenuItem onClick={() => onReply?.(message)}>
              <Reply className="w-4 h-4 mr-2" />
              Reply
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Forward className="w-4 h-4 mr-2" />
              Forward
            </DropdownMenuItem>
            {isOwn && (
              <DropdownMenuItem 
                onClick={() => onDelete?.(message.id)}
                className="text-red-600"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}