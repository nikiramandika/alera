import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';

interface MedicineTemplate {
  medicineName?: string;
  dosage?: string;
  medicineType?: string;
  instructions?: string;
  stockQuantity?: number;
  stockAlert?: number;
  reminderId?: string;
  editMode?: boolean;
}

export default function AddMedicineStep1Screen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const params = useLocalSearchParams();

  // Check if edit mode
  const editMode = params.editMode === 'true';
  const medicineId = params.medicineId as string;

  // Get edit data from params if exists
  const editData = params.medicineData ? JSON.parse(params.medicineData as string) as MedicineTemplate : null;

  const [medicineData, setMedicineData] = useState({
    medicineName: editData?.medicineName || '',
    dosage: editData?.dosage || '',
    medicineType: editData?.medicineType || 'Tablet',
    instructions: editData?.instructions || '',
  });

  const medicineTypes = [
    'Tablet', 'Capsule', 'Liquid', 'Injection', 'Topical', 'Inhaler', 'Drops', 'Spray'
  ];

  const handleNext = () => {
    if (!medicineData.medicineName.trim()) {
      alert('Please enter medicine name');
      return;
    }

    if (!medicineData.dosage.trim()) {
      alert('Please enter dosage');
      return;
    }

    // Prepare data for step 2
    const step2Data = {
      ...medicineData,
      ...(editData && {
        stockQuantity: editData.stockQuantity,
        stockAlert: editData.stockAlert,
        frequency: editData.frequency,
      }),
      editMode,
      medicineId,
    };

    router.push({
      pathname: '/medicine/add-step2',
      params: {
        step1Data: JSON.stringify(step2Data)
      }
    });
  };

  const renderMedicineTypeOption = (type: string) => (
    <TouchableOpacity
      key={type}
      style={[
        styles.typeOption,
        {
          backgroundColor: medicineData.medicineType === type
            ? colors.primary
            : colors.backgroundSecondary,
          borderColor: medicineData.medicineType === type
            ? colors.primary
            : colors.border,
        }
      ]}
      onPress={() => setMedicineData(prev => ({ ...prev, medicineType: type }))}
    >
      <Text style={[
        styles.typeText,
        {
          color: medicineData.medicineType === type ? '#FFFFFF' : colors.text
        }
      ]}>
        {type}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />

      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.backButton, { borderColor: colors.border, backgroundColor: colors.backgroundSecondary }]}
        >
          <Ionicons name="chevron-back" size={20} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          {editMode ? 'Edit Medicine' : 'Add Medicine'}
        </Text>
        <View style={styles.placeholder} />
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={[styles.progressBar, { backgroundColor: colors.primary }]} />
        <View style={[styles.progressBackground, { backgroundColor: colors.border }]} />
      </View>

      {/* Content */}
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Step Indicator */}
          <View style={styles.stepIndicator}>
            <View style={[styles.stepActive, { backgroundColor: colors.primary }]}>
              <Text style={styles.stepActiveText}>1</Text>
            </View>
            <View style={[styles.stepLine, { backgroundColor: colors.border }]} />
            <View style={[styles.stepInactive, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}>
              <Text style={[styles.stepInactiveText, { color: colors.textSecondary }]}>2</Text>
            </View>
          </View>

          {/* Title */}
          <View style={styles.section}>
            <Text style={[styles.title, { color: colors.text }]}>
              Medicine Information
            </Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Enter the basic details of your medicine
            </Text>
          </View>

          {/* Medicine Name Input */}
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <Text style={[styles.label, { color: colors.text }]}>Medicine Name</Text>
            <TextInput
              style={[styles.input, {
                backgroundColor: colors.backgroundSecondary,
                borderColor: colors.border,
                color: colors.text
              }]}
              placeholder="Enter medicine name..."
              placeholderTextColor={colors.textSecondary}
              value={medicineData.medicineName}
              onChangeText={(text) => setMedicineData(prev => ({ ...prev, medicineName: text }))}
            />
          </View>

          {/* Dosage Input */}
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <Text style={[styles.label, { color: colors.text }]}>Dosage</Text>
            <TextInput
              style={[styles.input, {
                backgroundColor: colors.backgroundSecondary,
                borderColor: colors.border,
                color: colors.text
              }]}
              placeholder="e.g., 500mg, 1 tablet, 5ml"
              placeholderTextColor={colors.textSecondary}
              value={medicineData.dosage}
              onChangeText={(text) => setMedicineData(prev => ({ ...prev, dosage: text }))}
            />
          </View>

          {/* Medicine Type Selection */}
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <Text style={[styles.label, { color: colors.text }]}>Medicine Type</Text>
            <Text style={[styles.sublabel, { color: colors.textSecondary }]}>
              Select the form of medicine
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.typeContainer}>
                {medicineTypes.map(renderMedicineTypeOption)}
              </View>
            </ScrollView>
          </View>

          {/* Instructions Input */}
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <Text style={[styles.label, { color: colors.text }]}>Instructions (Optional)</Text>
            <Text style={[styles.sublabel, { color: colors.textSecondary }]}>
              Add special instructions like "Take with food" or "Before meals"
            </Text>
            <TextInput
              style={[styles.textArea, {
                backgroundColor: colors.backgroundSecondary,
                borderColor: colors.border,
                color: colors.text
              }]}
              placeholder="Enter any special instructions..."
              placeholderTextColor={colors.textSecondary}
              value={medicineData.instructions}
              onChangeText={(text) => setMedicineData(prev => ({ ...prev, instructions: text }))}
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
      <View style={[styles.floatingButtonContainer, { backgroundColor: colors.background }]}>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 16,
  },
  placeholder: {
    width: 40,
  },
  progressContainer: {
    height: 3,
    backgroundColor: '#E5E5E7',
    position: 'relative',
  },
  progressBar: {
    width: '50%',
    height: '100%',
  },
  progressBackground: {
    position: 'absolute',
    right: 0,
    top: 0,
    width: '50%',
    height: '100%',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  stepActive: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepActiveText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepInactiveText: {
    fontSize: 16,
    fontWeight: '600',
  },
  section: {
    marginBottom: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  card: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
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
    fontWeight: '600',
    marginBottom: 12,
  },
  sublabel: {
    fontSize: 14,
    marginBottom: 16,
    lineHeight: 20,
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
    minHeight: 100,
  },
  typeContainer: {
    flexDirection: 'row',
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
    fontWeight: '500',
  },
  bottomSpace: {
    height: 100,
  },
  floatingButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E7',
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 28,
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
});