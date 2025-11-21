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
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';
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
import { analyticsService, medicineHistoryService, habitHistoryService } from '@/services';

const { width: screenWidth } = Dimensions.get('window');

export default function AnalyticsScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { user } = useAuth();
  const { medicines, medicineHistory } = useMedicine();
  const { habits, habitHistory } = useHabit();

  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year'>('week');
  const [selectedTab, setSelectedTab] = useState<'overview' | 'medicines' | 'habits'>('overview');
  const [weeklyData, setWeeklyData] = useState<any>(null);
  const [monthlyData, setMonthlyData] = useState<any>(null);
  const [healthScore, setHealthScore] = useState<any>(null);
  const [loading, setLoading] = useState(true);

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
  }, []);

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
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        const [weekly, monthly, score] = await Promise.all([
          analyticsService.getWeeklyAnalytics(user.userId),
          analyticsService.getMonthlyAnalytics(user.userId),
          analyticsService.getHealthScore(user.userId)
        ]);

        setWeeklyData(weekly);
        setMonthlyData(monthly);
        setHealthScore(score);
      } catch (error) {
        console.error('Error fetching analytics data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalyticsData();
  }, [user]);

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

  
  const getWeeklyMedicationData = () => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const data = days.map(() => Math.floor(Math.random() * 8) + 2);

    return {
      labels: days,
      datasets: [{
        data: data,
        color: (opacity = 1) => `rgba(244, 123, 159, ${opacity})`,
        strokeWidth: 2,
      }]
    };
  };

  const getWeeklyHabitData = () => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const data = days.map(() => Math.floor(Math.random() * 6) + 1);

    return {
      labels: days,
      datasets: [{
        data: data,
        color: (opacity = 1) => `rgba(78, 205, 196, ${opacity})`,
        strokeWidth: 2,
      }]
    };
  };

  const getMedicationTypeData = () => {
    const types = ['Tablet', 'Capsule', 'Liquid', 'Other'];
    const colors = ['#F47B9F', '#4ECDC4', '#FFD93D', '#A8E6CF'];

    return types.map((type, index) => ({
      name: type,
      population: Math.floor(Math.random() * 30) + 10,
      color: colors[index % colors.length],
      legendFontColor: '#666',
      legendFontSize: 12,
    }));
  };

  const getHabitTypeData = () => {
    const types = ['Water', 'Exercise', 'Sleep', 'Meditation'];
    const colors = ['#4ECDC4', '#F47B9F', '#FFD93D', '#A8E6CF'];

    return types.map((type, index) => ({
      name: type,
      population: Math.floor(Math.random() * 40) + 10,
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
            Active Medications
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
            <Text style={[styles.progressText, { color: colors.textSecondary }]}>
              {getMedicationAdherence()}% adherence
            </Text>
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
            Active Habits
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
            <Text style={[styles.progressText, { color: colors.textSecondary }]}>
              {getHabitCompletionRate()}% completion
            </Text>
          </View>
        </View>
      </View>

      {/* Combined Progress Chart */}
      <View style={[styles.section, { backgroundColor: colors.card }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Weekly Progress
        </Text>
        <LineChart
          data={getWeeklyMedicationData()}
          width={screenWidth - Spacing.lg * 2}
          height={220}
          chartConfig={chartConfig}
          bezier
          style={styles.chart}
        />
        <Text style={[styles.chartLabel, { color: colors.textSecondary }]}>
          Medications taken this week
        </Text>
      </View>

      {/* Best Performers */}
      <View style={[styles.section, { backgroundColor: colors.card }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Best Performers
        </Text>
        <View style={styles.performersList}>
          <View style={styles.performerItem}>
            <View style={[styles.performerIcon, { backgroundColor: '#A8E6CF20' }]}>
              <Ionicons name="trophy" size={20} color="#A8E6CF" />
            </View>
            <View style={styles.performerInfo}>
              <Text style={[styles.performerName, { color: colors.text }]}>
                Water Intake
              </Text>
              <Text style={[styles.performerStat, { color: colors.textSecondary }]}>
                7 day streak 🔥
              </Text>
            </View>
            <Text style={[styles.performerValue, { color: colors.success }]}>
              100%
            </Text>
          </View>

          <View style={styles.performerItem}>
            <View style={[styles.performerIcon, { backgroundColor: '#FFD93D20' }]}>
              <Ionicons name="medical-outline" size={20} color="#FFD93D" />
            </View>
            <View style={styles.performerInfo}>
              <Text style={[styles.performerName, { color: colors.text }]}>
                Vitamin D
              </Text>
              <Text style={[styles.performerStat, { color: colors.textSecondary }]}>
                Never missed
              </Text>
            </View>
            <Text style={[styles.performerValue, { color: colors.success }]}>
              100%
            </Text>
          </View>
        </View>
      </View>
    </Animated.View>
  );

  const renderMedicinesTab = () => (
    <Animated.View entering={FadeInDown.delay(200)}>
      {/* Medication Adherence Chart */}
      <View style={[styles.section, { backgroundColor: colors.card }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Medication Adherence
        </Text>
        <BarChart
          data={getWeeklyMedicationData()}
          width={screenWidth - Spacing.lg * 2}
          height={220}
          chartConfig={chartConfig}
          style={styles.chart}
          yAxisLabel=""
          yAxisSuffix=""
        />
        <Text style={[styles.chartLabel, { color: colors.textSecondary }]}>
          Medications taken per day
        </Text>
      </View>

      {/* Medication Types */}
      <View style={[styles.section, { backgroundColor: colors.card }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Medication Types
        </Text>
        <PieChart
          data={getMedicationTypeData()}
          width={screenWidth - Spacing.lg * 2}
          height={220}
          chartConfig={pieChartConfig}
          accessor="data"
          backgroundColor="transparent"
          paddingLeft="15"
          style={styles.chart}
        />
      </View>

      {/* Statistics */}
      <View style={[styles.section, { backgroundColor: colors.card }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Medication Statistics
        </Text>
        <View style={styles.statisticsGrid}>
          <View style={styles.statisticItem}>
            <Text style={[styles.statisticValue, { color: colors.primary }]}>
              85%
            </Text>
            <Text style={[styles.statisticLabel, { color: colors.textSecondary }]}>
              Monthly Adherence
            </Text>
          </View>
          <View style={styles.statisticItem}>
            <Text style={[styles.statisticValue, { color: colors.primary }]}>
              4.2
            </Text>
            <Text style={[styles.statisticLabel, { color: colors.textSecondary }]}>
              Avg Daily Doses
            </Text>
          </View>
          <View style={styles.statisticItem}>
            <Text style={[styles.statisticValue, { color: colors.primary }]}>
              12
            </Text>
            <Text style={[styles.statisticLabel, { color: colors.textSecondary }]}>
              Days on Time
            </Text>
          </View>
          <View style={styles.statisticItem}>
            <Text style={[styles.statisticValue, { color: colors.primary }]}>
              2
            </Text>
            <Text style={[styles.statisticLabel, { color: colors.textSecondary }]}>
              Missed Doses
            </Text>
          </View>
        </View>
      </View>
    </Animated.View>
  );

  const renderHabitsTab = () => (
    <Animated.View entering={FadeInDown.delay(200)}>
      {/* Habit Completion Chart */}
      <View style={[styles.section, { backgroundColor: colors.card }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Habit Completion
        </Text>
        <LineChart
          data={getWeeklyHabitData()}
          width={screenWidth - Spacing.lg * 2}
          height={220}
          chartConfig={chartConfig}
          bezier
          style={styles.chart}
        />
        <Text style={[styles.chartLabel, { color: colors.textSecondary }]}>
          Habits completed per day
        </Text>
      </View>

      {/* Habit Distribution */}
      <View style={[styles.section, { backgroundColor: colors.card }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Habit Distribution
        </Text>
        <PieChart
          data={getHabitTypeData()}
          width={screenWidth - Spacing.lg * 2}
          height={220}
          chartConfig={pieChartConfig}
          accessor="data"
          backgroundColor="transparent"
          paddingLeft="15"
          style={styles.chart}
        />
      </View>

      {/* Habit Statistics */}
      <View style={[styles.section, { backgroundColor: colors.card }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Habit Statistics
        </Text>
        <View style={styles.statisticsGrid}>
          <View style={styles.statisticItem}>
            <Text style={[styles.statisticValue, { color: colors.secondary }]}>
              92%
            </Text>
            <Text style={[styles.statisticLabel, { color: colors.textSecondary }]}>
              Monthly Completion
            </Text>
          </View>
          <View style={styles.statisticItem}>
            <Text style={[styles.statisticValue, { color: colors.secondary }]}>
              7
            </Text>
            <Text style={[styles.statisticLabel, { color: colors.textSecondary }]}>
              Current Streak
            </Text>
          </View>
          <View style={styles.statisticItem}>
            <Text style={[styles.statisticValue, { color: colors.secondary }]}>
              14
            </Text>
            <Text style={[styles.statisticLabel, { color: colors.textSecondary }]}>
              Best Streak
            </Text>
          </View>
          <View style={styles.statisticItem}>
            <Text style={[styles.statisticValue, { color: colors.secondary }]}>
              156
            </Text>
            <Text style={[styles.statisticLabel, { color: colors.textSecondary }]}>
              Total Completions
            </Text>
          </View>
        </View>
      </View>
    </Animated.View>
  );

  const renderHeader = () => (
    <Animated.View style={[headerAnimatedStyle]}>
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
            Health Analytics
          </Text>
          <Text style={[styles.title, { color: colors.text }]}>
            Track Your Progress
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
                {period.charAt(0).toUpperCase() + period.slice(1)}
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
            { key: 'overview', label: 'Overview', icon: 'analytics-outline' },
            { key: 'medicines', label: 'Medicines', icon: 'medical-outline' },
            { key: 'habits', label: 'Habits', icon: 'repeat-outline' },
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
    marginVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  chartLabel: {
    ...Typography.caption,
    textAlign: 'center',
    marginTop: Spacing.sm,
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
});