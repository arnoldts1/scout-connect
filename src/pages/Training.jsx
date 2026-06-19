import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { 
  BookOpen, Award, Clock, Users, Star, Search, 
  Filter, Play, FileText, ChevronRight, Zap, Plus
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { createPageUrl } from '@/utils';
import { cn } from '@/lib/utils';

const CATEGORIES = [
  { id: 'all', label: 'All', icon: '📚' },
  { id: 'first_aid', label: 'First Aid', icon: '🏥' },
  { id: 'knots', label: 'Knots', icon: '🪢' },
  { id: 'leadership', label: 'Leadership', icon: '👑' },
  { id: 'survival', label: 'Survival', icon: '🏕️' },
  { id: 'mapping', label: 'Mapping', icon: '🗺️' },
  { id: 'camping', label: 'Camping', icon: '⛺' },
  { id: 'nature', label: 'Nature', icon: '🌿' },
];

const DIFFICULTY_COLORS = {
  beginner: 'bg-green-100 text-green-700',
  intermediate: 'bg-yellow-100 text-yellow-700',
  advanced: 'bg-red-100 text-red-700'
};

export default function Training() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');

  useEffect(() => {
    const fetchUser = async () => {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
    };
    fetchUser();
  }, []);

  // Only RSA leaders (admins or org leaders) can add courses
  const canAddCourses = user?.role === 'admin' || user?.is_org_leader;

  const { data: courses = [] } = useQuery({
    queryKey: ['courses'],
    queryFn: () => base44.entities.Course.filter({ status: 'published' }),
  });

  const { data: myProgress = [] } = useQuery({
    queryKey: ['my-progress', user?.id],
    queryFn: () => base44.entities.ScoutProgress.filter({ user_id: user?.id }),
    enabled: !!user?.id,
  });

  const progressMap = myProgress.reduce((acc, p) => {
    acc[p.course_id] = p;
    return acc;
  }, {});

  const filteredCourses = courses.filter(course => {
    const matchesSearch = (course.title || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === 'all' || course.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const inProgressCourses = filteredCourses.filter(c => 
    progressMap[c.id] && progressMap[c.id].status !== 'badge_earned'
  );
  const completedCourses = filteredCourses.filter(c => 
    progressMap[c.id]?.status === 'badge_earned'
  );
  const availableCourses = filteredCourses.filter(c => !progressMap[c.id]);

  const totalXP = myProgress.reduce((sum, p) => sum + (p.xp_earned || 0), 0);
  const level = Math.floor(totalXP / 500) + 1;
  const xpToNextLevel = (level * 500) - totalXP;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <BookOpen className="w-7 h-7" />
                Training Center
              </h1>
              <p className="text-blue-100 mt-1">Learn new skills and earn badges</p>
            </div>
            {canAddCourses && (
              <Button 
                onClick={() => navigate(createPageUrl('CreateCourse'))}
                className="bg-white text-blue-600 hover:bg-blue-50"
              >
                <Plus className="w-4 h-4 mr-2" /> Add Course
              </Button>
            )}
          </div>

          {/* XP Progress */}
          <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-yellow-400 flex items-center justify-center">
                  <Zap className="w-6 h-6 text-yellow-900" />
                </div>
                <div>
                  <p className="font-bold text-lg">Level {level}</p>
                  <p className="text-sm text-blue-100">{totalXP} XP total</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-blue-100">{xpToNextLevel} XP to next level</p>
              </div>
            </div>
            <Progress value={((totalXP % 500) / 500) * 100} className="h-2 bg-white/20" />
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mt-4">
            <div className="bg-white/10 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold">{completedCourses.length}</p>
              <p className="text-xs text-blue-100">Completed</p>
            </div>
            <div className="bg-white/10 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold">{inProgressCourses.length}</p>
              <p className="text-xs text-blue-100">In Progress</p>
            </div>
            <div className="bg-white/10 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold">{myProgress.filter(p => p.status === 'badge_earned').length}</p>
              <p className="text-xs text-blue-100">Badges</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search courses..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 rounded-full"
          />
        </div>

        {/* Categories */}
        <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide">
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-colors",
                activeCategory === cat.id
                  ? "bg-blue-600 text-white"
                  : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300"
              )}
            >
              <span>{cat.icon}</span>
              <span className="text-sm font-medium">{cat.label}</span>
            </button>
          ))}
        </div>

        {/* In Progress */}
        {inProgressCourses.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Play className="w-5 h-5 text-blue-600" />
              Continue Learning
            </h2>
            <div className="grid gap-4 md:grid-cols-2">
              {inProgressCourses.map(course => (
                <CourseCard 
                  key={course.id} 
                  course={course} 
                  progress={progressMap[course.id]} 
                />
              ))}
            </div>
          </div>
        )}

        {/* Available Courses */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-gray-600" />
            Available Courses ({availableCourses.length})
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {availableCourses.map(course => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        </div>

        {/* Completed */}
        {completedCourses.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Award className="w-5 h-5 text-green-600" />
              Completed ({completedCourses.length})
            </h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {completedCourses.map(course => (
                <CourseCard 
                  key={course.id} 
                  course={course} 
                  progress={progressMap[course.id]}
                  completed 
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function CourseCard({ course, progress, completed }) {
  return (
    <Link
      to={createPageUrl(`CourseDetail?id=${course.id}`)}
      className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 overflow-hidden hover:shadow-lg transition-all"
    >
      <div className="aspect-video bg-gray-100 dark:bg-gray-800 relative">
        {course.cover_image ? (
          <img src={course.cover_image} alt={course.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl">
            {CATEGORIES.find(c => c.id === course.category)?.icon || '📚'}
          </div>
        )}
        {completed && (
          <div className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded-full text-xs flex items-center gap-1">
            <Award className="w-3 h-3" /> Completed
          </div>
        )}
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-semibold text-gray-900 dark:text-white">{course.title}</h3>
          <Badge className={DIFFICULTY_COLORS[course.difficulty] || 'bg-gray-100'}>
            {course.difficulty}
          </Badge>
        </div>
        <p className="text-sm text-gray-500 line-clamp-2 mb-3">{course.description}</p>
        
        <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
          <span className="flex items-center gap-1">
            <FileText className="w-3 h-3" />
            {course.lessons_count} lessons
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {course.duration_minutes} min
          </span>
          <span className="flex items-center gap-1">
            <Zap className="w-3 h-3 text-yellow-500" />
            {course.xp_reward} XP
          </span>
        </div>

        {progress && (
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-gray-500">Progress</span>
              <span className="font-medium">{progress.progress_percent}%</span>
            </div>
            <Progress value={progress.progress_percent} className="h-2" />
          </div>
        )}
      </div>
    </Link>
  );
}
