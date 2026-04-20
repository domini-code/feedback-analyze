"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function SignInPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") ?? "/";
  const oauthError = searchParams.get("error");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(
    oauthError === "oauth_exchange_failed"
      ? "No pudimos completar el inicio con Google. Inténtalo de nuevo."
      : null
  );
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setIsLoading(false);

    if (signInError) {
      setError("Email o contraseña incorrectos");
      return;
    }

    router.replace(redirectTo);
    router.refresh();
  }

  async function handleGoogle() {
    setError(null);
    const supabase = createClient();
    const callback = new URL("/auth/callback", window.location.origin);
    callback.searchParams.set("next", redirectTo);
    const { error: googleError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: callback.toString() },
    });
    if (googleError) setError(googleError.message);
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
          Bienvenido de vuelta
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Inicia sesión para analizar tu feedback.
        </p>
      </div>

      <button
        type="button"
        onClick={handleGoogle}
        className="inline-flex items-center justify-center gap-2 rounded-lg border border-zinc-200 bg-white px-4 py-2.5 text-sm font-medium text-zinc-800 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
      >
        Continue with Google
      </button>

      <div className="flex items-center gap-3 text-xs uppercase tracking-wider text-zinc-400">
        <div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-700" />
        o usa tu email
        <div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-700" />
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <label className="flex flex-col gap-1 text-sm text-zinc-700 dark:text-zinc-300">
          Email
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-zinc-400 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-zinc-700 dark:text-zinc-300">
          Contraseña
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-zinc-400 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
          />
        </label>

        {error && (
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="mt-2 rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          {isLoading ? "Entrando…" : "Iniciar sesión"}
        </button>
      </form>

      <p className="text-center text-sm text-zinc-500 dark:text-zinc-400">
        ¿No tienes cuenta?{" "}
        <Link
          href={`/sign-up${redirectTo !== "/" ? `?redirectTo=${encodeURIComponent(redirectTo)}` : ""}`}
          className="font-medium text-zinc-900 underline-offset-2 hover:underline dark:text-zinc-100"
        >
          Regístrate
        </Link>
      </p>
    </div>
  );
}
