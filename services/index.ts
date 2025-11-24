// Export all services for easy importing
export * from './databaseService';
export * from './medicineService';
export * from './habitService';
export * from './analyticsService';
export * from './notificationService';
export * from './notificationScheduler';

// Re-export commonly used combinations
export {
  userService
} from './databaseService';

export {
  medicineService,
  medicineHistoryService
} from './medicineService';

export {
  habitService,
  habitHistoryService
} from './habitService';

export {
  analyticsService
} from './analyticsService';

export {
  notificationSettingsService,
  scheduledNotificationsService,
  notificationTemplates
} from './notificationService';

// Firebase configuration
export { auth, db, storage } from '@/config/firebase';