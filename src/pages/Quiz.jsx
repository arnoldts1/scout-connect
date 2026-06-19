import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, XCircle, Award, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { createPageUrl } from '@/utils';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export default function Quiz() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);

  const urlParams = new URLSearchParams(window.location.search);
  const quizId = urlParams.get('id');

  useEffect(() => {
    const fetchUser = async () => {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
    };
    fetchUser();
  }, []);

  const { data: quiz } = useQuery({
    queryKey: ['quiz', quizId],
    queryFn: async () => {
      const quizzes = await base44.entities.Quiz.filter({ id: quizId });
      return quizzes[0];
    },
    enabled: !!quizId,
  });

  const { data: progress } = useQuery({
    queryKey: ['quiz-progress', quiz?.course_id, user?.id],
    queryFn: async () => {
      const progs = await base44.entities.ScoutProgress.filter({ 
        course_id: quiz.course_id, 
        user_id: user?.id 
      });
      return progs[0];
    },
    enabled: !!quiz?.course_id && !!user?.id,
  });

  const questions = quiz?.questions || [];
  const currentQ = questions[currentQuestion];

  const handleSelectAnswer = (answerIndex) => {
    setSelectedAnswer(answerIndex);
  };

  const handleNext = () => {
    const newAnswers = [...answers, selectedAnswer];
    setAnswers(newAnswers);

    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setSelectedAnswer(null);
    } else {
      // Calculate score
      const correct = newAnswers.reduce((count, ans, idx) => {
        return count + (ans === questions[idx].correct_answer ? 1 : 0);
      }, 0);
      const finalScore = questions.length > 0 ? Math.round((correct / questions.length) * 100) : 0;
      setScore(finalScore);
      setShowResult(true);
      handleQuizComplete(finalScore);
    }
  };

  const handleQuizComplete = async (finalScore) => {
    if (!progress) return;

    const passed = finalScore >= (quiz?.passing_score || 70);
    const quizScores = [...(progress.quiz_scores || []), {
      quiz_id: quizId,
      score: finalScore,
      passed,
      completed_at: new Date().toISOString()
    }];

    const newXP = (progress.xp_earned || 0) + (passed ? (quiz?.xp_reward || 50) : 10);

    await base44.entities.ScoutProgress.update(progress.id, {
      quiz_scores: quizScores,
      xp_earned: newXP,
      status: passed ? 'badge_pending' : progress.status,
      completed_at: passed ? new Date().toISOString() : progress.completed_at
    });

    if (passed) {
      toast.success('Congratulations! Badge request submitted!');
    }

    queryClient.invalidateQueries(['quiz-progress']);
  };

  if (!quiz) {
    return <div className="p-8 text-center">Loading...</div>;
  }

  if (showResult) {
    const passed = score >= (quiz?.passing_score || 70);
    
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 max-w-md w-full text-center">
          <div className={cn(
            "w-24 h-24 rounded-full mx-auto mb-6 flex items-center justify-center",
            passed ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"
          )}>
            {passed ? <Award className="w-12 h-12" /> : <XCircle className="w-12 h-12" />}
          </div>
          
          <h1 className="text-2xl font-bold mb-2">
            {passed ? 'Congratulations!' : 'Keep Trying!'}
          </h1>
          
          <p className="text-gray-500 mb-6">
            You scored {score}% ({Math.round(score * questions.length / 100)}/{questions.length} correct)
          </p>

          {passed ? (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-xl p-4 mb-6">
              <Award className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
              <p className="text-sm text-yellow-700 dark:text-yellow-300">
                Your badge request has been submitted for leader approval!
              </p>
            </div>
          ) : (
            <p className="text-sm text-gray-500 mb-6">
              You need {quiz?.passing_score || 70}% to pass. Review the lessons and try again!
            </p>
          )}

          <div className="flex gap-3">
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={() => navigate(createPageUrl(`CourseDetail?id=${quiz.course_id}`))}
            >
              Back to Course
            </Button>
            {!passed && (
              <Button 
                className="flex-1"
                onClick={() => {
                  setCurrentQuestion(0);
                  setSelectedAnswer(null);
                  setAnswers([]);
                  setShowResult(false);
                }}
              >
                Try Again
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 border-b sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-3">
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-4 h-4 mr-2" /> Exit Quiz
            </Button>
            <span className="text-sm text-gray-500">
              {currentQuestion + 1} of {questions.length}
            </span>
          </div>
          <Progress value={questions.length > 0 ? ((currentQuestion + 1) / questions.length) * 100 : 0} className="h-2" />
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8">
        <h2 className="text-xl font-semibold mb-6">{currentQ?.question}</h2>

        <div className="space-y-3">
          {currentQ?.options?.map((option, idx) => (
            <button
              key={idx}
              onClick={() => handleSelectAnswer(idx)}
              className={cn(
                "w-full p-4 rounded-xl border-2 text-left transition-all",
                selectedAnswer === idx
                  ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                  : "border-gray-200 dark:border-gray-700 hover:border-gray-300"
              )}
            >
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center font-medium",
                  selectedAnswer === idx
                    ? "bg-blue-500 text-white"
                    : "bg-gray-100 dark:bg-gray-800"
                )}>
                  {String.fromCharCode(65 + idx)}
                </div>
                <span>{option}</span>
              </div>
            </button>
          ))}
        </div>

        <Button
          onClick={handleNext}
          disabled={selectedAnswer === null}
          className="w-full mt-8 h-12 bg-blue-600 hover:bg-blue-700"
        >
          {currentQuestion === questions.length - 1 ? 'Submit Quiz' : 'Next Question'}
        </Button>
      </div>
    </div>
  );
}
