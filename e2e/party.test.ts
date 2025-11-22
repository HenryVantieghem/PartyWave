/**
 * Party Flow E2E Tests
 * Tests party discovery, creation, and interaction
 */

import { device, element, by, expect as detoxExpect, waitFor } from 'detox';

describe('Party Flow', () => {
  beforeAll(async () => {
    await device.launchApp();
    // Assume user is logged in for these tests
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  describe('Party Discovery', () => {
    it('should display party radar tab', async () => {
      await element(by.id('tab-radar')).tap();
      await detoxExpect(element(by.id('party-radar-screen'))).toBeVisible();
    });

    it('should display nearby parties', async () => {
      await element(by.id('tab-radar')).tap();
      await waitFor(element(by.id('party-card-0')))
        .toBeVisible()
        .withTimeout(3000);
    });

    it('should filter parties', async () => {
      await element(by.id('tab-radar')).tap();
      await element(by.id('filter-button')).tap();
      await element(by.text('Tonight')).tap();
      await element(by.id('apply-filters-button')).tap();

      await waitFor(element(by.id('party-card-0')))
        .toBeVisible()
        .withTimeout(2000);
    });

    it('should search parties', async () => {
      await element(by.id('tab-radar')).tap();
      await element(by.id('search-input')).typeText('House Party');
      await waitFor(element(by.text('House Party')))
        .toBeVisible()
        .withTimeout(2000);
    });
  });

  describe('Party Detail', () => {
    beforeEach(async () => {
      await element(by.id('tab-radar')).tap();
      await waitFor(element(by.id('party-card-0')))
        .toBeVisible()
        .withTimeout(3000);
      await element(by.id('party-card-0')).tap();
    });

    it('should display party details', async () => {
      await detoxExpect(element(by.id('party-detail-header'))).toBeVisible();
      await detoxExpect(element(by.id('party-description'))).toBeVisible();
      await detoxExpect(element(by.id('party-host-info'))).toBeVisible();
      await detoxExpect(element(by.id('party-attendees'))).toBeVisible();
    });

    it('should join party', async () => {
      await element(by.id('join-party-button')).tap();
      await waitFor(element(by.text('You\'re Going!')))
        .toBeVisible()
        .withTimeout(2000);
    });

    it('should leave party', async () => {
      // Join first
      await element(by.id('join-party-button')).tap();
      await waitFor(element(by.id('leave-party-button')))
        .toBeVisible()
        .withTimeout(2000);

      // Then leave
      await element(by.id('leave-party-button')).tap();
      await waitFor(element(by.id('join-party-button')))
        .toBeVisible()
        .withTimeout(2000);
    });

    it('should share party', async () => {
      await element(by.id('share-party-button')).tap();
      // Share sheet should open (platform-specific)
    });

    it('should check in to party', async () => {
      // Assumes user has joined
      await element(by.id('join-party-button')).tap();
      await waitFor(element(by.id('check-in-button')))
        .toBeVisible()
        .withTimeout(2000);

      await element(by.id('check-in-button')).tap();
      await waitFor(element(by.text('Checked In!')))
        .toBeVisible()
        .withTimeout(2000);
    });
  });

  describe('Party Creation', () => {
    beforeEach(async () => {
      await element(by.id('tab-radar')).tap();
      await element(by.id('create-party-fab')).tap();
    });

    it('should display party creation form', async () => {
      await detoxExpect(element(by.id('party-name-input'))).toBeVisible();
      await detoxExpect(element(by.id('party-description-input'))).toBeVisible();
      await detoxExpect(element(by.id('party-location-input'))).toBeVisible();
    });

    it('should validate required fields', async () => {
      await element(by.id('create-party-button')).tap();
      await waitFor(element(by.text('Party name is required')))
        .toBeVisible()
        .withTimeout(2000);
    });

    it('should upload party photo', async () => {
      await element(by.id('upload-photo-button')).tap();
      // Photo picker should open (platform-specific)
    });

    it('should select date and time', async () => {
      await element(by.id('date-time-picker')).tap();
      // Date picker should open
      await detoxExpect(element(by.id('date-picker-modal'))).toBeVisible();
    });

    it('should create private party', async () => {
      await element(by.id('party-name-input')).typeText('Test Party');
      await element(by.id('party-description-input')).typeText('Test Description');
      await element(by.id('party-location-input')).typeText('Test Location');
      await element(by.id('private-toggle')).tap();
      await element(by.id('create-party-button')).tap();

      await waitFor(element(by.text('Party Created!')))
        .toBeVisible()
        .withTimeout(3000);
    });
  });

  describe('Party Pulse', () => {
    beforeEach(async () => {
      await element(by.id('tab-radar')).tap();
      await waitFor(element(by.id('party-card-0')))
        .toBeVisible()
        .withTimeout(3000);
      await element(by.id('party-card-0')).tap();
    });

    it('should display live pulse metrics', async () => {
      await detoxExpect(element(by.id('party-pulse-container'))).toBeVisible();
      await detoxExpect(element(by.id('energy-meter'))).toBeVisible();
      await detoxExpect(element(by.id('active-count'))).toBeVisible();
    });

    it('should rate vibe', async () => {
      await element(by.id('rate-vibe-button')).tap();
      await element(by.id('vibe-star-5')).tap();
      await waitFor(element(by.text('Thanks for rating!')))
        .toBeVisible()
        .withTimeout(2000);
    });

    it('should update energy level', async () => {
      await element(by.id('energy-slider')).swipe('right');
      await waitFor(element(by.text('Energy updated!')))
        .toBeVisible()
        .withTimeout(2000);
    });
  });

  describe('Party Memories', () => {
    beforeEach(async () => {
      await element(by.id('tab-radar')).tap();
      await waitFor(element(by.id('party-card-0')))
        .toBeVisible()
        .withTimeout(3000);
      await element(by.id('party-card-0')).tap();
      await element(by.id('memories-tab')).tap();
    });

    it('should display memories grid', async () => {
      await detoxExpect(element(by.id('memories-grid'))).toBeVisible();
    });

    it('should upload memory', async () => {
      await element(by.id('upload-memory-button')).tap();
      // Photo picker should open
    });

    it('should like memory', async () => {
      await waitFor(element(by.id('memory-0')))
        .toBeVisible()
        .withTimeout(2000);
      await element(by.id('memory-0-like-button')).tap();
      await waitFor(element(by.id('memory-0-liked')))
        .toBeVisible()
        .withTimeout(1000);
    });
  });
});
