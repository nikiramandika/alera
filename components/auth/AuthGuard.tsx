import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  // Simulate authentication check
  const isAuthenticated = true; // Replace with actual authentication logic

  if (!isAuthenticated) {
    router.replace('/screens/auth/LoginScreen');
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#4A90E2" />
      </View>
    );
  }

  return <>{children}</>;
}