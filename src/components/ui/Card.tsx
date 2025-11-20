import React from 'react';
import { View, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { Colors } from '@/constants/colors';
import { Spacing, BorderRadius, Shadows, GlassStyles } from '@/constants/theme';

type CardVariant = 'default' | 'glass' | 'elevated';

interface CardProps {
  children: React.ReactNode;
  variant?: CardVariant;
  onPress?: () => void;
  style?: ViewStyle;
  padding?: keyof typeof Spacing;
  noPadding?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  onPress,
  style,
  padding = 'lg',
  noPadding = false,
}) => {
  const cardStyle = [
    styles.base,
    styles[variant],
    !noPadding && { padding: Spacing[padding] },
    style,
  ];

  if (variant === 'glass') {
    const content = (
      <View style={[styles.glassCard, cardStyle]}>
        <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
        <View style={styles.glassContent}>{children}</View>
      </View>
    );

    if (onPress) {
      return (
        <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
          {content}
        </TouchableOpacity>
      );
    }

    return content;
  }

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.9} style={cardStyle}>
        {children}
      </TouchableOpacity>
    );
  }

  return <View style={cardStyle}>{children}</View>;
};

const styles = StyleSheet.create({
  base: {
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  default: {
    backgroundColor: Colors.card,
  },
  glass: {
    ...GlassStyles.card,
  },
  glassCard: {
    position: 'relative',
  },
  glassContent: {
    position: 'relative',
    zIndex: 1,
  },
  elevated: {
    backgroundColor: Colors.card,
    ...Shadows.md,
  },
});
