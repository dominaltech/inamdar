import { createClient } from '@supabase/supabase-js';

// Get Supabase URL and Key from Vite environment variables or localStorage
const envUrl = import.meta.env.VITE_SUPABASE_URL || '';
const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

const storedUrl = typeof window !== 'undefined' ? (localStorage.getItem('inamdar_supabase_url') || '') : '';
const storedKey = typeof window !== 'undefined' ? (localStorage.getItem('inamdar_supabase_key') || '') : '';

export const SUPABASE_URL = storedUrl || envUrl;
export const SUPABASE_ANON_KEY = storedKey || envKey;

export const isSupabaseConfigured = () => {
  return Boolean(
    SUPABASE_URL && 
    SUPABASE_ANON_KEY && 
    !SUPABASE_URL.includes('your-project-id') &&
    SUPABASE_URL.startsWith('http')
  );
};

// Create client with fallback dummy client if not configured yet to prevent runtime crashes
export const supabase = isSupabaseConfigured()
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    })
  : createClient('https://placeholder.supabase.co', 'placeholder-anon-key');

export const saveSupabaseCredentials = (url, key) => {
  if (url) localStorage.setItem('inamdar_supabase_url', url.trim());
  if (key) localStorage.setItem('inamdar_supabase_key', key.trim());
  window.location.reload();
};
