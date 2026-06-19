/**
 * lib/AuthContext.jsx  –  replaces the Base44 AuthContext
 *
 * Provides:
 *   useAuth() → { user, isLoadingAuth, isAuthenticated, login, logout, updateMe }
 */
import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth } from '@/api/auth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]               = useState(null);
  const [isLoadingAuth, setLoading]   = useState(true);
  const [authError, setAuthError]     = useState(null);

  // On mount, try to restore the session from the stored token
  useEffect(() => {
    if (!auth.isAuthenticated()) {
      setLoading(false);
      setAuthError({ type: 'auth_required' });
      return;
    }
    auth.me()
      .then((u) => { setUser(u); setAuthError(null); })
      .catch(() => {
        localStorage.removeItem('auth_token');
        setAuthError({ type: 'auth_required' });
      })
      .finally(() => setLoading(false));
  }, []);

  const login = async (email, password) => {
    const u = await auth.login(email, password);
    setUser(u);
    setAuthError(null);
    return u;
  };

  const logout = (redirectUrl) => {
    setUser(null);
    auth.logout(redirectUrl);
  };

  const updateMe = async (data) => {
    const updated = await auth.updateMe(data);
    setUser((prev) => ({ ...prev, ...updated }));
    return updated;
  };

  const navigateToLogin = () => auth.redirectToLogin(window.location.pathname);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoadingAuth,
        isLoadingPublicSettings: false,   // compat shim
        authError,
        isAuthenticated: !!user,
        login,
        logout,
        updateMe,
        navigateToLogin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}