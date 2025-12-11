import React from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, Spacing, BorderRadius, Typography } from '@/constants/theme';
import { useAppTranslation } from '../../src/i18n/utils';

export default function WelcomeScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { t } = useAppTranslation();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />

      <LinearGradient
        colors={[colors.gradientStart, colors.background]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Content */}
      <View style={styles.contentContainer}>
        {/* Header with Logo */}
        <View style={styles.headerContainer}>
          <Image
            source={require("@/assets/images/aleraLogo.png")}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={[styles.title, { color: colors.text }]}>
            {t('app.welcome')}
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {t('app.description')}
          </Text>
        </View>

        {/* Features */}
        <View style={styles.featuresContainer}>
          <View style={styles.featureItem}>
            <View style={[styles.featureIcon, { backgroundColor: colors.primary + '20' }]}>
              <Ionicons name="notifications-outline" size={24} color={colors.primary} />
            </View>
            <View style={styles.featureContent}>
              <Text style={[styles.featureTitle, { color: colors.text }]}>
                {t('auth.smartReminders')}
              </Text>
              <Text style={[styles.featureDescription, { color: colors.textSecondary }]}>
                {t('auth.smartRemindersDesc')}
              </Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <View style={[styles.featureIcon, { backgroundColor: colors.accent + '20' }]}>
              <Ionicons name="heart-outline" size={24} color={colors.accent} />
            </View>
            <View style={styles.featureContent}>
              <Text style={[styles.featureTitle, { color: colors.text }]}>
                {t('auth.habitTracking')}
              </Text>
              <Text style={[styles.featureDescription, { color: colors.textSecondary }]}>
                {t('auth.habitTrackingDesc')}
              </Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <View style={[styles.featureIcon, { backgroundColor: colors.success + '20' }]}>
              <Ionicons name="analytics-outline" size={24} color={colors.success} />
            </View>
            <View style={styles.featureContent}>
              <Text style={[styles.featureTitle, { color: colors.text }]}>
                {t('auth.healthAnalytics')}
              </Text>
              <Text style={[styles.featureDescription, { color: colors.textSecondary }]}>
                {t('auth.healthAnalyticsDesc')}
              </Text>
            </View>
          </View>
        </View>

        {/* Illustration */}

        {/* Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.getStartedButton, { backgroundColor: colors.primary }]}
            onPress={() => router.push("/(auth)/register")}
          >
            <Text style={styles.getStartedButtonText}>{t('auth.getStarted')}</Text>
            <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.loginButton, { borderColor: colors.primary }]}
            onPress={() => router.push("/(auth)/login")}
          >
            <Text style={[styles.loginButtonText, { color: colors.primary }]}>
              {t('auth.signIn')}
            </Text>
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
  contentContainer: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.xl,
    justifyContent: 'space-between',
  },
  headerContainer: {
    alignItems: 'center',
    marginTop: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: Spacing.lg,
  },
  title: {
    ...Typography.h1,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  subtitle: {
    ...Typography.body,
    textAlign: 'center',
    paddingHorizontal: Spacing.lg,
    lineHeight: 22,
  },
  featuresContainer: {
    marginVertical: Spacing.xl,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg,
    paddingHorizontal: Spacing.sm,
  },
  featureIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    ...Typography.h4,
    fontWeight: '600',
    marginBottom: Spacing.xs / 2,
  },
  featureDescription: {
    ...Typography.caption,
    lineHeight: 16,
  },
  image: {
    width: 220,
    height: 220,
    alignSelf: 'center',
    marginVertical: Spacing.lg,
  },
  buttonContainer: {
    width: '100%',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  getStartedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.lg,
    width: '85%',
  },
  getStartedButtonText: {
    ...Typography.body,
    fontWeight: '600',
    color: '#FFFFFF',
    marginRight: Spacing.sm,
  },
  loginButton: {
    borderWidth: 2,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    width: '85%',
  },
  loginButtonText: {
    ...Typography.body,
    fontWeight: '600',
  },
});
