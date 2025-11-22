-- ============================================
-- PHASE 3: Indexes for Performance
-- ============================================

-- crew_activity_feed indexes
CREATE INDEX IF NOT EXISTS idx_crew_activity_crew_time ON crew_activity_feed(crew_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_crew_activity_actor ON crew_activity_feed(actor_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_crew_activity_type ON crew_activity_feed(crew_id, activity_type, created_at DESC);

-- quick_plans indexes
CREATE INDEX IF NOT EXISTS idx_quick_plans_crew ON quick_plans(crew_id, deadline);
CREATE INDEX IF NOT EXISTS idx_quick_plans_creator ON quick_plans(creator_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_quick_plans_status ON quick_plans(crew_id, status);

-- crew_notifications indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user ON crew_notifications(user_id, read_at);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON crew_notifications(user_id, created_at DESC) WHERE read_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_notifications_crew ON crew_notifications(crew_id, created_at DESC);

-- crew_vouches_v2 indexes
CREATE INDEX IF NOT EXISTS idx_vouches_vouched ON crew_vouches_v2(vouched_user_id, strength DESC);
CREATE INDEX IF NOT EXISTS idx_vouches_crew ON crew_vouches_v2(crew_id, strength DESC);

-- crew_discovery_scores indexes
CREATE INDEX IF NOT EXISTS idx_discovery_user ON crew_discovery_scores(user_id, affinity_score DESC);
CREATE INDEX IF NOT EXISTS idx_discovery_crew ON crew_discovery_scores(crew_id, affinity_score DESC);

-- ============================================
-- PHASE 3: Functions for Automation
-- ============================================

-- FUNCTION 1: Create activity when user joins crew
CREATE OR REPLACE FUNCTION log_crew_member_joined()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO crew_activity_feed (crew_id, actor_id, activity_type, metadata)
  VALUES (NEW.crew_id, NEW.user_id, 'member_joined', json_build_object('user_id', NEW.user_id));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists, then create
DROP TRIGGER IF EXISTS trigger_member_joined ON crew_members;
CREATE TRIGGER trigger_member_joined
  AFTER INSERT ON crew_members
  FOR EACH ROW
  EXECUTE FUNCTION log_crew_member_joined();

-- FUNCTION 2: Create notifications on activity
CREATE OR REPLACE FUNCTION notify_on_activity()
RETURNS TRIGGER AS $$
BEGIN
  -- Notify all crew members when someone is mentioned
  IF NEW.activity_type = 'member_mentioned' THEN
    INSERT INTO crew_notifications (user_id, crew_id, notification_type, metadata)
    SELECT DISTINCT cm.user_id, NEW.crew_id, 'mentioned', 
           json_build_object('actor_id', NEW.actor_id, 'activity_id', NEW.id)
    FROM crew_members cm
    WHERE cm.crew_id = NEW.crew_id
      AND cm.user_id != NEW.actor_id
      AND cm.is_active = true;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists, then create
DROP TRIGGER IF EXISTS trigger_notify_on_activity ON crew_activity_feed;
CREATE TRIGGER trigger_notify_on_activity
  AFTER INSERT ON crew_activity_feed
  FOR EACH ROW
  EXECUTE FUNCTION notify_on_activity();

-- FUNCTION 3: Mark poll as closed after deadline
CREATE OR REPLACE FUNCTION close_expired_polls()
RETURNS void AS $$
BEGIN
  UPDATE quick_plans
  SET status = 'results', updated_at = NOW()
  WHERE status = 'open' AND deadline < NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- FUNCTION 4: Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at trigger to quick_plans
DROP TRIGGER IF EXISTS trigger_update_quick_plans_updated_at ON quick_plans;
CREATE TRIGGER trigger_update_quick_plans_updated_at
  BEFORE UPDATE ON quick_plans
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Schedule this to run every 5 minutes via pg_cron (requires extension)
-- SELECT cron.schedule('close-expired-polls', '*/5 * * * *', 'SELECT close_expired_polls()');

