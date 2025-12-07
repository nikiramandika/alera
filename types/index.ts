// User types
export interface User {
  userId: string;
  email: string;
  displayName: string;
  photoURL?: string | null;
  phoneNumber?: string | null;
  createdAt: Date;
  updatedAt: Date;
  settings: {
    notifications: boolean;
    notificationSound: boolean;
    vibration: boolean;
    language: 'id' | 'en';
    theme: 'light' | 'dark';
  };
  profile?: {
    gender?: 'male' | 'female' | 'other';
    weight?: number; // in kg
    age?: number; // in years
    birthDate?: Date;
  };
}

// Medicine Reminder types
export interface MedicineReminder {
  reminderId: string;
  userId: string;
  medicineName: string;
  dosage: string;
  medicineType: string; // Tablet, Capsule, Liquid, etc
  takeWithMeal?: 'before' | 'after'; // When to take medicine
  drugAppearance?: string | null; // URI of medicine photo
  description?: string; // Special instructions or notes
  frequency: {
    type: 'daily' | 'interval' | 'as_needed';
    times: string[]; // ["08:00", "14:00"]
    specificDays?: number[]; // [0-6] active days for interval frequency
  };
  duration: {
    startDate: Date;
    endDate?: Date | null;
    totalDays?: number | null;
  };
  isActive: boolean;
  color: string;
  icon: string;
  notificationIds?: string[]; // Array of notification IDs from expo-notifications
  createdAt: Date;
  updatedAt: Date;
}

// Medicine History types
export interface MedicineHistory {
  historyId: string;
  userId: string;
  reminderId: string;
  medicineName: string;
  scheduledTime: Date;
  takenAt?: Date | null;
  actualTime?: Date | null;
  status: 'taken' | 'skipped' | 'missed' | 'pending';
  createdAt: Date;
  // Additional properties for service compatibility
  medicineId: string;
}

// Habit types
export interface Habit {
  habitId: string;
  userId: string;
  habitName: string;
  habitType: string; // Changed from preset types to free text with category selection
  description?: string;
  target: {
    value: number;
    unit: string; // gelas, menit, kali, dll
  };
  frequency: {
    type: 'daily' | 'interval';
    times: string[]; // ["08:00", "14:00"]
    specificDays?: number[]; // [0-6] active days for interval frequency
  };
  reminderDays: number[]; // [0-6] hari aktif - kept for compatibility
  reminderTimes: string[]; // ["08:00"] - kept for compatibility
  startDate: Date;
  endDate?: Date | null;
  duration: {
    startDate: Date;
    endDate?: Date | null;
    totalDays?: number | null;
  };
  isActive: boolean;
  color: string;
  icon: string; // Icon emoji instead of image
  streak: number;
  bestStreak: number;
  notificationIds?: string[]; // Array of notification IDs from expo-notifications
  createdAt: Date;
  updatedAt: Date;
  // Additional properties for service compatibility
  completedDates: string[]; // Array of date strings for completed days
  schedule: {
    type: 'daily' | 'interval';
    frequency: 'daily' | 'interval';
    days?: number[]; // for interval frequency
    endDate?: Date;
  };
}

// Habit History types
export interface HabitHistory {
  logId: string;
  userId: string;
  habitId: string;
  habitName: string;
  date: Date; // midnight of that day
  completed: boolean;
  progress: {
    value: number;
  };
  value: number; // Direct value property for service compatibility
  completedAt?: Date | null;
  completionTime?: string; // The specific time this completion is for (e.g., "08:00")
  createdAt: Date;
}

// Notification types
export interface AppNotification {
  notificationId: string;
  userId: string;
  type: 'medicine' | 'habit';
  referenceId: string; // ID medicine/habit
  title: string;
  body: string;
  scheduledTime: Date;
  sentAt?: Date | null;
  isRead: boolean;
  status: 'pending' | 'sent' | 'dismissed';
  createdAt: Date;
}

// Statistics types
export interface Statistics {
  userId: string;
  medicine: {
    totalReminders: number;
    activeReminders: number;
    adherenceRate: number; // percentage
    lastUpdated: Date;
  };
  habits: {
    totalHabits: number;
    activeHabits: number;
    completionRate: number; // percentage
    totalStreak: number;
    lastUpdated: Date;
  };
  weekly: {
    medicinesTaken: number;
    habitsCompleted: number;
    weekStart: Date;
  };
  monthly: {
    medicinesTaken: number;
    habitsCompleted: number;
    monthStart: Date;
  };
}

// Form types for onboarding
export interface OnboardingData {
  gender: 'male' | 'female' | 'other';
  weight: number;
  birthDate: Date;
}

// Navigation types
export type RootTabParamList = {
  index: undefined;
  habits: undefined;
  medication: undefined;
  analytics: undefined;
  family: undefined;
};

export type AuthStackParamList = {
  Welcome: undefined;
  Login: undefined;
  Register: undefined;
  Onboarding: undefined;
};

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Chart data types
export interface ChartData {
  labels: string[];
  datasets: {
    data: number[];
    color?: string;
    name?: string;
  }[];
}

// Search types
export interface SearchResult {
  type: 'medicine' | 'habit';
  id: string;
  name: string;
  description?: string;
  data: MedicineReminder | Habit;
}