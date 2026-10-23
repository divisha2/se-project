import { createClient } from '@supabase/supabase-js';
import { env } from './env';

// Server-side client (service role). Used for Storage only; never expose this key to the frontend.
export const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

export const STORAGE_BUCKET = env.SUPABASE_STORAGE_BUCKET;
