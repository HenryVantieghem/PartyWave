/**
 * THE HANGOUT - ENHANCED COLOR SYSTEM
 * Dark, energetic, nightlife-inspired palette
 */

export const Colors = {
  // Base - Pure black for nightlife aesthetic (REFERENCE-MATCHED)
  black: '#000000',
  background: '#000000',
  backgroundElevated: '#0F0F0F',

  // Cards & Surfaces - Dark with subtle elevation (REFERENCE-MATCHED)
  card: '#1C1C1E',
  cardHover: '#252528',
  surface: '#2C2C2E',
  surfaceLight: '#38383A',

  // Primary - Coral Pink (REFERENCE-MATCHED: #FF4B6E)
  primary: '#FF4B6E',
  primaryLight: '#FF6B88',
  primaryDark: '#FF2B4E',
  primaryGradient: ['#FF4B6E', '#FF6B88', '#FF8BA4'],

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

  // 🔥 NEON POWER COLORS - Maximum Viral Impact
  neon: {
    electricBlue: '#00D9FF',    // Viral energy
    laserPink: '#FF006E',       // Maximum impact
    acidGreen: '#39FF14',       // Can't ignore this
    ultraViolet: '#9D00FF',     // Premium exclusive
    cosmicOrange: '#FF4D00',    // Heat level max
    cyberYellow: '#FFFC00',     // Attention grabber
    toxicPurple: '#BF00FF',     // Rare exclusive
    radioactiveGreen: '#00FF41',// Live indicator alt
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

  // Text Colors (REFERENCE-MATCHED)
  text: {
    primary: '#FFFFFF',
    secondary: '#8E8E93',
    tertiary: '#636366',
    disabled: '#48484A',
    inverse: '#000000',
  },

  // Border Colors (REFERENCE-MATCHED)
  border: {
    default: '#38383A',
    light: '#48484A',
    dark: '#1C1C1E',
    primary: '#FF4B6E',
    glow: 'rgba(255, 75, 110, 0.3)',
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

// Gradient Presets - REFERENCE-MATCHED
export const Gradients = {
  // Core gradients
  primary: ['#FF4B6E', '#FF6B88', '#FF8BA4'],
  secondary: ['#00D9FF', '#4ECDC4', '#95E1D3'],
  gold: ['#FFD700', '#FFC107', '#FFB300'],
  purple: ['#9D4EDD', '#A78BFA', '#C4B5FD'],
  dark: ['#000000', '#0a0a0a', '#000000'],
  energy: ['#FF5E78', '#FFD700', '#4ECDC4'],
  party: ['#FF00FF', '#FF5E78', '#FFD700', '#4ECDC4'],
  background: ['#000000', '#0a0a0a', '#1a1a1a', '#000000'],

  // Holographic & Iridescent - ENHANCED
  holographic: ['#FF00FF', '#00FFFF', '#FFFF00', '#FF00FF', '#00FF00'],
  iridescent: ['#9D4EDD', '#00D9FF', '#FFD700', '#FF5E78'],
  aurora: ['#A78BFA', '#FF69B4', '#00D9FF', '#FFD700', '#4ECDC4'],
  neon: ['#00FFFF', '#FF00FF', '#CCFF00', '#FF3131'],
  sunset: ['#FF5E78', '#FF8A65', '#FFAB91', '#FFD54F', '#FFB300'],
  ocean: ['#0077BE', '#00D9FF', '#4ECDC4', '#95E1D3'],
  fire: ['#FF3131', '#FF5E78', '#FFD700', '#FFED4E'],
  cosmic: ['#1A1A2E', '#16213E', '#0F3460', '#533483', '#9D4EDD'],

  // Social vibes - AMPLIFIED
  vibe: ['#FF69B4', '#FF8A95', '#FFB3BA', '#FFC8DD'],
  chill: ['#95E1D3', '#A8E6CF', '#C7CEEA', '#E0BBE4'],
  turnt: ['#FF00FF', '#FF3131', '#FFFF00', '#00FFFF'],
  exclusive: ['#FFD700', '#FFC107', '#FF8A00', '#FF5E78'],

  // New Gen Z gradient themes
  midnight: ['#0A0E27', '#1E1E3F', '#2D1B69', '#6A4C93'],
  electric: ['#00FFFF', '#00D9FF', '#0099FF', '#0066FF'],
  candy: ['#FF69B4', '#FF8AD8', '#FFA6EC', '#FFC4FF'],
  rave: ['#FF00FF', '#9D00FF', '#0099FF', '#00FFFF', '#00FF00'],
  golden: ['#FFD700', '#FFC107', '#FFB300', '#FFA000', '#FF8F00'],
  jungle: ['#00FF94', '#00E676', '#00C853', '#00B248'],
  sunset_vibes: ['#FF5E78', '#FF8A65', '#FFAB91', '#FFD54F'],
  ocean_deep: ['#001F3F', '#0074D9', '#00D9FF', '#7FDBFF'],

  // 🌈 VIRAL HOLOGRAPHIC GRADIENTS - Maximum Shareability
  viral: ['#FF006E', '#00D9FF', '#39FF14', '#9D00FF', '#FF006E'],
  cyberpunk: ['#FF006E', '#00D9FF', '#FFFC00', '#9D00FF'],
  disco: ['#FF00FF', '#00FFFF', '#FFFF00', '#FF00FF', '#00FFFF'],
  galaxy: ['#0F0F3D', '#1E1E5F', '#9D00FF', '#FF006E', '#0F0F3D'],
  lavaLamp: ['#FF006E', '#FF4D00', '#9D00FF', '#00D9FF', '#FF006E'],
  toxic: ['#39FF14', '#FFFC00', '#FF4D00', '#39FF14'],
  electricShock: ['#00D9FF', '#BF00FF', '#FF006E', '#00D9FF'],
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
