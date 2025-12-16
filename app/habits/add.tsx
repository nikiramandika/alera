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
import { useAuth } from '@/contexts/AuthContext';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useTranslation } from 'react-i18next';

export default function AddHabitScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { addHabit, updateHabit } = useHabit();
  const { user } = useAuth();
  const params = useLocalSearchParams();
  const { t } = useTranslation();

  // Check if we're in edit mode
  const isEditMode = params.editMode === 'true';
  const editingHabitId = params.habitId as string;

  console.log('Screen params:', params);
  console.log('Is edit mode:', isEditMode);
  console.log('Editing habit ID:', editingHabitId);

  const [habitData, setHabitData] = useState({
    habitName: '',
    habitType: 'exercise',
    description: '',
    target: {
      value: 30,
      unit: t('habits.minutes'),
    },
    color: '#4ECDC4',
    icon: '🏃',
    isActive: true,
  });

  const [frequency, setFrequency] = useState<{
    type: 'daily' | 'interval';
    times: string[];
    specificDays?: number[];
  }>({
    type: 'daily',
    times: ['08:00'],
    specificDays: [0, 1, 2, 3, 4, 5, 6],
  });

  const [duration, setDuration] = useState({
    startDate: new Date(),
    totalDays: null as number | null,
  });

  const [loading, setLoading] = useState(false);

  // Date picker states
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);

  const habitTypes = [
    { value: 'exercise', label: t('habits.exercise'), icon: '🏃' },
    { value: 'water', label: t('habits.water'), icon: '💧' },
    { value: 'sleep', label: t('habits.sleep'), icon: '😴' },
    { value: 'meditation', label: t('habits.meditation'), icon: '🧘' },
    { value: 'reading', label: t('habits.reading'), icon: '📚' },
    { value: 'custom', label: t('habits.custom'), icon: '⭐' },
  ];

  const habitColors = ['#4ECDC4', '#F47B9F', '#FFD93D', '#A8E6CF', '#FF8B94', '#C9B1FF', '#FFB347'];
  const frequencyTypes = [
    { value: 'daily', label: t('habits.daily') },
    { value: 'interval', label: t('habits.specificDays') },
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

  // Date picker handlers
  const handleStartDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (event.type === 'set' && selectedDate) {
      setDuration(prev => ({
        ...prev,
        startDate: selectedDate
      }));
      setShowStartDatePicker(false);
    }
  };

  // Time picker handlers
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

      const newTimes = [...frequency.times];
      newTimes[index] = formattedTime;
      setFrequency(prev => ({ ...prev, times: newTimes }));
    }
  };

  // Load habit data for edit mode
  useEffect(() => {
    if (isEditMode && params.habitData) {
      try {
        const habitData = JSON.parse(params.habitData as string);
        console.log('Loading habit data for edit:', habitData);

        // Populate form with existing data
        setHabitData({
          habitName: habitData.habitName || '',
          habitType: habitData.habitType || 'exercise',
          description: habitData.description || '',
          target: habitData.target || { value: 30, unit: 'minutes' },
          color: habitData.color || '#4ECDC4',
          icon: habitData.icon || '🏃',
          isActive: habitData.isActive !== false,
        });

        setFrequency({
          type: (habitData.frequency?.type || 'daily') as 'daily' | 'interval',
          times: habitData.frequency?.times || habitData.reminderTimes || ['08:00'],
          specificDays: habitData.frequency?.specificDays || habitData.schedule?.days || [0, 1, 2, 3, 4, 5, 6],
        });

        setDuration({
          startDate: habitData.duration?.startDate ? new Date(habitData.duration.startDate) : new Date(),
          totalDays: habitData.duration?.totalDays || null,
        });
      } catch (error) {
        console.error('Error parsing habit data:', error);
        Alert.alert(t('common.error'), t('habits.failedToLoadHabitData'));
      }
    } else if (params.template) {
      // Load from template
      try {
        const template = JSON.parse(params.template as string);
        console.log('Loading from template:', template);

        setHabitData({
          habitName: template.habitName || '',
          habitType: template.category || 'custom',
          description: template.description || '',
          target: template.target || { value: 30, unit: t('habits.minutes') },
          color: template.color || '#4ECDC4',
          icon: template.icon || '⭐',
          isActive: true,
        });

        setFrequency({
          type: (template.reminderDays?.length === 7 ? 'daily' : 'interval') as 'daily' | 'interval',
          times: template.reminderTimes || ['08:00'],
          specificDays: template.reminderDays || [0, 1, 2, 3, 4, 5, 6],
        });
      } catch (error) {
        console.error('Error parsing template:', error);
      }
    }
  }, [isEditMode, params.habitData, params.template]);

  const handleAddTime = () => {
    const nextTime = '12:00';
    setFrequency(prev => ({
      ...prev,
      times: [...prev.times, nextTime]
    }));
  };

  const handleRemoveTime = (index: number) => {
    if (frequency.times.length > 1) {
      Alert.alert(
        t('habits.removeTime'),
        t('habits.removeTimeConfirm'),
        [
          { text: t('habits.cancel'), style: "cancel" },
          {
            text: t('habits.remove'),
            style: "destructive",
            onPress: () => {
              setFrequency(prev => ({
                ...prev,
                times: prev.times.filter((_, i) => i !== index)
              }));
            }
          }
        ]
      );
    }
  };

  const handleToggleDay = (dayIndex: number) => {
    setFrequency(prev => ({
      ...prev,
      specificDays: (prev.specificDays || []).includes(dayIndex)
        ? (prev.specificDays || []).filter(d => d !== dayIndex)
        : [...(prev.specificDays || []), dayIndex]
    }));
  };

  const handleSave = async () => {
    // Check if user is authenticated
    if (!user) {
      Alert.alert(t('common.error'), t('habits.mustBeLoggedIn'));
      return;
    }

    // Validation
    if (!habitData.habitName.trim()) {
      Alert.alert(t('common.error'), t('habits.pleaseEnterHabitName'));
      return;
    }

    if (frequency.times.length === 0) {
      Alert.alert(t('common.error'), t('habits.pleaseAddAtLeastOneReminderTime'));
      return;
    }

    if (frequency.type === 'interval' && (!frequency.specificDays || frequency.specificDays.length === 0)) {
      Alert.alert(t('common.error'), t('habits.pleaseSelectAtLeastOneDay'));
      return;
    }

    setLoading(true);
    try {
      if (isEditMode && editingHabitId) {
        // Update existing habit
        const updateData = {
          ...habitData,
          frequency,
          duration,
          reminderTimes: frequency.times, // Keep for backward compatibility
          schedule: { // Keep for backward compatibility
            days: frequency.specificDays || [0, 1, 2, 3, 4, 5, 6],
            frequency: (frequency.type === 'interval' ? 'interval' : 'daily') as 'daily' | 'interval',
            type: (frequency.type === 'interval' ? 'interval' : 'daily') as 'daily' | 'interval',
          },
          reminderDays: frequency.specificDays || [0, 1, 2, 3, 4, 5, 6], // for backward compatibility
          startDate: duration.startDate,
          endDate: duration.totalDays ? new Date(duration.startDate.getTime() + duration.totalDays * 24 * 60 * 60 * 1000) : null,
          userId: user?.userId,
        };

        console.log('Updating habit with ID:', editingHabitId);
        console.log('Update data:', updateData);
        console.log('User ID:', user.userId);

        const result = await updateHabit(editingHabitId, updateData);
        console.log('Update result:', result);

        if (result.success) {
          Alert.alert(t('common.success'), t('habits.habitUpdatedSuccessfully'));
          router.back();
        } else {
          Alert.alert(t('common.error'), result.error || t('habits.failedToUpdateHabit'));
        }
      } else {
        // Add new habit
        const newHabit = {
          ...habitData,
          frequency,
          duration,
          reminderTimes: frequency.times, // Keep for backward compatibility
          schedule: { // Keep for backward compatibility
            days: frequency.specificDays || [0, 1, 2, 3, 4, 5, 6],
            frequency: (frequency.type === 'interval' ? 'interval' : 'daily') as 'daily' | 'interval',
            type: (frequency.type === 'interval' ? 'interval' : 'daily') as 'daily' | 'interval',
          },
          reminderDays: frequency.specificDays || [0, 1, 2, 3, 4, 5, 6], // for backward compatibility
          startDate: duration.startDate,
          endDate: duration.totalDays ? new Date(duration.startDate.getTime() + duration.totalDays * 24 * 60 * 60 * 1000) : null,
          streak: 0,
          bestStreak: 0,
          completedDates: [],
          userId: user.userId,
        };

        console.log('Adding new habit:', newHabit);

        const result = await addHabit(newHabit);

        if (result.success) {
          Alert.alert(t('common.success'), t('habits.habitAddedSuccessfully'));
          router.back();
        } else {
          Alert.alert(t('common.error'), result.error || t('habits.failedToCreateHabit'));
        }
      }
    } catch (error) {
      console.error('Save error:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      Alert.alert(t('common.error'), `${t('habits.unexpectedErrorOccurred')}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const renderBasicInfo = () => (
    <View style={[styles.card, { backgroundColor: colors.card }]}>
      <View style={styles.cardHeader}>
        <Ionicons name="checkmark-circle-outline" size={24} color={colors.primary} />
        <Text style={[styles.cardTitle, { color: colors.text }]}>{t('habits.basicInformation')}</Text>
      </View>

      <View style={styles.inputGroup}>
        <Text style={[styles.label, { color: colors.text }]}>{t('habits.habitNameRequired')}</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border, color: colors.text }]}
          value={habitData.habitName}
          onChangeText={(text) => setHabitData(prev => ({ ...prev, habitName: text }))}
          placeholder={t('habits.habitNamePlaceholder')}
          placeholderTextColor={colors.textSecondary}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={[styles.label, { color: colors.text }]}>{t('habits.habitType')}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.typeScroll}>
          {habitTypes.map((type) => (
            <TouchableOpacity
              key={type.value}
              style={[
                styles.typePill,
                {
                  backgroundColor: habitData.habitType === type.value ? colors.primary : colors.backgroundSecondary,
                  borderColor: habitData.habitType === type.value ? colors.primary : colors.border,
                }
              ]}
              onPress={() => setHabitData(prev => ({
                ...prev,
                habitType: type.value as any,
                icon: type.icon,
                color: type.value === 'exercise' ? '#e74c3c' :
                       type.value === 'water' ? '#3498db' :
                       type.value === 'sleep' ? '#9b59b6' :
                       type.value === 'meditation' ? '#2ecc71' :
                       type.value === 'reading' ? '#f39c12' : habitData.color
              }))}
            >
              <Text style={[
                styles.typeText,
                { color: habitData.habitType === type.value ? '#FFFFFF' : colors.text }
              ]}>
                {type.icon} {type.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.inputGroup}>
        <Text style={[styles.label, { color: colors.text }]}>{t('habits.description')}</Text>
        <TextInput
          style={[styles.textArea, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border, color: colors.text }]}
          value={habitData.description}
          onChangeText={(text) => setHabitData(prev => ({ ...prev, description: text }))}
          placeholder={t('habits.descriptionPlaceholder')}
          placeholderTextColor={colors.textSecondary}
          multiline
          numberOfLines={3}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={[styles.label, { color: colors.text }]}>{t('habits.target')}</Text>
        <View style={styles.targetRow}>
          <TextInput
            style={[styles.targetInput, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border, color: colors.text }]}
            value={habitData.target.value.toString()}
            onChangeText={(text) => setHabitData(prev => ({
              ...prev,
              target: { ...prev.target, value: parseInt(text) || 1 }
            }))}
            keyboardType="numeric"
            placeholder={t('habits.targetPlaceholder')}
            placeholderTextColor={colors.textSecondary}
          />
          <TextInput
            style={[styles.unitInput, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border, color: colors.text }]}
            value={habitData.target.unit}
            onChangeText={(text) => setHabitData(prev => ({
              ...prev,
              target: { ...prev.target, unit: text }
            }))}
            placeholder={t('habits.minutes')}
            placeholderTextColor={colors.textSecondary}
          />
        </View>
      </View>
    </View>
  );

  const renderFrequencySettings = () => (
    <View style={[styles.card, { backgroundColor: colors.card }]}>
      <View style={styles.cardHeader}>
        <Ionicons name="time-outline" size={24} color={colors.primary} />
        <Text style={[styles.cardTitle, { color: colors.text }]}>{t('habits.frequencySettings')}</Text>
      </View>

      <View style={styles.inputGroup}>
        <Text style={[styles.label, { color: colors.text }]}>{t('habits.scheduleType')}</Text>
        <View style={styles.frequencyGrid}>
          {frequencyTypes.map((type) => (
            <TouchableOpacity
              key={type.value}
              style={[
                styles.frequencyOption,
                {
                  backgroundColor: frequency.type === type.value ? colors.primary : colors.backgroundSecondary,
                  borderColor: frequency.type === type.value ? colors.primary : colors.border,
                }
              ]}
              onPress={() => setFrequency(prev => ({ ...prev, type: type.value as any }))}
            >
              <Text style={[
                styles.frequencyText,
                { color: frequency.type === type.value ? '#FFFFFF' : colors.text }
              ]}>
                {type.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {frequency.type === 'interval' && (
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.text }]}>{t('habits.selectDays')}</Text>
          <View style={styles.daysGrid}>
            {daysOfWeek.map((day, index) => (
              <TouchableOpacity
                key={day}
                style={[
                  styles.dayPill,
                  {
                    backgroundColor: (frequency.specificDays || []).includes(index) ? colors.primary : colors.backgroundSecondary,
                    borderColor: (frequency.specificDays || []).includes(index) ? colors.primary : colors.border,
                  }
                ]}
                onPress={() => handleToggleDay(index)}
              >
                <Text style={[
                  styles.dayText,
                  { color: (frequency.specificDays || []).includes(index) ? '#FFFFFF' : colors.text }
                ]}>
                  {day}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      <View style={styles.inputGroup}>
        <View style={styles.timeHeader}>
          <Text style={[styles.label, { color: colors.text }]}>{t('habits.reminderTimes')}</Text>
          <TouchableOpacity onPress={handleAddTime} style={styles.addButton}>
            <Ionicons name="add" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
        {frequency.times.map((time, index) => (
          <View key={index} style={styles.timeRow}>
            <View style={styles.timeInputContainer}>
              <View style={Platform.OS === 'ios' ? styles.inlineDatePickerContainer : {}}>
                <DateTimePicker
                  testID={`timePicker${index}`}
                  value={convertTimeToDate(time)}
                  mode="time"
                  onChange={(event, selectedTime) => handleTimeChangeForIndex(event, selectedTime, index)}
                  textColor={colors.text}
                  accentColor={colors.primary}
                  style={{ flex: 1 }}
                />
              </View>
            </View>
            {frequency.times.length > 1 && (
              <TouchableOpacity
                style={[styles.removeButton, { backgroundColor: '#FF6B6B' }]}
                onPress={() => handleRemoveTime(index)}
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
        <Text style={[styles.cardTitle, { color: colors.text }]}>{t('habits.duration')}</Text>
      </View>

      <View style={styles.inputGroup}>
        <Text style={[styles.label, { color: colors.text }]}>{t('habits.startDate')}</Text>
        <TouchableOpacity
          style={[styles.dateInput, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}
          onPress={() => setShowStartDatePicker(true)}
        >
          <Text style={[styles.dateText, { color: colors.text }]}>
            {duration.startDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </Text>
          <Ionicons name="calendar-outline" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {showStartDatePicker && (
        <View style={Platform.OS === 'ios' ? { height: 200 } : {}}>
          <DateTimePicker
            testID="startDatePicker"
            value={duration.startDate}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={handleStartDateChange}
            textColor={colors.text}
            accentColor={colors.primary}
          />
          {Platform.OS === 'ios' && (
            <View style={styles.pickerActions}>
              <TouchableOpacity
                onPress={() => setShowStartDatePicker(false)}
                style={[styles.pickerButton, { backgroundColor: colors.border }]}
              >
                <Text style={[styles.pickerButtonText, { color: colors.text }]}>{t('habits.done')}</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}
    </View>
  );

  const renderColorSelection = () => (
    <View style={[styles.card, { backgroundColor: colors.card }]}>
      <View style={styles.cardHeader}>
        <Ionicons name="color-palette-outline" size={24} color={colors.primary} />
        <Text style={[styles.cardTitle, { color: colors.text }]}>{t('habits.colorAppearance')}</Text>
      </View>

      <View style={styles.colorContainer}>
        {habitColors.map((color) => (
          <TouchableOpacity
            key={color}
            style={[
              styles.colorOption,
              { backgroundColor: color },
              habitData.color === color && styles.selectedColor
            ]}
            onPress={() => setHabitData(prev => ({ ...prev, color }))}
          >
            {habitData.color === color && (
              <Ionicons name="checkmark" size={20} color="#FFFFFF" />
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
            <Text style={styles.badgeText}>{isEditMode ? t('habits.editHabit') : t('habits.newHabit')}</Text>
          </View>
        </View>
        <TouchableOpacity
          onPress={handleSave}
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
            <Text style={styles.saveButtonText}>{t('habits.save')}</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Content Section */}
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.contentContainer}>
          {renderBasicInfo()}
          {renderFrequencySettings()}
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  saveButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 96,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    gap: 20,
  },
  card: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      }
    })
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
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
    height: 80,
    textAlignVertical: 'top',
  },
  targetRow: {
    flexDirection: 'row',
    gap: 12,
  },
  targetInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
  },
  unitInput: {
    flex: 2,
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
  },
  typeScroll: {
    flexDirection: 'row',
  },
  typePill: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  typeText: {
    fontSize: 14,
    fontWeight: '600',
  },
  frequencyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  frequencyOption: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 15,
    borderWidth: 1,
    marginBottom: 10,
  },
  frequencyText: {
    fontSize: 14,
    fontWeight: '600',
  },
  daysGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
  },
  dayPill: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
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
    marginBottom: 12,
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
  },
  pickerActions: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  pickerButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 8,
  },
  pickerButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  removeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FF6B6B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#84CC16',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateInput: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
  },
  dateText: {
    fontSize: 16,
  },
  colorContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    flexWrap: 'wrap',
    gap: 15,
  },
  colorOption: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  selectedColor: {
    borderWidth: 3,
    borderColor: '#FFFFFF',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
      },
      android: {
        elevation: 6,
      }
    })
  },
});