// Family Management Screen
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function FamilyScreen() {
  return (
    <View style={styles.container}>
      <Text>Family Screen</Text>
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

