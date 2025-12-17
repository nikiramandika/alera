import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { LineChart, PieChart } from 'react-native-chart-kit';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
  FadeInDown,
} from 'react-native-reanimated';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, Spacing, BorderRadius, Typography } from '@/constants/theme';
import { useMedicine } from '@/contexts/MedicineContext';
import { useHabit } from '@/contexts/HabitContext';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { analyticsService, medicineHistoryService, habitHistoryService } from '@/services';

const { width: screenWidth } = Dimensions.get('window');

export default function AnalyticsScreen() {
  const { t } = useTranslation();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { user } = useAuth();
  const { medicines, medicineHistory } = useMedicine();
  const { habits, habitHistory } = useHabit();

  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year'>('week');
  const [selectedTab, setSelectedTab] = useState<'overview' | 'medicines' | 'habits'>('overview');
  const [weeklyData, setWeeklyData] = useState<any>(null);

  // Local state for extended history (for analytics)
  const [extendedMedicineHistory, setExtendedMedicineHistory] = useState<any[]>([]);
  const [extendedHabitHistory, setExtendedHabitHistory] = useState<any[]>([]);

  // Animation values
  const headerScale = useSharedValue(0.9);
  const cardTranslateY = useSharedValue(50);

  useEffect(() => {
    headerScale.value = withDelay(200, withSpring(1, {
      damping: 15,
      stiffness: 100,
    }));

    cardTranslateY.value = withDelay(400, withSpring(0, {
      damping: 15,
      stiffness: 100,
    }));
  }, [headerScale, cardTranslateY]);

  // Header animation
  const headerAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: headerScale.value }]
  }));

  // Cards animation
  const cardsAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: cardTranslateY.value }]
  }));

  // Fetch analytics data
  useEffect(() => {
    const fetchAnalyticsData = async () => {
      if (!user) {
        return;
      }

      try {
        const today = new Date();
        let startDate = new Date(today);
        let endDate = new Date(today);

        // Set date range based on selected period
        switch (selectedPeriod) {
          case 'week':
            startDate.setDate(today.getDate() - today.getDay() + 1); // Monday
            endDate = new Date(startDate);
            endDate.setDate(startDate.getDate() + 6); // Sunday
            break;
          case 'month':
            startDate.setDate(1); // First day of month
            endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0); // Last day of month
            break;
          case 'year':
            startDate.setMonth(0, 1); // January 1st
            endDate.setMonth(11, 31); // December 31st
            break;
        }

        endDate.setHours(23, 59, 59, 999);

        // Get history for the selected period
        const [periodMedicineHistory, periodHabitHistory, weekly] = await Promise.all([
          medicineHistoryService.getMedicineHistoryForDateRange(user.userId, startDate, endDate),
          habitHistoryService.getHabitHistoryForDateRange(user.userId, startDate, endDate),
          analyticsService.getWeeklyAnalytics(user.userId)
        ]);

        // Store extended history locally for charts
        setExtendedMedicineHistory(periodMedicineHistory);
        setExtendedHabitHistory(periodHabitHistory);
        setWeeklyData(weekly);

        console.log(`📊 Analytics Data (${selectedPeriod}):`, {
          periodMedicineHistory: periodMedicineHistory.length,
          periodHabitHistory: periodHabitHistory.length,
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0],
          selectedPeriod
        });

      } catch (error) {
        console.error('Error fetching analytics data:', error);
      }
    };

    fetchAnalyticsData();
  }, [user, selectedPeriod]);

  // Get real adherence data
  const getMedicationAdherence = () => {
    if (weeklyData) {
      return weeklyData.totals.averageAdherence;
    }
    // Fallback to calculation from medicineHistory
    // For now, return a calculated value from local medicineHistory
    const takenCount = medicineHistory.filter(m => m.status === 'taken').length;
    const totalCount = medicineHistory.length;
    return totalCount > 0 ? Math.round((takenCount / totalCount) * 100) : 0;
  };

  // Get real habit completion rate
  const getHabitCompletionRate = () => {
    if (weeklyData) {
      return weeklyData.totals.averageCompletion;
    }
    // Fallback to calculation from habitHistory
    const today = new Date();
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - 7);

    const weekHistory = habitHistory.filter(log =>
      log.date >= weekStart && log.completed
    );

    return Math.min(Math.round((weekHistory.length / Math.max(habits.length * 7, 1)) * 100), 100);
  };

  
  const getMedicationData = () => {
    let labels: string[] = [];
    let data: number[] = [];
    const today = new Date();

    // Use extended history if available, otherwise fallback to context history
    const historyToUse = extendedMedicineHistory.length > 0 ? extendedMedicineHistory : medicineHistory;

    console.log('📊 [DEBUG] Medicine History Data:', {
      extendedCount: extendedMedicineHistory.length,
      contextCount: medicineHistory.length,
      usingExtended: extendedMedicineHistory.length > 0,
      selectedPeriod,
      sampleData: historyToUse.slice(0, 3)
    });

    // Check if we have any data at all
    if (historyToUse.length === 0) {
      console.log('📊 [INFO] No medicine history data available');
      return null;
    }

    // Generate labels and data based on selected period
    switch (selectedPeriod) {
      case 'week':
        labels = [
          t('analytics.shortDays.monday'),
          t('analytics.shortDays.tuesday'),
          t('analytics.shortDays.wednesday'),
          t('analytics.shortDays.thursday'),
          t('analytics.shortDays.friday'),
          t('analytics.shortDays.saturday'),
          t('analytics.shortDays.sunday')
        ];
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay() + 1);

        data = labels.map((_, index) => {
          const currentDate = new Date(startOfWeek);
          currentDate.setDate(startOfWeek.getDate() + index);
          return countMedicinesForDate(historyToUse, currentDate);
        });
        break;

      case 'month':
        // Show weekly data for month
        const weeksInMonth = Math.ceil(today.getDate() / 7);
        for (let i = 1; i <= weeksInMonth; i++) {
          labels.push(t('analytics.weekLabel', { number: i }));
        }

        for (let i = 0; i < weeksInMonth; i++) {
          const weekStart = new Date(today.getFullYear(), today.getMonth(), i * 7 + 1);
          const weekEnd = new Date(weekStart);
          weekEnd.setDate(weekStart.getDate() + 6);

          const weekCount = historyToUse.filter(m => {
            const takenDate = getMedicineDate(m);
            if (!takenDate) return false;
            return takenDate >= weekStart && takenDate <= weekEnd && (m.status === 'taken' || m.completed === true);
          }).length;
          data.push(weekCount);
        }
        break;

      case 'year':
        // Show monthly data for year
        const months = [
          t('analytics.months.january'),
          t('analytics.months.february'),
          t('analytics.months.march'),
          t('analytics.months.april'),
          t('analytics.months.may'),
          t('analytics.months.june'),
          t('analytics.months.july'),
          t('analytics.months.august'),
          t('analytics.months.september'),
          t('analytics.months.october'),
          t('analytics.months.november'),
          t('analytics.months.december')
        ];
        labels = months;

        for (let month = 0; month < 12; month++) {
          const monthStart = new Date(today.getFullYear(), month, 1);
          const monthEnd = new Date(today.getFullYear(), month + 1, 0);

          const monthCount = historyToUse.filter(m => {
            const takenDate = getMedicineDate(m);
            if (!takenDate) return false;
            return takenDate >= monthStart && takenDate <= monthEnd && (m.status === 'taken' || m.completed === true);
          }).length;
          data.push(monthCount);
        }
        break;
    }

    console.log('📈 [DEBUG] Medication Data:', { labels, data, selectedPeriod });

    return {
      labels,
      datasets: [{
        data,
        color: (opacity = 1) => `rgba(244, 123, 159, ${opacity})`,
        strokeWidth: 2,
      }]
    };
  };

  // Helper function to get date from medicine record
  const getMedicineDate = (medicine: any) => {
    if (medicine.scheduledTime) {
      return medicine.scheduledTime instanceof Date ? medicine.scheduledTime : new Date(medicine.scheduledTime);
    } else if (medicine.timestamp) {
      return medicine.timestamp instanceof Date ? medicine.timestamp : new Date(medicine.timestamp);
    } else if (medicine.createdAt) {
      return medicine.createdAt instanceof Date ? medicine.createdAt : new Date(medicine.createdAt);
    } else if (medicine.date) {
      return medicine.date instanceof Date ? medicine.date : new Date(medicine.date);
    }
    return null;
  };

  // Helper function to count medicines for a specific date
  const countMedicinesForDate = (history: any[], date: Date) => {
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);

    return history.filter(m => {
      const takenDate = getMedicineDate(m);
      if (!takenDate || isNaN(takenDate.getTime())) {
        return false;
      }
      const isInRange = takenDate >= dayStart && takenDate <= dayEnd;
      const isTaken = m.status === 'taken' || m.completed === true;
      return isInRange && isTaken;
    }).length;
  };

  const getHabitData = () => {
    let labels: string[] = [];
    let data: number[] = [];
    const today = new Date();

    // Use extended history if available, otherwise fallback to context history
    const historyToUse = extendedHabitHistory.length > 0 ? extendedHabitHistory : habitHistory;

    console.log('📊 [DEBUG] Habit History Data:', {
      extendedCount: extendedHabitHistory.length,
      contextCount: habitHistory.length,
      usingExtended: extendedHabitHistory.length > 0,
      selectedPeriod,
      sampleData: historyToUse.slice(0, 3)
    });

    // Check if we have any data at all
    if (historyToUse.length === 0) {
      console.log('📊 [INFO] No habit history data available');
      return null;
    }

    // Generate labels and data based on selected period
    switch (selectedPeriod) {
      case 'week':
        labels = [
          t('analytics.shortDays.monday'),
          t('analytics.shortDays.tuesday'),
          t('analytics.shortDays.wednesday'),
          t('analytics.shortDays.thursday'),
          t('analytics.shortDays.friday'),
          t('analytics.shortDays.saturday'),
          t('analytics.shortDays.sunday')
        ];
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay() + 1);

        data = labels.map((_, index) => {
          const currentDate = new Date(startOfWeek);
          currentDate.setDate(startOfWeek.getDate() + index);
          return countHabitsForDate(historyToUse, currentDate);
        });
        break;

      case 'month':
        // Show weekly data for month
        const weeksInMonth = Math.ceil(today.getDate() / 7);
        for (let i = 1; i <= weeksInMonth; i++) {
          labels.push(t('analytics.weekLabel', { number: i }));
        }

        for (let i = 0; i < weeksInMonth; i++) {
          const weekStart = new Date(today.getFullYear(), today.getMonth(), i * 7 + 1);
          const weekEnd = new Date(weekStart);
          weekEnd.setDate(weekStart.getDate() + 6);

          const weekCount = historyToUse.filter(h => {
            const completedDate = getHabitDate(h);
            if (!completedDate) return false;
            return completedDate >= weekStart && completedDate <= weekEnd && (h.completed === true || h.status === 'completed');
          }).length;
          data.push(weekCount);
        }
        break;

      case 'year':
        // Show monthly data for year
        const months = [
          t('analytics.months.january'),
          t('analytics.months.february'),
          t('analytics.months.march'),
          t('analytics.months.april'),
          t('analytics.months.may'),
          t('analytics.months.june'),
          t('analytics.months.july'),
          t('analytics.months.august'),
          t('analytics.months.september'),
          t('analytics.months.october'),
          t('analytics.months.november'),
          t('analytics.months.december')
        ];
        labels = months;

        for (let month = 0; month < 12; month++) {
          const monthStart = new Date(today.getFullYear(), month, 1);
          const monthEnd = new Date(today.getFullYear(), month + 1, 0);

          const monthCount = historyToUse.filter(h => {
            const completedDate = getHabitDate(h);
            if (!completedDate) return false;
            return completedDate >= monthStart && completedDate <= monthEnd && (h.completed === true || h.status === 'completed');
          }).length;
          data.push(monthCount);
        }
        break;
    }

    console.log('📈 [DEBUG] Habit Data:', { labels, data, selectedPeriod });

    return {
      labels,
      datasets: [{
        data,
        color: (opacity = 1) => `rgba(78, 205, 196, ${opacity})`,
        strokeWidth: 2,
      }]
    };
  };

  // Helper function to get date from habit record
  const getHabitDate = (habit: any) => {
    if (habit.date) {
      return habit.date instanceof Date ? habit.date : new Date(habit.date);
    } else if (habit.timestamp) {
      return habit.timestamp instanceof Date ? habit.timestamp : new Date(habit.timestamp);
    } else if (habit.createdAt) {
      return habit.createdAt instanceof Date ? habit.createdAt : new Date(habit.createdAt);
    } else if (habit.completedAt) {
      return habit.completedAt instanceof Date ? habit.completedAt : new Date(habit.completedAt);
    }
    return null;
  };

  // Helper function to count habits for a specific date
  const countHabitsForDate = (history: any[], date: Date) => {
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);

    return history.filter(h => {
      const completedDate = getHabitDate(h);
      if (!completedDate || isNaN(completedDate.getTime())) {
        return false;
      }
      const isInRange = completedDate >= dayStart && completedDate <= dayEnd;
      const isCompleted = h.completed === true || h.status === 'completed';
      return isInRange && isCompleted;
    }).length;
  };

  const getMedicationTypeData = () => {
    const colors = ['#F47B9F', '#4ECDC4', '#FFD93D', '#A8E6CF', '#FF8B94'];

    // Count medicine types from real data
    const typeCounts: { [key: string]: number } = {};

    medicines.forEach(medicine => {
      const type = medicine.medicineType || 'Other';
      typeCounts[type] = (typeCounts[type] || 0) + 1;
    });

    // Convert to pie chart format
    return Object.entries(typeCounts).map(([type, count], index) => ({
      name: type,
      population: count,
      color: colors[index % colors.length],
      legendFontColor: '#666',
      legendFontSize: 12,
    }));
  };

  const getHabitTypeData = () => {
    const colors = ['#4ECDC4', '#F47B9F', '#FFD93D', '#A8E6CF', '#FF8B94'];

    // Count habit types from real data
    const typeCounts: { [key: string]: number } = {};

    habits.forEach(habit => {
      const type = habit.habitType || 'Custom';
      typeCounts[type] = (typeCounts[type] || 0) + 1;
    });

    // Convert to pie chart format
    return Object.entries(typeCounts).map(([type, count], index) => ({
      name: type.charAt(0).toUpperCase() + type.slice(1),
      population: count,
      color: colors[index % colors.length],
      legendFontColor: '#666',
      legendFontSize: 12,
    }));
  };

  const chartConfig = {
    backgroundColor: colors.card,
    backgroundGradientFrom: colors.card,
    backgroundGradientTo: colors.card,
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(111, 111, 111, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(111, 111, 111, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '6',
      strokeWidth: '2',
      stroke: colors.primary,
    },
    propsForBackgroundLines: {
      strokeDasharray: '',
      stroke: colors.border,
      strokeWidth: 1,
    },
  };

  const pieChartConfig = {
    ...chartConfig,
    color: (opacity = 1, index = 0) => {
      const colors = ['#F47B9F', '#4ECDC4', '#FFD93D', '#A8E6CF', '#FF8B94'];
      return colors[index % colors.length] + Math.round(opacity * 255).toString(16).slice(-2);
    },
  };

  const renderOverviewTab = () => (
    <Animated.View entering={FadeInDown.delay(200)}>
      {/* Summary Cards */}
      <View style={styles.statsGrid}>
        <View style={[styles.statCard, { backgroundColor: colors.card }]}>
          <View style={[styles.statIconContainer, { backgroundColor: '#F47B9F20' }]}>
            <Ionicons name="medical-outline" size={24} color="#F47B9F" />
          </View>
          <Text style={[styles.statValue, { color: colors.text }]}>
            {medicines.length}
          </Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
            {t('analytics.activeMedications')}
          </Text>
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${getMedicationAdherence()}%`, backgroundColor: '#F47B9F' }
                ]}
              />
            </View>
            {/* <Text style={[styles.progressText, { color: colors.textSecondary }]}>
              {getMedicationAdherence()}% {t('analytics.adherence')}
            </Text> */}
          </View>
        </View>

        <View style={[styles.statCard, { backgroundColor: colors.card }]}>
          <View style={[styles.statIconContainer, { backgroundColor: '#4ECDC420' }]}>
            <Ionicons name="repeat-outline" size={24} color="#4ECDC4" />
          </View>
          <Text style={[styles.statValue, { color: colors.text }]}>
            {habits.length}
          </Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
            {t('analytics.activeHabits')}
          </Text>
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${getHabitCompletionRate()}%`, backgroundColor: '#4ECDC4' }
                ]}
              />
            </View>
            {/* <Text style={[styles.progressText, { color: colors.textSecondary }]}>
              {getHabitCompletionRate()}% {t('analytics.completion')}
            </Text> */}
          </View>
        </View>
      </View>

      {/* Combined Progress Chart */}
      <View style={[styles.section, { backgroundColor: colors.card }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          {t('analytics.weeklyProgressOverview')}
        </Text>
        {(() => {
          const medicationData = getMedicationData();
          const habitData = getHabitData();

          if (!medicationData && !habitData) {
            return (
              <View style={[styles.noDataContainer, { alignItems: 'center', paddingVertical: Spacing.xl }]}>
                <Ionicons name="bar-chart-outline" size={48} color={colors.textSecondary} />
                <Text style={[styles.noDataText, { color: colors.textSecondary, marginTop: Spacing.md }]}>
                  {t('analytics.noDataAvailable', 'No data available for the selected period')}
                </Text>
              </View>
            );
          }

          // Use the labels from one of the data sources (they should be consistent)
          const chartLabels = medicationData?.labels || habitData?.labels || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

          const combinedData = {
            labels: chartLabels,
            datasets: [
              ...(medicationData ? [{
                data: medicationData.datasets[0].data,
                color: (opacity = 1) => `rgba(244, 123, 159, ${opacity})`,
                strokeWidth: 3,
              }] : []),
              ...(habitData ? [{
                data: habitData.datasets[0].data,
                color: (opacity = 1) => `rgba(78, 205, 196, ${opacity})`,
                strokeWidth: 3,
              }] : [])
            ].filter(Boolean),
            legend: [
              ...(medicationData ? [t('analytics.medicines')] : []),
              ...(habitData ? [t('analytics.habits')] : [])
            ]
          };

          return (
            <LineChart
              data={combinedData}
              width={screenWidth - Spacing.lg * 2}
              height={240}
              chartConfig={chartConfig}
              bezier
              style={styles.chart}
              withInnerLines={false}
              withOuterLines={true}
            />
          );
        })()}
      </View>

      {/* Best Performers */}
      <View style={[styles.section, { backgroundColor: colors.card }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          {t('analytics.bestPerformers')}
        </Text>
        <View style={styles.performersList}>
          {/* Top Habit Performer */}
          {habits.length > 0 && (() => {
            const topHabit = habits.reduce((prev, current) =>
              (current.streak > prev.streak) ? current : prev, habits[0]);
            return (
              <View style={styles.performerItem}>
                <View style={[styles.performerIcon, { backgroundColor: '#4ECDC420' }]}>
                  <Text style={styles.performerEmoji}>{topHabit.icon || "🏆"}</Text>
                </View>
                <View style={styles.performerInfo}>
                  <Text style={[styles.performerName, { color: colors.text }]}>
                    {topHabit.habitName}
                  </Text>
                  <Text style={[styles.performerStat, { color: colors.textSecondary }]}>
                    {topHabit.streak} {t('analytics.dayStreak')}
                  </Text>
                </View>
                <Text style={[styles.performerValue, { color: colors.success }]}>
                  {topHabit.streak > 0 ? `${Math.min(Math.round((topHabit.streak / Math.max(topHabit.bestStreak || topHabit.streak, 1)) * 100), 100)}%` : '0%'}
                </Text>
              </View>
            );
          })()}

          {/* Top Medicine Performer */}
          {medicines.length > 0 && (() => {
            // Calculate adherence for each medicine
            const medicineWithAdherence = medicines.map(med => {
              const medHistory = medicineHistory.filter(h => h.medicineId === med.reminderId);
              const takenCount = medHistory.filter(h => h.status === 'taken').length;
              const adherence = medHistory.length > 0 ? Math.round((takenCount / medHistory.length) * 100) : 0;
              return { ...med, adherence };
            });

            const topMedicine = medicineWithAdherence.reduce((prev, current) =>
              (current.adherence > prev.adherence) ? current : prev, medicineWithAdherence[0]);

            return (
              <View style={styles.performerItem}>
                <View style={[styles.performerIcon, { backgroundColor: '#F47B9F20' }]}>
                  <Ionicons name="medical-outline" size={20} color="#F47B9F" />
                </View>
                <View style={styles.performerInfo}>
                  <Text style={[styles.performerName, { color: colors.text }]}>
                    {topMedicine.medicineName}
                  </Text>
                  <Text style={[styles.performerStat, { color: colors.textSecondary }]}>
                    {topMedicine.adherence}% {t('analytics.adherence')}
                  </Text>
                </View>
                <Text style={[styles.performerValue, { color: colors.success }]}>
                  {topMedicine.adherence}%
                </Text>
              </View>
            );
          })()}
        </View>
      </View>
    </Animated.View>
  );

  const renderMedicinesTab = () => (
    <Animated.View entering={FadeInDown.delay(200)}>
      {/* Medication Adherence Chart */}
      <View style={[styles.section, { backgroundColor: colors.card }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          {t('analytics.medicationAdherence')}
        </Text>
        {(() => {
          const medicationData = getMedicationData();
          if (!medicationData) {
            return (
              <View style={[styles.noDataContainer, { alignItems: 'center', paddingVertical: Spacing.xl }]}>
                <Ionicons name="medical-outline" size={48} color={colors.textSecondary} />
                <Text style={[styles.noDataText, { color: colors.textSecondary, marginTop: Spacing.md }]}>
                  {t('analytics.noMedicineData', 'No medication data available for the selected period')}
                </Text>
              </View>
            );
          }
          return (
            <LineChart
              data={medicationData}
              width={screenWidth - Spacing.lg * 2}
              height={220}
              chartConfig={chartConfig}
              style={styles.chart}
              bezier
              yAxisLabel=""
              yAxisSuffix=""
            />
          );
        })()}
        <Text style={[styles.chartLabel, { color: colors.textSecondary }]}>
          {t('analytics.medicationsPerDay')}
        </Text>
      </View>

      {/* Medication Types */}
      <View style={[styles.section, { backgroundColor: colors.card }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          {t('analytics.medicationTypes')}
        </Text>
        <PieChart
          data={getMedicationTypeData()}
          width={screenWidth - Spacing.lg * 2}
          height={220}
          chartConfig={pieChartConfig}
          accessor="population"
          backgroundColor="transparent"
          paddingLeft="15"
          center={[10, 10]}
          absolute
          style={styles.chart}
        />
      </View>

      {/* Statistics */}
      {/* <View style={[styles.section, { backgroundColor: colors.card }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          {t('analytics.medicationStatistics')}
        </Text>
        <View style={styles.statisticsGrid}>
          <View style={styles.statisticItem}>
            <Text style={[styles.statisticValue, { color: colors.primary }]}>
              {getMedicationAdherence()}%
            </Text>
            <Text style={[styles.statisticLabel, { color: colors.textSecondary }]}>
              {t('analytics.weeklyAdherence')}
            </Text>
          </View>
          <View style={styles.statisticItem}>
            <Text style={[styles.statisticValue, { color: colors.primary }]}>
              {(medicines.length > 0 ?
                medicines.reduce((sum, med) => sum + (med.frequency?.times?.length || 1), 0) / medicines.length
                : 0).toFixed(1)
              }
            </Text>
            <Text style={[styles.statisticLabel, { color: colors.textSecondary }]}>
              {t('analytics.avgDailyDoses')}
            </Text>
          </View>
          <View style={styles.statisticItem}>
            <Text style={[styles.statisticValue, { color: colors.primary }]}>
              {medicineHistory.filter(m => m.status === 'taken').length}
            </Text>
            <Text style={[styles.statisticLabel, { color: colors.textSecondary }]}>
              {t('analytics.totalTaken')}
            </Text>
          </View>
          <View style={styles.statisticItem}>
            <Text style={[styles.statisticValue, { color: colors.primary }]}>
              {medicineHistory.filter(m => m.status === 'missed').length}
            </Text>
            <Text style={[styles.statisticLabel, { color: colors.textSecondary }]}>
              {t('analytics.missedDoses')}
            </Text>
          </View>
        </View>
      </View> */}
    </Animated.View>
  );

  const renderHabitsTab = () => (
    <Animated.View entering={FadeInDown.delay(200)}>
      {/* Habit Completion Chart */}
      <View style={[styles.section, { backgroundColor: colors.card }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          {t('analytics.habitCompletion')}
        </Text>
        {(() => {
          const habitData = getHabitData();
          if (!habitData) {
            return (
              <View style={[styles.noDataContainer, { alignItems: 'center', paddingVertical: Spacing.xl }]}>
                <Ionicons name="repeat-outline" size={48} color={colors.textSecondary} />
                <Text style={[styles.noDataText, { color: colors.textSecondary, marginTop: Spacing.md }]}>
                  {t('analytics.noHabitData', 'No habit data available for the selected period')}
                </Text>
              </View>
            );
          }
          return (
            <LineChart
              data={habitData}
              width={screenWidth - Spacing.lg * 2}
              height={220}
              chartConfig={chartConfig}
              bezier
              style={styles.chart}
            />
          );
        })()}
        <Text style={[styles.chartLabel, { color: colors.textSecondary }]}>
          {t('analytics.habitsPerDay')}
        </Text>
      </View>

      {/* Habit Distribution */}
      <View style={[styles.section, { backgroundColor: colors.card }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          {t('analytics.habitDistribution')}
        </Text>
        <PieChart
          data={getHabitTypeData()}
          width={screenWidth - Spacing.lg * 2}
          height={220}
          chartConfig={pieChartConfig}
          accessor="population"
          backgroundColor="transparent"
          paddingLeft="15"
          center={[10, 10]}
          absolute
          style={styles.chart}
        />
      </View>

      {/* Habit Statistics */}
      {/* <View style={[styles.section, { backgroundColor: colors.card }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          {t('analytics.habitStatistics')}
        </Text>
        <View style={styles.statisticsGrid}>
          <View style={styles.statisticItem}>
            <Text style={[styles.statisticValue, { color: colors.primary }]}>
              {getHabitCompletionRate()}%
            </Text>
            <Text style={[styles.statisticLabel, { color: colors.textSecondary }]}>
              {t('analytics.weeklyCompletion')}
            </Text>
          </View>
          <View style={styles.statisticItem}>
            <Text style={[styles.statisticValue, { color: colors.primary }]}>
              {habits.length > 0 ? Math.max(...habits.map(h => h.streak || 0)) : 0}
            </Text>
            <Text style={[styles.statisticLabel, { color: colors.textSecondary }]}>
              {t('analytics.currentStreak')}
            </Text>
          </View>
          <View style={styles.statisticItem}>
            <Text style={[styles.statisticValue, { color: colors.primary }]}>
              {habits.length > 0 ? Math.max(...habits.map(h => h.bestStreak || 0)) : 0}
            </Text>
            <Text style={[styles.statisticLabel, { color: colors.textSecondary }]}>
              {t('analytics.bestStreak')}
            </Text>
          </View>
          <View style={styles.statisticItem}>
            <Text style={[styles.statisticValue, { color: colors.primary }]}>
              {habitHistory.filter(h => h.completed).length}
            </Text>
            <Text style={[styles.statisticLabel, { color: colors.textSecondary }]}>
              {t('analytics.totalCompletions')}
            </Text>
          </View>
        </View>
      </View> */}
    </Animated.View>
  );

  const renderHeader = () => (
    <Animated.View style={[
      headerAnimatedStyle,
      styles.headerContainer
    ]}>
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
          <Text style={[styles.greeting, { color: colors.textSecondary }]}>
            {t('analytics.title', 'Health Analytics')}
          </Text>
          <Text style={[styles.title, { color: colors.text }]}>
            {t('analytics.trackProgress', 'Track Your Progress')}
          </Text>
        </View>

        {/* Period Selector */}
        <View style={styles.periodSelector}>
          {['week', 'month', 'year'].map((period) => (
            <TouchableOpacity
              key={period}
              style={[
                styles.periodOption,
                {
                  backgroundColor: selectedPeriod === period ? colors.primary : colors.card,
                  borderColor: selectedPeriod === period ? colors.primary : colors.border,
                }
              ]}
              onPress={() => setSelectedPeriod(period as any)}
            >
              <Text style={[
                styles.periodText,
                {
                  color: selectedPeriod === period ? '#FFFFFF' : colors.text,
                  fontWeight: selectedPeriod === period ? '600' : '400',
                }
              ]}>
                {t(`analytics.${period}`)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </LinearGradient>
    </Animated.View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {renderHeader()}

        {/* Tab Selector */}
        <View style={[styles.tabSelector, { backgroundColor: colors.card }]}>
          {[
            { key: 'overview', label: t('analytics.overview'), icon: 'analytics-outline' },
            { key: 'medicines', label: t('analytics.medicines'), icon: 'medical-outline' },
            { key: 'habits', label: t('analytics.habits'), icon: 'repeat-outline' },
          ].map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[
                styles.tabOption,
                {
                  borderBottomColor: selectedTab === tab.key ? colors.primary : 'transparent',
                }
              ]}
              onPress={() => setSelectedTab(tab.key as any)}
            >
              <Ionicons
                name={tab.icon as any}
                size={20}
                color={selectedTab === tab.key ? colors.primary : colors.textSecondary}
              />
              <Text style={[
                styles.tabText,
                {
                  color: selectedTab === tab.key ? colors.primary : colors.textSecondary,
                  fontWeight: selectedTab === tab.key ? '600' : '400',
                }
              ]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Tab Content */}
        <Animated.View style={[styles.tabContent, cardsAnimatedStyle]}>
          {selectedTab === 'overview' && renderOverviewTab()}
          {selectedTab === 'medicines' && renderMedicinesTab()}
          {selectedTab === 'habits' && renderHabitsTab()}
        </Animated.View>

        <View style={styles.footerSpace} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  headerGradient: {
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xl,
    paddingHorizontal: Spacing.lg,
    minHeight: 200,
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
  },
  headerContainer: {
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 1.5,
      },
      android: {
        elevation: 6,
        backgroundColor: "#ffffff",
      },
    }),
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
    marginBottom: Spacing.lg,
  },
  greeting: {
    ...Typography.caption,
    marginBottom: Spacing.xs,
  },
  title: {
    ...Typography.h2,
    fontWeight: '700',
  },
  periodSelector: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: Spacing.lg,
  },
  periodOption: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
  },
  periodText: {
    ...Typography.caption,
  },
  tabSelector: {
    flexDirection: 'row',
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.sm,
  },
  tabOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 2,
  },
  tabText: {
    ...Typography.caption,
    marginLeft: Spacing.xs,
  },
  tabContent: {
    marginTop: Spacing.lg,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  statCard: {
    flex: 1,
    marginHorizontal: Spacing.sm,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
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
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  statValue: {
    ...Typography.h2,
    fontWeight: '700',
    marginBottom: Spacing.xs,
  },
  statLabel: {
    ...Typography.caption,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  progressContainer: {
    width: '100%',
    alignItems: 'center',
  },
  progressBar: {
    width: '100%',
    height: 4,
    backgroundColor: '#E5E5E7',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: Spacing.xs,
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressText: {
    ...Typography.small,
  },
  section: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
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
  sectionTitle: {
    ...Typography.h3,
    fontWeight: '600',
    marginBottom: Spacing.md,
  },
  chart: {
    marginLeft: -Spacing.lg,
    paddingRight: 42,
    marginRight: 24,
    borderRadius: BorderRadius.lg,
  },
  chartLabel: {
    ...Typography.caption,
    textAlign: 'center',
    marginTop: Spacing.sm,
    paddingRight: 42,
    marginRight: 24,
  },
  performersList: {
    marginTop: Spacing.md,
  },
  performerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  performerIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  performerInfo: {
    flex: 1,
  },
  performerName: {
    ...Typography.body,
    fontWeight: '600',
  },
  performerStat: {
    ...Typography.caption,
    marginTop: 2,
  },
  performerValue: {
    ...Typography.body,
    fontWeight: '700',
  },
  statisticsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statisticItem: {
    width: '48%',
    alignItems: 'center',
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: 'rgba(0,0,0,0.02)',
  },
  statisticValue: {
    ...Typography.h3,
    fontWeight: '700',
    marginBottom: Spacing.xs,
  },
  statisticLabel: {
    ...Typography.small,
    textAlign: 'center',
  },
  footerSpace: {
    height: 64,
  },
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: Spacing.md,
    gap: Spacing.lg,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: 12,
    fontWeight: '500',
  },
  performerEmoji: {
    fontSize: 20,
  },
  noDataContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xl,
  },
  noDataText: {
    ...Typography.body,
    textAlign: 'center',
    marginTop: Spacing.md,
  },
});