-- =============================================
-- PUSH NOTIFICATIONS SYSTEM
-- =============================================

-- Push Tokens Table
CREATE TABLE IF NOT EXISTS push_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('ios', 'android', 'web')),
  device_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, platform)
);

-- Notification Queue Table
CREATE TABLE IF NOT EXISTS notification_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('party_invite', 'crew_invite', 'vouch', 'message', 'party_start', 'energy_spike')),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  data JSONB,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  scheduled_for TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Notification Preferences Table
CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  push_enabled BOOLEAN NOT NULL DEFAULT true,
  party_invites BOOLEAN NOT NULL DEFAULT true,
  crew_invites BOOLEAN NOT NULL DEFAULT true,
  vouches BOOLEAN NOT NULL DEFAULT true,
  messages BOOLEAN NOT NULL DEFAULT true,
  party_reminders BOOLEAN NOT NULL DEFAULT true,
  energy_alerts BOOLEAN NOT NULL DEFAULT true,
  quiet_hours_start TIME,
  quiet_hours_end TIME,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Indexes
CREATE INDEX idx_push_tokens_user_id ON push_tokens(user_id);
CREATE INDEX idx_push_tokens_platform ON push_tokens(platform);
CREATE INDEX idx_notification_queue_user_id ON notification_queue(user_id);
CREATE INDEX idx_notification_queue_status ON notification_queue(status);
CREATE INDEX idx_notification_queue_scheduled ON notification_queue(scheduled_for);
CREATE INDEX idx_notification_preferences_user_id ON notification_preferences(user_id);

-- RLS Policies
ALTER TABLE push_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

-- Push Tokens Policies
CREATE POLICY "Users can view their own push tokens"
  ON push_tokens FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own push tokens"
  ON push_tokens FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own push tokens"
  ON push_tokens FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own push tokens"
  ON push_tokens FOR DELETE
  USING (auth.uid() = user_id);

-- Notification Queue Policies
CREATE POLICY "Users can view their own notifications"
  ON notification_queue FOR SELECT
  USING (auth.uid() = user_id);

-- Notification Preferences Policies
CREATE POLICY "Users can view their own preferences"
  ON notification_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own preferences"
  ON notification_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences"
  ON notification_preferences FOR UPDATE
  USING (auth.uid() = user_id);

-- =============================================
-- FUNCTIONS
-- =============================================

-- Function to check if user should receive notification
CREATE OR REPLACE FUNCTION should_send_notification(
  user_id_param UUID,
  notification_type TEXT
) RETURNS BOOLEAN AS $$
DECLARE
  prefs RECORD;
  current_time TIME;
BEGIN
  -- Get user preferences
  SELECT * INTO prefs
  FROM notification_preferences
  WHERE user_id = user_id_param;

  -- If no preferences, default to true
  IF NOT FOUND THEN
    RETURN true;
  END IF;

  -- Check if push notifications are enabled
  IF NOT prefs.push_enabled THEN
    RETURN false;
  END IF;

  -- Check quiet hours
  IF prefs.quiet_hours_start IS NOT NULL AND prefs.quiet_hours_end IS NOT NULL THEN
    current_time := CURRENT_TIME;

    -- Handle overnight quiet hours (e.g., 10 PM to 8 AM)
    IF prefs.quiet_hours_start > prefs.quiet_hours_end THEN
      IF current_time >= prefs.quiet_hours_start OR current_time <= prefs.quiet_hours_end THEN
        RETURN false;
      END IF;
    ELSE
      -- Regular quiet hours (e.g., 8 AM to 10 AM)
      IF current_time >= prefs.quiet_hours_start AND current_time <= prefs.quiet_hours_end THEN
        RETURN false;
      END IF;
    END IF;
  END IF;

  -- Check specific notification type preference
  CASE notification_type
    WHEN 'party_invite' THEN
      RETURN prefs.party_invites;
    WHEN 'crew_invite' THEN
      RETURN prefs.crew_invites;
    WHEN 'vouch' THEN
      RETURN prefs.vouches;
    WHEN 'message' THEN
      RETURN prefs.messages;
    WHEN 'party_start' THEN
      RETURN prefs.party_reminders;
    WHEN 'energy_spike' THEN
      RETURN prefs.energy_alerts;
    ELSE
      RETURN true;
  END CASE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to queue notification
CREATE OR REPLACE FUNCTION queue_notification(
  user_id_param UUID,
  type_param TEXT,
  title_param TEXT,
  body_param TEXT,
  data_param JSONB DEFAULT NULL,
  scheduled_for_param TIMESTAMPTZ DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  notification_id UUID;
BEGIN
  -- Check if user should receive this notification
  IF NOT should_send_notification(user_id_param, type_param) THEN
    RETURN NULL;
  END IF;

  -- Insert notification into queue
  INSERT INTO notification_queue (
    user_id,
    type,
    title,
    body,
    data,
    scheduled_for
  ) VALUES (
    user_id_param,
    type_param,
    title_param,
    body_param,
    data_param,
    COALESCE(scheduled_for_param, NOW())
  )
  RETURNING id INTO notification_id;

  RETURN notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- TRIGGERS
-- =============================================

-- Auto-create notification preferences for new users
CREATE OR REPLACE FUNCTION create_notification_preferences()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notification_preferences (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_profile_created_create_notification_preferences
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION create_notification_preferences();

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_notification_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_push_tokens_updated_at
  BEFORE UPDATE ON push_tokens
  FOR EACH ROW
  EXECUTE FUNCTION update_notification_updated_at();

CREATE TRIGGER update_notification_preferences_updated_at
  BEFORE UPDATE ON notification_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_notification_updated_at();

-- =============================================
-- SAMPLE DATA (for testing)
-- =============================================

-- Insert default preferences for existing users
INSERT INTO notification_preferences (user_id)
SELECT id FROM profiles
WHERE id NOT IN (SELECT user_id FROM notification_preferences)
ON CONFLICT (user_id) DO NOTHING;
