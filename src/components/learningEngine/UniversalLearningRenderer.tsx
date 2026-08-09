"use client";

import { motion } from "framer-motion";
import { BlockRenderer } from "./BlockRenderer";
import { LearningBlock } from "./types";
import { Container } from "@/components/ui/Container";

interface UniversalLearningRendererProps {
  blocks: LearningBlock[];
  completedSections: string[];
  onCompleteSection: (id: string) => void;
}

export function UniversalLearningRenderer({
  blocks,
  completedSections,
  onCompleteSection,
}: UniversalLearningRendererProps) {
  if (!blocks || blocks.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-text-tertiary">No educational blocks found in this lesson.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {blocks.map((block, idx) => {
        const isCompleted = completedSections.includes(block.id);
        return (
          <motion.div
            key={block.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: idx * 0.05 }}
            className="relative"
          >
            {/* Completion indicator vertical timeline line */}
            {idx < blocks.length - 1 && (
              <div 
                className={`absolute left-[13px] top-10 bottom-[-24px] w-0.5 z-0 transition-colors duration-300 ${
                  isCompleted ? "bg-success/40" : "bg-border/60"
                }`} 
              />
            )}

            <div className="relative z-10 flex gap-4 items-start">
              {/* Timeline completion indicator checkbox/icon */}
              {block.type !== "heading" && block.type !== "divider" && (
                <button
                  onClick={() => onCompleteSection(block.id)}
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-300 mt-1 select-none focus:outline-none ${
                    isCompleted
                      ? "border-success bg-success text-white scale-105 shadow-md shadow-success/15"
                      : "border-border bg-bg-card text-text-tertiary hover:border-text-secondary"
                  }`}
                >
                  {isCompleted ? (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <path d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  ) : (
                    <span className="text-[10px] font-bold">{idx + 1}</span>
                  )}
                </button>
              )}

              <div className="flex-1 min-w-0">
                <BlockRenderer
                  block={block}
                  onComplete={onCompleteSection}
                  isCompleted={isCompleted}
                />
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
