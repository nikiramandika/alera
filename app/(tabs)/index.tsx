import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Modal,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
  FadeInDown,
} from 'react-native-reanimated';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';

interface Task {
  id: string;
  title: string;
  subtitle: string;
  time: string;
  completed: boolean;
  icon: string;
  color: string;
}

export default function HomeScreen() {
  const [showCalendar, setShowCalendar] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

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
  const cardAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: cardTranslateY.value }]
  }));

  // Sample tasks data
  const tasks: {
    overdue: Task[];
    allDay: Task[];
    timeBased: { [time: string]: Task[] };
  } = {
    overdue: [
      {
        id: 'vitamin-d',
        title: 'niki ganteng',
        subtitle: '1 tablet • Daily reminder',
        time: 'All Day',
        completed: false,
        icon: 'medical-outline',
        color: '#84CC16'
      },
      {
        id: 'morning-meds',
        title: 'Morning Medication',
        subtitle: '2 tablets • Should have been taken',
        time: '8:00 AM',
        completed: false,
        icon: 'medical-outline',
        color: '#F43F5E'
      }
    ],
    allDay: [
      {
        id: 'vitamin-d',
        title: 'Vitamin D Supplement',
        subtitle: '1 tablet • Daily reminder',
        time: 'All Day',
        completed: false,
        icon: 'medical-outline',
        color: '#84CC16'
      },
      {
        id: 'drink-water',
        title: 'Drink Water',
        subtitle: '8 glasses • Daily goal',
        time: 'All Day',
        completed: true,
        icon: 'water-outline',
        color: '#84CC16'
      }
    ],
    timeBased: {
      '6:00 AM': [
        {
          id: 'morning-walk',
          title: 'Morning Walk',
          subtitle: '30 minutes',
          time: '6:00 AM',
          completed: true,
          icon: 'walk-outline',
          color: '#84CC16'
        }
      ],
      '8:00 AM': [
        {
          id: 'morning-meds',
          title: 'Morning Medication',
          subtitle: '2 tablets',
          time: '8:00 AM',
          completed: true,
          icon: 'medical-outline',
          color: '#84CC16'
        }
      ],
      '9:00 AM': [
        {
          id: 'exercise',
          title: 'Exercise',
          subtitle: '30 minutes workout',
          time: '9:00 AM',
          completed: false,
          icon: 'fitness-outline',
          color: '#84CC16'
        }
      ],
      '12:00 PM': [
        {
          id: 'lunch-meds',
          title: 'Lunch Medication',
          subtitle: '1 tablet with food',
          time: '12:00 PM',
          completed: false,
          icon: 'medical-outline',
          color: '#84CC16'
        }
      ],
      '2:00 PM': [
        {
          id: 'afternoon-meds',
          title: 'Afternoon Medication',
          subtitle: '1 tablet',
          time: '2:00 PM',
          completed: false,
          icon: 'medical-outline',
          color: '#84CC16'
        }
      ],
      '6:00 PM': [
        {
          id: 'reading-time',
          title: 'Reading Time',
          subtitle: '30 minutes',
          time: '6:00 PM',
          completed: false,
          icon: 'book-outline',
          color: '#84CC16'
        }
      ],
      '8:00 PM': [
        {
          id: 'evening-meds',
          title: 'Evening Medication',
          subtitle: '2 tablets',
          time: '8:00 PM',
          completed: false,
          icon: 'medical-outline',
          color: '#84CC16'
        }
      ],
      '9:00 PM': [
        {
          id: 'wind-down',
          title: 'Wind Down Routine',
          subtitle: 'Meditation & sleep prep',
          time: '9:00 PM',
          completed: false,
          icon: 'bed-outline',
          color: '#84CC16'
        }
      ],
      '10:00 AM': [
        {
          id: 'check-emails',
          title: 'Check Emails',
          subtitle: 'Important messages only',
          time: '10:00 AM',
          completed: false,
          icon: 'mail-outline',
          color: '#84CC16'
        }
      ]
    }
  };

  // Filter tasks based on search query (for search modal only)
  const filteredTasks = {
    overdue: tasks.overdue.filter(task =>
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.subtitle.toLowerCase().includes(searchQuery.toLowerCase())
    ),
    allDay: tasks.allDay.filter(task =>
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.subtitle.toLowerCase().includes(searchQuery.toLowerCase())
    ),
    timeBased: Object.fromEntries(
      Object.entries(tasks.timeBased).map(([time, taskList]) => [
        time,
        taskList.filter(task =>
          task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          task.subtitle.toLowerCase().includes(searchQuery.toLowerCase())
        )
      ]).filter(([_, taskList]) => taskList.length > 0)
    ) as { [time: string]: Task[] }
  };

  // Clear search when modal closes
  const handleCloseSearch = () => {
    setSearchQuery('');
    setShowSearch(false);
  };

  // Get task counts
  const getTaskCount = (tasks: Task[]) => tasks.length;

  // Calendar navigation functions
  const previousMonth = () => {
    setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1));
  };

  const nextMonth = () => {
    setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1));
  };

  const changeYear = (year: number) => {
    setCalendarMonth(new Date(year, calendarMonth.getMonth()));
  };

  const changeMonth = (month: number) => {
    setCalendarMonth(new Date(calendarMonth.getFullYear(), month));
  };

  // Generate calendar days (3 days backward + today + 3 days forward)
  const generateCalendarDays = () => {
    const today = new Date();
    const days = [];
    const startOffset = -3; // 3 days before today

    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + startOffset + i);
      const isToday = date.toDateString() === today.toDateString();
      const isSelected = date.toDateString() === selectedDate.toDateString();

      days.push({
        date: date,
        dayNumber: date.getDate(),
        dayName: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getDay()],
        isToday,
        isSelected
      });
    }
    return days;
  };

  const calendarDays = generateCalendarDays();

  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} backgroundColor={colors.background} />

      {/* Search Modal */}
      <Modal
        visible={showSearch}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setShowSearch(false)}
      >
        <SafeAreaView style={[styles.searchModalContainer, { backgroundColor: colors.background }]}>
          <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />

          <View style={styles.searchModalHeader}>
            <TouchableOpacity onPress={handleCloseSearch}>
              <Ionicons name="chevron-down" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.searchModalTitle, { color: colors.text }]}>Search Tasks</Text>
            <TouchableOpacity onPress={handleCloseSearch}>
              <Text style={[styles.searchModalCancel, { color: colors.primary }]}>Cancel</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.searchModalContent}>
            <View style={[styles.searchInputContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Ionicons name="search" size={20} color={colors.textSecondary} />
              <TextInput
                style={[styles.searchInput, { color: colors.text }]}
                placeholder="Search tasks..."
                placeholderTextColor={colors.textSecondary}
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoFocus
                clearButtonMode="while-editing"
              />
            </View>

            {searchQuery.length > 0 && (
              <View style={styles.searchResultsSection}>
                <Text style={[styles.searchResultsTitle, { color: colors.textSecondary }]}>
                  Search Results for &quot;{searchQuery}&quot;
                </Text>

                {getTaskCount(filteredTasks.overdue) === 0 &&
                 getTaskCount(filteredTasks.allDay) === 0 &&
                 Object.keys(filteredTasks.timeBased).length === 0 ? (
                  <View style={styles.noResultsContainer}>
                    <Ionicons name="search-outline" size={48} color={colors.textSecondary} />
                    <Text style={[styles.noResultsText, { color: colors.text }]}>No results found</Text>
                    <Text style={[styles.noResultsSubtext, { color: colors.textSecondary }]}>
                      Try different keywords
                    </Text>
                  </View>
                ) : (
                  <ScrollView
                    style={styles.searchResultsScroll}
                    showsVerticalScrollIndicator={false}
                  >
                    {/* Overdue Tasks */}
                    {getTaskCount(filteredTasks.overdue) > 0 && (
                      <View style={styles.searchTaskSection}>
                        <View style={styles.searchSectionHeader}>
                          <Text style={[styles.searchSectionLabel, { color: '#F43F5E' }]}>Overdue</Text>
                          <Text style={[styles.searchTaskCount, { backgroundColor: '#F43F5E20', color: '#F43F5E' }]}>
                            {getTaskCount(filteredTasks.overdue)}
                          </Text>
                        </View>
                        {filteredTasks.overdue.map((task) => (
                          <View key={task.id} style={[styles.searchTaskItem, { backgroundColor: colors.card }]}>
                            <View style={[styles.taskIcon, { backgroundColor: task.color + '20' }]}>
                              <Ionicons name={task.icon as any} size={16} color={task.color} />
                            </View>
                            <View style={styles.taskInfo}>
                              <Text style={[styles.taskTitle, { color: colors.text }]}>{task.title}</Text>
                              <Text style={[styles.taskSubtitle, { color: colors.textSecondary }]}>{task.subtitle}</Text>
                            </View>
                          </View>
                        ))}
                      </View>
                    )}

                    {/* All Day Tasks */}
                    {getTaskCount(filteredTasks.allDay) > 0 && (
                      <View style={styles.searchTaskSection}>
                        <View style={styles.searchSectionHeader}>
                          <Text style={[styles.searchSectionLabel, { color: '#60A5FA' }]}>All Day</Text>
                          <Text style={[styles.searchTaskCount, { backgroundColor: '#60A5FA20', color: '#60A5FA' }]}>
                            {getTaskCount(filteredTasks.allDay)}
                          </Text>
                        </View>
                        {filteredTasks.allDay.map((task) => (
                          <View key={task.id} style={[styles.searchTaskItem, { backgroundColor: colors.card }]}>
                            <View style={[styles.taskIcon, { backgroundColor: task.color + '20' }]}>
                              <Ionicons name={task.icon as any} size={16} color={task.color} />
                            </View>
                            <View style={styles.taskInfo}>
                              <Text style={[styles.taskTitle, { color: colors.text }]}>{task.title}</Text>
                              <Text style={[styles.taskSubtitle, { color: colors.textSecondary }]}>{task.subtitle}</Text>
                            </View>
                          </View>
                        ))}
                      </View>
                    )}

                    {/* Time-based Tasks */}
                    {Object.entries(filteredTasks.timeBased).map(([time, taskList]) => (
                      <View key={time} style={styles.searchTaskSection}>
                        <View style={styles.searchSectionHeader}>
                          <Text style={[styles.searchSectionLabel, { color: '#84CC16' }]}>{time}</Text>
                          <Text style={[styles.searchTaskCount, { backgroundColor: '#84CC1620', color: '#84CC16' }]}>
                            {getTaskCount(taskList)}
                          </Text>
                        </View>
                        {taskList.map((task) => (
                          <View key={task.id} style={[styles.searchTaskItem, { backgroundColor: colors.card }]}>
                            <View style={[styles.taskIcon, { backgroundColor: task.color + '20' }]}>
                              <Ionicons name={task.icon as any} size={16} color={task.color} />
                            </View>
                            <View style={styles.taskInfo}>
                              <Text style={[styles.taskTitle, { color: colors.text }]}>{task.title}</Text>
                              <Text style={[styles.taskSubtitle, { color: colors.textSecondary }]}>{task.subtitle}</Text>
                            </View>
                          </View>
                        ))}
                      </View>
                    ))}
                  </ScrollView>
                )}
              </View>
            )}
          </View>
        </SafeAreaView>
      </Modal>

      {/* Calendar Modal */}
      <Modal
        visible={showCalendar}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowCalendar(false)}
      >
        <SafeAreaView style={[styles.calendarModal, { backgroundColor: colors.background }]}>
          <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />

          {/* Month/Year Navigation */}
          <View style={[styles.calendarHeader, { borderBottomColor: colors.border }]}>
            <TouchableOpacity onPress={() => setShowCalendar(false)}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>

            <View style={styles.calendarNavigation}>
              <TouchableOpacity onPress={previousMonth} style={styles.navButton}>
                <Ionicons name="chevron-back" size={20} color={colors.primary} />
              </TouchableOpacity>
              <Text style={[styles.calendarTitle, { color: colors.text }]}>
                {calendarMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </Text>
              <TouchableOpacity onPress={nextMonth} style={styles.navButton}>
                <Ionicons name="chevron-forward" size={20} color={colors.primary} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity onPress={() => setShowCalendar(false)}>
              <Text style={[styles.calendarDone, { color: colors.primary }]}>Done</Text>
            </TouchableOpacity>
          </View>

          {/* Month Year Quick Select */}
          <View style={[styles.quickSelectContainer, { borderBottomColor: colors.border }]}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.monthYearScroll}
            >
              {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((month, index) => (
                <TouchableOpacity
                  key={month}
                  style={[
                    styles.monthButton,
                    {
                      backgroundColor: calendarMonth.getMonth() === index ? colors.primary : colors.card,
                      borderColor: colors.border
                    }
                  ]}
                  onPress={() => changeMonth(index)}
                >
                  <Text style={[
                    styles.monthButtonText,
                    {
                      color: calendarMonth.getMonth() === index ? '#FFFFFF' : colors.text
                    }
                  ]}>
                    {month}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.yearScroll}
            >
              {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map((year) => (
                <TouchableOpacity
                  key={year}
                  style={[
                    styles.yearButton,
                    {
                      backgroundColor: calendarMonth.getFullYear() === year ? colors.primary : colors.card,
                      borderColor: colors.border
                    }
                  ]}
                  onPress={() => changeYear(year)}
                >
                  <Text style={[
                    styles.yearButtonText,
                    {
                      color: calendarMonth.getFullYear() === year ? '#FFFFFF' : colors.text
                    }
                  ]}>
                    {year}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Calendar Grid */}
          <View style={styles.calendarGrid}>
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <View key={day} style={styles.dayHeader}>
                <Text style={styles.dayHeaderText}>{day}</Text>
              </View>
            ))}

            {Array.from({ length: 35 }, (_, i) => {
              const dayNumber = i - 2; // Adjust for calendar starting position
              const date = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), dayNumber);
              const isValidDate = dayNumber > 0 && dayNumber <= new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 0).getDate();
              const isToday = isValidDate && date.toDateString() === new Date().toDateString();
              const isSelected = isValidDate && date.toDateString() === selectedDate.toDateString();

              if (!isValidDate) {
                return <View key={i} style={styles.dayCell} />;
              }

              return (
                <View key={i} style={styles.dayCell}>
                  <TouchableOpacity
                    style={[
                      styles.dayButton,
                      {
                        backgroundColor: isSelected ? colors.primary : (isToday ? colors.primary + '20' : 'transparent')
                      }
                    ]}
                    onPress={() => {
                      setSelectedDate(date);
                      setShowCalendar(false);
                    }}
                  >
                    <Text style={[
                      styles.dayButtonText,
                      {
                        color: isSelected ? '#FFFFFF' : (isToday ? colors.primary : colors.text)
                      }
                    ]}>
                      {dayNumber}
                    </Text>
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        </SafeAreaView>
      </Modal>

      <View style={styles.container}>
        {/* Header Section */}
        <Animated.View style={[styles.headerContainer, headerAnimatedStyle]}>
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
              {/* Left side - Greeting */}
              <Text style={[styles.greeting, { color: colors.primary }]}>Hi, User!</Text>
            </View>

            {/* Right side - Search and Calendar */}
            <View style={styles.headerRight}>
              <View style={styles.buttonsContainer}>
                <TouchableOpacity
                  style={[styles.searchButton, { backgroundColor: colors.card }]}
                  onPress={() => {
                    setSearchQuery(''); // Clear search when opening modal
                    setShowSearch(true);
                  }}
                >
                  <Ionicons name="search" size={24} color={colors.primary} />
                </TouchableOpacity>
                <View style={styles.calendarWithDate}>
                  <Text style={[styles.smallDateText, { color: colors.textSecondary }]}>
                    {selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', weekday: 'short' })}
                  </Text>
                  <TouchableOpacity
                    style={[styles.calendarButton, { backgroundColor: colors.card }]}
                    onPress={() => setShowCalendar(true)}
                  >
                    <Ionicons name="calendar-outline" size={20} color={colors.primary} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Date Selector */}
        <Animated.View
          style={[
            styles.dateSelectorContainer,
            cardAnimatedStyle,
            {
              backgroundColor: colors.background,
              shadowColor: colors.shadow,
              borderBottomColor: colors.border
            }
          ]}
        >
          <View style={styles.dateSelectorSection}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.dateScrollContainer}
              overScrollMode="never"
            >
              <View style={styles.datePaddingLeft} />
              {calendarDays.map((day, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.dateCard,
                    {
                      backgroundColor: day.isSelected ? colors.primary : (day.isToday ? colors.primary + '15' : colors.card),
                      borderColor: day.isSelected || day.isToday ? colors.primary : colors.border,
                      shadowColor: colors.shadow,
                    }
                  ]}
                  onPress={() => setSelectedDate(day.date)}
                >
                  <Text style={[
                    styles.dateDay,
                    {
                      color: day.isSelected ? '#FFFFFF' : (day.isToday ? colors.primary : colors.textSecondary)
                    }
                  ]}>
                    {day.dayName}
                  </Text>
                  <Text style={[
                    styles.dateNumber,
                    {
                      color: day.isSelected ? '#FFFFFF' : (day.isToday ? colors.primary : colors.text),
                      fontWeight: day.isToday ? '800' : '700'
                    }
                  ]}>
                    {day.dayNumber}
                  </Text>
                </TouchableOpacity>
              ))}
              <View style={styles.datePaddingRight} />
            </ScrollView>
          </View>
        </Animated.View>

      {/* Tasks Section */}
      <Animated.View style={[styles.tasksContainer, cardAnimatedStyle]}>
        <ScrollView
          style={styles.tasksScrollView}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.tasksContent}>
            {/* Overdue Tasks */}
            {getTaskCount(tasks.overdue) > 0 && (
              <View style={styles.taskSection}>
                <View style={styles.sectionHeader}>
                  <Text style={[styles.sectionLabel, { color: '#F43F5E' }]}>Overdue</Text>
                  <Text style={[styles.taskCount, { backgroundColor: '#F43F5E20', color: '#F43F5E' }]}>{getTaskCount(tasks.overdue)}</Text>
                </View>
                {tasks.overdue.map((task, index) => (
                  <Animated.View
                    entering={FadeInDown.delay(index * 100)}
                    key={task.id}
                    style={[
                      styles.taskItem,
                      styles.overdueTask,
                      {
                        backgroundColor: colors.card,
                        borderLeftColor: task.color
                      }
                    ]}
                  >
                    <View style={[styles.taskIcon, { backgroundColor: task.color + '20' }]}>
                      <Ionicons name={task.icon as any} size={20} color={task.color} />
                    </View>
                    <View style={styles.taskInfo}>
                      <Text style={[styles.taskTitle, { color: colors.text }]}>{task.title}</Text>
                      <Text style={[styles.taskSubtitle, { color: colors.textSecondary }]}>{task.subtitle}</Text>
                    </View>
                    <View style={styles.taskStatus}>
                      <Ionicons name="radio-button-off" size={20} color={task.color} />
                    </View>
                  </Animated.View>
                ))}
              </View>
            )}

            {/* All Day Tasks */}
            <View style={styles.taskSection}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionLabel, { color: '#60A5FA' }]}>All Day</Text>
                <Text style={[styles.taskCount, { backgroundColor: '#60A5FA20', color: '#60A5FA' }]}>{getTaskCount(tasks.allDay)}</Text>
              </View>
              {tasks.allDay.map((task, index) => (
                <Animated.View
                  entering={FadeInDown.delay(index * 100 + 200)}
                  key={task.id}
                  style={[
                    styles.taskItem,
                    {
                      backgroundColor: colors.card
                    }
                  ]}
                >
                  <View style={[styles.taskIcon, { backgroundColor: task.color + '20' }]}>
                    <Ionicons name={task.icon as any} size={20} color={task.color} />
                  </View>
                  <View style={styles.taskInfo}>
                    <Text style={[styles.taskTitle, { color: colors.text }]}>{task.title}</Text>
                    <Text style={[styles.taskSubtitle, { color: colors.textSecondary }]}>{task.subtitle}</Text>
                  </View>
                  <View style={styles.taskStatus}>
                    {task.completed ? (
                      <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                    ) : (
                      <Ionicons name="radio-button-off" size={20} color={colors.border} />
                    )}
                  </View>
                </Animated.View>
              ))}
            </View>

            {/* Time-based Tasks */}
            {Object.entries(tasks.timeBased).map(([time, taskList], sectionIndex) => (
              <View key={time} style={styles.taskSection}>
                <View style={styles.sectionHeader}>
                  <Text style={[styles.sectionLabel, { color: '#84CC16' }]}>{time}</Text>
                  <Text style={[styles.taskCount, { backgroundColor: '#84CC1620', color: '#84CC16' }]}>{getTaskCount(taskList)}</Text>
                </View>
                {taskList.map((task, taskIndex) => (
                  <Animated.View
                    entering={FadeInDown.delay(sectionIndex * 100 + taskIndex * 50 + 400)}
                    key={task.id}
                    style={[
                      styles.taskItem,
                      {
                        backgroundColor: colors.card
                      }
                    ]}
                  >
                    <View style={[styles.taskIcon, { backgroundColor: task.color + '20' }]}>
                      <Ionicons name={task.icon as any} size={20} color={task.color} />
                    </View>
                    <View style={styles.taskInfo}>
                      <Text style={[
                        styles.taskTitle,
                        {
                          color: colors.text,
                          textDecorationLine: task.completed ? 'line-through' : 'none',
                          opacity: task.completed ? 0.6 : 1
                        }
                      ]}>
                        {task.title}
                      </Text>
                      <Text style={[styles.taskSubtitle, { color: colors.textSecondary }]}>{task.subtitle}</Text>
                    </View>
                    <View style={styles.taskStatus}>
                      {task.completed ? (
                        <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                      ) : (
                        <Ionicons name="radio-button-off" size={20} color={colors.border} />
                      )}
                    </View>
                  </Animated.View>
                ))}
              </View>
            ))}

            {/* Empty State */}
            {getTaskCount(tasks.overdue) === 0 &&
             getTaskCount(tasks.allDay) === 0 &&
             Object.keys(tasks.timeBased).length === 0 && (
              <View style={styles.emptyState}>
                <Ionicons name="search-outline" size={48} color={colors.textSecondary} />
                <Text style={[styles.emptyStateText, { color: colors.text }]}>No tasks found</Text>
                <Text style={[styles.emptyStateSubtext, { color: colors.textSecondary }]}>Try adjusting your search</Text>
              </View>
            )}
          </View>
        </ScrollView>
      </Animated.View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerContainer: {
    paddingBottom: 20,
    minHeight: 88,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 1.5,
      },
      android: {
        elevation: 6,
        backgroundColor: '#ffffff',
      }
    })
  },
  headerGradient: {
    paddingTop: 20,
    paddingBottom: 24,
    paddingHorizontal: 20,
    minHeight: 88,
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
    flex: 1,
    justifyContent: 'center',
  },
  greeting: {
    fontSize: 32,
    fontWeight: '700',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  buttonsContainer: {
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: 8,
  },
  calendarWithDate: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  smallDateText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  searchButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateSelectorContainer: {
    borderBottomWidth: 1,
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
  dateSelectorSection: {
    paddingTop: 20,
    paddingBottom: 24,
  },
  dateScrollContainer: {
  },
  dateCard: {
    width: 70,
    height: 80,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    marginRight: 12, // Increased gap
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
      },
      android: {
        elevation: 3,
      }
    })
  },
  datePaddingLeft: {
    width: 20,
  },
  datePaddingRight: {
    width: 20,
  },
  dateDay: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  dateNumber: {
    fontSize: 20,
    fontWeight: '700',
  },
  tasksContainer: {
    flex: 1,
  },
  tasksScrollView: {
    flex: 1,
  },
  tasksContent: {
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  taskSection: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionLabel: {
    fontSize: 18,
    fontWeight: '700',
  },
  taskCount: {
    fontSize: 16,
    fontWeight: '600',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 30,
    textAlign: 'center',
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
      },
      android: {
        elevation: 6,
        backgroundColor: '#ffffff',
      }
    })
  },
  overdueTask: {
    borderLeftWidth: 4,
    borderLeftColor: '#FF5252',
  },
  taskIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  taskInfo: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  taskSubtitle: {
    fontSize: 14,
  },
  taskStatus: {
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 4,
  },
  emptyStateSubtext: {
    fontSize: 14,
  },
  // Search Modal
  searchModalContainer: {
    flex: 1,
  },
  searchModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  searchModalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  searchModalCancel: {
    fontSize: 16,
    fontWeight: '600',
  },
  searchModalContent: {
    flex: 1,
    padding: 20,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
    borderWidth: 1,
    marginBottom: 20,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  searchResultsSection: {
    flex: 1,
  },
  searchResultsTitle: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 16,
  },
  searchResultsScroll: {
    flex: 1,
  },
  searchTaskSection: {
    marginBottom: 24,
  },
  searchSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  searchSectionLabel: {
    fontSize: 16,
    fontWeight: '700',
  },
  searchTaskCount: {
    fontSize: 14,
    fontWeight: '600',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
    minWidth: 25,
    textAlign: 'center',
  },
  searchTaskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  noResultsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  noResultsText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 4,
  },
  noResultsSubtext: {
    fontSize: 14,
  },
  // Calendar Modal
  calendarModal: {
    flex: 1,
    backgroundColor: 'white',
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  calendarNavigation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  navButton: {
    padding: 4,
  },
  calendarTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    minWidth: 150,
    textAlign: 'center',
  },
  quickSelectContainer: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  monthYearScroll: {
    marginBottom: 8,
    paddingHorizontal: 20,
  },
  monthButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginRight: 8,
    borderWidth: 1,
    minWidth: 50,
    alignItems: 'center',
  },
  monthButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  yearScroll: {
    paddingHorizontal: 20,
  },
  yearButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginRight: 8,
    borderWidth: 1,
    minWidth: 60,
    alignItems: 'center',
  },
  yearButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  calendarDone: {
    fontSize: 16,
    fontWeight: '600',
    color: '#84CC16',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  dayHeader: {
    width: `${100/7}%`,
    alignItems: 'center',
    paddingVertical: 12,
  },
  dayHeaderText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    color: '#999',
  },
  dayCell: {
    width: `${100/7}%`,
    alignItems: 'center',
    paddingVertical: 8,
  },
  dayButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});