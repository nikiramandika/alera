import { Stack } from 'expo-router';
import React from 'react';

export default function HabitsLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen
        name="category"
        options={{
          headerLargeTitle: true,
          headerTransparent: true,
          title: "Pilih Kategori",
          headerBackButtonDisplayMode: "minimal"
        }}
      />
      <Stack.Screen
        name="manage"
        options={{
          headerLargeTitle: true,
          headerTransparent: true,
          title: "Manage Habits",
          headerBackButtonDisplayMode: "minimal"
        }}
      />
    </Stack>
  );
}