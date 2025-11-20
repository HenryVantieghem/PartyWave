/**
 * THE HANGOUT - ENHANCED COLOR SYSTEM
 * Dark, energetic, nightlife-inspired palette
 */

export const Colors = {
  // Base - Pure black for that premium nightlife feel
  black: '#000000',
  background: '#000000',
  backgroundElevated: '#0a0a0a',

  // Cards & Surfaces - Dark with subtle elevation
  card: '#1a1a1a',
  cardHover: '#222222',
  surface: '#2a2a2a',
  surfaceLight: '#333333',

  // Primary - Coral Pink/Red (Party Energy)
  primary: '#FF6B6B',
  primaryLight: '#FF8787',
  primaryDark: '#EE5A52',
  primaryGradient: ['#FF6B6B', '#FF8787', '#FFB3B3'],

  // Secondary - Electric Cyan (Live/Active States)
  secondary: '#4ECDC4',
  secondaryLight: '#6ED3CB',
  secondaryDark: '#3DB8B0',
  secondaryGradient: ['#4ECDC4', '#95E1D3'],

  // Accent Colors
  accent: {
    gold: '#FFD93D',      // Premium/VIP
    purple: '#A78BFA',    // Special events
    green: '#00FF94',     // Live/Active
    blue: '#60A5FA',      // Info
    orange: '#FB923C',    // Hot/Trending
  },

  // Status Colors
  success: '#10B981',
  successLight: '#34D399',
  error: '#EF4444',
  errorLight: '#F87171',
  warning: '#F59E0B',
  warningLight: '#FBBF24',
  info: '#3B82F6',
  infoLight: '#60A5FA',

  // Live Indicators
  live: '#00FF94',
  livePulse: 'rgba(0, 255, 148, 0.3)',

  // Energy Levels (for party heat visualization)
  energy: {
    low: '#4B5563',
    medium: '#F59E0B',
    high: '#EF4444',
    insane: '#FF00FF',
  },

  // Text Colors
  text: {
    primary: '#FFFFFF',
    secondary: '#A0AEC0',
    tertiary: '#718096',
    disabled: '#4A5568',
    inverse: '#000000',
  },

  // Border Colors
  border: {
    default: '#2D3748',
    light: '#4A5568',
    dark: '#1A202C',
    primary: '#FF6B6B',
    glow: 'rgba(255, 107, 107, 0.3)',
  },

  // Overlay & Backdrop
  overlay: {
    light: 'rgba(0, 0, 0, 0.3)',
    medium: 'rgba(0, 0, 0, 0.5)',
    dark: 'rgba(0, 0, 0, 0.7)',
    darker: 'rgba(0, 0, 0, 0.9)',
  },

  // Glassmorphism
  glass: {
    background: 'rgba(26, 26, 26, 0.7)',
    border: 'rgba(255, 255, 255, 0.1)',
    highlight: 'rgba(255, 255, 255, 0.05)',
  },

  // Shadows (for glow effects)
  shadow: {
    primary: 'rgba(255, 107, 107, 0.5)',
    secondary: 'rgba(78, 205, 196, 0.5)',
    dark: 'rgba(0, 0, 0, 0.8)',
  },

  // Social Colors
  like: '#FF6B6B',
  love: '#FF1493',
  fire: '#FF4500',
  star: '#FFD700',

  // Utility
  transparent: 'transparent',
  white: '#FFFFFF',
} as const;

// Gradient Presets
export const Gradients = {
  primary: ['#FF6B6B', '#FF8787'],
  secondary: ['#4ECDC4', '#95E1D3'],
  gold: ['#FFD93D', '#FFED4E'],
  purple: ['#A78BFA', '#C4B5FD'],
  dark: ['#000000', '#1a1a1a'],
  energy: ['#FF6B6B', '#FFD93D', '#4ECDC4'],
  party: ['#FF00FF', '#FF6B6B', '#FFD93D'],
  background: ['#000000', '#0a0a0a', '#000000'],
} as const;

// Animated Gradient Configs
export const AnimatedGradients = {
  partyMode: {
    colors: ['#FF00FF', '#FF6B6B', '#FFD93D', '#4ECDC4'],
    locations: [0, 0.3, 0.6, 1],
    speed: 3000, // 3 seconds per cycle
  },
  energyPulse: {
    colors: ['#FF6B6B', '#FF8787', '#FF6B6B'],
    locations: [0, 0.5, 1],
    speed: 2000,
  },
  liveIndicator: {
    colors: ['#00FF94', '#4ECDC4', '#00FF94'],
    locations: [0, 0.5, 1],
    speed: 1500,
  },
} as const;

export type ColorKey = keyof typeof Colors;
export type GradientKey = keyof typeof Gradients;
