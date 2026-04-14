import type { FeedbackCategory, Sentiment, FeedbackItem } from "@/lib/types";

const CATEGORY_LABELS: Record<FeedbackCategory, string> = {
  bug: "Bug",
  feature_request: "Feature Request",
  elogio: "Elogio",
  pain_point: "Pain Point",
  no_clasificable: "No clasificable",
  error: "Error",
};

const CATEGORY_COLORS: Record<FeedbackCategory, string> = {
  bug: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
  feature_request: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  elogio: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  pain_point: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300",
  no_clasificable: "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400",
  error: "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400",
};

const SENTIMENT_ICONS: Record<Sentiment, string> = {
  positive: "↑",
  negative: "↓",
  neutral: "→",
};

const SENTIMENT_COLORS: Record<Sentiment, string> = {
  positive: "text-green-600 dark:text-green-400",
  negative: "text-red-500 dark:text-red-400",
  neutral: "text-zinc-400 dark:text-zinc-500",
};

interface FeedbackCardProps {
  item: FeedbackItem;
}

export function FeedbackCard({ item }: FeedbackCardProps) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
      <p className="text-sm leading-relaxed text-zinc-800 dark:text-zinc-200">
        {item.text}
      </p>
      <div className="flex items-center justify-between">
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${CATEGORY_COLORS[item.category]}`}
        >
          {CATEGORY_LABELS[item.category]}
        </span>
        <span
          className={`flex items-center gap-1 text-xs font-medium ${SENTIMENT_COLORS[item.sentiment]}`}
          title={item.sentiment}
        >
          <span aria-hidden="true">{SENTIMENT_ICONS[item.sentiment]}</span>
          {item.sentiment}
        </span>
      </div>
    </div>
  );
}

export function FeedbackCardSkeleton() {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
      <div className="space-y-2">
        <div className="h-3 w-full animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" />
        <div className="h-3 w-4/5 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" />
        <div className="h-3 w-3/5 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" />
      </div>
      <div className="flex items-center justify-between">
        <div className="h-5 w-24 animate-pulse rounded-full bg-zinc-200 dark:bg-zinc-700" />
        <div className="h-3 w-12 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" />
      </div>
    </div>
  );
}
