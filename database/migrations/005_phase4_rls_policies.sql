-- ============================================
-- PHASE 4: Row Level Security Policies
-- ============================================

-- Drop existing policies if they exist (for idempotency)
DROP POLICY IF EXISTS "Anyone can view live pulse" ON party_live_pulse;
DROP POLICY IF EXISTS "Attendees can record pulse" ON party_live_pulse;

DROP POLICY IF EXISTS "Anyone can view public memories" ON party_memories;
DROP POLICY IF EXISTS "Attendees can create memories" ON party_memories;
DROP POLICY IF EXISTS "Creators can update their memories" ON party_memories;

DROP POLICY IF EXISTS "Anyone can view collaborators" ON memory_collaborators;
DROP POLICY IF EXISTS "Memory creators can manage collaborators" ON memory_collaborators;

DROP POLICY IF EXISTS "Public reels are visible to all" ON highlight_reels;
DROP POLICY IF EXISTS "Creators can manage their reels" ON highlight_reels;

DROP POLICY IF EXISTS "Anyone can create safety reports" ON party_safety_reports;
DROP POLICY IF EXISTS "Only admins can view safety reports" ON party_safety_reports;
DROP POLICY IF EXISTS "Only admins can update safety reports" ON party_safety_reports;

-- party_live_pulse RLS
CREATE POLICY "Anyone can view live pulse"
  ON party_live_pulse
  FOR SELECT
  USING (true);

CREATE POLICY "Attendees can record pulse"
  ON party_live_pulse
  FOR INSERT
  WITH CHECK (
    recorded_by = auth.uid() AND
    EXISTS (
      SELECT 1 FROM party_attendees
      WHERE party_id = party_live_pulse.party_id
        AND user_id = auth.uid()
        AND status IN ('confirmed', 'checked_in')
    )
  );

-- party_memories RLS
CREATE POLICY "Anyone can view public memories"
  ON party_memories
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM parties
      WHERE id = party_memories.party_id
        AND (is_private = false OR EXISTS (
          SELECT 1 FROM party_attendees
          WHERE party_id = party_memories.party_id
            AND user_id = auth.uid()
        ))
    )
  );

CREATE POLICY "Attendees can create memories"
  ON party_memories
  FOR INSERT
  WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM party_attendees
      WHERE party_id = party_memories.party_id
        AND user_id = auth.uid()
        AND status IN ('confirmed', 'checked_in')
    )
  );

CREATE POLICY "Creators can update their memories"
  ON party_memories
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Creators can delete their memories"
  ON party_memories
  FOR DELETE
  USING (user_id = auth.uid());

-- memory_collaborators RLS
CREATE POLICY "Anyone can view collaborators"
  ON memory_collaborators
  FOR SELECT
  USING (true);

CREATE POLICY "Memory creators can manage collaborators"
  ON memory_collaborators
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM party_memories
      WHERE id = memory_collaborators.memory_id
        AND user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM party_memories
      WHERE id = memory_collaborators.memory_id
        AND user_id = auth.uid()
    )
  );

-- highlight_reels RLS
CREATE POLICY "Public reels are visible to all"
  ON highlight_reels
  FOR SELECT
  USING (
    is_public = true OR
    EXISTS (
      SELECT 1 FROM party_attendees
      WHERE party_id = highlight_reels.party_id
        AND user_id = auth.uid()
    )
  );

CREATE POLICY "Creators can manage their reels"
  ON highlight_reels
  FOR ALL
  USING (creator_id = auth.uid())
  WITH CHECK (creator_id = auth.uid());

-- party_safety_reports RLS
CREATE POLICY "Anyone can create safety reports"
  ON party_safety_reports
  FOR INSERT
  WITH CHECK (
    reporter_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM party_attendees
      WHERE party_id = party_safety_reports.party_id
        AND user_id = auth.uid()
    )
  );

CREATE POLICY "Only admins can view safety reports"
  ON party_safety_reports
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid() AND raw_user_meta_data->>'role' = 'admin'
    )
  );

CREATE POLICY "Only admins can update safety reports"
  ON party_safety_reports
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid() AND raw_user_meta_data->>'role' = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid() AND raw_user_meta_data->>'role' = 'admin'
    )
  );

