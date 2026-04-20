import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppHeader } from "@/components/AppHeader";
import { Analyzer } from "@/components/Analyzer";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Middleware already redirects anonymous visitors, but we re-check here so
  // the Server Component never renders without a user in scope.
  if (!user) redirect("/sign-in");

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-8">
        <AppHeader user={user} />
        <Analyzer />
      </div>
    </div>
  );
}
