import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Animated, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { Colors, Gradients } from '@/constants/colors';
import { Spacing, BorderRadius } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';

interface PartyPulseData {
  pulse_score: number;
  status: 'upcoming' | 'warming_up' | 'active' | 'lit' | 'peak' | 'winding_down';
  energy: {
    current: number;
    trend: 'rising' | 'stable' | 'falling';
  };
  attendance: {
    total: number;
    checked_in: number;
    recent_activity: number;
  };
  ratings: {
    vibe: number;
    crowdedness: number;
    music: number;
  };
  activity: {
    photos: number;
    messages: number;
    total: number;
  };
  timestamp: string;
}

interface PartyPulseProps {
  partyId: string;
  onCheckIn?: () => void;
}

export function PartyPulse({ partyId, onCheckIn }: PartyPulseProps) {
  const { profile } = useAuthStore();
  const [pulseData, setPulseData] = useState<PartyPulseData | null>(null);
  const [loading, setLoading] = useState(true);
  const [pulseAnimation] = useState(new Animated.Value(1));

  useEffect(() => {
    fetchPulseData();
    setupRealtimeSubscription();
    startPulseAnimation();
  }, [partyId]);

  const fetchPulseData = async () => {
    try {
      const { data, error } = await supabase.rpc('calculate_party_pulse', {
        party_id_param: partyId,
      });

      if (error) throw error;

      setPulseData(data);
    } catch (error) {
      console.error('Error fetching pulse data:', error);
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeSubscription = () => {
    const subscription = supabase
      .channel(`party_pulse:${partyId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'party_pulse_checkins',
          filter: `party_id=eq.${partyId}`,
        },
        () => {
          fetchPulseData();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  };

  const startPulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnimation, {
          toValue: 1.05,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnimation, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const handleCheckIn = () => {
    if (onCheckIn) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      onCheckIn();
    }
  };

  const getStatusConfig = (status: PartyPulseData['status']) => {
    switch (status) {
      case 'peak':
        return {
          label: 'PEAK ENERGY',
          color: Colors.accent.gold,
          icon: 'flame' as const,
          gradient: ['#FFD700', '#FF6B6B'],
        };
      case 'lit':
        return {
          label: 'LIT',
          color: Colors.primary,
          icon: 'flash' as const,
          gradient: Gradients.party,
        };
      case 'active':
        return {
          label: 'ACTIVE',
          color: Colors.accent.green,
          icon: 'pulse' as const,
          gradient: ['#10B981', '#06B6D4'],
        };
      case 'warming_up':
        return {
          label: 'WARMING UP',
          color: Colors.accent.orange,
          icon: 'sunny' as const,
          gradient: ['#F59E0B', '#FBBF24'],
        };
      case 'winding_down':
        return {
          label: 'WINDING DOWN',
          color: Colors.accent.blue,
          icon: 'moon' as const,
          gradient: ['#8B5CF6', '#06B6D4'],
        };
      default:
        return {
          label: 'UPCOMING',
          color: Colors.text.secondary,
          icon: 'time' as const,
          gradient: ['#6B7280', '#9CA3AF'],
        };
    }
  };

  const getTrendIcon = (trend: PartyPulseData['energy']['trend']) => {
    switch (trend) {
      case 'rising':
        return { name: 'trending-up' as const, color: Colors.accent.green };
      case 'falling':
        return { name: 'trending-down' as const, color: Colors.accent.orange };
      default:
        return { name: 'remove' as const, color: Colors.text.secondary };
    }
  };

  if (loading || !pulseData) {
    return (
      <Card variant="liquid">
        <View style={styles.loadingContainer}>
          <Ionicons name="pulse" size={48} color={Colors.text.tertiary} />
          <Text variant="body" color="secondary" style={{ marginTop: Spacing.md }}>
            Loading party pulse...
          </Text>
        </View>
      </Card>
    );
  }

  const statusConfig = getStatusConfig(pulseData.status);
  const trendIcon = getTrendIcon(pulseData.energy.trend);

  return (
    <Card variant="liquid" style={styles.container}>
      {/* Pulse Score Circle */}
      <Animated.View style={[styles.pulseCircle, { transform: [{ scale: pulseAnimation }] }]}>
        <LinearGradient colors={statusConfig.gradient} style={styles.pulseGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          <Ionicons name={statusConfig.icon} size={48} color={Colors.white} />
          <Text variant="h1" weight="bold" color="white" style={{ marginTop: Spacing.xs }}>
            {Math.round(pulseData.pulse_score)}
          </Text>
          <Text variant="caption" weight="semibold" color="white" style={{ opacity: 0.9 }}>
            {statusConfig.label}
          </Text>
        </LinearGradient>
      </Animated.View>

      {/* Energy Metrics */}
      <View style={styles.metricsRow}>
        <View style={styles.metricItem}>
          <View style={[styles.metricIcon, { backgroundColor: `${statusConfig.color}20` }]}>
            <Ionicons name="flash" size={20} color={statusConfig.color} />
          </View>
          <Text variant="caption" color="secondary">
            Energy
          </Text>
          <View style={styles.metricValue}>
            <Text variant="h4" weight="bold">
              {Math.round(pulseData.energy.current)}
            </Text>
            <Ionicons name={trendIcon.name} size={16} color={trendIcon.color} style={{ marginLeft: 4 }} />
          </View>
        </View>

        <View style={styles.metricDivider} />

        <View style={styles.metricItem}>
          <View style={[styles.metricIcon, { backgroundColor: `${Colors.accent.blue}20` }]}>
            <Ionicons name="people" size={20} color={Colors.accent.blue} />
          </View>
          <Text variant="caption" color="secondary">
            Active Now
          </Text>
          <Text variant="h4" weight="bold">
            {pulseData.attendance.checked_in}
          </Text>
        </View>

        <View style={styles.metricDivider} />

        <View style={styles.metricItem}>
          <View style={[styles.metricIcon, { backgroundColor: `${Colors.accent.purple}20` }]}>
            <Ionicons name="activity" size={20} color={Colors.accent.purple} />
          </View>
          <Text variant="caption" color="secondary">
            Activity
          </Text>
          <Text variant="h4" weight="bold">
            {pulseData.activity.total}
          </Text>
        </View>
      </View>

      {/* Ratings */}
      <View style={styles.ratingsContainer}>
        <View style={styles.ratingItem}>
          <Ionicons name="sparkles" size={16} color={Colors.accent.gold} />
          <Text variant="caption" color="secondary" style={{ marginLeft: 4 }}>
            Vibe
          </Text>
          <View style={styles.ratingStars}>
            {[...Array(5)].map((_, i) => (
              <Ionicons
                key={i}
                name={i < Math.round(pulseData.ratings.vibe) ? 'star' : 'star-outline'}
                size={12}
                color={Colors.accent.gold}
              />
            ))}
          </View>
        </View>

        <View style={styles.ratingItem}>
          <Ionicons name="people" size={16} color={Colors.accent.blue} />
          <Text variant="caption" color="secondary" style={{ marginLeft: 4 }}>
            Crowd
          </Text>
          <View style={styles.ratingStars}>
            {[...Array(5)].map((_, i) => (
              <Ionicons
                key={i}
                name={i < Math.round(pulseData.ratings.crowdedness) ? 'star' : 'star-outline'}
                size={12}
                color={Colors.accent.blue}
              />
            ))}
          </View>
        </View>

        <View style={styles.ratingItem}>
          <Ionicons name="musical-notes" size={16} color={Colors.accent.purple} />
          <Text variant="caption" color="secondary" style={{ marginLeft: 4 }}>
            Music
          </Text>
          <View style={styles.ratingStars}>
            {[...Array(5)].map((_, i) => (
              <Ionicons
                key={i}
                name={i < Math.round(pulseData.ratings.music) ? 'star' : 'star-outline'}
                size={12}
                color={Colors.accent.purple}
              />
            ))}
          </View>
        </View>
      </View>

      {/* Check-In Button */}
      <TouchableOpacity onPress={handleCheckIn} style={styles.checkInButton}>
        <LinearGradient colors={Gradients.party} style={styles.checkInGradient}>
          <Ionicons name="location" size={20} color={Colors.white} />
          <Text variant="button" weight="bold" color="white" style={{ marginLeft: Spacing.sm }}>
            Update Party Pulse
          </Text>
        </LinearGradient>
      </TouchableOpacity>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: Spacing['2xl'],
  },
  pulseCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    marginBottom: Spacing.lg,
    overflow: 'hidden',
  },
  pulseGradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricsRow: {
    flexDirection: 'row',
    width: '100%',
    marginBottom: Spacing.lg,
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
  },
  metricIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
  },
  metricValue: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metricDivider: {
    width: 1,
    backgroundColor: Colors.border.dark,
    marginHorizontal: Spacing.sm,
  },
  ratingsContainer: {
    width: '100%',
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  ratingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
  },
  ratingStars: {
    flexDirection: 'row',
    marginLeft: 'auto',
    gap: 2,
  },
  checkInButton: {
    width: '100%',
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  checkInGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
  },
});
