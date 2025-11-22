-- ============================================
-- THE HANGOUT - PHASE 4 DATABASE MIGRATION
-- ============================================
-- Created: 2025-11-22
-- Purpose: Live party features, memory system, safety tools
-- Dependencies: Requires Phase 1 (crews), Phase 2 (parties), Phase 3 (activity/notifications)
-- Estimated execution time: 2-3 minutes
-- ============================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABLE 1: party_live_pulse (Real-time Energy Tracking)
-- ============================================

CREATE TABLE IF NOT EXISTS party_live_pulse (
  -- Primary Keys
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Foreign Keys
  party_id UUID NOT NULL REFERENCES parties(id) ON DELETE CASCADE,
  submitter_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Energy Data
  energy_level INTEGER NOT NULL CHECK (energy_level >= 0 AND energy_level <= 100),
  vibe_emoji TEXT, -- Single emoji representing current vibe

  -- Contextual Data
  attendee_count INTEGER,
  music_intensity INTEGER CHECK (music_intensity IS NULL OR (music_intensity >= 0 AND music_intensity <= 10)),
  crowd_density TEXT CHECK (crowd_density IN ('sparse', 'moderate', 'packed', 'overcrowded')),

  -- Metrics
  is_peak_moment BOOLEAN DEFAULT false,
  location_area TEXT, -- Which area of party (e.g., "dance_floor", "backyard", "kitchen")

  -- Metadata
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Indexes for party_live_pulse
CREATE INDEX idx_party_pulse_party_time
  ON party_live_pulse(party_id, recorded_at DESC);

CREATE INDEX idx_party_pulse_peak_moments
  ON party_live_pulse(party_id, recorded_at DESC)
  WHERE is_peak_moment = true;

CREATE INDEX idx_party_pulse_recent
  ON party_live_pulse(recorded_at DESC);

-- ============================================
-- TABLE 2: party_memories (Enhanced Photo/Video System)
-- ============================================

-- Add new columns to existing party_memories table
ALTER TABLE party_memories ADD COLUMN IF NOT EXISTS uploader_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE party_memories ADD COLUMN IF NOT EXISTS file_size_bytes BIGINT;
ALTER TABLE party_memories ADD COLUMN IF NOT EXISTS width INTEGER;
ALTER TABLE party_memories ADD COLUMN IF NOT EXISTS height INTEGER;
ALTER TABLE party_memories ADD COLUMN IF NOT EXISTS duration_seconds INTEGER; -- For videos
ALTER TABLE party_memories ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;
ALTER TABLE party_memories ADD COLUMN IF NOT EXISTS visibility TEXT CHECK (visibility IN ('public', 'attendees_only', 'crew_only', 'private')) DEFAULT 'attendees_only';
ALTER TABLE party_memories ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;
ALTER TABLE party_memories ADD COLUMN IF NOT EXISTS ai_labels TEXT[]; -- AI-generated tags
ALTER TABLE party_memories ADD COLUMN IF NOT EXISTS location_area TEXT; -- Where at party was this taken
ALTER TABLE party_memories ADD COLUMN IF NOT EXISTS reactions_count INTEGER DEFAULT 0;

-- New indexes for enhanced party_memories
CREATE INDEX IF NOT EXISTS idx_party_memories_uploader
  ON party_memories(uploader_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_party_memories_visibility
  ON party_memories(party_id, visibility, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_party_memories_featured
  ON party_memories(party_id, is_featured, created_at DESC)
  WHERE is_featured = true;

CREATE INDEX IF NOT EXISTS idx_party_memories_labels
  ON party_memories USING GIN (ai_labels);

-- ============================================
-- TABLE 3: memory_reactions (Reactions to Memories)
-- ============================================

CREATE TABLE IF NOT EXISTS memory_reactions (
  -- Primary Keys
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Foreign Keys
  memory_id UUID NOT NULL REFERENCES party_memories(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Reaction Data
  reaction_type TEXT NOT NULL CHECK (reaction_type IN (
    'fire', 'heart', 'laugh', 'wow', 'cool', 'party'
  )),

  -- Metadata
  reacted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Constraints
  UNIQUE(memory_id, user_id) -- One reaction per user per memory
);

-- Indexes for memory_reactions
CREATE INDEX idx_memory_reactions_memory
  ON memory_reactions(memory_id, reacted_at DESC);

CREATE INDEX idx_memory_reactions_user
  ON memory_reactions(user_id, reacted_at DESC);

-- ============================================
-- TABLE 4: memory_albums (Collaborative Photo Albums)
-- ============================================

CREATE TABLE IF NOT EXISTS memory_albums (
  -- Primary Keys
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Foreign Keys
  party_id UUID NOT NULL REFERENCES parties(id) ON DELETE CASCADE,
  creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Album Data
  title TEXT NOT NULL CHECK (char_length(title) >= 1 AND char_length(title) <= 100),
  description TEXT CHECK (description IS NULL OR char_length(description) <= 500),
  cover_memory_id UUID REFERENCES party_memories(id) ON DELETE SET NULL,

  -- Settings
  visibility TEXT NOT NULL CHECK (visibility IN ('public', 'attendees_only', 'crew_only', 'private'))
    DEFAULT 'attendees_only',
  allow_collaborators BOOLEAN DEFAULT true,
  auto_add_memories BOOLEAN DEFAULT false, -- Auto-add all party memories

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Stats (denormalized)
  memory_count INTEGER DEFAULT 0,
  collaborator_count INTEGER DEFAULT 1
);

-- Indexes for memory_albums
CREATE INDEX idx_memory_albums_party
  ON memory_albums(party_id, created_at DESC);

CREATE INDEX idx_memory_albums_creator
  ON memory_albums(creator_id, created_at DESC);

CREATE INDEX idx_memory_albums_visibility
  ON memory_albums(visibility, created_at DESC)
  WHERE visibility = 'public';

-- ============================================
-- TABLE 5: album_memories (Junction Table)
-- ============================================

CREATE TABLE IF NOT EXISTS album_memories (
  -- Primary Keys
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Foreign Keys
  album_id UUID NOT NULL REFERENCES memory_albums(id) ON DELETE CASCADE,
  memory_id UUID NOT NULL REFERENCES party_memories(id) ON DELETE CASCADE,

  -- Order & Position
  position INTEGER DEFAULT 0,
  added_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Metadata
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Constraints
  UNIQUE(album_id, memory_id)
);

-- Indexes for album_memories
CREATE INDEX idx_album_memories_album
  ON album_memories(album_id, position ASC);

CREATE INDEX idx_album_memories_memory
  ON album_memories(memory_id);

-- ============================================
-- TABLE 6: memory_collaborators (Album Permissions)
-- ============================================

CREATE TABLE IF NOT EXISTS memory_collaborators (
  -- Primary Keys
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Foreign Keys
  album_id UUID NOT NULL REFERENCES memory_albums(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Permissions
  can_add_memories BOOLEAN DEFAULT true,
  can_remove_memories BOOLEAN DEFAULT false,
  can_edit_album BOOLEAN DEFAULT false,

  -- Metadata
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  added_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Constraints
  UNIQUE(album_id, user_id)
);

-- Indexes for memory_collaborators
CREATE INDEX idx_memory_collaborators_album
  ON memory_collaborators(album_id);

CREATE INDEX idx_memory_collaborators_user
  ON memory_collaborators(user_id);

-- ============================================
-- TABLE 7: highlight_reels (Auto-generated Compilations)
-- ============================================

CREATE TABLE IF NOT EXISTS highlight_reels (
  -- Primary Keys
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Foreign Keys
  party_id UUID NOT NULL REFERENCES parties(id) ON DELETE CASCADE,
  creator_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- NULL if system-generated

  -- Reel Data
  title TEXT NOT NULL,
  duration_seconds INTEGER,
  video_url TEXT, -- Link to compiled video
  thumbnail_url TEXT,

  -- Generation Info
  is_auto_generated BOOLEAN DEFAULT true,
  template_used TEXT, -- Which template/style was used
  memory_ids UUID[], -- Array of memory IDs included in reel

  -- Music/Audio
  music_track TEXT,
  music_url TEXT,

  -- Status
  status TEXT NOT NULL CHECK (status IN ('processing', 'ready', 'failed')) DEFAULT 'processing',
  processing_started_at TIMESTAMP WITH TIME ZONE,
  processing_completed_at TIMESTAMP WITH TIME ZONE,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Stats
  view_count INTEGER DEFAULT 0,
  share_count INTEGER DEFAULT 0
);

-- Indexes for highlight_reels
CREATE INDEX idx_highlight_reels_party
  ON highlight_reels(party_id, created_at DESC);

CREATE INDEX idx_highlight_reels_status
  ON highlight_reels(status, processing_started_at)
  WHERE status = 'processing';

CREATE INDEX idx_highlight_reels_creator
  ON highlight_reels(creator_id, created_at DESC)
  WHERE creator_id IS NOT NULL;

-- ============================================
-- TABLE 8: party_safety_reports (Safety/Reporting System)
-- ============================================

CREATE TABLE IF NOT EXISTS party_safety_reports (
  -- Primary Keys
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Foreign Keys
  party_id UUID NOT NULL REFERENCES parties(id) ON DELETE CASCADE,
  reporter_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- NULL for anonymous reports
  reported_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- NULL if reporting incident

  -- Report Data
  report_type TEXT NOT NULL CHECK (report_type IN (
    'harassment', 'violence', 'unsafe_behavior', 'underage_drinking',
    'drug_use', 'property_damage', 'noise_complaint', 'other'
  )),
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical'))
    DEFAULT 'medium',

  -- Details
  description TEXT NOT NULL CHECK (char_length(description) >= 10),
  location TEXT, -- Where at the party
  evidence_urls TEXT[], -- Photos/videos as evidence
  witness_ids UUID[], -- Other users who witnessed

  -- Status & Response
  status TEXT NOT NULL CHECK (status IN ('submitted', 'reviewing', 'resolved', 'dismissed'))
    DEFAULT 'submitted',
  resolution_notes TEXT,
  resolved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  resolved_at TIMESTAMP WITH TIME ZONE,

  -- Metadata
  is_anonymous BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Indexes for party_safety_reports
CREATE INDEX idx_safety_reports_party
  ON party_safety_reports(party_id, created_at DESC);

CREATE INDEX idx_safety_reports_status
  ON party_safety_reports(status, severity, created_at DESC)
  WHERE status IN ('submitted', 'reviewing');

CREATE INDEX idx_safety_reports_reporter
  ON party_safety_reports(reporter_id, created_at DESC)
  WHERE reporter_id IS NOT NULL;

CREATE INDEX idx_safety_reports_reported_user
  ON party_safety_reports(reported_user_id, created_at DESC)
  WHERE reported_user_id IS NOT NULL;

CREATE INDEX idx_safety_reports_severity
  ON party_safety_reports(severity, created_at DESC)
  WHERE severity IN ('high', 'critical');

-- ============================================
-- ROW LEVEL SECURITY: party_live_pulse
-- ============================================

ALTER TABLE party_live_pulse ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Party attendees can view live pulse" ON party_live_pulse;
CREATE POLICY "Party attendees can view live pulse"
  ON party_live_pulse FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM parties p
      WHERE p.id = party_live_pulse.party_id
        AND p.status = 'live'
        AND (
          p.is_private = false
          OR auth.uid() = p.host_id
          OR EXISTS (
            SELECT 1 FROM party_attendees pa
            WHERE pa.party_id = p.id AND pa.user_id = auth.uid()
          )
        )
    )
  );

DROP POLICY IF EXISTS "Checked-in attendees can submit pulse" ON party_live_pulse;
CREATE POLICY "Checked-in attendees can submit pulse"
  ON party_live_pulse FOR INSERT
  WITH CHECK (
    auth.uid() = submitter_id
    AND EXISTS (
      SELECT 1 FROM party_attendees pa
      JOIN parties p ON p.id = pa.party_id
      WHERE pa.party_id = party_live_pulse.party_id
        AND pa.user_id = auth.uid()
        AND pa.status = 'checked_in'
        AND p.status = 'live'
    )
  );

-- ============================================
-- ROW LEVEL SECURITY: memory_reactions
-- ============================================

ALTER TABLE memory_reactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view memory reactions" ON memory_reactions;
CREATE POLICY "Users can view memory reactions"
  ON memory_reactions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM party_memories pm
      WHERE pm.id = memory_reactions.memory_id
        AND (
          pm.visibility = 'public'
          OR auth.uid() = pm.user_id
          OR EXISTS (
            SELECT 1 FROM parties p
            WHERE p.id = pm.party_id
              AND (
                auth.uid() = p.host_id
                OR EXISTS (
                  SELECT 1 FROM party_attendees pa
                  WHERE pa.party_id = p.id AND pa.user_id = auth.uid()
                )
              )
          )
        )
    )
  );

DROP POLICY IF EXISTS "Users can react to memories" ON memory_reactions;
CREATE POLICY "Users can react to memories"
  ON memory_reactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own reactions" ON memory_reactions;
CREATE POLICY "Users can update own reactions"
  ON memory_reactions FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own reactions" ON memory_reactions;
CREATE POLICY "Users can delete own reactions"
  ON memory_reactions FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- ROW LEVEL SECURITY: memory_albums
-- ============================================

ALTER TABLE memory_albums ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public albums viewable by all" ON memory_albums;
CREATE POLICY "Public albums viewable by all"
  ON memory_albums FOR SELECT
  USING (visibility = 'public');

DROP POLICY IF EXISTS "Party attendees can view albums" ON memory_albums;
CREATE POLICY "Party attendees can view albums"
  ON memory_albums FOR SELECT
  USING (
    visibility IN ('attendees_only', 'public')
    AND EXISTS (
      SELECT 1 FROM parties p
      WHERE p.id = memory_albums.party_id
        AND (
          auth.uid() = p.host_id
          OR EXISTS (
            SELECT 1 FROM party_attendees pa
            WHERE pa.party_id = p.id AND pa.user_id = auth.uid()
          )
        )
    )
  );

DROP POLICY IF EXISTS "Creators and collaborators can view albums" ON memory_albums;
CREATE POLICY "Creators and collaborators can view albums"
  ON memory_albums FOR SELECT
  USING (
    auth.uid() = creator_id
    OR auth.uid() IN (
      SELECT user_id FROM memory_collaborators
      WHERE album_id = memory_albums.id
    )
  );

DROP POLICY IF EXISTS "Party attendees can create albums" ON memory_albums;
CREATE POLICY "Party attendees can create albums"
  ON memory_albums FOR INSERT
  WITH CHECK (
    auth.uid() = creator_id
    AND EXISTS (
      SELECT 1 FROM party_attendees pa
      WHERE pa.party_id = memory_albums.party_id
        AND pa.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Creators can update own albums" ON memory_albums;
CREATE POLICY "Creators can update own albums"
  ON memory_albums FOR UPDATE
  USING (
    auth.uid() = creator_id
    OR (
      allow_collaborators = true
      AND auth.uid() IN (
        SELECT user_id FROM memory_collaborators
        WHERE album_id = memory_albums.id AND can_edit_album = true
      )
    )
  );

DROP POLICY IF EXISTS "Creators can delete own albums" ON memory_albums;
CREATE POLICY "Creators can delete own albums"
  ON memory_albums FOR DELETE
  USING (auth.uid() = creator_id);

-- ============================================
-- ROW LEVEL SECURITY: album_memories
-- ============================================

ALTER TABLE album_memories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view album contents" ON album_memories;
CREATE POLICY "Users can view album contents"
  ON album_memories FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM memory_albums ma
      WHERE ma.id = album_memories.album_id
        AND (
          ma.visibility = 'public'
          OR auth.uid() = ma.creator_id
          OR auth.uid() IN (
            SELECT user_id FROM memory_collaborators
            WHERE album_id = ma.id
          )
          OR EXISTS (
            SELECT 1 FROM party_attendees pa
            WHERE pa.party_id = ma.party_id AND pa.user_id = auth.uid()
          )
        )
    )
  );

DROP POLICY IF EXISTS "Collaborators can add memories" ON album_memories;
CREATE POLICY "Collaborators can add memories"
  ON album_memories FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM memory_albums ma
      WHERE ma.id = album_memories.album_id
        AND (
          auth.uid() = ma.creator_id
          OR (
            ma.allow_collaborators = true
            AND auth.uid() IN (
              SELECT user_id FROM memory_collaborators mc
              WHERE mc.album_id = ma.id AND mc.can_add_memories = true
            )
          )
        )
    )
  );

DROP POLICY IF EXISTS "Collaborators can remove memories" ON album_memories;
CREATE POLICY "Collaborators can remove memories"
  ON album_memories FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM memory_albums ma
      WHERE ma.id = album_memories.album_id
        AND (
          auth.uid() = ma.creator_id
          OR auth.uid() IN (
            SELECT user_id FROM memory_collaborators mc
            WHERE mc.album_id = ma.id AND mc.can_remove_memories = true
          )
        )
    )
  );

-- ============================================
-- ROW LEVEL SECURITY: memory_collaborators
-- ============================================

ALTER TABLE memory_collaborators ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view album collaborators" ON memory_collaborators;
CREATE POLICY "Users can view album collaborators"
  ON memory_collaborators FOR SELECT
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM memory_albums ma
      WHERE ma.id = memory_collaborators.album_id
        AND auth.uid() = ma.creator_id
    )
  );

DROP POLICY IF EXISTS "Album creators can manage collaborators" ON memory_collaborators;
CREATE POLICY "Album creators can manage collaborators"
  ON memory_collaborators FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM memory_albums ma
      WHERE ma.id = memory_collaborators.album_id
        AND auth.uid() = ma.creator_id
    )
  );

-- ============================================
-- ROW LEVEL SECURITY: highlight_reels
-- ============================================

ALTER TABLE highlight_reels ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Party attendees can view reels" ON highlight_reels;
CREATE POLICY "Party attendees can view reels"
  ON highlight_reels FOR SELECT
  USING (
    status = 'ready'
    AND EXISTS (
      SELECT 1 FROM parties p
      WHERE p.id = highlight_reels.party_id
        AND (
          p.is_private = false
          OR auth.uid() = p.host_id
          OR EXISTS (
            SELECT 1 FROM party_attendees pa
            WHERE pa.party_id = p.id AND pa.user_id = auth.uid()
          )
        )
    )
  );

DROP POLICY IF EXISTS "Users can create reels" ON highlight_reels;
CREATE POLICY "Users can create reels"
  ON highlight_reels FOR INSERT
  WITH CHECK (
    auth.uid() = creator_id
    AND EXISTS (
      SELECT 1 FROM party_attendees pa
      WHERE pa.party_id = highlight_reels.party_id
        AND pa.user_id = auth.uid()
    )
  );

-- ============================================
-- ROW LEVEL SECURITY: party_safety_reports
-- ============================================

ALTER TABLE party_safety_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own reports" ON party_safety_reports;
CREATE POLICY "Users can view own reports"
  ON party_safety_reports FOR SELECT
  USING (auth.uid() = reporter_id);

DROP POLICY IF EXISTS "Party hosts can view reports" ON party_safety_reports;
CREATE POLICY "Party hosts can view reports"
  ON party_safety_reports FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM parties p
      WHERE p.id = party_safety_reports.party_id
        AND auth.uid() = p.host_id
    )
  );

DROP POLICY IF EXISTS "Users can submit safety reports" ON party_safety_reports;
CREATE POLICY "Users can submit safety reports"
  ON party_safety_reports FOR INSERT
  WITH CHECK (
    auth.uid() = reporter_id OR is_anonymous = true
  );

DROP POLICY IF EXISTS "Party hosts can update reports" ON party_safety_reports;
CREATE POLICY "Party hosts can update reports"
  ON party_safety_reports FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM parties p
      WHERE p.id = party_safety_reports.party_id
        AND auth.uid() = p.host_id
    )
  );

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Trigger: Update memory_albums updated_at
DROP TRIGGER IF EXISTS trigger_memory_albums_updated_at ON memory_albums;
CREATE TRIGGER trigger_memory_albums_updated_at
  BEFORE UPDATE ON memory_albums
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger: Update party_safety_reports updated_at
DROP TRIGGER IF EXISTS trigger_safety_reports_updated_at ON party_safety_reports;
CREATE TRIGGER trigger_safety_reports_updated_at
  BEFORE UPDATE ON party_safety_reports
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function: Update memory reaction counts
CREATE OR REPLACE FUNCTION update_memory_reaction_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE party_memories
    SET reactions_count = reactions_count + 1
    WHERE id = NEW.memory_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE party_memories
    SET reactions_count = GREATEST(0, reactions_count - 1)
    WHERE id = OLD.memory_id;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_memory_reactions ON memory_reactions;
CREATE TRIGGER trigger_update_memory_reactions
  AFTER INSERT OR DELETE ON memory_reactions
  FOR EACH ROW EXECUTE FUNCTION update_memory_reaction_counts();

-- Function: Update album memory count
CREATE OR REPLACE FUNCTION update_album_memory_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE memory_albums
    SET memory_count = memory_count + 1,
        updated_at = NOW()
    WHERE id = NEW.album_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE memory_albums
    SET memory_count = GREATEST(0, memory_count - 1),
        updated_at = NOW()
    WHERE id = OLD.album_id;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_album_count ON album_memories;
CREATE TRIGGER trigger_update_album_count
  AFTER INSERT OR DELETE ON album_memories
  FOR EACH ROW EXECUTE FUNCTION update_album_memory_count();

-- Function: Update album collaborator count
CREATE OR REPLACE FUNCTION update_album_collaborator_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE memory_albums
    SET collaborator_count = collaborator_count + 1,
        updated_at = NOW()
    WHERE id = NEW.album_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE memory_albums
    SET collaborator_count = GREATEST(1, collaborator_count - 1),
        updated_at = NOW()
    WHERE id = OLD.album_id;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_collaborator_count ON memory_collaborators;
CREATE TRIGGER trigger_update_collaborator_count
  AFTER INSERT OR DELETE ON memory_collaborators
  FOR EACH ROW EXECUTE FUNCTION update_album_collaborator_count();

-- Function: Get party live energy summary
CREATE OR REPLACE FUNCTION get_party_live_energy(p_party_id UUID)
RETURNS TABLE (
  current_energy NUMERIC,
  peak_energy INTEGER,
  avg_energy NUMERIC,
  pulse_count BIGINT,
  last_updated TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    (
      SELECT energy_level
      FROM party_live_pulse
      WHERE party_id = p_party_id
      ORDER BY recorded_at DESC
      LIMIT 1
    )::NUMERIC as current_energy,
    MAX(energy_level) as peak_energy,
    AVG(energy_level)::NUMERIC(5,2) as avg_energy,
    COUNT(*) as pulse_count,
    MAX(recorded_at) as last_updated
  FROM party_live_pulse
  WHERE party_id = p_party_id
    AND recorded_at > NOW() - INTERVAL '3 hours';
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- REALTIME SUBSCRIPTIONS
-- ============================================

ALTER PUBLICATION supabase_realtime ADD TABLE party_live_pulse;
ALTER PUBLICATION supabase_realtime ADD TABLE memory_reactions;
ALTER PUBLICATION supabase_realtime ADD TABLE highlight_reels;

-- ============================================
-- MIGRATION COMPLETE
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '================================================';
  RAISE NOTICE 'Phase 4 Migration Completed Successfully!';
  RAISE NOTICE '================================================';
  RAISE NOTICE 'Tables created/enhanced:';
  RAISE NOTICE '  - party_live_pulse (NEW)';
  RAISE NOTICE '  - party_memories (ENHANCED)';
  RAISE NOTICE '  - memory_reactions (NEW)';
  RAISE NOTICE '  - memory_albums (NEW)';
  RAISE NOTICE '  - album_memories (NEW)';
  RAISE NOTICE '  - memory_collaborators (NEW)';
  RAISE NOTICE '  - highlight_reels (NEW)';
  RAISE NOTICE '  - party_safety_reports (NEW)';
  RAISE NOTICE '================================================';
  RAISE NOTICE 'RLS policies: Enabled and configured';
  RAISE NOTICE 'Indexes: Created for performance';
  RAISE NOTICE 'Triggers: Configured for denormalized counts';
  RAISE NOTICE 'Realtime: Enabled on key tables';
  RAISE NOTICE '================================================';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '  1. Configure storage buckets for media';
  RAISE NOTICE '  2. Set up CDN for party-memories (Cloudflare R2)';
  RAISE NOTICE '  3. Implement highlight reel generation service';
  RAISE NOTICE '  4. Test safety reporting workflow';
  RAISE NOTICE '  5. Monitor realtime pulse submissions';
  RAISE NOTICE '================================================';
END $$;
