"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { QuizQuestion } from "@/types";

interface CardSelectProps {
  question: QuizQuestion;
  onAnswer: (correct: boolean, selected: string[]) => void;
  answered: boolean;
}

function suitInfo(card: string) {
  if (card.includes("♠")) return { suit: "♠", color: "text-zinc-300", bg: "bg-zinc-500/10 hover:bg-zinc-500/20" };
  if (card.includes("♥")) return { suit: "♥", color: "text-red-400", bg: "bg-red-500/10 hover:bg-red-500/20" };
  if (card.includes("♦")) return { suit: "♦", color: "text-amber-400", bg: "bg-amber-500/10 hover:bg-amber-500/20" };
  if (card.includes("♣")) return { suit: "♣", color: "text-emerald-400", bg: "bg-emerald-500/10 hover:bg-emerald-500/20" };
  return { suit: "", color: "text-text-secondary", bg: "bg-bg-secondary" };
}

export function CardSelect({ question, onAnswer, answered }: CardSelectProps) {
  const [selected, setSelected] = useState<string[]>([]);
  const maxSelect = 13;

  const toggle = (card: string) => {
    if (answered) return;
    setSelected((prev) =>
      prev.includes(card) ? prev.filter((c) => c !== card) : prev.length < maxSelect ? [...prev, card] : prev
    );
  };

  const correctSet = new Set(question.correctCards!);
  const handleSubmit = () => {
    if (answered || selected.length === 0) return;
    const isCorrect =
      selected.length === question.correctCards!.length &&
      selected.every((c) => correctSet.has(c));
    onAnswer(isCorrect, selected);
  };

  return (
    <div className="space-y-4">
      <div className="text-xs text-text-tertiary">
        Select {question.correctCards!.length} cards for a balanced 16 HCP hand.
        {selected.length > 0 && (
          <span className="ml-1 text-text-secondary">{selected.length} selected</span>
        )}
      </div>

      <div className="grid grid-cols-5 gap-2">
        {question.cardOptions?.map((card, i) => {
          const info = suitInfo(card);
          const isSelected = selected.includes(card);
          const isCorrectCard = answered && correctSet.has(card);
          const isWrongCard = answered && selected.includes(card) && !correctSet.has(card);
          return (
            <button
              key={i}
              onClick={() => toggle(card)}
              className={cn(
                "flex items-center justify-center rounded-lg py-2 text-sm font-mono font-bold transition-all duration-150",
                isCorrectCard && "bg-success/20 text-success ring-1 ring-success",
                isWrongCard && "bg-danger/20 text-danger ring-1 ring-danger",
                !answered && isSelected && "bg-primary/20 text-primary ring-1 ring-primary",
                !answered && !isSelected && "border border-border text-text-secondary opacity-70 hover:opacity-100",
                answered && !isCorrectCard && !isWrongCard && "opacity-30",
                info.color
              )}
            >
              {card}
            </button>
          );
        })}
      </div>

      {!answered && selected.length >= 12 && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <button
            onClick={handleSubmit}
            className="w-full rounded-xl bg-primary py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            Submit Hand ({selected.length} cards)
          </button>
        </motion.div>
      )}
    </div>
  );
}
