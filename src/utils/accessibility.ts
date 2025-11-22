/**
 * Accessibility utilities for PartyWave
 * Ensures WCAG 2.1 AA compliance
 */

export const AccessibilityLabels = {
  // Navigation
  backButton: 'Go back',
  closeButton: 'Close',
  menuButton: 'Open menu',

  // Party actions
  joinParty: 'Join this party',
  leaveParty: 'Leave party',
  checkIn: 'Check in to party',
  shareParty: 'Share party with friends',

  // Crew actions
  joinCrew: 'Join this crew',
  leaveCrew: 'Leave crew',
  inviteToCrew: 'Invite to crew',
  vouchForUser: 'Vouch for this user',

  // Forms
  partyName: 'Party name input',
  partyDescription: 'Party description input',
  partyLocation: 'Party location input',
  partyDateTime: 'Party date and time picker',

  // Images
  partyPhoto: 'Party photo',
  profilePhoto: 'Profile photo',
  crewAvatar: 'Crew avatar',
};

export const AccessibilityHints = {
  // Navigation
  backButton: 'Returns to the previous screen',
  tabBar: (label: string) => `Navigates to ${label} tab`,

  // Actions
  likeButton: 'Double tap to like',
  shareButton: 'Opens share menu',
  moreOptions: 'Opens additional options',

  // Forms
  dateTimePicker: 'Opens date and time selection',
  imagePicker: 'Opens image selection',
  locationPicker: 'Opens location selection',
};

export function getAccessibleColor(foreground: string, background: string): boolean {
  // Simple contrast ratio check (WCAG AA requires 4.5:1 for normal text)
  const fgLuminance = getLuminance(foreground);
  const bgLuminance = getLuminance(background);

  const contrast = (Math.max(fgLuminance, bgLuminance) + 0.05) / (Math.min(fgLuminance, bgLuminance) + 0.05);

  return contrast >= 4.5;
}

function getLuminance(color: string): number {
  // Basic luminance calculation
  const rgb = hexToRgb(color);
  if (!rgb) return 0;

  const [r, g, b] = [rgb.r, rgb.g, rgb.b].map((val) => {
    val /= 255;
    return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
  });

  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

export function formatAccessibleDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
  });
}

export function announceForAccessibility(message: string): void {
  // This would integrate with react-native-accessibility-info
  console.log('[A11Y]', message);
}
