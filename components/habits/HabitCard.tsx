// Habit Card Component
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface HabitCardProps {
  habit: {
    id: string;
    name: string;
    frequency: string;
    completed: boolean;
  };
}

export default function HabitCard({ habit }: HabitCardProps) {
  return (
    <View style={[styles.container, habit.completed && styles.completed]}>
      <Text style={styles.name}>{habit.name}</Text>
      <Text style={styles.frequency}>{habit.frequency}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    marginVertical: 4,
  },
  completed: {
    backgroundColor: '#e8f5e8',
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  frequency: {
    fontSize: 14,
    color: '#666',
  },
});

