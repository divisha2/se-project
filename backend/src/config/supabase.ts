import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { env } from './env';

export const isSupabaseStorageConfigured = (): boolean => {
  const key = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key || key.trim() === '' || key.includes('<') || /[^\x00-\xFF]/.test(key)) {
    return false;
  }
  return Boolean(env.SUPABASE_URL);
};

// Server-side client (service role). Used for Storage only; never expose this key to the frontend.
export const supabase: SupabaseClient | null = isSupabaseStorageConfigured() && env.SUPABASE_URL
  ? createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    })
  : null;

export const STORAGE_BUCKET = env.SUPABASE_STORAGE_BUCKET;
