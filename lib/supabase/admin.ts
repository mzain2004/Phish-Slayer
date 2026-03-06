import { createClient } from '@supabase/supabase-js';

// Note: This relies on SUPABASE_SERVICE_ROLE_KEY environment variable.
// It bypasses Row Level Security (RLS) entirely. Never use this on the client.
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);
