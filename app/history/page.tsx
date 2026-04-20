import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppHeader } from "@/components/AppHeader";
import type { AnalyzeFeedbackResponse } from "@/lib/types";

interface AnalysisRow {
  id: string;
  created_at: string;
  summary: AnalyzeFeedbackResponse["summary"];
}

const SENTIMENT_COLORS: Record<string, string> = {
  positive: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  negative: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
  neutral: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
  mixed: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
};

export default async function HistoryPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/sign-in?redirectTo=/history");

  const { data: analyses } = await supabase
    .from("analyses")
    .select("id, created_at, summary")
    .order("created_at", { ascending: false });

  const rows = (analyses ?? []) as AnalysisRow[];

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-8">
        <AppHeader user={user} />

        <h2 className="mb-6 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          Tu historial
        </h2>

        {rows.length === 0 ? (
          <div className="rounded-xl border border-dashed border-zinc-300 bg-white p-10 text-center dark:border-zinc-700 dark:bg-zinc-900">
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Todavía no has analizado feedback.
            </p>
            <Link
              href="/"
              className="mt-4 inline-block rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
            >
              Analizar mi primer feedback
            </Link>
          </div>
        ) : (
          <ul className="flex flex-col gap-2">
            {rows.map((row) => {
              const date = new Date(row.created_at);
              const sentiment = row.summary.overall_sentiment;
              return (
                <li key={row.id}>
                  <Link
                    href={`/history/${row.id}`}
                    className="flex items-center justify-between gap-4 rounded-xl border border-zinc-200 bg-white px-4 py-3 shadow-sm transition-colors hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:border-zinc-600 dark:hover:bg-zinc-800"
                  >
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                        {date.toLocaleDateString(undefined, {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                        <span className="ml-2 text-xs text-zinc-400">
                          {date.toLocaleTimeString(undefined, {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </span>
                      <span className="text-xs text-zinc-500 dark:text-zinc-400">
                        {row.summary.total} {row.summary.total === 1 ? "item" : "items"}
                      </span>
                    </div>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${SENTIMENT_COLORS[sentiment] ?? SENTIMENT_COLORS.neutral}`}
                    >
                      {sentiment}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
