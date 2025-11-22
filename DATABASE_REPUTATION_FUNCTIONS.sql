-- ============================================
-- CREW REPUTATION SCORING SYSTEM
-- ============================================
-- Database functions for calculating crew reputation scores
-- ============================================

-- Function to calculate crew reputation score
-- Returns a score from 0-100 based on various factors
CREATE OR REPLACE FUNCTION calculate_crew_reputation(crew_id_param UUID)
RETURNS JSONB AS $$
DECLARE
  activity_score NUMERIC := 0;
  retention_score NUMERIC := 0;
  engagement_score NUMERIC := 0;
  vouch_score NUMERIC := 0;
  total_score NUMERIC := 0;
  crew_age_days NUMERIC;
  active_members_count INT;
  total_members_count INT;
  parties_created_count INT;
  parties_attended_count INT;
  total_activity_count INT;
  vouch_count INT;
BEGIN
  -- Get crew age in days
  SELECT EXTRACT(EPOCH FROM (NOW() - created_at)) / 86400
  INTO crew_age_days
  FROM party_crews
  WHERE id = crew_id_param;

  -- Prevent division by zero
  IF crew_age_days < 1 THEN
    crew_age_days := 1;
  END IF;

  -- Get member counts
  SELECT COUNT(*) FILTER (WHERE is_active = true)
  INTO active_members_count
  FROM crew_members
  WHERE crew_id = crew_id_param;

  SELECT COUNT(*)
  INTO total_members_count
  FROM crew_members
  WHERE crew_id = crew_id_param;

  -- Calculate retention score (0-25 points)
  IF total_members_count > 0 THEN
    retention_score := (active_members_count::NUMERIC / total_members_count::NUMERIC) * 25;
  END IF;

  -- Get activity counts
  SELECT COUNT(*) FILTER (WHERE activity_type = 'party_created')
  INTO parties_created_count
  FROM crew_activity
  WHERE crew_id = crew_id_param;

  SELECT COUNT(*) FILTER (WHERE activity_type = 'party_attended')
  INTO parties_attended_count
  FROM crew_activity
  WHERE crew_id = crew_id_param;

  SELECT COUNT(*)
  INTO total_activity_count
  FROM crew_activity
  WHERE crew_id = crew_id_param
    AND created_at >= NOW() - INTERVAL '30 days';

  -- Calculate activity score (0-35 points)
  -- Based on parties per week
  activity_score := LEAST(((parties_created_count + parties_attended_count) / crew_age_days * 7) * 5, 35);

  -- Calculate engagement score (0-25 points)
  -- Based on activity per member per week
  IF active_members_count > 0 THEN
    engagement_score := LEAST((total_activity_count::NUMERIC / active_members_count::NUMERIC / 4) * 25, 25);
  END IF;

  -- Get vouch count
  SELECT COUNT(*)
  INTO vouch_count
  FROM crew_vouches
  WHERE crew_id = crew_id_param;

  -- Calculate vouch score (0-15 points)
  vouch_score := LEAST(vouch_count * 3, 15);

  -- Calculate total score
  total_score := LEAST(activity_score + retention_score + engagement_score + vouch_score, 100);

  -- Return breakdown
  RETURN jsonb_build_object(
    'total', ROUND(total_score, 0),
    'activity', ROUND(activity_score, 0),
    'retention', ROUND(retention_score, 0),
    'engagement', ROUND(engagement_score, 0),
    'vouches', ROUND(vouch_score, 0),
    'metadata', jsonb_build_object(
      'crew_age_days', ROUND(crew_age_days, 0),
      'active_members', active_members_count,
      'total_members', total_members_count,
      'parties_created', parties_created_count,
      'parties_attended', parties_attended_count,
      'recent_activity', total_activity_count,
      'vouch_count', vouch_count
    )
  );
END;
$$ LANGUAGE plpgsql;

-- Function to update crew reputation score
-- Should be called periodically (e.g., daily via cron job)
CREATE OR REPLACE FUNCTION update_crew_reputation_scores()
RETURNS void AS $$
DECLARE
  crew_record RECORD;
  reputation_data JSONB;
BEGIN
  FOR crew_record IN
    SELECT id FROM party_crews WHERE active_status = true
  LOOP
    -- Calculate reputation
    reputation_data := calculate_crew_reputation(crew_record.id);

    -- Update crew record
    UPDATE party_crews
    SET
      reputation_score = (reputation_data->>'total')::NUMERIC,
      updated_at = NOW()
    WHERE id = crew_record.id;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update reputation when relevant activity occurs
CREATE OR REPLACE FUNCTION trigger_update_crew_reputation()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the crew's reputation score
  UPDATE party_crews
  SET reputation_score = (calculate_crew_reputation(COALESCE(NEW.crew_id, OLD.crew_id))->>'total')::NUMERIC,
      updated_at = NOW()
  WHERE id = COALESCE(NEW.crew_id, OLD.crew_id);

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Apply triggers to relevant tables
DROP TRIGGER IF EXISTS update_reputation_on_activity ON crew_activity;
CREATE TRIGGER update_reputation_on_activity
  AFTER INSERT OR UPDATE OR DELETE ON crew_activity
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_crew_reputation();

DROP TRIGGER IF EXISTS update_reputation_on_member_change ON crew_members;
CREATE TRIGGER update_reputation_on_member_change
  AFTER INSERT OR UPDATE OR DELETE ON crew_members
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_crew_reputation();

DROP TRIGGER IF EXISTS update_reputation_on_vouch ON crew_vouches;
CREATE TRIGGER update_reputation_on_vouch
  AFTER INSERT OR DELETE ON crew_vouches
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_crew_reputation();

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_crew_reputation ON party_crews(reputation_score DESC)
  WHERE active_status = true;

-- Create scheduled job to update all crew reputations daily
-- Note: This requires pg_cron extension to be enabled
-- SELECT cron.schedule('update-crew-reputations', '0 2 * * *', 'SELECT update_crew_reputation_scores()');

COMMENT ON FUNCTION calculate_crew_reputation IS 'Calculates crew reputation score (0-100) based on activity, retention, engagement, and vouches';
COMMENT ON FUNCTION update_crew_reputation_scores IS 'Updates reputation scores for all active crews - should be run daily';
COMMENT ON FUNCTION trigger_update_crew_reputation IS 'Trigger function to auto-update crew reputation on relevant changes';
