// Updated React Native code matching the UI style you provided
// NOTE: This is a rewritten layout to follow the clean, centered style from your screenshot

import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, PanResponder, Alert, Dimensions } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useMedicine } from '@/contexts/MedicineContext';
import { useHabit } from '@/contexts/HabitContext';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function TaskCompleteScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [task, setTask] = useState<any>(null);
  const [isCompleting, setIsCompleting] = useState(false);
  const taskDataProcessed = useRef(false);
  const isInitialized = useRef(false);
  const hapticTriggered = useRef(false);
  const persistentTask = useRef<any>(null); // Store task data persistently
  const { markMedicineTaken } = useMedicine();
  const { markHabitCompleted } = useHabit();

  // Color scheme
  const colorScheme = useColorScheme();

  // Get task-specific colors
  const getTaskColors = () => {
    if (task?.type === 'medicine') {
      return {
        background: colorScheme === 'dark' ? '#059669' : '#10B981', // Green for medicine
        backgroundSecondary: colorScheme === 'dark' ? '#047857' : '#34D399',
        icon: colorScheme === 'dark' ? '#6EE7B7' : '#FFFFFF',
        text: '#FFFFFF',
        textSecondary: colorScheme === 'dark' ? '#D1FAE5' : '#F0FDF4',
        sliderBackground: '#FFFFFF',
        sliderButton: colorScheme === 'dark' ? '#059669' : '#10B981',
      };
    } else {
      // Default/Habit - Blue theme
      return {
        background: colorScheme === 'dark' ? '#1E3A8A' : '#70A8FF', // Blue for habit
        backgroundSecondary: colorScheme === 'dark' ? '#1D4ED8' : '#93C5FD',
        icon: colorScheme === 'dark' ? '#93C5FD' : '#FFFFFF',
        text: '#FFFFFF',
        textSecondary: colorScheme === 'dark' ? '#DBEAFE' : '#EFF6FF',
        sliderBackground: '#FFFFFF',
        sliderButton: colorScheme === 'dark' ? '#1E3A8A' : '#4C84FF',
      };
    }
  };

  const taskColors = getTaskColors();

  // Parse task data from params
  React.useEffect(() => {
    // Prevent processing the same task data multiple times
    if (taskDataProcessed.current) return;

    console.log('=== TASK PARSING START ===');
    console.log('Params received:', params);
    console.log('Context functions available:', {
      markMedicineTaken: typeof markMedicineTaken,
      markHabitCompleted: typeof markHabitCompleted,
      refreshMedicines: typeof refreshMedicines,
      refreshHabits: typeof refreshHabits
    });

    if (params.taskData) {
      console.log('Task data received:', params.taskData);
      try {
        const parsedTask = JSON.parse(params.taskData as string);
        console.log('Parsed task successfully:', parsedTask);

        // Check if task is already completed
        if (parsedTask.completed === true) {
          console.log('⚠️ Task already completed, redirecting back...');
          Alert.alert(
            'Already Completed',
            'This task has already been completed.',
            [
              {
                text: 'OK',
                onPress: () => router.replace('/(tabs)')
              }
            ]
          );
          return;
        }

        setTask(parsedTask);
        persistentTask.current = parsedTask; // Store persistently
        taskDataProcessed.current = true; // Mark as processed
        console.log('=== TASK PARSING SUCCESS ===');
      } catch (error) {
        console.error('Error parsing task data:', error);
        console.log('Raw task data:', params.taskData);
        Alert.alert(
          'Error',
          'Failed to load task data',
          [
            {
              text: 'Go Back',
              onPress: () => router.back()
            }
          ]
        );
      }
    } else {
      console.log('No task data provided');
      console.log('All params:', params);
      Alert.alert(
        'Error',
        'No task data provided',
        [
          {
            text: 'Go Back',
            onPress: () => router.back()
          }
        ]
      );
    }
  }, [params, router, markMedicineTaken, markHabitCompleted]);

  const slideX = useRef(new Animated.Value(0)).current;
  const [isCompleted, setIsCompleted] = useState(false);

  // Calculate maximum slide distance based on actual screen dimensions
  const { width: screenWidth } = Dimensions.get('window');
  const sliderWidth = screenWidth * 0.85; // 85% of screen width
  const buttonWidth = 55; // Button width from styles
  const buttonPadding = 6; // Left padding from styles (3px on each side)
  const maxSlideDistance = sliderWidth - buttonWidth - buttonPadding;

  // Log slider calculations once for debugging
  if (!isInitialized.current) {
    console.log('Slider calculations initialized:', {
      screenWidth,
      sliderWidth,
      maxSlideDistance,
      completionThreshold: maxSlideDistance * 0.8
    });
    isInitialized.current = true;
  }

  // Animated values for emoji scale and transition
  const emojiScale = slideX.interpolate({
    inputRange: [0, maxSlideDistance * 0.4, maxSlideDistance * 0.6, maxSlideDistance],
    outputRange: [1, 1.3, 1.6, 1.8],
    extrapolate: 'clamp',
  });

  // Animated values for background circle scale
  const circleScale = slideX.interpolate({
    inputRange: [0, maxSlideDistance * 0.4, maxSlideDistance * 0.6, maxSlideDistance],
    outputRange: [1, 1.1, 1.3, 1.4],
    extrapolate: 'clamp',
  });

  const emojiOpacity = slideX.interpolate({
    inputRange: [0, maxSlideDistance * 0.5, maxSlideDistance * 0.7, maxSlideDistance],
    outputRange: [1, 0.7, 0.3, 0],
    extrapolate: 'clamp',
  });

  const checkmarkOpacity = slideX.interpolate({
    inputRange: [maxSlideDistance * 0.5, maxSlideDistance * 0.7, maxSlideDistance],
    outputRange: [0, 0.5, 1],
    extrapolate: 'clamp',
  });

  const checkmarkScale = slideX.interpolate({
    inputRange: [maxSlideDistance * 0.5, maxSlideDistance * 0.7, maxSlideDistance],
    outputRange: [0.3, 0.8, 1.2],
    extrapolate: 'clamp',
  });
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !isCompleting && !isCompleted,
      onMoveShouldSetPanResponder: (_, gesture) =>
        !isCompleting && !isCompleted && Math.abs(gesture.dx) > 3, // Reduced threshold for easier activation

      onPanResponderGrant: () => {
        // Add haptic feedback when user starts sliding
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {
          // Fallback if haptics not available
        });
      },

      onPanResponderMove: (_, gesture) => {
        // Allow full sliding range based on actual slider width
        if (gesture.dx > 0) {
          // Limit to maxSlideDistance to prevent overshooting
          const clampedValue = Math.min(gesture.dx, maxSlideDistance);
          slideX.setValue(clampedValue);

          // Add haptic feedback when approaching completion (only once)
          const completionPoint = maxSlideDistance * 0.5; // Earlier feedback at 50%
          if (gesture.dx > completionPoint && !hapticTriggered.current) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
            hapticTriggered.current = true;
          }
        }
      },

      onPanResponderRelease: (_, gesture) => {
        // Reset haptic trigger for next gesture
        hapticTriggered.current = false;

        // OPTIMIZED: Even lower completion threshold at 60% for easier completion
        const completionThreshold = maxSlideDistance * 0.6;
        console.log('PanResponder release:', {
          gestureDx: gesture.dx,
          completionThreshold,
          shouldComplete: gesture.dx > completionThreshold,
          maxSlideDistance,
          percentage: (gesture.dx / maxSlideDistance * 100).toFixed(1) + '%'
        });

        if (gesture.dx > completionThreshold) {
          console.log('✅ THRESHOLD REACHED - Triggering handleComplete...');
          handleComplete();
        } else {
          console.log('❌ THRESHOLD NOT REACHED - Springing back to start...');
          // Smooth spring back animation
          Animated.spring(slideX, {
            toValue: 0,
            tension: 80, // Lower tension for smoother spring
            friction: 6, // Lower friction for bouncier feel
            useNativeDriver: false,
          }).start();
        }
      },
      onPanResponderTerminationRequest: () => false,
    })
  ).current;

  const handleComplete = async () => {
    // Use persistentTask instead of state task to prevent race conditions
    const currentTask = persistentTask.current || task;

    console.log('🔥 handleComplete called!', {
      isCompleting,
      task: !!currentTask,
      taskType: currentTask?.type,
      taskId: currentTask?.id,
      usingPersistent: !!persistentTask.current,
      persistentTaskValid: !!persistentTask.current?.id,
      stateTaskValid: !!task?.id
    });

    if (isCompleting || !currentTask) {
      console.log('❌ handleComplete early return:', {
        isCompleting,
        hasTask: !!currentTask,
        persistentExists: !!persistentTask.current,
        stateExists: !!task
      });
      return;
    }

    setIsCompleting(true);
    console.log('Starting completion animation...');

    // OPTIMIZED: Faster completion animation
    Animated.timing(slideX, {
      toValue: maxSlideDistance,
      duration: 200, // Reduced from 400ms to 200ms for faster feedback
      useNativeDriver: false,
    }).start();

    // OPTIMISTIC UI: Show immediate success feedback
    // This provides instant visual feedback while database operations complete
    setTimeout(() => {
      if (!isCompleted) { // Only show if not already completed
        setIsCompleted(true);
        console.log('⚡ Optimistic UI: Showing completion immediately');
      }
    }, 100); // Show success after 100ms for instant feedback

    try {
      let result: { success: boolean; error?: string } = { success: false };

      if (currentTask.type === 'medicine') {
        // Extract medicine ID from task ID with proper parsing
        let medicineId = currentTask.id;
        console.log('🔍 Original task ID:', currentTask.id);
        console.log('🔍 Selected date from task:', currentTask.selectedDate);

        // Step 1: Remove 'medicine-' prefix if present
        if (medicineId.startsWith('medicine-')) {
          medicineId = medicineId.replace('medicine-', '');
          console.log('🔍 After removing medicine- prefix:', medicineId);
        }

        // Step 2: Remove time suffix (e.g., "abc123-23:00" -> "abc123")
        const timeIndex = medicineId.lastIndexOf('-');
        if (timeIndex > 0) {
          const potentialTime = medicineId.substring(timeIndex + 1);
          // Check if it's a time format (HH:MM)
          if (potentialTime.includes(':') && /^\d{1,2}:\d{2}$/.test(potentialTime)) {
            medicineId = medicineId.substring(0, timeIndex);
            console.log('🔍 After removing time suffix:', medicineId, '(removed time:', potentialTime + ')');
          }
        }

        console.log('✅ Final medicine ID:', medicineId);

        // Use selected date for scheduled time, fallback to current date
        let scheduledTime = new Date();
        if (currentTask.selectedDate) {
          scheduledTime = new Date(currentTask.selectedDate);
          console.log('🔍 Using selected date for scheduled time:', scheduledTime.toISOString());
        }

        if (currentTask.time) {
          const [hours, minutes] = currentTask.time.split(':').map(Number);
          scheduledTime.setHours(hours, minutes, 0, 0);
        }

        console.log('✅ Final scheduled time:', scheduledTime.toISOString());

        console.log('🚀 Calling markMedicineTaken:', {
          originalId: currentTask.id,
          finalMedicineId: medicineId,
          scheduledTime: scheduledTime.toISOString(),
          taskType: currentTask.type,
          taskData: currentTask,
          medicineIdType: typeof medicineId,
          medicineIdLength: medicineId.length
        });

        // Use current date as actualTime (when user actually takes the medicine)
        const actualTime = new Date();

        // Check if markMedicineTaken function exists
        if (typeof markMedicineTaken === 'function') {
          result = await markMedicineTaken(medicineId, scheduledTime, actualTime);
          console.log('📊 markMedicineTaken result:', result);
          console.log('📊 Used scheduledTime:', scheduledTime.toISOString(), 'actualTime:', actualTime.toISOString());
        } else {
          console.error('❌ markMedicineTaken function not available');
          result = { success: false, error: 'Medicine function not available' };
        }

        // If medicine not found, try with different ID formats
        if (!result.success && result.error?.includes('Medicine not found')) {
          console.log('🔄 Medicine not found, trying alternative ID formats...');

          // Try without any processing (use original ID)
          const originalId = currentTask.id;
          console.log('🔄 Trying with original ID:', originalId);
          result = await markMedicineTaken(originalId, scheduledTime, actualTime);
          console.log('📊 Result with original ID:', result);
        }
      } else if (currentTask.type === 'habit') {
        // Extract habit ID and completion time from task ID
        let habitId = currentTask.id;
        let completionTime: string | undefined;

        console.log('🔍 Original task ID:', currentTask.id);
        console.log('🔍 Selected date from task:', currentTask.selectedDate);

        // Step 1: Remove 'habit-' prefix if present
        if (habitId.startsWith('habit-')) {
          habitId = habitId.replace('habit-', '');
          console.log('🔍 After removing habit- prefix:', habitId);
        }

        // Step 2: Extract time suffix (e.g., "abc123-23:00" -> "abc123" with time "23:00")
        const timeIndex = habitId.lastIndexOf('-');
        if (timeIndex > 0) {
          const potentialTime = habitId.substring(timeIndex + 1);
          // Check if it's a time format (HH:MM)
          if (potentialTime.includes(':') && /^\d{1,2}:\d{2}$/.test(potentialTime)) {
            completionTime = potentialTime;
            habitId = habitId.substring(0, timeIndex);
            console.log('🔍 Extracted completion time:', completionTime);
            console.log('🔍 After removing time suffix:', habitId);
          }
        }

        // Get completion date from task data (for past dates) or use current date
        let completionDate: Date | undefined;
        if (currentTask.selectedDate) {
          completionDate = new Date(currentTask.selectedDate);
          console.log('🔍 Using completion date from task:', completionDate.toISOString());
        } else {
          console.log('🔍 No selected date provided, using current date');
        }

        console.log('✅ Final habit ID:', habitId);
        console.log('✅ Completion time:', completionTime);
        console.log('✅ Completion date:', completionDate?.toISOString());

        const targetValue = 1; // Default target value
        console.log('🚀 Calling markHabitCompleted:', {
          originalId: currentTask.id,
          finalHabitId: habitId,
          completionTime,
          completionDate: completionDate?.toISOString(),
          targetValue,
          taskType: currentTask.type
        });

        // Check if markHabitCompleted function exists
        if (typeof markHabitCompleted === 'function') {
          result = await markHabitCompleted(habitId, targetValue, undefined, completionTime, completionDate);
        } else {
          console.error('markHabitCompleted function not available');
          result = { success: false, error: 'Habit function not available' };
        }
      }

      console.log('Task completion result:', result);

      if (result.success) {
        console.log('Task completed successfully!');
        setIsCompleted(true);

        // Send signal to home screen for optimistic UI update BEFORE navigation
        try {
          const taskId = currentTask.type === 'medicine'
            ? `medicine-${currentTask.id.replace('medicine-', '')}${currentTask.time ? `-${currentTask.time}` : ''}`
            : `habit-${currentTask.id.replace('habit-', '')}${currentTask.time ? `-${currentTask.time}` : ''}`;

          const signal = {
            taskId: taskId,
            timestamp: Date.now()
          };

          // Send signal IMMEDIATELY after successful completion
          await AsyncStorage.setItem('taskCompletionSignal', JSON.stringify(signal));
          console.log('📤 Sent task completion signal IMMEDIATELY:', taskId);
        } catch (error) {
          console.error('Error sending task completion signal:', error);
        }

        // Success haptic feedback
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});

        // OPTIMIZED: INSTANT navigation with immediate signal
        // Navigate immediately after completion signal is sent
        setTimeout(() => {
          console.log('🏠 Instant navigation after task completion...');
          router.replace('/(tabs)' as any);
        }, 200); // Further reduced to 200ms for instant feedback

        // NO BACKGROUND REFRESH - Data is handled by optimistic UI only
        console.log('🚫 No background refresh needed - using optimistic UI updates');
      } else {
        console.log('Task completion failed:', result);

        // ROLLBACK: Reset optimistic UI if database operation failed
        if (isCompleted) {
          setIsCompleted(false);
          console.log('❌ Rolling back optimistic UI due to database error');
        }

        Alert.alert('Error', 'Failed to complete task');
        // Smooth spring back animation
        Animated.spring(slideX, {
          toValue: 0,
          tension: 80,
          friction: 6,
          useNativeDriver: false,
        }).start();
        setIsCompleting(false);
      }
    } catch (error) {
      console.error('Task completion error:', error);

      // ROLLBACK: Reset optimistic UI if an unexpected error occurred
      if (isCompleted) {
        setIsCompleted(false);
        console.log('❌ Rolling back optimistic UI due to unexpected error');
      }

      Alert.alert('Error', 'An unexpected error occurred');
      // Smooth spring back animation
      Animated.spring(slideX, {
        toValue: 0,
        tension: 80,
        friction: 6,
        useNativeDriver: false,
      }).start();
      setIsCompleting(false);
    }
  };

  // Return early if no task - show loading state instead of redirecting
  if (!task) {
    const defaultColors = {
      background: colorScheme === 'dark' ? '#1E3A8A' : '#70A8FF',
      text: '#FFFFFF',
    };

    return (
      <SafeAreaView style={[styles.container, { backgroundColor: defaultColors.background }]}>
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: defaultColors.text }]}>Loading task...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Map backend data structure
  const mappedTask = {
    ...task, // include all backend fields
    title: task.name || task.title || 'Task',
    subtitle: task.description || task.subtitle || 'Complete your task',
    icon: task.type === 'medicine' ? '💊' : (task.icon || task.emoji || '⭐'),
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: taskColors.background }]}>
      {/* Completion Success Overlay */}
      {isCompleted && (
        <View style={styles.completionOverlay}>
          <View style={styles.completionContent}>
            <Ionicons name="checkmark-circle" size={80} color="#4CAF50" />
            <Text style={styles.completionText}>Task Completed!</Text>
            <Text style={styles.completionSubtext}>Great job! 🎉</Text>
          </View>
        </View>
      )}
      {/* Back Button */}
      <TouchableOpacity style={styles.backButton} onPress={handleBack}>
        <Ionicons name="chevron-back" size={26} color={taskColors.text} />
      </TouchableOpacity>

      
      {/* Icon */}
      <View style={styles.iconWrapper}>
        <Animated.View
          style={[
            styles.iconCircle,
            {
              transform: [{ scale: circleScale }],
              backgroundColor: colorScheme === 'dark' ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.3)',
            }
          ]}
        >
          {/* Original Emoji - fades out as user slides */}
          <Animated.Text
            style={[
              styles.iconEmoji,
              {
                transform: [{ scale: emojiScale }],
                opacity: emojiOpacity,
              }
            ]}
          >
            {mappedTask.icon}
          </Animated.Text>

          {/* Checkmark - fades in when task is completed */}
          <Animated.View
            style={[
              styles.checkmarkContainer,
              {
                opacity: checkmarkOpacity,
                transform: [{ scale: checkmarkScale }],
                position: 'absolute',
              }
            ]}
          >
            <Ionicons name="checkmark" size={60} color="#FFFFFF" />
          </Animated.View>
        </Animated.View>
      </View>

      {/* Title + Subtitle */}
      <Text style={[styles.title, { color: taskColors.text }]}>{mappedTask.title}</Text>
      <Text style={[styles.subtitle, { color: taskColors.textSecondary }]}>{mappedTask.subtitle || 'Stay moisturized'}</Text>

      {/* Slider */}
      <View style={[styles.sliderWrapper, { backgroundColor: taskColors.sliderBackground }]}>
        <Animated.View
          style={[
            styles.sliderButton,
            {
              transform: [{ translateX: slideX }],
              backgroundColor: taskColors.sliderButton,
            },
          ]}
        >
          {isCompleting ? (
            <Ionicons name="time" size={22} color="#FFF" />
          ) : isCompleted ? (
            <Ionicons name="checkmark" size={22} color="#FFF" />
          ) : (
            <Ionicons name="chevron-forward" size={22} color="#FFF" />
          )}
        </Animated.View>

        <Text style={[styles.sliderText, { color: taskColors.text }]}>
          {isCompleted ? 'Task completed!' : isCompleting ? 'Completing...' : 'Swap to finish the task'}
        </Text>

        {/* Gesture Area - Larger touch area */}
        <View
          style={styles.gestureArea}
          {...panResponder.panHandlers}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 20,
  },
  completionOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  completionContent: {
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 40,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  completionText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginTop: 16,
    marginBottom: 8,
  },
  completionSubtext: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    fontWeight: '600',
  },
  backButton: {
    alignSelf: 'flex-start',
    marginLeft: 20,
    marginTop: 10,
  },
  iconWrapper: {
    marginTop: 100,
    marginBottom: 20,
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconEmoji: {
    fontSize: 50,
  },
  checkmarkContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginTop: 150,
  },
  subtitle: {
    fontSize: 16,
    marginTop: 6,
  },
  sliderWrapper: {
    width: '85%',
    height: 60,
    borderRadius: 40,
    marginTop: 120, // Increased from 80 to move slider down
    justifyContent: 'center',
    overflow: 'hidden',
  },
  sliderButton: {
    width: 55,
    height: 55,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    left: 3,
    zIndex: 10,
  },
  sliderText: {
    position: 'absolute',
    width: '100%',
    textAlign: 'center',
    fontSize: 16,
  },
  gestureArea: {
    position: 'absolute',
    left: -10,
    top: -10,
    right: -10,
    bottom: -10,
    zIndex: 20,
  },
});