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
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import { useHabit } from '@/contexts/HabitContext';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';

export default function ManageHabitScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { addHabit, updateHabit } = useHabit();
  const params = useLocalSearchParams();

  // Check if we're in edit mode
  const isEditMode = params.editMode === 'true';
  const editingHabitId = params.habitId as string;

  const [habitData, setHabitData] = useState({
    habitName: '',
    category: 'custom' as 'water' | 'exercise' | 'sleep' | 'meditation' | 'reading' | 'health' | 'custom',
    customCategory: '',
    description: '',
    target: {
      value: 1,
      unit: 'times',
      frequency: 'daily' as 'daily' | 'weekly' | 'monthly',
    },
    reminderTimes: ['08:00'],
    reminderDays: [0, 1, 2, 3, 4, 5, 6], // All days by default
    startDate: new Date(),
    endDate: null as Date | null,
    isActive: true,
    color: '#4ECDC4',
    icon: 'checkmark-circle-outline',
  });

  const [loading, setLoading] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);

  const habitCategories = [
    {
      value: 'water',
      label: 'Water Intake',
      icon: 'water-outline',
      color: '#3498db',
      defaultUnit: 'glasses',
      defaultTarget: 8
    },
    {
      value: 'exercise',
      label: 'Exercise',
      icon: 'fitness-outline',
      color: '#e74c3c',
      defaultUnit: 'minutes',
      defaultTarget: 30
    },
    {
      value: 'sleep',
      label: 'Sleep',
      icon: 'moon-outline',
      color: '#9b59b6',
      defaultUnit: 'hours',
      defaultTarget: 8
    },
    {
      value: 'meditation',
      label: 'Meditation',
      icon: 'leaf-outline',
      color: '#2ecc71',
      defaultUnit: 'minutes',
      defaultTarget: 15
    },
    {
      value: 'reading',
      label: 'Reading',
      icon: 'book-outline',
      color: '#f39c12',
      defaultUnit: 'pages',
      defaultTarget: 20
    },
    {
      value: 'health',
      label: 'Health',
      icon: 'heart-outline',
      color: '#e91e63',
      defaultUnit: 'times',
      defaultTarget: 1
    },
    {
      value: 'custom',
      label: 'Custom',
      icon: 'star-outline',
      color: '#34495e',
      defaultUnit: 'times',
      defaultTarget: 1
    },
  ];

  const frequencyTypes = [
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'monthly', label: 'Monthly' },
  ];

  const habitColors = [
    '#4ECDC4', '#F47B9F', '#FFD93D', '#A8E6CF', '#FF8B94',
    '#C9B1FF', '#FFB347', '#84CC16', '#FB6D3A', '#4A90E2'
  ];

  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Load habit data for edit mode or template
  useEffect(() => {
    // Check for template data first
    if (params.template) {
      try {
        const template = JSON.parse(params.template as string);
        setHabitData({
          habitName: template.habitName || '',
          category: template.category || 'custom',
          customCategory: template.customCategory || '',
          description: template.description || '',
          target: {
            value: template.target?.value || 1,
            unit: template.target?.unit || 'times',
            frequency: template.target?.frequency || 'daily',
          },
          reminderTimes: template.reminderTimes || ['08:00'],
          reminderDays: template.reminderDays || [0, 1, 2, 3, 4, 5, 6],
          startDate: new Date(),
          endDate: null,
          isActive: true,
          color: template.color || '#4ECDC4',
          icon: template.icon || 'checkmark-circle-outline',
        });
      } catch (error) {
        console.error('Failed to parse template data:', error);
      }
    }
    // Check for edit mode data
    else if (isEditMode && params.habitData) {
      try {
        const habit = JSON.parse(params.habitData as string);
        setHabitData({
          habitName: habit.habitName || '',
          category: habit.category || 'custom',
          customCategory: habit.customCategory || '',
          description: habit.description || '',
          target: {
            value: habit.target?.value || 1,
            unit: habit.target?.unit || 'times',
            frequency: habit.target?.frequency || 'daily',
          },
          reminderTimes: habit.reminderTimes || ['08:00'],
          reminderDays: habit.reminderDays || [0, 1, 2, 3, 4, 5, 6],
          startDate: habit.startDate || habit.duration?.startDate ? new Date(habit.startDate || habit.duration?.startDate) : new Date(),
          endDate: habit.endDate || habit.duration?.endDate ? new Date(habit.endDate || habit.duration?.endDate) : null,
          isActive: habit.isActive ?? true,
          color: habit.color || '#4ECDC4',
          icon: habit.icon || 'checkmark-circle-outline',
        });
      } catch (error) {
        console.error('Failed to parse habit data:', error);
      }
    }
  }, [isEditMode, params.habitData, params.template]);

  const handleCategoryChange = (category: string) => {
    const selectedCategory = habitCategories.find(cat => cat.value === category);
    if (selectedCategory) {
      setHabitData(prev => ({
        ...prev,
        category: category as any,
        target: {
          ...prev.target,
          unit: selectedCategory.defaultUnit,
          value: selectedCategory.defaultTarget,
        },
        color: selectedCategory.color,
        icon: selectedCategory.icon,
      }));
    }
  };

  const handleSaveHabit = async () => {
    // Validation
    if (!habitData.habitName.trim()) {
      Alert.alert('Error', 'Please enter habit name');
      return;
    }

    if (habitData.category === 'custom' && !habitData.customCategory.trim()) {
      Alert.alert('Error', 'Please enter custom category name');
      return;
    }

    if (habitData.reminderTimes.length === 0) {
      Alert.alert('Error', 'Please add at least one reminder time');
      return;
    }

    if (habitData.reminderDays.length === 0) {
      Alert.alert('Error', 'Please select at least one day');
      return;
    }

    setLoading(true);
    try {
      const habitToSave = {
        ...habitData,
        startDate: habitData.startDate.toISOString(),
        endDate: habitData.endDate?.toISOString() || null,
      };

      let result;
      if (isEditMode && editingHabitId) {
        result = await updateHabit(editingHabitId, habitToSave);
      } else {
        result = await addHabit(habitToSave);
      }

      if (result.success) {
        router.back(); // Go back to habits list
      } else {
        Alert.alert('Error', result.error || 'Failed to save habit');
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const toggleWeekDay = (dayIndex: number) => {
    const currentDays = [...habitData.reminderDays];
    const dayIndexPosition = currentDays.indexOf(dayIndex);

    if (dayIndexPosition === -1) {
      // Add the day
      setHabitData(prev => ({
        ...prev,
        reminderDays: [...prev.reminderDays, dayIndex].sort((a, b) => a - b),
      }));
    } else {
      // Remove the day
      setHabitData(prev => ({
        ...prev,
        reminderDays: prev.reminderDays.filter(day => day !== dayIndex).sort((a, b) => a - b),
      }));
    }
  };

  const addReminderTime = () => {
    setHabitData(prev => ({
      ...prev,
      reminderTimes: [...prev.reminderTimes, '09:00'],
    }));
  };

  const removeReminderTime = (index: number) => {
    if (habitData.reminderTimes.length > 1) {
      setHabitData(prev => ({
        ...prev,
        reminderTimes: prev.reminderTimes.filter((_, i) => i !== index),
      }));
    }
  };

  const convertTimeToDate = (timeString: string) => {
    const [hours, minutes] = timeString.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date;
  };

  const handleTimeChangeForIndex = (event: DateTimePickerEvent, selectedTime?: Date, index?: number) => {
    if (event.type === 'set' && selectedTime && index !== undefined) {
      const hours = selectedTime.getHours().toString().padStart(2, '0');
      const minutes = selectedTime.getMinutes().toString().padStart(2, '0');
      const formattedTime = `${hours}:${minutes}`;

      const newTimes = [...habitData.reminderTimes];
      newTimes[index] = formattedTime;
      setHabitData(prev => ({ ...prev, reminderTimes: newTimes }));
    }
  };

  const handleStartDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (event.type === 'set' && selectedDate) {
      setHabitData(prev => ({ ...prev, startDate: selectedDate }));
    }
  };

  const handleEndDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (event.type === 'set' && selectedDate) {
      // Set to end of day so habit is active throughout the selected day
      const endOfDay = new Date(selectedDate);
      endOfDay.setHours(23, 59, 59, 999);

      setHabitData(prev => ({ ...prev, endDate: endOfDay }));
    }
    setShowEndDatePicker(false);
  };

  // Render functions for each section
  const renderBasicInfo = () => (
    <View style={[styles.card, { backgroundColor: colors.card }]}>
      <View style={styles.cardHeader}>
        <Ionicons name="star-outline" size={24} color={colors.primary} />
        <Text style={[styles.cardTitle, { color: colors.text }]}>Basic Information</Text>
      </View>

      <View style={styles.inputGroup}>
        <Text style={[styles.label, { color: colors.text }]}>Habit Name</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border, color: colors.text }]}
          placeholder="Enter habit name..."
          placeholderTextColor={colors.textSecondary}
          value={habitData.habitName}
          onChangeText={(text) => setHabitData(prev => ({ ...prev, habitName: text }))}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={[styles.label, { color: colors.text }]}>Category</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoryScroll}
        >
          {habitCategories.map((category) => (
            <TouchableOpacity
              key={category.value}
              style={[
                styles.categoryPill,
                {
                  backgroundColor: habitData.category === category.value ? category.color : 'transparent',
                  borderColor: habitData.category === category.value ? category.color : colors.border
                }
              ]}
              onPress={() => handleCategoryChange(category.value)}
            >
              <Ionicons
                name={category.icon}
                size={20}
                color={habitData.category === category.value ? '#FFFFFF' : colors.textSecondary}
              />
              <Text style={[
                styles.categoryText,
                {
                  color: habitData.category === category.value ? '#FFFFFF' : colors.text
                }
              ]}>
                {category.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {habitData.category === 'custom' && (
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.text }]}>Custom Category Name</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border, color: colors.text }]}
            placeholder="Enter custom category..."
            placeholderTextColor={colors.textSecondary}
            value={habitData.customCategory}
            onChangeText={(text) => setHabitData(prev => ({ ...prev, customCategory: text }))}
          />
        </View>
      )}

      <View style={styles.inputGroup}>
        <Text style={[styles.label, { color: colors.text }]}>Description</Text>
        <TextInput
          style={[styles.textArea, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border, color: colors.text }]}
          placeholder="Add notes about this habit (optional)"
          placeholderTextColor={colors.textSecondary}
          value={habitData.description}
          onChangeText={(text) => setHabitData(prev => ({ ...prev, description: text }))}
          multiline
        />
      </View>
    </View>
  );

  const renderTargetSettings = () => (
    <View style={[styles.card, { backgroundColor: colors.card }]}>
      <View style={styles.cardHeader}>
        <Ionicons name="target-outline" size={24} color={colors.primary} />
        <Text style={[styles.cardTitle, { color: colors.text }]}>Target Settings</Text>
      </View>

      <View style={styles.targetRow}>
        <TextInput
          style={[styles.targetInput, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border, color: colors.text, flex: 1 }]}
          placeholder="1"
          placeholderTextColor={colors.textSecondary}
          value={habitData.target.value.toString()}
          onChangeText={(text) => setHabitData(prev => ({
            ...prev,
            target: { ...prev.target, value: parseInt(text) || 1 }
          }))}
          keyboardType="numeric"
        />
        <TextInput
          style={[styles.targetInput, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border, color: colors.text, marginLeft: 8 }]}
          placeholder="times"
          placeholderTextColor={colors.textSecondary}
          value={habitData.target.unit}
          onChangeText={(text) => setHabitData(prev => ({
            ...prev,
            target: { ...prev.target, unit: text }
          }))}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={[styles.label, { color: colors.text }]}>Frequency</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.typeScroll}
        >
          {frequencyTypes.map((freq) => (
            <TouchableOpacity
              key={freq.value}
              style={[
                styles.typePill,
                {
                  backgroundColor: habitData.target.frequency === freq.value ? colors.primary : 'transparent',
                  borderColor: habitData.target.frequency === freq.value ? colors.primary : colors.border
                }
              ]}
              onPress={() => setHabitData(prev => ({
                ...prev,
                target: { ...prev.target, frequency: freq.value as any }
              }))}
            >
              <Text style={[
                styles.typeText,
                {
                  color: habitData.target.frequency === freq.value ? '#FFFFFF' : colors.text
                }
              ]}>
                {freq.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </View>
  );

  const renderReminderSettings = () => (
    <View style={[styles.card, { backgroundColor: colors.card }]}>
      <View style={styles.cardHeader}>
        <Ionicons name="notifications-outline" size={24} color={colors.primary} />
        <Text style={[styles.cardTitle, { color: colors.text }]}>Reminder Settings</Text>
      </View>

      <View style={styles.inputGroup}>
        <Text style={[styles.label, { color: colors.text }]}>Reminder Days</Text>
        <View style={styles.daysGrid}>
          {daysOfWeek.map((day, index) => (
            <TouchableOpacity
              key={day}
              style={[
                styles.dayPill,
                {
                  backgroundColor: habitData.reminderDays.includes(index) ? colors.primary : colors.backgroundSecondary,
                  borderColor: habitData.reminderDays.includes(index) ? colors.primary : colors.border,
                }
              ]}
              onPress={() => toggleWeekDay(index)}
            >
              <Text style={[
                styles.dayText,
                { color: habitData.reminderDays.includes(index) ? '#FFFFFF' : colors.text }
              ]}>
                {day}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.inputGroup}>
        <View style={styles.timeHeader}>
          <Text style={[styles.label, { color: colors.text }]}>Reminder Times</Text>
          <TouchableOpacity onPress={addReminderTime} style={styles.addButton}>
            <Ionicons name="add" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
        {habitData.reminderTimes.map((time, index) => (
          <View key={index} style={styles.timeRow}>
            <View style={styles.timeInputContainer}>
              <View style={Platform.OS === 'ios' ? styles.inlineDatePickerContainer : {}}>
                <DateTimePicker
                  testID={`timePicker${index}`}
                  value={convertTimeToDate(time)}
                  mode="time"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={(event, selectedTime) => handleTimeChangeForIndex(event, selectedTime, index)}
                  textColor={colors.text}
                  accentColor={colors.primary}
                  style={{ flex: 1 }}
                />
                {Platform.OS === 'ios' && (
                  <View style={styles.pickerActions}>
                    <Text style={[styles.pickerInfo, { color: colors.textSecondary }]}>
                      Reminder time {index + 1}
                    </Text>
                  </View>
                )}
              </View>
            </View>
            {habitData.reminderTimes.length > 1 && (
              <TouchableOpacity
                style={[styles.removeButton, { backgroundColor: '#FF6B6B' }]}
                onPress={() => removeReminderTime(index)}
                activeOpacity={0.8}
              >
                <Ionicons name="remove" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            )}
          </View>
        ))}
      </View>
    </View>
  );

  const renderDurationSettings = () => (
    <View style={[styles.card, { backgroundColor: colors.card }]}>
      <View style={styles.cardHeader}>
        <Ionicons name="calendar-outline" size={24} color={colors.primary} />
        <Text style={[styles.cardTitle, { color: colors.text }]}>Duration</Text>
      </View>

      <View style={styles.inputGroup}>
        <Text style={[styles.label, { color: colors.text }]}>Start Date</Text>
        <View style={Platform.OS === 'ios' ? styles.inlineDatePickerContainer : {}}>
          <DateTimePicker
            testID="startDatePicker"
            value={habitData.startDate}
            mode="date"
            onChange={handleStartDateChange}
            textColor={colors.text}
            accentColor={colors.primary}
          />
          {Platform.OS === 'ios' && (
            <View style={styles.pickerActions}>
              <Text style={[styles.pickerInfo, { color: colors.textSecondary }]}>
                {habitData.startDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.inputGroup}>
        <View style={styles.dateRow}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.label, { color: colors.text }]}>End Date (Optional)</Text>
            {showEndDatePicker ? (
              <View style={Platform.OS === 'ios' ? styles.inlineDatePickerContainer : {}}>
                <DateTimePicker
                  testID="endDatePicker"
                  value={habitData.endDate || new Date()}
                  mode="date"
                  onChange={handleEndDateChange}
                  textColor={colors.text}
                  accentColor={colors.primary}
                />
              </View>
            ) : (
              <TouchableOpacity
                style={[styles.dateButton, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}
                onPress={() => setShowEndDatePicker(true)}
              >
                <Text style={[styles.dateButtonText, { color: colors.textSecondary }]}>
                  {habitData.endDate
                    ? habitData.endDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
                    : 'No end date'
                  }
                </Text>
                <Ionicons name="calendar-outline" size={16} color={colors.textSecondary} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </View>
  );

  const renderColorSelection = () => (
    <View style={[styles.card, { backgroundColor: colors.card }]}>
      <View style={styles.cardHeader}>
        <Ionicons name="color-palette-outline" size={24} color={colors.primary} />
        <Text style={[styles.cardTitle, { color: colors.text }]}>Color & Appearance</Text>
      </View>

      <View style={styles.colorContainer}>
        {habitColors.map((color) => (
          <TouchableOpacity
            key={color}
            style={[
              styles.colorOption,
              {
                backgroundColor: color,
                borderWidth: habitData.color === color ? 3 : 1,
                borderColor: habitData.color === color ? colors.text : 'transparent',
              }
            ]}
            onPress={() => setHabitData(prev => ({ ...prev, color }))}
          >
            {habitData.color === color && (
              <Ionicons name="checkmark" size={16} color="#FFFFFF" />
            )}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />

      {/* Header actions - inline with custom header */}
      <View style={styles.headerActions}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={[
              styles.iconButton,
              { borderColor: colors.border, backgroundColor: colors.backgroundSecondary }
            ]}
          >
            <Ionicons name="chevron-back" size={20} color={colors.text} />
          </TouchableOpacity>
          <View style={[styles.badge, { backgroundColor: isEditMode ? '#FF8B94' : '#84CC16' }]}>
            <Text style={styles.badgeText}>{isEditMode ? 'Edit Habit' : 'New Habit'}</Text>
          </View>
        </View>
        <TouchableOpacity
          onPress={handleSaveHabit}
          disabled={loading}
          style={[
            styles.saveButton,
            {
              backgroundColor: loading ? colors.border : colors.primary,
              opacity: loading ? 0.7 : 1,
            }
          ]}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.saveButtonText}>Save</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Content Section */}
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.contentContainer}>
          {renderBasicInfo()}
          {renderTargetSettings()}
          {renderReminderSettings()}
          {renderDurationSettings()}
          {renderColorSelection()}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E7',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  badgeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  saveButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 80,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
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
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 12,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  categoryScroll: {
    marginBottom: 8,
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 12,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },
  typeScroll: {
    marginBottom: 8,
  },
  typePill: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 16,
    borderWidth: 1,
    marginRight: 12,
  },
  typeText: {
    fontSize: 14,
    fontWeight: '500',
  },
  targetRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  targetInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    flex: 1,
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
    marginBottom: 8,
  },
  dayText: {
    fontSize: 14,
    fontWeight: '600',
  },
  timeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  timeInputContainer: {
    flex: 1,
    marginRight: 12,
  },
  inlineDatePickerContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E5E7',
  },
  pickerActions: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E7',
  },
  pickerInfo: {
    fontSize: 12,
    textAlign: 'center',
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
  },
  dateButtonText: {
    fontSize: 16,
  },
  colorContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  colorOption: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
});