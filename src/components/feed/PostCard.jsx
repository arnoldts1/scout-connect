import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Heart, MessageCircle, Send, Bookmark, MoreHorizontal, MapPin, Play, Pause, Users, Music, BadgeCheck, Volume2, VolumeX } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { toast } from 'sonner';
import MultiPhotoGrid from './MultiPhotoGrid';
import AvatarWithBadge from '@/components/ui/AvatarWithBadge';

// Helper function to format time properly (Kigali timezone - CAT/UTC+2)
const formatTimeAgo = (date) => {
  // Get current time in Kigali timezone
  const now = new Date();
  const past = new Date(date);
  const diffMs = now - past;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 5) return '1m';
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays < 7) return `${diffDays}d`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w`;
  return past.toLocaleDateString('en-RW', { timeZone: 'Africa/Kigali' });
};

export default function PostCard({ post, currentUser, onLike, onComment, authorVerified, author }) {
  const [liked, setLiked] = useState(post.likes?.includes(currentUser?.id));
  const [likesCount, setLikesCount] = useState(post.likes_count || 0);
  const [saved, setSaved] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [comment, setComment] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const videoRef = useRef(null);
  const audioRef = useRef(null);
  const postRef = useRef(null);

  const handleLike = async () => {
    const newLiked = !liked;
    const oldLiked = liked;
    const oldCount = likesCount;

    setLiked(newLiked);
    setLikesCount(prev => newLiked ? prev + 1 : prev - 1);

    try {
      const newLikes = newLiked
        ? [...(post.likes || []), currentUser?.id]
        : (post.likes || []).filter(id => id !== currentUser?.id);

      await base44.entities.Post.update(post.id, {
        likes: newLikes,
        likes_count: newLikes.length
      });

      // Notify post author if someone else liked
      if (newLiked && post.author_id !== currentUser?.id) {
        await base44.entities.Notification.create({
          user_id: post.author_id,
          type: 'like',
          message: `${currentUser?.full_name} liked your post`,
          actor_id: currentUser?.id,
          actor_name: currentUser?.full_name,
          actor_avatar: currentUser?.avatar,
          reference_id: post.id,
          reference_type: 'post',
          is_read: false
        });
      }
    } catch (error) {
      // Revert optimistic update on error
      setLiked(oldLiked);
      setLikesCount(oldCount);
      toast.error('Failed to update like');
    }
  };

  const handleDoubleClick = () => {
    if (!liked) {
      handleLike();
    }
  };

  const handleShare = async () => {
    const postUrl = `${window.location.origin}${createPageUrl(`Post?id=${post.id}`)}`;
    
    // Update share count
    await base44.entities.Post.update(post.id, {
      shares_count: (post.shares_count || 0) + 1
    });

    // Notify post author
    if (post.author_id !== currentUser?.id) {
      await base44.entities.Notification.create({
        user_id: post.author_id,
        type: 'share',
        message: `${currentUser?.full_name} shared your post`,
        actor_id: currentUser?.id,
        actor_name: currentUser?.full_name,
        actor_avatar: currentUser?.avatar,
        reference_id: post.id,
        reference_type: 'post',
        is_read: false
      });
    }
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Post by ${post.author_name}`,
          text: post.content || 'Check out this post!',
          url: postUrl,
        });
      } catch (error) {
        if (error.name !== 'AbortError') {
          copyToClipboard(postUrl);
        }
      }
    } else {
      copyToClipboard(postUrl);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Link copied to clipboard');
  };

  const toggleVideo = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  // Auto-play music when post is in view
  useEffect(() => {
    if (!post.music_url || !audioRef.current || !postRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            audioRef.current?.play()?.catch(() => {});
          } else {
            audioRef.current?.pause();
          }
        });
      },
      { threshold: 0.5 }
    );

    observer.observe(postRef.current);

    return () => {
      observer.disconnect();
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
    };
  }, [post.music_url]);

  // Handle mute
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.muted = isMuted;
    }
  }, [isMuted]);

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return;
    
    await base44.entities.Comment.create({
      post_id: post.id,
      author_id: currentUser?.id,
      author_name: currentUser?.full_name,
      author_avatar: currentUser?.avatar,
      content: comment,
      likes: []
    });
    
    await base44.entities.Post.update(post.id, {
      comments_count: (post.comments_count || 0) + 1
    });

    // Notify post author
    if (post.author_id !== currentUser?.id) {
      await base44.entities.Notification.create({
        user_id: post.author_id,
        type: 'comment',
        message: `${currentUser?.full_name} commented on your post`,
        actor_id: currentUser?.id,
        actor_name: currentUser?.full_name,
        actor_avatar: currentUser?.avatar,
        reference_id: post.id,
        reference_type: 'post',
        is_read: false
      });
    }
    
    setComment('');
    if (onComment) onComment();
  };

  return (
    <article ref={postRef} className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 md:rounded-2xl md:border md:mb-4 md:shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-3">
        <Link 
          to={createPageUrl(`Profile?id=${post.author_id}`)}
          className="flex items-center gap-3"
        >
          <AvatarWithBadge 
            user={author}
            src={post.author_avatar}
            fallbackText={post.author_name?.charAt(0) || 'S'}
            size="default"
            className="ring-2 ring-emerald-500/20"
          />
          <div>
            <div className="flex items-center gap-2">
              <p className="font-semibold text-sm text-gray-900 dark:text-white">
                {post.author_name || 'Scout'}
              </p>
              {(authorVerified || post.author_verified) && (
                <BadgeCheck className="w-4 h-4 text-blue-500 fill-blue-500" />
              )}
              {post.is_unit_post && (
                <Badge className="text-[10px] py-0 px-1.5 bg-emerald-100 text-emerald-700">
                  <Users className="w-2.5 h-2.5 mr-0.5" />
                  Work
                </Badge>
              )}
            </div>
            {post.location && (
              <p className="text-xs text-gray-500 flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {post.location}
              </p>
            )}
          </div>
        </Link>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full">
              <MoreHorizontal className="w-5 h-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {post.author_id === currentUser?.id && (
              <DropdownMenuItem 
                className="text-red-600"
                onClick={async () => {
                  if (confirm('Delete this post?')) {
                    await base44.entities.Post.delete(post.id);
                    window.location.reload();
                  }
                }}
              >
                Delete Post
              </DropdownMenuItem>
            )}
            <DropdownMenuItem>Report</DropdownMenuItem>
            <DropdownMenuItem>Copy link</DropdownMenuItem>
            <DropdownMenuItem>Share to...</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Hidden Audio Player */}
      {post.music_url && (
        <audio
          ref={audioRef}
          src={post.music_url}
          loop
          playsInline
        />
      )}

      {/* Media */}
      <div 
        className="relative bg-black cursor-pointer"
        onDoubleClick={handleDoubleClick}
      >
        {/* Mute Button */}
        {post.music_url && (
          <button
            onClick={() => setIsMuted(!isMuted)}
            className="absolute top-3 right-3 z-10 w-10 h-10 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-black/70 transition-colors"
          >
            {isMuted ? (
              <VolumeX className="w-5 h-5 text-white" />
            ) : (
              <Volume2 className="w-5 h-5 text-white" />
            )}
          </button>
        )}
        {post.media_type === 'video' ? (
          <div className="relative w-full aspect-square" onClick={toggleVideo}>
            <video
              ref={videoRef}
              src={post.media_urls?.[0]}
              className="w-full h-full object-cover"
              loop
              playsInline
            />
            <div className={cn(
              "absolute inset-0 flex items-center justify-center bg-black/20 transition-opacity",
              isPlaying ? "opacity-0 hover:opacity-100" : "opacity-100"
            )}>
              {isPlaying ? (
                <Pause className="w-16 h-16 text-white/80" />
              ) : (
                <Play className="w-16 h-16 text-white/80" />
              )}
            </div>
          </div>
        ) : post.media_urls?.length > 1 ? (
          <MultiPhotoGrid mediaUrls={post.media_urls} />
        ) : (
          <div className="aspect-square">
            <img
              src={post.media_urls?.[0] || 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=800'}
              alt={post.content}
              className="w-full h-full object-cover"
            />
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="p-3">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <button 
              onClick={handleLike}
              className="transition-transform active:scale-125"
            >
              <Heart 
                className={cn(
                  "w-7 h-7 transition-colors",
                  liked ? "fill-red-500 text-red-500" : "text-gray-700 dark:text-gray-200"
                )} 
              />
            </button>
            <button onClick={() => setShowComments(!showComments)}>
              <MessageCircle className="w-7 h-7 text-gray-700 dark:text-gray-200" />
            </button>
            <button onClick={handleShare}>
              <Send className="w-6 h-6 text-gray-700 dark:text-gray-200" />
            </button>
          </div>
          <button onClick={() => setSaved(!saved)}>
            <Bookmark 
              className={cn(
                "w-7 h-7 transition-colors",
                saved ? "fill-gray-900 dark:fill-white" : "text-gray-700 dark:text-gray-200"
              )} 
            />
          </button>
        </div>

        {/* Likes Count */}
        <p className="font-semibold text-sm mb-2">
          {likesCount.toLocaleString()} likes
        </p>

        {/* Caption */}
        <div className="text-sm mb-2">
          <Link 
            to={createPageUrl(`Profile?id=${post.author_id}`)}
            className="font-semibold mr-2"
          >
            {post.author_name}
          </Link>
          <span className="text-gray-700 dark:text-gray-300">{post.content}</span>
        </div>

        {/* Music */}
        {post.music_title && (
          <div className="flex items-center gap-2 mb-2">
            <Music className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {post.music_title} - {post.music_artist}
            </span>
          </div>
        )}

        {/* Hashtags */}
        {post.hashtags?.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {post.hashtags.map((tag, idx) => (
              <span key={idx} className="text-sm text-emerald-600 dark:text-emerald-400">
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Comments Preview */}
        {post.comments_count > 0 && (
          <button 
            onClick={() => setShowComments(!showComments)}
            className="text-sm text-gray-500 mb-2"
          >
            View all {post.comments_count} comments
          </button>
        )}

        {/* Timestamp */}
        <p className="text-xs text-gray-400 uppercase">
          {formatTimeAgo(post.created_date)}
        </p>

        {/* Comment Input */}
        <form onSubmit={handleSubmitComment} className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
          <AvatarWithBadge 
            user={currentUser}
            size="sm"
          />
          <input
            type="text"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Add a comment..."
            className="flex-1 bg-transparent text-sm focus:outline-none"
          />
          {comment.trim() && (
            <Button type="submit" variant="ghost" className="text-emerald-600 font-semibold text-sm">
              Post
            </Button>
          )}
        </form>
      </div>
    </article>
  );
}
