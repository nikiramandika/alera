// Notification Card Component
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface NotificationCardProps {
  title: string;
  message: string;
  time: string;
  type: 'medication' | 'habit' | 'emergency';
}

export default function NotificationCard({ title, message, time, type }: NotificationCardProps) {
  return (
    <View style={[styles.container, styles[type]]}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
      <Text style={styles.time}>{time}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 8,
    marginVertical: 4,
  },
  medication: {
    backgroundColor: '#e3f2fd',
  },
  habit: {
    backgroundColor: '#e8f5e8',
  },
  emergency: {
    backgroundColor: '#ffebee',
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  message: {
    fontSize: 14,
    marginVertical: 4,
  },
  time: {
    fontSize: 12,
    color: '#666',
  },
});

