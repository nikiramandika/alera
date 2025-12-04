import { Stack } from 'expo-router';
import React from 'react';

export default function HabitsLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="add" options={{ presentation: 'modal' }} />
      <Stack.Screen name="create-step1" options={{ presentation: 'modal' }} />
      <Stack.Screen name="create-step2" options={{ presentation: 'card' }} />
    </Stack>
  );
}