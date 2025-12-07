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
  withSpring,
  withDelay,
  FadeInDown,
} from "react-native-reanimated";
import { useRouter } from "expo-router";
import { Swipeable } from "react-native-gesture-handler";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Colors } from "@/constants/theme";
import { useHabit } from "@/contexts/HabitContext";

export default function HabitsScreen() {
  const router = useRouter();
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
  const [optimisticallyDeletedIds, setOptimisticallyDeletedIds] = useState<Set<string>>(new Set());

  // Animation values
  const headerScale = useSharedValue(0.9);
  const cardTranslateY = useSharedValue(50);

  useEffect(() => {
    // Animate header in
    headerScale.value = withDelay(200, withSpring(1, {
      damping: 15,
      stiffness: 100,
    }));

    // Animate cards in
    cardTranslateY.value = withDelay(400, withSpring(0, {
      damping: 15,
      stiffness: 100,
    }));
  }, [headerScale, cardTranslateY]);

  // Filter habits to exclude optimistically deleted ones
  const filteredHabits = habits.filter(
    habit => !optimisticallyDeletedIds.has(habit.habitId)
  );

  // Animated styles
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
      // Small delay for smooth UX
      setTimeout(() => {
        setRefreshing(false);
      }, 300);
    }
  };

  const toggleHabitStatus = async (habitId: string) => {
    // In real app, you'd check if habit is completed today
    // For now, we'll just mark it as completed
    const result = await markHabitCompleted(habitId, 1);
    if (!result.success) {
      Alert.alert("Error", result.error || "Failed to mark habit as completed");
    } else {
      await refreshHabits();
    }
  };

  const handleEditHabit = () => {
    if (selectedHabit) {
      // Close the modal first
      setShowDetailModal(false);

      // Navigate to create-step1 screen with edit mode (like medicine)
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
    switch (habitType) {
      case "water":
        return "Water";
      case "exercise":
        return "Exercise";
      case "sleep":
        return "Sleep";
      case "meditation":
        return "Meditation";
      default:
        return "Custom";
    }
  };

  // Helper function to check if habit is expired
  const isHabitExpired = (habit: any) => {
    if (!habit?.endDate && !habit?.duration?.endDate) return false;

    let endDate = habit.endDate || habit.duration?.endDate;

    if (!endDate) return false;

    // Handle Firebase Timestamp
    if (typeof endDate?.toDate === 'function') {
      endDate = endDate.toDate();
    } else if (typeof endDate === 'string' || typeof endDate === 'number') {
      endDate = new Date(endDate);
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set to start of day for accurate comparison

    return endDate < today;
  };

  const handleDeleteHabit = (habit: any) => {
    console.log("Deleting habit:", habit);
    Alert.alert(
      "Delete Habit",
      `Are you sure you want to delete "${habit.habitName}"? This action cannot be undone.`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              // Optimistic delete: immediately remove from UI
              setOptimisticallyDeletedIds(prev => new Set(prev).add(habit.habitId));
              setDeletingHabitId(habit.habitId);

              const result = await deleteHabit(habit.habitId);
              if (result.success) {
                // Success - habit is already removed from UI
                console.log("Delete successful");
              } else {
                // Failed - restore the habit in UI
                setOptimisticallyDeletedIds(prev => {
                  const newSet = new Set(prev);
                  newSet.delete(habit.habitId);
                  return newSet;
                });

                Alert.alert(
                  "Error",
                  result.error || "Failed to delete habit"
                );
              }
            } catch {
              // Error - restore the habit in UI
              setOptimisticallyDeletedIds(prev => {
                const newSet = new Set(prev);
                newSet.delete(habit.habitId);
                return newSet;
              });

              Alert.alert(
                "Error",
                "An unexpected error occurred while deleting the habit"
              );
            } finally {
              // Clear loading state
              setDeletingHabitId(null);
            }
          },
        },
      ]
    );
  };

  // Render right action for swipeable
  const renderRightActions = (habit: any) => {
    console.log("Render right actions for habit:", habit.habitName);

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
              console.log("Delete button pressed for:", habit.habitName);
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
              <Text style={styles.deleteButtonText}>Delete</Text>
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
      <Swipeable
        renderRightActions={() => renderRightActions(item)}
        friction={2}
        rightThreshold={80}
        overshootRight={false}
      >
        <Animated.View
          entering={FadeInDown.delay(index * 100)}
          style={[
            styles.habitCard,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              borderWidth: 1,
              shadowColor: colors.shadow,
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
                      <Text style={styles.habitIcon}>{item.icon}</Text>
                    </View>
                  )}
                  <View style={styles.nameContainer}>
                    <Text style={[styles.habitName, { color: colors.text }]}>
                      {item.habitName}
                    </Text>
                    {isHabitExpired(item) && (
                      <View style={styles.expiredBadge}>
                        <Text style={styles.expiredBadgeText}>Ended</Text>
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
                {item.target.value} {item.target.unit} • {item.habitType}
              </Text>

              <View style={styles.timeRow}>
                <Ionicons
                  name="time-outline"
                  size={16}
                  color={colors.textSecondary}
                />
                <Text style={[styles.time, { color: colors.textSecondary }]}>
                  {item.frequency?.times ? item.frequency.times.join(", ") : "No reminders"}
                </Text>
                <Text style={[styles.nextReminder, { color: colors.primary }]}>
                  {item.frequency?.type === 'interval' ? 'Interval' : 'Daily'}
                </Text>
              </View>

              {item.frequency?.type === 'interval' && item.frequency?.specificDays && (
                <View style={styles.intervalDaysRow}>
                  <Ionicons
                    name="calendar-outline"
                    size={16}
                    color={colors.textSecondary}
                  />
                  <Text style={[styles.intervalDays, { color: colors.textSecondary }]}>
                    {item.frequency.specificDays?.map((day: number) => {
                      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                      return days[day] || day;
                    }).join(", ")}
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
                  <Text style={[styles.streakText, { color: colors.text }]}>
                    {item.streak} day streak
                  </Text>
                </View>
              </View>
            </View>
          </TouchableOpacity>
        </Animated.View>
      </Swipeable>
    </View>
  );

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
              style={[styles.modalHeader, { borderBottomColor: colors.border }]}
            >
              <TouchableOpacity
                onPress={() => setShowDetailModal(false)}
                style={styles.headerButton}
              >
                <Ionicons name="close-outline" size={24} color={colors.text} />
              </TouchableOpacity>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Habit Details
              </Text>
              <TouchableOpacity
                style={[styles.editButton, { backgroundColor: colors.primary }]}
                onPress={handleEditHabit}
              >
                <Ionicons name="create" size={16} color="#FFFFFF" />
                <Text style={styles.editButtonText}>Edit</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
              {/* Habit Overview Card */}
              <View style={[styles.detailCard, { backgroundColor: colors.backgroundSecondary }]}>
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
                      {selectedHabit && getHabitTypeLabel(selectedHabit.habitType)}
                    </Text>
                  </View>
                </View>

                {/* Quick Stats */}
                <View style={styles.quickStats}>
                  <View
                    style={[
                      styles.statItem,
                      { backgroundColor: colors.backgroundSecondary },
                    ]}
                  >
                    <Ionicons
                      name="at-outline"
                      size={20}
                      color={colors.primary}
                    />
                    <Text style={[styles.statText, { color: colors.text }]}>
                      {selectedHabit?.target.value} {selectedHabit?.target.unit}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.statItem,
                      { backgroundColor: colors.backgroundSecondary },
                    ]}
                  >
                    <Ionicons
                      name="flame-outline"
                      size={20}
                      color={colors.primary}
                    />
                    <Text style={[styles.statText, { color: colors.text }]}>
                      {selectedHabit?.streak} streak
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
                    Target
                  </Text>
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
                    Schedule
                  </Text>
                </View>
                <View style={styles.scheduleContent}>
                  <Text style={[styles.scheduleType, { color: colors.text }]}>
                    {selectedHabit?.frequency?.type === 'interval' ? 'Interval' : 'Daily'}
                  </Text>
                  <Text style={[styles.scheduleTimes, { color: colors.textSecondary }]}>
                    {selectedHabit?.frequency?.times ? selectedHabit.frequency.times.join(", ") : "No reminders"}
                  </Text>
                  {selectedHabit?.frequency?.type === 'interval' && selectedHabit?.frequency?.specificDays && (
                    <Text style={[styles.scheduleDays, { color: colors.textSecondary }]}>
                      Days: {selectedHabit.frequency?.specificDays?.map((day: number) => {
                        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                        return days[day] || day;
                      }).join(", ")}
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
                    Duration
                  </Text>
                </View>
                <View style={styles.durationContent}>
                  <View style={styles.durationItem}>
                    <Text style={[styles.durationLabel, { color: colors.textSecondary }]}>
                      Start Date
                    </Text>
                    <Text style={[styles.durationValue, { color: colors.text }]}>
                      {(() => {
                        // Try to get the start date from multiple sources
                        let startDate = selectedHabit?.startDate ||
                                       selectedHabit?.duration?.startDate ||
                                       selectedHabit?.createdAt;

                        if (!startDate) return 'Not set';

                        // Handle Firebase Timestamp
                        if (typeof startDate?.toDate === 'function') {
                          startDate = startDate.toDate();
                        }

                        const date = new Date(startDate);

                        // Check if date is valid
                        if (isNaN(date.getTime())) {
                          console.log('Invalid start date:', startDate);
                          return 'Invalid Date';
                        }

                        return date.toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        });
                      })()}
                    </Text>
                  </View>
                  {selectedHabit?.endDate || selectedHabit?.duration?.endDate ? (
                    <View style={styles.durationItem}>
                      <Text style={[styles.durationLabel, { color: colors.textSecondary }]}>
                        End Date
                      </Text>
                      <Text style={[styles.durationValue, { color: colors.text }]}>
                        {(() => {
                          const endDate = selectedHabit?.endDate || selectedHabit?.duration?.endDate;
                          if (!endDate) return 'No end date';

                          // Handle Firebase Timestamp
                          let date = endDate;
                          if (typeof endDate?.toDate === 'function') {
                            date = endDate.toDate();
                          }

                          const parsedDate = new Date(date);

                          // Check if date is valid
                          if (isNaN(parsedDate.getTime())) {
                            console.log('Invalid end date:', endDate);
                            return 'Invalid Date';
                          }

                          return parsedDate.toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric'
                          });
                        })()}
                      </Text>
                    </View>
                  ) : (
                    <View style={styles.durationItem}>
                      <Text style={[styles.durationValue, { color: colors.primary, fontStyle: 'italic' }]}>
                        Ongoing • No end date set
                      </Text>
                    </View>
                  )}
                  {selectedHabit?.duration?.totalDays && (
                    <View style={styles.durationItem}>
                      <Text style={[styles.durationLabel, { color: colors.textSecondary }]}>
                        Duration
                      </Text>
                      <Text style={[styles.durationValue, { color: colors.text }]}>
                        {selectedHabit.duration.totalDays} days
                      </Text>
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
                    Progress
                  </Text>
                </View>
                <View style={styles.progressContent}>
                  <View style={styles.progressItem}>
                    <Text
                      style={[styles.progressLabel, { color: colors.textSecondary }]}
                    >
                      Current Streak
                    </Text>
                    <Text style={[styles.progressValue, { color: colors.text }]}>
                      {selectedHabit?.streak} days
                    </Text>
                  </View>
                  <View style={styles.progressItem}>
                    <Text
                      style={[styles.progressLabel, { color: colors.textSecondary }]}
                    >
                      Best Streak
                    </Text>
                    <Text style={[styles.progressValue, { color: colors.text }]}>
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
                My Habits
              </Text>
              <View
                style={[styles.totalHabitsBadge, { backgroundColor: "#4ECDC4" }]}
              >
                <Text style={styles.totalHabitsText}>
                  {habits.length} Total Habit{habits.length !== 1 ? "s" : ""}
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
                  No Habits Yet!
                </Text>
                <Text
                  style={[
                    styles.emptyStateSubtitle,
                    { color: colors.textSecondary },
                  ]}
                >
                  You have {filteredHabits.length} habits setup. Kindly setup a
                  new one!
                </Text>
                <TouchableOpacity
                  style={[
                    styles.addHabitButton,
                    { backgroundColor: colors.primary },
                  ]}
                  onPress={() => router.push("/habits/create-step1")}
                >
                  <Ionicons name="add" size={20} color="#FFFFFF" />
                  <Text style={styles.addHabitButtonText}>Add Habit</Text>
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
          style={[styles.floatingActionButton, { backgroundColor: "#4ECDC4" }]}
          onPress={() => router.push("/habits/create-step1")}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={28} color="#FFFFFF" />
        </TouchableOpacity>
      )}

      {/* Detail Modal */}
      {renderDetailModal()}
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
  cardWrapper: {
    marginBottom: 12,
    borderRadius: 12,
    overflow: "hidden",
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