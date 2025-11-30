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
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import { useMedicine } from '@/contexts/MedicineContext';
import { useAuth } from '@/contexts/AuthContext';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';

const { width: screenWidth } = Dimensions.get('window');

interface Step1Data {
  medicineName?: string;
  dosage?: string;
  medicineType?: string;
  takeWithMeal?: 'before' | 'after';
  description?: string;
  drugAppearance?: string | null;
  editMode?: boolean;
  medicineId?: string;
}

interface FrequencyTab {
  id: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  description: string;
}

const frequencyTabs: FrequencyTab[] = [
  {
    id: 'daily',
    label: 'Daily',
    icon: 'calendar-outline' as keyof typeof Ionicons.glyphMap,
    description: 'Every day at the same time'
  },
  {
    id: 'weekly',
    label: 'Weekly',
    icon: 'calendar-number-outline' as keyof typeof Ionicons.glyphMap,
    description: 'On specific days each week'
  },
  {
    id: 'interval',
    label: 'Interval',
    icon: 'timer-outline' as keyof typeof Ionicons.glyphMap,
    description: 'Every X days'
  }
];

const daysOfWeek = [
  { id: 0, label: 'Sun' },
  { id: 1, label: 'Mon' },
  { id: 2, label: 'Tue' },
  { id: 3, label: 'Wed' },
  { id: 4, label: 'Thu' },
  { id: 5, label: 'Fri' },
  { id: 6, label: 'Sat' }
];

export default function AddMedicineStep2NewScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { addMedicine, updateMedicine } = useMedicine();
  const { user } = useAuth();
  const params = useLocalSearchParams();

  // Parse step1 data
  const step1Data = params.step1Data ? JSON.parse(params.step1Data as string) as Step1Data : null;

  // Check if edit mode
  const editMode = step1Data?.editMode || false;
  const medicineId = step1Data?.medicineId || '';

  const [activeFrequencyTab, setActiveFrequencyTab] = useState('daily');
  const [loading, setLoading] = useState(false);

  const [medicineData, setMedicineData] = useState({
    medicineName: step1Data?.medicineName || '',
    dosage: step1Data?.dosage || '',
    medicineType: step1Data?.medicineType || 'tablet',
    takeWithMeal: step1Data?.takeWithMeal || 'before',
    description: step1Data?.description || '',
    drugAppearance: step1Data?.drugAppearance || null,

    // Frequency settings
    frequency: {
      type: 'daily' as 'daily' | 'weekly' | 'interval',
      interval: 1, // For interval frequency
      selectedDays: [], // No days selected by default
      times: ['08:00'],
    },

    // Duration settings
    duration: {
      startDate: new Date(),
      endDate: null,
      totalDays: null,
    },

      });

  const [scrollX, setScrollX] = useState(0);

  const handleSaveMedicine = async () => {
    setLoading(true);
    try {
      const medicinePayload = {
        medicineName: medicineData.medicineName,
        dosage: medicineData.dosage,
        medicineType: medicineData.medicineType,
        takeWithMeal: medicineData.takeWithMeal,
        description: medicineData.description,
        drugAppearance: medicineData.drugAppearance,

        frequency: {
          type: medicineData.frequency.type,
          times: medicineData.frequency.type !== 'as_needed' ? medicineData.frequency.times : [],
          interval: medicineData.frequency.type === 'interval' ? medicineData.frequency.interval || 1 : 1,
          specificDays: medicineData.frequency.type === 'weekly' ? medicineData.frequency.selectedDays : [],
        },

        duration: {
          startDate: medicineData.duration.startDate,
          endDate: medicineData.duration.endDate,
          totalDays: medicineData.duration.totalDays,
        },

        isActive: true,
        color: colors.primary,
        icon: '💊',
      };

      let result;
      if (editMode && medicineId) {
        // Update existing medicine
        result = await updateMedicine(medicineId, medicinePayload);
      } else {
        // Add new medicine
        const newMedicine = {
          userId: user?.userId || '',
          ...medicinePayload,
        };
        result = await addMedicine(newMedicine);
      }

      if (result.success) {
        router.replace('/(tabs)/medicine');
      } else {
        Alert.alert('Error', result.error || `Failed to ${editMode ? 'update' : 'add'} medicine`);
      }
    } catch {
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const toggleDay = (dayId: number) => {
    setMedicineData(prev => ({
      ...prev,
      frequency: {
        ...prev.frequency,
        selectedDays: prev.frequency.selectedDays?.includes(dayId)
          ? prev.frequency.selectedDays.filter((d: number) => d !== dayId)
          : [...(prev.frequency.selectedDays || []), dayId].sort((a: number, b: number) => a - b)
      }
    }));
  };

  const addReminderTime = () => {
    setMedicineData(prev => ({
      ...prev,
      frequency: {
        ...prev.frequency,
        times: [...prev.frequency.times, '12:00']
      }
    }));
  };

  const removeReminderTime = (index: number) => {
    if (medicineData.frequency.times.length > 1) {
      setMedicineData(prev => ({
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
      const newTimes = [...medicineData.frequency.times];
      newTimes[index] = `${hours}:${minutes}`;
      setMedicineData(prev => ({
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

  const scrollToTab = (tabIndex: number) => {
    const tabWidth = screenWidth / 3; // Each tab takes 1/3 of screen width
    setScrollX(tabIndex * tabWidth);
  };

  const handleTabPress = (tabId: string, index: number) => {
    setActiveFrequencyTab(tabId);
    scrollToTab(index);
    setMedicineData(prev => ({
      ...prev,
      frequency: {
        ...prev.frequency,
        type: tabId as 'daily' | 'weekly' | 'interval'
      }
    }));
  };

  const renderFrequencyTab = (tab: FrequencyTab, index: number) => {
    const isActive = activeFrequencyTab === tab.id;

    return (
      <TouchableOpacity
        key={tab.id}
        style={[
          styles.frequencyTab,
          {
            backgroundColor: isActive ? colors.primary : colors.backgroundSecondary,
            borderColor: isActive ? colors.primary : colors.border,
          }
        ]}
        onPress={() => handleTabPress(tab.id, index)}
      >
        <Ionicons
          name={tab.icon}
          size={20}
          color={isActive ? '#FFFFFF' : colors.textSecondary}
        />
        <Text style={[
          styles.frequencyTabText,
          {
            color: isActive ? '#FFFFFF' : colors.text
          }
        ]}>
          {tab.label}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderTabContent = () => {
    switch (activeFrequencyTab) {
      case 'daily':
        return renderDailyContent();
      case 'weekly':
        return renderWeeklyContent();
      case 'interval':
        return renderIntervalContent();
      default:
        return renderDailyContent();
    }
  };

  const renderDailyContent = () => (
    <View style={styles.tabContent}>
      <View style={styles.cardHeader}>
        <Ionicons name="notifications-outline" size={20} color={colors.primary} />
        <Text style={[styles.cardTitle, { color: colors.text }]}>Daily Reminder Times</Text>
      </View>

      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        When should you be reminded to take this medicine?
      </Text>

      <View style={styles.reminderGrid}>
        {medicineData.frequency.times.map((time: string, index: number) => (
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
              {medicineData.frequency.times.length > 1 && (
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
  );

  const renderWeeklyContent = () => (
    <View style={styles.tabContent}>
        <View style={styles.cardHeader}>
          <Ionicons name="calendar-number-outline" size={20} color={colors.primary} />
          <Text style={[styles.cardTitle, { color: colors.text }]}>Select Days</Text>
        </View>

        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Select the days of the week when this medicine should be taken
        </Text>

        <View style={styles.daysGrid}>
          {daysOfWeek.map((day) => (
            <TouchableOpacity
              key={day.id}
              style={[
                styles.dayPill,
                {
                  backgroundColor: medicineData.frequency.selectedDays?.includes(day.id)
                    ? colors.primary
                    : colors.backgroundSecondary,
                  borderColor: medicineData.frequency.selectedDays?.includes(day.id)
                    ? colors.primary
                    : colors.border,
                }
              ]}
              onPress={() => toggleDay(day.id)}
            >
              <Text style={[
                styles.dayText,
                {
                  color: medicineData.frequency.selectedDays?.includes(day.id) ? '#FFFFFF' : colors.text
                }
              ]}>
                {day.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={[styles.divider, { borderBottomColor: colors.border }]} />

        <Text style={[styles.subtitle, { marginTop: 16, color: colors.textSecondary }]}>
          Reminder times for selected days:
        </Text>

        <View style={styles.reminderGrid}>
          {medicineData.frequency.times.map((time: string, index: number) => (
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
                {medicineData.frequency.times.length > 1 && (
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
  );

  const renderIntervalContent = () => (
    <View style={styles.tabContent}>
      <View style={styles.cardHeader}>
        <Ionicons name="timer-outline" size={20} color={colors.primary} />
        <Text style={[styles.cardTitle, { color: colors.text }]}>Interval Settings</Text>
      </View>

      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        Take this medicine every X days
      </Text>

      <View style={styles.intervalRow}>
        <Text style={[styles.intervalLabel, { color: colors.text }]}>Every</Text>
        <TextInput
          style={[styles.intervalInput, {
            backgroundColor: colors.backgroundSecondary,
            borderColor: colors.border,
            color: colors.text
          }]}
          value={medicineData.frequency.interval.toString()}
          onChangeText={(text) => {
            const interval = parseInt(text) || 1;
            setMedicineData(prev => ({
              ...prev,
              frequency: {
                ...prev.frequency,
                interval: Math.max(1, Math.min(30, interval)) // Between 1-30 days
              }
            }));
          }}
          keyboardType="numeric"
          maxLength={2}
        />
        <Text style={[styles.intervalLabel, { color: colors.text }]}>day(s)</Text>
      </View>

      <View style={[styles.divider, { borderBottomColor: colors.border }]} />

      <Text style={[styles.subtitle, { marginTop: 16, color: colors.textSecondary }]}>
        Reminder times for this interval:
      </Text>

      <View style={styles.reminderGrid}>
        {medicineData.frequency.times.map((time: string, index: number) => (
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
              {medicineData.frequency.times.length > 1 && (
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
  );

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
          {editMode ? 'Edit Medicine' : 'Add Medicine'}
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
              Frequency & Duration
            </Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Set when and how long to take this medicine
            </Text>
          </View>

          {/* Frequency Tabs */}
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <Text style={[styles.label, { color: colors.text }]}>Frequency</Text>
            <Text style={[styles.sublabel, { color: colors.textSecondary }]}>
              How often do you need to take this medicine?
            </Text>

            <View style={styles.frequencyTabContainer}>
              {frequencyTabs.map((tab, index) => renderFrequencyTab(tab, index))}
            </View>

            <Text style={[styles.frequencyDescription, { color: colors.textSecondary }]}>
              {frequencyTabs.find(tab => tab.id === activeFrequencyTab)?.description}
            </Text>
          </View>

          {/* Frequency Content */}
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            {renderTabContent()}
          </View>

          {/* Duration Settings */}
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <View style={styles.cardHeader}>
              <Ionicons name="calendar-outline" size={20} color={colors.primary} />
              <Text style={[styles.cardTitle, { color: colors.text }]}>Duration</Text>
            </View>

            <Text style={[styles.sublabel, { color: colors.textSecondary }]}>
              Set how long you need to take this medicine
            </Text>

            <View style={styles.durationRow}>
              <View style={styles.durationInput}>
                <Text style={[styles.durationLabel, { color: colors.text }]}>Start Date</Text>
                <DateTimePicker
                  value={medicineData.duration.startDate}
                  mode="date"
                  onChange={(event, selectedDate) => {
                    if (event.type === 'set' && selectedDate) {
                      setMedicineData(prev => ({
                        ...prev,
                        duration: {
                          ...prev.duration,
                          startDate: selectedDate
                        }
                      }));
                    }
                  }}
                  textColor={colors.text}
                  accentColor={colors.primary}
                />
              </View>

              <View style={styles.durationInput}>
                <Text style={[styles.durationLabel, { color: colors.text }]}>End Date (Optional)</Text>
                <DateTimePicker
                  value={medicineData.duration.endDate || new Date()}
                  mode="date"
                  onChange={(event, selectedDate) => {
                    if (event.type === 'set') {
                      setMedicineData(prev => ({
                        ...prev,
                        duration: {
                          ...prev.duration,
                          endDate: selectedDate
                        }
                      }));
                    }
                  }}
                  textColor={colors.text}
                  accentColor={colors.primary}
                />
              </View>
            </View>
          </View>

  
          {/* Bottom Space for Floating Button */}
          <View style={styles.bottomSpace} />
        </View>
      </ScrollView>

      {/* Floating Save Button */}
      <View style={[styles.floatingButtonContainer, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
        <TouchableOpacity
          style={[
            styles.saveButton,
            {
              backgroundColor: loading ? colors.border : colors.primary,
              opacity: loading ? 0.7 : 1,
            }
          ]}
          onPress={handleSaveMedicine}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <Text style={styles.saveButtonText}>{editMode ? 'Updating...' : 'Adding...'}</Text>
          ) : (
            <>
              <Text style={styles.saveButtonText}>{editMode ? 'Update Medicine' : 'Add Medicine'}</Text>
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
    position: 'relative',
  },
  progressBar: {
    height: '100%',
  },
  progressBackground: {
    position: 'absolute',
    right: 0,
    top: 0,
    width: '50%',
    height: '100%',
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
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
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
  },
  tabContentScroll: {
    height: 400,
    marginBottom: 20,
  },
  tabPage: {
    width: screenWidth,
    paddingHorizontal: 20,
  },
  tabContent: {
    padding: 20,
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
  reminderGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 12,
  },
  reminderItem: {
    width: '50%',
    marginBottom: 12,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timePickerContainer: {
    borderRadius: 8,
    overflow: 'hidden',
    flex: 1,
  },
  removeTimeButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
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
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  dayPill: {
    width: 60,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayText: {
    fontSize: 12,
    fontWeight: '600',
  },
  divider: {
    borderBottomWidth: 1,
    marginVertical: 16,
  },
  intervalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  intervalLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  intervalInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    width: 60,
    textAlign: 'center',
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
    marginBottom: 8,
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