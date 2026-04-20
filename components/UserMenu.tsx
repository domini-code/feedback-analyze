"use client";

import { useEffect, useRef, useState } from "react";
import { signOut } from "@/lib/auth/actions";

interface UserMenuProps {
  email: string;
  avatarUrl: string | null;
}

export function UserMenu({ email, avatarUrl }: UserMenuProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const initials = email ? email[0]?.toUpperCase() : "?";

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full border border-zinc-200 bg-zinc-100 text-xs font-semibold text-zinc-700 transition-colors hover:border-zinc-300 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
        aria-haspopup="menu"
        aria-expanded={open}
        title={email}
      >
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          initials
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-20 mt-2 w-56 overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
          <div className="border-b border-zinc-100 px-3 py-2 text-xs text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
            {email}
          </div>
          <form action={signOut}>
            <button
              type="submit"
              className="block w-full px-3 py-2 text-left text-sm text-zinc-700 hover:bg-zinc-50 dark:text-zinc-200 dark:hover:bg-zinc-800"
            >
              Cerrar sesión
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
