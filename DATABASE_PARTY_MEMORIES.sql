-- ============================================
-- PARTY MEMORIES SYSTEM
-- ============================================
-- Photo albums, highlights, and memory management
-- ============================================

-- Table for party photos/memories
CREATE TABLE IF NOT EXISTS party_memories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  party_id UUID NOT NULL REFERENCES parties(id) ON DELETE CASCADE,
  uploaded_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  thumbnail_url TEXT,
  caption TEXT,
  location_lat NUMERIC(10, 8),
  location_lon NUMERIC(11, 8),
  taken_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_highlight BOOLEAN DEFAULT false,
  highlight_score NUMERIC(5,2) DEFAULT 0,
  tags TEXT[] DEFAULT '{}',
  visibility VARCHAR(20) DEFAULT 'attendees', -- public, attendees, crew, private
  likes_count INT DEFAULT 0,
  comments_count INT DEFAULT 0
);

-- Table for memory likes
CREATE TABLE IF NOT EXISTS party_memory_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  memory_id UUID NOT NULL REFERENCES party_memories(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(memory_id, user_id)
);

-- Table for memory comments
CREATE TABLE IF NOT EXISTS party_memory_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  memory_id UUID NOT NULL REFERENCES party_memories(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  comment_text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table for collaborative albums
CREATE TABLE IF NOT EXISTS party_albums (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  party_id UUID NOT NULL REFERENCES parties(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  cover_photo_id UUID REFERENCES party_memories(id) ON DELETE SET NULL,
  is_collaborative BOOLEAN DEFAULT true,
  memory_count INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Junction table for album memories
CREATE TABLE IF NOT EXISTS album_memories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  album_id UUID NOT NULL REFERENCES party_albums(id) ON DELETE CASCADE,
  memory_id UUID NOT NULL REFERENCES party_memories(id) ON DELETE CASCADE,
  added_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  display_order INT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(album_id, memory_id)
);

-- Function to calculate highlight score
CREATE OR REPLACE FUNCTION calculate_highlight_score(memory_id_param UUID)
RETURNS NUMERIC AS $$
DECLARE
  score NUMERIC := 0;
  likes INT;
  comments INT;
  recency_days NUMERIC;
BEGIN
  SELECT likes_count, comments_count, EXTRACT(EPOCH FROM (NOW() - created_at)) / 86400
  INTO likes, comments, recency_days
  FROM party_memories
  WHERE id = memory_id_param;

  -- Base score from engagement
  score := score + (likes * 5);
  score := score + (comments * 10);

  -- Recency boost (fresher photos get higher scores)
  IF recency_days < 1 THEN
    score := score * 1.5;
  ELSIF recency_days < 7 THEN
    score := score * 1.2;
  END IF;

  RETURN LEAST(score, 100);
END;
$$ LANGUAGE plpgsql;

-- Function to auto-generate highlights
CREATE OR REPLACE FUNCTION generate_party_highlights(party_id_param UUID, limit_count INT DEFAULT 10)
RETURNS SETOF party_memories AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM party_memories
  WHERE party_id = party_id_param
  ORDER BY calculate_highlight_score(id) DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update memory counts
CREATE OR REPLACE FUNCTION update_memory_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE party_memories
    SET likes_count = likes_count + 1
    WHERE id = NEW.memory_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE party_memories
    SET likes_count = likes_count - 1
    WHERE id = OLD.memory_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_likes_count ON party_memory_likes;
CREATE TRIGGER update_likes_count
  AFTER INSERT OR DELETE ON party_memory_likes
  FOR EACH ROW
  EXECUTE FUNCTION update_memory_counts();

-- Indexes
CREATE INDEX idx_memories_party ON party_memories(party_id, created_at DESC);
CREATE INDEX idx_memories_highlights ON party_memories(party_id, is_highlight, highlight_score DESC);
CREATE INDEX idx_albums_party ON party_albums(party_id);

-- RLS Policies
ALTER TABLE party_memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE party_memory_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE party_memory_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Party attendees can view memories"
  ON party_memories FOR SELECT
  USING (
    party_id IN (
      SELECT party_id FROM party_attendees WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Party attendees can upload memories"
  ON party_memories FOR INSERT
  WITH CHECK (
    auth.uid() = uploaded_by AND
    party_id IN (
      SELECT party_id FROM party_attendees WHERE user_id = auth.uid()
    )
  );
