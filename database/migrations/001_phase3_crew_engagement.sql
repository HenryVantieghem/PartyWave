-- ============================================
-- PHASE 3: Crew Engagement Tables
-- ============================================

-- 1. CREW ACTIVITY FEED TABLE
CREATE TABLE IF NOT EXISTS crew_activity_feed (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  crew_id UUID NOT NULL REFERENCES party_crews(id) ON DELETE CASCADE,
  actor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  activity_type TEXT NOT NULL CHECK (activity_type IN (
    'member_joined',
    'member_left',
    'member_invited',
    'member_mentioned',
    'party_created',
    'party_happening',
    'comment_added',
    'vouch_given',
    'poll_created',
    'milestone_reached'
  )),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  visibility TEXT CHECK (visibility IN ('crew_only', 'public')) DEFAULT 'crew_only'
);

COMMENT ON TABLE crew_activity_feed IS 'Real-time activity log for crew engagement, shows what members are doing';
COMMENT ON COLUMN crew_activity_feed.metadata IS 'Flexible data: {target_user_id, comment_text, party_name, milestone_level, etc}';

-- 2. QUICK PLANS TABLE (Polling/Voting)
CREATE TABLE IF NOT EXISTS quick_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  crew_id UUID NOT NULL REFERENCES party_crews(id) ON DELETE CASCADE,
  creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  question TEXT NOT NULL,
  options JSONB NOT NULL DEFAULT '[]', -- [{id: uuid, text: string, emoji: string}, ...]
  responses JSONB DEFAULT '{}', -- {user_id: option_id, user_id: option_id, ...}
  deadline TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT CHECK (status IN ('open', 'closed', 'results')) DEFAULT 'open',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE quick_plans IS 'Quick polls for crew decision-making: "Where should we go?", "What time?", etc';
COMMENT ON COLUMN quick_plans.options IS 'Array of poll options with emoji for visual appeal';
COMMENT ON COLUMN quick_plans.responses IS 'Map of user_id -> option_id for tracking responses';

-- 3. CREW NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS crew_notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  crew_id UUID NOT NULL REFERENCES party_crews(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL CHECK (notification_type IN (
    'member_joined',
    'member_left',
    'member_invited',
    'mentioned',
    'poll_created',
    'poll_closed',
    'party_happening',
    'milestone'
  )),
  metadata JSONB DEFAULT '{}', -- {actor_name, action, target_crew, etc}
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE crew_notifications IS 'User notifications - one per user per event. Read timestamp tracks seen notifications.';
COMMENT ON COLUMN crew_notifications.read_at IS 'NULL = unread, timestamp = when user read it';

-- 4. CREW VOUCHES V2 TABLE (Enhanced)
CREATE TABLE IF NOT EXISTS crew_vouches_v2 (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  voucher_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vouched_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  crew_id UUID NOT NULL REFERENCES party_crews(id) ON DELETE CASCADE,
  reason TEXT, -- Why are you vouching for this person?
  strength INTEGER CHECK (strength >= 1 AND strength <= 5) DEFAULT 3, -- 1=weak, 5=strong
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(voucher_id, vouched_user_id, crew_id) -- One vouch per pair per crew
);

COMMENT ON TABLE crew_vouches_v2 IS 'Trust/safety system: users can vouch for friends (trustworthiness signal)';

-- 5. CREW DISCOVERY SCORES TABLE
CREATE TABLE IF NOT EXISTS crew_discovery_scores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  crew_id UUID NOT NULL REFERENCES party_crews(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  affinity_score NUMERIC(5, 2) CHECK (affinity_score >= 0 AND affinity_score <= 100),
  factors JSONB DEFAULT '{}', -- {shared_interests: 0.3, friend_of_friend: 0.5, ...}
  calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(crew_id, user_id)
);

COMMENT ON TABLE crew_discovery_scores IS 'Pre-calculated affinity between crews and users for discovery algorithm';

-- Enable Row Level Security
ALTER TABLE crew_activity_feed ENABLE ROW LEVEL SECURITY;
ALTER TABLE quick_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE crew_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE crew_vouches_v2 ENABLE ROW LEVEL SECURITY;
ALTER TABLE crew_discovery_scores ENABLE ROW LEVEL SECURITY;

