import React, { useEffect, useState } from 'react';
import { useRouter, useFocusEffect } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import SplashScreen from '@/components/SplashScreen';

export default function Index() {
  const router = useRouter();
  const { user, loading, isOffline } = useAuth();
  const [hasRedirected, setHasRedirected] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);

  // Use useFocusEffect to handle routing when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      if (loading || hasRedirected) return;

      const handleRouting = () => {
        setHasRedirected(true);
        setIsCheckingSession(false);

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
            router.replace('/(tabs)');
          }
        } else {
          console.log('User not logged in, redirecting to welcome...');
          router.replace('/(auth)/welcome');
        }
      };

      // Immediate routing to reduce delay
      const timeoutId = setTimeout(handleRouting, 10);

      return () => clearTimeout(timeoutId);
    }, [user, loading, hasRedirected, router])
  );

  // Show unified loading state while checking session or initializing auth
  if (loading || (isCheckingSession && !hasRedirected)) {
    return <SplashScreen />;
  }

  // Return loading view after redirecting to prevent blank screen
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#ffffff' }}>
      <ActivityIndicator size="large" color="#0EA5E9" />
    </View>
  );
}
