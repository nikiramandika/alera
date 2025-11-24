import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import NotificationTest from '@/components/NotificationTest';

export default function TestNotificationsScreen() {
  return (
    <>
      <Stack.Screen
        options={{
          title: 'Test Notifications',
          headerStyle: {
            backgroundColor: '#F47B9F',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      />
      <NotificationTest />
      <StatusBar style="auto" />
    </>
  );
}