import React, { createContext, useContext, useEffect, useState } from 'react';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { useAuth } from './AuthContext';
import { notificationScheduler } from '@/services/notificationScheduler';

interface NotificationContextType {
  requestPermissions: () => Promise<boolean>;
  scheduleNotification: (title: string, body: string, trigger: any) => Promise<string | null>;
  cancelNotification: (identifier: string) => Promise<void>;
  cancelNotificationsByIdentifiers: (identifiers: string[]) => Promise<void>;
  getScheduledNotifications: () => Promise<any[]>;
  showImmediateNotification: (title: string, body: string) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const { user } = useAuth();

  // Initialize notifications
  useEffect(() => {
    initializeNotifications();
  }, []);

  // Start real-time notification scheduler when user is authenticated
  useEffect(() => {
    if (user) {
      console.log('🔔 [SCHEDULER] User authenticated, starting real-time notification checker');
      notificationScheduler.start();

      return () => {
        console.log('🔔 [SCHEDULER] User logged out, stopping notification checker');
        notificationScheduler.stop();
      };
    }
  }, [user]);

  // Log warning about Expo Go limitations
  useEffect(() => {
    if (__DEV__) {
      console.log('⚠️ [INFO] Running in development mode. For full notification functionality:');
      console.log('   • Use development build instead of Expo Go for production testing');
      console.log('   • Some notification features may be limited in Expo Go');
      console.log('   • See: https://docs.expo.dev/develop/development-builds/introduction/');
    }
  }, []);

  const initializeNotifications = async () => {
    try {
      // Request permissions
      await requestPermissions();

      // Set up notification channel for Android
      if (Platform.OS === 'android') {
        Notifications.setNotificationChannelAsync('default', {
          name: 'Default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          sound: 'default',
          enableLights: true,
          enableVibrate: true,
          lightColor: '#F47B9F',
        });

        // Medicine reminders channel
        Notifications.setNotificationChannelAsync('medicine-reminders', {
          name: 'Medicine Reminders',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250, 500, 250, 500, 250],
          sound: 'default',
          enableLights: true,
          enableVibrate: true,
          lightColor: '#F47B9F',
        });

        // Habit reminders channel
        Notifications.setNotificationChannelAsync('habit-reminders', {
          name: 'Habit Reminders',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          sound: 'default',
          enableLights: true,
          enableVibrate: true,
          lightColor: '#4ECDC4',
        });
      }

      // Set notification handler
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: false,
          shouldShowBanner: true,
          shouldShowList: true,
        }),
      });

      // Listen for notification responses for rescheduling
      const subscription = Notifications.addNotificationResponseReceivedListener(response => {
        const notification = response.notification;
        const data = notification.request.content.data;

        console.log('🔔 [DEBUG] Notification received:', notification.request.content.title);

        // Check if this is a recurring notification from our scheduler
        if (data?.recurring && data?.scheduledTime && typeof data.scheduledTime === 'string') {
          console.log('🔄 [DEBUG] Rescheduling recurring notification for time:', data.scheduledTime);

          // Schedule next occurrence for tomorrow
          const [hours, minutes] = data.scheduledTime.split(':').map(Number);
          const tomorrow = new Date();
          tomorrow.setDate(tomorrow.getDate() + 1);
          tomorrow.setHours(hours, minutes, 0, 0);

          Notifications.scheduleNotificationAsync({
            content: {
              title: notification.request.content.title,
              body: notification.request.content.body,
              data: data, // Keep the same data including recurring flag
            },
            trigger: {
              type: 'date' as const,
              date: tomorrow,
            },
          }).then(id => {
            if (id) {
              console.log('✅ [DEBUG] Recurring notification rescheduled for:', tomorrow.toLocaleString());
            } else {
              console.log('❌ [DEBUG] Failed to reschedule recurring notification');
            }
          });
        }
      });

      setIsInitialized(true);
    } catch (error) {
      console.error('Error initializing notifications:', error);
    }
  };

  const requestPermissions = async (): Promise<boolean> => {
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Error requesting notification permissions:', error);
      return false;
    }
  };

  const scheduleNotification = async (
    title: string,
    body: string,
    trigger: any
  ): Promise<string | null> => {
    try {
      // Check if running in Expo Go (limited notification support)
      if (__DEV__ && Platform.OS === 'android') {
        console.log('⚠️ [DEBUG] Scheduling notification in Expo Go may have limitations');
      }

      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data: {
            type: 'custom',
          },
          sound: 'default',
        },
        trigger,
      });

      console.log('✅ [DEBUG] Notification scheduled with ID:', id);
      return id;
    } catch (error) {
      console.error('❌ [DEBUG] Error scheduling notification:', error);

      // Handle Expo Go limitations
      if (__DEV__ && error instanceof Error) {
        console.log('💡 [INFO] This might be due to Expo Go limitations. Try:');
        console.log('   • Using a development build: npx expo install -D expo-dev-client');
        console.log('   • Or running on a physical device');
      }

      return null;
    }
  };

  const cancelNotification = async (identifier: string): Promise<void> => {
    try {
      await Notifications.cancelScheduledNotificationAsync(identifier);
    } catch (error) {
      console.error('Error canceling notification:', error);
    }
  };

  const cancelNotificationsByIdentifiers = async (identifiers: string[]): Promise<void> => {
    try {
      for (const identifier of identifiers) {
        await Notifications.cancelScheduledNotificationAsync(identifier);
      }
    } catch (error) {
      console.error('Error canceling notifications:', error);
    }
  };

  const getScheduledNotifications = async (): Promise<any[]> => {
    try {
      return await Notifications.getAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Error getting scheduled notifications:', error);
      return [];
    }
  };

  // OLD FUNCTIONS DISABLED - Use notificationScheduler instead
  // const createMedicationReminder = async (...): Promise<string | null> => null;
  // const createHabitReminder = async (...): Promise<string | null> => null;

  const showImmediateNotification = async (title: string, body: string): Promise<void> => {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data: {
            type: 'immediate',
          },
          sound: 'default',
        },
        trigger: null, // Show immediately
      });
    } catch (error) {
      console.error('Error showing immediate notification:', error);
    }
  };

  const value: NotificationContextType = {
    requestPermissions,
    scheduleNotification,
    cancelNotification,
    cancelNotificationsByIdentifiers,
    getScheduledNotifications,
    showImmediateNotification,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};