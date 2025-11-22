import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface AnimatedGradientProps {
  colors: string[][];
  duration?: number;
  style?: ViewStyle;
  children?: React.ReactNode;
}

export function AnimatedGradient({ colors, duration = 3000, style, children }: AnimatedGradientProps) {
  const colorIndex = useRef(0);
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animate = () => {
      colorIndex.current = (colorIndex.current + 1) % colors.length;

      Animated.timing(animatedValue, {
        toValue: 1,
        duration,
        useNativeDriver: false,
      }).start(() => {
        animatedValue.setValue(0);
        animate();
      });
    };

    animate();
  }, [colors, duration]);

  const currentColors = colors[colorIndex.current % colors.length];
  const nextColors = colors[(colorIndex.current + 1) % colors.length];

  const interpolatedColors = currentColors.map((color, index) =>
    animatedValue.interpolate({
      inputRange: [0, 1],
      outputRange: [color, nextColors[index]],
    })
  );

  return (
    <LinearGradient
      colors={interpolatedColors as any}
      style={[styles.gradient, style]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      {children}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
});
