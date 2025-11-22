-- ============================================
-- THE HANGOUT - CREW SYSTEM DATABASE MIGRATION
-- ============================================
-- Created: 2025-11-21
-- Purpose: Add crew system tables with RLS policies
-- Dependencies: Requires existing auth.users and users table
-- ============================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABLE: party_crews
-- Purpose: Main crew/group table
-- ============================================

CREATE TABLE IF NOT EXISTS party_crews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL CHECK (char_length(name) >= 2 AND char_length(name) <= 50),
  description TEXT CHECK (description IS NULL OR char_length(description) <= 200),
  avatar_url TEXT,
  crew_type TEXT NOT NULL CHECK (crew_type IN ('inner', 'extended', 'open')) DEFAULT 'extended',
  privacy_setting TEXT NOT NULL CHECK (privacy_setting IN ('private', 'closed', 'public')) DEFAULT 'private',
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  member_count INTEGER DEFAULT 1 CHECK (member_count >= 0),
  reputation_score INTEGER DEFAULT 0 CHECK (reputation_score >= 0),
  theme_color TEXT DEFAULT '#8B5CF6' CHECK (theme_color ~ '^#[0-9A-Fa-f]{6}$'),
  active_status BOOLEAN DEFAULT true
);

-- ============================================
-- TABLE: crew_members
-- Purpose: Crew membership and roles
-- ============================================

CREATE TABLE IF NOT EXISTS crew_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  crew_id UUID NOT NULL REFERENCES party_crews(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'member')) DEFAULT 'member',
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  invitation_status TEXT NOT NULL CHECK (invitation_status IN ('pending', 'accepted', 'declined')) DEFAULT 'accepted',
  invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  notification_preferences JSONB DEFAULT '{"all": true, "mentions": true, "parties": true}'::jsonb,
  is_active BOOLEAN DEFAULT true,
  UNIQUE(crew_id, user_id)
);

-- ============================================
-- TABLE: crew_invites
-- Purpose: Crew invitation management
-- ============================================

CREATE TABLE IF NOT EXISTS crew_invites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  crew_id UUID NOT NULL REFERENCES party_crews(id) ON DELETE CASCADE,
  inviter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invitee_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('pending', 'accepted', 'declined')) DEFAULT 'pending',
  message TEXT CHECK (message IS NULL OR char_length(message) <= 500),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days'),
  UNIQUE(crew_id, invitee_id, inviter_id)
);

-- ============================================
-- TABLE: crew_activity
-- Purpose: Crew activity feed
-- ============================================

CREATE TABLE IF NOT EXISTS crew_activity (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  crew_id UUID NOT NULL REFERENCES party_crews(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL,
  actor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  visibility TEXT NOT NULL CHECK (visibility IN ('crew_only', 'public')) DEFAULT 'crew_only'
);

-- ============================================
-- TABLE: crew_vouches
-- Purpose: Trust network through crew vouching
-- ============================================

CREATE TABLE IF NOT EXISTS crew_vouches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  voucher_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vouched_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  crew_id UUID REFERENCES party_crews(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(voucher_id, vouched_user_id)
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

-- Crew members indexes
CREATE INDEX IF NOT EXISTS idx_crew_members_user_id ON crew_members(user_id) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_crew_members_crew_id ON crew_members(crew_id) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_crew_members_role ON crew_members(crew_id, role) WHERE is_active = true;

-- Crew activity indexes
CREATE INDEX IF NOT EXISTS idx_crew_activity_crew_created ON crew_activity(crew_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_crew_activity_actor ON crew_activity(actor_id, created_at DESC);

-- Crew invites indexes
CREATE INDEX IF NOT EXISTS idx_crew_invites_invitee_status ON crew_invites(invitee_id, status) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_crew_invites_crew ON crew_invites(crew_id, status);
CREATE INDEX IF NOT EXISTS idx_crew_invites_expires ON crew_invites(expires_at) WHERE status = 'pending';

-- Crew vouches indexes
CREATE INDEX IF NOT EXISTS idx_crew_vouches_vouched_user ON crew_vouches(vouched_user_id);
CREATE INDEX IF NOT EXISTS idx_crew_vouches_crew ON crew_vouches(crew_id);

-- Party crews indexes
CREATE INDEX IF NOT EXISTS idx_party_crews_created_by ON party_crews(created_by) WHERE active_status = true;
CREATE INDEX IF NOT EXISTS idx_party_crews_privacy ON party_crews(privacy_setting) WHERE active_status = true;
CREATE INDEX IF NOT EXISTS idx_party_crews_created_at ON party_crews(created_at DESC) WHERE active_status = true;

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE party_crews ENABLE ROW LEVEL SECURITY;
ALTER TABLE crew_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE crew_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE crew_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE crew_vouches ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PARTY_CREWS POLICIES
-- ============================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public crews are viewable by everyone" ON party_crews;
DROP POLICY IF EXISTS "Crew members can view their crews" ON party_crews;
DROP POLICY IF EXISTS "Users can create crews" ON party_crews;
DROP POLICY IF EXISTS "Crew owners and admins can update crews" ON party_crews;
DROP POLICY IF EXISTS "Crew owners can delete crews" ON party_crews;

-- Anyone can view public crews
CREATE POLICY "Public crews are viewable by everyone"
  ON party_crews FOR SELECT
  USING (
    (privacy_setting = 'public' OR privacy_setting = 'closed')
    AND active_status = true
  );

-- Crew members can view their crews (including private)
CREATE POLICY "Crew members can view their crews"
  ON party_crews FOR SELECT
  USING (
    auth.uid() IN (
      SELECT user_id FROM crew_members
      WHERE crew_id = party_crews.id AND is_active = true
    )
  );

-- Authenticated users can create crews
CREATE POLICY "Users can create crews"
  ON party_crews FOR INSERT
  WITH CHECK (auth.uid() = created_by);

-- Crew owners and admins can update their crews
CREATE POLICY "Crew owners and admins can update crews"
  ON party_crews FOR UPDATE
  USING (
    auth.uid() IN (
      SELECT user_id FROM crew_members
      WHERE crew_id = party_crews.id
        AND role IN ('owner', 'admin')
        AND is_active = true
    )
  );

-- Crew owners can delete (soft delete via active_status)
CREATE POLICY "Crew owners can delete crews"
  ON party_crews FOR UPDATE
  USING (
    auth.uid() IN (
      SELECT user_id FROM crew_members
      WHERE crew_id = party_crews.id
        AND role = 'owner'
        AND is_active = true
    )
  );

-- ============================================
-- CREW_MEMBERS POLICIES
-- ============================================

DROP POLICY IF EXISTS "Crew members can view their crew members" ON crew_members;
DROP POLICY IF EXISTS "Crew admins can add members" ON crew_members;
DROP POLICY IF EXISTS "Crew admins can update members" ON crew_members;
DROP POLICY IF EXISTS "Users can leave crews" ON crew_members;

-- Crew members can view their crew's members
CREATE POLICY "Crew members can view their crew members"
  ON crew_members FOR SELECT
  USING (
    -- User is a member of the crew
    auth.uid() IN (
      SELECT user_id FROM crew_members cm
      WHERE cm.crew_id = crew_members.crew_id AND cm.is_active = true
    )
    OR
    -- Or the crew is public/closed
    crew_id IN (
      SELECT id FROM party_crews
      WHERE privacy_setting IN ('public', 'closed') AND active_status = true
    )
  );

-- Crew admins/owners can add members
CREATE POLICY "Crew admins can add members"
  ON crew_members FOR INSERT
  WITH CHECK (
    auth.uid() IN (
      SELECT user_id FROM crew_members
      WHERE crew_id = crew_members.crew_id
        AND role IN ('owner', 'admin')
        AND is_active = true
    )
    OR
    -- Or user is adding themselves (via invite acceptance)
    auth.uid() = user_id
  );

-- Crew admins can update member roles and status
CREATE POLICY "Crew admins can update members"
  ON crew_members FOR UPDATE
  USING (
    auth.uid() IN (
      SELECT user_id FROM crew_members cm
      WHERE cm.crew_id = crew_members.crew_id
        AND cm.role IN ('owner', 'admin')
        AND cm.is_active = true
    )
    OR
    -- Users can update their own notification preferences
    (auth.uid() = user_id AND is_active = true)
  );

-- Users can leave crews (soft delete)
CREATE POLICY "Users can leave crews"
  ON crew_members FOR UPDATE
  USING (auth.uid() = user_id);

-- ============================================
-- CREW_INVITES POLICIES
-- ============================================

DROP POLICY IF EXISTS "Users can view invites involving them" ON crew_invites;
DROP POLICY IF EXISTS "Crew members can invite others" ON crew_invites;
DROP POLICY IF EXISTS "Invitees can respond to invites" ON crew_invites;

-- Users can view their own invites (sent or received)
CREATE POLICY "Users can view invites involving them"
  ON crew_invites FOR SELECT
  USING (
    auth.uid() = invitee_id
    OR auth.uid() = inviter_id
    OR auth.uid() IN (
      SELECT user_id FROM crew_members
      WHERE crew_id = crew_invites.crew_id
        AND role IN ('owner', 'admin')
        AND is_active = true
    )
  );

-- Crew members can invite others
CREATE POLICY "Crew members can invite others"
  ON crew_invites FOR INSERT
  WITH CHECK (
    auth.uid() IN (
      SELECT user_id FROM crew_members
      WHERE crew_id = crew_invites.crew_id AND is_active = true
    )
    AND auth.uid() = inviter_id
  );

-- Invitees can respond to invites
CREATE POLICY "Invitees can respond to invites"
  ON crew_invites FOR UPDATE
  USING (auth.uid() = invitee_id);

-- ============================================
-- CREW_ACTIVITY POLICIES
-- ============================================

DROP POLICY IF EXISTS "Crew members can view crew activity" ON crew_activity;
DROP POLICY IF EXISTS "Crew members can create activity" ON crew_activity;
DROP POLICY IF EXISTS "Public activity is viewable" ON crew_activity;

-- Crew members can view crew-only activity
CREATE POLICY "Crew members can view crew activity"
  ON crew_activity FOR SELECT
  USING (
    auth.uid() IN (
      SELECT user_id FROM crew_members
      WHERE crew_id = crew_activity.crew_id AND is_active = true
    )
  );

-- Public activity is viewable by all
CREATE POLICY "Public activity is viewable"
  ON crew_activity FOR SELECT
  USING (visibility = 'public');

-- Crew members can create activity
CREATE POLICY "Crew members can create activity"
  ON crew_activity FOR INSERT
  WITH CHECK (
    auth.uid() = actor_id
    AND auth.uid() IN (
      SELECT user_id FROM crew_members
      WHERE crew_id = crew_activity.crew_id AND is_active = true
    )
  );

-- ============================================
-- CREW_VOUCHES POLICIES
-- ============================================

DROP POLICY IF EXISTS "Anyone can view vouches" ON crew_vouches;
DROP POLICY IF EXISTS "Users can vouch for others" ON crew_vouches;

-- Anyone can view vouches (public trust network)
CREATE POLICY "Anyone can view vouches"
  ON crew_vouches FOR SELECT
  USING (true);

-- Users can vouch for others
CREATE POLICY "Users can vouch for others"
  ON crew_vouches FOR INSERT
  WITH CHECK (auth.uid() = voucher_id);

-- ============================================
-- FUNCTIONS AND TRIGGERS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for party_crews updated_at
DROP TRIGGER IF EXISTS update_party_crews_updated_at ON party_crews;
CREATE TRIGGER update_party_crews_updated_at
  BEFORE UPDATE ON party_crews
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to update member count
CREATE OR REPLACE FUNCTION update_crew_member_count()
RETURNS TRIGGER AS $$
BEGIN
  -- Update count when member is added
  IF TG_OP = 'INSERT' AND NEW.is_active = true AND NEW.invitation_status = 'accepted' THEN
    UPDATE party_crews
    SET member_count = member_count + 1
    WHERE id = NEW.crew_id;
  END IF;

  -- Update count when member becomes inactive
  IF TG_OP = 'UPDATE' AND OLD.is_active = true AND NEW.is_active = false THEN
    UPDATE party_crews
    SET member_count = GREATEST(0, member_count - 1)
    WHERE id = NEW.crew_id;
  END IF;

  -- Update count when member is deleted
  IF TG_OP = 'DELETE' AND OLD.is_active = true THEN
    UPDATE party_crews
    SET member_count = GREATEST(0, member_count - 1)
    WHERE id = OLD.crew_id;
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for crew member count
DROP TRIGGER IF EXISTS update_crew_member_count_trigger ON crew_members;
CREATE TRIGGER update_crew_member_count_trigger
  AFTER INSERT OR UPDATE OR DELETE ON crew_members
  FOR EACH ROW
  EXECUTE FUNCTION update_crew_member_count();

-- Function to auto-expire old invites
CREATE OR REPLACE FUNCTION expire_old_invites()
RETURNS void AS $$
BEGIN
  UPDATE crew_invites
  SET status = 'declined'
  WHERE status = 'pending'
    AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- VALIDATION QUERIES
-- ============================================

-- Test crew creation and membership (run after inserting test data)
-- SELECT
--   pc.name,
--   pc.crew_type,
--   pc.member_count,
--   COUNT(cm.id) as actual_members
-- FROM party_crews pc
-- LEFT JOIN crew_members cm ON pc.id = cm.crew_id AND cm.is_active = true
-- GROUP BY pc.id
-- ORDER BY pc.created_at DESC;

-- ============================================
-- MIGRATION COMPLETE
-- ============================================

-- Log migration completion
DO $$
BEGIN
  RAISE NOTICE 'Crew system migration completed successfully!';
  RAISE NOTICE 'Tables created: party_crews, crew_members, crew_invites, crew_activity, crew_vouches';
  RAISE NOTICE 'RLS policies enabled and configured';
  RAISE NOTICE 'Indexes created for performance';
  RAISE NOTICE 'Triggers configured for auto-updates';
END $$;
