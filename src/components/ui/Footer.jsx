import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Facebook, Twitter, Instagram, Youtube } from 'lucide-react';

const SCOUT_LINKS = [
{ name: 'Rwanda Scouts', url: 'https://www.scoutsrwanda.org/' },
{ name: 'WOSM', url: 'https://www.scout.org/' },
{ name: 'Africa Scout', url: 'https://www.scout.org/africa' },
{ name: 'Messengers of Peace', url: 'https://www.scout.org/mop' }];


const APP_LINKS = [
{ name: 'Home', page: 'Home' },
{ name: 'Explore', page: 'Explore' },
{ name: 'Training', page: 'Training' },
{ name: 'Events', page: 'Events' }];


const RESOURCE_LINKS = [
{ name: 'Marketplace', page: 'Marketplace' },
{ name: 'Leaderboard', page: 'Leaderboard' },
{ name: 'Leader Tools', page: 'LeaderToolkit' },
{ name: 'Badges', page: 'Badges' }];


const SUPPORT_LINKS = [
{ name: 'Help Center', page: 'HelpCenter' },
{ name: 'Privacy Policy', page: 'PrivacyPolicy' },
{ name: 'Settings', page: 'Settings' }];


const SOCIAL_LINKS = [
{ name: 'Facebook', url: 'https://web.facebook.com/groups/165846441330', icon: Facebook },
{ name: 'Twitter', url: 'https://x.com/RwandaScouts', icon: Twitter },
{ name: 'Instagram', url: 'https://www.instagram.com/rwanda_scouts/', icon: Instagram },
{ name: 'YouTube', url: 'https://www.youtube.com/@rwandascouts', icon: Youtube }];


export default function Footer() {
  return (
    <footer className="bg-slate-700 dark:bg-slate-800 text-gray-300 mt-8">
      <div className="max-w-6xl mx-auto px-6 py-10">
        {/* Main Content Grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-8">
          {/* About Section */}
          <div className="col-span-2 md:col-span-1">
            <h4 className="font-bold text-white uppercase text-sm mb-4">Scout Connect</h4>
            <p className="text-sm text-gray-400 leading-relaxed">
              Connecting scouts across Rwanda to share adventures, learn new skills, and build lasting friendships through scouting.
            </p>
          </div>

          {/* Scout Organizations */}
          <div>
            <h4 className="font-bold text-white uppercase text-sm mb-4">Organizations</h4>
            <ul className="space-y-2">
              {SCOUT_LINKS.map((link) =>
              <li key={link.name}>
                  <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-gray-400 hover:text-white transition-colors">

                    {link.name}
                  </a>
                </li>
              )}
            </ul>
          </div>

          {/* App Links */}
          <div>
            <h4 className="font-bold text-white uppercase text-sm mb-4">Navigate</h4>
            <ul className="space-y-2">
              {APP_LINKS.map((link) =>
              <li key={link.name}>
                  <Link
                  to={createPageUrl(link.page)}
                  className="text-sm text-gray-400 hover:text-white transition-colors">

                    {link.name}
                  </Link>
                </li>
              )}
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="font-bold text-white uppercase text-sm mb-4">Resources</h4>
            <ul className="space-y-2">
              {RESOURCE_LINKS.map((link) =>
              <li key={link.name}>
                  <Link
                  to={createPageUrl(link.page)}
                  className="text-sm text-gray-400 hover:text-white transition-colors">

                    {link.name}
                  </Link>
                </li>
              )}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-bold text-white uppercase text-sm mb-4">Support</h4>
            <ul className="space-y-2">
              {SUPPORT_LINKS.map((link) =>
              <li key={link.name}>
                  <Link
                  to={createPageUrl(link.page)}
                  className="text-sm text-gray-400 hover:text-white transition-colors">

                    {link.name}
                  </Link>
                </li>
              )}
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-slate-600 py-6">
          {/* Register CTA */}
          <div className="flex flex-col items-center gap-4 mb-6">
            <span className="text-gray-400 text-sm text-center">Created by Arnold Sincere | Pangolin Attentive 

            </span>
          </div>

          {/* Social Icons */}
          <div className="flex justify-center gap-3 mb-6">
            {SOCIAL_LINKS.map((social) => {const Icon = social.icon;return (
                <a
                  key={social.name}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-full border border-gray-500 flex items-center justify-center text-gray-400 hover:text-white hover:border-white transition-colors"
                  title={social.name}>

                  <Icon className="w-4 h-4" />
                </a>);

            })}
          </div>

          {/* Copyright */}
          <p className="text-center text-sm text-gray-500">© 2026 Copyright | Scout Connect

          </p>
        </div>
      </div>
    </footer>);

}