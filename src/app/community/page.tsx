"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Container } from "@/components/ui/Container";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/icons/Icon";
import {
  fetchFeed,
  createPost,
  toggleLike,
  type PostType,
  type CommunityPost,
} from "@/services/communityService";
import { useApiResource } from "@/hooks/useApiResource";
import { showToast } from "@/components/ui/Toast";
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

/** Relative time from a real timestamp, replacing the fixture's "2 hours ago". */
function when(iso: string): string {
  const minutes = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

export default function CommunityPage() {
  // Real feed (Sprint 60). The fixture's posts were authored by `u1`, `u3`,
  // `u6` — ids that matched no account — with like counts written into a file.
  const { data, loading, error, reload } = useApiResource(() => fetchFeed());
  const [filter, setFilter] = useState<PostType | "all">("all");
  const [draft, setDraft] = useState("");
  const [draftType, setDraftType] = useState<PostType>("milestone");
  const [posting, setPosting] = useState(false);

  const posts = data?.posts ?? [];
  const filtered = filter === "all" ? posts : posts.filter((p) => p.type === filter);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (draft.trim().length < 2) {
      showToast("error", "Write something first");
      return;
    }
    setPosting(true);
    const result = await createPost(draft.trim(), draftType);
    setPosting(false);
    if (result.error) {
      showToast("error", result.error);
      return;
    }
    setDraft("");
    showToast("success", "Posted.");
    reload();
  };

  /**
   * The server decides the new count and whether the viewer liked it, and the
   * page adopts both. The previous version decremented locally, so a failed
   * request left the heart filled and the number wrong until a refresh.
   */
  const onToggleLike = async (postId: string) => {
    const result = await toggleLike(postId);
    if (result.error) {
      showToast("error", result.error);
      return;
    }
    reload();
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

          {/* Composer */}
          <form onSubmit={submit} className="mb-6 rounded-xl border border-border bg-bg-card p-4">
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              maxLength={500}
              rows={3}
              placeholder="Share something with other learners…"
              className="w-full resize-none rounded-lg border border-border bg-bg-secondary px-3 py-2.5 text-sm text-text-primary outline-none focus:border-primary"
            />
            <div className="mt-3 flex items-center gap-2">
              <select
                value={draftType}
                onChange={(e) => setDraftType(e.target.value as PostType)}
                className="rounded-lg border border-border bg-bg-secondary px-2.5 py-1.5 text-xs text-text-secondary outline-none"
              >
                {(["milestone", "achievement", "lesson_completed", "streak"] as const).map((t) => (
                  <option key={t} value={t}>
                    {typeLabels[t]}
                  </option>
                ))}
              </select>
              <span className="text-[10px] text-text-tertiary">{draft.length}/500</span>
              <Button
                type="submit"
                size="sm"
                disabled={posting}
                className="ml-auto"
              >
                {posting ? "Posting…" : "Post"}
              </Button>
            </div>
          </form>

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
            {loading && <p className="py-8 text-center text-sm text-text-tertiary">Loading the feed…</p>}
            {error && <p className="py-8 text-center text-sm text-error">{error}</p>}
            {!loading && !error && filtered.length === 0 && (
              <p className="py-10 text-center text-sm text-text-tertiary">
                {posts.length === 0
                  ? "Nothing posted yet. Be the first."
                  : "No posts of that kind yet."}
              </p>
            )}
            <AnimatePresence mode="popLayout">
              {filtered.map((post: CommunityPost) => (
                <motion.div
                  key={post.id}
                  layout
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.97 }}
                  className="rounded-xl border border-border bg-bg-card p-4"
                >
                  <div className="flex items-start gap-3">
                    <Avatar name={post.author.name} size="sm" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-sm font-semibold text-text-primary">
                          {post.author.name}
                        </span>
                        <Badge variant="default">Lv {post.author.level}</Badge>
                        <Badge variant={typeVariants[post.type]} className="inline-flex items-center gap-1">
                          <Icon icon={typeIcons[post.type]} size={12} /> {typeLabels[post.type]}
                        </Badge>
                      </div>
                      <p className="text-xs text-text-tertiary mb-2">{when(post.createdAt)}</p>

                      <p className="text-sm text-text-secondary leading-relaxed mb-3 whitespace-pre-wrap">{post.body}</p>

                      {/* Actions */}
                      <div className="flex items-center gap-4 text-xs text-text-tertiary">
                        <button
                          onClick={() => onToggleLike(post.id)}
                          className={`flex items-center gap-1 transition-all ${
                            post.likedByMe ? "text-primary" : "hover:text-text-secondary"
                          }`}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill={post.likedByMe ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
                            <path d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
                          </svg>
                          {post.likes}
                        </button>
                        <span className="flex items-center gap-1" title="Comments">
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
