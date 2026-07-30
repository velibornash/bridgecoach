"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Container } from "@/components/ui/Container";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Progress } from "@/components/ui/Progress";
import { Badge } from "@/components/ui/Badge";
import { showToast } from "@/components/ui/Toast";
import { CardTable } from "@/components/lesson/CardTable";
import { NotesPanel } from "@/components/lesson/NotesPanel";
import { mockLessons } from "@/services/mockData";
import type { LessonNote } from "@/types";

export default function LessonPage() {
  const lessons = mockLessons.filter((l) => !l.locked);
  const [currentIndex, setCurrentIndex] = useState(2);
  const [bookmarked, setBookmarked] = useState(lessons[2]?.bookmarked ?? false);
  const [notes, setNotes] = useState<LessonNote[]>([]);
  const [notesOpen, setNotesOpen] = useState(false);
  const [completedSections, setCompletedSections] = useState<string[]>([]);

  const lesson = lessons[currentIndex];
  if (!lesson) return null;

  const total = lessons.length;
  const progress = Math.round(((currentIndex + 1) / total) * 100);

  const handlePrev = useCallback(() => {
    setCurrentIndex((i) => Math.max(0, i - 1));
    setBookmarked(lessons[Math.max(0, currentIndex - 1)]?.bookmarked ?? false);
    setNotes([]);
    setNotesOpen(false);
    setCompletedSections([]);
  }, [currentIndex, lessons]);

  const handleNext = useCallback(() => {
    if (currentIndex < total - 1) {
      setCurrentIndex((i) => i + 1);
      setBookmarked(lessons[Math.min(total - 1, currentIndex + 1)]?.bookmarked ?? false);
      setNotes([]);
      setNotesOpen(false);
      setCompletedSections([]);
    } else {
      showToast("success", "You completed all available lessons! 🎉");
    }
  }, [currentIndex, total, lessons]);

  const toggleBookmark = () => {
    setBookmarked((b) => !b);
    showToast(bookmarked ? "info" : "success", bookmarked ? "Bookmark removed" : "Lesson bookmarked!");
  };

  const handleAddNote = (text: string) => {
    const note: LessonNote = { id: `n${Date.now()}`, text, timestamp: Date.now() };
    setNotes((prev) => [...prev, note]);
  };

  const handleDeleteNote = (id: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== id));
  };

  const markSection = (id: string) => {
    setCompletedSections((prev) =>
      prev.includes(id) ? prev : [...prev, id]
    );
  };

  return (
    <div className="min-h-screen bg-bg-primary">
      <DashboardHeader />
      <main className="py-4 sm:py-6">
        <Container>
          {/* Top bar */}
          <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div>
                <span className="text-xs font-medium uppercase tracking-wider text-primary">
                  {lesson.category}
                </span>
                <h1 className="text-lg sm:text-xl font-bold text-text-primary truncate">{lesson.title}</h1>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={toggleBookmark}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                  bookmarked ? "bg-warning/10 text-warning" : "text-text-tertiary hover:text-text-secondary hover:bg-bg-secondary"
                }`}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill={bookmarked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
                  <path d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
                </svg>
                {bookmarked ? "Saved" : "Bookmark"}
              </button>
              <NotesPanel
                notes={notes}
                onAddNote={handleAddNote}
                onDeleteNote={handleDeleteNote}
                open={notesOpen}
                onToggle={() => setNotesOpen(!notesOpen)}
              />
              <Badge variant="primary">+{lesson.xpReward} XP</Badge>
            </div>
          </div>

          {/* Progress */}
          <div className="mb-5">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-text-tertiary">Lesson {currentIndex + 1} of {total}</span>
              <span className="text-text-secondary font-medium">{progress}%</span>
            </div>
            <Progress value={progress} />
          </div>

          {/* Split layout */}
          <div className="grid gap-5 lg:grid-cols-5">
            {/* Left - Video / Content area */}
            <div className="lg:col-span-3 space-y-5">
              <Card>
                <div className="aspect-video rounded-xl bg-gradient-to-br from-bg-secondary to-bg-card flex items-center justify-center relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                  <div className="relative flex flex-col items-center gap-3">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/20 backdrop-blur-sm">
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-primary">
                        <path d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
                      </svg>
                    </div>
                    <span className="text-xs text-text-tertiary font-medium">Lesson Video</span>
                  </div>
                  <span className="absolute bottom-3 right-3 rounded bg-black/60 px-2 py-0.5 text-[11px] text-text-secondary font-mono">{lesson.duration}</span>
                </div>
              </Card>

              {/* Lesson content */}
              <div className="space-y-4">
                {lesson.content.map((item) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    onClick={() => item.type !== "card-interactive" && markSection(item.id)}
                    className={`rounded-xl border p-4 transition-all duration-150 cursor-pointer ${
                      completedSections.includes(item.id)
                        ? "border-success/30 bg-success-light/30"
                        : "border-border bg-bg-card hover:border-border-hover"
                    }`}
                  >
                    {item.type === "heading" && (
                      <h3 className="text-base font-bold text-text-primary">{item.text}</h3>
                    )}
                    {item.type === "text" && (
                      <p className="text-sm text-text-secondary leading-relaxed">{item.text}</p>
                    )}
                    {item.type === "tip" && (
                      <div className="flex gap-3">
                        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-primary">
                            <path d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                          </svg>
                        </div>
                        <div>
                          <span className="text-xs font-semibold text-primary">Pro Tip</span>
                          <p className="mt-0.5 text-sm text-text-secondary leading-relaxed">{item.text}</p>
                        </div>
                      </div>
                    )}
                    {item.type === "example" && (
                      <div className="flex gap-3">
                        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-500/10">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-warning">
                            <path d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <div>
                          <span className="text-xs font-semibold text-warning">Example</span>
                          <p className="mt-0.5 text-sm text-text-secondary leading-relaxed">{item.text}</p>
                        </div>
                      </div>
                    )}
                    {item.type === "card-interactive" && (
                      <p className="text-sm font-medium text-primary">{item.text}</p>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Right - Cards + Navigation */}
            <div className="lg:col-span-2 space-y-5">
              {lesson.hasCards && lesson.cards && (
                <Card>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-text-primary">Card Layout</h3>
                    <span className="text-[10px] text-text-tertiary">Interactive</span>
                  </div>
                  <CardTable hands={lesson.cards} />
                  <p className="mt-3 text-[11px] text-text-tertiary text-center">
                    Click on any content section above to mark it complete
                  </p>
                </Card>
              )}

              {/* Quick actions */}
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handlePrev}
                  disabled={currentIndex === 0}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M15.75 19.5L8.25 12l7.5-7.5" />
                  </svg>
                  Previous
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleNext}
                >
                  {currentIndex < total - 1 ? "Next" : "Finish"}
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                  </svg>
                </Button>
              </div>

              {/* Lesson list */}
              <Card>
                <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">Available Lessons</h3>
                <div className="space-y-1.5">
                  {lessons.map((l, i) => (
                    <button
                      key={l.id}
                      onClick={() => {
                        setCurrentIndex(i);
                        setBookmarked(l.bookmarked ?? false);
                        setNotes([]);
                        setNotesOpen(false);
                        setCompletedSections([]);
                      }}
                      className={`w-full flex items-center gap-3 rounded-lg px-3 py-2 text-left text-xs transition-all ${
                        i === currentIndex
                          ? "bg-primary/10 text-primary ring-1 ring-primary/30"
                          : l.completed
                            ? "text-text-tertiary"
                            : "text-text-secondary hover:bg-bg-secondary"
                      }`}
                    >
                      <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded text-[10px] font-bold ${
                        l.completed ? "bg-success/20 text-success" : i === currentIndex ? "bg-primary/20 text-primary" : "bg-bg-secondary text-text-tertiary"
                      }`}>
                        {l.completed ? (
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                            <path d="M4.5 12.75l6 6 9-13.5" />
                          </svg>
                        ) : (
                          i + 1
                        )}
                      </span>
                      <span className="truncate">{l.title}</span>
                      {l.bookmarked && (
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" className="text-warning shrink-0">
                          <path d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
                        </svg>
                      )}
                    </button>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        </Container>
      </main>
    </div>
  );
}
