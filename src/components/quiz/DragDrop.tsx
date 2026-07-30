"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { QuizQuestion } from "@/types";

interface DragDropProps {
  question: QuizQuestion;
  onAnswer: (correct: boolean, matches: Record<string, string>) => void;
  answered: boolean;
}

export function DragDrop({ question, onAnswer, answered }: DragDropProps) {
  const [matches, setMatches] = useState<Record<string, string>>({});
  const [selectedDrag, setSelectedDrag] = useState<string | null>(null);

  const handleDragClick = (id: string) => {
    if (answered) return;
    if (selectedDrag === id) {
      setSelectedDrag(null);
    } else {
      setSelectedDrag(id);
    }
  };

  const handleDropClick = (targetId: string) => {
    if (answered || !selectedDrag) return;
    setMatches((prev) => ({ ...prev, [selectedDrag]: targetId }));
    setSelectedDrag(null);
  };

  const unassign = (dragId: string) => {
    if (answered) return;
    setMatches((prev) => {
      const next = { ...prev };
      delete next[dragId];
      return next;
    });
  };

  const handleSubmit = () => {
    if (answered) return;
    const allMatch = question.dragItems!.every(
      (item) => matches[item.id] === item.targetId
    );
    onAnswer(allMatch, matches);
  };

  const allAssigned = question.dragItems!.every((item) => matches[item.id]);

  return (
    <div className="space-y-5">
      {/* Drop targets */}
      <div className="space-y-2">
        <span className="text-xs font-medium text-text-tertiary uppercase tracking-wider">Drop Zones</span>
        {question.dropTargets?.map((target) => {
          const assigned = question.dragItems!.filter((item) => matches[item.id] === target.id);
          const isHighlighted = selectedDrag !== null;
          return (
            <button
              key={target.id}
              onClick={() => handleDropClick(target.id)}
              disabled={!selectedDrag}
              className={cn(
                "w-full rounded-xl border px-4 py-3 text-left text-sm font-medium transition-all duration-150",
                answered && matches[target.id] === selectedDrag
                  ? "border-success bg-success-light text-success"
                  : isHighlighted
                    ? "border-primary/50 bg-primary/5 text-text-primary"
                    : "border-border bg-bg-secondary/50 text-text-secondary"
              )}
            >
              <div className="flex items-center justify-between">
                <span>{target.label}</span>
                {assigned.length > 0 && (
                  <div className="flex items-center gap-1.5">
                    {assigned.map((item) => (
                      <span
                        key={item.id}
                        onClick={(e) => { e.stopPropagation(); unassign(item.id); }}
                        className={cn(
                          "rounded-md px-2 py-0.5 text-xs font-medium",
                          answered ? "bg-success/20" : "bg-primary/10 text-primary"
                        )}
                      >
                        {item.text}
                        {!answered && (
                          <span className="ml-1 opacity-50">×</span>
                        )}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Drag items */}
      <div className="space-y-2">
        <span className="text-xs font-medium text-text-tertiary uppercase tracking-wider">Items to Match</span>
        <div className="flex flex-wrap gap-2">
          {question.dragItems?.map((item) => {
            const isAssigned = matches[item.id];
            const isSelected = selectedDrag === item.id;
            const correctTarget = answered && matches[item.id] === item.targetId;
            const wrongTarget = answered && matches[item.id] && matches[item.id] !== item.targetId;
            return (
              <button
                key={item.id}
                onClick={() => handleDragClick(item.id)}
                disabled={answered}
                className={cn(
                  "rounded-lg border px-3 py-1.5 text-xs font-medium transition-all duration-150",
                  isSelected && "border-primary bg-primary/10 text-primary ring-1 ring-primary",
                  isAssigned && !answered && "border-border-hover bg-bg-secondary text-text-tertiary",
                  correctTarget && "border-success bg-success-light text-success",
                  wrongTarget && "border-danger bg-danger-light text-danger",
                  !isAssigned && !isSelected && "border-border text-text-secondary hover:border-border-hover hover:bg-bg-secondary",
                  answered && !isAssigned && "opacity-40"
                )}
              >
                {item.text}
              </button>
            );
          })}
        </div>
      </div>

      {/* Submit */}
      {!answered && allAssigned && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <button
            onClick={handleSubmit}
            className="w-full rounded-xl bg-primary py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            Submit Match
          </button>
        </motion.div>
      )}

      {!answered && selectedDrag && (
        <p className="text-xs text-primary text-center">Tap a drop zone above to place "{question.dragItems!.find((d) => d.id === selectedDrag)?.text}"</p>
      )}
    </div>
  );
}
