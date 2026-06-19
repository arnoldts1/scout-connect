import React, { createContext, useState, useContext, useEffect } from 'react';
import { THEMES, applyThemeToDOM } from '@/config/themes';
import { base44 } from '@/api/base44Client';

const ThemeContext = createContext();
const LanguageContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(THEMES.classicLight);
  const [language, setLanguage] = useState('en');
  const [translations, setTranslations] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  // Load theme from localStorage or user preference
  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const savedTheme = localStorage.getItem('scout-theme');
        const savedLanguage = localStorage.getItem('scout-language');

        if (savedTheme && THEMES[savedTheme]) {
          setTheme(THEMES[savedTheme]);
          applyThemeToDOM(THEMES[savedTheme]);
        } else {
          applyThemeToDOM(THEMES.classicLight);
        }

        if (savedLanguage) {
          setLanguage(savedLanguage);
          loadTranslations(savedLanguage);
        } else {
          loadTranslations('en');
        }
      } catch (error) {
        console.error('Error loading preferences:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadPreferences();
  }, []);

  const loadTranslations = async (lang) => {
    try {
      const translation = await import(`@/translations/${lang}.json`);
      setTranslations(translation.default);
    } catch (error) {
      console.error(`Error loading translations for ${lang}:`, error);
      // Fallback to English
      const enTranslation = await import(`@/translations/en.json`);
      setTranslations(enTranslation.default);
    }
  };

  const changeTheme = async (themeName) => {
    const selectedTheme = THEMES[Object.keys(THEMES).find(key => THEMES[key].name === themeName)];
    if (selectedTheme) {
      setTheme(selectedTheme);
      applyThemeToDOM(selectedTheme);
      localStorage.setItem('scout-theme', Object.keys(THEMES).find(key => THEMES[key].name === themeName));

      // Save to user account if authenticated
      try {
        const user = await base44.auth.me();
        if (user) {
          await base44.auth.updateMe({ theme: themeName });
        }
      } catch (error) {
        console.log('Not authenticated, theme saved locally only');
      }
    }
  };

  const changeLanguage = async (lang) => {
    setLanguage(lang);
    await loadTranslations(lang);
    localStorage.setItem('scout-language', lang);

    // Save to user account if authenticated
    try {
      const user = await base44.auth.me();
      if (user) {
        await base44.auth.updateMe({ language: lang });
      }
    } catch (error) {
      console.log('Not authenticated, language saved locally only');
    }
  };

  const t = (key, defaultValue = key) => {
    const keys = key.split('.');
    let value = translations;
    
    for (const k of keys) {
      if (value && typeof value === 'object') {
        value = value[k];
      } else {
        return defaultValue;
      }
    }
    
    return value || defaultValue;
  };

  const value = {
    theme,
    changeTheme,
    availableThemes: Object.values(THEMES).map(t => t.name),
    language,
    changeLanguage,
    t,
    translations,
    isLoading,
  };

  return (
    <ThemeContext.Provider value={value}>
      <LanguageContext.Provider value={value}>
        {children}
      </LanguageContext.Provider>
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within ThemeProvider');
  }
  return context;
};
