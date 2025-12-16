import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { habitService, habitHistoryService } from '@/services';
import { notificationScheduler } from '@/services/notificationScheduler';
import { Habit, HabitHistory } from '@/types';

interface HabitContextType {
  habits: Habit[];
  habitHistory: HabitHistory[];
  loading: boolean;
  addHabit: (habit: Omit<Habit, 'habitId' | 'createdAt' | 'updatedAt'>) => Promise<{ success: boolean; error?: string }>;
  updateHabit: (id: string, habit: Partial<Habit>) => Promise<{ success: boolean; error?: string }>;
  deleteHabit: (id: string) => Promise<{ success: boolean; error?: string }>;
  markHabitCompleted: (habitId: string, value?: number, notes?: string, completionTime?: string, completionDate?: Date) => Promise<{ success: boolean; error?: string }>;
  markHabitIncomplete: (habitId: string, completionTime?: string) => Promise<{ success: boolean; error?: string }>;
  getTodayHabits: () => Habit[];
  getHabitProgress: (habitId: string) => number;
  refreshHabits: () => Promise<void>;
  getTodayProgress: () => number;
  getHabitHistoryForDate: (date: Date) => Promise<HabitHistory[]>;
  getHabitHistoryForDateRange: (startDate: Date, endDate: Date) => Promise<HabitHistory[]>;
}

const HabitContext = createContext<HabitContextType | undefined>(undefined);

export const useHabit = () => {
  const context = useContext(HabitContext);
  if (context === undefined) {
    throw new Error('useHabit must be used within a HabitProvider');
  }
  return context;
};

export const HabitProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [habitHistory, setHabitHistory] = useState<HabitHistory[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch habits and history
  const fetchData = useCallback(async () => {
    if (!user) {
      setHabits([]);
      setHabitHistory([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const [habitsData, historyData] = await Promise.all([
        habitService.getHabits(user.userId),
        habitHistoryService.getTodayHabitHistory(user.userId)
      ]);

      setHabits(habitsData);
      setHabitHistory(historyData);

      // Migration: Update best streaks for habits that don't have them or have incorrect values
      try {
        await habitService.updateAllBestStreaks(user.userId);
        // Refetch habits to get updated best streak values
        const updatedHabitsData = await habitService.getHabits(user.userId);
        setHabits(updatedHabitsData);
      } catch (migrationError) {
        console.warn('Best streak migration failed:', migrationError);
        // Don't fail the whole process if migration fails
      }
    } catch (error) {
      console.error('Error fetching habit data:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Add new habit
  const addHabit = async (habit: Omit<Habit, 'habitId' | 'createdAt' | 'updatedAt'>) => {
    if (!user) return { success: false, error: 'User not authenticated' };

    try {
      console.log('🔍 [DEBUG] Adding habit:', habit.habitName);
      console.log('🔍 [DEBUG] Habit reminder times:', habit.reminderTimes);
      console.log('🔍 [DEBUG] Habit target:', habit.target);

      // Add habit to database first
      const habitId = await habitService.addHabit(user.userId, habit);
      console.log('🔍 [DEBUG] Habit added with ID:', habitId);

      // Schedule real-time notifications for each reminder time
      const timesToSchedule = habit.frequency?.times || habit.reminderTimes || [];
      console.log('🔍 [DEBUG] Habit - Times to schedule for real-time checking:', timesToSchedule);

      if (timesToSchedule.length > 0 && habitId) {

        for (const reminderTime of timesToSchedule) {
          console.log('🔍 [DEBUG] Habit - Adding real-time notification scheduler for time:', reminderTime);

          // Add to notification scheduler for real-time checking
          await notificationScheduler.addNotification({
            habitId: habitId,
            time: reminderTime,
            title: '💪 Habit Reminder',
            body: `Time for ${habit.habitName}${habit.target?.value ? ` (${habit.target.value} ${habit.target.unit})` : ''}`,
            type: 'habit',
          });

          console.log('✅ [DEBUG] Habit - Real-time notification scheduler added for time:', reminderTime);
        }

        console.log('🔍 [DEBUG] Habit - Total real-time notifications scheduled:', timesToSchedule.length);
      } else {
        console.log('⚠️ [DEBUG] Habit - No times to schedule real-time notifications');
      }

      await fetchData(); // Refresh data
      return { success: true };
    } catch (error) {
      console.error('Error adding habit:', error);
      return { success: false, error: 'Failed to add habit' };
    }
  };

  // Update habit
  const updateHabit = async (id: string, updates: Partial<Habit>) => {
    if (!user) return { success: false, error: 'User not authenticated' };

    try {
      // Get the existing habit before updating
      const existingHabit = habits.find(h => h.habitId === id);

      // Remove old real-time notifications
      if (existingHabit) {
        await notificationScheduler.removeNotifications(undefined, existingHabit.habitId);
        console.log('🔍 [DEBUG] Habit Update - Removed old real-time notifications');
      }

      // Apply the updates
      await habitService.updateHabit(user.userId, id, updates);

      // Apply the updates to existing habit
      const updatedHabit = { ...existingHabit, habitId: id, ...updates };

      // Use the new frequency structure first, fallback to reminderTimes for compatibility
      const timesToSchedule = updatedHabit.frequency?.times || updatedHabit.reminderTimes || [];
      console.log('🔍 [DEBUG] Habit Update - Times to reschedule for real-time:', timesToSchedule);

      // Add new real-time notifications
      const notificationTimes = timesToSchedule;

      if (notificationTimes.length > 0) {
        for (const reminderTime of notificationTimes) {
          console.log('🔍 [DEBUG] Habit Update - Adding real-time notification for time:', reminderTime);

          await notificationScheduler.addNotification({
            habitId: id,
            time: reminderTime,
            title: '💪 Habit Reminder',
            body: `Time for ${updatedHabit.habitName}${updatedHabit.target?.value ? ` (${updatedHabit.target.value} ${updatedHabit.target.unit})` : ''}`,
            type: 'habit',
          });

          console.log('✅ [DEBUG] Habit Update - Real-time notification added for time:', reminderTime);
        }

        console.log('🔍 [DEBUG] Habit Update - Total real-time notifications rescheduled:', timesToSchedule.length);
      } else {
        console.log('⚠️ [DEBUG] Habit Update - No times to schedule real-time notifications');
      }

      await fetchData(); // Refresh data
      return { success: true };
    } catch (error) {
      console.error('Error updating habit:', error);
      return { success: false, error: 'Failed to update habit' };
    }
  };

  // Delete habit
  const deleteHabit = async (id: string) => {
    if (!user) return { success: false, error: 'User not authenticated' };

    try {
      // Remove real-time notifications before deleting from database
      await notificationScheduler.removeNotifications(undefined, id);
      console.log('🔍 [DEBUG] Delete - Removed real-time notifications for habit:', id);

      // Delete from database
      await habitService.deleteHabit(user.userId, id);

      await fetchData(); // Refresh data
      return { success: true };
    } catch (error) {
      console.error('Error deleting habit:', error);
      return { success: false, error: 'Failed to delete habit' };
    }
  };

  // Mark habit as completed
  const markHabitCompleted = async (habitId: string, value?: number, notes?: string, completionTime?: string, completionDate?: Date) => {
    if (!user) return { success: false, error: 'User not authenticated' };

    try {
      await habitHistoryService.markHabitCompleted(user.userId, habitId, value, completionTime, completionDate);
      await fetchData(); // Refresh data to update streaks
      return { success: true };
    } catch (error) {
      console.error('Error marking habit as completed:', error);
      return { success: false, error: 'Failed to mark habit as completed' };
    }
  };

  // Mark habit as incomplete (undo completion)
  const markHabitIncomplete = async (habitId: string, completionTime?: string) => {
    if (!user) return { success: false, error: 'User not authenticated' };

    try {
      await habitHistoryService.markHabitIncomplete(user.userId, habitId, completionTime);
      await fetchData(); // Refresh data to update streaks
      return { success: true };
    } catch (error) {
      console.error('Error marking habit as incomplete:', error);
      return { success: false, error: 'Failed to undo habit completion' };
    }
  };

  // Get today's habits
  const getTodayHabits = () => {
    const now = new Date();
    return habits.filter(habit => {
      // Check if habit has expired first
      if (habit.endDate) {
        let endDate: Date;
        if (typeof habit.endDate === 'object' && 'toDate' in habit.endDate && typeof habit.endDate.toDate === 'function') {
          endDate = habit.endDate.toDate();
        } else {
          endDate = new Date(habit.endDate);
        }
        endDate.setHours(23, 59, 59, 999);

        const today = new Date();
        today.setHours(23, 59, 59, 999);

        if (endDate <= today) {
          console.log(`Habit ${habit.habitName} has expired on ${endDate.toISOString()}, today is ${today.toISOString()}`);
          return false;
        }
      } else if (habit.duration?.endDate) {
        let durationEndDate: Date;
        if (typeof habit.duration.endDate === 'object' && 'toDate' in habit.duration.endDate && typeof habit.duration.endDate.toDate === 'function') {
          durationEndDate = habit.duration.endDate.toDate();
        } else {
          durationEndDate = new Date(habit.duration.endDate);
        }
        durationEndDate.setHours(23, 59, 59, 999);

        const today = new Date();
        today.setHours(23, 59, 59, 999);

        if (durationEndDate <= today) {
          console.log(`Habit ${habit.habitName} has expired on ${durationEndDate.toISOString()}`);
          return false;
        }
      }

      // Use frequency field first, fallback to schedule field
      const frequencyType = habit.frequency?.type || habit.schedule?.type;
      const frequencyDays = habit.frequency?.specificDays || habit.schedule?.days;

      if (frequencyType === 'daily') return true;
      if (frequencyType === 'interval') {
        const today = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
        return frequencyDays?.includes(today);
      }
      return false;
    });
  };

  // Get progress for specific habit (0-100%)
  const getHabitProgress = (habitId: string): number => {
    const habit = habits.find(h => h.habitId === habitId);
    if (!habit) return 0;

    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const isCompletedToday = habit.completedDates.includes(today);

    // If target is based on value (like glasses of water)
    if (habit.target.unit !== 'times') {
      const todayHistory = habitHistory.filter(h =>
        h.habitId === habitId &&
        h.completed &&
        h.date.toISOString().split('T')[0] === today
      );
      const totalValue = todayHistory.reduce((sum, h) => sum + (h.value || 1), 0);
      return Math.min(100, Math.round((totalValue / habit.target.value) * 100));
    }

    // For frequency-based habits
    return isCompletedToday ? 100 : 0;
  };

  // Get today's overall progress
  const getTodayProgress = (): number => {
    const todayHabits = getTodayHabits();
    if (todayHabits.length === 0) return 100;

    const completedCount = todayHabits.filter(habit => {
      const progress = getHabitProgress(habit.habitId);
      return progress >= 100;
    }).length;

    return Math.round((completedCount / todayHabits.length) * 100);
  };

  // Refresh habit data
  const refreshHabits = async () => {
    await fetchData();
  };

  // Get habit history for specific date
  const getHabitHistoryForDate = async (date: Date): Promise<HabitHistory[]> => {
    if (!user) return [];
    try {
      return await habitHistoryService.getHabitHistoryForDate(user.userId, date);
    } catch (error) {
      console.error('Error getting habit history for date:', error);
      return [];
    }
  };

  // Get habit history for date range
  const getHabitHistoryForDateRange = async (startDate: Date, endDate: Date): Promise<HabitHistory[]> => {
    if (!user) return [];
    try {
      return await habitHistoryService.getHabitHistoryForDateRange(user.userId, startDate, endDate);
    } catch (error) {
      console.error('Error getting habit history for date range:', error);
      return [];
    }
  };

  // Fetch data when user changes
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const value: HabitContextType = {
    habits,
    habitHistory,
    loading,
    addHabit,
    updateHabit,
    deleteHabit,
    markHabitCompleted,
    markHabitIncomplete,
    getTodayHabits,
    getHabitProgress,
    refreshHabits,
    getTodayProgress,
    getHabitHistoryForDate,
    getHabitHistoryForDateRange,
  };

  return (
    <HabitContext.Provider value={value}>
      {children}
    </HabitContext.Provider>
  );
};