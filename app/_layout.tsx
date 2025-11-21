import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { AuthProvider } from '@/contexts/AuthContext';
import { MedicineProvider } from '@/contexts/MedicineContext';
import { HabitProvider } from '@/contexts/HabitContext';
import { NotificationProvider } from '@/contexts/NotificationContext';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <HabitProvider>
          <MedicineProvider>
            <NotificationProvider>
              <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
                <Stack>
                  <Stack.Screen name="screens/auth/WelcomeScreen" options={{ headerShown: false }} />
                  <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                  <Stack.Screen name="screens/habits-manage" options={{
                    headerLargeTitle: true,
                    headerTransparent: true,
                    title: "Manage Habits",
                    headerBackButtonDisplayMode: "minimal"
                  }} />
                  <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
                  <Stack.Screen name="screens/auth/LoginScreen" options={{ headerShown: false }} />
                  <Stack.Screen name="screens/auth/RegisterScreen" options={{ headerShown: false }} />
                  <Stack.Screen name="screens/auth/OnboardingScreen" options={{ headerShown: false }} />
                  <Stack.Screen name="screens/medication/AddMedicineScreen" options={{
                    headerLargeTitle: true,
                    title: "Add Medicine",
                    headerBackButtonDisplayMode: "minimal"
                  }} />
                </Stack>
                <StatusBar style="auto" />
              </ThemeProvider>
            </NotificationProvider>
          </MedicineProvider>
        </HabitProvider>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}
