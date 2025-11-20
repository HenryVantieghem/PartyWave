import { create } from 'zustand';
import { supabase, Profile, Connection, UserAchievement } from '@/lib/supabase';

type UserState = {
  // State
  users: Profile[];
  connections: Connection[];
  pendingRequests: Connection[];
  achievements: UserAchievement[];
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchUserById: (userId: string) => Promise<Profile | null>;
  fetchUsersByIds: (userIds: string[]) => Promise<Profile[]>;
  searchUsers: (query: string) => Promise<Profile[]>;
  fetchConnections: (userId: string) => Promise<void>;
  fetchPendingRequests: (userId: string) => Promise<void>;
  sendConnectionRequest: (userId: string, friendId: string) => Promise<void>;
  acceptConnectionRequest: (connectionId: string) => Promise<void>;
  rejectConnectionRequest: (connectionId: string) => Promise<void>;
  removeConnection: (connectionId: string) => Promise<void>;
  blockUser: (userId: string, friendId: string) => Promise<void>;
  fetchAchievements: (userId: string) => Promise<void>;
  unlockAchievement: (
    userId: string,
    achievementType: string,
    data?: any
  ) => Promise<void>;
  updateUserStats: (userId: string) => Promise<void>;
  setError: (error: string | null) => void;
  clearError: () => void;
};

export const useUserStore = create<UserState>((set, get) => ({
  // Initial state
  users: [],
  connections: [],
  pendingRequests: [],
  achievements: [],
  isLoading: false,
  error: null,

  // Fetch user by ID
  fetchUserById: async (userId) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      return data;
    } catch (error: any) {
      set({ error: error.message });
      return null;
    }
  },

  // Fetch multiple users by IDs
  fetchUsersByIds: async (userIds) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .in('id', userIds);

      if (error) throw error;
      return data || [];
    } catch (error: any) {
      set({ error: error.message });
      return [];
    }
  },

  // Search users
  searchUsers: async (query) => {
    try {
      set({ isLoading: true, error: null });

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .or(`username.ilike.%${query}%,display_name.ilike.%${query}%`)
        .limit(20);

      if (error) throw error;

      set({ users: data || [], isLoading: false });
      return data || [];
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      return [];
    }
  },

  // Fetch connections
  fetchConnections: async (userId) => {
    try {
      set({ isLoading: true, error: null });

      const { data, error } = await supabase
        .from('connections')
        .select(`
          *,
          friend:profiles!connections_friend_id_fkey(*)
        `)
        .eq('user_id', userId)
        .eq('status', 'accepted')
        .order('created_at', { ascending: false });

      if (error) throw error;
      set({ connections: data || [], isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  // Fetch pending requests
  fetchPendingRequests: async (userId) => {
    try {
      set({ isLoading: true, error: null });

      const { data, error } = await supabase
        .from('connections')
        .select(`
          *,
          friend:profiles!connections_user_id_fkey(*)
        `)
        .eq('friend_id', userId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      set({ pendingRequests: data || [], isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  // Send connection request
  sendConnectionRequest: async (userId, friendId) => {
    try {
      set({ isLoading: true, error: null });

      const { error } = await supabase.from('connections').insert({
        user_id: userId,
        friend_id: friendId,
        status: 'pending',
      });

      if (error) throw error;
      set({ isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  // Accept connection request
  acceptConnectionRequest: async (connectionId) => {
    try {
      set({ isLoading: true, error: null });

      const { data: connection, error: fetchError } = await supabase
        .from('connections')
        .select('*')
        .eq('id', connectionId)
        .single();

      if (fetchError) throw fetchError;

      // Update the request status
      const { error: updateError } = await supabase
        .from('connections')
        .update({ status: 'accepted' })
        .eq('id', connectionId);

      if (updateError) throw updateError;

      // Create reciprocal connection
      const { error: insertError } = await supabase.from('connections').insert({
        user_id: connection.friend_id,
        friend_id: connection.user_id,
        status: 'accepted',
      });

      if (insertError) throw insertError;

      // Refresh pending requests
      await get().fetchPendingRequests(connection.friend_id);
      await get().fetchConnections(connection.friend_id);

      set({ isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  // Reject connection request
  rejectConnectionRequest: async (connectionId) => {
    try {
      set({ isLoading: true, error: null });

      const { error } = await supabase
        .from('connections')
        .delete()
        .eq('id', connectionId);

      if (error) throw error;

      set({
        pendingRequests: get().pendingRequests.filter((r) => r.id !== connectionId),
        isLoading: false,
      });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  // Remove connection
  removeConnection: async (connectionId) => {
    try {
      set({ isLoading: true, error: null });

      // Get connection details
      const { data: connection } = await supabase
        .from('connections')
        .select('*')
        .eq('id', connectionId)
        .single();

      if (connection) {
        // Delete both directions of the connection
        await supabase
          .from('connections')
          .delete()
          .or(
            `and(user_id.eq.${connection.user_id},friend_id.eq.${connection.friend_id}),and(user_id.eq.${connection.friend_id},friend_id.eq.${connection.user_id})`
          );
      }

      set({
        connections: get().connections.filter((c) => c.id !== connectionId),
        isLoading: false,
      });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  // Block user
  blockUser: async (userId, friendId) => {
    try {
      set({ isLoading: true, error: null });

      // Remove existing connection if any
      await supabase
        .from('connections')
        .delete()
        .or(
          `and(user_id.eq.${userId},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${userId})`
        );

      // Create block
      const { error } = await supabase.from('connections').insert({
        user_id: userId,
        friend_id: friendId,
        status: 'blocked',
      });

      if (error) throw error;

      await get().fetchConnections(userId);
      set({ isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  // Fetch achievements
  fetchAchievements: async (userId) => {
    try {
      set({ isLoading: true, error: null });

      const { data, error } = await supabase
        .from('user_achievements')
        .select('*')
        .eq('user_id', userId)
        .order('unlocked_at', { ascending: false });

      if (error) throw error;
      set({ achievements: data || [], isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  // Unlock achievement
  unlockAchievement: async (userId, achievementType, data) => {
    try {
      const { error } = await supabase.from('user_achievements').insert({
        user_id: userId,
        achievement_type: achievementType,
        achievement_data: data,
      });

      if (error) throw error;

      await get().fetchAchievements(userId);
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  // Update user stats
  updateUserStats: async (userId) => {
    try {
      // Fetch updated profile
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;

      // Check for achievements
      if (data.total_parties_hosted === 1) {
        await get().unlockAchievement(userId, 'first_party', {
          title: 'Party Starter',
          description: 'Hosted your first party!',
          icon: '🎉',
        });
      }

      if (data.total_parties_attended === 10) {
        await get().unlockAchievement(userId, 'social_butterfly', {
          title: 'Social Butterfly',
          description: 'Attended 10 parties!',
          icon: '🦋',
        });
      }

      if (data.party_streak >= 7) {
        await get().unlockAchievement(userId, 'party_week', {
          title: 'Party Week',
          description: '7 day party streak!',
          icon: '🔥',
        });
      }
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  // Set error
  setError: (error) => set({ error }),

  // Clear error
  clearError: () => set({ error: null }),
}));
