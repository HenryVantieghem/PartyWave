import React, { useRef } from 'react';
import {
  View,
  ScrollView,
  Animated,
  StyleSheet,
  ViewStyle,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Dimensions,
} from 'react-native';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface ParallaxScrollViewProps {
  children: React.ReactNode;
  headerImage?: React.ReactNode;
  headerHeight?: number;
  parallaxFactor?: number;
  style?: ViewStyle;
}

/**
 * Parallax Scroll View
 * ScrollView with parallax header effect
 */
export function ParallaxScrollView({
  children,
  headerImage,
  headerHeight = 300,
  parallaxFactor = 0.5,
  style,
}: ParallaxScrollViewProps) {
  const scrollY = useRef(new Animated.Value(0)).current;

  const headerTranslateY = scrollY.interpolate({
    inputRange: [0, headerHeight],
    outputRange: [0, -headerHeight * parallaxFactor],
    extrapolate: 'clamp',
  });

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, headerHeight * 0.5, headerHeight],
    outputRange: [1, 0.8, 0],
    extrapolate: 'clamp',
  });

  const headerScale = scrollY.interpolate({
    inputRange: [-headerHeight, 0],
    outputRange: [2, 1],
    extrapolate: 'clamp',
  });

  return (
    <View style={[styles.container, style]}>
      {headerImage && (
        <Animated.View
          style={[
            styles.header,
            {
              height: headerHeight,
              transform: [{ translateY: headerTranslateY }, { scale: headerScale }],
              opacity: headerOpacity,
            },
          ]}
        >
          {headerImage}
        </Animated.View>
      )}
      <Animated.ScrollView
        scrollEventThrottle={16}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
          useNativeDriver: true,
        })}
        contentContainerStyle={{ paddingTop: headerHeight }}
        showsVerticalScrollIndicator={false}
      >
        {children}
      </Animated.ScrollView>
    </View>
  );
}

interface ParallaxLayerProps {
  children: React.ReactNode;
  scrollY: Animated.Value;
  speed?: number;
  style?: ViewStyle;
}

/**
 * Parallax Layer
 * Individual layer that moves at different speed for depth effect
 */
export function ParallaxLayer({ children, scrollY, speed = 0.5, style }: ParallaxLayerProps) {
  const translateY = scrollY.interpolate({
    inputRange: [-SCREEN_HEIGHT, 0, SCREEN_HEIGHT],
    outputRange: [SCREEN_HEIGHT * speed, 0, -SCREEN_HEIGHT * speed],
    extrapolate: 'clamp',
  });

  return (
    <Animated.View
      style={[
        style,
        {
          transform: [{ translateY }],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}

interface DepthCardProps {
  children: React.ReactNode;
  scrollY: Animated.Value;
  index: number;
  style?: ViewStyle;
}

/**
 * Depth Card
 * Card with depth effect based on scroll position and index
 */
export function DepthCard({ children, scrollY, index, style }: DepthCardProps) {
  const scale = scrollY.interpolate({
    inputRange: [-1, 0, index * 100, (index + 1) * 100],
    outputRange: [1, 1, 1, 0.95],
    extrapolate: 'clamp',
  });

  const opacity = scrollY.interpolate({
    inputRange: [-1, 0, index * 100, (index + 2) * 100],
    outputRange: [1, 1, 1, 0.3],
    extrapolate: 'clamp',
  });

  const translateY = scrollY.interpolate({
    inputRange: [-1, 0, index * 100, (index + 1) * 100],
    outputRange: [0, 0, 0, -20],
    extrapolate: 'clamp',
  });

  return (
    <Animated.View
      style={[
        style,
        {
          transform: [{ scale }, { translateY }],
          opacity,
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}

interface StickyHeaderProps {
  children: React.ReactNode;
  scrollY: Animated.Value;
  threshold?: number;
  style?: ViewStyle;
}

/**
 * Sticky Header
 * Header that sticks to top after threshold
 */
export function StickyHeader({ children, scrollY, threshold = 200, style }: StickyHeaderProps) {
  const opacity = scrollY.interpolate({
    inputRange: [threshold - 50, threshold],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const translateY = scrollY.interpolate({
    inputRange: [0, threshold],
    outputRange: [threshold, 0],
    extrapolate: 'clamp',
  });

  return (
    <Animated.View
      style={[
        styles.stickyHeader,
        style,
        {
          opacity,
          transform: [{ translateY }],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}

interface FloatingElementProps {
  children: React.ReactNode;
  scrollY: Animated.Value;
  floatRange?: [number, number];
  style?: ViewStyle;
}

/**
 * Floating Element
 * Element that floats with subtle movement
 */
export function FloatingElement({
  children,
  scrollY,
  floatRange = [-10, 10],
  style,
}: FloatingElementProps) {
  const translateY = scrollY.interpolate({
    inputRange: [0, 1000],
    outputRange: floatRange,
    extrapolate: 'extend',
  });

  return (
    <Animated.View
      style={[
        style,
        {
          transform: [{ translateY }],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    overflow: 'hidden',
    zIndex: 1,
  },
  stickyHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
});
