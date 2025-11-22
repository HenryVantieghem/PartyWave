/**
 * Party Types - Phase 2 Enhancement
 * Includes: Dual-mode creation, co-hosts, templates, vibes, quick plans
 */

import { Profile } from '@/lib/supabase';

// ============================================
// CORE TYPES
// ============================================

export type CreationMode = 'quick' | 'planned';

export type VibeTag =
  | 'chill'
  | 'lit'
  | 'intimate'
  | 'wild'
  | 'classy'
  | 'casual'
  | 'rave'
  | 'lounge'
  | 'party'
  | 'dance'
  | 'gaming'
  | 'sports'
  | 'networking'
  | 'celebration';

// ============================================
// CO-HOST SYSTEM
// ============================================

export type CoHostRole = 'owner' | 'co-host';

export interface PartyCoHost {
  id: string;
  party_id: string;
  user_id: string;
  role: CoHostRole;
  can_edit: boolean;
  can_invite: boolean;
  can_manage_attendees: boolean;
  added_at: string;
  added_by: string | null;
  user?: Profile;
  added_by_user?: Profile;
}

export interface CreateCoHostInput {
  party_id: string;
  user_id: string;
  role?: CoHostRole;
  can_edit?: boolean;
  can_invite?: boolean;
  can_manage_attendees?: boolean;
}

export interface UpdateCoHostInput {
  can_edit?: boolean;
  can_invite?: boolean;
  can_manage_attendees?: boolean;
}

// ============================================
// PARTY TEMPLATES
// ============================================

export interface PartyTemplate {
  id: string;
  name: string;
  description: string | null;
  created_by: string;
  is_public: boolean;
  icon_emoji: string;
  default_duration_hours: number;
  default_vibe_tags: VibeTag[];
  default_privacy: 'public' | 'private';
  suggested_capacity: number | null;
  custom_fields: Record<string, any>;
  created_at: string;
  updated_at: string;
  use_count: number;
  creator?: Profile;
}

export interface CreateTemplateInput {
  name: string;
  description?: string;
  is_public?: boolean;
  icon_emoji?: string;
  default_duration_hours?: number;
  default_vibe_tags?: VibeTag[];
  default_privacy?: 'public' | 'private';
  suggested_capacity?: number;
  custom_fields?: Record<string, any>;
}

export interface UpdateTemplateInput {
  name?: string;
  description?: string;
  is_public?: boolean;
  icon_emoji?: string;
  default_duration_hours?: number;
  default_vibe_tags?: VibeTag[];
  default_privacy?: 'public' | 'private';
  suggested_capacity?: number;
  custom_fields?: Record<string, any>;
}

// ============================================
// PARTY VIBES
// ============================================

export interface PartyVibe {
  id: string;
  party_id: string;
  recorded_by: string | null;
  energy_level: number; // 0-100
  vibe_description: string | null;
  recorded_at: string;
  attendee_count: number | null;
  music_playing: boolean;
  peak_moment: boolean;
  recorder?: Profile;
}

export interface CreateVibeInput {
  party_id: string;
  energy_level: number;
  vibe_description?: string;
  attendee_count?: number;
  music_playing?: boolean;
  peak_moment?: boolean;
}

export interface VibeSummary {
  avg_energy: number;
  peak_energy: number;
  vibe_count: number;
  last_updated: string;
}

// ============================================
// QUICK PLANS (CREW POLLING)
// ============================================

export type QuickPlanStatus = 'active' | 'confirmed' | 'cancelled';

export interface PartyQuickPlan {
  id: string;
  crew_id: string;
  created_by: string;
  title: string;
  description: string | null;
  suggested_time: string | null;
  suggested_location: string | null;
  status: QuickPlanStatus;
  expires_at: string;
  upvotes: number;
  downvotes: number;
  party_id: string | null;
  created_at: string;
  updated_at: string;
  creator?: Profile;
  party?: any; // Will reference Party type when confirmed
}

export interface CreateQuickPlanInput {
  crew_id: string;
  title: string;
  description?: string;
  suggested_time?: string;
  suggested_location?: string;
}

export type QuickPlanVoteType = 'up' | 'down' | 'interested';

export interface QuickPlanVote {
  id: string;
  quick_plan_id: string;
  user_id: string;
  vote_type: QuickPlanVoteType;
  voted_at: string;
  voter?: Profile;
}

export interface CreateVoteInput {
  quick_plan_id: string;
  vote_type: QuickPlanVoteType;
}

export interface QuickPlanWithVotes extends PartyQuickPlan {
  upvote_count: number;
  interested_count: number;
  time_remaining: string; // Interval returned from DB
  user_vote?: QuickPlanVote;
}

// ============================================
// ENHANCED PARTY TYPE
// ============================================

export interface QuickCreateMetadata {
  captured_at: string;
  mood?: 'lit' | 'chill' | 'hype';
  urgency?: 'high' | 'medium' | 'low';
  source?: 'camera' | 'manual';
}

export interface EnhancedPartyData {
  // Phase 2 additions
  creation_mode: CreationMode;
  vibe_tags: VibeTag[];
  energy_level: number | null;
  cover_photo_url: string | null;
  capacity: number | null;
  rsvp_deadline: string | null;
  crew_id: string | null;
  template_id: string | null;
  quick_create_metadata: QuickCreateMetadata | null;

  // Relations
  co_hosts?: PartyCoHost[];
  vibes?: PartyVibe[];
  template?: PartyTemplate;
  crew?: any; // Will reference Crew type from crew system
}

// ============================================
// INPUT TYPES
// ============================================

export interface CreateQuickPartyInput {
  name: string;
  date_time: string;
  location_name: string;
  description?: string;
  cover_photo_url?: string;
  vibe_tags?: VibeTag[];
  energy_level?: number;
  quick_create_metadata?: QuickCreateMetadata;
}

export interface CreatePlannedPartyInput {
  name: string;
  description: string;
  date_time: string;
  location_name: string;
  location_address?: string;
  latitude?: number;
  longitude?: number;
  cover_photo_url?: string;
  vibe_tags?: VibeTag[];
  energy_level?: number;
  capacity?: number;
  rsvp_deadline?: string;
  crew_id?: string;
  template_id?: string;
  is_private?: boolean;
  co_host_ids?: string[];
}

export interface UpdatePartyInput {
  name?: string;
  description?: string;
  date_time?: string;
  location_name?: string;
  location_address?: string;
  latitude?: number;
  longitude?: number;
  cover_photo_url?: string;
  vibe_tags?: VibeTag[];
  energy_level?: number;
  capacity?: number;
  rsvp_deadline?: string;
  is_private?: boolean;
  status?: 'upcoming' | 'happening' | 'ended';
}

// ============================================
// PERMISSIONS
// ============================================

export interface PartyPermissions {
  can_edit: boolean;
  can_delete: boolean;
  can_invite: boolean;
  can_manage_attendees: boolean;
  can_manage_coHosts: boolean;
  role: 'owner' | 'co-host' | 'attendee' | 'viewer';
}
