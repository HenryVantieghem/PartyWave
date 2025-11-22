# Beta Testing Guide

Complete guide for managing PartyWave beta testing program.

## 🎯 Beta Testing Goals

1. **Validate Core Features**: Party discovery, crew system, real-time updates
2. **Stress Test Infrastructure**: Supabase, real-time subscriptions, image hosting
3. **Identify Bugs**: Critical bugs before public launch
4. **Gather User Feedback**: UX improvements, feature requests
5. **Test Edge Cases**: Offline mode, poor connectivity, concurrent users
6. **Validate Performance**: App speed, battery usage, memory consumption

---

## 📱 TestFlight Setup (iOS)

### Initial Setup

1. **App Store Connect Configuration**:
   ```bash
   # Ensure you have:
   - Apple Developer Account ($99/year)
   - App Store Connect access
   - Valid provisioning profiles
   - Distribution certificate
   ```

2. **Create TestFlight Build**:
   ```bash
   # With EAS Build
   eas build --profile preview --platform ios

   # Or with Expo
   expo build:ios -t archive
   ```

3. **Upload to TestFlight**:
   - Builds auto-upload if using EAS
   - Or manually upload .ipa using Transporter app
   - Add build notes describing changes
   - Enable beta testing

### Beta Tester Groups

**Internal Testers** (25 max, instant access):
- Development team
- Close friends/family
- Purpose: Smoke testing before external beta

**External Testers** (10,000 max, requires Apple review):
- Early adopters
- University students (target demographic)
- Nightlife enthusiasts
- Purpose: Real-world testing

### Test Information

**Beta App Name**: PartyWave Beta
**Beta App Description**:
```
PartyWave reimagines party discovery and crew building. This beta helps us:
- Test real-time party updates
- Validate crew features
- Ensure app performance
- Gather feedback before launch

What to expect:
- Some features may be incomplete
- Occasional bugs or crashes
- Frequent updates (2-3x per week)
- Your feedback shapes the final product

Please report bugs via the in-app feedback button or email beta@partywave.app
```

**What to Test**: Comprehensive test plan (see below)

**Feedback Email**: beta@partywave.app

---

## 🤖 Google Play Internal Testing (Android)

### Setup Steps

1. **Google Play Console**:
   - Navigate to "Release" → "Testing" → "Internal testing"
   - Create email list of internal testers
   - Upload AAB bundle

2. **Create Internal Testing Release**:
   ```bash
   # Build AAB with EAS
   eas build --profile preview --platform android

   # Or manually build
   cd android && ./gradlew bundleRelease
   ```

3. **Create Tester List**:
   - Add Google account emails
   - Or create closed testing track with opt-in URL

### Beta Testing Tracks

**Internal Testing** (100 testers):
- Dev team
- Immediate updates (no review delay)

**Closed Testing** (Unlimited):
- Invite-only via opt-in URL
- Share with select users
- Faster than open testing

**Open Testing** (Optional):
- Public opt-in
- Use for wider beta before launch

---

## 📋 Beta Test Plan

### Week 1: Core Features

**Authentication & Onboarding**:
- [ ] Sign up with email/password
- [ ] Sign in with existing account
- [ ] Password reset flow
- [ ] Onboarding slides complete

**Party Discovery**:
- [ ] View nearby parties on radar
- [ ] Filter parties by date/time
- [ ] Search for specific parties
- [ ] View party details
- [ ] Join/leave parties

**Party Creation**:
- [ ] Create public party
- [ ] Create private party
- [ ] Upload party photo
- [ ] Set date/time/location
- [ ] Edit party details

### Week 2: Crew Features

**Crew Management**:
- [ ] Create crew
- [ ] Join existing crew
- [ ] Leave crew
- [ ] View crew activity feed
- [ ] Search/discover crews

**Crew Interactions**:
- [ ] Create quick plan
- [ ] Vote on quick plan
- [ ] Vouch for crew member
- [ ] Invite friends to crew
- [ ] View crew stats

### Week 3: Advanced Features

**Real-time Features**:
- [ ] Live party pulse updates
- [ ] Real-time chat (if enabled)
- [ ] Activity feed updates
- [ ] Quick plan vote updates

**Social Features**:
- [ ] Share party
- [ ] Check in to party
- [ ] Rate party vibe
- [ ] Upload party memory
- [ ] Like/comment on memories

### Week 4: Edge Cases & Performance

**Connectivity**:
- [ ] Use app offline
- [ ] Sync after reconnecting
- [ ] Handle poor connectivity
- [ ] Handle network errors gracefully

**Performance**:
- [ ] App loads quickly (<3s)
- [ ] Smooth scrolling
- [ ] No crashes during heavy use
- [ ] Battery usage acceptable
- [ ] Image loading optimized

---

## 📊 Feedback Collection

### In-App Feedback

**Integration** (using Shake SDK or similar):
```typescript
import Shake from '@shakebugs/react-native-shake';

// Initialize in App.tsx
Shake.start('YOUR_API_KEY');

// Configure
Shake.setShakingThreshold(600);
Shake.setShowIntroMessage(true);
```

**Feedback Button**:
- Add to Settings screen
- Simple tap to report bug
- Auto-captures screenshot
- Includes device info

### Surveys

**Post-Session Survey** (after each beta build):
```markdown
## PartyWave Beta Feedback - Build #X

### Overall Experience (1-5 stars)
How was your overall experience with this build?

### Feature Ratings
Rate the following features (1-5 stars):
- Party Discovery: ⭐⭐⭐⭐⭐
- Crew System: ⭐⭐⭐⭐⭐
- Real-time Updates: ⭐⭐⭐⭐⭐
- App Performance: ⭐⭐⭐⭐⭐
- Visual Design: ⭐⭐⭐⭐⭐

### What did you like most?

### What frustrated you?

### Did you encounter any bugs?

### What would you add/change?

### Would you recommend PartyWave to a friend? (1-10)
```

**Exit Survey** (end of beta):
```markdown
## PartyWave Beta - Final Feedback

### Would you use PartyWave when it launches?
- [ ] Definitely
- [ ] Probably
- [ ] Maybe
- [ ] Probably not
- [ ] Definitely not

### What's the #1 reason you'd use PartyWave?

### What would stop you from using PartyWave?

### How does PartyWave compare to existing solutions?

### Final thoughts / suggestions
```

---

## 📈 Key Metrics to Track

### App Analytics

**Engagement**:
- Daily Active Users (DAU)
- Session length
- Session frequency
- Feature adoption rates

**Performance**:
- App load time
- Screen load times
- API response times
- Crash-free rate (target: >99%)

**User Behavior**:
- Most used features
- Drop-off points
- Conversion funnels
- Retention (D1, D7, D30)

### Bug Tracking

**Severity Levels**:
- **P0** (Critical): App crashes, data loss → Fix within 24 hours
- **P1** (High): Core features broken → Fix within 3 days
- **P2** (Medium): Minor features broken → Fix within 1 week
- **P3** (Low): UI polish, nice-to-haves → Backlog

**Bug Report Template**:
```markdown
## Bug Report

**Priority**: P0 / P1 / P2 / P3

**Summary**: Brief description

**Steps to Reproduce**:
1. Step one
2. Step two
3. Step three

**Expected Behavior**: What should happen

**Actual Behavior**: What actually happens

**Environment**:
- Device: iPhone 14 Pro
- OS: iOS 17.2
- App Version: 1.0.0 (Build 42)
- Network: WiFi / 4G / 5G

**Screenshots/Video**: [Attach here]
```

---

## 👥 Beta Tester Recruitment

### Target Audience

**Primary**:
- College students (18-25)
- Young professionals (22-30)
- Active nightlife participants
- Social group organizers

**Secondary**:
- Event planners
- Social media influencers
- Tech enthusiasts
- Design-conscious users

### Recruitment Channels

1. **University Partnerships**:
   - Post on campus Facebook groups
   - Partner with student organizations
   - Table at student union
   - Dorm flyering

2. **Social Media**:
   - Instagram story polls
   - Twitter/X announcements
   - LinkedIn posts
   - Reddit (r/SocialApps, local city subreddits)

3. **Email List**:
   - Landing page signups
   - Friends and family referrals
   - Newsletter subscribers

4. **In-Person**:
   - QR codes at local venues
   - Hand out cards at events
   - Word of mouth

### Invitation Email Template

```markdown
Subject: You're invited to beta test PartyWave 🎉

Hi [Name],

You've been selected to join the PartyWave beta program!

PartyWave is reimagining how you discover parties and connect with your crew. We're launching in [CITY] next month, and we need your help to make it perfect.

**What you'll get**:
- Early access to the app
- Direct line to the dev team
- Shape the final product with your feedback
- Beta tester badge in the app (coming soon!)

**What we need from you**:
- Test the app 2-3x per week
- Report bugs you find
- Share honest feedback
- Complete weekly surveys (5 min each)

**Getting Started**:
iOS: [TestFlight Link]
Android: [Google Play Link]

Beta starts [DATE] and runs for 4 weeks.

Questions? Reply to this email or join our beta Discord: [Link]

Thanks for helping us build the future of nightlife!

— The PartyWave Team
```

---

## 🎓 Beta Tester Onboarding

### Welcome Email (Day 1)

```markdown
Subject: Welcome to PartyWave Beta! 🚀

Welcome to the PartyWave beta program!

**Your Mission** (if you choose to accept it):
1. Download the app (link below)
2. Create your account
3. Explore the features
4. Report anything weird
5. Share your thoughts

**Important Links**:
- TestFlight (iOS): [Link]
- Play Store (Android): [Link]
- Beta Discord: [Link]
- Feedback Form: [Link]
- Bug Report Form: [Link]

**This Week's Focus**: Authentication & Party Discovery
Try signing up, finding parties near you, and joining a party.

**Pro Tips**:
- Shake your phone to report bugs (includes screenshot!)
- Check Discord for beta announcements
- Help us test with friends (more users = better testing!)

Let's build something awesome together 🎉

— The PartyWave Team
```

### Weekly Check-in (Every Monday)

```markdown
Subject: PartyWave Beta Week [X] - [Focus Area]

Hey beta testers!

Week [X] is here. This week we're focusing on: **[Feature]**

**What's New in Build [XX]**:
- Added [feature]
- Fixed [bug]
- Improved [area]

**This Week's Test Plan**:
1. [Task 1]
2. [Task 2]
3. [Task 3]

**Quick Survey** (2 min): [Link]

Top bug from last week: [Bug description] — Status: Fixed ✅

Keep the feedback coming!

— The PartyWave Team
```

---

## ✅ Beta Completion Criteria

### Ready for Public Launch When:

**Quality Metrics**:
- [ ] Crash-free rate >99%
- [ ] Critical bugs (P0/P1) = 0
- [ ] Average session length >5 min
- [ ] Feature completion >95%

**User Satisfaction**:
- [ ] NPS (Net Promoter Score) >40
- [ ] 4+ star average rating from testers
- [ ] >80% would recommend to friend

**Performance**:
- [ ] App load time <3s (average)
- [ ] API response time <500ms (p95)
- [ ] Image load time <2s (average)

**Feedback Implementation**:
- [ ] Top 10 feature requests evaluated
- [ ] Top 5 UX pain points addressed
- [ ] All critical feedback addressed

---

## 📞 Beta Support

**Email**: beta@partywave.app
**Discord**: [Beta Community Server]
**Response Time**: <24 hours

**Support Hours**:
- Mon-Fri: 9am - 9pm PT
- Sat-Sun: 11am - 7pm PT

---

**Questions?** Email beta@partywave.app
