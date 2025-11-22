/**
 * Crew Flow E2E Tests
 * Tests crew creation, discovery, and management
 */

import { device, element, by, expect as detoxExpect, waitFor } from 'detox';

describe('Crew Flow', () => {
  beforeAll(async () => {
    await device.launchApp();
    // Assume user is logged in
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  describe('Crew List', () => {
    beforeEach(async () => {
      await element(by.id('tab-crew')).tap();
    });

    it('should display crews tab', async () => {
      await detoxExpect(element(by.id('crew-list-screen'))).toBeVisible();
    });

    it('should display user crews', async () => {
      await waitFor(element(by.id('crew-card-0')))
        .toBeVisible()
        .withTimeout(3000);
    });

    it('should navigate to crew detail', async () => {
      await waitFor(element(by.id('crew-card-0')))
        .toBeVisible()
        .withTimeout(3000);
      await element(by.id('crew-card-0')).tap();
      await detoxExpect(element(by.id('crew-detail-screen'))).toBeVisible();
    });

    it('should open create crew modal', async () => {
      await element(by.id('create-crew-button')).tap();
      await detoxExpect(element(by.id('create-crew-modal'))).toBeVisible();
    });
  });

  describe('Crew Creation', () => {
    beforeEach(async () => {
      await element(by.id('tab-crew')).tap();
      await element(by.id('create-crew-button')).tap();
    });

    it('should display crew creation form', async () => {
      await detoxExpect(element(by.id('crew-name-input'))).toBeVisible();
      await detoxExpect(element(by.id('crew-description-input'))).toBeVisible();
      await detoxExpect(element(by.id('crew-type-select'))).toBeVisible();
    });

    it('should validate required fields', async () => {
      await element(by.id('create-crew-submit-button')).tap();
      await waitFor(element(by.text('Crew name is required')))
        .toBeVisible()
        .withTimeout(2000);
    });

    it('should select crew type', async () => {
      await element(by.id('crew-type-select')).tap();
      await element(by.text('Social')).tap();
      await detoxExpect(element(by.id('crew-type-selected-social'))).toBeVisible();
    });

    it('should create public crew', async () => {
      await element(by.id('crew-name-input')).typeText('Test Crew');
      await element(by.id('crew-description-input')).typeText('Test Description');
      await element(by.id('crew-type-select')).tap();
      await element(by.text('Social')).tap();
      await element(by.id('create-crew-submit-button')).tap();

      await waitFor(element(by.text('Crew Created!')))
        .toBeVisible()
        .withTimeout(3000);
    });

    it('should create private crew', async () => {
      await element(by.id('crew-name-input')).typeText('Private Crew');
      await element(by.id('crew-description-input')).typeText('Private Description');
      await element(by.id('private-toggle')).tap();
      await element(by.id('create-crew-submit-button')).tap();

      await waitFor(element(by.text('Crew Created!')))
        .toBeVisible()
        .withTimeout(3000);
    });
  });

  describe('Crew Detail', () => {
    beforeEach(async () => {
      await element(by.id('tab-crew')).tap();
      await waitFor(element(by.id('crew-card-0')))
        .toBeVisible()
        .withTimeout(3000);
      await element(by.id('crew-card-0')).tap();
    });

    it('should display crew details', async () => {
      await detoxExpect(element(by.id('crew-name'))).toBeVisible();
      await detoxExpect(element(by.id('crew-stats'))).toBeVisible();
      await detoxExpect(element(by.id('crew-members-list'))).toBeVisible();
    });

    it('should navigate to activity feed', async () => {
      await element(by.id('activity-tab')).tap();
      await detoxExpect(element(by.id('activity-feed'))).toBeVisible();
    });

    it('should navigate to quick plans', async () => {
      await element(by.id('quick-plans-tab')).tap();
      await detoxExpect(element(by.id('quick-plans-list'))).toBeVisible();
    });

    it('should create quick plan', async () => {
      await element(by.id('quick-plans-tab')).tap();
      await element(by.id('create-quick-plan-button')).tap();
      await element(by.id('quick-plan-title-input')).typeText('Drinks Tonight?');
      await element(by.id('create-quick-plan-submit')).tap();

      await waitFor(element(by.text('Quick Plan Created!')))
        .toBeVisible()
        .withTimeout(2000);
    });

    it('should vote on quick plan', async () => {
      await element(by.id('quick-plans-tab')).tap();
      await waitFor(element(by.id('quick-plan-0')))
        .toBeVisible()
        .withTimeout(2000);
      await element(by.id('quick-plan-0-vote-up')).tap();

      await waitFor(element(by.id('quick-plan-0-voted')))
        .toBeVisible()
        .withTimeout(1000);
    });

    it('should vouch for member', async () => {
      await element(by.id('members-tab')).tap();
      await waitFor(element(by.id('member-card-0')))
        .toBeVisible()
        .withTimeout(2000);
      await element(by.id('member-card-0-vouch-button')).tap();

      await waitFor(element(by.text('Vouch sent!')))
        .toBeVisible()
        .withTimeout(2000);
    });
  });

  describe('Crew Discovery', () => {
    beforeEach(async () => {
      await element(by.id('tab-crew')).tap();
      await element(by.id('discover-crews-button')).tap();
    });

    it('should display discovery screen', async () => {
      await detoxExpect(element(by.id('discover-screen'))).toBeVisible();
    });

    it('should display recommended crews', async () => {
      await waitFor(element(by.id('recommended-crew-0')))
        .toBeVisible()
        .withTimeout(3000);
    });

    it('should filter by crew type', async () => {
      await element(by.id('filter-type-social')).tap();
      await waitFor(element(by.id('recommended-crew-0')))
        .toBeVisible()
        .withTimeout(2000);
    });

    it('should search crews', async () => {
      await element(by.id('search-crews-button')).tap();
      await detoxExpect(element(by.id('search-screen'))).toBeVisible();
      await element(by.id('search-input')).typeText('Tech');
      await waitFor(element(by.id('search-result-0')))
        .toBeVisible()
        .withTimeout(2000);
    });

    it('should request to join crew', async () => {
      await waitFor(element(by.id('recommended-crew-0')))
        .toBeVisible()
        .withTimeout(3000);
      await element(by.id('recommended-crew-0-join-button')).tap();

      await waitFor(element(by.text('Request sent!')))
        .toBeVisible()
        .withTimeout(2000);
    });
  });

  describe('Crew Management', () => {
    beforeEach(async () => {
      await element(by.id('tab-crew')).tap();
      await waitFor(element(by.id('crew-card-0')))
        .toBeVisible()
        .withTimeout(3000);
      await element(by.id('crew-card-0')).tap();
      await element(by.id('manage-crew-button')).tap();
    });

    it('should display management options', async () => {
      await detoxExpect(element(by.id('edit-crew-button'))).toBeVisible();
      await detoxExpect(element(by.id('invite-members-button'))).toBeVisible();
      await detoxExpect(element(by.id('member-requests-button'))).toBeVisible();
    });

    it('should edit crew details', async () => {
      await element(by.id('edit-crew-button')).tap();
      await element(by.id('crew-name-input')).clearText();
      await element(by.id('crew-name-input')).typeText('Updated Crew Name');
      await element(by.id('save-crew-button')).tap();

      await waitFor(element(by.text('Crew updated!')))
        .toBeVisible()
        .withTimeout(2000);
    });

    it('should invite members', async () => {
      await element(by.id('invite-members-button')).tap();
      await element(by.id('search-users-input')).typeText('John');
      await waitFor(element(by.id('user-result-0')))
        .toBeVisible()
        .withTimeout(2000);
      await element(by.id('user-result-0-invite')).tap();

      await waitFor(element(by.text('Invite sent!')))
        .toBeVisible()
        .withTimeout(2000);
    });

    it('should approve member request', async () => {
      await element(by.id('member-requests-button')).tap();
      await waitFor(element(by.id('request-0')))
        .toBeVisible()
        .withTimeout(2000);
      await element(by.id('request-0-approve')).tap();

      await waitFor(element(by.text('Member approved!')))
        .toBeVisible()
        .withTimeout(2000);
    });

    it('should remove member', async () => {
      await element(by.id('members-list-button')).tap();
      await waitFor(element(by.id('member-card-0')))
        .toBeVisible()
        .withTimeout(2000);
      await element(by.id('member-card-0-remove')).tap();
      await element(by.text('Confirm')).tap();

      await waitFor(element(by.text('Member removed!')))
        .toBeVisible()
        .withTimeout(2000);
    });
  });
});
