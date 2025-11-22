import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { supabase } from '@/lib/supabase';

/**
 * Push Notification Service
 * Handles push notification setup, permissions, and token management
 */

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export interface PushNotificationData {
  type: 'party_invite' | 'crew_invite' | 'vouch' | 'message' | 'party_start' | 'energy_spike';
  title: string;
  body: string;
  data?: Record<string, any>;
}

class PushNotificationService {
  private static instance: PushNotificationService;
  private pushToken: string | null = null;

  private constructor() {}

  static getInstance(): PushNotificationService {
    if (!PushNotificationService.instance) {
      PushNotificationService.instance = new PushNotificationService();
    }
    return PushNotificationService.instance;
  }

  /**
   * Request push notification permissions
   */
  async requestPermissions(): Promise<boolean> {
    if (!Device.isDevice) {
      console.warn('Push notifications only work on physical devices');
      return false;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.warn('Push notification permission not granted');
      return false;
    }

    return true;
  }

  /**
   * Get push notification token
   */
  async getPushToken(): Promise<string | null> {
    if (this.pushToken) {
      return this.pushToken;
    }

    if (!Device.isDevice) {
      return null;
    }

    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        return null;
      }

      const token = await Notifications.getExpoPushTokenAsync({
        projectId: 'your-project-id', // Replace with actual EAS project ID
      });

      this.pushToken = token.data;
      return this.pushToken;
    } catch (error) {
      console.error('Error getting push token:', error);
      return null;
    }
  }

  /**
   * Register push token with backend
   */
  async registerPushToken(userId: string): Promise<void> {
    const token = await this.getPushToken();
    if (!token) {
      console.warn('No push token available');
      return;
    }

    try {
      const { error } = await supabase.from('push_tokens').upsert({
        user_id: userId,
        token,
        platform: Platform.OS,
        updated_at: new Date().toISOString(),
      });

      if (error) {
        console.error('Error registering push token:', error);
      }
    } catch (error) {
      console.error('Error registering push token:', error);
    }
  }

  /**
   * Unregister push token
   */
  async unregisterPushToken(userId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('push_tokens')
        .delete()
        .eq('user_id', userId)
        .eq('platform', Platform.OS);

      if (error) {
        console.error('Error unregistering push token:', error);
      }

      this.pushToken = null;
    } catch (error) {
      console.error('Error unregistering push token:', error);
    }
  }

  /**
   * Schedule local notification
   */
  async scheduleLocalNotification(
    notification: PushNotificationData,
    trigger?: Notifications.NotificationTriggerInput
  ): Promise<string> {
    const identifier = await Notifications.scheduleNotificationAsync({
      content: {
        title: notification.title,
        body: notification.body,
        data: { ...notification.data, type: notification.type },
        sound: true,
        badge: 1,
      },
      trigger: trigger || null,
    });

    return identifier;
  }

  /**
   * Cancel notification
   */
  async cancelNotification(identifier: string): Promise<void> {
    await Notifications.cancelScheduledNotificationAsync(identifier);
  }

  /**
   * Cancel all notifications
   */
  async cancelAllNotifications(): Promise<void> {
    await Notifications.cancelAllScheduledNotificationsAsync();
  }

  /**
   * Get badge count
   */
  async getBadgeCount(): Promise<number> {
    return await Notifications.getBadgeCountAsync();
  }

  /**
   * Set badge count
   */
  async setBadgeCount(count: number): Promise<void> {
    await Notifications.setBadgeCountAsync(count);
  }

  /**
   * Clear badge
   */
  async clearBadge(): Promise<void> {
    await Notifications.setBadgeCountAsync(0);
  }

  /**
   * Add notification received listener
   */
  addNotificationReceivedListener(
    listener: (notification: Notifications.Notification) => void
  ): Notifications.Subscription {
    return Notifications.addNotificationReceivedListener(listener);
  }

  /**
   * Add notification response listener (when user taps notification)
   */
  addNotificationResponseListener(
    listener: (response: Notifications.NotificationResponse) => void
  ): Notifications.Subscription {
    return Notifications.addNotificationResponseReceivedListener(listener);
  }

  /**
   * Remove notification listener
   */
  removeNotificationSubscription(subscription: Notifications.Subscription): void {
    Notifications.removeNotificationSubscription(subscription);
  }
}

export const pushNotificationService = PushNotificationService.getInstance();

/**
 * Notification Templates
 */
export const NotificationTemplates = {
  partyInvite: (partyName: string, hostName: string): PushNotificationData => ({
    type: 'party_invite',
    title: 'Party Invite!',
    body: `${hostName} invited you to ${partyName}`,
    data: { partyName, hostName },
  }),

  crewInvite: (crewName: string, inviterName: string): PushNotificationData => ({
    type: 'crew_invite',
    title: 'Crew Invite!',
    body: `${inviterName} invited you to join ${crewName}`,
    data: { crewName, inviterName },
  }),

  vouch: (voucherName: string): PushNotificationData => ({
    type: 'vouch',
    title: 'New Vouch!',
    body: `${voucherName} vouched for you`,
    data: { voucherName },
  }),

  message: (senderName: string, preview: string): PushNotificationData => ({
    type: 'message',
    title: `Message from ${senderName}`,
    body: preview,
    data: { senderName, preview },
  }),

  partyStart: (partyName: string, minutesUntil: number): PushNotificationData => ({
    type: 'party_start',
    title: 'Party Starting Soon!',
    body: `${partyName} starts in ${minutesUntil} minutes`,
    data: { partyName, minutesUntil },
  }),

  energySpike: (partyName: string, energyLevel: number): PushNotificationData => ({
    type: 'energy_spike',
    title: 'Party is LIT! 🔥',
    body: `Energy at ${partyName} just hit ${energyLevel}%!`,
    data: { partyName, energyLevel },
  }),
};
