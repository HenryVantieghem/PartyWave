# Phase 1 Integration Testing Checklist

**Date**: 2025-11-21
**Phase**: 1 - Foundation (Crew System)
**Status**: ✅ READY FOR TESTING

---

## 🎯 Testing Overview

This document provides a comprehensive testing checklist for Phase 1 crew system features. All features should be tested manually before proceeding to Phase 2.

---

## ✅ Pre-Testing Validation

### Build & Compilation
- [x] TypeScript compilation passes without errors
- [x] All imports resolve correctly
- [x] No console warnings during development build
- [x] All crew-related types properly defined

### Database Setup
- [x] Supabase connection configured
- [x] 5 crew tables created (party_crews, crew_members, crew_invites, crew_activity, crew_vouches)
- [x] RLS policies implemented on all tables
- [x] Database triggers configured (member count, auto-expire)
- [x] Storage bucket ready for crew avatars

---

## 🧪 Integration Test Cases

### 1. Navigation & Tab Bar

**Test Case**: Verify crew tab is accessible
- [ ] Open app, navigate to tab bar
- [ ] Verify "Crew" tab is visible with "people" icon
- [ ] Tap Crew tab, confirm navigation works
- [ ] Verify Messages tab is hidden
- [ ] Tab order: Discover → Passport → Camera → Crew → Profile

**Expected**: Crew tab navigates to crew list screen

---

### 2. Crew Creation Flow

**Test Case**: Create a new crew
- [ ] Navigate to Crew tab
- [ ] Tap "+" button (if no crews) or create button
- [ ] Fill in crew name (required, 2-50 chars)
- [ ] Add optional description (max 200 chars)
- [ ] Select crew type (Inner Circle / Extended / Open)
- [ ] Select privacy (Private / Closed / Public)
- [ ] Choose theme color (8 options)
- [ ] Tap "Create Crew"

**Expected**:
- Crew created successfully
- User automatically added as owner
- Navigates to new crew detail screen
- Crew appears in "My Crews" list

**Validation**:
- [ ] Crew name validation (min 2 chars)
- [ ] Character counts display correctly (name: x/50, description: x/200)
- [ ] Haptic feedback on interactions
- [ ] Loading indicator during creation
- [ ] Success notification on completion

---

### 3. Crew Detail Screen

**Test Case**: View crew details
- [ ] Open a crew from the list
- [ ] Verify crew avatar displays (or initials)
- [ ] Confirm crew name and description shown
- [ ] Check stats display (member count, reputation)
- [ ] Verify member list shows all members with roles
- [ ] Owner badge displays correctly
- [ ] Settings icon visible for owner/admin

**Expected**:
- All crew information displays correctly
- Member roles properly labeled (Owner, Admin, Member)
- UI matches design system (glassmorphism, coral theme)

---

### 4. Member Management

**Test Case**: Manage crew members (Owner/Admin only)
- [ ] As owner, tap on a member (not yourself)
- [ ] Action sheet appears with options
- [ ] Verify "View Profile" option
- [ ] Verify "Promote to Admin" (for members)
- [ ] Verify "Demote to Member" (for admins, owner only)
- [ ] Verify "Remove from Crew" option
- [ ] Tap "Promote to Admin", confirm role changes
- [ ] Tap "Remove from Crew", confirm with alert
- [ ] Member removed, list updates

**Expected**:
- Action sheet displays appropriate options based on permissions
- Role changes reflected immediately
- Haptic feedback on actions
- Confirmation dialogs for destructive actions

---

### 5. Crew Settings

**Test Case**: Update crew settings (Owner/Admin only)
- [ ] Tap settings icon in crew detail
- [ ] Update crew name
- [ ] Update description
- [ ] Change crew type
- [ ] Change privacy setting
- [ ] Select different theme color
- [ ] Tap "Save Changes"
- [ ] Verify updates reflected in crew detail

**Test Case**: Delete crew (Owner only)
- [ ] Scroll to "Danger Zone"
- [ ] Tap "Delete Crew"
- [ ] Confirm deletion alert
- [ ] Verify crew removed from list
- [ ] Navigate back to crew list

**Expected**:
- All settings persist correctly
- Validation prevents empty name
- Delete requires confirmation
- Soft delete (active_status = false)

---

### 6. Crew Invite Flow

**Test Case**: Invite users to crew
- [ ] Open crew detail as admin/owner
- [ ] Tap "Invite" button next to "Members"
- [ ] Search input appears
- [ ] Type username (min 2 characters)
- [ ] Search results display after 300ms debounce
- [ ] Tap user to invite
- [ ] Invite sent successfully
- [ ] User removed from search results

**Expected**:
- Real-time search with debouncing
- Existing members filtered from results
- Success alert on invite sent
- Invite stored in crew_invites table

**Validation**:
- [ ] Search requires 2+ characters
- [ ] Loading indicator during search
- [ ] Empty state when no results
- [ ] Network error handling

---

### 7. Accept/Decline Invites

**Test Case**: Respond to crew invites
- [ ] Navigate to Crew tab
- [ ] Pending invites section appears (if any)
- [ ] Invite card shows crew name, inviter, message
- [ ] Displays expiration countdown
- [ ] Tap "Accept" on invite
- [ ] Confirm added to crew members
- [ ] Tap "Decline" on invite
- [ ] Invite removed from list

**Expected**:
- Invites display correctly with all info
- Accept adds user as member
- Decline removes invite
- Activity logged for both actions

---

### 8. Error Handling

**Test Case**: Network errors
- [ ] Disable network connection
- [ ] Try to create crew
- [ ] Verify error alert appears
- [ ] Check error message is user-friendly
- [ ] Re-enable network
- [ ] Retry operation successfully

**Test Case**: Permission errors
- [ ] As regular member, try to access settings
- [ ] Verify "Only admins can access settings" message
- [ ] Verify cannot remove other members

**Test Case**: Validation errors
- [ ] Try to create crew with empty name
- [ ] Verify validation alert
- [ ] Try to create crew with name > 50 chars
- [ ] Verify character limit enforced

**Expected**:
- All errors display user-friendly messages
- Haptic error feedback
- Error logging in console (dev mode)
- No crashes or undefined errors

---

### 9. Data Persistence

**Test Case**: State management
- [ ] Create crew
- [ ] Close app completely
- [ ] Reopen app
- [ ] Navigate to Crew tab
- [ ] Verify crew still appears
- [ ] Tap crew, verify all data loads

**Test Case**: Real-time updates
- [ ] Have two devices/accounts
- [ ] Add member on device 1
- [ ] Pull to refresh on device 2
- [ ] Verify member appears

**Expected**:
- Data persists across app restarts
- Zustand store maintains state
- Supabase queries work correctly
- Real-time subscriptions (if implemented)

---

### 10. UI/UX Polish

**Test Case**: Design system compliance
- [ ] All screens use pure black background (#000000)
- [ ] Primary color is coral pink (#FF4B6E)
- [ ] Glassmorphism effects render correctly (iOS BlurView)
- [ ] All text readable with proper contrast
- [ ] Spacing consistent throughout
- [ ] Border radius values consistent

**Test Case**: Interactions
- [ ] All buttons provide haptic feedback
- [ ] Loading states show spinners
- [ ] Empty states display helpful messages
- [ ] Pull-to-refresh works on crew list
- [ ] Smooth transitions between screens

**Expected**:
- Pixel-perfect design matching theme
- Smooth 60fps animations
- Responsive haptic feedback
- Professional polish throughout

---

## 📊 Test Results Summary

### Critical Issues (Blocker)
- [ ] None found

### Major Issues (High Priority)
- [ ] None found

### Minor Issues (Low Priority)
- [ ] None found

### Enhancements (Future)
- [ ] None identified

---

## ✅ Sign-Off

**Tested By**: _________________
**Date**: _________________
**Phase 1 Status**: ⏳ PENDING TESTING
**Ready for Phase 2**: ⬜ YES | ⬜ NO

**Notes**:
_______________________________________________________
_______________________________________________________
_______________________________________________________

---

## 🚀 Next Steps

Once all test cases pass:
1. Mark Phase 1 as ✅ COMPLETED
2. Update EXECUTION_ROADMAP.md with 100% Phase 1 progress
3. Begin Phase 2: Party Creation Overhaul
4. Continue systematic execution of the vision

**Phase 1 Deliverables Achieved**:
- ✅ Complete crew system (CRUD)
- ✅ Member management with roles
- ✅ Invite system
- ✅ Database schema with RLS
- ✅ Error handling
- ✅ Navigation updated
- ✅ Mock data removed
- ✅ TypeScript strict mode
- ✅ Clean build
