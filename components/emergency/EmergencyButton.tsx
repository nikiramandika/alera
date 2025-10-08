// Emergency Button Component
import React from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';

export default function EmergencyButton() {
  return (
    <TouchableOpacity style={styles.button}>
      <Text style={styles.buttonText}>🚨 EMERGENCY</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#ff4444',
    padding: 20,
    borderRadius: 50,
    alignItems: 'center',
    margin: 20,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

