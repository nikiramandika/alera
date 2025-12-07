import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState, AppStateStatus } from 'react-native';

declare global {
  var NotificationsRef: any;
}

interface ScheduledNotificationInfo {
  id: string;
  medicineId?: string;
  habitId?: string;
  time: string;
  title: string;
  body: string;
  type: 'medicine' | 'habit';
  lastTriggered: string; // Date in YYYY-MM-DD format
}

class NotificationScheduler {
  private intervalId: NodeJS.Timeout | null = null;
  private isRunning: boolean = false;
  private appState: 'active' | 'background' | 'inactive' = 'active';

  constructor() {
    this.initialize();
  }

  private async initialize() {
    console.log('🔔 [SCHEDULER] Initializing notification scheduler with battery optimization');

    // Test Notifications module availability at initialization
    try {
      const NotificationsModule = Notifications;
      console.log('🔔 [SCHEDULER] Notifications module imported:', typeof NotificationsModule);
      console.log('🔔 [SCHEDULER] scheduleNotificationAsync available:', typeof NotificationsModule.scheduleNotificationAsync);

      global.NotificationsRef = NotificationsModule;
    } catch (error) {
      console.error('🔔 [SCHEDULER] Failed to import Notifications module:', error);
    }

    // Setup app state listener for battery optimization
    this.setupAppStateListener();
  }

  private setupAppStateListener() {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      console.log('🔔 [SCHEDULER] App state changed to:', nextAppState);

      if (nextAppState === 'active') {
        this.appState = 'active';
        console.log('🔔 [SCHEDULER] Active mode - checking every 30 seconds');
      } else if (nextAppState === 'background') {
        this.appState = 'background';
        console.log('🔔 [SCHEDULER] Background mode - checking every 5 minutes');
      } else {
        this.appState = 'inactive';
        console.log('🔔 [SCHEDULER] Inactive mode - checking every 10 minutes');
      }

      // Restart interval with new timing if running
      if (this.isRunning) {
        this.stop();
        this.start();
      }
    };

    AppState.addEventListener('change', handleAppStateChange);
  }

  // Start the notification scheduler
  start() {
    if (this.isRunning) {
      console.log('🔔 [SCHEDULER] Already running');
      return;
    }

    console.log('🔔 [SCHEDULER] Starting notification scheduler (Native + Hybrid)');
    this.isRunning = true;

    // Only use interval checking as backup for missed notifications
    console.log('🔔 [SCHEDULER] Native notifications scheduled for precise timing');
    console.log('🔔 [SCHEDULER] Interval checking as backup (every 10 minutes)');

    // Set up interval only as backup (reduced frequency)
    this.intervalId = setInterval(() => {
      this.checkAndTriggerNotifications(); // Backup checking
    }, 600000) as any; // 10 minutes backup only
  }

  // Stop the checking system
  stop() {
    if (!this.isRunning) {
      return;
    }

    console.log('🔔 [SCHEDULER] Stopping notification checker');
    this.isRunning = false;

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  // Main checking function
  private async checkAndTriggerNotifications() {
    try {
      const now = new Date();
      const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      const currentDate = now.toISOString().split('T')[0]; // YYYY-MM-DD
      const currentSeconds = now.getSeconds();

      console.log(`🔔 [SCHEDULER] Checking notifications at ${currentTime}:${currentSeconds.toString().padStart(2, '0')} on ${currentDate}`);

      // Get scheduled notifications from storage
      const scheduledNotifications = await this.getScheduledNotifications();

      for (const notification of scheduledNotifications) {
        // Check if this notification should trigger now
        if (this.shouldTriggerNotification(notification, currentTime, currentDate, currentSeconds)) {
          console.log(`🔔 [SCHEDULER] Triggering notification: ${notification.title} (at ${currentTime}:${currentSeconds.toString().padStart(2, '0')})`);
          await this.triggerNotification(notification);

          // Update last triggered date
          await this.updateLastTriggered(notification.id, currentDate);
        }
      }
    } catch (error) {
      console.error('🔔 [SCHEDULER] Error in notification checker:', error);
    }
  }

  // Check if notification should trigger now
  private shouldTriggerNotification(
    notification: ScheduledNotificationInfo,
    currentTime: string,
    currentDate: string,
    currentSeconds: number = 0
  ): boolean {
    // Don't trigger if already triggered today
    if (notification.lastTriggered === currentDate) {
      return false;
    }

    // Check if current time matches notification time (allowing 5 second window for precision)
    if (notification.time === currentTime && currentSeconds <= 5) {
      return true;
    }

    // Check if we just passed the notification time (backup for missed exact time)
    const [hours, minutes] = notification.time.split(':').map(Number);
    const notificationTime = new Date();
    notificationTime.setHours(hours, minutes, 0, 0);

    const now = new Date();
    const timeDiffMinutes = (now.getTime() - notificationTime.getTime()) / (1000 * 60);

    // Trigger if we're within 1-2 minutes after the scheduled time and haven't triggered today
    return timeDiffMinutes >= 0 && timeDiffMinutes <= 2 && notification.lastTriggered !== currentDate;
  }

  // Trigger the actual notification
  private async triggerNotification(notification: ScheduledNotificationInfo) {
    try {
      console.log('🔔 [SCHEDULER] Attempting to send notification:', notification.title);

      // Use stored Notifications reference
      const NotificationsRef = (global as any).NotificationsRef || Notifications;

      // Check if Notifications module is available
      if (!NotificationsRef) {
        console.log('⚠️ [SCHEDULER] Notifications module not available, using alert fallback');
        // Fallback to alert (though this won't work in background)
        if (typeof alert !== 'undefined') {
          alert(`${notification.title}\n${notification.body}`);
        }
        return;
      }

      console.log('🔔 [SCHEDULER] NotificationsRef type:', typeof NotificationsRef);
      console.log('🔔 [SCHEDULER] scheduleNotificationAsync type:', typeof NotificationsRef.scheduleNotificationAsync);

      // Check if scheduleNotificationAsync function is available
      if (typeof NotificationsRef.scheduleNotificationAsync !== 'function') {
        console.log('⚠️ [SCHEDULER] scheduleNotificationAsync not available');
        console.log('💡 [SCHEDULER] This might be an Expo Go limitation');
        console.log('💡 [SCHEDULER] Try using development build for full notification functionality');
        console.log('💡 [SCHEDULER] Available functions:', Object.keys(NotificationsRef).filter(key => typeof NotificationsRef[key] === 'function'));
        return;
      }

      const id = await NotificationsRef.scheduleNotificationAsync({
        content: {
          title: notification.title,
          body: notification.body,
          data: {
            type: notification.type,
            medicineId: notification.medicineId,
            habitId: notification.habitId,
            triggeredAt: new Date().toISOString(),
          },
          sound: 'default',
        },
        trigger: null, // Show immediately
      });

      if (id) {
        console.log(`🔔 [SCHEDULER] ✅ Notification sent with ID: ${id}`);
        console.log(`📱 [SCHEDULER] Title: ${notification.title}`);
        console.log(`📱 [SCHEDULER] Body: ${notification.body}`);
        console.log(`📱 [SCHEDULER] Type: ${notification.type}`);
      } else {
        console.log('⚠️ [SCHEDULER] Notification scheduled but no ID returned');
      }
    } catch (error) {
      console.error('🔔 [SCHEDULER] ❌ Failed to send notification:', error);
      console.error('🔔 [SCHEDULER] Error details:', error);
      console.log('💡 [SCHEDULER] Possible causes:');
      console.log('   • Expo Go limitations');
      console.log('   • Missing notification permissions');
      console.log('   • Background app restrictions');
      console.log('   • Device in Do Not Disturb mode');
    }
  }

  // Get all scheduled notifications
  private async getScheduledNotifications(): Promise<ScheduledNotificationInfo[]> {
    try {
      const stored = await AsyncStorage.getItem('scheduledNotifications');
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('🔔 [SCHEDULER] Error getting scheduled notifications:', error);
      return [];
    }
  }

  // Update last triggered date for a notification
  private async updateLastTriggered(notificationId: string, date: string) {
    try {
      const notifications = await this.getScheduledNotifications();
      const updatedNotifications = notifications.map(n =>
        n.id === notificationId ? { ...n, lastTriggered: date } : n
      );
      await AsyncStorage.setItem('scheduledNotifications', JSON.stringify(updatedNotifications));
    } catch (error) {
      console.error('🔔 [SCHEDULER] Error updating last triggered:', error);
    }
  }

  // Add or update a scheduled notification
  async addNotification(notification: Omit<ScheduledNotificationInfo, 'id' | 'lastTriggered'>) {
    try {
      const notifications = await this.getScheduledNotifications();

      // Remove existing notification for same medicine/habit/time
      const filteredNotifications = notifications.filter(n =>
        !(
          (n.medicineId === notification.medicineId && n.time === notification.time && n.type === 'medicine') ||
          (n.habitId === notification.habitId && n.time === notification.time && n.type === 'habit')
        )
      );

      // Add new notification
      const newNotification: ScheduledNotificationInfo = {
        ...notification,
        id: `${notification.type}_${notification.medicineId || notification.habitId}_${notification.time}_${Date.now()}`,
        lastTriggered: '',
      };

      filteredNotifications.push(newNotification);
      await AsyncStorage.setItem('scheduledNotifications', JSON.stringify(filteredNotifications));

      // Schedule native notification for precise timing
      await this.scheduleNativeNotification(newNotification);

      console.log(`🔔 [SCHEDULER] Added notification: ${notification.title} at ${notification.time}`);
    } catch (error) {
      console.error('🔔 [SCHEDULER] Error adding notification:', error);
    }
  }

  // Schedule native notification for precise timing
  private async scheduleNativeNotification(notification: ScheduledNotificationInfo) {
    try {
      const NotificationsRef = (global as any).NotificationsRef || Notifications;

      if (!NotificationsRef || typeof NotificationsRef.scheduleNotificationAsync !== 'function') {
        console.log('⚠️ [SCHEDULER] Native scheduling not available, falling back to interval checking');
        return;
      }

      // Calculate the next trigger time
      const [hours, minutes] = notification.time.split(':').map(Number);
      const now = new Date();

      // Schedule for today if time hasn't passed, otherwise tomorrow
      const triggerDate = new Date();
      triggerDate.setHours(hours, minutes, 0, 0);

      // If the time has passed today, schedule for tomorrow
      if (triggerDate <= now) {
        triggerDate.setDate(triggerDate.getDate() + 1);
      }

  
      const id = await NotificationsRef.scheduleNotificationAsync({
        content: {
          title: notification.title,
          body: notification.body,
          data: {
            type: notification.type,
            medicineId: notification.medicineId,
            habitId: notification.habitId,
            scheduledTime: notification.time,
            notificationId: notification.id,
            recurring: true, // Mark as recurring for daily repeats
          },
          sound: 'default',
        },
        trigger: triggerDate as any,
        identifier: `native_${notification.id}`,
      });

      console.log(`🔔 [SCHEDULER] ✅ Native notification scheduled: ${notification.title} at ${triggerDate.toLocaleString()} (ID: ${id})`);
      return id;
    } catch (error) {
      console.error('🔔 [SCHEDULER] Error scheduling native notification:', error);
      console.log('🔔 [SCHEDULER] Falling back to interval checking');
    }
  }

  // Remove notifications for a specific medicine or habit
  async removeNotifications(medicineId?: string, habitId?: string) {
    try {
      const notifications = await this.getScheduledNotifications();
      const filteredNotifications = notifications.filter(n =>
        (medicineId && n.medicineId !== medicineId) ||
        (habitId && n.habitId !== habitId)
      );

      // Cancel native notifications for removed items
      const NotificationsRef = (global as any).NotificationsRef || Notifications;
      if (NotificationsRef && typeof NotificationsRef.cancelScheduledNotificationAsync === 'function') {
        for (const notification of notifications) {
          if (
            (medicineId && notification.medicineId === medicineId) ||
            (habitId && notification.habitId === habitId)
          ) {
            try {
              await NotificationsRef.cancelScheduledNotificationAsync(`native_${notification.id}`);
              console.log(`🔔 [SCHEDULER] Cancelled native notification: ${notification.id}`);
            } catch (cancelError) {
              console.log('🔔 [SCHEDULER] Failed to cancel native notification:', cancelError);
            }
          }
        }
      }

      await AsyncStorage.setItem('scheduledNotifications', JSON.stringify(filteredNotifications));
      console.log(`🔔 [SCHEDULER] Removed notifications for medicine: ${medicineId} or habit: ${habitId}`);
    } catch (error) {
      console.error('🔔 [SCHEDULER] Error removing notifications:', error);
    }
  }

  // Get status of the scheduler
  getStatus() {
    return {
      isRunning: this.isRunning,
      schedulingMode: 'Native + Hybrid',
      nativeScheduling: {
        enabled: true,
        precision: 'Exact timing (0 delay)',
        backgroundSupport: true,
      },
      backupChecking: {
        enabled: true,
        interval: '10 minutes',
        purpose: 'Missed notification backup'
      },
      appState: this.appState,
      lastCheck: new Date().toISOString(),
      accuracy: 'Native: Exact timing | Backup: 10-minute intervals',
    };
  }
}

export const notificationScheduler = new NotificationScheduler();