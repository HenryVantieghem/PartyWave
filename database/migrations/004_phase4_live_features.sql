-- ============================================
-- PHASE 4: Live Party Features Tables
-- ============================================

-- 1. PARTY LIVE PULSE TABLE
CREATE TABLE IF NOT EXISTS party_live_pulse (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  party_id UUID NOT NULL REFERENCES parties(id) ON DELETE CASCADE,
  recorded_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  energy_level INTEGER CHECK (energy_level >= 0 AND energy_level <= 100) NOT NULL,
  attendee_count INTEGER CHECK (attendee_count >= 0),
  vibe_tags TEXT[] DEFAULT '{}',
  music_playing BOOLEAN DEFAULT false,
  peak_moment BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE party_live_pulse IS 'Real-time energy tracking during live parties - crowd-sourced pulse data';
COMMENT ON COLUMN party_live_pulse.energy_level IS '0-100 scale: 0=dead, 50=chill, 100=insane';

-- 2. PARTY MEMORIES TABLE (Enhanced)
-- Note: party_memories already exists, so we'll add new columns
ALTER TABLE party_memories 
  ADD COLUMN IF NOT EXISTS is_highlight BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS location_name TEXT,
  ADD COLUMN IF NOT EXISTS timestamp_at_party TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Update media_type constraint to include 'gif'
ALTER TABLE party_memories 
  DROP CONSTRAINT IF EXISTS party_memories_media_type_check;
ALTER TABLE party_memories 
  ADD CONSTRAINT party_memories_media_type_check 
  CHECK (media_type IN ('photo', 'video', 'gif'));

COMMENT ON TABLE party_memories IS 'Photos/videos captured during parties - can be stories or highlights';
COMMENT ON COLUMN party_memories.is_story IS 'Stories expire after 24h, highlights are permanent';
COMMENT ON COLUMN party_memories.is_highlight IS 'Highlights are permanent, stories expire';

-- 3. MEMORY COLLABORATORS TABLE
CREATE TABLE IF NOT EXISTS memory_collaborators (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  memory_id UUID NOT NULL REFERENCES party_memories(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT CHECK (role IN ('creator', 'tagged', 'contributor')) DEFAULT 'tagged',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(memory_id, user_id)
);

COMMENT ON TABLE memory_collaborators IS 'Track who is in/tagged in memories - for collaborative albums';

-- 4. HIGHLIGHT REELS TABLE
CREATE TABLE IF NOT EXISTS highlight_reels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  party_id UUID NOT NULL REFERENCES parties(id) ON DELETE CASCADE,
  creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  memory_ids UUID[] DEFAULT '{}', -- Array of memory IDs in order
  cover_image_url TEXT,
  duration_seconds INTEGER,
  view_count INTEGER DEFAULT 0,
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE highlight_reels IS 'Curated collections of party memories - auto-generated or manual';
COMMENT ON COLUMN highlight_reels.memory_ids IS 'Ordered array of memory IDs that make up the reel';

-- 5. PARTY SAFETY REPORTS TABLE
CREATE TABLE IF NOT EXISTS party_safety_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  party_id UUID NOT NULL REFERENCES parties(id) ON DELETE CASCADE,
  reporter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  report_type TEXT CHECK (report_type IN ('harassment', 'unsafe_environment', 'violence', 'drugs', 'underage', 'other')) NOT NULL,
  description TEXT NOT NULL,
  severity TEXT CHECK (severity IN ('low', 'medium', 'high', 'critical')) DEFAULT 'medium',
  status TEXT CHECK (status IN ('pending', 'reviewing', 'resolved', 'dismissed')) DEFAULT 'pending',
  admin_notes TEXT,
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE party_safety_reports IS 'Safety incident reporting system - anonymous reporting available';
COMMENT ON COLUMN party_safety_reports.severity IS 'Critical = immediate action needed, Low = minor issue';

-- Enable Row Level Security
ALTER TABLE party_live_pulse ENABLE ROW LEVEL SECURITY;
ALTER TABLE party_memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE memory_collaborators ENABLE ROW LEVEL SECURITY;
ALTER TABLE highlight_reels ENABLE ROW LEVEL SECURITY;
ALTER TABLE party_safety_reports ENABLE ROW LEVEL SECURITY;

-- Indexes for Phase 4 tables
CREATE INDEX IF NOT EXISTS idx_live_pulse_party ON party_live_pulse(party_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_live_pulse_recorded ON party_live_pulse(recorded_by, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_memories_party ON party_memories(party_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_memories_creator ON party_memories(creator_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_memories_highlight ON party_memories(party_id, is_highlight) WHERE is_highlight = true;

CREATE INDEX IF NOT EXISTS idx_collaborators_memory ON memory_collaborators(memory_id);
CREATE INDEX IF NOT EXISTS idx_collaborators_user ON memory_collaborators(user_id);

CREATE INDEX IF NOT EXISTS idx_reels_party ON highlight_reels(party_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reels_creator ON highlight_reels(creator_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reels_public ON highlight_reels(is_public, view_count DESC) WHERE is_public = true;

CREATE INDEX IF NOT EXISTS idx_safety_party ON party_safety_reports(party_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_safety_reporter ON party_safety_reports(reporter_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_safety_severity ON party_safety_reports(status, severity, created_at DESC) WHERE status = 'pending';

-- Updated_at triggers
DROP TRIGGER IF EXISTS trigger_update_memories_updated_at ON party_memories;
CREATE TRIGGER trigger_update_memories_updated_at
  BEFORE UPDATE ON party_memories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_update_reels_updated_at ON highlight_reels;
CREATE TRIGGER trigger_update_reels_updated_at
  BEFORE UPDATE ON highlight_reels
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_update_safety_updated_at ON party_safety_reports;
CREATE TRIGGER trigger_update_safety_updated_at
  BEFORE UPDATE ON party_safety_reports
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

