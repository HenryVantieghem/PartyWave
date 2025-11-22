-- ============================================
-- THE HANGOUT - PHASE 3 DATABASE MIGRATION
-- ============================================
-- Created: 2025-11-22
-- Purpose: Real-time crew features, notifications, polling, enhanced vouching
-- Dependencies: Requires Phase 1 (crews) and Phase 2 (parties) migrations
-- Estimated execution time: 2-3 minutes
-- ============================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABLE 1: crew_activity_feed (Enhanced Activity Tracking)
-- ============================================

CREATE TABLE IF NOT EXISTS crew_activity_feed (
  -- Primary Keys
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Foreign Keys
  crew_id UUID NOT NULL REFERENCES party_crews(id) ON DELETE CASCADE,
  actor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Activity Data
  activity_type TEXT NOT NULL CHECK (activity_type IN (
    'member_joined', 'member_left', 'member_promoted',
    'party_created', 'party_completed', 'poll_created',
    'vouch_given', 'achievement_unlocked', 'milestone_reached',
    'content_shared', 'custom'
  )),

  -- Flexible metadata for each activity type
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Visibility & Display
  visibility TEXT NOT NULL CHECK (visibility IN ('public', 'crew_only', 'admins_only'))
    DEFAULT 'crew_only',
  priority INTEGER DEFAULT 0 CHECK (priority >= 0 AND priority <= 100),

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,

  -- Engagement Tracking
  view_count INTEGER DEFAULT 0,
  reaction_count INTEGER DEFAULT 0
);

-- Indexes for crew_activity_feed
CREATE INDEX idx_crew_activity_crew_time
  ON crew_activity_feed(crew_id, created_at DESC)
  WHERE expires_at IS NULL OR expires_at > NOW();

CREATE INDEX idx_crew_activity_actor_time
  ON crew_activity_feed(actor_id, created_at DESC);

CREATE INDEX idx_crew_activity_type_filter
  ON crew_activity_feed(crew_id, activity_type, created_at DESC);

CREATE INDEX idx_crew_activity_public
  ON crew_activity_feed(visibility, created_at DESC)
  WHERE visibility = 'public';

CREATE INDEX idx_crew_activity_metadata
  ON crew_activity_feed USING GIN (metadata);

CREATE INDEX idx_crew_activity_expires
  ON crew_activity_feed(expires_at)
  WHERE expires_at IS NOT NULL;

-- ============================================
-- TABLE 2: crew_polls (Flexible Polling System)
-- ============================================

CREATE TABLE IF NOT EXISTS crew_polls (
  -- Primary Keys
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Foreign Keys
  crew_id UUID NOT NULL REFERENCES party_crews(id) ON DELETE CASCADE,
  creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Poll Content
  question TEXT NOT NULL CHECK (char_length(question) >= 3 AND char_length(question) <= 200),
  description TEXT CHECK (description IS NULL OR char_length(description) <= 500),

  -- Options structure: [{"id": "opt1", "text": "Option 1", "emoji": "🎉"}, ...]
  options JSONB NOT NULL CHECK (jsonb_array_length(options) >= 2 AND jsonb_array_length(options) <= 10),

  -- Poll Settings
  allow_multiple_choice BOOLEAN DEFAULT false,
  allow_add_options BOOLEAN DEFAULT false,
  show_results_before_vote BOOLEAN DEFAULT false,
  anonymous_votes BOOLEAN DEFAULT false,

  -- Status & Timing
  status TEXT NOT NULL CHECK (status IN ('draft', 'open', 'closed', 'archived')) DEFAULT 'open',
  deadline TIMESTAMP WITH TIME ZONE,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  closed_at TIMESTAMP WITH TIME ZONE,

  -- Quick Stats (denormalized for performance)
  total_responses INTEGER DEFAULT 0,
  unique_voters INTEGER DEFAULT 0
);

-- Indexes for crew_polls
CREATE INDEX idx_crew_polls_active
  ON crew_polls(crew_id, status, deadline DESC)
  WHERE status = 'open';

CREATE INDEX idx_crew_polls_creator
  ON crew_polls(creator_id, created_at DESC);

CREATE INDEX idx_crew_polls_status
  ON crew_polls(status, deadline);

CREATE INDEX idx_crew_polls_options
  ON crew_polls USING GIN (options);

-- ============================================
-- TABLE 3: poll_responses (Individual Poll Votes)
-- ============================================

CREATE TABLE IF NOT EXISTS poll_responses (
  -- Primary Keys
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Foreign Keys
  poll_id UUID NOT NULL REFERENCES crew_polls(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Response Data
  selected_option_ids TEXT[] NOT NULL,

  -- Metadata
  responded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Constraints
  UNIQUE(poll_id, user_id)
);

-- Indexes for poll_responses
CREATE INDEX idx_poll_responses_poll
  ON poll_responses(poll_id);

CREATE INDEX idx_poll_responses_user
  ON poll_responses(user_id, responded_at DESC);

CREATE INDEX idx_poll_responses_options
  ON poll_responses USING GIN (selected_option_ids);

-- ============================================
-- TABLE 4: crew_notifications (Smart Notifications)
-- ============================================

CREATE TABLE IF NOT EXISTS crew_notifications (
  -- Primary Keys
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Foreign Keys
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  crew_id UUID REFERENCES party_crews(id) ON DELETE CASCADE,

  -- Notification Type
  notification_type TEXT NOT NULL CHECK (notification_type IN (
    'crew_invite', 'member_joined', 'member_left',
    'poll_created', 'poll_closing_soon', 'poll_results',
    'party_invite', 'party_starting_soon', 'party_live',
    'vouch_received', 'mentioned', 'achievement',
    'safety_alert', 'system_announcement'
  )),

  -- Flexible metadata per notification type
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,

  -- Priority & Display
  priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'urgent'))
    DEFAULT 'medium',

  -- Action Link (deep link into app)
  action_type TEXT CHECK (action_type IN ('navigate', 'open_poll', 'join_party', 'view_profile')),
  action_data JSONB,

  -- Status
  read_at TIMESTAMP WITH TIME ZONE,
  dismissed_at TIMESTAMP WITH TIME ZONE,
  archived_at TIMESTAMP WITH TIME ZONE,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '30 days')
);

-- Indexes for crew_notifications (CRITICAL for performance)
CREATE INDEX idx_notifications_unread
  ON crew_notifications(user_id, created_at DESC)
  WHERE read_at IS NULL AND archived_at IS NULL;

CREATE INDEX idx_notifications_user_recent
  ON crew_notifications(user_id, created_at DESC)
  WHERE archived_at IS NULL;

CREATE INDEX idx_notifications_user_type
  ON crew_notifications(user_id, notification_type, created_at DESC)
  WHERE archived_at IS NULL;

CREATE INDEX idx_notifications_user_priority
  ON crew_notifications(user_id, priority, created_at DESC)
  WHERE priority IN ('high', 'urgent') AND read_at IS NULL;

CREATE INDEX idx_notifications_expires
  ON crew_notifications(expires_at)
  WHERE archived_at IS NULL;

CREATE INDEX idx_notifications_metadata
  ON crew_notifications USING GIN (metadata);

-- ============================================
-- TABLE 5: crew_vouches_v2 (Enhanced Trust Network)
-- ============================================

CREATE TABLE IF NOT EXISTS crew_vouches_v2 (
  -- Primary Keys
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Foreign Keys
  voucher_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vouched_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  crew_id UUID REFERENCES party_crews(id) ON DELETE CASCADE,

  -- Vouch Details
  strength INTEGER NOT NULL CHECK (strength >= 1 AND strength <= 5) DEFAULT 3,
  reason TEXT CHECK (reason IS NULL OR char_length(reason) <= 200),

  -- Categories (what are they good at?)
  tags TEXT[] DEFAULT '{}',

  -- Visibility
  is_public BOOLEAN DEFAULT true,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Constraints
  UNIQUE(voucher_id, vouched_user_id),
  CHECK (voucher_id != vouched_user_id)
);

-- Indexes for crew_vouches_v2
CREATE INDEX idx_vouches_vouched_user
  ON crew_vouches_v2(vouched_user_id, strength DESC, created_at DESC)
  WHERE is_public = true;

CREATE INDEX idx_vouches_voucher
  ON crew_vouches_v2(voucher_id, created_at DESC);

CREATE INDEX idx_vouches_crew
  ON crew_vouches_v2(crew_id, strength DESC)
  WHERE crew_id IS NOT NULL;

CREATE INDEX idx_vouches_tags
  ON crew_vouches_v2 USING GIN (tags);

-- ============================================
-- MATERIALIZED VIEW: user_vouch_scores
-- ============================================

CREATE MATERIALIZED VIEW user_vouch_scores AS
SELECT
  vouched_user_id,
  COUNT(*) as total_vouches,
  AVG(strength)::NUMERIC(3,2) as average_strength,
  SUM(CASE WHEN strength >= 4 THEN 1 ELSE 0 END) as strong_vouches,
  ARRAY_AGG(DISTINCT unnest(tags)) FILTER (WHERE tags IS NOT NULL AND array_length(tags, 1) > 0) as all_tags,
  MAX(created_at) as last_vouch_received
FROM crew_vouches_v2
WHERE is_public = true
GROUP BY vouched_user_id;

-- Indexes on materialized view
CREATE UNIQUE INDEX idx_vouch_scores_user ON user_vouch_scores(vouched_user_id);
CREATE INDEX idx_vouch_scores_total ON user_vouch_scores(total_vouches DESC);
CREATE INDEX idx_vouch_scores_strength ON user_vouch_scores(average_strength DESC);

-- ============================================
-- TABLE 6: crew_discovery_scores (Algorithm Training Data)
-- ============================================

CREATE TABLE IF NOT EXISTS crew_discovery_scores (
  -- Primary Keys
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Foreign Keys
  crew_id UUID NOT NULL REFERENCES party_crews(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Score Data
  affinity_score NUMERIC(5,2) NOT NULL CHECK (affinity_score >= 0 AND affinity_score <= 100),

  -- Factor Breakdown
  factors JSONB NOT NULL DEFAULT '{}'::jsonb,

  -- Algorithm Versioning
  algorithm_version TEXT NOT NULL DEFAULT 'v1',

  -- Ranking
  rank_for_user INTEGER,
  rank_for_crew INTEGER,

  -- Metadata
  calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days'),

  -- Constraints
  UNIQUE(crew_id, user_id, algorithm_version, calculated_at)
);

-- Indexes for crew_discovery_scores
CREATE INDEX idx_discovery_user_score
  ON crew_discovery_scores(user_id, affinity_score DESC, calculated_at DESC)
  WHERE expires_at > NOW();

CREATE INDEX idx_discovery_crew_score
  ON crew_discovery_scores(crew_id, affinity_score DESC, calculated_at DESC)
  WHERE expires_at > NOW();

CREATE INDEX idx_discovery_calculated
  ON crew_discovery_scores(calculated_at DESC);

CREATE INDEX idx_discovery_expires
  ON crew_discovery_scores(expires_at)
  WHERE expires_at IS NOT NULL;

CREATE INDEX idx_discovery_factors
  ON crew_discovery_scores USING GIN (factors);

CREATE INDEX idx_discovery_version
  ON crew_discovery_scores(algorithm_version, calculated_at DESC);

-- ============================================
-- ARCHIVE TABLES
-- ============================================

CREATE TABLE IF NOT EXISTS crew_activity_archive (
  LIKE crew_activity_feed INCLUDING ALL
);

CREATE TABLE IF NOT EXISTS crew_notifications_archive (
  LIKE crew_notifications INCLUDING ALL
);

-- ============================================
-- ROW LEVEL SECURITY: crew_activity_feed
-- ============================================

ALTER TABLE crew_activity_feed ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public activities are viewable by everyone" ON crew_activity_feed;
CREATE POLICY "Public activities are viewable by everyone"
  ON crew_activity_feed FOR SELECT
  USING (visibility = 'public');

DROP POLICY IF EXISTS "Crew members can view crew activities" ON crew_activity_feed;
CREATE POLICY "Crew members can view crew activities"
  ON crew_activity_feed FOR SELECT
  USING (
    visibility IN ('crew_only', 'public')
    AND auth.uid() IN (
      SELECT user_id FROM crew_members
      WHERE crew_id = crew_activity_feed.crew_id
        AND is_active = true
    )
  );

DROP POLICY IF EXISTS "Admins can view admin activities" ON crew_activity_feed;
CREATE POLICY "Admins can view admin activities"
  ON crew_activity_feed FOR SELECT
  USING (
    visibility = 'admins_only'
    AND auth.uid() IN (
      SELECT user_id FROM crew_members
      WHERE crew_id = crew_activity_feed.crew_id
        AND role IN ('owner', 'admin')
        AND is_active = true
    )
  );

DROP POLICY IF EXISTS "Crew members can create activities" ON crew_activity_feed;
CREATE POLICY "Crew members can create activities"
  ON crew_activity_feed FOR INSERT
  WITH CHECK (
    auth.uid() = actor_id
    AND auth.uid() IN (
      SELECT user_id FROM crew_members
      WHERE crew_id = crew_activity_feed.crew_id
        AND is_active = true
    )
  );

DROP POLICY IF EXISTS "Users can delete own activities" ON crew_activity_feed;
CREATE POLICY "Users can delete own activities"
  ON crew_activity_feed FOR DELETE
  USING (auth.uid() = actor_id);

-- ============================================
-- ROW LEVEL SECURITY: crew_polls
-- ============================================

ALTER TABLE crew_polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE poll_responses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Crew members can view polls" ON crew_polls;
CREATE POLICY "Crew members can view polls"
  ON crew_polls FOR SELECT
  USING (
    auth.uid() IN (
      SELECT user_id FROM crew_members
      WHERE crew_id = crew_polls.crew_id
        AND is_active = true
    )
  );

DROP POLICY IF EXISTS "Crew members can create polls" ON crew_polls;
CREATE POLICY "Crew members can create polls"
  ON crew_polls FOR INSERT
  WITH CHECK (
    auth.uid() = creator_id
    AND auth.uid() IN (
      SELECT user_id FROM crew_members
      WHERE crew_id = crew_polls.crew_id
        AND is_active = true
    )
  );

DROP POLICY IF EXISTS "Creators can update own polls" ON crew_polls;
CREATE POLICY "Creators can update own polls"
  ON crew_polls FOR UPDATE
  USING (auth.uid() = creator_id);

DROP POLICY IF EXISTS "Crew members can view poll responses" ON poll_responses;
CREATE POLICY "Crew members can view poll responses"
  ON poll_responses FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM crew_polls cp
      JOIN crew_members cm ON cm.crew_id = cp.crew_id
      WHERE cp.id = poll_responses.poll_id
        AND cm.user_id = auth.uid()
        AND cm.is_active = true
    )
  );

DROP POLICY IF EXISTS "Users can submit poll responses" ON poll_responses;
CREATE POLICY "Users can submit poll responses"
  ON poll_responses FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM crew_polls cp
      JOIN crew_members cm ON cm.crew_id = cp.crew_id
      WHERE cp.id = poll_responses.poll_id
        AND cm.user_id = auth.uid()
        AND cm.is_active = true
        AND cp.status = 'open'
    )
  );

DROP POLICY IF EXISTS "Users can update own responses" ON poll_responses;
CREATE POLICY "Users can update own responses"
  ON poll_responses FOR UPDATE
  USING (auth.uid() = user_id);

-- ============================================
-- ROW LEVEL SECURITY: crew_notifications
-- ============================================

ALTER TABLE crew_notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own notifications" ON crew_notifications;
CREATE POLICY "Users can view own notifications"
  ON crew_notifications FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own notifications" ON crew_notifications;
CREATE POLICY "Users can update own notifications"
  ON crew_notifications FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own notifications" ON crew_notifications;
CREATE POLICY "Users can delete own notifications"
  ON crew_notifications FOR DELETE
  USING (auth.uid() = user_id AND read_at IS NOT NULL);

-- ============================================
-- ROW LEVEL SECURITY: crew_vouches_v2
-- ============================================

ALTER TABLE crew_vouches_v2 ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public vouches are viewable by everyone" ON crew_vouches_v2;
CREATE POLICY "Public vouches are viewable by everyone"
  ON crew_vouches_v2 FOR SELECT
  USING (is_public = true);

DROP POLICY IF EXISTS "Users can view vouches involving them" ON crew_vouches_v2;
CREATE POLICY "Users can view vouches involving them"
  ON crew_vouches_v2 FOR SELECT
  USING (
    auth.uid() = voucher_id
    OR auth.uid() = vouched_user_id
  );

DROP POLICY IF EXISTS "Users can create own vouches" ON crew_vouches_v2;
CREATE POLICY "Users can create own vouches"
  ON crew_vouches_v2 FOR INSERT
  WITH CHECK (
    auth.uid() = voucher_id
    AND voucher_id != vouched_user_id
  );

DROP POLICY IF EXISTS "Users can update own vouches" ON crew_vouches_v2;
CREATE POLICY "Users can update own vouches"
  ON crew_vouches_v2 FOR UPDATE
  USING (auth.uid() = voucher_id);

DROP POLICY IF EXISTS "Users can delete own vouches" ON crew_vouches_v2;
CREATE POLICY "Users can delete own vouches"
  ON crew_vouches_v2 FOR DELETE
  USING (auth.uid() = voucher_id);

-- ============================================
-- ROW LEVEL SECURITY: crew_discovery_scores
-- ============================================

ALTER TABLE crew_discovery_scores ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own recommendations" ON crew_discovery_scores;
CREATE POLICY "Users can view own recommendations"
  ON crew_discovery_scores FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Crew admins can view prospects" ON crew_discovery_scores;
CREATE POLICY "Crew admins can view prospects"
  ON crew_discovery_scores FOR SELECT
  USING (
    auth.uid() IN (
      SELECT user_id FROM crew_members
      WHERE crew_id = crew_discovery_scores.crew_id
        AND role IN ('owner', 'admin')
        AND is_active = true
    )
  );

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Function: Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Update crew_polls updated_at
DROP TRIGGER IF EXISTS trigger_crew_polls_updated_at ON crew_polls;
CREATE TRIGGER trigger_crew_polls_updated_at
  BEFORE UPDATE ON crew_polls
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger: Update poll_responses updated_at
DROP TRIGGER IF EXISTS trigger_poll_responses_updated_at ON poll_responses;
CREATE TRIGGER trigger_poll_responses_updated_at
  BEFORE UPDATE ON poll_responses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger: Update crew_vouches_v2 updated_at
DROP TRIGGER IF EXISTS trigger_crew_vouches_updated_at ON crew_vouches_v2;
CREATE TRIGGER trigger_crew_vouches_updated_at
  BEFORE UPDATE ON crew_vouches_v2
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function: Auto-create activity when crew member joins
CREATE OR REPLACE FUNCTION create_member_joined_activity()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.invitation_status = 'accepted' AND NEW.is_active = true
     AND (OLD IS NULL OR OLD.invitation_status != 'accepted' OR OLD.is_active = false) THEN
    INSERT INTO crew_activity_feed (crew_id, actor_id, activity_type, metadata, visibility)
    VALUES (
      NEW.crew_id,
      NEW.user_id,
      'member_joined',
      jsonb_build_object(
        'user_id', NEW.user_id,
        'invited_by', NEW.invited_by,
        'joined_at', NEW.joined_at
      ),
      'crew_only'
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_member_joined_activity ON crew_members;
CREATE TRIGGER trigger_member_joined_activity
  AFTER INSERT OR UPDATE ON crew_members
  FOR EACH ROW EXECUTE FUNCTION create_member_joined_activity();

-- Function: Auto-create notifications on activity
CREATE OR REPLACE FUNCTION create_activity_notifications()
RETURNS TRIGGER AS $$
DECLARE
  member_id UUID;
BEGIN
  IF NEW.activity_type IN ('poll_created', 'party_created', 'milestone_reached') THEN
    FOR member_id IN
      SELECT user_id FROM crew_members
      WHERE crew_id = NEW.crew_id
        AND user_id != NEW.actor_id
        AND is_active = true
        AND (notification_preferences->>'all')::boolean IS NOT FALSE
    LOOP
      INSERT INTO crew_notifications (
        user_id, crew_id, notification_type, metadata, priority
      )
      VALUES (
        member_id,
        NEW.crew_id,
        CASE NEW.activity_type
          WHEN 'poll_created' THEN 'poll_created'
          WHEN 'party_created' THEN 'party_invite'
          ELSE 'system_announcement'
        END,
        jsonb_build_object(
          'activity_id', NEW.id,
          'actor_id', NEW.actor_id,
          'activity_type', NEW.activity_type,
          'metadata', NEW.metadata
        ),
        'medium'
      );
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_activity_notifications ON crew_activity_feed;
CREATE TRIGGER trigger_activity_notifications
  AFTER INSERT ON crew_activity_feed
  FOR EACH ROW EXECUTE FUNCTION create_activity_notifications();

-- Function: Update poll response counts
CREATE OR REPLACE FUNCTION update_poll_response_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE crew_polls
    SET
      total_responses = total_responses + array_length(NEW.selected_option_ids, 1),
      unique_voters = unique_voters + 1
    WHERE id = NEW.poll_id;
  ELSIF TG_OP = 'UPDATE' THEN
    UPDATE crew_polls
    SET total_responses = (
      SELECT SUM(array_length(selected_option_ids, 1))
      FROM poll_responses
      WHERE poll_id = NEW.poll_id
    )
    WHERE id = NEW.poll_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE crew_polls
    SET
      total_responses = GREATEST(0, total_responses - array_length(OLD.selected_option_ids, 1)),
      unique_voters = GREATEST(0, unique_voters - 1)
    WHERE id = OLD.poll_id;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_poll_counts ON poll_responses;
CREATE TRIGGER trigger_update_poll_counts
  AFTER INSERT OR UPDATE OR DELETE ON poll_responses
  FOR EACH ROW EXECUTE FUNCTION update_poll_response_counts();

-- Function: Archive old activities
CREATE OR REPLACE FUNCTION archive_old_activities()
RETURNS void AS $$
DECLARE
  archived_count INTEGER;
BEGIN
  INSERT INTO crew_activity_archive
  SELECT * FROM crew_activity_feed
  WHERE created_at < NOW() - INTERVAL '90 days';

  GET DIAGNOSTICS archived_count = ROW_COUNT;

  DELETE FROM crew_activity_feed
  WHERE created_at < NOW() - INTERVAL '90 days';

  RAISE NOTICE 'Archived % activities', archived_count;
END;
$$ LANGUAGE plpgsql;

-- Function: Archive old notifications
CREATE OR REPLACE FUNCTION archive_old_notifications()
RETURNS void AS $$
DECLARE
  archived_count INTEGER;
BEGIN
  INSERT INTO crew_notifications_archive
  SELECT * FROM crew_notifications
  WHERE (
    (read_at IS NOT NULL AND read_at < NOW() - INTERVAL '7 days')
    OR (read_at IS NULL AND created_at < NOW() - INTERVAL '30 days')
  )
  AND archived_at IS NULL;

  GET DIAGNOSTICS archived_count = ROW_COUNT;

  UPDATE crew_notifications
  SET archived_at = NOW()
  WHERE (
    (read_at IS NOT NULL AND read_at < NOW() - INTERVAL '7 days')
    OR (read_at IS NULL AND created_at < NOW() - INTERVAL '30 days')
  )
  AND archived_at IS NULL;

  RAISE NOTICE 'Archived % notifications', archived_count;
END;
$$ LANGUAGE plpgsql;

-- Function: Nightly maintenance
CREATE OR REPLACE FUNCTION run_nightly_maintenance()
RETURNS void AS $$
BEGIN
  -- Archive old data
  PERFORM archive_old_activities();
  PERFORM archive_old_notifications();

  -- Refresh materialized views
  REFRESH MATERIALIZED VIEW CONCURRENTLY user_vouch_scores;

  -- Vacuum analyze
  VACUUM ANALYZE crew_activity_feed;
  VACUUM ANALYZE crew_notifications;
  VACUUM ANALYZE crew_polls;
  VACUUM ANALYZE poll_responses;

  RAISE NOTICE 'Nightly maintenance completed at %', NOW();
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- REALTIME SUBSCRIPTIONS
-- ============================================

ALTER PUBLICATION supabase_realtime ADD TABLE crew_activity_feed;
ALTER PUBLICATION supabase_realtime ADD TABLE crew_polls;
ALTER PUBLICATION supabase_realtime ADD TABLE poll_responses;
ALTER PUBLICATION supabase_realtime ADD TABLE crew_notifications;

-- ============================================
-- MIGRATION COMPLETE
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '================================================';
  RAISE NOTICE 'Phase 3 Migration Completed Successfully!';
  RAISE NOTICE '================================================';
  RAISE NOTICE 'Tables created:';
  RAISE NOTICE '  - crew_activity_feed';
  RAISE NOTICE '  - crew_polls';
  RAISE NOTICE '  - poll_responses';
  RAISE NOTICE '  - crew_notifications';
  RAISE NOTICE '  - crew_vouches_v2';
  RAISE NOTICE '  - crew_discovery_scores';
  RAISE NOTICE '  - user_vouch_scores (materialized view)';
  RAISE NOTICE '================================================';
  RAISE NOTICE 'RLS policies: Enabled and configured';
  RAISE NOTICE 'Indexes: Created for performance';
  RAISE NOTICE 'Triggers: Configured for automation';
  RAISE NOTICE 'Realtime: Enabled on key tables';
  RAISE NOTICE '================================================';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '  1. Test RLS policies with test users';
  RAISE NOTICE '  2. Set up cron job for run_nightly_maintenance()';
  RAISE NOTICE '  3. Monitor table sizes and query performance';
  RAISE NOTICE '  4. Run Phase 4 migration when ready';
  RAISE NOTICE '================================================';
END $$;
