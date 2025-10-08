// Medication Card Component
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface MedicationCardProps {
  medication: {
    id: string;
    name: string;
    dosage: string;
    time: string;
  };
}

export default function MedicationCard({ medication }: MedicationCardProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.name}>{medication.name}</Text>
      <Text style={styles.dosage}>{medication.dosage}</Text>
      <Text style={styles.time}>{medication.time}</Text>
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
  name: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  dosage: {
    fontSize: 14,
    color: '#666',
  },
  time: {
    fontSize: 14,
    color: '#666',
  },
});

