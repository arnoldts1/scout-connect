import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Search, MessageCircle, Users, Camera, Bell, 
  Shield, Settings, Award, Calendar, ChevronDown, ChevronUp,
  Mail, HelpCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createPageUrl } from '@/utils';
import { cn } from '@/lib/utils';

const faqs = [
  {
    category: 'Getting Started',
    icon: HelpCircle,
    questions: [
      {
        q: 'How do I create an account?',
        a: 'Scout Connect accounts are created through your scout organization. Contact your unit or clan leader to get an invitation to join the platform.'
      },
      {
        q: 'How do I join a unit or clan?',
        a: 'During onboarding, you can either join an existing unit/clan by selecting it from the list, or create a new one if you are a leader. You can also change your unit/clan later in your profile settings.'
      },
      {
        q: 'How do I complete my profile?',
        a: 'Go to Settings > Edit Profile to add your photo, bio, location, and other details. A complete profile helps other scouts find and connect with you.'
      }
    ]
  },
  {
    category: 'Posts & Stories',
    icon: Camera,
    questions: [
      {
        q: 'How do I create a post?',
        a: 'Tap the + button in the navigation bar, select your media (photo or video), add a caption and hashtags, then share it with the community.'
      },
      {
        q: 'How do I add a story?',
        a: 'Tap on "Your story" in the stories bar at the top of the home feed. You can add text overlays, filters, and music to your story before posting.'
      },
      {
        q: 'How long do stories last?',
        a: 'Stories are visible for 24 hours after posting. After that, they automatically disappear unless you save them as highlights.'
      },
      {
        q: 'What are unit/clan work posts?',
        a: 'Work posts are special posts that showcase your scout activities. They can earn points for your unit or clan when approved by admins.'
      }
    ]
  },
  {
    category: 'Messaging',
    icon: MessageCircle,
    questions: [
      {
        q: 'How do I send a message?',
        a: 'Go to Messages, tap the compose button, select a user, and start chatting. You can send text, photos, and videos.'
      },
      {
        q: 'Can I create group chats?',
        a: 'Yes! In Messages, tap "New Group" to create a group chat. Select the members you want to add and give your group a name.'
      },
      {
        q: 'How do I control who can message me?',
        a: 'Go to Settings > Privacy > Message Requests to choose if everyone, only followers, or no one can send you messages.'
      }
    ]
  },
  {
    category: 'Units & Clans',
    icon: Users,
    questions: [
      {
        q: 'What is the difference between a unit and a clan?',
        a: 'Units are larger organizational groups (like a troop), while clans are smaller groups within units. Both can earn points and participate in events.'
      },
      {
        q: 'How do I earn points for my unit/clan?',
        a: 'Post about your scout activities using the "Work Post" feature. When your post is approved by an admin, points are awarded to your unit or clan.'
      },
      {
        q: 'How do I view the leaderboard?',
        a: 'Go to the Leaderboard page from the navigation to see how your unit and clan rank against others.'
      }
    ]
  },
  {
    category: 'Badges & Achievements',
    icon: Award,
    questions: [
      {
        q: 'How do I earn badges?',
        a: 'Complete badge requirements by participating in activities, attending events, and demonstrating skills. Track your progress in the Badges section.'
      },
      {
        q: 'How do I track my badge progress?',
        a: 'Go to your Profile and tap on Badges to see all available badges, your progress, and earned achievements.'
      }
    ]
  },
  {
    category: 'Events',
    icon: Calendar,
    questions: [
      {
        q: 'How do I find events?',
        a: 'Browse events in the Explore section under the Events tab. You can see upcoming camping trips, service projects, and meetings.'
      },
      {
        q: 'How do I join an event?',
        a: 'Open the event details and tap "Join Event". You will receive notifications about the event and can chat with other participants.'
      }
    ]
  },
  {
    category: 'Privacy & Security',
    icon: Shield,
    questions: [
      {
        q: 'How do I make my account private?',
        a: 'Go to Settings > Privacy and enable "Private Account". Only approved followers will be able to see your posts.'
      },
      {
        q: 'How do I block someone?',
        a: 'Go to their profile, tap the three dots menu, and select "Block". They will not be able to see your content or message you.'
      },
      {
        q: 'How do I report inappropriate content?',
        a: 'Tap the three dots on any post or profile and select "Report". Our team will review the content and take appropriate action.'
      }
    ]
  }
];

export default function HelpCenter() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategory, setExpandedCategory] = useState(null);
  const [expandedQuestion, setExpandedQuestion] = useState(null);

  const filteredFaqs = faqs.map(category => ({
    ...category,
    questions: category.questions.filter(
      q => q.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
           q.a.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(category => category.questions.length > 0);

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="flex items-center gap-4 mb-6">
        <Button 
          variant="ghost" 
          size="icon"
          onClick={() => navigate(createPageUrl('Settings'))}
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Help Center</h1>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <Input
          type="text"
          placeholder="Search for help..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-12 pr-4 py-6 text-lg rounded-2xl"
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3 mb-8">
        <Button
          variant="outline"
          className="h-auto py-4 flex flex-col items-center gap-2 rounded-2xl"
          onClick={() => navigate(createPageUrl('Messages'))}
        >
          <Mail className="w-6 h-6 text-emerald-600" />
          <span className="text-sm">Contact Support</span>
        </Button>
        <Button
          variant="outline"
          className="h-auto py-4 flex flex-col items-center gap-2 rounded-2xl"
          onClick={() => navigate(createPageUrl('Settings'))}
        >
          <Settings className="w-6 h-6 text-emerald-600" />
          <span className="text-sm">Settings</span>
        </Button>
      </div>

      {/* FAQ Categories */}
      <div className="space-y-4">
        {filteredFaqs.map((category, catIndex) => (
          <div 
            key={catIndex}
            className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden"
          >
            <button
              className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50"
              onClick={() => setExpandedCategory(expandedCategory === catIndex ? null : catIndex)}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                  <category.icon className="w-5 h-5 text-emerald-600" />
                </div>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {category.category}
                </span>
              </div>
              {expandedCategory === catIndex ? (
                <ChevronUp className="w-5 h-5 text-gray-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-400" />
              )}
            </button>

            {expandedCategory === catIndex && (
              <div className="border-t border-gray-100 dark:border-gray-800">
                {category.questions.map((item, qIndex) => (
                  <div key={qIndex} className="border-b border-gray-100 dark:border-gray-800 last:border-b-0">
                    <button
                      className="w-full text-left p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                      onClick={() => setExpandedQuestion(
                        expandedQuestion === `${catIndex}-${qIndex}` ? null : `${catIndex}-${qIndex}`
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-900 dark:text-white pr-4">
                          {item.q}
                        </span>
                        {expandedQuestion === `${catIndex}-${qIndex}` ? (
                          <ChevronUp className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        )}
                      </div>
                    </button>
                    {expandedQuestion === `${catIndex}-${qIndex}` && (
                      <div className="px-4 pb-4">
                        <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                          {item.a}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {filteredFaqs.length === 0 && (
        <div className="text-center py-12">
          <HelpCircle className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            No results found
          </h3>
          <p className="text-gray-500">
            Try searching with different keywords
          </p>
        </div>
      )}

      <div className="mt-8 text-center">
        <p className="text-sm text-gray-500 mb-2">
          Can't find what you're looking for?
        </p>
        <Button 
          className="bg-emerald-600 hover:bg-emerald-700 rounded-full"
          onClick={() => navigate(createPageUrl('Messages'))}
        >
          <Mail className="w-4 h-4 mr-2" />
          Contact Support
        </Button>
      </div>
    </div>
  );
}