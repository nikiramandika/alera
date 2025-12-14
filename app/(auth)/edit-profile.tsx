import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';

export default function EditProfileScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { user, updateUserProfile } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [editForm, setEditForm] = useState({
    displayName: user?.displayName || '',
    gender: user?.profile?.gender || '',
    weight: user?.profile?.weight?.toString() || '',
    birthDate: user?.profile?.birthDate ? new Date(user.profile.birthDate) : new Date(1998, 0, 1),
  });

  // Function to calculate age from birth date
  const calculateAge = (birthDate: Date): number => {
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    return age;
  };

  // Function to show date picker
  const showDatepicker = () => {
    setShowDatePicker(true);
  };

  // Helper function to generate years array
  const generateYears = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let year = currentYear; year >= 1900; year--) {
      years.push(year);
    }
    return years;
  };

  // Helper function to generate months array
  const generateMonths = () => {
    return [
      { value: 0, label: 'January' },
      { value: 1, label: 'February' },
      { value: 2, label: 'March' },
      { value: 3, label: 'April' },
      { value: 4, label: 'May' },
      { value: 5, label: 'June' },
      { value: 6, label: 'July' },
      { value: 7, label: 'August' },
      { value: 8, label: 'September' },
      { value: 9, label: 'October' },
      { value: 10, label: 'November' },
      { value: 11, label: 'December' },
    ];
  };

  // Helper function to generate days array based on selected month and year
  const generateDays = (year: number, month: number) => {
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days = [];
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }
    return days;
  };

  const years = generateYears();
  const months = generateMonths();
  const days = generateDays(
    editForm.birthDate.getFullYear(),
    editForm.birthDate.getMonth()
  );

  const handleSaveProfile = async () => {
    // Validation
    if (!editForm.displayName.trim()) {
      Alert.alert('Error', 'Name is required');
      return;
    }

    if (editForm.weight && (isNaN(Number(editForm.weight)) || Number(editForm.weight) <= 0)) {
      Alert.alert('Error', 'Please enter a valid weight');
      return;
    }

    // Validate birth date (age between 10-120 years)
    const calculatedAge = calculateAge(editForm.birthDate);
    if (calculatedAge < 10 || calculatedAge > 120) {
      Alert.alert('Error', 'Please enter a valid birth date (age between 10-120 years)');
      return;
    }

    // Additional validation to ensure the date is valid
    if (isNaN(editForm.birthDate.getTime())) {
      Alert.alert('Error', 'Invalid birth date. Please select a valid date.');
      return;
    }

    // Create a new date object to ensure it's valid and serialize properly
    const validBirthDate = new Date(
      editForm.birthDate.getFullYear(),
      editForm.birthDate.getMonth(),
      editForm.birthDate.getDate()
    );

    // Double-check the created date is valid
    if (isNaN(validBirthDate.getTime())) {
      Alert.alert('Error', 'Invalid birth date. Please select a valid date.');
      return;
    }

    const profileData: any = {
      displayName: editForm.displayName.trim(),
      profile: {
        gender: editForm.gender,
        weight: editForm.weight ? Number(editForm.weight) : undefined,
        age: calculatedAge,
        birthDate: validBirthDate,
      }
    };

    setLoading(true);
    try {
      const result = await updateUserProfile(profileData);
      if (result.success) {
        Alert.alert('Success', 'Profile updated successfully', [
          {
            text: 'OK',
            onPress: () => router.back()
          }
        ]);
      } else {
        Alert.alert('Error', result.error || 'Failed to update profile');
      }
    } catch {
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />

      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.headerButton}
        >
          <Text style={[styles.headerButtonText, { color: colors.textSecondary }]}>
            Cancel
          </Text>
        </TouchableOpacity>

        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Edit Profile
        </Text>

        <TouchableOpacity
          onPress={handleSaveProfile}
          disabled={loading}
          style={[styles.headerButton, { opacity: loading ? 0.6 : 1 }]}
        >
          <Text style={[styles.headerButtonText, { color: colors.primary, fontWeight: '600' }]}>
            {loading ? 'Saving...' : 'Save'}
          </Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.formSection}>
            <Text style={[styles.formLabel, { color: colors.text }]}>
              Name
            </Text>
            <TextInput
              style={[
                styles.textInput,
                {
                  backgroundColor: colors.card,
                  color: colors.text,
                  borderColor: colors.border,
                }
              ]}
              value={editForm.displayName}
              onChangeText={(text) => setEditForm(prev => ({ ...prev, displayName: text }))}
              placeholder="Enter your name"
              placeholderTextColor={colors.textSecondary}
              autoCapitalize="words"
            />
          </View>

          <View style={styles.formSection}>
            <Text style={[styles.formLabel, { color: colors.text }]}>
              Gender
            </Text>
            <View style={styles.genderOptions}>
              {['male', 'female'].map((gender) => (
                <TouchableOpacity
                  key={gender}
                  style={[
                    styles.genderOption,
                    {
                      backgroundColor: editForm.gender === gender ? colors.primary : colors.card,
                      borderColor: colors.border,
                    }
                  ]}
                  onPress={() => setEditForm(prev => ({ ...prev, gender }))}
                >
                  <Text style={[
                    styles.genderOptionText,
                    {
                      color: editForm.gender === gender ? '#FFFFFF' : colors.text,
                    }
                  ]}>
                    {gender.charAt(0).toUpperCase() + gender.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.formSection}>
            <Text style={[styles.formLabel, { color: colors.text }]}>
              Weight (kg)
            </Text>
            <TextInput
              style={[
                styles.textInput,
                {
                  backgroundColor: colors.card,
                  color: colors.text,
                  borderColor: colors.border,
                }
              ]}
              value={editForm.weight}
              onChangeText={(text) => setEditForm(prev => ({ ...prev, weight: text }))}
              placeholder="Enter your weight"
              placeholderTextColor={colors.textSecondary}
              keyboardType="numeric"
            />
          </View>

          <View style={styles.formSection}>
            <Text style={[styles.formLabel, { color: colors.text }]}>
              Birth Date
            </Text>
            <TouchableOpacity
              style={[
                styles.birthDateInput,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                }
              ]}
              onPress={showDatepicker}
            >
              <Text style={[styles.birthDateText, { color: colors.text }]}>
                {editForm.birthDate.toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </Text>
              <Ionicons name="calendar-outline" size={20} color={colors.primary} />
            </TouchableOpacity>
            <Text style={[styles.ageHint, { color: colors.textSecondary }]}>
              Age: {calculateAge(editForm.birthDate)} years
            </Text>

            {/* Date Picker Modal */}
            {showDatePicker && (
              <Modal
                transparent={true}
                animationType="slide"
                visible={showDatePicker}
                onRequestClose={() => setShowDatePicker(false)}
              >
                <View style={styles.modalOverlay}>
                  <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
                    <View style={styles.modalHeader}>
                      <TouchableOpacity
                        onPress={() => setShowDatePicker(false)}
                        style={styles.modalButton}
                      >
                        <Text style={[styles.modalButtonText, { color: colors.primary }]}>
                          Cancel
                        </Text>
                      </TouchableOpacity>
                      <Text style={[styles.modalTitle, { color: colors.text }]}>
                        Select Birth Date
                      </Text>
                      <TouchableOpacity
                        onPress={() => setShowDatePicker(false)}
                        style={styles.modalButton}
                      >
                        <Text style={[styles.modalButtonText, { color: colors.primary }]}>
                          Done
                        </Text>
                      </TouchableOpacity>
                    </View>

                    <View style={styles.datePickerContainer}>
                      <ScrollView style={styles.dateColumn} showsVerticalScrollIndicator={false}>
                        {days.map(day => (
                          <TouchableOpacity
                            key={day}
                            style={[
                              styles.dateOption,
                              {
                                backgroundColor: day === editForm.birthDate.getDate()
                                  ? colors.primary
                                  : 'transparent'
                              }
                            ]}
                            onPress={() => {
                              const newDate = new Date(editForm.birthDate);
                              newDate.setDate(day);
                              setEditForm({ ...editForm, birthDate: newDate });
                            }}
                          >
                            <Text style={[
                              styles.dateOptionText,
                              {
                                color: day === editForm.birthDate.getDate()
                                  ? '#FFFFFF'
                                  : colors.text
                              }
                            ]}>
                              {day}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>

                      <ScrollView style={styles.dateColumn} showsVerticalScrollIndicator={false}>
                        {months.map(month => (
                          <TouchableOpacity
                            key={month.value}
                            style={[
                              styles.dateOption,
                              {
                                backgroundColor: month.value === editForm.birthDate.getMonth()
                                  ? colors.primary
                                  : 'transparent'
                              }
                            ]}
                            onPress={() => {
                              const newDate = new Date(editForm.birthDate);
                              newDate.setMonth(month.value);
                              setEditForm({ ...editForm, birthDate: newDate });
                            }}
                          >
                            <Text style={[
                              styles.dateOptionText,
                              {
                                color: month.value === editForm.birthDate.getMonth()
                                  ? '#FFFFFF'
                                  : colors.text
                              }
                            ]}>
                              {month.label}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>

                      <ScrollView style={styles.dateColumn} showsVerticalScrollIndicator={false}>
                        {years.map(year => (
                          <TouchableOpacity
                            key={year}
                            style={[
                              styles.dateOption,
                              {
                                backgroundColor: year === editForm.birthDate.getFullYear()
                                  ? colors.primary
                                  : 'transparent'
                              }
                            ]}
                            onPress={() => {
                              const newDate = new Date(editForm.birthDate);
                              newDate.setFullYear(year);
                              setEditForm({ ...editForm, birthDate: newDate });
                            }}
                          >
                            <Text style={[
                              styles.dateOptionText,
                              {
                                color: year === editForm.birthDate.getFullYear()
                                  ? '#FFFFFF'
                                  : colors.text
                              }
                            ]}>
                              {year}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                  </View>
                </View>
              </Modal>
            )}
          </View>

          <View style={styles.formSection}>
            <Text style={[styles.formNote, { color: colors.textSecondary }]}>
              Email cannot be changed. Contact support if you need to update your email address.
            </Text>
          </View>

          {/* Add some padding at the bottom */}
          <View style={styles.bottomPadding} />
        </ScrollView>
      </KeyboardAvoidingView>
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
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  headerButton: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.sm,
  },
  headerButtonText: {
    fontSize: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: Spacing.lg,
  },
  formSection: {
    marginBottom: Spacing.xl,
  },
  formLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: Spacing.sm,
    color: '#11181C',
  },
  textInput: {
    height: 48,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    fontSize: 16,
  },
  genderOptions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  genderOption: {
    flex: 1,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    alignItems: 'center',
  },
  genderOptionText: {
    fontSize: 16,
    fontWeight: '500',
  },
  formNote: {
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
    fontStyle: 'italic',
    color: '#666',
  },
  bottomPadding: {
    height: 40,
  },
  birthDateInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 48,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
  },
  birthDateText: {
    fontSize: 16,
    flex: 1,
  },
  ageHint: {
    fontSize: 14,
    marginTop: Spacing.sm,
    fontStyle: 'italic',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalButton: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.sm,
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  datePickerContainer: {
    flexDirection: 'row',
    height: 200,
    padding: Spacing.md,
  },
  dateColumn: {
    flex: 1,
    marginHorizontal: 4,
  },
  dateOption: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    marginVertical: 1,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
    minHeight: 35,
    justifyContent: 'center',
  },
  dateOptionText: {
    fontSize: 14,
    textAlign: 'center',
  },
});