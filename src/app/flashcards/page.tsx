"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Container } from "@/components/ui/Container";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Progress } from "@/components/ui/Progress";
import { showToast } from "@/components/ui/Toast";
import { mockFlashcards } from "@/services/mockData";
import type { Flashcard } from "@/types";

const categories = ["All", "Basics", "Bidding", "Conventions", "Defense", "Play"];

export default function FlashcardsPage() {
  const [cards, setCards] = useState(() => [...mockFlashcards].sort(() => Math.random() - 0.5));
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [category, setCategory] = useState("All");
  const [mode, setMode] = useState<"all" | "unknown" | "review">("all");

  const filtered = useMemo(() => {
    let items = cards;
    if (category !== "All") items = items.filter((c) => c.category === category);
    if (mode === "unknown") items = items.filter((c) => c.status === "unknown");
    if (mode === "review") items = items.filter((c) => c.status === "review_later");
    return items;
  }, [cards, category, mode]);

  const current = filtered[currentIndex] || null;
  const known = cards.filter((c) => c.status === "known").length;
  const total = cards.length;

  const updateStatus = (status: Flashcard["status"]) => {
    if (!current) return;
    setCards((prev) =>
      prev.map((c) =>
        c.id === current.id
          ? { ...c, status, lastReviewed: new Date().toISOString().split("T")[0], timesReviewed: c.timesReviewed + 1 }
          : c,
      ),
    );
    setFlipped(false);
    if (currentIndex < filtered.length - 1) {
      setCurrentIndex((i) => i + 1);
    } else {
      showToast("success", "All cards reviewed! 🎉");
    }
  };

  const handleFlip = () => setFlipped((f) => !f);

  return (
    <div className="min-h-screen bg-bg-primary">
      <DashboardHeader />
      <main className="py-8 sm:py-12">
        <Container className="max-w-lg">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-text-primary">Flashcards</h1>
            <p className="text-sm text-text-tertiary mt-1">{known}/{total} known</p>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-2 mb-5">
            <div className="rounded-xl border border-border bg-bg-card p-3 text-center">
              <div className="text-lg font-bold text-success">{known}</div>
              <div className="text-[10px] text-text-tertiary">Known</div>
            </div>
            <div className="rounded-xl border border-border bg-bg-card p-3 text-center">
              <div className="text-lg font-bold text-text-primary">{cards.filter((c) => c.status === "unknown").length}</div>
              <div className="text-[10px] text-text-tertiary">Unknown</div>
            </div>
            <div className="rounded-xl border border-border bg-bg-card p-3 text-center">
              <div className="text-lg font-bold text-warning">{cards.filter((c) => c.status === "review_later").length}</div>
              <div className="text-[10px] text-text-tertiary">Review</div>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-2 mb-5">
            <div className="flex gap-1 overflow-x-auto scrollbar-none">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => { setCategory(cat); setCurrentIndex(0); setFlipped(false); }}
                  className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                    category === cat ? "bg-primary text-white" : "text-text-tertiary hover:text-text-secondary hover:bg-bg-secondary"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
            <div className="flex gap-1 ml-auto">
              {(["all", "unknown", "review"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => { setMode(m); setCurrentIndex(0); setFlipped(false); }}
                  className={`shrink-0 rounded-lg px-2.5 py-1.5 text-[10px] font-medium transition-all ${
                    mode === m ? "bg-primary/20 text-primary" : "text-text-tertiary hover:text-text-secondary"
                  }`}
                >
                  {m === "all" ? "All" : m === "unknown" ? "Unknown" : "Review"}
                </button>
              ))}
            </div>
          </div>

          {/* Progress */}
          <div className="flex items-center justify-between text-xs mb-3">
            <span className="text-text-tertiary">{filtered.length > 0 ? `${currentIndex + 1} of ${filtered.length}` : "No cards"}</span>
            <span className="text-text-secondary font-medium">
              {filtered.length > 0 ? Math.round(((currentIndex) / filtered.length) * 100) : 0}%
            </span>
          </div>
          <Progress value={filtered.length > 0 ? (currentIndex / filtered.length) * 100 : 0} />

          {/* Flashcard */}
          <div className="mt-6 perspective-[1000px]" style={{ minHeight: 280 }}>
            <AnimatePresence mode="wait">
              {current ? (
                <motion.div
                  key={current.id + flipped}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="relative cursor-pointer"
                  style={{ transformStyle: "preserve-3d" }}
                  onClick={handleFlip}
                >
                  <motion.div
                    animate={{ rotateY: flipped ? 180 : 0 }}
                    transition={{ duration: 0.4, type: "spring", damping: 20 }}
                    className="relative"
                    style={{ transformStyle: "preserve-3d" }}
                  >
                    {/* Front */}
                    <div
                      className={`rounded-2xl border p-8 text-center backface-hidden ${
                        flipped ? "invisible absolute inset-0" : "visible"
                      } ${current.status === "known" ? "border-success/30 bg-success/5" : current.status === "review_later" ? "border-warning/30 bg-warning/5" : "border-border bg-bg-card"}`}
                    >
                      <div className="flex items-center justify-center gap-2 mb-3">
                        <Badge variant="default">{current.category}</Badge>
                        <Badge variant={current.difficulty === "easy" ? "success" : current.difficulty === "medium" ? "warning" : "danger"}>
                          {current.difficulty}
                        </Badge>
                      </div>
                      <p className="text-lg font-bold text-text-primary leading-relaxed">{current.front}</p>
                      <p className="text-xs text-text-tertiary mt-6">Tap to flip</p>
                    </div>

                    {/* Back */}
                    <div
                      className={`rounded-2xl border p-8 text-center backface-hidden ${
                        !flipped ? "invisible" : "visible"
                      } border-primary/20 bg-primary/5`}
                      style={{ transform: "rotateY(180deg)" }}
                    >
                      <div className="flex items-center justify-center gap-2 mb-3">
                        <Badge variant="primary">Answer</Badge>
                      </div>
                      <p className="text-base text-text-primary leading-relaxed">{current.back}</p>
                      <p className="text-xs text-text-tertiary mt-4">
                        Reviewed {current.timesReviewed} time{current.timesReviewed !== 1 ? "s" : ""}
                        {current.lastReviewed ? ` • Last: ${current.lastReviewed}` : ""}
                      </p>
                    </div>
                  </motion.div>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-16"
                >
                  <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-bg-secondary">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-text-tertiary">
                      <path d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
                    </svg>
                  </div>
                  <p className="text-sm text-text-tertiary">No cards to review.</p>
                  <p className="text-xs text-text-tertiary mt-1">Try changing the category or mode filter.</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Action buttons */}
          {current && flipped && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 flex items-center justify-center gap-3"
            >
              <button
                onClick={() => updateStatus("unknown")}
                className="flex items-center gap-1.5 rounded-xl border border-danger/30 bg-danger/5 px-4 py-2.5 text-sm font-medium text-danger hover:bg-danger/10 transition-all"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 18L18 6M6 6l12 12" />
                </svg>
                Still Unknown
              </button>
              <button
                onClick={() => updateStatus("review_later")}
                className="flex items-center gap-1.5 rounded-xl border border-warning/30 bg-warning/5 px-4 py-2.5 text-sm font-medium text-warning hover:bg-warning/10 transition-all"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Review Later
              </button>
              <button
                onClick={() => updateStatus("known")}
                className="flex items-center gap-1.5 rounded-xl border border-success/30 bg-success/5 px-4 py-2.5 text-sm font-medium text-success hover:bg-success/10 transition-all"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4.5 12.75l6 6 9-13.5" />
                </svg>
                Known
              </button>
            </motion.div>
          )}
        </Container>
      </main>
    </div>
  );
}