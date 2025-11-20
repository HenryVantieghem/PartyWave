import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️ Supabase environment variables are missing. Please check your .env file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Database Types
export type Profile = {
  id: string;
  username: string;
  display_name: string;
  bio?: string;
  avatar_url?: string;
  party_score: number;
  total_parties_hosted: number;
  total_parties_attended: number;
  party_streak: number;
  location?: string;
  created_at: string;
};

export type Party = {
  id: string;
  name: string;
  description?: string;
  host_id: string;
  date_time: string;
  location_name: string;
  location_address?: string;
  latitude?: number;
  longitude?: number;
  cover_image_url?: string;
  max_attendees?: number;
  energy_score: number;
  status: 'upcoming' | 'happening' | 'ended';
  invite_code?: string;
  is_private: boolean;
  created_at: string;
  host?: Profile;
};

export type PartyAttendee = {
  id: string;
  party_id: string;
  user_id: string;
  status: 'invited' | 'confirmed' | 'checked_in' | 'no_show';
  checked_in_at?: string;
  joined_at: string;
  user?: Profile;
};

export type PartyRequirement = {
  id: string;
  party_id: string;
  title: string;
  description?: string;
  quantity_needed: number;
  quantity_claimed: number;
  price_estimate?: number;
  created_at: string;
};

export type RequirementClaim = {
  id: string;
  requirement_id: string;
  user_id: string;
  quantity: number;
  status: 'claimed' | 'fulfilled';
  created_at: string;
  user?: Profile;
};

export type PartyMemory = {
  id: string;
  party_id: string;
  user_id: string;
  media_url: string;
  media_type: 'photo' | 'video';
  caption?: string;
  is_story: boolean;
  created_at: string;
  user?: Profile;
};

export type Connection = {
  id: string;
  user_id: string;
  friend_id: string;
  status: 'pending' | 'accepted' | 'blocked';
  created_at: string;
  friend?: Profile;
};

export type PartyMessage = {
  id: string;
  party_id: string;
  user_id: string;
  message: string;
  message_type: 'text' | 'image' | 'system';
  created_at: string;
  user?: Profile;
};

export type UserAchievement = {
  id: string;
  user_id: string;
  achievement_type: string;
  achievement_data?: any;
  unlocked_at: string;
};

// Helper functions
export const uploadFile = async (
  bucket: string,
  path: string,
  file: File | Blob,
  contentType?: string
) => {
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      contentType,
      upsert: false,
    });

  if (error) throw error;
  return data;
};

export const getPublicUrl = (bucket: string, path: string) => {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
};

export const deleteFile = async (bucket: string, path: string) => {
  const { error } = await supabase.storage.from(bucket).remove([path]);
  if (error) throw error;
};

// Upload file from URI (React Native)
export const uploadFileFromUri = async (
  bucket: string,
  path: string,
  uri: string,
  contentType: string = 'image/jpeg'
) => {
  try {
    // Fetch the file from the URI
    const response = await fetch(uri);
    const blob = await response.blob();

    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, blob, {
        contentType,
        upsert: false,
      });

    if (error) throw error;
    return data;
  } catch (error) {
    throw error;
  }
};
