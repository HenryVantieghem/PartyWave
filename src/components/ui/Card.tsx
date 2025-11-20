import React from 'react';
import { View, StyleSheet, TouchableOpacity, ViewStyle, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/constants/colors';
import { Spacing, BorderRadius, Shadows } from '@/constants/theme';

type CardVariant = 'default' | 'glass' | 'elevated' | 'liquid';

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

  if (variant === 'glass' || variant === 'liquid') {
    const intensity = variant === 'liquid' ? 95 : 20;
    const content = (
      <View style={[styles.glassCard, cardStyle]}>
        {/* Liquid Glass Background */}
        <BlurView 
          intensity={intensity} 
          tint="dark" 
          style={StyleSheet.absoluteFill}
        />
        {/* Subtle gradient overlay for liquid effect */}
        <LinearGradient
          colors={['rgba(255, 255, 255, 0.08)', 'transparent', 'rgba(255, 255, 255, 0.03)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        {/* Border glow effect */}
        <View style={styles.glassBorder} />
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
    backgroundColor: 'rgba(26, 26, 26, 0.4)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  liquid: {
    backgroundColor: 'rgba(26, 26, 26, 0.3)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    ...Shadows.md,
  },
  glassCard: {
    position: 'relative',
  },
  glassBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    pointerEvents: 'none',
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
