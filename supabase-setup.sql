-- The Hangout - Complete Supabase Database Setup
-- Run this SQL in your Supabase SQL Editor

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- ============================================================================
-- TABLES
-- ============================================================================

-- Profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  bio TEXT,
  avatar_url TEXT,
  party_score INTEGER DEFAULT 0,
  total_parties_hosted INTEGER DEFAULT 0,
  total_parties_attended INTEGER DEFAULT 0,
  party_streak INTEGER DEFAULT 0,
  location TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Parties table
CREATE TABLE IF NOT EXISTS parties (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  host_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  date_time TIMESTAMP WITH TIME ZONE NOT NULL,
  location TEXT NOT NULL,
  latitude DECIMAL,
  longitude DECIMAL,
  cover_image_url TEXT,
  max_attendees INTEGER,
  energy_score INTEGER DEFAULT 0,
  status TEXT DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'live', 'ended')),
  invite_code TEXT UNIQUE,
  is_private BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Party attendees
CREATE TABLE IF NOT EXISTS party_attendees (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  party_id UUID REFERENCES parties(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'invited' CHECK (status IN ('invited', 'confirmed', 'checked_in', 'no_show')),
  checked_in_at TIMESTAMP WITH TIME ZONE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(party_id, user_id)
);

-- Party requirements (things to bring)
CREATE TABLE IF NOT EXISTS party_requirements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  party_id UUID REFERENCES parties(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  quantity_needed INTEGER DEFAULT 1,
  quantity_claimed INTEGER DEFAULT 0,
  price_estimate INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Requirement claims
CREATE TABLE IF NOT EXISTS requirement_claims (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  requirement_id UUID REFERENCES party_requirements(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  quantity INTEGER DEFAULT 1,
  status TEXT DEFAULT 'claimed' CHECK (status IN ('claimed', 'fulfilled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Party memories (photos/videos)
CREATE TABLE IF NOT EXISTS party_memories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  party_id UUID REFERENCES parties(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  media_url TEXT NOT NULL,
  media_type TEXT NOT NULL CHECK (media_type IN ('photo', 'video')),
  caption TEXT,
  is_story BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Social connections
CREATE TABLE IF NOT EXISTS connections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  friend_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'blocked')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, friend_id),
  CHECK (user_id != friend_id)
);

-- Party chat messages
CREATE TABLE IF NOT EXISTS party_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  party_id UUID REFERENCES parties(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'system')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User achievements
CREATE TABLE IF NOT EXISTS user_achievements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  achievement_type TEXT NOT NULL,
  achievement_data JSONB,
  unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);
CREATE INDEX IF NOT EXISTS idx_parties_host_id ON parties(host_id);
CREATE INDEX IF NOT EXISTS idx_parties_date_time ON parties(date_time);
CREATE INDEX IF NOT EXISTS idx_parties_status ON parties(status);
CREATE INDEX IF NOT EXISTS idx_parties_invite_code ON parties(invite_code);
CREATE INDEX IF NOT EXISTS idx_party_attendees_party_id ON party_attendees(party_id);
CREATE INDEX IF NOT EXISTS idx_party_attendees_user_id ON party_attendees(user_id);
CREATE INDEX IF NOT EXISTS idx_party_messages_party_id ON party_messages(party_id);
CREATE INDEX IF NOT EXISTS idx_connections_user_id ON connections(user_id);
CREATE INDEX IF NOT EXISTS idx_connections_friend_id ON connections(friend_id);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE parties ENABLE ROW LEVEL SECURITY;
ALTER TABLE party_attendees ENABLE ROW LEVEL SECURITY;
ALTER TABLE party_requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE requirement_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE party_memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE party_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Public profiles are viewable by everyone" ON profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Parties policies
CREATE POLICY "Public parties are viewable by everyone" ON parties
  FOR SELECT USING (is_private = false OR auth.uid() = host_id);

CREATE POLICY "Private parties viewable by attendees" ON parties
  FOR SELECT USING (
    is_private = true AND (
      auth.uid() = host_id OR
      EXISTS (
        SELECT 1 FROM party_attendees
        WHERE party_id = parties.id AND user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can create parties" ON parties
  FOR INSERT WITH CHECK (auth.uid() = host_id);

CREATE POLICY "Hosts can update their parties" ON parties
  FOR UPDATE USING (auth.uid() = host_id);

CREATE POLICY "Hosts can delete their parties" ON parties
  FOR DELETE USING (auth.uid() = host_id);

-- Party attendees policies
CREATE POLICY "Attendees viewable by party members" ON party_attendees
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM parties
      WHERE id = party_attendees.party_id AND (
        auth.uid() = host_id OR
        EXISTS (
          SELECT 1 FROM party_attendees pa
          WHERE pa.party_id = parties.id AND pa.user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Users can join parties" ON party_attendees
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their attendance" ON party_attendees
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Hosts can manage attendees" ON party_attendees
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM parties
      WHERE id = party_attendees.party_id AND host_id = auth.uid()
    )
  );

-- Party requirements policies
CREATE POLICY "Requirements viewable by party members" ON party_requirements
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM parties
      WHERE id = party_requirements.party_id AND (
        auth.uid() = host_id OR
        EXISTS (
          SELECT 1 FROM party_attendees
          WHERE party_id = parties.id AND user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Hosts can manage requirements" ON party_requirements
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM parties
      WHERE id = party_requirements.party_id AND host_id = auth.uid()
    )
  );

-- Requirement claims policies
CREATE POLICY "Claims viewable by party members" ON requirement_claims
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM party_requirements pr
      JOIN parties p ON p.id = pr.party_id
      WHERE pr.id = requirement_claims.requirement_id AND (
        auth.uid() = p.host_id OR
        EXISTS (
          SELECT 1 FROM party_attendees
          WHERE party_id = p.id AND user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Users can claim requirements" ON requirement_claims
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their claims" ON requirement_claims
  FOR UPDATE USING (auth.uid() = user_id);

-- Party memories policies
CREATE POLICY "Memories viewable by party members" ON party_memories
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM parties
      WHERE id = party_memories.party_id AND (
        auth.uid() = host_id OR
        EXISTS (
          SELECT 1 FROM party_attendees
          WHERE party_id = parties.id AND user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Attendees can create memories" ON party_memories
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM party_attendees
      WHERE party_id = party_memories.party_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own memories" ON party_memories
  FOR DELETE USING (auth.uid() = user_id);

-- Connections policies
CREATE POLICY "Users can view their connections" ON connections
  FOR SELECT USING (auth.uid() = user_id OR auth.uid() = friend_id);

CREATE POLICY "Users can create connections" ON connections
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their connections" ON connections
  FOR UPDATE USING (auth.uid() = user_id OR auth.uid() = friend_id);

CREATE POLICY "Users can delete their connections" ON connections
  FOR DELETE USING (auth.uid() = user_id);

-- Party messages policies
CREATE POLICY "Messages viewable by party members" ON party_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM parties
      WHERE id = party_messages.party_id AND (
        auth.uid() = host_id OR
        EXISTS (
          SELECT 1 FROM party_attendees
          WHERE party_id = parties.id AND user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Party members can send messages" ON party_messages
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM party_attendees
      WHERE party_id = party_messages.party_id AND user_id = auth.uid()
    )
  );

-- User achievements policies
CREATE POLICY "Users can view their achievements" ON user_achievements
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert achievements" ON user_achievements
  FOR INSERT WITH CHECK (true);

-- ============================================================================
-- FUNCTIONS AND TRIGGERS
-- ============================================================================

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_parties_updated_at BEFORE UPDATE ON parties
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Generate unique invite code
CREATE OR REPLACE FUNCTION generate_invite_code()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..6 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Auto-generate invite code for new parties
CREATE OR REPLACE FUNCTION set_party_invite_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.invite_code IS NULL THEN
    NEW.invite_code := generate_invite_code();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_invite_code_trigger BEFORE INSERT ON parties
  FOR EACH ROW EXECUTE FUNCTION set_party_invite_code();

-- Update party energy score
CREATE OR REPLACE FUNCTION update_party_energy_score()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE parties
  SET energy_score = (
    SELECT COUNT(*) FROM party_attendees
    WHERE party_id = NEW.party_id AND status = 'checked_in'
  )
  WHERE id = NEW.party_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_energy_score_trigger AFTER INSERT OR UPDATE ON party_attendees
  FOR EACH ROW EXECUTE FUNCTION update_party_energy_score();

-- Update user party stats
CREATE OR REPLACE FUNCTION update_user_party_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Update attended count
  IF NEW.status = 'checked_in' AND (OLD IS NULL OR OLD.status != 'checked_in') THEN
    UPDATE profiles
    SET total_parties_attended = total_parties_attended + 1,
        party_score = party_score + 10
    WHERE id = NEW.user_id;
  END IF;

  -- Update hosted count
  IF TG_TABLE_NAME = 'parties' THEN
    UPDATE profiles
    SET total_parties_hosted = total_parties_hosted + 1,
        party_score = party_score + 20
    WHERE id = NEW.host_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_attended_stats_trigger AFTER INSERT OR UPDATE ON party_attendees
  FOR EACH ROW EXECUTE FUNCTION update_user_party_stats();

CREATE TRIGGER update_hosted_stats_trigger AFTER INSERT ON parties
  FOR EACH ROW EXECUTE FUNCTION update_user_party_stats();

-- ============================================================================
-- STORAGE BUCKETS
-- ============================================================================

-- Create storage buckets (run these in Supabase Dashboard > Storage)
-- 1. Create bucket: avatars (public)
-- 2. Create bucket: party-covers (public)
-- 3. Create bucket: party-memories (private)
-- 4. Create bucket: stories (private, auto-delete after 24h)

-- Storage policies will be set in the Supabase Dashboard

-- ============================================================================
-- REALTIME SUBSCRIPTIONS
-- ============================================================================

-- Enable realtime for party_messages
ALTER PUBLICATION supabase_realtime ADD TABLE party_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE party_attendees;
ALTER PUBLICATION supabase_realtime ADD TABLE parties;

-- ============================================================================
-- SAMPLE DATA (Optional - for testing)
-- ============================================================================

-- Insert sample achievements
INSERT INTO user_achievements (user_id, achievement_type, achievement_data)
SELECT
  id,
  'first_party',
  '{"title": "Party Starter", "description": "Hosted your first party!", "icon": "🎉"}'::jsonb
FROM profiles
WHERE total_parties_hosted = 1
ON CONFLICT DO NOTHING;
