-- ============================================
-- VIBE MATCHING ALGORITHM (P4-T06)
-- ============================================

CREATE OR REPLACE FUNCTION match_user_vibes(user_id_param UUID)
RETURNS TABLE(matched_user_id UUID, match_score NUMERIC) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p2.id as matched_user_id,
    (
      -- Party attendance overlap (40%)
      (COUNT(DISTINCT pa1.party_id) FILTER (WHERE pa2.party_id IS NOT NULL))::NUMERIC /
      NULLIF(COUNT(DISTINCT pa1.party_id), 0) * 40
      +
      -- Crew membership overlap (30%)
      (SELECT COUNT(*) FROM crew_members cm1
       INNER JOIN crew_members cm2 ON cm1.crew_id = cm2.crew_id
       WHERE cm1.user_id = user_id_param AND cm2.user_id = p2.id)::NUMERIC * 5
      +
      -- Common vouches (30%)
      (SELECT COUNT(*) FROM crew_vouches cv1
       INNER JOIN crew_vouches cv2 ON cv1.vouched_user_id = cv2.vouched_user_id
       WHERE cv1.voucher_id = user_id_param AND cv2.voucher_id = p2.id)::NUMERIC * 3
    ) as match_score
  FROM profiles p2
  LEFT JOIN party_attendees pa2 ON pa2.user_id = p2.id
  LEFT JOIN party_attendees pa1 ON pa1.party_id = pa2.party_id AND pa1.user_id = user_id_param
  WHERE p2.id != user_id_param
  GROUP BY p2.id
  ORDER BY match_score DESC
  LIMIT 50;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- TRUST SCORE SYSTEM (P4-T07)
-- ============================================

CREATE TABLE IF NOT EXISTS user_trust_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  trust_score NUMERIC(5,2) DEFAULT 50,
  verified BOOLEAN DEFAULT false,
  verification_level INT DEFAULT 0, -- 0: none, 1: phone, 2: id, 3: full
  vouches_received INT DEFAULT 0,
  parties_attended INT DEFAULT 0,
  parties_hosted INT DEFAULT 0,
  no_shows INT DEFAULT 0,
  reports_received INT DEFAULT 0,
  positive_feedback_count INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION calculate_trust_score(user_id_param UUID)
RETURNS NUMERIC AS $$
DECLARE
  score NUMERIC := 50; -- Start at neutral
  vouches INT;
  parties_count INT;
  no_shows INT;
  reports INT;
  verification INT;
BEGIN
  SELECT
    vouches_received,
    parties_attended,
    no_shows,
    reports_received,
    verification_level
  INTO vouches, parties_count, no_shows, reports, verification
  FROM user_trust_scores
  WHERE user_id = user_id_param;

  -- Positive factors
  score := score + LEAST(vouches * 2, 20);           -- +20 max from vouches
  score := score + LEAST(parties_count * 0.5, 15);   -- +15 max from attendance
  score := score + (verification * 5);                -- +15 max from verification

  -- Negative factors
  score := score - (no_shows * 5);                    -- -5 per no-show
  score := score - (reports * 10);                    -- -10 per report

  RETURN LEAST(GREATEST(score, 0), 100);
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- SAFETY FEATURES (P4-T09)
-- ============================================

CREATE TABLE IF NOT EXISTS safety_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reported_user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  party_id UUID REFERENCES parties(id) ON DELETE CASCADE,
  report_type VARCHAR(50) NOT NULL, -- harassment, safety, fake_profile, spam, other
  description TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'pending', -- pending, reviewing, resolved, dismissed
  severity VARCHAR(20) DEFAULT 'medium', -- low, medium, high, critical
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS emergency_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  relationship TEXT,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Safety check-in system
CREATE TABLE IF NOT EXISTS safety_checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  party_id UUID NOT NULL REFERENCES parties(id) ON DELETE CASCADE,
  checkin_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expected_checkout TIMESTAMP WITH TIME ZONE,
  actual_checkout TIMESTAMP WITH TIME ZONE,
  status VARCHAR(20) DEFAULT 'active', -- active, checked_out, overdue, emergency
  location_lat NUMERIC(10, 8),
  location_lon NUMERIC(11, 8),
  emergency_triggered BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
