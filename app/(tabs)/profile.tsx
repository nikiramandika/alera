import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Switch,
  Alert,
  Modal,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
  FadeInDown,
} from 'react-native-reanimated';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, Spacing, BorderRadius, Typography } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';

export default function ProfileScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { user, signOut, updateUserProfile } = useAuth();
  const router = useRouter();

  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [loading, setLoading] = useState(false);

  // Animation values
  const headerScale = useSharedValue(0.9);
  const cardTranslateY = useSharedValue(50);

  React.useEffect(() => {
    headerScale.value = withDelay(200, withSpring(1, {
      damping: 15,
      stiffness: 100,
    }));

    cardTranslateY.value = withDelay(400, withSpring(0, {
      damping: 15,
      stiffness: 100,
    }));
  }, []);

  const headerAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: headerScale.value }]
  }));

  const cardsAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: cardTranslateY.value }]
  }));

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await signOut();
            router.replace('/screens/auth/LoginScreen');
          },
        },
      ]
    );
  };

  const handleUpdateProfile = async (updatedData: any) => {
    // Only show loading for profile modal changes, not settings switches
    if (updatedData.displayName || updatedData.profile) {
      setLoading(true);
    }

    try {
      const result = await updateUserProfile(updatedData);
      if (result.success) {
        if (updatedData.displayName || updatedData.profile) {
          setShowEditProfileModal(false);
          // Only show success alert for profile changes, not settings
          Alert.alert('Success', 'Profile updated successfully');
        }
        // Settings changes (notifications, vibration, etc.) update silently
      } else {
        // Only show error for critical errors
        Alert.alert('Error', result.error || 'Failed to update profile');
      }
    } catch (error) {
      // Only show error for critical errors
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const renderProfileHeader = () => (
    <Animated.View style={[headerAnimatedStyle]}>
      <LinearGradient
        colors={[colors.background, colors.backgroundSecondary, colors.gradientStart]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.headerGradient}
      >
        {/* Decorative Circle */}
        <View
          style={[
            styles.circleBackground,
            { backgroundColor: colors.primary + '20' }
          ]}
        />

        {/* Profile Content */}
        <View style={styles.profileContent}>
          <View style={styles.avatarContainer}>
            <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
              <Text style={styles.avatarText}>
                {user?.displayName?.charAt(0).toUpperCase() || 'U'}
              </Text>
            </View>
            <TouchableOpacity style={styles.editAvatarButton}>
              <Ionicons name="camera" size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          <Text style={[styles.userName, { color: colors.text }]}>
            {user?.displayName || 'User'}
          </Text>
          <Text style={[styles.userEmail, { color: colors.textSecondary }]}>
            {user?.email}
          </Text>

          <TouchableOpacity
            style={[styles.editProfileButton, { backgroundColor: colors.card }]}
            onPress={() => setShowEditProfileModal(true)}
          >
            <Ionicons name="create-outline" size={20} color={colors.primary} />
            <Text style={[styles.editProfileText, { color: colors.primary }]}>
              Edit Profile
            </Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </Animated.View>
  );

  const renderProfileInfo = () => (
    <Animated.View
      entering={FadeInDown.delay(100)}
      style={[styles.sectionContainer, { backgroundColor: colors.card }]}
    >
      <Text style={[styles.sectionTitle, { color: colors.text }]}>
        Profile Information
      </Text>

      <View style={styles.infoRow}>
        <View style={styles.infoItem}>
          <Ionicons name="person-outline" size={20} color={colors.primary} />
          <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
            Gender
          </Text>
          <Text style={[styles.infoValue, { color: colors.text }]}>
            {user?.profile?.gender ? user.profile.gender.charAt(0).toUpperCase() + user.profile.gender.slice(1) : 'Not set'}
          </Text>
        </View>
      </View>

      <View style={styles.infoRow}>
        <View style={styles.infoItem}>
          <Ionicons name="scale-outline" size={20} color={colors.primary} />
          <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
            Weight
          </Text>
          <Text style={[styles.infoValue, { color: colors.text }]}>
            {user?.profile?.weight ? `${user.profile.weight} kg` : 'Not set'}
          </Text>
        </View>
      </View>

      <View style={styles.infoRow}>
        <View style={styles.infoItem}>
          <Ionicons name="calendar-outline" size={20} color={colors.primary} />
          <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
            Age
          </Text>
          <Text style={[styles.infoValue, { color: colors.text }]}>
            {user?.profile?.age ? `${user.profile.age} years` : 'Not set'}
          </Text>
        </View>
      </View>

      <View style={styles.infoRow}>
        <View style={styles.infoItem}>
          <Ionicons name="time-outline" size={20} color={colors.primary} />
          <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
            Member Since
          </Text>
          <Text style={[styles.infoValue, { color: colors.text }]}>
            {user?.createdAt ? user.createdAt.toLocaleDateString() : 'Unknown'}
          </Text>
        </View>
      </View>
    </Animated.View>
  );

  const renderSettingsSection = () => (
    <Animated.View
      entering={FadeInDown.delay(200)}
      style={styles.sectionContainer}
    >
      <Text style={[styles.sectionTitle, { color: colors.text }]}>
        Settings
      </Text>

      <View style={[styles.settingsCard, { backgroundColor: colors.card }]}>
        <TouchableOpacity style={styles.settingItem}>
          <View style={styles.settingLeft}>
            <Ionicons name="notifications-outline" size={20} color={colors.primary} />
            <Text style={[styles.settingText, { color: colors.text }]}>
              Notifications
            </Text>
          </View>
          <Switch
            value={user?.settings?.notifications || false}
            onValueChange={(value) => handleUpdateProfile({
              settings: { ...user?.settings, notifications: value }
            })}
          />
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingItem}>
          <View style={styles.settingLeft}>
            <Ionicons name="volume-high-outline" size={20} color={colors.primary} />
            <Text style={[styles.settingText, { color: colors.text }]}>
              Notification Sound
            </Text>
          </View>
          <Switch
            value={user?.settings?.notificationSound || false}
            onValueChange={(value) => handleUpdateProfile({
              settings: { ...user?.settings, notificationSound: value }
            })}
          />
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingItem}>
          <View style={styles.settingLeft}>
            <Ionicons name="phone-portrait-outline" size={20} color={colors.primary} />
            <Text style={[styles.settingText, { color: colors.text }]}>
              Vibration
            </Text>
          </View>
          <Switch
            value={user?.settings?.vibration || false}
            onValueChange={(value) => handleUpdateProfile({
              settings: { ...user?.settings, vibration: value }
            })}
          />
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingItem}>
          <View style={styles.settingLeft}>
            <Ionicons name="language-outline" size={20} color={colors.primary} />
            <Text style={[styles.settingText, { color: colors.text }]}>
              Language
            </Text>
          </View>
          <Text style={[styles.settingValue, { color: colors.textSecondary }]}>
            {user?.settings?.language === 'id' ? 'Indonesian' : 'English'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingItem}>
          <View style={styles.settingLeft}>
            <Ionicons name="moon-outline" size={20} color={colors.primary} />
            <Text style={[styles.settingText, { color: colors.text }]}>
              Theme
            </Text>
          </View>
          <Text style={[styles.settingValue, { color: colors.textSecondary }]}>
            {user?.settings?.theme === 'dark' ? 'Dark' : 'Light'}
          </Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );

  const renderQuickActions = () => (
    <Animated.View
      entering={FadeInDown.delay(300)}
      style={styles.sectionContainer}
    >
      <Text style={[styles.sectionTitle, { color: colors.text }]}>
        Quick Actions
      </Text>

      <View style={styles.quickActionsGrid}>
        <TouchableOpacity
          style={[styles.actionCard, { backgroundColor: colors.card }]}
          onPress={() => router.push('/screens/auth/OnboardingScreen')}
        >
          <Ionicons name="refresh-outline" size={24} color={colors.primary} />
          <Text style={[styles.actionText, { color: colors.text }]}>
            Re-run Onboarding
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionCard, { backgroundColor: colors.card }]}
          onPress={() => {/* Export data functionality */}}
        >
          <Ionicons name="download-outline" size={24} color={colors.primary} />
          <Text style={[styles.actionText, { color: colors.text }]}>
            Export Data
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionCard, { backgroundColor: colors.card }]}
          onPress={() => {/* Privacy policy */}}
        >
          <Ionicons name="shield-outline" size={24} color={colors.primary} />
          <Text style={[styles.actionText, { color: colors.text }]}>
            Privacy Policy
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionCard, { backgroundColor: colors.card }]}
          onPress={() => {/* Terms of service */}}
        >
          <Ionicons name="document-text-outline" size={24} color={colors.primary} />
          <Text style={[styles.actionText, { color: colors.text }]}>
            Terms of Service
          </Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );

  const renderSignOutButton = () => (
    <Animated.View
      entering={FadeInDown.delay(400)}
      style={styles.sectionContainer}
    >
      <TouchableOpacity
        style={[styles.signOutButton, { backgroundColor: '#FF6B6B' }]}
        onPress={handleSignOut}
      >
        <Ionicons name="log-out-outline" size={20} color="#FFFFFF" />
        <Text style={styles.signOutText}>
          Sign Out
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {renderProfileHeader()}
        <Animated.View style={[cardsAnimatedStyle]}>
          {renderProfileInfo()}
          {renderSettingsSection()}
          {renderQuickActions()}
          {renderSignOutButton()}
        </Animated.View>

        <View style={styles.footerSpace} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  headerGradient: {
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xl,
    paddingHorizontal: Spacing.lg,
    minHeight: 280,
  },
  circleBackground: {
    position: 'absolute',
    top: '15%',
    right: '-10%',
    width: 150,
    height: 150,
    borderRadius: 999,
    opacity: 0.3,
  },
  profileContent: {
    alignItems: 'center',
  },
  avatarContainer: {
    marginBottom: Spacing.lg,
    position: 'relative',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 36,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  editAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F47B9F',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  userName: {
    ...Typography.h2,
    fontWeight: '700',
    marginBottom: Spacing.xs,
  },
  userEmail: {
    ...Typography.body,
    marginBottom: Spacing.lg,
  },
  editProfileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  editProfileText: {
    ...Typography.body,
    fontWeight: '600',
    marginLeft: Spacing.sm,
  },
  sectionContainer: {
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
  },
  sectionTitle: {
    ...Typography.h3,
    fontWeight: '600',
    marginBottom: Spacing.md,
  },
  infoRow: {
    marginBottom: Spacing.md,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: 'rgba(0,0,0,0.02)',
  },
  infoLabel: {
    ...Typography.caption,
    marginLeft: Spacing.md,
    flex: 1,
  },
  infoValue: {
    ...Typography.body,
    fontWeight: '600',
  },
  settingsCard: {
    borderRadius: BorderRadius.lg,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      }
    })
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E7',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingText: {
    ...Typography.body,
    marginLeft: Spacing.md,
  },
  settingValue: {
    ...Typography.body,
    color: '#666',
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  actionCard: {
    width: '48%',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    marginBottom: Spacing.sm,
    borderWidth: 1,
  },
  actionText: {
    ...Typography.caption,
    textAlign: 'center',
    marginTop: Spacing.sm,
    fontWeight: '600',
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  signOutText: {
    ...Typography.body,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: Spacing.sm,
  },
  footerSpace: {
    height: 64,
  },
});