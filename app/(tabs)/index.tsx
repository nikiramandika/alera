import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Modal,
  Platform,
  Dimensions,
  Animated,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import { useHabit } from '@/contexts/HabitContext';
import { useMedicine } from '@/contexts/MedicineContext';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import LoadingAnimation from '@/components/LoadingAnimation';

interface Task {
  id: string;
  title: string;
  subtitle: string;
  time: string;
  completed: boolean;
  icon: string;
  color: string;
  type: 'habit' | 'medicine';
  selectedDate?: string; // Added to pass selected date for completion
}

export default function HomeScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const [showCalendar, setShowCalendar] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoadingTasks, setIsLoadingTasks] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  // Initialize with current date (no timezone offset for date comparison)
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [calendarMonth, setCalendarMonth] = useState(new Date());

  // Check if selected date is today
  const isViewingToday = () => {
    const todayIndonesia = getIndonesiaTimeForCalendar();
    return selectedDate.toDateString() === todayIndonesia.toDateString();
  };

  // Animated value for Today button
  const todayButtonOpacity = useRef(new Animated.Value(0)).current;
  const todayButtonScale = useRef(new Animated.Value(0.8)).current;

  // Animate Today button based on whether viewing today
  useEffect(() => {
    const shouldShow = !isViewingToday();

    if (shouldShow) {
      // Show button with animation
      Animated.parallel([
        Animated.timing(todayButtonOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(todayButtonScale, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Hide button with animation
      Animated.parallel([
        Animated.timing(todayButtonOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(todayButtonScale, {
          toValue: 0.8,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [selectedDate, todayButtonOpacity, todayButtonScale, isViewingToday]); // Trigger when selected date changes

  // Function to go back to today
  const goToToday = () => {
    const today = new Date();
    setSelectedDate(today);

    // Debug log (only in development)
    if (__DEV__) {
      console.log('📅 Today button pressed - Returning to:', today.toISOString());
    }
  };

  // Ref for date selector ScrollView
  const dateSelectorRef = useRef<ScrollView>(null);

  // State for screen dimensions to handle orientation changes
  const [screenWidth, setScreenWidth] = useState(Dimensions.get('window').width);

  // Listen for dimension changes (orientation changes)
  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setScreenWidth(window.width);
    });

    return () => subscription?.remove();
  }, []);

  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  // Import contexts for real data
  const { user } = useAuth();

  // Check if user has completed onboarding - redirect if not
  useEffect(() => {
    if (user) {
      const hasProfileData = user.profile &&
        user.profile.gender &&
        user.profile.weight &&
        user.profile.age &&
        user.profile.birthDate;

      console.log('🔍 [HOME] Checking user profile:', {
        hasProfile: !!user.profile,
        gender: user.profile?.gender,
        weight: user.profile?.weight,
        age: user.profile?.age,
        birthDate: user.profile?.birthDate,
        hasProfileData
      });

      if (!hasProfileData) {
        console.log('🔍 [HOME] User profile incomplete, redirecting to onboarding');
        router.replace('/(auth)/onboarding');
      }
    }
  }, [user, router]);
  const { habits, refreshHabits, getHabitHistoryForDateRange } = useHabit();
  const { medicines, refreshMedicines, getMedicineHistoryForDateRange } = useMedicine();

  // State for extended history (for calendar view)
  const [extendedHabitHistory, setExtendedHabitHistory] = useState<any[]>([]);
  const [extendedMedicineHistory, setExtendedMedicineHistory] = useState<any[]>([]);

  
  // Store stable references to refresh functions
  const refreshHabitsRef = useRef(refreshHabits);
  const refreshMedicinesRef = useRef(refreshMedicines);

  // Fetch extended habit history for calendar view
  const fetchExtendedHabitHistory = useCallback(async () => {
    try {
      console.log('🔄 Fetching extended history for completion status...');
      const today = new Date();
      const startDate = new Date(today);
      startDate.setDate(today.getDate() - 7); // 7 days back
      const endDate = new Date(today);
      endDate.setDate(today.getDate() + 7); // 7 days forward

      const [habitHist, medicineHist] = await Promise.all([
        getHabitHistoryForDateRange(startDate, endDate),
        getMedicineHistoryForDateRange(startDate, endDate)
      ]);
      setExtendedHabitHistory(habitHist);
      setExtendedMedicineHistory(medicineHist);
      console.log(`✅ Extended history loaded - Habits: ${habitHist.length}, Medicines: ${medicineHist.length}`);
    } catch (error) {
      console.error('Error fetching extended history:', error);
    }
  }, [getHabitHistoryForDateRange, getMedicineHistoryForDateRange]);

  // Fetch extended history when component mounts or habits change
  useEffect(() => {
    const loadInitialData = async () => {
      if (isInitialLoad) {
        try {
          console.log('🔄 Loading initial completion data...');
          setIsLoadingTasks(true);
          await fetchExtendedHabitHistory();
          setIsInitialLoad(false); // Mark initial load as complete
          console.log('✅ Initial completion data loaded');
        } catch (error) {
          console.error('Error loading initial data:', error);
        } finally {
          setIsLoadingTasks(false);
        }
      }
    };

    loadInitialData();
  }, [isInitialLoad, fetchExtendedHabitHistory]);

  // Update refs when functions change
  useEffect(() => {
    refreshHabitsRef.current = refreshHabits;
    refreshMedicinesRef.current = refreshMedicines;
  }, [refreshHabits, refreshMedicines, fetchExtendedHabitHistory]);

  // Track task completion for optimistic UI (minimal tracking)
  const lastTaskClickTime = useRef(0);

  // Track recently completed tasks for optimistic UI updates
  const [recentlyCompletedTasks, setRecentlyCompletedTasks] = useState<Set<string>>(new Set());

  // Function to mark a task as recently completed (for optimistic UI)
  const markTaskAsCompleted = React.useCallback((taskId: string) => {
    console.log('🎯 Marking task as completed for optimistic UI:', taskId);
    setRecentlyCompletedTasks(prev => new Set([...prev, taskId]));

    // Remove from recently completed after 5 seconds to prevent memory leak
    setTimeout(() => {
      setRecentlyCompletedTasks(prev => {
        const newSet = new Set(prev);
        newSet.delete(taskId);
        return newSet;
      });
    }, 5000);
  }, []);

  // Check for task completion signal from AsyncStorage - AGGRESSIVE DETECTION
  useEffect(() => {
    const checkForTaskCompletion = async () => {
      try {
        const completionSignal = await AsyncStorage.getItem('taskCompletionSignal');
        if (completionSignal) {
          const { taskId, timestamp } = JSON.parse(completionSignal);
          const now = Date.now();

          // Only process if completion was within last 5 seconds (reduced from 10)
          if (now - timestamp < 5000) {
            console.log('🎯 IMMEDIATE task completion signal detected:', taskId);
            markTaskAsCompleted(taskId);
          }

          // Clear the signal immediately
          await AsyncStorage.removeItem('taskCompletionSignal');
        }
      } catch (error) {
        console.error('Error checking task completion signal:', error);
      }
    };

    // Check IMMEDIATELY when component mounts or comes into focus
    checkForTaskCompletion();

    // Set up AGGRESSIVE interval (every 200ms for 2 seconds) for instant detection
    const interval = setInterval(() => {
      checkForTaskCompletion();
    }, 200);

    // Clear interval after 2 seconds (faster detection window)
    const timeout = setTimeout(() => {
      clearInterval(interval);
    }, 2000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [markTaskAsCompleted]);

  // NO AUTO-REFRESH - Data is loaded once with completion status included
  // Only optimistic UI updates are used for task completion

  // Update task click handler - minimal tracking
  const handleTaskClick = (task: Task) => {
    console.log('Task clicked:', task); // Debug log
    if (task) {
      // Track task click time for optimistic UI
      lastTaskClickTime.current = Date.now();

      // Include selectedDate in task data for proper completion date handling
      const taskWithDate = {
        ...task,
        selectedDate: selectedDate.toISOString() // Include selected date for completion
      };

      const taskData = JSON.stringify(taskWithDate);
      console.log('Task data string length:', taskData.length); // Debug log
      console.log('Task data preview:', taskData.substring(0, 100) + '...'); // Debug log
      console.log('Selected date sent:', selectedDate.toISOString()); // Debug log;

      // Navigate to task completion screen with task data as modal
      router.push({
        pathname: '/tasks/complete',
        params: {
          taskData: taskData
        }
      } as any);
    } else {
      console.log('No task provided to handleTaskClick');
    }
  };

  
// Generate tasks from real data - defined outside useMemo to avoid dependency issues
const generateTasksFromData = React.useCallback(() => {
  // Helper function to convert time string to Indonesia time for comparison
  const getIndonesiaTime = (date: Date = new Date()) => {
    // Create new date to avoid modifying original
    const indonesiaTime = new Date(date.getTime());
    console.log(`getIndonesiaTime: Input=${date.toISOString()}, Output=${indonesiaTime.toISOString()}`);
    return indonesiaTime;
  };

  // Toleransi waktu sebelum task masuk overdue (dalam menit)
  const OVERDUE_TOLERANCE_MINUTES = 15;

  // Helper function to convert date to string format YYYY-MM-DD
  const dateToString = (date: any): string | null => {
    if (!date) return null;

    let d: Date;

    try {
      // Handle Firestore Timestamp format
      if (date && typeof date === 'object' && 'seconds' in date && 'nanoseconds' in date) {
        // Convert Firestore timestamp to Date
        d = new Date(date.seconds * 1000 + Math.floor(date.nanoseconds / 1000000));
      } else if (typeof date === 'string') {
        d = new Date(date);
      } else if (date instanceof Date) {
        d = date;
      } else {
        console.warn('Unknown date type:', typeof date, date);
        return null;
      }

      // Check if date is valid
      if (!(d instanceof Date) || isNaN(d.getTime())) {
        console.error('Invalid date:', date);
        return null;
      }

      return d.getFullYear() + '-' +
        String(d.getMonth() + 1).padStart(2, '0') + '-' +
        String(d.getDate()).padStart(2, '0');
    } catch (e) {
      console.error('Error parsing date:', date, e);
      return null;
    }
  };

  // Initialize arrays to collect all tasks first
  const allTimeBasedTasks: {
    task: Task;
    time: string;
    isOverdue: boolean;
    isUpcoming: boolean;
  }[] = [];

  // Use selected date (clean to midnight) but keep the date for comparison
  const selectedDateClean = new Date(selectedDate);
  selectedDateClean.setHours(0, 0, 0, 0);
  // Format date consistently (YYYY-MM-DD)
  const selectedDateStr = dateToString(selectedDateClean);

  // Guard: if selectedDateStr is null, something went wrong
  if (!selectedDateStr) {
    console.error('Failed to parse selected date');
    return { overdue: [], allDay: [], timeBased: {} };
  }

  // Get current time in Indonesia timezone
  const now = getIndonesiaTime();
  const todayStr = dateToString(now);

  // Guard: if todayStr is null, something went wrong
  if (!todayStr) {
    console.error('Failed to parse today date');
    return { overdue: [], allDay: [], timeBased: {} };
  }

  const isToday = selectedDateStr === todayStr;

  // Only log debug info in development and when data actually changes
  if (__DEV__ && (habits.length > 0 || medicines.length > 0)) {
    console.log('📊 DEBUG: Data update - Habits:', habits.length, 'HabitHistory:', extendedHabitHistory.length, 'Medicines:', medicines.length, 'MedicineHistory:', extendedMedicineHistory.length, 'Date:', selectedDateStr);
  }

  // Function to create habit task
  const createHabitTask = (habit: any, selectedDateStr: string, todayStr: string): Task => {
    const isFutureDate = selectedDateStr > todayStr;

    // Check if habit was completed on selected date using habit history
    const isCompletedOnSelectedDate = !isFutureDate && (
      // First check optimistic UI updates (recently completed tasks)
      recentlyCompletedTasks.has(`habit-${habit.habitId}`) ||
      recentlyCompletedTasks.has(`habit-${habit.habitId}-all`) ||
      // Then check server data
      extendedHabitHistory.some((history: any) => {
        if (history.habitId === habit.habitId) {
          const historyDate = new Date(history.date);
          const historyDateStr = historyDate.getFullYear() + '-' +
            String(historyDate.getMonth() + 1).padStart(2, '0') + '-' +
            String(historyDate.getDate()).padStart(2, '0');
          return historyDateStr === selectedDateStr && history.completed;
        }
        return false;
      })
    );

    // Debug habit data structure
    if (__DEV__) {
      console.log(`🔍 Habit "${habit.habitName}" data:`, {
        habitId: habit.habitId,
        completedDates: habit.completedDates,
        habitHistoryCount: extendedHabitHistory.filter((h: any) => h.habitId === habit.habitId).length,
        relevantHistory: extendedHabitHistory.filter((h: any) => h.habitId === habit.habitId),
        selectedDate: selectedDateStr,
        isCompleted: isCompletedOnSelectedDate
      });
    }

    // Build subtitle with proper fallbacks for missing data
    const subtitleParts = [];

    // Add target information if available
    if (habit.target) {
      if (habit.target.value && habit.target.unit) {
        subtitleParts.push(`${habit.target.value} ${habit.target.unit}`);
      } else if (habit.target.value) {
        subtitleParts.push(`${habit.target.value} unit`);
      }
    }

    // Add frequency information with fallbacks
    const freq = habit.frequency || habit.target?.frequency;
    if (freq) {
      if (typeof freq === 'string') {
        subtitleParts.push(freq);
      } else if (freq.type === 'daily' && habit.reminderTimes?.length > 0) {
        if (habit.reminderTimes.length === 1) {
          subtitleParts.push(`daily at ${habit.reminderTimes[0]}`);
        } else {
          subtitleParts.push(`${habit.reminderTimes.length}x daily`);
        }
      } else if (freq.type === 'interval' && freq.specificDays) {
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const days = freq.specificDays.map((day: number) => dayNames[day]).join(', ');
        subtitleParts.push(days);
      } else if (freq.type === 'daily') {
        subtitleParts.push('daily');
      }
    }

    // Fallback to old reminderDays logic if no frequency found
    if (subtitleParts.length === 0 && habit.reminderDays?.length > 0) {
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const days = habit.reminderDays.map((day: number) => dayNames[day]).join(', ');
      subtitleParts.push(days);
    }

    // If still no subtitle, provide a default
    const subtitle = subtitleParts.length > 0 ? subtitleParts.join(' • ') : 'Daily habit';

    return {
      id: `habit-${habit.habitId}`,
      title: habit.habitName,
      subtitle: subtitle,
      time: 'All Day',
      completed: isCompletedOnSelectedDate,
      icon: habit.icon || '🎯',
      color: habit.color || '#84CC16',
      type: 'habit',
    };
  };

  // Function to create medicine task
  const createMedicineTask = (medicine: any, selectedDateStr: string, todayStr: string): Task => {
    const isFutureDate = selectedDateStr > todayStr;

    // Check if medicine was taken on selected date using medicine history
    const isTakenOnSelectedDate = !isFutureDate && (
      // First check optimistic UI updates (recently completed tasks)
      recentlyCompletedTasks.has(`medicine-${medicine.reminderId}`) ||
      recentlyCompletedTasks.has(`medicine-${medicine.reminderId}-all`) ||
      // Then check server data
      extendedMedicineHistory.some((history: any) => {
        if (history.reminderId === medicine.reminderId) {
          const historyDate = new Date(history.scheduledTime);
          const historyDateStr = historyDate.getFullYear() + '-' +
            String(historyDate.getMonth() + 1).padStart(2, '0') + '-' +
            String(historyDate.getDate()).padStart(2, '0');
          return historyDateStr === selectedDateStr && history.status === 'taken';
        }
        return false;
      })
    );

    if (__DEV__ && isTakenOnSelectedDate) {
      console.log(`💊 Medicine "${medicine.medicineName}" was taken on ${selectedDateStr}`);
    }

    // Create detailed subtitle with medicine information
    const subtitleParts = [];

    // Add dosage and medicine type (avoid duplication)
    const dosage = medicine.dosage?.trim() || '';
    const medicineType = medicine.medicineType?.trim() || '';

    // Check if dosage already contains the medicine type (case insensitive)
    if (dosage && medicineType && dosage.toLowerCase().includes(medicineType.toLowerCase())) {
      subtitleParts.push(dosage);
    } else if (dosage && medicineType) {
      subtitleParts.push(`${dosage} ${medicineType}`);
    } else if (dosage) {
      subtitleParts.push(dosage);
    } else if (medicineType) {
      subtitleParts.push(medicineType);
    }

    // Add meal timing information
    if (medicine.takeWithMeal) {
      const mealTiming = medicine.takeWithMeal === 'before' ? 'Before meals' : 'After meals';
      subtitleParts.push(mealTiming);
    }

    // Add frequency information for context
    if (medicine.frequency) {
      const freq = medicine.frequency;
      if (freq.type === 'daily' && freq.times && freq.times.length > 0) {
        if (freq.times.length === 1) {
          subtitleParts.push(`daily at ${freq.times[0]}`);
        } else {
          subtitleParts.push(`${freq.times.length}x daily`);
        }
      } else if (freq.type === 'interval' && freq.specificDays) {
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const days = freq.specificDays.map((day: number) => dayNames[day]).join(', ');
        subtitleParts.push(`${days}`);
      } else if (freq.type === 'as_needed') {
        subtitleParts.push('as needed');
      }
    }

    // Add special instructions if available (shortened)
    if (medicine.description && medicine.description.trim()) {
      const instruction = medicine.description.trim();
      if (instruction.length <= 20) {
        subtitleParts.push(instruction);
      } else {
        subtitleParts.push(instruction.substring(0, 20) + '...');
      }
    }

    const subtitle = subtitleParts.join(' • ');

    return {
      id: `medicine-${medicine.reminderId}`,
      title: medicine.medicineName,
      subtitle: subtitle,
      time: 'All Day',
      completed: isTakenOnSelectedDate,
      icon: medicine.drugAppearance || '💊',
      color: medicine.color || '#84CC16',
      type: 'medicine',
    };
  };

  // Collect all time-based tasks from both habits and medicines
  const collectAllTasks = () => {
    habits.forEach((habit: any) => {
      // Check if habit has started first
      let habitHasStarted = true;
      let habitStartDate: Date | null = null;

      // Get start date from duration.startDate first, then fallback to createdAt
      if (habit.duration?.startDate) {
        if (typeof habit.duration.startDate === 'object' && 'toDate' in habit.duration.startDate && typeof habit.duration.startDate.toDate === 'function') {
          habitStartDate = habit.duration.startDate.toDate();
        } else {
          habitStartDate = new Date(habit.duration.startDate);
        }
      } else if (habit.startDate) {
        if (typeof habit.startDate === 'object' && 'toDate' in habit.startDate && typeof habit.startDate.toDate === 'function') {
          habitStartDate = habit.startDate.toDate();
        } else {
          habitStartDate = new Date(habit.startDate);
        }
      } else if (habit.createdAt) {
        habitStartDate = habit.createdAt instanceof Date ? habit.createdAt :
                      (typeof habit.createdAt?.toDate === 'function' ? habit.createdAt.toDate() : new Date());
      }

      if (habitStartDate) {
        habitStartDate.setHours(0, 0, 0, 0);
        const selectedDateCopy = new Date(selectedDateClean);
        selectedDateCopy.setHours(0, 0, 0, 0);

        if (habitStartDate > selectedDateCopy) {
          console.log(`SKIP Habit ${habit.habitName}: Starts on ${habitStartDate.toISOString()}, selected date is ${selectedDateCopy.toISOString()}`);
          habitHasStarted = false;
        }
      }

      if (!habitHasStarted) return;

      // Check if habit has expired next
      let habitHasExpired = false;
      if (habit.endDate) {
        let endDate: Date;
        if (typeof habit.endDate === 'object' && 'toDate' in habit.endDate && typeof habit.endDate.toDate === 'function') {
          endDate = habit.endDate.toDate();
        } else {
          endDate = new Date(habit.endDate);
        }
        endDate.setHours(23, 59, 59, 999);

        const selectedDateEnd = new Date(selectedDateClean);
        selectedDateEnd.setHours(23, 59, 59, 999);

        if (endDate < selectedDateClean) {
          console.log(`SKIP Habit ${habit.habitName}: Expired on ${endDate.toISOString()}, selected date is ${selectedDateClean.toISOString()}`);
          habitHasExpired = true;
          return;
        }
      } else if (habit.duration?.endDate) {
        let durationEndDate: Date;
        if (typeof habit.duration.endDate === 'object' && 'toDate' in habit.duration.endDate && typeof habit.duration.endDate.toDate === 'function') {
          durationEndDate = habit.duration.endDate.toDate();
        } else {
          durationEndDate = new Date(habit.duration.endDate);
        }
        durationEndDate.setHours(23, 59, 59, 999);

        const selectedDateEnd = new Date(selectedDateClean);
        selectedDateEnd.setHours(23, 59, 59, 999);

        if (durationEndDate < selectedDateClean) {
          console.log(`SKIP Habit ${habit.habitName}: Expired on ${durationEndDate.toISOString()}, selected date is ${selectedDateClean.toISOString()}`);
          habitHasExpired = true;
          return;
        }
      }

      if (habitHasExpired) return;

      const selectedDayOfWeek = selectedDateClean.getDay();
      let isActiveOnSelectedDate = false;

      // Check if habit is active on selected date based on frequency type
      if (habit.frequency?.type === 'daily') {
        isActiveOnSelectedDate = true; // Daily habits are active every day
      } else if (habit.frequency?.type === 'interval') {
        isActiveOnSelectedDate = habit.frequency?.specificDays?.includes(selectedDayOfWeek) || false;
      } else if (habit.schedule?.type === 'daily') {
        isActiveOnSelectedDate = true; // Daily habits are active every day
      } else if (habit.schedule?.type === 'specific_days') {
        isActiveOnSelectedDate = habit.schedule?.days?.includes(selectedDayOfWeek) || false;
      } else {
        // Fallback to old reminderDays logic for backward compatibility
        isActiveOnSelectedDate = habit.reminderDays?.includes(selectedDayOfWeek) || false;
      }

      const habitIsActive = habit.isActive !== undefined ? habit.isActive : true;

      if (isActiveOnSelectedDate && habitIsActive) {
        const habitTask = createHabitTask(habit, selectedDateStr, todayStr);

        if (habit.reminderTimes && habit.reminderTimes.length > 0) {
          // Time-based habit
          habit.reminderTimes.forEach((time: string) => {
            const [hours, minutes] = time.split(':').map(Number);
            const reminderTime = new Date(selectedDateClean);
            reminderTime.setHours(hours, minutes, 0, 0);
            const indonesiaReminderTime = getIndonesiaTime(reminderTime);

            const isFutureDate = selectedDateStr > todayStr;

            // Check if this specific habit was completed on selected date using history
            const isCompletedOnSelectedDate = !isFutureDate && (
              // First check optimistic UI updates (recently completed tasks)
              recentlyCompletedTasks.has(`habit-${habit.habitId}-${time}`) ||
              recentlyCompletedTasks.has(`habit-${habit.habitId}-all`) ||
              // Then check server data
              extendedHabitHistory.some((history: any) => {
                if (history.habitId === habit.habitId) {
                  const historyDate = new Date(history.date);
                  const historyDateStr = historyDate.getFullYear() + '-' +
                    String(historyDate.getMonth() + 1).padStart(2, '0') + '-' +
                    String(historyDate.getDate()).padStart(2, '0');
                  const historyTime = historyDate.getHours().toString().padStart(2, '0') + ':' +
                                    historyDate.getMinutes().toString().padStart(2, '0');
                  // For time-based habits, check if completion time matches the scheduled time
                  return historyDateStr === selectedDateStr &&
                         historyTime === time &&
                         history.completed;
                }
                return false;
              })
            );

            const toleranceTime = new Date(indonesiaReminderTime.getTime() + OVERDUE_TOLERANCE_MINUTES * 60 * 1000);
            const isOverdue = isToday && !isCompletedOnSelectedDate && now > toleranceTime;
            const isUpcoming = isToday && !isCompletedOnSelectedDate && now >= indonesiaReminderTime && now <= toleranceTime;

            // Debug logs (only in development)
            if (__DEV__) {
              const relevantHistory = extendedHabitHistory.filter((h: any) => h.habitId === habit.habitId);
              console.log(`⏰ Habit "${habit.habitName}" Debug:`, {
                taskTime: time,
                reminderTime: indonesiaReminderTime.toISOString(),
                currentTime: now.toISOString(),
                toleranceTime: toleranceTime.toISOString(),
                isToday,
                isCompletedOnSelectedDate,
                isOverdue,
                isUpcoming,
                habitId: habit.habitId,
                completedDates: habit.completedDates,
                selectedDate: selectedDateStr,
                totalHistoryCount: extendedHabitHistory.length,
                relevantHistoryCount: relevantHistory.length,
                relevantHistory: relevantHistory
              });
            }

            allTimeBasedTasks.push({
              task: {
                ...habitTask,
                id: `${habitTask.id}-${time}`, // Add time to make ID unique for each time slot
                time: time,
                completed: isCompletedOnSelectedDate
              },
              time: time,
              isOverdue: isOverdue,
              isUpcoming: isUpcoming
            });
          });
        }
      }
    });

    medicines.forEach((medicine: any) => {
      // Get start date and normalize to start of day (00:00:00)
      let medicineStartDate: Date | null = null;
      if (medicine.duration?.startDate) {
        if (typeof medicine.duration.startDate === 'object' && 'toDate' in medicine.duration.startDate && typeof medicine.duration.startDate.toDate === 'function') {
          medicineStartDate = medicine.duration.startDate.toDate();
        } else {
          medicineStartDate = new Date(medicine.duration.startDate);
        }
        if (medicineStartDate) {
          medicineStartDate.setHours(0, 0, 0, 0); // Reset to start of day
        }
      } else if (medicine.startDate) {
        if (typeof medicine.startDate === 'object' && 'toDate' in medicine.startDate && typeof medicine.startDate.toDate === 'function') {
          medicineStartDate = medicine.startDate.toDate();
        } else {
          medicineStartDate = new Date(medicine.startDate);
        }
        if (medicineStartDate) {
          medicineStartDate.setHours(0, 0, 0, 0); // Reset to start of day
        }
      }

      if (medicineStartDate && medicineStartDate > selectedDateClean) {
        console.log(`SKIP Medicine ${medicine.medicineName}: Starts on ${medicineStartDate.toISOString()}, selected date is ${selectedDateClean.toISOString()}`);
        return;
      }

      // Check if medicine has expired first
      let medicineHasExpired = false;
      if (medicine.endDate) {
        let endDate: Date;
        if (typeof medicine.endDate === 'object' && 'toDate' in medicine.endDate && typeof medicine.endDate.toDate === 'function') {
          endDate = medicine.endDate.toDate();
        } else {
          endDate = new Date(medicine.endDate);
        }
        // Normalize to end of day (23:59:59)
        endDate.setHours(23, 59, 59, 999);

        const selectedDateEnd = new Date(selectedDateClean);
        selectedDateEnd.setHours(23, 59, 59, 999);

        if (endDate < selectedDateEnd) {
          console.log(`SKIP Medicine ${medicine.medicineName}: Expired on ${endDate.toISOString()}, selected date is ${selectedDateEnd.toISOString()}`);
          medicineHasExpired = true;
        }
      } else if (medicine.duration?.endDate) {
        let durationEndDate: Date;
        if (typeof medicine.duration.endDate === 'object' && 'toDate' in medicine.duration.endDate && typeof medicine.duration.endDate.toDate === 'function') {
          durationEndDate = medicine.duration.endDate.toDate();
        } else {
          durationEndDate = new Date(medicine.duration.endDate);
        }
        // Normalize to end of day (23:59:59)
        durationEndDate.setHours(23, 59, 59, 999);

        const selectedDateEnd = new Date(selectedDateClean);
        selectedDateEnd.setHours(23, 59, 59, 999);

        if (durationEndDate < selectedDateEnd) {
          console.log(`SKIP Medicine ${medicine.medicineName}: Expired on ${durationEndDate.toISOString()}, selected date is ${selectedDateEnd.toISOString()}`);
          medicineHasExpired = true;
        }
      }

      if (medicineHasExpired) return;

      let isActiveOnSelectedDate = false;
      if (medicine.frequency.type === 'daily') {
        isActiveOnSelectedDate = medicine.isActive;
      } else if (medicine.frequency.type === 'interval') {
        const selectedDayOfWeek = selectedDateClean.getDay();
        isActiveOnSelectedDate = medicine.isActive &&
          medicine.frequency.specificDays?.includes(selectedDayOfWeek);
      } else if (medicine.frequency.type === 'as_needed') {
        isActiveOnSelectedDate = medicine.isActive;
      }

      if (isActiveOnSelectedDate) {
        const medicineTask = createMedicineTask(medicine, selectedDateStr, todayStr);

        if (medicine.frequency.times && medicine.frequency.times.length > 0) {
          // Time-based medicine
          medicine.frequency.times.forEach((time: string) => {
            const [hours, minutes] = time.split(':').map(Number);
            const reminderTime = new Date(selectedDateClean);
            reminderTime.setHours(hours, minutes, 0, 0);
            const indonesiaReminderTime = getIndonesiaTime(reminderTime);

            const isFutureDate = selectedDateStr > todayStr;

            // Check if this specific medicine dose was taken using history
            const isTakenOnSelectedDate = !isFutureDate && (
              // First check optimistic UI updates (recently completed tasks)
              recentlyCompletedTasks.has(`medicine-${medicine.reminderId}-${time}`) ||
              recentlyCompletedTasks.has(`medicine-${medicine.reminderId}-all`) ||
              // Then check server data
              extendedMedicineHistory.some((history: any) => {
                if (history.reminderId === medicine.reminderId) {
                  const historyDate = new Date(history.scheduledTime);
                  const historyDateStr = historyDate.getFullYear() + '-' +
                    String(historyDate.getMonth() + 1).padStart(2, '0') + '-' +
                    String(historyDate.getDate()).padStart(2, '0');
                  const historyTime = historyDate.getHours().toString().padStart(2, '0') + ':' +
                                    historyDate.getMinutes().toString().padStart(2, '0');
                  return historyDateStr === selectedDateStr && historyTime === time && history.status === 'taken';
                }
                return false;
              })
            );

            const toleranceTime = new Date(indonesiaReminderTime.getTime() + OVERDUE_TOLERANCE_MINUTES * 60 * 1000);
            const isOverdue = isToday && !isTakenOnSelectedDate && now > toleranceTime;
            const isUpcoming = isToday && !isTakenOnSelectedDate && now >= indonesiaReminderTime && now <= toleranceTime;

            // Debug logs (only in development)
            if (__DEV__) {
              console.log(`💊 Medicine "${medicine.medicineName}" Debug:`, {
                taskTime: time,
                reminderTime: indonesiaReminderTime.toISOString(),
                currentTime: now.toISOString(),
                toleranceTime: toleranceTime.toISOString(),
                isToday,
                isTakenOnSelectedDate,
                isOverdue,
                isUpcoming,
                medicineId: medicine.reminderId,
                totalHistoryCount: extendedMedicineHistory.length,
                relevantHistoryCount: extendedMedicineHistory.filter((h: any) => h.reminderId === medicine.reminderId).length
              });
            }

            allTimeBasedTasks.push({
              task: {
                ...medicineTask,
                id: `${medicineTask.id}-${time}`, // Add time to make ID unique for each time slot
                time: time,
                completed: isTakenOnSelectedDate
              },
              time: time,
              isOverdue: isOverdue,
              isUpcoming: isUpcoming
            });
          });
        }
      }
    });
  };

  // Collect all tasks
  collectAllTasks();

  // Debug: Log all collected time-based tasks (only in development)
  if (__DEV__ && allTimeBasedTasks.length > 0) {
    console.log('DEBUG: All time-based tasks:', allTimeBasedTasks.map(t => `${t.task.title} (${t.task.type}) - ${t.time} - Overdue: ${t.isOverdue} - Upcoming: ${t.isUpcoming}`));
  }

  // Now group and sort tasks properly
  const overdue: Task[] = [];
  const upcoming: Task[] = [];
  const timeBased: { [time: string]: Task[] } = {};

  // Process time-based tasks
  allTimeBasedTasks.forEach(({ task, time, isOverdue, isUpcoming }) => {
    if (isOverdue) {
      // Check if this task is already in overdue (to avoid duplicates)
      if (!overdue.some((t) => t.id === task.id)) {
        overdue.push({
          ...task,
          completed: false // Force completed = false for overdue tasks
        });
      }
    } else if (isUpcoming) {
      // Add to upcoming tasks
      if (!upcoming.some((t) => t.id === task.id)) {
        upcoming.push({
          ...task,
          completed: false // Keep as incomplete for upcoming
        });
      }
    } else {
      // Group by time for future tasks
      if (!timeBased[time]) {
        timeBased[time] = [];
      }
      timeBased[time].push(task);
    }
  });

  // Sort time-based tasks by time (ascending)
  const sortedTimeBased: { [time: string]: Task[] } = {};
  Object.keys(timeBased)
    .sort() // This sorts times as strings, which works for HH:MM format
    .forEach(time => {
      sortedTimeBased[time] = timeBased[time];
    });

  // Sort overdue tasks by time (descending - most recent first)
  overdue.sort((a, b) => {
    const timeA = parseInt(a.time.replace(':', ''));
    const timeB = parseInt(b.time.replace(':', ''));
    return timeB - timeA; // Descending order
  });

  // Sort upcoming tasks by time (ascending - earliest deadline first)
  upcoming.sort((a, b) => {
    const timeA = parseInt(a.time.replace(':', ''));
    const timeB = parseInt(b.time.replace(':', ''));
    return timeA - timeB; // Ascending order
  });

  return {
    overdue,
    upcoming,
    timeBased: sortedTimeBased
  };
}, [selectedDate, habits, medicines, extendedMedicineHistory, extendedHabitHistory, recentlyCompletedTasks]);

  const tasks = useMemo(() => generateTasksFromData(), [generateTasksFromData]);

  // Determine if we should show loading state - simplified logic
  const shouldShowLoading = React.useMemo(() => {
    // Show loading if:
    // 1. It's initial load (regardless of whether we have data yet)
    // 2. Explicitly loading tasks (but never during completion)
    const isInCompletionWindow = lastTaskClickTime.current > 0 && (Date.now() - lastTaskClickTime.current) < 5000;

    return (isInitialLoad && !isInCompletionWindow) ||
           (isLoadingTasks && !isInCompletionWindow);
  }, [isInitialLoad, isLoadingTasks]);

  // Filter tasks based on search query (for search modal only)
  const filteredTasks = {
    overdue: tasks.overdue.filter(task =>
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.subtitle.toLowerCase().includes(searchQuery.toLowerCase())
    ),
    upcoming: tasks.upcoming?.filter(task =>
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.subtitle.toLowerCase().includes(searchQuery.toLowerCase())
    ) || [],
    timeBased: Object.fromEntries(
      Object.entries(tasks.timeBased).map(([time, taskList]) => [
        time,
        taskList.filter(task =>
          task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          task.subtitle.toLowerCase().includes(searchQuery.toLowerCase())
        )
      ]).filter(([_, taskList]) => taskList.length > 0)
    ) as { [time: string]: Task[] }
  };

  // Clear search when modal closes
  const handleCloseSearch = () => {
    setSearchQuery('');
    setShowSearch(false);
  };

  // Get task counts
  const getTaskCount = (tasks: Task[]) => tasks.length;

  // Calendar navigation functions
  const previousMonth = () => {
    setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1));
  };

  const nextMonth = () => {
    setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1));
  };

  
  // State for inline month/year picker (not modal)
  const [showMonthYearPicker, setShowMonthYearPicker] = useState(false);

  // Helper function to close calendar and reset month/year picker
  const closeCalendar = () => {
    setShowCalendar(false);
    setShowMonthYearPicker(false);
  };


  // Get current year and generate year range
  const currentYear = new Date().getFullYear();
  const yearRange = Array.from({ length: 21 }, (_, i) => currentYear - 10 + i); // 10 years back, 10 years forward

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  // Get current time in Indonesia timezone for calendar comparison
  const getIndonesiaTimeForCalendar = (date: Date = new Date()) => {
    const utcTime = date.getTime() + (date.getTimezoneOffset() * 60000);
    const indonesiaTime = new Date(utcTime + (7 * 60 * 60 * 1000));
    return indonesiaTime;
  };

  // Generate calendar days with simple consistent 8-day display centered around selected date
  const generateCalendarDays = () => {
    const days = [];

    // Simple logic: Always show 4 days before + selected date + 3 days after
    const startDate = new Date(selectedDate);
    startDate.setDate(selectedDate.getDate() - 4); // 4 days before selected date

    const todayIndonesia = getIndonesiaTimeForCalendar();

    // Debug log (only in development)
    if (__DEV__) {
      console.log(`📅 Date Selector: 8 days centered around selected date`);
    }

    // Generate days (always exactly 8 days)
    for (let i = 0; i < 8; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      // Reset to midnight to avoid timezone issues
      date.setHours(0, 0, 0, 0);

      const todayReset = new Date(todayIndonesia);
      todayReset.setHours(0, 0, 0, 0);

      const selectedReset = new Date(selectedDate);
      selectedReset.setHours(0, 0, 0, 0);

      const isToday = date.toDateString() === todayReset.toDateString();
      const isSelected = date.toDateString() === selectedReset.toDateString();

      days.push({
        date: date,
        dayNumber: date.getDate(),
        dayName: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getDay()],
        isToday,
        isSelected
      });
    }
    return days;
  };

  const calendarDays = generateCalendarDays();

  // Auto-scroll date selector to keep selected date visible (supports dynamic day count)
  useEffect(() => {
    const scrollToSelectedDate = () => {
      if (dateSelectorRef.current) {
        // Find the index of selected date in calendarDays
        const selectedIndex = calendarDays.findIndex(day => day.isSelected);

        if (selectedIndex !== -1) {
          // Calculate scroll position
          const dateCardWidth = 70; // Width of each date card
          const dateCardMargin = 12; // Margin between cards
          const padding = 20; // Left padding
          const scrollPosition = selectedIndex * (dateCardWidth + dateCardMargin);

          // Use dynamic screen width with better centering logic
          const centerOffset = (screenWidth - dateCardWidth) / 2;

          // Calculate target scroll position
          let targetScrollX = scrollPosition - centerOffset + padding;

          // Ensure we don't scroll past the beginning
          targetScrollX = Math.max(0, targetScrollX);

          // Handle dynamic day count for proper boundary calculation
          const totalContentWidth = calendarDays.length * (dateCardWidth + dateCardMargin) + padding * 2;
          const maxScrollX = Math.max(0, totalContentWidth - screenWidth);
          targetScrollX = Math.min(targetScrollX, maxScrollX);

          // Debug log (only in development)
          if (__DEV__) {
            console.log(`🔄 Auto-scroll: Index ${selectedIndex} of ${calendarDays.length} days, TargetX ${targetScrollX}`);
          }

          // Scroll to position with smooth animation
          setTimeout(() => {
            dateSelectorRef.current?.scrollTo({
              x: targetScrollX,
              animated: true,
            });
          }, 200); // Consistent timing for smooth transitions
        }
      }
    };

    scrollToSelectedDate();
  }, [selectedDate, calendarDays, screenWidth]); // Add screenWidth as dependency


  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} backgroundColor={colors.background} />

      {/* Search Modal */}
      <Modal
        visible={showSearch}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowSearch(false)}
      >
        <SafeAreaView style={[styles.searchModalContainer, { backgroundColor: colors.background }]}>
          <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />

          <View style={styles.searchModalHeader}>
            <TouchableOpacity onPress={handleCloseSearch}>
              <Ionicons name="chevron-down" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.searchModalTitle, { color: colors.text }]}>Search Tasks</Text>
            <TouchableOpacity onPress={handleCloseSearch}>
              <Text style={[styles.searchModalCancel, { color: colors.primary }]}>Cancel</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.searchModalContent}>
            <View style={[styles.searchInputContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Ionicons name="search" size={20} color={colors.textSecondary} />
              <TextInput
                style={[styles.searchInput, { color: colors.text }]}
                placeholder={t('tasks.search')}
                placeholderTextColor={colors.textSecondary}
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoFocus
                clearButtonMode="while-editing"
              />
            </View>

            {searchQuery.length > 0 && (
              <View style={styles.searchResultsSection}>
                <Text style={[styles.searchResultsTitle, { color: colors.textSecondary }]}>
                  Search Results for &quot;{searchQuery}&quot;
                </Text>

                {getTaskCount(filteredTasks.overdue) === 0 &&
                 getTaskCount(filteredTasks.upcoming) === 0 &&
                 Object.keys(filteredTasks.timeBased).length === 0 ? (
                  <View style={styles.noResultsContainer}>
                    <Ionicons name="search-outline" size={48} color={colors.textSecondary} />
                    <Text style={[styles.noResultsText, { color: colors.text }]}>No results found</Text>
                    <Text style={[styles.noResultsSubtext, { color: colors.textSecondary }]}>
                      Try different keywords
                    </Text>
                  </View>
                ) : (
                  <ScrollView
                    style={styles.searchResultsScroll}
                    showsVerticalScrollIndicator={false}
                  >
                    {/* Overdue Tasks */}
                    {getTaskCount(filteredTasks.overdue) > 0 && (
                      <View style={styles.searchTaskSection}>
                        <View style={styles.searchSectionHeader}>
                          <Text style={[styles.searchSectionLabel, { color: '#F43F5E' }]}>Overdue</Text>
                          <Text style={[styles.searchTaskCount, { backgroundColor: '#F43F5E20', color: '#F43F5E' }]}>
                            {getTaskCount(filteredTasks.overdue)}
                          </Text>
                        </View>
                        {filteredTasks.overdue.map((task) => (
                          <View key={task.id} style={[styles.searchTaskItem, { backgroundColor: colors.card }]}>
                            <View style={[styles.searchTaskIconContainer, { backgroundColor: task.color + '20' }]}>
                              <View style={[styles.searchTaskIcon, { backgroundColor: task.color }]}>
                                <Text style={styles.searchTaskIconText}>
                                  {task.type === 'habit' ? task.icon : '💊'}
                                </Text>
                              </View>
                            </View>
                            <View style={styles.searchTaskInfo}>
                              <View style={styles.searchTaskTitleRow}>
                                <Text style={[styles.searchTaskTitle, { color: colors.text }]}>{task.title}</Text>
                                <View style={[styles.searchTaskTypeBadge, { backgroundColor: task.type === 'habit' ? '#84CC1620' : '#3B82F620' }]}>
                                  <Text style={[styles.searchTaskTypeText, { color: task.type === 'habit' ? '#84CC16' : '#3B82F6' }]}>
                                    {task.type === 'habit' ? 'Habit' : 'Medicine'}
                                  </Text>
                                </View>
                              </View>
                              <Text style={[styles.searchTaskSubtitle, { color: colors.textSecondary }]}>{task.subtitle}</Text>
                            </View>
                          </View>
                        ))}
                      </View>
                    )}

                    {/* Upcoming Tasks (Should Do Soon) */}
                    {getTaskCount(filteredTasks.upcoming) > 0 && (
                      <View style={styles.searchTaskSection}>
                        <View style={styles.searchSectionHeader}>
                          <Text style={[styles.searchSectionLabel, { color: '#F59E0B' }]}>Should Do Soon</Text>
                          <Text style={[styles.searchTaskCount, { backgroundColor: '#F59E0B20', color: '#F59E0B' }]}>
                            {getTaskCount(filteredTasks.upcoming)}
                          </Text>
                        </View>
                        {filteredTasks.upcoming.map((task) => (
                          <View key={task.id} style={[styles.searchTaskItem, { backgroundColor: colors.card }]}>
                            <View style={[styles.searchTaskIconContainer, { backgroundColor: task.color + '20' }]}>
                              <View style={[styles.searchTaskIcon, { backgroundColor: task.color }]}>
                                <Text style={styles.searchTaskIconText}>
                                  {task.type === 'habit' ? task.icon : '💊'}
                                </Text>
                              </View>
                            </View>
                            <View style={styles.searchTaskInfo}>
                              <View style={styles.searchTaskTitleRow}>
                                <Text style={[styles.searchTaskTitle, { color: colors.text }]}>{task.title}</Text>
                                <View style={[styles.searchTaskTypeBadge, { backgroundColor: task.type === 'habit' ? '#84CC1620' : '#3B82F620' }]}>
                                  <Text style={[styles.searchTaskTypeText, { color: task.type === 'habit' ? '#84CC16' : '#3B82F6' }]}>
                                    {task.type === 'habit' ? 'Habit' : 'Medicine'}
                                  </Text>
                                </View>
                              </View>
                              <Text style={[styles.searchTaskSubtitle, { color: colors.textSecondary }]}>{task.subtitle}</Text>
                            </View>
                          </View>
                        ))}
                      </View>
                    )}

                    
                    {/* Time-based Tasks */}
                    {Object.entries(filteredTasks.timeBased).map(([time, taskList]) => (
                      <View key={time} style={styles.searchTaskSection}>
                        <View style={styles.searchSectionHeader}>
                          <Text style={[styles.searchSectionLabel, { color: '#84CC16' }]}>{time}</Text>
                          <Text style={[styles.searchTaskCount, { backgroundColor: '#84CC1620', color: '#84CC16' }]}>
                            {getTaskCount(taskList)}
                          </Text>
                        </View>
                        {taskList.map((task) => (
                          <View key={task.id} style={[styles.searchTaskItem, { backgroundColor: colors.card }]}>
                            <View style={[styles.searchTaskIconContainer, { backgroundColor: task.color + '20' }]}>
                              <View style={[styles.searchTaskIcon, { backgroundColor: task.color }]}>
                                <Text style={styles.searchTaskIconText}>
                                  {task.type === 'habit' ? task.icon : '💊'}
                                </Text>
                              </View>
                            </View>
                            <View style={styles.searchTaskInfo}>
                              <View style={styles.searchTaskTitleRow}>
                                <Text style={[styles.searchTaskTitle, { color: colors.text }]}>{task.title}</Text>
                                <View style={[styles.searchTaskTypeBadge, { backgroundColor: task.type === 'habit' ? '#84CC1620' : '#3B82F620' }]}>
                                  <Text style={[styles.searchTaskTypeText, { color: task.type === 'habit' ? '#84CC16' : '#3B82F6' }]}>
                                    {task.type === 'habit' ? 'Habit' : 'Medicine'}
                                  </Text>
                                </View>
                              </View>
                              <Text style={[styles.searchTaskSubtitle, { color: colors.textSecondary }]}>{task.subtitle}</Text>
                            </View>
                          </View>
                        ))}
                      </View>
                    ))}
                  </ScrollView>
                )}
              </View>
            )}
          </View>
        </SafeAreaView>
      </Modal>

      {/* Calendar Modal */}
      <Modal
        visible={showCalendar}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => closeCalendar()}
      >
        <SafeAreaView style={[styles.calendarModal, { backgroundColor: colors.background }]}>
          <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />

          {/* Fixed Header */}
          <View style={[styles.calendarHeader, { borderBottomColor: colors.border }]}>
            <TouchableOpacity onPress={() => closeCalendar()}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>

            <View style={styles.calendarNavigation}>
              <TouchableOpacity onPress={previousMonth} style={styles.navButton}>
                <Ionicons name="chevron-back" size={20} color={colors.primary} />
              </TouchableOpacity>
              <Text style={[styles.calendarTitle, { color: colors.text }]}>
                {calendarMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </Text>
              <TouchableOpacity onPress={nextMonth} style={styles.navButton}>
                <Ionicons name="chevron-forward" size={20} color={colors.primary} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity onPress={() => closeCalendar()}>
              <Text style={[styles.calendarDone, { color: colors.primary }]}>Done</Text>
            </TouchableOpacity>
          </View>

          {/* Scrollable Content */}
          <ScrollView
            style={styles.calendarScrollableContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Month Year Quick Select - User Friendly */}
            <View style={[styles.quickSelectContainer, { borderBottomColor: colors.border }]}>
              <TouchableOpacity
                style={[styles.monthYearPickerButton, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() => setShowMonthYearPicker(!showMonthYearPicker)}
              >
                <Ionicons name="calendar-outline" size={20} color={colors.primary} />
                <Text style={[styles.monthYearPickerText, { color: colors.text }]}>
                  {monthNames[calendarMonth.getMonth()]} {calendarMonth.getFullYear()}
                </Text>
                <Ionicons name={showMonthYearPicker ? "chevron-up" : "chevron-down"} size={16} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Inline Month Year Picker */}
            {showMonthYearPicker && (
              <View style={[styles.inlineMonthYearPicker, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
                {/* Year Selection */}
                <View style={styles.pickerSection}>
                  <Text style={[styles.pickerSectionTitle, { color: colors.text }]}>Year</Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.yearPickerScroll}
                    contentContainerStyle={styles.yearPickerContent}
                  >
                    {yearRange.map((year) => (
                      <TouchableOpacity
                        key={year}
                        style={[
                          styles.yearPickerItem,
                          {
                            backgroundColor: calendarMonth.getFullYear() === year ? colors.primary : colors.card,
                            borderColor: colors.border
                          }
                        ]}
                        onPress={() => setCalendarMonth(new Date(year, calendarMonth.getMonth()))}
                      >
                        <Text style={[
                          styles.yearPickerText,
                          {
                            color: calendarMonth.getFullYear() === year ? '#FFFFFF' : colors.text
                          }
                        ]}>
                          {year}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>

                {/* Month Selection */}
                <View style={styles.pickerSection}>
                  <Text style={[styles.pickerSectionTitle, { color: colors.text }]}>Month</Text>
                  <View style={styles.monthPickerGrid}>
                    {monthNames.map((month, index) => (
                      <TouchableOpacity
                        key={month}
                        style={[
                          styles.monthPickerItem,
                          {
                            backgroundColor: calendarMonth.getMonth() === index ? colors.primary : colors.card,
                            borderColor: colors.border
                          }
                        ]}
                        onPress={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), index))}
                      >
                        <Text style={[
                          styles.monthPickerText,
                          {
                            color: calendarMonth.getMonth() === index ? '#FFFFFF' : colors.text
                          }
                        ]}>
                          {month}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Quick Selection */}
                <View style={styles.pickerSection}>
                  <Text style={[styles.pickerSectionTitle, { color: colors.text }]}>Quick Select</Text>
                  <View style={styles.quickSelectGrid}>
                    <TouchableOpacity
                      style={[styles.quickSelectButton, { backgroundColor: colors.card, borderColor: colors.border }]}
                      onPress={() => {
                        const now = new Date();
                        setCalendarMonth(new Date(now.getFullYear(), now.getMonth()));
                        setShowMonthYearPicker(false);
                      }}
                    >
                      <Ionicons name="today" size={20} color={colors.primary} />
                      <Text style={[styles.quickSelectButtonText, { color: colors.text }]}>Today</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.quickSelectButton, { backgroundColor: colors.card, borderColor: colors.border }]}
                      onPress={() => {
                        const now = new Date();
                        setCalendarMonth(new Date(now.getFullYear(), 0)); // January
                        setShowMonthYearPicker(false);
                      }}
                    >
                      <Ionicons name="calendar" size={20} color={colors.primary} />
                      <Text style={[styles.quickSelectButtonText, { color: colors.text }]}>This Year</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            )}

            {/* Calendar Grid */}
            <View style={styles.calendarGrid}>
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <View key={day} style={styles.dayHeader}>
                  <Text style={styles.dayHeaderText}>{day}</Text>
                </View>
              ))}

              {(() => {
                // Get the first day of the month and how many days in the month
                const firstDayOfMonth = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), 1);
                const lastDayOfMonth = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 0);
                const daysInMonth = lastDayOfMonth.getDate();

                // Get the day of the week for the first day (0 = Sunday, 1 = Monday, etc.)
                const firstDayOfWeek = firstDayOfMonth.getDay();

                // Calculate total cells needed (6 weeks * 7 days = 42 cells max)
                const totalCells = 42;
                const calendarDays = [];

                // Add empty cells for days before the first day of the month
                for (let i = 0; i < firstDayOfWeek; i++) {
                  calendarDays.push(null);
                }

                // Add all days of the month
                for (let day = 1; day <= daysInMonth; day++) {
                  calendarDays.push(day);
                }

                // Fill remaining cells with null to complete the grid
                while (calendarDays.length < totalCells) {
                  calendarDays.push(null);
                }

                return calendarDays.map((dayNumber, index) => {
                  if (dayNumber === null) {
                    return <View key={index} style={styles.dayCell} />;
                  }

                  const date = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), dayNumber);
                  const isSelected = date.toDateString() === selectedDate.toDateString();

                  // Check if today in Indonesia timezone
                  const todayIndonesia = getIndonesiaTimeForCalendar();
                  const todayReset = new Date(todayIndonesia);
                  todayReset.setHours(0, 0, 0, 0);

                  const dateReset = new Date(date);
                  dateReset.setHours(0, 0, 0, 0);
                  const isTodayIndonesia = dateReset.toDateString() === todayReset.toDateString();

                  return (
                    <View key={index} style={styles.dayCell}>
                      <TouchableOpacity
                        style={[
                          styles.dayButton,
                          {
                            backgroundColor: isSelected ? colors.primary : (isTodayIndonesia ? colors.primary + '20' : 'transparent'),
                            borderWidth: isSelected ? 2 : 1,
                            borderColor: isSelected ? colors.primary : colors.border
                          }
                        ]}
                        onPress={() => {
                          setSelectedDate(date);
                          closeCalendar();
                        }}
                      >
                        <Text style={[
                          styles.dayButtonText,
                          {
                            color: isSelected ? '#FFFFFF' : (isTodayIndonesia ? colors.primary : colors.text),
                            fontWeight: isSelected ? '700' : '600'
                          }
                        ]}>
                          {dayNumber}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  );
                });
              })()}
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>

  
      <View style={styles.container}>
        {/* Header Section */}
        <View style={[styles.headerContainer]}>
          <LinearGradient
            colors={[colors.background, colors.backgroundSecondary, colors.gradientStart]}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={styles.headerGradient}
          >
            <View
              style={[
                styles.circleBackground,
                { backgroundColor: colors.primary + '20' }
              ]}
            />

            <View style={styles.headerContent}>
              {/* Left side - Greeting */}
              <Text
                style={[styles.greeting, { color: colors.primary }]}
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                Hi, {(() => {
                  const displayName = user?.displayName || 'User';
                  const words = displayName.trim().split(' ');
                  if (words.length <= 2) return displayName;
                  return words.slice(0, 2).join(' ');
                })()}!
              </Text>
            </View>

            {/* Right side - Search and Calendar */}
            <View style={styles.headerRight}>
              <View style={styles.buttonsContainer}>
                <TouchableOpacity
                  style={[styles.searchButton, { backgroundColor: colors.card }]}
                  onPress={() => {
                    setSearchQuery(''); // Clear search when opening modal
                    setShowSearch(true);
                  }}
                >
                  <Ionicons name="search" size={24} color={colors.primary} />
                </TouchableOpacity>
                <View style={styles.calendarWithDate}>
                  <Text style={[styles.smallDateText, { color: colors.textSecondary }]}>
                    {getIndonesiaTimeForCalendar(selectedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', weekday: 'short' })}
                  </Text>
                  <TouchableOpacity
                    style={[styles.calendarButton, { backgroundColor: colors.card }]}
                    onPress={() => {
                      setShowCalendar(true);
                      setShowMonthYearPicker(false); // Reset month/year picker when opening calendar
                    }}
                  >
                    <Ionicons name="calendar-outline" size={20} color={colors.primary} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Date Selector */}
        <View
          style={[
            styles.dateSelectorContainer,
            {
              backgroundColor: colors.background,
              shadowColor: colors.shadow,
              borderBottomColor: colors.border
            }
          ]}
        >
          {/* Animated Today Button - Only shows when not viewing today */}
          {!isViewingToday() && (
            <Animated.View style={[
              styles.compactTodayButton,
              {
                backgroundColor: colors.card,
                borderColor: colors.primary,
                shadowColor: colors.shadow,
                opacity: todayButtonOpacity,
                transform: [{ scale: todayButtonScale }],
              }
            ]}>
              <TouchableOpacity
                style={styles.compactTodayButtonInner}
                onPress={goToToday}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="today"
                  size={14}
                  color={colors.primary}
                />
                <Text
                  style={[
                    styles.compactTodayButtonText,
                    {
                      color: colors.primary
                    }
                  ]}
                >
                  Today
                </Text>
              </TouchableOpacity>
            </Animated.View>
          )}

          <View style={styles.dateSelectorSection}>
            <ScrollView
              ref={dateSelectorRef}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.dateScrollContainer}
              overScrollMode="never"
            >
              <View style={styles.datePaddingLeft} />
              {calendarDays.map((day, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.dateCard,
                    {
                      backgroundColor: day.isSelected ? colors.primary : (day.isToday ? colors.primary + '15' : colors.card),
                      borderColor: day.isSelected ? colors.primary : (day.isToday ? colors.primary : colors.border),
                      shadowColor: colors.shadow,
                      borderWidth: day.isSelected ? 2 : 1,
                    }
                  ]}
                  onPress={() => setSelectedDate(day.date)}
                >
                  <Text style={[
                    styles.dateDay,
                    {
                      color: day.isSelected ? '#FFFFFF' : (day.isToday ? colors.primary : colors.textSecondary)
                    }
                  ]}>
                    {day.dayName}
                  </Text>
                  <Text style={[
                    styles.dateNumber,
                    {
                      color: day.isSelected ? '#FFFFFF' : (day.isToday ? colors.primary : colors.text),
                      fontWeight: day.isSelected ? '800' : (day.isToday ? '700' : '600')
                    }
                  ]}>
                    {day.dayNumber}
                  </Text>
                </TouchableOpacity>
              ))}
              <View style={styles.datePaddingRight} />
            </ScrollView>
          </View>
        </View>

      {/* Tasks Section */}
      <View style={[styles.tasksContainer, { backgroundColor: colors.background }]}>
        <ScrollView
          style={styles.tasksScrollView}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.tasksContent}>
            {/* Loading State - show when we need to load completion status */}
            {shouldShowLoading ? (
              <View style={styles.loadingContainer}>
                <LoadingAnimation size="medium" />
                <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
                  {t('tasks.loading')}
                </Text>
              </View>
            ) : (
              <>
                {/* Overdue Tasks */}
                {getTaskCount(tasks.overdue) > 0 && (
              <View style={styles.taskSection}>
                <View style={styles.sectionHeader}>
                  <Text style={[styles.sectionLabel, { color: '#F43F5E' }]}>Overdue</Text>
                  <Text style={[styles.taskCount, { backgroundColor: '#F43F5E20', color: '#F43F5E' }]}>{getTaskCount(tasks.overdue)}</Text>
                </View>
                {tasks.overdue.map((task) => (
                  <TouchableOpacity
                    key={task.id}
                    style={[
                      styles.taskItem,
                      styles.overdueTask,
                      {
                        backgroundColor: colors.card,
                        borderLeftColor: task.color
                      }
                    ]}
                    onPress={() => handleTaskClick(task)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.taskIconContainer, { backgroundColor: task.color + '20' }]}>
                      <View style={[styles.taskIcon, { backgroundColor: task.color }]}>
                        <Text style={styles.taskIconText}>
                          {task.type === 'habit' ? task.icon : '💊'}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.taskInfo}>
                      <View style={styles.taskTitleRow}>
                        <Text style={[styles.taskTitle, { color: colors.text }]}>{task.title}</Text>
                        <View style={[styles.taskTypeBadge, { backgroundColor: task.type === 'habit' ? '#84CC1620' : '#3B82F620' }]}>
                          <Text style={[styles.taskTypeText, { color: task.type === 'habit' ? '#84CC16' : '#3B82F6' }]}>
                            {task.type === 'habit' ? 'Habit' : 'Medicine'}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.taskTimeRow}>
                        <Text style={[styles.taskTime, { color: colors.textSecondary }]}>🕐 {task.time}</Text>
                        <Text style={[styles.taskSubtitle, { color: colors.textSecondary }]}>{task.subtitle}</Text>
                      </View>
                    </View>
                    <View style={styles.taskStatus}>
                      <Ionicons name="radio-button-off" size={20} color={task.color} />
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Upcoming Tasks (Should Do Soon) */}
            {getTaskCount(tasks.upcoming || []) > 0 && (
              <View style={styles.taskSection}>
                <View style={styles.sectionHeader}>
                  <Text style={[styles.sectionLabel, { color: '#F59E0B' }]}>Should Do Soon</Text>
                  <Text style={[styles.taskCount, { backgroundColor: '#F59E0B20', color: '#F59E0B' }]}>{getTaskCount(tasks.upcoming || [])}</Text>
                </View>
                {(tasks.upcoming || []).map((task) => (
                  <TouchableOpacity
                    key={task.id}
                    style={[
                      styles.taskItem,
                      {
                        backgroundColor: colors.card,
                        borderLeftColor: '#F59E0B'
                      }
                    ]}
                    onPress={() => handleTaskClick(task)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.taskIconContainer, { backgroundColor: task.color + '20' }]}>
                      <View style={[styles.taskIcon, { backgroundColor: task.color }]}>
                        <Text style={styles.taskIconText}>
                          {task.type === 'habit' ? task.icon : '💊'}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.taskInfo}>
                      <View style={styles.taskTitleRow}>
                        <Text style={[styles.taskTitle, { color: colors.text }]}>{task.title}</Text>
                        <View style={[styles.taskTypeBadge, { backgroundColor: task.type === 'habit' ? '#84CC1620' : '#3B82F620' }]}>
                          <Text style={[styles.taskTypeText, { color: task.type === 'habit' ? '#84CC16' : '#3B82F6' }]}>
                            {task.type === 'habit' ? 'Habit' : 'Medicine'}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.taskTimeRow}>
                        <Text style={[styles.taskTime, { color: colors.textSecondary }]}>🕐 {task.time}</Text>
                        <Text style={[styles.taskSubtitle, { color: colors.textSecondary }]}>{task.subtitle}</Text>
                      </View>
                    </View>
                    <View style={styles.taskStatus}>
                      <Ionicons name="time" size={20} color="#F59E0B" />
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            
            {/* Time-based Tasks */}
            {Object.entries(tasks.timeBased).map(([time, taskList]) => (
              <View key={time} style={styles.taskSection}>
                <View style={styles.sectionHeader}>
                  <Text style={[styles.sectionLabel, { color: '#84CC16' }]}>{time}</Text>
                  <Text style={[styles.taskCount, { backgroundColor: '#84CC1620', color: '#84CC16' }]}>{getTaskCount(taskList)}</Text>
                </View>
                {taskList.map((task) => (
                  <TouchableOpacity
                    key={task.id}
                    style={[
                      styles.taskItem,
                      {
                        backgroundColor: colors.card
                      }
                    ]}
                    onPress={() => handleTaskClick(task)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.taskIconContainer, { backgroundColor: task.color + '20' }]}>
                      <View style={[styles.taskIcon, { backgroundColor: task.color }]}>
                        <Text style={styles.taskIconText}>
                          {task.type === 'habit' ? task.icon : '💊'}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.taskInfo}>
                      <View style={styles.taskTitleRow}>
                        <Text style={[
                          styles.taskTitle,
                          {
                            color: colors.text,
                            textDecorationLine: task.completed ? 'line-through' : 'none',
                            opacity: task.completed ? 0.6 : 1
                          }
                        ]}>
                          {task.title}
                        </Text>
                        <View style={[styles.taskTypeBadge, { backgroundColor: task.type === 'habit' ? '#84CC1620' : '#3B82F620' }]}>
                          <Text style={[styles.taskTypeText, { color: task.type === 'habit' ? '#84CC16' : '#3B82F6' }]}>
                            {task.type === 'habit' ? 'Habit' : 'Medicine'}
                          </Text>
                        </View>
                      </View>
                      <Text style={[styles.taskSubtitle, { color: colors.textSecondary }]}>{task.subtitle}</Text>
                    </View>
                    <View style={styles.taskStatus}>
                      {task.completed ? (
                        <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                      ) : (
                        <Ionicons name="radio-button-off" size={20} color={colors.border} />
                      )}
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            ))}

                {/* Empty State */}
                {getTaskCount(tasks.overdue) === 0 &&
                 Object.keys(tasks.timeBased).length === 0 && (
                  <View style={styles.emptyState}>
                    <Ionicons name="search-outline" size={48} color={colors.textSecondary} />
                    <Text style={[styles.emptyStateText, { color: colors.text }]}>{t('tasks.noTasks')}</Text>
                    <Text style={[styles.emptyStateSubtext, { color: colors.textSecondary }]}>{t('tasks.tryAdjustSearch', 'Try adjusting your search')}</Text>
                  </View>
                )}
              </>
            )}
          </View>
        </ScrollView>
      </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerContainer: {
    paddingBottom: 20,
    minHeight: 88,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 1.5,
      },
      android: {
        elevation: 6,
        backgroundColor: '#ffffff',
      }
    })
  },
  headerGradient: {
    paddingTop: 20,
    paddingBottom: 24,
    paddingHorizontal: 20,
    minHeight: 88,
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  circleBackground: {
    position: 'absolute',
    top: '15%',
    right: '-10%',
    width: 150,
    height: 150,
    borderRadius: 999,
    opacity: 0.3,
  },
  headerContent: {
    flex: 1,
    justifyContent: 'center',
    maxWidth: '60%', // Prevent text from taking too much space
    marginRight: 10, // Add some spacing from right buttons
  },
  greeting: {
    fontSize: 32,
    fontWeight: '700',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  buttonsContainer: {
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: 8,
  },
  calendarWithDate: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  smallDateText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  searchButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateSelectorContainer: {
    borderBottomWidth: 1,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      }
    })
  },
  dateSelectorSection: {
    paddingTop: 20,
    paddingBottom: 48,
  },
  dateScrollContainer: {
  },
  compactTodayButton: {
    position: 'absolute',
    bottom: 8,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    gap: 4,
    zIndex: 10,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 3,
      },
      android: {
        elevation: 3,
      }
    })
  },
  compactTodayButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  compactTodayButtonText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  dateCard: {
    width: 70,
    height: 80,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    marginRight: 12, // Increased gap
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
      },
      android: {
        elevation: 3,
      }
    })
  },
  datePaddingLeft: {
    width: 20,
  },
  datePaddingRight: {
    width: 16,
  },
  dateDay: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  dateNumber: {
    fontSize: 20,
    fontWeight: '700',
  },
  tasksContainer: {
    flex: 1,
  },
  tasksScrollView: {
    flex: 1,
  },
  tasksContent: {
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  taskSection: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionLabel: {
    fontSize: 18,
    fontWeight: '700',
  },
  taskCount: {
    fontSize: 16,
    fontWeight: '600',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 30,
    textAlign: 'center',
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
      },
      android: {
        elevation: 6,
        backgroundColor: '#ffffff',
      }
    })
  },
  overdueTask: {
    borderLeftWidth: 4,
    borderLeftColor: '#FF5252',
  },
  taskIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  taskIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  taskIconText: {
    fontSize: 18,
  },
  taskInfo: {
    flex: 1,
  },
  taskTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
  },
  taskTypeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  taskTypeText: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  taskTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  taskTime: {
    fontSize: 13,
    fontWeight: '500',
  },
  taskSubtitle: {
    fontSize: 14,
    flex: 1,
  },
  taskStatus: {
    alignItems: 'center',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    minHeight: 200,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '500',
    marginTop: 20,
    textAlign: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 4,
  },
  emptyStateSubtext: {
    fontSize: 14,
  },
  // Search Modal
  searchModalContainer: {
    flex: 1,
  },
  searchModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  searchModalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  searchModalCancel: {
    fontSize: 16,
    fontWeight: '600',
  },
  searchModalContent: {
    flex: 1,
    padding: 20,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
    borderWidth: 1,
    marginBottom: 20,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  searchResultsSection: {
    flex: 1,
  },
  searchResultsTitle: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 16,
  },
  searchResultsScroll: {
    flex: 1,
  },
  searchTaskSection: {
    marginBottom: 24,
  },
  searchSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  searchSectionLabel: {
    fontSize: 16,
    fontWeight: '700',
  },
  searchTaskCount: {
    fontSize: 14,
    fontWeight: '600',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
    minWidth: 25,
    textAlign: 'center',
  },
  searchTaskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  searchTaskIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  searchTaskIcon: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchTaskIconText: {
    fontSize: 14,
  },
  searchTaskInfo: {
    flex: 1,
  },
  searchTaskTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  searchTaskTitle: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
    marginRight: 6,
  },
  searchTaskTypeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  searchTaskTypeText: {
    fontSize: 8,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  searchTaskSubtitle: {
    fontSize: 12,
  },
  noResultsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  noResultsText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 4,
  },
  noResultsSubtext: {
    fontSize: 14,
  },
  // Calendar Modal
  calendarModal: {
    flex: 1,
    backgroundColor: 'white',
  },
  calendarScrollableContent: {
    flex: 1,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  calendarNavigation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  navButton: {
    padding: 4,
  },
  calendarTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    minWidth: 150,
    textAlign: 'center',
  },
  quickSelectContainer: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  monthYearScroll: {
    marginBottom: 8,
    paddingHorizontal: 20,
  },
  monthButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginRight: 8,
    borderWidth: 1,
    minWidth: 50,
    alignItems: 'center',
  },
  monthButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  yearScroll: {
    paddingHorizontal: 20,
  },
  yearButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginRight: 8,
    borderWidth: 1,
    minWidth: 60,
    alignItems: 'center',
  },
  yearButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  calendarDone: {
    fontSize: 16,
    fontWeight: '600',
    color: '#84CC16',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  dayHeader: {
    width: `${100/7}%`,
    alignItems: 'center',
    paddingVertical: 12,
  },
  dayHeaderText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    color: '#999',
  },
  dayCell: {
    width: `${100/7}%`,
    alignItems: 'center',
    paddingVertical: 8,
  },
  dayButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  dayButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  // Month Year Picker Button
  monthYearPickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginHorizontal: 20,
  },
  monthYearPickerText: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  // Inline Month Year Picker
  inlineMonthYearPicker: {
    borderBottomWidth: 1,
    padding: 20,
  },
  pickerSection: {
    marginBottom: 24,
  },
  pickerSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  yearPickerScroll: {
    marginBottom: 8,
  },
  yearPickerContent: {
    paddingHorizontal: 5,
  },
  yearPickerItem: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    marginRight: 12,
    borderWidth: 1,
    minWidth: 70,
    alignItems: 'center',
  },
  yearPickerText: {
    fontSize: 16,
    fontWeight: '600',
  },
  monthPickerGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  monthPickerItem: {
    width: '30%',
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    marginBottom: 10,
  },
  monthPickerText: {
    fontSize: 14,
    fontWeight: '600',
  },
  quickSelectGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  quickSelectButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  quickSelectButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
});