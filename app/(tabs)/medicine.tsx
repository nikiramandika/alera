import React, { useState, useEffect } from "react";
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
  Alert,
  ActivityIndicator,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
  FadeInDown,
} from "react-native-reanimated";
import { useRouter } from "expo-router";
import { Swipeable } from "react-native-gesture-handler";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Colors } from "@/constants/theme";
import { useMedicine } from "@/contexts/MedicineContext";

export default function MedicationScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const {
    medicines,
    refreshMedicines,
    markMedicineTaken,
    deleteMedicine,
  } = useMedicine();

  const [selectedMedication, setSelectedMedication] = useState<any>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [deletingMedicineId, setDeletingMedicineId] = useState<string | null>(null);
const [optimisticallyDeletedIds, setOptimisticallyDeletedIds] = useState<Set<string>>(new Set());

  // Animation values
  const headerScale = useSharedValue(0.9);
  const cardTranslateY = useSharedValue(50);

  useEffect(() => {
    // Animate header in
    headerScale.value = withDelay(
      200,
      withSpring(1, {
        damping: 15,
        stiffness: 100,
      })
    );

    // Animate cards in
    cardTranslateY.value = withDelay(
      400,
      withSpring(0, {
        damping: 15,
        stiffness: 100,
      })
    );

    // Update time every minute
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, [headerScale, cardTranslateY]);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshMedicines();
    } finally {
      // Small delay for smooth UX
      setTimeout(() => {
        setRefreshing(false);
      }, 300);
    }
  };

  // Filter medicines to exclude optimistically deleted ones
  const filteredMedicines = medicines.filter(
    medicine => !optimisticallyDeletedIds.has(medicine.reminderId)
  );

  // Animated styles
  const headerAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: headerScale.value }],
  }));

  const cardsAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: cardTranslateY.value }],
  }));

  const toggleMedicationStatus = async (medicineId: string, time: string) => {
    const scheduledTime = new Date();
    const [hours, minutes] = time.split(":").map(Number);
    scheduledTime.setHours(hours, minutes, 0, 0);

    // If time is in the past, schedule for tomorrow
    if (scheduledTime < currentTime) {
      scheduledTime.setDate(scheduledTime.getDate() + 1);
    }

    const result = await markMedicineTaken(medicineId, scheduledTime);
    if (!result.success) {
      Alert.alert("Error", result.error || "Failed to mark medicine as taken");
    } else {
      await refreshMedicines();
    }
  };

  const getNextDoseTime = (time: string) => {
    const [hours, minutes, period] = time.split(/[:\s]/);
    let hour24 = parseInt(hours);
    if (period === "PM" && hour24 !== 12) hour24 += 12;
    if (period === "AM" && hour24 === 12) hour24 = 0;

    const now = currentTime;
    const medTime = new Date();
    medTime.setHours(hour24, parseInt(minutes), 0, 0);

    if (medTime <= now) {
      medTime.setDate(medTime.getDate() + 1);
    }

    const diffMs = medTime.getTime() - now.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    if (diffHours > 24) return "Tomorrow";
    if (diffHours > 0) return `In ${diffHours}h ${diffMins}m`;
    if (diffMins > 0) return `In ${diffMins}m`;
    return "Now";
  };

  const handleDeleteMedicine = (medicine: any) => {
    console.log('Deleting medicine:', medicine); // Debug log
    Alert.alert(
      "Delete Medicine",
      `Are you sure you want to delete "${medicine.medicineName}"? This action cannot be undone.`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              // Use reminderId instead of id
              const medicineId = medicine.reminderId || medicine.id;
              console.log('Using medicine ID:', medicineId); // Debug log

              // Optimistic delete: immediately remove from UI
              setOptimisticallyDeletedIds(prev => new Set(prev).add(medicineId));
              setDeletingMedicineId(medicineId);

              const result = await deleteMedicine(medicineId);
              if (result.success) {
                // Success - medicine is already removed from UI
                console.log('Delete successful');
              } else {
                // Failed - restore the medicine in UI
                setOptimisticallyDeletedIds(prev => {
                  const newSet = new Set(prev);
                  newSet.delete(medicineId);
                  return newSet;
                });

                Alert.alert(
                  "Error",
                  result.error || "Failed to delete medicine"
                );
              }
            } catch {
              // Error - restore the medicine in UI
              const medicineId = medicine.reminderId || medicine.id;
              setOptimisticallyDeletedIds(prev => {
                const newSet = new Set(prev);
                newSet.delete(medicineId);
                return newSet;
              });

              Alert.alert(
                "Error",
                "An unexpected error occurred while deleting the medicine"
              );
            } finally {
              // Clear loading state
              setDeletingMedicineId(null);
            }
          },
        },
      ]
    );
  };

  // Render right action for swipeable
  const renderRightActions = (medicine: any) => {
    console.log('Render right actions for medicine:', medicine.medicineName); // Debug log

    const medicineId = medicine.reminderId || medicine.id;
    const isDeleting = deletingMedicineId === medicineId;

    return (
      <View style={styles.deleteContainer}>
        <TouchableOpacity
          style={[
            styles.deleteButton,
            isDeleting && styles.deleteButtonDisabled
          ]}
          onPress={() => {
            if (!isDeleting) {
              console.log('Delete button pressed for:', medicine.medicineName); // Debug log
              handleDeleteMedicine(medicine);
            }
          }}
          activeOpacity={0.9}
          disabled={isDeleting}
        >
          {isDeleting ? (
            <View style={styles.deleteLoadingContainer}>
              <ActivityIndicator size="small" color="#FFFFFF" />
              <Text style={styles.deleteButtonText}>Deleting...</Text>
            </View>
          ) : (
            <>
              <View style={styles.deleteIconContainer}>
                <Ionicons name="trash-outline" size={22} color="#FFFFFF" />
              </View>
              <Text style={styles.deleteButtonText}>Delete</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  // Helper function to safely format dates
  const formatDate = (date: any) => {
    if (!date) return "Not set";
    const dateObj = date instanceof Date ? date : new Date(date);
    if (isNaN(dateObj.getTime())) return "Invalid date";
    return dateObj.toLocaleDateString();
  };

  // Helper function to check if medication is expired
  const isMedicationExpired = (medicine: any) => {
    if (!medicine?.duration?.endDate) return false;

    let endDate = medicine.duration.endDate;

    // Handle Firebase Timestamp
    if (typeof endDate?.toDate === 'function') {
      endDate = endDate.toDate();
    } else if (typeof endDate === 'string' || typeof endDate === 'number') {
      endDate = new Date(endDate);
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set to start of day for accurate comparison

    return endDate < today;
  };

  // Handle edit medication
  const handleEditMedication = () => {
    if (!selectedMedication) return;

    // Pass the medication data to edit screen
    console.log("Editing medication:", selectedMedication);

    // Close the detail modal
    setShowDetailModal(false);

    // Navigate to add screen with edit data
    console.log("Sending edit data:", selectedMedication);
    router.push({
      pathname: "/medicine/add-step1",
      params: {
        editMode: "true",
        medicineId: selectedMedication.reminderId,
        medicineData: JSON.stringify({
          medicineName: selectedMedication.medicineName,
          dosage: selectedMedication.dosage,
          medicineType: selectedMedication.medicineType,
          instructions: selectedMedication.instructions,
          frequency: selectedMedication.frequency,
          reminderId: selectedMedication.reminderId,
        }),
      },
    });
  };

  const renderMedicationCard = ({
    item,
    index,
  }: {
    item: any;
    index: number;
  }) => (
    <View style={styles.cardWrapper}>
      <Swipeable
        renderRightActions={() => renderRightActions(item)}
        friction={2}
        rightThreshold={80}
        overshootRight={false}
      >
        <Animated.View
          entering={FadeInDown.delay(index * 100)}
          style={[
            styles.medicationCard,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              borderWidth: 1,
              shadowColor: colors.shadow,
            },
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
            <View
              style={[styles.colorIndicator, { backgroundColor: item.color }]}
            />

            <View style={styles.medicationInfo}>
              <View style={styles.headerRow}>
                <View style={styles.nameContainer}>
                  <Text style={[styles.medicationName, { color: colors.text }]}>
                    {item.medicineName}
                  </Text>
                  {isMedicationExpired(item) && (
                    <View style={styles.expiredBadge}>
                      <Text style={styles.expiredBadgeText}>Ended</Text>
                    </View>
                  )}
                </View>
                <TouchableOpacity
                  style={[
                    styles.checkButton,
                    {
                      backgroundColor: colors.backgroundSecondary,
                      borderColor: colors.border,
                    },
                  ]}
                  onPress={() => {
                    if (item.frequency.times.length > 0) {
                      toggleMedicationStatus(
                        item.reminderId,
                        item.frequency.times[0]
                      );
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
                {(() => {
                  const dosage = item.dosage?.trim() || '';
                  const medicineType = item.medicineType?.trim() || '';

                  // Check if dosage already contains the medicine type (case insensitive)
                  if (dosage && medicineType && dosage.toLowerCase().includes(medicineType.toLowerCase())) {
                    return dosage;
                  } else if (dosage && medicineType) {
                    return `${dosage} • ${medicineType}`;
                  } else if (dosage) {
                    return dosage;
                  } else if (medicineType) {
                    return medicineType;
                  }
                  return '';
                })()}
              </Text>

              <View style={styles.timeRow}>
                <Ionicons
                  name="time-outline"
                  size={16}
                  color={colors.textSecondary}
                />
                <Text style={[styles.time, { color: colors.textSecondary }]}>
                  {item.frequency.times.join(", ")}
                </Text>
                <Text style={[styles.nextDose, { color: colors.primary }]}>
                  {item.frequency.times.length > 0
                    ? getNextDoseTime(item.frequency.times[0])
                    : "As needed"}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        </Animated.View>
      </Swipeable>
    </View>
  );

  const renderDetailModal = () => (
    <Modal
      visible={showDetailModal}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setShowDetailModal(false)}
    >
      <SafeAreaView
        style={[styles.modalContainer, { backgroundColor: colors.background }]}
      >
        {selectedMedication && (
          <>
            {/* Modal Header */}
            <View
              style={[styles.modalHeader, { borderBottomColor: colors.border }]}
            >
              <TouchableOpacity
                onPress={() => setShowDetailModal(false)}
                style={styles.headerButton}
              >
                <Ionicons name="close-outline" size={24} color={colors.text} />
              </TouchableOpacity>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Medicine Details
              </Text>
              <TouchableOpacity
                onPress={handleEditMedication}
                style={[styles.editButton, { backgroundColor: colors.primary }]}
              >
                <Ionicons name="create" size={16} color="#FFFFFF" />
                <Text style={styles.editButtonText}>Edit</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.modalContent}
              showsVerticalScrollIndicator={false}
            >
              {/* Medicine Overview Card */}
              <View
                style={[styles.detailCard, { backgroundColor: colors.backgroundSecondary }]}
              >
                <View style={styles.medicineHeader}>
                  <View
                    style={[
                      styles.colorIndicatorLarge,
                      {
                        backgroundColor: selectedMedication?.color || "#F47B9F",
                      },
                    ]}
                  />
                  
                  <View style={styles.medicineInfo}>
                    <Text style={[styles.detailName, { color: colors.text }]}>
                      {selectedMedication?.medicineName}
                    </Text>
                    <Text
                      style={[
                        styles.detailDosage,
                        { color: colors.textSecondary },
                      ]}
                    >
                      {(() => {
                        const dosage = selectedMedication?.dosage?.trim() || '';
                        const medicineType = selectedMedication?.medicineType?.trim() || '';

                        // Check if dosage already contains the medicine type (case insensitive)
                        if (dosage && medicineType && dosage.toLowerCase().includes(medicineType.toLowerCase())) {
                          return dosage;
                        } else if (dosage && medicineType) {
                          return `${dosage} • ${medicineType}`;
                        } else if (dosage) {
                          return dosage;
                        } else if (medicineType) {
                          return medicineType;
                        }
                        return '';
                      })()}
                    </Text>
                  </View>
                  
                </View>

                {/* Quick Stats */}
                <View style={styles.quickStats}>
                  <View
                    style={[
                      styles.statItem,
                      { backgroundColor: colors.backgroundSecondary },
                    ]}
                  >
                    <Ionicons
                      name="time-outline"
                      size={20}
                      color={colors.primary}
                    />
                    <Text style={[styles.statText, { color: colors.text }]}>
                      {(() => {
                        const freq = selectedMedication?.frequency;
                        if (freq?.type === 'daily' && freq?.times) {
                          return `${freq.times.length}x daily`;
                        } else if (freq?.type === 'interval' && freq?.specificDays) {
                          const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                          return freq.specificDays.map((day: number) => dayNames[day]).join(', ');
                        } else if (freq?.type === 'as_needed') {
                          return 'As needed';
                        }
                        return 'No schedule';
                      })()}
                    </Text>
                  </View>
                  
                  </View>
                  
              </View>

              {/* Schedule Section */}
              <View
                style={[styles.detailSection, { backgroundColor: colors.backgroundSecondary }]}
              >
                
                <View style={styles.sectionHeader}>
                  <Ionicons
                    name="time-outline"
                    size={20}
                    color={colors.primary}
                  />
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>
                    Schedule
                  </Text>
                </View>
                <View>
                  <Text style={[styles.scheduleText, { color: colors.text }]}>
                    {(() => {
                      const freq = selectedMedication?.frequency;
                      if (freq?.type === 'daily' && freq?.times) {
                        return freq.times.join(", ");
                      } else if (freq?.type === 'weekly' && freq?.specificDays) {
                        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                        return freq.specificDays.map((day: number) => dayNames[day]).join(", ");
                      } else if (freq?.type === 'as_needed') {
                        return "As needed";
                      } else if (freq?.type === 'interval' && freq?.specificDays) {
                        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                        return `On ${freq.specificDays.map((day: number) => dayNames[day]).join(', ')}`;
                      }
                      return "No schedule";
                    })()}
                  </Text>
                  <Text
                    style={[
                      styles.frequencyType,
                      { color: colors.textSecondary },
                    ]}
                  >
                    {(() => {
                      const freq = selectedMedication?.frequency;
                      if (!freq?.type) return '';
                      switch (freq.type) {
                        case 'daily':
                          return 'Daily';
                        case 'interval':
                          if (freq.specificDays && freq.specificDays.length > 0) {
                            const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                            return freq.specificDays.map((day: number) => dayNames[day]).join(', ');
                          } else {
                            return 'No days selected';
                          }
                        case 'as_needed':
                          return 'As Needed';
                        default:
                          return freq.type.replace('_', ' ').toUpperCase();
                      }
                    })()}
                  </Text>
                </View>
                <View style={styles.durationContent}>
                  <View style={styles.durationItem}>
                    <Text
                      style={[
                        styles.durationLabel,
                        { color: colors.textSecondary },
                      ]}
                    >
                      Started
                    </Text>
                    <Text
                      style={[styles.durationValue, { color: colors.text }]}
                    >
                      {formatDate(selectedMedication?.duration.startDate)}
                    </Text>
                  </View>
                  {selectedMedication?.duration.endDate && (
                    <View style={styles.durationItem}>
                      <Text
                        style={[
                          styles.durationLabel,
                          { color: colors.textSecondary },
                        ]}
                      >
                        Ends
                      </Text>
                      <Text
                        style={[styles.durationValue, { color: colors.text }]}
                      >
                        {formatDate(selectedMedication.duration.endDate)}
                      </Text>
                    </View>
                  )}
                </View>
              </View>

              {/* Description Section */}
              {selectedMedication?.description && (
                <View
                  style={[
                    styles.detailSection,
                    { backgroundColor: colors.backgroundSecondary },
                  ]}
                >
                  <View style={styles.sectionHeader}>
                    <Ionicons
                      name="information-circle-outline"
                      size={20}
                      color={colors.primary}
                    />
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>
                      Description
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.sectionContent,
                      { color: colors.textSecondary },
                    ]}
                  >
                    {selectedMedication.description}
                  </Text>
                </View>
              )}

              {/* Take With Meal Section */}
              {selectedMedication?.takeWithMeal && (
                <View
                  style={[
                    styles.detailSection,
                    { backgroundColor: colors.backgroundSecondary },
                  ]}
                >
                  <View style={styles.sectionHeader}>
                    <Ionicons
                      name="restaurant-outline"
                      size={20}
                      color={colors.primary}
                    />
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>
                      Take With Meal
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.sectionContent,
                      { color: colors.textSecondary },
                    ]}
                  >
                    {selectedMedication.takeWithMeal === 'before' ? 'Before meals' : 'After meals'}
                  </Text>
                </View>
              )}

              {/* Medicine Photo Section */}
              {selectedMedication?.drugAppearance && (
                <View
                  style={[
                    styles.detailSection,
                    { backgroundColor: colors.backgroundSecondary },
                  ]}
                >
                  <View style={styles.sectionHeader}>
                    <Ionicons
                      name="image-outline"
                      size={20}
                      color={colors.primary}
                    />
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>
                      Medicine Photo
                    </Text>
                  </View>
                  <Image
                    source={{ uri: selectedMedication.drugAppearance }}
                    style={[
                      styles.medicinePhoto,
                      { backgroundColor: colors.backgroundSecondary }
                    ]}
                    resizeMode="cover"
                  />
                </View>
              )}

              {/* Duration Section */}
              {/* <View
                style={[styles.detailSection, { backgroundColor: colors.card }]}
              >
                <View style={styles.sectionHeader}>
                  <Ionicons
                    name="calendar-outline"
                    size={20}
                    color={colors.primary}
                  />
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>
                    Duration
                  </Text>
                </View>
                <View style={styles.durationContent}>
                  <View style={styles.durationItem}>
                    <Text
                      style={[
                        styles.durationLabel,
                        { color: colors.textSecondary },
                      ]}
                    >
                      Started
                    </Text>
                    <Text
                      style={[styles.durationValue, { color: colors.text }]}
                    >
                      {formatDate(selectedMedication?.duration.startDate)}
                    </Text>
                  </View>
                  {selectedMedication?.duration.endDate && (
                    <View style={styles.durationItem}>
                      <Text
                        style={[
                          styles.durationLabel,
                          { color: colors.textSecondary },
                        ]}
                      >
                        Ends
                      </Text>
                      <Text
                        style={[styles.durationValue, { color: colors.text }]}
                      >
                        {formatDate(selectedMedication.duration.endDate)}
                      </Text>
                    </View>
                  )}
                </View>
              </View> */}

              
              </ScrollView>
          </>
        )}
      </SafeAreaView>
    </Modal>
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <StatusBar
        style={colorScheme === "dark" ? "light" : "dark"}
        backgroundColor={colors.background}
      />

      <View style={styles.container}>
        {/* Header Section */}
        <Animated.View style={[styles.headerContainer, headerAnimatedStyle]}>
          <LinearGradient
            colors={[
              colors.background,
              colors.backgroundSecondary,
              colors.gradientStart,
            ]}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={styles.headerGradient}
          >
            <View
              style={[
                styles.circleBackground,
                { backgroundColor: colors.primary + "20" },
              ]}
            />

            <View style={styles.headerContent}>
              <Text style={[styles.greeting, { color: colors.primary }]}>
                My Medications
              </Text>
              <View
                style={[
                  styles.totalMedicationsBadge,
                  { backgroundColor: "#84CC16" },
                ]}
              >
                <Text style={styles.totalMedicationsText}>
                  {medicines.length} Total Medication
                  {medicines.length !== 1 ? "s" : ""}
                </Text>
              </View>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Content Section */}
        <Animated.View style={[styles.contentContainer, cardsAnimatedStyle]}>
          <ScrollView
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
          >
            {filteredMedicines.length === 0 ? (
              <View style={styles.emptyStateContainer}>
                <Ionicons
                  name="medical-outline"
                  size={80}
                  color={colors.textSecondary}
                />
                <Text style={[styles.emptyStateTitle, { color: colors.text }]}>
                  No Medications!
                </Text>
                <Text
                  style={[
                    styles.emptyStateSubtitle,
                    { color: colors.textSecondary },
                  ]}
                >
                  You have {filteredMedicines.length} medications setup. Kindly setup a
                  new one!
                </Text>
                <TouchableOpacity
                  style={[
                    styles.addMedicationButton,
                    { backgroundColor: colors.primary },
                  ]}
                  onPress={() => router.push("/medicine/add-step1")}
                >
                  <Ionicons name="add" size={20} color="#FFFFFF" />
                  <Text style={styles.addMedicationButtonText}>
                    Add Medication
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.medicationsContainer}>
                <FlatList
                  data={filteredMedicines}
                  renderItem={renderMedicationCard}
                  keyExtractor={(item) => item.reminderId}
                  showsVerticalScrollIndicator={false}
                  scrollEnabled={false}
                />
              </View>
            )}
          </ScrollView>
        </Animated.View>
      </View>

      {/* Floating Action Button */}
      {filteredMedicines.length > 0 && (
        <TouchableOpacity
          style={[styles.floatingActionButton, { backgroundColor: "#84CC16" }]}
          onPress={() => {
            console.log("FAB pressed - navigating to add screen");
            router.push("/medicine/add-step1");
          }}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={28} color="#FFFFFF" />
        </TouchableOpacity>
      )}

      {/* Detail Modal */}
      {renderDetailModal()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerContainer: {
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
    paddingBottom: 20,
    minHeight: 88, // Height to center greeting vertically
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
  headerGradient: {
    paddingTop: 20,
    paddingBottom: 24,
    paddingHorizontal: 20,
    minHeight: 88,
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  circleBackground: {
    position: "absolute",
    top: "15%",
    right: "-10%",
    width: 150,
    height: 150,
    borderRadius: 999,
    opacity: 0.3,
  },
  headerContent: {
    flex: 1,
    justifyContent: "center",
  },
  greeting: {
    fontSize: 32,
    fontWeight: "700",
    marginBottom: 8,
  },
  totalMedicationsBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  totalMedicationsText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  floatingActionButton: {
    position: "absolute",
    bottom: 100, // Increased from 24 to avoid tab overlap
    right: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
      },
      android: {
        elevation: 12,
      },
    }),
  },
  contentContainer: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  medicationsContainer: {
    paddingTop: 20,
    marginHorizontal: 20,
  },
  medicationCard: {
    borderRadius: 12,
    marginBottom: 0,

    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
      },
      android: {
        elevation: 6,
        backgroundColor: "#ffffff",
      },
    }),
  },
  cardContent: {
    flexDirection: "row",
    padding: 16,
  },
  colorIndicator: {
    width: 4,
    borderRadius: 2,
    marginRight: 12,
  },
  medicationInfo: {
    flex: 1,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  medicationName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  nameContainer: {
    flex: 1,
    flexDirection: 'column',
  },
  expiredBadge: {
    backgroundColor: "#FF3B30",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  expiredBadgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  checkButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  dosage: {
    fontSize: 14,
    marginBottom: 8,
  },
  timeRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 8,
  },
  time: {
    fontSize: 12,
  },
  nextDose: {
    fontSize: 12,
    fontWeight: "600",
    marginLeft: "auto",
  },
    emptyStateContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyStateTitle: {
    fontSize: 24,
    fontWeight: "700",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtitle: {
    fontSize: 16,
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 32,
  },
  addMedicationButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  addMedicationButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  modalContainer: {
    flex: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  detailCard: {
    alignItems: "center",
    padding: 32,
    borderRadius: 16,
    marginBottom: 20,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  colorIndicatorLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 16,
  },
  detailName: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 4,
  },
  detailDosage: {
    fontSize: 16,
  },
  detailSection: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  sectionContent: {
    fontSize: 16,
    lineHeight: 22,
  },
  // New modal styles
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  headerButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  medicineHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  medicineInfo: {
    flex: 1,
    marginLeft: 16,
  },
  quickStats: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 16,
    gap: 12,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
    flex: 1,
  },
  statText: {
    fontSize: 14,
    fontWeight: "500",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 10,
  },
  scheduleText: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 4,
  },
  frequencyType: {
    fontSize: 14,
    fontWeight: "600",
  },
  durationContent: {
    marginTop: 24,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  durationItem: {
    alignItems: "center",
  },
  durationLabel: {
    fontSize: 14,
    marginBottom: 4,
  },
  durationValue: {
    fontSize: 16,
    fontWeight: "600",
  },
    deleteContainer: {
    width: 100,
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 8,
  },
  deleteButton: {
    width: "100%",
    height: "100%",
    minHeight: 100,
    backgroundColor: "#FF3B30",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 16,
  },
  deleteIconContainer: {
    width: 40,
    height: 40,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 2,
  },
  deleteButtonText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  deleteButtonDisabled: {
    backgroundColor: "#999999",
    opacity: 0.7,
  },
  deleteLoadingContainer: {
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
  },
  cardWrapper: {
    marginBottom: 12,
    borderRadius: 12,
    overflow: "hidden",
  },
  medicinePhoto: {
    width: "100%",
    height: 200,
    borderRadius: 12,
    marginTop: 8,
  },
});
