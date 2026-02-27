import { createClient } from '@supabase/supabase-js';
import { safeStorage } from '@/lib/safeStorage';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ?? import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

if (!isSupabaseConfigured) {
  console.error(
    '[supabaseClient] Missing Supabase configuration. Define VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY (or VITE_SUPABASE_PUBLISHABLE_KEY) in your environment.'
  );
}

const resolvedSupabaseUrl = supabaseUrl || 'https://invalid.supabase.local';
const resolvedSupabaseAnonKey = supabaseAnonKey || 'invalid-anon-key';

export const supabase = createClient(resolvedSupabaseUrl, resolvedSupabaseAnonKey, {
  auth: {
    storage: safeStorage,
    autoRefreshToken: true,
    persistSession: true,
    // We handle OAuth redirect/code exchange explicitly in SupabaseAuthContext.
    detectSessionInUrl: false,
    // Force browser OAuth implicit flow to avoid PKCE exchange issues in this project.
    flowType: 'implicit',
  },
});

// Public-only client to avoid using any persisted session (which may carry restricted roles).
export const supabasePublic = createClient(resolvedSupabaseUrl, resolvedSupabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
    // Isolate public client auth state to avoid PKCE flow-state collisions.
    storageKey: 'gatoencerrado-public-auth',
  },
  global: {
    headers: {
      apikey: resolvedSupabaseAnonKey,
      Authorization: `Bearer ${resolvedSupabaseAnonKey}`,
    },
  },
});

export { isSupabaseConfigured };
