import { Stack } from 'expo-router';
import React from 'react';

export default function MedicineLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="add" options={{ presentation: 'modal' }} />
      <Stack.Screen name="detail" options={{ presentation: 'modal' }} />
    </Stack>
  );
}