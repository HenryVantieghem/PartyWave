-- ============================================
-- PHASE 3: Row Level Security Policies
-- ============================================

-- Drop existing policies if they exist (for idempotency)
DROP POLICY IF EXISTS "Public activities visible to all" ON crew_activity_feed;
DROP POLICY IF EXISTS "Crew members see their crew's activities" ON crew_activity_feed;
DROP POLICY IF EXISTS "Users can create activities for themselves" ON crew_activity_feed;

DROP POLICY IF EXISTS "Crew members see quick plans for their crews" ON quick_plans;
DROP POLICY IF EXISTS "Crew members can create polls" ON quick_plans;

DROP POLICY IF EXISTS "Users see only their own notifications" ON crew_notifications;
DROP POLICY IF EXISTS "System creates notifications for users" ON crew_notifications;

DROP POLICY IF EXISTS "All vouches are publicly visible" ON crew_vouches_v2;
DROP POLICY IF EXISTS "Users can only vouch for others" ON crew_vouches_v2;

DROP POLICY IF EXISTS "Only admins can view discovery scores" ON crew_discovery_scores;

-- crew_activity_feed RLS
CREATE POLICY "Public activities visible to all"
  ON crew_activity_feed
  FOR SELECT
  USING (visibility = 'public');

CREATE POLICY "Crew members see their crew's activities"
  ON crew_activity_feed
  FOR SELECT
  USING (
    crew_id IN (
      SELECT crew_id FROM crew_members
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Users can create activities for themselves"
  ON crew_activity_feed
  FOR INSERT
  WITH CHECK (actor_id = auth.uid());

-- quick_plans RLS
CREATE POLICY "Crew members see quick plans for their crews"
  ON quick_plans
  FOR SELECT
  USING (
    crew_id IN (
      SELECT crew_id FROM crew_members
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Crew members can create polls"
  ON quick_plans
  FOR INSERT
  WITH CHECK (
    creator_id = auth.uid() AND
    crew_id IN (
      SELECT crew_id FROM crew_members
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Crew members can update polls they created"
  ON quick_plans
  FOR UPDATE
  USING (creator_id = auth.uid())
  WITH CHECK (creator_id = auth.uid());

-- crew_notifications RLS (Most restrictive - users see only their own)
CREATE POLICY "Users see only their own notifications"
  ON crew_notifications
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "System creates notifications for users"
  ON crew_notifications
  FOR INSERT
  WITH CHECK (true); -- System-only via triggers

CREATE POLICY "Users can update their own notifications"
  ON crew_notifications
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- crew_vouches_v2 RLS (Public reads, restricted writes)
CREATE POLICY "All vouches are publicly visible"
  ON crew_vouches_v2
  FOR SELECT
  USING (true);

CREATE POLICY "Users can only vouch for others"
  ON crew_vouches_v2
  FOR INSERT
  WITH CHECK (voucher_id = auth.uid() AND voucher_id != vouched_user_id);

CREATE POLICY "Users can update their own vouches"
  ON crew_vouches_v2
  FOR UPDATE
  USING (voucher_id = auth.uid())
  WITH CHECK (voucher_id = auth.uid());

-- crew_discovery_scores RLS (Admin only)
CREATE POLICY "Only admins can view discovery scores"
  ON crew_discovery_scores
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid() AND raw_user_meta_data->>'role' = 'admin'
    )
  );

