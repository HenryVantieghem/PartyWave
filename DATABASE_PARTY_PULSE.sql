-- ============================================
-- LIVE PARTY PULSE SYSTEM
-- ============================================
-- Real-time party energy and activity tracking
-- ============================================

-- Table for party pulse check-ins
CREATE TABLE IF NOT EXISTS party_pulse_checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  party_id UUID NOT NULL REFERENCES parties(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  energy_level INT NOT NULL CHECK (energy_level BETWEEN 1 AND 100),
  vibe_rating INT CHECK (vibe_rating BETWEEN 1 AND 5),
  crowdedness_rating INT CHECK (crowdedness_rating BETWEEN 1 AND 5),
  music_rating INT CHECK (music_rating BETWEEN 1 AND 5),
  comments TEXT,
  location_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT unique_user_party_pulse UNIQUE (party_id, user_id, created_at)
);

-- Table for real-time party metrics (aggregated)
CREATE TABLE IF NOT EXISTS party_pulse_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  party_id UUID NOT NULL REFERENCES parties(id) ON DELETE CASCADE,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Attendance metrics
  current_attendee_count INT DEFAULT 0,
  checked_in_count INT DEFAULT 0,
  check_in_rate NUMERIC(5,2) DEFAULT 0,

  -- Energy metrics
  avg_energy_level NUMERIC(5,2) DEFAULT 0,
  peak_energy_level INT DEFAULT 0,
  energy_trend VARCHAR(20) DEFAULT 'stable', -- rising, stable, falling

  -- Vibe metrics
  avg_vibe_rating NUMERIC(3,2) DEFAULT 0,
  avg_crowdedness NUMERIC(3,2) DEFAULT 0,
  avg_music_rating NUMERIC(3,2) DEFAULT 0,

  -- Activity metrics
  total_check_ins INT DEFAULT 0,
  total_photos_shared INT DEFAULT 0,
  total_messages_sent INT DEFAULT 0,

  -- Calculated pulse score (0-100)
  pulse_score NUMERIC(5,2) DEFAULT 0,
  pulse_status VARCHAR(20) DEFAULT 'warming_up', -- warming_up, lit, peak, winding_down, ended

  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT unique_party_timestamp UNIQUE (party_id, timestamp)
);

-- Table for party activity events
CREATE TABLE IF NOT EXISTS party_activity_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  party_id UUID NOT NULL REFERENCES parties(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  event_type VARCHAR(50) NOT NULL, -- check_in, photo_shared, message_sent, energy_boost, energy_drop
  event_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Function to calculate current party pulse
CREATE OR REPLACE FUNCTION calculate_party_pulse(party_id_param UUID)
RETURNS JSONB AS $$
DECLARE
  pulse_data JSONB;
  current_energy NUMERIC;
  trend VARCHAR(20);
  status VARCHAR(20);
  pulse_score NUMERIC;
  attendee_count INT;
  checked_in_count INT;
  recent_checkins INT;
  avg_vibe NUMERIC;
  avg_crowdedness NUMERIC;
  avg_music NUMERIC;
  total_photos INT;
  total_messages INT;
  party_start TIMESTAMP;
  hours_since_start NUMERIC;
BEGIN
  -- Get party start time
  SELECT date_time INTO party_start
  FROM parties
  WHERE id = party_id_param;

  hours_since_start := EXTRACT(EPOCH FROM (NOW() - party_start)) / 3600;

  -- Get current attendee count
  SELECT COUNT(*) INTO attendee_count
  FROM party_attendees
  WHERE party_id = party_id_param AND status = 'going';

  -- Get checked-in count (last 5 minutes)
  SELECT COUNT(*) INTO checked_in_count
  FROM party_pulse_checkins
  WHERE party_id = party_id_param
    AND created_at >= NOW() - INTERVAL '5 minutes';

  -- Get recent check-ins (last 30 minutes)
  SELECT COUNT(*) INTO recent_checkins
  FROM party_pulse_checkins
  WHERE party_id = party_id_param
    AND created_at >= NOW() - INTERVAL '30 minutes';

  -- Calculate average energy from recent check-ins (last hour)
  SELECT COALESCE(AVG(energy_level), 0) INTO current_energy
  FROM party_pulse_checkins
  WHERE party_id = party_id_param
    AND created_at >= NOW() - INTERVAL '1 hour';

  -- Calculate average ratings
  SELECT
    COALESCE(AVG(vibe_rating), 0),
    COALESCE(AVG(crowdedness_rating), 0),
    COALESCE(AVG(music_rating), 0)
  INTO avg_vibe, avg_crowdedness, avg_music
  FROM party_pulse_checkins
  WHERE party_id = party_id_param
    AND created_at >= NOW() - INTERVAL '1 hour';

  -- Get activity counts
  SELECT COUNT(*) INTO total_photos
  FROM party_activity_events
  WHERE party_id = party_id_param
    AND event_type = 'photo_shared'
    AND created_at >= NOW() - INTERVAL '1 hour';

  SELECT COUNT(*) INTO total_messages
  FROM party_activity_events
  WHERE party_id = party_id_param
    AND event_type = 'message_sent'
    AND created_at >= NOW() - INTERVAL '1 hour';

  -- Determine energy trend
  DECLARE
    prev_energy NUMERIC;
  BEGIN
    SELECT COALESCE(AVG(energy_level), current_energy) INTO prev_energy
    FROM party_pulse_checkins
    WHERE party_id = party_id_param
      AND created_at >= NOW() - INTERVAL '2 hours'
      AND created_at < NOW() - INTERVAL '1 hour';

    IF current_energy > prev_energy + 10 THEN
      trend := 'rising';
    ELSIF current_energy < prev_energy - 10 THEN
      trend := 'falling';
    ELSE
      trend := 'stable';
    END IF;
  END;

  -- Calculate pulse score (0-100)
  pulse_score := LEAST(100, (
    (current_energy * 0.35) +                    -- 35% weight
    (avg_vibe * 20 * 0.20) +                     -- 20% weight
    (LEAST(recent_checkins * 5, 30) * 0.20) +    -- 20% weight (check-in activity)
    (avg_music * 20 * 0.15) +                    -- 15% weight
    ((total_photos + total_messages) * 0.10)     -- 10% weight (social activity)
  ));

  -- Determine party status
  IF hours_since_start < 0 THEN
    status := 'upcoming';
  ELSIF hours_since_start < 1 THEN
    status := 'warming_up';
  ELSIF pulse_score >= 80 THEN
    status := 'peak';
  ELSIF pulse_score >= 60 THEN
    status := 'lit';
  ELSIF hours_since_start > 5 OR pulse_score < 30 THEN
    status := 'winding_down';
  ELSE
    status := 'active';
  END IF;

  -- Build response
  pulse_data := jsonb_build_object(
    'pulse_score', ROUND(pulse_score, 0),
    'status', status,
    'energy', jsonb_build_object(
      'current', ROUND(current_energy, 0),
      'trend', trend
    ),
    'attendance', jsonb_build_object(
      'total', attendee_count,
      'checked_in', checked_in_count,
      'recent_activity', recent_checkins
    ),
    'ratings', jsonb_build_object(
      'vibe', ROUND(avg_vibe, 1),
      'crowdedness', ROUND(avg_crowdedness, 1),
      'music', ROUND(avg_music, 1)
    ),
    'activity', jsonb_build_object(
      'photos', total_photos,
      'messages', total_messages,
      'total', total_photos + total_messages
    ),
    'timestamp', NOW()
  );

  RETURN pulse_data;
END;
$$ LANGUAGE plpgsql;

-- Function to create a pulse check-in
CREATE OR REPLACE FUNCTION create_pulse_checkin(
  p_party_id UUID,
  p_user_id UUID,
  p_energy_level INT,
  p_vibe_rating INT DEFAULT NULL,
  p_crowdedness_rating INT DEFAULT NULL,
  p_music_rating INT DEFAULT NULL,
  p_comments TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  checkin_id UUID;
BEGIN
  -- Insert check-in
  INSERT INTO party_pulse_checkins (
    party_id,
    user_id,
    energy_level,
    vibe_rating,
    crowdedness_rating,
    music_rating,
    comments
  ) VALUES (
    p_party_id,
    p_user_id,
    p_energy_level,
    p_vibe_rating,
    p_crowdedness_rating,
    p_music_rating,
    p_comments
  )
  RETURNING id INTO checkin_id;

  -- Create activity event
  INSERT INTO party_activity_events (
    party_id,
    user_id,
    event_type,
    event_data
  ) VALUES (
    p_party_id,
    p_user_id,
    'check_in',
    jsonb_build_object(
      'energy_level', p_energy_level,
      'checkin_id', checkin_id
    )
  );

  -- Update party pulse metrics
  INSERT INTO party_pulse_metrics (party_id)
  VALUES (p_party_id)
  ON CONFLICT (party_id, timestamp) DO UPDATE
  SET
    total_check_ins = party_pulse_metrics.total_check_ins + 1,
    updated_at = NOW();

  RETURN checkin_id;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update pulse metrics on activity
CREATE OR REPLACE FUNCTION trigger_update_pulse_metrics()
RETURNS TRIGGER AS $$
BEGIN
  -- Update pulse metrics for the party
  PERFORM calculate_party_pulse(NEW.party_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers
DROP TRIGGER IF EXISTS update_pulse_on_checkin ON party_pulse_checkins;
CREATE TRIGGER update_pulse_on_checkin
  AFTER INSERT ON party_pulse_checkins
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_pulse_metrics();

DROP TRIGGER IF EXISTS update_pulse_on_activity ON party_activity_events;
CREATE TRIGGER update_pulse_on_activity
  AFTER INSERT ON party_activity_events
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_pulse_metrics();

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_pulse_checkins_party_time ON party_pulse_checkins(party_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pulse_checkins_recent ON party_pulse_checkins(party_id, created_at) WHERE created_at >= NOW() - INTERVAL '2 hours';
CREATE INDEX IF NOT EXISTS idx_pulse_metrics_party ON party_pulse_metrics(party_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_activity_events_party_time ON party_activity_events(party_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_events_recent ON party_activity_events(party_id, created_at) WHERE created_at >= NOW() - INTERVAL '2 hours';

-- Row Level Security
ALTER TABLE party_pulse_checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE party_pulse_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE party_activity_events ENABLE ROW LEVEL SECURITY;

-- Policies for party_pulse_checkins
CREATE POLICY "Users can view pulse check-ins for parties they're attending"
  ON party_pulse_checkins FOR SELECT
  USING (
    party_id IN (
      SELECT party_id FROM party_attendees
      WHERE user_id = auth.uid() AND status IN ('going', 'checked_in')
    )
  );

CREATE POLICY "Users can create their own pulse check-ins"
  ON party_pulse_checkins FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policies for party_pulse_metrics
CREATE POLICY "Users can view pulse metrics for parties they're attending"
  ON party_pulse_metrics FOR SELECT
  USING (
    party_id IN (
      SELECT party_id FROM party_attendees
      WHERE user_id = auth.uid() AND status IN ('going', 'checked_in')
    )
  );

-- Policies for party_activity_events
CREATE POLICY "Users can view activity for parties they're attending"
  ON party_activity_events FOR SELECT
  USING (
    party_id IN (
      SELECT party_id FROM party_attendees
      WHERE user_id = auth.uid() AND status IN ('going', 'checked_in')
    )
  );

CREATE POLICY "Users can create activity events for parties they're attending"
  ON party_activity_events FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND
    party_id IN (
      SELECT party_id FROM party_attendees
      WHERE user_id = auth.uid() AND status IN ('going', 'checked_in')
    )
  );

COMMENT ON TABLE party_pulse_checkins IS 'Real-time user check-ins with energy and vibe ratings';
COMMENT ON TABLE party_pulse_metrics IS 'Aggregated real-time party metrics and pulse score';
COMMENT ON TABLE party_activity_events IS 'Stream of all party activity events';
COMMENT ON FUNCTION calculate_party_pulse IS 'Calculates real-time party pulse score and status';
COMMENT ON FUNCTION create_pulse_checkin IS 'Creates a pulse check-in and updates metrics';
