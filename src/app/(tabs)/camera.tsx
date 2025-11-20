import React from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { Colors } from '@/constants/colors';
import { Spacing } from '@/constants/theme';

export default function CameraScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          <Text variant="h1" style={styles.emoji}>📸</Text>
          <Text variant="h3" weight="bold" center style={styles.title}>
            Camera Coming Soon
          </Text>
          <Text variant="body" center color="secondary" style={styles.description}>
            Capture epic party moments with filters and AR effects
          </Text>
          <Button onPress={() => router.back()} variant="primary" gradient>
            Go Back
          </Button>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  emoji: {
    fontSize: 64,
    marginBottom: Spacing.lg,
  },
  title: {
    marginBottom: Spacing.base,
  },
  description: {
    maxWidth: 280,
    marginBottom: Spacing.xl,
  },
});
