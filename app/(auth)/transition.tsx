import React, { useEffect } from 'react';
import { useRouter } from 'expo-router';
import SplashScreen from '@/components/SplashScreen';

export default function TransitionScreen() {
  const router = useRouter();

  useEffect(() => {
    // Simulate loading time and then redirect to tabs
    const timer = setTimeout(() => {
      router.replace('/(tabs)');
    }, 2000); // 2 seconds delay for splash screen

    return () => clearTimeout(timer);
  }, [router]);

  return <SplashScreen />;
}