import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppHeader } from "@/components/AppHeader";
import { FeedbackCardGrid } from "@/components/FeedbackCardGrid";
import type { AnalyzeFeedbackResponse, FeedbackItem } from "@/lib/types";

interface AnalysisRow {
  id: string;
  created_at: string;
  input_text: string;
  items: AnalyzeFeedbackResponse["items"];
  summary: AnalyzeFeedbackResponse["summary"];
}

const SENTIMENT_COLORS: Record<string, string> = {
  positive: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  negative: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
  neutral: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
  mixed: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
};

export default async function AnalysisDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect(`/sign-in?redirectTo=/history/${id}`);

  const { data: analysis } = await supabase
    .from("analyses")
    .select("id, created_at, input_text, items, summary")
    .eq("id", id)
    .maybeSingle();

  if (!analysis) notFound();

  const row = analysis as AnalysisRow;
  const date = new Date(row.created_at);

  const feedbackItems: FeedbackItem[] = row.items.map((item, i) => ({
    id: `${row.id}-${i}`,
    text: item.text,
    category: item.category,
    sentiment: item.sentiment,
    createdAt: row.created_at,
  }));

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-8">
        <AppHeader user={user} />

        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <Link
              href="/history"
              className="text-sm text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
            >
              ← Volver al historial
            </Link>
            <h2 className="mt-2 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              Análisis del{" "}
              {date.toLocaleDateString(undefined, {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </h2>
          </div>
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${SENTIMENT_COLORS[row.summary.overall_sentiment] ?? SENTIMENT_COLORS.neutral}`}
          >
            {row.summary.overall_sentiment}
          </span>
        </div>

        <section className="mb-6 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            Feedback original
          </h3>
          <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-zinc-800 dark:text-zinc-200">
            {row.input_text}
          </pre>
        </section>

        <FeedbackCardGrid items={feedbackItems} />
      </div>
    </div>
  );
}
