import type { FeedbackItem } from "@/lib/types";
import { FeedbackCard, FeedbackCardSkeleton } from "./FeedbackCard";

interface FeedbackCardGridProps {
  items: FeedbackItem[];
  skeletonCount?: number;
  isLoading?: boolean;
}

export function FeedbackCardGrid({
  items,
  skeletonCount = 0,
  isLoading = false,
}: FeedbackCardGridProps) {
  const showSkeletons = isLoading && skeletonCount > 0;

  if (!showSkeletons && items.length === 0) {
    return (
      <p className="py-16 text-center text-sm text-zinc-400 dark:text-zinc-500">
        No feedback classified yet. Enter some feedback above to get started.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {showSkeletons &&
        Array.from({ length: skeletonCount }).map((_, i) => (
          <FeedbackCardSkeleton key={`skeleton-${i}`} />
        ))}
      {items.map((item) => (
        <FeedbackCard key={item.id} item={item} />
      ))}
    </div>
  );
}
