import React from 'react';

export default function MVPTabContent() {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border overflow-hidden">
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">Complete MVP Product Description</h2>
        <p className="text-emerald-100">Comprehensive overview of the Scout Social Platform</p>
      </div>
      <div className="p-6 space-y-8 max-h-[70vh] overflow-y-auto text-sm text-gray-700 dark:text-gray-300">
        <section>
          <h3 className="text-xl font-bold text-emerald-600 mb-3">📱 Executive Summary</h3>
          <p>The Scout Social Platform is a comprehensive digital ecosystem for scout organizations, combining social networking, educational content, event management, and organizational tools into one unified platform.</p>
        </section>
        <section>
          <h3 className="text-xl font-bold text-emerald-600 mb-3">⚡ Core Features</h3>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Social Networking & Content Sharing (Posts, Stories, Music)</li>
            <li>Messaging & Group Chats (Direct, Group, Real-time)</li>
            <li>Scout Units & Clans Management (Join Requests, Points)</li>
            <li>Event Management (Camping, Hikes, Service Projects)</li>
            <li>Badge System & Achievements (Merit Badges, Wood Badge)</li>
            <li>Training & Educational Content (Courses, Quizzes, XP)</li>
            <li>Leader Toolkit (Meeting Plans, Games, Templates, Videos)</li>
            <li>Admin Control Panel (Moderation, Users, Marketplace)</li>
            <li>Scout Marketplace (Buy/Sell Scout Equipment)</li>
            <li>Notification System (Activity, System, Badge alerts)</li>
            <li>Search & Discovery (Explore, Hashtags, Filters)</li>
            <li>Profile & Account Management (Edit, Privacy, Themes)</li>
            <li>AI Scout Assistant (Chatbot, Knowledge Base)</li>
            <li>Competition & Leaderboards (Points, History, Reset)</li>
          </ul>
        </section>
        <section>
          <h3 className="text-xl font-bold text-emerald-600 mb-3">👥 User Roles</h3>
          <div className="space-y-3">
            {[
              { role: 'Regular Scout (User)', perms: ['Create posts and stories', 'Join units and clans', 'Participate in events', 'Earn badges and complete courses'] },
              { role: 'Scout Leader (Leader)', perms: ['All user permissions', 'Create and manage units/clans', 'Approve join requests', 'Access leader toolkit'] },
              { role: 'Platform Administrator (Admin)', perms: ['All leader permissions', 'Approve/reject all content', 'Manage users and roles', 'Send broadcast notifications'] },
              { role: 'Organization Leader (Special)', perms: ['Special badge on profile', 'Recognized title', 'Enhanced visibility'] },
            ].map(({ role, perms }) => (
              <div key={role} className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                <h4 className="font-bold mb-2">{role}</h4>
                <ul className="list-disc list-inside space-y-1 ml-2">{perms.map(p => <li key={p}>{p}</li>)}</ul>
              </div>
            ))}
          </div>
        </section>
        <section>
          <h3 className="text-xl font-bold text-emerald-600 mb-3">💾 Data Entities (30+)</h3>
          <p>User, PublicProfile, Post, Story, Comment, Follow, Conversation, Message, Unit, Clan, Patrol, JoinRequest, Event, Badge, UserBadge, BadgeRequest, Course, Lesson, Quiz, ScoutProgress, MeetingPlan, Game, PrintableTemplate, TrainingVideo, CampPlan, Product, Order, Donation, Notification, Music, CompetitionHistory</p>
        </section>
        <p className="text-center font-semibold text-lg text-emerald-600 dark:text-emerald-400 mt-6">ScoutConnect — Complete Digital Scouting Platform</p>
      </div>
    </div>
  );
}