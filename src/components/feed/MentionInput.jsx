import React, { useState, useRef, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

export default function MentionInput({ value, onChange, placeholder, className }) {
  const [users, setUsers] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [mentionStart, setMentionStart] = useState(-1);
  const textareaRef = useRef(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const allUsers = await base44.entities.User.list();
        setUsers(allUsers);
      } catch (error) {
        console.error('Failed to load users for mentions:', error);
        setUsers([]); // Continue with empty users list
      }
    };
    fetchUsers();
  }, []);

  const handleInputChange = (e) => {
    const text = e.target.value;
    onChange(text);

    const cursorPos = e.target.selectionStart;
    const textBeforeCursor = text.slice(0, cursorPos);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');

    if (lastAtIndex !== -1) {
      const textAfterAt = textBeforeCursor.slice(lastAtIndex + 1);
      // Check if there's a space after @ (means mention ended)
      if (!textAfterAt.includes(' ') && textAfterAt.length >= 0) {
        setMentionStart(lastAtIndex);
        const searchTerm = textAfterAt.toLowerCase();
        const filtered = users.filter(user =>
          (user.full_name || '').toLowerCase().includes(searchTerm) ||
          (user.email || '').toLowerCase().includes(searchTerm)
        ).slice(0, 5);
        setFilteredUsers(filtered);
        setShowSuggestions(filtered.length > 0);
        setSelectedIndex(0);
      } else {
        setShowSuggestions(false);
      }
    } else {
      setShowSuggestions(false);
    }
  };

  const handleKeyDown = (e) => {
    if (!showSuggestions) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % filteredUsers.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredUsers.length) % filteredUsers.length);
    } else if (e.key === 'Enter' && filteredUsers.length > 0) {
      e.preventDefault();
      selectUser(filteredUsers[selectedIndex]);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  const selectUser = (selectedUser) => {
    if (mentionStart === -1) return;

    const beforeMention = value.slice(0, mentionStart);
    const afterMention = value.slice(textareaRef.current.selectionStart);
    const newValue = `${beforeMention}@${selectedUser.full_name} ${afterMention}`;
    
    onChange(newValue, selectedUser); // pass mentioned user back to parent
    setShowSuggestions(false);
    setMentionStart(-1);

    // Set cursor position after the mention
    setTimeout(() => {
      const newCursorPos = mentionStart + selectedUser.full_name.length + 2;
      textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
      textareaRef.current.focus();
    }, 0);
  };

  return (
    <div className="relative">
      <Textarea
        ref={textareaRef}
        value={value}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={cn("min-h-[80px] resize-none", className)}
      />

      {showSuggestions && (
        <div className="absolute bottom-full left-0 mb-2 w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 max-h-48 overflow-y-auto z-50">
          {filteredUsers.map((user, index) => (
            <button
              key={user.id}
              onClick={() => selectUser(user)}
              className={cn(
                "w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-3 transition-colors",
                index === selectedIndex && "bg-gray-100 dark:bg-gray-700"
              )}
            >
              {user.avatar ? (
                <img 
                  src={user.avatar} 
                  alt={user.full_name}
                  className="w-8 h-8 rounded-full"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center">
                  <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                    {user.full_name?.charAt(0) || '?'}
                  </span>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{user.full_name}</p>
                <p className="text-xs text-gray-500 truncate">{user.email}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
