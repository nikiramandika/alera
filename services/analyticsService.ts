import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import { medicineHistoryService } from './medicineService';
import { habitHistoryService } from './habitService';

// ANALYTICS COLLECTION (subcollection under users)
export const analyticsService = {
  // Save daily analytics data
  async saveDailyAnalytics(userId: string, data: {
    date: Date;
    medicinesTaken: number;
    medicinesMissed: number;
    habitsCompleted: number;
    habitsMissed: number;
    adherenceRate: number;
    completionRate: number;
  }): Promise<void> {
    try {
      const dateStr = data.date.toISOString().split('T')[0]; // YYYY-MM-DD
      const analyticsRef = doc(db, 'users', userId, 'analytics', dateStr);

      await setDoc(analyticsRef, {
        ...data,
        date: Timestamp.fromDate(data.date),
        updatedAt: serverTimestamp()
      }, { merge: true });
    } catch (error) {
      console.error('Error saving daily analytics:', error);
      throw error;
    }
  },

  // Get analytics data for date range
  async getAnalyticsData(userId: string, startDate: Date, endDate: Date): Promise<any[]> {
    try {
      const analyticsRef = collection(db, 'users', userId, 'analytics');
      const q = query(
        analyticsRef,
        where('date', '>=', Timestamp.fromDate(startDate)),
        where('date', '<=', Timestamp.fromDate(endDate)),
        orderBy('date', 'asc')
      );
      const querySnapshot = await getDocs(q);

      return querySnapshot.docs.map(doc => ({
        ...doc.data(),
        date: doc.data().date?.toDate?.() || new Date()
      }));
    } catch (error) {
      console.error('Error getting analytics data:', error);
      throw error;
    }
  },

  // Get weekly analytics summary
  async getWeeklyAnalytics(userId: string): Promise<{
    weekData: {
      date: string;
      medicinesTaken: number;
      medicinesMissed: number;
      habitsCompleted: number;
      habitsMissed: number;
      adherenceRate: number;
      completionRate: number;
    }[];
    totals: {
      totalMedicines: number;
      totalHabits: number;
      averageAdherence: number;
      averageCompletion: number;
    };
  }> {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - 7);

      const data = await this.getAnalyticsData(userId, startDate, endDate);

      // Generate data for all 7 days (even if no data exists)
      const weekData = [];
      const totals = {
        totalMedicines: 0,
        totalHabits: 0,
        averageAdherence: 0,
        averageCompletion: 0
      };

      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];

        const dayData = data.find(d => {
          const dStr = d.date.toISOString().split('T')[0];
          return dStr === dateStr;
        }) || {
          date: dateStr,
          medicinesTaken: 0,
          medicinesMissed: 0,
          habitsCompleted: 0,
          habitsMissed: 0,
          adherenceRate: 0,
          completionRate: 0
        };

        weekData.push(dayData);

        totals.totalMedicines += dayData.medicinesTaken;
        totals.totalHabits += dayData.habitsCompleted;
      }

      // Calculate averages
      const validDays = weekData.filter(d => d.medicinesTaken > 0 || d.habitsCompleted > 0).length;
      if (validDays > 0) {
        totals.averageAdherence = Math.round(
          weekData.reduce((sum, d) => sum + d.adherenceRate, 0) / validDays
        );
        totals.averageCompletion = Math.round(
          weekData.reduce((sum, d) => sum + d.completionRate, 0) / validDays
        );
      }

      return { weekData, totals };
    } catch (error) {
      console.error('Error getting weekly analytics:', error);
      throw error;
    }
  },

  // Get monthly analytics summary
  async getMonthlyAnalytics(userId: string): Promise<{
    monthData: {
      week: number;
      medicinesTaken: number;
      habitsCompleted: number;
      adherenceRate: number;
      completionRate: number;
    }[];
    monthlyTotals: {
      totalMedicines: number;
      totalHabits: number;
      averageAdherence: number;
      averageCompletion: number;
      bestDay: {
        date: string;
        medicinesTaken: number;
        habitsCompleted: number;
      };
      worstDay: {
        date: string;
        medicinesTaken: number;
        habitsCompleted: number;
      };
    };
  }> {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - 30);

      const data = await this.getAnalyticsData(userId, startDate, endDate);

      // Group by week
      const monthData = [];
      const monthlyTotals = {
        totalMedicines: 0,
        totalHabits: 0,
        averageAdherence: 0,
        averageCompletion: 0,
        bestDay: { date: '', medicinesTaken: 0, habitsCompleted: 0 },
        worstDay: { date: '', medicinesTaken: 0, habitsCompleted: 0 }
      };

      // Group data by weeks
      for (let week = 0; week < 4; week++) {
        const weekStart = new Date();
        weekStart.setDate(weekStart.getDate() - (week + 1) * 7);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);

        const weekData = data.filter(d =>
          d.date >= weekStart && d.date <= weekEnd
        );

        const weekSummary = {
          week: 4 - week,
          medicinesTaken: weekData.reduce((sum, d) => sum + d.medicinesTaken, 0),
          habitsCompleted: weekData.reduce((sum, d) => sum + d.habitsCompleted, 0),
          adherenceRate: weekData.length > 0
            ? Math.round(weekData.reduce((sum, d) => sum + d.adherenceRate, 0) / weekData.length)
            : 0,
          completionRate: weekData.length > 0
            ? Math.round(weekData.reduce((sum, d) => sum + d.completionRate, 0) / weekData.length)
            : 0
        };

        monthData.push(weekSummary);
        monthlyTotals.totalMedicines += weekSummary.medicinesTaken;
        monthlyTotals.totalHabits += weekSummary.habitsCompleted;

        // Track best and worst days
        weekData.forEach(day => {
          const total = day.medicinesTaken + day.habitsCompleted;
          if (total > monthlyTotals.bestDay.medicinesTaken + monthlyTotals.bestDay.habitsCompleted) {
            monthlyTotals.bestDay = {
              date: day.date.toISOString().split('T')[0],
              medicinesTaken: day.medicinesTaken,
              habitsCompleted: day.habitsCompleted
            };
          }
          if (total < monthlyTotals.worstDay.medicinesTaken + monthlyTotals.worstDay.habitsCompleted ||
              monthlyTotals.worstDay.date === '') {
            monthlyTotals.worstDay = {
              date: day.date.toISOString().split('T')[0],
              medicinesTaken: day.medicinesTaken,
              habitsCompleted: day.habitsCompleted
            };
          }
        });
      }

      // Calculate monthly averages
      const validDays = data.filter(d => d.medicinesTaken > 0 || d.habitsCompleted > 0).length;
      if (validDays > 0) {
        monthlyTotals.averageAdherence = Math.round(
          data.reduce((sum, d) => sum + d.adherenceRate, 0) / validDays
        );
        monthlyTotals.averageCompletion = Math.round(
          data.reduce((sum, d) => sum + d.completionRate, 0) / validDays
        );
      }

      monthData.reverse(); // Show most recent week first

      return { monthData, monthlyTotals };
    } catch (error) {
      console.error('Error getting monthly analytics:', error);
      throw error;
    }
  },

  // Generate today's analytics and save
  async generateTodayAnalytics(userId: string): Promise<void> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Get medicine data
      const medicineStats = await medicineHistoryService.getAdherenceStats(userId, 1);
      const todayMedicineHistory = await medicineHistoryService.getTodayMedicineHistory(userId);

      // Get habit data
      const habitStats = await habitHistoryService.getHabitStats(userId, 1);
      const todayHabitHistory = await habitHistoryService.getTodayHabitHistory(userId);

      // Calculate today's metrics
      const medicinesTaken = todayMedicineHistory.filter(h => h.status === 'taken').length;
      const medicinesMissed = todayMedicineHistory.filter(h => h.status === 'missed').length;
      const habitsCompleted = todayHabitHistory.filter(h => h.completed).length;

      const totalMedicines = medicinesTaken + medicinesMissed;
      const totalHabits = habitStats.totalHabits || 1;

      const adherenceRate = totalMedicines > 0 ? Math.round((medicinesTaken / totalMedicines) * 100) : 100;
      const completionRate = totalHabits > 0 ? Math.round((habitsCompleted / totalHabits) * 100) : 100;

      // Save analytics
      await this.saveDailyAnalytics(userId, {
        date: new Date(),
        medicinesTaken,
        medicinesMissed,
        habitsCompleted,
        habitsMissed: totalHabits - habitsCompleted,
        adherenceRate,
        completionRate
      });
    } catch (error) {
      console.error('Error generating today analytics:', error);
      throw error;
    }
  },

  // Get overall health score
  async getHealthScore(userId: string): Promise<{
    overallScore: number;
    medicationScore: number;
    habitScore: number;
    streakBonus: number;
    recommendations: string[];
  }> {
    try {
      // Get last 7 days analytics
      const { weekData } = await this.getWeeklyAnalytics(userId);

      // Calculate medication score (weight: 40%)
      const medicationAdherence = weekData.length > 0
        ? weekData.reduce((sum, d) => sum + d.adherenceRate, 0) / weekData.length
        : 0;
      const medicationScore = Math.min(100, medicationAdherence * 1.2); // Bonus for consistency

      // Calculate habit score (weight: 40%)
      const habitCompletion = weekData.length > 0
        ? weekData.reduce((sum, d) => sum + d.completionRate, 0) / weekData.length
        : 0;
      const habitScore = Math.min(100, habitCompletion * 1.1); // Slight bonus

      // Calculate streak bonus (weight: 20%)
      const habitStats = await habitHistoryService.getHabitStats(userId, 30);
      const streakBonus = Math.min(20, habitStats.bestStreak * 2); // Max 20 points

      // Calculate overall score
      const overallScore = Math.round(
        (medicationScore * 0.4) + (habitScore * 0.4) + (streakBonus * 0.2)
      );

      // Generate recommendations
      const recommendations = [];
      if (medicationAdherence < 80) {
        recommendations.push("Try setting up additional medication reminders");
      }
      if (habitCompletion < 80) {
        recommendations.push("Focus on building consistent habit routines");
      }
      if (habitStats.bestStreak < 7) {
        recommendations.push("Try to maintain at least a 7-day streak");
      }
      if (overallScore >= 90) {
        recommendations.push("Excellent work! Keep up the great consistency");
      }

      return {
        overallScore,
        medicationScore: Math.round(medicationScore),
        habitScore: Math.round(habitScore),
        streakBonus,
        recommendations
      };
    } catch (error) {
      console.error('Error calculating health score:', error);
      throw error;
    }
  }
};