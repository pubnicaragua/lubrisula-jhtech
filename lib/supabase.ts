import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// These will be loaded from environment variables
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    'Supabase URL or Anon Key not found. Please set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY environment variables.'
  );
}

// Create a custom AsyncStorage adapter for Supabase
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: Platform.OS !== 'web', // Disable URL session detection for web
  },
});

// Helper function to handle Supabase errors
const handleSupabaseError = (error: any, context: string) => {
  console.error(`Supabase Error (${context}):`, error);
  throw new Error(`Error ${context}: ${error.message}`);
};

export const supabaseService = {
  // Client methods
  auth: {
    signIn: async (email: string, password: string) => {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        return data;
      } catch (error) {
        handleSupabaseError(error, 'signing in');
      }
    },
    
    signOut: async () => {
      try {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
      } catch (error) {
        handleSupabaseError(error, 'signing out');
      }
    },
    
    getSession: async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;
        return data.session;
      } catch (error) {
        handleSupabaseError(error, 'getting session');
      }
    },
    
    getUser: async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error) throw error;
        return user;
      } catch (error) {
        handleSupabaseError(error, 'getting user');
      }
    },
  },
  
  // Data methods
  from: (table: string) => supabase.from(table),
  
  // Custom queries
  fetchWithAuth: async (table: string, query: string, headers: Record<string, string> = {}) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch(`${supabaseUrl}/rest/v1/${table}?${query}`, {
        headers: {
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${session?.access_token}`,
          'Content-Type': 'application/json',
          ...headers,
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      handleSupabaseError(error, `fetching from ${table}`);
    }
  },
};

export default supabase;
