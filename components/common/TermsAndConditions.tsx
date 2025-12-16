import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  StyleSheet,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, Spacing, BorderRadius, Typography } from '@/constants/theme';

interface TermsAndConditionsProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
}

export default function TermsAndConditions({
  visible,
  onClose,
  title = 'Terms & Conditions'
}: TermsAndConditionsProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const renderTermsContent = () => (
    <ScrollView style={styles.termsScrollView} showsVerticalScrollIndicator={false}>
      <View style={styles.termsSection}>
        <Text style={[styles.termsSectionTitle, { color: colors.text }]}>
          Petunjuk Pengisian Terms & Conditions
        </Text>
        <Text style={[styles.termsText, { color: colors.textSecondary }]}>
          Untuk mengisi Terms & Conditions, Anda perlu mempertimbangkan hal-hal berikut:
        </Text>

        <View style={styles.termsList}>
          <Text style={[styles.termsListItem, { color: colors.textSecondary }]}>
            • Kebijakan privasi dan penggunaan data pengguna
          </Text>
          <Text style={[styles.termsListItem, { color: colors.textSecondary }]}>
            • Batasan tanggung jawab aplikasi
          </Text>
          <Text style={[styles.termsListItem, { color: colors.textSecondary }]}>
            • Ketentuan penggunaan fitur-fitur aplikasi
          </Text>
          <Text style={[styles.termsListItem, { color: colors.textSecondary }]}>
            • Kebijakan pembatalan dan pengembalian dana (jika ada)
          </Text>
          <Text style={[styles.termsListItem, { color: colors.textSecondary }]}>
            • Hak cipta dan kepemilikan intelektual
          </Text>
          <Text style={[styles.termsListItem, { color: colors.textSecondary }]}>
            • Perubahan terms & conditions di masa depan
          </Text>
          <Text style={[styles.termsListItem, { color: colors.textSecondary }]}>
            • Cara menghubungi developer/support
          </Text>
        </View>
      </View>

      <View style={styles.termsSection}>
        <Text style={[styles.termsSectionTitle, { color: colors.text }]}>
          Contoh Struktur:
        </Text>
        <Text style={[styles.termsText, { color: colors.textSecondary }]}>
          1. Pengantar dan Penerimaan Syarat
        </Text>
        <Text style={[styles.termsText, { color: colors.textSecondary }]}>
          2. Deskripsi Layanan
        </Text>
        <Text style={[styles.termsText, { color: colors.textSecondary }]}>
          3. Kewajiban Pengguna
        </Text>
        <Text style={[styles.termsText, { color: colors.textSecondary }]}>
          4. Kebijakan Privasi
        </Text>
        <Text style={[styles.termsText, { color: colors.textSecondary }]}>
          5. Batasan Tanggung Jawab
        </Text>
        <Text style={[styles.termsText, { color: colors.textSecondary }]}>
          6. Perubahan Syarat dan Ketentuan
        </Text>
      </View>

      <View style={styles.termsSection}>
        <Text style={[styles.termsSectionTitle, { color: colors.text }]}>
          Contoh Template:
        </Text>
        <Text style={[styles.termsText, { color: colors.textSecondary }]}>
          <Text style={{ fontWeight: '600' }}>1. Penerimaan Syarat</Text>
          {'\n'}Dengan menggunakan aplikasi Alera, Anda setuju untuk terikat oleh syarat dan ketentuan ini.
        </Text>
        <Text style={[styles.termsText, { color: colors.textSecondary }]}>
          <Text style={{ fontWeight: '600' }}>2. Penggunaan Layanan</Text>
          {'\n'}Aplikasi Alera menyediakan layanan pengingat obat, pelacakan kebiasaan, dan manajemen kesehatan.
        </Text>
        <Text style={[styles.termsText, { color: colors.textSecondary }]}>
          <Text style={{ fontWeight: '600' }}>3. Privasi Data</Text>
          {'\n'}Kami melindungi data pribadi Anda sesuai dengan kebijakan privasi yang berlaku.
        </Text>
      </View>

      <View style={styles.termsNote}>
        <Text style={[styles.termsNoteText, { color: colors.textSecondary }]}>
          Catatan: Edit konten ini di components/common/TermsAndConditions.tsx
        </Text>
      </View>
    </ScrollView>
  );

  return (
    <Modal
      transparent={true}
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.termsModalOverlay}>
        <View style={[styles.termsModalContent, { backgroundColor: colors.card }]}>
          <View style={styles.termsModalHeader}>
            <Text style={[styles.termsModalTitle, { color: colors.text }]}>
              {title}
            </Text>
            <TouchableOpacity
              style={styles.termsModalCloseButton}
              onPress={onClose}
            >
              <Ionicons name="close" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {renderTermsContent()}

          <TouchableOpacity
            style={[styles.termsCloseButton, { backgroundColor: colors.primary }]}
            onPress={onClose}
          >
            <Text style={styles.termsCloseButtonText}>Tutup</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// Export function untuk menampilkan Terms & Conditions
export const useTermsAndConditions = () => {
  const [visible, setVisible] = React.useState(false);

  const showTerms = () => setVisible(true);
  const hideTerms = () => setVisible(false);

  return {
    visible,
    showTerms,
    hideTerms,
    TermsModal: () => (
      <TermsAndConditions visible={visible} onClose={hideTerms} />
    )
  };
};

const styles = StyleSheet.create({
  termsModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  termsModalContent: {
    width: '90%',
    maxHeight: '80%',
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.25,
        shadowRadius: 20,
      },
      android: {
        elevation: 10,
      }
    })
  },
  termsModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  termsModalTitle: {
    ...Typography.h3,
    fontSize: 18,
    fontWeight: '600',
  },
  termsModalCloseButton: {
    padding: Spacing.xs,
  },
  termsScrollView: {
    maxHeight: 400,
  },
  termsSection: {
    marginBottom: Spacing.lg,
  },
  termsSectionTitle: {
    ...Typography.h3,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  termsText: {
    ...Typography.body,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: Spacing.xs,
  },
  termsList: {
    marginVertical: Spacing.sm,
  },
  termsListItem: {
    ...Typography.body,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: Spacing.xs,
    paddingLeft: Spacing.sm,
  },
  termsNote: {
    backgroundColor: '#F0F0F0',
    padding: Spacing.sm,
    borderRadius: BorderRadius.sm,
    marginTop: Spacing.md,
  },
  termsNoteText: {
    ...Typography.caption,
    fontSize: 12,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  termsCloseButton: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  termsCloseButtonText: {
    ...Typography.body,
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});