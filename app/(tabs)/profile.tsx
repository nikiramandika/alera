import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Switch,
  Alert,
  Platform,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
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
import { useAppTranslation } from '../../src/i18n/utils';

export default function ProfileScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { user, signOut, updateUserProfile, updateProfilePhoto } = useAuth();
  const router = useRouter();
  const { t, changeLanguage, currentLanguage } = useAppTranslation();

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
  }, [headerScale, cardTranslateY]);

  const headerAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: headerScale.value }]
  }));

  const cardsAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: cardTranslateY.value }]
  }));

  const handleSignOut = () => {
    Alert.alert(
      t('profile.logout'),
      t('profile.logoutConfirm'),
      [
        {
          text: t('common.cancel'),
          style: 'cancel',
        },
        {
          text: t('profile.logout'),
          style: 'destructive',
          onPress: async () => {
            await signOut();
            router.replace('/(auth)/welcome');
          },
        },
      ]
    );
  };

  const handleUpdateProfile = async (updatedData: any) => {
    try {
      const result = await updateUserProfile(updatedData);
      if (!result.success) {
        Alert.alert(t('profile.error'), result.error || t('profile.failedToUpdateProfile'));
      }
      // Settings changes update silently
    } catch {
      Alert.alert(t('profile.error'), t('profile.unexpectedError'));
    }
  };

  const handleChoosePhoto = async () => {
    Alert.alert(
      t('profile.profilePhoto'),
      t('profile.choosePhoto'),
      [
        {
          text: t('profile.cancel'),
          style: 'cancel',
        },
        {
          text: t('profile.takePhoto'),
          onPress: () => takePhoto(),
        },
        {
          text: t('profile.chooseFromGallery'),
          onPress: () => pickImage(),
        },
      ]
    );
  };

  const takePhoto = async () => {
    try {
      // Request camera permissions
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(t('profile.permissionRequired'), t('profile.cameraPermission'));
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: 'images',
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      if (!result.canceled && result.assets[0]) {
        const photoURI = result.assets[0].uri;
        await uploadPhoto(photoURI);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert(t('profile.error'), t('profile.failedToTakePhoto'));
    }
  };

  const pickImage = async () => {
    try {
      // Request media library permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(t('profile.permissionRequired'), t('profile.galleryPermission'));
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images',
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      if (!result.canceled && result.assets[0]) {
        const photoURI = result.assets[0].uri;
        await uploadPhoto(photoURI);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert(t('profile.error'), t('profile.failedToSelectPhoto'));
    }
  };

  const uploadPhoto = async (photoURI: string) => {
    try {
      setLoading(true);
      const result = await updateProfilePhoto(photoURI);
      if (!result.success) {
        Alert.alert(t('profile.error'), result.error || t('profile.failedToUpdateProfile'));
      } else {
        Alert.alert(t('common.success'), t('profile.photoUpdatedSuccess'));
      }
    } catch (error) {
      console.error('Error uploading photo:', error);
      Alert.alert(t('profile.error'), t('profile.failedToUploadPhoto'));
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
            {user?.photoURL ? (
              <Image source={{ uri: user.photoURL }} style={styles.avatarImage} />
            ) : (
              <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
                <Text style={styles.avatarText}>
                  {user?.displayName?.charAt(0).toUpperCase() || 'U'}
                </Text>
              </View>
            )}
            <TouchableOpacity
              style={styles.editAvatarButton}
              onPress={handleChoosePhoto}
              disabled={loading}
            >
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
            onPress={() => router.push('/(auth)/edit-profile')}
          >
            <Ionicons name="create-outline" size={20} color={colors.primary} />
            <Text style={[styles.editProfileText, { color: colors.primary }]}>
              {t('profile.editProfile')}
            </Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </Animated.View>
  );

  const renderProfileInfo = () => (
    <Animated.View
      entering={FadeInDown.delay(100)}
      style={styles.sectionContainer}
    >
      <Text style={[styles.sectionTitle, { color: colors.text }]}>
        {t('profile.profileInformation')}
      </Text>

      <View style={[styles.infoCard, { backgroundColor: colors.card }]}>
        <View style={styles.infoRow}>
          <View style={styles.infoItem}>
            <View style={[styles.infoIcon, { backgroundColor: colors.primary + '20' }]}>
              <Ionicons name="person-outline" size={20} color={colors.primary} />
            </View>
            <View style={styles.infoContent}>
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
                {t('profile.gender')}
              </Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>
                {user?.profile?.gender ? user.profile.gender.charAt(0).toUpperCase() + user.profile.gender.slice(1) : t('profile.notSet')}
              </Text>
            </View>
          </View>
        </View>

        <View style={[styles.infoRow, styles.infoRowBorder, { borderBottomColor: colors.border }]}>
          <View style={styles.infoItem}>
            <View style={[styles.infoIcon, { backgroundColor: colors.primary + '20' }]}>
              <Ionicons name="scale-outline" size={20} color={colors.primary} />
            </View>
            <View style={styles.infoContent}>
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
                {t('profile.weight')}
              </Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>
                {user?.profile?.weight ? `${user.profile.weight} ${t('profile.kg')}` : t('profile.notSet')}
              </Text>
            </View>
          </View>
        </View>

        <View style={[styles.infoRow, styles.infoRowBorder, { borderBottomColor: colors.border }]}>
          <View style={styles.infoItem}>
            <View style={[styles.infoIcon, { backgroundColor: colors.primary + '20' }]}>
              <Ionicons name="calendar-outline" size={20} color={colors.primary} />
            </View>
            <View style={styles.infoContent}>
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
                {t('profile.age')}
              </Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>
                {user?.profile?.age ? `${user.profile.age} ${t('profile.years')}` : t('profile.notSet')}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.infoRow}>
          <View style={styles.infoItem}>
            <View style={[styles.infoIcon, { backgroundColor: colors.primary + '20' }]}>
              <Ionicons name="time-outline" size={20} color={colors.primary} />
            </View>
            <View style={styles.infoContent}>
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
                {t('profile.memberSince')}
              </Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>
                {user?.createdAt ? (() => {
                  const createdDate = new Date(user.createdAt);
                  const locale = currentLanguage === 'id' ? 'id-ID' : 'en-US';
                  return createdDate.toLocaleDateString(locale, {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  });
                })() : t('profile.unknown')}
              </Text>
            </View>
          </View>
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
        {t('profile.settingsSection')}
      </Text>

      <View style={[styles.settingsCard, { backgroundColor: colors.card }]}>
        <TouchableOpacity style={styles.settingItem}>
          <View style={styles.settingLeft}>
            <View style={[styles.settingIcon, { backgroundColor: colors.primary + '20' }]}>
              <Ionicons name="notifications-outline" size={20} color={colors.primary} />
            </View>
            <View style={styles.settingContent}>
              <Text style={[styles.settingText, { color: colors.text }]}>
                {t('profile.notifications')}
              </Text>
              <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                {t('profile.receivePushNotifications')}
              </Text>
            </View>
          </View>
          <Switch
            value={user?.settings?.notifications || false}
            onValueChange={(value) => handleUpdateProfile({
              settings: { ...user?.settings, notifications: value }
            })}
          />
        </TouchableOpacity>

        <View style={[styles.settingBorder, { borderBottomColor: colors.border }]} />

        <TouchableOpacity style={styles.settingItem}>
          <View style={styles.settingLeft}>
            <View style={[styles.settingIcon, { backgroundColor: colors.primary + '20' }]}>
              <Ionicons name="volume-high-outline" size={20} color={colors.primary} />
            </View>
            <View style={styles.settingContent}>
              <Text style={[styles.settingText, { color: colors.text }]}>
                {t('profile.notificationSound')}
              </Text>
              <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                {t('profile.playSoundForNotifications')}
              </Text>
            </View>
          </View>
          <Switch
            value={user?.settings?.notificationSound || false}
            onValueChange={(value) => handleUpdateProfile({
              settings: { ...user?.settings, notificationSound: value }
            })}
          />
        </TouchableOpacity>

        <View style={[styles.settingBorder, { borderBottomColor: colors.border }]} />

        <TouchableOpacity style={styles.settingItem}>
          <View style={styles.settingLeft}>
            <View style={[styles.settingIcon, { backgroundColor: colors.primary + '20' }]}>
              <Ionicons name="phone-portrait-outline" size={20} color={colors.primary} />
            </View>
            <View style={styles.settingContent}>
              <Text style={[styles.settingText, { color: colors.text }]}>
                {t('profile.vibration')}
              </Text>
              <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                {t('profile.vibrateForNotifications')}
              </Text>
            </View>
          </View>
          <Switch
            value={user?.settings?.vibration || false}
            onValueChange={(value) => handleUpdateProfile({
              settings: { ...user?.settings, vibration: value }
            })}
          />
        </TouchableOpacity>

        <View style={[styles.settingBorder, { borderBottomColor: colors.border }]} />

        <TouchableOpacity
          style={styles.settingItem}
          onPress={() => changeLanguage(currentLanguage === 'id' ? 'en' : 'id')}
        >
          <View style={styles.settingLeft}>
            <View style={[styles.settingIcon, { backgroundColor: colors.primary + '20' }]}>
              <Ionicons name="language-outline" size={20} color={colors.primary} />
            </View>
            <View style={styles.settingContent}>
              <Text style={[styles.settingText, { color: colors.text }]}>
                {t('profile.language')}
              </Text>
              <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                {currentLanguage === 'id' ? 'Bahasa Indonesia' : 'English'}
              </Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
        </TouchableOpacity>

        <View style={[styles.settingBorder, { borderBottomColor: colors.border }]} />

        <TouchableOpacity
          style={styles.settingItem}
          onPress={() => handleUpdateProfile({
            settings: {
              ...user?.settings,
              theme: user?.settings?.theme === 'dark' ? 'light' : 'dark'
            }
          })}
        >
          <View style={styles.settingLeft}>
            <View style={[styles.settingIcon, { backgroundColor: colors.primary + '20' }]}>
              <Ionicons name="moon-outline" size={20} color={colors.primary} />
            </View>
            <View style={styles.settingContent}>
              <Text style={[styles.settingText, { color: colors.text }]}>
                {t('profile.theme')}
              </Text>
              <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                {user?.settings?.theme === 'dark' ? t('profile.darkMode') : t('profile.lightMode')}
              </Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
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
        {t('profile.quickActions')}
      </Text>

      <View style={styles.quickActionsGrid}>
        <TouchableOpacity
          style={[styles.actionCard, { backgroundColor: colors.card }]}
          onPress={() => router.push('/(auth)/onboarding')}
        >
          <Ionicons name="refresh-outline" size={24} color={colors.primary} />
          <Text style={[styles.actionText, { color: colors.text }]}>
            {t('profile.rerunOnboarding')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionCard, { backgroundColor: colors.card }]}
          onPress={() => {/* Export data functionality */}}
        >
          <Ionicons name="download-outline" size={24} color={colors.primary} />
          <Text style={[styles.actionText, { color: colors.text }]}>
            {t('profile.exportData')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionCard, { backgroundColor: colors.card }]}
          onPress={() => {/* Privacy policy */}}
        >
          <Ionicons name="shield-outline" size={24} color={colors.primary} />
          <Text style={[styles.actionText, { color: colors.text }]}>
            {t('profile.privacyPolicy')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionCard, { backgroundColor: colors.card }]}
          onPress={() => {/* Terms of service */}}
        >
          <Ionicons name="document-text-outline" size={24} color={colors.primary} />
          <Text style={[styles.actionText, { color: colors.text }]}>
            {t('profile.termsOfService')}
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
          {t('profile.signOut')}
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
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.xxl,
    paddingHorizontal: Spacing.lg,
    minHeight: 320,
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
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
  avatarImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
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
  editProfileText: {
    ...Typography.body,
    fontWeight: '600',
    marginLeft: Spacing.sm,
  },
  sectionContainer: {
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.xl,
  },
  sectionTitle: {
    ...Typography.h3,
    fontWeight: '600',
    marginBottom: Spacing.md,
  },
  infoCard: {
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
  infoRow: {
    padding: Spacing.md,
  },
  infoRowBorder: {
    borderBottomWidth: 1,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    ...Typography.caption,
    fontSize: 13,
    marginBottom: 2,
  },
  infoValue: {
    ...Typography.body,
    fontSize: 16,
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
  },
  settingBorder: {
    marginHorizontal: Spacing.md,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  settingContent: {
    flex: 1,
  },
  settingText: {
    ...Typography.body,
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  settingDescription: {
    ...Typography.caption,
    fontSize: 13,
  },
  settingValue: {
    ...Typography.body,
    fontSize: 16,
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
    height: 80,
  },

  // Modal styles
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  modalCancelButton: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.sm,
  },
  modalCancelText: {
    ...Typography.body,
    fontSize: 16,
  },
  modalTitle: {
    ...Typography.h3,
    fontSize: 18,
    fontWeight: '600',
  },
  modalSaveButton: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.sm,
  },
  modalSaveText: {
    ...Typography.body,
    fontSize: 16,
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    padding: Spacing.lg,
  },
  formSection: {
    marginBottom: Spacing.xl,
  },
  formLabel: {
    ...Typography.body,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: Spacing.sm,
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
    ...Typography.body,
    fontSize: 16,
    fontWeight: '500',
  },
  formNote: {
    ...Typography.caption,
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});