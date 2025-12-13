import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, Spacing, BorderRadius, Typography } from '@/constants/theme';
import { useTranslation } from 'react-i18next';
import { confirmPasswordReset, verifyPasswordResetCode } from 'firebase/auth';
import { auth } from '@/config/firebase';

export default function ResetPasswordScreen() {
  const router = useRouter();
  const { oobCode } = useLocalSearchParams();
  const { t } = useTranslation();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [verifyingCode, setVerifyingCode] = useState(true);
  const [codeValid, setCodeValid] = useState(false);

  // Verify the reset code when component mounts
  React.useEffect(() => {
    const verifyCode = async () => {
      if (!oobCode || typeof oobCode !== 'string') {
        Alert.alert('Error', 'Invalid password reset link');
        router.replace('/(auth)/login');
        return;
      }

      try {
        await verifyPasswordResetCode(auth, oobCode);
        setCodeValid(true);
      } catch (error: any) {
        console.error('Error verifying reset code:', error);
        let errorMessage = 'Invalid or expired password reset link';

        if (error.code === 'auth/expired-action-code') {
          errorMessage = 'Password reset link has expired. Please request a new one.';
        } else if (error.code === 'auth/invalid-action-code') {
          errorMessage = 'Invalid password reset link. Please request a new one.';
        } else if (error.code === 'auth/user-disabled') {
          errorMessage = 'This account has been disabled';
        } else if (error.code === 'auth/user-not-found') {
          errorMessage = 'No account found with this email address';
        }

        Alert.alert('Error', errorMessage, [
          {
            text: 'OK',
            onPress: () => router.replace('/(auth)/forgot-password')
          }
        ]);
      } finally {
        setVerifyingCode(false);
      }
    };

    verifyCode();
  }, [oobCode, router]);

  const handleResetPassword = async () => {
    if (!newPassword || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (!oobCode || typeof oobCode !== 'string') {
      Alert.alert('Error', 'Invalid password reset link');
      return;
    }

    setLoading(true);
    try {
      await confirmPasswordReset(auth, oobCode, newPassword);
      Alert.alert(
        'Success',
        'Your password has been reset successfully. You can now login with your new password.',
        [
          {
            text: 'OK',
            onPress: () => router.replace('/(auth)/login')
          }
        ]
      );
    } catch (error: any) {
      let errorMessage = 'An error occurred while resetting your password';

      switch (error.code) {
        case 'auth/expired-action-code':
          errorMessage = 'Password reset link has expired. Please request a new one.';
          break;
        case 'auth/invalid-action-code':
          errorMessage = 'Invalid password reset link. Please request a new one.';
          break;
        case 'auth/user-disabled':
          errorMessage = 'This account has been disabled';
          break;
        case 'auth/user-not-found':
          errorMessage = 'No account found with this email address';
          break;
        case 'auth/weak-password':
          errorMessage = 'Password is too weak. Please choose a stronger password.';
          break;
        default:
          errorMessage = error.message;
      }

      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (verifyingCode) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <LinearGradient
          colors={[colors.gradientStart, colors.background]}
          style={StyleSheet.absoluteFillObject}
          start={{ x: 0.2, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Verifying reset link...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!codeValid) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <LinearGradient
          colors={[colors.gradientStart, colors.background]}
          style={StyleSheet.absoluteFillObject}
          start={{ x: 0.2, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        <View style={styles.loadingContainer}>
          <Ionicons name="warning-outline" size={60} color={colors.error} />
          <Text style={[styles.errorText, { color: colors.text }]}>
            Invalid reset link
          </Text>
          <TouchableOpacity
            style={[styles.backButton, { backgroundColor: colors.primary }]}
            onPress={() => router.replace('/(auth)/forgot-password')}
          >
            <Text style={styles.backButtonText}>Request New Link</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={[colors.gradientStart, colors.background]}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          {/* Main Content */}
          <View style={styles.contentContainer}>
            {/* Icon */}
            <View style={[styles.iconContainer, { backgroundColor: colors.primary + '20' }]}>
              <Ionicons name="key-outline" size={60} color={colors.primary} />
            </View>

            {/* Title */}
            <Text style={[styles.title, { color: colors.text }]}>
              {t('auth.resetPassword', 'Reset Password')}
            </Text>

            {/* Subtitle */}
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              {t('auth.resetPasswordDescription', 'Enter your new password below.')}
            </Text>

            {/* Form Card */}
            <View style={[styles.formCard, { backgroundColor: colors.card }]}>
              {/* New Password Input */}
              <View style={styles.inputContainer}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>
                  {t('auth.newPassword', 'New Password')}
                </Text>
                <TextInput
                  style={[styles.input, {
                    color: colors.text,
                    backgroundColor: colors.backgroundSecondary,
                    borderColor: colors.border
                  }]}
                  placeholder={t('auth.enterNewPassword', 'Enter new password')}
                  placeholderTextColor={colors.textSecondary}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry
                />
                <Ionicons
                  name="lock-closed-outline"
                  size={20}
                  color={colors.textSecondary}
                  style={styles.inputIcon}
                />
              </View>

              {/* Confirm Password Input */}
              <View style={styles.inputContainer}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>
                  {t('auth.confirmPassword', 'Confirm Password')}
                </Text>
                <TextInput
                  style={[styles.input, {
                    color: colors.text,
                    backgroundColor: colors.backgroundSecondary,
                    borderColor: colors.border
                  }]}
                  placeholder={t('auth.confirmNewPassword', 'Confirm new password')}
                  placeholderTextColor={colors.textSecondary}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                />
                <Ionicons
                  name="lock-closed-outline"
                  size={20}
                  color={colors.textSecondary}
                  style={styles.inputIcon}
                />
              </View>

              {/* Password Requirements */}
              <View style={styles.requirementsContainer}>
                <Text style={[styles.requirementsTitle, { color: colors.textSecondary }]}>
                  Password must:
                </Text>
                <Text style={[styles.requirement, { color: newPassword.length >= 6 ? colors.success : colors.textSecondary }]}>
                  {newPassword.length >= 6 ? '✓' : '•'} Be at least 6 characters
                </Text>
                <Text style={[styles.requirement, { color: newPassword === confirmPassword && newPassword.length > 0 ? colors.success : colors.textSecondary }]}>
                  {newPassword === confirmPassword && newPassword.length > 0 ? '✓' : '•'} Match confirm password
                </Text>
              </View>

              {/* Reset Password Button */}
              <TouchableOpacity
                style={[styles.resetButton, {
                  backgroundColor: newPassword.length >= 6 && newPassword === confirmPassword ? colors.primary : colors.border
                }]}
                onPress={handleResetPassword}
                disabled={loading || newPassword.length < 6 || newPassword !== confirmPassword}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.resetButtonText}>
                    {t('auth.resetPasswordButton', 'Reset Password')}
                  </Text>
                )}
              </TouchableOpacity>

              {/* Back to Login */}
              <TouchableOpacity
                style={styles.backToLoginButton}
                onPress={() => router.replace('/(auth)/login')}
              >
                <Text style={[styles.backToLoginText, { color: colors.primary }]}>
                  {t('auth.backToLogin', 'Back to Login')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...Typography.body,
    marginTop: Spacing.md,
  },
  errorText: {
    ...Typography.h3,
    fontWeight: '600',
    marginTop: Spacing.md,
    marginBottom: Spacing.lg,
  },
  contentContainer: {
    alignItems: "center",
    paddingTop: Spacing.xxl,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.xl,
  },
  title: {
    ...Typography.h1,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: Spacing.md,
  },
  subtitle: {
    ...Typography.body,
    textAlign: "center",
    marginBottom: Spacing.xl,
    paddingHorizontal: Spacing.md,
    lineHeight: 22,
  },
  formCard: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    width: "100%",
    maxWidth: 400,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  inputContainer: {
    marginBottom: Spacing.lg,
    position: 'relative',
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: Spacing.sm,
  },
  input: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    paddingLeft: Spacing.xl,
    fontSize: 16,
  },
  inputIcon: {
    position: 'absolute',
    left: Spacing.md,
    top: Spacing.md + 28,
  },
  requirementsContainer: {
    marginBottom: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  requirementsTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: Spacing.sm,
  },
  requirement: {
    fontSize: 12,
    marginBottom: Spacing.xs,
  },
  resetButton: {
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  resetButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  backToLoginButton: {
    alignItems: "center",
  },
  backToLoginText: {
    fontSize: 14,
    fontWeight: "500",
  },
  backButton: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: "center",
  },
  backButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});