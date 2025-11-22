import * as Analytics from 'expo-firebase-analytics';
import { Platform } from 'react-native';

/**
 * Analytics Service
 * Tracks user events and behaviors for product insights
 */

export interface AnalyticsEvent {
  name: string;
  params?: Record<string, any>;
}

class AnalyticsService {
  private static instance: AnalyticsService;
  private enabled: boolean = !__DEV__;

  private constructor() {
    this.initializeAnalytics();
  }

  static getInstance(): AnalyticsService {
    if (!AnalyticsService.instance) {
      AnalyticsService.instance = new AnalyticsService();
    }
    return AnalyticsService.instance;
  }

  private async initializeAnalytics() {
    if (this.enabled) {
      await Analytics.setAnalyticsCollectionEnabled(true);
    }
  }

  /**
   * Track custom event
   */
  async trackEvent(eventName: string, params?: Record<string, any>) {
    if (!this.enabled) {
      console.log('[Analytics]', eventName, params);
      return;
    }

    try {
      await Analytics.logEvent(eventName, params);
    } catch (error) {
      console.error('Analytics error:', error);
    }
  }

  /**
   * Set user properties
   */
  async setUserProperties(properties: Record<string, string>) {
    if (!this.enabled) {
      console.log('[Analytics] User Properties:', properties);
      return;
    }

    try {
      for (const [key, value] of Object.entries(properties)) {
        await Analytics.setUserProperty(key, value);
      }
    } catch (error) {
      console.error('Analytics error:', error);
    }
  }

  /**
   * Set user ID
   */
  async setUserId(userId: string | null) {
    if (!this.enabled) {
      console.log('[Analytics] User ID:', userId);
      return;
    }

    try {
      await Analytics.setUserId(userId);
    } catch (error) {
      console.error('Analytics error:', error);
    }
  }

  /**
   * Track screen view
   */
  async trackScreenView(screenName: string, screenClass?: string) {
    if (!this.enabled) {
      console.log('[Analytics] Screen View:', screenName, screenClass);
      return;
    }

    try {
      await Analytics.setCurrentScreen(screenName, screenClass);
    } catch (error) {
      console.error('Analytics error:', error);
    }
  }
}

export const analyticsService = AnalyticsService.getInstance();

/**
 * Predefined Events
 */
export const AnalyticsEvents = {
  // Authentication
  signup: (method: string) =>
    analyticsService.trackEvent('sign_up', { method }),

  login: (method: string) =>
    analyticsService.trackEvent('login', { method }),

  logout: () =>
    analyticsService.trackEvent('logout'),

  // Party Events
  partyViewed: (partyId: string, partyName: string) =>
    analyticsService.trackEvent('party_viewed', {
      party_id: partyId,
      party_name: partyName,
    }),

  partyJoined: (partyId: string, partyName: string) =>
    analyticsService.trackEvent('party_joined', {
      party_id: partyId,
      party_name: partyName,
    }),

  partyLeft: (partyId: string) =>
    analyticsService.trackEvent('party_left', {
      party_id: partyId,
    }),

  partyCreated: (partyId: string, partyType: string, isPrivate: boolean) =>
    analyticsService.trackEvent('party_created', {
      party_id: partyId,
      party_type: partyType,
      is_private: isPrivate,
    }),

  partyCheckIn: (partyId: string) =>
    analyticsService.trackEvent('party_check_in', {
      party_id: partyId,
    }),

  partyShared: (partyId: string, method: string) =>
    analyticsService.trackEvent('share', {
      content_type: 'party',
      item_id: partyId,
      method,
    }),

  // Crew Events
  crewViewed: (crewId: string, crewName: string) =>
    analyticsService.trackEvent('crew_viewed', {
      crew_id: crewId,
      crew_name: crewName,
    }),

  crewJoined: (crewId: string, crewName: string) =>
    analyticsService.trackEvent('crew_joined', {
      crew_id: crewId,
      crew_name: crewName,
    }),

  crewCreated: (crewId: string, crewType: string, isPrivate: boolean) =>
    analyticsService.trackEvent('crew_created', {
      crew_id: crewId,
      crew_type: crewType,
      is_private: isPrivate,
    }),

  crewLeft: (crewId: string) =>
    analyticsService.trackEvent('crew_left', {
      crew_id: crewId,
    }),

  // Social Events
  vouchGiven: (voucheeId: string) =>
    analyticsService.trackEvent('vouch_given', {
      vouchee_id: voucheeId,
    }),

  messageSent: (recipientId: string, messageType: string) =>
    analyticsService.trackEvent('message_sent', {
      recipient_id: recipientId,
      message_type: messageType,
    }),

  // Engagement Events
  searchPerformed: (searchType: string, query: string, resultsCount: number) =>
    analyticsService.trackEvent('search', {
      search_term: query,
      search_type: searchType,
      results_count: resultsCount,
    }),

  filterApplied: (filterType: string, filterValue: string) =>
    analyticsService.trackEvent('filter_applied', {
      filter_type: filterType,
      filter_value: filterValue,
    }),

  // Media Events
  photoUploaded: (context: string) =>
    analyticsService.trackEvent('photo_uploaded', {
      context,
    }),

  photoLiked: (photoId: string) =>
    analyticsService.trackEvent('photo_liked', {
      photo_id: photoId,
    }),

  // Notifications
  notificationReceived: (notificationType: string) =>
    analyticsService.trackEvent('notification_received', {
      notification_type: notificationType,
    }),

  notificationOpened: (notificationType: string) =>
    analyticsService.trackEvent('notification_opened', {
      notification_type: notificationType,
    }),

  // Onboarding
  onboardingStarted: () =>
    analyticsService.trackEvent('onboarding_started'),

  onboardingCompleted: (duration: number) =>
    analyticsService.trackEvent('onboarding_completed', {
      duration_seconds: Math.round(duration / 1000),
    }),

  onboardingSkipped: (step: number) =>
    analyticsService.trackEvent('onboarding_skipped', {
      step,
    }),

  // Settings
  settingChanged: (settingName: string, newValue: any) =>
    analyticsService.trackEvent('setting_changed', {
      setting_name: settingName,
      new_value: String(newValue),
    }),

  // Errors
  errorOccurred: (errorType: string, errorMessage: string) =>
    analyticsService.trackEvent('error_occurred', {
      error_type: errorType,
      error_message: errorMessage,
    }),
};

/**
 * User Properties
 */
export const setUserProperties = {
  profile: (properties: {
    age_group?: string;
    gender?: string;
    location?: string;
    interests?: string[];
  }) => {
    const props: Record<string, string> = {};

    if (properties.age_group) props.age_group = properties.age_group;
    if (properties.gender) props.gender = properties.gender;
    if (properties.location) props.location = properties.location;
    if (properties.interests) props.interests = properties.interests.join(',');

    analyticsService.setUserProperties(props);
  },

  activity: (properties: {
    parties_attended?: number;
    crews_joined?: number;
    vouches_received?: number;
  }) => {
    const props: Record<string, string> = {};

    if (properties.parties_attended !== undefined) {
      props.parties_attended = String(properties.parties_attended);
    }
    if (properties.crews_joined !== undefined) {
      props.crews_joined = String(properties.crews_joined);
    }
    if (properties.vouches_received !== undefined) {
      props.vouches_received = String(properties.vouches_received);
    }

    analyticsService.setUserProperties(props);
  },
};

export default {
  service: analyticsService,
  events: AnalyticsEvents,
  setUserProperties,
};
