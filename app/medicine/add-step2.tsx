import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Platform,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Colors } from "@/constants/theme";
import { useMedicine } from "@/contexts/MedicineContext";
import { useAuth } from "@/contexts/AuthContext";
import { medicineService } from "@/services";
import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { useTranslation } from "react-i18next";

const { width: screenWidth } = Dimensions.get("window");

interface Step1Data {
  medicineName?: string;
  dosage?: string;
  medicineType?: string;
  takeWithMeal?: "before" | "after";
  description?: string;
  drugAppearance?: string | null;
  editMode?: boolean;
  medicineId?: string;
}

interface FrequencyTab {
  id: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  description: string;
}

export default function AddMedicineStep2NewScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const { addMedicine, updateMedicine } = useMedicine();
  const { user } = useAuth();
  const params = useLocalSearchParams();
  const { t } = useTranslation();

  const frequencyTabs: FrequencyTab[] = [
    {
      id: "daily",
      label: t("habits.daily"),
      icon: "calendar-outline" as keyof typeof Ionicons.glyphMap,
      description: t("habits.everyDaySameTime"),
    },
    {
      id: "interval",
      label: t("habits.interval"),
      icon: "calendar-number-outline" as keyof typeof Ionicons.glyphMap,
      description: t("habits.onSpecificDaysEachWeek"),
    },
  ];

  const daysOfWeek = [
    { id: 0, label: t("common.sunday") },
    { id: 1, label: t("common.monday") },
    { id: 2, label: t("common.tuesday") },
    { id: 3, label: t("common.wednesday") },
    { id: 4, label: t("common.thursday") },
    { id: 5, label: t("common.friday") },
    { id: 6, label: t("common.saturday") },
  ];

  // Parse step1 data
  const step1Data = params.step1Data
    ? (JSON.parse(params.step1Data as string) as Step1Data)
    : null;

  // Check if edit mode
  const editMode = step1Data?.editMode || false;
  const medicineId = step1Data?.medicineId || "";

  const [activeFrequencyTab, setActiveFrequencyTab] = useState("daily");
  const [loading, setLoading] = useState(false);
  const [showEndDate, setShowEndDate] = useState(false);
  const dataLoadedRef = useRef(false);

  const [medicineData, setMedicineData] = useState({
    medicineName: step1Data?.medicineName || "",
    dosage: step1Data?.dosage || "",
    medicineType: step1Data?.medicineType || "tablet",
    takeWithMeal: step1Data?.takeWithMeal || "before",
    description: step1Data?.description || "",
    drugAppearance: step1Data?.drugAppearance || null,

    // Frequency settings
    frequency: {
      type: "daily" as "daily" | "interval" | "as_needed",
      selectedDays: [] as number[], // Days for interval frequency
      times: ["08:00"],
    },

    // Duration settings
    duration: {
      startDate: new Date(),
      endDate: undefined as Date | undefined,
      totalDays: null as number | null,
    },
  });

  // Load existing medicine data for edit mode
  useEffect(() => {
    if (!dataLoadedRef.current && editMode && medicineId && user) {
      const loadMedicineData = async () => {
        try {
          console.log("Loading medicine data for edit:", medicineId);
          const medicine = await medicineService.getMedicineById(
            user.userId,
            medicineId
          );

          if (medicine) {
            console.log("Loaded medicine data:", medicine);

            if (!step1Data) {
              // Load all medicine data
              setMedicineData({
                medicineName: medicine.medicineName || "",
                dosage: medicine.dosage || "",
                medicineType: medicine.medicineType || "tablet",
                takeWithMeal: medicine.takeWithMeal || "before",
                description: medicine.description || "",
                drugAppearance: medicine.drugAppearance || null,

                // Update frequency data
                frequency: {
                  type: medicine.frequency?.type || "daily",
                  times: medicine.frequency?.times || ["08:00"],
                  selectedDays: medicine.frequency?.specificDays || [],
                },

                // Update duration data
                duration: {
                  startDate: medicine.duration?.startDate || new Date(),
                  endDate: medicine.duration?.endDate || undefined,
                  totalDays: medicine.duration?.totalDays || null,
                },
              });
            } else {
              // Only update frequency and duration data, keep step1 data intact
              setMedicineData((prev) => ({
                ...prev, // Keep step1 data
                // Update frequency data only if not changed by user
                frequency: {
                  type: medicine.frequency?.type || "daily",
                  times: medicine.frequency?.times || ["08:00"],
                  selectedDays: medicine.frequency?.specificDays || [],
                },

                // Update duration data
                duration: {
                  startDate: medicine.duration?.startDate || new Date(),
                  endDate: medicine.duration?.endDate || undefined,
                  totalDays: medicine.duration?.totalDays || null,
                },
              }));
            }

            // Set frequency tab based on loaded data
            setActiveFrequencyTab(medicine.frequency?.type || "daily");

            // Set showEndDate based on whether end date exists
            setShowEndDate(!!medicine.duration?.endDate);

            dataLoadedRef.current = true;
          }
        } catch (error) {
          console.error("Error loading medicine data:", error);
        }
      };

      loadMedicineData();
    }
  }, [editMode, medicineId, user]);

  const handleSaveMedicine = async () => {
    setLoading(true);
    try {
      const duration: any = {
        startDate: medicineData.duration.startDate,
        totalDays: medicineData.duration.totalDays,
      };

      // Only include endDate if it exists
      if (medicineData.duration.endDate) {
        duration.endDate = medicineData.duration.endDate;
      }

      const frequencyData = {
        type: medicineData.frequency.type,
        times:
          medicineData.frequency.type !== "as_needed"
            ? medicineData.frequency.times
            : [],
        specificDays:
          medicineData.frequency.type === "interval"
            ? medicineData.frequency.selectedDays
            : [],
      };

      console.log("=== MEDICINE FREQUENCY DATA ===");
      console.log("Type:", medicineData.frequency.type);
      console.log("Times:", medicineData.frequency.times);
      console.log("Selected Days:", medicineData.frequency.selectedDays);
      console.log("Final frequency payload:", frequencyData);

      const medicinePayload = {
        medicineName: medicineData.medicineName,
        dosage: medicineData.dosage,
        medicineType: medicineData.medicineType,
        takeWithMeal: medicineData.takeWithMeal,
        description: medicineData.description,
        drugAppearance: medicineData.drugAppearance,

        frequency: frequencyData,

        duration: duration,

        isActive: true,
        color: colors.primary,
        icon: "💊",
      };

      let result;
      if (editMode && medicineId) {
        // Update existing medicine
        result = await updateMedicine(medicineId, medicinePayload);
      } else {
        // Add new medicine
        const newMedicine = {
          userId: user?.userId || "",
          ...medicinePayload,
        };
        result = await addMedicine(newMedicine);
      }

      if (result.success) {
        router.replace("/(tabs)/medicine");
      } else {
        Alert.alert(
          t("common.error"),
          result.error || (editMode ? t("medicine.failedToUpdateMedicine") : t("medicine.failedToAddMedicine"))
        );
      }
    } catch {
      Alert.alert(t("common.error"), t("medicine.unexpectedErrorOccurred"));
    } finally {
      setLoading(false);
    }
  };

  const toggleDay = (dayId: number) => {
    console.log(
      "Toggling day:",
      dayId,
      "Current selectedDays:",
      medicineData.frequency.selectedDays
    );
    setMedicineData((prev) => {
      const newSelectedDays = prev.frequency.selectedDays?.includes(dayId)
        ? prev.frequency.selectedDays.filter((d: number) => d !== dayId)
        : [...(prev.frequency.selectedDays || []), dayId].sort(
            (a: number, b: number) => a - b
          );

      console.log("New selectedDays after toggle:", newSelectedDays);

      return {
        ...prev,
        frequency: {
          ...prev.frequency,
          selectedDays: newSelectedDays,
        },
      };
    });
  };

  const addReminderTime = () => {
    setMedicineData((prev) => ({
      ...prev,
      frequency: {
        ...prev.frequency,
        times: [...prev.frequency.times, "12:00"],
      },
    }));
  };

  const removeReminderTime = (index: number) => {
    if (medicineData.frequency.times.length > 1) {
      setMedicineData((prev) => ({
        ...prev,
        frequency: {
          ...prev.frequency,
          times: prev.frequency.times.filter(
            (_: string, i: number) => i !== index
          ),
        },
      }));
    }
  };

  const handleTimeChange = (
    event: DateTimePickerEvent,
    selectedDate?: Date,
    index?: number
  ) => {
    if (event.type === "set" && selectedDate && index !== undefined) {
      const hours = selectedDate.getHours().toString().padStart(2, "0");
      const minutes = selectedDate.getMinutes().toString().padStart(2, "0");
      const newTimes = [...medicineData.frequency.times];
      newTimes[index] = `${hours}:${minutes}`;
      setMedicineData((prev) => ({
        ...prev,
        frequency: {
          ...prev.frequency,
          times: newTimes,
        },
      }));
    }
  };

  const convertTimeToDate = (timeString: string) => {
    const [hours, minutes] = timeString.split(":").map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date;
  };

  const handleTabPress = (tabId: string) => {
    setActiveFrequencyTab(tabId);
    setMedicineData((prev) => ({
      ...prev,
      frequency: {
        ...prev.frequency,
        type: tabId as "daily" | "interval",
      },
    }));
  };

  const renderFrequencyTab = (tab: FrequencyTab) => {
    const isActive = activeFrequencyTab === tab.id;

    return (
      <TouchableOpacity
        key={tab.id}
        style={[
          styles.frequencyTab,
          {
            backgroundColor: isActive
              ? colors.primary
              : colors.backgroundSecondary,
            borderColor: isActive ? colors.primary : colors.border,
          },
        ]}
        onPress={() => handleTabPress(tab.id)}
      >
        <Ionicons
          name={tab.icon}
          size={20}
          color={isActive ? "#FFFFFF" : colors.textSecondary}
        />
        <Text
          style={[
            styles.frequencyTabText,
            {
              color: isActive ? "#FFFFFF" : colors.text,
            },
          ]}
        >
          {tab.label}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderTabContent = () => {
    switch (activeFrequencyTab) {
      case "daily":
        return renderDailyContent();
      case "interval":
        return renderIntervalContent();
      default:
        return renderDailyContent();
    }
  };

  const renderDailyContent = () => (
    <View style={styles.tabContent}>
      <View style={styles.cardHeader}>
        <Ionicons
          name="notifications-outline"
          size={20}
          color={colors.primary}
        />
        <Text style={[styles.cardTitle, { color: colors.text }]}>
          {t("medicine.dailyReminderTimes")}
        </Text>
      </View>

      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        {t("medicine.whenShouldBeRemindedMedicine")}
      </Text>

      <View style={styles.reminderGrid}>
        {medicineData.frequency.times.map((time: string, index: number) => (
          <View key={index} style={styles.reminderItem}>
            <View style={styles.timeRow}>
              <View
                style={[
                  styles.timePickerContainer,
                  { backgroundColor: colors.backgroundSecondary },
                ]}
              >
                <DateTimePicker
                  testID={`timePicker${index}`}
                  value={convertTimeToDate(time)}
                  mode="time"
                  onChange={(event, selectedTime) =>
                    handleTimeChange(event, selectedTime, index)
                  }
                  textColor={colors.text}
                  accentColor={colors.primary}
                />
              </View>
              {medicineData.frequency.times.length > 1 && (
                <TouchableOpacity
                  style={[
                    styles.removeTimeButton,
                    { backgroundColor: "#FF6B6B" },
                  ]}
                  onPress={() => removeReminderTime(index)}
                  activeOpacity={0.8}
                >
                  <Ionicons name="remove" size={16} color="#FFFFFF" />
                </TouchableOpacity>
              )}
            </View>
          </View>
        ))}
      </View>

      <TouchableOpacity
        style={[
          styles.addTimeButton,
          { backgroundColor: colors.primary + "20" },
        ]}
        onPress={addReminderTime}
      >
        <Ionicons name="add" size={20} color={colors.primary} />
        <Text style={[styles.addTimeText, { color: colors.primary }]}>
          {t("medicine.addReminderTime")}
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderIntervalContent = () => (
    <View style={styles.tabContent}>
      <View style={styles.cardHeader}>
        <Ionicons
          name="calendar-number-outline"
          size={20}
          color={colors.primary}
        />
        <Text style={[styles.cardTitle, { color: colors.text }]}>
          {t("medicine.selectDays")}
        </Text>
      </View>

      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        {t("medicine.selectDaysOfWeekMedicine")}
      </Text>

      <View style={styles.daysGrid}>
        {daysOfWeek.map((day) => (
          <TouchableOpacity
            key={day.id}
            style={[
              styles.dayPill,
              {
                backgroundColor: medicineData.frequency.selectedDays?.includes(
                  day.id
                )
                  ? colors.primary
                  : colors.backgroundSecondary,
                borderColor: medicineData.frequency.selectedDays?.includes(
                  day.id
                )
                  ? colors.primary
                  : colors.border,
              },
            ]}
            onPress={() => toggleDay(day.id)}
          >
            <Text
              style={[
                styles.dayText,
                {
                  color: medicineData.frequency.selectedDays?.includes(day.id)
                    ? "#FFFFFF"
                    : colors.text,
                },
              ]}
            >
              {day.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={[styles.divider, { borderBottomColor: colors.border }]} />

      <Text
        style={[
          styles.subtitle,
          { marginTop: 16, color: colors.textSecondary },
        ]}
      >
        {t("medicine.reminderTimesForSelectedDays")}
      </Text>

      <View style={styles.reminderGrid}>
        {medicineData.frequency.times.map((time: string, index: number) => (
          <View key={index} style={styles.reminderItem}>
            <View style={styles.timeRow}>
              <View
                style={[
                  styles.timePickerContainer,
                  { backgroundColor: colors.backgroundSecondary },
                ]}
              >
                <DateTimePicker
                  testID={`timePicker${index}`}
                  value={convertTimeToDate(time)}
                  mode="time"
                  onChange={(event, selectedTime) =>
                    handleTimeChange(event, selectedTime, index)
                  }
                  textColor={colors.text}
                  accentColor={colors.primary}
                />
              </View>
              {medicineData.frequency.times.length > 1 && (
                <TouchableOpacity
                  style={[
                    styles.removeTimeButton,
                    { backgroundColor: "#FF6B6B" },
                  ]}
                  onPress={() => removeReminderTime(index)}
                  activeOpacity={0.8}
                >
                  <Ionicons name="remove" size={16} color="#FFFFFF" />
                </TouchableOpacity>
              )}
            </View>
          </View>
        ))}
      </View>

      <TouchableOpacity
        style={[
          styles.addTimeButton,
          { backgroundColor: colors.primary + "20" },
        ]}
        onPress={addReminderTime}
      >
        <Ionicons name="add" size={20} color={colors.primary} />
        <Text style={[styles.addTimeText, { color: colors.primary }]}>
          {t("medicine.addReminderTime")}
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />

      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={[
            styles.backButton,
            {
              borderColor: colors.border,
              backgroundColor: colors.backgroundSecondary,
            },
          ]}
        >
          <Ionicons name="chevron-back" size={20} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          {editMode ? t("medicine.editMedicine") : t("medicine.addMedicine")}
        </Text>
        <View style={styles.placeholder} />
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View
          style={[styles.progressBar, { backgroundColor: colors.primary }]}
        />
        <View
          style={[
            styles.progressBackground,
            { backgroundColor: colors.border },
          ]}
        />
      </View>

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          {/* Step Indicator */}
          <View style={styles.stepIndicator}>
            <View
              style={[
                styles.stepCompleted,
                { backgroundColor: colors.primary },
              ]}
            >
              <Ionicons name="checkmark" size={16} color="#FFFFFF" />
            </View>
            <View
              style={[styles.stepLine, { backgroundColor: colors.primary }]}
            />
            <View
              style={[styles.stepActive, { backgroundColor: colors.primary }]}
            >
              <Text style={styles.stepActiveText}>2</Text>
            </View>
          </View>

          {/* Title */}
          <View style={styles.section}>
            <Text style={[styles.title, { color: colors.text }]}>
              {t("medicine.frequencyDuration")}
            </Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              {t("medicine.setWhenAndHowLong")}
            </Text>
          </View>

          {/* Frequency Tabs */}
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <Text style={[styles.label, { color: colors.text }]}>
              {t("medicine.frequency")}
            </Text>
            <Text style={[styles.sublabel, { color: colors.textSecondary }]}>
              {t("medicine.howOftenNeedToTake")}
            </Text>

            <View style={styles.frequencyTabContainer}>
              {frequencyTabs.map((tab) => renderFrequencyTab(tab))}
            </View>

            <Text
              style={[
                styles.frequencyDescription,
                { color: colors.textSecondary },
              ]}
            >
              {
                frequencyTabs.find((tab) => tab.id === activeFrequencyTab)
                  ?.description
              }
            </Text>
          </View>

          {/* Frequency Content */}
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            {renderTabContent()}
          </View>

          {/* Duration Settings */}
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <View style={styles.cardHeader}>
              <Ionicons
                name="calendar-outline"
                size={20}
                color={colors.primary}
              />
              <Text style={[styles.cardTitle, { color: colors.text }]}>
                {t("medicine.duration")}
              </Text>
            </View>

            <Text style={[styles.sublabel, { color: colors.textSecondary }]}>
              {t("medicine.setHowLongTake")}
            </Text>

            <View style={styles.durationRow}>
              <View style={styles.durationInput}>
                <Text style={[styles.durationLabel, { color: colors.text }]}>
                  {t("medicine.startDate")}
                </Text>
                <DateTimePicker
                  value={medicineData.duration.startDate}
                  mode="date"
                  onChange={(event, selectedDate) => {
                    if (event.type === "set" && selectedDate) {
                      setMedicineData((prev) => ({
                        ...prev,
                        duration: {
                          ...prev.duration,
                          startDate: selectedDate,
                        },
                      }));
                    }
                  }}
                  textColor={colors.text}
                  accentColor={colors.primary}
                />
              </View>

              <View style={styles.durationInput}>
                <Text style={[styles.durationLabel, { color: colors.text }]}>
                  {t("medicine.endDateOptional")}
                </Text>
                {!showEndDate && !medicineData.duration.endDate ? (
                  <TouchableOpacity
                    style={[
                      styles.addEndDateButton,
                      {
                        backgroundColor: colors.backgroundSecondary,
                        borderColor: colors.border,
                        borderWidth: 1,
                      },
                    ]}
                    onPress={() => setShowEndDate(true)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="add" size={20} color={colors.primary} />
                  </TouchableOpacity>
                ) : (
                  <View style={styles.endDateContainer}>
                    <DateTimePicker
                      value={medicineData.duration.endDate || new Date()}
                      mode="date"
                      minimumDate={medicineData.duration.startDate}
                      onChange={(event, selectedDate) => {
                        if (event.type === "set" && selectedDate) {
                          // Ensure end date is not before start date
                          if (selectedDate >= medicineData.duration.startDate) {
                            setMedicineData((prev) => ({
                              ...prev,
                              duration: {
                                ...prev.duration,
                                endDate: selectedDate,
                              },
                            }));
                          } else {
                            // Show alert if end date is before start date
                            Alert.alert(
                              t("common.error"),
                              t("medicine.endDateCannotBeBeforeStartDate")
                            );
                          }
                        }
                      }}
                      textColor={colors.text}
                      accentColor={colors.primary}
                      style={styles.endDatePicker}
                    />
                    <TouchableOpacity
                      style={[
                        styles.removeEndDateButton,
                        { backgroundColor: "#FF6B6B" },
                      ]}
                      onPress={() => {
                        setMedicineData((prev) => ({
                          ...prev,
                          duration: {
                            ...prev.duration,
                            endDate: undefined,
                          },
                        }));
                        setShowEndDate(false);
                      }}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="remove" size={16} color="#FFFFFF" />
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </View>
          </View>

          {/* Bottom Space for Floating Button */}
          <View style={styles.bottomSpace} />
        </View>
      </ScrollView>

      {/* Floating Save Button */}
      <View
        style={[
          styles.floatingButtonContainer,
          { backgroundColor: colors.background, borderTopColor: colors.border },
        ]}
      >
        <TouchableOpacity
          style={[
            styles.saveButton,
            {
              backgroundColor: loading ? colors.border : colors.primary,
              opacity: loading ? 0.7 : 1,
            },
          ]}
          onPress={handleSaveMedicine}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <Text style={styles.saveButtonText}>
              {editMode ? t("medicine.updating") : t("medicine.adding")}
            </Text>
          ) : (
            <>
              <Text style={styles.saveButtonText}>
                {editMode ? t("medicine.updateMedicine") : t("medicine.addMedicine")}
              </Text>
              <Ionicons name="checkmark" size={20} color="#FFFFFF" />
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    flex: 1,
    textAlign: "center",
    marginHorizontal: 16,
  },
  placeholder: {
    width: 40,
  },
  progressContainer: {
    height: 3,
    position: "relative",
  },
  progressBar: {
    height: "100%",
  },
  progressBackground: {
    position: "absolute",
    right: 0,
    top: 0,
    width: "50%",
    height: "100%",
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  stepIndicator: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 32,
  },
  stepCompleted: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  stepActive: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  stepActiveText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  stepLine: {
    width: 40,
    height: 2,
  },
  section: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
    lineHeight: 24,
  },
  card: {
    borderRadius: 16,
    padding: 20,
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
  label: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
  },
  sublabel: {
    fontSize: 14,
    marginBottom: 16,
    lineHeight: 20,
  },
  frequencyTabContainer: {
    flexDirection: "row",
    marginBottom: 16,
    gap: 8,
  },
  frequencyTab: {
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    borderWidth: 1,
  },
  frequencyTabText: {
    fontSize: 14,
    fontWeight: "500",
    marginTop: 8,
  },
  frequencyDescription: {
    fontSize: 14,
    fontStyle: "italic",
    textAlign: "center",
  },
  tabContentScroll: {
    height: 400,
    marginBottom: 20,
  },
  tabPage: {
    width: screenWidth,
    paddingHorizontal: 20,
  },
  tabContent: {
    padding: 20,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  reminderGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 12,
  },
  reminderItem: {
    width: "50%",
    marginBottom: 12,
  },
  timeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  timePickerContainer: {
    borderRadius: 8,
    overflow: "hidden",
    flex: 1,
  },
  removeTimeButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  addTimeButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  addTimeText: {
    fontSize: 14,
    fontWeight: "500",
    marginLeft: 8,
  },
  daysGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },
  dayPill: {
    width: 60,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  dayText: {
    fontSize: 12,
    fontWeight: "600",
  },
  divider: {
    borderBottomWidth: 1,
    marginVertical: 16,
  },
  intervalRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },
  intervalLabel: {
    fontSize: 16,
    fontWeight: "500",
  },
  intervalInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    width: 60,
    textAlign: "center",
  },
  durationRow: {
    flexDirection: "row",
    gap: 16,
  },
  durationInput: {
    flex: 1,
  },
  durationLabel: {
    fontSize: 14,
    fontWeight: "500",
    marginLeft: -12,
    marginBottom: 8,
    textAlign: "center",
  },
  bottomSpace: {
    height: 100,
  },
  addEndDateButton: {
    width: 32,
    height: 32,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
  },
  endDateContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  endDatePicker: {
    flex: 1,
    borderRadius: 8,
    overflow: "hidden",
  },
  removeEndDateButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  floatingButtonContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
  },
  saveButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 28,
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    marginRight: 8,
  },
});
