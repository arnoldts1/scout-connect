import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Briefcase, FileText, Gamepad2, Tent, Download, Play,
  Calendar, Users, DollarSign, ChevronRight, Plus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { createPageUrl } from '@/utils';
import { cn } from '@/lib/utils';
import AddMeetingDialog from '@/components/toolkit/AddMeetingDialog';
import AddGameDialog from '@/components/toolkit/AddGameDialog';
import AddPrintableDialog from '@/components/toolkit/AddPrintableDialog';
import AddVideoDialog from '@/components/toolkit/AddVideoDialog';

const GAME_CATEGORIES = [
  { id: 'icebreaker', label: 'Icebreakers', icon: '🤝' },
  { id: 'team_building', label: 'Team Building', icon: '👥' },
  { id: 'leadership', label: 'Leadership', icon: '👑' },
  { id: 'outdoor', label: 'Outdoor', icon: '🌲' },
  { id: 'campfire', label: 'Campfire', icon: '🔥' },
];

export default function LeaderToolkit() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('meetings');
  const [isLeader, setIsLeader] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);

        // Check if user is admin or leader (for camps access)
        if (currentUser.role === 'admin' || currentUser.role === 'leader') {
          setIsLeader(true);
        } else {
          try {
            const [units, clans] = await Promise.all([
              base44.entities.Unit.filter({ admin_email: currentUser.email }),
              base44.entities.Clan.filter({ admin_email: currentUser.email })
            ]);
            if (units.length > 0 || clans.length > 0) {
              setIsLeader(true);
            }
          } catch (error) {
            console.error('Failed to check if user is leader:', error);
            // Continue gracefully
          }
        }
      } catch (error) {
        console.error('Failed to load user:', error);
        // Continue gracefully
      }
    };
    fetchUser();
  }, []);

  const { data: meetingPlans = [] } = useQuery({
    queryKey: ['meeting-plans'],
    queryFn: () => base44.entities.MeetingPlan.list('-downloads_count', 50),
  });

  const { data: games = [] } = useQuery({
    queryKey: ['games'],
    queryFn: () => base44.entities.Game.list('-likes_count', 50),
  });

  const { data: templates = [] } = useQuery({
    queryKey: ['printable-templates'],
    queryFn: () => base44.entities.PrintableTemplate.list('-downloads_count'),
  });

  const { data: videos = [] } = useQuery({
    queryKey: ['training-videos'],
    queryFn: () => base44.entities.TrainingVideo.list('-views_count'),
  });

  const { data: myCampPlans = [] } = useQuery({
    queryKey: ['my-camp-plans', user?.id],
    queryFn: () => base44.entities.CampPlan.filter({ organizer_id: user?.id }),
    enabled: !!user?.id,
  });

  const queryClient = useQueryClient();
  const canAddContent = user?.role === 'admin' || user?.role === 'leader' || isLeader;
  
  const [showAddMeeting, setShowAddMeeting] = useState(false);
  const [showAddGame, setShowAddGame] = useState(false);
  const [showAddPrintable, setShowAddPrintable] = useState(false);
  const [showAddVideo, setShowAddVideo] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState(null);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Briefcase className="w-7 h-7" />
            Leader Toolkit
          </h1>
          <p className="text-purple-100 mt-1">Resources to run amazing troop meetings</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className={`w-full grid ${isLeader ? 'grid-cols-5' : 'grid-cols-4'} mb-6`}>
            <TabsTrigger value="meetings" className="text-xs">
              <FileText className="w-4 h-4 mr-1" /> Meetings
            </TabsTrigger>
            <TabsTrigger value="games" className="text-xs">
              <Gamepad2 className="w-4 h-4 mr-1" /> Games
            </TabsTrigger>
            {isLeader && (
              <TabsTrigger value="camps" className="text-xs">
                <Tent className="w-4 h-4 mr-1" /> Camps
              </TabsTrigger>
            )}
            <TabsTrigger value="printables" className="text-xs">
              <Download className="w-4 h-4 mr-1" /> Print
            </TabsTrigger>
            <TabsTrigger value="videos" className="text-xs">
              <Play className="w-4 h-4 mr-1" /> Videos
            </TabsTrigger>
          </TabsList>

          {/* Meeting Plans */}
          <TabsContent value="meetings">
            {canAddContent && (
              <div className="mb-4 flex justify-end">
                <Button size="sm" className="bg-purple-600 hover:bg-purple-700" onClick={() => setShowAddMeeting(true)}>
                  <Plus className="w-4 h-4 mr-1" /> Add Meeting Plan
                </Button>
              </div>
            )}
            <div className="space-y-4">
              {meetingPlans.map(plan => (
                <div key={plan.id} className="bg-white dark:bg-gray-900 rounded-xl border p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold">{plan.title}</h3>
                      <p className="text-sm text-gray-500 mt-1">{plan.description}</p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                        <Badge>{plan.age_group}</Badge>
                        <span>{plan.duration_minutes} min</span>
                        <span>{plan.downloads_count} downloads</span>
                      </div>
                    </div>
                    {plan.pdf_url && (
                      <a 
                        href={plan.pdf_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        onClick={async () => {
                          await base44.entities.MeetingPlan.update(plan.id, {
                            downloads_count: (plan.downloads_count || 0) + 1
                          });
                          queryClient.invalidateQueries(['meeting-plans']);
                        }}
                      >
                        <Button size="sm" variant="outline">
                          <Download className="w-4 h-4 mr-1" /> PDF
                        </Button>
                      </a>
                    )}
                  </div>
                  {plan.objectives?.length > 0 && (
                    <div className="mt-3 pt-3 border-t">
                      <p className="text-xs font-medium text-gray-500 mb-1">Objectives:</p>
                      <ul className="text-sm text-gray-600 list-disc list-inside">
                        {plan.objectives.slice(0, 3).map((obj, idx) => (
                          <li key={idx}>{obj}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </TabsContent>

          {/* Games */}
          <TabsContent value="games">
            {canAddContent && (
              <div className="mb-4 flex justify-end">
                <Button size="sm" className="bg-purple-600 hover:bg-purple-700" onClick={() => setShowAddGame(true)}>
                  <Plus className="w-4 h-4 mr-1" /> Add Game
                </Button>
              </div>
            )}
            <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide mb-4">
              {GAME_CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  className="flex items-center gap-2 px-4 py-2 rounded-full bg-white dark:bg-gray-800 whitespace-nowrap"
                >
                  <span>{cat.icon}</span>
                  <span className="text-sm">{cat.label}</span>
                </button>
              ))}
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {games.map(game => (
                <div key={game.id} className="bg-white dark:bg-gray-900 rounded-xl border p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center text-2xl">
                      {GAME_CATEGORIES.find(c => c.id === game.category)?.icon || '🎮'}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold">{game.title}</h3>
                      <p className="text-sm text-gray-500 line-clamp-2">{game.description}</p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                        <span>{game.min_players}-{game.max_players} players</span>
                        <span>{game.duration_minutes} min</span>
                        <Badge>{game.age_group}</Badge>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* Camp Planning */}
          <TabsContent value="camps">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-semibold">My Camp Plans</h2>
              <Button onClick={() => navigate(createPageUrl('CampPlanner'))} size="sm">
                <Plus className="w-4 h-4 mr-1" /> New Plan
              </Button>
            </div>
            
            {myCampPlans.length === 0 ? (
              <div className="bg-white dark:bg-gray-900 rounded-xl p-8 text-center">
                <Tent className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                <h3 className="font-semibold mb-2">No camp plans yet</h3>
                <p className="text-gray-500 mb-4">Create your first camp plan with budget, menu, and schedule</p>
                <Button onClick={() => navigate(createPageUrl('CampPlanner'))}>
                  <Plus className="w-4 h-4 mr-2" /> Create Camp Plan
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {myCampPlans.map(plan => (
                  <Link
                    key={plan.id}
                    to={createPageUrl(`CampPlanner?id=${plan.id}`)}
                    className="block bg-white dark:bg-gray-900 rounded-xl border p-4 hover:shadow-lg transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold">{plan.title}</h3>
                        <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" /> {plan.start_date}
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="w-4 h-4" /> {plan.participants_count} scouts
                          </span>
                        </div>
                      </div>
                      <Badge>{plan.status}</Badge>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Printables */}
          <TabsContent value="printables">
            {canAddContent && (
              <div className="mb-4 flex justify-end">
                <Button size="sm" className="bg-purple-600 hover:bg-purple-700" onClick={() => setShowAddPrintable(true)}>
                  <Plus className="w-4 h-4 mr-1" /> Add Printable
                </Button>
              </div>
            )}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {templates.map(template => (
                <div key={template.id} className="bg-white dark:bg-gray-900 rounded-xl border overflow-hidden">
                  <div className="aspect-[3/4] bg-gray-100 dark:bg-gray-800">
                    {template.thumbnail ? (
                      <img src={template.thumbnail} alt={template.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <FileText className="w-16 h-16 text-gray-300" />
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-medium">{template.title}</h3>
                    <Badge className="mt-1">{template.category.replace('_', ' ')}</Badge>
                    <a 
                      href={template.pdf_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="mt-3 block"
                      onClick={async () => {
                        await base44.entities.PrintableTemplate.update(template.id, {
                          downloads_count: (template.downloads_count || 0) + 1
                        });
                        queryClient.invalidateQueries(['printable-templates']);
                      }}
                    >
                      <Button className="w-full" size="sm">
                        <Download className="w-4 h-4 mr-2" /> Download
                      </Button>
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* Training Videos */}
          <TabsContent value="videos">
            {canAddContent && (
              <div className="mb-4 flex justify-end">
                <Button size="sm" className="bg-purple-600 hover:bg-purple-700" onClick={() => setShowAddVideo(true)}>
                  <Plus className="w-4 h-4 mr-1" /> Add Video
                </Button>
              </div>
            )}
            <div className="grid gap-4 md:grid-cols-2">
              {videos.map(video => (
                <div key={video.id} className="bg-white dark:bg-gray-900 rounded-xl border overflow-hidden">
                  <button 
                    onClick={() => setSelectedVideo(video)}
                    className="w-full aspect-video bg-gray-100 dark:bg-gray-800 relative group cursor-pointer"
                  >
                    {video.thumbnail ? (
                      <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Play className="w-16 h-16 text-gray-300" />
                      </div>
                    )}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/30 transition-all">
                      <div className="w-16 h-16 rounded-full bg-white/90 group-hover:bg-white flex items-center justify-center transition-all">
                        <Play className="w-8 h-8 text-purple-600 ml-1" />
                      </div>
                    </div>
                  </button>
                  <div className="p-4">
                    <h3 className="font-medium">{video.title}</h3>
                    <p className="text-sm text-gray-500 line-clamp-2 mt-1">{video.description}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                      <Badge>{video.category}</Badge>
                      <span>{video.duration_minutes} min</span>
                      <span>{video.views_count} views</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <AddMeetingDialog 
        open={showAddMeeting} 
        onClose={() => setShowAddMeeting(false)} 
        user={user}
        onSuccess={() => queryClient.invalidateQueries(['meeting-plans'])}
      />
      <AddGameDialog 
        open={showAddGame} 
        onClose={() => setShowAddGame(false)} 
        onSuccess={() => queryClient.invalidateQueries(['games'])}
      />
      <AddPrintableDialog 
        open={showAddPrintable} 
        onClose={() => setShowAddPrintable(false)} 
        onSuccess={() => queryClient.invalidateQueries(['printable-templates'])}
      />
      <AddVideoDialog 
        open={showAddVideo} 
        onClose={() => setShowAddVideo(false)} 
        onSuccess={() => queryClient.invalidateQueries(['training-videos'])}
      />

      {/* Video Player Dialog */}
      {selectedVideo && (
        <div 
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedVideo(null)}
        >
          <div className="max-w-4xl w-full" onClick={(e) => e.stopPropagation()}>
            <div className="bg-white dark:bg-gray-900 rounded-xl overflow-hidden">
              <div className="aspect-video bg-black">
                <video 
                  src={selectedVideo.video_url} 
                  controls 
                  autoPlay
                  className="w-full h-full"
                />
              </div>
              <div className="p-6">
                <h2 className="text-xl font-bold">{selectedVideo.title}</h2>
                <p className="text-gray-600 dark:text-gray-400 mt-2">{selectedVideo.description}</p>
                <div className="flex items-center gap-4 mt-4 text-sm text-gray-500">
                  <Badge>{selectedVideo.category}</Badge>
                  <span>{selectedVideo.duration_minutes} minutes</span>
                  <span>{selectedVideo.views_count} views</span>
                </div>
                <Button 
                  onClick={() => setSelectedVideo(null)}
                  className="mt-4 w-full"
                  variant="outline"
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
