import React, { createContext, useState, useContext, useEffect } from 'react';
import { base44 } from '@/api/base44Client';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser]                                       = useState(null);
  const [isAuthenticated, setIsAuthenticated]                 = useState(false);
  const [isLoadingAuth, setIsLoadingAuth]                     = useState(true);
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(true);
  const [authError, setAuthError]                             = useState(null);

  const loadUser = async () => {
    try {
      const profile = await base44.auth.me();
      setUser(profile);
      setIsAuthenticated(true);
      setAuthError(null);
    } catch (err) {
      setIsAuthenticated(false);
      setUser(null);
      if (err?.status === 401 || err?.message?.includes('auth')) {
        setAuthError({ type: 'auth_required', message: 'Authentication required' });
      } else {
        setAuthError({ type: 'auth_required', message: err.message });
      }
    } finally {
      setIsLoadingAuth(false);
      setIsLoadingPublicSettings(false);
    }
  };

  useEffect(() => {
    loadUser();
  }, []);

  const logout = (redirectUrl) => {
    base44.auth.logout(redirectUrl);
  };

  const navigateToLogin = () => {
    base44.auth.redirectToLogin(window.location.pathname);
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      isLoadingAuth,
      isLoadingPublicSettings,
      authError,
      logout,
      navigateToLogin,
      checkAppState: loadUser,
      setUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};