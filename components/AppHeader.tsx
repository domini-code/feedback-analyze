import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import { UserMenu } from "./UserMenu";

interface AppHeaderProps {
  user: User;
}

export function AppHeader({ user }: AppHeaderProps) {
  return (
    <header className="mb-8 flex items-start justify-between gap-4">
      <div>
        <Link
          href="/"
          className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50"
        >
          Feedback Analyzer
        </Link>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Pega feedback de usuarios — un item por línea — y deja que Claude lo clasifique automáticamente.
        </p>
      </div>

      <nav className="flex items-center gap-4">
        <Link
          href="/history"
          className="text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
        >
          History
        </Link>
        <UserMenu email={user.email ?? ""} avatarUrl={user.user_metadata?.avatar_url ?? null} />
      </nav>
    </header>
  );
}
