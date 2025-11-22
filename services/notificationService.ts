import AsyncStorage from '@react-native-async-storage/async-storage';

// Notification Settings Types
export interface NotificationSettings {
  medicineReminders: boolean;
  habitReminders: boolean;
  appointmentReminders: boolean;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  doNotDisturb: boolean;
  quietHours: {
    enabled: boolean;
    startTime: string;
    endTime: string;
  };
}

export interface ScheduledNotification {
  id: string;
  title: string;
  body: string;
  scheduledTime: Date;
  type: 'medicine' | 'habit' | 'appointment';
  data?: any;
  recurring?: {
    frequency: 'daily' | 'weekly' | 'monthly';
    interval: number;
  };
}

// Default notification settings
export const defaultNotificationSettings: NotificationSettings = {
  medicineReminders: true,
  habitReminders: true,
  appointmentReminders: true,
  soundEnabled: true,
  vibrationEnabled: true,
  doNotDisturb: false,
  quietHours: {
    enabled: false,
    startTime: '22:00',
    endTime: '07:00'
  }
};

// Notification templates
export const notificationTemplates = {
  medicine: {
    reminder: (medicineName: string, dosage: string) => ({
      title: 'Medicine Reminder',
      body: `Time to take ${medicineName} - ${dosage}`
    }),
    missed: (medicineName: string) => ({
      title: 'Missed Medicine',
      body: `You missed your dose of ${medicineName}`
    }),
    refill: (medicineName: string) => ({
      title: 'Refill Reminder',
      body: `Time to refill ${medicineName}`
    })
  },
  habit: {
    reminder: (habitName: string) => ({
      title: 'Habit Reminder',
      body: `Don't forget to ${habitName}!`
    }),
    achievement: (habitName: string, streak: number) => ({
      title: 'Great job!',
      body: `${streak} day streak for ${habitName}! 🎉`
    })
  },
  appointment: {
    reminder: (appointmentTitle: string, time: string) => ({
      title: 'Appointment Reminder',
      body: `${appointmentTitle} at ${time}`
    })
  }
};

// Notification Settings Service
export const notificationSettingsService = {
  // Get notification settings
  getSettings: async (): Promise<NotificationSettings> => {
    try {
      const settings = await AsyncStorage.getItem('notificationSettings');
      if (settings) {
        return { ...defaultNotificationSettings, ...JSON.parse(settings) };
      }
      return defaultNotificationSettings;
    } catch (error) {
      console.error('Error getting notification settings:', error);
      return defaultNotificationSettings;
    }
  },

  // Update notification settings
  updateSettings: async (settings: Partial<NotificationSettings>): Promise<NotificationSettings> => {
    try {
      const currentSettings = await notificationSettingsService.getSettings();
      const updatedSettings = { ...currentSettings, ...settings };
      await AsyncStorage.setItem('notificationSettings', JSON.stringify(updatedSettings));
      return updatedSettings;
    } catch (error) {
      console.error('Error updating notification settings:', error);
      throw error;
    }
  },

  // Reset to default settings
  resetSettings: async (): Promise<NotificationSettings> => {
    try {
      await AsyncStorage.setItem('notificationSettings', JSON.stringify(defaultNotificationSettings));
      return defaultNotificationSettings;
    } catch (error) {
      console.error('Error resetting notification settings:', error);
      throw error;
    }
  }
};

// Scheduled Notifications Service
export const scheduledNotificationsService = {
  // Get all scheduled notifications
  getScheduledNotifications: async (): Promise<ScheduledNotification[]> => {
    try {
      const notifications = await AsyncStorage.getItem('scheduledNotifications');
      return notifications ? JSON.parse(notifications) : [];
    } catch (error) {
      console.error('Error getting scheduled notifications:', error);
      return [];
    }
  },

  // Add scheduled notification
  addScheduledNotification: async (notification: Omit<ScheduledNotification, 'id'>): Promise<ScheduledNotification> => {
    try {
      const notifications = await scheduledNotificationsService.getScheduledNotifications();
      const newNotification: ScheduledNotification = {
        ...notification,
        id: `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      };
      notifications.push(newNotification);
      await AsyncStorage.setItem('scheduledNotifications', JSON.stringify(notifications));
      return newNotification;
    } catch (error) {
      console.error('Error adding scheduled notification:', error);
      throw error;
    }
  },

  // Remove scheduled notification
  removeScheduledNotification: async (id: string): Promise<void> => {
    try {
      const notifications = await scheduledNotificationsService.getScheduledNotifications();
      const filteredNotifications = notifications.filter(n => n.id !== id);
      await AsyncStorage.setItem('scheduledNotifications', JSON.stringify(filteredNotifications));
    } catch (error) {
      console.error('Error removing scheduled notification:', error);
      throw error;
    }
  },

  // Clear all scheduled notifications
  clearAllScheduledNotifications: async (): Promise<void> => {
    try {
      await AsyncStorage.removeItem('scheduledNotifications');
    } catch (error) {
      console.error('Error clearing scheduled notifications:', error);
      throw error;
    }
  },

  // Update scheduled notification
  updateScheduledNotification: async (id: string, updates: Partial<ScheduledNotification>): Promise<ScheduledNotification | null> => {
    try {
      const notifications = await scheduledNotificationsService.getScheduledNotifications();
      const index = notifications.findIndex(n => n.id === id);
      if (index !== -1) {
        notifications[index] = { ...notifications[index], ...updates };
        await AsyncStorage.setItem('scheduledNotifications', JSON.stringify(notifications));
        return notifications[index];
      }
      return null;
    } catch (error) {
      console.error('Error updating scheduled notification:', error);
      throw error;
    }
  }
};

// Helper functions
export const notificationHelpers = {
  // Check if a notification should be sent based on quiet hours
  shouldSendNotification: async (notificationTime: Date): Promise<boolean> => {
    const settings = await notificationSettingsService.getSettings();

    if (settings.doNotDisturb) {
      return false;
    }

    if (settings.quietHours.enabled) {
      const currentTime = notificationTime.getHours();
      const [startHour] = settings.quietHours.startTime.split(':').map(Number);
      const [endHour] = settings.quietHours.endTime.split(':').map(Number);

      if (startHour > endHour) {
        // Quiet hours span midnight (e.g., 22:00 to 07:00)
        return currentTime >= endHour && currentTime < startHour;
      } else {
        // Normal quiet hours (e.g., 23:00 to 06:00)
        return currentTime < startHour || currentTime >= endHour;
      }
    }

    return true;
  },

  // Get next valid notification time based on quiet hours
  getNextValidNotificationTime: async (requestedTime: Date): Promise<Date> => {
    const settings = await notificationSettingsService.getSettings();
    const nextValidTime = new Date(requestedTime);

    if (settings.quietHours.enabled && !await notificationHelpers.shouldSendNotification(requestedTime)) {
      const [endHour, endMinute] = settings.quietHours.endTime.split(':').map(Number);
      nextValidTime.setHours(endHour, endMinute, 0, 0);

      // If the end time is earlier in the day than current time, move to next day
      if (nextValidTime <= requestedTime) {
        nextValidTime.setDate(nextValidTime.getDate() + 1);
      }
    }

    return nextValidTime;
  }
};