import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Platform,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Colors } from "@/constants/theme";
import { useMedicine } from "@/contexts/MedicineContext";
import { MedicineReminder } from "@/types";
import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";

export default function AddMedicineScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const { addMedicine, updateMedicine } = useMedicine();
  const params = useLocalSearchParams();

  // Check if we're in edit mode
  const isEditMode = params.editMode === "true";
  const editingMedicineId = params.medicineId as string;

  console.log("Screen params:", params);
  console.log("Is edit mode:", isEditMode);
  console.log("Editing medicine ID:", editingMedicineId);

  const [medicineData, setMedicineData] = useState({
    medicineName: "",
    dosage: "",
    medicineType: "Tablet",
    instructions: "",
    stockQuantity: 30,
    stockAlert: 5,
    stock: {
      current: 30,
      currentStock: 30,
      refillThreshold: 5,
      unit: "tablets",
      lastUpdated: new Date(),
    },
    notes: "",
    color: "#F47B9F",
    icon: "pill",
    isActive: true,
  });

  const [frequency, setFrequency] = useState<{
    type: "daily" | "interval" | "as_needed";
    times: string[];
    specificDays: number[];
    interval?: number;
  }>({
    type: "daily",
    times: ["08:00"],
    specificDays: [0, 1, 2, 3, 4, 5, 6],
    interval: 8,
  });

  const [duration, setDuration] = useState({
    startDate: new Date(),
    endDate: null as Date | null,
    totalDays: null as number | null,
  });

  const [loading, setLoading] = useState(false);

  // Date picker states
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);

  const medicineTypes = [
    "Tablet",
    "Capsule",
    "Liquid",
    "Injection",
    "Cream",
    "Inhaler",
    "Other",
  ];
  const medicineColors = [
    "#F47B9F",
    "#4ECDC4",
    "#FFD93D",
    "#A8E6CF",
    "#FF8B94",
    "#C9B1FF",
    "#FFB347",
  ];
  const frequencyTypes = [
    { value: "daily", label: "Daily" },
    { value: "interval", label: "Specific days" },
    { value: "as_needed", label: "As needed" },
  ];

  const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  // Date picker handlers

  const handleStartDateChange = (
    event: DateTimePickerEvent,
    selectedDate?: Date
  ) => {
    if (event.type === "set" && selectedDate) {
      setDuration((prev) => ({
        ...prev,
        startDate: selectedDate,
      }));
    }
  };

  const handleEndDateChange = (
    event: DateTimePickerEvent,
    selectedDate?: Date
  ) => {
    if (event.type === "set" && selectedDate) {
      setDuration((prev) => ({
        ...prev,
        endDate: selectedDate,
      }));
    }
  };

  // Time picker handlers

  // Helper function to convert time string to Date object
  const convertTimeToDate = (timeString: string) => {
    const [hours, minutes] = timeString.split(":").map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date;
  };

  // Handle time change for specific index
  const handleTimeChangeForIndex = (
    event: DateTimePickerEvent,
    selectedTime?: Date,
    index?: number
  ) => {
    if (event.type === "set" && selectedTime && index !== undefined) {
      const hours = selectedTime.getHours().toString().padStart(2, "0");
      const minutes = selectedTime.getMinutes().toString().padStart(2, "0");
      const formattedTime = `${hours}:${minutes}`;

      const newTimes = [...frequency.times];
      newTimes[index] = formattedTime;
      setFrequency((prev) => ({ ...prev, times: newTimes }));
    }
  };

  // Load medicine data for edit mode
  useEffect(() => {
    if (isEditMode && params.medicineData) {
      try {
        const medicineData = JSON.parse(params.medicineData as string);
        console.log("Loading medicine data for edit:", medicineData);

        // Populate form with existing data
        setMedicineData({
          medicineName: medicineData.medicineName || "",
          dosage: medicineData.dosage || "",
          medicineType: medicineData.medicineType || "Tablet",
          instructions: medicineData.instructions || "",
          stockQuantity: medicineData.stockQuantity || 30,
          stockAlert: medicineData.stockAlert || 5,
          stock: {
            current:
              medicineData.stock?.current || medicineData.stockQuantity || 30,
            currentStock:
              medicineData.stock?.currentStock ||
              medicineData.stockQuantity ||
              30,
            refillThreshold:
              medicineData.stock?.refillThreshold ||
              medicineData.stockAlert ||
              5,
            unit: medicineData.stock?.unit || "tablets",
            lastUpdated: new Date(),
          },
          notes: medicineData.notes || "",
          color: medicineData.color || "#F47B9F",
          icon: medicineData.icon || "pill",
          isActive: medicineData.isActive !== false, // default to true
        });

        setFrequency({
          type: medicineData.frequency?.type || "daily",
          times: medicineData.frequency?.times || ["08:00"],
          specificDays: medicineData.frequency?.specificDays || [
            0, 1, 2, 3, 4, 5, 6,
          ],
        });

        setDuration({
          startDate: medicineData.duration?.startDate
            ? new Date(medicineData.duration.startDate)
            : new Date(),
          endDate: medicineData.duration?.endDate
            ? new Date(medicineData.duration.endDate)
            : null,
          totalDays: medicineData.duration?.totalDays || null,
        });
      } catch (error) {
        console.error("Error parsing medicine data:", error);
        Alert.alert("Error", "Failed to load medicine data for editing");
      }
    }
  }, [isEditMode, params.medicineData]);

  const handleAddTime = () => {
    const nextTime = "12:00"; // Simple default time
    setFrequency((prev) => ({
      ...prev,
      times: [...prev.times, nextTime],
    }));
  };

  const handleRemoveTime = (index: number) => {
    if (frequency.times.length > 1) {
      Alert.alert(
        "Remove Time",
        "Are you sure you want to remove this reminder time?",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Remove",
            style: "destructive",
            onPress: () => {
              setFrequency((prev) => ({
                ...prev,
                times: prev.times.filter((_, i) => i !== index),
              }));
            },
          },
        ]
      );
    }
  };

  const handleToggleDay = (dayIndex: number) => {
    setFrequency((prev) => ({
      ...prev,
      specificDays: prev.specificDays.includes(dayIndex)
        ? prev.specificDays.filter((d) => d !== dayIndex)
        : [...prev.specificDays, dayIndex],
    }));
  };

  const handleSave = async () => {
    // Validation
    if (!medicineData.medicineName.trim()) {
      Alert.alert("Error", "Please enter medicine name");
      return;
    }

    if (!medicineData.dosage.trim()) {
      Alert.alert("Error", "Please enter dosage");
      return;
    }

    if (frequency.type !== "as_needed" && frequency.times.length === 0) {
      Alert.alert("Error", "Please add at least one reminder time");
      return;
    }

    if (frequency.type === "interval" && frequency.specificDays.length === 0) {
      Alert.alert("Error", "Please select at least one day");
      return;
    }

    setLoading(true);
    try {
      if (isEditMode && editingMedicineId) {
        // Update existing medicine
        const updateData = {
          ...medicineData,
          frequency,
          duration,
        };

        console.log("Updating medicine with ID:", editingMedicineId);
        console.log("Update data:", updateData);

        const result = await updateMedicine(editingMedicineId, updateData);

        if (result.success) {
          Alert.alert("Success", "Medicine updated successfully");
          router.back();
        } else {
          Alert.alert("Error", result.error || "Failed to update medicine");
        }
      } else {
        // Add new medicine
        const newMedicine: Omit<
          MedicineReminder,
          "reminderId" | "userId" | "createdAt" | "updatedAt"
        > = {
          ...medicineData,
          frequency,
          duration,
        };

        const result = await addMedicine(newMedicine);

        if (result.success) {
          Alert.alert("Success", "Medicine added successfully");
          router.back();
        } else {
          Alert.alert("Error", result.error || "Failed to add medicine");
        }
      }
    } catch (error) {
      console.error("Save error:", error);
      Alert.alert("Error", "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const renderBasicInfo = () => (
    <View style={[styles.card, { backgroundColor: colors.card }]}>
      <View style={styles.cardHeader}>
        <Ionicons name="medical-outline" size={24} color={colors.primary} />
        <Text style={[styles.cardTitle, { color: colors.text }]}>
          Basic Information
        </Text>
      </View>

      <View style={styles.inputGroup}>
        <Text style={[styles.label, { color: colors.text }]}>
          Medicine Name *
        </Text>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: colors.backgroundSecondary,
              borderColor: colors.border,
              color: colors.text,
            },
          ]}
          value={medicineData.medicineName}
          onChangeText={(text) =>
            setMedicineData((prev) => ({ ...prev, medicineName: text }))
          }
          placeholder="e.g., Paracetamol"
          placeholderTextColor={colors.textSecondary}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={[styles.label, { color: colors.text }]}>Dosage *</Text>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: colors.backgroundSecondary,
              borderColor: colors.border,
              color: colors.text,
            },
          ]}
          value={medicineData.dosage}
          onChangeText={(text) =>
            setMedicineData((prev) => ({ ...prev, dosage: text }))
          }
          placeholder="e.g., 500mg"
          placeholderTextColor={colors.textSecondary}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={[styles.label, { color: colors.text }]}>
          Medicine Type
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.typeScroll}
        >
          {medicineTypes.map((type) => (
            <TouchableOpacity
              key={type}
              style={[
                styles.typePill,
                {
                  backgroundColor:
                    medicineData.medicineType === type
                      ? colors.primary
                      : colors.backgroundSecondary,
                  borderColor:
                    medicineData.medicineType === type
                      ? colors.primary
                      : colors.border,
                },
              ]}
              onPress={() =>
                setMedicineData((prev) => ({ ...prev, medicineType: type }))
              }
            >
              <Text
                style={[
                  styles.typeText,
                  {
                    color:
                      medicineData.medicineType === type
                        ? "#FFFFFF"
                        : colors.text,
                  },
                ]}
              >
                {type}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.inputGroup}>
        <Text style={[styles.label, { color: colors.text }]}>Instructions</Text>
        <TextInput
          style={[
            styles.textArea,
            {
              backgroundColor: colors.backgroundSecondary,
              borderColor: colors.border,
              color: colors.text,
            },
          ]}
          value={medicineData.instructions}
          onChangeText={(text) =>
            setMedicineData((prev) => ({ ...prev, instructions: text }))
          }
          placeholder="e.g., Take with food"
          placeholderTextColor={colors.textSecondary}
          multiline
          numberOfLines={3}
        />
      </View>
    </View>
  );

  const renderFrequencySettings = () => (
    <View style={[styles.card, { backgroundColor: colors.card }]}>
      <View style={styles.cardHeader}>
        <Ionicons name="time-outline" size={24} color={colors.primary} />
        <Text style={[styles.cardTitle, { color: colors.text }]}>
          Frequency Settings
        </Text>
      </View>

      <View style={styles.inputGroup}>
        <Text style={[styles.label, { color: colors.text }]}>
          Schedule Type
        </Text>
        <View style={styles.frequencyGrid}>
          {frequencyTypes.map((type) => (
            <TouchableOpacity
              key={type.value}
              style={[
                styles.frequencyOption,
                {
                  backgroundColor:
                    frequency.type === type.value
                      ? colors.primary
                      : colors.backgroundSecondary,
                  borderColor:
                    frequency.type === type.value
                      ? colors.primary
                      : colors.border,
                },
              ]}
              onPress={() =>
                setFrequency((prev) => ({ ...prev, type: type.value as any }))
              }
            >
              <Text
                style={[
                  styles.frequencyText,
                  {
                    color:
                      frequency.type === type.value ? "#FFFFFF" : colors.text,
                  },
                ]}
              >
                {type.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {frequency.type === "interval" && (
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.text }]}>
            Interval (hours)
          </Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.backgroundSecondary,
                borderColor: colors.border,
                color: colors.text,
              },
            ]}
            value={frequency.interval?.toString() || "8"}
            onChangeText={(text) =>
              setFrequency((prev) => ({
                ...prev,
                interval: parseInt(text) || 8,
              }))
            }
            keyboardType="numeric"
            placeholder="8"
            placeholderTextColor={colors.textSecondary}
          />
        </View>
      )}

      {frequency.type === "interval" && (
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.text }]}>
            Select Days
          </Text>
          <View style={styles.daysGrid}>
            {daysOfWeek.map((day, index) => (
              <TouchableOpacity
                key={day}
                style={[
                  styles.dayPill,
                  {
                    backgroundColor: frequency.specificDays.includes(index)
                      ? colors.primary
                      : colors.backgroundSecondary,
                    borderColor: frequency.specificDays.includes(index)
                      ? colors.primary
                      : colors.border,
                  },
                ]}
                onPress={() => handleToggleDay(index)}
              >
                <Text
                  style={[
                    styles.dayText,
                    {
                      color: frequency.specificDays.includes(index)
                        ? "#FFFFFF"
                        : colors.text,
                    },
                  ]}
                >
                  {day}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {frequency.type !== "as_needed" && (
        <View style={styles.inputGroup}>
          <View style={styles.timeHeader}>
            <Text style={[styles.label, { color: colors.text }]}>
              Reminder Times
            </Text>
            <TouchableOpacity onPress={handleAddTime} style={styles.addButton}>
              <Ionicons name="add" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          {frequency.times.map((time, index) => (
            <View key={index} style={styles.timeRow}>
              <View style={styles.timeInputContainer}>
                <View
                  style={
                    Platform.OS === "ios"
                      ? styles.inlineDatePickerContainer
                      : {}
                  }
                >
                  <DateTimePicker
                    testID={`timePicker${index}`}
                    value={convertTimeToDate(time)}
                    mode="time"
                    onChange={(event, selectedTime) =>
                      handleTimeChangeForIndex(event, selectedTime, index)
                    }
                    textColor={colors.text}
                    accentColor={colors.primary}
                    style={{ flex: 1 }}
                  />
                </View>
              </View>
              {frequency.times.length > 1 && (
                <TouchableOpacity
                  style={[styles.removeButton, { backgroundColor: "#FF6B6B" }]}
                  onPress={() => handleRemoveTime(index)}
                  activeOpacity={0.8}
                >
                  <Ionicons name="remove" size={20} color="#FFFFFF" />
                </TouchableOpacity>
              )}
            </View>
          ))}
        </View>
      )}
    </View>
  );

  const renderDurationSettings = () => (
    <View style={[styles.card, { backgroundColor: colors.card }]}>
      <View style={styles.cardHeader}>
        <Ionicons name="calendar-outline" size={24} color={colors.primary} />
        <Text style={[styles.cardTitle, { color: colors.text }]}>Duration</Text>
      </View>

      <View style={styles.inputGroup}>
        <Text style={[styles.label, { color: colors.text }]}>Start Date</Text>
        <View
          style={Platform.OS === "ios" ? styles.inlineDatePickerContainer : {}}
        >
          <DateTimePicker
            testID="startDatePicker"
            value={duration.startDate}
            mode="date"
            onChange={handleStartDateChange}
            textColor={colors.text}
            accentColor={colors.primary}
          />
          {Platform.OS === "ios" && (
            <View style={styles.pickerActions}>
              <Text
                style={[styles.pickerInfo, { color: colors.textSecondary }]}
              >
                {duration.startDate.toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.inputGroup}>
        <View style={styles.toggleRow}>
          <Text style={[styles.label, { color: colors.text }]}>End Date</Text>
          <TouchableOpacity
            style={[
              styles.toggleButton,
              {
                backgroundColor: duration.endDate ? "#FF6B6B" : colors.primary,
              },
            ]}
            onPress={() => {
              if (duration.endDate) {
                setDuration((prev) => ({ ...prev, endDate: null }));
              } else {
                // Set default end date to 30 days from start date
                const endDate = new Date(duration.startDate);
                endDate.setDate(endDate.getDate() + 30);
                setDuration((prev) => ({ ...prev, endDate }));
              }
            }}
          >
            <Text style={styles.toggleText}>
              {duration.endDate ? "Remove" : "Add"}
            </Text>
          </TouchableOpacity>
        </View>
        {duration.endDate && (
          <View
            style={
              Platform.OS === "ios" ? styles.inlineDatePickerContainer : {}
            }
          >
            <DateTimePicker
              testID="endDatePicker"
              value={duration.endDate}
              mode="date"
              onChange={handleEndDateChange}
              minimumDate={duration.startDate}
              textColor={colors.text}
              accentColor={colors.primary}
            />
            {Platform.OS === "ios" && (
              <View style={styles.pickerActions}>
                <Text
                  style={[styles.pickerInfo, { color: colors.textSecondary }]}
                >
                  {duration.endDate.toLocaleDateString("en-US", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </Text>
              </View>
            )}
          </View>
        )}
      </View>
    </View>
  );

  const renderStockSettings = () => (
    <View style={[styles.card, { backgroundColor: colors.card }]}>
      <View style={styles.cardHeader}>
        <Ionicons name="storefront-outline" size={24} color={colors.primary} />
        <Text style={[styles.cardTitle, { color: colors.text }]}>
          Stock Management
        </Text>
      </View>

      <View style={styles.inputGroup}>
        <Text style={[styles.label, { color: colors.text }]}>
          Current Stock
        </Text>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: colors.backgroundSecondary,
              borderColor: colors.border,
              color: colors.text,
            },
          ]}
          value={medicineData.stock.current.toString()}
          onChangeText={(text) =>
            setMedicineData((prev) => ({
              ...prev,
              stock: {
                ...prev.stock,
                current: parseInt(text) || 0,
                currentStock: parseInt(text) || 0,
                lastUpdated: new Date(),
              },
              stockQuantity: parseInt(text) || 0,
            }))
          }
          keyboardType="numeric"
          placeholder="30"
          placeholderTextColor={colors.textSecondary}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={[styles.label, { color: colors.text }]}>
          Alert When Below
        </Text>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: colors.backgroundSecondary,
              borderColor: colors.border,
              color: colors.text,
            },
          ]}
          value={medicineData.stock.refillThreshold.toString()}
          onChangeText={(text) =>
            setMedicineData((prev) => ({
              ...prev,
              stock: { ...prev.stock, refillThreshold: parseInt(text) || 5 },
              stockAlert: parseInt(text) || 5,
            }))
          }
          keyboardType="numeric"
          placeholder="5"
          placeholderTextColor={colors.textSecondary}
        />
      </View>
    </View>
  );

  const renderColorSelection = () => (
    <View style={[styles.card, { backgroundColor: colors.card }]}>
      <View style={styles.cardHeader}>
        <Ionicons
          name="color-palette-outline"
          size={24}
          color={colors.primary}
        />
        <Text style={[styles.cardTitle, { color: colors.text }]}>
          Color & Appearance
        </Text>
      </View>

      <View style={styles.colorContainer}>
        {medicineColors.map((color) => (
          <TouchableOpacity
            key={color}
            style={[
              styles.colorOption,
              { backgroundColor: color },
              medicineData.color === color && styles.selectedColor,
            ]}
            onPress={() => setMedicineData((prev) => ({ ...prev, color }))}
          >
            {medicineData.color === color && (
              <Ionicons name="checkmark" size={20} color="#FFFFFF" />
            )}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />

      {/* Header actions - inline with custom header */}
      <View style={styles.headerActions}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={[
              styles.iconButton,
              {
                borderColor: colors.border,
                backgroundColor: colors.backgroundSecondary,
              },
            ]}
          >
            <Ionicons name="chevron-back" size={20} color={colors.text} />
          </TouchableOpacity>
          <View
            style={[
              styles.badge,
              { backgroundColor: isEditMode ? "#FF8B94" : "#84CC16" },
            ]}
          >
            <Text style={styles.badgeText}>
              {isEditMode ? "Edit Medicine" : "New Medicine"}
            </Text>
          </View>
        </View>
        <TouchableOpacity
          onPress={handleSave}
          disabled={loading}
          style={[
            styles.saveButton,
            {
              backgroundColor: loading ? colors.border : colors.primary,
              opacity: loading ? 0.7 : 1,
            },
          ]}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.saveButtonText}>Save</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Content Section */}
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.contentContainer}>
          {renderBasicInfo()}
          {renderFrequencySettings()}
          {renderDurationSettings()}
          {renderStockSettings()}
          {renderColorSelection()}
        </View>
      </ScrollView>

      {/* Native Date Pickers */}

      {showEndDatePicker && (
        <View style={Platform.OS === "ios" ? { height: 200 } : {}}>
          <DateTimePicker
            testID="endDatePicker"
            value={duration.endDate || new Date()}
            mode="date"
            display={Platform.OS === "ios" ? "spinner" : "default"}
            onChange={handleEndDateChange}
            minimumDate={duration.startDate}
            textColor={colors.text}
            accentColor={colors.primary}
          />
          {Platform.OS === "ios" && (
            <View style={styles.pickerActions}>
              <TouchableOpacity
                onPress={() => setShowEndDatePicker(false)}
                style={[
                  styles.pickerButton,
                  { backgroundColor: colors.border },
                ]}
              >
                <Text style={[styles.pickerButtonText, { color: colors.text }]}>
                  Done
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  saveButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 96,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    gap: 20,
  },
  card: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    gap: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    height: 80,
    textAlignVertical: "top",
  },
  typeScroll: {
    flexDirection: "row",
  },
  typePill: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  typeText: {
    fontSize: 14,
    fontWeight: "600",
  },
  daysGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 8,
  },
  dayPill: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    marginBottom: 8,
  },
  dayText: {
    fontSize: 14,
    fontWeight: "600",
  },
  frequencyGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  frequencyOption: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 15,
    borderWidth: 1,
    marginBottom: 10,
  },
  frequencyText: {
    fontSize: 14,
    fontWeight: "600",
  },
  timeHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  timeRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  timeInputContainer: {
    flex: 1,
    marginRight: 12,
  },
  timeInput: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
  },
  timeText: {
    fontSize: 18,
    fontWeight: "500",
  },
  timeIcon: {
    marginLeft: 12,
  },
  inlineDatePickerContainer: {
    borderRadius: 12,
    overflow: "hidden",
  },
  pickerActions: {
    flexDirection: "row",
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  pickerInfo: {
    fontSize: 16,
    fontWeight: "500",
    textAlign: "center",
  },
  pickerButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 8,
  },
  pickerButtonText: {
    fontSize: 16,
    fontWeight: "500",
  },
  removeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FF6B6B",
    alignItems: "center",
    justifyContent: "center",
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#84CC16",
    alignItems: "center",
    justifyContent: "center",
  },
  toggleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  toggleButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    alignItems: "center",
  },
  toggleText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  dateInput: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    // Add visual feedback for TouchableOpacity
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  dateText: {
    fontSize: 16,
  },
  colorContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    flexWrap: "wrap",
    gap: 15,
  },
  colorOption: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  selectedColor: {
    borderWidth: 3,
    borderColor: "#FFFFFF",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
      },
      android: {
        elevation: 6,
      },
    }),
  },
});
