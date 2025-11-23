import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';

interface TemplateData {
  habitName: string;
  category: string;
  icon: string;
  color: string;
  description: string;
  target: {
    value: number;
    unit: string;
    frequency: string;
  };
  reminderTimes: string[];
  reminderDays: number[];
}

export default function CreateHabitStep1Screen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const params = useLocalSearchParams();

  // Parse template data if exists
  const templateData = params.template ? JSON.parse(params.template as string) as TemplateData : null;

  const [habitData, setHabitData] = useState({
    habitName: templateData?.habitName || '',
    icon: templateData?.icon || '🎯',
    description: templateData?.description || '',
    category: templateData?.category || 'custom',
    color: templateData?.color || '#4ECDC4',
  });

  // Common emoji icons for habits
  const habitIcons = [
    '💧', '🏃', '🧘', '📚', '❤️', '🎯', '✨', '🌟',
    '💪', '🥗', '😴', '🎨', '🎵', '📝', '🚀', '⭐',
    '🌱', '🔥', '💡', '🏆', '🎪', '🌈', '☀️', '🌙'
  ];

  const handleNext = () => {
    if (!habitData.habitName.trim()) {
      alert('Please enter a habit name');
      return;
    }

    // Prepare data for step 2
    const step2Data = {
      ...habitData,
      ...(templateData?.target && { target: templateData.target }),
      ...(templateData?.reminderTimes && { reminderTimes: templateData.reminderTimes }),
      ...(templateData?.reminderDays && { reminderDays: templateData.reminderDays }),
    };

    router.push({
      pathname: '/habits/create-step2',
      params: {
        step1Data: JSON.stringify(step2Data)
      }
    });
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
              Basic Information
            </Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Let&apos;s start with the basic details of your habit
            </Text>
          </View>

          {/* Habit Name Input */}
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <Text style={[styles.label, { color: colors.text }]}>Habit Name</Text>
            <TextInput
              style={[styles.input, {
                backgroundColor: colors.backgroundSecondary,
                borderColor: colors.border,
                color: colors.text
              }]}
              placeholder="Enter habit name..."
              placeholderTextColor={colors.textSecondary}
              value={habitData.habitName}
              onChangeText={(text) => setHabitData(prev => ({ ...prev, habitName: text }))}
            />
          </View>

          {/* Icon Selection */}
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <Text style={[styles.label, { color: colors.text }]}>Choose Icon</Text>
            <Text style={[styles.sublabel, { color: colors.textSecondary }]}>
              Select an emoji that represents your habit
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.iconContainer}>
                {habitIcons.map((icon, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.iconOption,
                      {
                        backgroundColor: habitData.icon === icon ? colors.primary + '20' : colors.backgroundSecondary,
                        borderColor: habitData.icon === icon ? colors.primary : colors.border,
                      }
                    ]}
                    onPress={() => setHabitData(prev => ({ ...prev, icon }))}
                  >
                    <Text style={styles.iconText}>{icon}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>

          {/* Description Input */}
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <Text style={[styles.label, { color: colors.text }]}>Description (Optional)</Text>
            <Text style={[styles.sublabel, { color: colors.textSecondary }]}>
              Add a short description to remind yourself why this habit matters
            </Text>
            <TextInput
              style={[styles.textArea, {
                backgroundColor: colors.backgroundSecondary,
                borderColor: colors.border,
                color: colors.text
              }]}
              placeholder="Why is this habit important to you?"
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
          <Text style={styles.nextButtonText}>Next</Text>
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
  textArea: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    minHeight: 100,
  },
  iconContainer: {
    flexDirection: 'row',
    paddingHorizontal: 5,
  },
  iconOption: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  iconText: {
    fontSize: 24,
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