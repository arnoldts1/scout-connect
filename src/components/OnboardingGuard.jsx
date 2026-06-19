import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import PageLoader from './PageLoader';

export default function OnboardingGuard({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [isChecking, setIsChecking] = useState(true);
  const [shouldShowChildren, setShouldShowChildren] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const checkOnboarding = async () => {
      try {
        // Refresh session to ensure we have the latest metadata
        await base44.auth.supabase.auth.refreshSession();

        const currentUser = await base44.auth.me();

        if (!currentUser) {
          // Not authenticated, show children (will be redirected to login elsewhere)
          setShouldShowChildren(true);
          setIsChecking(false);
          return;
        }

        setUser(currentUser);

        const onboardingPath = createPageUrl('Onboarding');
        const loginPath = createPageUrl('Login');
        const signupPath = createPageUrl('Signup');
        const currentPath = location.pathname;

        // Allow access to login/signup pages without onboarding
        if (currentPath === loginPath || currentPath === signupPath) {
          setShouldShowChildren(true);
          setIsChecking(false);
          return;
        }

        // If user hasn't completed onboarding
        if (!currentUser.onboarding_complete) {
          // If already on onboarding page, show it
          if (currentPath === onboardingPath) {
            setShouldShowChildren(true);
            setIsChecking(false);
            return;
          }

          // Force redirect to onboarding
          console.log('User must complete onboarding');
          window.location.href = onboardingPath;
          return;
        }

        // Onboarding is complete, allow access
        setShouldShowChildren(true);
        setIsChecking(false);
      } catch (error) {
        console.error('Error checking onboarding status:', error);
        // If error checking, allow children to render (error handling elsewhere)
        setShouldShowChildren(true);
        setIsChecking(false);
      }
    };

    checkOnboarding();
  }, [navigate, location.pathname]);

  if (isChecking) {
    return <PageLoader />;
  }

  if (!shouldShowChildren) {
    return <PageLoader />;
  }

  return children;
}
