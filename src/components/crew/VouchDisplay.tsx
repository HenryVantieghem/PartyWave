import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Alert } from 'react';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Text } from '@/components/ui/Text';
import { Avatar } from '@/components/ui/Avatar';
import { Colors } from '@/constants/colors';
import { Spacing, BorderRadius } from '@/constants/theme';
import { useCrewStore } from '@/stores/crewStore';
import { useAuthStore } from '@/stores/authStore';
import type { CrewVouch } from '@/types/crew';

interface VouchDisplayProps {
  userId: string;
  crewId?: string;
  onVouchComplete?: () => void;
}

export function VouchDisplay({ userId, crewId, onVouchComplete }: VouchDisplayProps) {
  const { profile } = useAuthStore();
  const { vouchForUser, fetchUserVouches } = useCrewStore();

  const [vouches, setVouches] = useState<CrewVouch[]>([]);
  const [hasVouched, setHasVouched] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadVouches();
  }, [userId]);

  const loadVouches = async () => {
    try {
      const userVouches = await fetchUserVouches(userId);
      setVouches(userVouches);

      // Check if current user has vouched
      const myVouch = userVouches.find((v) => v.voucher_id === profile?.id);
      setHasVouched(!!myVouch);
    } catch (error) {
      console.error('Error loading vouches:', error);
    }
  };

  const handleVouch = async () => {
    if (userId === profile?.id) {
      Alert.alert('Error', "You can't vouch for yourself");
      return;
    }

    if (hasVouched) {
      Alert.alert('Already Vouched', "You've already vouched for this user");
      return;
    }

    try {
      setLoading(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      await vouchForUser(userId, crewId);

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setHasVouched(true);
      await loadVouches();

      if (onVouchComplete) {
        onVouchComplete();
      }
    } catch (error: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', error.message || 'Failed to vouch for user');
    } finally {
      setLoading(false);
    }
  };

  const vouchCount = vouches.length;

  return (
    <View style={styles.container}>
      <View style={styles.vouchHeader}>
        <View style={styles.vouchCountContainer}>
          <Ionicons name="heart" size={20} color={Colors.accent.pink} />
          <Text variant="body" weight="bold" style={{ marginLeft: Spacing.xs }}>
            {vouchCount} Vouch{vouchCount !== 1 ? 'es' : ''}
          </Text>
        </View>

        {userId !== profile?.id && (
          <TouchableOpacity
            onPress={handleVouch}
            disabled={hasVouched || loading}
            style={[styles.vouchButton, hasVouched && styles.vouchButtonDisabled]}
          >
            <Ionicons name={hasVouched ? 'heart' : 'heart-outline'} size={18} color={hasVouched ? Colors.accent.pink : Colors.white} />
            <Text
              variant="caption"
              weight="semibold"
              color={hasVouched ? 'secondary' : 'white'}
              style={{ marginLeft: 4 }}
            >
              {hasVouched ? 'Vouched' : 'Vouch'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {vouchCount > 0 && (
        <View style={styles.vouchersList}>
          <Text variant="caption" color="secondary" style={{ marginBottom: Spacing.sm }}>
            Vouched by:
          </Text>
          <View style={styles.vouchersGrid}>
            {vouches.slice(0, 6).map((vouch) => (
              <Avatar
                key={vouch.id}
                source={{ uri: vouch.voucher?.avatar_url }}
                size="sm"
                fallbackText={vouch.voucher?.username}
              />
            ))}
            {vouchCount > 6 && (
              <View style={styles.moreVouches}>
                <Text variant="caption" weight="bold" color="secondary">
                  +{vouchCount - 6}
                </Text>
              </View>
            )}
          </View>
        </View>
      )}

      {vouchCount === 0 && userId !== profile?.id && (
        <Text variant="caption" color="tertiary" center style={{ marginTop: Spacing.xs }}>
          Be the first to vouch for this user
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: Spacing.md,
  },
  vouchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  vouchCountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  vouchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.accent.pink,
    borderRadius: BorderRadius.md,
  },
  vouchButtonDisabled: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  vouchersList: {
    marginTop: Spacing.md,
  },
  vouchersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  moreVouches: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
