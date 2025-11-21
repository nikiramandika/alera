import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  Platform,
  ScrollView,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
  FadeInDown,
  interpolate,
  withTiming,
} from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, Spacing, BorderRadius, Typography } from '@/constants/theme';
import { useHabit } from '@/contexts/HabitContext';

export default function HabitsScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { habits, loading, refreshHabits, markHabitCompleted, markHabitIncomplete, getTodayHabits, getHabitProgress } = useHabit();

  const [selectedHabit, setSelectedHabit] = useState<any>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [todayProgress, setTodayProgress] = useState<{ [key: string]: number }>({});

  // Animation values
  const headerScale = useSharedValue(0.9);
  const cardTranslateY = useSharedValue(50);
  const progressAnimatedValues = habits.reduce((acc, habit) => {
    acc[habit.habitId] = useSharedValue(0);
    return acc;
  }, {} as { [key: string]: any });

  useEffect(() => {
    headerScale.value = withDelay(200, withSpring(1, {
      damping: 15,
      stiffness: 100,
    }));

    cardTranslateY.value = withDelay(400, withSpring(0, {
      damping: 15,
      stiffness: 100,
    }));

    // Initialize progress values
    habits.forEach(habit => {
      const progress = getTodayProgress(habit.habitId);
      if (progressAnimatedValues[habit.habitId]) {
        progressAnimatedValues[habit.habitId].value = withTiming(progress, { duration: 1000 });
      }
    });
  }, [habits]);

  // Header animation
  const headerAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: headerScale.value }]
  }));

  // Cards animation
  const cardAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: cardTranslateY.value }]
  }));

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshHabits();
    setRefreshing(false);
  };

  const getTodayProgress = (habitId: string): number => {
    const habit = habits.find(h => h.habitId === habitId);
    if (!habit) return 0;

    const today = new Date();
    const progress = getHabitProgress(habitId, today);
    return Math.min((progress / habit.target.value) * 100, 100);
  };

  const handleHabitComplete = async (habitId: string, targetValue: number) => {
    const result = await markHabitCompleted(habitId, targetValue);
    if (result.success) {
      // Animate progress
      if (progressAnimatedValues[habitId]) {
        progressAnimatedValues[habitId].value = withTiming(100, { duration: 500 });
      }
      setTodayProgress(prev => ({ ...prev, [habitId]: 100 }));
      await refreshHabits();
    } else {
      Alert.alert('Error', result.error || 'Failed to mark habit as complete');
    }
  };

  const handleHabitIncomplete = async (habitId: string) => {
    const today = new Date();
    const result = await markHabitIncomplete(habitId, today);
    if (result.success) {
      // Animate progress
      if (progressAnimatedValues[habitId]) {
        progressAnimatedValues[habitId].value = withTiming(0, { duration: 500 });
      }
      setTodayProgress(prev => ({ ...prev, [habitId]: 0 }));
      await refreshHabits();
    } else {
      Alert.alert('Error', result.error || 'Failed to mark habit as incomplete');
    }
  };

  const getCompletionPercentage = () => {
    const todayHabits = getTodayHabits();
    if (todayHabits.length === 0) return 100;

    const completedCount = todayHabits.filter(habit => {
      const progress = getTodayProgress(habit.habitId);
      return progress >= 100;
    }).length;

    return Math.round((completedCount / todayHabits.length) * 100);
  };

  const getStreakEmoji = (streak: number) => {
    if (streak >= 30) return '🔥🔥🔥';
    if (streak >= 14) return '🔥🔥';
    if (streak >= 7) return '🔥';
    if (streak >= 3) return '✨';
    return '💪';
  };

  const renderHabitCard = ({ item, index }: { item: any; index: number }) => {
    const progress = getTodayProgress(item.habitId);
    const isCompleted = progress >= 100;
    const progressValue = progressAnimatedValues[item.habitId];

    const progressAnimatedStyle = useAnimatedStyle(() => {
      if (!progressValue) return { width: '0%' };
      return {
        width: ${progressValue.value}%,
      };
    });

    const cardAnimatedStyle = useAnimatedStyle(() => {
      const scale = interpolate(
        progressValue.value,
        [0, 100],
        [1, 1.02]
      );
      return {
        transform: [{ scale }],
      };
    });

    return (
      <Animated.View
        entering={FadeInDown.delay(index * 100)}
        style={[
          styles.habitCard,
          {
            backgroundColor: colors.card,
            borderColor: isCompleted ? colors.success : colors.border,
            borderWidth: 2,
            shadowColor: colors.shadow,
          },
          cardAnimatedStyle
        ]}
      >
        <TouchableOpacity
          style={styles.cardContent}
          onPress={() => {
            setSelectedHabit(item);
            setShowDetailModal(true);
          }}
          activeOpacity={0.7}
        >
          <View style={styles.habitHeader}>
            <View style={styles.habitInfo}>
              <View style={[styles.iconContainer, { backgroundColor: item.color + '20' }]}>
                <Text style={styles.habitIcon}>{item.icon}</Text>
              </View>
              <View style={styles.habitDetails}>
                <Text style={[styles.habitName, { color: colors.text }]}>
                  {item.habitName}
                </Text>
                <Text style={[styles.habitDescription, { color: colors.textSecondary }]}>
                  {item.description}
                </Text>
              </View>
            </View>
            <View style={styles.streakContainer}>
              <Text style={styles.streakEmoji}>{getStreakEmoji(item.streak)}</Text>
              <Text style={[styles.streakText, { color: colors.textSecondary }]}>
                {item.streak} days
              </Text>
            </View>
          </View>

          <View style={styles.progressSection}>
            <View style={styles.progressInfo}>
              <Text style={[styles.progressText, { color: colors.text }]}>
                {item.target.value} {item.target.unit} / {item.target.frequency}
              </Text>
              <Text style={[styles.progressPercentage, { color: colors.primary }]}>
                {Math.round(progress)}%
              </Text>
            </View>
            <View style={styles.progressBar}>
              <Animated.View
                style={[
                  styles.progressFill,
                  {
                    backgroundColor: isCompleted ? colors.success : item.color,
                  },
                  progressAnimatedStyle
                ]}
              />
            </View>
          </View>

          <View style={styles.actionButtons}>
            {!isCompleted ? (
              <TouchableOpacity
                style={[
                  styles.completeButton,
                  { backgroundColor: colors.primary }
                ]}
                onPress={() => handleHabitComplete(item.habitId, item.target.value)}
              >
                <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                <Text style={styles.completeButtonText}>Complete</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[
                 styles.undoButton,
                  { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }
                ]}
                onPress={() => handleHabitIncomplete(item.habitId)}
              >
                <Ionicons name="refresh-outline" size={16} color={colors.text} />
                <Text style={[styles.undoButtonText, { color: colors.text }]}>Undo</Text>
              </TouchableOpacity>
            )}
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

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
            Daily Habits
          </Text>
          <Text style={[styles.title, { color: colors.text }]}>
            Build Your Routine
          </Text>
        </View>

        <View style={[styles.progressCard, { backgroundColor: colors.card }]}>
          <View style={styles.progressHeader}>
            <Text style={[styles.progressTitle, { color: colors.text }]}>
              Today's Progress
            </Text>
            <Text style={[styles.progressPercentage, { color: colors.primary }]}>
              {getCompletionPercentage()}%
            </Text>
          </View>
          <View style={styles.overallProgress}>
            <View style={styles.overallProgressBar}>
              <View
                style={[
                  styles.overallProgressFill,
                  {
                    width: ${getCompletionPercentage()}%,
                    backgroundColor: colors.success,
                  }
                ]}
              />
            </View>
            <Text style={[styles.progressLabel, { color: colors.textSecondary }]}>
              {getTodayHabits().filter(h => getTodayProgress(h.habitId) >= 100).length} of {getTodayHabits().length} completed
            </Text>
          </View>
        </View>
      </LinearGradient>
    </Animated.View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="repeat-outline" size={64} color={colors.textSecondary} />
      <Text style={[styles.emptyTitle, { color: colors.text }]}>
        No Habits Yet
      </Text>
      <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
        Start building healthy habits by adding your first one
      </Text>
      <TouchableOpacity
        style={[styles.emptyActionButton, { backgroundColor: colors.primary }]}
        onPress={() => setShowAddModal(true)}
      >
        <Ionicons name="add" size={20} color="#FFFFFF" />
        <Text style={styles.emptyActionText}>Add Your First Habit</Text>
      </TouchableOpacity>
    </View>
  );

  const renderAddHabitModal = () => (
    <Modal
      visible={showAddModal}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setShowAddModal(false)}
    >
      <BlurView
        intensity={100}
        tint={colorScheme === 'dark' ? 'dark' : 'light'}
        style={styles.modalOverlay}
      >
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowAddModal(false)}>
              <Ionicons name="close-outline" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Add Habit
            </Text>
            <View style={{ width: 24 }} />
          </View>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            <View style={styles.quickHabitsContainer}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Quick Add
              </Text>
              {['Drink Water', 'Exercise', 'Sleep Early', 'Meditation'].map((habitName, index) => (
                <TouchableOpacity
                  key={habitName}
                  style={[styles.quickHabitOption, { backgroundColor: colors.card }]}
                  onPress={() => {
                    // Handle quick add logic here
                    Alert.alert('Quick Add', ${habitName} habit would be added here);
                    setShowAddModal(false);
                  }}
                >
                  <Ionicons name="add-circle-outline" size={24} color={colors.primary} />
                  <Text style={[styles.quickHabitText, { color: colors.text }]}>
                    {habitName}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.customHabitContainer}>
              <TouchableOpacity
                style={[styles.customHabitButton, { backgroundColor: colors.primary }]}
                onPress={() => {
                  Alert.alert('Custom Habit', 'Custom habit form would open here');
                  setShowAddModal(false);
                }}
              >
                <Ionicons name="create-outline" size={20} color="#FFFFFF" />
                <Text style={styles.customHabitButtonText}>Create Custom Habit</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </SafeAreaView>
      </BlurView>
    </Modal>
  );

  const renderDetailModal = () => (
    <Modal
      visible={showDetailModal}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setShowDetailModal(false)}
    >
      <BlurView
        intensity={100}
        tint={colorScheme === 'dark' ? 'dark' : 'light'}
        style={styles.modalOverlay}
      >
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          {selectedHabit && (
            <>
              <View style={styles.modalHeader}>
                <TouchableOpacity onPress={() => setShowDetailModal(false)}>
                  <Ionicons name="close-outline" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.modalTitle, { color: colors.text }]}>
                  {selectedHabit.habitName}
                </Text>
                <TouchableOpacity>
                  <Ionicons name="create-outline" size={20} color={colors.primary} />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
                <View style={[styles.detailCard, { backgroundColor: colors.card }]}>
                  <View style={[styles.iconContainerLarge, { backgroundColor: selectedHabit.color + '20' }]}>
                    <Text style={styles.habitIconLarge}>{selectedHabit.icon}</Text>
                  </View>
                  <Text style={[styles.detailName, { color: colors.text }]}>
                    {selectedHabit.habitName}
                  </Text>
                  <Text style={[styles.detailDescription, { color: colors.textSecondary }]}>
                    {selectedHabit.description}
                  </Text>
                </View>

                <View style={[styles.detailSection, { backgroundColor: colors.card }]}>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>Target</Text>
                  <Text style={[styles.sectionContent, { color: colors.textSecondary }]}>
                    {selectedHabit.target.value} {selectedHabit.target.unit} per {selectedHabit.target.frequency}
                  </Text>
                </View>

                <View style={[styles.detailSection, { backgroundColor: colors.card }]}>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>Streak</Text>
                  <Text style={[styles.sectionContent, { color: colors.textSecondary }]}>
                    {getStreakEmoji(selectedHabit.streak)} {selectedHabit.streak} days (Best: {selectedHabit.bestStreak})
                  </Text>
                </View>

                <View style={[styles.detailSection, { backgroundColor: colors.card }]}>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>Reminder</Text>
                  <Text style={[styles.sectionContent, { color: colors.textSecondary }]}>
                    {selectedHabit.reminderTimes.join(', ')}
                  </Text>
                </View>
              </ScrollView>
            </>
          )}
        </SafeAreaView>
      </BlurView>
    </Modal>
  );

  const todayHabits = getTodayHabits();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {renderHeader()}

        <Animated.View style={[styles.habitsList, cardAnimatedStyle]}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
                Loading habits...
              </Text>
            </View>
          ) : todayHabits.length === 0 ? (
            renderEmptyState()
          ) : (
            <FlatList
              data={todayHabits}
              renderItem={renderHabitCard}
              keyExtractor={item => item.habitId}
              showsVerticalScrollIndicator={false}
              scrollEnabled={false}
            />
          )}
        </Animated.View>

        <View style={styles.quickActions}>
          <TouchableOpacity
            style={[
              styles.addAction,
              {
                backgroundColor: colors.primary,
                shadowColor: colors.primary,
              }
            ]}
            onPress={() => setShowAddModal(true)}
          >
            <Ionicons name="add" size={24} color="#FFFFFF" />
            <Text style={styles.addActionText}>Add Habit</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footerSpace} />
      </ScrollView>

      {renderAddHabitModal()}
      {renderDetailModal()}
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
    minHeight: 220,
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
  progressCard: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
      },
      android: {
        elevation: 4,
      }
    })
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  progressTitle: {
    ...Typography.h4,
  },
  progressPercentage: {
    ...Typography.h3,
    fontWeight: '700',
  },
  overallProgress: {
    alignItems: 'center',
  },
  overallProgressBar: {
    width: '100%',
    height: 8,
    backgroundColor: '#E5E5E7',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: Spacing.sm,
  },
  overallProgressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressLabel: {
    ...Typography.caption,
  },
  habitsList: {
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
  },
  habitCard: {
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.12,
        shadowRadius: 10,
      },
      android: {
        elevation: 4,
      }
    })
  },
  cardContent: {
    padding: Spacing.lg,
  },
  habitHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  habitInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  habitIcon: {
    fontSize: 24,
  },
  habitDetails: {
    flex: 1,
  },
  habitName: {
    ...Typography.h4,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  habitDescription: {
    ...Typography.caption,
  },
  streakContainer: {
    alignItems: 'center',
  },
  streakEmoji: {
    fontSize: 20,
  },
  streakText: {
    ...Typography.small,
    textAlign: 'center',
  },
  progressSection: {
    marginBottom: Spacing.md,
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  progressText: {
    ...Typography.body,
  },
  progressPercentageText: {
    ...Typography.body,
    fontWeight: '600',
  },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: '#E5E5E7',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  completeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
  },
  completeButtonText: {
    ...Typography.body,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: Spacing.sm,
  },
  undoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  undoButtonText: {
    ...Typography.body,
    fontWeight: '600',
    marginLeft: Spacing.sm,
  },
  quickActions: {
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
  },
  addAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.lg,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
      },
      android: {
        elevation: 6,
      }
    })
  },
  addActionText: {
    ...Typography.body,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: Spacing.sm,
  },
  loadingContainer: {
    alignItems: 'center',
    padding: Spacing.xl,
  },
  loadingText: {
    ...Typography.body,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: Spacing.xl,
  },
  emptyTitle: {
    ...Typography.h3,
    fontWeight: '600',
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  emptyText: {
    ...Typography.body,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  emptyActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.lg,
  },
  emptyActionText: {
    ...Typography.body,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: Spacing.sm,
  },
  modalOverlay: {
    flex: 1,
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E7',
  },
  modalTitle: {
    ...Typography.h3,
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    padding: Spacing.lg,
  },
  quickHabitsContainer: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    ...Typography.h4,
    fontWeight: '600',
    marginBottom: Spacing.md,
  },
  quickHabitOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
  },
  quickHabitText: {
    ...Typography.body,
    marginLeft: Spacing.md,
  },
  customHabitContainer: {
    alignItems: 'center',
  },
  customHabitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
  },
  customHabitButtonText: {
    ...Typography.body,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: Spacing.sm,
  },
  detailCard: {
    alignItems: 'center',
    padding: Spacing.xl,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
  },
  iconContainerLarge: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  habitIconLarge: {
    fontSize: 40,
  },
  detailName: {
    ...Typography.h2,
    fontWeight: '700',
    marginBottom: Spacing.sm,
  },
  detailDescription: {
    ...Typography.body,
    textAlign: 'center',
  },
  detailSection: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.sm,
  },
  sectionContent: {
    ...Typography.body,
    lineHeight: 22,
  },
  footerSpace: {
    height: 64,
  },
});