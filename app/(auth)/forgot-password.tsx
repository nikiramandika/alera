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
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, Spacing, BorderRadius, Typography } from '@/constants/theme';
import { useTranslation } from 'react-i18next';
import { sendPasswordResetEmail, fetchSignInMethodsForEmail } from 'firebase/auth';
import { auth } from '@/config/firebase';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleResetPassword = async () => {
    if (!email) {
      Alert.alert(t('common.error'), t('auth.enterEmailAddress'));
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert(t('common.error'), t('auth.validEmailAddress'));
      return;
    }

    setLoading(true);
    try {
      // First, check if email exists in Firebase
      const signInMethods = await fetchSignInMethodsForEmail(auth, email);

      if (signInMethods.length === 0) {
        // No account found with this email
        Alert.alert(
          t('auth.emailNotFound'),
          t('auth.emailNotFoundMessage'),
          [
            {
              text: t('auth.tryAgain'),
              onPress: () => {}
            },
            {
              text: t('auth.signUp'),
              onPress: () => router.push('/(auth)/register')
            }
          ]
        );
        return;
      }

      // Email exists, send reset email
      await sendPasswordResetEmail(auth, email);

      Alert.alert(
        t('auth.resetEmailSent'),
        t('auth.resetEmailSentMessage'),
        [
          {
            text: t('common.ok'),
            onPress: () => router.back()
          }
        ]
      );

    } catch (error: any) {
      console.error('Error in forgot password:', error);
      let errorMessage = t('auth.failedToSendResetEmail');

      // Handle specific Firebase auth errors
      if (error?.code) {
        switch (error.code) {
          case 'auth/invalid-email':
            errorMessage = t('auth.invalidEmailFormat');
            break;
          case 'auth/too-many-requests':
            errorMessage = t('auth.tooManyResetRequests');
            break;
          case 'auth/network-request-failed':
            errorMessage = t('auth.networkError');
            break;
          case 'auth/timeout':
            errorMessage = t('auth.requestTimedOut');
            break;
          case 'auth/user-disabled':
            errorMessage = t('auth.accountDisabled');
            break;
          default:
            errorMessage = t('auth.failedToSendResetEmail');
        }
      } else if (error?.message) {
        // Handle error messages that might come from network issues
        if (error.message.includes('network') || error.message.includes('connection')) {
          errorMessage = t('auth.networkError');
        }
      }

      Alert.alert(t('common.error'), errorMessage);
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
              <Ionicons name="lock-closed-outline" size={60} color={colors.primary} />
            </View>

            {/* Title */}
            <Text style={[styles.title, { color: colors.text }]}>
              {t('auth.forgotPassword', 'Forgot Password?')}
            </Text>

            {/* Subtitle */}
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              {t('auth.forgotPasswordDescription', "Don't worry! Enter your email address and we'll send you a link to reset your password.")}
            </Text>

            {/* Form Card */}
            <View style={[styles.formCard, { backgroundColor: colors.card }]}>
              {/* Email Input */}
              <View style={styles.inputContainer}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>
                  {t('auth.emailAddress', 'Email Address')}
                </Text>
                <View style={styles.passwordInputContainer}>
                  <Ionicons
                    name="mail-outline"
                    size={20}
                    color={colors.textSecondary}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={[styles.input, styles.inputWithLeftIcon, {
                      color: colors.text,
                      backgroundColor: colors.backgroundSecondary,
                      borderColor: colors.border
                    }]}
                    placeholder={t('auth.emailPlaceholder', 'Enter your email')}
                    placeholderTextColor={colors.textSecondary}
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                  />
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
                    {t('auth.sendResetEmail', 'Send Reset Email')}
                  </Text>
                )}
              </TouchableOpacity>

              {/* Back to Login */}
              <TouchableOpacity
                style={styles.backToLoginButton}
                onPress={() => router.back()}
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
    flexWrap: 'wrap',
    paddingHorizontal: Spacing.sm,
  },
  subtitle: {
    ...Typography.body,
    textAlign: "center",
    marginBottom: Spacing.xl,
    paddingHorizontal: Spacing.md,
    lineHeight: 22,
    flexWrap: 'wrap',
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
    fontSize: 16,
  },
  passwordInputContainer: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputWithLeftIcon: {
    paddingLeft: Spacing.xl + Spacing.md,
    flex: 1,
  },
  inputIcon: {
    position: 'absolute',
    left: Spacing.md,
    zIndex: 1,
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
});