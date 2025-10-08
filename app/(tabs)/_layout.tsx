import {
  Icon,
  Label,
  NativeTabs,
} from "expo-router/unstable-native-tabs";
import React from "react";

export default function TabLayout() {
  return (
    <NativeTabs>
      <NativeTabs.Trigger name="index">
        <Label>Home</Label>
        <Icon sf={"house.fill"} />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="medication">
        <Label>Medication</Label>
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
      <NativeTabs.Trigger name="family">
        <Label>Family</Label>
        <Icon sf={"person.2.fill"} />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
