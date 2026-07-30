"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Container } from "@/components/ui/Container";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Icon } from "@/components/icons/Icon";
import { mockCommunityPosts } from "@/services/mockData";
import type { PostType } from "@/types";
import { Award, BookOpen, Sparkles, Flame } from "lucide-react";

const typeIcons: Record<PostType, typeof Award> = {
  achievement: Award,
  lesson_completed: BookOpen,
  milestone: Sparkles,
  streak: Flame,
};

const typeLabels: Record<PostType, string> = {
  achievement: "Achievement",
  lesson_completed: "Lesson",
  milestone: "Milestone",
  streak: "Streak",
};

const typeVariants: Record<PostType, "primary" | "success" | "warning" | "danger"> = {
  achievement: "primary",
  lesson_completed: "success",
  milestone: "warning",
  streak: "danger",
};

export default function CommunityPage() {
  const [posts, setPosts] = useState(mockCommunityPosts);
  const [filter, setFilter] = useState<PostType | "all">("all");

  const filtered = filter === "all" ? posts : posts.filter((p) => p.type === filter);

  const toggleLike = (id: string) => {
    setPosts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, liked: !p.liked, likes: p.liked ? p.likes - 1 : p.likes + 1 } : p)),
    );
  };

  return (
    <div className="min-h-screen bg-bg-primary">
      <DashboardHeader />
      <main className="py-8 sm:py-12">
        <Container className="max-w-2xl">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-2xl font-bold text-text-primary mb-2">Community Feed</h1>
            <p className="text-sm text-text-tertiary mb-6">See what other learners are achieving.</p>
          </motion.div>

          {/* Filter chips */}
          <div className="flex gap-1.5 mb-6 overflow-x-auto scrollbar-none">
            {(["all", "achievement", "lesson_completed", "milestone", "streak"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setFilter(t)}
                className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                  filter === t ? "bg-primary text-white" : "text-text-tertiary hover:text-text-secondary hover:bg-bg-secondary"
                }`}
              >
                {t === "all" ? "All" : typeLabels[t]}
              </button>
            ))}
          </div>

          {/* Feed */}
          <div className="space-y-4">
            <AnimatePresence mode="popLayout">
              {filtered.map((post) => (
                <motion.div
                  key={post.id}
                  layout
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.97 }}
                  className="rounded-xl border border-border bg-bg-card p-4"
                >
                  <div className="flex items-start gap-3">
                    <Avatar name={post.userName} size="sm" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-sm font-semibold text-text-primary">{post.userName}</span>
                        <Badge variant="default">Lv {post.userLevel}</Badge>
                        <Badge variant={typeVariants[post.type]} className="inline-flex items-center gap-1">
                          <Icon icon={typeIcons[post.type]} size={12} /> {typeLabels[post.type]}
                        </Badge>
                      </div>
                      <p className="text-xs text-text-tertiary mb-2">{post.timestamp}</p>

                      <p className="text-sm text-text-secondary leading-relaxed mb-3">{post.content}</p>

                      {post.relatedTitle && (
                        <div className="inline-flex items-center gap-1.5 rounded-lg bg-bg-secondary px-2.5 py-1 text-xs text-text-secondary mb-3">
                          {post.relatedXp && <span className="text-primary font-medium">+{post.relatedXp} XP</span>}
                          <span>{post.relatedTitle}</span>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex items-center gap-4 text-xs text-text-tertiary">
                        <button
                          onClick={() => toggleLike(post.id)}
                          className={`flex items-center gap-1 transition-all ${
                            post.liked ? "text-primary" : "hover:text-text-secondary"
                          }`}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill={post.liked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
                            <path d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
                          </svg>
                          {post.likes}
                        </button>
                        <span className="flex items-center gap-1">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641a4.483 4.483 0 01-.923 1.785A5.969 5.969 0 006 21c1.282 0 2.47-.402 3.445-1.087.81.22 1.668.337 2.555.337z" />
                          </svg>
                          {post.comments}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </Container>
      </main>
    </div>
  );
}
