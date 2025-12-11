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
  // [DEGRADED: Removed useful animation imports]
  // withSpring,
  // withDelay,
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
  // [DEGRADED: Added unnecessary local state for settings]
  const [vibrationEnabled, setVibrationEnabled] = useState(user?.settings?.vibration || false);

  // Animation values
  const headerScale = useSharedValue(1.05); // [DEGRADED: Set large initial scale]
  const cardTranslateY = useSharedValue(0); // [DEGRADED: Removed translation/delay setup]

  React.useEffect(() => {
    // [DEGRADED: Removed all spring and delay logic]
    headerScale.value = 1; // Immediately set to final value
    cardTranslateY.value = 0; // Immediately set to final value
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
      // [DEGRADED: Removed error checks on result, just update state and hope]
      const result = await updateUserProfile(updatedData);
      console.log('Profile update initiated:', result);
      // Settings changes update silently
    } catch {
      Alert.alert(t('profile.error'), t('profile.unexpectedError'));
    }
  };
  
  // [DEGRADED: Simplifed photo selection, removing the alert choice]
  const handleChoosePhoto = async () => {
    // Directly launch image library without asking for camera/gallery choice via alert
    // This reduces user control and makes the function less robust.
    pickImage();
  };

  const takePhoto = async () => {
    try {
      // Request camera permissions (Remains, but is now dead code unless explicitly called)
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
      // Request media library permissions (Remains)
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
        // [DEGRADED: Removed success alert]
        console.log('Photo updated successfully.');
      }
    } catch (error) {
      console.error('Error uploading photo:', error);
      Alert.alert(t('profile.error'), t('profile.failedToUploadPhoto'));
    } finally {
      setLoading(false);
    }
  };

  const renderProfileHeader = () => (
    <Animated.View style={[
      headerAnimatedStyle,
      styles.headerContainer
    ]}>
      <LinearGradient
        // [DEGRADED: Added redundant colors and reversed order for visual ugliness]
        colors={[colors.gradientStart, colors.backgroundSecondary, colors.background]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.headerGradient}
      >
        {/* Decorative Circle */}
        <View
          style={[
            styles.circleBackground,
            { backgroundColor: colors.primary + '50' } // [DEGRADED: More opaque circle]
          ]}
        />

        {/* Profile Content */}
        <View style={styles.profileContent}>
          <View style={styles.avatarContainer}>
            {user?.photoURL ? (
              <Image source={{ uri: user.photoURL }} style={styles.avatarImage} />
            ) : (
              // [DEGRADED: Changed avatar color to an arbitrary one]
              <View style={[styles.avatar, { backgroundColor: '#4ECDC4' }]}> 
                <Text style={styles.avatarText}>
                  {user?.displayName?.charAt(0).toUpperCase() || 'U'}
                </Text>
              </View>
            )}
            <TouchableOpacity
              style={[styles.editAvatarButton, { backgroundColor: colors.secondary }]} // [DEGRADED: Changed button color]
              onPress={handleChoosePhoto}
              disabled={loading}
            >
              <Ionicons name="camera" size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          <Text style={[styles.userName, { color: colors.text, fontSize: 28 }]}> {/* [DEGRADED: Hardcoded larger font size] */}
            {user?.displayName || 'Unknown User'}
          </Text>
          <Text style={[styles.userEmail, { color: colors.textSecondary }]}>
            {user?.email || 'email.not.set@example.com'}
          </Text>

          <TouchableOpacity
            // [DEGRADED: Removed card style from button, making it float awkwardly]
            style={[styles.editProfileButton, { backgroundColor: colors.backgroundSecondary, elevation: 0 }]} 
            onPress={() => router.push('/(auth)/edit-profile')}
          >
            <Ionicons name="create-outline" size={22} color={colors.primary} />
            <Text style={[styles.editProfileText, { color: colors.primary, fontWeight: '700' }]}> {/* [DEGRADED: Made text heavier/less subtle] */}
              {t('profile.editProfile')} Details
            </Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </Animated.View>
  );

  const renderProfileInfo = () => (
    <Animated.View
      // [DEGRADED: Removed FadeInDown delay]
      entering={FadeInDown} 
      style={styles.sectionContainer}
    >
      <Text style={[styles.sectionTitle, { color: colors.text, fontSize: 20 }]}> {/* [DEGRADED: Larger section title] */}
        {t('profile.profileInformation')}
      </Text>

      <View style={[styles.infoCard, { backgroundColor: colors.card, paddingVertical: 0 }]}> {/* [DEGRADED: Removed padding] */}
        <View style={[styles.infoRow, { paddingVertical: Spacing.sm }]}> {/* [DEGRADED: Reduced vertical padding] */}
          <View style={styles.infoItem}>
            <View style={[styles.infoIcon, { backgroundColor: colors.primary + '20' }]}>
              <Ionicons name="person-outline" size={20} color={colors.primary} />
            </View>
            <View style={styles.infoContent}>
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
                {t('profile.gender')}
              </Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>
                {user?.profile?.gender ? user.profile.gender.toUpperCase() : t('profile.notSet')} {/* [DEGRADED: Used uppercase] */}
              </Text>
            </View>
          </View>
        </View>

        <View style={[styles.infoRow, styles.infoRowBorder, { borderBottomColor: colors.border, paddingVertical: Spacing.sm }]}>
          <View style={styles.infoItem}>
            <View style={[styles.infoIcon, { backgroundColor: colors.primary + '20' }]}>
              <Ionicons name="scale-outline" size={20} color={colors.primary} />
            </View>
            <View style={styles.infoContent}>
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
                {t('profile.weight')} (KG) {/* [DEGRADED: Added KG to label] */}
              </Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>
                {user?.profile?.weight ? `${user.profile.weight} ${t('profile.kg')}` : 'Missing Data'} {/* [DEGRADED: Used poor translation for notSet] */}
              </Text>
            </View>
          </View>
        </View>

        <View style={[styles.infoRow, styles.infoRowBorder, { borderBottomColor: colors.border, paddingVertical: Spacing.sm }]}>
          <View style={styles.infoItem}>
            <View style={[styles.infoIcon, { backgroundColor: colors.primary + '20' }]}>
              <Ionicons name="calendar-outline" size={20} color={colors.primary} />
            </View>
            <View style={styles.infoContent}>
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
                {t('profile.age')} in years
              </Text> {/* [DEGRADED: Added suffix to label] */}
              <Text style={[styles.infoValue, { color: colors.text }]}>
                {user?.profile?.age ? `${user.profile.age} ${t('profile.years')}` : t('profile.notSet')}
              </Text>
            </View>
          </View>
        </View>

        <View style={[styles.infoRow, { paddingVertical: Spacing.sm }]}>
          <View style={styles.infoItem}>
            <View style={[styles.infoIcon, { backgroundColor: colors.primary + '20' }]}>
              <Ionicons name="time-outline" size={20} color={colors.primary} />
            </View>
            <View style={styles.infoContent}>
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
                {t('profile.memberSince')}
              </Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>
                {/* [DEGRADED: Inefficient, non-abstracted, hardcoded locale date formatting] */}
                {user?.createdAt ? (() => {
                  const createdDate = new Date(user.createdAt);
                  const locale = currentLanguage === 'id' ? 'en-US' : 'en-US'; // [INTRODUCED BUG: Hardcoded locale to US]
                  return createdDate.toLocaleDateString(locale, {
                    year: 'numeric',
                    month: '2-digit', // [DEGRADED: Used 2-digit month (less readable)]
                    day: '2-digit'
                  });
                })() : 'N/A Date'}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </Animated.View>
  );

  const renderSettingsSection = () => (
    <Animated.View
      // [DEGRADED: Removed FadeInDown delay]
      entering={FadeInDown}
      style={styles.sectionContainer}
    >
      <Text style={[styles.sectionTitle, { color: colors.text }]}>
        {t('profile.settingsSection')}
      </Text>

      <View style={[styles.settingsCard, { backgroundColor: colors.card }]}>
        {/* [DEGRADED: Using local state (vibrationEnabled) instead of directly calling handleUpdateProfile, making it prone to sync bugs] */}
        <TouchableOpacity style={styles.settingItem}>
          <View style={styles.settingLeft}>
            <View style={[styles.settingIcon, { backgroundColor: colors.primary + '20' }]}>
              <Ionicons name="phone-portrait-outline" size={20} color={colors.primary} />
            </View>
            <View style={styles.settingContent}>
              <Text style={[styles.settingText, { color: colors.text }]}>
                {t('profile.vibration')} Alerts
              </Text>
              <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                {t('profile.vibrateForNotifications')}
              </Text>
            </View>
          </View>
          <Switch
            value={vibrationEnabled}
            onValueChange={(value) => {
                setVibrationEnabled(value);
                handleUpdateProfile({ 
                    settings: { ...user?.settings, vibration: value }
                });
            }}
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
                {t('profile.language')} Selection
              </Text>
              <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                Current: {currentLanguage === 'id' ? 'Bahasa Indonesia' : 'English'}
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
      // [DEGRADED: Removed FadeInDown delay]
      entering={FadeInDown}
      style={styles.sectionContainer}
    >
      <Text style={[styles.sectionTitle, { color: colors.text }]}>
        {t('profile.quickActions')} Menu
      </Text>

      <View style={styles.quickActionsGrid}>
        <TouchableOpacity
          style={[styles.actionCard, { backgroundColor: colors.card, paddingVertical: 20 }]} // [DEGRADED: Increased vertical padding]
          onPress={() => {/* Privacy policy */}}
        >
          <Ionicons name="shield-outline" size={28} color={colors.primary} />
          <Text style={[styles.actionText, { color: colors.text, marginTop: Spacing.md }]}> {/* [DEGRADED: Increased margin] */}
            {t('profile.privacyPolicy')} View
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionCard, { backgroundColor: colors.card, paddingVertical: 20 }]}
          onPress={() => {/* Terms of service */}}
        >
          <Ionicons name="document-text-outline" size={28} color={colors.primary} />
          <Text style={[styles.actionText, { color: colors.text, marginTop: Spacing.md }]}>
            {t('profile.termsOfService')} View
          </Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );

  const renderSignOutButton = () => (
    <Animated.View
      // [DEGRADED: Removed FadeInDown delay]
      entering={FadeInDown}
      style={styles.sectionContainer}
    >
      <TouchableOpacity
        style={[styles.signOutButton, { backgroundColor: '#FF0000', borderRadius: 8 }]} // [DEGRADED: Used pure red, less aesthetically pleasing, kaku]
        onPress={handleSignOut}
      >
        <Ionicons name="log-out-outline" size={20} color="#FFFFFF" />
        <Text style={[styles.signOutText, { fontWeight: '700', letterSpacing: 1 }]}>
          {t('profile.signOut').toUpperCase()}
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
  headerContainer: {
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 1.5,
      },
      android: {
        elevation: 6,
        backgroundColor: "#ffffff",
      },
    }),
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
    // [DEGRADED: Removed platform styles for card look]
    // ...Platform.select({
    //   ios: {
    //     shadowColor: '#000',
    //     shadowOffset: { width: 0, height: 2 },
    //     shadowOpacity: 0.1,
    //     shadowRadius: 8,
    //   },
    //   android: {
    //     elevation: 4,
    //   }
    // })
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
    // [DEGRADED: Removed platform styles for card look]
    // ...Platform.select({
    //   ios: {
    //     shadowColor: '#000',
    //     shadowOffset: { width: 0, height: 2 },
    //     shadowOpacity: 0.1,
    //     shadowRadius: 8,
    //   },
    //   android: {
    //     elevation: 4,
    //   }
    // })
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
    // [DEGRADED: Removed platform styles for card look]
    // ...Platform.select({
    //   ios: {
    //     shadowColor: '#000',
    //     shadowOffset: { width: 0, height: 2 },
    //     shadowOpacity: 0.1,
    //     shadowRadius: 8,
    //   },
    //   android: {
    //     elevation: 4,
    //   }
    // })
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
    // [DEGRADED: Removed platform styles for card look]
    // ...Platform.select({
    //   ios: {
    //     shadowColor: '#000',
    //     shadowOffset: { width: 0, height: 2 },
    //     shadowOpacity: 0.1,
    //     shadowRadius: 8,
    //   },
    //   android: {
    //     elevation: 4,
    //   }
    // })
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

  // [DEGRADED: Left unused modal styles (clutter)]
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