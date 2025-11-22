import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { Colors } from '@/constants/colors';
import { Spacing, BorderRadius } from '@/constants/theme';

export default function VerificationScreen() {
  const router = useRouter();
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [idVerified, setIdVerified] = useState(false);

  const handleVerifyPhone = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert('Phone Verification', 'Phone verification flow would go here');
  };

  const handleVerifyID = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert('ID Verification', 'ID verification flow would go here');
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
              Verification
            </Text>
            <View style={{ width: 40 }} />
          </View>
        </SafeAreaView>
      </BlurView>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <Card variant="liquid" style={{ marginBottom: Spacing.lg }}>
          <TouchableOpacity onPress={handleVerifyPhone} style={styles.verificationItem}>
            <Ionicons name={phoneVerified ? 'checkmark-circle' : 'phone-portrait'} size={32} color={phoneVerified ? Colors.accent.green : Colors.primary} />
            <View style={{ flex: 1, marginLeft: Spacing.md }}>
              <Text variant="body" weight="bold">
                Phone Number
              </Text>
              <Text variant="caption" color="secondary">
                {phoneVerified ? 'Verified' : 'Verify your phone number'}
              </Text>
            </View>
            {!phoneVerified && <Ionicons name="chevron-forward" size={24} color={Colors.text.secondary} />}
          </TouchableOpacity>
        </Card>

        <Card variant="liquid">
          <TouchableOpacity onPress={handleVerifyID} style={styles.verificationItem}>
            <Ionicons name={idVerified ? 'checkmark-circle' : 'card'} size={32} color={idVerified ? Colors.accent.green : Colors.primary} />
            <View style={{ flex: 1, marginLeft: Spacing.md }}>
              <Text variant="body" weight="bold">
                Photo ID
              </Text>
              <Text variant="caption" color="secondary">
                {idVerified ? 'Verified' : 'Verify your identity'}
              </Text>
            </View>
            {!idVerified && <Ionicons name="chevron-forward" size={24} color={Colors.text.secondary} />}
          </TouchableOpacity>
        </Card>
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
  verificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
});
