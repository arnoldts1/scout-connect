import React, { useState } from 'react';
import { useLanguage } from '@/lib/ThemeContext';
import {
  TrendingUp, Calendar, MessageSquare, Users, Award, Activity,
  ArrowRight, Star, Zap, Flame
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';

export default function DashboardModern({ user, stats = {}, activities = [], events = [], unitStats = {} }) {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [hoveredCard, setHoveredCard] = useState(null);

  const getUnitUrl = () => {
    if (user?.unit_id) {
      return createPageUrl(`Unit?id=${user.unit_id}`);
    }
    return createPageUrl('Unit');
  };

  const quickActions = [
    { icon: MessageSquare, label: 'Messages', page: 'Messages', color: 'from-blue-500 to-blue-600' },
    { icon: Calendar, label: 'Events', page: 'Events', color: 'from-purple-500 to-purple-600' },
    { icon: Users, label: 'My Unit', url: getUnitUrl(), color: 'from-emerald-500 to-emerald-600' },
    { icon: Award, label: 'Badges', page: 'Badges', color: 'from-amber-500 to-amber-600' },
  ];

  // Map activity types to icons
  const activityIcons = {
    post: Activity,
    badge: Award,
    event: Calendar,
    message: MessageSquare
  };

  // Use real activities or fallback to empty
  const displayedActivities = activities.length > 0 ? activities : [
    { type: 'post', message: 'No activities yet', time: 'Start your journey!', icon: Activity },
  ];

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Welcome Section */}
      <div className="relative overflow-hidden rounded-3xl glassmorphism p-8 lg:p-12">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-400/20 to-teal-400/20 dark:from-emerald-600/20 dark:to-teal-600/20"></div>
        <div className="relative z-10">
          <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-2 animate-slideInLeft">
            Welcome back, {user?.full_name?.split(' ')[0]}! 👋
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            Ready to make an impact in your scout community today?
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Points', value: stats.points?.toString() || '0', icon: TrendingUp, color: 'emerald' },
          { label: 'Badges Earned', value: stats.badges?.toString() || '0', icon: Award, color: 'amber' },
          { label: 'Events Attended', value: stats.events?.toString() || '0', icon: Calendar, color: 'blue' },
          { label: 'Unit Members', value: stats.members?.toString() || '0', icon: Users, color: 'purple' },
        ].map((stat, idx) => (
          <div
            key={idx}
            className="card-modern group hover-lift animate-scaleIn"
            style={{ animationDelay: `${idx * 50}ms` }}
            onMouseEnter={() => setHoveredCard(idx)}
            onMouseLeave={() => setHoveredCard(null)}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-gray-600 dark:text-gray-400 text-sm font-medium mb-1">
                  {stat.label}
                </p>
                <p className={`text-3xl font-bold bg-gradient-to-r from-${stat.color}-500 to-${stat.color}-600 bg-clip-text text-transparent`}>
                  {stat.value}
                </p>
              </div>
              <div className={`p-3 rounded-lg bg-${stat.color}-100 dark:bg-${stat.color}-900/30 group-hover:scale-110 transition-transform`}>
                <stat.icon className={`w-6 h-6 text-${stat.color}-600 dark:text-${stat.color}-400`} />
              </div>
            </div>
            {hoveredCard === idx && (
              <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-800 flex items-center text-sm text-emerald-600 dark:text-emerald-400 group-hover:translate-x-1 transition-transform">
                View more <ArrowRight className="w-4 h-4 ml-1" />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Zap className="w-6 h-6 text-amber-500" />
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action, idx) => (
            <Link
              key={idx}
              to={action.url || createPageUrl(action.page)}
              className={`group relative overflow-hidden rounded-2xl p-6 text-white transition-all transform hover:shadow-2xl hover:-translate-y-2 animate-slideInUp`}
              style={{ animationDelay: `${idx * 50}ms` }}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${action.color}`}></div>
              <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors"></div>
              <div className="relative z-10">
                <action.icon className="w-8 h-8 mb-3 transform group-hover:scale-110 group-hover:rotate-12 transition-transform" />
                <h3 className="font-semibold text-lg">{action.label}</h3>
                <p className="text-sm text-white/80 mt-1">Quick access</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Activity & Upcoming Events */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <div className="lg:col-span-2 card-modern hover-lift">
          <div className="flex items-center gap-3 mb-6">
            <Flame className="w-6 h-6 text-red-500" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Recent Activity</h2>
          </div>
          <div className="space-y-4">
            {displayedActivities.map((activity, idx) => {
              const IconComponent = activityIcons[activity.type] || Activity;
              return (
                <div
                  key={idx}
                  className="flex items-center gap-4 p-4 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition animate-slideInLeft"
                  style={{ animationDelay: `${idx * 50}ms` }}
                >
                  <div className="p-3 rounded-lg bg-gray-100 dark:bg-gray-800">
                    <IconComponent className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {activity.message}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {activity.time}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Unit Performance */}
        <div className="card-modern hover-lift">
          <div className="flex items-center gap-3 mb-6">
            <Star className="w-6 h-6 text-amber-500" />
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Unit Stats</h2>
          </div>
          {user?.unit_id ? (
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Ranking</span>
                  <span className="text-lg font-bold text-emerald-600">#{unitStats.ranking || '—'}</span>
                </div>
                <div className="h-2 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full" style={{ width: `${Math.min((100 - ((unitStats.ranking || 1) * 5)), 100)}%` }}></div>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Participation</span>
                  <span className="text-lg font-bold text-purple-600">{unitStats.participation || 0}%</span>
                </div>
                <div className="h-2 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-purple-500 to-pink-600 rounded-full" style={{ width: `${unitStats.participation || 0}%` }}></div>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Completion</span>
                  <span className="text-lg font-bold text-blue-600">{unitStats.completion || 0}%</span>
                </div>
                <div className="h-2 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-blue-500 to-cyan-600 rounded-full" style={{ width: `${unitStats.completion || 0}%` }}></div>
                </div>
              </div>
              <div className="pt-3 border-t border-gray-200 dark:border-gray-800">
                <p className="text-xs text-gray-600 dark:text-gray-400">{unitStats.name || 'Unit'} • {unitStats.points || 0} points</p>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>Join a unit to see stats</p>
            </div>
          )}
          <Link
            to={user?.unit_id ? createPageUrl(`Unit?id=${user.unit_id}`) : createPageUrl('Unit')}
            className="w-full mt-6 px-4 py-2 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold hover:shadow-lg transform hover:-translate-y-1 transition-all block text-center"
          >
            View Full Stats
          </Link>
        </div>
      </div>

      {/* Upcoming Events Preview */}
      <div className="card-modern hover-lift">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Calendar className="w-6 h-6 text-blue-500" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Upcoming Events</h2>
          </div>
          <Link
            to={createPageUrl('Events')}
            className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 hover:gap-2 flex items-center gap-1 transition-all"
          >
            View All <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="space-y-3">
          {events.length > 0 ? (
            events.map((event, idx) => (
              <button
                key={event.id || idx}
                onClick={() => navigate(createPageUrl(`Event?id=${event.id}`))}
                className="w-full flex items-center gap-4 p-4 rounded-lg border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-emerald-400 dark:hover:border-emerald-600 transition-all animate-slideInUp group cursor-pointer text-left"
                style={{ animationDelay: `${idx * 50}ms` }}
              >
                <div className="w-2 h-12 bg-gradient-to-b from-emerald-500 to-teal-600 rounded-full group-hover:shadow-lg transition-shadow"></div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-gray-900 dark:text-white group-hover:text-emerald-600 transition-colors">{event.title}</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{event.date} • {event.location}</p>
                </div>
                <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-emerald-600 transition-colors flex-shrink-0" />
              </button>
            ))
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>No upcoming events at the moment</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
