import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Platform,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import { useHabit } from '@/contexts/HabitContext';
import { useAuth } from '@/contexts/AuthContext';
import { habitService } from '@/services';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useTranslation } from 'react-i18next';

const { width: screenWidth } = Dimensions.get('window');

interface Step1Data {
  habitName?: string;
  habitType?: string;
  description?: string;
  target?: {
    value?: number;
    unit?: string;
  };
  color?: string;
  icon?: string;
  editMode?: boolean;
  habitId?: string;
}

interface FrequencyTab {
  id: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  description: string;
}

// frequencyTabs and daysOfWeek will be defined inside component to use t()

export default function CreateHabitStep2Screen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { addHabit, updateHabit } = useHabit();
  const { user } = useAuth();
  const params = useLocalSearchParams();
  const { t } = useTranslation();

  const frequencyTabs: FrequencyTab[] = [
    {
      id: 'daily',
      label: t('habits.daily'),
      icon: 'sunny-outline' as keyof typeof Ionicons.glyphMap,
      description: t('habits.everyDaySameTime')
    },
    {
      id: 'interval',
      label: t('habits.interval'),
      icon: 'repeat-outline' as keyof typeof Ionicons.glyphMap,
      description: t('habits.onSpecificDaysEachWeek')
    }
  ];

  const daysOfWeek = [
    t('common.sunday'),
    t('common.monday'),
    t('common.tuesday'),
    t('common.wednesday'),
    t('common.thursday'),
    t('common.friday'),
    t('common.saturday'),
  ];

  // Parse step1 data
  const step1Data = params.step1Data ? JSON.parse(params.step1Data as string) as Step1Data : {};

  const [activeFrequencyTab, setActiveFrequencyTab] = useState('daily');

  // Check if edit mode
  const editMode = step1Data?.editMode || false;
  const habitId = step1Data?.habitId || '';

  const [loading, setLoading] = useState(false);
  const [showEndDate, setShowEndDate] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);

  const [habitData, setHabitData] = useState({
    habitName: step1Data?.habitName || '',
    habitType: step1Data?.habitType || 'custom',
    description: step1Data?.description || '',
    target: {
      value: step1Data?.target?.value || 1,
      unit: step1Data?.target?.unit || 'times',
    },
    color: step1Data?.color || '#4ECDC4',
    icon: step1Data?.icon || 'checkmark-circle-outline',

    // Frequency settings
    frequency: {
      type: 'daily' as 'daily' | 'interval',
      selectedDays: [] as number[], // Days for interval frequency
      times: ['08:00'],
    },

    // Duration settings - set to start of today to avoid timezone issues
    duration: {
      startDate: (() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Set to start of day
        return today;
      })(),
      endDate: undefined as Date | undefined,
      totalDays: null as number | null,
    },
  });

  // Load existing habit data for edit mode
  useEffect(() => {
    if (dataLoaded) return; // Don't reload data if already loaded

    if (editMode && habitId && user && !step1Data) {
      const loadHabitData = async () => {
        try {
          console.log('Loading habit data for edit (no step1 data):', habitId);
          const habit = await habitService.getHabitById(user.userId, habitId);

          if (habit) {
            console.log('Loaded habit data:', habit);

            // Update all habitData with loaded data
            setHabitData({
              habitName: habit.habitName || '',
              habitType: habit.habitType || 'custom',
              description: habit.description || '',
              target: {
                value: habit.target?.value || 1,
                unit: habit.target?.unit || 'times',
              },
              color: habit.color || '#4ECDC4',
              icon: habit.icon || 'checkmark-circle-outline',

              // Update frequency data
              frequency: {
                type: habit.frequency?.type || 'daily',
                times: habit.frequency?.times || ['08:00'],
                selectedDays: habit.frequency?.specificDays || [],
              },

              // Update duration data
              duration: {
                startDate: (() => {
                  if (habit.duration?.startDate) {
                    if (typeof habit.duration.startDate === 'object' && 'toDate' in habit.duration.startDate && typeof habit.duration.startDate.toDate === 'function') {
                      return habit.duration.startDate.toDate();
                    } else {
                      return new Date(habit.duration.startDate);
                    }
                  }
                  return new Date();
                })(),
                endDate: (() => {
                  if (habit.duration?.endDate) {
                    if (typeof habit.duration.endDate === 'object' && 'toDate' in habit.duration.endDate && typeof habit.duration.endDate.toDate === 'function') {
                      return habit.duration.endDate.toDate();
                    } else {
                      return new Date(habit.duration.endDate);
                    }
                  }
                  return undefined;
                })(),
                totalDays: habit.duration?.totalDays || null,
              },
            });

            // Set frequency tab based on loaded data
            setActiveFrequencyTab(habit.frequency?.type || 'daily');

            // Set showEndDate based on whether end date exists
            setShowEndDate(!!habit.duration?.endDate);

            // Mark data as loaded
            setDataLoaded(true);
          }
        } catch (error) {
          console.error('Error loading habit data:', error);
        }
      };

      loadHabitData();
    } else if (editMode && habitId && user && step1Data) {
      // If we have step1Data, only load frequency and duration data from database
      // Don't overwrite step1 changes!
      const loadFrequencyAndDuration = async () => {
        try {
          console.log('Loading frequency and duration for edit (with step1 data):', habitId);
          const habit = await habitService.getHabitById(user.userId, habitId);

          if (habit) {
            console.log('Loaded frequency/duration data, keeping step1 changes');

            // Only update frequency and duration data, keep step1 data intact
            setHabitData((prev) => ({
              ...prev, // Keep step1 data
              // Update frequency and duration data only
              frequency: {
                type: habit.frequency?.type || 'daily',
                times: habit.frequency?.times || ['08:00'],
                selectedDays: habit.frequency?.specificDays || [],
              },

              // Update duration data
              duration: {
                startDate: (() => {
                  if (habit.duration?.startDate) {
                    if (typeof habit.duration.startDate === 'object' && 'toDate' in habit.duration.startDate && typeof habit.duration.startDate.toDate === 'function') {
                      return habit.duration.startDate.toDate();
                    } else {
                      return new Date(habit.duration.startDate);
                    }
                  }
                  return new Date();
                })(),
                endDate: (() => {
                  if (habit.duration?.endDate) {
                    if (typeof habit.duration.endDate === 'object' && 'toDate' in habit.duration.endDate && typeof habit.duration.endDate.toDate === 'function') {
                      return habit.duration.endDate.toDate();
                    } else {
                      return new Date(habit.duration.endDate);
                    }
                  }
                  return undefined;
                })(),
                totalDays: habit.duration?.totalDays || null,
              },
            }));

            // Set frequency tab based on loaded data
            setActiveFrequencyTab(habit.frequency?.type || 'daily');

            // Set showEndDate based on whether end date exists
            setShowEndDate(!!habit.duration?.endDate);

            // Mark data as loaded
            setDataLoaded(true);
          }
        } catch (error) {
          console.error('Error loading frequency/duration data:', error);
        }
      };

      loadFrequencyAndDuration();
    }
  }, [editMode, habitId, user, step1Data, dataLoaded]);

  const handleSaveHabit = async () => {
    setLoading(true);
    try {
      const duration: any = {
        startDate: habitData.duration.startDate,
        totalDays: habitData.duration.totalDays,
      };

      // Only include endDate if it exists
      if (habitData.duration.endDate) {
        duration.endDate = habitData.duration.endDate;
      }

      const habitPayload: any = {
        habitName: habitData.habitName,
        habitType: habitData.habitType,
        description: habitData.description,
        target: {
          value: Math.max(1, habitData.target.value || 1), // Ensure minimum value is 1
          unit: habitData.target.unit,
        },
        color: habitData.color,
        icon: habitData.icon,

        // Main frequency structure
        frequency: {
          type: habitData.frequency.type,
          times: habitData.frequency.times,
          specificDays: habitData.frequency.selectedDays || [],
        },

        // Legacy fields for backward compatibility
        reminderDays: habitData.frequency.selectedDays || [],
        reminderTimes: habitData.frequency.times,
        schedule: {
          type: habitData.frequency.type,
          frequency: habitData.frequency.type,
          days: habitData.frequency.selectedDays,
        },

        // Set both startDate and duration.startDate for compatibility
        startDate: duration.startDate,
        duration: {
          startDate: duration.startDate,
          endDate: duration.endDate,
          totalDays: duration.totalDays,
        },

        isActive: true,
        streak: 0,
        bestStreak: 0,
        completedDates: [],
      };

      // Only add endDate if it exists (to avoid Firebase undefined error)
      if (duration.endDate) {
        habitPayload.endDate = duration.endDate;
      }

      let result;
      if (editMode && habitId) {
        // Update existing habit
        result = await updateHabit(habitId, habitPayload);
      } else {
        // Add new habit
        const newHabit = {
          userId: user?.userId || '',
          ...habitPayload,
        };
        result = await addHabit(newHabit);
      }

      if (result.success) {
        router.replace('/(tabs)/habits');
      } else {
        Alert.alert(t('common.error'), result.error || (editMode ? t('habits.failedToUpdateHabit') : t('habits.failedToCreateHabit')));
      }
    } catch {
      Alert.alert(t('common.error'), t('habits.unexpectedErrorOccurred'));
    } finally {
      setLoading(false);
    }
  };

  const toggleDay = (dayIndex: number) => {
    setHabitData(prev => {
      const newSelectedDays = prev.frequency.selectedDays?.includes(dayIndex)
        ? prev.frequency.selectedDays.filter((d: number) => d !== dayIndex)
        : [...(prev.frequency.selectedDays || []), dayIndex].sort((a: number, b: number) => a - b);

      return {
        ...prev,
        frequency: {
          ...prev.frequency,
          selectedDays: newSelectedDays
        }
      };
    });
  };

  const addReminderTime = () => {
    setHabitData(prev => ({
      ...prev,
      frequency: {
        ...prev.frequency,
        times: [...prev.frequency.times, '12:00']
      }
    }));
  };

  const removeReminderTime = (index: number) => {
    if (habitData.frequency.times.length > 1) {
      setHabitData(prev => ({
        ...prev,
        frequency: {
          ...prev.frequency,
          times: prev.frequency.times.filter((_: string, i: number) => i !== index)
        }
      }));
    }
  };

  const handleTimeChange = (event: DateTimePickerEvent, selectedDate?: Date, index?: number) => {
    if (event.type === 'set' && selectedDate && index !== undefined) {
      const hours = selectedDate.getHours().toString().padStart(2, '0');
      const minutes = selectedDate.getMinutes().toString().padStart(2, '0');
      const newTimes = [...habitData.frequency.times];
      newTimes[index] = `${hours}:${minutes}`;
      setHabitData(prev => ({
        ...prev,
        frequency: {
          ...prev.frequency,
          times: newTimes
        }
      }));
    }
  };

  
  const convertTimeToDate = (timeString: string) => {
    const [hours, minutes] = timeString.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date;
  };

  const handleTabPress = (tabId: string) => {
    setActiveFrequencyTab(tabId);
    setHabitData(prev => ({
      ...prev,
      frequency: {
        ...prev.frequency,
        type: tabId as 'daily' | 'interval'
      }
    }));
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />

      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.backButton, { borderColor: colors.border, backgroundColor: colors.backgroundSecondary }]}
        >
          <Ionicons name="chevron-back" size={20} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          {editMode ? t('habits.editHabit') : t('habits.createNewHabit')}
        </Text>
        <View style={styles.placeholder} />
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={[styles.progressBar, { backgroundColor: colors.primary }]} />
        <View style={[styles.progressBackground, { backgroundColor: colors.border }]} />
      </View>

      {/* Content */}
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Step Indicator */}
          <View style={styles.stepIndicator}>
            <View style={[styles.stepCompleted, { backgroundColor: colors.primary }]}>
              <Ionicons name="checkmark" size={16} color="#FFFFFF" />
            </View>
            <View style={[styles.stepLine, { backgroundColor: colors.primary }]} />
            <View style={[styles.stepActive, { backgroundColor: colors.primary }]}>
              <Text style={styles.stepActiveText}>2</Text>
            </View>
          </View>

          {/* Title */}
          <View style={styles.section}>
            <Text style={[styles.title, { color: colors.text }]}>
              {t('habits.frequencyGoals')}
            </Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              {t('habits.setWhenAndHowOften')}
            </Text>
          </View>

          {/* Frequency Tabs */}
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <Text style={[styles.label, { color: colors.text }]}>{t('habits.frequency')}</Text>
            <Text style={[styles.sublabel, { color: colors.textSecondary }]}>
              {t('habits.howOftenDoHabit')}
            </Text>

            <View style={styles.frequencyTabContainer}>
              {frequencyTabs.map((tab) => (
                <TouchableOpacity
                  key={tab.id}
                  style={[
                    styles.frequencyTab,
                    {
                      backgroundColor: activeFrequencyTab === tab.id
                        ? colors.primary
                        : colors.backgroundSecondary,
                      borderColor: activeFrequencyTab === tab.id
                        ? colors.primary
                        : colors.border,
                    }
                  ]}
                  onPress={() => handleTabPress(tab.id)}
                >
                  <Ionicons
                    name={tab.icon}
                    size={20}
                    color={activeFrequencyTab === tab.id ? '#FFFFFF' : colors.textSecondary}
                  />
                  <Text style={[
                    styles.frequencyTabText,
                    { color: activeFrequencyTab === tab.id ? '#FFFFFF' : colors.text }
                  ]}>
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.frequencyDescription, { color: colors.textSecondary }]}>
              {frequencyTabs.find(tab => tab.id === activeFrequencyTab)?.description}
            </Text>

            </View>

          {/* Frequency Content */}
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            {activeFrequencyTab === 'daily' && (
              <View style={styles.tabContent}>
                <View style={styles.cardHeader}>
                  <Ionicons name="notifications-outline" size={20} color={colors.primary} />
                  <Text style={[styles.cardTitle, { color: colors.text }]}>{t('habits.dailyReminderTimes')}</Text>
                </View>

                <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                  {t('habits.whenShouldBeReminded')}
                </Text>

                <View style={styles.reminderGrid}>
                  {habitData.frequency.times.map((time: string, index: number) => (
                    <View key={index} style={styles.reminderItem}>
                      <View style={styles.timeRow}>
                        <View style={[styles.timePickerContainer, { backgroundColor: colors.backgroundSecondary }]}>
                          <DateTimePicker
                            testID={`timePicker${index}`}
                            value={convertTimeToDate(time)}
                            mode="time"
                            onChange={(event, selectedTime) => handleTimeChange(event, selectedTime, index)}
                            textColor={colors.text}
                            accentColor={colors.primary}
                          />
                        </View>
                        {habitData.frequency.times.length > 1 && (
                          <TouchableOpacity
                            style={[styles.removeTimeButton, { backgroundColor: '#FF6B6B' }]}
                            onPress={() => removeReminderTime(index)}
                            activeOpacity={0.8}
                          >
                            <Ionicons name="remove" size={16} color="#FFFFFF" />
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  ))}
                </View>

                <TouchableOpacity
                  style={[styles.addTimeButton, { backgroundColor: colors.primary + '20' }]}
                  onPress={addReminderTime}
                >
                  <Ionicons name="add" size={20} color={colors.primary} />
                  <Text style={[styles.addTimeText, { color: colors.primary }]}>
                    {t('habits.addReminderTime')}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {activeFrequencyTab === 'interval' && (
              <View style={styles.tabContent}>
                <View style={styles.cardHeader}>
                  <Ionicons name="calendar-number-outline" size={20} color={colors.primary} />
                  <Text style={[styles.cardTitle, { color: colors.text }]}>{t('habits.selectDays')}</Text>
                </View>

                <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                  {t('habits.selectDaysOfWeek')}
                </Text>

                <View style={styles.daysGrid}>
                  {daysOfWeek.map((day, index) => (
                    <TouchableOpacity
                      key={day}
                      style={[
                        styles.dayPill,
                        {
                          backgroundColor: habitData.frequency.selectedDays?.includes(index)
                            ? colors.primary
                            : colors.backgroundSecondary,
                          borderColor: habitData.frequency.selectedDays?.includes(index)
                            ? colors.primary
                            : colors.border,
                        }
                      ]}
                      onPress={() => toggleDay(index)}
                    >
                      <Text style={[
                        styles.dayText,
                        { color: habitData.frequency.selectedDays?.includes(index) ? '#FFFFFF' : colors.text }
                      ]}>
                        {day}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <View style={[styles.divider, { borderBottomColor: colors.border }]} />

                <Text style={[styles.subtitle, { marginTop: 16, color: colors.textSecondary }]}>
                  {t('habits.reminderTimesForSelectedDays')}
                </Text>

                <View style={styles.reminderGrid}>
                  {habitData.frequency.times.map((time: string, index: number) => (
                    <View key={index} style={styles.reminderItem}>
                      <View style={styles.timeRow}>
                        <View style={[styles.timePickerContainer, { backgroundColor: colors.backgroundSecondary }]}>
                          <DateTimePicker
                            testID={`timePicker${index}`}
                            value={convertTimeToDate(time)}
                            mode="time"
                            onChange={(event, selectedTime) => handleTimeChange(event, selectedTime, index)}
                            textColor={colors.text}
                            accentColor={colors.primary}
                          />
                        </View>
                        {habitData.frequency.times.length > 1 && (
                          <TouchableOpacity
                            style={[styles.removeTimeButton, { backgroundColor: '#FF6B6B' }]}
                            onPress={() => removeReminderTime(index)}
                            activeOpacity={0.8}
                          >
                            <Ionicons name="remove" size={16} color="#FFFFFF" />
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  ))}
                </View>

                <TouchableOpacity
                  style={[styles.addTimeButton, { backgroundColor: colors.primary + '20' }]}
                  onPress={addReminderTime}
                >
                  <Ionicons name="add" size={20} color={colors.primary} />
                  <Text style={[styles.addTimeText, { color: colors.primary }]}>
                    {t('habits.addReminderTime')}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          
          {/* Duration Settings */}
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <View style={styles.cardHeader}>
              <Ionicons name="calendar-outline" size={20} color={colors.primary} />
              <Text style={[styles.cardTitle, { color: colors.text }]}>{t('habits.duration')}</Text>
            </View>

            <Text style={[styles.sublabel, { color: colors.textSecondary }]}>
              {t('habits.setHowLongMaintain')}
            </Text>

            <View style={styles.durationRow}>
              <View style={styles.durationInput}>
                <Text style={[styles.durationLabel, { color: colors.text }]}>{t('habits.startDate')}</Text>
                <DateTimePicker
                  value={(() => {
                    const date = habitData.duration.startDate;
                    if (date instanceof Date) {
                      // Set to start of day to avoid timezone issues
                      const startOfDay = new Date(date);
                      startOfDay.setHours(0, 0, 0, 0);
                      return startOfDay;
                    }
                    return new Date();
                  })()}
                  mode="date"
                  onChange={(event, selectedDate) => {
                    if (event.type === 'set' && selectedDate) {
                      // Create date in local timezone and set to start of day
                      const localDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
                      const startOfDay = new Date(localDate);
                      startOfDay.setHours(0, 0, 0, 0);

                      console.log('Start date selected:', selectedDate, 'Local start of day:', startOfDay);

                      setHabitData(prev => ({
                        ...prev,
                        duration: {
                          ...prev.duration,
                          startDate: startOfDay
                        }
                      }));
                    }
                  }}
                  textColor={colors.text}
                  accentColor={colors.primary}
                />
              </View>

              <View style={styles.durationInput}>
                <Text style={[styles.durationLabel, { color: colors.text }]}>{t('habits.endDateOptional')}</Text>
                {!showEndDate && !habitData.duration.endDate ? (
                  <TouchableOpacity
                    style={[styles.addEndDateButton, {
                      backgroundColor: colors.backgroundSecondary,
                      borderColor: colors.border,
                      borderWidth: 1
                    }]}
                    onPress={() => setShowEndDate(true)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="add" size={20} color={colors.primary} />
                  </TouchableOpacity>
                ) : (
                  <View style={styles.endDateContainer}>
                    <DateTimePicker
                      value={(() => {
                        const endDate = habitData.duration.endDate;
                        if (endDate instanceof Date) {
                          // Return a copy for display to avoid modifying the stored value
                          return new Date(endDate);
                        }
                        return new Date();
                      })()}
                      mode="date"
                      minimumDate={habitData.duration.startDate}
                      onChange={(event, selectedDate) => {
                        if (event.type === 'set' && selectedDate) {
                          // Create date in local timezone and set to end of day
                          const localDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
                          const endOfDay = new Date(localDate);
                          endOfDay.setHours(23, 59, 59, 999);

                          console.log('End date selected:', selectedDate, 'Local end of day:', endOfDay);

                          // Ensure end date is not before start date
                          if (selectedDate >= habitData.duration.startDate) {
                            setHabitData(prev => ({
                              ...prev,
                              duration: {
                                ...prev.duration,
                                endDate: endOfDay
                              }
                            }));
                          } else {
                            // Show alert if end date is before start date
                            Alert.alert(
                              t('common.error'),
                              t('habits.endDateCannotBeBeforeStartDate')
                            );
                          }
                        }
                      }}
                      textColor={colors.text}
                      accentColor={colors.primary}
                      style={styles.endDatePicker}
                    />
                    <TouchableOpacity
                      style={[styles.removeEndDateButton, { backgroundColor: '#FF6B6B' }]}
                      onPress={() => {
                        setHabitData(prev => ({
                          ...prev,
                          duration: {
                            ...prev.duration,
                            endDate: undefined
                          }
                        }));
                        setShowEndDate(false);
                      }}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="remove" size={16} color="#FFFFFF" />
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </View>
          </View>

          
          {/* Bottom Space for Floating Button */}
          <View style={styles.bottomSpace} />
        </View>
      </ScrollView>

      {/* Floating Save Button */}
      <View style={[styles.floatingButtonContainer, { backgroundColor: colors.background }]}>
        <TouchableOpacity
          style={[styles.saveButton, {
            backgroundColor: loading ? colors.border : colors.primary,
            opacity: loading ? 0.7 : 1,
          }]}
          onPress={handleSaveHabit}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <Text style={styles.saveButtonText}>{editMode ? t('habits.updating') : t('habits.creating')}</Text>
          ) : (
            <>
              <Text style={styles.saveButtonText}>{editMode ? t('habits.updateHabit') : t('habits.createHabit')}</Text>
              <Ionicons name="checkmark" size={20} color="#FFFFFF" />
            </>
          )}
        </TouchableOpacity>
      </View>

          </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 16,
  },
  placeholder: {
    width: 40,
  },
  progressContainer: {
    height: 3,
    backgroundColor: '#E5E5E7',
    position: 'relative',
  },
  progressBar: {
    width: '100%',
    height: '100%',
  },
  progressBackground: {
    display: 'none',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  stepCompleted: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepActive: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepActiveText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  stepLine: {
    width: 40,
    height: 2,
  },
  section: {
    marginBottom: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  card: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  optionLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 12,
  },
  optionText: {
    fontSize: 16,
  },
  optionSubtext: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  tabContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 12,
    borderWidth: 1,
    marginHorizontal: 4,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
  },
  frequencyOption: {
    marginTop: 16,
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  dayPill: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayText: {
    fontSize: 14,
    fontWeight: '600',
  },
  intervalContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  intervalInput: {
    width: 80,
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginRight: 12,
  },
  intervalText: {
    fontSize: 16,
  },
  goalRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  goalInput: {
    flex: 1,
  },
  goalLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
  },
  dateButtonText: {
    fontSize: 16,
  },
  reminderGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 12,
  },
  reminderItem: {
    width: '48%', // 2 items per row
    marginBottom: 8,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  removeTimeButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  addTimeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  addTimeText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },
  bottomSpace: {
    height: 100,
  },
  floatingButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E7',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 28,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
  sublabel: {
    fontSize: 14,
    marginBottom: 16,
    lineHeight: 20,
  },
  frequencyTabContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 8,
  },
  frequencyTab: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    borderWidth: 1,
  },
  frequencyTabText: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 8,
  },
  frequencyDescription: {
    fontSize: 14,
    fontStyle: 'italic',
    textAlign: 'center',
    marginBottom: 16,
  },
  tabContent: {
    padding: 0,
  },
  timePickerContainer: {
    borderRadius: 8,
    overflow: 'hidden',
    flex: 1,
  },
  divider: {
    borderBottomWidth: 1,
    marginVertical: 16,
  },
  durationRow: {
    flexDirection: 'row',
    gap: 16,
  },
  durationInput: {
    flex: 1,
  },
  durationLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: -12,
    marginBottom: 8,
    textAlign: 'center',
  },
  addEndDateButton: {
    width: 32,
    height: 32,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  endDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  endDatePicker: {
    flex: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
  removeEndDateButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
});