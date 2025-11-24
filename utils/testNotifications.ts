import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

export const testNotification = async () => {
  try {
    // Check if permissions are granted
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') {
      console.log('❌ Notification permissions not granted');
      return false;
    }

    // Schedule a test notification 10 seconds from now
    const futureTime = new Date(Date.now() + 10000); // 10 seconds from now
    console.log('🔍 [TEST] Scheduling test notification for:', futureTime.toISOString());

    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: '🔔 Test Notification',
        body: 'This is a test notification from Alera! (10 seconds from now)',
        data: {
          type: 'test',
          testId: '12345',
        },
        sound: 'default',
      },
      trigger: futureTime,
    });

    console.log('✅ Test notification scheduled with ID:', id);
    console.log('⏰ Notification will show in 10 seconds at:', futureTime.toLocaleString());

    return {
      success: true,
      notificationId: id,
      scheduledTime: futureTime,
    };
  } catch (error) {
    console.error('❌ Error scheduling test notification:', error);
    console.error('❌ Error details:', error instanceof Error ? error.message : error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

export const testMedicineNotification = async () => {
  try {
    const trigger = new Date(Date.now() + 5000); // 5 seconds from now

    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: '💊 Medicine Reminder - Test',
        body: 'Time to take your test medicine (1 tablet)',
        data: {
          type: 'medicine',
          medicineId: 'test-medicine-123',
          medicineName: 'Test Medicine',
          dosage: '1 tablet',
        },
        sound: 'default',
      },
      trigger,
    });

    console.log('✅ Medicine test notification scheduled with ID:', id);
    console.log('⏰ Medicine reminder will show in 5 seconds...');

    return {
      success: true,
      notificationId: id,
      scheduledTime: trigger,
    };
  } catch (error) {
    console.error('❌ Error scheduling medicine test notification:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

export const testHabitNotification = async () => {
  try {
    const trigger = new Date(Date.now() + 5000); // 5 seconds from now

    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: '💪 Habit Reminder - Test',
        body: 'Time for your test habit (8 glasses of water)',
        data: {
          type: 'habit',
          habitId: 'test-habit-123',
          habitName: 'Test Habit',
          targetValue: 8,
          targetUnit: 'glasses',
        },
        sound: 'default',
      },
      trigger,
      priority: 'high',
      categoryId: Platform.OS === 'android' ? 'habit-reminders' : undefined,
    });

    console.log('✅ Habit test notification scheduled with ID:', id);
    console.log('⏰ Habit reminder will show in 5 seconds...');

    return {
      success: true,
      notificationId: id,
      scheduledTime: trigger,
    };
  } catch (error) {
    console.error('❌ Error scheduling habit test notification:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

export const getAllScheduledNotifications = async () => {
  try {
    const notifications = await Notifications.getAllScheduledNotificationsAsync();
    console.log('📱 Scheduled Notifications:', notifications.length);

    notifications.forEach((notification, index) => {
      console.log(`${index + 1}. ${notification.content.title}`);
      console.log(`   Body: ${notification.content.body}`);
      console.log(`   Trigger:`, notification.trigger);
      console.log(`   Data:`, notification.content.data);
      console.log('---');
    });

    return notifications;
  } catch (error) {
    console.error('❌ Error getting scheduled notifications:', error);
    return [];
  }
};

export const cancelAllNotifications = async () => {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    console.log('🗑️ All notifications canceled');
    return true;
  } catch (error) {
    console.error('❌ Error canceling all notifications:', error);
    return false;
  }
};