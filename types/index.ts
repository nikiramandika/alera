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
  };
}

// Medicine Reminder types
export interface MedicineReminder {
  reminderId: string;
  userId: string;
  medicineName: string;
  dosage: string;
  medicineType: string; // Tablet, Sirup, dll
  frequency: {
    type: 'daily' | 'interval' | 'specific_days' | 'as_needed';
    times: string[]; // ["08:00", "14:00"]
    time?: string; // Single time for compatibility
    interval?: number; // dalam jam
    specificDays?: number[]; // [0-6] hari aktif
  };
  duration: {
    startDate: Date;
    endDate?: Date | null;
    totalDays?: number | null;
  };
  instructions?: string;
  stockQuantity: number;
  stockAlert: number;
  stock: {
    current: number;
    currentStock: number;
    refillThreshold: number;
    unit: string;
    lastUpdated: Date;
  };
  isActive: boolean;
  color: string;
  icon: string;
  notes?: string;
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
  habitType: 'water' | 'exercise' | 'sleep' | 'meditation' | 'custom';
  description?: string;
  target: {
    value: number;
    unit: string; // gelas, menit, kali
    frequency: 'daily' | 'weekly' | 'monthly';
  };
  reminderTimes: string[]; // ["08:00"]
  reminderDays: number[]; // [0-6] hari aktif
  startDate: Date;
  endDate?: Date | null;
  isActive: boolean;
  color: string;
  icon: string;
  streak: number;
  bestStreak: number;
  createdAt: Date;
  updatedAt: Date;
  // Additional properties for service compatibility
  completedDates: string[]; // Array of date strings for completed days
  schedule: {
    type: 'daily' | 'weekly' | 'monthly';
    frequency: 'daily' | 'weekly' | 'monthly';
    days?: number[]; // for weekly habits
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
  age: number;
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