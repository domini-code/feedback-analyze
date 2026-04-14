"use client";

import type { FeedbackCategory, FeedbackItem } from "@/lib/types";

const CATEGORIES: { value: FeedbackCategory; label: string }[] = [
  { value: "bug", label: "Bug" },
  { value: "feature_request", label: "Feature Request" },
  { value: "elogio", label: "Elogio" },
  { value: "pain_point", label: "Pain Point" },
  { value: "no_clasificable", label: "No clasificable" },
];

const ACTIVE_COLORS: Record<FeedbackCategory, string> = {
  bug: "bg-red-600 text-white border-red-600",
  feature_request: "bg-blue-600 text-white border-blue-600",
  elogio: "bg-green-600 text-white border-green-600",
  pain_point: "bg-yellow-500 text-white border-yellow-500",
  no_clasificable: "bg-zinc-600 text-white border-zinc-600",
  error: "bg-zinc-600 text-white border-zinc-600",
};

interface FeedbackFiltersProps {
  items: FeedbackItem[];
  activeFilters: FeedbackCategory[];
  onToggle: (category: FeedbackCategory) => void;
}

export function FeedbackFilters({
  items,
  activeFilters,
  onToggle,
}: FeedbackFiltersProps) {
  const counts = CATEGORIES.reduce<Record<string, number>>((acc, { value }) => {
    acc[value] = items.filter((item) => item.category === value).length;
    return acc;
  }, {});

  return (
    <div className="flex flex-wrap gap-2">
      {CATEGORIES.map(({ value, label }) => {
        const isActive = activeFilters.includes(value);
        const count = counts[value] ?? 0;

        return (
          <button
            key={value}
            onClick={() => onToggle(value)}
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
              isActive
                ? ACTIVE_COLORS[value]
                : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800"
            }`}
          >
            {label}
            <span
              className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                isActive
                  ? "bg-white/20"
                  : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
              }`}
            >
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
}
