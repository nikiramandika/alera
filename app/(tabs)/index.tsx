import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import Animated from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';
import { useMedicine } from '@/contexts/MedicineContext';
import { useHabit } from '@/contexts/HabitContext';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { medicines, medicineHistory } = useMedicine();
  const { habits, habitHistory } = useHabit();

  // Calendar state
  const [currentWeekOffset, setCurrentWeekOffset] = useState(0);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [calendarDays, setCalendarDays] = useState<any[]>([]);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);

  // Generate calendar days and tasks
  useEffect(() => {
    const getWeekDays = (offset = 0, year = selectedYear) => {
      const today = new Date();
      const startOfWeek = new Date(year, today.getMonth(), today.getDate());
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay() + (offset * 7));
      startOfWeek.setHours(0, 0, 0, 0);

      const days = [];
      for (let i = 0; i < 7; i++) {
        const date = new Date(startOfWeek);
        date.setDate(startOfWeek.getDate() + i);
        const isToday = date.toDateString() === today.toDateString();

        days.push({
          date: date,
          dayName: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][i],
          dayNumber: date.getDate(),
          month: date.getMonth(),
          year: date.getFullYear(),
          isToday: isToday,
          weekOffset: offset,
          isSelected: date.toDateString() === selectedDate.toDateString()
        });
      }
      return days;
    };

    const days = getWeekDays(currentWeekOffset, selectedYear);
    const daysWithTasks = days.map(day => {
      const dayStart = new Date(day.date);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayStart.getDate() + 1);

      // Get medicines for this day
      const dayMedicines = medicines.filter(medicine => {
        if (medicine.frequency.type === 'daily') return true;
        if (medicine.frequency.type === 'specific_days') {
          return medicine.frequency.specificDays?.includes(day.date.getDay());
        }
        return false;
      });

      // Get habits for this day
      const dayHabits = habits.filter(habit => {
        if (!habit.isActive) return false;
        return true; // Simplified - assume habits are daily
      });

      return {
        ...day,
        medicines: dayMedicines,
        habits: dayHabits,
        completedMedicines: medicineHistory.filter(history =>
          history.status === 'taken' &&
          new Date(history.scheduledTime) >= dayStart &&
          new Date(history.scheduledTime) < dayEnd
        ).length,
        completedHabits: habitHistory.filter(history =>
          history.completed &&
          new Date(history.date) >= dayStart &&
          new Date(history.date) < dayEnd
        ).length
      };
    });
    setCalendarDays(daysWithTasks);
  }, [currentWeekOffset, selectedYear, medicines, habits, medicineHistory, habitHistory, selectedDate]);

  
  // Get time-based greeting
  const currentHour = new Date().getHours();
  const getGreeting = () => {
    if (currentHour < 12) return 'Good Morning';
    if (currentHour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  // Helper functions for calendar display
  const getWeekDisplayText = () => {
    if (currentWeekOffset === 0) return 'This Week';
    if (currentWeekOffset === 1) return 'Next Week';
    if (currentWeekOffset === -1) return 'Last Week';
    if (currentWeekOffset > 0) return ${currentWeekOffset} Weeks Ahead;
    return ${Math.abs(currentWeekOffset)} Weeks Ago;
  };

  const getMonthYearText = () => {
    if (calendarDays.length === 0) return '';
    const firstDay = calendarDays[0].date;
    const lastDay = calendarDays[calendarDays.length - 1].date;
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    if (firstDay.getMonth() === lastDay.getMonth()) {
      return ${monthNames[firstDay.getMonth()]} ${firstDay.getFullYear()};
    } else {
      return ${monthNames[firstDay.getMonth()]} - ${monthNames[lastDay.getMonth()]} ${firstDay.getFullYear()};
    }
  };

  // Get selected date tasks
  const getSelectedDateTasks = () => {
    const selectedDay = calendarDays.find(day => day.isSelected);
    if (!selectedDay) return null;
    return selectedDay;
  };

  // Handle date selection
  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
  };

  // Year navigation
  const changeYear = (direction: number) => {
    setSelectedYear(prev => prev + direction);
  };

  
  // Search functionality
  const handleSearch = (query: string) => {
    setSearchQuery(query);

    if (query.trim() === '') {
      setSearchResults([]);
      return;
    }

    const lowerQuery = query.toLowerCase();
    const results: any[] = [];

    // Search medicines
    medicines.forEach(medicine => {
      if (
        medicine.medicineName.toLowerCase().includes(lowerQuery) ||
        medicine.dosage.toLowerCase().includes(lowerQuery) ||
        medicine.instructions?.toLowerCase().includes(lowerQuery)
      ) {
        results.push({
          type: 'medicine',
          id: medicine.reminderId,
          title: medicine.medicineName,
          subtitle: ${medicine.dosage} • ${medicine.medicineType},
          data: medicine,
          icon: 'medical-outline',
          color: medicine.color,
        });
      }
    });

    // Search habits
    habits.forEach(habit => {
      if (
        habit.habitName.toLowerCase().includes(lowerQuery) ||
        habit.description?.toLowerCase().includes(lowerQuery)
      ) {
        results.push({
          type: 'habit',
          id: habit.habitId,
          title: habit.habitName,
          subtitle: ${habit.target.value} ${habit.target.unit} per ${habit.target.frequency},
          data: habit,
          icon: 'repeat-outline',
          color: habit.color,
        });
      }
    });

    setSearchResults(results);
  };

  const handleSearchResultPress = (result: any) => {
    setShowSearchModal(false);
    if (result.type === 'medicine') {
      router.push('/(tabs)/medication');
    } else if (result.type === 'habit') {
      router.push('/(tabs)/habits');
    }
  };

return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />


      <ScrollView
      style={styles.scrollView}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
    >
      <View style={styles.mainContainer}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
          <View style={styles.headerContent}>
            <View style={styles.greetingSection}>
              <Text style={[styles.greeting, { color: colors.textSecondary }]}>
                {getGreeting()}
              </Text>
              <Text style={[styles.userName, { color: colors.text }]}>
                Hello, User! 👋
              </Text>
            </View>
            <View style={styles.headerActions}>
              <TouchableOpacity
                style={styles.searchButton}
                onPress={() => setShowSearchModal(true)}
              >
                <Ionicons name="search" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
              <View style={styles.headerLogo}>
                <Image
                  source={require("@/assets/images/aleraLogo.png")}
                  style={styles.logoIcon}
                  contentFit="contain"
                />
              </View>
            </View>
          </View>
        </View>

        {/* Calendar - Main Content */}
          <View style={[styles.calendarMain, { backgroundColor: colors.background }]}>

            {/* Compact Navigation Bar */}
            <View style={[styles.compactNavigation, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>

              {/* Year Picker */}
              <View style={styles.compactYearPicker}>
                <TouchableOpacity
                  onPress={() => changeYear(-1)}
                  style={[
                    styles.compactNavButton,
                    { opacity: selectedYear <= new Date().getFullYear() - 5 ? 0.4 : 1 }
                  ]}
                  disabled={selectedYear <= new Date().getFullYear() - 5}
                >
                  <Ionicons name="chevron-back" size={16} color={colors.primary} />
                </TouchableOpacity>
                <Text style={[styles.compactYearText, { color: colors.text }]}>{selectedYear}</Text>
                <TouchableOpacity
                  onPress={() => changeYear(1)}
                  style={[
                    styles.compactNavButton,
                    { opacity: selectedYear >= new Date().getFullYear() + 5 ? 0.4 : 1 }
                  ]}
                  disabled={selectedYear >= new Date().getFullYear() + 5}
                >
                  <Ionicons name="chevron-forward" size={16} color={colors.primary} />
                </TouchableOpacity>
              </View>

              {/* Week Picker */}
              <View style={styles.compactWeekPicker}>
                <TouchableOpacity
                  onPress={() => setCurrentWeekOffset(prev => Math.max(prev - 1, -12))}
                  style={[
                    styles.compactNavButton,
                    { opacity: currentWeekOffset <= -12 ? 0.4 : 1 }
                  ]}
                  disabled={currentWeekOffset <= -12}
                >
                  <Ionicons name="chevron-back" size={16} color={colors.primary} />
                </TouchableOpacity>
                <View style={styles.compactWeekInfo}>
                  <Text style={[styles.compactWeekText, { color: colors.text }]}>{getWeekDisplayText()}</Text>
                  <Text style={[styles.compactMonthText, { color: colors.textSecondary }]}>{getMonthYearText()}</Text>
                </View>
                <TouchableOpacity
                  onPress={() => setCurrentWeekOffset(prev => Math.min(prev + 1, 12))}
                  style={[
                    styles.compactNavButton,
                    { opacity: currentWeekOffset >= 12 ? 0.4 : 1 }
                  ]}
                  disabled={currentWeekOffset >= 12}
                >
                  <Ionicons name="chevron-forward" size={16} color={colors.primary} />
                </TouchableOpacity>
              </View>

              {/* Today Button */}
              <TouchableOpacity
                onPress={() => {
                  setCurrentWeekOffset(0);
                  setSelectedYear(new Date().getFullYear());
                  setSelectedDate(new Date());
                }}
                style={[styles.compactTodayButton, { backgroundColor: colors.primary }]}
              >
                <Ionicons name="today" size={14} color="white" />
              </TouchableOpacity>
            </View>

            {/* Date Selector - Small Cards */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.dateScrollContainer}
            >
              {calendarDays.map((day, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.dateCard,
                    {
                      backgroundColor: day.isToday ? colors.primary + '15' :
                                     day.isSelected ? colors.primary + '10' : colors.card,
                      borderColor: day.isToday ? colors.primary :
                                 day.isSelected ? colors.primary : colors.border,
                      borderWidth: (day.isToday || day.isSelected) ? 2 : 1,
                    }
                  ]}
                  onPress={() => handleDateSelect(day.date)}
                >
                  <Text style={[
                    styles.dateDayName,
                    { color: day.isToday ? colors.primary : colors.textSecondary }
                  ]}>
                    {day.dayName}
                  </Text>
                  <Text style={[
                    styles.dateDayNumber,
                    {
                      color: day.isToday ? colors.primary :
                             day.isSelected ? colors.primary : colors.text,
                      fontWeight: (day.isToday || day.isSelected) ? '700' : '600'
                    }
                  ]}>
                    {day.dayNumber}
                  </Text>
                  {(day.medicines.length > 0 || day.habits.length > 0) && (
                    <View style={styles.dateTaskDots}>
                      {day.medicines.length > 0 && (
                        <View style={[styles.dateDot, { backgroundColor: colors.primary }]} />
                      )}
                      {day.habits.length > 0 && (
                        <View style={[styles.dateDot, { backgroundColor: colors.accent }]} />
                      )}
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Selected Date Tasks */}
            <View style={styles.tasksContainer}>
              {(() => {
                const selectedDay = getSelectedDateTasks();
                if (!selectedDay) return null;

                const totalTasks = selectedDay.medicines.length + selectedDay.habits.length;
                const completedTasks = selectedDay.completedMedicines + selectedDay.completedHabits;
                const progressPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

                return (
                  <View style={[styles.tasksCard, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}>
                    <View style={styles.tasksHeader}>
                      <Text style={[styles.tasksDate, { color: colors.text }]}>
                        {selectedDay.date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                      </Text>
                      {selectedDay.isToday && (
                        <View style={[styles.todayBadge, { backgroundColor: colors.primary }]}>
                          <Text style={[styles.todayBadgeText, { color: 'white' }]}>Today</Text>
                        </View>
                      )}
                    </View>

                    {totalTasks > 0 ? (
                      <>
                        {/* Progress Overview */}
                        <View style={styles.progressOverview}>
                          <View style={styles.progressInfo}>
                            <Text style={[styles.progressLabel, { color: colors.textSecondary }]}>
                              Daily Progress
                            </Text>
                            <Text style={[styles.progressPercentage, { color: colors.primary }]}>
                              {progressPercentage}%
                            </Text>
                          </View>
                          <View style={[styles.progressBarLarge, { backgroundColor: colors.backgroundSecondary }]}>
                            <View
                              style={[
                                styles.progressFill,
                                {
                                  width: ${progressPercentage}%,
                                  backgroundColor: colors.primary
                                }
                              ]}
                            />
                          </View>
                        </View>

                        {/* Medicine Tasks */}
                        {selectedDay.medicines.length > 0 && (
                          <View style={styles.taskSectionLarge}>
                            <View style={styles.taskHeader}>
                              <Ionicons name="medical-outline" size={16} color={colors.primary} />
                              <Text style={[styles.taskTitle, { color: colors.text }]}>
                                Medications ({selectedDay.completedMedicines}/{selectedDay.medicines.length})
                              </Text>
                            </View>
                            <View style={styles.taskItems}>
                              {selectedDay.medicines.map((medicine: any, medIdx: number) => (
                                <View key={medIdx} style={[styles.taskItemLarge, { borderBottomColor: colors.border }]}>
                                  <View
                                    style={[
                                      styles.taskStatusDot,
                                      {
                                        backgroundColor: colors.primary,
                                        opacity: medIdx < selectedDay.completedMedicines ? 0.4 : 1
                                      }
                                    ]}
                                  />
                                  <View style={styles.taskDetails}>
                                    <Text style={[
                                      styles.taskName,
                                      {
                                        color: colors.text,
                                        opacity: medIdx < selectedDay.completedMedicines ? 0.5 : 1,
                                        textDecorationLine: medIdx < selectedDay.completedMedicines ? 'line-through' : 'none'
                                      }
                                    ]}>
                                      {medicine.medicineName}
                                    </Text>
                                    <Text style={[styles.taskDosage, { color: colors.textSecondary }]}>
                                      {medicine.dosage} - {medicine.medicineType}
                                    </Text>
                                  </View>
                                  <View style={styles.taskStatus}>
                                    {medIdx < selectedDay.completedMedicines ? (
                                      <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                                    ) : (
                                      <Ionicons name="radio-button-off" size={20} color={colors.textSecondary} />
                                    )}
                                  </View>
                                </View>
                              ))}
                            </View>
                          </View>
                        )}

                        {/* Habit Tasks */}
                        {selectedDay.habits.length > 0 && (
                          <View style={styles.taskSectionLarge}>
                            <View style={styles.taskHeader}>
                              <Ionicons name="repeat-outline" size={16} color={colors.accent} />
                              <Text style={[styles.taskTitle, { color: colors.text }]}>
                                Habits ({selectedDay.completedHabits}/{selectedDay.habits.length})
                              </Text>
                            </View>
                            <View style={styles.taskItems}>
                              {selectedDay.habits.map((habit: any, habitIdx: number) => (
                                <View key={habitIdx} style={[styles.taskItemLarge, { borderBottomColor: colors.border }]}>
                                  <View
                                    style={[
                                      styles.taskStatusDot,
                                      {
                                        backgroundColor: colors.accent,
                                        opacity: habitIdx < selectedDay.completedHabits ? 0.4 : 1
                                      }
                                    ]}
                                  />
                                  <View style={styles.taskDetails}>
                                    <Text style={[
                                      styles.taskName,
                                      {
                                        color: colors.text,
                                        opacity: habitIdx < selectedDay.completedHabits ? 0.5 : 1,
                                        textDecorationLine: habitIdx < selectedDay.completedHabits ? 'line-through' : 'none'
                                      }
                                    ]}>
                                      {habit.habitName}
                                    </Text>
                                    <Text style={[styles.taskDosage, { color: colors.textSecondary }]}>
                                      {habit.target.value} {habit.target.unit} per {habit.target.frequency}
                                    </Text>
                                  </View>
                                  <View style={styles.taskStatus}>
                                    {habitIdx < selectedDay.completedHabits ? (
                                      <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                                    ) : (
                                      <Ionicons name="radio-button-off" size={20} color={colors.textSecondary} />
                                    )}
                                  </View>
                                </View>
                              ))}
                            </View>
                          </View>
                        )}
                      </>
                    ) : (
                      <View style={styles.emptyTasksState}>
                        <Ionicons name="checkmark-circle-outline" size={48} color={colors.textSecondary} />
                        <Text style={[styles.emptyTasksTitle, { color: colors.text }]}>
                          No tasks scheduled
                        </Text>
                        <Text style={[styles.emptyTasksSubtitle, { color: colors.textSecondary }]}>
                          Enjoy your free day!
                        </Text>
                      </View>
                    )}
                  </View>
                );
              })()}
            </View>

            {/* Weekly Summary */}
            <View style={[styles.weeklySummary, { borderTopColor: colors.border, backgroundColor: colors.card }]}>
              <Text style={[styles.summaryTitle, { color: colors.text }]}>
                Week Summary
              </Text>
              <View style={styles.summaryStats}>
                <View style={styles.summaryStat}>
                  <View style={[styles.statIconLarge, { backgroundColor: colors.primary + '20' }]}>
                    <Ionicons name="medical-outline" size={20} color={colors.primary} />
                  </View>
                  <Text style={[styles.statNumber, { color: colors.text }]}>
                    {calendarDays.reduce((sum, day) => sum + day.medicines.length, 0)}
                  </Text>
                  <Text style={[styles.summaryStatLabel, { color: colors.textSecondary }]}>
                    Medications
                  </Text>
                </View>
                <View style={styles.summaryStat}>
                  <View style={[styles.statIconLarge, { backgroundColor: colors.accent + '20' }]}>
                    <Ionicons name="repeat-outline" size={20} color={colors.accent} />
                  </View>
                  <Text style={[styles.statNumber, { color: colors.text }]}>
                    {calendarDays.reduce((sum, day) => sum + day.habits.length, 0)}
                  </Text>
                  <Text style={[styles.summaryStatLabel, { color: colors.textSecondary }]}>
                    Habits
                  </Text>
                </View>
                <View style={styles.summaryStat}>
                  <View style={[styles.statIconLarge, { backgroundColor: colors.success + '20' }]}>
                    <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                  </View>
                  <Text style={[styles.statNumber, { color: colors.text }]}>
                    {calendarDays.reduce((sum, day) => sum + day.completedMedicines + day.completedHabits, 0)}
                  </Text>
                  <Text style={[styles.summaryStatLabel, { color: colors.textSecondary }]}>
                    Completed
                  </Text>
                </View>
              </View>
            </View>
          </View>
      </View>
    </ScrollView>

      {/* Search Modal */}
      <Modal
        visible={showSearchModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowSearchModal(false)}
      >
        <BlurView
          intensity={100}
          tint={colorScheme === 'dark' ? 'dark' : 'light'}
          style={styles.searchModalOverlay}
        >
          <SafeAreaView style={[styles.searchModalContainer, { backgroundColor: colors.background }]}>
            <View style={styles.searchModalHeader}>
              <TouchableOpacity onPress={() => setShowSearchModal(false)}>
                <Ionicons name="close-outline" size={24} color={colors.text} />
              </TouchableOpacity>
              <Text style={[styles.searchModalTitle, { color: colors.text }]}>
                Search
              </Text>
              <View style={{ width: 24 }} />
            </View>

            {/* Search Input */}
            <View style={styles.searchInputContainer}>
              <Ionicons name="search" size={20} color={colors.textSecondary} />
              <TextInput
                style={[styles.searchInput, { color: colors.text }]}
                placeholder="Search medicines or habits..."
                placeholderTextColor={colors.textSecondary}
                value={searchQuery}
                onChangeText={handleSearch}
                autoFocus
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => handleSearch('')}>
                  <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
                </TouchableOpacity>
              )}
            </View>

            {/* Search Results */}
            <ScrollView style={styles.searchResultsContainer} showsVerticalScrollIndicator={false}>
              {searchResults.length === 0 && searchQuery.length > 0 && (
                <View style={styles.noResultsContainer}>
                  <Ionicons name="search" size={48} color={colors.textSecondary} />
                  <Text style={[styles.noResultsText, { color: colors.textSecondary }]}>
                    No results found
                  </Text>
                  <Text style={[styles.noResultsSubtext, { color: colors.textSecondary }]}>
                    Try searching with different keywords
                  </Text>
                </View>
              )}

              {searchResults.map((result) => (
                <TouchableOpacity
                  key={result.id}
                  style={[styles.searchResultItem, { backgroundColor: colors.card }]}
                  onPress={() => handleSearchResultPress(result)}
                >
                  <View style={[styles.resultIconContainer, { backgroundColor: result.color + '20' }]}>
                    <Ionicons name={result.icon as any} size={20} color={result.color} />
                  </View>
                  <View style={styles.resultInfo}>
                    <Text style={[styles.resultTitle, { color: colors.text }]}>
                      {result.title}
                    </Text>
                    <Text style={[styles.resultSubtitle, { color: colors.textSecondary }]}>
                      {result.subtitle}
                    </Text>
                  </View>
                  <View style={styles.resultTypeContainer}>
                    <Text style={[
                      styles.resultType,
                      {
                        color: result.type === 'medicine' ? colors.primary : colors.secondary,
                        backgroundColor: result.type === 'medicine' ? colors.primary + '20' : colors.secondary + '20',
                      }
                    ]}>
                      {result.type}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </SafeAreaView>
        </BlurView>
      </Modal>

      {/* Blur Safe Area Overlay */}
      <Animated.View style={styles.blurOverlay}>
        <BlurView
          intensity={80}
          tint={colorScheme === 'dark' ? 'dark' : 'light'}
          style={styles.blurView}
        />
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  mainContainer: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  header: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stickyHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
  },
  blurOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 44, // Status bar height approximation
    zIndex: 99,
  },
  blurView: {
    flex: 1,
  },
  headerContainer: {
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    overflow: 'hidden',
    elevation: Platform.OS === 'android' ? 8 : 0,
  },
  headerGradient: {
    paddingTop: 16,
    paddingBottom: 32,
    paddingHorizontal: 24,
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
  oldHeaderContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  greetingSection: {
    flex: 1,
  },
  greeting: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000',
    ...Platform.select({
      ios: {
        fontFamily: 'SF Pro Display',
      }
    })
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  headerLogo: {
    width: 48,
    height: 48,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoIcon: {
    width: 32,
    height: 32,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  statCard: {
    flex: 1,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
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
  statIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  progressContainer: {
    marginBottom: 8,
    alignItems: 'center',
  },
  progressBar: {
    width: '100%',
    height: 4,
    backgroundColor: '#E5E5E7',
    borderRadius: 2,
    overflow: 'hidden',
    marginVertical: 4,
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressPercent: {
    fontSize: 10,
    color: '#666',
    marginTop: 2,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  sectionContainer: {
    paddingHorizontal: 24,
    marginTop: 24,
  },
  healthTipCard: {
    borderRadius: 16,
    padding: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      }
    })
  },
  healthTipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  healthTipIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  healthTipTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  healthTipContent: {
    fontSize: 14,
    lineHeight: 20,
  },
  sectionTitle: {
    fontSize: 20,
    marginBottom: 16,
    fontWeight: '700',
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  featureCard: {
    width: (width - 60) / 2, // Two columns with gap
    marginBottom: 8,
  },
  featureCardContent: {
    borderRadius: 16,
    padding: 16,
    height: 160, // Fixed height for consistency
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
  featureIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: 'rgba(244, 123, 159, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  featureIcon: {
    fontSize: 28,
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
    minHeight: 20, // Consistent height for titles
  },
  featureDescription: {
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 12,
    minHeight: 32, // Consistent height for descriptions
  },
  featureArrow: {
    position: 'absolute',
    bottom: 16,
    right: 16,
  },
  arrowText: {
    fontSize: 18,
    fontWeight: '300',
  },
  motivationCard: {
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
  },
  motivationQuote: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 8,
    fontStyle: 'italic',
  },
  motivationAuthor: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  footerSpace: {
    height: 64,
  },
  searchModalOverlay: {
    flex: 1,
  },
  searchModalContainer: {
    flex: 1,
  },
  searchModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E7',
  },
  searchModalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: Spacing.md,
    margin: Spacing.lg,
    marginBottom: Spacing.md,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    marginLeft: Spacing.sm,
  },
  searchResultsContainer: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
  },
  noResultsContainer: {
    alignItems: 'center',
    padding: Spacing.xl,
  },
  noResultsText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  noResultsSubtext: {
    fontSize: 14,
    textAlign: 'center',
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
  },
  resultIconContainer: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  resultInfo: {
    flex: 1,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  resultSubtitle: {
    fontSize: 14,
  },
  resultTypeContainer: {
    alignItems: 'center',
  },
  resultType: {
    fontSize: 12,
    fontWeight: '600',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  // Calendar Widget Styles
  calendarCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      }
    })
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  navButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  calendarTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  calendarContent: {
    flex: 1,
  },
  weekDaysContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  dayCard: {
    flex: 1,
    alignItems: 'center',
    padding: 8,
    marginHorizontal: 2,
    borderRadius: 12,
    borderWidth: 1,
    minHeight: 100,
    justifyContent: 'flex-start',
  },
  dayName: {
    fontSize: 10,
    fontWeight: '500',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  dayNumber: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  taskIndicators: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  taskDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  moreIndicator: {
    fontSize: 8,
    fontWeight: '500',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 8,
    fontWeight: '500',
    textAlign: 'center',
    opacity: 0.6,
  },
  taskSummary: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  summaryText: {
    fontSize: 12,
    fontWeight: '500',
  },
  summaryCount: {
    fontSize: 12,
    fontWeight: '600',
  },
  // Calendar-Focused Styles
  calendarMain: {
    flex: 1,
  },
  weekNavigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  navButtonLarge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  weekInfo: {
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 16,
  },
  weekTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 2,
  },
  monthYear: {
    fontSize: 14,
    fontWeight: '500',
  },
  weekScrollContainer: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    gap: 12,
  },
  dayCardLarge: {
    width: 200,
    borderRadius: 16,
    padding: 16,
    marginRight: 12,
    minHeight: 300,
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
  dayHeader: {
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  dayNameLarge: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  dayNumberLarge: {
    fontSize: 18,
    fontWeight: '700',
  },
  taskSection: {
    flex: 1,
    gap: 12,
  },
  taskGroup: {
    gap: 8,
  },
  taskGroupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  taskGroupTitle: {
    fontSize: 12,
    fontWeight: '600',
  },
  taskList: {
    gap: 6,
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  taskIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  taskText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '500',
  },
  moreTasksText: {
    fontSize: 10,
    fontWeight: '500',
    fontStyle: 'italic',
  },
  emptyDayState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    opacity: 0.6,
  },
  emptyDayText: {
    fontSize: 14,
    fontWeight: '600',
  },
  emptyDaySubtext: {
    fontSize: 12,
    fontWeight: '500',
  },
  dayProgress: {
    marginTop: 12,
    gap: 6,
  },
  progressDayBar: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFillLarge: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
  },
  weeklySummary: {
    marginHorizontal: 20,
    marginBottom: 24,
    padding: 20,
    borderRadius: 16,
    borderTopWidth: 0,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      }
    })
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 16,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: 16,
  },
  summaryStat: {
    alignItems: 'center',
    flex: 1,
    paddingVertical: 6,
  },
  statIconLarge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  summaryStatLabel: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  // Compact Navigation Styles
  compactNavigation: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    marginBottom: 12,
    gap: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      }
    })
  },

  // Compact Year Picker
  compactYearPicker: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  compactNavButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.03)',
  },
  compactYearText: {
    fontSize: 16,
    fontWeight: '700',
    minWidth: 60,
    textAlign: 'center',
  },

  // Compact Week Picker
  compactWeekPicker: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 8,
  },
  compactWeekInfo: {
    flex: 1,
    alignItems: 'center',
  },
  compactWeekText: {
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  compactMonthText: {
    fontSize: 11,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 2,
  },

  // Compact Today Button
  compactTodayButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateScrollContainer: {
    paddingHorizontal: 20,
    paddingVertical: 6,
    gap: 8,
  },
  dateCard: {
    width: 70,
    height: 80,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    borderWidth: 1.5,
    position: 'relative',
    gap: 2,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 3,
      },
      android: {
        elevation: 2,
      }
    })
  },
  dateDayName: {
    fontSize: 9,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  dateDayNumber: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  dateTaskDots: {
    flexDirection: 'row',
    gap: 2,
    position: 'absolute',
    bottom: 6,
  },
  dateDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  tasksContainer: {
    flex: 1,
    marginTop: 24,
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  tasksCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      }
    })
  },
  tasksHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.06)',
  },
  tasksDate: {
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
    letterSpacing: -0.3,
  },
  todayBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  todayBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  progressOverview: {
    marginBottom: 24,
    gap: 8,
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  progressPercentage: {
    fontSize: 14,
    fontWeight: '700',
  },
  progressBarLarge: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  taskSectionLarge: {
    marginBottom: 24,
  },
  taskHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  taskTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  taskItems: {
    gap: 12,
  },
  taskItemLarge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  taskStatusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  taskDetails: {
    flex: 1,
    gap: 2,
  },
  taskName: {
    fontSize: 14,
    fontWeight: '600',
  },
  taskDosage: {
    fontSize: 12,
    fontWeight: '500',
  },
  taskStatus: {
    alignItems: 'center',
  },
  emptyTasksState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  emptyTasksTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  emptyTasksSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    opacity: 0.7,
  },
});