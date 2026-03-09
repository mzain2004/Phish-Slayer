import { createClient } from '@/lib/supabase/server';
import type { UserRole } from './roles';

export async function getServerRole(): Promise<UserRole | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  
  const { data } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();
    
  return (data?.role as UserRole) || 'analyst';
}
