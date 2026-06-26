import { createClient, SupabaseClient } from '@supabase/supabase-js';

const globalForSupabaseAdmin = globalThis as unknown as {
  supabaseAdmin: SupabaseClient | undefined;
};

function createAdminClientInstance() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error('Missing Supabase environment variables for Admin Client');
  }

  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

export const createAdminClient = () => {
  const client = globalForSupabaseAdmin.supabaseAdmin ?? createAdminClientInstance();
  if (process.env.NODE_ENV !== 'production') {
    globalForSupabaseAdmin.supabaseAdmin = client;
  }
  return client;
};
