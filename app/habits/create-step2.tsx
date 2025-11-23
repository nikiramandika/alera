import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useHabit } from '@/contexts/HabitContext';
import { useAuth } from '@/contexts/AuthContext';

interface Step1Data {
  habitName?: string;
  icon?: string;
  description?: string;
  category?: string;
  color?: string;
  target?: {
    value?: number;
    unit?: string;
    frequency?: string;
  };
  reminderTimes?: string[];
  reminderDays?: number[];
}

interface FrequencyOption {
  id: string;
  label: string;
  icon: 'sunny-outline' | 'calendar-outline' | 'repeat-outline';
}

const frequencyOptions: FrequencyOption[] = [
  { id: 'daily', label: 'Daily', icon: 'sunny-outline' },
  { id: 'weekly', label: 'Weekly', icon: 'calendar-outline' },
  { id: 'interval', label: 'Interval', icon: 'repeat-outline' }
];

const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function CreateHabitStep2Screen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { addHabit } = useHabit();
  const { user } = useAuth();
  const params = useLocalSearchParams();

  // Parse step1 data
  const step1Data = params.step1Data ? JSON.parse(params.step1Data as string) as Step1Data : {};

  const [activeFrequencyTab, setActiveFrequencyTab] = useState('daily');
  
  const [habitData, setHabitData] = useState({
    habitName: step1Data.habitName || '',
    icon: step1Data.icon || '🎯',
    description: step1Data.description || '',
    category: step1Data.category || 'custom',
    color: step1Data.color || '#4ECDC4',

    // Frequency settings
    frequency: step1Data.target?.frequency || 'daily',
    selectedDays: step1Data.reminderDays || [0, 1, 2, 3, 4, 5, 6],
    intervalDays: step1Data.target?.frequency === 'interval' ? 3 : 1,

    // Goal settings
    targetValue: step1Data.target?.value || 1,
    targetUnit: step1Data.target?.unit || 'times',
    startDate: new Date(),
    goalDays: 30,

    // Reminder settings
    reminderTimes: step1Data.reminderTimes || ['08:00'],
  });

  const [loading, setLoading] = useState(false);

  const handleSaveHabit = async () => {
    setLoading(true);
    try {
      const newHabit = {
        userId: user?.userId || '',
        habitName: habitData.habitName,
        habitType: habitData.category as 'water' | 'exercise' | 'sleep' | 'meditation' | 'custom',
        description: habitData.description,
        target: {
          value: habitData.targetValue,
          unit: habitData.targetUnit,
          frequency: activeFrequencyTab === 'interval' ? 'daily' : activeFrequencyTab as 'daily' | 'weekly' | 'monthly',
        },
        reminderTimes: habitData.reminderTimes,
        reminderDays: activeFrequencyTab === 'daily' ? [0, 1, 2, 3, 4, 5, 6] : habitData.selectedDays,
        startDate: habitData.startDate,
        endDate: null,
        isActive: true,
        color: habitData.color,
        icon: habitData.icon,
        streak: 0,
        bestStreak: 0,
        completedDates: [],
        schedule: {
          type: activeFrequencyTab === 'interval' ? 'daily' : activeFrequencyTab as 'daily' | 'weekly' | 'monthly',
          frequency: activeFrequencyTab === 'interval' ? 'daily' : activeFrequencyTab as 'daily' | 'weekly' | 'monthly',
          ...(activeFrequencyTab === 'weekly' && { days: habitData.selectedDays }),
        },
      };

      const result = await addHabit(newHabit);

      if (result.success) {
        router.replace('/(tabs)/habits');
      } else {
        Alert.alert('Error', result.error || 'Failed to create habit');
      }
    } catch {
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const toggleDay = (dayIndex: number) => {
    setHabitData(prev => ({
      ...prev,
      selectedDays: prev.selectedDays.includes(dayIndex)
        ? prev.selectedDays.filter((d: number) => d !== dayIndex)
        : [...prev.selectedDays, dayIndex].sort((a: number, b: number) => a - b)
    }));
  };

  const addReminderTime = () => {
    setHabitData(prev => ({
      ...prev,
      reminderTimes: [...prev.reminderTimes, '12:00']
    }));
  };

  const removeReminderTime = (index: number) => {
    if (habitData.reminderTimes.length > 1) {
      setHabitData(prev => ({
        ...prev,
        reminderTimes: prev.reminderTimes.filter((_: string, i: number) => i !== index)
      }));
    }
  };

  const handleTimeChange = (event: DateTimePickerEvent, selectedDate?: Date, index?: number) => {
    if (event.type === 'set' && selectedDate && index !== undefined) {
      const hours = selectedDate.getHours().toString().padStart(2, '0');
      const minutes = selectedDate.getMinutes().toString().padStart(2, '0');
      const newTimes = [...habitData.reminderTimes];
      newTimes[index] = `${hours}:${minutes}`;
      setHabitData(prev => ({ ...prev, reminderTimes: newTimes }));
    }
  };

  const handleDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (event.type === 'set' && selectedDate) {
      setHabitData(prev => ({ ...prev, startDate: selectedDate }));
    }
  };

  const convertTimeToDate = (timeString: string) => {
    const [hours, minutes] = timeString.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date;
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
          Create New Habit
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
              Frequency & Goals
            </Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Set when and how often you want to do this habit
            </Text>
          </View>

          {/* Frequency Tabs */}
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <Text style={[styles.label, { color: colors.text }]}>Frequency</Text>
            <View style={styles.tabContainer}>
              {frequencyOptions.map((option) => (
                <TouchableOpacity
                  key={option.id}
                  style={[
                    styles.tab,
                    {
                      backgroundColor: activeFrequencyTab === option.id
                        ? colors.primary
                        : colors.backgroundSecondary,
                      borderColor: activeFrequencyTab === option.id
                        ? colors.primary
                        : colors.border,
                    }
                  ]}
                  onPress={() => setActiveFrequencyTab(option.id)}
                >
                  <Ionicons
                    name={option.icon}
                    size={20}
                    color={activeFrequencyTab === option.id ? '#FFFFFF' : colors.textSecondary}
                  />
                  <Text style={[
                    styles.tabText,
                    { color: activeFrequencyTab === option.id ? '#FFFFFF' : colors.text }
                  ]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Frequency Specific Options */}
            {activeFrequencyTab === 'daily' && (
              <View style={styles.frequencyOption}>
                <Text style={[styles.optionText, { color: colors.text }]}>
                  Every day
                </Text>
                <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
              </View>
            )}

            {activeFrequencyTab === 'weekly' && (
              <View style={styles.frequencyOption}>
                <Text style={[styles.optionLabel, { color: colors.text }]}>
                  Select days:
                </Text>
                <View style={styles.daysGrid}>
                  {daysOfWeek.map((day, index) => (
                    <TouchableOpacity
                      key={day}
                      style={[
                        styles.dayPill,
                        {
                          backgroundColor: habitData.selectedDays.includes(index)
                            ? colors.primary
                            : colors.backgroundSecondary,
                          borderColor: habitData.selectedDays.includes(index)
                            ? colors.primary
                            : colors.border,
                        }
                      ]}
                      onPress={() => toggleDay(index)}
                    >
                      <Text style={[
                        styles.dayText,
                        { color: habitData.selectedDays.includes(index) ? '#FFFFFF' : colors.text }
                      ]}>
                        {day}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {activeFrequencyTab === 'interval' && (
              <View style={styles.frequencyOption}>
                <Text style={[styles.optionLabel, { color: colors.text }]}>
                  Repeat every:
                </Text>
                <View style={styles.intervalContainer}>
                  <TextInput
                    style={[styles.intervalInput, {
                      backgroundColor: colors.backgroundSecondary,
                      borderColor: colors.border,
                      color: colors.text
                    }]}
                    value={habitData.intervalDays.toString()}
                    onChangeText={(text) => setHabitData(prev => ({
                      ...prev,
                      intervalDays: parseInt(text) || 1
                    }))}
                    keyboardType="numeric"
                  />
                  <Text style={[styles.intervalText, { color: colors.text }]}>
                    days
                  </Text>
                </View>
              </View>
            )}
          </View>

          {/* Goal Container */}
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <View style={styles.cardHeader}>
              <Ionicons name="flag-outline" size={20} color={colors.primary} />
              <Text style={[styles.cardTitle, { color: colors.text }]}>Goal</Text>
            </View>

            <View style={styles.goalRow}>
              <View style={styles.goalInput}>
                <Text style={[styles.goalLabel, { color: colors.text }]}>Target</Text>
                <TextInput
                  style={[styles.input, {
                    backgroundColor: colors.backgroundSecondary,
                    borderColor: colors.border,
                    color: colors.text
                  }]}
                  value={habitData.targetValue.toString()}
                  onChangeText={(text) => setHabitData(prev => ({
                    ...prev,
                    targetValue: parseInt(text) || 1
                  }))}
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.goalInput}>
                <Text style={[styles.goalLabel, { color: colors.text }]}>Unit</Text>
                <TextInput
                  style={[styles.input, {
                    backgroundColor: colors.backgroundSecondary,
                    borderColor: colors.border,
                    color: colors.text
                  }]}
                  value={habitData.targetUnit}
                  onChangeText={(text) => setHabitData(prev => ({ ...prev, targetUnit: text }))}
                  placeholder="times, minutes, etc."
                />
              </View>
            </View>

            <View style={styles.goalRow}>
              <View style={styles.goalInput}>
                <Text style={[styles.goalLabel, { color: colors.text }]}>Start Date</Text>
                <DateTimePicker
                  testID="startDatePicker"
                  value={habitData.startDate}
                  mode="date"
                  onChange={handleDateChange}
                  textColor={colors.text}
                  accentColor={colors.primary}
                />
              </View>
              <View style={styles.goalInput}>
                <Text style={[styles.goalLabel, { color: colors.text }]}>Goal Days</Text>
                <TextInput
                  style={[styles.input, {
                    backgroundColor: colors.backgroundSecondary,
                    borderColor: colors.border,
                    color: colors.text
                  }]}
                  value={habitData.goalDays.toString()}
                  onChangeText={(text) => setHabitData(prev => ({
                    ...prev,
                    goalDays: parseInt(text) || 30
                  }))}
                  keyboardType="numeric"
                  placeholder="30"
                />
              </View>
            </View>
          </View>

          {/* Reminder Container */}
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <View style={styles.cardHeader}>
              <Ionicons name="notifications-outline" size={20} color={colors.primary} />
              <Text style={[styles.cardTitle, { color: colors.text }]}>Reminder</Text>
            </View>

            <Text style={[styles.optionLabel, { color: colors.text }]}>
              Reminder times:
            </Text>

            <View style={styles.reminderGrid}>
              {habitData.reminderTimes.map((time: string, index: number) => (
                <View key={index} style={styles.reminderItem}>
                  <View style={styles.timeRow}>
                    <DateTimePicker
                      testID={`timePicker${index}`}
                      value={convertTimeToDate(time)}
                      mode="time"
                      onChange={(event, selectedTime) => handleTimeChange(event, selectedTime, index)}
                      textColor={colors.text}
                      accentColor={colors.primary}
                      style={{ flex: 1 }}
                    />
                    {habitData.reminderTimes.length > 1 && (
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
                Add Reminder Time
              </Text>
            </TouchableOpacity>
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
            <Text style={styles.saveButtonText}>Creating...</Text>
          ) : (
            <>
              <Text style={styles.saveButtonText}>Create Habit</Text>
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
});