import {
  collection,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  serverTimestamp,
  addDoc
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import { Habit, HabitHistory } from '@/types';

// HABITS COLLECTION (subcollection under users)
export const habitService = {
  // Add new habit
  async addHabit(userId: string, habit: Omit<Habit, 'habitId' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const habitsRef = collection(db, 'users', userId, 'habits');

      // Filter out undefined values to avoid Firebase errors
      const filteredHabit = { ...habit };
      if (filteredHabit.endDate === undefined) {
        delete filteredHabit.endDate;
      }
      if (filteredHabit.duration?.endDate === undefined) {
        delete filteredHabit.duration.endDate;
      }

      const docRef = await addDoc(habitsRef, {
        ...filteredHabit,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        streak: 0,
        bestStreak: 0,
        completedDates: []
      });
      return docRef.id;
    } catch (error) {
      console.error('Error adding habit:', error);
      throw error;
    }
  },

  // Get all active habits
  async getHabits(userId: string): Promise<Habit[]> {
    try {
      const habitsRef = collection(db, 'users', userId, 'habits');
      const q = query(habitsRef, where('isActive', '==', true));
      const querySnapshot = await getDocs(q);

      const today = new Date();
      today.setHours(0, 0, 0, 0); // Set to start of day

      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        let habitStartDate: Date;

        // Handle start date from multiple sources with priority order
        if (data.startDate) {
          if (typeof data.startDate === 'object' && 'toDate' in data.startDate && typeof data.startDate.toDate === 'function') {
            habitStartDate = data.startDate.toDate();
          } else {
            habitStartDate = new Date(data.startDate);
          }
        } else if (data.duration?.startDate) {
          if (typeof data.duration.startDate === 'object' && 'toDate' in data.duration.startDate && typeof data.duration.startDate.toDate === 'function') {
            habitStartDate = data.duration.startDate.toDate();
          } else {
            habitStartDate = new Date(data.duration.startDate);
          }
        } else if (data.createdAt?.toDate) {
          habitStartDate = data.createdAt.toDate();
        } else {
          habitStartDate = new Date();
        }

        // Set to start of day to avoid timezone issues
        habitStartDate.setHours(0, 0, 0, 0);

        return {
          ...data,
          habitId: doc.id,
          createdAt: data.createdAt?.toDate?.() || new Date(),
          updatedAt: data.updatedAt?.toDate?.() || new Date(),
          streak: data.streak || 0,
          bestStreak: data.bestStreak || 0,
          completedDates: data.completedDates || []
        };
      })
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()) as Habit[];
    } catch (error) {
      console.error('Error getting habits:', error);
      throw error;
    }
  },

  // Get habit by ID
  async getHabitById(userId: string, habitId: string): Promise<Habit | null> {
    try {
      const habitRef = doc(db, 'users', userId, 'habits', habitId);
      const habitDoc = await getDoc(habitRef);

      if (habitDoc.exists()) {
        const data = habitDoc.data();

        // Convert duration dates if they exist
        let duration = data.duration;
        if (duration) {
          if (duration.startDate) {
            if (typeof duration.startDate === 'object' && 'toDate' in duration.startDate && typeof duration.startDate.toDate === 'function') {
              duration.startDate = duration.startDate.toDate();
            } else {
              duration.startDate = new Date(duration.startDate);
            }
          }
          if (duration.endDate) {
            if (typeof duration.endDate === 'object' && 'toDate' in duration.endDate && typeof duration.endDate.toDate === 'function') {
              duration.endDate = duration.endDate.toDate();
            } else {
              duration.endDate = new Date(duration.endDate);
            }
          }
        }

        // Convert end date if it exists
        let endDate = data.endDate;
        if (endDate) {
          if (typeof endDate === 'object' && 'toDate' in endDate && typeof endDate.toDate === 'function') {
            endDate = endDate.toDate();
          } else {
            endDate = new Date(endDate);
          }
        }

        // Convert start date if it exists
        let startDate = data.startDate;
        if (startDate) {
          if (typeof startDate === 'object' && 'toDate' in startDate && typeof startDate.toDate === 'function') {
            startDate = startDate.toDate();
          } else {
            startDate = new Date(startDate);
          }
        }

        return {
          ...data,
          habitId: habitDoc.id,
          createdAt: data.createdAt?.toDate?.() || new Date(),
          updatedAt: data.updatedAt?.toDate?.() || new Date(),
          streak: data.streak || 0,
          bestStreak: data.bestStreak || 0,
          completedDates: data.completedDates || [],
          duration,
          endDate,
          startDate
        } as Habit;
      }
      return null;
    } catch (error) {
      console.error('Error getting habit:', error);
      throw error;
    }
  },

  // Update habit
  async updateHabit(userId: string, habitId: string, updates: Partial<Habit>): Promise<void> {
    try {
      const habitRef = doc(db, 'users', userId, 'habits', habitId);

      // Filter out undefined values to avoid Firebase errors
      const filteredUpdates = { ...updates };
      if (filteredUpdates.endDate === undefined) {
        delete filteredUpdates.endDate;
      }
      if (filteredUpdates.duration && filteredUpdates.duration.endDate === undefined) {
        delete filteredUpdates.duration.endDate;
      }

      await updateDoc(habitRef, {
        ...filteredUpdates,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating habit:', error);
      throw error;
    }
  },

  // Delete habit (hard delete for better UX - matches medicine service)
  async deleteHabit(userId: string, habitId: string): Promise<void> {
    try {
      const habitRef = doc(db, 'users', userId, 'habits', habitId);
      await deleteDoc(habitRef);
    } catch (error) {
      console.error('Error deleting habit:', error);
      throw error;
    }
  },

  // Get today's habits
  async getTodayHabits(userId: string): Promise<Habit[]> {
    try {
      const habits = await this.getHabits(userId);
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0); // Set to start of today for comparison
      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999); // Set to end of today for comparison

      return habits.filter(habit => {
        // Check if habit has expired first
      if (habit.endDate) {
        let endDate: Date;
        if (typeof habit.endDate === 'object' && 'toDate' in habit.endDate && typeof habit.endDate.toDate === 'function') {
          endDate = habit.endDate.toDate();
        } else {
          endDate = new Date(habit.endDate);
        }

        // Habit is active if end date is >= today start (inclusive of today)
        console.log(`Habit ${habit.habitName}: endDate = ${endDate.toISOString()}, todayStart = ${todayStart.toISOString()}, endDate < todayStart = ${endDate < todayStart}`);
        if (endDate < todayStart) {
          console.log(`Habit ${habit.habitName} has expired on ${endDate.toISOString()}, today is ${todayStart.toISOString()}`);
          return false;
        }
      } else if (habit.duration?.endDate) {
        let durationEndDate: Date;
        if (typeof habit.duration.endDate === 'object' && 'toDate' in habit.duration.endDate && typeof habit.duration.endDate.toDate === 'function') {
          durationEndDate = habit.duration.endDate.toDate();
        } else {
          durationEndDate = new Date(habit.duration.endDate);
        }

        // Habit is active if end date is >= today start (inclusive of today)
        console.log(`Habit ${habit.habitName}: durationEndDate = ${durationEndDate.toISOString()}, todayStart = ${todayStart.toISOString()}, durationEndDate < todayStart = ${durationEndDate < todayStart}`);
        if (durationEndDate < todayStart) {
          console.log(`Habit ${habit.habitName} has expired on ${durationEndDate.toISOString()}, today is ${todayStart.toISOString()}`);
          return false;
        }
      }

      // Check if habit is scheduled for today (regardless of start date)
      // Use frequency field first (from new create flow), fallback to schedule field
      const frequencyType = habit.frequency?.type || habit.schedule?.type;
      const frequencyDays = habit.frequency?.specificDays || habit.schedule?.days;

      if (frequencyType === 'daily') return true;
      if (frequencyType === 'interval') {
        const today = new Date().getDay();
        return frequencyDays?.includes(today);
      }
      return false;
      });
    } catch (error) {
      console.error('Error getting today habits:', error);
      throw error;
    }
  },

  // Update habit streak
  async updateHabitStreak(userId: string, habitId: string, increment: boolean = true): Promise<void> {
    try {
      const habit = await this.getHabitById(userId, habitId);
      if (!habit) return;

      const newStreak = increment ? habit.streak + 1 : Math.max(0, habit.streak - 1);
      const newBestStreak = Math.max(habit.bestStreak || 0, newStreak);
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format

      await this.updateHabit(userId, habitId, {
        streak: newStreak,
        bestStreak: newBestStreak,
        completedDates: increment
          ? [...habit.completedDates, today].filter((date, index, arr) => arr.indexOf(date) === index) // Remove duplicates
          : habit.completedDates.filter(date => date !== today)
      });
    } catch (error) {
      console.error('Error updating habit streak:', error);
      throw error;
    }
  },

  // Get habit completion percentage for today
  async getTodayCompletionPercentage(userId: string): Promise<number> {
    try {
      const todayHabits = await this.getTodayHabits(userId);
      if (todayHabits.length === 0) return 100;

      const completedToday = todayHabits.filter(habit => {
        const today = new Date().toISOString().split('T')[0];
        return habit.completedDates.includes(today);
      }).length;

      return Math.round((completedToday / todayHabits.length) * 100);
    } catch (error) {
      console.error('Error getting today completion percentage:', error);
      throw error;
    }
  },

  // Calculate best streak from completed dates
  calculateBestStreak(completedDates: string[]): number {
    if (completedDates.length === 0) return 0;

    // Sort dates in ascending order
    const sortedDates = completedDates.sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

    let bestStreak = 0;
    let currentStreak = 0;
    let lastDate: Date | null = null;

    for (const dateStr of sortedDates) {
      const currentDate = new Date(dateStr);
      currentDate.setHours(0, 0, 0, 0); // Set to start of day

      if (!lastDate) {
        currentStreak = 1;
      } else {
        // Check if this date is exactly 1 day after the last date
        const daysDiff = Math.floor((currentDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));

        if (daysDiff === 1) {
          currentStreak++;
        } else if (daysDiff > 1) {
          // Gap in dates, reset streak
          currentStreak = 1;
        }
        // If daysDiff === 0, it's the same day (shouldn't happen with unique dates)
      }

      bestStreak = Math.max(bestStreak, currentStreak);
      lastDate = currentDate;
    }

    return bestStreak;
  },

  // Update best streak for all habits (for migration)
  async updateAllBestStreaks(userId: string): Promise<void> {
    try {
      const habits = await this.getHabits(userId);

      for (const habit of habits) {
        const calculatedBestStreak = this.calculateBestStreak(habit.completedDates);

        // Only update if calculated best streak is different from stored best streak
        if (calculatedBestStreak !== habit.bestStreak) {
          await this.updateHabit(userId, habit.habitId, {
            bestStreak: calculatedBestStreak
          });
          console.log(`Updated best streak for habit ${habit.habitName}: ${habit.bestStreak} -> ${calculatedBestStreak}`);
        }
      }
    } catch (error) {
      console.error('Error updating all best streaks:', error);
      throw error;
    }
  },

  // Get best performing habits
  async getBestPerformingHabits(userId: string, limit = 3): Promise<Habit[]> {
    try {
      const habits = await this.getHabits(userId);
      return habits
        .sort((a, b) => b.bestStreak - a.bestStreak)
        .slice(0, limit);
    } catch (error) {
      console.error('Error getting best performing habits:', error);
      throw error;
    }
  }
};

// HABIT HISTORY COLLECTION (subcollection under habits)
export const habitHistoryService = {
  // Add habit completion record
  async addHabitHistory(userId: string, habitId: string, history: Omit<HabitHistory, 'historyId' | 'createdAt'>): Promise<string> {
    try {
      const historyRef = collection(db, 'users', userId, 'habits', habitId, 'history');
      const docRef = await addDoc(historyRef, {
        ...history,
        createdAt: serverTimestamp()
      });
      return docRef.id;
    } catch (error) {
      console.error('Error adding habit history:', error);
      throw error;
    }
  },

  // Get habit history
  async getHabitHistory(userId: string, habitId: string): Promise<HabitHistory[]> {
    try {
      const historyRef = collection(db, 'users', userId, 'habits', habitId, 'history');
      const q = query(historyRef, where('date', '>=',
        new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
      ));
      const querySnapshot = await getDocs(q);

      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          ...data,
          logId: doc.id,
          historyId: doc.id, // Keep for compatibility
          userId: userId,
          habitId: habitId,
          habitName: data.habitName || '',
          date: data.date?.toDate?.() || new Date(),
          completed: data.completed || false,
          progress: data.progress || { value: data.value || 1 },
          value: data.value || 1,
          completedAt: data.completedAt?.toDate?.() || null,
          completionTime: data.completionTime || null,
          createdAt: data.createdAt?.toDate?.() || new Date()
        } as HabitHistory;
      }).sort((a, b) => b.date.getTime() - a.date.getTime());
    } catch (error) {
      console.error('Error getting habit history:', error);
      throw error;
    }
  },

  // Get today's habit history
  async getTodayHabitHistory(userId: string): Promise<HabitHistory[]> {
    try {
      const habits = await habitService.getHabits(userId);
      const allHistory: HabitHistory[] = [];

      for (const habit of habits) {
        const history = await this.getHabitHistory(userId, habit.habitId);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const todayHistory = history.filter(h =>
          h.date >= today && h.date < tomorrow
        );
        allHistory.push(...todayHistory);
      }

      return allHistory.sort((a, b) => a.date.getTime() - b.date.getTime());
    } catch (error) {
      console.error('Error getting today habit history:', error);
      throw error;
    }
  },

  // Get habit history for date range (for calendar view)
  async getHabitHistoryForDateRange(userId: string, startDate: Date, endDate: Date): Promise<HabitHistory[]> {
    try {
      const habits = await habitService.getHabits(userId);
      const allHistory: HabitHistory[] = [];

      for (const habit of habits) {
        const history = await this.getHabitHistory(userId, habit.habitId);
        const rangeHistory = history.filter(h =>
          h.date >= startDate && h.date <= endDate
        );
        allHistory.push(...rangeHistory);
      }

      return allHistory.sort((a, b) => a.date.getTime() - b.date.getTime());
    } catch (error) {
      console.error('Error getting habit history for date range:', error);
      throw error;
    }
  },

  // Get habit history for specific date
  async getHabitHistoryForDate(userId: string, date: Date): Promise<HabitHistory[]> {
    try {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      return this.getHabitHistoryForDateRange(userId, startOfDay, endOfDay);
    } catch (error) {
      console.error('Error getting habit history for date:', error);
      throw error;
    }
  },

  // Mark habit as completed
  async markHabitCompleted(userId: string, habitId: string, value?: number, completionTime?: string, completionDate?: Date): Promise<void> {
    try {
      // Get habit details to include habitName
      const habit = await habitService.getHabitById(userId, habitId);

      // Use provided completionDate, otherwise use current time
      let finalCompletionDate = completionDate || new Date();
      if (completionTime) {
        const [hours, minutes] = completionTime.split(':').map(Number);
        finalCompletionDate.setHours(hours, minutes, 0, 0);
      }

      await this.addHabitHistory(userId, habitId, {
        logId: '', // Will be generated by the service
        userId,
        habitId,
        date: finalCompletionDate,
        completed: true,
        value: value || 1,
        progress: { value: value || 1 },
        habitName: habit?.habitName || '',
        completedAt: new Date(),
        completionTime: completionTime // Store the specific time this completion is for
      });

      // Update streak and completed dates
      await habitService.updateHabitStreak(userId, habitId, true);
    } catch (error) {
      console.error('Error marking habit as completed:', error);
      throw error;
    }
  },

  // Mark habit as incomplete (undo completion)
  async markHabitIncomplete(userId: string, habitId: string, completionTime?: string): Promise<void> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const historyRef = collection(db, 'users', userId, 'habits', habitId, 'history');

      // Build query based on whether we have a specific completion time
      let q;
      if (completionTime) {
        // If completionTime is specified, only delete that specific time completion
        q = query(historyRef,
          where('date', '>=', today),
          where('date', '<', tomorrow),
          where('completed', '==', true),
          where('completionTime', '==', completionTime)
        );
      } else {
        // If no completionTime specified, delete all completions for today (fallback behavior)
        q = query(historyRef,
          where('date', '>=', today),
          where('date', '<', tomorrow),
          where('completed', '==', true)
        );
      }

      const querySnapshot = await getDocs(q);

      // Delete matching completion record(s)
      for (const doc of querySnapshot.docs) {
        await deleteDoc(doc.ref);
      }

      // Update streak and completed dates
      await habitService.updateHabitStreak(userId, habitId, false);
    } catch (error) {
      console.error('Error marking habit as incomplete:', error);
      throw error;
    }
  },

  // Get habit statistics
  async getHabitStats(userId: string, days = 30): Promise<{
    totalHabits: number;
    totalCompletions: number;
    averageCompletionRate: number;
    bestStreak: number;
    currentStreaks: { habitId: string; habitName: string; streak: number }[];
  }> {
    try {
      const habits = await habitService.getHabits(userId);
      let totalCompletions = 0;
      let bestStreak = 0;
      const currentStreaks = habits.map(habit => ({
        habitId: habit.habitId,
        habitName: habit.habitName,
        streak: habit.streak
      }));

      for (const habit of habits) {
        const history = await this.getHabitHistory(userId, habit.habitId);
        const filteredHistory = history.filter(h => h.completed);
        totalCompletions += filteredHistory.length;
        bestStreak = Math.max(bestStreak, habit.streak);
      }

      const expectedCompletions = habits.length * days;
      const averageCompletionRate = expectedCompletions > 0
        ? Math.round((totalCompletions / expectedCompletions) * 100)
        : 0;

      return {
        totalHabits: habits.length,
        totalCompletions,
        averageCompletionRate,
        bestStreak,
        currentStreaks: currentStreaks.sort((a, b) => b.streak - a.streak)
      };
    } catch (error) {
      console.error('Error getting habit stats:', error);
      throw error;
    }
  },

  // Get weekly completion data
  async getWeeklyCompletionData(userId: string): Promise<{
    week: string[];
    completions: number[];
  }> {
    try {
      const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      const today = new Date();
      const weekData = days.map((_, index) => {
        const date = new Date(today);
        date.setDate(today.getDate() - (today.getDay() === 0 ? 6 : today.getDay() - 1) + index);
        return date;
      });

      const completions = [];
      for (const date of weekData) {
        const dayStart = new Date(date);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(date);
        dayEnd.setHours(23, 59, 59, 999);

        const habits = await habitService.getTodayHabits(userId);
        let dayCompletions = 0;

        for (const habit of habits) {
          const history = await this.getHabitHistory(userId, habit.habitId);
          const dayHistory = history.filter(h =>
            h.date >= dayStart && h.date <= dayEnd && h.completed
          );
          dayCompletions += dayHistory.length;
        }

        completions.push(dayCompletions);
      }

      return { week: days, completions };
    } catch (error) {
      console.error('Error getting weekly completion data:', error);
      throw error;
    }
  }
};