import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, Spacing, BorderRadius, Typography } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';

export default function EditProfileScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { user, updateUserProfile } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [editForm, setEditForm] = useState({
    displayName: user?.displayName || '',
    gender: user?.profile?.gender || '',
    weight: user?.profile?.weight?.toString() || '',
    age: user?.profile?.age?.toString() || '',
  });

  const handleSaveProfile = async () => {
    // Validation
    if (!editForm.displayName.trim()) {
      Alert.alert('Error', 'Name is required');
      return;
    }

    if (editForm.weight && (isNaN(Number(editForm.weight)) || Number(editForm.weight) <= 0)) {
      Alert.alert('Error', 'Please enter a valid weight');
      return;
    }

    if (editForm.age && (isNaN(Number(editForm.age)) || Number(editForm.age) <= 0 || Number(editForm.age) > 150)) {
      Alert.alert('Error', 'Please enter a valid age');
      return;
    }

    const profileData = {
      displayName: editForm.displayName.trim(),
      profile: {
        gender: editForm.gender,
        weight: editForm.weight ? Number(editForm.weight) : undefined,
        age: editForm.age ? Number(editForm.age) : undefined,
      }
    };

    setLoading(true);
    try {
      const result = await updateUserProfile(profileData);
      if (result.success) {
        Alert.alert('Success', 'Profile updated successfully', [
          {
            text: 'OK',
            onPress: () => router.back()
          }
        ]);
      } else {
        Alert.alert('Error', result.error || 'Failed to update profile');
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />

      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.headerButton}
        >
          <Text style={[styles.headerButtonText, { color: colors.textSecondary }]}>
            Cancel
          </Text>
        </TouchableOpacity>

        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Edit Profile
        </Text>

        <TouchableOpacity
          onPress={handleSaveProfile}
          disabled={loading}
          style={[styles.headerButton, { opacity: loading ? 0.6 : 1 }]}
        >
          <Text style={[styles.headerButtonText, { color: colors.primary, fontWeight: '600' }]}>
            {loading ? 'Saving...' : 'Save'}
          </Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.formSection}>
            <Text style={[styles.formLabel, { color: colors.text }]}>
              Name
            </Text>
            <TextInput
              style={[
                styles.textInput,
                {
                  backgroundColor: colors.card,
                  color: colors.text,
                  borderColor: colors.border,
                }
              ]}
              value={editForm.displayName}
              onChangeText={(text) => setEditForm(prev => ({ ...prev, displayName: text }))}
              placeholder="Enter your name"
              placeholderTextColor={colors.textSecondary}
              autoCapitalize="words"
            />
          </View>

          <View style={styles.formSection}>
            <Text style={[styles.formLabel, { color: colors.text }]}>
              Gender
            </Text>
            <View style={styles.genderOptions}>
              {['male', 'female'].map((gender) => (
                <TouchableOpacity
                  key={gender}
                  style={[
                    styles.genderOption,
                    {
                      backgroundColor: editForm.gender === gender ? colors.primary : colors.card,
                      borderColor: colors.border,
                    }
                  ]}
                  onPress={() => setEditForm(prev => ({ ...prev, gender }))}
                >
                  <Text style={[
                    styles.genderOptionText,
                    {
                      color: editForm.gender === gender ? '#FFFFFF' : colors.text,
                    }
                  ]}>
                    {gender.charAt(0).toUpperCase() + gender.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.formSection}>
            <Text style={[styles.formLabel, { color: colors.text }]}>
              Weight (kg)
            </Text>
            <TextInput
              style={[
                styles.textInput,
                {
                  backgroundColor: colors.card,
                  color: colors.text,
                  borderColor: colors.border,
                }
              ]}
              value={editForm.weight}
              onChangeText={(text) => setEditForm(prev => ({ ...prev, weight: text }))}
              placeholder="Enter your weight"
              placeholderTextColor={colors.textSecondary}
              keyboardType="numeric"
            />
          </View>

          <View style={styles.formSection}>
            <Text style={[styles.formLabel, { color: colors.text }]}>
              Age
            </Text>
            <TextInput
              style={[
                styles.textInput,
                {
                  backgroundColor: colors.card,
                  color: colors.text,
                  borderColor: colors.border,
                }
              ]}
              value={editForm.age}
              onChangeText={(text) => setEditForm(prev => ({ ...prev, age: text }))}
              placeholder="Enter your age"
              placeholderTextColor={colors.textSecondary}
              keyboardType="numeric"
            />
          </View>

          <View style={styles.formSection}>
            <Text style={[styles.formNote, { color: colors.textSecondary }]}>
              Email cannot be changed. Contact support if you need to update your email address.
            </Text>
          </View>

          {/* Add some padding at the bottom */}
          <View style={styles.bottomPadding} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  headerButton: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.sm,
  },
  headerButtonText: {
    fontSize: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: Spacing.lg,
  },
  formSection: {
    marginBottom: Spacing.xl,
  },
  formLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: Spacing.sm,
    color: '#11181C',
  },
  textInput: {
    height: 48,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    fontSize: 16,
  },
  genderOptions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  genderOption: {
    flex: 1,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    alignItems: 'center',
  },
  genderOptionText: {
    fontSize: 16,
    fontWeight: '500',
  },
  formNote: {
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
    fontStyle: 'italic',
    color: '#666',
  },
  bottomPadding: {
    height: 40,
  },
});