import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  query,
  where,
  orderBy,
  Timestamp,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import { useAuth } from './AuthContext';
import { Habit, HabitHistory } from '@/types';

interface HabitContextType {
  habits: Habit[];
  habitHistory: HabitHistory[];
  loading: boolean;
  addHabit: (habit: Omit<Habit, 'habitId' | 'userId' | 'createdAt' | 'updatedAt' | 'streak' | 'bestStreak'>) => Promise<{ success: boolean; error?: string }>;
  updateHabit: (id: string, habit: Partial<Habit>) => Promise<{ success: boolean; error?: string }>;
  deleteHabit: (id: string) => Promise<{ success: boolean; error?: string }>;
  markHabitCompleted: (habitId: string, progressValue: number) => Promise<{ success: boolean; error?: string }>;
  markHabitIncomplete: (habitId: string, date: Date) => Promise<{ success: boolean; error?: string }>;
  getTodayHabits: () => Habit[];
  getHabitProgress: (habitId: string, date: Date) => number;
  getHabitStreak: (habitId: string) => number;
  refreshHabits: () => Promise<void>;
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

  // Predefined habit templates
  const habitTemplates = [
    {
      habitName: 'Drink Water',
      habitType: 'water' as const,
      description: 'Stay hydrated throughout the day',
      target: { value: 8, unit: 'glasses', frequency: 'daily' as const },
      reminderTimes: ['08:00', '12:00', '16:00'],
      color: '#4ECDC4',
      icon: 'water',
    },
    {
      habitName: 'Exercise',
      habitType: 'exercise' as const,
      description: 'Stay active and healthy',
      target: { value: 30, unit: 'minutes', frequency: 'daily' as const },
      reminderTimes: ['07:00'],
      color: '#F47B9F',
      icon: 'fitness',
    },
    {
      habitName: 'Sleep Early',
      habitType: 'sleep' as const,
      description: 'Get adequate rest',
      target: { value: 8, unit: 'hours', frequency: 'daily' as const },
      reminderTimes: ['22:00'],
      color: '#C9B1FF',
      icon: 'bedtime',
    },
    {
      habitName: 'Meditation',
      habitType: 'meditation' as const,
      description: 'Practice mindfulness',
      target: { value: 10, unit: 'minutes', frequency: 'daily' as const },
      reminderTimes: ['07:30'],
      color: '#FFD93D',
      icon: 'meditation',
    },
  ];

  // Fetch habits from Firestore
  const fetchHabits = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const habitsQuery = query(
        collection(db, 'users', user.userId, 'habits'),
        where('isActive', '==', true),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(habitsQuery);
      const habitsData: Habit[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        habitsData.push({
          ...data,
          habitId: doc.id,
          userId: user.userId,
          createdAt: data.createdAt instanceof Date ? data.createdAt : data.createdAt.toDate(),
          updatedAt: data.updatedAt instanceof Date ? data.updatedAt : data.updatedAt.toDate(),
          startDate: data.startDate instanceof Date ? data.startDate : data.startDate.toDate(),
          endDate: data.endDate ? (data.endDate instanceof Date ? data.endDate : data.endDate.toDate()) : null,
        } as Habit);
      });

      setHabits(habitsData);
    } catch (error) {
      console.error('Error fetching habits:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch habit history from Firestore
  const fetchHabitHistory = async () => {
    if (!user) return;

    try {
      const historyQuery = query(
        collection(db, 'users', user.userId, 'habitHistory'),
        orderBy('date', 'desc')
      );

      const querySnapshot = await getDocs(historyQuery);
      const historyData: HabitHistory[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        historyData.push({
          ...data,
          logId: doc.id,
          userId: user.userId,
          date: data.date instanceof Date ? data.date : data.date.toDate(),
          completedAt: data.completedAt ? (data.completedAt instanceof Date ? data.completedAt : data.completedAt.toDate()) : null,
          createdAt: data.createdAt instanceof Date ? data.createdAt : data.createdAt.toDate(),
        } as HabitHistory);
      });

      setHabitHistory(historyData);
    } catch (error) {
      console.error('Error fetching habit history:', error);
    }
  };

  // Refresh all habit data
  const refreshHabits = async () => {
    await Promise.all([fetchHabits(), fetchHabitHistory()]);
  };

  useEffect(() => {
    if (user) {
      refreshHabits();
    } else {
      setHabits([]);
      setHabitHistory([]);
      setLoading(false);
    }
  }, [user]);

  // Add new habit
  const addHabit = async (habit: Omit<Habit, 'habitId' | 'userId' | 'createdAt' | 'updatedAt' | 'streak' | 'bestStreak'>): Promise<{ success: boolean; error?: string }> => {
    if (!user) return { success: false, error: 'No user logged in' };

    try {
      const habitData = {
        ...habit,
        userId: user.userId,
        streak: 0,
        bestStreak: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        startDate: Timestamp.fromDate(habit.startDate),
        endDate: habit.endDate ? Timestamp.fromDate(habit.endDate) : null,
      };

      const docRef = await addDoc(collection(db, 'users', user.userId, 'habits'), habitData);

      // Refresh habits list
      await fetchHabits();

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  // Update habit
  const updateHabit = async (id: string, habit: Partial<Habit>): Promise<{ success: boolean; error?: string }> => {
    if (!user) return { success: false, error: 'No user logged in' };

    try {
      const habitRef = doc(db, 'users', user.userId, 'habits', id);
      const updateData = {
        ...habit,
        updatedAt: serverTimestamp(),
        ...(habit.startDate && { startDate: Timestamp.fromDate(habit.startDate) }),
        ...(habit.endDate && { endDate: Timestamp.fromDate(habit.endDate) }),
      };

      await updateDoc(habitRef, updateData);

      // Refresh habits list
      await fetchHabits();

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  // Delete habit
  const deleteHabit = async (id: string): Promise<{ success: boolean; error?: string }> => {
    if (!user) return { success: false, error: 'No user logged in' };

    try {
      const habitRef = doc(db, 'users', user.userId, 'habits', id);
      await deleteDoc(habitRef);

      // Refresh habits list
      await fetchHabits();

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  // Mark habit as completed
  const markHabitCompleted = async (habitId: string, progressValue: number): Promise<{ success: boolean; error?: string }> => {
    if (!user) return { success: false, error: 'No user logged in' };

    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Check if already logged for today
      const existingLog = habitHistory.find(log =>
        log.habitId === habitId &&
        log.date.getTime() === today.getTime()
      );

      if (existingLog) {
        // Update existing log
        const logRef = doc(db, 'users', user.userId, 'habitHistory', existingLog.logId);
        await updateDoc(logRef, {
          completed: true,
          progress: { value: progressValue },
          completedAt: serverTimestamp(),
        });
      } else {
        // Create new log
        const habit = habits.find(h => h.habitId === habitId);
        const historyData = {
          habitId,
          userId: user.userId,
          habitName: habit?.habitName || 'Unknown Habit',
          date: Timestamp.fromDate(today),
          completed: true,
          progress: { value: progressValue },
          completedAt: serverTimestamp(),
          createdAt: serverTimestamp(),
        };

        await addDoc(collection(db, 'users', user.userId, 'habitHistory'), historyData);
      }

      // Update streak
      await updateHabitStreak(habitId);

      // Refresh history
      await fetchHabitHistory();

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  // Mark habit as incomplete
  const markHabitIncomplete = async (habitId: string, date: Date): Promise<{ success: boolean; error?: string }> => {
    if (!user) return { success: false, error: 'No user logged in' };

    try {
      const logDate = new Date(date);
      logDate.setHours(0, 0, 0, 0);

      const existingLog = habitHistory.find(log =>
        log.habitId === habitId &&
        log.date.getTime() === logDate.getTime()
      );

      if (existingLog) {
        const logRef = doc(db, 'users', user.userId, 'habitHistory', existingLog.logId);
        await updateDoc(logRef, {
          completed: false,
          progress: { value: 0 },
          completedAt: null,
        });
      }

      // Update streak
      await updateHabitStreak(habitId);

      // Refresh history
      await fetchHabitHistory();

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  // Update habit streak
  const updateHabitStreak = async (habitId: string) => {
    if (!user) return;

    const habit = habits.find(h => h.habitId === habitId);
    if (!habit) return;

    const streak = calculateHabitStreak(habitId);
    const bestStreak = Math.max(habit.bestStreak, streak);

    await updateHabit(habitId, { streak, bestStreak });
  };

  // Calculate habit streak
  const calculateHabitStreak = (habitId: string): number => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let streak = 0;
    let currentDate = new Date(today);

    while (true) {
      const log = habitHistory.find(h =>
        h.habitId === habitId &&
        h.date.getTime() === currentDate.getTime()
      );

      if (log && log.completed) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else {
        break;
      }
    }

    return streak;
  };

  // Get today's habits
  const getTodayHabits = (): Habit[] => {
    const today = new Date();
    const dayOfWeek = today.getDay();

    return habits.filter(habit => {
      // Check if habit is active for today
      if (habit.endDate && today > habit.endDate) {
        return false;
      }

      // Check if today is a reminder day
      return habit.reminderDays.includes(dayOfWeek);
    });
  };

  // Get habit progress for a specific date
  const getHabitProgress = (habitId: string, date: Date): number => {
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);

    const log = habitHistory.find(h =>
      h.habitId === habitId &&
      h.date.getTime() === targetDate.getTime()
    );

    return log?.progress.value || 0;
  };

  // Get habit streak
  const getHabitStreak = (habitId: string): number => {
    const habit = habits.find(h => h.habitId === habitId);
    return habit?.streak || 0;
  };

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
    getHabitStreak,
    refreshHabits,
  };

  return (
    <HabitContext.Provider value={value}>
      {children}
    </HabitContext.Provider>
  );
};