import { Stack } from 'expo-router';

export default function TasksLayout() {
  return (
    <Stack>
      <Stack.Screen name="complete" options={{
        headerShown: false,
        presentation: 'modal'
      }} />
    </Stack>
  );
}