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

  // Read from localStorage on mount
  useEffect(() => {
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
