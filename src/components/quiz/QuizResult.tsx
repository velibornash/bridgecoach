"use client";

import { motion } from "framer-motion";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import type { QuizResult } from "@/types";

interface QuizResultProps {
  result: QuizResult;
  onRetry: () => void;
  onBack: () => void;
}

export function QuizResultScreen({ result, onRetry, onBack }: QuizResultProps) {
  const grade =
    result.score >= 90 ? "Excellent!" : result.score >= 70 ? "Good job!" : result.score >= 50 ? "Keep practicing!" : "Review the material";

  const gradeColor =
    result.score >= 90 ? "text-success" : result.score >= 70 ? "text-primary" : result.score >= 50 ? "text-warning" : "text-danger";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="max-w-lg mx-auto"
    >
      <Card>
        <div className="flex flex-col items-center text-center py-6">
          {/* Score circle */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.1 }}
            className="relative mb-5"
          >
            <svg width="120" height="120" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="52" fill="none" stroke="#1e293b" strokeWidth="8" />
              <motion.circle
                cx="60" cy="60" r="52"
                fill="none"
                stroke="currentColor"
                strokeWidth="8"
                strokeLinecap="round"
                className={gradeColor}
                initial={{ pathLength: 0 }}
                animate={{ pathLength: result.score / 100 }}
                transition={{ duration: 1, delay: 0.3, ease: "easeOut" }}
                style={{
                  transform: "rotate(-90deg)",
                  transformOrigin: "center",
                }}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className={`text-3xl font-bold ${gradeColor}`}>{result.score}%</span>
            </div>
          </motion.div>

          <h2 className={`text-xl font-bold ${gradeColor}`}>{grade}</h2>
          <p className="mt-1 text-sm text-text-tertiary">
            {result.correctAnswers} of {result.totalQuestions} correct
          </p>

          {/* XP earned */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="mt-4 flex items-center gap-2 rounded-full bg-warning/10 px-4 py-2"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-warning">
              <path d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
            </svg>
            <span className="text-sm font-semibold text-warning">+{result.xpEarned} XP</span>
          </motion.div>

          {/* Stats */}
          <div className="mt-6 grid w-full grid-cols-3 gap-3 border-t border-border pt-5">
            <div className="text-center">
              <p className="text-lg font-bold text-text-primary">{result.totalQuestions}</p>
              <p className="text-[11px] text-text-tertiary">Questions</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-success">{result.correctAnswers}</p>
              <p className="text-[11px] text-text-tertiary">Correct</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-danger">{result.totalQuestions - result.correctAnswers}</p>
              <p className="text-[11px] text-text-tertiary">Wrong</p>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-6 flex w-full gap-3">
            <Button variant="secondary" className="flex-1" onClick={onBack}>
              Back to Quiz
            </Button>
            <Button variant="primary" className="flex-1" onClick={onRetry}>
              Try Again
            </Button>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
