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
import { validateEmail } from '@/lib/utils';

export default function LoginScreen() {
  const router = useRouter();
  const { signIn, isLoading } = useAuthStore();
  const { showToast } = useUIStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const validate = () => {
    const newErrors: { email?: string; password?: string } = {};

    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(email)) {
      newErrors.email = 'Invalid email format';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    try {
      await signIn(email, password);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showToast('Welcome back!', 'success');
    } catch (error: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showToast(error.message || 'Login failed', 'error');
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
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push('/(auth)/welcome');
                }}
                style={styles.backButton}
              >
                <Text variant="body" color="accent" weight="semibold">
                  ← Back
                </Text>
              </TouchableOpacity>

              <View style={styles.titleContainer}>
                <Text variant="h1" weight="black" center style={styles.title}>
                  THE HANGOUT
                </Text>
                <Text variant="body" center color="secondary" style={styles.subtitle}>
                  Welcome back to the party
                </Text>
              </View>
            </View>

            {/* Form */}
            <View style={styles.form}>
              <Input
                label="Email"
                placeholder="Enter your email"
                value={email}
                onChangeText={setEmail}
                leftIcon="mail-outline"
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="off"
                textContentType="none"
                error={errors.email}
              />

              <Input
                label="Password"
                placeholder="Enter your password"
                value={password}
                onChangeText={setPassword}
                leftIcon="lock-closed-outline"
                secure
                autoComplete="off"
                textContentType="password"
                error={errors.password}
              />

              <TouchableOpacity 
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  // TODO: Implement forgot password
                }}
                style={styles.forgotPassword}
              >
                <Text variant="caption" color="accent" center weight="semibold">
                  Forgot Password?
                </Text>
              </TouchableOpacity>

              <Button
                onPress={handleLogin}
                variant="primary"
                size="large"
                fullWidth
                gradient
                loading={isLoading}
                style={styles.loginButton}
              >
                Sign In
              </Button>

              {/* Divider */}
              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text variant="caption" color="tertiary" style={styles.dividerText}>
                  OR
                </Text>
                <View style={styles.dividerLine} />
              </View>

              {/* Social Login */}
              <Button
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  // TODO: Apple Sign In
                }}
                variant="outline"
                size="large"
                fullWidth
              >
                Continue with Apple
              </Button>

              <Button
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  // TODO: Google Sign In
                }}
                variant="outline"
                size="large"
                fullWidth
              >
                Continue with Google
              </Button>
            </View>

            {/* Footer */}
            <View style={styles.footer}>
              <TouchableOpacity 
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push('/(auth)/signup');
                }}
              >
                <Text variant="body" center color="secondary">
                  Don't have an account?{' '}
                  <Text variant="body" color="accent" weight="semibold">
                    Sign Up
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
    marginBottom: Spacing['5xl'],
    paddingTop: Spacing.xl,
  },
  backButton: {
    marginBottom: Spacing.xl,
    paddingVertical: Spacing.xs,
    alignSelf: 'flex-start',
  },
  titleContainer: {
    alignItems: 'center',
  },
  title: {
    color: Colors.primary,
    letterSpacing: 2,
    marginBottom: Spacing.md,
    lineHeight: 44,
    fontSize: 36,
  },
  subtitle: {
    fontSize: 17,
    lineHeight: 24,
  },
  form: {
    gap: Spacing.lg,
  },
  forgotPassword: {
    marginTop: Spacing.xs,
    marginBottom: Spacing.sm,
    paddingVertical: Spacing.xs,
    alignSelf: 'center',
  },
  loginButton: {
    marginTop: Spacing.md,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing['2xl'],
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border.default,
  },
  dividerText: {
    marginHorizontal: Spacing.base,
    fontSize: 12,
    fontWeight: '600',
  },
  footer: {
    marginTop: 'auto',
    paddingTop: Spacing['3xl'],
    paddingBottom: Spacing.lg,
  },
});
