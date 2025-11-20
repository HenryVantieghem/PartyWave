import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '@/components/ui/Text';
import { Colors } from '@/constants/colors';
import { Spacing } from '@/constants/theme';

export default function MessagesScreen() {
  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <View style={styles.header}>
          <Text variant="h2" weight="black" style={styles.headerTitle}>
            Party Chats
          </Text>
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          <Text variant="h1" style={styles.emoji}>💬</Text>
          <Text variant="h3" weight="bold" center style={styles.title}>
            No Messages Yet
          </Text>
          <Text variant="body" center color="secondary" style={styles.description}>
            Join a party to start chatting with your crew
          </Text>
        </ScrollView>
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
  header: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.base,
  },
  headerTitle: {
    color: Colors.primary,
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
  },
});
