import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';
import {
  X, Settings, Users, LogOut, Crown, Shield, Trash2, UserPlus,
  Search, Check, Image as ImageIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export default function GroupChatInfo({ conversation, currentUser, onClose }) {
  const queryClient = useQueryClient();
  const [isEditingName, setIsEditingName] = useState(false);
  const [groupName, setGroupName] = useState(conversation.group_name || '');
  const [showAddMembers, setShowAddMembers] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const isAdmin = conversation.admins?.includes(currentUser?.id);
  const isOwner = conversation.created_by_id === currentUser?.id;

  const handleSaveGroupName = async () => {
    if (!groupName.trim() || !isAdmin) return;
    
    setIsSaving(true);
    try {
      await base44.entities.Conversation.update(conversation.id, {
        group_name: groupName.trim()
      });
      toast.success('Group name updated');
      setIsEditingName(false);
      queryClient.invalidateQueries(['conversations']);
      queryClient.invalidateQueries(['conversation', conversation.id]);
    } catch (error) {
      console.error('Error updating group name:', error);
      toast.error('Failed to update group name');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemoveMember = async (memberId) => {
    if (!isAdmin && memberId !== currentUser?.id) return;

    try {
      const updatedParticipants = (conversation.participants || []).filter(id => id !== memberId);
      const updatedDetails = (conversation.participant_details || []).filter(p => p.user_id !== memberId);

      await base44.entities.Conversation.update(conversation.id, {
        participants: updatedParticipants,
        participant_details: updatedDetails
      });

      toast.success(memberId === currentUser?.id ? 'You left the group' : 'Member removed');
      queryClient.invalidateQueries(['conversations']);
      queryClient.invalidateQueries(['conversation', conversation.id]);

      if (memberId === currentUser?.id) {
        onClose();
      }
    } catch (error) {
      console.error('Error removing member:', error);
      toast.error('Failed to remove member');
    }
  };

  const handlePromoteToAdmin = async (memberId) => {
    if (!isOwner) return;

    try {
      const admins = conversation.admins || [];
      const updatedAdmins = admins.includes(memberId)
        ? admins.filter(id => id !== memberId)
        : [...admins, memberId];

      await base44.entities.Conversation.update(conversation.id, {
        admins: updatedAdmins
      });

      toast.success('Member role updated');
      queryClient.invalidateQueries(['conversation', conversation.id]);
    } catch (error) {
      console.error('Error updating member role:', error);
      toast.error('Failed to update member role');
    }
  };

  const handleDeleteGroup = async () => {
    if (!isOwner) return;

    if (!window.confirm('Are you sure you want to delete this group? This action cannot be undone.')) {
      return;
    }

    try {
      await base44.entities.Conversation.delete(conversation.id);
      toast.success('Group deleted');
      queryClient.invalidateQueries(['conversations']);
      onClose();
    } catch (error) {
      console.error('Error deleting group:', error);
      toast.error('Failed to delete group');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end md:items-center md:justify-end">
      <div className="bg-white dark:bg-gray-900 w-full md:w-96 h-[90vh] md:h-auto md:rounded-lg md:shadow-xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="border-b border-gray-200 dark:border-gray-800 p-4 flex items-center justify-between sticky top-0 bg-white dark:bg-gray-900">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Group Info</h2>
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full"
            onClick={onClose}
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto space-y-6 p-4">
          {/* Group Avatar & Name */}
          <div className="text-center space-y-3">
            <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white text-3xl font-bold">
              {conversation.group_name?.charAt(0) || 'G'}
            </div>

            {isEditingName ? (
              <div className="space-y-2">
                <Input
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  className="text-center"
                  placeholder="Group name"
                />
                <div className="flex gap-2">
                  <Button
                    onClick={() => setIsEditingName(false)}
                    variant="outline"
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSaveGroupName}
                    disabled={isSaving || !groupName.trim()}
                    className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white"
                  >
                    Save
                  </Button>
                </div>
              </div>
            ) : (
              <div
                className={cn(
                  'space-y-1',
                  isAdmin && 'cursor-pointer'
                )}
                onClick={() => isAdmin && setIsEditingName(true)}
              >
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  {conversation.group_name || 'Group Chat'}
                </h3>
                {isAdmin && (
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Click to edit
                  </p>
                )}
              </div>
            )}

            {conversation.group_description && (
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {conversation.group_description}
              </p>
            )}
          </div>

          {/* Members section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Users className="w-4 h-4" />
                Members ({conversation.participants?.length || 0})
              </h4>
              {isAdmin && (
                <Button
                  size="icon"
                  variant="ghost"
                  className="rounded-full h-8 w-8"
                  onClick={() => setShowAddMembers(!showAddMembers)}
                >
                  <UserPlus className="w-4 h-4" />
                </Button>
              )}
            </div>

            <div className="space-y-2">
              {(conversation.participant_details || []).map(member => {
                const isCurrentUser = member.user_id === currentUser?.id;
                const isMemberAdmin = conversation.admins?.includes(member.user_id);

                return (
                  <div
                    key={member.user_id}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                  >
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={member.avatar} />
                      <AvatarFallback>{member.name?.charAt(0)}</AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 dark:text-white truncate">
                        {member.name}
                        {isCurrentUser && ' (You)'}
                      </p>
                      {isMemberAdmin && (
                        <Badge className="mt-1 bg-emerald-500 text-white text-xs">
                          Admin
                        </Badge>
                      )}
                    </div>

                    {/* Member actions */}
                    {isAdmin && !isCurrentUser && (
                      <div className="flex items-center gap-1">
                        {isOwner && (
                          <Button
                            size="icon"
                            variant="ghost"
                            className="rounded-full h-8 w-8"
                            onClick={() => handlePromoteToAdmin(member.user_id)}
                            title={isMemberAdmin ? 'Remove admin' : 'Make admin'}
                          >
                            {isMemberAdmin ? (
                              <Crown className="w-4 h-4 text-yellow-500" />
                            ) : (
                              <Shield className="w-4 h-4 text-gray-400" />
                            )}
                          </Button>
                        )}
                        <Button
                          size="icon"
                          variant="ghost"
                          className="rounded-full h-8 w-8"
                          onClick={() => handleRemoveMember(member.user_id)}
                        >
                          <X className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-2 border-t border-gray-200 dark:border-gray-800 pt-4">
            {isAdmin && (
              <Button
                variant="outline"
                className="w-full rounded-lg gap-2"
                onClick={() => setShowAddMembers(!showAddMembers)}
              >
                <UserPlus className="w-4 h-4" />
                Add Members
              </Button>
            )}

            {isOwner && (
              <Button
                variant="outline"
                className="w-full rounded-lg gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 border-red-200 dark:border-red-800"
                onClick={handleDeleteGroup}
              >
                <Trash2 className="w-4 h-4" />
                Delete Group
              </Button>
            )}

            <Button
              variant="outline"
              className="w-full rounded-lg gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 border-red-200 dark:border-red-800"
              onClick={() => handleRemoveMember(currentUser?.id)}
            >
              <LogOut className="w-4 h-4" />
              Leave Group
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
