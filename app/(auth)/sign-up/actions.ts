"use server";

import { createClient } from "@/lib/supabase/server";
import { sendWelcomeEmail } from "@/lib/email";

export interface SignUpResult {
  error?: string;
  requiresConfirmation?: boolean;
}

export async function signUpWithEmail(email: string, password: string): Promise<SignUpResult> {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signUp({ email, password });

  if (error) {
    return { error: error.message };
  }

  // Fire-and-forget: a Resend failure must never break the sign-up flow.
  if (data.user) {
    sendWelcomeEmail(email).catch(() => {});
  }

  if (!data.session) {
    return { requiresConfirmation: true };
  }

  return {};
}
