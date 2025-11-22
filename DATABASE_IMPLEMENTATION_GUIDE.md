# THE HANGOUT - Phase 3 & 4 Database Implementation Guide

## 🎯 Overview

This guide provides step-by-step instructions for Cursor to implement Phase 3 & 4 database migrations safely and verify everything works correctly.

---

## 📋 Pre-Migration Checklist

### 1. Backup Current Database

```bash
# In Supabase Dashboard:
# Settings > Database > Create Backup
# Name: "pre-phase3-backup-2025-11-22"
```

### 2. Verify Dependencies

Run this SQL to check all required tables exist:

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN (
  'profiles', 'parties', 'party_attendees', 'party_crews',
  'crew_members', 'crew_invites', 'crew_activity', 'party_memories'
)
ORDER BY table_name;
```

**Expected Result:** All 8 tables should exist.

### 3. Check Current Row Counts

```sql
SELECT
  'profiles' as table_name, COUNT(*) as row_count FROM profiles
UNION ALL
SELECT 'party_crews', COUNT(*) FROM party_crews
UNION ALL
SELECT 'crew_members', COUNT(*) FROM crew_members
UNION ALL
SELECT 'parties', COUNT(*) FROM parties;
```

**Record these numbers for comparison after migration.**

---

## 🚀 Phase 3 Migration Steps

### Step 1: Run Phase 3 Migration

```bash
# In Supabase SQL Editor:
# 1. Open DATABASE_MIGRATION_PHASE3.sql
# 2. Copy entire contents
# 3. Paste into SQL Editor
# 4. Click "RUN"
# 5. Wait ~2-3 minutes for completion
```

**Expected Output:**
```
NOTICE:  ================================================
NOTICE:  Phase 3 Migration Completed Successfully!
NOTICE:  ================================================
NOTICE:  Tables created:
NOTICE:    - crew_activity_feed
NOTICE:    - crew_polls
NOTICE:    - poll_responses
...
```

### Step 2: Verify Table Creation

```sql
-- Check all Phase 3 tables exist
SELECT table_name,
       (SELECT COUNT(*) FROM information_schema.columns
        WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public'
AND table_name IN (
  'crew_activity_feed', 'crew_polls', 'poll_responses',
  'crew_notifications', 'crew_vouches_v2', 'crew_discovery_scores'
)
ORDER BY table_name;
```

**Expected Result:** 6 tables, each with appropriate column counts.

### Step 3: Verify Indexes Created

```sql
-- Check indexes for Phase 3 tables
SELECT
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
AND tablename IN (
  'crew_activity_feed', 'crew_polls', 'poll_responses',
  'crew_notifications', 'crew_vouches_v2', 'crew_discovery_scores'
)
ORDER BY tablename, indexname;
```

**Expected Result:** ~30+ indexes created.

### Step 4: Verify RLS Policies

```sql
-- Check RLS enabled and policies exist
SELECT
  schemaname,
  tablename,
  policyname,
  cmd,
  qual
FROM pg_policies
WHERE schemaname = 'public'
AND tablename LIKE 'crew_%'
ORDER BY tablename, policyname;
```

**Expected Result:** ~25+ RLS policies across Phase 3 tables.

### Step 5: Verify Triggers

```sql
-- Check triggers created
SELECT
  event_object_table as table_name,
  trigger_name,
  event_manipulation,
  action_statement
FROM information_schema.triggers
WHERE event_object_schema = 'public'
AND event_object_table IN (
  'crew_activity_feed', 'crew_polls', 'poll_responses',
  'crew_members', 'crew_vouches_v2'
)
ORDER BY table_name, trigger_name;
```

**Expected Result:** 5+ triggers configured.

### Step 6: Verify Materialized View

```sql
-- Check materialized view exists
SELECT matviewname, definition
FROM pg_matviews
WHERE schemaname = 'public'
AND matviewname = 'user_vouch_scores';
```

**Expected Result:** 1 row with view definition.

---

## 🚀 Phase 4 Migration Steps

### Step 1: Run Phase 4 Migration

```bash
# In Supabase SQL Editor:
# 1. Open DATABASE_MIGRATION_PHASE4.sql
# 2. Copy entire contents
# 3. Paste into SQL Editor
# 4. Click "RUN"
# 5. Wait ~2-3 minutes for completion
```

### Step 2: Verify Table Creation/Enhancement

```sql
-- Check all Phase 4 tables exist
SELECT table_name,
       (SELECT COUNT(*) FROM information_schema.columns
        WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public'
AND table_name IN (
  'party_live_pulse', 'memory_reactions', 'memory_albums',
  'album_memories', 'memory_collaborators', 'highlight_reels',
  'party_safety_reports'
)
ORDER BY table_name;
```

**Expected Result:** 7 tables.

### Step 3: Verify party_memories Enhancements

```sql
-- Check new columns added to party_memories
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'party_memories'
AND column_name IN (
  'uploader_id', 'file_size_bytes', 'width', 'height',
  'duration_seconds', 'thumbnail_url', 'visibility',
  'is_featured', 'ai_labels', 'location_area', 'reactions_count'
)
ORDER BY column_name;
```

**Expected Result:** 11 new columns.

---

## 🧪 Testing Phase 3 Features

### Test 1: Crew Activity Feed

```sql
-- Create test activity
INSERT INTO crew_activity_feed (crew_id, actor_id, activity_type, metadata, visibility)
SELECT
  pc.id,
  cm.user_id,
  'custom',
  '{"test": "migration_test"}'::jsonb,
  'crew_only'
FROM party_crews pc
JOIN crew_members cm ON cm.crew_id = pc.id
LIMIT 1;

-- Verify it was created
SELECT * FROM crew_activity_feed
WHERE metadata @> '{"test": "migration_test"}'::jsonb;

-- Clean up
DELETE FROM crew_activity_feed
WHERE metadata @> '{"test": "migration_test"}'::jsonb;
```

**Expected:** Insert succeeds, select returns 1 row, delete succeeds.

### Test 2: Crew Polls

```sql
-- Create test poll
INSERT INTO crew_polls (crew_id, creator_id, question, options)
SELECT
  pc.id,
  cm.user_id,
  'Test poll - delete me',
  '[
    {"id": "opt1", "text": "Option 1", "emoji": "🎉"},
    {"id": "opt2", "text": "Option 2", "emoji": "🔥"}
  ]'::jsonb
FROM party_crews pc
JOIN crew_members cm ON cm.crew_id = pc.id
WHERE cm.role = 'owner'
LIMIT 1
RETURNING id;

-- Add test response
INSERT INTO poll_responses (poll_id, user_id, selected_option_ids)
SELECT
  cp.id,
  cm.user_id,
  ARRAY['opt1']
FROM crew_polls cp
JOIN crew_members cm ON cm.crew_id = cp.crew_id
WHERE cp.question = 'Test poll - delete me'
LIMIT 1;

-- Verify denormalized counts updated
SELECT question, total_responses, unique_voters
FROM crew_polls
WHERE question = 'Test poll - delete me';

-- Clean up
DELETE FROM crew_polls WHERE question = 'Test poll - delete me';
```

**Expected:** Poll created, response added, counts updated automatically (total_responses=1, unique_voters=1).

### Test 3: Notifications

```sql
-- Create test notification
INSERT INTO crew_notifications (
  user_id, crew_id, notification_type, metadata, priority
)
SELECT
  cm.user_id,
  cm.crew_id,
  'system_announcement',
  '{"test": "migration_notification"}'::jsonb,
  'low'
FROM crew_members cm
LIMIT 1
RETURNING id;

-- Verify unread query works (CRITICAL PATH)
EXPLAIN ANALYZE
SELECT * FROM crew_notifications
WHERE user_id = (SELECT user_id FROM crew_members LIMIT 1)
  AND read_at IS NULL
  AND archived_at IS NULL
ORDER BY created_at DESC;

-- Clean up
DELETE FROM crew_notifications
WHERE metadata @> '{"test": "migration_notification"}'::jsonb;
```

**Expected:** Query uses `idx_notifications_unread` index, execution time <20ms.

### Test 4: Vouches v2

```sql
-- Create test vouch
WITH test_users AS (
  SELECT DISTINCT user_id
  FROM crew_members
  LIMIT 2
)
INSERT INTO crew_vouches_v2 (voucher_id, vouched_user_id, strength, reason, tags)
SELECT
  (SELECT user_id FROM test_users LIMIT 1 OFFSET 0),
  (SELECT user_id FROM test_users LIMIT 1 OFFSET 1),
  5,
  'Test vouch - migration',
  ARRAY['test', 'migration']
RETURNING id;

-- Refresh materialized view
REFRESH MATERIALIZED VIEW user_vouch_scores;

-- Verify aggregate calculated
SELECT * FROM user_vouch_scores
WHERE vouched_user_id = (
  SELECT vouched_user_id FROM crew_vouches_v2
  WHERE reason = 'Test vouch - migration'
  LIMIT 1
);

-- Clean up
DELETE FROM crew_vouches_v2 WHERE reason = 'Test vouch - migration';
REFRESH MATERIALIZED VIEW user_vouch_scores;
```

**Expected:** Vouch created, materialized view shows correct totals.

---

## 🧪 Testing Phase 4 Features

### Test 1: Live Pulse Submission

```sql
-- Create test pulse (simulate attendee submission)
INSERT INTO party_live_pulse (
  party_id, submitter_id, energy_level, vibe_emoji, attendee_count
)
SELECT
  p.id,
  pa.user_id,
  75,
  '🔥',
  10
FROM parties p
JOIN party_attendees pa ON pa.party_id = p.id
WHERE p.status = 'live' OR p.status = 'upcoming'
LIMIT 1
RETURNING id, party_id;

-- Get energy summary
SELECT * FROM get_party_live_energy(
  (SELECT party_id FROM party_live_pulse ORDER BY recorded_at DESC LIMIT 1)
);

-- Clean up
DELETE FROM party_live_pulse WHERE vibe_emoji = '🔥' AND energy_level = 75;
```

**Expected:** Pulse created, summary function returns accurate stats.

### Test 2: Memory Reactions

```sql
-- Add test reaction
INSERT INTO memory_reactions (memory_id, user_id, reaction_type)
SELECT
  pm.id,
  pa.user_id,
  'fire'
FROM party_memories pm
JOIN party_attendees pa ON pa.party_id = pm.party_id
LIMIT 1
RETURNING id, memory_id;

-- Verify denormalized count updated
SELECT id, reactions_count FROM party_memories
WHERE id = (SELECT memory_id FROM memory_reactions ORDER BY reacted_at DESC LIMIT 1);

-- Clean up
DELETE FROM memory_reactions WHERE reaction_type = 'fire'
  AND reacted_at > NOW() - INTERVAL '1 minute';
```

**Expected:** Reaction added, `reactions_count` incremented on party_memories.

### Test 3: Memory Albums

```sql
-- Create test album
INSERT INTO memory_albums (party_id, creator_id, title, visibility)
SELECT
  p.id,
  p.host_id,
  'Test Album - Migration',
  'attendees_only'
FROM parties p
LIMIT 1
RETURNING id;

-- Add memory to album
INSERT INTO album_memories (album_id, memory_id, added_by, position)
SELECT
  ma.id,
  pm.id,
  ma.creator_id,
  0
FROM memory_albums ma
JOIN party_memories pm ON pm.party_id = ma.party_id
WHERE ma.title = 'Test Album - Migration'
LIMIT 1;

-- Verify denormalized count
SELECT title, memory_count, collaborator_count
FROM memory_albums
WHERE title = 'Test Album - Migration';

-- Clean up
DELETE FROM memory_albums WHERE title = 'Test Album - Migration';
```

**Expected:** Album created, memory added, `memory_count` = 1.

### Test 4: Safety Reports

```sql
-- Create anonymous test report
INSERT INTO party_safety_reports (
  party_id, report_type, severity, description, is_anonymous
)
SELECT
  id,
  'noise_complaint',
  'low',
  'Test safety report - migration verification',
  true
FROM parties
LIMIT 1
RETURNING id;

-- Verify RLS (reporter_id is NULL but insert succeeded)
SELECT id, is_anonymous, status FROM party_safety_reports
WHERE description LIKE '%migration verification%';

-- Clean up
DELETE FROM party_safety_reports
WHERE description LIKE '%migration verification%';
```

**Expected:** Anonymous report created successfully.

---

## 🔍 Performance Testing

### Test Query Performance

```sql
-- Test 1: Crew activity feed (should be <50ms)
EXPLAIN ANALYZE
SELECT * FROM crew_activity_feed
WHERE crew_id = (SELECT id FROM party_crews LIMIT 1)
ORDER BY created_at DESC
LIMIT 50;

-- Test 2: Unread notifications (should be <20ms - CRITICAL)
EXPLAIN ANALYZE
SELECT * FROM crew_notifications
WHERE user_id = (SELECT user_id FROM crew_members LIMIT 1)
  AND read_at IS NULL
  AND archived_at IS NULL
ORDER BY created_at DESC
LIMIT 50;

-- Test 3: Poll results aggregation
EXPLAIN ANALYZE
SELECT
  cp.question,
  COUNT(DISTINCT pr.user_id) as voters,
  COUNT(*) as total_votes
FROM crew_polls cp
LEFT JOIN poll_responses pr ON pr.poll_id = cp.id
WHERE cp.crew_id = (SELECT id FROM party_crews LIMIT 1)
GROUP BY cp.id, cp.question;

-- Test 4: Vouch scores (materialized view - should be instant)
EXPLAIN ANALYZE
SELECT * FROM user_vouch_scores
WHERE total_vouches > 0
ORDER BY average_strength DESC
LIMIT 10;
```

**Expected Results:**
- Activity feed: <50ms, uses `idx_crew_activity_crew_time`
- Notifications: <20ms, uses `idx_notifications_unread`
- Poll results: <100ms
- Vouch scores: <5ms (materialized view)

---

## 📊 Monitor Table Sizes

```sql
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size,
  pg_total_relation_size(schemaname||'.'||tablename) AS size_bytes
FROM pg_tables
WHERE schemaname = 'public'
AND tablename LIKE 'crew_%' OR tablename LIKE 'party_%' OR tablename LIKE 'memory_%'
ORDER BY size_bytes DESC;
```

**Baseline (empty tables):** Each table should be <100 KB

---

## 🔧 Setup Scheduled Jobs

### Configure pg_cron for Nightly Maintenance

```sql
-- Install pg_cron extension (run in Supabase Dashboard > Database > Extensions)
-- Then schedule nightly maintenance:

SELECT cron.schedule(
  'nightly-maintenance',
  '0 3 * * *', -- Every day at 3 AM UTC
  $$SELECT run_nightly_maintenance()$$
);

-- Verify job scheduled
SELECT * FROM cron.job;
```

### Manual Maintenance

```sql
-- Run manually to test
SELECT run_nightly_maintenance();

-- Should output:
-- NOTICE:  Archived N activities
-- NOTICE:  Archived N notifications
-- NOTICE:  Nightly maintenance completed at [timestamp]
```

---

## ⚡ Enable Realtime Subscriptions

### Verify Realtime Enabled

```sql
-- Check which tables have realtime enabled
SELECT
  schemaname,
  tablename
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
ORDER BY tablename;
```

**Expected tables:**
- crew_activity_feed
- crew_polls
- poll_responses
- crew_notifications
- party_live_pulse
- memory_reactions
- highlight_reels

---

## 🎯 Integration Testing (Client-Side)

### Test 1: Real-time Activity Feed

```typescript
// In your app code
const subscription = supabase
  .channel(`crew:${crewId}:activity`)
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'crew_activity_feed',
      filter: `crew_id=eq.${crewId}`,
    },
    (payload) => {
      console.log('New activity:', payload.new);
    }
  )
  .subscribe();

// Test by inserting activity via SQL or app
```

### Test 2: Notification System

```typescript
// Subscribe to user notifications
const notificationSub = supabase
  .channel(`user:${userId}:notifications`)
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'crew_notifications',
      filter: `user_id=eq.${userId}`,
    },
    (payload) => {
      showNotification(payload.new);
    }
  )
  .subscribe();
```

### Test 3: Poll Voting

```typescript
// Cast vote
const { data, error } = await supabase
  .from('poll_responses')
  .insert({
    poll_id: pollId,
    user_id: userId,
    selected_option_ids: ['opt1'],
  })
  .select();

// Verify denormalized counts updated
const { data: poll } = await supabase
  .from('crew_polls')
  .select('total_responses, unique_voters')
  .eq('id', pollId)
  .single();

console.log('Vote counts:', poll);
```

---

## 🚨 Rollback Plan (If Needed)

### Phase 3 Rollback

```sql
-- Drop Phase 3 tables (in reverse order)
DROP TABLE IF EXISTS crew_discovery_scores CASCADE;
DROP TABLE IF EXISTS crew_vouches_v2 CASCADE;
DROP MATERIALIZED VIEW IF EXISTS user_vouch_scores CASCADE;
DROP TABLE IF EXISTS crew_notifications CASCADE;
DROP TABLE IF EXISTS poll_responses CASCADE;
DROP TABLE IF EXISTS crew_polls CASCADE;
DROP TABLE IF EXISTS crew_activity_feed CASCADE;
DROP TABLE IF EXISTS crew_activity_archive CASCADE;
DROP TABLE IF EXISTS crew_notifications_archive CASCADE;

-- Restore from backup
-- (Use Supabase Dashboard > Database > Restore Backup)
```

### Phase 4 Rollback

```sql
-- Drop Phase 4 tables
DROP TABLE IF EXISTS party_safety_reports CASCADE;
DROP TABLE IF EXISTS highlight_reels CASCADE;
DROP TABLE IF EXISTS memory_collaborators CASCADE;
DROP TABLE IF EXISTS album_memories CASCADE;
DROP TABLE IF EXISTS memory_albums CASCADE;
DROP TABLE IF EXISTS memory_reactions CASCADE;
DROP TABLE IF EXISTS party_live_pulse CASCADE;

-- Revert party_memories enhancements
ALTER TABLE party_memories
  DROP COLUMN IF EXISTS uploader_id,
  DROP COLUMN IF EXISTS file_size_bytes,
  DROP COLUMN IF EXISTS width,
  DROP COLUMN IF EXISTS height,
  DROP COLUMN IF EXISTS duration_seconds,
  DROP COLUMN IF EXISTS thumbnail_url,
  DROP COLUMN IF EXISTS visibility,
  DROP COLUMN IF EXISTS is_featured,
  DROP COLUMN IF EXISTS ai_labels,
  DROP COLUMN IF EXISTS location_area,
  DROP COLUMN IF EXISTS reactions_count;
```

---

## ✅ Post-Migration Checklist

- [ ] Phase 3 migration completed without errors
- [ ] Phase 4 migration completed without errors
- [ ] All tables created with correct columns
- [ ] All indexes created (verify with pg_indexes query)
- [ ] RLS policies enabled and tested
- [ ] Triggers firing correctly (test with inserts)
- [ ] Materialized views created and populated
- [ ] Realtime enabled on all required tables
- [ ] Scheduled jobs configured (pg_cron)
- [ ] Performance tests passing (<50ms for critical queries)
- [ ] Client-side realtime subscriptions working
- [ ] Data archiving tested manually
- [ ] Backup created post-migration
- [ ] Documentation updated
- [ ] Team notified of new features

---

## 📈 Monitoring & Maintenance

### Daily Checks

```sql
-- Check table growth
SELECT
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('crew_notifications', 'crew_activity_feed', 'party_live_pulse')
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Check archived row counts
SELECT
  'crew_activity_archive' as table_name,
  COUNT(*) as row_count,
  MIN(created_at) as oldest,
  MAX(created_at) as newest
FROM crew_activity_archive
UNION ALL
SELECT
  'crew_notifications_archive',
  COUNT(*),
  MIN(created_at),
  MAX(created_at)
FROM crew_notifications_archive;
```

### Weekly Checks

```sql
-- Refresh materialized views
REFRESH MATERIALIZED VIEW CONCURRENTLY user_vouch_scores;

-- Check slow queries (if query logging enabled)
SELECT
  query,
  mean_exec_time,
  calls
FROM pg_stat_statements
WHERE query LIKE '%crew_%' OR query LIKE '%poll_%'
ORDER BY mean_exec_time DESC
LIMIT 10;
```

---

## 🎉 Success Criteria

Migration is considered successful when:

1. ✅ All tables created with 0 errors
2. ✅ All indexes created and used by queries
3. ✅ RLS policies prevent unauthorized access
4. ✅ Triggers auto-update denormalized counts
5. ✅ Realtime subscriptions receive events
6. ✅ Performance tests meet <50ms threshold
7. ✅ Client app can interact with new features
8. ✅ No production errors or crashes

---

## 📞 Support

If issues arise:

1. Check Supabase logs: Dashboard > Logs > Postgres Logs
2. Review RLS policy failures: Look for "permission denied" errors
3. Check trigger execution: Monitor for "trigger failed" errors
4. Verify indexes used: Run EXPLAIN ANALYZE on slow queries
5. Contact team: Share error logs and steps to reproduce

---

**Migration prepared by:** Claude Code (Terminal B)
**Date:** 2025-11-22
**Status:** Ready for Cursor execution
