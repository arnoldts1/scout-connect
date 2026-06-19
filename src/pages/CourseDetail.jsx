import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, BookOpen, Play, FileText, Download, CheckCircle,
  Clock, Award, Zap, Lock, ChevronRight, Plus, Edit, Trash2,
  Activity, Upload, FileQuestion
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { createPageUrl } from '@/utils';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import LessonEditor from '@/components/course/LessonEditor';

export default function CourseDetail() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [activeLesson, setActiveLesson] = useState(null);
  const [showLessonEditor, setShowLessonEditor] = useState(false);
  const [editingLesson, setEditingLesson] = useState(null);
  const [completedTasks, setCompletedTasks] = useState({});

  const urlParams = new URLSearchParams(window.location.search);
  const courseId = urlParams.get('id');

  useEffect(() => {
    const fetchUser = async () => {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
    };
    fetchUser();
  }, []);

  const { data: course } = useQuery({
    queryKey: ['course', courseId],
    queryFn: async () => {
      const courses = await base44.entities.Course.filter({ id: courseId });
      return courses[0];
    },
    enabled: !!courseId,
  });

  const { data: lessons = [] } = useQuery({
    queryKey: ['lessons', courseId],
    queryFn: () => base44.entities.Lesson.filter({ course_id: courseId }, 'order'),
    enabled: !!courseId,
  });

  const { data: quizzes = [] } = useQuery({
    queryKey: ['quizzes', courseId],
    queryFn: () => base44.entities.Quiz.filter({ course_id: courseId }),
    enabled: !!courseId,
  });

  const { data: progress } = useQuery({
    queryKey: ['my-course-progress', courseId, user?.id],
    queryFn: async () => {
      const progs = await base44.entities.ScoutProgress.filter({ 
        course_id: courseId, 
        user_id: user?.id 
      });
      return progs[0];
    },
    enabled: !!courseId && !!user?.id,
  });

  const handleEnroll = async () => {
    await base44.entities.ScoutProgress.create({
      user_id: user.id,
      course_id: courseId,
      completed_lessons: [],
      quiz_scores: [],
      progress_percent: 0,
      xp_earned: 0,
      status: 'enrolled'
    });
    queryClient.invalidateQueries(['my-course-progress']);
    toast.success('Enrolled successfully!');
  };

  const handleCompleteTask = (lessonId, taskId) => {
    const key = `${lessonId}_${taskId}`;
    setCompletedTasks(prev => ({ ...prev, [key]: true }));
    toast.success('+5 XP earned!');
  };

  const isTaskCompleted = (lessonId, taskId) => {
    return completedTasks[`${lessonId}_${taskId}`];
  };

  const allTasksCompleted = (lesson) => {
    if (!lesson.tasks || lesson.tasks.length === 0) return true;
    return lesson.tasks.filter(t => t.required).every(t => isTaskCompleted(lesson.id, t.id));
  };

  const handleCompleteLesson = async (lessonId) => {
    if (!progress) return;
    
    const lesson = lessons.find(l => l.id === lessonId);
    if (lesson?.tasks?.length > 0 && !allTasksCompleted(lesson)) {
      toast.error('Complete all required tasks first');
      return;
    }
    
    const completedLessons = [...(progress.completed_lessons || [])];
    if (!completedLessons.includes(lessonId)) {
      completedLessons.push(lessonId);
    }
    
    const newProgress = lessons.length > 0 ? Math.round((completedLessons.length / lessons.length) * 100) : 0;
    const newXP = (progress.xp_earned || 0) + (lesson?.xp_reward || 20);
    
    await base44.entities.ScoutProgress.update(progress.id, {
      completed_lessons: completedLessons,
      progress_percent: newProgress,
      xp_earned: newXP,
      status: newProgress === 100 ? 'completed' : 'in_progress'
    });
    
    queryClient.invalidateQueries(['my-course-progress']);
    toast.success(`+${lesson?.xp_reward || 20} XP earned!`);
  };

  const handleDeleteLesson = async (lessonId) => {
    if (!confirm('Delete this lesson?')) return;
    await base44.entities.Lesson.delete(lessonId);
    queryClient.invalidateQueries(['lessons', courseId]);
    toast.success('Lesson deleted');
  };

  const isAdmin = user?.role === 'admin';
  const isLeader = user?.unit_admin_id || user?.clan_admin_id;
  const canEdit = isAdmin || isLeader;

  const TASK_ICONS = {
    read: BookOpen,
    watch: Play,
    quiz: FileQuestion,
    activity: Activity,
    upload: Upload,
  };

  if (!course) {
    return <div className="p-8 text-center">Loading...</div>;
  }

  const isEnrolled = !!progress;
  const completedLessons = progress?.completed_lessons || [];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate(-1)}
            className="text-white hover:bg-white/20 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> Back
          </Button>
          
          <h1 className="text-2xl font-bold mb-2">{course.title}</h1>
          <p className="text-blue-100 mb-4">{course.description}</p>
          
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <Badge className="bg-white/20">{course.category}</Badge>
            <span className="flex items-center gap-1">
              <FileText className="w-4 h-4" /> {lessons.length} lessons
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" /> {course.duration_minutes} min
            </span>
            <span className="flex items-center gap-1">
              <Zap className="w-4 h-4 text-yellow-300" /> {course.xp_reward} XP
            </span>
          </div>

          {isEnrolled && (
            <div className="mt-4 bg-white/10 rounded-xl p-4">
              <div className="flex justify-between text-sm mb-2">
                <span>Progress</span>
                <span className="font-medium">{progress.progress_percent}%</span>
              </div>
              <Progress value={progress.progress_percent} className="h-2 bg-white/20" />
            </div>
          )}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {!isEnrolled ? (
          <div className="bg-white dark:bg-gray-900 rounded-xl p-6 text-center">
            <BookOpen className="w-16 h-16 mx-auto text-blue-600 mb-4" />
            <h2 className="text-xl font-semibold mb-2">Ready to start learning?</h2>
            <p className="text-gray-500 mb-4">Enroll now to track your progress and earn badges!</p>
            <Button onClick={handleEnroll} className="bg-blue-600 hover:bg-blue-700">
              Enroll in Course
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Lessons Header */}
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <BookOpen className="w-5 h-5" /> Lessons
              </h2>
              {canEdit && (
                <Button 
                  size="sm" 
                  onClick={() => { setEditingLesson(null); setShowLessonEditor(true); }}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4 mr-1" /> Add Lesson
                </Button>
              )}
            </div>
            
            {lessons.map((lesson, idx) => {
              const isCompleted = completedLessons.includes(lesson.id);
              const isLocked = idx > 0 && !completedLessons.includes(lessons[idx - 1]?.id);
              
              return (
                <div
                  key={lesson.id}
                  className={cn(
                    "bg-white dark:bg-gray-900 rounded-xl border p-4",
                    isLocked && "opacity-50",
                    activeLesson === lesson.id && "ring-2 ring-blue-500"
                  )}
                >
                  <div 
                    className="flex items-center justify-between cursor-pointer"
                    onClick={() => !isLocked && setActiveLesson(activeLesson === lesson.id ? null : lesson.id)}
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center",
                        isCompleted ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-600"
                      )}>
                        {isLocked ? <Lock className="w-5 h-5" /> : 
                         isCompleted ? <CheckCircle className="w-5 h-5" /> : 
                         <span className="font-semibold">{idx + 1}</span>}
                      </div>
                      <div>
                        <h3 className="font-medium">{lesson.title}</h3>
                        <p className="text-sm text-gray-500">
                          {lesson.duration_minutes} min • {lesson.xp_reward} XP
                          {lesson.tasks?.length > 0 && ` • ${lesson.tasks.length} tasks`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {canEdit && (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => { e.stopPropagation(); setEditingLesson(lesson); setShowLessonEditor(true); }}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => { e.stopPropagation(); handleDeleteLesson(lesson.id); }}
                            className="text-red-500"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                      <ChevronRight className={cn("w-5 h-5 transition-transform", activeLesson === lesson.id && "rotate-90")} />
                    </div>
                  </div>

                  {activeLesson === lesson.id && (
                    <div className="mt-4 pt-4 border-t space-y-4">
                      <div className="prose prose-sm dark:prose-invert max-w-none">
                        {lesson.content}
                      </div>
                      
                      {lesson.video_url && (
                        <div className="aspect-video bg-black rounded-lg overflow-hidden">
                          <video src={lesson.video_url} controls className="w-full h-full" />
                        </div>
                      )}
                      
                      {lesson.pdf_url && (
                        <a 
                          href={lesson.pdf_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-blue-600 hover:underline"
                        >
                          <Download className="w-4 h-4" /> Download PDF
                        </a>
                      )}

                      {/* Tasks */}
                      {lesson.tasks?.length > 0 && (
                        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                          <h4 className="font-medium mb-3 flex items-center gap-2">
                            <Activity className="w-4 h-4" /> Tasks to Complete
                          </h4>
                          <div className="space-y-2">
                            {lesson.tasks.map((task, taskIdx) => {
                              const TaskIcon = TASK_ICONS[task.type] || BookOpen;
                              const taskDone = isTaskCompleted(lesson.id, task.id);
                              return (
                                <div 
                                  key={task.id}
                                  className={cn(
                                    "flex items-center gap-3 p-3 rounded-lg border transition-all",
                                    taskDone ? "bg-green-50 border-green-200" : "bg-white dark:bg-gray-900 border-gray-200"
                                  )}
                                >
                                  <div className={cn(
                                    "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                                    taskDone ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-500"
                                  )}>
                                    {taskDone ? <CheckCircle className="w-4 h-4" /> : <TaskIcon className="w-4 h-4" />}
                                  </div>
                                  <div className="flex-1">
                                    <p className={cn("font-medium text-sm", taskDone && "line-through text-gray-400")}>
                                      {task.title}
                                      {task.required && <span className="text-red-500 ml-1">*</span>}
                                    </p>
                                    {task.description && (
                                      <p className="text-xs text-gray-500">{task.description}</p>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Badge variant="outline" className="text-xs">+{task.xp_reward} XP</Badge>
                                    {!taskDone && (
                                      <Button 
                                        size="sm" 
                                        variant="outline"
                                        onClick={() => handleCompleteTask(lesson.id, task.id)}
                                      >
                                        Done
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                      
                      {!isCompleted && (
                        <Button 
                          onClick={() => handleCompleteLesson(lesson.id)}
                          disabled={lesson.tasks?.length > 0 && !allTasksCompleted(lesson)}
                          className="w-full bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="w-4 h-4 mr-2" /> Mark as Complete
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Quiz */}
            {quizzes.length > 0 && progress.progress_percent === 100 && (
              <div className="bg-white dark:bg-gray-900 rounded-xl border p-6 text-center">
                <Award className="w-12 h-12 mx-auto text-yellow-500 mb-3" />
                <h3 className="font-semibold mb-2">Ready for the quiz?</h3>
                <p className="text-sm text-gray-500 mb-4">Pass the quiz to earn your badge!</p>
                <Button 
                  onClick={() => navigate(createPageUrl(`Quiz?id=${quizzes[0].id}`))}
                  className="bg-yellow-500 hover:bg-yellow-600 text-black"
                >
                  Take Quiz
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Lesson Editor Dialog */}
      <LessonEditor
        open={showLessonEditor}
        onClose={() => { setShowLessonEditor(false); setEditingLesson(null); }}
        courseId={courseId}
        lesson={editingLesson}
        onSuccess={() => queryClient.invalidateQueries(['lessons', courseId])}
      />
    </div>
  );
}
