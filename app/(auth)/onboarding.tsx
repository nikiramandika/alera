import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  Alert,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { OnboardingData } from '@/types';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, Spacing, BorderRadius, Typography } from '@/constants/theme';
import { useTranslation } from 'react-i18next';

export default function OnboardingScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { updateUserProfile, user } = useAuth();

  const [currentStep, setCurrentStep] = useState(0);
  const [onboardingData, setOnboardingData] = useState<OnboardingData>({
    gender: 'female',
    weight: 60,
    birthDate: new Date(1998, 0, 1), // Default birth date (Jan 1, 1998)
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [weightInput, setWeightInput] = useState(onboardingData.weight.toString());
  const [loading, setLoading] = useState(false);

  // Sync weightInput with onboardingData weight
  useEffect(() => {
    setWeightInput(onboardingData.weight.toString());
  }, [onboardingData.weight]);

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
      { value: 0, label: t('profile.january') },
      { value: 1, label: t('profile.february') },
      { value: 2, label: t('profile.march') },
      { value: 3, label: t('profile.april') },
      { value: 4, label: t('profile.may') },
      { value: 5, label: t('profile.june') },
      { value: 6, label: t('profile.july') },
      { value: 7, label: t('profile.august') },
      { value: 8, label: t('profile.september') },
      { value: 9, label: t('profile.october') },
      { value: 10, label: t('profile.november') },
      { value: 11, label: t('profile.december') },
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
  const days = generateDays(onboardingData.birthDate.getFullYear(), onboardingData.birthDate.getMonth());

  // Redirect users who have completed onboarding
  useEffect(() => {
    if (user) {
      const hasCompletedOnboarding = user.profile &&
        user.profile.gender &&
        user.profile.weight &&
        user.profile.birthDate;

      if (hasCompletedOnboarding) {
        router.replace('/(tabs)');
      }
    }
  }, [user, router]);

  const steps = [
    {
      title: t('onboarding.welcomeTitle'),
      subtitle: t('onboarding.welcomeSubtitle'),
      icon: '👋',
    },
    {
      title: t('onboarding.genderTitle'),
      subtitle: t('onboarding.genderSubtitle'),
      icon: '👤',
    },
    {
      title: t('onboarding.weightTitle'),
      subtitle: t('onboarding.weightSubtitle'),
      icon: '⚖️',
    },
    {
      title: t('onboarding.birthDateTitle'),
      subtitle: t('onboarding.birthDateSubtitle'),
      icon: '🎂',
    },
    {
      title: t('onboarding.completeTitle'),
      subtitle: t('onboarding.completeSubtitle'),
      icon: '🎉',
    },
  ];

  const handleNext = async () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      await handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    setLoading(true);
    try {
      const profileData: any = {
        gender: onboardingData.gender,
        weight: onboardingData.weight,
        age: calculateAge(onboardingData.birthDate),
        birthDate: onboardingData.birthDate,
      };

      const result = await updateUserProfile({
        profile: profileData
      });

      if (result.success) {
        router.replace('/(auth)/transition');
      } else {
        Alert.alert(t('common.error'), result.error || t('onboarding.failedToSave'));
      }
    } catch {
      Alert.alert(t('common.error'), t('auth.unexpectedError'));
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <View style={styles.welcomeContainer}>
            <Image
              source={require('@/assets/images/aleraLogo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={[styles.welcomeText, { color: colors.text }]}>
              {t('onboarding.welcomeDescription')}
            </Text>
            <View style={styles.featuresList}>
              <View style={styles.featureItem}>
                <Ionicons name="notifications-outline" size={24} color={colors.primary} />
                <Text style={[styles.featureText, { color: colors.text }]}>
                  {t('onboarding.featureReminders')}
                </Text>
              </View>
              <View style={styles.featureItem}>
                <Ionicons name="heart-outline" size={24} color={colors.primary} />
                <Text style={[styles.featureText, { color: colors.text }]}>
                  {t('onboarding.featureHabits')}
                </Text>
              </View>
              <View style={styles.featureItem}>
                <Ionicons name="analytics-outline" size={24} color={colors.primary} />
                <Text style={[styles.featureText, { color: colors.text }]}>
                  {t('onboarding.featureProgress')}
                </Text>
              </View>
            </View>
          </View>
        );

      case 1:
        return (
          <View style={styles.genderContainer}>
            <TouchableOpacity
              style={[
                styles.genderOption,
                {
                  backgroundColor: onboardingData.gender === 'male' ? colors.primary : colors.card,
                  borderColor: onboardingData.gender === 'male' ? colors.primary : colors.border,
                }
              ]}
              onPress={() => setOnboardingData({ ...onboardingData, gender: 'male' })}
            >
              <Ionicons
                name="male-outline"
                size={48}
                color={onboardingData.gender === 'male' ? '#FFFFFF' : colors.primary}
              />
              <Text style={[
                styles.genderText,
                {
                  color: onboardingData.gender === 'male' ? '#FFFFFF' : colors.text
                }
              ]}>
                {t('profile.male')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.genderOption,
                {
                  backgroundColor: onboardingData.gender === 'female' ? colors.primary : colors.card,
                  borderColor: onboardingData.gender === 'female' ? colors.primary : colors.border,
                }
              ]}
              onPress={() => setOnboardingData({ ...onboardingData, gender: 'female' })}
            >
              <Ionicons
                name="female-outline"
                size={48}
                color={onboardingData.gender === 'female' ? '#FFFFFF' : colors.primary}
              />
              <Text style={[
                styles.genderText,
                {
                  color: onboardingData.gender === 'female' ? '#FFFFFF' : colors.text
                }
              ]}>
                {t('profile.female')}
              </Text>
            </TouchableOpacity>

            </View>
        );

      case 2:
        return (
          <View style={styles.weightContainer}>
            <View style={[
              styles.weightInputContainer,
              { backgroundColor: colors.card, borderColor: colors.border }
            ]}>
              <TextInput
                style={[
                  styles.weightInput,
                  {
                    color: colors.text,
                    fontSize: weightInput ? 42 : 18, // Smaller font when empty
                    fontWeight: weightInput ? '700' : '400',
                  }
                ]}
                placeholder={t('onboarding.enterWeight')}
                placeholderTextColor={colors.textSecondary}
                value={weightInput}
                onChangeText={(text) => {
                  // Remove any non-numeric characters
                  const cleanText = text.replace(/[^0-9]/g, '');
                  setWeightInput(cleanText);

                  // Update state only if valid number within range
                  if (cleanText === '') {
                    // Don't update onboardingData yet, allow user to type
                    return;
                  }

                  const weight = parseInt(cleanText);
                  if (!isNaN(weight) && weight >= 30 && weight <= 300) {
                    setOnboardingData({ ...onboardingData, weight });
                  }
                }}
                onBlur={() => {
                  // When user finishes editing, validate and set default if needed
                  const weight = parseInt(weightInput);
                  if (weightInput === '' || isNaN(weight) || weight < 30 || weight > 300) {
                    setWeightInput(onboardingData.weight.toString());
                  }
                }}
                onSubmitEditing={() => {
                  // Validate and set default if needed when submitted
                  const weight = parseInt(weightInput);
                  if (weightInput === '' || isNaN(weight) || weight < 30 || weight > 300) {
                    setWeightInput('60');
                    setOnboardingData({ ...onboardingData, weight: 60 });
                  }
                }}
                keyboardType="numeric"
                maxLength={3}
              />
              <Text style={[styles.weightUnit, { color: colors.textSecondary }]}>
                kg
              </Text>
            </View>

            <View style={styles.weightSliderContainer}>
              <Text style={[styles.sliderHint, { color: colors.textSecondary }]}>
                {t('onboarding.weightHint')}
              </Text>
            </View>
          </View>
        );

      case 3:
        return (
          <View style={styles.birthDateContainer}>
            <TouchableOpacity
              style={[
                styles.birthDateInputContainer,
                { backgroundColor: colors.card, borderColor: colors.border }
              ]}
              onPress={showDatepicker}
            >
              <Text style={[styles.birthDateText, { color: colors.text }]}>
                {onboardingData.birthDate.toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </Text>
              <Ionicons name="calendar-outline" size={24} color={colors.primary} />
            </TouchableOpacity>

            <View style={styles.birthDateInfoContainer}>
              <Text style={[styles.calculatedAge, { color: colors.text }]}>
                {t('onboarding.ageLabel', { age: calculateAge(onboardingData.birthDate) })}
              </Text>
              <Text style={[styles.sliderHint, { color: colors.textSecondary }]}>
                {t('onboarding.birthDateHint')}
              </Text>
            </View>

            {/* Custom Date Picker Modal */}
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
                        style={styles.cancelButton}
                      >
                        <Text style={[styles.cancelText, { color: colors.primary }]}>
                          {t('common.cancel')}
                        </Text>
                      </TouchableOpacity>
                      <Text style={[styles.modalTitle, { color: colors.text }]}>
                        {t('profile.selectBirthDate')}
                      </Text>
                      <TouchableOpacity
                        onPress={() => setShowDatePicker(false)}
                        style={styles.confirmButton}
                      >
                        <Text style={[styles.confirmText, { color: colors.primary }]}>
                          {t('onboarding.confirm')}
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
                                backgroundColor: day === onboardingData.birthDate.getDate()
                                  ? colors.primary
                                  : 'transparent'
                              }
                            ]}
                            onPress={() => {
                              const newDate = new Date(onboardingData.birthDate);
                              newDate.setDate(day);
                              setOnboardingData({ ...onboardingData, birthDate: newDate });
                            }}
                          >
                            <Text style={[
                              styles.dateOptionText,
                              {
                                color: day === onboardingData.birthDate.getDate()
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
                                backgroundColor: month.value === onboardingData.birthDate.getMonth()
                                  ? colors.primary
                                  : 'transparent'
                              }
                            ]}
                            onPress={() => {
                              const newDate = new Date(onboardingData.birthDate);
                              newDate.setMonth(month.value);
                              setOnboardingData({ ...onboardingData, birthDate: newDate });
                            }}
                          >
                            <Text style={[
                              styles.dateOptionText,
                              {
                                color: month.value === onboardingData.birthDate.getMonth()
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
                                backgroundColor: year === onboardingData.birthDate.getFullYear()
                                  ? colors.primary
                                  : 'transparent'
                              }
                            ]}
                            onPress={() => {
                              const newDate = new Date(onboardingData.birthDate);
                              newDate.setFullYear(year);
                              setOnboardingData({ ...onboardingData, birthDate: newDate });
                            }}
                          >
                            <Text style={[
                              styles.dateOptionText,
                              {
                                color: year === onboardingData.birthDate.getFullYear()
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
        );

      case 4:
        return (
          <View style={styles.completionContainer}>
            <View style={styles.completionIcon}>
              <Ionicons name="checkmark-circle" size={80} color={colors.success} />
            </View>
            <Text style={[styles.completionText, { color: colors.text }]}>
              {t('onboarding.completionMessage')}
            </Text>
            <View style={styles.completionSummary}>
              <Text style={[styles.summaryText, { color: colors.textSecondary }]}>
                {t('onboarding.summaryGender', { gender: t(`profile.${onboardingData.gender}`) })}
              </Text>
              <Text style={[styles.summaryText, { color: colors.textSecondary }]}>
                {t('onboarding.summaryWeight', { weight: onboardingData.weight })}
              </Text>
              <Text style={[styles.summaryText, { color: colors.textSecondary }]}>
                {t('onboarding.summaryBirthDate', { date: onboardingData.birthDate.toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric'
                }) })}
              </Text>
              <Text style={[styles.summaryText, { color: colors.textSecondary }]}>
                {t('onboarding.summaryAge', { age: calculateAge(onboardingData.birthDate) })}
              </Text>
            </View>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={[colors.background, colors.backgroundSecondary, colors.gradientStart]}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            {steps.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.progressStep,
                  {
                    backgroundColor: index <= currentStep ? colors.primary : colors.border,
                    flex: 1,
                  }
                ]}
              />
            ))}
          </View>
          <Text style={[styles.progressText, { color: colors.textSecondary }]}>
            {currentStep + 1} of {steps.length}
          </Text>
        </View>

        {/* Step Content */}
        <View style={styles.contentContainer}>
          <View style={styles.stepHeader}>
            <Text style={styles.stepIcon}>{steps[currentStep].icon}</Text>
            <Text style={[styles.stepTitle, { color: colors.text }]}>
              {steps[currentStep].title}
            </Text>
            <Text style={[styles.stepSubtitle, { color: colors.textSecondary }]}>
              {steps[currentStep].subtitle}
            </Text>
          </View>

          {renderStepContent()}
        </View>

        {/* Navigation Buttons */}
        <View style={styles.buttonContainer}>
          {currentStep > 0 && (
            <TouchableOpacity
              style={[
                styles.backButton,
                { backgroundColor: colors.card, borderColor: colors.border }
              ]}
              onPress={handlePrevious}
              disabled={loading}
            >
              <Ionicons name="chevron-back" size={20} color={colors.text} />
              <Text style={[styles.backButtonText, { color: colors.text }]}>
                {t('onboarding.back')}
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[
              styles.nextButton,
              { backgroundColor: colors.primary }
            ]}
            onPress={handleNext}
            disabled={loading}
          >
            {loading ? (
              <Text style={styles.nextButtonText}>{t('common.loading')}</Text>
            ) : (
              <>
                <Text style={styles.nextButtonText}>
                  {currentStep === steps.length - 1 ? t('onboarding.getStarted') : t('onboarding.next')}
                </Text>
                <Ionicons name="chevron-forward" size={20} color="#FFFFFF" />
              </>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.footerSpace} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContentContainer: {
    flexGrow: 1,
    paddingTop: 50, // Top safe area padding
    paddingBottom: 50, // Bottom safe area padding
  },
  progressContainer: {
    alignItems: 'center',
    paddingTop: Spacing.lg,
  },
  progressBar: {
    flexDirection: 'row',
    width: '100%',
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: Spacing.sm,
  },
  progressStep: {
    height: '100%',
    marginHorizontal: 1,
  },
  progressText: {
    ...Typography.caption,
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
  },
  stepHeader: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  stepIcon: {
    fontSize: 48,
    marginBottom: Spacing.md,
  },
  stepTitle: {
    ...Typography.h2,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: Spacing.sm,
    flexWrap: 'wrap',
    paddingHorizontal: Spacing.sm,
  },
  stepSubtitle: {
    ...Typography.body,
    textAlign: 'center',
    flexWrap: 'wrap',
    paddingHorizontal: Spacing.sm,
  },
  welcomeContainer: {
    alignItems: 'center',
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: Spacing.lg,
  },
  welcomeText: {
    ...Typography.body,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing.lg,
    flexWrap: 'wrap',
    paddingHorizontal: Spacing.sm,
  },
  featuresList: {
    width: '100%',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderRadius: BorderRadius.md,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  featureText: {
    ...Typography.body,
    marginLeft: Spacing.md,
    flex: 1,
    flexShrink: 1,
  },
  genderContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    gap: Spacing.xl,
  },
  genderOption: {
    alignItems: 'center',
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
    width: 110,
    height: 140,
    justifyContent: 'center',
  },
  genderText: {
    ...Typography.body,
    fontWeight: '600',
    marginTop: Spacing.sm,
    textAlign: 'center',
    flexWrap: 'wrap',
    flexShrink: 1,
  },
  weightContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.lg,
  },
  weightInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
    marginBottom: Spacing.lg,
  },
  weightInput: {
    flex: 1,
    fontSize: 42,
    fontWeight: '700',
    textAlign: 'center',
    minHeight: 50,
  },
  weightUnit: {
    ...Typography.h1,
    marginLeft: Spacing.sm,
    fontWeight: '600',
  },
  weightSliderContainer: {
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  sliderHint: {
    ...Typography.caption,
    textAlign: 'center',
    paddingHorizontal: Spacing.lg,
    flexWrap: 'wrap',
  },
  birthDateContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.lg,
  },
  birthDateInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
    marginBottom: Spacing.lg,
    minHeight: 80,
  },
  birthDateText: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
  },
  birthDateInfoContainer: {
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  calculatedAge: {
    ...Typography.h3,
    fontWeight: '600',
    marginBottom: Spacing.sm,
    textAlign: 'center',
    flexWrap: 'wrap',
    paddingHorizontal: Spacing.sm,
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
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  cancelButton: {
    padding: 10,
  },
  cancelText: {
    ...Typography.body,
    fontWeight: '600',
  },
  confirmButton: {
    padding: 10,
  },
  confirmText: {
    ...Typography.body,
    fontWeight: '600',
  },
  modalTitle: {
    ...Typography.h3,
    fontWeight: '600',
  },
  datePickerContainer: {
    flexDirection: 'row',
    height: 250,
    padding: Spacing.md,
  },
  dateColumn: {
    flex: 1,
    marginHorizontal: 4,
  },
  dateOption: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    marginVertical: 2,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
    minHeight: 40,
    justifyContent: 'center',
  },
  dateOptionText: {
    ...Typography.body,
    fontSize: 16,
    textAlign: 'center',
  },
  completionContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  completionIcon: {
    marginBottom: Spacing.lg,
  },
  completionText: {
    ...Typography.body,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: Spacing.xl,
    flexWrap: 'wrap',
    paddingHorizontal: Spacing.sm,
  },
  completionSummary: {
    alignItems: 'center',
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  summaryText: {
    ...Typography.body,
    marginBottom: Spacing.sm,
    flexWrap: 'wrap',
    textAlign: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    minWidth: 100,
    justifyContent: 'center',
  },
  backButtonText: {
    ...Typography.body,
    fontWeight: '600',
    marginLeft: Spacing.xs,
    flexShrink: 1,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    minWidth: 120,
  },
  nextButtonText: {
    ...Typography.body,
    fontWeight: '600',
    color: '#FFFFFF',
    marginRight: Spacing.xs,
    flexShrink: 1,
  },
  footerSpace: {
    height: 20,
  },
});