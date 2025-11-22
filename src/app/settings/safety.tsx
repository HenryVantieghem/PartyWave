import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, Alert, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Colors } from '@/constants/colors';
import { Spacing, BorderRadius } from '@/constants/theme';

export default function SafetyScreen() {
  const router = useRouter();
  const [emergencyContact, setEmergencyContact] = useState({ name: '', phone: '' });

  const handleSaveEmergencyContact = () => {
    if (!emergencyContact.name || !emergencyContact.phone) {
      Alert.alert('Required', 'Please enter name and phone number');
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert('Saved', 'Emergency contact saved');
  };

  const handleTriggerEmergency = () => {
    Alert.alert(
      'Emergency Alert',
      'This will notify your emergency contacts and party hosts. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send Alert',
          style: 'destructive',
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            Alert.alert('Alert Sent', 'Emergency contacts have been notified');
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <BlurView intensity={80} tint="dark" style={styles.header}>
        <SafeAreaView edges={['top']}>
          <View style={styles.headerContent}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color={Colors.white} />
            </TouchableOpacity>
            <Text variant="h3" weight="bold">
              Safety Center
            </Text>
            <View style={{ width: 40 }} />
          </View>
        </SafeAreaView>
      </BlurView>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Emergency Contact */}
        <View style={styles.section}>
          <Text variant="h4" weight="bold" style={{ marginBottom: Spacing.md }}>
            Emergency Contact
          </Text>
          <Card variant="liquid">
            <TextInput
              style={styles.input}
              placeholder="Contact Name"
              placeholderTextColor={Colors.text.tertiary}
              value={emergencyContact.name}
              onChangeText={(text) => setEmergencyContact({ ...emergencyContact, name: text })}
            />
            <TextInput
              style={[styles.input, { marginTop: Spacing.sm }]}
              placeholder="Phone Number"
              placeholderTextColor={Colors.text.tertiary}
              keyboardType="phone-pad"
              value={emergencyContact.phone}
              onChangeText={(text) => setEmergencyContact({ ...emergencyContact, phone: text })}
            />
            <Button
              variant="primary"
              onPress={handleSaveEmergencyContact}
              style={{ marginTop: Spacing.md }}
            >
              <Text variant="button" weight="bold" color="white">
                Save Contact
              </Text>
            </Button>
          </Card>
        </View>

        {/* Emergency Alert */}
        <View style={styles.section}>
          <Text variant="h4" weight="bold" style={{ marginBottom: Spacing.md }}>
            Emergency Alert
          </Text>
          <Card variant="liquid">
            <View style={styles.emergencyInfo}>
              <Ionicons name="shield-checkmark" size={48} color={Colors.error} />
              <Text variant="body" center style={{ marginTop: Spacing.md }}>
                Press this button if you feel unsafe and need immediate help
              </Text>
            </View>
            <TouchableOpacity onPress={handleTriggerEmergency} style={styles.emergencyButton}>
              <Ionicons name="alert-circle" size={24} color={Colors.white} />
              <Text variant="button" weight="bold" color="white" style={{ marginLeft: Spacing.sm }}>
                Trigger Emergency Alert
              </Text>
            </TouchableOpacity>
          </Card>
        </View>

        {/* Report Issue */}
        <View style={styles.section}>
          <Text variant="h4" weight="bold" style={{ marginBottom: Spacing.md }}>
            Report an Issue
          </Text>
          <Card variant="liquid">
            <TouchableOpacity style={styles.reportItem}>
              <Ionicons name="person-remove" size={24} color={Colors.text.secondary} />
              <Text variant="body" style={{ marginLeft: Spacing.md }}>
                Report a User
              </Text>
            </TouchableOpacity>
            <View style={styles.divider} />
            <TouchableOpacity style={styles.reportItem}>
              <Ionicons name="flag" size={24} color={Colors.text.secondary} />
              <Text variant="body" style={{ marginLeft: Spacing.md }}>
                Report a Party
              </Text>
            </TouchableOpacity>
          </Card>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.dark,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    height: 56,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.base,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: 16,
    color: Colors.white,
  },
  emergencyInfo: {
    alignItems: 'center',
    paddingVertical: Spacing.lg,
  },
  emergencyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.error,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginTop: Spacing.md,
  },
  reportItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border.dark,
    marginVertical: Spacing.sm,
  },
});
