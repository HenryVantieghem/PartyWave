// ============================================
// CREW TYPES
// ============================================
// Complete TypeScript types for crew system
// ============================================

export type CrewType = 'inner' | 'extended' | 'open';
export type CrewPrivacy = 'private' | 'closed' | 'public';
export type CrewRole = 'owner' | 'admin' | 'member';
export type InviteStatus = 'pending' | 'accepted' | 'declined';
export type ActivityType =
  | 'crew_created'
  | 'member_joined'
  | 'member_left'
  | 'member_invited'
  | 'member_removed'
  | 'member_promoted'
  | 'party_created'
  | 'party_joined'
  | 'party_attended'
  | 'photo_added'
  | 'achievement_unlocked';

// ============================================
// Main Crew Interface
// ============================================

export interface Crew {
  id: string;
  name: string;
  description: string | null;
  avatar_url: string | null;
  crew_type: CrewType;
  privacy_setting: CrewPrivacy;
  created_by: string;
  created_at: string;
  updated_at: string;
  member_count: number;
  reputation_score: number;
  theme_color: string;
  active_status: boolean;
}

// ============================================
// Crew Member Interface
// ============================================

export interface CrewMember {
  id: string;
  crew_id: string;
  user_id: string;
  role: CrewRole;
  joined_at: string;
  invitation_status: InviteStatus;
  invited_by: string | null;
  notification_preferences: {
    all: boolean;
    mentions: boolean;
    parties: boolean;
  };
  is_active: boolean;
  // Joined user data from Supabase query
  user?: {
    id: string;
    username: string;
    avatar_url: string | null;
    full_name?: string | null;
  };
}

// ============================================
// Crew Invite Interface
// ============================================

export interface CrewInvite {
  id: string;
  crew_id: string;
  inviter_id: string;
  invitee_id: string;
  status: InviteStatus;
  message: string | null;
  created_at: string;
  expires_at: string | null;
  // Joined data from Supabase query
  crew?: Crew;
  inviter?: {
    id: string;
    username: string;
    avatar_url: string | null;
    full_name?: string | null;
  };
}

// ============================================
// Crew Activity Interface
// ============================================

export interface CrewActivity {
  id: string;
  crew_id: string;
  activity_type: ActivityType;
  actor_id: string;
  metadata: Record<string, any>;
  created_at: string;
  visibility: 'crew_only' | 'public';
  // Joined data from Supabase query
  actor?: {
    id: string;
    username: string;
    avatar_url: string | null;
    full_name?: string | null;
  };
}

// ============================================
// Crew Vouch Interface
// ============================================

export interface CrewVouch {
  id: string;
  voucher_id: string;
  vouched_user_id: string;
  crew_id: string | null;
  created_at: string;
  // Joined data
  voucher?: {
    id: string;
    username: string;
    avatar_url: string | null;
  };
}

// ============================================
// Crew Creation Input
// ============================================

export interface CreateCrewInput {
  name: string;
  description?: string;
  crew_type: CrewType;
  privacy_setting: CrewPrivacy;
  theme_color?: string;
  avatar_url?: string;
}

// ============================================
// Crew Update Input
// ============================================

export interface UpdateCrewInput {
  name?: string;
  description?: string;
  crew_type?: CrewType;
  privacy_setting?: CrewPrivacy;
  theme_color?: string;
  avatar_url?: string;
}

// ============================================
// Crew Member Filters
// ============================================

export interface CrewMemberFilters {
  role?: CrewRole;
  is_active?: boolean;
  search?: string;
}

// ============================================
// Crew Stats (for analytics)
// ============================================

export interface CrewStats {
  total_members: number;
  active_members: number;
  parties_created: number;
  parties_attended: number;
  total_activity: number;
  reputation_score: number;
  avg_check_in_rate: number;
}

// ============================================
// Extended Crew with Members (for detail view)
// ============================================

export interface CrewWithMembers extends Crew {
  members: CrewMember[];
  my_role?: CrewRole;
  is_member: boolean;
}

// ============================================
// Activity Metadata Types (for type safety)
// ============================================

export interface MemberJoinedMetadata {
  user_id: string;
  username: string;
}

export interface MemberInvitedMetadata {
  invitee_id: string;
  invitee_username?: string;
}

export interface PartyCreatedMetadata {
  party_id: string;
  party_name: string;
}

export interface PhotoAddedMetadata {
  photo_url: string;
  party_id?: string;
}

export interface AchievementMetadata {
  achievement_id: string;
  achievement_name: string;
  achievement_description: string;
}
