import React, { useEffect, useState } from 'react';
import { useRouter, useFocusEffect } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';

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

        // Get current route to prevent unnecessary redirects
        const currentRoute = router.pathname || '';

        if (user) {
          // User is logged in, check if they have completed onboarding
          const hasCompletedOnboarding = user.profile &&
            user.profile.gender &&
            user.profile.weight &&
            user.profile.age;

          if (!hasCompletedOnboarding) {
            // Only redirect if not already on onboarding or auth screens
            if (!currentRoute.includes('/screens/auth/')) {
              console.log('User needs onboarding, redirecting...');
              router.replace('/screens/auth/OnboardingScreen');
            }
          } else {
            // Only redirect if not already on tabs
            if (!currentRoute.includes('/(tabs)')) {
              console.log('User has completed onboarding, redirecting to tabs...');
              router.replace('/(tabs)');
            }
          }
        } else {
          // Only redirect if not already on welcome or other auth screens
          if (!currentRoute.includes('/screens/auth/')) {
            console.log('User not logged in, redirecting to welcome...');
            router.replace('/screens/auth/WelcomeScreen');
          }
        }
      };

      // Add a small delay to ensure auth state is properly loaded
      const timeoutId = setTimeout(handleRouting, 100);

      return () => clearTimeout(timeoutId);
    }, [user, loading, hasRedirected, router])
  );

  // Show loading screen while checking auth state
  if (loading || !hasRedirected) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#84CC16" />
      </View>
    );
  }

  // Return empty view after redirecting
  return null;
}
