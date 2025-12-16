import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  StyleSheet,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Colors, Spacing, BorderRadius, Typography } from "@/constants/theme";

interface TermsAndConditionsProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
}

export default function TermsAndConditions({
  visible,
  onClose,
  title,
}: TermsAndConditionsProps) {
  const { t } = useTranslation();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  const renderTermsContent = () => (
    <ScrollView
      style={styles.termsScrollView}
      showsVerticalScrollIndicator={false}
    >
      {[1, 2, 3, 4, 5, 6, 7].map((num) => (
        <View key={num} style={styles.termsSection}>
          <Text style={[styles.termsSectionTitle, { color: colors.text }]}>
            {t(`terms.section${num}.title`)}
          </Text>
          <Text style={[styles.termsText, { color: colors.textSecondary }]}>
            {t(`terms.section${num}.content`)}
          </Text>
        </View>
      ))}
    </ScrollView>
  );

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.termsModalOverlay}>
        <View
          style={[styles.termsModalContent, { backgroundColor: colors.card }]}
        >
          {/* Header */}
          <View style={styles.termsModalHeader}>
            <Text style={[styles.termsModalTitle, { color: colors.text }]}>
              {title ?? t("terms.title")}
            </Text>
            <TouchableOpacity
              style={styles.termsModalCloseButton}
              onPress={onClose}
            >
              <Ionicons name="close" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Content */}
          {renderTermsContent()}

          {/* Accept Button */}
          <TouchableOpacity
            style={[
              styles.termsCloseButton,
              { backgroundColor: colors.primary },
            ]}
            onPress={onClose}
          >
            <Text style={styles.termsCloseButtonText}>
              {t("terms.acceptButton")}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

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
    ),
  };
};

const styles = StyleSheet.create({
  termsModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  termsModalContent: {
    width: "90%",
    maxHeight: "80%",
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.25,
        shadowRadius: 20,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  termsModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  termsModalTitle: {
    ...Typography.h3,
    fontSize: 18,
    fontWeight: "600",
  },
  termsModalCloseButton: {
    padding: Spacing.xs,
  },
  termsScrollView: {
    maxHeight: 420,
  },
  termsSection: {
    marginBottom: Spacing.lg,
  },
  termsSectionTitle: {
    ...Typography.h3,
    fontSize: 16,
    fontWeight: "600",
    marginBottom: Spacing.sm,
  },
  termsText: {
    ...Typography.body,
    fontSize: 14,
    lineHeight: 20,
  },
  termsCloseButton: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    marginTop: Spacing.md,
  },
  termsCloseButtonText: {
    ...Typography.body,
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
});
