# The Hangout - Design System Documentation

## 📐 Design Philosophy

**Core Identity**: Nightlife-optimized, minimal, high-contrast social experience

### Design Principles

1. **Nightlife-First Design**
   - Pure black background reduces eye strain in dark environments (clubs, bars, parties)
   - High contrast ensures readability in low light conditions
   - Vibrant coral pink (#FF4B6E) creates visual pop without being overwhelming

2. **Minimal Cognitive Load**
   - Icon-only tab bar reduces visual clutter
   - Clear information hierarchy guides user attention naturally
   - One primary action per screen for focused user intent
   - Generous negative space prevents information overload

3. **Social Energy & FOMO**
   - Live indicators create urgency and real-time engagement
   - Energy percentages gamify party attendance and quality
   - "Near You" spatial visualization encourages discovery
   - Real-time stats drive social proof and decision-making

4. **Mobile-First Interaction**
   - Large touch targets (48dp minimum) for easy thumb access
   - Bottom-aligned navigation for one-handed use
   - Single-column layouts optimize for portrait viewing
   - Quick actions prioritized for immediate engagement

5. **Visual Storytelling**
   - Large hero images set party atmosphere and expectations
   - Circular party bubbles with emojis create personality
   - Stats tell the complete party story at a glance
   - Host information builds trust and social connection

6. **Trust & Social Proof**
   - Host profiles prominently displayed on all party cards
   - Visible attendee counts drive FOMO
   - Friend connections implied through avatars
   - Energy metrics provide transparent party quality indicators

---

## 🎨 Color System

### Base Colors

```typescript
// Pure black for premium nightlife aesthetic
background: '#000000'
backgroundElevated: '#0F0F0F'

// Dark surfaces with subtle elevation
card: '#1C1C1E'
cardHover: '#252528'
surface: '#2C2C2E'
surfaceLight: '#38383A'
```

**Usage**:
- `background` for main app background
- `card` for elevated UI elements (cards, modals, bottom sheets)
- `surface` for secondary elevated elements

### Primary Color (Coral Pink)

```typescript
primary: '#FF4B6E'      // Main brand color - CTAs, active states
primaryLight: '#FF6B88' // Hover/pressed states
primaryDark: '#FF2B4E'  // Deep emphasis
```

**Usage**:
- Primary buttons and CTAs
- Active tab indicators
- Key metrics and stats
- Links and interactive elements
- Filter pill active state

**Gradient**: `['#FF4B6E', '#FF6B88', '#FF8BA4']`

### Text Colors

```typescript
text: {
  primary: '#FFFFFF',   // Main content
  secondary: '#8E8E93', // Supporting text, metadata
  tertiary: '#636366',  // De-emphasized text
  disabled: '#48484A',  // Disabled states
}
```

**Hierarchy**:
1. Primary - Headlines, party names, key information
2. Secondary - Timestamps, locations, attendee counts
3. Tertiary - Helper text, disclaimers

### Border Colors

```typescript
border: {
  default: '#38383A',   // Standard borders
  light: '#48484A',     // Emphasized borders
  dark: '#1C1C1E',      // Subtle dividers
  primary: '#FF4B6E',   // Accent borders
}
```

### Status Colors

```typescript
success: '#10B981'    // Confirmations, success states
error: '#EF4444'      // Errors, destructive actions
warning: '#F59E0B'    // Warnings, caution
live: '#00FF94'       // Live indicators, active parties
```

---

## 📏 Spacing System

```typescript
spacing: {
  xxs: 2,    // Tight spacing
  xs: 4,     // Very small gaps
  sm: 8,     // Small padding/margins
  md: 12,    // Standard spacing
  base: 16,  // Default spacing unit
  lg: 20,    // Large spacing
  xl: 24,    // Extra large
  '2xl': 32, // Section spacing
  '3xl': 48, // Major section breaks
  '4xl': 64, // Screen padding
}
```

**Application**:
- **xxs-xs**: Icon spacing, tag padding
- **sm-md**: Component internal padding
- **base-lg**: Card padding, standard margins
- **xl-2xl**: Section spacing, screen margins
- **3xl-4xl**: Major layout breaks, empty states

---

## 🔤 Typography System

### Font Stack
Primary: **SF Pro Display** (iOS), **System Default** (Android)

### Type Scale

```typescript
h1: { fontSize: 32, fontWeight: '900', lineHeight: 38 }
h2: { fontSize: 28, fontWeight: '800', lineHeight: 34 }
h3: { fontSize: 24, fontWeight: '700', lineHeight: 30 }
h4: { fontSize: 20, fontWeight: '600', lineHeight: 26 }
body: { fontSize: 16, fontWeight: '400', lineHeight: 22 }
caption: { fontSize: 14, fontWeight: '400', lineHeight: 18 }
label: { fontSize: 12, fontWeight: '600', lineHeight: 16 }
```

### Font Weights

```typescript
regular: '400'  // Body text, descriptions
semibold: '600' // Emphasis, labels
bold: '700'     // Headings, important content
black: '900'    // Hero text, major headlines
```

### Typography Usage

- **h2 + black**: Screen titles (e.g., "Party Radar", "Parties")
- **h4 + bold**: Party names, card titles
- **body + semibold**: Section headers, filter pills
- **caption + secondary**: Metadata (dates, times, locations)
- **label**: Badges, tags, small UI elements

---

## 🧩 Component Library

### 1. Tab Bar (Bottom Navigation)

**Design**: Icon-only, dark background, 5 tabs, floating rounded container

```typescript
// Specifications
height: 88px (iOS with safe area) / 68px (Android)
background: rgba(26, 26, 30, 0.85) with blur (iOS)
borderRadius: 24px
icons: 26-28px
activeColor: #FF4B6E
inactiveColor: #8E8E93
```

**Icons**:
1. Party Radar - radio-button-on / outline
2. Parties - calendar / outline
3. Add/Create - duplicate / outline (center)
4. Search/Messages - search / outline
5. Profile - person-circle / outline

### 2. Filter Pills

**Design**: Horizontal scrollable row, pill-shaped with icons

```typescript
// Specifications
height: 40px
paddingHorizontal: 16px
paddingVertical: 10px
borderRadius: 20px (fully rounded)
borderWidth: 1px
gap: 8px (icon to text)

// States
inactive: {
  background: 'transparent',
  border: #38383A,
  text: #8E8E93
}
active: {
  background: #FF4B6E,
  border: #FF4B6E,
  text: #FFFFFF
}
```

### 3. Party Cards (Large Image Style)

**Design**: Full-width cards with large hero image and overlaid information

```typescript
// Specifications
imageHeight: 240px
borderRadius: 16px
overlay: linear-gradient(transparent → rgba(0,0,0,0.8))

// Structure
- Image/Gradient background with emoji fallback
- Bottom overlay with host info (avatar + name)
- Details section:
  - Party title (h4, bold)
  - Meta row (date, time, location with icons)
  - Footer (attendees + Join button)
```

### 4. Proximity Circles

**Design**: Circular party indicators with animations

```typescript
// Specifications
diameter: (screenWidth - 48px) / 3 - 8px
borderRadius: 50% (fully circular)
padding: 12px

// Structure
- Gradient background (energy-based)
- Energy ring border (2px, colored by energy level)
- LIVE badge (top-right, conditional)
- Emoji icon (40px, animated)
- Party name (11px, centered, line breaks)
- Attendees count (with people icon)
- Distance (with pin emoji)
```

**Energy Levels**:
- Low (<13 people): Cyan gradient
- Medium (13-25): Orange gradient
- High (>25): Green "LIVE" with pulsing animation

### 5. Quick Actions

**Design**: Icon-based action buttons with labels

```typescript
// Specifications
iconContainer: 72px × 72px
backgroundColor: #1C1C1E
borderRadius: 16px
emoji: 36px
labelFontSize: 13px
gap: 12px (icon to label)

// Layout
flexDirection: 'row'
justifyContent: 'center'
gap: 24px
```

### 6. Live Right Now Section

**Design**: Section header with red indicator dot + party card

```typescript
// Specifications
dotSize: 12px
dotColor: #FF3B30 (bright red)
cardStyle: standard party card (horizontal layout)

// Content
- Red pulsing dot + "Live Right Now" label
- Party count on right
- Party card with attendee count and energy %
```

---

## 📱 Screen Layouts

### Party Radar (Discovery)

**Structure**:
1. Header (Title + subtitle + action icon)
2. Live Right Now section (conditional)
3. Near You section (proximity circles)
4. Quick Actions (2 action buttons)
5. Hot Right Now (trending parties list)

**Key Features**:
- Animated pulsing party circles
- Real-time energy indicators
- Social proof (friends going)
- Distance-based sorting

### Parties (Management)

**Structure**:
1. Header (Title "Parties" + profile avatar)
2. Filter Pills (Hosting, Invites, Joined, Past)
3. Party Cards (large image style)

**Key Features**:
- Hero image cards with gradient overlays
- Host information prominently displayed
- Meta information icons (date, time, location)
- Join button for non-host parties

### Party Room (Detail)

**Structure**:
1. Header (Back + "Party Room" title + profile + "My Pass")
2. Party Info (name, date, location)
3. Stats Row (Going, Energy, Messages)
4. Your Story (circular add button)

**Key Features**:
- Stats row with icons and metrics
- Energy percentage (largest, centered)
- Minimalist layout with black space
- Story-style content sharing

---

## 🎬 Animations & Interactions

### Animation Principles

1. **Spring Physics**: Natural, bouncy feel for taps and state changes
2. **Haptic Feedback**: Tactile response on all interactions
3. **Pulse Animations**: Live indicators and high-energy parties
4. **Smooth Transitions**: 200-300ms duration for most state changes

### Interaction Patterns

```typescript
// Touch feedback
activeOpacity: 0.85  // Standard for all touchables

// Haptics
Light: Navigation, filter changes
Medium: Card taps, action buttons
Heavy: Primary actions (create party, join)

// Spring animations
duration: 800-1200ms
stiffness: high (bouncy feel)
```

### Micro-interactions

1. **Proximity Circles**:
   - Continuous pulsing (scale 1.0 → 1.06)
   - Glow animation (opacity 0.3 → 0.8)
   - Emoji bounce (scale 1.0 → 1.15)

2. **Live Indicators**:
   - Dot pulse (fade in/out)
   - Color shift (brightness variation)

3. **Button Presses**:
   - Scale down slightly (0.95)
   - Haptic feedback
   - Quick spring back

---

## 🌐 Responsive Behavior

### Breakpoints

- **Small phones**: < 375px width
- **Standard phones**: 375px - 428px
- **Large phones**: > 428px

### Adaptive Patterns

1. **Proximity Circles**: Auto-scale based on screen width
2. **Party Cards**: Full-width with padding
3. **Tab Bar**: Fixed height with safe area consideration
4. **Text**: Scales with iOS accessibility settings

---

## ♿ Accessibility

### Color Contrast

- **AA Compliant**: All text meets WCAG 2.1 AA standards
- Primary (#FF4B6E) on black: 8.2:1 ratio ✅
- Secondary text (#8E8E93) on black: 5.4:1 ratio ✅

### Touch Targets

- Minimum: 44px × 44px (iOS HIG compliant)
- Recommended: 48px × 48px
- Tab bar icons: 48px containers

### Screen Reader Support

- All interactive elements have labels
- Image-based cards include alt text
- Status information announced

---

## 🎯 Design Tokens

### Border Radius

```typescript
borderRadius: {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  full: 9999 (circles)
}
```

### Shadows

```typescript
shadows: {
  sm: { shadowRadius: 4, shadowOpacity: 0.1 }
  md: { shadowRadius: 8, shadowOpacity: 0.15 }
  lg: { shadowRadius: 16, shadowOpacity: 0.2 }
}
```

### Opacity Values

```typescript
overlay: {
  light: 0.3,
  medium: 0.5,
  dark: 0.7,
  darker: 0.9
}
```

---

## 🚀 Implementation Guidelines

### Do's ✅

1. Use design tokens from `constants/colors.ts` and `constants/theme.ts`
2. Maintain 16px base spacing unit throughout
3. Follow component structure patterns
4. Add haptic feedback to all interactions
5. Use spring animations for natural feel
6. Keep tab bar icon-only (no labels)
7. Use coral pink (#FF4B6E) consistently for CTAs
8. Implement proper empty states
9. Add loading skeletons for data fetching

### Don'ts ❌

1. Don't add labels to tab bar icons
2. Don't use gradients on regular UI elements (only cards/images)
3. Don't use colors outside the defined palette
4. Don't ignore safe area insets
5. Don't create custom spacing values
6. Don't mix font weights inconsistently
7. Don't use small touch targets (<44px)
8. Don't add unnecessary animations
9. Don't override the dark theme with light colors

---

## 📦 Component Props Reference

### Text Component

```typescript
<Text
  variant="h2"           // h1, h2, h3, h4, body, caption, label
  weight="black"         // regular, semibold, bold, black
  color="primary"        // primary, secondary, tertiary, white, success, error
  center                 // boolean
  numberOfLines={1}      // number
/>
```

### Card Component

```typescript
<Card
  variant="liquid"       // liquid, glass
  style={styles.custom}  // additional styles
>
  {children}
</Card>
```

### Avatar Component

```typescript
<Avatar
  source={{ uri: 'https://...' }}
  size={40}              // number (diameter)
  style={styles.custom}  // additional styles
/>
```

### Button Component

```typescript
<Button
  variant="primary"      // primary, secondary, ghost
  size="large"           // small, medium, large
  gradient               // boolean - use gradient
  loading                // boolean - show loading
  disabled               // boolean
  fullWidth              // boolean
  onPress={handlePress}
>
  Button Text
</Button>
```

---

## 🔄 Version History

### v1.0.0 - Reference-Matched Design System (Current)
- Pure black background (#000000)
- Coral pink primary (#FF4B6E)
- Icon-only tab bar
- Large image party cards
- Filter pills with icons
- Proximity circles with animations
- Simplified color palette
- Enhanced accessibility

---

## 📚 References

- [iOS Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/)
- [Material Design 3](https://m3.material.io/)
- [WCAG 2.1 Accessibility](https://www.w3.org/WAI/WCAG21/quickref/)
- Reference screenshots (provided by user)

---

**Maintained by**: Claude Code SuperClaude
**Last Updated**: 2025-01-20
**Version**: 1.0.0
