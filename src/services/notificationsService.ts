/**
 * Notifications (Sprint 58 §19).
 *
 * The feed is derived from real activity, so the unread badge finally reflects
 * something. It previously showed a hardcoded count from a fixture that never
 * changed.
 */
import { apiFetchSafe } from "./api";

export interface AppNotificationRecord {
  id: string;
  type: string;
  title: string;
  body: string;
  refId: string | null;
  icon: string;
  createdAt: string;
  read: boolean;
  /** Optional deep link, derived from the notification type. */
  actionLabel: string | null;
  actionHref: string | null;
}

/** Where a notification of each type should take the learner. */
const ACTION_FOR: Record<string, { label: string; href: string }> = {
  lesson: { label: "Open lesson", href: "/learning-path" },
  quiz: { label: "Retake quiz", href: "/quiz" },
  practice: { label: "Practice", href: "/tactical" },
  achievement: { label: "View achievements", href: "/achievements" },
  xp: { label: "View XP", href: "/xp" },
};

/** Fills the optional action link from the notification type. */
export function withAction<T extends { type: string }>(n: T) {
  const action = ACTION_FOR[n.type];
  return { ...n, actionLabel: action?.label ?? null, actionHref: action?.href ?? null };
}

export async function fetchNotifications(): Promise<{
  data: AppNotificationRecord[] | null;
  unreadCount: number;
  error: string | null;
}> {
  const result = await apiFetchSafe<{
    notifications: AppNotificationRecord[];
    unreadCount: number;
  }>("/api/notifications");
  return {
    data: result.data?.notifications.map(withAction) ?? null,
    unreadCount: result.data?.unreadCount ?? 0,
    error: result.error,
  };
}

export async function markNotificationRead(refId: string) {
  return apiFetchSafe<{ refId: string; read: boolean }>("/api/notifications", {
    method: "PATCH",
    body: { refId },
  });
}
