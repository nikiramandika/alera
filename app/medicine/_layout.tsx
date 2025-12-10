import { Stack } from 'expo-router';
import React from 'react';

export default function MedicineLayout() {
  return (
    <Stack 
      screenOptions={{ 
        headerShown: false,
        animation: 'fade',
      }}
    >
      <Stack.Screen 
        name="add-step1" 
        options={{ 
          presentation: 'modal',
          gestureEnabled: true,
        }} 
      />
      <Stack.Screen 
        name="add-step2" 
        options={{ 
          presentation: 'card',
          gestureEnabled: true,
        }} 
      />
      <Stack.Screen 
        name="add" 
        options={{ 
          presentation: 'modal',
        }} 
      />
      <Stack.Screen 
        name="detail" 
        options={{ 
          presentation: 'fullScreenModal',
        }} 
      />
    </Stack>
  );
}