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
        name="create-step1"
        options={{
          headerLargeTitle: true,
          headerTransparent: true,
          title: "Create Habit - Step 1",
          headerBackButtonDisplayMode: "minimal"
        }}
      />
      <Stack.Screen
        name="create-step2"
        options={{
          headerLargeTitle: true,
          headerTransparent: true,
          title: "Create Habit - Step 2",
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