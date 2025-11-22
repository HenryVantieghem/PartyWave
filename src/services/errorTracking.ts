import * as Sentry from '@sentry/react-native';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

/**
 * Error Tracking Service
 * Integrates Sentry for error tracking and performance monitoring
 */

const SENTRY_DSN = process.env.EXPO_PUBLIC_SENTRY_DSN || '';

export function initializeErrorTracking() {
  if (!SENTRY_DSN) {
    console.warn('Sentry DSN not configured. Error tracking disabled.');
    return;
  }

  Sentry.init({
    dsn: SENTRY_DSN,
    debug: __DEV__,
    environment: __DEV__ ? 'development' : 'production',
    enableAutoSessionTracking: true,
    sessionTrackingIntervalMillis: 30000,

    // Performance Monitoring
    tracesSampleRate: __DEV__ ? 1.0 : 0.2, // Sample 20% in production

    // Release tracking
    release: Constants.expoConfig?.version || '1.0.0',
    dist: Platform.select({
      ios: Constants.expoConfig?.ios?.buildNumber,
      android: Constants.expoConfig?.android?.versionCode?.toString(),
    }),

    // Integrations
    integrations: [
      new Sentry.ReactNativeTracing({
        routingInstrumentation: new Sentry.ReactNavigationInstrumentation(),
        tracingOrigins: ['localhost', /^\//],
      }),
    ],

    // Before send hook for filtering
    beforeSend(event, hint) {
      // Filter out development errors
      if (__DEV__) {
        console.log('Sentry Event:', event);
        console.log('Sentry Hint:', hint);
      }

      // Don't send network errors in development
      if (__DEV__ && event.exception?.values?.[0]?.type === 'NetworkError') {
        return null;
      }

      return event;
    },

    // Breadcrumb filtering
    beforeBreadcrumb(breadcrumb) {
      // Filter out console logs in production
      if (!__DEV__ && breadcrumb.category === 'console') {
        return null;
      }

      return breadcrumb;
    },
  });
}

/**
 * Log custom error
 */
export function logError(error: Error, context?: Record<string, any>) {
  console.error('Error logged:', error, context);

  Sentry.captureException(error, {
    contexts: context ? { custom: context } : undefined,
  });
}

/**
 * Log custom message
 */
export function logMessage(message: string, level: Sentry.SeverityLevel = 'info') {
  console.log(`[${level}]`, message);

  Sentry.captureMessage(message, level);
}

/**
 * Set user context
 */
export function setUser(user: { id: string; email?: string; username?: string } | null) {
  if (user) {
    Sentry.setUser({
      id: user.id,
      email: user.email,
      username: user.username,
    });
  } else {
    Sentry.setUser(null);
  }
}

/**
 * Add breadcrumb for user actions
 */
export function addBreadcrumb(
  category: string,
  message: string,
  data?: Record<string, any>,
  level: Sentry.SeverityLevel = 'info'
) {
  Sentry.addBreadcrumb({
    category,
    message,
    data,
    level,
    timestamp: Date.now() / 1000,
  });
}

/**
 * Start performance transaction
 */
export function startTransaction(name: string, op: string) {
  return Sentry.startTransaction({
    name,
    op,
  });
}

/**
 * Common breadcrumb helpers
 */
export const Breadcrumbs = {
  navigation: (screen: string, params?: any) => {
    addBreadcrumb('navigation', `Navigated to ${screen}`, params);
  },

  userAction: (action: string, data?: any) => {
    addBreadcrumb('user', action, data);
  },

  apiCall: (endpoint: string, method: string, status?: number) => {
    addBreadcrumb('api', `${method} ${endpoint}`, { status });
  },

  stateChange: (store: string, action: string, data?: any) => {
    addBreadcrumb('state', `${store}: ${action}`, data);
  },
};

/**
 * Performance monitoring helpers
 */
export const Performance = {
  /**
   * Measure screen load time
   */
  measureScreenLoad: (screenName: string) => {
    const transaction = startTransaction(`Screen Load: ${screenName}`, 'navigation');

    return {
      finish: () => transaction.finish(),
      setData: (data: Record<string, any>) => {
        Object.entries(data).forEach(([key, value]) => {
          transaction.setData(key, value);
        });
      },
    };
  },

  /**
   * Measure API call
   */
  measureApiCall: (endpoint: string, method: string) => {
    const transaction = startTransaction(`API: ${method} ${endpoint}`, 'http');

    return {
      finish: (status?: number) => {
        if (status) {
          transaction.setHttpStatus(status);
        }
        transaction.finish();
      },
      setData: (data: Record<string, any>) => {
        Object.entries(data).forEach(([key, value]) => {
          transaction.setData(key, value);
        });
      },
    };
  },

  /**
   * Measure custom operation
   */
  measureOperation: (operationName: string) => {
    const transaction = startTransaction(operationName, 'task');

    return {
      finish: () => transaction.finish(),
      setData: (data: Record<string, any>) => {
        Object.entries(data).forEach(([key, value]) => {
          transaction.setData(key, value);
        });
      },
    };
  },
};

export default {
  init: initializeErrorTracking,
  logError,
  logMessage,
  setUser,
  addBreadcrumb,
  startTransaction,
  Breadcrumbs,
  Performance,
};
