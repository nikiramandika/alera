import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { I18nextProvider } from 'react-i18next';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { AuthProvider } from '@/contexts/AuthContext';
import { MedicineProvider } from '@/contexts/MedicineContext';
import { HabitProvider } from '@/contexts/HabitContext';
import { NotificationProvider } from '@/contexts/NotificationContext';
import '../src/i18n'; // Initialize i18n
import i18n from '../src/i18n';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <I18nextProvider i18n={i18n}>
        <AuthProvider>
          <NotificationProvider>
            <HabitProvider>
              <MedicineProvider>
                <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
                  <Stack>
                    <Stack.Screen name="index" options={{ headerShown: false }} />
                    <Stack.Screen name="(auth)" options={{ headerShown: false }} />
                    <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                    <Stack.Screen name="medicine" options={{ headerShown: false }} />
                    <Stack.Screen name="habits" options={{ headerShown: false }} />
                    <Stack.Screen name="tasks" options={{ headerShown: false }} />
                    <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
                    </Stack>
                  <StatusBar style="auto" />
                </ThemeProvider>
              </MedicineProvider>
            </HabitProvider>
          </NotificationProvider>
        </AuthProvider>
      </I18nextProvider>
    </GestureHandlerRootView>
  );
}
