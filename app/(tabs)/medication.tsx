import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  Platform,
  ScrollView,
  RefreshControl,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
  FadeInDown
} from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, Spacing, BorderRadius, Typography } from '@/constants/theme';
import { useMedicine } from '@/contexts/MedicineContext';

// Types
interface Medication {
  id: string;
  name: string;
  dosage: string;
  time: string;
  frequency: string;
  remaining: number;
  total: number;
  color: string;
  taken: boolean;
  instructions: string;
}

// Mock medication data
const mockMedications = [
  {
    id: '1',
    name: 'Vitamin D',
    dosage: '1000 IU',
    time: '08:00 AM',
    frequency: 'Daily',
    remaining: 25,
    total: 30,
    color: '#FFD93D',
    taken: false,
    instructions: 'Take with breakfast'
  },
  {
    id: '2',
    name: 'Omega-3',
    dosage: '500mg',
    time: '12:00 PM',
    frequency: 'Daily',
    remaining: 18,
    total: 30,
    color: '#4ECDC4',
    taken: true,
    instructions: 'Take with lunch'
  },
  {
    id: '3',
    name: 'Probiotics',
    dosage: '10B CFU',
    time: '08:00 PM',
    frequency: 'Daily',
    remaining: 12,
    total: 20,
    color: '#F47B9F',
    taken: false,
    instructions: 'Take before bed'
  }
];

export default function MedicationScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { medicines, loading, refreshMedicines, markMedicineTaken, markMedicineSkipped, getTodaySchedule, getOverdueMeds } = useMedicine();

  const [selectedMedication, setSelectedMedication] = useState<any>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Animation values
  const headerScale = useSharedValue(0.9);
  const cardTranslateY = useSharedValue(50);

  useEffect(() => {
    // Animate header in
    headerScale.value = withDelay(200, withSpring(1, {
      damping: 15,
      stiffness: 100,
    }));

    // Animate cards in
    cardTranslateY.value = withDelay(400, withSpring(0, {
      damping: 15,
      stiffness: 100,
    }));

    // Update time every minute
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshMedicines();
    setRefreshing(false);
  };

  // Animated styles
  const headerAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: headerScale.value }]
  }));

  const cardsAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: cardTranslateY.value }]
  }));

  const toggleMedicationStatus = async (medicineId: string, time: string) => {
    const scheduledTime = new Date();
    const [hours, minutes] = time.split(':').map(Number);
    scheduledTime.setHours(hours, minutes, 0, 0);

    // If time is in the past, schedule for tomorrow
    if (scheduledTime < currentTime) {
      scheduledTime.setDate(scheduledTime.getDate() + 1);
    }

    const result = await markMedicineTaken(medicineId, scheduledTime);
    if (!result.success) {
      Alert.alert('Error', result.error || 'Failed to mark medicine as taken');
    } else {
      await refreshMedicines();
    }
  };

  const getNextDoseTime = (time: string) => {
    const [hours, minutes, period] = time.split(/[:\s]/);
    let hour24 = parseInt(hours);
    if (period === 'PM' && hour24 !== 12) hour24 += 12;
    if (period === 'AM' && hour24 === 12) hour24 = 0;

    const now = currentTime;
    const medTime = new Date();
    medTime.setHours(hour24, parseInt(minutes), 0, 0);

    if (medTime <= now) {
      medTime.setDate(medTime.getDate() + 1);
    }

    const diffMs = medTime.getTime() - now.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    if (diffHours > 24) return 'Tomorrow';
    if (diffHours > 0) return In ${diffHours}h ${diffMins}m;
    if (diffMins > 0) return In ${diffMins}m;
    return 'Now';
  };

  const getCompletionPercentage = () => {
    const todaySchedule = getTodaySchedule();
    if (todaySchedule.length === 0) return 100;

    // Calculate completion based on today's history
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // This is a simplified calculation - in a real app, you'd check the history
    return Math.floor(Math.random() * 40) + 30; // Mock completion rate for now
  };

  const renderMedicationCard = ({ item, index }: { item: any; index: number }) => (
    <Animated.View
      entering={FadeInDown.delay(index * 100)}
      style={[
        styles.medicationCard,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          borderWidth: 1,
          shadowColor: colors.shadow,
        }
      ]}
    >
      <TouchableOpacity
        style={styles.cardContent}
        onPress={() => {
          setSelectedMedication(item);
          setShowDetailModal(true);
        }}
        activeOpacity={0.7}
      >
        <View style={[styles.colorIndicator, { backgroundColor: item.color }]} />

        <View style={styles.medicationInfo}>
          <View style={styles.headerRow}>
            <Text style={[styles.medicationName, { color: colors.text }]}>
              {item.medicineName}
            </Text>
            <TouchableOpacity
              style={[
                styles.checkButton,
                {
                  backgroundColor: colors.backgroundSecondary,
                  borderColor: colors.border
                }
              ]}
              onPress={() => {
                if (item.frequency.times.length > 0) {
                  toggleMedicationStatus(item.reminderId, item.frequency.times[0]);
                }
              }}
            >
              <Ionicons
                name="checkmark-outline"
                size={20}
                color={colors.icon}
              />
            </TouchableOpacity>
          </View>

          <Text style={[styles.dosage, { color: colors.textSecondary }]}>
            {item.dosage} • {item.medicineType}
          </Text>

          <View style={styles.timeRow}>
            <Ionicons name="time-outline" size={16} color={colors.textSecondary} />
            <Text style={[styles.time, { color: colors.textSecondary }]}>
              {item.frequency.times.join(', ')}
            </Text>
            <Text style={[styles.nextDose, { color: colors.primary }]}>
              {item.frequency.times.length > 0 ? getNextDoseTime(item.frequency.times[0]) : 'As needed'}
            </Text>
          </View>

          <View style={styles.progressRow}>
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: ${(item.stockQuantity / Math.max(item.stockQuantity, item.stockAlert)) * 100}%,
                      backgroundColor: item.color,
                    }
                  ]}
                />
              </View>
              <Text style={[styles.progressText, { color: colors.textSecondary }]}>
                {item.stockQuantity} left
              </Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );

  
  const renderDetailModal = () => (
    <Modal
      visible={showDetailModal}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setShowDetailModal(false)}
    >
      <BlurView
        intensity={100}
        tint={colorScheme === 'dark' ? 'dark' : 'light'}
        style={styles.modalOverlay}
      >
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          {selectedMedication && (
            <>
              <View style={styles.modalHeader}>
                <TouchableOpacity onPress={() => setShowDetailModal(false)}>
                  <Ionicons name="close-outline" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.modalTitle, { color: colors.text }]}>
                  {selectedMedication?.medicineName}
                </Text>
                <TouchableOpacity onPress={() => router.push('/screens/medication/AddMedicineScreen')}>
                  <Ionicons name="create-outline" size={20} color={colors.primary} />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
                <View style={[styles.detailCard, { backgroundColor: colors.card }]}>
                  <View style={[styles.colorIndicatorLarge, { backgroundColor: selectedMedication?.color || '#F47B9F' }]} />
                  <Text style={[styles.detailName, { color: colors.text }]}>
                    {selectedMedication?.medicineName}
                  </Text>
                  <Text style={[styles.detailDosage, { color: colors.textSecondary }]}>
                    {selectedMedication?.dosage} • {selectedMedication?.medicineType}
                  </Text>
                </View>

                <View style={[styles.detailSection, { backgroundColor: colors.card }]}>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>Schedule</Text>
                  <Text style={[styles.sectionContent, { color: colors.textSecondary }]}>
                    {selectedMedication?.frequency.times.join(', ')} • {selectedMedication?.frequency.type}
                  </Text>
                </View>

                <View style={[styles.detailSection, { backgroundColor: colors.card }]}>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>Instructions</Text>
                  <Text style={[styles.sectionContent, { color: colors.textSecondary }]}>
                    {selectedMedication?.instructions || 'No specific instructions'}
                  </Text>
                </View>

                <View style={[styles.detailSection, { backgroundColor: colors.card }]}>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>Duration</Text>
                  <Text style={[styles.sectionContent, { color: colors.textSecondary }]}>
                    Started: {selectedMedication?.duration.startDate.toLocaleDateString()}
                    {selectedMedication?.duration.endDate &&
                      ` • Ends: ${selectedMedication.duration.endDate.toLocaleDateString()}`
                    }
                  </Text>
                </View>

                <View style={[styles.detailSection, { backgroundColor: colors.card }]}>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>Stock</Text>
                  <Text style={[styles.sectionContent, { color: colors.textSecondary }]}>
                    {selectedMedication?.stockQuantity} remaining (Alert at {selectedMedication?.stockAlert})
                  </Text>
                </View>

                {selectedMedication?.notes && (
                  <View style={[styles.detailSection, { backgroundColor: colors.card }]}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Notes</Text>
                    <Text style={[styles.sectionContent, { color: colors.textSecondary }]}>
                      {selectedMedication.notes}
                    </Text>
                  </View>
                )}
              </ScrollView>
            </>
          )}
        </SafeAreaView>
      </BlurView>
    </Modal>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header with gradient */}
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

            <View style={styles.headerContent}>
              <Text style={[styles.greeting, { color: colors.textSecondary }]}>
                Medication Management
              </Text>
              <Text style={[styles.title, { color: colors.text }]}>
                Your Daily Medications
              </Text>
            </View>

            {/* Progress Overview */}
            <View style={[styles.progressCard, { backgroundColor: colors.card }]}>
              <View style={styles.progressHeader}>
                <Text style={[styles.progressTitle, { color: colors.text }]}>
                  Today's Progress
                </Text>
                <Text style={[styles.progressPercentage, { color: colors.primary }]}>
                  {getCompletionPercentage()}%
                </Text>
              </View>
              <View style={styles.overallProgress}>
                <View style={styles.overallProgressBar}>
                  <View
                    style={[
                      styles.overallProgressFill,
                      {
                        width: ${getCompletionPercentage()}%,
                        backgroundColor: colors.success,
                      }
                    ]}
                  />
                </View>
                <Text style={[styles.progressLabel, { color: colors.textSecondary }]}>
                  {getTodaySchedule().length} scheduled today
                </Text>
              </View>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Medications List */}
        <Animated.View style={[styles.medicationList, cardsAnimatedStyle]}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
                Loading medications...
              </Text>
            </View>
          ) : medicines.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="medical-outline" size={64} color={colors.textSecondary} />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>
                No Medications Yet
              </Text>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                Add your first medication to get started
              </Text>
            </View>
          ) : (
            <FlatList
              data={medicines}
              renderItem={renderMedicationCard}
              keyExtractor={item => item.reminderId}
              showsVerticalScrollIndicator={false}
              scrollEnabled={false}
            />
          )}
        </Animated.View>

        {/* Quick Actions */}
        <Animated.View style={[styles.quickActions, cardsAnimatedStyle]}>
          <TouchableOpacity
            style={[
              styles.addAction,
              {
                backgroundColor: colors.primary,
                shadowColor: colors.primary,
              }
            ]}
            onPress={() => router.push('/screens/medication/AddMedicineScreen')}
          >
            <Ionicons name="add" size={24} color="#FFFFFF" />
            <Text style={styles.addActionText}>Add Medication</Text>
          </TouchableOpacity>
        </Animated.View>

        <View style={styles.footerSpace} />
      </ScrollView>

      {/* Detail Modal */}
      {renderDetailModal()}
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
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xl,
    paddingHorizontal: Spacing.lg,
    minHeight: 220,
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
  headerContent: {
    marginBottom: Spacing.lg,
  },
  greeting: {
    ...Typography.caption,
    marginBottom: Spacing.xs,
  },
  title: {
    ...Typography.h2,
    fontWeight: '700',
  },
  progressCard: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
      },
      android: {
        elevation: 4,
      }
    })
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  progressTitle: {
    ...Typography.h4,
  },
  progressPercentage: {
    ...Typography.h3,
    fontWeight: '700',
  },
  overallProgress: {
    alignItems: 'center',
  },
  overallProgressBar: {
    width: '100%',
    height: 8,
    backgroundColor: '#E5E5E7',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: Spacing.sm,
  },
  overallProgressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressLabel: {
    ...Typography.caption,
  },
  medicationList: {
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
  },
  medicationCard: {
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.12,
        shadowRadius: 10,
      },
      android: {
        elevation: 4,
      }
    })
  },
  cardContent: {
    flexDirection: 'row',
    padding: Spacing.lg,
  },
  colorIndicator: {
    width: 4,
    borderRadius: 2,
    marginRight: Spacing.md,
  },
  medicationInfo: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  medicationName: {
    ...Typography.h4,
    fontWeight: '600',
  },
  checkButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dosage: {
    ...Typography.body,
    marginBottom: Spacing.sm,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
    gap: Spacing.xs,
  },
  time: {
    ...Typography.caption,
  },
  nextDose: {
    ...Typography.caption,
    fontWeight: '600',
    marginLeft: 'auto',
  },
  progressRow: {
    marginTop: Spacing.sm,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: '#E5E5E7',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    ...Typography.small,
    minWidth: 50,
  },
  quickActions: {
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
  },
  addAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.lg,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
      },
      android: {
        elevation: 6,
      }
    })
  },
  addActionText: {
    ...Typography.body,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: Spacing.sm,
  },
  footerSpace: {
    height: 64,
  },
  modalOverlay: {
    flex: 1,
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E7',
  },
  modalTitle: {
    ...Typography.h3,
    fontWeight: '600',
  },
  saveButton: {
    ...Typography.body,
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    padding: Spacing.lg,
  },
  placeholderText: {
    ...Typography.body,
    textAlign: 'center',
    marginTop: Spacing.xl,
  },
  detailCard: {
    alignItems: 'center',
    padding: Spacing.xl,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.lg,
  },
  colorIndicatorLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: Spacing.md,
  },
  detailName: {
    ...Typography.h2,
    fontWeight: '700',
    marginBottom: Spacing.xs,
  },
  detailDosage: {
    ...Typography.body,
  },
  detailSection: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    ...Typography.h4,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  sectionContent: {
    ...Typography.body,
    lineHeight: 22,
  },
  loadingContainer: {
    alignItems: 'center',
    padding: Spacing.xl,
  },
  loadingText: {
    ...Typography.body,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: Spacing.xl,
  },
  emptyTitle: {
    ...Typography.h3,
    fontWeight: '600',
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  emptyText: {
    ...Typography.body,
    textAlign: 'center',
  },
});