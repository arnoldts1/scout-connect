import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Shield, Eye, Lock, Users, Database, Bell, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createPageUrl } from '@/utils';

export default function PrivacyPolicy() {
  const navigate = useNavigate();

  const sections = [
    {
      icon: Database,
      title: 'Information We Collect',
      content: `We collect information you provide directly, including your name, email address, profile photo, and scout-related information (unit, clan, badges). We also collect content you create, such as posts, stories, comments, and messages.`
    },
    {
      icon: Eye,
      title: 'How We Use Your Information',
      content: `Your information is used to provide and improve Scout Connect services, personalize your experience, facilitate communication between scouts, track achievements and badges, and send important notifications about events and activities.`
    },
    {
      icon: Users,
      title: 'Information Sharing',
      content: `We share your public profile information with other Scout Connect users. Your posts and activities may be visible to your followers or the scout community depending on your privacy settings. We never sell your personal data to third parties.`
    },
    {
      icon: Lock,
      title: 'Data Security',
      content: `We implement industry-standard security measures to protect your personal information. This includes encryption, secure servers, and regular security audits. However, no method of transmission over the internet is 100% secure.`
    },
    {
      icon: Shield,
      title: 'Your Privacy Controls',
      content: `You can control your privacy through account settings. Options include making your account private, controlling who can message you, and managing your activity status visibility. You can also request deletion of your account and data.`
    },
    {
      icon: Bell,
      title: 'Notifications',
      content: `You have full control over the notifications you receive. You can customize alerts for likes, comments, follows, messages, and events in your settings.`
    },
    {
      icon: Mail,
      title: 'Contact Us',
      content: `If you have questions about this Privacy Policy or your data, please contact our support team through the Help Center or reach out to your unit/clan leaders.`
    }
  ];

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
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Privacy Policy</h1>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
            <Shield className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Scout Connect</h2>
            <p className="text-sm text-gray-500">Last updated: November 2025</p>
          </div>
        </div>
        <p className="text-gray-600 dark:text-gray-400">
          Your privacy is important to us. This policy explains how Scout Connect collects, uses, 
          and protects your personal information when you use our platform.
        </p>
      </div>

      <div className="space-y-4">
        {sections.map((section, index) => (
          <div 
            key={index}
            className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
                <section.icon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                  {section.title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                  {section.content}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 text-center">
        <p className="text-sm text-gray-500">
          By using Scout Connect, you agree to this Privacy Policy.
        </p>
      </div>
    </div>
  );
}