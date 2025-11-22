# ⚠️ CRITICAL FIXES NEEDED BEFORE APP STORE SUBMISSION

**Priority**: HIGH | **Time Required**: 1-2 days | **Must Fix Before**: Beta Launch

---

## 🔴 Fix #1: Database Schema Mismatch (CRITICAL)

### Problem
TypeScript expects `name` and `location_name`, but SQL schema has `title` and `location`.

### Current Workaround
Party store has mapping logic that converts fields ([src/stores/partyStore.ts:71-75](src/stores/partyStore.ts#L71-L75))

### Fix Required
Run in Supabase SQL Editor:
```sql
-- Fix field names to match TypeScript
ALTER TABLE parties RENAME COLUMN title TO name;
ALTER TABLE parties RENAME COLUMN location TO location_name;
ALTER TABLE parties ADD COLUMN location_address TEXT;

-- Fix status enum
ALTER TABLE parties DROP CONSTRAINT parties_status_check;
ALTER TABLE parties ADD CONSTRAINT parties_status_check
  CHECK (status IN ('upcoming', 'happening', 'ended'));
```

### After SQL Fix
Remove mapping workarounds from [src/stores/partyStore.ts:71-75, 108-112, 137-141, 184-188](src/stores/partyStore.ts)

### Testing
1. Create a new party
2. View party details
3. Verify all fields display correctly

---

## 🔴 Fix #2: Create Supabase Storage Buckets (CRITICAL)

### Problem
Party creation tries to upload images but buckets don't exist ([src/app/party/create.tsx:164-181](src/app/party/create.tsx#L164-L181))

### Fix Required
In Supabase Dashboard → Storage:

**1. Create Buckets:**
```
Name: avatars
Public: ✓ Yes
File size limit: 2MB
Allowed MIME types: image/jpeg, image/png, image/webp
```

```
Name: party-covers
Public: ✓ Yes
File size limit: 5MB
Allowed MIME types: image/jpeg, image/png, image/webp
```

```
Name: party-memories
Public: ✗ No (Private)
File size limit: 50MB
Allowed MIME types: image/*, video/*
```

```
Name: stories
Public: ✗ No (Private)
File size limit: 20MB
Allowed MIME types: image/*, video/*
```

**2. Set Policies** (see [SUPABASE_SETUP.md:62-114](SUPABASE_SETUP.md#L62-L114))

### Testing
1. Try creating a party with a cover photo
2. Verify image uploads successfully
3. Check image displays in party detail

---

## 🔴 Fix #3: Missing Welcome Screen (CRITICAL)

### Problem
Onboarding screen navigates to `/(auth)/welcome` which doesn't exist ([src/app/(auth)/onboarding.tsx:71](src/app/(auth)/onboarding.tsx#L71))

### Option A: Create Welcome Screen (Recommended)
Create file: `src/app/(auth)/welcome.tsx`
```typescript
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text variant="h1">Welcome to The Hangout</Text>
      <Button onPress={() => router.push('/(auth)/signup')}>
        Get Started
      </Button>
      <Button onPress={() => router.push('/(auth)/login')} variant="ghost">
        Sign In
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' }
});
```

### Option B: Skip Welcome Screen
Update [src/app/(auth)/onboarding.tsx:71](src/app/(auth)/onboarding.tsx#L71):
```typescript
// Change from:
router.replace('/(auth)/welcome');

// To:
router.replace('/(auth)/signup');
```

### Testing
1. Complete onboarding flow
2. Verify navigation works
3. Test signup and login buttons

---

## 🔴 Fix #4: Integrate Location Services (CRITICAL)

### Problem
Discover screen uses mock data instead of real location ([src/app/(tabs)/index.tsx:255-298](src/app/(tabs)/index.tsx#L255-L298))

### Fix Required

**1. Update Party Creation** ([src/app/party/create.tsx:186-200](src/app/party/create.tsx#L186-L200)):
```typescript
// Add after location inputs (around line 130)
import { geocodeAddress } from '@/lib/location';

// In handleCreate function, before createParty:
let latitude: number | undefined;
let longitude: number | undefined;

if (locationAddress.trim()) {
  const coords = await geocodeAddress(locationAddress.trim());
  if (coords) {
    latitude = coords.latitude;
    longitude = coords.longitude;
  }
}

// Add to createParty call:
const party = await createParty({
  // ... existing fields
  latitude,
  longitude,
});
```

**2. Update Discover Screen** ([src/app/(tabs)/index.tsx:255-298](src/app/(tabs)/index.tsx#L255-L298)):
```typescript
// Remove mock data fallback (lines 258-283)
// Use only real sorted parties:

const nearbyParties = React.useMemo(() => {
  if (!userLocation || !parties.length) {
    return [];
  }

  const sortedParties = sortPartiesByDistance(parties, userLocation);

  return sortedParties.slice(0, 5).map((party) => ({
    id: party.id,
    name: party.name.replace(/ /g, '\n'),
    distance: formatDistance(party.distance),
    attendees: 0, // TODO: Fix with attendee count
    emoji: '🎉',
    friendsGoing: [],
  }));
}, [parties, userLocation]);
```

**3. Fix Attendee Count** (Optional but recommended):
Update party fetch to include attendee count:
```typescript
// In src/stores/partyStore.ts, fetchParties function:
let query = supabase
  .from('parties')
  .select(`
    *,
    host:profiles(*),
    party_attendees(count)
  `)
```

### Testing
1. Create party with full address
2. Check lat/lng stored in database
3. Open Discover screen
4. Verify real distances show
5. Test location permissions

---

## 🟡 Fix #5: Remove Social Auth Placeholders (MEDIUM)

### Problem
Apple/Google sign-in buttons are placeholders ([src/app/(auth)/login.tsx:174-194](src/app/(auth)/login.tsx#L174-L194))

### Option A: Remove Buttons (Quick)
Delete lines 162-194 from [login.tsx](src/app/(auth)/login.tsx#L162-L194)

### Option B: Implement Social Auth (Future)
Keep buttons but add Supabase OAuth:
```typescript
// Configure in Supabase Dashboard → Authentication → Providers
// Add Apple and Google OAuth credentials
// Implement with supabase.auth.signInWithOAuth()
```

### Testing
Test login screen displays correctly

---

## 🟡 Fix #6: Implement Forgot Password (MEDIUM)

### Problem
TODO comment at [src/app/(auth)/login.tsx:141](src/app/(auth)/login.tsx#L141)

### Fix Required
```typescript
// Replace TODO with:
const handleForgotPassword = async () => {
  if (!email) {
    Alert.alert('Error', 'Please enter your email address');
    return;
  }

  try {
    await useAuthStore.getState().resetPassword(email);
    Alert.alert(
      'Check Your Email',
      'Password reset instructions have been sent to your email.'
    );
  } catch (error: any) {
    Alert.alert('Error', error.message);
  }
};

// Update TouchableOpacity onPress:
<TouchableOpacity
  onPress={handleForgotPassword}
  style={styles.forgotPassword}
>
```

### Testing
1. Enter email
2. Tap "Forgot Password?"
3. Check email for reset link

---

## 📋 Quick Checklist

Before submitting to App Store:

### Must Do (Critical)
- [ ] Fix database schema (title→name, location→location_name)
- [ ] Create 4 Supabase storage buckets
- [ ] Create welcome.tsx OR update navigation
- [ ] Integrate real location services

### Should Do (Important)
- [ ] Remove or implement social auth
- [ ] Implement forgot password
- [ ] Test on physical iPhone
- [ ] Create real app icon (1024x1024)
- [ ] Create real splash screen

### Nice to Have
- [ ] Build chat UI
- [ ] Add profile editing
- [ ] Implement QR check-in
- [ ] Add push notifications

---

## ⏱️ Time Estimates

| Task | Time | Priority |
|------|------|----------|
| Database schema fix | 30 min | 🔴 Critical |
| Create storage buckets | 15 min | 🔴 Critical |
| Welcome screen | 30 min | 🔴 Critical |
| Location integration | 2 hours | 🔴 Critical |
| Remove social auth | 5 min | 🟡 Medium |
| Forgot password | 30 min | 🟡 Medium |
| **TOTAL** | **~4 hours** | |

---

## 🚀 Ready to Ship After These Fixes!

Once these critical fixes are complete, the app will be ready for:
- ✅ Beta testing with real users
- ✅ TestFlight distribution
- ✅ App Store submission (with legal docs)

**Estimated Timeline**: 1-2 days for critical fixes, then ready for beta launch! 🎉
