// Medication List Screen - Main medication management
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function MedicationListScreen() {
  return (
    <View style={styles.container}>
      <Text>Medication List Screen</Text>
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

