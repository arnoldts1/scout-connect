import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Heart, MessageCircle, Send, Bookmark, 
  MoreHorizontal, MapPin, Play, Pause, X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { createPageUrl } from '@/utils';
import { cn } from '@/lib/utils';
import moment from 'moment';

export default function Post() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [comment, setComment] = useState('');
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = React.useRef(null);

  const urlParams = new URLSearchParams(window.location.search);
  const postId = urlParams.get('id');

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (error) {
        console.log('Not authenticated');
      }
    };
    fetchUser();
  }, []);

  const { data: post } = useQuery({
    queryKey: ['post', postId],
    queryFn: async () => {
      if (!postId) return null;
      const posts = await base44.entities.Post.filter({ id: postId });
      return posts[0];
    },
    enabled: !!postId,
  });

  const { data: comments = [] } = useQuery({
    queryKey: ['post-comments', postId],
    queryFn: async () => {
      if (!postId) return [];
      return await base44.entities.Comment.filter({ post_id: postId }, 'created_date', 100);
    },
    enabled: !!postId,
  });

  useEffect(() => {
    if (post && user) {
      setLiked(post.likes?.includes(user.id));
    }
  }, [post, user]);

  const handleLike = async () => {
    if (!post || !user) return;

    const newLiked = !liked;
    setLiked(newLiked);

    const newLikes = newLiked 
      ? [...(post.likes || []), user.id]
      : (post.likes || []).filter(id => id !== user.id);
    
    await base44.entities.Post.update(post.id, { 
      likes: newLikes,
      likes_count: newLikes.length 
    });

    queryClient.invalidateQueries(['post', postId]);
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!comment.trim() || !post || !user) return;

    await base44.entities.Comment.create({
      post_id: post.id,
      author_id: user.id,
      author_name: user.full_name,
      author_avatar: user.avatar,
      content: comment.trim(),
      likes: []
    });

    await base44.entities.Post.update(post.id, {
      comments_count: (post.comments_count || 0) + 1
    });

    setComment('');
    queryClient.invalidateQueries(['post-comments', postId]);
    queryClient.invalidateQueries(['post', postId]);
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

  if (!post) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="sticky top-14 z-10 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center justify-between px-4 py-3">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => navigate(-1)}
            className="rounded-full"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="font-semibold">Post</h1>
          <div className="w-10" />
        </div>
      </div>

      {/* Post Content */}
      <div className="max-w-2xl mx-auto">
        {/* Author */}
        <div className="flex items-center justify-between p-4">
          <Link 
            to={createPageUrl(`Profile?id=${post.author_id}`)}
            className="flex items-center gap-3"
          >
            <Avatar className="w-10 h-10">
              <AvatarImage src={post.author_avatar} />
              <AvatarFallback className="bg-emerald-100 text-emerald-700">
                {post.author_name?.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold text-sm">{post.author_name}</p>
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
              <DropdownMenuItem>Report</DropdownMenuItem>
              <DropdownMenuItem>Copy link</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Media */}
        <div 
          className="relative bg-black aspect-square"
          onDoubleClick={handleLike}
        >
          {post.media_type === 'video' ? (
            <div className="relative w-full h-full" onClick={toggleVideo}>
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
          ) : (
            <img
              src={post.media_urls?.[0] || 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=800'}
              alt={post.content}
              className="w-full h-full object-cover"
            />
          )}
        </div>

        {/* Actions */}
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-4">
              <button onClick={handleLike}>
                <Heart 
                  className={cn(
                    "w-7 h-7 transition-colors",
                    liked ? "fill-red-500 text-red-500" : ""
                  )} 
                />
              </button>
              <button>
                <MessageCircle className="w-7 h-7" />
              </button>
              <button>
                <Send className="w-6 h-6" />
              </button>
            </div>
            <button onClick={() => setSaved(!saved)}>
              <Bookmark className={cn("w-7 h-7", saved && "fill-current")} />
            </button>
          </div>

          <p className="font-semibold text-sm mb-2">
            {(post.likes_count || 0).toLocaleString()} likes
          </p>

          {/* Caption */}
          <div className="text-sm mb-2">
            <Link to={createPageUrl(`Profile?id=${post.author_id}`)} className="font-semibold mr-2">
              {post.author_name}
            </Link>
            <span className="text-gray-700 dark:text-gray-300">{post.content}</span>
          </div>

          {/* Hashtags */}
          {post.hashtags?.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2">
              {post.hashtags.map((tag, idx) => (
                <span key={idx} className="text-sm text-emerald-600">#{tag}</span>
              ))}
            </div>
          )}

          <p className="text-xs text-gray-400 uppercase mb-4">
            {moment(post.created_date).format('MMMM D, YYYY')}
          </p>
        </div>

        {/* Comments */}
        <div className="border-t border-gray-100 dark:border-gray-800">
          <div className="p-4 space-y-4">
            {comments.map((c) => (
              <div key={c.id} className="flex gap-3">
                <Link to={createPageUrl(`Profile?id=${c.author_id}`)}>
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={c.author_avatar} />
                    <AvatarFallback className="text-xs bg-gray-100">
                      {c.author_name?.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                </Link>
                <div className="flex-1">
                  <p className="text-sm">
                    <Link to={createPageUrl(`Profile?id=${c.author_id}`)} className="font-semibold mr-2">
                      {c.author_name}
                    </Link>
                    {c.content}
                  </p>
                  <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                    <span>{moment(c.created_date).fromNow()}</span>
                    <button>Reply</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Comment Input - Fixed bottom */}
      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 p-4 md:max-w-2xl md:mx-auto">
        <form onSubmit={handleComment} className="flex items-center gap-3">
          <Avatar className="w-8 h-8">
            <AvatarImage src={user?.avatar} />
            <AvatarFallback className="text-xs">{user?.full_name?.charAt(0)}</AvatarFallback>
          </Avatar>
          <Input
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Add a comment..."
            className="flex-1 border-0 bg-transparent focus-visible:ring-0"
          />
          {comment.trim() && (
            <Button type="submit" variant="ghost" className="text-emerald-600 font-semibold">
              Post
            </Button>
          )}
        </form>
      </div>
    </div>
  );
}