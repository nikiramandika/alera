import React from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#84CC16" />
      </View>
    );
  }

  if (!user) {
    // If no user, show a message instead of redirecting
    // The routing should be handled by the index.tsx file
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <Text style={{ textAlign: 'center', color: '#666', marginBottom: 20 }}>
          You need to be logged in to access this content.
        </Text>
        <Text style={{ textAlign: 'center', color: '#999', fontSize: 12 }}>
          Please sign in to continue using the app.
        </Text>
      </View>
    );
  }

  return <>{children}</>;
}