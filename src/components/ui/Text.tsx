import React from 'react';
import { Text as RNText, TextStyle, StyleSheet } from 'react-native';
import { Colors } from '@/constants/colors';
import { Typography } from '@/constants/theme';

type TextVariant = 'h1' | 'h2' | 'h3' | 'h4' | 'body' | 'caption' | 'label' | 'button';
type TextWeight = 'light' | 'regular' | 'medium' | 'semibold' | 'bold' | 'extrabold' | 'black';
type TextColor = 'primary' | 'secondary' | 'tertiary' | 'disabled' | 'inverse' | 'white' | 'accent' | 'success';

interface TextProps {
  variant?: TextVariant;
  weight?: TextWeight;
  color?: TextColor;
  center?: boolean;
  uppercase?: boolean;
  gradient?: boolean;
  numberOfLines?: number;
  style?: TextStyle | TextStyle[];
  children: React.ReactNode;
}

export const Text: React.FC<TextProps> = ({
  variant = 'body',
  weight = 'regular',
  color = 'primary',
  center = false,
  uppercase = false,
  numberOfLines,
  style,
  children,
}) => {
  const textStyle = [
    styles.base,
    styles[variant],
    styles[`weight_${weight}`],
    styles[`color_${color}`],
    center && styles.center,
    uppercase && styles.uppercase,
    style,
  ];

  return (
    <RNText style={textStyle} numberOfLines={numberOfLines}>
      {children}
    </RNText>
  );
};

const styles = StyleSheet.create({
  base: {
    color: Colors.text.primary,
    fontFamily: Typography.fontFamily.default,
  },

  // Variants
  h1: {
    fontSize: Typography.fontSize['4xl'],
    lineHeight: Typography.fontSize['4xl'] * Typography.lineHeight.tight,
    fontWeight: Typography.fontWeight.black,
    letterSpacing: Typography.letterSpacing.tight,
  },
  h2: {
    fontSize: Typography.fontSize['3xl'],
    lineHeight: Typography.fontSize['3xl'] * Typography.lineHeight.tight,
    fontWeight: Typography.fontWeight.bold,
    letterSpacing: Typography.letterSpacing.tight,
  },
  h3: {
    fontSize: Typography.fontSize['2xl'],
    lineHeight: Typography.fontSize['2xl'] * Typography.lineHeight.snug,
    fontWeight: Typography.fontWeight.bold,
  },
  h4: {
    fontSize: Typography.fontSize.xl,
    lineHeight: Typography.fontSize.xl * Typography.lineHeight.snug,
    fontWeight: Typography.fontWeight.semibold,
  },
  body: {
    fontSize: Typography.fontSize.base,
    lineHeight: Typography.fontSize.base * Typography.lineHeight.normal,
    fontWeight: Typography.fontWeight.regular,
  },
  caption: {
    fontSize: Typography.fontSize.sm,
    lineHeight: Typography.fontSize.sm * Typography.lineHeight.normal,
    fontWeight: Typography.fontWeight.regular,
  },
  label: {
    fontSize: Typography.fontSize.xs,
    lineHeight: Typography.fontSize.xs * Typography.lineHeight.snug,
    fontWeight: Typography.fontWeight.medium,
    textTransform: 'uppercase',
    letterSpacing: Typography.letterSpacing.wide,
  },
  button: {
    fontSize: Typography.fontSize.md,
    lineHeight: Typography.fontSize.md * Typography.lineHeight.tight,
    fontWeight: Typography.fontWeight.semibold,
  },

  // Weights
  weight_light: { fontWeight: Typography.fontWeight.light },
  weight_regular: { fontWeight: Typography.fontWeight.regular },
  weight_medium: { fontWeight: Typography.fontWeight.medium },
  weight_semibold: { fontWeight: Typography.fontWeight.semibold },
  weight_bold: { fontWeight: Typography.fontWeight.bold },
  weight_extrabold: { fontWeight: Typography.fontWeight.extrabold },
  weight_black: { fontWeight: Typography.fontWeight.black },

  // Colors
  color_primary: { color: Colors.text.primary },
  color_secondary: { color: Colors.text.secondary },
  color_tertiary: { color: Colors.text.tertiary },
  color_disabled: { color: Colors.text.disabled },
  color_inverse: { color: Colors.text.inverse },
  color_white: { color: Colors.white },
  color_accent: { color: Colors.primary },
  color_success: { color: Colors.success },

  // Modifiers
  center: {
    textAlign: 'center',
  },
  uppercase: {
    textTransform: 'uppercase',
  },
});
