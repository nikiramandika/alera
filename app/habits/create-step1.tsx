import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import { habitService } from '@/services';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from 'react-i18next';

interface HabitData {
  habitName?: string;
  habitType?: string;
  description?: string;
  target?: {
    value?: number;
    unit?: string;
  };
  color?: string;
  icon?: string;
}

interface HabitTypeOption {
  id: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  emoji: string;
  color: string;
  defaultUnit: string;
  defaultTarget: number;
}

export default function AddHabitStep1NewScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const params = useLocalSearchParams();
  const { user } = useAuth();
  const { t } = useTranslation();

  const habitTypes: HabitTypeOption[] = [
    { id: 'water', label: t('habits.waterIntake'), icon: 'water-outline', emoji: '💧', color: '#3498db', defaultUnit: t('habits.glasses'), defaultTarget: 8 },
    { id: 'exercise', label: t('habits.exercise'), icon: 'fitness-outline', emoji: '🏃', color: '#e74c3c', defaultUnit: t('habits.minutes'), defaultTarget: 30 },
    { id: 'sleep', label: t('habits.sleep'), icon: 'moon-outline', emoji: '🌙', color: '#9b59b6', defaultUnit: t('habits.hours'), defaultTarget: 8 },
    { id: 'meditation', label: t('habits.meditation'), icon: 'leaf-outline', emoji: '🧘', color: '#2ecc71', defaultUnit: t('habits.minutes'), defaultTarget: 15 },
    { id: 'reading', label: t('habits.reading'), icon: 'book-outline', emoji: '📚', color: '#f39c12', defaultUnit: t('habits.pages'), defaultTarget: 20 },
    { id: 'health', label: t('habits.health'), icon: 'heart-outline', emoji: '❤️', color: '#e91e63', defaultUnit: t('habits.times'), defaultTarget: 1 },
    { id: 'custom', label: t('habits.custom'), icon: 'star-outline', emoji: '⭐', color: '#34495e', defaultUnit: t('habits.times'), defaultTarget: 1 },
  ];

  // Check if edit mode
  const editMode = params.editMode === 'true';
  const habitId = params.habitId as string;

  // Get edit data from params if exists
  const editData = params.habitData ? JSON.parse(params.habitData as string) as HabitData : null;

  const [habitData, setHabitData] = useState<HabitData>({
    habitName: editData?.habitName || '',
    habitType: editData?.habitType || 'custom',
    description: editData?.description || '',
    target: {
      value: editData?.target?.value || 1,
      unit: editData?.target?.unit || 'times',
    },
    color: editData?.color || '#4ECDC4',
    icon: editData?.icon || 'checkmark-circle-outline',
  });

  // Load existing habit data for edit mode
  useEffect(() => {
    if (editMode && habitId && user && !editData) {
      // Only load from API if we don't have data from params
      const loadHabitData = async () => {
        try {
          console.log('Loading habit data for edit (step 1):', habitId);
          const habit = await habitService.getHabitById(user.userId, habitId);

          if (habit) {
            console.log('Loaded habit data (step 1):', habit);

            // Update habitData with loaded data from API
            setHabitData(prev => ({
              ...prev,
              habitName: habit.habitName || prev.habitName,
              habitType: habit.habitType || prev.habitType,
              description: habit.description || prev.description,
              target: {
                value: habit.target?.value || prev.target?.value || 1,
                unit: habit.target?.unit || prev.target?.unit || 'times',
              },
              color: habit.color || prev.color,
              icon: habit.icon || prev.icon,
            }));
          }
        } catch (error) {
          console.error('Error loading habit data (step 1):', error);
        }
      };

      loadHabitData();
    }
  }, [editMode, habitId, user, editData]);

  const handleNext = () => {
    if (!habitData.habitName?.trim()) {
      Alert.alert(t('common.error'), t('habits.pleaseEnterHabitName'));
      return;
    }

    if (!habitData.target?.value || habitData.target.value <= 0) {
      Alert.alert(t('common.error'), t('habits.pleaseEnterValidTargetValue'));
      return;
    }

    // Prepare data for step 2
    const step2Data = {
      ...habitData,
      target: {
        ...habitData.target,
        value: Math.max(1, habitData.target?.value || 1), // Ensure minimum value is 1
      },
      editMode,
      habitId,
    };

    router.push({
      pathname: '/habits/create-step2',
      params: {
        step1Data: JSON.stringify(step2Data)
      }
    });
  };

  const renderHabitTypeOption = (type: HabitTypeOption) => {
    return (
      <TouchableOpacity
        key={type.id}
        style={[
          styles.typeOption,
          {
            backgroundColor: habitData.habitType === type.id
              ? type.color
              : colors.backgroundSecondary,
            borderColor: habitData.habitType === type.id
              ? type.color
              : colors.border,
          }
        ]}
        onPress={() => {
          setHabitData(prevData => ({
            ...prevData,
            habitType: type.id,
            target: {
              ...prevData.target,
              unit: type.defaultUnit,
              value: type.defaultTarget,
            },
            color: type.color,
            icon: type.emoji, // Save emoji to database
          }));
        }}
      >
        <Text style={{ fontSize: 20, marginBottom: 2 }}>
          {type.emoji}
        </Text>
        <Text style={[
          styles.typeText,
          {
            color: habitData.habitType === type.id ? '#FFFFFF' : colors.text,
            marginTop: 2
          }
        ]}>
          {type.label}
        </Text>
      </TouchableOpacity>
    );
  };

  const getCurrentUnit = () => {
    const selectedType = habitTypes.find(t => t.id === habitData.habitType);
    return selectedType?.defaultUnit || t('habits.times');
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
          {editMode ? t('habits.editHabit') : t('habits.addHabit')}
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
            <View style={[styles.stepActive, { backgroundColor: colors.primary }]}>
              <Text style={styles.stepActiveText}>1</Text>
            </View>
            <View style={[styles.stepLine, { backgroundColor: colors.border }]} />
            <View style={[styles.stepInactive, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}>
              <Text style={[styles.stepInactiveText, { color: colors.textSecondary }]}>2</Text>
            </View>
          </View>

          {/* Title */}
          <View style={styles.section}>
            <Text style={[styles.title, { color: colors.text }]}>
              {t('habits.habitInformation')}
            </Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              {t('habits.enterBasicDetails')}
            </Text>
          </View>

          {/* Habit Name Input */}
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <Text style={[styles.label, { color: colors.text }]}>{t('habits.habitName')}</Text>
            <TextInput
              style={[styles.input, {
                backgroundColor: colors.backgroundSecondary,
                borderColor: colors.border,
                color: colors.text
              }]}
              placeholder={t('habits.enterHabitName')}
              placeholderTextColor={colors.textSecondary}
              value={habitData.habitName}
              onChangeText={(text) => setHabitData(prev => ({ ...prev, habitName: text }))}
            />
          </View>

          {/* Habit Type Selection */}
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <Text style={[styles.label, { color: colors.text }]}>{t('habits.habitType')}</Text>
            <Text style={[styles.sublabel, { color: colors.textSecondary }]}>
              {t('habits.selectTypeAutoAdjust')}
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.typeContainer}>
                {habitTypes.map(renderHabitTypeOption)}
              </View>
            </ScrollView>
          </View>

          {/* Target Input (Auto-adjust based on type) */}
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <Text style={[styles.label, { color: colors.text }]}>{t('habits.target')}</Text>
            <Text style={[styles.sublabel, { color: colors.textSecondary }]}>
              {t('habits.amountPerSession')}
            </Text>
            <View style={styles.targetContainer}>
              <TextInput
                style={[styles.targetInput, {
                  backgroundColor: colors.backgroundSecondary,
                  borderColor: colors.border,
                  color: colors.text,
                }]}
                placeholder={t('habits.targetPlaceholderExample')}
                placeholderTextColor={colors.textSecondary}
                value={habitData.target?.value && habitData.target.value > 0 ? habitData.target.value.toString() : ''}
                onChangeText={(text) => {
                  const numericValue = text.replace(/[^0-9]/g, '');
                  setHabitData(prev => ({
                    ...prev,
                    target: {
                      ...prev.target!,
                      value: numericValue ? parseInt(numericValue) : 0
                    }
                  }));
                }}
                keyboardType="numeric"
                maxLength={4}
              />
              <Text style={[styles.targetUnit, { color: colors.textSecondary }]}>
                {getCurrentUnit()}
              </Text>
            </View>
          </View>

          {/* Description Input */}
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <Text style={[styles.label, { color: colors.text }]}>{t('habits.descriptionOptional')}</Text>
            <Text style={[styles.sublabel, { color: colors.textSecondary }]}>
              {t('habits.addSpecialInstructions')}
            </Text>
            <TextInput
              style={[styles.textArea, {
                backgroundColor: colors.backgroundSecondary,
                borderColor: colors.border,
                color: colors.text
              }]}
              placeholder={t('habits.enterSpecialInstructions')}
              placeholderTextColor={colors.textSecondary}
              value={habitData.description}
              onChangeText={(text) => setHabitData(prev => ({ ...prev, description: text }))}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          {/* Bottom Space for Floating Button */}
          <View style={styles.bottomSpace} />
        </View>
      </ScrollView>

      {/* Floating Next Button */}
      <View style={[styles.floatingButtonContainer, { backgroundColor: colors.background }]}>
        <TouchableOpacity
          style={[styles.nextButton, { backgroundColor: colors.primary }]}
          onPress={handleNext}
          activeOpacity={0.8}
        >
          <Text style={styles.nextButtonText}>{t('habits.next')}</Text>
          <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
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
    width: '50%',
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
  stepInactive: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepInactiveText: {
    fontSize: 16,
    fontWeight: '600',
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
  typeContainer: {
    flexDirection: 'row',
    paddingHorizontal: 5,
  },
  typeOption: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginRight: 12,
    minWidth: 80,
  },
  typeText: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  targetContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  targetInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    marginRight: 12,
  },
  targetUnit: {
    fontSize: 16,
    fontWeight: '500',
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    minHeight: 100,
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
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 28,
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
});