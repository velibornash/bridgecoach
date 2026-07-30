"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Container } from "@/components/ui/Container";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { mockNotifications } from "@/services/mockData";
import type { NotificationType } from "@/types";
import { Icon } from "@/components/icons/Icon";
import { Zap, Target, Bell, BookOpen, Hand, Bell as BellRing } from "lucide-react";

const typeIcons: Record<string, typeof Zap> = {
  xp: Zap, achievement: Target, reminder: Bell, lesson: BookOpen, friend: Hand,
};

const typeLabels: Record<string, string> = {
  xp: "XP Earned", achievement: "Achievement", reminder: "Reminder", lesson: "Lesson", friend: "Social",
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState(mockNotifications);
  const [filter, setFilter] = useState<NotificationType | "all">("all");

  const filtered = filter === "all" ? notifications : notifications.filter((n) => n.type === filter);
  const unread = notifications.filter((n) => !n.read).length;

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  return (
    <div className="min-h-screen bg-bg-primary">
      <DashboardHeader />
      <main className="py-8 sm:py-12">
        <Container className="max-w-2xl">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-text-primary">Notifications</h1>
              <p className="text-sm text-text-tertiary mt-1">
                {unread > 0 ? `${unread} unread notifications` : "All caught up!"}
              </p>
            </div>
            {unread > 0 && (
              <Button variant="ghost" size="sm" onClick={markAllRead}>
                Mark all read
              </Button>
            )}
          </div>

          {/* Filter chips */}
          <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-none">
            {(["all", "xp", "achievement", "reminder", "lesson", "friend"] as const).map((t) => {
              const count = t === "all" ? notifications.length : notifications.filter((n) => n.type === t).length;
              return (
                <button
                  key={t}
                  onClick={() => setFilter(t)}
                  className={`shrink-0 flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium transition-all ${
                    filter === t
                      ? "bg-primary text-white"
                      : "bg-bg-secondary text-text-tertiary hover:text-text-secondary"
                  }`}
                >
                  {t !== "all" && <Icon icon={typeIcons[t]} size={16} />}
                  <span className="capitalize">{t === "all" ? "All" : typeLabels[t]}</span>
                  <Badge variant="default">{count}</Badge>
                </button>
              );
            })}
          </div>

          {/* List */}
          <div className="space-y-2">
            <AnimatePresence mode="popLayout">
              {filtered.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-12"
                >
                  <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-bg-secondary">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-text-tertiary">
                      <path d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                    </svg>
                  </div>
                  <p className="text-sm text-text-tertiary">No notifications here.</p>
                </motion.div>
              ) : (
                filtered.map((n, i) => (
                  <motion.div
                    key={n.id}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -8 }}
                    transition={{ duration: 0.25, delay: i * 0.03 }}
                    className={`rounded-xl border p-4 transition-all ${
                      !n.read
                        ? "border-primary/20 bg-primary/5"
                        : "border-border bg-bg-card"
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                        !n.read ? "bg-primary/10" : "bg-bg-secondary"
                      }`}>
                        {typeIcons[n.type] && (
                          <Icon icon={typeIcons[n.type]} size={18} />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className={`text-sm ${!n.read ? "font-bold text-text-primary" : "font-medium text-text-secondary"}`}>
                            {n.title}
                          </h3>
                          {!n.read && (
                            <span className="flex h-2 w-2 rounded-full bg-primary shrink-0" />
                          )}
                        </div>
                        <p className="text-xs text-text-tertiary mt-0.5">{n.description}</p>
                        <div className="flex items-center gap-3 mt-2">
                          <span className="text-[10px] text-text-tertiary">{n.timestamp}</span>
                          {n.actionLabel && n.actionHref && (
                            <Link
                              href={n.actionHref}
                              className="text-[10px] font-medium text-primary hover:text-primary/80 transition-colors"
                            >
                              {n.actionLabel} &rarr;
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        </Container>
      </main>
    </div>
  );
}