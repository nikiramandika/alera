import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  addDoc,
  Timestamp
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
          completedDates: data.completedDates || []
        };
      })
      .filter((habit: any) => {
        // Include only active habits that haven't expired
        if (!habit.isActive) return false;

        // Check if habit has expired (has end date and it's in the past)
        if (habit.endDate) {
          let endDate: Date;
          if (typeof habit.endDate === 'object' && 'toDate' in habit.endDate && typeof habit.endDate.toDate === 'function') {
            endDate = habit.endDate.toDate();
          } else {
            endDate = new Date(habit.endDate);
          }

          // Set to end of day for accurate comparison
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

          // Set to end of day for accurate comparison
          durationEndDate.setHours(23, 59, 59, 999);

          const today = new Date();
          today.setHours(23, 59, 59, 999);

          if (durationEndDate < today) {
            console.log(`Habit ${habit.habitName} has expired on ${durationEndDate.toISOString()}`);
            return false;
          }
        }

        return true;
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
        const data = habitDoc.data() as Habit;
        return {
          ...data,
          habitId: habitDoc.id,
          createdAt: data.createdAt?.toDate?.() || new Date(),
          updatedAt: data.updatedAt?.toDate?.() || new Date(),
          streak: data.streak || 0,
          completedDates: data.completedDates || []
        };
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
      if (filteredUpdates.duration?.endDate === undefined) {
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
      const today = new Date().getDay(); // 0 = Sunday, 1 = Monday, etc.
      const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      const todayDate = new Date();
      todayDate.setHours(0, 0, 0, 0);

      return habits.filter(habit => {
        // Get habit start date with proper priority
        let habitStartDate: Date;

        // Priority: startDate > duration.startDate > createdAt
        if (habit.startDate) {
          if (typeof habit.startDate === 'object' && 'toDate' in habit.startDate && typeof habit.startDate.toDate === 'function') {
            habitStartDate = habit.startDate.toDate();
          } else {
            habitStartDate = new Date(habit.startDate);
          }
        } else if (habit.duration?.startDate) {
          if (typeof habit.duration.startDate === 'object' && 'toDate' in habit.duration.startDate && typeof habit.duration.startDate.toDate === 'function') {
            habitStartDate = habit.duration.startDate.toDate();
          } else {
            habitStartDate = new Date(habit.duration.startDate);
          }
        } else if (habit.createdAt) {
          habitStartDate = habit.createdAt instanceof Date ? habit.createdAt :
                        (typeof habit.createdAt?.toDate === 'function' ? habit.createdAt.toDate() : new Date());
        } else {
          habitStartDate = new Date();
        }

        // Check if habit has expired first
      if (habit.endDate) {
        let endDate: Date;
        if (typeof habit.endDate === 'object' && 'toDate' in habit.endDate && typeof habit.endDate.toDate === 'function') {
          endDate = habit.endDate.toDate();
        } else {
          endDate = new Date(habit.endDate);
        }
        endDate.setHours(23, 59, 59, 999);

        if (endDate < todayDate) {
          console.log(`Habit ${habit.habitName} has expired on ${endDate.toISOString()}`);
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

        if (durationEndDate < todayDate) {
          console.log(`Habit ${habit.habitName} has expired on ${durationEndDate.toISOString()}`);
          return false;
        }
      }

      // Check if habit is scheduled for today (regardless of start date)
      // Use frequency field first (from new create flow), fallback to schedule field
      const frequencyType = habit.frequency?.type || habit.schedule?.type;
      const frequencyDays = habit.frequency?.specificDays || habit.schedule?.days;

      if (frequencyType === 'daily') return true;
      if (frequencyType === 'interval') {
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
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format

      await this.updateHabit(userId, habitId, {
        streak: newStreak,
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

  // Get best performing habits
  async getBestPerformingHabits(userId: string, limit = 3): Promise<Habit[]> {
    try {
      const habits = await this.getHabits(userId);
      return habits
        .sort((a, b) => b.streak - a.streak)
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
  async getHabitHistory(userId: string, habitId: string, limit = 30): Promise<HabitHistory[]> {
    try {
      const historyRef = collection(db, 'users', userId, 'habits', habitId, 'history');
      const q = query(historyRef, where('date', '>=',
        new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
      ));
      const querySnapshot = await getDocs(q);

      return querySnapshot.docs.map(doc => ({
        ...doc.data(),
        historyId: doc.id,
        date: doc.data().date?.toDate?.() || new Date(),
        createdAt: doc.data().createdAt?.toDate?.() || new Date()
      })).sort((a, b) => b.date.getTime() - a.date.getTime()) as HabitHistory[];
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
        const history = await this.getHabitHistory(userId, habit.habitId, 10);
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

  // Mark habit as completed
  async markHabitCompleted(userId: string, habitId: string, value?: number, notes?: string): Promise<void> {
    try {
      await this.addHabitHistory(userId, habitId, {
        habitId,
        date: new Date(),
        completed: true,
        value: value || 1,
        notes: notes || ''
      });

      // Update streak and completed dates
      await habitService.updateHabitStreak(userId, habitId, true);
    } catch (error) {
      console.error('Error marking habit as completed:', error);
      throw error;
    }
  },

  // Mark habit as incomplete (undo completion)
  async markHabitIncomplete(userId: string, habitId: string): Promise<void> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const historyRef = collection(db, 'users', userId, 'habits', habitId, 'history');
      const q = query(historyRef,
        where('date', '>=', today),
        where('date', '<', tomorrow),
        where('completed', '==', true)
      );
      const querySnapshot = await getDocs(q);

      // Delete today's completion record
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
        const history = await this.getHabitHistory(userId, habit.habitId, 100);
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
      const weekData = days.map((day, index) => {
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
          const history = await this.getHabitHistory(userId, habit.habitId, 100);
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