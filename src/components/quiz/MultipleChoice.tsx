"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { QuizQuestion } from "@/types";

interface MultipleChoiceProps {
  question: QuizQuestion;
  onAnswer: (correct: boolean, selected: number[]) => void;
  answered: boolean;
}

export function MultipleChoice({ question, onAnswer, answered }: MultipleChoiceProps) {
  const [selected, setSelected] = useState<number[]>([]);

  const toggle = (index: number) => {
    if (answered) return;
    const next = selected.includes(index)
      ? selected.filter((s) => s !== index)
      : [...selected, index];
    setSelected(next);
  };

  const handleSubmit = () => {
    if (answered || selected.length === 0) return;
    const correctSet = new Set(question.correctIndices!);
    const selectedSet = new Set(selected);
    const isCorrect =
      selected.length === question.correctIndices!.length &&
      selected.every((s) => correctSet.has(s));
    onAnswer(isCorrect, selected);
  };

  return (
    <div className="space-y-3">
      {question.options?.map((option, i) => {
        const isCorrectOption = answered && question.correctIndices!.includes(i);
        const isWrongOption = answered && selected.includes(i) && !question.correctIndices!.includes(i);
        const isSelected = selected.includes(i);
        return (
          <button
            key={i}
            onClick={() => toggle(i)}
            className={cn(
              "w-full rounded-xl border px-4 py-3.5 text-left text-sm font-medium transition-all duration-150",
              isCorrectOption && "border-success bg-success-light text-success",
              isWrongOption && "border-danger bg-danger-light text-danger",
              !answered && isSelected && "border-primary/50 bg-primary/5 text-text-primary",
              !answered && !isSelected && "border-border bg-bg-secondary/50 text-text-secondary hover:border-border-hover hover:bg-bg-secondary",
              answered && !isCorrectOption && !isWrongOption && "border-border bg-bg-secondary/30 text-text-tertiary opacity-60"
            )}
          >
            <div className="flex items-center justify-between">
              <span>{option}</span>
              {!answered && isSelected && (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-primary shrink-0">
                  <rect x="3" y="3" width="18" height="18" rx="4" />
                  <path d="M8 12l3 3 5-5" />
                </svg>
              )}
              {!answered && !isSelected && (
                <div className="h-4 w-4 rounded border border-border shrink-0" />
              )}
              {isCorrectOption && (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-success shrink-0">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M7.5 12l3 3 6-6" />
                </svg>
              )}
              {isWrongOption && (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-danger shrink-0">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M15 9l-6 6M9 9l6 6" />
                </svg>
              )}
            </div>
          </button>
        );
      })}

      {!answered && selected.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <button
            onClick={handleSubmit}
            className="w-full rounded-xl bg-primary py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            Submit Answer ({selected.length} selected)
          </button>
        </motion.div>
      )}
    </div>
  );
}
