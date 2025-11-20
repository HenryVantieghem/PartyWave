import { create } from 'zustand';
import { supabase, Party, PartyAttendee, PartyMemory, PartyMessage } from '@/lib/supabase';

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

  // Actions
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
}));
