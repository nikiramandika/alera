import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';

export default function HabitCategoryScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const habitCategories = [
    {
      id: 'water',
      name: 'Minum Air',
      description: '8 gelas per hari untuk hidrasi optimal',
      icon: 'water-outline',
      color: '#3498db',
      defaults: {
        habitName: 'Minum Air',
        category: 'water',
        target: { value: 8, unit: 'gelas', frequency: 'daily' },
        reminderTimes: ['08:00', '10:00', '14:00', '16:00', '18:00', '20:00'],
        reminderDays: [0, 1, 2, 3, 4, 5, 6],
        color: '#3498db',
        icon: 'water-outline',
        description: 'Tetap terhidrasi sepanjang hari dengan minum 8 gelas air'
      }
    },
    {
      id: 'exercise',
      name: 'Olahraga',
      description: '30 menit aktivitas fisik setiap hari',
      icon: 'fitness-outline',
      color: '#e74c3c',
      defaults: {
        habitName: 'Olahraga Pagi',
        category: 'exercise',
        target: { value: 30, unit: 'menit', frequency: 'daily' },
        reminderTimes: ['07:00'],
        reminderDays: [0, 2, 4], // Senin, Rabu, Jumat
        color: '#e74c3c',
        icon: 'fitness-outline',
        description: 'Jaga kebugaran tubuh dengan olahraga teratur'
      }
    },
    {
      id: 'sleep',
      name: 'Tidur Cukup',
      description: '8 jam tidur berkualitas setiap malam',
      icon: 'moon-outline',
      color: '#9b59b6',
      defaults: {
        habitName: 'Tidur Cukup',
        category: 'sleep',
        target: { value: 8, unit: 'jam', frequency: 'daily' },
        reminderTimes: ['22:00'],
        reminderDays: [0, 1, 2, 3, 4, 5, 6],
        color: '#9b59b6',
        icon: 'moon-outline',
        description: 'Dapatkan tidur berkualitas untuk recovery otak dan tubuh'
      }
    },
    {
      id: 'meditation',
      name: 'Meditasi',
      description: '15 menit mindfulness untuk reduksi stres',
      icon: 'leaf-outline',
      color: '#2ecc71',
      defaults: {
        habitName: 'Meditasi Pagi',
        category: 'meditation',
        target: { value: 15, unit: 'menit', frequency: 'daily' },
        reminderTimes: ['06:00'],
        reminderDays: [0, 1, 2, 3, 4, 5, 6],
        color: '#2ecc71',
        icon: 'leaf-outline',
        description: 'Praktik mindfulness untuk mengurangi stres dan meningkatkan fokus'
      }
    },
    {
      id: 'reading',
      name: 'Membaca',
      description: '20 halaman buku setiap hari',
      icon: 'book-outline',
      color: '#f39c12',
      defaults: {
        habitName: 'Membaca Buku',
        category: 'reading',
        target: { value: 20, unit: 'halaman', frequency: 'daily' },
        reminderTimes: ['21:00'],
        reminderDays: [0, 1, 2, 3, 4, 5, 6],
        color: '#f39c12',
        icon: 'book-outline',
        description: 'Tingkatkan pengetahuan dengan membaca buku secara rutin'
      }
    },
    {
      id: 'health',
      name: 'Kesehatan',
      description: 'Cek kesehatan dan kebugaran',
      icon: 'heart-outline',
      color: '#e91e63',
      defaults: {
        habitName: 'Cek Kesehatan',
        category: 'health',
        target: { value: 1, unit: 'kali', frequency: 'weekly' },
        reminderTimes: ['09:00'],
        reminderDays: [0], // Minggu
        color: '#e91e63',
        icon: 'heart-outline',
        description: 'Pantau kondisi kesehatan secara berkala'
      }
    },
  ];

  const handleCategorySelect = (category: typeof habitCategories[0]) => {
    // Navigate to create-step1 screen with pre-filled data
    router.push({
      pathname: '/habits/create-step1',
      params: {
        template: JSON.stringify(category.defaults)
      }
    });
  };

  const handleCustomHabit = () => {
    // Navigate to create-step1 screen without template (empty form)
    router.push('/habits/create-step1');
  };

  const renderCategoryCard = (category: typeof habitCategories[0]) => (
    <TouchableOpacity
      key={category.id}
      style={[styles.categoryCard, { backgroundColor: colors.card }]}
      onPress={() => handleCategorySelect(category)}
      activeOpacity={0.8}
    >
      <View style={[styles.cardHeader, { borderBottomColor: colors.border }]}>
        <View style={[styles.iconContainer, { backgroundColor: category.color + '20' }]}>
          <Ionicons name={category.icon} size={32} color={category.color} />
        </View>
        <View style={styles.headerInfo}>
          <Text style={[styles.categoryName, { color: colors.text }]}>
            {category.name}
          </Text>
          <Text style={[styles.categoryDescription, { color: colors.textSecondary }]}>
            {category.description}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
      </View>

      <View style={styles.quickInfo}>
        <View style={styles.infoItem}>
          <Ionicons name="target-outline" size={16} color={colors.textSecondary} />
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>
            {category.defaults.target.value} {category.defaults.target.unit} per {category.defaults.target.frequency === 'daily' ? 'hari' : category.defaults.target.frequency === 'weekly' ? 'minggu' : 'bulan'}
          </Text>
        </View>
        <View style={styles.infoItem}>
          <Ionicons name="notifications-outline" size={16} color={colors.textSecondary} />
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>
            {category.defaults.reminderTimes.length} pengingat
          </Text>
        </View>
        <View style={styles.infoItem}>
          <Ionicons name="calendar-outline" size={16} color={colors.textSecondary} />
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>
            {category.defaults.reminderDays.length} hari
          </Text>
        </View>
      </View>
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
          Pilih Kategori Kebiasaan
        </Text>
        <View style={styles.placeholder} />
      </View>

      {/* Content */}
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Description */}
          <View style={styles.introSection}>
            <Text style={[styles.introTitle, { color: colors.text }]}>
              Mulai Kebiasaan Baru
            </Text>
            <Text style={[styles.introDescription, { color: colors.textSecondary }]}>
              Pilih kategori kebiasaan yang sudah disiapkan atau buat kebiasaan kustom sesuai kebutuhanmu
            </Text>
          </View>

          {/* Predefined Categories */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Kategori Tersedia
            </Text>
            {habitCategories.map(renderCategoryCard)}
          </View>

          {/* Custom Option */}
          <View style={styles.section}>
            <TouchableOpacity
              style={[styles.categoryCard, { backgroundColor: colors.card }]}
              onPress={handleCustomHabit}
              activeOpacity={0.8}
            >
              <View style={[styles.cardHeader, { borderBottomColor: colors.border }]}>
                <View style={[styles.iconContainer, { backgroundColor: colors.primary + '20' }]}>
                  <Ionicons name="star-outline" size={32} color={colors.primary} />
                </View>
                <View style={styles.headerInfo}>
                  <Text style={[styles.categoryName, { color: colors.text }]}>
                    Buat Kebiasaan Kustom
                  </Text>
                  <Text style={[styles.categoryDescription, { color: colors.textSecondary }]}>
                    Desain kebiasaan baru sesuai dengan kebutuhan pribadi
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
              </View>

              <View style={styles.quickInfo}>
                <View style={styles.infoItem}>
                  <Ionicons name="create-outline" size={16} color={colors.textSecondary} />
                  <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                    Nama bebas
                  </Text>
                </View>
                <View style={styles.infoItem}>
                  <Ionicons name="target-outline" size={16} color={colors.textSecondary} />
                  <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                    Target kustom
                  </Text>
                </View>
                <View style={styles.infoItem}>
                  <Ionicons name="notifications-outline" size={16} color={colors.textSecondary} />
                  <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                    Pengingat fleksibel
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          </View>

          {/* Footer Space */}
          <View style={styles.footerSpace} />
        </View>
      </ScrollView>
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
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  introSection: {
    marginBottom: 32,
    alignItems: 'center',
  },
  introTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  introDescription: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  categoryCard: {
    borderRadius: 16,
    marginBottom: 12,
    overflow: 'hidden',
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
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  headerInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  categoryDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  quickInfo: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 16,
    backgroundColor: 'rgba(0,0,0,0.02)',
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoText: {
    fontSize: 12,
    marginLeft: 4,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureText: {
    fontSize: 14,
    marginLeft: 8,
  },
  footerSpace: {
    height: 20,
  },
});