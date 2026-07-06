import { cache } from 'react';
import { createClient } from '@/lib/supabase/server';

export const getAuthenticatedUser = cache(async () => {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
});
