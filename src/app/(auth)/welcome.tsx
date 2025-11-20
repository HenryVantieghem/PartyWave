import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { Colors, Gradients } from '@/constants/colors';
import { Spacing } from '@/constants/theme';
import * as Haptics from 'expo-haptics';

const { width, height } = Dimensions.get('window');

export default function WelcomeScreen() {
  const router = useRouter();

  const handleSignUp = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/(auth)/signup');
  };

  const handleSignIn = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/(auth)/login');
  };

  return (
    <LinearGradient
      colors={['#000000', '#0a0a0a', '#000000']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <LinearGradient
              colors={Gradients.primary}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.logoContainer}
            >
              <Text variant="h1" weight="black" center style={styles.logo}>
                THE HANGOUT
              </Text>
            </LinearGradient>
            
            <View style={styles.titleContainer}>
              <Text variant="h2" center weight="bold" style={styles.subtitle}>
                Join The Party
              </Text>
              <Text variant="body" center color="secondary" style={styles.description}>
                Discover epic parties, build your crew, and own the night
              </Text>
            </View>
          </View>

          {/* Buttons */}
          <View style={styles.buttons}>
            <Button
              onPress={handleSignUp}
              variant="primary"
              size="large"
              fullWidth
              gradient
            >
              Create Account
            </Button>

            <Button
              onPress={handleSignIn}
              variant="outline"
              size="large"
              fullWidth
            >
              Sign In
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
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing['2xl'],
  },
  header: {
    marginBottom: Spacing['6xl'],
    alignItems: 'center',
  },
  logoContainer: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
    borderRadius: 24,
    marginBottom: Spacing['3xl'],
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 12,
  },
  logo: {
    color: Colors.white,
    letterSpacing: 3,
    lineHeight: 52,
  },
  titleContainer: {
    alignItems: 'center',
  },
  subtitle: {
    color: Colors.white,
    marginBottom: Spacing.lg,
    lineHeight: 36,
    fontSize: 28,
  },
  description: {
    fontSize: 17,
    lineHeight: 24,
    maxWidth: 300,
  },
  buttons: {
    gap: Spacing.base,
  },
});
