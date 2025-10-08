// Analytics and Progress Screen
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function AnalyticsScreen() {
  return (
    <View style={styles.container}>
      <Text>Analytics Screen</Text>
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

