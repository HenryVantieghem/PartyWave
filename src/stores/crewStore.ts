// ============================================
// CREW STORE
// ============================================
// Zustand store for crew state management
// with complete Supabase integration
// ============================================

import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { logError, getErrorMessage, showError } from '@/utils/errorHandling';
import type {
  Crew,
  CrewMember,
  CrewInvite,
  CrewActivity,
  CrewVouch,
  CreateCrewInput,
  UpdateCrewInput,
  CrewRole,
  CrewWithMembers,
} from '@/types/crew';

// ============================================
// Store Interface
// ============================================

interface CrewStore {
  // ========== State ==========
  crews: Crew[];
  myCrews: Crew[];
  currentCrew: CrewWithMembers | null;
  crewMembers: Record<string, CrewMember[]>;
  crewActivity: Record<string, CrewActivity[]>;
  pendingInvites: CrewInvite[];
  loading: boolean;
  error: string | null;

  // ========== Fetch Actions ==========
  fetchMyCrews: () => Promise<void>;
  fetchCrew: (crewId: string) => Promise<void>;
  fetchCrewMembers: (crewId: string) => Promise<void>;
  fetchCrewActivity: (crewId: string, limit?: number) => Promise<void>;
  fetchPendingInvites: () => Promise<void>;
  fetchCrewsByUser: (userId: string) => Promise<Crew[]>;

  // ========== Crew CRUD ==========
  createCrew: (data: CreateCrewInput) => Promise<Crew | null>;
  updateCrew: (crewId: string, data: UpdateCrewInput) => Promise<boolean>;
  deleteCrew: (crewId: string) => Promise<boolean>;

  // ========== Member Management ==========
  inviteToCrew: (
    crewId: string,
    userId: string,
    message?: string
  ) => Promise<void>;
  respondToInvite: (inviteId: string, accept: boolean) => Promise<void>;
  addCrewMember: (crewId: string, userId: string) => Promise<void>;
  removeCrewMember: (crewId: string, userId: string) => Promise<boolean>;
  updateMemberRole: (
    crewId: string,
    userId: string,
    role: 'admin' | 'member'
  ) => Promise<boolean>;
  leaveCrew: (crewId: string) => Promise<void>;

  // ========== Activity ==========
  createActivity: (
    crewId: string,
    activityType: string,
    metadata?: Record<string, any>
  ) => Promise<void>;
  subscribeToCrewActivity: (crewId: string) => () => void;

  // ========== Vouching ==========
  vouchForUser: (userId: string, crewId?: string) => Promise<void>;
  fetchUserVouches: (userId: string) => Promise<CrewVouch[]>;

  // ========== Discovery ==========
  discoverCrews: (userId: string, userLocation?: string | null) => Promise<Crew[]>;

  // ========== Utility ==========
  setCurrentCrew: (crew: CrewWithMembers | null) => void;
  clearError: () => void;
  reset: () => void;
}

// ============================================
// Initial State
// ============================================

const initialState = {
  crews: [],
  myCrews: [],
  currentCrew: null,
  crewMembers: {},
  crewActivity: {},
  pendingInvites: [],
  loading: false,
  error: null,
};

// ============================================
// Crew Store Implementation
// ============================================

export const useCrewStore = create<CrewStore>((set, get) => ({
  ...initialState,

  // ========================================
  // FETCH MY CREWS
  // ========================================
  fetchMyCrews: async () => {
    set({ loading: true, error: null });
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('crew_members')
        .select(
          `
          crew:party_crews!inner(*)
        `
        )
        .eq('user_id', user.id)
        .eq('is_active', true)
        .eq('party_crews.active_status', true)
        .order('joined_at', { ascending: false });

      if (error) throw error;

      // Extract crews from the nested structure
      const crews =
        data
          ?.map((item: any) => item.crew)
          .filter((crew: any) => crew !== null) || [];

      set({ myCrews: crews, loading: false });
    } catch (error: any) {
      console.error('Error fetching crews:', error);
      set({ error: error.message, loading: false });
    }
  },

  // ========================================
  // FETCH SINGLE CREW WITH MEMBERS
  // ========================================
  fetchCrew: async (crewId: string) => {
    set({ loading: true, error: null });
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Fetch crew details
      const { data: crew, error: crewError } = await supabase
        .from('party_crews')
        .select('*')
        .eq('id', crewId)
        .single();

      if (crewError) throw crewError;

      // Fetch crew members with user details
      const { data: members, error: membersError } = await supabase
        .from('crew_members')
        .select(
          `
          *,
          user:profiles!inner(id, username, avatar_url, display_name)
        `
        )
        .eq('crew_id', crewId)
        .eq('is_active', true)
        .order('role', { ascending: true })
        .order('joined_at', { ascending: true });

      if (membersError) throw membersError;

      // Find current user's role
      const myMembership = members?.find((m: any) => m.user_id === user.id);
      const myRole = myMembership?.role;
      const isMember = !!myMembership;

      const crewWithMembers: CrewWithMembers = {
        ...crew,
        members: members || [],
        my_role: myRole,
        is_member: isMember,
      };

      set({
        currentCrew: crewWithMembers,
        crewMembers: { ...get().crewMembers, [crewId]: members || [] },
        loading: false,
      });
    } catch (error: any) {
      console.error('Error fetching crew:', error);
      set({ error: error.message, loading: false });
    }
  },

  // ========================================
  // FETCH CREW MEMBERS
  // ========================================
  fetchCrewMembers: async (crewId: string) => {
    try {
      const { data, error } = await supabase
        .from('crew_members')
        .select(
          `
          *,
          user:profiles!inner(id, username, avatar_url, display_name)
        `
        )
        .eq('crew_id', crewId)
        .eq('is_active', true)
        .order('role', { ascending: true })
        .order('joined_at', { ascending: true });

      if (error) throw error;

      set((state) => ({
        crewMembers: {
          ...state.crewMembers,
          [crewId]: data || [],
        },
      }));
    } catch (error: any) {
      console.error('Error fetching crew members:', error);
      set({ error: error.message });
    }
  },

  // ========================================
  // FETCH CREW ACTIVITY
  // ========================================
  fetchCrewActivity: async (crewId: string, limit = 50) => {
    try {
      const { data, error } = await supabase
        .from('crew_activity')
        .select(
          `
          *,
          actor:profiles!inner(id, username, avatar_url, display_name)
        `
        )
        .eq('crew_id', crewId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      set((state) => ({
        crewActivity: {
          ...state.crewActivity,
          [crewId]: data || [],
        },
      }));
    } catch (error: any) {
      console.error('Error fetching crew activity:', error);
      set({ error: error.message });
    }
  },

  // ========================================
  // FETCH PENDING INVITES
  // ========================================
  fetchPendingInvites: async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('crew_invites')
        .select(
          `
          *,
          crew:party_crews!inner(*),
          inviter:profiles!crew_invites_inviter_id_fkey(id, username, avatar_url, display_name)
        `
        )
        .eq('invitee_id', user.id)
        .eq('status', 'pending')
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;
      set({ pendingInvites: data || [] });
    } catch (error: any) {
      console.error('Error fetching pending invites:', error);
      set({ error: error.message });
    }
  },

  // ========================================
  // FETCH CREWS BY USER
  // ========================================
  fetchCrewsByUser: async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('crew_members')
        .select(
          `
          crew:party_crews!inner(*)
        `
        )
        .eq('user_id', userId)
        .eq('is_active', true)
        .eq('party_crews.active_status', true);

      if (error) throw error;

      const crews = data?.map((item: any) => item.crew).filter(Boolean) || [];
      return crews;
    } catch (error: any) {
      console.error('Error fetching user crews:', error);
      return [];
    }
  },

  // ========================================
  // CREATE CREW
  // ========================================
  createCrew: async (data: CreateCrewInput) => {
    set({ loading: true, error: null });
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Create crew
      const { data: crew, error: crewError } = await supabase
        .from('party_crews')
        .insert({
          ...data,
          created_by: user.id,
        })
        .select()
        .single();

      if (crewError) throw crewError;

      // Add creator as owner
      const { error: memberError } = await supabase
        .from('crew_members')
        .insert({
          crew_id: crew.id,
          user_id: user.id,
          role: 'owner',
          invitation_status: 'accepted',
        });

      if (memberError) throw memberError;

      // Create activity
      await supabase.from('crew_activity').insert({
        crew_id: crew.id,
        activity_type: 'crew_created',
        actor_id: user.id,
        metadata: { crew_name: crew.name },
      });

      // Refresh crews
      await get().fetchMyCrews();

      set({ loading: false });
      return crew;
    } catch (error: any) {
      logError(error, 'createCrew');
      const errorMessage = getErrorMessage(error);
      set({ error: errorMessage, loading: false });
      showError(error, 'Create Crew Failed');
      return null;
    }
  },

  // ========================================
  // UPDATE CREW
  // ========================================
  updateCrew: async (crewId: string, data: UpdateCrewInput) => {
    set({ loading: true, error: null });
    try {
      const { error } = await supabase
        .from('party_crews')
        .update({ ...data, updated_at: new Date().toISOString() })
        .eq('id', crewId);

      if (error) throw error;

      await get().fetchMyCrews();
      if (get().currentCrew?.id === crewId) {
        await get().fetchCrew(crewId);
      }

      set({ loading: false });
      return true;
    } catch (error: any) {
      console.error('Error updating crew:', error);
      set({ error: error.message, loading: false });
      return false;
    }
  },

  // ========================================
  // DELETE CREW (soft delete)
  // ========================================
  deleteCrew: async (crewId: string) => {
    set({ loading: true, error: null });
    try {
      const { error } = await supabase
        .from('party_crews')
        .update({ active_status: false })
        .eq('id', crewId);

      if (error) throw error;

      await get().fetchMyCrews();
      set({ loading: false, currentCrew: null });
      return true;
    } catch (error: any) {
      console.error('Error deleting crew:', error);
      set({ error: error.message, loading: false });
      return false;
    }
  },

  // ========================================
  // INVITE TO CREW
  // ========================================
  inviteToCrew: async (crewId: string, userId: string, message?: string) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase.from('crew_invites').insert({
        crew_id: crewId,
        inviter_id: user.id,
        invitee_id: userId,
        message,
        expires_at: new Date(
          Date.now() + 7 * 24 * 60 * 60 * 1000
        ).toISOString(),
      });

      if (error) throw error;

      // Create activity
      await get().createActivity(crewId, 'member_invited', {
        invitee_id: userId,
      });
    } catch (error: any) {
      logError(error, 'inviteToCrew');
      const errorMessage = getErrorMessage(error);
      set({ error: errorMessage });
      throw error; // Re-throw so UI can handle it
    }
  },

  // ========================================
  // RESPOND TO INVITE
  // ========================================
  respondToInvite: async (inviteId: string, accept: boolean) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Get invite details
      const { data: invite, error: fetchError } = await supabase
        .from('crew_invites')
        .select('*')
        .eq('id', inviteId)
        .single();

      if (fetchError) throw fetchError;

      // Update invite status
      const { error: updateError } = await supabase
        .from('crew_invites')
        .update({ status: accept ? 'accepted' : 'declined' })
        .eq('id', inviteId);

      if (updateError) throw updateError;

      // If accepted, add to crew
      if (accept) {
        await get().addCrewMember(invite.crew_id, user.id);
      }

      // Refresh invites and crews
      await get().fetchPendingInvites();
      await get().fetchMyCrews();
    } catch (error: any) {
      console.error('Error responding to invite:', error);
      set({ error: error.message });
    }
  },

  // ========================================
  // ADD CREW MEMBER
  // ========================================
  addCrewMember: async (crewId: string, userId: string) => {
    try {
      const { error } = await supabase.from('crew_members').insert({
        crew_id: crewId,
        user_id: userId,
        role: 'member',
        invitation_status: 'accepted',
      });

      if (error) throw error;

      // Create activity
      await get().createActivity(crewId, 'member_joined', {
        user_id: userId,
      });

      await get().fetchCrewMembers(crewId);
    } catch (error: any) {
      console.error('Error adding crew member:', error);
      set({ error: error.message });
    }
  },

  // ========================================
  // REMOVE CREW MEMBER
  // ========================================
  removeCrewMember: async (crewId: string, userId: string) => {
    try {
      const { error } = await supabase
        .from('crew_members')
        .update({ is_active: false })
        .eq('crew_id', crewId)
        .eq('user_id', userId);

      if (error) throw error;

      // Create activity
      const {
        data: { user },
      } = await supabase.auth.getUser();
      await get().createActivity(crewId, 'member_removed', {
        removed_user_id: userId,
      });

      await get().fetchCrewMembers(crewId);
      return true;
    } catch (error: any) {
      console.error('Error removing crew member:', error);
      set({ error: error.message });
      return false;
    }
  },

  // ========================================
  // UPDATE MEMBER ROLE
  // ========================================
  updateMemberRole: async (
    crewId: string,
    userId: string,
    role: 'admin' | 'member'
  ) => {
    try {
      const { error } = await supabase
        .from('crew_members')
        .update({ role })
        .eq('crew_id', crewId)
        .eq('user_id', userId);

      if (error) throw error;

      // Create activity
      await get().createActivity(crewId, 'member_promoted', {
        user_id: userId,
        new_role: role,
      });

      await get().fetchCrewMembers(crewId);
      return true;
    } catch (error: any) {
      console.error('Error updating member role:', error);
      set({ error: error.message });
      return false;
    }
  },

  // ========================================
  // LEAVE CREW
  // ========================================
  leaveCrew: async (crewId: string) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      await get().removeCrewMember(crewId, user.id);
      await get().fetchMyCrews();
    } catch (error: any) {
      console.error('Error leaving crew:', error);
      set({ error: error.message });
    }
  },

  // ========================================
  // CREATE ACTIVITY
  // ========================================
  createActivity: async (
    crewId: string,
    activityType: string,
    metadata: Record<string, any> = {}
  ) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase.from('crew_activity').insert({
        crew_id: crewId,
        activity_type: activityType,
        actor_id: user.id,
        metadata,
      });

      if (error) throw error;

      // Refresh activity feed
      await get().fetchCrewActivity(crewId);
    } catch (error: any) {
      console.error('Error creating activity:', error);
    }
  },

  // ========================================
  // SUBSCRIBE TO CREW ACTIVITY (Real-time)
  // ========================================
  subscribeToCrewActivity: (crewId: string) => {
    const channel = supabase
      .channel(`crew_activity:${crewId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'crew_activity',
          filter: `crew_id=eq.${crewId}`,
        },
        (payload) => {
          // Add new activity to the beginning of the list
          set((state) => {
            const currentActivities = state.crewActivity[crewId] || [];
            return {
              crewActivity: {
                ...state.crewActivity,
                [crewId]: [payload.new as CrewActivity, ...currentActivities],
              },
            };
          });

          // Optionally refetch to get full user data
          get().fetchCrewActivity(crewId);
        }
      )
      .subscribe();

    // Return cleanup function
    return () => {
      supabase.removeChannel(channel);
    };
  },

  // ========================================
  // VOUCH FOR USER
  // ========================================
  vouchForUser: async (userId: string, crewId?: string) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase.from('crew_vouches').insert({
        voucher_id: user.id,
        vouched_user_id: userId,
        crew_id: crewId || null,
      });

      if (error) throw error;
    } catch (error: any) {
      console.error('Error vouching for user:', error);
      set({ error: error.message });
    }
  },

  // ========================================
  // FETCH USER VOUCHES
  // ========================================
  fetchUserVouches: async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('crew_vouches')
        .select(
          `
          *,
          voucher:profiles!crew_vouches_voucher_id_fkey(id, username, avatar_url)
        `
        )
        .eq('vouched_user_id', userId);

      if (error) throw error;
      return data || [];
    } catch (error: any) {
      console.error('Error fetching vouches:', error);
      return [];
    }
  },

  // ========================================
  // DISCOVERY ACTIONS
  // ========================================

  discoverCrews: async (userId: string, userLocation?: string | null) => {
    try {
      // Get user's current crews
      const myCrewIds = get().myCrews.map((c) => c.id);

      // Fetch public crews that user is not already a member of
      const { data: publicCrews, error } = await supabase
        .from('party_crews')
        .select(
          `
          *,
          creator:profiles!party_crews_created_by_fkey(id, username, display_name, location, avatar_url)
        `
        )
        .eq('active_status', true)
        .eq('privacy_setting', 'public')
        .not(
          'id',
          'in',
          `(${myCrewIds.length > 0 ? myCrewIds.join(',') : '00000000-0000-0000-0000-000000000000'})`
        )
        .order('reputation_score', { ascending: false })
        .limit(100);

      if (error) throw error;

      // Get user's crew members for mutual friend detection
      const myCrewMemberIds: string[] = [];
      for (const crew of get().myCrews) {
        const members = get().crewMembers[crew.id] || [];
        myCrewMemberIds.push(...members.map((m) => m.user_id));
      }
      const uniqueMemberIds = [...new Set(myCrewMemberIds)];

      // Calculate match scores for each crew
      const crewsWithScores = await Promise.all(
        (publicCrews || []).map(async (crew) => {
          let score = 0;
          const reasons: string[] = [];

          // 1. Location-based matching (25 points max)
          if (userLocation && crew.creator?.location) {
            const userLoc = userLocation.toLowerCase();
            const crewLoc = crew.creator.location.toLowerCase();

            // Exact match
            if (userLoc === crewLoc) {
              score += 25;
              reasons.push('📍 Same location');
            }
            // Partial match (same city/area)
            else if (
              userLoc.includes(crewLoc) ||
              crewLoc.includes(userLoc) ||
              userLoc.split(',')[0] === crewLoc.split(',')[0]
            ) {
              score += 15;
              reasons.push('📍 Nearby location');
            }
          }

          // 2. Reputation score (20 points max)
          const reputationBonus = Math.min(crew.reputation_score / 5, 20);
          score += reputationBonus;
          if (crew.reputation_score > 80) {
            reasons.push('⭐ Highly rated crew');
          }

          // 3. Optimal community size (15 points)
          if (crew.member_count >= 5 && crew.member_count <= 50) {
            score += 15;
            reasons.push('👥 Active community size');
          }

          // 4. Similar size to user's crews (10 points)
          if (get().myCrews.length > 0) {
            const avgMyCrewSize =
              get().myCrews.reduce((sum, c) => sum + c.member_count, 0) /
              get().myCrews.length;
            const sizeDiff = Math.abs(crew.member_count - avgMyCrewSize);
            if (sizeDiff < 10) {
              score += 10;
              reasons.push('📊 Similar community size');
            }
          }

          // 5. Crew type preference (15 points)
          const openCrews = get().myCrews.filter((c) => c.crew_type === 'open')
            .length;
          if (
            openCrews > get().myCrews.length / 2 &&
            crew.crew_type === 'open'
          ) {
            score += 15;
            reasons.push('🌐 Matches your crew style');
          }

          // 6. Mutual members (friend-of-friend) (30 points max)
          try {
            const { data: mutualMembers } = await supabase
              .from('crew_members')
              .select('user_id')
              .eq('crew_id', crew.id)
              .in('user_id', uniqueMemberIds.length > 0 ? uniqueMemberIds : ['00000000-0000-0000-0000-000000000000']);

            if (mutualMembers && mutualMembers.length > 0) {
              const mutualCount = mutualMembers.length;
              score += Math.min(mutualCount * 10, 30);
              reasons.push(
                `🤝 ${mutualCount} mutual member${mutualCount > 1 ? 's' : ''}`
              );
            }
          } catch (error) {
            // Ignore mutual member error
          }

          // 7. Freshness factor (5 points randomness)
          score += Math.random() * 5;

          return {
            ...crew,
            matchScore: Math.round(score),
            matchReasons: reasons,
          } as Crew & { matchScore: number; matchReasons: string[] };
        })
      );

      // Sort by match score
      crewsWithScores.sort((a, b) => b.matchScore - a.matchScore);

      return crewsWithScores;
    } catch (error: any) {
      logError(error, 'discoverCrews');
      return [];
    }
  },

  // ========================================
  // UTILITY ACTIONS
  // ========================================
  setCurrentCrew: (crew: CrewWithMembers | null) => set({ currentCrew: crew }),
  clearError: () => set({ error: null }),
  reset: () => set(initialState),
}));
