import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Text } from '@/components/ui/Text';
import { Colors, Gradients } from '@/constants/colors';
import { Spacing, BorderRadius } from '@/constants/theme';

interface ReputationScoreProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  showBreakdown?: boolean;
  breakdown?: {
    activity: number;
    retention: number;
    engagement: number;
    vouches: number;
  };
}

export function ReputationScore({
  score,
  size = 'md',
  showLabel = true,
  showBreakdown = false,
  breakdown,
}: ReputationScoreProps) {
  const getScoreColor = (score: number) => {
    if (score >= 90) return Colors.accent.gold;
    if (score >= 75) return Colors.accent.green;
    if (score >= 60) return Colors.accent.blue;
    if (score >= 40) return Colors.accent.orange;
    return Colors.error;
  };

  const getScoreLabel = (score: number) => {
    if (score >= 90) return 'Elite';
    if (score >= 75) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Average';
    return 'New';
  };

  const getScoreIcon = (score: number) => {
    if (score >= 90) return 'trophy';
    if (score >= 75) return 'star';
    if (score >= 60) return 'ribbon';
    if (score >= 40) return 'heart';
    return 'flash';
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return {
          container: 64,
          iconSize: 24,
          scoreSize: 20,
          labelSize: 12,
        };
      case 'lg':
        return {
          container: 120,
          iconSize: 48,
          scoreSize: 32,
          labelSize: 16,
        };
      default: // 'md'
        return {
          container: 80,
          iconSize: 32,
          scoreSize: 24,
          labelSize: 14,
        };
    }
  };

  const sizeStyles = getSizeStyles();
  const scoreColor = getScoreColor(score);
  const scoreLabel = getScoreLabel(score);
  const scoreIcon = getScoreIcon(score);

  return (
    <View style={styles.container}>
      <View style={[styles.scoreCircle, { width: sizeStyles.container, height: sizeStyles.container }]}>
        <LinearGradient
          colors={[`${scoreColor}40`, `${scoreColor}20`]}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        <View style={styles.scoreContent}>
          <Ionicons name={scoreIcon as any} size={sizeStyles.iconSize} color={scoreColor} />
          <Text variant="h2" weight="bold" style={{ color: scoreColor, fontSize: sizeStyles.scoreSize, marginTop: 4 }}>
            {Math.round(score)}
          </Text>
        </View>
      </View>

      {showLabel && (
        <Text variant="caption" weight="semibold" center style={{ color: scoreColor, marginTop: Spacing.xs }}>
          {scoreLabel} Crew
        </Text>
      )}

      {showBreakdown && breakdown && (
        <View style={styles.breakdown}>
          <View style={styles.breakdownItem}>
            <Ionicons name="flash" size={14} color={Colors.text.secondary} />
            <Text variant="caption" color="secondary" style={{ marginLeft: 4 }}>
              Activity: {Math.round(breakdown.activity)}
            </Text>
          </View>
          <View style={styles.breakdownItem}>
            <Ionicons name="people" size={14} color={Colors.text.secondary} />
            <Text variant="caption" color="secondary" style={{ marginLeft: 4 }}>
              Retention: {Math.round(breakdown.retention)}
            </Text>
          </View>
          <View style={styles.breakdownItem}>
            <Ionicons name="heart" size={14} color={Colors.text.secondary} />
            <Text variant="caption" color="secondary" style={{ marginLeft: 4 }}>
              Engagement: {Math.round(breakdown.engagement)}
            </Text>
          </View>
          <View style={styles.breakdownItem}>
            <Ionicons name="star" size={14} color={Colors.text.secondary} />
            <Text variant="caption" color="secondary" style={{ marginLeft: 4 }}>
              Vouches: {Math.round(breakdown.vouches)}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  scoreCircle: {
    borderRadius: 1000,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
  },
  scoreContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  breakdown: {
    marginTop: Spacing.md,
    gap: Spacing.xs,
  },
  breakdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
