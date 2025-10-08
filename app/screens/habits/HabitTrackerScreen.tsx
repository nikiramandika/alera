// Healthy Habits Tracker Screen
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function HabitTrackerScreen() {
  return (
    <View style={styles.container}>
      <Text>Habit Tracker Screen</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

