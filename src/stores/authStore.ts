import { create } from 'zustand';
import { User, Session } from '@supabase/supabase-js';
import { Profile } from '@/lib/supabase';
import * as authLib from '@/lib/auth';

type AuthState = {
  // State
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;

  // Actions
  signUp: (data: {
    email: string;
    password: string;
    username: string;
    displayName: string;
  }) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  loadSession: () => Promise<void>;
  loadProfile: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  setError: (error: string | null) => void;
  clearError: () => void;
};

export const useAuthStore = create<AuthState>((set, get) => ({
  // Initial state
  user: null,
  session: null,
  profile: null,
  isLoading: false,
  isAuthenticated: false,
  error: null,

  // Sign up
  signUp: async (data) => {
    try {
      set({ isLoading: true, error: null });
      const { user, session } = await authLib.signUp(data);
      set({
        user,
        session,
        isAuthenticated: !!user,
        isLoading: false,
      });
      if (user) {
        await get().loadProfile();
      }
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  // Sign in
  signIn: async (email, password) => {
    try {
      set({ isLoading: true, error: null });
      const { user, session } = await authLib.signIn({ email, password });
      set({
        user,
        session,
        isAuthenticated: !!user,
        isLoading: false,
      });
      if (user) {
        await get().loadProfile();
      }
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  // Sign out
  signOut: async () => {
    try {
      set({ isLoading: true, error: null });
      await authLib.signOut();
      set({
        user: null,
        session: null,
        profile: null,
        isAuthenticated: false,
        isLoading: false,
      });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  // Load session
  loadSession: async () => {
    try {
      set({ isLoading: true });
      const session = await authLib.getSession();
      const user = session?.user || null;
      set({
        user,
        session,
        isAuthenticated: !!user,
        isLoading: false,
      });
      if (user) {
        await get().loadProfile();
      }
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  // Load profile
  loadProfile: async () => {
    try {
      const { user } = get();
      if (!user) return;

      const { supabase } = await import('@/lib/supabase');
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      set({ profile: data });
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  // Update profile
  updateProfile: async (updates) => {
    try {
      const { user, profile } = get();
      if (!user || !profile) return;

      const { supabase } = await import('@/lib/supabase');
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single();

      if (error) throw error;
      set({ profile: data });
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    }
  },

  // Reset password
  resetPassword: async (email) => {
    try {
      set({ isLoading: true, error: null });
      await authLib.resetPassword(email);
      set({ isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  // Set error
  setError: (error) => set({ error }),

  // Clear error
  clearError: () => set({ error: null }),
}));
