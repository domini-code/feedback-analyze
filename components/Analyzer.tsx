"use client";

import { useState } from "react";
import { FeedbackInput } from "@/components/FeedbackInput";
import { FeedbackFilters } from "@/components/FeedbackFilters";
import { FeedbackCardGrid } from "@/components/FeedbackCardGrid";
import { useFeedbackStore } from "@/hooks/useFeedbackStore";
import type { AnalyzeFeedbackResponse, FeedbackCategory, FeedbackItem } from "@/lib/types";

export function Analyzer() {
  const { items, addItems } = useFeedbackStore();
  const [activeFilters, setActiveFilters] = useState<FeedbackCategory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  function toggleFilter(category: FeedbackCategory) {
    setActiveFilters((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    );
  }

  const visibleItems =
    activeFilters.length === 0
      ? items
      : items.filter((item) => activeFilters.includes(item.category));

  async function handleSubmit(entries: string[]) {
    setIsLoading(true);
    setPendingCount(entries.length);
    setError(null);

    try {
      const res = await fetch("/api/analyze-feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feedback: entries.join("\n") }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? `HTTP ${res.status}`);
      }

      const data: AnalyzeFeedbackResponse = await res.json();

      const newItems: FeedbackItem[] = data.items.map((item, i) => ({
        id: `${Date.now()}-${i}`,
        text: item.text,
        category: item.category,
        sentiment: item.sentiment,
        createdAt: new Date().toISOString(),
      }));

      addItems(newItems);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setIsLoading(false);
      setPendingCount(0);
    }
  }

  return (
    <>
      <section className="mb-8 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
        <FeedbackInput onSubmit={handleSubmit} isLoading={isLoading} />
        {error && (
          <p className="mt-3 text-sm text-red-600 dark:text-red-400">
            Error: {error}
          </p>
        )}
      </section>

      {(items.length > 0 || isLoading) && (
        <section className="mb-4">
          <FeedbackFilters
            items={items}
            activeFilters={activeFilters}
            onToggle={toggleFilter}
          />
        </section>
      )}

      <FeedbackCardGrid
        items={visibleItems}
        isLoading={isLoading}
        skeletonCount={pendingCount}
      />
    </>
  );
}
