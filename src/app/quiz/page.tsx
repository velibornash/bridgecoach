"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Container } from "@/components/ui/Container";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { Card } from "@/components/ui/Card";
import { Progress } from "@/components/ui/Progress";
import { Badge } from "@/components/ui/Badge";
import { SingleChoice } from "@/components/quiz/SingleChoice";
import { MultipleChoice } from "@/components/quiz/MultipleChoice";
import { CardSelect } from "@/components/quiz/CardSelect";
import { DragDrop } from "@/components/quiz/DragDrop";
import { QuizResultScreen } from "@/components/quiz/QuizResult";
import { mockQuizQuestions } from "@/services/mockData";
import type { QuizResult } from "@/types";

const questionTypeIcons: Record<string, string> = {
  single: "Single Answer",
  multiple: "Multiple Answer",
  "card-select": "Card Select",
  "drag-drop": "Match",
};

export default function QuizPage() {
  const [questions] = useState(() => mockQuizQuestions.sort(() => Math.random() - 0.5));
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<string, boolean>>({});
  const [answeredIds, setAnsweredIds] = useState<Set<string>>(new Set());
  const [showResult, setShowResult] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [totalXp, setTotalXp] = useState(0);

  const q = questions[current];
  const total = questions.length;
  const progress = Math.round((answeredIds.size / total) * 100);

  const handleAnswer = useCallback(
    (correct: boolean) => {
      setAnswers((prev) => ({ ...prev, [q.id]: correct }));
      setAnsweredIds((prev) => new Set(prev).add(q.id));
      if (correct) {
        setCorrectCount((c) => c + 1);
        setTotalXp((x) => x + q.xpReward);
      }
    },
    [q]
  );

  const nextQuestion = useCallback(() => {
    if (current < total - 1) {
      setCurrent((c) => c + 1);
    } else {
      setShowResult(true);
    }
  }, [current, total]);

  const retry = useCallback(() => {
    setCurrent(0);
    setAnswers({});
    setAnsweredIds(new Set());
    setShowResult(false);
    setCorrectCount(0);
    setTotalXp(0);
  }, []);

  if (!q) return null;

  if (showResult) {
    const result: QuizResult = {
      totalQuestions: total,
      correctAnswers: correctCount,
      score: Math.round((correctCount / total) * 100),
      xpEarned: totalXp,
      answers,
    };
    return (
      <div className="min-h-screen bg-bg-primary">
        <DashboardHeader />
        <main className="py-8">
          <Container>
            <QuizResultScreen result={result} onRetry={retry} onBack={() => setShowResult(false)} />
          </Container>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-primary">
      <DashboardHeader />
      <main className="py-4 sm:py-8">
        <Container className="max-w-2xl">
          {/* Header */}
          <div className="mb-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="primary">{questionTypeIcons[q.type]}</Badge>
                <span className="text-xs text-text-tertiary">Question {current + 1} of {total}</span>
              </div>
              <h1 className="text-lg font-bold text-text-primary">{q.question}</h1>
            </div>
            <Badge variant="warning">+{q.xpReward} XP</Badge>
          </div>

          {/* Progress */}
          <div className="mb-5">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-text-tertiary">Progress</span>
              <span className="text-text-secondary font-medium">{progress}%</span>
            </div>
            <Progress value={progress} />
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={q.id}
              initial={{ opacity: 0, x: 32 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -32 }}
              transition={{ duration: 0.25 }}
            >
              <Card>
                {/* Question type router */}
                {q.type === "single" && (
                  <SingleChoice
                    question={q}
                    onAnswer={handleAnswer}
                    answered={answeredIds.has(q.id)}
                  />
                )}
                {q.type === "multiple" && (
                  <MultipleChoice
                    question={q}
                    onAnswer={handleAnswer}
                    answered={answeredIds.has(q.id)}
                  />
                )}
                {q.type === "card-select" && (
                  <CardSelect
                    question={q}
                    onAnswer={handleAnswer}
                    answered={answeredIds.has(q.id)}
                  />
                )}
                {q.type === "drag-drop" && (
                  <DragDrop
                    question={q}
                    onAnswer={handleAnswer}
                    answered={answeredIds.has(q.id)}
                  />
                )}

                {/* Feedback */}
                {answeredIds.has(q.id) && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className={`mt-6 rounded-xl p-4 border ${
                      answers[q.id]
                        ? "bg-success-light border-success/20"
                        : "bg-danger-light border-danger/20"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      {answers[q.id] ? (
                        <>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-success">
                            <circle cx="12" cy="12" r="10" />
                            <path d="M7.5 12l3 3 6-6" />
                          </svg>
                          <span className="font-semibold text-success">Correct!</span>
                        </>
                      ) : (
                        <>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-danger">
                            <circle cx="12" cy="12" r="10" />
                            <path d="M15 9l-6 6M9 9l6 6" />
                          </svg>
                          <span className="font-semibold text-danger">Not quite</span>
                        </>
                      )}
                    </div>
                    <p className="text-sm text-text-secondary">{q.explanation}</p>
                  </motion.div>
                )}
              </Card>

              {/* Next / Continue */}
              {answeredIds.has(q.id) && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-6 flex items-center justify-between"
                >
                  <div className="flex items-center gap-1.5 text-sm text-warning">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                    </svg>
                    +{answers[q.id] ? q.xpReward : Math.round(q.xpReward * 0.33)} XP
                  </div>
                  <button
                    onClick={nextQuestion}
                    className="rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                  >
                    {current < total - 1 ? "Next Question" : "See Results"}
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="ml-1.5 inline">
                      <path d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                    </svg>
                  </button>
                </motion.div>
              )}
            </motion.div>
          </AnimatePresence>
        </Container>
      </main>
    </div>
  );
}
