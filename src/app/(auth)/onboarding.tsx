import React, { useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  FlatList,
  Animated,
  Text as RNText,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { Colors, Gradients } from '@/constants/colors';
import { Spacing } from '@/constants/theme';
import * as Haptics from 'expo-haptics';

const { width, height } = Dimensions.get('window');

const slides: Array<{
  id: string;
  title: string;
  description: string;
  emoji: string;
  gradient: readonly [string, string];
}> = [
  {
    id: '1',
    title: 'Discover Epic Parties',
    description: 'Find the hottest parties near you in real-time with our Party Radar',
    emoji: '🎉',
    gradient: ['#FF6B6B', '#FF8787'] as const,
  },
  {
    id: '2',
    title: 'Build Your Crew',
    description: 'Connect with friends and make memories that last forever',
    emoji: '🤝',
    gradient: ['#4ECDC4', '#95E1D3'] as const,
  },
  {
    id: '3',
    title: 'Own The Night',
    description: 'Capture moments, earn achievements, and become a party legend',
    emoji: '⚡',
    gradient: ['#FFD93D', '#FFED4E'] as const,
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;
  const slidesRef = useRef<FlatList>(null);

  const viewableItemsChanged = useRef(({ viewableItems }: any) => {
    setCurrentIndex(viewableItems[0]?.index || 0);
  }).current;

  const viewConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  const scrollTo = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (currentIndex < slides.length - 1) {
      slidesRef.current?.scrollToIndex({
        index: currentIndex + 1,
        animated: true,
      });
    } else {
      router.replace('/(auth)/welcome');
    }
  };

  const skip = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.replace('/(auth)/welcome');
  };

  const renderSlide = ({ item }: { item: typeof slides[0] }) => (
    <View style={styles.slide}>
      <View style={styles.content}>
        <LinearGradient
          colors={item.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.emojiContainer}
        >
          <RNText style={styles.emoji} allowFontScaling={false}>
            {item.emoji}
          </RNText>
        </LinearGradient>

        <View style={styles.textContainer}>
          <Text variant="h2" center weight="black" style={styles.title}>
            {item.title}
          </Text>
          <Text variant="body" center color="secondary" style={styles.description}>
            {item.description}
          </Text>
        </View>
      </View>
    </View>
  );

  const Pagination = () => {
    return (
      <View style={styles.pagination}>
        {slides.map((_, index) => {
          const inputRange = [(index - 1) * width, index * width, (index + 1) * width];

          const dotWidth = scrollX.interpolate({
            inputRange,
            outputRange: [8, 24, 8],
            extrapolate: 'clamp',
          });

          const opacity = scrollX.interpolate({
            inputRange,
            outputRange: [0.3, 1, 0.3],
            extrapolate: 'clamp',
          });

          return (
            <Animated.View
              key={index}
              style={[
                styles.dot,
                {
                  width: dotWidth,
                  opacity,
                },
              ]}
            />
          );
        })}
      </View>
    );
  };

  return (
    <LinearGradient
      colors={['#000000', '#0a0a0a', '#000000']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <Text variant="h3" weight="black" style={styles.logo}>
            THE HANGOUT
          </Text>
        </View>

        {/* Slides */}
        <FlatList
          data={slides}
          renderItem={renderSlide}
          horizontal
          pagingEnabled
          bounces={false}
          showsHorizontalScrollIndicator={false}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { x: scrollX } } }],
            { useNativeDriver: false }
          )}
          onViewableItemsChanged={viewableItemsChanged}
          viewabilityConfig={viewConfig}
          scrollEventThrottle={32}
          ref={slidesRef}
          keyExtractor={(item) => item.id}
        />

        {/* Footer */}
        <View style={styles.footer}>
          <Pagination />

          <View style={styles.buttons}>
            <Button
              onPress={scrollTo}
              variant="primary"
              size="large"
              fullWidth
              gradient
            >
              {currentIndex === slides.length - 1 ? 'Get Started' : 'Next'}
            </Button>

            <Button onPress={skip} variant="ghost" size="medium" fullWidth>
              {currentIndex === slides.length - 1 ? 'Sign In Instead' : 'Skip'}
            </Button>
          </View>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
  },
  logo: {
    color: Colors.primary,
    letterSpacing: 2,
  },
  slide: {
    width,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing['2xl'],
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  emojiContainer: {
    width: 280,
    height: 280,
    borderRadius: 140,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing['6xl'],
    overflow: 'hidden',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 12,
  },
  emoji: {
    fontSize: 150,
    lineHeight: 150,
    textAlign: 'center',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  textContainer: {
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    width: '100%',
  },
  title: {
    marginBottom: Spacing.lg,
    lineHeight: 38,
    fontSize: 32,
  },
  description: {
    maxWidth: 320,
    lineHeight: 24,
    fontSize: 17,
  },
  footer: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing['2xl'],
    paddingTop: Spacing.lg,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing['2xl'],
    height: 12,
  },
  dot: {
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
    marginHorizontal: 4,
  },
  buttons: {
    gap: Spacing.base,
  },
});
