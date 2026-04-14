"use client";

import { useState } from "react";

interface FeedbackInputProps {
  onSubmit: (entries: string[]) => void;
  isLoading: boolean;
}

const MAX_ENTRIES = 50;

export function FeedbackInput({ onSubmit, isLoading }: FeedbackInputProps) {
  const [text, setText] = useState("");

  const entries = text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  const overLimit = entries.length > MAX_ENTRIES;
  const canSubmit = entries.length > 0 && !overLimit && !isLoading;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    onSubmit(entries);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <label
        htmlFor="feedback-textarea"
        className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
      >
        Feedback — one entry per line
        <span className="ml-2 text-zinc-400 font-normal">
          ({entries.length}/{MAX_ENTRIES})
        </span>
      </label>

      <textarea
        id="feedback-textarea"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={"The app crashes when I upload a PDF\nWould love dark mode\nGreat onboarding experience!"}
        rows={6}
        className="w-full resize-y rounded-lg border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 placeholder-zinc-400 focus:border-zinc-400 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder-zinc-500"
        disabled={isLoading}
      />

      {overLimit && (
        <p className="text-sm text-red-600 dark:text-red-400">
          Too many entries ({entries.length}). Maximum is {MAX_ENTRIES} lines per
          submission.
        </p>
      )}

      <button
        type="submit"
        disabled={!canSubmit}
        className="flex items-center justify-center gap-2 self-end rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
      >
        {isLoading ? (
          <>
            <Spinner />
            Classifying…
          </>
        ) : (
          "Classify"
        )}
      </button>
    </form>
  );
}

function Spinner() {
  return (
    <svg
      className="h-4 w-4 animate-spin"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
      />
    </svg>
  );
}
