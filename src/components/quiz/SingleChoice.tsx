"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import type { QuizQuestion } from "@/types";
import { checkAnswer } from "@/services/quizService";

interface SingleChoiceProps {
  question: QuizQuestion;
  onAnswer: (correct: boolean, index: number) => void;
  answered: boolean;
}

export function SingleChoice({ question, onAnswer, answered }: SingleChoiceProps) {
  const [selected, setSelected] = useState<number | null>(null);
  // The correct index comes from the server, not from the shipped question.
  const [correctIndex, setCorrectIndex] = useState<number | null>(null);

  const handleSelect = async (index: number) => {
    if (answered) return;
    setSelected(index);
    try {
      const verdict = await checkAnswer(question.id, String(index));
      setCorrectIndex(verdict.correctIndex ?? null);
      onAnswer(verdict.correct, index);
    } catch {
      // Network failure: report incorrect rather than silently claiming success.
      onAnswer(false, index);
    }
  };

  return (
    <div className="space-y-3">
      {question.options?.map((option, i) => {
        const isCorrectOption = answered && i === correctIndex;
        const isWrongOption = answered && i === selected && i !== correctIndex;
        return (
          <button
            key={i}
            onClick={() => handleSelect(i)}
            className={cn(
              "w-full rounded-xl border px-4 py-3.5 text-left text-sm font-medium transition-all duration-150",
              isCorrectOption && "border-success bg-success-light text-success",
              isWrongOption && "border-danger bg-danger-light text-danger",
              !answered && selected === i && "border-primary bg-bg-secondary text-text-primary",
              !answered && selected !== i && "border-border bg-bg-secondary/50 text-text-secondary hover:border-border-hover hover:bg-bg-secondary",
              answered && !isCorrectOption && !isWrongOption && "border-border bg-bg-secondary/30 text-text-tertiary opacity-60"
            )}
          >
            <div className="flex items-center justify-between">
              <span>{option}</span>
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
    </div>
  );
}
