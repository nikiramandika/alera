import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Modal,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, Spacing, BorderRadius, Typography } from '@/constants/theme';
import { useMedicine } from '@/contexts/MedicineContext';
import { MedicineReminder } from '@/types';

export default function AddMedicineScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();
  const { addMedicine } = useMedicine();

  const [medicineData, setMedicineData] = useState({
    medicineName: '',
    dosage: '',
    medicineType: 'Tablet',
    instructions: '',
    stockQuantity: 30,
    stockAlert: 5,
    notes: '',
    color: '#F47B9F',
    icon: 'pill',
    isActive: true,
  });

  const [frequency, setFrequency] = useState({
    type: 'daily' as const,
    times: ['08:00'],
    interval: 8,
    specificDays: [0, 1, 2, 3, 4, 5, 6] as number[],
  });

  const [duration, setDuration] = useState({
    startDate: new Date(),
    endDate: null as Date | null,
    totalDays: null as number | null,
  });

  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedTimeIndex, setSelectedTimeIndex] = useState(0);
  const [loading, setLoading] = useState(false);

  const medicineTypes = ['Tablet', 'Capsule', 'Liquid', 'Injection', 'Cream', 'Inhaler', 'Other'];
  const medicineColors = ['#F47B9F', '#4ECDC4', '#FFD93D', '#A8E6CF', '#FF8B94', '#C9B1FF', '#FFB347'];
  const frequencyTypes = [
    { value: 'daily', label: 'Daily' },
    { value: 'interval', label: 'Every X hours' },
    { value: 'specific_days', label: 'Specific days' },
    { value: 'as_needed', label: 'As needed' },
  ];

  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const handleAddTime = () => {
    setFrequency(prev => ({
      ...prev,
      times: [...prev.times, '12:00']
    }));
  };

  const handleRemoveTime = (index: number) => {
    if (frequency.times.length > 1) {
      setFrequency(prev => ({
        ...prev,
        times: prev.times.filter((_, i) => i !== index)
      }));
    }
  };

  const handleUpdateTime = (index: number, time: string) => {
    setFrequency(prev => ({
      ...prev,
      times: prev.times.map((t, i) => i === index ? time : t)
    }));
  };

  const handleToggleDay = (dayIndex: number) => {
    setFrequency(prev => ({
      ...prev,
      specificDays: prev.specificDays.includes(dayIndex)
        ? prev.specificDays.filter(d => d !== dayIndex)
        : [...prev.specificDays, dayIndex]
    }));
  };

  const handleSave = async () => {
    // Validation
    if (!medicineData.medicineName.trim()) {
      Alert.alert('Error', 'Please enter medicine name');
      return;
    }

    if (!medicineData.dosage.trim()) {
      Alert.alert('Error', 'Please enter dosage');
      return;
    }

    if (frequency.type !== 'as_needed' && frequency.times.length === 0) {
      Alert.alert('Error', 'Please add at least one reminder time');
      return;
    }

    if (frequency.type === 'specific_days' && frequency.specificDays.length === 0) {
      Alert.alert('Error', 'Please select at least one day');
      return;
    }

    setLoading(true);
    try {
      const newMedicine: Omit<MedicineReminder, 'reminderId' | 'userId' | 'createdAt' | 'updatedAt'> = {
        ...medicineData,
        frequency,
        duration,
      };

      const result = await addMedicine(newMedicine);

      if (result.success) {
        Alert.alert('Success', 'Medicine added successfully');
        router.back();
      } else {
        Alert.alert('Error', result.error || 'Failed to add medicine');
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const renderBasicInfo = () => (
    <View style={[styles.section, { backgroundColor: colors.card }]}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Basic Information</Text>

      <View style={styles.inputGroup}>
        <Text style={[styles.label, { color: colors.text }]}>Medicine Name *</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
          value={medicineData.medicineName}
          onChangeText={(text) => setMedicineData(prev => ({ ...prev, medicineName: text }))}
          placeholder="e.g., Paracetamol"
          placeholderTextColor={colors.textSecondary}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={[styles.label, { color: colors.text }]}>Dosage *</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
          value={medicineData.dosage}
          onChangeText={(text) => setMedicineData(prev => ({ ...prev, dosage: text }))}
          placeholder="e.g., 500mg"
          placeholderTextColor={colors.textSecondary}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={[styles.label, { color: colors.text }]}>Medicine Type</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.typeContainer}>
            {medicineTypes.map((type) => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.typeOption,
                  {
                    backgroundColor: medicineData.medicineType === type ? colors.primary : colors.background,
                    borderColor: medicineData.medicineType === type ? colors.primary : colors.border,
                  }
                ]}
                onPress={() => setMedicineData(prev => ({ ...prev, medicineType: type }))}
              >
                <Text style={[
                  styles.typeText,
                  { color: medicineData.medicineType === type ? '#FFFFFF' : colors.text }
                ]}>
                  {type}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      <View style={styles.inputGroup}>
        <Text style={[styles.label, { color: colors.text }]}>Instructions</Text>
        <TextInput
          style={[styles.textArea, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
          value={medicineData.instructions}
          onChangeText={(text) => setMedicineData(prev => ({ ...prev, instructions: text }))}
          placeholder="e.g., Take with food"
          placeholderTextColor={colors.textSecondary}
          multiline
          numberOfLines={3}
        />
      </View>
    </View>
  );

  const renderFrequencySettings = () => (
    <View style={[styles.section, { backgroundColor: colors.card }]}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Frequency</Text>

      <View style={styles.inputGroup}>
        <Text style={[styles.label, { color: colors.text }]}>Schedule Type</Text>
        <View style={styles.frequencyContainer}>
          {frequencyTypes.map((type) => (
            <TouchableOpacity
              key={type.value}
              style={[
                styles.frequencyOption,
                {
                  backgroundColor: frequency.type === type.value ? colors.primary : colors.background,
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
          <Text style={[styles.label, { color: colors.text }]}>Interval (hours)</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
            value={frequency.interval.toString()}
            onChangeText={(text) => setFrequency(prev => ({ ...prev, interval: parseInt(text) || 8 }))}
            keyboardType="numeric"
            placeholder="8"
            placeholderTextColor={colors.textSecondary}
          />
        </View>
      )}

      {frequency.type === 'specific_days' && (
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.text }]}>Select Days</Text>
          <View style={styles.daysContainer}>
            {daysOfWeek.map((day, index) => (
              <TouchableOpacity
                key={day}
                style={[
                  styles.dayOption,
                  {
                    backgroundColor: frequency.specificDays.includes(index) ? colors.primary : colors.background,
                    borderColor: frequency.specificDays.includes(index) ? colors.primary : colors.border,
                  }
                ]}
                onPress={() => handleToggleDay(index)}
              >
                <Text style={[
                  styles.dayText,
                  { color: frequency.specificDays.includes(index) ? '#FFFFFF' : colors.text }
                ]}>
                  {day}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {frequency.type !== 'as_needed' && (
        <View style={styles.inputGroup}>
          <View style={styles.timeHeader}>
            <Text style={[styles.label, { color: colors.text }]}>Reminder Times</Text>
            <TouchableOpacity onPress={handleAddTime}>
              <Ionicons name="add-circle" size={24} color={colors.primary} />
            </TouchableOpacity>
          </View>
          {frequency.times.map((time, index) => (
            <View key={index} style={styles.timeRow}>
              <TouchableOpacity
                style={[styles.timeInput, { backgroundColor: colors.background, borderColor: colors.border }]}
                onPress={() => {
                  setSelectedTimeIndex(index);
                  setShowTimePicker(true);
                }}
              >
                <Text style={[styles.timeText, { color: colors.text }]}>{time}</Text>
                <Ionicons name="time-outline" size={20} color={colors.primary} />
              </TouchableOpacity>
              {frequency.times.length > 1 && (
                <TouchableOpacity
                  style={styles.removeTimeButton}
                  onPress={() => handleRemoveTime(index)}
                >
                  <Ionicons name="remove-circle" size={24} color="#FF6B6B" />
                </TouchableOpacity>
              )}
            </View>
          ))}
        </View>
      )}
    </View>
  );

  const renderDurationSettings = () => (
    <View style={[styles.section, { backgroundColor: colors.card }]}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Duration</Text>

      <View style={styles.inputGroup}>
        <Text style={[styles.label, { color: colors.text }]}>Start Date</Text>
        <TouchableOpacity
          style={[styles.dateInput, { backgroundColor: colors.background, borderColor: colors.border }]}
          onPress={() => setShowDatePicker(true)}
        >
          <Text style={[styles.dateText, { color: colors.text }]}>
            {duration.startDate.toLocaleDateString()}
          </Text>
          <Ionicons name="calendar-outline" size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.inputGroup}>
        <View style={styles.switchRow}>
          <Text style={[styles.label, { color: colors.text }]}>End Date</Text>
          <TouchableOpacity
            style={styles.switchButton}
            onPress={() => setDuration(prev => ({ ...prev, endDate: prev.endDate ? null : new Date() }))}
          >
            <Text style={[styles.switchText, { color: colors.primary }]}>
              {duration.endDate ? 'Remove' : 'Add'}
            </Text>
          </TouchableOpacity>
        </View>
        {duration.endDate && (
          <TouchableOpacity
            style={[styles.dateInput, { backgroundColor: colors.background, borderColor: colors.border }]}
            onPress={() => setShowDatePicker(true)}
          >
            <Text style={[styles.dateText, { color: colors.text }]}>
              {duration.endDate.toLocaleDateString()}
            </Text>
            <Ionicons name="calendar-outline" size={20} color={colors.primary} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const renderStockSettings = () => (
    <View style={[styles.section, { backgroundColor: colors.card }]}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Stock Management</Text>

      <View style={styles.inputGroup}>
        <Text style={[styles.label, { color: colors.text }]}>Current Stock</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
          value={medicineData.stockQuantity.toString()}
          onChangeText={(text) => setMedicineData(prev => ({ ...prev, stockQuantity: parseInt(text) || 0 }))}
          keyboardType="numeric"
          placeholder="30"
          placeholderTextColor={colors.textSecondary}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={[styles.label, { color: colors.text }]}>Alert When Below</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
          value={medicineData.stockAlert.toString()}
          onChangeText={(text) => setMedicineData(prev => ({ ...prev, stockAlert: parseInt(text) || 5 }))}
          keyboardType="numeric"
          placeholder="5"
          placeholderTextColor={colors.textSecondary}
        />
      </View>
    </View>
  );

  const renderColorSelection = () => (
    <View style={[styles.section, { backgroundColor: colors.card }]}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Color</Text>
      <View style={styles.colorContainer}>
        {medicineColors.map((color) => (
          <TouchableOpacity
            key={color}
            style={[
              styles.colorOption,
              { backgroundColor: color },
              medicineData.color === color && styles.selectedColor
            ]}
            onPress={() => setMedicineData(prev => ({ ...prev, color }))}
          >
            {medicineData.color === color && (
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

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Add Medicine</Text>
        <TouchableOpacity onPress={handleSave} disabled={loading}>
          <Text style={[styles.saveButton, { color: colors.primary }]}>
            {loading ? 'Saving...' : 'Save'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {renderBasicInfo()}
        {renderFrequencySettings()}
        {renderDurationSettings()}
        {renderStockSettings()}
        {renderColorSelection()}

        <View style={styles.footerSpace} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E7',
  },
  headerTitle: {
    ...Typography.h3,
    fontWeight: '600',
  },
  saveButton: {
    ...Typography.body,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  section: {
    margin: Spacing.lg,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
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
  sectionTitle: {
    ...Typography.h4,
    fontWeight: '600',
    marginBottom: Spacing.md,
  },
  inputGroup: {
    marginBottom: Spacing.md,
  },
  label: {
    ...Typography.body,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  input: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: 16,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: 16,
    height: 80,
    textAlignVertical: 'top',
  },
  typeContainer: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  typeOption: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  typeText: {
    ...Typography.caption,
    fontWeight: '600',
  },
  frequencyContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  frequencyOption: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  frequencyText: {
    ...Typography.caption,
    fontWeight: '600',
  },
  daysContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dayOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  dayText: {
    ...Typography.small,
    fontWeight: '600',
  },
  timeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  timeInput: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginRight: Spacing.sm,
  },
  timeText: {
    ...Typography.body,
  },
  removeTimeButton: {
    alignItems: 'center',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  switchButton: {
    padding: Spacing.sm,
  },
  switchText: {
    ...Typography.body,
    fontWeight: '600',
  },
  dateInput: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
  },
  dateText: {
    ...Typography.body,
  },
  colorContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  colorOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedColor: {
    borderWidth: 3,
    borderColor: '#FFFFFF',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      }
    })
  },
  footerSpace: {
    height: 64,
  },
});