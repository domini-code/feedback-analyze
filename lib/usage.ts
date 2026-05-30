import { createClient } from '@/lib/supabase/server';

/**
 * Returns how many analyses the given user has created since the first day of
 * the current calendar month. Returns 0 when there are none.
 *
 * @throws if the Supabase query fails.
 */
export async function getMonthlyUsage(userId: string): Promise<number> {
  const supabase = await createClient();

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const { count, error } = await supabase
    .from('analyses')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', startOfMonth.toISOString());

  if (error) {
    throw new Error(`Failed to fetch monthly usage for user ${userId}: ${error.message}`);
  }

  return count ?? 0;
}
