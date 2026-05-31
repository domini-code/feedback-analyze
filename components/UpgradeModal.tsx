"use client";

import { useState } from "react";

interface UpgradeModalProps {
  open: boolean;
  onClose: () => void;
  limit: number;
}

export function UpgradeModal({ open, onClose, limit }: UpgradeModalProps) {
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  async function handleUpgrade() {
    setIsRedirecting(true);
    setError(null);
    try {
      const res = await fetch("/api/checkout", { method: "POST" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? `HTTP ${res.status}`);
      }
      const { url } = (await res.json()) as { url: string | null };
      if (!url) throw new Error("No checkout URL returned.");
      window.location.href = url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setIsRedirecting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="upgrade-modal-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-700 dark:bg-zinc-900"
        onClick={(e) => e.stopPropagation()}
      >
        <h2
          id="upgrade-modal-title"
          className="text-lg font-semibold text-zinc-900 dark:text-zinc-50"
        >
          Has alcanzado el límite gratuito
        </h2>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
          El plan gratuito incluye {limit} análisis por mes. Pasa a{" "}
          <span className="font-medium text-zinc-900 dark:text-zinc-50">Pro</span> por
          $9.99/mes para realizar análisis ilimitados.
        </p>

        {error && (
          <p className="mt-3 text-sm text-red-600 dark:text-red-400">Error: {error}</p>
        )}

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800"
          >
            Ahora no
          </button>
          <button
            type="button"
            onClick={handleUpgrade}
            disabled={isRedirecting}
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-60 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            {isRedirecting ? "Redirigiendo…" : "Pasar a Pro"}
          </button>
        </div>
      </div>
    </div>
  );
}
