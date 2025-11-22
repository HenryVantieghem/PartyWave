import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, ViewStyle, Pressable } from 'react-native';
import { colors } from '@/constants/colors';
import * as Haptics from 'expo-haptics';

interface MorphingCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  morphDuration?: number;
  morphScale?: number;
  onPress?: () => void;
  enableHaptics?: boolean;
}

/**
 * Morphing Card Component
 * Fluid card with morph animations and hover effects
 */
export function MorphingCard({
  children,
  style,
  morphDuration = 200,
  morphScale = 0.98,
  onPress,
  enableHaptics = true,
}: MorphingCardProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const shadowAnim = useRef(new Animated.Value(0)).current;

  const handlePressIn = () => {
    if (enableHaptics) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: morphScale,
        useNativeDriver: true,
        speed: 50,
        bounciness: 4,
      }),
      Animated.timing(shadowAnim, {
        toValue: 1,
        duration: morphDuration,
        useNativeDriver: false,
      }),
    ]).start();
  };

  const handlePressOut = () => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        speed: 50,
        bounciness: 8,
      }),
      Animated.timing(shadowAnim, {
        toValue: 0,
        duration: morphDuration,
        useNativeDriver: false,
      }),
    ]).start();
  };

  const animatedShadowOpacity = shadowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.6],
  });

  const animatedShadowRadius = shadowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [8, 16],
  });

  return (
    <Pressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={onPress}
      disabled={!onPress}
    >
      <Animated.View
        style={[
          styles.card,
          style,
          {
            transform: [{ scale: scaleAnim }],
            shadowOpacity: animatedShadowOpacity,
            shadowRadius: animatedShadowRadius,
          },
        ]}
      >
        {children}
      </Animated.View>
    </Pressable>
  );
}

interface ExpandingCardProps {
  children: React.ReactNode;
  isExpanded: boolean;
  expandedHeight?: number;
  collapsedHeight?: number;
  duration?: number;
  style?: ViewStyle;
}

/**
 * Expanding Card Component
 * Card that smoothly expands and collapses
 */
export function ExpandingCard({
  children,
  isExpanded,
  expandedHeight = 400,
  collapsedHeight = 120,
  duration = 300,
  style,
}: ExpandingCardProps) {
  const heightAnim = useRef(new Animated.Value(collapsedHeight)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(heightAnim, {
        toValue: isExpanded ? expandedHeight : collapsedHeight,
        useNativeDriver: false,
        speed: 12,
        bounciness: 8,
      }),
      Animated.timing(opacityAnim, {
        toValue: isExpanded ? 1 : 0,
        duration: duration,
        useNativeDriver: true,
      }),
    ]).start();
  }, [isExpanded]);

  return (
    <Animated.View
      style={[
        styles.card,
        style,
        {
          height: heightAnim,
          overflow: 'hidden',
        },
      ]}
    >
      <View style={styles.cardContent}>
        <Animated.View style={{ opacity: opacityAnim }}>{children}</Animated.View>
      </View>
    </Animated.View>
  );
}

interface FlipCardProps {
  frontContent: React.ReactNode;
  backContent: React.ReactNode;
  isFlipped: boolean;
  flipDuration?: number;
  style?: ViewStyle;
}

/**
 * Flip Card Component
 * Card that flips to reveal back content
 */
export function FlipCard({
  frontContent,
  backContent,
  isFlipped,
  flipDuration = 600,
  style,
}: FlipCardProps) {
  const flipAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(flipAnim, {
      toValue: isFlipped ? 180 : 0,
      useNativeDriver: true,
      speed: 10,
      bounciness: 4,
    }).start();
  }, [isFlipped]);

  const frontInterpolate = flipAnim.interpolate({
    inputRange: [0, 180],
    outputRange: ['0deg', '180deg'],
  });

  const backInterpolate = flipAnim.interpolate({
    inputRange: [0, 180],
    outputRange: ['180deg', '360deg'],
  });

  const frontOpacity = flipAnim.interpolate({
    inputRange: [0, 90, 180],
    outputRange: [1, 0, 0],
  });

  const backOpacity = flipAnim.interpolate({
    inputRange: [0, 90, 180],
    outputRange: [0, 0, 1],
  });

  return (
    <View style={[styles.flipContainer, style]}>
      <Animated.View
        style={[
          styles.flipCard,
          styles.flipCardFront,
          {
            transform: [{ rotateY: frontInterpolate }],
            opacity: frontOpacity,
          },
        ]}
      >
        {frontContent}
      </Animated.View>
      <Animated.View
        style={[
          styles.flipCard,
          styles.flipCardBack,
          {
            transform: [{ rotateY: backInterpolate }],
            opacity: backOpacity,
          },
        ]}
      >
        {backContent}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 20,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  cardContent: {
    flex: 1,
  },
  flipContainer: {
    position: 'relative',
  },
  flipCard: {
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 20,
    backfaceVisibility: 'hidden',
  },
  flipCardFront: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  flipCardBack: {
    width: '100%',
    height: '100%',
  },
});
