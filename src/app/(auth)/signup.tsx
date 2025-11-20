import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Text } from '@/components/ui/Text';
import { useAuthStore } from '@/stores/authStore';
import { useUIStore } from '@/stores/uiStore';
import { Colors } from '@/constants/colors';
import { Spacing } from '@/constants/theme';
import { validateEmail, validateUsername } from '@/lib/utils';

export default function SignupScreen() {
  const router = useRouter();
  const { signUp, isLoading } = useAuthStore();
  const { showToast } = useUIStore();

  const [formData, setFormData] = useState({
    email: '',
    username: '',
    displayName: '',
    password: '',
    confirmPassword: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const updateField = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user types
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    if (!formData.username) {
      newErrors.username = 'Username is required';
    } else if (!validateUsername(formData.username)) {
      newErrors.username = 'Username must be 3-20 characters (letters, numbers, underscore)';
    }

    if (!formData.displayName) {
      newErrors.displayName = 'Display name is required';
    } else if (formData.displayName.length < 2) {
      newErrors.displayName = 'Display name must be at least 2 characters';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignup = async () => {
    if (!validate()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    try {
      const result = await signUp({
        email: formData.email,
        password: formData.password,
        username: formData.username,
        displayName: formData.displayName,
      });
      
      // Wait a bit for auth store to update
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Check if user is authenticated (session exists)
      const { isAuthenticated } = useAuthStore.getState();
      
      if (isAuthenticated && result.session) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        showToast('Account created! Welcome to the party!', 'success');
        router.replace('/(tabs)');
      } else {
        // Email confirmation might be required
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        showToast('Account created! Please check your email to confirm your account.', 'success');
        router.replace('/(auth)/login');
      }
    } catch (error: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      const errorMessage = error.message || 'Signup failed. Please try again.';
      showToast(errorMessage, 'error');
      console.error('Signup error:', error);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#000000', '#0a0a0a', '#000000']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
          style={styles.keyboardAvoid}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="interactive"
          >
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity
                onPress={() => router.push('/(auth)/welcome')}
                style={styles.backButton}
              >
                <Text variant="body" color="accent">
                  ← Back
                </Text>
              </TouchableOpacity>

              <Text variant="h1" weight="black" center style={styles.title}>
                Join The Party
              </Text>
              <Text variant="body" center color="secondary" style={styles.subtitle}>
                Create your account and start discovering
              </Text>
            </View>

            {/* Form */}
            <View style={styles.form}>
              <Input
                label="Email"
                placeholder="your@email.com"
                value={formData.email}
                onChangeText={(value) => updateField('email', value)}
                leftIcon="mail-outline"
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="off"
                textContentType="none"
                error={errors.email}
              />

              <Input
                label="Username"
                placeholder="@username"
                value={formData.username}
                onChangeText={(value) => updateField('username', value)}
                leftIcon="at-outline"
                autoCapitalize="none"
                autoComplete="off"
                textContentType="none"
                error={errors.username}
              />

              <Input
                label="Display Name"
                placeholder="Your Name"
                value={formData.displayName}
                onChangeText={(value) => updateField('displayName', value)}
                leftIcon="person-outline"
                autoComplete="off"
                textContentType="none"
                error={errors.displayName}
              />

              <Input
                label="Password"
                placeholder="Create a strong password"
                value={formData.password}
                onChangeText={(value) => updateField('password', value)}
                leftIcon="lock-closed-outline"
                secure
                autoComplete="off"
                textContentType="newPassword"
                error={errors.password}
              />

              <Input
                label="Confirm Password"
                placeholder="Re-enter your password"
                value={formData.confirmPassword}
                onChangeText={(value) => updateField('confirmPassword', value)}
                leftIcon="lock-closed-outline"
                secure
                autoComplete="off"
                textContentType="newPassword"
                error={errors.confirmPassword}
              />

              <Button
                onPress={handleSignup}
                variant="primary"
                size="large"
                fullWidth
                gradient
                loading={isLoading}
                style={styles.signupButton}
              >
                Create Account
              </Button>

              <Text variant="caption" center color="tertiary" style={styles.terms}>
                By signing up, you agree to our Terms of Service and Privacy Policy
              </Text>
            </View>

            {/* Footer */}
            <View style={styles.footer}>
              <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
                <Text variant="body" center color="secondary">
                  Already have an account?{' '}
                  <Text variant="body" color="accent" weight="semibold">
                    Sign In
                  </Text>
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing['2xl'],
    paddingBottom: Spacing['5xl'],
  },
  header: {
    marginBottom: Spacing['4xl'],
    paddingTop: Spacing.xl,
  },
  backButton: {
    marginBottom: Spacing.xl,
    paddingVertical: Spacing.xs,
  },
  title: {
    color: Colors.primary,
    letterSpacing: 1,
    marginBottom: Spacing.md,
    lineHeight: 40,
  },
  subtitle: {
    fontSize: 17,
    lineHeight: 24,
  },
  form: {
    gap: Spacing.lg,
  },
  signupButton: {
    marginTop: Spacing.base,
  },
  terms: {
    marginTop: Spacing.md,
    paddingHorizontal: Spacing.base,
    lineHeight: 18,
  },
  footer: {
    marginTop: 'auto',
    paddingTop: Spacing['3xl'],
    paddingBottom: Spacing.lg,
  },
});
