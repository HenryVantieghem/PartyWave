/**
 * THE HANGOUT - ENHANCED DESIGN SYSTEM
 * Complete design tokens for the sickest party app
 */

import { Colors, Gradients } from './colors';

// Spacing System (8px base grid)
export const Spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  '2xl': 32,
  '3xl': 40,
  '4xl': 48,
  '5xl': 64,
  '6xl': 80,
} as const;

// Border Radius System
export const BorderRadius = {
  none: 0,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
  full: 9999,
} as const;

// Typography System (iOS native fonts)
export const Typography = {
  fontSize: {
    xs: 11,
    sm: 13,
    base: 15,
    md: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 28,
    '4xl': 32,
    '5xl': 40,
    '6xl': 48,
    '7xl': 60,
    '8xl': 72,
  },
  fontWeight: {
    light: '300' as const,
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
    extrabold: '800' as const,
    black: '900' as const,
  },
  lineHeight: {
    tight: 1.2,
    snug: 1.375,
    normal: 1.5,
    relaxed: 1.625,
    loose: 2,
  },
  letterSpacing: {
    tighter: -0.8,
    tight: -0.4,
    normal: 0,
    wide: 0.4,
    wider: 0.8,
    widest: 1.6,
  },
  fontFamily: {
    default: 'System',
    rounded: 'System', // SF Pro Rounded
    mono: 'Menlo',
  },
} as const;

// Shadow System (with glow effects)
export const Shadows = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  xs: {
    shadowColor: Colors.shadow.dark,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  sm: {
    shadowColor: Colors.shadow.dark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: Colors.shadow.dark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: Colors.shadow.dark,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  xl: {
    shadowColor: Colors.shadow.dark,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 12,
  },
  // Colored glow shadows
  glow: {
    primary: {
      shadowColor: Colors.shadow.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.5,
      shadowRadius: 16,
      elevation: 8,
    },
    secondary: {
      shadowColor: Colors.shadow.secondary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.5,
      shadowRadius: 16,
      elevation: 8,
    },
    live: {
      shadowColor: Colors.live,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.6,
      shadowRadius: 12,
      elevation: 6,
    },
  },
} as const;

// Animation System (Spring Physics)
export const Animation = {
  // Duration (milliseconds)
  duration: {
    instant: 0,
    fast: 150,
    normal: 250,
    slow: 350,
    slower: 500,
    slowest: 1000,
  },
  // Easing functions
  easing: {
    linear: 'linear',
    ease: 'ease',
    easeIn: 'ease-in',
    easeOut: 'ease-out',
    easeInOut: 'ease-in-out',
  },
  // Spring configs (for Reanimated)
  spring: {
    // Bouncy (for playful interactions)
    bouncy: {
      damping: 15,
      stiffness: 150,
      mass: 1,
    },
    // Snappy (for quick responses)
    snappy: {
      damping: 20,
      stiffness: 300,
      mass: 0.8,
    },
    // Smooth (for elegant transitions)
    smooth: {
      damping: 25,
      stiffness: 200,
      mass: 1,
    },
    // Gentle (for subtle movements)
    gentle: {
      damping: 30,
      stiffness: 100,
      mass: 1.2,
    },
  },
  // Scale values
  scale: {
    press: 0.95,
    hover: 1.05,
    active: 0.98,
  },
  // Stagger delays (for list animations)
  stagger: {
    fast: 30,
    normal: 50,
    slow: 100,
  },
} as const;

// Layout System
export const Layout = {
  screenPadding: Spacing.base,
  screenPaddingHorizontal: Spacing.lg,
  screenPaddingVertical: Spacing.xl,
  cardPadding: Spacing.lg,
  sectionSpacing: Spacing['2xl'],
  itemSpacing: Spacing.md,
  containerMaxWidth: 600,
  headerHeight: 60,
  tabBarHeight: 85,
  buttonHeight: {
    small: 36,
    medium: 48,
    large: 56,
  },
  inputHeight: 52,
  avatarSize: {
    xs: 24,
    sm: 32,
    md: 48,
    lg: 64,
    xl: 96,
    '2xl': 128,
  },
  iconSize: {
    xs: 16,
    sm: 20,
    md: 24,
    lg: 32,
    xl: 40,
  },
  minTapTarget: 44, // iOS HIG minimum
} as const;

// Glassmorphism Styles
export const GlassStyles = {
  card: {
    backgroundColor: Colors.glass.background,
    borderWidth: 1,
    borderColor: Colors.glass.border,
    overflow: 'hidden' as const,
  },
  intense: {
    backgroundColor: 'rgba(26, 26, 26, 0.9)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    overflow: 'hidden' as const,
  },
  light: {
    backgroundColor: 'rgba(26, 26, 26, 0.5)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden' as const,
  },
} as const;

// Haptic Feedback Types
export const HapticFeedback = {
  light: 'light' as const,
  medium: 'medium' as const,
  heavy: 'heavy' as const,
  success: 'notificationSuccess' as const,
  warning: 'notificationWarning' as const,
  error: 'notificationError' as const,
  selection: 'selection' as const,
} as const;

// Z-Index System
export const ZIndex = {
  base: 0,
  dropdown: 100,
  sticky: 200,
  fixed: 300,
  modal: 400,
  popover: 500,
  toast: 600,
  tooltip: 700,
  overlay: 800,
  max: 9999,
} as const;

// Complete Theme Export
export const Theme = {
  colors: Colors,
  gradients: Gradients,
  spacing: Spacing,
  borderRadius: BorderRadius,
  typography: Typography,
  shadows: Shadows,
  animation: Animation,
  layout: Layout,
  glass: GlassStyles,
  haptic: HapticFeedback,
  zIndex: ZIndex,
} as const;

export type ThemeType = typeof Theme;
export type SpacingKey = keyof typeof Spacing;
export type BorderRadiusKey = keyof typeof BorderRadius;
export type FontSizeKey = keyof typeof Typography.fontSize;
export type FontWeightKey = keyof typeof Typography.fontWeight;
