import React, { useEffect, useState } from 'react';
import { useRouter, useFocusEffect } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import SplashScreen from '@/components/SplashScreen';

export default function Index() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [hasRedirected, setHasRedirected] = useState(false);

  // Use useFocusEffect to handle routing when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      if (loading || hasRedirected) return;

      const handleRouting = () => {
        setHasRedirected(true);

  
        if (user) {
          // User is logged in, check if they have completed onboarding
          const hasCompletedOnboarding = user.profile &&
            user.profile.gender &&
            user.profile.weight &&
            user.profile.age;

          if (!hasCompletedOnboarding) {
            console.log('User needs onboarding, redirecting...');
            router.replace('/(auth)/onboarding');
          } else {
            console.log('User has completed onboarding, redirecting to tabs...');
            router.replace('/(auth)/transition');
          }
        } else {
          console.log('User not logged in, redirecting to welcome...');
          router.replace('/(auth)/welcome');
        }
      };

      // Add a small delay to ensure auth state is properly loaded
      const timeoutId = setTimeout(handleRouting, 100);

      return () => clearTimeout(timeoutId);
    }, [user, loading, hasRedirected, router])
  );

  // Show splash screen while checking auth state or during redirect
  if (loading || !hasRedirected) {
    return <SplashScreen />;
  }

  // Return empty view after redirecting
  return null;
}
