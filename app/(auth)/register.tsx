import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "@/contexts/AuthContext";
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, Spacing, BorderRadius, Typography } from '@/constants/theme';
import { useTranslation } from 'react-i18next';
import TermsAndConditions, { useTermsAndConditions } from '@/components/common/TermsAndConditions';

export default function RegisterScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { signUp, signInWithGoogle, user } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { visible: showTermsModal, showTerms: handleShowTerms, hideTerms: hideTermsModal } = useTermsAndConditions();

  // Redirect authenticated users away from register screen
  useEffect(() => {
    if (user) {
      // User is already logged in, check if they need onboarding
      const hasCompletedOnboarding = user.profile &&
        user.profile.gender &&
        user.profile.weight &&
        user.profile.age;

      if (!hasCompletedOnboarding) {
        router.replace('/(auth)/onboarding');
      } else {
        router.replace('/(tabs)');
      }
    }
  }, [user, router]);

  const handleSignUp = async () => {
    if (!displayName || !email || !password || !confirmPassword) {
      Alert.alert(t('common.error'), t('auth.fillAllFields'));
      return;
    }

    // Basic name validation
    if (displayName.trim().length < 2) {
      Alert.alert(t('common.error'), t('auth.validName'));
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert(t('common.error'), t('auth.validEmailAddress'));
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert(t('common.error'), t('auth.passwordsDoNotMatch'));
      return;
    }

    if (password.length < 6) {
      Alert.alert(t('common.error'), t('auth.passwordTooShort'));
      return;
    }

    if (!agreeTerms) {
      Alert.alert(t('common.error'), t('auth.agreeTerms'));
      return;
    }

    setLoading(true);
    try {
      const result = await signUp(email, password, displayName);
      if (result.success) {
        // Navigate to onboarding
        router.replace('/(auth)/onboarding');
      } else {
        let errorMessage = '';

        // Handle specific Firebase auth errors
        if (result.error) {
          if (result.error.includes('email-already-in-use') ||
              result.error.includes('email-already-exists')) {
            errorMessage = t('auth.emailAlreadyExists');
          } else if (result.error.includes('weak-password')) {
            errorMessage = t('auth.weakPassword');
          } else if (result.error.includes('invalid-email')) {
            errorMessage = t('auth.invalidEmailFormat');
          } else if (result.error.includes('operation-not-allowed')) {
            errorMessage = t('auth.registrationDisabled');
          } else if (result.error.includes('too-many-requests')) {
            errorMessage = t('auth.tooManyRequests');
          } else if (result.error.includes('network')) {
            errorMessage = t('auth.networkError');
          } else {
            errorMessage = `${t('auth.registrationError')}: ${result.error}`;
          }
        } else {
          errorMessage = t('auth.registrationError');
        }

        Alert.alert(t('auth.registerFailed'), errorMessage);
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      let errorMessage = t('auth.registrationError');

      // Handle any unexpected Firebase errors
      if (error?.code) {
        switch (error.code) {
          case 'auth/email-already-in-use':
          case 'auth/email-already-exists':
            errorMessage = t('auth.emailAlreadyExists');
            break;
          case 'auth/weak-password':
            errorMessage = t('auth.weakPassword');
            break;
          case 'auth/invalid-email':
            errorMessage = t('auth.invalidEmailFormat');
            break;
          case 'auth/operation-not-allowed':
            errorMessage = t('auth.registrationDisabled');
            break;
          case 'auth/too-many-requests':
            errorMessage = t('auth.tooManyRequests');
            break;
          case 'auth/network-request-failed':
            errorMessage = t('auth.networkError');
            break;
          default:
            errorMessage = t('auth.registrationError');
        }
      }

      Alert.alert(t('auth.registerFailed'), errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setLoading(true);
    try {
      const result = await signInWithGoogle();
      if (result.success) {
        router.replace('/(auth)/onboarding');
      } else {
        // Handle cancelled sign-up gracefully - don't show error for user cancellation
        if (result.error?.includes('cancelled')) {
          console.log('Google Sign-Up was cancelled by user');
          return;
        }

        let errorMessage = t('auth.googleSignUpFailed');
        if (result.error) {
          if (result.error.includes('network')) {
            errorMessage = t('auth.networkError');
          } else if (result.error.includes('too-many-requests')) {
            errorMessage = t('auth.tooManyRequests');
          } else if (result.error.includes('incomplete')) {
            errorMessage = t('auth.incompleteAuth');
          } else {
            errorMessage = result.error;
          }
        }

        Alert.alert(t('auth.googleSignUpFailed'), errorMessage);
      }
    } catch (error: any) {
      console.error('Google sign-up error:', error);
      let errorMessage = t('auth.googleSignUpFailed');

      if (error?.code) {
        switch (error.code) {
          case 'auth/popup-closed-by-user':
          case 'auth/cancelled-popup-request':
            // Silently handle cancellation
            console.log('Google Sign-Up was cancelled by user');
            return;
          case 'auth/popup-blocked':
            errorMessage = t('auth.popupBlocked');
            break;
          case 'auth/network-request-failed':
            errorMessage = t('auth.networkError');
            break;
          default:
            errorMessage = t('auth.googleSignUpFailed');
        }
      }

      Alert.alert(t('auth.googleSignUpFailed'), errorMessage);
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

      {/* Back Button */}
      <TouchableOpacity
        style={[styles.backButton, { backgroundColor: colors.card }]}
        onPress={() => router.back()}
      >
        <Ionicons name="arrow-back" size={24} color={colors.primary} />
      </TouchableOpacity>

      {/* Main Content - Centered */}
      <View style={styles.contentContainer}>
        {/* Register Card */}
        <View style={[styles.registerCard, { backgroundColor: colors.card }]}>
          {/* Title */}
          <Text style={[styles.title, { color: colors.text }]}>{t('auth.createAccount')}</Text>

          {/* Form */}
          <View style={styles.form}>
            {/* Name Input */}
            <View style={styles.inputContainer}>
              <View style={styles.passwordInputContainer}>
                <Ionicons
                  name="person-outline"
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
                  placeholder={t('auth.fullName')}
                  placeholderTextColor={colors.textSecondary}
                  value={displayName}
                  onChangeText={setDisplayName}
                  autoCapitalize="words"
                />
              </View>
            </View>

            {/* Email Input */}
            <View style={styles.inputContainer}>
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
                  placeholder={t('auth.emailPlaceholder')}
                  placeholderTextColor={colors.textSecondary}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            </View>

            {/* Password Input */}
            <View style={styles.inputContainer}>
              <View style={styles.passwordInputContainer}>
                <Ionicons
                  name="lock-closed-outline"
                  size={20}
                  color={colors.textSecondary}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={[styles.input, styles.passwordInput, {
                    color: colors.text,
                    backgroundColor: colors.backgroundSecondary,
                    borderColor: colors.border
                  }]}
                  placeholder={t('auth.passwordPlaceholder')}
                  placeholderTextColor={colors.textSecondary}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity
                  style={styles.eyeIcon}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color={colors.textSecondary}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Confirm Password Input */}
            <View style={styles.inputContainer}>
              <View style={styles.passwordInputContainer}>
                <Ionicons
                  name="checkmark-circle-outline"
                  size={20}
                  color={colors.textSecondary}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={[styles.input, styles.passwordInput, {
                    color: colors.text,
                    backgroundColor: colors.backgroundSecondary,
                    borderColor: colors.border
                  }]}
                  placeholder={t('auth.confirmPassword')}
                  placeholderTextColor={colors.textSecondary}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showConfirmPassword}
                />
                <TouchableOpacity
                  style={styles.eyeIcon}
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  <Ionicons
                    name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color={colors.textSecondary}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Terms and Conditions Checkbox */}
            <View style={styles.checkboxContainer}>
              <TouchableOpacity
                style={[styles.checkbox, { borderColor: colors.primary }]}
                onPress={() => setAgreeTerms(!agreeTerms)}
              >
                {agreeTerms && (
                  <Ionicons name="checkmark" size={16} color={colors.primary} />
                )}
              </TouchableOpacity>
              <Text style={[styles.checkboxLabel, { color: colors.textSecondary }]}>
                {t('auth.agreeTermsText')}{' '}
                <Text
                  style={[styles.termsLink, { color: colors.primary }]}
                  onPress={handleShowTerms}
                >
                  {t('auth.termsConditions')}
                </Text>
              </Text>
            </View>

            {/* Sign Up Button */}
            <TouchableOpacity
              style={[styles.signUpButton, { backgroundColor: colors.primary }]}
              onPress={handleSignUp}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.signUpButtonText}>{t('auth.signUp')}</Text>
              )}
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.dividerContainer}>
              <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
              <Text style={[styles.dividerText, { color: colors.textSecondary }]}>{t('auth.or')}</Text>
              <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
            </View>

            {/* Google Sign Up */}
            <TouchableOpacity
              style={[styles.googleButton, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={handleGoogleSignUp}
              disabled={loading}
            >
              <Ionicons name="logo-google" size={20} color="#4285F4" />
              <Text style={[styles.googleButtonText, { color: colors.text }]}>{t('auth.continueWithGoogle')}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Sign In Link */}
        <View style={styles.signInContainer}>
          <Text style={[styles.signInText, { color: colors.textSecondary }]}>{t('auth.alreadyHaveAccount')} </Text>
          <TouchableOpacity onPress={() => router.push("/(auth)/login")}>
            <Text style={[styles.signInLink, { color: colors.primary }]}>{t('auth.signIn')}</Text>
          </TouchableOpacity>
        </View>
      </View>
      <TermsAndConditions visible={showTermsModal} onClose={hideTermsModal} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  },
  contentContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
  },
  registerCard: {
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
  title: {
    ...Typography.h1,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: Spacing.xl,
    flexWrap: 'wrap',
    paddingHorizontal: Spacing.sm,
  },
  form: {
    width: "100%",
  },
  inputContainer: {
    marginBottom: Spacing.md,
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
  passwordInput: {
    paddingLeft: Spacing.xl + Spacing.md,
    paddingRight: Spacing.xl + 32,
    flex: 1,
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
  eyeIcon: {
    position: 'absolute',
    right: Spacing.md,
    zIndex: 1,
  },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: Spacing.lg,
    flexWrap: 'wrap',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderRadius: BorderRadius.sm / 2,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.sm,
    marginTop: 2,
    flexShrink: 0,
  },
  checkboxLabel: {
    fontSize: 14,
    flex: 1,
    flexShrink: 1,
    lineHeight: 20,
  },
  termsLink: {
    fontSize: 14,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  signUpButton: {
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  signUpButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    marginHorizontal: Spacing.sm,
    fontSize: 14,
  },
  googleButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
  },
  googleButtonText: {
    marginLeft: Spacing.sm,
    fontSize: 16,
    fontWeight: "500",
  },
  signInContainer: {
    flexDirection: "row",
    marginTop: Spacing.lg,
    alignItems: "center",
  },
  signInText: {
    fontSize: 14,
  },
  signInLink: {
    fontSize: 14,
    fontWeight: "600",
  },
});
