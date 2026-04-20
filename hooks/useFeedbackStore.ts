"use client";

import { useEffect, useState } from "react";
import type { FeedbackItem } from "@/lib/types";

const STORAGE_KEY = "feedback-items";

function loadFromStorage(): FeedbackItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as FeedbackItem[];
  } catch {
    return [];
  }
}

function saveToStorage(items: FeedbackItem[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // localStorage might be full or unavailable — fail silently
  }
}

export function useFeedbackStore() {
  const [items, setItems] = useState<FeedbackItem[]>([]);

  // Read from localStorage on mount. We can't use a lazy useState initializer
  // because localStorage is unavailable during SSR — hydrating from an effect
  // is the documented pattern here.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setItems(loadFromStorage());
  }, []);

  // Write to localStorage on every change
  useEffect(() => {
    saveToStorage(items);
  }, [items]);

  function addItems(newItems: FeedbackItem[]) {
    setItems((prev) => [...newItems, ...prev]);
  }

  return { items, addItems };
}
