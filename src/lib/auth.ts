import { supabase } from './supabase';
import { handleError } from './utils';

export type AuthError = {
  message: string;
  code?: string;
};

export type SignUpData = {
  email: string;
  password: string;
  username: string;
  displayName: string;
};

export type SignInData = {
  email: string;
  password: string;
};

// Sign up with email and password
export const signUp = async ({ email, password, username, displayName }: SignUpData) => {
  try {
    // Check if username is already taken
    const { data: existingUser } = await supabase
      .from('profiles')
      .select('username')
      .eq('username', username)
      .single();

    if (existingUser) {
      throw new Error('Username is already taken');
    }

    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username,
          display_name: displayName,
        },
      },
    });

    if (authError) throw authError;

    // Create profile
    if (authData.user) {
      const { error: profileError } = await supabase.from('profiles').insert({
        id: authData.user.id,
        username,
        display_name: displayName,
        party_score: 0,
        total_parties_hosted: 0,
        total_parties_attended: 0,
        party_streak: 0,
      });

      if (profileError) throw profileError;
    }

    return { user: authData.user, session: authData.session };
  } catch (error) {
    throw new Error(handleError(error));
  }
};

// Sign in with email and password
export const signIn = async ({ email, password }: SignInData) => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    return { user: data.user, session: data.session };
  } catch (error) {
    throw new Error(handleError(error));
  }
};

// Sign out
export const signOut = async () => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  } catch (error) {
    throw new Error(handleError(error));
  }
};

// Get current session
export const getSession = async () => {
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    return data.session;
  } catch (error) {
    throw new Error(handleError(error));
  }
};

// Get current user
export const getCurrentUser = async () => {
  try {
    const { data, error } = await supabase.auth.getUser();
    if (error) throw error;
    return data.user;
  } catch (error) {
    throw new Error(handleError(error));
  }
};

// Reset password
export const resetPassword = async (email: string) => {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'thehangout://reset-password',
    });
    if (error) throw error;
  } catch (error) {
    throw new Error(handleError(error));
  }
};

// Update password
export const updatePassword = async (newPassword: string) => {
  try {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    if (error) throw error;
  } catch (error) {
    throw new Error(handleError(error));
  }
};

// Listen to auth state changes
export const onAuthStateChange = (callback: (event: string, session: any) => void) => {
  return supabase.auth.onAuthStateChange(callback);
};
