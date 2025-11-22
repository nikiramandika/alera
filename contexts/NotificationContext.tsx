import React, { createContext, useContext, useEffect, useState } from 'react';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { useAuth } from './AuthContext';
import {
  notificationSettingsService,
  scheduledNotificationsService,
  notificationTemplates
} from '@/services';

interface NotificationContextType {
  requestPermissions: () => Promise<boolean>;
  scheduleNotification: (title: string, body: string, trigger: Notifications.NotificationTriggerInput) => Promise<string | null>;
  cancelNotification: (identifier: string) => Promise<void>;
  getScheduledNotifications: () => Promise<Notifications.NotificationRequest[]>;
  createMedicationReminder: (medicineName: string, time: string, medicineId: string) => Promise<string | null>;
  createHabitReminder: (habitName: string, time: string, habitId: string) => Promise<string | null>;
  showImmediateNotification: (title: string, body: string) => Promise<void>;
  // Database integration methods
  getNotificationSettings: () => Promise<any>;
  updateNotificationSettings: (settings: any) => Promise<{ success: boolean; error?: string }>;
  saveScheduledNotification: (notification: any) => Promise<string>;
  getScheduledNotificationsFromDB: () => Promise<any[]>;
  deleteScheduledNotification: (notificationId: string) => Promise<void>;
  getNotificationTemplates: () => Promise<any[]>;
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
    trigger: Notifications.NotificationTriggerInput
  ): Promise<string | null> => {
    try {
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
        priority: 'high',
        categoryId: Platform.OS === 'android' ? 'default' : undefined,
      });

      return id;
    } catch (error) {
      console.error('Error scheduling notification:', error);
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

  const getScheduledNotifications = async (): Promise<Notifications.NotificationRequest[]> => {
    try {
      return await Notifications.getAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Error getting scheduled notifications:', error);
      return [];
    }
  };

  const createMedicationReminder = async (
    medicineName: string,
    time: string,
    medicineId: string
  ): Promise<string | null> => {
    try {
      // Parse time to get hours and minutes
      const [hours, minutes] = time.split(':').map(Number);

      // Schedule for daily at specific time
      const trigger = {
        type: 'daily' as const,
        hour: hours,
        minute: minutes,
      };

      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: '💊 Medicine Reminder',
          body: `Time to take ${medicineName}`,
          data: {
            type: 'medicine',
            medicineId,
            medicineName,
          },
          sound: 'default',
        },
        trigger,
        priority: 'high',
        categoryId: Platform.OS === 'android' ? 'medicine-reminders' : undefined,
      });

      return id;
    } catch (error) {
      console.error('Error creating medication reminder:', error);
      return null;
    }
  };

  const createHabitReminder = async (
    habitName: string,
    time: string,
    habitId: string
  ): Promise<string | null> => {
    try {
      // Parse time to get hours and minutes
      const [hours, minutes] = time.split(':').map(Number);

      // Schedule for daily at specific time
      const trigger = {
        type: 'daily' as const,
        hour: hours,
        minute: minutes,
      };

      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: '💪 Habit Reminder',
          body: `Time for ${habitName}`,
          data: {
            type: 'habit',
            habitId,
            habitName,
          },
          sound: 'default',
        },
        trigger,
        priority: 'high',
        categoryId: Platform.OS === 'android' ? 'habit-reminders' : undefined,
      });

      return id;
    } catch (error) {
      console.error('Error creating habit reminder:', error);
      return null;
    }
  };

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
        priority: 'high',
      });
    } catch (error) {
      console.error('Error showing immediate notification:', error);
    }
  };

  // Database integration methods
  const getNotificationSettings = async () => {
    if (!user) return null;
    try {
      return await notificationSettingsService.getNotificationSettings(user.userId);
    } catch (error) {
      console.error('Error getting notification settings:', error);
      return null;
    }
  };

  const updateNotificationSettings = async (settings: any): Promise<{ success: boolean; error?: string }> => {
    if (!user) return { success: false, error: 'User not authenticated' };
    try {
      await notificationSettingsService.updateNotificationSettings(user.userId, settings);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const saveScheduledNotification = async (notification: any): Promise<string> => {
    if (!user) throw new Error('User not authenticated');
    return await scheduledNotificationsService.createScheduledNotification(user.userId, notification);
  };

  const getScheduledNotificationsFromDB = async (): Promise<any[]> => {
    if (!user) return [];
    try {
      return await scheduledNotificationsService.getScheduledNotifications(user.userId);
    } catch (error) {
      console.error('Error getting scheduled notifications from DB:', error);
      return [];
    }
  };

  const deleteScheduledNotification = async (notificationId: string): Promise<void> => {
    if (!user) throw new Error('User not authenticated');
    await scheduledNotificationsService.deleteScheduledNotification(user.userId, notificationId);
  };

  const getNotificationTemplates = async (): Promise<any[]> => {
    try {
      return await notificationTemplates.getNotificationTemplates();
    } catch (error) {
      console.error('Error getting notification templates:', error);
      return [];
    }
  };

  const value: NotificationContextType = {
    requestPermissions,
    scheduleNotification,
    cancelNotification,
    getScheduledNotifications,
    createMedicationReminder,
    createHabitReminder,
    showImmediateNotification,
    // Database integration methods
    getNotificationSettings,
    updateNotificationSettings,
    saveScheduledNotification,
    getScheduledNotificationsFromDB,
    deleteScheduledNotification,
    getNotificationTemplates,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};