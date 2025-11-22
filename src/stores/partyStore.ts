import { create } from 'zustand';
import { supabase, Party, PartyAttendee, PartyMemory, PartyMessage } from '@/lib/supabase';
import {
  PartyCoHost,
  PartyTemplate,
  PartyVibe,
  PartyQuickPlan,
  QuickPlanVote,
  CreateCoHostInput,
  UpdateCoHostInput,
  CreateTemplateInput,
  UpdateTemplateInput,
  CreateVibeInput,
  VibeSummary,
  CreateQuickPlanInput,
  CreateVoteInput,
  QuickPlanWithVotes,
  CreateQuickPartyInput,
  CreatePlannedPartyInput,
} from '@/types/party';
import { logError, getErrorMessage, showError } from '@/utils/errorHandling';

type PartyState = {
  // State
  parties: Party[];
  myParties: Party[];
  currentParty: Party | null;
  attendees: PartyAttendee[];
  memories: PartyMemory[];
  messages: PartyMessage[];
  isLoading: boolean;
  error: string | null;

  // Phase 2 State
  coHosts: Record<string, PartyCoHost[]>; // partyId -> coHosts
  templates: PartyTemplate[];
  myTemplates: PartyTemplate[];
  vibes: Record<string, PartyVibe[]>; // partyId -> vibes
  vibeSummaries: Record<string, VibeSummary>; // partyId -> summary
  quickPlans: Record<string, QuickPlanWithVotes[]>; // crewId -> plans

  // Actions - Basic CRUD
  fetchParties: (filters?: {
    status?: string;
    location?: { lat: number; lng: number; radius: number };
  }) => Promise<void>;
  fetchMyParties: (userId: string) => Promise<void>;
  fetchPartyById: (partyId: string) => Promise<void>;
  createParty: (party: Partial<Party>) => Promise<Party>;
  updateParty: (partyId: string, updates: Partial<Party>) => Promise<void>;
  deleteParty: (partyId: string) => Promise<void>;
  joinParty: (partyId: string, userId: string) => Promise<void>;
  leaveParty: (partyId: string, userId: string) => Promise<void>;
  checkIn: (partyId: string, userId: string) => Promise<void>;
  fetchAttendees: (partyId: string) => Promise<void>;
  fetchMemories: (partyId: string) => Promise<void>;
  addMemory: (memory: Partial<PartyMemory>) => Promise<void>;
  fetchMessages: (partyId: string) => Promise<void>;
  sendMessage: (message: Partial<PartyMessage>) => Promise<void>;
  subscribeToParty: (partyId: string) => () => void;
  setError: (error: string | null) => void;
  clearError: () => void;

  // Phase 2 Actions - Dual-Mode Creation
  createQuickParty: (data: CreateQuickPartyInput) => Promise<Party | null>;
  createPlannedParty: (data: CreatePlannedPartyInput) => Promise<Party | null>;

  // Phase 2 Actions - Co-Hosts
  addCoHost: (data: CreateCoHostInput) => Promise<boolean>;
  removeCoHost: (partyId: string, coHostId: string) => Promise<boolean>;
  updateCoHostPermissions: (coHostId: string, updates: UpdateCoHostInput) => Promise<boolean>;
  fetchCoHosts: (partyId: string) => Promise<void>;

  // Phase 2 Actions - Templates
  createTemplate: (data: CreateTemplateInput) => Promise<PartyTemplate | null>;
  updateTemplate: (templateId: string, updates: UpdateTemplateInput) => Promise<boolean>;
  deleteTemplate: (templateId: string) => Promise<boolean>;
  fetchTemplates: () => Promise<void>;
  fetchMyTemplates: () => Promise<void>;

  // Phase 2 Actions - Vibes
  recordVibe: (data: CreateVibeInput) => Promise<boolean>;
  fetchVibes: (partyId: string) => Promise<void>;
  getVibeSummary: (partyId: string) => Promise<void>;

  // Phase 2 Actions - Quick Plans
  createQuickPlan: (data: CreateQuickPlanInput) => Promise<PartyQuickPlan | null>;
  fetchQuickPlans: (crewId: string) => Promise<void>;
  voteOnQuickPlan: (data: CreateVoteInput) => Promise<boolean>;
  confirmQuickPlan: (planId: string, partyData: CreateQuickPartyInput) => Promise<Party | null>;
  cancelQuickPlan: (planId: string) => Promise<boolean>;
};

export const usePartyStore = create<PartyState>((set, get) => ({
  // Initial state
  parties: [],
  myParties: [],
  currentParty: null,
  attendees: [],
  memories: [],
  messages: [],
  isLoading: false,
  error: null,

  // Phase 2 Initial State
  coHosts: {},
  templates: [],
  myTemplates: [],
  vibes: {},
  vibeSummaries: {},
  quickPlans: {},

  // Fetch all parties
  fetchParties: async (filters) => {
    try {
      set({ isLoading: true, error: null });

      let query = supabase
        .from('parties')
        .select(`
          *,
          host:profiles(*)
        `)
        .order('date_time', { ascending: true });

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      const { data, error } = await query;

      if (error) throw error;
      
      // Map database fields to TypeScript types
      const mappedData = (data || []).map((party: any) => ({
        ...party,
        name: party.title || party.name,
        location_name: party.location || party.location_name,
      }));
      
      set({ parties: mappedData, isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  // Fetch user's parties
  fetchMyParties: async (userId) => {
    try {
      set({ isLoading: true, error: null });

      // Get parties user is hosting or attending
      const { data: attendingData } = await supabase
        .from('party_attendees')
        .select('party_id')
        .eq('user_id', userId);

      const partyIds = attendingData?.map((a) => a.party_id) || [];

      const { data, error } = await supabase
        .from('parties')
        .select(`
          *,
          host:profiles(*)
        `)
        .or(`host_id.eq.${userId},id.in.(${partyIds.join(',')})`)
        .order('date_time', { ascending: true });

      if (error) throw error;
      
      // Map database fields to TypeScript types
      const mappedData = (data || []).map((party: any) => ({
        ...party,
        name: party.title || party.name,
        location_name: party.location || party.location_name,
      }));
      
      set({ myParties: mappedData, isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  // Fetch party by ID
  fetchPartyById: async (partyId) => {
    try {
      set({ isLoading: true, error: null });

      const { data, error } = await supabase
        .from('parties')
        .select(`
          *,
          host:profiles(*)
        `)
        .eq('id', partyId)
        .single();

      if (error) throw error;
      
      // Map database fields to TypeScript types
      const mappedData = data ? {
        ...data,
        name: data.title || data.name,
        location_name: data.location || data.location_name,
      } : null;
      
      set({ currentParty: mappedData, isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  // Create party
  createParty: async (party) => {
    try {
      set({ isLoading: true, error: null });

      // Map fields to match database schema
      const partyData: any = {
        title: party.name, // Database uses 'title', TypeScript uses 'name'
        description: party.description,
        host_id: party.host_id,
        date_time: party.date_time,
        location: party.location_name, // Database uses 'location', TypeScript uses 'location_name'
        location_address: party.location_address,
        latitude: party.latitude,
        longitude: party.longitude,
        cover_image_url: party.cover_image_url,
        max_attendees: party.max_attendees,
        energy_score: party.energy_score || 0,
        status: party.status || 'upcoming',
        invite_code: party.invite_code,
        is_private: party.is_private || false,
      };

      const { data, error } = await supabase
        .from('parties')
        .insert(partyData)
        .select(`
          *,
          host:profiles(*)
        `)
        .single();

      if (error) throw error;

      // Map response back to TypeScript type
      const mappedData = {
        ...data,
        name: data.title,
        location_name: data.location,
      };

      set({ isLoading: false });
      return mappedData;
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  // Update party
  updateParty: async (partyId, updates) => {
    try {
      set({ isLoading: true, error: null });

      const { data, error } = await supabase
        .from('parties')
        .update(updates)
        .eq('id', partyId)
        .select(`
          *,
          host:profiles(*)
        `)
        .single();

      if (error) throw error;

      set({
        currentParty: data,
        parties: get().parties.map((p) => (p.id === partyId ? data : p)),
        isLoading: false,
      });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  // Delete party
  deleteParty: async (partyId) => {
    try {
      set({ isLoading: true, error: null });

      const { error } = await supabase.from('parties').delete().eq('id', partyId);

      if (error) throw error;

      set({
        parties: get().parties.filter((p) => p.id !== partyId),
        myParties: get().myParties.filter((p) => p.id !== partyId),
        isLoading: false,
      });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  // Join party
  joinParty: async (partyId, userId) => {
    try {
      set({ isLoading: true, error: null });

      const { error } = await supabase.from('party_attendees').insert({
        party_id: partyId,
        user_id: userId,
        status: 'confirmed',
      });

      if (error) throw error;

      await get().fetchAttendees(partyId);
      set({ isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  // Leave party
  leaveParty: async (partyId, userId) => {
    try {
      set({ isLoading: true, error: null });

      const { error } = await supabase
        .from('party_attendees')
        .delete()
        .eq('party_id', partyId)
        .eq('user_id', userId);

      if (error) throw error;

      await get().fetchAttendees(partyId);
      set({ isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  // Check in to party
  checkIn: async (partyId, userId) => {
    try {
      set({ isLoading: true, error: null });

      const { error } = await supabase
        .from('party_attendees')
        .update({
          status: 'checked_in',
          checked_in_at: new Date().toISOString(),
        })
        .eq('party_id', partyId)
        .eq('user_id', userId);

      if (error) throw error;

      await get().fetchAttendees(partyId);
      set({ isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  // Fetch attendees
  fetchAttendees: async (partyId) => {
    try {
      const { data, error } = await supabase
        .from('party_attendees')
        .select(`
          *,
          user:profiles(*)
        `)
        .eq('party_id', partyId)
        .order('joined_at', { ascending: false });

      if (error) throw error;
      set({ attendees: data || [] });
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  // Fetch memories
  fetchMemories: async (partyId) => {
    try {
      const { data, error } = await supabase
        .from('party_memories')
        .select(`
          *,
          user:profiles(*)
        `)
        .eq('party_id', partyId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      set({ memories: data || [] });
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  // Add memory
  addMemory: async (memory) => {
    try {
      const { data, error } = await supabase
        .from('party_memories')
        .insert(memory)
        .select(`
          *,
          user:profiles(*)
        `)
        .single();

      if (error) throw error;

      set({ memories: [data, ...get().memories] });
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    }
  },

  // Fetch messages
  fetchMessages: async (partyId) => {
    try {
      const { data, error } = await supabase
        .from('party_messages')
        .select(`
          *,
          user:profiles(*)
        `)
        .eq('party_id', partyId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      set({ messages: data || [] });
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  // Send message
  sendMessage: async (message) => {
    try {
      const { data, error } = await supabase
        .from('party_messages')
        .insert(message)
        .select(`
          *,
          user:profiles(*)
        `)
        .single();

      if (error) throw error;

      set({ messages: [...get().messages, data] });
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    }
  },

  // Subscribe to party updates
  subscribeToParty: (partyId) => {
    const messageChannel = supabase
      .channel(`party-${partyId}-messages`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'party_messages',
          filter: `party_id=eq.${partyId}`,
        },
        (payload) => {
          set({ messages: [...get().messages, payload.new as PartyMessage] });
        }
      )
      .subscribe();

    const attendeeChannel = supabase
      .channel(`party-${partyId}-attendees`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'party_attendees',
          filter: `party_id=eq.${partyId}`,
        },
        () => {
          get().fetchAttendees(partyId);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(messageChannel);
      supabase.removeChannel(attendeeChannel);
    };
  },

  // Set error
  setError: (error) => set({ error }),

  // Clear error
  clearError: () => set({ error: null }),

  // ============================================
  // PHASE 2: DUAL-MODE CREATION
  // ============================================

  // Create quick party (<15 seconds)
  createQuickParty: async (data) => {
    try {
      set({ isLoading: true, error: null });

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const partyData = {
        title: data.name,
        description: data.description || `Quick party at ${data.location_name}`,
        host_id: user.id,
        date_time: data.date_time,
        location: data.location_name,
        cover_image_url: data.cover_photo_url,
        status: 'upcoming' as const,
        is_private: false,
        energy_score: data.energy_level || 50,
        // Phase 2 fields
        creation_mode: 'quick' as const,
        vibe_tags: data.vibe_tags || [],
        energy_level: data.energy_level,
        cover_photo_url: data.cover_photo_url,
        quick_create_metadata: data.quick_create_metadata || {
          captured_at: new Date().toISOString(),
          source: 'manual',
        },
      };

      const { data: party, error } = await supabase
        .from('parties')
        .insert(partyData)
        .select('*')
        .single();

      if (error) throw error;

      set({ isLoading: false });
      return party;
    } catch (error: any) {
      logError(error, 'createQuickParty');
      set({ error: getErrorMessage(error), isLoading: false });
      showError(error, 'Quick Party Creation Failed');
      return null;
    }
  },

  // Create planned party (full wizard)
  createPlannedParty: async (data) => {
    try {
      set({ isLoading: true, error: null });

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const partyData = {
        title: data.name,
        description: data.description,
        host_id: user.id,
        date_time: data.date_time,
        location: data.location_name,
        location_address: data.location_address,
        latitude: data.latitude,
        longitude: data.longitude,
        cover_image_url: data.cover_photo_url,
        max_attendees: data.capacity,
        status: 'upcoming' as const,
        is_private: data.is_private || false,
        energy_score: data.energy_level || 50,
        // Phase 2 fields
        creation_mode: 'planned' as const,
        vibe_tags: data.vibe_tags || [],
        energy_level: data.energy_level,
        cover_photo_url: data.cover_photo_url,
        capacity: data.capacity,
        rsvp_deadline: data.rsvp_deadline,
        crew_id: data.crew_id,
        template_id: data.template_id,
      };

      const { data: party, error } = await supabase
        .from('parties')
        .insert(partyData)
        .select('*')
        .single();

      if (error) throw error;

      // Add co-hosts if specified
      if (data.co_host_ids && data.co_host_ids.length > 0) {
        const coHostPromises = data.co_host_ids.map((userId) =>
          get().addCoHost({
            party_id: party.id,
            user_id: userId,
            role: 'co-host',
          })
        );
        await Promise.all(coHostPromises);
      }

      set({ isLoading: false });
      return party;
    } catch (error: any) {
      logError(error, 'createPlannedParty');
      set({ error: getErrorMessage(error), isLoading: false });
      showError(error, 'Party Creation Failed');
      return null;
    }
  },

  // ============================================
  // PHASE 2: CO-HOSTS
  // ============================================

  // Add co-host to party
  addCoHost: async (data) => {
    try {
      const { error } = await supabase.from('party_co_hosts').insert({
        party_id: data.party_id,
        user_id: data.user_id,
        role: data.role || 'co-host',
        can_edit: data.can_edit ?? true,
        can_invite: data.can_invite ?? true,
        can_manage_attendees: data.can_manage_attendees ?? false,
      });

      if (error) throw error;

      await get().fetchCoHosts(data.party_id);
      return true;
    } catch (error: any) {
      logError(error, 'addCoHost');
      showError(error, 'Failed to Add Co-Host');
      return false;
    }
  },

  // Remove co-host from party
  removeCoHost: async (partyId, coHostId) => {
    try {
      const { error } = await supabase
        .from('party_co_hosts')
        .delete()
        .eq('id', coHostId);

      if (error) throw error;

      await get().fetchCoHosts(partyId);
      return true;
    } catch (error: any) {
      logError(error, 'removeCoHost');
      showError(error, 'Failed to Remove Co-Host');
      return false;
    }
  },

  // Update co-host permissions
  updateCoHostPermissions: async (coHostId, updates) => {
    try {
      const { error } = await supabase
        .from('party_co_hosts')
        .update(updates)
        .eq('id', coHostId);

      if (error) throw error;
      return true;
    } catch (error: any) {
      logError(error, 'updateCoHostPermissions');
      showError(error, 'Failed to Update Permissions');
      return false;
    }
  },

  // Fetch co-hosts for party
  fetchCoHosts: async (partyId) => {
    try {
      const { data, error } = await supabase
        .from('party_co_hosts')
        .select('*, user:profiles(*)')
        .eq('party_id', partyId);

      if (error) throw error;

      set((state) => ({
        coHosts: { ...state.coHosts, [partyId]: data || [] },
      }));
    } catch (error: any) {
      logError(error, 'fetchCoHosts');
    }
  },

  // ============================================
  // PHASE 2: TEMPLATES
  // ============================================

  // Create party template
  createTemplate: async (data) => {
    try {
      set({ isLoading: true, error: null });

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: template, error } = await supabase
        .from('party_templates')
        .insert({
          ...data,
          created_by: user.id,
        })
        .select('*')
        .single();

      if (error) throw error;

      await get().fetchMyTemplates();
      set({ isLoading: false });
      return template;
    } catch (error: any) {
      logError(error, 'createTemplate');
      set({ error: getErrorMessage(error), isLoading: false });
      showError(error, 'Template Creation Failed');
      return null;
    }
  },

  // Update template
  updateTemplate: async (templateId, updates) => {
    try {
      const { error } = await supabase
        .from('party_templates')
        .update(updates)
        .eq('id', templateId);

      if (error) throw error;

      await get().fetchMyTemplates();
      return true;
    } catch (error: any) {
      logError(error, 'updateTemplate');
      showError(error, 'Template Update Failed');
      return false;
    }
  },

  // Delete template
  deleteTemplate: async (templateId) => {
    try {
      const { error } = await supabase
        .from('party_templates')
        .delete()
        .eq('id', templateId);

      if (error) throw error;

      set((state) => ({
        myTemplates: state.myTemplates.filter((t) => t.id !== templateId),
      }));
      return true;
    } catch (error: any) {
      logError(error, 'deleteTemplate');
      showError(error, 'Template Deletion Failed');
      return false;
    }
  },

  // Fetch public templates
  fetchTemplates: async () => {
    try {
      const { data, error } = await supabase
        .from('party_templates')
        .select('*')
        .eq('is_public', true)
        .order('use_count', { ascending: false });

      if (error) throw error;

      set({ templates: data || [] });
    } catch (error: any) {
      logError(error, 'fetchTemplates');
    }
  },

  // Fetch user's templates
  fetchMyTemplates: async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('party_templates')
        .select('*')
        .eq('created_by', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      set({ myTemplates: data || [] });
    } catch (error: any) {
      logError(error, 'fetchMyTemplates');
    }
  },

  // ============================================
  // PHASE 2: VIBES
  // ============================================

  // Record party vibe
  recordVibe: async (data) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase.from('party_vibes').insert({
        ...data,
        recorded_by: user.id,
      });

      if (error) throw error;

      await get().fetchVibes(data.party_id);
      await get().getVibeSummary(data.party_id);
      return true;
    } catch (error: any) {
      logError(error, 'recordVibe');
      showError(error, 'Failed to Record Vibe');
      return false;
    }
  },

  // Fetch party vibes
  fetchVibes: async (partyId) => {
    try {
      const { data, error } = await supabase
        .from('party_vibes')
        .select('*, recorder:profiles(*)')
        .eq('party_id', partyId)
        .order('recorded_at', { ascending: false });

      if (error) throw error;

      set((state) => ({
        vibes: { ...state.vibes, [partyId]: data || [] },
      }));
    } catch (error: any) {
      logError(error, 'fetchVibes');
    }
  },

  // Get vibe summary
  getVibeSummary: async (partyId) => {
    try {
      const { data, error } = await supabase.rpc('get_party_vibe_summary', {
        p_party_id: partyId,
      });

      if (error) throw error;

      if (data && data.length > 0) {
        set((state) => ({
          vibeSummaries: { ...state.vibeSummaries, [partyId]: data[0] },
        }));
      }
    } catch (error: any) {
      logError(error, 'getVibeSummary');
    }
  },

  // ============================================
  // PHASE 2: QUICK PLANS
  // ============================================

  // Create quick plan
  createQuickPlan: async (data) => {
    try {
      set({ isLoading: true, error: null });

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: plan, error } = await supabase
        .from('party_quick_plans')
        .insert({
          ...data,
          created_by: user.id,
        })
        .select('*')
        .single();

      if (error) throw error;

      await get().fetchQuickPlans(data.crew_id);
      set({ isLoading: false });
      return plan;
    } catch (error: any) {
      logError(error, 'createQuickPlan');
      set({ error: getErrorMessage(error), isLoading: false });
      showError(error, 'Quick Plan Creation Failed');
      return null;
    }
  },

  // Fetch quick plans for crew
  fetchQuickPlans: async (crewId) => {
    try {
      const { data, error } = await supabase.rpc('get_active_quick_plans', {
        p_crew_id: crewId,
      });

      if (error) throw error;

      set((state) => ({
        quickPlans: { ...state.quickPlans, [crewId]: data || [] },
      }));
    } catch (error: any) {
      logError(error, 'fetchQuickPlans');
    }
  },

  // Vote on quick plan
  voteOnQuickPlan: async (data) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Upsert vote (update if exists, insert if not)
      const { error } = await supabase
        .from('quick_plan_votes')
        .upsert({
          quick_plan_id: data.quick_plan_id,
          user_id: user.id,
          vote_type: data.vote_type,
        });

      if (error) throw error;
      return true;
    } catch (error: any) {
      logError(error, 'voteOnQuickPlan');
      showError(error, 'Vote Failed');
      return false;
    }
  },

  // Confirm quick plan (convert to party)
  confirmQuickPlan: async (planId, partyData) => {
    try {
      set({ isLoading: true, error: null });

      // Create the party
      const party = await get().createQuickParty(partyData);
      if (!party) throw new Error('Failed to create party');

      // Update quick plan status and link to party
      const { error } = await supabase
        .from('party_quick_plans')
        .update({
          status: 'confirmed',
          party_id: party.id,
        })
        .eq('id', planId);

      if (error) throw error;

      set({ isLoading: false });
      return party;
    } catch (error: any) {
      logError(error, 'confirmQuickPlan');
      set({ error: getErrorMessage(error), isLoading: false });
      showError(error, 'Quick Plan Confirmation Failed');
      return null;
    }
  },

  // Cancel quick plan
  cancelQuickPlan: async (planId) => {
    try {
      const { error } = await supabase
        .from('party_quick_plans')
        .update({ status: 'cancelled' })
        .eq('id', planId);

      if (error) throw error;
      return true;
    } catch (error: any) {
      logError(error, 'cancelQuickPlan');
      showError(error, 'Cancellation Failed');
      return false;
    }
  },
}));
