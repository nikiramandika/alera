import React, { useState, useEffect } from "react";
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

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface FirstStepData {
  name?: string;
  amount?: string;
  type?: string;
  mealTiming?: "pre" | "post";
  notes?: string;
  photoUri?: string | null;
  editMode?: boolean;
  medicineId?: string;
}

interface ScheduleOption {
  key: string;
  title: string;
  iconName: keyof typeof Ionicons.glyphMap;
  info: string;
}

const SCHEDULE_OPTIONS: ScheduleOption[] = [
  {
    key: "everyday",
    title: "Every Day",
    iconName: "calendar-outline" as keyof typeof Ionicons.glyphMap,
    info: "Take medicine daily at set times",
  },
  {
    key: "specific",
    title: "Specific Days",
    iconName: "calendar-number-outline" as keyof typeof Ionicons.glyphMap,
    info: "Choose certain days of the week",
  },
];

const WEEKDAYS = [
  { value: 0, short: "S" },
  { value: 1, short: "M" },
  { value: 2, short: "T" },
  { value: 3, short: "W" },
  { value: 4, short: "T" },
  { value: 5, short: "F" },
  { value: 6, short: "S" },
];

export default function MedicineScheduleScreen() {
  const nav = useRouter();
  const appTheme = useColorScheme();
  const palette = Colors[appTheme ?? "light"];
  const { addMedicine, updateMedicine } = useMedicine();
  const { user } = useAuth();
  const urlParams = useLocalSearchParams();

  const previousData = urlParams.step1Data
    ? (JSON.parse(urlParams.step1Data as string) as FirstStepData)
    : null;

  const editingMode = previousData?.editMode || false;
  const recordId = previousData?.medicineId || "";

  const [selectedSchedule, setSelectedSchedule] = useState("everyday");
  const [isSaving, setIsSaving] = useState(false);
  const [hasEndDate, setHasEndDate] = useState(false);

  const [medicineInfo, setMedicineInfo] = useState({
    name: previousData?.name || "",
    amount: previousData?.amount || "",
    type: previousData?.type || "pill",
    mealTiming: previousData?.mealTiming || "pre",
    notes: previousData?.notes || "",
    photoUri: previousData?.photoUri || null,

    schedule: {
      pattern: "everyday" as "everyday" | "specific" | "when_needed",
      weekdays: [] as number[],
      alerts: ["09:00"],
    },

    period: {
      begins: new Date(),
      ends: undefined as Date | undefined,
      totalDuration: null as number | null,
    },
  });

  useEffect(() => {
    if (editingMode && recordId && user) {
      const fetchMedicineInfo = async () => {
        try {
          console.log("Fetching medicine for schedule edit:", recordId);
          const record = await medicineService.getMedicineById(
            user.userId,
            recordId
          );

          if (record) {
            console.log("Medicine record fetched:", record);

            setMedicineInfo({
              name: record.medicineName || "",
              amount: record.dosage || "",
              type: record.medicineType || "pill",
              mealTiming: record.takeWithMeal || "pre",
              notes: record.description || "",
              photoUri: record.drugAppearance || null,

              schedule: {
                pattern: record.frequency?.type || "everyday",
                alerts: record.frequency?.times || ["09:00"],
                weekdays: record.frequency?.specificDays || [],
              },

              period: {
                begins: record.duration?.startDate || new Date(),
                ends: record.duration?.endDate || undefined,
                totalDuration: record.duration?.totalDays || null,
              },
            });

            setSelectedSchedule(record.frequency?.type || "everyday");
            setHasEndDate(!!record.duration?.endDate);
          }
        } catch (err) {
          console.error("Failed to fetch medicine:", err);
        }
      };

      fetchMedicineInfo();
    }
  }, [editingMode, recordId, user]);

  const submitMedicine = async () => {
    setIsSaving(true);
    try {
      const periodData: any = {
        startDate: medicineInfo.period.begins,
        totalDays: medicineInfo.period.totalDuration,
      };

      if (medicineInfo.period.ends) {
        periodData.endDate = medicineInfo.period.ends;
      }

      const scheduleData = {
        type: medicineInfo.schedule.pattern,
        times:
          medicineInfo.schedule.pattern !== "when_needed"
            ? medicineInfo.schedule.alerts
            : [],
        specificDays:
          medicineInfo.schedule.pattern === "specific"
            ? medicineInfo.schedule.weekdays
            : [],
      };

      console.log("=== SCHEDULE SUBMISSION DATA ===");
      console.log("Pattern:", medicineInfo.schedule.pattern);
      console.log("Alerts:", medicineInfo.schedule.alerts);
      console.log("Weekdays:", medicineInfo.schedule.weekdays);
      console.log("Final schedule:", scheduleData);

      const payload = {
        medicineName: medicineInfo.name,
        dosage: medicineInfo.amount,
        medicineType: medicineInfo.type,
        takeWithMeal: medicineInfo.mealTiming,
        description: medicineInfo.notes,
        drugAppearance: medicineInfo.photoUri,

        frequency: scheduleData,
        duration: periodData,

        isActive: true,
        color: palette.primary,
        icon: "💊",
      };

      let outcome;
      if (editingMode && recordId) {
        outcome = await updateMedicine(recordId, payload);
      } else {
        const newEntry = {
          userId: user?.userId || "",
          ...payload,
        };
        outcome = await addMedicine(newEntry);
      }

      if (outcome.success) {
        nav.replace("/(tabs)/medicine");
      } else {
        Alert.alert(
          "Error",
          outcome.error || `Failed to ${editingMode ? "update" : "save"} medicine`
        );
      }
    } catch {
      Alert.alert("Error", "Something went wrong");
    } finally {
      setIsSaving(false);
    }
  };

  const selectWeekday = (day: number) => {
    console.log("Selecting weekday:", day, "Current:", medicineInfo.schedule.weekdays);
    setMedicineInfo((current) => {
      const updatedDays = current.schedule.weekdays?.includes(day)
        ? current.schedule.weekdays.filter((d: number) => d !== day)
        : [...(current.schedule.weekdays || []), day].sort(
            (a: number, b: number) => a - b
          );

      console.log("Updated weekdays:", updatedDays);

      return {
        ...current,
        schedule: {
          ...current.schedule,
          weekdays: updatedDays,
        },
      };
    });
  };

  const insertAlertTime = () => {
    setMedicineInfo((current) => ({
      ...current,
      schedule: {
        ...current.schedule,
        alerts: [...current.schedule.alerts, "13:00"],
      },
    }));
  };

  const deleteAlertTime = (idx: number) => {
    if (medicineInfo.schedule.alerts.length > 1) {
      setMedicineInfo((current) => ({
        ...current,
        schedule: {
          ...current.schedule,
          alerts: current.schedule.alerts.filter(
            (_: string, i: number) => i !== idx
          ),
        },
      }));
    }
  };

  const modifyTime = (
    evt: DateTimePickerEvent,
    picked?: Date,
    idx?: number
  ) => {
    if (evt.type === "set" && picked && idx !== undefined) {
      const hrs = picked.getHours().toString().padStart(2, "0");
      const mins = picked.getMinutes().toString().padStart(2, "0");
      const updatedAlerts = [...medicineInfo.schedule.alerts];
      updatedAlerts[idx] = `${hrs}:${mins}`;
      setMedicineInfo((current) => ({
        ...current,
        schedule: {
          ...current.schedule,
          alerts: updatedAlerts,
        },
      }));
    }
  };

  const parseTimeString = (time: string) => {
    const [h, m] = time.split(":").map(Number);
    const dt = new Date();
    dt.setHours(h, m, 0, 0);
    return dt;
  };

  const switchSchedule = (option: string) => {
    setSelectedSchedule(option);
    setMedicineInfo((current) => ({
      ...current,
      schedule: {
        ...current.schedule,
        pattern: option as "everyday" | "specific",
      },
    }));
  };

  const ScheduleTab = (opt: ScheduleOption, idx: number) => {
    const active = selectedSchedule === opt.key;

    return (
      <TouchableOpacity
        key={opt.key}
        style={[
          styles.scheduleTab,
          {
            backgroundColor: active
              ? palette.primary
              : palette.backgroundSecondary,
            borderColor: active ? palette.primary : palette.border,
          },
        ]}
        onPress={() => switchSchedule(opt.key)}
      >
        <Ionicons
          name={opt.iconName}
          size={20}
          color={active ? "#FFF" : palette.textSecondary}
        />
        <Text
          style={[
            styles.scheduleTabLabel,
            { color: active ? "#FFF" : palette.text },
          ]}
        >
          {opt.title}
        </Text>
      </TouchableOpacity>
    );
  };

  const displayScheduleContent = () => {
    switch (selectedSchedule) {
      case "everyday":
        return showEverydayView();
      case "specific":
        return showSpecificDaysView();
      default:
        return showEverydayView();
    }
  };

  const showEverydayView = () => (
    <View style={styles.scheduleContent}>
      <View style={styles.sectionHeader}>
        <Ionicons name="notifications-outline" size={20} color={palette.primary} />
        <Text style={[styles.sectionTitle, { color: palette.text }]}>
          Alert Times
        </Text>
      </View>

      <Text style={[styles.description, { color: palette.textSecondary }]}>
        Set reminders for taking this medicine
      </Text>

      <View style={styles.alertsList}>
        {medicineInfo.schedule.alerts.map((time: string, idx: number) => (
          <View key={idx} style={styles.alertBox}>
            <View style={styles.alertControls}>
              <View
                style={[
                  styles.pickerWrapper,
                  { backgroundColor: palette.backgroundSecondary },
                ]}
              >
                <DateTimePicker
                  testID={`alert${idx}`}
                  value={parseTimeString(time)}
                  mode="time"
                  onChange={(e, t) => modifyTime(e, t, idx)}
                  textColor={palette.text}
                  accentColor={palette.primary}
                />
              </View>
              {medicineInfo.schedule.alerts.length > 1 && (
                <TouchableOpacity
                  style={[styles.deleteBtn, { backgroundColor: "#FF6B6B" }]}
                  onPress={() => deleteAlertTime(idx)}
                  activeOpacity={0.8}
                >
                  <Ionicons name="remove" size={16} color="#FFF" />
                </TouchableOpacity>
              )}
            </View>
          </View>
        ))}
      </View>

      <TouchableOpacity
        style={[
          styles.insertBtn,
          { backgroundColor: palette.primary + "20" },
        ]}
        onPress={insertAlertTime}
      >
        <Ionicons name="add" size={20} color={palette.primary} />
        <Text style={[styles.insertBtnLabel, { color: palette.primary }]}>
          Add Alert
        </Text>
      </TouchableOpacity>
    </View>
  );

  const showSpecificDaysView = () => (
    <View style={styles.scheduleContent}>
      <View style={styles.sectionHeader}>
        <Ionicons
          name="calendar-number-outline"
          size={20}
          color={palette.primary}
        />
        <Text style={[styles.sectionTitle, { color: palette.text }]}>
          Choose Days
        </Text>
      </View>

      <Text style={[styles.description, { color: palette.textSecondary }]}>
        Pick which days to take this medicine
      </Text>

      <View style={styles.weekdayGrid}>
        {WEEKDAYS.map((wd) => (
          <TouchableOpacity
            key={wd.value}
            style={[
              styles.weekdayChip,
              {
                backgroundColor: medicineInfo.schedule.weekdays?.includes(wd.value)
                  ? palette.primary
                  : palette.backgroundSecondary,
                borderColor: medicineInfo.schedule.weekdays?.includes(wd.value)
                  ? palette.primary
                  : palette.border,
              },
            ]}
            onPress={() => selectWeekday(wd.value)}
          >
            <Text
              style={[
                styles.weekdayLabel,
                {
                  color: medicineInfo.schedule.weekdays?.includes(wd.value)
                    ? "#FFF"
                    : palette.text,
                },
              ]}
            >
              {wd.short}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={[styles.separator, { borderBottomColor: palette.border }]} />

      <Text
        style={[
          styles.description,
          { marginTop: 16, color: palette.textSecondary },
        ]}
      >
        Alert times for selected days:
      </Text>

      <View style={styles.alertsList}>
        {medicineInfo.schedule.alerts.map((time: string, idx: number) => (
          <View key={idx} style={styles.alertBox}>
            <View style={styles.alertControls}>
              <View
                style={[
                  styles.pickerWrapper,
                  { backgroundColor: palette.backgroundSecondary },
                ]}
              >
                <DateTimePicker
                  testID={`alert${idx}`}
                  value={parseTimeString(time)}
                  mode="time"
                  onChange={(e, t) => modifyTime(e, t, idx)}
                  textColor={palette.text}
                  accentColor={palette.primary}
                />
              </View>
              {medicineInfo.schedule.alerts.length > 1 && (
                <TouchableOpacity
                  style={[styles.deleteBtn, { backgroundColor: "#FF6B6B" }]}
                  onPress={() => deleteAlertTime(idx)}
                  activeOpacity={0.8}
                >
                  <Ionicons name="remove" size={16} color="#FFF" />
                </TouchableOpacity>
              )}
            </View>
          </View>
        ))}
      </View>

      <TouchableOpacity
        style={[
          styles.insertBtn,
          { backgroundColor: palette.primary + "20" },
        ]}
        onPress={insertAlertTime}
      >
        <Ionicons name="add" size={20} color={palette.primary} />
        <Text style={[styles.insertBtnLabel, { color: palette.primary }]}>
          Add Alert
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView
      style={[styles.wrapper, { backgroundColor: palette.background }]}
    >
      <StatusBar style={appTheme === "dark" ? "light" : "dark"} />

      <View style={[styles.topBar, { borderBottomColor: palette.border }]}>
        <TouchableOpacity
          onPress={() => nav.back()}
          style={[
            styles.navBack,
            {
              borderColor: palette.border,
              backgroundColor: palette.backgroundSecondary,
            },
          ]}
        >
          <Ionicons name="chevron-back" size={20} color={palette.text} />
        </TouchableOpacity>
        <Text style={[styles.topBarLabel, { color: palette.text }]}>
          {editingMode ? "Update Medicine" : "New Medicine"}
        </Text>
        <View style={styles.emptySpace} />
      </View>

      <View style={styles.progressBar}>
        <View
          style={[styles.progressFilled, { backgroundColor: palette.primary }]}
        />
        <View
          style={[
            styles.progressRemaining,
            { backgroundColor: palette.border },
          ]}
        />
      </View>

      <ScrollView style={styles.mainScroll} showsVerticalScrollIndicator={false}>
        <View style={styles.mainContent}>
          <View style={styles.stepMarkers}>
            <View
              style={[
                styles.stepDone,
                { backgroundColor: palette.primary },
              ]}
            >
              <Ionicons name="checkmark" size={16} color="#FFF" />
            </View>
            <View
              style={[styles.stepConnector, { backgroundColor: palette.primary }]}
            />
            <View
              style={[styles.stepCurrent, { backgroundColor: palette.primary }]}
            >
              <Text style={styles.stepCurrentLabel}>2</Text>
            </View>
          </View>

          <View style={styles.titleSection}>
            <Text style={[styles.mainHeading, { color: palette.text }]}>
              Schedule & Duration
            </Text>
            <Text style={[styles.description, { color: palette.textSecondary }]}>
              Configure timing and duration settings
            </Text>
          </View>

          <View style={[styles.contentCard, { backgroundColor: palette.card }]}>
            <Text style={[styles.fieldLabel, { color: palette.text }]}>
              Schedule Pattern
            </Text>
            <Text style={[styles.fieldHint, { color: palette.textSecondary }]}>
              How often should this medicine be taken?
            </Text>

            <View style={styles.scheduleTabRow}>
              {SCHEDULE_OPTIONS.map((opt, i) => ScheduleTab(opt, i))}
            </View>

            <Text
              style={[
                styles.scheduleDescription,
                { color: palette.textSecondary },
              ]}
            >
              {
                SCHEDULE_OPTIONS.find((opt) => opt.key === selectedSchedule)
                  ?.info
              }
            </Text>
          </View>

          <View style={[styles.contentCard, { backgroundColor: palette.card }]}>
            {displayScheduleContent()}
          </View>

          <View style={[styles.contentCard, { backgroundColor: palette.card }]}>
            <View style={styles.sectionHeader}>
              <Ionicons
                name="calendar-outline"
                size={20}
                color={palette.primary}
              />
              <Text style={[styles.sectionTitle, { color: palette.text }]}>
                Treatment Period
              </Text>
            </View>

            <Text style={[styles.fieldHint, { color: palette.textSecondary }]}>
              Define when to start and optionally when to stop
            </Text>

            <View style={styles.periodRow}>
              <View style={styles.periodField}>
                <Text style={[styles.periodLabel, { color: palette.text }]}>
                  Start Date
                </Text>
                <DateTimePicker
                  value={medicineInfo.period.begins}
                  mode="date"
                  onChange={(e, picked) => {
                    if (e.type === "set" && picked) {
                      setMedicineInfo((current) => ({
                        ...current,
                        period: {
                          ...current.period,
                          begins: picked,
                        },
                      }));
                    }
                  }}
                  textColor={palette.text}
                  accentColor={palette.primary}
                />
              </View>

              <View style={styles.periodField}>
                <Text style={[styles.periodLabel, { color: palette.text }]}>
                  End Date (Optional)
                </Text>
                {!hasEndDate && !medicineInfo.period.ends ? (
                  <TouchableOpacity
                    style={[
                      styles.addEndBtn,
                      {
                        backgroundColor: palette.backgroundSecondary,
                        borderColor: palette.border,
                        borderWidth: 1,
                      },
                    ]}
                    onPress={() => setHasEndDate(true)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="add" size={20} color={palette.primary} />
                  </TouchableOpacity>
                ) : (
                  <View style={styles.endDateRow}>
                    <DateTimePicker
                      value={medicineInfo.period.ends || new Date()}
                      mode="date"
                      onChange={(e, picked) => {
                        if (e.type === "set") {
                          setMedicineInfo((current) => ({
                            ...current,
                            period: {
                              ...current.period,
                              ends: picked,
                            },
                          }));
                        }
                      }}
                      textColor={palette.text}
                      accentColor={palette.primary}
                      style={styles.endDateSelector}
                    />
                    <TouchableOpacity
                      style={[
                        styles.removeEndBtn,
                        { backgroundColor: "#FF6B6B" },
                      ]}
                      onPress={() => {
                        setMedicineInfo((current) => ({
                          ...current,
                          period: {
                            ...current.period,
                            ends: undefined,
                          },
                        }));
                        setHasEndDate(false);
                      }}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="remove" size={16} color="#FFF" />
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </View>
          </View>

          <View style={styles.footerGap} />
        </View>
      </ScrollView>

      <View
        style={[
          styles.actionFooter,
          { backgroundColor: palette.background, borderTopColor: palette.border },
        ]}
      >
        <TouchableOpacity
          style={[
            styles.submitBtn,
            {
              backgroundColor: isSaving ? palette.border : palette.primary,
              opacity: isSaving ? 0.7 : 1,
            },
          ]}
          onPress={submitMedicine}
          disabled={isSaving}
          activeOpacity={0.8}
        >
          {isSaving ? (
            <Text style={styles.submitBtnLabel}>
              {editingMode ? "Saving..." : "Creating..."}
            </Text>
          ) : (
            <>
              <Text style={styles.submitBtnLabel}>
                {editingMode ? "Save Changes" : "Create Medicine"}
              </Text>
              <Ionicons name="checkmark" size={20} color="#FFF" />
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  navBack: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  topBarLabel: {
    fontSize: 18,
    fontWeight: "600",
    flex: 1,
    textAlign: "center",
    marginHorizontal: 16,
  },
  emptySpace: {
    width: 40,
  },
  progressBar: {
    height: 3,
    position: "relative",
  },
  progressFilled: {
    height: "100%",
  },
  progressRemaining: {
    position: "absolute",
    right: 0,
    top: 0,
    width: "50%",
    height: "100%",
  },
  mainScroll: {
    flex: 1,
  },
  mainContent: {
    padding: 20,
  },
  stepMarkers: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 32,
  },
  stepDone: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  stepCurrent: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  stepCurrentLabel: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
  },
  stepConnector: {
    width: 40,
    height: 2,
  },
  titleSection: {
    marginBottom: 24,
  },
  mainHeading: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 8,
    textAlign: "center",
  },
  description: {
    fontSize: 16,
    textAlign: "center",
    lineHeight: 24,
  },
  contentCard: {
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
  fieldLabel: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
  },
  fieldHint: {
    fontSize: 14,
    marginBottom: 16,
    lineHeight: 20,
  },
  scheduleTabRow: {
    flexDirection: "row",
    marginBottom: 16,
    gap: 8,
  },
  scheduleTab: {
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    borderWidth: 1,
  },
  scheduleTabLabel: {
    fontSize: 14,
    fontWeight: "500",
    marginTop: 8,
  },
  scheduleDescription: {
    fontSize: 14,
    fontStyle: "italic",
    textAlign: "center",
  },
  scheduleContent: {
    padding: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  alertsList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 12,
  },
  alertBox: {
    width: "50%",
    marginBottom: 12,
  },
  alertControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  pickerWrapper: {
    borderRadius: 8,
    overflow: "hidden",
    flex: 1,
  },
  deleteBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  insertBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  insertBtnLabel: {
    fontSize: 14,
    fontWeight: "500",
    marginLeft: 8,
  },
  weekdayGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },
  weekdayChip: {
    width: 45,
    height: 45,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  weekdayLabel: {
    fontSize: 14,
    fontWeight: "600",
  },
  separator: {
    borderBottomWidth: 1,
    marginVertical: 16,
  },
  periodRow: {
    flexDirection: "row",
    gap: 16,
  },
  periodField: {
    flex: 1,
  },
  periodLabel: {
    fontSize: 14,
    fontWeight: "500",
    marginLeft: -12,
    marginBottom: 8,
    textAlign: "center",
  },
  footerGap: {
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
