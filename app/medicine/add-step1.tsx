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

interface MedicineData {
  medicineName?: string;
  dosage?: string;
  medicineType?: string;
  takeWithMeal?: "before" | "after";
  description?: string;
  drugAppearance?: string | null;
}

interface MedicineTypeOption {
  id: string;
  label: string;
  dosageUnit: string;
}

const medicineTypes: MedicineTypeOption[] = [
  { id: "tablet", label: "Tablet", dosageUnit: "tablet" },
  { id: "capsule", label: "Capsule", dosageUnit: "capsule" },
  { id: "liquid", label: "Liquid", dosageUnit: "ml" },
  { id: "injection", label: "Injection", dosageUnit: "ml" },
  { id: "topical", label: "Topical", dosageUnit: "application" },
  { id: "inhaler", label: "Inhaler", dosageUnit: "puff" },
  { id: "drops", label: "Drops", dosageUnit: "drops" },
  { id: "spray", label: "Spray", dosageUnit: "spray" },
];

export default function AddMedicineStep1NewScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const params = useLocalSearchParams();
  const { user } = useAuth();

  // Check if edit mode
  const editMode = params.editMode === "true";
  const medicineId = params.medicineId as string;

  // Get edit data from params if exists
  const editData = params.medicineData
    ? (JSON.parse(params.medicineData as string) as MedicineData)
    : null;

  const [medicineData, setMedicineData] = useState<MedicineData>({
    medicineName: editData?.medicineName || "",
    dosage: editData?.dosage || "",
    medicineType: editData?.medicineType || "tablet",
    takeWithMeal: editData?.takeWithMeal || "before",
    description: editData?.description || "",
    drugAppearance: editData?.drugAppearance || null,
  });

  // Load existing medicine data for edit mode
  useEffect(() => {
    if (editMode && medicineId && user) {
      const loadMedicineData = async () => {
        try {
          console.log("Loading medicine data for edit (step 1):", medicineId);
          const medicine = await medicineService.getMedicineById(
            user.userId,
            medicineId
          );

          if (medicine) {
            console.log("Loaded medicine data (step 1):", medicine);
            console.log("Original medicineData state:", {
              medicineName: medicine.medicineName,
              dosage: medicine.dosage,
              medicineType: medicine.medicineType,
              takeWithMeal: medicine.takeWithMeal,
              description: medicine.description,
              drugAppearance: medicine.drugAppearance,
            });

            // Update medicineData with loaded data
            setMedicineData((prev) => {
              const newData = {
                ...prev,
                medicineName: medicine.medicineName || prev.medicineName,
                dosage: medicine.dosage || prev.dosage,
                medicineType: medicine.medicineType || prev.medicineType,
                takeWithMeal: medicine.takeWithMeal || prev.takeWithMeal,
                description: medicine.description || prev.description,
                drugAppearance: medicine.drugAppearance || prev.drugAppearance,
              };
              console.log("New medicineData state:", newData);
              return newData;
            });
          }
        } catch (error) {
          console.error("Error loading medicine data (step 1):", error);
        }
      };

      loadMedicineData();
    }
  }, [editMode, medicineId, user, editData]);

  const handleNext = () => {
    if (!medicineData.medicineName?.trim()) {
      Alert.alert("Error", "Please enter medicine name");
      return;
    }

    if (!medicineData.dosage?.trim()) {
      Alert.alert("Error", "Please enter dosage");
      return;
    }

    // Prepare data for step 2
    const step2Data = {
      ...medicineData,
      editMode,
      medicineId,
    };

    router.push({
      pathname: "/medicine/add-step2",
      params: {
        step1Data: JSON.stringify(step2Data),
      },
    });
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      if (!result.canceled) {
        setMedicineData((prev) => ({
          ...prev,
          drugAppearance: result.assets[0].uri,
        }));
      }
    } catch {
      Alert.alert("Error", "Failed to pick image");
    }
  };

  const renderMedicineTypeOption = (type: MedicineTypeOption) => {
    return (
      <TouchableOpacity
        key={type.id}
        style={[
          styles.typeOption,
          {
            backgroundColor:
              medicineData.medicineType === type.id
                ? colors.primary
                : colors.backgroundSecondary,
            borderColor:
              medicineData.medicineType === type.id
                ? colors.primary
                : colors.border,
          },
        ]}
        onPress={() => {
          setMedicineData((prevData) => {
            const dosageParts = prevData.dosage?.split(" ") || [];
            if (dosageParts.length > 0) {
              return {
                ...prevData,
                medicineType: type.id,
                dosage: `${dosageParts[0]} ${type.dosageUnit}`,
              };
            }
            return { ...prevData, medicineType: type.id };
          });
        }}
      >
        <Text
          style={[
            styles.typeText,
            {
              color:
                medicineData.medicineType === type.id ? "#FFFFFF" : colors.text,
            },
          ]}
        >
          {type.label}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderMealOption = (option: "before" | "after") => (
    <TouchableOpacity
      key={option}
      style={[
        styles.mealOption,
        {
          backgroundColor:
            medicineData.takeWithMeal === option
              ? colors.primary
              : colors.backgroundSecondary,
          borderColor:
            medicineData.takeWithMeal === option
              ? colors.primary
              : colors.border,
        },
      ]}
      onPress={() =>
        setMedicineData((prev) => ({ ...prev, takeWithMeal: option }))
      }
    >
      <Text
        style={[
          styles.mealText,
          {
            color:
              medicineData.takeWithMeal === option ? "#FFFFFF" : colors.text,
          },
        ]}
      >
        {option === "before" ? "Before Meals" : "After Meals"}
      </Text>
    </TouchableOpacity>
  );

  const getCurrentDosageUnit = () => {
    const selectedType = medicineTypes.find(
      (t) => t.id === medicineData.medicineType
    );
    return selectedType?.dosageUnit || "tablet";
  };

  const updateDosage = (value: string) => {
    const numericValue = value.replace(/[^0-9]/g, "");
    if (numericValue) {
      setMedicineData((prevData) => ({
        ...prevData,
        dosage: `${numericValue} ${getCurrentDosageUnit()}`,
      }));
    }
  };

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
          {editMode ? "Edit Medicine" : "Add Medicine"}
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
              style={[styles.stepActive, { backgroundColor: colors.primary }]}
            >
              <Text style={styles.stepActiveText}>1</Text>
            </View>
            <View
              style={[styles.stepLine, { backgroundColor: colors.border }]}
            />
            <View
              style={[
                styles.stepInactive,
                {
                  backgroundColor: colors.backgroundSecondary,
                  borderColor: colors.border,
                },
              ]}
            >
              <Text
                style={[
                  styles.stepInactiveText,
                  { color: colors.textSecondary },
                ]}
              >
                2
              </Text>
            </View>
          </View>

          {/* Title */}
          <View style={styles.section}>
            <Text style={[styles.title, { color: colors.text }]}>
              Medicine Information
            </Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Enter basic details of your medicine
            </Text>
          </View>

          {/* Drug Appearance (Photo Upload) */}
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <Text style={[styles.label, { color: colors.text }]}>
              Drug Appearance (Optional)
            </Text>
            <Text style={[styles.sublabel, { color: colors.textSecondary }]}>
              Add a photo to help identify your medicine
            </Text>

            <TouchableOpacity
              style={styles.imageUploadButton}
              onPress={pickImage}
            >
              {medicineData.drugAppearance ? (
                <View style={styles.imageContainer}>
                  <Image
                    source={{ uri: medicineData.drugAppearance }}
                    style={styles.uploadedImage}
                  />
                  <TouchableOpacity
                    style={styles.removeImageButton}
                    onPress={() =>
                      setMedicineData((prev) => ({
                        ...prev,
                        drugAppearance: null,
                      }))
                    }
                  >
                    <Ionicons name="close" size={16} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.imagePlaceholder}>
                  <Ionicons
                    name="camera"
                    size={32}
                    color={colors.textSecondary}
                  />
                  <Text
                    style={[
                      styles.imagePlaceholderText,
                      { color: colors.textSecondary },
                    ]}
                  >
                    Tap to add photo
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Medicine Name Input */}
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <Text style={[styles.label, { color: colors.text }]}>
              Medicine Name
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
              placeholder="Enter medicine name..."
              placeholderTextColor={colors.textSecondary}
              value={medicineData.medicineName}
              onChangeText={(text) =>
                setMedicineData((prev) => ({ ...prev, medicineName: text }))
              }
            />
          </View>

          {/* Medicine Type Selection */}
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <Text style={[styles.label, { color: colors.text }]}>
              Medicine Type
            </Text>
            <Text style={[styles.sublabel, { color: colors.textSecondary }]}>
              Select form of medicine (dosage will auto-adjust)
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.typeContainer}>
                {medicineTypes.map(renderMedicineTypeOption)}
              </View>
            </ScrollView>
          </View>

          {/* Dosage Input (Auto-adjust based on type) */}
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <Text style={[styles.label, { color: colors.text }]}>Dosage</Text>
            <Text style={[styles.sublabel, { color: colors.textSecondary }]}>
              Amount per intake (auto-adjusts by medicine type)
            </Text>
            <View style={styles.dosageContainer}>
              <TextInput
                style={[
                  styles.dosageInput,
                  {
                    backgroundColor: colors.backgroundSecondary,
                    borderColor: colors.border,
                    color: colors.text,
                  },
                ]}
                placeholder="e.g., 500, 1, 5"
                placeholderTextColor={colors.textSecondary}
                value={medicineData.dosage?.split(" ")[0] || ""}
                onChangeText={updateDosage}
                keyboardType="numeric"
                maxLength={4}
              />
              <Text
                style={[styles.dosageUnit, { color: colors.textSecondary }]}
              >
                {getCurrentDosageUnit()}
              </Text>
            </View>
          </View>

          {/* Take with Meal Selection */}
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <Text style={[styles.label, { color: colors.text }]}>
              Take with Meal
            </Text>
            <Text style={[styles.sublabel, { color: colors.textSecondary }]}>
              When should this medicine be taken?
            </Text>
            <View style={styles.mealContainer}>
              {renderMealOption("before")}
              {renderMealOption("after")}
            </View>
          </View>

          {/* Description Input */}
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <Text style={[styles.label, { color: colors.text }]}>
              Description (Optional)
            </Text>
            <Text style={[styles.sublabel, { color: colors.textSecondary }]}>
              Add special instructions or notes
            </Text>
            <TextInput
              style={[
                styles.textArea,
                {
                  backgroundColor: colors.backgroundSecondary,
                  borderColor: colors.border,
                  color: colors.text,
                },
              ]}
              placeholder="Enter any special instructions or notes..."
              placeholderTextColor={colors.textSecondary}
              value={medicineData.description}
              onChangeText={(text) =>
                setMedicineData((prev) => ({ ...prev, description: text }))
              }
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          {/* Bottom Space for Floating Button */}
          <View style={styles.bottomSpace} />
        </View>
      </ScrollView>

      {/* Floating Next Button */}
      <View
        style={[
          styles.floatingButtonContainer,
          { backgroundColor: colors.background },
        ]}
      >
        <TouchableOpacity
          style={[styles.nextButton, { backgroundColor: colors.primary }]}
          onPress={handleNext}
          activeOpacity={0.8}
        >
          <Text style={styles.nextButtonText}>Next</Text>
          <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
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
    backgroundColor: "#E5E5E7",
    position: "relative",
  },
  progressBar: {
    width: "50%",
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
  stepInactive: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  stepInactiveText: {
    fontSize: 16,
    fontWeight: "600",
  },
  section: {
    marginBottom: 24,
    alignItems: "center",
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
  imageUploadButton: {
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E5E5E7",
    borderRadius: 12,
    padding: 20,
    borderStyle: "dashed",
  },
  imageContainer: {
    position: "relative",
  },
  uploadedImage: {
    width: 120,
    height: 120,
    borderRadius: 12,
  },
  removeImageButton: {
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
  imagePlaceholder: {
    alignItems: "center",
    justifyContent: "center",
  },
  imagePlaceholderText: {
    fontSize: 14,
    marginTop: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
  },
  typeContainer: {
    flexDirection: "row",
    paddingHorizontal: 5,
  },
  typeOption: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 12,
  },
  typeText: {
    fontSize: 14,
    fontWeight: "500",
  },
  dosageContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  dosageInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    marginRight: 12,
  },
  dosageUnit: {
    fontSize: 16,
    fontWeight: "500",
  },
  mealContainer: {
    flexDirection: "row",
    gap: 12,
  },
  mealOption: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  mealText: {
    fontSize: 14,
    fontWeight: "500",
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    minHeight: 100,
  },
  bottomSpace: {
    height: 100,
  },
  floatingButtonContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: "#E5E5E7",
  },
  nextButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 28,
  },
  nextButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    marginRight: 8,
  },
});
