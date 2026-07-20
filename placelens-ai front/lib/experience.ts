// lib/experience.ts
"use client";

import { useSyncExternalStore } from "react";

export interface ExperienceEntry {
  id: string;
  company: string;
  title: string;
  employmentType: string;
  startDate: string;
  endDate: string;
  isPresent: boolean;
  bullets: string[];
}

const STORAGE_KEY = "placelens_experience";

type Listener = () => void;
let listeners: Listener[] = [];
let cache: ExperienceEntry[] | null = null;

function loadFromStorage(): ExperienceEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveToStorage(items: ExperienceEntry[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // ignore quota errors
  }
}

function emitChange() {
  listeners.forEach((l) => l());
}

function getSnapshot(): ExperienceEntry[] {
  if (cache === null) {
    cache = loadFromStorage();
  }
  return cache;
}

function getServerSnapshot(): ExperienceEntry[] {
  return [];
}

function subscribe(listener: Listener): () => void {
  listeners.push(listener);
  return () => {
    listeners = listeners.filter((l) => l !== listener);
  };
}

export function useExperience(): ExperienceEntry[] {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export function addExperience(entry: Omit<ExperienceEntry, "id">) {
  const item: ExperienceEntry = {
    ...entry,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
  };
  const current = getSnapshot();
  const next = [item, ...current];
  cache = next;
  saveToStorage(next);
  emitChange();
}

export function updateExperience(id: string, entry: Omit<ExperienceEntry, "id">) {
  const current = getSnapshot();
  const next = current.map((e) => (e.id === id ? { ...entry, id } : e));
  cache = next;
  saveToStorage(next);
  emitChange();
}

export function deleteExperience(id: string) {
  const current = getSnapshot();
  const next = current.filter((e) => e.id !== id);
  cache = next;
  saveToStorage(next);
  emitChange();
}

export function formatPeriod(entry: ExperienceEntry): string {
  const start = entry.startDate || "—";
  const end = entry.isPresent ? "Present" : entry.endDate || "—";
  return `${start} – ${end}`;
}