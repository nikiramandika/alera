import {
  Icon,
  Label,
  NativeTabs,
} from "expo-router/unstable-native-tabs";
import React from "react";
import { ActivityIndicator } from "react-native";
import { useAuth } from "@/contexts/AuthContext";
import { SafeAreaView } from "react-native-safe-area-context";

export default function TabLayout() {
  const { user, loading } = useAuth();

  // Only show loading state while checking auth
  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#84CC16" />
      </SafeAreaView>
    );
  }

  // If no user, don't render anything - let the routing be handled by index.tsx
  if (!user) {
    return null;
  }

  // User is authenticated, show tabs
  return (
      <NativeTabs>
        <NativeTabs.Trigger name="index">
          <Label>Home</Label>
          <Icon sf={"house.fill"} />
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="medicine">
          <Label>Medicine</Label>
          <Icon sf={"pills.fill"} />
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="habits">
          <Label>Habits</Label>
          <Icon sf={"heart.fill"} />
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="analytics">
          <Label>Analytics</Label>
          <Icon sf={"chart.bar.fill"} />
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="profile">
          <Label>Profile</Label>
          <Icon sf={"person.fill"} />
        </NativeTabs.Trigger>
      </NativeTabs>
  );
}
