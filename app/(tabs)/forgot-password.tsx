import React, { useState } from "react";
import {
  View,
  Text,
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
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, Spacing, BorderRadius, Typography } from '@/constants/theme';
import { useTranslation } from 'react-i18next';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '@/config/firebase';
import { useAuth } from '@/contexts/AuthContext';

export default function ForgotPasswordLoggedInScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { user } = useAuth();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const [loading, setLoading] = useState(false);

  const handleResetPassword = async () => {
    if (!user?.email) {
      Alert.alert('Error', 'User email not found');
      return;
    }

    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, user.email);
      Alert.alert(
        'Email Sent',
        `A password reset email has been sent to ${user.email}. Please check your inbox and follow the instructions.`,
        [
          {
            text: 'OK',
            onPress: () => router.back()
          }
        ]
      );
    } catch (error: any) {
      let errorMessage = 'An error occurred while sending the reset email';

      switch (error.code) {
        case 'auth/user-not-found':
          errorMessage = 'No account found with this email address';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Invalid email address';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'Too many requests. Please try again later';
          break;
        default:
          errorMessage = error.message;
      }

      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

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
          {/* Back Button */}
          <TouchableOpacity
            style={[styles.backButton, { backgroundColor: colors.card }]}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color={colors.primary} />
          </TouchableOpacity>

          {/* Main Content */}
          <View style={styles.contentContainer}>
            {/* Icon */}
            <View style={[styles.iconContainer, { backgroundColor: colors.primary + '20' }]}>
              <Ionicons name="key-outline" size={60} color={colors.primary} />
            </View>

            {/* Title */}
            <Text style={[styles.title, { color: colors.text }]}>
              {t('profile.changePassword', 'Change Password')}
            </Text>

            {/* Subtitle */}
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              {t('profile.forgotPasswordLoggedInDescription', "We'll send a password reset link to your registered email address.")}
            </Text>

            {/* Email Display */}
            <View style={[styles.emailCard, { backgroundColor: colors.card }]}>
              <View style={styles.emailContent}>
                <View style={[styles.emailIcon, { backgroundColor: colors.primary + '20' }]}>
                  <Ionicons name="mail-outline" size={20} color={colors.primary} />
                </View>
                <View style={styles.emailTextContainer}>
                  <Text style={[styles.emailLabel, { color: colors.textSecondary }]}>
                    {t('profile.emailAddress', 'Email Address')}
                  </Text>
                  <Text style={[styles.emailValue, { color: colors.text }]}>
                    {user?.email}
                  </Text>
                </View>
              </View>
            </View>

            {/* Instructions */}
            <View style={[styles.instructionCard, { backgroundColor: colors.card }]}>
              <Text style={[styles.instructionTitle, { color: colors.text }]}>
                {t('profile.instructions', 'Instructions:')}
              </Text>
              <View style={styles.instructionList}>
                <Text style={[styles.instructionItem, { color: colors.textSecondary }]}>
                  • {t('profile.instruction1', 'Check your email inbox')}
                </Text>
                <Text style={[styles.instructionItem, { color: colors.textSecondary }]}>
                  • {t('profile.instruction2', 'Click the reset link in the email')}
                </Text>
                <Text style={[styles.instructionItem, { color: colors.textSecondary }]}>
                  • {t('profile.instruction3', 'Create your new password')}
                </Text>
              </View>
            </View>

            {/* Send Reset Email Button */}
            <TouchableOpacity
              style={[styles.resetButton, { backgroundColor: colors.primary }]}
              onPress={handleResetPassword}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.resetButtonText}>
                  {t('profile.sendResetEmail', 'Send Reset Email')}
                </Text>
              )}
            </TouchableOpacity>

            {/* Back to Profile */}
            <TouchableOpacity
              style={styles.backToProfileButton}
              onPress={() => router.back()}
            >
              <Text style={[styles.backToProfileText, { color: colors.primary }]}>
                {t('profile.backToProfile', 'Back to Profile')}
              </Text>
            </TouchableOpacity>
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
  backButton: {
    position: "absolute",
    top: 50,
    left: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 1,
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
  emailCard: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    width: "100%",
    maxWidth: 400,
    marginBottom: Spacing.lg,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  emailContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  emailIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  emailTextContainer: {
    flex: 1,
  },
  emailLabel: {
    fontSize: 14,
    marginBottom: Spacing.xs,
  },
  emailValue: {
    fontSize: 16,
    fontWeight: "600",
  },
  instructionCard: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    width: "100%",
    maxWidth: 400,
    marginBottom: Spacing.xl,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  instructionTitle: {
    ...Typography.h3,
    fontWeight: "600",
    marginBottom: Spacing.md,
  },
  instructionList: {
    paddingLeft: Spacing.sm,
  },
  instructionItem: {
    ...Typography.body,
    fontSize: 14,
    marginBottom: Spacing.xs,
    lineHeight: 20,
  },
  resetButton: {
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    alignItems: "center",
    marginBottom: Spacing.md,
    width: "100%",
    maxWidth: 400,
  },
  resetButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  backToProfileButton: {
    alignItems: "center",
  },
  backToProfileText: {
    fontSize: 14,
    fontWeight: "500",
  },
});