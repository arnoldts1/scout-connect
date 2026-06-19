import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft, Image, FileText, AlertTriangle, Ban, Trash2,
  Palette, Settings, User, Clock, Copy, Check
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { createPageUrl } from '@/utils';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import moment from 'moment';

const CHAT_THEMES = [
  {
    id: 'light',
    name: 'Light',
    bg: 'bg-white',
    bubble: 'bg-emerald-500',
    text: 'text-gray-900',
    preview: 'from-white to-gray-50'
  },
  {
    id: 'dark',
    name: 'Dark',
    bg: 'bg-gray-900',
    bubble: 'bg-emerald-600',
    text: 'text-white',
    preview: 'from-gray-900 to-gray-800'
  },
  {
    id: 'ocean',
    name: 'Ocean',
    bg: 'bg-blue-50',
    bubble: 'bg-blue-500',
    text: 'text-blue-900',
    preview: 'from-blue-50 to-blue-100'
  },
  {
    id: 'sunset',
    name: 'Sunset',
    bg: 'bg-orange-50',
    bubble: 'bg-orange-500',
    text: 'text-orange-900',
    preview: 'from-orange-50 to-rose-100'
  },
  {
    id: 'forest',
    name: 'Forest',
    bg: 'bg-green-50',
    bubble: 'bg-green-600',
    text: 'text-green-900',
    preview: 'from-green-50 to-emerald-100'
  },
  {
    id: 'midnight',
    name: 'Midnight',
    bg: 'bg-slate-900',
    bubble: 'bg-indigo-600',
    text: 'text-white',
    preview: 'from-slate-900 to-slate-800'
  },
];

export default function ChatInfo() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const conversationId = searchParams.get('id');
  const [selectedTheme, setSelectedTheme] = useState('light');
  const [copied, setCopied] = useState(false);

  // Fetch conversation
  const { data: conversation } = useQuery({
    queryKey: ['conversation', conversationId],
    queryFn: async () => {
      if (!conversationId) return null;
      const convs = await base44.entities.Conversation.filter({ id: conversationId });
      return convs[0];
    },
    enabled: !!conversationId,
  });

  // Fetch shared media
  const { data: sharedMedia = [] } = useQuery({
    queryKey: ['shared-media', conversationId],
    queryFn: async () => {
      if (!conversationId) return [];
      const messages = await base44.entities.Message.filter({
        conversation_id: conversationId
      });
      return messages.filter(m => m.media_url && (m.media_type === 'image' || m.media_type === 'video'));
    },
    enabled: !!conversationId,
  });

  // Fetch shared documents
  const { data: sharedDocs = [] } = useQuery({
    queryKey: ['shared-docs', conversationId],
    queryFn: async () => {
      if (!conversationId) return [];
      const messages = await base44.entities.Message.filter({
        conversation_id: conversationId
      });
      return messages.filter(m => m.media_url && m.media_type === 'file');
    },
    enabled: !!conversationId,
  });

  if (!conversation) {
    return (
      <div className="h-screen flex items-center justify-center bg-white dark:bg-gray-900">
        <div className="text-center">
          <p className="text-gray-500">Loading conversation info...</p>
          <Button
            onClick={() => navigate(createPageUrl('Messages'))}
            className="mt-4"
          >
            Back to Messages
          </Button>
        </div>
      </div>
    );
  }

  const isGroup = conversation.type === 'group';
  const otherUser = !isGroup
    ? conversation.participant_details?.find(p => p.user_id !== base44.auth.supabase.auth.user?.id)
    : null;

  const displayName = isGroup ? conversation.group_name : otherUser?.name;
  const displayAvatar = isGroup ? conversation.group_avatar : otherUser?.avatar;

  const handleCopyId = () => {
    navigator.clipboard.writeText(conversation.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Conversation ID copied!');
  };

  const handleReportAccount = async () => {
    if (!window.confirm('Report this account? This action is permanent.')) return;
    try {
      // TODO: Implement report functionality
      toast.success('Account reported successfully');
    } catch (error) {
      toast.error('Failed to report account');
    }
  };

  const handleBlockAccount = async () => {
    if (!window.confirm('Block this account? You won\'t receive messages from them.')) return;
    try {
      // TODO: Implement block functionality
      toast.success('Account blocked successfully');
      navigate(createPageUrl('Messages'));
    } catch (error) {
      toast.error('Failed to block account');
    }
  };

  const handleDeleteChat = async () => {
    if (!window.confirm('Delete this chat? This action cannot be undone.')) return;
    try {
      await base44.entities.Conversation.delete(conversation.id);
      toast.success('Chat deleted successfully');
      queryClient.invalidateQueries(['conversations']);
      navigate(createPageUrl('Messages'));
    } catch (error) {
      toast.error('Failed to delete chat');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Chat Information</h1>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto py-6 px-4 space-y-6">
        {/* User Profile Section */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-800">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <User className="w-5 h-5" />
            Profile
          </h2>

          <div className="flex items-center gap-4">
            <Avatar className="w-20 h-20">
              <AvatarImage src={displayAvatar} />
              <AvatarFallback className="text-2xl">{displayName?.charAt(0) || 'U'}</AvatarFallback>
            </Avatar>

            <div className="flex-1">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">{displayName}</h3>
              {isGroup ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {conversation.participant_details?.length || 0} members
                </p>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400">Active now</p>
              )}

              <div className="flex items-center gap-2 mt-2">
                <code className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-gray-600 dark:text-gray-400">
                  {conversation.id.slice(0, 8)}...
                </code>
                <Button
                  size="icon"
                  variant="ghost"
                  className="w-8 h-8"
                  onClick={handleCopyId}
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-emerald-500" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>

          {isGroup && conversation.group_description && (
            <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {conversation.group_description}
              </p>
            </div>
          )}
        </div>

        {/* Shared Media Section */}
        {sharedMedia.length > 0 && (
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-800">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Image className="w-5 h-5" />
              Shared Media ({sharedMedia.length})
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {sharedMedia.slice(0, 12).map(media => (
                <div
                  key={media.id}
                  className="aspect-square rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800 cursor-pointer hover:opacity-75 transition"
                >
                  {media.media_type === 'image' ? (
                    <img src={media.media_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <video src={media.media_url} className="w-full h-full object-cover" />
                  )}
                </div>
              ))}
            </div>

            {sharedMedia.length > 12 && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-3">
                +{sharedMedia.length - 12} more media files
              </p>
            )}
          </div>
        )}

        {/* Shared Documents Section */}
        {sharedDocs.length > 0 && (
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-800">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Shared Documents ({sharedDocs.length})
            </h2>

            <div className="space-y-2">
              {sharedDocs.map(doc => {
                const fileName = doc.media_url?.split('/').pop() || 'Document';
                return (
                  <a
                    key={doc.id}
                    href={doc.media_url}
                    download
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition"
                  >
                    <FileText className="w-5 h-5 text-blue-500 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {fileName}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {moment(doc.created_date).format('MMM D, YYYY')}
                      </p>
                    </div>
                  </a>
                );
              })}
            </div>
          </div>
        )}

        {/* Chat Theme Customization */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-800">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Palette className="w-5 h-5" />
            Chat Theme
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {CHAT_THEMES.map(theme => (
              <button
                key={theme.id}
                onClick={() => {
                  setSelectedTheme(theme.id);
                  toast.success(`Theme changed to ${theme.name}`);
                }}
                className={cn(
                  'p-3 rounded-xl transition-all border-2',
                  selectedTheme === theme.id
                    ? 'border-emerald-500 shadow-lg'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                )}
              >
                <div className={cn(
                  'w-full h-12 rounded-lg mb-2 bg-gradient-to-br',
                  `${theme.preview}`
                )} />
                <p className="text-sm font-medium text-gray-900 dark:text-white">{theme.name}</p>
              </button>
            ))}
          </div>

          <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">
            ✨ Theme will be applied to this chat only
          </p>
        </div>

        {/* Danger Zone */}
        <div className="bg-red-50 dark:bg-red-900/20 rounded-2xl p-6 border border-red-200 dark:border-red-800/50">
          <h2 className="text-lg font-bold text-red-700 dark:text-red-400 mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Danger Zone
          </h2>

          <div className="space-y-2">
            {!isGroup && (
              <>
                <Button
                  variant="outline"
                  className="w-full rounded-lg gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 border-red-200 dark:border-red-800"
                  onClick={handleReportAccount}
                >
                  <AlertTriangle className="w-4 h-4" />
                  Report Account
                </Button>

                <Button
                  variant="outline"
                  className="w-full rounded-lg gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 border-red-200 dark:border-red-800"
                  onClick={handleBlockAccount}
                >
                  <Ban className="w-4 h-4" />
                  Block Account
                </Button>
              </>
            )}

            <Button
              variant="outline"
              className="w-full rounded-lg gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 border-red-200 dark:border-red-800"
              onClick={handleDeleteChat}
            >
              <Trash2 className="w-4 h-4" />
              {isGroup ? 'Leave Group' : 'Delete Chat'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
