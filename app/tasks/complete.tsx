// Updated React Native code matching the UI style you provided
// NOTE: This is a rewritten layout to follow the clean, centered style from your screenshot

import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, PanResponder, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMedicine } from '@/contexts/MedicineContext';
import { useHabit } from '@/contexts/HabitContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';

export default function TaskCompleteScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [task, setTask] = useState<any>(null);
  const [isCompleting, setIsCompleting] = useState(false);
  const { markMedicineTaken } = useMedicine();
  const { markHabitCompleted } = useHabit();

  // Color scheme and dynamic colors
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

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
    console.log('Params received:', params); // Debug log
    if (params.taskData) {
      console.log('Task data received:', params.taskData); // Debug log
      try {
        const parsedTask = JSON.parse(params.taskData as string);
        console.log('Parsed task:', parsedTask); // Debug log
        setTask(parsedTask);
      } catch (error) {
        console.error('Error parsing task data:', error);
        console.log('Raw task data:', params.taskData); // Debug log
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
      console.log('All params:', params); // Debug log
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
  }, [params.taskData, router, task]);

  const slideX = useRef(new Animated.Value(0)).current;
  const [isCompleted, setIsCompleted] = useState(false);

  // Animated values for emoji scale and transition
  const emojiScale = slideX.interpolate({
    inputRange: [0, 200, 260],
    outputRange: [1, 1.5, 1.8],
    extrapolate: 'clamp',
  });

  // Animated values for background circle scale
  const circleScale = slideX.interpolate({
    inputRange: [0, 200, 260],
    outputRange: [1, 1.2, 1.4],
    extrapolate: 'clamp',
  });

  const emojiOpacity = slideX.interpolate({
    inputRange: [0, 180, 260],
    outputRange: [1, 0.3, 0],
    extrapolate: 'clamp',
  });

  const checkmarkOpacity = slideX.interpolate({
    inputRange: [180, 260],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const checkmarkScale = slideX.interpolate({
    inputRange: [180, 260],
    outputRange: [0.5, 1.2],
    extrapolate: 'clamp',
  });
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !isCompleting,
      onMoveShouldSetPanResponder: (_, gesture) =>
        !isCompleting && Math.abs(gesture.dx) > 5,

      onPanResponderGrant: () => {
        // Optional: Add haptic feedback here
      },

      onPanResponderMove: (_, gesture) => {
        console.log('PanResponder move:', gesture.dx); // Debug log
        if (gesture.dx > 0 && gesture.dx < 260) {
          slideX.setValue(gesture.dx);
        }
      },

      onPanResponderRelease: (_, gesture) => {
        console.log('PanResponder release:', gesture.dx); // Debug log
        if (gesture.dx > 200) {
          handleComplete();
        } else {
          Animated.spring(slideX, {
            toValue: 0,
            tension: 100,
            friction: 8,
            useNativeDriver: false,
          }).start();
        }
      },
      onPanResponderTerminationRequest: () => false,
    })
  ).current;

  const handleComplete = async () => {
    if (isCompleting || !task) return;

    setIsCompleting(true);

    try {
      let result = { success: false };

      if (task.type === 'medicine') {
        // Extract medicine ID from task ID
        const medicineId = task.id.replace('medicine-', '');
        const scheduledTime = new Date();
        if (task.time) {
          const [hours, minutes] = task.time.split(':').map(Number);
          scheduledTime.setHours(hours, minutes, 0, 0);
        }
        result = await markMedicineTaken(medicineId, scheduledTime);
      } else if (task.type === 'habit') {
        // Extract habit ID from task ID
        const habitId = task.id.replace('habit-', '');
        const targetValue = 1; // Default target value
        result = await markHabitCompleted(habitId, targetValue);
      }

      if (result.success) {
        setIsCompleted(true);
        Animated.timing(slideX, {
          toValue: 260,
          duration: 250,
          useNativeDriver: false,
        }).start(() => {
          // Navigate back to home after completion
          setTimeout(() => {
            router.replace('/(tabs)');
          }, 1000); // Extended time to show checkmark
        });
      } else {
        Alert.alert('Error', 'Failed to complete task');
        Animated.spring(slideX, {
          toValue: 0,
          useNativeDriver: false,
        }).start();
        setIsCompleting(false);
      }
    } catch (error) {
      console.error('Task completion error:', error);
      Alert.alert('Error', 'An unexpected error occurred');
      Animated.spring(slideX, {
        toValue: 0,
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
    icon: task.icon || task.emoji || (task.type === 'medicine' ? '💊' : '⭐'),
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: taskColors.background }]}>
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
          <Ionicons name="chevron-forward" size={22} color="#FFF" />
        </Animated.View>

        <Text style={[styles.sliderText, { color: taskColors.text }]}>
          {isCompleted ? 'Task completed!' : 'Swap to finish the task'}
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