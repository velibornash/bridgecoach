"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Container } from "@/components/ui/Container";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { Badge } from "@/components/ui/Badge";
import { showToast } from "@/components/ui/Toast";
import { mockBookmarks } from "@/services/mockData";
import { EmptyState } from "@/components/ui/EmptyState";
import Link from "next/link";
import type { BookmarkCategory } from "@/types";
import { Icon } from "@/components/icons/Icon";
import { BookOpen, Play, FileText } from "lucide-react";

const categoryMeta: Record<string, { icon: typeof BookOpen; label: string; color: string }> = {
  lesson: { icon: BookOpen, label: "Lessons", color: "from-indigo-500 to-indigo-600" },
  video: { icon: Play, label: "Videos", color: "from-rose-500 to-pink-600" },
  article: { icon: FileText, label: "Articles", color: "from-emerald-500 to-teal-600" },
};

export default function BookmarksPage() {
  const [bookmarks, setBookmarks] = useState(mockBookmarks);
  const [filter, setFilter] = useState<BookmarkCategory | "all">("all");

  const filtered = filter === "all" ? bookmarks : bookmarks.filter((b) => b.category === filter);

  const removeBookmark = (id: string) => {
    setBookmarks((prev) => prev.filter((b) => b.id !== id));
    showToast("info", "Bookmark removed");
  };

  return (
    <div className="min-h-screen bg-bg-primary">
      <DashboardHeader />
      <main className="py-8 sm:py-12">
        <Container className="max-w-2xl">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-text-primary">Bookmarks</h1>
            <p className="text-sm text-text-tertiary mt-1">{bookmarks.length} saved items</p>
          </div>

          {/* Category filters */}
          <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-none">
            {(["all", "lesson", "video", "article"] as const).map((cat) => {
              const count = cat === "all" ? bookmarks.length : bookmarks.filter((b) => b.category === cat).length;
              return (
                <button
                  key={cat}
                  onClick={() => setFilter(cat)}
                  className={`shrink-0 flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium transition-all ${
                    filter === cat
                      ? "bg-primary text-white"
                      : "bg-bg-secondary text-text-tertiary hover:text-text-secondary"
                  }`}
                >
                  {cat !== "all" && categoryMeta[cat]?.icon && (
                    <Icon icon={categoryMeta[cat].icon} size={14} />
                  )}
                  <span className="capitalize">{cat === "all" ? "All" : categoryMeta[cat]?.label || cat}</span>
                  <Badge variant="default">{count}</Badge>
                </button>
              );
            })}
          </div>

          {/* Grid */}
          <div className="grid gap-4 sm:grid-cols-2">
            <AnimatePresence mode="popLayout">
              {filtered.map((bm, i) => (
                <motion.div
                  key={bm.id}
                  layout
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3, delay: i * 0.04 }}
                  className="group relative"
                >
                  <Link
                    href={bm.href}
                    className="block rounded-xl border border-border bg-bg-card p-4 hover:border-primary/20 transition-all h-full"
                  >
                    <div className="flex items-start gap-3">
                        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${categoryMeta[bm.category]?.color || "from-primary to-blue-600"}`}>
                          <Icon icon={categoryMeta[bm.category]?.icon || FileText} size={18} className="text-white" />
                        </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-bold text-text-primary truncate">{bm.title}</h3>
                        </div>
                        <p className="text-xs text-text-tertiary mt-0.5 line-clamp-1">{bm.description}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="default">{bm.category}</Badge>
                          <span className="text-[10px] text-text-tertiary">{bm.addedAt}</span>
                        </div>
                      </div>
                    </div>
                  </Link>

                  {/* Remove button */}
                  <button
                    onClick={(e) => { e.preventDefault(); removeBookmark(bm.id); }}
                    className="absolute -top-1.5 -right-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-danger text-white opacity-0 group-hover:opacity-100 transition-all shadow-lg hover:scale-110"
                  >
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <path d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Empty */}
          {filtered.length === 0 && (
            <EmptyState
              variant="bookmarks"
              onAction={() => window.location.href = "/catalog"}
            />
          )}
        </Container>
      </main>
    </div>
  );
}