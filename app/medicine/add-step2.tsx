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
import { useMedicine } from '@/contexts/MedicineContext';
import { useAuth } from '@/contexts/AuthContext';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';

interface Step1Data {
  medicineName?: string;
  dosage?: string;
  medicineType?: string;
  instructions?: string;
  stockQuantity?: number;
  stockAlert?: number;
}

interface FrequencyOption {
  id: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  description: string;
}

const frequencyOptions: FrequencyOption[] = [
  {
    id: 'daily',
    label: 'Daily',
    icon: 'calendar-outline',
    description: 'Every day at the same time'
  },
  {
    id: 'weekly',
    label: 'Weekly',
    icon: 'calendar-number-outline',
    description: 'On specific days each week'
  },
  {
    id: 'as-needed',
    label: 'As Needed',
    icon: 'help-circle-outline',
    description: 'Only when symptoms occur'
  },
];

const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function AddMedicineStep2Screen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { addMedicine } = useMedicine();
  const { user } = useAuth();
  const params = useLocalSearchParams();

  // Parse step1 data
  const step1Data = params.step1Data ? JSON.parse(params.step1Data as string) as Step1Data : {};

  const [activeFrequencyTab, setActiveFrequencyTab] = useState('daily');
  const [loading, setLoading] = useState(false);

  const [medicineData, setMedicineData] = useState({
    medicineName: step1Data.medicineName || '',
    dosage: step1Data.dosage || '',
    medicineType: step1Data.medicineType || 'Tablet',
    instructions: step1Data.instructions || '',

    // Frequency settings
    frequency: 'daily',
    selectedDays: [0, 1, 2, 3, 4, 5, 6], // All days by default

    // Reminder settings
    reminderTimes: ['08:00'],

    // Stock settings
    stockQuantity: step1Data.stockQuantity || 30,
    stockAlert: step1Data.stockAlert || 5,
  });

  const handleSaveMedicine = async () => {
    setLoading(true);
    try {
      const newMedicine = {
        userId: user?.userId || '',
        medicineName: medicineData.medicineName,
        dosage: medicineData.dosage,
        medicineType: medicineData.medicineType,
        instructions: medicineData.instructions,
        frequency: {
          type: activeFrequencyTab === 'weekly' ? 'specific_days' : activeFrequencyTab === 'as-needed' ? 'as_needed' : 'daily' as 'daily' | 'specific_days' | 'as-needed' | 'interval',
          times: activeFrequencyTab !== 'as-needed' ? medicineData.reminderTimes : [],
          specificDays: activeFrequencyTab === 'weekly' ? medicineData.selectedDays : undefined,
        },
        duration: {
          startDate: new Date(),
          endDate: null,
          totalDays: null,
        },
        stockQuantity: medicineData.stockQuantity,
        stockAlert: medicineData.stockAlert,
        stock: {
          current: medicineData.stockQuantity,
          currentStock: medicineData.stockQuantity,
          refillThreshold: medicineData.stockAlert,
          unit: medicineData.medicineType.toLowerCase() === 'liquid' ? 'ml' : 'tablets',
          lastUpdated: new Date(),
        },
        isActive: true,
        color: '#4ECDC4',
        icon: '💊',
      };

      const result = await addMedicine(newMedicine);

      if (result.success) {
        router.replace('/(tabs)/medicine');
      } else {
        Alert.alert('Error', result.error || 'Failed to add medicine');
      }
    } catch {
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const toggleDay = (dayIndex: number) => {
    setMedicineData(prev => ({
      ...prev,
      selectedDays: prev.selectedDays.includes(dayIndex)
        ? prev.selectedDays.filter((d: number) => d !== dayIndex)
        : [...prev.selectedDays, dayIndex].sort((a: number, b: number) => a - b)
    }));
  };

  const addReminderTime = () => {
    setMedicineData(prev => ({
      ...prev,
      reminderTimes: [...prev.reminderTimes, '12:00']
    }));
  };

  const removeReminderTime = (index: number) => {
    if (medicineData.reminderTimes.length > 1) {
      setMedicineData(prev => ({
        ...prev,
        reminderTimes: prev.reminderTimes.filter((_: string, i: number) => i !== index)
      }));
    }
  };

  const handleTimeChange = (event: DateTimePickerEvent, selectedDate?: Date, index?: number) => {
    if (event.type === 'set' && selectedDate && index !== undefined) {
      const hours = selectedDate.getHours().toString().padStart(2, '0');
      const minutes = selectedDate.getMinutes().toString().padStart(2, '0');
      const newTimes = [...medicineData.reminderTimes];
      newTimes[index] = `${hours}:${minutes}`;
      setMedicineData(prev => ({ ...prev, reminderTimes: newTimes }));
    }
  };

  const convertTimeToDate = (timeString: string) => {
    const [hours, minutes] = timeString.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date;
  };

  const renderFrequencyTab = (option: FrequencyOption) => (
    <TouchableOpacity
      key={option.id}
      style={[
        styles.frequencyTab,
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
        styles.frequencyTabText,
        {
          color: activeFrequencyTab === option.id ? '#FFFFFF' : colors.text
        }
      ]}>
        {option.label}
      </Text>
    </TouchableOpacity>
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
          Add Medicine
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
              Schedule & Stock
            </Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Set reminder times and manage your medicine stock
            </Text>
          </View>

          {/* Frequency Tabs */}
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <Text style={[styles.label, { color: colors.text }]}>Frequency</Text>
            <Text style={[styles.sublabel, { color: colors.textSecondary }]}>
              How often do you need to take this medicine?
            </Text>
            <View style={styles.frequencyTabContainer}>
              {frequencyOptions.map(renderFrequencyTab)}
            </View>

            {/* Frequency Description */}
            <Text style={[styles.frequencyDescription, { color: colors.textSecondary }]}>
              {frequencyOptions.find(opt => opt.id === activeFrequencyTab)?.description}
            </Text>

            {/* Weekly Days Selection */}
            {activeFrequencyTab === 'weekly' && (
              <View style={styles.weeklyDaysSection}>
                <Text style={[styles.sublabel, { color: colors.text }]}>
                  Select days:
                </Text>
                <View style={styles.daysGrid}>
                  {daysOfWeek.map((day, index) => (
                    <TouchableOpacity
                      key={day}
                      style={[
                        styles.dayPill,
                        {
                          backgroundColor: medicineData.selectedDays.includes(index)
                            ? colors.primary
                            : colors.backgroundSecondary,
                          borderColor: medicineData.selectedDays.includes(index)
                            ? colors.primary
                            : colors.border,
                        }
                      ]}
                      onPress={() => toggleDay(index)}
                    >
                      <Text style={[
                        styles.dayText,
                        { color: medicineData.selectedDays.includes(index) ? '#FFFFFF' : colors.text }
                      ]}>
                        {day}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
          </View>

          {/* Reminder Times */}
          {activeFrequencyTab !== 'as-needed' && (
            <View style={[styles.card, { backgroundColor: colors.card }]}>
              <View style={styles.cardHeader}>
                <Ionicons name="notifications-outline" size={20} color={colors.primary} />
                <Text style={[styles.cardTitle, { color: colors.text }]}>Reminder Times</Text>
              </View>

              <Text style={[styles.sublabel, { color: colors.textSecondary }]}>
                When should you be reminded to take this medicine?
              </Text>

              <View style={styles.reminderGrid}>
                {medicineData.reminderTimes.map((time: string, index: number) => (
                  <View key={index} style={styles.reminderItem}>
                    <View style={styles.timeRow}>
                      <View style={[styles.timePickerContainer, { backgroundColor: colors.backgroundSecondary, flex: 1 }]}>
                        <DateTimePicker
                          testID={`timePicker${index}`}
                          value={convertTimeToDate(time)}
                          mode="time"
                          onChange={(event, selectedTime) => handleTimeChange(event, selectedTime, index)}
                          textColor={colors.text}
                          accentColor={colors.primary}
                          style={{ backgroundColor: colors.backgroundSecondary }}
                        />
                      </View>
                      {medicineData.reminderTimes.length > 1 && (
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
          )}

          {/* Stock Management */}
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <View style={styles.cardHeader}>
              <Ionicons name="cube-outline" size={20} color={colors.primary} />
              <Text style={[styles.cardTitle, { color: colors.text }]}>Stock Management</Text>
            </View>

            <View style={styles.stockRow}>
              <View style={styles.stockInput}>
                <Text style={[styles.stockLabel, { color: colors.text }]}>Current Stock</Text>
                <TextInput
                  style={[styles.input, {
                    backgroundColor: colors.backgroundSecondary,
                    borderColor: colors.border,
                    color: colors.text
                  }]}
                  value={medicineData.stockQuantity.toString()}
                  onChangeText={(text) => setMedicineData(prev => ({
                    ...prev,
                    stockQuantity: parseInt(text) || 0
                  }))}
                  keyboardType="numeric"
                  placeholder="0"
                />
              </View>
              <View style={styles.stockInput}>
                <Text style={[styles.stockLabel, { color: colors.text }]}>Alert When Below</Text>
                <TextInput
                  style={[styles.input, {
                    backgroundColor: colors.backgroundSecondary,
                    borderColor: colors.border,
                    color: colors.text
                  }]}
                  value={medicineData.stockAlert.toString()}
                  onChangeText={(text) => setMedicineData(prev => ({
                    ...prev,
                    stockAlert: parseInt(text) || 5
                  }))}
                  keyboardType="numeric"
                  placeholder="5"
                />
              </View>
            </View>

            <Text style={[styles.stockHint, { color: colors.textSecondary }]}>
              You&apos;ll be notified when your medicine stock is running low
            </Text>
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
          onPress={handleSaveMedicine}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <Text style={styles.saveButtonText}>Adding...</Text>
          ) : (
            <>
              <Text style={styles.saveButtonText}>Add Medicine</Text>
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
    marginBottom: 12,
  },
  sublabel: {
    fontSize: 14,
    marginBottom: 16,
    lineHeight: 20,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
  },
  frequencyTabContainer: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  frequencyTab: {
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
  frequencyTabText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
  },
  frequencyDescription: {
    fontSize: 14,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  weeklyDaysSection: {
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
  reminderGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 12,
  },
  reminderItem: {
    width: '48%',
    marginBottom: 8,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timePickerContainer: {
    borderRadius: 8,
    overflow: 'hidden',
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
  stockRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  stockInput: {
    flex: 1,
  },
  stockLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  stockHint: {
    fontSize: 12,
    fontStyle: 'italic',
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