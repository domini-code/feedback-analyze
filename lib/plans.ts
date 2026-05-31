import { createClient } from "@/lib/supabase/server";

export type Plan = "free" | "pro";

/**
 * Returns the billing plan for the given user. A user with no row in
 * `user_plans` is treated as `free`, so callers never have to special-case a
 * missing record. Reads via the user-scoped server client (RLS-allowed select).
 */
export async function getUserPlan(userId: string): Promise<Plan> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("user_plans")
    .select("plan")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to fetch plan for user ${userId}: ${error.message}`);
  }

  return data?.plan === "pro" ? "pro" : "free";
}
