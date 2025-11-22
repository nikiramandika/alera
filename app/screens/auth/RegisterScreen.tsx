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

export default function RegisterScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { signUp, signInWithGoogle, user } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [loading, setLoading] = useState(false);

  // Redirect authenticated users away from register screen
  useEffect(() => {
    if (user) {
      // User is already logged in, check if they need onboarding
      const hasCompletedOnboarding = user.profile &&
        user.profile.gender &&
        user.profile.weight &&
        user.profile.age;

      if (!hasCompletedOnboarding) {
        router.replace('/screens/auth/OnboardingScreen');
      } else {
        router.replace('/(tabs)');
      }
    }
  }, [user, router]);

  const handleSignUp = async () => {
    console.log('🔍 [DEBUG] RegisterScreen - Form data:', {
      displayName,
      email,
      passwordLength: password.length,
      confirmPasswordLength: confirmPassword.length,
      agreeTerms
    });

    if (!displayName || !email || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    if (!agreeTerms) {
      Alert.alert('Error', 'Please agree to the terms and conditions');
      return;
    }

    setLoading(true);
    try {
      console.log('🔍 [DEBUG] RegisterScreen - Calling signUp with:', {
        email,
        password: '***',
        displayName
      });
      const result = await signUp(email, password, displayName);
      console.log('🔍 [DEBUG] RegisterScreen - signUp result:', result);
      if (result.success) {
        // Navigate to onboarding
        router.replace('/screens/auth/OnboardingScreen');
      } else {
        Alert.alert('Registration Failed', result.error || 'An error occurred');
      }
    } catch (error) {
      console.error('🔍 [DEBUG] RegisterScreen - Error during sign up:', error);
      Alert.alert('Registration Failed', 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setLoading(true);
    try {
      const result = await signInWithGoogle();
      if (result.success) {
        router.replace('/screens/auth/OnboardingScreen');
      } else {
        Alert.alert('Google Sign-Up Failed', result.error || 'An error occurred');
      }
    } catch (error) {
      Alert.alert('Google Sign-Up Failed', 'An unexpected error occurred');
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
          <Text style={[styles.title, { color: colors.text }]}>Create Account</Text>

          {/* Form */}
          <View style={styles.form}>
            {/* Name Input */}
            <View style={styles.inputContainer}>
              <TextInput
                style={[styles.input, { color: colors.text, backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}
                placeholder="Full Name"
                placeholderTextColor={colors.textSecondary}
                value={displayName}
                onChangeText={setDisplayName}
                autoCapitalize="words"
              />
            </View>

            {/* Email Input */}
            <View style={styles.inputContainer}>
              <TextInput
                style={[styles.input, { color: colors.text, backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}
                placeholder="Email address"
                placeholderTextColor={colors.textSecondary}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            {/* Password Input */}
            <View style={styles.inputContainer}>
              <TextInput
                style={[styles.input, { color: colors.text, backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}
                placeholder="Password"
                placeholderTextColor={colors.textSecondary}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>

            {/* Confirm Password Input */}
            <View style={styles.inputContainer}>
              <TextInput
                style={[styles.input, { color: colors.text, backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}
                placeholder="Confirm Password"
                placeholderTextColor={colors.textSecondary}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
              />
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
                I agree with terms &amp; conditions
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
                <Text style={styles.signUpButtonText}>Sign Up</Text>
              )}
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.dividerContainer}>
              <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
              <Text style={[styles.dividerText, { color: colors.textSecondary }]}>Or</Text>
              <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
            </View>

            {/* Google Sign Up */}
            <TouchableOpacity
              style={[styles.googleButton, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={handleGoogleSignUp}
              disabled={loading}
            >
              <Ionicons name="logo-google" size={20} color="#4285F4" />
              <Text style={[styles.googleButtonText, { color: colors.text }]}>Continue with Google</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Sign In Link */}
        <View style={styles.signInContainer}>
          <Text style={[styles.signInText, { color: colors.textSecondary }]}>Already have an account? </Text>
          <TouchableOpacity onPress={() => router.push("/screens/auth/LoginScreen")}>
            <Text style={[styles.signInLink, { color: colors.primary }]}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </View>
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
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: Spacing.lg,
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
  },
  checkboxLabel: {
    fontSize: 14,
    flex: 1,
    lineHeight: 20,
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
