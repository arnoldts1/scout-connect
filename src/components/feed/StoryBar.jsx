import React, { useState, useCallback, useMemo } from 'react';
import { Plus, X, ChevronLeft, ChevronRight, Loader2, Music } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';

// Helper function to format time properly
const formatTimeAgo = (date) => {
  const now = new Date();
  const past = new Date(date);
  const diffMs = now - past;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return past.toLocaleDateString();
};

// Check if story is within 24 hours
const isStoryValid = (story) => {
  const now = new Date();
  const createdDate = new Date(story.created_date);
  const diffMs = now - createdDate;
  const diffHours = diffMs / 3600000;
  return diffHours < 24;
};

const FILTERS = [
  { name: 'Normal', class: '' },
  { name: 'Vivid', class: 'saturate-150 contrast-110' },
  { name: 'Warm', class: 'sepia-[0.3] saturate-125' },
  { name: 'Cool', class: 'hue-rotate-[20deg] saturate-110' },
  { name: 'B&W', class: 'grayscale' },
  { name: 'Vintage', class: 'sepia-[0.5] contrast-90' },
];

export default function StoryBar({ user }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [viewingStory, setViewingStory] = useState(null);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [imageLoaded, setImageLoaded] = useState(false);
  
  const { data: stories = [], isLoading } = useQuery({
    queryKey: ['stories'],
    queryFn: () => base44.entities.Story.list('-created_date', 100),
    staleTime: 30000, // Keep data fresh for 30 seconds
  });

  // Filter stories to only show those within 24 hours and group by author
  const groupedStories = useMemo(() => {
    const validStories = stories.filter(isStoryValid);
    
    const storyGroups = validStories.reduce((acc, story) => {
      const authorId = story.author_id;
      if (!acc[authorId]) {
        acc[authorId] = {
          author_id: authorId,
          author_name: story.author_name,
          author_avatar: story.author_avatar,
          stories: []
        };
      }
      acc[authorId].stories.push(story);
      return acc;
    }, {});

    // Sort stories within each group by created_date (oldest first for viewing order)
    Object.values(storyGroups).forEach(group => {
      group.stories.sort((a, b) => new Date(a.created_date) - new Date(b.created_date));
    });

    // Sort groups by most recent story
    return Object.values(storyGroups).sort((a, b) => {
      const aLatest = new Date(a.stories[a.stories.length - 1]?.created_date || 0);
      const bLatest = new Date(b.stories[b.stories.length - 1]?.created_date || 0);
      return bLatest - aLatest;
    });
  }, [stories]);

  const openStoryViewer = useCallback((group, index = 0) => {
    setImageLoaded(false);
    setViewingStory(group);
    setCurrentStoryIndex(index);
    setProgress(0);
  }, []);

  const nextStory = useCallback(() => {
    if (!viewingStory) return;
    
    setImageLoaded(false);
    if (currentStoryIndex < viewingStory.stories.length - 1) {
      setCurrentStoryIndex(prev => prev + 1);
      setProgress(0);
    } else {
      // Move to next user's stories
      const currentGroupIndex = groupedStories.findIndex(g => g.author_id === viewingStory.author_id);
      if (currentGroupIndex < groupedStories.length - 1) {
        setViewingStory(groupedStories[currentGroupIndex + 1]);
        setCurrentStoryIndex(0);
        setProgress(0);
      } else {
        setViewingStory(null);
      }
    }
  }, [viewingStory, currentStoryIndex, groupedStories]);

  const prevStory = useCallback(() => {
    if (currentStoryIndex > 0) {
      setImageLoaded(false);
      setCurrentStoryIndex(prev => prev - 1);
      setProgress(0);
    }
  }, [currentStoryIndex]);

  // Progress timer - only runs when image is loaded
  React.useEffect(() => {
    if (!viewingStory || !imageLoaded) return;

    const timer = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          nextStory();
          return 0;
        }
        return prev + 2;
      });
    }, 100);

    return () => clearInterval(timer);
  }, [viewingStory, currentStoryIndex, imageLoaded, nextStory]);

  return (
    <>
      <div className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-3 py-3 px-4 overflow-x-auto scrollbar-hide">
          {/* Add Story Button */}
          <div className="flex flex-col items-center gap-1 flex-shrink-0 w-[70px]">
            <button
              className="relative w-[70px] h-[70px] flex-shrink-0"
              onClick={() => navigate(createPageUrl('CreateStory'))}
            >
              <div className="w-full h-full rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-emerald-500 transition-colors">
                <Plus className="w-6 h-6 text-gray-400" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full ring-2 ring-white dark:ring-gray-900 overflow-hidden">
                <Avatar className="w-full h-full">
                  <AvatarImage src={user?.avatar} />
                  <AvatarFallback className="text-xs bg-emerald-100 text-emerald-700">
                    {user?.full_name?.charAt(0) || 'S'}
                  </AvatarFallback>
                </Avatar>
              </div>
            </button>
            <span className="text-xs text-gray-500 dark:text-gray-400 w-full text-center truncate">Your story</span>
          </div>

          {/* Story Circles */}
          {groupedStories.map((group) => (
            <button
              key={group.author_id}
              onClick={() => openStoryViewer(group)}
              className="flex flex-col items-center gap-1 flex-shrink-0 w-[70px]"
            >
              <div className="p-[2px] rounded-full bg-gradient-to-br from-amber-400 via-orange-500 to-pink-500 w-[70px] h-[70px] flex items-center justify-center flex-shrink-0">
                <div className="rounded-full bg-white dark:bg-gray-900 p-[2px] w-full h-full">
                  <Avatar className="w-full h-full">
                    <AvatarImage src={group.author_avatar} className="rounded-full" />
                    <AvatarFallback className="bg-emerald-100 text-emerald-700 rounded-full">
                      {group.author_name?.charAt(0) || 'S'}
                    </AvatarFallback>
                  </Avatar>
                </div>
              </div>
              <span className="text-xs text-gray-700 dark:text-gray-300 w-full text-center truncate">
                {group.author_name?.split(' ')[0] || 'Scout'}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Story Viewer Modal */}
      <Dialog open={!!viewingStory} onOpenChange={() => setViewingStory(null)}>
        <DialogContent className="max-w-md w-full h-[90vh] p-0 bg-black rounded-2xl overflow-hidden">
          {viewingStory && viewingStory.stories[currentStoryIndex] && (
            <div className="relative w-full h-full">
              {/* Progress Bars */}
              <div className="absolute top-2 left-2 right-2 flex gap-1 z-20">
                {viewingStory.stories.map((_, idx) => (
                  <div key={idx} className="flex-1 h-0.5 bg-white/30 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-white transition-all duration-100"
                      style={{ 
                        width: idx < currentStoryIndex ? '100%' : 
                               idx === currentStoryIndex ? `${progress}%` : '0%' 
                      }}
                    />
                  </div>
                ))}
              </div>

              {/* Header */}
              <div className="absolute top-6 left-0 right-0 flex items-center justify-between px-4 z-20">
                <div className="flex items-center gap-3">
                  <Avatar className="w-10 h-10 ring-2 ring-white/50">
                    <AvatarImage src={viewingStory.author_avatar} />
                    <AvatarFallback>{viewingStory.author_name?.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-white font-medium text-sm">{viewingStory.author_name}</p>
                    <p className="text-white/70 text-xs">
                      {formatTimeAgo(viewingStory.stories[currentStoryIndex].created_date)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {viewingStory.author_id === user?.id && (
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="text-red-400 hover:bg-white/20"
                      onClick={async () => {
                        if (confirm('Delete this story?')) {
                          await base44.entities.Story.delete(viewingStory.stories[currentStoryIndex].id);
                          setViewingStory(null);
                          queryClient.invalidateQueries(['stories']);
                        }
                      }}
                    >
                      Delete
                    </Button>
                  )}
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="text-white hover:bg-white/20"
                    onClick={() => setViewingStory(null)}
                  >
                    <X className="w-6 h-6" />
                  </Button>
                </div>
              </div>

              {/* Loading Spinner */}
              {!imageLoaded && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-900 z-5">
                  <Loader2 className="w-10 h-10 text-white animate-spin" />
                </div>
              )}

              {/* Story Content */}
              <img
                src={viewingStory.stories[currentStoryIndex].media_url}
                alt="Story"
                className={cn(
                  "w-full h-full object-cover transition-opacity duration-200",
                  viewingStory.stories[currentStoryIndex].filter && FILTERS.find(f => f.name === viewingStory.stories[currentStoryIndex].filter)?.class,
                  imageLoaded ? "opacity-100" : "opacity-0"
                )}
                onLoad={() => setImageLoaded(true)}
              />

              {/* Text Overlay */}
              {viewingStory.stories[currentStoryIndex].text_overlay && (
                <div className={cn(
                  "absolute left-4 right-4 text-center z-10",
                  viewingStory.stories[currentStoryIndex].text_position === 'top' && "top-20",
                  viewingStory.stories[currentStoryIndex].text_position === 'center' && "top-1/2 -translate-y-1/2",
                  viewingStory.stories[currentStoryIndex].text_position === 'bottom' && "bottom-20"
                )}>
                  <p 
                    className="text-2xl font-bold drop-shadow-lg px-4 py-2"
                    style={{ color: viewingStory.stories[currentStoryIndex].text_color || '#ffffff' }}
                  >
                    {viewingStory.stories[currentStoryIndex].text_overlay}
                  </p>
                </div>
              )}

              {/* Music Badge */}
              {viewingStory.stories[currentStoryIndex].music_title && (
                <div className="absolute bottom-20 left-4 bg-black/50 rounded-full px-3 py-1.5 flex items-center gap-2 z-10">
                  <Music className="w-4 h-4 text-white" />
                  <span className="text-white text-sm">
                    {viewingStory.stories[currentStoryIndex].music_title} - {viewingStory.stories[currentStoryIndex].music_artist}
                  </span>
                </div>
              )}

              {/* Navigation Areas */}
              <div 
                className="absolute left-0 top-0 w-1/3 h-full cursor-pointer z-10"
                onClick={prevStory}
              />
              <div 
                className="absolute right-0 top-0 w-2/3 h-full cursor-pointer z-10"
                onClick={nextStory}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}