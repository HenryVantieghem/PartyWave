/**
 * Authentication Flow E2E Tests
 * Tests login, signup, and onboarding flows
 */

import { device, element, by, expect as detoxExpect, waitFor } from 'detox';

describe('Authentication Flow', () => {
  beforeAll(async () => {
    await device.launchApp();
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  describe('Onboarding', () => {
    it('should display onboarding screens', async () => {
      await detoxExpect(element(by.text('Find Your Vibe'))).toBeVisible();
    });

    it('should navigate through onboarding slides', async () => {
      // Swipe through onboarding
      await element(by.id('onboarding-container')).swipe('left');
      await detoxExpect(element(by.text('Join Your Crew'))).toBeVisible();

      await element(by.id('onboarding-container')).swipe('left');
      await detoxExpect(element(by.text('Live the Moment'))).toBeVisible();
    });

    it('should navigate to login from onboarding', async () => {
      await element(by.id('onboarding-container')).swipe('left');
      await element(by.id('onboarding-container')).swipe('left');
      await element(by.id('get-started-button')).tap();
      await detoxExpect(element(by.text('Welcome Back'))).toBeVisible();
    });
  });

  describe('Login', () => {
    beforeEach(async () => {
      // Navigate to login screen
      await element(by.id('get-started-button')).tap();
    });

    it('should display login form', async () => {
      await detoxExpect(element(by.id('email-input'))).toBeVisible();
      await detoxExpect(element(by.id('password-input'))).toBeVisible();
      await detoxExpect(element(by.id('login-button'))).toBeVisible();
    });

    it('should show error for invalid email', async () => {
      await element(by.id('email-input')).typeText('invalid-email');
      await element(by.id('password-input')).typeText('password123');
      await element(by.id('login-button')).tap();

      await waitFor(element(by.text('Invalid email address')))
        .toBeVisible()
        .withTimeout(2000);
    });

    it('should show error for empty password', async () => {
      await element(by.id('email-input')).typeText('test@example.com');
      await element(by.id('login-button')).tap();

      await waitFor(element(by.text('Password is required')))
        .toBeVisible()
        .withTimeout(2000);
    });

    it('should navigate to signup', async () => {
      await element(by.id('signup-link')).tap();
      await detoxExpect(element(by.text('Create Account'))).toBeVisible();
    });

    it('should toggle password visibility', async () => {
      await element(by.id('password-input')).typeText('password123');
      await element(by.id('toggle-password-button')).tap();
      // Password should now be visible
      await detoxExpect(element(by.id('password-input'))).toHaveText('password123');
    });
  });

  describe('Signup', () => {
    beforeEach(async () => {
      await element(by.id('get-started-button')).tap();
      await element(by.id('signup-link')).tap();
    });

    it('should display signup form', async () => {
      await detoxExpect(element(by.id('full-name-input'))).toBeVisible();
      await detoxExpect(element(by.id('email-input'))).toBeVisible();
      await detoxExpect(element(by.id('password-input'))).toBeVisible();
      await detoxExpect(element(by.id('signup-button'))).toBeVisible();
    });

    it('should show error for short password', async () => {
      await element(by.id('full-name-input')).typeText('Test User');
      await element(by.id('email-input')).typeText('test@example.com');
      await element(by.id('password-input')).typeText('12345');
      await element(by.id('signup-button')).tap();

      await waitFor(element(by.text('Password must be at least 6 characters')))
        .toBeVisible()
        .withTimeout(2000);
    });

    it('should navigate back to login', async () => {
      await element(by.id('login-link')).tap();
      await detoxExpect(element(by.text('Welcome Back'))).toBeVisible();
    });
  });

  describe('Session Persistence', () => {
    it('should persist login session after app restart', async () => {
      // This test assumes a logged-in state
      await device.reloadReactNative();
      await waitFor(element(by.id('tab-bar')))
        .toBeVisible()
        .withTimeout(3000);
    });
  });
});
