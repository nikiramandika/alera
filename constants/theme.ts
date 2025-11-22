/**
 * Enhanced theme for Alera app with dark mode support and iOS design system
 */

import { Platform } from 'react-native';

// Alera brand colors
const aleraPrimary = '#84CC16';
const aleraSecondary = '#FFFFFF';
const aleraAccent = '#84CC16';
const aleraSuccess = '#22C55E';

export const Colors = {
  light: {
    // Brand colors
    primary: aleraPrimary,
    secondary: aleraSecondary,
    accent: aleraAccent,
    success: aleraSuccess,

    // UI colors
    text: '#11181C',
    textSecondary: '#666',
    background: '#FFFFFF',
    backgroundSecondary: '#F8F9FA',
    card: '#FFFFFF',
    border: '#E5E5E7',
    tint: aleraPrimary,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: aleraPrimary,

    // Swift UI specific colors
    label: '#11181C',
    secondaryLabel: '#666',
    tertiaryLabel: '#999',
    quaternaryLabel: '#CCC',
    systemBackground: '#FFFFFF',
    secondarySystemBackground: '#F8F9FA',
    tertiarySystemBackground: '#FFFFFF',
    separator: '#E5E5E7',
    opaqueSeparator: '#C6C6C8',
    link: aleraPrimary,

    // Gradient colors
    gradientStart: '#F0FDF4',
    gradientEnd: '#FFFFFF',

    // Shadow colors
    shadow: '#00000010',
    shadowDark: '#00000020',
  },
  dark: {
    // Brand colors (slightly adjusted for dark mode)
    primary: '#84CC16',
    secondary: '#FFFFFF',
    accent: '#84CC16',
    success: '#22C55E',

    // UI colors
    text: '#ECEDEE',
    textSecondary: '#9BAfA6',
    background: '#1C1C1E',
    backgroundSecondary: '#2C2C2E',
    card: '#2C2C2E',
    border: '#38383A',
    tint: '#FFFFFF',
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: '#FFFFFF',

    // Swift UI specific colors
    label: '#ECEDEE',
    secondaryLabel: '#9BA1A6',
    tertiaryLabel: '#636366',
    quaternaryLabel: '#48484A',
    systemBackground: '#1C1C1E',
    secondarySystemBackground: '#2C2C2E',
    tertiarySystemBackground: '#3A3A3C',
    separator: '#38383A',
    opaqueSeparator: '#545458',
    link: '#84CC16',

    // Gradient colors
    gradientStart: '#14532D',
    gradientEnd: '#1C1C1E',

    // Shadow colors
    shadow: '#FFFFFF10',
    shadowDark: '#FFFFFF20',
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const BorderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 9999,
};

export const Typography = {
  h1: { fontSize: 32, fontWeight: '700' as const },
  h2: { fontSize: 24, fontWeight: '600' as const },
  h3: { fontSize: 20, fontWeight: '600' as const },
  h4: { fontSize: 18, fontWeight: '600' as const },
  body: { fontSize: 16, fontWeight: '400' as const },
  caption: { fontSize: 14, fontWeight: '400' as const },
  small: { fontSize: 12, fontWeight: '400' as const },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
