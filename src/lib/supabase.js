import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const isConfigured = supabaseUrl && supabaseAnonKey && !supabaseUrl.includes('YOUR_PROJECT') && !supabaseAnonKey.includes('YOUR_');

if (!isConfigured) {
  console.error('[Supabase] Configuration incomplete. Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY.');
  console.error('Please copy .env.template to .env.local and add your Supabase credentials.');
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder',
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  }
);

export const isSupabaseConfigured = isConfigured;
