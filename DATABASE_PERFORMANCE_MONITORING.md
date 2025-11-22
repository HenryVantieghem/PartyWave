# THE HANGOUT - Database Performance Monitoring & Optimization

## 📊 Performance Monitoring Dashboard

This document contains ready-to-run queries for monitoring database health, performance, and optimization opportunities.

---

## 🎯 Critical Performance Metrics

### Query 1: Table Sizes & Growth Rate

```sql
WITH table_sizes AS (
  SELECT
    schemaname,
    tablename,
    pg_total_relation_size(schemaname||'.'||tablename) AS total_bytes,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS total_size,
    pg_relation_size(schemaname||'.'||tablename) AS table_bytes,
    pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) AS table_size,
    pg_total_relation_size(schemaname||'.'||tablename) - pg_relation_size(schemaname||'.'||tablename) AS index_bytes,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) - pg_relation_size(schemaname||'.'||tablename)) AS index_size
  FROM pg_tables
  WHERE schemaname = 'public'
)
SELECT
  tablename,
  total_size,
  table_size,
  index_size,
  ROUND(100.0 * index_bytes / NULLIF(total_bytes, 0), 2) AS index_ratio
FROM table_sizes
ORDER BY total_bytes DESC
LIMIT 20;
```

**What to look for:**
- `crew_notifications` growing >100 MB → Enable aggressive archiving
- `crew_activity_feed` growing >50 MB → Check archiving schedule
- Index ratio >70% → Too many indexes, consider consolidation

---

### Query 2: Row Counts by Table

```sql
SELECT
  schemaname,
  tablename,
  n_tup_ins AS inserts,
  n_tup_upd AS updates,
  n_tup_del AS deletes,
  n_live_tup AS live_rows,
  n_dead_tup AS dead_rows,
  ROUND(100.0 * n_dead_tup / NULLIF(n_live_tup + n_dead_tup, 0), 2) AS dead_row_pct,
  last_vacuum,
  last_autovacuum
FROM pg_stat_user_tables
WHERE schemaname = 'public'
AND tablename LIKE 'crew_%' OR tablename LIKE 'party_%' OR tablename LIKE 'memory_%'
ORDER BY n_live_tup DESC;
```

**What to look for:**
- Dead row % >20% → Run VACUUM ANALYZE
- `last_autovacuum` NULL or >7 days → Manual vacuum needed
- High delete rate on `crew_notifications` → Archiving working correctly

---

### Query 3: Index Usage Statistics

```sql
SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan AS index_scans,
  idx_tup_read AS tuples_read,
  idx_tup_fetch AS tuples_fetched,
  pg_size_pretty(pg_relation_size(indexrelid)) AS index_size,
  CASE
    WHEN idx_scan = 0 THEN '🚨 NEVER USED'
    WHEN idx_scan < 100 THEN '⚠️  RARELY USED'
    WHEN idx_scan < 1000 THEN '✅ OCCASIONALLY USED'
    ELSE '🔥 FREQUENTLY USED'
  END AS usage_status
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
AND (tablename LIKE 'crew_%' OR tablename LIKE 'party_%' OR tablename LIKE 'memory_%')
ORDER BY idx_scan ASC, pg_relation_size(indexrelid) DESC;
```

**What to look for:**
- Index with 0 scans + large size → Consider dropping
- Critical indexes (e.g., `idx_notifications_unread`) should show high scan count
- Unused GIN indexes are expensive, review necessity

---

### Query 4: Slow Queries (Top 20)

```sql
-- Requires pg_stat_statements extension
SELECT
  LEFT(query, 100) AS query_snippet,
  calls,
  ROUND(mean_exec_time::numeric, 2) AS avg_time_ms,
  ROUND(total_exec_time::numeric, 2) AS total_time_ms,
  ROUND((100 * total_exec_time / SUM(total_exec_time) OVER ())::numeric, 2) AS pct_total_time,
  stddev_exec_time AS stddev_ms,
  min_exec_time AS min_ms,
  max_exec_time AS max_ms
FROM pg_stat_statements
WHERE query LIKE '%crew_%' OR query LIKE '%party_%' OR query LIKE '%notification%'
ORDER BY mean_exec_time DESC
LIMIT 20;
```

**What to look for:**
- Any query with avg_time_ms >100ms → Investigate and optimize
- High stddev → Inconsistent performance, possible locking issues
- Queries with high calls + high total_time → Prime optimization candidates

---

### Query 5: Real-time Connection Count

```sql
SELECT
  datname AS database,
  usename AS user,
  application_name,
  client_addr,
  state,
  COUNT(*) AS connection_count
FROM pg_stat_activity
WHERE datname = current_database()
GROUP BY datname, usename, application_name, client_addr, state
ORDER BY connection_count DESC;
```

**What to look for:**
- Total connections approaching Supabase limit (Free: 60, Pro: 200)
- Many `idle` connections → Connection pooling issue
- High count from single client_addr → Potential leak

---

## 🔍 Phase 3 Specific Monitoring

### Query 6: Crew Activity Feed Health

```sql
SELECT
  'Total activities' AS metric,
  COUNT(*)::TEXT AS value
FROM crew_activity_feed
UNION ALL
SELECT
  'Activities last 24h',
  COUNT(*)::TEXT
FROM crew_activity_feed
WHERE created_at > NOW() - INTERVAL '24 hours'
UNION ALL
SELECT
  'Expired activities',
  COUNT(*)::TEXT
FROM crew_activity_feed
WHERE expires_at < NOW()
UNION ALL
SELECT
  'Public activities',
  COUNT(*)::TEXT
FROM crew_activity_feed
WHERE visibility = 'public'
UNION ALL
SELECT
  'Avg activities per crew',
  ROUND(AVG(activity_count))::TEXT
FROM (
  SELECT crew_id, COUNT(*) AS activity_count
  FROM crew_activity_feed
  GROUP BY crew_id
) t;
```

**Thresholds:**
- Total >100K rows → Enable partitioning
- Expired activities >0 → Cleanup job not running
- Avg per crew >500 → Consider aggressive archiving

---

### Query 7: Notification Queue Health

```sql
SELECT
  'Total notifications' AS metric,
  COUNT(*)::TEXT AS value
FROM crew_notifications
UNION ALL
SELECT
  'Unread notifications',
  COUNT(*)::TEXT
FROM crew_notifications
WHERE read_at IS NULL
UNION ALL
SELECT
  'Archived notifications',
  COUNT(*)::TEXT
FROM crew_notifications
WHERE archived_at IS NOT NULL
UNION ALL
SELECT
  'Notifications older than 30 days (unread)',
  COUNT(*)::TEXT
FROM crew_notifications
WHERE read_at IS NULL AND created_at < NOW() - INTERVAL '30 days'
UNION ALL
SELECT
  'Avg unread per user',
  ROUND(AVG(unread_count))::TEXT
FROM (
  SELECT user_id, COUNT(*) AS unread_count
  FROM crew_notifications
  WHERE read_at IS NULL
  GROUP BY user_id
) t;
```

**Thresholds:**
- Total >500K rows → **CRITICAL** - Enable aggressive archiving
- Unread >50 per user → User notification fatigue, reduce frequency
- Old unread >10K → Archive job not running correctly

---

### Query 8: Poll Engagement Metrics

```sql
SELECT
  cp.id,
  cp.question,
  cp.status,
  cp.unique_voters,
  cp.total_responses,
  cm.member_count AS crew_size,
  ROUND(100.0 * cp.unique_voters / NULLIF(cm.member_count, 0), 2) AS participation_pct,
  cp.deadline,
  CASE
    WHEN cp.deadline < NOW() THEN 'Expired'
    WHEN cp.deadline < NOW() + INTERVAL '1 hour' THEN 'Closing Soon'
    ELSE 'Active'
  END AS urgency
FROM crew_polls cp
JOIN (
  SELECT crew_id, COUNT(*) AS member_count
  FROM crew_members
  WHERE is_active = true
  GROUP BY crew_id
) cm ON cm.crew_id = cp.crew_id
WHERE cp.status = 'open'
ORDER BY participation_pct DESC;
```

**What to look for:**
- Participation <30% → Poll question unclear or not relevant
- Many expired open polls → Auto-close job not running
- High participation → Engaging polls, study patterns

---

### Query 9: Vouch Network Analysis

```sql
SELECT
  'Total vouches' AS metric,
  COUNT(*)::TEXT AS value
FROM crew_vouches_v2
UNION ALL
SELECT
  'Unique vouchers',
  COUNT(DISTINCT voucher_id)::TEXT
FROM crew_vouches_v2
UNION ALL
SELECT
  'Unique vouched users',
  COUNT(DISTINCT vouched_user_id)::TEXT
FROM crew_vouches_v2
UNION ALL
SELECT
  'Avg vouches received',
  ROUND(AVG(total_vouches), 2)::TEXT
FROM user_vouch_scores
UNION ALL
SELECT
  'Users with 5+ vouches',
  COUNT(*)::TEXT
FROM user_vouch_scores
WHERE total_vouches >= 5
UNION ALL
SELECT
  'Materialized view last refreshed',
  MAX(last_vouch_received)::TEXT
FROM user_vouch_scores;
```

**What to look for:**
- Last refreshed >7 days → Refresh materialized view
- Low average vouches → Feature not discovered, improve UX
- High concentration (few users with many vouches) → Good engagement

---

### Query 10: Discovery Algorithm Performance

```sql
SELECT
  algorithm_version,
  COUNT(*) AS score_count,
  ROUND(AVG(affinity_score), 2) AS avg_score,
  ROUND(MIN(affinity_score), 2) AS min_score,
  ROUND(MAX(affinity_score), 2) AS max_score,
  COUNT(DISTINCT user_id) AS unique_users,
  COUNT(DISTINCT crew_id) AS unique_crews,
  MAX(calculated_at) AS last_calculated,
  NOW() - MAX(calculated_at) AS staleness
FROM crew_discovery_scores
WHERE expires_at > NOW()
GROUP BY algorithm_version
ORDER BY algorithm_version DESC;
```

**What to look for:**
- Staleness >7 days → Recalculation job not running
- Avg score <20 → Algorithm not finding good matches
- Multiple versions → A/B test in progress

---

## 🔍 Phase 4 Specific Monitoring

### Query 11: Live Pulse Activity

```sql
SELECT
  p.id AS party_id,
  p.title AS party_name,
  p.status,
  COUNT(plp.id) AS pulse_count,
  ROUND(AVG(plp.energy_level), 2) AS avg_energy,
  MAX(plp.energy_level) AS peak_energy,
  MIN(plp.recorded_at) AS first_pulse,
  MAX(plp.recorded_at) AS last_pulse,
  NOW() - MAX(plp.recorded_at) AS time_since_last
FROM parties p
LEFT JOIN party_live_pulse plp ON plp.party_id = p.id
WHERE p.status = 'live'
  OR (p.status = 'ended' AND p.updated_at > NOW() - INTERVAL '24 hours')
GROUP BY p.id, p.title, p.status
ORDER BY last_pulse DESC;
```

**What to look for:**
- Live parties with no pulses → Attendees not engaging
- High pulse count + high energy → Successful party
- Time since last >30 minutes on live party → Party may have ended

---

### Query 12: Memory & Album Engagement

```sql
SELECT
  'Total memories' AS metric,
  COUNT(*)::TEXT AS value
FROM party_memories
UNION ALL
SELECT
  'Memories with reactions',
  COUNT(DISTINCT memory_id)::TEXT
FROM memory_reactions
UNION ALL
SELECT
  'Total reactions',
  COUNT(*)::TEXT
FROM memory_reactions
UNION ALL
SELECT
  'Avg reactions per memory',
  ROUND(AVG(reactions_count), 2)::TEXT
FROM party_memories
WHERE reactions_count > 0
UNION ALL
SELECT
  'Total albums',
  COUNT(*)::TEXT
FROM memory_albums
UNION ALL
SELECT
  'Avg memories per album',
  ROUND(AVG(memory_count), 2)::TEXT
FROM memory_albums
WHERE memory_count > 0
UNION ALL
SELECT
  'Albums with collaborators',
  COUNT(*)::TEXT
FROM memory_albums
WHERE collaborator_count > 1;
```

**What to look for:**
- Low reaction rate → Feature not discovered
- High memories per album → Users creating compilations
- Few collaborative albums → Promote collaboration feature

---

### Query 13: Safety Report Monitoring

```sql
SELECT
  report_type,
  severity,
  status,
  COUNT(*) AS report_count,
  ROUND(AVG(EXTRACT(EPOCH FROM (COALESCE(resolved_at, NOW()) - created_at)) / 3600), 2) AS avg_resolution_hours
FROM party_safety_reports
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY report_type, severity, status
ORDER BY
  CASE severity
    WHEN 'critical' THEN 1
    WHEN 'high' THEN 2
    WHEN 'medium' THEN 3
    ELSE 4
  END,
  report_count DESC;
```

**What to look for:**
- Critical/high severity reports → Immediate attention needed
- Resolution time >24 hours → Slow response, need faster triage
- High report volume for specific type → Systemic issue

---

### Query 14: Highlight Reel Generation Status

```sql
SELECT
  status,
  COUNT(*) AS reel_count,
  ROUND(AVG(duration_seconds), 2) AS avg_duration,
  ROUND(AVG(EXTRACT(EPOCH FROM (processing_completed_at - processing_started_at)) / 60), 2) AS avg_processing_mins,
  MAX(processing_started_at) AS last_started
FROM highlight_reels
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY status
ORDER BY
  CASE status
    WHEN 'processing' THEN 1
    WHEN 'failed' THEN 2
    WHEN 'ready' THEN 3
  END;
```

**What to look for:**
- Many `processing` reels → Video generation service slow
- High `failed` rate → Bug in generation pipeline
- Avg processing time >10 mins → Optimize video pipeline

---

## 🚨 Alert Queries (Run Hourly)

### Alert 1: Critical Table Growth

```sql
SELECT
  tablename,
  pg_size_pretty(pg_total_relation_size('public.'||tablename)) AS size,
  pg_total_relation_size('public.'||tablename) AS bytes
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('crew_notifications', 'crew_activity_feed', 'party_live_pulse')
AND pg_total_relation_size('public.'||tablename) > 104857600 -- >100 MB
ORDER BY bytes DESC;
```

**Alert if:** Any row returned → Table exceeds 100 MB threshold

---

### Alert 2: Dead Rows Accumulation

```sql
SELECT
  tablename,
  n_live_tup AS live_rows,
  n_dead_tup AS dead_rows,
  ROUND(100.0 * n_dead_tup / NULLIF(n_live_tup + n_dead_tup, 0), 2) AS dead_pct
FROM pg_stat_user_tables
WHERE schemaname = 'public'
AND n_dead_tup > 10000
AND (100.0 * n_dead_tup / NULLIF(n_live_tup + n_dead_tup, 0)) > 20
ORDER BY dead_pct DESC;
```

**Alert if:** Any row returned → Run `VACUUM ANALYZE` on affected tables

---

### Alert 3: Unread Notification Backlog

```sql
SELECT
  user_id,
  COUNT(*) AS unread_count,
  MAX(created_at) AS latest_notification
FROM crew_notifications
WHERE read_at IS NULL
GROUP BY user_id
HAVING COUNT(*) > 100
ORDER BY unread_count DESC;
```

**Alert if:** Any user has >100 unread → Notification spam or user inactive

---

### Alert 4: Slow Critical Queries

```sql
SELECT
  LEFT(query, 100) AS query_snippet,
  calls,
  ROUND(mean_exec_time::numeric, 2) AS avg_time_ms,
  ROUND(max_exec_time::numeric, 2) AS max_time_ms
FROM pg_stat_statements
WHERE query LIKE '%crew_notifications%'
  AND query LIKE '%read_at IS NULL%'
  AND mean_exec_time > 50 -- >50ms average
ORDER BY mean_exec_time DESC;
```

**Alert if:** Notification query >50ms → Critical performance degradation

---

## ⚡ Optimization Recommendations

### Optimization 1: Archive Old Data

```sql
-- Check archiving effectiveness
SELECT
  'crew_activity_feed' AS table_name,
  COUNT(*) AS active_rows,
  (SELECT COUNT(*) FROM crew_activity_archive) AS archived_rows,
  MIN(created_at) AS oldest_active
FROM crew_activity_feed
UNION ALL
SELECT
  'crew_notifications',
  COUNT(*),
  (SELECT COUNT(*) FROM crew_notifications_archive),
  MIN(created_at)
FROM crew_notifications
WHERE archived_at IS NULL;
```

**If oldest_active >90 days for activities or >30 days for notifications:**

```sql
-- Run archiving manually
SELECT archive_old_activities();
SELECT archive_old_notifications();
```

---

### Optimization 2: Refresh Materialized Views

```sql
-- Check materialized view staleness
SELECT
  matviewname,
  pg_size_pretty(pg_total_relation_size('public.'||matviewname)) AS size,
  (SELECT MAX(last_vouch_received) FROM user_vouch_scores) AS last_update,
  NOW() - (SELECT MAX(last_vouch_received) FROM user_vouch_scores) AS staleness
FROM pg_matviews
WHERE schemaname = 'public';
```

**If staleness >7 days:**

```sql
-- Refresh views
REFRESH MATERIALIZED VIEW CONCURRENTLY user_vouch_scores;
```

---

### Optimization 3: Vacuum & Analyze

```sql
-- Vacuum all Phase 3/4 tables
VACUUM ANALYZE crew_activity_feed;
VACUUM ANALYZE crew_notifications;
VACUUM ANALYZE crew_polls;
VACUUM ANALYZE poll_responses;
VACUUM ANALYZE party_live_pulse;
VACUUM ANALYZE memory_reactions;
```

---

### Optimization 4: Reindex (If Bloated)

```sql
-- Check index bloat
SELECT
  schemaname,
  tablename,
  indexname,
  pg_size_pretty(pg_relation_size(indexrelid)) AS index_size,
  idx_scan,
  ROUND(100.0 * idx_scan / NULLIF(seq_scan + idx_scan, 0), 2) AS index_usage_pct
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
AND idx_scan > 0
ORDER BY pg_relation_size(indexrelid) DESC;
```

**If index_usage_pct <50% on large index:**

```sql
-- Reindex specific index
REINDEX INDEX CONCURRENTLY idx_notifications_unread;
```

---

## 📈 Weekly Performance Report

Run this comprehensive query every Monday:

```sql
SELECT
  'Database Size' AS metric_category,
  'Total DB Size' AS metric_name,
  pg_size_pretty(pg_database_size(current_database())) AS value
UNION ALL
SELECT
  'Database Size',
  'Phase 3 Tables',
  pg_size_pretty(SUM(pg_total_relation_size('public.'||tablename)))
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('crew_activity_feed', 'crew_polls', 'poll_responses', 'crew_notifications', 'crew_vouches_v2', 'crew_discovery_scores')
UNION ALL
SELECT
  'Row Counts',
  'Activities',
  COUNT(*)::TEXT
FROM crew_activity_feed
UNION ALL
SELECT
  'Row Counts',
  'Notifications',
  COUNT(*)::TEXT
FROM crew_notifications
UNION ALL
SELECT
  'Row Counts',
  'Polls',
  COUNT(*)::TEXT
FROM crew_polls
UNION ALL
SELECT
  'Performance',
  'Avg Query Time (ms)',
  ROUND(AVG(mean_exec_time)::numeric, 2)::TEXT
FROM pg_stat_statements
WHERE query LIKE '%crew_%'
UNION ALL
SELECT
  'Connections',
  'Active Connections',
  COUNT(*)::TEXT
FROM pg_stat_activity
WHERE state = 'active'
ORDER BY metric_category, metric_name;
```

---

## 🎯 Performance Targets

| Metric | Target | Alert Threshold |
|--------|--------|----------------|
| Notification query time | <20ms | >50ms |
| Activity feed query time | <50ms | >100ms |
| Poll results query time | <100ms | >200ms |
| Database size | <1 GB | >2 GB |
| Unread notifications per user | <50 | >100 |
| Dead row percentage | <10% | >20% |
| Index hit ratio | >99% | <95% |
| Connection count | <150 | >180 (Pro limit: 200) |

---

## 🔧 Automated Monitoring Setup

### Setup pg_stat_statements

```sql
-- Enable extension (run as superuser or in Supabase Dashboard)
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- Verify enabled
SELECT * FROM pg_extension WHERE extname = 'pg_stat_statements';
```

### Setup pg_cron for Automated Reports

```sql
-- Schedule weekly performance report (Sundays at 2 AM)
SELECT cron.schedule(
  'weekly-performance-report',
  '0 2 * * 0',
  $$
  -- Insert results into performance_logs table
  INSERT INTO performance_logs (report_date, metrics)
  SELECT NOW(), jsonb_agg(row_to_json(t))
  FROM (
    -- Your weekly report query here
  ) t;
  $$
);
```

---

**Monitoring prepared by:** Claude Code (Terminal B)
**Date:** 2025-11-22
**Update Frequency:** Review weekly, update as needed
