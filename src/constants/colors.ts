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

  // Accent Colors - Gen Z Vibes
  accent: {
    gold: '#FFD93D',        // Premium/VIP
    purple: '#A78BFA',      // Special events
    green: '#00FF94',       // Live/Active
    blue: '#60A5FA',        // Info
    orange: '#FB923C',      // Hot/Trending
    neon: '#00FFFF',        // Neon cyan
    magenta: '#FF00FF',     // Electric magenta
    lime: '#CCFF00',        // Neon lime
    hotPink: '#FF69B4',     // Hot pink
    lavender: '#E0B0FF',    // Soft lavender
    mint: '#98FF98',        // Mint green
    coral: '#FF7F50',       // Coral
    peach: '#FFAB91',       // Peach
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

// Gradient Presets - Enhanced with Gen Z aesthetics
export const Gradients = {
  // Core gradients
  primary: ['#FF6B6B', '#FF8787'],
  secondary: ['#4ECDC4', '#95E1D3'],
  gold: ['#FFD93D', '#FFED4E'],
  purple: ['#A78BFA', '#C4B5FD'],
  dark: ['#000000', '#1a1a1a'],
  energy: ['#FF6B6B', '#FFD93D', '#4ECDC4'],
  party: ['#FF00FF', '#FF6B6B', '#FFD93D'],
  background: ['#000000', '#0a0a0a', '#000000'],

  // Holographic & Iridescent
  holographic: ['#FF00FF', '#00FFFF', '#FFFF00', '#FF00FF'],
  iridescent: ['#A78BFA', '#4ECDC4', '#FFD93D', '#FF6B6B'],
  aurora: ['#A78BFA', '#FF69B4', '#4ECDC4', '#FFD93D'],
  neon: ['#00FFFF', '#FF00FF', '#CCFF00'],
  sunset: ['#FF6B6B', '#FF8A65', '#FFAB91', '#FFD54F'],
  ocean: ['#0077BE', '#4ECDC4', '#95E1D3', '#00FFFF'],
  fire: ['#FF4500', '#FF6B6B', '#FFD93D', '#FFED4E'],
  cosmic: ['#1A1A2E', '#16213E', '#0F3460', '#533483'],

  // Social vibes
  vibe: ['#FF69B4', '#FF8A95', '#FFB3BA'],
  chill: ['#95E1D3', '#A8E6CF', '#C7CEEA'],
  turnt: ['#FF00FF', '#FF4500', '#FFFF00'],
  exclusive: ['#FFD93D', '#FFA500', '#FF6B6B'],
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
