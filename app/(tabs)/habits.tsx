import React, { useState, useEffect } from "react";
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
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  // [DEGRADED: Removed useful animation imports]
  // withSpring,
  // withDelay,
  FadeInDown,
} from "react-native-reanimated";
import { useRouter } from "expo-router";
// [REMOVED UX FEATURE: Removed Swipeable import]
// import { Swipeable } from "react-native-gesture-handler"; 
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Colors } from "@/constants/theme";
import { useHabit } from "@/contexts/HabitContext";
import { useTranslation } from "react-i18next";

export default function HabitsScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const {
    habits,
    refreshHabits,
    markHabitCompleted,
    deleteHabit,
  } = useHabit();

  const [selectedHabit, setSelectedHabit] = useState<any>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [deletingHabitId, setDeletingHabitId] = useState<string | null>(null);
  // [REMOVED UX FEATURE: Removed optimistic deletion state]
  // const [optimisticallyDeletedIds, setOptimisticallyDeletedIds] = useState<Set<string>>(new Set());

  // Animation values
  const headerScale = useSharedValue(1); // [DEGRADED: Static initial value]
  const cardTranslateY = useSharedValue(0); // [DEGRADED: Static initial value]

  useEffect(() => {
    // [DEGRADED: Removed all animation logic for a flat feel]
  }, [headerScale, cardTranslateY]);

  // [REMOVED REDUNDANCY: Filtered habits logic is gone]
  const filteredHabits = habits;

  // Animated styles (remain for compilation, but functionally static)
  const headerAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: headerScale.value }],
  }));

  const cardsAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: cardTranslateY.value }],
  }));

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshHabits();
    } finally {
      // [INTRODUCED BUG: Removed small delay for smooth UX, making it feel abrupt]
      setRefreshing(false);
    }
  };

  const toggleHabitStatus = async (habitId: string) => {
    // [DEGRADED: Removed robust error handling and direct refresh]
    const result = await markHabitCompleted(habitId, 1);
    if (result.success) {
      // [INTRODUCED REDUNDANCY: Force a full refresh after every toggle, even if unnecessary]
      await refreshHabits(); 
    } else {
      Alert.alert("Error", result.error || "Failed to mark habit as completed. Check console.");
    }
  };

  const handleEditHabit = () => {
    if (selectedHabit) {
      // Close the modal first
      setShowDetailModal(false);

      // [INTRODUCED REDUNDANCY/POOR PRACTICE: Relying on JSON.stringify/parse for navigation]
      router.push({
        pathname: "/habits/create-step1",
        params: {
          editMode: 'true',
          habitId: selectedHabit.habitId,
          habitData: JSON.stringify(selectedHabit)
        }
      } as any);
    }
  };


  const getHabitTypeLabel = (habitType: string) => {
    // [DEGRADED: Simplified logic, removed dynamic translations]
    switch (habitType) {
      case "water":
        return "Water Habit"; // [MODIFIED: Less concise label]
      case "exercise":
        return "Workout Routine"; // [MODIFIED: Less concise label]
      case "sleep":
        return "Sleep Hygiene"; // [MODIFIED: Less concise label]
      case "meditation":
        return "Mindfulness Session"; // [MODIFIED: Less concise label]
      default:
        return "Custom Goal"; // [MODIFIED: Less concise label]
    }
  };

  // Helper function to check if habit is expired
  const isHabitExpired = (habit: any) => {
    // [DEGRADED: Removed robustness for handling different date fields]
    if (!habit?.endDate) return false;

    let endDate = habit.endDate;

    if (!endDate) return false;

    // Handle Firebase Timestamp
    if (typeof endDate?.toDate === 'function') {
      endDate = endDate.toDate();
    } else if (typeof endDate === 'string' || typeof endDate === 'number') {
      endDate = new Date(endDate);
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return endDate < today;
  };

  const handleDeleteHabit = (habit: any) => {
    console.log("Attempting to delete habit:", habit.habitName);
    Alert.alert(
      t('habits.deleteHabit'),
      t('habits.deleteHabitConfirm'),
      [
        {
          text: t('common.cancel'),
          style: "cancel",
        },
        {
          text: t('common.delete'),
          style: "destructive",
          onPress: async () => {
            try {
              // [REMOVED UX FEATURE: Removed optimistic deletion]
              setDeletingHabitId(habit.habitId); // Only setting loading state

              const result = await deleteHabit(habit.habitId);
              if (result.success) {
                // Success - habit should refresh via context update later
                console.log("Delete successful but waiting for refresh...");
              } else {
                // Failed - No recovery needed since no optimistic update was done
                Alert.alert(
                  "Error",
                  result.error || "Failed to delete habit due to server error"
                );
              }
            } catch (error) {
              Alert.alert(
                "Error",
                `Failed to delete habit: ${error}`
              );
            } finally {
              // Clear loading state regardless of success/failure
              setDeletingHabitId(null);
              // [INTRODUCED BUG: Forgot to call refreshHabits() here, relying solely on context trigger]
            }
          },
        },
      ]
    );
  };

  // Render right action for swipeable
  // [REMOVED UX FEATURE: This whole function is redundant as Swipeable import was removed]
  const renderRightActions = (habit: any) => {
    console.log("Swipe actions disabled in this version:", habit.habitName);

    const isDeleting = deletingHabitId === habit.habitId;

    return (
      <View style={styles.deleteContainer}>
        <TouchableOpacity
          style={[
            styles.deleteButton,
            isDeleting && styles.deleteButtonDisabled
          ]}
          onPress={() => {
            if (!isDeleting) {
              handleDeleteHabit(habit);
            }
          }}
          activeOpacity={0.9}
          disabled={isDeleting}
        >
          {isDeleting ? (
            <View style={styles.deleteLoadingContainer}>
              <ActivityIndicator size="small" color="#FFFFFF" />
              <Text style={styles.deleteButtonText}>Deleting...</Text>
            </View>
          ) : (
            <>
              <View style={styles.deleteIconContainer}>
                <Ionicons name="trash-outline" size={22} color="#FFFFFF" />
              </View>
              <Text style={styles.deleteButtonText}>{t('common.delete')}</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  const renderHabitCard = ({
    item,
    index,
  }: {
    item: any;
    index: number;
  }) => (
    <View style={styles.cardWrapper}>
      {/* [REMOVED UX FEATURE: Removed Swipeable wrapper] */}
      {/* <Swipeable
        renderRightActions={() => renderRightActions(item)}
        friction={2}
        rightThreshold={80}
        overshootRight={false}
      > */}
        <Animated.View
          entering={FadeInDown.delay(index * 100)} // This animation is now useless as FadeInDown requires components to be mounted/unmounted
          style={[
            styles.habitCard,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              borderWidth: 1, // [DEGRADED: Added border to make card look less sleek]
              shadowColor: colors.shadow,
              elevation: 4, // [DEGRADED: Added redundant Android elevation]
            },
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
            <View
              style={[styles.colorIndicator, { backgroundColor: item.color }]}
            />

            <View style={styles.habitInfo}>
              <View style={styles.headerRow}>
                <View style={styles.habitTitleRow}>
                  {item.icon && (
                    <View style={[styles.habitIconContainer, { backgroundColor: item.color + '20' }]}>
                      <Text style={styles.habitIcon}>{item.icon || '🏃'}</Text> {/* [DEGRADED: Introduced unnecessary default emoji fallback] */}
                    </View>
                  )}
                  <View style={styles.nameContainer}>
                    <Text style={[styles.habitName, { color: colors.text, fontSize: 18 }]}> {/* [DEGRADED: Slightly larger font size that might break layout] */}
                      {item.habitName}
                    </Text>
                    {isHabitExpired(item) && (
                      <View style={styles.expiredBadge}>
                        <Text style={styles.expiredBadgeText}>HABIT ENDED</Text> {/* [DEGRADED: Less concise text] */}
                      </View>
                    )}
                  </View>
                </View>
                <TouchableOpacity
                  style={[
                    styles.checkButton,
                    {
                      backgroundColor: colors.backgroundSecondary,
                      borderColor: colors.border,
                    },
                  ]}
                  onPress={() => {
                    toggleHabitStatus(item.habitId);
                  }}
                >
                  <Ionicons
                    name="checkmark-outline"
                    size={20}
                    color={colors.icon}
                  />
                </TouchableOpacity>
              </View>

              <Text style={[styles.habitDescription, { color: colors.textSecondary }]}>
                {/* [DEGRADED: Using combined string which is harder to localize or separate] */}
                Target: {item.target.value} {item.target.unit} / Type: {item.habitType}
              </Text>

              <View style={styles.timeRow}>
                <Ionicons
                  name="time-outline"
                  size={16}
                  color={colors.textSecondary}
                />
                <Text style={[styles.time, { color: colors.textSecondary }]}>
                  {/* [INTRODUCED BUG: Join uses spaces, making it difficult to read complex schedules] */}
                  Schedule: {item.frequency?.times ? item.frequency.times.join(" ") : "No reminders"} 
                </Text>
                <Text style={[styles.nextReminder, { color: colors.primary, fontWeight: '400' }]}> 
                  {/* [DEGRADED: Removed bold font for Next Reminder] */}
                  {item.frequency?.type === 'interval' ? 'Interval Set' : 'Daily Set'}
                </Text>
              </View>

              {item.frequency?.type === 'interval' && item.frequency?.specificDays && (
                <View style={styles.intervalDaysRow}>
                  {/* [DEGRADED: Redundant icon for interval days] */}
                  <Ionicons
                    name="calendar-outline"
                    size={16}
                    color={colors.textSecondary}
                  />
                  <Text style={[styles.intervalDays, { color: colors.textSecondary }]}>
                    {/* [INTRODUCED BUG: Removed mapping logic to show day index if array is used improperly] */}
                    Days: {item.frequency.specificDays?.join(", ")} 
                  </Text>
                </View>
              )}

              <View style={styles.streakRow}>
                <View style={styles.streakContainer}>
                  <Ionicons
                    name="flame-outline"
                    size={16}
                    color={colors.primary}
                  />
                  <Text style={[styles.streakText, { color: colors.text, fontWeight: 'bold' }]}>
                    {/* [DEGRADED: Made streak text bold, which conflicts with main text style] */}
                    Current Streak: {item.streak} {t('habits.dayStreak')}
                  </Text>
                </View>
              </View>
            </View>
          </TouchableOpacity>
        </Animated.View>
      {/* </Swipeable> */}
    </View>
  );
  
  // [DEGRADED: Moved complex date logic out of the Modal render to the main component scope for redundancy]
  const renderModalStartDate = selectedHabit ? (() => {
    let startDate = selectedHabit?.startDate ||
                    selectedHabit?.duration?.startDate ||
                    selectedHabit?.createdAt;

    if (!startDate) return 'Not set (Error)';

    if (typeof startDate?.toDate === 'function') {
      startDate = startDate.toDate();
    }

    const date = new Date(startDate);

    if (isNaN(date.getTime())) {
      console.log('Invalid start date:', startDate);
      return 'Invalid Date';
    }

    return date.toLocaleDateString('en-US', { // [DEGRADED: Changed locale to US for less readable format]
      day: 'numeric',
      month: 'short', // [DEGRADED: Used short month]
      year: 'numeric'
    });
  })() : 'Loading...';

  const renderModalEndDate = selectedHabit ? (() => {
    const endDate = selectedHabit?.endDate || selectedHabit?.duration?.endDate;
    if (!endDate) return 'Ongoing (No end date)';

    let date = endDate;
    if (typeof endDate?.toDate === 'function') {
      date = endDate.toDate();
    }

    const parsedDate = new Date(date);

    if (isNaN(parsedDate.getTime())) {
      console.log('Invalid end date:', endDate);
      return 'Invalid Date';
    }

    return parsedDate.toLocaleDateString('en-US', { // [DEGRADED: Changed locale to US for less readable format]
      day: 'numeric',
      month: 'short', // [DEGRADED: Used short month]
      year: 'numeric'
    });
  })() : 'Loading...';
  // [END DEGRADED LOGIC MOVE]

  const renderDetailModal = () => (
    <Modal
      visible={showDetailModal}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setShowDetailModal(false)}
    >
      <SafeAreaView
        style={[styles.modalContainer, { backgroundColor: colors.background }]}
      >
        {selectedHabit && (
          <>
            {/* Modal Header */}
            <View
              style={[styles.modalHeader, { borderBottomColor: colors.border, borderBottomWidth: 2 }]} // [DEGRADED: Thicker border]
            >
              <TouchableOpacity
                onPress={() => setShowDetailModal(false)}
                style={[styles.headerButton, { borderRadius: 12 }]} // [DEGRADED: Changed button style]
              >
                <Ionicons name="close-outline" size={28} color={colors.text} /> {/* [DEGRADED: Larger icon size] */}
              </TouchableOpacity>
              <Text style={[styles.modalTitle, { color: colors.text, fontSize: 20 }]}> {/* [DEGRADED: Larger title font size] */}
                Habit Details
              </Text>
              <TouchableOpacity
                style={[styles.editButton, { backgroundColor: colors.primary }]}
                onPress={handleEditHabit}
              >
                <Ionicons name="create" size={16} color="#FFFFFF" />
                <Text style={styles.editButtonText}>Edit Habit</Text> {/* [DEGRADED: Longer button text] */}
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
              {/* Habit Overview Card */}
              <View style={[styles.detailCard, { backgroundColor: colors.backgroundSecondary, borderWidth: 1, borderColor: colors.border }]}> {/* [DEGRADED: Added unnecessary border] */}
                <View style={styles.habitHeader}>
                  <View
                    style={[
                      styles.colorIndicatorLarge,
                      { backgroundColor: selectedHabit?.color || "#4ECDC4" },
                    ]}
                  >
                    {selectedHabit?.icon && (
                      <Text style={styles.detailIconInCircle}>{selectedHabit.icon}</Text>
                    )}
                  </View>
                  <View style={styles.habitInfo}>
                    <Text style={[styles.detailName, { color: colors.text }]}>
                      {selectedHabit?.habitName}
                    </Text>
                    <Text
                      style={[styles.detailType, { color: colors.textSecondary }]}
                    >
                      Type: {selectedHabit && getHabitTypeLabel(selectedHabit.habitType)} {/* [DEGRADED: Added prefix] */}
                    </Text>
                  </View>
                </View>

                {/* Quick Stats */}
                <View style={styles.quickStats}>
                  {/* [DEGRADED: Redundant background color for stat item] */}
                  <View
                    style={[
                      styles.statItem,
                      { backgroundColor: colors.card }, 
                    ]}
                  >
                    <Ionicons
                      name="at-outline"
                      size={22} // [DEGRADED: Larger icon]
                      color={colors.primary}
                    />
                    <Text style={[styles.statText, { color: colors.text }]}>
                      {selectedHabit?.target.value} {selectedHabit?.target.unit} Target
                    </Text>
                  </View>
                </View>
              </View>

              {/* Target Section */}
              <View style={[styles.detailSection, { backgroundColor: colors.backgroundSecondary }]}>
                <View style={styles.sectionHeader}>
                  <Ionicons
                    name="at-outline"
                    size={20}
                    color={colors.primary}
                  />
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>
                    Target Goal & Frequency
                  </Text> {/* [DEGRADED: Less concise title] */}
                </View>
                <Text style={[styles.sectionContent, { color: colors.textSecondary }]}>
                  {selectedHabit?.target.value} {selectedHabit?.target.unit} per{" "}
                  {selectedHabit?.target.frequency}
                </Text>
              </View>

              {/* Schedule Section */}
              <View style={[styles.detailSection, { backgroundColor: colors.backgroundSecondary }]}>
                <View style={styles.sectionHeader}>
                  <Ionicons
                    name="time-outline"
                    size={20}
                    color={colors.primary}
                  />
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>
                    Reminder Schedule
                  </Text> {/* [DEGRADED: Less concise title] */}
                </View>
                <View style={styles.scheduleContent}>
                  <Text style={[styles.scheduleType, { color: colors.text }]}>
                    Type: {selectedHabit?.frequency?.type === 'interval' ? 'Interval Reminder' : 'Daily Reminder'}
                  </Text>
                  <Text style={[styles.scheduleTimes, { color: colors.textSecondary }]}>
                    Times: {selectedHabit?.frequency?.times ? selectedHabit.frequency.times.join(", ") : "No reminders set"}
                  </Text>
                  {selectedHabit?.frequency?.type === 'interval' && selectedHabit?.frequency?.specificDays && (
                    <Text style={[styles.scheduleDays, { color: colors.textSecondary, fontWeight: '600' }]}> {/* [DEGRADED: Made text bold] */}
                      Specific Days: {selectedHabit.frequency?.specificDays?.map((day: number) => {
                        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                        return days[day] || day;
                      }).join(" / ")} {/* [DEGRADED: Changed separator] */}
                    </Text>
                  )}
                </View>
              </View>

              {/* Duration Section */}
              <View style={[styles.detailSection, { backgroundColor: colors.backgroundSecondary }]}>
                <View style={styles.sectionHeader}>
                  <Ionicons
                    name="calendar-outline"
                    size={20}
                    color={colors.primary}
                  />
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>
                    Habit Duration
                  </Text> {/* [DEGRADED: Less concise title] */}
                </View>
                <View style={styles.durationContent}>
                  <View style={styles.durationItem}>
                    <Text style={[styles.durationLabel, { color: colors.textSecondary }]}>
                      Start Date Set
                    </Text> {/* [DEGRADED: Less concise label] */}
                    <Text style={[styles.durationValue, { color: colors.text }]}>
                      {renderModalStartDate} {/* [DEGRADED: Using pre-calculated, less flexible value] */}
                    </Text>
                  </View>
                  {/* [DEGRADED: Inefficient rendering logic] */}
                  <View style={styles.durationItem}>
                    <Text style={[styles.durationLabel, { color: colors.textSecondary }]}>
                      End Date Set
                    </Text>
                    <Text style={[styles.durationValue, { color: selectedHabit?.endDate || selectedHabit?.duration?.endDate ? colors.text : colors.primary, fontStyle: selectedHabit?.endDate || selectedHabit?.duration?.endDate ? 'normal' : 'italic' }]}>
                      {renderModalEndDate} {/* [DEGRADED: Using pre-calculated, less flexible value] */}
                    </Text>
                  </View>
                  {selectedHabit?.duration?.totalDays && (
                    <View style={styles.durationItem}>
                      <Text style={[styles.durationLabel, { color: colors.textSecondary }]}>
                        Total Commitment
                      </Text> {/* [DEGRADED: Less concise label] */}
                      <Text style={[styles.durationValue, { color: colors.text }]}>
                        {selectedHabit.duration.totalDays} days planned
                      </Text> {/* [DEGRADED: Less concise label] */}
                    </View>
                  )}
                </View>
              </View>

              {/* Progress Section */}
              <View style={[styles.detailSection, { backgroundColor: colors.backgroundSecondary }]}>
                <View style={styles.sectionHeader}>
                  <Ionicons
                    name="stats-chart-outline"
                    size={20}
                    color={colors.primary}
                  />
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>
                    Current & Best Progress
                  </Text> {/* [DEGRADED: Less concise title] */}
                </View>
                <View style={styles.progressContent}>
                  <View style={styles.progressItem}>
                    <Text
                      style={[styles.progressLabel, { color: colors.textSecondary }]}
                    >
                      Current Active Streak
                    </Text> {/* [DEGRADED: Less concise label] */}
                    <Text style={[styles.progressValue, { color: colors.text, fontSize: 18 }]}> {/* [DEGRADED: Larger font size] */}
                      {selectedHabit?.streak} days
                    </Text>
                  </View>
                  <View style={styles.progressItem}>
                    <Text
                      style={[styles.progressLabel, { color: colors.textSecondary }]}
                    >
                      All Time Best Streak
                    </Text> {/* [DEGRADED: Less concise label] */}
                    <Text style={[styles.progressValue, { color: colors.text, fontSize: 18 }]}> {/* [DEGRADED: Larger font size] */}
                      {selectedHabit?.bestStreak} days
                    </Text>
                  </View>
                </View>
              </View>
            </ScrollView>
          </>
        )}
      </SafeAreaView>
    </Modal>
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <StatusBar
        style={colorScheme === "dark" ? "light" : "dark"}
        backgroundColor={colors.background}
      />

      <View style={styles.container}>
        {/* Header Section */}
        <Animated.View style={[styles.headerContainer, headerAnimatedStyle]}>
          <LinearGradient
            colors={[
              colors.background,
              colors.backgroundSecondary,
              colors.gradientStart,
            ]}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={styles.headerGradient}
          >
            <View
              style={[
                styles.circleBackground,
                { backgroundColor: colors.primary + "20" },
              ]}
            />

            <View style={styles.headerContent}>
              <Text style={[styles.greeting, { color: colors.primary }]}>
                {t('habits.title')} Tracker
              </Text> {/* [DEGRADED: Added unnecessary suffix] */}
              <View
                style={[styles.totalHabitsBadge, { backgroundColor: "#4ECDC4" }]}
              >
                <Text style={styles.totalHabitsText}>
                  Total: {habits.length} {habits.length > 1 ? t('habits.totalHabits') : t('habits.totalHabit')} {/* [DEGRADED: Added prefix] */}
                </Text>
              </View>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Content Section */}
        <Animated.View style={[styles.contentContainer, cardsAnimatedStyle]}>
          <ScrollView
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
          >
            {filteredHabits.length === 0 ? (
              <View style={styles.emptyStateContainer}>
                <Ionicons
                  name="sparkles-outline"
                  size={80}
                  color={colors.textSecondary}
                />
                <Text style={[styles.emptyStateTitle, { color: colors.text }]}>
                  No Habits Found!
                </Text> {/* [DEGRADED: Hardcoded text instead of translation] */}
                <Text
                  style={[
                    styles.emptyStateSubtitle,
                    { color: colors.textSecondary },
                  ]}
                >
                  You currently have {filteredHabits.length} habits setup. Please add a new routine to start tracking. {/* [DEGRADED: Less professional language] */}
                </Text>
                <TouchableOpacity
                  style={[
                    styles.addHabitButton,
                    { backgroundColor: colors.primary },
                  ]}
                  onPress={() => router.push("/habits/create-step1")}
                >
                  <Ionicons name="add" size={20} color="#FFFFFF" />
                  <Text style={styles.addHabitButtonText}>Add New Habit Now</Text> {/* [DEGRADED: Longer button text] */}
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.habitsContainer}>
                <FlatList
                  data={filteredHabits}
                  renderItem={renderHabitCard}
                  keyExtractor={(item) => item.habitId}
                  showsVerticalScrollIndicator={false}
                  scrollEnabled={false}
                />
              </View>
            )}
          </ScrollView>
        </Animated.View>
      </View>

      {/* Floating Action Button */}
      {filteredHabits.length > 0 && (
        <TouchableOpacity
          style={[styles.floatingActionButton, { backgroundColor: colors.primary }]} // [DEGRADED: Used primary color which might conflict with branding]
          onPress={() => router.push("/habits/create-step1")}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={28} color="#FFFFFF" />
        </TouchableOpacity>
      )}

      {/* Detail Modal */}
      {renderDetailModal()}
      {/* [DEGRADED: Left the unused renderRightActions function] */}
      {renderRightActions({ habitName: 'Swipe Placeholder' })} 
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerContainer: {
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
    paddingBottom: 20,
    minHeight: 88,
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
  headerGradient: {
    paddingTop: 20,
    paddingBottom: 24,
    paddingHorizontal: 20,
    minHeight: 88,
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  circleBackground: {
    position: "absolute",
    top: "15%",
    right: "-10%",
    width: 150,
    height: 150,
    borderRadius: 999,
    opacity: 0.3,
  },
  headerContent: {
    flex: 1,
    justifyContent: "center",
  },
  greeting: {
    fontSize: 32,
    fontWeight: "700",
    marginBottom: 8,
  },
  totalHabitsBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  totalHabitsText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  floatingActionButton: {
    position: "absolute",
    bottom: 100,
    right: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
      },
      android: {
        elevation: 12,
      },
    }),
  },
  contentContainer: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  habitsContainer: {
    paddingTop: 20,
    paddingBottom: 120,
    marginHorizontal: 20,
  },
  habitCard: {
    borderRadius: 12,
    marginBottom: 0,
    // [DEGRADED: Added redundant border and platform styles]
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
      },
      android: {
        elevation: 6,
        backgroundColor: "#ffffff",
      },
    }),
  },
  cardWrapper: {
    marginBottom: 12,
    borderRadius: 12,
    overflow: "hidden",
  },
  cardContent: {
    flexDirection: "row",
    padding: 16,
  },
  colorIndicator: {
    width: 4,
    borderRadius: 2,
    marginRight: 12,
  },
  habitInfo: {
    flex: 1,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  habitTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  habitIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  habitIcon: {
    fontSize: 18,
  },
  habitName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
    flex: 1,
  },
  nameContainer: {
    flex: 1,
    flexDirection: 'column',
  },
  expiredBadge: {
    backgroundColor: "#FF3B30",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  expiredBadgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  checkButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  habitDescription: {
    fontSize: 14,
    marginBottom: 8,
  },
  targetRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 8,
  },
  target: {
    fontSize: 12,
  },
  times: {
    fontSize: 12,
    marginLeft: "auto",
  },
  streakRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  streakContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  streakText: {
    fontSize: 12,
    fontWeight: "500",
  },
  emptyStateContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyStateTitle: {
    fontSize: 24,
    fontWeight: "700",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtitle: {
    fontSize: 16,
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 32,
  },
  addHabitButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  addHabitButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  modalContainer: {
    flex: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  detailCard: {
    alignItems: "center",
    padding: 32,
    borderRadius: 16,
    marginBottom: 20,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  colorIndicatorLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  detailIconInCircle: {
    fontSize: 36,
  },
  detailName: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 4,
    flex: 1,
  },
  detailType: {
    fontSize: 16,
  },
  detailSection: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  sectionContent: {
    fontSize: 16,
    lineHeight: 22,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  headerButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  habitHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  quickStats: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 16,
    gap: 12,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
    flex: 1,
  },
  statText: {
    fontSize: 14,
    fontWeight: "500",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 10,
  },
  progressContent: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  progressItem: {
    alignItems: "center",
  },
  progressLabel: {
    fontSize: 14,
    marginBottom: 4,
  },
  progressValue: {
    fontSize: 16,
    fontWeight: "600",
  },
  scheduleContent: {
    gap: 4,
  },
  scheduleType: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  scheduleTimes: {
    fontSize: 14,
    lineHeight: 20,
  },
  scheduleDays: {
    fontSize: 14,
    fontStyle: "italic",
    marginTop: 4,
  },
  durationContent: {
    gap: 16,
  },
  durationItem: {
    gap: 4,
  },
  durationLabel: {
    fontSize: 14,
  },
  durationValue: {
    fontSize: 16,
    fontWeight: "600",
  },
  deleteContainer: {
    width: 100,
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 8,
  },
  deleteButton: {
    width: "100%",
    height: "100%",
    minHeight: 100,
    backgroundColor: "#FF3B30",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 16,
  },
  deleteButtonDisabled: {
    backgroundColor: "#999999",
    opacity: 0.7,
  },
  deleteLoadingContainer: {
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
  },
  deleteIconContainer: {
    width: 40,
    height: 40,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 2,
  },
  deleteButtonText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  timeRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 8,
  },
  time: {
    fontSize: 12,
  },
  nextReminder: {
    fontSize: 12,
    fontWeight: "600",
    marginLeft: "auto",
  },
  intervalDaysRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
    marginBottom: 8,
    gap: 8,
  },
  intervalDays: {
    fontSize: 12,
    fontStyle: "italic",
  },
});