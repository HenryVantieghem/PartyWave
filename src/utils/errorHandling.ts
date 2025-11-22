// ============================================
// ERROR HANDLING UTILITIES
// ============================================
// Centralized error handling and user feedback
// ============================================

import { Alert } from 'react-native';
import * as Haptics from 'expo-haptics';

export interface AppError {
  message: string;
  code?: string;
  details?: any;
}

export class CrewError extends Error {
  code: string;
  details?: any;

  constructor(message: string, code: string, details?: any) {
    super(message);
    this.name = 'CrewError';
    this.code = code;
    this.details = details;
  }
}

// ============================================
// Error Type Checks
// ============================================

export function isNetworkError(error: any): boolean {
  return (
    error?.message?.includes('network') ||
    error?.message?.includes('fetch') ||
    error?.code === 'NETWORK_ERROR'
  );
}

export function isAuthError(error: any): boolean {
  return (
    error?.message?.includes('auth') ||
    error?.message?.includes('JWT') ||
    error?.code === 'PGRST301' || // Supabase auth error
    error?.code === 'AUTH_ERROR'
  );
}

export function isPermissionError(error: any): boolean {
  return (
    error?.message?.includes('permission') ||
    error?.message?.includes('access denied') ||
    error?.code === 'PERMISSION_DENIED' ||
    error?.code === '42501' // PostgreSQL insufficient privilege
  );
}

export function isValidationError(error: any): boolean {
  return (
    error?.message?.includes('validation') ||
    error?.message?.includes('invalid') ||
    error?.code === 'VALIDATION_ERROR' ||
    error?.code === '23514' // PostgreSQL check violation
  );
}

// ============================================
// User-Friendly Error Messages
// ============================================

export function getErrorMessage(error: any): string {
  if (!error) return 'An unknown error occurred';

  // Network errors
  if (isNetworkError(error)) {
    return 'Network error. Please check your connection and try again.';
  }

  // Auth errors
  if (isAuthError(error)) {
    return 'Authentication error. Please sign in again.';
  }

  // Permission errors
  if (isPermissionError(error)) {
    return 'You don\'t have permission to perform this action.';
  }

  // Validation errors
  if (isValidationError(error)) {
    return error.message || 'Invalid input. Please check your data.';
  }

  // Supabase specific errors
  if (error?.code === '23505') {
    return 'This item already exists.';
  }

  if (error?.code === '23503') {
    return 'Cannot complete action due to related data.';
  }

  // Generic error message
  return error.message || 'Something went wrong. Please try again.';
}

// ============================================
// Error Display Functions
// ============================================

export function showError(error: any, title: string = 'Error') {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  const message = getErrorMessage(error);

  Alert.alert(title, message, [
    { text: 'OK', style: 'default' }
  ]);
}

export function showErrorWithRetry(
  error: any,
  onRetry: () => void,
  title: string = 'Error'
) {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  const message = getErrorMessage(error);

  Alert.alert(title, message, [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Retry', onPress: onRetry }
  ]);
}

export function showSuccess(message: string, title: string = 'Success') {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  Alert.alert(title, message, [
    { text: 'OK', style: 'default' }
  ]);
}

// ============================================
// Error Logging
// ============================================

export function logError(error: any, context?: string) {
  const timestamp = new Date().toISOString();
  const errorDetails = {
    timestamp,
    context,
    message: error?.message,
    code: error?.code,
    stack: error?.stack,
    details: error?.details,
  };

  // Log to console in development
  if (__DEV__) {
    console.error('[Error]', errorDetails);
  }

  // TODO: Send to error tracking service (Sentry, LogRocket, etc.)
  // Example: Sentry.captureException(error, { extra: errorDetails });
}

// ============================================
// Async Error Handler Wrapper
// ============================================

export function withErrorHandling<T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  context?: string
): (...args: T) => Promise<R | null> {
  return async (...args: T): Promise<R | null> => {
    try {
      return await fn(...args);
    } catch (error) {
      logError(error, context);
      showError(error);
      return null;
    }
  };
}

export function withErrorHandlingNoAlert<T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  context?: string
): (...args: T) => Promise<R | null> {
  return async (...args: T): Promise<R | null> => {
    try {
      return await fn(...args);
    } catch (error) {
      logError(error, context);
      return null;
    }
  };
}
