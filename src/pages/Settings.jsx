import React, { useState } from 'react';
import { useTheme, useLanguage } from '@/lib/ThemeContext';
import { useAuth } from '@/lib/AuthContext';
import { 
  Settings as SettingsIcon, Palette, Globe, Volume2, Eye, FileText, Lock, Bell, LogOut,
  Smartphone, Moon, Sun, Accessibility
} from 'lucide-react';
import { toast } from 'sonner';
import { THEMES } from '@/config/themes';

export default function Settings() {
  const { theme, changeTheme, availableThemes } = useTheme();
  const { t } = useLanguage();
  const { user, logout } = useAuth();
  const [fontSize, setFontSize] = useState(localStorage.getItem('scout-font-size') || '16');
  const [highContrast, setHighContrast] = useState(localStorage.getItem('scout-high-contrast') === 'true');
  const [dyslexiaFont, setDyslexiaFont] = useState(localStorage.getItem('scout-dyslexia-font') === 'true');

  const handleThemeChange = async (themeName) => {
    await changeTheme(themeName);
    toast.success(`Theme changed to ${themeName}`);
  };

  const handleFontSizeChange = (size) => {
    setFontSize(size);
    localStorage.setItem('scout-font-size', size);
    document.documentElement.style.fontSize = `${size}px`;
    toast.success('Font size updated');
  };

  const handleHighContrast = (enabled) => {
    setHighContrast(enabled);
    localStorage.setItem('scout-high-contrast', enabled);
    if (enabled) {
      document.documentElement.classList.add('high-contrast');
    } else {
      document.documentElement.classList.remove('high-contrast');
    }
    toast.success(enabled ? 'High contrast mode enabled' : 'High contrast mode disabled');
  };

  const handleDyslexiaFont = (enabled) => {
    setDyslexiaFont(enabled);
    localStorage.setItem('scout-dyslexia-font', enabled);
    if (enabled) {
      document.documentElement.classList.add('dyslexia-font');
    } else {
      document.documentElement.classList.remove('dyslexia-font');
    }
    toast.success(enabled ? 'Dyslexia font enabled' : 'Dyslexia font disabled');
  };

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      logout('/login');
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 animate-fadeIn">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <SettingsIcon className="w-8 h-8 text-emerald-600" />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t('settings.title', 'Settings')}</h1>
        </div>
        <p className="text-gray-600 dark:text-gray-400">Customize your ScoutConnect experience</p>
      </div>

      <div className="space-y-6">
        {/* Appearance Section */}
        <div className="bg-white/50 dark:bg-gray-900/50 backdrop-blur-md rounded-2xl border border-gray-200 dark:border-gray-800 p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center gap-3 mb-4">
            <Palette className="w-6 h-6 text-purple-600" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Appearance</h2>
          </div>

          {/* Theme Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Select Theme
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {Object.values(THEMES).map((t) => (
                <button
                  key={t.name}
                  onClick={() => handleThemeChange(t.name)}
                  className={`p-4 rounded-xl border-2 transition-all transform hover:scale-105 ${
                    theme.name === t.name
                      ? 'border-emerald-500 shadow-lg'
                      : 'border-transparent hover:border-gray-400'
                  }`}
                  style={{
                    background: `linear-gradient(135deg, ${t.colors.primary}, ${t.colors.secondary})`,
                  }}
                >
                  <span className="text-white text-xs font-semibold text-center block">{t.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Font Size */}
          <div className="mb-6 pb-6 border-b border-gray-200 dark:border-gray-800">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Font Size
            </label>
            <div className="flex items-center gap-3">
              {[14, 16, 18, 20].map((size) => (
                <button
                  key={size}
                  onClick={() => handleFontSizeChange(size)}
                  className={`px-4 py-2 rounded-lg transition-all ${
                    fontSize === size.toString()
                      ? 'bg-emerald-500 text-white'
                      : 'bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-700'
                  }`}
                >
                  <span style={{ fontSize: `${size}px` }}>A</span>
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Current: {fontSize}px</p>
          </div>

          {/* Accessibility Options */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Accessibility className="w-4 h-4" />
              Accessibility
            </h3>

            <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition">
              <input
                type="checkbox"
                checked={highContrast}
                onChange={(e) => handleHighContrast(e.target.checked)}
                className="w-5 h-5 rounded cursor-pointer"
              />
              <div>
                <span className="text-sm font-medium text-gray-900 dark:text-white">High Contrast Mode</span>
                <p className="text-xs text-gray-500 dark:text-gray-400">Increase visibility and readability</p>
              </div>
            </label>

            <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition">
              <input
                type="checkbox"
                checked={dyslexiaFont}
                onChange={(e) => handleDyslexiaFont(e.target.checked)}
                className="w-5 h-5 rounded cursor-pointer"
              />
              <div>
                <span className="text-sm font-medium text-gray-900 dark:text-white">Dyslexia-Friendly Font</span>
                <p className="text-xs text-gray-500 dark:text-gray-400">Use OpenDyslexic font for easier reading</p>
              </div>
            </label>
          </div>
        </div>

        {/* Language Section */}
        <LanguageSettings />

        {/* Notification Settings */}
        <div className="bg-white/50 dark:bg-gray-900/50 backdrop-blur-md rounded-2xl border border-gray-200 dark:border-gray-800 p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center gap-3 mb-4">
            <Bell className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Notifications</h2>
          </div>
          <div className="space-y-3">
            {['Messages', 'Events', 'Badges', 'Posts'].map((notification) => (
              <label key={notification} className="flex items-center gap-3 cursor-pointer p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition">
                <input type="checkbox" defaultChecked className="w-5 h-5 rounded cursor-pointer" />
                <span className="text-sm text-gray-900 dark:text-white">{notification} notifications</span>
              </label>
            ))}
          </div>
        </div>

        {/* Privacy & Security */}
        <div className="bg-white/50 dark:bg-gray-900/50 backdrop-blur-md rounded-2xl border border-gray-200 dark:border-gray-800 p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center gap-3 mb-4">
            <Lock className="w-6 h-6 text-red-600" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Privacy & Security</h2>
          </div>
          <div className="space-y-3">
            <button className="w-full text-left px-4 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition">
              <span className="text-sm font-medium text-gray-900 dark:text-white">Change Password</span>
            </button>
            <button className="w-full text-left px-4 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition">
              <span className="text-sm font-medium text-gray-900 dark:text-white">Two-Factor Authentication</span>
            </button>
            <button className="w-full text-left px-4 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition">
              <span className="text-sm font-medium text-gray-900 dark:text-white">Connected Devices</span>
            </button>
          </div>
        </div>

        {/* Account Section */}
        <div className="bg-white/50 dark:bg-gray-900/50 backdrop-blur-md rounded-2xl border border-gray-200 dark:border-gray-800 p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center gap-3 mb-4">
            <Smartphone className="w-6 h-6 text-indigo-600" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Account</h2>
          </div>
          <div className="space-y-3 text-sm text-gray-700 dark:text-gray-300">
            <p><span className="font-medium">Email:</span> {user?.email}</p>
            <p><span className="font-medium">Name:</span> {user?.full_name}</p>
            <p><span className="font-medium">Member Since:</span> {new Date(user?.created_at).toLocaleDateString()}</p>
          </div>
        </div>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold py-3 rounded-xl transition-all transform hover:shadow-lg active:scale-95 flex items-center justify-center gap-2"
        >
          <LogOut className="w-5 h-5" />
          Logout
        </button>
      </div>
    </div>
  );
}

function LanguageSettings() {
  const { language, changeLanguage, t } = useLanguage();

  return (
    <div className="bg-white/50 dark:bg-gray-900/50 backdrop-blur-md rounded-2xl border border-gray-200 dark:border-gray-800 p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-center gap-3 mb-4">
        <Globe className="w-6 h-6 text-green-600" />
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{t('settings.language', 'Language')}</h2>
      </div>

      <div className="space-y-3">
        {['en', 'rw', 'fr'].map((lang) => {
          const langNames = {
            en: 'English',
            rw: 'Kinyarwanda',
            fr: 'Français',
          };
          return (
            <button
              key={lang}
              onClick={() => {
                changeLanguage(lang);
              }}
              className={`w-full text-left px-4 py-3 rounded-lg border-2 transition-all ${
                language === lang
                  ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/30'
                  : 'border-transparent hover:border-gray-300 dark:hover:border-gray-700'
              }`}
            >
              <span className="font-medium text-gray-900 dark:text-white">{langNames[lang]}</span>
              {language === lang && (
                <span className="text-xs text-emerald-600 dark:text-emerald-400 ml-2">Currently selected</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
