// lib/notifications.ts
"use client";

import {
  UploadCloud,
  Pencil,
  Trash2,
  Star,
  FileSearch,
  Target,
  BarChart3,
  TrendingUp,
  ShieldCheck,
  LogIn,
  LogOut,
  type LucideIcon,
} from "lucide-react";
import { useSyncExternalStore } from "react";

export type NotificationType =
  | "resume_upload"
  | "resume_rename"
  | "resume_delete"
  | "resume_default"
  | "ats_report"
  | "jd_match"
  | "skill_gap"
  | "readiness"
  | "eligibility"
  | "login"
  | "logout";

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  description: string;
  createdAt: number;
  read: boolean;
}

const STORAGE_KEY = "placelens_notifications";
const MAX_NOTIFICATIONS = 50;

type Listener = () => void;
let listeners: Listener[] = [];
let cache: AppNotification[] | null = null;

function loadFromStorage(): AppNotification[] {
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

function saveToStorage(items: AppNotification[]) {
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

export function getNotificationsSnapshot(): AppNotification[] {
  if (cache === null) {
    cache = loadFromStorage();
  }
  return cache;
}

function getServerSnapshot(): AppNotification[] {
  return [];
}

export function subscribeNotifications(listener: Listener): () => void {
  listeners.push(listener);
  return () => {
    listeners = listeners.filter((l) => l !== listener);
  };
}

export function addNotification(input: {
  type: NotificationType;
  title: string;
  description: string;
}) {
  const item: AppNotification = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    type: input.type,
    title: input.title,
    description: input.description,
    createdAt: Date.now(),
    read: false,
  };
  const current = getNotificationsSnapshot();
  const next = [item, ...current].slice(0, MAX_NOTIFICATIONS);
  cache = next;
  saveToStorage(next);
  emitChange();
}

export function markAllAsRead() {
  const current = getNotificationsSnapshot();
  if (current.every((n) => n.read)) return;
  const next = current.map((n) => ({ ...n, read: true }));
  cache = next;
  saveToStorage(next);
  emitChange();
}

export function clearAllNotifications() {
  cache = [];
  saveToStorage([]);
  emitChange();
}

export function useNotifications(): AppNotification[] {
  return useSyncExternalStore(
    subscribeNotifications,
    getNotificationsSnapshot,
    getServerSnapshot
  );
}

export function getUnreadCount(items: AppNotification[]): number {
  return items.filter((n) => !n.read).length;
}

export function formatRelativeTime(epochMs: number): string {
  const diffMs = Date.now() - epochMs;
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 10) return "Just now";
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} min ago`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}h ago`;
  const diffDay = Math.floor(diffHour / 24);
  return `${diffDay}d ago`;
}

export const notificationIcons: Record<NotificationType, LucideIcon> = {
  resume_upload: UploadCloud,
  resume_rename: Pencil,
  resume_delete: Trash2,
  resume_default: Star,
  ats_report: FileSearch,
  jd_match: Target,
  skill_gap: BarChart3,
  readiness: TrendingUp,
  eligibility: ShieldCheck,
  login: LogIn,
  logout: LogOut,
};