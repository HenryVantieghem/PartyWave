-- ============================================
-- THE HANGOUT - PHASE 2 PARTY ENHANCEMENTS
-- ============================================
-- Created: 2025-11-21
-- Purpose: Add vibes, co-hosts, templates, and enhanced party features
-- Dependencies: Requires existing parties table and crew system (Phase 1)
-- ============================================

-- ============================================
-- ENHANCE: parties table
-- Add new columns for dual-mode creation and vibe tracking
-- ============================================

-- Add vibe and mode tracking columns
ALTER TABLE parties ADD COLUMN IF NOT EXISTS creation_mode TEXT CHECK (creation_mode IN ('quick', 'planned')) DEFAULT 'planned';
ALTER TABLE parties ADD COLUMN IF NOT EXISTS vibe_tags TEXT[] DEFAULT '{}';
ALTER TABLE parties ADD COLUMN IF NOT EXISTS energy_level INTEGER CHECK (energy_level >= 0 AND energy_level <= 100);
ALTER TABLE parties ADD COLUMN IF NOT EXISTS cover_photo_url TEXT;
ALTER TABLE parties ADD COLUMN IF NOT EXISTS capacity INTEGER CHECK (capacity IS NULL OR capacity > 0);
ALTER TABLE parties ADD COLUMN IF NOT EXISTS rsvp_deadline TIMESTAMP WITH TIME ZONE;
ALTER TABLE parties ADD COLUMN IF NOT EXISTS crew_id UUID REFERENCES party_crews(id) ON DELETE SET NULL;
ALTER TABLE parties ADD COLUMN IF NOT EXISTS template_id UUID;

-- Add quick create specific fields
ALTER TABLE parties ADD COLUMN IF NOT EXISTS quick_create_metadata JSONB DEFAULT '{}'::jsonb;
-- Example metadata: { "captured_at": "timestamp", "mood": "lit", "urgency": "high" }

-- ============================================
-- TABLE: party_co_hosts
-- Purpose: Allow multiple co-hosts per party
-- ============================================

CREATE TABLE IF NOT EXISTS party_co_hosts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  party_id UUID NOT NULL REFERENCES parties(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner', 'co-host')) DEFAULT 'co-host',
  can_edit BOOLEAN DEFAULT true,
  can_invite BOOLEAN DEFAULT true,
  can_manage_attendees BOOLEAN DEFAULT false,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  added_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  UNIQUE(party_id, user_id)
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_party_co_hosts_party ON party_co_hosts(party_id);
CREATE INDEX IF NOT EXISTS idx_party_co_hosts_user ON party_co_hosts(user_id);

-- ============================================
-- TABLE: party_templates
-- Purpose: Reusable party templates
-- ============================================

CREATE TABLE IF NOT EXISTS party_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_public BOOLEAN DEFAULT false,
  icon_emoji TEXT DEFAULT '🎉',

  -- Template defaults
  default_duration_hours INTEGER DEFAULT 4,
  default_vibe_tags TEXT[] DEFAULT '{}',
  default_privacy TEXT CHECK (default_privacy IN ('public', 'private')) DEFAULT 'private',
  suggested_capacity INTEGER,

  -- Customization options
  custom_fields JSONB DEFAULT '{}'::jsonb,
  -- Example: { "dress_code": "casual", "bring": "drinks", "activities": ["pool", "games"] }

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  use_count INTEGER DEFAULT 0
);

-- Index for template discovery
CREATE INDEX IF NOT EXISTS idx_party_templates_public ON party_templates(is_public) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_party_templates_creator ON party_templates(created_by);

-- ============================================
-- TABLE: party_vibes
-- Purpose: Track party energy and vibe over time
-- ============================================

CREATE TABLE IF NOT EXISTS party_vibes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  party_id UUID NOT NULL REFERENCES parties(id) ON DELETE CASCADE,
  recorded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  energy_level INTEGER NOT NULL CHECK (energy_level >= 0 AND energy_level <= 100),
  vibe_description TEXT,
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Contextual data
  attendee_count INTEGER,
  music_playing BOOLEAN DEFAULT false,
  peak_moment BOOLEAN DEFAULT false
);

-- Index for time-series queries
CREATE INDEX IF NOT EXISTS idx_party_vibes_party_time ON party_vibes(party_id, recorded_at DESC);

-- ============================================
-- TABLE: party_quick_plans
-- Purpose: Casual polling for quick hangouts (crew feature)
-- ============================================

CREATE TABLE IF NOT EXISTS party_quick_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  crew_id UUID NOT NULL REFERENCES party_crews(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  suggested_time TIMESTAMP WITH TIME ZONE,
  suggested_location TEXT,

  -- Poll status
  status TEXT CHECK (status IN ('active', 'confirmed', 'cancelled')) DEFAULT 'active',
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '6 hours'),

  -- Voting
  upvotes INTEGER DEFAULT 0,
  downvotes INTEGER DEFAULT 0,

  -- If confirmed, becomes a party
  party_id UUID REFERENCES parties(id) ON DELETE SET NULL,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_quick_plans_crew ON party_quick_plans(crew_id);
CREATE INDEX IF NOT EXISTS idx_quick_plans_status ON party_quick_plans(status) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_quick_plans_expires ON party_quick_plans(expires_at) WHERE status = 'active';

-- ============================================
-- TABLE: quick_plan_votes
-- Purpose: Track votes on quick plans
-- ============================================

CREATE TABLE IF NOT EXISTS quick_plan_votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quick_plan_id UUID NOT NULL REFERENCES party_quick_plans(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vote_type TEXT CHECK (vote_type IN ('up', 'down', 'interested')) DEFAULT 'interested',
  voted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(quick_plan_id, user_id)
);

-- Index for vote counting
CREATE INDEX IF NOT EXISTS idx_quick_plan_votes_plan ON quick_plan_votes(quick_plan_id);

-- ============================================
-- RLS POLICIES: party_co_hosts
-- ============================================

ALTER TABLE party_co_hosts ENABLE ROW LEVEL SECURITY;

-- Users can view co-hosts of parties they can see
CREATE POLICY "Users can view party co-hosts"
  ON party_co_hosts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM parties p
      WHERE p.id = party_co_hosts.party_id
      AND (p.privacy = 'public' OR p.host_id = auth.uid() OR party_co_hosts.user_id = auth.uid())
    )
  );

-- Party owners can manage co-hosts
CREATE POLICY "Party owners can manage co-hosts"
  ON party_co_hosts FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM parties p
      WHERE p.id = party_co_hosts.party_id
      AND p.host_id = auth.uid()
    )
  );

-- ============================================
-- RLS POLICIES: party_templates
-- ============================================

ALTER TABLE party_templates ENABLE ROW LEVEL SECURITY;

-- Users can view public templates and their own
CREATE POLICY "Users can view templates"
  ON party_templates FOR SELECT
  USING (is_public = true OR created_by = auth.uid());

-- Users can create their own templates
CREATE POLICY "Users can create templates"
  ON party_templates FOR INSERT
  WITH CHECK (created_by = auth.uid());

-- Users can update their own templates
CREATE POLICY "Users can update own templates"
  ON party_templates FOR UPDATE
  USING (created_by = auth.uid());

-- Users can delete their own templates
CREATE POLICY "Users can delete own templates"
  ON party_templates FOR DELETE
  USING (created_by = auth.uid());

-- ============================================
-- RLS POLICIES: party_vibes
-- ============================================

ALTER TABLE party_vibes ENABLE ROW LEVEL SECURITY;

-- Anyone can view vibes for parties they can see
CREATE POLICY "Users can view party vibes"
  ON party_vibes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM parties p
      WHERE p.id = party_vibes.party_id
      AND (p.privacy = 'public' OR p.host_id = auth.uid())
    )
  );

-- Attendees can record vibes
CREATE POLICY "Attendees can record vibes"
  ON party_vibes FOR INSERT
  WITH CHECK (
    recorded_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM party_attendees pa
      WHERE pa.party_id = party_vibes.party_id
      AND pa.user_id = auth.uid()
      AND pa.status = 'attending'
    )
  );

-- ============================================
-- RLS POLICIES: party_quick_plans
-- ============================================

ALTER TABLE party_quick_plans ENABLE ROW LEVEL SECURITY;

-- Crew members can view quick plans
CREATE POLICY "Crew members can view quick plans"
  ON party_quick_plans FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM crew_members cm
      WHERE cm.crew_id = party_quick_plans.crew_id
      AND cm.user_id = auth.uid()
      AND cm.is_active = true
    )
  );

-- Crew members can create quick plans
CREATE POLICY "Crew members can create quick plans"
  ON party_quick_plans FOR INSERT
  WITH CHECK (
    created_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM crew_members cm
      WHERE cm.crew_id = party_quick_plans.crew_id
      AND cm.user_id = auth.uid()
      AND cm.is_active = true
    )
  );

-- Creators can update their quick plans
CREATE POLICY "Creators can update quick plans"
  ON party_quick_plans FOR UPDATE
  USING (created_by = auth.uid());

-- ============================================
-- RLS POLICIES: quick_plan_votes
-- ============================================

ALTER TABLE quick_plan_votes ENABLE ROW LEVEL SECURITY;

-- Users can view votes on quick plans they can see
CREATE POLICY "Users can view quick plan votes"
  ON quick_plan_votes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM party_quick_plans qp
      JOIN crew_members cm ON cm.crew_id = qp.crew_id
      WHERE qp.id = quick_plan_votes.quick_plan_id
      AND cm.user_id = auth.uid()
      AND cm.is_active = true
    )
  );

-- Users can vote on quick plans
CREATE POLICY "Users can vote on quick plans"
  ON quick_plan_votes FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM party_quick_plans qp
      JOIN crew_members cm ON cm.crew_id = qp.crew_id
      WHERE qp.id = quick_plan_votes.quick_plan_id
      AND cm.user_id = auth.uid()
      AND cm.is_active = true
      AND qp.status = 'active'
    )
  );

-- Users can update their own votes
CREATE POLICY "Users can update own votes"
  ON quick_plan_votes FOR UPDATE
  USING (user_id = auth.uid());

-- ============================================
-- TRIGGERS
-- ============================================

-- Auto-update template use count
CREATE OR REPLACE FUNCTION increment_template_use_count()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.template_id IS NOT NULL THEN
    UPDATE party_templates
    SET use_count = use_count + 1
    WHERE id = NEW.template_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_increment_template_use
  AFTER INSERT ON parties
  FOR EACH ROW
  WHEN (NEW.template_id IS NOT NULL)
  EXECUTE FUNCTION increment_template_use_count();

-- Auto-expire old quick plans
CREATE OR REPLACE FUNCTION auto_expire_quick_plans()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE party_quick_plans
  SET status = 'cancelled'
  WHERE status = 'active'
    AND expires_at < NOW();
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Run this as a periodic job or on insert
-- For now, just a function that can be called manually or via cron

-- ============================================
-- FUNCTIONS
-- ============================================

-- Get party vibe summary
CREATE OR REPLACE FUNCTION get_party_vibe_summary(p_party_id UUID)
RETURNS TABLE (
  avg_energy NUMERIC,
  peak_energy INTEGER,
  vibe_count BIGINT,
  last_updated TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    AVG(energy_level)::NUMERIC as avg_energy,
    MAX(energy_level) as peak_energy,
    COUNT(*) as vibe_count,
    MAX(recorded_at) as last_updated
  FROM party_vibes
  WHERE party_id = p_party_id;
END;
$$ LANGUAGE plpgsql;

-- Get active quick plans for crew
CREATE OR REPLACE FUNCTION get_active_quick_plans(p_crew_id UUID)
RETURNS TABLE (
  plan_id UUID,
  title TEXT,
  upvote_count BIGINT,
  interested_count BIGINT,
  time_remaining INTERVAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    qp.id as plan_id,
    qp.title,
    COUNT(CASE WHEN qpv.vote_type = 'up' THEN 1 END) as upvote_count,
    COUNT(CASE WHEN qpv.vote_type = 'interested' THEN 1 END) as interested_count,
    qp.expires_at - NOW() as time_remaining
  FROM party_quick_plans qp
  LEFT JOIN quick_plan_votes qpv ON qpv.quick_plan_id = qp.id
  WHERE qp.crew_id = p_crew_id
    AND qp.status = 'active'
    AND qp.expires_at > NOW()
  GROUP BY qp.id, qp.title, qp.expires_at
  ORDER BY upvote_count DESC, interested_count DESC;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

-- Party lookups by crew
CREATE INDEX IF NOT EXISTS idx_parties_crew ON parties(crew_id) WHERE crew_id IS NOT NULL;

-- Template lookups
CREATE INDEX IF NOT EXISTS idx_parties_template ON parties(template_id) WHERE template_id IS NOT NULL;

-- Quick create parties
CREATE INDEX IF NOT EXISTS idx_parties_creation_mode ON parties(creation_mode);

-- Energy level queries
CREATE INDEX IF NOT EXISTS idx_parties_energy ON parties(energy_level) WHERE energy_level IS NOT NULL;

-- ============================================
-- SAMPLE DATA (OPTIONAL - for development)
-- ============================================

-- Sample vibe tags (can be used as suggestions)
-- Common vibes: 'chill', 'lit', 'intimate', 'wild', 'classy', 'casual', 'rave', 'lounge'

-- Sample party template
-- INSERT INTO party_templates (name, description, created_by, is_public, icon_emoji, default_vibe_tags, suggested_capacity)
-- VALUES (
--   'House Party',
--   'Classic house party template',
--   (SELECT id FROM auth.users LIMIT 1), -- Replace with actual user
--   true,
--   '🏠',
--   ARRAY['casual', 'chill', 'music'],
--   30
-- );

-- ============================================
-- END OF MIGRATION
-- ============================================

-- To verify tables were created:
-- SELECT table_name FROM information_schema.tables
-- WHERE table_schema = 'public'
-- AND (table_name LIKE 'party_%' OR table_name = 'quick_plan_votes');
