import * as Haptics from 'expo-haptics';

/**
 * Enhanced haptic feedback patterns for PartyWave
 * Provides contextual haptic feedback for different interactions
 */

export const HapticPatterns = {
  // Navigation & UI
  lightTap: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),
  mediumTap: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium),
  heavyTap: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy),

  // Notifications
  success: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),
  warning: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning),
  error: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error),

  // Party-specific patterns
  partyJoin: async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await new Promise((resolve) => setTimeout(resolve, 100));
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  },

  energyBoost: async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await new Promise((resolve) => setTimeout(resolve, 50));
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await new Promise((resolve) => setTimeout(resolve, 50));
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  },

  checkIn: async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    await new Promise((resolve) => setTimeout(resolve, 100));
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  },

  vouchReceived: async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await new Promise((resolve) => setTimeout(resolve, 80));
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await new Promise((resolve) => setTimeout(resolve, 80));
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  },

  swipeAction: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),

  longPress: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium),

  selectionChanged: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),
};

export const playHapticPattern = async (pattern: keyof typeof HapticPatterns) => {
  try {
    await HapticPatterns[pattern]();
  } catch (error) {
    console.warn('Haptic feedback error:', error);
  }
};
