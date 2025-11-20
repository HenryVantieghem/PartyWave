import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuthStore } from '@/stores/authStore';
import { Colors } from '@/constants/colors';
import { Spacing, BorderRadius } from '@/constants/theme';
import * as Haptics from 'expo-haptics';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { resetPassword } = useAuthStore();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [error, setError] = useState('');

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleResetPassword = async () => {
    setError('');

    // Validation
    if (!email) {
      setError('Please enter your email address');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    try {
      setIsLoading(true);
      await resetPassword(email);

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setEmailSent(true);
    } catch (error: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setError(error.message || 'Failed to send reset email');
    } finally {
      setIsLoading(false);
    }
  };

  if (emailSent) {
    return (
      <LinearGradient
        colors={[Colors.black, Colors.backgroundElevated]}
        style={styles.container}
      >
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.content}>
            {/* Success Icon */}
            <View style={styles.successIcon}>
              <LinearGradient
                colors={[Colors.primary, Colors.secondary]}
                style={styles.iconGradient}
              >
                <Ionicons name="checkmark-circle" size={64} color={Colors.white} />
              </LinearGradient>
            </View>

            {/* Success Message */}
            <Text variant="h2" weight="bold" center style={styles.title}>
              Check Your Email
            </Text>
            <Text variant="body" color="secondary" center style={styles.description}>
              We've sent password reset instructions to {email}
            </Text>
            <Text variant="caption" color="tertiary" center style={styles.hint}>
              Didn't receive the email? Check your spam folder or try again.
            </Text>

            {/* Actions */}
            <View style={styles.actions}>
              <Button
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.back();
                }}
                variant="primary"
                size="large"
                fullWidth
                gradient
              >
                Back to Login
              </Button>

              <Button
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setEmailSent(false);
                }}
                variant="ghost"
                size="large"
                fullWidth
              >
                Try Another Email
              </Button>
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={[Colors.black, Colors.backgroundElevated]}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.back();
              }}
              style={styles.backButton}
            >
              <Ionicons name="arrow-back" size={24} color={Colors.white} />
            </TouchableOpacity>
          </View>

          <View style={styles.content}>
            {/* Icon */}
            <View style={styles.iconContainer}>
              <LinearGradient
                colors={[Colors.primary, Colors.secondary]}
                style={styles.iconGradient}
              >
                <Ionicons name="key" size={48} color={Colors.white} />
              </LinearGradient>
            </View>

            {/* Title & Description */}
            <Text variant="h2" weight="bold" center style={styles.title}>
              Reset Password
            </Text>
            <Text variant="body" color="secondary" center style={styles.description}>
              Enter your email address and we'll send you instructions to reset your password.
            </Text>

            {/* Form */}
            <View style={styles.form}>
              <Input
                label="Email Address"
                placeholder="your@email.com"
                value={email}
                onChangeText={setEmail}
                leftIcon="mail-outline"
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="off"
                textContentType="emailAddress"
                error={error}
              />

              <Button
                onPress={handleResetPassword}
                variant="primary"
                size="large"
                fullWidth
                gradient
                loading={isLoading}
                style={styles.submitButton}
              >
                Send Reset Instructions
              </Button>
            </View>

            {/* Back to Login */}
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.back();
              }}
              style={styles.backToLogin}
            >
              <Ionicons name="arrow-back" size={16} color={Colors.primary} />
              <Text variant="body" color="accent" weight="semibold" style={styles.backToLoginText}>
                Back to Login
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
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
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.lg,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing['2xl'],
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  iconGradient: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successIcon: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  title: {
    marginBottom: Spacing.md,
  },
  description: {
    marginBottom: Spacing.xl,
    lineHeight: 24,
  },
  hint: {
    marginBottom: Spacing.xl,
    lineHeight: 20,
  },
  form: {
    marginTop: Spacing.lg,
    gap: Spacing.lg,
  },
  submitButton: {
    marginTop: Spacing.md,
  },
  backToLogin: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    marginTop: Spacing.xl,
    paddingVertical: Spacing.md,
  },
  backToLoginText: {
    fontSize: 16,
  },
  actions: {
    gap: Spacing.md,
    marginTop: Spacing.xl,
  },
});
