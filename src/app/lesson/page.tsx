"use client";

import { use, useState, useCallback, useMemo } from "react";
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
import { VideoPlayer } from "@/components/video/VideoPlayer";
import { UniversalLearningRenderer } from "@/components/learningEngine/UniversalLearningRenderer";
import type { LearningBlock, BlockType } from "@/components/learningEngine/types";
import { mockLessons, mockEpisodes, mockUser } from "@/services/mockData";
import { getCourseProgress, getEpisodeProgress } from "@/services/lessonService";
import type { LessonNote } from "@/types";

export default function LessonPage({
  searchParams,
}: {
  searchParams: Promise<{ episode?: string }>;
}) {
  const params = use(searchParams);
  const episodeFilter = params?.episode;
  const available = useMemo(
    () => mockLessons.filter((l) => !l.locked && (episodeFilter ? l.episodeId === episodeFilter : true)),
    [episodeFilter]
  );
  const startIndex = useMemo(() => {
    const idx = available.findIndex((l) => l.id === mockUser.currentLessonId);
    return idx >= 0 ? idx : available.findIndex((l) => !l.completed);
  }, [available]);
  const [currentIndex, setCurrentIndex] = useState(startIndex >= 0 ? startIndex : 0);
  const lesson = available[currentIndex];
  const [bookmarked, setBookmarked] = useState(lesson?.bookmarked ?? false);
  const [notes, setNotes] = useState<LessonNote[]>([]);
  const [notesOpen, setNotesOpen] = useState(false);
  const [completedSections, setCompletedSections] = useState<string[]>(
    lesson?.sectionsCompleted ?? [],
  );
  const [showCompletion, setShowCompletion] = useState(false);

  const [resetKey, setResetKey] = useState(`${currentIndex}-${available.length}`);
  if (resetKey !== `${currentIndex}-${available.length}`) {
    setResetKey(`${currentIndex}-${available.length}`);
    setCompletedSections(lesson?.sectionsCompleted ?? []);
    setBookmarked(lesson?.bookmarked ?? false);
    setNotes([]);
    setNotesOpen(false);
    setShowCompletion(false);
  }

  const allBlocks = useMemo(() => {
    if (!lesson) return [];
    const lessonContent = lesson.content ?? [];
    const baseBlocks = lessonContent.map((item) => {
      const blockType =
        item.type === "tip" ? "callout" :
        item.type === "card-interactive" ? "paragraph" :
        item.type;
      return {
        id: item.id,
        type: blockType as BlockType,
        text: item.text,
        title: item.type === "tip" ? "Pro Tip" : undefined,
      };
    });

    const extraBlocks: LearningBlock[] = [];
    if (lesson.id === "l1") {
      extraBlocks.push({
        id: "quiz-l1",
        type: "quiz" as const,
        question: "In standard Bridge, how many cards is each player dealt at the beginning of a hand?",
        options: ["10 Cards", "13 Cards", "15 Cards", "9 Cards"],
        answerIndex: 1,
        explanation: "Each player is dealt exactly 13 cards, making a total of 52 cards for the table.",
      });
    } else if (lesson.id === "l2") {
      extraBlocks.push({
        id: "flash-l2",
        type: "flashcard" as const,
        front: "Which card should you lead when holding a sequence like Q-J-10?",
        back: "You should lead the top of a sequence. In this case, lead the Queen.",
      });
    } else if (lesson.id === "l3") {
      extraBlocks.push({
        id: "reveal-l3",
        type: "reveal_answer" as const,
        title: "1NT Opener Check",
        text: "Can you open 1NT with 14 HCP and a 5-card spade suit?",
        explanation: "No, a standard 1NT opening bid requires exactly 15-17 HCP (High Card Points) and a balanced hand. With 14 HCP, you should open 1♠ instead.",
      });
    }

    return [...baseBlocks, ...extraBlocks];
  }, [lesson]);

  const total = available.length;

  const handlePrev = useCallback(() => {
    setCurrentIndex((i) => Math.max(0, i - 1));
  }, []);

  const handleNext = useCallback(() => {
    if (currentIndex < total - 1) {
      const allDone = allBlocks.length === 0 || completedSections.length >= allBlocks.length;
      if (!allDone && allBlocks.length > 0) {
        showToast("info", "Complete all sections first");
        return;
      }
      setCurrentIndex((i) => i + 1);
    } else {
      setShowCompletion(true);
    }
  }, [currentIndex, total, completedSections, allBlocks]);

  const handleFinish = useCallback(() => {
    showToast("success", "Course complete! Amazing work! 🎉");
    setShowCompletion(false);
  }, []);

  if (!lesson) return null;

  const progress = Math.round(((currentIndex + 1) / total) * 100);
  const episode = mockEpisodes.find((e) => e.id === lesson.episodeId);
  const epProgress = getEpisodeProgress(lesson.episodeId);
  const courseProgress = getCourseProgress();

  const toggleBookmark = () => {
    setBookmarked((b) => !b);
    showToast(bookmarked ? "info" : "success", bookmarked ? "Bookmark removed" : "Lesson bookmarked!");
  };

  const handleAddNote = (text: string) => {
    const note: LessonNote = { id: `n${Date.now()}`, text, timestamp: Date.now(), pinned: false };
    setNotes((prev) => [...prev, note]);
  };

  const handleDeleteNote = (id: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== id));
  };

  const markSection = (id: string) => {
    setCompletedSections((prev) =>
      prev.includes(id) ? prev : [...prev, id],
    );
  };

  const sectionProgress = lesson.content.length > 0
    ? Math.round((completedSections.length / lesson.content.length) * 100)
    : 100;

  return (
    <div className="min-h-screen bg-bg-primary">
      <DashboardHeader />
      <main className="py-4 sm:py-6">
        <Container>
          {/* Breadcrumb */}
          <div className="mb-4 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-text-tertiary">
            <span>Course</span>
            <span>/</span>
            <span className="text-text-secondary">{episode?.title ?? "Lessons"}</span>
            <span>/</span>
            <span className="text-text-primary font-medium truncate">{lesson.title}</span>
          </div>

          {/* Top bar */}
          <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-xs font-medium uppercase tracking-wider text-primary">
                    {lesson.category}
                  </span>
                  <span className="text-[10px] text-text-tertiary">|</span>
                  <span className="text-[10px] text-text-tertiary">{lesson.subcategory}</span>
                </div>
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

          {/* Dual progress bars */}
          <div className="mb-5 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-text-tertiary">Lesson {currentIndex + 1} of {total}</span>
              <span className="text-text-secondary font-medium">{progress}%</span>
            </div>
            <Progress value={progress} />
            {lesson.content.length > 0 && (
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-text-tertiary">Section {completedSections.length} of {lesson.content.length} complete</span>
                <span className="text-text-secondary font-medium">{sectionProgress}%</span>
              </div>
            )}
          </div>

          {/* Chapter progress bar */}
          {episode && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-5 rounded-xl border border-border bg-bg-card p-3 sm:p-4"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-md text-xs" style={{ background: `linear-gradient(135deg, ${episode.gradient.replace("from-", "").split(" ")[0]}, ${episode.gradient.replace("to-", "").split(" ")[1]})` }}>
                    <span className="text-white">{episode.icon}</span>
                  </div>
                  <span className="text-xs font-semibold text-text-secondary">{episode.title}</span>
                </div>
                <span className="text-[10px] text-text-tertiary">{epProgress.completedLessons}/{epProgress.totalLessons} lessons</span>
              </div>
              <Progress value={episode.completion} />
            </motion.div>
          )}

          {/* Split layout */}
          <div className="grid gap-5 lg:grid-cols-5">
            {/* Left - Content area */}
            <div className="lg:col-span-3 space-y-5">
              <VideoPlayer onComplete={() => showToast("success", "Video complete!")} />

              {/* Lesson content sections rendered dynamically via Universal Learning Engine */}
              <div className="space-y-4">
                <UniversalLearningRenderer
                  blocks={allBlocks}
                  completedSections={completedSections}
                  onCompleteSection={markSection}
                />
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
                    Tap any content section to mark it complete
                  </p>
                </Card>
              )}

              {/* Section progress indicator */}
              {lesson.content.length > 0 && (
                <div className="rounded-xl border border-border bg-bg-card p-4">
                  <h4 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">Section Progress</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {lesson.content.map((item, idx) => (
                      <motion.div
                        key={item.id}
                        animate={{ scale: completedSections.includes(item.id) ? 1 : 0.95 }}
                        className={`flex h-7 w-7 items-center justify-center rounded-md text-[10px] font-bold transition-all ${
                          completedSections.includes(item.id)
                            ? "bg-success text-white"
                            : "bg-bg-secondary text-text-tertiary"
                        }`}
                      >
                        {completedSections.includes(item.id) ? (
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                            <path d="M4.5 12.75l6 6 9-13.5" />
                          </svg>
                        ) : (
                          idx + 1
                        )}
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* Navigation */}
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
                  {currentIndex < total - 1 ? "Next" : "Finish Course"}
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                  </svg>
                </Button>
              </div>

              {/* Course progress summary */}
              <Card>
                <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">Course Progress</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-text-tertiary">Lessons</span>
                    <span className="text-text-secondary font-medium">{courseProgress.completedLessons}/{courseProgress.totalLessons}</span>
                  </div>
                  <Progress value={courseProgress.completionPercent} />
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-text-tertiary">Episodes</span>
                    <span className="text-text-secondary font-medium">{courseProgress.episodesCompleted}/{courseProgress.episodesTotal}</span>
                  </div>
                  <Progress value={Math.round((courseProgress.episodesCompleted / courseProgress.episodesTotal) * 100)} />
                </div>
              </Card>

              {/* Lesson list */}
              <Card>
                <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">Available Lessons</h3>
                <div className="space-y-1.5">
                  {available.map((l, i) => (
                    <button
                      key={l.id}
                      onClick={() => setCurrentIndex(i)}
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
                      {!l.completed && i === currentIndex && (
                        <span className="ml-auto text-[9px] text-primary font-medium">Resume</span>
                      )}
                    </button>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        </Container>
      </main>

      {/* Course Completion Modal */}
      <AnimatePresence>
        {showCompletion && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0.85, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.85, opacity: 0, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="w-full max-w-md rounded-2xl border border-border bg-bg-card p-8 text-center"
            >
              <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-success/20">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-success">
                  <path d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-text-primary mb-2">Course Complete!</h2>
              <p className="text-sm text-text-tertiary mb-2">
                You&apos;ve completed all available lessons. Amazing progress!
              </p>
              <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-warning/10 px-4 py-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-warning">
                  <path d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33" />
                </svg>
                <span className="text-sm font-bold text-warning">+{mockLessons.reduce((s, l) => s + l.xpReward, 0)} XP Total</span>
              </div>
              <div className="flex flex-col gap-2">
                <Button variant="primary" size="lg" onClick={handleFinish}>
                  Celebrate!
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setShowCompletion(false)}>
                  Back to lessons
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}