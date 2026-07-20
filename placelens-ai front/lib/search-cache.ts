// lib/search-cache.ts
"use client";

type Listener = () => void;
let listeners: Listener[] = [];

export function invalidateSearchCache() {
  listeners.forEach((l) => l());
}

export function subscribeSearchInvalidation(listener: Listener): () => void {
  listeners.push(listener);
  return () => {
    listeners = listeners.filter((l) => l !== listener);
  };
}