import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
  Image,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Colors } from "@/constants/theme";
import { medicineService } from "@/services";
import { useAuth } from "@/contexts/AuthContext";

interface MedicineFormData {
  name?: string;
  amount?: string;
  type?: string;
  mealTiming?: "pre" | "post";
  notes?: string;
  photoUri?: string | null;
}

interface TypeOption {
  value: string;
  name: string;
  unit: string;
}

const MEDICINE_TYPES: TypeOption[] = [
  { value: "pill", name: "Pill", unit: "pill" },
  { value: "cap", name: "Capsule", unit: "cap" },
  { value: "syrup", name: "Syrup", unit: "ml" },
  { value: "shot", name: "Injection", unit: "ml" },
  { value: "cream", name: "Cream", unit: "application" },
  { value: "inhale", name: "Inhaler", unit: "puff" },
  { value: "drop", name: "Drops", unit: "drop" },
  { value: "mist", name: "Spray", unit: "spray" },
  { value: "patch", name: "Patch", unit: "patch" },
];

export default function MedicineFormScreenStep1() {
  const navigation = useRouter();
  const theme = useColorScheme();
  const themeColors = Colors[theme ?? "light"];
  const routeParams = useLocalSearchParams();
  const { user } = useAuth();

  const isEditingMode = routeParams.editMode === "true";
  const medicineRecordId = routeParams.medicineId as string;

  const existingData = routeParams.medicineData
    ? (JSON.parse(routeParams.medicineData as string) as MedicineFormData)
    : null;

  const [formState, setFormState] = useState<MedicineFormData>({
    name: existingData?.name || "",
    amount: existingData?.amount || "",
    type: existingData?.type || "pill",
    mealTiming: existingData?.mealTiming || "pre",
    notes: existingData?.notes || "",
    photoUri: existingData?.photoUri || null,
  });

  useEffect(() => {
    if (isEditingMode && medicineRecordId && user) {
      const fetchExistingMedicine = async () => {
        try {
          console.log("Fetching medicine for edit:", medicineRecordId);
          const medicineRecord = await medicineService.getMedicineById(
            user.userId,
            medicineRecordId
          );

          if (medicineRecord) {
            console.log("Medicine data loaded:", medicineRecord);
            setFormState((current) => ({
              ...current,
              name: medicineRecord.medicineName || current.name,
              amount: medicineRecord.dosage || current.amount,
              type: medicineRecord.medicineType || current.type,
              mealTiming: medicineRecord.takeWithMeal || current.mealTiming,
              notes: medicineRecord.description || current.notes,
              photoUri: medicineRecord.drugAppearance || current.photoUri,
            }));
          }
        } catch (err) {
          console.error("Failed to load medicine:", err);
          Alert.alert("Error", "Could not load medicine data");
        }
      };

      fetchExistingMedicine();
    }
  }, [isEditingMode, medicineRecordId, user]);

  const proceedToNextStep = () => {
    if (!formState.name?.trim()) {
      Alert.alert("Required Field", "Medicine name is required");
      return;
    }

    if (!formState.amount?.trim()) {
      Alert.alert("Required Field", "Dosage amount is required");
      return;
    }

    const dataForStep2 = {
      ...formState,
      editMode: isEditingMode,
      medicineId: medicineRecordId,
    };

    navigation.push({
      pathname: "/medicine/add-step2",
      params: {
        step1Data: JSON.stringify(dataForStep2),
      },
    });
  };

  const selectPhoto = async () => {
    try {
      const pickerResult = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!pickerResult.canceled) {
        setFormState((prev) => ({
          ...prev,
          photoUri: pickerResult.assets[0].uri,
        }));
      }
    } catch (error) {
      Alert.alert("Error", "Unable to select image");
    }
  };

  const TypeButton = (option: TypeOption) => {
    const isActive = formState.type === option.value;
    return (
      <TouchableOpacity
        key={option.value}
        style={[
          styles.typeBtn,
          {
            backgroundColor: isActive
              ? themeColors.primary
              : themeColors.backgroundSecondary,
            borderColor: isActive ? themeColors.primary : themeColors.border,
          },
        ]}
        onPress={() => {
          setFormState((prev) => {
            const amountParts = prev.amount?.split(" ") || [];
            if (amountParts.length > 0) {
              return {
                ...prev,
                type: option.value,
                amount: `${amountParts[0]} ${option.unit}`,
              };
            }
            return { ...prev, type: option.value };
          });
        }}
      >
        <Text
          style={[
            styles.typeBtnText,
            { color: isActive ? "#FFF" : themeColors.text },
          ]}
        >
          {option.name}
        </Text>
      </TouchableOpacity>
    );
  };

  const MealTimingButton = (timing: "pre" | "post") => {
    const isSelected = formState.mealTiming === timing;
    return (
      <TouchableOpacity
        key={timing}
        style={[
          styles.mealBtn,
          {
            backgroundColor: isSelected
              ? themeColors.primary
              : themeColors.backgroundSecondary,
            borderColor: isSelected ? themeColors.primary : themeColors.border,
          },
        ]}
        onPress={() => setFormState((prev) => ({ ...prev, mealTiming: timing }))}
      >
        <Text
          style={[
            styles.mealBtnText,
            { color: isSelected ? "#FFF" : themeColors.text },
          ]}
        >
          {timing === "pre" ? "Before Eating" : "After Eating"}
        </Text>
      </TouchableOpacity>
    );
  };

  const getUnitForCurrentType = () => {
    const selected = MEDICINE_TYPES.find((t) => t.value === formState.type);
    return selected?.unit || "pill";
  };

  const handleAmountChange = (input: string) => {
    const digits = input.replace(/[^0-9]/g, "");
    if (digits) {
      setFormState((prev) => ({
        ...prev,
        amount: `${digits} ${getUnitForCurrentType()}`,
      }));
    }
  };

  return (
    <SafeAreaView
      style={[styles.wrapper, { backgroundColor: themeColors.background }]}
    >
      <StatusBar style={theme === "dark" ? "light" : "dark"} />

      <View style={[styles.topBar, { borderBottomColor: themeColors.border }]}>
        <TouchableOpacity
          onPress={() => navigation.back()}
          style={[
            styles.backBtn,
            {
              borderColor: themeColors.border,
              backgroundColor: themeColors.backgroundSecondary,
            },
          ]}
        >
          <Ionicons name="chevron-back" size={20} color={themeColors.text} />
        </TouchableOpacity>
        <Text style={[styles.topBarTitle, { color: themeColors.text }]}>
          {isEditingMode ? "Update Medicine" : "New Medicine"}
        </Text>
        <View style={styles.spacer} />
      </View>

      <View style={styles.progress}>
        <View
          style={[styles.progressFilled, { backgroundColor: themeColors.primary }]}
        />
        <View
          style={[
            styles.progressEmpty,
            { backgroundColor: themeColors.border },
          ]}
        />
      </View>

      <ScrollView style={styles.scroller} showsVerticalScrollIndicator={false}>
        <View style={styles.contentArea}>
          <View style={styles.stepDisplay}>
            <View
              style={[styles.stepCircleActive, { backgroundColor: themeColors.primary }]}
            >
              <Text style={styles.stepCircleActiveText}>1</Text>
            </View>
            <View
              style={[styles.stepConnector, { backgroundColor: themeColors.border }]}
            />
            <View
              style={[
                styles.stepCircleInactive,
                {
                  backgroundColor: themeColors.backgroundSecondary,
                  borderColor: themeColors.border,
                },
              ]}
            >
              <Text
                style={[
                  styles.stepCircleInactiveText,
                  { color: themeColors.textSecondary },
                ]}
              >
                2
              </Text>
            </View>
          </View>

          <View style={styles.headerSection}>
            <Text style={[styles.mainTitle, { color: themeColors.text }]}>
              Basic Medicine Info
            </Text>
            <Text style={[styles.mainSubtitle, { color: themeColors.textSecondary }]}>
              Fill in the essential details about your medicine
            </Text>
          </View>

          <View style={[styles.formCard, { backgroundColor: themeColors.card }]}>
            <Text style={[styles.fieldLabel, { color: themeColors.text }]}>
              Medicine Photo (Optional)
            </Text>
            <Text style={[styles.fieldHint, { color: themeColors.textSecondary }]}>
              Upload a photo for easy identification
            </Text>

            <TouchableOpacity style={styles.photoUpload} onPress={selectPhoto}>
              {formState.photoUri ? (
                <View style={styles.photoWrapper}>
                  <Image
                    source={{ uri: formState.photoUri }}
                    style={styles.photoPreview}
                  />
                  <TouchableOpacity
                    style={styles.photoRemove}
                    onPress={() =>
                      setFormState((prev) => ({
                        ...prev,
                        photoUri: null,
                      }))
                    }
                  >
                    <Ionicons name="close" size={16} color="#FFF" />
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.photoPlaceholder}>
                  <Ionicons
                    name="camera"
                    size={32}
                    color={themeColors.textSecondary}
                  />
                  <Text
                    style={[
                      styles.photoPlaceholderText,
                      { color: themeColors.textSecondary },
                    ]}
                  >
                    Add a photo
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          <View style={[styles.formCard, { backgroundColor: themeColors.card }]}>
            <Text style={[styles.fieldLabel, { color: themeColors.text }]}>
              Name of Medicine
            </Text>
            <TextInput
              style={[
                styles.textField,
                {
                  backgroundColor: themeColors.backgroundSecondary,
                  borderColor: themeColors.border,
                  color: themeColors.text,
                },
              ]}
              placeholder="Type medicine name here..."
              placeholderTextColor={themeColors.textSecondary}
              value={formState.name}
              onChangeText={(text) =>
                setFormState((prev) => ({ ...prev, name: text }))
              }
            />
          </View>

          <View style={[styles.formCard, { backgroundColor: themeColors.card }]}>
            <Text style={[styles.fieldLabel, { color: themeColors.text }]}>
              Type of Medicine
            </Text>
            <Text style={[styles.fieldHint, { color: themeColors.textSecondary }]}>
              Choose the form (dosage unit will adjust automatically)
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.typeList}>
                {MEDICINE_TYPES.map(TypeButton)}
              </View>
            </ScrollView>
          </View>

          <View style={[styles.formCard, { backgroundColor: themeColors.card }]}>
            <Text style={[styles.fieldLabel, { color: themeColors.text }]}>
              Dosage Amount
            </Text>
            <Text style={[styles.fieldHint, { color: themeColors.textSecondary }]}>
              Quantity per dose (unit changes with type)
            </Text>
            <View style={styles.amountRow}>
              <TextInput
                style={[
                  styles.amountField,
                  {
                    backgroundColor: themeColors.backgroundSecondary,
                    borderColor: themeColors.border,
                    color: themeColors.text,
                  },
                ]}
                placeholder="e.g., 1, 5, 10"
                placeholderTextColor={themeColors.textSecondary}
                value={formState.amount?.split(" ")[0] || ""}
                onChangeText={handleAmountChange}
                keyboardType="numeric"
                maxLength={5}
              />
              <Text style={[styles.unitLabel, { color: themeColors.textSecondary }]}>
                {getUnitForCurrentType()}
              </Text>
            </View>
          </View>

          <View style={[styles.formCard, { backgroundColor: themeColors.card }]}>
            <Text style={[styles.fieldLabel, { color: themeColors.text }]}>
              Meal Timing
            </Text>
            <Text style={[styles.fieldHint, { color: themeColors.textSecondary }]}>
              When to take this medicine?
            </Text>
            <View style={styles.mealRow}>
              {MealTimingButton("pre")}
              {MealTimingButton("post")}
            </View>
          </View>

          <View style={[styles.formCard, { backgroundColor: themeColors.card }]}>
            <Text style={[styles.fieldLabel, { color: themeColors.text }]}>
              Additional Notes (Optional)
            </Text>
            <Text style={[styles.fieldHint, { color: themeColors.textSecondary }]}>
              Special instructions or reminders
            </Text>
            <TextInput
              style={[
                styles.notesField,
                {
                  backgroundColor: themeColors.backgroundSecondary,
                  borderColor: themeColors.border,
                  color: themeColors.text,
                },
              ]}
              placeholder="Any special instructions..."
              placeholderTextColor={themeColors.textSecondary}
              value={formState.notes}
              onChangeText={(text) =>
                setFormState((prev) => ({ ...prev, notes: text }))
              }
              multiline
              numberOfLines={5}
              textAlignVertical="top"
            />
          </View>

          <View style={styles.bottomGap} />
        </View>
      </ScrollView>

      <View
        style={[
          styles.actionBar,
          { backgroundColor: themeColors.background },
        ]}
      >
        <TouchableOpacity
          style={[styles.continueBtn, { backgroundColor: themeColors.primary }]}
          onPress={proceedToNextStep}
          activeOpacity={0.7}
        >
          <Text style={styles.continueBtnText}>Continue</Text>
          <Ionicons name="arrow-forward" size={20} color="#FFF" />
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
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  topBarTitle: {
    fontSize: 18,
    fontWeight: "600",
    flex: 1,
    textAlign: "center",
    marginHorizontal: 16,
  },
  spacer: {
    width: 40,
  },
  progress: {
    height: 3,
    backgroundColor: "#E5E5E7",
    position: "relative",
  },
  progressFilled: {
    width: "50%",
    height: "100%",
  },
  progressEmpty: {
    position: "absolute",
    right: 0,
    top: 0,
    width: "50%",
    height: "100%",
  },
  scroller: {
    flex: 1,
  },
  contentArea: {
    padding: 20,
  },
  stepDisplay: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 32,
  },
  stepCircleActive: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  stepCircleActiveText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
  },
  stepConnector: {
    width: 40,
    height: 2,
  },
  stepCircleInactive: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  stepCircleInactiveText: {
    fontSize: 16,
    fontWeight: "600",
  },
  headerSection: {
    marginBottom: 24,
    alignItems: "center",
  },
  mainTitle: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 8,
    textAlign: "center",
  },
  mainSubtitle: {
    fontSize: 16,
    textAlign: "center",
    lineHeight: 24,
  },
  formCard: {
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
  photoUpload: {
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E5E5E7",
    borderRadius: 12,
    padding: 20,
    borderStyle: "dashed",
  },
  photoWrapper: {
    position: "relative",
  },
  photoPreview: {
    width: 120,
    height: 120,
    borderRadius: 12,
  },
  photoRemove: {
    position: "absolute",
    top: -8,
    right: -8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#FF6B6B",
    alignItems: "center",
    justifyContent: "center",
  },
  photoPlaceholder: {
    alignItems: "center",
    justifyContent: "center",
  },
  photoPlaceholderText: {
    fontSize: 14,
    marginTop: 8,
  },
  textField: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
  },
  typeList: {
    flexDirection: "row",
    paddingHorizontal: 5,
  },
  typeBtn: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 12,
  },
  typeBtnText: {
    fontSize: 14,
    fontWeight: "500",
  },
  amountRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  amountField: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    marginRight: 12,
  },
  unitLabel: {
    fontSize: 16,
    fontWeight: "500",
  },
  mealRow: {
    flexDirection: "row",
    gap: 12,
  },
  mealBtn: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  mealBtnText: {
    fontSize: 14,
    fontWeight: "500",
  },
  notesField: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    minHeight: 100,
  },
  bottomGap: {
    height: 100,
  },
  actionBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: "#E5E5E7",
  },
  continueBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 28,
  },
  continueBtnText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
    marginRight: 8,
  },
});