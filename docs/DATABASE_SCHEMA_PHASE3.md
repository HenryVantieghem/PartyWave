# Database Schema - Phase 3 & 4

## Overview

This document describes the database schema for Phase 3 (Crew Engagement) and Phase 4 (Live Party Features) of The Hangout app.

## Phase 3: Crew Engagement Tables

### 1. crew_activity_feed

Real-time activity log for crew engagement, shows what members are doing.

**Columns:**
- `id` (UUID, PK)
- `crew_id` (UUID, FK → party_crews)
- `actor_id` (UUID, FK → auth.users)
- `activity_type` (TEXT) - One of: member_joined, member_left, member_invited, member_mentioned, party_created, party_happening, comment_added, vouch_given, poll_created, milestone_reached
- `metadata` (JSONB) - Flexible data: {target_user_id, comment_text, party_name, milestone_level, etc}
- `created_at` (TIMESTAMPTZ)
- `visibility` (TEXT) - 'crew_only' or 'public', default 'crew_only'

**Indexes:**
- `idx_crew_activity_crew_time` - (crew_id, created_at DESC)
- `idx_crew_activity_actor` - (actor_id, created_at DESC)
- `idx_crew_activity_type` - (crew_id, activity_type, created_at DESC)

**RLS Policies:**
- Public activities visible to all
- Crew members see their crew's activities
- Users can create activities for themselves

**Sample Queries:**

```sql
-- Get recent activity for a crew
SELECT * FROM crew_activity_feed
WHERE crew_id = $1
ORDER BY created_at DESC
LIMIT 50;

-- Get activities by type
SELECT * FROM crew_activity_feed
WHERE crew_id = $1 AND activity_type = 'member_joined'
ORDER BY created_at DESC;
```

### 2. quick_plans

Quick polls for crew decision-making: "Where should we go?", "What time?", etc.

**Columns:**
- `id` (UUID, PK)
- `crew_id` (UUID, FK → party_crews)
- `creator_id` (UUID, FK → auth.users)
- `question` (TEXT) - The poll question
- `options` (JSONB) - Array of poll options with emoji: [{id: uuid, text: string, emoji: string}, ...]
- `responses` (JSONB) - Map of user_id -> option_id
- `deadline` (TIMESTAMPTZ)
- `status` (TEXT) - 'open', 'closed', or 'results', default 'open'
- `created_at` (TIMESTAMPTZ)
- `updated_at` (TIMESTAMPTZ)

**Indexes:**
- `idx_quick_plans_crew` - (crew_id, deadline)
- `idx_quick_plans_creator` - (creator_id, created_at DESC)
- `idx_quick_plans_status` - (crew_id, status)

**RLS Policies:**
- Crew members see quick plans for their crews
- Crew members can create polls
- Crew members can update polls they created

**Sample Queries:**

```sql
-- Get active polls for a crew
SELECT * FROM quick_plans
WHERE crew_id = $1 AND status = 'open' AND deadline > NOW()
ORDER BY deadline ASC;

-- Submit a response to a poll
UPDATE quick_plans
SET responses = jsonb_set(responses, ARRAY[$2::text], $3::jsonb)
WHERE id = $1;
```

### 3. crew_notifications

User notifications - one per user per event. Read timestamp tracks seen notifications.

**Columns:**
- `id` (UUID, PK)
- `user_id` (UUID, FK → auth.users)
- `crew_id` (UUID, FK → party_crews)
- `notification_type` (TEXT) - One of: member_joined, member_left, member_invited, mentioned, poll_created, poll_closed, party_happening, milestone
- `metadata` (JSONB) - {actor_name, action, target_crew, etc}
- `read_at` (TIMESTAMPTZ) - NULL = unread, timestamp = when user read it
- `created_at` (TIMESTAMPTZ)

**Indexes:**
- `idx_notifications_user` - (user_id, read_at)
- `idx_notifications_unread` - (user_id, created_at DESC) WHERE read_at IS NULL
- `idx_notifications_crew` - (crew_id, created_at DESC)

**RLS Policies:**
- Users see only their own notifications
- System creates notifications for users (via triggers)
- Users can update their own notifications

**Sample Queries:**

```sql
-- Get unread notifications for a user
SELECT * FROM crew_notifications
WHERE user_id = $1 AND read_at IS NULL
ORDER BY created_at DESC;

-- Mark notification as read
UPDATE crew_notifications
SET read_at = NOW()
WHERE id = $1 AND user_id = $2;
```

### 4. crew_vouches_v2

Trust/safety system: users can vouch for friends (trustworthiness signal).

**Columns:**
- `id` (UUID, PK)
- `voucher_id` (UUID, FK → auth.users) - User giving the vouch
- `vouched_user_id` (UUID, FK → auth.users) - User being vouched for
- `crew_id` (UUID, FK → party_crews)
- `reason` (TEXT) - Why are you vouching for this person?
- `strength` (INTEGER) - 1=weak, 5=strong, default 3
- `created_at` (TIMESTAMPTZ)
- UNIQUE(voucher_id, vouched_user_id, crew_id)

**Indexes:**
- `idx_vouches_vouched` - (vouched_user_id, strength DESC)
- `idx_vouches_crew` - (crew_id, strength DESC)

**RLS Policies:**
- All vouches are publicly visible
- Users can only vouch for others (not themselves)
- Users can update their own vouches

**Sample Queries:**

```sql
-- Get vouches for a user
SELECT * FROM crew_vouches_v2
WHERE vouched_user_id = $1
ORDER BY strength DESC, created_at DESC;

-- Get average vouch strength for a user in a crew
SELECT AVG(strength) as avg_strength, COUNT(*) as vouch_count
FROM crew_vouches_v2
WHERE vouched_user_id = $1 AND crew_id = $2;
```

### 5. crew_discovery_scores

Pre-calculated affinity between crews and users for discovery algorithm.

**Columns:**
- `id` (UUID, PK)
- `crew_id` (UUID, FK → party_crews)
- `user_id` (UUID, FK → auth.users)
- `affinity_score` (NUMERIC(5,2)) - 0-100
- `factors` (JSONB) - {shared_interests: 0.3, friend_of_friend: 0.5, ...}
- `calculated_at` (TIMESTAMPTZ)
- UNIQUE(crew_id, user_id)

**Indexes:**
- `idx_discovery_user` - (user_id, affinity_score DESC)
- `idx_discovery_crew` - (crew_id, affinity_score DESC)

**RLS Policies:**
- Only admins can view discovery scores

**Sample Queries:**

```sql
-- Get top crews for a user (admin only)
SELECT c.*, cds.affinity_score
FROM crew_discovery_scores cds
JOIN party_crews c ON c.id = cds.crew_id
WHERE cds.user_id = $1
ORDER BY cds.affinity_score DESC
LIMIT 20;
```

## Phase 4: Live Party Features Tables

### 1. party_live_pulse

Real-time energy tracking during live parties - crowd-sourced pulse data.

**Columns:**
- `id` (UUID, PK)
- `party_id` (UUID, FK → parties)
- `recorded_by` (UUID, FK → auth.users)
- `energy_level` (INTEGER) - 0-100 scale: 0=dead, 50=chill, 100=insane
- `attendee_count` (INTEGER)
- `vibe_tags` (TEXT[])
- `music_playing` (BOOLEAN)
- `peak_moment` (BOOLEAN)
- `notes` (TEXT)
- `created_at` (TIMESTAMPTZ)

**Indexes:**
- `idx_live_pulse_party` - (party_id, created_at DESC)
- `idx_live_pulse_recorded` - (recorded_by, created_at DESC)

**RLS Policies:**
- Anyone can view live pulse
- Attendees can record pulse

**Sample Queries:**

```sql
-- Get recent pulse readings for a party
SELECT * FROM party_live_pulse
WHERE party_id = $1
ORDER BY created_at DESC
LIMIT 20;

-- Get average energy level for a party
SELECT AVG(energy_level) as avg_energy, COUNT(*) as readings
FROM party_live_pulse
WHERE party_id = $1 AND created_at > NOW() - INTERVAL '1 hour';
```

### 2. party_memories (Enhanced)

Photos/videos captured during parties - can be stories or highlights.

**New Columns Added:**
- `is_highlight` (BOOLEAN) - Highlights are permanent, stories expire
- `location_name` (TEXT)
- `timestamp_at_party` (TIMESTAMPTZ) - When during the party this was taken
- `updated_at` (TIMESTAMPTZ)

**Indexes:**
- `idx_memories_party` - (party_id, created_at DESC)
- `idx_memories_user` - (user_id, created_at DESC)
- `idx_memories_highlight` - (party_id, is_highlight) WHERE is_highlight = true

**RLS Policies:**
- Anyone can view public memories
- Attendees can create memories
- Creators can update/delete their memories

### 3. memory_collaborators

Track who is in/tagged in memories - for collaborative albums.

**Columns:**
- `id` (UUID, PK)
- `memory_id` (UUID, FK → party_memories)
- `user_id` (UUID, FK → auth.users)
- `role` (TEXT) - 'creator', 'tagged', or 'contributor', default 'tagged'
- `created_at` (TIMESTAMPTZ)
- UNIQUE(memory_id, user_id)

**Indexes:**
- `idx_collaborators_memory` - (memory_id)
- `idx_collaborators_user` - (user_id)

**RLS Policies:**
- Anyone can view collaborators
- Memory creators can manage collaborators

### 4. highlight_reels

Curated collections of party memories - auto-generated or manual.

**Columns:**
- `id` (UUID, PK)
- `party_id` (UUID, FK → parties)
- `creator_id` (UUID, FK → auth.users)
- `title` (TEXT)
- `description` (TEXT)
- `memory_ids` (UUID[]) - Ordered array of memory IDs
- `cover_image_url` (TEXT)
- `duration_seconds` (INTEGER)
- `view_count` (INTEGER) - Default 0
- `is_public` (BOOLEAN) - Default true
- `created_at` (TIMESTAMPTZ)
- `updated_at` (TIMESTAMPTZ)

**Indexes:**
- `idx_reels_party` - (party_id, created_at DESC)
- `idx_reels_creator` - (creator_id, created_at DESC)
- `idx_reels_public` - (is_public, view_count DESC) WHERE is_public = true

**RLS Policies:**
- Public reels are visible to all
- Creators can manage their reels

### 5. party_safety_reports

Safety incident reporting system - anonymous reporting available.

**Columns:**
- `id` (UUID, PK)
- `party_id` (UUID, FK → parties)
- `reporter_id` (UUID, FK → auth.users)
- `report_type` (TEXT) - harassment, unsafe_environment, violence, drugs, underage, other
- `description` (TEXT)
- `severity` (TEXT) - low, medium, high, critical, default 'medium'
- `status` (TEXT) - pending, reviewing, resolved, dismissed, default 'pending'
- `admin_notes` (TEXT)
- `resolved_at` (TIMESTAMPTZ)
- `created_at` (TIMESTAMPTZ)
- `updated_at` (TIMESTAMPTZ)

**Indexes:**
- `idx_safety_party` - (party_id, status, created_at DESC)
- `idx_safety_reporter` - (reporter_id, created_at DESC)
- `idx_safety_severity` - (status, severity, created_at DESC) WHERE status = 'pending'

**RLS Policies:**
- Anyone can create safety reports
- Only admins can view/update safety reports

## Database Functions

### log_crew_member_joined()

Trigger function that automatically creates an activity feed entry when a user joins a crew.

**Trigger:** `trigger_member_joined` on `crew_members` table

### notify_on_activity()

Trigger function that creates notifications for crew members when someone is mentioned in an activity.

**Trigger:** `trigger_notify_on_activity` on `crew_activity_feed` table

### close_expired_polls()

Function to mark polls as 'results' after their deadline has passed. Should be scheduled via pg_cron.

**Usage:**
```sql
SELECT close_expired_polls();
```

### update_updated_at_column()

Trigger function that automatically updates the `updated_at` timestamp on table updates.

**Triggers:**
- `trigger_update_quick_plans_updated_at` on `quick_plans`
- `trigger_update_memories_updated_at` on `party_memories`
- `trigger_update_reels_updated_at` on `highlight_reels`
- `trigger_update_safety_updated_at` on `party_safety_reports`

## Performance Notes

1. **Indexes**: All foreign keys and frequently queried columns are indexed for optimal performance.

2. **Partial Indexes**: Used for filtered queries (e.g., unread notifications, pending safety reports).

3. **JSONB Columns**: Used for flexible metadata storage. Consider GIN indexes if querying JSONB content frequently.

4. **Array Columns**: `vibe_tags` and `memory_ids` use PostgreSQL arrays. Consider GIN indexes for array containment queries.

5. **RLS Performance**: RLS policies use subqueries which can impact performance. Monitor query plans and consider materialized views for complex policies.

## Common Operations

### Get Crew Activity Feed

```sql
SELECT caf.*, p.username as actor_username
FROM crew_activity_feed caf
JOIN profiles p ON p.id = caf.actor_id
WHERE caf.crew_id = $1
ORDER BY caf.created_at DESC
LIMIT 50;
```

### Create a Quick Plan Poll

```sql
INSERT INTO quick_plans (crew_id, creator_id, question, options, deadline)
VALUES (
  $1,
  $2,
  'Where should we go?',
  '[
    {"id": "opt1", "text": "Beach", "emoji": "🏖️"},
    {"id": "opt2", "text": "Club", "emoji": "🎉"}
  ]'::jsonb,
  NOW() + INTERVAL '24 hours'
)
RETURNING *;
```

### Get Unread Notification Count

```sql
SELECT COUNT(*) as unread_count
FROM crew_notifications
WHERE user_id = $1 AND read_at IS NULL;
```

### Record Party Pulse

```sql
INSERT INTO party_live_pulse (party_id, recorded_by, energy_level, attendee_count, vibe_tags)
VALUES ($1, $2, 85, 50, ARRAY['lit', 'wild'])
RETURNING *;
```

## Migration History

- `001_phase3_crew_engagement.sql` - Created Phase 3 tables
- `002_phase3_indexes_and_functions.sql` - Added indexes and trigger functions
- `003_phase3_rls_policies.sql` - Added RLS policies for Phase 3
- `004_phase4_live_features.sql` - Created Phase 4 tables and enhanced party_memories
- `005_phase4_rls_policies.sql` - Added RLS policies for Phase 4

